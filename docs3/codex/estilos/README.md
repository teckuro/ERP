# Guia de estilos - carpeta `estilos`

Punto de entrada para normas visuales reutilizables del ERP: layout, grillas, anchos, densidad, tablas y checklist de cierre. Las reglas contractuales completas se leen junto con [`../AGENTS.md`](../AGENTS.md), [`../ui-form-guidelines.md`](../ui-form-guidelines.md), [`../ui-button-guidelines.md`](../ui-button-guidelines.md) y [`../ui-tables.md`](../ui-tables.md).

## Principio visual

El ERP debe sentirse como una herramienta de trabajo: compacto, claro, estable y facil de escanear. La UI debe priorizar lectura, comparacion y accion repetida por sobre decoracion.

La referencia base para nuevas pantallas es el modulo **Empleados**, especialmente el alta basica y avanzada:

- `src/app/features/empleados/components/form-empleado/form-empleado.html`;
- `src/app/features/empleados/components/form-empleado/form-empleado.css`;
- `src/app/features/empleados/components/secciones/datos-personales/datos-personales.css`;
- `docs/codex/modulos/empleados/creacion-basica.md`.

No se deben copiar clases de empleados literalmente si el modulo nuevo tiene otra estructura. Se debe copiar el criterio: un shell estable, un bloque protagonista, grillas por capa, acciones consistentes y densidad compacta.

Reglas base:

- usar paleta neutra con azul `#2563EB` para acciones principales;
- usar estados semanticos consistentes: error `#DC2626`, warning `#F59E0B`, exito `#16A34A`, info `#0EA5E9`;
- mantener bordes de `5px` a `8px` salvo componentes existentes que definan otro radio;
- evitar gradientes, sombras pesadas, fondos decorativos y paletas nuevas;
- no inflar cards, inputs, filas ni padding para llenar espacio;
- no anidar cards dentro de cards salvo modales o items repetidos con necesidad real.

## Definiciones del sistema visual

| Concepto | Definicion | Regla |
|---|---|---|
| Pantalla | Vista completa bajo una ruta. | Debe tener un objetivo principal. |
| Page wrapper | Componente en `src/app/pages/` que monta el contenedor. | No contiene logica de negocio. |
| Container | Componente de feature que orquesta estado UI y servicios. | No consulta repository directo. |
| Shell | Marco estructural de la pantalla. | Header, acciones y contenido estable. |
| Workspace | Area disponible para el flujo principal. | Controla altura y scroll. |
| Bloque protagonista | Panel principal donde ocurre la tarea. | Uno por pantalla salvo justificacion. |
| Card | Contenedor con borde/fondo para agrupar una unidad. | No usar cards anidadas. |
| Panel | Contenedor funcional similar a card, usualmente dentro de una card principal. | Usar para secciones complejas. |
| Toolbar | Acciones y filtros de pagina/listado. | Compacta, alineada y sin duplicar. |
| Badge/chip | Indicador corto de estado, tipo o pendiente. | Texto + color suave; no solo color. |
| Empty state | Estado sin datos. | Explica que falta y accion posible. |
| Loading state | Estado de carga. | Debe ocupar el area que esta cargando. |
| Error state | Falla recuperable o bloqueante. | Mensaje claro y accion si existe. |
| Densidad compacta | Mucha informacion legible con poco ruido. | Tokens chicos, no saturados. |

## Jerarquia visual

| Nivel | Uso | Tamaño/tono |
|---|---|---|
| H1 pantalla | Nombre de la pantalla o flujo. | Claro, no marketinero. |
| Lead | Explica alcance en una frase. | Gris secundario, maximo 1 o 2 lineas. |
| H2 bloque | Titulo de card o listado. | Pequeño, fuerte. |
| H3 seccion | Agrupacion dentro del formulario. | Compacto, sin competir con H1. |
| Label | Nombre del campo. | Visible, sobre el control. |
| Help text | Ayuda contextual. | Breve, secundaria. |
| Error text | Problema local. | Cercano, semantico. |

No usar hero text, grandes titulares ni composicion de landing en pantallas operativas.

## Mapa rapido

