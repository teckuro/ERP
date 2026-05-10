# MOTOR-00 - Contrato del motor de calculo

## 1. Objetivo

Definir el contrato tecnico, funcional y normativo que debe cumplir el futuro motor de calculo de remuneraciones antes de implementar montos reales.

MOTOR-00 es **documental**. No implementa calculos, liquidaciones, persistencia, cierre de periodo, Previred, LRE ni PDF.

## 2. Relacion con 9.5C

El motor futuro se alimenta desde la pre-nomina funcional 9.5C. La entrada al motor solo puede construirse desde un periodo prevalidado y una pre-nomina sin bloqueos.

Flujo esperado:

```txt
Prevalidaciones 9.5A/9.5B
-> Pre-nomina funcional 9.5C
-> MotorCalculoInput
-> LiquidacionCalculada
-> Liquidacion snapshot futura
```

## 3. Entrada conceptual

`MotorCalculoInput` representa el conjunto cerrado de datos que el motor puede usar:

| Campo | Contenido esperado | Fuente / regla |
|---|---|---|
| `periodo` | Periodo `YYYY-MM` | Pre-nomina 9.5C |
| `empresa` | Identificacion de empresa y configuracion aplicable | Empresa / Parametros |
| `parametrosPeriodo` | Fila vigente de `parametros_generales` | DB-01 |
| `trabajadoresPreNomina` | Trabajadores aptos incluidos en la pre-nomina | 9.5C |
| `contratosVigentes` | Contrato vigente por trabajador en el periodo | Empleados |
| `haberesRecurrentes` | Haberes recurrentes aplicables al periodo | 9.5B |
| `descuentosRecurrentes` | Descuentos recurrentes aplicables al periodo | Haberes y descuentos |
| `movimientosVariables` | Movimientos variables futuros en estado `VALIDADO` | Movimientos variables |
| `parametrosLegales` | AFP, salud, AFC, SIS, SANNA, reforma, asignacion familiar, impuesto unico | Tablas canonicas DB-01 |
| `configuracionLey16744` | Tasa basica, extraordinaria si aplica, organismo y tasa empresa | `ley_16744_parametros`, `empresa_ley_16744` |
| `tablaImpuestoUnico` | Tramos vigentes del periodo | `tabla_impuesto_unico` |
| `reglasCalculo` | Politicas de gratificacion, jornada, topes y redondeos definidos por contrato | Motor v1 |

## 4. Salida conceptual

`LiquidacionCalculada` es el resultado futuro por trabajador. En MOTOR-00 solo se documenta:

| Campo | Contenido |
|---|---|
| `periodo` | Periodo calculado |
| `trabajador` | Identificador y snapshot minimo del trabajador |
| `haberesImponibles` | Lineas que afectan base previsional |
| `haberesNoImponibles` | Lineas que no afectan base previsional |
| `descuentosLegales` | AFP, salud, AFC, impuesto, otros legales |
| `descuentosVoluntarios` | Pactos voluntarios y descuentos autorizados |
| `baseImponiblePrevisional` | Base para cotizaciones previsionales con topes |
| `baseTributable` | Base afecta a impuesto unico |
| `cotizacionAfp` | Cotizacion obligatoria y comision segun AFP vigente |
| `cotizacionSalud` | Fonasa o plan Isapre aplicable |
| `cotizacionAfc` | Seguro de cesantia segun contrato |
| `cotizacionSis` | SIS desde `parametros_generales.sis` y/o `afp_vigencia.sis` |
| `cotizacionSanna` | SANNA desde `parametros_generales.sanna` cuando aplique |
| `cotizacionLey16744` | Aporte empleador Ley 16.744 |
| `impuestoUnico` | Retencion de segunda categoria |
| `totalHaberes` | Total de haberes calculados |
| `totalDescuentos` | Total de descuentos trabajador |
| `liquidoAPago` | Total liquido del trabajador |
| `issues` | Advertencias o bloqueos detectados durante el calculo |
| `trazabilidad` | Parametros, formulas y fuentes usadas |

## 5. Bloqueos previos

El motor no puede calcular si ocurre cualquiera de estas condiciones:

- Pre-nomina con bloqueos o estado `NO_GENERABLE`.
- Falta `periodo`.
- Falta fila vigente de `parametros_generales`.
- Falta IMM aplicable.
- Falta SIS confirmado para el periodo.
- Falta SANNA cuando sea obligatorio para el periodo.
- Falta AFP vigente del trabajador o vigencia aplicable en `afp_vigencia`.
- Falta salud vigente o plan aplicable.
- Falta `tabla_impuesto_unico` vigente.
- Falta contrato vigente del trabajador.
- Sueldo base menor al IMM aplicable.
- Jornada excede el maximo legal del periodo.
- Conceptos sin clasificacion imponible, tributable o de liquido.
- Empleado no apto para remuneraciones.

## 6. Reglas DB-01 obligatorias

El motor solo puede documentar o usar tablas confirmadas:

- `afp`
- `afp_vigencia`
- `salud`
- `salud_plan`
- `afc_parametro`
- `tramo_carga`
- `ley_16744_parametros`
- `empresa_ley_16744`
- `organismo_administrador_ley_16744`
- `tabla_impuesto_unico`
- `parametros_generales`
- `reforma_previsional_parametro`

No usar como tablas reales:

- `empresa_mutual_config`
- `afp_parametro`
- `salud_vigencia`
- `afc_vigencia`
- `mutual_vigencia`
- `asignacion_familiar_tramo`
- `sis_parametro`
- `sanna_parametro`
- `topes_imponibles`

SIS se resuelve desde `parametros_generales.sis` y/o `afp_vigencia.sis`, sin hardcodeo. SANNA se resuelve desde `parametros_generales.sanna`. Ley 16.744 usa `ley_16744_parametros`, `empresa_ley_16744` y `organismo_administrador_ley_16744`.

## 7. Fuera de alcance del motor inicial

Quedan fuera de MOTOR-01 inicial:

- Reliquidaciones.
- Finiquitos.
- Licencias medicas complejas.
- Ausencias con reglas avanzadas.
- Prestamos.
- Anticipos complejos.
- Reliquidacion anual.
- Multiempresa avanzada.
- Previred.
- LRE.
- Contabilidad.
- PDF oficial.

## 8. Estados futuros sugeridos

Estos estados son sugeridos para fases posteriores y no se implementan en MOTOR-00:

- `prevalidado`
- `calculando`
- `calculado_con_advertencias`
- `calculado`
- `error_calculo`
- `cerrado`

## 9. Criterio de cierre MOTOR-00

MOTOR-00 queda cerrado cuando existen contrato, entradas/salidas, orden de operaciones, reglas normativas iniciales, bloqueos, trazabilidad, casos de prueba y dependencias documentadas, sin cambios de codigo funcional.

<!-- ARQ-ERP-01-INTEGRACION -->

## Nota canonica 2026-05-07

Las entradas denominadas `movimientosVariables` en contratos historicos del motor deben entenderse como **Novedades mensuales aprobadas** en la arquitectura futura.

No cambiar nombres de codigo sin fase tecnica. Para fases nuevas, usar la capa recomendada:

```txt
EntradasMensualesPeriodoService -> contrato de entrada del motor
```

El motor no debe leer directamente `movimiento_variable_mensual` ni `novedad_remuneracion_periodo` desde UI; debe recibir entradas preparadas por Proceso mensual.
