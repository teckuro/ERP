"""Fragmentos SQL reutilizables para cargas mensuales v6.11.

Evita DELETE en tablas referenciadas por FK operativas del ERP.
"""
from __future__ import annotations

from typing import Any


def sql_literal(value: Any) -> str:
    if value is None:
        return "NULL"
    if isinstance(value, bool):
        return "TRUE" if value else "FALSE"
    if isinstance(value, (int, float)):
        return str(value)
    return "'" + str(value).replace("'", "''") + "'"


def render_tramo_carga_merge(periodo: str) -> list[str]:
    """Actualiza tramos del periodo sin DELETE.

    persona.id_tramo_carga y persona_tramo_carga.id_tramo referencian tramo_carga.id_tramo.
    """
    periodo_sql = sql_literal(periodo)
    return [
        "UPDATE tramo_carga tc",
        "SET",
        "    desde = e.desde,",
        "    hasta = e.hasta,",
        "    valor = e.valor",
        "FROM _expected_tramo_carga e",
        f"WHERE tc.periodo = {periodo_sql}",
        "  AND tc.tramo = e.tramo;",
        "INSERT INTO tramo_carga (periodo, desde, hasta, valor, tramo)",
        "SELECT e.periodo, e.desde, e.hasta, e.valor, e.tramo",
        "FROM _expected_tramo_carga e",
        "WHERE NOT EXISTS (",
        "    SELECT 1",
        "    FROM tramo_carga tc",
        f"    WHERE tc.periodo = {periodo_sql}",
        "      AND tc.tramo = e.tramo",
        ");",
        "",
    ]


def render_period_precleanup_skip_tramo_carga_comment() -> str:
    return (
        "-- No se elimina tramo_carga: persona.id_tramo_carga referencia id_tramo; "
        "se actualiza por (periodo, tramo)."
    )


def render_tramo_impuesto_schema_precision() -> list[str]:
    """Alinea precision de tramo_impuesto con tabla_impuesto_unico (factor SII 0,135 etc.)."""
    return [
        "-- Precision SII: factor con 3+ decimales; rebaja con centavos.",
        "ALTER TABLE tramo_impuesto ALTER COLUMN factor TYPE NUMERIC(8,6);",
        "ALTER TABLE tramo_impuesto ALTER COLUMN rebaja TYPE NUMERIC(18,2);",
        "",
    ]


def render_tramo_impuesto_sync_from_tabla(periodo: str, vigencia_inicio: str) -> list[str]:
    """Espejo mensual exacto desde tabla_impuesto_unico (fuente SII)."""
    periodo_sql = sql_literal(periodo)
    vigencia_sql = sql_literal(vigencia_inicio)
    return [
        f"DELETE FROM tramo_impuesto WHERE periodo = {periodo_sql};",
        "INSERT INTO tramo_impuesto (periodo, desde, hasta, factor, rebaja)",
        "SELECT",
        f"  {periodo_sql},",
        "  TRUNC(desde)::NUMERIC(12,0),",
        "  CASE WHEN hasta IS NULL THEN NULL ELSE TRUNC(hasta)::NUMERIC(12,0) END,",
        "  factor,",
        "  rebaja",
        "FROM tabla_impuesto_unico",
        f"WHERE vigencia_inicio = DATE {vigencia_sql};",
        "",
    ]
