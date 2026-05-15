
## 2026-05-14 - EMP-ALTA-VALIDACIONES-ASISTIDAS-01

- **Creación avanzada:** los mensajes del paso vuelven a concentrarse en `app-message-box`; no quedan tarjetas inline permanentes dentro del formulario.
- **MessageBox:** se amplía el ancho útil del modal y se mejora la lectura de descripciones/listas para que los pendientes y revisiones no se sientan comprimidos.
- **Resumen final:** se mantiene `Estado por etapa` como consolidado único; no se duplica con un bloque adicional de validaciones asistidas.
- **Interacción:** `Siguiente` vuelve a mostrar MsgBox cuando hay pendientes o revisiones; las acciones siguen siendo `Continuar` o `Corregir ahora`.
- **Estilo:** fondos suaves por intención, borde completo, radio 8px y densidad compacta. Sin `border-left` decorativo fuerte ni estilos globales.

### 2026-05-13 (Empleados - auditoría de coherencia global del alta)

- **Sin cambio visual aplicado**: se documenta la matriz de aplicabilidad y coherencia para futuras mejoras de Creación avanzada.
- **Criterio UX definido**: diferenciar validación obligatoria, campo no aplicable/derivado y revisión administrativa con decisión RRHH vía `app-message-box`.
- **Referencia**: `docs/codex/modulos/empleados/alta-coherencia-global-00.md`.

## EMP-ADV-LAYOUT-CONSISTENCY-01 - Pulido visual local de Creacion avanzada

- En Creacion avanzada, el wizard usa mas ancho disponible sin cambiar estructura ni flujo.
- El mapa de ficha queda como soporte lateral secundario y mas compacto; el contenido del paso mantiene el protagonismo.
- Se reducen alturas minimas en pasos cortos para evitar cards artificialmente altas.
- `Guardar borrador` queda como accion secundaria local en azul suave mediante `advanced-draft-button`.
- El resumen final queda mas compacto, con menos padding y checklist mas denso.
- Contrato y Bancario ajustan paddings/gaps solo bajo modo avanzado, manteniendo la maqueta y tipografia del ERP.
- Restricciones: cero estilos globales, cero cambios de logica/flujo, cero SQL/RPC/RLS/BD, cero cambios en creacion basica, ficha empleado o remuneraciones.

## EMP-ADV-HONORARIOS-UX-01 - Boleta de honorarios

- En Creacion avanzada, `Boleta de honorarios` se trata como modo visual propio y no como contrato dependiente.
- Las fases que no corresponden se muestran como `No aplica` con copy administrativo.
- El usuario puede guardar borrador, pero no finalizar como trabajador dependiente hasta implementar la persistencia real.
- Los mensajes usan `app-message-box`, tono RRHH y acciones claras: confirmar cambio, guardar borrador o cerrar.

## Peticiones de estilos (bitácora)

### 2026-05-12 - EMP-PERFIL-LABORAL-SQL-01 - Sin cambios visuales

- **Modulo:** Empleados / base SQL.
- **Cambio:** se prepara la persistencia de condiciones especiales del trabajador y el perfil laboral derivado.
- **UI:** no se modifica HTML, CSS ni TypeScript; cualquier tarjeta o formulario visible queda para `EMP-PERFIL-LABORAL-UI-01`.
- **Restricciones:** no tocar estilos globales, flujo del wizard, motor, liquidaciones, LRE ni Previred.


### 2026-05-11 - REM-UX-FLOWS-01 V3 - Visibilidad cliente vs aplicacion

- **Modulo:** Remuneraciones transversal.
- **Preparar nomina:** el avance principal muestra etapas comprensibles para usuario final: `Preparacion`, `Revision`, `Aprobacion y cierre`, `Liquidaciones`. El flujo interno queda como detalle y trazabilidad secundaria.
- **Copy visible:** se reemplazan etiquetas tecnicas principales (`Resultado guardado desde BD`, `Identificador tecnico`, `Version del calculo`) por `Detalle del resultado guardado`, `Referencia interna` y `Version interna`.
- **Liquidaciones oficiales:** `Que falta ahora` conserva solo estado, pendiente, advertencias y accion; la trazabilidad interna baja al disclosure final.
- **Ajuste posterior:** `Que falta ahora` sale de la columna lateral del CTA y pasa a una banda propia de ancho completo con columnas compactas y listas con altura contenida; esto evita espacios en blanco cuando hay muchos bloqueos o advertencias.
- **Restricciones:** sin SQL/RPC/RLS/BD, sin formulas legales ni motor, sin PDF/firma/envio, sin Previred/LRE/banco/contabilidad.

### 2026-05-10 - REM-UX-FLOWS-01 V2 - Periodo global y accion principal

- **Modulo:** Remuneraciones transversal.
- **Preparar nomina:** se elimina el selector local editable `Periodo a validar` y el boton duplicado `Validar periodo` del header. El periodo queda como contexto compacto del periodo activo global y el CTA principal vive en `Siguiente accion recomendada`.
- **Liquidaciones oficiales:** se elimina el selector local editable de periodo y el CTA primario duplicado en la botonera superior; `Generar liquidaciones oficiales` queda como accion principal del bloque operativo.
- **Auditoria:** Asignaciones recurrentes, Dashboard y Reportes ya muestran periodo global como contexto. Movimientos del mes mantiene selector local justificado como consulta/listado por periodo y queda como deuda para una fase de unificacion si se requiere.
- **Restricciones:** sin SQL/RPC/RLS/BD, sin formulas legales ni motor, sin PDF/firma/envio, sin Previred/LRE/banco/contabilidad.

### 2026-05-04 - Fase 9.5B - Resumen recurrentes y grupos de parametros (Proceso mensual)

- **Modulo:** Remuneraciones / Proceso mensual (`/remuneraciones/proceso-mensual`).
- **Cambio:** bajo el resumen existente (activos aptos / parametros operativos), parrafo con conteos de recurrentes aplicables al mes, invalidas, fuera del mes y cerradas; linea compacta **Parametros (grupos):** con `id=clasificacion` por grupo (sin valores UF/UTM ni topes literales).
- **Archivos:** `src/app/features/nomina-mensual/containers/proceso-mensual-container/proceso-mensual-container.html`, `proceso-mensual-container.spec.ts`.

### 2026-05-03 - PARAM-CHILE-01 - Limpieza demo Proceso mensual

- **Modulo:** Remuneraciones / Proceso mensual (`/remuneraciones/proceso-mensual`).
- **Cambio:** se retiraron cifras normativas y totales demo (UF, sueldo minimo, tabla 2026, nomina, banco, fechas de vencimiento literales); tarjeta informativa superior; pasos calculo/export/cierre marcados como no disponibles; enlace a Parametros; sin rediseno profundo del shell.
- **Archivos:** `src/app/pages/proceso-remuneraciones.page.ts`.

### 2026-05-04 - Fase 9.5A - Prevalidaciones en Proceso mensual

- **Modulo:** Remuneraciones / Proceso mensual (`/remuneraciones/proceso-mensual`).
- **Cambio:** selector `input type="month"`, boton **Validar periodo**, tarjetas de estado/bloqueos/advertencias/informaciones y listado por areas; cabecera indica periodo global vs periodo a validar; paso 1 sustituye placeholders locales previos (sin motor, sin cifras normativas).
- **Archivos:** `src/app/features/nomina-mensual/containers/proceso-mensual-container/*`, `src/app/features/nomina-mensual/services/proceso-mensual.service.ts`, `src/app/features/nomina-mensual/rules/proceso-mensual-prevalidacion.rules.ts`, `src/app/features/nomina-mensual/models/proceso-mensual.model.ts`.

### 2026-05-04 - PARAM-CHILE-01 v4 - Proceso mensual en contenedor `nomina-mensual`

- **Modulo:** Remuneraciones / Proceso mensual.
- **Cambio:** UI movida a `features/nomina-mensual/containers/proceso-mensual-container/` (html, css, ts, spec); la pagina de ruta queda como wrapper minimo (`frontend-interfaces`).
- **Archivos:** `src/app/pages/proceso-remuneraciones.page.ts`, `src/app/features/nomina-mensual/containers/proceso-mensual-container/*`.

### 2026-05-03 (Movimientos variables — pantalla 9.4E)

- **Módulo:** Movimientos variables (Remuneraciones).
- **Cambio:** nueva pantalla `/remuneraciones/movimientos-variables` con cabecera al estilo Haberes (breadcrumb, período de referencia, botonera), tarjeta de filtro por `input type="month"`, `DataGrid` con chips de estado y modales propios (clases `mv-*`); ítem de menú con icono **sliders**; hint en Haberes enlaza a esta ruta.
- **Archivos:** `src/app/features/movimientos-variables/containers/movimientos-variables-container/*`, `src/app/pages/movimientos-variables.page.ts`, `src/app/app.routes.ts`, `src/app/layout/sidebar.component.ts`, `src/app/features/haberes-descuentos/containers/haberes-descuentos-container/haberes-descuentos-container.{html,css,ts}`.

### 2026-05-03 (Fase 9.3B.1 — Navegacion dominio Remuneraciones)

- **Modulo:** Remuneraciones (rutas y menu lateral).
- **Cambio:** rutas oficiales bajo `/remuneraciones/*` para Conceptos, Haberes y descuentos, Proceso mensual y Liquidaciones; orden de items en sidebar alineado a ese dominio.
- **Compatibilidad:** `/haberes-descuentos`, `/proceso-remuneraciones`, `/liquidaciones` y `/liquidaciones/:id` quedan como redirects temporales a las rutas oficiales.
- **UI:** sin rediseno profundo; etiqueta de menu **Proceso mensual** (antes Proceso Remuneraciones); breadcrumb primer segmento enlaza a `/remuneraciones`.
- **Archivos:** `src/app/app.routes.ts`, `src/app/layout/sidebar.component.ts`, `src/app/pages/liquidaciones.page.ts`, `src/app/pages/detalle-liquidacion.page.ts`, `src/app/features/empleados/containers/ficha-empleado-container/ficha-empleado-container.html`, contenedores Haberes/Conceptos (breadcrumb).

### 2026-05-03 (Codificación e idioma de presentación)

- **`index.html`**: `lang="es-CL"` para alinear el documento al español chileno (tipografía del sistema y lectores de pantalla).
- **`app.config.ts`**: `LOCALE_ID` `es-CL`, `DEFAULT_CURRENCY_CODE` `CLP` y `registerLocaleData` para que pipes de Angular (fecha, número, moneda) usen convenciones locales coherentes y no mezclen formato en-US por defecto.

### 2026-05-03 (Haberes y descuentos - vista historica 9.3C)

