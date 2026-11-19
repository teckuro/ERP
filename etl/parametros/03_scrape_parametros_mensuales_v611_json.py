#!/usr/bin/env python3
from __future__ import annotations

import argparse
import copy
import io
import json
import logging
import re
from dataclasses import asdict, dataclass
from datetime import date, datetime
from pathlib import Path
from typing import Any

import pdfplumber
from bs4 import BeautifulSoup

from v611_http import DEFAULT_TIMEOUT, download_bytes, download_text
from v611_parametros_generales_schema import finalize_parametros_generales_compat
from v611_provenance import make_source

try:
    import psycopg  # type: ignore
except Exception:
    psycopg = None

MONTHS_ES = {
    "01": "Enero",
    "02": "Febrero",
    "03": "Marzo",
    "04": "Abril",
    "05": "Mayo",
    "06": "Junio",
    "07": "Julio",
    "08": "Agosto",
    "09": "Septiembre",
    "10": "Octubre",
    "11": "Noviembre",
    "12": "Diciembre",
}
MONTHS_ES_LOWER = {key: value.lower() for key, value in MONTHS_ES.items()}

AFC_COTIZACIONES_URL = "https://www.afc.cl/empleadores/pagos-y-dudas-sobre-cotizaciones/cotizaciones-cuanto-y-como-se-paga/"
AFC_EMPLEADOR_INDEFINIDO_11_ANOS_MAS = 0.8

KNOWN_AFP_NAMES = [
    "Capital",
    "Cuprum",
    "Habitat",
    "Modelo",
    "PlanVital",
    "Provida",
    "Uno",
]


@dataclass
class PeriodoRemuneracion:
    codigo: str
    anio: int
    mes: int
    fecha_inicio: str
    fecha_fin: str
    estado: str = "cargado"


@dataclass
class ParametroLegal:
    nombre: str
    valor_decimal: float | None
    valor_entero: int | None
    vigencia_inicio: str
    vigencia_fin: str | None = None
    periodo: str | None = None


def configure_logging(verbose: bool) -> None:
    logging.basicConfig(
        level=logging.DEBUG if verbose else logging.INFO,
        format="%(levelname)s %(message)s",
    )


