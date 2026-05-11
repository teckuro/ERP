# UI Form Guidelines

Guia canonica para formularios del ERP. Complementa [`AGENTS.md`](./AGENTS.md), [`estilos/README.md`](./estilos/README.md), [`ui-button-guidelines.md`](./ui-button-guidelines.md) y [`ui-tables.md`](./ui-tables.md).

## Objetivo

Definir patrones consistentes para formularios de captura, revision y mantenedores. El formulario debe ser claro, compacto y estable, sin ocultar errores ni mezclar responsabilidades funcionales.

## Definiciones

| Concepto | Definicion | Uso esperado |
|---|---|---|
| Formulario | Conjunto de campos que captura o edita datos de una entidad o hecho operativo. | Alta de empleado, novedad mensual, concepto, parametro cliente. |
| Formulario de creacion | Captura inicial de un registro nuevo. | Debe priorizar pocos campos, orden natural y accion primaria clara. |
| Formulario de edicion | Modificacion de un registro existente. | Debe mostrar estado actual, restricciones y campos editables. |
| Formulario de revision | Pantalla para validar, aprobar, rechazar o corregir. | Debe mostrar contexto, estado y acciones por estado. |
| Shell de pagina | Marco que contiene header, acciones y contenido principal. | Debe dar estabilidad de altura/ancho; no contiene reglas de negocio. |
| Bloque protagonista | Card o panel donde ocurre la tarea principal. | Debe ser unico salvo flujos complejos justificados. |
| Resumen compacto | Bloque breve con estado, alcance o pendientes reales. | Opcional; se usa solo si ayuda a decidir o continuar. |
| Seccion | Agrupacion logica de campos dentro del formulario. | Identificacion, Movimiento, Contexto, Contrato, etc. |
| Campo | Unidad compuesta por label, control, ayuda y error. | Debe tener label visible y error cercano. |
| Control | Input, select, textarea, search-select, switch o calendario. | Debe respetar altura y ancho del sistema. |
| Footer de formulario | Zona estable para acciones de la captura. | Orden `[Secundario] [Primario]`. |
| Toolbar de pagina | Acciones que afectan la pantalla o listado completo. | Crear, refrescar, limpiar filtros, exportar. |
| Estado visual | Badge, chip o mensaje que comunica situacion. | No debe depender solo del color. |
| Densidad | Relacion entre cantidad de informacion, espaciado y tamanos. | Debe ser compacta sin perder legibilidad. |

## Regla madre

Un formulario debe responder antes de implementarse:

- que dato se captura;
- quien lo captura;
- en que momento del flujo;
- que campos son obligatorios;
- que campos son solo contexto;
- que accion principal deja el dato listo;
- que reglas viven en UI y cuales viven en rules/service;
- que no debe prometer esta pantalla.

## Principios

- El formulario es el bloque protagonista: debe ser claro, breve y ordenado.
- Usar labels visibles encima de los inputs; no usar placeholders como labels.
- Preferir una columna; usar dos columnas solo cuando mejore la lectura.
- Agrupar campos por secuencia natural del usuario.
- Separar secciones con bordes suaves, no con cards anidadas.
- Mantener acciones en un footer estable.
- No duplicar titulos entre card, seccion y campo.

## Referencia base: Empleados

Para nuevas pantallas de creacion o captura, usar **Empleados** como referencia funcional y visual.

Fuente de referencia:

- `src/app/features/empleados/components/form-empleado/form-empleado.html`;
- `src/app/features/empleados/components/form-empleado/form-empleado.css`;
- `src/app/features/empleados/components/secciones/datos-personales/datos-personales.css`;
- `docs/codex/modulos/empleados/creacion-basica.md`.

Que se debe heredar como criterio:

- shell unico de pagina con header, acciones y bloque protagonista;
- card o panel principal sin anidar cards innecesarias;
- resumen compacto solo si aporta contexto de negocio;
- grillas de captura de maximo 4 columnas en desktop;
- tablet a 2 columnas y mobile a 1 columna;
- clases de layout por bloque/capa, no selectores genericos;
- acciones estables, sin duplicar botoneras;
- copy breve orientado a la tarea.

Que no se debe hacer:

- copiar clases `employee-*` en otro feature sin necesidad;
- usar el wizard de empleados para formularios simples;
- forzar todas las creaciones a tener resumen si no agrega valor;
- mezclar reglas de negocio del modulo Empleados con otros modulos.

