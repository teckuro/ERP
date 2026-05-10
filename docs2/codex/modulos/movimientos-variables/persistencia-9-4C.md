# Movimientos variables mensuales - persistencia y repositorio base (Fase 9.4C)

Anexo técnico. Contrato funcional: [`contrato-general.md`](./contrato-general.md), [`decisiones-operativas.md`](./decisiones-operativas.md). Modelo TS y reglas puras: [`modelo-tecnico-9-4B.md`](./modelo-tecnico-9-4B.md).

## 1. Objetivo

Preparar **DDL PostgreSQL no destructivo** alineado a v11 (`persona` / `concepto`), un **repositorio base** con el patrón de cliente Supabase del proyecto, **mappers** snake_case ↔ camelCase y **comprobaciones de negocio** enlazadas a los helpers de la fase **9.4B** **antes** de una UI productiva (fase 9.4D+).

## 2. Tabla propuesta

Nombre: **`movimiento_variable_mensual`** (esquema `public`).

## 3. Campos

| Columna (SQL) | Notas |
|----------------|--------|
| `id_movimiento_variable` | `SERIAL`, PK (en TS se expone como `idMovimiento`). |
| `id_persona` | `INT NOT NULL`, FK → `persona(id_persona)` ON DELETE CASCADE. |
| `id_concepto` | `INT NOT NULL`, FK → `concepto(id_concepto)`. |
| `periodo` | `CHAR(7) NOT NULL`, mes de remuneración `YYYY-MM`. |
| `monto` | `NUMERIC(14,2) NOT NULL`, debe ser > 0 (CHECK). |
| `estado` | `VARCHAR(30) NOT NULL` por defecto `BORRADOR`; CHECK con conjunto cerrado (ver 9.4B). |
| `origen` | `VARCHAR(30) NOT NULL` por defecto `MANUAL`; CHECK `MANUAL` / `IMPORTADO` / `SISTEMA`. |
| `observacion` | `TEXT`, opcional. |
| `fecha_registro` | `TIMESTAMPTZ NOT NULL` por defecto `now()`. |
| `fecha_actualizacion` | `TIMESTAMPTZ NOT NULL` por defecto `now()`; el repositorio la actualiza en `actualizar` y `anular`. |
| `fecha_anulacion` | `TIMESTAMPTZ`, opcional; se rellena en anulación lógica. |
| `motivo_anulacion` | `TEXT`, opcional. |

En v1 solo se persiste **`id_concepto`** (sin JSON de snapshot). La validación opcional con snapshot sigue en las reglas **9.4B** cuando el llamador pasa `MovimientoVariableConceptoSnapshot`; en esta fase el repositorio **no** carga filas de `concepto`.

## 4. Restricciones (constraints)

- `chk_movvar_periodo_formato`: expresión regular `^[0-9]{4}-[0-9]{2}$`.
- `chk_movvar_periodo_mes`: mes 01-12 a partir del substring.
- `chk_movvar_monto_positivo`: `monto > 0`.
- `chk_movvar_estado`: conjunto cerrado alineado a `MOVIMIENTO_VARIABLE_ESTADOS` en TS.
- `chk_movvar_origen`: conjunto cerrado alineado a `MOVIMIENTO_VARIABLE_ORIGENES` en TS.

## 5. Índices

Índices de listado no destructivos (también en el script incremental con `IF NOT EXISTS`):

- `idx_movvar_periodo` sobre `(periodo)`.
- `idx_movvar_persona_periodo` sobre `(id_persona, periodo)`.
- `idx_movvar_concepto_periodo` sobre `(id_concepto, periodo)`.
- `idx_movvar_estado_periodo` sobre `(estado, periodo)`.

## 6. Regla de duplicado (v1)

**Índice único parcial** `uq_movvar_operativo_persona_concepto_periodo` sobre `(id_persona, id_concepto, periodo)` **WHERE** `estado <> 'ANULADO'`.

Coherente con 9.4B: una fila operativa por trabajador + concepto + periodo; **ANULADO** no impide un registro nuevo.

## 7. Anulación lógica

