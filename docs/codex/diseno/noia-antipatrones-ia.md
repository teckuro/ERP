# NOIA — antipatrones de UI (especialmente generada por IA)

Fase: `ERP-NOIA-UI-GUARDRAILS-01`  
**Lectura obligatoria** junto a [`noia-ui-guardrails.md`](./noia-ui-guardrails.md). Si un cambio se parece a algo de esta lista, **rechazarlo y replantear** antes de codificar.

---

## Regla de oro

```txt
No inventar una pantalla nueva.
1) Flujo guiado / expediente / pasos → Creación avanzada (form-empleado, --bitacora-*, advanced-wizard-map).
2) Mesa de período / cierre / consola → Preparar nómina (payroll-*).
3) Listado / parámetros → módulo homólogo del mismo arquetipo (ver noia-bases-sistema-referencia.md).
Si no existe patrón, copiar tokens y grid del documento de bases — no importar estética de internet ni Tailwind marketing.
```

Detalle de archivos y tokens: [`noia-bases-sistema-referencia.md`](./noia-bases-sistema-referencia.md)

---

## 1. Colores extravagantes o fuera de sistema

### Prohibido

- Colores **no documentados** en la fase o en módulos hermanos (`#7c3aed`, `#ec4899`, cyan neón, verde lima, naranja saturado “de alerta” sin criterio).
- **Varios azules** en la misma vista (botón + barra + fondo + badge todos azules).
- Fondos de página o paneles **saturados** (`bg-blue-500`, `bg-indigo-50` en toda la zona central).
- **Gradientes** (`linear-gradient`, `from-* to-*` decorativos).
- Badges de **colores distintos** por fila sin semántica operativa.
- Usar colores de **gráficos** (`chart-1`…`chart-5`) para UI operativa.
- `box-shadow` colorida o glow.
- Bordes de acento gruesos en todos los lados salvo estado funcional puntual.

### Permitido (con moderación)

| Uso | Color / tratamiento |
|-----|---------------------|
| Estructura | `--bitacora-border` / `#dadfd7`, fondos `#f6f7f4` (Creación avanzada) o grises `payroll-*` (nómina) |
| Acción principal | `--bitacora-primary` `#2563eb` o `#1d4ed8` — **un punto** por zona |
| Listo | Verde suave de fondo + borde (`#f0fdf4`, `#bbf7d0`) |
| Revisar | Ámbar suave (`#fffbeb`, `#fde68a`) |
| Bloqueo | Rojo suave (`#fff7f7`, `#fecaca`) — no rojo neón |

### Test rápido

> ¿La pantalla parece un dashboard de startup o un ERP de RRHH sobrio?  
> Si parece startup → está mal.

---

## 2. Mal uso del espacio

### Prohibido

- **Padding inflado**: `padding: 24px 32px`, `p-8`, `py-12` en paneles operativos rutinarios.
- **Gaps enormes**: `gap-8`, `gap-12` entre bloques hermanos sin motivo.
- **Columnas vacías** o grid `1fr 1fr 1fr` con una columna casi sin contenido.
- **Hero** o bloque introductorio alto solo con título + párrafo.
- Centrar verticalmente contenido operativo como **landing** (`min-height: 70vh`, flex center).
- Hacer scroll largo para ver **estado + CTA** (deben estar arriba o en consola fija).
- Formularios **100 % ancho** en pantallas anchas sin agrupar por intención.
- Apilar **5+ secciones** con el mismo peso visual (todo grita igual).
- Reservar franjas para “futuras métricas” o placeholders decorativos.

### Obligatorio

| Zona | Orientación |
|------|-------------|
| Panel operativo | `12–16px` padding; `10–16px` entre secciones |
| Título → contenido | `6–10px` |
| Workspace 3 columnas | Solo bitácora \| decisión \| apoyo — cada una con rol claro |
| Modal | Ancho máximo definido (`~720px` diagnóstico); no modal full-screen salvo revisión masiva documentada |

### Test rápido

> ¿El usuario ve estado y acción principal **sin scroll** en laptop estándar?  
> Si no → compactar o mover detalle a modal.

---

## 3. Tipografía y jerarquía

### Prohibido

