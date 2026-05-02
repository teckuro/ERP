# Flujo de edición de ficha de empleado

## Objetivo

Describir el flujo **real** de la pantalla **`/empleados/:id`** (`FichaEmpleadoContainer`): layout, orden de pestañas, bloques, guardado y acciones. Complementa el contrato de estados y aptitud en [`empleados-estados-completitud-aptitud.md`](./empleados-estados-completitud-aptitud.md).

**Índice empleados:** [`flujos/empleados.md`](./flujos/empleados.md). **Carga técnica y Playwright:** [`ficha-empleado-funcionamiento-y-tests-visuales.md`](./ficha-empleado-funcionamiento-y-tests-visuales.md).

---

## 1. Principios UX (implementados)

- **Tabs** para áreas de información; cada chip muestra etiqueta de estado (`Completo`, `Revisar`, `Bloqueante`, `Pendiente`) derivada del helper `evaluarCompletitudYAptitudEmpleado`.
- **Lectura por bloques** dentro del tab activo; **Edición** solo en el bloque elegido (inline, sin modal de ficha completa).
- **Guardado por sección** al servidor (`guardarSeccionFicha`), no guardado global de toda la ficha en un solo POST.
- **Panel superior** (`file-state-overview`): estado de ficha, aptitud, pendientes y CTA principal alineados al helper.
- **Panel lateral** (`file-status-panel`): completitud %, resumen operativo, faltantes, impacto y acciones rápidas (misma lógica de CTA que arriba).
- **Modales** solo para microacciones: confirmar **Validar para remuneraciones**, confirmar descarte al cambiar de tab con cambios sin guardar (`window.confirm`).

---

## 2. Layout real (orden visual)

```text
1. Cabecera (file-sheet-head)
   - Breadcrumb · Hero compacto (nombre, RUT, cargo, centro de costo) · Volver + CTA principal

2. Panel estado operativo (file-state-overview)
   - Título estado ficha · Aptitud · Resumen pendientes · Botón acción siguiente

3. [Opcional] Feedback validación / error

4. Cuerpo (file-body)
   ├─ Columna principal (file-body-main)
   │    · Chips de tabs (orden fijo, ver §3)
   │    · Bloques del tab (lectura o formulario inline + Guardar / Cancelar)
   └─ Panel lateral (file-status-panel)
        · Completitud · Estados operativos · Faltantes · Impacto · Acciones rápidas
```

No hay wizard dentro de la ficha. La **remuneración** en ficha es datos de contrato/remuneración del empleado; el enlace **«Administrar haberes y descuentos»** aparece solo si `aptoParaRemuneraciones` y tab Remuneración activo.

---

## 3. Pestañas — orden, persistencia y bloques

Orden en código (`tabs` en `ficha-empleado-container.ts`). **`saveTarget`**: valor enviado a `guardarSeccionFicha` (null = sin persistencia en ese tab).

| # | Tab (`id`) | Etiqueta UI | `saveTarget` | Modo edición | Bloques en lectura (secciones `detailItems`) | Componente(s) al editar |
|---|------------|-------------|--------------|--------------|---------------------------------------------|---------------------------|
| 1 | `general` | General | `general` | Sí | Identificación legal; Nombre del colaborador; Información personal y contacto; Domicilio particular | `app-empleado-datos-personales` (identificación, nombre, base), `app-empleado-contacto` (ubicación) |
| 2 | `laboral` | Laboral | `laboral` | Sí | Relación laboral; Contrato; Centro de costo y estado | `app-empleado-contrato` (relación, contrato, centro-costo; incluye cargo y fechas) |
| 3 | `remuneracion` | Remuneración | `remuneracion` | Sí | Remuneración; Cargas familiares; Zona extrema; Beneficio semana corrida | `app-empleado-contrato` (mismos controles contrato: horas, sueldo, gratificación, cargas, zona, semana corrida) |
| 4 | `prevision` | Previsión y salud | `prevision` | Sí | Régimen previsional; AFP o IPS; Salud; APVI (si AFP) | `app-empleado-prevision-salud` (regimen abre AFP/IPS/salud/apvi según tipo) |
| 5 | `pago` | Pago | `pago` | Sí | Cuenta de abono | `app-empleado-bancario` |
| 6 | `documentos` | Documentos | **null** | **No** (solo lectura) | Contrato / Anexos / Certificados / Pendientes — **placeholders** informativos | — |
| 7 | `historial` | Historial | **null** | **No** | No usa bloques: **DataGrid** con filas desde `empleado.historial` | — |

