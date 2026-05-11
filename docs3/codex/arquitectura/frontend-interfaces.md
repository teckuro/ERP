# Contrato de arquitectura frontend (Angular ERP)

**Idioma del cuerpo:** ingles (contrato fuente). **Alcance:** paginas, contenedores, componentes, servicios, repositorios, reglas y modelos Angular.

**Jerarquia:** complementa `docs/codex/AGENTS.md` y `ui-form-guidelines.md`; si hay conflicto con layout o tokens ERP del proyecto, prevalece `AGENTS.md` y las guias del modulo.

**Cuando leerlo:** antes de crear o modificar de forma sustancial rutas en `src/app/pages/`, un contenedor en `src/app/features/`, o la estructura de un feature.

---

# ERP UI/Frontend Architecture Contract for Cursor

## Purpose

This document defines the mandatory frontend architecture for the ERP project.

Cursor/Codex must read this document before creating or modifying any Angular interface, route, page, container, component, service, repository, rule or model.

This contract exists because the project must avoid inline pages, generic CRUD screens and uncontrolled visual/layout changes.

The ERP must be:

```txt
Complejo por dentro, claro por fuera, trazable siempre, guiado por estados, pendientes y acciones.
```

In practical terms:

```txt
Functional phase complete.
Minimal correct UI.
Final visual polish later in a single UX phase.
```

---

## Current src architecture observed

The current `src/app` structure is organized around these areas:

```txt
src/app/config
src/app/core
src/app/core/models
src/app/core/services
src/app/features
src/app/layout
src/app/pages
src/app/shared
src/app/shared/components/ui
src/app/supabase
```

The strongest feature patterns currently exist in:

```txt
src/app/features/empleados
src/app/features/haberes-descuentos
src/app/features/parametros-generales
src/app/features/movimientos-variables
```

Observed feature subfolders:

```txt
catalogs/
components/
containers/
data-access/
mappers/
models/
rules/
services/
store/
utils/
```

Not every feature needs every folder. Use only what the feature needs.

---

## Architecture diagnosis

### Good pattern already present

These pages are good wrappers:

```txt
src/app/pages/conceptos-remuneracion.page.ts
src/app/pages/haberes-descuentos.page.ts
```

They only import and render a container:

```txt
src/app/features/haberes-descuentos/containers/conceptos-remuneracion-container/
src/app/features/haberes-descuentos/containers/haberes-descuentos-container/
```

This is the pattern to follow.

### Strong feature examples

`empleados` is the strongest full feature example:

```txt
src/app/features/empleados/catalogs
src/app/features/empleados/components
src/app/features/empleados/containers
src/app/features/empleados/data-access
src/app/features/empleados/mappers
src/app/features/empleados/models
src/app/features/empleados/services
src/app/features/empleados/store
src/app/features/empleados/utils
src/app/features/empleados/empleados.routes.ts
```

`haberes-descuentos` has a good domain pattern:

```txt
containers/
data-access/
models/
rules/
services/
```

`parametros-generales` has a good feature pattern:

```txt
components/
containers/
data-access/
models/
services/
store/
parametros-generales.routes.ts
```

`movimientos-variables` currently has a good backend/domain foundation:

```txt
data-access/
models/
rules/
services/ if present in current branch
containers/ if UI phase has been applied
```

### Current architecture debt

Some route pages currently contain large inline UI, demo arrays, hardcoded data or complex logic.

Examples detected:

```txt
src/app/pages/dashboard.page.ts
src/app/pages/licencias-medicas.page.ts
src/app/pages/reportes.page.ts
src/app/pages/proceso-remuneraciones.page.ts
src/app/pages/liquidaciones.page.ts
src/app/pages/detalle-liquidacion.page.ts
src/app/pages/parametros.page.ts
```

This is legacy/debt.

Do not copy this pattern.

Do not add more complexity to those pages.

When a phase touches one of those pages, migrate to a container if the phase changes UI structure, logic, data or business behavior.

---

## Mandatory rule: pages are wrappers

New complex interfaces must NOT be built directly inside:

```txt
src/app/pages/*.page.ts
```

A page file must be a lightweight route wrapper.

Allowed in `pages/*.page.ts`:

```txt
- import the real container
- declare standalone component
- import the container
- render container selector
- minimal route/page metadata
```

Forbidden in `pages/*.page.ts`:

```txt
- long inline HTML
- inline forms
- full tables
- DataGrid setup
- arrays demo
- hardcoded normative data
- business rules
- calculations
- validation logic
- Supabase calls
- repository calls
- service orchestration
- CSS classes for full screen layout
- modal markup
- state machines
- payroll logic
```

Expected page wrapper example:

