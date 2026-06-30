# Módulo Nómina mensual — punto de entrada

> **Decisión rectora vigente (2026-06-11 — `NOM-ADMIN-GENERADOR-OPERATIVO-100`)**:
> el único flujo visible es **Administrador + Generador**. El plan detallado para
> completar creación, cálculo, consolidación, validación, liquidaciones internas,
> cierre y rectificación vive en
> [`roadmap-admin-generador-operativo-100.md`](./roadmap-admin-generador-operativo-100.md).
> La arquitectura de origen se conserva en
> [`arquitectura-administrador-generador.md`](./arquitectura-administrador-generador.md).

## Estructura de la documentación

> **Rotación 2026-06-03 (DOCS-AUDIT-02 / L5)**: los 69 archivos sueltos que vivían bajo `nomina-mensual/` se reorganizaron en subcarpetas por tema. Los basename se mantienen iguales (solo cambia su carpeta padre). Los enlaces internos y externos del repo se actualizaron automáticamente.

| Subcarpeta | Contenido | Archivos |
|------------|-----------|---------:|
| [`motor-calculo/`](./motor-calculo/) | Contrato del motor, casos de prueba, persistencia 03A/B/C, integraciones haberes/parámetros | 12 |
| [`modales-periodo/`](./modales-periodo/) | Matriz de modales y overlays del período (revisión, incidencias, copy, polish) | 10 |
| [`flow/`](./flow/) | Flujo, navegación, persistencia/integridad de estado, container/facade | 18 |
| [`workspace/`](./workspace/) | Workspace operativo, preparar nómina (acta), revisión por trabajador, masivos | 11 |
| [`prevalidaciones/`](./prevalidaciones/) | Prevalidaciones 9.5A/B/C + novedades mensuales | 5 |
| [`vision/`](./vision/) | Visión futura, fases/casos de uso, Figma, arquitectura funcional | 6 |
| [`v2/`](./v2/) | V10/V10.2/V11 (preparaciones por lotes, trazabilidad V10) | 4 |
| [`auditorias/`](./auditorias/) | Auditoría V2 (NOIA), cleanup, cierre mensual post-reset | 3 |
| [`preparar-nomina/`](./preparar-nomina/) | Preparar nómina (V1) — flujo operativo, mapa de pantalla, arquitectura | 6 |

### En la raíz del módulo

- [`README.md`](./README.md) — este archivo (índice + bitácora histórica de H2 por ID).
- [`contrato-general.md`](./contrato-general.md) — contrato funcional canónico del módulo.
- [`matriz-bloqueos-periodo.md`](./matriz-bloqueos-periodo.md) — matriz transversal de bloqueos por período.
- [`arquitectura-administrador-generador.md`](./arquitectura-administrador-generador.md) — arquitectura base del Administrador y Generador.
- [`roadmap-admin-generador-operativo-100.md`](./roadmap-admin-generador-operativo-100.md) — hoja de ruta vigente, dividida en 25 fases ejecutables (F01–F21 más F15b y F18a/b/c/d). Versión documental v2 (refactor 2026-06-11).
- [`plan-ejecucion-fases-vigente.md`](./plan-ejecucion-fases-vigente.md) — **plan de olas 0–7** post REPAIR (SEG-01 + F06–F21 + pista global). Actualizar al cerrar cada ola.

### Segregación V1 / V2

- **Flujo histórico** = la antigua UI `/remuneraciones/proceso-mensual`, retirada
  del menú y redirigida al Administrador. Sus documentos se conservan como
  historia y como referencia del motor compartido que aún debe desacoplarse.
- **Flujo canónico** = `/remuneraciones/nominas` y
  `/remuneraciones/nominas/:nominaPeriodoId/generador`, con seis pasos. El
  roadmap operativo vigente es
  [`roadmap-admin-generador-operativo-100.md`](./roadmap-admin-generador-operativo-100.md).

## Estado

## NOM-MENSUAL-FLOW-UNIFICADO-03 — Epic UI cerrado (5.C BD con gate)

Epic flujo unificado: dispatcher al 100% (siguiente código). Fases 2–5 en documentos separados para revisión posterior.

| Doc | Contenido |
|-----|-----------|
| [`nom-mensual-flow-unificado-03.md`](./flow/nom-mensual-flow-unificado-03.md) | Índice, hecho, **Fase 1 implementada** |
| [`nom-mensual-flow-unificado-03-fase-02-deep-links.md`](./flow/nom-mensual-flow-unificado-03-fase-02-deep-links.md) | `idPersona` en query + Novedades |
| [`nom-mensual-flow-unificado-03-fase-03-panel-modales.md`](./flow/nom-mensual-flow-unificado-03-fase-03-panel-modales.md) | Modal movimientos local, incidencias, filtros |
| [`nom-mensual-flow-unificado-03-fase-04-modal-global.md`](./flow/nom-mensual-flow-unificado-03-fase-04-modal-global.md) | Modal global excepcional |
| [`nom-mensual-flow-unificado-03-fase-05-calidad-productivo.md`](./flow/nom-mensual-flow-unificado-03-fase-05-calidad-productivo.md) | TS audit, E2E, confirmación BD (gate) |

