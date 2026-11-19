#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path
from typing import Any


def run(cmd: list[str], cwd: Path | None = None) -> None:
    print("\n$ " + " ".join(str(x) for x in cmd))
    subprocess.run(cmd, check=True, cwd=str(cwd) if cwd else None)


def first_existing(paths: list[Path], label: str) -> Path:
    for path in paths:
        if path.exists():
            return path
    raise FileNotFoundError(
        f"No encontré {label}. Busqué:\n" + "\n".join(f"- {path}" for path in paths)
    )


def find_normativa_script(here: Path, explicit: str | None) -> Path:
    if explicit:
        path = Path(explicit)
        if not path.is_absolute():
            path = (here / path).resolve()
        if not path.exists():
            raise FileNotFoundError(f"No existe el script de normativa: {path}")
        return path

    return first_existing(
        [
            here / "02_normativa_base_v611.py",
            here / "parametros_v611_unificado_alineado.py",
            here / "parametros_v611_unificado_alineado(2).py",
        ],
        "script de normativa base",
    )


def read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, data: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def merge_normativa_into_mensual(mensual_json_path: Path, normativa_json_path: Path) -> None:
    mensual_payload = read_json(mensual_json_path)
    normativa_payload = read_json(normativa_json_path)

    mensual_payload["normativa_base"] = {
        "generated_at": normativa_payload.get("generated_at"),
        "flow": normativa_payload.get("flow"),
        "offline": normativa_payload.get("offline", False),
        "data": normativa_payload.get("data", {}),
        "sources": normativa_payload.get("sources", []),
        "flows": normativa_payload.get("flows", []),
    }

    write_json(mensual_json_path, mensual_payload)


def find_ips_tasas_script(here: Path) -> Path:
    return first_existing(
        [
            here / "06_scrape_ips_tasas_v611.py",
            here / "scrape_ips_tasas_v611.py",
        ],
        "script de tasas IPS",
    )


def merge_ips_tasas_into_mensual(mensual_json_path: Path, ips_tasas_json_path: Path) -> None:
    mensual_payload = read_json(mensual_json_path)
    ips_payload = read_json(ips_tasas_json_path)

    mensual_payload["ips_tasas"] = ips_payload

    write_json(mensual_json_path, mensual_payload)


