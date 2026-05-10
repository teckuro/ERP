# Módulo Nómina mensual - punto de entrada

> Nombre visible en UI para el flujo mensual principal: `Preparar nomina`.
> Nombre visible en UI para novedades canonicas: `Movimientos del mes`.
> Nombre tecnico/documental: `Novedades mensuales`.
> Tabla canonica: `novedad_remuneracion_periodo`.
> USAB-NOM-03: `Preparar nomina` opera como dashboard del periodo; la UI visible prioriza estado, siguiente accion, checklist, bloqueos/advertencias, base de nomina, calculo preliminar y resultado guardado.
> USAB-NOM-04: `Base de nomina` muestra trazabilidad operativa de trabajadores, observaciones/bloqueos, asignaciones recurrentes, movimientos del mes y parametros antes del calculo preliminar.
> USAB-NOM-05: `Calcular preliminar` queda protegido por validacion operativa visible: bloqueos, advertencias, informacion, razon de deshabilitado y siguiente accion.
> USAB-NOM-06: `Resultado preliminar` es una revision operativa del calculo antes de guardar; no es liquidacion oficial ni cierre.
> USAB-NOM-07: `Guardar resultado preliminar` crea o reemplaza una version operativa revisable del calculo. La UI muestra estado de guardado, ultimo guardado, fecha, version del calculo e identificador tecnico; no emite liquidaciones, no cierra periodo y no genera archivos legales.
> USAB-NOM-08: `Revision para aprobacion` prepara la decision operativa sobre el resultado preliminar guardado con checklist, observaciones y solicitud deshabilitada para fase posterior; no aprueba ni cierra nomina.
> USAB-NOM-09: `Aprobar resultado preliminar` registra una aprobacion operativa interna sobre el resultado guardado vigente, con confirmacion y trazabilidad visual; no cierra periodo, no emite liquidaciones ni genera archivos legales.
> NOM-HARD-01: el estado producto se sanea antes de cierre operativo. El flujo soportado llega hasta resultado preliminar calculado, guardado y aprobado operativamente. Liquidaciones oficiales, cierre, Previred, LRE, banco y salidas legales quedan como fases futuras no disponibles.
> NOM-PERSIST-01: la aprobacion operativa queda persistida en `nomina_calculo_periodo`, asociada al `id_calculo_periodo` del resultado guardado vigente. No usa `aprobado_para_liquidacion`, no cierra periodo y no emite liquidaciones.
> NOM-SNAPSHOT-01: `Resultado guardado desde BD` consulta el snapshot preliminar completo desde las tablas `nomina_calculo_*` para mostrar cabecera, trabajadores, conceptos, observaciones, trazabilidad y aprobacion operativa sin recalcular.
> NOM-ATOMIC-01: `Guardar resultado preliminar` usa la RPC `guardar_nomina_calculo_snapshot` para guardar/reemplazar el snapshot completo de forma atomica. Si falla una parte, no quedan cambios parciales.
> NOM-DB-APPLY-01: los scripts de snapshots/RLS/RPC fueron aplicados y validados con `psql` en Supabase remoto controlado. `authenticated` ejecuta la RPC, `anon` no, RLS sigue activo y se valido rollback sin datos permanentes de prueba.
> NOM-E2E-01: se agrega E2E real opcional para validar `Preparar nomina` con sesion Supabase `authenticated`. La ejecucion queda bloqueada en este checkout porque faltan credenciales/periodo E2E; no se inventa usuario ni se usa `service_role`.
> AUTH-BASE-01: existe `/login`, rutas internas protegidas y logout; `Preparar nomina` queda desbloqueable para E2E real con usuario Supabase `authenticated`.
> NOM-E2E-02: se intento ejecutar el flujo real authenticated posterior a AUTH-BASE-01. En este entorno faltan variables de sesion, periodo y `SUPABASE_DB_URL`; el E2E corrio en modo seguro con 1 passed / 1 skipped y sin escrituras reales.
> ENV-E2E-01: se prepara el entorno para repetir NOM-E2E-02. `SUPABASE_DB_URL` queda disponible en `.env` local, `.env.example` declara placeholders seguros y la RPC se valida con `authenticated=true`/`anon=false`. Siguen pendientes usuario Auth, password local y periodo E2E.
> EMP-ADV-FICHA-01: antes de crear seeds directos para nomina, se corrige la fuente en Empleados/Ficha. `Sin prevision` bloquea aptitud para remuneraciones y el alta avanzada deja de crear trabajadores aptos sin AFP/salud.
> NOM-SAVE-DIAG-01: se ejecuto E2E real authenticated para `2026-04`, se capturo el error RPC sanitizado `22007 invalid input syntax for type date: "2026-04"` y se corrigio el payload de trazabilidad normalizando vigencias `YYYY-MM` a `YYYY-MM-01`. El flujo guarda, consulta BD, aprueba y recupera al recargar; no cambia SQL/RPC/RLS ni formulas.
> NOM-E2E-CLOSE-01: se consolida documentalmente el hito E2E real authenticated. `npx playwright test tests/nomina-mensual.e2e.spec.ts --workers=1` queda como evidencia OK (1 passed / 1 skipped) y SQL post-guardado confirma snapshot activo `id_calculo_periodo=11` para `2026-04`, 2 trabajadores, 16 conceptos, 12 observaciones, 72 trazas, aprobacion operativa y 0 duplicados activos.

