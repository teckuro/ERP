# Scripts BD

La carpeta queda separada por responsabilidad:

- `base/`: esquema completo o parches de estructura.
- `insert/`: cargas de datos, seeds y UPSERTs aplicables a una BD existente.
- `python/`: indice de generadores externos que viven en `C:\Users\PC\Desktop\ERP\Python`.
- `docs/`: documentos de referencia.

Orden sugerido para una BD nueva v6.11:

```powershell
psql "$env:SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f bd/base/v11/run_all.sql
psql "$env:SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f bd/insert/v11/seed_v611.sql
psql "$env:SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f bd/insert/v11/faltantes_v611.sql
psql "$env:SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f scripts/parametros-v611/data/parametros_mensuales_v611.sql
```

Orden sugerido para actualizar una BD existente:

```powershell
psql "$env:SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f bd/insert/v11/faltantes_v611.sql
psql "$env:SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f bd/insert/v11/seed_v611.sql
psql "$env:SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f bd/insert/v11/bancos.sql
psql "$env:SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f scripts/parametros-v611/data/parametros_mensuales_v611.sql
```

La version vigente es v6.11. Lo anterior queda archivado en `bd/base/historico/`.
Si necesitas un unico archivo, `bd/base/v11/crear_sql_v6_11_integrada.sql` sigue disponible.