def copy_compat_json(periodo_json: Path, out_dir: Path) -> None:
    """Mantiene una copia con nombre antiguo para scripts que aún la esperen."""
    compat_path = out_dir / "parametros_mensuales_v611.json"
    if periodo_json.exists():
        compat_path.write_text(periodo_json.read_text(encoding="utf-8"), encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Build mensual v6.11 FULL: genera JSON mensual, incorpora normativa base "
            "y renderiza un único SQL mensual aplicable. Pensado para carpetas por periodo."
        )
    )
    parser.add_argument("--periodo", required=True, help="Periodo YYYY-MM, por ejemplo 2026-04")
    parser.add_argument("--out-dir", default="./runs/2026-04/mensual")
    parser.add_argument("--seed-base-json", default="./out_v611_seed/seed_v611.json")
    parser.add_argument("--schema", default="public")
    parser.add_argument("--previred-indicadores-url")
    parser.add_argument("--sii-impuesto-url")
    parser.add_argument("--verbose", action="store_true")

    parser.add_argument("--no-normativa", action="store_true", help="No incorpora normativa base al SQL mensual.")
    parser.add_argument("--normativa-script", help="Ruta al script 02_normativa_base_v611.py")
    parser.add_argument("--normativa-out-dir", default="./runs/2026-04/normativa_base")
    parser.add_argument("--normativa-offline", action="store_true", help="Usa raw_faltantes_v611 ya descargado para normativa base.")
    parser.add_argument("--keep-normativa-sql", action="store_true", help="Además del SQL mensual final, genera SQL separado de normativa.")
    parser.add_argument("--no-ips-tasas", action="store_true", help="No incorpora matriz básica de tasas IPS/Ex-Cajas.")
    parser.add_argument("--ips-tasas-out-dir", default="./runs/2026-04/ips_tasas", help="Carpeta de salida para JSON de tasas IPS.")
    parser.add_argument("--ips-sin-validar-web", action="store_true", help="No intenta validar la página IPS online.")
    parser.add_argument(
        "--strict-sources",
        action="store_true",
        help="Aborta si hay fallback/partial en fuentes críticas (PreviRed/SII/normativa).",
    )
    args = parser.parse_args()

    here = Path(__file__).resolve().parent

    scraper = first_existing(
        [
            here / "03_scrape_parametros_mensuales_v611_json.py",
            here / "scrape_parametros_mensuales_v611_json.py",
        ],
        "scraper mensual",
    )

    renderer = first_existing(
        [
            here / "04_render_parametros_mensuales_v611_sql_full.py",
            here / "render_parametros_mensuales_v611_sql_full.py",
            here / "render_parametros_mensuales_v611_sql.py",
        ],
        "renderer mensual",
    )

    ips_tasas_script = None if args.no_ips_tasas else find_ips_tasas_script(here)

    out_dir = Path(args.out_dir).expanduser().resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    json_path = out_dir / f"parametros_mensuales_{args.periodo}_v611.json"
    sql_path = out_dir / f"parametros_mensuales_{args.periodo}_v611.sql"

    seed_base_json = Path(args.seed_base_json).expanduser().resolve()
    if not seed_base_json.exists():
        raise FileNotFoundError(f"No existe seed-base-json: {seed_base_json}")

    scrape_cmd = [
        sys.executable,
        str(scraper),
        "--periodo",
        args.periodo,
        "--out-dir",
        str(out_dir),
        "--seed-base-json",
        str(seed_base_json),
    ]
    if args.previred_indicadores_url:
        scrape_cmd += ["--previred-indicadores-url", args.previred_indicadores_url]
    if args.sii_impuesto_url:
        scrape_cmd += ["--sii-impuesto-url", args.sii_impuesto_url]
    if args.verbose:
        scrape_cmd.append("--verbose")

    run(scrape_cmd, cwd=here)

    normativa_json_path: Path | None = None
    if not args.no_normativa:
        normativa_script = find_normativa_script(here, args.normativa_script)
        normativa_out_dir = Path(args.normativa_out_dir).expanduser().resolve()
        normativa_out_dir.mkdir(parents=True, exist_ok=True)
        normativa_json_path = normativa_out_dir / "faltantes_all_v611.json"

        normativa_cmd = [
            sys.executable,
            str(normativa_script),
            "fetch-faltantes",
            "--flow",
            "all",
            "--out-dir",
            str(normativa_out_dir),
            "--sql-mode",
            "executable",
        ]
        if not args.keep_normativa_sql:
            normativa_cmd.append("--no-sql")
        if args.normativa_offline:
            normativa_cmd.append("--offline")

        run(normativa_cmd, cwd=here)

        if not normativa_json_path.exists():
            raise FileNotFoundError(f"No se generó el JSON de normativa esperado: {normativa_json_path}")

        merge_normativa_into_mensual(json_path, normativa_json_path)

    ips_tasas_json_path: Path | None = None
    if ips_tasas_script is not None:
        ips_tasas_out_dir = Path(args.ips_tasas_out_dir).expanduser().resolve()
        ips_tasas_out_dir.mkdir(parents=True, exist_ok=True)
        ips_tasas_json_path = ips_tasas_out_dir / f"ips_tasas_{args.periodo}_v611.json"

        ips_cmd = [
            sys.executable,
            str(ips_tasas_script),
            "--periodo",
            args.periodo,
            "--out-dir",
            str(ips_tasas_out_dir),
        ]
        if args.ips_sin_validar_web:
            ips_cmd.append("--sin-validar-web")

        run(ips_cmd, cwd=here)

        if not ips_tasas_json_path.exists():
            raise FileNotFoundError(f"No se generó el JSON de tasas IPS esperado: {ips_tasas_json_path}")

        merge_ips_tasas_into_mensual(json_path, ips_tasas_json_path)

    render_cmd = [
        sys.executable,
        str(renderer),
        "--input",
        str(json_path),
        "--output",
        str(sql_path),
        "--schema",
        args.schema,
    ]
    if args.strict_sources:
        render_cmd.append("--strict-sources")
        if args.normativa_offline:
            render_cmd.append("--allow-offline-sources")
    run(render_cmd, cwd=here)

    copy_compat_json(json_path, out_dir)

    manifest = {
        "periodo": args.periodo,
        "json_mensual_full": str(json_path),
        "sql_mensual_final": str(sql_path),
        "normativa_json": str(normativa_json_path) if normativa_json_path else None,
        "ips_tasas_json": str(ips_tasas_json_path) if ips_tasas_json_path else None,
        "renderer": str(renderer),
        "scraper": str(scraper),
        "usa_normativa_base": not args.no_normativa,
        "usa_ips_tasas": not args.no_ips_tasas,
        "estructura": "period_dir/mensual + period_dir/normativa_base + period_dir/logs",
    }
    manifest_path = out_dir / f"manifest_parametros_mensuales_{args.periodo}_v611.json"
    write_json(manifest_path, manifest)

    print("\nArchivos finales:")
    print(f"- JSON mensual full : {json_path}")
    if normativa_json_path:
        print(f"- JSON normativa    : {normativa_json_path}")
    if ips_tasas_json_path:
        print(f"- JSON tasas IPS    : {ips_tasas_json_path}")
    print(f"- SQL mensual final : {sql_path}")
    print(f"- Manifest          : {manifest_path}")

    print("\nAplica SOLO este SQL en PostgreSQL:")
    print(f'psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "{sql_path}"')
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
