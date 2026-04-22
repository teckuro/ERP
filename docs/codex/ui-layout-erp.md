# UI Layout Rules - ERP (OBLIGATORIO)

## Objetivo
Estandarizar TODAS las pantallas del ERP según el diseño base de "Crear empleado".

Codex debe seguir esta estructura EXACTA.

---

## Layout base (OBLIGATORIO)

┌──────────────────────────────────────────────────────────────┐
│ Breadcrumb (izquierda)     |   Título (centrado)             │
├──────────────────────────────────────────────────────────────┤
│ Botonera (alineada a la derecha)                            │
├──────────────────────────────────────────────────────────────┤
│ Contenido (card con borde)                                  │
│                                                            │
│   Formulario / tabla / vista                               │
│                                                            │
└──────────────────────────────────────────────────────────────┘

---

## 1. Breadcrumb (izquierda)

- SIEMPRE arriba a la izquierda
- Representa la navegación
- Ejemplo:
  - Inicio / Empleados / Crear

---

## 2. Título (centrado)

- SIEMPRE centrado horizontalmente
- Debe estar en la misma línea que el breadcrumb
- Representa la acción actual

Ejemplos:
- Crear empleado
- Editar empleado

---

## 3. Botonera (arriba derecha)

👉 REGLA CLAVE DE ESTE ERP

- Va en una fila separada debajo del header
- SIEMPRE alineada a la derecha
- NO va dentro del contenido
- NO va abajo

---

## Ejemplo visual correcto

                    [Cancelar] [Guardar]

---

## 4. Contenido (card)

👉 REGLA OBLIGATORIA

- Todo el contenido debe ir dentro de un contenedor tipo card

### Estilo mínimo:
- border
- border-radius
- padding
- fondo blanco

---

## 5. Estructura del contenido

Dentro del card:

- formularios
- tablas
- tabs (si aplica)

Mantener:
- máximo 2 columnas
- orden visual limpio

---

## 6. Botones

Orden SIEMPRE:

[ Secundario ] [ Primario ]

Ejemplo:
[ Cancelar ] [ Guardar ]

---

## 7. Qué NO hacer

❌ No poner botonera abajo  
❌ No meter la botonera dentro del card  
❌ No desalinear el título  
❌ No cambiar el orden de las filas  
❌ No inventar layouts distintos  

---

## 8. Consistencia

Todas las pantallas deben verse como:

- Crear empleado
- Editar empleado
- Formularios ERP

---

## 9. Responsive

- Mantener estructura vertical
- En mobile:
  - breadcrumb arriba
  - título debajo
  - botonera sigue arriba derecha
  - contenido 1 columna

---

## 10. Prioridad

Estas reglas son obligatorias.
Codex NO debe ignorarlas.

Si hay conflicto → seguir este layout.
