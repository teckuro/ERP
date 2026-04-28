# Bases de estilos del ERP (guía única)

Este documento es el **punto de entrada** para entender cómo se ve y se construye la interfaz de este proyecto: resume principios, tokens, layout y dónde está cada cosa. Las guías detalladas siguen en los archivos enlazados; aquí no se sustituyen, se **ordenan y contextualizan**.

---

## Mapa de Markdown del repositorio

### Contrato visual y UI (leer primero para pantallas)

| Documento | Rol |
|-----------|-----|
| [`AGENTS.md`](./AGENTS.md) | Contrato para Codex: stack, tokens, layout obligatorio, anti‑patrones, checklist UI. |
| **`bases-estilos.md` (este archivo)** | Resumen único + mapa de docs + implementación (CSS/componentes). |
| [`ui-form-guidelines.md`](./ui-form-guidelines.md) | Fuente detallada: tokens, formularios, MessageBox, loading, checklist. |
| [`ui-button-guidelines.md`](./ui-button-guidelines.md) | Variantes, tamaños y uso de botones / toolbar. |
| [`manual-base-proyecto.md`](./manual-base-proyecto.md) | Orden de lectura del proyecto + **regla tipográfica base** (pesos contenidos). |
| [`modo-basico-empleado.md`](./modo-basico-empleado.md) | Reglas del modo básico de empleados (no duplica tokens globales). |
| [`peticiones-estilos.md`](./peticiones-estilos.md) | Bitácora de mejoras visuales pedidas (no es normativa base). |
| [`estilos-base.md`](./estilos-base.md) | Atajo: enlaza a esta guía y a la bitácora de peticiones. |

### Flujos y arquitectura (no son guía de tokens)

| Documento | Rol |
|-----------|-----|
| [`base-angular-empleados.md`](./base-angular-empleados.md) | Cómo crear módulos Angular al estilo del repo. |
| [`crear-menu-base.md`](./crear-menu-base.md) | Menú lateral y rutas. |
| [`flujo-edicion-ficha-empleado.md`](./flujo-edicion-ficha-empleado.md) | Flujo de ficha empleado. |
| [`sync-parametros-v611.md`](./sync-parametros-v611.md) | Parámetros v611. |

### Raíz y bases de datos / infra

| Documento | Rol |
|-----------|-----|
| [`README.md`](../../README.md) | Visión del producto y stack. |
| [`SUPABASE_SETUP.md`](../../SUPABASE_SETUP.md) | Configuración Supabase. |
| [`bd/README.md`](../../bd/README.md), [`bd/base/README.md`](../../bd/base/README.md), [`bd/base/v11/README.md`](../../bd/base/v11/README.md) | SQL y ejecución de esquema (no UI). |
| [`bd/insert/README.md`](../../bd/insert/README.md), [`bd/python/README.md`](../../bd/python/README.md) | Insert/scripts auxiliares. |

---

## Orden de lectura recomendado (UI nueva o refino visual)

1. [`AGENTS.md`](./AGENTS.md)
2. **`bases-estilos.md`** (este archivo)
3. [`ui-form-guidelines.md`](./ui-form-guidelines.md)
4. [`ui-button-guidelines.md`](./ui-button-guidelines.md)
5. Si aplica: [`manual-base-proyecto.md`](./manual-base-proyecto.md) (tipografía)
6. Si aplica al flujo: [`modo-basico-empleado.md`](./modo-basico-empleado.md)

En caso de conflicto numérico entre documentos, manda la prioridad definida en [`AGENTS.md`](./AGENTS.md) (allí `ui-form-guidelines.md` prevalece sobre detalles dispersos).

---

## Stack y dirección visual

- **Angular** standalone, **Tailwind** donde corresponda, **componentes reutilizables** en `shared`.
- Estética **enterprise** (SAP/Fiori/SaaS sobrio): neutros dominantes, azul solo para foco y acción principal, sin gradientes decorativos ni saturación innecesaria.
- **Alta densidad legible**: compacto pero ordenado; evitar aire artificial.

---

## Tokens esenciales (resumen)

Los valores completos y matices están en [`ui-form-guidelines.md`](./ui-form-guidelines.md) y [`AGENTS.md`](./AGENTS.md). Referencia rápida:

**Colores**

- Primario `#2563EB`, hover `#1D4ED8`, soft `#EFF6FF`
- Fondo `#F8FAFC`, superficie `#FFFFFF`, borde `#E5E7EB`
- Texto `#111827` / secundario `#6B7280` / deshabilitado `#9CA3AF`
- Estados: error `#DC2626`, warning `#F59E0B`, success `#16A34A`, info `#0EA5E9`

