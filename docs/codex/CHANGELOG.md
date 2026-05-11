## UX-COMERCIAL-01 - Base documental para redisenio usable, dinamico y comercial

Fecha: 2026-05-10

- Objetivo: preparar la fase de redisenio usable/comercial sobre el flujo funcional ya validado: Empleado/Ficha apta -> Preparar nomina -> Resultado preliminar -> Aprobacion operativa -> Cierre operativo -> Liquidaciones oficiales internas.
- Se agregan contratos UX: `ux-comercial/README.md`, `contrato-diseno-comercial.md`, `patrones-pantallas-erp.md`, `sistema-estados-acciones.md`, `dashboard-comercial-remuneraciones.md`, `copywriting-operativo.md`, `checklist-cursor-ux.md` y `anti-patrones-ui.md`.
- Se agrega fase canonica `docs/codex/fases/ux-comercial/UX-COMERCIAL-01.md` y prompt operativo `docs/codex/prompts-cursor/CURSOR-UX-COMERCIAL-01.md`.
- Alcance futuro inmediato: mejorar navegacion, Preparar nomina, Liquidaciones oficiales, estados, siguiente accion, copy y trazabilidad secundaria.
- Fuera de alcance: SQL/RPC/RLS, formulas, motor, Previred, LRE, banco, contabilidad, PDF, firma, envio, reapertura y rectificacion.

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
