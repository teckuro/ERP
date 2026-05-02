# Flujo de edicion de ficha de empleado

## Objetivo

Definir el flujo de edicion de la ficha de empleado en el ERP.

**Recorrido por rutas y enlaces al resto de empleados:** [`flujos/empleados.md`](./flujos/empleados.md). **Detalle técnico ficha y tests visuales:** [`ficha-empleado-funcionamiento-y-tests-visuales.md`](./ficha-empleado-funcionamiento-y-tests-visuales.md).

El patron principal es:

- navegacion por tabs;
- edicion inline por bloque;
- guardado independiente por seccion;
- sidebar reactivo con estado, faltantes e impacto operativo;
- recalculo de `estado_ficha`, `estado` y `apto_para_remuneraciones`.

Este documento complementa:

- [`ui-form-guidelines.md`](../ui-form-guidelines.md)
- [`modo-basico-empleado.md`](./modo-basico-empleado.md)

---

## Decision UX

La ficha de empleado NO debe usar modal como flujo principal de edicion.

Usar:

- tabs para navegar por areas de informacion;
- edicion inline dentro del bloque actual;
- guardado por bloque;
- estados visibles en tabs, header y sidebar;
- modales solo para acciones puntuales.

No usar:

- modal para editar una ficha completa;
- modal para formularios largos;
- wizard dentro de la ficha;
- cambio automatico de tab al guardar;
- botonera duplicada arriba y abajo sin necesidad.

---

## Estructura general

```text
HEADER
- breadcrumb
- nombre empleado
- estado operativo
- estado ficha
- progreso
- accion principal dinamica

TABS
- General
- Laboral
- Remuneracion
- Prevision y Salud
- Pago
- Documentos
- Historial

CONTENIDO
- bloques editables del tab activo

SIDEBAR
- estado de ficha
- faltantes
- impacto operativo
- acciones rapidas
```

---

## Conceptos de estado

Separar siempre los estados de negocio de los estados visuales de bloque.

### Estado de negocio

Estos campos vienen de la entidad principal y afectan procesos reales:

```ts
estado_ficha: 'BORRADOR' | 'INCOMPLETO' | 'VALIDO';
estado: 'BORRADOR' | 'EN_PROCESO' | 'ACTIVO' | 'SUSPENDIDO' | 'INACTIVO' | 'DESVINCULADO' | 'BLOQUEADO';
apto_para_remuneraciones: boolean;
```

Regla base:

- `estado_ficha = 'VALIDO'` solo si todos los bloques requeridos estan completos.
- `apto_para_remuneraciones = true` solo si la ficha tiene datos suficientes para liquidacion.
- `estado = 'ACTIVO'` requiere una ficha operativamente valida y fecha de activacion.

### Estado visual de bloque

Cada bloque/tab puede exponer un estado derivado:

```ts
type EstadoBloqueFicha = 'completo' | 'pendiente' | 'advertencia' | 'bloqueante';
```

Interpretacion:

- `completo`: datos suficientes y validos.
- `pendiente`: faltan datos, pero no bloquea procesos criticos todavia.
- `advertencia`: hay datos incompletos o dudosos que requieren revision.
- `bloqueante`: impide activar o liquidar.

No persistir estos estados como fuente principal si pueden derivarse desde datos reales.

---

## Flujo macro

### 1. Entrada a la ficha

Al abrir la ficha:

- cargar datos de persona y entidades relacionadas;
- calcular completitud;
- calcular estado de cada tab;
- mostrar informacion en modo lectura;
- mostrar faltantes e impacto operativo.

La ficha abre en `General`, salvo que venga una ruta o query param hacia un bloque puntual.

### 2. Seleccion de tab

El usuario puede cambiar entre tabs sin perder contexto.

Cada tab muestra:

- nombre;
- indicador visual de estado;
- etiqueta corta de estado (`Completo`, `Pendiente`, `Revisar`, `Bloqueante`).

### 3. Edicion inline

Al presionar `Editar seccion`:

- solo el bloque actual entra en modo edicion;
- el resto de la ficha permanece en lectura;
- tabs y sidebar siguen visibles;
- el usuario mantiene el contexto del dato que esta cambiando.

### 4. Guardado

Al presionar `Guardar cambios`:

1. validar el formulario del bloque;
2. mostrar errores por campo y resumen si aplica;
3. enviar solo el payload del bloque modificado;
4. refrescar los datos afectados;
5. recalcular estados y completitud;
6. volver el bloque a modo lectura.

### 5. Cancelacion

Al presionar `Cancelar`:

- descartar cambios locales;
- restaurar los valores originales;
- volver a modo lectura;
- no recalcular estado de negocio;
- no llamar backend.

