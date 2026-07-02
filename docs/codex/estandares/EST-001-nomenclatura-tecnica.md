# EST-001 — Estándar de Nomenclatura Técnica

**ERP Remuneraciones Chile**

Versión: 1.0  
Estado: Obligatorio  
Última revisión: 2026-07-02

## Objetivo

Definir una nomenclatura única y predecible para todos los objetos técnicos del sistema: base de datos, SQL, TypeScript, Angular y archivos del repositorio.

## Reglas generales

- **Base de datos y SQL:** `snake_case`, palabras separadas por `_`.
- **TypeScript (dominio):** `camelCase` en español cuando el símbolo es de negocio (ver [`nomenclatura-es-camelcase-01.md`](../diseno/nomenclatura-es-camelcase-01.md)).
- **Archivos Angular:** `kebab-case` (`nomina-periodo.service.ts`).
- **Selectores Angular:** prefijo `app-` + kebab-case (`app-nomina-mensual-v2-paso-dotacion`).
- **Clases CSS locales:** kebab-case; prefijos de módulo cuando existan (`employee-*`, `payroll-*`).
- **No usar** nombres genéricos: `temp`, `tmp`, `helper`, `helpers`, `util`, `utils`, `nuevo`, `test1`, `data`, `info`.
- **Descriptivo siempre:** el nombre debe revelar entidad + rol (`listar_trabajadores_elegibles_nomina`, no `getWorkers`).

### Ejemplos BD

| Correcto | Incorrecto |
|----------|------------|
| `fecha_ingreso` | `fechaIngreso`, `EmpleadoActivo` |
| `movimiento_recurrente` | `movimientoRecurrente`, `movimiento-recurrente` |
| `id_empresa` | `empresaId`, `ID_EMPRESA` |

---

## Base de datos — prefijos oficiales

### Obligatorio (código nuevo)

| Objeto | Prefijo / regla | Ejemplo |
|--------|-----------------|---------|
| Tablas | sin prefijo, singular o compuesto descriptivo | `nomina_periodo`, `movimiento_nomina` |
| Vistas | `vw_` | `vw_empleados_activos` |
| Materialized views | `mv_` | `mv_resumen_nomina` |
| Funciones expuestas (RPC) | verbo en español, sin prefijo técnico | `listar_dotacion_nomina`, `guardar_preferencia_ui` |
| Funciones internas / utilitarias | `fn_` o `_fn_` (privada) | `fn_ultimo_dia_habil`, `_fn_hd_to_mr_row` |
| Types compuestos | `tp_` | `tp_resultado_calculo` |
| Enums PostgreSQL | `en_` | `en_estado_nomina` |
| Secuencias | `seq_` | `seq_liquidaciones` |
| Índices | `ix_` | `ix_nomina_periodo_empresa_periodo` |
| Índices únicos | `uq_` | `uq_nomina_calc_periodo_activo_nomina` |
| Primary keys (constraint) | `pk_` | `pk_nomina_periodo` |
| Foreign keys (constraint) | `fk_` | `fk_movimiento_nomina_periodo` |
| Check constraints | `chk_` | `chk_fecha_ingreso` |
| Triggers | `tg_` | `tg_movimiento_nomina_concepto_guard` |
| Policies RLS | `<tabla_abrev>_<operacion>` | `mov_recurrente_select`, `nomina_periodo_delete` |

### Legacy admitido (no renombrar sin fase)

| Patrón | Ejemplo | Notas |
|--------|---------|-------|
| `trg_`, `tr_` triggers | `trg_nomina_periodo_updated`, `tr_nomina_plantilla_ciclo_updated_at` | Preferir `tg_` en triggers nuevos |
| `idx_`, `ux_` índices | `idx_empleados_rut`, `ux_nomina_periodo_ordinaria` | Preferir `ix_` / `uq_` en índices nuevos |
| `sp_` procedimientos | — | En PostgreSQL todo es función; usar verbos RPC |

---

## Columnas

### Primary keys

- Tablas nuevas del dominio nómina/admin: **`id`** (`uuid`, `default gen_random_uuid()`).
- Tablas legacy de personas/empresa: **`id_<entidad>`** entero (`id_persona`, `id_empresa`).

### Foreign keys

Convención vigente del proyecto: **prefijo `id_` + entidad**.

| Correcto (proyecto) | Alternativa documentada (evitar en nuevo) |
|---------------------|-------------------------------------------|
| `id_empresa` | `empresa_id` |
| `id_persona` | `persona_id` |
| `id_nomina_periodo` | `nomina_periodo_id` |
| `id_concepto` | `concepto_id` |

### Columnas de auditoría (cuando aplique)

| Columna | Tipo habitual |
|---------|---------------|
| `created_at` | `timestamptz` |
| `updated_at` | `timestamptz` |
| `created_by` | `uuid` (auth) |
| `updated_by` | `uuid` (auth) |

