# Nomina mensual (Chile) - contrato general

## 1. Objetivo del modulo

Guiar el **proceso mensual** por periodo `YYYY-MM`: revisar prerequisitos (parametros, trabajadores, conceptos, recurrentes, movimientos del mes), construir una base de nomina y ejecutar un calculo base preliminar. En la version actual no genera liquidaciones oficiales, snapshots definitivos, cierre, Previred, LRE ni PDF.

La arquitectura funcional completa de remuneraciones queda definida en [`arquitectura-funcional-remuneraciones.md`](./arquitectura-funcional-remuneraciones.md) (NOM-00). Ese documento fija la separacion entre Maestros RRHH, Parametros, Conceptos, Haberes/descuentos recurrentes, Novedades mensuales, Proceso mensual, Motor, Liquidacion, Previred/LRE y Reportes.

El modelo documental de **Novedades mensuales** queda definido en [`novedades-mensuales.md`](./novedades-mensuales.md) (NOM-01). NOM-01B agrega la tabla base `novedad_remuneracion_periodo` para hechos del periodo. NOM-01C agrega la capa Angular base de modelos, mapper, repository, service y reglas puras. NOM-01D agrega la UI base `/remuneraciones/novedades-mensuales` para listar, crear borradores y cambiar estados simples, sin integracion real al proceso mensual ni motor. Desde USAB-NOM-01/02, para RRHH el nombre visible principal es **Movimientos del mes**; **Novedades mensuales** queda como nombre tecnico/documental interno.

## 2. Alcance actual (cerrado en 9.5A + 9.5B + 9.5C + MOTOR-01 + MOTOR-02 + MOTOR-03A + MOTOR-03B + MOTOR-03C)

- Pantalla visible **Preparar nomina** bajo `/remuneraciones/proceso-mensual`.
- **Prevalidaciones** orquestadas por `ProcesoMensualService` con reglas puras en `proceso-mensual-prevalidacion.rules.ts`, grupos minimos en `proceso-mensual-parametros-minimos.rules.ts` y conteos de recurrentes en `proceso-mensual-recurrentes.rules.ts`.
- **Pre-nomina funcional por periodo** construida desde la prevalidacion con `proceso-mensual-prenomina.rules.ts`; en UI se muestra como **Base de nomina**. Consolida conteos y trazabilidad, pero no calcula montos.
- **Base de nomina trazable USAB-NOM-04**: antes del calculo preliminar, la UI muestra trabajadores considerados, listos, con observaciones, bloqueados/excluidos, asignaciones recurrentes incluidas, movimientos del mes incluidos, parametros del periodo y acciones de revision. Mantiene nombres tecnicos internos y no cambia formulas legales.
- **Validacion operativa USAB-NOM-05**: antes de `Calcular preliminar`, la UI muestra estado de calculo, bloqueos, advertencias, informacion, razon visible de deshabilitado y siguiente accion recomendada.
- **Resultado preliminar revisable USAB-NOM-06**: despues de calcular, la UI muestra resumen operativo, trabajadores calculados/con observaciones/omitidos, observaciones del resultado, detalle tecnico secundario y acciones de recalculo, revision y guardado preliminar.
- **Guardado/versionado operativo USAB-NOM-07**: el resultado preliminar muestra estado de guardado, razon visible cuando no se puede guardar, confirmacion antes de guardar, ultimo resultado guardado, fecha, version del calculo, identificador tecnico y advertencias asociadas. Guardar crea o reemplaza una version revisable del periodo; no es liquidacion oficial.
- **Reemplazo atomico NOM-ATOMIC-01**: el guardado/reemplazo del resultado preliminar usa la RPC `guardar_nomina_calculo_snapshot`. La operacion escribe cabecera, trabajadores, conceptos, observaciones y trazabilidad dentro de una llamada transaccional; si falla una parte, no quedan cambios parciales.
- **Revision para aprobacion USAB-NOM-08**: sobre el resultado preliminar guardado, la UI muestra estado de preparacion, checklist operativo y bloqueos/advertencias/informacion para decidir. La accion deshabilitada de solicitud fue reemplazada por `Aprobar resultado preliminar` en USAB-NOM-09.
- **Aprobacion operativa USAB-NOM-09 + NOM-PERSIST-01**: sobre el resultado preliminar guardado vigente, RRHH puede marcar `Aprobar resultado preliminar` con confirmacion previa. La aprobacion se persiste en `nomina_calculo_periodo` asociada a `id_calculo_periodo`; la UI muestra fecha/hora, usuario real si existe o `Usuario no disponible en esta sesion`, version del calculo, identificador tecnico, trabajadores y totales aprobados, y advertencias al aprobar. Si se recalcula/guarda un resultado posterior, la aprobacion anterior no aprueba automaticamente el nuevo resultado.
- **Snapshot completo consultable NOM-SNAPSHOT-01**: el resultado guardado puede consultarse completo desde BD por periodo activo o por `id_calculo_periodo`, incluyendo cabecera, trabajadores, conceptos, observaciones, trazabilidad y aprobacion operativa. La consulta no recalcula con movimientos, parametros ni reglas actuales.
- **Calculo preliminar MOTOR-01/MOTOR-02** con `proceso-mensual-motor.rules.ts`; calcula sueldo base, haberes recurrentes, gratificacion controlada, bases con topes disponibles, cotizaciones basicas, impuesto unico con tabla, asignacion familiar simple, liquido preliminar, issues y trazabilidad.
- **Contrato de persistencia MOTOR-03A** documental: define snapshot preliminar, estados, tablas candidatas, hash, version de motor y reglas de recalculo/reemplazo; no implementa escritura.
- **Persistencia controlada MOTOR-03B**: agrega SQL local versionable, mapping, hash deterministico simple, repository y servicio para guardar/consultar/reemplazar snapshots preliminares sin liquidacion oficial ni cierre.
- **Aplicacion controlada MOTOR-03C**: valida el SQL de snapshots, confirma PK/FK contra v11, incluye la parte 15 en `run_all.sql` y deja tipos Supabase pendientes hasta aplicar la migracion en un ambiente confirmado.
- UI en `features/nomina-mensual/containers/proceso-mensual-container/`; pagina de ruta solo wrapper (`frontend-interfaces`).
- Selector de periodo y acciones **Validar periodo** / **Generar base de nomina** / **Calcular preliminar** / **Guardar resultado preliminar**; desde USAB-NOM-03 la UI se organiza como dashboard operativo con resumen, siguiente accion, checklist por areas, bloqueos/advertencias, base de nomina, calculo preliminar y resultado guardado. Desde USAB-NOM-04, Base de nomina es la vista de trazabilidad previa al calculo y no debe exponer IDs tecnicos como labels principales.
- Desde USAB-NOM-05, `Calcular preliminar` se habilita solo con periodo valido, base generada, trabajadores considerados, parametros minimos disponibles, sin bloqueos ni error activo.
- Desde USAB-NOM-06, `Resultado preliminar` es una salida revisable del calculo. Guardarlo no equivale a liquidacion oficial, no cierra periodo y no genera Previred/LRE/banco.
- Desde USAB-NOM-07, `Guardar resultado preliminar` usa el soporte existente de snapshots preliminares. El repositorio reemplaza el resultado activo del periodo marcando el anterior inactivo/anulado y vinculando el reemplazo. La UI no inventa version numerica incremental; muestra fecha, version del calculo e identificador tecnico disponibles.
- Desde NOM-ATOMIC-01, ese reemplazo se realiza dentro de la RPC `guardar_nomina_calculo_snapshot`. El nuevo resultado no se activa hasta que cabecera y detalles quedan insertados, y el anterior no se anula si falla el guardado.
- Desde NOM-SAVE-DIAG-01, el payload de trazabilidad del snapshot debe enviar `vigenciaInicio`/`vigenciaFin` como fecha SQL valida (`YYYY-MM-DD`) o `null`. Si una regla del motor tiene solo periodo mensual `YYYY-MM`, el snapshot lo normaliza al primer dia del mes (`YYYY-MM-01`) antes de persistir. Esto evita el error RPC `22007 invalid input syntax for type date` sin cambiar formulas legales ni la RPC.
- Desde NOM-E2E-CLOSE-01, el flujo real authenticated queda validado y documentado para `2026-04`: login real, validar periodo, generar base, calcular preliminar, guardar por RPC, consultar `Resultado guardado desde BD`, aprobar operativamente y recuperar snapshot/aprobacion tras recargar. Esto no habilita cierre, liquidacion oficial ni salidas legales.
- Desde NOM-CIERRE-DESIGN-01, el cierre operativo v1 queda disenado como estado del snapshot activo aprobado. Se persistira en `nomina_calculo_periodo`, no tocara `periodo_remuneracion.estado`, no implementara reapertura, no bloqueara por advertencias por defecto y debera ejecutarse mediante RPC atomica en una fase posterior.
- Desde USAB-NOM-08, `Revision para aprobacion` prepara la decision operativa con checklist y observaciones visibles; desde USAB-NOM-09 esa revision puede marcar aprobacion operativa interna.
- Desde NOM-PERSIST-01, `Aprobar resultado preliminar` es una marca operativa interna persistida sobre el resultado guardado vigente. No usa `aprobado_para_liquidacion`, no cierra periodo, no emite liquidaciones oficiales, no genera Previred/LRE/banco y no cambia formulas legales.
- Desde NOM-SNAPSHOT-01, `Resultado guardado desde BD` muestra el detalle persistido del snapshot completo. No usa datos actuales para reconstruir montos y no reemplaza el cierre operativo futuro.