```ts
import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ProcesoMensualContainer } from '../features/nomina-mensual/containers/proceso-mensual-container/proceso-mensual-container';

@Component({
  selector: 'app-proceso-remuneraciones-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProcesoMensualContainer],
  template: `<app-proceso-mensual-container />`,
})
export class ProcesoRemuneracionesPage {}
```

---

## Mandatory feature structure

For a new business interface, create or use a feature folder:

```txt
src/app/features/<feature-name>/
```

Recommended structure:

```txt
src/app/features/<feature-name>/containers/<screen-name>-container/
src/app/features/<feature-name>/components/
src/app/features/<feature-name>/models/
src/app/features/<feature-name>/rules/
src/app/features/<feature-name>/services/
src/app/features/<feature-name>/data-access/
src/app/features/<feature-name>/mappers/
src/app/features/<feature-name>/utils/
src/app/features/<feature-name>/<feature-name>.routes.ts
```

Use only the folders needed by the phase.

Do not create empty folder structures unless the project already uses `.gitkeep` and the phase needs it.

---

## Folder responsibilities

### pages/

Responsibility:

```txt
Route wrapper only.
```

Allowed:

```txt
- import container
- render container
- no business logic
```

### containers/

Responsibility:

```txt
Screen orchestration.
```

Allowed:

```txt
- inject services
- hold UI state
- call service methods
- handle user events
- compose shared UI components
- show messages
- open/close modal
- map service data to view model if minimal
```

Forbidden:

```txt
- Supabase direct calls
- repository direct calls
- complex business rules
- hardcoded normative values
- payroll calculations
- duplicated domain validation
```

### components/

Responsibility:

```txt
Reusable visual pieces or sub-sections.
```

Allowed:

```txt
- presentational UI
- inputs/outputs
- small local formatting
```

Forbidden:

```txt
- Supabase calls
- feature-wide orchestration
- payroll calculations
- persistence
```

### services/

Responsibility:

```txt
Functional orchestration and application logic.
```

Allowed:

```txt
- validate workflow
- call repositories
- call rules
- call other services when needed
- translate technical errors into ERP messages
- enforce business boundaries
```

Forbidden:

```txt
- HTML/UI state
- direct DOM logic
- visual layout decisions
```

### data-access/

Responsibility:

```txt
Persistence and external data access.
```

Allowed:

```txt
- Supabase queries
- row insert/update/select
- low-level persistence errors
- no UI messages unless mapped upward
```

Forbidden:

```txt
- UI decisions
- payroll orchestration
- component state
- visual concerns
```

### rules/

Responsibility:

```txt
Pure business/domain rules.
```

Allowed:

```txt
- pure functions
- deterministic validation
- classification
- no Angular injection
- no Supabase
- no side effects
```

Expected:

```txt
*.rules.ts
*.rules.spec.ts
```

### models/

Responsibility:

```txt
Types and interfaces.
```

Allowed:

```txt
- domain types
- payloads
- rows
- filters
- enum-like union types
```

Forbidden:

```txt
- functions with side effects
- service calls
```

### mappers/

Responsibility:

```txt
Transform data shapes.
```

Examples:

```txt
snake_case <-> camelCase
DB row -> domain model
form -> payload
payload -> insert/update
```

Expected:

```txt
*.mapper.ts
*.mapper.spec.ts when logic is non-trivial
```

### utils/

Responsibility:

```txt
Generic helpers that are not core business orchestration.
```

Use carefully.

If a helper encodes business policy, prefer `rules/`.

---

## Routing rules

### Feature routes

If a feature has multiple screens or child flows, prefer a feature routes file:

```txt
src/app/features/<feature>/<feature>.routes.ts
```

Example already present:

```txt
src/app/features/empleados/empleados.routes.ts
src/app/features/parametros-generales/parametros-generales.routes.ts
```

### Domain route groups

The Remuneraciones domain uses:

```txt
/remuneraciones/*
```

Current official pattern:

```txt
/remuneraciones/conceptos
/remuneraciones/haberes-descuentos
/remuneraciones/movimientos-variables
/remuneraciones/proceso-mensual
/remuneraciones/liquidaciones
/remuneraciones/liquidaciones/:id
```

Do not create new root routes for remuneration modules unless explicitly required.

Do not add legacy redirects for new routes.

Legacy redirects are only for old routes already used.

---

## UI architecture rules

### Shared UI components

Use existing shared components before creating new ones:

```txt
src/app/shared/components/ui/button.component.ts
src/app/shared/components/ui/card.component.ts
src/app/shared/components/ui/data-grid.component.ts
src/app/shared/components/ui/message-box.component.ts
src/app/shared/components/ui/page-actions.component.ts
src/app/shared/components/ui/page-title.component.ts
src/app/shared/components/ui/record-breadcrumb.component.ts
src/app/shared/components/ui/search-select.component.ts
src/app/shared/components/ui/tabbar.component.ts
src/app/shared/components/ui/tabs.component.ts
```

Do not create duplicate button/card/table components.

Do not modify shared components unless the task explicitly targets shared behavior and includes regression checks.

### Layout

A screen should generally have:

```txt
breadcrumb/context
header/title
actions
filters if needed
content card/list/table
empty/error/loading state
modal only when needed
```

Do not create dashboards, cards, charts or decorative blocks unless the phase asks for it.

### Minimal correct UI

Each functional phase must have usable UI if it touches a screen.

Required:

```txt
- clear labels
- clear errors
- clear empty state
- no broken layout
- no fake normative values
- no misleading copy
```

Not required until UX final phase:

```txt
- premium visual polish
- animations
- new design system
- dashboard redesign
- visual perfection
```

---

## ERP phase rule

The project uses this advancement rule:

```txt
Do not make everything basic.
Do not make every phase visually perfect.

Each phase must be functionally complete,
with minimal correct UI,
and final visual polish must be grouped into a later single UX phase.
```

A phase is complete when:

```txt
- business rule implemented
- validation covered
- tests green if code changed
- documentation updated
- traceability clear
- no out-of-scope changes
- UI usable if the phase touches UI
- peticiones-estilos updated if visual/copy change exists
```

A phase is not required to include:

```txt
- final design polish
- advanced responsive polish
- animations
- dashboard redesign
- decorative cards
- visual perfection
```

---

## Chilean payroll UI rules

For remuneration screens, never build generic CRUD.

Every screen must make clear whether it is:

```txt
catalog
recurrent assignment
monthly variable input
monthly process
generated result
normative output
```

Use business language:

```txt
concepto de remuneracion
asignacion recurrente
movimiento variable
periodo
trabajador
estado
borrador
validado
anulado
liquidacion
parametro del periodo
```

Avoid generic language:

```txt
item
extra
registro
dato
valor
```

unless the context is clearly technical.

---

## Data and business boundaries

### Conceptos de remuneracion

Responsibility:

```txt
Catalog master.
```

It defines:

```txt
type
LRE
system/user
automatic/manual
validity
assignability
imponible/tributable when available
```

It does not assign workers.

### Haberes y descuentos

Responsibility:

```txt
Recurrent worker assignments.
```

It manages:

```txt
worker + concept + validity
duplicates
overlaps
closure
history
```

It does not manage monthly one-off variables.

### Movimientos variables

Responsibility:

```txt
Monthly one-off input by worker + concept + period.
```

It manages:

```txt
period YYYY-MM
worker
concept
amount
state
manual origin
annulment
```

It does not calculate payroll.

### Parametros

Responsibility:

```txt
Normative and company parameters by period/vigency.
```

It must not be replaced by hardcoded UI values.

### Proceso mensual

Responsibility:

```txt
Future orchestration.
```

It must validate:

```txt
period
employees ready
parameters complete
recurrent assignments
validated variable movements
```

It must not show fake normative values as real.

### Liquidaciones

Responsibility:

```txt
Generated/frozen result.
```

It must be snapshot-based in future phases.

It is not a free editable form.

---

## Anti-patterns forbidden

Cursor/Codex must not introduce these patterns:

```txt
- new complex inline page in pages/*.page.ts
- adding more HTML to legacy inline pages
- direct repository call from UI container
- direct Supabase call from UI
- business rule inside template
- payroll calculation inside component
- hardcoded UF/UTM/topes/sueldo minimo in UI
- fake normative values without DEMO label
- APORTE_EMPLEADOR as manual worker movement
- delete physical as normal payroll operation
- changing shared DataGrid for one screen
- redesigning sidebar during feature work
- route changes outside explicit scope
- CSS global changes for local issue
- adding dashboard/cards/animations outside scope
```

---

## What to do with legacy inline pages

Legacy inline pages exist.

Do not copy them.

When a phase touches one of them:

### If the task changes only one small copy and does not add logic

Allowed:

```txt
small textual correction
no new layout
no new logic
document debt if still inline
```

### If the task changes UI structure, data, state, validation or business behavior

Mandatory:

```txt
create feature container
move screen UI to container
leave page as wrapper
add/update tests
document migration
```

High-priority legacy pages to migrate when touched:

```txt
src/app/pages/proceso-remuneraciones.page.ts
src/app/pages/liquidaciones.page.ts
src/app/pages/detalle-liquidacion.page.ts
src/app/pages/parametros.page.ts
src/app/pages/dashboard.page.ts
src/app/pages/licencias-medicas.page.ts
src/app/pages/reportes.page.ts
```