| Documento | Contenido |
|---|---|
| [`../README.md`](../README.md) | Indice padre, jerarquia de reglas y mapa por tema |
| [`../AGENTS.md`](../AGENTS.md) | Contrato general, layout ERP, anti-patrones y reglas frontend |
| [`../ui-form-guidelines.md`](../ui-form-guidelines.md) | Formularios, agrupaciones, validaciones y footer |
| [`../ui-button-guidelines.md`](../ui-button-guidelines.md) | Botones, iconos, toolbar y orden de acciones |
| [`../ui-tables.md`](../ui-tables.md) | DataGrid, columnas, filtros, acciones y responsive |
| [`../peticiones-estilos.md`](../peticiones-estilos.md) | Bitacora de mejoras visuales; no es normativa |
| [`../temas/parametros-ui-estandar.md`](../temas/parametros-ui-estandar.md) | Estandar visual especifico del modulo Parametros |
| Este archivo | Grillas, anchos, scoping CSS, altura de pagina y checklist |

## Layout base

Cada pantalla nueva debe partir de esta estructura:

1. Header con breadcrumb y titulo.
2. Botonera separada, alineada a la derecha.
3. Contenido principal en card o bloque unframed segun el flujo.
4. Tabla, formulario o vista principal como protagonista.

La botonera no debe duplicarse arriba y abajo. Si hay acciones del formulario, van en footer estable del bloque de captura.

## Contrato para nuevas pantallas

Antes de crear una pantalla nueva, definir:

| Pregunta | Decision esperada |
|---|---|
| Que tarea principal resuelve? | Una frase funcional. |
| Que dato muestra o captura? | Entidad, periodo o hecho. |
| Que modulo es responsable? | Feature dueño. |
| Que acciones existen hoy? | Solo acciones implementadas. |
| Que queda fuera de alcance? | Motor, reportes, cierre, importadores, etc. si no aplican. |
| Que patron visual usa? | Empleados, DataGrid, Parametros u otro existente. |

Regla:

- pantalla con formulario nuevo: partir del patron Empleados;
- pantalla de tabla/listado: partir de DataGrid;
- pantalla densa de parametros: partir del patron Parametros;
- pantalla de proceso: mantener bloques compactos, no dashboard decorativo.

## Patron base inspirado en Empleados

Usar Empleados como modelo para creaciones posteriores cuando se construyan pantallas de captura, revision o mantenedores.

### Shell de pagina

Patron:

- `:host` o wrapper raiz con `display: block` y `min-height: 100%`;
- wrapper de pagina con `display: flex` o `grid`, `flex-direction: column`, `min-height: 0`, `min-width: 0`;
- contenedor interno con `max-width` comun para header, resumen y formulario cuando el flujo necesita columna contenida;
- el contenido principal crece en el eje vertical; no se estiran controles para llenar espacio.

Referencia de criterio:

- `form-shell` / `form-stack`;
- `editor-shell` / `editor-frame`;
- `basic-create-inner`;
- `content-shell--basic`.

Valores recomendados:

```css
:host {
  display: block;
  min-height: 100%;
}

.page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
  min-height: 0;
}

.page-inner {
  width: 100%;
  max-width: min(68rem, 100%);
  margin-inline: auto;
  padding-inline: 12px;
}
```

No todos los modulos necesitan `max-width: 68rem`; usarlo cuando hay captura contenida. Listados o DataGrid pueden ocupar todo el ancho util.

### Header y acciones

Patron:

- breadcrumb arriba;
- titulo de pantalla claro;
- acciones principales alineadas a la derecha;
- en mobile, acciones bajan a una segunda linea sin perder alineacion;
- no duplicar footer si la accion ya vive en la cabecera del paso.

Referencia de criterio:

- `summary-identity--basic`;
- `summary-actions`;
- `app-page-actions`.

### Bloque protagonista

Patron:

- una sola card o panel protagonista;
- resumen compacto arriba solo cuando agrega contexto operativo;
- contenido con padding moderado (`12px` a `16px`);
- chips pequeños para estados o pendientes;
- copy breve, orientado a accion.

Referencia de criterio:

- `basic-create-summary-card`;
- `basic-create-summary-chip`;
- `step-panel--basic`.

Anatomia recomendada:

1. Header del bloque: titulo corto y subtitulo opcional.
2. Cuerpo: formulario, tabla o contenido principal.
3. Footer: acciones del bloque si corresponde.

No mezclar resumen, formulario, tabla y acciones de proceso en una misma card si cada uno tiene una responsabilidad distinta.

### Grillas por capa

Patron:

- maximo 4 columnas para captura normal en desktop;
- 2 columnas en tablet;
- 1 columna en mobile;
- usar clases explicitas por bloque, no selectores globales compartidos;
- mantener orden DOM de los campos;
- usar spans solo para jerarquia funcional.

Referencia de criterio:

- `employee-grid-basic--ident`;
- `employee-grid-basic--nombre`;
- `employee-grid-basic--contact`;
- `employee-grid-adv`.

### Densidad

Patron:

- separaciones de `8px`, `12px` y `16px`;
- textos secundarios pequeños pero legibles;
- borde neutral `#E5E7EB`;
- superficies blancas o `#F8FAFC`;
- chips de estado con borde y fondo suave;
- sin gradientes ni sombras pesadas.

Medidas base:

| Elemento | Valor recomendado |
|---|---|
| Padding card compacta | `12px 16px` |
| Padding card normal | `16px` |
| Gap entre bloques | `12px` a `16px` |
| Gap entre campos | `8px` a `12px` |
| Alto input compacto ERP | `22px` |
| Alto input normal | `34px` a `38px` |
| Alto search-select/calendario | `34px` a `40px` |
| Alto accion fila | `24px` a `32px` |
| Alto boton principal | `36px` a `40px` |
| Radio card | `8px` |
| Radio control | `6px` a `8px` |

Si una pantalla se siente vacia, ajustar el layout padre o el max-width. No agrandar campos ni padding como solucion.

Regla tomada de creacion avanzada de Empleados:

- `--erp-control-height` puede ser `22px` para inputs nativos en grillas densas.
- Texto de control puede ser `0.72rem` con `line-height: 1.25`.
- Labels y mensajes pueden bajar a `0.665rem` si la pantalla es densa y legible.
- Botones de navegacion del paso pueden seguir en `34px` a `38px` para conservar peso de accion.
- No mezclar controles de `22px` con botones altos dentro de la misma fila si rompen alineacion; agrupar por funcion.

## Cuando usar este patron

Usar el patron Empleados para:

- altas o creaciones nuevas;
- pantallas con formulario principal;
- revision de registros con estados;
- mantenedores con acciones primarias claras;
- flujos que combinan resumen + captura + validacion.

No usarlo como copia literal para:

- dashboards de lectura masiva;
- tablas puras sin captura;
- pantallas legales/exportacion;
- componentes compartidos de bajo nivel.

## Grilla de formularios

Usar una columna por defecto. Usar dos columnas si mejora la lectura. Usar grilla densa solo en mantenedores o pantallas donde el usuario necesita comparar muchos campos.

Para creaciones nuevas, el default recomendado es el patron Empleados: hasta 4 columnas en desktop, 2 en tablet y 1 en mobile. La grilla de 8 columnas queda reservada para Parametros u otros mantenedores densos.

### Grilla de 8 columnas

Usada en pantallas densas como Parametros y mantenedores de alta densidad. No es el patron por defecto para captura normal.

Definicion:

- contenedor: `grid-template-columns: repeat(8, minmax(0, 1fr))`;
- campo estandar: `grid-column: span 2`, hasta 4 campos por fila;
- campo ancho: `grid-column: span 8`, una fila completa.

Responsive:

- `<= 980px`: `repeat(4, minmax(0, 1fr))`; el mismo `span 2` da 2 campos por fila;
- `<= 760px`: `1fr`; cada campo se apila sin desbordes.

No hacer:

- no usar `grid-column: 1 / -1` en campos sueltos si rompe la grilla padre;
- no forzar `width: 100%` en wrappers flexibles sin `min-width: 0` en la cadena;
- no usar una grilla densa para formularios de alta friccion o captura secuencial.

## Componentes base esperados

Usar componentes compartidos cuando existan:

| Necesidad | Componente/patron |
|---|---|
| Card | `app-card`, `app-card-header`, `app-card-content` |
| Boton | `app-button` o patron existente del modulo |
| Mensaje | `app-message-box` |
| Breadcrumb | `app-record-breadcrumb` |
| Tabla/listado | `app-data-grid` |
| Selector con busqueda | `app-search-select` |
| Acciones pagina | `app-page-actions` |

No crear un nuevo componente visual si uno compartido ya resuelve el caso con ajustes razonables.

## Estados visuales

| Estado | Color recomendado | Uso |
|---|---|---|
| Neutral | gris suave | Borrador, sin datos, no aplica. |
| Info | azul suave | Referencia, periodo activo, accion sugerida. |
| Exito | verde suave | Aprobado, completo, guardado. |
| Warning | amarillo suave | Pendiente, revisar, advertencia no bloqueante. |
| Error | rojo suave | Error, rechazo, bloqueo, accion destructiva. |
| Muted | gris muy suave | Anulado, historico, solo lectura. |

Reglas:

- el badge debe tener texto claro;
- el color no debe ser el unico significado;
- no usar rojo para estados no bloqueantes;
- no usar verde para acciones que todavia no terminaron;
- no inventar estados visuales que el dominio no reconoce.

## Anchos y densidad

- Inputs compactos ERP: altura de `22px` cuando el formulario es denso, como creacion avanzada de Empleados.
- Inputs/selects normales: altura de `34px` a `38px`.
- Search-select/calendario: altura de `34px` a `40px`, segun componente compartido.
- Botones compactos: `24px` a `32px`.
- Botones principales: `36px` a `40px`.
- Espaciado: `4px`, `8px`, `12px`, `16px`, `24px`, `32px`.
- Bloques internos de formulario pueden acotarse con `max-width` cuando una card muy ancha deja aire muerto.
- Los inputs deben usar `box-sizing: border-box`, `max-width: 100%` y `min-width: 0` en celdas flexibles.
- Campos con unidad o sufijo deben reservar espacio interno para que el badge no tape el texto.

## Maquetacion por capas

Para evitar CSS generico que se pisa entre pantallas, separar estilos por capa:

- capa base: tokens y controles reutilizables;
- capa layout: grillas y spans de la pantalla;
- capa modo: variantes explicitas por modo o flujo.

Patron recomendado:

- HTML: `<div class="employee-grid employee-grid-basic--contact">...</div>`;
- CSS: `:host-context(.step-panel--basic) .employee-grid-basic--contact { ... }`.

No aplicar reglas de grilla sobre selectores demasiado amplios si ese selector existe en otras pantallas o modos.

## Contenedor padre hasta el limite inferior

Para evitar pantallas cortas con vacio visual, el contenedor padre debe poder ocupar toda la altura disponible.

Reglas:

- `:host` o wrapper raiz con `min-height: 100%` cuando sea pagina;
- si el layout usa grid con header + contenido, usar `grid-template-rows: auto minmax(0, 1fr)`;
- usar `min-height: 0` en wrappers flex/grid internos con scroll;
- no resolver altura agregando padding artificial, textareas gigantes o filas infladas;
- en wizards, el footer vive en el mismo eje del formulario y queda estable al final del contenedor flexible.

Ejemplo:

```css
:host {
  min-height: 100%;
}

.page {
  min-height: 100%;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
}

.content {
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

.step-body {
  flex: 1 1 auto;
  min-height: 0;
}
```

Esta regla aplica a altura, no implica full width.

## Tablas y DataGrid

- La altura de la tabla se resuelve en el contenedor visible.
- No inflar filas, celdas, filtros ni padding para llenar pantalla.
- El scroll horizontal vive dentro del DataGrid.
- Header, filtros, toolbar, cuerpo, paginacion y empty state deben compartir un eje visual.
- Las acciones por fila deben ser compactas, estables y segun estado.
- Para columnas, formatos y filtros, ver [`../ui-tables.md`](../ui-tables.md).

## Checklist de revision visual

Antes de cerrar una pantalla:

1. Grilla: columnas y spans se ven coherentes en desktop y bajo `760px`.
2. Contenedor: el bloque de campos respeta ancho util y no deja aire muerto raro.
3. Inputs: campos cortos como RUT, fechas o codigos no quedan gigantes ni cortados.
4. Unidades: badges de UF, CLP, porcentaje o sufijos no solapan el valor.
5. Errores: mensajes aparecen cerca del campo y no saltan el layout de forma brusca.
6. Cabeceras/tabs: titulos, tabs y contenido tienen alineacion consistente.
7. Densidad: tipografia y espaciado siguen tokens del proyecto.
8. Estados: badges y mensajes usan semantica consistente, no solo color.
9. Acciones: boton secundario antes de primario; acciones peligrosas no compiten con la accion principal.
10. Alcance: no se agregan decoraciones, dashboards o cards extra fuera del objetivo funcional.

## Implementacion de referencia

- Empleados, base visual para nuevas creaciones: `src/app/features/empleados/components/form-empleado/form-empleado.{html,css}`.
- Empleados, grillas de captura: `src/app/features/empleados/components/secciones/datos-personales/datos-personales.css`.
- Empleados, contrato de modo basico: `docs/codex/modulos/empleados/creacion-basica.md`.
- Parametros: `src/app/pages/parametros.page.ts`.
- Novedades mensuales: `src/app/features/nomina-mensual/novedades/containers/novedades-mensuales-container/`.
- Tokens globales: `src/styles.css`, `src/styles/theme.css`, variables `--erp-*`.
