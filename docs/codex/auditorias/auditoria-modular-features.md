# Auditoría modular — `src/app/features`

Fase **EMP-MODULAR-AUDIT-01**. Mapa de archivos grandes y orden de extracción por PR pequeñas.

Referencia nomenclatura: [`../diseno/nomenclatura-es-camelcase-01.md`](../diseno/nomenclatura-es-camelcase-01.md).

## Ola A — Alta avanzada (cerrada 2026-05-25)

| Módulo | Estado |
|--------|--------|
| [`empleado-alta-foco.util.ts`](../../src/app/features/empleados/utils/empleado-alta-foco.util.ts) | Implementado |
| [`empleado-alta-modal.orquestador.ts`](../../src/app/features/empleados/facade/empleado-alta-modal.orquestador.ts) | Implementado |
| [`empleado-alta-ficha-snapshot.builder.ts`](../../src/app/features/empleados/rules/empleado-alta-ficha-snapshot.builder.ts) | Implementado |
| `etiquetaPasoHonorarios` en [`empleado-form.manifest.ts`](../../src/app/features/empleados/models/empleado-form.manifest.ts) | Implementado |

[`form-empleado.ts`](../../src/app/features/empleados/components/form-empleado/form-empleado.ts) delega modales al orquestador y snapshot al builder; conserva template, wizard, submit y foco vía `DelegadoModalAltaEmpleado`.

## Backlog transversal (prioridad)

| PR | Archivo | ~Líneas | Extracción |
|----|---------|---------|------------|
| B3 | `movimientos-variables-container.ts` | ~~498~~ **~340** | ✅ 2026-05-25: `movimiento-variable-listado.presenter.ts`, `movimiento-variable-alta-dialog`, `movimiento-variable-anular-dialog` |
| B2 | `haberes-descuentos-container.ts` | ~~863~~ **~620** | ✅ 2026-05-25: `haber-descuento-asignacion-listado.presenter.ts`, `haber-descuento-asignacion-editor-dialog` |
| B1 | `parametros-workspace-container.ts` | ~~2206~~ **~1850** | ✅ 2026-05-25: `parametros-workspace-grids.presenter`, `parametros-workspace-tabs.presenter`, `parametros-workspace-periodo-banda`, `parametros-workspace-tabs-panel` |
| B4 | `ficha-empleado-presentacion.facade.ts` | 1969 | Sub-facades por tab/overlay |
| B5 | `tabla-empleados.ts` | ~~699~~ **~420** | ✅ 2026-05-25: `tabla-empleados-listado.presenter.ts` (columnas, filtros, acciones masivas) |
| B6 | `empleado-ficha-validacion.rules.ts` | 1308 | Split por dominio (`personal`, `contrato`, `prevision`) |

## Ola B — cierre (2026-05-25)

Completados B1–B3 y B5. Pendientes para fases dedicadas de ficha y validación:

| PR | Motivo de aplazamiento |
|----|------------------------|
| B4 | `ficha-empleado-presentacion.facade` (~1969): sub-facades por tab/overlay; acoplamiento alto con ficha en curso. |
| B6 | `empleado-ficha-validacion.rules` (~1308): split por dominio con riesgo de regresión en validación. |

Nota B1: la orquestación (carga, guardado, diálogos, formulario) permanece en `parametros-workspace-container`; las pestañas UI ya vivían en `components/tabs/`. El panel `parametros-workspace-tabs-panel` concentra el `@switch` por sección.

## Fuera de alcance inmediato

- `empleados.repository.ts` / `parametros-generales.repository.ts` — requiere fase BD.
- `proceso-mensual-presentacion.facade.ts` — solo documentar hasta fase nómina dedicada.
- `empleados-form-orchestrator.service.ts` — ciclo de vida del form; no partir sin specs de selects.

## Criterio por PR

- Tests del feature verdes.
- Símbolos nuevos en español / camelCase según nomenclatura.
- Sin cambios en estilos globales, SQL, mappers de persistencia ni `angular.json`.