- **Filtro de vigencia**: queda integrado al panel de filtros del `DataGrid`, con default **Operativas** (`ACTIVA + FUTURA`) y opciones **Todas**, **Activas**, **Futuras**, **Vencidas**, **Cerradas** e **Invalidas**.
- **Historial visible**: cerradas, vencidas e invalidas quedan consultables mediante filtros sin mezclarse con la vista operativa por defecto.
- **Acciones por estado**: editar/cerrar queda deshabilitado para filas historicas o invalidas, evitando doble cierre y cambios operativos sobre historial.
- **Archivos**: `src/app/features/haberes-descuentos/containers/haberes-descuentos-container/haberes-descuentos-container.{html,css,ts}`.

### 2026-05-03 (Haberes y descuentos - cierre controlado 9.3B)

- **Accion por fila**: se reemplaza el copy visible **Desactivar** por **Cerrar** para asignaciones recurrentes, alineado a cierre/desactivacion logica sin delete fisico.
- **Confirmacion**: modal simple indica que la asignacion dejara de aplicar y se conservara en historial.
- **Mensaje de exito**: se agrega confirmacion **Asignacion cerrada correctamente.**
- **Archivos**: `src/app/features/haberes-descuentos/containers/haberes-descuentos-container/haberes-descuentos-container.{html,ts}`.
Registro cronológico de mejoras visuales aplicadas por petición, con foco en **trazabilidad** (qué se tocó y dónde),
sin mezclarlo con las reglas base.

### 2026-05-03 (Haberes — copy alineación asignables 9.2C)

- **Cabecera `/remuneraciones/haberes-descuentos`**: el párrafo `hd-lead` aclara que el selector de concepto respeta la misma regla de asignabilidad que el catálogo Conceptos (sin cambio de layout).
  - `src/app/features/haberes-descuentos/containers/haberes-descuentos-container/haberes-descuentos-container.html`

### 2026-05-03 (Conceptos — detalle 9.2B)

- **Modal de detalle** (`/remuneraciones/conceptos`): overlay con `cr-detalle-root`; cuerpo con scroll (`max-height` + flex), **footer fijo** (Cerrar + Editar condicional); secciones con títulos `cr-detalle-section-title`; listas de motivos y bloqueos en tipografía compacta.
- **Chips de vigencia**: variante **inválida** (fechas incoherentes) con estilo distintivo `.hd-chip--vig-invalid`.
  - `src/app/features/haberes-descuentos/containers/conceptos-remuneracion-container/*`

### 2026-05-02 (Conceptos — listado 9.2A)

- **Catálogo `/remuneraciones/conceptos`**: cabecera con texto de catálogo maestro (sin prometer cálculo de liquidaciones); grilla con columnas Nombre → Código → Tipo → LRE → Vigencia → Origen → Cálculo → Asignable; chips de vigencia (ok / futuro / vencido / no vigente); chips Origen (Sistema, Protegido, Usuario); texto **LRE no asignado** en gris; filtros en rejilla `auto-fit` compacta; acción **Revisar** con ícono ojo.
  - `src/app/features/haberes-descuentos/containers/conceptos-remuneracion-container/*`

### 2026-05-02 (Empleados - resumen paso 9 pendientes de negocio)

- **Creación avanzada / paso 9**: bloque informativo compacto bajo la checklist de
  etapas cuando se intentó finalizar y hay bloqueos: título «Pendientes para
  finalizar», lista con mensajes de negocio (fondo `#f8fafc`, borde neutro).
  - `src/app/features/empleados/components/form-empleado/form-empleado.{html,css,ts}`

### 2026-05-02 (Empleados - selects con opción vacía)

- **Catálogos**: primera fila explícita «Seleccione…» / «Sin seleccionar» en `app-search-select` de identidad, domicilio, contrato, previsión, APVI y banco; el disparador muestra placeholder gris hasta elección real (mismo patrón `SearchSelectComponent`).
  - `src/app/features/empleados/utils/empleado-select-options.ts`
  - `src/app/features/empleados/components/secciones/datos-personales/*`
  - `src/app/features/empleados/components/secciones/contacto/*`
  - `src/app/features/empleados/components/secciones/contrato/*`
  - `src/app/features/empleados/components/secciones/prevision-salud/*`
  - `src/app/features/empleados/components/secciones/bancario/*`

### 2026-05-02 (Empleados - validacion explicita para remuneraciones)

- **Ficha empleado**: accion principal **Validar para remuneraciones** solo cuando
  la ficha no tiene bloqueos ni defaults tecnicos y aun no esta apta; confirmacion
  compacta con botones **Cancelar** y **Validar**.
- **Mensajes operativos**: estado `Ficha completa` + `Pendiente de validación`
  cuando faltaba solo la confirmación; errores de validación muestran hasta cinco
  pendientes principales y «y X pendientes más» con tilde; textos de bloqueo
  alineados a negocio (p. ej. cuenta temporal, cargo real, sueldo, previsión/APVI).
- **Diálogo de confirmación**: título «¿Validar esta ficha para remuneraciones?»
  y cuerpo con tildes (`podrá`, `remuneración`, `período`).
- **Sin activacion automatica**: guardar secciones ya no deja apta la ficha por
  efecto lateral; la aptitud queda atada a la accion explicita.
  - `src/app/features/empleados/containers/ficha-empleado-container/ficha-empleado-container.{html,css,ts}`
  - `src/app/features/empleados/services/empleados.service.ts`
  - `src/app/features/empleados/data-access/empleados.repository.ts`

### 2026-05-02 (Parametros - estandar UI del modulo)

- **Estandar documentado**: se creo `docs/codex/temas/parametros-ui-estandar.md` (stub; fuente vigente `docs/codex/modulos/parametros/ui-parametros.md`) con estructura oficial, banda superior, tabs, subtabs, copy, empty states, DataGrid, cards compactas, responsive y checklist de cierre.
- **Clases semanticas compatibles**: se agregaron aliases `parametros-period-*`, `parametros-tabs`, `parametros-tab-button`, `parametros-inner-*`, `parametros-tab-panel`, `parametros-section-card`, `parametros-config-card`, `parametros-form-grid` y `parametros-grid-shell` sin retirar las clases legacy.
- **Referencias docs/codex**: README, AGENTS y estilos apuntan al nuevo estandar para futuras mejoras de Parametros.
  - `src/app/pages/parametros.page.ts`
  - `src/styles.css`
  - `src/app/features/parametros-generales/components/parametros-inner-tab-bar.component.ts`
  - `src/app/features/parametros-generales/components/tabs/*.ts`
  - `docs/codex/modulos/parametros/ui-parametros.md` (histórico: `docs/codex/temas/parametros-ui-estandar.md`)

### 2026-05-02 (Parametros - referencia anterior en carga pendiente)

- **Empty states mensuales pendientes**: Tramos Cargas, Impuesto Unico, Ley 16.744, Valores y Remuneraciones muestran mensajes breves cuando el periodo activo no tiene datos oficiales.
- **Referencia sin mezclar datos**: si hay un periodo anterior con datos mensuales, se ofrece una accion secundaria `Ver referencia ...` que cambia el selector al periodo anterior; no se renderizan ni guardan datos anteriores dentro del periodo activo.
- **Banda superior liviana**: en estados pendiente/parcial solo agrega `Referencia disponible: ...` cuando corresponde, manteniendo el detalle corto sobre datos oficiales faltantes y catalogos/vigencias disponibles.
  - `src/app/pages/parametros.page.ts`
  - `src/app/features/parametros-generales/components/tabs/parametros-valores-tab.component.ts`
  - `src/app/features/parametros-generales/components/tabs/parametros-remuneraciones-tab.component.ts`
  - `src/app/features/parametros-generales/components/tabs/parametros-tramos-carga-tab.component.ts`
  - `src/app/features/parametros-generales/components/tabs/parametros-tramos-renta-tab.component.ts`
  - `src/app/features/parametros-generales/components/tabs/parametros-ccaf-mutuales-tab.component.ts`

### 2026-05-02 (Parámetros - banda superior período / estado mensual)

- **Dos zonas flex sin solape**: izquierda título + controles de período + hint corto de sincronización; derecha estado mensual (título + chip único + detalle); sin grid de tres columnas ni texto largo competiendo con los selects.
- **Crear parámetros** queda en la botonera junto a **Modificar** (secundario a la izquierda del primario), no en la banda de período.
- **Pulido final banda**: menos aire entre toolbar y `.period-row` (`parametros-viewhead` gap/padding); bloque estado con ancho ~22rem, `margin-left: auto`, texto y chip alineados a la izquierda dentro del bloque (sin pegar al borde derecho del card); detalle con `text-wrap: balance` donde el motor lo soporta.
- **Copy acotado**: títulos `Estado mensual: …` y detalles breves por pendiente / completo / parcial / error / edición; advertencia suave solo en pendiente (chip); parcial en variante info.
  - `src/app/pages/parametros.page.ts`
  - `src/styles.css`

### 2026-05-01 (Parametros - estado simple y tabs limpios)

- **Banda superior como fuente de estado**: el periodo ahora comunica pendiente, parcial, completo, editando o error con un chip unico y una descripcion corta; los catalogos/vigencias se explican como disponibles aunque falte carga mensual.
  - `src/app/pages/parametros.page.ts`
- **Tabs sin chips repetidos**: se quitaron los hints/chips de tipo de dato en Valores, Remuneraciones, CCAF/Mutual, Tramos, Impuesto, Salud, Prevision y Reforma; quedan titulo, filtros, tabla y empty state especifico.
  - `src/app/features/parametros-generales/components/tabs/parametros-valores-tab.component.ts`
  - `src/app/features/parametros-generales/components/tabs/parametros-remuneraciones-tab.component.ts`
  - `src/app/features/parametros-generales/components/tabs/parametros-ccaf-mutuales-tab.component.ts`
  - `src/app/features/parametros-generales/components/tabs/parametros-tramos-carga-tab.component.ts`
  - `src/app/features/parametros-generales/components/tabs/parametros-tramos-renta-tab.component.ts`
  - `src/app/features/parametros-generales/components/tabs/parametros-salud-tab.component.ts`
  - `src/app/features/parametros-generales/components/tabs/parametros-afp-tab.component.ts`
  - `src/app/features/parametros-generales/components/tabs/parametros-reforma-tab.component.ts`

### 2026-05-01 (Parametros - copy compacto por tipo de dato)

