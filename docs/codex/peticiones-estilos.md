# Peticiones de estilos - bitácora vigente

> Bitácora cronológica inversa de cambios visuales/copy/UI del ERP. Entradas más recientes arriba.
>
> **Ventana viva**: solo se mantienen las entradas del mes en curso y el mes anterior. Cuando se rota, las entradas antiguas pasan a [`archivo/`](./archivo/).
>
> **Histórico rotado**:
> - [`archivo/peticiones-estilos-2026-05.md`](./archivo/peticiones-estilos-2026-05.md) — mayo 2026 y anteriores (288 entradas, rotadas el 2026-06-03 por DOCS-AUDIT-02 / L3).

---
## 2026-06-03 - Nómina mensual — Reconstrucción Admin + Generador (NOM-REBUILD-NOMINA-MENSUAL-01 F0+F1)

Inicio de la **reconstrucción controlada** del módulo según el prompt rector `prompt_reconstruccion_controlada_nomina_mensual.md`. Esta entrada cubre F0 (documentación arquitectónica) + F1 (modelos centrales + adapter mock + tests). F2-F7 declaradas pero no ejecutadas en esta iteración. **Sin cambios visuales**: el alcance es modelos + adapter mock + documentación, no UI.

### Decisión arquitectónica

- **Nómina mensual** → Administrador de nóminas (bandeja de N nóminas por período, lista `NominaPeriodoResumen[]`).
- **Nómina mensual V2** → Generador de una nómina por `:nominaPeriodoId`, stepper de 6 pasos: `Parámetros / Dotación / Movimientos / Cálculo / Validación / Cierre`.
- **Naming definitivo**: `Dotación` (paso del Generador, reemplaza Alcance+Empleados) + `SegmentoNomina` (grupo operativo, reemplaza Sub-base / Sub-nómina). NO usar `Base`, `Sub-base`, `SubBaseNomina`, `Sub-nómina`.
- **Routing definitivo**: `/remuneraciones/nominas` (Admin) + `/remuneraciones/nominas/:nominaPeriodoId/generador` (Generador). Implementación en F3.
- **Servicios**: sufijo `mock-adapter` para F1 (datos in-memory), `calculo-adapter` para F6 (puente al motor), `.repository.ts` / `.service.ts` para productivo futuro.

### F0 — Documentación arquitectónica

- **Nuevo**: [`docs/codex/modulos/nomina-mensual/arquitectura-administrador-generador.md`](./modulos/nomina-mensual/arquitectura-administrador-generador.md) (~260 líneas) — decisión rectora completa: roles, naming, stepper, routing, principio rector (trabajo por excepción), modelos centrales, adapter mock, reglas de uso de mocks, fases declaradas, restricciones levantadas vs vigentes.
- **Actualizado**: [`docs/codex/orquestador/estado-fases/nomina-mensual.md`](./orquestador/estado-fases/nomina-mensual.md) — entrada `NOM-REBUILD-NOMINA-MENSUAL-01` (Implementada F0+F1). Marcada como `Superseded by NOM-REBUILD-NOMINA-MENSUAL-01`: `NOM-MULTI-NOMINA-01` (la nueva arquitectura resuelve los 3 escenarios planteados con `tipo: 'extraordinaria'` + Admin que maneja N nóminas por período).
- **Actualizado**: [`docs/codex/orquestador/contexto-proyecto.md`](./orquestador/contexto-proyecto.md) — sección de módulos con la reinterpretación del menú.
- **Actualizado**: [`docs/codex/contexto-rapido.md`](./contexto-rapido.md) — sección 8 "Decisiones de producto vigentes" con el bullet de la reconstrucción.
- **Actualizado**: [`docs/codex/modulos/nomina-mensual/README.md`](./modulos/nomina-mensual/README.md) — cabecera con link al documento rector.
- **Actualizado**: [`.gitignore`](../../.gitignore) — agrega excepción para `arquitectura-administrador-generador.md` siguiendo el patrón del repo (otras `nomina-*` están como excepciones explícitas).

### F1 — Modelos centrales + adapter mock + tests

Ubicación: `src/app/features/nomina-mensual/models/` y `.../services/` (compartido entre Admin y Generador, conviven con los modelos productivos existentes `proceso-mensual.model.ts` y `acta-operativa-periodo.model.ts`).

#### Modelos nuevos (19 tipos)

- **`nomina-periodo.models.ts`** (12 tipos): `EstadoNomina` (9 estados, inicial `dotacion_generada`), `TipoNomina` (mensual/quincenal/semanal/extraordinaria), `NominaPeriodoResumen`, `NominaPeriodo`, `SegmentoNomina` (tipo: planta/honorarios/centro_costo/personalizada, estado: borrador/lista/bloqueada), `IncidenciaNomina` (severidad + `bloqueante: boolean`), `ResumenValidacionNomina` (doble guardia `puedeCalcular` + `puedeCerrar`), `EstadoTrabajadorNomina` (6 estados), `FilaTrabajadorNominaResumen` (campos resumidos sin detalle), `DetalleTrabajadorNomina` (bajo demanda), `FiltroRapidoDotacion`, `PaginacionGrilla`, `EventoAuditoriaNomina` (TODO declarado para trazabilidad cierre/reapertura). Helpers: `crearNominaResumen`, `crearNomina`, `crearSegmento`, `agregarTrabajadorASegmento` (rechaza duplicidad), `moverTrabajadorEntreSegmentos` (preserva movimientos).
- **`movimiento-nomina.models.ts`** (7 tipos): `MovimientoTipo` (union string abierta), `MovimientoCategoria` (haber/descuento/ausencia/informativo), `MovimientoUnidad`, `MovimientoFrecuencia`, `MovimientoRecurrente` (segmentación por `trabajadorId? / segmentoId? / centroCostoId? / cargoId? / tipoContratoId? / grupoId?`), `MovimientoNomina` (con `recurrenteId?` para idempotencia y `estado='omitido'` que respeta decisión manual), `CriterioAplicacionRecurrente` (discriminated union por 6 criterios — fuerza exhaustividad en `switch`), `AccionMasivaTrabajadores` (4 acciones), `PreviewAccionMasivaTrabajadores` (preview obligatorio con `puedeAplicar`).

#### Mock determinístico

- **`data/nomina-periodo.mock.ts`**: 5 `NominaPeriodoResumen` (mezcla `borrador / dotacion_generada / calculada / aprobada / cerrada` + 1 `extraordinaria`), 3 `SegmentoNomina` (planta 14 trab / honorarios 6 trab / proyecto 4 trab), 6 `MovimientoRecurrente` (uno por cada criterio de segmentación), 3 `MovimientoNomina` (mezcla recurrente aplicado / manual / omitido), 8 `IncidenciaNomina` (mezcla críticas bloqueantes / advertencias / informativas), 24 `FilaTrabajadorNominaResumen` (paginación), 3 `DetalleTrabajadorNomina` clave-valor por trabajador. Cabecera obligatoria: `NO importar desde servicios productivos definitivos`.

#### Adapter mock

- **`services/nomina-periodo-mock-adapter.service.ts`** (`@Injectable({ providedIn: 'root' })`, 9 métodos públicos):
  - `listarResumenes()` — Admin lista resúmenes sin detalle.
  - `obtenerNomina(id)` — Generador carga 1 nómina por id.
  - `consolidarSegmentosParaCalculo(id): ResultadoAlcanceNomina` — puente al orquestador V2 actual (compatible).
  - `aplicarRecurrentesANomina(id)` — **idempotente** (clave `nominaPeriodoId + trabajadorId + recurrenteId + tipo`) y **respeta omitidos** (si la clave tiene `estado='omitido'`, NO reaplica).
  - `aplicarRecurrentePorCriterio(criterio, id, recurrenteId?)` — discriminated union por 6 criterios, exhaustivo via `never`.
  - `validarDuplicidadTrabajadorSegmento(id)` — incidencias bloqueantes.
  - `obtenerResumenValidacionNomina(id)` — `puedeCalcular` + `puedeCerrar`.
  - `filtrarDotacion(id, filtro, paginacion)` — filtros + paginación, NO retorna detalle.
  - `obtenerDetalleTrabajador(id, trabajadorId)` — bajo demanda.
  - `previsualizarAccionMasiva(id, trabajadorIds, accion)` — preview obligatorio antes de aplicar.

#### Tests (28 nuevos)

- **`models/nomina-periodo.models.spec.ts`** (5 tests obligatorios): helpers de creación, estado inicial `dotacion_generada`, ordinal del segmento, **rechazo de duplicidad** entre 2 segmentos activos, **mover trabajador preservando movimientos**.
- **`services/nomina-periodo-mock-adapter.service.spec.ts`** (23 tests, 20 obligatorios + 3 extras): aplicación de recurrentes activos, **idempotencia (dos veces no duplica)**, **respeto de omitidos (no reaplica `estado='omitido'`)**, aplicación por cada uno de los 6 criterios (trabajador/segmento/centro-costo/cargo/tipo-contrato/grupo — los dos últimos exhaustivos sin data en F1), `filtrarDotacion` por incidencia, paginación 10x10x4 (total=24), shape `FilaTrabajadorNominaResumen` sin campos de detalle, detalle bajo demanda, resumen de validación, doble guardia `puedeCalcular`/`puedeCerrar`, `puedeCerrar=true` sin críticas (con advertencias permitido), `consolidarSegmentosParaCalculo` compatible con orquestador, preview no modifica nómina, `puedeAplicar` reacciona a críticas. Extras: `listarResumenes` (N por período), `validarDuplicidadTrabajadorSegmento`, búsqueda case-insensitive.

### Reglas críticas declaradas

1. **Trabajo por excepción**: el usuario no revisa todos los trabajadores, solo los que tienen incidencias / cambios / movimientos especiales.
2. **Idempotencia de recurrentes** + **respeto de omitidos**: la decisión manual gana.
3. **Acciones masivas con preview obligatorio**: regla NO opcional antes de aplicar.
4. **Dos guardias de validación**: `puedeCalcular` Y `puedeCerrar` (ambas falsas si hay críticas bloqueantes).
5. **Reglas de uso de mocks**: solo tests / stories / adapters mock / UI temporal F2-F5. Prohibido importar desde servicios productivos.
6. **Auditoría declarada**: `EventoAuditoriaNomina` reservado en `NominaPeriodo.eventosAuditoria?` como TODO; emisión real en F2+F3.

### NO se tocó

- Motor productivo (`features/nomina-mensual/services/proceso-mensual.service.ts`, `NominaCalculoSnapshotRepository`, etc.).
- Routing actual (`/remuneraciones/proceso-mensual`, `/remuneraciones/nomina-mensual-v2`).
- Menú lateral (`shell-navigation.config.ts`).
- Stepper V2 actual (8 pasos, `nomina-mensual-v2.mock.ts`).
- Orquestador V2 (`resultadoAlcance`, `alcanceValidado` siguen).
- Sweep A0-A6 del paso Alcance (89 tests verdes preservados).
- Modelos productivos existentes (`proceso-mensual.model.ts`, `acta-operativa-periodo.model.ts`, `entrada-mensual-periodo.model.ts`).
- BD / SQL / RPC / RLS, Previred, LRE, Reportes, Licencias médicas, liquidaciones productivas.
- `angular.json`, `postcss.config.json`, `src/styles/*`.

### Validación

- `ReadLints` sobre los 7 archivos nuevos → **sin errores**.
- `npx ng test --watch=false --include="**/nomina-mensual/models/nomina-periodo.models.spec.ts" --include="**/nomina-mensual/services/nomina-periodo-mock-adapter.service.spec.ts"` → **28/28 ok** (2 archivos spec).
- `npx ng test --watch=false` (suite completa): **1372/1379 verdes**. Los 7 fallidos (`shell-navigation.config`, `sidebar.component`, `liquidaciones-oficiales.service`, `nomina-msgbox-lab.rules`, `proceso-mensual-flow-nav.rules`) son **pre-existentes** (validado con `git stash`: fallan igual sin mis cambios). NO están relacionados con F1.
- `npx ng build --configuration=development` → **verde, sin warnings de budget**. Bundle `nomina-mensual-v2-page` queda en **696.73 kB** (igual que antes — mis archivos son aditivos, no se importan desde V2).

### Pendiente declarado para iteraciones futuras

- **F2** (UI Administrador): cards resumen + grilla `NominaPeriodoResumen[]` + modal "Nueva nómina" + modal "Ver resumen" (consume `obtenerResumenValidacionNomina`) + acciones condicionadas por estado + navegación al Generador.
- **F3** (Generador definitivo): routing nuevo + menú + stepper de 6 pasos + orquestador V2 unificado.
- **F4** (Dotación escalable): paso unificado con segmentos + filtros rápidos + paginación + virtual scroll + acciones masivas + detalle bajo demanda.
- **F5** (Movimientos integrados): recurrentes aplicados + manuales + omitir / editar este mes + import futuro.
- **F6** (Cálculo / motor): adapter `Segmentos + movimientos → base consolidada → motor actual`.
- **F7** (Limpieza): ruta antigua, stepper antiguo, mocks obsoletos, código sin uso.
- **Deuda pre-existente** (no relacionada con esta fase): 7 tests rojos en 5 archivos de layout / liquidaciones / rules de nomina-mensual v1. Documentado para iteración separada.

---
## 2026-06-03 - Nómina mensual V2 · Paso Alcance — Refinamiento NOIA + datagrid del sistema (A0-A3)

Sweep transversal del paso Alcance siguiendo el contrato NOIA. Cuatro sub-lotes (`A0`/`A1`/`A2`/`A3`) ejecutados en secuencia para reducir ruido, alinear la selección manual con el patrón de Empleados (data-grid reutilizable) y agregar guías contextuales cuando el alcance queda incompleto.

### Cambios

