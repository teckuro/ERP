# Movimientos variables – Contrato general

Los **movimientos variables** representan montos que se agregan o descuentan de manera ocasional a la remuneración de un trabajador. Incluyen bonos extraordinarios, horas extraordinarias, comisiones, descuentos por atrasos o ausencias, entre otros. Este módulo define cómo se registran, aprueban y liquidan estos movimientos en el ERP.

## Objetivos

* Permitir a las áreas de recursos humanos o remuneraciones ingresar montos variables asociados a un empleado y un periodo.
* Definir un flujo de aprobación opcional (por ejemplo, solicitud por jefatura, aprobación por RRHH).
* Integrar los movimientos al cálculo de la nómina mensual, aplicando reglas de tributación e imponibilidad según corresponda.

## Modelo de datos propuesto

| Campo | Tipo | Descripción |
|---|---|---|
| `id_movimiento` | Entero | Identificador del movimiento variable. |
| `empleado_id` | FK (`empleado.id`) | Trabajador al que se aplica el movimiento. |
| `periodo` | `YYYY‑MM` | Periodo de remuneración al que pertenece el movimiento. |
| `concepto_id` | FK (`concepto.id`) | Concepto de haber o descuento asociado, para clasificar imponible/no imponible. |
| `monto` | Numérico | Valor del movimiento (positivo para haberes, negativo para descuentos). |
| `observacion` | Texto | Comentario o descripción del motivo. |
| `estado` | Enum | Estados como `registrado`, `aprobado`, `rechazado` o `anulado`. |
| `fecha_registro` | Fecha | Cuándo se ingresó el movimiento. |
| `fecha_aprobacion` | Fecha | Cuándo se aprobó (si aplica). |

Este modelo puede ampliarse con campos adicionales como `hora_inicio` y `hora_fin` para horas extraordinarias, o `unidad` y `cantidad` para comisiones.

## Flujo de negocio

1. **Ingreso**: el usuario registra uno o más movimientos variables para un empleado y un periodo. El sistema valida que el periodo no esté cerrado y que el concepto sea válido.
2. **Aprobación** (opcional): si la organización así lo define, los movimientos pasan a un estado `registrado` y requieren aprobación por un supervisor o RRHH. Los estados se actualizan mediante un flujo de aprobación.
3. **Integración con nómina**: al ejecutar la prevalidación de la nómina mensual, el sistema suma todos los movimientos variables aprobados al haber o descuento correspondiente. Los no aprobados o rechazados se excluyen del cálculo.
4. **Cierre**: una vez calculada la nómina, los movimientos quedan marcados como `liquidados` y no pueden modificarse. Cualquier ajuste posterior debe registrarse como un movimiento adicional en el siguiente periodo.

## Interfaz de usuario

La UI del módulo debe permitir:

* Filtrar movimientos por empleado, periodo, estado y concepto.
* Crear, editar o eliminar movimientos en estado `registrado`.
* Visualizar los montos totales por empleado y por tipo de concepto para facilitar su revisión.
* Integrarse con el módulo de conceptos para seleccionar el concepto de haber o descuento aplicable, lo que determinará si el movimiento es imponible o no imponible.

Este módulo se encuentra en elaboración; los detalles de implementación se ampliarán en futuras versiones de la base documental.
