
#!/usr/bin/env python3
"""
Scraping + normalización para semillas iniciales de tu SQL v6.11.

Genera datos normalizados y un archivo SQL con UPSERTs para:
- afp
- afp_vigencia
- salud
- entidad_previsional_ips
- ex_caja_previsional
- regimen_ex_caja
- tipo_movimiento
- motivo_inasistencia (semilla controlada)
- concepto (semilla controlada)

Fuentes:
- Superintendencia de Pensiones (comisiones AFP, XLS histórico)
- PreviRed Tablas de Equivalencia (PDF)
- Superintendencia de Salud (directorio de Isapres) [opcional, validación]
- Fonasa (7% legal) [referencia normativa, no scraping estructural]

Requisitos:
    pip install requests pandas beautifulsoup4 lxml pdfplumber openpyxl xlrd

Uso:
    python scrape_semillas_v611.py --out-dir ./out

Opcional:
    python scrape_semillas_v611.py \
      --dsn "postgresql://user:pass@host:5432/dbname" \
      --apply

Notas:
- Para AFP, el XLS de la Superintendencia trae una serie histórica; el script
  intenta detectar encabezados de forma heurística y se queda con la vigencia más reciente.
- Para SIS y tope imponible UF, el script intenta enriquecer desde un PDF de
  Indicadores Previsionales de PreviRed. Si no logra extraerlos, deja NULL/0.
- motivo_inasistencia y concepto quedan como seed controlado interno, porque no
  existe una fuente pública única que coincida 1:1 con tu ERP.
"""

from __future__ import annotations

import argparse
import io
import json
import logging
import os
import re
import sys
from dataclasses import dataclass, asdict
from datetime import date, datetime
from pathlib import Path
from typing import Any, Iterable

import pandas as pd
import pdfplumber
import requests
from bs4 import BeautifulSoup

try:
    import psycopg  # type: ignore
except Exception:
    psycopg = None


# ============================================================================
# Config
# ============================================================================

DEFAULT_SP_XLS_URL = "https://www.spensiones.cl/inf_estadistica/series_afp/comisiones/estructura_comisiones.xls"
DEFAULT_PREVIRED_EQUIV_URL = "https://www.previred.com/wp-content/uploads/2025/10/TablasEquivalenciaSeptiembre2025.pdf"
DEFAULT_PREVIRED_INDICADORES_URL = "https://www.previred.com/wp-content/uploads/2026/01/Indicadores-Previsionales-Previred-Enero-2026.pdf"
DEFAULT_SUPERSALUD_ISAPRES_URL = "https://www.superdesalud.gob.cl/registro/isapres/"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/123.0 Safari/537.36"
    )
}

AFP_CODE_MAP = {
    "CUPRUM": "03",
    "HABITAT": "05",
    "PROVIDA": "08",
    "PLANVITAL": "29",
    "PLAN VITAL": "29",
    "CAPITAL": "33",
    "MODELO": "34",
    "UNO": "35",
}

AFP_CANONICAL_NAMES = {
    "CUPRUM": "Cuprum",
    "HABITAT": "Habitat",
    "PROVIDA": "Provida",
    "PLANVITAL": "PlanVital",
    "PLAN VITAL": "PlanVital",
    "CAPITAL": "Capital",
    "MODELO": "Modelo",
    "UNO": "Uno",
}

AFP_EXPECTED_ORDER = ["03", "05", "08", "29", "33", "34", "35"]

AFP_MANUAL_FALLBACKS_BY_PERIOD = {
    # Safety net solo cuando el XLS/SP no entrega una AFP esperada.
    # Revisar periódicamente si cambian las comisiones publicadas.
    "2026-04": {
        "PLANVITAL": 1.16,
    },
}

MOVIMIENTO_PERSONAL_MAP = {
    0: "Sin Movimiento en el Mes",
    1: "Contratación a plazo indefinido",
    2: "Retiro",
    3: "Subsidios",
    4: "Permiso Sin Goce de Sueldos",
    5: "Incorporación en el Lugar de Trabajo",
    6: "Accidentes del Trabajo",
    7: "Contratación a plazo fijo",
    8: "Cambio Contrato plazo fijo a plazo indefinido",
    11: "Otros Movimientos (Ausentismos)",
    12: "Reliquidación, premio o bono posterior al finiquito",
}

SALUD_CANONICAL_MAP = {
    "FONASA": "Fonasa",
    "BANMEDICA": "Banmédica",
    "BANMÉDICA": "Banmédica",
    "CONSALUD": "Consalud",
    "VIDATRES": "Vida Tres",
    "VIDA TRES": "Vida Tres",
    "COLMENA": "Colmena",
    "COLMENA GOLDEN CROSS": "Colmena",
    "CRUZ BLANCA": "Cruz Blanca",
    "NUEVA MASVIDA": "Nueva Masvida",
    "MASVIDA": "Nueva Masvida",
    "ISALUD": "Isalud",
    "FUNDACION": "Fundación",
    "FUNDACIÓN": "Fundación",
    "CRUZ DEL NORTE": "Cruz del Norte",
    "ESENCIAL": "Esencial",
    "SIN ISAPRE": "Sin Isapre",
}

KNOWN_ISAPRE_NAMES = [
    "Banmédica",
    "Colmena",
    "Consalud",
    "Cruz Blanca",
    "Cruz del Norte",
    "Esencial",
    "Fundación",
    "Isalud",
    "Nueva Masvida",
    "Vida Tres",
]

EXPECTED_SALUD_CODES = {"00", "01", "02", "03", "04", "05", "07", "10", "11", "12"}

SALUD_BASE_SEED = [
    {"codigo": "07", "nombre": "Fonasa", "tipo": "FONASA"},
    {"codigo": "00", "nombre": "Sin Isapre", "tipo": "ISAPRE"},
    {"codigo": "01", "nombre": "Banmédica", "tipo": "ISAPRE"},
    {"codigo": "02", "nombre": "Consalud", "tipo": "ISAPRE"},
    {"codigo": "03", "nombre": "Vida Tres", "tipo": "ISAPRE"},
    {"codigo": "04", "nombre": "Colmena", "tipo": "ISAPRE"},
    {"codigo": "05", "nombre": "Cruz Blanca", "tipo": "ISAPRE"},
    {"codigo": "10", "nombre": "Nueva Masvida", "tipo": "ISAPRE"},
    {"codigo": "11", "nombre": "Isalud", "tipo": "ISAPRE"},
    {"codigo": "12", "nombre": "Fundación", "tipo": "ISAPRE"},
]

EX_CAJA_DROP_PATTERNS = [
    r"\bCODIGO\s+GLOSA\b",
    r"\bTABLA\s+N",
    r"\bAPV\b",
    r"\bAPVC\b",
    r"\bAGF\b",
    r"\bCORREDOR(?:ES)?\b",
    r"\bADMINISTRADORA\b",
]

MANUAL_MOTIVOS = [
    {
        "id_motivo_inasistencia": 101,
        "codigo": "LICENCIA_MEDICA",
        "nombre": "Licencia médica",
        "descuenta_dias": False,
        "activo": True,
    },
    {
        "id_motivo_inasistencia": 102,
        "codigo": "INASISTENCIA_INJUSTIFICADA",
        "nombre": "Inasistencia injustificada",
        "descuenta_dias": True,
        "activo": True,
    },
    {
        "id_motivo_inasistencia": 103,
        "codigo": "PERMISO_SIN_GOCE",
        "nombre": "Permiso sin goce de sueldo",
        "descuenta_dias": True,
        "activo": True,
    },
    {
        "id_motivo_inasistencia": 104,
        "codigo": "ACCIDENTE_TRABAJO",
        "nombre": "Accidente del trabajo",
        "descuenta_dias": False,
        "activo": True,
    },
    {
        "id_motivo_inasistencia": 105,
        "codigo": "ATRASO",
        "nombre": "Atraso",
        "descuenta_dias": False,
        "activo": True,
    },
    {
        "id_motivo_inasistencia": 106,
        "codigo": "SUSPENSION_LABORAL",
        "nombre": "Suspensión laboral",
        "descuenta_dias": True,
        "activo": True,
    },
]