- Ruta en aplicación: `estado = 'ANULADO'`, `fecha_anulacion = now()`, texto opcional en `motivo_anulacion`, `fecha_actualizacion = now()`.
- Método del repositorio **`anular`**; no hay API de borrado físico.

## 8. Borrado físico

No se expone como operación normal del repositorio.

## 9. Repositorio base

Archivo: `src/app/features/movimientos-variables/data-access/movimientos-variables.repository.ts` (`providedIn: 'root'`).

Métodos:

- `listarPorPeriodo(periodo: string)`
- `listarPorPersonaYPeriodo(idPersona: number, periodo: string)`
- `obtenerPorId(idMovimiento: number)`
- `crear(payload: MovimientoVariableCrearPayload)`
- `actualizar(idMovimiento: number, payload: MovimientoVariableActualizarPayload)`
- `anular(idMovimiento: number, payload: MovimientoVariableAnularPayload)`
- `listarDuplicadosOperativos(idPersona, idConcepto, periodo, excluirIdMovimiento?)`

Comportamiento:

- Antes de crear/actualizar: `validarMovimientoVariableInput(..., null)` (sin snapshot de catálogo en el repositorio v1).
- Antiduplicado con `existeDuplicadoMovimientoVariable` + `listarDuplicadosOperativos`.
- No se permite actualizar si el `estado` actual es `ANULADO`, `BLOQUEADO` o `INCLUIDO_EN_PROCESO`.
- La actualización rechaza `estado: 'ANULADO'` (hay que usar `anular`).
- La anulación usa `puedeAnularMovimientoVariable`.

## 10. Mappers

Archivo: `src/app/features/movimientos-variables/data-access/movimientos-variables.mapper.ts`

- `mapRowToMovimientoVariable`
- `mapCrearPayloadToInsert`
- `mapActualizarPayloadToUpdate` (solo campos definidos + `fecha_actualizacion`)
- `mapAnularPayloadToUpdate`

## 11. Relación con las validaciones 9.4B

Mismos helpers que en `movimiento-variable-validacion.rules.ts`; el repositorio no duplica reglas numéricas ni de estado.

## 12. RLS y seguridad

**No** implementado en 9.4C. RLS y permisos se aplicarán cuando existan login, roles y JWT.

## 13. Supabase remoto

No se aplica automáticamente a un proyecto remoto; cada entorno aplica el DDL según su proceso.

## 14. Tipos Supabase

`src/app/core/models/database.types.ts` incluye un bloque **manual** de `movimiento_variable_mensual` para que `from('movimiento_variable_mensual')` tipifique. Si el flujo del equipo regenera tipos tras migrar la BD, conviene alinear ese bloque con el resultado del generador.

## 15. Ubicación de los SQL

- Creación canónica (fresh `run_all` tras reset): `bd/base/v11/partes/02_tablas.sql` (y espejo en `bd/base/v11/crear_sql_v6_11_integrada.sql`).
- Incremental idempotente: `bd/base/v11/partes/14_movimiento_variable_mensual.sql` (documentado en `bd/base/v11/README.md`).

Estilo DDL permitido en el incremental: `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, `CREATE UNIQUE INDEX IF NOT EXISTS` únicamente en ese archivo.

## 16. Pruebas

- `movimientos-variables.mapper.spec.ts` para casos de mapper.
- Pruebas de integración del repositorio contra BD real: **fuera de alcance** de 9.4C.

## 17. Próximos pasos (9.4D o posteriores)

- **9.4D (cerrada en codigo):** `MovimientosVariablesService` en `src/app/features/movimientos-variables/services/`; ver [`service-9-4D.md`](./service-9-4D.md).
- Integracion futura con catalogo de conceptos para armar snapshot antes de guardar (UI o servicio ampliado).
- **UI** productiva bajo `/remuneraciones/movimientos-variables`.
- **RLS** / JWT cuando exista modelo de acceso.

## 18. Recordatorios de separación

- **No** sustituye **Haberes recurrentes** (`haberdescuento_persona`); en 9.4C no hay validación cruzada por consultas.
- **No** redefine **Conceptos**; solo FK `id_concepto`.
