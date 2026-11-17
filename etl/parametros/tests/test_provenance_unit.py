#!/usr/bin/env python3
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from v611_provenance import make_source, summarize_provenance, validate_strict_sources


def test_make_source_defaults():
    row = make_source("x", status="fallback", detail="demo")
    assert row["ok"] is False
    assert row["status"] == "fallback"


def test_offline_normativa_allowed_when_flag():
    payload = {
        "metadata": {
            "source_status": {
                "previred_indicadores": make_source("previred_indicadores", status="scraped"),
                "sii_impuesto": make_source("sii_impuesto", status="scraped"),
            }
        },
        "parametros_generales_compat": {"periodo": "2026-05"},
        "normativa_base": {
            "offline": True,
            "flows": [{"flow": "mensual_normativo", "status": "ok", "warnings": []}],
        },
        "ips_tasas": {},
    }
    summary = summarize_provenance(payload)
    assert any(e["status"] == "offline" for e in summary["entries"] if str(e["key"]).startswith("normativa:"))
    assert validate_strict_sources(payload, allow_offline=True) == []
    blocked = validate_strict_sources(payload, allow_offline=False)
    assert any("offline" in e for e in blocked)
