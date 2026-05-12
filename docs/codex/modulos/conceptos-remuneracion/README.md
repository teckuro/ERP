# Módulo Conceptos de remuneración — punto de entrada

## Estado (Fase 9)

**Fase fuerte del producto en curso:** la **documentación** Fase 9 incluye diagnóstico, contrato funcional y **decisiones operativas** ([`decisiones-operativas.md`](./decisiones-operativas.md)). **Fase 9.2A** dejó el **listado base** del catálogo (columnas, filtros, regla `esConceptoAsignable`, vacíos). **Fase 9.2B** añadió **detalle** al **Revisar** (modal), motivos de no asignabilidad/resumen, vigencia `INVALIDO` si fechas incoherentes, y **blindaje de acciones** (`concepto-acciones.rules.ts` + deshabilitado en grilla). **Fase 9.2C** alineó **Haberes y descuentos** al listado de asignables del catálogo (`HaberesDescuentosService.listarConceptos` + validación al guardar con `esConceptoAsignable`). Siguen brechas de **permisos/JWT**, **CRUD completo alineado a roles**, **reglas de cálculo en UI**, **E2E visual estable** y **RLS** según diagnóstico §8 y decisiones §2 / §10.

## Orden de lectura

1. [`diagnostico-fase-9.md`](./diagnostico-fase-9.md) — estado real del repo (UI, API, BD, pruebas).  
2. [`contrato-funcional.md`](./contrato-funcional.md) — reglas de negocio y de pantalla que deben cumplirse o extenderse.  
3. [`contrato-general.md`](./contrato-general.md) — índice y principios.  

## Documentos

| Archivo | Rol |
|---------|-----|
| [`diagnostico-fase-9.md`](./diagnostico-fase-9.md) | Diagnóstico Fase 9 |
| [`decisiones-operativas.md`](./decisiones-operativas.md) | Decisiones de producto antes de CRUD/RLS (Fase 9.2) |
| [`contrato-funcional.md`](./contrato-funcional.md) | Contrato funcional del mantenedor y del modelo |
| [`contrato-general.md`](./contrato-general.md) | Resumen e índice |

## Orquestador y flujos

- Tablero: [`../../orquestador/estado-fases.md`](../../orquestador/estado-fases.md) (fase 9).  
- Diseño operativo y prioridad del módulo: [`../../orquestador/diseno-operativo-erp.md`](../../orquestador/diseno-operativo-erp.md) §6.  
- Contexto global: [`../../orquestador/contexto-proyecto.md`](../../orquestador/contexto-proyecto.md) §10.  
- Recorrido por rutas: [`../../temas/flujos/remuneraciones-conceptos.md`](../../temas/flujos/remuneraciones-conceptos.md) (outlet `/remuneraciones/*`; ver Fase 9.3B.1 en [`../../orquestador/estado-fases.md`](../../orquestador/estado-fases.md)).

## Relación con Haberes y descuentos

El código del mantenedor comparte **`HaberesDescuentosService`** con asignaciones recurrentes. El contrato de **asignaciones** sigue en [`../haberes-descuentos/contrato-general.md`](../haberes-descuentos/contrato-general.md); las reglas del **catálogo concepto** viven en este módulo.

## Relacion con Movimientos variables

Los movimientos variables mensuales **referencian** conceptos del catalogo pero no son el mantenedor de `concepto`. Contrato, decisiones y modelo v1 (validacion opcional por snapshot sin acoplar a `concepto-asignabilidad`): [`../movimientos-variables/README.md`](../movimientos-variables/README.md), [`contrato-funcional.md`](./contrato-funcional.md) §17.

## LRE-CONCEPT-RULES-01

El modulo Conceptos incorpora metadata para tratamiento LRE:

- `estrategia_lre`
- `requiere_exportacion_lre`
- `observacion_normativa_lre`

Esto permite diferenciar conceptos directos, derivados, ambiguos, pendientes o internos sin forzar codigos LRE incorrectos.
