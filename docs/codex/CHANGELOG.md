# CHANGELOG

## NOM-SNAPSHOT-01 - Snapshot completo consultable desde BD

Fecha: 2026-05-09

- Objetivo: consultar el resultado preliminar guardado completo desde BD, sin recalcular con datos actuales.
- Repository/servicio: se agregan `obtenerSnapshotCompletoActivo(periodo)` y `obtenerSnapshotCompletoPorId(idCalculoPeriodo)` para leer cabecera, trabajadores, conceptos, observaciones, trazabilidad y aprobacion operativa desde las tablas `nomina_calculo_*`.
- UI: `Preparar nomina` incorpora `Resultado guardado desde BD`, con estado vigente/reemplazado, resumen, trabajadores guardados, conceptos, observaciones y trazabilidad en lenguaje operativo.
- Trazabilidad usuario final: la pantalla diferencia detalle operativo de identificadores tecnicos; muestra errores de consulta y empty state sin inventar datos.
- Alcance: lectura consultable del snapshot preliminar; no recalcula movimientos/parametros, no cierra periodo, no emite liquidaciones, no genera Previred, LRE, banco ni PDF.
- Pendiente posterior: endurecer reemplazo atomico, cierre/reapertura, historico avanzado y validaciones de cierre sobre snapshot completo.
- Pruebas: `nomina-calculo-snapshot.repository.spec.ts`, `proceso-mensual.service.spec.ts`, `proceso-mensual-container.spec.ts`, `npx ng test --watch=false`, `npm run build`.

## NOM-PERSIST-01 - Persistencia formal de aprobacion operativa

Fecha: 2026-05-09

- Objetivo: persistir formalmente la aprobacion operativa del resultado preliminar guardado, asociada al `id_calculo_periodo` vigente.
- SQL: `nomina_calculo_periodo` agrega metadata de aprobacion operativa (`estado`, `fecha`, `usuario`, `advertencias` y `metadata`) sin usar `aprobado_para_liquidacion`.
- Servicio/UI: `Aprobar resultado preliminar` actualiza BD antes de mostrar aprobado; si falla la persistencia, la UI no marca aprobado y permite reintentar.
- Recuperacion: `Preparar nomina` consulta el resultado activo al cargar/validar periodo y reconstruye el bloque `Aprobacion operativa` desde BD.
- Alcance: aprobacion operativa interna persistida; no cierra periodo, no emite liquidaciones, no genera Previred, LRE, banco ni PDF, no cambia formulas legales.
- Pendiente posterior: cierre/reapertura, historico avanzado de aprobaciones/resultados, dialogo propio auditable y salidas legales.
- Pruebas: `proceso-mensual-container.spec.ts`, `proceso-mensual.service.spec.ts`, `proceso-mensual-snapshot.rules.spec.ts`, `npx ng test --watch=false`, `npm run build`.

## NOM-HARD-01 - Saneamiento previo a cierre operativo

Fecha: 2026-05-09

- Objetivo: sanear documentacion y pantallas visibles antes de cualquier fase de cierre operativo, evitando comunicar como disponible una salida oficial que aun no existe.
- Estado funcional confirmado: el flujo llega hasta resultado preliminar calculado, guardado y aprobado operativamente de forma interna; no hay cierre de periodo, liquidacion oficial, PDF, Previred, LRE ni archivo de banco.
- UI: `Liquidaciones oficiales` y su detalle dejan de mostrar datos demo, montos, firma, descarga, impresion o envio; la opcion se retira del sidebar y las rutas conservadas muestran estado no disponible.
- Documentacion: se registra que USAB-NOM-09 esta implementada/cerrada como aprobacion operativa local, volatil y pendiente de persistencia formal.
- Deudas documentadas: snapshot completo desde BD, reemplazo atomico/transaccional, persistencia formal de aprobacion, cierre/reapertura del periodo y reemplazo de `window.confirm` por UX propia.
- Fuera de alcance: no se implementan liquidaciones, cierre, salidas legales/bancarias, formulas, SQL/RLS, migraciones, RPC ni cambios de permisos.
- Pruebas: `npx ng test --watch=false`, `npm run build`.

## USAB-NOM-09 - Aprobacion operativa del resultado preliminar

Fecha: 2026-05-09

