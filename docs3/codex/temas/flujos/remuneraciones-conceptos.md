# Flujo - Remuneraciones (outlet dominio)

## Rutas

| Ruta | Comportamiento |
|------|----------------|
| `/remuneraciones` | Redirige a `conceptos` (`src/app/app.routes.ts`). |
| `/remuneraciones/conceptos` | `ConceptosRemuneracionPage` → `ConceptosRemuneracionContainer` (`src/app/pages/conceptos-remuneracion.page.ts`). Implementación del contenedor: `src/app/features/haberes-descuentos/containers/conceptos-remuneracion-container/`. |
| `/remuneraciones/haberes-descuentos` | `HaberesDescuentosPage` → contenedor de asignaciones recurrentes. |
| `/remuneraciones/proceso-mensual` | `ProcesoRemuneracionesPage` (placeholder de proceso mensual). |
| `/remuneraciones/liquidaciones` | `LiquidacionesPage`. |
| `/remuneraciones/liquidaciones/:id` | `DetalleLiquidacionPage`. |

Rutas antiguas en raíz (`/haberes-descuentos`, `/proceso-remuneraciones`, `/liquidaciones`, `/liquidaciones/:id`) quedan como **redirects temporales** a las rutas anteriores; ver `src/app/app.routes.ts` y [`estado-fases.md`](../../orquestador/estado-fases.md) (Fase 9.3B.1).

## Objetivo del usuario

Gestionar el **catálogo maestro de conceptos** (`concepto`): altas, ediciones y bajas permitidas, con mapeo opcional al **Libro de Remuneraciones Electrónico** (`catalogo_lre`), sin confundir el catálogo con **asignaciones por trabajador** (eso es `/remuneraciones/haberes-descuentos`).

## Recorrido típico

1. Menú → **Remuneraciones** (o URL directa `/remuneraciones/conceptos`).
2. Revisar la grilla **Conceptos** (filtros: buscar, tipo, estado vigente).
3. **Nuevo concepto** o **Editar** / **Eliminar** según permisos y reglas de protección (`es_sistema`, `calculo_automatico`).
4. En el modal: identificación → clasificación → **catálogo LRE** (búsqueda) → vigencia y flags de liquidación / imposición.

## Reglas rápidas (resumen)

- Código interno **único** e **inmutable** tras crear.
- Conceptos **sistema** o **generados por liquidación** (`calculo_automatico`): bloqueados para edición/eliminación con el perfil actual (flag admin en código; ver contrato).
- **Eliminar:** solo si no hay uso en liquidaciones ni asignaciones a personas.

## Documentación relacionada (módulo)

| Tipo | Enlace |
|------|--------|
| Punto de entrada | [`../../modulos/conceptos-remuneracion/README.md`](../../modulos/conceptos-remuneracion/README.md) |
| Diagnóstico Fase 9 | [`../../modulos/conceptos-remuneracion/diagnostico-fase-9.md`](../../modulos/conceptos-remuneracion/diagnostico-fase-9.md) |
| Contrato funcional | [`../../modulos/conceptos-remuneracion/contrato-funcional.md`](../../modulos/conceptos-remuneracion/contrato-funcional.md) |
| Contrato general (índice) | [`../../modulos/conceptos-remuneracion/contrato-general.md`](../../modulos/conceptos-remuneracion/contrato-general.md) |
| Asignaciones recurrentes (otro flujo) | [`../../modulos/haberes-descuentos/README.md`](../../modulos/haberes-descuentos/README.md) |
| Tablas / listados | [`../../ui-tables.md`](../../ui-tables.md) |
| Formularios / modal | [`../../ui-form-guidelines.md`](../../ui-form-guidelines.md) |
| Orquestador | [`../../orquestador/estado-fases.md`](../../orquestador/estado-fases.md) (fila Fase 9), [`../../orquestador/contexto-proyecto.md`](../../orquestador/contexto-proyecto.md) §10 |

## Pruebas

- **Pendiente:** añadir `/remuneraciones/conceptos` al array `routes` de `tests/dashboard.spec.ts` cuando el entorno de captura lo permita (ver diagnóstico §7).
- Unitarios: validaciones de payload y servicio según [`contrato-funcional.md`](../../modulos/conceptos-remuneracion/contrato-funcional.md) §8.