- **A0 — Aside stretch + título compacto + banda stats inteligente**
  - `nomina-mensual-v2-paso-alcance.component.css`: `.nmv2-paso-alcance__body { align-items: stretch }` (antes `start`) — el `<aside>` ahora llega al final del contenido, mismo fix que aplicamos en Empleados.
  - `nomina-mensual-v2-paso-alcance.component.html`: `<h2>` cambia de `"¿Qué trabajadores quieres preparar para esta nómina?"` (8 palabras, competía con la banda de stats por ancho) a **`"Define el alcance de la nómina"`** (6 palabras, NOIA operativo).
  - `nomina-mensual-v2-paso-alcance.component.ts` (`metricasAlcance`): la banda de 4 stats ahora se filtra dinámicamente. Antes mostraba siempre `Encontrados / Incluidos / Excluidos / Bloqueados` con `0`. Ahora:
    - **Sin tipo elegido (`sinConfigurar`)**: solo `Encontrados`.
    - **Con tipo elegido**: `Encontrados + Incluidos + Excluidos`.
    - **Bloqueados**: solo aparece si `> 0` (deja de mostrar `0` que parecía falso positivo).

- **A1 — Lista de 3 tipos NOIA puro**
  - `nomina-mensual-v2-paso-alcance.component.html`: en `__row-mark` se elimina el texto `"Elegir"` / `"Seleccionado"` (redundante con el ícono check y el highlight del row activo). Estado activo muestra solo el ícono `check`; estado disponible muestra `chevron-right`; estado locked sigue mostrando `lock + No disponible` (estado informativo válido).
  - `nomina-mensual-v2-paso-alcance.component.css`: `__row` con `padding: 8px 12px` (antes `10px 12px`, −20% altura). `__row-mark` ahora con color `#94a3b8` (slate-400, antes `#475569`) y `lucide-icon` de `14×14` (antes `12×12`) para que el ícono lea como mark visual sin texto. Estado activo: `__row-mark` cambia a `#047857` (verde afirmativo) en lugar de `#1d4ed8` (azul de la fila activa) para no duplicar el código de color.

- **A2 — Selección manual con `app-data-grid` (reutilización del sistema)**
  - **Nuevo presenter**: `presenters/nomina-alcance-grid.presenter.ts` exporta `COLUMNAS_GRILLA_ALCANCE_MANUAL` (7 columnas: `incluir` ★, `nombre`, `rut`, `cargo`, `centroCosto`, `estadoNomina`, `contrato`) y `crearFiltrosGrillaAlcanceManual(filas)` (búsqueda por tokens + 3 selects sobrios: centro de costo / estado nómina / contrato).
  - **Componente**: importa `DataGridComponent` y `DataGridCellDirective` del `shared/components/ui/data-grid`. Se eliminan los signals `busquedaManual` y `filasSeleccionManual` (ya no se necesitan: el grid maneja su propio filtrado). Se reutiliza el modelo existente `FilaEmpleadoNomina` (mismo del paso Empleados — un solo origen de verdad).
  - **HTML**: el `@if (tipoAlcanceSeleccionado() === 'seleccionManual')` reemplaza la `<ul class="nmv2-paso-alcance__manual">` + input de búsqueda por un `<app-data-grid>` completo con 4 templates de celda custom (`incluir` con checkbox + `nombre` con avatar + `estadoNomina` con badge + `contrato` con badge). Persistencia clave `nmv2-paso-alcance-manual:{periodoYm}` (filtros del usuario se guardan por período).
  - **Por qué**: cuando hay >100 trabajadores, la lista vertical escalaba mal (overflow vertical, sin filtros laterales). El data-grid añade búsqueda por tokens, filtros sobrios, ordenamiento, paginación y empty states diferenciados — todo gratis del componente del sistema, sin código local nuevo.

- **A3 — Sidebar operativo + alert-banner inline**
  - **Alert-banner inline contextual**: nuevo `@if (alcanceVacioRequiereSeleccion())` dentro de `__main` que muestra `alert-banner alert-banner--warning` cuando hay tipo elegido (`grupo` o `seleccionManual`) pero `trabajadoresIncluidos === 0`. Mensaje viene del presenter (`obtenerDescripcionAlcanceVacia(tipo)` ya existente). Antes esta señal solo se notaba en la banda de stats con un `0` ambiguo.
  - **Pill de severidad en checklist**: cada item del sidebar `Lista para continuar` ahora muestra una pill con `Listo` / `Revisar` / `Bloqueo` / `Pendiente` (mismo patrón visual que Empleados con `--correcto / --advertencia / --bloqueante / --neutro`). Los helpers `etiquetaSeveridadChecklistAlcance(status)` y `claseSeveridadChecklistAlcance(status)` son locales al componente (mapean `ChecklistStatus → label/clase`).
  - **CSS**: nuevas reglas `.nmv2-paso-alcance__checklist-row-title` (flex space-between para acomodar título + pill) y `.nmv2-paso-alcance__checklist-severity--*` (4 modificadores).

### NO se tocó

- Modelo `TipoAlcanceNomina` ni discriminant (`'contrato'` sigue válido para fase futura).
- Presenter `nomina-alcance.presenter.ts`: sin cambios (las descripciones y reglas ya cumplían NOIA tras la sesión anterior).
- Orquestador, services productivos, motor, modal de trazabilidad.
- CSS global, `angular.json`, `postcss.config.json`, `src/styles/*`.
- Lógica de avance (`ejecutarAccionPrincipal`, `guardarResultadoYAvanzar`): el contrato sigue igual.

### Hallazgo declarado: nóminas múltiples (NOM-MULTI-NOMINA-01 — propuesta futura)

Durante el sweep surgió la pregunta de cómo generar **múltiples nóminas del mismo período** (ej. nómina principal + complementaria por bono retroactivo + nómina paralela de honorarios). El paso Alcance **no es el lugar correcto** para resolver esto: el modelo actual asume `1 preparación → 1 alcance → 1 resultado` en `orquestador.resultadoAlcance`. La propuesta queda registrada en `orquestador/estado-fases/nomina-mensual.md` como **NOM-MULTI-NOMINA-01 (Propuesta)** para evaluarse cuando se necesite. Tres escenarios diferenciados:

1. **Nómina complementaria** del mismo período (bono retroactivo, finiquito parcial): nuevo `tipoCalculo` sobre la preparación cerrada — no es nuevo alcance.
2. **Reproceso** del mismo alcance: ya cubierto con `seleccionManual` + volver al paso Empleados.
3. **Nóminas paralelas** del mismo período (planta/honorarios/obreros): hoy se modela con `grupo` (centros de costo) — no requiere nóminas separadas.

### Validación

- `ReadLints` sobre los 4 archivos tocados + nuevo presenter — **sin errores**.
- `npx ng test --watch=false --include="**/nomina-mensual-v2/**/nomina-mensual-v2-paso-alcance.component.spec.ts"` → **11/11 ok** (6 previos + 5 nuevos: `metricasAlcance` sin tipo, `metricasAlcance` con tipo, `etiquetaSeveridadChecklistAlcance`, `claseSeveridadChecklistAlcance`, `alcanceVacioRequiereSeleccion`).
- `npx ng test --watch=false --include="**/nomina-mensual-v2/**/*.spec.ts"` → **85/85 ok** (17 specs en V2). Sin regresiones.
- `npx ng build --configuration=development` → **verde, sin warnings de budget**. Bundle lazy `nomina-mensual-v2-page` quedó en 684.05 kB (alta ~6 kB respecto al estado anterior por la importación del `DataGridComponent`; aceptable porque el chunk del data-grid se reutiliza con el paso Empleados, no es código nuevo).

---

## 2026-06-03 - Nómina mensual V2 · Paso Alcance — Panel de incidencias contextual (A6)

Extensión del sweep `NOM-V2-PASO-ALCANCE-REFINAMIENTO-01`. Cuando el usuario elige **`empresaCompleta`** o **`grupo`** y el alcance resultante incluye trabajadores con pendientes (contrato vencido, datos bancarios incompletos, AFP/Salud sin asignar, jornada/centro de costo sin definir, documentación incompleta o estado de nómina observado), se despliega inline un **datagrid del sistema** con esos trabajadores y sus badges de problema. La idea es que el RRHH **vea exactamente quién requiere revisión** antes de avanzar al paso Empleados, en lugar de descubrirlo en el siguiente paso.

### Cambios

- **`presenters/nomina-alcance-grid.presenter.ts`** (extendido):
  - Importa `centroCostoAsignado`, `documentacionIncompleta`, `jornadaDefinida` desde `nomina-empleados-grid.presenter.ts` (reuso, no duplicación).
  - Nuevo helper **`filaTieneIncidenciaAlcance(fila): boolean`**: detecta cualquier dimensión que rompa el alcance (7 criterios — mismos del presenter de validación de empleados).
  - Nuevo helper **`obtenerTrabajadoresConIncidencias(filas, idsIncluidos): FilaEmpleadoNomina[]`**: filtra del conjunto las filas que están incluidas en el alcance Y tienen al menos una incidencia.
  - Nueva columna export **`COLUMNAS_GRILLA_ALCANCE_INCIDENCIAS`** (6 columnas: nombre+avatar, RUT, centro de costo, estado nómina con badge, contrato con badge, datos bancarios con badge). Sin checkbox de "Incluir" (estos trabajadores ya están incluidos: el panel es informativo, no de selección).

- **`nomina-mensual-v2-paso-alcance.component.ts`**:
  - Nuevos computeds: `trabajadoresConIncidencias()` (lista filtrada), `mostrarPanelIncidencias()` (true solo si tipo es `empresaCompleta`/`grupo` y hay ≥1 incidencia), `clavePersistenciaGrillaIncidencias()` (clave por período + tipo de alcance — los filtros que el usuario abra se guardan por contexto).
  - Importa `COLUMNAS_GRILLA_ALCANCE_INCIDENCIAS`, `obtenerTrabajadoresConIncidencias` y `claseBadgeDatosBancarios`.

- **`nomina-mensual-v2-paso-alcance.component.html`**:
  - Nuevo `@if (mostrarPanelIncidencias())` después del panel de grupo (y antes del de selección manual). Sección con título `"Trabajadores con pendientes en el alcance"` + contador `X de Y incluidos tiene observaciones. Revísalos antes de avanzar al paso Empleados.` + `<app-data-grid>` con `[filters]="[]"` (sin filtros — la lista ya es acotada), 4 templates de celda (`nombre`, `estadoNomina`, `contrato`, `datosBancarios`).
  - **No aparece** para `seleccionManual` porque la grilla manual ya muestra los badges en cada fila y permite revisar al elegir.

- **`nomina-mensual-v2-paso-alcance.component.css`**:
  - Nuevas reglas `.nmv2-paso-alcance__panel--incidencias` (mismo patrón que `--grilla` pero con `border-color: #fcd34d` y `background: #fffbeb` — acento ámbar suave que comunica "revisar" sin gritar). Header con `color: #92400e` (titular) y `color: #78350f` (descripción) — ámbar más oscuro para WCAG AA contra fondo ámbar claro.

### NO se tocó

- Modelo de validación: `obtenerResultadoValidacionEmpleados` y `filtrarEmpleadosConPendientes` siguen igual; el helper de incidencias del alcance reusa los predicados base.
- Presenter `nomina-alcance.presenter.ts`: sin cambios.
- Paso Empleados, orquestador, services productivos, motor, BD/RPC/RLS.

### Decisiones rectoras

- **Por qué no usar `app-message-box`**: el dataset puede tener decenas de trabajadores. Un message-box con bullet list escala mal y no permite filtrar/ordenar. El `app-data-grid` es el patrón correcto.
- **Por qué no hay filtros en este datagrid**: la lista ya es acotada (solo incidencias) y agregar filtros invitaría a ocultar problemas. El usuario debe **ver todos** los pendientes y decidir cómo proceder (volver a Parámetros o avanzar a Empleados para corregirlos uno por uno).
- **Por qué no mostrarlo en `seleccionManual`**: en ese modo la grilla principal ya muestra los badges de cada trabajador en sus columnas. Duplicar el panel sería redundante y confuso.
- **Por qué acento ámbar y no rojo**: el panel comunica "revisar", no "bloqueo crítico". El usuario aún puede avanzar (con `app-message-box` de revisión) y resolver en el paso Empleados. Rojo se reservó para `alert-banner--error` del header (errores de carga).

### Validación

- `ReadLints` sobre los 3 archivos tocados (presenter + component.ts + component.html + component.css) — **sin errores**.
- `npx ng test --watch=false --include="**/nomina-mensual-v2/**/nomina-mensual-v2-paso-alcance.component.spec.ts"` → **15/15 ok** (11 previos + 4 nuevos: `filaTieneIncidenciaAlcance` por dimensión, `obtenerTrabajadoresConIncidencias` filtra solo incluidos, `mostrarPanelIncidencias` false en manual, `mostrarPanelIncidencias` true en empresaCompleta).
- `npx ng test --watch=false --include="**/nomina-mensual-v2/**/*.spec.ts"` → **89/89 ok** (17 specs). Sin regresiones.
- `npx ng build --configuration=development` → **verde, sin warnings de budget**. Bundle lazy `nomina-mensual-v2-page` quedó en 696.73 kB (alta ~13 kB respecto a A5 por las nuevas columnas + templates; aceptable, dentro del budget).

---

## 2026-06-03 - Nómina mensual V2 · Paso Alcance — Omitir opción "Por contrato"

Decisión rectora: la opción **"Por contrato"** (estado `preparado` + etiqueta "Próximamente") se omite del listado visible del paso Alcance. La fase para exponer el tipo de contrato desde Personal queda planificada aparte; mientras tanto, mostrar la opción inerte aporta ruido visual y confunde al usuario.

### Cambios