## Estado

**NOM-00 arquitectura funcional**, **NOM-01 modelo documental de novedades mensuales**, **NOM-01B modelo SQL base de novedades mensuales**, **NOM-01C capa Angular base de novedades mensuales**, **NOM-01D UI base de novedades mensuales**, **Prevalidaciones 9.5A + 9.5B**, **pre-nomina funcional 9.5C**, **MOTOR-00 contrato del motor**, **MOTOR-01 calculo base preliminar**, **MOTOR-02 reglas legales avanzadas**, **MOTOR-03A contrato de persistencia**, **MOTOR-03B persistencia controlada**, **MOTOR-03C aplicacion controlada**, **MOTOR-04 contrato de entradas mensuales**, **USAB-NOM-03/04/05/06/07/08/09 dashboard operativo, base trazable, validacion previa, resultado revisable, guardado/versionado, revision y aprobacion operativa de Preparar nomina**, **NOM-HARD-01 saneamiento previo a cierre operativo**, **NOM-PERSIST-01 persistencia formal de aprobacion operativa**, **NOM-SNAPSHOT-01 snapshot completo consultable desde BD**, **NOM-ATOMIC-01 reemplazo atomico/transaccional del resultado guardado**, **NOM-DB-APPLY-01 aplicacion/validacion SQL-RPC en BD real**, **NOM-SAVE-DIAG-01 diagnostico/correccion del guardado RPC real** y **NOM-E2E-CLOSE-01 cierre documental E2E real** cerrados. NOM-E2E-CLOSE-01 confirma el flujo real authenticated para `2026-04` hasta guardado, consulta desde BD, aprobacion operativa y recarga. NOM-01B agrega `novedad_remuneracion_periodo` como base SQL local; NOM-01C agrega modelos, mapper, repository, service y reglas puras; NOM-01D agrega una pantalla base para listar, crear borradores y cambiar estados simples, sin proceso mensual real, motor ni liquidaciones. MOTOR-03B agrega SQL local y guardado/consulta/reemplazo de snapshots preliminares; MOTOR-03C valida el SQL, confirma PK/FK y lo incluye en `run_all.sql`; MOTOR-04 agrega `entradasMensuales` al input del motor como contrato preparatorio sin cambiar formulas legales ni resultados. USAB-NOM-03 reorganiza la pantalla visible como tablero operativo, USAB-NOM-04 agrega trazabilidad de base, USAB-NOM-05 fortalece el semaforo antes de calcular, USAB-NOM-06 vuelve revisable el resultado preliminar, USAB-NOM-07 formaliza su guardado/versionado operativo, USAB-NOM-08 prepara la revision para aprobacion y USAB-NOM-09 habilita la aprobacion operativa interna. NOM-PERSIST-01 persiste esa aprobacion en el resultado guardado vigente, sin usar `aprobado_para_liquidacion`; NOM-SNAPSHOT-01 consulta desde BD el detalle completo guardado sin recalcular movimientos ni parametros actuales; NOM-ATOMIC-01 reemplaza el guardado compuesto desde cliente por la RPC transaccional `guardar_nomina_calculo_snapshot`; NOM-DB-APPLY-01 valida esa RPC contra BD real/controlada. Liquidaciones visibles neutralizadas como modulo no disponible. No cierra periodo, no genera liquidacion oficial, PDF, Previred ni LRE. Siguiente fase recomendada: `NOM-CIERRE-DESIGN-01 - Diseno funcional y tecnico del cierre operativo de nomina`. Vision de producto: [`vision-futura.md`](./vision-futura.md); orquestador: [`../../orquestador/estado-fases.md`](../../orquestador/estado-fases.md).

