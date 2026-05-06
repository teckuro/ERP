# Prevalidaciones 9.5B – Parte B

La fase **9.5B** complementa las prevalidaciones iniciales (9.5A) con controles sobre conceptos, haberes recurrentes y movimientos variables antes de ejecutar el motor de liquidación.

## Validaciones incluidas (Parte B)

| Código | Descripción | Acción |
|---|---|---|
| **PV‑07** | **Haberes recurrentes**: verificar que cada empleado tenga registrados sus haberes recurrentes (sueldo base, gratificación, asignaciones permanentes) y que las fechas de vigencia no hayan expirado. | **Advertencia** si faltan haberes no imponibles; **bloqueo** si falta el sueldo base o la gratificación cuando es obligatoria. |
| **PV‑08** | **Conceptos no clasificados**: comprobar que todos los conceptos utilizados en haberes y descuentos tengan definida su clasificación (`afecta_imponible`, `afecta_liquido`, `afecta_lre`) y un código LRE asignado. | **Bloqueo** si algún concepto carece de clasificación o código. |
| **PV‑09** | **Movimientos variables pendientes**: detectar movimientos variables en estado `registrado` o `rechazado` que no deben incluirse en la nómina del periodo. | **Advertencia** para el usuario, dando la opción de aprobarlos o descartarlos antes de calcular. |
| **PV‑10** | **Tope de gratificación**: validar que la suma de gratificaciones pagadas a cada empleado no supere 4,75 IMM. Si se utiliza la modalidad de 25 %, verificar que se aplique el tope. | **Bloqueo** si se excede el tope. |
| **PV‑11** | **Horas extraordinarias**: verificar que las horas extraordinarias registradas no superen el límite mensual y que el recargo sea al menos del 50 %. | **Bloqueo** si se exceden horas o recargos incorrectos. |
| **PV‑12** | **Cotizaciones y topes imponibles**: calcular las cotizaciones previsionales esperadas (AFP, salud, AFC, SIS, Ley 16.744, SANNA) y compararlas con los montos registrados en la pre‑nómina. Verificar que no excedan los topes imponibles vigentes. | **Bloqueo** si existen diferencias o si se supera un tope. |
| **PV‑13** | **Impuesto único**: simular la retención del impuesto único de segunda categoría para cada empleado y comparar con el valor registrado en la pre‑nómina. | **Advertencia/Bloqueo** dependiendo de la diferencia. |

## Flujo de validación

1. Se ejecutan las validaciones de la parte A (PV‑01 a PV‑06) para asegurar la base de datos.
2. Se recuperan todos los haberes recurrentes y movimientos variables aprobados para el periodo y se aplican las reglas de clasificación de conceptos.
3. Se ejecutan las validaciones PV‑07 a PV‑13, generando un reporte de resultados. Los errores deben resolverse antes de continuar con el motor de liquidación.
4. Una vez superadas todas las prevalidaciones, el proceso avanza a la fase de cálculo de la nómina.

Estas validaciones reducirán significativamente los errores en la liquidación y facilitarán la generación del LRE y la declaración a Previred.