- **Hints sin detalles tecnicos de BD**: se reemplazaron explicaciones visibles con nombres de tablas/columnas por chips compactos de contexto (`Mensual`, `Vigencia`, `Catalogo global`, `Normativa`, `Solo lectura`) y frases de una linea.
  - `src/app/features/parametros-generales/components/tabs/parametros-tramos-carga-tab.component.ts`
  - `src/app/features/parametros-generales/components/tabs/parametros-tramos-renta-tab.component.ts`
  - `src/app/features/parametros-generales/components/tabs/parametros-ccaf-mutuales-tab.component.ts`
  - `src/app/features/parametros-generales/components/tabs/parametros-salud-tab.component.ts`
  - `src/app/features/parametros-generales/components/tabs/parametros-afp-tab.component.ts`
  - `src/app/features/parametros-generales/components/tabs/parametros-reforma-tab.component.ts`
- **Periodo visible sin cambiar filtros**: las tabs de consulta reciben el periodo seleccionado solo para el chip `Periodo YYYY-MM`; no se modificaron repositorios, servicios ni reglas de carga.
  - `src/app/pages/parametros.page.ts`

### 2026-05-01 (Parametros - filtros por periodo, vigencia y catalogo)

- **Politica de filtros por tipo de dato**: las grillas de Parametros separan datos mensuales, vigencias y catalogos globales. AFP/Salud/Legales/AFC usan solape de vigencia; CCAF/Mutuales/APV se muestran como catalogos generales; Reforma > Aportes muestra el calendario normativo completo y marca estado segun periodo activo.
  - `src/app/features/parametros-generales/data-access/parametros-generales.repository.ts`
  - `src/app/pages/parametros.page.ts`
- **Copy/empty states**: se corrigieron filtros visibles de `Periodo` a `Vigencia inicio` donde corresponde y se ajusto Reforma para no comunicar la gradualidad como faltante mensual.
  - `src/app/features/parametros-generales/components/tabs/parametros-salud-tab.component.ts`
  - `src/app/features/parametros-generales/components/tabs/parametros-reforma-tab.component.ts`
  - `src/app/features/parametros-generales/components/tabs/parametros-ccaf-mutuales-tab.component.ts`

### 2026-05-01 (Tablas ERP — estándar transversal)

- **Estándar oficial de tablas/DataGrid**: se documentó qué mostrar/no mostrar, orden de columnas, formatos de fechas/montos/porcentajes/vacíos, filtros, toolbar, loading, empty states, paginación, acciones y responsive.
  - `docs/codex/ui-tables.md`
  - `docs/codex/README.md`
  - `docs/codex/estilos/README.md`
- **Defaults de DataGrid**: valores vacíos pasan a `—`, booleanos a `Sí/No` y fechas sin formateador explícito a formato local consistente, manteniendo loading/scroll dentro del componente.
  - `src/app/shared/components/ui/data-grid.component.ts`
- **Aplicación inicial**: Haberes y descuentos reduce columnas visibles a valor operativo único (monto/porcentaje), fechas con formato local y columnas secundarias ocultas; Conceptos oculta origen técnico por defecto, muestra modo Automático/Manual, estado Vigente/No vigente y vigencias; Parámetros normaliza vacío, CLP, porcentaje y fechas.
  - `src/app/features/haberes-descuentos/containers/haberes-descuentos-container/haberes-descuentos-container.ts`
  - `src/app/features/haberes-descuentos/containers/conceptos-remuneracion-container/conceptos-remuneracion-container.{ts,html}`
  - `src/app/pages/parametros.page.ts`

### 2026-05-01 (Parámetros — hints y empty states por vigencia vs período)

- **Copy alineado a datos reales**: se evita culpar al “mes seleccionado” cuando la grilla es catálogo global o listado por solape de vigencia; se aclara gradualidad 8,5 % como normativa por vigencia.
  - `src/app/features/parametros-generales/components/tabs/parametros-ccaf-mutuales-tab.component.ts`
  - `src/app/features/parametros-generales/components/tabs/parametros-reforma-tab.component.ts`
  - `src/app/features/parametros-generales/components/tabs/parametros-tramos-renta-tab.component.ts`
  - `src/app/features/parametros-generales/components/tabs/parametros-tramos-carga-tab.component.ts`
  - `src/app/features/parametros-generales/components/tabs/parametros-salud-tab.component.ts`
  - `src/app/features/parametros-generales/components/tabs/parametros-afp-tab.component.ts`
- **Documentación de contrato**: matriz de tablas y reglas UI/Python/DataGrid.
  - `docs/codex/modulos/parametros/periodo-vigencia-catalogo.md` (histórico: `docs/codex/temas/parametros-vigencia-y-periodo.md`)
  - `docs/codex/README.md`

### 2026-05-01 (Parámetros del sistema — Fase 2.5 pulido visual menor)

- **Tabs principales con scroll interno más intencional**: se amplió el respiro lateral y `scroll-padding-inline` de `nav.folder-tabs`, se mantuvo el auto-centrado del tab activo y se agregó un fade lateral sutil desde el contenedor para sugerir scroll sin tapar texto.
  - `src/app/pages/parametros.page.ts`
- **CCAF y Mutual como configuración vigente**: la subpestaña de configuración queda titulada como **Configuración vigente del período**, con copy breve, ancho contenido y grilla compacta de los mismos tres campos existentes.
  - `src/app/features/parametros-generales/components/tabs/parametros-ccaf-mutuales-tab.component.ts`
- **Banda de período**: se mantiene el patrón aprobado de estado/chip/acción; no se cambiaron datos, sincronización ni lógica del período global.
  - `src/app/pages/parametros.page.ts`

### 2026-04-28 (documentación)

- **Índice padre único**: `docs/codex/README.md` con reglas por petición y mapa por tema.
- **Eliminados** `bases-estilos.md` y `estilos-base.md` (contenido redundante); rutas de código en `docs/codex/temas/implementacion-ui.md`.
- Referencias actualizadas en `AGENTS.md`, `manual-base-proyecto.md`, `estilos/README.md`, `ui-form-guidelines.md`, `temas/modo-basico-empleado.md`.

### 2026-04-28 (listado empleados)

- **Tabla listado**: `filtersEnabled=false` en `tabla-empleados.html` (sin barra global de busqueda/filtros del DataGrid; coincide con pedido original).

### 2026-04-29 (Ficha de Empleado)

- **Tipografía**: jerarquía alineada a `ui-form-guidelines.md` (`--erp-text-xs/sm/md`, `--erp-title-sm/md`) en hero, revisión por bloque, rejilla de datos y panel lateral.
- **Fondo**: página/host `#f8fafc`; títulos y franjas con barra `#f8fafc` (`section-head`, `detail-block-head`, cabecera `file-status-card`, franja tabs `file-tabs-wrap`, resumen superior `file-sheet-head`).
- **Iconos**: tamaños 14–16px (toolbar 14px, revisión/sección/título estado); Lucide `ClipboardList`, `FolderOpen`, `Activity` en Encabezados.
- **Archivos**: `ficha-empleado-container.{html,css,ts}`.

### 2026-04-29 (Ficha de Empleado — ajuste fino)

- **Secciones**: sin íconos en cabeceras de bloque; títulos sólo texto sobre franja gris.
- **Editar**: botón por sección más ligero (peso 500, `--erp-text-xs`), sin ícono; alineado a la derecha (`margin-left: auto`).
- **Panel lateral**: `gap` interno un poco menor; título sin ícono ni franja extra.
- **Copy**: `Fecha término`, `Tiempo de colación` en `detailItems`.

### 2026-04-27
- **Creación Básica de Empleado (modo básico)**:
  - Se agregó encabezado/ayuda del flujo básico (sin tocar lógica).
    - `src/app/features/empleados/components/form-empleado/form-empleado.html`
    - `src/app/features/empleados/components/form-empleado/form-empleado.css`
  - Se reorganizó el layout visual de “datos personales” en modo básico con grilla interna de 8 columnas (scoped a `.step-panel--basic`).
    - `src/app/features/empleados/components/secciones/datos-personales/datos-personales.css`

- **Documentación SQL (ligereza visual)**:
  - Se mejoró lectura/jerarquía de los README de base.
    - `bd/base/README.md`
    - `bd/base/v11/README.md`

### 2026-04-30 (Creación básica — ficha en proceso)

- **Creación básica más clara y consistente**: se unificó el lenguaje a **empleado** en el modo básico, se cambió el CTA a **“Guardar ficha básica”**, se corrigieron acentos/copy, se agregó aviso informativo sutil del alcance, y se reordenaron secciones para separar **Contacto** como bloque propio. Además se corrigió el patrón de layout para evitar formularios demasiado anchos: **máximo 4 columnas en desktop (2 tablet, 1 móvil)** y secciones de 2 campos con **ancho contenido** (sin grilla 8 columnas). Finalmente se balanceó el layout para evitar vacío lateral: wrapper centrado **~1120px** y “Datos personales + Contacto” en **2 columnas** en desktop.
  - `src/app/features/empleados/components/form-empleado/form-empleado.{ts,html,css}`
  - `src/app/features/empleados/components/secciones/datos-personales/datos-personales.{html,css}`
  - Ajuste final: se evitó la duplicidad fuerte de título (“Crear empleado” arriba + “Nuevo empleado” dentro), se reforzó “Documento de identificación *” como **grupo** (RUT o pasaporte) y se redujo el texto inferior para que no duplique el encabezado.
  - Validaciones (UX): Email/Teléfono opcionales ya no muestran mensajes si están vacíos; placeholders pasaron a formato “Ej:” para no confundirse con datos reales.
  - **Reglas de maquetación**: se documentó el patrón de **CSS por capas** (scoping) para evitar estilos genéricos que se pisan entre modos/secciones.
  - **Reglas de maquetación**: se agregó la regla de **contenedor padre a límite inferior** (altura 100% + `minmax(0, 1fr)` cuando aplique).
  - Pulido de jerarquía: se eliminó el texto pequeño duplicado “Creación básica” dentro del bloque y el label quedó como “Pasaporte (opcional)”.
  - Alineación: el header interno “Creación básica [En proceso]” se alineó al mismo eje (`max-width`) que el formulario para evitar desconexión visual.

### 2026-04-30 (Listado empleados — acción integrada)

- **Acción “Crear empleado” integrada al DataGrid**: el CTA se movió al header del `app-data-grid` (patrón de `conceptos-remuneracion`), con menú Básico/Avanzado desplegable desde el mismo botón.
  - `src/app/features/empleados/containers/listado-empleados-container/listado-empleados-container.{html,ts}`
  - `src/app/features/empleados/components/tabla-empleados/tabla-empleados.{html,ts,css}`

### 2026-04-30 (Conceptos remuneración — toolbar)

- **Se quitó “Refrescar” del header de página** para evitar duplicidad: queda solo el refresco del `app-data-grid`.
  - `src/app/features/haberes-descuentos/containers/conceptos-remuneracion-container/conceptos-remuneracion-container.{html,ts}`

