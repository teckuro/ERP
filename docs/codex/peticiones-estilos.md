## 2026-06-02 - Nómina mensual V2 · L1 — Marco unificado del shell

Lote 1 del plan iterativo (`auditoria-nomina-v2-2026-06.md`). Sin cambios funcionales; solo estructura visual del shell.

- **Hallazgos resueltos**: H-S1, H-S2, H-S3, H-S5 (P0/P1 del shell) + aplanado de `.nomina-card` (que se compartía con cards de los pasos 1–3).
- **Cambios en `nomina-mensual-v2-container.css`**:
  - `.nmv2-page`: fuera el `linear-gradient(180deg, #f8fafc, #f5f7fb)` → fondo plano `#f6f8fb`. `gap: 12px` → `0` (las piezas se leen contiguas). `padding: 16px 18px 18px` → `12px 14px 14px` (alineado al patrón de Parámetros).
  - `.nmv2-stepper-card, .surface-card, .toolbar-card, .alert-banner, .validation-summary-card, .footer-bar, .tabs-bar`: `border-radius: 18px` → `6px`; `box-shadow: 0 16px 40px ...` → `none`.
  - `.nmv2-stepper-card`: borde completo arriba/laterales con `border-radius: 6px 6px 0 0` y `border-bottom: 0`; el frame continúa la divisoria desde abajo.
  - `.nomina-workflow-header`: fuera `border-bottom: 1px solid #e2e8f0`; la divisoria la pinta ahora `.nmv2-step-frame` (un solo trazo).
  - `.nmv2-step-frame`: `border-radius: 8px → 0 0 6px 6px`; `border-top: 1px solid #e2e8f0` explícito; sin `border-top-*-radius: 0` redundantes.
  - `.nmv2-step-nav-hint`: deja de ser margin flotante; pasa a banda fina pegada al stepper con bordes laterales y bottom y variantes `--bloqueo` (#fef2f2/#fecaca) / `--revision` (#fffbeb/#fde68a) tonalmente sobrios.
  - Overrides al final del archivo (`.nmv2-page > .nmv2-step-nav-hint`, `.nmv2-page > .nmv2-step-body`, `.nmv2-page[data-step='parameters']` gap) recalibrados para que stepper + hint + frame queden contiguos sin doble borde.
- **Cambios en `nomina-mensual-v2-visual-system.css`**:
  - `.nomina-card`: `border-radius: 14px` → `6px`. Sólo `transition: border-color`. Hover de `nomina-card--interactive` mantiene cambio de borde pero deja de aplicar `box-shadow: 0 4px 14px ...` y `transform: translateY(-1px)`.
- **Cambios en `nomina-mensual-v2-stepper.component.css`**:
  - `.nmv2-page .nomina-workflow-header.nmv2-stepper-card`: armoniza con el container (`border-radius: 8px 8px 0 0 → 6px 6px 0 0`, `border-bottom: 0`).
- **No tocado**: cards internas de los pasos (`parameter-summary-card`, `alcance-opcion-card`, `summary-metric`, etc.) — se rediseñan en L2/L3/L4. Tampoco `nomina-mensual-v2-container.html` ni la lógica de navegación.
- **Validación**: `npx ng build --configuration=development` verde (17.3 s). 2 warnings preexistentes de `line-clamp` (no introducidos por este lote). Lints sin nuevos errores.
- **Pendiente próximo lote**: L2 — Paso Parámetros NOIA (cards → lista densa, donut → conteos inline, modal local → `app-message-box`).

## 2026-06-02 - Nómina mensual V2 · L0 — Higiene + pasos 4–8 congelados hasta V11

Fase 0 del plan iterativo abierto en `docs/codex/modulos/nomina-mensual/auditoria-nomina-v2-2026-06.md`.

- **Decisión rectora**: V2 productiva acotada a Parámetros → Alcance → Empleados. Los pasos `movements`, `calculation`, `validation`, `approval`, `payslips` quedan inactivos en el stepper hasta que V11 conecte motor y persistencia. Motor productivo (`/remuneraciones/proceso-mensual`) no se toca.
- **Cambios**:
  - `facade/nomina-mensual-v2-navegacion.ts`: añade `PASOS_CONGELADOS_V11`, `esPasoCongelado(stepId)` y `tooltipPasoCongelado()` (`«Disponible al cerrar la versión 11. Continúa por Proceso mensual mientras tanto.»`).
  - `components/nomina-mensual-v2-stepper`: helpers `pasoCongelado(id)` y `tooltipPaso(id)`. El botón del paso aplica `[disabled]`, `[attr.aria-disabled]`, `[attr.title]` y `class="nomina-step--frozen"`. El icono de estado se sustituye por `lock` para los pasos congelados. CSS local añade tonos atenuados (cursor `not-allowed`, color `#94a3b8`).
  - `nomina-mensual-v2-container.ts`: bloquea navegación a pasos congelados en `intentarIrAPaso`, `manejarAvanceDesdeEmpleados` y `ejecutarAccionPrincipalPasoActual`. Saca el import de `NominaMensualV2PasosDemostracionComponent` del shell.
  - `nomina-mensual-v2-container.html`: el `@default` del `@switch` ya no renderiza la maqueta `pasos-demostracion`; en su lugar muestra un placeholder NOIA sobrio (`.nmv2-paso-congelado`) con eyebrow, título y vínculo a `/remuneraciones/proceso-mensual`. El componente `pasos-demostracion` se preserva en el árbol de archivos hasta la fase V11, pero ya no se carga en el bundle del shell.
  - `nomina-mensual-v2-container.css`: bloque local para `.nmv2-paso-congelado` (sin sombra, sin radio decorativo, ancho contenido).
  - Spec `facade/nomina-mensual-v2-navegacion.spec.ts`: añade `import { describe, expect, it } from 'vitest'` que faltaba (pre-existente, archivo aún untracked) y cubre los nuevos helpers.
- **No tocado**: motor productivo, servicios v1, `angular.json`, estilos globales, Parámetros recién cerrado.
- **Validación**: `npx ng build --configuration=development` verde (24 s, sin nuevos warnings). `npx vitest run` de `nomina-mensual-v2-navegacion.spec.ts`: 6/6 verdes. Lints sin nuevos errores en los archivos tocados.
- **Pendiente próximo lote**: L1 — marco unificado del shell (quitar gradiente y sombras de `.nmv2-page`/`.surface-card`, banda compacta del período integrada al header).

## 2026-06-02 - Parámetros · checkbox "Con gratificación" en lectura sin azul activo

- **Síntoma**: el checkbox `formControlName="gratificacion"` se veía en azul activo aún en modo lectura (no editable). Como no está DOM-`disabled` (el click se intercepta por JS para que el FormControl siga emitiendo valor), el `accent-color: #2563eb` y el check nativo se renderizaban con el azul del sistema.
- **Cambio**:
  - `parametros-config-cliente-tab.component.ts`: el label ahora añade la clase `param-checkbox-inline--locked` cuando `!editable`.
  - `parametros-workspace-container.css`: reglas espejo de `:disabled` para `.param-checkbox-inline--locked input[type='checkbox']` y `:checked` (mismo aspecto que readonly: borde y fondo `--prm-field-locked-*`, check oscuro SVG en lugar del nativo azul). También se cubren `.param-check--locked` y `.erp-choice-radio--locked` por consistencia.
- **No tocado**: ni `formControlName`, ni el handler `onReadonlyToggle`, ni reglas globales. Riesgo nulo sobre la persistencia del valor.

## 2026-06-02 - Parámetros: revisión transversal iterativa (flujos banda, edición, guardado, reconciliación)

Iteración por lotes pequeños sobre flujos que cruzan todas las tabs. Sin doc previo. Alcance acotado al módulo `parametros-generales` y al shared `app-page-actions` (extensión backward-compatible).

### Lote 1 — Banda + edición

- **Spinner inline en Modificar / Capturar valores**: nuevos inputs opcionales `editLoading` y `saveLoading` en `app-page-actions`. Cuando true, el icono `pencil` (o `save`) se sustituye por `loader-2` con animación `page-actions-spin` (0.9s linear infinite, definida en el shared). La banda pasa `[editLoading]="ws.modificarCargando()"` y `[saveLoading]="ws.guardando()"`. Computed `modificarCargando = isPreparingEdit() || isPreparandoDialogoCrear()` añadido al orquestador. Cambio backward-compatible (default false en ambos inputs).
- **Área Cierre — una sola acción principal**: `modificarDeshabilitado` ahora incluye `activeArea() === 'cierrePeriodo'`. Nueva rama en `modificarTooltipConsulta()` para esa condición: `Usa las acciones del resumen de cierre para completar la configuración.` Así el card de cierre queda como único punto de entrada a edición desde esa área.
- **Sincronizar con tooltip explicativo** (sin cambio de visibilidad): el botón sigue oculto cuando ya hay datos (`!ws.hasAnySyncedData()`), porque la normativa oficial chilena no cambia retroactivamente para un período sincronizado. Se añadió `ws.sincronizarTooltip()` que explica al usuario qué hace: `Carga los datos normativos oficiales para este período.` (o `Espera a que termine la operación actual.` si hay UI bloqueada). Decisión revisada con el usuario: descartado convertirlo en botón permanente; refrescar manualmente sin necesidad real introduce ruido.

### Lote 2 — Carga + errores

- **`cargaBloqueadaPorError` solo se resetea en éxito (H-C3)**: `cargar()` ya no hace `set(false)` al inicio. Una bandera local `cargaExitosa` se enciende solo si los `try` paths terminan sin excepción; el `finally` limpia el flag solo cuando `cargaExitosa === true`. Reintentos fallidos no reabren la edición ni el botón Modificar hasta una carga exitosa real.
- **Loading modal — revisado, dejado intencional**: `isLoading` y `isLoadingPlantilla` son mutuamente excluyentes (`@if/@else if` en el container) y ocurren por tiempos cortos durante la carga inicial o preparación de edición. Cambiarlos a inline implicaba mover infraestructura del MessageBox a un overlay propio del frame, fuera del alcance de revisión iterativa. Decisión: mantener modal con copy actual y revisitar si surge fricción real.
- **Detalle técnico homogéneo en errores (auditoría rápida)**: confirmados los 4 builders de error (`buildParametrosErrorGuardadoDialog`, `buildParametrosErrorActualizacionDialog`, `buildParametrosErrorClienteConfigDialog`, `buildParametrosErrorCargaDialog`) pasan por `envolverDetalleTecnico`. No requiere cambio.

### Lote 3 — Guardado + reconciliación

- **Éxito + diferencias en un solo flujo (H-G3)**: `buildParametrosReconciliacionDiferenciasDialog` ahora acepta `opciones.contexto: 'post-guardado' | 'apertura'`. Cuando viene de `intentarMostrarAvisoReconciliacionTrasGuardar` (después de guardar con diferencias), el dialog se construye con `variant: 'success'` y título `Guardado. Revisa las diferencias`, mensaje aclara que la configuración quedó guardada pero difiere. El usuario ya no ve dos modales encadenados con expectativas contradictorias.
- **`compararOficialCliente` con `null` oficial (H-G5)**: lógica revisada y documentada. Si un campo oficial es null (p.ej. `gratificacion` aún no normada para el mes), no se reporta diferencia — semánticamente "sin base de comparación". Añadido comentario inline explicando el comportamiento esperado.
- **Focus inicial del MessageBox (H-A1)**: ya resuelto en el shared. `MessageBoxComponent` tiene `@Input() initialFocus: 'primary' | 'secondary' | 'close' = 'primary'` que aplica focus en `ngAfterViewInit` para `mode="modal"`. El container de Parámetros usa modal y default primary. No requiere cambio.

### Lote 4 — Polish navegación + cierre

- **Card cierre — una sola acción principal**: el template ya expone un único botón `parametros-cierre-action` que ejecuta `ejecutarAccionCierre()`. El doble acceso histórico se cerró en L1.3 al deshabilitar la banda en área Cierre.
- **Cambio de período dirty (guard)**: confirmado. El `effect()` del orquestador detecta cambios de `periodoGlobal.periodoYm()` y llama a `seleccionarPeriodo(...)` que invoca `confirmarAbandonarEdicionConDialog()`. Si el usuario cancela y el cambio venía del global (`fromGlobal: true`), se restaura `periodoGlobal.setPeriodoYm(this.selectedPeriodo())`. Cubre los caminos del banner global de la app.
- **Banda en cierre — refuerzo**: aplicado en L1.3.

### Validación

- `npx ng build --configuration=development` verde tras cada lote.
- `npx vitest run src/app/features/parametros-generales/rules src/app/features/parametros-generales/utils`: 54/54 verdes. Los 8 del `parametros-workspace.orquestador.spec.ts` siguen rojos por la deuda externa de `TestBed` sin `initTestEnvironment`, ya documentada como cross-módulo.
- Lints sin nuevos errores en los archivos tocados.

### Sin tocar

- BD, servicios, mappers, contratos.
- Estilos globales, archivos protegidos, fuentes.
- Comportamiento de Sincronizar (sigue oculto cuando hay datos).
- `MessageBoxComponent` (focus ya funcionaba).
- Mode modal de los loaders de carga.

## 2026-06-02 - Parámetros: desacople CSS banda + tabs (move a componentes hijos)

Refactor estructural sin cambio visual. Objetivo: cortar el acoplamiento entre el container y sus hijos para que cada componente cargue su propio CSS.

- **Periodo-banda con CSS local**: nuevo `parametros-workspace-periodo-banda.component.css` con `.parametros-viewhead`, `.parametros-period-band`, `.parametros-period-left/right/__status/__detail/__ref/__next/actions/sync`, `.period-row__left-top`, `.period-label`, `.period-arrow`, `.period-mensual__reference`, `.period-chip` + variantes (`--success/--warning/--error/--info/--muted`) y su `@media (max-width: 720px)`. El componente declara `styleUrls` + `encapsulation: ViewEncapsulation.None` (coherente con el container). El host queda como `display: block; flex: 0 0 auto`. El selector `.parametros-frame > .parametros-viewhead` dejó de existir (ahora el host lo aporta).
- **Tabs-panel con CSS local**: nuevo `parametros-workspace-tabs-panel.component.css` con `.parametros-area-tabs`, `.parametros-subtabs`, `.parametros-area-tab/--active`, `.parametros-subtab/--active`, scrollbar webkit, `.parametros-tab-body` + descendientes y `@media (max-width: 760px)`. Host del panel: `display: flex; flex-direction: column; flex: 1 1 auto; min-height: 0`. El componente añade `styleUrls` + `ViewEncapsulation.None`.
- **Container CSS depurado**: se eliminaron del `parametros-workspace-container.css` y del `.responsive.css` todas las reglas movidas. Quedan solo las del shell/page/frame/toolbar/content/cierre/inputs/etc. propias del container.
- **Selectores aplanados**: `.parametros-page app-card.parametros-shell app-card-content.parametros-frame` → `.parametros-frame`. `.parametros-page app-card.parametros-shell` → `.parametros-shell`. Misma cascada, sin depender de los tags `app-card` / `app-card-content`.
- **Limpieza HTML**: `<div class="parametros-content parametros-panel">` → `<div class="parametros-content">`. `parametros-panel` no estaba estilada en ningún lado.
- **Sin tocar**: estilos globales, contratos, motor, BD, servicios, formularios. Build de desarrollo (`npx ng build --configuration=development`) verde. Lints sin nuevos errores (`.param-check {}` vacío preexistente en `responsive.css` queda fuera del alcance).
- **Beneficio**: el container deja de saber clases internas de la banda y de los tabs; refactorizar markup o renombrar clases internas de un hijo ya no requiere editar CSS del padre.

## 2026-06-02 - Parámetros: shell unificado banda + detalle (estilo nómina v2)

Reorganización visual del contenedor del workspace para que la cabecera (banda de período + acciones) y el detalle (tabs + contenido) vivan dentro del mismo marco continuo, igual que los pasos de nómina v2. Sin tocar estilos globales ni el HTML del template.

- **Frame único (`.parametros-frame`)**: ahora lleva el `border`, `border-radius: 10px`, fondo y sombra ligera. El `app-card` envolvente queda transparente. El `padding` del `app-card-content` (`p-4` default) se anula a `0` para que el viewhead pegue arriba.
- **Cabecera integrada (`.parametros-viewhead`)**: padding `10px 14px`, fondo `--prm-soft`, `border-bottom` divider, y `border-top-*-radius: 9px` para coincidir con el frame. Antes era un bloque con `border-radius: 8px` y `background: #f9fafb` flotando aparte.
- **Banda sin caja propia (`.parametros-period-band`)**: se removió su `border` + `border-radius` + `background`; ahora hereda la cabecera (`.parametros-viewhead`). Antes parecía una "isla" dentro del card.
- **Contenido sin doble borde (`.parametros-content`)**: se removió su `border` + `border-radius` propios (el frame ya los provee). Mantiene `overflow: hidden` + `flex` para que los tabs sigan siendo header sticky y el `tab-panel` sea el único con `overflow-y: auto` (scroll interno).
- **Full screen adaptativa**: la cadena ya estaba (`100dvh - chrome` en `.parametros-page` → `flex: 1` en shell → frame → content → tab-panel). No se cambió, solo se confirmó que sigue funcionando tras quitar los bordes intermedios.
- **Sin tocar**: shell global, layout, fuentes, BD, servicios, formularios, contratos. CSS local del módulo. Lints + `npx tsc --noEmit -p tsconfig.app.json` limpios.

## 2026-06-02 - Parámetros: captura anticipada del período por el cliente (sin oficiales)

Cambio funcional acordado con el usuario (alcance: campos oficiales editables + configuración del cliente; reconciliación se mantiene como hoy; **sin cambios de BD/servicio** — se usa el guardado existente).

- **Banda — botón principal**: cuando `!hasAnySyncedData()` el label de Modificar pasa a `Capturar valores`. El botón ya abría edición completa, pero el texto orientaba a "edición de configuración" y no a "captura inicial".
- **Banda — hint del período**: nuevo texto cuando no hay oficiales: `Sin oficiales aún. El cliente puede capturar valores; NOIA los actualizará a fin de mes.`
- **Tooltip Modificar**: caso explícito sin oficiales: `Captura los valores tentativos del cliente para este período. NOIA actualizará los oficiales a fin de mes y revisaremos diferencias.`
- **Tab Valores — empty state**: dos pseudo-tarjetas anteriores ("con referencia" vs "sin referencia") consolidadas en una. Copy reescrito para reflejar el flujo real (el cliente puede capturar UF/UTM/UTA + sueldos + topes + %; NOIA actualiza oficiales a fin de mes). Botón CTA `Capturar valores del período` que delega en `editarParametros()` (mismo flujo que el botón de banda).
- **Tab Valores — botón CTA**: estilo local en el componente, fondo `#1f2937`, hover `#111827`, focus ring `#2563eb`. No introduce tokens nuevos.
- **Sin tocar**: BD, servicio, mappers, contratos, columnas grid, tabs distintas a Valores, estilos globales. La habilitación de campos editables ya estaba conectada a `generalesEditando()` en el tab; solo se cambia messaging y se ofrece un punto de entrada explícito desde el empty state.
- **Reconciliación**: queda como hoy. Cuando NOIA carga el oficial al cierre, el flujo existente emite el chip `Revisar diferencias` y el diálogo de decisión.

## 2026-06-02 - Parámetros Fase 2: tooltips dinámicos, hint contextual y limpieza de redundancias

Continuación de la auditoría `docs/codex/modulos/parametros/auditoria-tab-valores-2026-06.md`. Sigue tocando solo `parametros-generales` (sin cambios globales, SQL ni motor).

- **Tooltip Modificar (H-M6)**: ahora reporta el estado real — `Cargando…`, `Preparando edición…`, `Guardando…`, `No se completó la carga…`, `Período cerrado: solo lectura.`, `Modificar aplica a configuración del cliente…`, o `Abrir edición de la configuración del cliente para este período.`. Antes era un texto único con instrucciones genéricas.
- **Toast inline en lugar de modal pre-guardado (H-G1)**: el botón Guardar de la banda se deshabilita también cuando `!datosFormularioListos()`. `guardar()` queda como defensa en profundidad sin mostrar diálogo. Eliminado el modal `Los datos del período aún se están cargando…` que aparecía si se pulsaba Guardar antes de tiempo.
- **Observaciones de reconciliación a constantes (H-G4)**: copy persistido en BD movido a `OBSERVACIONES_RECONCILIACION` (`actualizadoConOficiales`, `mantenerConfiguracion`, `revisarDespues`). Una sola fuente para la observación que queda en historial.
- **Doble effect de período (H-P2/P3)**: eliminado el `effect()` duplicado en `ParametrosWorkspaceContainer`. Solo queda el del orquestador (con guard de inicialización). El container ya no importa `effect` ni `seleccionarPeriodo`.
- **Hint del período (H-E8)**: `periodoContextoHint` deja de ser un texto fijo (`Sincronizado con el período activo.`) y pasa a contexto útil: `Editando configuración del cliente.` o `Referencia oficial: Abril 2026.`; oculto cuando no hay nada que decir.
- **Labels redundantes en TABS_PARAMETROS_WORKSPACE (H-A4)**: el `.label` del array ahora coincide con `etiquetaTabParametros()` (versión corta). La UI usa la función presenter; el `.label` queda solo por compatibilidad de tipo, sin copy fantasma.
- **scrollActive sin rAF colgado (H-Pf2)**: el `requestAnimationFrame` previo se cancela antes de pedir uno nuevo; al destruir el panel se cancela el pendiente vía `DestroyRef.onDestroy`.
- **Validators (H-F3)**: auditoría confirmó `min/max [0,100]` en porcentajes (sis, sanna, salud*, afc*, trabajoPesado*), `min(0)` sin tope en montos UF/CLP, validador dinámico de `immGratificacion` en función de `gratificacion`. No requiere cambios.
- **ngSubmit sin botón submit (H-F6)**: se conserva (atajo Enter útil), ya protegido por los guards de `guardar()` y por el botón externo de la banda.
- **Tests / tipos / lints**: `npx vitest run` sobre `rules/` + `utils/` → 54/54 verdes. `npx tsc --noEmit -p tsconfig.app.json` sin errores. Lints limpios. Pendiente del fix de runner: los specs con `TestBed` (incluido `parametros-workspace.orquestador.spec.ts`) fallan con vitest puro por falta de `initTestEnvironment` — afecta a varios módulos del repo, no es regresión introducida aquí. Documentado como deuda.

## 2026-06-02 - Parámetros Fase 1: copy NOIA, chips de banda y empty state tab Valores

Cambios aplicados tras la auditoría `docs/codex/modulos/parametros/auditoria-tab-valores-2026-06.md`:

- **Mensajes (`parametros-dialog.rules.ts`)**: reescritos los 17 builders con copy NOIA, tildes correctas, formato `Mes Año` para período en lugar de `yyyy-mm`, código técnico de errores envuelto en "Código técnico (uso interno): …" para no filtrar mensajes crudos de Supabase. Nuevo builder `buildParametrosConfirmarAbandonarEdicionDialog` reemplaza el `globalThis.confirm` nativo. `buildParametrosFormularioInvalidoDialog` ahora recibe lista de campos pendientes.
- **Banda de período**: chips refinados — `Reconciliación pendiente`→`Revisar diferencias`, `Sin config.`→`Falta configuración`, `Sin base`→`Período sin datos`, `Edición`→`En edición`, `Referencia 2026-04`→`Referencia Abril 2026`. `periodoEstadoTitulo` sin prefijo redundante `Estado mensual:`.
- **Card de cierre**: el `<p>` ahora muestra `cierreImpacto()` (info distinta) en lugar de duplicar el detalle de la banda.
- **Tab Valores**: empty state explícito cuando no hay datos oficiales (con referencia disponible si la hay), banner contextual en edición ("Al guardar se persisten también los cambios de Remuneraciones y Cliente"), valores formateados con `DecimalPipe` `es-CL` en modo lectura (UF con 2 decimales, UTM/UTA enteros). Footer oculto si no hay fecha de actualización. Tildes correctas en "Última actualización" y "del período".
- **Orquestador**: `globalThis.confirm` reemplazado por MessageBox con resolver pendiente; doble fetch de períodos en `inicializar()` consolidado a una sola consulta; `subscribe` de `gratificacion` con `takeUntilDestroyed(DestroyRef)`; el dialog de decisión de base ahora muestra hasta 3 acciones (antes `slice(0,2)`).
- **Limpieza**: eliminado código muerto — `nuevoPeriodo`, `crearParametrosParaPeriodo`, `finalizarCrearParametrosConBase`, `ejecutarGuardarInterno`, `pageActions`, `crearParametrosDeshabilitado`, `prepararNuevoPeriodoDesdeBase`, `mostrarConfirmacionCrearParametros`, `emptyParametro`, kind `confirmar-crear-parametros`.
- **Tests**: spec de `parametros-dialog.rules` actualizado al nuevo copy + 4 casos nuevos (form inválido con campos, error de carga con código técnico, abandono de edición, decisión con 3 acciones). Suite de reglas: 48/48 en verde.
- **Sin tocar**: estilos globales, SQL, motor, contratos de servicio, columnas grid, tabs distintas a Valores. Los fallos de `parametros-workspace.orquestador.spec.ts` son preexistentes a este cambio (TestBed `injector` null) y no se introducen por esta fase.

## 2026-06-02 - Nómina V10.1: marco unificado todos los pasos

- Contenedor: `nmv2-step-body` + `nmv2-step-frame` envuelven Parámetros, Alcance, Empleados y pasos demo (movimientos, cálculo, etc.).
- Borde/padding del panel en `.nmv2-step-frame`; pasos sin duplicar marco interno.
- Empleados deja grid lateral KPI/stepper; KPI dentro del panel como el resto.
- Sin cambios a estilos globales, SQL ni motor.

## 2026-06-02 - Nómina V10.1: paso Alcance — solo marco exterior

- `nmv2-step-body--scope` + `alcance-perfect-layout`: continuidad visual bajo cabecera (flujo + detalle del paso), como Parámetros.
- Contenido interno de Alcance sin cambio de patrón (KPI, opciones, checklist).
- Sin cambios a estilos globales, SQL ni motor.

## 2026-06-02 - Nómina V10.1: shell Parámetros sin «Preparar» con base guardada

- Con snapshot de parámetros vigente: CTA shell **«Continuar a alcance»** (habilitado); recarga solo vía «Actualizar» (admin + MessageBox).
- Sin base: **«Preparar nómina»** guarda snapshot y avanza.
- `syncShellContext` reacciona a `estadoParametrosBase` del orquestador (sin depender solo del hijo).
- Sin cambios a estilos globales, SQL ni motor.

## 2026-06-02 - Nómina V10.1: componente modal acceso base parámetros

- Nuevo `nomina-mensual-v2-modal-acceso-base-parametros` (vista desde presenter, inputs/outputs).
- Permisos y evaluación en `nomina-parametros-base-acceso.rules` + `NominaParametrosBaseAccesoService`.
- Overlays y paso Parámetros consumen el servicio; sin duplicar copy ni lógica admin.
- Sin cambios a estilos globales, SQL ni motor.

## 2026-06-02 - Nómina V10.1: bloqueo recarga base parámetros (admin)

- Con base guardada: botón shell «Preparar nómina» deshabilitado para usuarios no admin; administrador ve MessageBox de decisión con repercusiones antes de recargar.
- Modal diferencias: acción «Actualizar» solo visible para admin; RRHH ve MessageBox `blocked` si intenta recargar.
- Validación defensiva: `guardarSnapshotParametrosBase` exige `resumen.periodo === periodoActivo`.
- Sin cambios a estilos globales, SQL ni motor.

## 2026-06-02 - Nómina V10.1: fix truncado «Detalle del paso»

- Eliminado bloque legacy `.nomina-stepper-traceability` en `nomina-mensual-v2-container.css` (`max-width: 88px`, layout flex) que pisaba el grid del componente `nomina-mensual-v2-stepper-traceability` y cortaba email/historial con ellipsis prematuro.
- Tooltip de Historial muestra el último evento completo al pasar el cursor.
- Sin cambios a estilos globales, SQL ni motor.

## 2026-06-02 - Nómina V10.1: fix cuelgue / parpadeo trazabilidad

- Modal trazabilidad: el `effect` ya no escribe señales cuando el modal está cerrado (evitaba bucle de CD con cada `recomputar`).
- Contenedor: `inicializarSesionPeriodo` solo hace `reiniciar` al cambiar período real, no en cada re-ejecución del effect.
- Orquestador: `reiniciarPorCambioPeriodo` preserva contexto y eventos si el período es el mismo.
- Sin cambios a estilos globales, SQL ni motor.

## 2026-06-02 - Nómina V10.1: fix parpadeo «Detalle del paso»

- Orquestador: no vaciar trazabilidad ni estado base si el período no cambió; token en `recomputarTrazabilidad` para ignorar respuestas obsoletas.
- Stepper traceability: un solo `computed` (`soporteIntegridadParametros`) en lugar de dos que leían señales en distinto orden.
- Presenter: resumen unificado desde último evento + auditoría.
- Sin cambios a estilos globales, SQL ni motor.

## 2026-05-30 - Nómina V10.1: panel trazabilidad solo en sidebar Empleados

- Retirado `app-nomina-mensual-v2-trazabilidad-paso` (variant panel) del sidebar de **Alcance**; la trazabilidad del paso sigue en el cluster del stepper superior.

## 2026-05-30 - Nómina V10.1: reanudación sesión + reingreso Parámetros

- Al recargar con base guardada: entrada directa en paso **Alcance**; trazabilidad de Parámetros rehidratada desde snapshot `PARAMETROS-BASE-01` (evento `PARAMETROS_CONGELADOS` servidor).
- MsgBox decisión al volver a Parámetros desde paso posterior: «¿Desea revisar o modificar la configuración?» (Revisar / Cancelar).
- Sin cambios a estilos globales; modal reutiliza `MessageBox` variant `decision`.

## 2026-05-29 - Nómina V10.1: snapshot base parámetros (Preparar nómina)

- Flujo «Preparar nómina»: guardar base si no existe; continuar sin re-guardar si no hay diff; modal decisión si hay diff (Mantener / Actualizar / Ver diferencias).
- Botón shell «Preparar nómina»; modal copy explícito: cálculo en paso Cálculo.
- Panel sidebar Parámetros: líneas «Base guardada», «Hay diferencias», link «Ver diferencias»; retirado `trazabilidad-paso` compacto del resumen.
- CSS local: `.parameters-base-status`, `.parameters-base-status__link` en `nomina-mensual-v2-container.css`.
- Sin cambios a estilos globales, SQL ni motor.

## 2026-05-29 - Nómina V10.1: stepper compacto + cluster trazabilidad

- Header unificado `.nomina-workflow-header`: stepper compacto (subtítulo acción en todos los pasos) + cluster `.nomina-stepper-traceability` a la derecha (responsable, historial, integridad, fecha, drawer completo, alerta si bloqueo/revisión).
- Eliminada barra suelta «Ver trazabilidad completa»; acceso integrado en cluster (`panel-right-open`).
- Panel lateral «Registro del paso» (`variant="panel"`) en sidebars pasos 1–3, cerca del checklist; retiradas franjas superiores en Alcance/Empleados.
- Copy UX: «Sin responsable registrado», «Sin eventos todavía», «Integridad no disponible»; «Verificado por servidor» solo con `verificadoServidor`.
- CSS local: `.nomina-workflow-header`, `.nomina-stepper-traceability`, `.nmv2-trazabilidad-panel` en `nomina-mensual-v2-container.css`.
- Iconos Lucide registrados: `CalendarClock`, `PanelRightOpen`, `ShieldAlert`, `UserRound`, `LockKeyhole`, `CircleCheck`.

## 2026-05-29 - Nómina V10: trazabilidad contextual transversal

- Tres niveles UI: `trazabilidad-paso` (franja compacta por paso), modal contextual (`MessageBox` lg), drawer global fijo derecho.
- Puente real a `NominaCalculoSnapshotRepository` / historial v1; eventos locales pasos 1–3 con `origen: local` (no visible en UI).
- DTO seguro: solo `estadoIntegridad` + `fingerprintPublico` corto; copy **Snapshot registrado** / **Pendiente de verificación servidor** (no “Integridad verificada” salvo `verificadoServidor`).
- Eliminados hashes hex mock en pasos demo; acceso global “Ver trazabilidad completa” bajo stepper.
- CSS local: `.nmv2-trazabilidad-*` en `nomina-mensual-v2-container.css`.

## 2026-05-29 - Nómina V8.2.5c: page fill — cadena shell/outlet + min-height viewport

- **Cambio:** Bloqueo en cadena de alto: `remuneraciones-outlet` tenía `min-height: 0` (impide resolver `%`); shell scroll no estiraba outlet. Fix: `min-height: 100%` en outlet; reglas globales locales `erp-shell-scroll > app-remuneraciones-outlet`; `.nmv2-page.nomina-shell { min-height: calc(100dvh - 52px) }`; hosts de paso con `align-self: stretch` y `.parameters-step-content { min-height: 100% }`.
- **Archivos:** `remuneraciones-outlet.component.ts`, `nomina-mensual-v2-container.css`, `peticiones-estilos.md`.
- **No tocado:** estilos globales, SQL, lógica paso Parámetros.

## 2026-05-29 - Nómina V8.2.5b: page fill paso Parámetros (cadena flex)

- **Cambio:** Corregida cadena shell → página → paso → grilla: `min-height: 100%` en `:host`/`.nmv2-page`; stepper/overlays `flex: 0 0 auto`; hosts de paso `flex: 1 1 auto`; `.nmv2-paso-parametros` → `.nmv2-step-body` → `.parameters-step-content` propagan el alto restante sin inflar cards (`align-items: start`).
- **Archivos:** `nomina-mensual-v2-container.css`, `nomina-mensual-v2.page.ts`, `peticiones-estilos.md`.
- **No tocado:** SQL, estilos globales, lógica de validación.

## 2026-05-29 - Nómina V8.2.5: resumen por 5 visores + layout natural

- **Cambio:** Panel «Resumen de parámetros» distingue métrica visible (`5 de 5 secciones listas`, donut por `completitudSecciones`) de métrica interna (`17 controles verificados`). Mapper/modelo exponen `seccionesTotales`, `seccionesListas`, `controlesTotales`, `controlesVerificados`. Layout paso Parámetros: eliminado `--parameters-aligned-block-height` y `flex: 1` en sidebar/bloqueos; grilla/columnas con `align-items: start` y altura por contenido; `padding-bottom: 24px` en página.
- **Archivos:** `nomina-parametros-resumen.models.ts`, `nomina-parametros-resumen.mapper.{ts,spec.ts}`, `nomina-mensual-v2-paso-parametros.{ts,html}`, `nomina-mensual-v2-container.css`, `peticiones-estilos.md`.
- **No tocado:** SQL, motor, estilos globales, services de negocio.

## 2026-05-29 - Nómina mensual V2: extracción paso Parámetros

- **Cambio:** Paso Parámetros extraído a `nomina-mensual-v2-paso-parametros` (wrapper `.nmv2-paso-parametros`, CSS local existente). Lógica de carga/validación/avance y ayuda shell vía `NominaMensualV2OrquestadorPort`; modales de avance leen `orquestador.modalAvanceParametros`.
- **Archivos:** `nomina-mensual-v2-paso-parametros.{ts,html,css}`, `nomina-mensual-v2-container.{html,ts}`, `peticiones-estilos.md`.
- **No tocado:** services, SQL, estilos globales, pasos mock 2–7 (salvo cableado contenedor).

## 2026-05-29 - Nómina mensual V2: Empleados V1 (grilla del sistema)

- **Cambio:** Paso Empleados migra el listado central a `app-data-grid` (mismo componente que listado empleados/empresas): columnas Nombre/RUT/Cargo/Centro/Jornada/Estados/Acciones, filtros integrados (búsqueda, Estado, Centro, Jornada), badges estándar, menú fila tipo kebab, KPIs y checklist lateral preservados. Presenter local `nomina-empleados-grid.presenter.ts`.
- **Archivos:** `nomina-mensual-v2-container.{html,ts,css}`, `presenters/nomina-empleados-grid.presenter.ts`, `peticiones-estilos.md`.
- **No tocado:** services, SQL, pasos 1 y 3–7, estilos globales.

## 2026-05-29 - Nómina mensual V2: funcional Parámetros V7 (MsgBox bloqueo de avance)

- **Cambio:** Guard de navegación en paso Parámetros con `app-message-box` estándar NOIA: `variant="blocked"` si hay bloqueos (CTA Entendido / Ver pendientes); `variant="decision"` si solo revisiones (Volver y corregir / Continuar de todas formas). Aplica a stepper superior, shell «Validar parámetros» y `nextStep`. Microcopy bajo título cuando hay pendientes. Sin cambios a services/mapper.
- **Archivos:** `nomina-mensual-v2-container.{html,ts,css}`, `peticiones-estilos.md`.
- **No tocado:** SQL, estilos globales, pasos mock 2–7 (salvo mecanismo compartido `intentarIrAPaso`).

## 2026-05-29 - Nómina mensual V2: pulido Parámetros V6 (prep-flow estados claros)

- **Cambio:** Prep-flow superior con modelo de estado explícito (`completo` / `revision` / `faltante` / `bloqueado` / `pendiente`): nodos, etiquetas e iconos diferenciados; conectores coloreados por progreso; paso Validación con `Bloqueado` cuando hay bloqueos (no «Pendiente» genérico); anillo suave en nodo Validación listo/bloqueado. Solo presentación en contenedor.
- **Archivos:** `nomina-mensual-v2-container.{html,ts,css}`, `peticiones-estilos.md`.
- **No tocado:** services, mapper, estilos globales, pasos 2–7, `app.config.ts`.

## 2026-05-29 - Nómina mensual V2: pulido Parámetros V5 (copy y semántica de estado)

- **Cambio:** Pasada final de copy en sidebar paso Parámetros: título dinámico `tituloEstadoParametros()` (`Bloqueos actuales` / `Revisiones pendientes` / `Estado actual`); mensaje completo `Sin pendientes activos.`; caja éxito compacta (`parametros-estado-correcto`, 56px, tono suave). Sin cambio de layout.
- **Archivos:** `nomina-mensual-v2-container.{html,ts,css}`, `peticiones-estilos.md`.
- **No tocado:** services, mapper, estilos globales, pasos 2–7.

## 2026-05-29 - Nómina mensual V2: pulido Parámetros V4 (terminación visual)

- **Cambio:** Pasada fina V4 en paso Parámetros: menos aire residual (`flex: 0 1 auto` en layout, gaps grid 12px); conectores prep-flow más legibles (línea `#b8c3d1`, chevron 7px `#8fa0b3`, nodo revisión `#fffbeb`/`#b45309`); donut ámbar `#d97706`; card lateral Revisiones/Bloqueos más compacta (padding 16px, filas alineadas); cards resumen `min-height: 136px`, footer `padding-top: 12px`, chips `gap: 6px`.
- **Archivos:** `nomina-mensual-v2-container.{ts,css}`, `peticiones-estilos.md`.
- **No tocado:** services, mapper, estilos globales, pasos 2–7.

## 2026-05-29 - Nómina mensual V2: pulido Parámetros V3 (jerarquía y densidad)

- **Cambio:** V3 completo en paso Parámetros: alertas compactas con copy/pluralización (`Corrígelo`/`Corrígelos`, `Hay N ítem(s)`); conectores prep-flow más legibles (chevron centrado, estados distintos); chips ligeros máx. 5 + `+N más`; jerarquía cards (título/subtítulo/footer); sidebar `parametrosPendientesTitle`; donut `donutTone()` (success/warning/danger/neutral); stepper principal más compacto.
- **Archivos:** `nomina-mensual-v2-container.{html,ts,css}`, `peticiones-estilos.md`.
- **No tocado:** services, mapper, estilos globales, pasos 2–7 (solo densidad visual compartida del stepper).

## 2026-05-29 - Nómina mensual V2: pulido Parámetros V3 (alertas copy/pluralización)

- **Cambio:** Franjas de alerta del paso Parámetros con copy RRHH y pluralización correcta (`1 ítem que requiere` / `N ítems que requieren`; `Falta 1 parámetro` / `Faltan N parámetros`; detalle con lo/los según cuenta).
- **Archivos:** `nomina-mensual-v2-container.{html,ts}`, `peticiones-estilos.md`.
- **No tocado:** services, mapper, estilos globales, pasos 2–7.

## 2026-05-29 - Nómina mensual V2: prep-flow slate + shell centrado

- **Cambio:** Wrapper `parameter-prep-flow-shell` con `inline-flex` centrado (anula grid legacy que empujaba a la izquierda). Paleta slate/apagada en prep-flow y tokens `--nmv2-*` del paso: verde `#4a5d56`, revisión stone `#6b6560`, bloqueo `#6f4e4e`; donut alineado. Sin naranjas/verdes neón.
- **Archivos:** `nomina-mensual-v2-container.{html,ts,css}`, `peticiones-estilos.md`.

## 2026-05-29 - Nómina mensual V2: prep-flow centrado en card

- **Cambio:** `parameter-prep-flow` con `justify-content: center` y segmentos `flex: 0 0 auto`; conectores ancho fijo (36px) para que la franja quede centrada en la card, no estirada a la izquierda.
- **Archivos:** `nomina-mensual-v2-container.css`, `peticiones-estilos.md`.

## 2026-05-29 - Nómina mensual V2: prep-flow premium (segment + connector)

- **Cambio:** Prep-flow rediseñado al patrón stepper ERP: nodo circular (`prep-node`) centrado sobre copy, conector entre segmentos alineado al eje del icono, estados en anillo/fondo/texto, conector coloreado según paso previo. Sin grid desalineado ni flecha flotante.
- **Archivos:** `nomina-mensual-v2-container.{html,ts,css}`, `peticiones-estilos.md`.
- **No tocado:** mapper, services, estilos globales.

## 2026-05-29 - Nómina mensual V2: conector prep-flow (flecha alineada)

- **Cambio:** Prep-flow con `prep-track` flex (icono + línea); flecha al final del tramo hacia el siguiente paso; sin posicionamiento absoluto ni flecha centrada. Oculta conector al final de fila (responsive) y antes de Validación en ancho completo.
- **Archivos:** `nomina-mensual-v2-container.{html,css}`, `peticiones-estilos.md`.
- **No tocado:** mapper, services, estilos globales.

## 2026-05-29 - Nómina mensual V2: separación validaciones por área (paso Parámetros)

- **Cambio:** Cada área del paso Parámetros muestra solo sus validaciones: Configuración cliente (gratificación, CCAF, mutual, reconciliación); Datos oficiales (UF/UTM/topes); Catálogos previsionales (AFP/impuesto/salud); Reglas de cálculo (AFC/SIS); Observación normativa. Sin duplicar `catalogos_afp_impuesto` ni mezclar centros/jornadas en cliente. Bloqueos etiquetados por área.
- **Archivos:** `nomina-parametros-resumen.mapper.{ts,spec.ts}`, `nomina-mensual-v2-container.{html,ts,css}`, `peticiones-estilos.md`.
- **No tocado:** services de negocio, SQL, estilos globales, pasos 2–7.

## 2026-05-29 - Nómina mensual V2: paleta NOIA apagada paso Parámetros

- **Cambio:** Colores del paso Parámetros alineados a tokens ERP sobrios (`#166534`, `#92400e`, `#991b1b`, `#0c447c`): donut, prep-flow, alertas, bloqueos vacíos, iconos de cards/accesos y estados; sin verdes/azules neón.
- **Archivos:** `nomina-mensual-v2-container.{ts,css}`, `peticiones-estilos.md`.
- **No tocado:** services, mapper, estilos globales, pasos 2–7.

## 2026-05-29 - Nómina mensual V2: overlay carga paso Parámetros

- **Cambio:** Al entrar al paso Parámetros se muestra `app-message-box variant="loading" mode="modal"` (mismo patrón que mantenedor Parámetros) mientras `parametrosLoading` o `parametrosValidando`; carga inicial en `true` para evitar flash vacío (0 de 0, solo Validación). Contenido detrás con `aria-busy` y sin interacción. Prep-flow: nodo Validación en «Pendiente» abarca todo el ancho del card y queda centrado.
- **Archivos:** `nomina-mensual-v2-container.{html,ts,css}`, `peticiones-estilos.md`.
- **No tocado:** services, mapper, estilos globales.

## 2026-05-29 - Nómina mensual V2: densidad y proporciones paso Parámetros

- **Cambio:** Corrección de inflado visual: revertido `flex: 1` en sidebar/bloqueos (solo el shell estira); prep-flow como franja compacta (`parameters-prep-flow-card`); bloqueos vacíos colapsados (`parameter-blockers-perfect--empty`, mensaje ~72px); cards con chips desde `area.items` (máx. 3); sidebar «Accesos rápidos» más denso; gaps 12px; donut caption más pegado.
- **Archivos:** `nomina-mensual-v2-container.{html,css}`, `peticiones-estilos.md`.
- **No tocado:** services, mapper/models, rules, estilos globales, `angular.json`, pasos 2–7.

## 2026-05-29 - Nómina mensual V2: pulido paso Parámetros (Prompt 1 + 2)

- **Cambio:** Paso Parámetros del wizard V2: franja de alerta condicional (oculta si todo OK; warning/revisión/error según estado), donut de completitud dinámico con caption «X de Y listos» (`completitudItemsPct`, no el porcentaje ponderado del resumen), nodo Validación del prep-flow sincronizado, layout stretch hasta el fondo del viewport. Limpieza CSS: eliminados bloques duplicados v5–v7 (~647 líneas) y reglas redundantes de donut/alerta en iteraciones previas; reglas finales consolidadas al cierre del CSS local.
- **Archivos:** `nomina-mensual-v2-container.{html,ts,css}`, `nomina-mensual-v2.page.ts`, `peticiones-estilos.md`.
- **No tocado:** `nomina-parametros-resumen.service.ts`, mapper/models de parámetros, rules de negocio, SQL/motor, estilos globales, `angular.json`, pasos mock 2–7.

## 2026-05-29 - Liquidaciones oficiales: flujo visual por trabajador y compactación NOIA

- **Cambio:** Liquidaciones se reordena como acta operativa compacta: franja superior con estado/origen/acción, resumen financiero único, grilla protagonista y detalle lateral. La grilla incorpora flujo visual local por trabajador (**Autorizar** → **Registrar pago** → **Enviar documento**) con PDF deshabilitado y **Solicitar rectificación** solo como marca UI no persistente. Nómina mensual mejora el empty inicial y diferencia el cierre final como `Proceso mensual cerrado`.
- **Archivos:** `liquidaciones-oficiales-container.*`, `liquidaciones-trabajadores-grid.*`, `liquidacion-detalle-panel.*`, `liquidaciones-acciones-ui.rules.*`, `proceso-mensual-revision-trabajadores.component.*`, `proceso-mensual-estado-operativo.rules.*`, specs.
- **No tocado:** SQL/RPC/RLS, motor de cálculo, repositorios de negocio, rutas productivas, estilos globales, `angular.json`.

## 2026-05-29 - Nómina mensual: cierre UI flujo aprobar → emitir → cerrar (fases P4–P10)

- **Cambio:** Cierre del plan UI-Flow: eliminado camino atómico `confirmar_nomina_operativa` (store/facade). Errores de aprobación/cierre humanizados (`prenomina-validacion-ui.rules`, banners en workspace). Copy residual (flow-nav, acciones período, bitácora cierre, modales). Liquidaciones: layout `liq-*` con tokens `--erp-*` locales, sin `app-card` en contenedor. Capturador Playwright y docs `01-flujo-operativo.md` / `paso-a-paso/README` en orden aprobar → liquidaciones → cerrar.
- **Archivos:** `proceso-mensual-periodo.store.ts`, `proceso-mensual-presentacion.facade.ts`, `proceso-mensual-workspace.*`, `prenomina-validacion-ui.rules.*`, `proceso-mensual-flow-nav.rules.ts`, `proceso-mensual-acciones-periodo.rules.ts`, `liquidaciones-oficiales-container.*`, `tests/preparar-nomina-screenshots.spec.ts`, docs preparar-nomina, specs message-box/parametros.
- **No tocado:** SQL/RPC, motor, repos de negocio, estilos globales, `angular.json`.

## 2026-05-29 - Nómina mensual: copy y bitácora alineados a aprobar → emitir → cerrar (UI fase 1)

- **Cambio:** Terminología visible unificada: **Aprobar nómina** → **Generar liquidaciones** → **Cerrar proceso mensual** → **Proceso cerrado** / **Cerrada**. Timeline de 5 pasos; bitácora lateral con etapas separadas (aprobar, liquidaciones, cierre). Modales de aprobar y cierre con copy coherente. Configuración del período distingue aprobada vs cerrada. Liquidaciones: copy «aprobada», shell CTA «Volver a Nómina mensual para cerrar el período» tras emitir. Estado `nomina_cerrada` sin CTA activo de generar.
- **Archivos:** `proceso-mensual-estado-operativo.rules.ts`, `proceso-mensual-workspace.rules.ts`, `proceso-mensual-workspace-presentacion.rules.ts`, `proceso-mensual-presentacion.facade.ts`, `proceso-mensual-revision-aprobacion.rules.ts`, `proceso-mensual-expediente-periodo.rules.ts`, `liquidaciones-oficiales-container.*`, `liquidaciones-oficiales.rules.ts`, specs.
- **No tocado:** SQL, motor, repos, estilos globales, `angular.json`, P7 errores, P9 estilos Liquidaciones, P10 capturas.

## 2026-05-28 - Nómina mensual: flujo explícito aprobar → emitir → cerrar

- **Cambio:** El flujo operativo del período se separa en pasos visibles. Tras guardar la revisión, la acción principal pasa a ser **«Aprobar nómina»** (antes «Confirmar nómina», que aprobaba y cerraba en un paso). Con la nómina aprobada y sin liquidaciones emitidas, la acción principal es **«Generar liquidaciones»** (dirige a la pantalla de Liquidaciones); recién con liquidaciones emitidas aparece **«Confirmar nómina»** como cierre final. Copy y descripciones alineadas al nuevo orden. Orquestación: la aprobación valida primero (`fn_validar_prenomina_periodo`) y luego aprueba (`fn_aprobar_prenomina_periodo`).
- **Archivos:** `proceso-mensual-estado-operativo.rules.ts`, `proceso-mensual-flujo-completo.rules.ts`, `proceso-mensual-presentacion.facade.ts`, `nomina-calculo-snapshot.repository.ts`, specs asociadas (`*-estado-operativo`, `*-flujo-completo`, `proceso-mensual-container`, `nomina-calculo-snapshot.repository`, `proceso-mensual.service`).
- **No tocado:** estilos globales, `angular.json`, motor de cálculo. (SQL de RPC ajustado en fase de backend previa para imponer emitir antes de cerrar.)

## 2026-05-28 - Parámetros: aviso de diferencias al guardar y al reingresar

- **Cambio:** Modal de diferencias (oficial vs configuración) al **guardar** si hay valores distintos, y al **cargar/reingresar** el período; ya no se bloquea por calendario en estado pendiente; reabre si hubo decisión sin fecha o config editada después. Recarga al volver desde otra ruta a `/parametros`.
- **Archivos:** `parametros-completitud.rules.ts`, `parametros-dialog.rules.ts`, `parametros-workspace.orquestador.ts`, specs, `peticiones-estilos.md`.
- **No tocado:** estilos globales, SQL/RPC, motor de nómina.

## 2026-05-28 - Nómina mensual: checklist coherente y modal parámetros sin duplicar

- **Cambio:** Trabajadores no muestra «Listo» hasta existir nómina generada (queda «Pendiente»). Modal Parámetros: un solo mensaje de carga, tarjeta de contexto como fuente única (sin «Qué revisar» repetido); checklist no duplica «Consultando» mientras el modal está abierto.
- **Archivos:** `proceso-mensual-workspace-presentacion.rules.ts`, `proceso-mensual-presentacion.facade.ts`, `proceso-mensual-informacion-modal.component.html`, specs, `peticiones-estilos.md`.
- **No tocado:** estilos globales, store, SQL/motor.

## 2026-05-28 - Nómina mensual: acta un CTA y checklist lateral con acta

- **Cambio:** Con el acta de preparación visible, el sidebar vuelve a mostrar «Configuración del período» (Parámetros, Nómina, Trabajadores, Liquidaciones). En «Qué corregir» solo texto por fila; un único «Abrir parámetros» en `payroll-acta-preparacion__actions`.
- **Archivos:** `proceso-mensual-acta-preparacion.rules.ts`, `proceso-mensual-workspace.component.html`, specs, `peticiones-estilos.md`.
- **No tocado:** estilos globales, store, SQL/motor.

## 2026-05-28 - Nómina mensual: modal parámetros alineado con consulta PG

- **Cambio:** El modal «Parámetros del período» prioriza la consulta en vivo (grupos y operatividad) sobre prevalidación antigua; fila **Configuración del período** con estado RRHH («Faltan datos» / «Listo») cuando bloquea; pie solo «Abrir parámetros» si ya se evaluó el período (operativo o con pendientes).
- **Archivos:** `proceso-mensual-parametros-refresh.rules.ts`, `proceso-mensual-presentacion.facade.ts`, specs.
- **No tocado:** estilos globales, SQL/motor.

## 2026-05-28 - Nómina mensual: acta sin movimientos y modal parámetros alineado

- **Cambio:** Acta central «Revisión del período» sin bloque contexto (período/trabajadores/movimientos/recurrentes); título y descripción desde etapa activa; pendientes y resumen sin duplicar copy largo. Modal Parámetros: si parámetros operativos o flujo principal/preparación en curso, pie solo «Abrir parámetros» (sin CTA «Verificar período» obsoleto); checklist mantiene fila parámetros en vivo durante preparación unificada.
- **Archivos:** `proceso-mensual-acta-preparacion.rules.ts`, `proceso-mensual-workspace.component.html`, `proceso-mensual-parametros-refresh.rules.ts`, `proceso-mensual-presentacion.facade.ts`, specs, `peticiones-estilos.md`.
- **No tocado:** estilos globales, `angular.json`, SQL/motor.

## 2026-05-28 - Nómina mensual: flujo unificado verificar y generar (overlay etapas)

- **Cambio:** «Verificar y generar» usa un solo overlay con lista de etapas (verificar → borrador → cálculo → guardar → bitácora), sin alternar acta/focus/layout `--preparacion` ni parpadeos de checklist/shell/tabs. Modo encadenado en store omite vaciado intermedio de snapshot y carga completa duplicada tras validar.
- **Archivos:** `proceso-mensual-periodo.store.ts`, `proceso-mensual-presentacion.facade.ts`, `proceso-mensual-workspace.rules.ts`, `proceso-mensual-workspace.component.{html,css}`, specs.
- **No tocado:** estilos globales, `angular.json`, SQL/motor.

## 2026-05-28 - Nómina mensual: checklist resumido (parámetros, nómina, trabajadores, liquidaciones)

- **Cambio:** Checklist sin fila Movimientos. **Nómina del período** siempre visible: «Sin generar» sin borrador, «Cerrada» con bloqueos o confirmada, resumen según frame. Acciones `verificar_periodo` / `generar_nomina` desde la fila.
- **Archivos:** `proceso-mensual-workspace-presentacion.rules.ts`, `proceso-mensual-presentacion.facade.ts`, specs, `peticiones-estilos.md`.
- **No tocado:** estilos globales, SQL/motor.

## 2026-05-28 - Nómina mensual: checklist bloqueos, iconos sutiles en tabs

- **Cambio:** El checklist «Configuración del período» distingue bloqueos de **Nómina del período** (fila propia, «Revisar nómina») vs bloqueos en **Trabajadores**. Icono de acciones del período (tuerca) y chip de alertas del detalle mensual más discretos; iconos del checklist con tono atenuado en estados críticos.
- **Archivos:** `proceso-mensual-estado-operativo.rules.ts`, `proceso-mensual-workspace-presentacion.rules.ts`, `proceso-mensual-presentacion.facade.ts`, `proceso-mensual-workspace.component.{html,css}`, `payroll-detalle-mensual-panel.css`, `proceso-mensual-container.css`, specs.
- **No tocado:** estilos globales, `angular.json`, SQL/motor.

## 2026-05-28 - Nómina mensual: acciones del período en modal y historial

- **Cambio:** «Acciones del período» deja de ocupar la franja superior del workspace; se abre con icono de configuración a la derecha de las pestañas Detalle/Historial. Historial del período incorpora el snapshot activo si la lista async aún no lo incluye.
- **Archivos:** `proceso-mensual-workspace.component.{html,css,ts}`, `proceso-mensual-historial-periodo.rules.ts`, `proceso-mensual-presentacion.facade.ts`, specs.
- **No tocado:** estilos globales, `angular.json`, SQL/motor.

## 2026-05-28 - Nómina mensual: persistencia F5 y parámetros alineados

- **Cambio:** Rehidratación restaura `resultado` desde metadata del snapshot (borrador/preliminar/confirmado). Overlay Parámetros con copy de carga oficial/reconciliación; workspace `/parametros` respeta `periodo` en query desde nómina.
- **Archivos:** `proceso-mensual-borrador-snapshot.rules.ts`, `proceso-mensual-periodo.store.ts`, `proceso-mensual.service.ts`, `nomina-calculo-snapshot.repository.ts`, `proceso-mensual-presentacion.facade.ts`, `proceso-mensual-validacion-calculo.rules.ts`, `proceso-mensual-parametros-refresh.rules.ts`, `parametros-workspace-container.ts`, `parametros-workspace.orquestador.ts`, specs.
- **No tocado:** estilos globales, `angular.json`, SQL/motor.

## 2026-05-28 - Nómina mensual: barra lateral sin borde izquierdo de acento

- **Cambio:** Se quitan `border-left` de acento en la barra izquierda del workspace: ítems de configuración del período (prioridad/revisión/riesgo) y pasos de bitácora (activo/bloqueado). El estado se mantiene por icono, fondo y chip.
- **Archivos:** `proceso-mensual-container.css`.
- **No tocado:** estilos globales, `angular.json`, SQL/motor.

## 2026-05-27 - Loading NOIA unificado (MessageBox + overlay nómina)

- **Cambio:** `app-message-box` loading modal: ancho `sm` por defecto, sin cerrar ni eyebrow, spinner azul primario. Parámetros y empleados usan solo `variant="loading"`. Nómina vuelve al overlay contextual sobre la consola (no modal pantalla completa), con la misma tarjeta/spinner azul del diseño actual.
- **Archivos:** `message-box.component.ts`, `proceso-mensual-workspace.component.{html,css,ts}`, `parametros-workspace-container.html`, `form-empleado.html`.
- **No tocado:** estilos globales, SQL/motor.

## 2026-05-27 - Nómina: laboratorio MessageBox (guía visual)

- **Cambio:** Página `/remuneraciones/msgbox-lab` con pestañas Referencia (Parámetros) / Nómina actual / Nómina propuesto / Utilidad; preview modal por ejemplo; regla `mapConfirmacionNominaToSections` para migrar overlays sin `nom-acta-modal`.
- **Archivos:** `nomina-msgbox-lab-container.*`, `nomina-msgbox-lab.rules.ts`, `nomina-msgbox-lab.page.ts`, `app.routes.ts`, spec.
- **No tocado:** overlays productivos de nómina, estilos globales, SQL/motor.

## 2026-05-27 - Parámetros: modal diferencias con carga oficial del mes

- **Cambio:** Al abrir un período con carga oficial y configuración cliente distinta, MessageBox de reconciliación con copy RRHH («Configuración distinta a los parámetros oficiales del mes») y detalle por campo. Reaparece si cambian las diferencias o si hubo nueva carga oficial tras «Revisar después» / «Mantener configuración».
- **Archivos:** `parametros-completitud.rules.ts`, `parametros-dialog.rules.ts`, `parametros-workspace.orquestador.ts`, specs.
- **No tocado:** estilos globales, `angular.json`, SQL/motor.

## 2026-05-26 - Nómina mensual: verificar y generar en un solo paso (restaurado)

- **Ajuste 2026-05-26:** Loading unificado **«Verificando y generando nómina»** en overlay, acta y focus mientras corre el paso encadenado (sin alternar «Verificando período» / «Generando nómina»). Copy del frame `generando` alineado al mismo paso.
- **Cambio:** El CTA **Verificar y generar nómina** vuelve a encadenar prevalidación + generación de borrador (fix effect que limpiaba la bandera antes de tener resultado). Mismo label en shell, acta y estado `listo_para_generar_base` hasta existir borrador. Bitácora lateral oculta el paso «Generar nómina» duplicado mientras preparación no termina.
- **Archivos:** `proceso-mensual-presentacion.facade.ts`, `proceso-mensual-estado-operativo.rules.ts`, `proceso-mensual-acta-preparacion.rules.ts`, `proceso-mensual-workspace.rules.ts`, specs.
- **No tocado:** estilos globales, `angular.json`, SQL/motor.

## 2026-05-26 - Nómina mensual: CTAs y modales de confirmación diferenciados

- **Cambio:** Se distingue el flujo RRHH en tres pasos con copy propio: **Guardar revisión** → **Registrar revisión RRHH** → **Confirmar nómina del período** (shell y estado operativo). Modales de decisión con `eyebrow` explícito, variante `decision`/`warning` y bloque «Próxima acción» contextual (sin texto genérico de liquidaciones en el paso intermedio). Frame `lista_para_confirmar` adapta chip y mensaje según sub-estado.
- **Archivos:** `proceso-mensual-estado-operativo.rules.ts`, `proceso-mensual-workspace.rules.ts`, `proceso-mensual-presentacion.facade.ts`, `proceso-mensual-overlays.component.html`, `proceso-mensual-container.vm.ts`, `proceso-mensual-flow-nav.rules.ts`, `proceso-mensual-revision-aprobacion.rules.ts`, `proceso-mensual-flujo-completo.rules.ts`, specs.
- **No tocado:** estilos globales, `angular.json`, SQL/motor.

## 2026-05-26 - Nómina mensual: montos borrador sin «Est.» + moneda contrato + bloqueo sueldo base

- **Cambio:** Se retira la estimación «Est. $X» desde entradas (no incluía sueldo base del contrato). En borrador sin cálculo: copy **«Pendiente de cálculo»** y montos `$0` normalizados a vacío. Montos visibles respetan moneda del contrato en personal (`$` CLP o `UF`). Bloqueo de sueldo base como concepto/movimiento manual en catálogo, novedades y movimientos variables; advertencia en prevalidación si hay entradas históricas con concepto reservado. **Generar nómina** dispara también el cálculo preliminar (mismos datos que antes exigían un paso aparte).
- **Archivos:** `concepto-contrato-reservado.rules.ts`, `proceso-mensual-masivo-layout.rules.ts`, `proceso-mensual-presentacion.facade.ts`, `proceso-mensual-presentacion.formato.ts`, `proceso-mensual-revision-trabajadores.component.{html,css}`, `proceso-mensual-concepto-reservado-prevalidacion.rules.ts`, `empleados.repository.ts`, `haberes-descuentos.service.ts`, `novedades-mensuales.{rules,service}.ts`, `movimiento-variable-validacion.rules.ts`, specs.
- **No tocado:** estilos globales, `angular.json`, SQL/motor.

## 2026-05-26 - Nómina mensual: montos referenciales en borrador (Detalle mensual / trabajadores) — **revertido**

- **Nota:** La entrada anterior quedó reemplazada por el bloqueo de «Est.» y moneda por contrato (ver entrada inmediata superior).

## 2026-05-26 - Nómina mensual: radios planos e integración visual uniforme

- **Ajuste 2026-05-26:** Tab Historial: sin fila placeholder ni título duplicado en grilla; vacío centrado (icono history, copy trazabilidad); cabecera sin tile suelto de liquidaciones; indicador «N eventos» en tab cuando hay datos; grilla operativa a altura completa con marco NOIA.
- **Ajuste 2026-05-26:** Sidebar nómina (franja + bitácora): iconos sin caja de fondo; estado solo por color del icono (`--erp-ok`, `--erp-review`, `--erp-ink`, `--erp-subtle`, `--erp-danger`); columna 26px para alineación.
- **Ajuste 2026-05-26:** Bitácora sidebar: título con más aire (`12px/9px`), borde inferior `--erp-border-strong` y alineado a pasos; rail con respiro superior/inferior; pasos alineados a franja (icono 26px, filas 46px, separadores); fondo `--erp-surface` en bloque; activo con banda `--erp-primary-soft` e indicador lateral fino (3×14px).
- **Ajuste 2026-05-26:** Sidebar izquierda (franja, bitácora, card confirmación, focus): marcos al borde con `--erp-border-strong`; padding solo en ítems, títulos, pasos y métricas internas.
- **Patrón reutilizable (obligatorio en nómina mensual):** el elemento que lleva borde o separador estructural va con `padding: 0`; el aire va en hijos de contenido (`--payroll-space-inline` / `--payroll-space-block`). No mezclar: marco al borde, texto y controles indentados dentro.
- **Ajuste 2026-05-26:** Patrón padding interno (`--payroll-space-inline/block`): marcos con borde sin padding; contenido hijo (tab-summary, acta, filtros, grilla, tabs) con aire interno.
- **Ajuste 2026-05-26:** `.payroll-tab-panel` sin padding global; espaciado en acta, tab-summary e historial; expediente detalle con borde superior (sin doble marco lateral).
- **Ajuste 2026-05-26:** Expediente trabajadores (Detalle mensual): sin padding izquierdo en tabs workspace, barra de filtros y paginación; marco `--erp-border-strong` en expediente + grilla; celdas y cabeceras con bordes visibles.
- **Cambio:** Segunda pasada visual del módulo: tokens locales `--payroll-radius-surface: 0` y `--payroll-radius-control: 3px`; segment nav y tabs operativos con subrayado plano (sin píldoras 999px ni cajas 5–8px); franja, sidebar, acta, expediente, focus, métricas y empty states con esquinas rectas; controles/CTA/chips con radio contenido 3px; overlay de carga y modales sin sombras decorativas; incidencias/pasos/vacíos del expediente con separadores finos en lugar de mini-cards.
- **Archivos:** `proceso-mensual-container.css`, `proceso-mensual-workspace.component.css`, `payroll-segment-nav.css`, `payroll-operational-tabs.css`, `payroll-detalle-mensual-panel.css`, `payroll-operativa-empty.css`, `proceso-mensual-revision-trabajadores.component.css`.
- **No tocado:** estilos globales, `angular.json`, SQL/motor.

## 2026-05-26 - Nómina mensual: expediente solo trabajadores + alertas en cabecera

- **Cambio:** Detalle mensual / expediente del período deja pestañas Situación, Liquidaciones y Pendientes; muestra solo revisión por trabajador. Icono de alertas en esquina superior derecha de la cabecera (contador); al pulsar abre modal expandido con tabla de bloqueos/advertencias y acción por fila (cierre solo con X). No se listan incidencias «Sin observaciones» ni copy equivalente sin pendiente real. Anti-duplicidad: CTA único en shell; sin bloque Revisión en rail, sin guía operativa repetida, sin focus ni cabecera de tab redundantes con borrador generado, sin botones duplicados en empty state ni «Resumen ampliado». Botones sólidos unificados con `var(--erp-ink)`. Navegación interna normaliza destino legacy a vista trabajadores.
- **Archivos:** `proceso-mensual-workspace.component.{html,ts}`, `payroll-detalle-mensual-panel.css`, `proceso-mensual-detalle-mensual.rules.ts`, `proceso-mensual-workspace.rules.ts`, `proceso-mensual-workspace.port.ts`, `proceso-mensual-workspace-presentacion.rules.ts`, `proceso-mensual-presentacion.facade.ts`, specs.
- **No tocado:** estilos globales, `angular.json`, SQL/motor.

## 2026-05-25 - Nómina mensual: secciones con botones y fondos crema puntuales

- **Cambio:** Filtros detalle (Situación/Trabajadores…) en píldoras con activo carbón; métricas en cajas `--erp-metric-tile`; toolbar detalle y vacíos con `--erp-surface-soft` (#f8f5ec); franja focus y tabs sin degradado global; empty trabajadores alineado a referencia (copy + CTA + fila métricas); patrón `payroll-operativa-empty` con CTA primario arriba a la derecha (Verificar período, Ir a trabajadores).
- **Ajuste 2026-05-25:** Tokens nómina realineados a creación avanzada (`#ffffff`, `#fafaf7`, bordes `#dadfd7`); sin crema `#f8f5ec`.
- **Ajuste 2026-05-25:** Acción/activo/hover con familia `--erp-ink` (`#243b53` / `#172033`); `--erp-primary*` alias de ink; CTAs, tabs, rail y modales.
- **Ajuste 2026-05-25:** Detalle mensual unificado (`payroll-detalle-mensual-panel.css`): expediente + tabbar + cuerpo en un panel; scroll horizontal en pestañas; avisos y vacíos dentro del cuerpo.
- **Ajuste 2026-05-25:** Empty `app-data-grid` («Registro pendiente») ocupa 100% del alto en Pendientes/Liquidaciones/Trabajadores: `gridHeight="100%"`, cadena flex en panel detalle y reglas en `data-grid.component.css`.
- **Ajuste 2026-05-25:** CTA superior derecho en `payroll-operativa-empty` ya no queda fijo: toma la acción principal del estado operativo (p. ej. tras verificar pasa a `Generar nómina`); añade estilo `:disabled` coherente.
- **Ajuste 2026-05-25:** Panel de cargado (`payroll-workspace-loading`) también aparece durante flujos largos (verificar/generar/calcular/guardar/confirmar) con mensaje contextual, no solo al rehidratar/consultar snapshot.
- **Ajuste 2026-05-25:** `payroll-workspace-loading` sube a `z-index: 70` para cubrir headers sticky del `app-data-grid` (`z-10`) y evitar que se vean por encima del overlay.
- **Ajuste 2026-05-25:** Overlay de carga se unifica: `accionPeriodoEnCurso()` incluye también rehidratación/consulta de snapshot, evitando doble overlay al generar nómina (no hay “corte” entre generar y cargar bitácora).
- **Archivos:** `payroll-segment-nav.css`, `payroll-operational-tabs.css`, `payroll-operativa-empty.css`, `proceso-mensual-container.css`, `proceso-mensual-workspace.component.{html,css}`, `proceso-mensual-revision-trabajadores.component.{html,css,ts}`.
- **No tocado:** estilos globales, `angular.json`, servicios/motor.

## 2026-05-25 - MsgBox Siguiente: ajuste copy y CTA primario

- **Cambio:** Mensaje «tiene N campos…», cierre «Podrás continuar…» (seccion info); primario «Ir al primer campo»; secundario «Continuar con pendiente».
- **Archivos:** `empleado-alta-modal.presenter.ts`, `form-empleado.ts`, specs.

## 2026-05-25 - MsgBox Siguiente: copy bloqueos + lista viñetas

- **Cambio:** `next-step-review` con errores bloqueantes usa `buildNextStepBlockingModalContent` (título, mensaje, «Campos pendientes», CTAs). MessageBox renderiza `section.items` como `<ul>`. `draft-invalid` / `finish-invalid` sin cambio.
- **Archivos:** `empleado-alta-modal.presenter.ts`, `form-empleado.ts`, `message-box.component.html/css`, specs, `creacion-avanzada.md`.

## 2026-05-25 - MsgBox alta: sin listado embebido de campos

- **Cambio:** Eliminado el bloque HTML `advanced-action-fields` (listado por paso + «Ir al campo») del slot del MsgBox en Siguiente / Guardar / Finalizar. Modal `md` con título, mensaje, secciones bitácora y CTAs del pie; `fieldItems` permanece en modelo para «Ir al primer pendiente» y foco. Ámbar solo en consola bitácora.
- **Archivos:** `form-empleado.html`, `form-empleado.ts`, `form-empleado.feedback.css`.

## 2026-05-25 - Primarios azul corporativo (Empleados + tokens ERP)

- **Cambio:** Tokens `--erp-primary` / `--erp-primary-hover` alineados a AGENTS (`#2563EB` / `#1D4ED8`); CTA topbar shell y toolbar primaria ficha dejan negro `#2c2c2a`; barra progreso expediente usa primario; botones ámbar de atención en consola bitácora sin cambio.
- **Archivos:** `src/styles.css`, `header.component.ts`, `ficha-empleado-container.css`, `ficha-empleado-detalle.css`, `empleado-expediente-tokens.css`.
- **No tocado:** sidebar, botones atención ámbar, mappers/SQL, `angular.json`.

## 2026-05-25 - Creación avanzada: cierre honorarios + gate 17/15 E2E

- **Cambio:** MsgBox cierre honorarios («Finalizar boleta de honorarios», CTA «Finalizar honorarios»); confirmación cambio relación con `disableClose` en modal; nota inline «Modalidad: honorarios» en paso contrato.
- **Archivos:** `form-empleado.ts`, `form-empleado.html`, `contrato.html`, `empleado-alta-avanzada.vm.ts`.
- **No tocado:** estilos globales, SQL, motor nómina.

## 2026-05-25 - Creación avanzada: fixes E2E + validación finalizar (sin UI global)

- **Cambio:** Exclusión reglas meta al finalizar alta avanzada; matching catálogo tipo trabajador compuesto; helpers E2E (MsgBox confirmar, dismiss borrador, RUT duplicado).
- **Archivos:** `form-empleado.ts`, `empleado-tipo-trabajador-flow.rules.ts`, `tests/helpers/empleados-borrador-e2e.ts`, specs persistencia/flujos.
- **No tocado:** estilos globales, SQL, motor nómina.

## 2026-05-23 - Creación avanzada: pirámide pruebas E2E (sin cambio visual productivo)

- **Cambio:** Specs Playwright validaciones/flujos/honorarios/inferencia; helpers MsgBox; testid unificado `empleado-alta-avanzada-guardar` en `empleados-borrador.spec.ts`; matriz F1–F13 en codex.
- **Archivos:** `tests/**`, `playwright.config.ts`, `package.json` scripts, `docs/codex/modulos/empleados/matriz-pruebas-creacion-avanzada.md`.
- **No tocado:** estilos globales, UI Angular de producción (salvo ya documentado testid header).

## 2026-05-25 - Shell header: data-testid en CTA primaria (E2E)

- **Cambio:** `[attr.data-testid]="action.actionId"` en el botón de `primaryAction` del header (`empleado-alta-avanzada-guardar` para guardar borrador / finalizar en alta avanzada). Sin CSS nuevo.
- **Archivos:** `src/app/layout/header.component.ts`.
- **No tocado:** estilos globales, tema, formulario.

## 2026-05-23 - Alta avanzada: guía normativa CL (consola + motor único)

- **Cambio:** `buildAltaValidacionInput` / `evaluarAltaValidacionesVisibles` alimentan consola; bloque «Revisiones normativas» (Revisar / Aplicar / Mantener); panel pasivo «Revisión guiada» eliminado en Resumen; franja `advanced-step-normativa-hint` en pasos 2,3,4,5,6,8; coherencia ampliada (plazo, DT, exclusión jornada, respaldo); sin `max(168)` en horas.
- **Archivos:** `empleado-alta-validacion-input.ts`, `empleado-alta-coherencia.rules.ts`, `alta-bitacora-console/*`, `form-empleado.*`, `empleados-form-orchestrator.service.ts`, `contrato.html`, specs, `empleado-alta-normativa-cl.md`.
- **No tocado:** estilos globales, SQL, motor nómina, `angular.json`.

## 2026-05-24 - Alta avanzada: consola pendientes — toggle estable

- **Cambio:** `ngOnChanges` solo abre/cierra al **cambiar** `expandedByDefault` (entrar/salir de Resumen), no en cada actualización del VM; el usuario puede colapsar en Resumen sin que se reabra sola.
- **Archivos:** `alta-bitacora-console.component.ts`, spec.
- **No tocado:** layout, reglas.

## 2026-05-24 - Alta avanzada: cadena flex hasta outlet scroll

- **Cambio:** `erp-shell-scroll` como flex column; `crear-empleado-container` y `page-shell.erp-fullscreen-page:has(.advanced-create-shell)` con `height: 100%` en toda la cadena; corregido `content-shell` genérico que imponía `min-height: auto !important` sobre `--advanced`; `min-height: calc(100dvh)` sustituido por reparto flex en crear.
- **Archivos:** `layout-shell.component.ts`, `crear-empleado-container.css`, `src/styles.css`, `form-empleado.css`.
- **No tocado:** consola, lógica, tema.

## 2026-05-23 - Alta avanzada: eliminar hueco blanco bajo wizard

- **Cambio:** cadena de altura en flex column — `editor-frame--advanced` deja de ser grid con filas `auto` y reparte alto a `workspace-grid`; `content-shell--advanced` estira con `height: 100%`; `advanced-create-inner` sin `min-height` viewport duplicado; `page-shell.erp-fullscreen-page` sin gap 1.5rem.
- **Archivos:** `src/styles.css` (bloque `app-form-empleado`), `form-empleado.css`.
- **No tocado:** consola, lógica, tema global, SQL.

## 2026-05-24 - Alta avanzada: consola — fix layout grid y simplificación CSS

- **Cambio:** consola movida dentro de `.advanced-wizard-content` (evita 3.er hijo del grid y fila `auto` fantasma); posición en `:host`; estilos solo en `alta-bitacora-console.component.css`; eliminados `:has()` en `form-empleado.css` y CSS muerto `alta-resumen-diagnostico-panel`.
- **Archivos:** `form-empleado.html`, `form-empleado.css`, `alta-bitacora-console/*`.
- **No tocado:** reglas, estilos globales.

## 2026-05-24 - Alta avanzada: consola compacta y dock al fondo

- **Cambio:** colapsada = chip estrecho (auto width, padding 4px 8px); expandida = tamaño anterior (360px / 40vh); dock `bottom/right: 0`; wizard con `grid-template-rows: minmax(0, 1fr)` para llenar alto; `padding-bottom` del contenido según estado consola.
- **Archivos:** `alta-bitacora-console.component.css`, `form-empleado.css`.
- **No tocado:** reglas, estilos globales.

## 2026-05-24 - Alta avanzada: consola unificada de pendientes

- **Cambio:** «Pendientes del expediente», registros de bitácora con pendiente y «Pendientes para cierre» salen del card Resumen y pasan a `app-alta-bitacora-console` (dock inferior derecha, colapsable) en todo el wizard avanzado.
- **Archivos:** `alta-bitacora-console/*`, `form-empleado.html/ts/css`, `empleado-alta-avanzada.vm.ts`.
- **No tocado:** reglas de diagnóstico, mapa lateral bitácora, estilos globales, SQL.

## 2026-05-24 - Calendario: popover con Floating UI (modal y ficha)

- **Cambio:** `app-calendar-input` posiciona el popover con `position: fixed` + `@floating-ui/dom` (flip/shift), igual que search-select; evita recorte en modal con scroll.
- **Archivo:** `calendar-input.component.ts`.

## 2026-05-24 - Ficha empleado: popovers sobre modal edición

- **Cambio:** backdrop `z-index: 11050`; tokens flotantes `11070`; scroll en `.ficha-edit-form`; `overflow: visible` en shell para que select/calendario/tips no queden recortados.
- **Archivo:** `ficha-empleado-edit-modal.component.css`.

## 2026-05-24 - Ficha empleado: modal edición — altura controles 22px

- **Cambio:** inputs/select en modal vuelven a `var(--erp-control-height, 22px)` (se quitó override 34px de UX-04).
- **Archivo:** `ficha-empleado-edit-modal.component.css`.

## 2026-05-24 - Ficha empleado: modal edición expediente (UX-04)

- **Cambio:** `ficha-empleado-edit-modal` con acciones en cabecera, sin footer gris; shell menos card; labels/inputs compactos en grilla 4→2→1; hint «Los cambios se aplicarán solo a esta sección».
- **Archivos:** `ficha-empleado-edit-modal.component.html/css`, `ficha-empleado-presentacion.facade.ts` (`saveBlockHint`).
- **No tocado:** guardado, formularios hijos, estilos globales, SQL.

## 2026-05-24 - Ficha empleado: lectura secciones expediente (UX-03)

- **Cambio:** bloques editoriales con cabecera título + Editar + línea fina; labels uppercase secundarios; valores más legibles; vacíos/pendientes en tono suave; sin bandas `form-bg` por sección en tab lectura.
- **Archivos:** `ficha-empleado-detalle.css`, `ficha-empleado-expediente.css`, `ficha-empleado-responsive.css`, `ficha-empleado-presentacion.facade.ts` (`isMissingValue`).
- **No tocado:** estilos globales, guardado, servicios, SQL, modal edición.

## 2026-05-23 - Nómina mensual: estado sin duplicidad (shell + focus)

- **Cambio:** se elimina el bloque lateral «Estado del período»; el chip de estado queda solo en el topbar del shell; `payroll-focus__copy` muestra título y lead (sin chip duplicado).
- **Archivos:** `proceso-mensual-workspace.component.html`, `proceso-mensual-workspace.component.css`, `proceso-mensual-presentacion.facade.ts`.
- **No tocado:** estilos globales, `header.component`, motor, SQL.

## 2026-05-23 - Modal revisión nómina: sin tab Movimientos y recurrentes

- **Cambio:** el tabbar del modal pasa a 4 pestañas; movimientos/recurrentes se revisan en trabajadores / resumen ampliado; sin pill «Listo» cuando no hay conteo (solo punto de severidad).
- **Archivos:** `proceso-mensual-grid.config.ts`, `proceso-mensual-detalle-modal.component.html`, `proceso-mensual-detalle-modal.rules.ts`, `payroll-operational-tabs.css`, reglas de incidencias/navegación y facade.
- **No tocado:** estilos globales, motor, SQL.

## 2026-05-23 - Nómina mensual: detalle situación sin enlace «Ver lista completa»

- **Cambio:** se quita el enlace suelto bajo el lead en vista «Todos»; el filtro «Pendientes» del segment nav cubre el mismo acceso.
- **Archivos:** `proceso-mensual-workspace.component.html`, `proceso-mensual-workspace.component.css`.
- **No tocado:** estilos globales, lógica de situación/alertas.

## 2026-05-19 - Preguntor operativo (asistente NVIDIA vía Edge Function)

- **Cambio:** pantalla `/preguntor` con textarea, botón Preguntar y bloque de respuesta; CSS local compacto; sin chat ni reasoning visible.
- **Archivos:** `features/asistente-preguntor/`, `pages/preguntor.page.ts`, `core/services/asistente-preguntor.service.ts`, `app.routes.ts`, `shell-navigation.config.ts`, `supabase/functions/erp-asistente-preguntor/`.
- **No tocado:** estilos globales, `angular.json`, motor, SQL productivo.

## 2026-05-23 - Ficha empleado: expediente en tabbar

- **Cambio:** navegación del expediente como tabbar horizontal (`role="tablist"`) sobre el contenido; panel diagnóstico a la izquierda; sin columna rail vertical.
- **Archivos:** `ficha-empleado-container.html`, `ficha-empleado-expediente.css`, `ficha-empleado-responsive.css`, `ficha-empleado-container.spec.ts`.

## 2026-05-22 - Listado empleados: columna Acción solo menú ⋮

- **Cambio:** celda con icono de tres puntos; popover con «Ver ficha» o «Continuar alta» (misma ruta que antes) y «Desactivar»; columna más estrecha.
- **Archivos:** `tabla-empleados.ts`, `tabla-empleados.html`, `tabla-empleados.css`, `tabla-empleados.spec.ts`.

## 2026-05-22 - Listado empleados: columna Acción mismo estilo que el resto

- **Cambio:** CTA y menú ⋮ sin caja/borde; tipografía 0.78rem como el cuerpo de la grilla; alineación izquierda; celda sticky sin sombra lateral.
- **Archivos:** `tabla-empleados.ts`, `tabla-empleados.css`.

## 2026-05-22 - Listado empleados: menú Acciones (popover)

- **Cambio:** menú contextual con `position: fixed` y `z-index: 120` (fuera del scroll de la grilla); botón ⋮ alineado al estilo del CTA de fila; cierre al desplazar la tabla.
- **Archivos:** `tabla-empleados.ts`, `tabla-empleados.html`, `tabla-empleados.css`.

## 2026-05-22 - Listado empleados: columna Acciones visible

- **Cambio:** se revierten overrides que aplastaban la tabla (`table-layout: fixed` + `min-width: 100%`); columna Acciones con ancho real, scroll horizontal y celda fija a la derecha.
- **Archivos:** `tabla-empleados.css`.

## 2026-05-22 - Listado empleados: tabla a ancho y alto completo

- **Cambio:** la grilla ocupa el 100% del área del shell (flex en outlet, contenedor y `data-grid`); scroll interno en el cuerpo de la tabla.
- **Archivos:** `layout-shell.component.ts`, `listado-empleados-container.css`, `tabla-empleados.css`.
- **No tocado:** estilos globales, lógica de datos.

## 2026-05-22 - Shell ERP: alineación sidebar y header

- **Cambio:** franja superior unificada a 52px (marca sidebar = altura header); ancho y offset del main desde `shell-navigation.config`; padding horizontal 16px compartido.
- **Archivos:** `shell-navigation.config.ts`, `sidebar.component.ts`, `header.component.ts`, `layout-shell.component.ts`.
- **No tocado:** estilos globales, `angular.json`.

## 2026-05-22 - Ficha empleado: menos padding en expediente

- **Cambio:** reducción ligera de padding/gap en rail del expediente, ítems de navegación y panel principal (sin cambiar estructura ni estilo tab).
- **Archivos:** `ficha-empleado-responsive.css`, `ficha-empleado-expediente.css`, `ficha-empleado-detalle.css`.
- **No tocado:** HTML, TS, globales, angular.json.

## 2026-05-22 - Componente `app-workspace-loading`

- **Cambio:** overlay de carga reutilizable (fondo blanco sólido, panel y spinner algo mayores); ficha usa `<app-workspace-loading message="Cargando ficha..." [fill]="true" />`.
- **Archivos:** `workspace-loading.component.ts`, `ficha-empleado-container.html`.

## 2026-05-22 - Ficha empleado: full workspace UX

- **Cambio:** expediente sin card exterior (`employee-record-shell` plano); bloques editoriales con separador inferior; header franja; rail con borde derecho.
- **Archivos:** `ficha-empleado-container.css`, `ficha-empleado-expediente.css`, `ficha-empleado-detalle.css`, `ficha-empleado-responsive.css`.
- **Doc:** `emp-ficha-expediente-fullworkspace-ux-02.md`.
- **No tocado:** HTML, TS lógica, globales, angular.json.

## 2026-05-22 - Ficha empleado: CSS budget (split styleUrls)

- **Cambio:** `ficha-empleado-container.css` partido en `container`, `expediente`, `detalle`, `responsive` para cumplir `anyComponentStyle` 24 kB por hoja; diseño expediente NOIA sin cambios.
- **Archivos:** `ficha-empleado-container.ts`, `ficha-empleado-*.css` (4 hojas).
- **Doc:** `emp-ficha-expediente-css-budget-01.md`.
- **No tocado:** `angular.json`, estilos globales, HTML, reglas, servicios.

## 2026-05-19 - Ficha empleado: edición bloque base y obligatorios

- **Cambio:** al editar «Información personal y contacto» se muestran email y teléfono (`visibleBlocks` incluye `contacto`); asterisco sustituido por `app-empleado-field-required` (icono rojo + tooltip, patrón `field-help-tip` con `mode="required"`).
- **Archivos:** `ficha-empleado-container.ts`, `empleado-field-required.*`, `field-help-tip.component.ts`, secciones `datos-personales`, `contacto`, `contrato`, `prevision-salud`, `perfil-laboral`, `bancario`, `form-empleado-shared.css`.
- **Doc:** `docs/codex/modulos/empleados/ficha-empleado-inline-edicion.md`.
- **No tocado:** SQL, motor, estilos globales, `angular.json`.

## 2026-05-22 - Creación avanzada: selector de año del calendario

- **Cambio:** `app-calendar-input` sin `max` ya no ofrece `añoActual + 20` (2046) ni lista años descendentes; fechas de contrato y perfil laboral pasan `[max]="today"` (y `min` en término/vigencia fin). Pegado ISO `YYYY-MM-DD` en el input no corrompe la máscara.
- **Archivos:** `calendar-input.component.ts`, `calendar-input-years.util.ts`, `contrato.*`, `perfil-laboral.*`.
- **No tocado:** SQL, estilos globales, `buildTodayValue` del formulario.

## 2026-05-19 - Nómina mensual: preview persistente «Qué falta ahora»

- **Cambio:** checklist de revisión del período visible en sidebar y tab Trabajadores antes de generar nómina (métricas, ejes contrato, pendientes, CTAs); regresión grilla pre-borrador alineada a `nominaMasivaFilas`.
- **Archivos:** `proceso-mensual-revision-periodo-preview.*`, `proceso-mensual-revision-periodo-preview.rules.ts`, `proceso-mensual-masivo-layout.rules.ts`, `proceso-mensual-presentacion.facade.ts`, `proceso-mensual-workspace.component.*`, `proceso-mensual-revision-trabajadores.component.*`.
- **Doc:** `docs/codex/modulos/nomina-mensual/nom-periodo-preview-persist-01.md`.
- **No tocado:** SQL, motor, estilos globales, `angular.json`.

## 2026-05-22 - Nómina mensual: rail Revisión sin parámetros listos

- **Cambio:** si parámetros están listos/revisados, el CTA principal del rail deja de ser «Revisar parámetros» y muestra el movimiento más crítico del período (etiqueta + bajada); pendientes secundarios omiten enlaces a parámetros.
- **Archivos:** `proceso-mensual-correccion.rules.ts`, `proceso-mensual-flow-nav.rules.ts`, `proceso-mensual-informacion-periodo.rules.ts`, `proceso-mensual-incidencias-periodo.rules.ts`, `proceso-mensual-presentacion.facade.ts`, `proceso-mensual-workspace.component.html`, `proceso-mensual-container.css`.

## 2026-05-22 - Nómina mensual: botones de acción en detalle

- **Cambio:** columna Acción con botón compacto (icono Lucide + etiqueta + `title`); regla `resolveDetalleMensualAccionUi`.
- **Archivos:** `proceso-mensual-detalle-mensual.rules.ts`, `proceso-mensual-workspace.component.*`.

## 2026-05-22 - Nómina mensual: colapsables Situación (patrón bitácora)

- **Cambio:** secciones con chevron y bajada; **Críticos** abierto por defecto; **Por revisar** colapsado; DataGrid integrado al panel (sin caja anidada).
- **Archivos:** `proceso-mensual-workspace.component.html`, `proceso-mensual-workspace.component.css`.

## 2026-05-21 - Nómina mensual: detalle Situación con secciones colapsables

- **Cambio:** pestaña «Todos» renombrada a **Situación**; incidencias en `<details>` (Críticos / Por revisar); sin movimientos en esa vista (solo en Trabajadores).
- **Archivos:** `proceso-mensual-workspace.component.*`, `proceso-mensual-detalle-mensual.rules.ts`, `proceso-mensual-presentacion.facade.ts`.
- **No tocado:** SQL, motor, estilos globales.

## 2026-05-19 - Nómina mensual: CTAs vivos y resumen solo post-generación

- **Cambio:** «Ver en resumen» y «Resumen ampliado» solo con `baseGenerada`; rail/empty sin modal resumen vacío; overlay verificación con Cerrar + secundaria separada; pestaña resumen con incidencias completas y secciones borrador/trazabilidad.
- **Archivos:** `proceso-mensual-flow-nav.rules.ts`, `proceso-mensual-detalle-modal.rules.ts`, `proceso-mensual-presentacion.facade.ts`, `proceso-mensual-informacion-modal.*`, `proceso-mensual-revision-trabajadores.component.html`, `proceso-mensual-workspace.component.html`.
- **No tocado:** SQL, motor, estilos globales.

## 2026-05-19 - Nómina mensual: verificar período — overlay grande

- **Cambio:** tras «Verificar período» se usa overlay operativo ~1320px con franja de conteos (críticos / advertencias / fichas) y tabla scrollable con **todos** los trabajadores pendientes; sin MessageBox ni tope de 8 nombres.
- **Archivos:** `proceso-mensual-informacion-modal.*`, `proceso-mensual-informacion-periodo.rules.ts`, `proceso-mensual-container.vm.ts`.
- **No tocado:** estilos globales, SQL, motor.

## 2026-05-19 - Nómina mensual: verificar período — trabajadores accionables

- **Cambio:** detalle RRHH por trabajador, «Ir a corregir», merge con bloqueos críticos; revisión por trabajador con mismo detalle en incidencias.
- **Archivos:** `proceso-mensual-trabajadores-prevalidacion.rules.ts`, `proceso-mensual-presentacion.facade.ts`.
- **Doc:** `docs/codex/modulos/nomina-mensual/verificar-periodo-trabajadores-pendientes.md`.
- **No tocado:** SQL, motor de cálculo productivo, estilos globales.

## 2026-05-21 - NOMENCLATURA-ES-CAMELCASE-01

- **Cambio:** normalizacion de nombres internos en ficha empleado (faltantes, claveBloque, porcentajeAvance, puedeValidarRemuneraciones, tipos *FichaEmpleado) sin tocar contratos SQL/Supabase, rutas, selectores ni clases CSS.
- **Flujo:** la accion del panel no abre edicion si RRHH cancela descartar cambios sin guardar al cambiar a Pago.
- **Higiene:** .angular-dev-server*.log queda fuera del control de version.
- **Documento:** docs/codex/diseno/nomenclatura-es-camelcase-01.md.
- **Nota:** las menciones previas de estilos globales pertenecen a la fase UI anterior; esta fase no modifica CSS.

## 2026-05-21 - Ficha empleado: panel estado integrado (VM único)

- **Cambio:** `buildFichaEstadoPanelVm` alimenta panel y chip shell; avance en 5 bloques operativos alineado con %; CTA único en panel; sin duplicar aptitud/bloques en cabecera ni rail review oculto.
- **Archivos:** `ficha-empleado-presentacion.rules.ts`, `ficha-empleado-container.*`, `ficha-empleado-estado-panel.md`.
- **No tocado:** SQL, motor, estilos globales, `header.component`.

## 2026-05-21 - Ficha empleado: apilamiento y overflow en expediente

- **Cambio:** `z-index` en columnas layout (status/rail/main); `overflow: visible` en cards y listas editoriales; scroll en `employee-record-main`; bloque en edición y selects abiertos por encima de vecinos; panel estado primero en DOM.
- **Archivos:** `ficha-empleado-container.html`, `ficha-empleado-container.css`.
- **No tocado:** estilos globales, shell, componentes shared.

## 2026-05-21 - Ficha empleado: bloque avance «Estado de la ficha»

- **Cambio:** columna izquierda con título + bloques completos; porcentaje alineado al centro de ese bloque; barra a ancho completo debajo; `role="progressbar"` accesible.
- **Archivos:** `ficha-empleado-container.html`, `ficha-empleado-container.css`.
- **No tocado:** estilos globales, shell, persistencia.

## 2026-05-21 - Ficha empleado: visor de estado solo en topbar shell

- **Cambio:** chip «En proceso» / estado operativo único en la topbar del shell; eliminados badge del encabezado de ficha y chip del panel «Estado de la ficha».
- **Archivos:** `ficha-empleado-container.html`, `ficha-empleado-container.ts`, `ficha-empleado-container.spec.ts`.
- **No tocado:** `header.component`, estilos globales, persistencia.

## 2026-05-21 - Ficha empleado: ancho completo como listado

- **Cambio:** el expediente de ficha deja el tope `1480px` centrado y usa `width: 100%` en `:host`, página y `employee-record-shell`, alineado al listado de empleados.
- **Archivos:** `ficha-empleado-container.css`.
- **No tocado:** lógica, HTML, estilos globales.

## 2026-05-21 - Ficha empleado: edición sin títulos duplicados

- **Cambio:** en edición, barra Guardar/Cancelar sin `h3` del bloque; intro del tab sin `h2`; cabeceras internas del seccional ocultas cuando `editVisibleBlocks` tiene una sola subsección.
- **Archivos:** `ficha-empleado-container.html`, `ficha-empleado-container.css`, `styles.css`.
- **No tocado:** lógica de guardado, templates de alta.

## 2026-05-21 - Ficha empleado: edición integrada en card

- **Cambio:** lectura y edición comparten el mismo `detail-block--editorial` (card con header gris); Guardar/Cancelar en el header del bloque; `app-card` internos como subsecciones sin doble borde; sin anillo azul al editar.
- **Archivos:** `ficha-empleado-container.html`, `ficha-empleado-container.css`, `styles.css` (solo `app-ficha-empleado-container` / `inline-edit-shell--*`).
- **No tocado:** lógica de guardado, servicios, alta básica/avanzada.

## 2026-05-21 - Ficha empleado: expediente NOIA tres columnas

- **Cambio:** sustitución de tabs horizontales por rail «Expediente»; centro editorial; panel diagnóstico con motivo principal y una acción; shell sin CTA duplicado.
- **Archivos:** `ficha-empleado-container.*`, `ficha-empleado-presentacion.rules.ts`.
- **No tocado:** estilos globales, persistencia, motor, SQL.

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

- **2026-05-23** — Alta avanzada resumen: panel .alta-resumen-diagnostico-panel (CSS local form-empleado.css), pendientes alineados a ficha EMP-ALTA-FICHA-PARITY-01.

- **2026-05-23** — EMP-FICHA-UI-BASE-01: tokens --emp-* en empleado-expediente-tokens.css; layout en ficha-expediente.layout.css; panel diagnostico «Diagnostico operativo»; resumen alta con tokens. Sin globales.

## 2026-05-23 — EMP-PERFIL-LABORAL-FICHA-05

- **Modulo:** Empleados / ficha `/empleados/:id`, tab Laboral.
- **Cambio visual:** bloque «Condiciones especiales» con perfil detectado por periodo activo; edicion con `app-empleado-perfil-laboral` reutilizado; hint local `.employee-record-perfil-hint` en `ficha-empleado-detalle.css`.
- **Restricciones:** sin cards nuevas, sin estilos globales, sin textos RPC/BD visibles; tokens `--emp-*`.

## 2026-05-23 — EMP-PERFIL-LABORAL-FICHA-05-PARIDAD-INLINE

- **Correccion:** `app-empleado-perfil-laboral` con `inlineRecordLayout` y clase `perfil-layout-inline-record` para no heredar layout de wizard (cards/cabeceras) dentro del bloque editorial de ficha.
- **Archivos:** `perfil-laboral.css`, `perfil-laboral.ts`, `ficha-empleado-workspace.component.html`, `ficha-empleado-detalle.css`.

## 2026-05-23 — Ficha expediente correcciones visuales

- **Header:** `display: flex` en `.employee-record-header__identity` (responsive) para que iniciales no queden sobre el nombre.
- **Historial:** sin columna Usuario ni texto técnico `postgres`; intro duplicada oculta en tab Historial.
- **Grid editorial:** media queries no pisan `.detail-grid--editorial`.

## 2026-05-23 — Ficha tab Remuneración intro con CTA

- **Intro:** título «Jornada y remuneración» en cabecera del tab; botón «Revisar movimientos» alineado a la derecha en `.employee-record-block__intro--with-action` (sin franja `section-hd-actions` aparte).
- **Archivos:** `ficha-empleado-workspace.component.html`, `ficha-empleado-presentacion.facade.ts`, `ficha-empleado-expediente.css`, `ficha-empleado-responsive.css`.

## 2026-05-23 — Ficha expediente encapsulación CSS (chrome hijos)

- **Causa:** header, rail y panel diagnóstico son componentes hijos; los `styleUrls` del workspace/container no aplicaban a su plantilla (encapsulación Angular).
- **Corrección:** mismos CSS de ficha en `app-empleado-record-header`, `app-empleado-expediente-rail`, `app-empleado-diagnostico-panel`; `:host { display: contents }` en diagnóstico y rail para el grid `status | workspace`.
- **Container:** solo `ficha-empleado-container.css` (sin duplicar expediente/detalle/responsive).

## 2026-05-24 — Modal edición ficha sin doble título

- **Modal:** `ficha-edit-modal__body` sin padding; cabecera modal con `form-bg`; secciones con `inlineRecordLayout` y CSS local sin bordes de `app-card`.
- **Archivos:** `ficha-empleado-edit-form.component.html`, `ficha-empleado-edit-modal.component.css/ts`.

## 2026-05-24 — Ficha registro tab integrado (form-bg)

- **Lectura:** cabeceras de bloque e intro del tab con `background: var(--form-bg)` a ancho completo; sin borde en `ficha-registro-tab__cuerpo`; `employee-record-main` sin padding lateral cuando hay registro tab.
- **Archivos:** `empleado-expediente-tokens.css`, `ficha-empleado-expediente.css`, `ficha-empleado-responsive.css`.

## 2026-05-24 — EMP-FICHA-UX-REPLANTEO-01

- **Consulta:** `.ficha-registro-tab` + `__cuerpo` agrupa bloques editoriales por tab; Historial sin panel.
- **Edición:** modal `ficha-edit-modal` vía `FichaEmpleadoOverlaysPort`; formulario en `ficha-empleado-edit-form` (layout alta, sin inline en workspace).
- **CSS:** estilos modal en componente propio; poda `inline-edit-shell` en `ficha-empleado-detalle.css`.
- **Archivos:** workspace, overlays, facade, edit-form, edit-modal, expediente/responsive/detalle CSS.

## 2026-05-26 — Empresas CRUD + mutual por empresa

- **Nuevo módulo:** `/empresas` (listado DataGrid + ficha con secciones Identificación, Contacto, Ubicación, Mutual condicional). Nav en Administración.
- **BD:** columna `aplica_ley_16744` en `empresa`; campos mutual consolidados en la misma tabla (sin `empresa_ley_16744`).
- **Parámetros:** se retira sub-pestaña Ley 16.744; Mutuales renombrado a catálogo de referencia; enlace a Empresas desde Configuración cliente.
- **Nómina:** copy visible pasa a “Mutual empleador” / “Parámetros mutual”; motor respeta `aplica_ley_16744`.
- **Archivos:** `src/app/features/empresas/**`, migración `20260526120000_empresa_aplica_ley_16744.sql`, limpieza en parametros-generales y rules de nómina.

## 2026-05-23 — Contacto obligatorio (correo y teléfono)

- **Formulario:** `Validators.required` en `contacto.email` y `contacto.telefono`; asterisco y mensajes en `contacto.html` y bloques contacto de `datos-personales.html`.
- **Borrador / ficha / persistencia:** `validateBorradorAvanzadoFormMinimo`, reglas `personal.email-empty` y `personal.phone-empty` (error bloqueante), `assertPayloadIdentificacionValida`.
- **E2E:** `fillPaso0BorradorMinimo` rellena correo y teléfono.

## 2026-05-25 — Nómina mensual: advertencia Ley 16.744 empresa

- **Lógica (no UI):** se deja de emitir `LEY_16744_EMPRESA_INCOMPLETA` cuando la tasa básica de parámetros permite calcular; tasa adicional de `empresa` es opcional. Incidencias y resultado preliminar filtran el código obsoleto en snapshots previos.
- **Carga:** `proceso-mensual.service` mapea solo `empresa` (vigencia del período); sin fallback desde configuración cliente de parámetros.
- **Parámetros:** tab Configuración cliente deja de pedir mutual Ley 16.744; organismo y tasa adicional viven en `empresa`. Al guardar config cliente se envía `idOrganismoAdministradorLey16744: null`.
- **Archivos:** `proceso-mensual-motor.rules.ts`, `proceso-mensual-empresa-ley16744.rules.ts`, `proceso-mensual.service.ts`, `parametros-config-cliente-tab`, `parametros-workspace.orquestador.ts`, `parametros-completitud.rules.ts`.

## 2026-05-26 — Nómina mensual: pulido workspace sin cajas (todas las fases)

- **Sin bordes de caja:** franja operativa, bitácora, tab-summary, acta, detalle mensual y métricas usan fondos suaves y separadores finos en lugar de marcos.
- **Padding compacto:** ritmo 6–10px en sidebar, tabs, focus, acta y panel detalle; expediente a ancho completo sin doble marco.
- **Integración:** sidebar `--erp-surface-soft`, contenido `--erp-surface`; detalle mensual sin borde exterior; acta editorial sin card.
- **Archivos:** `proceso-mensual-container.css`, `proceso-mensual-workspace.component.css`, `payroll-detalle-mensual-panel.css`, `payroll-operational-tabs.css`.

## 2026-05-26 — Nómina mensual: acta solo tras verificar (sin vacío inicial)

- **Estado sin verificar:** no se muestra acta vacía ni banner focus duplicado; el workspace conserva franja operativa + expediente de trabajadores; acción principal solo en shell («Verificar y generar nómina»).
- **Tras verificar:** acta compacta con métricas/contexto/CTA; panel sin estirarse al alto del viewport (`flex: 0`, `max-width: 40rem`).
- **Sin modal** en camino feliz; modal reservado a errores, parámetros o listas largas.
- **Archivos:** `proceso-mensual-presentacion.facade.ts`, `proceso-mensual-workspace.component.*`, specs container.

## 2026-05-26 — Nómina mensual: verificar y generar unificados en acta

- **Un CTA:** «Verificar y generar nómina» en shell y acta; tras verificación en verde encadena generación sin modal «Período listo para generar».
- **Acta:** resumen Críticos/Advertencias/Fichas, contexto período/aptos/movimientos/recurrentes, CTA secundario si aplica; panel compacto alineado arriba (sin hero vacío).
- **Sin banner** «Detalle mensual» encima del acta en preparación; modal informativo solo para errores, parámetros o listas largas.
- **Reglas:** `informacionDebeAbrirModalEnPreparacion`, `puedeEncadenarGeneracionTrasVerificacion`, `ejecutarPreparacionPrincipal` en facade.
- **Archivos:** `proceso-mensual-acta-preparacion.rules.ts`, `proceso-mensual-workspace.component.*`, `proceso-mensual-presentacion.facade.ts`, `proceso-mensual-estado-operativo.rules.ts`.

## 2026-05-27 — Nómina mensual: acta con pendientes integrados

- **Acta preparación:** bloque «Qué corregir» inline con título, detalle y acción por ítem (p. ej. parámetros UF); sustituye el chip genérico «Revisar N alertas» cuando hay secciones de verificación.
- **Copy:** se oculta el mensaje genérico duplicado si ya hay pendientes detallados; CTA principal sigue siendo la corrección recomendada.
- **Reglas:** `buildPendientesActaPreparacion`, `ActaPreparacionPendienteVm`, `ejecutarPendienteActa` en facade.
- **Archivos:** `proceso-mensual-acta-preparacion.rules.ts`, `proceso-mensual-workspace.component.*`, `proceso-mensual-presentacion.facade.ts`.

## 2026-05-26 — Nómina mensual: acta central en preparación (A+D)

- **Preparación sin borrador:** el workspace deja focus/empty hero y muestra acta central (`payroll-acta-preparacion`) con etapa activa, descripción, preview «N trabajador(es) listo(s)», enlace a alertas y CTA principal visible (`payroll-modal-primary`).
- **Sidebar:** en modo preparación solo bitácora; franja operativa oculta para evitar duplicidad con el acta.
- **Reglas:** `proceso-mensual-acta-preparacion.rules.ts`; facade expone `mostrarActaPreparacionCentral` y `actaPreparacionCentral`.
- **Archivos:** `proceso-mensual-workspace.component.*`, `proceso-mensual-presentacion.facade.ts`, rules + spec acta.

## 2026-05-26 — Nómina mensual: compactación Detalle mensual

- **Pills superiores:** filtros Situación/Trabajadores/Liquidaciones/Pendientes más bajos (`min-height` 26px, padding reducido); head del panel con menos aire.
- **Tab summary:** en Detalle mensual sin bloque de métricas (`payroll-tab-summary__metrics`); título y descripción compactos.
- **Trabajadores:** detalle con tabs underline compactos integrados en cabecera (sin bloques segmentados ni dobles bordes); buscador del expediente a ancho completo, icono lupa + tooltip nativo, borde izquierdo separador y campo plano sin caja interna.
- **Parámetros (NOM-PARAMETROS-REFRESH-01):** click en tile Parámetros consulta async solo PG, merge sin resetear borrador; con base/cálculo ya generados el refresh no re-bloquea «Generar nómina»; modal solo verificación (cargador centrado; grupos con ✓/✗; copy RRHH breve; pie Abrir parámetros + Verificar período; cierre con X); congelación del CTA shell solo antes de borrador/cálculo; si el flujo avanza (p. ej. se genera borrador con modal abierto) el CTA superior deja de mostrar «Verificar período»; pie del modal con parámetros listos: «Verificar período» solo si el período aún no fue verificado en el flujo principal — si ya hay prevalidación o borrador, único CTA «Abrir parámetros»; al cerrar sin acción de flujo no hay re-sync de navegación; tile «Revisados» sí actualiza en vivo; consulta PG sin prevalidación no escribe `resultado` ni diagnóstico (slice `consultaParametrosPeriodo`); rehidrata diagnósticos solo-parámetros como slice; retorno `/parametros` refresca en silencio.
- **Grillas Nómina mensual:** `toolbarLayout="operativa"` en DataGrid — barra superior compacta (Página · input · de N · Registros por página · navegación primera/anterior/siguiente/última); sin pie duplicado; tokens `--erp-*`; aplicado en Trabajadores, Situación, Liquidaciones, Pendientes e Historial.
- **Situación:** lead sin caja con borde; disclosures y body con menos padding/gap.
- **Archivos:** `payroll-segment-nav.css`, `payroll-detalle-mensual-panel.css`, `proceso-mensual-workspace.component.css`, `proceso-mensual-revision-trabajadores.*`, `proceso-mensual-workspace-presentacion.rules.ts`, `proceso-mensual-presentacion.facade.ts`.

## 2026-05-23 — Alta avanzada: estado interno y limpieza BD

- **UI:** en paso contrato con `grillaAvanzada`, se oculta el select «Estado de ficha inicial»; el bloque pasa a «Centro de costo y cargo». El motor sigue usando `en_proceso` / `borrador` en mappers (no editable por RRHH).
- **Scripts:** `scripts/limpiar-empleados-bd.mjs` (`--dry-run` / `--confirm`); lógica compartida en `scripts/lib/empleados-cleanup.mjs`; seed con `--purge-only`.
- **Fixtures:** nombres QA sin dígitos en `auditoria-empleados-fixtures.mjs`, `seed-empleados-prueba-errores.mjs`, `empleados-nomina-error-fixtures.spec.ts`.
- **Archivos:** `contrato.html`; no estilos globales ni SQL.

## 2026-05-27 - Parametros: restaurar CCAF y mutual en configuracion cliente

- **Cambio:** Configuracion cliente vuelve a mostrar CCAF, Mutual de Seguridad y Porcentaje Ley 16.744 en el mismo bloque operativo.
- **Guardado:** se conserva `idOrganismoAdministradorLey16744` al guardar configuracion cliente y al actualizar desde oficiales; ya no se fuerza a `null`.
- **Completitud:** la mutual seleccionada vuelve a contar como dato requerido cuando existe catalogo de organismos Ley 16.744.
- **Archivos:** `parametros-config-cliente-tab.component.ts`, `parametros-workspace.orquestador.ts`, `parametros-presentacion.facade.ts`, `parametros-completitud.rules.ts`.
- **No tocado:** SQL, carga Python, motor de nomina ni estilos globales.

## 2026-05-27 - Parámetros: consola por áreas para cierre mensual

- **Estructura:** 9 tabs principales se agrupan en 4 áreas: Cierre del período, Configuración cliente, Datos oficiales, Catálogos y vigencias.
- **Cierre:** nueva vista operativa con estado mensual, completitud, pendiente principal, impacto, acción siguiente y resumen por grupo.
- **Navegación:** subtabs solo dentro de Datos oficiales y Catálogos; formularios, grillas, servicios y guardado se mantienen.
- **Visual:** un marco principal, tabs sobrias, fondos blanco/#f8fafc y foco #2563eb; sin colores nuevos.
- **Archivos:** presenter/modelos de tabs, orquestador, panel de tabs, banda de periodo y CSS local de Parametros.

## 2026-05-27 - Parámetros: tablas cliente y reforma como observación

- **Navegación:** Catálogos necesarios conserva Salud, AFP y CCAF/mutual; Reforma pasa a Observación normativa.
- **Tablas:** se mantienen AFP, Salud/ISAPRE, CCAF/mutual, cargas, impuesto y reforma; se ocultan APV instituciones, APV formas y trabajos pesados.
- **Reforma:** queda como información de proyección/gradualidad futura, mostrando solo **Gradualidad** (sin subtabs).
- **Visual:** se retiran bordes de color en alertas, grupos completos y tabs activas; quedan bordes neutros.
- **No tocado:** motor de nómina, SQL, Python, servicios ni persistencia.

## 2026-05-27 — Nómina verificar: texto prevalidación en acta (fix SANNA engañoso)

- **Bug:** `textosDetalleParametrosDesde` leía `bloqueo.mensaje` (inexistente); no llegaban pendientes reales de `bloqueo.texto` y el acta quedaba solo con copy humanizado (a menudo SANNA).
- **Acta:** textos crudos solo desde prevalidación PARAMETROS + detalle de grupos; sin incidencias/secciones ya humanizadas.
- **Parser:** `extraerCamposOficialesPendientes` también entiende mensajes RRHH («UF mensual… en cero»).

## 2026-05-27 — Parámetros/Nómina: UF en cero y pendientes correctos en acta

- **Completitud PG:** valores numéricos oficiales `<= 0` cuentan como pendientes (`Dato oficial en cero: uf.`); el detalle del período concatena todos los pendientes, no solo el primero.
- **Grupos mínimos nómina:** `mensuales_uf_utm_sueldo` trata UF/UTM/sueldo en cero como inválidos y detalla campos en `detalle` del grupo.
- **Acta:** cada campo con título RRHH (p. ej. «UF mensual») y mensaje distinto si falta o está en cero; se ocultan ítems genéricos «Parámetros del período» cuando hay detalle por campo.
- **Archivos:** `parametros-completitud.rules.ts`, `proceso-mensual.service.ts`, `proceso-mensual-parametros-minimos.rules.ts`, `proceso-mensual-copy-limpio.rules.ts`, `proceso-mensual-acta-preparacion.rules.ts` (+ specs).

## 2026-05-27 — Nómina mensual: acta parámetros (pendientes, shell, dos fuentes)

- **Pendientes:** el acta lista varios ítems desde `parametrosGrupos` (FALTANTE/PARCIAL) y todos los «Falta dato oficial» detectados en textos de completitud; métricas alineadas con `mergeResumenVerificacionActa`.
- **Shell:** se oculta la CTA duplicada «Revisar parámetros» cuando el acta ya ofrece «Abrir parámetros» (`shellDebeOcultarCtaParametros`).
- **Estado:** `parametrosListos` en dashboard ya no asume `true` por tener snapshot sin prevalidación operativa.
- **Copy:** nota RRHH sobre configuración cliente vs datos oficiales (`.payroll-acta-preparacion__nota-fuentes`) hasta cargar oficiales.
- **Archivos:** `proceso-mensual-acta-preparacion.rules.ts`, `proceso-mensual-copy-limpio.rules.ts`, `proceso-mensual-presentacion.facade.ts`, `proceso-mensual-workspace.component.html|css` (+ specs).
- **No tocado:** `parametros-completitud.rules.ts`, SQL, motor, estilos globales.

## 2026-05-27 — Nómina mensual: acta preparación (orden, espacio, copy)

- **Layout:** contenedor `.payroll-acta-preparacion__shell` con padding `10px 12px`; orden fijo encabezado → métricas → qué corregir → contexto → acciones.
- **Visual:** sin fondo amarillo/rojo en todo el acta; tono solo en bloque «Qué corregir»; lista compacta (~40px); CTA única al pie (sin botón duplicado «Revisar parámetros» en ítems).
- **Copy:** `humanizarPendienteActa` / `humanizarFaltaDatoOficial` — «Falta dato oficial: sanna» → mensaje RRHH con SANNA y datos oficiales; sin prefijos repetidos.
- **Archivos:** `proceso-mensual-workspace.component.html|css`, `proceso-mensual-copy-limpio.rules.ts`, `proceso-mensual-acta-preparacion.rules.ts` (+ specs).
- **No tocado:** `parametros-completitud.rules.ts`, SQL, motor, estilos globales.

## 2026-05-27 — Nómina mensual: error inline y sidebar (espacio + scroll)

- **Error de ejecución:** el banner crudo (`.payroll-ledger-error`) pasa a franja operativa NOIA (`.payroll-ledger-error-focus`): título, bajada humanizada, puntos, CTA principal, cierre secundario y detalle técnico en `<details>`.
- **Focus preparación:** layout tipo `payroll-operativa-empty` (copy + CTA), chip del frame, `frame.info` en disclosure; densidad compacta en título/lead.
- **Sidebar:** scroll en `.payroll-workspace-sidebar__scroll` (el `aside` ya no recorta franja/bitácora); padding compacto en franja, título de bitácora y pasos del rail (~40px filas).
- **Archivos:** `proceso-mensual-container.html|css|ts`, `proceso-mensual-presentacion.facade.ts`, `proceso-mensual-workspace.component.html|css`.
- **No tocado:** SQL, motor, servicios, `angular.json`, `src/styles/*`.

## 2026-05-27 - Parámetros: período desde Shell, grillas al fondo y consistencia sin 1/1

- **Período:** se elimina el selector local de período en la banda de Parámetros; la vista queda sincronizada con `PeriodoActivoService.periodoYm` (selector global del shell).
- **Banda período:** se reordena la banda para alinear **título + acciones + chip** en una fila y mover el contexto a un cuerpo inferior (detalle operativo + referencia). Se elimina la repetición entre **Detalle** y **Pendiente principal**; la acción recomendada solo se muestra cuando aporta un texto distinto.
- **Acciones:** se elimina el botón duplicado **Refrescar datos** de la banda superior; se mantiene la acción de refresco dentro del panel de Cierre del período.
- **Grillas:** se ajustan overrides de `app-data-grid` para que el contenedor llegue al fondo real y el scroll quede dentro de la grilla, sin scroll horizontal global.
- **Consistencia:** meses sin base comparable (sin oficiales/config cliente) ya no se muestran como consistencia 1/1; se omite visualmente hasta que exista base comparable.
- **Ajuste:** se refuerza la cadena de altura flexible para que la grilla no colapse (título visible pero cuerpo sin alto) y se compacta tipografía/espaciado de la banda de período con jerarquía “sistema”.

## 2026-05-27 — Parámetros: impuesto único fiel al SII

- **Datos:** `tramo_impuesto` amplía `factor`/`rebaja` y se sincroniza desde `tabla_impuesto_unico` (scraper SII); sin redondeo 0,135→0,14.
- **UI:** una sola grilla «Tabla impuesto único (SII)»; factor decimal 3 cifras (sin `%`); montos Desde/Hasta/Rebaja en pesos.
- **Archivos:** `parametros-tramos-renta-tab`, `parametros-workspace-grids.presenter`, `parametros-generales.repository`, Python `v611_sql_merge_helpers` + `04_render_*`.
- **No tocado:** `angular.json`, `src/styles/*`, motor nómina.

## 2026-05-27 — MsgBox NOIA: decisiones y bloqueos de nómina

- **Overlay real:** confirmaciones de nómina dejan de proyectar `nom-acta-modal`; ahora usan `sections` con **Principal** y **Acción**.
- **Acciones:** reaperturas/descartes/forzados usan acción primaria `danger`; secundaria queda a la izquierda y primaria a la derecha por API `actions`.
- **Componente base:** `app-message-box` mejora foco inicial, `aria-describedby`, detalle visible junto a bloques y botones compactos con foco claro.
- **Reducción:** las confirmaciones de nómina quedan en 2 bloques compactos: **Principal** y **Acción**, con layout de dos ángulos en desktop.
- **Laboratorio:** `/remuneraciones/msgbox-lab` prioriza Uso, Decisión, Impacto y Acción principal; datos técnicos bajan a franja secundaria.
- **Cargando:** variante `loading` y ejemplos de carga quedan sin cambios visuales ni de comportamiento.
- **No tocado:** servicios, rutas, persistencia, motor de nómina, SQL ni estilos globales.
## 2026-05-27 - MsgBox NOIA: matriz por intención

- **Patrones:** se reemplaza el enfoque único de 2 bloques por builders oficiales: `feedback-simple`, `error-simple`, `decision-compacta`, `decision-guiada` y `diagnostico`; `loading` queda sin bloques.
- **Laboratorio:** `/remuneraciones/msgbox-lab` queda organizado como matriz: Referencia, Nómina y Otros flujos, con ejemplos de 0, 1, 2 y 3 bloques.
- **Producto:** nómina, novedades, liquidaciones, parámetros, data-grid y cierre de recurrentes usan secciones según intención; acciones destructivas usan `role="danger"` cuando aplica.
- **Componente base:** mantiene layout angular para 2 bloques y layout vertical compacto para 3; no se modifican estilos `.noia-msgbox--loading`.
- **Validación:** `tsc`, specs de reglas MsgBox, spec del componente y build development pasan.

## 2026-05-28 — Nómina mensual: pestaña Situación del período (revisión trabajadores)

- **Panel:** la pestaña «Situación del período» deja el listado tipo card y reutiliza la lista plana de «Atención» del detalle de trabajador (`__atencion-lista` / `__atencion-item`).
- **Secciones:** «Requiere atención» (bloqueos y observaciones) e «Información y cómo se calculó» (severidad info), con nota operativa y fondo suave solo en referencia.
- **Archivos:** `proceso-mensual-revision-trabajadores` (HTML/CSS/TS local).
- **No tocado:** estilos globales, `angular.json`, SQL, facade/store.

## 2026-05-28 — Nómina mensual: previsualización liquidación por trabajador

- **Resumen lateral:** botón «Ver resumen detallado» en pestaña Resumen del detalle de trabajador (como mock operativo).
- **Modal:** totales + desglose Haberes/Descuentos desde cálculo en memoria o conceptos del snapshot; bloque «Información y cómo se calculó» con trazas e incidencias informativas (sin copy técnico protagonista).
- **Situación del período:** solo pendientes de atención; la referencia informativa pasa al modal del trabajador.
- **Reglas:** `proceso-mensual-liquidacion-preview-trabajador.rules.ts` + facade `liquidacionPreviewTrabajadorSeleccionado`.
- **No tocado:** estilos globales, motor, liquidaciones productivas.

## 2026-05-28 — Parámetros: contraste controles readonly / disabled

- **Inputs:** `.param-input` readonly y disabled unifican fondo, borde y texto legible (`--prm-field-readonly-*`).
- **Checks/radios:** checkboxes y radios disabled dejan opacidad nativa; borde, fondo y marca visibles (`--prm-field-locked-*`).
- **Unidad y selects:** chip de unidad y `app-search-select` en consulta mantienen contraste sin opacidad global.
- **Gratificación:** «Tope legal» marcado como locked con aria/title RRHH.
- **Archivos:** `parametros-workspace-container.css`, `parametros-workspace-container.responsive.css`, `parametros-config-cliente-tab.component.ts`.
- **No tocado:** estilos globales, SQL, motor.

## 2026-05-28 — Parámetros: cierre del período sin refrescar duplicado

- **Pendiente principal:** se elimina el botón «Refrescar datos»; la acción contextual solo aparece cuando hay pendiente real.
- **Estado limpio:** con «Sin pendientes críticos» no se muestra botón de acción.
- **Archivos:** `parametros-workspace-tabs-panel.component.html`, `parametros-workspace.orquestador.ts`.
- **No tocado:** estilos globales, SQL, motor.

## 2026-05-28 — Parámetros: modal diferencias con valores oficiales

- **Comparación:** el aviso usa baseline resuelto (fila exacta, último oficial del mes o referencia visual), alineado con nómina mensual vía `obtenerUltimoHastaPeriodo`.
- **Modal:** se muestra al entrar o guardar cuando hay diferencias; deduplicación por huella en sesión. Detalle advierte desviación extrema y referencia de otro período cuando aplica.
- **Reconciliación:** chip y bloqueo nómina incluyen re-edición tras «Actualizar con oficiales».
- **Archivos:** `parametros-completitud.rules.ts`, `parametros-dialog.rules.ts`, `parametros-workspace.orquestador.ts`.
- **No tocado:** estilos globales, SQL, motor de nómina, `angular.json`.

## 2026-05-29 — Nómina mensual V2: pulido paso Empleados

- **Filtros:** barra principal con búsqueda global (nombre/RUT/cargo), Estado, Centro de costo y Jornada; Nombre/RUT/Cargo detrás de «Filtros avanzados».
- **KPIs:** tarjetas más compactas (`empleados-kpi-card`) sin quitar métricas; conteos derivados de la grilla.
- **Checklist:** filas más densas, conteos alineados a datos de grilla; clic filtra pendientes; sin botón duplicado de avance.
- **Botón superior:** «Validar empleados» orquesta bloqueos/advertencias vía MsgBox y avanza solo si corresponde.
- **Grilla:** jerarquía de columnas (Nombre/Estado/Datos bancarios protagonistas); secundarias más discretas.
- **Archivos:** `nomina-mensual-v2-container` (HTML/CSS/TS), `nomina-empleados-grid.presenter.ts`, `nomina-empleados-validacion.presenter.ts`.
- **No tocado:** estilos globales, SQL, servicios de negocio, otros pasos del flujo.

## 2026-05-29 — Nómina mensual V2: Empleados V8 (coherencia datos, copy, checklist)

- **Paginación:** `clavePersistenciaGrillaEmpleados` + reset a página 1 al cambiar filtro checklist; numeración coherente con total (124 demo).
- **Copy superior:** textos más cortos (bloqueo/advertencia/listo) según spec V8.
- **Checklist:** énfasis bloqueantes sin barra lateral (NOIA): borde/fondo suave + icono tintado; severidad con más aire; helper «El checklist ayuda a corregir…».
- **Resumen pendientes:** botón `empleados-resumen-pendientes-button` con más presencia (borde 700, hover neutro).
- **Archivos:** paso-empleados, presenter validación, container CSS.
- **No tocado:** lógica de negocio, SQL, estilos globales, orquestación del botón superior.

## 2026-05-29 — Nómina mensual V2: Empleados V7 (micro pulido cabecera/toolbar/checklist/grilla)

- **Cabecera/KPIs:** franja secundaria alineada abajo-derecha con más aire (`gap: 18px`, `align-self: end`); subtítulo acortado.
- **Copy superior:** textos bloqueo/advertencia/listo más cortos y accionables (grilla, checklist, resumen).
- **Toolbar grilla:** fila `__filters` + conteo a la derecha; chips 30px con cierre más claro; equilibrio sin filtros activos.
- **Checklist:** severidad con `__header`/`__severity` y más espacio respecto al título.
- **Grilla:** altura útil `560px` / scroll min `380px`, módulo `max-height` ampliado sin doble scroll.
- **Archivos:** container CSS, paso-empleados HTML, presenter validación, navegación.
- **No tocado:** lógica de negocio, SQL, estilos globales, data-grid compartido.

## 2026-05-29 — Nómina mensual V2: Empleados V6 (módulo grilla + modal pendientes)

- **Módulo grilla unificado:** wrapper `empleados-grid-module` integra toolbar (filtros avanzados, chip por severidad, conteo), búsqueda, paginación y tabla en una sola superficie; card interna sin borde duplicado.
- **Chips activos:** tonos por severidad (`bloqueante` / `advertencia` / `neutro`); conteo siempre visible («Mostrando X trabajadores» o «X de Y» con cualquier filtro).
- **Modal pendientes:** frase de estado en header; métricas con jerarquía (`resumen-pendientes-metricas`); secciones bloqueantes/advertencias con énfasis; footer `Cerrar` | `Reintentar validación` | `Ver pendientes en grilla` (primario).
- **Reintentar validación:** no cierra el modal antes; `ejecutarAccionPrincipal()` actualiza o cierra según resultado.
- **KPIs empleados:** fila lineal en header derecho; etiqueta + valor en línea; labels cortos legibles; detalle en `title` al pasar el mouse.
- **Checklist sidebar:** columna lateral alineada con la KPI «Documentación incompleta» (rejilla 4 cols compartida; sin `max-width: 320px`).
- **Grilla empleados:** altura fija `520px`, módulo con `max-height`; panel de filtros con scroll interno; área de tabla mín. `340px` estable al togglear filtros avanzados.
- **Archivos:** paso-empleados, modal resumen, container, `nomina-empleados-validacion.presenter.ts`, `nomina-mensual-v2-presentacion.util.ts`, CSS container.
- **No tocado:** estilos globales, SQL, data-grid compartido, otros pasos.

## 2026-05-29 — Nómina mensual V2: Empleados V5 (resumen pendientes modal)

- **Checklist:** severidad siempre visible en cada ítem (incl. documentación y observaciones); botón «Ver resumen de pendientes».
- **Modal estructurado:** bloqueantes, advertencias y correctos con contadores, descripción, conteo y «Ver en grilla» por ítem.
- **Orquestación:** «Validar empleados» abre el mismo modal de resumen si hay bloqueos/advertencias; avanza solo si está correcto.
- **Copy superior:** menciona grilla, checklist y resumen de pendientes según estado.
- **Archivos:** `nomina-empleados-validacion.presenter.ts`, `nomina-mensual-v2-empleados-resumen-pendientes`, overlays, paso-empleados, container, CSS.
- **No tocado:** estilos globales, SQL, data-grid compartido, otros pasos.

## 2026-05-29 — Nómina mensual V2: Empleados V4 (checklist, filtros, orquestador)

- **Checklist operativo:** severidad visible (`Correcto` / `Advertencia` / `Bloqueante`); clic filtra grilla; ítems de documentación/observaciones cuando aplican.
- **Chip de filtro:** etiqueta específica (ej. «Forma de pago pendiente») en toolbar de grilla.
- **Filtros:** búsqueda global por defecto; avanzados (estado, centro, jornada, contrato, bancarios, documentación, AFP/Salud) detrás de toggle en toolbar adjunto a la grilla.
- **Copy superior:** mensajes accionables según estado (bloqueo, advertencia, listo).
- **Ver pendientes:** MsgBox aplica primer filtro bloqueante/advertencia y enfoca la grilla.
- **Botón superior:** etiquetas dinámicas alineadas al paso (`Registrar novedades`, `Procesar cálculo`, etc.).
- **Archivos:** presenters empleados, paso-empleados, navegación, CSS checklist/toolbar.
- **No tocado:** estilos globales, SQL, servicios de negocio, data-grid compartido.

## 2026-05-29 — Nómina mensual V2: contrato datos paso Empleados (V3)

- **Resumen unificado:** `ResumenEmpleadosNomina` y `obtenerResumenEmpleadosNomina()` alimentan KPIs, checklist y validación con la misma fuente.
- **KPI documentación:** cuenta solo `pendiente`; observado queda como advertencia de validación, no en el KPI.
- **AFP/Salud:** campo propio en fila/mock; checklist y bloqueo separados de documentación.
- **Contrato:** mapeo `vencido` listo en badges de grilla.
- **MsgBox:** bloqueo/advertencia muestran lista de causas (`items`) derivada del resultado de validación.
- **Grilla vs período:** leyenda «Mostrando X de Y trabajadores» cuando hay filtro de checklist activo; KPIs/checklist siguen en total del período (124 demo).
- **Mock:** `generarFilasEmpleadosPeriodoMock()` con conteos alineados (118 contratos, 6 bancos, 4 docs).
- **Archivos:** presenters empleados, mock, paso-empleados, overlays, orquestador port, CSS caption.
- **No tocado:** estilos globales, SQL, servicios de negocio, otros pasos.

## 2026-05-29 — Nómina mensual V2: paso Empleados V9 (coherencia Personal)

- **Fuente única:** grilla, KPIs, checklist, modal y validación cargan desde `EmpleadosService.listar()` filtrado por `PeriodoActivoService.periodoYm()`.
- **Mapper:** `nomina-empleados-personal.mapper.ts` convierte `EmpleadoListado` → `FilaEmpleadoNomina` con fallbacks explícitos (`Sin asignar`, `Sin jornada`, `Pendiente`).
- **Campo documentación:** `documentacion` propio en fila; KPI/checklist/filtros usan `documentacion !== 'completa'`.
- **Demo aislado:** `USAR_DATOS_DEMO_EMPLEADOS_NOMINA = false` en mock; datos demo solo si flag explícito.
- **Servicio:** `NominaEmpleadosCargaService` centraliza carga y recarga de grilla.
- **V9.1 datos enriquecidos:** `NominaEmpleadosPersonalRepository` lee `vw_persona_factores` (jornada, AFP/Salud, retiro), `contrato_centro_costo` y `cuenta_bancaria` activa/principal.
- **Layout empleados:** grilla y checklist comparten la misma altura de fila (`align-items: stretch`); sin `gridHeight` fijo; scroll interno en ambas columnas.

## 2026-05-30 — Nómina mensual V2: paso Alcance (V7)

- **Flujo:** `Parámetros → Alcance → Empleados` (8 pasos en stepper).
- **Paso Alcance:** selección empresa completa, centro de costo, manual; contrato preparado como «Próximamente».
- **Estado compartido:** `resultadoAlcance` en orquestador; Empleados filtra por `idsTrabajadoresIncluidos`.
- **Validación:** botón «Validar alcance» + MsgBox bloqueo/advertencia antes de Empleados.
- **Copy Empleados:** título «Empleados incluidos en el alcance»; volver a Alcance.
- **Archivos:** modelos, mock steps, navegación, presenter alcance, paso-alcance, orquestador, container, overlays, CSS local.
- **No tocado:** backend/SQL, motor de cálculo, estilos globales.
- **Archivos:** mapper, repositorio personal, servicio carga, grid/validación presenters, paso-empleados.
- **No tocado:** estilos globales, SQL, motor de cálculo, UI del módulo Personal.


- **Orquestador:** `nomina-mensual-v2-container` queda delgado (~150 líneas TS); navegación, shell y paso activo.
- **Componentes por paso:** `nomina-mensual-v2-paso-parametros`, `nomina-mensual-v2-paso-empleados`, `nomina-mensual-v2-pasos-demostracion` (novedades→liquidaciones mock).
- **Transversales:** `nomina-mensual-v2-stepper`, `nomina-mensual-v2-overlays` (MsgBox), `NominaMensualV2OrquestadorPort`, `nomina-mensual-v2-navegacion.ts`.
- **CSS:** estilos de parámetros y empleados movidos a CSS local de cada componente hijo.
- **Patrón:** alineado a `proceso-mensual-container` (contenedor + `components/` + facade/port).
- **CSS (fix):** hijos con `ViewEncapsulation.None`; estilos centralizados en `nomina-mensual-v2-container.css` (el encapsulamiento emulated impedía que el CSS del padre llegara a los templates hijos).

## 2026-05-29 — Nómina mensual V2: V8 Visual Polish System

- **Sistema visual local:** `nomina-mensual-v2-visual-system.css` con tokens, icon badges (`.nomina-iconBadge`), chips (`.nomina-chip`), estados (`.nomina-state`), cards (`.nomina-card`) y panel lateral (`.nomina-sidePanel`).
- **Stepper:** 8 pasos en una fila (flex + scroll horizontal en pantallas estrechas); paso activo con fondo azul suave y barra inferior; clases `nomina-step--*`.
- **Encabezado:** chips de período/estado en Parámetros, Alcance y Empleados; subtítulos con formato `Mayo 2026 · …`.
- **Parámetros:** cards con icon badge; estados footer como chip; accesos rápidos con badge; prep-flow con estados en chip.
- **Alcance / Empleados:** cards de tipo de alcance, KPIs y chips de filtro alineados al mismo sistema.
- **Archivos:** `nomina-mensual-v2-visual-system.css`, `nomina-mensual-v2-container.{html,ts,css}`, stepper, paso-parametros, paso-alcance, paso-empleados, `nomina-mensual-v2-navegacion.ts`, `nomina-mensual-v2-presentacion.util.ts`, `peticiones-estilos.md`.
- **No tocado:** backend, SQL, estilos globales, `app.config.ts` (sin iconos nuevos).

## 2026-05-29 — Nómina mensual V2: cards parámetros (icono esquina superior derecha)

- **Mantenido de V8.1 (solo cards):** patrón `nomina-card--corner-icon` en cards de parámetros — título/subtítulo a la izquierda, icono arriba-derecha, chips debajo, estado y chevron abajo-derecha.
- **Revertido:** stepper en barra, prep-flow pill, panel derecho compacto, paleta V8.1, cards alcance corner-icon, overrides de densidad global.
- **Archivos:** `nomina-mensual-v2-visual-system.css`, `nomina-mensual-v2-container.css`, `nomina-mensual-v2-paso-parametros.component.html`, `nomina-mensual-v2-paso-alcance.component.html`, `peticiones-estilos.md`.

## 2026-05-29 — Nómina mensual V2: quitar flujo de preparación duplicado

- **Eliminado:** bloque «Flujo de preparación de parámetros» (stepper horizontal con iconos/flechas); la misma información ya está en las cards y el panel derecho.
- **Archivos:** `nomina-mensual-v2-paso-parametros.{html,ts}`, `peticiones-estilos.md`.

## 2026-05-30 — Nómina V2 parámetros: altura cards = resumen lateral

- **Fix (v2):** solo fila 1 de cards alineada al resumen; fila 2 compacta; `content-main` con `align-content: start` para evitar que la grilla herede la altura del sidebar.
- **Fix (v3 revertido):** ancho completo en «Estado actual» y «Resumen de parámetros» (card, bloques internos y fila de actualización al 100%).
- **Archivos:** `nomina-mensual-v2-container.css`, `peticiones-estilos.md`.

## 2026-05-30 — Shell header: CTA compacto con título centrado

- **Fix:** columna derecha del grid `auto` (no `1fr`); acciones `width: max-content`; `erp-shell-header__cta` a 28px / 12px / padding `0 10px` alineado a chips del header.
- **Archivos:** `header.component.ts`, `peticiones-estilos.md`.

## 2026-05-30 — Nómina mensual V2: V8.2 título centrado en shell

- **Cambio:** título y subtítulo del paso viven en el header ERP (`erp-shell-header__title`), centrados entre breadcrumb y acciones; sin chips junto al título (solo texto). Eliminada cabecera duplicada del cuerpo.
- **Archivos:** `shell-page-context.service.ts`, `header.component.ts`, `nomina-mensual-v2-container.{html,ts,css}`, `peticiones-estilos.md`.

## 2026-05-30 — Nómina mensual V2: page fill (contenido hasta el final)

- **Causa:** cadena flex rota — pasos con `display: block`, filas grid `auto` (solo altura del contenido) y `align-items: start` en la grilla impedían ocupar el alto del shell.
- **Fix (v2):** patrón `docs/codex/estilos/README.md`: `height/min-height: 0` + `flex: 1` en page/container; `.nmv2-page` como grid `auto auto minmax(0, 1fr)`; grillas de paso con `grid-template-rows: minmax(0, 1fr)` y columnas `align-self: stretch`; pasos activos `height: 100%`.
- **Archivos:** `nomina-mensual-v2-container.css`, `nomina-mensual-v2.page.ts`, `peticiones-estilos.md`.
## 2026-05-30 - Nomina mensual V2: integracion real pasos 4-8

- **Cambio:** `PasosDemostracion` deja de ser solo mock en Novedades, Calculo, Validacion, Aprobacion y Liquidaciones: lee entradas mensuales, snapshots, observaciones y liquidaciones desde servicios reales existentes. Las acciones principales de Calculo, Validacion, Aprobacion y Liquidaciones llaman al puente V1 seguro (`ProcesoMensualService`, `NominaCalculoSnapshotRepository`, `LiquidacionesOficialesService`) y registran trazabilidad local V2.
- **Limite:** no integra aun `nomina_preparacion` V11 en Angular; queda pendiente de fase backend completa para no mezclar escritura nueva con compatibilidad legacy.
- **Archivos:** `nomina-mensual-v2-flujo.service.ts`, `nomina-mensual-v2-pasos-demostracion.component.{ts,html}`, `peticiones-estilos.md`.

## 2026-05-30 - Nomina mensual V2: cabecera operativa tipo tabla

- **Cambio:** Cabecera MV2 redisenada como franja unica tipo tabla operativa: stepper en celdas compactas con label, estado y borde inferior activo; detalle del paso integrado a la derecha como celdas Responsable/Historial/Integridad/Fecha/Flujo.
- **Ajuste:** El detalle de snapshot registrado en Parametros muestra los valores congelados del snapshot al abrir la trazabilidad del paso, agrupados por grupo con clave, valor, vigencia y origen. La trazabilidad servidor recarga los parametros del snapshot para conservar el detalle tras refrescar la pagina.
- **Archivos:** `nomina-mensual-v2-stepper.component.{html,ts,css}`, `nomina-mensual-v2-stepper-traceability.component.{html,ts,css}`, `nomina-trazabilidad.mapper.{ts,spec.ts}`, `nomina-parametros-base.{models,mapper}.ts`, `nomina-parametros-base.service.ts`, `nomina-mensual-v2-paso-parametros.component.ts`, `nomina-mensual-v2-trazabilidad-modal.component.ts`.
- **No tocado:** servicios, rutas, SQL/BD, motor de calculo, persistencia ni contratos de inputs/outputs.

## 2026-05-30 - Nomina mensual V2: stepper y detalle unificados

- **Cambio:** `nmv2-page nomina-shell` queda sin separacion visual entre la cabecera de pasos y el detalle del paso; la cabecera conserva radios solo arriba y el contenido colapsa el borde superior para leerse como una superficie unica.
- **Archivos:** `nomina-mensual-v2-container.css`, `nomina-mensual-v2-stepper.component.css`, `peticiones-estilos.md`.

## 2026-05-30 - Nomina mensual V2: stepper compacto sin doble numeracion

- **Cambio:** celdas del stepper eliminan el texto `Paso N`; el badge circular queda como unico ordinal visible y el estado se mueve a la esquina superior derecha como indicador secundario.
- **Ajuste:** layout de cada paso pasa a dos columnas numero/texto, con padding reservado para evitar solapes entre titulo, accion e icono de estado.
- **Estado:** icono superior binario: reloj con fondo plomo para no listo y check verde para listo; el circulo izquierdo conserva siempre el numero del paso.
- **Archivos:** `nomina-mensual-v2-stepper.component.{html,css}`, `peticiones-estilos.md`.

## 2026-05-30 - Nomina mensual V2: modales de trazabilidad mas ERP

- **Cambio:** los modales de Responsable, Bitacora y Control dejan de mostrar informacion tecnica y pasan a copy operativo: responsable, registro, estado, movimientos y datos guardados.
- **Ajuste:** se retiran de la UI textos de huella, integridad tecnica y origen interno; parametros mantiene tabla de valores guardados con columna Fuente.
- **Archivos:** `nomina-mensual-v2-trazabilidad-modal.component.{ts,html,css}`, `peticiones-estilos.md`.

## 2026-05-30 - Nomina mensual V2: decisiones simples

- **Cambio:** decision modals de parametros y alcance usan mensajes breves: una decision, una frase de contexto y botones cortos.
- **Ajuste:** Preparar nomina muestra solo la base a guardar; diferencias usa Mantener base / Actualizar / Ver cambios.
- **Archivos:** `nomina-mensual-v2-overlays.component.{ts,html}`, `peticiones-estilos.md`.

## 2026-05-30 - Nomina mensual V2: datos guardados de parametros ERP

- **Cambio:** tabla de datos guardados mantiene los valores persistidos, pero renderiza grupo, parametro, vigencia y fuente con etiquetas operativas mediante switch de presentacion.
- **Ajuste:** claves como `uf`, `utm`, `tope_imponible_afp` y `parametros_base` se muestran como UF, UTM, Tope AFP y Base guardada.
- **Archivos:** `nomina-mensual-v2-trazabilidad-modal.component.{ts,html}`, `peticiones-estilos.md`.

## 2026-05-31 - Nomina mensual V2: modales trazabilidad sin resumen

- **Cambio:** modales de Responsable, Bitacora y Control eliminan la franja `nmv2-trace-modal__summary`; el contenido parte directo con el detalle, timeline o tabla operativa.
- **Ajuste:** Datos guardados de parametros traduce las claves camelCase del modelo de parametros generales y cubre todos los campos actuales de la columna Parametro.
- **Archivos:** `nomina-mensual-v2-trazabilidad-modal.component.{ts,html,css}`, `peticiones-estilos.md`.
