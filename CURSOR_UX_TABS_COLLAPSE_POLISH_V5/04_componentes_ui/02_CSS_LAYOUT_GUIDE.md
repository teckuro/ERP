# 02_CSS_LAYOUT_GUIDE

## Clases sugeridas

```css
.erp-page-header--compact {}
.erp-status-strip {}
.erp-tabbar {}
.erp-tabbar__item {}
.erp-tabbar__item--active {}
.erp-accordion {}
.erp-accordion__header {}
.erp-accordion__panel {}
.erp-quick-link-list {}
.erp-quick-link {}
.erp-empty-compact {}
.erp-future-list {}
```

## Reglas

```txt
No usar min-height grande salvo necesidad.
No inflar padding para llenar pantalla.
No meter scroll dentro de accordion panel.
No usar cards grandes para links simples.
```

## Desktop

```css
.erp-two-column {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 16px;
}
```

## Mobile

```css
@media (max-width: 820px) {
  .erp-two-column {
    grid-template-columns: 1fr;
  }
}
```

## Tabbar mobile

```txt
overflow-x auto
scrollbar discreta
sin cortar tab activo
```
