# Prevalidaciones 9.5A – Parte A

Las **prevalidaciones** son controles que se ejecutan antes de calcular la nómina mensual. Permiten asegurar que la información de empleados, conceptos y parámetros esté completa y vigente, evitando errores en la liquidación. La fase 9.5A agrupa las prevalidaciones iniciales sobre datos maestros.

## Objetivo

Verificar que todos los requisitos de base estén cumplidos antes de iniciar el cálculo de las remuneraciones. Si alguna validación no se cumple, el proceso se detiene y se informa al usuario.

## Validaciones incluidas (Parte A)

| Código | Descripción | Acción |
|---|---|---|
| **PV‑01** | **Existencia de parámetros legales**: validar que existen registros vigentes en `parametros_generales`, `afp_vigencia`, `afc_parametro`, `salud_plan`, `tramo_carga`, `tabla_impuesto_unico` y demás tablas de parámetros para el periodo de remuneración. | **Bloqueo** si falta un valor obligatorio; registrar mensaje indicando qué parámetro falta. |
| **PV‑02** | **Estado de empleados**: todos los empleados incluidos en la nómina deben estar en estado `activo` y tener una fecha de inicio anterior o igual al fin del periodo. | **Bloqueo** si existe algún empleado sin estado válido o con fecha de inicio posterior al periodo. |
| **PV‑03** | **Aptitud y completitud**: verificar que los empleados tengan asignada una AFP, plan de salud, tipo de contrato, jornada y sueldo base. | **Bloqueo** si falta alguno de estos atributos. |
| **PV‑04** | **Validación de RUT**: comprobar que los RUT de empleados sean válidos y que la empresa tenga RUT registrado. | **Bloqueo** si se encuentra un RUT inválido. |
| **PV‑05** | **Jornada laboral**: validar que la jornada de cada empleado no supere el límite vigente según `jornada-laboral-40-horas.md`. | **Advertencia** si excede; **bloqueo** si no se corrige. |
| **PV‑06** | **Carga familiar**: para empleados con cargas familiares, verificar que el tramo de asignación familiar esté registrado en `tramo_carga` y que la información de cargas esté completa. | **Bloqueo** si faltan datos de cargas o no existe tramo vigente. |

Estas validaciones se ejecutan en el orden indicado. La fase 9.5B complementará estas verificaciones con controles sobre conceptos, haberes recurrentes y movimientos variables.

## Resultados y seguimiento

* Cuando se ejecuta la prevalidación, se genera un reporte que indica cuántos registros pasan cada validación y qué errores se encontraron. Este reporte se almacena para auditoría.
* El usuario debe corregir los errores y volver a ejecutar la prevalidación hasta que todas las validaciones se superen.

Para conocer las validaciones adicionales, consulte `prevalidaciones-9-5B.md`.
