# Parámetros - período activo, vigencia y catálogos

Fecha de revisión Codex: 2026-05-01.

## Regla general

**El período activo (YYYY-MM) es contexto visual y de negocio para liquidación, pero no es un filtro obligatorio para todas las tablas de Parámetros.**  
Algunas grillas listan **catálogos normativos por vigencia** (solape con el mes), **catálogos globales** (`periodo` NULL) o **snapshots mensuales** (`periodo` obligatorio). La UI debe distinguir el mensaje vacío y el hint según el tipo de dato.

Un periodo puede existir en estado `parcial` cuando fue preparado al inicio de mes con catalogos, vigencias y normativa base, pero aun no tiene los snapshots mensuales oficiales. `parcial` no significa completo y no debe habilitar liquidacion definitiva si faltan datos mensuales obligatorios.

Referencias de implementación:

- Repositorio: `src/app/features/parametros-generales/data-access/parametros-generales.repository.ts` (`listar`, `listarCatalogos`, helpers `applyVigenciaSolapaPeriodo`, `applyPeriodoMesOGlobalSolapa`, `catalogoGlobalOPeriodo`).
- Esquema v11: `bd/base/v11/partes/02_tablas.sql`.
- Carga normativa / mensual: `Python/02_normativa_base_v611.py`, `Python/04_render_parametros_mensuales_v611_sql_full.py` (y salida bajo `Python/runs/...`).

## Tipos de vigencia (clasificación oficial)

| Tipo | Definición | Uso típico en UI |
|------|------------|------------------|
| **PERIODO_MENSUAL** | Filas cuya clave natural incluye `periodo` YYYY-MM (snapshot del mes). | Empty state: “no hay datos cargados para {mes}”; acción: crear parámetros / carga mensual. |
| **ANUAL** | Conjunto normativo tributario o de renta **identificado por año** (sin filas por cada mes del año). | Empty state por **año** del período activo, no por “2026-05” si el dato no es mensual. *(En v11 actual no hay tablas de Parámetros consumidas por la UI puramente “anuales” sin mes; ver nota de impuesto único.)* |
| **VIGENCIA** | Filas versionadas por `vigencia_inicio` / `vigencia_fin` (y a veces `periodo` opcional de alineación). El mes activo **solapa** vigencias. | Hint: “vigentes al período activo”; empty: “sin registros vigentes para el período activo” (no implica catálogo vacío). |
| **CATALOGO_GLOBAL** | Catálogo sin dependencia real del mes; en BD puede tener `periodo` NULL o filas marcadas por mes solo por trazabilidad. | Hint: “catálogo general”; empty: no culpar al “2026-05” si el catálogo está vacío en absoluto. |
| **CONFIG_EMPRESA** | Preferencias de la empresa (CCAF, mutual, etc.) que se guardan en el **snapshot** `parametros_generales` del mes o en tablas `empresa_*` fuera de este módulo. | Mensaje: “configuración aplicable al período activo” cuando el dato es mensual; si fuera solo vigencia, usar reglas de **VIGENCIA**. |

### Nota: impuesto único (`tabla_impuesto_unico`)

La tabla se versiona por **`vigencia_inicio` / `vigencia_fin`**, pero expone `periodo` **generado** como `YYYY-MM` del mes de `vigencia_inicio`. Para la UI y el repositorio se comporta como **PERIODO_MENSUAL** (filtro estricto por mes), no como “tabla anual única”.

## Tabla de diagnóstico (Parámetros - tablas y catálogos)

Columnas: **tabla** · **módulo/tab** · **tipo** · **campo período** · **campos vigencia** · **¿depende del período activo?** · **UI** · **fuente** · **observaciones** · **riesgo actual**

