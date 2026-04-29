## Peticiones de estilos (bitácora)

Registro cronológico de mejoras visuales aplicadas por petición, con foco en **trazabilidad** (qué se tocó y dónde),
sin mezclarlo con las reglas base.

### 2026-04-28 (documentación)

- **Índice padre único**: `docs/codex/README.md` con reglas por petición y mapa por tema.
- **Eliminados** `bases-estilos.md` y `estilos-base.md` (contenido redundante); rutas de código en `docs/codex/temas/implementacion-ui.md`.
- Referencias actualizadas en `AGENTS.md`, `manual-base-proyecto.md`, `estilos/README.md`, `ui-form-guidelines.md`, `temas/modo-basico-empleado.md`.

### 2026-04-28 (listado empleados)

- **Tabla listado**: `filtersEnabled=false` en `tabla-empleados.html` (sin barra global de busqueda/filtros del DataGrid; coincide con pedido original).

### 2026-04-29 (Ficha de Empleado)

- **Tipografía**: jerarquía alineada a `ui-form-guidelines.md` (`--erp-text-xs/sm/md`, `--erp-title-sm/md`) en hero, revisión por bloque, rejilla de datos y panel lateral.
- **Fondo**: página/host `#f8fafc`; títulos y franjas con barra `#f8fafc` (`section-head`, `detail-block-head`, cabecera `file-status-card`, franja tabs `file-tabs-wrap`, resumen superior `file-sheet-head`).
- **Iconos**: tamaños 14–16px (toolbar 14px, revisión/sección/título estado); Lucide `ClipboardList`, `FolderOpen`, `Activity` en Encabezados.
- **Archivos**: `ficha-empleado-container.{html,css,ts}`.

### 2026-04-29 (Ficha de Empleado — ajuste fino)

- **Secciones**: sin íconos en cabeceras de bloque; títulos sólo texto sobre franja gris.
- **Editar**: botón por sección más ligero (peso 500, `--erp-text-xs`), sin ícono; alineado a la derecha (`margin-left: auto`).
- **Panel lateral**: `gap` interno un poco menor; título sin ícono ni franja extra.
- **Copy**: `Fecha término`, `Tiempo de colación` en `detailItems`.

### 2026-04-27
- **Creación Básica de Empleado (modo básico)**:
  - Se agregó encabezado/ayuda del flujo básico (sin tocar lógica).
    - `src/app/features/empleados/components/form-empleado/form-empleado.html`
    - `src/app/features/empleados/components/form-empleado/form-empleado.css`
  - Se reorganizó el layout visual de “datos personales” en modo básico con grilla interna de 8 columnas (scoped a `.step-panel--basic`).
    - `src/app/features/empleados/components/secciones/datos-personales/datos-personales.css`

- **Documentación SQL (ligereza visual)**:
  - Se mejoró lectura/jerarquía de los README de base.
    - `bd/base/README.md`
    - `bd/base/v11/README.md`
