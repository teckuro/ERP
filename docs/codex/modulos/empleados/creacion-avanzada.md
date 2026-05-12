# Creacion avanzada: bloques del formulario (inventario)

El alta avanzada (`form-empleado`) organiza los pasos como **tabs internos** (`TAB_ORDER`): `datosPersonales`, `contrato`, `previsionSalud`, `bancario`. Los textos del stepper se muestran en `conceptualSteps` en [`form-empleado.ts`](../../../src/app/features/empleados/components/form-empleado/form-empleado.ts).

| Paso UI (conceptualSteps) | TabId (`TAB_ORDER`) | Componentes principales |
|---------------------------|---------------------|-------------------------|
| Identificacion y contacto | `datosPersonales` | `app-empleado-datos-personales`, `app-empleado-contacto` |
| Informacion laboral | `contrato` | Contrato/beneficios/remuneraciones segun el template del tab |
| Prevision y salud | `previsionSalud` | [`prevision-salud`](../../../src/app/features/empleados/components/secciones/prevision-salud/) |
| Pago y cierre | `bancario` | Bancario + cierre/resumen |

El **detalle por FormGroup** esta en [`empleados-form.service`](../../../src/app/features/empleados/services/) (agrupadores `datosPersonales`, `contacto`, `contrato`, etc.). Para lista exhaustiva por `formControlName`, generar desde el mismo servicio/modelo cuando haga falta auditoria campo a campo.

## EMP-ADV-VALIDATION-CL-02 - Validaciones chilenas accionadas

La creacion avanzada no debe mostrar una tarjeta fija de validaciones por paso. El flujo visual queda limpio:

- El **Mapa de ficha** resume estado, progreso, pendientes y pasos opcionales/no aplica.
- El contenido del paso muestra solo los campos y ayudas propias del paso.
- Las validaciones chilenas se evalúan internamente y se muestran mediante `app-message-box` cuando el usuario actua.

Comportamiento:

| Accion | Comportamiento |
|---|---|
| Guardar borrador | Validacion minima. Si falta identificacion base, MsgBox con pendientes. Si guarda, MsgBox de exito. |
| Siguiente | Flexible. Si hay pendientes/advertencias, MsgBox con `Corregir ahora` o `Continuar`. |
| Finalizar alta | Estricto. MsgBox con datos obligatorios pendientes y advertencias de revisión. `Ir al primer pendiente` navega y enfoca el campo pendiente. |

Regla UX: no duplicar la informacion del mapa con tarjetas permanentes dentro del paso.

### Copy administrativo de MsgBox

- Los mensajes deben sonar administrativos y orientados a RRHH.
- Evitar lenguaje técnico como `bloqueo` en botones o títulos visibles.
- Usar `datos obligatorios pendientes`, `advertencias de revisión` e `información útil`.
- No usar punto y coma en textos visibles. Separar ideas en frases cortas.
- Los listados del MsgBox deben usar guion visual o viñeta y cerrar cada idea con punto final.
