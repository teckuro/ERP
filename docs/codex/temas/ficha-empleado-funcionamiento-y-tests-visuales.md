# Ficha empleado — funcionamiento detallado y tests de imagen

## Objetivo

Explicar **cómo funciona** la pantalla de ficha (`/empleados/:id`) en el front Angular y **cómo se hacen / dónde viven** las pruebas Playwright que usan **capturas de pantalla** (snapshots visuales o PNG de referencia).

Complementa (sin sustituir):

- [`flujo-edicion-ficha-empleado.md`](./flujo-edicion-ficha-empleado.md) — flujo UX de edición por tabs y bloques.
- [`empleados-estados-completitud-aptitud.md`](./empleados-estados-completitud-aptitud.md) — estados, helper de completitud y validación para remuneraciones.
- [`../ui-form-guidelines.md`](../ui-form-guidelines.md) — formularios y mensajes.

---

## 1. Ruta y componente

| Concepto | Valor |
|----------|--------|
| Ruta Angular | `/empleados/:id` (`:id` = `id_persona` numérico). |
| Definición de rutas | `src/app/features/empleados/empleados.routes.ts` — segmento `:id` carga `FichaEmpleadoContainer`. |
| Componente | `src/app/features/empleados/containers/ficha-empleado-container/` (`*.ts`, `*.html`, `*.css`). |

El contenedor obtiene el id desde `ActivatedRoute.snapshot.paramMap`, valida que sea entero positivo y llama en paralelo a:

1. **`EmpleadosCatalogosService.obtenerFormulario()`** — catálogos para selects y etiquetas.
2. **`EmpleadosService.obtenerPorId(id)`** — detalle de ficha (`EmpleadoFichaDetalle`: listado + `formValue` + historial).

Si no hay empleado o falla la red, se muestra mensaje de error; si hay datos, se hace **`patchFormFromEmployee`** para hidratar el `ReactiveFormsModule` (`EmpleadoFormGroup` creado por `EmpleadosFormOrchestratorService`).

---

## 2. Estructura de la UI (orden de lectura en pantalla)

1. **Cabecera** — `app-record-breadcrumb` (Empleados → Ficha), hero compacto (nombre, RUT, cargo, centro de costo) y botonera (Volver + acción principal según estado).
2. **Panel de estado** (`file-state-overview`) — título de estado de ficha, etiqueta de aptitud/pendiente de validación, resumen de pendientes (hasta 3 ítems) y botón de **acción siguiente** (misma lógica que el primario del hero cuando aplica).
3. **Feedback** — éxito o error tras validar remuneraciones (lista corta de bloqueos si falla).
4. **Cuerpo** — **tabs** (General, Laboral, Remuneración, Previsión y salud, Pago, Documentos, Historial) y contenido del tab activo.
5. **Modo lectura vs edición** — por tab: vista tipo ficha (`detailItems` / bloques) o bloques editables (`*Component` de sección) cuando el usuario entra en edición (`startEditing` / `editingTab`).

Principio alineado al orquestador: **estado → pendientes → acción → detalle**; no se muestra todo el formulario como única vista plana.

---

## 3. Tabs, secciones y guardado

- Cada tab tiene un **mapeo** a la sección persistida con **`EmpleadosService.guardarSeccionFicha(personaId, seccion, payload)`** (`general` → datos personales + contacto según implementación; `laboral`, `remuneracion`, `prevision`, `pago`).
- **`saveSection()`** arma el payload con **`buildPayloadForSave()`**, valida controles del bloque activo y, si es válido, guarda y **reemplaza** `empleado` con la respuesta del servidor (ficha actualizada + `formValue`).
- Al **cambiar de tab** con cambios sin guardar, el contenedor pide confirmación para descartar o cancelar el cambio de tab.

`Documentos` e `Historial` suelen ser **solo lectura** u operaciones distintas (`canEditCurrentTab()` los excluye de edición inline principal).

---

## 4. Evaluación de completitud y acción principal