## Tokens de densidad

| Token | Valor | Uso |
|---|---:|---|
| Input compacto ERP | `22px` | Alta avanzada de Empleados y grillas de captura densas. Referencia: `--erp-control-height`. |
| Checkbox compacto | `22px` min | Booleanos dentro de grillas densas. |
| Input normal | `34px` a `38px` | Formularios simples, filtros y componentes no densos. |
| Search-select / calendario | `34px` a `40px` | Selectores con busqueda, fechas o componentes compartidos con interaccion propia. |
| Textarea compacto | `72px` a `96px` | Observaciones breves. No estirar para llenar pantalla. |
| Boton de fila | `24px` a `32px` | Acciones compactas en tablas, mapas o pasos. |
| Boton secundario de formulario | `34px` a `38px` | Cancelar, volver, guardar borrador. |
| Boton principal | `36px` a `40px` | Accion primaria de formulario o pagina. |
| Separacion chica | `4px` | Label-error, icono-texto, chips. |
| Separacion base | `8px` | Campos relacionados, chips, acciones compactas. |
| Separacion media | `12px` | Secciones compactas, cards pequeñas. |
| Separacion amplia | `16px` | Padding de panel y gaps principales. |
| Separacion de bloque | `24px` | Separacion entre grupos mayores. |
| Separacion excepcional | `32px` | Solo cuando el flujo necesita aire visual real. |
| Radio control | `6px` a `8px` | Inputs, botones, chips rectangulares. |
| Radio card | `8px` | Cards y paneles del ERP. |
| Borde | `1px` | Separadores y contenedores. |

Regla importante:

- No subir todos los inputs a `38px` o `42px`. El patron base de **creacion avanzada de Empleados** usa controles de `22px` para mantener densidad y escaneo rapido.
- Usar `38px` a `42px` solo en controles de mayor interaccion o pantallas menos densas.
- Si un formulario tiene muchos campos, preferir controles compactos y buena grilla antes que inputs altos.
- Si un campo requiere busqueda, calendario o lista compleja, puede usar mayor altura que los inputs nativos compactos.

Colores base:

| Uso | Color |
|---|---|
| Primario | `#2563EB` |
| Primario hover | `#1D4ED8` |
| Fondo pagina | `#F8FAFC` |
| Superficie | `#FFFFFF` |
| Borde | `#E5E7EB` |
| Texto principal | `#111827` |
| Texto secundario | `#6B7280` |
| Error | `#DC2626` |
| Warning | `#F59E0B` |
| Exito | `#16A34A` |
| Info | `#0EA5E9` |

Tipografia recomendada:

| Elemento | Tamano | Peso | Nota |
|---|---:|---:|---|
| Titulo de pagina | `1.125rem` a `1.25rem` | `650` a `700` | Usar en header, no dentro de cards chicas. |
| Titulo de seccion | `0.82rem` a `0.9rem` | `650` a `700` | Compacto y escaneable. |
| Label compacto | `0.665rem` a `0.72rem` | `500` a `600` | Alta avanzada y grillas densas. |
| Label normal | `0.75rem` | `600` | Formularios simples. |
| Texto de ayuda | `0.665rem` a `0.78rem` | `400` a `500` | Breve, no reemplaza label. |
| Texto de campo compacto | `0.72rem` | `500` | Controles de `22px`. |
| Texto de campo normal | `0.82rem` a `0.875rem` | `400` a `500` | Controles altos o formularios menos densos. |
| Error de campo | `0.665rem` a `0.78rem` | `400` a `600` | Cerca del campo. |

## Densidades por contexto

| Contexto | Control | Grilla | Uso |
|---|---|---|---|
| Alta avanzada Empleados | `22px`, texto `0.72rem` | Hasta 4 columnas | Captura densa por pasos. |
| Alta basica Empleados | `22px` a `34px` segun control | Hasta 4 columnas, bloques contenidos | Captura minima sin ruido. |
| Formulario simple nuevo | `34px` a `38px` | 1 a 2 columnas | Pocos campos, menos densidad. |
| Mantenedor denso | `22px` a `34px` | 4 u 8 columnas justificadas | Comparacion de muchos campos. |
| Filtros de tabla | `32px` a `38px` | Grilla de filtros | Busqueda y segmentacion. |
| Acciones de tabla | `24px` a `32px` | Inline | Acciones por fila. |

