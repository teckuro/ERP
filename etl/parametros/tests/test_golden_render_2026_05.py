#!/usr/bin/env python3
"""Golden test: render SQL desde fixture congelado 2026-05 (sin red)."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from v611_provenance import (  # noqa: E402
    enforce_strict_sources,
    summarize_provenance,
    validate_strict_sources,
)
from importlib.util import module_from_spec, spec_from_file_location  # noqa: E402


FIXTURE = ROOT / "tests" / "fixtures" / "parametros_mensuales_2026-05_v611.json"


def load_renderer():
    script = ROOT / "04_render_parametros_mensuales_v611_sql_full.py"
    spec = spec_from_file_location("render_mensual_v611", script)
    assert spec is not None and spec.loader is not None
    module = module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


@pytest.fixture(scope="module")
def payload() -> dict:
    return json.loads(FIXTURE.read_text(encoding="utf-8"))


@pytest.fixture(scope="module")
def renderer():
    return load_renderer()


def test_fixture_exists():
    assert FIXTURE.exists(), f"Falta fixture golden: {FIXTURE}"


def test_provenance_scraped_and_controlled(payload: dict):
    summary = summarize_provenance(payload)
    statuses = {e["key"]: e["status"] for e in summary["entries"]}
    assert statuses.get("previred_indicadores") == "scraped"
    assert statuses.get("sii_impuesto") == "scraped"
    assert statuses.get("ips_tasa_basica") == "controlled_matrix"
    assert not summary["has_fallback"]


def test_strict_sources_passes(payload: dict):
    errors = validate_strict_sources(payload, allow_offline=False, allow_controlled_matrix=True)
    assert errors == []
    enforce_strict_sources(payload, allow_offline=False)


def test_strict_sources_blocks_fallback(payload: dict):
    bad = json.loads(json.dumps(payload))
    bad["metadata"]["source_status"]["previred_indicadores"]["status"] = "fallback"
    bad["metadata"]["source_status"]["previred_indicadores"]["detail"] = "simulado"
    errors = validate_strict_sources(bad)
    assert any("previred_indicadores" in e for e in errors)


def test_render_sql_golden_structure(payload: dict, renderer, tmp_path: Path):
    sql = renderer.render_sql(payload, schema="public", strict=True)
    out = tmp_path / "out.sql"
    out.write_text(sql, encoding="utf-8")

    assert "BEGIN;" in sql
    assert "COMMIT;" in sql
    assert "parametros_generales" in sql
    assert "tabla_impuesto_unico" in sql
    assert "tramo_carga" in sql
    assert "ips_ex_caja_tasa_basica" in sql or "ips_tasa" in sql.lower()
    assert re.search(r"2026-05", sql)

    # Valores clave del mes (golden): UF / UTM del fixture
    assert "40610.69" in sql or "40610,69" in sql
    assert "70588" in sql

    # Idempotencia: upserts, no DELETE ciego de tramo_carga referenciado
    assert "ON CONFLICT" in sql
