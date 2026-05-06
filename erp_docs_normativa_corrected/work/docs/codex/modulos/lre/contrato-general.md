# Libro de Remuneraciones Electrónico – Contrato general

Este documento establece el alcance funcional del módulo de Libro de Remuneraciones Electrónico (LRE).  El objetivo es permitir al ERP generar, validar y exportar el registro mensual de remuneraciones exigido por la Dirección del Trabajo y el Servicio de Impuestos Internos.

## Alcance

* Modelar las entidades necesarias para representar el libro de remuneraciones: trabajadores, conceptos de haberes y descuentos, cotizaciones y totales.
* Mantener la integridad entre el catálogo de conceptos interno y los códigos LRE.
* Permitir la exportación mensual dentro del plazo legal (primeros 15 días hábiles del mes siguiente).

## Implementación preliminar

Los detalles de la estructura de datos y los endpoints de exportación se definirán en las próximas fases.  Este módulo dependerá de los resultados del proceso mensual (`9.5A`) y de los catálogos de conceptos.
