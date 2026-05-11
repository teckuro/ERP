# 01_DECISION_MATRIX

## Matriz de decision

| Necesidad | Usar | No usar |
|---|---|---|
| Cambiar entre vistas hermanas en la misma pantalla | Tabs | Cards |
| Mostrar/ocultar detalle secundario | Accordion / Disclosure | Tabs |
| Navegar a otra pantalla | Quick link / Nav card compacta | Tabs |
| Mostrar numero/estado resumido | Metric card | Accordion |
| Mostrar siguiente paso | Action panel | Tab |
| Mostrar futuro no disponible | Future list / collapsable | Boton primario |
| Mostrar filtros poco usados | Collapsible filters | Cards |
| Mostrar detalle tecnico | Collapsible TechnicalDetails | Card principal |

## Preguntas antes de elegir patron

```txt
1. Esto cambia contenido o navega?
2. Es informacion primaria o secundaria?
3. El usuario necesita verlo para avanzar?
4. Hay mas de 3 items?
5. Ocupa mucho por poco contenido?
6. Debe ser accesible por teclado?
```

## Reglas rapidas

```txt
Navega -> quick link
Cambia vista -> tab
Esconde detalle -> accordion
Resume datos -> metric card
Indica accion -> action panel
Futuro -> future list
```
