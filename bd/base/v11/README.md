## Base v11

### Formas de ejecutar el esquema
- **Por partes (recomendado)**: `run_all.sql` — incluye `partes/*.sql` en orden; es la vía preferida (diffs claros, errores localizados, RLS/triggers en archivos acotados).
- **Monolito**: `crear_sql_v6_11_integrada.sql` — mismo contenido agrupado; conviene solo cuando hace falta un único `.sql` portable; mantener sincronizado con `partes/` si se regenera.

### BD ya existente (sin `00_reset`)

1. Ejecutar **`partes/07_migracion_lre_ejecutar.sql`**: agrega tablas/columnas LRE y `haberdescuento_persona` (idempotente).
2. Ejecutar **`partes/12_migracion_lre_datos_incremental.sql`**: catálogo LRE, conceptos, reglas, demo asignaciones/movimientos con `ON CONFLICT DO UPDATE` donde aplica.

Requiere que existan `persona`/`contrato` con IDs coherentes (el seed demo usa `id_persona = 1`, `id_contrato = 1`). Ajustar esos valores en el script si tu BD usa otros IDs.

No ejecutar `run_all.sql` ni `00_reset.sql` sobre producción con datos que quieras conservar.

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