### 2026-04-30 (DataGrid — filtro rango fechas)

- **Filtro rango fecha más claro y seguro**: labels visibles “Desde/Hasta” (sin depender de placeholder), validación para impedir “Hasta < Desde”, acción “Limpiar” del rango, y soporte opcional `disallowFuture` para evitar fechas futuras (ej. fecha real de ingreso).
  - `src/app/shared/components/ui/data-grid.component.ts`
  - `src/app/features/empleados/components/tabla-empleados/tabla-empleados.ts`

### 2026-04-30 (Listado empleados — filtros sin chips)

- **Fila de chips de filtros activos parametrizable**: se agregó `filterChipsDisplay` al `app-data-grid` y en empleados se configuró para que los chips solo aparezcan si los filtros están ocultos (evita duplicidad).
  - `src/app/shared/components/ui/data-grid.component.ts`
  - `src/app/features/empleados/components/tabla-empleados/tabla-empleados.html`

### 2026-04-30 (DataGrid — filtros vs columnas ocultas)

- **Filtros consistentes al ocultar columnas**: `visibleFilters` ya no “revive” filtros de columnas ocultas como standalone; ahora respeta `column.showFilterWhenHidden` y limpia automáticamente el filtro al ocultar una columna si no debe mantenerse.
  - `src/app/shared/components/ui/data-grid.component.ts`
  - `src/app/features/empleados/components/tabla-empleados/tabla-empleados.ts`

### 2026-04-30 (Listado empleados — empty state y header)

- **Empty states contextuales + contador claro**: en empleados se diferenció “sin empleados” vs “sin resultados por filtros”, el header muestra `· N resultados` y opcional `· N filtros activos`, y el empty state se posicionó más arriba para evitar un centro vacío gigante. Botones: `Limpiar` se deshabilita si no hay filtros; `Aplicar` solo es primario/habilitado cuando hay cambios pendientes.
  - `src/app/shared/components/ui/data-grid.component.ts`
  - `src/app/features/empleados/components/tabla-empleados/tabla-empleados.{html,css}`
  - `src/app/features/empleados/containers/listado-empleados-container/listado-empleados-container.ts`

### 2026-04-30 (Listado empleados — popover crear empleado)

- **Popover “Crear empleado” anclado al botón**: el dropdown ahora se renderiza dentro del header del `app-data-grid` (anclado al CTA), no se dispara desde “Buscar”, y se cierra por click fuera, Escape, selección o navegación.
  - `src/app/shared/components/ui/data-grid.component.ts`
  - `src/app/features/empleados/components/tabla-empleados/tabla-empleados.{html,ts,css}`

- **Pulido visual del popover**: header con título en casing normal, sombra liviana, separador sutil, opciones 100% clickeables, hover suave e ícono “+” a la derecha dentro de contenedor.
  - `src/app/features/empleados/components/tabla-empleados/tabla-empleados.{html,css}`

- **Ajuste final de ancho/offset**: popover en ~296px (rango 280–300) y separación de 8px bajo el botón, manteniendo `max-width` responsivo.
  - `src/app/features/empleados/components/tabla-empleados/tabla-empleados.css`

### 2026-04-30 (Creación avanzada — maquetación limpia)

- **Creación avanzada alineada a patrón de creación básica** (sin tocar lógica): se aplicó **ancho controlado** (~1120px) con header interno alineado al eje del formulario, y se agregó un encabezado liviano “Datos completos del empleado” con descripción del alcance del alta avanzada.
  - `src/app/features/empleados/components/form-empleado/form-empleado.{ts,html,css}`
- **Grillas de captura sin 8 columnas**: se eliminaron las grillas `repeat(8, ...)` en los componentes del flujo avanzado y se estandarizó a **máximo 4 columnas en desktop (2 tablet, 1 móvil)** con spans moderados.
  - `src/app/features/empleados/components/secciones/datos-personales/datos-personales.css`
  - `src/app/features/empleados/components/secciones/contacto/contacto.css`
  - `src/app/features/empleados/components/secciones/contrato/contrato.css`
  - `src/app/features/empleados/components/secciones/prevision-salud/prevision-salud.css`
  - `src/app/features/empleados/components/secciones/bancario/bancario.css`
- **Pulido stepper + primer paso (Datos personales)**: se bajó el ruido del stepper (el **nombre del paso** es principal; el estado queda como **badge** secundario) y se evitó el quiebre desordenado en dos filas usando **scroll horizontal**. Además el paso 1 ahora incluye **Contacto (Email/Teléfono)** junto a Identificación/Nombre/Datos personales, manteniendo el mismo patrón de tarjetas limpio.
  - `src/app/features/empleados/components/form-empleado/form-empleado.{ts,html,css}`
  - `src/app/features/empleados/components/secciones/datos-personales/datos-personales.html`
  - `src/app/features/empleados/models/empleado-form.manifest.ts`
  - Ajuste UX: se agregó encabezado contextual del paso (**“Paso X de 9 · …”** + descripción breve) y se ocultó la scrollbar del stepper para que el overflow horizontal se sienta más limpio.
  - **Wrapper estable del wizard avanzado**: se creó una estructura de layout con clases dedicadas (`advanced-create-shell/inner`, `advanced-wizard-layout`, `advanced-wizard-map`, `advanced-wizard-content`, `advanced-wizard-footer`) para centralizar la maquetación del flujo avanzado y evitar ajustes aislados por bloque. En desktop se habilita el panel lateral **“Mapa de ficha”** (2 columnas) y en tablet/móvil se oculta para mantener lectura en una columna.

### 2026-05-01 (Parámetros del sistema — Fase 2 layout fino)

- **Tabs principales sin cortes**: el tab activo se auto-centrará dentro del scroll interno de `nav.folder-tabs` al cambiar de pestaña; se ajustó `scroll-padding`/padding para evitar recortes por borde.
  - `src/app/pages/parametros.page.ts`
- **Grillas vacías con altura razonable**: se acotó `gridHeight` a `min(520px, 100%)` en pestañas con catálogos/empty states frecuentes (sin tocar lógica, columnas ni filtros), evitando “cajas gigantes vacías” sin inflar filas.
  - `src/app/features/parametros-generales/components/tabs/parametros-tramos-carga-tab.component.ts`
  - `src/app/features/parametros-generales/components/tabs/parametros-tramos-renta-tab.component.ts`
  - `src/app/features/parametros-generales/components/tabs/parametros-ccaf-mutuales-tab.component.ts`
  - `src/app/features/parametros-generales/components/tabs/parametros-reforma-tab.component.ts`

### 2026-04-30 (Creacion avanzada - Mapa de ficha como navegacion desktop)

- **Navegacion avanzada sin duplicidad**: en desktop el panel lateral **Mapa de ficha** queda como navegacion principal y el stepper horizontal se reserva para tablet/movil.
  - `src/app/features/empleados/components/form-empleado/form-empleado.{html,css}`
- **Estados visuales menos alarmantes**: se agrego estado visual **Actual**, resumen de pendientes/errores en el mapa y se evita pintar pasos no intentados como **Con errores** desde el inicio; el rojo queda limitado al badge/borde sutil cuando corresponde.
  - `src/app/features/empleados/components/form-empleado/form-empleado.{ts,html,css}`

### 2026-04-30 (Creacion avanzada - Mapa de ficha timeline)

- **Mapa de ficha como guia visual**: se agrego progreso por posicion del paso, porcentaje, resumen corto y timeline vertical con linea sutil, numeros y estados secundarios.
  - `src/app/features/empleados/components/form-empleado/form-empleado.{ts,html,css}`
- **Jerarquia del contenido derecho**: el encabezado contextual del paso queda primero y "Datos completos del empleado" pasa a bloque introductorio secundario con fondo neutro.
  - `src/app/features/empleados/components/form-empleado/form-empleado.{html,css}`

### 2026-04-30 (Creacion avanzada - refinamiento visual del timeline)

- **Acabado visual del Mapa de ficha**: se reforzo la lectura de timeline con linea vertical mas legible, estado activo integrado, hover/focus visibles y progreso con texto "N% completado" dentro del bloque.
  - `src/app/features/empleados/components/form-empleado/form-empleado.{html,css}`
- **Bloque informativo secundario**: se suavizo la tarjeta "Datos completos del empleado" con borde/fondo mas livianos y menor altura visual.
  - `src/app/features/empleados/components/form-empleado/form-empleado.css`

### 2026-04-30 (Creacion avanzada - timeline sin bordes pesados)

- **Mapa de ficha mas integrado**: se quitaron marcos visibles del panel y de los items, dejando un riel de timeline, fondos suaves y acentos laterales para evitar apariencia de tarjetas genericas.
  - `src/app/features/empleados/components/form-empleado/form-empleado.css`
- **Bloque informativo sin caja marcada**: "Datos completos del empleado" queda como banda secundaria con acento lateral, sin borde rectangular.
  - `src/app/features/empleados/components/form-empleado/form-empleado.css`

### 2026-04-30 (Creacion avanzada - Paso 1 como patron base)

- **Paso 1 mas compacto y jerarquico**: se ajusto el encabezado a "identidad legal, datos personales y contacto base", se transformo la introduccion pesada en una nota liviana y se ordenaron los bloques como Identificacion legal, Nombre, Datos personales y Contacto.
  - `src/app/features/empleados/components/form-empleado/form-empleado.{ts,html,css}`
  - `src/app/features/empleados/components/secciones/datos-personales/datos-personales.{html,css}`
- **Grillas proporcionales por bloque**: Identificacion legal usa 4/2/1 columnas, Nombre prioriza Nombres sobre apellidos, Datos personales y Contacto acotan su ancho interno para evitar selects o campos opcionales gigantes.
  - `src/app/features/empleados/components/secciones/datos-personales/datos-personales.css`
- **Ajuste fino de proporcion**: se amplio moderadamente el eje desktop del wizard, se redujo el espacio vertical entre cards del Paso 1, se compacto el padding de bloques con pocos campos y se separo el footer inferior con margen y borde suave.
  - `src/app/features/empleados/components/form-empleado/form-empleado.css`
  - `src/app/features/empleados/components/secciones/datos-personales/datos-personales.css`
- **Microajuste final de densidad**: se redujo el aire entre el encabezado avanzado y el contenido, la nota informativa paso a ancho contenido y los bloques cortos del Paso 1 quedaron con padding/gap mas compacto.
  - `src/app/features/empleados/components/form-empleado/form-empleado.css`
  - `src/app/features/empleados/components/secciones/datos-personales/datos-personales.css`
- **Cierre de patron del Paso 1**: la nota informativa mantiene estilo liviano pero vuelve a ocupar el ancho del contenido para alinearse con las cards del formulario.
  - `src/app/features/empleados/components/form-empleado/form-empleado.css`