## NOM-MENSUAL-FLUJOS-ACTUALES-FUTUROS-01 aplicado

Diagnostico y alineacion de copy entre Nomina mensual y Liquidaciones oficiales.

Regla rectora:

```txt
Nomina mensual confirmada = fuente oficial para generar liquidaciones.
```

Flujo visible:

```txt
Verificar periodo
-> Generar nomina
-> Revisar trabajadores
-> Confirmar nomina
-> Generar liquidaciones
-> Ver liquidaciones
```

Diagnostico:

- `/remuneraciones/proceso-mensual` ya funciona como workspace de Nomina mensual: bitacora, revision por trabajador, confirmacion y acceso a liquidaciones.
- `/remuneraciones/liquidaciones` ya genera y permite revisar liquidaciones oficiales internas desde una nómina mensual confirmada.
- La brecha principal era de lenguaje residual: `Liquidaciones futuras`, `Preparar nomina`, `Proceso mensual`, `cierre operativo` y terminos tecnicos como `snapshot` podian competir con el flujo RRHH.
- La ruta, los nombres internos y los conceptos tecnicos siguen por compatibilidad, pero no deben dominar el copy principal.

Cambios aplicados: Liquidaciones oficiales ya no debe describirse como fase futura en la prevalidacion. Es una salida interna disponible desde nómina mensual confirmada. Los CTA operativos de salida se normalizan hacia `Confirmar nomina`. `Registrar revision RRHH` queda absorbido como parte de la confirmacion visible.

## NOMINA V10.2 — Alcance y trabajadores como preparación conceptual

Documento de planificación funcional para ordenar Alcance y Trabajadores como un mismo universo conceptual de nómina mensual, sin persistencia nueva ni cambio de lenguaje visible NOIA. Mantiene `Nómina mensual` como concepto principal para RRHH y deja preparaciones/lotes persistidos para V11/backend. Documento: [`nomina-v10-2-alcance-trabajadores-preparacion-conceptual.md`](./v2/nomina-v10-2-alcance-trabajadores-preparacion-conceptual.md).

## NOMINA V11 — Contrato funcional preparaciones/lotes por tipo

Contrato funcional futuro para backend completo: define objetivo, creación, datos requeridos, alcance, cálculo, relación con nómina previa, bloqueos, disponibilidad inicial y liquidación esperada para `mensualCompleta`, `porCentroCosto`, `seleccionManual`, `complementaria`, `reproceso`, `retroactiva`, `finiquito` y `especial`. Mantiene V10.2 acotado a UI/concepto y deja preparaciones/lotes persistidos para V11. Documento: [`nomina-v11-contrato-funcional-preparaciones-lotes-por-tipo.md`](./v2/nomina-v11-contrato-funcional-preparaciones-lotes-por-tipo.md).

## NOMINA V11 — Backend preparaciones/lotes

Plan técnico V11 para derivar el contrato funcional a schema/RPC/repositorios/UI: `nomina_preparacion -> nomina_calculo_periodo -> nomina_liquidacion_periodo`, fases 30-33, FK tardías, compatibilidad legacy solo de lectura, enlace con cálculo/liquidaciones, contratos frontend, UI V2 y validaciones. Documento: [`nomina-v11-backend-preparaciones-lotes.md`](./v2/nomina-v11-backend-preparaciones-lotes.md).

## NOM-MENSUAL-FLOW-NAV-02 aplicado

Cierre del flujo RRHH: acciones en grillas Detalle mensual, preselección de trabajador, rehidratación al volver con `returnTo`, matriz única de destino workspace y modal reducido (resumen/resultado). Documento: [`nom-mensual-flow-nav-02.md`](./flow/nom-mensual-flow-nav-02.md). Precede: [`nom-mensual-flow-nav-01.md`](./flow/nom-mensual-flow-nav-01.md).

## NOM-MENSUAL-FLOW-NAV-01 aplicado

Panel Detalle mensual canónico, estado RRHH en sidebar, deep links con período y segment nav en modal. Documento: [`nom-mensual-flow-nav-01.md`](./flow/nom-mensual-flow-nav-01.md).

## NOM-MENSUAL-DETALLE-MENSUAL-UNIFICADO-01 aplicado

Workspace con tabbar **Detalle mensual | Historial**, parámetros en franja lateral, movimientos y recurrentes en una tabla con **Origen / duración**, filtros internos compactos e historial como trazabilidad. Cubre parcialmente la intención documental de `NOM-MOVIMIENTOS-UNIFICADOS-UX-01` en consola de período. Documento: [`nom-mensual-detalle-mensual-unificado-01.md`](./workspace/nom-mensual-detalle-mensual-unificado-01.md).

## NOM-MENSUAL-PERSISTENCIA-ESTADO-01 aplicado

Borrador al generar nómina persiste trabajadores, issues y metadata de verificación. Rehidratación al recargar alimenta workspace y revisión completa. Documento: [`nom-mensual-persistencia-estado-01.md`](./flow/nom-mensual-persistencia-estado-01.md).

## NOM-FLOW-REVISION-01 aplicado