## Documentos

| Archivo | Rol |
|---------|-----|
| [`contrato-general.md`](./contrato-general.md) | Objetivo, alcance, relaciones con Parametros, empleados, conceptos, MV, motor futuro |
| [`arquitectura-funcional-remuneraciones.md`](./arquitectura-funcional-remuneraciones.md) | NOM-00: arquitectura funcional completa de remuneraciones, responsabilidades por modulo y regla de ubicacion de datos |
| [`novedades-mensuales.md`](./novedades-mensuales.md) | NOM-01/NOM-01B/NOM-01C/NOM-01D: modelo documental, SQL base, capa Angular base y UI base de novedades mensuales |
| [`prevalidaciones-9-5A.md`](./prevalidaciones-9-5A.md) | Reglas base 9.5A (periodo, fila PG, calendario, empleados, conceptos, MV) |
| [`prevalidaciones-9-5B.md`](./prevalidaciones-9-5B.md) | Recurrentes por `YYYY-MM`, grupos minimos de parametros, archivos y pruebas 9.5B |
| [`prevalidaciones-9-5C.md`](./prevalidaciones-9-5C.md) | Pre-nomina funcional por periodo desde la prevalidacion, sin calculo ni liquidaciones |
| [`motor-calculo-contrato.md`](./motor-calculo-contrato.md) | Contrato MOTOR-00: objetivo, entrada, salida, bloqueos, DB-01 y fuera de alcance |
| [`motor-calculo-orden-operaciones.md`](./motor-calculo-orden-operaciones.md) | Orden obligatorio de operaciones y reglas normativas iniciales |
| [`motor-calculo-entradas-salidas.md`](./motor-calculo-entradas-salidas.md) | Tipos conceptuales de `MotorCalculoInput` y `LiquidacionCalculada` |
| [`motor-calculo-casos-prueba.md`](./motor-calculo-casos-prueba.md) | Casos minimos exigidos para implementar MOTOR-01 |
| [`motor-calculo-implementacion-01.md`](./motor-calculo-implementacion-01.md) | Implementacion MOTOR-01: calculo base preliminar, tests, limites y pendientes |
| [`motor-calculo-implementacion-02.md`](./motor-calculo-implementacion-02.md) | Implementacion MOTOR-02: gratificacion, impuesto unico, topes, asignacion familiar simple y jornada/IMM |
| [`motor-calculo-persistencia-03A.md`](./motor-calculo-persistencia-03A.md) | Contrato MOTOR-03A: snapshot preliminar, estados, tablas candidatas, hash, recalculo y liquidacion futura |
| [`motor-calculo-persistencia-03B.md`](./motor-calculo-persistencia-03B.md) | Implementacion MOTOR-03B: SQL local, mapping, repository, servicio y UI minima para snapshot preliminar |
| [`motor-calculo-persistencia-03C.md`](./motor-calculo-persistencia-03C.md) | Cierre MOTOR-03C: validacion SQL, inclusion en flujo v11, tipos pendientes y no aplicacion remota sin ambiente confirmado |
| [`vision-futura.md`](./vision-futura.md) | Checklist orientativo y relación con otros módulos |

## Relación con flujos documentados

