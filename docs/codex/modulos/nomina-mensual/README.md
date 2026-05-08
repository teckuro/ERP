# Módulo Nómina mensual - punto de entrada

## Estado

**NOM-00 arquitectura funcional**, **NOM-01 modelo documental de novedades mensuales**, **NOM-01B modelo SQL base de novedades mensuales**, **NOM-01C capa Angular base de novedades mensuales**, **NOM-01D UI base de novedades mensuales**, **Prevalidaciones 9.5A + 9.5B**, **pre-nomina funcional 9.5C**, **MOTOR-00 contrato del motor**, **MOTOR-01 calculo base preliminar**, **MOTOR-02 reglas legales avanzadas**, **MOTOR-03A contrato de persistencia**, **MOTOR-03B persistencia controlada** y **MOTOR-03C aplicacion controlada** cerrados. NOM-01B agrega `novedad_remuneracion_periodo` como base SQL local; NOM-01C agrega modelos, mapper, repository, service y reglas puras; NOM-01D agrega una pantalla base para listar, crear borradores y cambiar estados simples, sin proceso mensual real, motor ni liquidaciones. MOTOR-03B agrega SQL local y guardado/consulta/reemplazo de snapshots preliminares; MOTOR-03C valida el SQL, confirma PK/FK y lo incluye en `run_all.sql`, sin aplicar Supabase remoto ni regenerar tipos porque no hubo ambiente confirmado. No cierra periodo, no genera liquidacion oficial, PDF, Previred ni LRE. Vision de producto: [`vision-futura.md`](./vision-futura.md); orquestador: [`../../orquestador/estado-fases.md`](../../orquestador/estado-fases.md).

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

Pantalla **Proceso mensual**: **`/remuneraciones/proceso-mensual`** (redirect desde `/proceso-remuneraciones`). UI: `src/app/features/nomina-mensual/containers/proceso-mensual-container/`; pagina `src/app/pages/proceso-remuneraciones.page.ts` wrapper (`docs/codex/arquitectura/frontend-interfaces.md`). Servicio: `ProcesoMensualService`; reglas: `proceso-mensual-prevalidacion.rules.ts`, `proceso-mensual-prenomina.rules.ts`, `proceso-mensual-motor.rules.ts` y `proceso-mensual-snapshot.rules.ts`. Limpieza demo previa: [`../../auditorias/param-chile-01-parametros-y-demo-proceso.md`](../../auditorias/param-chile-01-parametros-y-demo-proceso.md).

[`../../temas/flujos/proceso-remuneraciones.md`](../../temas/flujos/proceso-remuneraciones.md) y [`../../orquestador/contexto-proyecto.md`](../../orquestador/contexto-proyecto.md) §11-§15.

**Novedades mensuales** es el nombre funcional oficial para RRHH. El nombre tecnico historico puede aparecer como **movimientos variables**, pero queda como legacy/transicion: [`novedades-mensuales.md`](./novedades-mensuales.md), [`../movimientos-variables/README.md`](../movimientos-variables/README.md), [`../movimientos-variables/ui-9-4E.md`](../movimientos-variables/ui-9-4E.md).

<!-- ARQ-ERP-01-INTEGRACION -->

## Integracion canonica 2026-05-07

Para nuevas fases de Nomina, el orden de lectura adicional es:

1. [`../../orquestador/estructura-canonica-erp.md`](../../orquestador/estructura-canonica-erp.md)
2. [`../../orquestador/plan-transicion-novedades-movimientos.md`](../../orquestador/plan-transicion-novedades-movimientos.md)
3. [`benchmark-novedades-pre-nomina.md`](./benchmark-novedades-pre-nomina.md)

Decision activa:

- Novedades mensuales es el flujo canonico para hechos del periodo.
- Movimientos variables se conserva como legado/transicion.
- La siguiente fase tecnica recomendada es crear `EntradasMensualesPeriodoService` antes de ampliar UI o motor.