La ficha reutiliza el helper central:

```text
evaluarCompletitudYAptitudEmpleado({
  payload: mapFichaEmpleadoToEvaluacionInput(empleado),
  pasoAltaAvanzada: empleado.pasoAltaAvanzada,
})
```

- **`evaluacionEmpleado()`** — resultado en vivo según formulario + datos de listado.
- **`estadoFichaVisualLabel`**, **`payrollReadinessEvaluadoLabel`**, **`pendingItemsEvaluados`**, **`primaryActionEvaluadaLabel`** — copy de negocio para panel y botones.
- **`canValidateForPayroll()`** — solo si aplica la **opción B**: sin borrador avanzado, sin bloqueos ni defaults técnicos del helper, estado operativo compatible, y aún no apto/validado según reglas documentadas en [`empleados-estados-completitud-aptitud.md`](./empleados-estados-completitud-aptitud.md) §21.

**`handlePrimaryFichaAction`:**

1. Si `canValidateForPayroll` → abre diálogo **Validar para remuneraciones**.
2. Si `pasoAltaAvanzada !== null` → navega a `/empleados/nuevo?idPersona=...` (**Continuar alta**).
3. Si hay bloqueos del helper → **`selectRecommendedTab`** (llevar al usuario al primer pendiente).
4. Si no → **`startEditing()`** (Completar / editar ficha).

---

## 5. Validar para remuneraciones (resumen técnico)

1. Confirmación en modal (copy acordado en HTML del contenedor).
2. **`validarFichaParaRemuneraciones()`** comprueba de nuevo `canValidateForPayroll`; si falla, muestra errores humanizados sin llamar al API.
3. Llamada a **`EmpleadosService.validarFichaParaRemuneraciones(id, payload)`** → repository: valida estado operativo, reevalúa helper con `paso_alta_avanzada` desde BD, y si es apto actualiza **solo** columnas de `persona` (no contrato ni banco vía este método).

Detalle de negocio: mismo documento de estados §21.

---

## 6. Historial y DataGrid

El tab **Historial** usa **`DataGridComponent`** con columnas definidas en el contenedor (`historyColumns`) y filas derivadas del historial del detalle (si el backend las entrega). Sirve para trazabilidad de cambios en ficha sin sustituir bitácoras de otros módulos.

---

## 7. Tests de imagen (Playwright)

### 7.1 Configuración global

Archivo: **`playwright.config.ts`**

| Opción | Efecto |
|--------|--------|
| `testDir: './tests'` | Specs bajo `tests/`. |
| `snapshotDir: './tests/__snapshots__'` | Baseline de **`expect(...).toHaveScreenshot(...)`** (comparación visual con diff). |
| `expect.toHaveScreenshot.maxDiffPixelRatio` | **0.01** por defecto (1 % de píxeles pueden diferir). |
| `use.baseURL` | `http://localhost:4200` |
| `use.viewport` | 1440×900 (desktop de referencia). |
| `webServer` | Arranca `ng serve` si no hay servidor; `reuseExistingServer: true` reutiliza uno ya levantado. |

Para **actualizar** baselines tras un cambio visual intencional:

```bash
npx playwright test --update-snapshots
```

(o limitar por archivo con `npx playwright test tests/dashboard.spec.ts --update-snapshots`).

### 7.2 Dos patrones de “imagen”

| Patrón | API | Dónde queda el archivo | Uso típico |
|--------|-----|------------------------|------------|
| **Snapshot de test** | `await expect(locatorOrPage).toHaveScreenshot('nombre.png', { ... })` | `tests/__snapshots__/...` (según proyecto y nombre del test) | Regresión visual: el test **falla** si la imagen difiere del umbral. |
| **PNG de documentación o artefacto** | `await page.screenshot({ path: join(outDir, 'archivo.png'), fullPage: true })` | Carpeta explícita (p. ej. `docs/codex/assets/...`) | Catálogo de capturas para humanos o docs; **no** compara contra baseline de Playwright salvo que se añada lógica propia. |

