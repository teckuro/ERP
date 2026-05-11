# MOTOR-01 - Implementacion inicial del motor de calculo base

## Objetivo

Implementar el primer motor funcional, acotado y trazable, alimentado desde la pre-nomina 9.5C.

El resultado es preliminar por trabajador. No cierra periodo, no emite liquidaciones oficiales, no genera PDF, no genera Previred y no genera LRE.

## Alcance

- Regla pura `proceso-mensual-motor.rules.ts`.
- Modelos TypeScript para `MotorCalculoInput`, `LiquidacionCalculada`, issues, trazabilidad y resumen de periodo.
- Servicio `ProcesoMensualService.generarCalculoPeriodo(periodo)` y consulta en memoria con `obtenerResultadoCalculoPeriodo(periodo)`.
- UI minima en `/remuneraciones/proceso-mensual` con boton **Calcular preliminar**, resumen y tabla por trabajador.
- Tests unitarios de reglas puras, servicio y contenedor.

## Que calcula

- Sueldo base como haber imponible.
- Haberes recurrentes vigentes imponibles y no imponibles.
- Base imponible previsional preliminar.
- Base tributable preliminar segun clasificacion disponible.
- AFP desde `afp` / `afp_vigencia` expuesto por catalogos.
- SIS desde `parametros_generales.sis` o `afp_vigencia.sis`, sin hardcodeo.
- Salud desde `salud` y datos del trabajador; Fonasa aplica tasa legal disponible y plan Isapre exige informacion suficiente.
- AFC desde `afc_parametro` segun tipo de contrato.
- SANNA desde `parametros_generales.sanna` como cargo empleador; si falta, advertencia en MOTOR-01.
- Ley 16.744 desde `ley_16744_parametros` y, si existe en la entrada futura, `empresa_ley_16744`; queda separado de descuentos del trabajador.
- Impuesto unico preliminar con `tabla_impuesto_unico` si hay tramo/factor/rebaja suficientes.
- Total haberes, total descuentos trabajador y liquido preliminar.

## Que no calcula

- Gratificacion legal automatica compleja.
- Reliquidaciones, finiquitos, licencias complejas, ausencias avanzadas, prestamos o anticipos complejos.
- Cierre de periodo, snapshot definitivo, liquidacion oficial, PDF, Previred, LRE, contabilidad ni exportaciones.
- Persistencia en BD del resultado calculado.

## Tablas usadas

El motor respeta DB-01 y usa solo fuentes canonicas ya confirmadas o expuestas por servicios existentes:

- `parametros_generales`
- `afp`
- `afp_vigencia`
- `salud`
- `salud_plan` como contrato conceptual para plan; MOTOR-01 usa el snapshot disponible en ficha si no hay fila de plan.
- `afc_parametro`
- `ley_16744_parametros`
- `empresa_ley_16744` como snapshot opcional futuro; si no viene, se advierte y se calcula solo tasa basica cuando existe.
- `organismo_administrador_ley_16744` solo catalogo.
- `tabla_impuesto_unico`
- `reforma_previsional_parametro` queda cargable por catalogos, sin calculo avanzado en MOTOR-01.

No usa como reales: `empresa_mutual_config`, `afp_parametro`, `salud_vigencia`, `afc_vigencia`, `mutual_vigencia`, `asignacion_familiar_tramo`, `sis_parametro`, `sanna_parametro`, `topes_imponibles`.

## Reglas DB-01

- SIS no se hardcodea y bloquea trabajador si falta.
- SANNA se toma desde `parametros_generales.sanna`; en MOTOR-01 faltante queda advertencia porque no afecta liquido trabajador.
- Ley 16.744 queda como cargo empleador, separado de descuentos del trabajador.
- No se agregaron SQL, migraciones, Python ni cambios contra Supabase remoto.

## Issues y trazabilidad

Issues principales:

- `PRE_NOMINA_BLOQUEADA`
- `TRABAJADOR_NO_CALCULABLE`
- `FALTA_SUELDO_BASE`
- `FALTA_CONTRATO`
- `FALTA_AFP_VIGENTE`
- `FALTA_AFP_TASA`
- `FALTA_SIS`
- `FALTA_SALUD`
- `FALTA_AFC`
- `CONCEPTO_SIN_CLASIFICACION`
- `SANNA_NO_DEFINIDO`
- `LEY_16744_INCOMPLETA`
- `IMPUESTO_UNICO_NO_CALCULADO`

Trazabilidad minima registrada:

- `SUELDO_BASE`
- `HABER_IMPONIBLE_SUMADO`
- `HABER_NO_IMPONIBLE_SUMADO`
- `BASE_IMPONIBLE_PREVISIONAL`
- `AFP_TASA_APLICADA`
- `SIS_PARAMETRO_APLICADO`
- `SALUD_PARAMETRO_APLICADO`
- `AFC_PARAMETRO_APLICADO`
- `SANNA_PARAMETRO_APLICADO`
- `LEY_16744_PARAMETRO_APLICADO`
- `IMPUESTO_UNICO_PRELIMINAR`
- `LIQUIDO_PRELIMINAR`

## Tests

- `proceso-mensual-motor.rules.spec.ts`
- `proceso-mensual.service.spec.ts`
- `proceso-mensual-container.spec.ts`
- Suites 9.5C existentes mantenidas.

Validacion ejecutada:

```bash
npm test -- --watch=false
```

Resultado: 27 archivos de test, 239 tests en verde.

## Pendientes

- MOTOR-02 debe completar gratificacion legal automatica, impuesto unico avanzado, topes y reglas legales complejas.
- Integrar snapshot real de `empresa_ley_16744` al input del motor cuando exista patron de empresa vigente en servicios.
- Integrar `salud_plan` como fila canonica si el servicio de empleados/parametros expone el plan vigente.
- Definir persistencia/snapshot en fase de liquidaciones, no en MOTOR-01.

## Siguiente fase recomendada

MOTOR-02 - Gratificacion, impuesto unico y reglas legales avanzadas.