## 3. Fuera de alcance (explicito)

- Liquidacion oficial, snapshot definitivo contable y cierre productivo.
- Aplicacion remota de migraciones, RLS detallado y permisos por rol quedan para MOTOR-03C/SEG-NOMINA o fases posteriores.
- Gratificacion por 30% de utilidades, reliquidacion anual, proporcionalidad compleja por dias y ausencias avanzadas.
- Liquidaciones productivas, snapshots, cierre contable.
- Generacion Previred, LRE, archivos bancarios.
- Bloqueo duro de periodo en BD, aprobaciones legales finales, roles/JWT/RLS.
- Rediseno visual integral (fase UX-FINAL aparte).

## 4. Relacion con parametros

Lectura via `ParametrosGeneralesService`: `obtenerUltimoHastaPeriodo(periodo)`, `obtenerPeriodoRemuneracion(periodo)` y `listarCatalogos(periodo)` para clasificar grupos minimos. La UI **no** muestra UF, UTM, topes ni sueldos; muestra estado de prerequisitos y, tras validar, grupos como `mensuales_uf_utm_sueldo=OK` (clasificacion textual, sin valores). Detalle en `prevalidaciones-9-5A.md` y `prevalidaciones-9-5B.md`.

## 5. Relacion con empleados

Conteo de trabajadores **activos** con `aptoParaRemuneraciones` via `EmpleadosService.listar()` (sin conteos demo inventados).

Desde EMP-ADV-FICHA-01, Empleados/Ficha debe alinear `aptoParaRemuneraciones` con requisitos minimos del motor: contrato y jornada reales, sueldo/moneda, pago y prevision calculable. `tipoPrevision = NINGUNA` no habilita nomina mensual; puede existir en borrador o ficha incompleta, pero no debe llegar como trabajador apto al proceso mensual.

## 6. Relacion con conceptos

Lectura del mantenimiento de conceptos via `HaberesDescuentosService.listarConceptosMantenimiento()` para existencia de catalogo y aviso de clasificacion incompleta para un motor futuro (sin modificar reglas de conceptos).

## 7. Relacion con haberes recurrentes

`HaberesDescuentosService.listarAsignacionesParaPrevalidacionMensual(periodo)` alimenta conteos y bloqueos: lectura en error o **vigencias invalidas** en el universo consultado implica **BLOQUEO**. Cerradas y fuera del mes se excluyen de aplicables al periodo. Contrato fino: `prevalidaciones-9-5B.md` y modulo Haberes (`listarTodasAsignacionesConConcepto`).

## 8. Relacion con entradas mensuales, novedades mensuales y movimientos variables

`ProcesoMensualService` consume `EntradasMensualesPeriodoService` para obtener una vista normalizada del periodo. Esa capa integra asignaciones recurrentes, novedades mensuales y movimientos variables legacy durante la transicion.

La decision vigente es:

- **Movimientos del mes** es el nombre visible oficial para RRHH.
- **Novedades mensuales** se mantiene como nombre tecnico/documental interno.
- `novedad_remuneracion_periodo` es la tabla canonica futura para hechos del periodo.
- **Movimientos variables** queda como termino legacy/tecnico/transicion.
- `movimiento_variable_mensual` queda como tabla legacy de transicion.

Los campos publicos de proceso mensual que exponen conteos de movimientos variables se mantienen solo como alias de compatibilidad temporal para la UI existente.

NOM-01B crea el modelo SQL base `novedad_remuneracion_periodo` para la nomenclatura funcional nueva. Esa tabla registra periodo, persona, contrato opcional, concepto, categoria, tipo, cantidad, monto, origen y estado. No reemplaza por si sola la implementacion actual ni integra proceso mensual hasta fases posteriores.

NOM-01C crea `src/app/features/nomina-mensual/novedades/` con modelo, mapper, repository, service y reglas puras para listar, crear, actualizar y cambiar estados de novedades mensuales. Esta capa no modifica recurrentes, no calcula liquidaciones, no marca pre-nomina real y no toca Previred/LRE.

NOM-01D crea la pantalla base `/remuneraciones/novedades-mensuales` sobre `NovedadesMensualesService`. Permite listar por periodo, crear/editar borradores y ejecutar transiciones simples (`borrador`, `pendiente_revision`, `aprobada`, `rechazada`, `anulada`) segun reglas. USAB-NOM-02 reemplaza la captura visible de IDs por selectores operativos de trabajador (`Nombre · RUT`), concepto (`Nombre (codigo)`) y contrato por trabajador; el payload interno mantiene `idPersona`, `idContrato` e `idConcepto`. No escribe en recurrentes, parametros, liquidaciones, proceso mensual real, Previred ni LRE.

## 8.1 UNIF-NOM-02 - Entradas mensuales canonicas

