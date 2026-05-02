# Creacion avanzada: bloques del formulario (inventario)

El alta avanzada (`form-empleado`) organiza los pasos como **tabs internos** (`TAB_ORDER`): `datosPersonales`, `contrato`, `previsionSalud`, `bancario`. Los textos del stepper se muestran en `conceptualSteps` en [`form-empleado.ts`](../../../src/app/features/empleados/components/form-empleado/form-empleado.ts).

| Paso UI (conceptualSteps) | TabId (`TAB_ORDER`) | Componentes principales |
|---------------------------|---------------------|-------------------------|
| Identificacion y contacto | `datosPersonales` | `app-empleado-datos-personales`, `app-empleado-contacto` |
| Informacion laboral | `contrato` | Contrato/beneficios/remuneraciones segun el template del tab |
| Prevision y salud | `previsionSalud` | [`prevision-salud`](../../../src/app/features/empleados/components/secciones/prevision-salud/) |
| Pago y cierre | `bancario` | Bancario + cierre/resumen |

El **detalle por FormGroup** esta en [`empleados-form.service`](../../../src/app/features/empleados/services/) (agrupadores `datosPersonales`, `contacto`, `contrato`, etc.). Para lista exhaustiva por `formControlName`, generar desde el mismo servicio/modelo cuando haga falta auditoria campo a campo.
