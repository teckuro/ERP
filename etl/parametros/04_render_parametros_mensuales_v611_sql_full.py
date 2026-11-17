#!/usr/bin/env python3
from __future__ import annotations

import argparse
import calendar
import json
from pathlib import Path
from typing import Any, Iterable

from v611_parametros_generales_schema import (
    PARAMETROS_GENERALES_V11_COLUMNS,
    PARAMETROS_GENERALES_V11_TEMP_TYPES,
    finalize_parametros_generales_compat,
    validate_parametros_generales_compat_scalars,
)
from v611_provenance import enforce_strict_sources, summarize_provenance
from v611_sql_merge_helpers import (
    render_period_precleanup_skip_tramo_carga_comment,
    render_tramo_carga_merge,
    render_tramo_impuesto_schema_precision,
    render_tramo_impuesto_sync_from_tabla,
)


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


def sql_literal(value: Any) -> str:
    if value is None:
        return "NULL"
    if isinstance(value, bool):
        return "TRUE" if value else "FALSE"
    if isinstance(value, (int, float)):
        return str(value)
    return "'" + str(value).replace("'", "''") + "'"


def build_periodo_remuneracion(periodo: str, estado: str) -> dict[str, Any]:
    try:
        anio_text, mes_text = periodo.split("-", 1)
        anio = int(anio_text)
        mes = int(mes_text)
        if mes < 1 or mes > 12:
            raise ValueError
    except ValueError as exc:
        raise ValueError(f"Periodo invalido: {periodo}. Usa YYYY-MM.") from exc

    ultimo_dia = calendar.monthrange(anio, mes)[1]
    return {
        "codigo": periodo,
        "anio": anio,
        "mes": mes,
        "fecha_inicio": f"{periodo}-01",
        "fecha_fin": f"{periodo}-{ultimo_dia:02d}",
        "estado": estado,
    }


def render_periodo_remuneracion_upsert(periodo_row: dict[str, Any], estado: str) -> str:
    return (
        "INSERT INTO periodo_remuneracion (codigo, anio, mes, fecha_inicio, fecha_fin, estado) VALUES "
        f"({sql_literal(periodo_row['codigo'])}, {sql_literal(periodo_row['anio'])}, {sql_literal(periodo_row['mes'])}, "
        f"{sql_literal(periodo_row['fecha_inicio'])}, {sql_literal(periodo_row['fecha_fin'])}, {sql_literal(estado)}) "
        "ON CONFLICT (codigo) DO UPDATE SET "
        "fecha_inicio = EXCLUDED.fecha_inicio, "
        "fecha_fin = EXCLUDED.fecha_fin, "
        "estado = CASE "
        "WHEN periodo_remuneracion.estado IN ('cerrado', 'corregido') THEN periodo_remuneracion.estado "
        "ELSE EXCLUDED.estado END;"
    )


def rows_values(rows: Iterable[Iterable[Any]]) -> str:
    return ",\n  ".join("(" + ", ".join(sql_literal(value) for value in row) + ")" for row in rows)


REQUIRED_LIST_KEYS = [
    "parametros_legales",
    "afc_parametro",
    "tramo_carga",
    "tabla_impuesto_unico",
    "tramo_impuesto_compat",
]


TEMP_TABLES = [
    "_expected_norm_trabajo_pesado",
    "_expected_norm_parametros_legales",
    "_expected_norm_reforma_previsional",
    "_expected_norm_organismo_16744",
    "_expected_norm_ley_16744",
    "_expected_norm_ccaf",
    "_expected_norm_forma_pago_apv",
    "_expected_norm_institucion_apv",
    "_expected_parametros_legales",
    "_expected_parametros_generales",
    "_expected_afc_parametro",
    "_expected_tramo_carga",
    "_expected_tabla_impuesto_unico",
    "_expected_tramo_impuesto",
    "_expected_afp_vigencia_update",
    "_expected_ips_tasa_basica",
]


def render_drop_temp_tables() -> list[str]:
    """Limpia tablas temporales de ejecuciones anteriores.

    Esto evita errores en Supabase SQL Editor o sesiones reutilizadas,
    donde una tabla temporal puede quedar viva después de una ejecución fallida.
    """
    lines = [
        "-- Limpieza de tablas temporales de ejecuciones anteriores",
    ]
    for table in TEMP_TABLES:
        lines.append(f"DROP TABLE IF EXISTS {table};")
    lines.append("")
    return lines


def render_preparation_infra_sql() -> list[str]:
    return [
        "-- Infraestructura minima no destructiva para preparacion parcial",
        "CREATE TABLE IF NOT EXISTS ips_ex_caja_tasa_basica (",
        "    id_ips_ex_caja_tasa_basica SERIAL PRIMARY KEY,",
        "    grupo_trabajador VARCHAR(60) NOT NULL,",
        "    nombre_grupo VARCHAR(150) NOT NULL,",
        "    tipo_salud VARCHAR(20) NOT NULL,",
        "    escenario_empresa VARCHAR(60) NOT NULL,",
        "    nombre_escenario VARCHAR(150) NOT NULL,",
        "    tasa_cotizacion NUMERIC(7,4) NOT NULL,",
        "    vigente BOOLEAN NOT NULL DEFAULT TRUE,",
        "    vigencia_inicio DATE NOT NULL,",
        "    vigencia_fin DATE,",
        "    fuente TEXT,",
        "    observacion TEXT,",
        "    CONSTRAINT uq_ips_ex_caja_tasa_basica UNIQUE (grupo_trabajador, tipo_salud, escenario_empresa, vigencia_inicio),",
        "    CONSTRAINT chk_ips_ex_caja_tasa_basica_salud CHECK (tipo_salud IN ('FONASA', 'ISAPRE')),",
        "    CONSTRAINT chk_ips_ex_caja_tasa_basica_tasa CHECK (tasa_cotizacion >= 0),",
        "    CONSTRAINT chk_ips_ex_caja_tasa_basica_vigencia CHECK (vigencia_fin IS NULL OR vigencia_fin >= vigencia_inicio)",
        ");",
        "",
        "CREATE UNIQUE INDEX IF NOT EXISTS uq_periodo_remuneracion_codigo ON periodo_remuneracion (codigo) WHERE codigo IS NOT NULL;",
        "CREATE UNIQUE INDEX IF NOT EXISTS uq_ccaf_entidad_codigo ON ccaf_entidad (codigo) WHERE codigo IS NOT NULL;",
        "CREATE UNIQUE INDEX IF NOT EXISTS uq_forma_pago_apv_codigo ON forma_pago_apv (codigo) WHERE codigo IS NOT NULL;",
        "CREATE UNIQUE INDEX IF NOT EXISTS uq_institucion_apv_codigo ON institucion_apv (codigo) WHERE codigo IS NOT NULL;",
        "CREATE UNIQUE INDEX IF NOT EXISTS uq_organismo_administrador_ley_16744_codigo ON organismo_administrador_ley_16744 (codigo) WHERE codigo IS NOT NULL;",
        "CREATE UNIQUE INDEX IF NOT EXISTS uq_reforma_previsional_parametro_vigencia_inicio ON reforma_previsional_parametro (vigencia_inicio) WHERE vigencia_inicio IS NOT NULL;",
        "CREATE UNIQUE INDEX IF NOT EXISTS uq_parametros_legales_nombre_vigencia_inicio ON parametros_legales (nombre, vigencia_inicio) WHERE nombre IS NOT NULL AND vigencia_inicio IS NOT NULL;",
        "",
        "ALTER TABLE reforma_previsional_parametro ADD COLUMN IF NOT EXISTS codigo VARCHAR(30);",
        "ALTER TABLE reforma_previsional_parametro ADD COLUMN IF NOT EXISTS cotizacion_rentabilidad_protegida NUMERIC(7,4) NOT NULL DEFAULT 0;",
        "ALTER TABLE reforma_previsional_parametro ADD COLUMN IF NOT EXISTS seguro_social_sis_cev NUMERIC(7,4) NOT NULL DEFAULT 0;",
        "ALTER TABLE reforma_previsional_parametro ADD COLUMN IF NOT EXISTS ley_referencia TEXT;",
        "ALTER TABLE reforma_previsional_parametro ADD COLUMN IF NOT EXISTS observacion TEXT;",
        "UPDATE reforma_previsional_parametro",
        "SET seguro_social_sis_cev = fapp_seguro_social",
        "WHERE seguro_social_sis_cev = 0 AND fapp_seguro_social > 0;",
        "",
    ]


