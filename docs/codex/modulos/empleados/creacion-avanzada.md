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


## EMP-PERFIL-LABORAL-UI-01 - Perfil laboral en paso propio

- El flujo presenta `Condiciones especiales` como paso propio despues de Banco y antes de Resumen final. El paso 4 queda reservado para asignaciones laborales: cargas familiares, zona extrema y semana corrida.
- La edad laboral se calcula en UI desde `datosPersonales.fechaNacimiento` y `contrato.fechaIngreso` para orientar a RRHH antes de guardar. La verdad canonica por periodo sigue siendo `fn_obtener_perfil_laboral_persona` en ficha/nomina futura.
- Menor de 18, adulto y mayor de 65 no se capturan manualmente. Se muestran como perfil detectado.
- Las condiciones especiales que si se pueden capturar son las persistibles en `persona_condicion_trabajador`: pensionado, invalidez parcial/total, exento cotizacion pension, trabajador adolescente protegido, autorizacion de menor, tecnico extranjero exento y discapacidad.
- Cada conjunto seleccionado usa vigencia de inicio, vigencia fin opcional, respaldo administrativo registrado y observacion interna. No se adjuntan archivos en esta fase.
- El resumen final muestra el perfil laboral detectado y las condiciones declaradas.
- Honorarios mantiene el comportamiento aprobado: no aplica este bloque y no se habilita finalizacion como trabajador dependiente.



### Pulido EMP-PERFIL-LABORAL-UI-01-POLISH

- `Condiciones especiales` no debe quedar mezclado con asignaciones laborales ni sentirse como formulario obligatorio para todos.
- La etapa se ubica despues de completar datos principales, prevision, APVI si aplica y banco, antes de Resumen final.
- La maqueta debe reutilizar el patron de bloques de los otros pasos: cabecera neutra, borde 8px, padding compacto y sin sombras decorativas.
- `Vigencia y respaldo` se muestra solo si existe al menos una condicion especial seleccionada.
- El resumen final solo resume; no debe duplicar el formulario completo.

### Pulido EMP-CONDICIONES-ESPECIALES-UX-01

- El nombre visible del paso es `Condiciones especiales` para que RRHH lo interprete como control administrativo de casos excepcionales.
- La primera tarjeta se llama `Revision administrativa`: muestra edad/categoria base como dato detectado y no como campo editable.
- Para un trabajador adulto sin casos especiales, el estado debe indicar `Trabajador estandar` y permitir continuar sin seleccionar nada.
- La seleccion de pensionado, exencion, menor protegido, tecnico extranjero o discapacidad se comunica como `Solo si aplica`.
- `Vigencia y respaldo` se mantiene bajo demanda al seleccionar condiciones.
- El resumen final muestra `Revision administrativa` y `Condiciones especiales` como lectura de control, no como duplicado del formulario.

### Pulido EMP-CONDICIONES-ESPECIALES-AUTODETECT-01

- El paso `Condiciones especiales` no debe obligar a RRHH a volver a marcar informacion que ya existe en los pasos anteriores.
- Se pre-marcan condiciones cuando el origen es claro:
  - menor de 18 anos desde fecha de nacimiento + fecha de ingreso -> `Trabajador adolescente protegido`;
  - tipo trabajador con texto pensionado/invalidez/exento/tecnico extranjero/discapacidad -> condicion equivalente;
  - regimen previsional `NINGUNA` -> `Exento de cotizacion de pension` para revision administrativa.
- Las condiciones pre-marcadas se muestran con chip `Detectada` y bloque de resumen `pre-marcado desde pasos anteriores`.
- RRHH mantiene control final: puede revisar, corregir, marcar respaldo y completar observacion/vigencia.

## EMP-ALTA-REGLAS-COHERENCIA-01 - Validaciones asistidas con decision RRHH

La alta avanzada incorpora una capa de coherencia administrativa para no permitir que combinaciones laborales/previsionales pasen en silencio.

Principios:

- El sistema avisa y recomienda; no cambia datos automaticamente sin decision del usuario.
- RRHH puede aplicar la correccion sugerida o mantener la situacion bajo revision administrativa.
- Las revisiones mantenidas quedan visibles en el Resumen final.
- Esta capa no calcula cotizaciones ni reemplaza al motor de nomina.

Casos iniciales:

- Seguro de Cesantia:
  - Contrato indefinido: aplica, distribucion trabajador + empleador.
  - Plazo fijo u obra/servicio: aplica, aporte de cargo del empleador.
  - Menor de 18: revisar/no aplica.
  - Pensionado: revisar, salvo invalidez parcial.
  - Tecnico extranjero exento: la exencion previsional no apaga por si sola el Seguro de Cesantia.
- Jornada:
  - Jornada ordinaria vigente: maximo administrativo 42 horas semanales.
  - Jornada parcial o menor de 18: maximo administrativo 30 horas semanales.
- Prevision:
  - Regimen `NINGUNA` exige condicion especial y respaldo administrativo.
- Condiciones especiales:
  - Menor de 18 sin trabajador adolescente protegido/autorizacion genera decision asistida.

Patron de uso:

1. Aviso inline en el paso actual.
2. MsgBox al avanzar o finalizar cuando hay una decision corregible.
3. Boton primario aplica la recomendacion.
4. Boton secundario mantiene bajo revision y permite continuar.
5. Resumen final conserva la revision pendiente.