Flujo RRHH: «Verificar período» antes de «Generar nómina». Bitácora en sidebar. Guardado técnico del borrador en acciones `<details>`. Diagnóstico persistido en BD. Documentos: [`nom-workspace-loc-maquetacion-01.md`](./workspace/nom-workspace-loc-maquetacion-01.md), [`nom-periodo-diagnostico-persist-01.md`](./flow/nom-periodo-diagnostico-persist-01.md).

## NOM-WORKSPACE-LOC-MAQUETACION-01 aplicado

Consola con **sidebar operativo** (franja KPI, bitácora, revisión, guía) y **6 tabs** en panel derecho (sin tab Resumen). Orden único Param → Trab → Mov → Rec. Documento: [`nom-workspace-loc-maquetacion-01.md`](./workspace/nom-workspace-loc-maquetacion-01.md).

## NOM-PREVALIDACION-PARAMETROS-CTA-01 aplicado

Fix rules: CTA «Revisar parámetros» solo si `!parametrosOperativos`. Prioridad a trabajadores cuando el período ya está operativo. Sin BD ni localStorage.

## NOM-PARAMETROS-REFRESH-01 aplicado

Click en tile **Parámetros** (franja lateral) consulta async solo `ParametrosGeneralesService`, merge en store sin resetear borrador/snapshot, modal informativo con grupos mínimos y aviso si el estado regresó con nómina ya generada. Retorno desde `/parametros` dispara refresh silencioso. Rules: `proceso-mensual-parametros-refresh.rules.ts`. Servicio: `consultarEstadoParametrosPeriodo`.

## NOM-PERIODO-VERIFICAR-MODAL-02 aplicado

Modal automático tras verificar el período (MessageBox): críticos, advertencias o período listo con CTA «Generar nómina». Documento: [`nom-periodo-diagnostico-persist-01.md`](./flow/nom-periodo-diagnostico-persist-01.md).

## NOM-PERIODO-TRABAJADORES-NO-APTOS-01 aplicado

Tras verificar, el payload persistido incluye `trabajadoresPendientesRevision` (nombre, RUT, motivo RRHH). Modal prioriza «Revisar fichas». Pestaña Trabajadores muestra grilla pre-borrador con «Abrir ficha» (`/empleados/:id` + retorno al período). Sin segundo listado de empleados en servicio.

## NOM-PERIODO-PREVIEW-PERSIST-01 aplicado

Preview persistente «Qué falta ahora» en sidebar y tab Trabajadores antes de generar nómina. Resumen masivo desde filas mergeadas. Documento: [`nom-periodo-preview-persist-01.md`](./flow/nom-periodo-preview-persist-01.md).

## NOM-PERIODO-DIAGNOSTICO-PERSIST-01 aplicado

Verificación del período con diagnóstico **persistente en servidor** (`nomina_periodo_diagnostico` + RPC). Rehidratación al volver sin snapshot. Documento: [`nom-periodo-diagnostico-persist-01.md`](./flow/nom-periodo-diagnostico-persist-01.md).

## NOM-MENSUAL-MASIVO-LAYOUT-01 aplicado

Tab `Trabajadores` del modal de revision preparado para nomina masiva: resumen agregado, filtros compactos, busqueda, DataGrid paginado y detalle unico bajo demanda. Mantiene `incidenciasPeriodo()` como fuente unica. Las incidencias globales permanecen en Resumen y no se duplican por trabajador. Documento: [`nom-mensual-masivo-layout-01.md`](./workspace/nom-mensual-masivo-layout-01.md).

## Handoff Figma — maquetación nómina mensual

Documento para recrear la consola en Figma (tokens, medidas, estados, modal): [`nomina-mensual-figma-maquetacion.md`](./vision/nomina-mensual-figma-maquetacion.md).

## NOM-MENSUAL-REAPERTURA-ELIMINACION-01 aplicado

Acciones controladas para abrir o descartar la nómina generada cuando no hay liquidaciones. Bloqueo RRHH con copy claro si hay liquidaciones. Forzar apertura/eliminación solo admin en ambiente no productivo. Documento: [`nom-mensual-reapertura-eliminacion-01.md`](./flow/nom-mensual-reapertura-eliminacion-01.md).

## NOM-MODALES-PERIODO-REVISION-COPY-03 aplicado

Modal de revision con copy RRHH: claves tecnicas humanizadas antes del DOM visible, resumen coherente con bloqueos globales, parametros con accion agrupada y lectura operativa de movimientos/recurrentes. Documento: [`nom-modales-periodo-revision-copy-03.md`](./modales-periodo/nom-modales-periodo-revision-copy-03.md).

## NOM-MODALES-PERIODO-COPY-LIMPIO-05 aplicado

Modal de revisión con copy normalizado en rules (`limpiarCopyTecnicoNomina`): sin claves técnicas, snake_case ni signos accidentales en listas visibles. `humanizarDetalleRevisionTexto` delega al helper único. Documento: [`nom-modales-periodo-copy-limpio-05.md`](./modales-periodo/nom-modales-periodo-copy-limpio-05.md).

## NOM-MODALES-PERIODO-INCIDENCIAS-QA-05 aplicado