- Objetivo: habilitar una aprobacion operativa interna de RRHH sobre el resultado preliminar guardado vigente.
- UI: `Revision para aprobacion` reemplaza la accion futura por `Aprobar resultado preliminar`, con razon visible cuando no se puede aprobar y confirmacion previa.
- Trazabilidad: al aprobar se muestra `Aprobacion operativa` con estado, fecha/hora, usuario no disponible en esta sesion, version del calculo, identificador tecnico, trabajadores calculados, totales y advertencias visibles al aprobar.
- Estados visibles: `Sin resultado guardado`, `Pendiente de guardado`, `Listo para aprobar`, `Listo para aprobar con advertencias`, `Aprobado operativamente`, `Aprobacion desactualizada` y `No apto para aprobacion`.
- Recalculo: si se recalcula despues de aprobar, la aprobacion anterior queda visible como desactualizada y se exige guardar y aprobar nuevamente.
- Persistencia: no se crean columnas, tablas ni migraciones; la marca de aprobacion queda preparada en UI sobre el snapshot activo existente hasta una fase posterior de persistencia formal.
- Fuera de alcance: no cierra periodo, no emite liquidaciones oficiales, no genera Previred, LRE ni archivo de banco, no cambia formulas legales, motor, SQL/RLS, rutas ni permisos.
- Pruebas: `proceso-mensual-container.spec.ts`, `npx ng test --watch=false --include=src/app/features/nomina-mensual/containers/proceso-mensual-container/proceso-mensual-container.spec.ts`.

## USAB-NOM-08 - Revision operativa para aprobacion

Fecha: 2026-05-08

- Objetivo: agregar una capa visible de revision sobre el resultado preliminar guardado, luego reemplazada por la aprobacion operativa de USAB-NOM-09.
- UI: `Preparar nomina` incorpora el bloque `Revision para aprobacion` despues de `Ultimo resultado preliminar guardado`, con estado, descripcion, checklist operativo, observaciones para decidir y acciones de revision.
- Estados visibles originales: `Sin resultado guardado`, `Pendiente de guardado`, `Resultado guardado pendiente de revision`, `Resultado actualizado sin guardar` y `No apto para aprobacion`; desde USAB-NOM-09 el estado vigente de UI agrega `Listo para aprobar`.
- Usabilidad: la pantalla explica que hacer segun el caso: calcular, guardar resultado actualizado, revisar resultado guardado, recalcular o revisar base/movimientos/asignaciones.
- Evolucion: la accion deshabilitada `Solicitar aprobacion` fue reemplazada por `Aprobar resultado preliminar` en USAB-NOM-09.
- Fuera de alcance: no aprueba nomina, no cierra periodo, no emite liquidaciones oficiales, no genera Previred/LRE/banco, no cambia formulas legales, SQL/RLS, rutas ni permisos.
- Pruebas: `proceso-mensual-container.spec.ts`, `npx ng test --watch=false`, `npm run build`.

## USAB-NOM-07 - Guardado y versionado del resultado preliminar

Fecha: 2026-05-08

- Objetivo: formalizar el guardado operativo del resultado preliminar para RRHH, dejando claro cuando se puede guardar, que queda guardado y como se consulta el ultimo resultado.
- UI: `Resultado preliminar` ahora muestra estado de guardado (`Sin resultado`, `Resultado no guardado`, `Resultado guardado`, `Resultado actualizado sin guardar`, `No se pudo guardar`), razon visible cuando no se puede guardar y helper de alcance.
- Accion: `Guardar resultado preliminar` confirma antes de guardar e informa que no emite liquidaciones, no cierra el periodo y no genera archivos legales.
- Versionado: se muestra fecha de guardado, version del calculo e identificador tecnico disponible. No se inventa version numerica incremental; si existe `idCalculoPeriodo`, se muestra solo como referencia por identificador tecnico.
- Ultimo guardado: se muestra `Ultimo resultado preliminar guardado` con fecha, trabajadores calculados, observaciones, omitidos, liquido preliminar, version del calculo e identificador tecnico.
- Recalculo: si se calcula nuevamente despues de guardar, la UI indica `Resultado actualizado sin guardar` y permite conservar la nueva version preliminar.
- Persistencia real: se usa el soporte existente de snapshots preliminares; al guardar, el repositorio reemplaza el resultado activo del periodo marcando el anterior inactivo/anulado y vinculando el reemplazo.
- Fuera de alcance: no se toca SQL/RLS, formulas legales, motor legal, liquidaciones oficiales, cierre, Previred/LRE/banco, rutas publicas ni `package.json`.
- Pruebas: `proceso-mensual-container.spec.ts`, `npx ng test --watch=false --include='src/app/features/nomina-mensual/containers/proceso-mensual-container/proceso-mensual-container.spec.ts'`, `npm run build`.

## USAB-NOM-06 - Resultado preliminar revisable

Fecha: 2026-05-08

