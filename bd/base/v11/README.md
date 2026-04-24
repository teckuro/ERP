# Base v11

Hay dos formas de ejecutar el esquema:

- `crear_sql_v6_11_integrada.sql`: archivo completo, util cuando se quiere aplicar todo de una vez.
- `run_all.sql`: indice ordenado que ejecuta los mismos bloques desde `partes/`.

Orden de `partes/`:

1. `00_reset.sql`: drops para re-ejecucion.
2. `01_tipos.sql`: enums.
3. `02_tablas.sql`: tablas, incluyendo bancos y cuentas bancarias.
4. `03_indices.sql`: indices, incluyendo indices bancarios.
5. `04_funciones.sql`: funciones de calculo y compatibilidad.
6. `05_inserts_upserts.sql`: inserts y upserts (`ON CONFLICT DO UPDATE`).
7. `06_secuencias.sql`: ajuste de secuencias despues de inserts con IDs.
8. `07_triggers.sql`: triggers, incluyendo `updated_at` para bancos/cuentas.
9. `08_seguridad_rls.sql`: permisos y RLS.
10. `09_historial_empleado.sql`: historial/auditoria de ficha.

Ejecucion por partes:

```powershell
psql "$env:SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f bd/base/v11/run_all.sql
```
