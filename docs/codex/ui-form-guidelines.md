# UI y Formularios - Guia Central

Este archivo es la fuente unica para reglas visuales, formularios, loading, botones, mensajes y checklist de UI del ERP.

## Direccion visual

- Interfaz enterprise, compacta y sobria.
- Neutros dominan; azul primario solo guia foco, seleccion y accion principal.
- Estados usan color para informar, no para decorar.
- Sin gradientes decorativos, orbs, fondos saturados ni sombras pesadas.
- Cards con radio maximo `8px`; controles compactos con `5px` o `6px`.
- No usar cards dentro de cards salvo modales, items repetidos o herramientas realmente enmarcadas.

## Tokens

Colores:

- Primario: `#2563EB`
- Primario hover: `#1D4ED8`
- Primario soft: `#EFF6FF`
- Fondo general: `#F8FAFC`
- Superficie: `#FFFFFF`
- Borde: `#E5E7EB`
- Texto principal: `#111827`
- Texto secundario: `#6B7280`
- Texto deshabilitado: `#9CA3AF`
- Error: `#DC2626`, soft `#FEF2F2`
- Warning: `#F59E0B`, soft `#FFFBEB`
- Success: `#16A34A`, soft `#ECFDF5`
- Info: `#0EA5E9`, soft `#F0F9FF`

Espaciado permitido:

- `4px`, `8px`, `12px`, `16px`, `24px`, `32px`

Alturas:

- Inputs: `38px` a `42px`.
- Botones compactos: `28px` a `32px`.
- Botones principales de pagina: `36px` a `40px`.
- Iconos en botones: `14px` a `16px`.

## Layout ERP

Todas las pantallas deben mantener:

1. Header con breadcrumb arriba a la izquierda y titulo de la vista.
2. Botonera separada debajo del header, alineada a la derecha.
3. Contenido principal en una superficie blanca con borde cuando la vista lo requiera.

Reglas:

- Orden de botones: secundario y luego primario.
- La accion primaria va arriba a la derecha y no se duplica.
- En mobile, conservar lectura vertical: breadcrumb, titulo, botonera, contenido.
- El bloque protagonista debe ser evidente: formulario, tabla, detalle o flujo mixto.

## Formularios

- Labels siempre visibles arriba del input.
- Nunca usar placeholder como label.
- Una columna por defecto; dos columnas solo si mejora lectura.
- Agrupar campos por contexto y secuencia visual.
- Validaciones junto al campo y resumen superior si hay multiples errores.
- Selects de catalogo con busqueda cuando tengan mas de 5 opciones o busqueda por texto.
- Fechas con escritura guiada `dd/mm/aaaa` y valor interno ISO si aplica.
- Mantener altura visual consistente entre inputs, selects, calendarios y controles complejos.

## MessageBox

`app-message-box` es el componente unico para mensajes inline y modales de estado.

Uso:

- `variant="success"` para confirmaciones.
- `variant="error"` para errores bloqueantes.
- `variant="warning"` para advertencias que requieren atencion.
- `variant="info"` para informacion neutral.
- `variant="loading"` para esperas.
- `mode="inline"` dentro del flujo.
- `mode="modal"` cuando el usuario debe esperar o confirmar un estado global.

Estilo:

- Fondo blanco, borde simple y acento lateral por estado.
- Icono lucide real, no texto como `OK`, `i` o `x`.
- Radio `8px` en contenedor y `6px` en botones.
- Sin gradientes.
- Botones estables, `inline-flex`, con altura minima `32px`.

## Loading

- Si carga una tabla o listado, el loading vive dentro del cuerpo de la grilla.
- Si carga una pantalla completa, el loading va centrado dentro del contenido principal.
- No bloquear toda la pantalla cuando solo cambia una parte.
- Usar texto contextual: `Cargando listado de empleados...`, `Cargando ficha...`, `Guardando ficha...`.

## Botones e iconos

- Todo boton con icono y texto usa `inline-flex`, `align-items: center`, `justify-content: center` y `gap`.
- Iconos con ancho y alto definidos.
- No alinear iconos con `margin-top` manual.
- Preferir simbolos conocidos para acciones compactas: cerrar, guardar, editar, volver, descargar.

## Estados de negocio de empleados

El origen de creacion define el estado inicial:

- `basico`: `estado = 'EN_PROCESO'`, `estado_ficha = 'INCOMPLETO'`, `apto_para_remuneraciones = false`.
- `avanzado`: al finalizar queda `estado = 'ACTIVO'`, `estado_ficha = 'VALIDO'`, `apto_para_remuneraciones = true`.

Para alta avanzada, persistir en fases si la base exige restricciones de activacion:

1. Insertar persona en estado intermedio.
2. Insertar contrato, remuneracion, prevision, salud, banco y centro de costo.
3. Activar persona al final.

## Checklist

Antes de cerrar un cambio UI:

- Hay un unico bloque protagonista.
- Header, botonera y contenido respetan el layout ERP.
- Colores, radios, espaciado y alturas usan los tokens definidos.
- Formularios tienen labels visibles, errores claros y flujo legible.
- Tablas y datagrids no compiten con sidebars o cards extras.
- Loading aparece donde ocurre la espera.
- MessageBox usa el componente compartido.
- Mobile no tiene textos superpuestos ni controles desbordados.
- No se introdujeron paletas, gradientes o decoraciones nuevas.
