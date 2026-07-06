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

12. Para completar el contrato LRE de catalogo y conceptos no directos, ejecutar `partes/24_lre_catalogo_oficial.sql` y luego `partes/25_lre_concept_rules.sql`. El script 25 agrega `estrategia_lre`, `requiere_exportacion_lre` y `observacion_normativa_lre` a `concepto`; no implementa exportador LRE ni modifica formulas legales.

13. Para habilitar condiciones especiales del trabajador y perfil laboral/previsional derivado, ejecutar `partes/26_empleados_condiciones_trabajador.sql` despues de `25_lre_concept_rules.sql`. Crea `tipo_condicion_trabajador`, `persona_condicion_trabajador`, seeds minimos, RLS/permisos locales y `fn_obtener_perfil_laboral_persona`; no modifica HTML, motor ni liquidaciones.

14. Para habilitar campos normativos de contrato en Empleados, ejecutar `partes/28_empleados_contrato_normativo.sql` despues de `27_nomina_periodo_diagnostico.sql`. Agrega exclusion de limite de jornada/art. 22 y datos de casa particular sobre `contrato` con `CHECK` de textos permitidos; no modifica liquidaciones ni catalogos.

15. Para persistir el vinculo laboral (dependiente u honorarios) en `contrato`, ejecutar `partes/29_relacion_laboral_contrato.sql` despues de `28_empleados_contrato_normativo.sql`. Agrega `relacion_laboral` con valores `CONTRATO` o `HONORARIOS`; espejo de `supabase/migrations/20260524224000_add_relacion_laboral_contrato.sql`.

16. Para habilitar preparaciones/lotes de nomina V11, ejecutar `partes/30_nomina_preparacion.sql` antes de `15_nomina_calculo_snapshot.sql`, y luego `partes/33_nomina_preparacion_fks.sql`, `partes/31_nomina_preparacion_rls.sql` y `partes/32_nomina_preparacion_rpc.sql` despues de liquidaciones oficiales. El modelo mantiene compatibilidad legacy para snapshots sin preparacion y exige `id_empresa` en preparaciones nuevas.

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
15. `30_nomina_preparacion.sql`: tablas base de preparaciones/lotes de nomina, sin FK tardias hacia calculo/liquidacion.
16. `15_nomina_calculo_snapshot.sql`: tablas de snapshots preliminares de nomina mensual (MOTOR-03B/MOTOR-03C), con enlace opcional a preparacion V11 y compatibilidad legacy.
17. `17_parametros_reconciliacion_cliente.sql`: columnas de decision de reconciliacion en `parametros_generales_cliente`.
18. `18_novedades_mensuales.sql`: tabla base `novedad_remuneracion_periodo` para hechos del periodo, sin calculo ni resultado de liquidacion.
19. `19_novedades_mensuales_rls.sql`: RLS y permisos minimos para Novedades mensuales (`authenticated`; sin `anon` ni `DELETE` directo).
20. `20_nomina_calculo_snapshot_rpc.sql`: RPC `guardar_nomina_calculo_snapshot` para guardar/reemplazar snapshots preliminares de forma atomica (`authenticated`; sin `anon`), resolviendo preparacion default cuando hay empresa.
21. `21_nomina_cierre_operativo_rpc.sql`: RPC `cerrar_nomina_operativa` para congelar el snapshot activo aprobado operativamente (`authenticated`; sin `anon`, sin reapertura v1).
22. `22_liquidaciones_oficiales.sql`: tablas `nomina_liquidacion_periodo`, `nomina_liquidacion_trabajador` y `nomina_liquidacion_concepto`, con enlace opcional a preparacion y RLS minima para `authenticated`.
23. `23_liquidaciones_oficiales_rpc.sql`: RPC `generar_liquidaciones_oficiales`, atomica, `SECURITY INVOKER`, sin `anon`, desde snapshot aprobado sin recalculo; exige preparacion confirmada cuando el snapshot la tiene.
24. `33_nomina_preparacion_fks.sql`: FK tardias desde preparacion hacia calculo/liquidacion origen.
25. `31_nomina_preparacion_rls.sql`: RLS y permisos minimos para preparaciones.
26. `32_nomina_preparacion_rpc.sql`: RPC para crear, definir alcance, confirmar y anular preparaciones.
27. `24_lre_catalogo_oficial.sql`: catalogo LRE oficial y mapeo base de conceptos directos.
28. `25_lre_concept_rules.sql`: estrategia LRE para conceptos no directos o ambiguos.
29. `26_empleados_condiciones_trabajador.sql`: condiciones especiales del trabajador y perfil laboral/previsional derivado.
30. `27_nomina_periodo_diagnostico.sql`: diagnostico operativo de periodos de nomina.
31. `28_empleados_contrato_normativo.sql`: campos normativos de contrato para casa particular y exclusion de limite de jornada.
32. `29_relacion_laboral_contrato.sql`: columna `relacion_laboral` en `contrato` (`CONTRATO` / `HONORARIOS`).

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

### LRE y conceptos no directos

`id_catalogo_lre` se mantiene para conceptos con codigo directo. Para conceptos derivados o ambiguos, usar `estrategia_lre`:

- `INASISTENCIA`: deriva dias trabajados/ausencias.
- `ZONA_EXTREMA`: requiere descomponer por naturaleza.
- `AFP_EMPLEADOR`: requiere separacion normativa por aporte empleador especifico.

Validar con `partes/90_validaciones_v11.sql` despues de aplicar SQL.
