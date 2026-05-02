# Reforma de Pensiones - gradualidad cotizacion empleador

## Fuente normativa

- Fuente principal: Ministerio de Hacienda, noticia del 11 de junio de 2025, "Implementacion de la reforma previsional: Nueva cotizacion del empleador regira a partir de la remuneracion de agosto de 2025".
- Fuente complementaria: ChileAtiende, ficha "Aportes del empleador al Sistema de Pensiones".
- Referencia legal: Ley N° 21.735, articulo cuarto transitorio.
- Fecha de revision Codex: 2026-05-01.

## Criterio de aplicacion

La gradualidad se aplica por periodo de devengamiento de la remuneracion, no por mes de pago. Agosto 2025 significa remuneraciones devengadas en agosto 2025.

Esta fase solo persiste y muestra la configuracion normativa. No calcula liquidaciones, descuentos ni aportes finales.

## Tabla versionada

| Vigencia | Cuenta individual | CRP | Seguro Social / SIS / CEV | Total empleador |
|---|---:|---:|---:|---:|
| Agosto 2025 a julio 2026 | 0,10 % | 0,00 % | 0,90 % | 1,00 % |
| Agosto 2026 a julio 2027 | 0,10 % | 0,90 % | 2,50 % | 3,50 % |
| Agosto 2027 a julio 2028 | 0,25 % | 1,50 % | 2,50 % | 4,25 % |
| Agosto 2028 a julio 2029 | 1,00 % | 1,50 % | 2,50 % | 5,00 % |
| Agosto 2029 a julio 2030 | 1,70 % | 1,50 % | 2,50 % | 5,70 % |
| Agosto 2030 a julio 2031 | 2,40 % | 1,50 % | 2,50 % | 6,40 % |
| Agosto 2031 a julio 2032 | 3,10 % | 1,50 % | 2,50 % | 7,10 % |
| Agosto 2032 a julio 2033 | 3,80 % | 1,50 % | 2,50 % | 7,80 % |
| Agosto 2033 a julio 2045 | 4,50 % | 1,50 % | 2,50 % | 8,50 % |

## Persistencia

Se usa la tabla existente `reforma_previsional_parametro`; no se crea una tabla nueva.

Columnas agregadas para separar la distribucion:

- `codigo`
- `cotizacion_rentabilidad_protegida`
- `seguro_social_sis_cev`
- `ley_referencia`
- `observacion`

`fapp_seguro_social` se mantiene por compatibilidad como suma de `cotizacion_rentabilidad_protegida + seguro_social_sis_cev`.

## Carga Python

`Python/02_normativa_base_v611.py` genera los nueve tramos como catalogo normativo versionado. La carga mensual incorpora esos datos en el JSON final y `Python/04_render_parametros_mensuales_v611_sql_full.py` genera SQL idempotente con `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` y `UPSERT` por `vigencia_inicio`.

Validaciones:

- La suma `cuenta individual + CRP + Seguro Social/SIS/CEV` debe cuadrar con `total empleador`.
- No debe haber rangos solapados.
- Cada periodo probado debe caer en un unico tramo.
- Controles minimos: 2025-08 = 1,00 %, 2026-08 = 3,50 %, 2033-08 = 8,50 %.

## UI

La vista se muestra en `Parametros > Reforma de Pensiones > Gradualidad`.

Columnas:

- Vigencia.
- Cuenta individual.
- CRP.
- Seguro Social / SIS / CEV.
- Total empleador.
- Estado.

El estado se calcula contra el periodo activo de Parametros y marca el tramo como `Vigente para el periodo`, `Futuro` o `Historico`.

## QA

- Ejecutar validacion Python de gradualidad.
- Ejecutar carga mensual en un periodo con fuentes disponibles.
- Ejecutar pruebas Angular y capturas de Parametros si se modifica UI.
- Verificar que no haya scroll horizontal global y que la tabla mantenga scroll interno si el ancho no alcanza.
