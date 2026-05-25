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
- `Finalizar honorarios` queda habilitado en el shell cuando la ficha cumple aplicabilidad; no exige nómina dependiente ni previsión AFP/salud.
- **Finalize (2026-05-25):** `mapEmpleadoFormToPayload` usa rama `HONORARIOS` con `resolveEmpleadoCatalogFallbacks` (`tipoPrevision: NINGUNA`, catálogos mínimos); **banco y número de cuenta obligatorios** al finalizar (sin cuenta ficticia por timestamp); borrador sigue tolerando placeholder; MsgBox «Finalizar boleta de honorarios»; radios con `formControlName`; validadores re-sincronizados al confirmar/cancelar honorarios (`form.valid` honesto).
- Tras finalizar honorarios, `apto_para_remuneraciones` permanece en `false` (mapper y `recalcularEstadoFicha`).
- `Guardar borrador` sigue disponible con validacion minima.

Fuera de alcance:
- Calcular retencion.
- Generar boletas, pagos, LRE, liquidaciones o nomina dependiente.

# Creacion avanzada: bloques del formulario (inventario)

**Referencia visual NOIA del sistema:** [`../../diseno/noia-bases-sistema-referencia.md`](../../diseno/noia-bases-sistema-referencia.md)  tokens `--bitacora-*`, layout `268px | 1fr`, clases `advanced-*` y `employee-*`. Copiar este módulo antes de inventar otro wizard.

---

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

### Contacto obligatorio

Correo y teléfono son obligatorios en identificación/contacto (formulario reactivo, guardar borrador, finalizar alta y guardado en repositorio). Formato: email válido y teléfono con al menos 8 dígitos.

### Estado de ficha (interno, no RRHH)

En creacion avanzada y edicion inline con `grillaAvanzada`, **no** se muestra el campo «Estado de ficha inicial» en el paso contrato (`contrato.html`). El `FormControl` `estado` conserva valor por defecto (`en_proceso`); el borrador fuerza `borrador` en el payload y la activacion/finalizacion aplican `buildPersonaBorradorAvanzadoInsert` / `buildPersonaActivacionUpdate` en el mapper de escritura.

Limpieza total de empleados en BD de desarrollo: `node scripts/limpiar-empleados-bd.mjs --dry-run` y `--confirm` (requiere `SUPABASE_DB_URL` + `psql`).

### EMP-ALTA-NORMATIVA-CL-01 — Matriz normativa y motor único

Contrato detallado: [`empleado-alta-normativa-cl.md`](./empleado-alta-normativa-cl.md).

- Las tres capas (obligatorio, aplicabilidad, coherencia) se unifican en UI mediante `evaluarAltaValidacionesVisibles` alimentado por `buildAltaValidacionInput` (`empleado-alta-validacion-input.ts`).
- La consola flotante es la **guía normativa** operativa; no se usa un panel pasivo «Revisión guiada» en Resumen.
- El formulario de horas semanales no debe contradecir el tope administrativo de 42 h (sin validador `max(168)` en dependiente).

### EMP-ALTA-REVISION-GUIADA-CONSOLA-01 — Consola accionable

Orden de bloques en `app-alta-bitacora-console`:

1. Pendientes del expediente (diagnóstico).
2. **Revisiones normativas** (coherencia + aplicabilidad en revisión): Revisar paso · Aplicar sugerencia · Mantener revisión.
3. Registros de la bitácora (wizard pendiente/error).
4. Pendientes para cierre.

Franja bajo el encabezado del paso (pasos 2, 3, 4, 5, 6, 8): una línea + «Abrir guía normativa» (expande la consola). Sin cards.

En Resumen final: mantener **Diagnóstico contractual**; lead que remite a la consola para revisiones normativas.

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
  - categoria base `tipo_trabajador` se deriva desde la relacion laboral: `CONTRATO` -> `DEPENDIENTE`, `HONORARIOS` -> `INDEPENDIENTE`;
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
5. Resumen final y consola conservan la revision pendiente (consola como canal principal desde EMP-ALTA-REVISION-GUIADA-CONSOLA-01).

## EMP-ALTA-COHERENCIA-GLOBAL-00 - Matriz de aplicabilidad y coherencia

La auditoría [`alta-coherencia-global-00.md`](./alta-coherencia-global-00.md) queda como contrato previo para las próximas mejoras de Creación avanzada.

Principios vigentes:

- `relacionLaboral` ordena el flujo completo: `CONTRATO` usa trabajador dependiente; `HONORARIOS` usa prestador independiente y finalización bloqueada.
- `tipo_trabajador` no es una condición especial: se deriva como `DEPENDIENTE` o `INDEPENDIENTE`.
- Las condiciones como pensionado, invalidez, técnico extranjero, discapacidad, exento de cotización y menor protegido se declaran en `Condiciones especiales`.
- Validación obligatoria, aplicabilidad y coherencia administrativa no son lo mismo.
- Las incoherencias relevantes deben avisar con `app-message-box` y permitir que RRHH aplique la corrección sugerida o mantenga bajo revisión.
- La siguiente implementación debe crear una matriz única que alimente templates, validaciones, mapa lateral, resumen final y limpieza de honorarios.


## EMP-ALTA-COHERENCIA-GLOBAL-01 - Implementación de matriz única

Creación avanzada ahora cuenta con una regla pura de aplicabilidad:

```txt
src/app/features/empleados/rules/empleado-alta-aplicabilidad.rules.ts
```

La regla no reemplaza las validaciones ni la coherencia administrativa. Ordena qué corresponde exigir, mostrar como derivado, tratar como opcional, marcar como no aplicable o mantener bajo revisión según `CONTRATO` / `HONORARIOS`, régimen previsional, APVI, condiciones especiales y edad laboral.

Uso visible:

