## Base v11

### Formas de ejecutar el esquema

- **Fresh install local (destructivo)**: `run_all.sql` incluye `partes/00_reset.sql` y recrea la base v11 por partes. Usarlo solo en BD local/dev sin datos que conservar.
- **Monolito**: `crear_sql_v6_11_integrada.sql` agrupa el esquema; conviene solo cuando hace falta un unico `.sql` portable y debe mantenerse sincronizado con `partes/` si se regenera.

`periodo_remuneracion.estado` es la fuente oficial del estado de carga del periodo para Parametros y Python.

Estados validos:

- `pendiente`: periodo creado sin preparacion/carga suficiente.
- `parcial`: periodo preparado con catalogos/vigencias/normativa; faltan snapshots mensuales oficiales.
- `cargado`: carga mensual oficial validada.
- `corregido`: carga mensual corregida/versionada.
- `cerrado`: periodo cerrado; Python no debe degradarlo automaticamente.
- `error`: falla registrada en el flujo de carga.

### BD ya existente sin `00_reset`

1. Ejecutar `partes/07_migracion_lre_ejecutar.sql` si falta LRE / `haberdescuento_persona`.
2. Ejecutar `partes/12_migracion_lre_datos_incremental.sql` solo si corresponde cargar catalogo/demo LRE incremental.
3. Para Parametros, aplicar solo scripts incrementales revisados para el ambiente. No usar `run_all.sql` ni `00_reset.sql` sobre produccion con datos que quieras conservar.

`12_migracion_lre_datos_incremental.sql` requiere que existan `persona`/`contrato` con IDs coherentes si se dejan los datos demo.

### Orden de ejecucion fresh local (`partes/`)

1. `00_reset.sql`: drops para re-ejecucion.
2. `01_tipos.sql`: enums.
3. `02_tablas.sql`: tablas.
4. `03_indices.sql`: indices.
5. `04_funciones.sql`: funciones.
6. `05_inserts_upserts.sql`: inserts y upserts base.
7. `06_secuencias.sql`: ajuste de secuencias.
8. `07_triggers.sql`: triggers.
9. `08_seguridad_rls.sql`: permisos y RLS.
10. `09_historial_empleado.sql`: historial/auditoria de ficha.
11. `10_periodo_catalogos.sql`: periodo/vigencia/catalogos para Parametros.
12. `11_parametros_generales_ampliacion.sql`: columnas extendidas de `parametros_generales`.
13. `13_persona_paso_alta_avanzada.sql`: soporte para continuar alta avanzada.

### Ejecucion fresh local

```powershell
psql "$env:SUPABASE_DB_URL_LOCAL" -v ON_ERROR_STOP=1 -f bd/base/v11/run_all.sql
```

### Validacion post-carga

`partes/90_validaciones_v11.sql` no forma parte de `run_all.sql`: se ejecuta despues de una preparacion o carga para diagnosticar sin modificar datos.

```powershell
psql "$env:SUPABASE_DB_URL_LOCAL" -v ON_ERROR_STOP=1 -f bd/base/v11/partes/90_validaciones_v11.sql
```

El script reporta filas a revisar para estado de periodo, mensuales minimos, vigencias, gradualidad 8,5 %, catalogos globales y referencias de Parametros. No hace `INSERT`, `UPDATE`, `DELETE` ni `ALTER`.