- `text-3xl`, `text-4xl`, `font-size: 2rem+` en títulos de pantalla operativa.
- Más de **dos niveles** de título dominante en la misma vista.
- Párrafos de ayuda de **4+ líneas** en pantalla principal.
- `font-weight: 700` en labels, tabs y textos secundarios (ver manual base: reservar peso alto al dato protagonista).
- MAYÚSCULAS decorativas en bloques enteros.

### Obligatorio

- Un **h1/h2 moderado** por vista; el resto compacto.
- Labels en `0.6875–0.75rem` con peso 600–700 solo donde el módulo ya lo hace.

---

## 4. Cards, badges y “ruido SaaS”

### Prohibido

- Grid de **6–12 mini-cards** con el mismo borde y sombra.
- Card por cada KPI, cada mensaje y cada acción.
- Badges en **cada fila** “solo porque sí”.
- Iconos grandes decorativos sin acción.
- Ilustraciones o emojis en flujos de cierre de nómina.
- Chips de estado con **5 colores** distintos en una lista corta.

---

## 4.1 Breadcrumb mal usado

### Prohibido

- Omitir breadcrumb en pantallas ERP nuevas o redisenadas.
- Mostrar rutas tecnicas (`/remuneraciones/proceso-mensual`) como texto principal.
- Usar nombres de tablas, RPC, enums o flags dentro del breadcrumb.
- Convertir el breadcrumb en botonera, badge, card o bloque con sombra.
- Repetir en el breadcrumb el mismo diagnostico que ya vive en la consola o en el estado operativo.
- Dar al breadcrumb el mismo peso visual que el titulo o la CTA principal.

### Obligatorio

- Formato funcional compacto: `Dominio / Flujo / Vista actual`.
- Segmentos anteriores navegables; ultimo segmento solo texto.
- Copy de negocio: `Remuneraciones`, `Preparar nomina`, `Movimientos`, `Alta avanzada`.

---

## 5. Tailwind y CSS improvisado

### Prohibido en contenedores que ya usan CSS local

- Volcar **20+ clases** Tailwind en HTML (`bg-white rounded-xl shadow-lg p-8 border-2…`).
- Colores arbitrarios `bg-[#…]`, `text-[#…]`.
- Crear **nueva paleta** en el `.css` del componente sin copiar convención del módulo.
- Subir reglas a `src/styles/*` para “arreglar” budget.

### Obligatorio

- Clases con **prefijo del módulo** (`payroll-*`, `nom-*`, etc.).
- Copiar **escala y bordes** del contenedor hermano más cercano en el repo.
- Un cambio visual = **CSS local** + HTML semántico mínimo.

---

## 6. Contenido y copy “de relleno”

### Prohibido

- Párrafos que repiten lo que ya dice el título del estado.
- Tres zonas con el mismo texto (“Valida el período…” en header, card y bandeja).
- Lorem ipsum o placeholders genéricos en producción.
- Explicar **cómo funciona el motor** en pantalla principal.
- Listas largas de enlaces a módulos **antes** de validar el período.

---

## 7. Acciones y modales

### Prohibido

- Dos o más botones **primarios** (mismo peso azul) en una zona.
- Botón primario para “Ver detalle” y otro para la acción real.
- Modales que repiten la consola entera sin aportar detalle o listas.
- `alert()` o banners rojos apilados sin consolidación.

---

## 8. Qué hacer en su lugar (checklist de 30 segundos)

1. ¿Existe pantalla similar en el repo? → **Copiar estructura y CSS**, no rediseñar.
2. ¿El color nuevo es imprescindible? → **No**; usar neutro + un acento semántico.
3. ¿Hace falta otra card? → **Regla anti-card** en guardrails.
4. ¿Sobra espacio? → **Reducir padding y gaps**, subir información crítica.
5. ¿Hay texto técnico? → **Modal de soporte** o eliminar.

---

## Enlaces

- Bases del sistema: [`noia-bases-sistema-referencia.md`](./noia-bases-sistema-referencia.md)
- Guardrails: [`noia-ui-guardrails.md`](./noia-ui-guardrails.md)
- Manual UI: [`noia-ui-manual.md`](./noia-ui-manual.md)
- Cierre: [`noia-ui-review-checklist.md`](./noia-ui-review-checklist.md)
- Prompt Cursor: [`noia-prompt-cursor.md`](./noia-prompt-cursor.md)
