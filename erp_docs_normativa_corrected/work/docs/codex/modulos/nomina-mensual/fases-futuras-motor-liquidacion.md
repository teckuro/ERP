# Fases futuras del motor de liquidación

El presente ERP aún no implementa el motor de cálculo que genera las liquidaciones de sueldo.  Este documento establece un plan preliminar de fases para su desarrollo, separando la validación de parámetros de la ejecución de cálculos.

## Fase 1 – Prevalidaciones (2026‑05)

* Validar que existan los parámetros legales y vigencias (IMM, tasas previsionales, tope de gratificación, etc.).
* Validar contratos activos y haberes recurrentes vigentes.
* Integrar haberes recurrentes y parámetros legales en una pre‑liquidación.
* Registrar bloqueos y advertencias utilizando la matriz de severidad.

## Fase 2 – Cálculo de liquidación (pendiente)

* Implementar el cálculo del sueldo bruto, imponible y tributable en base a las remuneraciones y descuentos definidos.
* Integrar el cálculo del impuesto único de segunda categoría utilizando la tabla de tramos vigente.
* Calcular las cotizaciones previsionales (AFP, salud, AFC, SIS, SANNA) y la mutual.
* Determinar el sueldo líquido a pagar, aplicando gratificación legal y otras reglas según corresponda.

## Fase 3 – Exportaciones y conciliaciones (pendiente)

* Generar los archivos para Previred y otras entidades externas.
* Exportar el Libro de Remuneraciones Electrónico (LRE).
* Conciliar las remuneraciones con la Declaración Jurada N.º 1887 y otras obligaciones tributarias.

Cada fase debe tener su propio plan de pruebas y criterios de cierre, documentados en `plan-pruebas.md` y `criterios-cierre-fases.md`.  Las fechas propuestas son indicativas y pueden ajustarse según las prioridades del proyecto.
