# UI y Formularios - Guia Central

Este archivo es la fuente unica para reglas visuales, formularios, loading, botones, mensajes y checklist de UI del ERP.

Para el índice padre de documentación y enlaces por tema, usar [`README.md`](./README.md).

Documentos relacionados:

- `docs/codex/ui-button-guidelines.md` (botones)

## Direccion visual

- Interfaz enterprise, compacta y sobria.
- Neutros dominan; azul primario solo guia foco, seleccion y accion principal.
- Estados usan color para informar, no para decorar.
- Sin gradientes decorativos, orbs, fondos saturados ni sombras pesadas.
- Cards con radio maximo `8px`; controles compactos con `5px` o `6px`.
- No usar cards dentro de cards salvo modales, items repetidos o herramientas realmente enmarcadas.

## Tokens

Tipografia (base global en `src/styles.css` `:root` + `body`):

- Familia: **`--erp-font-sans`** — `Inter` (hoja cargada en `src/index.html`) con fallback `ui-sans-serif, system-ui, sans-serif`.
- Escala de texto: **`--erp-text-scale`** (`0.9`), tamaños **`--erp-text-xs`**, **`--erp-text-sm`**, **`--erp-text-md`**, titulos **`--erp-title-sm`**, **`--erp-title-md`**.
- Cuerpo de aplicacion: `body` usa `--erp-font-sans`, `--erp-text-md`, peso `400`, `line-height` ~`1.5`, antialiasing activado.
- Controles y etiquetas de formulario ERP: preferir pesos **500–600** (labels secundarios mas ligeros que valores).

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

- `2px`, `3px`, `4px`, `8px`, `12px`, `16px`, `24px`, `32px`

Alturas:

- Inputs y selects compactos: **`--erp-control-height`** = `22px` (antes `23px`; mas ligero visualmente). Usar siempre `var(--erp-control-height)` en inputs de formulario, `app-search-select`, `app-calendar-input` y `.employee-control` para alineacion.
- Botones compactos: `28px` a `32px`.
- Botones principales de pagina: `36px` a `40px`.
- Iconos en botones: `14px` a `16px`.

## Layout ERP

Todas las pantallas deben mantener:

1. Header con breadcrumb arriba a la izquierda y titulo de la vista.
2. Botonera separada debajo del header, alineada a la derecha.
3. Contenido principal en una superficie blanca con borde cuando la vista lo requiera.

Regla adicional (altura):

- El contenedor padre de la pantalla debe poder llegar al **límite inferior** (`min-height: 100%`) y, si usa grilla, el contenido debe crecer con `minmax(0, 1fr)` (ver `docs/codex/estilos/README.md`).

Referencia de implementacion (UI base del ERP):

- `src/app/features/empleados/components/form-empleado/form-empleado.html`
- `src/styles.css` (bloque `app-form-empleado { ... }`) define tokens y patrones de:
  - tabs sobrios (sin gradientes)
  - cards con borde y radios 6–8px
  - loading overlay contextual
  - botonera consistente

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
- Tamaño de inputs (regla base):
  - Alto estándar: token **`--erp-control-height`** (`22px`).
  - Ancho mínimo por campo: **`--erp-field-min-width`** (`190px`; evitar inputs gigantes; “término medio”).
- Ancho en formularios:
  - No ocupar siempre el `100%` del ancho disponible.
  - Reservar `width: 100%` para barras de filtros o controles que realmente lo requieran (ej. buscadores globales).

### Regla (ERP) — grillas de captura: máximo 4 columnas

En formularios normales de captura (p.ej. creación básica), evitar grillas “tipo 8 columnas” que introducen ruido.

- **Desktop**: máximo **4 columnas**.
- **Tablet**: **2 columnas**.
- **Móvil**: **1 columna**.
- Secciones con 2 campos deben tener **ancho contenido** (usar `max-width` del bloque interno) y no estirar por llenar pantalla.
- La **grilla de 8 columnas** se reserva para mantenedores densos (ej. **Parámetros**) o casos explícitos de alta densidad.
- Radios y checks:
  - Radios: el control **siempre va alineado al label en la misma línea**.
  - Checks:
    - En listas/opciones (ej. elección entre alternativas): inline con el label.
    - En grillas tipo “param-check” (ej. flags/tope legal): label arriba y checkbox abajo, **centrado**.
### Grilla 8 columnas (mantenedor Parámetros)

Implementacion y estilos en `src/app/pages/parametros.page.ts` (view encapsulation none; selector raíz `.parametros-page`).

- **Rejilla maestra** `field-grid` + modificadores (`field-grid--values`, `--rentas`, `--topes`, etc.): `grid-template-columns: repeat(8, minmax(0, 1fr))`.
- Cada **input, select o campo con unidad** (`.param-field` **hijo directo** del `field-grid`) usa **`grid-column: span 2`** (“de a dos” sobre la grilla de 8).
- **No es obligatorio llenar la fila**: si hay tres campos, ocupan 6 columnas y **quedan 2 libres** a la derecha; el flujo es natural, alineado al inicio (`justify-content: start` en el grid).
- **Subtítulos de bloque** dentro de la rejilla (`.param-subsection-title`, p. ej. AFP / IPS en Topes): **`span 8`** (fila completa).
- **Excepción (pestaña Información de Valores)**: radios (`.erp-choice-radio`) y checks inline de gratificación (`.param-checkbox-inline`) usan **`span 1`** por ser controles compactos; el resto de campos sigue en span 2.
- Evitar **contenedores** tipo `.field-grid-slot--2/--3` que partían todo el ancho en mitades o tercios: los campos deben participar **directamente** en la grilla de 8 para respetar el cálculo de columnas libres.
- Unidades (`$`, `%`, UF, etc.) van en `.unit-field` / `.param-input`; línea de ayuda al contenido: `--param-content-max-width` en el grupo si se limita el ancho útil del formulario.

**Responsive**: por defecto, en `max-width: 980px` la grilla pasa a **4** columnas (cada `span 2` sigue siendo “medio ancho”); en `max-width: 760px` una columna (`span 1` en hijos).

### Grillas empleados (alta / ficha)

Patrones distintos (`employee-grid`, rejillas de 8 columnas en pasos básicos, etc.): mantener **consistencia visual** con el ERP (labels arriba, altura `--erp-control-height`) según sección; no replican la misma fórmula span-2/8 de Parámetros en todos los bloques.

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
- Si carga una pantalla completa, usar `app-message-box variant="loading" mode="modal"` para centrar y bloquear la vista.
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
- Formularios del mantenedor **Parámetros** respetan la grilla de 8 columnas y `span` documentados arriba (sin rejillas anidadas que rompan el cómputo de columnas libres).
