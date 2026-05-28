#!/usr/bin/env python3
"""Copia legacy. Generador canonico: ERP/Python/04_render_parametros_mensuales_v611_sql_full.py"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any, Iterable


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


def rows_values(rows: Iterable[Iterable[Any]]) -> str:
    return ",\n  ".join("(" + ", ".join(sql_literal(value) for value in row) + ")" for row in rows)


def render_tramo_carga_merge(periodo: str) -> list[str]:
  periodo_sql = sql_literal(periodo)
  return [
      "UPDATE tramo_carga tc",
      "SET desde = e.desde, hasta = e.hasta, valor = e.valor",
      "FROM _expected_tramo_carga e",
      f"WHERE tc.periodo = {periodo_sql} AND tc.tramo = e.tramo;",
      "INSERT INTO tramo_carga (periodo, desde, hasta, valor, tramo)",
      "SELECT e.periodo, e.desde, e.hasta, e.valor, e.tramo",
      "FROM _expected_tramo_carga e",
      "WHERE NOT EXISTS (",
      "    SELECT 1 FROM tramo_carga tc",
      f"    WHERE tc.periodo = {periodo_sql} AND tc.tramo = e.tramo",
      ");",
      "",
  ]


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
    lines.append(
        "INSERT INTO periodo_remuneracion (codigo, anio, mes, fecha_inicio, fecha_fin, estado) VALUES "
        f"({sql_literal(periodo_row['codigo'])}, {sql_literal(periodo_row['anio'])}, {sql_literal(periodo_row['mes'])}, "
        f"{sql_literal(periodo_row['fecha_inicio'])}, {sql_literal(periodo_row['fecha_fin'])}, {sql_literal(periodo_row['estado'])}) "
        "ON CONFLICT (codigo) DO UPDATE SET fecha_inicio = EXCLUDED.fecha_inicio, fecha_fin = EXCLUDED.fecha_fin, estado = EXCLUDED.estado;"
    )
    lines.append("")

    parametros_legales = payload.get("parametros_legales", [])
    if parametros_legales:
        expected_rows = [
            (row["nombre"], row.get("valor_decimal"), row.get("valor_entero"), row["vigencia_inicio"], row.get("vigencia_fin"))
            for row in parametros_legales
        ]
        names = ", ".join(sql_literal(row["nombre"]) for row in parametros_legales)
        lines.extend(
            [
                "CREATE TEMP TABLE _expected_parametros_legales (nombre TEXT, valor_decimal NUMERIC, valor_entero INTEGER, vigencia_inicio DATE, vigencia_fin DATE) ON COMMIT DROP;",
                "INSERT INTO _expected_parametros_legales (nombre, valor_decimal, valor_entero, vigencia_inicio, vigencia_fin) VALUES",
                f"  {rows_values(expected_rows)};",
                "",
                render_compare_notice(
                    "parametros_legales",
                    f"SELECT nombre::TEXT, valor_decimal, valor_entero, vigencia_inicio, vigencia_fin FROM parametros_legales WHERE vigencia_inicio = DATE {sql_literal(vigencia_inicio)} AND nombre IN ({names})",
                    "SELECT nombre, valor_decimal, valor_entero, vigencia_inicio, vigencia_fin FROM _expected_parametros_legales",
                    "parametros_legales",
                ).rstrip(),
                f"DELETE FROM parametros_legales WHERE vigencia_inicio = DATE {sql_literal(vigencia_inicio)} AND nombre IN (SELECT nombre FROM _expected_parametros_legales);",
                "INSERT INTO parametros_legales (nombre, valor_decimal, valor_entero, vigencia_inicio, vigencia_fin)",
                "SELECT nombre, valor_decimal, valor_entero, vigencia_inicio, vigencia_fin FROM _expected_parametros_legales;",
                "",
            ]
        )

    compat = payload.get("parametros_generales_compat")
    if compat:
        columns = [
            "periodo",
            "uf",
            "utm",
            "sueldo_minimo",
            "sueldo_minimo18_65",
            "gratificacion",
            "imm_gratificacion",
            "tope_afp",
            "tope_ips",
            "tope_cesantia",
            "tope_afpvoluntario",
            "sis",
            "dsctosbpordia",
            "afc_trabajador_indefinido",
            "afc_empleador_indefinido",
            "afc_empleador_plazo",
        ]
        col_sql = ", ".join(columns)
        type_sql = "periodo TEXT, uf NUMERIC, utm NUMERIC, sueldo_minimo NUMERIC, sueldo_minimo18_65 NUMERIC, gratificacion BOOLEAN, imm_gratificacion NUMERIC, tope_afp NUMERIC, tope_ips NUMERIC, tope_cesantia NUMERIC, tope_afpvoluntario NUMERIC, sis NUMERIC, dsctosbpordia BOOLEAN, afc_trabajador_indefinido NUMERIC, afc_empleador_indefinido NUMERIC, afc_empleador_plazo NUMERIC"
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
            )
            for row in afc_rows
        ]
        lines.extend(
            [
                "CREATE TEMP TABLE _expected_afc_parametro (codigo_tipo_contrato tipo_contrato_enum, aplica_seguro BOOLEAN, aplica_trabajador BOOLEAN, tasa_trabajador NUMERIC, tasa_empleador NUMERIC, vigencia_inicio DATE, vigencia_fin DATE, observacion TEXT) ON COMMIT DROP;",
                "INSERT INTO _expected_afc_parametro (codigo_tipo_contrato, aplica_seguro, aplica_trabajador, tasa_trabajador, tasa_empleador, vigencia_inicio, vigencia_fin, observacion) VALUES",
                f"  {rows_values(expected_rows)};",
                "",
                render_compare_notice(
                    "afc_parametro",
                    f"SELECT codigo_tipo_contrato, aplica_seguro, aplica_trabajador, tasa_trabajador, tasa_empleador, vigencia_inicio, vigencia_fin, observacion FROM afc_parametro WHERE vigencia_inicio = DATE {sql_literal(vigencia_inicio)}",
                    "SELECT codigo_tipo_contrato, aplica_seguro, aplica_trabajador, tasa_trabajador, tasa_empleador, vigencia_inicio, vigencia_fin, observacion FROM _expected_afc_parametro",
                    "afc_parametro",
                ).rstrip(),
                f"DELETE FROM afc_parametro WHERE vigencia_inicio = DATE {sql_literal(vigencia_inicio)};",
                "INSERT INTO afc_parametro (codigo_tipo_contrato, aplica_seguro, aplica_trabajador, tasa_trabajador, tasa_empleador, vigencia_inicio, vigencia_fin, observacion)",
                "SELECT codigo_tipo_contrato, aplica_seguro, aplica_trabajador, tasa_trabajador, tasa_empleador, vigencia_inicio, vigencia_fin, observacion FROM _expected_afc_parametro;",
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

    tramo_impuesto = payload.get("tramo_impuesto_compat", [])
    if tramo_impuesto:
        expected_rows = [(row["periodo"], row["desde"], row.get("hasta"), row["factor"], row["rebaja"]) for row in tramo_impuesto]
        lines.extend(
            [
                "CREATE TEMP TABLE _expected_tramo_impuesto (periodo TEXT, desde NUMERIC, hasta NUMERIC, factor NUMERIC, rebaja NUMERIC) ON COMMIT DROP;",
                "INSERT INTO _expected_tramo_impuesto (periodo, desde, hasta, factor, rebaja) VALUES",
                f"  {rows_values(expected_rows)};",
                "",
                render_compare_notice(
                    "tramo_impuesto",
                    f"SELECT periodo::TEXT, desde, hasta, factor, rebaja FROM tramo_impuesto WHERE periodo = {sql_literal(periodo)}",
                    "SELECT periodo, desde, hasta, factor, rebaja FROM _expected_tramo_impuesto",
                    "tramo_impuesto",
                ).rstrip(),
                f"DELETE FROM tramo_impuesto WHERE periodo = {sql_literal(periodo)};",
                "INSERT INTO tramo_impuesto (periodo, desde, hasta, factor, rebaja)",
                "SELECT periodo, desde, hasta, factor, rebaja FROM _expected_tramo_impuesto;",
                "",
            ]
        )

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


def main() -> int:
    parser = argparse.ArgumentParser(description="Renderiza SQL mensual v6.11 desde parametros_mensuales_v611.json")
    parser.add_argument("--input", default=str(DATA_DIR / "parametros_mensuales_v611.json"))
    parser.add_argument("--output", default=str(DATA_DIR / "parametros_mensuales_v611.sql"))
    args = parser.parse_args()

    input_path = Path(args.input)
    output_path = Path(args.output)
    payload = json.loads(input_path.read_text(encoding="utf-8"))
    output_path.write_text(render_sql(payload), encoding="utf-8")
    print(output_path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