| tabla | módulo/tab | tipo | campo período | vigencia | depende período activo | cómo mostrar en UI | fuente | observaciones | riesgo actual |
|-------|------------|------|-----------------|----------|------------------------|--------------------|--------|----------------|---------------|
| `parametros_generales` | Parámetros > Valores / Remuneraciones (formulario) | PERIODO_MENSUAL | `periodo` PK | - | sí (carga/edición por mes) | “Datos cargados para {mes}.” / vacío: “No hay parámetros cargados para {YYYY-MM}.” | Python (`parametros_generales_compat`) + edición UI | Snapshot denormalizado; comentario en `02_tablas.sql`. | Mostrar “sin mes” si no existe fila; OK. |
| `tramo_carga` | Parámetros > Tramos cargas familiares | PERIODO_MENSUAL | `periodo` NOT NULL | - | sí | Mensual estricto; vacío por mes. | Python (`tramo_carga`) | Tramos por mes. | Riesgo bajo si copy dice “mensual”. |
| `tramo_impuesto` | Parámetros > Impuesto único > Tramos | PERIODO_MENSUAL | `periodo` NOT NULL | - | sí | Mensual estricto. | Python (`tramo_impuesto_compat`) | Compat mensual con tramos históricos. | Riesgo bajo. |
| `tabla_impuesto_unico` | Parámetros > Impuesto único > Tabla | PERIODO_MENSUAL (vigencia subyacente) | `periodo` GENERATED | `vigencia_inicio`, `vigencia_fin` | sí (filtro por `periodo` = mes) | Hint: tabla versionada; **filtro mostrado como mes** derivado de vigencia. | Python (`tabla_impuesto_unico`) | `periodo` es mes de inicio de vigencia, no “libre”. | Confundir con “anual” si solo se mira el año. |
| `parametros_legales` | Hidrata campos en Valores/Remuneraciones; grilla en Reforma > Legales | VIGENCIA (+ `periodo` opcional) | `periodo` nullable | `vigencia_inicio`, `vigencia_fin` | sí (solape + hidrata por `YYYY-MM-01`) | Lista por solape; vacío = sin ley vigente al mes. | Python (`parametros_legales`) + seed | `listar` catálogo usa `applyPeriodoMesOGlobalSolapa`; hidrata con `listarParametrosLegalesPorVigencia`. | Tratar como “solo mensual” omitiría vigencias globales. |
| `afc_parametro` | Remuneraciones (AFC) vía hidrata | VIGENCIA (+ `periodo` opcional) | `periodo` nullable | `vigencia_inicio`, `vigencia_fin` | sí (solape; upsert también por vigencia/mes) | Vigencia por tipo de contrato; período activo elige fila. | Python (`afc_parametro`) | `uq_afc_parametro` por `(codigo_tipo_contrato, vigencia_inicio)`. | Riesgo: copy “mensual” si en realidad es tramo vigente. |
| `afp` | Parámetros > Previsión (grilla AFP) | VIGENCIA (+ `periodo` opcional) | `periodo` nullable | `vigencia_inicio`, `vigencia_fin` | sí (solape; incluye `periodo` del mes o NULL) | Hint: catálogo con vigencias; mes resalta/aplica solape. | Seed / manual + posibles cargas | Tasas también modeladas en `afp_vigencia` (ver fila siguiente). | Riesgo medio: mezcla `afp` “plana” vs `afp_vigencia` si se duplica lógica. |
| `afp_vigencia` | (No expuesto hoy en UI de Parámetros; usado en carga) | VIGENCIA | - | `vigencia_inicio`, `vigencia_fin` | no en UI actual | N/A en UI actual | Python (`afp_vigencia_updates`) | Updates puntuales SIS/tope en carga mensual. | Desalineación UI (`afp`) vs cálculo si solo una fuente se actualiza. |
| `salud` | Parámetros > Salud (ISAPRE e instituciones) | VIGENCIA (+ `periodo` opcional) | `periodo` nullable | `vigencia_inicio`, `vigencia_fin` | sí | ISAPRE: solo solape vigencia; Instituciones: solape + filas `periodo` NULL o del mes. | Seed / manual + carga | `listarIsapres` �  `listarSaludInstituciones` (filtros distintos). | Riesgo medio si empty state habla de “mes” como si fuera snapshot mensual único. |
| `salud_plan` | (No listado aún en `listarCatalogos`) | VIGENCIA | - | `vigencia_inicio`, `vigencia_fin` | - | Si se expone: reglas de VIGENCIA | seed | Planes por institución. | Pendiente de producto/UI. |
| `trabajo_pesado_parametro` | Reforma > Trabajos pesados | **Híbrido**: `periodo` NOT NULL **y** vigencia | `periodo` NOT NULL | `vigencia_inicio`, `vigencia_fin` | sí | Hint: filas cargadas por **mes** con vigencia; vacío puede ser “sin filas para el mes” aunque existan otros meses. | Python (`trabajo_pesado` en normativa + mes) | UI lista con `applyVigenciaSolapaPeriodo` (no exige `periodo` en query de catálogo). | Riesgo: empty state genérico “período” sin aclarar doble dimensión. |
| `reforma_previsional_parametro` | Reforma > Aportes previsionales (gradualidad 8,5 %…) | VIGENCIA (+ `periodo` opcional) | `periodo` nullable | `vigencia_inicio`, `vigencia_fin` | sí (solape; estado UI por mes) | **Gradualidad por vigencia**; período activo solo resalta tramo aplicable. | Python normativo + render mensual | Ver también [`reforma-gradualidad.md`](./reforma-gradualidad.md). | Riesgo: tratarlo como “fila mensual duplicada” en copy o carga. |
| `ley_16744_parametros` | CCAF/Mutuales > Ley 16.744 | PERIODO_MENSUAL (+ vigencia en fila) | `periodo` NOT NULL | `vigencia_inicio`, `vigencia_fin` | sí (`.eq('periodo', periodo)`) | Mensual estricto por `periodo`; vigencia audita validez intrames. | Python (`ley_16744_parametros`) | Aunque tenga vigencia, el listado UI es por mes seleccionado. | Riesgo: confundir con catálogo global. |
| `organismo_administrador_ley_16744` | CCAF/Mutuales > Mutuales (lista) | CATALOGO_GLOBAL (con `periodo` opcional) | `periodo` nullable | - (solo `vigente`) | no (solo `catalogoGlobalOPeriodo`) | Catálogo; mes solo acota filas marcadas por mes si existieran. | Python normativo (`organismo_administrador_ley_16744`) | Mutuales como maestro. | Riesgo alto si empty culpa al “2026-05”. |
| `ccaf_entidad` | CCAF/Mutuales > Cajas | CATALOGO_GLOBAL (con `periodo` opcional) | `periodo` nullable | - | no | Igual que organismos. | Python normativo (`ccaf_entidad`) | CCAF como maestro. | Riesgo alto si empty culpa al “2026-05”. |
| `institucion_apv` | Reforma > APV inst. | CATALOGO_GLOBAL (con `periodo` opcional) | `periodo` nullable | - | no | Catálogo APV. | Python normativo (`institucion_apv`) | Listado select acotado en repo. | Riesgo alto si empty culpa al “2026-05”. |
| `forma_pago_apv` | Reforma > APV pago | CATALOGO_GLOBAL (con `periodo` opcional) | `periodo` nullable | - | no | Catálogo formas de pago. | Python normativo (`forma_pago_apv`) | Ídem. | Riesgo alto si empty culpa al “2026-05”. |
| `ips_ex_caja_tasa_basica` | (No en UI Parámetros; carga relacionada) | VIGENCIA | - | `vigencia_inicio`, `vigencia_fin` | - | N/A | Python (`ips_tasa_basica`) | Tasas ex caja; ver render SQL. | Pendiente de exposición UI. |
| `periodo_remuneracion` | Contexto de carga (no pantalla Parámetros) | PERIODO_MENSUAL | `codigo` / `anio`,`mes` | fechas | sí (pipeline) | N/A en UI | Python (encabezado de carga) | Ancla del JSON mensual. | - |