**Espaciado** (usar solo estos saltos; ver guía para lista extendida si incluye `2px`/`3px`)

- `4`, `8`, `12`, `16`, `24`, `32` px según [`ui-form-guidelines.md`](./ui-form-guidelines.md)

**Radios**

- Controles compactos `5–6px`; cards hasta `8px` (sin exagerar).

---

## Tipografía (regla base del proyecto)

Definida en [`manual-base-proyecto.md`](./manual-base-proyecto.md):

- Evitar **bold/700** como peso por defecto en labels, tabs, badges y texto de soporte.
- Preferir **500–600** en controles y jerarquías menores.
- Reservar pesos muy altos solo al **dato protagonista** de la vista.
- Si la pantalla se ve “pesada”, bajar peso tipográfico antes de sumar espacio o color.

---

## Layout ERP obligatorio

Toda pantalla tipo ERP debe mantener:

1. **Header**: breadcrumb arriba a la izquierda; título de la vista.
2. **Botonera**: fila separada bajo el header, alineada a la derecha; orden **secundario → primario**.
3. **Contenido**: una superficie principal clara (card/bloque protagonista) con el formulario, tabla o vista principal.

No colocar la botonera principal abajo del contenido ni duplicar la acción primaria. Detalle y anti‑patrones: [`AGENTS.md`](./AGENTS.md).

Referencia de implementación citada en las guías:

- `src/app/features/empleados/components/form-empleado/form-empleado.html`
- `src/styles.css` (bloque `app-form-empleado`, tabs, cards, loading overlay).

---

## Formularios

Resumen alineado con [`ui-form-guidelines.md`](./ui-form-guidelines.md):

- Labels **siempre visibles** arriba del control; **no** usar placeholder como label.
- Por defecto **una columna**; dos columnas solo si mejora lectura.
- Agrupar por contexto y secuencia lógica; secciones internas dentro de la card principal.
- Validación junto al campo; resumen superior si hay muchos errores.
- Selects de catálogo con **búsqueda** cuando hay muchas opciones o búsqueda por texto.
- Fechas: escritura guiada `dd/mm/aaaa`; valor interno ISO si el modelo lo exige.
- Controles complejos (calendario, select con panel) deben **empatar altura** visual con inputs base.

**Grillas internas**: si se usa una grilla de **8 columnas** para alinear campos cortos, debe respetar el **orden DOM** y estar acotada al flujo/pantalla (ej. modo básico documentado en [`modo-basico-empleado.md`](./modo-basico-empleado.md)).

---

## Botones

Resumen; detalle en [`ui-button-guidelines.md`](./ui-button-guidelines.md):

- Variantes: primary, secondary/outline, danger, ghost (según guía).
- Acción primaria **única**; orden visual `[Secundario] [Primario]`.
- Toolbars: preferir `app-page-actions`; botones icono+texto alineados con utilidades compartidas (`erp-toolbar-button` en `src/styles.css` cuando aplique).

---

## Componentes y mensajes

- **Mensajes / estados**: `app-message-box` (variantes y modos según [`ui-form-guidelines.md`](./ui-form-guidelines.md)).
- **Loading**: contextual (en tabla vs pantalla); no bloquear toda la vista si solo cambia un fragmento.

---

## Dónde vive el CSS “padre”

| Ubicación | Uso |
|-----------|-----|
| [`src/styles.css`](../../src/styles.css) | Tokens globales, layout shell, patrones ERP compartidos (incl. formulario empleados). |
| [`src/app/shared/components/ui/`](../../src/app/shared/components/ui/) | Componentes UI reutilizables: preferir estos antes que CSS ad hoc por pantalla. |
| CSS por feature/componente | Solo lo específico del flujo; idealmente **scoped** para no romper otras vistas. |

---

## Responsive

- Mantener lectura **vertical** clara.
- En mobile: breadcrumb → título → botonera → contenido en una columna.
- Sin contenidos cortados, controles desbordados ni textos superpuestos.

---

## Mejoras de estilo pedidas (bitácora)

No son reglas nuevas: solo **historial** de cambios por petición:

- [`peticiones-estilos.md`](./peticiones-estilos.md)

---

## Regla final

No improvisar diseño: claridad, orden, jerarquía, densidad útil y consistencia con el ERP. Si falta un caso, primero revisar [`ui-form-guidelines.md`](./ui-form-guidelines.md) y [`AGENTS.md`](./AGENTS.md); después implementar con componentes existentes.
