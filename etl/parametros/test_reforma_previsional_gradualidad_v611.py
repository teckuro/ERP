#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
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


def assert_period(rows: list[dict], periodo: str, total: float) -> None:
    vigente = [
        row
        for row in rows
        if row["vigencia_inicio"][:7] <= periodo <= (row["vigencia_fin"] or "9999-12-31")[:7]
    ]
    assert len(vigente) == 1, f"{periodo} debe resolver un unico tramo, resolvio {len(vigente)}"
    assert round(float(vigente[0]["aporte_empleador_total"]), 2) == total


def main() -> int:
    normativa = load_normativa_module()
    result = normativa.parse_reforma_previsional({})
    rows = result.data["reforma_previsional"]

    assert len(rows) == 9
    assert not normativa.validate_reforma_previsional_gradualidad(rows)
    assert_period(rows, "2025-08", 1.00)
    assert_period(rows, "2026-08", 3.50)
    assert_period(rows, "2033-08", 8.50)

    for row in rows:
        total = round(
            row["cuenta_capitalizacion_individual"]
            + row["cotizacion_rentabilidad_protegida"]
            + row["seguro_social_sis_cev"],
            2,
        )
        assert total == round(row["aporte_empleador_total"], 2), row["codigo"]

    print("OK gradualidad reforma previsional")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