def canonical_parametro_legal_nombre(nombre: Any) -> str:
    """Normaliza nombres legales equivalentes para evitar duplicados."""
    value = str(nombre or "").strip()
    if value.upper() in {"LEY_SANNA", "SANNA"}:
        return "SANNA"
    return value


def normalize_parametros_legales(
    rows: list[dict[str, Any]], periodo_codigo: str
) -> list[dict[str, Any]]:
    """Deduplica parametros legales por nombre canonico + vigencia; asigna periodo YYYY-MM (v11)."""
    result: dict[tuple[str, str], dict[str, Any]] = {}

    for row in rows:
        clean = dict(row)
        clean["nombre"] = canonical_parametro_legal_nombre(clean.get("nombre"))
        clean["periodo"] = clean.get("periodo") or periodo_codigo
        key = (clean["nombre"], str(clean.get("vigencia_inicio")))
        result[key] = clean

    by_vigencia: dict[str, dict[str, dict[str, Any]]] = {}
    for (nombre, vigencia), row in result.items():
        by_vigencia.setdefault(vigencia, {})[nombre] = row

    for vigencia, grouped in by_vigencia.items():
        salud_fonasa = grouped.get("SALUD_FONASA")
        salud_ccaf = grouped.get("SALUD_CCAF")
        if not salud_fonasa or not salud_ccaf:
            continue

        fonasa = salud_fonasa.get("valor_decimal")
        ccaf = salud_ccaf.get("valor_decimal")
        if fonasa is None or ccaf is None:
            continue

        total = fonasa + ccaf
        for nombre in ["SALUD_OBLIGATORIA", "SALUD_FONASA_CON_CCAF"]:
            key = (nombre, vigencia)
            result.setdefault(
                key,
                {
                    "nombre": nombre,
                    "valor_decimal": total,
                    "valor_entero": None,
                    "vigencia_inicio": vigencia,
                    "vigencia_fin": salud_fonasa.get("vigencia_fin"),
                    "periodo": periodo_codigo,
                },
            )

    return list(result.values())


def render_period_precleanup(payload: dict[str, Any]) -> list[str]:
    """Limpieza completa del periodo mensual antes de cargar.

    Limpia solo tablas que tienen periodo o vigencia mensual directa.
    No borra catalogos maestros completos ni periodo_remuneracion, porque pueden
    tener referencias desde contratos, liquidaciones o configuraciones.
    """
    periodo = payload["periodo_remuneracion"]["codigo"]
    vigencia_inicio = payload["periodo_remuneracion"]["fecha_inicio"]

    return [
        "-- -----------------------------------------------------------------------------",
        "-- Limpieza completa del periodo antes de cargar",
        "-- -----------------------------------------------------------------------------",
        "-- Se elimina la data mensual del periodo/vigencia y luego se vuelve a insertar",
        "-- desde el JSON generado. Esto hace la carga reejecutable y evita duplicados.",
        "",
        "-- Tabla para matriz básica IPS/Ex-Cajas. Se crea aquí para que el mensual sea autocontenido.",
        "CREATE TABLE IF NOT EXISTS ips_ex_caja_tasa_basica (",
        "    id_ips_ex_caja_tasa_basica SERIAL PRIMARY KEY,",
        "    grupo_trabajador VARCHAR(60) NOT NULL,",
        "    nombre_grupo VARCHAR(150) NOT NULL,",
        "    tipo_salud VARCHAR(20) NOT NULL,",
        "    escenario_empresa VARCHAR(60) NOT NULL,",
        "    nombre_escenario VARCHAR(150) NOT NULL,",
        "    tasa_cotizacion NUMERIC(7,4) NOT NULL,",
        "    vigente BOOLEAN NOT NULL DEFAULT TRUE,",
        "    vigencia_inicio DATE NOT NULL,",
        "    vigencia_fin DATE,",
        "    fuente TEXT,",
        "    observacion TEXT,",
        "    CONSTRAINT uq_ips_ex_caja_tasa_basica UNIQUE (grupo_trabajador, tipo_salud, escenario_empresa, vigencia_inicio),",
        "    CONSTRAINT chk_ips_ex_caja_tasa_basica_salud CHECK (tipo_salud IN ('FONASA', 'ISAPRE')),",
        "    CONSTRAINT chk_ips_ex_caja_tasa_basica_tasa CHECK (tasa_cotizacion >= 0),",
        "    CONSTRAINT chk_ips_ex_caja_tasa_basica_vigencia CHECK (vigencia_fin IS NULL OR vigencia_fin >= vigencia_inicio)",
        ");",
        "",
        "-- Índices únicos requeridos por ON CONFLICT en este SQL mensual.",
        "-- (En algunos entornos estos catálogos no vienen con UNIQUE, y el UPSERT falla con 42P10.)",
        "CREATE UNIQUE INDEX IF NOT EXISTS uq_periodo_remuneracion_codigo ON periodo_remuneracion (codigo) WHERE codigo IS NOT NULL;",
        "CREATE UNIQUE INDEX IF NOT EXISTS uq_ccaf_entidad_codigo ON ccaf_entidad (codigo) WHERE codigo IS NOT NULL;",
        "CREATE UNIQUE INDEX IF NOT EXISTS uq_forma_pago_apv_codigo ON forma_pago_apv (codigo) WHERE codigo IS NOT NULL;",
        "CREATE UNIQUE INDEX IF NOT EXISTS uq_institucion_apv_codigo ON institucion_apv (codigo) WHERE codigo IS NOT NULL;",
        "-- ley_16744_parametros / trabajo_pesado_parametro: unicidad (codigo, periodo) en esquema v11; no indice solo por codigo.",
        "CREATE UNIQUE INDEX IF NOT EXISTS uq_organismo_administrador_ley_16744_codigo ON organismo_administrador_ley_16744 (codigo) WHERE codigo IS NOT NULL;",
        "CREATE UNIQUE INDEX IF NOT EXISTS uq_reforma_previsional_parametro_vigencia_inicio ON reforma_previsional_parametro (vigencia_inicio) WHERE vigencia_inicio IS NOT NULL;",
        "CREATE UNIQUE INDEX IF NOT EXISTS uq_parametros_legales_nombre_vigencia_inicio ON parametros_legales (nombre, vigencia_inicio) WHERE nombre IS NOT NULL AND vigencia_inicio IS NOT NULL;",
        "CREATE UNIQUE INDEX IF NOT EXISTS uq_afp_vigencia_id_afp_vigencia_inicio ON afp_vigencia (id_afp, vigencia_inicio) WHERE id_afp IS NOT NULL AND vigencia_inicio IS NOT NULL;",
        "",
        "-- Gradualidad Reforma de Pensiones 2025-2033: columnas separadas para CRP y Seguro Social/SIS/CEV.",
        "ALTER TABLE reforma_previsional_parametro ADD COLUMN IF NOT EXISTS codigo VARCHAR(30);",
        "ALTER TABLE reforma_previsional_parametro ADD COLUMN IF NOT EXISTS cotizacion_rentabilidad_protegida NUMERIC(7,4) NOT NULL DEFAULT 0;",
        "ALTER TABLE reforma_previsional_parametro ADD COLUMN IF NOT EXISTS seguro_social_sis_cev NUMERIC(7,4) NOT NULL DEFAULT 0;",
        "ALTER TABLE reforma_previsional_parametro ADD COLUMN IF NOT EXISTS ley_referencia TEXT;",
        "ALTER TABLE reforma_previsional_parametro ADD COLUMN IF NOT EXISTS observacion TEXT;",
        "UPDATE reforma_previsional_parametro",
        "SET seguro_social_sis_cev = fapp_seguro_social",
        "WHERE seguro_social_sis_cev = 0 AND fapp_seguro_social > 0;",
        "",
        *render_tramo_impuesto_schema_precision(),
        f"DELETE FROM parametros_legales WHERE vigencia_inicio = DATE {sql_literal(vigencia_inicio)} AND (periodo = {sql_literal(periodo)} OR periodo IS NULL);",
        f"DELETE FROM parametros_generales WHERE periodo = {sql_literal(periodo)};",
        f"DELETE FROM afc_parametro WHERE vigencia_inicio = DATE {sql_literal(vigencia_inicio)} AND (periodo = {sql_literal(periodo)} OR periodo IS NULL);",
        f"DELETE FROM tabla_impuesto_unico WHERE vigencia_inicio = DATE {sql_literal(vigencia_inicio)};",
        f"DELETE FROM tramo_impuesto WHERE periodo = {sql_literal(periodo)};",
        f"DELETE FROM ips_ex_caja_tasa_basica WHERE vigencia_inicio = DATE {sql_literal(vigencia_inicio)};",
        "",
        "-- No se elimina periodo_remuneracion: se hace UPSERT para conservar referencias.",
        "-- No se elimina afp_vigencia: se hace UPSERT para conservar el id de vigencia si ya existe.",
        render_period_precleanup_skip_tramo_carga_comment(),
        "-- No se eliminan catalogos maestros como AFP, salud, concepto, APV, CCAF o ex cajas.",
        "",
    ]