### 2026-04-30 (Creacion avanzada - Paso 2 domicilio)

- **Paso 2 alineado al patron del Paso 1**: se actualizo la bajada del paso Domicilio y la nota informativa liviana cambia su texto cuando el paso activo es Domicilio, manteniendo ancho alineado a las cards.
  - `src/app/features/empleados/components/form-empleado/form-empleado.{ts,html,css}`
- **Domicilio particular mas proporcional**: Calle queda mas ancha, Numero y Depto. mas compactos, Comuna queda en ancho medio y Observaciones ocupa ancho completo con altura contenida.
  - `src/app/features/empleados/components/secciones/contacto/contacto.{html,css}`
- **Estabilizacion visual del Paso 2**: se agrego una capa especifica para mantener altura minima razonable del panel Domicilio, sostener el footer en una posicion estable y reducir la altura inicial de Observaciones.
  - `src/app/features/empleados/components/form-empleado/form-empleado.{html,css}`
  - `src/app/features/empleados/components/secciones/contacto/contacto.css`
- **Contenedor padre hasta el final de pagina**: se ajusto el eje avanzado para que la columna de contenido y el panel del paso crezcan hasta el alto disponible, manteniendo el footer estable sin inflar las cards internas.
  - `src/app/features/empleados/components/form-empleado/form-empleado.css`
- **Regla documentada como estandar**: el contenedor padre visible de pantallas y wizards debe llegar al final de la pagina/viewport disponible; el alto se resuelve en el marco padre, no inflando cards internas ni campos.
  - `docs/codex/estilos/README.md`
  - `docs/codex/ui-form-guidelines.md`

### 2026-04-30 (Creacion avanzada - Paso 3 contrato y organizacion)

- **Paso 3 alineado al patron del wizard**: se actualizo la bajada y la nota informativa contextual para Contrato y organizacion, usando la misma alerta liviana alineada al contenido.
  - `src/app/features/empleados/components/form-empleado/form-empleado.{ts,html,css}`
- **Bloques contractuales separados y compactos**: Relacion laboral queda como seleccion breve, Contrato agrupa tipo trabajador/tipo contrato/indefinido y fechas, Organizacion separa departamento/sucursal, y Centro de costo conserva cargo como campo protagonista.
  - `src/app/features/empleados/components/secciones/contrato/contrato.{html,css}`
- **Altura estable del Paso 3**: el panel de contrato participa del mismo contenedor flexible del wizard para mantener el footer estable sin inflar cards internas.
  - `src/app/features/empleados/components/form-empleado/form-empleado.css`
- **Ajuste fino de densidad del Paso 3**: se compacto el bloque Contrato, la ayuda de Indefinido quedo como hint secundario, el subtitulo de fechas se suavizo, Organizacion redujo aire interno y Cargo gano ancho relativo frente a Centro de costo y Estado inicial.
  - `src/app/features/empleados/components/secciones/contrato/contrato.css`

### 2026-04-30 (Creacion avanzada - Paso 4 jornada y remuneracion)

- **Paso 4 alineado al patron del wizard**: se actualizo la bajada y la nota informativa contextual para Jornada y remuneracion, manteniendo alerta liviana y ancho alineado a las cards.
  - `src/app/features/empleados/components/form-empleado/form-empleado.{ts,html,css}`
- **Jornada y remuneracion por bloques**: el bloque de remuneracion se separo visualmente en Jornada laboral, Distribucion y colacion, Remuneracion base y Condiciones de remuneracion, sin mover campos fuera del paso ni cambiar bindings.
  - `src/app/features/empleados/components/secciones/contrato/contrato.html`
- **Grillas proporcionales del Paso 4**: Tipo jornada y sueldo base ganan ancho relativo, horas/dias/colacion quedan compactos, condiciones se muestran como checks livianos y el panel participa del mismo alto estable del wizard.
  - `src/app/features/empleados/components/secciones/contrato/contrato.css`
- **Ajuste fino de densidad del Paso 4**: Distribucion y colacion redujo padding/alto interno, colacion quedo como campo corto, Condiciones de remuneracion se acoto en ancho y los hints de checks quedaron mas discretos.
  - `src/app/features/empleados/components/secciones/contrato/contrato.{html,css}`
- **Correccion visual del Paso 4**: Distribucion de la jornada dejo de ocupar fila completa y queda alineada en desktop con Tiempo de colacion como campo corto, manteniendo el scope de clases solo en los bloques del paso.
  - `src/app/features/empleados/components/secciones/contrato/contrato.html`

### 2026-04-30 (Creacion avanzada - Paso 5 asignaciones y condiciones)

- **Paso 5 alineado al patron del wizard**: se actualizo la bajada y la nota informativa contextual para Asignaciones y condiciones especiales, manteniendo alerta liviana y contenedor estable.
  - `src/app/features/empleados/components/form-empleado/form-empleado.{ts,html,css}`
- **Asignaciones y condiciones por bloques**: Asignacion familiar, Zona extrema y Semana corrida quedan como cards compactas con encabezado liviano y ayuda secundaria.
  - `src/app/features/empleados/components/secciones/contrato/contrato.html`
- **Grillas proporcionales del Paso 5**: cargas/tramo/valor se alinean en desktop, zona extrema separa decision/territorio/porcentaje, y semana corrida usa selector de dias compacto sin inflar altura interna.
  - `src/app/features/empleados/components/secciones/contrato/contrato.css`

### 2026-04-30 (Creación avanzada — Paso 5 ajuste fino)

- **Asignación familiar**: etiqueta “Cargas” más corta, “Tabla vigente” pasa a chip discreto, y “Valor por carga” refuerza estilo de dato calculado (readonly con borde punteado).
  - `src/app/features/empleados/components/secciones/contrato/contrato.html`
  - `src/app/features/empleados/components/secciones/contrato/contrato.css`
- **Zona extrema y Semana corrida (inactivos)**: los campos condicionales dejan de ocupar espacio cuando el toggle está apagado y se reemplazan por una nota muted, evitando la impresión de editabilidad.
  - `src/app/features/empleados/components/secciones/contrato/contrato.html`
- **Eje consistente del Paso 5**: los contenedores `grid` de Asignación familiar / Zona extrema / Semana corrida usan el mismo ancho máximo para evitar saltos visuales entre bloques.
  - `src/app/features/empleados/components/secciones/contrato/contrato.css`

### 2026-04-30 (Creación avanzada — layout wizard ajuste fino)

- **Paso X**: se eliminó la caja informativa repetida bajo el subtítulo del paso; queda solo “Paso X de 9 · Nombre” + subtítulo breve.
  - `src/app/features/empleados/components/form-empleado/form-empleado.html`
  - `src/app/features/empleados/components/form-empleado/form-empleado.css`
- **Footer estable**: el footer del wizard se mantiene al ancho completo del layout (spanning mapa + contenido) y vive dentro de `advanced-create-inner` para conservar eje y posición estable.
  - `src/app/features/empleados/components/form-empleado/form-empleado.html`
  - `src/app/features/empleados/components/form-empleado/form-empleado.css`
- **Alineación de header**: el header superior usa la misma grilla (270px + contenido) para alinear “Creación avanzada” con el mapa y “Volver” con el borde derecho del contenido/footer.
  - `src/app/features/empleados/components/form-empleado/form-empleado.css`
- **Footer estable por altura mínima del cuerpo**: el área central del wizard usa `minmax(..., 1fr)` con un mínimo común en desktop para reducir saltos visuales entre pasos cortos y largos (sin inflar cards internas).
  - `src/app/features/empleados/components/form-empleado/form-empleado.css`
- **Orden HTML corregido**: el footer del wizard se renderiza después del cuerpo (`advanced-wizard-layout`) y no antes del layout principal.
  - `src/app/features/empleados/components/form-empleado/form-empleado.html`
- **Referencia de alto (Paso 9)**: el mínimo común del cuerpo del wizard se alinea al `min-height` usado por los paneles de paso (incluye Resumen final) para que todos los pasos compartan el mismo marco vertical.
  - `src/app/features/empleados/components/form-empleado/form-empleado.css`
- **Scroll/foco al cambiar de paso**: al presionar Anterior/Siguiente el wizard sube al inicio útil del paso (header del paso) y en desktop enfoca el primer campo habilitado (en <=1024px no enfoca para evitar teclado).
  - `src/app/features/empleados/components/form-empleado/form-empleado.ts`

### 2026-04-30 (Creacion avanzada - ancho uniforme de grillas)

- **Grillas internas con el mismo ancho visual en Pasos 1 a 5**: se normalizo el ancho de los contenedores `grid` dentro de las cards para que los bloques no cambien de eje entre secciones; las proporciones de columnas se mantienen por tipo de campo.
  - `src/app/features/empleados/components/secciones/datos-personales/datos-personales.css`
  - `src/app/features/empleados/components/secciones/contrato/contrato.css`

### 2026-04-30 (Creacion avanzada - Paso 5 microajuste final)

- **Semana corrida mas compacta**: cuando el calculo esta inactivo, se muestra solo una nota muted breve y no se reserva encabezado/espacio para dias ocultos.
  - `src/app/features/empleados/components/secciones/contrato/contrato.html`
  - `src/app/features/empleados/components/secciones/contrato/contrato.css`
- **Errores de Zona extrema mas contenidos**: los mensajes de Territorio y Asignacion (%) se compactaron para no romper la grilla.
  - `src/app/features/empleados/components/secciones/contrato/contrato.html`

### 2026-04-30 (Creacion avanzada - Paso 6 prevision y salud)

- **Paso 6 alineado al patron del wizard**: se actualizo la bajada y la alerta informativa liviana para Prevision y salud, manteniendo el mismo eje visual de los pasos anteriores.
  - `src/app/features/empleados/components/form-empleado/form-empleado.{ts,html,css}`
- **Prevision y salud por bloques compactos**: Regimen previsional, AFP, IPS / Ex-Caja y Salud quedan con encabezados discretos, ayudas secundarias y grillas proporcionales sin cambiar bindings ni condiciones.
  - `src/app/features/empleados/components/secciones/prevision-salud/prevision-salud.{html,css}`
- **Responsive del Paso 6**: desktop usa campos principales mas anchos y monetarios compactos; tablet reorganiza a dos columnas y mobile apila a una columna sin reservar espacio para bloques que no aplican.
  - `src/app/features/empleados/components/secciones/prevision-salud/prevision-salud.css`
- **Orden visual de IPS y Salud**: IPS / Ex-Caja queda en dos filas proporcionales (Entidad + Ex-Caja, Regimen + Tasa) y Salud mantiene institucion protagonista con montos compactos.
  - `src/app/features/empleados/components/secciones/prevision-salud/prevision-salud.css`