- **`presenters/nomina-alcance.presenter.ts`**: eliminado el bloque `{ id: 'contrato', titulo: 'Por contrato', descripcion: '...', icono: 'file-text', estado: 'preparado', etiqueta: 'Próximamente' }` del array `obtenerOpcionesAlcanceNomina()`. Quedan **3 opciones**: `empresaCompleta`, `grupo`, `seleccionManual`.
- **Branches defensivos preservados**: los `case 'contrato'` en `calcularIdsTrabajadoresIncluidos`, `obtenerResultadoAlcance` (estado `sinConfigurar`), `obtenerMensajeAlcanceBloqueado` y `obtenerDescripcionResumenAlcance` se **mantienen intactos** para que el tipo `TipoAlcanceNomina = 'contrato'` siga siendo válido en el modelo cuando la fase regrese. No se borra el discriminant; solo se oculta la opción de UI.
- **`containers/.../components/nomina-mensual-v2-paso-alcance/nomina-mensual-v2-paso-alcance.component.spec.ts`**:
  - Test renombrado `expone las cuatro opciones de alcance` → `expone las tres opciones de alcance del presenter (sin "contrato", se hará en otra fase)`. Espera ahora `['empresaCompleta', 'grupo', 'seleccionManual']` y `toHaveLength(3)`.
  - Test `seleccionarTipoAlcance ignora opciones deshabilitadas o ya preparadas`: el caso de `deshabilitado` ahora usa `'grupo'` en lugar de `'contrato'` (que ya no aparece en `opcionesAlcance`). La validación de la guard sigue siendo la misma (estado prevalece sobre id).
- **HTML del paso-alcance**: sin cambios manuales — el `@for (opcion of opcionesAlcance; track opcion.id)` deja de renderizar la opción automáticamente al desaparecer del array.

### NO se tocó

- Modelo `TipoAlcanceNomina` (sigue siendo `'empresaCompleta' | 'grupo' | 'contrato' | 'seleccionManual'`). El tipo se preserva para que la fase futura pueda reactivar la opción sin migración de datos.
- Orquestador, services productivos, motor, modal de trazabilidad, copy de otros pasos.
- Spec del presenter (`nomina-alcance.presenter.spec.ts`): no tenía aserciones específicas de `'contrato'`.

### Validación

- `ReadLints` sobre presenter + spec — sin errores.
- `npx ng test --watch=false --include="**/nomina-mensual-v2/**/nomina-mensual-v2-paso-alcance.component.spec.ts"` → **6/6 ok**.
- `npx ng test --watch=false --include="**/nomina-mensual-v2/**/nomina-alcance.presenter.spec.ts"` → **3/3 ok** (branches defensivos no rotos).
- HMR de `npm start` activo: recompiló `nomina-mensual-v2-page` (699.52 kB, −0.25 kB vs anterior) sin errores ni warnings.

---

## 2026-06-03 - Nómina mensual V2 · Paso Empleados — Quitar panel de Trazabilidad + aside hasta el final

Continuación inmediata del cambio anterior ("Quitar 'Registro del paso'"). Decisión rectora: el **panel completo de trazabilidad** ya no aporta valor en el sidebar de Empleados; el contexto ya está cubierto por la cabecera + checklist + leyenda de filtrado, y los detalles de auditoría siguen accesibles desde el modal de trazabilidad global (no afectado).

### Cambios

- **`components/nomina-mensual-v2-paso-empleados/nomina-mensual-v2-paso-empleados.component.html`**: eliminada la línea `<app-nomina-mensual-v2-trazabilidad-paso paso="employees" variant="panel" />` del bloque `Lista para continuar` del sidebar. El bloque ahora arranca con la `<header>` (`Lista para continuar` + lead) seguido directo del `<ul class="...checklist">`.
- **`components/nomina-mensual-v2-paso-empleados/nomina-mensual-v2-paso-empleados.component.ts`**: removido el `import` de `NominaMensualV2TrazabilidadPasoComponent` y su referencia en el array `imports` del `@Component`.
- **`components/nomina-mensual-v2-paso-empleados/nomina-mensual-v2-paso-empleados.component.css`**: `nmv2-paso-empleados__body` cambia de `align-items: start` → `align-items: stretch` para que el `aside` ocupe la **misma altura que el main** (grilla + toolbar), llegando al final del contenido en lugar de quedar acortado a su altura natural.
- **Componente eliminado**: `components/nomina-mensual-v2-trazabilidad-paso/` (carpeta completa borrada — `.html` + `.ts`). Era usado **solo** desde el paso Empleados con `variant="panel"`; la variante `inline` no se usaba en ningún sitio (verificado con grep sobre `src/`).
- **`nomina-mensual-v2-container.css`**: borradas **12 reglas / ~87 líneas** del cluster `.nmv2-trazabilidad-panel*` y `.nmv2-trazabilidad-paso*` (`__head h3`, `__meta`, `__meta div/dt/dd`, `__action`, `__copy`, `__copy em`, `__icon`, `--compact`). Las reglas `.nmv2-trazabilidad-drawer-*` se conservan intactas (corresponden al modal global de trazabilidad, sin relación).
- **NO se tocó**: orquestador, services, presenters, motor, modal global de trazabilidad (`nomina-mensual-v2-trazabilidad-modal`), specs existentes ni copy de otros pasos.

### Validación

- `ReadLints` sobre los 4 archivos editados — sin errores.
- Grep en `src/` de `NominaMensualV2TrazabilidadPasoComponent`, `app-nomina-mensual-v2-trazabilidad-paso`, `nmv2-trazabilidad-panel`, `nmv2-trazabilidad-paso` → **0 matches** residuales.
- `npm start` con HMR activo: recompiló `nomina-mensual-v2-page` (699 kB) en 0,9–2 s, sin errores ni warnings nuevos. Component update enviado al cliente.

### Notas para limpieza futura (opcional)

El orquestador (`nomina-mensual-v2-orquestador.port.ts`) sigue exponiendo `auditoriaPorPaso()`, `eventosTrazabilidad()` y `abrirTrazabilidadPaso()`. Esos métodos siguen vivos porque los consume el modal global de trazabilidad (`nomina-mensual-v2-trazabilidad-modal`) y el stepper. No se tocan en este lote.

---

## 2026-06-03 - Nómina mensual V2 · Paso Empleados — Quitar "Registro del paso"

Cambio NOIA local del panel de trazabilidad del paso Empleados (sidebar "Lista para continuar"). El label estático **"Registro del paso"** es redundante porque el panel ya vive dentro del sidebar del paso Empleados y muestra el título de la acción dinámica debajo (`tituloRegistro()`).

- **Archivo HTML**: `components/nomina-mensual-v2-trazabilidad-paso/nomina-mensual-v2-trazabilidad-paso.component.html` — en la rama `variant === 'panel'` se eliminó el `<h3>Registro del paso</h3>` y se promovió el `<p>{{ tituloRegistro() }}</p>` a `<h3>{{ tituloRegistro() }}</h3>` para preservar jerarquía semántica + tamaño (12 px / 700, el mismo que tenía el label).
- **Archivo CSS**: `nomina-mensual-v2-container.css` — eliminada la regla muerta `.nmv2-trazabilidad-panel__head p { margin: 4px 0 0; font-size: 11px; color: #64748b; }`. La regla `.nmv2-trazabilidad-panel__head h3` se conserva intacta.
- **Scope verificado**: el componente `app-nomina-mensual-v2-trazabilidad-paso` solo se usa con `variant="panel"` en un único punto del repo (paso Empleados, `nomina-mensual-v2-paso-empleados.component.html` línea 159). El resto de usos pasan por `variant="inline"` (default), que no tiene cabecera y no se ve afectado.
- **NO se tocó**: presenter, services, orquestador, motor, copy de otros pasos, estilos globales. Tampoco se tocó la deuda L5.3 ni el resumen-pendientes.
- **Validación**: `ReadLints` sobre HTML + CSS sin errores. Grep `"Registro del paso"` en `src/` → 0 matches residuales (no hay specs que dependan del literal).

---

## 2026-06-03 - DOCS-AUDIT-02 · L0-L7 ejecutado (rotación docs/codex)

Plan iterativo declarado en `docs/codex/auditorias/auditoria-docs-codex-2026-06-03.md`. **Sin cambios visuales en la app** (solo reorganización documental). Se registra aquí únicamente porque la auditoría toca políticas operativas de documentación que afectan flujos de trabajo.

- **L0** (quick wins): repara link roto en `modulos/auth/README.md`, completa tabla del README padre (`auth`, `empresas`, `liquidaciones-oficiales`, `lre`), añade política de ubicación en `auditorias/README.md`, corrige ruta `/remuneraciones/nomina-v2` → `/remuneraciones/nomina-mensual-v2` en auditoría V2, marca `LRE-CONCEPT-RULES-01` y `EMP-PERFIL-LABORAL-SQL-01` como **Parcial**.
- **L1** (borrado masivo, −12 MB): elimina 14 carpetas `assets/parametros-tab*` huérfanas (~12 MB), 4 duplicados raíz (`prevalidaciones-9-5A/B.md`, `tests-empleados.md`, `tests-parametros.md` — superset ya vivía en `modulos/`), y `estilos/observaciones.md` (UI-FONTS ya en `observaciones.md` raíz).
- **L2** (consolidación trivial): unifica `prompts-cursor/CURSOR-UX-COMERCIAL-01.md` → `prompts/`, valida 14 stubs `temas/` (todos con redirect canónico a `modulos/`), elimina entrada duplicada `NOM-MODALES-PERIODO-REVISION-COPY-03` en `estado-fases.md`.
- **L3** (rotar `peticiones-estilos.md`): 288 entradas de mayo movidas a `archivo/peticiones-estilos-2026-05.md` (247 KB). Principal queda con 25 entradas de junio (68 KB) + índice de archivos rotados.
- **L4** (rotar `estado-fases.md` por dominio, Opción A): 111 bloques H2 distribuidos en 10 archivos bajo `orquestador/estado-fases/` (`nomina-mensual.md` 47, `empleados.md` 28, `erp-shell.md` 8, `movimientos.md` 8, `parametros.md` 4, `docs.md` 3, `liquidaciones.md` 1, `ux-comercial.md` 1, `lre-previred.md` 1, `orden.md` 10). Archivo padre queda como **índice ligero de 4 KB** con tabla de dominios. Enlaces internos reescritos automáticamente (`../X` → `../../X` para 175 links).
- **L5** (subagrupar `nomina-mensual/` + segregar V1/V2): 69 archivos planos en raíz → 3 archivos raíz (README, contrato-general, matriz-bloqueos-periodo) + 8 subcarpetas nuevas (`motor-calculo/` 12, `modales-periodo/` 10, `flow/` 18, `workspace/` 11, `prevalidaciones/` 5, `vision/` 6, `v2/` 4, `auditorias/` 3) + carpeta preexistente `preparar-nomina/` (6, intacta). 185 enlaces actualizados en 39 archivos del repo + 52 enlaces relativos del propio README. Sección **"Segregación V1/V2"** declarada en el README del módulo.
- **L6** (READMEs faltantes): 6 READMEs nuevos críticos (`diseno/`, `modulos/`, `prompts/`, `infra/`, `assets/`, `orquestador/estado-fases/`) + 8 READMEs de subcarpetas creadas en L5. Aclaraciones explícitas para `auth` (código en `core/auth/` no `features/`) y `parametros` (feature = `parametros-generales`).
- **L7** (naming + cierre): convención de naming declarada en `mapa-documentacion.md` (sección §0); 2 auditorías mal ubicadas movidas (`arquitectura/auditoria-modular-features.md` y `orquestador/auditoria-docs-2026-06.md` → `auditorias/`); cierre formal en `estado-fases/docs.md`.
- **Métricas finales**: 332 → 329 `.md`. 471 → 363 archivos totales (**−22 %**). Peso 17.300 KB → 5.283 KB (**−69 %**). Carpetas críticas sin README: 5 → 0.
- **NO se tocó**: código `src/`, `bd/`, `angular.json`, `tsconfig*`, motor, servicios productivos, contratos canónicos (`AGENTS.md`, `noia-ui-manual.md`, READMEs de módulo). Solo reorganización documental.
- **Pendiente opcional**: DOCS-AUDIT-03 — rotar `CHANGELOG.md` (64 KB), revisar `temas/` (29 stubs ¿absorber?), revisar uso real de `assets/parametros-tabs/`.

---

## 2026-06-03 - Nómina mensual V2 · L7 — Tests + cierre del plan iterativo

Cierre del plan declarado en `docs/codex/modulos/nomina-mensual/auditorias/auditoria-nomina-v2-2026-06.md`. Foco: smoke specs para los dos componentes productivos que faltaban cobertura unitaria (`paso-parametros` y `paso-alcance`) + registro de fase. **Sin cambios visuales**, solo specs nuevos.

- **Archivos nuevos**:
  - `containers/.../components/nomina-mensual-v2-paso-parametros/nomina-mensual-v2-paso-parametros.component.spec.ts` (6 tests, smoke). Verifica instanciación TestBed sin levantar template + regresión L6 en labels visibles (`parametroEstadoEtiqueta('requiereRevision')='Requiere revisión'`, `bloqueoSeveridadEtiqueta('bloqueo')='Bloqueo crítico'`, `bloqueoSeveridadEtiqueta('revision')='Revisión requerida'`), copy de modales pendientes (`mensajeModalPendientesParametros('oficiales').toContain('período')`, `mensajeModalPendientesParametros('preparacion').toContain('nómina')`), regresión NOIA de `;` en `alertaRevisionDescripcion / alertaOficialesDescripcion / alertaBloqueoDescripcion`, máquina de estados de `parametrosAlertaTipo()` (`null → error → bloqueo → oficiales → revision`).
  - `containers/.../components/nomina-mensual-v2-paso-alcance/nomina-mensual-v2-paso-alcance.component.spec.ts` (6 tests, smoke). Verifica instanciación TestBed + contrato del presenter (`opcionesAlcance` orden + length 4), `seleccionarTipoAlcance` con guardas `deshabilitado`/`preparado`, `alternarCentroCosto` toggle en `Set`, `alternarTrabajadorManual` toggle + cambio a `seleccionManual`, `inicialesEmpleado('María Pérez González')='MP'` + edge case `'  ana  '='A'`.
