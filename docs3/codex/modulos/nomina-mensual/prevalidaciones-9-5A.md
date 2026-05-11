# Fase 9.5A - Proceso mensual chileno: prevalidaciones (contrato cerrado)

## 1. Periodo

- Formato `YYYY-MM` validado con la misma regla que movimientos variables (`esPeriodoRemuneracionValido`).
- Si el formato es invalido -> `BLOQUEADO`, mensaje `PERIODO_FORMATO_INVALIDO`.

## 2. Parametros

- `obtenerUltimoHastaPeriodo(periodo)`: si falla la lectura -> bloqueo tecnico; si no hay fila -> `PARAMETROS_SIN_FILA` (bloqueo).
- `obtenerPeriodoRemuneracion(periodo)`: si falla -> bloqueo; si no hay fila pero existe parametros generales -> advertencia de calendario.
- Estados de `periodo_remuneracion`: `pendiente` / `error` -> bloqueo; `parcial` -> advertencia; `cargado` / `corregido` / `cerrado` -> OK para calendario.
- Si la fila de `parametros_generales` vigente no es exactamente el `YYYY-MM` seleccionado -> advertencia `PARAMETROS_FILA_NO_EXACTA`.
- `parametrosOperativos` en resumen: true solo con fila exacta del periodo y estado de calendario operativo.

## 3. Trabajadores

- `EmpleadosService.listar()`: conteo de `estado === activo` y `aptoParaRemuneraciones` true/false.
- Sin activos aptos -> advertencia; activos no aptos -> advertencia.
- Error de lectura -> bloqueo.

## 4. Conceptos

- `listarConceptosMantenimiento()`: catalogo vacio -> advertencia.
- Concepto vigente, no sistema, sin `tipo` o `naturaleza` -> advertencia de motor futuro.

## 5. Haberes recurrentes

- En **9.5A** no había método agregado por periodo: item `PENDIENTE_INTEGRACION` y mensaje INFO.
- En **9.5B** queda reemplazado por lectura real y conteos; ver [`prevalidaciones-9-5B.md`](./prevalidaciones-9-5B.md).

## 6. Movimientos variables

- `listarPorPeriodo(periodo)` (no se llama si el periodo es invalido).
- Conteos por estado en resumen.
- Reglas de severidad: ver contrato general seccion 8.

## 7. Estados globales de salida

- `LISTO_PARA_CALCULO`: sin bloqueos y sin advertencias de severidad ADVERTENCIA.
- `CON_ADVERTENCIAS`: sin bloqueos pero con al menos una ADVERTENCIA.
- `BLOQUEADO`: al menos un BLOQUEO.

## 8. Que se implemento (codigo)

- `src/app/features/nomina-mensual/models/proceso-mensual.model.ts`
- `src/app/features/nomina-mensual/rules/proceso-mensual-prevalidacion.rules.ts` + spec
- `src/app/features/nomina-mensual/services/proceso-mensual.service.ts` + spec
- Contenedor: selector `input type="month"`, boton Validar periodo, paneles de estado/bloqueos/advertencias/informaciones/areas.

## 9. Que quedo pendiente (post 9.5B)

- Motor, liquidaciones, Previred, LRE.
- Ampliar reglas de grupos de parametros si el negocio exige mas campos obligatorios por periodo (sin falsear OK).
- **Cerrado en 9.5B:** recurrentes por mes y grupos minimos de parametros; ver [`prevalidaciones-9-5B.md`](./prevalidaciones-9-5B.md).

## 10. Pruebas

- `proceso-mensual-prevalidacion.rules.spec.ts`
- `proceso-mensual.service.spec.ts`
- `proceso-mensual-container.spec.ts`
- Tras 9.5B: `proceso-mensual-parametros-minimos.rules.spec.ts`, `proceso-mensual-recurrentes.rules.spec.ts`, bloque recurrentes en `haberes-descuentos.service.spec.ts`
- Comando: `npx ng test --watch=false`
