## 2026-05-20 - Nómina mensual: verificar período solo bloquea parámetros

- **Cambio:** tras verificar, solo faltas de parámetros impiden generar nómina; fichas, entradas y recurrentes quedan como advertencias para revisar al guardar/confirmar.
- **Archivos:** `proceso-mensual-prevalidacion.rules.ts`, `proceso-mensual-estado-operativo.rules.ts`, `proceso-mensual-presentacion.facade.ts`, `proceso-mensual-informacion-periodo.rules.ts`.
- **No tocado:** motor, SQL, estilos globales.

## 2026-05-20 - Nómina mensual: resumen ampliado en barra detalle mensual

- **Cambio:** «Resumen ampliado» sale del rail «Más opciones» y pasa a botón con icono a la derecha de los filtros Todos / Trabajadores / Liquidaciones / Pendientes.
- **Archivos:** `proceso-mensual-workspace.*`.
- **No tocado:** estilos globales, motor, SQL.

## 2026-05-19 - Nómina mensual: panel lateral trabajadores sin duplicar identidad

- **Cambio:** panel lateral sin cabecera nombre/RUT; pre-borrador solo pestaña «Qué corregir»; con borrador «Atención» + «Resumen»; bloque único estado + incidencias + CTA (sin Incidencias ni Pasos duplicados).
- **Archivos:** `proceso-mensual-revision-trabajadores.*`.
- **No tocado:** estilos globales, motor, SQL.

## 2026-05-20 - Nómina mensual: unificar revisión fichas con Ver detalle

- **Cambio:** sin borrador, pestaña Trabajadores usa el mismo layout grilla + panel lateral; pendientes de prevalidación alimentan filas/incidencias masivas; se elimina panel duplicado «Abrir ficha».
- **Archivos:** `proceso-mensual-trabajadores-prevalidacion.rules.ts`, `proceso-mensual-presentacion.facade.ts`, `proceso-mensual-revision-trabajadores.*`, `proceso-mensual-correccion.rules.ts`.

## 2026-05-19 - Nómina mensual: verificación período con fichas no aptas accionables

- **Cambio:** tras verificar período, modal lista hasta 8 trabajadores (nombre, RUT, motivo); CTA principal «Revisar fichas»; secundario «Generar nómina de todos modos» solo con advertencias; pestaña Trabajadores muestra grilla pre-borrador con «Abrir ficha» y retorno al período.
- **Archivos:** `proceso-mensual-trabajadores-prevalidacion.rules.ts`, `proceso-mensual.model.ts`, `proceso-mensual.service.ts`, `proceso-mensual-informacion-periodo.rules.ts`, `proceso-mensual-revision-trabajadores.*`, `proceso-mensual-presentacion.facade.ts`, `proceso-mensual-container.vm.ts`.
- **No tocado:** SQL, motor, estilos globales.

## 2026-05-20 - Nómina mensual: CTA confirmación con revisión trabajadores al día

- **Cambio:** con borrador y panel trabajadores sin bloqueos/observaciones, shell y rail muestran «Preparar confirmación» / «Confirmar revisión» en lugar de «Generar nómina».
- **Archivos:** `proceso-mensual-estado-operativo.rules.ts`, `proceso-mensual-flow-nav.rules.ts`, `proceso-mensual-validacion-calculo.rules.ts`.

## 2026-05-20 - Nómina mensual: sub-pestañas detalle trabajador + CTAs revisión

- **Módulo:** Proceso mensual / Detalle mensual / Trabajadores.
- **Cambio:** panel lateral con sub-pestañas Resumen | Incidencias | Qué hacer; shell y rail abren revisión guiada con filtro y preselección; columna Acción abre panel sin doble navegación.
- **Archivos:** `proceso-mensual-revision-trabajadores.*`, `proceso-mensual-presentacion.facade.ts`, `proceso-mensual-correccion.rules.ts`.
- **No tocado:** estilos globales, motor, SQL.

## 2026-05-20 - NOM-MENSUAL-FLOW-UNIFICADO-03 Fase 4 (modal global)

- **Cambio:** modal de revisión ampliada sin grilla masiva duplicada en tab Trabajadores; correcciones vía `ejecutarAccionCorreccionDesdeModal`; eliminado `navegarDesdeModal`.
- **Archivos:** `proceso-mensual-detalle-modal.*`, facade, `proceso-mensual-detalle-modal.rules.ts`.
- **Docs:** `nom-mensual-flow-unificado-03-fase-04-modal-global.md` (cerrada).

## 2026-05-20 - NOM-MENSUAL-FLOW-UNIFICADO-03 Fase 3 (panel + modal movimientos)

- **Cambio:** modal local de movimientos con columna Acción vía dispatcher; incidencias de expediente/pendiente con `accion` resoluble; filtros unificados (stat + búsqueda, sin toolbar duplicado).
- **Archivos:** `proceso-mensual-revision-trabajadores.*`, `proceso-mensual-incidencias-periodo.rules.ts`, `proceso-mensual-masivo-layout.rules.ts`, facade.
- **Docs:** `nom-mensual-flow-unificado-03-fase-03-panel-modales.md` (cerrada).

## 2026-05-20 - NOM-MENSUAL-FLOW-UNIFICADO-03 Fase 2 (deep link idPersona)

- **Cambio:** rutas de corrección a Novedades llevan `idPersona` en query; Novedades preselecciona trabajador al entrar; breadcrumb Remuneraciones devuelve a Nómina mensual con contexto; al volver con `returnTo` se rehidrata período y trabajador en panel.
- **Archivos:** `proceso-mensual-flow-nav.rules.ts`, facade, `novedades-mensuales-container.ts`.
- **Docs:** `nom-mensual-flow-unificado-03-fase-02-deep-links.md` (cerrada).

## 2026-05-20 - NOM-MENSUAL-FLOW-UNIFICADO-03 Fase 1 (dispatcher 100%)

- **Cambio:** pendientes sidebar, franja, CTA frame y modal de revisión delegan en `ejecutarAccionCorreccion`; eliminado `abrirDetalleExpedienteFila`.
- **Archivos:** `proceso-mensual-correccion.rules.ts`, facade, `proceso-mensual-detalle-modal.component.html`.
- **Docs:** `nom-mensual-flow-unificado-03.md` (Fase 1 cerrada).

## 2026-05-20 - Nómina mensual: Todos incluye movimientos (decisión B)

- **Cambio:** grilla «Todos» lista movimientos/recurrentes con Acción alineada al panel; `idPersona` en filas movimiento vía mapa de nombres.
- **Archivos:** `proceso-mensual-detalle-mensual.rules.ts`, `proceso-mensual-correccion.rules.ts`, facade.

## 2026-05-20 - Nómina mensual: panel corrección trabajadores (acciones en grilla)

- **Módulo:** Revisión masiva / Detalle mensual Trabajadores.
- **Cambio:** columna Acción en grilla; incidencias y acción recomendada con botón; `ejecutarAccionCorreccion` centraliza panel vs deep links; Todos/Pendientes alineados.
- **Archivos:** `proceso-mensual-correccion.rules.ts`, facade, `proceso-mensual-revision-trabajadores.*`, `proceso-mensual-masivo-layout.rules.ts`.
- **No tocado:** motor, SQL, estilos globales.

## 2026-05-20 - Nómina mensual: un solo CTA en bloque Revisión (sidebar)

- **Módulo:** Nómina mensual / workspace sidebar.
- **Cambio:** un botón principal según contexto (`revisionRailCta`); sin duplicar «Revisar trabajadores»; resumen ampliado solo bajo «Más opciones» con snapshot.
- **Archivos:** `proceso-mensual-flow-nav.rules.ts`, facade, workspace HTML/CSS.

## 2026-05-20 - Nómina mensual: copy circuito + modal al panel (post FLOW-NAV-02)

- **Módulo:** Remuneraciones (entradas) + modal revisión nómina.
- **Cambio:** «Preparar nómina» → «Nómina mensual» en dashboard/reportes/liquidación/haberes; acciones del modal que iban a panel usan `seleccionarRevisionDesdeModal` y `navegarDesdeModal` con período; enlace explícito al detalle del período desde modal Trabajadores.
- **No tocado:** motor, SQL, estilos globales, layout dashboard (cards existentes).

## 2026-05-20 - Nómina mensual: cierre flujo navegación (NOM-FLOW-NAV-02)

- **Módulo:** Nómina mensual / consola período.
- **Cambio:** acciones en grillas Detalle mensual; preselección trabajador; mini lista pendientes en sidebar; rehidratación al volver con `returnTo`; footer modal al panel; eliminados estilos legacy `.payroll-mass-filter*` / `.payroll-mass-summary*` del modal.
- **Archivos:** `proceso-mensual-flow-nav.rules.ts`, facade, workspace, detalle-modal CSS/HTML, `nom-mensual-flow-nav-02.md`.
- **No tocado:** motor, SQL, estilos globales, API DataGrid.

## 2026-05-20 - Nómina mensual: flujo navegación coherente (NOM-FLOW-NAV-01)

- **Módulo:** Nómina mensual / consola período.
- **Cambio:** revisión en panel Detalle mensual; estado RRHH en sidebar; deep links con período; modal segment nav; enlaces «Revisar en detalle» vs modal ampliado.
- **Archivos:** `proceso-mensual-flow-nav.rules.ts`, facade, workspace, detalle-modal, `nom-mensual-flow-nav-01.md`.
- **No tocado:** motor, SQL, estilos globales.

## 2026-05-19 - Nómina mensual: segment nav unificado

- **Módulo:** Nómina mensual / workspace Detalle mensual y revisión trabajadores.
- **Cambio:** `payroll-segment-nav.css` compartido (pills + KPI stat + toolbar); pestañas detalle, filtros masivos y tarjetas KPI con activo `--erp-primary-soft`; eliminados pills negros y `.payroll-detalle-filtros*` locales.
- **Archivos:** `payroll-segment-nav.css`, `proceso-mensual-container.css`, `proceso-mensual-workspace.*`, `proceso-mensual-revision-trabajadores.*`, `proceso-mensual-segment-nav.rules.ts`, `proceso-mensual-presentacion.facade.ts`.
- **Deuda:** modal `proceso-mensual-detalle-modal` conserva `payroll-mass-*` hasta fase posterior.
- **No tocado:** tabs Detalle mensual | Historial (underline), motor, SQL, estilos globales.

## 2026-05-19 - Header: selector de período visible

- **Módulo:** Shell / barra superior global.
- **Cambio:** chip calendario + mes abre panel año/mes; copy de rehidratación; visible en mobile; cierra al elegir período.
- **Archivos:** `header.component.ts`, `header.component.spec.ts`.
- **Efecto:** Nómina mensual y demás módulos de remuneraciones recargan período vía `PeriodoActivoService` + `rehidratarPeriodoActivo` del store.

## 2026-05-19 - Revisión trabajadores: modal movimientos

- **Módulo:** Nómina mensual / `proceso-mensual-revision-trabajadores`.
- **Cambio:** panel derecho sin sub-grid comprimido; enlace «Ver N movimientos» (tabla y resumen) abre modal local con DataGrid amplio; Escape y overlay cierran.
- **Archivos:** `proceso-mensual-revision-trabajadores.component.*`.
- **No tocado:** facade overlay global, estilos globales.

## 2026-05-19 - NOM-MENSUAL-REVISION-TRABAJADORES-MASIVA-01

- **Módulo:** Nómina mensual / workspace Detalle mensual.
- **Cambio:** componente `proceso-mensual-revision-trabajadores` (split tabla + panel acoplado); columnas compactas; selección accesible; CSS local `payroll-revision-trabajadores*`; sin vista global Movimientos.
- **Archivos:** `proceso-mensual-revision-trabajadores/*`, `proceso-mensual-workspace.*`, `proceso-mensual-presentacion.facade.ts`, `proceso-mensual-masivo-layout.rules.ts`, `proceso-mensual-area-orden.config.ts`.
- **No tocado:** modal revisión, motor, SQL, store, `app-data-grid` API, estilos globales.

## 2026-05-19 - NOM-MENSUAL-CLEANUP-AUDIT-01

- **Módulo:** Nómina mensual / workspace y container CSS local.
- **Cambio:** eliminados bloques CSS huérfanos (`.payroll-history`, `.payroll-official-snapshot`, `.payroll-expediente-panel*`, duplicado `.payroll-follow-row` en container); workspace solo estilos `.payroll-rail-link` activos.
- **Archivos:** `proceso-mensual-container.css`, `proceso-mensual-workspace.component.css`; doc `nom-mensual-cleanup-audit-01.md`.
- **No tocado:** modal conserva CSS propio; estilos globales, `angular.json`.

## 2026-05-19 - NOM-MENSUAL-DETALLE-MENSUAL-UNIFICADO-01

- **Módulo:** Nómina mensual / workspace.
- **Cambio:** tabbar `Detalle mensual | Historial`; franja Parámetros/Trabajadores/Movimientos/Liquidaciones; filtros `payroll-detalle-filtros`; tablas DataGrid por vista; historial solo trazabilidad.
- **Archivos:** `proceso-mensual-workspace.*`, `proceso-mensual-presentacion.facade.ts`, `proceso-mensual-area-orden.config.ts`, `proceso-mensual-detalle-mensual.rules.ts`, `proceso-mensual-grid.config.ts`.
- **No tocado:** motor, SQL, estilos globales, `angular.json`.

## 2026-05-18 - NOM-WORKSPACE-POLISH-03 (corrección)

- **Corrección:** eliminado `border-left` coloreado en franja KPI activa (antipatrón NOIA); activo solo con borde completo + `box-shadow` ya definido en sidebar.

## 2026-05-18 - NOM-WORKSPACE-POLISH-03

- **Módulo:** Nómina mensual / consola workspace LOC.
- **Cambio:** tokens residuales y links secundarios; bitácora Lucide + nodo rail activo; follow-row modo lista; tab-summary neutral; tabs sticky; acciones del período en panel derecho (`--workspace`); ocultar checklist focus duplicado.
- **Archivos:** `proceso-mensual-container.css`, `payroll-operational-tabs.css`, `proceso-mensual-workspace.component.html`, `proceso-mensual-workspace-presentacion.rules.ts`, `app.config.ts`; doc `nom-workspace-polish-03.md`.
- **No tocado:** motor, store, SQL, estilos globales, `angular.json`.

## 2026-05-18 - NOM-WORKSPACE-BITACORA-POLISH-02

- **Módulo:** Nómina mensual / consola workspace LOC.
- **Cambio:** tokens `--erp-*` en `.payroll-console`; bitácora con rail vertical y estados funcionales; sidebar unificado (separadores, títulos, pills, enlace revisión secundario); focus/tabs/tab-summary/follow-row con paleta bitácora; bitácora 1 columna en responsive.
- **Archivos:** `proceso-mensual-container.css`, `payroll-operational-tabs.css`, `proceso-mensual-workspace.component.html`; doc `nom-workspace-bitacora-polish-02.md`.
- **No tocado:** rules workspace, motor, store, SQL, estilos globales, `angular.json`.

## 2026-05-19 - NOM-REVISION-UX-CONSOLIDAR-01

- **Módulo:** Nómina mensual / workspace y modal revisión.
- **Cambio:** «Ver revisión completa» solo en card Revisión del sidebar; eliminados enlaces duplicados por tab. Modal revisión: cierre con X (sin «Cerrar» duplicado en pie); modal verificación período sin botón «Cerrar» redundante (solo X del MessageBox).
- **Archivos:** `proceso-mensual-workspace.component.html`, `proceso-mensual-workspace-presentacion.rules.ts`, `proceso-mensual-detalle-modal.*`, `proceso-mensual-informacion-modal.component.ts`, `proceso-mensual-detalle-modal.rules.ts`.
- **No tocado:** motor, estilos globales, SQL.

## 2026-05-19 - NOM-MENSUAL-PERSISTENCIA-ESTADO-01

- **Módulo:** Nómina mensual / persistencia borrador.
- **Cambio:** sin cambio visual de copy; comportamiento tras F5: tabs Trabajadores/Movimientos y revisión completa con datos del borrador guardado.
- **Archivos:** `proceso-mensual-borrador-snapshot.rules.ts`, repository snapshot, store, service, facade; docs `nom-mensual-persistencia-estado-01.md`, `nom-periodo-diagnostico-persist-01.md`.
- **No tocado:** motor, estilos globales, `angular.json`, SQL nuevo.

## 2026-05-19 - NOM-FLOW-REVISION-01 (plan revisión flujo)

- **Módulo:** Nómina mensual / flujo RRHH.
- **Cambio:** CTAs «Verificar período» vs «Generar nómina»; bitácora RRHH en sidebar; «Guardar borrador» en `<details>` técnicos; persistencia diagnóstico BD; eliminado exception strip muerto; docs sidebar + 6 tabs.
- **Archivos:** rules estado-operativo/validación/workspace, workspace HTML, store, service, `nomina-periodo-diagnostico.repository.ts`, `27_nomina_periodo_diagnostico.sql`, docs módulo.
- **No tocado:** motor, estilos globales, `angular.json`.

## 2026-05-19 - NOM-WORKSPACE-LOC-MAQUETACION-01

- **Módulo:** Nómina mensual / consola LOC.
- **Cambio:** orden único Param→Trab→Mov→Rec (`proceso-mensual-area-orden.config.ts`); franja `@for`; exception strip oculto en Resumen; panel Resumen reordenado; trabajadores lista/DataGrid; liquidaciones editorial; Figma §6–7 sin rail.
- **Doc:** [`nom-workspace-loc-maquetacion-01.md`](modulos/nomina-mensual/nom-workspace-loc-maquetacion-01.md)
- **No tocado:** store, SQL, motor, estilos globales.

## 2026-05-19 - NOM-PERIODO-VERIFICAR-MODAL-02

- **Módulo:** Nómina mensual / verificación período.
- **Cambio:** modal automático tras `validarPeriodo` vía `buildInformacionPeriodoView` (secciones Críticos/Advertencias, éxito con «Generar nómina», destino `generar_nomina`).
- **Archivos:** `proceso-mensual-informacion-periodo.rules.ts`, facade, `proceso-mensual-container.vm.ts`, specs.
- **No tocado:** BD, localStorage, estilos globales.

## 2026-05-19 - NOM-PREVALIDACION-PARAMETROS-CTA-01