def get_normativa_source_url(payload: dict[str, Any], key: str) -> str | None:
    normativa = payload.get("normativa_base")
    if not isinstance(normativa, dict):
        return None

    sources = normativa.get("sources")
    if not isinstance(sources, list):
        return None

    for source in sources:
        if isinstance(source, dict) and source.get("key") == key:
            return source.get("url")
    return None


def validate_payload(payload: dict[str, Any], *, strict: bool = True) -> list[str]:
    """Valida que el JSON tenga las secciones mensuales que el SQL necesita."""
    errors: list[str] = []

    periodo = payload.get("periodo_remuneracion")
    if not isinstance(periodo, dict):
        errors.append("Falta periodo_remuneracion.")
    else:
        for key in ["codigo", "anio", "mes", "fecha_inicio", "fecha_fin", "estado"]:
            if periodo.get(key) in (None, ""):
                errors.append(f"periodo_remuneracion.{key} está vacío.")

    compat = payload.get("parametros_generales_compat")
    if strict and not isinstance(compat, dict):
        errors.append("Falta parametros_generales_compat.")
    elif strict and isinstance(compat, dict):
        ley_sanna_payload = payload.get("ley_sanna")
        if not isinstance(ley_sanna_payload, dict):
            normativa = payload.get("normativa_base")
            if isinstance(normativa, dict):
                norm_data = normativa.get("data")
                if isinstance(norm_data, dict) and isinstance(norm_data.get("ley_sanna"), dict):
                    ley_sanna_payload = norm_data["ley_sanna"]
        finalized = finalize_parametros_generales_compat(
            dict(compat),
            parametros_legales=payload.get("parametros_legales")
            if isinstance(payload.get("parametros_legales"), list)
            else None,
            ley_sanna=ley_sanna_payload if isinstance(ley_sanna_payload, dict) else None,
        )
        errors.extend(validate_parametros_generales_compat_scalars(finalized))

    if strict:
        for key in REQUIRED_LIST_KEYS:
            value = payload.get(key)
            if not isinstance(value, list) or len(value) == 0:
                errors.append(f"{key} falta o viene vacío.")

    return errors


def default_output_path(input_path: Path, payload: dict[str, Any]) -> Path:
    periodo = payload.get("periodo_remuneracion", {}).get("codigo", "SIN_PERIODO")
    return input_path.parent / f"parametros_mensuales_{periodo}_v611.sql"


def find_runs_json_inputs(runs_dir: Path | None = None) -> list[Path]:
    base = runs_dir or (BASE_DIR / "runs")
    if not base.exists():
        return []
    return sorted(
        path
        for path in base.glob("**/parametros_mensuales_*_v611.json")
        if path.parent.name == "mensual"
    )


def regenerar_todos_los_sql_runs(
    *,
    schema: str = "public",
    strict: bool = True,
    runs_dir: Path | None = None,
) -> list[Path]:
    """Regenera SQL mensual desde cada JSON bajo runs/**/mensual/."""
    outputs: list[Path] = []
    for json_path in find_runs_json_inputs(runs_dir):
        payload = json.loads(json_path.read_text(encoding="utf-8"))
        output_path = default_output_path(json_path, payload)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(
            render_sql(payload, schema=schema, strict=strict),
            encoding="utf-8",
        )
        outputs.append(output_path)
    return outputs


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




# -----------------------------------------------------------------------------
# Normativa base dentro del SQL mensual
# -----------------------------------------------------------------------------

NORMATIVA_BASE_KEYS = {
    "trabajo_pesado",
    "ley_sanna",
    "reforma_previsional",
    "organismo_administrador_ley_16744",
    "ley_16744_parametros",
    "ccaf_entidad",
    "forma_pago_apv",
    "institucion_apv",
}


def extract_normativa_data(payload: dict[str, Any]) -> dict[str, Any]:
    """Obtiene la normativa base desde el JSON mensual combinado.

    Formatos soportados:
    - payload["normativa_base"]["data"]  -> formato recomendado.
    - payload["normativa_base"]          -> si ya viene directo.
    - payload con llaves normativas top-level.
    """
    normativa = payload.get("normativa_base")
    if isinstance(normativa, dict):
        data = normativa.get("data")
        if isinstance(data, dict):
            return data
        if any(key in normativa for key in NORMATIVA_BASE_KEYS):
            return normativa

    if any(key in payload for key in NORMATIVA_BASE_KEYS):
        return payload

    return {}


def render_compare_notice_catalogo(actual_sql: str, expected_sql: str, label: str) -> str:
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
        RAISE NOTICE '{label}: no existia data previa; se insertara.';
    ELSIF diff_count = 0 THEN
        RAISE NOTICE '{label}: la data existente ya es igual; no se actualizan filas sin cambios.';
    ELSE
        RAISE NOTICE '{label}: existen diferencias; se hara UPSERT solo de filas distintas.';
    END IF;
