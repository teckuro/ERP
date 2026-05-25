## EMP-MODULAR-AUDIT-01 - Modularización alta avanzada + auditoría features

| Campo | Estado |
| ----- | ------ |
| Estado | **Ola A cerrada** (2026-05-25); Ola B backlog documentado |
| Tipo | Refactor arquitectura (sin cambio funcional) |
| Alcance | `empleado-alta-modal.orquestador.ts`, `empleado-alta-ficha-snapshot.builder.ts`, `etiquetaPasoHonorarios` en manifest; `form-empleado` delega modales/snapshot. |
| Documento | [../arquitectura/auditoria-modular-features.md](../arquitectura/auditoria-modular-features.md), [../modulos/empleados/creacion-avanzada.md](../modulos/empleados/creacion-avanzada.md) |
| Validación | Unit empleados (orquestador + snapshot + form-empleado + foco + presenter): **41** tests OK |
| Restricciones | Sin SQL, mappers persistencia, estilos globales. PRs B1–B6 pendientes según auditoría. |

## EMP-CREACION-AVANZADA-CERRADA-01 - Pruebas exhaustivas creación avanzada

| Campo | Estado |
| ----- | ------ |
| Estado | **Cerrada** (2026-05-23) |
| Tipo | Pruebas (unit + E2E UI + E2E BD + scripts verify) |
| Alcance | Matriz F1–F13 trazable; globalSetup purge+U1–U8+ERR; specs validaciones/flujos/honorarios/inferencia; correo/teléfono obligatorios alineados. |
| Documento | [../modulos/empleados/matriz-pruebas-creacion-avanzada.md](../modulos/empleados/matriz-pruebas-creacion-avanzada.md), [../modulos/empleados/tests-empleados.md](../modulos/empleados/tests-empleados.md) |
| Validación | `npm run test:gate:empleados` — unit **220**; UI **17/17**; BD **15/15** (0 skipped); `verify:empleados-qa` (U1, U2, U6, U8, ERR01); nómina fixtures opt-in (`empleados-nomina`). Hardening 2026-05-25: `form.valid` honesto honorarios (`sincronizarValidadoresPorRelacionLaboral`); finalize exige banco real (`resolveEmpleadoCatalogFallbacks`); ERR01 `paso_alta_avanzada` null. |
| Restricciones | Sin SQL/motor/estilos globales en esta fase. |

## EMP-FICHA-EXPEDIENTE-EDICION-SECCION-UX-04 - Modal edición expediente

| Campo | Estado |
| ----- | ------ |
| Estado | Implementada |
| Tipo | UI presentación (modal edición) |
| Alcance | Cabecera con Cancelar/Guardar; sin footer card; grilla y campos compactos; copy ayuda neutro. |
| Restricciones | Sin SQL, payloads, formularios hijos, estilos globales. |
| Documento | [../modulos/empleados/emp-ficha-expediente-edicion-seccion-ux-04.md](../modulos/empleados/emp-ficha-expediente-edicion-seccion-ux-04.md) |

## EMP-FICHA-EXPEDIENTE-SECCIONES-LECTURA-UX-03 - Lectura secciones expediente

| Campo | Estado |
| ----- | ------ |
| Estado | Implementada |
| Tipo | UI presentación (CSS local + `isMissingValue`) |
| Alcance | Jerarquía título/label/valor/vacío en `.detail-block--editorial`; sin cards; tab lectura plano. |
| Restricciones | Sin SQL, payloads, estilos globales, `angular.json`. |
| Documento | [../modulos/empleados/emp-ficha-expediente-secciones-lectura-ux-03.md](../modulos/empleados/emp-ficha-expediente-secciones-lectura-ux-03.md) |

## EMP-FICHA-UX-REPLANTEO-01 - Ficha consulta + modal edición

| Campo | Estado |
| ----- | ------ |
| Estado | Implementada |
| Tipo | UI presentación (workspace + overlays) |
| Alcance | Panel lectura `ficha-registro-tab`; edición por bloque en modal; `FichaEmpleadoOverlaysPort`; `requestCerrarEdicion` con confirmación si hay cambios. |
| Restricciones | Sin SQL, payloads, estilos globales, `angular.json`. |
| Documento | [../modulos/empleados/emp-ficha-ux-replanteo-01.md](../modulos/empleados/emp-ficha-ux-replanteo-01.md) |
| Validación | `tsc` app OK; `ng build` development OK; spec ficha actualizado para modal. |

## EMP-FICHA-UI-BASE-01 - Tokens y shell expediente empleado

| Campo | Estado |
|---|---|
| Estado | Implementada |
| Alcance | empleado-expediente-tokens.css, ficha-expediente.layout.css; shell chip unico; panel Diagnostico operativo |
| Documento | [../modulos/empleados/emp-ficha-ui-base-01.md](../modulos/empleados/emp-ficha-ui-base-01.md) |
| Validacion | tsc app OK |
## EMP-ALTA-FICHA-PARITY-01 - Alta avanzada paridad diagnostico ficha

| Campo      | Estado                                                                                                               |
| ---------- | -------------------------------------------------------------------------------------------------------------------- |
| Estado     | Implementada                                                                                                         |
| Alcance    | form-empleado usa empleado-alta-diagnostico + kernel; resumen paso 9 con faltantes de ficha; wizardStepDesdeClaveTab |
| Documento  | [../modulos/empleados/emp-ficha-sustentable-00.md](../modulos/empleados/emp-ficha-sustentable-00.md)                 |
| Validacion | vitest empleado-alta-diagnostico, empleado-completitud; tsc app OK                                                   |

## EMP-FICHA-SUSTENTABLE-00 - Ficha empleado arquitectura modular (fases 0-2a)

| Campo         | Estado                                                                                                                                    |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Estado        | **Cerrada** (fases 0-5)                                                                                                                  |
| Tipo          | Refactor estructural feature empleados + perfil laboral ficha                                                                             |
| Alcance       | Facade, workspace, RPC perfil laboral por periodo, condiciones especiales en tab Laboral, diagnostico enriquecido.                         |
| Restricciones | Sin SQL nuevo, estilos globales ni motor.                                                                                                 |
| Documento     | [../modulos/empleados/emp-ficha-sustentable-00.md](../modulos/empleados/emp-ficha-sustentable-00.md), [../modulos/empleados/emp-perfil-laboral-ficha-05.md](../modulos/empleados/emp-perfil-laboral-ficha-05.md) |
| Validación    | tsc app OK; vitest empleado-perfil-laboral, empleado-diagnostico, empleado-completitud OK.                                                |

## NOMENCLATURA-ES-CAMELCASE-01 - Normalizacion interna espanol/camelCase

| Campo         | Estado                                                                                                                                                          |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Estado        | Implementada                                                                                                                                                    |
| Tipo          | Refactor interno nomenclatura                                                                                                                                   |
| Alcance       | Ficha empleado, alta avanzada de empleados y capa de presentacion de nomina mensual; VM de estado y faltantes en espanol/camelCase; higiene de logs dev-server. |
| Restricciones | Sin SQL/RPC/RLS, sin contratos Supabase, sin rutas publicas, sin selectores Angular, sin clases CSS ni cambio visual.                                           |
| Documento     | [../diseno/nomenclatura-es-camelcase-01.md](../diseno/nomenclatura-es-camelcase-01.md)                                                                          |
| Validacion    | tsc app/spec OK; specs completos de empleados y nomina mensual OK; budget CSS ficha resuelto en EMP-FICHA-EXPEDIENTE-CSS-BUDGET-01.                             |

## EMP-FICHA-EXPEDIENTE-FULLWORKSPACE-UX-02 - Ficha empleado full workspace

| Campo         | Estado                                                                                                                                 |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Estado        | Implementada                                                                                                                           |
| Tipo          | UI presentación (CSS local)                                                                                                            |
| Alcance       | Shell plano, header franja, rail/status integrados, bloques editoriales sin mini-card; sin tocar lógica.                               |
| Restricciones | Sin globales, angular.json, HTML/TS negocio, servicios; 4 styleUrls bajo budget.                                                       |
| Documento     | [`../modulos/empleados/emp-ficha-expediente-fullworkspace-ux-02.md`](../modulos/empleados/emp-ficha-expediente-fullworkspace-ux-02.md) |
| Validación    | `ficha-empleado*.spec.ts`, `empleado-completitud*.spec.ts`, `tsc`, build sin error CSS ficha.                                          |

## EMP-FICHA-EXPEDIENTE-CSS-BUDGET-01 - Ficha empleado CSS budget

| Campo         | Estado                                                                                                                        |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Estado        | Implementada                                                                                                                  |
| Tipo          | Deuda técnica CSS local                                                                                                       |
| Alcance       | Split `styleUrls` en 4 hojas (`container`, `expediente`, `detalle`, `responsive`); sin rediseño NOIA.                         |
| Restricciones | Sin `angular.json`, estilos globales, HTML, reglas, servicios, SQL.                                                           |
| Documento     | [`../modulos/empleados/emp-ficha-expediente-css-budget-01.md`](../modulos/empleados/emp-ficha-expediente-css-budget-01.md)    |
| Validación    | `ficha-empleado*.spec.ts` (38), `empleado-completitud*.spec.ts` (18), `tsc`; sin error `anyComponentStyle` en hojas de ficha. |

## EMP-FICHA-EXPEDIENTE-NOIA-01 - Ficha empleado layout expediente

| Campo         | Estado                                                                                                                                                                                 |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Estado        | Implementada                                                                                                                                                                           |
| Tipo          | UI presentación (contenedor + rules)                                                                                                                                                   |
| Alcance       | Rail expediente 7 bloques; centro editorial; panel diagnóstico (motivo principal, faltantes dedup, CTA único); shell sin `primaryAction` duplicado; tokens `--employee-exp-*` locales. |
| Restricciones | Sin SQL/RPC, sin servicios/persistencia, sin estilos globales, sin integrar `nuevo-modulo/` React.                                                                                     |
| Documento     | [`../modulos/empleados/emp-ficha-expediente-noia-01.md`](../modulos/empleados/emp-ficha-expediente-noia-01.md)                                                                         |
| Validación    | `ficha-empleado*.spec.ts` (27), `empleado-completitud*.spec.ts` (13), `tsc`, `ng build` development.                                                                                   |

## NOM-MENSUAL-FLUJO-SECUENCIAL-01 - Flujo RRHH secuencial Nómina -> Liquidaciones

| Campo         | Estado                                                                                                                                                                                                                                                                                     |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Estado        | Implementada                                                                                                                                                                                                                                                                               |
| Tipo          | UX/copy + navegación + tests                                                                                                                                                                                                                                                               |
| Alcance       | CTA secuencial `Verificar período -> Generar nómina -> Revisar trabajadores -> Confirmar nómina -> Generar liquidaciones`; Liquidaciones habla de `nómina mensual confirmada`; deep links conservan `periodo` y retorno a Nómina mensual; specs Vitest focalizados con imports explícitos. |
| Restricciones | Sin SQL/RPC/RLS, sin motor nuevo, sin renombrar `/remuneraciones/proceso-mensual`, sin cambiar contrato interno `cerrado_operativamente`.                                                                                                                                                  |
| Validación    | Vitest focalizado y build Angular según cierre de implementación.                                                                                                                                                                                                                          |

## NOM-MENSUAL-FLOW-UNIFICADO-03 - Flujo unificado (dispatcher + fases 2-5)

| Campo            | Estado                                                                                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Estado           | **Epic UI cerrado (2026-05-19)** — Fases 1–5 implementadas; confirmación BD productiva (**5.C**) pendiente de gate                                     |
| Tipo             | UI presentación (rules/facade/Novedades); fases posteriores panel, modal, audit/E2E                                                                    |
| Documento índice | [`../modulos/nomina-mensual/nom-mensual-flow-unificado-03.md`](../modulos/nomina-mensual/nom-mensual-flow-unificado-03.md)                             |
| Fase 2           | [`nom-mensual-flow-unificado-03-fase-02-deep-links.md`](../modulos/nomina-mensual/nom-mensual-flow-unificado-03-fase-02-deep-links.md)                 |
| Fase 3           | [`nom-mensual-flow-unificado-03-fase-03-panel-modales.md`](../modulos/nomina-mensual/nom-mensual-flow-unificado-03-fase-03-panel-modales.md)           |
| Fase 4           | [`nom-mensual-flow-unificado-03-fase-04-modal-global.md`](../modulos/nomina-mensual/nom-mensual-flow-unificado-03-fase-04-modal-global.md)             |
| Fase 5           | [`nom-mensual-flow-unificado-03-fase-05-calidad-productivo.md`](../modulos/nomina-mensual/nom-mensual-flow-unificado-03-fase-05-calidad-productivo.md) |
| Precede          | NOM-MENSUAL-FLOW-NAV-02 (panel corrección, Todos decisión B)                                                                                           |

## NOM-MENSUAL-FLOW-NAV-02 - Cierre flujo Nómina mensual (cableado + modal reducido)

| Campo     | Estado                                                                                                                                                                                                                               |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Estado    | Implementada                                                                                                                                                                                                                         |
| Tipo      | UI presentación (rules/facade/workspace/modal)                                                                                                                                                                                       |
| Alcance   | Acciones en grillas Todos/Pendientes; `idPersona` y preselección trabajador; lista pendientes sidebar; rehidratación `returnTo`; matriz `resolveFlowDestinoPorFrame/Accion`; footer modal al panel; limpieza CSS mass-filter legacy. |
| Documento | [`../modulos/nomina-mensual/nom-mensual-flow-nav-02.md`](../modulos/nomina-mensual/nom-mensual-flow-nav-02.md)                                                                                                                       |
| Precede   | NOM-MENSUAL-FLOW-NAV-01                                                                                                                                                                                                              |
| Deuda     | NOM-MENSUAL-TS-AUDIT-00; confirmación productiva BD; E2E; panel resumen unificado (ver doc fase 3)                                                                                                                                   |

## NOM-MENSUAL-FLOW-NAV-01 - Coherencia flujo RRHH (panel + deep links)

| Campo     | Estado                                                                                                                      |
| --------- | --------------------------------------------------------------------------------------------------------------------------- |
| Estado    | Implementada                                                                                                                |
| Tipo      | UI presentación (rules/facade/workspace/modal)                                                                              |
| Alcance   | Detalle mensual canónico; estado RRHH sidebar; deep links período; segment nav en modal; CTAs revisar trabajadores → panel. |
| Documento | [`../modulos/nomina-mensual/nom-mensual-flow-nav-01.md`](../modulos/nomina-mensual/nom-mensual-flow-nav-01.md)              |
| Precede   | Segment nav unificado, revisión masiva workspace                                                                            |

## NOM-MENSUAL-REVISION-TRABAJADORES-MASIVA-01 - Revisión masiva workspace

| Campo     | Estado                                                                                                                                                 |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Estado    | Implementada                                                                                                                                           |
| Tipo      | UI presentación (rules/facade/componente workspace)                                                                                                    |
| Alcance   | Master-detail Trabajadores; panel movimientos por persona; franja Movimientos → filtro con_movimientos; sin tab Movimientos global.                    |
| Documento | [`../modulos/nomina-mensual/nom-mensual-revision-trabajadores-masiva-01.md`](../modulos/nomina-mensual/nom-mensual-revision-trabajadores-masiva-01.md) |
| Precede   | NOM-MENSUAL-DETALLE-MENSUAL-UNIFICADO-01                                                                                                               |
| Deuda     | Unificar modal; NOM-MENSUAL-TS-AUDIT-00                                                                                                                |

## NOM-MENSUAL-CLEANUP-AUDIT-01 - Limpieza código muerto nómina mensual

| Campo     | Estado                                                                                                                   |
| --------- | ------------------------------------------------------------------------------------------------------------------------ |
| Estado    | Implementada                                                                                                             |
| Tipo      | Refactor presentación (sin motor/SQL)                                                                                    |
| Alcance   | Facade/workspace CSS/rules legacy; componente acta huérfano; tests alineados a tabbar visible.                           |
| Documento | [`../modulos/nomina-mensual/nom-mensual-cleanup-audit-01.md`](../modulos/nomina-mensual/nom-mensual-cleanup-audit-01.md) |

