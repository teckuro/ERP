## REM-UX-FLOWS-01 V3 - Visibilidad cliente vs aplicacion

Fecha: 2026-05-11

- Se ajusta `Preparar nomina` para priorizar lectura de usuario: periodo activo, estado final visible, accion principal, que falta ahora, informacion final y trazabilidad secundaria.
- El avance visible pasa de pasos internos (`Validar`, `Base`, `Calculo`, `Guardar`) a etapas de negocio: `Preparacion`, `Revision`, `Aprobacion y cierre`, `Liquidaciones`.
- Se renombran textos visibles tecnicos: `Resultado guardado desde BD` pasa a `Detalle del resultado guardado`; `Identificador tecnico` y `Version del calculo` pasan a `Referencia interna` y `Version interna`.
- En `Liquidaciones oficiales`, la trazabilidad deja de aparecer dentro de `Que falta ahora` y queda al final como detalle secundario.
- Alcance respetado: sin SQL/RPC/RLS/BD, sin formulas legales ni motor, sin PDF/firma/envio, sin Previred/LRE/banco/contabilidad.

## REM-UX-FLOWS-01 V2 - Periodo global y accion unica en Remuneraciones

Fecha: 2026-05-10

- Se aplica el patron transversal: periodo activo global -> estado del flujo -> accion principal -> que falta ahora -> detalle -> trazabilidad.
- Preparar nomina deja de mostrar un selector local editable y elimina el boton duplicado Validar periodo del header; la validacion usa el periodo activo global y queda como CTA principal por estado.
- Liquidaciones oficiales consume el periodo activo global, retira el selector local editable y deja Generar liquidaciones oficiales solo como accion principal del bloque operativo.
- Flujos revisados: Preparar nomina, Liquidaciones oficiales, Movimientos del mes, Asignaciones recurrentes, Conceptos de remuneracion, Reportes y Dashboard.
- Deuda documentada: Movimientos del mes mantiene selector local por consulta historica/listado por periodo; no debe competir con el periodo activo del cierre mensual.
- Alcance respetado: sin SQL/RPC/RLS/BD, sin formulas legales ni motor, sin PDF/firma/envio, sin Previred/LRE/banco/contabilidad.

## UX-COMERCIAL-01 - Base documental para redisenio usable, dinamico y comercial

Fecha: 2026-05-10

- Objetivo: preparar la fase de redisenio usable/comercial sobre el flujo funcional ya validado: Empleado/Ficha apta -> Preparar nomina -> Resultado preliminar -> Aprobacion operativa -> Cierre operativo -> Liquidaciones oficiales internas.
- Se agregan contratos UX: `ux-comercial/README.md`, `contrato-diseno-comercial.md`, `patrones-pantallas-erp.md`, `sistema-estados-acciones.md`, `dashboard-comercial-remuneraciones.md`, `copywriting-operativo.md`, `checklist-cursor-ux.md` y `anti-patrones-ui.md`.
- Se agrega fase canonica `docs/codex/fases/ux-comercial/UX-COMERCIAL-01.md` y prompt operativo `docs/codex/prompts-cursor/CURSOR-UX-COMERCIAL-01.md`.
- Alcance futuro inmediato: mejorar navegacion, Preparar nomina, Liquidaciones oficiales, estados, siguiente accion, copy y trazabilidad secundaria.
- Fuera de alcance: SQL/RPC/RLS, formulas, motor, Previred, LRE, banco, contabilidad, PDF, firma, envio, reapertura y rectificacion.

## UX-COMERCIAL-01 V4 - Usabilidad transversal T00-T09

Fecha: 2026-05-10

- Se ejecuto el runbook `CURSOR_UX_COMERCIAL_01_V4_USABILITY_SYSTEM` para tickets T00 a T09.
- Dashboard y Reportes dejan de mostrar montos demo, vencimientos inventados y acciones activas de salidas futuras; ahora separan vistas operativas reales de capacidades de fase posterior.
- Preparar nomina incorpora avance visible del cierre mensual y mantiene siguiente accion, resumen, bloqueos y trazabilidad como patron principal.
- Detalle de liquidacion vacio ahora explica el motivo y ofrece CTAs a Liquidaciones oficiales y Preparar nomina.
- Movimientos del mes y Asignaciones recurrentes refuerzan empty states con impacto en nomina, accion primaria y motivo visible de boton deshabilitado.
- Documentacion actualizada: estado de fases, roadmap, modulos de nomina/liquidaciones, fase UX y peticiones de estilos.
- Alcance respetado: sin SQL/RPC/RLS/BD, sin formulas ni motor, sin Previred/LRE/banco/contabilidad, sin PDF/firma/envio.

## UX-QA-01-FIX V5 - Tabs, collapsables y densidad

Fecha: 2026-05-10