- **Estrategia de test**: `TestBed.createComponent(...)` sin `detectChanges()` para evitar disparar `effect()` que llaman a services productivos. Providers mínimos por componente: orquestador real (`NominaMensualV2OrquestadorPort` no tiene deps), `PeriodoActivoService` real (signal autoinicializado), services mockeados con `vi.fn().mockResolvedValue(...)`. Para paso-parametros: `Router.navigate` mockeado, `NominaParametrosResumenService.obtenerResumen`, `NominaParametrosBaseService.{obtenerEstadoBase, ...}`, `NominaParametrosBaseAccesoService.resolverPermisos` (estructura completa `PermisosRecargaBaseParametros`). Para paso-alcance: `NominaEmpleadosCargaService.cargarFilasEmpleadosNomina`.
- **NO se tocó**: código de producción, copy, CSS local, container.css, servicios, presenters ni rules. Los smoke specs son aditivos y no exigen refactor de los componentes.
- **Validación**: `npx ng test --watch=false --include=**/nomina-mensual-v2/**/*.spec.ts` → **80/80 ok** (17 specs, +12 nuevos vs L6). `ReadLints` sobre los dos spec files → sin errores.
- **Estado del plan iterativo L0–L7**: cerrado. Lo único abierto son tareas opcionales declaradas (L5.3 sweep visual-system base global + cluster Empleados V1/V7 para llevar bundle bajo budget 24 kB; deuda menor `nomina-mensual-v2-empleados-resumen-pendientes` con modal local justificado por layout).

---

## 2026-06-03 - Nómina mensual V2 · L6 — Copy + tildes (transversal)

Continuación del plan declarado en `docs/codex/modulos/nomina-mensual/auditorias/auditoria-nomina-v2-2026-06.md`. Foco: pasada RRHH sobre los tres pasos productivos (parámetros, alcance, empleados) + overlays + trazabilidad-modal + utilidades de copy. **Sin cambios visuales**, solo strings visibles.

- **Hallazgos resueltos**: residuos de H-P5 (`Snapshot`, `Base guardada`, `idCalculoPeriodoBase`, `Parametros congelados` visibles), tildes faltantes masivas en `nomina-mensual-v2-trazabilidad-modal` (formateadores de grupo/parametro/valor/vigencia/fuente y `tituloPaso`), `nomina-trazabilidad-presentacion.util` (etiquetas de integridad y estado auditoría), overlays con texto sin tildes (`parametros`, `nomina`, `periodo`, `esta`, `reemplazara`, `guardara`), y uso de `;` en copy (3 ocurrencias: presenter de acceso base, paso-parametros y rules de avance con base).
- **Archivos tocados** (todos solo strings visibles, sin cambios de lógica/tipos/identificadores):
  - `containers/.../components/nomina-mensual-v2-overlays/overlays.component.html`: títulos y mensajes de los 8 `app-message-box` del shell con tildes correctas + H-P5 (`Base→Configuración` en `Actualizar configuración`, `Mantener configuración`, `Hay cambios en los parámetros`, `Diferencias de parámetros`, `Preparar nómina de`, `Revisar parámetros de`). Reescrituras NOIA: `Alcance con observaciones→Hay observaciones en el alcance`, `Hay observaciones→Hay observaciones en los parámetros`, `Faltan datos para preparar→Faltan datos para preparar la nómina`, `Completa los datos no oficiales exigibles del mes→Completa los datos del mes antes de continuar`.
  - `containers/.../components/nomina-mensual-v2-overlays/overlays.component.ts`: secciones constantes `SECCIONES_MSG_BOX_BLOQUEO_PARAMETROS` / `SECCIONES_MSG_BOX_REVISION_PARAMETROS` y método `seccionesMsgBoxBloqueoParametros` con copy NOIA (`datos no oficiales exigibles para preparar la nomina→datos del mes antes de preparar la nómina`, `quedaran→quedarán`).
  - `containers/.../components/nomina-mensual-v2-paso-parametros/paso-parametros.component.html`: 1 string del sidebar (`Datos no oficiales exigibles que deben completarse→Datos del mes que debes completar`).
  - `containers/.../components/nomina-mensual-v2-paso-parametros/paso-parametros.component.ts`: 9 strings (mensaje "Preparando nómina", `congelar la base actual→guardar la configuración actual`, pluralización de `oficial(es) pendiente(s) no bloqueante(s)`, `;→.` en frase de revisión, `preparación del periodo→preparación del período`, mensajes `mensajeErrorPersistenciaBase` / `mensajeErrorPreparacion` con `base de parámetros→configuración de parámetros` y eliminación del `:` interno).
  - `containers/.../components/nomina-mensual-v2-trazabilidad-modal/trazabilidad-modal.component.ts`: ~26 strings con tildes en `formatearGrupoParametro`, `formatearNombreParametro` (todos los `minimo→mínimo`, `anos→años`, `gratificacion→gratificación`, `cesantia→cesantía`, `deposito→depósito`, `unico→único`, `cotizacion→cotización`, `compensacion→compensación`, `dia→día`), `formatearValorParametro` (`Si→Sí`), `formatearVigenciaParametro`, `formatearFuenteParametro` (H-P5: `Base guardada→Configuración guardada`, `Mantenedor de parametros→Mantenedor de parámetros`), `estadoOperativo` (`Requiere revision→Requiere revisión`), `tituloPaso` (los 8 pasos), `filasControlOperativo` (`Ultimo registro→Último registro`), `console.warn` y `valoresParametrosBaseError`.
  - `containers/.../components/nomina-mensual-v2-trazabilidad-modal/trazabilidad-modal.component.html`: 10 strings (eyebrow `Bitacora→Bitácora`, mensajes `Quien dejo→Quién dejó`, `ultima accion→última acción`, `Aun no hay→Aún no hay`, `aparecera→aparecerá`, `aun no tiene→aún no tiene`, `Datos guardados de parametros→parámetros`, `Valores usados por nomina→por la nómina`, `este periodo→este período`, `Base usada por nomina→Configuración usada por la nómina`, `Parametro→Parámetro` en header de tabla).
  - `presenters/nomina-parametros-base-acceso.presenter.ts`: H-P5 (`Base ya preparada→Configuración ya preparada`, `base de parámetros→configuración de parámetros`, `base guardada→configuración guardada`, `Recargar base→Recargar configuración`, `Solicita a administración→Pide acceso a administración`), `;→.` en repercusiones.
  - `rules/nomina-parametros-base-acceso.rules.ts`: H-P5 en `ayudaAvanceParametrosConBase` (`Hay diferencias con la base guardada→con la configuración guardada`, `La base del período está preparada→La configuración del período está preparada`), `;→.` en variante no admin. Preserva `Continuar a alcance` para el spec.
  - `services/nomina-parametros-base.service.ts`: 1 string de error (`confirmar el guardado de la base de parámetros→confirmar el guardado de la configuración de parámetros`).
  - `utils/nomina-trazabilidad-presentacion.util.ts`: comentario `validacion→validación` y 11 etiquetas visibles (`Snapshot registrado→Registro guardado`, `Snapshot invalidado→Registro invalidado`, `Pendiente de verificacion servidor→Pendiente de verificación del servidor`, `Parametros cerrados/revisados→Parámetros cerrados/revisados`, `Prenomina validada→Prenómina validada`, `Nomina aprobada→Nómina aprobada`, `Pendiente de aprobacion→Pendiente de aprobación`, `Calculo ejecutado→Cálculo ejecutado`, `Parametros congelados→Parámetros cerrados` para `EstadoAuditoriaPasoNomina.congelado`, `Requiere revision→Requiere revisión`).
  - `containers/.../facade/nomina-mensual-v2-navegacion.ts`: 1 subtítulo de paso congelado (`calculation`) con H-P5 (`guarda el snapshot antes de validar→guarda el registro del cálculo antes de validar`).
- **NO se tocó**:
  - Pasos congelados productivos (movements/calculation/validation/approval/payslips) más allá del subtítulo del paso `calculation`.
  - El componente `nomina-mensual-v2-empleados-resumen-pendientes` (modal local justificado por layout multi-acción + métricas + secciones agrupadas con botones por item; no encaja en `app-message-box` actual y su copy ya estaba limpio). Queda anotado para evaluar en L7+ si conviene extender `app-message-box`.
  - El paso 1 `parametros-generales` (alcance separado, ya cerrado).
  - Estilos globales (`src/styles*.css`, `src/styles/*`), `angular.json`, motor/RPC/BD/RLS, servicios de persistencia. Sin cambios en `tests`/`spec`.
- **Validación**: `npx ng test --include="**/nomina-mensual-v2/**/*.spec.ts"` → **68/68 ok** (15 specs, 247 ms). `npx ng build --configuration=development` → **17.96 s**, sin errores ni warnings (los warnings de budget son de build prod y son pre-L6). `ReadLints` sobre todos los archivos editados → sin errores.
- **Anti-patrón evitado**: cuidado activo con `;` en copy visible (el usuario lo recordó explícitamente en sesión). Política aplicada: dos frases con `.` o conector (`. Y`, `y`, `o`, `pero`) en vez de punto y coma. Verificado con grep cero `;` en strings visibles del feature al cierre.

---

## 2026-06-02 - Nómina mensual V2 · L5.2 — Sweep quirúrgico cluster Parámetros V1

Continuación del lote 5 declarado en `auditoria-nomina-v2-2026-06.md`. Foco: barrer el cluster legacy de Parámetros V1 en `nomina-mensual-v2-container.css` (originalmente líneas 1.856–4.150) preservando overrides scoped sobre selectores **vivos** del shell.

- **Hallazgos resueltos**: H-CSS7 (overrides scoped a `.nmv2-page[data-step='parameters']` apuntando a selectores muertos del paso Parámetros V1).
- **Bloques de `container.css` borrados** (todos verificados sin uso en HTML/TS productivos vía grep estricto `class="…"`):
  - `Step 1 refinement` colas (post-stepper): screen-copy h1/p, screen-actions, btn, content-grid--aside, surface-card, section-heading, side-card h2, side-caption, parameter-grid, parameter-card + __icon/__header/__body/__chevron, status-pill, donut-summary/ring/copy, small-metric-grid/+lucide-icon/span/strong, updated-row, issue-stack/row/strong/span, btn-danger-outline, footer-bar.
  - `Step 1 final` + `Step 1 status labels`: parameter-card .status-pill (+tonos), small-metric tonos/grid 1col, issue-row--with-icon/__status. Mantenido solo el override del wrapper `gap: 0`.
  - `Paso 1 v4`: parameters-workspace, parameters-flow-card, parameters-map-card, parameter-flow + media queries, flow-step + done/warning/blocked/pending, parameter-area-grid/card + __head/__icon, plain-status + status-{green,amber,red}, area-items + ok/warn/bad, parameters-summary-card, parameters-blockers-card, quick-links-card, donut-summary--tight, plain-metric-list/+plain-metric/span/strong, issue-row--with-icon, quick-link*.
  - `Parameters pixel-perfect refinement`: parameter-prep-card + sub, parameters-perfect-summary, parameter-access-card, parameter-blockers-perfect, parameters-prep-flow-card prep-flow + prep-item, prep-icon, prep-line--legacy.
  - `Parameters v8` (excepto wrapper padding/gap/background y alert-banner): nmv2-screen-header, nmv2-screen-copy h1/p, parameters-perfect-layout, content-main/side, parameter-prep-card + section-heading + h2, parameter-prep-flow, prep-item + prep-icon/strong/small/prep-line--legacy, parameter-cards-grid, parameter-summary-card + __head/__icon (lucide)/__head h3/p + __chevron, plain-status, parameters-perfect-summary + parameter-access-card + parameter-blockers-perfect h2, summary-state-list/row, updated-row--summary, parameter-access-grid/tile + span, parameter-blocker-list/row + __status/__copy/__chevron, media query 1360.
  - `Parameters v9`: parameter-prep-flow, prep-item, parameter-prep-card padding, prep-item strong.
  - `Parameters functional binding polish`: prep-item--blocked, area-items .muted + status-gray global, parameter-summary-card focus/hover/cursor, parameter-blocker-row/access-tile cursor, parameter-blocker-empty + lucide-icon.
  - `Prompt 1 + densidad` (excepto step-body/frame/paso wrappers + alert-banner variants): parameters-step-content, parameters-perfect-layout + content-grid--aside align, content-main/side, parameter-cards-grid grid-rows, parameters-perfect-summary + __top + updated-row--summary, parameters-base-status + --diff + __link/:hover, content-side.parameters-sidebar-perfect, parameter-blockers-perfect + parameter-blocker-list/empty, parameters-prep-flow-card height, parameter-blockers-perfect--empty, donut-summary-block, donut-ring--summary/--dynamic/+span, donut-total-caption, parameters-perfect-summary__top grid, parameter-access-grid/tile, updated-row--summary, parameter-summary-card box-sizing, parameter-summary-card__chips/span, parameter-summary-card__foot, parameters-step-content--busy, parameter-prep-flow--solo-validacion + prep-segment--terminal.
  - `Paso Parámetros — paleta NOIA apagada` (excepto variables --nmv2-* y alert-banner--warning/revision/error overrides): prep-item--done/warning/blocked (.prep-node + .prep-icon + small), status-green/amber/red scoped (redundantes con CSS local), parameter-summary-card__icon, parameter-access-tile__icon, parameter-blocker-empty, parameter-summary-card__chips span, area-items ok/warn/bad scoped, parameter-summary-card focus/hover scoped.
  - `Prep-flow premium` completo (252 líneas): parameters-prep-flow-card variables + connector + node + step + copy + segment + connector states (done/warning/blocked) + tone modifiers + media queries 1100/760.
  - `Parámetros V3` (excepto alert-banner--parameter-inline overrides): parameters-prep-flow-card prep-connector v3 + arrows, prep-item--done/warning/blocked tones, parameter-summary-card__head h3/p + __chips/span/-more/__foot/+plain-status, parameter-summary-card min-height, donut-ring--success/warning/danger/neutral + donut-ring--summary.donut-ring--dynamic span.
  - `V4 card Revisiones/Bloqueos`, `V5 estado completo`, `V6 prep-flow estados claros` completos: parameter-blockers-perfect, parameter-blocker-row + __status/__copy/__chevron, parameter-blocker-empty.parametros-estado-correcto + lucide, prep-item__titulo/estado, prep-item--completo/revision/faltante/bloqueado/pendiente (.prep-node + .prep-item__estado), prep-connector--completo/revision/faltante/bloqueado/pendiente, prep-step--validacion variants.
  - `Cards parámetros: icono esquina superior derecha`: parameter-summary-card.nomina-card--corner-icon + __head/foot + nomina-card__icon.
  - `Page fill` parcial: solo se quitaron 4 reglas muertas (parameters-step-content, parameters-perfect-layout.parameters-step-content + content-main/side). Las reglas vivas (shell + outlet + container + page + step-body + paso-parametros) se mantienen.
  - `Parámetros: el card principal ocupa siempre el alto disponible` completo: parameters-step-content + parameters-perfect-layout.parameters-step-content + content-main/side height.
