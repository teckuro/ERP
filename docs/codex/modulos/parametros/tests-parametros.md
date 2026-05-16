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

## Escenarios históricos migrados

Estos escenarios fueron migrados desde el documento raíz antiguo (`docs/codex/tests-parametros.md`) para evitar duplicación documental.

| ID | Descripción | Pasos | Resultado esperado |
|---|---|---|---|
| **PAR-01** | Carga de parámetros mensuales desde PreviRed | 1. Ejecutar el script de carga para un periodo (p. ej. abril 2026). 2. Verificar registros en tablas (`parametros_generales`, `afp_vigencia`, `afc_parametro`, etc.). | Parámetros cargados con `vigencia_inicio` y `vigencia_fin` correctos; valores visibles en UI. |
| **PAR-02** | Detección de parámetros duplicados | 1. Cargar manualmente un parámetro con la misma vigencia y valor existente. | El sistema impide el registro duplicado y muestra error. |
| **PAR-03** | Cambio de valor con nueva vigencia | 1. Editar un parámetro y establecer nueva `vigencia_inicio`. | Se cierra la vigencia anterior y se crea línea con valor actualizado. |
| **PAR-04** | Validación de vigencias inconsistentes | 1. Crear parámetro con `vigencia_fin` anterior a `vigencia_inicio`. | La UI impide el guardado con mensaje claro. |
| **PAR-05** | Eliminación de parámetros históricos | 1. Intentar eliminar un registro usado en cálculos de nómina. | El sistema impide eliminación física y sugiere marcar inactivo. |
| **PAR-06** | Carga masiva con formato incorrecto | 1. Subir archivo con columnas o separador incorrecto. | El sistema rechaza la carga con log de errores explicativo. |

### Fixture mínimo DOC-04

- periodo: `2026-04`
- IMM 18-65: `539000`
- Asignación familiar tramo 1: `22007`
- Jornada máxima desde `2026-04-26`: `42`
- Ley 16.744 básica: `0.90`
- SIS: pendiente / según fuente oficial mensual

La tasa SIS no se fija como constante; debe confirmarse por periodo antes de validar nómina.
