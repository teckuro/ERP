## Peticiones de estilos (bitácora)

Registro cronológico de mejoras visuales aplicadas por petición, con foco en **trazabilidad** (qué se tocó y dónde),
sin mezclarlo con las reglas base.

### 2026-04-28 (seguimiento)

- **Alta de colaborador (form-empleado, `styles.css` global)**:
  - `content-body`, `editor-footer` y grupo `flow-tabs` alineados a **max-width 56rem** y centrados; cabecera de pasos con más aire (`content-head` con flex centrado).
  - `summary-identity` con separación inferior más clara (`border-bottom` + padding).
- **Compartido empleados (`form-empleado-shared.css`)**:
  - Mayor `gap` en `employee-section-shell`, `employee-section-head` con línea inferior y `--compact` con `margin-top` 8px.
- **Contrato / Previsión**:
  - Anchos `labor-grid`, `relation-grid`, `prevision-grid` y `.prevision-shell` acotados a **56rem** donde correspondía.

### 2026-04-28

- **Documentación – bases de estilos**:
  - Se agregó la guía única `docs/codex/bases-estilos.md` (mapa de Markdown del repo, resumen de tokens/layout y enlaces).
  - Se actualizó `docs/codex/AGENTS.md`, `docs/codex/manual-base-proyecto.md`, `docs/codex/estilos-base.md`, `docs/codex/modo-basico-empleado.md` y `docs/codex/ui-form-guidelines.md` para enlazarla.

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
