#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
from dataclasses import asdict, dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any, Iterable

import requests
from bs4 import BeautifulSoup

from v611_http import download_response
from v611_parametros_generales_schema import (
    PARAMETROS_GENERALES_V11_COLUMNS,
    PARAMETROS_GENERALES_V11_TEMP_TYPES,
)
from v611_sql_merge_helpers import (
    render_tramo_carga_merge,
    render_tramo_impuesto_schema_precision,
    render_tramo_impuesto_sync_from_tabla,
)

try:
    import pdfplumber  # type: ignore
except Exception:  # pragma: no cover - optional dependency in this helper
    pdfplumber = None

def find_project_dir() -> Path:
    current = Path(__file__).resolve().parent
    for candidate in [current, *current.parents]:
        if candidate.name == "out_v611_seed":
            return candidate
        if (candidate / "data").exists() and (candidate / "scripts").exists():
            return candidate
    return current


BASE_DIR = find_project_dir()
DATA_DIR = BASE_DIR / "data"
DEFAULT_TIMEOUT = 60
HEADERS = {"User-Agent": "Mozilla/5.0"}

SOURCES = {
    "trabajo_pesado_compendio": "https://www.spensiones.cl/portal/compendio/596/w3-propertyvalue-4282.html",
    "trabajo_pesado_pago": "https://www.spensiones.cl/portal/compendio/596/w3-propertyvalue-4284.html",
    "ley_16744_financiamiento": "https://www.suseso.cl/606/w3-article-18613.html",
    "ley_16744_organismos": "https://www.suseso.cl/606/w3-article-19892.html",
    "ccaf_vigentes": "https://www.suseso.cl/606/w3-propertyvalue-34003.html",
    "sanna_ley_21010": "https://www.suseso.cl/622/w3-propertyvalue-133496.html",
    "reforma_previsional_sp": "https://www.spensiones.cl/portal/institucional/594/w3-article-16615.html",
    "reforma_previsional_hacienda": "https://www.hacienda.cl/noticias-y-eventos/noticias/implementacion-de-la-reforma-previsional-nueva-cotizacion-del-empleador-regira",
    "reforma_previsional_chileatiende": "https://www.chileatiende.gob.cl/fichas/130987-aportes-del-empleador-al-sistema-de-pensiones",
    "previred_equivalencias": "https://www.previred.com/wp-content/uploads/2025/10/TablasEquivalenciaSeptiembre2025.pdf",
}

REFORMA_PREVISIONAL_GRADUALIDAD = [
    ("GRAD_EMP_2025_08", "2025-08-01", "2026-07-31", 0.10, 0.00, 0.90, 1.00),
    ("GRAD_EMP_2026_08", "2026-08-01", "2027-07-31", 0.10, 0.90, 2.50, 3.50),
    ("GRAD_EMP_2027_08", "2027-08-01", "2028-07-31", 0.25, 1.50, 2.50, 4.25),
    ("GRAD_EMP_2028_08", "2028-08-01", "2029-07-31", 1.00, 1.50, 2.50, 5.00),
    ("GRAD_EMP_2029_08", "2029-08-01", "2030-07-31", 1.70, 1.50, 2.50, 5.70),
    ("GRAD_EMP_2030_08", "2030-08-01", "2031-07-31", 2.40, 1.50, 2.50, 6.40),
    ("GRAD_EMP_2031_08", "2031-08-01", "2032-07-31", 3.10, 1.50, 2.50, 7.10),
    ("GRAD_EMP_2032_08", "2032-08-01", "2033-07-31", 3.80, 1.50, 2.50, 7.80),
    ("GRAD_EMP_2033_08", "2033-08-01", "2045-07-31", 4.50, 1.50, 2.50, 8.50),
]

FLOW_ITEMS = {
    "mensual_normativo": ["trabajo_pesado", "ley_sanna", "reforma_previsional"],
    "maestros": ["mutualidades_isl", "ccaf_entidades", "apv_apvc"],
    "empresa": ["ley_16744_empresa"],
}

APV_APVC_FALLBACK = [
    {"codigo": "000", "nombre": "No Cotiza A.P.V."},
    {"codigo": "003", "nombre": "Cuprum"},
    {"codigo": "005", "nombre": "Habitat"},
    {"codigo": "008", "nombre": "Provida"},
    {"codigo": "029", "nombre": "Planvital"},
    {"codigo": "033", "nombre": "Capital"},
    {"codigo": "034", "nombre": "Modelo"},
    {"codigo": "035", "nombre": "Uno"},
    {"codigo": "102", "nombre": "SANTANDER SEGUROS DE VIDA S.A."},
    {"codigo": "103", "nombre": "BCI SEGUROS VIDA S.A."},
    {"codigo": "106", "nombre": "BICE VIDA COMPANIA DE SEGUROS S.A."},
    {"codigo": "107", "nombre": "ZURICH CHILE SEGUROS DE VIDA."},
    {"codigo": "111", "nombre": "CIA DE SEG. DE VIDA CONSORCIO NACIONAL DE SEG S.A."},
    {"codigo": "116", "nombre": "COMPANIA DE SEGUROS CONFUTURO S.A."},
    {"codigo": "118", "nombre": "SEGUROS DE VIDA SURA S.A."},
    {"codigo": "121", "nombre": "METLIFE CHILE SEGUROS DE VIDA S.A."},
    {"codigo": "128", "nombre": "OHIO NATIONAL SEGUROS DE VIDA S.A."},
    {"codigo": "129", "nombre": "PRINCIPAL COMPANIA DE SEGUROS DE VIDA CHILE S.A."},
    {"codigo": "131", "nombre": "SEGUROS DE VIDA SECURITY PREVISION S.A."},
    {"codigo": "137", "nombre": "PRUDENTIAL AGF. (APV)"},
    {"codigo": "151", "nombre": "CREDICORP CAPITAL ASSET MANAGMENT S.A AGF"},
    {"codigo": "204", "nombre": "BCI ASSET MANAGEMENT ADMINISTRADORA GENERAL DE FONDOS S.A."},
    {"codigo": "205", "nombre": "BICE INVERSIONES AGF S.A."},
    {"codigo": "208", "nombre": "BTG PACTUAL CHILE S.A. ADMINISTRADORA GENERAL DE FONDOS"},
    {"codigo": "214", "nombre": "PRINCIPAL ASSET MANAGEMENT AGF S.A."},
    {"codigo": "215", "nombre": "SANTANDER ASSET MANAGEMENT S.A. ADM. GENERAL DE FONDOS"},
    {"codigo": "217", "nombre": "SCOTIA SUDAMERICANO ADMINISTRADORA DE FONDOS MUTUOS S.A."},
    {"codigo": "218", "nombre": "ADMINISTRADORA GENERAL DE FONDOS SECURITY S.A."},
    {"codigo": "225", "nombre": "ITAU ADMINISTRADORA GENERAL DE FONDOS S.A."},
    {"codigo": "229", "nombre": "BANCOESTADO S.A. ADMINISTRADORA GENERAL DE FONDOS"},
    {"codigo": "237", "nombre": "FINTUAL ADMINISTRADORA GENERAL DE FONDOS S.A"},
    {"codigo": "238", "nombre": "FOCUS AGF S.A."},
    {"codigo": "600", "nombre": "ZURICH CHILE ASSET MANAGEMENT ADMINISTRADORA GENERAL DE FONDOS S.A"},
    {"codigo": "601", "nombre": "LARRAIN VIAL ADMINISTRADORA GENERAL DE FONDOS S.A."},
    {"codigo": "213", "nombre": "LARRAIN VIAL S.A. CORREDORA DE BOLSA"},
    {"codigo": "222", "nombre": "BANCHILE CORREDORES DE BOLSA S.A."},
    {"codigo": "227", "nombre": "CORREDORES DE BOLSA SURA S.A."},
    {"codigo": "228", "nombre": "BTG PACTUAL CHILE S.A. CORREDORES DE BOLSA"},
    {"codigo": "232", "nombre": "BICE INVERSIONES CORREDORES DE BOLSA S.A."},
    {"codigo": "235", "nombre": "MBI CORREDORES DE BOLSA S.A."},
    {"codigo": "236", "nombre": "CONSORCIO CORREDORES DE BOLSA S.A."},
    {"codigo": "240", "nombre": "FINANZAS Y NEGOCIOS S.A. CORREDORES DE BOLSA"},
]