Pantalla visible **Preparar nomina**: ruta tecnica **`/remuneraciones/proceso-mensual`** (redirect desde `/proceso-remuneraciones`). UI: `src/app/features/nomina-mensual/containers/proceso-mensual-container/`; pagina `src/app/pages/proceso-remuneraciones.page.ts` wrapper (`docs/codex/arquitectura/frontend-interfaces.md`). Servicio: `ProcesoMensualService`; reglas: `proceso-mensual-prevalidacion.rules.ts`, `proceso-mensual-prenomina.rules.ts`, `proceso-mensual-motor.rules.ts` y `proceso-mensual-snapshot.rules.ts`. Desde USAB-NOM-03 la pantalla se organiza como dashboard operativo del periodo y usa `Base de nomina` como label visible para la pre-nomina funcional. Desde USAB-NOM-04 esa base muestra trabajadores considerados, observaciones/bloqueos, entradas consideradas y parametros del periodo antes de calcular. Desde USAB-NOM-05 el bloque `Estado para calculo preliminar` explica bloqueos, advertencias, informacion, razon de deshabilitado y siguiente accion. Desde USAB-NOM-06 `Resultado preliminar` muestra resumen del calculo, trabajadores calculados/con observaciones/omitidos, observaciones del resultado, detalle tecnico y acciones de recalculo/revision/guardado. Desde USAB-NOM-07 el guardado muestra estado operativo, confirmacion, ultimo resultado preliminar guardado, fecha de guardado, version del calculo, identificador tecnico y advertencias asociadas. Desde USAB-NOM-08 `Revision para aprobacion` transforma ese resultado guardado en checklist operativo y observaciones para decidir. Desde USAB-NOM-09 la accion visible es `Aprobar resultado preliminar`: queda habilitada solo con resultado guardado vigente y sin bloqueos, confirma que no cierra ni liquida, registra trazabilidad visual y queda desactualizada si se recalcula despues. Desde NOM-PERSIST-01 esa aprobacion se guarda en `nomina_calculo_periodo` para el `id_calculo_periodo` activo y se recupera al cargar o volver al periodo. Desde NOM-SNAPSHOT-01 `Resultado guardado desde BD` consulta cabecera, trabajadores, conceptos, observaciones, trazabilidad y aprobacion operativa directamente desde las tablas de snapshot; no recalcula con movimientos, parametros ni reglas actuales. Desde NOM-ATOMIC-01 el guardado/reemplazo se confirma mediante `guardar_nomina_calculo_snapshot`: si falla cualquier insercion, no queda cabecera activa incompleta ni se desactiva el resultado anterior. La persistencia existente reemplaza el resultado activo del periodo; no hay version numerica incremental propia y no se inventa en UI. Limpieza demo previa: [`../../auditorias/param-chile-01-parametros-y-demo-proceso.md`](../../auditorias/param-chile-01-parametros-y-demo-proceso.md).

[`../../temas/flujos/proceso-remuneraciones.md`](../../temas/flujos/proceso-remuneraciones.md) y [`../../orquestador/contexto-proyecto.md`](../../orquestador/contexto-proyecto.md) §11-§15.

**Novedades mensuales** es el nombre funcional oficial para RRHH. El nombre tecnico historico puede aparecer como **movimientos variables**, pero queda como legacy/transicion: [`novedades-mensuales.md`](./novedades-mensuales.md), [`../movimientos-variables/README.md`](../movimientos-variables/README.md), [`../movimientos-variables/ui-9-4E.md`](../movimientos-variables/ui-9-4E.md).

<!-- ARQ-ERP-01-INTEGRACION -->

## Integracion canonica 2026-05-07

Para nuevas fases de Nomina, el orden de lectura adicional es:

1. [`../../orquestador/estructura-canonica-erp.md`](../../orquestador/estructura-canonica-erp.md)
2. [`../../orquestador/plan-transicion-novedades-movimientos.md`](../../orquestador/plan-transicion-novedades-movimientos.md)
3. [`benchmark-novedades-pre-nomina.md`](./benchmark-novedades-pre-nomina.md)

Decision activa:

- Movimientos del mes es el nombre visible del flujo canonico de novedades para hechos del periodo.
- Novedades mensuales se mantiene como nombre tecnico/documental asociado a `novedad_remuneracion_periodo`.
- Movimientos variables se conserva como legado/transicion.
- La siguiente fase tecnica recomendada es crear `EntradasMensualesPeriodoService` antes de ampliar UI o motor.
