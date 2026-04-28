# Scripts BD

Solo vive el esquema y scripts de estructura en `base/` (v6.11 y histórico).

## BD nueva o recrear esquema

**Recomendado:** ejecutar por **partes** (`partes/*.sql` vía `run_all.sql`): más fácil de revisar, diff y corregir que un solo archivo gigante.

```powershell
psql "$env:SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f bd/base/v11/run_all.sql
```

**Solo si hace falta un único archivo** (p. ej. pegar todo en un editor): `bd/base/v11/crear_sql_v6_11_integrada.sql` — debe mantenerse alineado con las partes al regenerar.

Detalle de partes y orden: `bd/base/README.md` y `bd/base/v11/README.md`.