### 3.1 Mapeo bloque `id` → guardado

Al guardar, se validan solo los controles del **`editingBlock`** (`controlsForActiveBlock`). El `saveTarget` es el **tab activo** (no el blockId): un mismo `saveTarget` agrupa varios bloques del tab (p. ej. General guarda datos personales + contacto en sección `general`).

### 3.2 Estados en chips de tab

- Si el helper considera la ficha **apto** (`aptoParaRemuneraciones`): todos los tabs en **Completo**.
- Si no: según `seccionesPendientes` del helper se marca **Bloqueante** en `pago`, `remuneracion` o `prevision` cuando la sección pendiente cae en ese tab; en otros casos **Revisar** o **Pendiente** (`documentos` / `historial` suelen quedar en Pendiente si no hay pendiente mapeado).

Detalle de reglas de negocio y aptitud: **empleados-estados-completitud-aptitud** (no repetir aquí la lista de bloqueos).

---

## 4. Flujo de usuario por pestaña

1. **General** — Revisar identificación, nombre, contacto y domicilio. **Editar** por bloque → corregir → **Guardar cambios** o **Cancelar**.
2. **Laboral** — Relación laboral, datos de contrato, centro de costo y cargo. Mismo patrón.
3. **Remuneración** — Jornada, sueldo base, gratificación, cargas, zona extrema, semana corrida. Enlace a haberes solo si ya apto.
4. **Previsión y salud** — Tipo régimen (AFP/IPS/Ninguna); se muestran u ocultan subbloques según tipo. APVI solo con AFP.
5. **Pago** — Banco, tipo cuenta, número cuenta.
6. **Documentos** — Solo lectura; textos genéricos hasta que exista módulo de documentos.
7. **Historial** — Tabla de eventos; sin edición inline.

---

## 5. Acciones globales (fuera del tab)

| Acción | Comportamiento |
|--------|----------------|
| CTA cabecera / overview / «Acciones rápidas» | `handlePrimaryFichaAction`: si aplica **Validar para remuneraciones** → modal; si borrador avanzado → `/empleados/nuevo?idPersona=`; si hay bloqueos del helper → ir al tab recomendado; si no → `startEditing()` primera sección. |
| **Editar sección actual** (lateral) | `startEditing()` sin cambiar de tab. |
| Cambiar tab con cambios sin guardar | `window.confirm` descartar o cancelar cambio de tab. |

La **aptitud para remuneraciones** y **`estado_ficha = VALIDO`** por opción B se logran con la acción explícita **Validar para remuneraciones** (no como efecto automático de guardar una sección). El guardado parcial puede dejar la ficha **completa según helper** pero **pendiente de validación**; ver tema estados §21.

---

## 6. Referencia de código

| Qué | Dónde |
|-----|--------|
| Tabs y labels | `ficha-empleado-container.ts` → `tabs` |
| Ítems lectura por tab | `detailItems()` |
| Bloques agrupados | `detailBlocks()` |
| Sección API guardar | `saveTargetForTab()` |
| Edición por bloque | `editComponentForBlock()`, `startEditing()`, `saveSection()` |
| Plantilla | `ficha-empleado-container.html` |

---

## 7. Formularios y errores

Seguir [`../ui-form-guidelines.md`](../ui-form-guidelines.md): errores por campo, resumen en bloque si falla guardado, no salir de edición con error de validación; errores de backend muestran mensaje y permiten reintentar.

---

## 8. Modo básico vs ficha

El alta **básica** abre la ficha incompleta; el usuario completa por estas mismas pestañas. Referencia: [`modo-basico-empleado.md`](./modo-basico-empleado.md).
