# Flujos de la aplicación (índice)

Documentación **por módulo de pantalla**: rutas reales, recorrido del usuario y enlaces a contratos en **`docs/codex/modulos/`** (y transversales en `temas/` cuando aplique).

Convención de organización: [`../organizacion-por-modulo-y-flujos.md`](../organizacion-por-modulo-y-flujos.md).

## Tabla rápida

| Módulo | Rutas principales | Documento de flujo |
|--------|-------------------|----------------------|
| Shell / inicio | `/` | [`dashboard.md`](./dashboard.md) |
| Empleados | `/empleados`, `/empleados/nuevo`, `/empleados/:id` | [`empleados.md`](./empleados.md) |
| Parámetros | `/parametros` | [`parametros.md`](./parametros.md) |
| Remuneraciones - conceptos | `/remuneraciones`, `/remuneraciones/conceptos` | [`remuneraciones-conceptos.md`](./remuneraciones-conceptos.md) |
| Haberes y descuentos | `/remuneraciones/haberes-descuentos` (redirect desde `/haberes-descuentos`) | [`haberes-descuentos.md`](./haberes-descuentos.md) |
| Proceso mensual | `/remuneraciones/proceso-mensual` (redirect desde `/proceso-remuneraciones`) | [`proceso-remuneraciones.md`](./proceso-remuneraciones.md) |
| Liquidaciones | `/remuneraciones/liquidaciones`, `/remuneraciones/liquidaciones/:id` (redirects desde `/liquidaciones`) | [`liquidaciones.md`](./liquidaciones.md) |
| Licencias médicas | `/licencias-medicas` | [`licencias-medicas.md`](./licencias-medicas.md) |
| Reportes | `/reportes` | [`reportes.md`](./reportes.md) |

**Rutas Angular:** `src/app/app.routes.ts` + `src/app/features/empleados/empleados.routes.ts`.
