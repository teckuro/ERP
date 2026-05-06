# Asignación familiar y subsidio único familiar

La asignación familiar es un beneficio estatal destinado a los trabajadores con cargas familiares.  Está regulada por la **Ley 21.751** y las normas de la Superintendencia de Seguridad Social (SUSESO).  Este documento ofrece una descripción general; el detalle de montos y tramos se actualizará conforme lo publique la autoridad.

## Tramos y montos vigentes

La Superintendencia de Seguridad Social (SUSESO) publica los montos de asignación familiar y subsidio único familiar para cada tramo de ingresos. Desde el **1 de enero de 2026** se aplican los siguientes valores:

| Tramo (ingreso promedio mensual) | Monto por carga acreditada | Observaciones |
|---|---|---|
| **Hasta $631.976** | **$22.007** | Tramo 1: asignación familiar más alta. |
| **$631.977 – $923.067** | **$13.505** | Tramo 2. |
| **$923.068 – $1.439.668** | **$4.267** | Tramo 3. La diferencia entre $4.267 y valores cercanos como $4.276 en otras fuentes se debe a errores de digitación; se adopta el valor oficial de SUSESO. |
| **Sobre $1.439.668** | **$0** | Tramo 4: sin derecho a asignación familiar ni SUF. |

Además de la asignación familiar, las personas sin derecho pueden acceder al **Subsidio Único Familiar (SUF)**, cuyo monto coincide con el Tramo 1 de la asignación familiar y se otorga previa acreditación en la municipalidad correspondiente.

## Características

* La asignación familiar se paga por cada carga familiar acreditada (cónyuge, hijos, ascendientes u otros dependientes que cumplan los requisitos legales).
* El **ingreso promedio** que determina el tramo se calcula en un periodo definido por la SUSESO (generalmente el año calendario anterior). El módulo debe permitir registrar este dato o calcularlo a partir de las remuneraciones registradas.
* Existe un **subsidio único familiar (SUF)** para personas de menores ingresos que no cumplen los requisitos para recibir la asignación familiar ordinaria.
* Los montos se reajustan periódicamente junto con el Ingreso Mínimo Mensual.

## Implementación en el ERP

* El módulo de **Empleados** debe registrar las cargas familiares acreditadas (aprobadas por la caja de compensación o por la municipalidad) y validar los requisitos exigidos por la SUSESO.
* Los valores de asignación familiar y SUF se almacenan en la tabla `tramo_carga`, con campos `periodo`, `tramo`, `monto` y `vigencia_inicio`/`vigencia_fin`. El módulo de **Parámetros** será responsable de cargar y actualizar esta tabla.
* La asignación familiar y el SUF son **ingresos no imponibles**, por lo que deben clasificarse correctamente para no afectar las cotizaciones previsionales ni el impuesto único. Consulte `remuneracion‑imponible‑no‑imponible.md` para más detalles.

## Fuente normativa

| Campo | Valor |
|---|---|
| **Fuente oficial** | Superintendencia de Seguridad Social (SUSESO) |
| **Documento / página** | Tabla de montos de asignación familiar y subsidio único familiar vigentes |
| **URL oficial** | [www.suseso.cl](https://www.suseso.cl/) |
| **Fecha de vigencia** | 2026‑01‑01 |
| **Fecha de revisión documental** | 2026‑05‑05 |
| **Tipo de dato ERP** | VIGENCIA/TRAMO |
| **Módulo responsable** | Parámetros / Empleados / Nómina |