## NOM-MENSUAL-DETALLE-MENSUAL-UNIFICADO-01 - Detalle mensual unificado

| Campo     | Estado                                                                                                                                           |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Estado    | Implementada                                                                                                                                     |
| Tipo      | UI presentación (rules/facade/workspace)                                                                                                         |
| Alcance   | Tabbar `Detalle mensual \| Historial`; franja parámetros; movimientos+recurrentes unificados; filtros internos; historial tabla.                 |
| Documento | [`../modulos/nomina-mensual/nom-mensual-detalle-mensual-unificado-01.md`](../modulos/nomina-mensual/nom-mensual-detalle-mensual-unificado-01.md) |

## NOM-FLOW-REVISION-01 - Revisión flujo RRHH (sidebar + verificar/generar)

| Campo     | Estado                                                                                                                                                                                                                                                                 |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Estado    | Implementada                                                                                                                                                                                                                                                           |
| Tipo      | Rules + store + BD diagnóstico + docs                                                                                                                                                                                                                                  |
| Alcance   | CTAs Verificar/Generar; bitácora RRHH; persistencia prevalidación; sidebar + 6 tabs documentados; cleanup exception strip.                                                                                                                                             |
| Documento | [`../modulos/nomina-mensual/nom-workspace-loc-maquetacion-01.md`](../modulos/nomina-mensual/nom-workspace-loc-maquetacion-01.md), [`../modulos/nomina-mensual/nom-periodo-diagnostico-persist-01.md`](../modulos/nomina-mensual/nom-periodo-diagnostico-persist-01.md) |

## NOM-WORKSPACE-LOC-MAQUETACION-01 - Maquetación consola (sidebar + 6 tabs)

| Campo     | Estado                                                                                                                           |
| --------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Estado    | Implementada                                                                                                                     |
| Tipo      | UI local (HTML/CSS/rules)                                                                                                        |
| Alcance   | Sidebar operativo + 6 tabs panel; orden áreas; paridad paneles/modal; Figma §0                                                   |
| Documento | [`../modulos/nomina-mensual/nom-workspace-loc-maquetacion-01.md`](../modulos/nomina-mensual/nom-workspace-loc-maquetacion-01.md) |

## NOM-PERIODO-VERIFICAR-MODAL-02 - Modal tras verificar período

| Campo     | Estado                                                                                                                               |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Estado    | Implementada                                                                                                                         |
| Tipo      | Rules + facade (UI modal)                                                                                                            |
| Alcance   | `buildInformacionPeriodoView` paso verificación; destino `generar_nomina`; sin BD.                                                   |
| Documento | [`../modulos/nomina-mensual/nom-periodo-diagnostico-persist-01.md`](../modulos/nomina-mensual/nom-periodo-diagnostico-persist-01.md) |
| Precede   | NOM-PREVALIDACION-PARAMETROS-CTA-01                                                                                                  |
| Siguiente | NOM-PERIODO-DIAGNOSTICO-PERSIST-01 (BD)                                                                                              |

## NOM-PERIODO-DIAGNOSTICO-PERSIST-01 - Diagnóstico período en BD

| Campo     | Estado                                                                                                                               |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Estado    | Implementada                                                                                                                         |
| Tipo      | Producto + persistencia + store                                                                                                      |
| Alcance   | `27_nomina_periodo_diagnostico.sql`, repository, rehidratación en `rehidratarPeriodoActivo`, guardar tras `validarPeriodo`.          |
| Precede   | NOM-PERIODO-VERIFICAR-MODAL-02                                                                                                       |
| Documento | [`../modulos/nomina-mensual/nom-periodo-diagnostico-persist-01.md`](../modulos/nomina-mensual/nom-periodo-diagnostico-persist-01.md) |

## NOM-PREVALIDACION-PARAMETROS-CTA-01 - CTA parámetros alineada a prevalidación

| Campo     | Estado                                                                                                                                        |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Estado    | Implementada                                                                                                                                  |
| Tipo      | Rules (sin SQL)                                                                                                                               |
| Alcance   | `BLOQ-004` condicionado a `parametrosOperativos`; prioridad trabajadores en estado operativo.                                                 |
| Documento | [`../modulos/nomina-mensual/nom-periodo-diagnostico-persist-01.md`](../modulos/nomina-mensual/nom-periodo-diagnostico-persist-01.md) § Fase A |

## ERP-SHELL-CONTEXT-ROLLOUT-02 - Contexto solo en topbar

| Campo         | Estado                                                                                               |
| ------------- | ---------------------------------------------------------------------------------------------------- |
| Estado        | Implementada                                                                                         |
| Tipo          | UI shell + migracion pantallas                                                                       |
| Alcance       | `bindShellPageContext`, fallback rutas, quitar breadcrumbs locales en modulos ERP.                   |
| Restricciones | Sin SQL/motor/store; sin estilos globales.                                                           |
| Documento     | [`../diseno/erp-shell-sidebar-topbar-polish-01.md`](../diseno/erp-shell-sidebar-topbar-polish-01.md) |
| Precede       | ERP-SHELL-SIDEBAR-TOPBAR-POLISH-01                                                                   |
| Siguiente     | Validacion manual responsive; E2E si aplica.                                                         |

## ERP-SHELL-SIDEBAR-TOPBAR-POLISH-01 - Shell sidebar + topbar

| Campo         | Estado                                                                                                |
| ------------- | ----------------------------------------------------------------------------------------------------- |
| Estado        | Implementada                                                                                          |
| Tipo          | UI shell + presentación Nómina                                                                        |
| Alcance       | Nav global 220 px; topbar 52 px con contexto de página; Nómina sin rail, 7 tabs, bitácora en Resumen. |
| Restricciones | Sin SQL/motor/store; sin estilos globales.                                                            |
| Documento     | [`../diseno/erp-shell-sidebar-topbar-polish-01.md`](../diseno/erp-shell-sidebar-topbar-polish-01.md)  |
| Precede       | Modales período / reapertura nómina                                                                   |
| Siguiente     | Validación manual responsive shell; E2E Nómina si aplica.                                             |

## NOM-MENSUAL-MASIVO-LAYOUT-01 - Tab Trabajadores masivo

| Campo         | Estado                                                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Estado        | Implementada                                                                                                               |
| Tipo          | Rules + presentacion modal                                                                                                 |
| Alcance       | Tab `Trabajadores` del modal: resumen agregado, filtros compactos, busqueda, grilla paginada y detalle unico bajo demanda. |
| Restricciones | Sin workspace principal, store, servicios, SQL/RPC/RLS, motor, `app-data-grid`, `app-message-box` ni estilos globales.     |
| Documento     | [`../modulos/nomina-mensual/nom-mensual-masivo-layout-01.md`](../modulos/nomina-mensual/nom-mensual-masivo-layout-01.md)   |
| Precede       | E2E modal masivo o ajuste de fuentes con `idPersona` en movimientos/recurrentes.                                           |
| Siguiente     | Validacion visual con dataset grande.                                                                                      |

## NOM-MENSUAL-REAPERTURA-ELIMINACION-01 - Abrir / descartar nómina

| Campo         | Estado                                                                                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Estado        | Implementada                                                                                                                                            |
| Tipo          | Rules + persistencia + workspace UI                                                                                                                     |
| Alcance       | `buildAccionesNominaPeriodo`, guardia liquidaciones, RPC `reabrir_nomina_operativa`, bloque `payroll-period-actions`, admin gate (rol + no production). |
| Restricciones | Sin reversa productiva de liquidaciones; sin motor; sin estilos globales.                                                                               |
| Documento     | [`../modulos/nomina-mensual/nom-mensual-reapertura-eliminacion-01.md`](../modulos/nomina-mensual/nom-mensual-reapertura-eliminacion-01.md)              |
| Precede       | INCIDENCIAS-DEDUPE-06 / persistencia estado                                                                                                             |
| Siguiente     | Reversa liquidaciones (fase futura) o E2E workspace.                                                                                                    |

## NOM-MODALES-PERIODO-COPY-LIMPIO-05 - Copy visible modal revisión

| Campo         | Estado                                                                                                                                                    |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Estado        | Implementada                                                                                                                                              |
| Tipo          | Rules + tests (copy RRHH)                                                                                                                                 |
| Alcance       | `limpiarCopyTecnicoNomina` (diccionario, `;`, snake_case); delegación desde `humanizarDetalleRevisionTexto`; proyección payroll observaciones; tests DOM. |
| Restricciones | Sin store, servicios, SQL, motor, estilos globales, workspace/acta; sin mutar dedupe de incidencias.                                                      |
| Documento     | [`../modulos/nomina-mensual/nom-modales-periodo-copy-limpio-05.md`](../modulos/nomina-mensual/nom-modales-periodo-copy-limpio-05.md)                      |
| Precede       | [`nom-modales-periodo-revision-incidencias-qa-05.md`](../modulos/nomina-mensual/nom-modales-periodo-revision-incidencias-qa-05.md)                        |
| Siguiente     | Fase visual resumen bitácora (`INCIDENCIAS-UI-06`) o E2E modales.                                                                                         |

## NOM-MODALES-PERIODO-INCIDENCIAS-QA-05 - Candado QA incidencias modal

| Campo         | Estado                                                                                                                                                                                              |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Estado        | Implementada                                                                                                                                                                                        |
| Tipo          | Tests + checklist manual                                                                                                                                                                            |
| Alcance       | Tests candado (dedupe DOM, indicadores tabs, expediente sin sección observaciones, builders sin arrays paralelos, orden severidad, copy sin claves técnicas); checklist manual RRHH en doc de fase. |
| Restricciones | Sin nueva lógica, store, SQL, motor ni rediseño visual; workspace fuera de checklist.                                                                                                               |
| Documento     | [`../modulos/nomina-mensual/nom-modales-periodo-revision-incidencias-qa-05.md`](../modulos/nomina-mensual/nom-modales-periodo-revision-incidencias-qa-05.md)                                        |
| Precede       | [`nom-modales-periodo-revision-incidencias-04.md`](../modulos/nomina-mensual/nom-modales-periodo-revision-incidencias-04.md)                                                                        |
| Siguiente     | Fase visual opcional resumen bitácora compacta (`INCIDENCIAS-UI-06`) o E2E modales.                                                                                                                 |

## NOM-MODALES-PERIODO-INCIDENCIAS-04 - Registro único incidencias modal

| Campo         | Estado                                                                                                                                                                  |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Estado        | Implementada                                                                                                                                                            |
| Tipo          | Rules + presentación (modal revisión)                                                                                                                                   |
| Alcance       | `buildIncidenciasPeriodo`, dedupe/orden, Resumen índice (Opción A), conteos desde fuente única, tabs con enlace «Ver en resumen»; sin repetir builders paralelos en UI. |
| Restricciones | Sin store, servicios, SQL, motor, `app-message-box`, `app-data-grid`, estilos globales; workspace/acta/consola fuera salvo acuerdo.                                     |
| Documento     | [`../modulos/nomina-mensual/nom-modales-periodo-revision-incidencias-04.md`](../modulos/nomina-mensual/nom-modales-periodo-revision-incidencias-04.md)                  |
| Precede       | Cerrar [`nom-modales-periodo-revision-copy-03.md`](../modulos/nomina-mensual/nom-modales-periodo-revision-copy-03.md)                                                   |
| Siguiente     | E2E modales o extensión del builder a workspace/acta si se acuerda.                                                                                                     |

## NOM-MODALES-PERIODO-REVISION-COPY-03 - Copy modal revisión

| Campo         | Estado                                                                                                                                                 |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Estado        | Implementada                                                                                                                                           |
| Tipo          | Copy / UX local (modal revisión)                                                                                                                       |
| Alcance       | Humanizar claves técnicas; tab Resumen coherente con bloqueos globales; acción agrupada parámetros; densidad lista; sin registro único de incidencias. |
| Restricciones | Sin store, servicios, SQL, motor, refactor de builders paralelos ni INCIDENCIAS-04.                                                                    |
| Documento     | [`../modulos/nomina-mensual/nom-modales-periodo-revision-copy-03.md`](../modulos/nomina-mensual/nom-modales-periodo-revision-copy-03.md)               |
| Siguiente     | E2E modales o fases producto README.                                                                                                                   |

## NOM-MODALES-PERIODO-REVISION-UX-01 - UX modal revisión

| Campo         | Estado                                                                                                                                                               |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Estado        | Implementada                                                                                                                                                         |
| Tipo          | UX/UI local (modal revisión)                                                                                                                                         |
| Alcance       | Tabs con severidad e indicador; grillas movimientos/recurrentes/resultado/observaciones; CTA expediente en franja; empty states; «Ver revisión completa» contextual. |
| Restricciones | Sin store, servicios, SQL, motor, `app-message-box`, estilos globales.                                                                                               |
| Documento     | [`../modulos/nomina-mensual/nom-modales-periodo-revision-ux-01.md`](../modulos/nomina-mensual/nom-modales-periodo-revision-ux-01.md)                                 |
| Siguiente     | E2E modales o fases producto README.                                                                                                                                 |

## NOM-MENSUAL-FACADE-SLIM-01 - Adelgazamiento facade presentación

| Campo         | Estado                                                                                                                                                                       |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Estado        | Implementada                                                                                                                                                                 |
| Tipo          | Refactor interno (rules + utils; sin UI/copy)                                                                                                                                |
| Alcance       | Extracción `resultadoPreliminar`, `revisionAprobacion`, payroll/seguimiento y labels; eliminación `snapshotCompletoDetalle` y VMs muertos; facade ~1462 líneas (desde 2295). |
| Restricciones | Sin store/servicios/SQL/motor/estilos globales/HTML/CSS/copy.                                                                                                                |
| Documento     | [`../modulos/nomina-mensual/nom-mensual-facade-slim-01.md`](../modulos/nomina-mensual/nom-mensual-facade-slim-01.md)                                                         |
| Siguiente     | E2E modales o fases de producto pendientes en README módulo.                                                                                                                 |

## NOM-MENSUAL-INTEGRIDAD-REGISTRO-01 - Expediente desde BD

| Campo         | Estado                                                                                                                                                                           |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Estado        | Implementada                                                                                                                                                                     |
| Tipo          | View model + cableado UI + carga snapshot completo                                                                                                                               |
| Alcance       | `buildExpedienteNominaPeriodo`, modal/tab Detalle con loading/error/vacío/datos, `asegurarSnapshotCompletoCargado`, fallbacks `payrollWorkerDetailRows` y `resultadoPreliminar`. |
| Restricciones | Sin motor, borradores nuevos, estilos globales, SQL (auditoría estática OK).                                                                                                     |
| Documento     | [`../modulos/nomina-mensual/nom-mensual-integridad-registro-01.md`](../modulos/nomina-mensual/nom-mensual-integridad-registro-01.md)                                             |
| Siguiente     | E2E modales o fases producto README.                                                                                                                                             |

## NOM-MODALES-PERIODO-DETALLE-POLISH-01 - Pulido modal revisión

| Campo         | Estado                                                                                                                                     |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Estado        | Implementada                                                                                                                               |
| Tipo          | UX/UI local (modal detalle)                                                                                                                |
| Alcance       | Copy header/footer contextual; sin disclosure técnico; CSS local del modal; sombra NOIA; rules + specs.                                    |
| Restricciones | Sin facade slim, store, servicios, SQL, motor, `app-message-box`.                                                                          |
| Documento     | [`../modulos/nomina-mensual/nom-modales-periodo-detalle-polish-01.md`](../modulos/nomina-mensual/nom-modales-periodo-detalle-polish-01.md) |
| Siguiente     | `NOM-MENSUAL-FACADE-SLIM-01` o E2E modales.                                                                                                |

## NOM-CONTAINER-SPEC-REPARO - Reparación specs contenedor

