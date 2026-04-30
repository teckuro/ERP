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

### 2026-04-30 (Creación básica — ficha en proceso)

- **Creación básica más clara y consistente**: se unificó el lenguaje a **empleado** en el modo básico, se cambió el CTA a **“Guardar ficha básica”**, se corrigieron acentos/copy, se agregó aviso informativo sutil del alcance, y se reordenaron secciones para separar **Contacto** como bloque propio. Además se corrigió el patrón de layout para evitar formularios demasiado anchos: **máximo 4 columnas en desktop (2 tablet, 1 móvil)** y secciones de 2 campos con **ancho contenido** (sin grilla 8 columnas). Finalmente se balanceó el layout para evitar vacío lateral: wrapper centrado **~1120px** y “Datos personales + Contacto” en **2 columnas** en desktop.
  - `src/app/features/empleados/components/form-empleado/form-empleado.{ts,html,css}`
  - `src/app/features/empleados/components/secciones/datos-personales/datos-personales.{html,css}`
  - Ajuste final: se evitó la duplicidad fuerte de título (“Crear empleado” arriba + “Nuevo empleado” dentro), se reforzó “Documento de identificación *” como **grupo** (RUT o pasaporte) y se redujo el texto inferior para que no duplique el encabezado.
  - Validaciones (UX): Email/Teléfono opcionales ya no muestran mensajes si están vacíos; placeholders pasaron a formato “Ej:” para no confundirse con datos reales.
  - **Reglas de maquetación**: se documentó el patrón de **CSS por capas** (scoping) para evitar estilos genéricos que se pisan entre modos/secciones.
  - **Reglas de maquetación**: se agregó la regla de **contenedor padre a límite inferior** (altura 100% + `minmax(0, 1fr)` cuando aplique).
  - Pulido de jerarquía: se eliminó el texto pequeño duplicado “Creación básica” dentro del bloque y el label quedó como “Pasaporte (opcional)”.
  - Alineación: el header interno “Creación básica [En proceso]” se alineó al mismo eje (`max-width`) que el formulario para evitar desconexión visual.

### 2026-04-30 (Listado empleados — acción integrada)

- **Acción “Crear empleado” integrada al DataGrid**: el CTA se movió al header del `app-data-grid` (patrón de `conceptos-remuneracion`), con menú Básico/Avanzado desplegable desde el mismo botón.
  - `src/app/features/empleados/containers/listado-empleados-container/listado-empleados-container.{html,ts}`
  - `src/app/features/empleados/components/tabla-empleados/tabla-empleados.{html,ts,css}`

### 2026-04-30 (Conceptos remuneración — toolbar)

- **Se quitó “Refrescar” del header de página** para evitar duplicidad: queda solo el refresco del `app-data-grid`.
  - `src/app/features/haberes-descuentos/containers/conceptos-remuneracion-container/conceptos-remuneracion-container.{html,ts}`

### 2026-04-30 (DataGrid — filtro rango fechas)

- **Filtro rango fecha más claro y seguro**: labels visibles “Desde/Hasta” (sin depender de placeholder), validación para impedir “Hasta < Desde”, acción “Limpiar” del rango, y soporte opcional `disallowFuture` para evitar fechas futuras (ej. fecha real de ingreso).
  - `src/app/shared/components/ui/data-grid.component.ts`
  - `src/app/features/empleados/components/tabla-empleados/tabla-empleados.ts`

### 2026-04-30 (Listado empleados — filtros sin chips)

- **Fila de chips de filtros activos parametrizable**: se agregó `filterChipsDisplay` al `app-data-grid` y en empleados se configuró para que los chips solo aparezcan si los filtros están ocultos (evita duplicidad).
  - `src/app/shared/components/ui/data-grid.component.ts`
  - `src/app/features/empleados/components/tabla-empleados/tabla-empleados.html`

### 2026-04-30 (DataGrid — filtros vs columnas ocultas)

- **Filtros consistentes al ocultar columnas**: `visibleFilters` ya no “revive” filtros de columnas ocultas como standalone; ahora respeta `column.showFilterWhenHidden` y limpia automáticamente el filtro al ocultar una columna si no debe mantenerse.
  - `src/app/shared/components/ui/data-grid.component.ts`
  - `src/app/features/empleados/components/tabla-empleados/tabla-empleados.ts`

### 2026-04-30 (Listado empleados — empty state y header)

- **Empty states contextuales + contador claro**: en empleados se diferenció “sin empleados” vs “sin resultados por filtros”, el header muestra `· N resultados` y opcional `· N filtros activos`, y el empty state se posicionó más arriba para evitar un centro vacío gigante. Botones: `Limpiar` se deshabilita si no hay filtros; `Aplicar` solo es primario/habilitado cuando hay cambios pendientes.
  - `src/app/shared/components/ui/data-grid.component.ts`
  - `src/app/features/empleados/components/tabla-empleados/tabla-empleados.{html,css}`
  - `src/app/features/empleados/containers/listado-empleados-container/listado-empleados-container.ts`

### 2026-04-30 (Listado empleados — popover crear empleado)

- **Popover “Crear empleado” anclado al botón**: el dropdown ahora se renderiza dentro del header del `app-data-grid` (anclado al CTA), no se dispara desde “Buscar”, y se cierra por click fuera, Escape, selección o navegación.
  - `src/app/shared/components/ui/data-grid.component.ts`
  - `src/app/features/empleados/components/tabla-empleados/tabla-empleados.{html,ts,css}`

