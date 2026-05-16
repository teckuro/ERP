# Movimientos variables (mensuales) — punto de entrada

## Proposito

Definir el modulo de **movimientos variables mensuales**: haberes o descuentos **puntuales** por trabajador y periodo de remuneracion, distintos del catalogo maestro (Conceptos) y de las **asignaciones recurrentes** (Haberes y descuentos).

> REM-MOV-UNIFY-01: `movimientos-variables` queda como nombre tecnico legacy/deuda historica. El flujo visible principal para RRHH es **Movimientos del mes** en `/remuneraciones/novedades-mensuales`.

## Que es un movimiento variable mensual

Registro puntual asociado a **trabajador + concepto + periodo** (`YYYY-MM`), con monto o valor y estado operativo. No se repite en meses siguientes salvo nuevo registro o importacion.

Ejemplos: bono puntual del mes, comision del periodo, horas extra del periodo, descuento unico por anticipo, reintegro puntual.

## Que no es

- No es fila del **catalogo** `concepto` (eso es Conceptos).
- No es **asignacion recurrente** con vigencia larga (eso es Haberes y descuentos).
- No es **resultado de liquidacion** congelado (eso es Liquidaciones).
- No sustituye Proceso mensual ni Motor (futuros).

## Diferencia con Haberes recurrentes

| Haberes recurrentes | Movimientos variables |
|---------------------|------------------------|
| Se mantienen en el tiempo (vigencia inicio/fin, estado ACTIVA/FUTURA/VENCIDA/CERRADA/INVALIDA) | Un periodo concreto (`YYYY-MM`) |
| Bonos fijos mensuales, descuentos permanentes | Bonos puntuales, comision del mes, HE del periodo |
| Modulo [`../haberes-descuentos/README.md`](../haberes-descuentos/README.md) | Este modulo |

**Regla:** si aplica todos los meses o un rango de meses con la misma logica recurrente -> Haberes y descuentos. Si aplica **solo** a un periodo especifico -> Movimientos variables.

## Diferencia con Conceptos

Conceptos responde **que** existe en el maestro (tipo, vigencia catalogo, LRE, asignable recurrente, sistema/usuario, automatico/manual).

Movimiento variable responde **a que trabajador**, **en que periodo**, **que concepto**, **cuanto** y **en que estado** esta el registro puntual.

## Relacion con periodo

Todo movimiento pertenece a un periodo `YYYY-MM`. No hay movimiento sin periodo. El control de periodo **cerrado** a carga queda para cuando exista Proceso mensual productivo (documentado en contrato y decisiones).

## Relacion con Proceso mensual

**9.5A:** la pantalla Proceso mensual (`ProcesoMensualService`) llama `MovimientosVariablesService.listarPorPeriodo` para prevalidar conteos por estado (bloqueos/advertencias; sin motor). Contrato: [`../nomina-mensual/prevalidaciones-9-5A.md`](../nomina-mensual/prevalidaciones-9-5A.md).

Entrada futura del calculo: solo movimientos **VALIDADO** (o equivalente aprobado). No entran BORRADOR, OBSERVADO, ANULADO ni bloqueados por otra razon; **ANULADO** se ignora en reglas de bloqueo de prevalidacion.

## Relacion futura con Liquidaciones

Cuando una liquidacion este generada/cerrada oficialmente, los movimientos usados deberian quedar bloqueados, versionados o referenciados (decision de fase futura; no implementado en 9.4A).

## Estados propuestos

Ver [`contrato-general.md`](./contrato-general.md) y [`decisiones-operativas.md`](./decisiones-operativas.md). Version minima v1 sugerida: BORRADOR, VALIDADO, ANULADO, BLOQUEADO; OBSERVADO e INCLUIDO_EN_PROCESO como extensiones futuras.

## Pendientes y fases futuras

- Flag o capacidad en catalogo: **asignable recurrente** vs **asignable variable** vs **ambos** (pendiente; no implementar en 9.4A).
- Refinamiento UI (edicion masiva, importacion, permisos por rol) en fases posteriores.
- RLS productivo y permisos (fases posteriores).

## Fase 9.4B (modelo y validaciones en TypeScript)

Tipos y reglas puras en `src/app/features/movimientos-variables/` con tests unitarios. Detalle técnico: [`modelo-tecnico-9-4B.md`](./modelo-tecnico-9-4B.md). Tablero: [`../../orquestador/estado-fases.md`](../../orquestador/estado-fases.md).

## Fase 9.4C (SQL no destructivo y repositorio base)

Tabla `movimiento_variable_mensual` en `bd/base/v11/partes/02_tablas.sql`, script incremental [`../../../../bd/base/v11/partes/14_movimiento_variable_mensual.sql`](../../../../bd/base/v11/partes/14_movimiento_variable_mensual.sql), repositorio y mappers en `src/app/features/movimientos-variables/data-access/`. Contrato de persistencia: [`persistencia-9-4C.md`](./persistencia-9-4C.md). Tablero: [`../../orquestador/estado-fases.md`](../../orquestador/estado-fases.md).

