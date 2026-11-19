#!/usr/bin/env python3
from __future__ import annotations

import argparse
import os
import subprocess
import sys
from datetime import datetime
from pathlib import Path


REQUIRED_FILES = [
    "01_scrape_semillas_v611.py",
    "02_normativa_base_v611.py",
    "03_scrape_parametros_mensuales_v611_json.py",
    "04_render_parametros_mensuales_v611_sql_full.py",
    "05_build_parametros_mensuales_v611_full.py",
    "06_scrape_ips_tasas_v611.py",
]

MODO_CHOICES = ["preparar", "mensual", "full"]


def now_stamp() -> str:
    return datetime.now().strftime("%Y%m%d_%H%M%S")


def fail(message: str) -> None:
    raise SystemExit(f"ERROR: {message}")


def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)
    gitkeep = path / ".gitkeep"
    if not gitkeep.exists():
        gitkeep.write_text("", encoding="utf-8")


def check_required_files(root: Path) -> None:
    missing = [name for name in REQUIRED_FILES if not (root / name).exists()]
    if missing:
        fail(
            "Faltan archivos requeridos en la carpeta del flujo:\n"
            f"{root}\n\n"
            "Archivos faltantes:\n"
            + "\n".join(f"- {name}" for name in missing)
        )


def write_log(log_path: Path, title: str, command: list[str], output: str) -> None:
    log_path.parent.mkdir(parents=True, exist_ok=True)
    content = [
        f"# {title}",
        f"Fecha: {datetime.now().isoformat(timespec='seconds')}",
        "",
        "Comando:",
        " ".join(command),
        "",
        "Salida:",
        output,
        "",
    ]
    log_path.write_text("\n".join(content), encoding="utf-8")


def run_command(
    command: list[str],
    *,
    cwd: Path,
    title: str,
    log_path: Path,
    dry_run: bool = False,
) -> None:
    print(f"\n==> {title}")
    print(" ".join(command))

    if dry_run:
        write_log(log_path, title, command, "DRY RUN: comando no ejecutado.")
        return

    env = os.environ.copy()
    env.setdefault("PYTHONUTF8", "1")

    proc = subprocess.run(
        command,
        cwd=str(cwd),
        env=env,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )

    write_log(log_path, title, command, proc.stdout)

    if proc.returncode != 0:
        print(proc.stdout)
        fail(f"Falló el paso: {title}. Revisa el log: {log_path}")

    if proc.stdout.strip():
        print(proc.stdout.strip())


def resolve_database_url(cli_value: str | None) -> str | None:
    return cli_value or os.environ.get("DATABASE_URL") or os.environ.get("SUPABASE_DB_URL")


def run_psql(
    sql_path: Path,
    *,
    database_url: str | None,
    cwd: Path,
    title: str,
    log_path: Path,
    dry_run: bool = False,
) -> None:
    if not database_url:
        fail("Para aplicar SQL necesitas --database-url o DATABASE_URL/SUPABASE_DB_URL.")

    if not sql_path.exists() and not dry_run:
        fail(f"No existe el SQL a aplicar: {sql_path}")

    command = [
        "psql",
        database_url,
        "-v",
        "ON_ERROR_STOP=1",
        "-f",
        str(sql_path),
    ]

    run_command(command, cwd=cwd, title=title, log_path=log_path, dry_run=dry_run)