- `Resultado preliminar` pasa a ser una revision operativa del calculo: empty state, estado, resumen, trabajadores, observaciones del resultado, detalle tecnico secundario y acciones.
- La vista muestra trabajadores calculados, con observaciones y omitidos/no calculados cuando la informacion esta disponible.
- Los totales visibles usan datos ya existentes del resultado preliminar: total haberes, total descuentos y liquido preliminar; no se inventan montos no soportados.
- Las observaciones post-calculo se separan en bloqueos, advertencias e informacion, sin usar `Issues` como titulo visible.
- `Version del calculo`, `Identificador tecnico` y `Fecha de generacion` quedan como detalle secundario.
- Se fortalecen acciones operativas: recalcular preliminar, revisar base, revisar movimientos del mes, revisar asignaciones recurrentes y guardar resultado preliminar.
- El resultado preliminar no es liquidacion oficial, no cierra periodo y no genera Previred/LRE/banco.
- No se modifica SQL/RLS, formulas legales, motor legal, liquidaciones oficiales, snapshots oficiales ni `package.json`.

## USAB-NOM-05 - Validacion operativa antes de calculo preliminar

Fecha: 2026-05-08

- `Preparar nomina` agrega un semaforo visible `Estado para calculo preliminar` con estados `Pendiente de validar`, `Bloqueado`, `Con advertencias` y `Listo para calcular`.
- El boton `Calcular preliminar` queda gobernado por una validacion operativa local: periodo valido, base generada, trabajadores considerados, parametros minimos disponibles, sin bloqueos ni error activo.
- Si el calculo esta deshabilitado, la UI muestra una razon visible y bloqueos accionables con enlaces o acciones operativas.
- Las advertencias quedan separadas y no bloquean por defecto; ausencia de movimientos del mes o asignaciones recurrentes se informa como advertencia no bloqueante.
- Parametros minimos faltantes bloquean; parametros opcionales pendientes quedan como advertencia para cierre/reconciliacion.
- No se modifica SQL/RLS, formulas legales, motor legal, liquidaciones oficiales, snapshots oficiales, Previred/LRE, banco ni `package.json`.

## USAB-NOM-04 - Base de nomina trazable

Fecha: 2026-05-08

- `Base de nomina` muestra trazabilidad operativa antes del calculo preliminar: resumen, trabajadores incluidos, estados, entradas consideradas, parametros y acciones de revision.
- La vista lista trabajadores con nombre/RUT, contrato legible, estado operativo, asignaciones recurrentes, movimientos del mes y observaciones.
- `ProcesoMensualService` agrega metadata de trazabilidad para UI derivada de empleados y entradas mensuales ya existentes; no cambia formulas, motor legal, rutas publicas ni servicios publicos.
- Se evita exponer labels tecnicos visibles como `idPersona`, `idContrato`, `idConcepto`, `Payload`, `Hash`, `Issues` o `Pre-nomina`.
- No se modifica SQL/RLS, snapshots, liquidaciones oficiales, Previred/LRE, banco ni cierre de periodo.

## USAB-NOM-03 - Preparar nomina como dashboard operativo del periodo

Fecha: 2026-05-08

- `Preparar nomina` deja de presentarse como wizard de pasos futuros y queda organizado como dashboard operativo del periodo.
- Se agregan resumen operativo, siguiente accion recomendada, checklist por areas, bloqueos/advertencias, base de nomina, calculo preliminar y resultado preliminar guardado.
- Los estados de areas se muestran en lenguaje operativo (`Listo`, `Revisar`, `Pendiente de integracion`, `Sin evaluar`) y no como estados internos crudos.
- `Pre-nomina` queda como nombre interno; la UI visible usa `Base de nomina`.
- Se mantienen las acciones existentes: validar periodo, generar base, calcular preliminar, ver/guardar/reemplazar resultado preliminar.
- Las salidas legales y cierre quedan como aviso secundario; no se presentan como flujo activo.
- No se modifica SQL/RLS, formulas legales, motor legal, servicios publicos, rutas publicas, liquidaciones oficiales, Previred/LRE ni banco.

## USAB-NOM-02 - Usabilidad operativa en Movimientos del mes

Fecha: 2026-05-08

- `Movimientos del mes` deja de pedir IDs manuales visibles para trabajador, contrato y concepto.
- La captura usa `app-search-select` para trabajador (`Nombre · RUT`) y concepto (`Nombre (codigo)`), y carga contratos por trabajador con preseleccion cuando hay un unico contrato.
- La grilla muestra etiquetas operativas y fallback legible: `Trabajador sin ficha visible` / `Concepto no disponible`.
- Se limpia copy visible remanente de `novedad` hacia `movimiento` o `movimientos del mes`.
- `Preparar nomina` reemplaza copy tecnico menor: `Codigos`/`Issues` por `Observaciones`, `Version calculo` por `Version del calculo` y `Hash` por `Identificador tecnico`.
- Se mantienen nombres internos, rutas, modelos, servicios, tabla `novedad_remuneracion_periodo`, SQL/RLS, motor, snapshots y liquidaciones.