END $$;
"""


def render_upsert_from_temp(
    table: str,
    temp_table: str,
    columns: list[str],
    conflict_columns: list[str],
    update_columns: list[str],
) -> str:
    col_sql = ", ".join(columns)
    conflict_sql = ", ".join(conflict_columns)
    update_sql = ",\n    ".join(f"{column} = EXCLUDED.{column}" for column in update_columns)
    where_sql = " OR\n    ".join(f"{table}.{column} IS DISTINCT FROM EXCLUDED.{column}" for column in update_columns)
    return f"""INSERT INTO {table} ({col_sql})
SELECT {col_sql}
FROM {temp_table}
ON CONFLICT ({conflict_sql}) DO UPDATE SET
    {update_sql}
WHERE
    {where_sql};"""


def render_normativa_base_sql(payload: dict[str, Any]) -> str:
    """Renderiza normativa base dentro del SQL mensual final.

    La idea es que el SQL mensual sea el unico archivo aplicable.
    Esta seccion NO borra catalogos: compara y hace UPSERT solo si hay diferencias.
    """
    data = extract_normativa_data(payload)
    if not data:
        return ""

    periodo_codigo = ""
    pr = payload.get("periodo_remuneracion")
    if isinstance(pr, dict):
        periodo_codigo = str(pr.get("codigo") or "").strip()

    lines: list[str] = [
        "-- -----------------------------------------------------------------------------",
        "-- Normativa base v6.11 incluida en el SQL mensual",
        "-- Reejecutable: valida si la data ya existe y solo actualiza filas distintas.",
        "-- -----------------------------------------------------------------------------",
        "",
    ]

    trabajo_pesado = data.get("trabajo_pesado", []) or []
    if trabajo_pesado:
        rows = [
            (
                row["codigo"],
                str(row.get("periodo") or periodo_codigo),
                row["nombre"],
                row["tasa_trabajador"],
                row["tasa_empleador"],
                row["tasa_total"],
                row.get("requiere_dictamen_cen", True),
                row.get("fuente"),
                row.get("vigente", True),
                row.get("vigencia_inicio", "2025-08-01"),
                row.get("vigencia_fin"),
            )
            for row in trabajo_pesado
        ]
        lines.extend([
            "CREATE TEMP TABLE _expected_norm_trabajo_pesado (codigo TEXT, periodo TEXT, nombre TEXT, tasa_trabajador NUMERIC, tasa_empleador NUMERIC, tasa_total NUMERIC, requiere_dictamen_cen BOOLEAN, fuente TEXT, vigente BOOLEAN, vigencia_inicio DATE, vigencia_fin DATE) ON COMMIT PRESERVE ROWS;",
            "INSERT INTO _expected_norm_trabajo_pesado (codigo, periodo, nombre, tasa_trabajador, tasa_empleador, tasa_total, requiere_dictamen_cen, fuente, vigente, vigencia_inicio, vigencia_fin) VALUES",
            f"  {rows_values(rows)};",
            "",
            render_compare_notice_catalogo(
                "SELECT t.codigo::TEXT, t.periodo::TEXT, t.nombre::TEXT, t.tasa_trabajador, t.tasa_empleador, t.tasa_total, t.requiere_dictamen_cen, t.fuente::TEXT, t.vigente, t.vigencia_inicio, t.vigencia_fin FROM trabajo_pesado_parametro t WHERE (t.codigo, t.periodo) IN (SELECT codigo, periodo FROM _expected_norm_trabajo_pesado)",
                "SELECT codigo, periodo, nombre, tasa_trabajador, tasa_empleador, tasa_total, requiere_dictamen_cen, fuente, vigente, vigencia_inicio, vigencia_fin FROM _expected_norm_trabajo_pesado",
                "trabajo_pesado_parametro",
            ).rstrip(),
            render_upsert_from_temp(
                "trabajo_pesado_parametro",
                "_expected_norm_trabajo_pesado",
                ["codigo", "periodo", "nombre", "tasa_trabajador", "tasa_empleador", "tasa_total", "requiere_dictamen_cen", "fuente", "vigente", "vigencia_inicio", "vigencia_fin"],
                ["codigo", "periodo"],
                ["nombre", "tasa_trabajador", "tasa_empleador", "tasa_total", "requiere_dictamen_cen", "fuente", "vigente", "vigencia_inicio", "vigencia_fin"],
            ),
            "",
        ])

    ley_sanna = data.get("ley_sanna")
    if isinstance(ley_sanna, dict):
        sanna_name = "SANNA"
        rows = [(
            sanna_name,
            ley_sanna.get("valor_decimal", ley_sanna.get("tasa_empleador", 0.03)),
            ley_sanna.get("valor_entero"),
            ley_sanna.get("vigencia_inicio", payload.get("periodo_remuneracion", {}).get("fecha_inicio", "2026-04-01")),
            ley_sanna.get("vigencia_fin"),
            periodo_codigo or None,
        )]
        lines.extend([
            "CREATE TEMP TABLE _expected_norm_parametros_legales (nombre TEXT, valor_decimal NUMERIC, valor_entero INTEGER, vigencia_inicio DATE, vigencia_fin DATE, periodo TEXT) ON COMMIT PRESERVE ROWS;",
            "INSERT INTO _expected_norm_parametros_legales (nombre, valor_decimal, valor_entero, vigencia_inicio, vigencia_fin, periodo) VALUES",
            f"  {rows_values(rows)};",
            "",
            render_compare_notice_catalogo(
                "SELECT p.nombre::TEXT, p.valor_decimal, p.valor_entero, p.vigencia_inicio, p.vigencia_fin, p.periodo::TEXT FROM parametros_legales p WHERE EXISTS (SELECT 1 FROM _expected_norm_parametros_legales e WHERE e.nombre = p.nombre AND e.vigencia_inicio = p.vigencia_inicio)",
                "SELECT nombre, valor_decimal, valor_entero, vigencia_inicio, vigencia_fin, periodo FROM _expected_norm_parametros_legales",
                "parametros_legales SANNA",
            ).rstrip(),
            render_upsert_from_temp(
                "parametros_legales",
                "_expected_norm_parametros_legales",
                ["nombre", "valor_decimal", "valor_entero", "vigencia_inicio", "vigencia_fin", "periodo"],
                ["nombre", "vigencia_inicio"],
                ["valor_decimal", "valor_entero", "vigencia_fin", "periodo"],
            ),
            "",
        ])

    reforma = data.get("reforma_previsional", []) or []
    if reforma:
        def _normalize_reforma_row(row: dict[str, Any]) -> tuple[Any, Any, Any, Any, Any, Any, Any, Any, Any, Any, Any, Any]:
            """Normaliza gradualidad para cumplir chk_reforma_previsional_tasas.

            Regla v6.11:
            - cuenta + CRP + seguro = total
            - CRP + seguro = fapp

            Algunos payloads históricos traen `fapp_seguro_social` poblado pero `seguro_social_sis_cev=0`
            (o `cotizacion_rentabilidad_protegida=0`), lo que rompe la constraint al insertar.
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

            # Caso típico del error reportado: fapp>0 pero seguro=0 (payload viejo).
            if seguro == 0.0 and fapp > 0.0 and crp == 0.0:
                seguro = fapp

            # Asegura ecuaciones (con redondeo a 4, igual que la constraint).
            expected_total = round(cuenta + crp + seguro, 4)
            if round(total, 4) != expected_total:
                # Preferimos conservar total/cuenta/crp (normativo) y ajustar el seguro.
                seguro = max(0.0, round(total - cuenta - crp, 4))

            fapp = round(crp + seguro, 4)

            fuente = row.get("fuente")
            ley_ref = row.get("ley_referencia")
            obs = row.get("observacion")
            periodo_row = str(row.get("periodo") or periodo_codigo) if (row.get("periodo") or periodo_codigo) else None

            return (
                codigo,
                vig_ini,
                vig_fin,
                round(total, 4),
                round(cuenta, 4),
                round(crp, 4),
                round(seguro, 4),
                fapp,
                fuente,
                ley_ref,
                obs,
                periodo_row,
            )

        rows = [
            _normalize_reforma_row(row)
            for row in reforma
        ]
        lines.extend([
            "CREATE TEMP TABLE _expected_norm_reforma_previsional (codigo TEXT, vigencia_inicio DATE, vigencia_fin DATE, aporte_empleador_total NUMERIC, cuenta_capitalizacion_individual NUMERIC, cotizacion_rentabilidad_protegida NUMERIC, seguro_social_sis_cev NUMERIC, fapp_seguro_social NUMERIC, fuente TEXT, ley_referencia TEXT, observacion TEXT, periodo TEXT) ON COMMIT PRESERVE ROWS;",
            "INSERT INTO _expected_norm_reforma_previsional (codigo, vigencia_inicio, vigencia_fin, aporte_empleador_total, cuenta_capitalizacion_individual, cotizacion_rentabilidad_protegida, seguro_social_sis_cev, fapp_seguro_social, fuente, ley_referencia, observacion, periodo) VALUES",
            f"  {rows_values(rows)};",
            "",
            render_compare_notice_catalogo(
                "SELECT codigo::TEXT, vigencia_inicio, vigencia_fin, aporte_empleador_total, cuenta_capitalizacion_individual, cotizacion_rentabilidad_protegida, seguro_social_sis_cev, fapp_seguro_social, fuente::TEXT, ley_referencia::TEXT, observacion::TEXT, periodo::TEXT FROM reforma_previsional_parametro WHERE vigencia_inicio IN (SELECT vigencia_inicio FROM _expected_norm_reforma_previsional)",
                "SELECT codigo, vigencia_inicio, vigencia_fin, aporte_empleador_total, cuenta_capitalizacion_individual, cotizacion_rentabilidad_protegida, seguro_social_sis_cev, fapp_seguro_social, fuente, ley_referencia, observacion, periodo FROM _expected_norm_reforma_previsional",
                "reforma_previsional_parametro",
            ).rstrip(),
            render_upsert_from_temp(
                "reforma_previsional_parametro",
                "_expected_norm_reforma_previsional",
                ["codigo", "vigencia_inicio", "vigencia_fin", "aporte_empleador_total", "cuenta_capitalizacion_individual", "cotizacion_rentabilidad_protegida", "seguro_social_sis_cev", "fapp_seguro_social", "fuente", "ley_referencia", "observacion", "periodo"],
                ["vigencia_inicio"],
                ["codigo", "vigencia_fin", "aporte_empleador_total", "cuenta_capitalizacion_individual", "cotizacion_rentabilidad_protegida", "seguro_social_sis_cev", "fapp_seguro_social", "fuente", "ley_referencia", "observacion", "periodo"],
            ),
            "",
        ])

    organismos = data.get("organismo_administrador_ley_16744", []) or []
    if organismos:
        rows = [(row["codigo"], row["nombre"], row["tipo"], row.get("vigente", True)) for row in organismos]
        lines.extend([
            "CREATE TEMP TABLE _expected_norm_organismo_16744 (codigo TEXT, nombre TEXT, tipo TEXT, vigente BOOLEAN) ON COMMIT PRESERVE ROWS;",
            "INSERT INTO _expected_norm_organismo_16744 (codigo, nombre, tipo, vigente) VALUES",
            f"  {rows_values(rows)};",
            "",
            render_compare_notice_catalogo(
                "SELECT codigo::TEXT, nombre::TEXT, tipo::TEXT, vigente FROM organismo_administrador_ley_16744 WHERE codigo IN (SELECT codigo FROM _expected_norm_organismo_16744)",
                "SELECT codigo, nombre, tipo, vigente FROM _expected_norm_organismo_16744",
                "organismo_administrador_ley_16744",
            ).rstrip(),
            render_upsert_from_temp(
                "organismo_administrador_ley_16744",
                "_expected_norm_organismo_16744",
                ["codigo", "nombre", "tipo", "vigente"],
                ["codigo"],
                ["nombre", "tipo", "vigente"],
            ),
            "",
        ])

    ley_16744 = data.get("ley_16744_parametros")
    if isinstance(ley_16744, dict):
        rows = [(
            ley_16744.get("codigo", "LEY_16744"),
            str(ley_16744.get("periodo") or periodo_codigo),
            ley_16744.get("cotizacion_basica_empleador"),
            ley_16744.get("descripcion_tasa_adicional", ley_16744.get("cotizacion_adicional_diferenciada")),
            ley_16744.get("fuente_financiamiento"),
            ley_16744.get("fuente_organismos"),
            ley_16744.get("vigente", True),
            ley_16744.get("vigencia_inicio", payload.get("periodo_remuneracion", {}).get("fecha_inicio", "2026-04-01")),
            ley_16744.get("vigencia_fin"),
        )]
        lines.extend([
            "CREATE TEMP TABLE _expected_norm_ley_16744 (codigo TEXT, periodo TEXT, cotizacion_basica_empleador NUMERIC, descripcion_tasa_adicional TEXT, fuente_financiamiento TEXT, fuente_organismos TEXT, vigente BOOLEAN, vigencia_inicio DATE, vigencia_fin DATE) ON COMMIT PRESERVE ROWS;",
            "INSERT INTO _expected_norm_ley_16744 (codigo, periodo, cotizacion_basica_empleador, descripcion_tasa_adicional, fuente_financiamiento, fuente_organismos, vigente, vigencia_inicio, vigencia_fin) VALUES",
            f"  {rows_values(rows)};",
            "",
            render_compare_notice_catalogo(
                "SELECT l.codigo::TEXT, l.periodo::TEXT, l.cotizacion_basica_empleador, l.descripcion_tasa_adicional::TEXT, l.fuente_financiamiento::TEXT, l.fuente_organismos::TEXT, l.vigente, l.vigencia_inicio, l.vigencia_fin FROM ley_16744_parametros l WHERE (l.codigo, l.periodo) IN (SELECT codigo, periodo FROM _expected_norm_ley_16744)",
                "SELECT codigo, periodo, cotizacion_basica_empleador, descripcion_tasa_adicional, fuente_financiamiento, fuente_organismos, vigente, vigencia_inicio, vigencia_fin FROM _expected_norm_ley_16744",
                "ley_16744_parametros",
            ).rstrip(),
            render_upsert_from_temp(
                "ley_16744_parametros",
                "_expected_norm_ley_16744",
                ["codigo", "periodo", "cotizacion_basica_empleador", "descripcion_tasa_adicional", "fuente_financiamiento", "fuente_organismos", "vigente", "vigencia_inicio", "vigencia_fin"],
                ["codigo", "periodo"],
                ["cotizacion_basica_empleador", "descripcion_tasa_adicional", "fuente_financiamiento", "fuente_organismos", "vigente", "vigencia_inicio", "vigencia_fin"],
            ),
            "",
        ])

    ccaf = data.get("ccaf_entidad", []) or []
    ccaf_source = get_normativa_source_url(payload, "ccaf_vigentes") or data.get("fuente")
    if ccaf:
        rows = [(row["codigo"], row["nombre"], row.get("vigente", True), row.get("fuente", ccaf_source)) for row in ccaf]
        lines.extend([
            "CREATE TEMP TABLE _expected_norm_ccaf (codigo TEXT, nombre TEXT, vigente BOOLEAN, fuente TEXT) ON COMMIT PRESERVE ROWS;",
            "INSERT INTO _expected_norm_ccaf (codigo, nombre, vigente, fuente) VALUES",
            f"  {rows_values(rows)};",
            "",
            render_compare_notice_catalogo(
                "SELECT codigo::TEXT, nombre::TEXT, vigente, fuente::TEXT FROM ccaf_entidad WHERE codigo IN (SELECT codigo FROM _expected_norm_ccaf)",
                "SELECT codigo, nombre, vigente, fuente FROM _expected_norm_ccaf",
                "ccaf_entidad",
            ).rstrip(),
            render_upsert_from_temp(
                "ccaf_entidad",
                "_expected_norm_ccaf",
                ["codigo", "nombre", "vigente", "fuente"],
                ["codigo"],
                ["nombre", "vigente", "fuente"],
            ),
            "",
        ])

    formas = data.get("forma_pago_apv", data.get("apv_apvc_forma_pago", [])) or []
    if formas:
        rows = [(row["codigo"], row["nombre"], row.get("vigente", True)) for row in formas]
        lines.extend([
            "CREATE TEMP TABLE _expected_norm_forma_pago_apv (codigo TEXT, nombre TEXT, vigente BOOLEAN) ON COMMIT PRESERVE ROWS;",
            "INSERT INTO _expected_norm_forma_pago_apv (codigo, nombre, vigente) VALUES",
            f"  {rows_values(rows)};",
            "",
            render_compare_notice_catalogo(
                "SELECT codigo::TEXT, nombre::TEXT, vigente FROM forma_pago_apv WHERE codigo IN (SELECT codigo FROM _expected_norm_forma_pago_apv)",
                "SELECT codigo, nombre, vigente FROM _expected_norm_forma_pago_apv",
                "forma_pago_apv",
            ).rstrip(),
            render_upsert_from_temp(
                "forma_pago_apv",
                "_expected_norm_forma_pago_apv",
                ["codigo", "nombre", "vigente"],
                ["codigo"],
                ["nombre", "vigente"],
            ),
            "",
        ])

    instituciones = data.get("institucion_apv", data.get("apv_apvc_institucion", [])) or []
    if instituciones:
        rows = [(row["codigo"], row["nombre"], row.get("vigente", True)) for row in instituciones]
        lines.extend([
            "CREATE TEMP TABLE _expected_norm_institucion_apv (codigo TEXT, nombre TEXT, vigente BOOLEAN) ON COMMIT PRESERVE ROWS;",
            "INSERT INTO _expected_norm_institucion_apv (codigo, nombre, vigente) VALUES",
            f"  {rows_values(rows)};",
            "",
            render_compare_notice_catalogo(
                "SELECT codigo::TEXT, nombre::TEXT, vigente FROM institucion_apv WHERE codigo IN (SELECT codigo FROM _expected_norm_institucion_apv)",
                "SELECT codigo, nombre, vigente FROM _expected_norm_institucion_apv",
                "institucion_apv",
            ).rstrip(),
            render_upsert_from_temp(
                "institucion_apv",
                "_expected_norm_institucion_apv",
                ["codigo", "nombre", "vigente"],
                ["codigo"],
                ["nombre", "vigente"],
            ),
            "",
        ])

    return "\n".join(lines).rstrip()




