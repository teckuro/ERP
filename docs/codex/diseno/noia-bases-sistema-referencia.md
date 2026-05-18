# NOIA — bases del sistema (referencia canónica)

Fase: `ERP-NOIA-UI-GUARDRAILS-01`  
Fuente unica de decision: [`noia-ui-manual.md`](./noia-ui-manual.md). Este documento solo define referencias canonicas del repo y que copiar segun arquetipo.
Documento que **unifica** dónde están las bases reales del ERP y **qué copiar** antes de inventar UI. La implementación de referencia principal es **Creación avanzada de empleados** (Bitácora laboral).

---

## 1. Jerarquía documental (fuente de verdad)

| Prioridad | Documento | Qué define |
|-----------|-----------|------------|
| 1 | [`../AGENTS.md`](../AGENTS.md) | Contrato agente: layout header/botonera, tokens resumidos, densidad, anti‑patrones |
| 2 | [`../ui-form-guidelines.md`](../ui-form-guidelines.md) | Tokens completos, inputs, MessageBox, formularios |
| 3 | [`./bitacora-operativa-noia.md`](./bitacora-operativa-noia.md) | Identidad Bitácora Operativa, paleta `--erp-*`, arquetipos A–E, gramática por módulo |
| 4 | [`./noia-ui-guardrails.md`](./noia-ui-guardrails.md) | Reglas obligatorias y criterio de aprobación |
| 5 | [`./noia-antipatrones-ia.md`](./noia-antipatrones-ia.md) | Qué rechazar (color, espacio, IA/SaaS) |
| 6 | Módulo | p. ej. [`../modulos/empleados/creacion-avanzada.md`](../modulos/empleados/creacion-avanzada.md) |

**No** mezclar paletas ni layouts de internet. **Sí** copiar del repo.

---

## 2. Dos capas de tokens (coherentes entre sí)

### A. Tokens ERP / formularios (`AGENTS` + `ui-form-guidelines`)

Uso transversal: inputs, botones de página, cards del shell cuando aplica.

```txt
Primario:     #2563EB  →  hover #1D4ED8  →  soft #EFF6FF
Fondo:        #F8FAFC
Superficie:   #FFFFFF
Borde:        #E5E7EB
Texto:        #111827 / secundario #6B7280
Error:        #DC2626   Warning: #F59E0B   Success: #16A34A
Espaciado:    4 · 8 · 12 · 16 · 24 · 32 px
```

En código compartido empleados: variables `--form-*` en [`form-empleado-shared.css`](../../../src/app/features/empleados/components/form-empleado-shared.css).

### B. Tokens Bitácora (`bitacora-operativa-noia` + Creación avanzada)

Uso: flujos guiados, mapa lateral, estados de paso, fondos cálidos neutros.

Definidos en documento [`bitacora-operativa-noia.md`](./bitacora-operativa-noia.md) como `--erp-*` y **materializados** en:

[`form-empleado.css`](../../../src/app/features/empleados/components/form-empleado/form-empleado.css) → bloque `.advanced-create-shell`:

```css
--bitacora-bg: #f6f7f4;
--bitacora-surface: #ffffff;
--bitacora-surface-soft: #fafaf7;
--bitacora-border: #dadfd7;
--bitacora-ink: #243b53;
--bitacora-text: #172033;
--bitacora-muted: #647084;
--bitacora-subtle: #8a94a6;
--bitacora-primary: #2563eb;
--bitacora-primary-soft: #eff6ff;
--bitacora-ok: #166534;
--bitacora-ok-soft: #f0fdf4;
--bitacora-danger: #b91c1c;
--bitacora-danger-soft: #fef2f2;
--bitacora-review-soft: #fffbeb;
```

**Regla:** en un módulo nuevo de flujo guiado, **reutilizar estos nombres y valores** en CSS local del contenedor (prefijo del módulo), no inventar `--nom-*` o hex distintos sin fase documentada.

---

## 3. Referencia canónica: Creación avanzada (Bitácora laboral)

| Concepto NOIA | Implementación |
|---------------|----------------|
| Arquetipo | **C. Expediente** — [`bitacora-operativa-noia.md` §13.C](./bitacora-operativa-noia.md) |
| Gramática módulo | **Bitácora laboral** — alta guiada, ficha en construcción |
| Doc funcional/UX | [`../modulos/empleados/creacion-avanzada.md`](../modulos/empleados/creacion-avanzada.md) |

### Archivos a leer antes de maquetar otro flujo guiado

| Archivo | Rol |
|---------|-----|
| `src/app/features/empleados/components/form-empleado/form-empleado.css` | Layout wizard, mapa, tokens `--bitacora-*`, gaps |
| `src/app/features/empleados/components/form-empleado/form-empleado.html` | Estructura: breadcrumb, card editor, mapa + paso |
| `src/app/features/empleados/components/form-empleado-shared.css` | Bloques de paso: `.employee-section-*`, `.employee-block` |
| `src/app/features/empleados/components/form-empleado/form-empleado.wizard.css` | Detalle wizard (si aplica) |
| `src/app/features/empleados/components/form-empleado/form-empleado.feedback.css` | Feedback / estados locales |

### Layout (copiar proporciones, no reinventar)

```txt
.advanced-create-header / .advanced-wizard-layout
  grid: 268px (mapa) | 1fr (contenido)
  gap: 14px
  padding shell: 8px
  borde contenedor: 1px var(--bitacora-border)
  radius contenedor: 10px
  fondo shell: var(--bitacora-bg)

.advanced-wizard-map (sticky)
  mapa de ficha: progreso, pasos, estados (activo / completo / pendiente)
  título mapa: ~0.86rem, peso 650 — NO títulos hero

.advanced-wizard-map__item
  estado activo: borde/fondo primary-soft
  completo: ok-soft / verde sobrio
  sin border-left decorativo grueso
```