### Estados de carga del periodo

La tabla `periodo_remuneracion` usa la columna existente `estado VARCHAR(20)`; no hay enum dedicado en v11.

Decision consolidada: `periodo_remuneracion.estado` es la fuente principal del estado mensual que muestra Parametros. La UI solo puede inferir un estado por tablas dispersas como fallback cuando no existe fila en `periodo_remuneracion` para el periodo seleccionado, por compatibilidad con datos antiguos o entornos incompletos. Si existe fila oficial, manda ese valor.

Estados operativos:

- `pendiente`: periodo creado, sin base suficiente o sin preparacion ejecutada.
- `parcial`: periodo preparado con catalogos/vigencias/normativa; faltan datos mensuales oficiales.
- `cargado`: carga mensual oficial validada y renderizada.
- `corregido`: carga mensual corregida/versionada.
- `cerrado`: periodo no debe degradarse automaticamente por preparaciones posteriores.
- `error`: falla registrada en el flujo de carga.

Reglas de transicion:

- `--modo preparar` deja `parcial` y no degrada `cerrado` ni `corregido`.
- `--modo mensual` deja `cargado` cuando las secciones mensuales obligatorias validan.
- La preparacion parcial no inserta UF/UTM/UTA, tramos, topes ni sueldos minimos sin fuente mensual oficial.

