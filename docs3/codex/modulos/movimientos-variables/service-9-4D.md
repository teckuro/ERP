# Movimientos variables mensuales - service fino (Fase 9.4D)

Anexo ASCII. Contrato: [`contrato-general.md`](./contrato-general.md), [`decisiones-operativas.md`](./decisiones-operativas.md). Reglas: [`modelo-tecnico-9-4B.md`](./modelo-tecnico-9-4B.md). Persistencia: [`persistencia-9-4C.md`](./persistencia-9-4C.md).

## 1. Objetivo

Exponer `MovimientosVariablesService` como unica capa que la UI productiva debe usar para listar y persistir movimientos variables. El repository 9.4C queda como acceso a datos; las reglas puras 9.4B siguen en `rules/` y el service las invoca antes de delegar. La pantalla **9.4E** (`movimientos-variables-container`) consume solo este service, no el repository.

## 2. Metodos del service

Codigo: `src/app/features/movimientos-variables/services/movimientos-variables.service.ts`.

- `listarPorPeriodo(periodo: string): Promise<MovimientoVariableListadoFila[]>`
- `listarPorPersonaYPeriodo(idPersona: number, periodo: string): Promise<MovimientoVariableListadoFila[]>`
- `obtenerPorId(idMovimiento: number): Promise<MovimientoVariable | null>`
- `crear(payload: MovimientoVariableCrearPayload): Promise<MovimientoVariable>`
- `actualizar(idMovimiento: number, payload: MovimientoVariableActualizarPayload): Promise<MovimientoVariable>`
- `anular(idMovimiento: number, payload: MovimientoVariableAnularPayload): Promise<MovimientoVariable>`

## 3. Validacion al listar

- `listarPorPeriodo`: `esPeriodoRemuneracionValido`; si falla -> mensaje `El periodo debe tener formato YYYY-MM.`
- `listarPorPersonaYPeriodo`: idPersona > 0 (mensaje trabajador) y periodo valido.

## 4. Validacion al crear

1. idPersona e idConcepto > 0 con mensajes de seleccion.
2. Periodo valido.
3. **CHILE-FIX-01:** `EmpleadosService.obtenerPorId` -> persona existe, `aptoParaRemuneraciones`, `estado === activo`, contrato con `fechaIngreso` y `vigenciaIntersecaMes` respecto al periodo.
4. **CHILE-FIX-01:** `HaberesDescuentosService.resolverSnapshotConceptoParaMovimientoVariableManual(idConcepto, primerDiaDelMesDelPeriodo)` -> snapshot desde catalogo (no usa `payload.concepto` para candados).
5. `validarMovimientoVariableInput` sobre el input construido con el snapshot del paso 4.
6. `listarDuplicadosOperativos` + `existeDuplicadoMovimientoVariable`; si duplicado -> `Ya existe un movimiento variable operativo para este trabajador, concepto y periodo.`
7. Se elimina `concepto` del payload antes de `repository.crear` (no hay columna en BD v1).

## 5. Validacion al actualizar

1. id coherente con payload.
2. Movimiento existente; si no -> mensaje claro de no encontrado (ver constantes en el service).
3. Estado ANULADO, BLOQUEADO o INCLUIDO_EN_PROCESO -> no modificar.
4. No permitir `estado: ANULADO` en update (usar `anular`).
5. Merge actual + patch; mismas precondiciones **CHILE-FIX-01** que en crear (empleado + resolucion de concepto en servidor) sobre el merge.
6. `validarMovimientoVariableInput` con snapshot del catalogo (no `payload.concepto`).
7. Duplicados con exclusion de `idMovimiento`.
8. `repository.actualizar` sin campo `concepto` en el payload.

## 6. Validacion al anular

1. Movimiento existente.
2. `puedeAnularMovimientoVariable`; si no valido -> primer motivo de la regla o mensaje generico de anulacion.
3. `repository.anular`. Sin delete fisico.

## 7. Duplicados

Misma regla v1 que 9.4B/9.4C: operativos por persona + concepto + periodo; ANULADO no cuenta en la lista que entrega el repository para duplicados.

## 8. Estados bloqueados para edicion

ANULADO, BLOQUEADO, INCLUIDO_EN_PROCESO no admiten `actualizar`.

## 9. Snapshot de concepto

**CHILE-FIX-01:** El servicio **siempre** resuelve el snapshot con `resolverSnapshotConceptoParaMovimientoVariableManual` (usa `obtenerConceptoParaAsignacion` + `esConceptoAsignable` en el primer dia del mes del periodo). Los campos `concepto` en el payload son legacy / UI y **no** gobiernan tipo ni candados. Detalle: [`hardening-chile-fix-01.md`](./hardening-chile-fix-01.md).

## 10. Relacion con repository 9.4C

El service solo llama a `MovimientosVariablesRepository`; no usa `injectSupabase` directo.

## 11. Relacion con validaciones 9.4B

`esPeriodoRemuneracionValido`, `validarMovimientoVariableInput`, `existeDuplicadoMovimientoVariable`, `puedeAnularMovimientoVariable`.

## 12. Fuera de alcance 9.4D

UI productiva, ruta/sidebar, formulario, grid avanzado, proceso mensual, motor, liquidaciones, RLS/JWT, carga masiva, Supabase remoto, SQL destructivo.

## 13. Pendiente UI

Pantalla bajo `/remuneraciones/movimientos-variables` que consuma solo este service; listado visual y carga manual en fase posterior.

## 14. Modelo listado

`MovimientoVariableListadoFila` en `movimiento-variable.model.ts`: id movimiento obligatorio y `origen` requerido en la fila de listado para vistas estables.

## 15. Pruebas

`movimientos-variables.service.spec.ts` con mock del repository. Ver criterios en la bitacora de fase 9.4D.