Candado QA post-INCIDENCIAS-04: tests de regresión en rules/component (dedupe, indicadores, expediente, seguimiento, orden severidad, copy) y checklist manual del modal en doc de fase. Documento: [`nom-modales-periodo-revision-incidencias-qa-05.md`](./modales-periodo/nom-modales-periodo-revision-incidencias-qa-05.md).

## NOM-MODALES-PERIODO-INCIDENCIAS-04 aplicado

Modal de revision con registro unico de incidencias: `buildIncidenciasPeriodo`, Resumen «Pendientes del periodo», tabs con enlace «Ver en resumen (N)» sin repetir listas paralelas. Conteos desde fuente deduplicada. Documento: [`nom-modales-periodo-revision-incidencias-04.md`](./modales-periodo/nom-modales-periodo-revision-incidencias-04.md).

## NOM-MODALES-PERIODO-REVISION-IA-02 aplicado

Modal de revision reordenado por arquitectura de informacion: expediente oficial y CTA solo en Resumen. Observaciones unificadas sin DataGrid. Tabs de trabajadores, parametros, movimientos/recurrentes y resultado con lead local, lista, grid o empty segun datos. Documento: [`nom-modales-periodo-revision-ia-02.md`](./modales-periodo/nom-modales-periodo-revision-ia-02.md).

## NOM-MODALES-PERIODO-REVISION-UX-01 aplicado

Modal de revisión con pestañas que señalan pendientes, grillas por área (movimientos, recurrentes, resultado, observaciones), CTA del expediente en franja interna y enlace «Ver revisión completa» contextual. Documento: [`nom-modales-periodo-revision-ux-01.md`](./modales-periodo/nom-modales-periodo-revision-ux-01.md).

## NOM-MENSUAL-FACADE-SLIM-01 aplicado

Refactor interno del facade de presentación: view models pesados en `rules/` (`resultado-preliminar`, `revision-aprobacion`, `payroll-seguimiento`) y labels en `utils/proceso-mensual-presentacion.labels.ts`. Sin cambio de copy, HTML, CSS ni contratos de store/servicios. Documento: [`nom-mensual-facade-slim-01.md`](./flow/nom-mensual-facade-slim-01.md).

## NOM-MENSUAL-INTEGRIDAD-REGISTRO-01 aplicado

Expediente del período consultable desde BD: view model `expedienteNominaPeriodo`, carga al abrir revisión, modal y tab Detalle con estados explícitos (cargando / error / sin detalle / versión guardada o confirmada). Sin cambio SQL en esta fase. Documento: [`nom-mensual-integridad-registro-01.md`](./flow/nom-mensual-integridad-registro-01.md).

## NOM-MODALES-PERIODO-DETALLE-POLISH-01 aplicado

Modal de revisión (`app-proceso-mensual-detalle-modal`): footer sin duplicar CTA del workspace, copy operativo, CSS local y sin bloque técnico visible. Documento: [`nom-modales-periodo-detalle-polish-01.md`](./modales-periodo/nom-modales-periodo-detalle-polish-01.md).

## NOM-CONTAINER-SPEC-REPARO aplicado

Specs de integración del contenedor alineados al shell modular (workspace + overlays): sin `describe.skip` legacy. Helpers `proceso-mensual-container.spec.helpers.ts`. Cobertura equivalente vía rules existentes + ~31 tests container. Documento: [`nom-mensual-container-spec-reparo-01.md`](./flow/nom-mensual-container-spec-reparo-01.md).

## NOM-MENSUAL-PERSISTENCIA-ESTADO-01 aplicado

Al entrar o cambiar de período, si existe versión revisable activa en BD, el store rehidrata cabecera y detalle sin vaciar el snapshot antes del fetch. La facade infiere prevalidación, base y cálculo desde el snapshot para bitácora, franja y estado operativo. Sin guardar versión revisable, la pantalla sigue en «Generar nómina». Documento: [`nom-mensual-persistencia-estado-01.md`](./flow/nom-mensual-persistencia-estado-01.md).

## NOM-MENSUAL-WORKSPACE-UI-01 aplicado

La pantalla principal se orienta como **Nomina mensual** y workspace operativo de RRHH. El flujo visible prioriza:

```txt
Verificar periodo
-> Generar nómina
-> Revisar trabajadores
-> Confirmar nomina
-> Generar liquidaciones
```

La UI refuerza que la nómina mensual confirmada es la base oficial para liquidaciones. El CTA visible de salida es unico: `Confirmar nomina`. Guardado, revision interna y cierre quedan como pasos tecnicos de soporte. Documento: [`../../diseno/nom-mensual-workspace-ui-01.md`](../../diseno/nom-mensual-workspace-ui-01.md).

## NOM-MENSUAL-CONFIRMACION-FLOW-00 aplicado

Se documenta la decision rectora del modulo:

```txt
Nómina mensual confirmada = fuente oficial para generar liquidaciones.
```

La experiencia futura debe entenderse como `Nómina mensual`: generar nómina, revisar trabajadores, confirmar la versión oficial y generar liquidaciones desde esa versión. `Preparar nómina` puede seguir existiendo como ruta/componente por compatibilidad, pero deja de ser el concepto principal de producto para nuevas fases. Documento rector: [`nomina-mensual-confirmacion-flow.md`](./flow/nomina-mensual-confirmacion-flow.md).