- Se ejecuto `CURSOR_UX_TABS_COLLAPSE_POLISH_V5` para tickets T00 a T07.
- Dashboard usa status strip, quick links compactos y disclosure para salidas futuras.
- Reportes incorpora tabbar real para separar vistas disponibles de capacidades no disponibles en esta fase.
- Preparar nomina compacta el timeline de 6 pasos y metricas superiores.
- Liquidaciones oficiales reduce estado no disponible, evita resumen sin datos y compacta empty state de trabajadores.
- Asignaciones recurrentes usa collapsable para ayuda contextual y mantiene motivo visible en accion deshabilitada.
- Alcance respetado: sin SQL/RPC/RLS/BD, sin formulas ni motor, sin salidas externas activas.

## LIQ-DB-APPLY-01 - Aplicacion y validacion de liquidaciones oficiales en BD real controlada

Fecha: 2026-05-10

- Objetivo: validar en BD real/controlada la persistencia y generacion de liquidaciones oficiales internas.
- Periodo probado: `2026-04`.
- Snapshot nomina: `id_calculo_periodo=1`, aprobado y cerrado operativamente.
- Liquidacion generada: `id_liquidacion_periodo=1`, 1 trabajador, 8 conceptos.
- Totales cabecera = detalle: haberes `750001.88`, descuentos `588301.48`, liquido `161700.40`.
- Duplicados activos: 0.
- Pruebas: `npx playwright test tests/nomina-mensual.e2e.spec.ts --workers=1` OK, 1 passed / 1 skipped; `npx playwright test tests/liquidaciones-oficiales.e2e.spec.ts --workers=1 --timeout=120000` OK, 1 passed; `npm run build` OK con warnings CSS conocidos; `npx ng test --watch=false` OK, 43 archivos / 433 tests.
- Regla corregida: `23_liquidaciones_oficiales_rpc.sql` persiste totales de cabecera desde el snapshot cerrado, respetando `no recalcula`.
- Hito funcional: Empleado/Ficha apta -> Preparar nomina -> Resultado preliminar -> Aprobacion operativa -> Cierre operativo -> Liquidaciones oficiales internas.

## LIQ-OFICIAL-01 - Liquidaciones oficiales internas v1

Fecha: 2026-05-10

- Objetivo: implementar liquidaciones oficiales internas desde nomina cerrada.
- SQL versionado: `22_liquidaciones_oficiales.sql`, `23_liquidaciones_oficiales_rpc.sql`, `run_all.sql`.
- Tablas: `nomina_liquidacion_periodo`, `nomina_liquidacion_trabajador`, `nomina_liquidacion_concepto`.
- RPC: `generar_liquidaciones_oficiales`, `SECURITY INVOKER`, solo `authenticated`, `anon/PUBLIC` revocados.
- Frontend: `src/app/features/liquidaciones-oficiales/` con models, rules, data-access, services, container y componentes de resumen/grilla/detalle.
- Ruta: `/remuneraciones/liquidaciones-oficiales`.
- Fuera de alcance respetado: sin PDF, firma, envio, Previred, LRE, banco ni contabilidad.

## EMP-ADV-MSGCOPY-01 - Copy administrativo en MsgBox de alta avanzada

Fecha: 2026-05-11

- Se pulen los mensajes de `app-message-box` en Creación avanzada con tono administrativo para RRHH.
- Se reemplaza `Continuar de todos modos` por `Continuar`, evitando que la acción suene riesgosa o culposa.
- Se reemplaza `Ir al primer bloqueo` por `Ir al primer pendiente`, manteniendo el comportamiento de navegación y foco.
- Las secciones del modal quedan como `Datos obligatorios pendientes`, `Advertencias de revisión` e `Información útil`.
- Los listados del MsgBox usan guion visual y frases completas con punto final para mejorar lectura.
- Se eliminan punto y coma de textos visibles del flujo.
- Alcance respetado: sin SQL/RPC/RLS/BD, sin payloads/mappers, sin motor, sin creación básica, sin ficha empleado ni remuneraciones.

## EMP-ADV-VALIDATION-CL-02 - Validaciones chilenas accionadas por MsgBox

Fecha: 2026-05-11

- Se ajusta Creacion avanzada para que las validaciones chilenas no se muestren como tarjeta fija por paso.
- `Siguiente` sigue siendo flexible: si el paso tiene bloqueos o advertencias, abre `app-message-box` modal con `Corregir ahora` o `Continuar`.
- `Guardar borrador` mantiene validacion minima y muestra `app-message-box` cuando faltan datos base; el exito de borrador tambien usa MsgBox.
- `Finalizar alta` concentra la exigencia: abre MsgBox con bloqueos/advertencias y solo navega al primer pendiente cuando el usuario lo pide.
- Se mantiene mapa de ficha como resumen permanente; no se duplica una tarjeta de validaciones dentro del contenido.
- Alcance respetado: sin SQL/RPC/RLS/BD, sin payloads/mappers, sin reglas de motor, sin creacion basica, sin ficha empleado ni remuneraciones.
- Validacion local: `npx tsc -p tsconfig.app.json --noEmit` OK y `npx tsc -p tsconfig.spec.json --noEmit` OK. `npm run build` no cierra en sandbox Linux por `node_modules` Windows (`@esbuild/win32-x64` / `lightningcss`).
