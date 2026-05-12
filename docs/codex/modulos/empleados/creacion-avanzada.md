## EMP-PERFIL-LABORAL-SQL-01 - Base previa a UI de perfil laboral

Antes de agregar HTML para pensionado, menor de 18, mayor de 65 u otras condiciones, la base debe usar el modelo SQL de condiciones especiales:

- `tipo_trabajador` no debe ampliarse como select gigante. Sigue siendo categoria base.
- Las condiciones persistidas viven en `persona_condicion_trabajador`.
- Menor de 18 y mayor de 65 se muestran como perfil derivado desde fecha de nacimiento y periodo, no como checkbox manual.
- La UI futura debe consumir `fn_obtener_perfil_laboral_persona` y guardar solo condiciones reales que requieran respaldo o decision RRHH.
- Esta fase no modifica el wizard, HTML, CSS ni TypeScript.

## EMP-ADV-LAYOUT-CONSISTENCY-01 - Pulido de layout avanzado

Sobre la base con `EMP-ADV-HONORARIOS-UX-01`, Creacion avanzada debe mantener el mismo flujo y solo mejora la presentacion local:

- El wizard puede usar mas ancho horizontal, pero el mapa lateral no debe competir con el formulario.
- La navegacion, pasos, validaciones y acciones se mantienen intactas.
- Los pasos cortos no deben forzar alturas grandes solo para igualar el resumen final.
- El resumen final debe ser compacto y revisable.
- Contrato y Bancario pueden ajustar grillas/gaps/paddings solo mediante clases de modo avanzado.
- No tocar estilos globales, SQL/RPC/RLS/BD, mappers, payloads, creacion basica, ficha empleado ni remuneraciones.

## EMP-ADV-HONORARIOS-UX-01 - Boleta de honorarios

La opcion `Boleta de honorarios` ya no debe comportarse como contrato laboral dependiente.

Reglas de UX implementadas:

- Al cambiar desde `Contrato` a `Boleta de honorarios`, se pide confirmacion con `app-message-box`.
- El cambio oculta o marca no aplicables los datos de jornada, gratificacion, prevision/salud dependiente, APVI y asignaciones laborales.
- El monto se comunica como `Monto bruto de honorarios`.
- Bancario se comunica como `Datos para pago del prestador`.
- El resumen final avisa que el registro no ingresa a nomina dependiente.
- `Finalizar alta` queda bloqueado para honorarios hasta implementar persistencia real.
- `Guardar borrador` sigue disponible con validacion minima.

Fuera de alcance:

- Persistir honorarios como entidad final.
- Calcular retencion.
- Generar boletas, pagos, LRE, liquidaciones o nomina dependiente.

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
