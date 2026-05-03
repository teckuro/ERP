# Módulo Conceptos de remuneración — punto de entrada

## Estado (Fase 9)

**Fase fuerte del producto en curso:** la **documentación de diagnóstico y contrato funcional** (Fase 9 documental) está en los archivos enlazados abajo. La **implementación** del mantenedor ya existe en código; quedan brechas de **permisos**, **reglas de cálculo en UI**, **E2E** y endurecimiento de **RLS** según [`diagnostico-fase-9.md`](./diagnostico-fase-9.md) §8.

## Orden de lectura

1. [`diagnostico-fase-9.md`](./diagnostico-fase-9.md) — estado real del repo (UI, API, BD, pruebas).  
2. [`contrato-funcional.md`](./contrato-funcional.md) — reglas de negocio y de pantalla que deben cumplirse o extenderse.  
3. [`contrato-general.md`](./contrato-general.md) — índice y principios.  

## Documentos

| Archivo | Rol |
|---------|-----|
| [`diagnostico-fase-9.md`](./diagnostico-fase-9.md) | Diagnóstico Fase 9 |
| [`contrato-funcional.md`](./contrato-funcional.md) | Contrato funcional del mantenedor y del modelo |
| [`contrato-general.md`](./contrato-general.md) | Resumen e índice |

## Orquestador y flujos

- Tablero: [`../../orquestador/estado-fases.md`](../../orquestador/estado-fases.md) (fase 9).  
- Diseño operativo y prioridad del módulo: [`../../orquestador/diseno-operativo-erp.md`](../../orquestador/diseno-operativo-erp.md) §6.  
- Contexto global: [`../../orquestador/contexto-proyecto.md`](../../orquestador/contexto-proyecto.md) §10.  
- Recorrido por rutas: [`../../temas/flujos/remuneraciones-conceptos.md`](../../temas/flujos/remuneraciones-conceptos.md).

## Relación con Haberes y descuentos

El código del mantenedor comparte **`HaberesDescuentosService`** con asignaciones recurrentes. El contrato de **asignaciones** sigue en [`../haberes-descuentos/contrato-general.md`](../haberes-descuentos/contrato-general.md); las reglas del **catálogo concepto** viven en este módulo.
