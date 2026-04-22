# UI Icon Buttons

## Objetivo
Estandarizar botones y elementos interactivos que combinan icono + texto.

## Regla obligatoria
Todo boton o elemento clickeable que tenga icono y texto debe alinear ambos al centro.

## Implementacion esperada

- Usar `display: inline-flex` o `display: flex`.
- Usar `align-items: center`.
- Usar `justify-content: center` cuando el boton tenga ancho propio o fijo.
- Usar `gap` entre icono y texto.
- El icono debe tener ancho y alto definidos.
- El texto no debe quedar visualmente mas arriba o mas abajo que el icono.

## Ejemplo CSS

```css
.button-with-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.button-with-icon svg,
.button-with-icon lucide-icon {
  width: 14px;
  height: 14px;
}
```

## Que NO hacer

- No alinear iconos con `margin-top` o valores manuales si puede resolverse con flex.
- No dejar icono y texto en diferentes line-height.
- No usar iconos sin dimensiones estables.
- No crear botones con icono + texto usando solo `inline` sin alineacion vertical.