MANUAL_CONCEPTOS = [
    {
        "codigo": "SUELDO_BASE",
        "codigo_motor": "SUELDO_BASE",
        "nombre": "Sueldo base",
        "tipo": "HABER",
        "naturaleza": "IMPONIBLE",
        "imponible": True,
        "tributable": True,
        "afecta_afp": True,
        "afecta_salud": True,
        "afecta_afc": True,
        "afecta_sis": True,
        "orden_impresion": 10,
        "calculo_automatico": False,
        "formula_json": None,
    },
    {
        "codigo": "GRATIFICACION",
        "codigo_motor": "GRATIFICACION",
        "nombre": "Gratificación",
        "tipo": "HABER",
        "naturaleza": "IMPONIBLE",
        "imponible": True,
        "tributable": True,
        "afecta_afp": True,
        "afecta_salud": True,
        "afecta_afc": True,
        "afecta_sis": True,
        "orden_impresion": 20,
        "calculo_automatico": True,
        "formula_json": {"tipo": "regla", "codigo": "GRATIFICACION_LEGAL"},
    },
    {
        "codigo": "HORAS_EXTRA",
        "codigo_motor": "HORAS_EXTRA",
        "nombre": "Horas extra",
        "tipo": "HABER",
        "naturaleza": "IMPONIBLE",
        "imponible": True,
        "tributable": True,
        "afecta_afp": True,
        "afecta_salud": True,
        "afecta_afc": True,
        "afecta_sis": True,
        "orden_impresion": 30,
        "calculo_automatico": False,
        "formula_json": None,
    },
    {
        "codigo": "COLACION",
        "codigo_motor": "COLACION",
        "nombre": "Colación",
        "tipo": "HABER",
        "naturaleza": "NO_IMPONIBLE",
        "imponible": False,
        "tributable": False,
        "afecta_afp": False,
        "afecta_salud": False,
        "afecta_afc": False,
        "afecta_sis": False,
        "orden_impresion": 40,
        "calculo_automatico": False,
        "formula_json": None,
    },
    {
        "codigo": "MOVILIZACION",
        "codigo_motor": "MOVILIZACION",
        "nombre": "Movilización",
        "tipo": "HABER",
        "naturaleza": "NO_IMPONIBLE",
        "imponible": False,
        "tributable": False,
        "afecta_afp": False,
        "afecta_salud": False,
        "afecta_afc": False,
        "afecta_sis": False,
        "orden_impresion": 50,
        "calculo_automatico": False,
        "formula_json": None,
    },
    {
        "codigo": "BONO",
        "codigo_motor": "BONO",
        "nombre": "Bono",
        "tipo": "HABER",
        "naturaleza": "IMPONIBLE",
        "imponible": True,
        "tributable": True,
        "afecta_afp": True,
        "afecta_salud": True,
        "afecta_afc": True,
        "afecta_sis": True,
        "orden_impresion": 60,
        "calculo_automatico": False,
        "formula_json": None,
    },
    {
        "codigo": "AFP",
        "codigo_motor": "AFP",
        "nombre": "Descuento AFP",
        "tipo": "DESCUENTO",
        "naturaleza": "IMPONIBLE",
        "imponible": False,
        "tributable": False,
        "afecta_afp": False,
        "afecta_salud": False,
        "afecta_afc": False,
        "afecta_sis": False,
        "orden_impresion": 200,
        "calculo_automatico": True,
        "formula_json": {"tipo": "regla", "codigo": "DESCUENTO_AFP"},
    },
    {
        "codigo": "SALUD",
        "codigo_motor": "SALUD",
        "nombre": "Descuento salud",
        "tipo": "DESCUENTO",
        "naturaleza": "IMPONIBLE",
        "imponible": False,
        "tributable": False,
        "afecta_afp": False,
        "afecta_salud": False,
        "afecta_afc": False,
        "afecta_sis": False,
        "orden_impresion": 210,
        "calculo_automatico": True,
        "formula_json": {"tipo": "regla", "codigo": "DESCUENTO_SALUD"},
    },
    {
        "codigo": "CESANTIA",
        "codigo_motor": "CESANTIA",
        "nombre": "Seguro de cesantía",
        "tipo": "DESCUENTO",
        "naturaleza": "IMPONIBLE",
        "imponible": False,
        "tributable": False,
        "afecta_afp": False,
        "afecta_salud": False,
        "afecta_afc": False,
        "afecta_sis": False,
        "orden_impresion": 220,
        "calculo_automatico": True,
        "formula_json": {"tipo": "regla", "codigo": "DESCUENTO_AFC"},
    },
    {
        "codigo": "IMPUESTO_UNICO",
        "codigo_motor": "IMPUESTO_UNICO",
        "nombre": "Impuesto único",
        "tipo": "DESCUENTO",
        "naturaleza": "IMPONIBLE",
        "imponible": False,
        "tributable": False,
        "afecta_afp": False,
        "afecta_salud": False,
        "afecta_afc": False,
        "afecta_sis": False,
        "orden_impresion": 230,
        "calculo_automatico": True,
        "formula_json": {"tipo": "regla", "codigo": "IMPUESTO_UNICO"},
    },
    {
        "codigo": "PRESTAMO",
        "codigo_motor": "PRESTAMO",
        "nombre": "Préstamo",
        "tipo": "DESCUENTO",
        "naturaleza": "NO_IMPONIBLE",
        "imponible": False,
        "tributable": False,
        "afecta_afp": False,
        "afecta_salud": False,
        "afecta_afc": False,
        "afecta_sis": False,
        "orden_impresion": 240,
        "calculo_automatico": False,
        "formula_json": None,
    },
    {
        "codigo": "AFP_EMPLEADOR",
        "codigo_motor": "AFP_EMPLEADOR",
        "nombre": "Aporte empleador AFP",
        "tipo": "APORTE_EMPLEADOR",
        "naturaleza": "IMPONIBLE",
        "imponible": False,
        "tributable": False,
        "afecta_afp": False,
        "afecta_salud": False,
        "afecta_afc": False,
        "afecta_sis": False,
        "orden_impresion": 300,
        "calculo_automatico": True,
        "formula_json": {"tipo": "regla", "codigo": "APORTE_AFP_EMPLEADOR"},
    },
    {
        "codigo": "SIS_EMPLEADOR",
        "codigo_motor": "SIS_EMPLEADOR",
        "nombre": "SIS empleador",
        "tipo": "APORTE_EMPLEADOR",
        "naturaleza": "IMPONIBLE",
        "imponible": False,
        "tributable": False,
        "afecta_afp": False,
        "afecta_salud": False,
        "afecta_afc": False,
        "afecta_sis": False,
        "orden_impresion": 310,
        "calculo_automatico": True,
        "formula_json": {"tipo": "regla", "codigo": "SIS_EMPLEADOR"},
    },
    {
        "codigo": "AFC_EMPLEADOR",
        "codigo_motor": "AFC_EMPLEADOR",
        "nombre": "AFC empleador",
        "tipo": "APORTE_EMPLEADOR",
        "naturaleza": "IMPONIBLE",
        "imponible": False,
        "tributable": False,
        "afecta_afp": False,
        "afecta_salud": False,
        "afecta_afc": False,
        "afecta_sis": False,
        "orden_impresion": 320,
        "calculo_automatico": True,
        "formula_json": {"tipo": "regla", "codigo": "AFC_EMPLEADOR"},
    },
]


# ============================================================================
# Helpers
# ============================================================================

def first_scalar(value: Any) -> Any:
    if isinstance(value, pd.Series):
        try:
            non_null = value[value.notna()]
            if len(non_null) > 0:
                return non_null.iloc[0]
            return value.iloc[0] if len(value) > 0 else None
        except Exception:
            return value.iloc[0] if len(value) > 0 else None
    return value


