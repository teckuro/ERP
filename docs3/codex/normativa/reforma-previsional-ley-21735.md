# Reforma previsional - Ley� 21.735

La Ley� 21.735 introduce modificaciones al sistema previsional chileno, entre ellas la creación de un **Seguro Social** y cambios en las tasas de cotización.  Esta reforma aún está en discusión y su implementación se realizará de manera gradual.

## Aspectos relevantes

* Se crea un aporte del empleador destinado a un seguro social solidario.
* Se establecen nuevas tasas de cotización que complementan el 10� % obligatorio.
* El detalle de la gradualidad y las fechas de vigencia se especificará en reglamentos posteriores.

## Implementación en el ERP

* Mantener una tabla `reforma_previsional_parametro` para registrar las nuevas tasas y su vigencia cuando sean promulgadas.
* Asegurar que el motor de cálculos pueda sumar cotizaciones adicionales y distribuirlas entre los distintos fondos (AFP, seguro social, APV, etc.).
* Actualizar las validaciones y topes imponibles cuando las nuevas tasas entren en vigor.

## Fuente normativa

| Campo | Valor |
|---|---|
| **Fuente oficial** | Ley� 21.735 (Reforma previsional) |
| **Documento / página** | Proyecto de reforma previsional y documentos asociados |
| **URL oficial** | [www.camara.cl](https://www.camara.cl/) / [www.spensiones.cl](https://www.spensiones.cl/) |
| **Fecha de vigencia** | Pendiente de promulgación |
| **Fecha de revisión documental** | 2026-05-05 |
| **Tipo de dato ERP** | VIGENCIA |
| **Módulo responsable** | Parámetros / Nómina |
