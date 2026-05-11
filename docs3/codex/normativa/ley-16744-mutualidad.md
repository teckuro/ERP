# Ley� 16.744 sobre accidentes del trabajo y enfermedades profesionales

La Ley� 16.744 establece un seguro obligatorio para proteger a los trabajadores en caso de accidentes del trabajo y enfermedades profesionales.  Administra las prestaciones médicas y económicas a través de las mutualidades de empleadores y el Instituto de Seguridad Laboral (ISL).

## Principales obligaciones del empleador

* **Cotización adicional**: El empleador debe pagar una cotización adicional diferenciada según la siniestralidad de la empresa.  Las tasas se fijan mediante un decreto supremo y se actualizan periódicamente.
* **Afiliación**: Las empresas deben estar afiliadas a una mutualidad (ACHs, IST, etc.) o al ISL, y deben comunicar sus actividades para clasificar el riesgo.
* **Prevención**: La ley obliga a implementar medidas de prevención de riesgos y a contar con comités paritarios en ciertas condiciones.


## Tasas legales y componentes

La Ley� 16.744 se financia mediante tres cotizaciones: una básica general, una adicional diferenciada y, en algunos periodos, una cotización extraordinaria.� Los valores oficiales vigentes son los siguientes:

| Concepto | Tipo | Valor y observaciones |
|---|---|---|
| **Cotización básica general** | Normativa | **0,90� %** de la remuneración imponible.� Es de cargo del empleador y se aplica a todas las empresas. |
| **Cotización adicional diferenciada** | Empresa | Tasa variable fijada por decreto supremo según la siniestralidad y el riesgo de la actividad económica de la empresa.� No puede exceder el **3,4� %** de la remuneración imponible. |
| **Cotización extraordinaria** | Normativa | Tasa transitoria destinada a financiar prestaciones adicionales.� Fue de **0,015� %** hasta 2018 y disminuyó a **0,01� %** en 2019; actualmente su valor se indica en los decretos vigentes. |

## Implementación en el ERP

Para implementar correctamente la Ley� 16.744 se deben distinguir tres componentes:

* **Cotización básica general:** almacenar el valor oficial (0,90� % o el que indique la normativa) y su vigencia en la tabla `ley_16744_parametros`.� Este valor se aplica a todas las empresas.
* **Cotización extraordinaria:** registrar la tasa extraordinaria vigente, cuando exista, también en `ley_16744_parametros` con sus fechas de vigencia.
* **Cotizacion adicional diferenciada:** configurar una tasa variable por empresa en `empresa_ley_16744`, con campos `tasa_adicional_diferenciada`, `vigencia_inicio`, `vigencia_fin` e `id_organismo_administrador_ley_16744`. Esta tasa se determina por decreto supremo y puede cambiar en cada proceso de evaluacion.
* **Organismo administrador:** registrar la mutualidad o el Instituto de Seguridad Laboral en `organismo_administrador_ley_16744` y asignarla a cada empresa mediante `empresa_ley_16744.id_organismo_administrador_ley_16744`.

El módulo de **Parámetros** deberá mantener estas tasas y sus vigencias, mientras que el módulo de **Empleados** debe registrar la afiliación de la empresa y del trabajador.� Al calcular la nómina, el sistema sumará la cotización básica, la extraordinaria (si corresponde) y la cotización adicional a las demás cotizaciones previsionales, aplicando los topes imponibles cuando corresponda.

## Fuente normativa

| Campo | Valor |
|---|---|
| **Fuente oficial** | Ley� 16.744 y decretos supremos sobre accidentabilidad |
| **Documento / página** | Disposiciones sobre financiamiento del seguro de accidentes del trabajo |
| **URL oficial** | [www.dt.gob.cl](https://www.dt.gob.cl/) / [www.leychile.cl](https://www.leychile.cl/) |
| **Fecha de vigencia** | 1968-02-01 (ley original), últimas modificaciones vigentes al 2026 |
| **Fecha de revisión documental** | 2026-05-05 |
| **Tipo de dato ERP** | VIGENCIA / TASA |
| **Módulo responsable** | Empresa / Parámetros / Nómina |
