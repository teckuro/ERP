# Flujo — Proceso de remuneraciones

## Ruta

- **Oficial:** **`/remuneraciones/proceso-mensual`** — `ProcesoRemuneracionesPage` (`src/app/pages/proceso-remuneraciones.page.ts`), hija de `RemuneracionesOutletComponent`.
- **Compatibilidad temporal:** **`/proceso-remuneraciones`** — `redirectTo` -> `/remuneraciones/proceso-mensual` (`pathMatch: 'full'` en `src/app/app.routes.ts`).

## Objetivo del usuario

Pantalla de **proceso mensual** o checklist de remuneraciones (según evolución del producto). En el orquestador figura como **futuro** respecto al checklist completo (parámetros, aptos, recurrentes, variables, cálculo, cierre).

## Recorrido típico

1. Acceder desde el menú.
2. Seguir los pasos que la UI exponga (placeholder de producto hasta cerrar fase).

## Documentación relacionada

| Tipo | Enlace |
|------|--------|
| Contrato del proceso mensual | **Pendiente** — `temas/proceso-remuneraciones-*.md`. |
| Orquestador — camino oficial | [`../../orquestador/contexto-proyecto.md`](../../orquestador/contexto-proyecto.md) §12 |
| UI general | [`../../AGENTS.md`](../../AGENTS.md) |

## Pruebas

- Snapshot: `tests/dashboard.spec.ts` (`proceso-remuneraciones`).
