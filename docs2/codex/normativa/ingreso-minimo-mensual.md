# Ingreso Mínimo Mensual (IMM)

El Ingreso Mínimo Mensual (IMM) es la base legal sobre la cual se determina el sueldo mínimo que debe recibir un trabajador con jornada ordinaria.  La Ley� 21.751 reajustó sus valores y el dictamen **E.151696/2025** de la Dirección del Trabajo fijó la vigencia de los nuevos montos.

## Valores vigentes

| Vigencia | Trabajadores de 18-65� años | Trabajadores menores de 18 o mayores de 65� años | Uso no remuneracional |
|---------|----------------------------|--------------------------------------------------|-----------------------|
| **Desde 01-05-2025** | $529� 000 | $394� 622 | $340� 988 |
| **Desde 01-01-2026** | $539� 000 | $402� 082 | $347� 434 |

> **Nota:** El IMM para trabajadores mayores de 18 y hasta 65� años vigente desde el **1� de enero de� 2026** es de **$539� 000**.� Este valor está respaldado por la Ley� 21.751 y los dictámenes de la Dirección del Trabajo.

## Fuente normativa

| Campo | Valor |
|---|---|
| **Fuente oficial** | Dirección del Trabajo |
| **Documento / página** | Ley� 21.751 y dictámenes E.151696/2025 sobre reajuste del ingreso mínimo |
| **URL oficial** | [www.dt.gob.cl](https://www.dt.gob.cl/) |
| **Fecha de vigencia** | 2026-01-01 |
| **Fecha de revisión documental** | 2026-05-05 |
| **Tipo de dato ERP** | PERIODO_MENSUAL |
| **Módulo responsable** | Parámetros / Nómina |

## Uso en el ERP

* El campo `parametros_generales.sueldo_minimo` debe actualizarse cada vez que cambian los valores del IMM.  El módulo de Parámetros será responsable de cargar estos datos.
* Al crear o modificar un contrato en el módulo **Empleados**, el sistema debe verificar que el sueldo base del trabajador sea al menos igual al IMM vigente para su tramo de edad.
* El IMM sirve como base para otros cálculos, como el tope de 4,75� IMM aplicable a la gratificación legal (artículo� 50) y límites en algunas indemnizaciones.

Consulte `versionado-normativo.md` para revisar la vigencia futura del IMM y otras normas.