Elegir densidad por cantidad de campos y frecuencia de uso. No por gusto visual.

## Composicion

Estructura recomendada:

1. Header de pantalla con breadcrumb y titulo.
2. Botonera superior solo si son acciones de pagina.
3. Card o bloque principal con el formulario.
4. Secciones logicas dentro del formulario.
5. Footer estable con `[Secundario] [Primario]`.

No colocar la botonera principal dentro del cuerpo de campos si corresponde al flujo completo. No duplicar la misma accion arriba y abajo.

Para creaciones nuevas, seguir este patron de Empleados:

1. `Header`: breadcrumb + titulo.
2. `Resumen compacto` opcional: estado, alcance o pendientes reales.
3. `Formulario`: secciones visibles, sin ruido.
4. `Acciones`: una sola botonera estable.
5. `Mensajes`: `MessageBox` para errores globales, errores locales junto al campo.

## Anatomia de un campo

Cada campo debe tener esta estructura logica:

1. Label visible.
2. Control.
3. Ayuda breve si aporta.
4. Error local si existe.

Ejemplo conceptual:

```html
<label class="form-field">
  <span class="form-label">Monto</span>
  <input class="form-input" type="number" min="0" step="1" />
  <span class="form-help">Ingrese monto en CLP.</span>
  <span class="form-error">El monto no puede ser negativo.</span>
</label>
```

Reglas:

- el label no debe desaparecer cuando el campo tiene valor;
- el placeholder solo orienta formato o ejemplo;
- el error pertenece al campo, no a un toast;
- la ayuda debe ser corta y especifica;
- no usar tooltips para errores criticos;
- no mezclar dos conceptos de negocio en un solo campo.

## Secciones

Usar nombres funcionales y concretos:

- Identificacion.
- Datos personales.
- Contrato.
- Movimiento.
- Contexto.
- Configuracion.
- Observaciones.

Evitar secciones genericas como "Datos" o "Informacion" si no aclaran la tarea.

Definicion de seccion:

- titulo corto;
- campos relacionados;
- una responsabilidad clara;
- sin acciones propias salvo casos justificados;
- separador suave respecto de la seccion anterior.

No crear secciones para uno o dos campos si basta con agruparlos visualmente dentro del mismo bloque.

## Campos

- Cada input debe tener label visible.
- Selects con muchas opciones deben incluir busqueda si existe componente disponible.
- Fechas deben usar formato de guardado `yyyy-mm-dd`; la UI puede mostrar ayuda si el control lo requiere.
- Numeros deben declarar `min`, `step` y unidad cuando corresponda.
- Campos opcionales deben verse como opcionales por contexto o ayuda breve, no por ausencia de validacion.
- No inflar ancho de campos cortos si el flujo se entiende mejor con ancho acotado.

Grilla recomendada para captura inspirada en Empleados:

- desktop: maximo 4 columnas;
- tablet: 2 columnas;
- mobile: 1 columna;
- campos largos pueden ocupar 2 columnas;
- secciones con pocos campos pueden acotarse con `max-width`;
- mantener el orden DOM y no reordenar campos por CSS.

La grilla de 8 columnas no es default para formularios nuevos. Reservarla para Parametros o mantenedores densos con muchos campos comparables.

## Tipos de control

| Tipo | Usar cuando | Reglas |
|---|---|---|
| `input text` | Texto corto, codigo, nombre, referencia. | No usar para seleccionar entidades si hay catalogo. |
| `input number` | Monto, cantidad, tasa o dias. | Definir `min`, `step` y unidad visible. |
| `input date` | Fecha exacta. | Guardar `yyyy-mm-dd`; no mezclar formatos visibles. |
| `input month` | Periodo `YYYY-MM`. | Usar en remuneraciones y parametros por periodo. |
| `select` | 2 a 5 opciones estables. | Labels funcionales, no valores tecnicos crudos. |
| `search-select` | Catalogos medianos o grandes. | Buscar por nombre/codigo/RUT si aplica. |
| `textarea` | Observacion breve. | Altura compacta; no usar como caja principal. |
| `checkbox/switch` | Booleanos claros. | Label debe explicar la decision. |
| `radio/segmented` | Decision excluyente corta. | Maximo 3 o 4 opciones visibles. |