**Prevalidaciones 9.5A + 9.5B** implementadas y conectadas al flujo de nomina mensual: recurrentes por mes, grupos minimos de parametros + catalogos, resumen en UI, reglas estrictas de trabajadores listos para nomina y bloqueos criticos antes de confirmar. Vision de producto: [`vision-futura.md`](./vision/vision-futura.md). Orquestador: [`../../orquestador/estado-fases.md`](../../orquestador/estado-fases.md).

## REM-MOV-UNIFY-01 aplicado

El nombre visible oficial del flujo de hechos puntuales del periodo es **Movimientos del mes**. La ruta canonica visible se mantiene en `/remuneraciones/novedades-mensuales` por compatibilidad tecnica, pero RRHH no debe ver `Novedades mensuales`, `Movimientos variables` ni `Entradas mensuales` como nombres equivalentes del flujo.

La pantalla usa `PeriodoActivoService.periodoYm()` como fuente unica, muestra resumen por estado, formulario guiado y listado operativo. Los movimientos aprobados del periodo son los que se consideran al preparar nomina. Borradores y pendientes quedan fuera hasta su aprobacion.

## REM-MOV-MODAL-01 aplicado

La accion **Registrar movimiento** abre un modal grande responsive dentro de `Movimientos del mes`. El periodo activo global se muestra solo como contexto del registro y no puede editarse desde el modal.

El modal mantiene header y footer estables, scroll interno para el formulario, accion primaria unica **Guardar movimiento** y accion secundaria **Cancelar**. Cancelar descarta directo si no hay cambios. Con cambios sin guardar solicita confirmacion con el patron `app-message-box`.

## NOM-MOVIMIENTOS-MODAL-MENSUAL-UX-01 aplicado

El modal visible se titula **Registrar movimiento del mes** y queda enfocado solo en movimientos puntuales del periodo activo. No contiene duracion, recurrentes ni cuotas. Las cuotas pertenecen al flujo recurrente de Haberes y descuentos.

La estructura queda compacta y vertical: bloque Movimiento, Detalle administrativo opcional y Resumen inferior antes del footer.

## NOM-MENSUAL-WORKSPACE-LAYOUT-POLISH-01 aplicado

Pulido de maquetación del workspace (franja, rail, focus, tabs, responsive). Documento: [`nom-mensual-workspace-layout-polish-01.md`](./workspace/nom-mensual-workspace-layout-polish-01.md).

## NOM-MODALES-PERIODO-STATE-03 aplicado

Overlay unificado: `ProcesoMensualOverlay`, signal `overlay`, host `app-proceso-mensual-overlays`, `cerrarOverlay()`. Documento: [`modales-periodo-state-03.md`](./modales-periodo/modales-periodo-state-03.md).

## NOM-MODALES-PERIODO-INFO-02 aplicado

Información guiada post-generación: rules `proceso-mensual-informacion-periodo`, signal `informacionPeriodo`, modal `app-proceso-mensual-informacion-modal`, banner condicionado y rail contextual. Documento: [`modales-periodo-info-02.md`](./modales-periodo/modales-periodo-info-02.md).

## NOM-MODALES-PERIODO-01 aplicado (documental)

Matriz NOIA de overlays y modales para la pantalla modular (`proceso-mensual-workspace`, `proceso-mensual-detalle-modal`, `app-message-box`, banner `errorEjecucion`). Define contrato propuesto `ProcesoMensualOverlay` y fase siguiente **NOM-MODALES-PERIODO-INFO-02** (errores/bloqueos post-generación). Sin cambios en UI productiva en esta fase. Documento: [`modales-periodo-01.md`](./modales-periodo/modales-periodo-01.md).

## Documentos

| Archivo | Rol |
|---------|-----|
| [`nom-modales-periodo-revision-incidencias-04.md`](./modales-periodo/nom-modales-periodo-revision-incidencias-04.md) | Registro único incidencias, dedupe y Resumen índice (planeada) |
| [`nom-modales-periodo-revision-copy-03.md`](./modales-periodo/nom-modales-periodo-revision-copy-03.md) | Copy RRHH modal revisión. Límite explícito vs INCIDENCIAS-04 |
| [`modales-periodo-01.md`](./modales-periodo/modales-periodo-01.md) | Matriz overlays/modales NOIA, inventario, contrato propuesto, entradas y prioridades (NOM-MODALES-PERIODO-01) |
| [`nom-mensual-container-modular-01.md`](./flow/nom-mensual-container-modular-01.md) | Refactor contenedor modular fases 1-5 (store, facade, hijos) |
| [`contrato-general.md`](./contrato-general.md) | Objetivo, alcance, relaciones con Parametros, empleados, conceptos, MV, motor futuro |
| [`nomina-mensual-persistencia-bd-mapa.md`](./flow/nomina-mensual-persistencia-bd-mapa.md) | Mapa acción→BD vs sesión/mock; principio «todo en BD» y brechas V11 |
| [`nomina-mensual-confirmacion-flow.md`](./flow/nomina-mensual-confirmacion-flow.md) | Define nómina mensual confirmada como fuente oficial para generar liquidaciones |
| [`nomina-mensual-diseno-visual-pruebas-unitarias-2026-05-18.md`](./vision/nomina-mensual-diseno-visual-pruebas-unitarias-2026-05-18.md) | Diseno visual actual respaldado por pruebas unitarias y de componente |
| [`nomina-mensual-fases-casos-uso-2026-05-18.md`](./vision/nomina-mensual-fases-casos-uso-2026-05-18.md) | Estado actual por fases y casos de uso de Nomina mensual |
| [`nomina-mensual-premium-design-mejoras-ux-2026-05-18.md`](./vision/nomina-mensual-premium-design-mejoras-ux-2026-05-18.md) | Diseno premium y mejoras premium propuestas para Nomina mensual |
| [`prevalidaciones-9-5A.md`](./prevalidaciones/prevalidaciones-9-5A.md) | Reglas base 9.5A (periodo, fila PG, calendario, empleados, conceptos, MV) |
| [`prevalidaciones-9-5B.md`](./prevalidaciones/prevalidaciones-9-5B.md) | Recurrentes por `YYYY-MM`, grupos minimos de parametros, archivos y pruebas 9.5B |
| [`vision-futura.md`](./vision/vision-futura.md) | Checklist orientativo y relación con otros módulos |