Validacion BD:

- `bd/base/v11/partes/90_validaciones_v11.sql` reporta estados invalidos, periodos `cargado`/`corregido`/`cerrado` sin mensuales minimos y mensuales sin fila en `periodo_remuneracion`.
- El script es no destructivo: solo consulta y reporta filas a revisar.

### Gradualidad cotización empleador (8,5 %)

- **Tipo normativo: VIGENCIA** (tramos con `vigencia_inicio` / `vigencia_fin`), alineado a devengo - ver `reforma-pensiones-gradualidad.md`.
- **Campos**: distribución en columnas extendidas (`cotizacion_rentabilidad_protegida`, `seguro_social_sis_cev`, etc.); `fapp_seguro_social` como compat/suma según esa guía.
- **Período activo**: solo para **destacar** tramo aplicable (`Vigente para el periodo` / futuro / histórico en UI de gradualidad).

## Reglas UI por tipo (copy)

Resumen aplicado en hints / empty states de tabs (`parametros-*-tab.component.ts`):

1. **PERIODO_MENSUAL** - “Datos cargados para {mes}.” / vacío: “No hay … cargados para el período {YYYY-MM}.” + carga mensual / crear parámetros.
2. **ANUAL** - Mensajes por año del período activo (si en el futuro hay tablas puramente anuales en esta pantalla).
3. **VIGENCIA** - “Vigentes al período activo {YYYY-MM}.” / vacío: “No hay registros vigentes para el período activo.”
4. **CATALOGO_GLOBAL** - “Catálogo general (no depende del mes salvo marcas opcionales en `periodo`).” / vacío: “Sin registros en catálogo.” **Sin** “para 2026-05”.
5. **CONFIG_EMPRESA** - “Configuración aplicable al período activo.” cuando el valor vive en el snapshot mensual.

## Reglas para Python (`02` / `04`)

| Categoría | Qué hace hoy | Tablas / claves |
|-----------|----------------|------------------|
| **Datos mensuales** | Upsert/replace por `periodo` YYYY-MM del período de remuneración | `parametros_generales`, `tramo_carga`, `tramo_impuesto`, `ley_16744_parametros`, `trabajo_pesado_parametro` (incluye `periodo`), inserts de `periodo_remuneracion` |
| **Datos por vigencia** | Comparación normativa y merge por `vigencia_inicio` / solapes | `parametros_legales`, `afc_parametro`, `tabla_impuesto_unico`, `reforma_previsional_parametro`, partes de `trabajo_pesado_parametro` |
| **Catálogos globales / maestros** | Comparación por código; **no** se tratan como “faltantes del mes” | `organismo_administrador_ley_16744`, `ccaf_entidad`, `institucion_apv`, `forma_pago_apv` |
| **Seeds normativos** | `02_normativa_base_v611.py` arma `normativa_base` consumida por render | Ver comentarios “maestros” en `02_normativa_base_v611.py` |
| **Pendientes / revisar** | Evitar duplicar “mensual” en copy cuando la dimensión real es vigencia; revisar si `afp` vs `afp_vigencia` deben converger en UI | Documentar decisiones de producto |

## Reglas para DataGrid (Parámetros)

| Situación | Columnas visibles recomendadas | Resaltado |
|-----------|----------------------------------|-----------|
| PERIODO_MENSUAL | Mostrar `periodo` | - |
| VIGENCIA | `vigencia_inicio`, `vigencia_fin`, opcional `periodo` si existe | Marcar fila cuyo rango solapa el mes activo (lógica ya descrita para gradualidad). |
| CATALOGO_GLOBAL | `codigo`, `nombre`, `vigente`; `periodo` solo si aplica trazabilidad | No usar “sin datos del período”. |
| CONFIG_EMPRESA | Depende del origen (snapshot vs `empresa_*`) | En esta pantalla: referir al período activo. |

## Pendientes detectados

1. **Exponer `afp_vigencia` / `salud_plan` en UI** o documentar explícitamente que la grilla usa solo `afp` / `salud` plana.
2. **`trabajo_pesado_parametro`**: clarificar en producto si la dimensión principal es el **mes** (`periodo`) o la **vigencia** (para mensajes y filtros).
3. **Catálogos con `periodo` opcional**: si en datos reales aparecen filas solo con `periodo` = mes y sin NULL, revisar semántica (¿deberían ser globales?).