def extract_ips_tasa_basica(payload: dict[str, Any]) -> list[dict[str, Any]]:
    ips_tasas = payload.get("ips_tasas")
    if isinstance(ips_tasas, dict):
        rows = ips_tasas.get("ips_tasa_basica", [])
        if isinstance(rows, list):
            return rows

    rows = payload.get("ips_tasa_basica", [])
    return rows if isinstance(rows, list) else []


def render_ips_tasas_sql(payload: dict[str, Any]) -> str:
    rows_payload = extract_ips_tasa_basica(payload)
    if not rows_payload:
        return ""

    rows = [
        (
            row["grupo_trabajador"],
            row["nombre_grupo"],
            row["tipo_salud"],
            row["escenario_empresa"],
            row["nombre_escenario"],
            row["tasa_cotizacion"],
            row.get("vigente", True),
            row["vigencia_inicio"],
            row.get("vigencia_fin"),
            row.get("fuente"),
            row.get("observacion"),
        )
        for row in rows_payload
    ]

    lines: list[str] = [
        "-- -----------------------------------------------------------------------------",
        "-- Tasas básicas IPS / Ex-Cajas régimen antiguo",
        "-- -----------------------------------------------------------------------------",
        "CREATE TEMP TABLE _expected_ips_tasa_basica (grupo_trabajador TEXT, nombre_grupo TEXT, tipo_salud TEXT, escenario_empresa TEXT, nombre_escenario TEXT, tasa_cotizacion NUMERIC, vigente BOOLEAN, vigencia_inicio DATE, vigencia_fin DATE, fuente TEXT, observacion TEXT) ON COMMIT PRESERVE ROWS;",
        "INSERT INTO _expected_ips_tasa_basica (grupo_trabajador, nombre_grupo, tipo_salud, escenario_empresa, nombre_escenario, tasa_cotizacion, vigente, vigencia_inicio, vigencia_fin, fuente, observacion) VALUES",
        f"  {rows_values(rows)};",
        "",
        render_compare_notice_catalogo(
            "SELECT grupo_trabajador::TEXT, nombre_grupo::TEXT, tipo_salud::TEXT, escenario_empresa::TEXT, nombre_escenario::TEXT, tasa_cotizacion, vigente, vigencia_inicio, vigencia_fin, fuente::TEXT, observacion::TEXT FROM ips_ex_caja_tasa_basica WHERE vigencia_inicio = (SELECT MIN(vigencia_inicio) FROM _expected_ips_tasa_basica)",
            "SELECT grupo_trabajador, nombre_grupo, tipo_salud, escenario_empresa, nombre_escenario, tasa_cotizacion, vigente, vigencia_inicio, vigencia_fin, fuente, observacion FROM _expected_ips_tasa_basica",
            "ips_ex_caja_tasa_basica",
        ).rstrip(),
        render_upsert_from_temp(
            "ips_ex_caja_tasa_basica",
            "_expected_ips_tasa_basica",
            [
                "grupo_trabajador",
                "nombre_grupo",
                "tipo_salud",
                "escenario_empresa",
                "nombre_escenario",
                "tasa_cotizacion",
                "vigente",
                "vigencia_inicio",
                "vigencia_fin",
                "fuente",
                "observacion",
            ],
            ["grupo_trabajador", "tipo_salud", "escenario_empresa", "vigencia_inicio"],
            ["nombre_grupo", "nombre_escenario", "tasa_cotizacion", "vigente", "vigencia_fin", "fuente", "observacion"],
        ),
        "",
    ]

    return "\n".join(lines)