def normalize_space(value: Any) -> str:
    value = first_scalar(value)
    if value is None:
        return ""
    return re.sub(r"\s+", " ", str(value)).strip()


def normalize_key(value: Any) -> str:
    s = normalize_space(value).upper()
    s = s.replace("Á", "A").replace("É", "E").replace("Í", "I").replace("Ó", "O").replace("Ú", "U")
    return s


def parse_decimal(value: Any) -> float | None:
    value = first_scalar(value)
    if value is None:
        return None
    s = normalize_space(value)
    if not s or s.lower() in {"nan", "none", "null"}:
        return None
    s = s.replace("%", "").replace("$", "")
    s = s.replace(".", "").replace(",", ".") if s.count(",") == 1 and s.count(".") >= 1 else s.replace(",", ".")
    try:
        return float(s)
    except Exception:
        return None


def sql_literal(value: Any) -> str:
    if value is None:
        return "NULL"
    if isinstance(value, bool):
        return "TRUE" if value else "FALSE"
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return str(value)
    if isinstance(value, (date, datetime)):
        return f"'{value.isoformat()}'"
    if isinstance(value, dict):
        data = json.dumps(value, ensure_ascii=False)
        return "'" + data.replace("'", "''") + "'::jsonb"
    text = str(value).replace("'", "''")
    return f"'{text}'"


def request_bytes(url: str, timeout: int = 60) -> bytes:
    from v611_http import download_bytes

    logging.info("Descargando: %s", url)
    return download_bytes(url, timeout=timeout, headers=HEADERS)


def request_text(url: str, timeout: int = 60) -> str:
    from v611_http import download_text

    logging.info("Descargando HTML: %s", url)
    return download_text(url, timeout=timeout, headers=HEADERS)


def first_day_of_current_month() -> date:
    today = date.today()
    return date(today.year, today.month, 1)


def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def write_json(path: Path, data: Any) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def extract_pdf_text(pdf_bytes: bytes) -> str:
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        parts: list[str] = []
        for page in pdf.pages:
            text = page.extract_text() or ""
            parts.append(text)
        return "\n".join(parts)


def section_between_lines(lines: list[str], start_regex: str, end_regex: str) -> list[str]:
    start_idx = None
    end_idx = None
    start_re = re.compile(start_regex, re.I)
    end_re = re.compile(end_regex, re.I)
    for i, line in enumerate(lines):
        if start_idx is None and start_re.search(line):
            start_idx = i + 1
            continue
        if start_idx is not None and end_re.search(line):
            end_idx = i
            break
    if start_idx is None:
        return []
    return [normalize_space(x) for x in lines[start_idx:end_idx] if normalize_space(x)]


def parse_code_name_lines(lines: Iterable[str], code_pattern: str = r"[A-Z0-9]{1,4}") -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    rx = re.compile(rf"^\s*({code_pattern})\s+(.+?)\s*$")
    for line in lines:
        if line.upper() in {"CODIGO GLOSA", "CODIGO", "GLOSA"}:
            continue
        if re.search(r"^TABLA\s+N", line, re.I):
            continue
        m = rx.match(line)
        if not m:
            continue
        rows.append({"codigo": m.group(1).strip(), "nombre": normalize_space(m.group(2))})
    return rows


def percent_to_human(value: Any) -> float | None:
    dec = parse_decimal(value)
    if dec is None:
        return None
    if dec <= 0:
        return None
    if dec < 0.1:
        dec = dec * 100
    if dec > 100:
        return None
    return round(dec, 2)


def derive_period_start(periodo: str | None = None, fallback_url: str | None = None) -> str:
    if periodo:
        m = re.match(r"^(\d{4})-(\d{2})$", periodo)
        if not m:
            raise ValueError("El parámetro --periodo debe venir como YYYY-MM")
        return f"{m.group(1)}-{m.group(2)}-01"

    if fallback_url:
        m = re.search(r"/uploads/(\d{4})/(\d{2})/", fallback_url)
        if m:
            return f"{m.group(1)}-{m.group(2)}-01"

    return first_day_of_current_month().isoformat()