### Breadcrumb operativo (obligatorio)

El breadcrumb es parte del header base del ERP. Debe existir en pantallas nuevas o redisenadas antes del titulo visible.

Copiar de las referencias reales:

| Referencia | Que copiar |
|------------|------------|
| `docs/codex/AGENTS.md` | Breadcrumb arriba a la izquierda, titulo y botonera separados |
| `docs/codex/ui-form-guidelines.md` | Orden responsive: breadcrumb, titulo, botonera, contenido |
| `form-empleado.html` | Breadcrumb de expediente / alta guiada |
| `proceso-mensual-container.html` | Breadcrumb de mesa operativa de periodo |

Reglas:

- usar dominio y flujo en lenguaje de negocio: `Remuneraciones / Preparar nomina`;
- navegar solo segmentos anteriores; la vista actual queda como texto;
- mantener color, tamano y peso secundarios;
- no meterlo en card, badge, chip ni boton principal;
- no mostrar rutas tecnicas, tablas, RPC, enums ni codigos internos.

### Patrones de paso (contenido)

```txt
.employee-section-head     → kicker + título ~18px/600 + copy una línea
.employee-block            → borde 8px, sin sombra, padding compacto
.employee-block--subtle    → fondo #f8fafc / bitacora-bg
```

Documentado en fases: `EMP-ADV-LAYOUT-CONSISTENCY-01`, `EMP-PERFIL-LABORAL-UI-01-POLISH`, `EMP-CONDICIONES-ESPECIALES-UX-01` dentro de `creacion-avanzada.md`.

### Acciones y validación (NO tarjetas fijas de error)

| Patrón | Creación avanzada |
|--------|-------------------|
| Acción principal | `Finalizar alta` / `Siguiente` — una intención dominante por momento |
| Secundarias | `Guardar borrador`, navegación — agrupadas, sin competir en azul |
| Validación | `app-message-box` al actuar; **no** card permanente duplicando el mapa |
| Copy | «Datos obligatorios pendientes», «Advertencias de revisión» — no «bloqueo» técnico |

### Qué NO hace Creación avanzada (tampoco hacerlo en otros módulos)

- Cards por cada campo o cada validación.
- Mapa lateral que compite en tamaño con el formulario (268px fijo + contenido flexible).
- Pasos cortos con `min-height` inflado solo para “igualar” altura.
- Honorarios / casos «no aplica» sin comunicar `Solo si aplica` / `No requerido`.

---

## 4. Referencia secundaria: Preparar nómina (mesa operativa)

Para **cierre de período**, **consola de decisión** y **bandeja de severidad** (arquetipo **A. Mesa operativa**):

| Prefijo CSS | Contenedor |
|-------------|------------|
| `payroll-*` | [`proceso-mensual-container.css`](../../../src/app/features/nomina-mensual/containers/proceso-mensual-container/proceso-mensual-container.css) |

Estructura: bitácora lateral + consola central + bandeja RRHH + modal diagnóstico.  
Doc: [`../modulos/nomina-mensual/preparar-nomina/`](../modulos/nomina-mensual/preparar-nomina/README.md).

**Cuándo usar cuál referencia:**

| Tipo de pantalla | Copiar de |
|------------------|-----------|
| Wizard / alta / ficha en construcción / pasos | **Creación avanzada** (`advanced-*`, `--bitacora-*`, `employee-*`) |
| Cierre período / validar / diagnóstico / acta | **Preparar nómina** (`payroll-*`) |
| Listado + filtros + tabla | Listado empleados / movimientos (patrón B) |
| Parámetros por tabs | Parámetros (patrón D) |

---

## 5. Tipografía del sistema (no ampliar)

| Elemento | Creación avanzada (real) | Máximo NOIA |
|----------|--------------------------|-------------|
| Título mapa / sección | 0.86rem – 18px | 20–22px vista; 14–15px sección |
| Label / kicker | 11–12px, peso 600 | 12px |
| Cuerpo / ayuda | 13px, line-height 20px | 13–14px |
| Título “hero” | **No existe** | Prohibido |

Fuente: `var(--erp-font-sans)` / sistema — ver `form-empleado-shared.css`.

---

## 6. Checklist «¿estoy alineado al sistema?»

Antes de proponer CSS/HTML nuevo:

1. ¿Es flujo guiado tipo expediente? → Abrir `form-empleado.css` y copiar grid + `--bitacora-*`.
2. ¿Es mesa de período? → Abrir `proceso-mensual-container.css`.
3. ¿Los hex salen de las tablas §2 A o B? → Si no, **parar**.
4. ¿Padding ≤ 16px en paneles rutinarios? → Si no, compactar.
5. ¿Un CTA azul dominante por zona? → Si hay dos, consolidar.
6. ¿MsgBox en lugar de card de alerta fija? → En flujos tipo creación avanzada, sí.

---

## 7. Enlaces rápidos

- Guardrails: [`noia-ui-guardrails.md`](./noia-ui-guardrails.md)
- Antipatrones: [`noia-antipatrones-ia.md`](./noia-antipatrones-ia.md)
- Manual UI: [`noia-ui-manual.md`](./noia-ui-manual.md)
- Prompt Cursor: [`noia-prompt-cursor.md`](./noia-prompt-cursor.md)
