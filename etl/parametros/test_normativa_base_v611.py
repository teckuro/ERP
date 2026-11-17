#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import re
import sys
from pathlib import Path


def load_normativa_module():
    script = Path(__file__).with_name("02_normativa_base_v611.py")
    spec = importlib.util.spec_from_file_location("normativa_base_v611", script)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"No se pudo cargar {script}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def normalize_sql(sql: str) -> str:
    return re.sub(r"\s+", " ", sql.replace('"', "")).strip()


def table_create_block(sql: str, table: str) -> str:
    table_name = rf'(?:"[^"]+"\.)?"{re.escape(table)}"'
    pattern = rf"CREATE TABLE IF NOT EXISTS\s+{table_name}.*?\);"
    match = re.search(pattern, sql, flags=re.DOTALL)
    assert match, f"No se encontro CREATE TABLE para {table}"
    return normalize_sql(match.group(0))


def insert_block(sql: str, table: str) -> str:
    table_name = rf'(?:"[^"]+"\.)?"{re.escape(table)}"'
    pattern = rf"INSERT INTO\s+{table_name}.*?ON CONFLICT .*?;"
    match = re.search(pattern, sql, flags=re.DOTALL)
    assert match, f"No se encontro INSERT/ON CONFLICT para {table}"
    return normalize_sql(match.group(0))


def assert_no_legacy_codigo_conflict(block: str, table: str) -> None:
    assert "ON CONFLICT (codigo) DO UPDATE" not in block, f"{table} aun usa ON CONFLICT (codigo)"
    assert "codigo VARCHAR(30) NOT NULL UNIQUE" not in block, f"{table} aun define UNIQUE(codigo)"


def main() -> int:
    normativa = load_normativa_module()
    sql = normativa.render_faltantes_sql(
        {
            "trabajo_pesado": [
                {
                    "codigo": "PESADO",
                    "nombre": "Trabajo pesado",
                    "tasa_trabajador": 2.0,
                    "tasa_empleador": 2.0,
                    "tasa_total": 4.0,
                    "requiere_dictamen_cen": True,
                    "fuente": "test-local",
                    "vigente": True,
                    "vigencia_inicio": "2025-08-01",
                    "vigencia_fin": None,
                }
            ],
            "ley_16744_parametros": {
                "codigo": "LEY_16744_BASE",
                "cotizacion_basica_empleador": 0.9,
                "descripcion_tasa_adicional": "test-local",
                "fuente_financiamiento": "test-local",
                "fuente_organismos": "test-local",
                "vigente": True,
                "vigencia_inicio": "2026-04-01",
                "vigencia_fin": None,
            },
        }
    )

    trabajo_create = table_create_block(sql, "trabajo_pesado_parametro")
    assert "periodo VARCHAR(7) NOT NULL" in trabajo_create
    assert "UNIQUE (codigo, periodo)" in trabajo_create
    assert_no_legacy_codigo_conflict(trabajo_create, "trabajo_pesado_parametro")

    trabajo_insert = insert_block(sql, "trabajo_pesado_parametro")
    assert "INSERT INTO public.trabajo_pesado_parametro (codigo, periodo," in trabajo_insert
    assert "ON CONFLICT (codigo, periodo) DO UPDATE" in trabajo_insert
    assert "'2025-08'" in trabajo_insert, "trabajo_pesado_parametro no derivo periodo desde vigencia_inicio"
    assert_no_legacy_codigo_conflict(trabajo_insert, "trabajo_pesado_parametro")

    ley_create = table_create_block(sql, "ley_16744_parametros")
    assert "periodo VARCHAR(7) NOT NULL" in ley_create
    assert "UNIQUE (codigo, periodo)" in ley_create
    assert_no_legacy_codigo_conflict(ley_create, "ley_16744_parametros")

    ley_insert = insert_block(sql, "ley_16744_parametros")
    assert "INSERT INTO public.ley_16744_parametros (codigo, periodo," in ley_insert
    assert "ON CONFLICT (codigo, periodo) DO UPDATE" in ley_insert
    assert "'2026-04'" in ley_insert, "ley_16744_parametros no derivo periodo desde vigencia_inicio"
    assert_no_legacy_codigo_conflict(ley_insert, "ley_16744_parametros")

    print("OK normativa base v6.11")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