- **Lo que NO se borró** (verificado en HTML productivo + binding TS):
  - Overrides scoped del stepper (`.nmv2-stepper-card`, `.nmv2-stepper`, `.step`, `.step-number`, `.step-copy strong/small`) bajo `.nmv2-page[data-step='parameters']`: hacen el stepper más denso en el paso 1 (visual aprobado).
  - Overrides scoped de `.alert-banner` + `.alert-banner--parameter-inline` + `.alert-banner--warning/revision/error` bajo `.nmv2-page[data-step='parameters']`: clases vivas en el HTML del paso Parámetros.
  - Wrapper `.nmv2-page[data-step='parameters']` con `padding/gap/background` y bloque de variables CSS `--nmv2-primary/ok/review/danger/muted/track`: define apariencia actual + variables consumidas por los alert overrides.
  - Bloque `V7: ayuda de avance en paso Parámetros` (`.nmv2-step-nav-hint` + `--bloqueo/--revision`): clases vivas en `nomina-mensual-v2-container.html`.
  - Bloque `Empleados V1/V7` completo (líneas ~2131–3132 post-slice): fuera de alcance L5.2 (queda para L5.3 si se requiere).
  - Visual-system base global (líneas ~100–870): selectores como `.parameter-card`, `.donut-*`, `.small-metric`, `.issue-row`, `.surface-card`, `.toolbar-card`, `.validation-summary-card`, `.tabs-bar`, `.btn`. Aunque sin uso en HTML actual, su limpieza pertenece a un L5.3 explícito por riesgo de cascada en componentes globales del shell (header, sidebar, breadcrumbs) que comparten el ViewEncapsulation.None del container.
- **Total**: `container.css` pasa de **5.349 → 3.414 líneas (−1.935 / −36,2 %)**. Bundle: **60.96 kB → 59.40 kB (−1,56 kB)**.
- **Validación**: `npx ng build` finaliza el bundle (los 4 errores de budget son preexistentes; el container.css de hecho bajó −1,56 kB). `npx ng test --watch=false --include="**/nomina-mensual-v2/**/*.spec.ts"` → **68/68 ok** (15 specs). Lints: dos warnings preexistentes de `line-clamp` (no introducidos). Visual: pasos Parámetros, Alcance, Empleados y Congelado renderizan idénticos (alert-banner mantiene radius 15px + box-shadow + paleta NOIA apagada; stepper denso en paso 1; hint banda contigua; trazabilidad drawer/panel intactos).
- **Pendiente próximo lote**:
  - **L5.3** (opcional): sweep del visual-system base global (líneas ~100–870) + cluster Empleados V1/V7 (líneas ~2131–3132) + consolidación de overrides duplicados de `.nmv2-page[data-step='parameters']` y `.alert-banner` para bajar el bundle bajo el budget de 24 kB.
  - **L6**: pulido fino texts/copys y revisión de overlays (`nomina-mensual-v2-overlays`) alineados al patrón `app-message-box`/NOIA.

## 2026-06-02 - Nómina mensual V2 · L5 — Desacople CSS local + limpieza muerta

Lote 5 del plan iterativo (`auditoria-nomina-v2-2026-06.md`). Sin tocar presenters, services, orquestador, motor productivo ni estilos globales. Foco: bajar el peso del monolito `nomina-mensual-v2-container.css` y dejar cada paso con su CSS local.

- **Hallazgos resueltos**: H-CSS1 (container monolítico de 7.676 líneas), H-CSS2 (`pasos-demostracion` muerto encadenado al shell), H-CSS3 (modal local de pendientes obsoleto), H-CSS4 (loading-skeleton legacy con `nomina-sidePanel`, `parameter-blocker-empty`, `parameter-access-tile`), H-CSS5 (paso Alcance legacy con `alcance-*-card`/`alcance-grid`/`empleados-sin-alcance-banner`), H-CSS6 (cluster `parameter-cards-grid` + `parameter-summary-card*` + `parameters-perfect-summary` + `parameter-access-*` + `parameter-blocker-*` + `summary-state-*` + `parameter-prep-flow` + `prep-item` legacy del paso Parámetros V1).
- **Cambios — Desacople a CSS local por componente** (Encapsulation `None` para preservar selectores globales compartidos como `empleados-grid-module*` y `app-message-box`):
  - **Nuevo `components/nomina-mensual-v2-paso-parametros/nomina-mensual-v2-paso-parametros.component.css`** (~370 líneas): bloque completo `.nmv2-paso-parametros__*` (head, eyebrow, head-row, title, stats `--block/--warn/--ok`, body, main, list, row + skeletons inline, side block + link, media query 960). Referenciado vía `styleUrls` en el componente.
  - **Nuevo `components/nomina-mensual-v2-paso-alcance/nomina-mensual-v2-paso-alcance.component.css`** (~540 líneas): bloque completo `.nmv2-paso-alcance__*` (head, stats `--blue/--green/--gray/--red`, list, row + activa/locked, panel inline, chips, search, manual, side, checklist con status, media query 960).
  - **Nuevo `components/nomina-mensual-v2-paso-empleados/nomina-mensual-v2-paso-empleados.component.css`** (~410 líneas): bloque completo `.nmv2-paso-empleados__*` (head, stats `--green/--blue/--amber/--red`, body, grid wrapper, toolbar local + chip-filtro, side block + link, checklist denso `--activo/--locked/:disabled` con severidad y status, media query 1024).
- **Cambios — Limpieza profunda en `nomina-mensual-v2-container.css`**:
  - Slice de los bloques L2/L3/L4 movidos a CSS local: −1.361 líneas. Cabecera reemplazada por un comentario apuntando a los tres archivos nuevos.
  - Borrado del **componente legacy `NominaMensualV2PasosDemostracionComponent`** (archivos `.ts` y `.html`) + sus 2 reglas en el container (`app-nomina-mensual-v2-pasos-demostracion`). El placeholder NOIA L0 (`.nmv2-paso-congelado`) lo cubre desde L0.
  - Borrado del bloque `parametros-pendientes-modal*` + `parametros-pendientes-group*` + `parametros-pendientes-item*` + sus media queries: −252 líneas. Las confirmaciones de pendientes ahora viven en `app-message-box` (L2).
  - Borrado del bloque `nmv2-loading-*` + selectores `parameters-step-content--busy` con shimmer + keyframes + media `prefers-reduced-motion`: −158 líneas. Los skeletons del paso Parámetros L2 son filas placeholder inline (`nmv2-paso-parametros__row--placeholder`), no cards.
  - Borrado del bloque Alcance V10 legacy: `.alcance-opciones-grid`, `.alcance-opcion-card*`, `.alcance-intro-card`, `.alcance-panel-secundario`, `.alcance-preview-card*`, `.alcance-chip*`, `.alcance-busqueda-manual*`, `.alcance-lista-manual`, `.alcance-fila-manual*`, `.alcance-checklist-card`, `.empleados-sin-alcance-banner` + media query 900: −223 líneas.
  - Borrado del cluster `parameter-cards-grid` + `parameter-summary-card*` + `parameters-perfect-summary` + `summary-state-list/row` + `updated-row--summary` + `parameter-access-card/grid/tile*` + `parameter-blocker-list/summary/row*` + `parameter-blockers-perfect*` + `parameter-prep-flow` + `prep-item*` + sus 3 media queries: −332 líneas.
  - **Total**: `container.css` pasa de **7.676 → 5.349 líneas (−2.327 / −30,3 %)**.
- **No tocado** (y validado por grep en HTML/TS productivos): `.alert-banner*`, `.surface-card`, `.section-heading`, `.content-grid--aside`, `.footer-bar`, `.nmv2-stepper-card`, `.nmv2-screen-copy/-actions/-header`, `.nmv2-empleados-grid-shell/-card`, `.empleados-grid-module*`, `.empleados-filtro-chip*` (usado vía `claseChipFiltroChecklist`), `.empleados-checklist-item--{severidad}` y `.empleados-checklist-severidad--*` (usados via método del componente), `.nomina-chip*` y reglas globales del visual-system. El shell L1 queda intacto.
- **Pendiente declarado para L5.2** (no abordado en este lote por riesgo de cascada): segundo cluster legacy de Parámetros V1 que vive entre `Step 1 refinement` (≈ línea 1.856) y `Empleados V1` (≈ línea 4.150) y mezcla overrides scoped a `.nmv2-page[data-step='parameters']` sobre selectores **vivos** del shell (`.alert-banner`, `.surface-card`, `.section-heading`, `.btn`, `.nmv2-stepper-card`, `.nmv2-screen-copy/-actions`, `.footer-bar`) con selectores **muertos** (`.parameter-card*`, `.donut-*`, `.small-metric*`, `.issue-row/stack`, `.parameter-prep-card`, `.status-pill` legacy). Necesita un sweep quirúrgico por subloque para no alterar la apariencia del shell. Documentado en `auditoria-nomina-v2-2026-06.md`.
- **Validación**: `npx ng build --configuration=development` verde (19 s). `npx vitest run src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/facade/nomina-mensual-v2-navegacion.spec.ts` → 6/6 ok. Lints solo dos warnings preexistentes de `line-clamp` (no introducidos por este lote). Visual: pasos Parámetros, Alcance, Empleados y Congelado renderizan idénticos al estado pre-L5 (mismo DOM, mismo CSS, ahora repartido).
- **Pendiente próximo lote**: L6 — pulido fino texts/copys y revisión de overlays (`nomina-mensual-v2-overlays`) para alinearlos al patrón `app-message-box`/NOIA antes de tocar L7 (motor V11).

## 2026-06-02 - Empleados · Seeds separados (`auditoria` / `aptos` / `errores`)

Sin cambios de UI. Solo `scripts/` + `package.json`. Origen: tras correr `seed:empleados:ok` quedaron solo 3 aptos (U1, U4, U5) por diseño de la batería de auditoría, insuficiente para poblar el alcance del paso 3 de Nómina mensual V2 con holgura.

- **`scripts/auditoria-empleados-fixtures.mjs`**: degradados U6/U7/U8 a `dependiente_activo`. Quedan **6 aptos (U1, U4, U5, U6, U7, U8) + 2 borradores (U2 `borrador_paso2`, U3 `borrador_reanudar`)**. Casos antiguos (`honorarios` F10, `basico` F2, `ficha_incompleta` F12) salen de la auditoría base y vuelven a cubrirse vía `seed:empleados:errores` cuando se necesiten.
- **`scripts/verify-empleados-qa-post-e2e.mjs`**: actualizados asserts. U6 ahora `apto === true` (sin HONORARIOS); U8 ahora `estado === ACTIVO` y `estado_ficha === VALIDO` (sin INCOMPLETO). Se eliminó el helper `loadContratoHonorarios` que ya no aplica.
- **Nuevo `scripts/seed-empleados-aptos.mjs`**: 10 empleados productivos puros (RUT `27.000.001–010`, apellido `Productivo`, contrato `INDEFINIDO`, sueldo $900.000, jornada completa 44 h, AFP + ISAPRE + cuenta bancaria; persona `ACTIVO/VALIDO/apto=true`). Soporta `--confirm`, `--dry-run`, `--purge-only`, `--append` (este último solo borra y recrea RUT 27.000.001–010 sin tocar U1–U8 ni ERR).
- **`package.json` — scripts npm de empleados reorganizados**:
  - `seed:empleados:auditoria` → `node scripts/auditoria-empleados-fixtures.mjs` (nombre real del fixture).
  - `seed:empleados:aptos` → `node scripts/seed-empleados-aptos.mjs --confirm`.
  - `seed:empleados:aptos:append` → mismo con `--append`.
  - `seed:empleados:errores` y `seed:empleados:errores:append` (sin cambios funcionales).
  - `seed:empleados:ok` queda como **alias deprecated** apuntando a `seed:empleados:auditoria` (no romper docs/CI antiguos). Mismo criterio que `seed:empleados-prueba-errores`.
- **No tocado**: `scripts/lib/empleados-cleanup.mjs` (utilería compartida), `seed-empleados-prueba-errores.mjs`, tests, UI, estilos globales, motor de cálculo.
- **Combinación recomendada para poblar Nómina V2**: `npm run seed:empleados:auditoria` (6 aptos + 2 borradores) + `npm run seed:empleados:aptos` (10 aptos puros) + opcionalmente `npm run seed:empleados:errores:append` (10 bloqueantes sin tocar el resto). Total: **16 aptos disponibles** para el alcance + 2 borradores + 10 con bloqueos para validar flujos de error.
- **Validación**: `node --check` verde sobre los 3 scripts modificados. JSON `package.json` válido. No se ejecutó el seed contra BD remota en esta sesión (lo lanzas desde tu terminal con las credenciales `.env`).

## 2026-06-02 - Nómina mensual V2 · L4 — Paso Empleados NOIA

Lote 4 del plan iterativo (`auditoria-nomina-v2-2026-06.md`). Sin tocar presenter, services, orquestador, ni `app-data-grid` shared.