- **Pulido visual del popover**: header con título en casing normal, sombra liviana, separador sutil, opciones 100% clickeables, hover suave e ícono “+” a la derecha dentro de contenedor.
  - `src/app/features/empleados/components/tabla-empleados/tabla-empleados.{html,css}`

- **Ajuste final de ancho/offset**: popover en ~296px (rango 280–300) y separación de 8px bajo el botón, manteniendo `max-width` responsivo.
  - `src/app/features/empleados/components/tabla-empleados/tabla-empleados.css`

### 2026-04-30 (Creación avanzada — maquetación limpia)

- **Creación avanzada alineada a patrón de creación básica** (sin tocar lógica): se aplicó **ancho controlado** (~1120px) con header interno alineado al eje del formulario, y se agregó un encabezado liviano “Datos completos del empleado” con descripción del alcance del alta avanzada.
  - `src/app/features/empleados/components/form-empleado/form-empleado.{ts,html,css}`
- **Grillas de captura sin 8 columnas**: se eliminaron las grillas `repeat(8, ...)` en los componentes del flujo avanzado y se estandarizó a **máximo 4 columnas en desktop (2 tablet, 1 móvil)** con spans moderados.
  - `src/app/features/empleados/components/secciones/datos-personales/datos-personales.css`
  - `src/app/features/empleados/components/secciones/contacto/contacto.css`
  - `src/app/features/empleados/components/secciones/contrato/contrato.css`
  - `src/app/features/empleados/components/secciones/prevision-salud/prevision-salud.css`
  - `src/app/features/empleados/components/secciones/bancario/bancario.css`
- **Pulido stepper + primer paso (Datos personales)**: se bajó el ruido del stepper (el **nombre del paso** es principal; el estado queda como **badge** secundario) y se evitó el quiebre desordenado en dos filas usando **scroll horizontal**. Además el paso 1 ahora incluye **Contacto (Email/Teléfono)** junto a Identificación/Nombre/Datos personales, manteniendo el mismo patrón de tarjetas limpio.
  - `src/app/features/empleados/components/form-empleado/form-empleado.{ts,html,css}`
  - `src/app/features/empleados/components/secciones/datos-personales/datos-personales.html`
  - `src/app/features/empleados/models/empleado-form.manifest.ts`
  - Ajuste UX: se agregó encabezado contextual del paso (**“Paso X de 9 · …”** + descripción breve) y se ocultó la scrollbar del stepper para que el overflow horizontal se sienta más limpio.
  - **Wrapper estable del wizard avanzado**: se creó una estructura de layout con clases dedicadas (`advanced-create-shell/inner`, `advanced-wizard-layout`, `advanced-wizard-map`, `advanced-wizard-content`, `advanced-wizard-footer`) para centralizar la maquetación del flujo avanzado y evitar ajustes aislados por bloque. En desktop se habilita el panel lateral **“Mapa de ficha”** (2 columnas) y en tablet/móvil se oculta para mantener lectura en una columna.

### 2026-04-30 (Creacion avanzada - Mapa de ficha como navegacion desktop)

- **Navegacion avanzada sin duplicidad**: en desktop el panel lateral **Mapa de ficha** queda como navegacion principal y el stepper horizontal se reserva para tablet/movil.
  - `src/app/features/empleados/components/form-empleado/form-empleado.{html,css}`
- **Estados visuales menos alarmantes**: se agrego estado visual **Actual**, resumen de pendientes/errores en el mapa y se evita pintar pasos no intentados como **Con errores** desde el inicio; el rojo queda limitado al badge/borde sutil cuando corresponde.
  - `src/app/features/empleados/components/form-empleado/form-empleado.{ts,html,css}`

### 2026-04-30 (Creacion avanzada - Mapa de ficha timeline)

- **Mapa de ficha como guia visual**: se agrego progreso por posicion del paso, porcentaje, resumen corto y timeline vertical con linea sutil, numeros y estados secundarios.
  - `src/app/features/empleados/components/form-empleado/form-empleado.{ts,html,css}`
- **Jerarquia del contenido derecho**: el encabezado contextual del paso queda primero y "Datos completos del empleado" pasa a bloque introductorio secundario con fondo neutro.
  - `src/app/features/empleados/components/form-empleado/form-empleado.{html,css}`

### 2026-04-30 (Creacion avanzada - refinamiento visual del timeline)

- **Acabado visual del Mapa de ficha**: se reforzo la lectura de timeline con linea vertical mas legible, estado activo integrado, hover/focus visibles y progreso con texto "N% completado" dentro del bloque.
  - `src/app/features/empleados/components/form-empleado/form-empleado.{html,css}`
- **Bloque informativo secundario**: se suavizo la tarjeta "Datos completos del empleado" con borde/fondo mas livianos y menor altura visual.
  - `src/app/features/empleados/components/form-empleado/form-empleado.css`

### 2026-04-30 (Creacion avanzada - timeline sin bordes pesados)

- **Mapa de ficha mas integrado**: se quitaron marcos visibles del panel y de los items, dejando un riel de timeline, fondos suaves y acentos laterales para evitar apariencia de tarjetas genericas.
  - `src/app/features/empleados/components/form-empleado/form-empleado.css`
- **Bloque informativo sin caja marcada**: "Datos completos del empleado" queda como banda secundaria con acento lateral, sin borde rectangular.
  - `src/app/features/empleados/components/form-empleado/form-empleado.css`
