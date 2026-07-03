# Peticiones de estilos - bitácora vigente

> Bitácora cronológica inversa de cambios visuales/copy/UI del ERP. Entradas más recientes arriba.
>
> **Ventana viva**: solo se mantienen las entradas del mes en curso y el mes anterior. Cuando se rota, las entradas antiguas pasan a [`archivo/`](./archivo/).
>
> **Histórico rotado**:
> - [`archivo/peticiones-estilos-2026-05.md`](./archivo/peticiones-estilos-2026-05.md) — mayo 2026 y anteriores (288 entradas, rotadas el 2026-06-03 por DOCS-AUDIT-02 / L3).

---

## 2026-07-02 — F17 Rectificación diferencial (Admin + Generador)

- **Administrador:** acción fila «Crear rectificación» (nómina cerrada + gate); modal motivo + checklist trabajadores; MessageBox confirmación; reutiliza clases `adm-nom-modal__*`.
- **Generador:** subtítulo «Rectificación de [período] · Original cerrada»; panel compacto Original | Diferencia | Acumulado en paso Cálculo (`paso-calc__rect-*`).
- **Contraste:** `noia-ui-manual.md`, patrón modal nueva nómina, copy RRHH sin términos técnicos.

---

## 2026-07-02 — Generador Nómina V2: paso Cierre Ola 4–6 (F12/F14/F15/F16)

- **Paso Cierre:** checklist dividida (validación / aprobación / conciliación / liquidaciones);
  panel conciliación multi-tipo con montos; acciones «Aprobar nómina» y «Generar liquidaciones»;
  MessageBox confirmación aprobación; CSS local `paso-cierre__panel`, `paso-cierre__origenes`, `paso-cierre__acciones`.
- **Navegación:** estado `validada` permite acceder a Cierre (solo lectura + aprobar).
- **Contraste:** `noia-ui-manual.md`, patrón checklist existente en paso Cierre, copy RRHH sin términos RPC.

---

## 2026-07-02 — Generador Nómina V2: F13 validación con decisiones (NOM-ADMIN-OPS-F13 núcleo)

- **Paso Validación:** incidencias con estado de decisión (pendiente / resuelta / aceptada);
  críticas → «Marcar resuelta»; advertencias → justificación + «Aceptar advertencia».
- **CTA shell:** «Validar para cierre» abre confirmación (`MessageBox`) y transiciona a
  `validada` (ya no salta directo a `aprobada`; F14 pendiente).
- Copy operativo RRHH; sin IDs técnicos. Misma densidad `paso-val__`.

---

## 2026-07-02 — Administrador Nómina: F10/F11 creación multi-tipo (NOM-ADMIN-OPS-F10/F11 núcleo)

- **Modal «Nueva nómina»:** selector de **Tipo** (Mensual / Quincenal / Semanal / Extraordinaria)
  visible solo si el tenant tiene activos los feature gates Anexo B; sin gates, el tipo
  queda fijo en «Mensual» como antes.
- **Anticipos (quincenal/semanal):** campo **«Corte del anticipo»** con cortes del período
  desde plantillas activas; hint de error operativo si faltan plantillas.
- **Copy:** descripción breve por tipo bajo el selector; sin nombres técnicos de BD ni RPC.
- Misma densidad, prefijo `adm-nom-modal__` y patrón del wizard F04/F05 existente.

---

## 2026-07-02 — Generador Nómina V2: F08 movimientos ligados al catálogo (NOM-ADMIN-OPS-F08)

- **Modal «Agregar movimiento manual»:** el campo de texto libre «Tipo / Concepto»
  se reemplaza por un selector **«Concepto del catálogo»** (haberes y descuentos),
  filtrado por la categoría elegida y con la misma regla central de asignabilidad
  que Haberes/descuentos (`esConceptoAsignable`).
- **Ausencias e informativos:** campo fijo de solo lectura («Ausencia del período» /
  «Informativo del período»); el tipo operativo se fija solo.
- **Guardar:** deshabilitado hasta tener trabajador + concepto (o tipo operativo);
  errores de catálogo llegan con el motivo humano de la regla central.
- Sin cambio de paleta ni layout; mismo formulario y densidad del modal.

---

## 2026-07-02 — Generador Nómina V2: paso Movimientos escalable (BKL-02)

- **Grilla por trabajador en modo servidor:** paginación 25/página y filtros
  (Estado / Tipo de movimiento / Buscar) resueltos por RPC
  `listar_movimientos_trabajadores_nomina`; se eliminó la carga de dotación
  con techo `pageSize: 1000` (que además el RPC truncaba a 200 identidades).
- **Stats del header:** desde RPC `resumen_movimientos_nomina` (globales de la
  nómina, no de la página visible); el CTA «Cargar todos los pendientes» y el
  avance del paso usan esos totales.
- **Detalle expandible lazy:** los items del trabajador se hidratan al expandir
  la fila, con placeholder «Cargando movimientos del trabajador…»; sin cambio
  de layout ni paleta.
- **Modal manual:** el select de trabajadores se puebla al abrir (primera página
  server-side), no en la carga del paso.

---

## 2026-07-02 — Generador Nómina V2: F07b cierre dotación escalable (NOM-ADMIN-OPS-F07b)

- **Selección de universo filtrado (`app-data-grid`, opt-in `bulkSelectAllFiltered`):**
  al marcar toda la página en modo servidor aparece el enlace
  «Seleccionar los N trabajadores del filtro»; la barra masiva y la confirmación
  muestran el conteo total y aclaran que aplica a todos los resultados del filtro,
  con opción «Limitar a esta página». Sin cambio de paleta ni layout (reusa la
  barra masiva azul existente).
- **Paso Dotación:** «Excluir de la nómina» con alcance universo filtrado resuelve
  ids en servidor (`listar_ids_dotacion_nomina`), no solo la página visible.
- **Picker «Agregar trabajadores»:** filtro «Ya en nómina» ahora se resuelve en
  servidor (`p_solo_en_nomina`); antes la opción no filtraba.
- **Preview masivo:** ya no carga hasta 10.000 filas; usa incidencias + ids.
- **Pendiente (BKL-08):** E2E de escala 1000+ (queda para certificación).

---

## 2026-06-30 — Generador Nómina V2: F07 dotación escalable (NOM-ADMIN-OPS-F07)

- **Grilla dotación:** `app-data-grid` en modo servidor (50 filas/página); filtros
  y búsqueda delegados a RPC `listar_dotacion_nomina`.
- **Conteos:** franja de stats desde `resumen_dotacion_nomina` (sin cargar universo).
- **Avance:** `puedeAvanzarDotacionResumen` evalúa bloqueos con conteos agregados.
- **Picker “Agregar trabajadores”:** paginación servidor vía
  `listar_trabajadores_elegibles_nomina`; ya no carga `EmpleadosService.listar()`.
- **Data-grid compartido:** inputs `serverSide` + `totalRowCount`; output
  `serverQueryChange` (reutilizable en otros módulos).
- **Pendiente F07:** E2E 1000+ trabajadores; selección masiva por universo filtrado completo.

---

## 2026-06-30 — Generador Nómina V2: F06 parámetros por nómina (NOM-ADMIN-OPS-F06)

- **Lógica (sin cambio visual de layout):** paso Parámetros rehidrata desde la nómina
  cargada (`fechaInicio`/`fechaFin`/`periodo`), no desde el mes global del shell.
- **Snapshot:** `id_nomina_periodo` en cabecera; base de parámetros scoped por nómina.
- **Invalidación:** actualizar/reemplazar parámetros invalida cálculo vigente.
- **Advertencias:** rango parcial o cruce de meses → revisión en resumen (reglas puras).

---

## 2026-06-30 — Generador Nómina V2: drawer trazabilidad acciones (NOIA-NMV2-REPAIR-12)

- **Drawer:** acciones por evento (Bitácora / Responsable / Control); `aria-modal`;
  bloqueo de scroll de fondo al abrir.
- **Modal control:** fila de integridad con copy operativo (sin huella técnica).
- **Hint:** Ctrl+clic en paso del stepper abre bitácora del paso.

---

## 2026-06-30 — Generador Nómina V2: stepper advertencia y bitácora (NOIA-NMV2-REPAIR-11)

- **Stepper:** icono `triangle-alert` y clase `step-status--warning` cuando el cálculo
  dejó de ser vigente; tooltips con última acción o mensaje CAL-INV-05.
- **Acceso bitácora:** Ctrl+clic en paso con trazabilidad abre modal de historial.
- **Modal bitácora:** copy operativo («acciones registradas») sin «movimientos guardados».

---

## 2026-06-30 — Generador Nómina V2: trazabilidad drawer y bitácora (NOIA-NMV2-REPAIR-10)

- **Eventos locales:** parámetros al avanzar; dotación/movimientos reflejados en auditoría
  del stepper (`EMPLEADOS_VALIDADOS`, `NOVEDADES_REGISTRADAS`).
- **Drawer:** cierre con backdrop/Escape; empty state operativo; sin huella técnica visible.
- **Copy integridad:** «Registro en sesión» / «Confirmado en servidor» (sin jerga de verificación).

---

## 2026-06-30 — Generador Nómina V2: consistencia P2 flujos (NOIA-NMV2-REPAIR-09)

- **`esCalculoNoVigente`:** regla CAL-INV-05 compartida en Cálculo, Validación y Cierre.
- **`ORDEN_PASOS_NOMINA`:** fuente única en modelos; `NominaPeriodoService` deja de duplicar
  `ORDEN_PASOS_PAYROLL`.
- **Stepper:** estado `calculada` marca Cálculo como completado; cálculo invalidado → `warning`.
- **Cierre:** footer hint-only alineado a Validación/Cálculo (sin botón admin duplicado).

---

## 2026-06-30 — Generador Nómina V2: flujos unificados vía shell (NOIA-NMV2-REPAIR-08)

- **Avance centralizado:** pasos 2–6 ya no navegan por outputs bypass
  (`avanceSolicitado`, `aprobarSolicitado`, `volver*`); el CTA del shell usa
  `ejecutarAccionPrincipalPasoActual()` con confirmación de dotación, trazabilidad
  y persistencia de paso completado.
- **Cierre:** `avanzar()` abre el modal y devuelve hint de revisión (no limpia
  ayuda como éxito terminal); confirmación real sigue en el diálogo.
- **Reapertura:** tras reabrir desde cierre, navega a Validación para reaprobar.
- **Handoff crear nómina:** query params `?from=create&…` se consumen con
  `replaceUrl` para no re-aplicar en refresh.
- **Carga:** gate mientras `nominaCargaEstado === 'loading'`; CTA del shell
  refleja operaciones async (`confirmando`, `aplicando`, `calculando`, etc.).
- **Trazabilidad local:** eventos al confirmar dotación y avanzar movimientos.

---

## 2026-06-30 — Generador Nómina V2: reparación flujo e integridad (NOIA-NMV2-REPAIR-01)

- **Cierre:** el paso `closure` ya no se marca completado al abrir el modal ni al
  visitar el paso; solo tras confirmar cierre en el modal (`nominaCabeceraCambiada`).
- **Cabecera stale:** refresh de nómina tras calcular, cerrar o reabrir (`manejarNominaCabeceraCambiada`).
- **Handoff crear nómina:** serialización de query params vs rehidratación en container.
- **Estados vacíos:** pantalla dedicada si la nómina no existe o falla la carga.
- **Copy RRHH:** sin «snapshot», «versión» ni IDs técnicos en Validación/Cálculo/Cierre;
  breadcrumb `Remuneraciones → Administrador → paso`.
- **Paneles expandibles:** botón textual «Cerrar» sustituido por **×** en Dotación,
  Cálculo y Movimientos (detalle inline).
- **Snapshots:** `id_empresa` numérico al guardar preliminar; anulación vía `marcarInactivo`
  (RPC inexistente eliminada).

---

## 2026-06-30 — Nómina V2: limpieza alcance legacy y CSS dotación (NOIA-NMV2-REPAIR-03)

- Eliminados del orquestador `resultadoAlcance`, `alcanceValidado` y tipos del
  modal de resumen F3 (sin UI viva).
- Retirados servicios/presenters huérfanos: `nomina-empleados-carga`,
  `nomina-alcance-grid`, util de presentación checklist.
- ~400 líneas CSS muertas del layout empleados V1/V7 en container.
- Hint en pie de Dotación y Movimientos: avance vía shell (no duplicar CTA).

---

- **Trazabilidad:** eventos locales al calcular (`CALCULO_EJECUTADO`), validar
  (`PRENOMINA_VALIDADA`), retroceder (`SNAPSHOT_INVALIDADO`), cerrar
  (`PRENOMINA_APROBADA`) y reabrir (`SNAPSHOT_INVALIDADO` desde cierre).
- **Stepper:** avatar abre el drawer de trazabilidad completa del período.
- **Limpieza:** eliminados componentes huérfanos `stepper-traceability`,
  `empleados-resumen-pendientes` y ~590 líneas CSS muerto en container.

---

## 2026-06-30 — Grilla expandible: un solo hint en la primera fila (NOIA-CALC-EXPAND-02)

- Corregido bug en `app-data-grid` con chevron anclado en columna: el hint
  dismissible usaba el índice de columna en lugar del de fila y se repetía en
  todas las filas cuando la columna ancla era la primera (p. ej. Trabajador en
  paso Cálculo). Ahora solo el primer registro visible muestra el callout.

---

## 2026-06-16 — Modales y MessageBox: cierre con X, sin click fuera (NOIA-MODAL-CLOSE-01)

- `app-message-box`: inline `dismissible` muestra icono **X** (no texto «Cerrar»); `aria-label` conserva «Cerrar».
- Modales y overlays del ERP: botón textual «Cerrar» en pie o cabecera sustituido por **X** donde aplicaba; pie redundante eliminado si ya había X.
- Desactivado cerrar al hacer click en el backdrop (overlay) en administrador de nóminas, plantillas, generador V2, haberes/descuentos, novedades, movimientos variables y preview de liquidación.

---

## 2026-06-16 — Generador: stepper volver | pasos | usuario (NOIA-NMV2-STEPPER-LAYOUT-01)

- Cabecera del flujo en tres zonas: botón circular **Volver** a la izquierda,
  franja de pasos divididos al centro, avatar de usuario a la derecha.
- Los pasos ocupan el ancho disponible con divisores verticales; scroll horizontal
  solo en la franja central si hace falta.

## 2026-06-16 — Paso Cálculo: chevron inline + hint dismissible (NOIA-CALC-EXPAND-01)

- Grilla del paso Cálculo: chevron de expandir integrado en columna `Trabajador`
  (`expandAnchorColumnId`); se elimina la columna vacía "Detalle".
- Hint en el primer chevron ("Abre el desglose…") con CTA `Entendido`; persistencia
  en BD `usuario_preferencia_ui` vía `UsuarioPreferenciaUiService` (no localStorage).

## 2026-06-16 — Paso Cálculo: filtros trabajador y estado (NOIA-CALC-FILTROS-01)

- Grilla del paso Cálculo: filtros `Trabajador` (texto por nombre o RUT, tokens) y
  `Estado` (Calculado / Con advertencias / Con bloqueos). Reemplaza el filtro AFP
  previo. Persistencia local de grilla actualizada a `nomina-v2-calculo-grid-v2`.

## 2026-06-16 — Paso Cálculo: quitar avisos duplicados (NOIA-CALC-RESUMEN-02)

- Eliminado el `app-message-box` informativo de éxito ("Cálculo guardado…") en
  `nomina-mensual-v2-paso-calculo`: el resumen de cabecera ya muestra trabajadores
  calculados, haberes, descuentos y líquido; la versión queda en el pie.
- Retirada la franja `paso-calc__prevalid` con chips de dotación/listos/críticos
  cuando ya hay cálculo. Solo se muestra un aviso compacto de bloqueo si aún no
  hay resultado y la pre-validación impide calcular.

---

## 2026-06-15 — Preview + creación transaccional y bandeja simplificada (NOIA-ADM-NOM-F04-05-01, NOIA-ADM-NOM-BANDEJA-02, NOIA-ADM-NOM-RESUMEN-02)

Cierre de F04 + F05 con su tracción en UX del Administrador y el Generador V2.

- Wizard 2 pasos en "Nueva nómina": configuración (período/empresa/tipo) →
  vista previa (franja de totales, tabs Incluidos/Excluidos/Conflictos,
  `app-message-box` solo si hay bloqueantes). CTA primario único por paso
  ("Ver vista previa" → "Confirmar y abrir generador").
- Grilla del Administrador reordenada a 7 columnas operativas
  (`Período · Empresa · Estado · Siguiente acción · Trabajadores · Actualizada · Acciones`).
  Las incidencias críticas/advertencias pasan a chip inline dentro de
  "Siguiente acción"; el subtexto "Avance: X" duplicado se traslada al `title`
  de la fila.
- Modal resumen sin chip de tipo (siempre mensual en piloto), guardias
  fusionadas en una "Situación" única con tono `ok | pendiente | bloqueada`
  y CTA primario único "Continuar en el generador".
- Handoff al Generador V2: banner contextual sobrio bajo el stepper
  ("Nómina creada · N trabajadores en dotación inicial." o el equivalente
  reutilizada), con borde inferior fino y fondo apagado. Se descarta al
  primer cambio de paso.

Archivos: `admin-nominas-modal-nueva-nomina.*`,
`administrador-nominas-container.html/ts/css`,
`admin-nominas-modal-resumen-nomina.*`, `admin-nominas.presenter.ts`,
`utils/admin-nominas-presentacion.util.ts`, `nomina-mensual-v2-container.*`.

---

## 2026-06-15 — Historial administrativo en bandeja (NOIA-ADM-NOM-HISTORIAL-01)

Trazabilidad administrativa accesible desde cada nómina sin abrir el
Generador (alineado al roadmap §F17).

- Nueva acción en la fila (`adm-nom__row-actions`) **antes** de "Abrir
  generador": icono Lucide `history`, `aria-label`/`title` operativo
  "Ver historial administrativo de {empresa} {período}".