UNIF-NOM-02 crea la capa aislada `src/app/features/nomina-mensual/entradas/` con:

- modelo canonico `EntradaMensualPeriodo`;
- reglas puras para normalizar estados, origenes y resumen;
- mapper de novedades mensuales y movimientos variables legacy;
- `EntradasMensualesPeriodoService`.

Responsabilidad de esta capa:

- normalizar asignaciones recurrentes vigentes desde `HaberesDescuentosService.listarAsignacionesParaPrevalidacionMensual`;
- normalizar novedades mensuales desde `NovedadesMensualesService`;
- normalizar movimientos variables desde `MovimientosVariablesService` solo como fuente legacy/transicion;
- entregar una vista funcional unificada para una futura adaptacion de Proceso mensual.

Reglas de fase:

- no modifica estados ni datos de las fuentes;
- no reemplaza `MovimientosVariablesService`;
- no cambia `ProcesoMensualService`;
- no cambia UI, rutas, sidebar, SQL, motor, liquidaciones, Previred ni LRE.

La adaptacion real de Proceso mensual debe hacerse recien en **UNIF-NOM-03**.

## 8.2 UNIF-NOM-03 - Proceso mensual con entradas canonicas

UNIF-NOM-03 adapta `ProcesoMensualService` para que la prevalidacion y la pre-nomina lean entradas normalizadas desde `EntradasMensualesPeriodoService`.

Resultado de fase:

- Proceso mensual deja de depender directamente de `MovimientosVariablesService`.
- Novedades mensuales aprobadas quedan visibles para el resumen y la prevalidacion del periodo.
- Movimientos variables siguen visibles como origen `legacy_movimiento_variable` durante la transicion.
- El resumen incorpora total de entradas, recurrentes, novedades mensuales, legacy, aprobadas, pendientes, observadas, rechazadas, anuladas, bloqueantes, con warnings y aptas para pre-nomina.
- No se modifican estados fuente ni se escribe en `novedad_remuneracion_periodo` o `movimiento_variable_mensual`.
- No se modifica motor, liquidaciones, cierre, Previred/LRE, SQL, Python, rutas, sidebar ni UI productiva.

## 8.3 SEG-NOV-02 - RLS y permisos de novedades mensuales

SEG-NOV-02 agrega RLS para `novedad_remuneracion_periodo` en `bd/base/v11/partes/19_novedades_mensuales_rls.sql`.

Reglas:

- `authenticated` puede leer, insertar y actualizar novedades mensuales.
- `anon` no recibe permisos nuevos sobre la tabla.
- `DELETE` directo no se habilita; la baja funcional debe hacerse por anulacion logica.
- No se crea modelo de roles finos porque aun no existe JWT/RLS por rol en el proyecto.
- No se cambia estructura de tabla, datos, motor, contrato de entrada del motor, formulas legales, liquidaciones, cierre, Previred/LRE, Python, UI, rutas ni sidebar.
- Validacion aplicada contra `SUPABASE_DB_URL` del `.env`: RLS habilitado, tres policies, sin lectura `anon` y sin `DELETE` para `authenticated`.

Nota para fases futuras: cuando una fase tenga como objetivo integrar entradas mensuales al motor, se permite ajustar modelos, interfaces o contratos de entrada sin cambiar formulas previsionales, tributarias ni resultados legales, salvo que esa fase lo autorice explicitamente.

## 8.4 NOM-UX-01 - Consolidacion visual de Novedades mensuales

NOM-UX-01 consolida la experiencia de RRHH para hechos del periodo:

- Movimientos del mes queda como opcion visible principal en el sidebar.
- Movimientos variables se retira del menu principal y queda como ruta legacy/transicion conservada.
- No se borra `MovimientosVariablesService`, el modulo legacy ni la ruta `/remuneraciones/movimientos-variables`.
- No se migran datos y no se modifica SQL/RLS.
- No se modifica motor, contrato de entrada del motor, formulas legales, liquidaciones, Previred/LRE ni Python.
- Proceso mensual ya consume entradas canonicas desde UNIF-NOM-03; el cambio visual solo evita presentar dos pantallas productivas equivalentes.

## 9. Prevalidaciones y estados

Estados globales: `SIN_EVALUAR` (antes de ejecutar), `LISTO_PARA_CALCULO`, `CON_ADVERTENCIAS`, `BLOQUEADO`. Detalle en `prevalidaciones-9-5A.md` y ampliacion 9.5B en `prevalidaciones-9-5B.md`.

En UI visible, los estados de checklist se traducen a lenguaje operativo: `Listo`, `Revisar`, `Pendiente de integracion` y `Sin evaluar`. No deben presentarse estados internos crudos como foco principal para RRHH.

## 10. Bloqueos y advertencias

Los mensajes llevan `codigo`, `area`, `severidad` y `texto`. Severidades: `BLOQUEO`, `ADVERTENCIA`, `INFO`. Los `INFO` de integracion futura van en `informaciones` y no cambian el estado a `CON_ADVERTENCIAS`.

## 11. Motor de calculo

MOTOR-00 deja definido el contrato documental del motor. MOTOR-01 implementa el calculo base preliminar definido en:

- [`motor-calculo-contrato.md`](./motor-calculo-contrato.md)
- [`motor-calculo-orden-operaciones.md`](./motor-calculo-orden-operaciones.md)
- [`motor-calculo-entradas-salidas.md`](./motor-calculo-entradas-salidas.md)
- [`motor-calculo-casos-prueba.md`](./motor-calculo-casos-prueba.md)

El motor consumira los mismos prerequisitos validados aqui y la pre-nomina 9.5C. Las liquidaciones seran **snapshot** inmutable en una fase posterior (no formulario libre). Previred y LRE seran salidas posteriores, no pasos CRUD en esta pantalla.

MOTOR-01 queda documentado en [`motor-calculo-implementacion-01.md`](./motor-calculo-implementacion-01.md). MOTOR-02 queda documentado en [`motor-calculo-implementacion-02.md`](./motor-calculo-implementacion-02.md). MOTOR-03A queda documentado en [`motor-calculo-persistencia-03A.md`](./motor-calculo-persistencia-03A.md). MOTOR-03B queda documentado en [`motor-calculo-persistencia-03B.md`](./motor-calculo-persistencia-03B.md). MOTOR-03C queda documentado en [`motor-calculo-persistencia-03C.md`](./motor-calculo-persistencia-03C.md). La salida puede vivir en memoria o guardarse como snapshot preliminar, sin convertirse en liquidacion oficial.

## 12. Pre-nomina 9.5C

La pre-nomina por periodo es una base funcional de control. En UI visible, desde USAB-NOM-03 se denomina **Base de nomina**. Se puede construir solo desde una prevalidacion sin bloqueos. Si hay advertencias, queda como `GENERADA_CON_ADVERTENCIAS`; si hay bloqueos, queda `NO_GENERABLE`.

No persiste datos ni marca movimientos como incluidos. No reemplaza el motor ni genera liquidaciones.

## 12.1 Validacion operativa antes de calculo preliminar

USAB-NOM-05 define el semaforo visible previo a `Calcular preliminar`.

Bloquea el calculo preliminar:

- periodo invalido o no validado;
- error tecnico activo al cargar datos necesarios;
- base de nomina no generada;
- base sin trabajadores considerados;
- parametros minimos obligatorios faltantes para calcular;
- bloqueos reales de prevalidacion o trabajadores bloqueados en la base.

No bloquea por defecto:

- ausencia de movimientos del mes;
- ausencia de asignaciones recurrentes activas;
- observaciones no bloqueantes de trabajadores;
- parametros opcionales pendientes para cierre o reconciliacion.

Parametros minimos para preliminar:

- grupo mensual base (`mensuales_uf_utm_sueldo`);
- topes base (`topes_base`);
- catalogos esenciales AFP/impuesto (`catalogos_afp_impuesto`).

La completitud legal total del periodo queda para cierre, reconciliacion o carga final. Esta validacion no modifica formulas legales, motor, snapshots, liquidaciones oficiales, SQL/RLS, Previred/LRE ni banco.

## 12.2 Resultado preliminar revisable

USAB-NOM-06 define el resultado posterior a `Calcular preliminar` como una salida operativa revisable.

Debe mostrar:

- estado del resultado: sin resultado, calculado con exito, calculado con observaciones, no se pudo calcular o guardado como preliminar;
- resumen con trabajadores calculados, trabajadores con observaciones, trabajadores omitidos y totales disponibles;
- tabla de trabajadores del resultado con nombre/RUT, estado, haberes, descuentos, liquido preliminar y observaciones;
- observaciones del resultado separadas en bloqueos, advertencias e informacion;
- detalle tecnico secundario: version del calculo, identificador tecnico y fecha de generacion;
- acciones operativas: recalcular preliminar, revisar base, revisar movimientos del mes, revisar asignaciones recurrentes y guardar resultado preliminar cuando el flujo lo permite.

Reglas:

- no inventar totales no disponibles;
- no usar `Issues`, `Hash` ni IDs como labels principales;
- no presentar el resultado como liquidacion oficial;
- no agregar cierre, Previred, LRE ni banco como acciones activas;
- guardar resultado preliminar conserva una version revisable del calculo, no cierra periodo.

## 12.2.1 Guardado y versionado operativo del resultado preliminar

USAB-NOM-07 define el guardado como una version operativa revisable del calculo preliminar.

Estados visibles:

- `Sin resultado`: no existe calculo preliminar actual.
- `Resultado no guardado`: existe calculo preliminar sin bloqueos y aun no fue guardado.
- `Resultado guardado`: el resultado actual quedo guardado como version revisable.
- `Resultado actualizado sin guardar`: se recalculo despues del ultimo guardado.
- `No se pudo guardar`: fallo la persistencia o la validacion de guardado.

Reglas:

- se puede guardar solo si existe resultado preliminar, el periodo es valido y no hay bloqueos del resultado;
- si no se puede guardar, la UI muestra razon visible;
- antes de guardar se confirma que no emite liquidaciones, no cierra el periodo y no genera archivos legales;
- el ultimo resultado preliminar guardado muestra fecha de guardado, version del calculo, identificador tecnico, trabajadores calculados, trabajadores con observaciones, trabajadores omitidos y liquido preliminar si existe;
- las advertencias no bloqueantes quedan visibles despues de guardar;
- si se recalcula despues de guardar, la UI diferencia el ultimo guardado del resultado actual.

Persistencia real:

- se usa `ProcesoMensualService.guardarSnapshotPreliminar` y `NominaCalculoSnapshotRepository`;
- desde NOM-ATOMIC-01, `NominaCalculoSnapshotRepository` llama la RPC `guardar_nomina_calculo_snapshot` para hacer el commit real en BD;
- el guardado reemplaza el resultado activo del periodo dentro de la misma transaccion: el anterior se marca inactivo/anulado y se vincula con `reemplazadoPor` solo despues de insertar el nuevo resultado completo;
- no existe version numerica incremental funcional propia, por lo que la UI no la inventa;
- la identificacion disponible es fecha de guardado, `versionMotor`, `hashSnapshot` e `idCalculoPeriodo` como referencia tecnica secundaria.

Fuera de alcance:

- liquidacion oficial;
- cierre de periodo;
- Previred, LRE, banco o archivos legales;
- cambios de formulas legales;
- SQL/RLS, migraciones o cambios de seguridad.

## 12.2.1.1 Reemplazo atomico/transaccional del resultado guardado

NOM-ATOMIC-01 define el guardado/reemplazo como una operacion transaccional de BD. El cliente no debe encadenar inserts y updates separados para crear el resultado guardado.

RPC vigente:

- funcion: `guardar_nomina_calculo_snapshot`;
- archivo SQL: `bd/base/v11/partes/20_nomina_calculo_snapshot_rpc.sql`;
- seguridad: `security invoker`, `REVOKE` a `PUBLIC` y `GRANT EXECUTE` solo a `authenticated`;
- payload: periodo, empresa opcional, cabecera, trabajadores, conceptos, observaciones y trazabilidad;
- retorno: `id_calculo_periodo` del resultado nuevo.

Reglas transaccionales:

- la RPC valida periodo, cabecera y arrays minimos;
- bloquea el resultado activo actual del periodo/empresa con `FOR UPDATE`;
- inserta el resultado nuevo inicialmente como `activo = false`;
- inserta trabajadores, conceptos, observaciones y trazabilidad;
- al final, si habia resultado activo anterior, lo marca `activo = false`, `estado = anulado` y `reemplazado_por = nuevo_id`;
- solo al final activa el nuevo resultado;
- si falla cualquier insercion o validacion, PostgreSQL revierte la llamada completa.

Aprobacion operativa:

- el nuevo resultado se crea sin aprobacion operativa;
- la aprobacion del resultado anterior no se copia;
- si se consulta el resultado anterior por `id_calculo_periodo`, conserva su aprobacion historica;
- el resultado activo nuevo queda pendiente de aprobacion operativa propia.

La UI debe mostrar error claro si la RPC falla: `No se pudo guardar el resultado preliminar completo. No se realizaron cambios parciales.`

### Validacion en BD real NOM-DB-APPLY-01

NOM-DB-APPLY-01 aplica y valida los scripts de snapshots/RLS/RPC en la BD Supabase remota controlada configurada en `.env`.

Resultado de validacion:

- aplicados con `psql`: `15_nomina_calculo_snapshot.sql`, `16_nomina_calculo_snapshot_rls.sql` y `20_nomina_calculo_snapshot_rpc.sql`;
- existen las 6 columnas `aprobacion_operativa_*` en `nomina_calculo_periodo`;
- `guardar_nomina_calculo_snapshot` existe y compila como `SECURITY INVOKER`;
- `authenticated` puede ejecutar la RPC;
- `anon` no puede ejecutar la RPC;
- ACL de la funcion no conserva permiso `PUBLIC`;
- RLS sigue habilitado en `nomina_calculo_periodo`, `nomina_calculo_trabajador`, `nomina_calculo_concepto`, `nomina_calculo_issue` y `nomina_calculo_trazabilidad`;
- no hay grupos con mas de un snapshot activo por periodo/empresa;
- prueba transaccional con periodo `2099-12` valido primer guardado, reemplazo, aprobacion historica conservada, nuevo resultado sin aprobacion heredada y rollback ante payload invalido;
- la prueba termino con `ROLLBACK` y se verifico que no quedaron filas permanentes para `2099-12`.