### 7.3 Specs relevantes en este repo

**`tests/dashboard.spec.ts`**

- Recorre rutas (`/`, `/empleados`, …) con **`expect(page).toHaveScreenshot(`${route.name}.png`, { fullPage: true })`** — incluye listado de empleados a nivel página completa.
- Test **`empleados - flujo nueva ficha`**: wizard **`/empleados/nuevo`** (alta avanzada en formulario empleado), rellena datos mínimos y toma **cuatro** snapshots: identificación, laborales, previsión/salud, administrativos/banco. Nombres: `empleados-nueva-ficha-*.png`.

**`tests/empleados-basic-create.spec.ts`**

- Pantalla **`/empleados/nuevo?modo=basico`**.
- Test visual: **`expect(shell).toHaveScreenshot('empleado-creacion-basica-desktop.png', { maxDiffPixelRatio: 0.03, animations: 'disabled' })`** sobre `.basic-create-page` — umbral algo más laxo que el global del config.

**`tests/parametros-tabs.screenshots.spec.ts`** (referencia de patrón)

- Itera pestañas de **`/parametros`** y escribe PNG en **`docs/codex/assets/parametros-tabs/`** con `page.screenshot` (no `toHaveScreenshot`). Sirve de ejemplo si se desea un **pack de capturas** de la ficha para documentación, con variable de entorno para el subdirectorio.

### 7.4 Ficha `/empleados/:id` y capturas

Hoy **no** hay en el repo un spec dedicado que haga `toHaveScreenshot` de la **ficha por id** con datos reales: depende de **Supabase / datos** y de un `id` estable. Para añadirlo en el futuro:

1. Usar **seed** o empleado de prueba conocido (mismo entorno E2E).
2. `await page.goto('/empleados/<id>')`, esperar fin de carga (`Preparando` / spinners ocultos según copy del contenedor).
3. Opcional: una captura por tab (`click` en `.file-tab-chip` o similar) + `toHaveScreenshot` con nombre estable.
4. Documentar en CI si el snapshot solo corre con credenciales o datos mock.

Los **tests unitarios** de la ficha (`ficha-empleado-container.spec.ts`) validan lógica de labels y `canValidateForPayroll` **sin** imágenes.

---

## 8. Buenas prácticas al tocar UI que tiene snapshot

1. Cambiar copy o layout de rutas con snapshot implica **regenerar baseline** o ajustar `maxDiffPixelRatio` con criterio (no subir el umbral global sin consenso).
2. Mantener **viewport** y **tamaño de fuente** consistentes entre local y CI para menos falsos positivos.
3. Desactivar animaciones en la captura si hay parpadeo (`animations: 'disabled'` en opciones de `toHaveScreenshot` donde aplique).
4. Registrar mejoras visuales acordadas en [`../peticiones-estilos.md`](../peticiones-estilos.md) según contrato `AGENTS.md`.

---

## 9. Comandos útiles

```bash
# Servidor ya en 4200: ejecutar solo tests (incluye comparación de snapshots)
npx playwright test tests/dashboard.spec.ts tests/empleados-basic-create.spec.ts

# Actualizar imágenes de referencia tras cambio visual aprobado
npx playwright test tests/dashboard.spec.ts --update-snapshots

# Generar PNG de parámetros (patrón screenshot a disco)
npx playwright test tests/parametros-tabs.screenshots.spec.ts
```

---

## 10. Referencias de código (navegación rápida)

| Tema | Archivo principal |
|------|-------------------|
| Rutas empleados | `src/app/features/empleados/empleados.routes.ts` |
| Contenedor ficha | `src/app/features/empleados/containers/ficha-empleado-container/ficha-empleado-container.ts` |
| Plantilla ficha | `.../ficha-empleado-container.html` |
| Tests unit ficha | `.../ficha-empleado-container.spec.ts` |
| Config Playwright | `playwright.config.ts` |
| Snapshots baseline | `tests/__snapshots__/` (estructura generada por Playwright) |