- el wizard consume la matriz para estados `No aplica` y `Opcional`;
- el resumen final muestra `Matriz de aplicabilidad`;
- `Coherencia administrativa` queda como bloque separado para combinaciones que requieren decisión RRHH.

Restricciones mantenidas: sin SQL/RPC/RLS, sin motor, sin nómina, sin creación básica, sin ficha empleado y sin persistencia final de honorarios.


## EMP-ALTA-DIAGNOSTICO-CONTRACTUAL-UX-01 - Diagnóstico contractual visible

La matriz única de aplicabilidad no debe exponerse como una matriz técnica en el Resumen final.

Patrón vigente:

- la regla `empleado-alta-aplicabilidad.rules.ts` sigue definiendo estados internos;
- el usuario ve `Diagnóstico contractual`;
- el bloque muestra `Caso detectado` y tarjetas operativas;
- `Coherencia administrativa` queda separada para revisiones y decisiones RRHH;
- los bloques informativos/advertencia usan fondos suaves y bordes completos, sin `border-left` fuerte ni barras laterales de color.

Restricciones mantenidas: sin SQL/RPC/RLS, sin motor, sin nómina, sin creación básica, sin ficha empleado y sin persistencia final de honorarios.


## EMP-ALTA-MSGBOX-ERROR-UX-01 - Error de guardado estructurado

Los errores de guardado en alta avanzada deben usar el mismo lenguaje visual del éxito: modal con encabezado, panel de detalle y acción recomendada.

Patrón vigente:

- evitar mensajes planos debajo del título;
- separar `Qué revisar` de `Acción recomendada`;
- sugerir el paso de corrección cuando sea posible;
- mantener copy administrativo para RRHH;
- no mostrar stack técnico ni transformar reglas de aptitud en textos crudos.

Ejemplo: si el error indica `Sin previsión`, el modal debe orientar al paso `Previsión y salud` y explicar que AFP o IPS son necesarios para validar remuneraciones, salvo excepción respaldada.

## EMP-ALTA-VALIDACIONES-ASISTIDAS-01 - Validaciones visibles guiadas

La alta avanzada centraliza la salida visible en `empleado-alta-validaciones.rules.ts`. Esta capa no decide por sí sola qué aplica ni qué combinación es incoherente: traduce lo que ya entregan aplicabilidad, coherencia y validadores del formulario.

Reglas de UX:

- Los datos obligatorios pendientes se muestran mediante `app-message-box` al presionar `Siguiente` o `Finalizar`.
- Los campos fuera de flujo se muestran como `Campos no aplicables`, no como error.
- `tipo_trabajador` se muestra como `Definido por sistema`.
- Régimen `NINGUNA` se muestra como revisión administrativa en `Previsión y salud`, con copy explícito sobre `Sin previsión`.
- `app-message-box` se reserva para decisiones: aplicar corrección sugerida, mantener bajo revisión, volver al formulario o finalizar.
- Honorarios no muestra errores de contrato laboral, jornada, previsión dependiente, asignaciones ni APVI; permite borrador y mantiene finalización bloqueada por fase.

El Resumen final mantiene `Estado por etapa` como lectura consolidada. Los mensajes de paso se mantienen en MsgBox para no recargar ni duplicar información en el formulario.

## EMP-ADV-BITACORA-LABORAL-UX-01 - Patrón Bitácora Laboral

Creación avanzada adopta el patrón `Bitácora laboral` como identidad local del flujo:

- El alta se presenta como ficha en construcción con registros, decisiones y pendientes.
- El mapa lateral se agrupa por bloques funcionales, sin cambiar orden ni cantidad de pasos.
- Los estados visibles se traducen a lenguaje operativo RRHH.
- Los pasos cortos y estados no requeridos deben explicar decisión y siguiente acción, no quedar como alertas vacías.
- El resumen se presenta como `Acta de revisión de la ficha`, con datos principales, diagnóstico del expediente, revisión guiada y registros de bitácora.

Restricciones mantenidas: sin SQL/RPC/RLS, sin motor, sin nómina, sin creación básica, sin ficha empleado, sin persistencia final de honorarios y sin estilos globales protegidos.

Documento de fase: [`bitacora-laboral-ux-01.md`](./bitacora-laboral-ux-01.md).

## ERP-NOIA-BITACORA-OPERATIVA-00 - Relacion con identidad global

La Creacion avanzada es el primer caso local de la identidad global [`NOIA / Bitacora Operativa`](../../diseno/bitacora-operativa-noia.md).

- `Bitacora laboral` se mantiene como nombre de experiencia local.
- Cada paso debe sentirse como registro administrativo con estado, decision y cierre, no como wizard generico.
- Futuras mejoras deben respetar la narrativa: ficha en construccion, revision RRHH y acta final.
- Esta regla es documental y no cambia guardado, mappers, rutas, SQL, motor ni estilos globales.
## EMP-ADV-CSS-BUDGET-REDUCE-01 - Presupuesto CSS del componente

La alta avanzada conserva su estructura visual de `Bitacora laboral`, pero el CSS del componente se organiza por responsabilidad para no exceder `anyComponentStyle`.

Regla vigente:

- `form-empleado.css`: shell, modo basico, marco avanzado y exito/error base.
- `form-empleado.wizard.css`: navegacion de pasos, paneles de paso y resumen/checklist.
- `form-empleado.feedback.css`: acciones asistidas, honorarios, diagnostico contractual, coherencia y overrides Bitacora del cierre.

No mover estas reglas a estilos globales ni subir budgets para resolver regresiones futuras; primero compactar CSS local o separar por responsabilidad manteniendo encapsulacion Angular.

Documento de fase: [`emp-adv-css-budget-reduce-01.md`](./emp-adv-css-budget-reduce-01.md).