| Campo         | Estado                                                                                                                                                                                                                                    |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Estado        | Implementada                                                                                                                                                                                                                              |
| Tipo          | Tests + documentación                                                                                                                                                                                                                     |
| Alcance       | Eliminado `describe.skip` (43 legacy); helpers `proceso-mensual-container.spec.helpers.ts`; sub-describes shell/workspace, flujo integración, overlay y rehidratación (~31 tests container). Matriz MIGRAR/ADAPTAR/RETIRAR en doc módulo. |
| Restricciones | Sin producción salvo `rehidratandoPeriodo` en facade (lectura tests); sin SQL/motor/estilos globales.                                                                                                                                     |
| Documento     | [`../modulos/nomina-mensual/nom-mensual-container-spec-reparo-01.md`](../modulos/nomina-mensual/nom-mensual-container-spec-reparo-01.md)                                                                                                  |
| Siguiente     | Cerrada; pulido modal en DETALLE-POLISH-01.                                                                                                                                                                                               |

## NOM-MENSUAL-PERSISTENCIA-ESTADO-01 - Rehidratación estado período

| Campo         | Estado                                                                                                                               |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Estado        | Implementada                                                                                                                         |
| Tipo          | Store / facade / rules (sin SQL nuevo)                                                                                               |
| Alcance       | `rehidratarPeriodoActivo`, inferencia de contexto desde snapshot, tests rehidratación.                                               |
| Restricciones | Sin guardar borrador en BD; sin `liquidacionesDisponibles` desde BD.                                                                 |
| Documento     | [`../modulos/nomina-mensual/nom-mensual-persistencia-estado-01.md`](../modulos/nomina-mensual/nom-mensual-persistencia-estado-01.md) |
| Siguiente     | Cerrada; specs en NOM-CONTAINER-SPEC-REPARO.                                                                                         |

## NOM-MENSUAL-WORKSPACE-COPY-POLISH-01 - Pulido copy workspace

| Campo         | Estado                                                                                                                                       |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Estado        | Implementada                                                                                                                                 |
| Tipo          | Copy / UX operativo                                                                                                                          |
| Alcance       | Textos visibles workspace + lead shell; rules workspace y strings acotados estado operativo; spec `proceso-mensual-workspace.rules.spec.ts`. |
| Restricciones | Sin CSS/layout, overlays, store, servicios, SQL, motor; mismos `accionLocal` y flujos.                                                       |
| Documento     | [`../modulos/nomina-mensual/nom-mensual-workspace-copy-polish-01.md`](../modulos/nomina-mensual/nom-mensual-workspace-copy-polish-01.md)     |
| Siguiente     | Pulido modal detalle (prioridad 5 modales).                                                                                                  |

## NOM-MENSUAL-WORKSPACE-LAYOUT-POLISH-01 - Pulido layout workspace

| Campo         | Estado                                                                                                                                       |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Estado        | Implementada                                                                                                                                 |
| Tipo          | UX/UI local (CSS + micro-HTML)                                                                                                               |
| Alcance       | Franja, rail, focus operativo, tabs, paneles guía/trabajadores, responsive en `proceso-mensual-container.css`.                               |
| Restricciones | Sin facade/store/rules/overlays; sin estilos globales; sin contenido nuevo (disclosure/acta/paraContinuar).                                  |
| Documento     | [`../modulos/nomina-mensual/nom-mensual-workspace-layout-polish-01.md`](../modulos/nomina-mensual/nom-mensual-workspace-layout-polish-01.md) |
| Siguiente     | `NOM-MENSUAL-WORKSPACE-COPY-POLISH-01` (cerrada).                                                                                            |

## NOM-MODALES-PERIODO-STATE-03 - Overlay unificado

| Campo         | Estado                                                                                                                                   |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Estado        | Implementada                                                                                                                             |
| Tipo          | Refactor presentación / orquestación UI                                                                                                  |
| Alcance       | `ProcesoMensualOverlay`, signal `overlay`, host `app-proceso-mensual-overlays`, `cerrarOverlay`, computeds compatibles, 8 tests overlay. |
| Restricciones | Sin `app-message-box` compartido, store, servicios, SQL, motor, estilos globales.                                                        |
| Documento     | [`../modulos/nomina-mensual/modales-periodo-state-03.md`](../modulos/nomina-mensual/modales-periodo-state-03.md)                         |
| Siguiente     | Cerrada; specs reparados en NOM-CONTAINER-SPEC-REPARO.                                                                                   |

## NOM-MODALES-PERIODO-INFO-02 - Información guiada post-generación

| Campo     | Estado                                                                                                         |
| --------- | -------------------------------------------------------------------------------------------------------------- |
| Estado    | Implementada (alcance mínimo)                                                                                  |
| Tipo      | UX/UI local + rules                                                                                            |
| Alcance   | `InformacionPeriodoView`, rules, modal MessageBox informativo, banner condicionado, rail contextual.           |
| Documento | [`../modulos/nomina-mensual/modales-periodo-info-02.md`](../modulos/nomina-mensual/modales-periodo-info-02.md) |
| Siguiente | Cerrada; absorbida por STATE-03 (`overlay`).                                                                   |

## NOM-MODALES-PERIODO-01 - Matriz overlays/modales (documental)

| Campo         | Estado                                                                                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Estado        | Implementada (documental)                                                                                                                                    |
| Tipo          | Criterio NOIA / diseño técnico-operativo                                                                                                                     |
| Alcance       | Matriz cuándo usar revisión tabulada, MessageBox decisión/información, inline y rail; contrato propuesto `ProcesoMensualOverlay`; prioridad post-generación. |
| Restricciones | Sin HTML/CSS/TS productivo, shared components, facade/store productivo, SQL, motor, estilos globales.                                                        |
| Documento     | [`../modulos/nomina-mensual/modales-periodo-01.md`](../modulos/nomina-mensual/modales-periodo-01.md)                                                         |
| Siguiente     | Cerrada; implementación en INFO-02.                                                                                                                          |

## NOM-MENSUAL-CONTAINER-MODULAR-01 - Contenedor modular (fases 1-5)

| Campo         | Estado                                                                                                                                                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Estado        | Implementada (fases 1-5)                                                                                                                                                                                                   |
| Tipo          | Refactor estructural / presentacion                                                                                                                                                                                        |
| Alcance       | VMs, grid config, rules; `ProcesoMensualPeriodoStore` (async); `ProcesoMensualPresentacionFacade` (computeds/UI); shell `proceso-mensual-container` + hijos `proceso-mensual-workspace` y `proceso-mensual-detalle-modal`. |
| Restricciones | Sin motor/SQL/servicios de negocio nuevos, rutas globales ni estilos globales.                                                                                                                                             |
| Documento     | [`../modulos/nomina-mensual/nom-mensual-container-modular-01.md`](../modulos/nomina-mensual/nom-mensual-container-modular-01.md)                                                                                           |
| Siguiente     | Ajustar `proceso-mensual-container.spec.ts` al DOM con hijos; opcional: adelgazar facade moviendo mas computeds a rules.                                                                                                   |

## NOM-MENSUAL-WORKSPACE-UI-01 - Nomina mensual como workspace operativo

| Campo         | Estado                                                                                                                                                                                          |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Estado        | Implementada                                                                                                                                                                                    |
| Tipo          | UX/UI local + copy                                                                                                                                                                              |
| Alcance       | Reorienta la pantalla a `Nomina mensual`: generar nomina, revisar trabajadores, confirmar nomina y generar liquidaciones; refuerza que la nomina confirmada es base oficial para liquidaciones. |
| Restricciones | Sin SQL/RPC/RLS, motor, servicios, persistencia, rutas, mappers, estilos globales ni liquidaciones productivas nuevas.                                                                          |
| Documento     | [`../diseno/nom-mensual-workspace-ui-01.md`](../diseno/nom-mensual-workspace-ui-01.md)                                                                                                          |

## ERP-NOIA-UI-GUARDRAILS-01 - Guardia visual NOIA

| Campo         | Estado                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Estado        | Implementada (documental)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Tipo          | Diseño / gobernanza UI                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Alcance       | Centralizar reglas visuales obligatorias para Cursor/Codex: guardrails, tokens, layout, componentes, checklist; regla `.cursor/rules/erp-ui-visual-guardrails.mdc`.                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Restricciones | Sin Angular funcional, SQL, motor, servicios, persistencia ni estilos globales.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Documentos    | [`../diseno/noia-bases-sistema-referencia.md`](../diseno/noia-bases-sistema-referencia.md), [`../diseno/noia-ui-guardrails.md`](../diseno/noia-ui-guardrails.md), [`../diseno/noia-antipatrones-ia.md`](../diseno/noia-antipatrones-ia.md), [`../diseno/noia-prompt-cursor.md`](../diseno/noia-prompt-cursor.md), [`../diseno/noia-visual-tokens.md`](../diseno/noia-visual-tokens.md), [`../diseno/noia-layout-rules.md`](../diseno/noia-layout-rules.md), [`../diseno/noia-component-rules.md`](../diseno/noia-component-rules.md), [`../diseno/noia-ui-review-checklist.md`](../diseno/noia-ui-review-checklist.md) |

## NOM-PREPARAR-NOMINA-ESTADOS-VISUALES-PREMIUM-UX-01 - Estados visuales premium

| Campo         | Estado                                                                                                                                                               |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Estado        | Implementada                                                                                                                                                         |
| Tipo          | UX/UI local                                                                                                                                                          |
| Alcance       | Estados visuales por etapa, anti-redundancia, acta compacta, bandeja por contexto, evidencia neutra.                                                                 |
| Restricciones | Presentación en contenedor + acta; sin motor/SQL/servicios/estilos globales.                                                                                         |
| Documento     | [`../modulos/nomina-mensual/nom-preparar-nomina-estados-visuales-premium-ux-01.md`](../modulos/nomina-mensual/nom-preparar-nomina-estados-visuales-premium-ux-01.md) |

## NOM-PREPARAR-NOMINA-ACTA-DISENO-ESTRUCTURADO-UX-01 - Diseno estructurado del acta operativa

| Campo         | Estado                                                                                                                                                               |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Estado        | Implementada                                                                                                                                                         |
| Tipo          | UX/UI local                                                                                                                                                          |
| Alcance       | Reestructura visualmente el acta: header operativo, franja de contexto, decision, evidencia, alcance y modal operativo.                                              |
| Restricciones | Sin cambios de logica, persistencia, servicios, rutas, motor, SQL/RPC/RLS, estilos globales ni Liquidaciones oficiales.                                              |
| Documento     | [`../modulos/nomina-mensual/nom-preparar-nomina-acta-diseno-estructurado-ux-01.md`](../modulos/nomina-mensual/nom-preparar-nomina-acta-diseno-estructurado-ux-01.md) |

## NOM-PREPARAR-NOMINA-ACTA-ACCION-UX-01 - Acta operativa del periodo

| Campo         | Estado                                                                                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Estado        | Implementada                                                                                                                                                 |
| Tipo          | UX/UI local                                                                                                                                                  |
| Alcance       | Agrega acta operativa local en Preparar nomina con componente dedicado, regla pura de estado, evidencia para liquidaciones y confirmacion `app-message-box`. |
| Restricciones | Sin persistencia de actas, sin liquidaciones productivas, sin rutas, sin menu lateral, sin motor, SQL/RPC/RLS ni estilos globales.                           |
| Documento     | [`../modulos/nomina-mensual/nom-preparar-nomina-acta-accion-ux-01.md`](../modulos/nomina-mensual/nom-preparar-nomina-acta-accion-ux-01.md)                   |

## NOM-LIQ-ACTA-GUIADA-DESIGN-00 - Acta guiada Preparar nomina -> Liquidaciones

| Campo         | Estado                                                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Estado        | Documentada                                                                                                              |
| Tipo          | Diseno operativo/documental                                                                                              |
| Alcance       | Define actas guiadas por accion critica, matriz antes/despues y contrato para Preparar nomina y Liquidaciones oficiales. |
| Restricciones | Sin Angular, servicios, rutas, motor, SQL/RPC/RLS, estilos globales ni DataGrid compartido.                              |
| Documento     | [`../diseno/nom-liq-acta-guiada-design-00.md`](../diseno/nom-liq-acta-guiada-design-00.md)                               |

## NOM-PREPARAR-NOMINA-ADMIN-WORKSPACE-DESIGN-00 - Maqueta administrativa de Preparar nómina

| Campo         | Estado                                                                                                                                                               |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Estado        | Documentada                                                                                                                                                          |
| Tipo          | Diseño operativo/documental                                                                                                                                          |
| Alcance       | Define maqueta final: pantalla principal para decidir, revisión guiada para entender, modal grande para revisar, DataGrid para listar, panel de apoyo para corregir. |
| Restricciones | Sin Angular, servicios, rutas, motor, SQL/RPC/RLS, estilos globales ni DataGrid compartido.                                                                          |
| Documento     | [`../diseno/nom-preparar-nomina-admin-workspace-design-00.md`](../diseno/nom-preparar-nomina-admin-workspace-design-00.md)                                           |

## NOM-PREPARAR-NOMINA-ADMIN-WORKSPACE-UX-01 - Mesa administrativa de Preparar nómina

| Campo         | Estado                                                                                                                                       |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Estado        | Implementada                                                                                                                                 |
| Tipo          | UX/UI local                                                                                                                                  |
| Alcance       | Pantalla principal como mesa administrativa; modal grande de revisión con Guía + tabs; panel de apoyo separado por revisar/corregir/interno. |
| Restricciones | Contenedor local + documentación; sin DataGrid compartido, motor, SQL, servicios, rutas ni estilos globales.                                 |
| Documento     | [`../diseno/nom-preparar-nomina-admin-workspace-ux-01.md`](../diseno/nom-preparar-nomina-admin-workspace-ux-01.md)                           |

## NOM-PREPARAR-NOMINA-BITACORA-V3-CLIENT-SAFE-DATAGRID-UX-01 - Revisión segura y detalle con DataGrid

| Campo         | Estado                                                                                                                                               |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Estado        | Implementada                                                                                                                                         |
| Tipo          | UX/UI local                                                                                                                                          |
| Alcance       | Revisión guiada cliente-segura; detalle operativo en modal ancho con tabs y `app-data-grid`; información interna cerrada.                            |
| Restricciones | Contenedor local + documentación; sin DataGrid compartido, motor, SQL, servicios, rutas ni estilos globales.                                         |
| Documento     | [`../diseno/nom-preparar-nomina-bitacora-v3-client-safe-datagrid-ux-01.md`](../diseno/nom-preparar-nomina-bitacora-v3-client-safe-datagrid-ux-01.md) |

## NOM-PREPARAR-NOMINA-BITACORA-V3-NONLINEAR-FLOW-UX-01 - Mesa operativa no lineal

| Campo         | Estado                                                                                                                                   |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Estado        | Implementada                                                                                                                             |
| Tipo          | UX/UI local                                                                                                                              |
| Alcance       | Revisión guiada en modal; acta y panel livianos; registro en una línea; sin rehacer V3.                                                  |
| Restricciones | HTML/CSS + señal local en contenedor; sin motor/SQL/servicios/rutas.                                                                     |
| Documento     | [`../diseno/nom-preparar-nomina-bitacora-v3-nonlinear-flow-ux-01.md`](../diseno/nom-preparar-nomina-bitacora-v3-nonlinear-flow-ux-01.md) |

## NOM-PREPARAR-NOMINA-BITACORA-V3-STEPS-FOCUS-UX-01 - Bitácora de etapas enfocada

| Campo         | Estado                                                                                                                             |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Estado        | Implementada                                                                                                                       |
| Tipo          | UX/UI local                                                                                                                        |
| Alcance       | Resumen por etapa, subpasos progresivos solo activos, detalle bajo demanda.                                                        |
| Restricciones | HTML/CSS + VM presentación en contenedor; sin motor/SQL/servicios.                                                                 |
| Documento     | [`../diseno/nom-preparar-nomina-bitacora-v3-steps-focus-ux-01.md`](../diseno/nom-preparar-nomina-bitacora-v3-steps-focus-ux-01.md) |

## NOM-PREPARAR-NOMINA-BITACORA-V3-COPY-DENSITY-FIX-01 - Copy y densidad bitácora V3