## USAB-NOM-01 - Alineacion de lenguaje visible y navegacion de Remuneraciones

Fecha: 2026-05-08

- Se alinea el lenguaje visible de Remuneraciones: `Proceso mensual` pasa a mostrarse como `Preparar nomina`, `Novedades mensuales` como `Movimientos del mes` y `Haberes y descuentos` como `Asignaciones recurrentes`.
- El menu de Remuneraciones inicia en `Preparar nomina` y `/remuneraciones` redirige a `/remuneraciones/proceso-mensual`.
- Se mantiene la compatibilidad interna: rutas, carpetas, servicios, modelos, tablas y nombres tecnicos no se renombran.
- Se registra que `Movimientos del mes` es el nombre visible UX del flujo tecnico/documental `Novedades mensuales` sobre `novedad_remuneracion_periodo`.
- No se modifica SQL/RLS, formulas legales, contrato del motor, snapshots, liquidaciones, Previred/LRE ni Python.

## MOTOR-04 - Contrato de entradas mensuales para el motor

Fecha: 2026-05-07

- Se agrega `EntradaMensualMotor` al contrato `MotorCalculoInput`.
- Se agrega mapper puro desde `EntradaMensualPeriodo` hacia entradas mensuales aptas para motor.
- Decision: Opcion A contrato preparatorio; el motor recibe `entradasMensuales`, pero no suma montos ni cambia bases, cotizaciones, impuesto unico ni resultados legales.
- Solo entran entradas aptas para pre-nomina: aprobadas y sin bloqueo critico; borrador, pendiente revision, observada, rechazada, anulada y legacy bloqueado quedan excluidas.
- Legacy validado sigue entrando solo como transicion cuando ya fue normalizado como aprobado por `EntradasMensualesPeriodoService`.
- No se genera liquidacion oficial, no se cierra periodo, no se modifica SQL/RLS, Python, Previred/LRE ni UI/rutas/sidebar.
- Pruebas: `proceso-mensual-motor-entradas.rules.spec.ts`, `proceso-mensual-motor.rules.spec.ts`, `proceso-mensual.service.spec.ts`, `npx ng test --watch=false`, `npm run build`.

## NOM-UX-01 - Consolidacion visual de Novedades mensuales

Fecha: 2026-05-07

- Novedades mensuales queda como opcion visible principal para cargar hechos del periodo desde el sidebar.
- Movimientos variables se retira del menu principal y queda accesible por ruta legacy `/remuneraciones/movimientos-variables` durante la transicion.
- Se ajusta el copy de Novedades mensuales para indicar que las novedades aprobadas forman parte de las entradas mensuales revisadas por Proceso mensual.
- No se borran rutas, modulo legacy, `MovimientosVariablesService`, tablas ni historia documental.
- No se modifica SQL, RLS, motor, formulas legales, liquidaciones, Previred/LRE ni Python.
- Pruebas: `npx ng test --watch=false`; `npm run build`.

## SEG-NOV-02 - RLS y permisos de novedades mensuales

Fecha: 2026-05-07

- Se agrega `bd/base/v11/partes/19_novedades_mensuales_rls.sql` para habilitar RLS en `novedad_remuneracion_periodo`.
- `authenticated` recibe `SELECT`, `INSERT` y `UPDATE`; `anon` no recibe permisos nuevos.
- No se habilita `DELETE` directo; el contrato funcional mantiene anulacion logica por estado.
- `run_all.sql` incluye la parte 19 despues de crear la tabla base de novedades.
- No se modifica estructura de tabla, datos, Angular funcional, UI, rutas, sidebar, motor, contrato de entrada del motor, formulas legales, liquidaciones, Previred/LRE ni Python.
- Validacion BD: aplicado contra la conexion `SUPABASE_DB_URL` del `.env`; RLS quedo habilitado, `policy_count=3`, `anon_select=false` y `authenticated_delete=false`.
- Pruebas: `npx ng test --watch=false`; `npm run build`.

## UNIF-NOM-03 - Proceso mensual con entradas canonicas

Fecha: 2026-05-07

- `ProcesoMensualService` consume `EntradasMensualesPeriodoService` para prevalidar entradas del periodo.
- Se elimina la dependencia directa de `MovimientosVariablesService` desde Proceso mensual; Movimientos variables sigue existiendo como fuente legacy dentro de la capa canonica.
- Se agregan resumen y conteos de entradas mensuales canonicas, incluyendo aptas para pre-nomina.
- Se mantienen alias legacy de movimientos variables para compatibilidad temporal.
- No se modifican estados fuente, motor, liquidaciones, cierre, Previred/LRE, Python, SQL, rutas, sidebar ni UI productiva.
- Pruebas: `npx ng test --watch=false`; `npm run build`.

## UNIF-NOM-02 - Entradas mensuales canonicas