def build_previred_indicadores_url(periodo: str) -> str:
    m = re.match(r"^(\d{4})-(\d{2})$", periodo)
    if not m:
        raise ValueError("El parámetro de período debe venir como YYYY-MM")
    anio, mes = m.group(1), m.group(2)
    meses = {
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
    return f"https://www.previred.com/wp-content/uploads/{anio}/{mes}/Indicadores-Previsionales-Previred-{meses[mes]}-{anio}.pdf"


def extract_table_section(text: str, table_no: int) -> str:
    markers = [
        rf"Tabla\s+N[°º]?\s*{table_no}\s*:",
        rf"Tabla\s+N[°º]?\s*{table_no}\b",
    ]
    next_markers = [
        rf"Tabla\s+N[°º]?\s*{table_no + 1}\s*:",
        rf"Tabla\s+N[°º]?\s*{table_no + 1}\b",
    ]
    start_match = None
    for marker in markers:
        start_match = re.search(marker, text, re.I)
        if start_match:
            break
    if not start_match:
        return ""

    rest = text[start_match.end():]
    end_match = None
    for marker in next_markers:
        end_match = re.search(marker, rest, re.I)
        if end_match:
            break
    section = rest[:end_match.start()] if end_match else rest
    return normalize_space(section)


def parse_section_entries(section_text: str, code_pattern: str) -> list[dict[str, str]]:
    if not section_text:
        return []
    section_text = normalize_space(section_text)
    rx = re.compile(
        rf"(?<!\d)({code_pattern})\s+(.*?)(?=(?<!\d)(?:{code_pattern})\s+|$)",
        re.I | re.S,
    )
    rows: list[dict[str, str]] = []
    for code, name in rx.findall(section_text):
        clean_name = normalize_space(name)
        if not clean_name:
            continue
        rows.append({"codigo": str(code).strip(), "nombre": clean_name})
    return rows


def canonical_salud_name(name: str) -> str:
    key = normalize_key(name)
    return SALUD_CANONICAL_MAP.get(key, normalize_space(name))


def choose_better_name(current_name: str, candidate_name: str | None) -> str:
    if not candidate_name:
        return current_name
    if len(candidate_name) > len(current_name):
        return candidate_name
    return current_name


def detect_afp_key_from_label(label: Any) -> str | None:
    key = normalize_key(label)
    if not key:
        return None

    aliases = {
        "PLANVITALAFP": "PLANVITAL",
        "AFPPLANVITAL": "PLANVITAL",
        "PLAN VITAL AFP": "PLANVITAL",
        "PLANVITAL S.A": "PLANVITAL",
        "PLANVITAL SA": "PLANVITAL",
        "AFP HABITAT": "HABITAT",
        "AFP PROVIDA": "PROVIDA",
        "AFP CUPRUM": "CUPRUM",
        "AFP CAPITAL": "CAPITAL",
        "AFP MODELO": "MODELO",
        "AFP UNO": "UNO",
    }
    if key in aliases:
        return aliases[key]

    compact = re.sub(r"[^A-Z0-9]", "", key)
    compact_aliases = {
        "PLANVITALAFP": "PLANVITAL",
        "AFPPLANVITAL": "PLANVITAL",
        "PLANVITAL": "PLANVITAL",
        "AFPHABITAT": "HABITAT",
        "HABITAT": "HABITAT",
        "AFPPROVIDA": "PROVIDA",
        "PROVIDA": "PROVIDA",
        "AFPCUPRUM": "CUPRUM",
        "CUPRUM": "CUPRUM",
        "AFPCAPITAL": "CAPITAL",
        "CAPITAL": "CAPITAL",
        "AFPMODELO": "MODELO",
        "MODELO": "MODELO",
        "AFPUNO": "UNO",
        "UNO": "UNO",
    }
    if compact in compact_aliases:
        return compact_aliases[compact]

    if key in AFP_CODE_MAP:
        return key
    for known in AFP_CODE_MAP:
        known_compact = re.sub(r"[^A-Z0-9]", "", known)
        if known in key or known_compact in compact or compact in known_compact:
            return known
    return None


def build_salud_seed(period_start: str, supersalud_isapres: list[dict[str, Any]] | None = None) -> list[dict[str, Any]]:
    supersalud_by_key = {
        normalize_key(x["nombre"]): x["nombre"]
        for x in (supersalud_isapres or [])
    }
    rows: list[dict[str, Any]] = []
    for item in SALUD_BASE_SEED:
        nombre = item["nombre"]
        if item["tipo"] == "ISAPRE":
            nombre = choose_better_name(nombre, supersalud_by_key.get(normalize_key(nombre)))
        rows.append({
            "codigo": item["codigo"],
            "nombre": nombre,
            "tipo": item["tipo"],
            "porcentaje_cotizacion": 7.0,
            "vigente": True,
            "vigencia_inicio": period_start,
            "vigencia_fin": None,
        })
    rows.sort(key=lambda x: (x["tipo"], x["codigo"]))
    return rows


def clean_ex_caja_nombre(nombre: str) -> str:
    nombre = normalize_space(nombre)
    nombre = re.sub(r"\s*-\s*R[eé]gimen\s*\d+.*$", "", nombre, flags=re.I)
    nombre = re.sub(r"\s*C[oó]digo\s+Glosa.*$", "", nombre, flags=re.I)
    nombre = re.sub(r"\s+", " ", nombre).strip(" -")
    return nombre.strip()


def ex_caja_name_rank(nombre: str) -> tuple[int, int]:
    key = normalize_key(nombre)
    penalty = 0
    if "REGIMEN" in key:
        penalty += 20
    if "CODIGO GLOSA" in key or key in {"CODIGO", "GLOSA"}:
        penalty += 30
    return (penalty, len(nombre))


def choose_preferred_ex_caja(existing: dict[str, Any] | None, candidate: dict[str, Any]) -> dict[str, Any]:
    if existing is None:
        return candidate
    if ex_caja_name_rank(candidate["nombre"]) < ex_caja_name_rank(existing["nombre"]):
        return candidate
    return existing


def split_previred_ex_caja_code(codigo: str) -> tuple[str, str]:
    codigo = (codigo or "").zfill(4)
    return codigo[:2], codigo[2:]


def extract_ex_caja_matches(section_text: str) -> list[dict[str, str]]:
    section = normalize_space(section_text)
    if not section:
        return []
    matches: list[dict[str, str]] = []
    rx = re.compile(r"(?<!\d)(\d{4})\s+(.*?)(?=(?<!\d)\d{4}\s+|$)", re.I | re.S)
    for codigo, nombre in rx.findall(section):
        nombre = normalize_space(nombre)
        if not nombre:
            continue
        if any(re.search(pat, nombre, re.I) for pat in EX_CAJA_DROP_PATTERNS):
            continue
        matches.append({"codigo": codigo, "nombre": nombre})
    return matches


def parse_ex_cajas_and_regimenes(section_text: str) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """Parsea tabla de Ex-Cajas IPS sin colapsar subcajas incorrectamente.

    Cambio importante:
    - Antes se agrupaba solo por los 2 primeros dígitos del código PreviRed.
      Eso podía dejar varias subcajas/regímenes amarrados a una ex caja equivocada.
    - Ahora la ex caja se agrupa por nombre limpio y el régimen conserva siempre
      el código PreviRed completo de 4 dígitos: codigo_previred, codigo_base y
      codigo_subcaja.

    Ejemplo:
    codigo_previred=1402 mantiene codigo_base=14 y codigo_subcaja=02,
    pero se liga al nombre de ex caja que realmente viene en la glosa de esa fila,
    no al primer nombre elegido para todo el grupo 14.
    """
    rows = extract_ex_caja_matches(section_text)

    # La clave estable para agrupar padre/hijo es el código base (2 primeros dígitos).
    # Usar el nombre como llave puede colisionar o variar entre filas del PDF.
    ex_cajas_by_base: dict[str, dict[str, Any]] = {}
    regimenes: list[dict[str, Any]] = []
    seen_reg: set[str] = set()

    for row in rows:
        codigo = row["codigo"].zfill(4)
        family_code, sub_code = split_previred_ex_caja_code(codigo)
        glosa = normalize_space(row["nombre"])

        if normalize_key(glosa) == "NO PERTENECE AL IPS":
            continue
        if normalize_key(glosa) in {"CODIGO GLOSA", "CODIGO", "GLOSA"}:
            continue

        ex_caja_nombre = clean_ex_caja_nombre(glosa)
        if not ex_caja_nombre:
            continue
        if normalize_key(ex_caja_nombre) in {"CODIGO GLOSA", "CODIGO", "GLOSA"}:
            continue

        if sub_code.isdigit() and int(sub_code) > 0:
            regimen_nombre = f"Régimen {int(sub_code)}"
        else:
            regimen_nombre = "Régimen base"

        # La ex caja padre se agrupa por código base (familia).
        # Si el PDF trae variaciones de glosa, nos quedamos con el nombre más limpio.
        ex_key = family_code
        candidate_ex = {
            "codigo_base": family_code,
            "codigo_previred_ejemplo": codigo,
            "nombre": ex_caja_nombre,
            "vigente": True,
        }

        existing_ex = ex_cajas_by_base.get(ex_key)
        if existing_ex is None:
            ex_cajas_by_base[ex_key] = candidate_ex
        else:
            # Mantiene el nombre más limpio, pero conserva una muestra de código.
            ex_cajas_by_base[ex_key] = choose_preferred_ex_caja(existing_ex, candidate_ex)

        # El código PreviRed completo debe ser único. Ese es el dato que
        # realmente identifica la subcaja/régimen en archivos PreviRed.
        if codigo in seen_reg:
            continue

        regimenes.append({
            "codigo_previred": codigo,
            "codigo_base": family_code,
            "codigo_subcaja": sub_code,
            "ex_caja_nombre": ex_caja_nombre,
            "nombre": regimen_nombre,
            "glosa_previred": glosa,
            "tasa_cotizacion_referencia": None,
            "vigente": True,
        })
        seen_reg.add(codigo)

    ex_cajas = sorted(
        ex_cajas_by_base.values(),
        key=lambda x: (x.get("codigo_base", ""), normalize_key(x["nombre"]))
    )

    regimenes.sort(key=lambda x: (x.get("codigo_base", ""), x.get("codigo_subcaja", ""), normalize_key(x["ex_caja_nombre"]), x["nombre"]))
    return ex_cajas, regimenes

# ============================================================================
# Scrapers
# ============================================================================

def scrape_previred_equivalencias(pdf_url: str, period_start: str) -> dict[str, Any]:
    """
    Extrae desde PreviRed las tablas de equivalencias útiles para semilla.
    v3: salud sale desde catálogo controlado y ex cajas se separan con doble filtro
    (familia/base + subcaja/régimen) para no mezclar cajas vinculadas.
    """
    pdf_bytes = request_bytes(pdf_url)
    text = extract_pdf_text(pdf_bytes)

    movimientos_section = extract_table_section(text, 7)
    afp_section = extract_table_section(text, 10)
    ex_cajas_section = extract_table_section(text, 14)

    afp_codes_raw = parse_section_entries(afp_section, r"(?:03|05|08|29|33|34|35)")
    afp_codes = []
    seen_afp_codes: set[str] = set()
    for row in afp_codes_raw:
        codigo = row["codigo"].zfill(2)
        if codigo in seen_afp_codes:
            continue
        seen_afp_codes.add(codigo)
        key = detect_afp_key_from_label(row["nombre"]) or normalize_key(row["nombre"])
        nombre = AFP_CANONICAL_NAMES.get(key, normalize_space(row["nombre"]))
        afp_codes.append({"codigo": codigo, "nombre": nombre})

    # fallback defensivo: nunca depender solo del PDF para no perder AFP como PlanVital
    current_codes = {x["codigo"] for x in afp_codes}
    for key, codigo in AFP_CODE_MAP.items():
        if codigo not in current_codes:
            afp_codes.append({"codigo": codigo, "nombre": AFP_CANONICAL_NAMES.get(key, normalize_space(key.title()))})

    tipos_movimiento: list[dict[str, Any]] = []
    movimientos_rows = parse_section_entries(
        movimientos_section,
        r"(?:11|12|0|1|2|3|4|5|6|7|8)"
    )
    seen_movs: set[int] = set()
    for row in movimientos_rows:
        codigo_int = int(row["codigo"])
        if codigo_int not in MOVIMIENTO_PERSONAL_MAP or codigo_int in seen_movs:
            continue
        seen_movs.add(codigo_int)
        afecta_dias = codigo_int in {2, 3, 4, 6, 11, 12}
        afecta_horas = codigo_int == 11
        tipos_movimiento.append({
            "id_tipo_movimiento": codigo_int,
            "codigo": f"MOV_{codigo_int}",
            "nombre": MOVIMIENTO_PERSONAL_MAP[codigo_int],
            "afecta_dias_trabajados": afecta_dias,
            "afecta_horas": afecta_horas,
            "activo": True,
        })
    tipos_movimiento.sort(key=lambda x: x["id_tipo_movimiento"])

    ex_cajas, regimenes = parse_ex_cajas_and_regimenes(ex_cajas_section)

    return {
        "afp_codes": afp_codes,
        "tipos_movimiento": tipos_movimiento,
        "ex_cajas": ex_cajas,
        "regimenes_ex_caja": regimenes,
        "salud_previred": build_salud_seed(period_start),
    }

def scrape_supersalud_isapres(url: str) -> list[dict[str, Any]]:
    """
    Obtiene nombres vigentes del registro de Isapres.
    No usa el código de Supersalud para seed, solo ayuda a validar/corregir nombre.
    """
    html = request_text(url)
    soup = BeautifulSoup(html, "lxml")
    lines = [normalize_space(x) for x in soup.get_text("\n", strip=True).splitlines() if normalize_space(x)]

    found: dict[str, dict[str, Any]] = {}
    for line in lines:
        if len(line) > 120:
            continue
        if "http" in line.lower():
            continue
        canon = canonical_salud_name(line)
        key = normalize_key(canon)
        if canon in KNOWN_ISAPRE_NAMES and key not in found:
            found[key] = {"nombre": canon}

    return list(found.values())

def scrape_afp_spensiones(
    xls_url: str,
    previred_afp_codes: list[dict[str, str]],
    period_start: str,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """
    Lee el XLS de la SP y se queda con la última comisión plausible por AFP.
    No confía en la vigencia del XLS para sembrar la base: usa period_start común.
    """
    afp_name_map = {
        normalize_key(x["nombre"]): x["codigo"].zfill(2)
        for x in previred_afp_codes
        if x["codigo"] != "00"
    }
    xls_bytes = request_bytes(xls_url)

    try:
        xls = pd.ExcelFile(io.BytesIO(xls_bytes))
        sheet_names = xls.sheet_names
    except Exception:
        sheet_names = [0]

    candidates: list[dict[str, Any]] = []

    def _parse_date_cell(v: Any) -> date | None:
        v = first_scalar(v)
        if v is None or pd.isna(v):
            return None
        if isinstance(v, datetime):
            return v.date()
        if isinstance(v, date):
            return v
        txt = normalize_space(v)
        for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%b-%y", "%b-%Y", "%m/%Y", "%Y/%m"):
            try:
                return datetime.strptime(txt, fmt).date()
            except Exception:
                pass
        try:
            parsed = pd.to_datetime(txt, errors="coerce")
            if pd.isna(parsed):
                return None
            return parsed.date()
        except Exception:
            return None

    def _detect_date_cols(df: pd.DataFrame, afp_cols: list[str]) -> tuple[str | None, str | None, str | None]:
        start_col = None
        end_col = None
        period_col = None
        for col in df.columns:
            ck = normalize_key(col)
            if col in afp_cols:
                continue
            if start_col is None and any(x in ck for x in ["DESDE", "INICIO", "FECHA INICIO", "VIGENCIA"]):
                start_col = col
            if end_col is None and any(x in ck for x in ["HASTA", "TERMINO", "TÉRMINO", "FIN", "FECHA FIN"]):
                end_col = col
            if period_col is None and any(x in ck for x in ["MES", "PERIODO", "PERÍODO", "FECHA"]):
                period_col = col
        non_afp_cols = [c for c in df.columns if c not in afp_cols]
        if start_col is None and non_afp_cols:
            start_col = non_afp_cols[0]
        if end_col is None and len(non_afp_cols) >= 2:
            end_col = non_afp_cols[1]
        return start_col, end_col, period_col

    for sheet in sheet_names:
        for header in [0, 1, 2, 3, 4, 5, None]:
            try:
                df = pd.read_excel(io.BytesIO(xls_bytes), sheet_name=sheet, header=header)  # type: ignore[arg-type]
            except Exception:
                continue

            if header is None:
                raw = df
                best_row = None
                best_score = -1
                for i in range(min(len(raw), 25)):
                    score = sum(1 for cell in raw.iloc[i].tolist() if normalize_key(cell) in AFP_CODE_MAP)
                    if score > best_score:
                        best_score = score
                        best_row = i
                if best_row is None or best_score < 3:
                    continue
                headers = [normalize_space(x) for x in raw.iloc[best_row].tolist()]
                df = raw.iloc[best_row + 1:].copy()
                df.columns = headers
            else:
                df = df.copy()
                df.columns = [normalize_space(c) for c in df.columns]

            afp_cols = [col for col in df.columns if detect_afp_key_from_label(col)]
            afp_cols = list(dict.fromkeys(afp_cols))
            if len(afp_cols) < 3:
                continue

            start_col, end_col, period_col = _detect_date_cols(df, afp_cols)

            for _, row in df.iterrows():
                base_start = _parse_date_cell(row.get(start_col)) if start_col else None
                base_end = _parse_date_cell(row.get(end_col)) if end_col else None
                period_date = _parse_date_cell(row.get(period_col)) if period_col else None
                source_date = base_start or period_date or base_end

                for afp_col in afp_cols:
                    human_percent = percent_to_human(row.get(afp_col))
                    if human_percent is None:
                        continue
                    if not (0.3 <= human_percent <= 2.5):
                        continue
                    afp_key = detect_afp_key_from_label(afp_col) or normalize_key(afp_col)
                    candidates.append({
                        "afp_key": afp_key,
                        "afp_nombre": AFP_CANONICAL_NAMES.get(afp_key, normalize_space(afp_col)),
                        "codigo": afp_name_map.get(afp_key) or AFP_CODE_MAP.get(afp_key),
                        "comision": human_percent,
                        "source_date": source_date,
                    })

    if not candidates:
        raise RuntimeError("No logré extraer comisiones AFP plausibles desde el XLS.")

    period_date = datetime.strptime(period_start, "%Y-%m-%d").date()
    grouped: dict[str, list[dict[str, Any]]] = {}
    for item in candidates:
        grouped.setdefault(item["afp_key"], []).append(item)

    selected: list[dict[str, Any]] = []
    for afp_key, items in grouped.items():
        def sort_key(item: dict[str, Any]) -> tuple[int, date]:
            src = item["source_date"] or date(1900, 1, 1)
            valid_for_period = 1 if item["source_date"] is not None and src <= period_date else 0
            return (valid_for_period, src)
        best = max(items, key=sort_key)
        selected.append(best)

    selected.sort(key=lambda x: x["codigo"] or "")

    afp: list[dict[str, Any]] = []
    afp_vigencia: list[dict[str, Any]] = []
    for row in selected:
        nombre = row["afp_nombre"]
        codigo = row["codigo"]
        if not codigo:
            continue
        afp.append({
            "codigo": codigo,
            "nombre": nombre,
            "tasa_obligatoria": 10.0,
            "comision": row["comision"],
            "sis": 0.0,
            "tasa_empleador": 0.0,
            "vigente": True,
            "forma_pago_apvi": None,
            "vigencia_inicio": period_start,
            "vigencia_fin": None,
        })
        afp_vigencia.append({
            "afp_nombre": nombre,
            "tasa_obligatoria": 10.0,
            "comision": row["comision"],
            "sis": 0.0,
            "tasa_empleador": 0.0,
            "tope_imponible_uf": None,
            "forma_pago_apvi": None,
            "vigente": True,
            "vigencia_inicio": period_start,
            "vigencia_fin": None,
        })

    dedup_afp = {normalize_key(x["nombre"]): x for x in afp}
    dedup_vig = {normalize_key(x["afp_nombre"]): x for x in afp_vigencia}

    expected_keys = {normalize_key(v) for v in AFP_CANONICAL_NAMES.values()}
    missing = expected_keys - set(dedup_afp.keys())
    period_key = period_start[:7]
    manual_fallbacks = AFP_MANUAL_FALLBACKS_BY_PERIOD.get(period_key, {})
    for missing_key in sorted(missing):
        if missing_key not in manual_fallbacks:
            continue
        codigo = AFP_CODE_MAP.get(missing_key)
        nombre = AFP_CANONICAL_NAMES.get(missing_key, missing_key.title())
        comision = manual_fallbacks[missing_key]
        logging.warning(
            "AFP faltante en XLS/SP para %s: %s. Se aplicará fallback manual controlado.",
            period_key,
            nombre,
        )
        dedup_afp[missing_key] = {
            "codigo": codigo,
            "nombre": nombre,
            "tasa_obligatoria": 10.0,
            "comision": comision,
            "sis": 0.0,
            "tasa_empleador": 0.0,
            "vigente": True,
            "forma_pago_apvi": None,
            "vigencia_inicio": period_start,
            "vigencia_fin": None,
        }
        dedup_vig[missing_key] = {
            "afp_nombre": nombre,
            "tasa_obligatoria": 10.0,
            "comision": comision,
            "sis": 0.0,
            "tasa_empleador": 0.0,
            "tope_imponible_uf": None,
            "forma_pago_apvi": None,
            "vigente": True,
            "vigencia_inicio": period_start,
            "vigencia_fin": None,
        }

    missing = expected_keys - set(dedup_afp.keys())
    if missing:
        logging.warning("AFP faltantes desde XLS/SP para el período %s: %s", period_key, ", ".join(sorted(missing)))

    def afp_sort(row: dict[str, Any]) -> tuple[int, str]:
        codigo = row.get("codigo") or ""
        try:
            return (AFP_EXPECTED_ORDER.index(codigo), codigo)
        except ValueError:
            return (999, codigo)

    ordered_afp = sorted(dedup_afp.values(), key=afp_sort)
    ordered_vig = sorted(dedup_vig.values(), key=lambda x: next((idx for idx, a in enumerate(ordered_afp) if a["nombre"] == x["afp_nombre"]), 999))
    return ordered_afp, ordered_vig

def scrape_previred_indicadores(pdf_url: str, periodo: str | None = None) -> dict[str, Any]:
    """
    Extrae parámetros mensuales básicos del PDF de indicadores.
    """
    period_start = derive_period_start(periodo, pdf_url)
    result = {
        "tope_imponible_uf": None,
        "sis": None,
        "vigencia_inicio": period_start,
    }
    try:
        pdf_bytes = request_bytes(pdf_url)
        text = extract_pdf_text(pdf_bytes)
        compact = normalize_space(text)

        m_tope = re.search(r"Para Afiliados AFP:\s*([\d.,]+)\s*UF", compact, re.I)
        if m_tope:
            result["tope_imponible_uf"] = parse_decimal(m_tope.group(1))

        m_sis = re.search(r"SIS\)?\s*:\s*([\d.,]+)\s*%", compact, re.I)
        if m_sis:
            result["sis"] = percent_to_human(m_sis.group(1))
    except Exception as exc:
        logging.warning("No se pudo enriquecer desde Indicadores PreviRed: %s", exc)

    return result

def merge_salud(
    previred_salud: list[dict[str, Any]],
    supersalud_isapres: list[dict[str, Any]],
    period_start: str,
) -> list[dict[str, Any]]:
    """
    v3: salud ya no se extrae del PDF de equivalencias para evitar contaminación
    con tablas vecinas. Se usa catálogo controlado por código Previred y
    Supersalud solo corrige nombres oficiales si aplica.
    """
    return build_salud_seed(period_start, supersalud_isapres)

def enrich_afp_vigencia(
    afp_vigencia: list[dict[str, Any]],
    indicadores: dict[str, Any],
    period_start: str,
) -> list[dict[str, Any]]:
    out = []
    for row in afp_vigencia:
        cloned = dict(row)
        if indicadores.get("sis") is not None:
            cloned["sis"] = indicadores["sis"]
        if indicadores.get("tope_imponible_uf") is not None:
            cloned["tope_imponible_uf"] = indicadores["tope_imponible_uf"]
        cloned["vigencia_inicio"] = period_start
        cloned["vigencia_fin"] = None
        out.append(cloned)
    return out

def build_entidad_previsional_ips() -> list[dict[str, Any]]:
    return [
        {
            "nombre": "IPS (Ex-INP)",
            "vigente": True,
        }
    ]


# ============================================================================
# SQL render
# ============================================================================

def render_sql(
    afp: list[dict[str, Any]],
    afp_vigencia: list[dict[str, Any]],
    salud: list[dict[str, Any]],
    entidad_ips: list[dict[str, Any]],
    ex_cajas: list[dict[str, Any]],
    regimenes: list[dict[str, Any]],
    tipos_movimiento: list[dict[str, Any]],
    motivos: list[dict[str, Any]],
    conceptos: list[dict[str, Any]],
) -> str:
    parts: list[str] = []
    parts.append("-- Seed generado automáticamente para SQL v6.11\nBEGIN;\n")

    parts.append(
        """
-- -----------------------------------------------------------------------------
-- Limpieza total de data de semilla (re-ejecutable)
-- -----------------------------------------------------------------------------
-- Este bloque elimina data de catálogos/tablas de semilla para dejar una carga limpia.
-- IMPORTANTE: esto borra registros; úsalo solo en entornos donde corresponda reinicializar.
TRUNCATE TABLE
    afp_vigencia,
    afp,
    salud,
    entidad_previsional_ips,
    regimen_ex_caja,
    ex_caja_previsional,
    motivo_inasistencia,
    tipo_movimiento,
    concepto
RESTART IDENTITY CASCADE;
""".strip()
    )

    parts.append(
        """
-- Refuerzo de modelo IPS / Ex-Cajas.
-- Permite conservar el código PreviRed completo de la subcaja/régimen
-- y evita que distintas subcajas queden amarradas a una ex caja incorrecta.
ALTER TABLE ex_caja_previsional
    ADD COLUMN IF NOT EXISTS codigo_base VARCHAR(10),
    ADD COLUMN IF NOT EXISTS codigo_previred_ejemplo VARCHAR(10);

ALTER TABLE regimen_ex_caja
    ADD COLUMN IF NOT EXISTS codigo_previred VARCHAR(10),
    ADD COLUMN IF NOT EXISTS codigo_base VARCHAR(10),
    ADD COLUMN IF NOT EXISTS codigo_subcaja VARCHAR(10),
    ADD COLUMN IF NOT EXISTS glosa_previred TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_regimen_ex_caja_codigo_previred
    ON regimen_ex_caja (codigo_previred);

CREATE UNIQUE INDEX IF NOT EXISTS uq_ex_caja_previsional_codigo_base
    ON ex_caja_previsional (codigo_base);

-- Índices únicos requeridos por ON CONFLICT usados en este seed.
CREATE UNIQUE INDEX IF NOT EXISTS uq_afp_nombre
    ON afp (nombre);

CREATE UNIQUE INDEX IF NOT EXISTS uq_salud_nombre
    ON salud (nombre);

CREATE UNIQUE INDEX IF NOT EXISTS uq_entidad_previsional_ips_nombre
    ON entidad_previsional_ips (nombre);

CREATE UNIQUE INDEX IF NOT EXISTS uq_afp_vigencia_id_afp_vigencia_inicio
    ON afp_vigencia (id_afp, vigencia_inicio);

CREATE UNIQUE INDEX IF NOT EXISTS uq_concepto_codigo
    ON concepto (codigo);

CREATE UNIQUE INDEX IF NOT EXISTS uq_tipo_movimiento_id_tipo_movimiento
    ON tipo_movimiento (id_tipo_movimiento);

CREATE UNIQUE INDEX IF NOT EXISTS uq_motivo_inasistencia_id_motivo_inasistencia
    ON motivo_inasistencia (id_motivo_inasistencia);
""".strip()
    )

    for row in afp:
        parts.append(
            f"""
INSERT INTO afp (
    codigo, nombre, tasa_obligatoria, comision, sis, tasa_empleador,
    vigente, forma_pago_apvi, vigencia_inicio, vigencia_fin
) VALUES (
    {sql_literal(row['codigo'])}, {sql_literal(row['nombre'])}, {sql_literal(row['tasa_obligatoria'])},
    {sql_literal(row['comision'])}, {sql_literal(row['sis'])}, {sql_literal(row['tasa_empleador'])},
    {sql_literal(row['vigente'])}, {sql_literal(row['forma_pago_apvi'])},
    {sql_literal(row['vigencia_inicio'])}, {sql_literal(row['vigencia_fin'])}
)
ON CONFLICT (nombre) DO UPDATE SET
    codigo = EXCLUDED.codigo,
    tasa_obligatoria = EXCLUDED.tasa_obligatoria,
    comision = EXCLUDED.comision,
    sis = EXCLUDED.sis,
    tasa_empleador = EXCLUDED.tasa_empleador,
    vigente = EXCLUDED.vigente,
    forma_pago_apvi = EXCLUDED.forma_pago_apvi,
    vigencia_inicio = EXCLUDED.vigencia_inicio,
    vigencia_fin = EXCLUDED.vigencia_fin;
""".strip()
        )

    for row in afp_vigencia:
        parts.append(
            f"""
INSERT INTO afp_vigencia (
    id_afp, tasa_obligatoria, comision, sis, tasa_empleador, tope_imponible_uf,
    forma_pago_apvi, vigente, vigencia_inicio, vigencia_fin
) VALUES (
    (SELECT id_afp FROM afp WHERE nombre = {sql_literal(row['afp_nombre'])}),
    {sql_literal(row['tasa_obligatoria'])}, {sql_literal(row['comision'])}, {sql_literal(row['sis'])},
    {sql_literal(row['tasa_empleador'])}, {sql_literal(row['tope_imponible_uf'])},
    {sql_literal(row['forma_pago_apvi'])}, {sql_literal(row['vigente'])},
    {sql_literal(row['vigencia_inicio'])}, {sql_literal(row['vigencia_fin'])}
)
ON CONFLICT (id_afp, vigencia_inicio) DO UPDATE SET
    tasa_obligatoria = EXCLUDED.tasa_obligatoria,
    comision = EXCLUDED.comision,
    sis = EXCLUDED.sis,
    tasa_empleador = EXCLUDED.tasa_empleador,
    tope_imponible_uf = EXCLUDED.tope_imponible_uf,
    forma_pago_apvi = EXCLUDED.forma_pago_apvi,
    vigente = EXCLUDED.vigente,
    vigencia_fin = EXCLUDED.vigencia_fin;
""".strip()
        )

    for row in salud:
        parts.append(
            f"""
INSERT INTO salud (
    codigo, nombre, tipo, porcentaje_cotizacion, vigente, vigencia_inicio, vigencia_fin
) VALUES (
    {sql_literal(row['codigo'])}, {sql_literal(row['nombre'])}, {sql_literal(row['tipo'])}::tipo_salud_enum,
    {sql_literal(row['porcentaje_cotizacion'])}, {sql_literal(row['vigente'])},
    {sql_literal(row['vigencia_inicio'])}, {sql_literal(row['vigencia_fin'])}
)
ON CONFLICT (nombre) DO UPDATE SET
    codigo = EXCLUDED.codigo,
    tipo = EXCLUDED.tipo,
    porcentaje_cotizacion = EXCLUDED.porcentaje_cotizacion,
    vigente = EXCLUDED.vigente,
    vigencia_inicio = EXCLUDED.vigencia_inicio,
    vigencia_fin = EXCLUDED.vigencia_fin;
""".strip()
        )

    for row in entidad_ips:
        parts.append(
            f"""
INSERT INTO entidad_previsional_ips (nombre, vigente)
VALUES ({sql_literal(row['nombre'])}, {sql_literal(row['vigente'])})
ON CONFLICT (nombre) DO UPDATE SET
    vigente = EXCLUDED.vigente;
""".strip()
        )

    for row in ex_cajas:
        parts.append(
            f"""
INSERT INTO ex_caja_previsional (codigo_base, codigo_previred_ejemplo, nombre, vigente)
VALUES (
    {sql_literal(row.get('codigo_base'))},
    {sql_literal(row.get('codigo_previred_ejemplo'))},
    {sql_literal(row['nombre'])},
    {sql_literal(row['vigente'])}
)
ON CONFLICT (codigo_base) DO UPDATE SET
    codigo_base = EXCLUDED.codigo_base,
    codigo_previred_ejemplo = EXCLUDED.codigo_previred_ejemplo,
    nombre = EXCLUDED.nombre,
    vigente = EXCLUDED.vigente;
""".strip()
        )

    for row in regimenes:
        parts.append(
            f"""
INSERT INTO regimen_ex_caja (
    id_ex_caja_previsional,
    codigo_previred,
    codigo_base,
    codigo_subcaja,
    nombre,
    glosa_previred,
    tasa_cotizacion_referencia,
    vigente
)
VALUES (
    (SELECT id_ex_caja_previsional FROM ex_caja_previsional WHERE codigo_base = {sql_literal(row.get('codigo_base'))}),
    {sql_literal(row.get('codigo_previred'))},
    {sql_literal(row.get('codigo_base'))},
    {sql_literal(row.get('codigo_subcaja'))},
    {sql_literal(row['nombre'])},
    {sql_literal(row.get('glosa_previred'))},
    {sql_literal(row['tasa_cotizacion_referencia'])},
    {sql_literal(row['vigente'])}
)
ON CONFLICT (codigo_previred) DO UPDATE SET
    id_ex_caja_previsional = EXCLUDED.id_ex_caja_previsional,
    codigo_base = EXCLUDED.codigo_base,
    codigo_subcaja = EXCLUDED.codigo_subcaja,
    nombre = EXCLUDED.nombre,
    glosa_previred = EXCLUDED.glosa_previred,
    tasa_cotizacion_referencia = EXCLUDED.tasa_cotizacion_referencia,
    vigente = EXCLUDED.vigente;
""".strip()
        )

    for row in tipos_movimiento:
        parts.append(
            f"""
INSERT INTO tipo_movimiento (
    id_tipo_movimiento, codigo, nombre, afecta_dias_trabajados, afecta_horas, activo
) VALUES (
    {sql_literal(row['id_tipo_movimiento'])}, {sql_literal(row['codigo'])}, {sql_literal(row['nombre'])},
    {sql_literal(row['afecta_dias_trabajados'])}, {sql_literal(row['afecta_horas'])}, {sql_literal(row['activo'])}
)
ON CONFLICT (id_tipo_movimiento) DO UPDATE SET
    codigo = EXCLUDED.codigo,
    nombre = EXCLUDED.nombre,
    afecta_dias_trabajados = EXCLUDED.afecta_dias_trabajados,
    afecta_horas = EXCLUDED.afecta_horas,
    activo = EXCLUDED.activo;
""".strip()
        )

    for row in motivos:
        parts.append(
            f"""
INSERT INTO motivo_inasistencia (
    id_motivo_inasistencia, codigo, nombre, descuenta_dias, activo
) VALUES (
    {sql_literal(row['id_motivo_inasistencia'])}, {sql_literal(row['codigo'])}, {sql_literal(row['nombre'])},
    {sql_literal(row['descuenta_dias'])}, {sql_literal(row['activo'])}
)
ON CONFLICT (id_motivo_inasistencia) DO UPDATE SET
    codigo = EXCLUDED.codigo,
    nombre = EXCLUDED.nombre,
    descuenta_dias = EXCLUDED.descuenta_dias,
    activo = EXCLUDED.activo;
""".strip()
        )

    for row in conceptos:
        parts.append(
            f"""
INSERT INTO concepto (
    codigo, codigo_motor, nombre, tipo, naturaleza, imponible, tributable, afecta_afp,
    afecta_salud, afecta_afc, afecta_sis, orden_impresion, calculo_automatico, formula_json
) VALUES (
    {sql_literal(row['codigo'])}, {sql_literal(row['codigo_motor'])}, {sql_literal(row['nombre'])},
    {sql_literal(row['tipo'])}, {sql_literal(row['naturaleza'])},
    {sql_literal(row['imponible'])}, {sql_literal(row['tributable'])},
    {sql_literal(row['afecta_afp'])}, {sql_literal(row['afecta_salud'])},
    {sql_literal(row['afecta_afc'])}, {sql_literal(row['afecta_sis'])},
    {sql_literal(row['orden_impresion'])}, {sql_literal(row['calculo_automatico'])},
    {sql_literal(row['formula_json'])}
)
ON CONFLICT (codigo) DO UPDATE SET
    codigo_motor = EXCLUDED.codigo_motor,
    nombre = EXCLUDED.nombre,
    tipo = EXCLUDED.tipo,
    naturaleza = EXCLUDED.naturaleza,
    imponible = EXCLUDED.imponible,
    tributable = EXCLUDED.tributable,
    afecta_afp = EXCLUDED.afecta_afp,
    afecta_salud = EXCLUDED.afecta_salud,
    afecta_afc = EXCLUDED.afecta_afc,
    afecta_sis = EXCLUDED.afecta_sis,
    orden_impresion = EXCLUDED.orden_impresion,
    calculo_automatico = EXCLUDED.calculo_automatico,
    formula_json = EXCLUDED.formula_json;
""".strip()
        )

    parts.append("\nCOMMIT;\n")
    return "\n\n".join(parts)


# ============================================================================
# DB apply
# ============================================================================

def apply_sql(dsn: str, sql_text: str) -> None:
    if psycopg is None:
        raise RuntimeError("psycopg no está instalado. Instala: pip install psycopg[binary]")
    with psycopg.connect(dsn) as conn:
        with conn.cursor() as cur:
            cur.execute(sql_text)
        conn.commit()


# ============================================================================
# Main
# ============================================================================

def main() -> int:
    parser = argparse.ArgumentParser(description="Scraping + normalización de semillas para SQL v6.11")
    parser.add_argument("--out-dir", default="./out_v611_seed", help="Carpeta de salida")
    parser.add_argument("--periodo", help="Periodo uniforme de seed en formato YYYY-MM. Si no se envía, se deriva del PDF de indicadores.")
    parser.add_argument("--sp-xls-url", default=DEFAULT_SP_XLS_URL)
    parser.add_argument("--previred-equiv-url", default=DEFAULT_PREVIRED_EQUIV_URL)
    parser.add_argument("--previred-indicadores-url", default=DEFAULT_PREVIRED_INDICADORES_URL)
    parser.add_argument("--supersalud-isapres-url", default=DEFAULT_SUPERSALUD_ISAPRES_URL)
    parser.add_argument("--dsn", help="Cadena de conexión PostgreSQL")
    parser.add_argument("--apply", action="store_true", help="Ejecuta el SQL generado contra PostgreSQL")
    parser.add_argument("--log-level", default="INFO")
    args = parser.parse_args()

    logging.basicConfig(
        level=getattr(logging, args.log_level.upper(), logging.INFO),
        format="%(levelname)s %(message)s",
    )

    out_dir = Path(args.out_dir)
    ensure_dir(out_dir)

    effective_indicadores_url = args.previred_indicadores_url
    if args.periodo and args.previred_indicadores_url == DEFAULT_PREVIRED_INDICADORES_URL:
        effective_indicadores_url = build_previred_indicadores_url(args.periodo)

    logging.info("1) Scraping indicadores PreviRed...")
    indicadores = scrape_previred_indicadores(effective_indicadores_url, args.periodo)
    period_start = derive_period_start(args.periodo, effective_indicadores_url)
    logging.info("Período efectivo de seed: %s", period_start[:7])
    logging.info("URL indicadores efectiva: %s", effective_indicadores_url)

    logging.info("2) Scraping PreviRed equivalencias...")
    previred = scrape_previred_equivalencias(args.previred_equiv_url, period_start)

    logging.info("3) Scraping AFP desde Superintendencia de Pensiones...")
    afp, afp_vigencia = scrape_afp_spensiones(args.sp_xls_url, previred["afp_codes"], period_start)

    logging.info("4) Enriqueciendo AFP con Indicadores PreviRed...")
    afp_vigencia = enrich_afp_vigencia(afp_vigencia, indicadores, period_start)

    logging.info("5) Scraping Isapres desde Supersalud...")
    try:
        supersalud_isapres = scrape_supersalud_isapres(args.supersalud_isapres_url)
    except Exception as exc:
        logging.warning("No se pudo scrapear Supersalud. Se usará solo PreviRed. Detalle: %s", exc)
        supersalud_isapres = []

    logging.info("6) Normalizando salud...")
    salud = merge_salud(previred["salud_previred"], supersalud_isapres, period_start)

    entidad_ips = build_entidad_previsional_ips()
    ex_cajas = previred["ex_cajas"]
    regimenes = previred["regimenes_ex_caja"]
    tipos_movimiento = previred["tipos_movimiento"]
    motivos = MANUAL_MOTIVOS
    conceptos = MANUAL_CONCEPTOS

    payload = {
        "afp": afp,
        "afp_vigencia": afp_vigencia,
        "salud": salud,
        "entidad_previsional_ips": entidad_ips,
        "ex_caja_previsional": ex_cajas,
        "regimen_ex_caja": regimenes,
        "tipo_movimiento": tipos_movimiento,
        "motivo_inasistencia": motivos,
        "concepto": conceptos,
        "metadata": {
            "periodo_origen": period_start[:7],
            "sp_xls_url": args.sp_xls_url,
            "previred_equiv_url": args.previred_equiv_url,
            "previred_indicadores_url": effective_indicadores_url,
            "supersalud_isapres_url": args.supersalud_isapres_url,
            "generated_at": datetime.now().isoformat(),
            "script_version": "v4",
        },
    }

    logging.info("7) Escribiendo JSON normalizado...")
    write_json(out_dir / "seed_v611.json", payload)

    logging.info("8) Renderizando SQL...")
    sql_text = render_sql(
        afp=afp,
        afp_vigencia=afp_vigencia,
        salud=salud,
        entidad_ips=entidad_ips,
        ex_cajas=ex_cajas,
        regimenes=regimenes,
        tipos_movimiento=tipos_movimiento,
        motivos=motivos,
        conceptos=conceptos,
    )
    (out_dir / "seed_v611.sql").write_text(sql_text, encoding="utf-8")

    logging.info("Listo.")
    logging.info("Archivo JSON: %s", out_dir / "seed_v611.json")
    logging.info("Archivo SQL : %s", out_dir / "seed_v611.sql")

    if args.apply:
        if not args.dsn:
            raise SystemExit("--apply requiere --dsn")
        logging.info("9) Aplicando SQL en PostgreSQL...")
        apply_sql(args.dsn, sql_text)
        logging.info("Seed aplicado correctamente.")

    return 0



if __name__ == "__main__":
    raise SystemExit(main())