- Modal local `admin-nominas-modal-historial-nomina` basado en
  `app-message-box` (modo modal, eyebrow "Bitácora", título "Historial
  administrativo", contexto "{empresa} · {período}"). Timeline cronológica
  desc con acción humana, usuario resuelto y motivo (cuando existe). Empty
  state operativo y CTA único "Cerrar".
- Presenter `admin-nominas-auditoria.presenter.ts` mapea cada `accion` del
  enum BD a su etiqueta humana (`creada` → "Nómina creada", `reabierta` →
  "Nómina reabierta", etc.). Usuario actual resuelto vía
  `resolverUsuarioResponsableActual`; otros usuarios se etiquetan como
  "Usuario no informado" sin bloquear la fase.

Sin cambios globales. Reutiliza el patrón visual del modal de trazabilidad
del Generador V2 para mantener identidad NOIA.

---

## 2026-06-15 — Flujo crear nómina en Administrador (NOIA-ADM-NOM-CREAR-01)

Refactor del modal "Nueva nómina" y subtítulo del shell para reducir
duplicidad y ordenar el flujo:

- Un solo título (sin eyebrow redundante "Crear nómina").
- Copy operativo sin referencias a fases técnicas (F01).
- Orden: Período → Empresa (solo si hay varias) → Tipo fijo "Mensual".
- Resumen de confirmación antes del CTA ("Se creará la nómina mensual de…").
- CTA explícito: "Crear y abrir generador" (alinea con navegación post-creación).
- Período inicial sincronizado con `PeriodoActivoService` del shell.
- Grilla: columna Empresa sin ID interno visible.
- Subtítulo del shell: deja de repetir el conteo de la grilla; prioriza
  incidencias críticas y nóminas que requieren seguimiento.

Archivos: `admin-nominas-modal-nueva-nomina.*`, `administrador-nominas-container.*`.

---

## 2026-06-15 — Stepper marca paso OK al avanzar desde shell (NOM-FIX-STEPPER-OK-01)

El stepper (`nomina-workflow-header nmv2-stepper-card`) no mostraba el ícono
de listo al usar el CTA del shell. Causas:

1. `obtenerEstadoPaso` solo derivaba completitud desde `nomina.estado`, sin
   leer `maximoPasoCompletado` (persistido al avanzar).
2. Al avanzar con el shell, el paso terminal se completaba en BD pero el
   container no persistía explícitamente el paso ni refrescaba `nominaCargada`.

Cambios:

- `indiceUltimoPasoCompletado` combina estado + `maximoPasoCompletado`
  (con tope en `reabierta` para no revivir Cierre).
- `ejecutarAccionPrincipalPasoActual` y avance desde Parámetros llaman
  `marcarPasoCompletadoYRefrescarNomina` antes de navegar.

Archivos: `nomina-mensual-v2-navegacion.ts`, `nomina-mensual-v2-container.ts`,
spec de navegación.

---

## 2026-06-15 — Recálculo idempotente del Generador V2 (NOM-FIX-RECALCULO-01)

El CTA "Recalcular" del paso Cálculo dejaba de funcionar después del primer
cálculo. Causa: `NominaPeriodoService.registrarCalculo` solo aceptaba estados
`en_revision` y `reabierta` como origen, por lo que un segundo intento desde
`calculada` fallaba con `Transición no permitida: calculada → calculada`. El
mismo bloqueo aparecía tras "Reabrir nómina" + un primer cálculo.

Cambio:

- `registrarCalculo` ahora hace una pre-transición automática a `en_revision`
  cuando la nómina está en `calculada` o `validada`, registrando motivo
  "Recálculo solicitado." en el evento de auditoría. Desde ahí se ejecuta la
  transición normal a `calculada` con los totales nuevos.
- Estados terminales o aún no aptos (`aprobada`, `liquidada`, `cerrada`,
  `anulada`, `borrador`, `dotacion_generada`) siguen rechazados con el mensaje
  original ("La nómina debe estar en revisión antes de calcular"). Para esos
  hay que pasar por reapertura/anulación explícita.
- `reabierta → calculada` sigue siendo directa, sin pasos intermedios.

Sin cambios visuales. El CTA conserva su rotulado dinámico
("Calcular nómina" / "Recalcular" / "Calculando…").

Archivos:

- `src/app/features/nomina-mensual/services/nomina-periodo.service.ts`
- `src/app/features/nomina-mensual/services/nomina-periodo.service.spec.ts`
  (3 specs nuevos: recálculo desde `calculada`, cálculo directo desde
  `reabierta`, rechazo desde `aprobada`).

Validación: `npx ng test` del spec del servicio (52/52 verdes) +
adapter de cálculo y paso-calculo (18/18 verdes).

---

## 2026-06-15 — Stepper Generador V2 con tooltip del sistema (NOIA-STEPPER-USUARIO-03)

Refinamiento de `NOIA-STEPPER-USUARIO-02`. El botón "Volver al paso anterior"
y el avatar de usuario del aside del stepper exponían su etiqueta vía
`[attr.title]` (tooltip nativo del navegador, sin estilos del sistema). Se
reemplazaron por el componente `app-tooltip` (`shared/components/ui/tooltip`)
para alinearse con el resto de acciones del ERP (banda de período, page-actions,
parámetros) y mantener tipografía, fondo y posicionamiento consistentes.

Cambios visuales:

- Tooltip blanco con borde neutro y flecha (no popover negro del SO).
- Posicionamiento `bottom` con flip automático vía `floating-ui`.
- `aria-label` y semántica `role="img"` del avatar se mantienen para tecnologías
  asistivas; el `title` nativo ya no se emite.

Archivos:

- `src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-stepper/nomina-mensual-v2-stepper.component.{ts,html}`
- `src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-stepper/nomina-mensual-v2-stepper.component.spec.ts`

Validación: `npx ng test` del spec del stepper (11/11 pasos verdes).

---

## 2026-06-15 — Carga visible por paso + grilla full-height patrón Dotación (NOIA-PASOS-CARGA-03)

Cada paso del Generador V2 ahora muestra un componente de carga claro hasta
que la página termina de cargar, y la grilla principal aprovecha todo el alto
disponible del shell. La pieza clave fue replicar el patrón de Dotación
(wrapper flex 1 + `[gridHeight]="'100%'"` + `className`/`cardClassName`) en
Movimientos y Cálculo, donde antes la grilla se quedaba en su altura natural y
dejaba espacio vacío bajo la tabla. Sin tocar motor, persistencia, RLS ni
estilos globales.

### Decisión visual

- **Patrón Dotación replicado** en `paso-mov` y `paso-calc`:
  - Wrapper `.paso-X__grid-wrapper` con `display: flex; flex: 1 1 auto;
    flex-direction: column; min-height: 360px` que toma todo el alto sobrante
    del paso.
  - `app-data-grid` con `[gridHeight]="'100%'"` para expandirse dentro del
    wrapper.
  - `className="paso-X__data-grid"` (flex column, `flex: 1 1 auto`,
    `min-height: 0`) y `cardClassName="paso-X__data-grid-card"` (radius 6px,
    borde `#e2e8f0`) para que la card interna del data-grid también ocupe
    100%.
  - Resultado: la grilla termina pegada a la franja inferior, sin espacio
    muerto.
- **Carga delegada al data-grid** en `paso-mov` y `paso-calc`:
  - `[loading]="loading()"` / `[loading]="cargando()"` con
    `loadingLabel="Cargando movimientos…"` / `"Procesando cálculo…"`.
  - Mismo overlay nativo del data-grid que ya usa Dotación. Mantiene el
    header del paso visible mientras carga la grilla.
  - Se eliminaron los `<p class="paso-X__placeholder">Cargando…</p>` que solo
    daban una línea de texto sin spinner ni overlay.
- **`app-workspace-loading [fill]="true"`** en pasos sin data-grid:
  - **Cálculo (primera vez)**: cuando `cargando() && !resultado()`, no hay
    grilla que cargar; se monta el overlay tipo workspace que cubre el paso
    completo con spinner y mensaje "Estamos generando líquidos, descuentos y
    aportes del período."
  - **Validación**: `cargando()` → overlay con "Cargando resumen de
    validación. Estamos recopilando incidencias críticas y advertencias del
    período."
  - **Cierre**: `cargando()` → overlay con "Cargando checklist de cierre.
    Estamos verificando los pasos previos antes de habilitar el cierre
    operativo."
- **`position: relative` en `.paso-X`**: requisito para que
  `app-workspace-loading [fill]="true"` cubra el área del paso (no de la
  ventana). Sin esto, el overlay se anclaba al `<body>`.
- **Empty states del data-grid**: ahora separamos
  `emptyTitle`/`emptyDescription` (dotación vacía) de
  `emptyTitleWhenFiltered`/`emptyDescriptionWhenFiltered` (filtros sin
  resultado) en `paso-mov`. El placeholder externo "Aún no hay trabajadores
  con movimientos visibles…" desapareció: el data-grid lo emite con su empty
  state nativo y se muestra dentro del card, con la altura completa.

### Justificación NOIA

- **Reutilizar antes de inventar**: la solución es exactamente la misma que
  ya usa Dotación. No se introducen componentes nuevos: `app-workspace-loading`
  ya existía en `src/app/shared/components/ui/feedback/`.
- **Estado visible sin sorpresas**: nunca quedan pantallas en blanco. Si el
  paso aún no terminó de cargar, hay spinner + texto explicativo. Si los
  datos están vacíos, el data-grid muestra el empty state del sistema.
- **Densidad y aprovechamiento del espacio**: la franja inferior ahora marca
  el límite real de la tabla. Antes la grilla quedaba pegada al header y el
  resto del shell era espacio en blanco.
- **Lenguaje administrativo**: títulos y mensajes de carga en español
  operativo, sin nombres técnicos del motor.

### Archivos modificados

- `src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-movimientos/nomina-mensual-v2-paso-movimientos.component.{html,css}`
- `src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-calculo/nomina-mensual-v2-paso-calculo.component.{ts,html,css}`
- `src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-validacion/nomina-mensual-v2-paso-validacion.component.{ts,html,css}`
- `src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-cierre/nomina-mensual-v2-paso-cierre.component.{ts,html,css}`

### Archivos NO tocados

- `angular.json`, `postcss.config.json`, `src/styles.css`, `src/styles/*`,
  `tailwind.config.*` (sin cambios globales).
- Servicios, repositorios, motor, mappers, RLS, SQL, RPC.
- `WorkspaceLoadingComponent` y `DataGridComponent` (solo se consumen como
  ya los usa Dotación / Empresas / Empleados).

### Validaciones

- `npx ng build --configuration development`: bundle OK, sin warnings de
  budget CSS.
- `npx ng test --watch=false` sobre stepper + 5 pasos: **80 tests verdes**.
- ReadLints sobre `nomina-mensual-v2-container/**`: limpio.

---

## 2026-06-15 — Footer unificado del Generador V2 + botón Volver solo-ícono (NOIA-STEPPER-USUARIO-02)

Refinamiento de `NOIA-STEPPER-USUARIO-01`. El botón "Volver al paso anterior"
del stepper queda solo-ícono circular (tooltip nativo del navegador), y todos
los pasos del Generador V2 cierran con una franja inferior idéntica
(`.paso-X__footer`: línea separadora superior + slot opcional de hint). La
grilla / lista principal de cada paso se empuja hasta el borde inferior
gracias a `margin-top: auto` en el footer, lo que aprovecha mejor el alto
disponible del shell. Sin tocar motor, persistencia, RLS ni estilos globales.

### Decisión visual

- **Botón Volver** (`.nmv2-stepper__back`): círculo 30×30 px, mismo tamaño
  que el avatar para alineación perfecta. Solo `lucide-icon arrow-left`,
  texto del paso anterior expuesto vía `title` (tooltip nativo del
  navegador) y `aria-label`. Se eliminaron `.nmv2-stepper__back-label` y el
  placeholder. Hover suave (`#f1f5f9` + `#94a3b8`), focus `outline #1e3a8a`.
- **Footer estándar por paso** (`.paso-dotacion__footer`,
  `.paso-mov__footer`, `.paso-calc__footer`, `.paso-val__footer`,
  `.paso-cierre__footer`): mismo patrón visual —
  `margin-top: auto`, `min-height: 16px`, `padding-top: 10px`,
  `border-top: 1px solid #e2e8f0`, `font-size: 12px`, `color: #475569`. La
  línea fina actúa de separador entre el contenido del paso y el borde
  inferior del shell.
- **Slot opcional de hint** (`aria-live="polite"`):
  - Dotación: motivo de bloqueo o "Aún no hay trabajadores".
  - Movimientos: "Quedan N movimientos pendientes por cargar" en ámbar.
  - Cálculo: "Cálculo generado el dd-MM-yyyy HH:mm · versión N".
  - Validación: "Resuelve los N bloqueos…" / "N advertencias activas…" /
    "Sin incidencias pendientes" con tono semántico (rojo / ámbar / neutro).
  - Cierre: queda con el botón ghost "Volver al administrador de nóminas"
    (escape del flujo, no es retroceso de paso).
- **Tabla al fondo**: `flex: 1 1 auto` en `.paso-X__grid`/`.paso-X__list` ya
  existía; sumado al `margin-top: auto` del footer, la grilla absorbe todo
  el alto disponible y la línea queda pegada al borde inferior del shell sin
  espacio muerto.

### Justificación NOIA

- **Anti-card / densidad**: ningún paso quedó con espacio vacío entre la
  grilla y el borde de la página. El cuerpo del paso se siente "completo"
  y la línea cierra visualmente la zona operativa sin introducir cards
  decorativas.
- **Tooltip nativo del sistema**: el botón solo-ícono usa el `title` HTML
  nativo, sin librería de tooltips ni CSS custom. Más liviano y predecible
  en accesibilidad (`aria-label` se mantiene para SR).
- **Lenguaje administrativo en hints**: "Quedan N pendientes por cargar",
  "Cálculo generado el dd-MM-yyyy", "Resuelve los N bloqueos". Sin texto
  técnico, sin IDs internos, sin referencias a tablas/RPC.
- **Sin gradientes / sombras / cards**: solo línea fina `#e2e8f0` y color
  semántico cuando aplica (rojo `#b91c1c`, ámbar `#b45309`).

### Archivos modificados

- `src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-stepper/nomina-mensual-v2-stepper.component.{html,css,spec.ts}`
- `src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-dotacion/nomina-mensual-v2-paso-dotacion.component.css`
- `src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-movimientos/nomina-mensual-v2-paso-movimientos.component.{html,css}`
- `src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-calculo/nomina-mensual-v2-paso-calculo.component.{html,css}`
- `src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-validacion/nomina-mensual-v2-paso-validacion.component.{html,css}`
- `src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-cierre/nomina-mensual-v2-paso-cierre.component.css`

### Archivos NO tocados

- `angular.json`, `postcss.config.json`, `src/styles.css`, `src/styles/*`,
  `tailwind.config.*` (sin cambios globales).
- Servicios, repositorios, motor, mappers, RLS, SQL, RPC.
- `AuthService` (solo consumo).

### Validaciones

- `npx ng build --configuration development`: bundle OK, sin warnings de
  budget CSS.
- `npx ng test --watch=false` sobre stepper + 5 pasos (Dotación,
  Movimientos, Cálculo, Validación, Cierre): **80 tests verdes**.
- Spec del stepper actualizado: el botón ahora se valida como solo-ícono
  (no debe contener `textContent` visible, sí debe tener `lucide-icon` y
  `title="Volver a Movimientos"`).
- ReadLints sobre `nomina-mensual-v2-container/**`: limpio.

---

## 2026-06-15 — Stepper Generador V2 con aside (usuario activo + Volver al paso anterior) (NOIA-STEPPER-USUARIO-01)

Barra superior del Generador V2 (`/remuneraciones/nominas/:id/generador`) ahora
tiene un aside derecho con dos elementos: botón `Volver a [paso N-1]` (mueve
el retroceso desde el footer de cada paso al stepper, único punto de retroceso
del flujo) y avatar circular con las iniciales del usuario activo (registro
visible de quién está trabajando la nómina). La línea separadora inferior del
stepper se mantiene. Sin tocar motor, persistencia, RLS ni estilos globales.

### Decisión visual

- **Slot derecho** (`.nmv2-stepper__side`): `display: flex; gap: 10px`,
  `border-left: 1px solid #e2e8f0` (línea vertical que separa el flujo de los
  controles). En viewports < 1100px ese borde se vuelve `border-top` y los
  controles se acomodan justo debajo del stepper.
- **Botón "Volver a [paso N-1]"** (`.nmv2-stepper__back`): outline neutro
  (`#cbd5e1`), texto `#1e293b`, ícono lucide `arrow-left` 14px, hover suave
  (`#f1f5f9` + `#94a3b8`), focus `outline #1e3a8a`. La etiqueta se calcula con
  `obtenerEtiquetaBrevePaso(pasoAnterior)`. En el primer paso (Parámetros) no
  hay paso anterior: el botón no se renderiza y queda un placeholder de 0px
  para no saltar el avatar al cambiar de paso.
- **Avatar usuario** (`.nmv2-stepper__user`): círculo 30×30 px, azul NOIA
  `#1e3a8a`, texto blanco, 11px bold, iniciales de 2 caracteres derivadas de
  `user.user_metadata.full_name` (`Catalina Rojas` → `CR`) o del local-part
  del email (`jp@empresa.cl` → `JP`). Tooltip con `Nombre · correo` o solo
  correo si no hay nombre. `role="img"` + `aria-label` accesible. Cuando no
  hay sesión (carga inicial, test sin AuthService) muestra `·` y omite el
  tooltip.
- **Línea separadora inferior**: se mantiene la regla existente del header
  (`border-bottom: 1px solid #e2e8f0`); no se introduce sombra ni acento.
- **Footer de los pasos**: se eliminó el botón `Volver a [paso N-1]` de
  Dotación, Movimientos, Cálculo, Validación y Cierre (en este último se
  conserva `Volver al administrador de nóminas`, que es un escape del flujo,
  no un retroceso de paso). El paso Dotación conserva su footer porque ahí
  vive el `motivoBloqueo` / `hint` operativo.

### Justificación NOIA

- **Anti-card / regla operativa**: el retroceso ahora ocurre en la
  herramienta de navegación (stepper) y no como acción anidada en el cuerpo
  del paso. El stepper recupera el rol de única superficie de navegación.
- **Registro humano sin texto técnico**: el avatar comunica "estoy yo
  trabajando esto" sin nombre extenso ni IDs; el tooltip ofrece detalle bajo
  demanda. Cumple `noia-ui-guardrails.md` (lenguaje administrativo, densidad
  compacta, ninguna fuente nueva).
- **Sin gradientes ni sombras**: solo un círculo plano azul NOIA del manual y
  un botón outline ya presente en el repo.
- **Una acción principal por zona**: el slot derecho concentra el retroceso
  + identidad; el cuerpo del paso queda libre para su acción principal
  (Calcular, Aprobar, etc.).

### Archivos modificados

- `src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-stepper/nomina-mensual-v2-stepper.component.{ts,html,css}`
- `src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-stepper/nomina-mensual-v2-stepper.component.spec.ts`
- `src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/facade/nomina-mensual-v2-navegacion.ts` (`pasoAnteriorDe(...)`)
- `src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/nomina-mensual-v2-container.html` (cableo `(volverPasoAnterior)`)
- `src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-dotacion/nomina-mensual-v2-paso-dotacion.component.{html,css}`
- `src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-movimientos/nomina-mensual-v2-paso-movimientos.component.{html,css}`
- `src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-calculo/nomina-mensual-v2-paso-calculo.component.{html,css}`
- `src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-validacion/nomina-mensual-v2-paso-validacion.component.{html,css}`
- `src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-cierre/nomina-mensual-v2-paso-cierre.component.html`

### Archivos NO tocados

- `angular.json`, `postcss.config.json`, `src/styles.css`, `src/styles/*`,
  `tailwind.config.*` (sin cambios globales).
- Servicios, repositorios, motor de cálculo, mappers, RLS, SQL, RPC.
- `AuthService` (solo consumo).
- Footer de Cierre conserva `Volver al administrador de nóminas`.
- Outputs `volver*` de cada paso (`@Output()` se mantienen para no romper
  contratos; simplemente no hay UI que los emita).

### Validaciones

- `npx ng test --watch=false` sobre stepper y pasos tocados: **101 tests
  verdes** (49 + 52, sin regresiones).
- ReadLints sobre `nomina-mensual-v2-container/**`: limpio.
- Nuevos casos en `nomina-mensual-v2-stepper.component.spec.ts`: el botón no
  aparece en `parameters`; etiqueta correcta para `calculation` → "Volver a
  Movimientos"; emisión de `volverPasoAnterior` con `dotacion` cuando el paso
  activo es `movements`; iniciales `CR` y `JP`; placeholder `·` cuando no hay
  sesión.

---

## 2026-06-15 — Paso "Cálculo" rediseñado con desglose y preview tipo PDF (NOIA-CALC-DESGLOSE-01)

Paso 4 del Generador V2 (`/remuneraciones/nominas/:id/generador`, segmento
`Cálculo`) rediseñado para que RRHH pueda revisar el cálculo del período por
trabajador, expandir el desglose ejecutivo inline y abrir una previsualización
tipo PDF de la liquidación. Reemplaza las 6 cards horizontales y el "Top 5 de
líquidos" por una grilla unificada estilo Movimientos. Sin tocar motor,
servicios, RLS ni estilos globales.

### Decisión visual

- **Header**: dos columnas — copy (eyebrow `Paso 4 · Cálculo`, título,
  subtítulo operativo) + aside con `<dl class="paso-calc__stats">` (Trabajadores
  calculados, Haberes, Descuentos, Líquido total) y un solo botón en
  `.paso-calc__toolbar`: `Calcular nómina` / `Recalcular` / `Calculando…`.
  Las mini-stats `Con advertencias` y `Con bloqueos` aparecen solo cuando
  hay casos (no rellenan espacio).
- **Pre-validación**: línea de chips compacta (`N en dotación · N listos · N
  críticos · N advertencias`). Se vuelve rojiza cuando `puedeCalcular=false`,
  reemplazando la card grande anterior.
- **Avisos**: `app-message-box` (`variant="warning"` para "cálculo no
  vigente", `danger` para errores del motor, `info` para confirmaciones).
  Se eliminaron los `<p class="paso-calc__alert is-...">`.
- **Grilla principal**: `app-data-grid` con `expandableRows=true`,
  `rowExpansionKey` por `trabajadorId`, filtros (estado del cálculo + AFP),
  `headerCountNoun="trabajadores"` y orden por líquido descendente. 8
  columnas: Trabajador (nombre/RUT/tipo contrato), AFP, Salud, Haberes,
  Descuentos, **Líquido** (negrita azul NOIA), Estado (chip), Acción
  (ícono ojo). Si no hay nombre de AFP/Salud en la liquidación se muestra
  `—` (placeholder; el container puede inyectarlos vía `presentarFilaCalculo`
  cuando conecte el catálogo).
- **Estado por fila**: chip `Calculado` (verde suave), `Con advertencias`
  (ámbar), `Con bloqueos` (rojo suave). Sin sombras ni gradientes.
- **Detalle expandible inline**: 4 bloques en grid responsive
  (`auto-fit minmax(280px, 1fr)`):
  - **Haberes** con chip por línea (`Imponible` / `No imponible` /
    `No tributable`) y total al pie.
  - **Descuentos legales** con tasa visible (`× 11,44%`, `× 7,00%`,
    `× 0,60%`, `× X,XX%` para impuesto único).
  - **Descuentos voluntarios** (solo si los hay).
  - **Bases legales**: Imponible previsional y Tributable.
  - **Aportes del empleador** (SIS, SANNA, Mutual) con nota
    `Informativo. No afecta al líquido del trabajador.`
  - Footer del detalle con `Líquido a pago` destacado en azul NOIA.
- **Previsualización tipo PDF**: nuevo componente standalone
  `app-liquidacion-preview-modal`. Al hacer click en el ícono `eye` o en
  el link `Ver previsualización (PDF)` del detalle, se abre un modal con
  layout imprimible: cabecera empresa, identificación trabajador, tablas
  de haberes/descuentos con subtotales, bases legales, aportes del
  empleador (informativo) y `Líquido a pagar` en pesos y en palabras +
  espacio para firmas. Cierre por backdrop, botón `Cerrar` o `Esc`. Botón
  `Imprimir` dispara `window.print()` con un `@media print` que oculta el
  chrome del modal.

### Lenguaje visible

- Estados: `Calculado` / `Con advertencias` / `Con bloqueos`.
- Etiquetas: `Imponible`, `No imponible`, `Tributable`, `No tributable`.
- Aportes del empleador rotulados como `Informativo` para evitar confusión.
- Footer del detalle: `Líquido a pago` (no "monto neto" ni términos
  contables ambiguos).

### Archivos tocados

- `src/app/features/nomina-mensual-v2/presenters/paso-calculo-fila.presenter.ts`
  (nuevo) + spec con 13 tests (mapeo, tasas, etiquetas, estados, stats,
  filtros, columnas).
- `src/app/features/nomina-mensual-v2/components/liquidacion-preview-modal/`
  (nuevo): `.ts`, `.html`, `.css`, `liquidacion-en-palabras.ts` y spec
  con 8 tests (cabecera, subtotales, palabras, Escape/backdrop, aportes
  informativos).
- `src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-calculo/`:
  `.ts`, `.html`, `.css` reescritos; `.spec.ts` ampliado con 8 tests
  nuevos (header, orden por líquido, inferencia AFP/Salud, stats,
  apertura/cierre del preview, estado vacío, render de la grilla,
  texto del CTA).

### Archivos NO tocados

- Motor V1 (`proceso-mensual-motor.rules.ts`), adapter
  (`nomina-periodo-calculo-adapter.service.ts`), servicios (`proceso-mensual.service.ts`,
  `nomina-periodo.service.ts`), modelos del dominio.
- Otros pasos del Generador (Alcance, Parámetros, Dotación, Movimientos,
  Validación, Cierre) ni el container.
- Estilos globales (`src/styles/*`, `angular.json`, `tailwind.config.*`,
  `postcss.config.*`).
- Migraciones SQL, RLS, persistencia.

### Validación

- `npx ng test --watch=false --include="**/paso-calculo-fila.presenter.spec.ts" --include="**/liquidacion-preview-modal*.spec.ts" --include="**/nomina-mensual-v2-paso-calculo.component.spec.ts"` → **3 archivos · 38 tests OK**.
- `ReadLints` sobre `src/app/features/nomina-mensual-v2` → sin errores.
- Smoke manual queda pendiente: recargar paso 4 sobre `2026-05`, validar
  los 3 trabajadores con líquidos `901.782 / 863.849 / 857.494`,
  expandir uno, abrir preview y validar la maqueta.

---

## 2026-06-11 — Empresas alineadas al patrón shell (NOIA-EMPRESAS-SHELL-01)

Pantallas `/empresas` (listado) y `/empresas/:id|nueva` (ficha) rediseñadas
para hablar el mismo lenguaje visual que el resto del ERP: el shell publica
título + breadcrumb + CTA principal vía `bindShellPageContext` y la pantalla
se concentra en datos y acción. Sin tocar BD, servicios, validaciones ni
contratos del formulario.

### Decisión visual

- **Listado**: se retira el header local (lead largo + dos botones). El shell
  recibe `pageTitle="Empresas"`, subtítulo dinámico (`N empresas registradas`
  / `Aún no hay empresas registradas`) y CTA primaria `Nueva empresa`
  (`actionId="empresas-nueva"`). La toolbar de `app-data-grid` queda con
  `Refrescar` y `Exportar` como acciones operativas secundarias.
- **Grid**: `toolbarLayout="operativa"`, `filterChipsDisplay="whenFiltersHidden"`,
  `headerCountNoun="empresas"`. La fila vacía sin filtros ofrece copy operativo
  (`Sin empresas registradas` + `Crea la primera empresa para configurar
  contratos y mutual empleador.`).
- **Estado mutual por fila**: chip `Sí` con tono `success` suave + dot;
  `No` neutro. Sin verdes/azules saturados.
- **Acción por fila**: botón ícono `pencil` (28×28, paleta neutra) que reemplaza
  el link azul `Revisar datos`.
- **Carga**: `app-workspace-loading` (`fill=true`) cuando la grilla aún no
  tiene filas; mientras se refresca con filas presentes, el indicador queda en
  la toolbar del grid.
- **Errores**: `app-message-box` con `variant="error"` y `primaryLabel="Reintentar"`
  reemplaza el `<p class="emp-field-error" role="alert">` suelto.

### Ficha

- Header local eliminado. El shell publica:
  - `pageTitle` = `Nueva empresa` en alta o la razón social en edición;
  - `pageSubtitle` = copy contextual en alta (`Registra los datos mínimos…`)
    o `RUT 12.345.678-9` en edición;
  - breadcrumb dinámico (`Empresas / Nueva empresa` o `Empresas / [razón social]`);
  - CTA `Guardar` con `loading`/`disabled` enlazados al estado real.
- Errores agrupados: tres `app-message-box` (`error` para fallos de servidor,
  `warning` para `validacion()!.errores.join(' · ')`, `success` para confirmar
  guardado). El mensaje de éxito se descarta al editar de nuevo.
- Cargando ficha: `app-workspace-loading` reemplaza el `<p>` huérfano.
- `EmpresaFormComponent` no se modifica (estructura, `formControlName`,
  validaciones y mappers intactos). Solo cambia la paleta del shared CSS.

### Paleta y CSS

- `src/app/features/empresas/styles/empresas.shared.css` reescrito: se retiraron
  reglas del header local (`.emp-page`, `.emp-head`, `.emp-lead`,
  `.emp-head-actions`, `.emp-grid-wrap`, `.emp-link-btn`, `.emp-chip*`) y se
  reemplazó `--emp-blue: #2563eb` por `--emp-primary: #1e3a8a` (primary NOIA
  del shell). `--emp-primary-soft: #eef2ff` reemplaza `#eff6ff`. El focus de
  inputs usa `rgba(30, 58, 138, 0.2)`.
- Los chips de la grilla viven en el CSS local de `listado-empresas-container`
  (`emp-list__chip*`) con la misma escala que `adm-plant__chip*`.

### Archivos tocados

- `src/app/features/empresas/containers/listado-empresas-container/{ts,html,css}`
- `src/app/features/empresas/containers/ficha-empresa-container/{ts,html,css}`
- `src/app/features/empresas/styles/empresas.shared.css`
- `src/app/layout/sidebar.component.spec.ts` (deuda pre-existente: registrar
  `CalendarDays` en el `pick` por F03 y actualizar la aserción del label a
  `Administrador de nóminas`; no es del alcance Empresas pero se arregló para
  desbloquear la suite)

### Archivos NO tocados

- `src/app/features/empresas/components/empresa-form/**` (estructura del form
  y `formControlName`).
- `src/app/features/empresas/services/**`, `data-access/**`, `mappers/**`,
  `rules/**`, `models/**`, `empresas.routes.ts`.
- `src/app/layout/shell-route-context.config.ts` (los breadcrumbs de Empresas
  ya estaban registrados).
- `angular.json`, `postcss.config.*`, `src/styles*.css`, fuentes, tema.

### Validaciones

- `npx tsc -p tsconfig.app.json --noEmit` → OK.
- `npx ng test --watch=false --include='src/app/features/empresas/**/*.spec.ts'
   --include='src/app/layout/**/*.spec.ts'` → 30/30 verdes.
- `npx ng build --configuration=development` → OK sin warnings de budget.

---

## 2026-06-11 — Plantillas de ciclos (NOM-ADMIN-OPS-F03)

Nueva pantalla `/remuneraciones/plantillas-ciclos` para administrar plantillas
de calendario por empresa (mensual, quincenal, semanal, anticipos). Se agrega
también el ítem `Plantillas de ciclos` al sidebar (grupo Gestión, icono
`calendar-days`).

### Decisión visual

- Patrón heredado del Administrador de nóminas: `bindShellPageContext` para
  publicar breadcrumbs/título/CTA desde el shell + `app-data-grid` con
  `toolbarLayout="operativa"` + `app-message-box` para confirmaciones.
- Sin `<app-page-frame>` (mantiene la coherencia con `administrador-nominas`,
  pendiente de migración global a frame).
- Cero cards decorativas. Una sola grilla operativa al 100 % del ancho.
- Acciones por fila con iconos sobrios (`calendar-days`, `pencil`, `pause`,
  `play`, `trash-2`).
- Dos modales locales con CSS local prefijo `adm-plantillas-modal__` y
  `adm-plantillas-preview__`:
  - **Editor**: form con secciones "Fecha de pago", "Si cae en fin de semana"
    y "Anticipo" (condicional). Radios con chip estilo "opción activa" cuando
    seleccionado.
  - **Vista previa**: año seleccionable + tabla con `Pago propuesto`,
    `Calendario` (cuando hubo ajuste) y chip ámbar `Adelantado/Atrasado`.

### Copy operativo (NOIA)

- Eyebrow `Crear plantilla` / `Nueva versión` según modo.
- Tooltip "Editar (crear nueva versión)" deja explícito el versionado.
- Empty state: "Aún no hay plantillas — Crea la primera plantilla de ciclo
  desde la acción principal." Tras filtrar: "Sin resultados con los filtros
  actuales — Cambia o limpia los filtros."
- Ajuste de fin de semana descrito en lenguaje RRHH: "Adelantar al viernes
  anterior", "Atrasar al lunes siguiente", "Mantener fecha calendario".
- Anticipo descrito como "50 % del líquido proyectado" o "$X fijo".

### Archivos visuales tocados

- Nuevos: `administrador-plantillas-container.{ts,html,css}` y dos modales con
  sus tres archivos cada uno.
- Modificados: `app.routes.ts`, `shell-navigation.config.ts`,
  `shell-route-context.config.ts` (fallback de breadcrumbs).
- **No** se tocaron `angular.json`, `postcss.config.*`, `tailwind.config.*`,
  `src/styles*.css`, `src/styles/*`, fuentes ni tema.

### Validación

- `npx ng test --watch=false` con specs F03 (modelos, mapper, repository,
  service, presenter, container) — 56/56.
- Regresión completa `features/nomina-mensual/** + features/nomina-mensual-v2/**
  + layout/shell-*` — 1102/1102.
- `npx ng build --configuration=development` — OK (lazy chunk
  `administrador-plantillas-container` generado).
- Smoke SQL `bd/scripts/validar-nomina-f03-plantillas-ciclos.sql` contra PROD
  — verde.

## 2026-06-11 — Retiro de Nómina mensual legacy y chip de período del Administrador

- Se elimina del sidebar la entrada `Nómina mensual`; `Administrador de nóminas` queda como acceso canónico.
- Se retira el chip de mes del ítem `Administrador de nóminas`.
- `/remuneraciones`, `/remuneraciones/proceso-mensual` y `/proceso-remuneraciones` redirigen a `/remuneraciones/nominas`.
- Se eliminan la página, contenedor, laboratorio MsgBox y E2E exclusivos de la UI legacy.
- Dashboard, reportes, liquidaciones y breadcrumbs dejan de enlazar a la pantalla retirada.
- Se conservan modelos, servicios y reglas compartidos que todavía usa el Generador V2 y liquidaciones.

### Validación

- `npx tsc -p tsconfig.app.json --noEmit` — OK.
- `npx tsc -p tsconfig.spec.json --noEmit` — OK.
- Specs de navegación y contexto del shell — 5/5.
- `npx ng build --configuration development` — OK.

## 2026-06-11 — Nómina v2 · Movimientos · stepper denso + alertas en msgbox + modal sin escape

Pulida de tres puntos de fricción reportados por el usuario.

### Motivación

Feedback textual: «mejoras al la pestaña de movimientos primero hagamos mas compacta de alto el nmv2-stepper nomina-stepper nomina-stepper-compact para tener mas espacio para la grillas , quitar paso-mov__alert is-info las alertas siempre deben estar en msgbox , en el modal e agregar por cada trabajador no debe venir la opcion de cambiar de trabajador».

### Decisiones

- **Stepper más denso**: el card del stepper reservaba `min-height: 66px` con `grid-template-rows: 20px / 46px` y cada step `46px` de alto. Se baja a `min-height: 50px`, filas `16px / 34px` y step `34px` con `padding 4px 24px 4px 7px`. Status pill sube de `top: 6px` a `4px`. En `nomina-stepper-compact .step`: padding `6px 8px 8px` → `4px 8px 5px`. Ganancia neta ~16 px verticales para la grilla. Sin cambios de tipografía ni de tamaños de circulitos numerados.
- **Alertas como `app-message-box`**: las dos banners ad-hoc del paso (`paso-mov__alert is-error` y `paso-mov__alert is-info`) se eliminan. En su lugar se monta el componente compartido `app-message-box` con `mode="inline"`, `variant="danger"` para el error y `variant="info"` para el mensaje informativo, ambos `[dismissible]="true"` con handler local que limpia el signal. Esto alinea el paso con el resto de la v2 (`paso-parametros`, `paso-cierre`, overlays) donde la única fuente de feedback es msgbox. Se eliminan las reglas CSS `paso-mov__alert*` del componente.
- **Modal sin "Cambiar trabajador"**: el botón ghost que permitía soltar la ficha del trabajador preseleccionado se retira. Cuando el modal se abre desde una fila, el trabajador queda inmovilizado (la fila clickeada determina la identidad). El método `cambiarTrabajadorEnModal()` queda sin consumidores y se elimina. CSS de `paso-mov__ficha-trabajador` pasa de `justify-content: space-between` a `flex-start` para acompañar.

### Archivos tocados

- `src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-stepper/nomina-mensual-v2-stepper.component.css` — densificación del card, label y step.
- `src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/nomina-mensual-v2-container.css` — ajuste del padding del wrapper `nomina-stepper-compact .step`.
- `src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-movimientos/nomina-mensual-v2-paso-movimientos.component.ts` — import de `MessageBoxComponent`, dos handlers `descartarError()` / `descartarMensaje()`, eliminación de `cambiarTrabajadorEnModal()`.
- `src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-movimientos/nomina-mensual-v2-paso-movimientos.component.html` — banners migrados a `app-message-box`; botón "Cambiar trabajador" eliminado del modal.
- `src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-movimientos/nomina-mensual-v2-paso-movimientos.component.css` — eliminación de las reglas `paso-mov__alert*`; `paso-mov__ficha-trabajador` con `justify-content: flex-start`.

### Archivos NO tocados (guardrails)

- Estilos globales (`src/styles*`), `angular.json`, `tailwind.config.*`, fuentes, tema.
- Modelos, servicio (`NominaPeriodoService`), repositorio, presenter, mappers.
- Otros pasos del v2 (`paso-dotacion`, `paso-parametros`, `paso-calculo`, `paso-validacion`, `paso-cierre`) y el componente `app-message-box` compartido.
- Motor de cálculo, liquidaciones productivas, SQL/RPC/RLS.

### Validación

- `npx ng test --watch=false --include='**/paso-movimientos/**/*.spec.ts'` → **18/18**.
- `npx ng test --watch=false --include='**/nomina-mensual-v2/**/*.spec.ts'` → **224/224** (regresión total v2).
- `npx ng build --configuration=development` → OK.

### Lo que se contrastó con `docs/codex`

`noia-ui-manual.md` (densidad compacta, mensajería centralizada en msgbox, sin chips ad-hoc), `noia-antipatrones-ia.md` (no banners decorativos en cada componente), `noia-ui-review-checklist.md` (una sola fuente de feedback). El componente `app-message-box` ya es el contrato del repo para feedback inline/modal.

---

## 2026-06-10 — Nómina v2 · Movimientos · toolbar bajo las stats (densificación del header)

Seguimiento del pulido del día. Reposicionamiento de la toolbar global del paso Movimientos.

### Motivación

Feedback del usuario (textual): «mejor posiciones de los botones dejalo debajo de la sección Trabajador con movimientos y así tenemos más espacio para la tabla».

La toolbar ocupaba una fila completa entre el header y la grilla. La columna derecha del header (stats) tenía espacio vertical libre debajo: aprovecharlo permite ganar ~40 px de alto para la grilla y mantener la lectura "qué pasa" → "qué hago" en una sola columna.

### Decisión

- Nuevo wrapper `paso-mov__head-aside` dentro de `header.paso-mov__head` que agrupa, en columna y alineado al borde derecho, la `<dl class="paso-mov__stats">` arriba y la `<div class="paso-mov__toolbar">` abajo.
- La toolbar deja de ser un hermano del header. Las alertas (`error()` / `mensaje()`) permanecen entre header y grilla.
- CSS: `paso-mov__head-aside` con `display: flex; flex-direction: column; align-items: flex-end; gap: 10px; flex: 0 0 auto;`. `paso-mov__toolbar` ahora con `justify-content: flex-end` y `gap: 8px` para alinearse al borde derecho dentro del aside.
- En mobile (`flex-wrap` del header) el aside cae completo bajo el copy, conservando el orden stats → acciones.

### Archivos tocados

- `src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-movimientos/nomina-mensual-v2-paso-movimientos.component.html` — nuevo wrapper `paso-mov__head-aside` envolviendo stats + toolbar; toolbar movida dentro del header.
- `src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-movimientos/nomina-mensual-v2-paso-movimientos.component.css` — nueva regla `.paso-mov__head-aside`; `.paso-mov__toolbar` gana `justify-content: flex-end`.

### Archivos NO tocados (guardrails)

- TS del componente: sin cambios (signals, handlers y firmas intactos).
- Modelos, servicio, repositorio, presenter.
- Estilos globales (`src/styles*`), `angular.json`, fuentes, tema.
- Otros pasos del v2 y resto del módulo.

### Validación

- `npx ng test --watch=false --include='**/paso-movimientos/**/*.spec.ts'` → **18/18**.
- `npx ng build --configuration=development` → OK.

### Lo que se contrastó con `docs/codex`

`noia-ui-manual.md` (densidad, una acción principal por zona), `noia-ui-review-checklist.md` (reducir ruido visual, usar bien el espacio). Sin cambios cromáticos, sin cards y sin nuevas dependencias.

---

## 2026-06-10 — Nómina v2 · Movimientos · pulido visual y "Agregar" con ficha en contexto

Continuación inmediata del refactor del día. Pasada de pulido visual sobre el paso Movimientos y rediseño del flujo de alta manual desde una fila concreta.

### Motivación

Feedback del usuario (textual): «mejor pulido visual de información y + manual no se entiende, tampoco se genera directo la edición para esa fila con el trabajador en concreto».

Los problemas concretos:

- El chip `+ Manual` en la columna de acciones era críptico (texto inconsistente con el CTA global "Agregar movimiento manual").
- Al abrirse desde una fila, el modal forzaba al usuario a re-buscar al mismo trabajador del que venía clickeando — la preselección quedaba "escondida" dentro del `<select>` sin feedback.
- Las stats del header se veían como chips grandes (`paso-mov__stat-line`) con un punto cromático fuerte, alejándose de la densidad NOIA.
- El detalle expandible no diferenciaba visualmente haberes/descuentos en los montos individuales.

### Decisiones

- **Botón fila → "+ Agregar"**: el chip se renombra y se acompaña de un mini-disco azul con `+` que comunica la acción (no decora). `title` largo y humano: "Agregar un movimiento manual (bono, descuento, ausencia…) a {Nombre}".
- **Ficha del trabajador en el modal**: nuevo signal `trabajadorPreseleccionadoModal`. Cuando el modal se abre desde una fila (o desde la acción del detalle expandible), aparece arriba un bloque sólido con `Trabajador` + Nombre + RUT + Cargo + Centro de costo, y un secundario "Cambiar trabajador" que vuelve al buscador + select. El título del modal se vuelve contextual: "Agregar movimiento manual a {Nombre}".
- **Acción "+ Agregar" también en el detalle expandible**: ahora el header del expandible ofrece la misma acción contextual junto al "Cerrar", evitando que el usuario tenga que colapsar para volver a la columna de acciones.
- **Header del paso**: las stats se reemplazan por una `<dl>` semántica con separadores verticales sutiles (`border-left`) sin chips ni cards. Tipografía tabular, label en eyebrow uppercase, valor 17px. Variantes `is-warning`, `is-positive`, `is-negative` solo aplican color al valor.
- **Subtítulo del paso**: se acorta y deja de citar la regla técnica de idempotencia (ya está en el `title` del CTA primario).
- **Subtítulo del modal**: una línea humana ("Bonos extra, descuentos puntuales, ausencias e informativos del mes.") que explica qué cabe ahí, evitando el uso técnico del campo "Tipo / Concepto".
- **Pulido de celdas grilla**:
  - Chip de pendientes inline al nombre (no debajo del cargo), tipografía más compacta y `lowercase`.
  - Montos en columnas Haberes/Descuentos toman color contextual: verde para haberes, rojo para descuentos. Vacío (`—`) en gris muy claro.
  - RUT en `font-variant-numeric: tabular-nums`, alineación más estable.
- **Pulido del detalle**:
  - `chip-origen` con tonos distintos según `origen` (`recurrente` → azul, `manual` → púrpura) para identificar a simple vista quién creó el item.
  - Items omitidos: concepto en `line-through` y gris (refuerza el estado "fuera de la nómina este mes").
  - Valor del item con color contextual (verde haber / rojo descuento) para que el ojo siga el flujo.
  - Glosa en cursiva, jerarquía clara con el meta.

### Archivos tocados

- `src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-movimientos/nomina-mensual-v2-paso-movimientos.component.ts` — nuevo signal `trabajadorPreseleccionadoModal`, métodos `resolverFichaTrabajador()` (con fallback) y `cambiarTrabajadorEnModal()`; `abrirModalManual()` resuelve la ficha cuando hay preselección; `cerrarModalManual()` limpia el signal.
- `src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-movimientos/nomina-mensual-v2-paso-movimientos.component.html` — header con `<dl>`, botón "+ Agregar" con icono, ficha del trabajador en el modal, acción contextual en el detalle expandible, chips/origen con `data-origen`, montos con color por categoría.
- `src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-movimientos/nomina-mensual-v2-paso-movimientos.component.css` — reescrita la sección de stats; nuevos `paso-mov__btn-agregar`, `paso-mov__icono-mas`, `paso-mov__ficha-trabajador*`, variantes `is-positive` / `is-negative` para montos y valores, tono por origen en `paso-mov__chip-origen[data-origen=...]`, line-through en concepto de items omitidos.

### Archivos NO tocados (guardrails)

- Modelos, servicio, repositorio y presenter: el rediseño es **puramente visual** + un signal local de presentación. Sin cambios en agregaciones, idempotencia, ni firmas de servicio.
- `angular.json`, `tailwind.config.*`, estilos globales, fuentes, tema.
- Resto de pasos del v2 (`paso-dotacion`, `paso-parametros`, …), motor de cálculo, liquidaciones productivas, SQL/RPC/RLS, ficha legacy v6.

### Validación

- `npx ng test --watch=false --include='**/paso-movimientos/**/*.spec.ts'` → **18/18** (los specs verifican signals/métodos, no texto HTML; la nueva ficha no rompe contratos).
- `npx ng build --configuration=development` → OK (Angular compila los templates sin warnings).

### Lo que se contrastó con `docs/codex`

`noia-ui-manual.md` (densidad compacta, sin cards decorativas, paleta del sistema), `noia-antipatrones-ia.md` (no chips grandes, no gradientes, no barras laterales fuertes), `noia-ui-review-checklist.md` (acción principal clara, lenguaje RRHH, identidad NOIA, no SaaS). Patrón `app-data-grid` con `expandableRows` reutilizado tal cual (no se tocó el componente compartido).

---

## 2026-06-10 — Nómina v2 · Movimientos unificados (fila = trabajador) + cierre del container

Refactor estructural del paso Movimientos del generador v2. Eliminados los tres tabs ("Configurados", "Manuales", "Omitidos") en favor de una sola grilla `app-data-grid` por trabajador con detalle expandible. El formulario manual sale del cuerpo del paso y pasa a un modal modal-backdrop simple.

### Motivación

Heredado: los tres tabs partían el mismo dato (`movimiento_nomina` + `movimiento_recurrente`) según el atributo `estado` / `origen`. El usuario tenía que cambiar de tab para entender el estado real de un trabajador y la UI no obedecía el principio rector "trabajo por excepción · el usuario NO revisa todos los trabajadores".

Pidiendo del usuario (textual): «mejor que diga visualizar o Cargar movimiento configurado de los trabajadores y poner quizás no sé una cuadrícula con cada trabajador y que lo pueda visualizar el usuario».

Aprobado en la sesión: **fila = trabajador, conceptos como sub-detalles expandibles**, resumen por categoría ($ haberes + $ descuentos + cantidad de ausencias + cantidad de informativos).

### Decisiones

- **Modelo de fila**: `FilaTrabajadorMovimientos` (resumen por trabajador) + `ItemMovimientoTrabajador` (detalle plano). Define [`src/app/features/nomina-mensual/models/movimiento-nomina.models.ts`](../../src/app/features/nomina-mensual/models/movimiento-nomina.models.ts).
- **Agregaciones estables** (ver specs):
  - `totalHaberes` / `totalDescuentos`: suma `monto` de items con `estado='aplicado'`. Refleja lo que entró al cálculo; pendientes y omitidos no contribuyen.
  - `cuentaAusencias` / `cuentaInformativos`: count de items en esa categoría con `estado != 'omitido'`.
  - Contadores por estado (`cuentaPendientes`, `cuentaAplicados`, `cuentaOmitidos`) cuentan todos los items del trabajador.
- **Servicio**: nuevo método `NominaPeriodoService.listarMovimientosPorTrabajador()` cruza recurrentes + dotación + movimientos del período. Incluye trabajadores sin items (count en cero) para permitir alta de manuales sin filtros. `listarMovimientosConfigurados` queda como deprecated interno hasta retirar últimos consumidores.
- **Acciones**:
  - Global: "Cargar todos los pendientes" (acción primaria, idempotente, badge con N).
  - Por fila: "Cargar N" del trabajador (acción masiva por trabajador) + "+ Manual" (ghost).
  - Por item (dentro del expandible): "Cargar a la nómina" (pendiente), "Omitir este mes" (aplicado), "Reaplicar" (omitido), "Eliminar" (solo manuales).
- **Persistencia de grilla**: nueva clave `nomina-v2-movimientos-por-trabajador-grid-v1`.
- **Modal manual**: se extrae del cuerpo del paso a un modal `aria-modal` con backdrop. Mantiene una sola identidad visual en el paso.
- **Lenguaje RRHH (NOIA)**: "Pendiente de cargar", "Aplicado este mes", "Omitido este mes", "Configurado en ficha", "Manual del período".
- **Hard-delete consistente**: el botón "Eliminar" de un manual aplicado/omitido invoca el nuevo `eliminarMovimientoManual` (refusa items recurrentes), alineado con la decisión global de hard-delete del 2026-06-10.

### Cierre del container v2

`paso-alcance` y `paso-empleados` ya no estaban en el `@switch` del container desde refactors previos, pero quedaban como deuda muerta: ViewChilds, handlers, archivos completos y outputs en el `overlays` que nadie disparaba. En esta fase:

- Eliminados los archivos del módulo (`paso-alcance/*` y `paso-empleados/*`).
- Eliminados del container `TS`: imports, `viewChild`, handlers `manejarAvanceDesdeAlcance`, `irAPasoAlcance`, `manejarAvanceDesdeEmpleados`, `confirmarAvanceConAdvertenciaAlcance`, `confirmarAvanceConAdvertenciaEmpleados`, `verEnGrillaEmpleados`, `reintentarValidacionEmpleados`, `irAPendientesEmpleados`.
- Eliminados del container `HTML`: bindings rotos a esos handlers en `app-nomina-mensual-v2-overlays`.
- Eliminados del overlays `TS`: 5 outputs huérfanos, 2 métodos `cerrarModalAvance{Alcance,Empleados}`, import `NominaMensualV2EmpleadosResumenPendientesComponent` (sin uso vivo) y dependencia con `TipoPendienteEmpleado`.
- Eliminados del overlays `HTML`: bloques `@if (modalAvanceAlcance() …)` y `@if (modalAvanceEmpleados() …)`.
- Eliminados del orquestador port: signals `modalAvanceAlcance` / `modalAvanceEmpleados`, tipo `ModalAvanceAlcancePort`. El tipo `ModalResumenPendientesEmpleadosPort` queda anotado como "compat" porque `nomina-mensual-v2-empleados-resumen-pendientes.component.ts` aún lo importa aunque nadie lo monte.

### Archivos tocados

- `src/app/features/nomina-mensual/models/movimiento-nomina.models.ts` — nuevos tipos `FilaTrabajadorMovimientos`, `ItemMovimientoTrabajador`, `EstadoItemMovimiento`, `OrigenMovimientoTrabajador`; deprecation de `FilaMovimientoConfigurado`.
- `src/app/features/nomina-mensual/services/nomina-periodo.service.ts` (+ `.spec.ts`) — `listarMovimientosPorTrabajador`, `aplicarRecurrentesDeTrabajador`, `aplicarRecurrenteIndividual`, `eliminarMovimientoManual`.
- `src/app/features/nomina-mensual/data-access/nomina-periodo.repository.ts` — `eliminarMovimiento(id)` (hard-delete físico de `movimiento_nomina`).
- `src/app/features/nomina-mensual-v2/presenters/nomina-movimientos-por-trabajador.presenter.ts` (+ `.spec.ts`) — presenter declarativo (columnas + filtros + stats + etiquetas humanas).
- `src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-movimientos/` — `component.ts` + `.html` + `.css` + `.spec.ts` (refactor completo, eliminación de tabs).
- `src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/nomina-mensual-v2-container.{ts,html}` — limpieza de imports / viewChilds / handlers muertos.
- `src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-overlays/nomina-mensual-v2-overlays.{ts,html}` — limpieza de outputs y modales muertos.
- `src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/facade/nomina-mensual-v2-orquestador.port.ts` — eliminación de signals/tipos muertos.

### Archivos eliminados

- `src/app/features/nomina-mensual-v2/presenters/nomina-movimientos-configurados.presenter.{ts,spec.ts}`.
- `src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-alcance/*` (4 archivos).
- `src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-empleados/*` (3 archivos).

### Archivos NO tocados (guardrails)

- `angular.json`, `postcss.config.*`, `tailwind.config.*`, `src/styles*.css`, `src/styles/`, fuentes, tema.
- Motor de cálculo, liquidaciones productivas, SQL/RPC/RLS (el bridge HD→MR cierra en migraciones previas y no se altera).
- Ficha del trabajador legacy v6 (sigue editando `haberdescuento_persona`).
- Componentes `paso-parametros`, `paso-dotacion`, `paso-calculo`, `paso-validacion`, `paso-cierre`.
- Routing global, guards, menú.

### Validación

- `npx ng test --watch=false --include='**/nomina-mensual-v2/**/*.spec.ts'` → **224/224** (incluye 21 del presenter y 18 del componente).
- `npx ng test --watch=false --include='**/nomina-mensual/services/nomina-periodo.service.spec.ts'` → **48/48** (incluye 8 nuevos para `listarMovimientosPorTrabajador`, `aplicarRecurrentesDeTrabajador`, `eliminarMovimientoManual`).
- `npx ng build --configuration=development` → OK sin warnings de budget. Lazy chunk `nomina-mensual-v2-container` 794 kB.
- Suite global del paquete `nomina-mensual` reporta 2 fallos pre-existentes (`nomina-msgbox-lab.rules.spec.ts` y `proceso-mensual-flow-nav.rules.spec.ts`) por drift de etiquetas en módulos no tocados en esta fase.

---

## 2026-06-10 — Nómina v2 · Bridge `haberdescuento_persona` → `movimiento_recurrente`

Refactor estructural en BD. El tab "Configurados" del paso Movimientos no mostraba los haberes / descuentos persistentes que el usuario configura en la **ficha del trabajador** (tabla legacy `haberdescuento_persona`). Esta entrada documenta por qué pasaba y cómo se resolvió sin tocar la UI legacy.

### Motivación

Caso real reportado: trabajador `25.050.001-7` (Dependiente Activo Auditoria ERP, cargo "U1 auditoria") tiene un haber no imponible MOVILIZACION de **$20.000 mensual desde 2026-05-01** registrado en su ficha. Al entrar al paso Movimientos de la nómina v2, el tab "Configurados" salía vacío.

Diagnóstico contra BD remota (script `scripts/diag-mov-configurados-trabajador.mjs`):

| Tabla | Estado |
|---|---|
| `haberdescuento_persona` (LEGACY · ficha del trabajador) | 1 fila vigente con el haber |
| `movimiento_recurrente` (que lee la nómina v2) | **vacía** |

Las dos tablas cumplen el mismo rol semántico pero no estaban conectadas: la ficha del trabajador escribe en la primera (UI v6, sigue siendo la fuente de edición); la nómina v2 (rebuild jun 2026) lee solo la segunda.

### Decisiones

- **Bridge en BD, no en código de aplicación**: trigger `AFTER INSERT/UPDATE/DELETE` en `haberdescuento_persona` replica las filas a `movimiento_recurrente`. La ficha del trabajador NO se modifica; sigue siendo la única UI editable para los usuarios. La nómina v2 NO se modifica; sigue consumiendo solo `movimiento_recurrente`.
- **Traza de origen**: columna `movimiento_recurrente.id_haberdescuento_origen` (UNIQUE parcial). Permite (a) backfill idempotente, (b) upsert atómico desde el trigger, (c) auditoría futura ("este recurrente proviene de la ficha legacy"). NULL para recurrentes "nativos" creados directamente desde una UI propia de la nómina v2 (a futuro).
- **FK con `ON DELETE CASCADE`**: borrar el haber en la ficha legacy borra automáticamente la copia en MR. Sin huérfanos.
- **Mapeo declarativo** (resumen, detalles en la migración):
  - `id_persona` directo; `id_empresa` resuelto vía `contrato.id_empresa`.
  - `tipo` (texto) = `concepto.codigo` (ej. `MOVILIZACION`). Estable y legible.
  - `categoria` = `{HABER → haber, DESCUENTO → descuento, APORTE_EMPLEADOR → informativo}`.
  - `monto` directo; si HD tiene `porcentaje` en lugar de `monto`, se mapea a `cantidad` con `unidad='porcentaje'`.
  - `frecuencia` = `{MENSUAL → mensual, QUINCENAL → quincenal}`. Las filas con `OCASIONAL` / `UNICA` **no se migran**: no son recurrentes; pertenecen a `movimiento_nomina` del período concreto y no al catálogo persistente.
  - `estado` (boolean) → `{true → activo, false → finalizado}`. Las inactivas también se reflejan; el usuario ve "Configurado pero pausado" en lugar de no verlas.
- **Idempotente y repetible**: el backfill usa `WHERE NOT EXISTS … id_haberdescuento_origen = hd.id_asignacion`. Reaplicar la migración no duplica filas.
- **`haberdescuento_persona` queda DEPRECATED** en su `COMMENT ON TABLE`: la nómina v2 NO debe leerla. Mantenida porque otros lectores legacy (liquidación SQL `fn_generar_liquidacion`, entre otros) todavía dependen de ella. Su eliminación queda fuera de alcance — requiere fase específica que migre los lectores.

### Hallazgo lateral · RLS de `movimiento_recurrente`

Durante el debug se descubrió que la policy `movimiento_recurrente_all` (migración F2) estaba acotada a `TO authenticated USING (id_empresa = current_user_empresa_id())`. El frontend Angular del ERP usa el `anon` publishable key (no JWT con `app_metadata.id_empresa`), así que la policy nunca aplicaba al rol del caller y RLS negaba por defecto. Síntomas:

- INSERT directo en MR desde anon → `42501: new row violates row-level security policy`.
- El trigger HD→MR no podía escribir tampoco.

Solución: reemplazar la policy multi-empresa por policies abiertas por operación (`USING true` / `WITH CHECK true`), patrón uniforme con el resto del ERP (`empleados_alta_*` en `bd/base/v11/partes/08_seguridad_rls.sql`). El filtro multi-tenant se hace client-side en `NominaPeriodoService.resolverEmpresaActiva()`, igual que en empleados, contratos y parámetros. La RLS multi-empresa real queda pendiente de la fase de multi-tenant real (cuando Supabase Auth emita JWT con `app_metadata.id_empresa`).

### Archivos tocados

- `supabase/migrations/20260610200000_haberdescuento_persona_bridge_movimiento_recurrente.sql` — primer intento (función auxiliar `_fn_hd_to_mr_row` que terminó descartada por composición confusa).
- `supabase/migrations/20260610200500_haberdescuento_bridge_fix_inline.sql` — drop de la función auxiliar; trigger y backfill reescritos con SQL inline.
- `supabase/migrations/20260610210000_movimiento_recurrente_rls_anon_authenticated.sql` — abre RLS de MR para `anon` + `authenticated` y re-ejecuta el backfill (que en las migraciones anteriores fallaba silenciosamente por RLS).
- `supabase/migrations/20260610220000_hd_mr_fk_cascade.sql` — cambia la FK `id_haberdescuento_origen` de `ON DELETE SET NULL` a `ON DELETE CASCADE` (descubierto en el test E2E del trigger: el SET NULL ocurría ANTES que el trigger AFTER DELETE y dejaba huérfanos).
- `src/app/core/models/database.types.ts` — regenerado tras las DDL (`npx supabase gen types`). Incluye `id_haberdescuento_origen` y las relaciones nuevas.
- `scripts/diag-mov-configurados-trabajador.mjs` — diagnóstico por RUT que replica el cruce del servicio.
- `scripts/diag-hd-vs-mov-recurrente.mjs` — universo a migrar (distribución de tipos, periodicidades, porcentaje vs monto).
- `scripts/diag-hd-bridge.mjs` — verifica que MR se pueble a partir de HD.
- `scripts/test-trigger-hd-mr.mjs` — test E2E del trigger (INSERT → UPDATE → DELETE en HD; MR refleja los tres).
- `scripts/diag-nominas-existentes.mjs` — listado de todas las nóminas y sus dotaciones.
- `scripts/diag-mr-insert-directo.mjs` — INSERT directo desde anon, usado para diagnosticar el 42501 de RLS.
- `scripts/cleanup-mr-huerfano.mjs` — limpia el huérfano que dejó el test antes del fix de CASCADE.

### Archivos NO tocados

- Código Angular: el servicio `NominaPeriodoService.listarMovimientosConfigurados()`, el componente `nomina-mensual-v2-paso-movimientos.component.ts` y el presenter `nomina-movimientos-configurados.presenter.ts` quedan idénticos. El bug se resolvió 100% en BD.
- UI de la ficha del trabajador (legacy). Sigue editando `haberdescuento_persona` como siempre; el trigger se encarga del bridge.
- `haberdescuento_persona` (estructura, contrato, columnas). Solo se actualizó su `COMMENT ON TABLE` con la nota de deprecación.
- Estilos globales, fuentes, `angular.json`, motor de cálculo, liquidaciones productivas.

### Validación

- Test E2E del trigger (`scripts/test-trigger-hd-mr.mjs`): INSERT HD → MR creado con `id_haberdescuento_origen` correcto · UPDATE HD (monto $5.000 → $7.777) → MR refleja $7.777 · DELETE HD → MR borrado vía CASCADE.
- Diagnóstico contra el caso real (`scripts/diag-mov-configurados-trabajador.mjs 25050001-7 2026-06`): ahora aparece `rec=c80f5b03… | empresa=1 | tipo=MOVILIZACION | estado=activo | desde=2026-05-01 | monto=20000 | freq=mensual`. La próxima nómina que se cree para empresa 1 y período 2026-05 / 2026-06 con esta persona en la dotación verá el haber como **Pendiente de cargar** en el tab "Configurados".

### Pendientes documentados (fuera de alcance)

- Migrar los lectores legacy de `haberdescuento_persona` (`fn_generar_liquidacion` y similares) a `movimiento_recurrente` para poder hacer `DROP TABLE` definitivo. Requiere fase específica.
- UI propia de la nómina v2 para editar `movimiento_recurrente` directamente (sin pasar por la ficha legacy). Hoy se puede leer/usar, pero los conceptos nuevos siguen creándose desde la ficha del trabajador.
- Filtrado por `activo_desde` / `activo_hasta` contra el período de la nómina en `listarMovimientosConfigurados()` (sigue pendiente del 2026-06-06).

---

## 2026-06-10 — Administrador de nóminas · "Anular" se reemplaza por "Eliminar nómina" (hard-delete)

Refactor del menú de acciones por fila en el Administrador de nóminas. Sustituye el doble botón "Eliminar borrador" + "Anular" por una única acción **Eliminar nómina** que ejecuta DELETE físico en BD (en cascada).

### Motivación

El usuario reportó dos problemas que en realidad eran la misma causa:

1. *"Cada nómina debe ser distinta"*: el constraint `UNIQUE (id_empresa, periodo, tipo)` impedía rehacer la nómina del mes cuando una previa quedaba en estado `anulada`. Ese soft-delete bloqueaba el slot para siempre.
2. *"En vez de anular sea eliminar en las acciones de las listas"*: el copy "Anular" daba a entender un soft-delete reversible, pero la fila quedaba zombie sin valor operativo.

Solución: pasar a hard-delete. Al borrar físicamente la fila, las FKs declaradas `on delete cascade` purgan segmentos, movimientos, incidencias y eventos de auditoría asociados, y el slot único queda libre para recrear la nómina del mismo período.

### Decisiones

- **Una sola acción destructiva**: `Eliminar nómina` (icono `trash-2`, variante `danger`). Reemplaza al antiguo botón "Eliminar borrador" (solo borrador) y al antiguo "Anular nómina" (resto de estados). Un botón menos en cada fila.
- **Alcance conservador por estado**: la acción aparece solo para estados **no productivos**: `borrador`, `dotacion_generada`, `en_revision`, `anulada`. Para `calculada`, `validada`, `aprobada`, `cerrada` y `reabierta` queda oculta — esos estados tienen cálculo o liquidaciones vigentes y requieren un flujo de reversa (reabrir → corregir) antes de poder eliminar. La regla vive en `puedeEliminar(estado)`.
- **Sin motivo**: el dialog de confirmación no pide texto. El motivo histórico que registraba la anulación se borraba igual en cascada con los eventos de auditoría, así que el campo era teatro. Confirmación dura "Eliminar definitivamente" + copy claro sobre lo que se borra.
- **Copy del confirm**: *"Se eliminará la nómina junto con sus segmentos, movimientos, incidencias y eventos de auditoría. Esta operación no se puede deshacer. Tras eliminar podrás crear una nueva nómina para esta empresa, período y tipo."* — explícito sobre la irreversibilidad y sobre el efecto positivo (liberar el slot único).
- **El zombie `anulada` ahora se puede purgar**: el estado `anulada` queda disponible para "Eliminar" — así el usuario puede limpiar nóminas legacy soft-deleted que estaban bloqueando recrear el mismo período.
- **`puedeReabrir(estado === 'cerrada')` intacto**: el flujo "reabrir + eliminar" sigue disponible para el caso extremo de borrar una nómina cerrada, pero ya no se puede saltar el paso de reabrir.

### Archivos tocados

- [src/app/features/nomina-mensual/rules/admin-nominas.rules.ts](../../src/app/features/nomina-mensual/rules/admin-nominas.rules.ts) — `puedeEliminar(estado)` nuevo (con `switch` exhaustivo); `puedeAnular` y `puedeEliminarBorrador` eliminados; `AccionAdminNomina` ya no incluye `anular` ni `eliminar-borrador`, solo `eliminar`.
- [src/app/features/nomina-mensual/rules/admin-nominas.rules.spec.ts](../../src/app/features/nomina-mensual/rules/admin-nominas.rules.spec.ts) — suite reescrita: 8 tests cubren matriz de estados habilitados/bloqueados, presencia/ausencia de la acción `eliminar` y garantía de que `anular`/`eliminar-borrador` ya no existen.
- [src/app/features/nomina-mensual/data-access/nomina-periodo.repository.ts](../../src/app/features/nomina-mensual/data-access/nomina-periodo.repository.ts) — `eliminarNomina(id)` nuevo (DELETE sin filtro de estado). `eliminarBorrador` se conserva marcado `@deprecated` por compatibilidad histórica.
- [src/app/features/nomina-mensual/services/nomina-periodo.service.ts](../../src/app/features/nomina-mensual/services/nomina-periodo.service.ts) — `eliminarNomina(id)` nuevo. `anularNomina` eliminado del API público. `eliminarBorrador` queda como wrapper deprecated.
- [src/app/features/nomina-mensual/services/nomina-periodo.service.spec.ts](../../src/app/features/nomina-mensual/services/nomina-periodo.service.spec.ts) — un test nuevo que verifica que `eliminarNomina` llama a `repo.eliminarNomina` sin pasar por el wrapper de borrador.
- [src/app/features/nomina-mensual/containers/administrador-nominas-container/](../../src/app/features/nomina-mensual/containers/administrador-nominas-container/) — `.ts`, `.html` y `.spec.ts`: `AccionAdministrativa` reducido a `'eliminar' \| 'reabrir'`; un solo botón "Eliminar nómina" en la columna acciones; titulo/copy/handler del dialog adaptados; importación de iconos limpia (sin `OctagonX`).

### Archivos NO tocados

- Estilos globales, `angular.json`, `postcss.config.json`, `src/styles/**`, fuentes.
- SQL / migraciones / RLS / RPC: el cambio se apoya en la cascada FK que ya existía. No hace falta migración nueva.
- Motor de cálculo, liquidaciones productivas, novedades, movimientos variables, parámetros — todo fuera de alcance.
- Tipos de `EstadoNomina` — el estado `anulada` se mantiene en el dominio para no romper persistencia histórica; solo cambia el flujo que lo genera (ya nadie lo crea desde la UI; las filas legacy se pueden purgar).

### Riesgo aceptado

- La auditoría detallada del DELETE no se conserva: `evento_auditoria_nomina` se borra en cascada con la fila padre. Si en el futuro se requiere un trail post-mortem fuera del árbol, hay que armar una tabla `auditoria_historial_nomina` separada (scope futuro, no incluido aquí).

### Hotfix BD (mismo día, 2026-06-10 17:00 — bug en runtime)

Tras subir el cambio el usuario reportó *"no se están eliminando las nóminas"*. Causa raíz: la política RLS `nomina_periodo_delete` de la migración F2 estaba acotada a `estado = 'borrador'`, y PostgREST devuelve `error=null` con 0 filas afectadas cuando RLS filtra silenciosamente. El cliente creía haber tenido éxito y la fila quedaba ahí.

Solución:

- **Migración nueva** `20260610170000_nomina_periodo_delete_policy_estados_eliminables.sql`: la policy de DELETE ahora acepta `borrador, dotacion_generada, en_revision, anulada` (espejo server-side de `puedeEliminar()`). El tenant scope por empresa NO se relaja. Aplicada al proyecto remoto vía `npx supabase db push`.
- **Repo endurecido**: `eliminarNomina` ahora hace `.select('id')` tras el `.delete()` y lanza un error humano si vienen 0 filas (red de seguridad por si alguien intenta forzar el DELETE bypass-eando la UI y RLS filtra). 3 tests nuevos en `nomina-periodo.repository.spec.ts` cubren happy path, 0-rows-affected y error de supabase.

### Hotfix BD 2 — Cascada completa al eliminar (2026-06-10 17:30 — bug en runtime)

El usuario verificó la corrección anterior y reportó: *"hay un problema grande al eliminar nóminas, se quedan los datos internos de dichas nóminas, se deben eliminar todo lo relacionado interno y externo"*.

Causa raíz: la cascada por FK desde `nomina_periodo(id)` solo cubre las tablas hijas directas (`segmento_nomina`, `movimiento_nomina`, `incidencia_nomina`, `evento_auditoria_nomina`). El snapshot de cálculo vive en `nomina_calculo_periodo` (con sus hijos `nomina_calculo_trabajador`, `nomina_calculo_concepto`, `nomina_calculo_issue`, `nomina_calculo_trazabilidad`, `nomina_calculo_parametro`), y la FK que los une es **saliente** desde `nomina_periodo` (`id_calculo_periodo_vigente` con `on delete set null`) — apunta hacia el cálculo, no al revés. Resultado: al borrar la fila padre, los snapshots quedaban huérfanos.

Solución: RPC server-side atómico que purga todo en una transacción con validaciones explícitas.

- **Migración nueva** `20260610180000_eliminar_nomina_completa_rpc.sql`: crea `public.eliminar_nomina_completa(p_nomina_id uuid)` como `security definer` (las RLS de los snapshots no incluyen DELETE para `authenticated`, así que la función oficial es el único camino y la autorización vive dentro). Pasos del RPC:
  1. `current_user_empresa_id()` y `for update` de la cabecera.
  2. **Tenant check**: la nómina debe pertenecer a la empresa del usuario.
  3. **Estado eliminable**: `borrador | dotacion_generada | en_revision | anulada` — espejo server-side de `puedeEliminar()`.
  4. **Bloqueo por liquidaciones**: si existe alguna `nomina_liquidacion_periodo` apuntando a un `nomina_calculo_periodo` con `(id_empresa, periodo)` de la nómina, aborta con mensaje humano. Datos productivos no se borran por accidente.
  5. **Bloqueo por preparaciones**: si `nomina_preparacion` referencia los cálculos del período (FK `id_calculo_origen`), aborta.
  6. `update reemplazado_por = null` en los cálculos del período (rompe self-FK para permitir el DELETE multi-fila).
  7. `delete from nomina_calculo_periodo where id_empresa = ? and periodo = ?` — cascada limpia trabajador/concepto/issue/trazabilidad/parametro.
  8. `delete from nomina_periodo where id = ?` — cascada limpia segmentos/movimientos/incidencias/eventos.
  9. Retorna `jsonb` con conteos (`calculos_borrados`, `segmentos_borrados`, `movimientos_borrados`, `incidencias_borradas`) para diagnóstico.

  GRANT EXECUTE al rol `authenticated`. Aplicada al proyecto remoto vía `npx supabase db push`.

- **Repo simplificado**: `eliminarNomina(id)` ahora hace una sola llamada `supabase.rpc('eliminar_nomina_completa', { p_nomina_id: id })`. Los mensajes del RPC ya son legibles (estado no eliminable, liquidaciones existentes, preparaciones existentes, sin permisos), así que el repo los propaga **sin** anteponer el prefijo técnico `eliminarNomina:` — el modal del administrador muestra el texto directo.
- **Tests reescritos** en `nomina-periodo.repository.spec.ts`: 4 escenarios sobre el nuevo contrato — happy path con respuesta `jsonb`, error de estado no eliminable, bloqueo por liquidaciones (verifica que NO se agrega prefijo `eliminarNomina:`), bloqueo por preparaciones.
- **Tipos regenerados** (`npx supabase gen types`): el `database.types.ts` actualizado movió los args opcionales de `string | null` a `string | undefined`; ajustado `transicionarEstado` y `listarDotacionPaginada` para usar `?? undefined`. Sin cambio funcional (Supabase omite undefined al serializar y postgres usa `default null` igual).

Riesgos contemplados:

- Hay nóminas legacy `anulada` que vinieron de un cálculo previo (la transición `calculada → anulada` era válida en `transicionar_nomina_periodo`). Su snapshot quedaba huérfano hasta hoy. El RPC ahora las limpia correctamente.
- El bloqueo por liquidaciones es DURA: si una nómina llegó a `cerrada`, se reabrió y se anuló, pero quedaron `nomina_liquidacion_periodo` vivos, NO se podrá eliminar hasta que las liquidaciones se purguen por su propio flujo. Mensaje explícito al usuario.

---

## 2026-06-06 — Generador · Paso Movimientos · Tab "Configurados" con grilla expandible

Refactor del tab que antes se llamaba "Recurrentes" en el paso Movimientos del Generador v2. Sustituye una lista plana técnica + un botón críptico (`Aplicar recurrentes a la nómina`) por una grilla operativa orientada a RRHH, que responde a "¿qué movimientos tiene cada trabajador ya configurados y qué pasa con ellos este mes?".

### Motivación

La etiqueta `Recurrentes` + el botón `Aplicar recurrentes a la nómina` no le decían nada al usuario de RRHH. No quedaba claro a quién afectaba la acción, qué iba a "aplicar" ni qué pasaba con los que ya habían sido omitidos antes. La grilla anterior tampoco mostraba a qué trabajadores apuntaba cada recurrente — solo se veía la regla.

### Decisiones

- **Renombre del tab**: `Recurrentes` → `Configurados`. Lenguaje RRHH; "recurrente" es vocabulario interno del motor.
- **Vista derivada en el servicio**: nuevo `NominaPeriodoService.listarMovimientosConfigurados(nominaPeriodoId)`. Cruza los recurrentes activos × la dotación de la nómina × los movimientos del período. Una fila por par `(trabajador × concepto)`. NO persiste — es una proyección de solo lectura.
- **Identidad de fila estable**: `filaId = "${trabajadorId}::${recurrenteId}::${tipo}"`. Aporta `trackBy` y clave del set de expandidos sin colisiones aunque cambien filtros o se recarguen los datos.
- **Estado por fila** (lenguaje humano): `Pendiente de cargar`, `Ya cargado este mes`, `Omitido este mes`. La idempotencia de recurrentes queda visible: si una fila aparece como "Ya cargado" o "Omitido", la próxima carga NO la duplica ni la reaplica.
- **Grilla con `app-data-grid`**: misma base que Dotación. Columnas: Trabajador, RUT, Concepto, Tipo, Monto/cantidad, Vigencia, Estado este mes. Filtros: Estado este mes, Tipo, Buscar (tokens sobre nombre + RUT + concepto, normalizando acentos). Persistencia local `nomina-v2-movimientos-configurados-grid-v1`.
- **Filas expandibles**: cada fila se puede expandir con el chevron del `app-data-grid` (capacidad agregada el 2026-06-05). El detalle muestra TODOS los movimientos configurados del mismo trabajador, con su estado individual. Útil para revisar "la ficha" del trabajador sin abandonar la grilla.
- **CTA principal sustituido**: `Aplicar recurrentes a la nómina` → `Cargar movimientos configurados`. Si hay pendientes, muestra un badge con la cantidad (`Cargar movimientos configurados [3]`). Si no hay pendientes, queda deshabilitado con el copy `Sin pendientes por cargar`. Tooltip explicativo en ambos estados.
- **Mensajes resultado**: humanos. `"Se cargaron N movimientos configurados a la nómina."` cuando hay nuevos; `"No había movimientos pendientes por cargar."` cuando la carga fue no-op (todo ya estaba cargado u omitido).
- **Stats sobrios**: línea con `total / pendientes / ya cargados / omitidos`, en variante "stat-line" (sin chips ni boxes grandes), siguiendo el patrón sobrio acordado el 2026-06-05.
- **Detalle expandible**: cabecera con identidad del trabajador (nombre, RUT, cargo, centro de costo) + lista vertical de todos los conceptos configurados, cada uno con su estado individual y botón "Cerrar" que cierra solo esa fila (delegado por el `collapse` que provee `appDataGridRowDetail`).
- **Pendiente conocido (no bloqueante)**: el filtrado por `activo_desde` / `activo_hasta` de los recurrentes contra el período de la nómina sigue pendiente. Hoy se listan todos los recurrentes con `estado='activo'`. Cuando se aborde, debería marcarse como `Fuera de vigencia (excluido)` en lugar de aparecer como `Pendiente`. Documentado para no perder rastro.

### Archivos tocados

- [src/app/features/nomina-mensual/models/movimiento-nomina.models.ts](../../src/app/features/nomina-mensual/models/movimiento-nomina.models.ts) — nuevos tipos `EstadoMovimientoConfiguradoEnNomina` y `FilaMovimientoConfigurado`.
- [src/app/features/nomina-mensual/services/nomina-periodo.service.ts](../../src/app/features/nomina-mensual/services/nomina-periodo.service.ts) — nuevo método `listarMovimientosConfigurados`.
- [src/app/features/nomina-mensual/services/nomina-periodo.service.spec.ts](../../src/app/features/nomina-mensual/services/nomina-periodo.service.spec.ts) — 4 tests nuevos cubriendo empresa nula, nómina inexistente, cruce dotación × recurrentes × estado, y fallback de identidad.
- [src/app/features/nomina-mensual-v2/presenters/nomina-movimientos-configurados.presenter.ts](../../src/app/features/nomina-mensual-v2/presenters/nomina-movimientos-configurados.presenter.ts) — presenter nuevo: stats, etiquetas humanas, columnas, filtros, clave de persistencia.
- [src/app/features/nomina-mensual-v2/presenters/nomina-movimientos-configurados.presenter.spec.ts](../../src/app/features/nomina-mensual-v2/presenters/nomina-movimientos-configurados.presenter.spec.ts) — 9 tests para stats, etiquetas, columnas y filtros (búsqueda con tokens y normalización de acentos).
- [src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-movimientos/](../../src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-movimientos/) — `.component.ts`, `.html`, `.css` y `.spec.ts`: tab renombrado, integración con `app-data-grid`, CTA con tooltip, detalle expandible, 7 tests nuevos para la nueva tab.

### Archivos NO tocados

- Estilos globales, `angular.json`, `postcss.config.json`, `src/styles/**`, fuentes.
- Repositorio Supabase, RPCs, migraciones, motor de cálculo, payloads de inserción — todo el cambio es de proyección/UI sobre datos ya existentes.
- Tabs `Manuales` y `Omitidos este mes` — fuera de alcance de esta iteración, idénticos al patrón previo.
- Componente `app-data-grid` — sin cambios; reusamos la capacidad de filas expandibles añadida el 2026-06-05.

### Uso típico

```html
<app-data-grid
  [columns]="columnasConfigurados"
  [rows]="movimientosConfigurados()"
  [filters]="filtrosConfigurados()"
  [expandableRows]="true"
  [rowExpansionKey]="rowKeyConfigurado"
  [trackBy]="trackByConfigurado"
  [persistenceKey]="persistenciaConfigurados"
>
  <ng-template appDataGridCell="estado" let-fila="row">
    <span class="paso-mov__estado-pill" [attr.data-estado]="fila.estadoEnNomina">
      {{ etiquetaEstado(fila.estadoEnNomina) }}
    </span>
  </ng-template>
  <ng-template appDataGridRowDetail let-fila let-collapse="collapse">
    <!-- Detalle: TODOS los conceptos configurados de este trabajador -->
  </ng-template>
</app-data-grid>
```

---

## 2026-06-05 — `app-data-grid` · Filas expandibles opt-in (master-detail inline)

Capacidad nueva en la grilla compartida del ERP: filas con detalle expandible inline, opt-in y retro-compatible. Pensada para vistas donde el usuario necesita "ver todo lo del item" sin abandonar la grilla — caso concreto que motivó el cambio: revisar los movimientos configurados de un trabajador en el paso Movimientos del Generador.

### Decisiones

- **Opt-in puro**: la grilla no muestra el chevron si el consumidor no lo pide explícitamente. Para activarla hacen falta DOS cosas: `[expandableRows]="true"` Y proyectar `<ng-template appDataGridRowDetail let-row>` dentro del `<app-data-grid>`. Si solo se activa el flag pero no se proyecta el template, el chevron NO aparece (degradación silenciosa) — evita botones inertes por error.
- **Columna chevron al inicio**: ubicada entre la numeración (N°) y la selección, ancho fijo `2.25rem`. Botón cuadrado 24×24, fondo neutro en hover, sin sombra ni gradiente. Icono `chevron-right` colapsado / `chevron-down` expandido (Lucide).
- **Fila de detalle**: `<tr class="data-grid-row-detail">` con `<td colspan="N">` cubriendo todas las columnas. Fondo `#fafbfc` (apenas más suave que la fila principal), padding `12px 16px 14px`, sin separador adicional. La fila padre expandida pierde su `border-bottom` para soldarse visualmente con el detalle (sensación de "lámina única").
- **Estado preservado entre cargas**: input `rowExpansionKey: (row) => unknown` permite tracking estable por id de negocio cuando el dataset se regenera con cada fetch. Por defecto usa la referencia del objeto (válido para listas estáticas).
- **Mobile**: en el layout de tarjetas, el chevron aparece como botón completo "Ver detalle" / "Ocultar detalle" en la cabecera de la `<article>`, alineado a la derecha del contador N°. El detalle se renderiza en un bloque `.data-grid-mobile-row-detail` con borde-top y fondo sutil.
- **Limpieza automática**: cuando una fila sale del dataset (cambio de filtros, refresh), su entrada en el set de expandidos se purga en `pruneSelection()` para evitar fugas.
- **API expuesta**: `expansionEnabled` (getter), `isRowExpanded()`, `toggleRowExpansion()`, `collapseRowExpansion()`, `collapseAllExpansions()`, `rowDetailContext()` y el evento `rowExpandToggle({ row, expanded })` (útil para lazy-loading del detalle).

### Archivos tocados

- [src/app/shared/components/ui/data-grid/data-grid.types.ts](../../src/app/shared/components/ui/data-grid/data-grid.types.ts) — nuevo `DataGridRowDetailContext<T>`.
- [src/app/shared/components/ui/data-grid/data-grid.directives.ts](../../src/app/shared/components/ui/data-grid/data-grid.directives.ts) — nueva `DataGridRowDetailDirective` con selector `ng-template[appDataGridRowDetail]`.
- [src/app/shared/components/ui/data-grid/data-grid.component.ts](../../src/app/shared/components/ui/data-grid/data-grid.component.ts) — inputs `expandableRows`, `rowExpansionKey`, `expandRowLabel`, `collapseRowLabel`; output `rowExpandToggle`; estado `expandedRowKeys`; métodos `isRowExpanded`, `toggleRowExpansion`, `collapseRowExpansion`, `collapseAllExpansions`, `rowDetailContext`; getter `expansionEnabled`, `rowDetailTemplate`, `rowDetailColspan`; integración `pruneExpansion` en el ciclo de prune.
- [src/app/shared/components/ui/data-grid/data-grid.component.html](../../src/app/shared/components/ui/data-grid/data-grid.component.html) — `<col>`, `<th>`, `<td>` chevron y `<tr class="data-grid-row-detail">` con `colspan` dinámico; bloque mobile en la `<article>`.
- [src/app/shared/components/ui/data-grid/data-grid.component.css](../../src/app/shared/components/ui/data-grid/data-grid.component.css) — `.data-grid-expand-col`, `.data-grid-expand-cell`, `.data-grid-expand-btn` (estado normal, hover, focus, expanded), `.data-grid-row-detail-cell`, `.data-grid-row-detail-body`, `.data-grid-row--expanded`, `.data-grid-mobile-card-head`, `.data-grid-mobile-row-detail`.
- [src/app/shared/components/ui/data-grid/data-grid.component.spec.ts](../../src/app/shared/components/ui/data-grid/data-grid.component.spec.ts) — 8 tests nuevos en suite "filas expandibles".

### Archivos NO tocados

- Estilos globales, `angular.json`, `postcss.config.json`, `src/styles/**`, fuentes.
- Consumidores actuales del `app-data-grid` (todos los Admin, Dotación, Empresas, Empleados, Parámetros, etc.) — el flag por defecto es `false` y el comportamiento es idéntico al previo.
- Componente legado `src/app/shared/components/ui/data-grid.component.ts` (huérfano, sin consumidores) — sin cambios.

### Uso típico

```html
<app-data-grid
  [columns]="columnas"
  [rows]="filas"
  [expandableRows]="true"
  [rowExpansionKey]="rowIdFn"
  (rowExpandToggle)="onExpand($event)"
>
  <ng-template appDataGridRowDetail let-row let-collapse="collapse">
    <h4>Detalle de {{ row.nombre }}</h4>
    <p>…</p>
    <button (click)="collapse()">Cerrar</button>
  </ng-template>
</app-data-grid>
```

---

## 2026-06-05 — Generador V2 · Pestañas sin doble acoplamiento + KPI chips sofisticados

Pulido visual de la cabecera del Generador y de la franja de métricas del paso Dotación, en respuesta al feedback "quitar doble acoplamiento de bordes y cuidado con los radios en el tabbar de pasos; los chips grandes deben pasar a otros más sofisticados".

### Decisiones

- **Stepper plano full-bleed**: el `nomina-workflow-header.nmv2-stepper-card` pasa de "card con `border: 1px` + `border-radius: 6px 6px 0 0` y bordes laterales" a una **banda plana full-bleed** con un único `border-bottom: 1px solid #e2e8f0`. Mismo patrón que el shell de Admin y la versión global del listado. Quitar los radios del top elimina la sensación de "tab card flotante" sobre el contenido y evita el conflicto visual con cualquier wrapper inferior.
- **Pasos 2–6 sin borde de wrapper**: las secciones `.paso-dotacion / .paso-mov / .paso-calc / .paso-val / .paso-cierre` pierden `border: 1px` y `border-radius: 8px`. Quedan como **paneles blancos full-bleed** sobre el fondo de página, alineados al patrón del paso `parameters` (que ya era full-bleed). Esto resuelve el "doble acoplamiento" — antes se veían dos cards superpuestas (stepper + paso) con bordes y radios distintos. Padding interno se baja levemente (`16px 20px 20px` → `14px 16px 16px`) para densificar y emparejar con el listado del Admin.
- **KPI chips de Dotación → franja inline sobria con separadores**: las antiguas "mini-cards" verticales con borde y fondo de color (`2 TRABAJADORES`, `2 LISTOS`, `0 CON ADVERTENCIA`, etc.) se reemplazan por una **franja horizontal sobria**, calcada del patrón `.nmv2-paso-parametros__summary`:
  - Número a la izquierda en tipografía `tabular-nums`, label a la derecha en gris suave; alineados por baseline.
  - Separadores `border-right: 1px solid #eef0eb` entre métricas (el último no lleva separador).
  - La franja completa va envuelta entre `border-top` y `border-bottom` finos para servir de divisor entre la cabecera del paso y el cuerpo (la grilla).
  - El color solo se aplica al **número**, no al fondo: `is-listo` (verde sobrio), `is-advertencia` (ámbar), `is-critico` (rojo), `is-bloqueado` (gris). Sin pintar la fila con tonos suaves, sin chips ovalados decorativos, sin badges.
  - Sin caja, sin radio, sin sombra; tipografía reducida (14px número / 11.5px label) versus el chip anterior (18px / 11px). Más sofisticado y más operativo para RRHH.
- **Sin tocar la grilla `app-data-grid`**: el data-grid productivo conserva su propio chip de "trabajadores", su toolbar y sus filtros — no se tocó su estilo. Sigue siendo el "campo de datos" delimitado dentro del panel.
- **Sin cambios de HTML**: solo CSS local. La estructura `<div class="paso-dotacion__stats">` con `<span class="paso-dotacion__stat"><strong>…</strong><small>…</small></span>` queda igual; solo cambia el estilo aplicado.

### Archivos tocados

- [src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-stepper/nomina-mensual-v2-stepper.component.css](../../src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-stepper/nomina-mensual-v2-stepper.component.css) — stepper full-bleed: `border: 0; border-bottom: 1px solid #e2e8f0; border-radius: 0`.
- [src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-dotacion/nomina-mensual-v2-paso-dotacion.component.css](../../src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-dotacion/nomina-mensual-v2-paso-dotacion.component.css) — wrapper sin borde/radio; nueva franja KPI inline sobria con separadores.
- [src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-movimientos/nomina-mensual-v2-paso-movimientos.component.css](../../src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-movimientos/nomina-mensual-v2-paso-movimientos.component.css) — wrapper sin borde/radio.
- [src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-calculo/nomina-mensual-v2-paso-calculo.component.css](../../src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-calculo/nomina-mensual-v2-paso-calculo.component.css) — wrapper sin borde/radio.
- [src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-validacion/nomina-mensual-v2-paso-validacion.component.css](../../src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-validacion/nomina-mensual-v2-paso-validacion.component.css) — wrapper sin borde/radio.
- [src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-cierre/nomina-mensual-v2-paso-cierre.component.css](../../src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-cierre/nomina-mensual-v2-paso-cierre.component.css) — wrapper sin borde/radio.

### Archivos NO tocados

- Estilos globales, `angular.json`, `postcss.config.json`, `src/styles/**`, fuentes.
- HTML de los pasos (sin cambios de markup).
- TypeScript / lógica / contratos / servicios / SQL / RPC / motor.
- `app-data-grid` productivo (mantiene su propio borde y card class).
- Paso `parameters` (ya era full-bleed y ya seguía el patrón).
- Componente Stepper TS y su `.html` (solo se ajustó CSS de la card padre).
- Trazabilidad, overlays, modales, drawer.

### Validaciones ejecutadas

- `npx tsc --noEmit -p tsconfig.json` → sin errores.
- `ReadLints` en los 6 CSS modificados → sin warnings.
- Tamaños de CSS por componente: todos < 7kB (budget `anyComponentStyle` warning = 20kB / error = 24kB).

---

## 2026-06-05 — Pasos del Generador (2 al 6): ocupar el 100% del alto/ancho del contenido

Ajuste de layout transversal de los 5 pasos restantes del Generador V2 (`dotacion`, `movements`, `calculation`, `validation`, `closure`). Hasta ahora cada paso se renderizaba como una "card" autodimensionada por su contenido, dejando espacio vacío bajo la grilla/lista/checklist en pantallas anchas. Tras el cambio, cada paso llena el alto y el ancho disponibles entre el stepper y el borde inferior del shell, igual que el paso `parameters` ya lo hacía.

### Decisiones

- **Sin cambios de identidad visual**: se conserva el wrapper con borde NOIA (`1px solid #e2e8f0`), radio `8px`, padding interno (`16px 20px 20px`) y la pieza de footer con borde superior fino y CTA estándar. No se quitan tarjetas ni se introducen gradientes/sombras/colores nuevos.
- **Cadena flex extendida en el shell**: en `nomina-mensual-v2-container.css` se agregaron los selectores faltantes (`app-nomina-mensual-v2-paso-dotacion/movimientos/calculo/validacion/cierre` y `.paso-dotacion/.paso-mov/.paso-calc/.paso-val/.paso-cierre`) a la cadena `flex: 1 1 auto; min-height: 0; height: 100%;` que el paso `parameters` ya consumía. Mismo patrón que el de `.nmv2-paso-parametros` — sin reglas nuevas, solo se completa la lista.
- **`:host` de cada paso se vuelve flex**: cada componente reemplaza `:host { display: block; width: 100% }` por `:host { display: flex; flex: 1 1 auto; flex-direction: column; width: 100%; min-height: 0 }`. Es la condición para que el host se estire dentro de `.nmv2-step-frame`.
- **Zona principal de cada paso crece y hace scroll interno**: la región que naturalmente carga contenido variable se marca `flex: 1 1 auto; min-height: 0; overflow-y: auto`:
  - `dotacion` → `.paso-dotacion__grid-wrapper` (envuelve al `app-data-grid` productivo, que ya tiene su propio scroll).
  - `movimientos` → `.paso-mov__tab-body` (la tab activa).
  - `calculo` → scroll a nivel `.paso-calc` (panels apilados verticales) con el footer "anclado" abajo (`margin-top: auto`).
  - `validacion` → `.paso-val__list` (lista de incidencias) crece y el footer ancla abajo.
  - `cierre` → scroll a nivel `.paso-cierre` (checklist + form de reapertura) con footer anclado abajo.
- **Footer siempre visible cuando hay espacio**: en `calculo`, `validacion` y `cierre` se agregó `margin-top: auto` al `__footer`, manteniendo el patrón de "lista crece, footer queda abajo".

### Archivos tocados

- [src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/nomina-mensual-v2-container.css](../../src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/nomina-mensual-v2-container.css) — extensión de la cadena flex `nmv2-step-frame > paso-*` y nueva regla para `.paso-*` (mov/calc/val/cierre/dotacion).
- [src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-dotacion/nomina-mensual-v2-paso-dotacion.component.css](../../src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-dotacion/nomina-mensual-v2-paso-dotacion.component.css) — `:host` flex; `.paso-dotacion` flex-fill + `min-height: 0`; `.paso-dotacion__grid-wrapper` con `flex: 1 1 auto`.
- [src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-movimientos/nomina-mensual-v2-paso-movimientos.component.css](../../src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-movimientos/nomina-mensual-v2-paso-movimientos.component.css) — `:host` flex; `.paso-mov` flex-fill; `.paso-mov__tab-body` crece y scrollea.
- [src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-calculo/nomina-mensual-v2-paso-calculo.component.css](../../src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-calculo/nomina-mensual-v2-paso-calculo.component.css) — `:host` flex; `.paso-calc` flex-fill con `overflow-y: auto`; footer con `margin-top: auto`.
- [src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-validacion/nomina-mensual-v2-paso-validacion.component.css](../../src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-validacion/nomina-mensual-v2-paso-validacion.component.css) — `:host` flex; `.paso-val` flex-fill; `.paso-val__list` crece y scrollea; footer con `margin-top: auto`.
- [src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-cierre/nomina-mensual-v2-paso-cierre.component.css](../../src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-cierre/nomina-mensual-v2-paso-cierre.component.css) — `:host` flex; `.paso-cierre` flex-fill con `overflow-y: auto`; footer con `margin-top: auto`.

### Archivos NO tocados

- Estilos globales, `angular.json`, `postcss.config.json`, `src/styles/**`, fuentes.
- HTML de los pasos (no se renombraron clases ni se reestructuró markup).
- TypeScript / lógica / contratos / servicios / SQL / RPC.
- Paso `parameters` (ya estaba en la cadena flex desde la fase L5 2026-06).
- Stepper, hint de avance, overlays, trazabilidad y modales.

### Validaciones ejecutadas

- `npx tsc --noEmit -p tsconfig.json` → sin errores.
- ReadLints en los 6 archivos CSS modificados → sin warnings.
- Inspección visual del bundle dev: el reconstrucción incremental no reportó cambios de output (CSS-only en componentes already-bundled).

---

## 2026-06-05 — Dotación · "Agregar trabajadores" explícito + grilla migrada a `app-data-grid`

Refactor del paso 2 (Dotación) del Generador V2: la grilla pasa a usar el `app-data-grid` productivo (mismo componente que el Administrador) y se introduce un picker explícito para seleccionar qué trabajadores entran a la nómina, eliminando la dependencia del auto-poblado opaco que hacía aparecer la grilla vacía cuando no había segmentos.

### Decisiones

- **Picker explícito en lugar de auto-poblado opaco**: si la grilla de Dotación no muestra trabajadores (o si el RRHH quiere agregar más), aparece un nuevo botón primario **"Agregar trabajadores"** en la cabecera del paso. Abre un modal con la lista de trabajadores activos y aptos de la empresa, con selección múltiple, filtro de disponibilidad (`Solo elegibles` / `Ya en nómina`), ordenamiento y persistencia local de preferencias de columnas. Los trabajadores ya incluidos en algún segmento de la nómina aparecen marcados y no se vuelven a contar al confirmar la inclusión.
- **Acción de inclusión idempotente**: el nuevo `NominaPeriodoService.agregarTrabajadoresANomina(nominaId, ids)` agrega ids al segmento principal (el de menor `ordinal`). Si no existe ningún segmento, crea uno llamado `Dotación principal`. Deduplica contra los ids ya presentes en cualquier segmento, actualiza `total_trabajadores`, transiciona la nómina a `dotacion_generada` si estaba en `borrador`, y reusa `invalidarCalculoPorCambio` cuando ya había cálculo vigente. No toca SQL/RPC nuevas: reusa `upsertSegmento`.
- **Grilla migrada a `app-data-grid`**: se reemplaza la grilla HTML manual del paso por el `app-data-grid` productivo. Se ganan automáticamente: búsqueda integrada, filtros declarativos (`Estado`, `Incidencias`, `Movimientos`), ordenamiento, persistencia de preferencias (`nomina-v2-dotacion-grid-v1`), densidad NOIA, accesibilidad (selección con checkbox, headers con sort), responsividad. Las acciones masivas reusan el flujo `bulkActions` del data-grid (confirmación nativa), y la única acción expuesta es `Excluir de la nómina` (alineada con la fase anterior). Las píldoras de estado y la celda "Acciones / Ver detalle" se renderizan vía `<ng-template appDataGridCell="…">` para preservar la identidad visual previa.
- **Inputs eliminados que ya cubre el data-grid**: el toolbar custom (`busqueda`, chips por estado, selects de incidencias/movimientos, paginación manual) se elimina del template del paso. La página queda más liviana y obtiene la misma capacidad operativa a través del data-grid. Empty state queda con copy NOIA: `"Aún no hay trabajadores en esta dotación · Usa "Agregar trabajadores" para incluir personas en este período."`.
- **Confirmación inline para exclusiones bloqueadas**: si la previsualización de la exclusión vuelve `puedeAplicar: false`, el componente surface los mensajes del preview en el banner `paso-dotacion__error` (no se reabre un modal redundante porque el data-grid ya pidió confirmación antes de emitir la acción).
- **Sin nuevas paletas**: el modal usa el mismo set de colores y radios que `nomina-mensual-v2-modal-acceso-base-parametros` (modal lleno con backdrop, header eyebrow + título + subtítulo, footer con CTA secundaria y botón "Cerrar" deshabilitado mientras se aplica). Las píldoras `Elegible` / `Ya en nómina` usan los tonos NOIA estándar (verde sobrio / gris).

### Archivos tocados

- [src/app/features/nomina-mensual/services/nomina-periodo.service.ts](../../src/app/features/nomina-mensual/services/nomina-periodo.service.ts) — nuevo método `agregarTrabajadoresANomina(nominaId, ids)`.
- [src/app/features/nomina-mensual/services/nomina-periodo.service.spec.ts](../../src/app/features/nomina-mensual/services/nomina-periodo.service.spec.ts) — 6 tests nuevos para la inclusión masiva (dedupe, creación de segmento, idempotencia, validación de empresa activa, invalidación de cálculo).
- [src/app/features/nomina-mensual-v2/presenters/nomina-dotacion-grid.presenter.ts](../../src/app/features/nomina-mensual-v2/presenters/nomina-dotacion-grid.presenter.ts) — contrato declarativo `COLUMNAS_DOTACION` + `FILTROS_DOTACION` + `PERSISTENCIA_GRILLA_DOTACION` para `app-data-grid`.
- [src/app/features/nomina-mensual-v2/presenters/nomina-dotacion-grid.presenter.spec.ts](../../src/app/features/nomina-mensual-v2/presenters/nomina-dotacion-grid.presenter.spec.ts) — tests del contrato declarativo (columnas, predicados de filtros).
- [src/app/features/nomina-mensual-v2/presenters/nomina-incluir-trabajadores.presenter.ts](../../src/app/features/nomina-mensual-v2/presenters/nomina-incluir-trabajadores.presenter.ts) — nuevo presenter del picker: columnas, filtro de disponibilidad y clave de persistencia.
- [src/app/features/nomina-mensual-v2/presenters/nomina-incluir-trabajadores.presenter.spec.ts](../../src/app/features/nomina-mensual-v2/presenters/nomina-incluir-trabajadores.presenter.spec.ts) — tests del presenter del picker.
- [src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-modal-incluir-trabajadores/](../../src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-modal-incluir-trabajadores/) — nuevo modal picker (`.ts/.html/.css`).
- [src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-dotacion/](../../src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-dotacion/) — paso Dotación migrado a `app-data-grid` (`.ts/.html/.css`) y wireado al picker. CSS local reducido: se eliminaron `__toolbar`, `__filters`, `__grid-head`, `__grid-row`, `__pagination`, `__modal*` (ahora los provee el data-grid o ya no aplican).
- [src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-dotacion/nomina-mensual-v2-paso-dotacion.component.spec.ts](../../src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-dotacion/nomina-mensual-v2-paso-dotacion.component.spec.ts) — provider mock de `EmpleadosService`; 6 tests nuevos cubriendo `abrirPicker` / `cerrarPicker` / `incluirTrabajadores` (camino feliz + error) e `idsActualesEnNomina`.

### Archivos NO tocados

- Estilos globales, `angular.json`, `postcss.config.json`, `src/styles/**`.
- SQL / RPC / motor de cálculo / liquidaciones (la inclusión se resuelve con `upsertSegmento` existente).
- El paso `parameters`, `movements`, `calculation`, `validation`, `closure`.
- La regla `puedeAvanzarDotacion` y el contrato del Generador secuencial puro: el paso 2 sigue diagnosticando avance con el mismo `puedeContinuar()` puro.

### Validaciones ejecutadas

- `npx ng test --watch=false --include="**/nomina-mensual-v2/**/*.spec.ts" --include="**/nomina-mensual/services/**/*.spec.ts" --include="**/nomina-mensual/data-access/**/*.spec.ts"` → **322 tests pasando** (34 archivos).
- `npx tsc --noEmit -p tsconfig.app.json` → sin errores.

---

## 2026-06-05 — Generador secuencial puro: bloqueo de avance, candado en stepper, confirmación al volver atrás y "Avance" persistido

Refuerzo UX del Generador V2: el usuario solo puede avanzar al paso siguiente cuando el paso actual está "poblado correctamente" según criterio UI; volver a un paso previo siempre pide confirmación; y se persisten dos campos en `nomina_periodo` para diferenciar **dónde está el usuario visualmente** (`ultimo_paso_visitado`) de **cuánto avance real** se ha consolidado (`maximo_paso_completado`, monótono creciente). La bandeja del Administrador deja de mostrar "En curso: X" y pasa a mostrar **"Avance: X"** alimentado por el nuevo campo.

### Decisiones

- **"Completo" se decide en el cliente**, no solo en el estado server-side. Cada paso del Generador implementa un `puedeContinuar(): ResultadoAvancePaso` puro (sin side-effects) que el CTA del shell y el stepper consultan en tiempo real. `avanzar()` reusa internamente `puedeContinuar()` antes de ejecutar la acción terminal — el contrato queda explícito y testeable.
  - `parameters`: parámetros preparados y sin bloqueos de preparación.
  - `dotacion`: `puedeAvanzarDotacion(filas).puede === true`.
  - `movements`: al menos un movimiento aplicado (recurrente o manual).
  - `calculation`: cálculo vigente con resultado disponible.
  - `validation`: sin críticas y cálculo vigente.
  - `closure`: checklist completa.
- **Stepper con candado**: pasos cuyo índice supera el `indiceMaximoPasoAccesibleEfectivo` (intersección de estado server-side ∩ contenido completo cliente) se renderizan con la clase `nomina-step--locked`, ícono `lock` y tooltip `"Completa {paso anterior} para continuar."`. El click queda inerte. Mantiene la mismo lenguaje visual del paso "congelado V11" (sin paleta nueva, sin badges).
- **CTA "Continuar" del shell** con razón visible: `ShellPagePrimaryAction` ahora acepta un `tooltip?` opcional y el header pinta `[title]` + `[aria-label]` en el botón. Cuando `puedeContinuar()` devuelve `ok: false`, el botón queda `disabled` y muestra la razón concreta al hover (densidad NOIA: ya no hay banda decorativa adicional, la razón vive en el tooltip más la banda `ayudaAvance` existente).
- **Confirmación SIEMPRE al volver atrás**: cualquier retroceso desde el stepper (excepto a `parameters`, que tiene su propio modal específico cuando la base está preparada) abre un `MessageBox` uniforme con copy `"Vas a revisar {paso destino}. Si modificas algo, se invalidará el avance posterior."`, acciones `Cancelar` / `Continuar`. Centralizado en `intentarIrAPaso` para que ajustar el criterio en el futuro sea un cambio único.
- **Persistencia dual**: se mantiene `ultimo_paso_visitado` (donde está visualmente el usuario) y se agrega `maximo_paso_completado` + `maximo_paso_completado_at` (avance real, monótono creciente) mediante migración `20260606120000_nomina_periodo_maximo_paso_completado.sql` y RPC dedicada `actualizar_maximo_paso_completado_nomina`. La RPC compara posiciones en el orden canónico y solo escribe si el nuevo paso supera al actual; nunca retrocede. Tampoco toca `updated_at`. Cliente-side hay un `Map<nominaId, paso>` para dedupe estricto entre llamadas.
- **Rehidratación robusta**: la sesión ahora valida el `ultimoPasoVisitado` contra `indiceMaximoPasoAccesibleEfectivo(estado, indiceMaxContenido)`. Si el visitado quedó por encima del techo efectivo (p. ej. anulación, reapertura, contenido invalidado), el usuario cae al máximo accesible efectivo — no al `pasoInicial` — para no perder contexto.
- **Bandeja Admin**: el sub-renglón `Siguiente acción` deja de decir "En curso: X" y pasa a decir **"Avance: X"** usando el nuevo `maximoPasoCompletado`. El criterio para mostrarlo se mantiene (oculto cuando coincide con el próximo paso). Helper renombrado a `etiquetaMaximoPasoCompletado` con alias `etiquetaPasoVisitado` deprecado para no romper código terceros.

### Archivos tocados

- [supabase/migrations/20260606120000_nomina_periodo_maximo_paso_completado.sql](../../supabase/migrations/20260606120000_nomina_periodo_maximo_paso_completado.sql) — nueva migración (columnas + RPC monótona).
- [src/app/core/models/database.types.ts](../../src/app/core/models/database.types.ts) — `nomina_periodo` agrega `maximo_paso_completado` / `maximo_paso_completado_at`; `Functions` declara `actualizar_maximo_paso_completado_nomina`.
- [src/app/features/nomina-mensual/models/nomina-periodo.models.ts](../../src/app/features/nomina-mensual/models/nomina-periodo.models.ts) — `NominaPeriodoResumen` y `NominaPeriodo` exponen `maximoPasoCompletado?` y `maximoPasoCompletadoAt?`.
- [src/app/features/nomina-mensual/mappers/nomina-periodo.mapper.ts](../../src/app/features/nomina-mensual/mappers/nomina-periodo.mapper.ts) — leen las columnas nuevas con `parsePayrollStepId` (valores legacy degradan a `null`).
- [src/app/features/nomina-mensual/data-access/nomina-periodo.repository.ts](../../src/app/features/nomina-mensual/data-access/nomina-periodo.repository.ts) — nuevo `actualizarMaximoPasoCompletado(id, paso)`.
- [src/app/features/nomina-mensual/services/nomina-periodo.service.ts](../../src/app/features/nomina-mensual/services/nomina-periodo.service.ts) — `registrarPasoCompletado(id, paso)` con dedupe monótono (solo invoca RPC si el paso supera al último registrado). Tolerante a errores (`console.warn`).
- [src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/facade/nomina-mensual-v2-navegacion.ts](../../src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/facade/nomina-mensual-v2-navegacion.ts) — `PasoNominaPort` con `puedeContinuar()` + `avanzar()`; helpers `puedeContinuarPaso`, `indiceMaximoPasoAccesibleEfectivo`, `obtenerEtiquetaBrevePaso`, `tooltipPasoNoAccesible`.
- [src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-dotacion/](../../src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-dotacion) — implementa `puedeContinuar()`.
- [src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-movimientos/](../../src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-movimientos) — `puedeAvanzar` ahora requiere `movimientosAplicados.length > 0`; implementa `puedeContinuar()`.
- [src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-calculo/](../../src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-calculo), [paso-validacion/](../../src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-validacion), [paso-cierre/](../../src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-cierre) — implementan `puedeContinuar()` (cálculo vigente, sin críticas, checklist).
- [src/app/layout/shell-page-context.service.ts](../../src/app/layout/shell-page-context.service.ts) — `ShellPagePrimaryAction.tooltip?: string | null`.
- [src/app/layout/header.component.ts](../../src/app/layout/header.component.ts) — CTA refleja `tooltip` como `[attr.title]` + `[attr.aria-label]`.
- [src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-stepper/nomina-mensual-v2-stepper.component.ts](../../src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-stepper/nomina-mensual-v2-stepper.component.ts) + `.html` + `.css` — input `indiceMaximoAccesible`, método `pasoNoAccesible`, ícono `lock`, tooltip, click bloqueado, clases `nomina-step--locked` / `step-status--locked`.
- [src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/facade/nomina-mensual-v2-orquestador.port.ts](../../src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/facade/nomina-mensual-v2-orquestador.port.ts) — `modalConfirmarRetroceso` signal + `ModalConfirmarRetrocesoPort`.
- [src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-overlays/](../../src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-overlays) — render del MessageBox uniforme de retroceso.
- [src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/nomina-mensual-v2-container.ts](../../src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/nomina-mensual-v2-container.ts) + `.html` — computed `pasoActualCompleto`, `indiceMaximoCompletadoPorContenido`, `indiceMaximoAccesibleEfectivo`; effect que registra el máximo completado; `intentarIrAPaso` dispara la confirmación; el stepper recibe el nuevo input.
- [src/app/features/nomina-mensual-v2/services/nomina-mensual-v2-sesion.service.ts](../../src/app/features/nomina-mensual-v2/services/nomina-mensual-v2-sesion.service.ts) — rehidratación valida contra `indiceMaximoPasoAccesibleEfectivo` y cae al máximo accesible si el visitado quedó fuera.
- [src/app/features/nomina-mensual/containers/administrador-nominas-container/utils/admin-nominas-presentacion.util.ts](../../src/app/features/nomina-mensual/containers/administrador-nominas-container/utils/admin-nominas-presentacion.util.ts) — `etiquetaMaximoPasoCompletado` (con alias `etiquetaPasoVisitado` deprecado); `mostrarEnCurso` ahora compara contra `maximoPasoCompletado`.
- [src/app/features/nomina-mensual/containers/administrador-nominas-container/administrador-nominas-container.html](../../src/app/features/nomina-mensual/containers/administrador-nominas-container/administrador-nominas-container.html) + `.ts` — sub-renglón "Avance: X".
- Specs nuevos/extendidos: `nomina-periodo.mapper.spec.ts` (+ 2 tests `maximo_paso_completado`), `nomina-periodo.repository.spec.ts` (+ 2 tests RPC monótona), `nomina-periodo.service.spec.ts` (+ describe `registrarPasoCompletado`), `nomina-mensual-v2-sesion.service.spec.ts` (rehidratación con accesibilidad efectiva), `nomina-mensual-v2-navegacion.spec.ts` (+ `puedeContinuarPaso`, `indiceMaximoPasoAccesibleEfectivo`, `obtenerEtiquetaBrevePaso`, `tooltipPasoNoAccesible`), `nomina-mensual-v2-stepper.component.spec.ts` (nuevo, candado + click bloqueado), `header.component.spec.ts` (+ tooltip CTA), `admin-nominas-presentacion.util.spec.ts` (renombre/alias), `administrador-nominas-container.spec.ts` (Tests 48–49 ahora con `maximoPasoCompletado`), y `puedeContinuar()` por componente paso (dotacion/movements/calculo/validacion/cierre).

### Archivos NO tocados (auditoría rápida)

- `angular.json`, `postcss.config.json`, `tailwind.config.*`, `src/styles.css`, `src/styles/*` — sin cambios globales.
- Estilos de marca, paleta NOIA, tipografía: sin cambios.
- Motor de cálculo, liquidaciones productivas, RPC de cierre/anulación: sin cambios.
- Rutas/guards globales: sin cambios.

### Notas operativas

- La migración SQL **no se aplica automáticamente** en este repo (la `supabase/migrations` se aplica en deploy). Mientras no esté presente en BD, el `console.warn` del service tolera el fallo del RPC y la UI sigue funcionando con el comportamiento legacy (el campo queda `null`, la bandeja muestra "Sin iniciar" si corresponde).
- Si la nómina se **anula**, `indiceMaximoPasoAccesibleEfectivo` devuelve `-1` y el stepper queda completamente bloqueado (consistente con la regla "anulada → no rehidratar").
- Si la nómina se **reabre**, el techo de estado vuelve a `closure`, pero `maximo_paso_completado` no se rebobina; el usuario puede revisar todo el flujo según el contenido ya consolidado.

---

## 2026-06-05 - Generador + Administrador: "En curso: X" persistente (paso visitado)

Pequeño aporte UX sin reorganización de pantalla. Cada vez que el usuario cambia de paso dentro del Generador, ese paso se persiste server-side en `nomina_periodo` (metadata UX, fuera de la máquina de estados). Al volver a entrar al generador, el container rehidrata el paso. En la bandeja del Administrador la celda `Siguiente acción` muestra debajo un sub-renglón gris `En curso: X` cuando el paso visitado no coincide con el próximo paso recomendado.

### Decisiones

- **No se crea una columna nueva** en la grilla del Administrador. La información va como sub-renglón de la celda `Siguiente acción` para mantener la densidad NOIA y no inflar el ancho de la tabla. El estilo del sub-renglón es sobrio: `11px / color: #64748b / weight: 400`, sin separador ni icono.
- **El sub-renglón no aparece** si la fila no tiene paso visitado o si el paso visitado coincide con el próximo paso (evita decir "En curso: Cálculo" en una fila cuyo próximo paso ya es Cálculo).
- **Server-side**: nueva migración SQL (`20260605130000_nomina_periodo_paso_visitado.sql`) con `ALTER TABLE` para dos columnas opcionales (`ultimo_paso_visitado`, `paso_visitado_at`) y RPC dedicada `actualizar_paso_visitado_nomina`. La RPC **no** toca `updated_at` para no contaminar el orden por "Actualizada" (que sigue reflejando cambios de negocio reales).
- **Rehidratación**: automática al abrir el generador. La regla de accesibilidad usa una matriz por estado (`indiceMaximoPasoAccesible`); si la nómina retrocedió (p. ej. invalidación de cálculo) y el paso visitado ya no es alcanzable, se descarta y se cae al `pasoInicial` derivado del estado de parámetros.
- **Invalidación de cálculo**: el paso visitado **se mantiene tal cual**. La banda "Cálculo no vigente" del paso de cálculo (lote previo) ya explica el desfase. No se rebobina server-side.
- **Dedupe en memoria**: el service tiene un `Map<nominaId, paso>` que evita escribir el mismo paso dos veces seguidas dentro de la misma sesión. El effect del container también pre-hidrata ese cache al rehidratar para que el primer cambio no provoque una escritura redundante.

### Archivos tocados

- [supabase/migrations/20260605130000_nomina_periodo_paso_visitado.sql](../../supabase/migrations/20260605130000_nomina_periodo_paso_visitado.sql) — migración SQL + RPC dedicada.
- [src/app/core/models/database.types.ts](../../src/app/core/models/database.types.ts) — `nomina_periodo` agrega `ultimo_paso_visitado` y `paso_visitado_at` (Row/Insert/Update); `Functions` declara `actualizar_paso_visitado_nomina`.
- [src/app/features/nomina-mensual/models/nomina-periodo.models.ts](../../src/app/features/nomina-mensual/models/nomina-periodo.models.ts) — `NominaPeriodoResumen` y `NominaPeriodo` exponen `ultimoPasoVisitado?` y `pasoVisitadoAt?`; nuevo helper `parsePayrollStepId` para sanear valores legacy.
- [src/app/features/nomina-mensual/mappers/nomina-periodo.mapper.ts](../../src/app/features/nomina-mensual/mappers/nomina-periodo.mapper.ts) — `rowToNominaPeriodoResumen` y `ensamblarNominaPeriodo` leen las columnas nuevas; valores desconocidos degradan a `null`.
- [src/app/features/nomina-mensual/data-access/nomina-periodo.repository.ts](../../src/app/features/nomina-mensual/data-access/nomina-periodo.repository.ts) — nuevo `actualizarUltimoPasoVisitado(id, paso)` que invoca el RPC.
- [src/app/features/nomina-mensual/services/nomina-periodo.service.ts](../../src/app/features/nomina-mensual/services/nomina-periodo.service.ts) — `registrarPasoVisitado(id, paso)` con dedupe y `console.warn` tolerante (no rompe UI si la migración aún no se aplicó).
- [src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/facade/nomina-mensual-v2-navegacion.ts](../../src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/facade/nomina-mensual-v2-navegacion.ts) — refactor de `indiceUltimoPasoCompletado` y nuevas funciones `indiceUltimoPasoCompletadoPorEstado` y `indiceMaximoPasoAccesible`.
- [src/app/features/nomina-mensual-v2/services/nomina-mensual-v2-sesion.service.ts](../../src/app/features/nomina-mensual-v2/services/nomina-mensual-v2-sesion.service.ts) — `EstadoSesionNominaV2` agrega `pasoVisitadoSugerido`; `resolverEstadoSesion(periodo, nominaPeriodoId?)` resuelve el paso visitado contra la matriz de accesibilidad.
- [src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/nomina-mensual-v2-container.ts](../../src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/nomina-mensual-v2-container.ts) — effect de rehidratación + effect de guardado con flag `pasoVisitadoRehidratado` para evitar pisado durante el arranque.
- [src/app/features/nomina-mensual/containers/administrador-nominas-container/utils/admin-nominas-presentacion.util.ts](../../src/app/features/nomina-mensual/containers/administrador-nominas-container/utils/admin-nominas-presentacion.util.ts) — helpers `etiquetaPasoVisitado` y `mostrarEnCurso`.
- [src/app/features/nomina-mensual/containers/administrador-nominas-container/administrador-nominas-container.ts](../../src/app/features/nomina-mensual/containers/administrador-nominas-container/administrador-nominas-container.ts) — expone los helpers nuevos.
- [src/app/features/nomina-mensual/containers/administrador-nominas-container/administrador-nominas-container.html](../../src/app/features/nomina-mensual/containers/administrador-nominas-container/administrador-nominas-container.html) — wrapper `.adm-nom__next-step-wrapper` con el sub-renglón opcional `<small class="adm-nom__en-curso">`.
- [src/app/features/nomina-mensual/containers/administrador-nominas-container/administrador-nominas-container.css](../../src/app/features/nomina-mensual/containers/administrador-nominas-container/administrador-nominas-container.css) — clases `.adm-nom__next-step-wrapper` y `.adm-nom__en-curso`.
- Specs nuevos/extendidos: `nomina-periodo.mapper.spec.ts` (nuevo), `nomina-periodo.repository.spec.ts` (+ RPC), `nomina-periodo.service.spec.ts` (+ describe `registrarPasoVisitado`), `nomina-mensual-v2-sesion.service.spec.ts` (nuevo), `nomina-mensual-v2-navegacion.spec.ts` (+ matriz de accesibilidad), `admin-nominas-presentacion.util.spec.ts` (Tests 31–36), `administrador-nominas-container.spec.ts` (Tests 48–49).

### Archivos NO tocados

Motor de cálculo, `proceso-mensual.service.ts`, `nomina-calculo-snapshot.repository.ts`, reglas `nomina-periodo-state.rules.ts`, `app-data-grid` compartido, estilos globales (`src/styles/**`, `angular.json`, `postcss.config.json`, Tailwind, fuentes), RPC `transicionar_nomina_periodo` y el resto de migraciones SQL.

### Validación

- `npx ng test --watch=false --include` sobre los 7 specs tocados: 113/113 verdes (75 + 38).
- Specs pre-existentes en rojo que no pertenecen a este alcance se mantienen igual (no se tocaron).

### Caveats

- Requiere aplicar la migración `20260605130000_nomina_periodo_paso_visitado.sql` (Supabase). Mientras no se aplique, el RPC `actualizar_paso_visitado_nomina` no existe y el service traga el error con `console.warn`; la UI no rompe pero el sub-renglón "En curso" no aparecerá en la bandeja.
- Si el equipo regenera `database.types.ts` automáticamente con `supabase gen types typescript`, hay que ejecutarlo después de aplicar la migración para que las columnas y la RPC queden tipadas oficialmente (entretanto, el repo funciona porque las propiedades están declaradas a mano y todas son opcionales).
- Multi-usuario concurrente sobre la misma nómina: dos usuarios editando a la vez pueden pisarse el campo. Aceptado porque es metadata UX, no parte de la máquina de estados.

---

## 2026-06-05 - Administrador de nóminas: pulido de bandeja (filtros, columna Acciones, celdas y prioridad)

Lote de pulido visual de la bandeja del Administrador de Nóminas. Solo presentación: sin cambios en servicios, motor, SQL/RPC/RLS, estilos globales, `angular.json`, fuentes, Tailwind, ni persistencia. Resuelve duplicidad de filtros, da contexto humano a las celdas y devuelve identidad a la columna de acciones.

### Cambios visuales

- **Vista operativa simplificada a 3 opciones** (`Requieren acción`, `Con críticas`, `Todas`) para eliminar el solapamiento con el filtro granular `Estado`. Los subsets `Abiertas`, `En cálculo` y `Pendientes de cierre` desaparecen del select porque ya quedaban cubiertos por la combinación Vista operativa + Estado. Valores legacy en `localStorage` degradan a "Todas" sin romper la sesión.
- **Columna Acciones con título visible**: pasa de `header: ''` (sin encabezado) a `header: 'Acciones'` centrado y con el mismo peso visual (`font-semibold`) que el resto de cabeceras, sin icono de orden (`sortable: false`). Los botones por fila se alinean al centro de la celda.
- **Siguiente acción con icono y marca de prioridad**: cada paso lleva su icono lucide inline (`settings`/`users`/`repeat`/`calculator`/`shield-check`/`lock`/`receipt`/`minus`). Cuando la fila requiere acción o tiene incidencias críticas se activa una marca sutil (`is-priority`: punto + tinte ámbar) en esa misma celda, sin barra lateral fuerte ni tinte de fila completa.
- **Incidencias con tooltip desglosado**: el `title` del chip pasa a mostrar `N críticas · M avisos` cuando aplique, en lugar del conteo aislado.
- **Actualizada con tooltip de fecha completa**: la celda mantiene el texto relativo (`Hoy`, `Ayer`, `Hace N días`, `dd/mm/yyyy`) y agrega `title="dd/mm/yyyy HH:mm"`.
- **Foco accesible en los botones por fila**: `:focus-visible` con outline azul 2px (rojo en la variante danger), sin alterar el tamaño/borde base.
- **Empty states diferenciados**: `emptyTitleWhenFiltered="Sin resultados con los filtros actuales"` distingue "no hay nóminas" de "no hay resultados con los filtros".
- **Subtítulo del shell**: deja de hablar de "abiertas" (vista eliminada) y refleja el estado real: `N nóminas en seguimiento · X requieren acción · Y con críticas.`

### Archivos tocados

- [src/app/features/nomina-mensual/presenters/admin-nominas.presenter.ts](../../src/app/features/nomina-mensual/presenters/admin-nominas.presenter.ts) — tipo `VistaOperativaAdminNominas` reducido, `crearFiltrosAdminNominas` con 3 opciones, `coincideVistaOperativa` con fallback legacy, columna `acciones` con `header`/`align`/`headerClass`.
- [src/app/features/nomina-mensual/containers/administrador-nominas-container/utils/admin-nominas-presentacion.util.ts](../../src/app/features/nomina-mensual/containers/administrador-nominas-container/utils/admin-nominas-presentacion.util.ts) — nuevos helpers `proximoPasoToIcon`, `formatearActualizadaCompleta`, `desgloseIncidencias`.
- [src/app/features/nomina-mensual/containers/administrador-nominas-container/administrador-nominas-container.ts](../../src/app/features/nomina-mensual/containers/administrador-nominas-container/administrador-nominas-container.ts) — `subtitulo()` reescrito, helper `esFilaPrioritaria`, expone helpers nuevos.
- [src/app/features/nomina-mensual/containers/administrador-nominas-container/administrador-nominas-container.html](../../src/app/features/nomina-mensual/containers/administrador-nominas-container/administrador-nominas-container.html) — celdas `proximoPaso`, `incidencias`, `actualizada` enriquecidas; copy de `empty*` diferenciado.
- [src/app/features/nomina-mensual/containers/administrador-nominas-container/administrador-nominas-container.css](../../src/app/features/nomina-mensual/containers/administrador-nominas-container/administrador-nominas-container.css) — `.adm-nom__next-step` con flex/icono/`is-priority`, `:focus-visible` en `.adm-nom__row-action`, `justify-content: center` para la celda Acciones.
- Specs alineadas: `admin-nominas.presenter.spec.ts`, `admin-nominas-presentacion.util.spec.ts`, `administrador-nominas-container.spec.ts` (+ iconos lucide adicionales en el `LucideAngularModule.pick` del test bed).

### Archivos NO tocados

`src/app/shared/components/ui/data-grid/*`, estilos globales (`src/styles/**`, `angular.json`, `postcss.config.json`), motor de cálculo, servicios productivos, persistencia, mappers, payloads ni reglas de negocio.

### Validación

- `npx ng test --watch=false --include` scoped a los 3 specs del feature → 38/38 verdes.
- `npx ng test --watch=false` completo: 1545/1550. Los 5 fallos pertenecen a archivos fuera de este alcance (`liquidaciones-oficiales.service.spec`, `nomina-msgbox-lab.rules.spec`, `proceso-mensual-flow-nav.rules.spec`, `form-empleado.spec`) y son pre-existentes; no se modificaron en este lote.
- `npx ng build` no introdujo nuevos budgets CSS. Los warnings/errors de budget pre-existentes (`nomina-mensual-v2-container.css`, `proceso-mensual-container.css`, etc.) no involucran a `administrador-nominas-container.css`.

### Caveats

- Si un usuario tenía `vistaOperativa = "abiertas" | "en-calculo" | "pendientes-cierre"` cacheado en `localStorage`, el predicado degrada a "Todas". Si se necesita restaurar el filtro inicial se debe rotar `PERSISTENCIA_GRILLA_ADMIN` (no se hizo en este lote para no descartar las otras preferencias del usuario; el degrade ya es seguro).
- Tooltips siguen usando `title` nativo (NOIA: sin librerías de tooltips). Si se quiere mejor presentación, hay que cerrar otro lote.

---

## 2026-06-05 - Administrador de nóminas: loader, filtro operativo y acciones compactas

Se elimina la franja independiente "Resumen operativo del administrador" y sus métricas pasan al primer filtro de `app-data-grid`, denominado `Vista operativa`. La vista inicial es `Requieren acción` y conserva las alternativas Abiertas, En cálculo, Pendientes de cierre, Con críticas y Todas, incluyendo sus cantidades.

- La carga inicial y las recargas administrativas usan `app-workspace-loading` superpuesto a la grilla.
- La columna de acciones muestra únicamente iconos de 30 px. Cada control mantiene `title` visible al pasar el cursor y `aria-label` contextual para tecnologías de asistencia.
- El acceso al generador conserva el tratamiento primario; eliminar y anular usan tono de peligro.
- La clave local de preferencias de la grilla cambia a `admin-nominas-grid-v2` para aplicar el nuevo filtro inicial sin configuraciones heredadas.
- Alcance exclusivo de presentación y estado local del administrador: sin cambios en servicios, motor, SQL/RPC/RLS ni persistencia de nómina.

---

## 2026-06-05 - Lote estructural P0 AG-NAV-03 + AG-CTA-01 + AG-NAV-02

Tres fases secuenciales para unificar el CTA del generador en el shell, derivar el stepper desde evidencia persistida y exponer un comando de avance tipado por paso. Es el lote estructural recomendado en §15 de [`auditoria-admin-generador-nomina-2026-06.md`](modulos/nomina-mensual/auditorias/auditoria-admin-generador-nomina-2026-06.md) tras cerrar el sub-lote P0 anterior (2026-06-05). Cero cambios en motor, dominio, SQL/RPC/RLS, estilos globales, `angular.json`, Tailwind, fuentes ni persistencia.

### Decisiones de diseño fijadas

- **Híbrido acotado**: el CTA del shell dispara la **operación terminal** sólo en Dotación (confirmar), Validación (aprobar) y Cierre (abrir modal de confirmación). En Movimientos y Cálculo el CTA es **solo navegacional**; los botones operativos `Calcular nómina`, `Aplicar recurrentes` y `Agregar movimiento manual` se mantienen inline porque son acciones repetibles.
- **Labels del CTA** para los dos pasos navegacionales pasan a reflejar su carácter de avance: `Aplicar movimientos` → `Continuar al cálculo`; `Procesar cálculo` → `Continuar a validación`.
- **Stepper desde evidencia**: `obtenerEstadoPaso(stepId, pasoActual, nomina)` usa `nomina.estado` + `evidenciaCalculo.calculoVigente` en lugar de posición visitada. `reabierta` regresa cierre a pending (cierre deshecho). `anulada` deshace toda la vigencia operativa: todos los pasos `pending`.
- **Tests**: unidad del facade (matrix por estado del enum + delegación pura) + cada `avanzar()` por paso. Sin E2E nuevo.

### Fase A — AG-NAV-03: comando único de avance por paso

Cada componente de paso 2–6 expone `avanzar(): Promise<ResultadoAvancePaso>` implementando el puerto `PasoNominaPort`. El container reescribe `ejecutarAccionPrincipalPasoActual()` como async: para `parameters` mantiene la rama del orquestador (modales de acceso/diferencias); para el resto delega vía la función pura `ejecutarAvancePaso(pasoActual, paso)` del facade. Si el comando retorna `{ok:true}` y existe `siguientePaso`, navega; si `{ok:false}` publica `razon` en `ayudaAvance` con tono `bloqueo`. `closure` es terminal: no navega tras `ok:true` (el modal toma el control).

- Archivos tocados (TS):
  - [`facade/nomina-mensual-v2-navegacion.ts`](../../src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/facade/nomina-mensual-v2-navegacion.ts) (tipos `ResultadoAvancePaso`, `PasoNominaPort`, función pura `ejecutarAvancePaso`, labels actualizados).
  - [`nomina-mensual-v2-container.ts`](../../src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/nomina-mensual-v2-container.ts) (5 `viewChild` nuevos por paso, helper `obtenerPasoActivoConComando`, `ejecutarAccionPrincipalPasoActual` async).
  - [`nomina-mensual-v2-paso-dotacion.component.ts`](../../src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-dotacion/nomina-mensual-v2-paso-dotacion.component.ts) (`avanzar` terminal: confirma).
  - [`nomina-mensual-v2-paso-movimientos.component.ts`](../../src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-movimientos/nomina-mensual-v2-paso-movimientos.component.ts) (`avanzar` navegacional con guard `aplicando`).
  - [`nomina-mensual-v2-paso-calculo.component.ts`](../../src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-calculo/nomina-mensual-v2-paso-calculo.component.ts) (`avanzar` navegacional con guard de cálculo vigente).
  - [`nomina-mensual-v2-paso-validacion.component.ts`](../../src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-validacion/nomina-mensual-v2-paso-validacion.component.ts) (`avanzar` terminal: aprueba).
  - [`nomina-mensual-v2-paso-cierre.component.ts`](../../src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-cierre/nomina-mensual-v2-paso-cierre.component.ts) (`avanzar` terminal: abre modal vía `solicitarCierre`).
- Tests añadidos: 4 (Dotación) + 2 (Movimientos) + 3 (Cálculo) + 4 (Validación, nuevo spec) + 3 (Cierre) + 5 (facade: labels nuevos + matriz de delegación) = 21.
- Validación: `npx ng test --watch=false --include="**/nomina-mensual-v2/**/nomina-mensual-v2-paso-*.spec.ts" --include="**/nomina-mensual-v2-navegacion.spec.ts"` → 65/65 verdes.

### Fase B — AG-CTA-01: eliminar primary duplicado del footer en pasos 2–6

El `<button is-primary>` del `<footer>` de cada paso era duplicado del CTA del shell. Se elimina dejando sólo `is-ghost "Volver a X"`. En Cierre se sustituye el botón inline `Cerrar nómina` por un `paso-cierre__hint` que explica que el cierre se dispara desde el CTA del shell (que abre el modal de confirmación). El motivo opcional se mantiene como input pre-cierre. Los botones operativos no-navegacionales (`Calcular nómina`, `Aplicar recurrentes`, `Agregar movimiento manual`, `Excluir de la nómina`, `Confirmar exclusión` del preview masivo) NO se tocan: son acciones operativas, no avance.

- Archivos tocados (HTML/CSS):
  - 5 HTML de paso (líneas del footer): `dotacion`, `movimientos`, `calculo`, `validacion`, `cierre`.
  - 2 CSS: se elimina `.paso-val__btn.is-primary` y `.paso-cierre__btn.is-primary` (huérfanos tras el cambio); se agrega `.paso-cierre__hint`. En Dotación / Movimientos / Cálculo los `*.is-primary` siguen vivos porque los usan acciones inline.
- Validación: `npx ng build --configuration=development` → OK.

### Fase C — AG-NAV-02: stepper desde evidencia persistida

`obtenerEstadoPaso` cambia su signatura a `(stepId, pasoActual, nomina = null)`. Internamente usa `indiceUltimoPasoCompletado(nomina)` que mapea `nomina.estado` al índice del último paso completado: `borrador` → -1; `dotacion_generada` → 0; `en_revision` → 1; `calculada` → 2; `validada` → 3; `aprobada` → 4; `cerrada` → 5; `reabierta` → 4 (cierre deshecho); `anulada` → -1 (todos pierden vigencia). Excepción CAL-INV-05: el paso `calculation` exige adicionalmente `evidenciaCalculo.calculoVigente === true` para considerarse completed; si el snapshot dejó de ser vigente vuelve a pending aunque el estado de la nómina ya lo haya superado.

El stepper recibe `[nomina]` como input nuevo y el container la inyecta con `nominaCargada()` (la nómina ya estaba cargada por el flujo del generador, no se introducen llamadas adicionales).

- Archivos tocados:
  - [`facade/nomina-mensual-v2-navegacion.ts`](../../src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/facade/nomina-mensual-v2-navegacion.ts) (`indiceUltimoPasoCompletado` + nueva signatura).
  - [`nomina-mensual-v2-stepper.component.ts`](../../src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-stepper/nomina-mensual-v2-stepper.component.ts) (`input<NominaPeriodo | null>(null)`).
  - [`nomina-mensual-v2-container.html`](../../src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/nomina-mensual-v2-container.html) (binding `[nomina]="nominaCargada()"`).
  - Spec del facade ampliado: 10 tests nuevos (matriz `estado` × paso + caveats `null`, `reabierta`, `anulada`, `calculoNoVigente`).
- Validación: 22/22 specs del facade verdes.

### Validación cruzada

- `npx ng build --configuration=development` → OK (944 kB chunk del generador, en línea con el anterior).
- `npx ng test --watch=false --include="**/features/nomina-mensual{,-v2}/**/*.spec.ts"` → 978/980. Los 2 fallos (`nomina-msgbox-lab.rules.spec.ts`, `proceso-mensual-flow-nav.rules.spec.ts`) son pre-existentes y no fueron modificados por este lote — confirmados como tales en el sub-lote anterior.

### Caveats explícitos

- **Cálculo** y **Movimientos** mantienen sus botones operativos inline. El CTA del shell sólo navega cuando `puedeAvanzar()` es true (en Cálculo: además requiere `calculoVigente`).
- **Cierre** es terminal: el CTA del shell abre el modal de confirmación, pero la navegación no ocurre porque no hay paso siguiente.
- **Reapertura** (CIE-REO-04) ya cubrió la parte UI en el sub-lote anterior. La invalidación persistente de liquidaciones generadas queda pendiente y aparece en la próxima Tabla B.
- Si la nómina llega al paso Cálculo con estado `calculada` pero `resultado()` aún vacío (sesión nueva), el CTA del shell queda en `ok:false` hasta que se recalcule. Es comportamiento esperado por el guard de Fase A (la sesión local del paso no carga el resultado persistido de cálculos previos; trabajar ese fallback queda pendiente como mejora UX no bloqueante).

---

## 2026-06-05 - Sub-lote P0 Administrador + Generador (ADM-MOD-05 a QA-FOC-01)

Ejecución secuencial de las 5 fases P0 acotadas del sub-lote recomendado en la §15 de [`auditoria-admin-generador-nomina-2026-06.md`](modulos/nomina-mensual/auditorias/auditoria-admin-generador-nomina-2026-06.md). Sólo HTML/CSS/TS de presentación. Cero cambios en motor, dominio, SQL/RPC/RLS, estilos globales, `angular.json`, Tailwind, fuentes ni persistencia.

### Fase 1 — ADM-MOD-05: diálogos del Administrador a `app-message-box`

Los diálogos de Eliminar borrador / Reabrir / Anular dejan el `.adm-nom__action-dialog` local (sin focus trap, sin Escape, sin retorno de foco) y pasan a `app-message-box` `mode="modal"`. Eliminar abre con `variant="danger"` y consecuencia explícita; Reabrir abre con `variant="warning"`; Anular con `variant="danger"`. Los dos últimos exigen motivo proyectado como `<textarea>` en el slot del message-box. Mientras se ejecuta la acción, el modal queda no cerrable (`disableClose=true`).

- Archivos tocados: [`administrador-nominas-container.ts`](../../src/app/features/nomina-mensual/containers/administrador-nominas-container/administrador-nominas-container.ts) (helpers `accionTituloModal`, `accionMessageBoxVariant`, `accionRequiereMotivo`, `accionDetalle`, guard de doble click), [`administrador-nominas-container.html`](../../src/app/features/nomina-mensual/containers/administrador-nominas-container/administrador-nominas-container.html), [`administrador-nominas-container.css`](../../src/app/features/nomina-mensual/containers/administrador-nominas-container/administrador-nominas-container.css) (se eliminan `.adm-nom__action-*`, se añade `.adm-nom__motivo*`), [`administrador-nominas-container.spec.ts`](../../src/app/features/nomina-mensual/containers/administrador-nominas-container/administrador-nominas-container.spec.ts) (5 tests nuevos: Test 40–44).
- Validación: `npx ng test --watch=false --include="**/administrador-nominas-container.spec.ts"` → 12/12.

### Fase 2 — CIE-ENUM-01: presenter de estado RRHH en el chip del paso Cierre

El chip "Estado actual: `dotacion_generada`" dejaba ver el enum interno. Ahora consume `estadoNominaToLabel` exportado desde [`admin-nominas.presenter.ts`](../../src/app/features/nomina-mensual/presenters/admin-nominas.presenter.ts) (se renombró `ETIQUETAS_ESTADO` a `ETIQUETAS_ESTADO_NOMINA` y se expone el mapa + el helper). El paso Cierre muestra "Dotación lista", "Calculada", "Cerrada", etc.

- Archivos tocados: [`admin-nominas.presenter.ts`](../../src/app/features/nomina-mensual/presenters/admin-nominas.presenter.ts) (export `ETIQUETAS_ESTADO_NOMINA` + `estadoNominaToLabel`), [`nomina-mensual-v2-paso-cierre.component.ts`](../../src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-cierre/nomina-mensual-v2-paso-cierre.component.ts), [`nomina-mensual-v2-paso-cierre.component.html`](../../src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-cierre/nomina-mensual-v2-paso-cierre.component.html), nuevo spec del componente.
- Validación: `npx ng test --watch=false --include="**/nomina-mensual-v2-paso-cierre.component.spec.ts"` → 2/2.

### Fase 3 — DOT-DET-04 + MOV-ID-03: identidad humana

El panel de detalle de Dotación mostraba `Trabajador <id-crudo>`. Las listas de Movimientos manuales / omitidos también. Se sustituye por nombre + RUT en ambos casos, manteniendo el ID sólo en `[attr.data-trabajador-id]` para depuración.

- **Dotación**: nuevo signal `detalleTrabajadorIdentidad` con `{ nombre, rut }` capturado de la fila visible al abrir el detalle. Si la fila no estaba paginada cuando se abrió el detalle, fallback explícito "Trabajador sin identificar · Identidad no disponible en la página actual".
- **Movimientos**: cache acumulativo privado `identidadesTrabajador: Map<string, { nombre, rut }>` que se hidrata en `cargar()` y `buscarTrabajadores()`. Helpers públicos `nombreTrabajador(id)` y `rutTrabajador(id)` con fallback "Trabajador sin identificar".
- Archivos tocados: [`nomina-mensual-v2-paso-dotacion.component.ts`](../../src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-dotacion/nomina-mensual-v2-paso-dotacion.component.ts), [`.html`](../../src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-dotacion/nomina-mensual-v2-paso-dotacion.component.html), [`.css`](../../src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-dotacion/nomina-mensual-v2-paso-dotacion.component.css) (estilos `.paso-dotacion__detalle-meta` + `.paso-dotacion__detalle-rut`); [`nomina-mensual-v2-paso-movimientos.component.ts`](../../src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-movimientos/nomina-mensual-v2-paso-movimientos.component.ts), [`.html`](../../src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-movimientos/nomina-mensual-v2-paso-movimientos.component.html). Nuevos specs en ambos componentes.
- Validación: `npx ng test --watch=false --include="**/nomina-mensual-v2-paso-dotacion.component.spec.ts" --include="**/nomina-mensual-v2-paso-movimientos.component.spec.ts"` → 6/6.

### Fase 4 — CAL-INV-05: banda persistente "cálculo no vigente"

Cuando `evidenciaCalculo.versionCalculo > 0 && calculoVigente === false`, los pasos Cálculo, Validación y Cierre muestran una banda tono warning con el motivo administrativo y la acción recomendada (recalcular antes de continuar). En Cálculo y Cierre se incluye la versión persistida; en Validación se omite (el resumen no la trae).

- Archivos tocados: [`paso-calculo.component.ts`](../../src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-calculo/nomina-mensual-v2-paso-calculo.component.ts) (`calculoNoVigente`, `versionCalculo`), [`.html`](../../src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-calculo/nomina-mensual-v2-paso-calculo.component.html), [`.css`](../../src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-calculo/nomina-mensual-v2-paso-calculo.component.css) (`.paso-calc__alert.is-warning`). Replicado en [`paso-validacion`](../../src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-validacion/) y [`paso-cierre`](../../src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-cierre/) con sus respectivos `is-warning`. Nuevo spec del paso Cálculo.
- Caveat: depende de que `evidenciaCalculo.calculoVigente` se actualice por el flujo de cambios persistidos (migración `20260605120000_nomina_periodo_ciclo_consistente.sql` ya en BD productiva). Si en algún flujo el flag no se setea, la banda no aparecerá; no se tocó motor por estar fuera de alcance del lote.
- Validación: `npx ng test --watch=false --include="**/nomina-mensual-v2-paso-calculo.component.spec.ts"` → 4/4.

### Fase 5 — QA-FOC-01: foco y a11y en superficies restantes

Dos puntos pendientes tras Fase 1:

1. **Reapertura del paso Cierre** migrada de form inline a `app-message-box` `variant="danger"` con título "Reabrir nómina", consecuencias explícitas ("la versión cerrada quedará invalidada; si ya generaste liquidaciones para este cálculo, deberás revisarlas y regenerarlas") y motivo proyectado obligatorio. Cubre incidentalmente parte de **CIE-REO-04** (advertencia de consecuencias); el alcance no toca dominio: no invalida liquidaciones persistidas — sólo pide motivo y registra el evento ya existente.
2. **Aside lateral de Dotación**: añadido `tabindex="-1"`, `(keydown.escape)="cerrarDetalle()"` y manejo de foco. `abrirDetalle` captura `document.activeElement` antes de cambiar el signal y, tras el render, mueve el foco al aside (`queueMicrotask`). `cerrarDetalle` restaura el foco al elemento origen. Estilo `:focus-visible` discreto.

- Archivos tocados: [`paso-cierre.component.ts/.html/.css`](../../src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-cierre/), [`paso-dotacion.component.ts/.html/.css`](../../src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-dotacion/). Specs ampliados en ambos.
- Validación: `npx ng test --watch=false --include="**/nomina-mensual-v2-paso-cierre.component.spec.ts" --include="**/nomina-mensual-v2-paso-dotacion.component.spec.ts"` → 10/10.

### Validaciones globales del sub-lote

- `npx ng build --configuration=development` → verde.
- `npx ng test --watch=false --include="**/features/nomina-mensual{,-v2}/**/*.spec.ts"` → 946 / 948 (los 2 fallos preexistentes son `nomina-msgbox-lab.rules.spec.ts` y `proceso-mensual-flow-nav.rules.spec.ts`, copy V1 fuera del alcance del lote; ya estaban rotos antes de iniciar la Fase 1).
- Sin cambios en `src/styles.css`, `src/styles/*`, `angular.json`, Tailwind, PostCSS, fuentes, SQL/RPC/RLS, motor, `proceso-mensual.service.ts`, `nomina-periodo.service.ts`, modelos de dominio ni configuración.

---

## 2026-06-05 - Curaduría docs/codex - Auditorías de Nómina mensual

Sin cambios de UI. Limpieza documental del directorio [`docs/codex/modulos/nomina-mensual/auditorias/`](modulos/nomina-mensual/auditorias/) para fijar el norte antes de ejecutar el roadmap P0 del rediseño Administrador + Generador.

**Cambios**:

- Nuevo [`README.md`](modulos/nomina-mensual/auditorias/README.md) índice de la carpeta: tabla de las 4 auditorías con estado (Vigente / Cerrada / Superada / Implementada), orden de lectura sugerido, política de auditorías y resumen del estado de ejecución por frente.
- Banner de estado **Implementada** en [`nom-mensual-cleanup-audit-01.md`](modulos/nomina-mensual/auditorias/nom-mensual-cleanup-audit-01.md).
- Banner de estado **Superada (parcial)** en [`cierre-mensual-audit-post-reset-01.md`](modulos/nomina-mensual/auditorias/cierre-mensual-audit-post-reset-01.md) + sección final §14 con tabla que mapea cada brecha del V1 a su hallazgo sucesor en la auditoría 2026-06-05.
- Banner de estado **Cerrada** en [`auditoria-nomina-v2-2026-06.md`](modulos/nomina-mensual/auditorias/auditoria-nomina-v2-2026-06.md). Bloques `### Deuda opcional` (L5.3 + modal de empleados) y `### Continuidad` (los pasos 4–8 originales fueron absorbidos por el Administrador + Generador).
- Banner de estado **Vigente** en [`auditoria-admin-generador-nomina-2026-06.md`](modulos/nomina-mensual/auditorias/auditoria-admin-generador-nomina-2026-06.md) y nueva sección §15 "Estado de ejecución (post-publicación)" con dos tablas: A — decisiones ya tomadas (F3 Fusion, shell residual, filtro de mes, rediseño full-bleed con la decisión opuesta a ARC-FRM-03 anotada explícitamente) y B — pendientes priorizados (15 P0 críticos + bloques P1/P2/P3). Incluye sub-lote recomendado para arrancar.

**Cero cambios** en `src/`, motor, SQL, RPC, RLS, persistencia, estilos globales, `angular.json`, Tailwind, PostCSS, fuentes o configuración.

**Salida esperada**: quien abra la carpeta `auditorias/` ahora entiende en 30 segundos qué está cerrado, qué quedó superado, qué decisión rectora rige y qué queda por ejecutar.

---

## 2026-06-05 - Administrador y nóminas abiertas con acción operativa

El Administrador deja de ser una grilla pasiva: los KPIs filtran la bandeja, la vista inicial muestra registros que requieren acción, cada fila informa el siguiente paso y los errores de carga ofrecen reintento. Las acciones por estado permiten eliminar borrador, anular, reabrir y navegar a liquidaciones únicamente desde una nómina cerrada con snapshot.

En el Generador, Dotación incorpora paginación y preview para exclusión masiva; Movimientos selecciona trabajadores por nombre/RUT; Cierre reemplaza `window.confirm` por `app-message-box`. Se mantienen densidad compacta, CSS local, franja operativa y tabla contextual según NOIA.

No se tocaron `src/styles.css`, `src/styles/*`, `angular.json`, Tailwind ni fuentes globales.
## 2026-06-04 - Shell residual al navegar (fix global con tokens de propiedad)

**Bug reportado**: «al seleccionar menús o botones que cambian a otra interfaz se queda el shell antiguo en la cabecera» (título, subtítulo, CTA o chips del container anterior persisten en el topbar tras la navegación).

**Causa raíz**: race condition entre el destroy del container anterior (A) y el init del nuevo (B) en `<router-outlet>`. Con lazy loading, Angular puede crear B antes de destruir A:

1. B se inicializa → `setBindingActive(true) + setContext(ctxB)`.
2. NavigationEnd dispara → `applyRouteFallback(urlB)` no aplica (binding activo).
3. A se destruye → `setBindingActive(false) + clearContext + applyRouteFallback(urlB)` borra ctxB y deja solo breadcrumbs fallback.

Resultado observable: breadcrumbs nuevos pero título y acción primaria vacíos o del anterior. El bug afectaba tanto a los containers con patrón manual (`administrador-nominas-container`, `nomina-mensual-v2-container`) como a los que usaban `bindShellPageContext` (el helper llamaba `applyRouteFallback(router.url)` en destroy con la URL ya actualizada).

**Solución**: sistema de tokens de propiedad en `ShellPageContextService` + coordinación con el router en `LayoutShellComponent`.

- `ShellPageContextService` (`src/app/layout/shell-page-context.service.ts`):
  - Nueva API basada en tokens: `claimOwnership()`, `setContextWithToken`, `patchContextWithToken`, `registerPrimaryActionHandlerWithToken`, `releaseOwnership`.
  - `claimOwnership()` entrega un token monótono y desplaza al dueño anterior; el handler primario se invalida automáticamente.
  - Operaciones con token: no-op silencioso si el token ya no es el dueño actual (el container A que se destruye después de B no puede pisar el contexto de B).
  - Transición de navegación: `beginNavigationTransition()` (snapshot del dueño) y `resolveNavigationTransition(url)` (libera al stale si nadie nuevo reclamó + aplica fallback).
  - API legacy (`setContext`, `patchContext`, `clearContext`, `setBindingActive`, `registerPrimaryActionHandler`) marcada `@deprecated` y mantenida funcional para tests/compatibilidad.
- `bindShellPageContext` (`src/app/layout/shell-page-context.binding.ts`): reclama un token al crearse, escribe contexto con `setContextWithToken` dentro del effect, registra el handler con token. En destroy llama `releaseOwnership(token)` (sin `applyRouteFallback`, que ahora lo hace `LayoutShellComponent`).
- `LayoutShellComponent` (`src/app/layout/layout-shell.component.ts`): suscripción a `NavigationStart` (begin) y `NavigationEnd` (resolve). El fallback inicial del constructor se mantiene para el primer load.
- Containers con patrón manual migrados al helper:
  - `administrador-nominas-container.ts`: `bindShellPageContext(destroyRef, () => computeShellContext(), { onPrimaryAction: abrirNuevaNomina })`.
  - `nomina-mensual-v2-container.ts`: ídem; `syncShellContext()` se convierte en `computeShellContext()` puro y se elimina del template el `(resumenActualizado)="syncShellContext()"` (la reactividad la maneja el effect del helper que lee los signals de `pasoParametros()`).

**Tests** (`src/app/layout/shell-page-context.service.spec.ts` nuevo + `shell-page-context.binding.spec.ts` ampliado):

- Tokens monótonos invalidan handlers anteriores.
- `setContextWithToken` con token obsoleto = no-op.
- Race A → B → release de A es no-op, ctxB sobrevive.
- `resolveNavigationTransition` libera al dueño stale y aplica fallback cuando nadie nuevo reclama.
- Si B reclamó durante la navegación, su contexto sobrevive a `resolveNavigationTransition`.
- API legacy directa sigue compilando y funcionando.

**Resultado**: navegación entre cualquier par de pantallas (Admin nóminas → Generador → Empleados → Ficha → Parámetros, etc.) ya no arrastra el contenido del container anterior en la cabecera. El header se sincroniza con el container actual o, si la nueva pantalla no registra shell, muestra el fallback de breadcrumbs de la ruta sin estado residual.

**Archivos tocados**:

- `src/app/layout/shell-page-context.service.ts`
- `src/app/layout/shell-page-context.binding.ts`
- `src/app/layout/layout-shell.component.ts`
- `src/app/layout/shell-page-context.service.spec.ts` (nuevo)
- `src/app/layout/shell-page-context.binding.spec.ts` (ampliado)
- `src/app/features/nomina-mensual/containers/administrador-nominas-container/administrador-nominas-container.ts`
- `src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/nomina-mensual-v2-container.ts`
- `src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/nomina-mensual-v2-container.html` (quita `(resumenActualizado)`)
- `docs/codex/diseno/bitacora-operativa-noia.md` (sección «Contrato del shell»)

**Archivos NO tocados** (intencional):

- Los 10 call-sites que ya usaban `bindShellPageContext` (cero churn en features estables; el helper ahora es seguro internamente).
- Estilos globales / config / rutas / SQL / motor.

**Validaciones**: `npx tsc --noEmit` OK, `npx ng test --include="src/app/layout/**/*.spec.ts" --watch=false` → 24 tests pasaron, `npx ng build --configuration=development` OK (30.7s). Hay 3 fallos de tests preexistentes en `nomina-msgbox-lab.rules.spec.ts`, `proceso-mensual-flow-nav.rules.spec.ts` y `form-empleado.spec.ts` que **no están relacionados con el shell ni se tocaron en este cambio**.

**Smoke E2E del fix** (`tests/shell-page-context-navigation.spec.ts`, nuevo): 4 tests Playwright que se loguean vía UI (skip automático si faltan `E2E_SUPABASE_AUTH_EMAIL` / `E2E_SUPABASE_AUTH_PASSWORD`) y navegan entre `/empleados`, `/remuneraciones/nominas`, `/parametros` y `/reportes` verificando que:

- `Administrador de nóminas` publica título + CTA `Nueva nómina` y se limpian al ir a `/empleados`.
- `/parametros` tras Admin no hereda `Administrador de nóminas` ni el CTA.
- Cadena Empleados → Admin → Parámetros → Reportes → Admin: cada pantalla muestra su título/CTA correcto, y al volver al Admin el título y CTA reaparecen sin residuo (`Reportes` publica su propio CTA `Ver liquidaciones`, no debe quedar `Nueva nómina`).
- El bloque `.erp-shell-header__title` desaparece cuando la nueva pantalla no publica `pageTitle` (no se queda con texto del anterior).

Resultado: **4/4 pass en ~1.4 min** sobre el server dev real (`npm start`).

---
## 2026-06-04 - Generador V2: fix del filtro de mes del shell con nómina cargada

**Bug reportado**: «el filtro de mes del shell en las nóminas te deja cambiar y si ya pasé el primer paso (ej. Parámetros) no carga con el mes correspondiente».

**Causa raíz**: el generador opera sobre una nómina fijada por URL (`/remuneraciones/nominas/:id/generador`), pero el `PeriodoActivoService` es global y editable desde el shell. Cuando el usuario cambiaba el mes:
- `periodoActivo.periodoYm()` apuntaba al nuevo mes.
- La nómina cargada en memoria seguía siendo la del mes anterior.
- Los pasos 2+ (Dotación, Movimientos, Cálculo, Validación, Cierre) consumían `nominaPeriodoId` (id viejo) → datos del periodo equivocado.

**Fix** (lógica, no visual):

- `nomina-mensual-v2-container.ts`: el effect de `periodoActivo.periodoYm()` ahora pasa por `onPeriodoActivoCambiado()`.
- Si hay nómina cargada y su `periodo` difiere del nuevo del shell, se llama `redirigirAlNuevoPeriodo(nuevoPeriodo)`:
  - Limpia `nominaCargada`, `ultimoNominaIdCargado` y `ultimoPeriodoInicializado` para evitar que los effects sincronicen el shell con la nómina vieja durante la navegación.
  - Consulta `nominaPeriodoService.listarResumenes()` y busca la del nuevo periodo.
  - Si existe → `router.navigate(['/remuneraciones/nominas', equivalente.id, 'generador'])`.
  - Si no existe → vuelve al Admin (`/remuneraciones/nominas`).
- Si no hay nómina cargada o el periodo coincide → flujo normal (`inicializarSesionPeriodo`).

**Resultado**: el usuario puede cambiar el mes desde el shell estando en cualquier paso del generador. El sistema lo lleva a la nómina equivalente del nuevo periodo (mismo dominio mental: «ver mayo»), o al Admin si no existe. Los datos siempre quedan coherentes con la URL.

**Otras pantallas verificadas** (mismo criterio del shell por URL):

- **Admin (`/remuneraciones/nominas`)**: no depende del periodo del shell para listar; muestra todas las nóminas de la empresa. Sin cambios necesarios.
- **Ficha empleado (`/empleados/:id`)**: ya reacciona correctamente al cambio de periodo del shell vía `cargarPerfilLaboral(empleadoId, periodoYm)` desde el facade. URL no depende del periodo. Sin cambios necesarios.

**Archivos tocados**:

- `src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/nomina-mensual-v2-container.ts` (nuevo método `onPeriodoActivoCambiado`, nuevo método `redirigirAlNuevoPeriodo`, effect ajustado).

**Validaciones**: `npx ng build --configuration=development` OK (36.9s), `ReadLints` sin errores.

---
## 2026-06-04 - Generador V2: layout unificado al patrón listado (full-bleed)

**Petición**: que el generador se vea **igual que el listado** (continuidad visual entre `/empleados` → `/remuneraciones/nominas` → `/remuneraciones/nominas/:id/generador`).

**Cambios** (CSS local, sin tocar globales, sin nuevos componentes, sin paletas nuevas):

- `.nmv2-stepper-card` (container V2): full-bleed. Sin `border`, sin `border-radius`; conserva sólo `border-bottom: 1px #e2e8f0` como separador con el cuerpo. Antes era una card flotante con esquinas redondeadas superiores.
- `.nmv2-step-frame`: sin `padding`, sin `gap`; el contenido del paso gobierna su propio padding. Antes inyectaba 14px de padding y rompía la continuidad lateral.
- `.nmv2-step-body`: `overflow:hidden`, fondo blanco (era gris). El scroll lo gestiona la lista interna del paso, no el body.
- Paso Parámetros (`nmv2-paso-parametros`):
  - `:host` = flex column, `flex:1 1 auto`, `height:100%`. Permite que la lista interna se estire al alto disponible.
  - `gap: 0` (override de la regla global que daba 12px). Cada franja queda pegada a la siguiente y se separa con `border-bottom` fino.
  - `.nmv2-paso-parametros__summary` = idéntico al `.adm-nom__summary`: padding `8px 16px`, fondo blanco, `border-bottom: 1px #eef0eb`.
  - `.nmv2-paso-parametros__notice` = inline full-bleed (sin `border-radius`, sin bordes laterales; sólo `border-bottom` contextual amber / rojo / gris según `tipo`).
  - `.nmv2-paso-parametros__list` = full-bleed (`border:0`, `border-radius:0`, `flex:1 1 auto`, `overflow:auto`). La tabla de áreas toca los bordes de la página igual que la tabla del listado de empleados.

**Resultado visual**: stepper → resumen inline → notice opcional → lista plana, todos pegados con líneas finas separadoras, anclados al borde de la página. Mismo lenguaje que el listado.

**Archivos tocados**:

- `src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/nomina-mensual-v2-container.css` (`.nmv2-stepper-card`, `.nmv2-step-frame`, `.nmv2-step-body`, regla global `.nmv2-paso-*` gap diferenciado).
- `src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-parametros/nomina-mensual-v2-paso-parametros.component.css` (host flex/height, summary inline, notice inline, lista full-bleed).

**Validaciones**: `npx tsc --noEmit` limpio, `ReadLints` sin errores, dev server recompila `nomina-mensual-v2-container` (~0.7s) sin warnings.

---
## 2026-06-04 - Generador V2: rediseño del paso Parámetros + bug del Shell al volver

Dos problemas atacados de raíz:

### 1) Bug Shell: al salir del generador y volver, el header mostraba el paso visitado en la sesión anterior

**Causa**: los `effect()` se registraban dentro de `ngOnInit` con `{ injector: this.injector }`. Eso funciona pero no garantiza limpieza idiomática en cada remount; además el `currentStep` quedaba con el valor del paso visitado en la sesión anterior antes de que `inicializarSesionPeriodo` resolviera la sesión real.

**Fix**: en `nomina-mensual-v2-container.ts`:

- Effects movidos al `constructor` (limpieza automática vía DestroyRef del componente).
- En `ngOnInit`: reset defensivo de `currentStep` a `'parameters'`, `ultimoPeriodoInicializado = null`, `ultimoNominaIdCargado = null` antes de marcar el binding activo, y llamada sincrónica a `syncShellContext()`.
- Se eliminó la dependencia `Injector` del componente (ya no se necesita).

### 2) Generador "alineado a Admin" (criterio NOIA productivo)

Replicamos el patrón canónico del listado: una sola identidad por página (la del Shell), información no duplicada, una sola columna de contenido, banners finos inline en vez de cards naranjas grandes.

**Cambios**:

- Eliminado `<app-page-frame tone="workspace">` del container V2: aportaba doble padding, gap y un `pf-body` extra. Ahora el HTML del container es `<section.nmv2-page>` directo, con flex column y full-height (mismo patrón que `.listado-page` de empleados y `.adm-nom__page` del Admin).
- `<app-nomina-mensual-v2-stepper>` compactado: eliminada la eyebrow "Flujo" y la franja "Detalle del paso" lateral (`<app-nomina-mensual-v2-stepper-traceability>`). Los chips Responsable / Historial / Integridad duplicaban información del shell y no aportaban acción primaria — quedan disponibles desde el modal de trazabilidad si se requieren.
- Paso Parámetros (`nomina-mensual-v2-paso-parametros`) rediseñado:
  - Header in-page eliminado (eyebrow "PASO 1 · PARÁMETROS" + "Configuración requerida..." duplicaban el shell).
  - Aside lateral eliminado (3 bloques duplicaban los 3 chips del header y la acción primaria del shell).
  - Stats convertidos a franja inline sobria con separadores finos (mismo lenguaje visual que el resumen del Admin).
  - Banner de alerta grande naranja → noticia inline fina de un renglón (`<p.nmv2-paso-parametros__notice>`).
  - Lista de áreas conserva el patrón de filas planas (sin tarjetas), un solo borde alrededor.
- `.nmv2-step-nav-hint` rebajada: sin fondo de color saturado por defecto; los tonos `--bloqueo` / `--revision` quedan como variantes finas con borde inferior contextual.

**Archivos tocados**:

- `src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/nomina-mensual-v2-container.{ts,html,css}` (constructor effects, sin `<app-page-frame>`, `.nmv2-page` toma alto directo).
- `src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-stepper/nomina-mensual-v2-stepper.component.{ts,html}` (sin eyebrow "Flujo", sin `<app-nomina-mensual-v2-stepper-traceability>`).
- `src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-parametros/nomina-mensual-v2-paso-parametros.component.{html,css}` (header in-page fuera, aside fuera, alert banner → notice inline fino, stats inline).

**Validaciones**: `npx tsc --noEmit` limpio, `ReadLints` sin errores, dev server recompila `nomina-mensual-v2-container` en ~1.0s sin warnings. Contrastado con `docs/codex/diseno/noia-ui-guardrails.md` (regla anti-card, lenguaje operativo, una sola identidad por página) y con el patrón del listado de empleados.

---
## 2026-06-04 - Admin de nóminas: revertimos al patrón canónico de listado (sin page-frame)

**Problema reportado**: tras introducir `<app-page-frame tone="flush">` en `administrador-nominas-container`, la tabla seguía "separándose en 2" y "quitando los bordes-radios". Acumulamos varias capas de CSS intentando arreglar la cadena de alto sin éxito.

**Diagnóstico**: la cadena de alto desde `.erp-shell-scroll` hasta la `app-card` del data-grid estaba bloqueada por **cuatro eslabones acumulados**:

1. `src/app/pages/administrador-nominas.page.ts` (wrapper inerte `<app-administrador-nominas-page>`) que se interponía entre el shell y el container, sin estilos propios y sin selector que recibiera `flex: 1 1 auto`.
2. `ViewEncapsulation.None` en el container, lo cual deshabilita el `:host` (Angular lo deja como selector inválido fuera de shadow DOM). Mis reglas `:host { display:flex; height:100% }` no aplicaban.
3. `<app-page-frame>` añadía `padding: 8px 0` + `gap: 8px` + un `<div.pf-body>` intermedio. La regla `.pf-body > :only-child` dejaba de aplicar cuando había summary (porque la sección quedaba como segundo hijo), rompiendo la propagación del alto.
4. El `tone="flush"` ponía la card pegada al borde del viewport, mostrando esquinas con `border-radius` cortadas (visualmente "rotas").

**Fix aplicado** (replicando exactamente el patrón del listado de empleados, que sí funciona):

- Eliminé `src/app/pages/administrador-nominas.page.ts` y `src/app/pages/nomina-mensual-v2.page.ts`. Las rutas ahora cargan directamente los containers (igual que `empleados.routes.ts`).
- Container ahora usa `ViewEncapsulation.Emulated` (default) y `:host { display:flex; height:100%; ... }` correctamente.
- Quité `<app-page-frame>` del Admin. El HTML pasó a: `<section.adm-nom__page>` → opcional `<div.adm-nom__summary>` + `<div.adm-nom__grid-shell>` → `<app-data-grid [gridHeight]="100%">`.
- `:host ::ng-deep app-data-grid.adm-nom__grid` + `app-card.adm-nom__grid-card`: forzados a `display:flex; height:100%; border-radius:0; border-left:none; border-right:none` (mismo patrón que `empleados-grid-shell` en `tabla-empleados.css`).

**Archivos tocados**:

- `src/app/app.routes.ts` (apunta a containers directos).
- `src/app/features/nomina-mensual/containers/administrador-nominas-container/{html,css,ts}` (sin page-frame, encapsulation Emulated).
- Borrados: `src/app/pages/administrador-nominas.page.ts`, `src/app/pages/nomina-mensual-v2.page.ts`.

**Lección documental**: el componente `<app-page-frame>` queda restringido a workspaces step-by-step (V2 generador). **No usar en listados full-bleed**: para listados el patrón canónico sigue siendo el del listado de empleados (`:host` flex column → sección page → wrap del data-grid con `::ng-deep` sobre `app-data-grid` + `app-card`). Documentado también en `noia-ui-guardrails.md`.

**Validaciones**: `npx tsc --noEmit` limpio, `ReadLints` sin errores, dev server recompila el chunk `administrador-nominas-container` en ~1.2s sin warnings.

---
## 2026-06-04 - Sistema de diseño de página (page-frame) — piloto F3

Se introduce `<app-page-frame>` como **marco unificado de página** del ERP. Reemplaza wrappers ad-hoc (`.adm-nom`, `.nmv2-page`, …) por un único componente standalone (`src/app/shared/components/ui/page-frame/`) que aporta el patrón canónico del listado de empleados: flex column full-height, padding compacto, body full-bleed, y una capa local de tokens `--pf-*` mapeada a `--erp-*` / `--bitacora-*` globales (cero hex nuevo, cero edición de estilos globales).

### Decisiones de usabilidad (criterio NOIA productivo)

- **Una sola identidad por página**: el título y la acción primaria los provee el **Shell** (`ShellPageContextService` → `header.component`). El frame **NO duplica header**; sus inputs `eyebrow/title/subtitle` quedan opcionales para casos puntuales que aún no consuman el shell.
- **Resumen operativo sobrio**: KPIs como franja inline (chips con separadores finos), no como caja con fondo decorativo.
- **Contenido al 100 %**: grid / stepper ocupan todo el ancho del frame; `tone="workspace"` reduce el padding lateral.
- **Densidad compacta**: padding base `12 × 16 px` (`--pf-space-4` × `--pf-space-5`); `density="comfortable"` lo escala a `20 × 24 px`.
- **Cero ruido visual**: sin sombras fuertes, sin gradientes, sin barras laterales fuertes.

### Tokens locales `--pf-*` (definidos en `page-frame.component.css`)

| Grupo | Tokens | Mapea a |
| --- | --- | --- |
| Spacing | `--pf-space-1..7` (2/4/8/12/16/20/24) | escala compacta NOIA |
| Superficie | `--pf-surface`, `--pf-surface-soft`, `--pf-bg`, `--pf-border`, `--pf-border-soft` | `--bitacora-*` |
| Texto | `--pf-text-strong`, `--pf-text-muted` | `--bitacora-text/muted` |
| Acción primaria | `--pf-primary`, `--pf-primary-hover`, `--pf-primary-soft`, `--pf-ring` | `--erp-primary*` |
| Tipografía | `--pf-eyebrow-size` 11, `--pf-title-size` 18, `--pf-subtitle-size` 12.5 | escala de página |
| Radios | `--pf-radius` 8, `--pf-radius-sm` 6 | densidad NOIA |
| Padding host | `--pf-padding-y/-x`, `--pf-gap` | reasignados por density/tone |

### API del componente

```ts
@Input() eyebrow?: string | null   // contexto/módulo (opcional, normalmente nulo cuando el shell ya lo provee)
@Input() title?: string | null     // título in-page (opcional)
@Input() subtitle?: string | null  // subtítulo in-page (opcional)
@Input() density: 'compact' | 'comfortable' = 'compact'
@Input() tone: 'page' | 'workspace' = 'page'
```

Slots vía content-projection:

- `[pageFrameActions]` — botones del header in-page (solo si se usa el header).
- `[pageFrameSummary]` — franja de KPIs / contadores operativos (chips inline sobrios).
- `[pageFrameToolbar]` — filtros / búsqueda.
- default (`ng-content`) — body principal (grid, stepper, etc.).
- `[pageFrameFooter]` — barra inferior opcional.

### Pantallas piloto

1. **Administrador de nóminas** (`/remuneraciones/nominas`)
   - Shell ahora setea `pageTitle = 'Administrador de nóminas'`, `pageSubtitle` derivado del conteo y acción primaria **"Nueva nómina"** (handler ya cableado).
   - KPIs renderizados como franja inline con separadores finos (`adm-nom__summary` / `adm-nom__metric`), sin caja con fondo.
   - Grid `app-data-grid` ocupa el 100 % del ancho del frame; chips compactos en columnas estado / incidencias / tipo.
2. **Generador V2** (`/remuneraciones/nominas/:id/generador`)
   - Frame en `tone="workspace"` para que el stepper, hint y step-body sean full-bleed.
   - El header in-page del frame se eliminó; el shell ya muestra título del paso + breadcrumbs + acción principal del paso.
   - `.nmv2-page` mantiene sus selectores `[data-step='…']` (las reglas hijas no se tocan), pero ya no aplica padding/background/min-height redundantes con el frame.

### Archivos tocados

- `src/app/shared/components/ui/page-frame/page-frame.component.ts` *(nuevo)*
- `src/app/shared/components/ui/page-frame/page-frame.component.html` *(nuevo)*
- `src/app/shared/components/ui/page-frame/page-frame.component.css` *(nuevo, ~155 líneas, tokens `--pf-*` definidos aquí)*
- `src/app/shared/components/ui/page-frame/page-frame.component.spec.ts` *(nuevo, 4 specs)*
- `src/app/shared/components/ui/page-frame/index.ts` *(nuevo, barrel)*
- `src/app/features/nomina-mensual/containers/administrador-nominas-container/administrador-nominas-container.{ts,html,css}` — frame, shell context, KPIs sobrios. CSS reducido (~304 → ~225 líneas), sin header in-page.
- `src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/nomina-mensual-v2-container.{ts,html,css}` — frame tone=workspace; `.nmv2-page` sin padding/bg redundantes; computed signals temporales (`tituloPeriodo`, `contextoEmpresa`) **removidos** ya que el shell maneja la identidad.
- `docs/codex/peticiones-estilos.md` — esta entrada.
- `docs/codex/diseno/noia-bases-sistema-referencia.md` — nota de capa transversal `<app-page-frame>` + `--pf-*`.
- `docs/codex/diseno/noia-ui-guardrails.md` — referencia obligatoria al frame al crear pantallas nuevas.
- `docs/codex/orquestador/estado-fases/nomina-mensual.md` — sección `NOM-UI-PAGE-FRAME-PILOTO-01`.

### Archivos NO tocados

- `angular.json`, `postcss.config.*`, `tailwind.config.*`.
- `src/styles.css`, `src/styles/index.css`, `src/styles/tailwind.css`, `src/styles/fonts.css`, `src/styles/theme.css`.
- Motor V1, RPCs, mappers, repositorios, payloads, servicios.
- Los 6 componentes hijos del Generador V2 (`paso-parametros`, `paso-dotacion`, `paso-movimientos`, `paso-calculo`, `paso-validacion`, `paso-cierre`).

### Validaciones ejecutadas

1. `ReadLints` sobre archivos tocados → 0 errores.
2. `npx tsc --noEmit -p tsconfig.app.json` → 0 errores.
3. `npx ng test --watch=false --include='**/page-frame/**/*.spec.ts'` → **4/4 pass**.
4. `npx ng test --watch=false --include='**/administrador-nominas-container.spec.ts'` → **7/7 pass**.
5. `npx ng test --watch=false --include='**/nomina-mensual-v2/**/*.spec.ts'` → **99/99 pass**.
6. `npx ng test --watch=false` (suite completa) → **1462/1466 pass**. Los 4 fail son las pre-existentes (`liquidaciones-oficiales` ×2, `nomina-msgbox-lab` ×1, `proceso-mensual-flow-nav` ×1); **cero regresiones nuevas**.
7. `npx ng build --configuration=development` → bundle generado sin warnings de budget.

### Pendientes / sweep futuro

- Decidir si `Empleados/listado` y `Ficha empleado` adoptan formalmente `<app-page-frame>` o quedan como referencia canónica de contenido bajo el frame.
- Sweep Remuneraciones (Liquidaciones, Conceptos, Haberes/Descuentos, Novedades, Movimientos, Proceso mensual, Parámetros generales).
- Sweep transversal (Dashboard, Reportes, módulos shell).
- Cada pantalla migrada consume los tokens `--pf-*` ya definidos, sin redefinir paletas ni spacing.

---
## 2026-06-04 - Nómina mensual — F3 fusion · migración aplicada a PROD

Migración SQL `supabase/migrations/20260604180000_nomina_rebuild_admin_generador.sql` aplicada al proyecto Supabase productivo `api-remuneraciones` (ref `mjrckxodzrfkyqjkyjkn`) usando `supabase db push` (CLI v2.101.0).

### Pasos ejecutados

1. **Dry-run** `supabase db push --dry-run` → confirmó que solo se aplicaría `20260604180000`.
2. **Aplicación** `supabase db push` → aplicada en una sola transacción. NOTICEs de `drop ... if exists` esperados (primera aplicación).
3. **Verificación remota** vía `supabase db query --linked`:
   - 6 tablas existen y son consultables (count = 0).
   - RLS habilitado en las 6 (`pg_tables.rowsecurity = true`).
   - 5 triggers activos (`trg_nomina_periodo_updated`, `trg_segmento_nomina_updated`, `trg_movimiento_recurrente_updated`, `trg_movimiento_nomina_updated`, `trg_audit_nomina_periodo`).
   - 3 funciones con `search_path = public` configurado y `security definer` en las que correspondía (`current_user_empresa_id`, `tg_audit_nomina_periodo`); `set_updated_at` queda sin secdef como corresponde.
4. **Regeneración de types** `npm run types:supabase` → `src/app/core/models/database.types.ts` reemplazado con los tipos canónicos desde la BD real (1238 ins / 710 del). El archivo regenerado destapó una deuda técnica pre-existente: `nomina-calculo-snapshot.repository.ts:288` llamaba a la RPC `anular_nomina_operativa` que no existe en BD (solo existe `anular_nomina_preparacion` con firma distinta). Se preservó el comportamiento con un cast tipado mínimo + comentario explicativo. Es código fuera del scope F3 fusion y queda como TODO técnico.
5. **`npx tsc --noEmit -p tsconfig.app.json`** → 0 errores.
6. **`npx ng test --watch=false`** → 1458 pass / 4 fail. Las 4 fallas son exactamente las pre-existentes documentadas en F3 fusion (`liquidaciones-oficiales.service.spec.ts` ×2, `nomina-msgbox-lab.rules.spec.ts` ×1, `proceso-mensual-flow-nav.rules.spec.ts` ×1). **Cero regresiones nuevas**.
7. **Smoke funcional en BD real**:
   - INSERT en `nomina_periodo` (empresa 1, periodo `2025-01`) → UUID generado, defaults OK.
   - Trigger de auditoría INSERT creó `evento_auditoria_nomina.accion = 'creada'`.
   - UPDATE de estado a `calculada` → trigger creó `evento_auditoria_nomina.accion = 'calculada'`.
   - `select public.current_user_empresa_id()` → retorna `1` (fallback OK).
   - DELETE en cascada limpió el registro de prueba y los eventos asociados (`on delete cascade` funcional).

### Archivos tocados

- `src/app/core/models/database.types.ts` — regenerado con `npm run types:supabase` (Relationships ahora completas en las 6 tablas nuevas).
- `src/app/features/nomina-mensual/data-access/nomina-calculo-snapshot.repository.ts` — cast mínimo en la llamada a `anular_nomina_operativa` (RPC inexistente, deuda técnica pre-existente). NO se cambia comportamiento de runtime.
- `docs/codex/peticiones-estilos.md` — esta entrada.

### Archivos NO tocados

`angular.json`, `postcss.config.*`, `tailwind.config.*`, `src/styles/*`, mappers, repositorio nuevo, servicios productivos, componentes V2, motor V1, migración SQL (ya aplicada en push anterior).

### Deuda técnica registrada

- `anular_nomina_operativa` en `nomina-calculo-snapshot.repository.ts:288` se mantiene cast hasta resolver: crear la RPC en BD o reemplazar la llamada por la firma de `anular_nomina_preparacion(p_id_preparacion_nomina, p_motivo, p_metadata)`. Fuera del scope F3 fusion.

---
## 2026-06-04 - Nómina mensual — F3 fusion · hardening migración BD

Endurecimiento de la migración `supabase/migrations/20260604180000_nomina_rebuild_admin_generador.sql` tras revisión a pedido del usuario ("revisa las migraciones y que quede todo ok"):

- `public.current_user_empresa_id()` ahora tiene `revoke all from public` + `grant execute to authenticated, anon, service_role` explícitos (evita depender de defaults de Supabase).
- `public.set_updated_at()` añade `set search_path = public` (lint Supabase).
- `public.tg_audit_nomina_periodo()` se vuelve `security definer` con `search_path` fijo: el trigger inserta en `evento_auditoria_nomina` aunque la política RLS de inserción no llegue a ver la fila recién creada dentro de la misma transacción.
- Documento `docs/codex/modulos/nomina-mensual/migracion-bd-nomina-rebuild.md` actualizado: verificación rápida ahora incluye consulta de RLS y triggers; rollback ahora incluye `drop function` de las tres funciones nuevas; sección 4 documenta los endurecimientos.

No hay cambios en código TS, mappers, repositorios ni componentes. La migración sigue siendo idempotente (`create or replace`, `drop policy if exists`, etc.). UI sin cambios visibles.

**Archivos tocados**:

- `supabase/migrations/20260604180000_nomina_rebuild_admin_generador.sql` (funciones reforzadas + grants explícitos).
- `docs/codex/modulos/nomina-mensual/migracion-bd-nomina-rebuild.md` (verificación + rollback + hardening).
- `docs/codex/peticiones-estilos.md` (esta entrada).

**Archivos NO tocados**: `angular.json`, `postcss.config.*`, `tailwind.config.*`, `src/styles/*`, `database.types.ts`, mappers, repositorios, servicios, componentes V2 ni motor V1.

---
## 2026-06-04 - Nómina mensual — F3 fusion (Generador V2 renovado + BD real)

Implementación de la fase **F3 fusion** del rebuild `NOM-REBUILD-NOMINA-MENSUAL-01` (F3 + F4 + F5 unificadas). El Generador V2 se reescribe en sitio para operar con 6 pasos (Parámetros, Dotación, Movimientos, Cálculo, Validación, Cierre) y se conecta a Supabase con tablas, RLS y triggers nuevos. El motor productivo V1 (`/remuneraciones/proceso-mensual`) sigue intacto: la coexistencia se resuelve por capas (`nomina_periodo` cabecera operativa + `nomina_calculo_*` snapshot del motor V1, unidas por `periodo + id_empresa`).

### Decisiones rectoras de la fase

- **Renovación V2 en sitio**: `features/nomina-mensual-v2/` se transforma a 6 pasos. No se duplica pantalla.
- **Levantamiento controlado de la restricción BD**: por única vez para esta fase se permite tocar Supabase (migración + RLS + triggers + tipos). Documentado como decisión rectora en `arquitectura-administrador-generador.md`.
- **BD productiva**: 6 tablas nuevas (`nomina_periodo`, `segmento_nomina`, `movimiento_recurrente`, `movimiento_nomina`, `incidencia_nomina`, `evento_auditoria_nomina`) con FKs hacia `empresa`, `persona`, `centro_costo`; índices operativos; trigger `updated_at` y trigger de auditoría automática sobre `nomina_periodo`; políticas RLS estrictas por `id_empresa` resuelto por `public.current_user_empresa_id()`.
- **`EmpresaActivaService`**: nuevo servicio que expone signal `empresaActivaId`; resuelve desde `app_metadata.id_empresa`/`user_metadata.id_empresa` y, si no, hace fallback a `.from('empresa').limit(1)` (igual que V1).
- **Idempotencia de recurrentes**: `aplicarRecurrentesANomina` respeta la clave `(nominaPeriodoId, trabajadorId, recurrenteId, tipo)` y NO reaplica movimientos en estado `omitido`.
- **Routing**: `/remuneraciones/nominas/:nominaPeriodoId/generador` es la ruta canónica del Generador. La antigua `/remuneraciones/nomina-mensual-v2` queda como redirect al Administrador (`/remuneraciones/nominas`).
- **Menú lateral**: se retira el item "Nómina mensual V2" del sidebar (acceso único desde Administrador). El item "Administrador de nóminas" pasa a llamarse así (sin mayúsculas decorativas) y hereda `badgeKey: 'periodoMes'`.

### Archivos nuevos

- **Migración SQL**: `supabase/migrations/20260604180000_nomina_rebuild_admin_generador.sql` — 6 tablas + helper `current_user_empresa_id()` + triggers + RLS.
- **EmpresaActivaService**: `src/app/core/services/empresa-activa.service.{ts,spec.ts}`.
- **Mappers / Repository / Service**:
  - `src/app/features/nomina-mensual/mappers/nomina-periodo.mapper.ts` (rowTo… / …ToInsert para las 6 tablas).
  - `src/app/features/nomina-mensual/data-access/nomina-periodo.repository.{ts,spec.ts}`.
  - `src/app/features/nomina-mensual/services/nomina-periodo.service.{ts,spec.ts}` (servicio productivo; el mock adapter queda sólo para tests).
- **Generador V2 — pasos nuevos**:
  - `containers/nomina-mensual-v2-container/components/nomina-mensual-v2-paso-dotacion/*.{ts,html,css}` (reemplaza scope + employees).
  - `…/nomina-mensual-v2-paso-movimientos/*.{ts,html,css}` (Recurrentes / Manuales / Omitidos).
  - `…/nomina-mensual-v2-paso-calculo/*.{ts,html,css}` (orquesta motor V1).
  - `…/nomina-mensual-v2-paso-validacion/*.{ts,html,css}` (filtros + guard de aprobación).
  - `…/nomina-mensual-v2-paso-cierre/*.{ts,html,css}` (checklist + cierre con auditoría + reapertura).
- **Reglas y presenters**:
  - `features/nomina-mensual-v2/presenters/nomina-dotacion-grid.presenter.{ts,spec.ts}`.
  - `features/nomina-mensual-v2/rules/nomina-dotacion.rules.{ts,spec.ts}`.

### Archivos modificados (cambios quirúrgicos)

- `src/app/core/models/database.types.ts` — se añadieron a mano los tipos `Row`/`Insert`/`Update`/`Relationships` de las 6 tablas nuevas (no se regeneró con CLI por falta de acceso en este entorno; el comando recomendado se documenta en `migracion-bd-nomina-rebuild.md`).
- `src/app/features/nomina-mensual-v2/models/nomina-mensual-v2.models.ts` — `PayrollStepId = 'parameters' | 'dotacion' | 'movements' | 'calculation' | 'validation' | 'closure'` (eliminados `scope`, `employees`, `approval`, `payslips`).
- `src/app/features/nomina-mensual-v2/data/nomina-mensual-v2.mock.ts` — `payrollSteps` rearmado a la nueva secuencia.
- `containers/nomina-mensual-v2-container/facade/nomina-mensual-v2-navegacion.ts` — orden de pasos, copy y `PASOS_CONGELADOS_V11` ahora vacío (todos los pasos quedan funcionales en F3 fusion).
- `containers/nomina-mensual-v2-container/nomina-mensual-v2-container.{ts,html,css}` — carga `nominaPeriodoId` desde el route param, llama a `obtenerNomina(id)` y dispatcha al componente correspondiente. CSS legacy `data-step='scope'` / `data-step='employees'` migrado a `data-step='dotacion'`.
- `mappers/nomina-trazabilidad.mapper.ts` y `services/nomina-mensual-v2-trazabilidad.service.ts` — referencias a pasos antiguos reemplazadas por `dotacion` / `closure`.
- `containers/administrador-nominas-container/*` — Admin F2 ahora consume el `NominaPeriodoService` productivo (en vez del mock adapter). La acción "Abrir generador" navega a `/remuneraciones/nominas/:id/generador`.
- `src/app/app.routes.ts` — ruta canónica `nominas/:nominaPeriodoId/generador` + redirect `nomina-mensual-v2 → nominas`.
- `src/app/layout/shell-navigation.config.ts` y `shell-route-context.config.ts` — sidebar y breadcrumbs ajustados (retirado V2; resolveShellRouteBreadcrumbs resuelve dinámicamente la ruta del generador).
- `src/app/app.config.ts` — registrado ícono Lucide `ClipboardList` (faltaba en el set global y rompía el sidebar en algunos tests).

### Pasos de la fase

| Sub-fase | Alcance | Estado |
|---|---|---|
| F3a | Infraestructura BD + EmpresaActivaService | ✅ |
| F3b | 6 repositories + servicio productivo + mappers | ✅ |
| F3c | Refactor Admin F2 a servicio productivo | ✅ |
| F3d | Estructura del Generador (6 pasos + routing) | ✅ |
| F3e-1..6 | Pasos productivos (Parámetros / Dotación / Movimientos / Cálculo / Validación / Cierre) | ✅ |
| F3f | Tests + ng build dev sin nuevas regresiones | ✅ |
| F3g | Documentación + cierre | ✅ |

### Validaciones ejecutadas

- `npx ng build --configuration=development` → OK, sin warnings nuevos. Chunk `nomina-mensual-v2-page` ~700 kB (igual orden de magnitud que antes de la fusion; el incremento por los 4 componentes nuevos se compensa con la eliminación de pasos legacy).
- `npx ng test --watch=false` → 1458 tests pasan, 4 fallos pre-existentes (todos en módulos no tocados por F3: `liquidaciones-oficiales`, `proceso-mensual-flow-nav`, `nomina-msgbox-lab`). Reducimos de 7 fallos pre-existentes a 4 (los 3 que se arreglaron en F3 fusion fueron los del sidebar/shell-navigation/spec).
- `ReadLints` limpio en archivos tocados.

### Reglas NOIA respetadas

- Sin cards decorativas: el Generador usa franjas operativas (stats inline + grid HTML) y la dotación usa un grid sobrio con filtros chip.
- Sin colores fuera del manual: misma paleta del Admin (`#1d4ed8` info, `#047857` success, `#b45309` warning, `#b91c1c` danger, neutros `#0f172a/#475569/#64748b/#cbd5e1/#e2e8f0/#f1f5f9/#f8fafc/#fef2f2/#fffbeb/#f0fdf4`).
- Una acción principal por paso (`Confirmar dotación`, `Aplicar recurrentes`, `Calcular nómina`, `Aprobar para cierre`, `Cerrar nómina`).
- Sin fuentes nuevas, sin sombras fuertes, sin gradientes.
- Lenguaje operativo en cada paso (`Aplicar recurrentes`, `Omitir`, `Reabrir`, `Volver a parámetros`).
- Sin nombres técnicos visibles: las tablas SQL, RPC y los IDs internos no se exponen al usuario.

### Riesgos asumidos (declarados desde el plan)

- La migración SQL debe aplicarse manualmente antes de probar F3b+ (instrucciones en `migracion-bd-nomina-rebuild.md`). Sin aplicar, los repos fallan en runtime pero el código compila.
- `database.types.ts` se editó a mano. Se recomienda regenerar con `supabase gen types typescript --linked` cuando se tenga CLI disponible.
- Los componentes Paso Dotación, Movimientos, Cálculo, Validación y Cierre son MVP funcionales: no integran `app-data-grid`, ni virtual scroll, ni modal de segmentos avanzados, ni preview formal de acción masiva (esos quedan declarados para iteración posterior).
- Movimientos manuales aún piden trabajador por ID textual; la integración con el selector de personas queda pendiente.

### Lo que NO entra en F3 fusion

- Motor de cálculo productivo nuevo (sigue usándose V1).
- Migración histórica de datos `nomina_calculo_*` → `nomina_periodo`.
- Limpieza del módulo V1 (intacto).
- Importación masiva de movimientos.
- Virtual scroll y rendimiento > 1000 trabajadores.
- Pantalla de auditoría visual (los eventos sí se persisten en `evento_auditoria_nomina`).

---
## 2026-06-04 - Nómina mensual — Administrador de nóminas (NOM-REBUILD-NOMINA-MENSUAL-01 F2)

Implementación de **F2 — UI Administrador de Nóminas** del plan `NOM-REBUILD-NOMINA-MENSUAL-01`. Estrena la ruta definitiva `/remuneraciones/nominas` y agrega un item nuevo de menú "Administrador de Nóminas", sin tocar V1 (`/remuneraciones/proceso-mensual`) ni V2 (`/remuneraciones/nomina-mensual-v2`). Coexistencia controlada hasta que F7 limpie las rutas legacy.

### Decisiones (confirmadas por el usuario en plan)

- Ruta **definitiva** `/remuneraciones/nominas` ya en F2 (no provisional). F3 sumará `/:id/generador`.
- F2 completo de una pasada: estructura + grilla + filtros + KPIs + 2 modales + acción "Abrir generador".
- Item nuevo en menú lateral (no reemplaza los existentes). Ícono `clipboard-list`. Insertado entre V2 y Liquidaciones.
- Acciones por fila acotadas: `Abrir generador` y `Ver resumen` (las acciones avanzadas — calcular, validar, aprobar, cerrar, reabrir, anular, eliminar borrador — quedan declaradas en `rules` para F3+, pero NO se renderizan).

### Archivos nuevos

- **Page wrapper**: [`src/app/pages/administrador-nominas.page.ts`](../../src/app/pages/administrador-nominas.page.ts). Monta el container con `:host { display: flex; flex: 1 1 auto; min-height: 0 }` (patrón estándar del repo).
- **Container**: [`src/app/features/nomina-mensual/containers/administrador-nominas-container/administrador-nominas-container.{ts,html,css}`](../../src/app/features/nomina-mensual/containers/administrador-nominas-container/). Standalone, `OnPush`, `ViewEncapsulation.None`, signals + computed. Prefijo CSS local `adm-nom-*`.
- **Modal "Nueva nómina"**: `components/admin-nominas-modal-nueva-nomina/*.{ts,html,css}`. Form simple (período + empresa + tipo) en modal con backdrop propio. Submit dispara `crearNomina()` factory y emite `(creada)`. **No persiste** (limitación F2 — F3 conectará persistencia real).
- **Modal "Resumen de nómina"**: `components/admin-nominas-modal-resumen-nomina/*.{ts,html,css}`. Read-only. Consume `obtenerResumenValidacionNomina()` del adapter mock. Muestra 5 métricas, 2 guardias (`puedeCalcular`/`puedeCerrar` con tono ok/bloqueada) y listas separadas de críticas/advertencias.
- **Presenter**: [`src/app/features/nomina-mensual/presenters/admin-nominas.presenter.ts`](../../src/app/features/nomina-mensual/presenters/admin-nominas.presenter.ts). `COLUMNAS_ADMIN_NOMINAS` (9 columnas: período, empresa, tipo, trabajadores, segmentos, incidencias, estado, actualizada, acciones), `crearFiltrosAdminNominas(resumenes)` (5 filtros: búsqueda + período + estado + tipo + observaciones), `filtrarResumenes(resumenes, filtros)` (predicado puro para tests), `PERSISTENCIA_GRILLA_ADMIN = 'admin-nominas-grid-v1'`.
- **Rules**: [`src/app/features/nomina-mensual/rules/admin-nominas.rules.ts`](../../src/app/features/nomina-mensual/rules/admin-nominas.rules.ts). `puedeEliminarBorrador`, `puedeReabrir`, `tieneLiquidaciones`, `puedeAnular`, `accionesDisponibles(estado)`. Declaradas para F3+; en F2 sólo se usan `abrir-generador` y `ver-resumen`.
- **Util**: `containers/administrador-nominas-container/utils/admin-nominas-presentacion.util.ts`. `estadoNominaToBadge` (9 estados → 5 variantes), `tipoNominaToLabel` (4 tipos), `formatearActualizada` (Hoy / Ayer / Hace N días / dd/mm/yyyy), `calcularKpisAdminNominas` (KPIs operativos: abiertas / en cálculo / pendientes de cierre / con críticas).

### Archivos modificados (cambios mínimos quirúrgicos)

- [`src/app/app.routes.ts`](../../src/app/app.routes.ts) — agregada ruta hija `path: 'nominas'` dentro de `path: 'remuneraciones'`, después de `nomina-mensual-v2` y antes de `liquidaciones`. `loadComponent` apunta al page wrapper nuevo.
- [`src/app/layout/shell-navigation.config.ts`](../../src/app/layout/shell-navigation.config.ts) — agregado item `Administrador de Nóminas` (ícono `clipboard-list`) en la sección `Principal`, entre V2 y Liquidaciones. Sin `badgeKey` (el badge "período" ya está cubierto por las dos entradas operativas existentes; el Admin es transversal a varios períodos).
- [`src/app/layout/shell-route-context.config.ts`](../../src/app/layout/shell-route-context.config.ts) — agregado breadcrumb para `/remuneraciones/nominas` (`Remuneraciones › Administrador de Nóminas`).

### Layout NOIA

Vertical compacto, sin cards decorativas:

1. **Encabezado** — eyebrow `Remuneraciones · Administrador`, título `Administrador de nóminas`, subtítulo dinámico (`N nóminas en seguimiento · M abiertas`), botón primario `Nueva nómina`.
2. **Franja KPIs** — 4 métricas inline (`Abiertas / En cálculo / Pendientes de cierre / Con críticas`) sobre fondo subtle, separadores entre items. NO son cards: es una sola franja con grid responsivo.
3. **`<app-data-grid>`** — `filtersCollapsible=false`, `filterChipsDisplay="whenFiltersHidden"`, `headerCountDisplay="text"`, `toolbarLayout="operativa"`, `persistenceKey="admin-nominas-grid-v1"`. Celdas custom via `<ng-template appDataGridCell>` para período (tabular), empresa (nombre + id muted), tipo (chip neutral), incidencias (chip danger/warning condicional), estado (chip con dot + variante), actualizada (formato humano), acciones (dos botones).
4. **Modales** — backdrop propio (no usan `app-message-box`; era opción pero necesitábamos slots ricos para form y métricas), z-index 50, focus en el cierre por backdrop y por Escape.

### Reglas NOIA respetadas

- Sin colores neón, gradientes ni paletas nuevas. Usa la misma paleta que Alcance V2: `#1d4ed8` (info), `#047857` (success), `#b45309` (warning), `#b91c1c` (danger), `#374151` (neutral). Variables CSS estándar del repo.
- Sin fuentes nuevas.
- Sin cards decorativas: la franja de KPIs es operativa, no comercial.
- Sin barras laterales fuertes ni sombras decorativas. Sólo borde + radio contenido.
- Densidad compacta: padding 5-12 px, font-size 11-13 px, chips de 3 px vertical.
- Una acción principal por zona (`Nueva nómina` en el head, `Abrir` por fila).
- Copy operativo: "Administrador de nóminas", "Nóminas en seguimiento", "Pendientes de cierre", "Con críticas", "Borrador", "Dotación lista", "Calculada", "Cerrada". Sin jerga técnica visible (sin IDs internos, sin `dotacion_generada`, sin `nominaPeriodoId`).
- Estados claros con badges sobrios (chip + dot + label).
- Empty state operativo: "Aún no hay nóminas / Crea la primera nómina del período para empezar".
- Reutilización del repo: `app-data-grid` (mismo patrón que Alcance V2), íconos lucide existentes, vars CSS estándar.

### Tests (38 nuevos)

- `admin-nominas.presenter.spec.ts` (7): columnas en orden, filtros sin duplicados, `filtrarResumenes` por estado, por observaciones (críticas/advertencias/limpias), búsqueda libre, combinaciones AND.
- `admin-nominas.rules.spec.ts` (8): `puedeEliminarBorrador` (solo borrador), `puedeReabrir` (solo cerrada), `tieneLiquidaciones`, `puedeAnular`, `accionesDisponibles` para borrador, cerrada y anulada (matriz).
- `admin-nominas-presentacion.util.spec.ts` (7): `estadoNominaToBadge` para los 9 estados, `tipoNominaToLabel` para los 4 tipos, `formatearActualizada` (Hoy / dd/mm/yyyy / inválida), `calcularKpisAdminNominas` con lista poblada y con lista vacía.
- `admin-nominas-modal-nueva-nomina.component.spec.ts` (5): inicialización (período actual + primera empresa + tipo mensual), validación de período, emisión `(creada)` con `NominaPeriodo` válida, `cerrarModal` emite `(cerrar)`, período inválido NO emite.
- `admin-nominas-modal-resumen-nomina.component.spec.ts` (5): métricas reflejan totales, `mensajeGuardia` positivo cuando `puedeCalcular && puedeCerrar`, bloquea cuando hay críticas, `contextoVista` expone empresa/periodo/badge, `cerrarModal` emite.
- `administrador-nominas-container.spec.ts` (6): instancia + carga adapter, KPIs reflejan adapter, `abrirNuevaNomina/cerrarNuevaNomina` alterna flag, `abrirResumen` carga `ResumenValidacionNomina`, `abrirGenerador` llama a `router.navigate(['/remuneraciones/nomina-mensual-v2'], { queryParams: { periodo, nominaPeriodoId } })`, `onNominaCreada` agrega resumen al inicio y cierra modal.

### Validación

- `npx ng test --watch=false` con scope F2: **38/38 passed**.
- `npx ng test --watch=false` suite completa: **1410 passed / 7 failed** (los 7 son los mismos pre-existentes documentados en F1; F2 no introduce regresiones).
- `npx ng build --configuration=development`: bundle correcto, sin nuevos budget warnings. Nuevo lazy chunk `administrador-nominas-page = 140.44 KB` (bajo el budget de 150 KB del plan). Initial total sin cambios (2.35 MB).
- `ReadLints` sobre F2: 0 errores.

### Limitaciones conocidas (declaradas, NO bugs)

- **Sin persistencia real**: el adapter mock de F1 no expone `crearNominaPeriodo`. F2 inyecta la `NominaPeriodo` recién creada en memoria local del container. Refresh de página la pierde. F3 conectará persistencia.
- **Sin acciones avanzadas en UI**: `eliminar-borrador`, `reabrir`, `anular`, `ver-liquidaciones` están declaradas en `rules` y testeadas, pero NO se renderizan en F2. F3+ las habilitará.
- **Navegación al Generador es placeholder**: la ruta definitiva `/remuneraciones/nominas/:id/generador` no existe en F2. F2 navega a `/remuneraciones/nomina-mensual-v2?periodo=...&nominaPeriodoId=...`. V2 actual no lee `nominaPeriodoId` todavía; no hace daño. F3 conectará la ruta definitiva.

### Archivos NO tocados

- `src/styles/*`, `angular.json`, `postcss.config.json`, fuentes globales — sin cambios.
- V1 (`proceso-mensual-container/*`) y V2 (`nomina-mensual-v2/*`) — sin cambios.
- Adapter mock de F1 — sin cambios (F2 sólo consume).
- BD / SQL / RPC / RLS — sin cambios.

---
## 2026-06-03 - Nómina mensual — Reconstrucción Admin + Generador (NOM-REBUILD-NOMINA-MENSUAL-01 F0+F1)

Inicio de la **reconstrucción controlada** del módulo según el prompt rector `prompt_reconstruccion_controlada_nomina_mensual.md`. Esta entrada cubre F0 (documentación arquitectónica) + F1 (modelos centrales + adapter mock + tests). F2-F7 declaradas pero no ejecutadas en esta iteración. **Sin cambios visuales**: el alcance es modelos + adapter mock + documentación, no UI.

### Decisión arquitectónica

- **Nómina mensual** → Administrador de nóminas (bandeja de N nóminas por período, lista `NominaPeriodoResumen[]`).
- **Nómina mensual V2** → Generador de una nómina por `:nominaPeriodoId`, stepper de 6 pasos: `Parámetros / Dotación / Movimientos / Cálculo / Validación / Cierre`.
- **Naming definitivo**: `Dotación` (paso del Generador, reemplaza Alcance+Empleados) + `SegmentoNomina` (grupo operativo, reemplaza Sub-base / Sub-nómina). NO usar `Base`, `Sub-base`, `SubBaseNomina`, `Sub-nómina`.
- **Routing definitivo**: `/remuneraciones/nominas` (Admin) + `/remuneraciones/nominas/:nominaPeriodoId/generador` (Generador). Implementación en F3.
- **Servicios**: sufijo `mock-adapter` para F1 (datos in-memory), `calculo-adapter` para F6 (puente al motor), `.repository.ts` / `.service.ts` para productivo futuro.

### F0 — Documentación arquitectónica

- **Nuevo**: [`docs/codex/modulos/nomina-mensual/arquitectura-administrador-generador.md`](./modulos/nomina-mensual/arquitectura-administrador-generador.md) (~260 líneas) — decisión rectora completa: roles, naming, stepper, routing, principio rector (trabajo por excepción), modelos centrales, adapter mock, reglas de uso de mocks, fases declaradas, restricciones levantadas vs vigentes.
- **Actualizado**: [`docs/codex/orquestador/estado-fases/nomina-mensual.md`](./orquestador/estado-fases/nomina-mensual.md) — entrada `NOM-REBUILD-NOMINA-MENSUAL-01` (Implementada F0+F1). Marcada como `Superseded by NOM-REBUILD-NOMINA-MENSUAL-01`: `NOM-MULTI-NOMINA-01` (la nueva arquitectura resuelve los 3 escenarios planteados con `tipo: 'extraordinaria'` + Admin que maneja N nóminas por período).
- **Actualizado**: [`docs/codex/orquestador/contexto-proyecto.md`](./orquestador/contexto-proyecto.md) — sección de módulos con la reinterpretación del menú.
- **Actualizado**: [`docs/codex/contexto-rapido.md`](./contexto-rapido.md) — sección 8 "Decisiones de producto vigentes" con el bullet de la reconstrucción.
- **Actualizado**: [`docs/codex/modulos/nomina-mensual/README.md`](./modulos/nomina-mensual/README.md) — cabecera con link al documento rector.
- **Actualizado**: [`.gitignore`](../../.gitignore) — agrega excepción para `arquitectura-administrador-generador.md` siguiendo el patrón del repo (otras `nomina-*` están como excepciones explícitas).

### F1 — Modelos centrales + adapter mock + tests

Ubicación: `src/app/features/nomina-mensual/models/` y `.../services/` (compartido entre Admin y Generador, conviven con los modelos productivos existentes `proceso-mensual.model.ts` y `acta-operativa-periodo.model.ts`).

#### Modelos nuevos (19 tipos)

- **`nomina-periodo.models.ts`** (12 tipos): `EstadoNomina` (9 estados, inicial `dotacion_generada`), `TipoNomina` (mensual/quincenal/semanal/extraordinaria), `NominaPeriodoResumen`, `NominaPeriodo`, `SegmentoNomina` (tipo: planta/honorarios/centro_costo/personalizada, estado: borrador/lista/bloqueada), `IncidenciaNomina` (severidad + `bloqueante: boolean`), `ResumenValidacionNomina` (doble guardia `puedeCalcular` + `puedeCerrar`), `EstadoTrabajadorNomina` (6 estados), `FilaTrabajadorNominaResumen` (campos resumidos sin detalle), `DetalleTrabajadorNomina` (bajo demanda), `FiltroRapidoDotacion`, `PaginacionGrilla`, `EventoAuditoriaNomina` (TODO declarado para trazabilidad cierre/reapertura). Helpers: `crearNominaResumen`, `crearNomina`, `crearSegmento`, `agregarTrabajadorASegmento` (rechaza duplicidad), `moverTrabajadorEntreSegmentos` (preserva movimientos).
- **`movimiento-nomina.models.ts`** (7 tipos): `MovimientoTipo` (union string abierta), `MovimientoCategoria` (haber/descuento/ausencia/informativo), `MovimientoUnidad`, `MovimientoFrecuencia`, `MovimientoRecurrente` (segmentación por `trabajadorId? / segmentoId? / centroCostoId? / cargoId? / tipoContratoId? / grupoId?`), `MovimientoNomina` (con `recurrenteId?` para idempotencia y `estado='omitido'` que respeta decisión manual), `CriterioAplicacionRecurrente` (discriminated union por 6 criterios — fuerza exhaustividad en `switch`), `AccionMasivaTrabajadores` (4 acciones), `PreviewAccionMasivaTrabajadores` (preview obligatorio con `puedeAplicar`).

#### Mock determinístico

- **`data/nomina-periodo.mock.ts`**: 5 `NominaPeriodoResumen` (mezcla `borrador / dotacion_generada / calculada / aprobada / cerrada` + 1 `extraordinaria`), 3 `SegmentoNomina` (planta 14 trab / honorarios 6 trab / proyecto 4 trab), 6 `MovimientoRecurrente` (uno por cada criterio de segmentación), 3 `MovimientoNomina` (mezcla recurrente aplicado / manual / omitido), 8 `IncidenciaNomina` (mezcla críticas bloqueantes / advertencias / informativas), 24 `FilaTrabajadorNominaResumen` (paginación), 3 `DetalleTrabajadorNomina` clave-valor por trabajador. Cabecera obligatoria: `NO importar desde servicios productivos definitivos`.

#### Adapter mock

- **`services/nomina-periodo-mock-adapter.service.ts`** (`@Injectable({ providedIn: 'root' })`, 9 métodos públicos):
  - `listarResumenes()` — Admin lista resúmenes sin detalle.
  - `obtenerNomina(id)` — Generador carga 1 nómina por id.
  - `consolidarSegmentosParaCalculo(id): ResultadoAlcanceNomina` — puente al orquestador V2 actual (compatible).
  - `aplicarRecurrentesANomina(id)` — **idempotente** (clave `nominaPeriodoId + trabajadorId + recurrenteId + tipo`) y **respeta omitidos** (si la clave tiene `estado='omitido'`, NO reaplica).
  - `aplicarRecurrentePorCriterio(criterio, id, recurrenteId?)` — discriminated union por 6 criterios, exhaustivo via `never`.
  - `validarDuplicidadTrabajadorSegmento(id)` — incidencias bloqueantes.
  - `obtenerResumenValidacionNomina(id)` — `puedeCalcular` + `puedeCerrar`.
  - `filtrarDotacion(id, filtro, paginacion)` — filtros + paginación, NO retorna detalle.
  - `obtenerDetalleTrabajador(id, trabajadorId)` — bajo demanda.
  - `previsualizarAccionMasiva(id, trabajadorIds, accion)` — preview obligatorio antes de aplicar.

#### Tests (28 nuevos)

- **`models/nomina-periodo.models.spec.ts`** (5 tests obligatorios): helpers de creación, estado inicial `dotacion_generada`, ordinal del segmento, **rechazo de duplicidad** entre 2 segmentos activos, **mover trabajador preservando movimientos**.
- **`services/nomina-periodo-mock-adapter.service.spec.ts`** (23 tests, 20 obligatorios + 3 extras): aplicación de recurrentes activos, **idempotencia (dos veces no duplica)**, **respeto de omitidos (no reaplica `estado='omitido'`)**, aplicación por cada uno de los 6 criterios (trabajador/segmento/centro-costo/cargo/tipo-contrato/grupo — los dos últimos exhaustivos sin data en F1), `filtrarDotacion` por incidencia, paginación 10x10x4 (total=24), shape `FilaTrabajadorNominaResumen` sin campos de detalle, detalle bajo demanda, resumen de validación, doble guardia `puedeCalcular`/`puedeCerrar`, `puedeCerrar=true` sin críticas (con advertencias permitido), `consolidarSegmentosParaCalculo` compatible con orquestador, preview no modifica nómina, `puedeAplicar` reacciona a críticas. Extras: `listarResumenes` (N por período), `validarDuplicidadTrabajadorSegmento`, búsqueda case-insensitive.

### Reglas críticas declaradas

1. **Trabajo por excepción**: el usuario no revisa todos los trabajadores, solo los que tienen incidencias / cambios / movimientos especiales.
2. **Idempotencia de recurrentes** + **respeto de omitidos**: la decisión manual gana.
3. **Acciones masivas con preview obligatorio**: regla NO opcional antes de aplicar.
4. **Dos guardias de validación**: `puedeCalcular` Y `puedeCerrar` (ambas falsas si hay críticas bloqueantes).
5. **Reglas de uso de mocks**: solo tests / stories / adapters mock / UI temporal F2-F5. Prohibido importar desde servicios productivos.
6. **Auditoría declarada**: `EventoAuditoriaNomina` reservado en `NominaPeriodo.eventosAuditoria?` como TODO; emisión real en F2+F3.

### NO se tocó

- Motor productivo (`features/nomina-mensual/services/proceso-mensual.service.ts`, `NominaCalculoSnapshotRepository`, etc.).
- Routing actual (`/remuneraciones/proceso-mensual`, `/remuneraciones/nomina-mensual-v2`).
- Menú lateral (`shell-navigation.config.ts`).
- Stepper V2 actual (8 pasos, `nomina-mensual-v2.mock.ts`).
- Orquestador V2 (`resultadoAlcance`, `alcanceValidado` siguen).
- Sweep A0-A6 del paso Alcance (89 tests verdes preservados).
- Modelos productivos existentes (`proceso-mensual.model.ts`, `acta-operativa-periodo.model.ts`, `entrada-mensual-periodo.model.ts`).
- BD / SQL / RPC / RLS, Previred, LRE, Reportes, Licencias médicas, liquidaciones productivas.
- `angular.json`, `postcss.config.json`, `src/styles/*`.

### Validación

- `ReadLints` sobre los 7 archivos nuevos → **sin errores**.
- `npx ng test --watch=false --include="**/nomina-mensual/models/nomina-periodo.models.spec.ts" --include="**/nomina-mensual/services/nomina-periodo-mock-adapter.service.spec.ts"` → **28/28 ok** (2 archivos spec).
- `npx ng test --watch=false` (suite completa): **1372/1379 verdes**. Los 7 fallidos (`shell-navigation.config`, `sidebar.component`, `liquidaciones-oficiales.service`, `nomina-msgbox-lab.rules`, `proceso-mensual-flow-nav.rules`) son **pre-existentes** (validado con `git stash`: fallan igual sin mis cambios). NO están relacionados con F1.
- `npx ng build --configuration=development` → **verde, sin warnings de budget**. Bundle `nomina-mensual-v2-page` queda en **696.73 kB** (igual que antes — mis archivos son aditivos, no se importan desde V2).

### Pendiente declarado para iteraciones futuras

- **F2** (UI Administrador): cards resumen + grilla `NominaPeriodoResumen[]` + modal "Nueva nómina" + modal "Ver resumen" (consume `obtenerResumenValidacionNomina`) + acciones condicionadas por estado + navegación al Generador.
- **F3** (Generador definitivo): routing nuevo + menú + stepper de 6 pasos + orquestador V2 unificado.
- **F4** (Dotación escalable): paso unificado con segmentos + filtros rápidos + paginación + virtual scroll + acciones masivas + detalle bajo demanda.
- **F5** (Movimientos integrados): recurrentes aplicados + manuales + omitir / editar este mes + import futuro.
- **F6** (Cálculo / motor): adapter `Segmentos + movimientos → base consolidada → motor actual`.
- **F7** (Limpieza): ruta antigua, stepper antiguo, mocks obsoletos, código sin uso.
- **Deuda pre-existente** (no relacionada con esta fase): 7 tests rojos en 5 archivos de layout / liquidaciones / rules de nomina-mensual v1. Documentado para iteración separada.

---
## 2026-06-03 - Nómina mensual V2 · Paso Alcance — Refinamiento NOIA + datagrid del sistema (A0-A3)

Sweep transversal del paso Alcance siguiendo el contrato NOIA. Cuatro sub-lotes (`A0`/`A1`/`A2`/`A3`) ejecutados en secuencia para reducir ruido, alinear la selección manual con el patrón de Empleados (data-grid reutilizable) y agregar guías contextuales cuando el alcance queda incompleto.

### Cambios

- **A0 — Aside stretch + título compacto + banda stats inteligente**
  - `nomina-mensual-v2-paso-alcance.component.css`: `.nmv2-paso-alcance__body { align-items: stretch }` (antes `start`) — el `<aside>` ahora llega al final del contenido, mismo fix que aplicamos en Empleados.
  - `nomina-mensual-v2-paso-alcance.component.html`: `<h2>` cambia de `"¿Qué trabajadores quieres preparar para esta nómina?"` (8 palabras, competía con la banda de stats por ancho) a **`"Define el alcance de la nómina"`** (6 palabras, NOIA operativo).
  - `nomina-mensual-v2-paso-alcance.component.ts` (`metricasAlcance`): la banda de 4 stats ahora se filtra dinámicamente. Antes mostraba siempre `Encontrados / Incluidos / Excluidos / Bloqueados` con `0`. Ahora:
    - **Sin tipo elegido (`sinConfigurar`)**: solo `Encontrados`.
    - **Con tipo elegido**: `Encontrados + Incluidos + Excluidos`.
    - **Bloqueados**: solo aparece si `> 0` (deja de mostrar `0` que parecía falso positivo).

- **A1 — Lista de 3 tipos NOIA puro**
  - `nomina-mensual-v2-paso-alcance.component.html`: en `__row-mark` se elimina el texto `"Elegir"` / `"Seleccionado"` (redundante con el ícono check y el highlight del row activo). Estado activo muestra solo el ícono `check`; estado disponible muestra `chevron-right`; estado locked sigue mostrando `lock + No disponible` (estado informativo válido).
  - `nomina-mensual-v2-paso-alcance.component.css`: `__row` con `padding: 8px 12px` (antes `10px 12px`, −20% altura). `__row-mark` ahora con color `#94a3b8` (slate-400, antes `#475569`) y `lucide-icon` de `14×14` (antes `12×12`) para que el ícono lea como mark visual sin texto. Estado activo: `__row-mark` cambia a `#047857` (verde afirmativo) en lugar de `#1d4ed8` (azul de la fila activa) para no duplicar el código de color.

- **A2 — Selección manual con `app-data-grid` (reutilización del sistema)**
  - **Nuevo presenter**: `presenters/nomina-alcance-grid.presenter.ts` exporta `COLUMNAS_GRILLA_ALCANCE_MANUAL` (7 columnas: `incluir` ★, `nombre`, `rut`, `cargo`, `centroCosto`, `estadoNomina`, `contrato`) y `crearFiltrosGrillaAlcanceManual(filas)` (búsqueda por tokens + 3 selects sobrios: centro de costo / estado nómina / contrato).
  - **Componente**: importa `DataGridComponent` y `DataGridCellDirective` del `shared/components/ui/data-grid`. Se eliminan los signals `busquedaManual` y `filasSeleccionManual` (ya no se necesitan: el grid maneja su propio filtrado). Se reutiliza el modelo existente `FilaEmpleadoNomina` (mismo del paso Empleados — un solo origen de verdad).
  - **HTML**: el `@if (tipoAlcanceSeleccionado() === 'seleccionManual')` reemplaza la `<ul class="nmv2-paso-alcance__manual">` + input de búsqueda por un `<app-data-grid>` completo con 4 templates de celda custom (`incluir` con checkbox + `nombre` con avatar + `estadoNomina` con badge + `contrato` con badge). Persistencia clave `nmv2-paso-alcance-manual:{periodoYm}` (filtros del usuario se guardan por período).
  - **Por qué**: cuando hay >100 trabajadores, la lista vertical escalaba mal (overflow vertical, sin filtros laterales). El data-grid añade búsqueda por tokens, filtros sobrios, ordenamiento, paginación y empty states diferenciados — todo gratis del componente del sistema, sin código local nuevo.

- **A3 — Sidebar operativo + alert-banner inline**
  - **Alert-banner inline contextual**: nuevo `@if (alcanceVacioRequiereSeleccion())` dentro de `__main` que muestra `alert-banner alert-banner--warning` cuando hay tipo elegido (`grupo` o `seleccionManual`) pero `trabajadoresIncluidos === 0`. Mensaje viene del presenter (`obtenerDescripcionAlcanceVacia(tipo)` ya existente). Antes esta señal solo se notaba en la banda de stats con un `0` ambiguo.
  - **Pill de severidad en checklist**: cada item del sidebar `Lista para continuar` ahora muestra una pill con `Listo` / `Revisar` / `Bloqueo` / `Pendiente` (mismo patrón visual que Empleados con `--correcto / --advertencia / --bloqueante / --neutro`). Los helpers `etiquetaSeveridadChecklistAlcance(status)` y `claseSeveridadChecklistAlcance(status)` son locales al componente (mapean `ChecklistStatus → label/clase`).
  - **CSS**: nuevas reglas `.nmv2-paso-alcance__checklist-row-title` (flex space-between para acomodar título + pill) y `.nmv2-paso-alcance__checklist-severity--*` (4 modificadores).

### NO se tocó

- Modelo `TipoAlcanceNomina` ni discriminant (`'contrato'` sigue válido para fase futura).
- Presenter `nomina-alcance.presenter.ts`: sin cambios (las descripciones y reglas ya cumplían NOIA tras la sesión anterior).
- Orquestador, services productivos, motor, modal de trazabilidad.
- CSS global, `angular.json`, `postcss.config.json`, `src/styles/*`.
- Lógica de avance (`ejecutarAccionPrincipal`, `guardarResultadoYAvanzar`): el contrato sigue igual.

### Hallazgo declarado: nóminas múltiples (NOM-MULTI-NOMINA-01 — propuesta futura)

Durante el sweep surgió la pregunta de cómo generar **múltiples nóminas del mismo período** (ej. nómina principal + complementaria por bono retroactivo + nómina paralela de honorarios). El paso Alcance **no es el lugar correcto** para resolver esto: el modelo actual asume `1 preparación → 1 alcance → 1 resultado` en `orquestador.resultadoAlcance`. La propuesta queda registrada en `orquestador/estado-fases/nomina-mensual.md` como **NOM-MULTI-NOMINA-01 (Propuesta)** para evaluarse cuando se necesite. Tres escenarios diferenciados:

1. **Nómina complementaria** del mismo período (bono retroactivo, finiquito parcial): nuevo `tipoCalculo` sobre la preparación cerrada — no es nuevo alcance.
2. **Reproceso** del mismo alcance: ya cubierto con `seleccionManual` + volver al paso Empleados.
3. **Nóminas paralelas** del mismo período (planta/honorarios/obreros): hoy se modela con `grupo` (centros de costo) — no requiere nóminas separadas.

### Validación

- `ReadLints` sobre los 4 archivos tocados + nuevo presenter — **sin errores**.
- `npx ng test --watch=false --include="**/nomina-mensual-v2/**/nomina-mensual-v2-paso-alcance.component.spec.ts"` → **11/11 ok** (6 previos + 5 nuevos: `metricasAlcance` sin tipo, `metricasAlcance` con tipo, `etiquetaSeveridadChecklistAlcance`, `claseSeveridadChecklistAlcance`, `alcanceVacioRequiereSeleccion`).
- `npx ng test --watch=false --include="**/nomina-mensual-v2/**/*.spec.ts"` → **85/85 ok** (17 specs en V2). Sin regresiones.
- `npx ng build --configuration=development` → **verde, sin warnings de budget**. Bundle lazy `nomina-mensual-v2-page` quedó en 684.05 kB (alta ~6 kB respecto al estado anterior por la importación del `DataGridComponent`; aceptable porque el chunk del data-grid se reutiliza con el paso Empleados, no es código nuevo).

---

## 2026-06-03 - Nómina mensual V2 · Paso Alcance — Panel de incidencias contextual (A6)

Extensión del sweep `NOM-V2-PASO-ALCANCE-REFINAMIENTO-01`. Cuando el usuario elige **`empresaCompleta`** o **`grupo`** y el alcance resultante incluye trabajadores con pendientes (contrato vencido, datos bancarios incompletos, AFP/Salud sin asignar, jornada/centro de costo sin definir, documentación incompleta o estado de nómina observado), se despliega inline un **datagrid del sistema** con esos trabajadores y sus badges de problema. La idea es que el RRHH **vea exactamente quién requiere revisión** antes de avanzar al paso Empleados, en lugar de descubrirlo en el siguiente paso.

### Cambios

- **`presenters/nomina-alcance-grid.presenter.ts`** (extendido):
  - Importa `centroCostoAsignado`, `documentacionIncompleta`, `jornadaDefinida` desde `nomina-empleados-grid.presenter.ts` (reuso, no duplicación).
  - Nuevo helper **`filaTieneIncidenciaAlcance(fila): boolean`**: detecta cualquier dimensión que rompa el alcance (7 criterios — mismos del presenter de validación de empleados).
  - Nuevo helper **`obtenerTrabajadoresConIncidencias(filas, idsIncluidos): FilaEmpleadoNomina[]`**: filtra del conjunto las filas que están incluidas en el alcance Y tienen al menos una incidencia.
  - Nueva columna export **`COLUMNAS_GRILLA_ALCANCE_INCIDENCIAS`** (6 columnas: nombre+avatar, RUT, centro de costo, estado nómina con badge, contrato con badge, datos bancarios con badge). Sin checkbox de "Incluir" (estos trabajadores ya están incluidos: el panel es informativo, no de selección).

- **`nomina-mensual-v2-paso-alcance.component.ts`**:
  - Nuevos computeds: `trabajadoresConIncidencias()` (lista filtrada), `mostrarPanelIncidencias()` (true solo si tipo es `empresaCompleta`/`grupo` y hay ≥1 incidencia), `clavePersistenciaGrillaIncidencias()` (clave por período + tipo de alcance — los filtros que el usuario abra se guardan por contexto).
  - Importa `COLUMNAS_GRILLA_ALCANCE_INCIDENCIAS`, `obtenerTrabajadoresConIncidencias` y `claseBadgeDatosBancarios`.

- **`nomina-mensual-v2-paso-alcance.component.html`**:
  - Nuevo `@if (mostrarPanelIncidencias())` después del panel de grupo (y antes del de selección manual). Sección con título `"Trabajadores con pendientes en el alcance"` + contador `X de Y incluidos tiene observaciones. Revísalos antes de avanzar al paso Empleados.` + `<app-data-grid>` con `[filters]="[]"` (sin filtros — la lista ya es acotada), 4 templates de celda (`nombre`, `estadoNomina`, `contrato`, `datosBancarios`).
  - **No aparece** para `seleccionManual` porque la grilla manual ya muestra los badges en cada fila y permite revisar al elegir.

- **`nomina-mensual-v2-paso-alcance.component.css`**:
  - Nuevas reglas `.nmv2-paso-alcance__panel--incidencias` (mismo patrón que `--grilla` pero con `border-color: #fcd34d` y `background: #fffbeb` — acento ámbar suave que comunica "revisar" sin gritar). Header con `color: #92400e` (titular) y `color: #78350f` (descripción) — ámbar más oscuro para WCAG AA contra fondo ámbar claro.

### NO se tocó

- Modelo de validación: `obtenerResultadoValidacionEmpleados` y `filtrarEmpleadosConPendientes` siguen igual; el helper de incidencias del alcance reusa los predicados base.
- Presenter `nomina-alcance.presenter.ts`: sin cambios.
- Paso Empleados, orquestador, services productivos, motor, BD/RPC/RLS.

### Decisiones rectoras

- **Por qué no usar `app-message-box`**: el dataset puede tener decenas de trabajadores. Un message-box con bullet list escala mal y no permite filtrar/ordenar. El `app-data-grid` es el patrón correcto.
- **Por qué no hay filtros en este datagrid**: la lista ya es acotada (solo incidencias) y agregar filtros invitaría a ocultar problemas. El usuario debe **ver todos** los pendientes y decidir cómo proceder (volver a Parámetros o avanzar a Empleados para corregirlos uno por uno).
- **Por qué no mostrarlo en `seleccionManual`**: en ese modo la grilla principal ya muestra los badges de cada trabajador en sus columnas. Duplicar el panel sería redundante y confuso.
- **Por qué acento ámbar y no rojo**: el panel comunica "revisar", no "bloqueo crítico". El usuario aún puede avanzar (con `app-message-box` de revisión) y resolver en el paso Empleados. Rojo se reservó para `alert-banner--error` del header (errores de carga).

### Validación

- `ReadLints` sobre los 3 archivos tocados (presenter + component.ts + component.html + component.css) — **sin errores**.
- `npx ng test --watch=false --include="**/nomina-mensual-v2/**/nomina-mensual-v2-paso-alcance.component.spec.ts"` → **15/15 ok** (11 previos + 4 nuevos: `filaTieneIncidenciaAlcance` por dimensión, `obtenerTrabajadoresConIncidencias` filtra solo incluidos, `mostrarPanelIncidencias` false en manual, `mostrarPanelIncidencias` true en empresaCompleta).
- `npx ng test --watch=false --include="**/nomina-mensual-v2/**/*.spec.ts"` → **89/89 ok** (17 specs). Sin regresiones.
- `npx ng build --configuration=development` → **verde, sin warnings de budget**. Bundle lazy `nomina-mensual-v2-page` quedó en 696.73 kB (alta ~13 kB respecto a A5 por las nuevas columnas + templates; aceptable, dentro del budget).

---

## 2026-06-03 - Nómina mensual V2 · Paso Alcance — Omitir opción "Por contrato"

Decisión rectora: la opción **"Por contrato"** (estado `preparado` + etiqueta "Próximamente") se omite del listado visible del paso Alcance. La fase para exponer el tipo de contrato desde Personal queda planificada aparte; mientras tanto, mostrar la opción inerte aporta ruido visual y confunde al usuario.

### Cambios

- **`presenters/nomina-alcance.presenter.ts`**: eliminado el bloque `{ id: 'contrato', titulo: 'Por contrato', descripcion: '...', icono: 'file-text', estado: 'preparado', etiqueta: 'Próximamente' }` del array `obtenerOpcionesAlcanceNomina()`. Quedan **3 opciones**: `empresaCompleta`, `grupo`, `seleccionManual`.
- **Branches defensivos preservados**: los `case 'contrato'` en `calcularIdsTrabajadoresIncluidos`, `obtenerResultadoAlcance` (estado `sinConfigurar`), `obtenerMensajeAlcanceBloqueado` y `obtenerDescripcionResumenAlcance` se **mantienen intactos** para que el tipo `TipoAlcanceNomina = 'contrato'` siga siendo válido en el modelo cuando la fase regrese. No se borra el discriminant; solo se oculta la opción de UI.
- **`containers/.../components/nomina-mensual-v2-paso-alcance/nomina-mensual-v2-paso-alcance.component.spec.ts`**:
  - Test renombrado `expone las cuatro opciones de alcance` → `expone las tres opciones de alcance del presenter (sin "contrato", se hará en otra fase)`. Espera ahora `['empresaCompleta', 'grupo', 'seleccionManual']` y `toHaveLength(3)`.
  - Test `seleccionarTipoAlcance ignora opciones deshabilitadas o ya preparadas`: el caso de `deshabilitado` ahora usa `'grupo'` en lugar de `'contrato'` (que ya no aparece en `opcionesAlcance`). La validación de la guard sigue siendo la misma (estado prevalece sobre id).
- **HTML del paso-alcance**: sin cambios manuales — el `@for (opcion of opcionesAlcance; track opcion.id)` deja de renderizar la opción automáticamente al desaparecer del array.

### NO se tocó

- Modelo `TipoAlcanceNomina` (sigue siendo `'empresaCompleta' | 'grupo' | 'contrato' | 'seleccionManual'`). El tipo se preserva para que la fase futura pueda reactivar la opción sin migración de datos.
- Orquestador, services productivos, motor, modal de trazabilidad, copy de otros pasos.
- Spec del presenter (`nomina-alcance.presenter.spec.ts`): no tenía aserciones específicas de `'contrato'`.

### Validación

- `ReadLints` sobre presenter + spec — sin errores.
- `npx ng test --watch=false --include="**/nomina-mensual-v2/**/nomina-mensual-v2-paso-alcance.component.spec.ts"` → **6/6 ok**.
- `npx ng test --watch=false --include="**/nomina-mensual-v2/**/nomina-alcance.presenter.spec.ts"` → **3/3 ok** (branches defensivos no rotos).
- HMR de `npm start` activo: recompiló `nomina-mensual-v2-page` (699.52 kB, −0.25 kB vs anterior) sin errores ni warnings.

---

## 2026-06-03 - Nómina mensual V2 · Paso Empleados — Quitar panel de Trazabilidad + aside hasta el final

Continuación inmediata del cambio anterior ("Quitar 'Registro del paso'"). Decisión rectora: el **panel completo de trazabilidad** ya no aporta valor en el sidebar de Empleados; el contexto ya está cubierto por la cabecera + checklist + leyenda de filtrado, y los detalles de auditoría siguen accesibles desde el modal de trazabilidad global (no afectado).

### Cambios

- **`components/nomina-mensual-v2-paso-empleados/nomina-mensual-v2-paso-empleados.component.html`**: eliminada la línea `<app-nomina-mensual-v2-trazabilidad-paso paso="employees" variant="panel" />` del bloque `Lista para continuar` del sidebar. El bloque ahora arranca con la `<header>` (`Lista para continuar` + lead) seguido directo del `<ul class="...checklist">`.
- **`components/nomina-mensual-v2-paso-empleados/nomina-mensual-v2-paso-empleados.component.ts`**: removido el `import` de `NominaMensualV2TrazabilidadPasoComponent` y su referencia en el array `imports` del `@Component`.
- **`components/nomina-mensual-v2-paso-empleados/nomina-mensual-v2-paso-empleados.component.css`**: `nmv2-paso-empleados__body` cambia de `align-items: start` → `align-items: stretch` para que el `aside` ocupe la **misma altura que el main** (grilla + toolbar), llegando al final del contenido en lugar de quedar acortado a su altura natural.
- **Componente eliminado**: `components/nomina-mensual-v2-trazabilidad-paso/` (carpeta completa borrada — `.html` + `.ts`). Era usado **solo** desde el paso Empleados con `variant="panel"`; la variante `inline` no se usaba en ningún sitio (verificado con grep sobre `src/`).
- **`nomina-mensual-v2-container.css`**: borradas **12 reglas / ~87 líneas** del cluster `.nmv2-trazabilidad-panel*` y `.nmv2-trazabilidad-paso*` (`__head h3`, `__meta`, `__meta div/dt/dd`, `__action`, `__copy`, `__copy em`, `__icon`, `--compact`). Las reglas `.nmv2-trazabilidad-drawer-*` se conservan intactas (corresponden al modal global de trazabilidad, sin relación).
- **NO se tocó**: orquestador, services, presenters, motor, modal global de trazabilidad (`nomina-mensual-v2-trazabilidad-modal`), specs existentes ni copy de otros pasos.

### Validación

- `ReadLints` sobre los 4 archivos editados — sin errores.
- Grep en `src/` de `NominaMensualV2TrazabilidadPasoComponent`, `app-nomina-mensual-v2-trazabilidad-paso`, `nmv2-trazabilidad-panel`, `nmv2-trazabilidad-paso` → **0 matches** residuales.
- `npm start` con HMR activo: recompiló `nomina-mensual-v2-page` (699 kB) en 0,9–2 s, sin errores ni warnings nuevos. Component update enviado al cliente.

### Notas para limpieza futura (opcional)

El orquestador (`nomina-mensual-v2-orquestador.port.ts`) sigue exponiendo `auditoriaPorPaso()`, `eventosTrazabilidad()` y `abrirTrazabilidadPaso()`. Esos métodos siguen vivos porque los consume el modal global de trazabilidad (`nomina-mensual-v2-trazabilidad-modal`) y el stepper. No se tocan en este lote.

---

## 2026-06-03 - Nómina mensual V2 · Paso Empleados — Quitar "Registro del paso"

Cambio NOIA local del panel de trazabilidad del paso Empleados (sidebar "Lista para continuar"). El label estático **"Registro del paso"** es redundante porque el panel ya vive dentro del sidebar del paso Empleados y muestra el título de la acción dinámica debajo (`tituloRegistro()`).

- **Archivo HTML**: `components/nomina-mensual-v2-trazabilidad-paso/nomina-mensual-v2-trazabilidad-paso.component.html` — en la rama `variant === 'panel'` se eliminó el `<h3>Registro del paso</h3>` y se promovió el `<p>{{ tituloRegistro() }}</p>` a `<h3>{{ tituloRegistro() }}</h3>` para preservar jerarquía semántica + tamaño (12 px / 700, el mismo que tenía el label).
- **Archivo CSS**: `nomina-mensual-v2-container.css` — eliminada la regla muerta `.nmv2-trazabilidad-panel__head p { margin: 4px 0 0; font-size: 11px; color: #64748b; }`. La regla `.nmv2-trazabilidad-panel__head h3` se conserva intacta.
- **Scope verificado**: el componente `app-nomina-mensual-v2-trazabilidad-paso` solo se usa con `variant="panel"` en un único punto del repo (paso Empleados, `nomina-mensual-v2-paso-empleados.component.html` línea 159). El resto de usos pasan por `variant="inline"` (default), que no tiene cabecera y no se ve afectado.
- **NO se tocó**: presenter, services, orquestador, motor, copy de otros pasos, estilos globales. Tampoco se tocó la deuda L5.3 ni el resumen-pendientes.
- **Validación**: `ReadLints` sobre HTML + CSS sin errores. Grep `"Registro del paso"` en `src/` → 0 matches residuales (no hay specs que dependan del literal).

---

## 2026-06-03 - DOCS-AUDIT-02 · L0-L7 ejecutado (rotación docs/codex)

Plan iterativo declarado en `docs/codex/auditorias/auditoria-docs-codex-2026-06-03.md`. **Sin cambios visuales en la app** (solo reorganización documental). Se registra aquí únicamente porque la auditoría toca políticas operativas de documentación que afectan flujos de trabajo.

- **L0** (quick wins): repara link roto en `modulos/auth/README.md`, completa tabla del README padre (`auth`, `empresas`, `liquidaciones-oficiales`, `lre`), añade política de ubicación en `auditorias/README.md`, corrige ruta `/remuneraciones/nomina-v2` → `/remuneraciones/nomina-mensual-v2` en auditoría V2, marca `LRE-CONCEPT-RULES-01` y `EMP-PERFIL-LABORAL-SQL-01` como **Parcial**.
- **L1** (borrado masivo, −12 MB): elimina 14 carpetas `assets/parametros-tab*` huérfanas (~12 MB), 4 duplicados raíz (`prevalidaciones-9-5A/B.md`, `tests-empleados.md`, `tests-parametros.md` — superset ya vivía en `modulos/`), y `estilos/observaciones.md` (UI-FONTS ya en `observaciones.md` raíz).
- **L2** (consolidación trivial): unifica `prompts-cursor/CURSOR-UX-COMERCIAL-01.md` → `prompts/`, valida 14 stubs `temas/` (todos con redirect canónico a `modulos/`), elimina entrada duplicada `NOM-MODALES-PERIODO-REVISION-COPY-03` en `estado-fases.md`.
- **L3** (rotar `peticiones-estilos.md`): 288 entradas de mayo movidas a `archivo/peticiones-estilos-2026-05.md` (247 KB). Principal queda con 25 entradas de junio (68 KB) + índice de archivos rotados.
- **L4** (rotar `estado-fases.md` por dominio, Opción A): 111 bloques H2 distribuidos en 10 archivos bajo `orquestador/estado-fases/` (`nomina-mensual.md` 47, `empleados.md` 28, `erp-shell.md` 8, `movimientos.md` 8, `parametros.md` 4, `docs.md` 3, `liquidaciones.md` 1, `ux-comercial.md` 1, `lre-previred.md` 1, `orden.md` 10). Archivo padre queda como **índice ligero de 4 KB** con tabla de dominios. Enlaces internos reescritos automáticamente (`../X` → `../../X` para 175 links).
- **L5** (subagrupar `nomina-mensual/` + segregar V1/V2): 69 archivos planos en raíz → 3 archivos raíz (README, contrato-general, matriz-bloqueos-periodo) + 8 subcarpetas nuevas (`motor-calculo/` 12, `modales-periodo/` 10, `flow/` 18, `workspace/` 11, `prevalidaciones/` 5, `vision/` 6, `v2/` 4, `auditorias/` 3) + carpeta preexistente `preparar-nomina/` (6, intacta). 185 enlaces actualizados en 39 archivos del repo + 52 enlaces relativos del propio README. Sección **"Segregación V1/V2"** declarada en el README del módulo.
- **L6** (READMEs faltantes): 6 READMEs nuevos críticos (`diseno/`, `modulos/`, `prompts/`, `infra/`, `assets/`, `orquestador/estado-fases/`) + 8 READMEs de subcarpetas creadas en L5. Aclaraciones explícitas para `auth` (código en `core/auth/` no `features/`) y `parametros` (feature = `parametros-generales`).
- **L7** (naming + cierre): convención de naming declarada en `mapa-documentacion.md` (sección §0); 2 auditorías mal ubicadas movidas (`arquitectura/auditoria-modular-features.md` y `orquestador/auditoria-docs-2026-06.md` → `auditorias/`); cierre formal en `estado-fases/docs.md`.
- **Métricas finales**: 332 → 329 `.md`. 471 → 363 archivos totales (**−22 %**). Peso 17.300 KB → 5.283 KB (**−69 %**). Carpetas críticas sin README: 5 → 0.
- **NO se tocó**: código `src/`, `bd/`, `angular.json`, `tsconfig*`, motor, servicios productivos, contratos canónicos (`AGENTS.md`, `noia-ui-manual.md`, READMEs de módulo). Solo reorganización documental.
- **Pendiente opcional**: DOCS-AUDIT-03 — rotar `CHANGELOG.md` (64 KB), revisar `temas/` (29 stubs ¿absorber?), revisar uso real de `assets/parametros-tabs/`.

---

## 2026-06-03 - Nómina mensual V2 · L7 — Tests + cierre del plan iterativo

Cierre del plan declarado en `docs/codex/modulos/nomina-mensual/auditorias/auditoria-nomina-v2-2026-06.md`. Foco: smoke specs para los dos componentes productivos que faltaban cobertura unitaria (`paso-parametros` y `paso-alcance`) + registro de fase. **Sin cambios visuales**, solo specs nuevos.

- **Archivos nuevos**:
  - `containers/.../components/nomina-mensual-v2-paso-parametros/nomina-mensual-v2-paso-parametros.component.spec.ts` (6 tests, smoke). Verifica instanciación TestBed sin levantar template + regresión L6 en labels visibles (`parametroEstadoEtiqueta('requiereRevision')='Requiere revisión'`, `bloqueoSeveridadEtiqueta('bloqueo')='Bloqueo crítico'`, `bloqueoSeveridadEtiqueta('revision')='Revisión requerida'`), copy de modales pendientes (`mensajeModalPendientesParametros('oficiales').toContain('período')`, `mensajeModalPendientesParametros('preparacion').toContain('nómina')`), regresión NOIA de `;` en `alertaRevisionDescripcion / alertaOficialesDescripcion / alertaBloqueoDescripcion`, máquina de estados de `parametrosAlertaTipo()` (`null → error → bloqueo → oficiales → revision`).
  - `containers/.../components/nomina-mensual-v2-paso-alcance/nomina-mensual-v2-paso-alcance.component.spec.ts` (6 tests, smoke). Verifica instanciación TestBed + contrato del presenter (`opcionesAlcance` orden + length 4), `seleccionarTipoAlcance` con guardas `deshabilitado`/`preparado`, `alternarCentroCosto` toggle en `Set`, `alternarTrabajadorManual` toggle + cambio a `seleccionManual`, `inicialesEmpleado('María Pérez González')='MP'` + edge case `'  ana  '='A'`.
- **Estrategia de test**: `TestBed.createComponent(...)` sin `detectChanges()` para evitar disparar `effect()` que llaman a services productivos. Providers mínimos por componente: orquestador real (`NominaMensualV2OrquestadorPort` no tiene deps), `PeriodoActivoService` real (signal autoinicializado), services mockeados con `vi.fn().mockResolvedValue(...)`. Para paso-parametros: `Router.navigate` mockeado, `NominaParametrosResumenService.obtenerResumen`, `NominaParametrosBaseService.{obtenerEstadoBase, ...}`, `NominaParametrosBaseAccesoService.resolverPermisos` (estructura completa `PermisosRecargaBaseParametros`). Para paso-alcance: `NominaEmpleadosCargaService.cargarFilasEmpleadosNomina`.
- **NO se tocó**: código de producción, copy, CSS local, container.css, servicios, presenters ni rules. Los smoke specs son aditivos y no exigen refactor de los componentes.
- **Validación**: `npx ng test --watch=false --include=**/nomina-mensual-v2/**/*.spec.ts` → **80/80 ok** (17 specs, +12 nuevos vs L6). `ReadLints` sobre los dos spec files → sin errores.
- **Estado del plan iterativo L0–L7**: cerrado. Lo único abierto son tareas opcionales declaradas (L5.3 sweep visual-system base global + cluster Empleados V1/V7 para llevar bundle bajo budget 24 kB; deuda menor `nomina-mensual-v2-empleados-resumen-pendientes` con modal local justificado por layout).

---

## 2026-06-03 - Nómina mensual V2 · L6 — Copy + tildes (transversal)

Continuación del plan declarado en `docs/codex/modulos/nomina-mensual/auditorias/auditoria-nomina-v2-2026-06.md`. Foco: pasada RRHH sobre los tres pasos productivos (parámetros, alcance, empleados) + overlays + trazabilidad-modal + utilidades de copy. **Sin cambios visuales**, solo strings visibles.

- **Hallazgos resueltos**: residuos de H-P5 (`Snapshot`, `Base guardada`, `idCalculoPeriodoBase`, `Parametros congelados` visibles), tildes faltantes masivas en `nomina-mensual-v2-trazabilidad-modal` (formateadores de grupo/parametro/valor/vigencia/fuente y `tituloPaso`), `nomina-trazabilidad-presentacion.util` (etiquetas de integridad y estado auditoría), overlays con texto sin tildes (`parametros`, `nomina`, `periodo`, `esta`, `reemplazara`, `guardara`), y uso de `;` en copy (3 ocurrencias: presenter de acceso base, paso-parametros y rules de avance con base).
- **Archivos tocados** (todos solo strings visibles, sin cambios de lógica/tipos/identificadores):
  - `containers/.../components/nomina-mensual-v2-overlays/overlays.component.html`: títulos y mensajes de los 8 `app-message-box` del shell con tildes correctas + H-P5 (`Base→Configuración` en `Actualizar configuración`, `Mantener configuración`, `Hay cambios en los parámetros`, `Diferencias de parámetros`, `Preparar nómina de`, `Revisar parámetros de`). Reescrituras NOIA: `Alcance con observaciones→Hay observaciones en el alcance`, `Hay observaciones→Hay observaciones en los parámetros`, `Faltan datos para preparar→Faltan datos para preparar la nómina`, `Completa los datos no oficiales exigibles del mes→Completa los datos del mes antes de continuar`.
  - `containers/.../components/nomina-mensual-v2-overlays/overlays.component.ts`: secciones constantes `SECCIONES_MSG_BOX_BLOQUEO_PARAMETROS` / `SECCIONES_MSG_BOX_REVISION_PARAMETROS` y método `seccionesMsgBoxBloqueoParametros` con copy NOIA (`datos no oficiales exigibles para preparar la nomina→datos del mes antes de preparar la nómina`, `quedaran→quedarán`).
  - `containers/.../components/nomina-mensual-v2-paso-parametros/paso-parametros.component.html`: 1 string del sidebar (`Datos no oficiales exigibles que deben completarse→Datos del mes que debes completar`).
  - `containers/.../components/nomina-mensual-v2-paso-parametros/paso-parametros.component.ts`: 9 strings (mensaje "Preparando nómina", `congelar la base actual→guardar la configuración actual`, pluralización de `oficial(es) pendiente(s) no bloqueante(s)`, `;→.` en frase de revisión, `preparación del periodo→preparación del período`, mensajes `mensajeErrorPersistenciaBase` / `mensajeErrorPreparacion` con `base de parámetros→configuración de parámetros` y eliminación del `:` interno).
  - `containers/.../components/nomina-mensual-v2-trazabilidad-modal/trazabilidad-modal.component.ts`: ~26 strings con tildes en `formatearGrupoParametro`, `formatearNombreParametro` (todos los `minimo→mínimo`, `anos→años`, `gratificacion→gratificación`, `cesantia→cesantía`, `deposito→depósito`, `unico→único`, `cotizacion→cotización`, `compensacion→compensación`, `dia→día`), `formatearValorParametro` (`Si→Sí`), `formatearVigenciaParametro`, `formatearFuenteParametro` (H-P5: `Base guardada→Configuración guardada`, `Mantenedor de parametros→Mantenedor de parámetros`), `estadoOperativo` (`Requiere revision→Requiere revisión`), `tituloPaso` (los 8 pasos), `filasControlOperativo` (`Ultimo registro→Último registro`), `console.warn` y `valoresParametrosBaseError`.
  - `containers/.../components/nomina-mensual-v2-trazabilidad-modal/trazabilidad-modal.component.html`: 10 strings (eyebrow `Bitacora→Bitácora`, mensajes `Quien dejo→Quién dejó`, `ultima accion→última acción`, `Aun no hay→Aún no hay`, `aparecera→aparecerá`, `aun no tiene→aún no tiene`, `Datos guardados de parametros→parámetros`, `Valores usados por nomina→por la nómina`, `este periodo→este período`, `Base usada por nomina→Configuración usada por la nómina`, `Parametro→Parámetro` en header de tabla).
  - `presenters/nomina-parametros-base-acceso.presenter.ts`: H-P5 (`Base ya preparada→Configuración ya preparada`, `base de parámetros→configuración de parámetros`, `base guardada→configuración guardada`, `Recargar base→Recargar configuración`, `Solicita a administración→Pide acceso a administración`), `;→.` en repercusiones.
  - `rules/nomina-parametros-base-acceso.rules.ts`: H-P5 en `ayudaAvanceParametrosConBase` (`Hay diferencias con la base guardada→con la configuración guardada`, `La base del período está preparada→La configuración del período está preparada`), `;→.` en variante no admin. Preserva `Continuar a alcance` para el spec.
  - `services/nomina-parametros-base.service.ts`: 1 string de error (`confirmar el guardado de la base de parámetros→confirmar el guardado de la configuración de parámetros`).
  - `utils/nomina-trazabilidad-presentacion.util.ts`: comentario `validacion→validación` y 11 etiquetas visibles (`Snapshot registrado→Registro guardado`, `Snapshot invalidado→Registro invalidado`, `Pendiente de verificacion servidor→Pendiente de verificación del servidor`, `Parametros cerrados/revisados→Parámetros cerrados/revisados`, `Prenomina validada→Prenómina validada`, `Nomina aprobada→Nómina aprobada`, `Pendiente de aprobacion→Pendiente de aprobación`, `Calculo ejecutado→Cálculo ejecutado`, `Parametros congelados→Parámetros cerrados` para `EstadoAuditoriaPasoNomina.congelado`, `Requiere revision→Requiere revisión`).
  - `containers/.../facade/nomina-mensual-v2-navegacion.ts`: 1 subtítulo de paso congelado (`calculation`) con H-P5 (`guarda el snapshot antes de validar→guarda el registro del cálculo antes de validar`).
- **NO se tocó**:
  - Pasos congelados productivos (movements/calculation/validation/approval/payslips) más allá del subtítulo del paso `calculation`.
  - El componente `nomina-mensual-v2-empleados-resumen-pendientes` (modal local justificado por layout multi-acción + métricas + secciones agrupadas con botones por item; no encaja en `app-message-box` actual y su copy ya estaba limpio). Queda anotado para evaluar en L7+ si conviene extender `app-message-box`.
  - El paso 1 `parametros-generales` (alcance separado, ya cerrado).
  - Estilos globales (`src/styles*.css`, `src/styles/*`), `angular.json`, motor/RPC/BD/RLS, servicios de persistencia. Sin cambios en `tests`/`spec`.
- **Validación**: `npx ng test --include="**/nomina-mensual-v2/**/*.spec.ts"` → **68/68 ok** (15 specs, 247 ms). `npx ng build --configuration=development` → **17.96 s**, sin errores ni warnings (los warnings de budget son de build prod y son pre-L6). `ReadLints` sobre todos los archivos editados → sin errores.
- **Anti-patrón evitado**: cuidado activo con `;` en copy visible (el usuario lo recordó explícitamente en sesión). Política aplicada: dos frases con `.` o conector (`. Y`, `y`, `o`, `pero`) en vez de punto y coma. Verificado con grep cero `;` en strings visibles del feature al cierre.

---

## 2026-06-02 - Nómina mensual V2 · L5.2 — Sweep quirúrgico cluster Parámetros V1

Continuación del lote 5 declarado en `auditoria-nomina-v2-2026-06.md`. Foco: barrer el cluster legacy de Parámetros V1 en `nomina-mensual-v2-container.css` (originalmente líneas 1.856–4.150) preservando overrides scoped sobre selectores **vivos** del shell.

- **Hallazgos resueltos**: H-CSS7 (overrides scoped a `.nmv2-page[data-step='parameters']` apuntando a selectores muertos del paso Parámetros V1).
- **Bloques de `container.css` borrados** (todos verificados sin uso en HTML/TS productivos vía grep estricto `class="…"`):
  - `Step 1 refinement` colas (post-stepper): screen-copy h1/p, screen-actions, btn, content-grid--aside, surface-card, section-heading, side-card h2, side-caption, parameter-grid, parameter-card + __icon/__header/__body/__chevron, status-pill, donut-summary/ring/copy, small-metric-grid/+lucide-icon/span/strong, updated-row, issue-stack/row/strong/span, btn-danger-outline, footer-bar.
  - `Step 1 final` + `Step 1 status labels`: parameter-card .status-pill (+tonos), small-metric tonos/grid 1col, issue-row--with-icon/__status. Mantenido solo el override del wrapper `gap: 0`.
  - `Paso 1 v4`: parameters-workspace, parameters-flow-card, parameters-map-card, parameter-flow + media queries, flow-step + done/warning/blocked/pending, parameter-area-grid/card + __head/__icon, plain-status + status-{green,amber,red}, area-items + ok/warn/bad, parameters-summary-card, parameters-blockers-card, quick-links-card, donut-summary--tight, plain-metric-list/+plain-metric/span/strong, issue-row--with-icon, quick-link*.
  - `Parameters pixel-perfect refinement`: parameter-prep-card + sub, parameters-perfect-summary, parameter-access-card, parameter-blockers-perfect, parameters-prep-flow-card prep-flow + prep-item, prep-icon, prep-line--legacy.
  - `Parameters v8` (excepto wrapper padding/gap/background y alert-banner): nmv2-screen-header, nmv2-screen-copy h1/p, parameters-perfect-layout, content-main/side, parameter-prep-card + section-heading + h2, parameter-prep-flow, prep-item + prep-icon/strong/small/prep-line--legacy, parameter-cards-grid, parameter-summary-card + __head/__icon (lucide)/__head h3/p + __chevron, plain-status, parameters-perfect-summary + parameter-access-card + parameter-blockers-perfect h2, summary-state-list/row, updated-row--summary, parameter-access-grid/tile + span, parameter-blocker-list/row + __status/__copy/__chevron, media query 1360.
  - `Parameters v9`: parameter-prep-flow, prep-item, parameter-prep-card padding, prep-item strong.
  - `Parameters functional binding polish`: prep-item--blocked, area-items .muted + status-gray global, parameter-summary-card focus/hover/cursor, parameter-blocker-row/access-tile cursor, parameter-blocker-empty + lucide-icon.
  - `Prompt 1 + densidad` (excepto step-body/frame/paso wrappers + alert-banner variants): parameters-step-content, parameters-perfect-layout + content-grid--aside align, content-main/side, parameter-cards-grid grid-rows, parameters-perfect-summary + __top + updated-row--summary, parameters-base-status + --diff + __link/:hover, content-side.parameters-sidebar-perfect, parameter-blockers-perfect + parameter-blocker-list/empty, parameters-prep-flow-card height, parameter-blockers-perfect--empty, donut-summary-block, donut-ring--summary/--dynamic/+span, donut-total-caption, parameters-perfect-summary__top grid, parameter-access-grid/tile, updated-row--summary, parameter-summary-card box-sizing, parameter-summary-card__chips/span, parameter-summary-card__foot, parameters-step-content--busy, parameter-prep-flow--solo-validacion + prep-segment--terminal.
  - `Paso Parámetros — paleta NOIA apagada` (excepto variables --nmv2-* y alert-banner--warning/revision/error overrides): prep-item--done/warning/blocked (.prep-node + .prep-icon + small), status-green/amber/red scoped (redundantes con CSS local), parameter-summary-card__icon, parameter-access-tile__icon, parameter-blocker-empty, parameter-summary-card__chips span, area-items ok/warn/bad scoped, parameter-summary-card focus/hover scoped.
  - `Prep-flow premium` completo (252 líneas): parameters-prep-flow-card variables + connector + node + step + copy + segment + connector states (done/warning/blocked) + tone modifiers + media queries 1100/760.
  - `Parámetros V3` (excepto alert-banner--parameter-inline overrides): parameters-prep-flow-card prep-connector v3 + arrows, prep-item--done/warning/blocked tones, parameter-summary-card__head h3/p + __chips/span/-more/__foot/+plain-status, parameter-summary-card min-height, donut-ring--success/warning/danger/neutral + donut-ring--summary.donut-ring--dynamic span.
  - `V4 card Revisiones/Bloqueos`, `V5 estado completo`, `V6 prep-flow estados claros` completos: parameter-blockers-perfect, parameter-blocker-row + __status/__copy/__chevron, parameter-blocker-empty.parametros-estado-correcto + lucide, prep-item__titulo/estado, prep-item--completo/revision/faltante/bloqueado/pendiente (.prep-node + .prep-item__estado), prep-connector--completo/revision/faltante/bloqueado/pendiente, prep-step--validacion variants.
  - `Cards parámetros: icono esquina superior derecha`: parameter-summary-card.nomina-card--corner-icon + __head/foot + nomina-card__icon.
  - `Page fill` parcial: solo se quitaron 4 reglas muertas (parameters-step-content, parameters-perfect-layout.parameters-step-content + content-main/side). Las reglas vivas (shell + outlet + container + page + step-body + paso-parametros) se mantienen.
  - `Parámetros: el card principal ocupa siempre el alto disponible` completo: parameters-step-content + parameters-perfect-layout.parameters-step-content + content-main/side height.
- **Lo que NO se borró** (verificado en HTML productivo + binding TS):
  - Overrides scoped del stepper (`.nmv2-stepper-card`, `.nmv2-stepper`, `.step`, `.step-number`, `.step-copy strong/small`) bajo `.nmv2-page[data-step='parameters']`: hacen el stepper más denso en el paso 1 (visual aprobado).
  - Overrides scoped de `.alert-banner` + `.alert-banner--parameter-inline` + `.alert-banner--warning/revision/error` bajo `.nmv2-page[data-step='parameters']`: clases vivas en el HTML del paso Parámetros.
  - Wrapper `.nmv2-page[data-step='parameters']` con `padding/gap/background` y bloque de variables CSS `--nmv2-primary/ok/review/danger/muted/track`: define apariencia actual + variables consumidas por los alert overrides.
  - Bloque `V7: ayuda de avance en paso Parámetros` (`.nmv2-step-nav-hint` + `--bloqueo/--revision`): clases vivas en `nomina-mensual-v2-container.html`.
  - Bloque `Empleados V1/V7` completo (líneas ~2131–3132 post-slice): fuera de alcance L5.2 (queda para L5.3 si se requiere).
  - Visual-system base global (líneas ~100–870): selectores como `.parameter-card`, `.donut-*`, `.small-metric`, `.issue-row`, `.surface-card`, `.toolbar-card`, `.validation-summary-card`, `.tabs-bar`, `.btn`. Aunque sin uso en HTML actual, su limpieza pertenece a un L5.3 explícito por riesgo de cascada en componentes globales del shell (header, sidebar, breadcrumbs) que comparten el ViewEncapsulation.None del container.
- **Total**: `container.css` pasa de **5.349 → 3.414 líneas (−1.935 / −36,2 %)**. Bundle: **60.96 kB → 59.40 kB (−1,56 kB)**.
- **Validación**: `npx ng build` finaliza el bundle (los 4 errores de budget son preexistentes; el container.css de hecho bajó −1,56 kB). `npx ng test --watch=false --include="**/nomina-mensual-v2/**/*.spec.ts"` → **68/68 ok** (15 specs). Lints: dos warnings preexistentes de `line-clamp` (no introducidos). Visual: pasos Parámetros, Alcance, Empleados y Congelado renderizan idénticos (alert-banner mantiene radius 15px + box-shadow + paleta NOIA apagada; stepper denso en paso 1; hint banda contigua; trazabilidad drawer/panel intactos).
- **Pendiente próximo lote**:
  - **L5.3** (opcional): sweep del visual-system base global (líneas ~100–870) + cluster Empleados V1/V7 (líneas ~2131–3132) + consolidación de overrides duplicados de `.nmv2-page[data-step='parameters']` y `.alert-banner` para bajar el bundle bajo el budget de 24 kB.
  - **L6**: pulido fino texts/copys y revisión de overlays (`nomina-mensual-v2-overlays`) alineados al patrón `app-message-box`/NOIA.

## 2026-06-02 - Nómina mensual V2 · L5 — Desacople CSS local + limpieza muerta

Lote 5 del plan iterativo (`auditoria-nomina-v2-2026-06.md`). Sin tocar presenters, services, orquestador, motor productivo ni estilos globales. Foco: bajar el peso del monolito `nomina-mensual-v2-container.css` y dejar cada paso con su CSS local.

- **Hallazgos resueltos**: H-CSS1 (container monolítico de 7.676 líneas), H-CSS2 (`pasos-demostracion` muerto encadenado al shell), H-CSS3 (modal local de pendientes obsoleto), H-CSS4 (loading-skeleton legacy con `nomina-sidePanel`, `parameter-blocker-empty`, `parameter-access-tile`), H-CSS5 (paso Alcance legacy con `alcance-*-card`/`alcance-grid`/`empleados-sin-alcance-banner`), H-CSS6 (cluster `parameter-cards-grid` + `parameter-summary-card*` + `parameters-perfect-summary` + `parameter-access-*` + `parameter-blocker-*` + `summary-state-*` + `parameter-prep-flow` + `prep-item` legacy del paso Parámetros V1).
- **Cambios — Desacople a CSS local por componente** (Encapsulation `None` para preservar selectores globales compartidos como `empleados-grid-module*` y `app-message-box`):
  - **Nuevo `components/nomina-mensual-v2-paso-parametros/nomina-mensual-v2-paso-parametros.component.css`** (~370 líneas): bloque completo `.nmv2-paso-parametros__*` (head, eyebrow, head-row, title, stats `--block/--warn/--ok`, body, main, list, row + skeletons inline, side block + link, media query 960). Referenciado vía `styleUrls` en el componente.
  - **Nuevo `components/nomina-mensual-v2-paso-alcance/nomina-mensual-v2-paso-alcance.component.css`** (~540 líneas): bloque completo `.nmv2-paso-alcance__*` (head, stats `--blue/--green/--gray/--red`, list, row + activa/locked, panel inline, chips, search, manual, side, checklist con status, media query 960).
  - **Nuevo `components/nomina-mensual-v2-paso-empleados/nomina-mensual-v2-paso-empleados.component.css`** (~410 líneas): bloque completo `.nmv2-paso-empleados__*` (head, stats `--green/--blue/--amber/--red`, body, grid wrapper, toolbar local + chip-filtro, side block + link, checklist denso `--activo/--locked/:disabled` con severidad y status, media query 1024).
- **Cambios — Limpieza profunda en `nomina-mensual-v2-container.css`**:
  - Slice de los bloques L2/L3/L4 movidos a CSS local: −1.361 líneas. Cabecera reemplazada por un comentario apuntando a los tres archivos nuevos.
  - Borrado del **componente legacy `NominaMensualV2PasosDemostracionComponent`** (archivos `.ts` y `.html`) + sus 2 reglas en el container (`app-nomina-mensual-v2-pasos-demostracion`). El placeholder NOIA L0 (`.nmv2-paso-congelado`) lo cubre desde L0.
  - Borrado del bloque `parametros-pendientes-modal*` + `parametros-pendientes-group*` + `parametros-pendientes-item*` + sus media queries: −252 líneas. Las confirmaciones de pendientes ahora viven en `app-message-box` (L2).
  - Borrado del bloque `nmv2-loading-*` + selectores `parameters-step-content--busy` con shimmer + keyframes + media `prefers-reduced-motion`: −158 líneas. Los skeletons del paso Parámetros L2 son filas placeholder inline (`nmv2-paso-parametros__row--placeholder`), no cards.
  - Borrado del bloque Alcance V10 legacy: `.alcance-opciones-grid`, `.alcance-opcion-card*`, `.alcance-intro-card`, `.alcance-panel-secundario`, `.alcance-preview-card*`, `.alcance-chip*`, `.alcance-busqueda-manual*`, `.alcance-lista-manual`, `.alcance-fila-manual*`, `.alcance-checklist-card`, `.empleados-sin-alcance-banner` + media query 900: −223 líneas.
  - Borrado del cluster `parameter-cards-grid` + `parameter-summary-card*` + `parameters-perfect-summary` + `summary-state-list/row` + `updated-row--summary` + `parameter-access-card/grid/tile*` + `parameter-blocker-list/summary/row*` + `parameter-blockers-perfect*` + `parameter-prep-flow` + `prep-item*` + sus 3 media queries: −332 líneas.
  - **Total**: `container.css` pasa de **7.676 → 5.349 líneas (−2.327 / −30,3 %)**.
- **No tocado** (y validado por grep en HTML/TS productivos): `.alert-banner*`, `.surface-card`, `.section-heading`, `.content-grid--aside`, `.footer-bar`, `.nmv2-stepper-card`, `.nmv2-screen-copy/-actions/-header`, `.nmv2-empleados-grid-shell/-card`, `.empleados-grid-module*`, `.empleados-filtro-chip*` (usado vía `claseChipFiltroChecklist`), `.empleados-checklist-item--{severidad}` y `.empleados-checklist-severidad--*` (usados via método del componente), `.nomina-chip*` y reglas globales del visual-system. El shell L1 queda intacto.
- **Pendiente declarado para L5.2** (no abordado en este lote por riesgo de cascada): segundo cluster legacy de Parámetros V1 que vive entre `Step 1 refinement` (≈ línea 1.856) y `Empleados V1` (≈ línea 4.150) y mezcla overrides scoped a `.nmv2-page[data-step='parameters']` sobre selectores **vivos** del shell (`.alert-banner`, `.surface-card`, `.section-heading`, `.btn`, `.nmv2-stepper-card`, `.nmv2-screen-copy/-actions`, `.footer-bar`) con selectores **muertos** (`.parameter-card*`, `.donut-*`, `.small-metric*`, `.issue-row/stack`, `.parameter-prep-card`, `.status-pill` legacy). Necesita un sweep quirúrgico por subloque para no alterar la apariencia del shell. Documentado en `auditoria-nomina-v2-2026-06.md`.
- **Validación**: `npx ng build --configuration=development` verde (19 s). `npx vitest run src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/facade/nomina-mensual-v2-navegacion.spec.ts` → 6/6 ok. Lints solo dos warnings preexistentes de `line-clamp` (no introducidos por este lote). Visual: pasos Parámetros, Alcance, Empleados y Congelado renderizan idénticos al estado pre-L5 (mismo DOM, mismo CSS, ahora repartido).
- **Pendiente próximo lote**: L6 — pulido fino texts/copys y revisión de overlays (`nomina-mensual-v2-overlays`) para alinearlos al patrón `app-message-box`/NOIA antes de tocar L7 (motor V11).

## 2026-06-02 - Empleados · Seeds separados (`auditoria` / `aptos` / `errores`)

Sin cambios de UI. Solo `scripts/` + `package.json`. Origen: tras correr `seed:empleados:ok` quedaron solo 3 aptos (U1, U4, U5) por diseño de la batería de auditoría, insuficiente para poblar el alcance del paso 3 de Nómina mensual V2 con holgura.

- **`scripts/auditoria-empleados-fixtures.mjs`**: degradados U6/U7/U8 a `dependiente_activo`. Quedan **6 aptos (U1, U4, U5, U6, U7, U8) + 2 borradores (U2 `borrador_paso2`, U3 `borrador_reanudar`)**. Casos antiguos (`honorarios` F10, `basico` F2, `ficha_incompleta` F12) salen de la auditoría base y vuelven a cubrirse vía `seed:empleados:errores` cuando se necesiten.
- **`scripts/verify-empleados-qa-post-e2e.mjs`**: actualizados asserts. U6 ahora `apto === true` (sin HONORARIOS); U8 ahora `estado === ACTIVO` y `estado_ficha === VALIDO` (sin INCOMPLETO). Se eliminó el helper `loadContratoHonorarios` que ya no aplica.
- **Nuevo `scripts/seed-empleados-aptos.mjs`**: 10 empleados productivos puros (RUT `27.000.001–010`, apellido `Productivo`, contrato `INDEFINIDO`, sueldo $900.000, jornada completa 44 h, AFP + ISAPRE + cuenta bancaria; persona `ACTIVO/VALIDO/apto=true`). Soporta `--confirm`, `--dry-run`, `--purge-only`, `--append` (este último solo borra y recrea RUT 27.000.001–010 sin tocar U1–U8 ni ERR).
- **`package.json` — scripts npm de empleados reorganizados**:
  - `seed:empleados:auditoria` → `node scripts/auditoria-empleados-fixtures.mjs` (nombre real del fixture).
  - `seed:empleados:aptos` → `node scripts/seed-empleados-aptos.mjs --confirm`.
  - `seed:empleados:aptos:append` → mismo con `--append`.
  - `seed:empleados:errores` y `seed:empleados:errores:append` (sin cambios funcionales).
  - `seed:empleados:ok` queda como **alias deprecated** apuntando a `seed:empleados:auditoria` (no romper docs/CI antiguos). Mismo criterio que `seed:empleados-prueba-errores`.
- **No tocado**: `scripts/lib/empleados-cleanup.mjs` (utilería compartida), `seed-empleados-prueba-errores.mjs`, tests, UI, estilos globales, motor de cálculo.
- **Combinación recomendada para poblar Nómina V2**: `npm run seed:empleados:auditoria` (6 aptos + 2 borradores) + `npm run seed:empleados:aptos` (10 aptos puros) + opcionalmente `npm run seed:empleados:errores:append` (10 bloqueantes sin tocar el resto). Total: **16 aptos disponibles** para el alcance + 2 borradores + 10 con bloqueos para validar flujos de error.
- **Validación**: `node --check` verde sobre los 3 scripts modificados. JSON `package.json` válido. No se ejecutó el seed contra BD remota en esta sesión (lo lanzas desde tu terminal con las credenciales `.env`).

## 2026-06-02 - Nómina mensual V2 · L4 — Paso Empleados NOIA

Lote 4 del plan iterativo (`auditoria-nomina-v2-2026-06.md`). Sin tocar presenter, services, orquestador, ni `app-data-grid` shared.

- **Hallazgos resueltos**: H-E1 (KPI strip de 4 cards → banda de stats en header local), H-E2 (banner sin-alcance ya con estética `alert-banner--parameter-inline`, sin sombras), H-E3 (toolbar local sobria sustituye `empleados-grid-toolbar` con bordes y chips coherentes), H-E4 (sidebar reducido tipo L3, checklist denso sin `surface-card`), H-E5 (estados `disabled` del checklist coherentes con `--prm-field-locked-*`).
- **Cambios en `nomina-mensual-v2-paso-empleados.component.html`** (reescritura completa, misma lógica/binds):
  - **Header local** (`nmv2-paso-empleados__head`) con eyebrow `Paso 3 · Empleados · <leyenda del grid>` + título operativo + banda horizontal de 4 stats (Activos / Contrato vigente / Bancarios pendientes / Docs. incompletas), tonos `--green/--blue/--amber/--red`, `title` con el porcentaje del total.
  - **Toolbar local** (`nmv2-paso-empleados__toolbar`) sustituye `empleados-grid-toolbar`: contiene `Filtros avanzados` (con estado activo en azul tenue), chip de filtro de checklist activo (cerrable) y conteo. Borde 1 px neutro, radio 6 px.
  - **Anchor + `app-data-grid`** intacto: mismo `persistenceKey`, mismos `ng-template appDataGridCell` y mismas columnas. Sin nuevos botones export (siguen siendo acción del grid).
  - **Sidebar reducido** (`nmv2-paso-empleados__side`): bloque `Lista para continuar` con `trazabilidad-paso panel` + checklist denso (`<li><button>`, icono + título + pill de severidad + descripción + chevron) + acceso `Ver resumen de pendientes`. Bloque adicional `Volver a alcance` con link `Ir a Alcance`. Sin `surface-card`, sin `side-card`, sin info-banner.
  - **Checklist items**: estados `--activo` (azul tenue), `--locked`/`:disabled` calcados al patrón `--prm-field-locked-*` (color `#94a3b8`, icono `#cbd5e1`). Severidad mantiene tonos sobrios (`correcto/advertencia/bloqueante`).
- **Cambios en `nomina-mensual-v2-paso-empleados.component.ts`**: ninguno. Toda la lógica (`metricasEmpleados`, `checklistEmpleados`, `filasEmpleadosVista`, `filtroPendienteEmpleados`, `recargarGrillaEmpleados`, `ejecutarAccionPrincipal`, modal `abrirModalResumenPendientes`) se reutiliza tal cual.
- **Cambios en `nomina-mensual-v2-container.css`**:
  - Nuevo bloque local (~410 líneas) con `.nmv2-paso-empleados__*`: head, eyebrow, head-row, title, stats (`--green/--blue/--amber/--red`), body, main, grid, toolbar, toolbar-filters, toolbar-btn (`--activo`), chip-filtro, toolbar-conteo, side, side-block, side-link, checklist, checklist-item (`--activo/--locked`), checklist-icon/copy/row-title/severity/mark + variantes por status (`.status-success/.status-warning/.status-error/.status-pending`).
  - Aplanado del wrapper legacy del data-grid: `.empleados-grid-module` y `.nmv2-page[data-step='employees'] .empleados-grid-module__card` ahora son `border-radius: 6px`, sin `box-shadow`, borde neutro 1 px (en línea con L1).
  - El CSS legacy `empleados-kpi-strip`, `empleados-kpi-card*`, `empleados-grid-toolbar*`, `empleados-checklist-card`, `empleados-checklist-item*`, `empleados-resumen-pendientes-button` queda como código muerto (no referenciado por el nuevo template). Limpieza profunda en L5.
- **No tocado**: presenter de empleados/validación, service de carga, orquestador, modelos, `app-data-grid`, motor productivo, estilos globales, `angular.json`, otros pasos.
- **Validación**: `npx ng build --configuration=development` verde (16 s). 2 warnings preexistentes de `line-clamp` (no introducidos por este lote). `npx vitest run src/app/features/nomina-mensual-v2/{presenters,rules,mappers,containers}`: 48/48 verdes; los 3 archivos en rojo son los preexistentes ya identificados en L3.
- **Pendiente próximo lote**: L5 — Limpieza / desacople CSS (migrar bloques L0–L4 desde `container.css` a CSS local por componente y borrar el código muerto: `parameter-summary-card*`, `parameters-perfect-summary*`, `alcance-*-card`, `empleados-grid-toolbar*`, `empleados-kpi-card*`, `empleados-checklist-card`, modal local, skeletons en card).

## 2026-06-02 - Nómina mensual V2 · L3 — Paso Alcance NOIA

Lote 3 del plan iterativo (`auditoria-nomina-v2-2026-06.md`). Sin tocar presenter, services, orquestador, ni la lógica de cálculo del alcance.

- **Hallazgos resueltos**: H-A1 (cards de tipo de alcance → lista densa), H-A2 (KPI strip → banda compacta en header), H-A3 (estados disabled coherentes con el patrón `--prm-field-locked-*` de Parámetros), H-A4 (panel inline de centros / selección manual sin envolver en card extra), H-A5 (sidebar reducido a checklist + volver, sin duplicar conteos del header).
- **Cambios en `nomina-mensual-v2-paso-alcance.component.html`** (reescritura completa, mismo bind/lógica):
  - **Header local del paso** (`nmv2-paso-alcance__head`) con eyebrow `Paso 2 · Alcance · <descripción>` + título operativo + banda horizontal de 4 conteos (`Encontrados / Incluidos / Excluidos / Bloqueados`), bordes neutros 1 px y sin badges decorativos.
  - **Lista densa de tipos de alcance** (`nmv2-paso-alcance__list` con `<li><button class="nmv2-paso-alcance__row">`): icono pequeño (28 px badge), título + descripción, etiqueta `Próximamente` cuando aplica, y acción contextual (`Seleccionado`/`Elegir`/`No disponible`). Estados `disponible/preparado/deshabilitado` preservados; los no disponibles van con `[disabled]` + `[aria-disabled]` y se ven como los `--prm-field-locked-*` de Parámetros (fondo `#f8fafc`, borde implícito y color `#94a3b8`).
  - **Panel inline** (`nmv2-paso-alcance__panel`) que aparece solo cuando hay un alcance que requiere detalle: chips de centros de costo (`__chip` activa con `#eff6ff / #93c5fd / #1d4ed8`) o búsqueda + lista de trabajadores (`__manual`, max-height 280 px con scroll interno, sin card).
  - **Sidebar reducido** (`nmv2-paso-alcance__side`): bloque `Lista para continuar` (checklist contextual con tonalidades success/warning/error/pending) + bloque `Volver a parámetros` con link `Ir a Parámetros`. Cero duplicación con los conteos del header.
  - **Modal y orquestador**: `modalAvanceAlcance` sigue siendo gestionado por `nomina-mensual-v2-overlays`; el paso solo dispara `ejecutarAccionPrincipal()`.
- **Cambios en `nomina-mensual-v2-paso-alcance.component.ts`**: ninguno. La lógica de selección, validación y avance se reutiliza tal cual (`tipoAlcanceSeleccionado`, `centrosCostoSeleccionados`, `idsTrabajadoresManuales`, `resultadoAlcanceVista`, `checklistAlcance`, `metricasAlcance`, `cargarTrabajadoresPeriodo`).
- **Cambios en `nomina-mensual-v2-container.css`**:
  - Nuevo bloque local (~380 líneas) con todas las clases `.nmv2-paso-alcance__*`: head, eyebrow, head-row, title, stats (`--blue/--green/--gray/--red`), body, main, list, row (`--activa/--locked`), row-icon/copy/tag/mark, panel, panel-head, chips, chip (`--activo`), search, manual, manual-row/avatar/copy/state, side, side-block, side-link, checklist, checklist-item (`.status-success/.status-warning/.status-error/.status-pending`), checklist-icon/copy. Bordes 1 px neutros, radios 4–6 px (chips 999 px), sin sombras, sin gradientes, sin transformaciones.
  - El bloque queda agrupado junto a L2 y el placeholder de L0, listo para migrar a CSS local del componente en L5.
  - **No** se eliminó el CSS legacy `.alcance-grid`, `.alcance-option`, `.alcance-option__*`, `.alcance-context-card`, `.kpi-strip`, etc. Quedan como código muerto; limpieza profunda en L5.
- **No tocado**: presenter de alcance, service de carga de empleados, orquestador, modelos, motor productivo, estilos globales, `angular.json`, otros pasos, mantenedores.
- **Validación**: `npx ng build --configuration=development` verde (19 s). 2 warnings preexistentes de `line-clamp` (no introducidos por este lote). `npx vitest run src/app/features/nomina-mensual-v2/{presenters,rules,mappers,containers}`: 48/48 verdes; los 3 archivos en rojo fallan por `describe is not defined` (preexistente, sin imports de vitest, no tocados en L3).
- **Pendiente próximo lote**: L4 — Paso Empleados NOIA (drawer modal-like → side-panel sin sombras, métricas en banda, exportar como acción secundaria, checklist coherente con L3).

## 2026-06-02 - Nómina mensual V2 · L2 — Paso Parámetros NOIA

Lote 2 del plan iterativo (`auditoria-nomina-v2-2026-06.md`). Rediseño visual del paso 1 sin tocar servicios, orquestador, mappers ni persistencia.

- **Hallazgos resueltos**: H-P1 (cards → lista densa), H-P2 (modal local → `app-message-box`), H-P3 (sidebar sin duplicar conteos), H-P4 (skeleton inline en filas, no en cards), H-P5 (copy `Base guardada` → `Configuración guardada`), H-P6 (donut decorativo retirado), H-X4 (focus inicial heredado de `MessageBoxComponent`).
- **Cambios en `nomina-mensual-v2-paso-parametros.component.html`**:
  - **Header local del paso** (`nmv2-paso-parametros__head`) con eyebrow `Paso 1 · Parámetros · Configuración guardada hoy hh:mm` + título operativo + 3 conteos compactos (pendientes para preparar / oficiales pendientes / verificados) en una banda horizontal con bordes neutros. Calcado del patrón `param-record-header` de Parámetros.
  - **Lista densa de áreas** (`nmv2-paso-parametros__list` con `<li><button>` por área): icono pequeño (28 px badge), título + descripción, pill de estado tonal (success/warning/danger/neutral) y acción `Abrir →`. Sin chevron decorativo, sin chips de detalle, sin footer. Mantiene el `goToParametros(area.mantenedor)` original.
  - **Sidebar reducido** (`nmv2-paso-parametros__side`): bloques contextuales que aparecen solo cuando aplican — `Diferencias con la configuración guardada`, `Pendientes para preparar (N)`, `Oficiales pendientes (N)` — más el acceso permanente `Ir a Parámetros`. Cero duplicación con los conteos del header.
  - **Modal local `parametros-pendientes-modal` eliminado**. El signal `modalPendientesParametros` ahora dispara un `app-message-box` `variant="warning"` con `sections[]` agrupados por área. Focus inicial gestionado por el shared.
  - **Skeleton inline**: en estado `parametrosLoading()` la lista se rellena con 5 filas placeholder grises (`nmv2-paso-parametros__row--placeholder`) que conservan la geometría sin pintar tarjetas fantasma.
  - **Copy**: `Base guardada` → `Configuración guardada`. La banda `diferencias` ahora ofrece `Ver diferencias` directo (antes solo era texto). El sidebar dejó de mostrar `Última actualización` repetida.
- **Cambios en `nomina-mensual-v2-paso-parametros.component.ts`**:
  - Import de `MessageBoxSection` desde el shared.
  - Nuevo helper `parametroEstadoTono(estado)` (mapea a `ok`/`warn`/`block`/`neutral` para la fila).
  - Nuevo `sectionsPendientesParaMessageBox(tipo)` que mapea grupos por área a `MessageBoxSection[]` con `tone` `warning`/`attention` y `items[]` formateados (`<título>: <detalle>`).
  - Los métodos `tituloModalPendientesParametros`, `mensajeModalPendientesParametros`, `gruposModalPendientesParametros`, `modalPendientesResumen` quedan vivos como helpers internos consumidos por el `app-message-box`.
- **Cambios en `nomina-mensual-v2-container.css`**:
  - Nuevo bloque local `~280 líneas` con todas las clases del paso (`.nmv2-paso-parametros__head`, `__eyebrow`, `__stats`, `__body`, `__main`, `__list`, `__row`, `__row-state`, `__row-action`, `__row--placeholder`, `__side`, `__side-block`, `__side-link` + variantes `--block`/`--warn` y media query a 960 px). Bordes 1 px neutros, radios 4–6 px, sin sombras, sin gradientes, sin transformaciones.
  - El bloque queda agrupado al inicio del archivo junto al placeholder L0, listo para migrar a CSS local del componente en L5 (desacople).
  - **No** se eliminó el CSS legacy de `parameter-summary-card`, `parameters-perfect-summary`, `parameter-cards-grid--loading`, `nmv2-loading-*`, `parametros-pendientes-modal*` etc. Quedan como código muerto referenciado por nadie (validado: el nuevo template no usa esas clases). Limpieza profunda diferida a L5.
- **No tocado**: orquestador, services, mappers, rules de comparación, persistencia, modelos, motor productivo, estilos globales, `angular.json`, otros pasos.
- **Validación**: `npx ng build --configuration=development` verde (19 s). 2 warnings preexistentes de `line-clamp` (no introducidos por este lote). `npx vitest run src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/facade`: 10/10 verdes.
- **Pendiente próximo lote**: L3 — Paso Alcance NOIA (cards → lista densa, KPI strip → banda contextual, estados disabled con patrón `--prm-field-locked-*`).

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

Fase 0 del plan iterativo abierto en `docs/codex/modulos/nomina-mensual/auditorias/auditoria-nomina-v2-2026-06.md`.

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

## 2026-06-30 - NOIA-NMV2-REPAIR-04: limpieza cadena legacy F3 (alcance/empleados)

- **Eliminados** presenters, mappers, repositorio y servicios de la cadena `nomina-empleados-personal` / alcance V1 (`nomina-alcance*`, `nomina-empleados-*`, `nomina-empleados-carga`, modal `empleados-resumen-pendientes`, util `presentacion.util`).
- **Eliminados** componentes huérfanos: `paso-alcance`, `paso-empleados`, `stepper-traceability` (trazabilidad vive en drawer/modal + avatar del stepper).
- **Mock** `nomina-mensual-v2.mock.ts`: reducido a `payrollSteps` (único consumo en runtime).
- **Modelos**: retirados `PayrollEmployeeRow` y `OpcionAlcanceNomina`; se mantienen `ResultadoAlcanceNomina` y tipos de alcance usados por `nomina-periodo.service`.
- **CSS**: bloques muertos en `nomina-mensual-v2-visual-system.css` (`.alcance-opcion-card*`, `.empleados-kpi-card*`, chips) y referencias a pasos legacy en `nomina-mensual-v2-container.css`.
- **Tests**: `npx ng test --watch=false --include="**/nomina-mensual-v2/**/*.spec.ts"` → 259/259 verdes.
- **Sin tocar**: estilos globales, `angular.json`, SQL, motor productivo, nómina V1 administrador.

## 2026-06-30 - NOIA-NMV2-REPAIR-05: tipos demo y hints de avance

- **Modelos** `nomina-mensual-v2.models.ts`: eliminados tipos demo del mock legacy (`SummaryMetric`, `StatusChip`, `ChecklistItem`, filas de movimientos/cálculo/validación/liquidación, etc.). Se conservan stepper, alcance para `nomina-periodo.service` y trazabilidad.
- **CSS container**: retirados placeholders `.nmv2-paso-congelado` / `.nmv2-paso-pendiente` (sin uso en HTML).
- **Cálculo**: pie sin número de registro/versión visible; solo fecha de generación + hint de avance vía shell.
- **Validación**: pie alineado a Dotación/Movimientos/Cálculo — hint de avance vía shell cuando no hay bloqueos críticos.
- **Tests**: suite `nomina-mensual-v2` en verde tras el podado.
- **Sin tocar**: estilos globales, SQL, motor.

## 2026-06-30 - NOIA-NMV2-REPAIR-06: poda CSS demo del container

- **`nomina-mensual-v2-container.css`**: reescrito conservando solo shell activo (~460 líneas vs ~2 400): layout page/frame, hints, handoff, empty state, drawer trazabilidad, utilidades `text-link`/`icon-btn`.
- **Eliminado** bloque demo V10.1 (`.surface-card`, `.toolbar-card`, `.alert-banner`, KPIs, tablas demo, donuts, parameter-cards, media queries huérfanas).
- **Stepper**: estados `blocked` / `warning` / `advance-blocked` movidos a `nomina-mensual-v2-stepper.component.css` (ownership del componente).
- **Tests**: suite `nomina-mensual-v2` en verde tras la poda.
- **Sin tocar**: estilos globales, `visual-system.css` de pasos productivos, SQL, motor.

## 2026-06-30 - NOIA-NMV2-REPAIR-07: poda visual-system.css

- **`nomina-mensual-v2-visual-system.css`**: de ~492 → ~18 líneas; conservado solo scroll horizontal de `.nmv2-stepper-card`.
- **Eliminado** bloque demo V8: `.nmv2-screen-*`, `.nomina-iconBadge`, `.nomina-chip`, `.nomina-state`, `.nomina-card`, `.parameter-*`, `.prep-*`, `.donut-ring--summary`, tokens `--nomina-*` sin consumidores.
- **Stepper**: estilos de copy `pending` / `complete` absorbidos en `nomina-mensual-v2-stepper.component.css`.
- **Tests**: suite `nomina-mensual-v2` en verde.
- **Sin tocar**: estilos globales, SQL, motor.

## 2026-07-02 - BKL-09/BKL-10: escala Cálculo y preview nueva nómina

- **`nomina-mensual-v2-paso-calculo`**: grilla server-side (patrón Movimientos); desglose/preview lazy; stats desde cabecera snapshot.
- **`admin-nominas-modal-nueva-nomina`**: listas incluidos/excluidos paginadas (50/página) con nav compacta `.adm-nom-modal__paginacion`.
- **Historial administrativo**: nombre de usuario resuelto en servidor (`listar_eventos_auditoria_nomina`).
- **Tests**: specs paso Cálculo, adapter, modal nueva nómina y auditoría en verde.
- **Sin tocar**: estilos globales, motor de cálculo.

## 2026-07-02 - F18a: pulido UX Administrador de nóminas

- **`administrador-nominas-container`**: franja KPI operativa (Abiertas, En cálculo, Pendientes de cierre, Con críticas) sin cards; sub-renglón "Avance" en Siguiente acción; meta tipo/naturaleza + rango legal bajo Período para ciclos no estándar.
- **`admin-nominas.presenter`**: filtro Naturaleza cuando hay más de una; búsqueda libre incluye etiqueta de naturaleza.
- **CSS local** `administrador-nominas-container.css`: patrón stats inline (dotación v2); media queries 1024/768 px para KPIs y acciones por fila.
- **Tests**: specs presenter, util presentación y smoke container en verde.
- **Sin tocar**: estilos globales, SQL, motor, data-grid compartido.

## 2026-07-02 - F18b: pulido UX Generador y rehidratación

- **`nomina-generador-context.presenter`**: contexto fijo empresa, período, rango, tipo/naturaleza, estado y versión de cálculo (reutiliza etiquetas del Administrador).
- **`nomina-mensual-v2-container`**: franja de contexto bajo stepper; subtítulo shell enriquecido; chip de estado + paso; aviso recuperable si falla rehidratación de paso visitado.
- **CTA único shell (AG-CTA-01)**: botones de paso Cálculo/Movimientos/Cierre degradados a secundario/ghost; avance principal sigue en header.
- **CSS local** container: franja contexto + responsive 1024/768 px.
- **Tests**: presenter contexto + suite v2 en verde.
- **Sin tocar**: estilos globales, SQL, motor.

## 2026-07-02 - F18c: vista de liquidaciones internas

- **`nomina-liquidaciones-internas.presenter` + rules**: clasificación vigente / superada / congelada; trabajadores sin liquidación; regeneración pre-cierre.
- **`NominaLiquidacionResumen`**: campos `activo`, `idLiquidacionReemplazada`, `fechaGeneracion` mapeados desde BD.
- **`nomina-mensual-v2-paso-cierre`**: panel de versiones, resumen vigente, acta congelada post-cierre, confirmación MessageBox al generar/regenerar, enlace a detalle por trabajador.
- **`liquidaciones-oficiales-container`**: modo `nominaPeriodoId` (desde Administrador/Generador) con historial F15 y regeneración confirmada.
- **Tests**: presenter + rules + suite v2/cierre en verde.
- **Sin tocar**: estilos globales, SQL, motor.

## 2026-07-02 - F18d: rectificación diferencial (UX)

- **`nomina-rectificacion-ui.presenter` + rules**: cadena por origen, comparativa original/ajuste/acumulado, etiquetas de acción diferenciadas.
- **Modal crear rectificación**: panel de referencia al cierre original, conteo de trabajadores y confirmación enriquecida.
- **Modal resumen**: comparativa RRHH para filas rectificación; CTA secundario «Consultar cierre original».
- **Modal cadena**: listado de rectificaciones vinculadas a un cierre; enlace al original solo lectura.
- **Grilla administrador**: sublínea de cadena, botón consultar original, CTA primario «Continuar rectificación».
- **Tests**: rules/presenter + smoke admin en verde.
- **Sin tocar**: estilos globales, SQL, motor.

## 2026-07-02 - F19: retiro compatibilidad mensual legacy

- **Fixtures**: `nomina-periodo.fixture.ts` + mock adapter bajo `testing/`; sin `providedIn: 'root'`.
- **Rutas/enlaces**: `NOMINA_FLOW_RETURN_PATH` y breadcrumbs apuntan a `/remuneraciones/nominas`; redirect `proceso-mensual` conservado.
- **Liquidaciones**: gateway al administrador sin `nominaPeriodoId`; eliminada UI por período global.
- **Tests**: redirects de rutas + liquidaciones + flow-nav en verde.
- **Sin tocar**: estilos globales, SQL, motor productivo.

## 2026-07-02 - Generador v2: loading unificado y paso Cierre rediseñado

- **Parámetros**: un solo `app-workspace-loading` (sin MessageBox loading + skeleton duplicado); contenido oculto mientras carga.
- **Cálculo**: recalcular usa solo skeleton de grilla + CTA shell (sin overlay full-step encima).
- **Cierre**: layout 2 columnas (checklist | operaciones), franja de métricas, botón Refrescar, iconos lucide, bloques con separador en lugar de cards apiladas; `aria-busy` al ejecutar acciones.
- **Sin tocar**: estilos globales, SQL, motor.

## 2026-07-02 - Generador v2: MessageBox en modal (no inline)

- **Contenedor v2**: aviso de reanudación parcial (`rehidratacionError`) pasa a `mode="modal"`.
- **Pasos Cálculo / Movimientos / Validación**: errores, avisos y confirmaciones usan `app-message-box mode="modal"` con backdrop NOIA; se eliminan títulos inline (`noia-msgbox__title--inline`).
- **Cálculo no vigente**: modal con ack local (`mostrarModalCalculoNoVigente`) porque el estado es `computed`.
- **Sin tocar**: estilos globales, `message-box.component` compartido, SQL, motor.

## 2026-07-02 - Administrador nóminas: historial y resumen rediseñados

- **Historial administrativo**: franja de contexto (chip estado + conteo/último movimiento); timeline con icono y tono por acción; fila compacta acción+fecha y usuario debajo; spinner unificado.
- **Ver resumen**: situación operativa en cabecera junto al chip; franja de métricas compacta con tono en críticas/advertencias; observaciones unificadas en una lista; comparación rectificación con separador `border-top`.
- **Sin tocar**: estilos globales, SQL, motor, contratos de datos.

## 2026-07-02 - Administrador nóminas: afinado modales historial y resumen

- **Historial**: título con empresa·periodo (sin message duplicado); iconos registrados vía `LucideAngularModule.pick`; mapa de iconos alineado al catálogo global (`arrow-left-right`, `refresh-cw`, `octagon-x`, `list-plus`).
- **Resumen**: quitado chip de estado (ya en grilla); métricas únicas (`listos/total`, mov. especiales); sección «A revisar» con detalle de mensajes sin repetir conteos; iconos explícitos en `pick`.
- **Sin tocar**: estilos globales, SQL, motor.

## 2026-07-02 - Ver resumen: apertura inmediata y MessageBox modal

- **Fix funcional**: el modal se monta al clic (antes esperaba el fetch); spinner `variant="loading"`; errores visibles con `variant="danger"`.
- **Shell**: `app-message-box mode="modal"` (z-index 13000, foco y backdrop NOIA) en lugar de backdrop propio z-index 50.
- **Contenido**: chip estado + trabajadores; situación operativa; métricas `listos/total`; observaciones detalladas; acciones en footer del MessageBox.
- **Iconos**: catálogo `admin-nominas-lucide.icons.ts` integrado en `app.config.ts`.
- **Sin tocar**: estilos globales, SQL, motor.


- **Administrador nóminas / plantillas**: quitado `app-workspace-loading` del contenedor; la grilla usa `[loading]` nativo (skeleton).
- **Generador v2**: overlay único de apertura (`generadorPreparando`) — fase 1 cabecera sin montar pasos; fase 2 overlay sobre workspace hasta rehidratación + carga inicial del paso activo. Input `preparacionExterna` suprime modal/skeleton/grilla loading de pasos durante esa apertura.
- **Pasos Movimientos / Dotación**: solo loading de `app-data-grid` (sin overlay duplicado).
- **Pasos Validación / Cierre / Cálculo (carga inicial)**: solo `app-workspace-loading`; contenido oculto hasta terminar; recálculo usa skeleton de grilla.
- **Paso Cálculo — recalcular**: botón primario (`is-primary`) + overlay `app-workspace-loading` mientras `calculando()`; fix RPC `resumen_calculo_nomina` (columna `id_calculo_periodo` calificada).
- **Preview liquidación (paso Cálculo)**: modal más ancho (`max-width: 1180px`), altura acotada al viewport; scroll en la hoja del documento y fallback en el backdrop.
- **Sin tocar**: estilos globales, SQL, motor.