| Campo         | Estado                                                                                                                                 |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Estado        | Implementada                                                                                                                           |
| Tipo          | UX/UI local + copy                                                                                                                     |
| Alcance       | Acentos, copy RRHH, densidad shell/acta/panel, revisión guiada cerrada al inicio, registro compacto.                                   |
| Restricciones | Contenedor + reglas de estado operativo (copy); sin lógica, motor, SQL ni estilos globales.                                            |
| Documento     | [`../diseno/nom-preparar-nomina-bitacora-v3-copy-density-fix-01.md`](../diseno/nom-preparar-nomina-bitacora-v3-copy-density-fix-01.md) |

## NOM-PREPARAR-NOMINA-BITACORA-V3-POLISH-UX-01 - Pulido bitácora V3 Preparar nómina

| Campo         | Estado                                                                                                                                                                           |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Estado        | Implementada                                                                                                                                                                     |
| Tipo          | UX/UI local                                                                                                                                                                      |
| Alcance       | Timeline de etapas, acta del período, panel de apoyo, resumen en grilla, copy con acentos; menos sensación wireframe.                                                            |
| Restricciones | Solo `proceso-mensual-container.html/css`; sin lógica, motor, servicios, SQL ni estilos globales.                                                                                |
| Documento     | [`../diseno/nom-preparar-nomina-bitacora-v3-polish-ux-01.md`](../diseno/nom-preparar-nomina-bitacora-v3-polish-ux-01.md), [`../peticiones-estilos.md`](../peticiones-estilos.md) |

## NOM-PREPARAR-NOMINA-BITACORA-V3-UX-01 - Bitácora operativa V3 Preparar nómina

| Campo         | Estado                                                                                                                                                                                     |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Estado        | Implementada                                                                                                                                                                               |
| Tipo          | UX/UI local                                                                                                                                                                                |
| Alcance       | Contenedor padre único; 5 etapas + subpasos; acta activa; detalle progresivo; revisión guiada en acordeón; registro compacto.                                                              |
| Restricciones | Solo `proceso-mensual-container.html/css`; sin lógica, motor, servicios, SQL ni estilos globales.                                                                                          |
| Documento     | [`../modulos/nomina-mensual/preparar-nomina/05-bitacora-v3-ux.md`](../modulos/nomina-mensual/preparar-nomina/05-bitacora-v3-ux.md), [`../peticiones-estilos.md`](../peticiones-estilos.md) |

## ERP-MSGBOX-NOIA-UX-01-FIX-02 - MessageBox decisión operativa NOIA

| Campo         | Estado                                                                                                                                               |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Estado        | Implementada                                                                                                                                         |
| Tipo          | UX/UI local                                                                                                                                          |
| Alcance       | `app-message-box` modal v3.1 neutro (sin bordes de color por variante); secciones compactas; footer izq/der; borrador inválido en Creación avanzada. |
| Restricciones | Sin estilos globales, SQL, motor, payloads ni servicios.                                                                                             |
| Documento     | [`../diseno/erp-msgbox-noia-ux-01.md`](../diseno/erp-msgbox-noia-ux-01.md), [`../peticiones-estilos.md`](../peticiones-estilos.md)                   |

## NOM-MOVIMIENTOS-MODAL-UX-02 - Modales contexto, calendario y retorno a gestión

| Campo         | Estado                                                                                                                                                                             |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Estado        | Implementada                                                                                                                                                                       |
| Tipo          | UX/UI local                                                                                                                                                                        |
| Alcance       | Modales movimiento del mes y recurrente: franja contexto, `app-calendar-input`, pie con Volver a gestión, toolbar en Gestionar sin pie duplicado.                                  |
| Restricciones | Sin SQL/RPC/RLS, motor, payloads, estilos globales ni servicios de negocio.                                                                                                        |
| Documento     | [`../orquestador/resumen-trabajo-movimientos-remuneracion.md`](../orquestador/resumen-trabajo-movimientos-remuneracion.md), [`../peticiones-estilos.md`](../peticiones-estilos.md) |

## NOM-MOVIMIENTOS-GESTION-TABLA-UNICA-01 - Grilla única en Gestionar

| Campo         | Estado                                                                                                                 |
| ------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Estado        | Implementada                                                                                                           |
| Tipo          | UX/UI local                                                                                                            |
| Alcance       | Modal Gestionar: una grilla unificada (mes + recurrentes), filtros chips, contadores con filtro preseleccionado.       |
| Restricciones | Sin SQL/RPC/RLS, motor, payloads, estilos globales ni servicios.                                                       |
| Documento     | [`../modulos/remuneraciones/movimientos-de-remuneracion.md`](../modulos/remuneraciones/movimientos-de-remuneracion.md) |

## DOCS-CODEX-MERGE-PRUNE-QUALITY-01

| Campo         | Estado                                                                                                                                            |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Estado        | Ejecutada                                                                                                                                         |
| Tipo          | Documentación / poda                                                                                                                              |
| Objetivo      | Reducir peso y ruido de `docs/codex` eliminando respaldos, assets antiguos y duplicados raíz, manteniendo documentos vivos y trazabilidad mínima. |
| Entrega       | Duplicados raíz eliminados; tests y prevalidaciones solo en `modulos/`; índices y flujos actualizados; entrada `movimientos-de-remuneracion.md`.  |
| Restricciones | Sin cambios en `src/`, `bd/`, Angular, SQL, motor, servicios, mappers, payloads ni estilos globales.                                              |
| Documento     | [`../CHANGELOG.md`](../CHANGELOG.md) (entrada DOCS-CODEX-MERGE-PRUNE-QUALITY-01)                                                                  |

## NOM-MOVIMIENTOS-GESTION-INTEGRAL-01 - Gestión integral por trabajador

| Campo         | Estado                                                                                                                                                                 |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Estado        | Implementada                                                                                                                                                           |
| Tipo          | UX/UI local + documentación                                                                                                                                            |
| Alcance       | `Movimientos de remuneración` opera como menú único para movimientos del mes y recurrentes por trabajador, con modal de gestión y formularios separados.               |
| Entrega       | Grilla por trabajador, detalle contextual de movimientos/recurrentes/revisión, alta mensual puntual, alta/edición/finalización recurrente dentro de la misma pantalla. |
| Restricciones | Sin SQL/RPC/RLS, sin motor, sin liquidaciones productivas, sin persistencia crítica, sin payloads nuevos, sin estilos globales y sin tests nuevos.                     |
| Documento     | [../modulos/remuneraciones/movimientos-remuneracion-simple.md](../modulos/remuneraciones/movimientos-remuneracion-simple.md)                                           |

## NOM-MOVIMIENTOS-MODAL-MENSUAL-UX-01 - Modal mensual compacto

| Campo         | Estado                                                                                                                                                 |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Estado        | Implementada                                                                                                                                           |
| Tipo          | UX/UI local                                                                                                                                            |
| Alcance       | Pulido del modal `Registrar movimiento del mes`: estructura vertical compacta, resumen inferior, copy con acentos y detalle administrativo secundario. |
| Restricciones | Sin SQL/RPC/RLS, sin motor, sin liquidaciones, sin persistencia critica, sin payloads productivos y sin estilos globales.                              |
| Documento     | [../modulos/remuneraciones/movimientos-remuneracion-simple.md](../modulos/remuneraciones/movimientos-remuneracion-simple.md)                           |

## NOM-MOVIMIENTOS-SIMPLE-00 - Movimientos de remuneracion

| Campo         | Estado                                                                                                                       |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Estado        | Documentada                                                                                                                  |
| Tipo          | Decision funcional/UX documental                                                                                             |
| Alcance       | Unificacion conceptual de Movimientos del mes y Asignaciones recurrentes bajo Movimientos de remuneracion.                   |
| Entrega       | Tres duraciones visibles: Solo este mes, Recurrente y En cuotas; auditoria de fuentes actuales y fases siguientes.           |
| Restricciones | Sin Angular, SQL/RPC/RLS, rutas, motor, liquidaciones, servicios productivos, mappers, payloads ni estilos globales.         |
| Documento     | [../modulos/remuneraciones/movimientos-remuneracion-simple.md](../modulos/remuneraciones/movimientos-remuneracion-simple.md) |

## PARAM-BITACORA-LAYOUT-ALIGN-01 v2 - Parametros cierre normativo

| Campo         | Estado                                                                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Estado        | Implementada                                                                                                                                     |
| Tipo          | UX local + documentacion                                                                                                                         |
| Alcance       | Pantalla Parametros: franja de cierre normativo, accion Configurar cliente, tabs compactos, lectura oficial vs cliente y filtros locales.        |
| Restricciones | Sin SQL/RPC/RLS, sin Python, sin wrapper, sin servicios/repositorios/mappers, sin rutas/guards, sin reconciliacion nueva y sin estilos globales. |
| Documento     | [../diseno/param-bitacora-layout-align-01.md](../diseno/param-bitacora-layout-align-01.md)                                                       |

## ERP-AUDIT-REPAIR-UX-01 - Auditoria integral + reparacion segura + mejora UX/UI controlada

| Campo            | Estado                                                                                                                                         |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Estado           | Implementada                                                                                                                                   |
| Tipo             | Reparacion UI local + tests + documentacion                                                                                                    |
| Alcance          | Nomina mensual / Preparar nomina; confirmaciones de guardar resultado preliminar, aprobar resultado y cerrar nomina.                           |
| Entrega          | `app-message-box` modal reemplaza `window.confirm`; las acciones criticas no persisten antes de confirmacion; spec del contenedor actualizado. |
| Pruebas          | `tsc app`, `tsc spec` y spec Angular del contenedor OK. Validacion completa registrada en documento de auditoria.                              |
| Fuera de alcance | SQL/RPC/RLS, motor, liquidaciones oficiales, LRE/Previred, estilos globales, configuracion Angular/Tailwind/PostCSS y otros modulos.           |
| Documento        | [`../auditorias/erp-audit-repair-ux-01.md`](../auditorias/erp-audit-repair-ux-01.md)                                                           |

## EMP-ALTA-VALIDACIONES-ASISTIDAS-01 - Validaciones visibles guiadas

| Campo                   | Estado                                                                                                                                                   |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Estado                  | Implementada en ZIP                                                                                                                                      |
| Tipo                    | Lógica local + UX de validaciones visibles                                                                                                               |
| Alcance                 | Creación avanzada; capa visible que consume aplicabilidad, coherencia y pendientes reales del formulario.                                                |
| Entrega                 | `empleado-alta-validaciones.rules.ts`, spec unitario, bloques inline por paso y sección `Revisión del alta` en Resumen final.                            |
| Pruebas                 | `tsc app`, vitest de la regla nueva; validación completa de fase documentada en entrega.                                                                 |
| Fuera de alcance        | SQL/RPC/RLS, motor, nómina, liquidaciones, LRE/Previred, ficha empleado, creación básica funcional, persistencia final de honorarios y estilos globales. |
| Siguiente fase sugerida | Trazabilidad formal de revisiones administrativas mantenidas, si el producto lo requiere.                                                                |

## EMP-ALTA-MSGBOX-ERROR-UX-01 - Mensajes de error estructurados

| Campo                   | Estado                                                                                                                      |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Estado                  | Implementada en ZIP                                                                                                         |
| Tipo                    | UX local + copy administrativo                                                                                              |
| Alcance                 | Modal de error de guardado en Creación de empleado; estructura visual basada en el mensaje de éxito.                        |
| Entrega                 | Error con `Qué revisar`, `Acción recomendada` y `Paso sugerido`; caso `Sin previsión` orienta a `Previsión y salud`.        |
| Pruebas                 | `tsc app/spec`, build development y vitest de reglas de empleados.                                                          |
| Fuera de alcance        | SQL/RPC/RLS, motor, nómina, liquidaciones, ficha empleado, creación básica funcional, reglas de aptitud y estilos globales. |
| Siguiente fase sugerida | `EMP-CONDICIONES-ESPECIALES-REVIEW-01` o pulido del resumen final como pantalla de decisión.                                |

## EMP-ALTA-DIAGNOSTICO-CONTRACTUAL-UX-01 - Diagnóstico contractual en Resumen final

| Campo                   | Estado                                                                                                                                    |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Estado                  | Implementada en ZIP                                                                                                                       |
| Tipo                    | UX local + copy de Resumen final                                                                                                          |
| Alcance                 | Creación avanzada; reemplaza la lectura visible de `Matriz de aplicabilidad` por `Diagnóstico contractual` sin eliminar la regla interna. |
| Entrega                 | Resumen final con `Caso detectado`, copy operativo y estilos locales sin `border-left` decorativo.                                        |
| Pruebas                 | `tsc app/spec`, build development y vitest de reglas de aplicabilidad/tipo trabajador/coherencia.                                         |
| Fuera de alcance        | SQL/RPC/RLS, motor, nómina, liquidaciones, LRE/Previred, ficha empleado, creación básica, honorarios final y estilos globales.            |
| Siguiente fase sugerida | `EMP-CONDICIONES-ESPECIALES-REVIEW-01` o pulido de MsgBox por caso contractual.                                                           |

## EMP-ALTA-COHERENCIA-GLOBAL-01 - Matriz única de aplicabilidad y coherencia

| Campo                   | Estado                                                                                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Estado                  | Implementada en ZIP                                                                                                                               |
| Tipo                    | Lógica local + UX de resumen                                                                                                                      |
| Alcance                 | Creación avanzada; matriz central para campos obligatorios, opcionales, derivados, no aplicables, en revisión, advertencia o bloqueados por fase. |
| Entrega                 | `empleado-alta-aplicabilidad.rules.ts`, spec unitario, consumo en wizard y bloque `Matriz de aplicabilidad` en Resumen final.                     |
| Pruebas                 | `tsc app/spec`, build development y vitest de reglas de aplicabilidad/tipo trabajador/coherencia.                                                 |
| Fuera de alcance        | SQL/RPC/RLS, motor, nómina, liquidaciones, LRE/Previred, ficha empleado, creación básica, persistencia final de honorarios y estilos globales.    |
| Siguiente fase sugerida | `EMP-CONDICIONES-ESPECIALES-REVIEW-01` para separar detectada/manual/pendiente/confirmada/descartada.                                             |

## Actualizacion 2026-05-12 - EMP-PERFIL-LABORAL-SQL-01

## EMP-ALTA-COHERENCIA-GLOBAL-00 - Auditoría de coherencia del alta avanzada

| Campo            | Estado                                                                                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Estado           | Documentada                                                                                                                                                              |
| Tipo             | Documentación técnica / matriz de decisión                                                                                                                               |
| Alcance          | Creación avanzada de empleados; relación laboral, tipo trabajador, contrato, jornada, Seguro de Cesantía, previsión/salud, banco, condiciones especiales y resumen final |
| Entrega          | `docs/codex/modulos/empleados/alta-coherencia-global-00.md`                                                                                                              |
| Decisión         | Próxima fase recomendada: `EMP-ALTA-COHERENCIA-GLOBAL-01`, matriz única de aplicabilidad y coherencia                                                                    |
| Fuera de alcance | Sin cambios Angular funcionales, SQL/RPC/RLS, motor, nómina, liquidaciones, LRE/Previred, ficha empleado, creación básica ni estilos globales                            |

| Fase                        | Estado                  | Resumen                                                                                                                                                                                                                                                                                               | Pruebas                                                                                                                                                       |
| --------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `EMP-PERFIL-LABORAL-SQL-01` | **Implementada en ZIP** | Base SQL para condiciones especiales del trabajador: nuevas tablas canonicas `tipo_condicion_trabajador` y `persona_condicion_trabajador`, seeds minimos, RLS/permisos locales y funcion `fn_obtener_perfil_laboral_persona` para derivar tramo de edad laboral y banderas previsionales por periodo. | Validacion estatica SQL/docs; `unzip -t` del entregable. No se ejecuto BD real ni `tsc` porque la fase no toca front y el ZIP base no incluye `node_modules`. |

## Actualizacion 2026-05-12 - EMP-ADV-LAYOUT-CONSISTENCY-01

| Fase                            | Estado                  | Resumen                                                                                                                                                                                                                                                                     | Pruebas                                                                                                                             |
| ------------------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `EMP-ADV-LAYOUT-CONSISTENCY-01` | **Implementada en ZIP** | Pulido visual local de Creacion avanzada sobre la base con Honorarios aplicado: mayor ancho util del wizard, mapa lateral mas compacto, alturas minimas menos artificiales, resumen final mas denso y grillas locales de Contrato/Bancario ajustadas solo en modo avanzado. | Validacion estatica de alcance; `unzip -t` del entregable. `tsc/build` no ejecutados por ausencia de `node_modules` en el ZIP base. |

