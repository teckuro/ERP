# Dependencias entre fases

## 1. Cadena critica

Empleados aptos
-> Parametros del periodo
-> Roles y permisos base
-> Conceptos gobernados
-> Haberes recurrentes
-> Movimientos variables
-> Proceso mensual validado
-> Motor de calculo
-> Liquidaciones snapshot
-> Cierre mensual
-> Previred / LRE
-> Reportes / auditoria

## 2. Dependencias principales

| Fase        | Depende de                                      | Por que                                             |
| ----------- | ----------------------------------------------- | --------------------------------------------------- |
| ORDEN-01    | Roadmap maestro integrado                       | Deja el camino oficial y evita contradicciones      |
| SEG-01      | ORDEN-01, docs actuales                         | Define permisos antes de endurecer modulos          |
| CONC-02     | SEG-01                                          | Conceptos necesita reglas por rol                   |
| MOTOR-00    | CONC-02, Parametros, Empleados, Recurrentes, MV | Define que datos consume el motor                   |
| MOTOR-01    | MOTOR-00                                        | Implementa solo lo ya contratado                    |
| LIQ-01      | MOTOR-01                                        | La liquidacion debe venir del motor                 |
| CIERRE-01   | LIQ-01                                          | No se cierra un periodo sin liquidaciones generadas |
| PREVIRED-01 | LIQ-01, CIERRE-01                               | Previred necesita datos consolidados                |
| LRE-01      | LIQ-01, Conceptos LRE                           | LRE depende del mapeo legal de conceptos            |
| UX-FINAL-01 | Fases funcionales principales                   | El pulido visual no debe bloquear funcionalidad     |

## 3. Bloqueadores del motor

Antes de implementar motor debe existir:

- ORDEN-01 cerrada.
- SEG-01 cerrada base.
- Conceptos gobernados.
- Parametros minimos por periodo.
- Empleados aptos para remuneraciones.
- Haberes recurrentes filtrables por periodo.
- Movimientos variables validados por periodo.
- Proceso mensual con prevalidaciones reales.
- Contrato del motor documentado.

MOTOR-00 es obligatorio antes de cualquier implementacion de motor. Ninguna fase puede crear calculo productivo, liquidacion o snapshot real saltandose ese contrato.

## 4. Bloqueadores de liquidaciones

Antes de implementar liquidaciones reales debe existir:

- Motor v1.
- Resultado calculado por trabajador.
- Lineas de haberes/descuentos/aportes.
- Snapshot de parametros usados.
- Estado de proceso mensual.
- Reglas de recalculo o bloqueo.

## 5. Bloqueadores de Previred

Antes de Previred debe existir:

- Liquidacion real.
- Datos previsionales completos.
- AFP / IPS / salud.
- Topes imponibles.
- SIS, AFC, SANNA, mutualidad si aplica.
- Contrato y tipo trabajador.
- Periodo cerrado o pre-cerrado.

## 6. Bloqueadores de LRE

Antes de LRE debe existir:

- Liquidaciones reales.
- Conceptos mapeados a LRE.
- Clasificacion imponible / tributable / informativa.
- Haberes, descuentos y aportes separados.
- Totales auditables.
