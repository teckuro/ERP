# UI Botones - Guia Central

Este documento define el estilo unico de botones del ERP.
Complementa (no reemplaza) `docs/codex/ui-form-guidelines.md`.

## Objetivo

- Botones consistentes en toda la interfaz (toolbar, formularios, acciones en cards).
- Evitar que cada vista invente clases o tamaños.
- Mantener un look enterprise: sobrio, compacto, sin decoraciones.

## Fuente de verdad (implementacion)

Antes de crear estilos nuevos, revisar estos componentes:

- `src/app/shared/components/ui/button.component.ts` (base de botones)
- `src/app/shared/components/ui/page-actions.component.ts` (toolbar de acciones)
- `src/styles.css` (`.erp-toolbar-button` para botones con icono + texto)

## Tokens (referencia)

Usar los tokens definidos en `docs/codex/ui-form-guidelines.md`.

## Variantes permitidas

- **primary**: accion principal (guardar/finalizar).
- **secondary / outline**: acciones secundarias (volver, modificar, sincronizar).
- **danger**: acciones destructivas.
- **ghost**: acciones de bajo énfasis (solo si no compite con primary).

Regla: la accion primaria debe ser unica y visible. No duplicarla.

## Tamaños

- `sm`: acciones compactas, dentro de tablas o celdas.
- `md`: toolbar principal de pagina (default).
- `lg`: solo si hay un caso de UX claro.

Referencias de altura (guia UI):

- Botones principales de pagina: `36px` a `40px`.

## Botones en toolbars (estandar ERP)

Cuando un boton tiene **icono + texto** en una botonera:

- Usar `app-page-actions` cuando sea posible.
- Si se usa `app-button` directo, aplicar `className="erp-toolbar-button"` para alinear icono y tipografia.
- Evitar clases largas copiadas/pegadas por vista.

Ejemplo (preferido):

```html
<app-page-actions
  [visibleActions]="['back', 'edit', 'save']"
  backLink="/..."
  (editClick)="..."
  (saveClick)="..."
></app-page-actions>
```

Ejemplo (permitido para accion extra fuera de `app-page-actions`):

```html
<app-button variant="outline" size="md" className="erp-toolbar-button" (click)="sincronizar()">
  <lucide-icon icon class="h-4 w-4" name="refresh-cw"></lucide-icon>
  Sincronizar
</app-button>
```

## Prohibiciones (para evitar look “hecho por IA”)

- No inventar nuevas paletas, gradientes o sombras.
- No crear botones con alturas/paddings ad-hoc por pantalla.
- No mezclar 3+ estilos distintos en la misma toolbar.
- No usar texto demasiado “marketing”; usar verbos claros: Volver, Modificar, Guardar, Sincronizar.

