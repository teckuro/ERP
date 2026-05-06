# Estilos – guia basica

## Objetivo

Establecer estandares de estilo y layout para todas las pantallas del ERP. 
Se basa en un sistema de diseno empresarial, neutro y compacto.

## Principios

- La paleta principal se centra en tonos neutros con acento en azul (`#2563EB`) para acciones principales.
- Los estados de error, advertencia, exito e informacion utilizan colores especificos para transmitir significado sin saturar la interfaz.
- Los componentes deben tener bordes suaves y sombras discretas; evitar gradientes y decoraciones innecesarias.
- Mantener alta densidad de informacion sin sacrificar legibilidad.

## Layout base

Cada pantalla debe seguir esta estructura:

```
Header
- Breadcrumb arriba a la izquierda.
- Titulo centrado.

Botonera
- Fila separada debajo del header.
- Alineada a la derecha.
- Orden: boton secundario, luego primario.

Contenido
- Card principal con borde, radio y fondo blanco.
- Dentro: formulario, tabla, tabs o vista principal.
```

La botonera no debe colocarse dentro de la card de contenido ni duplicarse arriba y abajo.

## Tokens de diseno

- **Colores**: primario `#2563EB`, primario hover `#1D4ED8`, fondo general `#F8FAFC`, superficie `#FFFFFF`, borde `#E5E7EB`, texto principal `#111827`, texto secundario `#6B7280`, deshabilitado `#9CA3AF`, error `#DC2626`, warning `#F59E0B`, success `#16A34A`, info `#0EA5E9`.
- **Espaciados**: `4px`, `8px`, `12px`, `16px`, `24px`, `32px`.
- **Alturas**: inputs y selects `38–42px`, botones compactos `28–32px`, botones primarios `36–40px`.
- **Radios**: `5px–8px` segun contexto.

## Anti‑patrones

Evitar:

- Formularios en multiples columnas innecesarias.
- Inputs sin label visible.
- Duplicar botoneras o colocarlas dentro del contenido.
- Paletas nuevas o colores saturados.
- Contenedores anidados sin necesidad (cards dentro de cards).
- Layouts inconsistentes entre pantallas del mismo flujo.

Consulte tambien `ui-form-guidelines.md` y `AGENTS.md` para reglas mas detalladas y ejemplos.
