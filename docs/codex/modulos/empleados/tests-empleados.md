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
| `tests/empleados-borrador.spec.ts` | Borrador avanzado UI sin persistencia (testid `empleado-alta-avanzada-guardar`) |
| `tests/empleados-creacion-avanzada-validaciones.spec.ts` | Negativos UI: correo/teléfono, nombres dígitos, MsgBox finalizar/siguiente |
| `tests/empleados-wizard-stability.spec.ts` | Wizard avanzado (scroll / pasos) |
| `tests/dashboard.spec.ts` | Snapshots por ruta incl. `/empleados`; flujo «nueva ficha» wizard con 4 capturas |
| `tests/empleados-borrador-persistencia.spec.ts` | **Opt-in** serial F3/F6/F11 — proyecto `empleados-db` |
| `tests/empleados-creacion-avanzada-flujos.spec.ts` | F5 feliz / sin previsión — proyecto `empleados-db` |
| `tests/empleados-creacion-avanzada-honorarios.spec.ts` | F10 honorarios — proyecto `empleados-db` |
| `tests/empleados-creacion-avanzada-inferencia.spec.ts` | U2/U3/ERR listado — proyecto `empleados-db` |

Matriz F1–F13: [`matriz-pruebas-creacion-avanzada.md`](matriz-pruebas-creacion-avanzada.md).

**Gate creación avanzada (2026-05-25):** `npm run test:gate:empleados` (unit **220** + E2E vía `scripts/gate-empleados-e2e.mjs`: UI **17/17**, BD **15/15**, verify, nómina fixtures).

```bash
npm run test:gate:empleados
# Equivalente manual:
npm run test:gate:empleados:unit
npm run test:gate:empleados:e2e
```

PowerShell (sin script gate): `$env:E2E_EMPLEADOS_BORRADOR='1'; npm run test:e2e:empleados:db`; `$env:E2E_EMPLEADOS_NOMINA_FIXTURES='1'; npx playwright test tests/empleados-nomina-error-fixtures.spec.ts --project=empleados-nomina --workers=1`.

| Spec | Proyecto |
|------|----------|
| `tests/empleados-nomina-error-fixtures.spec.ts` | `empleados-nomina` (sin `globalSetup` global; limpia RUT `2405*`) |

`globalSetup` (solo proyecto `empleados-db` con flag): limpieza BD → U1–U8 → ERR append. Ver matriz.

## Brechas

- **Ficha `/empleados/:id`**: no hay `toHaveScreenshot` estable por dependencia de datos/Supabase; añadir spec con seed cuando exista id fijo.

## Assets

- Capturas opcionales de parámetros viven bajo `docs/codex/assets/` (ver `parametros-tabs.screenshots.spec.ts`); no duplicar aquí.

## Escenarios históricos migrados

Estos escenarios fueron migrados desde el documento raíz antiguo (`docs/codex/tests-empleados.md`) para evitar duplicación documental.

| ID | Descripción | Pasos | Resultado esperado |
|---|---|---|---|
| **EMP-01** | Creación de empleado con datos mínimos | 1. Ingresar un nuevo empleado con nombre, RUT válido, fecha de nacimiento, fecha de inicio y sueldo base igual al IMM vigente. 2. Asignar AFP y plan de salud vigentes. | El sistema crea el empleado y muestra un mensaje de éxito. El estado del empleado se marca como `activo` y se registra la fecha de ingreso. |
| **EMP-02** | Sueldo base inferior al IMM | 1. Intentar crear un empleado con sueldo base menor al IMM vigente. | El sistema bloquea la creación y muestra un mensaje indicando que el sueldo base no puede ser inferior al IMM. |
| **EMP-03** | Fecha de inicio sin parámetros vigentes | 1. Crear un empleado con fecha de inicio en un periodo para el cual no existen parámetros cargados. | El sistema rechaza la operación y solicita cargar primero los parámetros correspondientes. |
| **EMP-04** | Empleado menor de edad o mayor de 65 años | 1. Registrar un empleado menor de 18 años o mayor de 65 años con sueldo base. 2. Seleccionar la opción de IMM aplicable al tramo especial. | El sistema advierte al usuario sobre el tramo del IMM y valida que el sueldo base cumpla con el monto reducido. |
| **EMP-05** | Cambio de AFP con vigencia futura | 1. Editar un empleado activo y cambiar su AFP con vigencia desde una fecha futura. 2. Guardar el cambio. | El sistema crea un nuevo registro de AFP con `vigencia_inicio` indicada y mantiene la AFP actual hasta el día anterior. |
| **EMP-06** | Registro de cargas familiares | 1. Agregar cargas familiares a un empleado. 2. Validar número de cargas y documentación. | El sistema calcula la asignación familiar correspondiente e incorpora en nómina cuando corresponda. |
| **EMP-07** | Cambio de jornada laboral | 1. Modificar la jornada en fecha posterior al inicio del contrato. 2. Guardar. | El sistema valida el límite legal vigente (40, 42, 44 o 45 horas) y actualiza la información para periodos siguientes. |

### Fixture mínimo DOC-04

- periodo: `2026-04`
- sueldo_base: `539000`
- jornada: `42`
- edad: `30`
- afp: `Modelo`
- salud: `Fonasa`
- cargas: `1`

Este fixture es documental y debe validarse contra datos reales antes de automatizarlo.