## Actualizacion 2026-05-12 - EMP-ADV-HONORARIOS-UX-01

| Fase                       | Estado                  | Resumen                                                                                                                                                                                                                                          | Pruebas                                                                                                                                                                                                    |
| -------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `EMP-ADV-HONORARIOS-UX-01` | **Implementada en ZIP** | Creacion avanzada trata `Boleta de honorarios` como modo visual controlado: confirma el cambio, oculta o marca no aplicables campos dependientes, permite borrador y bloquea finalizar alta como trabajador dependiente hasta persistencia real. | `npx tsc -p tsconfig.app.json --noEmit`; `npx tsc -p tsconfig.spec.json --noEmit`; `npx ng build --configuration development`. Build productivo queda sujeto a disponibilidad de Google Fonts; sin SQL/BD. |

# Estado de fases del proyecto

## 1. Propósito

Tablero **vivo** (a actualizar al cerrar fases) con: qué está **cerrado**, qué **sigue**, qué módulos están **congelados** o **pendientes**, y enlaces a documentos y pruebas relevantes. Complementa [`contexto-proyecto.md`](./contexto-proyecto.md).

## 2. Tabla de fases

| Fase                                     | Estado      | Resumen                                                                                                                                                          | Documentos                                                                                                                                                                                                                                                                                                                       | Pruebas (referencia)                                                |
| ---------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| ORDEN-01 - Integracion final del roadmap | **Cerrada** | Roadmap oficial integrado. SEG-01 queda como siguiente fase oficial; CONC-02 despues de SEG-01; MOTOR-00 obligatorio antes de cualquier implementacion de motor. | [`roadmap-operativo.md`](./roadmap-operativo.md), [`dependencias-fases.md`](./dependencias-fases.md), [`criterios-cierre-fases.md`](./criterios-cierre-fases.md), [`orden-prioridades.md`](./orden-prioridades.md), [`mapa-documentacion.md`](./mapa-documentacion.md), [`matriz-roles-permisos.md`](./matriz-roles-permisos.md) | Validacion documental; sin codigo, SQL, Python, UI ni tests nuevos. |

| SEG-01 - Roles, permisos, JWT/RLS base | **En definicion** | Matriz documental de roles, permisos, acciones criticas, capas UI/service/BD-JWT-RLS y bloqueos por fase futura. No implementa permisos reales todavia. | [`matriz-roles-permisos.md`](./matriz-roles-permisos.md), [`criterios-cierre-fases.md`](./criterios-cierre-fases.md), [`dependencias-fases.md`](./dependencias-fases.md) | Validacion documental; sin codigo, SQL, Python, UI ni tests nuevos. |

Tabla historica:

| Fase                                                         | Estado                                  | Resumen                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Documentos                                                                                                                                                                                                                                                                                                                                       | Pruebas (referencia)                                                                                                                                                         |
| ------------------------------------------------------------ | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REM-UX-FLOWS-01 V3 - Visibilidad cliente vs aplicacion       | **Cerrada**                             | Remuneraciones separa estado/accion visible para usuario final de trazabilidad tecnica: `Preparar nomina` usa etapas de negocio y `Liquidaciones oficiales` baja la trazabilidad al detalle secundario. Sin cambios de motor, SQL ni salidas externas.                                                                                                                                                                                                                                          | [`../modulos/nomina-mensual/README.md`](../modulos/nomina-mensual/README.md), [`../modulos/liquidaciones-oficiales/README.md`](../modulos/liquidaciones-oficiales/README.md), [`../peticiones-estilos.md`](../peticiones-estilos.md)                                                                                                             | `npx ng test --watch=false`; `npm run build`                                                                                                                                 |
| 0 — Contrato Codex / `docs/codex`                            | **Cerrada**                             | `AGENTS.md`, README, manual base, guías UI/form/tablas/estilos, **`modulos/`** + `temas/`. Regla: leer orquestador + módulo antes de implementar.                                                                                                                                                                                                                                                                                                                                               | [`AGENTS.md`](../AGENTS.md), [`README.md`](../README.md), [`manual-base-proyecto.md`](../manual-base-proyecto.md), [`ui-form-guidelines.md`](../ui-form-guidelines.md), [`ui-tables.md`](../ui-tables.md), [`estilos/README.md`](../estilos/README.md), [`mapa-documentacion.md`](./mapa-documentacion.md)                                       | —                                                                                                                                                                            |
| 1 — Parámetros / período / vigencia / catálogo               | **Cerrada**                             | Período activo; mensual vs vigencia vs catálogo global; estado oficial del período; UI estabilizada; reforma/gradualidad; DataGrid y empty states; tabs/subtabs.                                                                                                                                                                                                                                                                                                                                | [`periodo-vigencia-catalogo.md`](../modulos/parametros/periodo-vigencia-catalogo.md), [`ui-parametros.md`](../modulos/parametros/ui-parametros.md), [`reforma-gradualidad.md`](../modulos/parametros/reforma-gradualidad.md), [`campos-y-listas.md`](../modulos/parametros/campos-y-listas.md)                                                   | E2E/UI según módulo Parámetros en repo                                                                                                                                       |
| 2 — Python / BD v11 / carga mensual                          | **Cerrada** (pendientes no bloqueantes) | Python v6.11; gradualidad 8,5 %; tablas alineadas a `(código, período)`; modo preparar sin datos oficiales falsos; carga mensual oficial separada.                                                                                                                                                                                                                                                                                                                                              | [`python-carga-mensual.md`](../modulos/parametros/python-carga-mensual.md), [`../../../bd/base/v11/README.md`](../../../bd/base/v11/README.md)                                                                                                                                                                                                   | Validaciones SQL v11 cuando haya BD local; scripts Python según doc                                                                                                          |
| 3 — Empleados: estados y aptitud                             | **Cerrada**                             | BORRADOR = wizard avanzado; EN_PROCESO = ficha; ACTIVO + apto = remuneraciones; `paso_alta_avanzada` manda “Continuar alta”; sin activar con defaults técnicos.                                                                                                                                                                                                                                                                                                                                 | [`contrato-general.md`](../modulos/empleados/contrato-general.md)                                                                                                                                                                                                                                                                                | Unit + E2E empleados según [`borrador-continuar-alta.md`](../modulos/empleados/borrador-continuar-alta.md) y [`tests-empleados.md`](../modulos/empleados/tests-empleados.md) |
| 4 — Helper completitud / aptitud                             | **Cerrada**                             | `evaluarCompletitudYAptitudEmpleado` en `empleado-completitud.rules.ts`; bloqueos y defaults técnicos explícitos.                                                                                                                                                                                                                                                                                                                                                                               | [`contrato-general.md`](../modulos/empleados/contrato-general.md) (sección helper)                                                                                                                                                                                                                                                               | `empleado-completitud.rules` (unit)                                                                                                                                          |
| 5 — Listado y Ficha con helper                               | **Cerrada**                             | CTAs por estado en listado; ficha con panel compacto (estado, aptitud, pendientes, acción); adapter al helper.                                                                                                                                                                                                                                                                                                                                                                                  | [`listado.md`](../modulos/empleados/listado.md), [`ficha-empleado.md`](../modulos/empleados/ficha-empleado.md), [`contrato-general.md`](../modulos/empleados/contrato-general.md)                                                                                                                                                                | `ficha-empleado-container`, listado (unit); Playwright empleados UI                                                                                                          |
| 6 — Selects vacíos / sin autoselección                       | **Cerrada**                             | Opción vacía; sin primer catálogo como elección; defaults no cuentan como selección real.                                                                                                                                                                                                                                                                                                                                                                                                       | Módulo Empleados + formularios; [`ui-form-guidelines.md`](../ui-form-guidelines.md)                                                                                                                                                                                                                                                              | Unit form/orchestrator según repo                                                                                                                                            |
| 7 — Rehidratación borrador avanzado                          | **Cerrada**                             | DRAFT-\*, Sin cargo, sueldo 0, APVI incompleto no como reales; paso 9 con pendientes reales.                                                                                                                                                                                                                                                                                                                                                                                                    | [`borrador-continuar-alta.md`](../modulos/empleados/borrador-continuar-alta.md), [`contrato-general.md`](../modulos/empleados/contrato-general.md)                                                                                                                                                                                               | `empleado-borrador-hidratacion` (unit); E2E opcionales con `E2E_EMPLEADOS_BORRADOR`                                                                                          |
| 8 — Validar para remuneraciones (Ficha)                      | **Cerrada**                             | Opción B: ficha completa **no** apta sola; CTA **Validar para remuneraciones**; confirmación; `EmpleadosRepository.validarFichaParaRemuneraciones` reevalúa helper y persiste solo `persona` (`VALIDO`, `apto_para_remuneraciones`, `ACTIVO` si aplica, `fecha_activacion`, `paso_alta_avanzada` null). Condiciones UI y exclusiones: [`validar-remuneraciones.md`](../modulos/empleados/validar-remuneraciones.md) y §21 de [`contrato-general.md`](../modulos/empleados/contrato-general.md). | [`validar-remuneraciones.md`](../modulos/empleados/validar-remuneraciones.md)                                                                                                                                                                                                                                                                    | Unit: `ficha-empleado-container.spec.ts`, `empleados.service.spec.ts`; E2E ficha opcional según entorno                                                                      |
| 9 — Conceptos: diagnóstico, contrato y decisiones operativas | **Cerrada** (documental)                | Inventario de ruta `/remuneraciones/conceptos`, contenedor, servicio/repositorio, tablas `concepto` / `catalogo_lre` / `regla_concepto_calculo`, RLS y seeds Python; **contrato funcional** y **decisiones operativas** (permisos, asignables, LRE, vigencias, baja). Brechas de implementación: JWT/roles, RLS productivo, UI de reglas, E2E ruta (Fase 9.2).                                                                                                                                  | [`diagnostico-fase-9.md`](../modulos/conceptos-remuneracion/diagnostico-fase-9.md), [`decisiones-operativas.md`](../modulos/conceptos-remuneracion/decisiones-operativas.md), [`contrato-funcional.md`](../modulos/conceptos-remuneracion/contrato-funcional.md), [`contrato-general.md`](../modulos/conceptos-remuneracion/contrato-general.md) | Ver [`contrato-funcional.md`](../modulos/conceptos-remuneracion/contrato-funcional.md) §8; snapshot `/remuneraciones/conceptos` pendiente en `tests/dashboard.spec.ts`       |

## 3. Fases cerradas (lista corta)

0–8 según tabla; **9** cerrada en alcance **documental** (diagnóstico + contrato funcional + **decisiones operativas**). El frente **Conceptos** sigue abierto en implementación/pruebas hasta cerrar brechas de Fase **9.2** (JWT/RLS, alineación listados, E2E, etc.).

## 4. Fase actual / siguiente

**Fase fuerte Conceptos (implementación — 9.2):** **9.2A** cerró listado base (grilla, filtros, `esConceptoAsignable`, smoke E2E `tests/conceptos-remuneracion-listado.spec.ts`). **9.2B** cerró **detalle por Revisar** (modal, `concepto-acciones.rules.ts`, blindaje en grilla). **9.2C** alineó **Haberes y descuentos** al catálogo: `listarConceptos` y validación de alta/edición usan la **misma regla central** que Conceptos; tests unit en `haberes-descuentos.service.spec.ts`. **Siguiente** en 9.2: roles/JWT, `APORTE` solo Admin, RLS, reglas de cálculo en UI, E2E visual ampliado. Brechas: [`diagnostico-fase-9.md`](../modulos/conceptos-remuneracion/diagnostico-fase-9.md) §8, [`decisiones-operativas.md`](../modulos/conceptos-remuneracion/decisiones-operativas.md) §10–§11, [`contrato-funcional.md`](../modulos/conceptos-remuneracion/contrato-funcional.md) §4–§11. Punto de entrada: [`../modulos/conceptos-remuneracion/README.md`](../modulos/conceptos-remuneracion/README.md). Marco UX: [`diseno-operativo-erp.md`](./diseno-operativo-erp.md) §6. Contexto: [`contexto-proyecto.md`](./contexto-proyecto.md) §10 y §12.

**Haberes y descuentos 9.3A-9.3C:** cerradas. Quedan implementadas vigencias/duplicados recurrentes, cierre/desactivacion controlada y vista historica con filtro de estado derivado. **Fase 9.3B.1** normalizo rutas y menu del dominio Remuneraciones bajo `/remuneraciones/*` (ver seccion dedicada abajo). **Fase 9.4A** cerro el **contrato documental** de **Movimientos variables mensuales** (separacion de recurrentes y de Conceptos; sin SQL ni UI productiva). **Fase 9.4B** agrego **modelo TypeScript y reglas puras** con tests unitarios (sin CRUD productivo ni SQL). **Fase 9.4C** agrego **DDL no destructivo** (`movimiento_variable_mensual`), script incremental `14_*.sql`, **repositorio y mappers** con validacion alineada a 9.4B (sin UI productiva, sin RLS, sin motor). **Fase 9.4D** agrego **`MovimientosVariablesService`** (capa fina sobre el repository, listado base como filas, tests con mock). **Fase 9.4E** agrego **UI de carga manual controlada** bajo `/remuneraciones/movimientos-variables` (listado por periodo, alta manual, anulacion con confirmacion; sin repository en UI). **CHILE-FIX-01** endurecio **crear/actualizar**: concepto desde catalogo (`HaberesDescuentosService`) y aptitud/contrato en periodo (`EmpleadosService`); ver [`../modulos/movimientos-variables/hardening-chile-fix-01.md`](../modulos/movimientos-variables/hardening-chile-fix-01.md) y seguimiento en [`../auditorias/qa-chile-01-remuneraciones.md`](../auditorias/qa-chile-01-remuneraciones.md). **PARAM-CHILE-01** limpio la UI de **Proceso mensual** frente a datos normativos demo (**ALTO-004**); informe [`../auditorias/param-chile-01-parametros-y-demo-proceso.md`](../auditorias/param-chile-01-parametros-y-demo-proceso.md). **Fase 9.5A** agrego **prevalidaciones** de proceso mensual (`ProcesoMensualService`, reglas puras, UI minima con lectura real vía servicios existentes; sin motor ni liquidaciones); ver [`../modulos/nomina-mensual/prevalidaciones-9-5A.md`](../modulos/nomina-mensual/prevalidaciones-9-5A.md). **Fase 9.5B** agrego **haberes recurrentes** filtrados al `YYYY-MM`, **grupos minimos de parametros** (`listarCatalogos` + `revisarGruposParametrosMinimos`) y resumen en contenedor; ver [`../modulos/nomina-mensual/prevalidaciones-9-5B.md`](../modulos/nomina-mensual/prevalidaciones-9-5B.md). Punto de entrada movimientos variables: [`../modulos/movimientos-variables/README.md`](../modulos/movimientos-variables/README.md). Punto de entrada proceso mensual: [`../modulos/nomina-mensual/README.md`](../modulos/nomina-mensual/README.md). Siguiente segun roadmap: `SEG-01 -> CONC-02 -> MOTOR-00 -> MOTOR-01 -> LIQ-01`. Auditoria/roles/RLS, edicion/importacion masiva de MV y motor quedan subordinados a ese orden.

## 5. Pendientes técnicos no bloqueantes

- Versionar carpeta Python explícitamente en doc/repo si aplica.
- Ejecutar validaciones SQL **v11** cuando haya PostgreSQL local / `psql`.
- No regenerar monolito legacy sin decisión explícita.
- Revisión futura AFP vs `AFP_VIGENCIA` para convergencia UI/fuente.

## 6. Pendientes visuales

Registrar en [`peticiones-estilos.md`](../peticiones-estilos.md) cuando haya cambio visual acordado; no usar el orquestador como bitácora visual.

## 7. Módulos futuros (post fases 0–8 cerradas)

