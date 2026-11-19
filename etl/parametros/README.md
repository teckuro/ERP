# Parámetros previsionales v6.11 (ETL → SQL → Supabase)

Pipeline Python que scrapea fuentes oficiales (PreviRed, SII, SP, IPS), normaliza a JSON y genera SQL idempotente para el ERP Angular (schema v11 / Supabase).

## Ejecución automática (GitHub Actions)

`.github/workflows/sync-parametros-v611.yml` corre este pipeline los días **3, 6 y 9 de cada mes**
(12:00 UTC) para el mes en curso (hora de Chile), con `--strict-sources`, y aplica el SQL en Supabase.
Las corridas extra son reintentos: PreviRed publica el PDF de indicadores en los primeros días del mes
y el SQL es reejecutable. Si una fuente no está disponible o viene incompleta, el job falla y GitHub
avisa por correo; no se aplica nada a medias.

- Requiere el secreto de repositorio `SUPABASE_DB_URL` (URL del **pooler** de Supabase; los runners
  de GitHub no tienen IPv6).
- Ejecución manual: *Actions → sync-parametros-v611 → Run workflow*, con `periodo` (YYYY-MM) y
  `aplicar` (`false` = solo genera y sube los archivos como artefacto).

## Setup local

```powershell
cd etl\parametros
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env   # completar SUPABASE_DB_URL
```

## Flujo principal

```powershell
# Carga mensual completa (scrape + normativa + IPS + SQL)
.\.venv\Scripts\python.exe 00_ejecutar_flujo_parametros_v611.py --periodo 2026-06 --modo full

# Misma carga pero aborta si hay fallback en fuentes críticas
.\.venv\Scripts\python.exe 00_ejecutar_flujo_parametros_v611.py --periodo 2026-06 --modo full --strict-sources

# Normativa desde raw local (sin red) + strict permitiendo offline
.\.venv\Scripts\python.exe 00_ejecutar_flujo_parametros_v611.py --periodo 2026-06 --modo full --normativa-offline --strict-sources

# Solo preparar periodo (sin indicadores mensuales oficiales)
.\.venv\Scripts\python.exe 00_ejecutar_flujo_parametros_v611.py --periodo 2026-06 --modo preparar --normativa-offline --ips-sin-validar-web

# Aplicar SQL generado
psql "$env:SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f "runs\2026-06\mensual\parametros_mensuales_2026-06_v611.sql"
```

Salidas por periodo: `runs/YYYY-MM/{mensual,normativa_base,ips_tasas,logs}/`.

## Flags útiles

| Flag | Efecto |
|------|--------|
| `--strict-sources` | Falla si PreviRed/SII/normativa vienen de `fallback`/`partial` |
| `--normativa-offline` | Usa `raw_faltantes_v611/*.txt` ya descargados |
| `--ips-sin-validar-web` | No consulta IPS online (matriz controlada igual) |
| `--dry-run` | Solo registra comandos |
| `--seed auto\|always\|skip` | Controla regeneración de `out_v611_seed` |

## Origen de datos (`source_status`)

El JSON mensual incluye provenance:

- `scraped` — descargado y parseado
- `offline` — raw local
- `fallback` — valores normativos conocidos (riesgo de desactualización)
- `controlled_matrix` — matriz IPS versionada en código (aceptable en strict)
- `partial` — scrape incompleto / warnings

## Tests

```powershell
.\.venv\Scripts\python.exe -m pytest -q
.\.venv\Scripts\python.exe test_normativa_base_v611.py
.\.venv\Scripts\python.exe test_reforma_previsional_gradualidad_v611.py
```

## Scripts

| Script | Rol |
|--------|-----|
| `00_ejecutar_flujo_parametros_v611.py` | Orquestador |
| `01_scrape_semillas_v611.py` | Seed estructural |
| `02_normativa_base_v611.py` | Catálogos normativa |
| `03_scrape_parametros_mensuales_v611_json.py` | Indicadores mensuales → JSON |
| `04_render_parametros_mensuales_v611_sql_full.py` | JSON → SQL |
| `05_build_parametros_mensuales_v611_full.py` | Build 03+02+06+04 |
| `06_scrape_ips_tasas_v611.py` | Matriz IPS/Ex-Cajas |
| `v611_http.py` | HTTP con retry |
| `v611_provenance.py` | Validación de origen |
