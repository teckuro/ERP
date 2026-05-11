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

4. Si la base se creo antes de la tabla `movimiento_variable_mensual`, ejecutar `partes/14_movimiento_variable_mensual.sql` una vez (no forma parte de `run_all.sql` si ya incorporaste el bloque en `02_tablas.sql` en un fresh install).

5. Para snapshots preliminares de nomina mensual, ejecutar `partes/15_nomina_calculo_snapshot.sql` una vez en ambientes revisados. El script es incremental/idempotente y no cierra periodos ni crea liquidaciones oficiales.

6. Para bases creadas antes de persistir la reconciliacion de Parametros, ejecutar `partes/17_parametros_reconciliacion_cliente.sql` una vez. Agrega solo metadatos a `parametros_generales_cliente`; no modifica `parametros_generales`.

7. Para bases creadas antes del modelo base de Novedades mensuales, ejecutar `partes/18_novedades_mensuales.sql` una vez. Crea `novedad_remuneracion_periodo` con relaciones a periodo, persona, contrato opcional y concepto; no implementa UI, motor ni liquidaciones.

8. Para habilitar permisos/RLS de Novedades mensuales, ejecutar `partes/19_novedades_mensuales_rls.sql` despues de `18_novedades_mensuales.sql`. Otorga `SELECT`, `INSERT` y `UPDATE` a `authenticated`, no otorga permisos a `anon` ni habilita `DELETE` directo.

9. Para habilitar guardado/reemplazo atomico de snapshots preliminares, ejecutar `partes/20_nomina_calculo_snapshot_rpc.sql` despues de `15_nomina_calculo_snapshot.sql` y `16_nomina_calculo_snapshot_rls.sql`. Crea la RPC `guardar_nomina_calculo_snapshot` con `security invoker`, revoca `PUBLIC`/`anon` y permite ejecucion a `authenticated`.

10. Para habilitar cierre operativo controlado, ejecutar `partes/21_nomina_cierre_operativo_rpc.sql` despues de `20_nomina_calculo_snapshot_rpc.sql`. Crea la RPC `cerrar_nomina_operativa`, valida snapshot activo aprobado y sin reemplazo, persiste `cierre_operativo_*`, no toca `periodo_remuneracion.estado`, revoca `PUBLIC`/`anon` y permite ejecucion solo a `authenticated`.

11. Para habilitar liquidaciones oficiales internas, ejecutar `partes/22_liquidaciones_oficiales.sql` y luego `partes/23_liquidaciones_oficiales_rpc.sql` despues de `21_nomina_cierre_operativo_rpc.sql`. Crea tablas `nomina_liquidacion_*`, RLS para `authenticated`, RPC `generar_liquidaciones_oficiales`, revoca `PUBLIC`/`anon`, valida snapshot activo aprobado/cerrado/no reemplazado y bloquea duplicados por `id_calculo_periodo`.

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
14. `14_movimiento_variable_mensual.sql`: tabla movimientos variables mensuales (Fase 9.4C); solo para BD ya creada sin pasar por `02_tablas.sql` actualizado (idempotente).
15. `15_nomina_calculo_snapshot.sql`: tablas de snapshots preliminares de nomina mensual (MOTOR-03B/MOTOR-03C), sin liquidacion oficial ni cierre.
16. `17_parametros_reconciliacion_cliente.sql`: columnas de decision de reconciliacion en `parametros_generales_cliente`.
17. `18_novedades_mensuales.sql`: tabla base `novedad_remuneracion_periodo` para hechos del periodo, sin calculo ni resultado de liquidacion.
18. `19_novedades_mensuales_rls.sql`: RLS y permisos minimos para Novedades mensuales (`authenticated`; sin `anon` ni `DELETE` directo).
19. `20_nomina_calculo_snapshot_rpc.sql`: RPC `guardar_nomina_calculo_snapshot` para guardar/reemplazar snapshots preliminares de forma atomica (`authenticated`; sin `anon`).
20. `21_nomina_cierre_operativo_rpc.sql`: RPC `cerrar_nomina_operativa` para congelar el snapshot activo aprobado operativamente (`authenticated`; sin `anon`, sin reapertura v1).
21. `22_liquidaciones_oficiales.sql`: tablas `nomina_liquidacion_periodo`, `nomina_liquidacion_trabajador` y `nomina_liquidacion_concepto`, con RLS minima para `authenticated`.
22. `23_liquidaciones_oficiales_rpc.sql`: RPC `generar_liquidaciones_oficiales`, atomica, `SECURITY INVOKER`, sin `anon`, desde snapshot cerrado sin recalculo.

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