- **Hallazgos resueltos**: H-E1 (KPI strip de 4 cards → banda de stats en header local), H-E2 (banner sin-alcance ya con estética `alert-banner--parameter-inline`, sin sombras), H-E3 (toolbar local sobria sustituye `empleados-grid-toolbar` con bordes y chips coherentes), H-E4 (sidebar reducido tipo L3, checklist denso sin `surface-card`), H-E5 (estados `disabled` del checklist coherentes con `--prm-field-locked-*`).
- **Cambios en `nomina-mensual-v2-paso-empleados.component.html`** (reescritura completa, misma lógica/binds):
  - **Header local** (`nmv2-paso-empleados__head`) con eyebrow `Paso 3 · Empleados · <leyenda del grid>` + título operativo + banda horizontal de 4 stats (Activos / Contrato vigente / Bancarios pendientes / Docs. incompletas), tonos `--green/--blue/--amber/--red`, `title` con el porcentaje del total.
  - **Toolbar local** (`nmv2-paso-empleados__toolbar`) sustituye `empleados-grid-toolbar`: contiene `Filtros avanzados` (con estado activo en azul tenue), chip de filtro de checklist activo (cerrable) y conteo. Borde 1 px neutro, radio 6 px.
  - **Anchor + `app-data-grid`** intacto: mismo `persistenceKey`, mismos `ng-template appDataGridCell` y mismas columnas. Sin nuevos botones export (siguen siendo acción del grid).
  - **Sidebar reducido** (`nmv2-paso-empleados__side`): bloque `Lista para continuar` con `trazabilidad-paso panel` + checklist denso (`<li><button>`, icono + título + pill de severidad + descripción + chevron) + acceso `Ver resumen de pendientes`. Bloque adicional `Volver a alcance` con link `Ir a Alcance`. Sin `surface-card`, sin `side-card`, sin info-banner.
  - **Checklist items**: estados `--activo` (azul tenue), `--locked`/`:disabled` calcados al patrón `--prm-field-locked-*` (color `#94a3b8`, icono `#cbd5e1`). Severidad mantiene tonos sobrios (`correcto/advertencia/bloqueante`).
- **Cambios en `nomina-mensual-v2-paso-empleados.component.ts`**: ninguno. Toda la lógica (`metricasEmpleados`, `checklistEmpleados`, `filasEmpleadosVista`, `filtroPendienteEmpleados`, `recargarGrillaEmpleados`, `ejecutarAccionPrincipal`, modal `abrirModalResumenPendientes`) se reutiliza tal cual.
- **Cambios en `nomina-mensual-v2-container.css`**:
  - Nuevo bloque local (~410 líneas) con `.nmv2-paso-empleados__*`: head, eyebrow, head-row, title, stats (`--green/--blue/--amber/--red`), body, main, grid, toolbar, toolbar-filters, toolbar-btn (`--activo`), chip-filtro, toolbar-conteo, side, side-block, side-link, checklist, checklist-item (`--activo/--locked`), checklist-icon/copy/row-title/severity/mark + variantes por status (`.status-success/.status-warning/.status-error/.status-pending`).
  - Aplanado del wrapper legacy del data-grid: `.empleados-grid-module` y `.nmv2-page[data-step='employees'] .empleados-grid-module__card` ahora son `border-radius: 6px`, sin `box-shadow`, borde neutro 1 px (en línea con L1).
  - El CSS legacy `empleados-kpi-strip`, `empleados-kpi-card*`, `empleados-grid-toolbar*`, `empleados-checklist-card`, `empleados-checklist-item*`, `empleados-resumen-pendientes-button` queda como código muerto (no referenciado por el nuevo template). Limpieza profunda en L5.
- **No tocado**: presenter de empleados/validación, service de carga, orquestador, modelos, `app-data-grid`, motor productivo, estilos globales, `angular.json`, otros pasos.
- **Validación**: `npx ng build --configuration=development` verde (16 s). 2 warnings preexistentes de `line-clamp` (no introducidos por este lote). `npx vitest run src/app/features/nomina-mensual-v2/{presenters,rules,mappers,containers}`: 48/48 verdes; los 3 archivos en rojo son los preexistentes ya identificados en L3.
- **Pendiente próximo lote**: L5 — Limpieza / desacople CSS (migrar bloques L0–L4 desde `container.css` a CSS local por componente y borrar el código muerto: `parameter-summary-card*`, `parameters-perfect-summary*`, `alcance-*-card`, `empleados-grid-toolbar*`, `empleados-kpi-card*`, `empleados-checklist-card`, modal local, skeletons en card).

## 2026-06-02 - Nómina mensual V2 · L3 — Paso Alcance NOIA

Lote 3 del plan iterativo (`auditoria-nomina-v2-2026-06.md`). Sin tocar presenter, services, orquestador, ni la lógica de cálculo del alcance.

- **Hallazgos resueltos**: H-A1 (cards de tipo de alcance → lista densa), H-A2 (KPI strip → banda compacta en header), H-A3 (estados disabled coherentes con el patrón `--prm-field-locked-*` de Parámetros), H-A4 (panel inline de centros / selección manual sin envolver en card extra), H-A5 (sidebar reducido a checklist + volver, sin duplicar conteos del header).
- **Cambios en `nomina-mensual-v2-paso-alcance.component.html`** (reescritura completa, mismo bind/lógica):
  - **Header local del paso** (`nmv2-paso-alcance__head`) con eyebrow `Paso 2 · Alcance · <descripción>` + título operativo + banda horizontal de 4 conteos (`Encontrados / Incluidos / Excluidos / Bloqueados`), bordes neutros 1 px y sin badges decorativos.
  - **Lista densa de tipos de alcance** (`nmv2-paso-alcance__list` con `<li><button class="nmv2-paso-alcance__row">`): icono pequeño (28 px badge), título + descripción, etiqueta `Próximamente` cuando aplica, y acción contextual (`Seleccionado`/`Elegir`/`No disponible`). Estados `disponible/preparado/deshabilitado` preservados; los no disponibles van con `[disabled]` + `[aria-disabled]` y se ven como los `--prm-field-locked-*` de Parámetros (fondo `#f8fafc`, borde implícito y color `#94a3b8`).
  - **Panel inline** (`nmv2-paso-alcance__panel`) que aparece solo cuando hay un alcance que requiere detalle: chips de centros de costo (`__chip` activa con `#eff6ff / #93c5fd / #1d4ed8`) o búsqueda + lista de trabajadores (`__manual`, max-height 280 px con scroll interno, sin card).
  - **Sidebar reducido** (`nmv2-paso-alcance__side`): bloque `Lista para continuar` (checklist contextual con tonalidades success/warning/error/pending) + bloque `Volver a parámetros` con link `Ir a Parámetros`. Cero duplicación con los conteos del header.
  - **Modal y orquestador**: `modalAvanceAlcance` sigue siendo gestionado por `nomina-mensual-v2-overlays`; el paso solo dispara `ejecutarAccionPrincipal()`.
- **Cambios en `nomina-mensual-v2-paso-alcance.component.ts`**: ninguno. La lógica de selección, validación y avance se reutiliza tal cual (`tipoAlcanceSeleccionado`, `centrosCostoSeleccionados`, `idsTrabajadoresManuales`, `resultadoAlcanceVista`, `checklistAlcance`, `metricasAlcance`, `cargarTrabajadoresPeriodo`).
- **Cambios en `nomina-mensual-v2-container.css`**:
  - Nuevo bloque local (~380 líneas) con todas las clases `.nmv2-paso-alcance__*`: head, eyebrow, head-row, title, stats (`--blue/--green/--gray/--red`), body, main, list, row (`--activa/--locked`), row-icon/copy/tag/mark, panel, panel-head, chips, chip (`--activo`), search, manual, manual-row/avatar/copy/state, side, side-block, side-link, checklist, checklist-item (`.status-success/.status-warning/.status-error/.status-pending`), checklist-icon/copy. Bordes 1 px neutros, radios 4–6 px (chips 999 px), sin sombras, sin gradientes, sin transformaciones.
  - El bloque queda agrupado junto a L2 y el placeholder de L0, listo para migrar a CSS local del componente en L5.
  - **No** se eliminó el CSS legacy `.alcance-grid`, `.alcance-option`, `.alcance-option__*`, `.alcance-context-card`, `.kpi-strip`, etc. Quedan como código muerto; limpieza profunda en L5.
- **No tocado**: presenter de alcance, service de carga de empleados, orquestador, modelos, motor productivo, estilos globales, `angular.json`, otros pasos, mantenedores.
- **Validación**: `npx ng build --configuration=development` verde (19 s). 2 warnings preexistentes de `line-clamp` (no introducidos por este lote). `npx vitest run src/app/features/nomina-mensual-v2/{presenters,rules,mappers,containers}`: 48/48 verdes; los 3 archivos en rojo fallan por `describe is not defined` (preexistente, sin imports de vitest, no tocados en L3).
- **Pendiente próximo lote**: L4 — Paso Empleados NOIA (drawer modal-like → side-panel sin sombras, métricas en banda, exportar como acción secundaria, checklist coherente con L3).

## 2026-06-02 - Nómina mensual V2 · L2 — Paso Parámetros NOIA

Lote 2 del plan iterativo (`auditoria-nomina-v2-2026-06.md`). Rediseño visual del paso 1 sin tocar servicios, orquestador, mappers ni persistencia.

- **Hallazgos resueltos**: H-P1 (cards → lista densa), H-P2 (modal local → `app-message-box`), H-P3 (sidebar sin duplicar conteos), H-P4 (skeleton inline en filas, no en cards), H-P5 (copy `Base guardada` → `Configuración guardada`), H-P6 (donut decorativo retirado), H-X4 (focus inicial heredado de `MessageBoxComponent`).
- **Cambios en `nomina-mensual-v2-paso-parametros.component.html`**:
  - **Header local del paso** (`nmv2-paso-parametros__head`) con eyebrow `Paso 1 · Parámetros · Configuración guardada hoy hh:mm` + título operativo + 3 conteos compactos (pendientes para preparar / oficiales pendientes / verificados) en una banda horizontal con bordes neutros. Calcado del patrón `param-record-header` de Parámetros.
  - **Lista densa de áreas** (`nmv2-paso-parametros__list` con `<li><button>` por área): icono pequeño (28 px badge), título + descripción, pill de estado tonal (success/warning/danger/neutral) y acción `Abrir →`. Sin chevron decorativo, sin chips de detalle, sin footer. Mantiene el `goToParametros(area.mantenedor)` original.
  - **Sidebar reducido** (`nmv2-paso-parametros__side`): bloques contextuales que aparecen solo cuando aplican — `Diferencias con la configuración guardada`, `Pendientes para preparar (N)`, `Oficiales pendientes (N)` — más el acceso permanente `Ir a Parámetros`. Cero duplicación con los conteos del header.
  - **Modal local `parametros-pendientes-modal` eliminado**. El signal `modalPendientesParametros` ahora dispara un `app-message-box` `variant="warning"` con `sections[]` agrupados por área. Focus inicial gestionado por el shared.
  - **Skeleton inline**: en estado `parametrosLoading()` la lista se rellena con 5 filas placeholder grises (`nmv2-paso-parametros__row--placeholder`) que conservan la geometría sin pintar tarjetas fantasma.
  - **Copy**: `Base guardada` → `Configuración guardada`. La banda `diferencias` ahora ofrece `Ver diferencias` directo (antes solo era texto). El sidebar dejó de mostrar `Última actualización` repetida.
- **Cambios en `nomina-mensual-v2-paso-parametros.component.ts`**:
  - Import de `MessageBoxSection` desde el shared.
  - Nuevo helper `parametroEstadoTono(estado)` (mapea a `ok`/`warn`/`block`/`neutral` para la fila).
  - Nuevo `sectionsPendientesParaMessageBox(tipo)` que mapea grupos por área a `MessageBoxSection[]` con `tone` `warning`/`attention` y `items[]` formateados (`<título>: <detalle>`).
  - Los métodos `tituloModalPendientesParametros`, `mensajeModalPendientesParametros`, `gruposModalPendientesParametros`, `modalPendientesResumen` quedan vivos como helpers internos consumidos por el `app-message-box`.
- **Cambios en `nomina-mensual-v2-container.css`**:
  - Nuevo bloque local `~280 líneas` con todas las clases del paso (`.nmv2-paso-parametros__head`, `__eyebrow`, `__stats`, `__body`, `__main`, `__list`, `__row`, `__row-state`, `__row-action`, `__row--placeholder`, `__side`, `__side-block`, `__side-link` + variantes `--block`/`--warn` y media query a 960 px). Bordes 1 px neutros, radios 4–6 px, sin sombras, sin gradientes, sin transformaciones.
  - El bloque queda agrupado al inicio del archivo junto al placeholder L0, listo para migrar a CSS local del componente en L5 (desacople).
  - **No** se eliminó el CSS legacy de `parameter-summary-card`, `parameters-perfect-summary`, `parameter-cards-grid--loading`, `nmv2-loading-*`, `parametros-pendientes-modal*` etc. Quedan como código muerto referenciado por nadie (validado: el nuevo template no usa esas clases). Limpieza profunda diferida a L5.
- **No tocado**: orquestador, services, mappers, rules de comparación, persistencia, modelos, motor productivo, estilos globales, `angular.json`, otros pasos.
- **Validación**: `npx ng build --configuration=development` verde (19 s). 2 warnings preexistentes de `line-clamp` (no introducidos por este lote). `npx vitest run src/app/features/nomina-mensual-v2/containers/nomina-mensual-v2-container/facade`: 10/10 verdes.
- **Pendiente próximo lote**: L3 — Paso Alcance NOIA (cards → lista densa, KPI strip → banda contextual, estados disabled con patrón `--prm-field-locked-*`).

## 2026-06-02 - Nómina mensual V2 · L1 — Marco unificado del shell

Lote 1 del plan iterativo (`auditoria-nomina-v2-2026-06.md`). Sin cambios funcionales; solo estructura visual del shell.

