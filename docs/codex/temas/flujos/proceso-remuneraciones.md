# Flujo — Proceso de remuneraciones

## Ruta

- **Oficial:** **`/remuneraciones/proceso-mensual`** — `ProcesoRemuneracionesPage` (`src/app/pages/proceso-remuneraciones.page.ts`), hija de `RemuneracionesOutletComponent`.
- **Compatibilidad temporal:** **`/proceso-remuneraciones`** — `redirectTo` -> `/remuneraciones/proceso-mensual` (`pathMatch: 'full'` en `src/app/app.routes.ts`).

## Objetivo del usuario

Pantalla de **proceso mensual**: prevalidaciones por periodo (`9.5A`); motor y liquidaciones siguen **futuros** en codigo.

## Recorrido típico

1. Acceder desde el menú.
2. Elegir periodo `YYYY-MM` y pulsar **Validar periodo**.
3. Revisar bloqueos, advertencias y areas; avanzar pasos solo como guia (calculo/export/cierre aun no productivos).

## Documentación relacionada

| Tipo | Enlace |
|------|--------|
| Contrato modulo Nomina mensual | [`../../modulos/nomina-mensual/contrato-general.md`](../../modulos/nomina-mensual/contrato-general.md), [`../../modulos/nomina-mensual/prevalidaciones/prevalidaciones-9-5A.md`](../../modulos/nomina-mensual/prevalidaciones/prevalidaciones-9-5A.md), [`../../modulos/nomina-mensual/prevalidaciones/prevalidaciones-9-5B.md`](../../modulos/nomina-mensual/prevalidaciones/prevalidaciones-9-5B.md) |
| Auditoria demo vs parametros (PARAM-CHILE-01) | [`../../auditorias/param-chile-01-parametros-y-demo-proceso.md`](../../auditorias/param-chile-01-parametros-y-demo-proceso.md) |
| Orquestador — camino oficial | [`../../orquestador/contexto-proyecto.md`](../../orquestador/contexto-proyecto.md) §12 |
| UI general | [`../../AGENTS.md`](../../AGENTS.md) |

## Pruebas

- Snapshot: `tests/dashboard.spec.ts` (`proceso-remuneraciones`).
