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
> NOM-HARD-01: el estado producto se sanea antes de cierre operativo. El flujo soportado llega hasta resultado preliminar calculado, guardado y aprobado operativamente; la aprobacion sigue local/volatil y pendiente de persistencia formal. Liquidaciones oficiales, cierre, Previred, LRE, banco y salidas legales quedan como fases futuras no disponibles.

## Estado

**NOM-00 arquitectura funcional**, **NOM-01 modelo documental de novedades mensuales**, **NOM-01B modelo SQL base de novedades mensuales**, **NOM-01C capa Angular base de novedades mensuales**, **NOM-01D UI base de novedades mensuales**, **Prevalidaciones 9.5A + 9.5B**, **pre-nomina funcional 9.5C**, **MOTOR-00 contrato del motor**, **MOTOR-01 calculo base preliminar**, **MOTOR-02 reglas legales avanzadas**, **MOTOR-03A contrato de persistencia**, **MOTOR-03B persistencia controlada**, **MOTOR-03C aplicacion controlada**, **MOTOR-04 contrato de entradas mensuales**, **USAB-NOM-03/04/05/06/07/08/09 dashboard operativo, base trazable, validacion previa, resultado revisable, guardado/versionado, revision y aprobacion operativa de Preparar nomina** y **NOM-HARD-01 saneamiento previo a cierre operativo** cerrados. NOM-01B agrega `novedad_remuneracion_periodo` como base SQL local; NOM-01C agrega modelos, mapper, repository, service y reglas puras; NOM-01D agrega una pantalla base para listar, crear borradores y cambiar estados simples, sin proceso mensual real, motor ni liquidaciones. MOTOR-03B agrega SQL local y guardado/consulta/reemplazo de snapshots preliminares; MOTOR-03C valida el SQL, confirma PK/FK y lo incluye en `run_all.sql`; MOTOR-04 agrega `entradasMensuales` al input del motor como contrato preparatorio sin cambiar formulas legales ni resultados. USAB-NOM-03 reorganiza la pantalla visible como tablero operativo, USAB-NOM-04 agrega trazabilidad de base, USAB-NOM-05 fortalece el semaforo antes de calcular, USAB-NOM-06 vuelve revisable el resultado preliminar, USAB-NOM-07 formaliza su guardado/versionado operativo, USAB-NOM-08 prepara la revision para aprobacion y USAB-NOM-09 habilita la aprobacion operativa interna sin persistencia nueva formal, sin cambiar formulas legales ni habilitar salidas oficiales. NOM-HARD-01 confirma el punto de corte: resultado preliminar calculado, guardado y aprobado operativamente; aprobacion local/volatil pendiente de persistencia formal; Liquidaciones visibles neutralizadas como modulo no disponible. No cierra periodo, no genera liquidacion oficial, PDF, Previred ni LRE. Vision de producto: [`vision-futura.md`](./vision-futura.md); orquestador: [`../../orquestador/estado-fases.md`](../../orquestador/estado-fases.md).

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

Pantalla visible **Preparar nomina**: ruta tecnica **`/remuneraciones/proceso-mensual`** (redirect desde `/proceso-remuneraciones`). UI: `src/app/features/nomina-mensual/containers/proceso-mensual-container/`; pagina `src/app/pages/proceso-remuneraciones.page.ts` wrapper (`docs/codex/arquitectura/frontend-interfaces.md`). Servicio: `ProcesoMensualService`; reglas: `proceso-mensual-prevalidacion.rules.ts`, `proceso-mensual-prenomina.rules.ts`, `proceso-mensual-motor.rules.ts` y `proceso-mensual-snapshot.rules.ts`. Desde USAB-NOM-03 la pantalla se organiza como dashboard operativo del periodo y usa `Base de nomina` como label visible para la pre-nomina funcional. Desde USAB-NOM-04 esa base muestra trabajadores considerados, observaciones/bloqueos, entradas consideradas y parametros del periodo antes de calcular. Desde USAB-NOM-05 el bloque `Estado para calculo preliminar` explica bloqueos, advertencias, informacion, razon de deshabilitado y siguiente accion. Desde USAB-NOM-06 `Resultado preliminar` muestra resumen del calculo, trabajadores calculados/con observaciones/omitidos, observaciones del resultado, detalle tecnico y acciones de recalculo/revision/guardado. Desde USAB-NOM-07 el guardado muestra estado operativo, confirmacion, ultimo resultado preliminar guardado, fecha de guardado, version del calculo, identificador tecnico y advertencias asociadas. Desde USAB-NOM-08 `Revision para aprobacion` transforma ese resultado guardado en checklist operativo y observaciones para decidir. Desde USAB-NOM-09 la accion visible es `Aprobar resultado preliminar`: queda habilitada solo con resultado guardado vigente y sin bloqueos, confirma que no cierra ni liquida, registra trazabilidad visual y queda desactualizada si se recalcula despues. La persistencia existente reemplaza el resultado activo del periodo; no hay version numerica incremental propia y no se inventa en UI. La aprobacion USAB-NOM-09 no agrega tabla ni columna y queda como estado operativo UI hasta una fase posterior de persistencia formal. Limpieza demo previa: [`../../auditorias/param-chile-01-parametros-y-demo-proceso.md`](../../auditorias/param-chile-01-parametros-y-demo-proceso.md).

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
