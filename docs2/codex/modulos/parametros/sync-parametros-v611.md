# Sync parametros v6.11

Workflow: `.github/workflows/sync-parametros-v611.yml`

## Secret requerido

Crear en GitHub:

`Settings -> Secrets and variables -> Actions -> New repository secret`

Nombre:

```text
SUPABASE_DB_URL
```

Valor:

```text
postgresql://postgres.<PROJECT_REF>:<PASSWORD>@aws-0-<REGION>.pooler.supabase.com:6543/postgres?sslmode=require
```

Usar la URL de conexion Pooler de Supabase en modo Transaction/Session, con SSL requerido.

## Que hace

1. Genera `scripts/parametros-v611/data/parametros_mensuales_v611.sql` desde `scripts/parametros-v611/data/parametros_mensuales_v611.json`.
2. Sube el SQL generado como artifact.
3. Aplica el SQL a Supabase con `psql`.

El SQL generado compara la data existente del periodo contra la data esperada, emite `NOTICE`, borra solo el periodo/vigencia correspondiente y reinserta limpio.

## Ejecucion

Automatica:

- Dia 1 de cada mes a las 08:00 UTC.

Manual:

- GitHub -> Actions -> `sync-parametros-v611` -> Run workflow.
- `apply = false` solo genera y sube el SQL.
- `apply = true` genera y aplica a Supabase.

