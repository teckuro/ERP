# Ficha empleado (`/empleados/:id`)

Documento único del **flujo de pantalla** (tabs, bloques, guardado) y del **comportamiento técnico / pruebas visuales**. Contrato de estados y helper: [`contrato-general.md`](./contrato-general.md). Índice de rutas empleados: [`../../temas/flujos/empleados.md`](../../temas/flujos/empleados.md).

---

# Parte A — Flujo UX y pestañas

## Objetivo

Describir el flujo **real** de la pantalla **`/empleados/:id`** (`FichaEmpleadoContainer`): layout, orden de pestañas, bloques, guardado y acciones.

## 1. Principios UX (implementados)

- **Expediente (rail izquierdo)** para las 7 áreas; chip de estado (`Listo`, `Pendiente`, `Crítico`, `En curso`) derivado de `tabStatus` / bloque activo vía `ficha-empleado-presentacion.rules.ts` y `evaluarCompletitudYAptitudEmpleado`.
- **Lectura por bloques** en el centro del bloque activo; **Edición** solo en el bloque elegido (inline, sin modal de ficha completa).
- **Edición integrada:** el mismo `detail-block--editorial` actúa como card en lectura y edición. En lectura: `h3` del bloque + **Editar**. En edición: barra **Guardar cambios** / **Cancelar** sin repetir el título del bloque; el `h2` del tab se oculta (el rail ya indica el bloque activo). Si el seccional expone una sola subsección (`editVisibleBlocks.length === 1`), se oculta la cabecera interna duplicada del `app-card`.
- **Guardado por sección** al servidor (`guardarSeccionFicha`), no guardado global de toda la ficha en un solo POST.
- **Panel diagnóstico (derecha):** completitud %, resultado remuneraciones, faltantes deduplicados, **Motivo principal** y **una** acción principal (`ejecutarAccionPrincipalPanel`). Sin «Impacto operativo» ni «Editar bloque actual».
- **Shell:** breadcrumbs y chip de estado; **sin** `primaryAction` duplicado (CTA canónico en panel derecho).
- **Modales** solo para microacciones: confirmar **Validar para remuneraciones**, confirmar descarte al cambiar de bloque con cambios sin guardar (`window.confirm`).

Fase visual: [`emp-ficha-expediente-noia-01.md`](./emp-ficha-expediente-noia-01.md).

## 2. Layout real (orden visual)

```text
1. Toolbar mínima (volver)
2. [Opcional] Feedback validación / error
3. employee-record-shell
   3.1 Header compacto (avatar, nombre, badge, meta en línea)
   3.2 employee-record-layout
       - Rail expediente (izquierda)
       - Bloque activo editorial (centro)
       - Diagnóstico (derecha)
```

## 3. Bloques del expediente — orden, persistencia y contenido

Orden en código (`tabs` en `ficha-empleado-container.ts`). **`saveTarget`**: valor enviado a `guardarSeccionFicha` (null = sin persistencia en ese tab).

| # | Tab (`id`) | Etiqueta UI | `saveTarget` | Edición | Resumen bloques / componentes |
|---|------------|-------------|----------------|---------|-------------------------------|
| 1 | `general` | General | `general` | Sí | Datos personales + contacto → `app-empleado-datos-personales`, `app-empleado-contacto` |
| 2 | `laboral` | Laboral | `laboral` | Sí | Contrato / centro / cargo → `app-empleado-contrato` |
| 3 | `remuneracion` | Remuneración | `remuneracion` | Sí | Sueldo, cargas, zona, semana corrida → `app-empleado-contrato` |
| 4 | `prevision` | Previsión y salud | `prevision` | Sí | Régimen AFP/IPS, salud, APVI → `app-empleado-prevision-salud` |
| 5 | `pago` | Pago | `pago` | Sí | Cuenta de abono → `app-empleado-bancario` |
| 6 | `documentos` | Documentos | **null** | No | Placeholders informativos |
| 7 | `historial` | Historial | **null** | No | `DataGrid` con `empleado.historial` |

Al guardar se validan los controles del **`editingBlock`**; el `saveTarget` es el **tab activo**. Reglas de aptitud / bloqueos: [`contrato-general.md`](./contrato-general.md). Validación remuneraciones: [`validar-remuneraciones.md`](./validar-remuneraciones.md).

## 4. Flujo por pestaña

1. **General** — Identificación, nombre, contacto, domicilio. Editar → Guardar / Cancelar.
2. **Laboral** — Relación laboral, contrato, centro de costo, cargo.
3. **Remuneración** — Jornada, sueldo, gratificación, cargas, zona extrema, semana corrida. Enlace a haberes si `aptoParaRemuneraciones`.
4. **Previsión y salud** — AFP / IPS / Ninguna; APVI condicional.
5. **Pago** — Banco, tipo cuenta, número.
6. **Documentos** — Solo lectura.
7. **Historial** — Tabla; sin edición inline.

## 5. Acciones globales

| Acción | Comportamiento |
|--------|----------------|
| CTA principal (panel diagnóstico) | `ejecutarAccionPrincipalPanel`: validar remuneraciones, completar pago, continuar alta o `handlePrimaryFichaAction`. |
| Editar sección | `startEditing()` en el bloque del tab activo. |
| Faltante en panel | `navegarFaltante` → `selectTab` del bloque. |
| Cambiar de bloque con cambios | `window.confirm`. |

## 6. Referencia de código

`ficha-empleado-container.ts` / `.html` — `tabs`, `detailItems()`, `detailBlocks()`, `saveTargetForTab()`, `saveSection()`, `editComponentForBlock()`.

Formularios: [`../../ui-form-guidelines.md`](../../ui-form-guidelines.md).

Alta básica y llegada a ficha: [`creacion-basica.md`](./creacion-basica.md).

---

# Parte B — Carga técnica y tests de imagen

## B.1 Ruta y componente

| Concepto | Valor |
|----------|--------|
| Ruta | `/empleados/:id` |
| Rutas | `src/app/features/empleados/empleados.routes.ts` |
| Contenedor | `src/app/features/empleados/containers/ficha-empleado-container/` |

Carga paralela: `EmpleadosCatalogosService.obtenerFormulario()` + `EmpleadosService.obtenerPorId(id)` → `patchFormFromEmployee`.

## B.2 Guardado y helper

`guardarSeccionFicha` con secciones `general` \| `laboral` \| `remuneracion` \| `prevision` \| `pago`. `evaluarCompletitudYAptitudEmpleado` con payload adaptado desde el formulario.

## B.3 Playwright

- Config: `playwright.config.ts` (`snapshotDir: tests/__snapshots__`, viewport 1440×900).
- Snapshots rutas: `tests/dashboard.spec.ts`; wizard nueva ficha; `tests/empleados-basic-create.spec.ts` (modo básico).
- **No** hay aún spec estable de capturas de `/empleados/:id` por dependencia de datos; ver criterios en tests-empleados.

```bash
npx playwright test tests/dashboard.spec.ts tests/empleados-basic-create.spec.ts
npx playwright test tests/dashboard.spec.ts --update-snapshots
```

## B.4 Referencias rápidas

| Tema | Archivo |
|------|---------|
| Tests unit ficha | `ficha-empleado-container.spec.ts` |
| Config Playwright | `playwright.config.ts` |

Cambios visuales: [`../../peticiones-estilos.md`](../../peticiones-estilos.md).
