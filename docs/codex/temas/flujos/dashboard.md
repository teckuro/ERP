# Flujo — Dashboard (inicio)

## Ruta

- **`/`** — `DashboardPage` (`src/app/pages/dashboard.page.ts`).

## Objetivo del usuario

Punto de entrada tras iniciar sesión: resumen o accesos rápidos al trabajo diario (según lo implementado en la página).

## Recorrido típico

1. Abrir la aplicación; el layout carga el **shell** (menú lateral + área de contenido).
2. Ver el contenido del dashboard en el área principal.
3. Navegar a un módulo desde el menú lateral (rutas hijas del layout).

## Documentación relacionada

| Tipo | Enlace |
|------|--------|
| Menú y rutas base | [`../crear-menu-base.md`](../crear-menu-base.md) |
| Implementación UI | [`../implementacion-ui.md`](../implementacion-ui.md) |
| Contrato agente | [`../../AGENTS.md`](../../AGENTS.md) |

## Estado del contrato

**Contrato de producto específico del dashboard:** pendiente de ampliar si la página gana KPIs, widgets o reglas de negocio propias. Hoy la norma general es `AGENTS.md` + layout shell.

## Pruebas

- Snapshot de página completa en `tests/dashboard.spec.ts` (ruta `dashboard`).