---

## Reglas de edicion inline

- Permitir un solo bloque en edicion a la vez.
- No abrir modal para editar bloques completos.
- No cambiar de tab automaticamente.
- Mantener scroll natural.
- Mantener header, tabs y sidebar visibles.
- Validar en tiempo real cuando sea de bajo costo.
- Validar al guardar siempre.
- Deshabilitar `Guardar cambios` si no hay cambios o si el bloque esta guardando.
- Mostrar estado `Guardando...` en el bloque que se esta persistiendo.
- Evitar que una accion global active el empleado si existen bloqueantes.

---

## Cambios pendientes

Si el usuario intenta cambiar de tab, volver al listado o ejecutar otra accion con cambios sin guardar:

- si no hay cambios, permitir la accion;
- si hay cambios, pedir confirmacion;
- opciones esperadas:
  - `Guardar y continuar`
  - `Descartar cambios`
  - `Cancelar`

Esta confirmacion si puede ser modal, porque es una microaccion de proteccion.

---

## Layout de bloque

### Modo lectura

```text
Contrato                         [Editar seccion]
------------------------------------------------
Tipo contrato        Indefinido
Fecha inicio         01-04-2026
Fecha termino        No aplica
Seguro cesantia      Si
Estado               Completo
```

### Modo edicion

```text
Contrato                         [Guardando...]
------------------------------------------------
Tipo contrato        [select]
Fecha inicio         [date]
Fecha termino        [date]
Seguro cesantia      [checkbox]

[Guardar cambios] [Cancelar]
```

Reglas UI:

- labels siempre arriba del input si el formulario usa campos apilados;
- errores bajo el campo;
- resumen de errores arriba del bloque si hay varios errores;
- boton primario: `Guardar cambios`;
- boton secundario: `Cancelar`;
- iconos solo donde aporten lectura rapida.

---

## Tabs y bloques sugeridos

### General

Bloques:

- Datos personales
- Contacto
- Direccion

Bloquea remuneraciones si faltan:

- RUT valido;
- nombres;
- apellido principal.

### Laboral

Bloques:

- Contrato
- Cargo
- Jornada
- Centro de costo

Bloquea remuneraciones si faltan:

- tipo de contrato;
- fecha de inicio;
- cargo;
- jornada;
- estado de contrato vigente.

### Remuneracion

Bloques:

- Sueldo base
- Gratificacion
- Haberes fijos
- Configuracion de liquidacion

Bloquea remuneraciones si faltan:

- sueldo base valido;
- periodicidad;
- configuracion minima de liquidacion.

### Prevision y Salud

Bloques:

- AFP o regimen previsional
- Salud
- APV/APVI si aplica

Bloquea remuneraciones si faltan:

- regimen previsional;
- institucion de salud o regla aplicable;
- cotizacion de salud valida cuando corresponda.

### Pago

Bloques:

- Medio de pago
- Banco
- Cuenta

Bloquea remuneraciones si faltan:

- forma de pago;
- banco y cuenta cuando el pago sea transferencia.

### Documentos

Bloques:

- Contrato firmado
- Anexos
- Certificados

Normalmente no debe bloquear remuneraciones, salvo que exista una regla legal o interna que lo exija.

### Historial

Bloques:

- Cambios de estado
- Auditoria
- Eventos de remuneraciones

Este tab es de lectura. No usar edicion inline salvo para notas o eventos manuales.

---

## Sidebar

El sidebar debe actualizarse con cada guardado exitoso.

Debe mostrar:

- `estado_ficha`;
- `estado`;
- `apto_para_remuneraciones`;
- porcentaje de completitud;
- faltantes ordenados por criticidad;
- impacto operativo;
- acciones rapidas.

Ejemplos de impacto:

- `No se puede generar liquidacion: faltan datos de pago.`
- `No se puede activar: falta contrato vigente.`
- `Ficha valida: remuneraciones habilitadas.`

Ejemplos de acciones rapidas:

- `Ir a datos de pago`
- `Completar prevision`
- `Editar contrato`
- `Activar empleado`

---

## CTA dinamico

El boton principal de la ficha debe responder al siguiente bloqueo mas importante.

Orden recomendado:

1. Si falta contrato: `Completar contrato`
2. Si falta remuneracion: `Completar remuneracion`
3. Si falta prevision/salud: `Validar prevision`
4. Si falta pago: `Registrar datos de pago`
5. Si todo esta valido y no esta activo: `Activar empleado`
6. Si esta activo: `Editar seccion`

No mostrar `Activar empleado` si existen bloqueantes.

---

## Reglas de negocio al guardar

Cada guardado de bloque debe recalcular:

- estado del bloque;
- estado del tab;
- completitud global;
- `estado_ficha`;
- `apto_para_remuneraciones`;
- CTA principal;
- faltantes del sidebar;
- impacto operativo.

Regla de salida:

```ts
if (todosLosBloquesRequeridosCompletos) {
  estado_ficha = 'VALIDO';
  apto_para_remuneraciones = true;
} else {
  estado_ficha = 'INCOMPLETO';
  apto_para_remuneraciones = false;
}
```

La activacion (`estado = 'ACTIVO'`) debe ser una accion explicita y posterior, no un efecto lateral silencioso de editar un bloque.

---

## Activacion de empleado

La accion `Activar empleado` requiere:

- `estado_ficha = 'VALIDO'`;
- `apto_para_remuneraciones = true`;
- sin bloques `bloqueante`;
- fecha de activacion definida por backend o por accion confirmada;
- cumplimiento de restricciones de Supabase.

Si la ficha fue creada en modo basico:

- parte como `EN_PROCESO`;
- queda `INCOMPLETO`;
- no queda apta para remuneraciones;
- se completa desde esta ficha usando el flujo inline.

Si la ficha fue creada en modo avanzado:

- debe seguir la regla de persistencia en dos fases descrita en `ui-form-guidelines.md`;
- al final puede quedar `ACTIVO`, `VALIDO` y apta para remuneraciones.

---

## Uso limitado de modales

Permitido:

- confirmar activacion;
- confirmar descarte de cambios;
- confirmar eliminacion o anulacion;
- seleccionar desde catalogos complejos;
- subir o asociar documentos;
- ver detalle de auditoria.

No permitido:

- editar `General` completo en modal;
- editar `Laboral` completo en modal;
- editar `Remuneracion` completa en modal;
- editar `Prevision y Salud` completa en modal;
- editar `Pago` completo en modal.

---

## Estructura Angular sugerida

```text
ficha-empleado/
  containers/
    ficha-empleado-container/
      ficha-empleado-container.ts
      ficha-empleado-container.html
      ficha-empleado-container.css

  components/
    ficha-header/
    ficha-tabs/
    ficha-sidebar/
    ficha-bloque/
    bloques/
      bloque-general/
      bloque-laboral/
      bloque-remuneracion/
      bloque-prevision-salud/
      bloque-pago/
      bloque-documentos/
      bloque-historial/

  services/
    ficha-empleado-state.service.ts
    ficha-empleado-validation.service.ts
```

El container coordina carga, tab activo, bloque en edicion y guardado.

Los componentes de bloque reciben datos y emiten eventos. No deben decidir la activacion global del empleado.

---

## Contrato de componente de bloque

Cada bloque editable debe exponer:

```ts
interface FichaBloqueViewModel<TValue> {
  id: string;
  titulo: string;
  estado: EstadoBloqueFicha;
  readonly: boolean;
  value: TValue;
  faltantes: string[];
  advertencias: string[];
}

interface GuardarBloqueEvent<TValue> {
  bloqueId: string;
  value: TValue;
}
```

Eventos esperados:

- `editar`
- `guardar`
- `cancelar`
- `dirtyChange`
- `validityChange`

---

## Manejo de errores

Errores de validacion:

- mostrar en campo;
- mostrar resumen arriba del bloque si hay mas de un error;
- no salir de modo edicion.

Errores de backend:

- mantener los cambios en pantalla;
- mostrar mensaje contextual;
- permitir reintentar;
- no recalcular estado como si el guardado hubiera sido exitoso.

Errores de concurrencia:

- avisar que la ficha cambio en otra sesion;
- ofrecer recargar datos;
- evitar sobrescribir datos sin confirmacion.

---

## Checklist de implementacion

- [ ] Tabs muestran estado por seccion.
- [ ] Solo un bloque entra en edicion a la vez.
- [ ] Hay deteccion de cambios pendientes.
- [ ] Guardado envia solo el bloque modificado.
- [ ] Cancelar restaura valores originales.
- [ ] Sidebar se recalcula despues de guardar.
- [ ] CTA principal cambia segun el siguiente bloqueo.
- [ ] `estado_ficha` no se confunde con estado visual de bloque.
- [ ] `Activar empleado` esta bloqueado si la ficha no es valida.
- [ ] Modales se usan solo para microacciones.
- [ ] Historial queda como lectura/auditoria.

---

## Conclusion

El flujo definido queda asi:

```text
Tabs + bloques inline + guardado por seccion + sidebar reactivo + activacion explicita
```

Esta es la mejor opcion para una ficha ERP porque mantiene contexto, escala con formularios grandes, permite validaciones complejas y conecta la UI con reglas reales de negocio sin convertir la ficha en una cadena de modales.
