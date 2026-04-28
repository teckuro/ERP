# Guía de estilos — carpeta `estilos`

Punto de entrada para **normas visuales reutilizables** (grillas, anchos, checklist). Las reglas contractuales completas siguen en [`../AGENTS.md`](../AGENTS.md) y [`../ui-form-guidelines.md`](../ui-form-guidelines.md).

---

## Mapa rápido

| Documento | Contenido |
|-----------|-----------|
| [`../bases-estilos.md`](../bases-estilos.md) | Mapa del repo, tokens, orden de lectura |
| [`../peticiones-estilos.md`](../peticiones-estilos.md) | Bitácora de mejoras pedidas (no es normativa) |
| Este archivo | Grilla 8 columnas + anchos + checklist de cierre |

---

## Grilla de 8 columnas (formularios ERP)

Usada en pantallas como **Parámetros** (`parametros.page.ts`) y en formularios densos.

**Definición**

- Contenedor del bloque de campos: `grid-template-columns: repeat(8, minmax(0, 1fr))`.
- Campo estándar: **ocupa 2 columnas** (`grid-column: span 2`) → hasta **4 campos por fila**.
- Campo ancho (`param-field--wide`): **8 columnas** (`span 8`) → una fila completa.

**Responsive**

- **≤980px**: `repeat(4, minmax(0, 1fr))`; el mismo `span 2` da **2 campos por fila**.
- **≤760px**: una columna (`1fr`); cada campo `span 1` para apilar sin desbordes.

**No hacer**

- No usar `grid-column: 1 / -1` en campos sueltos si rompe la grilla padre (preferir `span` explícito).
- No forzar `width: 100%` en wrappers que empujen la celda fuera del `minmax(0, …)` sin `min-width: 0` en la cadena.

---

## Ancho máximo del bloque de inputs

- Los **inputs** deben llevar `width/max-width: 100%`, `box-sizing: border-box`, `min-width: 0` donde la celda es flexible.
- Campos con **unidad/sufijo** (`.unit-field--suffix`): reservar `padding-right` al input para el badge; el wrapper puede ser `width: 100%` dentro de la celda.
- Si la **card** es muy ancha pero el contenido no debe “flotar”, acotar solo el **bloque interno** del formulario con `max-width` (p. ej. `56rem`) sin cambiar el ancho global de la card si el producto así lo define.

---

## Checklist ultra-corto de revisión visual (7 ítems)

Antes de dar por cerrado un cambio de UI:

1. **Grilla**: ¿las columnas y `span` se ven coherentes en desktop y en &lt;760px?
2. **Contenedor**: ¿el bloque de campos respeta `max-width` / no queda “aire muerto” raro?
3. **Inputs**: ¿los cortos (RUT, fechas) no quedan gigantes ni cortados?
4. **Unidades**: ¿badge de UF/$/% no solapa el texto del input?
5. **Errores**: ¿hay altura reservada debajo del control para no saltar el layout?
6. **Cabeceras / tabs**: ¿títulos y `flow-tabs` alineados con el contenido (sin doble padding inconsistente)?
7. **Densidad**: ¿tipografía y espaciado siguen tokens del proyecto (sin “aire SAP” accidental)?

---

## Implementación de referencia

- Formulario Parámetros (estilos en componente): `src/app/pages/parametros.page.ts` (bloque `styles`).
- Tokens globales: `src/styles.css`, `src/styles/theme.css`, variables `--erp-*`.