Fecha: 2026-05-07

- Se agrega `src/app/features/nomina-mensual/entradas/` con modelo `EntradaMensualPeriodo`, mapper, rules y `EntradasMensualesPeriodoService`.
- La capa normaliza recurrentes, novedades mensuales canonicas y movimientos variables legacy sin cambiar datos ni estados fuente.
- Decision de transicion: `VALIDADO` legacy se normaliza como `aprobada`; `BLOQUEADO` legacy se normaliza como `legacy_bloqueado` y bloquea proceso.
- No se adapta `ProcesoMensualService`; esa integracion queda para UNIF-NOM-03.
- No se modifica motor, liquidaciones, Previred/LRE, Python, SQL, UI, rutas ni sidebar.
- Pruebas: `npx ng test --watch=false`; `npm run build`.

## SEG-NOMINA - RLS y permisos minimos de snapshots de nomina

Fecha: 2026-05-06

- Se agrega `bd/base/v11/partes/16_nomina_calculo_snapshot_rls.sql` con RLS minimo para snapshots de nomina.
- La parte 16 queda incluida en `bd/base/v11/run_all.sql` despues de `15_nomina_calculo_snapshot.sql`.
- Politicas: `SELECT`, `INSERT` y `UPDATE` solo para `authenticated` con `auth.role() = 'authenticated'`; no se habilita `DELETE`.
- Se aplica el SQL contra Supabase de desarrollo con `npx supabase db query --db-url ... --file bd/base/v11/partes/16_nomina_calculo_snapshot_rls.sql`.
- No se cierra periodo, no se genera liquidacion oficial, PDF, Previred, LRE ni contabilidad.
- Pendiente: validar guardado/reemplazo desde UI con sesion Supabase autenticada y trabajador sin bloqueos.

## MOTOR-03D - Validacion contra tablas existentes

Fecha: 2026-05-06

- Se ejecuto `npm run types:supabase` contra Supabase con las tablas de snapshot ya existentes.
- `database.types.ts` confirma `nomina_calculo_periodo`, `nomina_calculo_trabajador`, `nomina_calculo_concepto`, `nomina_calculo_issue` y `nomina_calculo_trazabilidad`.
- `NominaCalculoSnapshotRepository` se ajusta para usar tipos generados reales y deja de usar wrapper `any` para estas tablas.
- La prueba real de UI llega a prevalidacion, pre-nomina y calculo preliminar; el guardado queda bloqueado correctamente porque el trabajador disponible queda `con_bloqueos`.
- Una escritura tecnica controlada contra Supabase confirma RLS activa: `nomina_calculo_periodo` rechaza inserts con anon key.
- No se aplico SQL, no se crearon migraciones, no se modifico `bd/`, no se cerro periodo ni se genero PDF, Previred o LRE.
- Siguiente fase: SEG-NOMINA - RLS y permisos de snapshots de nomina.

## MOTOR-03C - Aplicacion controlada de migracion y validacion contra Supabase

Fecha: 2026-05-06

- Objetivo: validar la migracion local de snapshots preliminares de nomina mensual y documentar su aplicacion controlada contra Supabase local/remoto.
- SQL: se revisa `bd/base/v11/partes/15_nomina_calculo_snapshot.sql`, confirmando tablas, columnas, PK/FK, indices, unique parcial, `JSONB`, timestamps y TODO RLS.
- BD v11: `bd/base/v11/run_all.sql` incluye `partes/15_nomina_calculo_snapshot.sql`; `bd/base/v11/README.md` documenta aplicacion incremental.
- Ambiente: `psql` y Docker no estan disponibles; Supabase CLI existe via dependencia local, pero no se ejecuta `supabase db push`.
- Tipos Supabase: no se regenera `src/app/core/models/database.types.ts` porque la migracion no fue aplicada a un ambiente consultable; el repository mantiene capa local hasta aplicar SQL y regenerar tipos.
- Fuera de alcance: liquidacion oficial, cierre, PDF, Previred, LRE, contabilidad, RLS completa, Python, package changes, UI nueva y Supabase remoto sin proyecto de desarrollo confirmado.
- Pruebas: `npx ng test --watch=false`.
- Siguiente fase recomendada: SEG-NOMINA - RLS y permisos de snapshots de nomina.

## MOTOR-03B - Persistencia controlada de snapshots preliminares

Fecha: 2026-05-06

