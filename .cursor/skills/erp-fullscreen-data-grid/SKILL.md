---
name: erp-fullscreen-data-grid
description: >-
  Layouts operational app-data-grid screens to fill remaining viewport height
  using the administrador-nominas pattern (flex 1, internal scroll, no
  intermediate padding, no lateral or bottom card borders). Use when building
  or fixing list screens, data-grid height, fullscreen grid, movimientos,
  novedades, nominas, empleados tables, or when the user says the grid does
  not occupy 100% of the screen.
---

# ERP — grilla operativa a pantalla completa

## Regla obligatoria (texto de producto)

> **Grilla:** ocupa el resto de la pantalla, sin padding intermedio, siguiendo el patrón del administrador de nóminas (`flex: 1`, scroll interno, bordes laterales/inferiores eliminados).

Aplicar **siempre** en pantallas operativas con `app-data-grid` bajo el shell ERP.

## Referencia canónica

| Pieza | Archivo |
|-------|---------|
| Contenedor | `src/app/features/nomina-mensual/containers/administrador-nominas-container/` |
| Empleados | `src/app/features/empleados/components/tabla-empleados/tabla-empleados.css` |
| Movimientos (RRHH) | `src/app/features/nomina-mensual/novedades/containers/novedades-mensuales-container/` |

## Cadena flex (no romper)

```txt
.erp-shell-scroll > router-outlet sibling (page o container)
  > :host (page si existe: display flex; flex 1; height 100%; overflow hidden)
    > :host (container: igual)
      > .{feature}__page (flex column; flex 1; min-height 0; height 100%)
        > .{feature}__head (flex 0 0 auto) — lead, KPIs, acciones
        > .{feature}__grid-shell (flex 1 1 auto; min-height 0; height 100%)
          > app-data-grid[gridHeight="100%"]
            > app-card.{feature}__grid-card
              > .data-grid-scroll (flex 1; overflow auto)
```

**Preferir** cargar el **container** directo en la ruta (como `/remuneraciones/nominas`). Si hay `pages/*.page.ts`, el `:host` de la page **debe** propagar flex al container.

## HTML mínimo

```html
<section class="adm-nom__page">
  <!-- opcional: franja KPI / lead -->
  <div class="adm-nom__grid-shell">
    <app-data-grid
      className="adm-nom__grid"
      cardClassName="adm-nom__grid-card"
      [gridHeight]="'100%'"
      ...
    />
  </div>
</section>
```

- Sin wrappers extra con `padding` entre head y grilla.
- Banners/avisos puntuales van **dentro** de `__grid-shell` con `flex: 0 0 auto`, no como caja con gap grande.

## CSS local obligatorio (container)

Copiar y adaptar prefijo (`adm-nom`, `nm`, `mv`, …):

```css
:host {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  width: 100%;
  min-width: 0;
  min-height: 0;
  height: 100%;
  overflow: hidden;
  box-sizing: border-box;
}

.{feature}__page {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  width: 100%;
  min-width: 0;
  min-height: 0;
  height: 100%;
  overflow: hidden;
}

.{feature}__grid-shell {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  width: 100%;
  min-width: 0;
  min-height: 0;
  height: 100%;
  overflow: hidden;
}

:host ::ng-deep .{feature}__grid-shell > app-data-grid.{feature}__grid {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  width: 100%;
  min-width: 0;
  min-height: 0;
  height: 100%;
}

:host ::ng-deep .{feature}__grid-shell > app-data-grid.{feature}__grid > app-card.{feature}__grid-card {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  width: 100%;
  min-width: 0;
  min-height: 0;
  height: 100%;
  border-radius: 0;
  border-left: none;
  border-right: none;
  border-bottom: none;
  box-shadow: none;
}

:host ::ng-deep .{feature}__grid-shell > app-data-grid.{feature}__grid .data-grid-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}
```

## Inputs del data-grid

| Input | Valor |
|-------|--------|
| `gridHeight` | `'100%'` (activa `data-grid-host--sized`) |
| `className` | clase en el host del grid (`__grid`) |
| `cardClassName` | clase en `app-card` interna (`__grid-card`) |

No depender solo de `erp-fullscreen-grid-card` global; reforzar en CSS local del feature.

## Prohibido

- `padding` en el shell que hospeda la grilla (10px 14px alrededor del grid).
- `min-height: calc(100dvh - …)` **solo** en el panel intermedio sin cadena flex completa.
- Más de un wrapper flex entre page y `app-data-grid`.
- Page wrapper sin `:host { display:flex; height:100% }`.
- Scroll de página entera cuando la tabla debería scrollear por dentro.

## Checklist antes de cerrar

- [ ] `:host` page (si existe) y container con flex + `height:100%`
- [ ] `__grid-shell` con `flex:1` y `min-height:0`
- [ ] `[gridHeight]="'100%'"`
- [ ] Card sin bordes lateral/inferior ni radius
- [ ] `.data-grid-scroll` con `overflow:auto`
- [ ] Sin padding intermedio entre head y grilla
- [ ] Tests del container siguen pasando

## Fallos frecuentes

| Síntoma | Causa | Fix |
|---------|-------|-----|
| Grilla corta, espacio blanco abajo | Page sin `:host` flex | Estilos en `*.page.ts` o ruta directa al container |
| Grilla no crece | Wrapper extra sin `flex:1` | Aplanar a un solo `__grid-shell` |
| Scroll en toda la pantalla | Falta `overflow:hidden` en page | Cadena completa + scroll solo en `.data-grid-scroll` |
| Bordes “caja flotante” | Solo clase global | CSS local en `__grid-card` |