Pendiente acotado: prueba manual end-to-end desde UI con sesion `authenticated` real. La validacion automatizada y de BD confirma que la infraestructura soporta el flujo; la prueba UX queda para una sesion operativa disponible.

### Validacion E2E operativa NOM-E2E-01

NOM-E2E-01 prepara la validacion real de `Preparar nomina` desde UI con sesion Supabase `authenticated`.

E2E agregado:

- archivo: `tests/nomina-mensual.e2e.spec.ts`;
- activacion: `E2E_NOMINA_REAL=1`;
- credenciales requeridas fuera del codigo: `E2E_SUPABASE_AUTH_EMAIL`, `E2E_SUPABASE_AUTH_PASSWORD`;
- periodo requerido: `E2E_NOMINA_PERIODO`;
- fuente de configuracion: `public/app-config.json` o `E2E_SUPABASE_URL`/`E2E_SUPABASE_ANON_KEY`.

Cobertura esperada cuando se habilite:

- iniciar sesion con `signInWithPassword` y guardar la sesion en `angular-erp-auth`;
- abrir `Preparar nomina`;
- validar periodo, generar base, calcular resultado preliminar;
- guardar resultado preliminar con la RPC real;
- consultar `Resultado guardado desde BD`;
- validar en BD que existe un unico snapshot activo con cabecera y detalles;
- aprobar operativamente;
- recargar y recuperar snapshot/aprobacion persistidos.

Estado del entorno revisado:

- no hay variables `E2E_SUPABASE_AUTH_EMAIL`, `E2E_SUPABASE_AUTH_PASSWORD` ni `E2E_NOMINA_PERIODO`;
- no se inventa usuario, no se usa `service_role` y no se escriben datos de prueba sin ambiente confirmado;
- estado historico: esa ejecucion quedo bloqueada por credenciales/periodo E2E reales; el hito fue cerrado despues por NOM-E2E-CLOSE-01 para `2026-04`.

### Diagnostico de guardado real NOM-SAVE-DIAG-01

NOM-SAVE-DIAG-01 ejecuta el flujo real authenticated para `2026-04` y convierte el error generico de UI en diagnostico verificable.

Resultado:

- punto de fallo reproducido: al guardar resultado preliminar por RPC;
- error tecnico sanitizado: `code=22007`, `message=invalid input syntax for type date: "2026-04"`, `details=null`, `hint=null`;
- causa raiz: trazabilidad del snapshot enviaba periodo mensual `YYYY-MM` hacia columnas `DATE`;
- correccion: normalizar vigencias de trazabilidad a fecha SQL valida (`YYYY-MM-01`) o `null` antes de persistir;
- SQL/RPC/RLS: no se modifican y no requieren reaplicacion;
- E2E posterior: guarda resultado preliminar, consulta `Resultado guardado desde BD`, aprueba operativamente y recupera tras recargar;
- SQL post-guardado: un unico snapshot activo para `2026-04`, aprobado operativamente, sin duplicados activos.

La instrumentacion agregada es segura para desarrollo/E2E: registra nombre de RPC, periodo, conteos del payload y error Supabase sanitizado. No registra tokens, passwords, headers, connection strings ni payload completo con datos personales.

### Cierre documental E2E real NOM-E2E-CLOSE-01

NOM-E2E-CLOSE-01 consolida como hito cerrado el E2E real authenticated de nomina mensual.

Flujo validado:

1. Login real con usuario Supabase `authenticated`.
2. Periodo `2026-04`.
3. Validar periodo.
4. Generar base de nomina.
5. Calcular resultado preliminar.
6. Guardar resultado preliminar mediante `guardar_nomina_calculo_snapshot`.
7. Consultar `Resultado guardado desde BD`.
8. Aprobar operativamente.
9. Recargar y recuperar snapshot/aprobacion persistidos.

Evidencia:

- comando: `npx playwright test tests/nomina-mensual.e2e.spec.ts --workers=1`;
- resultado: OK, 1 passed / 1 skipped;
- SQL post-guardado: snapshot activo `id_calculo_periodo=11`, 2 trabajadores, 16 conceptos, 12 observaciones, 72 trazas;
- aprobacion: `aprobacion_operativa_estado=aprobado_operativamente`;
- duplicados activos: 0.

Interpretacion funcional:

- el resultado preliminar guardado y aprobado es una revision operativa interna asociada al `id_calculo_periodo` activo;
- la aprobacion operativa no es cierre de periodo, no es liquidacion oficial y no usa `aprobado_para_liquidacion`;
- un nuevo snapshot/recalculo no hereda automaticamente la aprobacion del resultado anterior;
- el snapshot consultado desde BD es la fuente de revision del resultado guardado, no una reconstruccion con parametros actuales.

Fuera de alcance de este cierre documental:

- cierre operativo o legal;
- reapertura, anulacion formal o rectificacion;
- liquidaciones oficiales;
- PDF, Previred, LRE, banco o contabilidad;
- roles finos/JWT/RLS por rol;
- cambios de SQL/RPC/RLS, formulas legales, motor o seeds.

Siguiente fase recomendada despues del diseno: `NOM-CIERRE-01 - Implementar cierre operativo controlado`.

Preguntas que debe resolver esa fase:

- que entidad se cierra: `nomina_calculo_periodo`, `periodo_remuneracion` o ambas;
- que estado persistido representa el cierre y quien puede cambiarlo;
- que bloqueos impiden cerrar;
- como se comportan recalculo, reemplazo de snapshot y aprobacion despues del cierre;
- como se reabre o rectifica un periodo cerrado;
- como se relaciona el cierre con liquidacion oficial futura;
- que auditoria minima se exige para cerrar/reabrir.

### Diseno de cierre operativo NOM-CIERRE-DESIGN-01

NOM-CIERRE-DESIGN-01 cierra documentalmente las decisiones para implementar despues `NOM-CIERRE-01 - Implementar cierre operativo controlado`.

Definicion:

```txt
El cierre operativo congela el snapshot de nomina aprobado operativamente para un periodo, impidiendo recalcular, reemplazar o aprobar otro resultado para ese mismo periodo mientras el cierre este vigente.
```

No significa:

- cierre legal;
- liquidacion oficial;
- PDF;
- Previred;
- LRE;
- archivo banco;
- contabilidad;
- firma o envio de documentos.

Decisiones vigentes para NOM-CIERRE-01:

| Decision | Definicion v1 |
|---|---|
| Persistencia | Agregar columnas `cierre_operativo_*` en `nomina_calculo_periodo`. |
| `periodo_remuneracion.estado` | No tocar en v1. |
| Advertencias | No bloquean por defecto; se muestran y registran en metadata. |
| Reapertura | Fuera de NOM-CIERRE-01; requiere fase propia. |
| Mecanismo | RPC atomica `cerrar_nomina_operativa`. |
| Nombre visible | `Cerrar nomina del periodo`. |

Precondiciones para cerrar:

