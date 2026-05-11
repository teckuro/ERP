# Tests — módulo Parámetros

## Playwright / capturas

| Spec / script | Qué cubre |
|----------------|-----------|
| `tests/parametros-tabs.screenshots.spec.ts` | PNG por pestaña/subtab del módulo (generación de assets bajo `docs/codex/assets/parametros-tabs/`) |
| `tests/dashboard.spec.ts` | Snapshot de listado de rutas incluye entrada `parametros` |

Ejemplo:

```bash
npx playwright test tests/parametros-tabs.screenshots.spec.ts --workers=1
```

## Unitarios

Lógica de `ParametrosPage`, servicios y repositorios según cambios en `src/app/features/parametros-generales` y `src/app/pages/parametros.page.ts` — ejecutar `npx ng test --watch=false` filtrando suites tocadas.

## Assets vigentes

Las capturas referenciadas por la spec de tabs viven bajo **`docs/codex/assets/parametros-tabs/`** (crear o actualizar al regenerar imágenes; no commitear basura fuera de esa convención sin acuerdo).

## Brechas

- No hay E2E completo de edición/guardado de cada catálogo si depende de RLS y datos reales; usar entorno de desarrollo y checklist manual cuando el contrato lo exija.
