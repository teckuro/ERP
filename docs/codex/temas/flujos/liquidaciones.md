# Flujo — Liquidaciones y detalle

## Rutas

- **`/liquidaciones`** — listado u operaciones de liquidaciones (`LiquidacionesPage`).
- **`/liquidaciones/:id`** — detalle (`DetalleLiquidacionPage`).

## Objetivo del usuario

Consultar o gestionar **liquidaciones** (listado y detalle). En visión de producto, resultado **generado y congelado**, no formulario manual principal del proceso.

## Recorrido típico

1. Listado: filtrar o abrir un registro.
2. Detalle: revisar líneas, totales o estados según implementación.

## Documentación relacionada

| Tipo | Enlace |
|------|--------|
| Contrato liquidaciones | **Pendiente** — `temas/liquidaciones-*.md`; no mezclar con ficha empleados. |
| Tablas | [`../../ui-tables.md`](../../ui-tables.md) |
| Orquestador — qué no construir aún | [`../../orquestador/contexto-proyecto.md`](../../orquestador/contexto-proyecto.md) §15 |

## Pruebas

- Snapshots de rutas en `tests/dashboard.spec.ts` si las rutas base están incluidas; detalle `/liquidaciones/:id` puede requerir datos — **E2E pendiente** si no hay id estable.