## Fase 9.4D (service fino y listado base sin UI avanzada)

`MovimientosVariablesService` en `src/app/features/movimientos-variables/services/`; listados devuelven `MovimientoVariableListadoFila`; la UI debe consumir el service, no el repository. Detalle: [`service-9-4D.md`](./service-9-4D.md). Tablero: [`../../orquestador/estado-fases.md`](../../orquestador/estado-fases.md).

## Fase 9.4E (UI carga manual controlada)

Pantalla bajo **`/remuneraciones/movimientos-variables`**: filtro por período, listado vía `listarPorPeriodo`, alta manual (`crear` con `origen: MANUAL`), anulación con confirmación; catálogos desde `EmpleadosService` y `HaberesDescuentosService.listarConceptos`. Detalle: [`ui-9-4E.md`](./ui-9-4E.md). Tablero: [`../../orquestador/estado-fases.md`](../../orquestador/estado-fases.md).

## CHILE-FIX-01 (endurecimiento servidor, QA-CHILE-01 ALTO-001 / ALTO-002)

Validacion de concepto desde catalogo y chequeo de aptitud/contrato en `MovimientosVariablesService.crear` y `actualizar`. Documento: [`hardening-chile-fix-01.md`](./hardening-chile-fix-01.md).

## Documentos del modulo

| Archivo | Rol |
|---------|-----|
| [`contrato-general.md`](./contrato-general.md) | Alcance, entidades funcionales, estados, validaciones, relaciones, duplicados, anulacion |
| [`decisiones-operativas.md`](./decisiones-operativas.md) | Decisiones cerradas para implementacion futura |
| [`modelo-tecnico-9-4B.md`](./modelo-tecnico-9-4B.md) | Anexo técnico: rutas de código, helpers y criterios de prueba (Fase 9.4B) |
| [`persistencia-9-4C.md`](./persistencia-9-4C.md) | Tabla, indices, duplicado parcial, repositorio, mappers, RLS pendiente (Fase 9.4C) |
| [`service-9-4D.md`](./service-9-4D.md) | Service fino, listado base, validaciones antes del repository (Fase 9.4D) |
| [`ui-9-4E.md`](./ui-9-4E.md) | Pantalla carga manual, rutas y flujos UI (Fase 9.4E) |
| [`hardening-chile-fix-01.md`](./hardening-chile-fix-01.md) | CHILE-FIX-01: catalogo + aptitud/contrato en service (post QA-CHILE-01) |

## Orquestador

- Tablero: [`../../orquestador/estado-fases.md`](../../orquestador/estado-fases.md) (Fases 9.4A a 9.4E).
- Cadena funcional: [`../../orquestador/diseno-operativo-erp.md`](../../orquestador/diseno-operativo-erp.md).

## Ruta de aplicacion

> REM-NAV-IA-01: esta ruta es legacy. `/remuneraciones/movimientos-variables` y `/movimientos-variables` redirigen a `/remuneraciones/novedades-mensuales`. El nombre visible canonico es `Movimientos del mes`.

**`/remuneraciones/movimientos-variables`** — implementada en la fase **9.4E** (UI carga manual). Redirect temporal desde **`/movimientos-variables`**.
## ERP-NOIA-BITACORA-OPERATIVA-00 - Lectura de modulo

Movimientos variables queda alineado a [`NOIA / Bitacora Operativa`](../../diseno/bitacora-operativa-noia.md) como parte futura de `Movimientos de remuneracion`.

- La vista mensual debe operar como registro de incidencias del periodo: bonos, descuentos, horas, atrasos u otros movimientos con monto y vigencia.
- La evolucion UX recomendada es unir la lectura visible con asignaciones recurrentes, manteniendo distinta la fuente y periodicidad.
- Esta referencia es documental; no fusiona rutas, tablas, servicios ni reglas de calculo.

## NOM-MOVIMIENTOS-SIMPLE-00

La decision documental vigente define `Movimientos de remuneracion` como experiencia futura que unifica `Movimientos del mes` y `Asignaciones recurrentes` desde la duracion del registro: `Solo este mes`, `Recurrente` o `En cuotas`. Documento rector: [`../remuneraciones/movimientos-remuneracion-simple.md`](../remuneraciones/movimientos-remuneracion-simple.md).

Esta fase no cambia rutas, servicios, SQL, motor ni pantallas actuales.

## NOM-MOVIMIENTOS-SIMPLE-01

La ruta visible mensual queda presentada como vista `Este mes` dentro de `Movimientos de remuneracion`. `movimientos-variables` sigue siendo nombre tecnico legacy y no se migra persistencia ni servicio.

## NOM-MOVIMIENTOS-POR-TRABAJADOR-01

La mesa visible de Movimientos prioriza trabajadores del periodo. Movimientos variables/mensuales quedan representados como `Mov. mes` dentro de la fila del trabajador, sin cambiar persistencia legacy ni motor.
