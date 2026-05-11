# Tests — módulo Empleados

## Unitarios (Vitest / `ng test`)

| Área | Archivos típicos |
|------|------------------|
| Helper completitud / aptitud | `empleado-completitud.rules.ts` (+ `.spec.ts`) |
| Ficha | `ficha-empleado-container.spec.ts` (CTA, validar, bloqueos) |
| Borrador / hidratación | `empleado-borrador-hidratacion.spec.ts`, reglas borrador |
| Formulario / orquestador selects | `empleados-form-orchestrator.selects.spec.ts`, `form-empleado` según repo |
| Servicio | `empleados.service.spec.ts` (delegación `validarFichaParaRemuneraciones`) |

```bash
npx ng test --watch=false
```

## Playwright (E2E / UI)

| Spec | Qué cubre |
|------|-----------|
| `tests/empleados-basic-create.spec.ts` | Alta básica UI + snapshot `.basic-create-page` |
| `tests/empleados-borrador.spec.ts` | Borrador avanzado UI sin persistencia |
| `tests/empleados-wizard-stability.spec.ts` | Wizard avanzado (scroll / pasos) |
| `tests/dashboard.spec.ts` | Snapshots por ruta incl. `/empleados`; flujo «nueva ficha» wizard con 4 capturas |
| `tests/empleados-borrador-persistencia.spec.ts` | **Opt-in** (`E2E_EMPLEADOS_BORRADOR` + env); no activar en CI sin datos |

```bash
npx playwright test tests/empleados-basic-create.spec.ts tests/empleados-borrador.spec.ts tests/empleados-wizard-stability.spec.ts --workers=1
```

## Brechas

- **Ficha `/empleados/:id`**: no hay `toHaveScreenshot` estable por dependencia de datos/Supabase; añadir spec con seed cuando exista id fijo.

## Assets

- Capturas opcionales de parámetros viven bajo `docs/codex/assets/` (ver `parametros-tabs.screenshots.spec.ts`); no duplicar aquí.