@dataclass
class SourceSnapshot:
    key: str
    url: str
    ok: bool
    status_code: int | None = None
    content_type: str | None = None
    text_path: str | None = None
    error: str | None = None


@dataclass
class FlowResult:
    flow: str
    status: str
    data: dict[str, Any] = field(default_factory=dict)
    warnings: list[str] = field(default_factory=list)


def normalize_space(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def fetch_url(url: str) -> requests.Response:
    return download_response(url, timeout=DEFAULT_TIMEOUT, headers=HEADERS)


def html_to_text(html: str) -> str:
    soup = BeautifulSoup(html, "lxml")
    return normalize_space(soup.get_text(" "))


def pdf_to_text(content: bytes) -> str:
    if pdfplumber is None:
        raise RuntimeError("pdfplumber no esta instalado; no puedo leer PDF")
    import io

    chunks: list[str] = []
    with pdfplumber.open(io.BytesIO(content)) as pdf:
        for page in pdf.pages:
            txt = page.extract_text() or ""
            if txt:
                chunks.append(txt)
    return "\n".join(chunks)


def snapshot_sources(keys: list[str], raw_dir: Path, offline: bool) -> tuple[dict[str, str], list[SourceSnapshot]]:
    raw_dir.mkdir(parents=True, exist_ok=True)
    texts: dict[str, str] = {}
    snapshots: list[SourceSnapshot] = []

    for key in keys:
        url = SOURCES[key]
        raw_path = raw_dir / f"{key}.txt"
        if offline:
            if raw_path.exists():
                texts[key] = raw_path.read_text(encoding="utf-8", errors="replace")
                snapshots.append(SourceSnapshot(key=key, url=url, ok=True, text_path=str(raw_path)))
            else:
                snapshots.append(SourceSnapshot(key=key, url=url, ok=False, error="raw no existe para modo offline"))
            continue

        try:
            response = fetch_url(url)
            content_type = response.headers.get("content-type", "")
            if "pdf" in content_type.lower() or url.lower().endswith(".pdf"):
                text = pdf_to_text(response.content)
            else:
                response.encoding = response.encoding or "utf-8"
                text = html_to_text(response.text)
            raw_path.write_text(text, encoding="utf-8")
            texts[key] = text
            snapshots.append(
                SourceSnapshot(
                    key=key,
                    url=url,
                    ok=True,
                    status_code=response.status_code,
                    content_type=content_type,
                    text_path=str(raw_path),
                )
            )
        except Exception as exc:
            snapshots.append(SourceSnapshot(key=key, url=url, ok=False, error=str(exc)))
    return texts, snapshots


def parse_trabajo_pesado(texts: dict[str, str]) -> FlowResult:
    text = texts.get("trabajo_pesado_compendio", "") + " " + texts.get("trabajo_pesado_pago", "")
    warnings: list[str] = []
    if not text:
        warnings.append("No se pudo descargar fuente de trabajo pesado; se usan valores normativos conocidos.")

    return FlowResult(
        flow="mensual_normativo",
        status="ok",
        data={
            "trabajo_pesado": [
                {
                    "codigo": "PESADO",
                    "nombre": "Trabajo pesado",
                    "tasa_trabajador": 2.0,
                    "tasa_empleador": 2.0,
                    "tasa_total": 4.0,
                    "requiere_dictamen_cen": True,
                    "fuente": SOURCES["trabajo_pesado_compendio"],
                },
                {
                    "codigo": "MENOS_PESADO",
                    "nombre": "Trabajo pesado con menor desgaste relativo",
                    "tasa_trabajador": 1.0,
                    "tasa_empleador": 1.0,
                    "tasa_total": 2.0,
                    "requiere_dictamen_cen": True,
                    "fuente": SOURCES["trabajo_pesado_compendio"],
                },
            ]
        },
        warnings=warnings,
    )


def parse_ley_sanna(texts: dict[str, str]) -> FlowResult:
    text = texts.get("sanna_ley_21010", "")
    value = 0.03
    match = re.search(r"0\s*,\s*03\s*%|0\s*\.\s*03\s*%", text)
    warnings = [] if match else ["No se pudo validar la tasa en la fuente descargada; se mantiene 0.03% por Ley 21.010."]
    return FlowResult(
        flow="mensual_normativo",
        status="ok",
        data={
            "ley_sanna": {
                "codigo": "SANNA",
                "nombre": "Seguro SANNA",
                "valor_decimal": value,
                "valor_entero": None,
                "vigencia_inicio": "2026-04-01",
                "vigencia_fin": None,
                "tasa_empleador": value,
                "tasa_trabajador": 0.0,
                "fuente": SOURCES["sanna_ley_21010"],
            }
        },
        warnings=warnings,
    )


def validate_reforma_previsional_gradualidad(rows: list[dict[str, Any]]) -> list[str]:
    warnings: list[str] = []
    previous_end: str | None = None

    for row in rows:
        total = round(
            float(row["cuenta_capitalizacion_individual"])
            + float(row["cotizacion_rentabilidad_protegida"])
            + float(row["seguro_social_sis_cev"]),
            2,
        )
        expected = round(float(row["aporte_empleador_total"]), 2)
        if total != expected:
            warnings.append(f"{row['codigo']}: suma {total:.2f}% no cuadra con total {expected:.2f}%.")

        inicio = str(row["vigencia_inicio"])
        fin = str(row["vigencia_fin"]) if row.get("vigencia_fin") else None
        if fin and inicio > fin:
            warnings.append(f"{row['codigo']}: vigencia_inicio mayor que vigencia_fin.")
        if previous_end and inicio <= previous_end:
            warnings.append(f"{row['codigo']}: rango solapado con el tramo anterior.")
        previous_end = fin

    checks = {
        "2025-08-01": 1.00,
        "2026-08-01": 3.50,
        "2033-08-01": 8.50,
    }
    by_start = {row["vigencia_inicio"]: row for row in rows}
    for inicio, expected in checks.items():
        row = by_start.get(inicio)
        if not row or round(float(row["aporte_empleador_total"]), 2) != expected:
            warnings.append(f"Control {inicio}: no resuelve total {expected:.2f}%.")

    return warnings


def parse_reforma_previsional(texts: dict[str, str]) -> FlowResult:
    text = " ".join(
        [
            texts.get("reforma_previsional_hacienda", ""),
            texts.get("reforma_previsional_chileatiende", ""),
            texts.get("reforma_previsional_sp", ""),
        ]
    )
    warnings: list[str] = []
    if not text:
        warnings.append("No se pudieron descargar fuentes de reforma previsional; se usa calendario normativo versionado por Ley 21.735.")

    rows = []
    for codigo, inicio, fin, cuenta_individual, crp, sis_cev, total in REFORMA_PREVISIONAL_GRADUALIDAD:
        rows.append(
            {
                "codigo": codigo,
                "periodo": inicio[:7],
                "vigencia_inicio": inicio,
                "vigencia_fin": fin,
                "aporte_empleador_total": total,
                "cuenta_capitalizacion_individual": cuenta_individual,
                "cotizacion_rentabilidad_protegida": crp,
                "seguro_social_sis_cev": sis_cev,
                # Compatibilidad con el modelo previo: FAPP/seguro social agregado.
                "fapp_seguro_social": round(crp + sis_cev, 2),
                "fuente": SOURCES["reforma_previsional_hacienda"],
                "fuente_complementaria": SOURCES["reforma_previsional_chileatiende"],
                "ley_referencia": "Ley N° 21.735, articulo cuarto transitorio",
                "observacion": "Gradualidad por mes de devengamiento de la remuneracion; no calcula liquidaciones.",
            }
        )

    warnings.extend(validate_reforma_previsional_gradualidad(rows))

    return FlowResult(
        flow="mensual_normativo",
        status="ok",
        data={"reforma_previsional": rows},
        warnings=warnings,
    )


def parse_mutualidades_isl(texts: dict[str, str]) -> FlowResult:
    text = texts.get("ley_16744_organismos", "")
    warnings: list[str] = []
    if not text:
        warnings.append("No se pudo descargar organismos Ley 16.744; se usa catalogo oficial base.")

    return FlowResult(
        flow="maestros",
        status="ok",
        data={
            "organismo_administrador_ley_16744": [
                {"codigo": "ACHS", "nombre": "Asociacion Chilena de Seguridad", "tipo": "MUTUALIDAD", "vigente": True},
                {"codigo": "MUSEG", "nombre": "Mutual de Seguridad de la Camara Chilena de la Construccion", "tipo": "MUTUALIDAD", "vigente": True},
                {"codigo": "IST", "nombre": "Instituto de Seguridad del Trabajo", "tipo": "MUTUALIDAD", "vigente": True},
                {"codigo": "ISL", "nombre": "Instituto de Seguridad Laboral", "tipo": "PUBLICO", "vigente": True},
            ],
            "ley_16744_parametros": {
                "cotizacion_basica_empleador": 0.90,
                "cotizacion_adicional_diferenciada": "depende de actividad/siniestralidad de la empresa",
                "fuente_financiamiento": SOURCES["ley_16744_financiamiento"],
                "fuente_organismos": SOURCES["ley_16744_organismos"],
            },
        },
        warnings=warnings,
    )


def parse_ccaf(texts: dict[str, str]) -> FlowResult:
    text = texts.get("ccaf_vigentes", "")
    names = [
        "CCAF Los Andes",
        "CCAF La Araucana",
        "CCAF Los Heroes",
        "CCAF 18 de Septiembre",
    ]
    if "Los Héroes" in text:
        names[2] = "CCAF Los Heroes"
    warnings = [] if text else ["No se pudo descargar pagina SUSESO CCAF; se usa catalogo base vigente."]
    return FlowResult(
        flow="maestros",
        status="ok",
        data={
            "ccaf_entidad": [
                {"codigo": "LOS_ANDES", "nombre": names[0], "vigente": True},
                {"codigo": "LA_ARAUCANA", "nombre": names[1], "vigente": True},
                {"codigo": "LOS_HEROES", "nombre": names[2], "vigente": True},
                {"codigo": "18_SEPTIEMBRE", "nombre": names[3], "vigente": True},
            ],
            "fuente": SOURCES["ccaf_vigentes"],
        },
        warnings=warnings,
    )


def parse_apv_apvc(texts: dict[str, str]) -> FlowResult:
    text = texts.get("previred_equivalencias", "")
    formas = [
        {"codigo": "1", "nombre": "Directa"},
        {"codigo": "2", "nombre": "Indirecta"},
    ]

    # El PDF de PreviRed viene en dos columnas y mezcla tablas en una misma linea.
    # Para evitar filas contaminadas, aceptamos solo codigos de tres digitos del bloque APV/APVC.
    expected = {row["codigo"]: row["nombre"] for row in APV_APVC_FALLBACK}
    parsed: dict[str, str] = {}
    for line in text.splitlines():
        clean = normalize_space(line)
        for match in re.finditer(r"(?<!\d)(\d{3})\s+(.+?)(?=(?:\s+\d{3}\s)|$)", clean):
            codigo = match.group(1)
            if codigo not in expected:
                continue
            nombre = match.group(2).strip()
            nombre = re.split(r"\s+Tabla\s+N", nombre, maxsplit=1)[0].strip()
            if not nombre or len(nombre) < 3:
                continue
            if any(token in nombre.upper() for token in ["CODIGO GLOSA", "MOVIMIENTO", "TRAMO", "LINEA", "REGIMEN"]):
                continue
            parsed[codigo] = nombre

    instituciones = []
    for row in APV_APVC_FALLBACK:
        nombre = parsed.get(row["codigo"], row["nombre"])
        instituciones.append({"codigo": row["codigo"], "nombre": nombre, "vigente": True})

    warnings: list[str] = []
    if len(parsed) < 20:
        warnings.append(
            "Extraccion APV/APVC incompleta desde PDF; se completo con catalogo base del mismo flujo PreviRed."
        )

    return FlowResult(
        flow="maestros",
        status="partial" if warnings else "ok",
        data={
            "institucion_apv": instituciones,
            "forma_pago_apv": formas,
            "fuente": SOURCES["previred_equivalencias"],
        },
        warnings=warnings,
    )


def build_empresa_flow() -> FlowResult:
    return FlowResult(
        flow="empresa",
        status="requires_company_data",
        data={
            "ley_16744_empresa": {
                "requiere_configuracion_empresa": True,
                "campos_recomendados": [
                    "organismo_administrador_codigo",
                    "tasa_adicional_diferenciada",
                    "vigencia_inicio",
                    "vigencia_fin",
                    "actividad_economica",
                    "fuente_resolucion_o_certificado",
                ],
                "nota": "La tasa adicional diferenciada no es universal; depende de actividad economica y/o siniestralidad efectiva de cada empleador.",
                "fuente": SOURCES["ley_16744_financiamiento"],
            }
        },
        warnings=[],
    )


def merge_results(results: list[FlowResult]) -> dict[str, Any]:
    merged: dict[str, Any] = {}
    for result in results:
        for key, value in result.data.items():
            merged[key] = value
    return merged


def sql_literal(value: Any) -> str:
    if value is None:
        return "NULL"
    if isinstance(value, bool):
        return "TRUE" if value else "FALSE"
    if isinstance(value, (int, float)):
        return str(value)
    return "'" + str(value).replace("'", "''") + "'"


def render_suggested_sql(payload: dict[str, Any]) -> str:
    lines = [
        "-- SQL sugerido para nuevas tablas/campos. Ajustar nombres al esquema final antes de aplicar.",
        "-- Generado por fetch_faltantes_v611.py",
        "",
    ]

    for row in payload.get("trabajo_pesado", []):
        lines.append(
            "-- trabajo_pesado_parametro "
            f"codigo={row['codigo']} trabajador={row['tasa_trabajador']} empleador={row['tasa_empleador']} total={row['tasa_total']}"
        )
    if payload.get("ley_sanna"):
        row = payload["ley_sanna"]
        lines.append(
            "-- parametros_legales "
            f"nombre={sql_literal(row['codigo'])} valor_decimal={row.get('valor_decimal', row.get('tasa_empleador'))} vigencia_inicio={row.get('vigencia_inicio')}"
        )
    for row in payload.get("reforma_previsional", []):
        lines.append(
            "-- reforma_previsional_parametro "
            f"{row['vigencia_inicio']}..{row['vigencia_fin']} total={row['aporte_empleador_total']} "
            f"cci={row['cuenta_capitalizacion_individual']} crp={row.get('cotizacion_rentabilidad_protegida')} "
            f"sis_cev={row.get('seguro_social_sis_cev')}"
        )
    for row in payload.get("organismo_administrador_ley_16744", []):
        lines.append(
            "-- organismo_administrador_ley_16744 "
            f"codigo={row['codigo']} nombre={sql_literal(row['nombre'])} tipo={row['tipo']}"
        )
    for row in payload.get("ccaf_entidad", []):
        lines.append(f"-- ccaf_entidad codigo={row['codigo']} nombre={sql_literal(row['nombre'])}")
    for row in payload.get("forma_pago_apv", payload.get("apv_apvc_forma_pago", [])):
        lines.append(f"-- forma_pago_apv codigo={row['codigo']} nombre={sql_literal(row['nombre'])}")
    for row in payload.get("institucion_apv", payload.get("apv_apvc_institucion", []))[:50]:
        lines.append(f"-- institucion_apv codigo={row['codigo']} nombre={sql_literal(row['nombre'])}")

    return "\n".join(lines) + "\n"


def select_source_keys(flow: str) -> list[str]:
    keys: set[str] = set()
    if flow in {"all", "mensual_normativo"}:
        keys.update([
            "trabajo_pesado_compendio",
            "trabajo_pesado_pago",
            "sanna_ley_21010",
            "reforma_previsional_hacienda",
            "reforma_previsional_chileatiende",
            "reforma_previsional_sp",
        ])
    if flow in {"all", "maestros"}:
        keys.update(["ley_16744_financiamiento", "ley_16744_organismos", "ccaf_vigentes", "previred_equivalencias"])
    if flow in {"all", "empresa"}:
        keys.update(["ley_16744_financiamiento"])
    return sorted(keys)


def build_results(flow: str, texts: dict[str, str]) -> list[FlowResult]:
    results: list[FlowResult] = []
    if flow in {"all", "mensual_normativo"}:
        results.extend([parse_trabajo_pesado(texts), parse_ley_sanna(texts), parse_reforma_previsional(texts)])
    if flow in {"all", "maestros"}:
        results.extend([parse_mutualidades_isl(texts), parse_ccaf(texts), parse_apv_apvc(texts)])
    if flow in {"all", "empresa"}:
        results.append(build_empresa_flow())
    return results

def rows_values(rows: Iterable[Iterable[Any]]) -> str:
    return ",\n  ".join("(" + ", ".join(sql_literal(value) for value in row) + ")" for row in rows)


def render_compare_notice(table: str, actual_sql: str, expected_sql: str, label: str) -> str:
    return f"""DO $$
DECLARE
    actual_count INTEGER;
    diff_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO actual_count FROM ({actual_sql}) actual_rows;

    SELECT COUNT(*) INTO diff_count
    FROM (
        SELECT * FROM (
            ({actual_sql})
            EXCEPT
            ({expected_sql})
        ) actual_minus_expected
        UNION ALL
        SELECT * FROM (
            ({expected_sql})
            EXCEPT
            ({actual_sql})
        ) expected_minus_actual
    ) diff_rows;

    IF actual_count = 0 THEN
        RAISE NOTICE '{label}: no existia data previa para el periodo; se insertara.';
    ELSIF diff_count = 0 THEN
        RAISE NOTICE '{label}: la data existente ya es igual al archivo generado; se reemplaza igual para dejar carga limpia.';
    ELSE
        RAISE NOTICE '{label}: existen diferencias contra el archivo generado; se reemplaza la data del periodo.';
    END IF;
END $$;
"""


def render_sql(payload: dict[str, Any]) -> str:
    periodo = payload["periodo_remuneracion"]["codigo"]
    vigencia_inicio = payload["periodo_remuneracion"]["fecha_inicio"]

    lines: list[str] = [
        "-- Fase 2 mensual v6.11",
        "-- Generado por render_parametros_mensuales_v611.py",
        "-- Verifica si la data del periodo ya existe y si es igual antes de reemplazarla.",
        "BEGIN;",
        "",
    ]

    periodo_row = payload["periodo_remuneracion"]
    estado_mensual = str(periodo_row.get("estado") or "").lower()
    if estado_mensual not in {"corregido", "cerrado"}:
        estado_mensual = "cargado"
    lines.append(
        "INSERT INTO periodo_remuneracion (codigo, anio, mes, fecha_inicio, fecha_fin, estado) VALUES "
        f"({sql_literal(periodo_row['codigo'])}, {sql_literal(periodo_row['anio'])}, {sql_literal(periodo_row['mes'])}, "
        f"{sql_literal(periodo_row['fecha_inicio'])}, {sql_literal(periodo_row['fecha_fin'])}, {sql_literal(estado_mensual)}) "
        "ON CONFLICT (codigo) DO UPDATE SET "
        "fecha_inicio = EXCLUDED.fecha_inicio, "
        "fecha_fin = EXCLUDED.fecha_fin, "
        "estado = CASE WHEN periodo_remuneracion.estado IN ('cerrado', 'corregido') THEN periodo_remuneracion.estado ELSE EXCLUDED.estado END;"
    )
    lines.append("")

    parametros_legales = payload.get("parametros_legales", [])
    if parametros_legales:
        expected_rows = [
            (
                row["nombre"],
                row.get("valor_decimal"),
                row.get("valor_entero"),
                row["vigencia_inicio"],
                row.get("vigencia_fin"),
                row.get("periodo") or periodo,
            )
            for row in parametros_legales
        ]
        names = ", ".join(sql_literal(row["nombre"]) for row in parametros_legales)
        leg_filter = (
            f"vigencia_inicio = DATE {sql_literal(vigencia_inicio)} AND nombre IN ({names}) "
            f"AND (periodo = {sql_literal(periodo)} OR periodo IS NULL)"
        )
        lines.extend(
            [
                "CREATE TEMP TABLE _expected_parametros_legales (nombre TEXT, valor_decimal NUMERIC, valor_entero INTEGER, vigencia_inicio DATE, vigencia_fin DATE, periodo TEXT) ON COMMIT DROP;",
                "INSERT INTO _expected_parametros_legales (nombre, valor_decimal, valor_entero, vigencia_inicio, vigencia_fin, periodo) VALUES",
                f"  {rows_values(expected_rows)};",
                "",
                render_compare_notice(
                    "parametros_legales",
                    f"SELECT nombre::TEXT, valor_decimal, valor_entero, vigencia_inicio, vigencia_fin, periodo::TEXT FROM parametros_legales WHERE {leg_filter}",
                    "SELECT nombre, valor_decimal, valor_entero, vigencia_inicio, vigencia_fin, periodo FROM _expected_parametros_legales",
                    "parametros_legales",
                ).rstrip(),
                f"DELETE FROM parametros_legales WHERE nombre IN (SELECT nombre FROM _expected_parametros_legales) AND vigencia_inicio = DATE {sql_literal(vigencia_inicio)} AND (periodo = {sql_literal(periodo)} OR periodo IS NULL);",
                "INSERT INTO parametros_legales (nombre, valor_decimal, valor_entero, vigencia_inicio, vigencia_fin, periodo)",
                "SELECT nombre, valor_decimal, valor_entero, vigencia_inicio, vigencia_fin, periodo FROM _expected_parametros_legales;",
                "",
            ]
        )

    compat = payload.get("parametros_generales_compat")
    if compat:
        columns = PARAMETROS_GENERALES_V11_COLUMNS
        col_sql = ", ".join(columns)
        type_sql = PARAMETROS_GENERALES_V11_TEMP_TYPES
        values = tuple(compat.get(column) for column in columns)
        lines.extend(
            [
                f"CREATE TEMP TABLE _expected_parametros_generales ({type_sql}) ON COMMIT DROP;",
                f"INSERT INTO _expected_parametros_generales ({col_sql}) VALUES",
                f"  {rows_values([values])};",
                "",
                render_compare_notice(
                    "parametros_generales",
                    f"SELECT {col_sql} FROM parametros_generales WHERE periodo = {sql_literal(periodo)}",
                    f"SELECT {col_sql} FROM _expected_parametros_generales",
                    "parametros_generales",
                ).rstrip(),
                f"DELETE FROM parametros_generales WHERE periodo = {sql_literal(periodo)};",
                f"INSERT INTO parametros_generales ({col_sql}) SELECT {col_sql} FROM _expected_parametros_generales;",
                "",
            ]
        )

    afc_rows = payload.get("afc_parametro", [])
    if afc_rows:
        expected_rows = [
            (
                row["codigo_tipo_contrato"],
                row["aplica_seguro"],
                row["aplica_trabajador"],
                row["tasa_trabajador"],
                row["tasa_empleador"],
                row["vigencia_inicio"],
                row.get("vigencia_fin"),
                row.get("observacion"),
                row.get("periodo") or periodo,
            )
            for row in afc_rows
        ]
        lines.extend(
            [
                "CREATE TEMP TABLE _expected_afc_parametro (codigo_tipo_contrato tipo_contrato_enum, aplica_seguro BOOLEAN, aplica_trabajador BOOLEAN, tasa_trabajador NUMERIC, tasa_empleador NUMERIC, vigencia_inicio DATE, vigencia_fin DATE, observacion TEXT, periodo TEXT) ON COMMIT DROP;",
                "INSERT INTO _expected_afc_parametro (codigo_tipo_contrato, aplica_seguro, aplica_trabajador, tasa_trabajador, tasa_empleador, vigencia_inicio, vigencia_fin, observacion, periodo) VALUES",
                f"  {rows_values(expected_rows)};",
                "",
                render_compare_notice(
                    "afc_parametro",
                    f"SELECT codigo_tipo_contrato, aplica_seguro, aplica_trabajador, tasa_trabajador, tasa_empleador, vigencia_inicio, vigencia_fin, observacion, periodo::TEXT FROM afc_parametro WHERE vigencia_inicio = DATE {sql_literal(vigencia_inicio)} AND (periodo = {sql_literal(periodo)} OR periodo IS NULL)",
                    "SELECT codigo_tipo_contrato, aplica_seguro, aplica_trabajador, tasa_trabajador, tasa_empleador, vigencia_inicio, vigencia_fin, observacion, periodo FROM _expected_afc_parametro",
                    "afc_parametro",
                ).rstrip(),
                f"DELETE FROM afc_parametro WHERE vigencia_inicio = DATE {sql_literal(vigencia_inicio)} AND (periodo = {sql_literal(periodo)} OR periodo IS NULL);",
                "INSERT INTO afc_parametro (codigo_tipo_contrato, aplica_seguro, aplica_trabajador, tasa_trabajador, tasa_empleador, vigencia_inicio, vigencia_fin, observacion, periodo)",
                "SELECT codigo_tipo_contrato, aplica_seguro, aplica_trabajador, tasa_trabajador, tasa_empleador, vigencia_inicio, vigencia_fin, observacion, periodo FROM _expected_afc_parametro;",
                "",
            ]
        )

    tramo_carga = payload.get("tramo_carga", [])
    if tramo_carga:
        expected_rows = [(row["periodo"], row.get("desde"), row.get("hasta"), row.get("valor"), row.get("tramo")) for row in tramo_carga]
        lines.extend(
            [
                "CREATE TEMP TABLE _expected_tramo_carga (periodo TEXT, desde NUMERIC, hasta NUMERIC, valor NUMERIC, tramo TEXT) ON COMMIT DROP;",
                "INSERT INTO _expected_tramo_carga (periodo, desde, hasta, valor, tramo) VALUES",
                f"  {rows_values(expected_rows)};",
                "",
                render_compare_notice(
                    "tramo_carga",
                    f"SELECT periodo::TEXT, desde, hasta, valor, tramo::TEXT FROM tramo_carga WHERE periodo = {sql_literal(periodo)}",
                    "SELECT periodo, desde, hasta, valor, tramo FROM _expected_tramo_carga",
                    "tramo_carga",
                ).rstrip(),
                *render_tramo_carga_merge(periodo),
            ]
        )

    tabla_impuesto = payload.get("tabla_impuesto_unico", [])
    if tabla_impuesto:
        expected_rows = [
            (row["tramo"], row["desde"], row.get("hasta"), row["factor"], row["rebaja"], row["vigencia_inicio"], row.get("vigencia_fin"))
            for row in tabla_impuesto
        ]
        lines.extend(
            [
                "CREATE TEMP TABLE _expected_tabla_impuesto_unico (tramo INTEGER, desde NUMERIC, hasta NUMERIC, factor NUMERIC, rebaja NUMERIC, vigencia_inicio DATE, vigencia_fin DATE) ON COMMIT DROP;",
                "INSERT INTO _expected_tabla_impuesto_unico (tramo, desde, hasta, factor, rebaja, vigencia_inicio, vigencia_fin) VALUES",
                f"  {rows_values(expected_rows)};",
                "",
                render_compare_notice(
                    "tabla_impuesto_unico",
                    f"SELECT tramo, desde, hasta, factor, rebaja, vigencia_inicio, vigencia_fin FROM tabla_impuesto_unico WHERE vigencia_inicio = DATE {sql_literal(vigencia_inicio)}",
                    "SELECT tramo, desde, hasta, factor, rebaja, vigencia_inicio, vigencia_fin FROM _expected_tabla_impuesto_unico",
                    "tabla_impuesto_unico",
                ).rstrip(),
                f"DELETE FROM tabla_impuesto_unico WHERE vigencia_inicio = DATE {sql_literal(vigencia_inicio)};",
                "INSERT INTO tabla_impuesto_unico (tramo, desde, hasta, factor, rebaja, vigencia_inicio, vigencia_fin)",
                "SELECT tramo, desde, hasta, factor, rebaja, vigencia_inicio, vigencia_fin FROM _expected_tabla_impuesto_unico;",
                "",
            ]
        )

    if tabla_impuesto:
        lines.extend(render_tramo_impuesto_sync_from_tabla(periodo, vigencia_inicio))

    updates = payload.get("afp_vigencia_updates", [])
    if updates:
        expected_rows = [(row["afp_nombre"], row["vigencia_inicio"], row["sis"], row["tope_imponible_uf"]) for row in updates]
        lines.extend(
            [
                "CREATE TEMP TABLE _expected_afp_vigencia_update (afp_nombre TEXT, vigencia_inicio DATE, sis NUMERIC, tope_imponible_uf NUMERIC) ON COMMIT DROP;",
                "INSERT INTO _expected_afp_vigencia_update (afp_nombre, vigencia_inicio, sis, tope_imponible_uf) VALUES",
                f"  {rows_values(expected_rows)};",
                "",
                render_compare_notice(
                    "afp_vigencia",
                    f"SELECT a.nombre::TEXT AS afp_nombre, av.vigencia_inicio, av.sis, av.tope_imponible_uf FROM afp_vigencia av JOIN afp a ON a.id_afp = av.id_afp WHERE av.vigencia_inicio = DATE {sql_literal(vigencia_inicio)} AND a.nombre IN (SELECT afp_nombre FROM _expected_afp_vigencia_update)",
                    "SELECT afp_nombre, vigencia_inicio, sis, tope_imponible_uf FROM _expected_afp_vigencia_update",
                    "afp_vigencia",
                ).rstrip(),
                "UPDATE afp_vigencia av",
                "SET sis = expected.sis,",
                "    tope_imponible_uf = expected.tope_imponible_uf",
                "FROM afp a",
                "JOIN _expected_afp_vigencia_update expected ON expected.afp_nombre = a.nombre",
                "WHERE av.id_afp = a.id_afp",
                "  AND av.vigencia_inicio = expected.vigencia_inicio;",
                "",
            ]
        )

    lines.extend(["COMMIT;", ""])
    return "\n".join(lines)


# -----------------------------------------------------------------------------
# SQL ejecutable para los "faltantes" normativos
# -----------------------------------------------------------------------------

_IDENTIFIER_RE = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")


def quote_ident(identifier: str) -> str:
    """Devuelve un identificador SQL seguro para PostgreSQL."""
    if not _IDENTIFIER_RE.match(identifier):
        raise ValueError(f"Identificador SQL invalido: {identifier!r}")
    return '"' + identifier.replace('"', '""') + '"'


def qname(table: str, schema: str = "public") -> str:
    return f"{quote_ident(schema)}.{quote_ident(table)}"


def insert_values_sql(
    table: str,
    columns: list[str],
    rows: list[tuple[Any, ...]],
    conflict: str,
    update_columns: list[str],
    schema: str = "public",
) -> str:
    if not rows:
        return ""
    col_sql = ", ".join(quote_ident(column) for column in columns)
    values_sql = rows_values(rows)
    update_sql = ", ".join(f"{quote_ident(column)} = EXCLUDED.{quote_ident(column)}" for column in update_columns)
    return (
        f"INSERT INTO {qname(table, schema)} ({col_sql}) VALUES\n"
        f"  {values_sql}\n"
        f"ON CONFLICT ({conflict}) DO UPDATE SET {update_sql};"
    )


def render_faltantes_sql(payload: dict[str, Any], schema: str = "public") -> str:
    """Renderiza SQL aplicable para catalogos/parametros normativos v6.11.

    Alineado con 02_tablas.sql:
    - No crea apv_apvc_institucion ni apv_apvc_forma_pago.
    - Usa institucion_apv y forma_pago_apv.
    - SANNA se guarda en parametros_legales.
    - Ley 16.744 usa descripcion_tasa_adicional.
    - No usa columnas de auditoria que no existan en el esquema.
    """
    lines: list[str] = [
        "-- Fase faltantes normativos v6.11",
        "-- Generado por parametros_v611_unificado.py",
        "-- Alineado a 02_tablas.sql: APV real y SANNA en parametros_legales.",
        "BEGIN;",
        "",
        f"CREATE TABLE IF NOT EXISTS {qname('parametros_legales', schema)} (",
        "    id_parametro SERIAL PRIMARY KEY,",
        "    nombre VARCHAR(100) NOT NULL,",
        "    valor_decimal NUMERIC(18,6),",
        "    valor_entero INTEGER,",
        "    vigencia_inicio DATE NOT NULL,",
        "    vigencia_fin DATE,",
        "    CONSTRAINT uq_parametros_legales UNIQUE (nombre, vigencia_inicio)",
        ");",
        "",
        f"CREATE TABLE IF NOT EXISTS {qname('trabajo_pesado_parametro', schema)} (",
        "    id_trabajo_pesado_parametro SERIAL PRIMARY KEY,",
        "    codigo VARCHAR(30) NOT NULL,",
        "    periodo VARCHAR(7) NOT NULL,",
        "    nombre VARCHAR(150) NOT NULL,",
        "    tasa_trabajador NUMERIC(7,4) NOT NULL,",
        "    tasa_empleador NUMERIC(7,4) NOT NULL,",
        "    tasa_total NUMERIC(7,4) NOT NULL,",
        "    requiere_dictamen_cen BOOLEAN NOT NULL DEFAULT TRUE,",
        "    fuente TEXT,",
        "    vigente BOOLEAN NOT NULL DEFAULT TRUE,",
        "    vigencia_inicio DATE NOT NULL DEFAULT DATE '2025-08-01',",
        "    vigencia_fin DATE,",
        "    CONSTRAINT uq_trabajo_pesado_codigo_periodo UNIQUE (codigo, periodo),",
        "    CONSTRAINT chk_trabajo_pesado_periodo_fmt CHECK (periodo ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),",
        "    CONSTRAINT chk_trabajo_pesado_tasas CHECK (tasa_trabajador >= 0 AND tasa_empleador >= 0 AND tasa_total >= 0),",
        "    CONSTRAINT chk_trabajo_pesado_vigencia CHECK (vigencia_fin IS NULL OR vigencia_fin >= vigencia_inicio)",
        ");",
        f"ALTER TABLE {qname('trabajo_pesado_parametro', schema)} ADD COLUMN IF NOT EXISTS periodo VARCHAR(7);",
        f"UPDATE {qname('trabajo_pesado_parametro', schema)} SET periodo = to_char(vigencia_inicio, 'YYYY-MM') WHERE periodo IS NULL;",
        f"ALTER TABLE {qname('trabajo_pesado_parametro', schema)} ALTER COLUMN periodo SET NOT NULL;",
        f"ALTER TABLE {qname('trabajo_pesado_parametro', schema)} DROP CONSTRAINT IF EXISTS trabajo_pesado_parametro_codigo_key;",
        f"ALTER TABLE {qname('trabajo_pesado_parametro', schema)} DROP CONSTRAINT IF EXISTS uq_trabajo_pesado_codigo_periodo;",
        f"ALTER TABLE {qname('trabajo_pesado_parametro', schema)} ADD CONSTRAINT uq_trabajo_pesado_codigo_periodo UNIQUE (codigo, periodo);",
        f"ALTER TABLE {qname('trabajo_pesado_parametro', schema)} DROP CONSTRAINT IF EXISTS chk_trabajo_pesado_periodo_fmt;",
        f"ALTER TABLE {qname('trabajo_pesado_parametro', schema)} ADD CONSTRAINT chk_trabajo_pesado_periodo_fmt CHECK (periodo ~ '^[0-9]{{4}}-(0[1-9]|1[0-2])$');",
        "",
        f"CREATE TABLE IF NOT EXISTS {qname('reforma_previsional_parametro', schema)} (",
        "    id_reforma_previsional_parametro SERIAL PRIMARY KEY,",
        "    codigo VARCHAR(30),",
        "    vigencia_inicio DATE NOT NULL,",
        "    vigencia_fin DATE,",
        "    aporte_empleador_total NUMERIC(7,4) NOT NULL,",
        "    cuenta_capitalizacion_individual NUMERIC(7,4) NOT NULL,",
        "    cotizacion_rentabilidad_protegida NUMERIC(7,4) NOT NULL DEFAULT 0,",
        "    seguro_social_sis_cev NUMERIC(7,4) NOT NULL DEFAULT 0,",
        "    fapp_seguro_social NUMERIC(7,4) NOT NULL,",
        "    fuente TEXT,",
        "    ley_referencia TEXT,",
        "    observacion TEXT,",
        "    CONSTRAINT uq_reforma_previsional_parametro UNIQUE (vigencia_inicio),",
        "    CONSTRAINT chk_reforma_previsional_tasas CHECK (",
        "        aporte_empleador_total >= 0",
        "        AND cuenta_capitalizacion_individual >= 0",
        "        AND cotizacion_rentabilidad_protegida >= 0",
        "        AND seguro_social_sis_cev >= 0",
        "        AND fapp_seguro_social >= 0",
        "        AND ROUND((cuenta_capitalizacion_individual + cotizacion_rentabilidad_protegida + seguro_social_sis_cev)::numeric, 4) = ROUND(aporte_empleador_total::numeric, 4)",
        "        AND ROUND((cotizacion_rentabilidad_protegida + seguro_social_sis_cev)::numeric, 4) = ROUND(fapp_seguro_social::numeric, 4)",
        "    ),",
        "    CONSTRAINT chk_reforma_previsional_vigencia CHECK (vigencia_fin IS NULL OR vigencia_fin >= vigencia_inicio)",
        ");",
        "",
        f"ALTER TABLE {qname('reforma_previsional_parametro', schema)} ADD COLUMN IF NOT EXISTS codigo VARCHAR(30);",
        f"ALTER TABLE {qname('reforma_previsional_parametro', schema)} ADD COLUMN IF NOT EXISTS cotizacion_rentabilidad_protegida NUMERIC(7,4) NOT NULL DEFAULT 0;",
        f"ALTER TABLE {qname('reforma_previsional_parametro', schema)} ADD COLUMN IF NOT EXISTS seguro_social_sis_cev NUMERIC(7,4) NOT NULL DEFAULT 0;",
        f"ALTER TABLE {qname('reforma_previsional_parametro', schema)} ADD COLUMN IF NOT EXISTS ley_referencia TEXT;",
        f"ALTER TABLE {qname('reforma_previsional_parametro', schema)} ADD COLUMN IF NOT EXISTS observacion TEXT;",
        f"UPDATE {qname('reforma_previsional_parametro', schema)} SET seguro_social_sis_cev = fapp_seguro_social WHERE seguro_social_sis_cev = 0 AND fapp_seguro_social > 0;",
        "",
        f"CREATE TABLE IF NOT EXISTS {qname('organismo_administrador_ley_16744', schema)} (",
        "    id_organismo_administrador_ley_16744 SERIAL PRIMARY KEY,",
        "    codigo VARCHAR(30) NOT NULL UNIQUE,",
        "    nombre VARCHAR(150) NOT NULL UNIQUE,",
        "    tipo VARCHAR(30) NOT NULL,",
        "    vigente BOOLEAN NOT NULL DEFAULT TRUE",
        ");",
        "",
        f"CREATE TABLE IF NOT EXISTS {qname('ley_16744_parametros', schema)} (",
        "    id_ley_16744_parametro SERIAL PRIMARY KEY,",
        "    codigo VARCHAR(30) NOT NULL,",
        "    periodo VARCHAR(7) NOT NULL,",
        "    cotizacion_basica_empleador NUMERIC(7,4) NOT NULL,",
        "    descripcion_tasa_adicional TEXT,",
        "    fuente_financiamiento TEXT,",
        "    fuente_organismos TEXT,",
        "    vigente BOOLEAN NOT NULL DEFAULT TRUE,",
        "    vigencia_inicio DATE NOT NULL DEFAULT DATE '2026-04-01',",
        "    vigencia_fin DATE,",
        "    CONSTRAINT uq_ley_16744_codigo_periodo UNIQUE (codigo, periodo),",
        "    CONSTRAINT chk_ley_16744_periodo_fmt CHECK (periodo ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),",
        "    CONSTRAINT chk_ley_16744_parametros_tasa CHECK (cotizacion_basica_empleador >= 0),",
        "    CONSTRAINT chk_ley_16744_parametros_vigencia CHECK (vigencia_fin IS NULL OR vigencia_fin >= vigencia_inicio)",
        ");",
        f"ALTER TABLE {qname('ley_16744_parametros', schema)} ADD COLUMN IF NOT EXISTS periodo VARCHAR(7);",
        f"UPDATE {qname('ley_16744_parametros', schema)} SET periodo = to_char(vigencia_inicio, 'YYYY-MM') WHERE periodo IS NULL;",
        f"ALTER TABLE {qname('ley_16744_parametros', schema)} ALTER COLUMN periodo SET NOT NULL;",
        f"ALTER TABLE {qname('ley_16744_parametros', schema)} DROP CONSTRAINT IF EXISTS ley_16744_parametros_codigo_key;",
        f"ALTER TABLE {qname('ley_16744_parametros', schema)} DROP CONSTRAINT IF EXISTS uq_ley_16744_codigo_periodo;",
        f"ALTER TABLE {qname('ley_16744_parametros', schema)} ADD CONSTRAINT uq_ley_16744_codigo_periodo UNIQUE (codigo, periodo);",
        f"ALTER TABLE {qname('ley_16744_parametros', schema)} DROP CONSTRAINT IF EXISTS chk_ley_16744_periodo_fmt;",
        f"ALTER TABLE {qname('ley_16744_parametros', schema)} ADD CONSTRAINT chk_ley_16744_periodo_fmt CHECK (periodo ~ '^[0-9]{{4}}-(0[1-9]|1[0-2])$');",
        "",
        f"CREATE TABLE IF NOT EXISTS {qname('ccaf_entidad', schema)} (",
        "    id_ccaf_entidad SERIAL PRIMARY KEY,",
        "    codigo VARCHAR(30) NOT NULL UNIQUE,",
        "    nombre VARCHAR(150) NOT NULL UNIQUE,",
        "    vigente BOOLEAN NOT NULL DEFAULT TRUE,",
        "    fuente TEXT",
        ");",
        "",
        f"CREATE TABLE IF NOT EXISTS {qname('forma_pago_apv', schema)} (",
        "    id_forma_pago_apv SERIAL PRIMARY KEY,",
        "    codigo VARCHAR(10) UNIQUE,",
        "    nombre VARCHAR(100) NOT NULL UNIQUE,",
        "    vigente BOOLEAN NOT NULL DEFAULT TRUE",
        ");",
        "",
        f"CREATE TABLE IF NOT EXISTS {qname('institucion_apv', schema)} (",
        "    id_institucion_apv SERIAL PRIMARY KEY,",
        "    codigo VARCHAR(10) UNIQUE,",
        "    nombre VARCHAR(150) NOT NULL UNIQUE,",
        "    vigente BOOLEAN NOT NULL DEFAULT TRUE",
        ");",
        "",
    ]

    trabajo_pesado = payload.get("trabajo_pesado", []) or []
    if trabajo_pesado:
        rows = [
            (
                row["codigo"], row.get("periodo") or str(row.get("vigencia_inicio", "2025-08-01"))[:7],
                row["nombre"], row["tasa_trabajador"], row["tasa_empleador"], row["tasa_total"],
                row.get("requiere_dictamen_cen", True), row.get("fuente"), row.get("vigente", True),
                row.get("vigencia_inicio", "2025-08-01"), row.get("vigencia_fin"),
            )
            for row in trabajo_pesado
        ]
        lines.append(insert_values_sql(
            "trabajo_pesado_parametro",
            ["codigo", "periodo", "nombre", "tasa_trabajador", "tasa_empleador", "tasa_total", "requiere_dictamen_cen", "fuente", "vigente", "vigencia_inicio", "vigencia_fin"],
            rows,
            f"{quote_ident('codigo')}, {quote_ident('periodo')}",
            ["nombre", "tasa_trabajador", "tasa_empleador", "tasa_total", "requiere_dictamen_cen", "fuente", "vigente", "vigencia_inicio", "vigencia_fin"],
            schema,
        ))
        lines.append("")

    ley_sanna = payload.get("ley_sanna")
    if ley_sanna:
        sanna_name = ley_sanna.get("codigo") or ley_sanna.get("nombre") or "SANNA"
        lines.append(insert_values_sql(
            "parametros_legales",
            ["nombre", "valor_decimal", "valor_entero", "vigencia_inicio", "vigencia_fin"],
            [(sanna_name, ley_sanna.get("valor_decimal", ley_sanna.get("tasa_empleador")), ley_sanna.get("valor_entero"), ley_sanna.get("vigencia_inicio", "2026-04-01"), ley_sanna.get("vigencia_fin"))],
            f"{quote_ident('nombre')}, {quote_ident('vigencia_inicio')}",
            ["valor_decimal", "valor_entero", "vigencia_fin"],
            schema,
        ))
        lines.append("")

    reforma = payload.get("reforma_previsional", []) or []
    if reforma:
        def _normalize_reforma_row(row: dict[str, Any]) -> tuple[Any, Any, Any, Any, Any, Any, Any, Any, Any, Any, Any]:
            """Normaliza gradualidad para cumplir chk_reforma_previsional_tasas (v6.11).

            Regla:
            - cuenta + CRP + seguro = total
            - CRP + seguro = fapp

            Algunos payloads históricos traen `fapp_seguro_social` pero `seguro_social_sis_cev=0`,
            lo que rompe la constraint al insertar.
            """
            codigo = row.get("codigo")
            vig_ini = row["vigencia_inicio"]
            vig_fin = row.get("vigencia_fin")
            total = float(row["aporte_empleador_total"])
            cuenta = float(row["cuenta_capitalizacion_individual"])

            crp = float(row.get("cotizacion_rentabilidad_protegida") or 0)
            seguro_raw = row.get("seguro_social_sis_cev")
            seguro = float(seguro_raw) if seguro_raw not in (None, "") else 0.0
            fapp_raw = row.get("fapp_seguro_social")
            fapp = float(fapp_raw) if fapp_raw not in (None, "") else 0.0

            if seguro == 0.0 and fapp > 0.0 and crp == 0.0:
                seguro = fapp

            expected_total = round(cuenta + crp + seguro, 4)
            if round(total, 4) != expected_total:
                seguro = max(0.0, round(total - cuenta - crp, 4))

            fapp = round(crp + seguro, 4)

            return (
                codigo,
                vig_ini,
                vig_fin,
                round(total, 4),
                round(cuenta, 4),
                round(crp, 4),
                round(seguro, 4),
                fapp,
                row.get("fuente"),
                row.get("ley_referencia"),
                row.get("observacion"),
            )

        rows = [_normalize_reforma_row(row) for row in reforma]
        lines.append(insert_values_sql(
            "reforma_previsional_parametro",
            ["codigo", "vigencia_inicio", "vigencia_fin", "aporte_empleador_total", "cuenta_capitalizacion_individual", "cotizacion_rentabilidad_protegida", "seguro_social_sis_cev", "fapp_seguro_social", "fuente", "ley_referencia", "observacion"],
            rows,
            quote_ident("vigencia_inicio"),
            ["codigo", "vigencia_fin", "aporte_empleador_total", "cuenta_capitalizacion_individual", "cotizacion_rentabilidad_protegida", "seguro_social_sis_cev", "fapp_seguro_social", "fuente", "ley_referencia", "observacion"],
            schema,
        ))
        lines.append("")

    organismos = payload.get("organismo_administrador_ley_16744", []) or []
    if organismos:
        rows = [(row["codigo"], row["nombre"], row["tipo"], row.get("vigente", True)) for row in organismos]
        lines.append(insert_values_sql(
            "organismo_administrador_ley_16744",
            ["codigo", "nombre", "tipo", "vigente"],
            rows,
            quote_ident("codigo"),
            ["nombre", "tipo", "vigente"],
            schema,
        ))
        lines.append("")

    ley_16744 = payload.get("ley_16744_parametros")
    if ley_16744:
        lines.append(insert_values_sql(
            "ley_16744_parametros",
            ["codigo", "periodo", "cotizacion_basica_empleador", "descripcion_tasa_adicional", "fuente_financiamiento", "fuente_organismos", "vigente", "vigencia_inicio", "vigencia_fin"],
            [(ley_16744.get("codigo", "LEY_16744"), ley_16744.get("periodo") or str(ley_16744.get("vigencia_inicio", "2026-04-01"))[:7], ley_16744.get("cotizacion_basica_empleador"), ley_16744.get("descripcion_tasa_adicional", ley_16744.get("cotizacion_adicional_diferenciada")), ley_16744.get("fuente_financiamiento"), ley_16744.get("fuente_organismos"), ley_16744.get("vigente", True), ley_16744.get("vigencia_inicio", "2026-04-01"), ley_16744.get("vigencia_fin"))],
            f"{quote_ident('codigo')}, {quote_ident('periodo')}",
            ["cotizacion_basica_empleador", "descripcion_tasa_adicional", "fuente_financiamiento", "fuente_organismos", "vigente", "vigencia_inicio", "vigencia_fin"],
            schema,
        ))
        lines.append("")

    ccaf = payload.get("ccaf_entidad", []) or []
    if ccaf:
        rows = [(row["codigo"], row["nombre"], row.get("vigente", True), row.get("fuente")) for row in ccaf]
        lines.append(insert_values_sql(
            "ccaf_entidad",
            ["codigo", "nombre", "vigente", "fuente"],
            rows,
            quote_ident("codigo"),
            ["nombre", "vigente", "fuente"],
            schema,
        ))
        lines.append("")

    formas = payload.get("forma_pago_apv", payload.get("apv_apvc_forma_pago", [])) or []
    if formas:
        rows = [(row["codigo"], row["nombre"], row.get("vigente", True)) for row in formas]
        lines.append(insert_values_sql(
            "forma_pago_apv",
            ["codigo", "nombre", "vigente"],
            rows,
            quote_ident("codigo"),
            ["nombre", "vigente"],
            schema,
        ))
        lines.append("")

    instituciones = payload.get("institucion_apv", payload.get("apv_apvc_institucion", [])) or []
    if instituciones:
        rows = [(row["codigo"], row["nombre"], row.get("vigente", True)) for row in instituciones]
        lines.append(insert_values_sql(
            "institucion_apv",
            ["codigo", "nombre", "vigente"],
            rows,
            quote_ident("codigo"),
            ["nombre", "vigente"],
            schema,
        ))
        lines.append("")

    empresa = payload.get("ley_16744_empresa")
    if empresa:
        for field_name in empresa.get("campos_recomendados", []):
            lines.append(f"-- empresa requiere configurar: {field_name}")
        lines.append(f"-- nota empresa: {empresa.get('nota', '')}")
        lines.append("")

    lines.extend(["COMMIT;", ""])
    return "\n".join(line for line in lines if line is not None)


# -----------------------------------------------------------------------------
# Orquestador CLI unificado
# -----------------------------------------------------------------------------


def build_faltantes_payload(flow: str, out_dir: Path, offline: bool) -> dict[str, Any]:
    raw_dir = out_dir / "raw_faltantes_v611"
    source_keys = select_source_keys(flow)
    texts, snapshots = snapshot_sources(source_keys, raw_dir, offline)
    results = build_results(flow, texts)
    data = merge_results(results)
    return {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "flow": flow,
        "offline": offline,
        "flows": [asdict(result) for result in results],
        "data": data,
        "sources": [asdict(snapshot) for snapshot in snapshots],
    }


def write_faltantes_outputs(payload: dict[str, Any], out_dir: Path, sql_mode: str, schema: str, no_sql: bool) -> dict[str, Path]:
    flow = payload["flow"]
    out_dir.mkdir(parents=True, exist_ok=True)
    paths: dict[str, Path] = {}

    out_json = out_dir / f"faltantes_{flow}_v611.json"
    out_json.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    paths["json"] = out_json

    if not no_sql:
        out_sql = out_dir / f"faltantes_{flow}_v611.sql"
        data = payload["data"]
        if sql_mode == "suggested":
            sql = render_suggested_sql(data)
        elif sql_mode == "executable":
            sql = render_faltantes_sql(data, schema=schema)
        else:
            raise ValueError(f"sql_mode invalido: {sql_mode}")
        out_sql.write_text(sql, encoding="utf-8")
        paths["sql"] = out_sql

    return paths


def cmd_fetch_faltantes(args: argparse.Namespace) -> int:
    out_dir = Path(args.out_dir)
    payload = build_faltantes_payload(args.flow, out_dir, args.offline)
    paths = write_faltantes_outputs(payload, out_dir, args.sql_mode, args.schema, args.no_sql)
    print(paths["json"])
    if "sql" in paths:
        print(paths["sql"])
    for result in payload["flows"]:
        for warning in result.get("warnings", []):
            print(f"WARN {result['flow']}: {warning}")
    return 0


def require_keys(payload: dict[str, Any], keys: list[str], context: str) -> None:
    missing = [key for key in keys if key not in payload]
    if missing:
        raise KeyError(f"Faltan llaves en {context}: {', '.join(missing)}")


def cmd_render_mensual(args: argparse.Namespace) -> int:
    input_path = Path(args.input)
    output_path = Path(args.output)
    if not input_path.exists():
        raise FileNotFoundError(f"No existe el JSON mensual: {input_path}")

    payload = json.loads(input_path.read_text(encoding="utf-8"))
    require_keys(payload, ["periodo_remuneracion"], "parametros mensuales")
    require_keys(payload["periodo_remuneracion"], ["codigo", "fecha_inicio"], "periodo_remuneracion")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(render_sql(payload), encoding="utf-8")
    print(output_path)
    return 0


def cmd_build(args: argparse.Namespace) -> int:
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    generated_paths: dict[str, str] = {}

    faltantes_payload = build_faltantes_payload(args.flow, out_dir, args.offline)
    faltantes_paths = write_faltantes_outputs(faltantes_payload, out_dir, args.sql_mode, args.schema, args.no_sql)
    generated_paths.update({f"faltantes_{key}": str(path) for key, path in faltantes_paths.items()})

    sql_parts: list[str] = []
    if not args.no_sql and "sql" in faltantes_paths:
        sql_parts.append(f"-- Archivo: {faltantes_paths['sql'].name}\n" + faltantes_paths["sql"].read_text(encoding="utf-8"))

    mensual_input = Path(args.mensual_input)
    if mensual_input.exists():
        mensual_payload = json.loads(mensual_input.read_text(encoding="utf-8"))
        require_keys(mensual_payload, ["periodo_remuneracion"], "parametros mensuales")
        periodo_codigo = mensual_payload["periodo_remuneracion"]["codigo"]
        mensual_sql_path = out_dir / f"parametros_mensuales_{periodo_codigo}_v611.sql"
        mensual_sql = render_sql(mensual_payload)
        mensual_sql_path.write_text(mensual_sql, encoding="utf-8")
        generated_paths["mensual_sql"] = str(mensual_sql_path)
        if not args.no_sql:
            sql_parts.append(f"-- Archivo: {mensual_sql_path.name}\n" + mensual_sql)
    elif args.require_mensual:
        raise FileNotFoundError(f"No existe el JSON mensual requerido: {mensual_input}")
    else:
        print(f"WARN mensual: no existe {mensual_input}; solo se genero faltantes")

    if not args.no_sql and sql_parts:
        combined_sql_path = out_dir / args.combined_output
        combined_sql_path.write_text("\n\n".join(sql_parts), encoding="utf-8")
        generated_paths["combined_sql"] = str(combined_sql_path)

    manifest = {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "flow": args.flow,
        "offline": args.offline,
        "generated_paths": generated_paths,
        "faltantes_warnings": [
            {"flow": result["flow"], "warning": warning}
            for result in faltantes_payload["flows"]
            for warning in result.get("warnings", [])
        ],
    }
    manifest_path = out_dir / "manifest_parametros_v611.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(manifest_path)
    for path in generated_paths.values():
        print(path)
    for warning in manifest["faltantes_warnings"]:
        print(f"WARN {warning['flow']}: {warning['warning']}")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Orquestador unificado v6.11: descarga faltantes normativos y renderiza SQL mensual PostgreSQL."
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    p_fetch = subparsers.add_parser("fetch-faltantes", help="Descarga/normaliza faltantes normativos y genera JSON/SQL")
    p_fetch.add_argument("--flow", choices=["all", "mensual_normativo", "maestros", "empresa"], default="all")
    p_fetch.add_argument("--out-dir", default=str(DATA_DIR), help="Carpeta de salida")
    p_fetch.add_argument("--offline", action="store_true", help="Usa archivos raw previamente descargados")
    p_fetch.add_argument("--no-sql", action="store_true", help="No genera SQL")
    p_fetch.add_argument("--sql-mode", choices=["executable", "suggested"], default="executable", help="executable crea/actualiza tablas del esquema real; suggested solo deja comentarios")
    p_fetch.add_argument("--schema", default="public", help="Schema PostgreSQL para SQL executable")
    p_fetch.set_defaults(func=cmd_fetch_faltantes)

    p_render = subparsers.add_parser("render-mensual", help="Renderiza SQL mensual desde parametros_mensuales_v611.json")
    p_render.add_argument("--input", default=str(DATA_DIR / "parametros_mensuales_v611.json"))
    p_render.add_argument("--output", default=str(DATA_DIR / "parametros_mensuales_v611.sql"))
    p_render.set_defaults(func=cmd_render_mensual)

    p_build = subparsers.add_parser("build", help="Ejecuta flujo completo: faltantes + mensual si existe JSON")
    p_build.add_argument("--flow", choices=["all", "mensual_normativo", "maestros", "empresa"], default="all")
    p_build.add_argument("--out-dir", default=str(DATA_DIR), help="Carpeta de salida")
    p_build.add_argument("--mensual-input", default=str(DATA_DIR / "parametros_mensuales_v611.json"))
    p_build.add_argument("--combined-output", default="parametros_v611_completo.sql")
    p_build.add_argument("--offline", action="store_true", help="Usa archivos raw previamente descargados")
    p_build.add_argument("--require-mensual", action="store_true", help="Falla si no existe el JSON mensual")
    p_build.add_argument("--no-sql", action="store_true", help="No genera SQL")
    p_build.add_argument("--sql-mode", choices=["executable", "suggested"], default="executable")
    p_build.add_argument("--schema", default="public")
    p_build.set_defaults(func=cmd_build)

    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