- **Salud mas clara y responsive**: en desktop los cuatro campos quedan en una fila con Institucion como columna protagonista; en ancho intermedio Institucion ocupa fila completa y moneda/valores se reordenan sin vacios visuales.
  - `src/app/features/empleados/components/secciones/prevision-salud/prevision-salud.css`
- **Responsividad progresiva del Paso 6**: al disminuir ancho, AFP/IPS/Salud priorizan el campo principal en fila completa, luego agrupan secundarios en dos columnas y finalmente apilan todo a una columna para mantener orden y visibilidad.
  - `src/app/features/empleados/components/secciones/prevision-salud/prevision-salud.css`
- **Corte intermedio ampliado del Paso 6**: el modo de dos columnas legible se aplica desde 1380px hacia abajo para evitar compresion visual entre 1180px y 1380px.
  - `src/app/features/empleados/components/secciones/prevision-salud/prevision-salud.css`
- **Corte de seguridad responsive del Paso 6**: el apilado a una columna comienza antes del breakpoint general para evitar solapes entre 1075px y el cambio de layout del wizard.
  - `src/app/features/empleados/components/secciones/prevision-salud/prevision-salud.css`

### 2026-04-30 (Creacion avanzada - Paso 9 resumen final)

- **Resumen final como pantalla de cierre**: se ajusto la bajada del Paso 9, la alerta informativa y el texto de avance del mapa para evitar la contradiccion entre recorrido y pasos pendientes.
  - `src/app/features/empleados/components/form-empleado/form-empleado.{ts,html}`
- **Estado por etapa mas compacto y semantico**: las filas del checklist usan numero, descripcion breve, chip de estado y accion Revisar secundaria, manteniendo la navegacion existente.
  - `src/app/features/empleados/components/form-empleado/form-empleado.{html,css,ts}`
- **Resumen principal y footer alineados al patron del wizard**: la sintesis de Nombre, RUT/Pasaporte, Cargo y Sucursal queda en grilla compacta, con footer estable y accion final Finalizar alta.
  - `src/app/features/empleados/components/form-empleado/form-empleado.css`

### 2026-04-30 (Creacion avanzada - Paso 6 decision previsional)

- **Regimen previsional como decision principal**: el bloque inicial incorpora chip de estado para AFP, IPS, sin regimen o pendiente, con ayuda breve bajo el selector.
  - `src/app/features/empleados/components/secciones/prevision-salud/prevision-salud.{html,css,ts}`
- **AFP, IPS y sin prevision con contexto visual**: las cards condicionales explican el efecto sobre APVI y el estado sin prevision deja claro que no se solicitan AFP, IPS ni APVI.
  - `src/app/features/empleados/components/secciones/prevision-salud/prevision-salud.{html,css}`
- **Impacto APVI al cierre del Paso 6**: se agrego un bloque compacto que indica si el siguiente paso sera APVI, si queda opcional u omitido, o si el flujo continua con Bancario, sin cambiar navegacion ni validaciones.
  - `src/app/features/empleados/components/secciones/prevision-salud/prevision-salud.{html,css,ts}`

### 2026-04-30 (Creacion avanzada - Paso 6 reduccion de ruido)

- **Copy visible mas compacto**: el Paso 6 conserva una sola frase superior y elimina subtitulos/notas repetidas dentro de Regimen, AFP, IPS y Salud.
  - `src/app/features/empleados/components/form-empleado/form-empleado.{html,ts}`
  - `src/app/features/empleados/components/secciones/prevision-salud/prevision-salud.html`
- **Impacto APVI simplificado**: el bloque inferior muestra solo destino al continuar y estado APVI, sin explicaciones duplicadas ni cajas de ayuda permanentes.
  - `src/app/features/empleados/components/secciones/prevision-salud/prevision-salud.{html,css,ts}`

### 2026-04-30 (Creacion avanzada - Paso 6 estados sin acento lateral)

- **Estados contextuales sin barra izquierda**: los bloques Sin prevision, Salud sin datos e Impacto APVI reemplazan el acento lateral por borde suave, fondo neutro y chips internos.
  - `src/app/features/empleados/components/secciones/prevision-salud/prevision-salud.css`

### 2026-04-30 (Creacion avanzada - Mapa de ficha sin acento lateral)

- **Paso activo sin barra izquierda**: el item activo del Mapa de ficha deja de usar acento lateral y queda marcado con fondo azul suave, borde sobrio, marcador numerico y chip de estado.
  - `src/app/features/empleados/components/form-empleado/form-empleado.css`

### 2026-04-30 (Creacion avanzada - Mapa de ficha panel compacto)

- **Mapa lateral como lista sobria**: el Mapa de ficha pasa a panel blanco con borde, cabecera separada, resumen en chip y filas compactas sin linea vertical de timeline.
  - `src/app/features/empleados/components/form-empleado/form-empleado.css`

### 2026-04-30 (Creacion avanzada - eje global del wizard)

### 2026-05-02 (Empleados - estado operativo y aptitud)

- **Listado**: estado visual y accion principal derivados de `pasoAltaAvanzada`,
  `estadoFicha`, `aptoParaRemuneraciones` y estado operativo; `Borrador`
  prioriza **Continuar alta**, `En proceso` usa **Completar ficha** y activo no
  apto usa **Revisar pendientes**.
- **Ficha empleado**: panel superior compacto con estado de ficha, aptitud,
  pendientes principales y accion siguiente; el panel lateral reutiliza los
  pendientes calculados por el helper central.
- **Defaults tecnicos**: `DRAFT-*`, `Sin cargo`, sueldo base cero y datos
  bancarios sin valor real se muestran como pendientes operativos, no como datos
  reales.
  - `src/app/features/empleados/components/tabla-empleados/tabla-empleados.{html,ts,css}`
  - `src/app/features/empleados/containers/ficha-empleado-container/ficha-empleado-container.{html,ts,css}`

- **Footer en el marco padre del wizard**: el pie de Anterior / Siguiente / Finalizar alta se mueve al grid principal para compartir ancho con cabecera, mapa y contenido, manteniendose estable al cambiar de paso.
  - `src/app/features/empleados/components/form-empleado/form-empleado.{html,css}`
- **Layout flexible sin inflar cards internas**: el cuerpo central ocupa el espacio disponible y el footer queda en la fila final del wrapper avanzado, sin padding artificial en cards o campos.
  - `src/app/features/empleados/components/form-empleado/form-empleado.css`
- **Separacion superior contenida**: se reduce el gap entre la cabecera avanzada y el cuerpo del wizard para evitar una banda vacia entre ambos bloques.
  - `src/app/features/empleados/components/form-empleado/form-empleado.css`

### 2026-04-30 (Creacion basica — flujo dedicado y pie de pagina)

- **Diferenciacion clara vs avanzada**: titulo "Creacion basica", badge de modo **Básica**, subtitulo corto, callout compacto "Alta rapida" con **Resultado: ficha en proceso**, panel lateral informativo de pendientes (no mapa de 9 pasos), y **footer** al pie con copy + boton **Guardar ficha basica** (el guardado en header se unifica al pie como en el wizard avanzado).
- **Limpieza**: eliminado bloque muerto `isBasicMode()` dentro del contenido del wizard avanzado; modal de exito basico sin mensaje de "listo para liquidar" prematuro.
  - `src/app/features/empleados/components/form-empleado/form-empleado.{html,css,ts}`
- **Pruebas E2E**: `tests/empleados-basic-create.spec.ts` (aserciones + captura opcional `.basic-create-page`).

### 2026-04-30 (Creacion basica — solo formulario y CTA en cabecera)

- **Sin panel "Estado de la ficha"**: layout de una columna (callout + formulario). **Guardar ficha basica** de nuevo en **cabecera** junto a Volver (`headerVisibleActions` solo en modo basico).
- **Cabecera en grilla**: titulo/subtitilo alineados a la izquierda, botonera a la derecha; subtitulo sin mayusculas forzadas (anula herencia de `.summary-person p`). Sin `footer.editor-footer--basic`.
  - `src/app/features/empleados/components/form-empleado/form-empleado.{html,css,ts}`
  - `tests/empleados-basic-create.spec.ts`

### 2026-05-01 (Creacion basica — distribucion y resumen en fila)

- **Eje comun**: `basic-create-shell` + `basic-create-inner` (`max-width: min(68rem, 100%)`) alinean **cabecera**, **resumen** y **formulario**; la pagina ya no fuerza 80rem con contenido mas angosto.
- **Resumen en desktop**: `.basic-create-summary` en **dos columnas** (Alta rapida + Pendiente); en mobile una columna.
- **Pendiente compacto**: chips neutros (`.basic-create-pending-chip`), sin lista larga ni aspecto de error/wizard.
- **Contacto (modo basico)**: grilla de **dos columnas** `minmax(0,1.15fr) minmax(10.5rem,1fr)` y sin `span 2` en email para que **Telefono** no quede en un tercio del ancho.
  - `src/app/features/empleados/components/form-empleado/form-empleado.{html,css}`
  - `src/app/features/empleados/components/secciones/datos-personales/datos-personales.css`

### 2026-04-30 (Wizard avanzado — navegacion en cabecera del paso)

- **Anterior / Siguiente / Finalizar alta** en la zona superior derecha del **contenido del paso** (`.advanced-step-header`), alineados con kicker + descripcion; **Volver** sigue solo en el header global de "Creacion avanzada".
- **Sin duplicar**: eliminado `footer.advanced-wizard-footer` con los mismos botones; se conserva una **pista compacta** (`.advanced-step-hint`) bajo la fila principal.
- **Estabilidad visual**: ancho minimo del boton primario (`.advanced-step-nav-btn--primary`); grid responsive (max 720px) apila acciones bajo el titulo.
- **Scroll al paso**: `scrollToCurrentStepStart` usa `.advanced-step-header` y doble `requestAnimationFrame`; `selectWizardStep` tambien dispara scroll.
  - `src/app/features/empleados/components/form-empleado/form-empleado.{html,css,ts}`
  - `tests/empleados-wizard-stability.spec.ts` (offset de `.advanced-step-actions` respecto a `.advanced-wizard-content` + ancho del contenido)

### 2026-05-01 (Creacion basica — ajuste fino visual)

- **Callout**: titulo + texto breve; **resultado** como chip (`.basic-create-result-chip`); borde uniforme sin acento lateral grueso.
- **Textos secundarios**: leads mas cortos en identificacion, nombre y contacto (modo basico).
- **Evolucion**: el ancho `.basic-create-narrow` paso a **`basic-create-inner`** + resumen en fila (ver entrada **distribucion y resumen en fila** arriba).
  - `src/app/features/empleados/components/secciones/datos-personales/datos-personales.html`
  - `tests/empleados-basic-create.spec.ts`