## Relación con flujos documentados

Pantalla **Proceso mensual**: **`/remuneraciones/proceso-mensual`** (redirect desde `/proceso-remuneraciones`). UI: `src/app/features/nomina-mensual/containers/proceso-mensual-container/`. Pagina `src/app/pages/proceso-remuneraciones.page.ts` wrapper (`docs/codex/arquitectura/frontend-interfaces.md`). Servicio: `ProcesoMensualService`. Reglas: `proceso-mensual-prevalidacion.rules.ts`. Limpieza demo previa: [`../../auditorias/param-chile-01-parametros-y-demo-proceso.md`](../../auditorias/param-chile-01-parametros-y-demo-proceso.md).

[`../../temas/flujos/proceso-remuneraciones.md`](../../temas/flujos/proceso-remuneraciones.md) y [`../../orquestador/contexto-proyecto.md`](../../orquestador/contexto-proyecto.md) §11–§15.

**Movimientos variables** (entrada del proceso): [`../movimientos-variables/README.md`](../movimientos-variables/README.md), [`../movimientos-variables/ui-9-4E.md`](../movimientos-variables/ui-9-4E.md).

<!-- UX-COMERCIAL-01-NOMINA -->

## Hito funcional y siguiente foco UX

El flujo de nomina queda validado hasta liquidaciones internas:

```txt
Preparar nomina
-> Revisar trabajadores
-> Confirmar nomina
-> Liquidaciones oficiales internas
```

**NOM-PREPARAR-NOMINA-BITACORA-V3-NONLINEAR-FLOW-UX-01 (2026-05-17):** mesa operativa no lineal — revisión guiada en modal. Acta y panel livianos. Ver [`../../diseno/nom-preparar-nomina-bitacora-v3-nonlinear-flow-ux-01.md`](../../diseno/nom-preparar-nomina-bitacora-v3-nonlinear-flow-ux-01.md).

**NOM-PREPARAR-NOMINA-BITACORA-V3-STEPS-FOCUS-UX-01 (2026-05-17):** bitácora de etapas enfocada (resumen + subpasos solo activos). Ver [`../../diseno/nom-preparar-nomina-bitacora-v3-steps-focus-ux-01.md`](../../diseno/nom-preparar-nomina-bitacora-v3-steps-focus-ux-01.md).

**NOM-PREPARAR-NOMINA-BITACORA-V3-COPY-DENSITY-FIX-01 (2026-05-17):** acentos, copy RRHH y densidad en bitácora V3. Ver [`../../diseno/nom-preparar-nomina-bitacora-v3-copy-density-fix-01.md`](../../diseno/nom-preparar-nomina-bitacora-v3-copy-density-fix-01.md).

**NOM-PREPARAR-NOMINA-BITACORA-V3-POLISH-UX-01 (2026-05-17):** pulido visual post-V3 — timeline de etapas, acta del período, panel de apoyo, resumen en grilla. Ver [`../../diseno/nom-preparar-nomina-bitacora-v3-polish-ux-01.md`](../../diseno/nom-preparar-nomina-bitacora-v3-polish-ux-01.md).

**NOM-PREPARAR-NOMINA-BITACORA-V3-UX-01 (2026-05-16):** bitácora V3 — padre único, 5 etapas + subpasos, acta activa y detalle progresivo. Ver [`preparar-nomina/05-bitacora-v3-ux.md`](preparar-nomina/05-bitacora-v3-ux.md).

**NOM-PREPARAR-NOMINA-NOIA-LAYOUT-UX-01 (2026-05-16):** layout bitácora operativa — franja del período, workspace `Mesa de preparación` + `Siguiente acción`, disclosure de alcance. Ver [`diseno/nom-preparar-nomina-noia-layout-ux-01.md`](../../diseno/nom-preparar-nomina-noia-layout-ux-01.md).

Para fases siguientes de UI, `Preparar nomina` debe presentarse como tablero operativo/comercial del periodo:

```txt
estado principal
resumen ejecutivo
siguiente accion
bloqueos/advertencias
resultado guardado
cierre
liquidaciones
trazabilidad secundaria
```