- periodo valido seleccionado;
- snapshot activo guardado en BD;
- snapshot no reemplazado;
- aprobacion operativa persistida sobre el `id_calculo_periodo` activo;
- no existe resultado actualizado sin guardar;
- no existen bloqueos impeditivos;
- no existe cierre operativo vigente;
- usuario con sesion `authenticated`.

Despues de cerrar, deben bloquearse recalculo, nuevo guardado preliminar, reemplazo de snapshot activo, aprobacion de otro resultado y edicion de la preparacion como abierta. Debe seguir permitida la consulta del resultado cerrado, snapshot desde BD, trabajadores, conceptos, observaciones, trazabilidad, aprobacion operativa y cierre operativo.

Contrato tecnico propuesto para NOM-CIERRE-01:

```sql
cierre_operativo_estado text null,
cierre_operativo_fecha timestamptz null,
cierre_operativo_usuario_id uuid null,
cierre_operativo_usuario_label text null,
cierre_operativo_observacion text null,
cierre_operativo_metadata jsonb not null default '{}'::jsonb
```

CHECK sugerido:

```sql
cierre_operativo_estado is null
or cierre_operativo_estado in ('cerrado_operativamente')
```

La RPC `cerrar_nomina_operativa` debe validar atomicamente que el snapshot existe, el periodo coincide, `activo = true`, `reemplazado_por is null`, `aprobacion_operativa_estado = 'aprobado_operativamente'`, `cierre_operativo_estado is null` y que el usuario sea `authenticated`. Debe revocar `PUBLIC` y `anon`, y permitir ejecucion solo a `authenticated`.

Contrato UI propuesto:

- bloque visible: `Cierre operativo`;
- ubicacion: despues de `Aprobacion operativa` y antes de salidas futuras;
- estados: `No disponible`, `Disponible para cierre`, `Cerrada operativamente`, `Cerrada con advertencias`;
- accion: `Cerrar nomina del periodo`;
- helper obligatorio: `El cierre operativo congela este resultado para continuar con etapas posteriores. No emite liquidaciones ni genera archivos legales.`

Documento especifico: [`../../fases/nomina/NOM-CIERRE-DESIGN-01.md`](../../fases/nomina/NOM-CIERRE-DESIGN-01.md).

Siguiente fase: `NOM-CIERRE-01 - Implementar cierre operativo controlado`.

### Ejecucion NOM-E2E-02

NOM-E2E-02 intento ejecutar el flujo real authenticated despues de AUTH-BASE-01. En la ejecucion inicial quedo parcial por precondiciones faltantes, pero el hito fue completado posteriormente por NOM-SAVE-DIAG-01 y consolidado por NOM-E2E-CLOSE-01.

Entorno local del 2026-05-09:

- faltan `E2E_NOMINA_REAL`, `E2E_SUPABASE_AUTH_EMAIL`, `E2E_SUPABASE_AUTH_PASSWORD` y `E2E_NOMINA_PERIODO`;
- falta `SUPABASE_DB_URL` para consultas SQL post-E2E;
- no se pudo autenticar un usuario real ni probar un periodo real;
- no se creo snapshot por UI, no se aprobo operativamente y no hubo `id_calculo_periodo` para consultas posteriores.

Comandos ejecutados:

- `npx playwright test tests/nomina-mensual.e2e.spec.ts --workers=1`: OK en modo seguro, 1 passed / 1 skipped;
- `npx ng test --watch=false`: OK, 409 tests;
- `npm run build`: OK, con warnings conocidos de budget CSS en Empleados.

Estado actualizado 2026-05-10: cerrada por NOM-E2E-CLOSE-01. La evidencia final corresponde al periodo `2026-04`, con guardado RPC real, consulta BD, aprobacion operativa y recuperacion tras recargar.

### Preparacion de entorno ENV-E2E-01

ENV-E2E-01 prepara el entorno para repetir NOM-E2E-02 en modo real sin exponer secretos.

Ambiente definido:

- Supabase remoto/controlado apuntado por `public/app-config.json`;
- `SUPABASE_DB_URL` disponible en `.env` local para SQL post-E2E;
- `.env` ignorado por Git;
- `.env.example` contiene solo nombres de variables y placeholders vacios.

Variables requeridas:

- `E2E_NOMINA_REAL`;
- `E2E_SUPABASE_AUTH_EMAIL`;
- `E2E_SUPABASE_AUTH_PASSWORD`;
- `E2E_NOMINA_PERIODO`;
- `SUPABASE_DB_URL`;
- opcionales: `E2E_SUPABASE_URL` y `E2E_SUPABASE_ANON_KEY`.

Validacion ejecutada:

- conexion SQL OK usando `SUPABASE_DB_URL` local;
- permisos de `guardar_nomina_calculo_snapshot`: `authenticated=true`, `anon=false`;
- E2E modo seguro OK con el caso real omitido mientras faltan usuario/periodo.

Bloqueos restantes:

- para repetir la prueba en otro ambiente: crear o confirmar usuario Supabase Auth de desarrollo;
- configurar email/password solo en `.env` local o sesion PowerShell;
- elegir `E2E_NOMINA_PERIODO`;
- confirmar que ese periodo tenga parametros, trabajador activo, contrato vigente, datos previsionales/salud minimos y entradas suficientes;
- ejecutar el E2E real y SQL post-guardado en ese ambiente.

No se crearon datos de prueba ni usuarios en esta fase. No se uso `service_role`, no se modifico RLS/RPC y no se cambiaron formulas legales.

### Autenticacion base AUTH-BASE-01

AUTH-BASE-01 agrega la base minima para que `Preparar nomina` opere con sesion Supabase `authenticated` real.

Cambios relevantes para Nomina:

- `/login` permite iniciar sesion con email/password de Supabase Auth;
- las rutas internas, incluida `/remuneraciones/proceso-mensual`, quedan protegidas;
- el header muestra la sesion activa y permite cerrar sesion;
- el E2E de nomina inicia por UI de login cuando existen variables reales;
- la aprobacion operativa puede recuperar usuario/email desde Supabase Auth mediante el cliente existente.

La fase no agrega roles avanzados, permisos finos, modulo de usuarios, cierre, liquidaciones oficiales, Previred, LRE, banco ni cambios de formulas legales.

## 12.2.2 Revision operativa para aprobacion

USAB-NOM-08 agrega una capa de decision de usuario sobre el resultado preliminar guardado. La revision vive despues del bloque `Ultimo resultado preliminar guardado` y no reemplaza el guardado ni crea estados legales.

Estados visibles:

- `Sin resultado guardado`: aun no existe version preliminar para revisar.
- `Pendiente de guardado`: existe calculo preliminar actual, pero no fue guardado.
- `Resultado guardado pendiente de revision`: hay resultado guardado con advertencias u observaciones no bloqueantes.
- `Resultado actualizado sin guardar`: se recalculo despues del ultimo guardado y debe guardarse la version vigente.
- `No apto para aprobacion`: existen bloqueos u omisiones que deben corregirse.
- `Listo para aprobar`: el resultado guardado no tiene bloqueos ni advertencias visibles para la revision operativa.

Checklist minimo visible:

- resultado preliminar guardado;
- resultado guardado vigente;
- trabajadores calculados revisables;
- ausencia de bloqueos operativos;
- advertencias visibles para decision de RRHH;
- acciones legales marcadas como fase posterior.

