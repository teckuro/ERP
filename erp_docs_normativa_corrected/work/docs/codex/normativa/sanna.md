# Seguro SANNA – Licencia Médica Parental Extendida

El seguro para la licencia médica parental extendida (SANNA) financia el período adicional de licencia cuando un hijo o hija padece una enfermedad grave.  Está regulado por la Ley 21.063 y se financia con un aporte de cargo del empleador.

## Características

* La tasa del seguro SANNA se determina por ley y se recauda junto con las demás cotizaciones previsionales.
* El beneficio cubre un porcentaje de la remuneración imponible durante la licencia médica parental extendida.

## Implementación en el ERP

* Incluir un parámetro `sanna_parametro.tasa` en la base de datos o, en su defecto, en parámetros globales.
* Al calcular la nómina, agregar la cotización SANNA a cargo del empleador cuando corresponda.
* Validar la vigencia de la tasa y registrar cualquier cambio informado por la Superintendencia de Seguridad Social o la ley respectiva.

## Fuente normativa

| Campo | Valor |
|---|---|
| **Fuente oficial** | Ley 21.063 |
| **Documento / página** | Licencia Médica Parental Extendida (SANNA) |
| **URL oficial** | [www.suseso.cl](https://www.suseso.cl/) |
| **Fecha de vigencia** | 2017‑01‑01 (entrada en vigencia) |
| **Fecha de revisión documental** | 2026‑05‑05 |
| **Tipo de dato ERP** | TASA |
| **Módulo responsable** | Parámetros / Nómina |