- **Módulo:** Nómina mensual / prevalidación y CTA.
- **Cambio:** `BLOQ-004` solo si `!parametrosOperativos`; estado operativo recibe `parametrosOperativos` y prioriza «Revisar trabajadores» sobre parámetros cuando el período ya está operativo.
- **Archivos:** `proceso-mensual-validacion-calculo.rules.ts`, `proceso-mensual-estado-operativo.rules.ts`, `proceso-mensual-presentacion.facade.ts`, specs.
- **No tocado:** BD, SQL, localStorage, estilos globales.

## 2026-05-19 - NOM-WORKSPACE-TABS-OPERATIONAL-01

- **Módulo:** Nómina mensual / workspace (7 tabs LOC).
- **Cambio:** tabs unificados con patrón `payroll-operational-tabs` del modal; CSS compartido `payroll-operational-tabs.css`; clases vía `claseDetalleRevisionTab`; nav con borde inferior, fondos por severidad, activo `ink/primary`.
- **Archivos:** `payroll-operational-tabs.css`, `proceso-mensual-container.css`, workspace/modal HTML+TS, `proceso-mensual-workspace-presentacion.rules.ts`.
- **No tocado:** estilos globales, facade/store, lógica `buildNominaWorkspaceTabsMeta`.

## 2026-05-19 - NOM-CONSOLE-LOC-01

- **Módulo:** Nómina mensual / `payroll-console`.
- **Cambio:** franja de excepciones (`payroll-exception-strip`) con pills críticas/advertencias; 7 tabs con indicador vía `buildNominaWorkspaceTabsMeta` (reusa rules del modal + ámbito movimientos/recurrentes).
- **Restricciones:** CSS local; sin estilos globales.

## 2026-05-19 - NOM-CONSOLE-LOC-PATRON-ADOPTADO

- **Decisión:** patrón **Consola operativa en capas (LOC)** como base del sistema para Nómina y mesas de período (doc `nomina-mensual-figma-maquetacion.md` §0).

## 2026-05-19 - NOM-WORKSPACE-CONSOLE-PREMIUM-02

- **Módulo:** Nómina mensual / consola del período.
- **Cambio:** `payroll-console` unifica franja, focus y tabs; `resolveFocusPresentacion` por frame (hero/compact/banner + variantes); franja tipo tarjetas con tab activo resaltado; focus compacto en borrador con meta lateral sin caja info duplicada.
- **Restricciones:** CSS local; sin estilos globales; CTA en topbar.

## 2026-05-19 - NOM-WORKSPACE-FRANJA-FOCUS-ICONS-01

- **Módulo:** Nómina mensual / workspace (franja + focus sin generar).
- **Cambio:** iconos Lucide en métricas clicables, tonos por estado, chevron de navegación; focus «sin generar» en dos columnas con checklist de áreas y visual compacto.
- **Restricciones:** CSS local `proceso-mensual-container.css`; CTA sigue en topbar.

## 2026-05-18 - ERP-SHELL-CONTEXT-ROLLOUT-02

- **Módulo:** Shell global + pantallas ERP bajo `layout-shell`.
- **Cambio:** `bindShellPageContext` + fallback por ruta; eliminacion de `app-record-breadcrumb` y periodo duplicado en movimientos/recurrentes; CTA principal en topbar donde aplica.
- **Restricciones:** sin estilos globales ni motor/store.

## 2026-05-18 - ERP-SHELL-SIDEBAR-TOPBAR-POLISH-01

- **Módulo:** Shell global + Nómina mensual (presentación).
- **Cambio:** sidebar 220 px (Principal/Gestión/Administración), topbar 52 px con breadcrumb/chips/CTA vía `ShellPageContextService`; Nómina sin `payroll-rail`, 7 tabs horizontales, bitácora y revisión en tab Resumen.
- **Restricciones:** CSS local layout + contenedor nómina; sin estilos globales ni motor/store.

## 2026-05-19 - NOM-MENSUAL-REAPERTURA-ELIMINACION-01

- **Módulo:** Nómina mensual / workspace operativo.
- **Cambio:** bloque secundario `payroll-period-actions` (Abrir / Descartar nómina generada; admin en `<details>`); sin mezclar con CTA principal.
- **Restricciones:** CSS local contenedor; sin estilos globales.

## 2026-05-19 - NOM-MODALES-PERIODO-INCIDENCIAS-DEDUPE-06

- **Módulo:** Nómina mensual / modal revisión (resumen «Pendientes del período»).
- **Cambio:** deduplicación de incidencias entre prevalidación, cálculo y snapshot; clave por código sin ámbito para avisos de período; huella por mensaje sin ámbito; observaciones de snapshot sin repetir por trabajador (SANNA, Ley 16.744); copy `parametros_generales.sanna` humanizado.
- **Restricciones:** solo rules + facade presentación; sin store/motor/estilos globales.

## 2026-05-19 - NOM-MODALES-PERIODO-COPY-LIMPIO-05

- **Módulo:** Nómina mensual / modal revisión.
- **Cambio:** copy visible normalizado en rules (no CSS para ocultar texto); contexto de lista con `text-transform: none`.
- **Restricciones:** sin store/motor/estilos globales.

## 2026-05-19 - NOM-MODALES-PERIODO-INCIDENCIAS-04

- **Módulo:** Nómina mensual / modal revisión.
- **Cambio visual:** sección única «Pendientes del período» con metadato de ámbito; tabs de área con botón «Ver en resumen (N)»; sin duplicar observaciones en franja expediente.
- **Restricciones:** CSS local modal; sin store/motor/estilos globales.

## 2026-05-19 - NOM-MODALES-PERIODO-REVISION-UX-01

- **Módulo:** Nómina mensual / modal revisión (`app-proceso-mensual-detalle-modal`).
- **Cambio visual:** tabs con indicador de severidad (fondos alineados a chips warning/danger/success del módulo); franja expediente con CTA secundario; bloques movimientos/recurrentes; empty states por tab.
- **Restricciones:** CSS local del modal; sin estilos globales ni store/servicios.

## 2026-05-18 - NOM-MENSUAL-INTEGRIDAD-REGISTRO-01

- **Módulo:** Nómina mensual / modal revisión + tab Detalle workspace.
- **Cambio visual:** bloques compactos `payroll-expediente-estado`, `payroll-expediente-franja`, panel `payroll-expediente-panel` en tab; mensajes RRHH para carga/error/sin detalle; enlace «Ver revisión completa».
- **Restricciones:** CSS local modal + contenedor; sin estilos globales ni cards decorativas.

## 2026-05-18 - NOM-MODALES-PERIODO-DETALLE-POLISH-01

- **Módulo:** Nómina mensual / modal revisión (`app-proceso-mensual-detalle-modal`).
- **Cambio visual:** footer sin duplicar CTA del workspace; acción contextual por tab; CSS movido al componente; sombra modal suavizada; eliminado disclosure con datos técnicos.
- **Restricciones:** sin facade slim, store, servicios, SQL, `app-message-box` ni estilos globales.

## 2026-05-18 - NOM-MENSUAL-WORKSPACE-LAYOUT-POLISH-01

- **Módulo:** Nómina mensual / workspace del contenedor.
- **Cambio visual:** densidad compacta, rail sin card, focus `payroll-focus--operativo`, aside editorial en confirmación, franja y tabs ajustados; responsive 980px/760px.
- **Restricciones:** solo CSS/HTML local del contenedor; sin lógica ni estilos globales.

## 2026-05-18 - NOM-MODALES-PERIODO-INFO-02

- **Módulo:** Nómina mensual / proceso mensual container.
- **Cambio visual:** errores y bloqueos post-generación pasan a `app-message-box` modal informativo (`app-proceso-mensual-informacion-modal`); el banner crudo de `errorEjecucion` se oculta cuando hay información guiada; el rail «Ver detalle» abre el tab contextual según bloqueos/advertencias.
- **Restricciones:** sin cambios al `app-message-box` compartido, sin estilos globales, sin SQL/motor/servicios.

## 2026-05-18 - NOM-MENSUAL-WORKSPACE-UI-01

- **Modulo:** Nomina mensual.
- **Cambio visual:** la pantalla se presenta como workspace operativo de RRHH: header compacto, rail izquierdo de bitacora/revision y foco derecho con estado + CTA principal.
- **Copy:** se priorizan `Generar nomina`, `Revisar trabajadores`, `Confirmar nomina`, `Generar liquidaciones` y `Nomina confirmada como base oficial para liquidaciones`.
- **Restricciones:** sin cards por defecto, sin gradientes, sin colores nuevos, sin estilos globales, sin motor, sin servicios, sin persistencia y sin liquidaciones productivas nuevas.

## 2026-05-18 - NOM-CIERRE-VISUAL-CLEAN-02

- **Módulo:** Nómina mensual / Preparar nómina.
- **Cambio visual:** franja operativa liviana del resumen; bloque `payroll-focus` con CTA ink cerca del copy; acta compacta en teaser o en «Más revisiones»; lista «Para continuar» editorial; registro del período solo en disclosure; rail sin card; footer de registro eliminado.
- **Restricciones:** solo HTML/CSS local; sin lógica, servicios, motor, SQL ni estilos globales.

## 2026-05-18 - NOM-PREPARAR-NOMINA-BASE-NOIA-UX-01

- **Módulo:** Nómina mensual / Preparar nómina.
- **Cambio visual:** cabecera con `app-record-breadcrumb`, panel `payroll-view-panel`, workspace en 2 columnas (rail bitácora + alertas | consola del paso actual), resumen del período en franja superior; se elimina la tercera columna de panel de apoyo duplicado.
- **Tokens:** `--bitacora-*` locales en el contenedor; copy operativo en lista «Para continuar».
- **Restricciones:** solo CSS/HTML/VM de presentación; sin estilos globales, SQL, motor, servicios ni persistencia.

## 2026-05-18 - NOM-PREPARAR-NOMINA-ACTA-DISENO-ESTRUCTURADO-UX-01

- **Modulo:** Nomina mensual / Preparar nomina.
- **Cambio visual:** el acta deja de leerse como card generica y queda como pieza de cierre operativo con header, contexto, decision, evidencia y alcance.
- **Modal:** `app-message-box` conserva el componente base, pero el contenido proyectado se ordena en secciones operativas.
- **Restricciones:** estilos locales, sin `border-left` fuerte, sin estilos globales, sin cambios de logica, sin persistencia y sin Liquidaciones oficiales.

## 2026-05-17 - NOM-PREPARAR-NOMINA-ACTA-ACCION-UX-01

- **Modulo:** Nomina mensual / Preparar nomina.
- **Cambio visual:** se agrega `Acta operativa del periodo` como componente local dentro del acta principal, con contexto revisado, decision operativa, evidencia para liquidaciones y accion confirmada por `app-message-box`.
- **Estados:** bloqueada, requiere revision, lista y preparada; cada estado usa borde completo neutro/funcional y fondos suaves.
- **Maquetacion:** header operativo, franja de contexto, panel dividido decision/evidencia y footer de alcance; no se uso card generica ni barra lateral fuerte.
- **Archivos tocados:** componente local `acta-operativa-periodo`, regla/modelo local, `proceso-mensual-container.ts/html/spec.ts` y documentacion Codex.
- **Restricciones:** sin estilos globales, sin barra lateral fuerte, sin SQL/RPC/RLS, sin motor, sin servicios, sin rutas, sin menu lateral ni DataGrid compartido.

## 2026-05-17 - NOM-LIQ-ACTA-GUIADA-DESIGN-00

- **Flujo Preparar nomina -> Liquidaciones:** fase documental para cerrar el contrato de actas guiadas por accion critica.
- **Regla central:** antes de ejecutar debe verse contexto, condicion y consecuencia; despues debe verse evidencia, registro y siguiente paso.
- **Pantallas:** Preparar nomina decide y cierra; Liquidaciones oficiales materializa y revisa el snapshot cerrado sin recalcular.
- **DataGrid:** se reserva para colecciones revisables; el acta conserva la decision principal.
- **Restricciones:** sin Angular, sin estilos globales, sin SQL/RPC/RLS, sin motor, sin servicios, sin rutas ni DataGrid compartido.

## 2026-05-17 - NOM-PREPARAR-NOMINA-ADMIN-WORKSPACE-DESIGN-00

- **Preparar nómina:** fase documental para cerrar la maqueta como mesa administrativa del período.
- **Regla central:** pantalla principal decide, revisión guiada explica, modal grande revisa, DataGrid lista, panel de apoyo corrige e información interna queda cerrada.
- **Contrato visual:** acta como centro de decisión, botones secundarios a la izquierda y primario a la derecha, panel separado en revisar/corregir/interno.
- **Restricciones:** sin Angular, sin estilos globales, sin SQL/RPC/RLS, sin motor, sin servicios, sin rutas ni DataGrid compartido.

## 2026-05-17 - NOM-PREPARAR-NOMINA-ADMIN-WORKSPACE-UX-01

- **Preparar nómina:** pantalla principal reforzada como mesa administrativa del período.
- **Acta:** concentra etapa, decisión, CTA principal, acciones secundarias y revisión resumida.
- **Modal grande:** `Revisión guiada` abre la pestaña `Guía`; el modal concentra guía, resumen operativo y DataGrid solo en tabs tabulares.
- **Panel de apoyo:** separa `Revisar en esta pantalla` de `Corregir en otro módulo`, con labels claros para trabajadores, parámetros, movimientos del mes y asignaciones recurrentes.
- **Restricciones:** sin estilos globales, SQL/RPC/RLS, motor, servicios, rutas ni DataGrid compartido.

## 2026-05-17 - NOM-PREPARAR-NOMINA-DECISION-LAYOUT-UX-01

- **Preparar nómina:** el acta se reorganiza como zona de decisión: contexto arriba, acción recomendada al centro y revisión resumida abajo.
- **Botones:** CTA principal y acciones secundarias quedan juntos, evitando que `Revisión guiada` y `Detalle operativo` floten separados.
- **Revisión:** bloqueos, advertencias y prioridades se muestran como tres accesos compactos y accionables.
- **Panel de apoyo:** detalles pasa a botonera operativa (`Guía`, `Obs.`, `Trabajadores`, `Movimientos`, `Recurrentes`) para mejorar escaneo.
- **Restricciones:** solo HTML/CSS local del contenedor; sin servicios, rutas, motor, SQL/RPC/RLS, estilos globales ni DataGrid compartido.

## 2026-05-17 - NOM-PREPARAR-NOMINA-DETAIL-CTA-UX-01

- **Preparar nómina:** los indicadores del resumen superior abren el detalle operativo en el tab correspondiente.
- **Revisión resumida:** bloqueos, advertencias y prioridades abren `Observaciones` directamente.
- **Panel de apoyo:** accesos compactos a observaciones, trabajadores, movimientos y recurrentes.
- **Bitácora lateral:** el menú de etapas se estira hasta el final útil de la pantalla en desktop y vuelve a altura natural en móvil.
- **Restricciones:** solo contenedor local; sin servicios, SQL/RPC/RLS, motor, rutas, estilos globales ni DataGrid compartido.

## 2026-05-17 - NOM-PREPARAR-NOMINA-BITACORA-V3-CLIENT-SAFE-DATAGRID-UX-01

- **Preparar nómina:** revisión guiada cliente-segura en modal corto; no muestra grillas, IDs, payloads, JSON, RPC ni trazabilidad técnica.
- **Detalle operativo:** modal ancho con tabs `Resumen`, `Trabajadores`, `Movimientos`, `Recurrentes`, `Observaciones` y `Resultado preliminar`.
- **DataGrid:** se reutiliza `app-data-grid` existente con filtros sobrios, conteo textual, sin exportación ni selección masiva.
- **Pantalla principal:** conserva 5 etapas, acta del período, panel de apoyo liviano y registro compacto; sin grillas inline.
- **Restricciones:** sin estilos globales, SQL/RPC/RLS, motor, servicios, rutas ni cambios al DataGrid compartido.

## 2026-05-17 - NOM-PREPARAR-NOMINA-BITACORA-V3-NONLINEAR-FLOW-UX-01

- **Preparar nómina:** revisión guiada en modal (`payroll-guided-review-overlay` / `payroll-guided-review-modal`); acta con `payroll-secondary-action`.
- **Panel de apoyo:** prioridad única + enlace al modal; sin listas largas de bloqueos/advertencias.
- **Registro:** línea compacta con separador `·`.
- **No regresión:** 5 etapas, subpasos solo activos, V3 intacta.

## 2026-05-17 - NOM-PREPARAR-NOMINA-BITACORA-V3-STEPS-FOCUS-UX-01

- **Bitácora del período:** 5 etapas con línea de resumen; subpasos (✓ ● ○) solo en etapa activa; máximo 4 subpasos.
- **Detalle bajo demanda:** «Ver detalle completo» → revisión guiada; bloqueos/advertencias → panel de apoyo.
- **No regresión:** sin 12 pasos visibles; sin chips; acta central conserva acción principal.

## 2026-05-17 - NOM-PREPARAR-NOMINA-BITACORA-V3-COPY-DENSITY-FIX-01

- **Preparar nómina:** copy visible con acentos; lenguaje operativo RRHH en acta y panel.
- **Densidad:** shell y columnas más compactas; registro del período con franja propia; revisión guiada cerrada hasta haber avance real.
- **No regresión:** 5 etapas visibles con subpasos progresivos; sin chips decorativos; detalle bajo demanda.
- **Restricciones:** sin lógica, motor, servicios, SQL ni estilos globales.

## 2026-05-17 - NOM-PREPARAR-NOMINA-BITACORA-V3-POLISH-UX-01

- **Preparar nómina (pulido V3):** bitácora con rail vertical y subpasos en filas (etiqueta + estado); sin chips en navegación.
- **Acta del período:** bloque central editorial (`payroll-acta`) con separadores suaves; acordeón de revisión guiada más bajo.
- **Panel de apoyo:** prioridades y correcciones en filas compactas; información interna cerrada por defecto.
- **Resumen:** franja `Resumen del período` en grilla de 4 columnas.
- **Restricciones:** solo HTML/CSS local; sin lógica, motor, servicios, SQL ni estilos globales.

## 2026-05-16 - NOM-PREPARAR-NOMINA-BITACORA-V3-UX-01

- **Preparar nómina V3:** bitácora operativa en un solo contenedor padre (`payroll-ledger-shell`).
- **5 etapas visibles** con subpasos solo en la etapa activa (`estadoOperativo().etapaActiva`); sin chips decorativos en navegación.
- **Cuerpo:** bitácora de etapas + acta del paso activo + detalle progresivo (pendientes, bloqueos, correcciones, alcance plegable).
- **Revisión guiada** bajo demanda en acordeón; registro compacto en pie.
- **Restricciones:** solo HTML/CSS local; sin lógica, motor, servicios, SQL ni estilos globales.

