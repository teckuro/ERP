# Nomina mensual – contrato general

## Objetivo

Definir el contrato funcional para el modulo de Nomina mensual en su fase inicial. 
La fase 9.5A se centra en la ejecucion de prevalidaciones mensuales por periodo, dejando fuera el motor de calculo y la generacion de liquidaciones.

## Alcance

- Seleccion y validacion del periodo `YYYY-MM`.
- Prevalidacion de datos mediante `ProcesoMensualService` y reglas puras en `proceso-mensual-prevalidacion.rules.ts`.
- UI con selector de periodo, paneles de estado y listado de areas.
- Integracion con servicios de Parametros, Empleados, Conceptos y Movimientos variables.
- Sin calculo de montos, motor de liquidacion, Previred o LRE.

## Flujo resumido

```
Usuario selecciona periodo → Clic en «Validar periodo» → Sistema ejecuta prevalidaciones → Muestra resultados
```

1. El usuario selecciona un periodo `YYYY-MM` mediante un control `input type="month"`.
2. Al presionar **Validar periodo**, `ProcesoMensualService` llama a los servicios de Parametros, Empleados, Conceptos y Movimientos variables para validar:
   - Existencia y estado del periodo en `periodo_remuneracion`.
   - Datos mensuales y vigencias necesarias para el calculo.
   - Aptitud de los empleados y conceptos asignables por periodo.
   - Presencia de movimientos variables en estado `VALIDADO` (movimientos recurrentes se integraran en fases futuras).
3. La UI presenta paneles diferenciando bloqueos, advertencias, informacion y areas validadas.
4. En esta fase no se calcula el monto de liquidaciones ni se cierra el periodo.

## Archivos relacionados

- `prevalidaciones.md` – reglas de validacion y modelos.
- `parametros/*`, `empleados/*`, `conceptos-remuneracion/*`, `haberes-descuentos/*` – fuentes de datos.
- `orquestador/estado-fases.md` – fase 9.5A.
 - `../normativa-remuneraciones.md` – valores del IMM, jornada máxima, recargos de horas extra, exclusiones de remuneración y obligaciones del LRE; estas reglas deben validarse antes de proceder al cálculo mensual.

## Pendientes

- Implementar el motor de calculo y generacion de liquidaciones.
- Integrar Previred/LRE.
- Habilitar cierre de periodo y exportes oficiales.
- Definir roles y RLS para la ejecucion del proceso.