### 2026-04-30 (Creacion basica — card unica de resumen superior)

- **Unificacion**: se eliminan las dos cards separadas (Alta rapida + Pendiente por completar) y se integra todo en **una** `.basic-create-summary-card` al mismo ancho que `.basic-create-inner`.
- **Estructura**: fila cabecera (titulo **Alta rapida de empleado** + chip estado **Ficha en proceso**), texto **Solo se guardan los datos minimos para abrir la ficha.**, fila **Pendiente desde la ficha:** con chips compactos (Contrato y organizacion, Jornada y remuneracion, Prevision y salud, Banco); sin texto tecnico **Resultado**, sin lista larga ni aspecto wizard.
- **Padding**: `14px 16px` en la card informativa; chip estado con estilo informativo (no error).
- **Archivos**: `src/app/features/empleados/components/form-empleado/form-empleado.{html,css}`, `tests/empleados-basic-create.spec.ts`.

### 2026-05-01 (Creacion avanzada — Guardar borrador en cabecera)

- **Acciones**: boton secundario **Guardar borrador** antes de **Volver** en cabecera avanzada; fila `.summary-actions--advanced` con `gap` 8px; mensaje breve `.advanced-draft-feedback` tras guardado (no toast global).
- **Archivos**: `src/app/features/empleados/components/form-empleado/form-empleado.{html,css}`.

### 2026-05-01 (Parametros del sistema — normalizacion visual de estado, unidades y grillas)

- **Estado del periodo**: banda compacta con chips **Sin datos / Cargado / Editando / Solo lectura** y “Acción sugerida” (Crear / Modificar / Guardar / Consultar) coherente con el periodo seleccionado.
  - `src/app/pages/parametros.page.ts`
- **Contradiccion resuelta**: pestañas editables ya no muestran “Editable” si el periodo no tiene datos; en su lugar muestran “Sin datos del periodo” con guia breve.
  - `src/app/pages/parametros.page.ts`
  - `src/app/features/parametros-generales/components/tabs/parametros-{valores,remuneraciones}-tab.component.ts`
- **Unidades**: UF/UTM/UTA ahora indican **CLP** (evita el `$` ambiguo).
  - `src/app/features/parametros-generales/components/tabs/parametros-valores-tab.component.ts`
- **Grillas (solo lectura)**: empty states con copy mas contextual (sin inflar layout) y filtros de periodo/vigencia con placeholder coherente.
  - `src/app/features/parametros-generales/components/tabs/parametros-{tramos-carga,tramos-renta,salud,afp,reforma}-tab.component.ts`
- **CCAF y mutual**: configuracion con ancho contenido (`max-width`) para evitar panel vacio cuando hay pocos campos.
  - `src/app/features/parametros-generales/components/tabs/parametros-ccaf-mutuales-tab.component.ts`

### 2026-04-30 (Creacion basica — compactacion card resumen y panel)

- **Card resumen**: padding `12px 16px`; menos espacio entre titulo, lead, separador y pendientes (`margin`/`padding` en 6–8px); cabecera con **align-items: baseline** y chip un poco mas bajo en altura (`padding` vertical 2px) para alinear con el titulo sin sensacion flotante.
- **Stack**: `gap` entre resumen y formulario de 12px a **8px** (token).
- **Panel blanco**: `.basic-create-form .step-panel.step-panel--basic.basic-wizard` con **padding 12px** (override del 16px global del paso) solo en modo basico.
- **Archivo**: `src/app/features/empleados/components/form-empleado/form-empleado.css`.

<!-- UX-COMERCIAL-01-ESTILOS -->

## 2026-05-10 - UX-COMERCIAL-01 base de redisenio comercial

- Se prepara la fase UX para redisenar la experiencia visible luego del hito funcional validado hasta liquidaciones oficiales internas.
- Pantallas objetivo: sidebar/menu Remuneraciones, Preparar nomina y Liquidaciones oficiales.
- Patron visual documentado: header operativo, resumen ejecutivo, siguiente accion, bloqueos/advertencias, contenido principal y trazabilidad secundaria.
- Restricciones: no tocar SQL/RPC/RLS, formulas, motor, Previred, LRE, banco, contabilidad, PDF, firma ni envio.
- Deuda prioritaria: reemplazar `window.confirm` temporal por modal/MsgBox estandar.

## 2026-05-10 - UX-COMERCIAL-01 implementacion visible

- **Sidebar Remuneraciones**: menu agrupado por dominio, con Preparar nomina y Liquidaciones oficiales como recorrido principal y microcopy operativo.
- **Preparar nomina**: header operativo con breadcrumb y copy menos tecnico para salidas futuras.
- **Liquidaciones oficiales**: resumen ejecutivo, siguiente accion, bloqueos/advertencias/informacion, contenido principal y trazabilidad secundaria colapsable.
- **Confirmacion**: generacion de liquidaciones oficiales usa `app-message-box` modal en vez de `window.confirm`.
- **Alcance respetado**: sin cambios SQL/RPC/RLS, formulas legales ni motor de calculo.

## 2026-05-10 - UX-COMERCIAL-01 V4 usabilidad T00-T09

- **Dashboard**: sin KPIs demo ni salidas externas activas; muestra flujo operativo real, siguiente accion y capacidades futuras separadas.
- **Reportes**: se convierte en consulta operativa con enlaces a vistas disponibles; reportes formales quedan marcados como fase posterior.
- **Preparar nomina**: se agrega avance del cierre mensual de 6 pasos, manteniendo resumen ejecutivo y siguiente accion.
- **Detalle liquidacion**: empty state con motivo, CTA a Liquidaciones oficiales y CTA a Preparar nomina.
- **Movimientos/asignaciones**: empty states orientados a impacto en nomina y motivo visible cuando una accion depende de seleccionar trabajador.
- **Restriccion**: no se implementan ni activan Previred, LRE, banco, contabilidad, PDF, firma ni envio.

## 2026-05-10 - UX-QA-01-FIX V5 - Tabs, collapsables y densidad

- **Dashboard**: se agrega status strip compacto, quick links bajos para navegacion y salidas futuras en disclosure/lista compacta.
- **Preparar nomina**: timeline de 6 pasos pasa a formato compacto, con metricas de resumen mas densas.
- **Liquidaciones oficiales**: estado no disponible compacto, ocultamiento de resumen sin datos y empty state reducido para trabajadores.
- **Reportes**: tabbar real `Disponibles / No disponible en esta fase`, con lista futura compacta y sin acciones externas activas.
- **Detalle liquidacion**: empty state reducido, manteniendo CTA primario y nota tecnica secundaria.
- **Asignaciones recurrentes**: ayuda contextual pasa a collapsable y empty state agrega accion secundaria compacta.
- **Restricciones**: sin SQL/RPC/RLS/BD, sin formulas/motor, sin PDF/firma/envio, sin Previred/LRE/banco/contabilidad.

## 2026-05-10 - UX-PREP-NOM-MAQUETACION-REAL-02

- **Preparar nomina**: la accion siguiente queda como primer bloque operativo, con un unico CTA principal derivado de `validacionCalculo().siguienteAccion`.
- **Workspace**: se agrega layout superior de dos columnas con avance del cierre a la izquierda y pendientes/alertas/accesos rapidos a la derecha.
- **Densidad**: el resumen se reduce a indicadores operativos y el alcance explicativo pasa a disclosure secundario.
- **Detalle operativo**: Base, calculo preliminar, guardado, aprobacion y cierre interno quedan agrupados debajo de la decision principal.
- **Restricciones**: sin SQL/RPC/RLS/BD, sin formulas/motor, sin Previred/LRE/banco/contabilidad/PDF/firma/envio.

## 2026-05-10 - UX-PREP-NOM-ORDEN-GUIADO-04

- **Preparar nomina**: se ordena como flujo guiado del periodo: accion recomendada, avance compacto, resumen minimo y panel derecho de pendientes.
- **Panel derecho**: antes de validar ya no muestra falsos "sin bloqueos"; presenta pendiente de validacion y alcance de revision.
- **Detalle operativo**: las etapas quedan en disclosures por estado (base, calculo/resultado, guardado, aprobacion, cierre/liquidaciones) para evitar mostrar todo abierto.
- **Restricciones**: solo maquetacion UI; sin SQL/RPC/RLS/BD, sin formulas/motor, sin activar Previred/LRE/banco/contabilidad/PDF/firma/envio.

## 2026-05-10 - UX-PREP-NOM-USABILIDAD-DISTRIBUCION

- **Preparar nomina**: se elimina markup duplicado oculto y se reduce competencia entre el boton de header y la accion principal.
- **Detalle operativo**: se agrega indice lateral de etapas con estado y descripcion breve, dejando el contenido largo en una columna principal.
- **Responsive**: el indice de etapas pasa a grilla compacta en tablet y a una columna en mobile.
- **Restricciones**: solo distribucion/maquetacion; sin cambios de motor, persistencia, formulas, SQL, RPC ni salidas externas.

## 2026-05-10 - NOM-UX-STATE-01

- **Preparar nomina**: se centraliza el guiado operativo por estado en una regla pura de UI dentro de `features/nomina-mensual/rules`.
- **Accion principal**: el CTA superior ahora deriva de la matriz de estado del periodo, evitando invitar a guardar si hay bloqueos.
- **Panel derecho y avance**: `Que falta ahora`, timeline e indice lateral consumen el mismo modelo de estado operativo.
- **Restricciones**: sin motor, formulas, SQL/RPC/RLS, BD, liquidaciones oficiales nuevas, cierre operativo nuevo ni salidas externas.

## 2026-05-11 - EMP-ADV-VALIDATION-CL-02 MsgBox para validaciones chilenas

- **Creacion avanzada**: se elimina el enfoque de tarjeta fija de validacion por paso; la pantalla queda limpia y el mapa de ficha sigue siendo el resumen permanente.
- **Siguiente**: si hay pendientes del paso, se usa `app-message-box` modal con resumen de bloqueos/advertencias y acciones `Corregir ahora` / `Continuar`.
- **Guardar borrador**: validacion minima y confirmacion de exito pasan por MsgBox, evitando texto suelto en la pantalla.
- **Finalizar alta**: los bloqueos legales/operativos se presentan en MsgBox; el usuario decide ir al primer pendiente.
- **Diseño**: `Guardar borrador` conserva azul suave como accion secundaria importante; primarios solidos se reservan para avanzar/finalizar.
- **Restricciones**: sin cambios SQL, motor, mappers, payloads ni flujos externos.

## 2026-05-11 - EMP-ADV-MSGCOPY-01 Copy administrativo de MsgBox

