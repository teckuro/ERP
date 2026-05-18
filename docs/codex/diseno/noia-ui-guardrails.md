# NOIA UI Guardrails

> Fuente unica de decision UI: [`noia-ui-manual.md`](./noia-ui-manual.md). Este documento contiene reglas visuales obligatorias, pero no reemplaza la jerarquia del manual.

## Objetivo

Este documento define las reglas visuales obligatorias para mantener una interfaz coherente, sobria, clara y propia del ERP de remuneraciones.

La interfaz debe sentirse como una **Bitácora Operativa**: ordenada, trazable, compacta y guiada por estados.

No se debe diseñar como una plantilla genérica de cards, dashboard SaaS ni interfaz con exceso de colores o textos.

**Fase:** `ERP-NOIA-UI-GUARDRAILS-01`  
**Relacionados:** [`noia-ui-manual.md`](./noia-ui-manual.md), [`bitacora-operativa-noia.md`](./bitacora-operativa-noia.md), [`noia-antipatrones-ia.md`](./noia-antipatrones-ia.md), [`noia-bases-sistema-referencia.md`](./noia-bases-sistema-referencia.md), [`noia-ui-review-checklist.md`](./noia-ui-review-checklist.md), [`noia-prompt-cursor.md`](./noia-prompt-cursor.md)

---

## Principios visuales

### 1. Claridad antes que decoración

Cada pantalla debe responder rápido:

- Qué estoy viendo.
- Qué estado tiene.
- Qué falta.
- Qué acción corresponde ahora.

No agregar bloques decorativos sin función operativa.

---

### 2. Menos cards, más estructura

No resolver todas las pantallas con muchas cards independientes.

Preferir:

- franjas operativas;
- paneles divididos;
- listas de revisión;
- bloques de estado;
- secciones compactas;
- tablas con acciones claras;
- resúmenes laterales cuando corresponda.

Usar cards solo cuando agrupen información realmente autónoma.

---

### 3. Densidad controlada

Evitar interfaces demasiado aireadas.

Reglas:

- no usar paddings excesivos;
- no usar títulos enormes;
- no dejar columnas vacías;
- no hacer que el usuario deba hacer mucho scroll para información básica;
- usar el ancho disponible con intención;
- mantener formularios compactos pero legibles.

---

### 4. Tipografía

Usar siempre la fuente actual del ERP.

No introducir:

- Google Fonts nuevas;
- fuentes decorativas;
- cambios globales de `font-family`;
- títulos exagerados tipo landing page.

Escala recomendada:

- título principal: moderado;
- subtítulos: compactos;
- labels: claros y pequeños;
- ayudas: breves, no párrafos largos.

Detalle: [`noia-ui-manual.md`](./noia-ui-manual.md) y [`noia-bases-sistema-referencia.md`](./noia-bases-sistema-referencia.md)

---

### 5. Color

Usar la paleta NOIA existente.

Prioridad visual:

- gris / neutro para estructura;
- azul institucional solo para acción o foco;
- verde solo para correcto/listo;
- amarillo/ámbar solo para revisión;
- rojo solo para bloqueo/error.

Evitar:

- exceso de azul;
- fondos saturados;
- barras laterales fuertes;
- gradientes decorativos;
- sombras innecesarias.

---

### 6. Estados visibles

Toda pantalla operativa debe comunicar estado usando lenguaje RRHH, no técnico.

Estados recomendados:

- En edición
- Listo
- Requiere datos
- Revisar
- Bloqueado
- No requerido
- Solo si aplica

Evitar mostrar directamente:

- enums de base de datos;
- nombres de funciones;
- nombres de tablas;
- flags técnicos;
- códigos internos sin traducción.

Los códigos técnicos, si son necesarios, van en modal secundario, tooltip de soporte o sección «Detalle técnico» — nunca como protagonista de la pantalla principal.

---

### 7. Acciones

Cada vista debe tener una acción principal clara.

No duplicar botones con la misma intención.

Ejemplos:

**Mal:**

- Validar período arriba.
- Validar período abajo.
- Validar período dentro de una card.

**Bien:**

- Una acción principal visible.
- Acciones secundarias agrupadas.
- Acciones técnicas ocultas o degradadas visualmente.

---

### 8. Breadcrumb operativo

Toda pantalla ERP debe iniciar con breadcrumb arriba a la izquierda, antes del titulo o en la primera linea del header.

Uso obligatorio:

- mostrar la ubicacion funcional: dominio -> flujo -> vista actual;
- usar nombres de negocio, no rutas tecnicas ni nombres de tablas;
- mantenerlo compacto, con peso visual secundario;
- hacer navegables solo los niveles anteriores;
- dejar el ultimo segmento como texto de la vista actual;
- no convertirlo en botonera, badge, card ni CTA.

El breadcrumb no reemplaza al titulo, al estado operativo ni a la accion principal. Su rol es orientar al usuario y permitir retorno contextual sin agregar bloques decorativos.

Ejemplos:

**Bien:**

- `Remuneraciones / Preparar nomina`
- `Personas / Alta avanzada / Bitacora laboral`
- `Parametros / Informacion de valores`

**Mal:**

- `/remuneraciones/proceso-mensual`
- `tbl_nomina_periodo > rpc_validar_periodo`
- breadcrumb dentro de una card con sombra;
- breadcrumb con el mismo peso que la CTA principal.

---

### 9. Modales y MessageBox

Usar `app-message-box` para:

- confirmaciones;
- errores;
- advertencias;
- decisiones guiadas;
- bloqueos administrativos.

El modal debe explicar:

1. Qué pasó.
2. Qué revisar.
3. Qué acción tomar.

No mostrar errores crudos de base de datos al usuario final.

---

### 10. Layout

Antes de modificar una pantalla, decidir su tipo:

- pantalla de revisión;
- pantalla de registro;
- pantalla de cierre;
- pantalla de configuración;
- pantalla de ficha;
- pantalla de listado;
- pantalla de flujo guiado.

No usar el mismo layout para todo.

Detalle: [`noia-ui-manual.md`](./noia-ui-manual.md) y referencias canonicas en [`noia-bases-sistema-referencia.md`](./noia-bases-sistema-referencia.md).

---

### 11. Regla anti-card

Antes de agregar una card, preguntar:

- ¿Esta información necesita estar separada?
- ¿Tiene acción propia?
- ¿Tiene estado propio?
- ¿Ayuda a decidir algo?

Si la respuesta es no, no crear una card nueva.

---

## Regla de reutilización (antes de crear estilos)

1. Abrir [`noia-bases-sistema-referencia.md`](./noia-bases-sistema-referencia.md) y elegir referencia por arquetipo.
2. **Expediente / pasos:** Creación avanzada → `form-empleado.css`, `--bitacora-*`, `advanced-wizard-map`.
3. **Mesa de período:** Preparar nómina → `payroll-*`.
4. Copiar el **breadcrumb operativo** del arquetipo antes de inventar header nuevo.
5. Copiar **estructura HTML**, **prefijo CSS** y **escala** (padding, tipografía, bordes).
6. Solo crear clase nueva si el patrón no existe; documentar en fase del módulo.

**No** diseñar “desde cero” con Tailwind de marketing ni paletas nuevas.

---

## Antipatrones prohibidos

No usar:

- muchas cards pequeñas sin jerarquía;
- títulos grandes innecesarios;
- textos técnicos visibles;
- `border-left: 3px solid #2563EB` como recurso genérico;
- sombras fuertes;
- gradientes decorativos;
- botones duplicados;
- alertas repetidas;
- formularios full width sin intención;
- helper text excesivo;
- pantallas que obligan a leer todo para saber qué hacer;
- **colores extravagantes** o fuera de la paleta NOIA (ver lista negra en [`noia-antipatrones-ia.md`](./noia-antipatrones-ia.md));
- **espacio inflado** (padding/gap grandes, columnas vacías, héroes, scroll para ver la acción principal);
- **muros de utilidades Tailwind** en HTML cuando el módulo ya usa CSS local con prefijo.

Catálogo ampliado: [`noia-antipatrones-ia.md`](./noia-antipatrones-ia.md)

---

## Criterio de aprobación UI

Una pantalla está bien diseñada si:

- se entiende en menos de 10 segundos;
- tiene una acción principal clara;
- no parece generada por IA;
- respeta la fuente y colores actuales;
- usa bien el espacio disponible;
- no abusa de cards;
- no expone detalles técnicos;
- mantiene coherencia con Bitácora Operativa NOIA.

Checklist operativo: [`noia-ui-review-checklist.md`](./noia-ui-review-checklist.md)

---

## Uso en Cursor / Codex

Antes de tocar UI, leer este documento y la regla `.cursor/rules/erp-ui-visual-guardrails.mdc`.

> No improvisar estilos. No usar cards por defecto. No cambiar fuente. No agrandar títulos sin motivo. No llenar de textos. Diseñar como Bitácora Operativa.