### Columnas booleanas / estado

- Prefijo `es_`, `tiene_` o sustantivo + estado: `activo`, `vigente`, `cerrado`.
- Evitar negaciones dobles: preferir `activo` sobre `no_inactivo`.

---

## PL/pgSQL — variables y parámetros

| Elemento | Prefijo | Ejemplo |
|----------|---------|---------|
| Parámetros | `p_` | `p_empresa_id`, `p_nomina_id` |
| Variables locales | `v_` | `v_total`, `v_empleado` |
| Constantes | `c_` | `c_estado_activo` |
| Record | `r_` | `r_empleado` |
| ROWTYPE | `rw_` | `rw_periodo` |
| Cursores | `cur_` | `cur_empleados` |
| Excepciones | `ex_` | `ex_periodo_cerrado` |

Parámetros de paginación estándar:

- `p_page`, `p_page_size`
- `p_busqueda`, `p_orden` (cuando aplique)

---

## TypeScript y Angular

### Archivos y carpetas

| Tipo | Convención | Ejemplo |
|------|------------|---------|
| Feature folder | kebab-case | `nomina-mensual-v2/` |
| Servicio | `<nombre>.service.ts` | `nomina-periodo.service.ts` |
| Repositorio | `<nombre>.repository.ts` | `nomina-periodo.repository.ts` |
| Mapper | `<nombre>.mapper.ts` | `nomina-periodo.mapper.ts` |
| Modelo | `<nombre>.models.ts` | `movimiento-nomina.models.ts` |
| Reglas puras | `<nombre>.rules.ts` | `nomina-periodo-state.rules.ts` |
| Spec | mismo nombre + `.spec.ts` | `nomina-periodo.service.spec.ts` |
| Contenedor | `<feature>-container/` | `nomina-mensual-v2-container/` |
| Page wrapper | `src/app/pages/<ruta>.page.ts` | `nomina-mensual.page.ts` |

### Símbolos TypeScript

| Elemento | Convención | Ejemplo |
|----------|------------|---------|
| Interface / type dominio | PascalCase español | `NominaPeriodo`, `MovimientoNomina` |
| Propiedades dominio | camelCase español | `fechaInicio`, `idEmpresa`, `conceptoId` |
| Servicios / clases | PascalCase + sufijo | `NominaPeriodoService` |
| Funciones mapper | `rowTo*`, `*ToInsert`, `map*` | `rowToMovimientoNomina` |
| Signals / computed | camelCase | `totalFiltrado`, `puedeGuardarManual` |
| Constantes | UPPER_SNAKE o objeto `as const` | `TIPOS_MOVIMIENTO_SIN_CONCEPTO` |

### Qué no renombrar en TypeScript

Contratos externos o de librería (ver fase NOMENCLATURA-ES-CAMELCASE-01):

- Nombres de tablas/columnas/RPC en strings Supabase.
- `payload`, `snapshot`, `issues` en motor de cálculo y persistencia.
- Props de componentes compartidos: `label`, `value`, `statusChip`, `DataGridColumn`.
- Rutas públicas, selectores Angular y clases CSS ya publicadas.

### Mapeo BD ↔ TS

| BD (`snake_case`) | TS (`camelCase`) |
|-------------------|------------------|
| `id_empresa` | `idEmpresa` (string en capa nómina si legacy int) |
| `id_concepto` | `conceptoId` |
| `fecha_inicio` | `fechaInicio` |
| `created_at` | `createdAt` |

Regla: **una sola conversión en mappers**; servicios y componentes no leen filas crudas de Supabase.

---

## Migraciones SQL

Nombre de archivo:

```txt
YYYYMMDDHHMMSS_<dominio>_<descripcion_corta>.sql
```

Ejemplo: `20260702160000_nomina_f09_snapshot_por_nomina.sql`

Encabezado obligatorio en el archivo:

- ID de fase o backlog si existe (`F09`, `BKL-04`).
- Contexto en 2–4 líneas.
- Qué no rompe / dependencias.

---

## Smoke tests BD

Ubicación: `bd/scripts/validar-<dominio>-<tema>.sql`

Nombre descriptivo, idempotente cuando sea posible, ejecutable con `psql` contra entorno controlado.

---

## Checklist de cierre

- [ ] Nombres descriptivos; sin genéricos prohibidos.
- [ ] BD en snake_case; TS dominio en camelCase español.
- [ ] FK nuevas con prefijo `id_`.
- [ ] RPC con verbo español (`listar_`, `obtener_`, `guardar_`, `confirmar_`).
- [ ] PL/pgSQL con prefijos `p_`, `v_`, `c_`.
- [ ] Archivos en kebab-case; sin mezclar convenciones en el mismo layer.