- **Creación avanzada**: se ajusta el lenguaje de los MsgBox para que suene administrativo y orientado a RRHH.
- **Acciones**: `Continuar de todos modos` pasa a `Continuar`; `Ir al primer bloqueo` pasa a `Ir al primer pendiente`.
- **Listados**: los detalles del modal usan guion visual, frases completas y punto final.
- **Secciones**: `Bloqueos` cambia a `Datos obligatorios pendientes`, `Advertencias` a `Advertencias de revisión` e `Información` a `Información útil`.
- **Copy visible**: no usar punto y coma en mensajes visibles del usuario. Separar ideas en frases cortas.
- **Restricciones**: sin cambios de lógica de guardado, payloads, SQL, motor, ficha empleado ni creación básica.

## 2026-05-12 - EMP-PERFIL-LABORAL-UI-01

- **Creacion avanzada**: el paso 4 incorpora bloque `Perfil laboral y previsional` con card de perfil detectado, nota de regla de captura, grilla de condiciones especiales y panel de vigencia/respaldo.
- **Tipografia/espaciado**: estilos locales del nuevo componente usan `--erp-font-sans`, radios, bordes y densidad coherentes con la maqueta existente.
- **Resumen final**: agrega filas compactas de perfil laboral y condiciones especiales sin duplicar informacion tecnica.
- **Restricciones**: sin estilos globales, sin fuentes nuevas, sin cambios visuales fuera de Creacion avanzada.



## 2026-05-12 - EMP-PERFIL-LABORAL-UI-01-POLISH

- **Creacion avanzada**: `Perfil laboral y condiciones` pasa a etapa propia despues de Banco y antes de Resumen final, evitando que la informacion quede flotando dentro de asignaciones.
- **Asignaciones laborales**: el paso vuelve a enfocarse solo en cargas familiares, zona extrema y semana corrida.
- **Componente perfil laboral**: bloques locales alineados a Contrato/Bancario: cabecera gris clara, borde 8px, densidad compacta, sin sombras ni radios grandes.
- **Vigencia/respaldo**: panel bajo demanda; aparece solo al seleccionar condiciones especiales.
- **Restricciones**: sin estilos globales, sin fuentes nuevas, sin SQL, sin persistencia nueva y sin cambios a Honorarios.

## 2026-05-12 - EMP-CONDICIONES-ESPECIALES-UX-01

- **Creacion avanzada**: el paso se comunica como `Condiciones especiales`, no como formulario tecnico de perfil laboral.
- **Revision administrativa**: primera tarjeta con situacion detectada, tipo de relacion, edad al ingreso y referencia.
- **Uso RRHH**: grilla de condiciones con chip `Solo si aplica`; trabajador estandar puede continuar sin marcar nada.
- **Estado sin seleccion**: empty state contextual (`Trabajador estandar`, `Revision pendiente` o revision sugerida) para que la informacion no quede flotando.
- **Resumen final**: fila `Revision administrativa` y `Condiciones especiales` como lectura compacta.
- **Restricciones**: solo copy/maquetacion local; sin estilos globales, SQL/RPC/RLS, persistencia nueva, motor, nomina ni cambios a Honorarios.

## 2026-05-12 - EMP-CONDICIONES-ESPECIALES-AUTODETECT-01

- **Creacion avanzada / Condiciones especiales**: se agrega bloque compacto `pre-marcado desde pasos anteriores` cuando hay condiciones detectadas por edad o regimen previsional.
- **Cards de condicion**: se agrega chip local `Detectada` y razon breve para distinguir sugerencia automatica de declaracion manual, sin cambiar estilos globales.
- **Patron UX**: autodeteccion asistida con revision RRHH; el sistema pre-marca lo evidente, pero mantiene respaldo y correccion manual antes de finalizar.

## 2026-05-13 - EMP-ALTA-REGLAS-COHERENCIA-01

- **Creacion avanzada**: se agrega aviso inline compacto `Revision asistida` cuando el paso actual tiene una incoherencia laboral/previsional corregible.
- **Resumen final**: se agrega bloque `Coherencia administrativa` con tres tarjetas compactas: Seguro de Cesantia, Jornada y Prevision.
- **MessageBox**: las decisiones de coherencia usan `app-message-box` modal con accion recomendada y opcion de mantener bajo revision, sin bloquear el flujo por defecto.
- **Estilo**: solo CSS local de `form-empleado.css`, usando borde simple, radio 8px y colores warning existentes. Sin estilos globales ni fuentes nuevas.


## 2026-05-13 - EMP-TIPO-TRABAJADOR-FLOW-01

- **Creacion avanzada / Contrato**: `Tipo trabajador` se muestra como dato derivado con chip `Derivado`, no como seleccion manual.
- **Flujo**: `Contrato` sincroniza `DEPENDIENTE`; `Boleta de honorarios` sincroniza `INDEPENDIENTE`.
- **Condiciones especiales**: pensionado, invalidez, tecnico extranjero y discapacidad quedan como declaracion RRHH en el paso `Condiciones especiales`.
- **Restricciones**: solo logica/UI local de alta avanzada; sin estilos globales, SQL/RPC/RLS, motor, nomina ni ficha empleado.

## 2026-05-14 - EMP-ALTA-COHERENCIA-GLOBAL-01

- **Creación avanzada**: se agrega bloque compacto `Matriz de aplicabilidad` en Resumen final.
- **Diseño**: usa card local neutra, borde 8px, chip compacto y grilla responsive; no introduce paleta nueva ni estilos globales.
- **Separación conceptual**: `Matriz de aplicabilidad` explica qué aplica/no aplica/deriva/requiere revisión; `Coherencia administrativa` conserva las advertencias y decisiones RRHH.
- **Restricciones**: sin cambios SQL/RPC/RLS, sin motor, sin nómina, sin ficha empleado, sin creación básica y sin persistencia final de honorarios.


## 2026-05-14 - EMP-ALTA-DIAGNOSTICO-CONTRACTUAL-UX-01

- **Creación avanzada / Resumen final**: `Matriz de aplicabilidad` pasa a `Diagnóstico contractual`, con `Caso detectado` y copy administrativo para RRHH.
- **Estilo**: se elimina `border-left` decorativo fuerte en diagnóstico/coherencia; se mantienen fondos suaves de información/advertencia y bordes completos locales.
- **Condiciones especiales**: la razón de condición detectada deja de usar barra lateral azul y pasa a bloque compacto con fondo informativo suave.
- **Restricciones**: sin estilos globales, sin fuentes nuevas, sin SQL/RPC/RLS, sin motor, sin nómina ni ficha empleado.


## 2026-05-14 - EMP-ALTA-MSGBOX-ERROR-UX-01

- **MessageBox de error**: el modal de error de guardado usa el mismo patrón del éxito (`modalHeadlineSplit`, panel de detalle y bloque de referencia).
- **Copy administrativo**: los errores conocidos se presentan como `Qué revisar`, `Acción recomendada` y `Paso sugerido`, evitando textos técnicos planos.
- **Sin previsión**: el mensaje orienta a revisar `Previsión y salud` y seleccionar AFP o IPS cuando el trabajador quedará habilitado para remuneraciones.
- **Estilo**: paneles con borde completo, fondo suave y radio local; sin `border-left` decorativo fuerte ni estilos globales.

## 2026-05-15 - ERP-AUDIT-REPAIR-UX-01

- **Modulo:** Nomina mensual / Preparar nomina.
- **Cambio:** las confirmaciones criticas de guardar resultado preliminar, aprobar resultado y cerrar nomina dejan de usar `window.confirm` y pasan a `app-message-box` modal.
- **UX:** el modal muestra motivo, alcance, puntos de revision RRHH y acciones claras; cancelar no persiste cambios.
- **Estilo:** CSS local compacto con borde completo neutro, fondo suave y radio 6px; sin barras laterales decorativas, sin estilos globales.
- **Restricciones:** sin SQL/RPC/RLS, sin motor, sin cambios en liquidaciones oficiales ni configuracion Angular/Tailwind/PostCSS.

## EMP-ADV-BITACORA-LABORAL-UX-01 - Identidad visual local de Bitácora Laboral

Fecha: 2026-05-15

Creación avanzada incorpora una identidad de producto local para dejar de sentirse como wizard genérico:

- El flujo se comunica como `Bitácora laboral`, no como lista técnica de pasos.
- Mapa lateral agrupado por sentido: Identidad, Relación laboral, Pago y previsión, Revisión.
- Numeración de registros `01` a `10` para reforzar expediente laboral.
- Estados visibles más humanos: `En edición`, `Listo`, `Requiere datos`, `Revisar`, `Solo si aplica`, `No requerido`.
- Header de paso con tipo de registro y título separado.
- APVI no requerido/opcional se muestra como decisión del sistema con siguiente acción.
- Cierre como `Acta de revisión de la ficha` y `Registros de la bitácora`.
- Se mantiene system-ui/`--erp-font-sans`; sin Google Fonts, sin estilos globales, sin `border-left` fuerte y sin sombras decorativas.
## 2026-05-15 - ERP-NOIA-BITACORA-OPERATIVA-00

- **Identidad global:** el ERP adopta la lectura `NOIA / Bitacora Operativa`: sobrio, administrativo, humano, trazable y orientado al cierre del periodo.
- **Regla visual:** evitar estetica SaaS generica, hero cards, gradientes decorativos, sombras fuertes, paletas monotono azul/morado y textos comerciales en pantallas operativas.
- **Gramatica:** cada pantalla debe mostrar contexto, estado, registros, decisiones, alertas con accion y cierre operativo.
- **Modulos:** Empleados = registro laboral; Nomina = bitacora del periodo; Movimientos = registros remuneracionales; Parametros = registro normativo; Liquidaciones = acta de salida.
- **Restricciones:** fase documental; sin Angular, HTML, CSS, SQL/RPC/RLS, rutas, servicios, motor, estilos globales ni cambios funcionales.

## 2026-05-15 - ERP-SHELL-BITACORA-OPERATIVA-01

- **Shell global:** sidebar, header y contenedor principal adoptan lectura `Bitacora operativa`, con fondo administrativo plano y navegacion agrupada por sentido.
- **Componentes base:** cards, botones, badges, titulos, breadcrumbs, DataGrid, SearchSelect y MessageBox se alinean a NOIA con bordes completos, densidad compacta y color funcional.
- **Tablas y empty states:** DataGrid usa filtros sobrios, seleccion sin barra lateral fuerte y estados vacios con causa visible y accion siguiente.
- **Restricciones:** sin SQL/RPC/RLS, sin motor, sin servicios de negocio, sin mappers, sin fuentes nuevas y sin unificar movimientos.
