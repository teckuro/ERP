# Haberes y descuentos – contrato general

## Objetivo

Regular las asignaciones recurrentes de haberes y descuentos por trabajador, definiendo reglas para vigencia, asignabilidad, duplicados y cierre controlado. No se trata del calculo de liquidaciones ni de movimientos variables.

## Alcance

- Definir que se considera asignacion recurrente.
- Reglas para evitar duplicados y vigencias superpuestas.
- Clasificacion de vigencia (Activa, Futura, Vencida, Cerrada, Invalida).
- Reglas para cierre o desactivacion controlada.
- Integracion con el catalogo de Conceptos.

## Fuera de alcance

- Motor de liquidacion y calculo.
- Movimiento variable mensual (ver `movimientos-variables/contrato-general.md`).
- CRUD de conceptos (ver `conceptos-remuneracion/contrato-general.md`).
- Login, roles, RLS y auditoria avanzada (fases futuras).

## Reglas funcionales

### Unicidad y duplicados

- Para un mismo **trabajador + concepto**, no puede existir mas de una asignacion activa.
- No se permiten rangos de vigencia superpuestos para la misma combinacion.
- Se permiten rangos consecutivos (fin e inicio sin solape).
- Al editar una asignacion, se ignora su propio ID para evitar bloquear la actualizacion.

### Clasificacion de vigencia

La UI deriva el estado de vigencia de cada asignacion:

| Estado derivado | Criterio |
|-----------------|---------|
| **ACTIVA** | Vigencia actual incluye la fecha de referencia y la asignacion no esta marcada como cerrada. |
| **FUTURA** | El inicio es posterior a la fecha de referencia y el rango es coherente. |
| **VENCIDA** | La fecha de fin es anterior a la fecha de referencia. |
| **CERRADA** | La asignacion esta marcada como cerrada (`estado=false` o equivalente). |
| **INVALIDA** | Fechas incoherentes (inicio o fin no definidos, fin anterior al inicio). |

### Cierre o desactivacion controlada

- Cerrar una asignacion no la elimina; unicamente marca su `estado=false` y/o establece una fecha de termino.
- Una asignacion activa puede cerrarse si la fecha de cierre es mayor o igual al inicio.
- Una asignacion futura puede cerrarse (se marca como cerrada) sin requerir una fecha de fin.
- Una asignacion vencida no requiere cierre operativo.
- No se debe cerrar una asignacion que ya este cerrada.

### Filtros y vista historica

- Filtro `OPERATIVAS` (default): muestra asignaciones `ACTIVA + FUTURA`.
- Filtro `TODAS`: incluye `ACTIVA`, `FUTURA`, `VENCIDA`, `CERRADA` e `INVALIDA`.
- Filtros especificos: `ACTIVA`, `FUTURA`, `VENCIDA`, `CERRADA`, `INVALIDA`.
- La vista historica conserva asignaciones vencidas y cerradas, pero no permite acciones de edicion.

## Dependencias

- `conceptos-remuneracion/contrato-general.md` y `decisiones-operativas.md`: definen si un concepto es asignable.
- `movimientos-variables/contrato-general.md`: define movimientos variables puntuales por periodo.
- `nomina-mensual/prevalidaciones.md`: utiliza `HaberesDescuentosService.listarAsignacionesParaPrevalidacionMensual` para prevalidar.
 - `../normativa-remuneraciones.md`: describe las partidas que constituyen y las que no constituyen remuneración (por ejemplo, locomoción, colación, indemnizaciones).  La clasificación de un concepto como remunerativo o no remunerativo debe basarse en esta normativa para determinar su imponibilidad y tratamiento en el cálculo.

## Pendientes y no incluidos

- Implementar constraint SQL para solapamientos.
- Auditoria de cierre con usuario autenticado.
- Roles, JWT y RLS.
- Movimientos variables y proceso mensual completo.
