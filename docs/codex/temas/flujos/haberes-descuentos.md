# Flujo — Haberes y descuentos

## Ruta

- **`/haberes-descuentos`** — `HaberesDescuentosPage` (`src/app/pages/haberes-descuentos.page.ts`).

## Objetivo del usuario

Gestionar **asignaciones recurrentes** (u otras operaciones que exponga la página) por trabajador / período global según implementación. No sustituye liquidaciones ni el maestro de conceptos.

## Recorrido típico

1. Abrir desde el menú lateral.
2. Revisar listados o formularios según UI actual.
3. Guardar o consultar según reglas del módulo (detalle en contrato cuando exista).

## Documentación relacionada

| Tipo | Enlace |
|------|--------|
| Contrato funcional del módulo | **Pendiente** — `temas/haberes-descuentos-*.md` cuando se documente negocio y períodos. |
| DataGrid / tablas | [`../../ui-tables.md`](../../ui-tables.md) |
| Contexto producto (haberes vs conceptos) | [`../../orquestador/contexto-proyecto.md`](../../orquestador/contexto-proyecto.md) § Haberes |

## Pruebas

- Snapshot: `tests/dashboard.spec.ts` (`haberes-descuentos`).