## Documentos relacionados

- [`campos-y-listas.md`](./campos-y-listas.md)
- [`ui-parametros.md`](./ui-parametros.md)
- [`sync-parametros-v611.md`](./sync-parametros-v611.md)
- [`reforma-gradualidad.md`](./reforma-gradualidad.md)
- [`python-carga-mensual.md`](./python-carga-mensual.md)

## Actualizacion aplicada: politica final por tab visible

Fecha de ajuste: 2026-05-01.

| Tab | Tipo dominante | Politica en UI/repositorio |
|-----|----------------|----------------------------|
| Informacion de Valores | PERIODO_MENSUAL | `parametros_generales.periodo = YYYY-MM`; vacio por mes. |
| Informacion de Remuneraciones | PERIODO_MENSUAL + fallback VIGENCIA | formulario del snapshot mensual; datos legales/AFC/Reforma se hidratan por vigencia del mes. |
| CCAF y Mutual | CONFIG_EMPRESA + CATALOGO_GLOBAL + PERIODO_MENSUAL | configuracion guardada en el snapshot mensual; CCAF y mutuales se muestran siempre; Ley 16.744 sigue mensual. |
| Tramos Cargas Familiares | PERIODO_MENSUAL | `tramo_carga.periodo = YYYY-MM`. |
| Impuesto unico | PERIODO_MENSUAL / vigencia derivada | `tramo_impuesto.periodo = YYYY-MM`; `tabla_impuesto_unico.periodo` deriva de `vigencia_inicio`. |
| Salud | VIGENCIA | ISAPRE e instituciones por solape de vigencia; no exige `periodo` exacto. |
| Prevision | VIGENCIA | AFP por solape de vigencia; no exige `periodo` exacto. |
| Reforma de Pensiones > Legales | VIGENCIA | parametros legales por solape de vigencia. |
| Reforma de Pensiones > Aportes | VIGENCIA normativa | calendario completo de gradualidad/aportes; periodo activo marca estado. |
| Reforma de Pensiones > Trab. pesados | HIBRIDO VIGENCIA + MES | se muestra por vigencia que solapa el mes; pendiente decidir si debe exigir `periodo` mensual. |
| Reforma de Pensiones > APV inst. / APV pago | CATALOGO_GLOBAL | catalogos completos; no dependen del periodo seleccionado. |

Reglas aplicadas en esta fase:

- AFP, Salud, parametros legales y AFC no filtran por `periodo` exacto cuando el dato real es vigencia.
- CCAF, mutuales, instituciones APV y formas de pago APV son catalogos globales; se muestran siempre aunque tengan `periodo` como trazabilidad.
- Reforma previsional / gradualidad 8,5 % se muestra como calendario completo; el periodo activo solo calcula estado visual: `Vigente al periodo`, `Futuro` o `Historico`.
- Ley 16.744, tramos de carga, tramos impuesto y tabla impuesto unico conservan el criterio mensual documentado.

Pendiente Python/SQL:

- Confirmar que los maestros globales no se traten como faltantes mensuales en los logs de carga.
- Revisar si `trabajo_pesado_parametro` debe exigir `periodo` mensual en UI o permanecer como vigencia solapada.

## Actualizacion aplicada: estado global y tabs limpios

Fecha de ajuste: 2026-05-01.

La UI no debe repetir chips de tipo de dato en cada tab. La explicacion mensual/vigencia/catalogo queda en esta documentacion; la pantalla muestra:

- Banda superior: estado global del periodo (`Pendiente`, `Parcial`, `Completo`, `Editando`, `Error`) y una descripcion corta.
- Tabs: titulo, filtros, tabla y empty state especifico.
- Tablas normativas: estados por fila cuando aportan decision operativa (`Vigente al periodo`, `Futuro`, `Historico`).
- Referencia anterior: si el periodo activo no tiene datos mensuales oficiales y existe un periodo anterior cargado, la accion `Ver referencia ...` solo cambia el selector al periodo anterior; no mezcla ni guarda esos datos como oficiales del periodo activo.

Mejora futura documentada: boton `Ver detalle de carga`, con desglose de mensuales, vigencias, catalogos, ultima ejecucion Python y log asociado. No se implementa en esta fase.
