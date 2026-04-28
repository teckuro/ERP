## Base v11

### Formas de ejecutar el esquema
- **Completo (1 archivo)**: `crear_sql_v6_11_integrada.sql`
- **Por partes (recomendado)**: `run_all.sql` (ejecuta los bloques de `partes/` en orden)

### Orden de ejecución (`partes/`)
1. **`00_reset.sql`**: drops para re-ejecución
2. **`01_tipos.sql`**: enums
3. **`02_tablas.sql`**: tablas (incluye bancos y cuentas bancarias)
4. **`03_indices.sql`**: índices (incluye índices bancarios)
5. **`04_funciones.sql`**: funciones de cálculo/compatibilidad
6. **`05_inserts_upserts.sql`**: inserts y upserts (`ON CONFLICT DO UPDATE`)
7. **`06_secuencias.sql`**: ajuste de secuencias post inserts con IDs
8. **`07_triggers.sql`**: triggers (incluye `updated_at` para bancos/cuentas)
9. **`08_seguridad_rls.sql`**: permisos y RLS
10. **`09_historial_empleado.sql`**: historial/auditoría de ficha

### Ejecución por partes

```powershell
psql "$env:SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f bd/base/v11/run_all.sql
```