- Objetivo: guardar, consultar y reemplazar snapshots preliminares del calculo de nomina mensual sin convertirlos en liquidacion oficial.
- SQL local: se agrega `bd/base/v11/partes/15_nomina_calculo_snapshot.sql` con `nomina_calculo_periodo`, `nomina_calculo_trabajador`, `nomina_calculo_concepto`, `nomina_calculo_issue` y `nomina_calculo_trazabilidad`.
- Servicio: `ProcesoMensualService` expone guardar, consultar, listar, anular y recalcular/reemplazar snapshot preliminar mediante repository Supabase tipado localmente.
- Mapping: `proceso-mensual-snapshot.rules.ts` transforma `MotorCalculoPeriodoResultado` en payload persistible y calcula `hash_snapshot` deterministico simple.
- UI: Proceso mensual agrega acciones **Guardar snapshot preliminar**, **Ver snapshot activo** y **Recalcular y reemplazar**, con texto claro de que no cierra periodo ni genera liquidacion oficial.
- DB-01: no se usan como reales `empresa_mutual_config`, `afp_parametro`, `salud_vigencia`, `afc_vigencia`, `mutual_vigencia`, `asignacion_familiar_tramo`, `sis_parametro`, `sanna_parametro` ni `topes_imponibles`.
- Fuera de alcance: aplicacion remota de migracion, RLS detallado, cierre, liquidacion oficial, PDF, Previred, LRE, contabilidad, Python, package changes y Supabase remoto.
- Pruebas: `npx ng test --watch=false`.
- Siguiente fase recomendada: MOTOR-03C - Aplicacion controlada de migracion y validacion contra Supabase local/remoto.

## MOTOR-03A - Contrato de persistencia y snapshot de calculo

Fecha: 2026-05-06

- Objetivo: disenar como se guardaran resultados preliminares del motor antes de crear tablas, migraciones o servicios de escritura.
- Alcance: contrato documental de snapshot preliminar, estados, tablas candidatas, reglas de reemplazo/recalculo, `version_motor`, `hash_snapshot`, issues y trazabilidad persistida.
- Relacion operacional: el snapshot preliminar no es liquidacion oficial, no cierra periodo y puede reemplazarse por un nuevo calculo si el periodo no esta cerrado.
- Tablas propuestas solo como diseno: `nomina_calculo_periodo`, `nomina_calculo_trabajador`, `nomina_calculo_concepto`, `nomina_calculo_issue` y `nomina_calculo_trazabilidad`.
- DB-01: se mantienen como fuentes canonicas las tablas confirmadas y no se usan como reales nombres prohibidos ni tablas no existentes.
- Fuera de alcance: SQL, migraciones, RLS, escritura en Supabase, cambios TypeScript funcionales, servicios, UI, Python, package changes, cierre, liquidacion oficial, PDF, Previred, LRE, contabilidad y rectificaciones.
- Pruebas: validacion documental; no se ejecutan tests de codigo porque no se modifica `src/`.
- Siguiente fase recomendada: MOTOR-03B - Implementacion de persistencia controlada de snapshots preliminares.

## MOTOR-02 - Gratificacion, impuesto unico y reglas legales avanzadas

Fecha: 2026-05-05

- Objetivo: fortalecer el calculo preliminar sin convertirlo en liquidacion oficial ni cerrar periodo.
- Alcance: gratificacion art. 50 solo con configuracion suficiente, impuesto unico con `tabla_impuesto_unico`, topes desde `parametros_generales`, asignacion familiar simple con `tramo_carga`, jornada/IMM, issues y trazabilidad normativa.
- DB-01: no se usan como reales `empresa_mutual_config`, `afp_parametro`, `salud_vigencia`, `afc_vigencia`, `mutual_vigencia`, `asignacion_familiar_tramo`, `sis_parametro`, `sanna_parametro` ni `topes_imponibles`.
- UI: tabla de calculo preliminar agrega columnas de gratificacion e impuesto unico, sin redisenar la pantalla.
- Fuera de alcance: persistencia, snapshots definitivos, cierre, liquidacion oficial, PDF, Previred, LRE, contabilidad, 30% de utilidades, reliquidacion anual, SQL, migraciones, Python, package changes y Supabase remoto.
- Pruebas: `npx ng test --watch=false` en verde (27 archivos, 255 tests).
- Siguiente fase recomendada: MOTOR-03 - Persistencia controlada de resultados preliminares y snapshot de calculo.

## MOTOR-01 - Implementacion inicial del motor de calculo base

Fecha: 2026-05-05