Reglas de UX:

- cada estado debe explicar la siguiente accion en lenguaje operativo;
- bloqueos, advertencias e informacion se muestran separados para facilitar decision;
- la accion vigente es `Aprobar resultado preliminar` cuando se cumplen las condiciones de USAB-NOM-09;
- no se usan `issues`, `payload`, `hash` ni `snapshot` como labels principales de usuario;
- no se muestran aprobacion real, cierre, liquidacion oficial, Previred, LRE ni banco como acciones activas.

## 12.2.3 Aprobacion operativa interna persistida

USAB-NOM-09 habilita la accion `Aprobar resultado preliminar` sobre el resultado preliminar guardado vigente. NOM-PERSIST-01 persiste formalmente esa aprobacion en la cabecera `nomina_calculo_periodo`. Aprobar significa que RRHH reviso y acepta operativamente ese resultado guardado especifico para seguir a una etapa posterior; no significa cierre legal ni emision de liquidaciones.

Condiciones para aprobar:

- existe periodo valido;
- existe resultado preliminar guardado;
- el resultado guardado esta vigente;
- no existe resultado recalculado posterior sin guardar;
- no hay bloqueos operativos ni trabajadores omitidos;
- las advertencias, si existen, quedan visibles antes de confirmar.

Resultado visible:

- estado `Aprobado operativamente` o `Aprobacion desactualizada`;
- fecha/hora de aprobacion;
- usuario visible si existe contexto real, o texto operativo `Usuario no disponible en esta sesion`;
- version del calculo e identificador tecnico como detalle secundario;
- trabajadores calculados, total haberes, total descuentos y liquido preliminar;
- advertencias presentes al aprobar.

Reglas:

- requiere confirmacion previa y el mensaje aclara que no emite liquidaciones, no cierra periodo y no genera archivos legales;
- se registra en el mismo resultado guardado (`id_calculo_periodo`) mediante `aprobacion_operativa_estado`, `aprobacion_operativa_fecha`, usuario, advertencias y metadata;
- al cargar o validar el periodo, la UI recupera la aprobacion desde BD y reconstruye el bloque visible;
- si la persistencia falla, la UI no marca el resultado como aprobado y muestra error operativo;
- si se recalcula despues, la aprobacion anterior queda visible como desactualizada y se exige guardar/aprobar nuevamente;
- no aprueba automaticamente al guardar;
- no usa `aprobado_para_liquidacion`; ese estado queda fuera de esta fase para evitar mezclar aprobacion operativa interna con liquidacion oficial futura;
- no modifica formulas legales, motor, liquidaciones oficiales, cierre, Previred, LRE ni banco.

## 12.2.3.1 Snapshot completo consultable desde BD

NOM-SNAPSHOT-01 agrega la consulta operativa del resultado guardado completo. La UI muestra `Resultado guardado desde BD` para que RRHH pueda revisar lo que quedo persistido sin depender del calculo en memoria ni de parametros actuales.

Lectura minima:

- `nomina_calculo_periodo`: cabecera, estado, fecha, totales, version del motor, identificador tecnico, activo/reemplazado y aprobacion operativa;
- `nomina_calculo_trabajador`: trabajadores calculados y totales por persona;
- `nomina_calculo_concepto`: conceptos guardados por trabajador, monto, tipo, origen y flags imponible/tributable/afecta liquido;
- `nomina_calculo_issue`: observaciones de periodo o trabajador;
- `nomina_calculo_trazabilidad`: codigo, origen, fuente, vigencia, formula, entrada, resultado y observacion.

Reglas:

- se puede consultar el snapshot activo por periodo o un snapshot especifico por `id_calculo_periodo`;
- la consulta no invoca `generarCalculoPeriodo`, no relee movimientos del mes, no reevalua parametros y no recalcula montos;
- la UI prioriza labels operativos (`Trabajadores guardados`, `Conceptos`, `Observaciones`, `Trazabilidad`) y mantiene identificadores tecnicos como detalle secundario;
- si no hay resultado guardado, muestra empty state accionable; si falla la consulta, muestra error operativo reintentable;
- un snapshot reemplazado debe mostrarse como reemplazado/no vigente cuando se consulte por id;
- no habilita cierre, liquidacion oficial, Previred, LRE, banco ni PDF.

## 12.2.4 Saneamiento previo a cierre operativo

NOM-HARD-01 fija el corte funcional antes de disenar cierre operativo. El sistema soportado queda en esta secuencia:

1. Resultado preliminar calculado.
2. Resultado preliminar guardado como version revisable.
3. Resultado aprobado operativamente por RRHH en UI.
4. Cierre operativo del periodo: pendiente.
5. Liquidaciones oficiales: pendiente.
6. Salidas legales y bancarias (PDF, Previred, LRE, banco): pendiente.

Reglas de saneamiento:

- `Aprobar resultado preliminar` es una aprobacion interna persistida desde NOM-PERSIST-01 en la cabecera del resultado guardado.
- La persistencia formal disponible no equivale a cierre; cierre/reapertura e historico avanzado deben definirse antes de emitir liquidaciones oficiales.
- El snapshot completo ya puede consultarse desde BD para revision operativa desde NOM-SNAPSHOT-01.
- El reemplazo de snapshot activo ya usa RPC transaccional desde NOM-ATOMIC-01; antes de cierre aun deben definirse validaciones formales de cierre e historico avanzado.
- `window.confirm` es deuda de UX; antes de cierre operativo debe reemplazarse por un dialogo propio auditable y testeable.
- Cierre, reapertura, anulacion o rectificacion de periodo requieren contrato propio; no se infieren desde USAB-NOM-09.
- Las pantallas de Liquidaciones no deben mostrar datos demo ni acciones aparentes de firma, descarga, impresion, envio o liquidacion oficial hasta que exista modulo real.

Fuera de alcance de este saneamiento:

- no implementar liquidaciones oficiales;
- no crear cierre de periodo;
- no generar Previred, LRE, PDF ni archivo de banco;
- no cambiar formulas legales ni motor;
- no implementar cierre, liquidacion oficial, Previred, LRE, banco ni PDF.

## 12.1 Calculo preliminar MOTOR-01/MOTOR-02

El calculo preliminar solo se habilita despues de una pre-nomina generable. Calcula por trabajador:

- haberes imponibles y no imponibles;
- base imponible previsional preliminar;
- base tributable preliminar;
- gratificacion legal art. 50 solo con configuracion suficiente o gratificacion recurrente vigente;
- topes previsionales solo desde campos claros de `parametros_generales`;
- asignacion familiar simple solo con `tramo_carga` y cargas en snapshot;
- AFP, salud, AFC, SIS, SANNA, Ley 16.744 e impuesto unico con `tabla_impuesto_unico` cuando hay datos suficientes;
- total haberes, total descuentos trabajador y liquido preliminar;
- issues y trazabilidad.

Ley 16.744, SIS y SANNA respetan DB-01: `ley_16744_parametros`, `empresa_ley_16744` como snapshot opcional, `parametros_generales.sis`, `afp_vigencia.sis` y `parametros_generales.sanna`. No se usan tablas no confirmadas.

