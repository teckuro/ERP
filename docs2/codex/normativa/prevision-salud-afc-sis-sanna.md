# Previsión, salud, AFC, SIS y SANNA

**Nota**: Este documento resume, a nivel de requisitos, las principales obligaciones relacionadas con cotizaciones previsionales y de salud.  No aborda el detalle de las tablas de tasas ni de los contratos con las instituciones.  Se actualizará conforme avance el desarrollo del módulo de parámetros previsionales.

## AFP y cotizaciones previsionales

* Los empleadores deben retener y enterar las cotizaciones previsionales en la Administradora de Fondos de Pensiones (AFP) elegida por cada trabajador.
* La tasa total de cotización se compone del **10� % de ahorro obligatorio**, la **comisión de la AFP** y la prima del **Seguro de Invalidez y Sobrevivencia (SIS)**.� Estas tasas varían por AFP y por periodo y se almacenan en las tablas **`afp`** (catálogo de AFP), **`afp_vigencia`** (tasas y comisiones vigentes) y una tabla de SIS confirmada.

## Salud (Fonasa / Isapres)

* Los trabajadores afiliados a **Fonasa** aportan un **7� %** de su remuneración imponible, hasta el tope legal de salud.
* Los afiliados a **Isapres** pactan un **plan de salud** cuyo valor puede ser superior al 7� %.� La diferencia entre el valor del plan y el 7� % legal se descuenta como cotización voluntaria y no constituye remuneración imponible.

## Seguro de Cesantía (AFC)

* El Seguro de Cesantía se financia con aportes del trabajador y del empleador.� Las tasas se registran en la tabla `afc_parametro`, separando la **tasa del empleador** y la **tasa del trabajador** según el tipo de contrato.
* Para los contratos **indefinidos**, el empleador aporta un **2,4� %** de la remuneración imponible y el trabajador un **0,6� %**.� Para contratos **a plazo fijo o por obra**, el empleador aporta un **3� %** y el trabajador no aporta.

## Seguro de Invalidez y Sobrevivencia (SIS)

* El SIS protege al trabajador en caso de invalidez o fallecimiento.� Su tasa es informada por la Superintendencia de Pensiones y puede variar por periodo.� Al momento de esta revisión (mayo� de� 2026) existen discrepancias sobre la tasa vigente; consulte `sis.md` para conocer el estado actual y las recomendaciones sobre su registro.

## Licencia Médica Parental Extendida (SANNA)

* El seguro **SANNA** financia la licencia medica parental extendida. Se paga con un aporte del empleador que la autoridad revisa periodicamente. En el esquema confirmado por DB-01, la tasa se registra en `parametros_generales.sanna`; no existe una tabla separada `sanna_parametro`.

## Implementación en el ERP

Los módulos de **Parámetros** y **Nómina** deben gestionar y validar las vigencias de todas las tasas y aportes previsionales.� La información se cargará mensualmente desde servicios como **Previred**, según se describe en `parametros/carga-parametros-python.md`.� Las tablas mencionadas en este documento han sido normalizadas de la siguiente manera:

* **AFP:** utilizar `afp` para el catálogo de administradoras y `afp_vigencia` para registrar la tasa obligatoria y la comisión vigente por AFP.
* **Salud:** utilizar `salud` para las instituciones (Fonasa o Isapre) y `salud_plan` para los planes específicos, con sus valores y vigencias.
* **AFC:** utilizar `afc_parametro` para registrar las tasas del seguro de cesantía según el tipo de contrato.
* **SIS:** utilizar una fuente mensual confirmada para la prima del Seguro de Invalidez y Sobrevivencia. La tabla fisica queda pendiente de DB-01; no usar una tabla no confirmada como si existiera ni hardcodear la tasa.
* **SANNA:** mantener la tasa del seguro parental extendido en `parametros_generales.sanna`; cualquier tabla separada futura debe confirmarse en el diccionario canonico.

Se recomienda consultar los documentos específicos -`prevision-afp.md`, `salud-fonasa-isapre.md`, `afc-seguro-cesantia.md`, `sis.md`, `sanna.md` y `reforma-previsional-ley-21735.md`- para mayor detalle sobre cada materia.

## Fuente normativa

| Campo | Valor |
|---|---|
| **Fuente oficial** | Código del Trabajo, Superintendencia de Pensiones y Superintendencia de Seguridad Social |
| **Documento / página** | Leyes y reglamentos sobre previsión social y salud (Ley� 18.933, Ley� 19.728, Ley� 16.744, etc.) |
| **URL oficial** | [www.dt.gob.cl](https://www.dt.gob.cl/) / [www.spensiones.cl](https://www.spensiones.cl/) / [www.suseso.cl](https://www.suseso.cl/) |
| **Fecha de vigencia** | Variable según norma (2026-05-01 en adelante para la mayoría de los valores) |
| **Fecha de revisión documental** | 2026-05-05 |
| **Tipo de dato ERP** | VIGENCIA / CATÁLOGO |
| **Módulo responsable** | Parámetros / Nómina |
