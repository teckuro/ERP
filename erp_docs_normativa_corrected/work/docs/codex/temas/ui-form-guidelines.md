# Guia de formularios

## Objetivo

Definir patrones consistentes para formularios en el ERP. Estas guias complementan `AGENTS.md` y deben seguirse en todas las pantallas que presenten formularios.

## Principios

- El formulario es el bloque protagonista: debe ser claro y conciso.
- Usar labels encima de los inputs; no usar placeholders como labels.
- Preferir una sola columna; usar dos columnas solo cuando mejore la lectura.
- Organizar los campos siguiendo la secuencia natural del usuario (datos personales, contrato, etc.).
- Incluir agrupaciones logicas y bordes suaves para separar secciones.

## Tokens de densidad

Utilizar los tamanos de espaciado y componentes definidos en `AGENTS.md`:

- Altura de inputs: `38px–42px`.
- Botones compactos: `28px–32px`.
- Botones principales: `36px–40px`.
- Espaciados: `4px`, `8px`, `12px`, `16px`, `24px`, `32px`.
- Bordes: radios de `5px–8px` y lineas de `1px` en colores neutrales.

## Composicion del formulario

- **Card principal**: contenedor con borde, radio y fondo blanco.
- **Tabs internos**: cuando se requiere organizar secciones (p. ej. en la ficha de empleado).
- **Mensajes de validacion**: mostrar el error junto al campo; usar un resumen superior para errores multiples.
- **Botonera**: ubicada debajo del header, alineada a la derecha; seguir el orden `[Secundario] [Primario]`.

## Componentes interactivos

- Botones con icono deben usar `flex`, `align-items: center` y un `gap` fijo.
- Selects grandes (≥ 5 opciones) deben incluir busqueda activa.
- Inputs de fechas deben aceptar escritura guiada `dd/mm/aaaa` y guardar `yyyy-mm-dd`.
- No introducir paletas nuevas ni gradientes; usar el esquema de colores definido.

## Validaciones y estados

- Mostrar los estados de error, advertencia o exito con los colores definidos (`#DC2626`, `#F59E0B`, `#16A34A`).
- No ocultar errores criticos en tooltips.
- Deshabilitar campos o botones cuando no sean aplicables; mostrar hint o mensaje de por que estan deshabilitados.

## Responsive

- Mantener la estructura vertical en pantallas pequenas.
- El header puede colapsar o reorganizarse para dejar visible el titulo y la botonera.
- Evitar scroll horizontal global; permitir scroll interno en listas o tablas.

Estas guias son complementarias a las normas de `AGENTS.md` y deben consultarse conjuntamente. Cuando se requiera un cambio visual especifico, documentarlo en `codex/peticiones-estilos.md`.