- **Hallazgos resueltos**: H-S1, H-S2, H-S3, H-S5 (P0/P1 del shell) + aplanado de `.nomina-card` (que se compartía con cards de los pasos 1–3).
- **Cambios en `nomina-mensual-v2-container.css`**:
  - `.nmv2-page`: fuera el `linear-gradient(180deg, #f8fafc, #f5f7fb)` → fondo plano `#f6f8fb`. `gap: 12px` → `0` (las piezas se leen contiguas). `padding: 16px 18px 18px` → `12px 14px 14px` (alineado al patrón de Parámetros).
  - `.nmv2-stepper-card, .surface-card, .toolbar-card, .alert-banner, .validation-summary-card, .footer-bar, .tabs-bar`: `border-radius: 18px` → `6px`; `box-shadow: 0 16px 40px ...` → `none`.
  - `.nmv2-stepper-card`: borde completo arriba/laterales con `border-radius: 6px 6px 0 0` y `border-bottom: 0`; el frame continúa la divisoria desde abajo.
  - `.nomina-workflow-header`: fuera `border-bottom: 1px solid #e2e8f0`; la divisoria la pinta ahora `.nmv2-step-frame` (un solo trazo).
  - `.nmv2-step-frame`: `border-radius: 8px → 0 0 6px 6px`; `border-top: 1px solid #e2e8f0` explícito; sin `border-top-*-radius: 0` redundantes.
  - `.nmv2-step-nav-hint`: deja de ser margin flotante; pasa a banda fina pegada al stepper con bordes laterales y bottom y variantes `--bloqueo` (#fef2f2/#fecaca) / `--revision` (#fffbeb/#fde68a) tonalmente sobrios.
  - Overrides al final del archivo (`.nmv2-page > .nmv2-step-nav-hint`, `.nmv2-page > .nmv2-step-body`, `.nmv2-page[data-step='parameters']` gap) recalibrados para que stepper + hint + frame queden contiguos sin doble borde.
- **Cambios en `nomina-mensual-v2-visual-system.css`**:
  - `.nomina-card`: `border-radius: 14px` → `6px`. Sólo `transition: border-color`. Hover de `nomina-card--interactive` mantiene cambio de borde pero deja de aplicar `box-shadow: 0 4px 14px ...` y `transform: translateY(-1px)`.
- **Cambios en `nomina-mensual-v2-stepper.component.css`**:
  - `.nmv2-page .nomina-workflow-header.nmv2-stepper-card`: armoniza con el container (`border-radius: 8px 8px 0 0 → 6px 6px 0 0`, `border-bottom: 0`).
- **No tocado**: cards internas de los pasos (`parameter-summary-card`, `alcance-opcion-card`, `summary-metric`, etc.) — se rediseñan en L2/L3/L4. Tampoco `nomina-mensual-v2-container.html` ni la lógica de navegación.
- **Validación**: `npx ng build --configuration=development` verde (17.3 s). 2 warnings preexistentes de `line-clamp` (no introducidos por este lote). Lints sin nuevos errores.
- **Pendiente próximo lote**: L2 — Paso Parámetros NOIA (cards → lista densa, donut → conteos inline, modal local → `app-message-box`).

## 2026-06-02 - Nómina mensual V2 · L0 — Higiene + pasos 4–8 congelados hasta V11

Fase 0 del plan iterativo abierto en `docs/codex/modulos/nomina-mensual/auditorias/auditoria-nomina-v2-2026-06.md`.

- **Decisión rectora**: V2 productiva acotada a Parámetros → Alcance → Empleados. Los pasos `movements`, `calculation`, `validation`, `approval`, `payslips` quedan inactivos en el stepper hasta que V11 conecte motor y persistencia. Motor productivo (`/remuneraciones/proceso-mensual`) no se toca.
- **Cambios**:
  - `facade/nomina-mensual-v2-navegacion.ts`: añade `PASOS_CONGELADOS_V11`, `esPasoCongelado(stepId)` y `tooltipPasoCongelado()` (`«Disponible al cerrar la versión 11. Continúa por Proceso mensual mientras tanto.»`).
  - `components/nomina-mensual-v2-stepper`: helpers `pasoCongelado(id)` y `tooltipPaso(id)`. El botón del paso aplica `[disabled]`, `[attr.aria-disabled]`, `[attr.title]` y `class="nomina-step--frozen"`. El icono de estado se sustituye por `lock` para los pasos congelados. CSS local añade tonos atenuados (cursor `not-allowed`, color `#94a3b8`).
  - `nomina-mensual-v2-container.ts`: bloquea navegación a pasos congelados en `intentarIrAPaso`, `manejarAvanceDesdeEmpleados` y `ejecutarAccionPrincipalPasoActual`. Saca el import de `NominaMensualV2PasosDemostracionComponent` del shell.
  - `nomina-mensual-v2-container.html`: el `@default` del `@switch` ya no renderiza la maqueta `pasos-demostracion`; en su lugar muestra un placeholder NOIA sobrio (`.nmv2-paso-congelado`) con eyebrow, título y vínculo a `/remuneraciones/proceso-mensual`. El componente `pasos-demostracion` se preserva en el árbol de archivos hasta la fase V11, pero ya no se carga en el bundle del shell.
  - `nomina-mensual-v2-container.css`: bloque local para `.nmv2-paso-congelado` (sin sombra, sin radio decorativo, ancho contenido).
  - Spec `facade/nomina-mensual-v2-navegacion.spec.ts`: añade `import { describe, expect, it } from 'vitest'` que faltaba (pre-existente, archivo aún untracked) y cubre los nuevos helpers.
- **No tocado**: motor productivo, servicios v1, `angular.json`, estilos globales, Parámetros recién cerrado.
- **Validación**: `npx ng build --configuration=development` verde (24 s, sin nuevos warnings). `npx vitest run` de `nomina-mensual-v2-navegacion.spec.ts`: 6/6 verdes. Lints sin nuevos errores en los archivos tocados.
- **Pendiente próximo lote**: L1 — marco unificado del shell (quitar gradiente y sombras de `.nmv2-page`/`.surface-card`, banda compacta del período integrada al header).

## 2026-06-02 - Parámetros · checkbox "Con gratificación" en lectura sin azul activo

- **Síntoma**: el checkbox `formControlName="gratificacion"` se veía en azul activo aún en modo lectura (no editable). Como no está DOM-`disabled` (el click se intercepta por JS para que el FormControl siga emitiendo valor), el `accent-color: #2563eb` y el check nativo se renderizaban con el azul del sistema.
- **Cambio**:
  - `parametros-config-cliente-tab.component.ts`: el label ahora añade la clase `param-checkbox-inline--locked` cuando `!editable`.
  - `parametros-workspace-container.css`: reglas espejo de `:disabled` para `.param-checkbox-inline--locked input[type='checkbox']` y `:checked` (mismo aspecto que readonly: borde y fondo `--prm-field-locked-*`, check oscuro SVG en lugar del nativo azul). También se cubren `.param-check--locked` y `.erp-choice-radio--locked` por consistencia.
- **No tocado**: ni `formControlName`, ni el handler `onReadonlyToggle`, ni reglas globales. Riesgo nulo sobre la persistencia del valor.

## 2026-06-02 - Parámetros: revisión transversal iterativa (flujos banda, edición, guardado, reconciliación)

Iteración por lotes pequeños sobre flujos que cruzan todas las tabs. Sin doc previo. Alcance acotado al módulo `parametros-generales` y al shared `app-page-actions` (extensión backward-compatible).

### Lote 1 — Banda + edición

- **Spinner inline en Modificar / Capturar valores**: nuevos inputs opcionales `editLoading` y `saveLoading` en `app-page-actions`. Cuando true, el icono `pencil` (o `save`) se sustituye por `loader-2` con animación `page-actions-spin` (0.9s linear infinite, definida en el shared). La banda pasa `[editLoading]="ws.modificarCargando()"` y `[saveLoading]="ws.guardando()"`. Computed `modificarCargando = isPreparingEdit() || isPreparandoDialogoCrear()` añadido al orquestador. Cambio backward-compatible (default false en ambos inputs).
- **Área Cierre — una sola acción principal**: `modificarDeshabilitado` ahora incluye `activeArea() === 'cierrePeriodo'`. Nueva rama en `modificarTooltipConsulta()` para esa condición: `Usa las acciones del resumen de cierre para completar la configuración.` Así el card de cierre queda como único punto de entrada a edición desde esa área.
- **Sincronizar con tooltip explicativo** (sin cambio de visibilidad): el botón sigue oculto cuando ya hay datos (`!ws.hasAnySyncedData()`), porque la normativa oficial chilena no cambia retroactivamente para un período sincronizado. Se añadió `ws.sincronizarTooltip()` que explica al usuario qué hace: `Carga los datos normativos oficiales para este período.` (o `Espera a que termine la operación actual.` si hay UI bloqueada). Decisión revisada con el usuario: descartado convertirlo en botón permanente; refrescar manualmente sin necesidad real introduce ruido.

### Lote 2 — Carga + errores

- **`cargaBloqueadaPorError` solo se resetea en éxito (H-C3)**: `cargar()` ya no hace `set(false)` al inicio. Una bandera local `cargaExitosa` se enciende solo si los `try` paths terminan sin excepción; el `finally` limpia el flag solo cuando `cargaExitosa === true`. Reintentos fallidos no reabren la edición ni el botón Modificar hasta una carga exitosa real.
- **Loading modal — revisado, dejado intencional**: `isLoading` y `isLoadingPlantilla` son mutuamente excluyentes (`@if/@else if` en el container) y ocurren por tiempos cortos durante la carga inicial o preparación de edición. Cambiarlos a inline implicaba mover infraestructura del MessageBox a un overlay propio del frame, fuera del alcance de revisión iterativa. Decisión: mantener modal con copy actual y revisitar si surge fricción real.
- **Detalle técnico homogéneo en errores (auditoría rápida)**: confirmados los 4 builders de error (`buildParametrosErrorGuardadoDialog`, `buildParametrosErrorActualizacionDialog`, `buildParametrosErrorClienteConfigDialog`, `buildParametrosErrorCargaDialog`) pasan por `envolverDetalleTecnico`. No requiere cambio.

### Lote 3 — Guardado + reconciliación

- **Éxito + diferencias en un solo flujo (H-G3)**: `buildParametrosReconciliacionDiferenciasDialog` ahora acepta `opciones.contexto: 'post-guardado' | 'apertura'`. Cuando viene de `intentarMostrarAvisoReconciliacionTrasGuardar` (después de guardar con diferencias), el dialog se construye con `variant: 'success'` y título `Guardado. Revisa las diferencias`, mensaje aclara que la configuración quedó guardada pero difiere. El usuario ya no ve dos modales encadenados con expectativas contradictorias.
- **`compararOficialCliente` con `null` oficial (H-G5)**: lógica revisada y documentada. Si un campo oficial es null (p.ej. `gratificacion` aún no normada para el mes), no se reporta diferencia — semánticamente "sin base de comparación". Añadido comentario inline explicando el comportamiento esperado.
- **Focus inicial del MessageBox (H-A1)**: ya resuelto en el shared. `MessageBoxComponent` tiene `@Input() initialFocus: 'primary' | 'secondary' | 'close' = 'primary'` que aplica focus en `ngAfterViewInit` para `mode="modal"`. El container de Parámetros usa modal y default primary. No requiere cambio.

### Lote 4 — Polish navegación + cierre

- **Card cierre — una sola acción principal**: el template ya expone un único botón `parametros-cierre-action` que ejecuta `ejecutarAccionCierre()`. El doble acceso histórico se cerró en L1.3 al deshabilitar la banda en área Cierre.
- **Cambio de período dirty (guard)**: confirmado. El `effect()` del orquestador detecta cambios de `periodoGlobal.periodoYm()` y llama a `seleccionarPeriodo(...)` que invoca `confirmarAbandonarEdicionConDialog()`. Si el usuario cancela y el cambio venía del global (`fromGlobal: true`), se restaura `periodoGlobal.setPeriodoYm(this.selectedPeriodo())`. Cubre los caminos del banner global de la app.
- **Banda en cierre — refuerzo**: aplicado en L1.3.

### Validación

- `npx ng build --configuration=development` verde tras cada lote.
- `npx vitest run src/app/features/parametros-generales/rules src/app/features/parametros-generales/utils`: 54/54 verdes. Los 8 del `parametros-workspace.orquestador.spec.ts` siguen rojos por la deuda externa de `TestBed` sin `initTestEnvironment`, ya documentada como cross-módulo.
- Lints sin nuevos errores en los archivos tocados.

### Sin tocar

- BD, servicios, mappers, contratos.
- Estilos globales, archivos protegidos, fuentes.
- Comportamiento de Sincronizar (sigue oculto cuando hay datos).
- `MessageBoxComponent` (focus ya funcionaba).
- Mode modal de los loaders de carga.

## 2026-06-02 - Parámetros: desacople CSS banda + tabs (move a componentes hijos)

Refactor estructural sin cambio visual. Objetivo: cortar el acoplamiento entre el container y sus hijos para que cada componente cargue su propio CSS.

- **Periodo-banda con CSS local**: nuevo `parametros-workspace-periodo-banda.component.css` con `.parametros-viewhead`, `.parametros-period-band`, `.parametros-period-left/right/__status/__detail/__ref/__next/actions/sync`, `.period-row__left-top`, `.period-label`, `.period-arrow`, `.period-mensual__reference`, `.period-chip` + variantes (`--success/--warning/--error/--info/--muted`) y su `@media (max-width: 720px)`. El componente declara `styleUrls` + `encapsulation: ViewEncapsulation.None` (coherente con el container). El host queda como `display: block; flex: 0 0 auto`. El selector `.parametros-frame > .parametros-viewhead` dejó de existir (ahora el host lo aporta).
- **Tabs-panel con CSS local**: nuevo `parametros-workspace-tabs-panel.component.css` con `.parametros-area-tabs`, `.parametros-subtabs`, `.parametros-area-tab/--active`, `.parametros-subtab/--active`, scrollbar webkit, `.parametros-tab-body` + descendientes y `@media (max-width: 760px)`. Host del panel: `display: flex; flex-direction: column; flex: 1 1 auto; min-height: 0`. El componente añade `styleUrls` + `ViewEncapsulation.None`.
- **Container CSS depurado**: se eliminaron del `parametros-workspace-container.css` y del `.responsive.css` todas las reglas movidas. Quedan solo las del shell/page/frame/toolbar/content/cierre/inputs/etc. propias del container.
- **Selectores aplanados**: `.parametros-page app-card.parametros-shell app-card-content.parametros-frame` → `.parametros-frame`. `.parametros-page app-card.parametros-shell` → `.parametros-shell`. Misma cascada, sin depender de los tags `app-card` / `app-card-content`.
- **Limpieza HTML**: `<div class="parametros-content parametros-panel">` → `<div class="parametros-content">`. `parametros-panel` no estaba estilada en ningún lado.
- **Sin tocar**: estilos globales, contratos, motor, BD, servicios, formularios. Build de desarrollo (`npx ng build --configuration=development`) verde. Lints sin nuevos errores (`.param-check {}` vacío preexistente en `responsive.css` queda fuera del alcance).
- **Beneficio**: el container deja de saber clases internas de la banda y de los tabs; refactorizar markup o renombrar clases internas de un hijo ya no requiere editar CSS del padre.

## 2026-06-02 - Parámetros: shell unificado banda + detalle (estilo nómina v2)

Reorganización visual del contenedor del workspace para que la cabecera (banda de período + acciones) y el detalle (tabs + contenido) vivan dentro del mismo marco continuo, igual que los pasos de nómina v2. Sin tocar estilos globales ni el HTML del template.

- **Frame único (`.parametros-frame`)**: ahora lleva el `border`, `border-radius: 10px`, fondo y sombra ligera. El `app-card` envolvente queda transparente. El `padding` del `app-card-content` (`p-4` default) se anula a `0` para que el viewhead pegue arriba.
- **Cabecera integrada (`.parametros-viewhead`)**: padding `10px 14px`, fondo `--prm-soft`, `border-bottom` divider, y `border-top-*-radius: 9px` para coincidir con el frame. Antes era un bloque con `border-radius: 8px` y `background: #f9fafb` flotando aparte.
- **Banda sin caja propia (`.parametros-period-band`)**: se removió su `border` + `border-radius` + `background`; ahora hereda la cabecera (`.parametros-viewhead`). Antes parecía una "isla" dentro del card.
- **Contenido sin doble borde (`.parametros-content`)**: se removió su `border` + `border-radius` propios (el frame ya los provee). Mantiene `overflow: hidden` + `flex` para que los tabs sigan siendo header sticky y el `tab-panel` sea el único con `overflow-y: auto` (scroll interno).
- **Full screen adaptativa**: la cadena ya estaba (`100dvh - chrome` en `.parametros-page` → `flex: 1` en shell → frame → content → tab-panel). No se cambió, solo se confirmó que sigue funcionando tras quitar los bordes intermedios.
- **Sin tocar**: shell global, layout, fuentes, BD, servicios, formularios, contratos. CSS local del módulo. Lints + `npx tsc --noEmit -p tsconfig.app.json` limpios.

## 2026-06-02 - Parámetros: captura anticipada del período por el cliente (sin oficiales)

Cambio funcional acordado con el usuario (alcance: campos oficiales editables + configuración del cliente; reconciliación se mantiene como hoy; **sin cambios de BD/servicio** — se usa el guardado existente).

- **Banda — botón principal**: cuando `!hasAnySyncedData()` el label de Modificar pasa a `Capturar valores`. El botón ya abría edición completa, pero el texto orientaba a "edición de configuración" y no a "captura inicial".
- **Banda — hint del período**: nuevo texto cuando no hay oficiales: `Sin oficiales aún. El cliente puede capturar valores; NOIA los actualizará a fin de mes.`
- **Tooltip Modificar**: caso explícito sin oficiales: `Captura los valores tentativos del cliente para este período. NOIA actualizará los oficiales a fin de mes y revisaremos diferencias.`
- **Tab Valores — empty state**: dos pseudo-tarjetas anteriores ("con referencia" vs "sin referencia") consolidadas en una. Copy reescrito para reflejar el flujo real (el cliente puede capturar UF/UTM/UTA + sueldos + topes + %; NOIA actualiza oficiales a fin de mes). Botón CTA `Capturar valores del período` que delega en `editarParametros()` (mismo flujo que el botón de banda).
- **Tab Valores — botón CTA**: estilo local en el componente, fondo `#1f2937`, hover `#111827`, focus ring `#2563eb`. No introduce tokens nuevos.
- **Sin tocar**: BD, servicio, mappers, contratos, columnas grid, tabs distintas a Valores, estilos globales. La habilitación de campos editables ya estaba conectada a `generalesEditando()` en el tab; solo se cambia messaging y se ofrece un punto de entrada explícito desde el empty state.
- **Reconciliación**: queda como hoy. Cuando NOIA carga el oficial al cierre, el flujo existente emite el chip `Revisar diferencias` y el diálogo de decisión.

## 2026-06-02 - Parámetros Fase 2: tooltips dinámicos, hint contextual y limpieza de redundancias

Continuación de la auditoría `docs/codex/modulos/parametros/auditoria-tab-valores-2026-06.md`. Sigue tocando solo `parametros-generales` (sin cambios globales, SQL ni motor).

- **Tooltip Modificar (H-M6)**: ahora reporta el estado real — `Cargando…`, `Preparando edición…`, `Guardando…`, `No se completó la carga…`, `Período cerrado: solo lectura.`, `Modificar aplica a configuración del cliente…`, o `Abrir edición de la configuración del cliente para este período.`. Antes era un texto único con instrucciones genéricas.
- **Toast inline en lugar de modal pre-guardado (H-G1)**: el botón Guardar de la banda se deshabilita también cuando `!datosFormularioListos()`. `guardar()` queda como defensa en profundidad sin mostrar diálogo. Eliminado el modal `Los datos del período aún se están cargando…` que aparecía si se pulsaba Guardar antes de tiempo.
- **Observaciones de reconciliación a constantes (H-G4)**: copy persistido en BD movido a `OBSERVACIONES_RECONCILIACION` (`actualizadoConOficiales`, `mantenerConfiguracion`, `revisarDespues`). Una sola fuente para la observación que queda en historial.
- **Doble effect de período (H-P2/P3)**: eliminado el `effect()` duplicado en `ParametrosWorkspaceContainer`. Solo queda el del orquestador (con guard de inicialización). El container ya no importa `effect` ni `seleccionarPeriodo`.
- **Hint del período (H-E8)**: `periodoContextoHint` deja de ser un texto fijo (`Sincronizado con el período activo.`) y pasa a contexto útil: `Editando configuración del cliente.` o `Referencia oficial: Abril 2026.`; oculto cuando no hay nada que decir.
- **Labels redundantes en TABS_PARAMETROS_WORKSPACE (H-A4)**: el `.label` del array ahora coincide con `etiquetaTabParametros()` (versión corta). La UI usa la función presenter; el `.label` queda solo por compatibilidad de tipo, sin copy fantasma.
- **scrollActive sin rAF colgado (H-Pf2)**: el `requestAnimationFrame` previo se cancela antes de pedir uno nuevo; al destruir el panel se cancela el pendiente vía `DestroyRef.onDestroy`.
- **Validators (H-F3)**: auditoría confirmó `min/max [0,100]` en porcentajes (sis, sanna, salud*, afc*, trabajoPesado*), `min(0)` sin tope en montos UF/CLP, validador dinámico de `immGratificacion` en función de `gratificacion`. No requiere cambios.
- **ngSubmit sin botón submit (H-F6)**: se conserva (atajo Enter útil), ya protegido por los guards de `guardar()` y por el botón externo de la banda.
- **Tests / tipos / lints**: `npx vitest run` sobre `rules/` + `utils/` → 54/54 verdes. `npx tsc --noEmit -p tsconfig.app.json` sin errores. Lints limpios. Pendiente del fix de runner: los specs con `TestBed` (incluido `parametros-workspace.orquestador.spec.ts`) fallan con vitest puro por falta de `initTestEnvironment` — afecta a varios módulos del repo, no es regresión introducida aquí. Documentado como deuda.

## 2026-06-02 - Parámetros Fase 1: copy NOIA, chips de banda y empty state tab Valores

Cambios aplicados tras la auditoría `docs/codex/modulos/parametros/auditoria-tab-valores-2026-06.md`:

- **Mensajes (`parametros-dialog.rules.ts`)**: reescritos los 17 builders con copy NOIA, tildes correctas, formato `Mes Año` para período en lugar de `yyyy-mm`, código técnico de errores envuelto en "Código técnico (uso interno): …" para no filtrar mensajes crudos de Supabase. Nuevo builder `buildParametrosConfirmarAbandonarEdicionDialog` reemplaza el `globalThis.confirm` nativo. `buildParametrosFormularioInvalidoDialog` ahora recibe lista de campos pendientes.
- **Banda de período**: chips refinados — `Reconciliación pendiente`→`Revisar diferencias`, `Sin config.`→`Falta configuración`, `Sin base`→`Período sin datos`, `Edición`→`En edición`, `Referencia 2026-04`→`Referencia Abril 2026`. `periodoEstadoTitulo` sin prefijo redundante `Estado mensual:`.
- **Card de cierre**: el `<p>` ahora muestra `cierreImpacto()` (info distinta) en lugar de duplicar el detalle de la banda.
- **Tab Valores**: empty state explícito cuando no hay datos oficiales (con referencia disponible si la hay), banner contextual en edición ("Al guardar se persisten también los cambios de Remuneraciones y Cliente"), valores formateados con `DecimalPipe` `es-CL` en modo lectura (UF con 2 decimales, UTM/UTA enteros). Footer oculto si no hay fecha de actualización. Tildes correctas en "Última actualización" y "del período".
- **Orquestador**: `globalThis.confirm` reemplazado por MessageBox con resolver pendiente; doble fetch de períodos en `inicializar()` consolidado a una sola consulta; `subscribe` de `gratificacion` con `takeUntilDestroyed(DestroyRef)`; el dialog de decisión de base ahora muestra hasta 3 acciones (antes `slice(0,2)`).
- **Limpieza**: eliminado código muerto — `nuevoPeriodo`, `crearParametrosParaPeriodo`, `finalizarCrearParametrosConBase`, `ejecutarGuardarInterno`, `pageActions`, `crearParametrosDeshabilitado`, `prepararNuevoPeriodoDesdeBase`, `mostrarConfirmacionCrearParametros`, `emptyParametro`, kind `confirmar-crear-parametros`.
- **Tests**: spec de `parametros-dialog.rules` actualizado al nuevo copy + 4 casos nuevos (form inválido con campos, error de carga con código técnico, abandono de edición, decisión con 3 acciones). Suite de reglas: 48/48 en verde.
- **Sin tocar**: estilos globales, SQL, motor, contratos de servicio, columnas grid, tabs distintas a Valores. Los fallos de `parametros-workspace.orquestador.spec.ts` son preexistentes a este cambio (TestBed `injector` null) y no se introducen por esta fase.

## 2026-06-02 - Nómina V10.1: marco unificado todos los pasos

- Contenedor: `nmv2-step-body` + `nmv2-step-frame` envuelven Parámetros, Alcance, Empleados y pasos demo (movimientos, cálculo, etc.).
- Borde/padding del panel en `.nmv2-step-frame`; pasos sin duplicar marco interno.
- Empleados deja grid lateral KPI/stepper; KPI dentro del panel como el resto.
- Sin cambios a estilos globales, SQL ni motor.

## 2026-06-02 - Nómina V10.1: paso Alcance — solo marco exterior

- `nmv2-step-body--scope` + `alcance-perfect-layout`: continuidad visual bajo cabecera (flujo + detalle del paso), como Parámetros.
- Contenido interno de Alcance sin cambio de patrón (KPI, opciones, checklist).
- Sin cambios a estilos globales, SQL ni motor.

## 2026-06-02 - Nómina V10.1: shell Parámetros sin «Preparar» con base guardada

- Con snapshot de parámetros vigente: CTA shell **«Continuar a alcance»** (habilitado); recarga solo vía «Actualizar» (admin + MessageBox).
- Sin base: **«Preparar nómina»** guarda snapshot y avanza.
- `syncShellContext` reacciona a `estadoParametrosBase` del orquestador (sin depender solo del hijo).
- Sin cambios a estilos globales, SQL ni motor.

## 2026-06-02 - Nómina V10.1: componente modal acceso base parámetros

- Nuevo `nomina-mensual-v2-modal-acceso-base-parametros` (vista desde presenter, inputs/outputs).
- Permisos y evaluación en `nomina-parametros-base-acceso.rules` + `NominaParametrosBaseAccesoService`.
- Overlays y paso Parámetros consumen el servicio; sin duplicar copy ni lógica admin.
- Sin cambios a estilos globales, SQL ni motor.

## 2026-06-02 - Nómina V10.1: bloqueo recarga base parámetros (admin)

- Con base guardada: botón shell «Preparar nómina» deshabilitado para usuarios no admin; administrador ve MessageBox de decisión con repercusiones antes de recargar.
- Modal diferencias: acción «Actualizar» solo visible para admin; RRHH ve MessageBox `blocked` si intenta recargar.
- Validación defensiva: `guardarSnapshotParametrosBase` exige `resumen.periodo === periodoActivo`.
- Sin cambios a estilos globales, SQL ni motor.

## 2026-06-02 - Nómina V10.1: fix truncado «Detalle del paso»

- Eliminado bloque legacy `.nomina-stepper-traceability` en `nomina-mensual-v2-container.css` (`max-width: 88px`, layout flex) que pisaba el grid del componente `nomina-mensual-v2-stepper-traceability` y cortaba email/historial con ellipsis prematuro.
- Tooltip de Historial muestra el último evento completo al pasar el cursor.
- Sin cambios a estilos globales, SQL ni motor.

## 2026-06-02 - Nómina V10.1: fix cuelgue / parpadeo trazabilidad

- Modal trazabilidad: el `effect` ya no escribe señales cuando el modal está cerrado (evitaba bucle de CD con cada `recomputar`).
- Contenedor: `inicializarSesionPeriodo` solo hace `reiniciar` al cambiar período real, no en cada re-ejecución del effect.
- Orquestador: `reiniciarPorCambioPeriodo` preserva contexto y eventos si el período es el mismo.
- Sin cambios a estilos globales, SQL ni motor.

## 2026-06-02 - Nómina V10.1: fix parpadeo «Detalle del paso»

- Orquestador: no vaciar trazabilidad ni estado base si el período no cambió; token en `recomputarTrazabilidad` para ignorar respuestas obsoletas.
- Stepper traceability: un solo `computed` (`soporteIntegridadParametros`) en lugar de dos que leían señales en distinto orden.
- Presenter: resumen unificado desde último evento + auditoría.
- Sin cambios a estilos globales, SQL ni motor.