def render_preparacion_periodo_sql(payload: dict[str, Any], *, schema: str = "public", modo_ejecucion: str = "preparar") -> str:
    payload = payload_preparacion_sin_mensuales_oficiales(payload)
    periodo_row = payload["periodo_remuneracion"]
    periodo = periodo_row["codigo"]
    safe_schema = schema.replace('"', '""')

    lines: list[str] = [
        "-- Preparacion inicial parcial de periodo v6.11",
        "-- No carga indicadores mensuales oficiales ni copia datos desde meses anteriores.",
        "-- Reejecutable: usa UPSERT y no degrada periodos cerrados/corregidos.",
        "BEGIN;",
        f'SET LOCAL search_path TO "{safe_schema}", public;',
        "",
    ]
    lines.extend(render_drop_temp_tables())
    lines.extend(render_preparation_infra_sql())
    lines.append(render_periodo_remuneracion_upsert(periodo_row, "parcial"))
    lines.append("")

    normativa_sql = render_normativa_base_sql(payload)
    if normativa_sql:
        lines.extend([normativa_sql, ""])

    ips_tasas_sql = render_ips_tasas_sql(payload)
    if ips_tasas_sql:
        lines.extend([ips_tasas_sql, ""])

    lines.extend(
        [
            "DO $$",
            "BEGIN",
            f"    RAISE NOTICE 'periodo preparado: {periodo}';",
            f"    RAISE NOTICE 'modo ejecucion: {modo_ejecucion}';",
            "    RAISE NOTICE 'tablas cargadas/aseguradas: periodo_remuneracion, ccaf_entidad, organismo_administrador_ley_16744, institucion_apv, forma_pago_apv, parametros_legales, reforma_previsional_parametro, trabajo_pesado_parametro, ips_ex_caja_tasa_basica';",
            "    RAISE NOTICE 'tablas pendientes oficiales: parametros_generales, tramo_carga, tramo_impuesto, tabla_impuesto_unico, ley_16744_parametros mensual';",
            "    RAISE NOTICE 'fuente: normativa_base v6.11 / IPS v6.11; sin UF/UTM/UTA ni tramos oficiales mensuales inventados';",
            "    RAISE NOTICE 'fecha_hora: now()';",
            "END $$;",
            "",
            "COMMIT;",
            "",
        ]
    )
    return "\n".join(lines)


