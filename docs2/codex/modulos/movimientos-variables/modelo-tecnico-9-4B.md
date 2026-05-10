# Movimientos variables - modelo técnico v1 (Fase 9.4B)

Anexo técnico. Contrato de producto: [`contrato-general.md`](./contrato-general.md), [`decisiones-operativas.md`](./decisiones-operativas.md).

## Alcance (9.4B)

- Tipos de dominio TypeScript y helpers de validación pura.
- Pruebas unitarias de reglas; sin Supabase, sin SQL, sin UI productiva, sin cambios a `concepto-asignabilidad.rules.ts` salvo necesidad estricta (no requerido aquí).

## Disposición del código

```txt
src/app/features/movimientos-variables/
  models/movimiento-variable.model.ts
  rules/movimiento-variable-validacion.rules.ts
  rules/movimiento-variable-validacion.rules.spec.ts
  data-access/movimientos-variables.mapper.ts
  data-access/movimientos-variables.mapper.spec.ts
  data-access/movimientos-variables.repository.ts
  services/movimientos-variables.service.ts
  services/movimientos-variables.service.spec.ts
```

## Tipos (`movimiento-variable.model.ts`)

- `MovimientoVariableEstado`: BORRADOR | VALIDADO | OBSERVADO | ANULADO | BLOQUEADO | INCLUIDO_EN_PROCESO
- `MovimientoVariableOrigen`: MANUAL | IMPORTADO | SISTEMA
- `MovimientoVariable`: forma de fila persistible (`idMovimiento` opcional, ids requeridos, `periodo`, `monto`, `estado`, metadatos opcionales; fechas de anulación desde 9.4C).
- `MovimientoVariableConceptoSnapshot`: opcional `{ tipo, calculoAutomatico?, esSistema? }` para validar sin importar reglas de asignabilidad.
- Interfaces de payload: `MovimientoVariableCrearPayload`, `MovimientoVariableActualizarPayload`, `MovimientoVariableAnularPayload` (para CRUD posterior).

## Reglas (`movimiento-variable-validacion.rules.ts`)

- `esPeriodoRemuneracionValido(periodo)`: trim, regex `^\d{4}-\d{2}$`, mes 01-12, año en [2000, 2100]. No comprueba periodo cerrado (fase futura).
- `validarMovimientoVariableInput(input, concepto?)`: `idPersona` / `idConcepto` > 0; periodo válido; `monto` finito y > 0; `estado` válido (por defecto BORRADOR). Si hay snapshot `concepto`: `tipo` debe ser HABER o DESCUENTO (trim y mayúsculas); rechaza `calculoAutomatico === true` y `esSistema === true` para manual v1.
- `existeDuplicadoMovimientoVariable(candidato, existentes)`: verdadero con mismo `idPersona` + `idConcepto` + `periodo` recortado y ambos lados en estado "operativo" en `{ BORRADOR, VALIDADO, OBSERVADO, BLOQUEADO, INCLUIDO_EN_PROCESO }`. Filas `ANULADO` en `existentes` se ignoran (v1: permite nueva línea tras anulación). Si las claves del candidato son inválidas, devuelve falso.
- `puedeAnularMovimientoVariable(estadoActual)`: no permite anular si ANULADO, BLOQUEADO o INCLUIDO_EN_PROCESO; permite en el resto.

## Pruebas

`movimiento-variable-validacion.rules.spec.ts` cubre casos borde de periodo, validez de estado, validación de entrada con/sin snapshot, duplicado con `ANULADO` ignorado y reglas de anulación.

## Ejecución de pruebas

```bash
npm test -- --watch=false
```

## Después de 9.4B

La fase **9.4C** incorporó SQL (`movimiento_variable_mensual`), mappers, repositorio y bloque manual en `database.types.ts`; detalle en [`persistencia-9-4C.md`](./persistencia-9-4C.md). La fase **9.4D** incorporó `MovimientosVariablesService` y modelo de fila de listado; ver [`service-9-4D.md`](./service-9-4D.md). Pendiente: RLS, UI productiva, resolución automática de snapshot desde catálogo y control de periodo cerrado bajo `/remuneraciones/movimientos-variables`.
