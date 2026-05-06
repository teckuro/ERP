# Catálogo del Libro de Remuneraciones Electrónico

El catálogo LRE es un mapeo entre los conceptos internos del ERP y los códigos exigidos por el Servicio de Impuestos Internos y la Dirección del Trabajo.

## Objetivo

* Asegurar que cada concepto de remuneración se reporte con el código correcto en el archivo LRE.
* Facilitar la actualización de códigos cuando la normativa cambie.

## Contenidos

* Tabla `catalogo_lre` con campos `codigo`, `descripcion`, `afecta_imponible`, `afecta_tributable`, `vigencia_inicio`, `vigencia_fin`.
* Procedimientos para mantener la integridad referencial entre `concepto` y `catalogo_lre`.