No agregar Previred, LRE, banco, contabilidad, PDF ni firma en esta etapa.

**NOM-PREPARAR-NOMINA-BITACORA-V3-CLIENT-SAFE-DATAGRID-UX-01 (2026-05-17):** revisión guiada cliente-segura y detalle operativo con `app-data-grid` en modal ancho. Ver [`../../diseno/nom-preparar-nomina-bitacora-v3-client-safe-datagrid-ux-01.md`](../../diseno/nom-preparar-nomina-bitacora-v3-client-safe-datagrid-ux-01.md).

**NOM-PREPARAR-NOMINA-ADMIN-WORKSPACE-UX-01 (2026-05-17):** mesa administrativa del período. `Revisión guiada` abre el modal grande en tab Guía. Panel de apoyo separado entre revisar en pantalla y corregir en otros módulos. Ver [`../../diseno/nom-preparar-nomina-admin-workspace-ux-01.md`](../../diseno/nom-preparar-nomina-admin-workspace-ux-01.md).

**NOM-PREPARAR-NOMINA-ADMIN-WORKSPACE-DESIGN-00 (2026-05-17):** maqueta documental cerrada para `Preparar nómina`: pantalla principal decide, guía explica, modal revisa, DataGrid lista y panel corrige. Ver [`../../diseno/nom-preparar-nomina-admin-workspace-design-00.md`](../../diseno/nom-preparar-nomina-admin-workspace-design-00.md).

**NOM-LIQ-ACTA-GUIADA-DESIGN-00 (2026-05-17):** contrato documental del flujo `Preparar nomina -> Liquidaciones oficiales`: cada accion critica debe tener contexto antes y evidencia despues. Ver [`../../diseno/nom-liq-acta-guiada-design-00.md`](../../diseno/nom-liq-acta-guiada-design-00.md).

**NOM-PREPARAR-NOMINA-ACTA-ACCION-UX-01 (2026-05-17):** `Acta operativa del periodo` en Preparar nomina. Muestra contexto revisado, decision y evidencia local antes de Liquidaciones oficiales. Ver [`nom-preparar-nomina-acta-accion-ux-01.md`](./workspace/nom-preparar-nomina-acta-accion-ux-01.md).

**NOM-PREPARAR-NOMINA-ESTADOS-VISUALES-PREMIUM-UX-01 (2026-05-18):** estados visuales, anti-redundancia, acta compacta, bandeja por contexto. Ver [`nom-preparar-nomina-estados-visuales-premium-ux-01.md`](./workspace/nom-preparar-nomina-estados-visuales-premium-ux-01.md).

**NOM-PREPARAR-NOMINA-ACTA-DISENO-ESTRUCTURADO-UX-01 (2026-05-18):** refinamiento visual del acta como pieza de cierre operativo, sin cambios de logica ni persistencia. Ver [`nom-preparar-nomina-acta-diseno-estructurado-ux-01.md`](./workspace/nom-preparar-nomina-acta-diseno-estructurado-ux-01.md).

## UX-COMERCIAL-01 V4 aplicado

`Preparar nomina` mantiene el patron:

```txt
header operativo
avanzar cierre mensual
resumen ejecutivo
siguiente accion
bloqueos / advertencias / informacion
resultado y cierre
trazabilidad secundaria
```

Tambien se reforzaron entradas del flujo:

- Movimientos del mes explica impacto en nomina y guia el empty state hacia registrar bonos, descuentos, anticipos o ajustes.
- Asignaciones recurrentes muestra motivo visible cuando no se puede crear sin trabajador seleccionado.
- Dashboard y Reportes ya no presentan salidas futuras como acciones disponibles.

## REM-UX-FLOWS-01 V2 aplicado

`Preparar nomina` consume el periodo activo global expuesto por el header/padre. La pantalla ya no muestra un segundo selector editable de periodo ni duplica el boton `Validar periodo` en el header.

La prioridad visual queda:

```txt
Periodo activo global
-> Estado del flujo
-> Siguiente accion recomendada
-> Que falta ahora
-> Detalle operativo
-> Trazabilidad secundaria
```

Para cambiar el periodo se usa el selector superior global. La pantalla hija solo muestra el periodo como contexto y ejecuta sus acciones sobre esa fuente.

## REM-UX-FLOWS-01 V3 aplicado

`Preparar nomina` separa lectura de cliente y trazabilidad interna:

```txt
Periodo activo global
-> Estado visible del periodo
-> Siguiente accion recomendada
-> Que falta ahora
-> Resumen final visible
-> Detalle y trazabilidad secundaria
```

El avance visible usa etapas de negocio: `Preparacion`, `Revision`, `Aprobacion y cierre`, `Liquidaciones`. Los pasos internos de validacion, base, calculo, guardado y persistencia quedan dentro del detalle operativo secundario.

## REM-UX-FLOWS-02 aplicado

`Preparar nomina` queda como hub operativo guiado por estado:

```txt
estado del periodo
accion principal unica
resumen minimo
pendientes / bloqueos / advertencias
revision operativa del periodo
informacion interna y alcance
```