def write_preparacion_manifest(output_path: Path, payload: dict[str, Any], modo_ejecucion: str) -> Path:
    periodo = payload["periodo_remuneracion"]["codigo"]
    normativa_data = extract_normativa_data(payload)
    manifest = {
        "periodo": periodo,
        "estado": "parcial",
        "modo_ejecucion": modo_ejecucion,
        "sql": str(output_path),
        "tablas_cargadas": [
            "periodo_remuneracion",
            "ccaf_entidad",
            "organismo_administrador_ley_16744",
            "institucion_apv",
            "forma_pago_apv",
            "parametros_legales",
            "reforma_previsional_parametro",
            "trabajo_pesado_parametro",
            "ips_ex_caja_tasa_basica",
        ],
        "tablas_pendientes": [
            "parametros_generales",
            "tramo_carga",
            "tramo_impuesto",
            "tabla_impuesto_unico",
            "ley_16744_parametros mensual",
        ],
        "fuentes": [
            source.get("url") or source.get("key")
            for source in payload.get("normativa_base", {}).get("sources", [])
            if isinstance(source, dict)
        ],
        "normativa_keys": sorted(normativa_data.keys()),
        "no_copia_datos_oficiales": True,
        "no_sql_destructivo": True,
    }
    manifest_path = output_path.with_name(f"manifest_preparacion_periodo_{periodo}_v611.json")
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return manifest_path


def payload_preparacion_sin_mensuales_oficiales(payload: dict[str, Any]) -> dict[str, Any]:
    clean = dict(payload)
    normativa = clean.get("normativa_base")
    if isinstance(normativa, dict):
        normativa_clean = dict(normativa)
        data = normativa_clean.get("data")
        if isinstance(data, dict):
            data_clean = dict(data)
            data_clean.pop("ley_16744_parametros", None)
            normativa_clean["data"] = data_clean
        clean["normativa_base"] = normativa_clean
    return clean



