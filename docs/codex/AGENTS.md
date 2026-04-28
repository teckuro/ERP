# Codex Agent Instructions - ERP UI System

Este archivo define la base de trabajo para Codex en este proyecto. Antes de generar o modificar UI, Codex debe leer estas reglas y aplicarlas como contrato visual y tecnico del ERP.

## Prioridad de reglas

1. `docs/codex/AGENTS.md`
2. `docs/codex/bases-estilos.md` (punto de entrada único: bases de estilos, mapa de docs y enlaces)
3. `docs/codex/ui-form-guidelines.md`
4. Documentos especificos del flujo, por ejemplo `docs/codex/modo-basico-empleado.md`

Si hay conflicto entre reglas, gana la regla mas alta en esta lista.

## Stack del proyecto

- Angular standalone.
- Tailwind CSS.
- Componentes reutilizables.
- UI enterprise tipo SAP / Fiori / SaaS profesional.

## Direccion visual

La UI debe sentirse empresarial, compacta y sobria:

- Neutros dominan la pantalla.
- Azul primario solo guia foco, seleccion y accion principal.
- Estados usan color solo para informar, no para decorar.
- Bordes suaves y radios contenidos.
- Sombras discretas.
- Alta densidad legible, sin aire excesivo.
- Sin gradientes decorativos ni colores saturados.

## Tokens base

Usar los tokens definidos en `docs/codex/ui-form-guidelines.md`.

Colores operativos:

- Primario: `#2563EB`
- Primario hover: `#1D4ED8`
- Primario soft: `#EFF6FF`
- Fondo general: `#F8FAFC`
- Superficie/card: `#FFFFFF`
- Borde: `#E5E7EB`
- Texto principal: `#111827`
- Texto secundario: `#6B7280`
- Texto deshabilitado: `#9CA3AF`
- Error: `#DC2626`
- Warning: `#F59E0B`
- Success: `#16A34A`
- Info: `#0EA5E9`

No introducir una segunda paleta ni variantes nuevas si los tokens existentes cubren el caso.

## Densidad y medidas

Usar solo estos tokens de espaciado:

- `4px`
- `8px`
- `12px`
- `16px`
- `24px`
- `32px`

Reglas de densidad:

- Inputs normales: `38px` a `42px` de alto.
- Botones compactos: `28px` a `32px`.
- Botones principales de pagina: `36px` a `40px`.
- Radios: `5px` o `6px` en controles compactos; `8px` maximo en cards.
- Popovers y menus: padding `8px` o `12px`.
- Evitar paddings grandes cuando el flujo sea de captura de datos.

## Layout base obligatorio

Todas las pantallas ERP deben respetar esta estructura:

```text
Header
- Breadcrumb arriba a la izquierda
- Titulo centrado

Botonera
- Fila separada debajo del header
- Alineada a la derecha
- Orden: secundario, primario

Contenido
- Una card principal con borde, radio, padding y fondo blanco
- Dentro: formulario, tabla, tabs o vista principal
```

No poner la botonera abajo ni dentro de la card de contenido.

## Formularios

- El formulario es el bloque protagonista.
- Usar labels arriba del input.
- No usar placeholder como label.
- Preferir una columna.
- Usar maximo dos columnas solo si mejora la lectura.
- Organizar por secuencia visual, no por una grilla global rigida.
- Usar una card principal y secciones internas.
- Cada seccion puede tener su propia grilla.
- Evitar formularios largos sin separacion.
- Controles complejos, como calendarios o selects con panel, deben conservar la misma altura visual que los inputs base.

## Componentes interactivos

- Botones con icono y texto deben usar `inline-flex` o `flex`, `align-items: center`, `gap` y dimensiones estables para el icono.
- Iconos en botones compactos: `14px` a `16px`.
- Popovers deben abrir cerca del campo, ser compactos y no tapar innecesariamente el formulario.
- Inputs con formato deben corregir la escritura cuando sea posible y restringir caracteres invalidos.
- Fechas deben aceptar escritura guiada `dd/mm/aaaa` y guardar valor interno ISO `yyyy-mm-dd` si el formulario lo requiere.
- Selects de catalogo deben usar busqueda activa cuando tengan mas de 5 opciones o cuando el usuario deba encontrar valores por texto.
- Selects con busqueda deben conservar altura de input base, panel compacto, navegacion por teclado y salida compatible con `formControlName`.

## Jerarquia visual

- Nivel 1: contenido principal.
- Nivel 2: resumen, navegacion y secciones.
- Nivel 3: labels, ayudas y metadatos.

La sidebar, si existe, siempre es secundaria y no debe competir con el formulario o la tabla principal.

## Botones

- La accion primaria va arriba a la derecha.
- No duplicar acciones primarias en otra zona de la pantalla.
- El orden visual debe ser: `[Secundario] [Primario]`.
- Primario: fondo `#2563EB`, texto blanco.
- Secundario: fondo blanco, borde `#E5E7EB`, texto `#374151`.
- Ghost: fondo transparente, texto `#374151`.

## Validaciones

- Mostrar error junto al campo.
- Usar resumen superior cuando haya multiples errores o el flujo lo necesite.
- No ocultar errores criticos en tooltips o mensajes secundarios.
- Error visual: borde `#DC2626`, ayuda `#DC2626`, fondo soft solo si aporta claridad.

## Responsive

- Mantener estructura vertical.
- En mobile:
  - breadcrumb arriba,
  - titulo debajo si no cabe en la misma linea,
  - botonera arriba y alineada a la derecha,
  - contenido en una columna.

## Flujo de trabajo de Codex

Antes de implementar:

1. Revisar los documentos obligatorios relevantes.
2. Identificar el bloque protagonista.
3. Confirmar si la vista es formulario, tabla, detalle o flujo mixto.
4. Aplicar layout base, tokens de tema y densidad compacta.
5. Implementar con componentes y patrones existentes.
6. Verificar contra el checklist.

## Registro de mejoras de estilos (obligatorio)

Cuando una petición implique **mejoras visuales / estilos**, registrar el cambio en:

- `docs/codex/peticiones-estilos.md`

Las reglas base y “estilos padre” del proyecto se resumen en:

- `docs/codex/bases-estilos.md`

## Anti-patrones

No hacer:

- Formularios complejos en muchas columnas.
- Inputs sin label visible.
- Placeholder usado como label.
- Sidebar dominante.
- Botonera dentro del contenido.
- Botonera duplicada arriba y abajo.
- Cards innecesarias o cards dentro de cards sin necesidad real.
- Layouts distintos para pantallas que pertenecen al mismo flujo ERP.
- Espaciado improvisado fuera de los tokens definidos.
- Paletas nuevas, gradientes decorativos o colores saturados.
- Controles altos o popovers sobredimensionados en flujos de captura.

## Checklist final

Antes de cerrar un cambio UI, validar:

- Existe un unico bloque protagonista.
- Header, botonera y contenido respetan el layout base.
- Labels, inputs y errores son claros.
- La botonera esta arriba a la derecha.
- El espaciado usa tokens permitidos.
- Los colores respetan `ui-form-guidelines.md`.
- La jerarquia visual es evidente.
- La densidad es compacta sin perder legibilidad.
- Mobile conserva una lectura limpia.
- No se rompieron componentes reutilizables.

## Regla final

No improvisar diseno. Priorizar claridad, orden, jerarquia, densidad util y consistencia con el ERP.
