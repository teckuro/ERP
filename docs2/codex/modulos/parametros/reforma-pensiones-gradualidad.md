# Reforma de pensiones - gradualidad de cotizacion del empleador

## Objetivo

Documentar la gradualidad de la cotizacion del empleador segun la reforma previsional y su aplicacion en el sistema. No calcula liquidaciones ni descuentos; solo persiste y presenta la informacion normativa.

## Fuentes normativas

- Ministerio de Hacienda, noticia del 11 de junio de 2025: “Implementacion de la reforma previsional”.
- ChileAtiende, ficha “Aportes del empleador al Sistema de Pensiones”.
- Ley N° 21.735, articulo cuarto transitorio.
- Fecha de revision: 2026-05-01.

## Criterio de aplicacion

La gradualidad se aplica por periodo de devengamiento de la remuneracion, no por mes de pago. 
Por ejemplo, agosto de 2025 se refiere a remuneraciones devengadas en ese mes.

## Tramos de gradualidad

| Vigencia | Cuenta individual | CRP | Seguro Social / SIS / CEV | Total empleador |
|---------|------------------:|----:|--------------------------:|----------------:|
| Ago� 2025 - Jul� 2026 | 0,10 % | 0,00 % | 0,90 % | 1,00 % |
| Ago� 2026 - Jul� 2027 | 0,10 % | 0,90 % | 2,50 % | 3,50 % |
| Ago� 2027 - Jul� 2028 | 0,25 % | 1,50 % | 2,50 % | 4,25 % |
| Ago� 2028 - Jul� 2029 | 1,00 % | 1,50 % | 2,50 % | 5,00 % |
| Ago� 2029 - Jul� 2030 | 1,70 % | 1,50 % | 2,50 % | 5,70 % |
| Ago� 2030 - Jul� 2031 | 2,40 % | 1,50 % | 2,50 % | 6,40 % |
| Ago� 2031 - Jul� 2032 | 3,10 % | 1,50 % | 2,50 % | 7,10 % |
| Ago� 2032 - Jul� 2033 | 3,80 % | 1,50 % | 2,50 % | 7,80 % |
| Ago� 2033 en adelante | 4,50 % | 1,50 % | 2,50 % | 8,50 % |

Las columnas `Cuenta individual`, `CRP` y `Seguro Social/SIS/CEV` suman el aporte total del empleador. 
La persistencia se realiza en la tabla `reforma_previsional_parametro`, que contiene los campos adicionales necesarios para separar la distribucion.

## Validaciones

- La suma de las columnas debe coincidir con el total.
- Los tramos no deben solaparse.
- Un periodo dado debe caer en un unico tramo.
- Validaciones minimas: 2025-08 = 1,00 %, 2026-08 = 3,50 %, 2033-08 = 8,50 %.

## Persistencia y carga

- La tabla `reforma_previsional_parametro` se utiliza para almacenar los tramos.
- Los scripts Python (`02_normativa_base_v611.py` y `04_render_parametros_mensuales_v611_sql_full.py`) generan y actualizan los tramos de forma idempotente.
- No se genera un registro mensual por cada periodo; se aplican por vigencia.

## UI

- La vista se encuentra en `Parametros > Reforma de Pensiones > Gradualidad`.
- Muestra las columnas de la tabla y un estado calculado contra el periodo activo: **Vigente**, **Futuro** u **Historico**.

## QA

- Ejecutar las validaciones Python y SQL.
- Verificar que los tramos se muestren correctamente en la UI y no haya scroll horizontal global.