- **Conceptos de remuneracion** — frente funcional importante, pero queda ordenado despues de **SEG-01**. Fase **9 documental** cerrada (diagnostico + contrato + decisiones operativas). La siguiente fase de conceptos es **CONC-02 - Conceptos gobernados para motor**, no antes de cerrar roles/permisos base. README y contratos: [`../modulos/conceptos-remuneracion/README.md`](../modulos/conceptos-remuneracion/README.md).
- **Haberes y descuentos** (refuerzo de reglas y UI).
- **Movimientos variables** — **9.4A** documental, **9.4B** modelo TS + reglas, **9.4C** SQL + repositorio, **9.4D** service fino y **9.4E** UI carga manual bajo `/remuneraciones/movimientos-variables` cerradas en alcance acordado; [`../modulos/movimientos-variables/README.md`](../modulos/movimientos-variables/README.md).
- **Proceso mensual**, **motor**, **liquidaciones**, **Previred**, **LRE** — ver [`contexto-proyecto.md`](./contexto-proyecto.md) secciones 10–12 y 15.
- **Arquitectura frontend Angular** — contrato [`../arquitectura/frontend-interfaces.md`](../arquitectura/frontend-interfaces.md): paginas wrapper en `pages/`, pantallas en `features/*/containers/`; paginas legacy con UI inline son deuda hasta migracion por fase.

### Fase 9.3A - Haberes y descuentos: vigencias, duplicados y reglas recurrentes

Estado: **Cerrada**.

Objetivo: validar asignaciones recurrentes por trabajador y concepto, bloqueando duplicados activos, rangos superpuestos y vigencias incoherentes.

Resultado: crear y actualizar asignaciones pasan por validacion central de concepto asignable y por validacion propia de vigencia/solapamiento recurrente. La edicion ignora la misma asignacion por `idAsignacion` para no autoboquearse.

No incluido: motor, liquidaciones, nomina mensual, movimientos variables, SQL destructivo, login, JWT/RLS ni rediseno visual profundo.

Pruebas: `haber-descuento-vigencia.rules.spec.ts`, `haberes-descuentos.service.spec.ts`, `npm test -- --watch=false`.

### Fase 9.3B - Haberes y descuentos: cierre/desactivacion controlada de asignaciones

Estado: **Cerrada**.

Objetivo: permitir cerrar o desactivar asignaciones recurrentes sin eliminacion fisica, conservando historial y validando coherencia de fechas/estado.

Resultado: las asignaciones recurrentes pueden terminarse de forma controlada mediante cierre/desactivacion logica. La operacion no borra historial, bloquea cierres invalidos, bloquea doble cierre, no exige que el concepto siga siendo asignable hoy y reutiliza la clasificacion de vigencia del modulo.

No incluido: delete fisico normal, auditoria avanzada, motor, liquidaciones, nomina mensual, movimientos variables, SQL destructivo, login, JWT/RLS ni rediseno visual profundo.

Pruebas: `haber-descuento-vigencia.rules.spec.ts`, `haberes-descuentos.service.spec.ts`, `npm test -- --watch=false`.

### Fase 9.3B.1 - Remuneraciones: normalizar rutas y menu del dominio

Estado: **Cerrada**.

Objetivo: que Conceptos, Haberes y descuentos, Proceso mensual y Liquidaciones compartan el mismo prefijo de rutas bajo `/remuneraciones/*`, con menu lateral y enlaces internos alineados; mantener rutas antiguas solo como redirects temporales.

Resultado: rutas oficiales `/remuneraciones/conceptos`, `/remuneraciones/haberes-descuentos`, `/remuneraciones/proceso-mensual`, `/remuneraciones/liquidaciones`, `/remuneraciones/liquidaciones/:id`. Redirects `/haberes-descuentos`, `/proceso-remuneraciones`, `/liquidaciones`, `/liquidaciones/:id` -> destinos oficiales. Sidebar y pruebas visuales de `tests/dashboard.spec.ts` usan rutas oficiales.

No incluido: reglas de negocio nuevas, filtros historicos adicionales, movimientos variables, motor, liquidaciones funcionales nuevas, SQL destructivo, login, JWT/RLS, reorganizacion fisica de carpetas `features`, rediseno visual profundo.

Pruebas: `npm test -- --watch=false`; E2E nuevo no obligatorio (normalizacion de rutas).

### Fase 9.3C - Haberes y descuentos: vista historica y filtros por vigencia

Estado: **Cerrada**.

Objetivo: exponer las asignaciones recurrentes como vista operativa por defecto y como historial consultable mediante filtros de estado de vigencia derivados.

Resultado: `HaberesDescuentosService.listarPorPersona` deriva `estadoVigencia` y `estadoVigenciaEtiqueta` con `clasificarVigenciaAsignacion`. La grilla usa filtro por estado (`OPERATIVAS`, `TODAS`, `ACTIVA`, `FUTURA`, `VENCIDA`, `CERRADA`, `INVALIDA`), con `OPERATIVAS = ACTIVA + FUTURA` como default visual. Las filas cerradas, vencidas e invalidas quedan disponibles como historial, sin accion de cierre y sin edicion operativa desde la grilla.

No incluido: motor, liquidaciones, nomina mensual, movimientos variables, auditoria avanzada, SQL destructivo, login, JWT/RLS ni rediseno visual profundo.

Pruebas: `haber-descuento-vigencia.rules.spec.ts`, `haberes-descuentos.service.spec.ts`, `npm test -- --watch=false`.

### Fase 9.4A - Movimientos variables mensuales: contrato funcional y separacion desde recurrentes

Estado: **Cerrada** (alcance **documental**).

Objetivo: definir contrato funcional de movimientos variables mensuales y separarlos de Conceptos (catalogo), Haberes recurrentes, Proceso mensual, Motor y Liquidaciones.

Resultado: queda documentado que los movimientos variables son registros puntuales por trabajador, concepto y periodo `YYYY-MM`; no reemplazan recurrentes; no calculan liquidaciones; seran entrada futura del Proceso mensual solo en estado **VALIDADO** (o equivalente). Estados, validaciones, duplicados v1, anulacion vs delete fisico y ruta planificada `/remuneraciones/movimientos-variables` en [`../modulos/movimientos-variables/`](../modulos/movimientos-variables/README.md).

No incluido: UI completa, CRUD productivo, SQL, migraciones, Supabase remoto, motor, liquidaciones, Previred/LRE, login, JWT/RLS, rediseno visual profundo.

Pruebas: no aplica cambio de codigo en esta fase; ejecutar `npm test` solo si hubo modificaciones de codigo en el mismo entregable.

### Fase 9.4B - Movimientos variables: modelo TypeScript y validaciones puras

Estado: **Cerrada**.

Objetivo: materializar tipos de dominio y helpers de validacion alineados al contrato 9.4A y a [`../modulos/movimientos-variables/decisiones-operativas.md`](../modulos/movimientos-variables/decisiones-operativas.md), antes de UI productiva y sin acoplarse a `concepto-asignabilidad.rules.ts` (validacion opcional por snapshot de concepto).

Resultado: carpeta `src/app/features/movimientos-variables/` con `models/movimiento-variable.model.ts`, `rules/movimiento-variable-validacion.rules.ts` y spec asociado; anexo técnico [`../modulos/movimientos-variables/modelo-tecnico-9-4B.md`](../modulos/movimientos-variables/modelo-tecnico-9-4B.md).

No incluido: SQL, migraciones, Supabase remoto, pantalla productiva, motor, liquidaciones, proceso mensual productivo, JWT/RLS, importadores masivos.

Pruebas: `movimiento-variable-validacion.rules.spec.ts`, `npm test -- --watch=false`.

### Fase 9.4C - Movimientos variables mensuales: SQL no destructivo y repositorio base antes de UI

Estado: **Cerrada**.

Objetivo: preparar persistencia local no destructiva y repositorio base para movimientos variables mensuales antes de implementar UI productiva.

Resultado: queda definido SQL no destructivo para `movimiento_variable_mensual` en `bd/base/v11/partes/02_tablas.sql` (y monolito integrado), script incremental idempotente `bd/base/v11/partes/14_movimiento_variable_mensual.sql`, `MovimientosVariablesRepository`, mappers, tipos manuales en `database.types.ts`, y documento de persistencia [`../modulos/movimientos-variables/persistencia-9-4C.md`](../modulos/movimientos-variables/persistencia-9-4C.md). La UI productiva, servicio con snapshot de catálogo, RLS, Supabase remoto, motor y liquidaciones quedan fuera de alcance.

No incluido: pantalla productiva, CRUD visual, motor, liquidaciones, proceso mensual productivo, Supabase remoto, RLS/JWT, SQL destructivo ni rediseno visual.

Pruebas: `movimientos-variables.mapper.spec.ts`, `movimiento-variable-validacion.rules.spec.ts`, `npm test -- --watch=false`.

### Fase 9.4D - Movimientos variables mensuales: service fino y listado base sin UI avanzada

Estado: **Cerrada**.

Objetivo: crear una capa de service fina para movimientos variables que centralice validaciones, duplicados, anulacion logica y acceso al repository antes de una UI productiva.

Resultado: `MovimientosVariablesService` en `src/app/features/movimientos-variables/services/` con tests `movimientos-variables.service.spec.ts`; listados como `MovimientoVariableListadoFila`; payload opcional `concepto` para snapshot sin acoplar a `concepto-asignabilidad.rules.ts`; documento [`../modulos/movimientos-variables/service-9-4D.md`](../modulos/movimientos-variables/service-9-4D.md). La pantalla productiva, grid avanzado, proceso mensual, motor, liquidaciones, Supabase remoto, RLS/JWT y rediseno visual quedan fuera.

No incluido: pantalla productiva, formulario visual, datagrid avanzado, proceso mensual, motor, liquidaciones, Supabase remoto, RLS/JWT, rediseno visual.

Pruebas: `movimientos-variables.service.spec.ts`, suites 9.4B/9.4C, `npm test -- --watch=false`.

### Fase 9.4E - Movimientos variables mensuales: UI carga manual controlada

Estado: **Cerrada**.

Objetivo: exponer listado y operaciones manuales de movimientos variables por periodo sin acoplar la UI al repositorio ni al motor.

Resultado: ruta `/remuneraciones/movimientos-variables` (lazy), item en menu lateral, contenedor con filtro `YYYY-MM`, `DataGrid`, alta por modal (`MovimientosVariablesService.crear` con `origen: MANUAL` y snapshot de concepto), anulacion con confirmacion y motivo opcional (`anular`), catalogos via `EmpleadosService.listar` y `HaberesDescuentosService.listarConceptos`. Redirect `/movimientos-variables` a la ruta oficial. Referencia cruzada en pantalla Haberes y descuentos. Documento [`../modulos/movimientos-variables/ui-9-4E.md`](../modulos/movimientos-variables/ui-9-4E.md).

No incluido: edicion de filas existentes en esta fase, importacion masiva, motor, liquidaciones, bloqueo duro por periodo cerrado en UI, RLS/JWT, SQL destructivo.

Pruebas: `movimientos-variables-container.spec.ts`, suites 9.4B/9.4C/9.4D, `npm test -- --watch=false`.

### CHILE-FIX-01 - Movimientos variables: catalogo + aptitud/contrato (QA-CHILE-01 ALTO-001, ALTO-002)

Estado: **Cerrada** (Angular; sin motor, liquidaciones, SQL destructivo, RLS/JWT, Previred/LRE, rediseno visual).

Objetivo: que `MovimientosVariablesService.crear` y `actualizar` no dependan de `payload.concepto` para candados; que rechacen trabajadores no aptos, no activos o sin contrato vigente en el `YYYY-MM` del movimiento.

Resultado: metodo publico `HaberesDescuentosService.resolverSnapshotConceptoParaMovimientoVariableManual`; servicio de movimientos variables inyecta `HaberesDescuentosService` y `EmpleadosService`. Documento normativo: [`../modulos/movimientos-variables/hardening-chile-fix-01.md`](../modulos/movimientos-variables/hardening-chile-fix-01.md). Seguimiento en informe QA: [`../auditorias/qa-chile-01-remuneraciones.md`](../auditorias/qa-chile-01-remuneraciones.md) seccion 17.

No incluido: periodo cerrado a carga, flag catalogo solo variable vs recurrente (ALTO-003), RLS, motor.

Pruebas: `haberes-descuentos.service.spec.ts`, `movimientos-variables.service.spec.ts`, `npm test -- --watch=false`.

### PARAM-CHILE-01 - Auditoria de parametros reales y limpieza de datos demo en proceso mensual

Estado: **Cerrada** (Angular + documentacion; sin motor, liquidaciones, Previred/LRE generados, SQL destructivo, migraciones, Supabase remoto, Python nuevo, RLS/JWT, rediseno visual profundo).

Objetivo: mitigar **QA-CHILE-01-ALTO-004**; auditar cobertura declarativa de parametros chilenos vs pantalla Proceso mensual; quitar cifras normativas demo de `proceso-remuneraciones.page.ts`.

Resultado: pagina Proceso mensual con copy neutro, sin UF/sueldo minimo/tabla 2026/totales literales; enlace a `/parametros`; pasos calculo/exportacion/cierre marcados como no disponibles. UI en `src/app/features/nomina-mensual/containers/proceso-mensual-container/`; ruta `proceso-remuneraciones.page.ts` solo wrapper. Informe [`../auditorias/param-chile-01-parametros-y-demo-proceso.md`](../auditorias/param-chile-01-parametros-y-demo-proceso.md). Seguimiento ALTO-004 en [`../auditorias/qa-chile-01-remuneraciones.md`](../auditorias/qa-chile-01-remuneraciones.md) seccion 18.

No incluido: lectura de parametros desde proceso, motor, liquidaciones, generacion Previred/LRE real.

Pruebas: `npm test -- --watch=false` (suite global; sin spec dedicado de la pagina).

### Fase 9.5A - Proceso mensual chileno: contrato funcional y prevalidaciones

Estado: **Cerrada** (Angular + documentacion; sin motor, liquidaciones, Previred/LRE, SQL destructivo, Supabase remoto, Python nuevo, RLS/JWT, rediseno visual profundo).

Objetivo: contrato funcional y primera capa de **prevalidaciones** por `YYYY-MM` usando servicios existentes (parametros, empleados, conceptos, movimientos variables); sin calcular montos ni generar liquidaciones.

Resultado: `ProcesoMensualService`, `proceso-mensual-prevalidacion.rules.ts`, modelos TS, tests; contenedor con selector de periodo, accion **Validar periodo**, paneles de estado/bloqueos/advertencias/informaciones y areas. Documentos [`../modulos/nomina-mensual/contrato-general.md`](../modulos/nomina-mensual/contrato-general.md) y [`../modulos/nomina-mensual/prevalidaciones-9-5A.md`](../modulos/nomina-mensual/prevalidaciones-9-5A.md). Haberes recurrentes por periodo queda **PENDIENTE_INTEGRACION** (mensaje INFO).

No incluido: motor, liquidaciones, Previred/LRE, lectura agregada de recurrentes por periodo, bloqueo BD de periodo.

Pruebas: `proceso-mensual-prevalidacion.rules.spec.ts`, `proceso-mensual.service.spec.ts`, `proceso-mensual-container.spec.ts`, `npm test -- --watch=false`.

### Fase 9.5B - Proceso mensual: recurrentes por mes y grupos minimos de parametros

Estado: **Cerrada** (Angular + documentacion; sin motor, liquidaciones, Previred/LRE, SQL destructivo, Supabase remoto, Python nuevo, RLS/JWT, rediseno visual profundo).

Objetivo: completar prerequisitos de **9.5A** con lectura real de **asignaciones recurrentes** intersectadas con el mes (`HaberesDescuentosService.listarAsignacionesParaPrevalidacionMensual`) y con **catalogos + fila mensual** clasificados en grupos (`revisarGruposParametrosMinimos`), sin mostrar valores normativos en UI ni simular OK sin datos.