- Objetivo: generar un calculo preliminar por trabajador desde pre-nomina 9.5C validada, sin cerrar periodo ni emitir liquidaciones oficiales.
- Alcance: modelos TypeScript del motor, regla pura `proceso-mensual-motor.rules.ts`, servicio en memoria y UI minima en `/remuneraciones/proceso-mensual`.
- Calculos: sueldo base, haberes recurrentes imponibles/no imponibles, base imponible previsional, base tributable, AFP, salud, AFC, SIS, SANNA, Ley 16.744, impuesto unico preliminar, descuentos trabajador y liquido preliminar.
- Trazabilidad: parametros, formulas, tablas canonicas, valores de entrada y resultados por calculo relevante.
- DB-01: se respetan tablas canonicas; no se usan como reales `empresa_mutual_config`, `afp_parametro`, `salud_vigencia`, `afc_vigencia`, `mutual_vigencia`, `asignacion_familiar_tramo`, `sis_parametro`, `sanna_parametro` ni `topes_imponibles`.
- Fuera de alcance: SQL, migraciones, Python, Supabase remoto, snapshots definitivos, cierre de periodo, PDF, Previred, LRE, contabilidad, gratificacion automatica compleja e impuesto unico avanzado.
- Pruebas: `npx ng test --watch=false` en verde (27 archivos, 239 tests).
- Siguiente fase recomendada: MOTOR-02 - Gratificacion, impuesto unico y reglas legales avanzadas.

## MOTOR-00 - Contrato del motor de calculo

Fecha: 2026-05-05

- Objetivo: dejar definido el contrato tecnico, funcional y normativo del futuro motor antes de implementar montos reales.
- Alcance: documentacion de entradas, salidas, orden de operaciones, reglas normativas iniciales, bloqueos previos, trazabilidad y casos de prueba.
- Fuera de alcance: implementacion TypeScript del motor, SQL, migraciones, Supabase remoto, Python, Previred, LRE, PDF, cierre de periodo y contabilidad.
- Entradas: `MotorCalculoInput` alimentado desde pre-nomina 9.5C, parametros legales, contratos, haberes/descuentos, movimientos variables y tablas canonicas DB-01.
- Salidas: `LiquidacionCalculada` conceptual con haberes, descuentos, bases, cotizaciones, impuesto, liquido, issues y trazabilidad.
- Siguiente fase recomendada: MOTOR-01 - Implementacion inicial del motor de calculo base.

## Fase 9.5C - Pre-nomina funcional por periodo

Fecha: 2026-05-05

- Se agrego regla pura para construir una pre-nomina funcional desde la prevalidacion mensual.
- Se extendio `ProcesoMensualService` con generacion de pre-nomina por periodo, sin persistencia ni calculo de montos.
- Se agrego UI en Proceso mensual para generar y visualizar conteos de pre-nomina.
- Se documenta que la fase no incluye motor, liquidaciones, Previred, LRE, SQL, Python, migraciones ni Supabase remoto.

## DB-01B - Auditoria final posterior a DB-01

Fecha: 2026-05-05

- Se auditaron referencias no canonicas posteriores a DB-01; quedan solo como "No usar", "No existe" o correccion historica.
- Se confirmaron referencias canonicas a `empresa_ley_16744`, `parametros_generales.sis`, `afp_vigencia.sis` y `parametros_generales.sanna`.
- `docs.zip` queda fuera de DB-01B; si estaba modificado, se restauro y su eliminacion o respaldo queda como decision futura.
- No se modifico codigo Angular, SQL, Python, migraciones, `.cursor`, `package.json`, `package-lock.json` ni Supabase remoto.

## DB-01 - Confirmar tablas canonicas contra Supabase/PostgreSQL

Fecha: 2026-05-05

- Validacion ejecutada contra tipos remotos de Supabase generados con `npx supabase gen types typescript --project-id ...`.
- Se confirmaron las tablas canonicas principales del diccionario.
- Se corrigio `empresa_mutual_config` por `empresa_ley_16744`.
- Se confirmo que no existen tablas separadas `sis_parametro`, `sanna_parametro` ni `topes_imponibles`.
- Se confirmo que no existen nombres alternativos `afp_parametro`, `salud_vigencia`, `afc_vigencia`, `mutual_vigencia` ni `asignacion_familiar_tramo`.
- SIS queda asociado a `parametros_generales.sis` y `afp_vigencia.sis`, siempre sujeto a fuente oficial mensual.
- SANNA queda asociado a `parametros_generales.sanna`.
- No se modifico codigo Angular, SQL, Python, migraciones ni Supabase remoto.

## DOC-04 - Integracion de documentacion nueva al repo real

Fecha: 2026-05-05

- Archivos agregados: contrato y criterios globales, glosario, inconsistencias, normativa, LRE, prevalidaciones raiz, plan de pruebas, tests documentales y diccionario de tablas canonicas.
- Archivos fusionados: `AGENTS.md`, `README.md`, orquestador, matriz normativa, integracion de parametros legales, pruebas y changelog.
- Wrappers mantenidos: stubs historicos en `temas/`; wrappers nuevos para duplicados de estilos y guias UI.
- Referencias normalizadas: la raiz oficial queda en `docs/codex`; la fuente local no debe referenciarse en la documentacion final.
- Tablas canonicas: se agrego `orquestador/diccionario-tablas-canonicas.md` y regla obligatoria de consulta previa.
- SIS: queda documentado como tasa mensual dependiente de fuente oficial; no se hardcodea y bloquea nomina si falta confirmacion.
- LRE: queda documentado como modulo operativo futuro, sin implementacion de codigo.
- Documentos pendientes: validar nombres fisicos de tablas contra Supabase/PostgreSQL.
- Advertencia: no cerrar fases funcionales como implementadas cuando solo fueron documentadas.
- Siguiente paso recomendado: DB-01 - Confirmar tablas canonicas contra Supabase/PostgreSQL.

