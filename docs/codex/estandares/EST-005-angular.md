# EST-005 — Estándar Angular

**ERP Remuneraciones Chile**

Versión: 1.0  
Estado: Obligatorio  
Última revisión: 2026-07-02

## Objetivo

Normar estructura de features, contenedores, pages, componentes, signals, grillas server-side y CSS local NOIA en el frontend Angular standalone del ERP.

Complementa [EST-004 — TypeScript](./EST-004-typescript.md) (capas TS) y [`arquitectura/frontend-interfaces.md`](../arquitectura/frontend-interfaces.md) (contrato inglés pages/containers). UI visible: [`diseno/noia-ui-manual.md`](../diseno/noia-ui-manual.md) prevalece sobre este estándar.

---

## Pages vs containers

### Page (`src/app/pages/`)

- Wrapper **delgado**: ruta, título de breadcrumb, imports del contenedor.
- Sin lógica de negocio ni llamadas Supabase.
- Nombre: `<ruta>.page.ts` (`nomina-mensual.page.ts`).

### Container (`src/app/features/<feature>/containers/`)

- Orquesta servicios, signals de pantalla, overlays y composición de hijos.
- Un contenedor principal por flujo (`nomina-mensual-v2-container/`, `ficha-empleado-container/`).
- Puede tener subcarpeta `facade/`, `components/`, `models/` (VM locales).

```text
src/app/pages/nomina-mensual-v2.page.ts   → importa contenedor
src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/
```

Regla: **la page no crece**; si crece, mover lógica al contenedor o service.

---

## Estructura de `features/`

```text
src/app/features/<feature-kebab>/
├── containers/
│   └── <feature>-container/
│       ├── <feature>-container.component.ts|html|css
│       ├── components/          # hijos de pantalla (pasos, modales)
│       └── facade/                # ports/orquestación interna
├── components/                  # piezas reutilizables dentro del feature
├── services/
├── data-access/                 # repositories
├── mappers/
├── models/
├── rules/
├── presenters/                  # VM grillas/formas complejas
├── utils/
└── catalogs/                    # opciones estáticas UI
```

Referencias canónicas:

| Feature | Patrón |
|---------|--------|
| **Empleados** | `ficha-empleado-container`, secciones, expediente, CSS local `form-empleado-shared.css` |
| **Nómina mensual v2** | stepper por pasos, presenters de grilla, `nomina-mensual-v2-sesion.service.ts` |

---

## Componentes standalone

- Todos los componentes nuevos: `standalone: true`.
- Imports explícitos en `@Component({ imports: [...] })`.
- Selector: prefijo `app-` + kebab-case (EST-001).
- Inputs/outputs tipados; preferir `input()` / `output()` cuando el módulo ya lo adopta.

### Jerarquía NOIA obligatoria

Layout base ([`AGENTS.md`](../AGENTS.md)):

```text
Header (breadcrumb + título)
Botonera (secundario | primario, arriba derecha)
Contenido (formulario | tabla | bitácora | panel)
```

No botonera duplicada abajo; no cards por defecto ([`noia-ui-guardrails.md`](../diseno/noia-ui-guardrails.md)).

---

## Signals y estado

- Estado de pantalla compartido: signals en contenedor o service de sesión.
- Derivados: `computed()` en contenedor o rules; no recomputar en template.
- Efectos (`effect`) solo para side effects acotados (persistir preferencia, foco).
- Evitar `BehaviorSubject` en código nuevo salvo integración legacy RxJS.

Ejemplo de referencia: señales de paso y trazabilidad en `nomina-mensual-v2`.

---

## `app-data-grid` y `serverSide`

Grillas de alto volumen usan el componente compartido con paginación server-side.

### Cuándo

- Listados > 50 filas o filtrado/paginación en RPC (`listar_*`).
- Paso Dotación nómina v2 (`nomina-mensual-v2-paso-dotacion`).

### Patrón

1. **Presenter** define columnas, filtros y mapeo fila → celda (`nomina-dotacion-grid.presenter.ts`).
2. **Repository/service** expone `listar*` con `p_page`, `p_page_size`, `p_busqueda`.
3. **Template**:

```html
<app-data-grid
  [columns]="columnas()"
  [serverSide]="true"
  [totalRowCount]="total()"
  (pageChange)="onPageChange($event)"
  ...
/>
```

Reglas:

- No cargar todo el universo en memoria si existe RPC paginada.
- Mantener altura y densidad compacta ([`ui-form-guidelines.md`](../ui-form-guidelines.md)).
- Copy de columnas en lenguaje RRHH; sin nombres técnicos de BD.

---

## CSS local NOIA

### Obligatorio

- Estilos por componente: `.component.css` junto al `.ts`.
- CSS compartido **dentro del feature** (`form-empleado-shared.css`, prefijos de módulo).
- Reutilizar tokens y patrones existentes antes de inventar utilidades.

### Prohibido (sin fase explícita)

- Modificar estilos globales: `src/styles.css`, `theme.css`, `tailwind.css`, etc.
- Cambiar `angular.json`, `postcss.config.*`, `tailwind.config.*`.
- Introducir fuentes, paletas nuevas, gradientes, sombras fuertes.
- Volcar muros de utilidades Tailwind en HTML si el módulo usa CSS local estructurado.

Registrar cambios visuales en [`peticiones-estilos.md`](../peticiones-estilos.md) (EST-007).

---

## Formularios

- Labels visibles arriba del control; placeholder no sustituye label.
- `formControlName` estable: **no cambiar** en fases solo UI ([`erp-protected-files`](../../.cursor/rules/erp-protected-files.mdc)).
- Fechas: `app-calendar-input`; ISO interno, display `dd/mm/aaaa` cuando aplique.
- Validación: error junto al campo; resumen superior si hay múltiples errores.

Guía: [`ui-form-guidelines.md`](../ui-form-guidelines.md).

---

## Servicios y routing

- Rutas lazy por feature en configuración de app (no tocar guards globales sin fase).
- Services de feature inyectados en contenedor; componentes hijos reciben datos por inputs.
- Facade/port cuando el contenedor supera ~300 LOC de orquestación (`nomina-mensual-v2-orquestador.port.ts`).

---

## Anti-patrones Angular

| Anti-patrón | Alternativa |
|-------------|-------------|
| Lógica Supabase en componente | repository + service |
| Page con 500 LOC | contenedor + presenter |
| `@Input()` sin tipo | interfaces en `models/` |
| Grilla client-side de miles de filas | `serverSide` + RPC `listar_*` |
| Card por cada sección | franja operativa, tabla, bitácora NOIA |
| Título hero enorme | jerarquía compacta ERP |
| Duplicar acción primaria | una acción principal por zona |
| Texto técnico (`id_nomina_periodo`) visible | copy RRHH |
| Cambiar guardado en fase visual | solo CSS/copy/layout |

---

## Tests

- Spec por contenedor crítico y reglas/presenters (`*.spec.ts` junto al archivo).
- No omitir tests del módulo por conveniencia ([EST-008](./EST-008-ia.md)).
- Playwright/E2E solo si el módulo ya define specs.

---

## Relación con otras capas

| Tema | Documento |
|------|-----------|
| Capas TS | [EST-004](./EST-004-typescript.md) |
| Nomenclatura | [EST-001](./EST-001-nomenclatura-tecnica.md) |
| UI NOIA | [`noia-ui-manual.md`](../diseno/noia-ui-manual.md) |
| Contrato agente | [`AGENTS.md`](../AGENTS.md) |
| Documentación | [EST-007](./EST-007-documentacion.md) |
| Agente IA | [EST-008](./EST-008-ia.md) |

---

## Checklist de cierre

- [ ] Page delgada; lógica en contenedor/service.
- [ ] Estructura `features/` respeta carpetas estándar.
- [ ] Componentes standalone; selector `app-*`.
- [ ] Layout header / botonera / contenido NOIA.
- [ ] Grillas voluminosas con `app-data-grid` + `serverSide` cuando corresponde.
- [ ] CSS local; sin tocar estilos globales.
- [ ] Copy RRHH; sin nombres técnicos visibles.
- [ ] Cambio visual registrado en `peticiones-estilos.md`.
- [ ] Tests del alcance ejecutados.
- [ ] Autorevisión [`noia-ui-review-checklist.md`](../diseno/noia-ui-review-checklist.md).