Resultado: repositorio `listarTodasAsignacionesConConcepto`, reglas `proceso-mensual-parametros-minimos.rules.ts` y `proceso-mensual-recurrentes.rules.ts`, extension de `proceso-mensual-prevalidacion.rules.ts` y `ProcesoMensualService` (incluye `listarCatalogos`); bloqueo si hay recurrentes **INVALIDAS** o error de lectura; resumen con `parametrosGrupos` y conteos de recurrentes en contenedor. Documento [`../modulos/nomina-mensual/prevalidaciones-9-5B.md`](../modulos/nomina-mensual/prevalidaciones-9-5B.md); contrato general y 9.5A actualizados con enlaces.

No incluido: motor, liquidaciones, Previred/LRE, bloqueo duro de periodo en BD, importacion masiva de movimientos variables.

Pruebas: `proceso-mensual-parametros-minimos.rules.spec.ts`, `proceso-mensual-recurrentes.rules.spec.ts`, suites 9.5A (`proceso-mensual-prevalidacion.rules.spec.ts`, `proceso-mensual.service.spec.ts`, `proceso-mensual-container.spec.ts`), `haberes-descuentos.service.spec.ts` (bloque recurrentes), `npx ng test --watch=false`.

### QA-CHILE-01 - Auditoria remuneraciones Chile (documental)

Estado: **Cerrada** (entrega de informe; sin cambios de codigo, SQL, Python ni Supabase remoto).

Objetivo: revisar el proyecto bajo enfoque chileno (conceptos, recurrentes, variables, parametros, empleados, proceso/liquidacion futuros, Previred/LRE) y priorizar brechas.

Resultado: informe [`../auditorias/qa-chile-01-remuneraciones.md`](../auditorias/qa-chile-01-remuneraciones.md) e indice [`../auditorias/README.md`](../auditorias/README.md). Siguientes pasos sugeridos en el informe (p. ej. CHILE-FIX-01, PARAM-CHILE-01, 9.5A).

No incluido: implementacion de motor, liquidaciones, RLS productivo, correcciones de codigo (solo documentacion de hallazgos).

Pruebas: no ejecutadas en esta fase (auditoria por lectura).

## 8. Criterios para avanzar de fase

- Contrato en **`docs/codex/modulos/<módulo>/`** (y stubs o temas transversales) actualizado si cambia la regla de negocio o de UI.
- Criterios de “listo” del usuario o de `AGENTS.md` cumplidos.
- Pruebas acordadas para el alcance (unit / E2E) en verde cuando apliquen.
- Sin mezclar alcances (p. ej. no meter liquidación en ficha empleados).

## 9. Orden recomendado de próximas fases

1. **Conceptos** — cerrar brechas de implementación y pruebas del contrato funcional (tras Fase 9 documental); maestro, vigencias, LRE; no mezclar con asignación por trabajador.
2. **Haberes recurrentes** (vigencia, duplicados, separación de conceptos) — fases 9.3A–9.3C y 9.3B.1 cerradas en documento y codigo segun tablero.
3. **Movimientos variables** — **9.4A** a **9.4E** cerradas en alcance acordado (incluye UI carga manual); siguiente: RLS/roles, edicion/importacion, integracion proceso mensual segun prioridad.
4. **Proceso mensual** — **9.5A** y **9.5B** cerraron **prevalidaciones** (incluye recurrentes por mes y grupos minimos de parametros) sin motor. La referencia historica a motor/liquidaciones queda subordinada al orden oficial `SEG-01 -> CONC-02 -> MOTOR-00 -> MOTOR-01 -> LIQ-01`.

## ORDEN-01 - Roadmap operativo y criterios de cierre

Estado: Cerrada.

Objetivo cumplido:

- Se consolido el roadmap operativo del ERP.
- Se separaron fases funcionales de fases visuales.
- Se definieron dependencias entre fases.
- Se definieron criterios generales de cierre.
- Se ordenaron prioridades antes de motor, liquidaciones, Previred y LRE.
- Se dejo definido que Cursor/Codex no decide el camino del proyecto; solo ejecuta fases acotadas cuando el alcance esta claro.

Documentos creados o consolidados:

- `docs/codex/orquestador/roadmap-operativo.md`
- `docs/codex/orquestador/dependencias-fases.md`
- `docs/codex/orquestador/criterios-cierre-fases.md`
- `docs/codex/orquestador/orden-prioridades.md`

No se toco:

- Codigo Angular.
- SQL.
- Python.
- UI.
- Tests.
- Configuracion real.

Siguiente fase recomendada:

1. SEG-01 - Roles, permisos, JWT/RLS base.
2. CONC-02 - Conceptos gobernados para motor.
3. MOTOR-00 - Contrato del motor de calculo.

## SEG-01 - Roles, permisos, JWT/RLS base

Estado: **En definicion**.

Objetivo:

- Definir roles base del ERP.
- Definir acciones permitidas y bloqueadas por modulo.
- Separar permisos UI, service y BD/JWT/RLS.
- Dejar claro que acciones son solo admin.
- Dejar claro que acciones quedan bloqueadas por fases futuras.
- Preparar la base para que Cursor/Codex implemente permisos sin decidir reglas de negocio.

Documento principal:

- [`matriz-roles-permisos.md`](./matriz-roles-permisos.md)

No se toco:

- Codigo Angular.
- SQL.
- Python.
- UI.
- Tests.
- Configuracion real.

Criterio para pasar a **Cerrada base**:

- `matriz-roles-permisos.md` contiene roles base.
- `matriz-roles-permisos.md` contiene matriz por modulo y accion.
- Se separa permiso UI de permiso service y BD/JWT/RLS.
- Se listan acciones criticas.
- Se listan acciones bloqueadas por fase.
- Los `A_DEFINIR` quedan resueltos o aceptados explicitamente como pendientes de subfase futura.
- Queda claro si RLS real se implementa ahora o queda para subfase posterior.

Siguiente fase logica:

1. **CONC-02 - Conceptos gobernados para motor**.
2. **MOTOR-00 - Contrato del motor de calculo**.

<!-- UX-COMERCIAL-01-ESTADO -->

## Actualizacion 2026-05-10 - REM-UX-FLOWS-01 V2

| Fase                 | Estado           | Resumen                                                                                                                                                                                                                                                                      | Documentos                                                                                                                                                                                                                                                                 | Pruebas                                      |
| -------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `REM-UX-FLOWS-01 V2` | **Implementada** | Se normaliza periodo activo global y accion principal unica en flujos de Remuneraciones. `Preparar nomina` y `Liquidaciones oficiales` dejan de duplicar selector local editable; se auditan Dashboard, Reportes, Movimientos del mes, Asignaciones recurrentes y Conceptos. | [`../CHANGELOG.md`](../CHANGELOG.md), [`../modulos/nomina-mensual/README.md`](../modulos/nomina-mensual/README.md), [`../modulos/liquidaciones-oficiales/README.md`](../modulos/liquidaciones-oficiales/README.md), [`../peticiones-estilos.md`](../peticiones-estilos.md) | `npx ng test --watch=false`; `npm run build` |

## Actualizacion 2026-05-10 - Hito nomina/liquidaciones y foco UX

| Fase              | Estado                      | Resumen                                                                                                                                                                                             | Documentos                                                                                                                                                                                                 | Pruebas                                                     |
| ----------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `LIQ-DB-APPLY-01` | **Ejecutada**               | Liquidaciones oficiales internas validadas en BD real/controlada para `2026-04`: 1 trabajador, 8 conceptos, haberes `750001.88`, descuentos `588301.48`, liquido `161700.40`, duplicados activos 0. | [`../modulos/liquidaciones-oficiales/README.md`](../modulos/liquidaciones-oficiales/README.md), [`../fases/liquidaciones/LIQ-DB-APPLY-01.md`](../fases/liquidaciones/LIQ-DB-APPLY-01.md)                   | E2E nomina OK; E2E liquidaciones OK; build OK; 433 tests OK |
| `LIQ-OFICIAL-01`  | **Implementada y validada** | Liquidaciones oficiales internas v1 desde snapshot cerrado; no recalcula; sin PDF/firma/envio/Previred/LRE/banco/contabilidad.                                                                      | [`../modulos/liquidaciones-oficiales/contrato-general.md`](../modulos/liquidaciones-oficiales/contrato-general.md), [`../fases/liquidaciones/LIQ-OFICIAL-01.md`](../fases/liquidaciones/LIQ-OFICIAL-01.md) | Validada por `LIQ-DB-APPLY-01`                              |
| `UX-COMERCIAL-01` | **Ejecutada T00-T09**       | Redisenio usable/comercial aplicado en shell, Preparar nomina, Liquidaciones, Detalle, Dashboard/Reportes, Movimientos y Asignaciones. Acciones futuras quedan separadas/deshabilitadas.            | [`../ux-comercial/README.md`](../ux-comercial/README.md), [`../fases/ux-comercial/UX-COMERCIAL-01.md`](../fases/ux-comercial/UX-COMERCIAL-01.md)                                                           | Unit/build ejecutados en la fase                            |

## LRE-CONCEPT-RULES-01 - Estrategia LRE para conceptos no directos

| Campo            | Estado                                                                               |
| ---------------- | ------------------------------------------------------------------------------------ |
| Estado           | Implementada en ZIP, pendiente de aplicar en BD real/controlada                      |
| Tipo             | SQL + documentacion                                                                  |
| Alcance          | Conceptos no directos LRE: INASISTENCIA, ZONA_EXTREMA, AFP_EMPLEADOR                 |
| Entrega          | `25_lre_concept_rules.sql`, columnas de estrategia en `concepto`, validaciones 24-26 |
| Fuera de alcance | Exportador LRE, envio DT, motor, formulas, liquidaciones, RPC/RLS, BD real           |

Decision central: `id_catalogo_lre` no es la unica forma de cumplir LRE. Un concepto sin codigo directo solo es error si `estrategia_lre = DIRECTO` y `requiere_exportacion_lre = TRUE`.

## Actualizacion 2026-05-11 - EMP-ADV-VALIDATION-CL-02

| Fase                       | Estado           | Resumen                                                                                                                                                                                                                  | Pruebas                                                                                                                                                   |
| -------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `EMP-ADV-VALIDATION-CL-02` | **Implementada** | Ajusta validaciones chilenas de Creacion avanzada para mostrarlas por accion usando `app-message-box`; elimina enfoque de tarjeta fija por paso; mantiene Siguiente flexible, borrador minimo y Finalizar alta estricto. | `npx tsc -p tsconfig.app.json --noEmit` OK; `npx tsc -p tsconfig.spec.json --noEmit` OK; build bloqueado en sandbox por binarios Windows de node_modules. |

## Actualizacion 2026-05-12 - EMP-PERFIL-LABORAL-UI-01

| Fase                       | Estado                  | Resumen                                                                                                                                                                                                                                                                                                                                                      | Pruebas                                                                                                                                                                         |
| -------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `EMP-PERFIL-LABORAL-UI-01` | **Implementada en ZIP** | Creacion avanzada incorpora perfil laboral/previsional: edad laboral derivada por fecha, condiciones especiales respaldables, vigencia, observacion, resumen final y persistencia en `persona_condicion_trabajador` usando el catalogo SQL existente. El pulido posterior lo separa como paso propio antes del resumen. Honorarios se mantiene no aplicable. | `npx tsc -p tsconfig.app.json --noEmit` OK; `npx tsc -p tsconfig.spec.json --noEmit` OK; `unzip -t` OK. `ng build --configuration development` no cerro en sandbox por timeout. |

## Actualizacion 2026-05-12 - EMP-PERFIL-LABORAL-UI-01-POLISH

| Fase                              | Estado                  | Resumen                                                                                                                                                                                                                                                                                                                            | Pruebas                                                                                                                                                                                                                                     |
| --------------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `EMP-PERFIL-LABORAL-UI-01-POLISH` | **Implementada en ZIP** | Creacion avanzada separa `Perfil laboral y condiciones` como paso propio despues de Banco y antes de Resumen final. El paso de asignaciones vuelve a quedar enfocado en cargas, zona extrema y semana corrida. La maqueta del perfil se alinea a los otros pasos con bloques compactos, cabeceras neutras y respaldo bajo demanda. | `npm ci --ignore-scripts` OK; `npx tsc -p tsconfig.app.json --noEmit` OK; `npx tsc -p tsconfig.spec.json --noEmit` OK; `npm run build -- --configuration development` no cerro en sandbox por timeout, sin error de codigo antes del corte. |

## Actualizacion 2026-05-12 - EMP-CONDICIONES-ESPECIALES-UX-01

| Fase                               | Estado                  | Resumen                                                                                                                                                                                                                                 | Pruebas                                                                                                                                                                                                                                     |
| ---------------------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `EMP-CONDICIONES-ESPECIALES-UX-01` | **Implementada en ZIP** | Creacion avanzada mantiene el paso despues de Banco, pero lo reenfoca como `Condiciones especiales`: revision administrativa detectada, seleccion `Solo si aplica`, estado estandar cuando no hay condiciones y resumen final compacto. | `npm ci --ignore-scripts` OK; `npx tsc -p tsconfig.app.json --noEmit` OK; `npx tsc -p tsconfig.spec.json --noEmit` OK; `npm run build -- --configuration development` no cerro en sandbox por timeout, sin error de codigo antes del corte. |

## Actualizacion 2026-05-12 - EMP-CONDICIONES-ESPECIALES-AUTODETECT-01

| Fase                                       | Estado                  | Resumen                                                                                                                                                                                                                                                                                                                                  | Validacion                                                                                                                                                                                                                                  |
| ------------------------------------------ | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `EMP-CONDICIONES-ESPECIALES-AUTODETECT-01` | **Implementada en ZIP** | Creacion avanzada pre-marca condiciones especiales cuando la informacion ya fue capturada en pasos previos: menor de 18 por fecha nacimiento/ingreso, categoria base derivada desde relacion laboral y regimen previsional `NINGUNA` como exencion a revisar. La UI muestra el origen como `Detectada` y conserva revision/edicion RRHH. | `npm ci --ignore-scripts` OK; `npx tsc -p tsconfig.app.json --noEmit` OK; `npx tsc -p tsconfig.spec.json --noEmit` OK; `npm run build -- --configuration development` no cerro en sandbox por timeout, sin error de codigo antes del corte. |

## EMP-ALTA-REGLAS-COHERENCIA-01 - Cerrada

Fecha: 2026-05-13

Estado: cerrada.

Alcance aplicado:

- Alta avanzada incorpora una capa central de coherencia administrativa en `src/app/features/empleados/rules/empleado-alta-coherencia.rules.ts`.
- La coherencia no bloquea automaticamente ni modifica datos en silencio. Cuando hay una recomendacion, `app-message-box` permite aplicar la correccion sugerida o mantener la revision.
- Casos cubiertos en esta fase:
  - Seguro de Cesantia activo/no activo segun relacion laboral, contrato, menor de edad, pensionado y tecnico extranjero exento.
  - Jornada sobre maximo administrativo 42 horas, o 30 horas en jornada parcial/menor de edad.
  - Regimen previsional `NINGUNA` sin condicion especial previsional asociada.
  - Menor de edad sin condicion administrativa confirmada.
- Resumen final muestra `Coherencia administrativa` para dejar visibles las revisiones mantenidas por RRHH.

Restricciones respetadas:

- Sin SQL/RPC/RLS ni cambios de BD.
- Sin motor de calculo, nomina, liquidaciones, LRE, Previred ni formulas de montos.
- Sin cambios a creacion basica, ficha empleado ni persistencia final de honorarios.
- Sin estilos globales.

Validaciones realizadas:

- `npm ci --ignore-scripts` OK.
- `npx tsc -p tsconfig.app.json --noEmit` OK.
- `npx tsc -p tsconfig.spec.json --noEmit` OK.
- `npm run build -- --configuration development` OK con warning preexistente de orden de `@import` en `src/styles/tailwind.css`.
- `npx vitest run src/app/features/empleados/rules/empleado-alta-coherencia.rules.spec.ts` OK, 5 tests.
- `npm test -- --watch=false` compilo suite, pero quedo en timeout de sandbox durante ejecucion general.

## EMP-TIPO-TRABAJADOR-FLOW-01 - Categoria base derivada

