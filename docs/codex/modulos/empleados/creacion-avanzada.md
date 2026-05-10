# Creacion avanzada: bloques del formulario (inventario)

El alta avanzada (`form-empleado`) organiza los pasos como **tabs internos** (`TAB_ORDER`): `datosPersonales`, `contrato`, `previsionSalud`, `bancario`. Los textos del stepper se muestran en `conceptualSteps` en [`form-empleado.ts`](../../../../src/app/features/empleados/components/form-empleado/form-empleado.ts).

| Paso UI (conceptualSteps) | TabId (`TAB_ORDER`) | Componentes principales |
|---------------------------|---------------------|-------------------------|
| Identificacion y contacto | `datosPersonales` | `app-empleado-datos-personales`, `app-empleado-contacto` |
| Informacion laboral | `contrato` | Contrato/beneficios/remuneraciones segun el template del tab |
| Prevision y salud | `previsionSalud` | [`prevision-salud`](../../../../src/app/features/empleados/components/secciones/prevision-salud/) |
| Pago y cierre | `bancario` | Bancario + cierre/resumen |

El **detalle por FormGroup** esta en [`empleados-form.service`](../../../../src/app/features/empleados/services/) (agrupadores `datosPersonales`, `contacto`, `contrato`, etc.). Para lista exhaustiva por `formControlName`, generar desde el mismo servicio/modelo cuando haga falta auditoria campo a campo.

## Regla EMP-ADV-FICHA-01

- La jornada semanal no se autocompleta con `45`; el usuario debe ingresarla explicitamente.
- `Sin prevision` puede guardarse como borrador o ficha en proceso, pero no permite finalizar el alta avanzada como lista para operar.
- Para finalizar alta avanzada con aptitud real se requiere AFP o IPS con salud completa, sueldo/moneda, contrato, jornada y pago validos.
- El E2E de finalizar alta desde borrador debe crear trabajadores aptos con AFP + salud y jornada segura, no trabajadores sin prevision.
