# Seguro de Cesantía (AFC)

El Seguro de Cesantía protege a los trabajadores en caso de desempleo.  Se financia con aportes del empleador y del trabajador y es administrado por la Administradora de Fondos de Cesantía (AFC).

## Tasas vigentes

* **Contrato indefinido:** 2,4 % de cargo del empleador y 0,6 % de cargo del trabajador.
* **Contrato a plazo fijo o por obra:** El empleador paga un 3 % y el trabajador no realiza aporte.
* Las tasas pueden variar según modificaciones legales.

## Implementación en el ERP

* Registrar las tasas y sus vigencias en la tabla `afc_parametro` con campos `tipo_contrato`, `tasa_empleador`, `tasa_trabajador`, `vigencia_inicio` y `vigencia_fin`.
* Al asignar un contrato a un empleado, seleccionar la tasa que corresponda según su tipo de contrato (indefinido, plazo fijo, obra o servicio).
* Validar que exista una tasa vigente para el periodo de remuneración; de lo contrario, bloquear la liquidación.

## Fuente normativa

| Campo | Valor |
|---|---|
| **Fuente oficial** | Ley 19.728 sobre Seguro de Cesantía |
| **Documento / página** | Tasas y condiciones de financiamiento del AFC |
| **URL oficial** | [www.dt.gob.cl](https://www.dt.gob.cl/) / [www.afc.cl](https://www.afc.cl/) |
| **Fecha de vigencia** | Vigencias según decreto | 
| **Fecha de revisión documental** | 2026‑05‑05 |
| **Tipo de dato ERP** | VIGENCIA |
| **Módulo responsable** | Parámetros / Empleados / Nómina |
