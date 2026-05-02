# Flujo — Remuneraciones (outlet conceptos)

## Rutas

- **`/remuneraciones`** — redirige a `conceptos`.
- **`/remuneraciones/conceptos`** — `ConceptosRemuneracionPage` (`src/app/pages/conceptos-remuneracion.page.ts`), hijo de `RemuneracionesOutletComponent`.

## Objetivo del usuario

Trabajar el **catálogo o listado de conceptos de remuneración** (según alcance implementado en la página). En el roadmap global, el maestro de conceptos gobernado es fase fuerte; alinear futuros cambios con [`../organizacion-por-modulo-y-flujos.md`](../organizacion-por-modulo-y-flujos.md) y [`../../orquestador/contexto-proyecto.md`](../../orquestador/contexto-proyecto.md).

## Recorrido típico

1. Menú → **Remuneraciones** (o ruta directa).
2. Ver pestaña / contenido de **Conceptos**.
3. Operaciones que exponga la UI (alta, edición, filtros): según implementación actual.

## Documentación relacionada

| Tipo | Enlace |
|------|--------|
| Contrato específico de conceptos | **Pendiente** — crear `temas/conceptos-remuneracion-*.md` cuando se cierre la fase de producto. |
| Tablas / listados | [`../../ui-tables.md`](../../ui-tables.md) |
| Formularios | [`../../ui-form-guidelines.md`](../../ui-form-guidelines.md) |
| Orquestador (prioridad conceptos) | [`../../orquestador/estado-fases.md`](../../orquestador/estado-fases.md) |

## Pruebas

- Snapshot ruta en `tests/dashboard.spec.ts` si la ruta está incluida en el bucle de rutas (revisar lista `routes` del spec).