## 12.2 Snapshot preliminar MOTOR-03A

MOTOR-03A define el contrato para guardar un resultado preliminar en una fase posterior. El snapshot:

- congela un resultado del motor por periodo y empresa;
- no es liquidacion oficial;
- no cierra el periodo;
- puede reemplazarse por recalculo si el periodo no esta cerrado;
- conserva issues, trazabilidad, parametros, formulas y origenes;
- usa `version_motor` y `hash_snapshot` para comparar recalculos.

Estados documentales permitidos: `borrador`, `preliminar`, `recalculado`, `observado`, `listo_para_revision`, `aprobado_para_liquidacion` y `anulado`.

Estados excluidos hasta fases futuras: `cerrado`, `enviado_previred`, `enviado_lre` y `contabilizado`.

Las tablas `nomina_calculo_periodo`, `nomina_calculo_trabajador`, `nomina_calculo_concepto`, `nomina_calculo_issue` y `nomina_calculo_trazabilidad` son candidatas documentales. No existen ni se crean en MOTOR-03A.

## 12.3 Persistencia controlada MOTOR-03B

MOTOR-03B crea SQL local incremental para las tablas de snapshot preliminar y agrega servicio/repository para guardar el resultado en memoria del motor.

Reglas:

- solo guarda si existe calculo preliminar sin bloqueos;
- reemplaza snapshot activo anterior marcandolo inactivo/anulado, sin borrado fisico;
- guarda trabajadores, conceptos, issues y trazabilidad;
- calcula `hash_snapshot` deterministico simple para comparar recalculos;
- no modifica `periodo_remuneracion`;
- no cierra periodo;
- no genera liquidacion oficial, PDF, Previred, LRE ni contabilidad.

El SQL queda en `bd/base/v11/partes/15_nomina_calculo_snapshot.sql` y no se aplica remotamente en esta fase.

## 12.4 Aplicacion controlada MOTOR-03C

MOTOR-03C valida el SQL de snapshots y lo registra en el flujo fresh local v11 mediante `bd/base/v11/run_all.sql`.

Resultado:

- PK/FK confirmadas contra `empresa(id_empresa)`, `persona(id_persona)` y `concepto(id_concepto)`;
- `psql` y Docker no disponibles en el entorno revisado;
- Supabase CLI disponible via dependencia local, pero no se ejecuto `supabase db push`;
- no se aplico migracion remota sin proyecto de desarrollo confirmado;
- no se regenero `database.types.ts` porque las tablas no existen aun en un ambiente consultable;
- repository mantiene capa local hasta regenerar tipos reales.

MOTOR-03C no agrega reglas de calculo, no cambia UI, no cierra periodo, no crea liquidacion oficial, no genera PDF, Previred, LRE ni contabilidad.

## 12.5 MOTOR-04 - Contrato de entradas mensuales para el motor

MOTOR-04 prepara el contrato de entrada del motor para recibir entradas mensuales canonicas desde Proceso mensual.

Decision aplicada: **Opcion A - contrato preparatorio**.

Cambios de contrato:

- `MotorCalculoInput` agrega `entradasMensuales`.
- `EntradaMensualMotor` representa una entrada mensual normalizada apta para el motor.
- `proceso-mensual-motor-entradas.rules.ts` mapea `EntradaMensualPeriodo` hacia `EntradaMensualMotor`.
- `ProcesoMensualService` arma el input con entradas aptas provenientes de `EntradasMensualesPeriodoService` via prevalidacion.

Entradas incluidas:

- entradas aprobadas;
- entradas sin bloqueo critico;
- legacy validado solo como transicion cuando ya fue normalizado como aprobado.

Entradas excluidas:

- borrador;
- pendiente_revision;
- observada;
- rechazada;
- anulada;
- `legacy_bloqueado` o cualquier entrada con bloqueo critico.

Alcance de calculo:

- El motor recibe `entradasMensuales`, pero no las suma todavia a haberes, descuentos, bases ni liquido.
- No se modifican formulas previsionales, tributarias ni legales.
- No se cambia calculo de AFP, salud, AFC, SIS, SANNA, impuesto unico ni Ley 16.744.
- No se generan liquidaciones oficiales, no se cierra periodo y no se modifican snapshots oficiales.
- No se modifica SQL/RLS, Python, Previred/LRE, UI, rutas ni sidebar.

La fase posterior debe decidir como cada entrada mensual aprobada afecta base imponible, base tributable, liquido y trazabilidad calculada, apoyandose en reglas gobernadas de Conceptos.

## 13. Referencias

- `prevalidaciones-9-5A.md` (fase 9.5A).
- `prevalidaciones-9-5B.md` (fase 9.5B: recurrentes + grupos parametros).
- `prevalidaciones-9-5C.md` (fase 9.5C: pre-nomina funcional por periodo).
- `novedades-mensuales.md` (fases NOM-01, NOM-01B, NOM-01C y NOM-01D).
- `motor-calculo-contrato.md` (fase MOTOR-00).
- `motor-calculo-orden-operaciones.md`.
- `motor-calculo-entradas-salidas.md`.
- `motor-calculo-casos-prueba.md`.
- `motor-calculo-implementacion-01.md` (fase MOTOR-01).
- `motor-calculo-implementacion-02.md` (fase MOTOR-02).
- `motor-calculo-persistencia-03A.md` (fase MOTOR-03A).
- `motor-calculo-persistencia-03B.md` (fase MOTOR-03B).
- `motor-calculo-persistencia-03C.md` (fase MOTOR-03C).
- `vision-futura.md`.
- Orquestador: `docs/codex/orquestador/estado-fases.md`.
- Arquitectura: `docs/codex/arquitectura/frontend-interfaces.md`.

<!-- ARQ-ERP-01-INTEGRACION -->

## Integracion canonica 2026-05-07

Este contrato debe leerse junto con [`../../orquestador/estructura-canonica-erp.md`](../../orquestador/estructura-canonica-erp.md).

Decision vigente:

- **Movimientos del mes** es el nombre visible oficial.
- **Novedades mensuales** es el nombre tecnico/documental interno.
- `novedad_remuneracion_periodo` es la tabla canonica futura.
- `MovimientosVariablesService` y `movimiento_variable_mensual` pueden seguir existiendo como transicion, pero no son la arquitectura final.
- Proceso mensual consume `EntradasMensualesPeriodoService` desde UNIF-NOM-03; los alias legacy se conservan solo como compatibilidad temporal.
- El motor preliminar y los snapshots no equivalen aun a liquidacion oficial cerrada.


## Contrato canonico 2026-05-10

El resultado preliminar guardado es un snapshot persistido y reemplazable. La aprobacion operativa se asocia al `id_calculo_periodo` vigente.

La aprobacion operativa:

- no equivale a cierre operativo;
- no equivale a cierre legal;
- no emite liquidaciones oficiales;
- no genera PDF;
- no genera Previred;
- no genera LRE;
- no genera archivo banco;
- no genera contabilidad;
- no debe heredarse a un nuevo snapshot reemplazante.

El cierre operativo ya tiene diseno cerrado en `NOM-CIERRE-DESIGN-01` y debe implementarse en fase separada: `NOM-CIERRE-01`.