La pantalla conserva solo el avance compacto superior y elimina el rail lateral duplicado. La revision operativa renderiza la etapa relevante segun `estadoClave` / `disclosureActivo`. En estado pendiente de validacion no expone todas las etapas internas.

`Movimientos del mes` usa el periodo activo global como fuente unica para listar y crear movimientos. Ya no muestra selector local editable de periodo ni boton `Buscar` asociado a ese selector.

## REM-PERIOD-GLOBAL-01 / REM-NAV-IA-01 aplicado

El header global es la unica fuente editable de periodo en Remuneraciones. `Preparar nomina` limpia resultado, pre-nomina, calculo, snapshot, aprobacion/cierre y mensajes al cambiar el periodo, y consulta el snapshot activo del nuevo periodo.

Rutas visibles del flujo:

```txt
/remuneraciones/proceso-mensual
/remuneraciones/novedades-mensuales
/remuneraciones/haberes-descuentos
/remuneraciones/liquidaciones
/remuneraciones/conceptos
```

`/remuneraciones/movimientos-variables` queda como redirect legacy a `novedades-mensuales`.

## ERP-AUDIT-REPAIR-UX-01 aplicado

`Preparar nomina` reemplaza confirmaciones nativas (`window.confirm`) por `app-message-box` modal en acciones criticas:

- Guardar resultado preliminar.
- Aprobar resultado preliminar.
- Cerrar nomina del periodo.

La confirmacion muestra motivo, alcance y puntos de revision RRHH. Cancelar no ejecuta persistencia. No cambia motor, SQL/RPC/RLS, liquidaciones oficiales ni salidas externas.
## ERP-NOIA-BITACORA-OPERATIVA-00 - Lectura de modulo

Nomina mensual queda alineada a [`NOIA / Bitacora Operativa`](../../diseno/bitacora-operativa-noia.md) como `Bitacora del periodo`.

- Preparar nomina debe comunicar periodo, trabajadores listos/bloqueados, incidencias, decisiones RRHH y cierre operativo.
- Los resultados preliminares y cierres deben sentirse como registros del periodo, no como pantallas sueltas de calculo.
- Fase futura recomendada: `NOM-MOVIMIENTOS-UNIFICADOS-UX-01` para ordenar `Movimientos de remuneracion`.
- Esta referencia es documental. No cambia motor, SQL, liquidaciones, servicios ni estilos globales.

## NOM-MOVIMIENTOS-SIMPLE-00

La decision documental vigente define `Movimientos de remuneracion` como experiencia futura que unifica `Movimientos del mes` y `Asignaciones recurrentes` desde la duracion del registro: `Solo este mes`, `Recurrente` o `En cuotas`. Documento rector: [`../remuneraciones/movimientos-remuneracion-simple.md`](../remuneraciones/movimientos-remuneracion-simple.md).

Esta fase no cambia rutas, servicios, SQL, motor ni pantallas actuales.

## NOM-MOVIMIENTOS-SIMPLE-01

Preparar nomina queda alineado a la primera capa visible de `Movimientos de remuneracion`: sus accesos y textos hablan de movimientos del periodo y recurrentes como vistas de una misma gestion. No duplica edicion ni cambia el calculo, SQL, servicios, mappers o payloads.

## NOM-MOVIMIENTOS-POR-TRABAJADOR-01

Movimientos de remuneracion queda administrado por trabajador en la vista mensual. La grilla del periodo muestra contadores de movimientos del mes, recurrentes y pendientes de revision. El modal mensual queda restringido a movimientos puntuales del periodo y no muestra duracion ni cuotas.

## NOM-MOVIMIENTOS-GESTION-INTEGRAL-01

`Movimientos de remuneración` es el menú único para gestionar movimientos mensuales y recurrentes por trabajador. La pantalla mantiene la grilla de trabajadores como entrada principal y usa un modal de gestión del trabajador con tres secciones: movimientos del mes, recurrentes y pendientes de revisión.

El alta mensual y el alta recurrente son formularios separados. El modal mensual registra solo movimientos puntuales del período activo. El modal recurrente registra o edita asignaciones recurrentes y concentra la futura sección de cuotas. No se agregan tablas, SQL, motor ni payloads nuevos.

## Pruebas del motor y limpieza de período

Antes de probar **generar nómina → F5 → confirmar** en un período de desarrollo, limpiar snapshots y liquidaciones de ese período:

```bash
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -v periodo=2026-05 -f bd/scripts/limpiar-nominas-mensuales.sql
```

**Tests unitarios (sin BD):**

- `proceso-mensual-motor.rules.spec.ts` — reglas y bloqueos del motor.
- `proceso-mensual-motor-calculos-concretos.spec.ts` — montos esperados (AFP, salud, AFC 0,6%, base tributable, líquido).
- `proceso-mensual-liquidacion-preview-trabajador.rules.spec.ts` — previsualización por trabajador.

**Tasas:** el motor normaliza catálogos que mezclan decimal (`0.006` = 0,6%) y porcentaje (`0.6` = 0,6%). Un AFC cercano al millón sobre base ~1,8M suele indicar tasa mal interpretada (60% en lugar de 0,6%); los tests `AFC interpreta 0.6` y el escenario `1.810.002` lo evitan.