## Estados de formulario

| Estado | Definicion | UI esperada |
|---|---|---|
| Inicial | Sin ediciones del usuario. | Campos listos, sin errores prematuros. |
| Editando | Usuario cambio valores. | Acciones guardar/cancelar disponibles. |
| Guardando | Persistencia en curso. | Botones bloqueados, mensaje/loading claro. |
| Guardado | Persistencia exitosa. | Mensaje breve y siguiente accion clara. |
| Error local | Campo invalido. | Error junto al campo. |
| Error global | Falla de carga, permisos o servicio. | `MessageBox` o bloque superior. |
| Solo lectura | No se puede editar por estado o periodo. | Campos deshabilitados o vista detalle. |
| Bloqueado | No se puede continuar por regla. | Explicar motivo y accion posible. |

## Resumen compacto

Usar resumen compacto cuando ayuda al usuario a entender contexto antes de capturar.

Puede mostrar:

- estado del registro;
- periodo;
- alcance de la accion;
- pendientes reales;
- referencia funcional.

No debe mostrar:

- instrucciones largas;
- datos tecnicos irrelevantes;
- listas extensas;
- explicaciones de funcionalidades futuras;
- texto duplicado del titulo.

## Validaciones

- Mostrar error cerca del campo.
- Usar resumen superior solo para errores multiples o bloqueos generales.
- No ocultar errores criticos en tooltips.
- Deshabilitar campos o acciones no aplicables y explicar el motivo cuando no sea obvio.
- No duplicar reglas complejas en el componente si ya existen rules/service.

Separacion de responsabilidades:

| Capa | Responsabilidad |
|---|---|
| Template | Mostrar errores, estados y disabled. |
| Componente | Orquestar eventos, normalizar input simple y llamar service/rules. |
| Rules | Validaciones puras, transiciones y restricciones. |
| Service | Casos de uso, persistencia indirecta y errores controlados. |
| Repository | Lectura/escritura sin reglas de negocio complejas. |

Validar en UI solo lo necesario para feedback inmediato. Las reglas de negocio deben vivir en rules/service.

Colores:

- error: `#DC2626`;
- warning: `#F59E0B`;
- exito: `#16A34A`;
- info: `#0EA5E9`.

## Acciones

Orden estandar:

- accion secundaria a la izquierda o antes;
- accion primaria al final;
- accion destructiva separada o con tono peligro claro.

Ejemplo:

```text
Cancelar   Guardar borrador
```

No usar botones de texto largo si existe icono claro para herramientas. Para acciones de negocio, usar texto directo.

Tipos de accion:

| Tipo | Ejemplos | Ubicacion |
|---|---|---|
| Primaria | Guardar, Crear, Aprobar, Calcular preliminar. | Derecha del footer o toolbar. |
| Secundaria | Cancelar, Volver, Limpiar. | Antes de la primaria. |
| Destructiva | Eliminar, Anular, Rechazar. | Separada, confirmada o por estado. |
| Navegacion | Volver, Ver ficha, Continuar. | Header, breadcrumb o accion de fila. |
| Utilidad | Refrescar, Exportar, Mostrar filtros. | Toolbar. |

No mostrar acciones que el modulo no implementa. No dejar botones deshabilitados sin razon visible si son relevantes para el usuario.

## Responsive

- En pantallas pequenas, apilar campos.
- Evitar scroll horizontal global.
- Permitir scroll interno en tablas/listas.
- Mantener visible el titulo, el contexto y la accion principal.
- No usar escalado de fuente basado en viewport.

## Checklist de cierre

1. Labels visibles en todos los campos.
2. Secciones logicas sin cards anidadas.
3. Footer estable con orden secundario/primario.
4. Validaciones cerca del campo.
5. Inputs no se desbordan en mobile.
6. No se duplican reglas que ya viven en rules/service.
7. No se promete una accion que el modulo aun no implementa.
8. Cambio visual registrado en [`peticiones-estilos.md`](./peticiones-estilos.md) si corresponde.
9. Si es una creacion nueva, el layout fue comparado contra el patron Empleados.
10. La grilla no supera 4 columnas salvo mantenedor denso justificado.

## Compatibilidad historica

La ruta anterior [`temas/ui-form-guidelines.md`](./temas/ui-form-guidelines.md) queda como wrapper historico hacia este documento.