Do not migrate all at once unless a dedicated architecture phase asks for it.

---

## Standard implementation flow for new interface

1. Identify module and domain.

```txt
empleados
parametros-generales
haberes-descuentos
movimientos-variables
nomina-mensual
liquidaciones
```

2. Create or reuse feature folder.

```txt
src/app/features/<module>/
```

3. Create container.

```txt
src/app/features/<module>/containers/<screen>-container/
```

4. Create wrapper page.

```txt
src/app/pages/<screen>.page.ts
```

5. Add route.

```txt
app.routes.ts or feature routes file
```

6. Use services.

```txt
container -> service -> repository
```

7. Put pure rules in `rules/`.

8. Put DB access in `data-access/`.

9. Put types in `models/`.

10. Add tests.

11. Update docs.

12. Update `docs/codex/peticiones-estilos.md` if UI/copy changed.

---

## Expected files for a new screen

For a new screen:

```txt
src/app/pages/<screen>.page.ts
src/app/features/<module>/containers/<screen>-container/<screen>-container.ts
src/app/features/<module>/containers/<screen>-container/<screen>-container.html
src/app/features/<module>/containers/<screen>-container/<screen>-container.css
src/app/features/<module>/containers/<screen>-container/<screen>-container.spec.ts
```

If business logic is needed:

```txt
src/app/features/<module>/models/<module>.model.ts
src/app/features/<module>/rules/<module>.rules.ts
src/app/features/<module>/rules/<module>.rules.spec.ts
src/app/features/<module>/services/<module>.service.ts
src/app/features/<module>/services/<module>.service.spec.ts
src/app/features/<module>/data-access/<module>.repository.ts
src/app/features/<module>/data-access/<module>.mapper.ts
src/app/features/<module>/data-access/<module>.mapper.spec.ts
```

Use existing filenames and conventions if the module already has them.

---

## Testing rules

If a phase changes rules:

```txt
add/update *.rules.spec.ts
```

If a phase changes service behavior:

```txt
add/update *.service.spec.ts
```

If a phase changes mappers:

```txt
add/update *.mapper.spec.ts
```

If a phase changes a container with meaningful behavior:

```txt
add/update *-container.spec.ts
```

If a phase only changes documentation:

```txt
tests not required unless project contract says otherwise
```

Always run when code changed:

```bash
npm test -- --watch=false
```

If build is relevant:

```bash
ng build
```

---

## Documentation rules

Every functional phase must update docs.

Depending on scope, update:

```txt
docs/codex/orquestador/estado-fases.md
docs/codex/orquestador/mapa-documentacion.md
docs/codex/orquestador/diseno-operativo-erp.md
docs/codex/modulos/<module>/README.md
docs/codex/modulos/<module>/contrato-general.md
docs/codex/modulos/<module>/decisiones-operativas.md
docs/codex/peticiones-estilos.md if UI/copy changed
```

If creating a new architecture or QA rule, add it to:

```txt
docs/codex/README.md
docs/codex/orquestador/mapa-documentacion.md
```

---

## Required answer after implementation

Cursor/Codex must answer with:

```txt
1. Files changed.
2. Whether pages/*.page.ts remained wrapper-only.
3. Containers created or modified.
4. Services/rules/repositories touched.
5. Tests executed.
6. Documentation updated.
7. Whether peticiones-estilos.md was updated.
8. What was not touched.
9. Any architecture debt left.
10. Suggested next phase.
```

For UI work, also answer:

```txt
- HTML modified
- CSS modified
- classes added
- classes reused
- shared components reused
- confirmation that no global layout/theme/sidebar/DataGrid was changed unless explicitly requested
```

---

## Acceptance criteria for any new interface

A new interface is accepted only if:

```txt
- page is wrapper-only
- real UI lives in container
- no direct Supabase in UI
- no repository call from UI
- business rules are not in template
- validations are in service/rules
- models are typed
- tests exist when logic changed
- docs updated
- peticiones-estilos updated for visual/copy change
- no out-of-scope redesign
```

If any of these fail, the phase is not complete.

---

## Canonical path (this file)

This contract lives at:

```txt
docs/codex/arquitectura/frontend-interfaces.md
```

It is linked from `docs/codex/README.md`, `docs/codex/orquestador/mapa-documentacion.md`, `.cursor/rules/erp-orquestador.mdc`, and `.cursor/skills/erp-codex-docs/SKILL.md`.

For future prompts, include in scope when touching Angular structure:

```txt
- docs/codex/arquitectura/frontend-interfaces.md
```