| Campo            | Estado                                                                                                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Estado           | Implementada en ZIP                                                                                                                                                             |
| Tipo             | UI + logica local de Creacion avanzada                                                                                                                                          |
| Alcance          | `tipo_trabajador` se deriva desde relacion laboral: `CONTRATO` -> `DEPENDIENTE`, `HONORARIOS` -> `INDEPENDIENTE`; las condiciones especiales no se detectan desde ese catalogo. |
| Fuera de alcance | SQL/RPC/RLS, motor, nomina, liquidaciones, ficha empleado, creacion basica, fuentes canonicas futuras para pensionado/invalidez/extranjero/discapacidad.                        |
| Validacion       | `tsc app/spec`, build development y specs de reglas.                                                                                                                            |

## EMP-ADV-BITACORA-LABORAL-UX-01 - Bitácora Laboral

| Campo            | Estado                                                                                                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Estado           | Implementada                                                                                                                                                                    |
| Tipo             | UI/copy local + documentación                                                                                                                                                   |
| Alcance          | Creación avanzada de empleados: mapa lateral, header de paso, estados visibles, APVI no requerido/opcional y acta de revisión                                                   |
| Entrega          | `form-empleado.ts/html/css` + docs Codex                                                                                                                                        |
| Fuera de alcance | SQL/RPC/RLS, motor, nómina, liquidaciones, persistencia crítica, mappers, creación básica, ficha empleado, estilos globales protegidos                                          |
| Validaciones     | `npm ci --ignore-scripts`; `tsc app`; `tsc spec`; `build development`; vitest reglas empleados 18 tests OK. `npm test -- --watch=false` quedó en timeout durante suite completa |

Resumen: la alta avanzada deja de comunicarse como wizard genérico y adopta `Bitácora laboral`: registros agrupados por sentido, estados humanos y cierre como acta administrativa.

## ERP-NOIA-BITACORA-OPERATIVA-00 - Identidad global NOIA / Bitacora Operativa

| Campo                   | Estado                                                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Estado                  | Documentada                                                                                                                     |
| Tipo                    | Documento rector UX/producto                                                                                                    |
| Alcance                 | Identidad global del ERP como bitacora operativa del periodo; reglas visuales, narrativa administrativa y gramatica por modulo. |
| Entrega                 | Nueva guia en `docs/codex/diseno/bitacora-operativa-noia.md`; referencias en README, estilos y modulos relacionados.            |
| Pruebas                 | No requiere build ni tests de codigo; validacion documental de existencia y enlaces.                                            |
| Fuera de alcance        | Angular, HTML, CSS, SQL/RPC/RLS, rutas, servicios, motor de nomina, estilos globales y cambios funcionales.                     |
| Siguiente fase sugerida | `NOM-MOVIMIENTOS-UNIFICADOS-UX-01` o `ERP-SHELL-BITACORA-OPERATIVA-01`, segun prioridad producto.                               |
| Documento               | [`../diseno/bitacora-operativa-noia.md`](../diseno/bitacora-operativa-noia.md)                                                  |

## EMP-ADV-CSS-BUDGET-REDUCE-01 - Cerrada

Fecha: 2026-05-15

| Campo         | Estado                                                                                                                                                                                          |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Estado        | Implementada                                                                                                                                                                                    |
| Tipo          | Refactor CSS local de componente                                                                                                                                                                |
| Alcance       | `app-form-empleado`: reduccion de selectores locales, eliminacion de duplicados y division en `form-empleado.css`, `form-empleado.wizard.css` y `form-empleado.feedback.css`.                   |
| Resultado     | El build productivo ya no falla por presupuesto de `form-empleado.css`; tamano inicial reportado 36.37 kB, final sin error `anyComponentStyle` y hojas fuente de 19,060 / 9,442 / 10,517 bytes. |
| Validaciones  | `tsc app` OK; `tsc spec` OK; `ng build development` OK; `npm run build` OK.                                                                                                                     |
| Restricciones | Sin cambios a presupuestos, `angular.json`, estilos globales, Tailwind/PostCSS, SQL/RPC/RLS, motor, nomina, liquidaciones, servicios, mappers, rutas, reglas ni payloads.                       |

## ERP-CONTEXT-OPTIMIZATION-01 - Contexto liviano para Cursor/Codex

Fecha: 2026-05-15

| Campo         | Estado                                                                                                                                                                                                            |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Estado        | Implementada                                                                                                                                                                                                      |
| Tipo          | Documentación técnica + reglas Cursor + script auxiliar                                                                                                                                                           |
| Alcance       | Contexto rápido oficial, reglas persistentes NOIA/protegidos, `.cursorignore` y generador de context packs pequeños.                                                                                              |
| Entrega       | `docs/codex/contexto-rapido.md`, `docs/codex/diseno/erp-context-optimization-01.md`, `.cursor/rules/erp-ui-noia.mdc`, `.cursor/rules/erp-protected-files.mdc`, `.cursorignore`, `scripts/build-context-pack.ps1`. |
| Validación    | Existencia de archivos, revisión de referencias y verificación documental. No requiere build Angular porque no toca `src/` funcional ni estilos de pantalla.                                                      |
| Restricciones | Sin Angular funcional, sin HTML/CSS visual, sin estilos globales protegidos, sin SQL/RPC/RLS, sin motor, nómina, liquidaciones, servicios, mappers, payloads ni persistencia crítica.                             |
| Uso           | Para fases futuras, partir por `docs/codex/contexto-rapido.md` y generar context pack cuando el análisis no requiera el ZIP completo.                                                                             |
| Documento     | [`../diseno/erp-context-optimization-01.md`](../diseno/erp-context-optimization-01.md)                                                                                                                            |

## PARAM-NOIA-CIERRE-UX-01

| Campo         | Estado                                                                                                                                             |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Estado        | Ejecutada                                                                                                                                          |
| Tipo          | UX/UI operativa + proteccion tecnica acotada                                                                                                       |
| Objetivo      | Convertir Parametros en panel normativo del periodo y evitar sobrescrituras silenciosas al aplicar cargas mensuales.                               |
| Alcance       | Header/cierre normativo, estados por pestana, resumen de faltantes e impacto, wrapper terminal seguro.                                             |
| Guardia       | `PARAM-MENSUAL-OVERWRITE-GUARD-01` en `scripts/run-parametros-mensuales.ps1`; bloquea aplicar SQL si detecta datos existentes y no viene `-Force`. |
| Restricciones | Sin SQL estructural, RLS/RPC, motor, nomina/liquidaciones productivas, estilos globales protegidos ni budgets.                                     |
| Documento     | [`../diseno/param-noia-cierre-ux-01.md`](../diseno/param-noia-cierre-ux-01.md)                                                                     |

## PARAM-CLIENT-CONFIG-SEPARATION-AUDIT-01

| Campo         | Estado                                                                                                                                                     |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Estado        | Ejecutada                                                                                                                                                  |
| Tipo          | Auditoria + guardia minima de wrapper + documentacion                                                                                                      |
| Objetivo      | Confirmar que la carga mensual full no pise `parametros_generales_cliente`.                                                                                |
| Resultado     | Python mensual no escribe `parametros_generales_cliente`; Angular guarda configuracion cliente con `guardarClienteConfig`; reconciliacion UI es explicita. |
| Fix           | `PARAM-CLIENT-CONFIG-SEPARATION-FIX-01`: el wrapper separa datos oficiales existentes de configuracion cliente existente y aclara el alcance de `-Force`.  |
| Restricciones | Sin SQL estructural, RLS/RPC, motor, nomina/liquidaciones productivas, estilos globales protegidos ni budgets.                                             |
| Documento     | [`../diseno/param-client-config-separation-audit-01.md`](../diseno/param-client-config-separation-audit-01.md)                                             |

### PARAM-RECONCILIACION-MSGBOX-FIX-01

Estado: Ejecutada

Tipo: Fix UX/flujo acotado

Objetivo:
Cerrar el comportamiento de la decision `Revisar despues` en la reconciliacion oficial/cliente de Parametros, evitando reapertura repetitiva del MsgBox y manteniendo la decision explicita del usuario.

Alcance:

- MsgBox de reconciliacion.
- Decisiones oficial/cliente.
- Registro de postergacion.
- Documentacion Codex.

Restricciones:

- Sin Python.
- Sin wrapper.
- Sin SQL estructural.
- Sin RLS/RPC.
- Sin motor.
- Sin nomina/liquidaciones.
- Sin estilos globales protegidos.

## PARAM-BITACORA-LAYOUT-ALIGN-01

| Campo         | Estado                                                                                                                                                     |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Estado        | Ejecutada                                                                                                                                                  |
| Tipo          | UX/UI local de layout                                                                                                                                      |
| Objetivo      | Ordenar la pantalla Parametros para coincidir visualmente con `Bitacora Operativa / NOIA`, manteniendo intacto el funcionamiento oficial/cliente.          |
| Alcance       | Cabecera del periodo, estado mensual, accion configurar cliente, tabs principales, contexto de seccion activa, filtros DataGrid y CSS local de Parametros. |
| Restricciones | Sin SQL/RPC/RLS, Python, wrapper, motor, nomina/liquidaciones, servicios/repositorios, reconciliacion nueva ni estilos globales protegidos.                |
| Documento     | [`../diseno/param-bitacora-layout-align-01.md`](../diseno/param-bitacora-layout-align-01.md)                                                               |

## ERP-NOIA-DECISION-SYSTEM-01

Estado: Ejecutada

Tipo: Documental / reglas de diseno

Objetivo:
Crear un sistema de decision para que Cursor/Codex no disene por acumulacion de cards, sino por tipo de pantalla, fuente de verdad, estado, accion, riesgo y patron visual adecuado.

Alcance:

- Matriz de decision NOIA.
- Regla anti-card.
- Patrones de maquetacion.
- Arquetipos de pantalla.
- Recetas de componentes.
- Reglas Cursor.

Restricciones:

- Sin cambios en Angular funcional.
- Sin HTML/CSS de pantallas.
- Sin SQL/RPC/RLS.
- Sin Python ni wrapper.
- Sin motor.
- Sin nomina/liquidaciones.
- Sin estilos globales protegidos.

## NOM-MOVIMIENTOS-SIMPLE-01 - Primera capa visible de movimientos

| Campo         | Estado                                                                                                                                             |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Estado        | Implementada                                                                                                                                       |
| Tipo          | UX/UI visible + documentacion                                                                                                                      |
| Alcance       | Menu `Movimientos`, pantalla `Movimientos de remuneracion`, vista `Recurrentes`, copy de Preparar nomina, Dashboard y Reportes.                    |
| Entrega       | Ruta corta `/remuneraciones/movimientos` como redirect; tabs visibles `Este mes`, `Recurrentes`, `Todos`; comunicacion de `En cuotas` sin calculo. |
| Restricciones | Sin SQL/RPC/RLS, motor, liquidaciones productivas, servicios productivos, mappers, payloads, persistencia critica ni estilos globales.             |
| Documento     | [../diseno/nom-movimientos-simple-01.md](../diseno/nom-movimientos-simple-01.md)                                                                   |

## NOM-MOVIMIENTOS-SIMPLE-01-FORM-POLISH

| Campo         | Estado                                                                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Estado        | Implementada                                                                                                                                     |
| Tipo          | UX/UI local del modal                                                                                                                            |
| Alcance       | Modal `Registrar movimiento`: bloques principales, duracion visible, campos UI de cuotas, detalle administrativo secundario y resumen operativo. |
| Entrega       | Duraciones `Solo este mes`, `Recurrente`, `En cuotas`; validacion local para cuotas; sin cambio de payload productivo.                           |
| Restricciones | Sin SQL/RPC/RLS, motor, liquidaciones, servicios productivos, mappers, rutas, estilos globales ni persistencia critica.                          |
| Documento     | [../diseno/nom-movimientos-simple-01.md](../diseno/nom-movimientos-simple-01.md)                                                                 |

## NOM-MOVIMIENTOS-POR-TRABAJADOR-01

| Campo         | Estado                                                                                                                                        |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Estado        | Implementada                                                                                                                                  |
| Tipo          | UX/UI local de Movimientos de remuneracion                                                                                                    |
| Alcance       | Pantalla mensual como grilla de trabajadores, contadores accionables, modal de gestion por trabajador y correccion del modal mensual.         |
| Entrega       | Gestionar/Asignar por trabajador; detalles filtrados; flujo mensual separado del recurrente; cuotas como variante del recurrente.             |
| Restricciones | Sin SQL/RPC/RLS, motor, liquidaciones, persistencia critica, servicios/mappers/payloads productivos nuevos, rutas nuevas ni estilos globales. |
| Documento     | [../diseno/nom-movimientos-por-trabajador-01.md](../diseno/nom-movimientos-por-trabajador-01.md)                                              |

## NOM-MENSUAL-CONFIRMACION-FLOW-00 - Nómina mensual confirmada

Fecha: 2026-05-18

| Campo            | Estado                                                                                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Estado           | Documentada                                                                                                                                            |
| Tipo             | Definición documental de producto, UX y arquitectura funcional                                                                                         |
| Alcance          | Redefinir Nómina mensual como workspace del período: generar, revisar trabajadores, confirmar y generar liquidaciones desde la versión confirmada.     |
| Decisión         | `Nómina mensual confirmada = fuente oficial para generar liquidaciones`.                                                                               |
| Entrega          | `docs/codex/modulos/nomina-mensual/nomina-mensual-confirmacion-flow.md` y referencias en README/contratos de Nómina mensual y Liquidaciones oficiales. |
| Validación       | Existencia de documento rector y referencias; sin build Angular por no tocar `src/`.                                                                   |
| Fuera de alcance | Angular, HTML/CSS, rutas, SQL/RPC/RLS, motor, servicios, mappers, payloads, persistencia, liquidaciones productivas y estilos globales.                |
| Fases futuras    | `NOM-MENSUAL-WORKSPACE-01`, `NOM-MENSUAL-TRABAJADORES-02`, `NOM-MENSUAL-CONFIRMAR-03`, `NOM-LIQ-DESDE-NOMINA-CONFIRMADA-04`.                           |

Resumen: se deja de orientar nuevas fases desde un tablero tecnico de `Preparar nómina` y se adopta el ciclo real de RRHH: nómina mensual generada, revisada por trabajador, confirmada y usada como fuente oficial para liquidaciones.

## NOM-MODALES-PERIODO-REVISION-IA-02 - Arquitectura informacion modal revision

| Campo         | Estado                                                                                                                                                                        |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Estado        | Implementada                                                                                                                                                                  |
| Tipo          | UX/UI local + rules del modal revision                                                                                                                                        |
| Alcance       | Expediente y CTA solo en Resumen; observaciones unificadas sin DataGrid; tabs area con lead local, listas editoriales, empty sin toolbar y DataGrid solo con filas tabulares. |
| Restricciones | Sin store, servicios, SQL, motor, `app-message-box`, estilos globales, rutas ni cambios en `proceso-mensual-payroll-seguimiento.rules.ts`.                                    |
| Documento     | [`../modulos/nomina-mensual/nom-modales-periodo-revision-ia-02.md`](../modulos/nomina-mensual/nom-modales-periodo-revision-ia-02.md)                                          |
| Siguiente     | E2E visual del modal con snapshots por tab.                                                                                                                                   |

## NOM-MODALES-PERIODO-REVISION-COPY-03 - Copy RRHH modal revision

| Campo         | Estado                                                                                                                                                          |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Estado        | Implementada                                                                                                                                                    |
| Tipo          | Copy / rules puras / CSS local minimo                                                                                                                           |
| Alcance       | Humanizacion de claves tecnicas visibles; resumen coherente con bloqueos globales; accion agrupada de parametros; lectura operativa de metricas resumen.        |
| Restricciones | Sin store, servicios, SQL/RPC/RLS, motor, rutas, `app-message-box`, `app-data-grid`, workspace, overlay host ni `proceso-mensual-payroll-seguimiento.rules.ts`. |
| Documento     | [`../modulos/nomina-mensual/nom-modales-periodo-revision-copy-03.md`](../modulos/nomina-mensual/nom-modales-periodo-revision-copy-03.md)                        |
| Siguiente     | E2E visual del modal con datos tecnicos de parametros.                                                                                                          |