def render_sql(payload: dict[str, Any], *, schema: str = "public", strict: bool = True) -> str:
    errors = validate_payload(payload, strict=strict)
    if errors:
        raise ValueError("JSON mensual inválido:\n- " + "\n- ".join(errors))

    periodo = payload["periodo_remuneracion"]["codigo"]
    vigencia_inicio = payload["periodo_remuneracion"]["fecha_inicio"]

    safe_schema = schema.replace('"', '""')
    lines: list[str] = [
        "-- Fase 2 mensual v6.11",
        "-- Generado por render_parametros_mensuales_v611_sql.py",
        "-- Entrada: JSON mensual normalizado. Salida: único SQL aplicable para el periodo.",
        "-- Reejecutable: limpia temporales y reconstruye la data mensual del periodo/vigencia.",
        "BEGIN;",
        f'SET LOCAL search_path TO "{safe_schema}", public;',
        "",
    ]

    lines.extend(render_drop_temp_tables())
    lines.extend(render_period_precleanup(payload))

    normativa_sql = render_normativa_base_sql(payload)
    if normativa_sql:
        lines.extend([normativa_sql, ""])

    ips_tasas_sql = render_ips_tasas_sql(payload)
    if ips_tasas_sql:
        lines.extend([ips_tasas_sql, ""])

    periodo_row = payload["periodo_remuneracion"]
    estado_mensual = str(periodo_row.get("estado") or "").lower()
    if estado_mensual not in {"corregido", "cerrado"}:
        estado_mensual = "cargado"
    lines.append(render_periodo_remuneracion_upsert(periodo_row, estado_mensual))
    lines.append("")

    parametros_legales = normalize_parametros_legales(payload.get("parametros_legales", []), periodo)
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
                "CREATE TEMP TABLE _expected_parametros_legales (nombre TEXT, valor_decimal NUMERIC, valor_entero INTEGER, vigencia_inicio DATE, vigencia_fin DATE, periodo TEXT) ON COMMIT PRESERVE ROWS;",
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
        ley_sanna_payload = payload.get("ley_sanna")
        if not isinstance(ley_sanna_payload, dict):
            normativa = payload.get("normativa_base")
            if isinstance(normativa, dict):
                norm_data = normativa.get("data")
                if isinstance(norm_data, dict) and isinstance(norm_data.get("ley_sanna"), dict):
                    ley_sanna_payload = norm_data["ley_sanna"]
        compat = finalize_parametros_generales_compat(
            dict(compat),
            parametros_legales=parametros_legales or payload.get("parametros_legales"),
            ley_sanna=ley_sanna_payload if isinstance(ley_sanna_payload, dict) else None,
        )
        columns = PARAMETROS_GENERALES_V11_COLUMNS
        col_sql = ", ".join(columns)
        type_sql = PARAMETROS_GENERALES_V11_TEMP_TYPES
        values = tuple(compat.get(column) for column in columns)
        lines.extend(
            [
                f"CREATE TEMP TABLE _expected_parametros_generales ({type_sql}) ON COMMIT PRESERVE ROWS;",
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
                "CREATE TEMP TABLE _expected_afc_parametro (codigo_tipo_contrato tipo_contrato_enum, aplica_seguro BOOLEAN, aplica_trabajador BOOLEAN, tasa_trabajador NUMERIC, tasa_empleador NUMERIC, vigencia_inicio DATE, vigencia_fin DATE, observacion TEXT, periodo TEXT) ON COMMIT PRESERVE ROWS;",
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
                "CREATE TEMP TABLE _expected_tramo_carga (periodo TEXT, desde NUMERIC, hasta NUMERIC, valor NUMERIC, tramo TEXT) ON COMMIT PRESERVE ROWS;",
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
                "CREATE TEMP TABLE _expected_tabla_impuesto_unico (tramo INTEGER, desde NUMERIC, hasta NUMERIC, factor NUMERIC, rebaja NUMERIC, vigencia_inicio DATE, vigencia_fin DATE) ON COMMIT PRESERVE ROWS;",
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

    if payload.get("tabla_impuesto_unico"):
        lines.extend(
            render_tramo_impuesto_sync_from_tabla(periodo, vigencia_inicio),
        )

    updates = payload.get("afp_vigencia_updates", [])
    if updates:
        expected_rows = [(row["afp_nombre"], row["vigencia_inicio"], row.get("sis"), row.get("tope_imponible_uf")) for row in updates]
        lines.extend(
            [
                "CREATE TEMP TABLE _expected_afp_vigencia_update (afp_nombre TEXT, vigencia_inicio DATE, sis NUMERIC, tope_imponible_uf NUMERIC) ON COMMIT PRESERVE ROWS;",
                "INSERT INTO _expected_afp_vigencia_update (afp_nombre, vigencia_inicio, sis, tope_imponible_uf) VALUES",
                f"  {rows_values(expected_rows)};",
                "",
                render_compare_notice(
                    "afp_vigencia",
                    f"SELECT a.nombre::TEXT AS afp_nombre, av.vigencia_inicio, av.sis, av.tope_imponible_uf FROM afp_vigencia av JOIN afp a ON a.id_afp = av.id_afp WHERE av.vigencia_inicio = DATE {sql_literal(vigencia_inicio)} AND a.nombre IN (SELECT afp_nombre FROM _expected_afp_vigencia_update)",
                    "SELECT afp_nombre, vigencia_inicio, sis, tope_imponible_uf FROM _expected_afp_vigencia_update",
                    "afp_vigencia",
                ).rstrip(),
                "-- UPSERT robusto: si la vigencia AFP mensual no existe, la crea tomando como base la última vigencia disponible.",
                "INSERT INTO afp_vigencia (",
                "    id_afp, tasa_obligatoria, comision, sis, tasa_empleador,",
                "    tope_imponible_uf, forma_pago_apvi, vigente, vigencia_inicio, vigencia_fin",
                ")",
                "SELECT",
                "    a.id_afp,",
                "    COALESCE(ultima.tasa_obligatoria, a.tasa_obligatoria, 10.0000),",
                "    COALESCE(ultima.comision, a.comision, 0),",
                "    COALESCE(expected.sis, ultima.sis, a.sis, 0),",
                "    COALESCE(ultima.tasa_empleador, a.tasa_empleador, 0),",
                "    COALESCE(expected.tope_imponible_uf, ultima.tope_imponible_uf),",
                "    COALESCE(ultima.forma_pago_apvi, a.forma_pago_apvi),",
                "    TRUE,",
                "    expected.vigencia_inicio,",
                "    NULL",
                "FROM _expected_afp_vigencia_update expected",
                "JOIN afp a ON a.nombre = expected.afp_nombre",
                "LEFT JOIN LATERAL (",
                "    SELECT av.*",
                "    FROM afp_vigencia av",
                "    WHERE av.id_afp = a.id_afp",
                "      AND av.vigencia_inicio <= expected.vigencia_inicio",
                "    ORDER BY av.vigencia_inicio DESC",
                "    LIMIT 1",
                ") ultima ON TRUE",
                "ON CONFLICT (id_afp, vigencia_inicio) DO UPDATE SET",
                "    sis = EXCLUDED.sis,",
                "    tope_imponible_uf = EXCLUDED.tope_imponible_uf,",
                "    vigente = TRUE;",
                "",
            ]
        )

    lines.extend(["COMMIT;", ""])
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Render mensual v6.11: convierte JSON mensual normalizado en un único SQL aplicable."
    )
    parser.add_argument("--input", default=str(DATA_DIR / "parametros_mensuales_v611.json"))
    parser.add_argument("--output", help="Ruta del SQL final. Si se omite, usa parametros_mensuales_YYYY-MM_v611.sql junto al JSON.")
    parser.add_argument("--schema", default="public", help="Schema PostgreSQL objetivo. Default: public")
    parser.add_argument("--no-strict", action="store_true", help="Permite generar SQL aunque falten secciones mensuales. No recomendado.")
    parser.add_argument(
        "--strict-sources",
        action="store_true",
        help="Aborta si el JSON tiene fallback/partial en fuentes críticas.",
    )
    parser.add_argument(
        "--allow-offline-sources",
        action="store_true",
        help="Con --strict-sources, permite normativa en modo offline (raw local).",
    )
    parser.add_argument("--preparar-periodo", help="Genera SQL de preparacion parcial para YYYY-MM sin datos mensuales oficiales.")
    parser.add_argument("--normativa-json", help="JSON faltantes_all_v611.json para preparacion parcial.")
    parser.add_argument("--ips-tasas-json", help="JSON ips_tasas_YYYY-MM_v611.json para preparacion parcial.")
    parser.add_argument("--modo-ejecucion", default="preparar", help="Etiqueta de log/manifest para preparacion parcial.")
    parser.add_argument(
        "--regenerar-runs",
        action="store_true",
        help="Regenera todos los parametros_mensuales_*_v611.sql bajo runs/**/mensual/ desde su JSON.",
    )
    parser.add_argument("--runs-dir", default=str(BASE_DIR / "runs"), help="Raiz de runs/ para --regenerar-runs.")
    args = parser.parse_args()

    if args.regenerar_runs:
        outputs = regenerar_todos_los_sql_runs(
            schema=args.schema,
            strict=not args.no_strict,
            runs_dir=Path(args.runs_dir),
        )
        if not outputs:
            print(f"No se encontraron JSON mensuales en {args.runs_dir}")
            return 1
        for output_path in outputs:
            print(output_path)
        return 0

    if args.preparar_periodo:
        payload: dict[str, Any] = {
            "periodo_remuneracion": build_periodo_remuneracion(args.preparar_periodo, "parcial"),
        }
        if args.normativa_json:
            normativa_path = Path(args.normativa_json)
            normativa_payload = json.loads(normativa_path.read_text(encoding="utf-8"))
            payload["normativa_base"] = {
                "generated_at": normativa_payload.get("generated_at"),
                "flow": normativa_payload.get("flow"),
                "offline": normativa_payload.get("offline", False),
                "data": normativa_payload.get("data", {}),
                "sources": normativa_payload.get("sources", []),
                "flows": normativa_payload.get("flows", []),
            }
        if args.ips_tasas_json:
            ips_path = Path(args.ips_tasas_json)
            payload["ips_tasas"] = json.loads(ips_path.read_text(encoding="utf-8"))
        payload = payload_preparacion_sin_mensuales_oficiales(payload)

        output_path = Path(args.output) if args.output else Path.cwd() / f"preparacion_periodo_{args.preparar_periodo}_v611.sql"
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(
            render_preparacion_periodo_sql(payload, schema=args.schema, modo_ejecucion=args.modo_ejecucion),
            encoding="utf-8",
        )
        manifest_path = write_preparacion_manifest(output_path, payload, args.modo_ejecucion)
        print(output_path)
        print(manifest_path)
        return 0

    input_path = Path(args.input)
    payload = json.loads(input_path.read_text(encoding="utf-8"))

    if args.strict_sources:
        enforce_strict_sources(
            payload,
            allow_offline=args.allow_offline_sources,
            allow_controlled_matrix=True,
        )
    else:
        summarize_provenance(payload)

    output_path = Path(args.output) if args.output else default_output_path(input_path, payload)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    sql = render_sql(payload, schema=args.schema, strict=not args.no_strict)
    output_path.write_text(sql, encoding="utf-8")

    print(output_path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
