# Modulo Parametros — guia general

## Objetivo

Gestionar el periodo de remuneracion, distinguir entre datos mensuales, vigencias y catalogos globales, y proporcionar una UI consistente para la configuracion del sistema. Este modulo tambien incluye la carga de parametros mediante scripts Python y la reforma previsional.

## Alcance

- Determinar el periodo activo `YYYY-MM`.
- Administrar tablas por **periodo mensual**, **vigencia** y **catalogos globales**.
- Cargar datos normativos y mensuales con scripts Python.
- Presentar la UI `/parametros` con bandas, tabs y filtros.
- Documentar la reforma previsional y gradualidad (8,5 %).
- Sincronizacion y permisos de ejemplo.

## Fuera de alcance

- Calculo de liquidaciones o remuneraciones (ver modulo Nomina mensual).
- Implementacion de RLS/JWT (fase SEG‑01).
- Otros modulos de remuneraciones (Haberes, Conceptos, Movimientos variables).

## Documentos relacionados

| Documento | Descripcion |
|-----------|-------------|
| `contrato-general.md` | Resumen y principios del modulo Parametros. |
| `vigencia-y-periodo.md` | Clasificacion del periodo activo, vigencias y catalogos. |
| `carga-parametros-python.md` | Contrato para la carga mensual con scripts Python v6.11. |
| `reforma-pensiones-gradualidad.md` | Documenta la reforma previsional y la gradualidad de la cotizacion del empleador. |

## Orden de lectura

1. `contrato-general.md`.
2. `vigencia-y-periodo.md` para comprender la clasificacion.
3. `carga-parametros-python.md` si se van a ejecutar cargas o scripts.
4. `reforma-pensiones-gradualidad.md` para informacion normativa.
