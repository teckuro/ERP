# Estructura del archivo LRE

El Libro de Remuneraciones Electrónico (LRE) permite subir la información de remuneraciones mediante un archivo **CSV o TXT** con separador **punto y coma (;)**. Este archivo debe cumplir con una estructura fija exigida por la Dirección del Trabajo y el Servicio de Impuestos Internos.

## Campos requeridos

Cada fila del archivo representa a un trabajador en un periodo determinado. Los campos obligatorios incluyen, al menos:

1. **Rut del empleador**: sin puntos ni guion, con dígito verificador.
2. **Rut del trabajador**: sin puntos ni guion, con dígito verificador.
3. **Periodo de remuneración**: en formato `YYYYMM` (por ejemplo, `202604` para abril de 2026).
4. **Fecha de pago**: en formato `YYYY-MM-DD`.
5. **Total haberes imponibles**.
6. **Total haberes no imponibles**.
7. **Cotizaciones previsionales** desglosadas (AFP, salud, AFC, SIS, Ley 16.744, SANNA, etc.).
8. **Descuentos tributarios** y **retención de impuesto único**.
9. **Sueldo líquido pagado**.
10. **Códigos LRE**: cada concepto pagado debe mapearse a un código del catálogo oficial.

Es posible incluir campos opcionales como **horas extraordinarias**, **bonos especiales** o **anticipos**, pero nunca se deben agregar columnas no reconocidas por la plataforma.

## Formato del archivo

* **Separador**: punto y coma (`;`).
* **Codificación**: UTF‑8 sin BOM.
* **Encabezado**: el archivo debe incluir una fila de encabezado con los nombres de los campos oficiales, en el orden exigido.
* **Decimal**: usar coma (`,`) o punto (`.`) según indique la guía oficial. En general, se utiliza el punto como separador decimal.

## Recomendaciones de implementación

* Validar que todos los campos obligatorios estén presentes y en el orden correcto antes de generar el archivo.
* Controlar la longitud y el formato de los RUT y de las fechas.
* Asegurar que los montos numéricos no contengan separadores de miles ni símbolos monetarios.
* Utilizar el catálogo de códigos LRE (`catalogo_lre`) para mapear los conceptos internos a los códigos oficiales.
* Incluir solamente los conceptos pagados en el periodo; no se deben enviar columnas vacías o con cero cuando el campo no corresponde.

Para conocer cómo validar la información antes de la exportación consulte `validaciones-previas-lre.md`.