Registro de cambios aplicados a la base documental del ERP de remuneraciones.  Cada entrada debe incluir una fecha y describir de forma concisa las modificaciones realizadas.  Los cambios que afectan contratos funcionales, glosarios o flujos deben acompañarse de una referencia al documento correspondiente.

## 2026-05-05 - Versión final consolidada

- **Adición de glosario y nomenclatura:** se añadió `glosario.md` para unificar la definición de términos como `PERIODO_MENSUAL`, `VIGENCIA`, `CATALOGO_GLOBAL`, `ANUAL`, `CONFIG_EMPRESA`, así como los estados de períodos de remuneración y empleados.  Este archivo surge ante la necesidad de evitar ambigüedades y duplicación de definiciones dispersas en múltiples documentos.
- **Registro de inconsistencias:** se creó `inconsistencias.md` para documentar contradicciones detectadas entre fuentes originales: uso híbrido de `trabajo_pesado_parametro`, clasificación de `tabla_impuesto_unico`, falta de exposición de `afp_vigencia`, estados `BORRADOR` en diferentes dominios, entre otros.  Este registro permite priorizar decisiones futuras.
- **Plan de pruebas consolidado:** se añadió `plan-pruebas.md` para centralizar las pruebas existentes y proponer una expansión.  El plan agrupa pruebas unitarias, de integración y E2E por módulo y resalta brechas actuales.
- **Changelog formalizado:** se incorporó este propio `CHANGELOG.md` como mecanismo transparente de trazabilidad de cambios en la documentación.
- **Actualización de `README.md`:** se actualizó el índice general para incluir las nuevas secciones (`glosario.md`, `inconsistencias.md`, `plan-pruebas.md`, `CHANGELOG.md`) y se reforzó la jerarquía de lectura.
- **Actualización del mapa de documentación:** `orquestador/mapa-documentacion.md` se modificó para listar los nuevos archivos y describir su propósito.
- **Homologación de estilo ASCII:** se revisaron archivos para eliminar acentos innecesarios y mantener una codificación ASCII en títulos, tablas y rutas.  Se dejaron tildes únicamente en explicaciones donde la claridad lo exigía.
- **Notas de UI sincronizadas:** se aclaró en varios contratos que las explicaciones mensuales/vigencias se desplazan a la banda superior de las pantallas, limpiando tabs y copy repetitivo (alineado al ajuste del 2026-05-01 en Parametros).
- **Enlaces cruzados:** se agregaron referencias al glosario y al registro de inconsistencias en contratos generales y guías relevantes, mejorando la navegabilidad.

## 2026-05-02 - Versión base inicial

- Se creó la primera versión de la base documental reorganizada a partir de las fuentes originales (`docs.zip`).  Se definió la estructura de carpetas (`codex/`, `modulos/`, `temas/`, `orquestador/`) y se redactaron archivos resumidos por módulo: empleados, parámetros, conceptos de remuneración, haberes y descuentos, nómina mensual.  Se añadieron guías de UI y estilos y un índice general (`README.md`).  Se generó un `mapa-documentacion.md` para describir cada archivo.

Entradas anteriores se encuentran en resúmenes del memento; esta changelog las formaliza en la base documental para futuras referencias.

<!-- ARQ-ERP-01-INTEGRACION -->

## 2026-05-07 - ARQ-ERP-01 / UNIF-NOM-01 integracion documental

- Se agrega `orquestador/estructura-canonica-erp.md`.
- Se agrega `orquestador/plan-transicion-novedades-movimientos.md`.
- Se agrega `modulos/nomina-mensual/benchmark-novedades-pre-nomina.md`.
- Se agrega `orquestador/integracion-documental-2026-05-07.md`.
- Decision: Novedades mensuales queda como flujo funcional canonico y Movimientos variables como legacy/transicion.
- Decision: `novedad_remuneracion_periodo` queda como tabla canonica futura para hechos del periodo y `movimiento_variable_mensual` como tabla legacy/transicion.
- No se borra documentacion historica; se agregan notas de integracion y referencias cruzadas.
- Ajuste de validacion: roadmap y tablero dejan de empujar mejoras nuevas sobre Movimientos variables y priorizan `EntradasMensualesPeriodoService`.
