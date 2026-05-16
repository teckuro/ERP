# Guía de estilos - carpeta `estilos`

Punto de entrada para **normas visuales reutilizables**: grillas, anchos, checklist y patrones de cierre. Las reglas contractuales completas siguen en [`../AGENTS.md`](../AGENTS.md) y [`../ui-form-guidelines.md`](../ui-form-guidelines.md).

---

## Mapa rápido

| Documento | Contenido |
|-----------|-----------|
| [`../README.md`](../README.md) | Índice padre, jerarquía de reglas y mapa por tema |
| [`../peticiones-estilos.md`](../peticiones-estilos.md) | Bitácora de mejoras pedidas, no normativa |
| [`../temas/parametros-ui-estandar.md`](../temas/parametros-ui-estandar.md) | Estándar visual específico del módulo Parámetros |
| Este archivo | Grilla 8 columnas, anchos, codificación y checklist de cierre |

---

## Codificación UTF-8

Regla:

- Todo archivo de código, plantilla, CSS, Markdown y SQL del repo debe conservarse en UTF-8.
- No introducir BOM en archivos nuevos o editados salvo que el archivo ya lo tenga por una razón explícita.
- No cerrar una tarea si aparecen firmas de mojibake en archivos tocados: `Ã`, `Â`, `�`, `â€`, `â€™`, `â€œ`, `â€¦`.

Causa habitual en Windows:

- El mojibake aparece cuando texto UTF-8 se lee o reescribe como Windows-1252.
- También aparece cuando `Get-Content`/`Set-Content` se usa sin codificación explícita en un flujo que luego vuelve a guardar el archivo.

Patrón de edición:

- Preferir `apply_patch` para cambios manuales.
- Si una reescritura mecánica es inevitable, leer y escribir explícitamente como UTF-8 sin BOM.
- En PowerShell, no usar `Set-Content` sin codificación explícita. En Windows PowerShell 5.1, preferir `System.Text.UTF8Encoding` porque `-Encoding utf8` puede introducir BOM.
- No confiar en la visualización de consola para diagnosticar acentos. Validar buscando firmas de mojibake en el archivo.

Checklist antes de finalizar:

```powershell
Select-String -Path <archivos> -Pattern "Ã","Â","�","â€"
```

Si hay coincidencias, revisar si son texto corrupto. En pantallas visibles, corregir a español normal: `remuneración`, `período`, `revisión`, `observación`, `categoría`, `nómina`, `código`, `válida`.

Escritura segura desde scripts:

```powershell
$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
[System.IO.File]::WriteAllText($path, $text, $utf8NoBom)
```

---

## Grilla de 8 columnas

Usada en pantallas como **Parámetros** (`parametros.page.ts`) y en mantenedores o formularios de alta densidad. No es el patrón por defecto para captura normal.

Definición:

- Contenedor del bloque de campos: `grid-template-columns: repeat(8, minmax(0, 1fr))`.
- Campo estándar: ocupa 2 columnas (`grid-column: span 2`) y permite hasta 4 campos por fila.
- Campo ancho (`param-field--wide`): 8 columnas (`span 8`) y ocupa una fila completa.

Responsive:

- `<= 980px`: `repeat(4, minmax(0, 1fr))`; el mismo `span 2` da 2 campos por fila.
- `<= 760px`: una columna (`1fr`); cada campo `span 1` para apilar sin desbordes.

No hacer:

- No usar `grid-column: 1 / -1` en campos sueltos si rompe la grilla padre. Preferir `span` explícito.
- No forzar `width: 100%` en wrappers que empujen la celda fuera del `minmax(0, 1fr)` sin `min-width: 0` en la cadena.

---

## Ancho máximo del bloque de inputs

- Los inputs deben llevar `width/max-width: 100%`, `box-sizing: border-box` y `min-width: 0` donde la celda es flexible.
- Campos con unidad/sufijo (`.unit-field--suffix`): reservar `padding-right` al input para el badge. El wrapper puede ser `width: 100%` dentro de la celda.
- Si la card es muy ancha pero el contenido no debe flotar, acotar solo el bloque interno del formulario con `max-width`, sin cambiar el ancho global de la card si el producto así lo define.