def seed_exists(seed_dir: Path) -> bool:
    return (seed_dir / "seed_v611.json").exists() and (seed_dir / "seed_v611.sql").exists()


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Orquestador único v6.11 con carpetas por periodo. "
            "Ejemplo: runs/2026-04/mensual, runs/2026-04/normativa_base, runs/2026-04/logs."
        )
    )
    parser.add_argument("--periodo", required=True, help="Periodo mensual YYYY-MM. Ejemplo: 2026-04.")
    parser.add_argument(
        "--modo",
        choices=MODO_CHOICES,
        default="full",
        help="preparar: crea SQL parcial sin mensuales oficiales; mensual/full: genera carga mensual oficial.",
    )
    parser.add_argument("--base-dir", default=".", help="Carpeta donde están los scripts 01..05.")
    parser.add_argument("--runs-dir", default="./runs", help="Carpeta raíz para ejecuciones por periodo.")
    parser.add_argument("--seed-dir", default="./out_v611_seed", help="Carpeta común para seed_v611.json/sql.")
    parser.add_argument(
        "--seed",
        choices=["auto", "always", "skip"],
        default="auto",
        help="auto: genera semilla si no existe; always: regenera; skip: omite.",
    )
    parser.add_argument("--aplicar-seed", action="store_true", help="Aplica seed_v611.sql con psql.")
    parser.add_argument("--aplicar-mensual", action="store_true", help="Aplica el SQL mensual final con psql.")
    parser.add_argument("--database-url", default=None, help="URL PostgreSQL. Si se omite usa DATABASE_URL/SUPABASE_DB_URL.")
    parser.add_argument("--python", default=sys.executable, help="Python a usar. Por defecto: el actual.")
    parser.add_argument("--schema", default="public")
    parser.add_argument("--dry-run", action="store_true", help="Muestra comandos y crea logs sin ejecutar.")
    parser.add_argument("--normativa-offline", action="store_true", help="Usa raw normativo local en modo preparar/mensual.")
    parser.add_argument("--ips-sin-validar-web", action="store_true", help="No valida fuente IPS online.")
    parser.add_argument(
        "--strict-sources",
        action="store_true",
        help="Aborta si PreviRed/SII/normativa vienen de fallback o partial.",
    )
    args = parser.parse_args()

    root = Path(args.base_dir).expanduser().resolve()
    check_required_files(root)

    runs_root = (root / args.runs_dir).resolve() if not Path(args.runs_dir).is_absolute() else Path(args.runs_dir).resolve()
    seed_dir = (root / args.seed_dir).resolve() if not Path(args.seed_dir).is_absolute() else Path(args.seed_dir).resolve()

    period_dir = runs_root / args.periodo
    mensual_dir = period_dir / "mensual"
    normativa_dir = period_dir / "normativa_base"
    ips_tasas_dir = period_dir / "ips_tasas"
    logs_dir = period_dir / "logs"

    for path in [runs_root, seed_dir, period_dir, mensual_dir, normativa_dir, ips_tasas_dir, logs_dir]:
        ensure_dir(path)

    stamp = now_stamp()
    db_url = resolve_database_url(args.database_url)

    seed_json = seed_dir / "seed_v611.json"
    seed_sql = seed_dir / "seed_v611.sql"
    mensual_json = mensual_dir / f"parametros_mensuales_{args.periodo}_v611.json"
    mensual_sql = mensual_dir / f"parametros_mensuales_{args.periodo}_v611.sql"
    preparacion_sql = mensual_dir / f"preparacion_periodo_{args.periodo}_v611.sql"
    normativa_json = normativa_dir / "faltantes_all_v611.json"
    ips_tasas_json = ips_tasas_dir / f"ips_tasas_{args.periodo}_v611.json"

    print("Flujo parámetros v6.11")
    print(f"Carpeta scripts : {root}")
    print(f"Periodo         : {args.periodo}")
    print(f"Modo            : {args.modo}")
    print(f"Carpeta periodo : {period_dir}")
    print(f"Mensual         : {mensual_dir}")
    print(f"Normativa       : {normativa_dir}")
    print(f"IPS tasas       : {ips_tasas_dir}")
    print(f"Logs            : {logs_dir}")
    print(f"Seed común      : {seed_dir}")

    should_run_seed = args.seed == "always" or (args.seed == "auto" and not seed_exists(seed_dir))

    if should_run_seed:
        run_command(
            [
                args.python,
                str(root / "01_scrape_semillas_v611.py"),
                "--periodo",
                args.periodo,
                "--out-dir",
                str(seed_dir),
            ],
            cwd=root,
            title="Generar semilla base",
            log_path=logs_dir / f"{stamp}_01_seed.log",
            dry_run=args.dry_run,
        )
    else:
        print("\n==> Semilla base")
        print("SKIP: ya existe o fue omitida por --seed.")

    if args.aplicar_seed:
        run_psql(
            seed_sql,
            database_url=db_url,
            cwd=root,
            title="Aplicar semilla base",
            log_path=logs_dir / f"{stamp}_02_apply_seed.log",
            dry_run=args.dry_run,
        )

    if not seed_json.exists() and not args.dry_run:
        fail(f"No existe {seed_json}. Ejecuta con --seed auto/always o revisa la semilla.")

    if args.modo == "preparar":
        normativa_cmd = [
            args.python,
            str(root / "02_normativa_base_v611.py"),
            "fetch-faltantes",
            "--flow",
            "all",
            "--out-dir",
            str(normativa_dir),
            "--sql-mode",
            "executable",
            "--no-sql",
            "--schema",
            args.schema,
        ]
        if args.normativa_offline:
            normativa_cmd.append("--offline")
        run_command(
            normativa_cmd,
            cwd=root,
            title="Generar normativa base para preparacion parcial",
            log_path=logs_dir / f"{stamp}_03_preparar_normativa.log",
            dry_run=args.dry_run,
        )

        ips_cmd = [
            args.python,
            str(root / "06_scrape_ips_tasas_v611.py"),
            "--periodo",
            args.periodo,
            "--out-dir",
            str(ips_tasas_dir),
        ]
        if args.ips_sin_validar_web:
            ips_cmd.append("--sin-validar-web")
        run_command(
            ips_cmd,
            cwd=root,
            title="Generar tasas IPS para preparacion parcial",
            log_path=logs_dir / f"{stamp}_04_preparar_ips.log",
            dry_run=args.dry_run,
        )

        render_cmd = [
            args.python,
            str(root / "04_render_parametros_mensuales_v611_sql_full.py"),
            "--preparar-periodo",
            args.periodo,
            "--output",
            str(preparacion_sql),
            "--normativa-json",
            str(normativa_json),
            "--ips-tasas-json",
            str(ips_tasas_json),
            "--schema",
            args.schema,
            "--modo-ejecucion",
            args.modo,
        ]
        run_command(
            render_cmd,
            cwd=root,
            title="Render SQL preparacion parcial",
            log_path=logs_dir / f"{stamp}_05_render_preparacion.log",
            dry_run=args.dry_run,
        )

        if not preparacion_sql.exists() and not args.dry_run:
            fail(f"No se genero el SQL de preparacion esperado: {preparacion_sql}")

        print("\nOK preparacion parcial generada.")
        print("\nArchivos principales:")
        print(f"- Preparacion SQL : {preparacion_sql}")
        print(f"- Normativa JSON  : {normativa_json}")
        print(f"- IPS tasas JSON  : {ips_tasas_json}")
        print(f"- Logs del periodo: {logs_dir}")
        print("\nPara aplicar la preparacion manualmente:")
        print(f'psql "$env:DATABASE_URL" -v ON_ERROR_STOP=1 -f "{preparacion_sql}"')
        return 0

    build_cmd = [
        args.python,
        str(root / "05_build_parametros_mensuales_v611_full.py"),
        "--periodo",
        args.periodo,
        "--out-dir",
        str(mensual_dir),
        "--normativa-out-dir",
        str(normativa_dir),
        "--ips-tasas-out-dir",
        str(ips_tasas_dir),
        "--seed-base-json",
        str(seed_json),
        "--schema",
        args.schema,
    ]
    if args.normativa_offline:
        build_cmd.append("--normativa-offline")
    if args.ips_sin_validar_web:
        build_cmd.append("--ips-sin-validar-web")
    if args.strict_sources:
        build_cmd.append("--strict-sources")

    run_command(
        build_cmd,
        cwd=root,
        title="Generar JSON + SQL mensual completo",
        log_path=logs_dir / f"{stamp}_03_build_mensual_full.log",
        dry_run=args.dry_run,
    )

    if not mensual_sql.exists() and not args.dry_run:
        fail(f"No se generó el SQL mensual esperado: {mensual_sql}")

    if args.aplicar_mensual:
        run_psql(
            mensual_sql,
            database_url=db_url,
            cwd=root,
            title="Aplicar SQL mensual completo",
            log_path=logs_dir / f"{stamp}_04_apply_mensual.log",
            dry_run=args.dry_run,
        )

    print("\nOK flujo terminado.")
    print("\nArchivos principales:")
    print(f"- Seed JSON       : {seed_json}")
    print(f"- Seed SQL        : {seed_sql}")
    print(f"- Mensual JSON    : {mensual_json}")
    print(f"- Mensual SQL     : {mensual_sql}")
    print(f"- Normativa JSON  : {normativa_json}")
    print(f"- IPS tasas JSON  : {ips_tasas_json}")
    print(f"- Logs del periodo: {logs_dir}")

    if not args.aplicar_mensual:
        print("\nPara aplicar el mensual manualmente:")
        print(f'psql "$env:DATABASE_URL" -v ON_ERROR_STOP=1 -f "{mensual_sql}"')

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