## 2026-05-16 - NOM-PREPARAR-NOMINA-NOIA-LAYOUT-UX-01

- **Preparar nómina:** la pantalla se reordena como bitácora operativa del período.
- **Franja operativa:** fusiona avance y resumen mínimo para mostrar estado, etapas e indicadores del período.
- **Workspace:** se organiza en `Mesa de preparación` y `Siguiente acción`.
- **Panel de acción:** integra acción principal, qué falta ahora, bloqueos, advertencias y accesos `Corregir en`.
- **Alcance:** información interna queda como disclosure secundario.
- **Restricciones:** sin estilos globales, SQL/RPC/RLS, motor, servicios, mappers, payloads, rutas ni persistencia crítica.

## 2026-05-16 - ERP-PRIMARY-COLOR-01

- **Primario global:** tokens `--erp-primary` / `--erp-primary-hover` (`#1e3a8a` / `#1d4ed8`) en `styles.css`; Tailwind `blue-600`/`blue-700` alineados; `app-button`, DataGrid, MessageBox y movimientos usan el mismo azul.
- **MessageBox:** botón X cierra el modal (emite `secondary` o `action` según acciones visibles); icono con `pointer-events: none`.

## 2026-05-16 - DATA-GRID-EMPTY-FILTER-UX-01

- **`app-data-grid`:** estado vacío (con o sin filtros) ocupa todo el cuerpo de la grilla (`#f8fafc`, sin card pequeña centrada); host con `gridHeight` estira card y scroll.
- **Gestionar movimientos:** modal con flex para que la grilla llene el área bajo la toolbar.
- **Archivos:** `data-grid.component.ts`, `novedades-mensuales-container.css`.

## 2026-05-16 - EMP-BASICO-MSGBOX-NOIA-01

- **Creación básica:** éxito, error, RUT duplicado y catálogos en carga usan `app-message-box` modal NOIA (secciones operativas); sin paneles `basic-success-followup` legacy en modo básico.
- **Archivos:** `form-empleado.{ts,html}`.

## 2026-05-16 - MESSAGE-BOX-NOIA-UX-01-FIX-02

- **`app-message-box`:** cuadro de decisión NOIA v3.1 — contenedor blanco borde `#d5dce8`, header `#f8fafc`, hasta 3 secciones compactas con tonos suaves (`attention`/`info`/`neutral`), footer secundaria izq / primaria der (`#1e3a8a`); sin línea superior de color, chips ni cards rojas/azules.
- **Creación avanzada:** modal «No se puede guardar el borrador» con copy operativo y secciones; sin lista dominante de campos.
- **Archivos:** `message-box.component.{ts,html,css,spec.ts}`; `form-empleado.{ts,html}`.
- **Doc:** `docs/codex/diseno/erp-msgbox-noia-ux-01.md`.

## 2026-05-16 - NOM-MOVIMIENTOS-BITACORA-UI-01

- **Bitácora operativa:** tokens locales (`--nm-*`) alineados a `bitacora-operativa-noia.md`; franja operativa sin card; contadores con tonos info/review/ok; estados de trabajador con color funcional.
- **Registrar movimiento del mes:** maquetación en bloque primario (3 columnas: tipo/monto/fecha), administrativo en `<details>`, resumen info antes de guardar.
- **Cabecera:** CTA primario **Registrar movimiento del mes** en la pantalla principal.
- **Archivos:** `novedades-mensuales-container.{html,ts,css}`.

## 2026-05-16 - NOM-MOVIMIENTOS-MODAL-MENSUAL-UX-02

- **Jerarquía de modales:** modal padre **Gestionar** amplio (mesa de trabajo: movimientos del mes, recurrentes, pendientes de revisión); modal hijo mensual compacto (860px) para registrar/editar un movimiento puntual.
- **Padre:** tres secciones con grillas compactas y CTA por bloque; footer **Cerrar**; el padre permanece abierto al abrir hijos mensual/recurrente.
- **Hijo mensual:** ficha informativa del trabajador (sin campo editable desde gestión), bloque **Datos del movimiento** neutro (sin azul dominante), validación solo al guardar o tras tocar campo, resumen dinámico, footer **Cancelar** + **Guardar movimiento/cambios**.
- **Z-index:** padre 1200, hijo 1310, `app-message-box` 1400.
- **Archivos:** `novedades-mensuales-container.{html,ts,css}`; sin estilos globales, SQL, motor ni payloads.

## 2026-05-16 - MESSAGE-BOX-FIGMA-V3-01

- **Alineación Figma v3:** panel con `message-content`, categoría + punto, secciones en bloque, botón primario relleno ink en modal, tokens NOIA, cierre absoluto arriba-derecha.
- **Movimientos:** confirmaciones migradas a `variant="decision"`, `sections` y copy operativo (sin `Aceptar`).

## 2026-05-16 - MESSAGE-BOX-NOIA-UX-01

- **Fase ERP-MSGBOX-NOIA-UX-01:** rebuild `app-message-box` v3 sin chips; línea superior 3px; categoría + punto; secciones estructuradas; footer izq/der; variantes `danger`/`decision`/`blocked`; API `sections`/`actions`/`width`; a11y Escape y foco; compat `error`/`confirm` y labels legacy. Doc: `docs/codex/diseno/erp-msgbox-noia-ux-01.md`.

## 2026-05-16 - MESSAGE-BOX-NOIA-02

- **`app-message-box`:** sin franja lateral ni iconos de estado en modal; panel tipo mini-diálogo ERP (borde neutro, título + texto + pie). Inline con tinte suave en todo el bloque. Botones outline discretos.

## 2026-05-16 - MESSAGE-BOX-NOIA-01

- (Revertido visualmente) franja lateral descartada por lectura genérica/IA.

## 2026-05-16 - SHARED-FIELD-HELP-TIP-02

- **Tooltip:** icono `?` más compacto (11px / hit 14px), popover en `body` para anclaje correcto en modales, flecha con `staticSide` Floating UI, sin flash previo al posicionar.

## 2026-05-16 - SHARED-FIELD-HELP-TIP-01

- **Componente compartido:** `app-field-help-tip` en `shared/components/ui` con Floating UI (`flip` arriba/abajo, `shift`, `arrow` alineado al icono).
- **Consumidores:** movimientos (`novedades-mensuales`), alta avanzada (`app-empleado-field-tip` alias), variable `--erp-floating-ui-z` en modales y wizard.

## 2026-05-16 - EMP-ALTA-AVANZADA-FIELD-TIP-01

- **Creación avanzada:** hints migrados a `app-empleado-field-tip` → tooltip compartido.
- **Secciones:** hints de `contrato` y `perfil-laboral` migrados de `field-message--hint` a tooltip en label; capa `--employee-floating-ui-z` en `.advanced-wizard-layout` para select/calendario.
- **Archivos:** `empleado-field-tip/*`, `contrato.*`, `perfil-laboral.*`, `form-empleado-shared.css`, `form-empleado.css`.

## 2026-05-16 - NOM-MOVIMIENTOS-MODAL-UX-03

