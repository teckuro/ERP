# 02_TABBAR_PRO

## Patron tabbar profesional

### HTML/ARIA esperado

```txt
role="tablist"
button role="tab"
aria-selected
aria-controls
tabpanel role="tabpanel"
```

Si ya se usa componente Angular propio, adaptar sin sobredimensionar.

## Visual

```txt
line tabs
altura 40-44px
active underline
label corto
sin descripcion
scroll horizontal en mobile
```

## No usar contained tabs pesadas dentro de cards

Preferir line tabs alineadas con el contenido.

## Comportamiento teclado

```txt
Tab entra/sale del tablist.
ArrowLeft/ArrowRight cambia foco entre tabs horizontales.
Home/End opcional para primero/ultimo.
Enter/Space activa si no hay activacion automatica.
```

## Mobile

```txt
si hay pocas tabs: scroll horizontal
si hay muchas: select compacto o overflow menu
```

## Casos del ERP

Buenas candidatas:

```txt
Reportes: Disponibles / Futuras
Movimientos: Todos / Aprobados / Pendientes, si existen
Licencias: ya usa tabs, mantener
Parametros: ya usa tabs, mantener
```

No usar tabs para:

```txt
Preparar nomina / Liquidaciones / Movimientos / Asignaciones
```

Eso es navegacion de modulo.
