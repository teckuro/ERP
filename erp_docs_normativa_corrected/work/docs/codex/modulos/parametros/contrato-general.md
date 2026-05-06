# Parametros – contrato general

## Objetivo

Unificar criterios del modulo Parametros para el periodo activo, la distincion entre datos mensuales, vigencia y catalogos globales, y definir el comportamiento de la UI. Evita duplicar reglas definidas en documentos de detalle.

## Alcance

- Periodo global activo (`periodo_remuneracion`) y su estado.
- Capas de datos: **mensual**, **vigencia**, **catalogo** y **configuracion de empresa**.
- Estado del periodo y reglas de transicion.
- Guias de UI para la pantalla `/parametros`.
- No cubre la carga normativa en detalle (ver `carga-parametros-python.md`).

## Principios

1. **Periodo activo**: El periodo `YYYY-MM` es contexto global. No todo dato depende exclusivamente de el; por ejemplo, catalogos globales no se deben filtrar por periodo.
2. **Tres capas de datos**: Mensual (snapshot del periodo), Vigencia (versionado por fechas), Catalogo global (sin periodo) y Configuracion de empresa.
3. **Estado del periodo**: `periodo_remuneracion.estado` es la fuente oficial con valores `pendiente`, `parcial`, `cargado`, `corregido`, `cerrado` o `error`. 
4. **UI coherente**: La UI debe mostrar mensajes que distingan entre “no hay datos para este periodo” y “no existen registros en el catalogo”.
5. **Separacion de responsabilidades**: La carga de datos, la UI y los calculos no deben mezclarse.

## Archivos relacionados

- `vigencia-y-periodo.md` – clasificacion y tabla diagnostica.
- `carga-parametros-python.md` – instrucciones de carga mensual y vigencias.
- `reforma-pensiones-gradualidad.md` – gradualidad de cotizacion del empleador.
- `orquestador/estado-fases.md` – Fases 1 y 2 relacionadas con este modulo.
 - `../normativa-remuneraciones.md` – valores de Ingreso Mínimo Mensual (IMM), tope de gratificación y reglas legales que impactan la parametrización.

## Pruebas/validacion

- Las tablas mensuales deben existir por periodo y mostrar empty states claros.
- Las tablas de vigencia deben filtrar por solape con el periodo activo.
- Catalogos globales no deben culpar al periodo activo si estan vacios.
- Las cargas Python deben actualizar `periodo_remuneracion.estado` correctamente.