- **Acciones de cierre:** sin **Cerrar**/**Cancelar** en pie si hay **X**; sin pistas genéricas en cabecera; modal mensual sin franja duplicada de trabajador; `<details>` con chevron; ayuda con **CircleHelp** y tooltip con cola al icono; rejilla modal (`nm-form-grid--modal`) con labels y controles alineados; sin **Resumen antes de guardar**.
- **Confirmaciones:** mensaje único al descartar (`Descartar y cerrar` / `Seguir editando`); finalizar recurrente con `No finalizar`.
- **Modal Gestionar:** contexto unificado (trabajador + resumen en franja), barra de altas sin caja «Acción recomendada», grilla sin cabecera duplicada, filtros neutros.
- **Estilo:** resumen y hints en gris neutro (sin bloques azules decorativos); alineación de `app-calendar-input` en formularios.
- **Archivos:** `novedades-mensuales-container.{html,ts,css}`.

## 2026-05-16 - NOM-MOVIMIENTOS-MODAL-UX-02

- **Modales movimiento mensual y recurrente:** franja de contexto (periodo/trabajador), pie dividido con **Volver a gestión** cuando se abre desde Gestionar, backdrop y cierre alineados a `cancelar*` con retorno a la grilla del trabajador.
- **Fechas:** `app-calendar-input` en fecha de referencia (mes) y vigencia inicio/fin (recurrente); fin opcional con `clearable` y mínimo según inicio.
- **Modal Gestionar:** toolbar superior con acciones recomendadas; sin pie duplicado de altas.
- **Archivos:** `novedades-mensuales-container.{html,ts,css,spec.ts}`.
- **Restricciones:** sin estilos globales, SQL, motor, servicios ni payloads.

## 2026-05-16 - NOM-MOVIMIENTOS-GESTION-TABLA-UNICA-01

- **Modal Gestionar:** una sola grilla unifica movimientos del mes y recurrentes, con columna **Ámbito**, filtros locales (`Todos`, `Del mes`, `Recurrentes`, `Por revisar`) y acciones solo cuando aplican.
- **Grilla principal:** los contadores (mes, recurrentes, revisión) abren el mismo modal con filtro preseleccionado; sin grillas duplicadas ni botón **Cerrar** redundante en el pie (cierre por X y backdrop).
- **Acciones:** se oculta **Pausar** (no implementado) y la columna muestra «Sin acciones» si no hay CTA válida.
- **Archivos:** `novedades-mensuales-container.{html,ts,css,spec.ts}`.
- **Restricciones:** sin estilos globales, SQL, motor, servicios ni payloads.

## 2026-05-16 - NOM-MOVIMIENTOS-RECURRENTES-PARITY-01

- **Haberes / recurrentes:** modal alineado a Movimientos con bloque **Cuotas** (UI preparada, campos deshabilitados) según concepto préstamo/anticipo/cuota.
- **Query params:** `?persona=` y `?accion=registrar` abren registro recurrente; la acción se limpia de la URL al consumirse.
- **Preparar nómina:** contador de recurrentes por trabajador enlaza a haberes con `persona` preseleccionada.
- **Ficha empleado:** copy `Revisar movimientos recurrentes` (enlace con `persona`).
- **Tests:** `haberes-descuentos-container.spec.ts` (sin tabbar, query params, modal registrar).
- **Archivos:** `haberes-descuentos-container/*`, `ficha-empleado-container.html`, `proceso-mensual-container.html`.
- **Restricciones:** sin estilos globales, SQL, motor, servicios ni payloads.

## 2026-05-16 - NOM-MOVIMIENTOS-RECURRENTES-TABBAR-01

- **Haberes / recurrentes (`/remuneraciones/haberes-descuentos`):** se elimina el tabbar `Este mes | Recurrentes | Todos` para alinear con `NOM-MOVIMIENTOS-POR-TRABAJADOR-02`.
- **Navegación:** el retorno a movimientos del período queda en el lead y en el breadcrumb (`Movimientos de remuneración` enlaza a novedades-mensuales).
- **Guía:** nota operativa breve sobre cuotas (sin disclosure de duraciones del flujo mensual).
- **Copy:** tildes en título visible y textos principales.
- **Archivos:** `src/app/features/haberes-descuentos/containers/haberes-descuentos-container/haberes-descuentos-container.{html,css,ts}`.
- **Restricciones:** sin estilos globales, SQL, motor, servicios ni payloads.

## Regla anti-card

- Evitar cards repetidas sin jerarquia.
- Antes de usar card, evaluar franja operativa, registro de bitacora, panel dividido, linea de estado, lista de revision, bloque editorial, tabla contextual, disclosure o MessageBox.
- Una card solo corresponde si el bloque representa entidad, resumen, decision, resultado agrupado o ficha/expediente acotado.

## 2026-05-16 - NOM-MOVIMIENTOS-GESTION-INTEGRAL-01

- **Movimientos de remuneración:** la pantalla queda como menú único de gestión de movimientos del mes y recurrentes.
- **Patrón:** la grilla por trabajador sigue siendo la entrada principal; `Gestionar` abre el contexto del trabajador antes de cualquier formulario.
- **Modales:** el modal del trabajador separa `Movimientos del mes`, `Recurrentes` y `Pendientes de revisión`; los formularios de movimiento mensual y recurrente son modales distintos.
- **Recurrentes:** se gestionan dentro de la pantalla con alta/edición/finalización usando capacidades existentes. Las acciones sin soporte real quedan no disponibles.
- **Cuotas:** aparecen solo dentro del formulario recurrente como sección preparada, nunca dentro del modal mensual.
- **Restricciones:** sin estilos globales, sin SQL/RPC/RLS, sin motor, sin persistencia crítica y sin tests nuevos.

## 2026-05-15 - NOM-MOVIMIENTOS-SIMPLE-00

- **Remuneraciones:** fase documental para unificar conceptualmente `Movimientos del mes` y `Asignaciones recurrentes` bajo `Movimientos de remuneracion`.
- **Duracion visible:** se definen `Solo este mes`, `Recurrente` y `En cuotas` como lectura simple para RRHH.
- **Preparar nomina:** queda recomendado mostrar resumen de movimientos detectados y accion `Revisar movimientos`, sin duplicar edicion.
- **Restricciones:** sin Angular, rutas, SQL/RPC/RLS, motor, liquidaciones, servicios productivos, mappers, payloads ni estilos globales.
## 2026-05-15 - PARAM-BITACORA-LAYOUT-ALIGN-01

- **Parametros:** la pantalla se ordena como bitacora normativa del periodo, reforzando cabecera, estado mensual y accion recomendada.
- **v2: cierre normativo:** la franja principal distingue lectura oficial y configuracion cliente, con el cierre normativo como protagonista.
- **Tabs:** labels principales mas compactos como navegacion normativa; la logica de tabs no cambia.
- **Registro activo:** se agrega contexto humano corto para la seccion visible y los filtros del DataGrid quedan con menor peso visual.
- **Separacion oficial/cliente:** `Configurar cliente` y `Modificar configuracion` se comunican como configuracion cliente; los datos oficiales siguen siendo lectura/referencia.
- **Restricciones:** sin estilos globales, sin budgets, sin SQL/RPC/RLS, sin Python, sin wrapper, sin servicios/repositorios y sin reconciliacion nueva.

## 2026-05-15 - ERP-TABS-NOIA-UX-01

- **Navegacion secundaria transversal:** tabs, subtabs y steppers se alinean a `NOIA / Bitacora Operativa` con borde completo, fondo suave, foco visible y punto compacto de estado/activo.
- **Componentes base:** `app-stepper`, `app-tabbar` y `app-tabs` dejan de depender de subrayados o estados genericos; el stepper usa lenguaje visible `En edicion`, `Listo`, `Requiere datos` y `Pendiente`.
- **Parametros:** tabs principales y subtabs conservan scroll interno, pero el activo pasa a tab administrativo con borde completo y marca discreta; no se altera la logica periodo/vigencia/catalogo.
- **Empleados:** Ficha y Creacion avanzada mantienen `Bitacora laboral`, con chips/tabs mas sobrios y foco accesible sin barras fuertes ni sombras.
- **Nomina mensual y Reportes:** timeline/tabbar se compactan como navegacion operativa, evitando subrayado azul dominante y manteniendo estados como lectura secundaria.
- **Ajuste posterior:** tabbars quedan como pestanas tipo archivo, conectadas al panel y con distribucion flexible para ocupar el ancho disponible antes de hacer scroll horizontal.
- **Compactacion posterior:** las barras dejan de forzar 100% cuando no corresponde; los tabs usan ancho por contenido, menos separacion y quedan mas cerca del panel.
- **Restricciones:** sin SQL/RPC/RLS, sin motor, sin servicios, sin mappers, sin payloads, sin rutas/guards, sin estilos globales protegidos y sin subir budgets.

## 2026-05-14 - EMP-ALTA-VALIDACIONES-ASISTIDAS-01

- **Creación avanzada:** los mensajes del paso vuelven a concentrarse en `app-message-box`; no quedan tarjetas inline permanentes dentro del formulario.
- **MessageBox:** se amplía el ancho útil del modal y se mejora la lectura de descripciones/listas para que los pendientes y revisiones no se sientan comprimidos.
- **Resumen final:** se mantiene `Estado por etapa` como consolidado único; no se duplica con un bloque adicional de validaciones asistidas.
- **Interacción:** `Siguiente` vuelve a mostrar MsgBox cuando hay pendientes o revisiones; las acciones siguen siendo `Continuar` o `Corregir ahora`.
- **Estilo:** fondos suaves por intención, borde completo, radio 8px y densidad compacta. Sin `border-left` decorativo fuerte ni estilos globales.

### 2026-05-13 (Empleados - auditoría de coherencia global del alta)

- **Sin cambio visual aplicado**: se documenta la matriz de aplicabilidad y coherencia para futuras mejoras de Creación avanzada.
- **Criterio UX definido**: diferenciar validación obligatoria, campo no aplicable/derivado y revisión administrativa con decisión RRHH vía `app-message-box`.
- **Referencia**: `docs/codex/modulos/empleados/alta-coherencia-global-00.md`.

## EMP-ADV-LAYOUT-CONSISTENCY-01 - Pulido visual local de Creacion avanzada

- En Creacion avanzada, el wizard usa mas ancho disponible sin cambiar estructura ni flujo.
- El mapa de ficha queda como soporte lateral secundario y mas compacto; el contenido del paso mantiene el protagonismo.
- Se reducen alturas minimas en pasos cortos para evitar cards artificialmente altas.
- `Guardar borrador` queda como accion secundaria local en azul suave mediante `advanced-draft-button`.
- El resumen final queda mas compacto, con menos padding y checklist mas denso.
- Contrato y Bancario ajustan paddings/gaps solo bajo modo avanzado, manteniendo la maqueta y tipografia del ERP.
- Restricciones: cero estilos globales, cero cambios de logica/flujo, cero SQL/RPC/RLS/BD, cero cambios en creacion basica, ficha empleado o remuneraciones.

## EMP-ADV-HONORARIOS-UX-01 - Boleta de honorarios

- En Creacion avanzada, `Boleta de honorarios` se trata como modo visual propio y no como contrato dependiente.
- Las fases que no corresponden se muestran como `No aplica` con copy administrativo.
- El usuario puede guardar borrador, pero no finalizar como trabajador dependiente hasta implementar la persistencia real.
- Los mensajes usan `app-message-box`, tono RRHH y acciones claras: confirmar cambio, guardar borrador o cerrar.

## Peticiones de estilos (bitácora)

### 2026-05-12 - EMP-PERFIL-LABORAL-SQL-01 - Sin cambios visuales

- **Modulo:** Empleados / base SQL.
- **Cambio:** se prepara la persistencia de condiciones especiales del trabajador y el perfil laboral derivado.
- **UI:** no se modifica HTML, CSS ni TypeScript; cualquier tarjeta o formulario visible queda para `EMP-PERFIL-LABORAL-UI-01`.
- **Restricciones:** no tocar estilos globales, flujo del wizard, motor, liquidaciones, LRE ni Previred.


### 2026-05-11 - REM-UX-FLOWS-01 V3 - Visibilidad cliente vs aplicacion

- **Modulo:** Remuneraciones transversal.
- **Preparar nomina:** el avance principal muestra etapas comprensibles para usuario final: `Preparacion`, `Revision`, `Aprobacion y cierre`, `Liquidaciones`. El flujo interno queda como detalle y trazabilidad secundaria.
- **Copy visible:** se reemplazan etiquetas tecnicas principales (`Resultado guardado desde BD`, `Identificador tecnico`, `Version del calculo`) por `Detalle del resultado guardado`, `Referencia interna` y `Version interna`.
- **Liquidaciones oficiales:** `Que falta ahora` conserva solo estado, pendiente, advertencias y accion; la trazabilidad interna baja al disclosure final.
- **Ajuste posterior:** `Que falta ahora` sale de la columna lateral del CTA y pasa a una banda propia de ancho completo con columnas compactas y listas con altura contenida; esto evita espacios en blanco cuando hay muchos bloqueos o advertencias.
- **Restricciones:** sin SQL/RPC/RLS/BD, sin formulas legales ni motor, sin PDF/firma/envio, sin Previred/LRE/banco/contabilidad.

### 2026-05-10 - REM-UX-FLOWS-01 V2 - Periodo global y accion principal

- **Modulo:** Remuneraciones transversal.
- **Preparar nomina:** se elimina el selector local editable `Periodo a validar` y el boton duplicado `Validar periodo` del header. El periodo queda como contexto compacto del periodo activo global y el CTA principal vive en `Siguiente accion recomendada`.
- **Liquidaciones oficiales:** se elimina el selector local editable de periodo y el CTA primario duplicado en la botonera superior; `Generar liquidaciones oficiales` queda como accion principal del bloque operativo.
- **Auditoria:** Asignaciones recurrentes, Dashboard y Reportes ya muestran periodo global como contexto. Movimientos del mes mantiene selector local justificado como consulta/listado por periodo y queda como deuda para una fase de unificacion si se requiere.
- **Restricciones:** sin SQL/RPC/RLS/BD, sin formulas legales ni motor, sin PDF/firma/envio, sin Previred/LRE/banco/contabilidad.

### 2026-05-04 - Fase 9.5B - Resumen recurrentes y grupos de parametros (Proceso mensual)

- **Modulo:** Remuneraciones / Proceso mensual (`/remuneraciones/proceso-mensual`).
- **Cambio:** bajo el resumen existente (activos aptos / parametros operativos), parrafo con conteos de recurrentes aplicables al mes, invalidas, fuera del mes y cerradas; linea compacta **Parametros (grupos):** con `id=clasificacion` por grupo (sin valores UF/UTM ni topes literales).
- **Archivos:** `src/app/features/nomina-mensual/containers/proceso-mensual-container/proceso-mensual-container.html`, `proceso-mensual-container.spec.ts`.

### 2026-05-03 - PARAM-CHILE-01 - Limpieza demo Proceso mensual

- **Modulo:** Remuneraciones / Proceso mensual (`/remuneraciones/proceso-mensual`).
- **Cambio:** se retiraron cifras normativas y totales demo (UF, sueldo minimo, tabla 2026, nomina, banco, fechas de vencimiento literales); tarjeta informativa superior; pasos calculo/export/cierre marcados como no disponibles; enlace a Parametros; sin rediseno profundo del shell.
- **Archivos:** `src/app/pages/proceso-remuneraciones.page.ts`.

### 2026-05-04 - Fase 9.5A - Prevalidaciones en Proceso mensual

- **Modulo:** Remuneraciones / Proceso mensual (`/remuneraciones/proceso-mensual`).
- **Cambio:** selector `input type="month"`, boton **Validar periodo**, tarjetas de estado/bloqueos/advertencias/informaciones y listado por areas; cabecera indica periodo global vs periodo a validar; paso 1 sustituye placeholders locales previos (sin motor, sin cifras normativas).
- **Archivos:** `src/app/features/nomina-mensual/containers/proceso-mensual-container/*`, `src/app/features/nomina-mensual/services/proceso-mensual.service.ts`, `src/app/features/nomina-mensual/rules/proceso-mensual-prevalidacion.rules.ts`, `src/app/features/nomina-mensual/models/proceso-mensual.model.ts`.

### 2026-05-04 - PARAM-CHILE-01 v4 - Proceso mensual en contenedor `nomina-mensual`

- **Modulo:** Remuneraciones / Proceso mensual.
- **Cambio:** UI movida a `features/nomina-mensual/containers/proceso-mensual-container/` (html, css, ts, spec); la pagina de ruta queda como wrapper minimo (`frontend-interfaces`).
- **Archivos:** `src/app/pages/proceso-remuneraciones.page.ts`, `src/app/features/nomina-mensual/containers/proceso-mensual-container/*`.

### 2026-05-03 (Movimientos variables — pantalla 9.4E)

- **Módulo:** Movimientos variables (Remuneraciones).
- **Cambio:** nueva pantalla `/remuneraciones/movimientos-variables` con cabecera al estilo Haberes (breadcrumb, período de referencia, botonera), tarjeta de filtro por `input type="month"`, `DataGrid` con chips de estado y modales propios (clases `mv-*`); ítem de menú con icono **sliders**; hint en Haberes enlaza a esta ruta.
- **Archivos:** `src/app/features/movimientos-variables/containers/movimientos-variables-container/*`, `src/app/pages/movimientos-variables.page.ts`, `src/app/app.routes.ts`, `src/app/layout/sidebar.component.ts`, `src/app/features/haberes-descuentos/containers/haberes-descuentos-container/haberes-descuentos-container.{html,css,ts}`.

### 2026-05-03 (Fase 9.3B.1 — Navegacion dominio Remuneraciones)

- **Modulo:** Remuneraciones (rutas y menu lateral).
- **Cambio:** rutas oficiales bajo `/remuneraciones/*` para Conceptos, Haberes y descuentos, Proceso mensual y Liquidaciones; orden de items en sidebar alineado a ese dominio.
- **Compatibilidad:** `/haberes-descuentos`, `/proceso-remuneraciones`, `/liquidaciones` y `/liquidaciones/:id` quedan como redirects temporales a las rutas oficiales.
- **UI:** sin rediseno profundo; etiqueta de menu **Proceso mensual** (antes Proceso Remuneraciones); breadcrumb primer segmento enlaza a `/remuneraciones`.
- **Archivos:** `src/app/app.routes.ts`, `src/app/layout/sidebar.component.ts`, `src/app/pages/liquidaciones.page.ts`, `src/app/pages/detalle-liquidacion.page.ts`, `src/app/features/empleados/containers/ficha-empleado-container/ficha-empleado-container.html`, contenedores Haberes/Conceptos (breadcrumb).

### 2026-05-03 (Codificación e idioma de presentación)

- **`index.html`**: `lang="es-CL"` para alinear el documento al español chileno (tipografía del sistema y lectores de pantalla).
- **`app.config.ts`**: `LOCALE_ID` `es-CL`, `DEFAULT_CURRENCY_CODE` `CLP` y `registerLocaleData` para que pipes de Angular (fecha, número, moneda) usen convenciones locales coherentes y no mezclen formato en-US por defecto.

### 2026-05-03 (Haberes y descuentos - vista historica 9.3C)

- **Filtro de vigencia**: queda integrado al panel de filtros del `DataGrid`, con default **Operativas** (`ACTIVA + FUTURA`) y opciones **Todas**, **Activas**, **Futuras**, **Vencidas**, **Cerradas** e **Invalidas**.
- **Historial visible**: cerradas, vencidas e invalidas quedan consultables mediante filtros sin mezclarse con la vista operativa por defecto.
- **Acciones por estado**: editar/cerrar queda deshabilitado para filas historicas o invalidas, evitando doble cierre y cambios operativos sobre historial.
- **Archivos**: `src/app/features/haberes-descuentos/containers/haberes-descuentos-container/haberes-descuentos-container.{html,css,ts}`.

### 2026-05-03 (Haberes y descuentos - cierre controlado 9.3B)

- **Accion por fila**: se reemplaza el copy visible **Desactivar** por **Cerrar** para asignaciones recurrentes, alineado a cierre/desactivacion logica sin delete fisico.
- **Confirmacion**: modal simple indica que la asignacion dejara de aplicar y se conservara en historial.
- **Mensaje de exito**: se agrega confirmacion **Asignacion cerrada correctamente.**
- **Archivos**: `src/app/features/haberes-descuentos/containers/haberes-descuentos-container/haberes-descuentos-container.{html,ts}`.
Registro cronológico de mejoras visuales aplicadas por petición, con foco en **trazabilidad** (qué se tocó y dónde),
sin mezclarlo con las reglas base.

### 2026-05-03 (Haberes — copy alineación asignables 9.2C)

- **Cabecera `/remuneraciones/haberes-descuentos`**: el párrafo `hd-lead` aclara que el selector de concepto respeta la misma regla de asignabilidad que el catálogo Conceptos (sin cambio de layout).
  - `src/app/features/haberes-descuentos/containers/haberes-descuentos-container/haberes-descuentos-container.html`

### 2026-05-03 (Conceptos — detalle 9.2B)

- **Modal de detalle** (`/remuneraciones/conceptos`): overlay con `cr-detalle-root`; cuerpo con scroll (`max-height` + flex), **footer fijo** (Cerrar + Editar condicional); secciones con títulos `cr-detalle-section-title`; listas de motivos y bloqueos en tipografía compacta.
- **Chips de vigencia**: variante **inválida** (fechas incoherentes) con estilo distintivo `.hd-chip--vig-invalid`.
  - `src/app/features/haberes-descuentos/containers/conceptos-remuneracion-container/*`

### 2026-05-02 (Conceptos — listado 9.2A)

- **Catálogo `/remuneraciones/conceptos`**: cabecera con texto de catálogo maestro (sin prometer cálculo de liquidaciones); grilla con columnas Nombre → Código → Tipo → LRE → Vigencia → Origen → Cálculo → Asignable; chips de vigencia (ok / futuro / vencido / no vigente); chips Origen (Sistema, Protegido, Usuario); texto **LRE no asignado** en gris; filtros en rejilla `auto-fit` compacta; acción **Revisar** con ícono ojo.
  - `src/app/features/haberes-descuentos/containers/conceptos-remuneracion-container/*`

### 2026-05-02 (Empleados - resumen paso 9 pendientes de negocio)

- **Creación avanzada / paso 9**: bloque informativo compacto bajo la checklist de
  etapas cuando se intentó finalizar y hay bloqueos: título «Pendientes para
  finalizar», lista con mensajes de negocio (fondo `#f8fafc`, borde neutro).
  - `src/app/features/empleados/components/form-empleado/form-empleado.{html,css,ts}`

### 2026-05-02 (Empleados - selects con opción vacía)

- **Catálogos**: primera fila explícita «Seleccione…» / «Sin seleccionar» en `app-search-select` de identidad, domicilio, contrato, previsión, APVI y banco; el disparador muestra placeholder gris hasta elección real (mismo patrón `SearchSelectComponent`).
  - `src/app/features/empleados/utils/empleado-select-options.ts`
  - `src/app/features/empleados/components/secciones/datos-personales/*`
  - `src/app/features/empleados/components/secciones/contacto/*`
  - `src/app/features/empleados/components/secciones/contrato/*`
  - `src/app/features/empleados/components/secciones/prevision-salud/*`
  - `src/app/features/empleados/components/secciones/bancario/*`

### 2026-05-02 (Empleados - validacion explicita para remuneraciones)

- **Ficha empleado**: accion principal **Validar para remuneraciones** solo cuando
  la ficha no tiene bloqueos ni defaults tecnicos y aun no esta apta; confirmacion
  compacta con botones **Cancelar** y **Validar**.
- **Mensajes operativos**: estado `Ficha completa` + `Pendiente de validación`
  cuando faltaba solo la confirmación; errores de validación muestran hasta cinco
  pendientes principales y «y X pendientes más» con tilde; textos de bloqueo
  alineados a negocio (p. ej. cuenta temporal, cargo real, sueldo, previsión/APVI).
- **Diálogo de confirmación**: título «¿Validar esta ficha para remuneraciones?»
  y cuerpo con tildes (`podrá`, `remuneración`, `período`).
- **Sin activacion automatica**: guardar secciones ya no deja apta la ficha por
  efecto lateral; la aptitud queda atada a la accion explicita.
  - `src/app/features/empleados/containers/ficha-empleado-container/ficha-empleado-container.{html,css,ts}`
  - `src/app/features/empleados/services/empleados.service.ts`
  - `src/app/features/empleados/data-access/empleados.repository.ts`

### 2026-05-02 (Parametros - estandar UI del modulo)

- **Estandar documentado**: se creo `docs/codex/temas/parametros-ui-estandar.md` (stub; fuente vigente `docs/codex/modulos/parametros/ui-parametros.md`) con estructura oficial, banda superior, tabs, subtabs, copy, empty states, DataGrid, cards compactas, responsive y checklist de cierre.
- **Clases semanticas compatibles**: se agregaron aliases `parametros-period-*`, `parametros-tabs`, `parametros-tab-button`, `parametros-inner-*`, `parametros-tab-panel`, `parametros-section-card`, `parametros-config-card`, `parametros-form-grid` y `parametros-grid-shell` sin retirar las clases legacy.
- **Referencias docs/codex**: README, AGENTS y estilos apuntan al nuevo estandar para futuras mejoras de Parametros.
  - `src/app/pages/parametros.page.ts`
  - `src/styles.css`
  - `src/app/features/parametros-generales/components/parametros-inner-tab-bar.component.ts`
  - `src/app/features/parametros-generales/components/tabs/*.ts`
  - `docs/codex/modulos/parametros/ui-parametros.md` (histórico: `docs/codex/temas/parametros-ui-estandar.md`)

### 2026-05-02 (Parametros - referencia anterior en carga pendiente)

- **Empty states mensuales pendientes**: Tramos Cargas, Impuesto Unico, Ley 16.744, Valores y Remuneraciones muestran mensajes breves cuando el periodo activo no tiene datos oficiales.
- **Referencia sin mezclar datos**: si hay un periodo anterior con datos mensuales, se ofrece una accion secundaria `Ver referencia ...` que cambia el selector al periodo anterior; no se renderizan ni guardan datos anteriores dentro del periodo activo.
- **Banda superior liviana**: en estados pendiente/parcial solo agrega `Referencia disponible: ...` cuando corresponde, manteniendo el detalle corto sobre datos oficiales faltantes y catalogos/vigencias disponibles.
  - `src/app/pages/parametros.page.ts`
  - `src/app/features/parametros-generales/components/tabs/parametros-valores-tab.component.ts`
  - `src/app/features/parametros-generales/components/tabs/parametros-remuneraciones-tab.component.ts`
  - `src/app/features/parametros-generales/components/tabs/parametros-tramos-carga-tab.component.ts`
  - `src/app/features/parametros-generales/components/tabs/parametros-tramos-renta-tab.component.ts`
  - `src/app/features/parametros-generales/components/tabs/parametros-ccaf-mutuales-tab.component.ts`

### 2026-05-02 (Parámetros - banda superior período / estado mensual)

- **Dos zonas flex sin solape**: izquierda título + controles de período + hint corto de sincronización; derecha estado mensual (título + chip único + detalle); sin grid de tres columnas ni texto largo competiendo con los selects.
- **Crear parámetros** queda en la botonera junto a **Modificar** (secundario a la izquierda del primario), no en la banda de período.
- **Pulido final banda**: menos aire entre toolbar y `.period-row` (`parametros-viewhead` gap/padding); bloque estado con ancho ~22rem, `margin-left: auto`, texto y chip alineados a la izquierda dentro del bloque (sin pegar al borde derecho del card); detalle con `text-wrap: balance` donde el motor lo soporta.
- **Copy acotado**: títulos `Estado mensual: …` y detalles breves por pendiente / completo / parcial / error / edición; advertencia suave solo en pendiente (chip); parcial en variante info.
  - `src/app/pages/parametros.page.ts`
  - `src/styles.css`

### 2026-05-01 (Parametros - estado simple y tabs limpios)

- **Banda superior como fuente de estado**: el periodo ahora comunica pendiente, parcial, completo, editando o error con un chip unico y una descripcion corta; los catalogos/vigencias se explican como disponibles aunque falte carga mensual.
  - `src/app/pages/parametros.page.ts`
- **Tabs sin chips repetidos**: se quitaron los hints/chips de tipo de dato en Valores, Remuneraciones, CCAF/Mutual, Tramos, Impuesto, Salud, Prevision y Reforma; quedan titulo, filtros, tabla y empty state especifico.
  - `src/app/features/parametros-generales/components/tabs/parametros-valores-tab.component.ts`
  - `src/app/features/parametros-generales/components/tabs/parametros-remuneraciones-tab.component.ts`
  - `src/app/features/parametros-generales/components/tabs/parametros-ccaf-mutuales-tab.component.ts`
  - `src/app/features/parametros-generales/components/tabs/parametros-tramos-carga-tab.component.ts`
  - `src/app/features/parametros-generales/components/tabs/parametros-tramos-renta-tab.component.ts`
  - `src/app/features/parametros-generales/components/tabs/parametros-salud-tab.component.ts`
  - `src/app/features/parametros-generales/components/tabs/parametros-afp-tab.component.ts`
  - `src/app/features/parametros-generales/components/tabs/parametros-reforma-tab.component.ts`

### 2026-05-01 (Parametros - copy compacto por tipo de dato)

- **Hints sin detalles tecnicos de BD**: se reemplazaron explicaciones visibles con nombres de tablas/columnas por chips compactos de contexto (`Mensual`, `Vigencia`, `Catalogo global`, `Normativa`, `Solo lectura`) y frases de una linea.
  - `src/app/features/parametros-generales/components/tabs/parametros-tramos-carga-tab.component.ts`
  - `src/app/features/parametros-generales/components/tabs/parametros-tramos-renta-tab.component.ts`
  - `src/app/features/parametros-generales/components/tabs/parametros-ccaf-mutuales-tab.component.ts`
  - `src/app/features/parametros-generales/components/tabs/parametros-salud-tab.component.ts`
  - `src/app/features/parametros-generales/components/tabs/parametros-afp-tab.component.ts`
  - `src/app/features/parametros-generales/components/tabs/parametros-reforma-tab.component.ts`
- **Periodo visible sin cambiar filtros**: las tabs de consulta reciben el periodo seleccionado solo para el chip `Periodo YYYY-MM`; no se modificaron repositorios, servicios ni reglas de carga.
  - `src/app/pages/parametros.page.ts`

### 2026-05-01 (Parametros - filtros por periodo, vigencia y catalogo)

- **Politica de filtros por tipo de dato**: las grillas de Parametros separan datos mensuales, vigencias y catalogos globales. AFP/Salud/Legales/AFC usan solape de vigencia; CCAF/Mutuales/APV se muestran como catalogos generales; Reforma > Aportes muestra el calendario normativo completo y marca estado segun periodo activo.
  - `src/app/features/parametros-generales/data-access/parametros-generales.repository.ts`
  - `src/app/pages/parametros.page.ts`
- **Copy/empty states**: se corrigieron filtros visibles de `Periodo` a `Vigencia inicio` donde corresponde y se ajusto Reforma para no comunicar la gradualidad como faltante mensual.
  - `src/app/features/parametros-generales/components/tabs/parametros-salud-tab.component.ts`
  - `src/app/features/parametros-generales/components/tabs/parametros-reforma-tab.component.ts`
  - `src/app/features/parametros-generales/components/tabs/parametros-ccaf-mutuales-tab.component.ts`

### 2026-05-01 (Tablas ERP — estándar transversal)

- **Estándar oficial de tablas/DataGrid**: se documentó qué mostrar/no mostrar, orden de columnas, formatos de fechas/montos/porcentajes/vacíos, filtros, toolbar, loading, empty states, paginación, acciones y responsive.
  - `docs/codex/ui-tables.md`
  - `docs/codex/README.md`
  - `docs/codex/estilos/README.md`
- **Defaults de DataGrid**: valores vacíos pasan a `—`, booleanos a `Sí/No` y fechas sin formateador explícito a formato local consistente, manteniendo loading/scroll dentro del componente.
  - `src/app/shared/components/ui/data-grid.component.ts`
- **Aplicación inicial**: Haberes y descuentos reduce columnas visibles a valor operativo único (monto/porcentaje), fechas con formato local y columnas secundarias ocultas; Conceptos oculta origen técnico por defecto, muestra modo Automático/Manual, estado Vigente/No vigente y vigencias; Parámetros normaliza vacío, CLP, porcentaje y fechas.
  - `src/app/features/haberes-descuentos/containers/haberes-descuentos-container/haberes-descuentos-container.ts`
  - `src/app/features/haberes-descuentos/containers/conceptos-remuneracion-container/conceptos-remuneracion-container.{ts,html}`
  - `src/app/pages/parametros.page.ts`

### 2026-05-01 (Parámetros — hints y empty states por vigencia vs período)

- **Copy alineado a datos reales**: se evita culpar al “mes seleccionado” cuando la grilla es catálogo global o listado por solape de vigencia; se aclara gradualidad 8,5 % como normativa por vigencia.
  - `src/app/features/parametros-generales/components/tabs/parametros-ccaf-mutuales-tab.component.ts`
  - `src/app/features/parametros-generales/components/tabs/parametros-reforma-tab.component.ts`
  - `src/app/features/parametros-generales/components/tabs/parametros-tramos-renta-tab.component.ts`
  - `src/app/features/parametros-generales/components/tabs/parametros-tramos-carga-tab.component.ts`
  - `src/app/features/parametros-generales/components/tabs/parametros-salud-tab.component.ts`
  - `src/app/features/parametros-generales/components/tabs/parametros-afp-tab.component.ts`
- **Documentación de contrato**: matriz de tablas y reglas UI/Python/DataGrid.
  - `docs/codex/modulos/parametros/periodo-vigencia-catalogo.md` (histórico: `docs/codex/temas/parametros-vigencia-y-periodo.md`)
  - `docs/codex/README.md`

### 2026-05-01 (Parámetros del sistema — Fase 2.5 pulido visual menor)

- **Tabs principales con scroll interno más intencional**: se amplió el respiro lateral y `scroll-padding-inline` de `nav.folder-tabs`, se mantuvo el auto-centrado del tab activo y se agregó un fade lateral sutil desde el contenedor para sugerir scroll sin tapar texto.
  - `src/app/pages/parametros.page.ts`
- **CCAF y Mutual como configuración vigente**: la subpestaña de configuración queda titulada como **Configuración vigente del período**, con copy breve, ancho contenido y grilla compacta de los mismos tres campos existentes.
  - `src/app/features/parametros-generales/components/tabs/parametros-ccaf-mutuales-tab.component.ts`
- **Banda de período**: se mantiene el patrón aprobado de estado/chip/acción; no se cambiaron datos, sincronización ni lógica del período global.
  - `src/app/pages/parametros.page.ts`

### 2026-04-28 (documentación)

- **Índice padre único**: `docs/codex/README.md` con reglas por petición y mapa por tema.
- **Eliminados** `bases-estilos.md` y `estilos-base.md` (contenido redundante); rutas de código en `docs/codex/temas/implementacion-ui.md`.
- Referencias actualizadas en `AGENTS.md`, `manual-base-proyecto.md`, `estilos/README.md`, `ui-form-guidelines.md`, `temas/modo-basico-empleado.md`.

### 2026-04-28 (listado empleados)

- **Tabla listado**: `filtersEnabled=false` en `tabla-empleados.html` (sin barra global de busqueda/filtros del DataGrid; coincide con pedido original).

### 2026-04-29 (Ficha de Empleado)

- **Tipografía**: jerarquía alineada a `ui-form-guidelines.md` (`--erp-text-xs/sm/md`, `--erp-title-sm/md`) en hero, revisión por bloque, rejilla de datos y panel lateral.
- **Fondo**: página/host `#f8fafc`; títulos y franjas con barra `#f8fafc` (`section-head`, `detail-block-head`, cabecera `file-status-card`, franja tabs `file-tabs-wrap`, resumen superior `file-sheet-head`).
- **Iconos**: tamaños 14–16px (toolbar 14px, revisión/sección/título estado); Lucide `ClipboardList`, `FolderOpen`, `Activity` en Encabezados.
- **Archivos**: `ficha-empleado-container.{html,css,ts}`.

### 2026-04-29 (Ficha de Empleado — ajuste fino)

- **Secciones**: sin íconos en cabeceras de bloque; títulos sólo texto sobre franja gris.
- **Editar**: botón por sección más ligero (peso 500, `--erp-text-xs`), sin ícono; alineado a la derecha (`margin-left: auto`).
- **Panel lateral**: `gap` interno un poco menor; título sin ícono ni franja extra.
- **Copy**: `Fecha término`, `Tiempo de colación` en `detailItems`.

### 2026-04-27
- **Creación Básica de Empleado (modo básico)**:
  - Se agregó encabezado/ayuda del flujo básico (sin tocar lógica).
    - `src/app/features/empleados/components/form-empleado/form-empleado.html`
    - `src/app/features/empleados/components/form-empleado/form-empleado.css`
  - Se reorganizó el layout visual de “datos personales” en modo básico con grilla interna de 8 columnas (scoped a `.step-panel--basic`).
    - `src/app/features/empleados/components/secciones/datos-personales/datos-personales.css`

- **Documentación SQL (ligereza visual)**:
  - Se mejoró lectura/jerarquía de los README de base.
    - `bd/base/README.md`
    - `bd/base/v11/README.md`

### 2026-04-30 (Creación básica — ficha en proceso)

- **Creación básica más clara y consistente**: se unificó el lenguaje a **empleado** en el modo básico, se cambió el CTA a **“Guardar ficha básica”**, se corrigieron acentos/copy, se agregó aviso informativo sutil del alcance, y se reordenaron secciones para separar **Contacto** como bloque propio. Además se corrigió el patrón de layout para evitar formularios demasiado anchos: **máximo 4 columnas en desktop (2 tablet, 1 móvil)** y secciones de 2 campos con **ancho contenido** (sin grilla 8 columnas). Finalmente se balanceó el layout para evitar vacío lateral: wrapper centrado **~1120px** y “Datos personales + Contacto” en **2 columnas** en desktop.
  - `src/app/features/empleados/components/form-empleado/form-empleado.{ts,html,css}`
  - `src/app/features/empleados/components/secciones/datos-personales/datos-personales.{html,css}`
  - Ajuste final: se evitó la duplicidad fuerte de título (“Crear empleado” arriba + “Nuevo empleado” dentro), se reforzó “Documento de identificación *” como **grupo** (RUT o pasaporte) y se redujo el texto inferior para que no duplique el encabezado.
  - Validaciones (UX): Email/Teléfono opcionales ya no muestran mensajes si están vacíos; placeholders pasaron a formato “Ej:” para no confundirse con datos reales.
  - **Reglas de maquetación**: se documentó el patrón de **CSS por capas** (scoping) para evitar estilos genéricos que se pisan entre modos/secciones.
  - **Reglas de maquetación**: se agregó la regla de **contenedor padre a límite inferior** (altura 100% + `minmax(0, 1fr)` cuando aplique).
  - Pulido de jerarquía: se eliminó el texto pequeño duplicado “Creación básica” dentro del bloque y el label quedó como “Pasaporte (opcional)”.
  - Alineación: el header interno “Creación básica [En proceso]” se alineó al mismo eje (`max-width`) que el formulario para evitar desconexión visual.

### 2026-04-30 (Listado empleados — acción integrada)

- **Acción “Crear empleado” integrada al DataGrid**: el CTA se movió al header del `app-data-grid` (patrón de `conceptos-remuneracion`), con menú Básico/Avanzado desplegable desde el mismo botón.
  - `src/app/features/empleados/containers/listado-empleados-container/listado-empleados-container.{html,ts}`
  - `src/app/features/empleados/components/tabla-empleados/tabla-empleados.{html,ts,css}`

### 2026-04-30 (Conceptos remuneración — toolbar)

- **Se quitó “Refrescar” del header de página** para evitar duplicidad: queda solo el refresco del `app-data-grid`.
  - `src/app/features/haberes-descuentos/containers/conceptos-remuneracion-container/conceptos-remuneracion-container.{html,ts}`

### 2026-04-30 (DataGrid — filtro rango fechas)

- **Filtro rango fecha más claro y seguro**: labels visibles “Desde/Hasta” (sin depender de placeholder), validación para impedir “Hasta < Desde”, acción “Limpiar” del rango, y soporte opcional `disallowFuture` para evitar fechas futuras (ej. fecha real de ingreso).
  - `src/app/shared/components/ui/data-grid.component.ts`
  - `src/app/features/empleados/components/tabla-empleados/tabla-empleados.ts`

### 2026-04-30 (Listado empleados — filtros sin chips)

- **Fila de chips de filtros activos parametrizable**: se agregó `filterChipsDisplay` al `app-data-grid` y en empleados se configuró para que los chips solo aparezcan si los filtros están ocultos (evita duplicidad).
  - `src/app/shared/components/ui/data-grid.component.ts`
  - `src/app/features/empleados/components/tabla-empleados/tabla-empleados.html`

### 2026-04-30 (DataGrid — filtros vs columnas ocultas)

- **Filtros consistentes al ocultar columnas**: `visibleFilters` ya no “revive” filtros de columnas ocultas como standalone; ahora respeta `column.showFilterWhenHidden` y limpia automáticamente el filtro al ocultar una columna si no debe mantenerse.
  - `src/app/shared/components/ui/data-grid.component.ts`
  - `src/app/features/empleados/components/tabla-empleados/tabla-empleados.ts`

### 2026-04-30 (Listado empleados — empty state y header)

- **Empty states contextuales + contador claro**: en empleados se diferenció “sin empleados” vs “sin resultados por filtros”, el header muestra `· N resultados` y opcional `· N filtros activos`, y el empty state se posicionó más arriba para evitar un centro vacío gigante. Botones: `Limpiar` se deshabilita si no hay filtros; `Aplicar` solo es primario/habilitado cuando hay cambios pendientes.
  - `src/app/shared/components/ui/data-grid.component.ts`
  - `src/app/features/empleados/components/tabla-empleados/tabla-empleados.{html,css}`
  - `src/app/features/empleados/containers/listado-empleados-container/listado-empleados-container.ts`

### 2026-04-30 (Listado empleados — popover crear empleado)

- **Popover “Crear empleado” anclado al botón**: el dropdown ahora se renderiza dentro del header del `app-data-grid` (anclado al CTA), no se dispara desde “Buscar”, y se cierra por click fuera, Escape, selección o navegación.
  - `src/app/shared/components/ui/data-grid.component.ts`
  - `src/app/features/empleados/components/tabla-empleados/tabla-empleados.{html,ts,css}`

- **Pulido visual del popover**: header con título en casing normal, sombra liviana, separador sutil, opciones 100% clickeables, hover suave e ícono “+” a la derecha dentro de contenedor.
  - `src/app/features/empleados/components/tabla-empleados/tabla-empleados.{html,css}`

- **Ajuste final de ancho/offset**: popover en ~296px (rango 280–300) y separación de 8px bajo el botón, manteniendo `max-width` responsivo.
  - `src/app/features/empleados/components/tabla-empleados/tabla-empleados.css`

### 2026-04-30 (Creación avanzada — maquetación limpia)

- **Creación avanzada alineada a patrón de creación básica** (sin tocar lógica): se aplicó **ancho controlado** (~1120px) con header interno alineado al eje del formulario, y se agregó un encabezado liviano “Datos completos del empleado” con descripción del alcance del alta avanzada.
  - `src/app/features/empleados/components/form-empleado/form-empleado.{ts,html,css}`
- **Grillas de captura sin 8 columnas**: se eliminaron las grillas `repeat(8, ...)` en los componentes del flujo avanzado y se estandarizó a **máximo 4 columnas en desktop (2 tablet, 1 móvil)** con spans moderados.
  - `src/app/features/empleados/components/secciones/datos-personales/datos-personales.css`
  - `src/app/features/empleados/components/secciones/contacto/contacto.css`
  - `src/app/features/empleados/components/secciones/contrato/contrato.css`
  - `src/app/features/empleados/components/secciones/prevision-salud/prevision-salud.css`
  - `src/app/features/empleados/components/secciones/bancario/bancario.css`
- **Pulido stepper + primer paso (Datos personales)**: se bajó el ruido del stepper (el **nombre del paso** es principal; el estado queda como **badge** secundario) y se evitó el quiebre desordenado en dos filas usando **scroll horizontal**. Además el paso 1 ahora incluye **Contacto (Email/Teléfono)** junto a Identificación/Nombre/Datos personales, manteniendo el mismo patrón de tarjetas limpio.
  - `src/app/features/empleados/components/form-empleado/form-empleado.{ts,html,css}`
  - `src/app/features/empleados/components/secciones/datos-personales/datos-personales.html`
  - `src/app/features/empleados/models/empleado-form.manifest.ts`
  - Ajuste UX: se agregó encabezado contextual del paso (**“Paso X de 9 · …”** + descripción breve) y se ocultó la scrollbar del stepper para que el overflow horizontal se sienta más limpio.
  - **Wrapper estable del wizard avanzado**: se creó una estructura de layout con clases dedicadas (`advanced-create-shell/inner`, `advanced-wizard-layout`, `advanced-wizard-map`, `advanced-wizard-content`, `advanced-wizard-footer`) para centralizar la maquetación del flujo avanzado y evitar ajustes aislados por bloque. En desktop se habilita el panel lateral **“Mapa de ficha”** (2 columnas) y en tablet/móvil se oculta para mantener lectura en una columna.

### 2026-05-01 (Parámetros del sistema — Fase 2 layout fino)

- **Tabs principales sin cortes**: el tab activo se auto-centrará dentro del scroll interno de `nav.folder-tabs` al cambiar de pestaña; se ajustó `scroll-padding`/padding para evitar recortes por borde.
  - `src/app/pages/parametros.page.ts`
- **Grillas vacías con altura razonable**: se acotó `gridHeight` a `min(520px, 100%)` en pestañas con catálogos/empty states frecuentes (sin tocar lógica, columnas ni filtros), evitando “cajas gigantes vacías” sin inflar filas.
  - `src/app/features/parametros-generales/components/tabs/parametros-tramos-carga-tab.component.ts`
  - `src/app/features/parametros-generales/components/tabs/parametros-tramos-renta-tab.component.ts`
  - `src/app/features/parametros-generales/components/tabs/parametros-ccaf-mutuales-tab.component.ts`
  - `src/app/features/parametros-generales/components/tabs/parametros-reforma-tab.component.ts`

### 2026-04-30 (Creacion avanzada - Mapa de ficha como navegacion desktop)

- **Navegacion avanzada sin duplicidad**: en desktop el panel lateral **Mapa de ficha** queda como navegacion principal y el stepper horizontal se reserva para tablet/movil.
  - `src/app/features/empleados/components/form-empleado/form-empleado.{html,css}`
- **Estados visuales menos alarmantes**: se agrego estado visual **Actual**, resumen de pendientes/errores en el mapa y se evita pintar pasos no intentados como **Con errores** desde el inicio; el rojo queda limitado al badge/borde sutil cuando corresponde.
  - `src/app/features/empleados/components/form-empleado/form-empleado.{ts,html,css}`

### 2026-04-30 (Creacion avanzada - Mapa de ficha timeline)

- **Mapa de ficha como guia visual**: se agrego progreso por posicion del paso, porcentaje, resumen corto y timeline vertical con linea sutil, numeros y estados secundarios.
  - `src/app/features/empleados/components/form-empleado/form-empleado.{ts,html,css}`
- **Jerarquia del contenido derecho**: el encabezado contextual del paso queda primero y "Datos completos del empleado" pasa a bloque introductorio secundario con fondo neutro.
  - `src/app/features/empleados/components/form-empleado/form-empleado.{html,css}`

### 2026-04-30 (Creacion avanzada - refinamiento visual del timeline)

- **Acabado visual del Mapa de ficha**: se reforzo la lectura de timeline con linea vertical mas legible, estado activo integrado, hover/focus visibles y progreso con texto "N% completado" dentro del bloque.
  - `src/app/features/empleados/components/form-empleado/form-empleado.{html,css}`
- **Bloque informativo secundario**: se suavizo la tarjeta "Datos completos del empleado" con borde/fondo mas livianos y menor altura visual.
  - `src/app/features/empleados/components/form-empleado/form-empleado.css`

### 2026-04-30 (Creacion avanzada - timeline sin bordes pesados)

- **Mapa de ficha mas integrado**: se quitaron marcos visibles del panel y de los items, dejando un riel de timeline, fondos suaves y acentos laterales para evitar apariencia de tarjetas genericas.
  - `src/app/features/empleados/components/form-empleado/form-empleado.css`
- **Bloque informativo sin caja marcada**: "Datos completos del empleado" queda como banda secundaria con acento lateral, sin borde rectangular.
  - `src/app/features/empleados/components/form-empleado/form-empleado.css`

### 2026-04-30 (Creacion avanzada - Paso 1 como patron base)

- **Paso 1 mas compacto y jerarquico**: se ajusto el encabezado a "identidad legal, datos personales y contacto base", se transformo la introduccion pesada en una nota liviana y se ordenaron los bloques como Identificacion legal, Nombre, Datos personales y Contacto.
  - `src/app/features/empleados/components/form-empleado/form-empleado.{ts,html,css}`
  - `src/app/features/empleados/components/secciones/datos-personales/datos-personales.{html,css}`
- **Grillas proporcionales por bloque**: Identificacion legal usa 4/2/1 columnas, Nombre prioriza Nombres sobre apellidos, Datos personales y Contacto acotan su ancho interno para evitar selects o campos opcionales gigantes.
  - `src/app/features/empleados/components/secciones/datos-personales/datos-personales.css`
- **Ajuste fino de proporcion**: se amplio moderadamente el eje desktop del wizard, se redujo el espacio vertical entre cards del Paso 1, se compacto el padding de bloques con pocos campos y se separo el footer inferior con margen y borde suave.
  - `src/app/features/empleados/components/form-empleado/form-empleado.css`
  - `src/app/features/empleados/components/secciones/datos-personales/datos-personales.css`
- **Microajuste final de densidad**: se redujo el aire entre el encabezado avanzado y el contenido, la nota informativa paso a ancho contenido y los bloques cortos del Paso 1 quedaron con padding/gap mas compacto.
  - `src/app/features/empleados/components/form-empleado/form-empleado.css`
  - `src/app/features/empleados/components/secciones/datos-personales/datos-personales.css`
- **Cierre de patron del Paso 1**: la nota informativa mantiene estilo liviano pero vuelve a ocupar el ancho del contenido para alinearse con las cards del formulario.
  - `src/app/features/empleados/components/form-empleado/form-empleado.css`

### 2026-04-30 (Creacion avanzada - Paso 2 domicilio)

- **Paso 2 alineado al patron del Paso 1**: se actualizo la bajada del paso Domicilio y la nota informativa liviana cambia su texto cuando el paso activo es Domicilio, manteniendo ancho alineado a las cards.
  - `src/app/features/empleados/components/form-empleado/form-empleado.{ts,html,css}`
- **Domicilio particular mas proporcional**: Calle queda mas ancha, Numero y Depto. mas compactos, Comuna queda en ancho medio y Observaciones ocupa ancho completo con altura contenida.
  - `src/app/features/empleados/components/secciones/contacto/contacto.{html,css}`
- **Estabilizacion visual del Paso 2**: se agrego una capa especifica para mantener altura minima razonable del panel Domicilio, sostener el footer en una posicion estable y reducir la altura inicial de Observaciones.
  - `src/app/features/empleados/components/form-empleado/form-empleado.{html,css}`
  - `src/app/features/empleados/components/secciones/contacto/contacto.css`
- **Contenedor padre hasta el final de pagina**: se ajusto el eje avanzado para que la columna de contenido y el panel del paso crezcan hasta el alto disponible, manteniendo el footer estable sin inflar las cards internas.
  - `src/app/features/empleados/components/form-empleado/form-empleado.css`
- **Regla documentada como estandar**: el contenedor padre visible de pantallas y wizards debe llegar al final de la pagina/viewport disponible; el alto se resuelve en el marco padre, no inflando cards internas ni campos.
  - `docs/codex/estilos/README.md`
  - `docs/codex/ui-form-guidelines.md`

### 2026-04-30 (Creacion avanzada - Paso 3 contrato y organizacion)

- **Paso 3 alineado al patron del wizard**: se actualizo la bajada y la nota informativa contextual para Contrato y organizacion, usando la misma alerta liviana alineada al contenido.
  - `src/app/features/empleados/components/form-empleado/form-empleado.{ts,html,css}`
- **Bloques contractuales separados y compactos**: Relacion laboral queda como seleccion breve, Contrato agrupa tipo trabajador/tipo contrato/indefinido y fechas, Organizacion separa departamento/sucursal, y Centro de costo conserva cargo como campo protagonista.
  - `src/app/features/empleados/components/secciones/contrato/contrato.{html,css}`
- **Altura estable del Paso 3**: el panel de contrato participa del mismo contenedor flexible del wizard para mantener el footer estable sin inflar cards internas.
  - `src/app/features/empleados/components/form-empleado/form-empleado.css`
- **Ajuste fino de densidad del Paso 3**: se compacto el bloque Contrato, la ayuda de Indefinido quedo como hint secundario, el subtitulo de fechas se suavizo, Organizacion redujo aire interno y Cargo gano ancho relativo frente a Centro de costo y Estado inicial.
  - `src/app/features/empleados/components/secciones/contrato/contrato.css`

### 2026-04-30 (Creacion avanzada - Paso 4 jornada y remuneracion)

- **Paso 4 alineado al patron del wizard**: se actualizo la bajada y la nota informativa contextual para Jornada y remuneracion, manteniendo alerta liviana y ancho alineado a las cards.
  - `src/app/features/empleados/components/form-empleado/form-empleado.{ts,html,css}`
- **Jornada y remuneracion por bloques**: el bloque de remuneracion se separo visualmente en Jornada laboral, Distribucion y colacion, Remuneracion base y Condiciones de remuneracion, sin mover campos fuera del paso ni cambiar bindings.
  - `src/app/features/empleados/components/secciones/contrato/contrato.html`
- **Grillas proporcionales del Paso 4**: Tipo jornada y sueldo base ganan ancho relativo, horas/dias/colacion quedan compactos, condiciones se muestran como checks livianos y el panel participa del mismo alto estable del wizard.
  - `src/app/features/empleados/components/secciones/contrato/contrato.css`
- **Ajuste fino de densidad del Paso 4**: Distribucion y colacion redujo padding/alto interno, colacion quedo como campo corto, Condiciones de remuneracion se acoto en ancho y los hints de checks quedaron mas discretos.
  - `src/app/features/empleados/components/secciones/contrato/contrato.{html,css}`
- **Correccion visual del Paso 4**: Distribucion de la jornada dejo de ocupar fila completa y queda alineada en desktop con Tiempo de colacion como campo corto, manteniendo el scope de clases solo en los bloques del paso.
  - `src/app/features/empleados/components/secciones/contrato/contrato.html`

### 2026-04-30 (Creacion avanzada - Paso 5 asignaciones y condiciones)

- **Paso 5 alineado al patron del wizard**: se actualizo la bajada y la nota informativa contextual para Asignaciones y condiciones especiales, manteniendo alerta liviana y contenedor estable.
  - `src/app/features/empleados/components/form-empleado/form-empleado.{ts,html,css}`
- **Asignaciones y condiciones por bloques**: Asignacion familiar, Zona extrema y Semana corrida quedan como cards compactas con encabezado liviano y ayuda secundaria.
  - `src/app/features/empleados/components/secciones/contrato/contrato.html`
- **Grillas proporcionales del Paso 5**: cargas/tramo/valor se alinean en desktop, zona extrema separa decision/territorio/porcentaje, y semana corrida usa selector de dias compacto sin inflar altura interna.
  - `src/app/features/empleados/components/secciones/contrato/contrato.css`

### 2026-04-30 (Creación avanzada — Paso 5 ajuste fino)

- **Asignación familiar**: etiqueta “Cargas” más corta, “Tabla vigente” pasa a chip discreto, y “Valor por carga” refuerza estilo de dato calculado (readonly con borde punteado).
  - `src/app/features/empleados/components/secciones/contrato/contrato.html`
  - `src/app/features/empleados/components/secciones/contrato/contrato.css`
- **Zona extrema y Semana corrida (inactivos)**: los campos condicionales dejan de ocupar espacio cuando el toggle está apagado y se reemplazan por una nota muted, evitando la impresión de editabilidad.
  - `src/app/features/empleados/components/secciones/contrato/contrato.html`
- **Eje consistente del Paso 5**: los contenedores `grid` de Asignación familiar / Zona extrema / Semana corrida usan el mismo ancho máximo para evitar saltos visuales entre bloques.
  - `src/app/features/empleados/components/secciones/contrato/contrato.css`

### 2026-04-30 (Creación avanzada — layout wizard ajuste fino)

- **Paso X**: se eliminó la caja informativa repetida bajo el subtítulo del paso; queda solo “Paso X de 9 · Nombre” + subtítulo breve.
  - `src/app/features/empleados/components/form-empleado/form-empleado.html`
  - `src/app/features/empleados/components/form-empleado/form-empleado.css`
- **Footer estable**: el footer del wizard se mantiene al ancho completo del layout (spanning mapa + contenido) y vive dentro de `advanced-create-inner` para conservar eje y posición estable.
  - `src/app/features/empleados/components/form-empleado/form-empleado.html`
  - `src/app/features/empleados/components/form-empleado/form-empleado.css`
- **Alineación de header**: el header superior usa la misma grilla (270px + contenido) para alinear “Creación avanzada” con el mapa y “Volver” con el borde derecho del contenido/footer.
  - `src/app/features/empleados/components/form-empleado/form-empleado.css`
- **Footer estable por altura mínima del cuerpo**: el área central del wizard usa `minmax(..., 1fr)` con un mínimo común en desktop para reducir saltos visuales entre pasos cortos y largos (sin inflar cards internas).
  - `src/app/features/empleados/components/form-empleado/form-empleado.css`
- **Orden HTML corregido**: el footer del wizard se renderiza después del cuerpo (`advanced-wizard-layout`) y no antes del layout principal.
  - `src/app/features/empleados/components/form-empleado/form-empleado.html`
- **Referencia de alto (Paso 9)**: el mínimo común del cuerpo del wizard se alinea al `min-height` usado por los paneles de paso (incluye Resumen final) para que todos los pasos compartan el mismo marco vertical.
  - `src/app/features/empleados/components/form-empleado/form-empleado.css`
- **Scroll/foco al cambiar de paso**: al presionar Anterior/Siguiente el wizard sube al inicio útil del paso (header del paso) y en desktop enfoca el primer campo habilitado (en <=1024px no enfoca para evitar teclado).
  - `src/app/features/empleados/components/form-empleado/form-empleado.ts`

### 2026-04-30 (Creacion avanzada - ancho uniforme de grillas)

- **Grillas internas con el mismo ancho visual en Pasos 1 a 5**: se normalizo el ancho de los contenedores `grid` dentro de las cards para que los bloques no cambien de eje entre secciones; las proporciones de columnas se mantienen por tipo de campo.
  - `src/app/features/empleados/components/secciones/datos-personales/datos-personales.css`
  - `src/app/features/empleados/components/secciones/contrato/contrato.css`

### 2026-04-30 (Creacion avanzada - Paso 5 microajuste final)

- **Semana corrida mas compacta**: cuando el calculo esta inactivo, se muestra solo una nota muted breve y no se reserva encabezado/espacio para dias ocultos.
  - `src/app/features/empleados/components/secciones/contrato/contrato.html`
  - `src/app/features/empleados/components/secciones/contrato/contrato.css`
- **Errores de Zona extrema mas contenidos**: los mensajes de Territorio y Asignacion (%) se compactaron para no romper la grilla.
  - `src/app/features/empleados/components/secciones/contrato/contrato.html`

### 2026-04-30 (Creacion avanzada - Paso 6 prevision y salud)

- **Paso 6 alineado al patron del wizard**: se actualizo la bajada y la alerta informativa liviana para Prevision y salud, manteniendo el mismo eje visual de los pasos anteriores.
  - `src/app/features/empleados/components/form-empleado/form-empleado.{ts,html,css}`
- **Prevision y salud por bloques compactos**: Regimen previsional, AFP, IPS / Ex-Caja y Salud quedan con encabezados discretos, ayudas secundarias y grillas proporcionales sin cambiar bindings ni condiciones.
  - `src/app/features/empleados/components/secciones/prevision-salud/prevision-salud.{html,css}`
- **Responsive del Paso 6**: desktop usa campos principales mas anchos y monetarios compactos; tablet reorganiza a dos columnas y mobile apila a una columna sin reservar espacio para bloques que no aplican.
  - `src/app/features/empleados/components/secciones/prevision-salud/prevision-salud.css`
- **Orden visual de IPS y Salud**: IPS / Ex-Caja queda en dos filas proporcionales (Entidad + Ex-Caja, Regimen + Tasa) y Salud mantiene institucion protagonista con montos compactos.
  - `src/app/features/empleados/components/secciones/prevision-salud/prevision-salud.css`
- **Salud mas clara y responsive**: en desktop los cuatro campos quedan en una fila con Institucion como columna protagonista; en ancho intermedio Institucion ocupa fila completa y moneda/valores se reordenan sin vacios visuales.
  - `src/app/features/empleados/components/secciones/prevision-salud/prevision-salud.css`
- **Responsividad progresiva del Paso 6**: al disminuir ancho, AFP/IPS/Salud priorizan el campo principal en fila completa, luego agrupan secundarios en dos columnas y finalmente apilan todo a una columna para mantener orden y visibilidad.
  - `src/app/features/empleados/components/secciones/prevision-salud/prevision-salud.css`
- **Corte intermedio ampliado del Paso 6**: el modo de dos columnas legible se aplica desde 1380px hacia abajo para evitar compresion visual entre 1180px y 1380px.
  - `src/app/features/empleados/components/secciones/prevision-salud/prevision-salud.css`
- **Corte de seguridad responsive del Paso 6**: el apilado a una columna comienza antes del breakpoint general para evitar solapes entre 1075px y el cambio de layout del wizard.
  - `src/app/features/empleados/components/secciones/prevision-salud/prevision-salud.css`

### 2026-04-30 (Creacion avanzada - Paso 9 resumen final)

- **Resumen final como pantalla de cierre**: se ajusto la bajada del Paso 9, la alerta informativa y el texto de avance del mapa para evitar la contradiccion entre recorrido y pasos pendientes.
  - `src/app/features/empleados/components/form-empleado/form-empleado.{ts,html}`
- **Estado por etapa mas compacto y semantico**: las filas del checklist usan numero, descripcion breve, chip de estado y accion Revisar secundaria, manteniendo la navegacion existente.
  - `src/app/features/empleados/components/form-empleado/form-empleado.{html,css,ts}`
- **Resumen principal y footer alineados al patron del wizard**: la sintesis de Nombre, RUT/Pasaporte, Cargo y Sucursal queda en grilla compacta, con footer estable y accion final Finalizar alta.
  - `src/app/features/empleados/components/form-empleado/form-empleado.css`

### 2026-04-30 (Creacion avanzada - Paso 6 decision previsional)

- **Regimen previsional como decision principal**: el bloque inicial incorpora chip de estado para AFP, IPS, sin regimen o pendiente, con ayuda breve bajo el selector.
  - `src/app/features/empleados/components/secciones/prevision-salud/prevision-salud.{html,css,ts}`
- **AFP, IPS y sin prevision con contexto visual**: las cards condicionales explican el efecto sobre APVI y el estado sin prevision deja claro que no se solicitan AFP, IPS ni APVI.
  - `src/app/features/empleados/components/secciones/prevision-salud/prevision-salud.{html,css}`
- **Impacto APVI al cierre del Paso 6**: se agrego un bloque compacto que indica si el siguiente paso sera APVI, si queda opcional u omitido, o si el flujo continua con Bancario, sin cambiar navegacion ni validaciones.
  - `src/app/features/empleados/components/secciones/prevision-salud/prevision-salud.{html,css,ts}`

### 2026-04-30 (Creacion avanzada - Paso 6 reduccion de ruido)

- **Copy visible mas compacto**: el Paso 6 conserva una sola frase superior y elimina subtitulos/notas repetidas dentro de Regimen, AFP, IPS y Salud.
  - `src/app/features/empleados/components/form-empleado/form-empleado.{html,ts}`
  - `src/app/features/empleados/components/secciones/prevision-salud/prevision-salud.html`
- **Impacto APVI simplificado**: el bloque inferior muestra solo destino al continuar y estado APVI, sin explicaciones duplicadas ni cajas de ayuda permanentes.
  - `src/app/features/empleados/components/secciones/prevision-salud/prevision-salud.{html,css,ts}`

### 2026-04-30 (Creacion avanzada - Paso 6 estados sin acento lateral)

- **Estados contextuales sin barra izquierda**: los bloques Sin prevision, Salud sin datos e Impacto APVI reemplazan el acento lateral por borde suave, fondo neutro y chips internos.
  - `src/app/features/empleados/components/secciones/prevision-salud/prevision-salud.css`

### 2026-04-30 (Creacion avanzada - Mapa de ficha sin acento lateral)

- **Paso activo sin barra izquierda**: el item activo del Mapa de ficha deja de usar acento lateral y queda marcado con fondo azul suave, borde sobrio, marcador numerico y chip de estado.
  - `src/app/features/empleados/components/form-empleado/form-empleado.css`

### 2026-04-30 (Creacion avanzada - Mapa de ficha panel compacto)

- **Mapa lateral como lista sobria**: el Mapa de ficha pasa a panel blanco con borde, cabecera separada, resumen en chip y filas compactas sin linea vertical de timeline.
  - `src/app/features/empleados/components/form-empleado/form-empleado.css`

### 2026-04-30 (Creacion avanzada - eje global del wizard)

### 2026-05-02 (Empleados - estado operativo y aptitud)

- **Listado**: estado visual y accion principal derivados de `pasoAltaAvanzada`,
  `estadoFicha`, `aptoParaRemuneraciones` y estado operativo; `Borrador`
  prioriza **Continuar alta**, `En proceso` usa **Completar ficha** y activo no
  apto usa **Revisar pendientes**.
- **Ficha empleado**: panel superior compacto con estado de ficha, aptitud,
  pendientes principales y accion siguiente; el panel lateral reutiliza los
  pendientes calculados por el helper central.
- **Defaults tecnicos**: `DRAFT-*`, `Sin cargo`, sueldo base cero y datos
  bancarios sin valor real se muestran como pendientes operativos, no como datos
  reales.
  - `src/app/features/empleados/components/tabla-empleados/tabla-empleados.{html,ts,css}`
  - `src/app/features/empleados/containers/ficha-empleado-container/ficha-empleado-container.{html,ts,css}`

- **Footer en el marco padre del wizard**: el pie de Anterior / Siguiente / Finalizar alta se mueve al grid principal para compartir ancho con cabecera, mapa y contenido, manteniendose estable al cambiar de paso.
  - `src/app/features/empleados/components/form-empleado/form-empleado.{html,css}`
- **Layout flexible sin inflar cards internas**: el cuerpo central ocupa el espacio disponible y el footer queda en la fila final del wrapper avanzado, sin padding artificial en cards o campos.
  - `src/app/features/empleados/components/form-empleado/form-empleado.css`
- **Separacion superior contenida**: se reduce el gap entre la cabecera avanzada y el cuerpo del wizard para evitar una banda vacia entre ambos bloques.
  - `src/app/features/empleados/components/form-empleado/form-empleado.css`

### 2026-04-30 (Creacion basica — flujo dedicado y pie de pagina)

- **Diferenciacion clara vs avanzada**: titulo "Creacion basica", badge de modo **Básica**, subtitulo corto, callout compacto "Alta rapida" con **Resultado: ficha en proceso**, panel lateral informativo de pendientes (no mapa de 9 pasos), y **footer** al pie con copy + boton **Guardar ficha basica** (el guardado en header se unifica al pie como en el wizard avanzado).
- **Limpieza**: eliminado bloque muerto `isBasicMode()` dentro del contenido del wizard avanzado; modal de exito basico sin mensaje de "listo para liquidar" prematuro.
  - `src/app/features/empleados/components/form-empleado/form-empleado.{html,css,ts}`
- **Pruebas E2E**: `tests/empleados-basic-create.spec.ts` (aserciones + captura opcional `.basic-create-page`).

### 2026-04-30 (Creacion basica — solo formulario y CTA en cabecera)

- **Sin panel "Estado de la ficha"**: layout de una columna (callout + formulario). **Guardar ficha basica** de nuevo en **cabecera** junto a Volver (`headerVisibleActions` solo en modo basico).
- **Cabecera en grilla**: titulo/subtitilo alineados a la izquierda, botonera a la derecha; subtitulo sin mayusculas forzadas (anula herencia de `.summary-person p`). Sin `footer.editor-footer--basic`.
  - `src/app/features/empleados/components/form-empleado/form-empleado.{html,css,ts}`
  - `tests/empleados-basic-create.spec.ts`

### 2026-05-01 (Creacion basica — distribucion y resumen en fila)

- **Eje comun**: `basic-create-shell` + `basic-create-inner` (`max-width: min(68rem, 100%)`) alinean **cabecera**, **resumen** y **formulario**; la pagina ya no fuerza 80rem con contenido mas angosto.
- **Resumen en desktop**: `.basic-create-summary` en **dos columnas** (Alta rapida + Pendiente); en mobile una columna.
- **Pendiente compacto**: chips neutros (`.basic-create-pending-chip`), sin lista larga ni aspecto de error/wizard.
- **Contacto (modo basico)**: grilla de **dos columnas** `minmax(0,1.15fr) minmax(10.5rem,1fr)` y sin `span 2` en email para que **Telefono** no quede en un tercio del ancho.
  - `src/app/features/empleados/components/form-empleado/form-empleado.{html,css}`
  - `src/app/features/empleados/components/secciones/datos-personales/datos-personales.css`

### 2026-04-30 (Wizard avanzado — navegacion en cabecera del paso)

- **Anterior / Siguiente / Finalizar alta** en la zona superior derecha del **contenido del paso** (`.advanced-step-header`), alineados con kicker + descripcion; **Volver** sigue solo en el header global de "Creacion avanzada".
- **Sin duplicar**: eliminado `footer.advanced-wizard-footer` con los mismos botones; se conserva una **pista compacta** (`.advanced-step-hint`) bajo la fila principal.
- **Estabilidad visual**: ancho minimo del boton primario (`.advanced-step-nav-btn--primary`); grid responsive (max 720px) apila acciones bajo el titulo.
- **Scroll al paso**: `scrollToCurrentStepStart` usa `.advanced-step-header` y doble `requestAnimationFrame`; `selectWizardStep` tambien dispara scroll.
  - `src/app/features/empleados/components/form-empleado/form-empleado.{html,css,ts}`
  - `tests/empleados-wizard-stability.spec.ts` (offset de `.advanced-step-actions` respecto a `.advanced-wizard-content` + ancho del contenido)

### 2026-05-01 (Creacion basica — ajuste fino visual)

- **Callout**: titulo + texto breve; **resultado** como chip (`.basic-create-result-chip`); borde uniforme sin acento lateral grueso.
- **Textos secundarios**: leads mas cortos en identificacion, nombre y contacto (modo basico).
- **Evolucion**: el ancho `.basic-create-narrow` paso a **`basic-create-inner`** + resumen en fila (ver entrada **distribucion y resumen en fila** arriba).
  - `src/app/features/empleados/components/secciones/datos-personales/datos-personales.html`
  - `tests/empleados-basic-create.spec.ts`

### 2026-04-30 (Creacion basica — card unica de resumen superior)

- **Unificacion**: se eliminan las dos cards separadas (Alta rapida + Pendiente por completar) y se integra todo en **una** `.basic-create-summary-card` al mismo ancho que `.basic-create-inner`.
- **Estructura**: fila cabecera (titulo **Alta rapida de empleado** + chip estado **Ficha en proceso**), texto **Solo se guardan los datos minimos para abrir la ficha.**, fila **Pendiente desde la ficha:** con chips compactos (Contrato y organizacion, Jornada y remuneracion, Prevision y salud, Banco); sin texto tecnico **Resultado**, sin lista larga ni aspecto wizard.
- **Padding**: `14px 16px` en la card informativa; chip estado con estilo informativo (no error).
- **Archivos**: `src/app/features/empleados/components/form-empleado/form-empleado.{html,css}`, `tests/empleados-basic-create.spec.ts`.

### 2026-05-01 (Creacion avanzada — Guardar borrador en cabecera)

- **Acciones**: boton secundario **Guardar borrador** antes de **Volver** en cabecera avanzada; fila `.summary-actions--advanced` con `gap` 8px; mensaje breve `.advanced-draft-feedback` tras guardado (no toast global).
- **Archivos**: `src/app/features/empleados/components/form-empleado/form-empleado.{html,css}`.

### 2026-05-01 (Parametros del sistema — normalizacion visual de estado, unidades y grillas)

- **Estado del periodo**: banda compacta con chips **Sin datos / Cargado / Editando / Solo lectura** y “Acción sugerida” (Crear / Modificar / Guardar / Consultar) coherente con el periodo seleccionado.
  - `src/app/pages/parametros.page.ts`
- **Contradiccion resuelta**: pestañas editables ya no muestran “Editable” si el periodo no tiene datos; en su lugar muestran “Sin datos del periodo” con guia breve.
  - `src/app/pages/parametros.page.ts`
  - `src/app/features/parametros-generales/components/tabs/parametros-{valores,remuneraciones}-tab.component.ts`
- **Unidades**: UF/UTM/UTA ahora indican **CLP** (evita el `$` ambiguo).
  - `src/app/features/parametros-generales/components/tabs/parametros-valores-tab.component.ts`
- **Grillas (solo lectura)**: empty states con copy mas contextual (sin inflar layout) y filtros de periodo/vigencia con placeholder coherente.
  - `src/app/features/parametros-generales/components/tabs/parametros-{tramos-carga,tramos-renta,salud,afp,reforma}-tab.component.ts`
- **CCAF y mutual**: configuracion con ancho contenido (`max-width`) para evitar panel vacio cuando hay pocos campos.
  - `src/app/features/parametros-generales/components/tabs/parametros-ccaf-mutuales-tab.component.ts`

### 2026-04-30 (Creacion basica — compactacion card resumen y panel)

- **Card resumen**: padding `12px 16px`; menos espacio entre titulo, lead, separador y pendientes (`margin`/`padding` en 6–8px); cabecera con **align-items: baseline** y chip un poco mas bajo en altura (`padding` vertical 2px) para alinear con el titulo sin sensacion flotante.
- **Stack**: `gap` entre resumen y formulario de 12px a **8px** (token).
- **Panel blanco**: `.basic-create-form .step-panel.step-panel--basic.basic-wizard` con **padding 12px** (override del 16px global del paso) solo en modo basico.
- **Archivo**: `src/app/features/empleados/components/form-empleado/form-empleado.css`.

<!-- UX-COMERCIAL-01-ESTILOS -->

## 2026-05-10 - UX-COMERCIAL-01 base de redisenio comercial

- Se prepara la fase UX para redisenar la experiencia visible luego del hito funcional validado hasta liquidaciones oficiales internas.
- Pantallas objetivo: sidebar/menu Remuneraciones, Preparar nomina y Liquidaciones oficiales.
- Patron visual documentado: header operativo, resumen ejecutivo, siguiente accion, bloqueos/advertencias, contenido principal y trazabilidad secundaria.
- Restricciones: no tocar SQL/RPC/RLS, formulas, motor, Previred, LRE, banco, contabilidad, PDF, firma ni envio.
- Deuda prioritaria: reemplazar `window.confirm` temporal por modal/MsgBox estandar.

## 2026-05-10 - UX-COMERCIAL-01 implementacion visible

- **Sidebar Remuneraciones**: menu agrupado por dominio, con Preparar nomina y Liquidaciones oficiales como recorrido principal y microcopy operativo.
- **Preparar nomina**: header operativo con breadcrumb y copy menos tecnico para salidas futuras.
- **Liquidaciones oficiales**: resumen ejecutivo, siguiente accion, bloqueos/advertencias/informacion, contenido principal y trazabilidad secundaria colapsable.
- **Confirmacion**: generacion de liquidaciones oficiales usa `app-message-box` modal en vez de `window.confirm`.
- **Alcance respetado**: sin cambios SQL/RPC/RLS, formulas legales ni motor de calculo.

## 2026-05-10 - UX-COMERCIAL-01 V4 usabilidad T00-T09

- **Dashboard**: sin KPIs demo ni salidas externas activas; muestra flujo operativo real, siguiente accion y capacidades futuras separadas.
- **Reportes**: se convierte en consulta operativa con enlaces a vistas disponibles; reportes formales quedan marcados como fase posterior.
- **Preparar nomina**: se agrega avance del cierre mensual de 6 pasos, manteniendo resumen ejecutivo y siguiente accion.
- **Detalle liquidacion**: empty state con motivo, CTA a Liquidaciones oficiales y CTA a Preparar nomina.
- **Movimientos/asignaciones**: empty states orientados a impacto en nomina y motivo visible cuando una accion depende de seleccionar trabajador.
- **Restriccion**: no se implementan ni activan Previred, LRE, banco, contabilidad, PDF, firma ni envio.

## 2026-05-10 - UX-QA-01-FIX V5 - Tabs, collapsables y densidad

- **Dashboard**: se agrega status strip compacto, quick links bajos para navegacion y salidas futuras en disclosure/lista compacta.
- **Preparar nomina**: timeline de 6 pasos pasa a formato compacto, con metricas de resumen mas densas.
- **Liquidaciones oficiales**: estado no disponible compacto, ocultamiento de resumen sin datos y empty state reducido para trabajadores.
- **Reportes**: tabbar real `Disponibles / No disponible en esta fase`, con lista futura compacta y sin acciones externas activas.
- **Detalle liquidacion**: empty state reducido, manteniendo CTA primario y nota tecnica secundaria.
- **Asignaciones recurrentes**: ayuda contextual pasa a collapsable y empty state agrega accion secundaria compacta.
- **Restricciones**: sin SQL/RPC/RLS/BD, sin formulas/motor, sin PDF/firma/envio, sin Previred/LRE/banco/contabilidad.

## 2026-05-10 - UX-PREP-NOM-MAQUETACION-REAL-02

- **Preparar nomina**: la accion siguiente queda como primer bloque operativo, con un unico CTA principal derivado de `validacionCalculo().siguienteAccion`.
- **Workspace**: se agrega layout superior de dos columnas con avance del cierre a la izquierda y pendientes/alertas/accesos rapidos a la derecha.
- **Densidad**: el resumen se reduce a indicadores operativos y el alcance explicativo pasa a disclosure secundario.
- **Detalle operativo**: Base, calculo preliminar, guardado, aprobacion y cierre interno quedan agrupados debajo de la decision principal.
- **Restricciones**: sin SQL/RPC/RLS/BD, sin formulas/motor, sin Previred/LRE/banco/contabilidad/PDF/firma/envio.

## 2026-05-10 - UX-PREP-NOM-ORDEN-GUIADO-04

- **Preparar nomina**: se ordena como flujo guiado del periodo: accion recomendada, avance compacto, resumen minimo y panel derecho de pendientes.
- **Panel derecho**: antes de validar ya no muestra falsos "sin bloqueos"; presenta pendiente de validacion y alcance de revision.
- **Detalle operativo**: las etapas quedan en disclosures por estado (base, calculo/resultado, guardado, aprobacion, cierre/liquidaciones) para evitar mostrar todo abierto.
- **Restricciones**: solo maquetacion UI; sin SQL/RPC/RLS/BD, sin formulas/motor, sin activar Previred/LRE/banco/contabilidad/PDF/firma/envio.

## 2026-05-10 - UX-PREP-NOM-USABILIDAD-DISTRIBUCION

- **Preparar nomina**: se elimina markup duplicado oculto y se reduce competencia entre el boton de header y la accion principal.
- **Detalle operativo**: se agrega indice lateral de etapas con estado y descripcion breve, dejando el contenido largo en una columna principal.
- **Responsive**: el indice de etapas pasa a grilla compacta en tablet y a una columna en mobile.
- **Restricciones**: solo distribucion/maquetacion; sin cambios de motor, persistencia, formulas, SQL, RPC ni salidas externas.

## 2026-05-10 - NOM-UX-STATE-01

- **Preparar nomina**: se centraliza el guiado operativo por estado en una regla pura de UI dentro de `features/nomina-mensual/rules`.
- **Accion principal**: el CTA superior ahora deriva de la matriz de estado del periodo, evitando invitar a guardar si hay bloqueos.
- **Panel derecho y avance**: `Que falta ahora`, timeline e indice lateral consumen el mismo modelo de estado operativo.
- **Restricciones**: sin motor, formulas, SQL/RPC/RLS, BD, liquidaciones oficiales nuevas, cierre operativo nuevo ni salidas externas.

## 2026-05-11 - EMP-ADV-VALIDATION-CL-02 MsgBox para validaciones chilenas

- **Creacion avanzada**: se elimina el enfoque de tarjeta fija de validacion por paso; la pantalla queda limpia y el mapa de ficha sigue siendo el resumen permanente.
- **Siguiente**: si hay pendientes del paso, se usa `app-message-box` modal con resumen de bloqueos/advertencias y acciones `Corregir ahora` / `Continuar`.
- **Guardar borrador**: validacion minima y confirmacion de exito pasan por MsgBox, evitando texto suelto en la pantalla.
- **Finalizar alta**: los bloqueos legales/operativos se presentan en MsgBox; el usuario decide ir al primer pendiente.
- **Diseño**: `Guardar borrador` conserva azul suave como accion secundaria importante; primarios solidos se reservan para avanzar/finalizar.
- **Restricciones**: sin cambios SQL, motor, mappers, payloads ni flujos externos.

## 2026-05-11 - EMP-ADV-MSGCOPY-01 Copy administrativo de MsgBox

- **Creación avanzada**: se ajusta el lenguaje de los MsgBox para que suene administrativo y orientado a RRHH.
- **Acciones**: `Continuar de todos modos` pasa a `Continuar`; `Ir al primer bloqueo` pasa a `Ir al primer pendiente`.
- **Listados**: los detalles del modal usan guion visual, frases completas y punto final.
- **Secciones**: `Bloqueos` cambia a `Datos obligatorios pendientes`, `Advertencias` a `Advertencias de revisión` e `Información` a `Información útil`.
- **Copy visible**: no usar punto y coma en mensajes visibles del usuario. Separar ideas en frases cortas.
- **Restricciones**: sin cambios de lógica de guardado, payloads, SQL, motor, ficha empleado ni creación básica.

## 2026-05-12 - EMP-PERFIL-LABORAL-UI-01

- **Creacion avanzada**: el paso 4 incorpora bloque `Perfil laboral y previsional` con card de perfil detectado, nota de regla de captura, grilla de condiciones especiales y panel de vigencia/respaldo.
- **Tipografia/espaciado**: estilos locales del nuevo componente usan `--erp-font-sans`, radios, bordes y densidad coherentes con la maqueta existente.
- **Resumen final**: agrega filas compactas de perfil laboral y condiciones especiales sin duplicar informacion tecnica.
- **Restricciones**: sin estilos globales, sin fuentes nuevas, sin cambios visuales fuera de Creacion avanzada.



## 2026-05-12 - EMP-PERFIL-LABORAL-UI-01-POLISH

- **Creacion avanzada**: `Perfil laboral y condiciones` pasa a etapa propia despues de Banco y antes de Resumen final, evitando que la informacion quede flotando dentro de asignaciones.
- **Asignaciones laborales**: el paso vuelve a enfocarse solo en cargas familiares, zona extrema y semana corrida.
- **Componente perfil laboral**: bloques locales alineados a Contrato/Bancario: cabecera gris clara, borde 8px, densidad compacta, sin sombras ni radios grandes.
- **Vigencia/respaldo**: panel bajo demanda; aparece solo al seleccionar condiciones especiales.
- **Restricciones**: sin estilos globales, sin fuentes nuevas, sin SQL, sin persistencia nueva y sin cambios a Honorarios.

## 2026-05-12 - EMP-CONDICIONES-ESPECIALES-UX-01

- **Creacion avanzada**: el paso se comunica como `Condiciones especiales`, no como formulario tecnico de perfil laboral.
- **Revision administrativa**: primera tarjeta con situacion detectada, tipo de relacion, edad al ingreso y referencia.
- **Uso RRHH**: grilla de condiciones con chip `Solo si aplica`; trabajador estandar puede continuar sin marcar nada.
- **Estado sin seleccion**: empty state contextual (`Trabajador estandar`, `Revision pendiente` o revision sugerida) para que la informacion no quede flotando.
- **Resumen final**: fila `Revision administrativa` y `Condiciones especiales` como lectura compacta.
- **Restricciones**: solo copy/maquetacion local; sin estilos globales, SQL/RPC/RLS, persistencia nueva, motor, nomina ni cambios a Honorarios.

## 2026-05-12 - EMP-CONDICIONES-ESPECIALES-AUTODETECT-01

- **Creacion avanzada / Condiciones especiales**: se agrega bloque compacto `pre-marcado desde pasos anteriores` cuando hay condiciones detectadas por edad o regimen previsional.
- **Cards de condicion**: se agrega chip local `Detectada` y razon breve para distinguir sugerencia automatica de declaracion manual, sin cambiar estilos globales.
- **Patron UX**: autodeteccion asistida con revision RRHH; el sistema pre-marca lo evidente, pero mantiene respaldo y correccion manual antes de finalizar.

## 2026-05-13 - EMP-ALTA-REGLAS-COHERENCIA-01

- **Creacion avanzada**: se agrega aviso inline compacto `Revision asistida` cuando el paso actual tiene una incoherencia laboral/previsional corregible.
- **Resumen final**: se agrega bloque `Coherencia administrativa` con tres tarjetas compactas: Seguro de Cesantia, Jornada y Prevision.
- **MessageBox**: las decisiones de coherencia usan `app-message-box` modal con accion recomendada y opcion de mantener bajo revision, sin bloquear el flujo por defecto.
- **Estilo**: solo CSS local de `form-empleado.css`, usando borde simple, radio 8px y colores warning existentes. Sin estilos globales ni fuentes nuevas.


## 2026-05-13 - EMP-TIPO-TRABAJADOR-FLOW-01

- **Creacion avanzada / Contrato**: `Tipo trabajador` se muestra como dato derivado con chip `Derivado`, no como seleccion manual.
- **Flujo**: `Contrato` sincroniza `DEPENDIENTE`; `Boleta de honorarios` sincroniza `INDEPENDIENTE`.
- **Condiciones especiales**: pensionado, invalidez, tecnico extranjero y discapacidad quedan como declaracion RRHH en el paso `Condiciones especiales`.
- **Restricciones**: solo logica/UI local de alta avanzada; sin estilos globales, SQL/RPC/RLS, motor, nomina ni ficha empleado.

## 2026-05-14 - EMP-ALTA-COHERENCIA-GLOBAL-01

- **Creación avanzada**: se agrega bloque compacto `Matriz de aplicabilidad` en Resumen final.
- **Diseño**: usa card local neutra, borde 8px, chip compacto y grilla responsive; no introduce paleta nueva ni estilos globales.
- **Separación conceptual**: `Matriz de aplicabilidad` explica qué aplica/no aplica/deriva/requiere revisión; `Coherencia administrativa` conserva las advertencias y decisiones RRHH.
- **Restricciones**: sin cambios SQL/RPC/RLS, sin motor, sin nómina, sin ficha empleado, sin creación básica y sin persistencia final de honorarios.


## 2026-05-14 - EMP-ALTA-DIAGNOSTICO-CONTRACTUAL-UX-01

- **Creación avanzada / Resumen final**: `Matriz de aplicabilidad` pasa a `Diagnóstico contractual`, con `Caso detectado` y copy administrativo para RRHH.
- **Estilo**: se elimina `border-left` decorativo fuerte en diagnóstico/coherencia; se mantienen fondos suaves de información/advertencia y bordes completos locales.
- **Condiciones especiales**: la razón de condición detectada deja de usar barra lateral azul y pasa a bloque compacto con fondo informativo suave.
- **Restricciones**: sin estilos globales, sin fuentes nuevas, sin SQL/RPC/RLS, sin motor, sin nómina ni ficha empleado.


## 2026-05-14 - EMP-ALTA-MSGBOX-ERROR-UX-01

- **MessageBox de error**: el modal de error de guardado usa el mismo patrón del éxito (`modalHeadlineSplit`, panel de detalle y bloque de referencia).
- **Copy administrativo**: los errores conocidos se presentan como `Qué revisar`, `Acción recomendada` y `Paso sugerido`, evitando textos técnicos planos.
- **Sin previsión**: el mensaje orienta a revisar `Previsión y salud` y seleccionar AFP o IPS cuando el trabajador quedará habilitado para remuneraciones.
- **Estilo**: paneles con borde completo, fondo suave y radio local; sin `border-left` decorativo fuerte ni estilos globales.

## 2026-05-15 - ERP-AUDIT-REPAIR-UX-01

- **Modulo:** Nomina mensual / Preparar nomina.
- **Cambio:** las confirmaciones criticas de guardar resultado preliminar, aprobar resultado y cerrar nomina dejan de usar `window.confirm` y pasan a `app-message-box` modal.
- **UX:** el modal muestra motivo, alcance, puntos de revision RRHH y acciones claras; cancelar no persiste cambios.
- **Estilo:** CSS local compacto con borde completo neutro, fondo suave y radio 6px; sin barras laterales decorativas, sin estilos globales.
- **Restricciones:** sin SQL/RPC/RLS, sin motor, sin cambios en liquidaciones oficiales ni configuracion Angular/Tailwind/PostCSS.

## EMP-ADV-BITACORA-LABORAL-UX-01 - Identidad visual local de Bitácora Laboral

Fecha: 2026-05-15

Creación avanzada incorpora una identidad de producto local para dejar de sentirse como wizard genérico:

- El flujo se comunica como `Bitácora laboral`, no como lista técnica de pasos.
- Mapa lateral agrupado por sentido: Identidad, Relación laboral, Pago y previsión, Revisión.
- Numeración de registros `01` a `10` para reforzar expediente laboral.
- Estados visibles más humanos: `En edición`, `Listo`, `Requiere datos`, `Revisar`, `Solo si aplica`, `No requerido`.
- Header de paso con tipo de registro y título separado.
- APVI no requerido/opcional se muestra como decisión del sistema con siguiente acción.
- Cierre como `Acta de revisión de la ficha` y `Registros de la bitácora`.
- Se mantiene system-ui/`--erp-font-sans`; sin Google Fonts, sin estilos globales, sin `border-left` fuerte y sin sombras decorativas.
## 2026-05-15 - ERP-NOIA-BITACORA-OPERATIVA-00

- **Identidad global:** el ERP adopta la lectura `NOIA / Bitacora Operativa`: sobrio, administrativo, humano, trazable y orientado al cierre del periodo.
- **Regla visual:** evitar estetica SaaS generica, hero cards, gradientes decorativos, sombras fuertes, paletas monotono azul/morado y textos comerciales en pantallas operativas.
- **Gramatica:** cada pantalla debe mostrar contexto, estado, registros, decisiones, alertas con accion y cierre operativo.
- **Modulos:** Empleados = registro laboral; Nomina = bitacora del periodo; Movimientos = registros remuneracionales; Parametros = registro normativo; Liquidaciones = acta de salida.
- **Restricciones:** fase documental; sin Angular, HTML, CSS, SQL/RPC/RLS, rutas, servicios, motor, estilos globales ni cambios funcionales.

## 2026-05-15 - ERP-SHELL-BITACORA-OPERATIVA-01

- **Shell global:** sidebar, header y contenedor principal adoptan lectura `Bitacora operativa`, con fondo administrativo plano y navegacion agrupada por sentido.
- **Componentes base:** cards, botones, badges, titulos, breadcrumbs, DataGrid, SearchSelect y MessageBox se alinean a NOIA con bordes completos, densidad compacta y color funcional.
- **Tablas y empty states:** DataGrid usa filtros sobrios, seleccion sin barra lateral fuerte y estados vacios con causa visible y accion siguiente.
- **Restricciones:** sin SQL/RPC/RLS, sin motor, sin servicios de negocio, sin mappers, sin fuentes nuevas y sin unificar movimientos.
## 2026-05-15 - EMP-ADV-CSS-BUDGET-REDUCE-01

- **Creacion avanzada / CSS local:** `app-form-empleado` queda dividido en hojas locales por responsabilidad: base, wizard/resumen y feedback/diagnosticos.
- **Presupuesto Angular:** el error productivo de `form-empleado.css` baja desde 36.37 kB sobre presupuesto de 24.00 kB a build sin error `anyComponentStyle`.
- **Estilo:** se conservan Bitacora Laboral y NOIA; no se cambian paleta, presupuestos, estilos globales ni comportamiento.
- **Restricciones:** sin `angular.json`, sin `src/styles*`, sin Tailwind/PostCSS, sin SQL/RPC/RLS, sin motor, sin nomina, sin liquidaciones y sin servicios/mappers/rutas/reglas/payloads.

## 2026-05-15 - ERP-CONTEXT-OPTIMIZATION-01

- **Contexto de trabajo:** se agrega `docs/codex/contexto-rapido.md` para iniciar fases con menos tokens y sin perder restricciones críticas.
- **Reglas Cursor:** se agregan reglas permanentes para NOIA/Bitácora Operativa y archivos protegidos.
- **Empaquetado:** se agrega `scripts/build-context-pack.ps1` para generar ZIPs pequeños de contexto por fase o módulo.
- **Estilo:** sin cambio visual aplicado; la fase solo refuerza reglas para mantener NOIA en trabajos futuros.
- **Restricciones:** sin Angular funcional, sin HTML/CSS visual, sin estilos globales, sin SQL/RPC/RLS, sin motor, sin nómina, sin liquidaciones y sin servicios/mappers/persistencia.

## 2026-05-15 - ERP-TABS-NOIA-UX-01 ajuste integracion

- **Parametros:** tabs y subtabs conservan scroll horizontal funcional, pero sin scrollbar visible; el borde queda unido al contenido.
- **Tablas:** DataGrid de catalogos queda acoplado al panel, sin tarjeta interna duplicada, con filtros/footer compactos y sin scrollbars decorativas visibles.
- **Densidad:** se reduce el aire entre tabbar, subtabs y tabla para que la navegacion secundaria no se separe del trabajo.
- **Correccion de cabecera:** los headers grises de tabbar vuelven a cubrir 100% del contenedor; solo las pestanas miden por contenido.
- **Union subtab/contenido:** `param-subhead` y `param-tab-subview` quedan sin separacion; el borde superior del catalogo se solapa 1px con la cabecera de subtabs.
- **Restricciones:** solo CSS local/componente; sin estilos globales, sin budgets, sin SQL/RPC/RLS ni cambios funcionales.

## 2026-05-15 - PARAM-NOIA-CIERRE-UX-01

- **Parametros:** se agrega bloque `Cierre normativo del periodo` con estado operativo, secciones listas, revisiones e impacto en nomina.
- **Tabs:** cada pestana muestra estado humano compacto (`Listo`, `Parcial`, `Requiere datos`, `Revisar`).
- **Guardia:** la proteccion contra sobrescritura mensual queda en wrapper terminal; Angular no puede interceptar cargas ejecutadas por Python/psql.
- **Restricciones:** sin estilos globales, sin budgets, sin SQL estructural, sin motor ni nomina/liquidaciones productivas.

## 2026-05-15 - PARAM-CLIENT-CONFIG-SEPARATION-AUDIT-01

- **Parametros:** se documenta la separacion visible entre datos oficiales del periodo, configuracion cliente y reconciliacion.
- **Wrapper:** el mensaje de consola deja de mezclar `parametros_generales_cliente` con datos oficiales que la carga mensual puede reemplazar.
- **Criterio UX:** la configuracion cliente se comunica como protegida; cualquier diferencia con oficiales debe resolverse con accion explicita en Parametros.
- **Restricciones:** sin redisenio de pantalla, sin estilos globales, sin SQL estructural, sin motor, sin nomina/liquidaciones y sin budgets.
## 2026-05-15 - PARAM-RECONCILIACION-MSGBOX-FIX-01

- **Parametros:** el MsgBox de diferencias oficial/cliente aclara que nada se actualiza automaticamente.
- **Decision postergada:** `Revisar despues` deja de comportarse como pendiente invasivo y queda como decision registrada.
- **Criterio UX:** la revision queda disponible sin interrumpir repetidamente al usuario.
- **Restricciones:** sin estilos globales, sin Python, sin wrapper, sin SQL estructural, sin motor y sin nomina/liquidaciones.
## 2026-05-15 - NOM-MOVIMIENTOS-SIMPLE-01

- **Remuneraciones:** el menu visible pasa a `Movimientos` y deja de presentar `Movimientos del mes` + `Asignaciones recurrentes` como dos accesos principales.
- **Movimientos:** la pantalla mensual se titula `Movimientos de remuneracion` y muestra vistas `Este mes`, `Recurrentes` y `Todos`.
- **Recurrentes:** la pantalla de haberes/descuentos se comunica como vista recurrente dentro de la misma experiencia.
- **Cuotas:** `En cuotas` queda explicado como duracion para prestamos, anticipos o descuentos pactados, sin calculo nuevo.
- **Restricciones:** sin estilos globales, sin SQL/RPC/RLS, sin motor, sin servicios productivos, sin mappers ni payloads.

## 2026-05-15 - NOM-MOVIMIENTOS-SIMPLE-01-FORM-POLISH

- **Modal:** `Registrar movimiento` deja de ser una grilla plana y se ordena en Movimiento, Duracion, Detalle administrativo y Resumen.
- **Duracion visible:** se incorporan radio cards para `Solo este mes`, `Recurrente` y `En cuotas`.
- **Cuotas:** `En cuotas` se explica para prestamos, anticipos, reintegros o descuentos pactados y muestra campos UI especificos.
- **Detalle:** `Cantidad` queda como dato administrativo de unidad, separado de `Cantidad de cuotas`.
- **Resumen:** se agrega lectura RRHH antes de guardar, sin afirmar cambios de calculo.
- **Restricciones:** sin estilos globales, sin SQL/RPC/RLS, sin motor, sin servicios productivos, sin mappers, sin rutas ni payloads.

## 2026-05-15 - NOM-MOVIMIENTOS-POR-TRABAJADOR-01

- **Mesa de trabajo:** Movimientos parte desde trabajadores del periodo, no desde un formulario global.
- **Contadores:** movimientos del mes, recurrentes y revisar son visibles por trabajador; solo valores mayores a cero son accionables.
- **Gestion:** `Gestionar`/`Asignar` abre contexto del trabajador antes de actuar.
- **Flujos:** movimiento mensual y recurrente quedan separados; cuotas pertenece al recurrente.
- **Correccion:** el modal mensual ya no incluye duracion, recurrente ni cuotas.
- **Restricciones:** sin estilos globales, SQL/RPC/RLS, motor, liquidaciones, persistencia critica, rutas nuevas ni payloads productivos.

## 2026-05-16 - NOM-MOVIMIENTOS-POR-TRABAJADOR-02

- **Sin tabbar principal:** `Movimientos de remuneracion` entra directo a la vista mensual del periodo activo; no mostrar `Este mes | Recurrentes | Todos` ni una pestana unica.
- **Pagina principal:** lo que antes era `Este mes` queda como contenido base: franja operativa, guia, filtros y grilla de trabajadores.
- **Detalle:** los contadores abren informacion util por trabajador: monto, estado, origen, fecha, referencia, observacion y acciones permitidas.
- **Recurrentes:** se revisan desde el detalle del trabajador y la gestion nueva navega al flujo real de haberes/descuentos con `persona` en query params.
- **Criterio NOIA:** evitar apariencia generica; ordenar por decision operativa y no por acumulacion de tabs, cards o explicaciones largas.

## 2026-05-16 - NOM-MOVIMIENTOS-MODAL-MENSUAL-UX-01

- **Modal mensual:** `Registrar movimiento del mes` queda compacto y enfocado en trabajador, concepto, tipo, monto, fecha de referencia y detalle administrativo opcional.
- **Resumen:** se elimina la columna lateral `Antes de guardar`; el resumen queda como bloque inferior antes del footer.
- **Alcance:** el modal solo registra movimientos puntuales del periodo activo. No muestra duracion, recurrentes ni cuotas.
- **Cuotas:** permanecen dentro del flujo recurrente; no deben aparecer como accion o configuracion del modal mensual.
- **Copy:** se corrigen acentos visibles principales y el sidebar deja de presentar cuotas como flujo principal.

## 2026-05-18 - NOM-MENSUAL-CONFIRMACION-FLOW-00

- **Nómina mensual:** se fija como criterio rector que la nómina mensual confirmada es la fuente oficial para generar liquidaciones.
- **UX futura:** nuevas fases deben priorizar `Generar nómina`, `Revisar trabajadores`, `Confirmar nómina` y `Generar liquidaciones` antes que diagnósticos técnicos del proceso.
- **Copy:** para RRHH, preferir `nómina mensual confirmada` y estados por trabajador (`Listo`, `Revisar`, `Bloqueado`, `Cambio detectado`, `Omitido`) sobre términos como snapshot, payload, RPC o flags internos.
- **Restricciones:** fase documental; sin cambio visual aplicado, sin Angular, sin estilos globales, sin SQL/RPC/RLS, sin motor, sin servicios ni persistencia.
## 2026-05-19 - NOM-MODALES-PERIODO-REVISION-IA-02

- **Modulo:** Nomina mensual / modal revision (`app-proceso-mensual-detalle-modal`).
- **Cambio visual:** expediente oficial y CTA quedan solo en Resumen; parametros, movimientos, recurrentes y resultado usan listas densas o empty editorial cuando no corresponde grilla.
- **DataGrid:** solo se muestra con filas tabulares; filtros desactivados en conjuntos pequenos y sin grid para observaciones del resumen.
- **Restricciones:** CSS local del modal; sin estilos globales, store, servicios, SQL ni cambios al DataGrid compartido.
## 2026-05-19 - NOM-MODALES-PERIODO-REVISION-COPY-03

- **Modulo:** Nomina mensual / modal revision (`app-proceso-mensual-detalle-modal`).
- **Cambio visual:** copy RRHH sin claves tecnicas visibles; parametros agrupa accion repetida; listas de revision quedan mas densas.
- **Estados:** Resumen refleja bloqueos globales como `Requiere revision` y advertencias como `Con observaciones`.
- **Restricciones:** CSS local del modal; sin estilos globales, store, servicios, SQL, motor ni cambios a `app-data-grid`.

## 2026-05-19 - NOM-MENSUAL-MASIVO-LAYOUT-01

- **Modulo:** Nomina mensual / modal revision, tab `Trabajadores`.
- **Cambio visual:** resumen agregado, filtros compactos, busqueda, grilla paginada y detalle bajo demanda de un solo trabajador.
- **Densidad:** se abandona la vista tipo lista chica para trabajadores; no usar cards por trabajador ni detalles abiertos masivos.
- **Restricciones:** CSS local del modal; sin redisenar workspace, sin estilos globales, SQL, motor, servicios, store ni cambios a `app-data-grid`.
