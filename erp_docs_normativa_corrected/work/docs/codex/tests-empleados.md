# Plan de pruebas – Módulo de Empleados

Este documento describe los escenarios de prueba para validar la funcionalidad del **módulo de Empleados**. Estas pruebas garantizan que el registro y la gestión de trabajadores cumplan con los requisitos normativos y de negocio.

## Escenarios de prueba

| ID | Descripción | Pasos | Resultado esperado |
|---|---|---|---|
| **EMP‑01** | Creación de empleado con datos mínimos | 1. Ingresar un nuevo empleado con nombre, RUT válido, fecha de nacimiento, fecha de inicio y sueldo base igual al IMM vigente. 2. Asignar AFP y plan de salud vigentes. | El sistema crea el empleado y muestra un mensaje de éxito. El estado del empleado se marca como `activo` y se registra la fecha de ingreso. |
| **EMP‑02** | Sueldo base inferior al IMM | 1. Intentar crear un empleado con sueldo base menor al IMM vigente. | El sistema bloquea la creación y muestra un mensaje indicando que el sueldo base no puede ser inferior al IMM (ver `ingreso‑minimo‑mensual.md`). |
| **EMP‑03** | Fecha de inicio sin parámetros vigentes | 1. Crear un empleado con fecha de inicio en un periodo para el cual no existen parámetros cargados (por ejemplo, vigencia de AFP o salud). | El sistema rechaza la operación y solicita cargar primero los parámetros correspondientes. |
| **EMP‑04** | Empleado menor de edad o mayor de 65 años | 1. Registrar un empleado menor de 18 años o mayor de 65 años con sueldo base. 2. Seleccionar la opción de IMM aplicable al tramo especial. | El sistema advierte al usuario sobre el tramo del IMM y valida que el sueldo base cumpla con el monto reducido. |
| **EMP‑05** | Cambio de AFP con vigencia futura | 1. Editar un empleado activo y cambiar su AFP a otra con vigencia desde una fecha futura. 2. Guardar el cambio. | El sistema debe crear un nuevo registro de AFP para el empleado con `vigencia_inicio` igual a la fecha indicada y mantener la AFP actual hasta el día anterior. |
| **EMP‑06** | Registro de cargas familiares | 1. Agregar cargas familiares (hijos, cónyuge) a un empleado. 2. Validar que el número de cargas y la documentación de acreditación se registren. | El sistema calcula la asignación familiar correspondiente al tramo de ingresos del empleado y la incorpora en la nómina cuando corresponda. |
| **EMP‑07** | Cambio de jornada laboral | 1. Modificar la jornada de un empleado en una fecha posterior al inicio del contrato. 2. Guardar los cambios. | El sistema valida que la nueva jornada no supere el límite legal vigente (40, 42, 44 o 45 horas) y actualiza la información para los periodos siguientes. |

## Consideraciones generales

* Cada prueba debe ejecutarse en un entorno controlado con parámetros legales vigentes para el periodo correspondiente.
* Los RUT deben verificarse utilizando el algoritmo de dígito verificador para evitar registros inválidos.
* Las pruebas deben repetirse cuando cambien las normativas (por ejemplo, actualización del IMM o de las tasas previsionales) para garantizar que las validaciones se adaptan a los nuevos valores.
