## LRE-CATALOG-01 - Catalogo oficial LRE y mapeo base de conceptos

Fecha: 2026-05-11

- Se agrega `bd/base/v11/partes/24_lre_catalogo_oficial.sql` con catalogo `catalogo_lre` completo segun suplemento DT LRE enero 2022: identificacion `11xx`, haberes `21xx/22xx/23xx/24xx`, descuentos `31xx`, aportes `41xx` y totales `5xxx`.
- `run_all.sql` incluye el nuevo script para fresh install local; BD existente debe ejecutar el script 24 despues de la estructura LRE.
- Se actualiza el mapeo base de `concepto.id_catalogo_lre`: `GRATIFICACION -> 2106`, `HORAS_EXTRAS -> 2102`, `IMPUESTO_RENTA -> 3161`, y se mantienen mapeos existentes de sueldo, bonos, asignaciones, descuentos y aportes.
- `INASISTENCIA`, `ZONA_EXTREMA` y `AFP_EMPLEADOR` quedan explicitamente sin mapeo forzado por riesgo de interpretacion normativa.
- Se agregan validaciones no destructivas `22_lre_catalogo_oficial_minimo` y `23_lre_mapeos_conceptos_base` en `90_validaciones_v11.sql`.
- Alcance respetado: sin exportador LRE, sin cambios de motor/formulas, sin aplicar SQL contra BD real, sin Previred/banco/PDF/firma/envio.

## REM-MOV-MODAL-01 - Registro de movimiento en modal responsive

Fecha: 2026-05-11

- `Movimientos del mes` abre `Registrar movimiento` en un modal grande responsive con header, footer y scroll interno.
- El periodo activo global se muestra solo como contexto dentro del modal; no se agrego selector local ni `input type="month"`.
- El formulario queda ordenado en datos principales, detalle opcional y resumen antes de guardar; `Guardar movimiento` es la accion primaria unica.
- Cancelar cierra directo si no hay cambios y pide confirmacion con `app-message-box` cuando hay datos sin guardar.
- Validaciones de formulario quedan visibles junto a los campos y mantienen el modal abierto.
- Alcance respetado: sin SQL/RPC/RLS/BD, sin formulas legales ni motor, sin liquidaciones oficiales, Previred/LRE/banco, PDF/firma/envio.

## REM-MOV-UNIFY-01 - Consolidacion de lenguaje y flujo de Movimientos del mes

Fecha: 2026-05-11

- Copy visible consolidado: el flujo operativo se presenta como `Movimientos del mes`.
- Formulario reordenado en datos principales, clasificacion y detalle opcional; periodo global solo como contexto no editable.
- Resumen operativo por estado del periodo: total, borradores, pendientes, aprobados y secundarios.
- Listado principal ajustado con empty state operativo y accion primaria `Registrar movimiento`.
- Preparar nomina reemplaza copy visible residual de movimientos variables por movimientos puntuales/del mes.
- Alcance respetado: sin SQL/RPC/RLS/BD, sin formulas legales ni motor, sin liquidaciones oficiales, Previred/LRE/banco, PDF/firma/envio.

## REM-PERIOD-GLOBAL-01 + REM-NAV-IA-01 - Periodo global y rutas canonicas

Fecha: 2026-05-11

- Header global queda como unica fuente editable de periodo en Remuneraciones; pantallas hijas consumen `PeriodoActivoService.periodoYm()`.
- `Movimientos del mes` y legacy `Movimientos variables` no exponen `input type="month"` local; altas/listados usan periodo global.
- `Preparar nomina` y `Liquidaciones oficiales` limpian estado anterior y consultan el nuevo periodo al cambiar el header.
- `Asignaciones recurrentes` clasifica vigencias contra el primer dia del periodo global.
- Navegacion visible canonica: `/remuneraciones/proceso-mensual`, `/remuneraciones/novedades-mensuales`, `/remuneraciones/haberes-descuentos`, `/remuneraciones/liquidaciones`, `/remuneraciones/conceptos`.
- Redirects legacy: `/remuneraciones/movimientos-variables` -> `/remuneraciones/novedades-mensuales`; `/remuneraciones/liquidaciones-oficiales` -> `/remuneraciones/liquidaciones`.
- Alcance respetado: sin SQL/RPC/RLS/BD, sin formulas legales ni motor, sin PDF/firma/envio, sin Previred/LRE/banco/contabilidad.

## REM-UX-FLOWS-02 - Orden operativo transversal de Remuneraciones

Fecha: 2026-05-11

- Se reordena `Preparar nomina` hacia estado del periodo, accion principal unica, resumen, pendientes, revision operativa e informacion interna al final.
- Se elimina el doble recorrido visible: queda solo el avance compacto superior; el rail lateral `Recorrido visible` deja de renderizarse.
- `Movimientos del mes` deja de exponer selector local editable de periodo y registra altas contra el periodo activo global.
- `Asignaciones recurrentes` reemplaza el collapsable de impacto por una nota compacta visible y agrega resumen por trabajador seleccionado.
- `Liquidaciones oficiales`, Dashboard, Reportes y Detalle usaban en esa fase la ruta visible `/remuneraciones/liquidaciones-oficiales`; REM-NAV-IA-01 la reemplaza por `/remuneraciones/liquidaciones`.
- Alcance respetado: sin SQL/RPC/RLS/BD, sin formulas legales ni motor, sin PDF/firma/envio, sin Previred/LRE/banco/contabilidad.

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