---

## Tipografía local/sistema

- El ERP no debe depender de Google Fonts ni de servicios externos de fuentes en runtime.
- `src/index.html` no debe declarar `preconnect` ni `stylesheet` hacia `fonts.googleapis.com` o `fonts.gstatic.com`.
- La fuente base se controla desde `src/styles.css` con `--erp-font-sans`.
- Valor vigente: `ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`.
- Componentes y hojas locales deben usar `font-family: var(--erp-font-sans, system-ui, sans-serif)` o heredar la fuente del contenedor.
- Si se incorpora una fuente de marca en el futuro, debe servirse como asset local versionado y documentarse aquí antes de usarla.

---

## Maquetación por capas

Para evitar CSS genérico que se pisa entre pantallas o modos, el layout debe definirse por **capa explícita**.

Reglas:

- No aplicar reglas de grilla sobre selectores demasiado amplios si ese mismo selector existe en otras pantallas o modos.
- Preferir hooks de capa en el HTML y CSS que coincida solo con esa capa.
- Usar `:host-context(...)` solo como gate del modo, pero mantener el selector final específico.

Patrón recomendado:

- Capa base: tokens, controles, inputs, selects y spacing básico.
- Capa layout: grillas y spans del componente o pantalla.
- Capa modo: variantes por modo con clases explícitas, por ejemplo `.employee-grid-basic--ident`.

Ejemplo:

- HTML: `<div class="employee-grid employee-grid-basic--contact">...</div>`
- CSS: `:host-context(.step-panel--basic) .employee-grid-basic--contact { grid-template-columns: ... }`

---

## Contenedor padre a límite inferior

Para evitar pantallas cortas, el **contenedor padre** del layout debe poder ocupar toda la altura disponible.

Reglas:

- El wrapper raíz de la pantalla o `:host` debe tener `height`/`min-height: 100%` cuando la vista se presenta como página.
- Si el layout usa CSS Grid con header + contenido, el área de contenido debe ser `minmax(0, 1fr)`.
- Usar `min-height: 0` en wrappers flex/grid internos cuando haya scroll dentro de la página.
- La cadena padre visible debe poder llegar al final de la página o del viewport disponible.
- No resolver pantallas cortas agrandando cards internas, textareas, inputs o padding artificial.
- En wizards, el footer debe vivir en el mismo eje del formulario y mantenerse estable al final del contenedor flexible.
- Las secciones internas siguen siendo compactas: esta regla de alto aplica al marco de página.

Ejemplo:

- `:host { min-height: 100%; }`
- `.page { min-height: 100%; display: grid; grid-template-rows: auto minmax(0, 1fr); }`
- `.content { min-height: 100%; display: flex; flex-direction: column; }`
- `.step-body { flex: 1 1 auto; min-height: 0; }`

Esta regla no implica full width. Aplica solo a altura.

### Tablas y DataGrid

- La altura de una tabla se resuelve en el contenedor visible.
- No inflar filas, celdas, filtros ni padding para llenar la pantalla.
- El scroll horizontal, si existe, debe vivir dentro del componente tabla/DataGrid.
- Header, filtros, toolbar, cuerpo de tabla, paginación y empty state deben compartir el mismo eje visual.
- Para reglas de columnas, formatos, estados y acciones, ver [`../ui-tables.md`](../ui-tables.md).

---

## Checklist ultra-corto de revisión visual

Antes de cerrar un cambio de UI:

1. Grilla: columnas y `span` coherentes en desktop y en `<760px`.
2. Contenedor: bloque de campos con `max-width` correcto y sin aire muerto raro.
3. Inputs: campos cortos no quedan gigantes ni cortados.
4. Unidades: badge de UF/$/% no solapa el texto del input.
5. Errores: hay altura suficiente debajo del control para no saltar el layout.
6. Cabeceras/tabs: títulos y tabs alineados con el contenido.
7. Densidad: tipografía y espaciado siguen tokens del proyecto.

---

## Implementación de referencia

- Formulario Parámetros: `src/app/pages/parametros.page.ts`.
- Tokens globales: `src/styles.css`, `src/styles/theme.css`, variables `--erp-*`.