def normalize_space(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def parse_chile_number(raw: Any) -> float | None:
    s = normalize_space(raw)
    if not s:
        return None
    s = (
        s.replace("$", "")
        .replace("%", "")
        .replace("UF", "")
        .replace("UTM", "")
        .replace("UTA", "")
        .replace("R.I.", "")
        .replace("R.I", "")
        .replace(" ", "")
    )
    if s.upper() in {"-.-", "-", "EXENTO", "YMÁS", "YMAS"}:
        return None
    if "," in s:
        if "." in s:
            s = s.replace(".", "").replace(",", ".")
        else:
            s = s.replace(",", ".")
    elif "." in s:
        parts = s.split(".")
        if len(parts) > 2 or (len(parts) == 2 and len(parts[1]) == 3 and parts[0].isdigit()):
            s = "".join(parts)
    try:
        return float(s)
    except Exception:
        return None


def parse_chile_int(raw: Any) -> int | None:
    n = parse_chile_number(raw)
    if n is None:
        return None
    return int(round(n))


def month_bounds(periodo: str) -> tuple[str, str]:
    year, month = map(int, periodo.split("-"))
    first = date(year, month, 1)
    if month == 12:
        next_first = date(year + 1, 1, 1)
    else:
        next_first = date(year, month + 1, 1)
    last = next_first.fromordinal(next_first.toordinal() - 1)
    return first.isoformat(), last.isoformat()


def build_periodo(periodo: str) -> PeriodoRemuneracion:
    start, end = month_bounds(periodo)
    year, month = periodo.split("-")
    return PeriodoRemuneracion(
        codigo=periodo,
        anio=int(year),
        mes=int(month),
        fecha_inicio=start,
        fecha_fin=end,
    )


def build_previred_indicadores_url(periodo: str) -> str:
    return build_previred_indicadores_url_candidates(periodo)[0]


def build_previred_indicadores_url_candidates(periodo: str) -> list[str]:
    year, month = periodo.split("-")
    month_name = MONTHS_ES[month]
    month_name_lower = MONTHS_ES_LOWER[month]
    base = f"https://www.previred.com/wp-content/uploads/{year}/{month}/"
    names = [
        f"Indicadores-Previsionales-Previred-{month_name}-{year}.pdf",
        f"Indicadores-Previsionales-Previred-{month_name_lower}-{year}.pdf",
        f"Indicadores-Previsionales-Previred-{month_name}-{year}-V2.pdf",
        f"Indicadores-Previsionales-Previred-{month_name_lower}-{year}-V2.pdf",
        f"Indicadores-Previsionales-Previred-{month_name}-{year}-v2.pdf",
        f"Indicadores-Previsionales-Previred-{month_name_lower}-{year}-v2.pdf",
        f"Indicadores-Previsionales-Previred-{month_name}-{year[-2:]}.pdf",
        f"Indicadores-Previsionales-Previred-{month_name_lower}-{year[-2:]}.pdf",
        f"Indicadores-Previsionales-Previred-{month_name}-{year[-2:]}-V2.pdf",
        f"Indicadores-Previsionales-Previred-{month_name_lower}-{year[-2:]}-V2.pdf",
    ]
    return [base + name for name in names]


def build_sii_impuesto_url(periodo: str) -> str:
    year, _month = periodo.split("-")
    return f"https://www.sii.cl/valores_y_fechas/impuesto_2da_categoria/impuesto{year}_art52.htm"


def extract_pdf_text(pdf_bytes: bytes) -> str:
    chunks: list[str] = []
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for page in pdf.pages:
            txt = page.extract_text() or ""
            if txt:
                chunks.append(txt)
    return "\n".join(chunks)


def html_to_text(html: str) -> str:
    soup = BeautifulSoup(html, "lxml")
    return soup.get_text("\n")


def require_match(text: str, pattern: str, label: str, flags: int = re.I | re.S) -> re.Match[str]:
    m = re.search(pattern, text, flags=flags)
    if not m:
        raise ValueError(f"No pude extraer '{label}' con el patrón: {pattern}")
    return m


def parse_previred_indicadores(periodo: str, url: str | None = None) -> dict[str, Any]:
    urls = [url] if url else build_previred_indicadores_url_candidates(periodo)
    errors: list[str] = []
    selected_url = ""
    pdf_bytes: bytes | None = None
    for candidate_url in urls:
        try:
            logging.info("Descargando: %s", candidate_url)
            pdf_bytes = download_bytes(candidate_url, expect_pdf=True, timeout=DEFAULT_TIMEOUT)
            selected_url = candidate_url
            break
        except Exception as exc:
            errors.append(f"- {candidate_url}: {exc}")
            logging.debug("No se pudo usar PDF PreviRed %s: %s", candidate_url, exc)

    if pdf_bytes is None:
        raise RuntimeError(
            "No se pudo descargar un PDF valido de indicadores PreviRed para el periodo "
            f"{periodo}.\n"
            "Si PreviRed aun no publica el archivo, ejecuta nuevamente mas tarde o usa "
            "--previred-indicadores-url con la URL final publicada.\n"
            "URLs probadas:\n"
            + "\n".join(errors)
        )

    text = extract_pdf_text(pdf_bytes)
    lines = split_lines(text)
    year, month = periodo.split("-")
    month_name = MONTHS_ES[month]

    def line_numbers(line: str) -> list[float]:
        vals: list[float] = []
        for m in re.finditer(r"\$?\s*([\d\.,]+)", line):
            v = parse_chile_number(m.group(1))
            if v is not None:
                vals.append(v)
        return vals

    def money_values(line: str) -> list[float]:
        vals: list[float] = []
        for m in re.finditer(r"\$\s*([\d\.,]+)", line):
            v = parse_chile_number(m.group(1))
            if v is not None:
                vals.append(v)
        return vals

    def first_line_matching(pattern: str, *, require_money: bool = False) -> str | None:
        for ln in lines:
            if re.search(pattern, ln, re.I) and (not require_money or "$" in ln):
                return ln
        return None

    utm_uta_line = first_line_matching(rf"Al\s+\d{{1,2}}\s+de\s+{month_name}\s+del\s+{year}:")
    if not utm_uta_line:
        raise ValueError("No pude extraer UTM/UTA del PDF Previred.")
    utm_uta_vals = money_values(utm_uta_line)
    if len(utm_uta_vals) < 3:
        raise ValueError(f"No pude interpretar UTM/UTA desde la línea: {utm_uta_line}")
    uf, utm, uta = utm_uta_vals[0], utm_uta_vals[1], utm_uta_vals[2]

    uf_prev_line = first_line_matching(r"Al\s+\d{1,2}\s+de\s+\w+\s+del\s+\d{4}:")
    uf_prev_vals = money_values(uf_prev_line or "")
    if uf_prev_line == utm_uta_line:
        uf_prev_line = next((ln for ln in lines if ln != utm_uta_line and re.search(r"Al\s+\d{1,2}\s+de\s+\w+\s+del\s+\d{4}:", ln, re.I)), None)
        uf_prev_vals = money_values(uf_prev_line or "")
    if not uf_prev_vals:
        raise ValueError("No pude extraer UF del mes anterior desde el PDF Previred.")
    uf_mes_anterior = uf_prev_vals[0]

    afp_line = first_line_matching(r"Para afiliados a una AFP", require_money=True)
    inp_line = first_line_matching(r"Para afiliados a(?:l| un) INP", require_money=True)
    afc_line = first_line_matching(r"Para Seguro de Cesant[ií]a", require_money=True)
    if not afp_line or not inp_line or not afc_line:
        raise ValueError("No pude extraer topes UF desde el PDF Previred.")
    m_afp = require_match(afp_line, r"\(?\s*([\d\.,]+)\s*UF\)?", "tope AFP UF")
    m_inp = require_match(inp_line, r"\(?\s*([\d\.,]+)\s*UF\)?", "tope INP UF")
    m_afc = require_match(afc_line, r"\(?\s*([\d\.,]+)\s*UF\)?", "tope AFC UF")
    tope_afp_uf = parse_chile_number(m_afp.group(1))
    tope_inp_uf = parse_chile_number(m_inp.group(1))
    tope_afc_uf = parse_chile_number(m_afc.group(1))
    afp_money = money_values(afp_line)
    inp_money = money_values(inp_line)
    afc_money = money_values(afc_line)
    sueldo_no_rem_money = money_values(first_line_matching(r"Para fines no remuneracionales") or "")
    if len(afp_money) < 2 or len(inp_money) < 2 or len(afc_money) < 2 or not sueldo_no_rem_money:
        raise ValueError("No pude interpretar topes o rentas mínimas desde el PDF Previred.")
    tope_afp_pesos, sueldo_minimo = afp_money[0], afp_money[1]
    tope_inp_pesos, sueldo_minimo_18_65 = inp_money[0], inp_money[1]
    tope_afc_pesos, sueldo_minimo_tpc = afc_money[0], afc_money[1]
    sueldo_minimo_no_rem = sueldo_no_rem_money[0]

    sis = None
    # 1) Etiqueta explícita en la misma línea, p. ej.
    #    "Seguro de Invalidez y Sobrevivencia (SIS) (*) 2,00%" o "Tasa SIS 2,00%".
    #    [^\n%] evita saltar de línea o tomar un porcentaje anterior.
    m_label = re.search(
        r"(?:Seguro de Invalidez y Sobrevivencia\s*\(SIS\)|Tasa\s+SIS)[^\n%]*?(?<![\d.,])(\d,\d{1,2})\s?%",
        text,
        re.IGNORECASE,
    )
    if m_label:
        sis = parse_chile_number(m_label.group(1))
    # 2) Tabla de AFP con columna SIS (formato con >= 5 porcentajes por fila).
    if sis is None:
        for afp_name in KNOWN_AFP_NAMES:
            ln = first_line_matching(rf"^{re.escape(afp_name)}\b")
            if not ln:
                continue
            percs = [parse_chile_number(x) for x in re.findall(r"([\d\.,]+)%", ln)]
            percs = [x for x in percs if x is not None]
            if len(percs) >= 5:
                sis = percs[-1]
                break
    # 3) Respaldo: primer porcentaje d,dd% aislado (el SIS ha estado entre 1% y 3%).
    if sis is None:
        m_sis = re.search(r"(?<![\d.,])([1-3],\d{2})\s?%(?![\d.,])", text)
        sis = parse_chile_number(m_sis.group(1)) if m_sis else None

    afc_tpc_empleador = None
    try:
        m_afc_ind = require_match(
            text,
            r"Plazo Indefinido\s+([\d\.,]+)%\s*R\.I\.?\s*([\d\.,]+)%\s*R\.I\.",
            "AFC indefinido",
        )
        afc_ind_empleador = parse_chile_number(m_afc_ind.group(1))
        afc_ind_trabajador = parse_chile_number(m_afc_ind.group(2))
        afc_plazo_empleador = parse_chile_number(
            require_match(text, r"Plazo Fijo\s+([\d\.,]+)%\s*R\.I\.?\s*-", "AFC plazo fijo").group(1)
        )
        m_afc_tpc = re.search(
            r"Trabajador(?:es)? de Casa Particular.*?([\d\.,]+)%\s*R\.I\.?\s*-",
            text,
            re.I | re.S,
        )
        afc_tpc_empleador = parse_chile_number(m_afc_tpc.group(1)) if m_afc_tpc else None
    except Exception:
        ri_lines = [ln for ln in lines if 'R.I' in ln]
        afc_ind_empleador = afc_ind_trabajador = afc_plazo_empleador = None
        for ln in ri_lines:
            percs = [parse_chile_number(x) for x in re.findall(r"([\d\.,]+)%", ln)]
            percs = [x for x in percs if x is not None]
            if len(percs) == 2 and afc_ind_empleador is None:
                afc_ind_empleador, afc_ind_trabajador = percs[0], percs[1]
            elif len(percs) == 1 and afc_plazo_empleador is None and '-' in ln:
                afc_plazo_empleador = percs[0]
            if afc_ind_empleador is not None and afc_ind_trabajador is not None and afc_plazo_empleador is not None:
                break
        tpc_line = first_line_matching(r"Trabajador(?:es)? de Casa Particular")
        if tpc_line:
            percs = [parse_chile_number(x) for x in re.findall(r"([\d\.,]+)%", tpc_line)]
            percs = [x for x in percs if x is not None]
            afc_tpc_empleador = percs[0] if percs else None
    if afc_tpc_empleador is None:
        afc_tpc_empleador = afc_plazo_empleador

    m_ccaf = re.search(r"CCAF\s+([\d\.,]+)%", text, re.I) or re.search(r"(?<![\d.,])(4(?:,0+)?)%(?![\d.,])", text)
    m_fonasa = re.search(r"FONASA\s+([\d\.,]+)%", text, re.I) or re.search(r"(?<![\d.,])(2(?:,0+)?)%(?![\d.,])", text)
    salud_ccaf = parse_chile_number(m_ccaf.group(1)) if m_ccaf else 4.0
    salud_fonasa = parse_chile_number(m_fonasa.group(1)) if m_fonasa else 2.0
    salud_total = (
        round(salud_ccaf + salud_fonasa, 4)
        if salud_ccaf is not None and salud_fonasa is not None
        else None
    )

    tope_apv_mensual_uf = 50.0
    tope_apv_anual_uf = 600.0
    tope_deposito_convenido_anual_uf = 900.0
    tope_apv_mensual_pesos = round((uf or 0) * tope_apv_mensual_uf, 2) if uf is not None else None
    tope_apv_anual_pesos = round((uf or 0) * tope_apv_anual_uf, 2) if uf is not None else None
    tope_deposito_convenido_anual_pesos = round((uf or 0) * tope_deposito_convenido_anual_uf, 2) if uf is not None else None

    tramo_a = re.search(r"1\s*\(A\)\s*\$\s*([\d\.,]+)\s*Renta\s*<\s*[óo]?\s*=\s*\$\s*([\d\.,]+)", text, re.I)
    tramo_b = re.search(r"2\s*\(B\)\s*\$\s*([\d\.,]+)\s*Renta\s*>\s*\$\s*([\d\.,]+)\s*<\s*=\s*\$\s*([\d\.,]+)", text, re.I)
    tramo_c = re.search(r"3\s*\(C\)\s*\$\s*([\d\.,]+)\s*Renta\s*>\s*\$\s*([\d\.,]+)\s*<\s*=\s*\$\s*([\d\.,]+)", text, re.I)
    tramo_d = re.search(r"4\s*\(D\)\s*-\s*Renta\s*>\s*\$\s*([\d\.,]+)", text, re.I)
    if not tramo_a or not tramo_b or not tramo_c or not tramo_d:
        raise ValueError("No pude extraer tramos de asignación familiar desde el PDF Previred.")
    tramo_carga = [
        {"periodo": periodo, "desde": 0, "hasta": parse_chile_int(tramo_a.group(2)), "valor": parse_chile_int(tramo_a.group(1)), "tramo": "A"},
        {"periodo": periodo, "desde": parse_chile_int(tramo_b.group(2)), "hasta": parse_chile_int(tramo_b.group(3)), "valor": parse_chile_int(tramo_b.group(1)), "tramo": "B"},
        {"periodo": periodo, "desde": parse_chile_int(tramo_c.group(2)), "hasta": parse_chile_int(tramo_c.group(3)), "valor": parse_chile_int(tramo_c.group(1)), "tramo": "C"},
        {"periodo": periodo, "desde": parse_chile_int(tramo_d.group(1)), "hasta": None, "valor": 0, "tramo": "D"},
    ]

    afc_parametro = [
        {
            "codigo_tipo_contrato": "INDEFINIDO",
            "aplica_seguro": True,
            "aplica_trabajador": True,
            "tasa_trabajador": afc_ind_trabajador,
            "tasa_empleador": afc_ind_empleador,
            "observacion": "Carga mensual separada v6.11",
        },
        {
            "codigo_tipo_contrato": "PLAZO_FIJO",
            "aplica_seguro": True,
            "aplica_trabajador": False,
            "tasa_trabajador": 0.0,
            "tasa_empleador": afc_plazo_empleador,
            "observacion": "Carga mensual separada v6.11",
        },
        {
            "codigo_tipo_contrato": "OBRA_SERVICIO",
            "aplica_seguro": True,
            "aplica_trabajador": False,
            "tasa_trabajador": 0.0,
            "tasa_empleador": afc_plazo_empleador,
            "observacion": "Carga mensual separada v6.11",
        },
        {
            "codigo_tipo_contrato": "CASA_PARTICULAR",
            "aplica_seguro": True,
            "aplica_trabajador": False,
            "tasa_trabajador": 0.0,
            "tasa_empleador": afc_tpc_empleador,
            "observacion": "Carga mensual separada v6.11",
        },
    ]

    return {
        "source_url": selected_url,
        "params": {
            "UF": uf,
            "UF_MES_ANTERIOR": uf_mes_anterior,
            "UTM": utm,
            "UTA": uta,
            "SIS": sis,
            "TOPE_AFP_UF": tope_afp_uf,
            "TOPE_AFP_PESOS": tope_afp_pesos,
            "TOPE_INP_UF": tope_inp_uf,
            "TOPE_INP_PESOS": tope_inp_pesos,
            "TOPE_AFC_UF": tope_afc_uf,
            "TOPE_AFC_PESOS": tope_afc_pesos,
            "SUELDO_MINIMO": sueldo_minimo,
            "SUELDO_MINIMO_18_65": sueldo_minimo_18_65,
            "SUELDO_MINIMO_TPC": sueldo_minimo_tpc,
            "SUELDO_MINIMO_NO_REM": sueldo_minimo_no_rem,
            "SALUD_CCAF": salud_ccaf,
            "SALUD_FONASA": salud_fonasa,
            "SALUD_OBLIGATORIA": salud_total,
            "SALUD_FONASA_CON_CCAF": salud_total,
            "AFC_EMPLEADOR_INDEFINIDO_11_ANOS_MAS": AFC_EMPLEADOR_INDEFINIDO_11_ANOS_MAS,
            "TOPE_APV_MENSUAL_UF": tope_apv_mensual_uf,
            "TOPE_APV_MENSUAL_PESOS": tope_apv_mensual_pesos,
            "TOPE_APV_ANUAL_UF": tope_apv_anual_uf,
            "TOPE_APV_ANUAL_PESOS": tope_apv_anual_pesos,
            "TOPE_DEPOSITO_CONVENIDO_ANUAL_UF": tope_deposito_convenido_anual_uf,
            "TOPE_DEPOSITO_CONVENIDO_ANUAL_PESOS": tope_deposito_convenido_anual_pesos,
        },
        "afc_parametro": afc_parametro,
        "tramo_carga": tramo_carga,
    }

def split_lines(text: str) -> list[str]:
    return [normalize_space(x) for x in text.splitlines() if normalize_space(x)]


def month_section(lines: list[str], month_title: str) -> list[str]:
    try:
        start = next(i for i, line in enumerate(lines) if line == month_title)
    except StopIteration:
        raise ValueError(f"No encontré la sección '{month_title}' en la página SII.")
    month_headers = {f"{m} {y}" for y in range(2020, 2035) for m in MONTHS_ES.values()}
    end = len(lines)
    for i in range(start + 1, len(lines)):
        if lines[i] in month_headers:
            end = i
            break
    return lines[start:end]


def parse_sii_impuesto_unico(periodo: str, url: str | None = None) -> dict[str, Any]:
    url = url or build_sii_impuesto_url(periodo)
    logging.info("Descargando: %s", url)
    html = download_text(url, encoding="utf-8", timeout=DEFAULT_TIMEOUT)
    text = html_to_text(html)
    lines = split_lines(text)

    year, month = periodo.split("-")
    month_title = f"{MONTHS_ES[month]} {year}"
    block = month_section(lines, month_title)

    try:
        m_idx = next(i for i, line in enumerate(block) if line.upper() == "MENSUAL")
    except StopIteration:
        raise ValueError(f"No encontré el bloque MENSUAL para {month_title} en SII.")

    monthly_lines: list[str] = []
    for line in block[m_idx + 1 :]:
        upper = line.upper()
        if upper in {"QUINCENAL", "SEMANAL", "DIARIO"}:
            break
        monthly_lines.append(line)

    rows: list[dict[str, Any]] = []
    tramo = 1
    i = 0

    # tramo exento
    if i + 4 < len(monthly_lines) and monthly_lines[i] == "-.-" and monthly_lines[i + 2].upper().startswith("EXENTO"):
        rows.append(
            {
                "tramo": tramo,
                "desde": 0.0,
                "hasta": parse_chile_number(monthly_lines[i + 1]),
                "factor": 0.0,
                "rebaja": 0.0,
            }
        )
        tramo += 1
        i += 5

    # tramos afectos
    while i + 4 < len(monthly_lines):
        if not monthly_lines[i].startswith("$"):
            i += 1
            continue
        desde = parse_chile_number(monthly_lines[i])
        hasta = None if monthly_lines[i + 1].upper().startswith("Y MÁS") else parse_chile_number(monthly_lines[i + 1])
        factor = parse_chile_number(monthly_lines[i + 2])
        rebaja = parse_chile_number(monthly_lines[i + 3])
        if desde is None or factor is None or rebaja is None:
            i += 1
            continue
        rows.append(
            {
                "tramo": tramo,
                "desde": desde,
                "hasta": hasta,
                "factor": factor,
                "rebaja": rebaja,
            }
        )
        tramo += 1
        i += 5

    if not rows:
        raise ValueError(f"No pude extraer tabla mensual de impuesto único para {month_title}.")

    return {"source_url": url, "tabla_impuesto_unico": rows}


def build_parametros_legales(
    previred_data: dict[str, Any], vigencia_inicio: str, periodo_codigo: str
) -> list[ParametroLegal]:
    params = previred_data["params"]
    ordered_names = [
        "UF",
        "UF_MES_ANTERIOR",
        "UTM",
        "UTA",
        "SIS",
        "TOPE_AFP_UF",
        "TOPE_AFP_PESOS",
        "TOPE_INP_UF",
        "TOPE_INP_PESOS",
        "TOPE_AFC_UF",
        "TOPE_AFC_PESOS",
        "SUELDO_MINIMO",
        "SUELDO_MINIMO_18_65",
        "SUELDO_MINIMO_TPC",
        "SUELDO_MINIMO_NO_REM",
        "SALUD_CCAF",
        "SALUD_FONASA",
        "SALUD_OBLIGATORIA",
        "SALUD_FONASA_CON_CCAF",
        "AFC_EMPLEADOR_INDEFINIDO_11_ANOS_MAS",
        "TOPE_APV_MENSUAL_UF",
        "TOPE_APV_MENSUAL_PESOS",
        "TOPE_APV_ANUAL_UF",
        "TOPE_APV_ANUAL_PESOS",
        "TOPE_DEPOSITO_CONVENIDO_ANUAL_UF",
        "TOPE_DEPOSITO_CONVENIDO_ANUAL_PESOS",
    ]
    result: list[ParametroLegal] = []
    for name in ordered_names:
        value = params.get(name)
        if value is None:
            continue
        if name.endswith("_PESOS") or name in {
            "UTM",
            "UTA",
            "SUELDO_MINIMO",
            "SUELDO_MINIMO_18_65",
            "SUELDO_MINIMO_TPC",
            "SUELDO_MINIMO_NO_REM",
        }:
            result.append(
                ParametroLegal(
                    nombre=name,
                    valor_decimal=None,
                    valor_entero=int(round(value)),
                    vigencia_inicio=vigencia_inicio,
                    vigencia_fin=None,
                    periodo=periodo_codigo,
                )
            )
        else:
            result.append(
                ParametroLegal(
                    nombre=name,
                    valor_decimal=float(value),
                    valor_entero=None,
                    vigencia_inicio=vigencia_inicio,
                    vigencia_fin=None,
                    periodo=periodo_codigo,
                )
            )
    return result


def load_json(path: Path | None) -> dict[str, Any]:
    if not path or not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def build_afp_updates(struct_seed: dict[str, Any], vigencia_inicio: str, sis: float | None, tope_afp_uf: float | None) -> list[dict[str, Any]]:
    afps = struct_seed.get("afp", []) if isinstance(struct_seed, dict) else []
    names: list[str] = []
    for item in afps:
        name = normalize_space(item.get("nombre"))
        if name:
            names.append(name)
    if not names:
        names = KNOWN_AFP_NAMES[:]
    updates = []
    for name in names:
        updates.append(
            {
                "afp_nombre": name,
                "vigencia_inicio": vigencia_inicio,
                "sis": sis,
                "tope_imponible_uf": tope_afp_uf,
            }
        )
    return updates


def build_tramo_impuesto_compat(periodo: str, tabla_impuesto_unico: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rows = []
    for r in tabla_impuesto_unico:
        rows.append(
            {
                "periodo": periodo,
                "desde": r["desde"],
                "hasta": r["hasta"],
                "factor": r["factor"],
                "rebaja": r["rebaja"],
            }
        )
    return rows


def build_parametros_generales_compat(periodo: str, previred_data: dict[str, Any]) -> dict[str, Any]:
    p = previred_data["params"]
    return {
        "periodo": periodo,
        "uf": p.get("UF"),
        "utm": parse_chile_int(p.get("UTM")),
        "uta": parse_chile_int(p.get("UTA")),
        "sueldo_minimo": parse_chile_int(p.get("SUELDO_MINIMO")),
        "sueldo_minimo18_65": parse_chile_int(p.get("SUELDO_MINIMO_18_65")),
        # El PDF mensual no trae fila dedicada; dejar NULL (completar en ERP o ampliar parser).
        "sueldo_minimo_menor18_mayor65": parse_chile_int(p.get("SUELDO_MINIMO_MENOR18_MAYOR65")),
        "sueldo_minimo_casa_particular": parse_chile_int(p.get("SUELDO_MINIMO_TPC")),
        "ingreso_minimo_no_remuneracional": parse_chile_int(p.get("SUELDO_MINIMO_NO_REM")),
        "gratificacion": True,
        "imm_gratificacion": 4.75,
        "tope_afp_uf": p.get("TOPE_AFP_UF"),
        "tope_afp": parse_chile_int(p.get("TOPE_AFP_PESOS")),
        "tope_ips_uf": p.get("TOPE_INP_UF"),
        "tope_ips": parse_chile_int(p.get("TOPE_INP_PESOS")),
        "tope_cesantia_uf": p.get("TOPE_AFC_UF"),
        "tope_cesantia": parse_chile_int(p.get("TOPE_AFC_PESOS")),
        "tope_apv_mensual_uf": p.get("TOPE_APV_MENSUAL_UF"),
        "tope_apv_mensual": parse_chile_int(p.get("TOPE_APV_MENSUAL_PESOS")),
        "tope_apv_anual_uf": p.get("TOPE_APV_ANUAL_UF"),
        "tope_apv_anual": parse_chile_int(p.get("TOPE_APV_ANUAL_PESOS")),
        "tope_deposito_convenido_anual_uf": p.get("TOPE_DEPOSITO_CONVENIDO_ANUAL_UF"),
        "tope_deposito_convenido_anual": parse_chile_int(p.get("TOPE_DEPOSITO_CONVENIDO_ANUAL_PESOS")),
        "tope_afpvoluntario": parse_chile_int(p.get("TOPE_APV_MENSUAL_PESOS")),
        "sis": p.get("SIS"),
        "sanna": p.get("SANNA"),
        "salud_obligatoria": p.get("SALUD_OBLIGATORIA"),
        "salud_ccaf": p.get("SALUD_CCAF"),
        "salud_fonasa_con_ccaf": p.get("SALUD_FONASA_CON_CCAF"),
        "dsctosbpordia": True,
        "afc_trabajador_indefinido": previred_data["afc_parametro"][0]["tasa_trabajador"],
        "afc_empleador_indefinido": previred_data["afc_parametro"][0]["tasa_empleador"],
        "afc_empleador_plazo": previred_data["afc_parametro"][1]["tasa_empleador"],
    }


def merge_seed_fase2(base_seed: dict[str, Any], payload: dict[str, Any]) -> dict[str, Any]:
    merged = copy.deepcopy(base_seed)
    updates = {
        (normalize_space(item["afp_nombre"]).lower(), item["vigencia_inicio"]): item
        for item in payload.get("afp_vigencia_updates", [])
    }
    for item in merged.get("afp_vigencia", []):
        key = (normalize_space(item.get("afp_nombre")).lower(), item.get("vigencia_inicio"))
        upd = updates.get(key)
        if upd:
            item["sis"] = upd.get("sis")
            item["tope_imponible_uf"] = upd.get("tope_imponible_uf")
    merged["parametros_legales"] = payload.get("parametros_legales", [])
    merged["tramo_carga"] = payload.get("tramo_carga", [])
    merged["tabla_impuesto_unico"] = payload.get("tabla_impuesto_unico", [])
    merged["parametros_generales_compat"] = payload.get("parametros_generales_compat")
    merged["metadata_phase2"] = payload.get("metadata", {})
    return merged


def sql_literal(value: Any) -> str:
    if value is None:
        return "NULL"
    if isinstance(value, bool):
        return "TRUE" if value else "FALSE"
    if isinstance(value, (int, float)):
        return str(value)
    return "'" + str(value).replace("'", "''") + "'"



REQUIRED_COLLECTIONS = {
    "parametros_legales": 10,
    "afc_parametro": 1,
    "tramo_carga": 1,
    "tabla_impuesto_unico": 1,
    "tramo_impuesto_compat": 1,
}


def validate_payload(payload: dict[str, Any], *, require_afp_updates: bool = False) -> list[str]:
    """Valida que el JSON mensual venga completo antes de entregarlo al render."""
    errors: list[str] = []

    periodo = payload.get("periodo_remuneracion")
    if not isinstance(periodo, dict):
        errors.append("Falta periodo_remuneracion.")
    else:
        for key in ["codigo", "anio", "mes", "fecha_inicio", "fecha_fin", "estado"]:
            if periodo.get(key) in (None, ""):
                errors.append(f"periodo_remuneracion.{key} está vacío.")

    if not isinstance(payload.get("parametros_generales_compat"), dict):
        errors.append("Falta parametros_generales_compat.")

    for key, min_rows in REQUIRED_COLLECTIONS.items():
        value = payload.get(key)
        if not isinstance(value, list):
            errors.append(f"{key} debe ser una lista.")
            continue
        if len(value) < min_rows:
            errors.append(f"{key} viene vacío o incompleto. Filas: {len(value)}.")

    afp_updates = payload.get("afp_vigencia_updates", [])
    if require_afp_updates and not afp_updates:
        errors.append("afp_vigencia_updates viene vacío. Entrega --seed-base-json para generar actualizaciones AFP.")

    return errors


def build_payload(args: argparse.Namespace) -> dict[str, Any]:
    periodo = build_periodo(args.periodo)
    vigencia_inicio = periodo.fecha_inicio

    previred_data = parse_previred_indicadores(args.periodo, args.previred_indicadores_url)
    sii_data = parse_sii_impuesto_unico(args.periodo, args.sii_impuesto_url)

    struct_seed = load_json(Path(args.seed_base_json) if args.seed_base_json else None)
    afp_updates = build_afp_updates(
        struct_seed,
        vigencia_inicio,
        previred_data["params"].get("SIS"),
        previred_data["params"].get("TOPE_AFP_UF"),
    )

    afc_rows: list[dict[str, Any]] = []
    for row in previred_data["afc_parametro"]:
        r = dict(row)
        r["vigencia_inicio"] = vigencia_inicio
        r["vigencia_fin"] = None
        r["periodo"] = args.periodo
        afc_rows.append(r)

    tabla_impuesto: list[dict[str, Any]] = []
    for row in sii_data["tabla_impuesto_unico"]:
        r = dict(row)
        r["vigencia_inicio"] = vigencia_inicio
        r["vigencia_fin"] = None
        tabla_impuesto.append(r)

    parametros_legales = [
        asdict(x) for x in build_parametros_legales(previred_data, vigencia_inicio, args.periodo)
    ]
    parametros_generales_compat = finalize_parametros_generales_compat(
        build_parametros_generales_compat(args.periodo, previred_data),
        parametros_legales=parametros_legales,
    )

    source_status = {
        "previred_indicadores": make_source(
            "previred_indicadores",
            status="scraped",
            url=previred_data["source_url"],
            ok=True,
        ),
        "sii_impuesto": make_source(
            "sii_impuesto",
            status="scraped",
            url=sii_data["source_url"],
            ok=True,
        ),
        "afc_cotizaciones": make_source(
            "afc_cotizaciones",
            status="scraped",
            url=AFC_COTIZACIONES_URL,
            detail="Referencia AFC; tasas principales vienen de PreviRed",
            ok=True,
        ),
    }

    return {
        "periodo_remuneracion": asdict(periodo),
        "parametros_legales": parametros_legales,
        "parametros_generales_compat": parametros_generales_compat,
        "afc_parametro": afc_rows,
        "tramo_carga": previred_data["tramo_carga"],
        "tabla_impuesto_unico": tabla_impuesto,
        "tramo_impuesto_compat": build_tramo_impuesto_compat(args.periodo, tabla_impuesto),
        "afp_vigencia_updates": afp_updates,
        "metadata": {
            "periodo_origen": args.periodo,
            "previred_indicadores_url": previred_data["source_url"],
            "afc_cotizaciones_url": AFC_COTIZACIONES_URL,
            "sii_impuesto_url": sii_data["source_url"],
            "seed_base_json": args.seed_base_json,
            "generated_at": datetime.now().isoformat(),
            "script_version": "mensual_v3_json_only",
            "responsabilidad": "scraper_json_only",
            "source_status": source_status,
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Scraper mensual v6.11: descarga PreviRed/SII y genera SOLO JSON normalizado. No genera SQL ni aplica en BD."
    )
    parser.add_argument("--periodo", required=True, help="Periodo remuneración YYYY-MM, por ejemplo 2026-04")
    parser.add_argument("--out-dir", default="./out_parametros_v611")
    parser.add_argument("--seed-base-json", help="Ruta al seed estructural v4. Recomendado para afp_vigencia_updates.")
    parser.add_argument("--previred-indicadores-url", help="Sobrescribe URL del PDF mensual PreviRed")
    parser.add_argument("--sii-impuesto-url", help="Sobrescribe URL SII impuesto único")
    parser.add_argument("--require-afp-updates", action="store_true", help="Falla si no se pueden generar actualizaciones AFP desde seed-base-json")
    parser.add_argument("--verbose", action="store_true")
    args = parser.parse_args()

    configure_logging(args.verbose)
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    payload = build_payload(args)
    errors = validate_payload(payload, require_afp_updates=args.require_afp_updates)
    if errors:
        for error in errors:
            logging.error(error)
        raise SystemExit("JSON mensual incompleto; no se generó salida confiable.")

    periodo = payload["periodo_remuneracion"]["codigo"]
    period_json_path = out_dir / f"parametros_mensuales_{periodo}_v611.json"
    compat_json_path = out_dir / "parametros_mensuales_v611.json"
    manifest_path = out_dir / f"manifest_parametros_mensuales_{periodo}_v611.json"

    json_text = json.dumps(payload, ensure_ascii=False, indent=2) + "\n"
    period_json_path.write_text(json_text, encoding="utf-8")
    compat_json_path.write_text(json_text, encoding="utf-8")

    manifest = {
        "periodo": periodo,
        "json_periodo": str(period_json_path),
        "json_compat": str(compat_json_path),
        "secciones": {
            "parametros_legales": len(payload.get("parametros_legales", [])),
            "afc_parametro": len(payload.get("afc_parametro", [])),
            "tramo_carga": len(payload.get("tramo_carga", [])),
            "tabla_impuesto_unico": len(payload.get("tabla_impuesto_unico", [])),
            "tramo_impuesto_compat": len(payload.get("tramo_impuesto_compat", [])),
            "afp_vigencia_updates": len(payload.get("afp_vigencia_updates", [])),
        },
        "nota": "Este scraper no genera SQL. Ejecuta render_parametros_mensuales_v611_sql.py sobre json_periodo.",
    }
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    logging.info("JSON mensual generado: %s", period_json_path)
    logging.info("Copia compatible generada: %s", compat_json_path)
    logging.info("Manifest generado: %s", manifest_path)
    print(period_json_path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
