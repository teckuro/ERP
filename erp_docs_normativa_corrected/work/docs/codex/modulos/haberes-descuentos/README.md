# Modulo Haberes y descuentos — guia general

## Objetivo

Administrar asignaciones recurrentes por trabajador alineadas al periodo de remuneracion. Este modulo permite crear, editar y cerrar asignaciones de haberes y descuentos, aplicando reglas de vigencia y asignabilidad.

## Alcance

- Gestion de asignaciones recurrentes por trabajador y concepto.
- Clasificacion de asignaciones por vigencia (Activa, Futura, Vencida, Cerrada, Invalida).
- Cierre o desactivacion controlada de asignaciones.
- Filtros por estado de vigencia y vista historica.
- Integracion con Conceptos (modulo maestro de conceptos).

## Fuera de alcance

- Movimientos variables mensuales (ver `movimientos-variables`).
- Calculo de liquidaciones o proceso mensual completo.
- Catalogo de conceptos (mantenido en `conceptos-remuneracion`).

## Documentos relacionados

| Documento | Descripcion |
|-----------|-------------|
| `contrato-general.md` | Contrato general de asignaciones recurrentes. |
| `movimientos-variables/contrato-general.md` | Domina los movimientos variables mensuales (no recurrentes). |

## Orden de lectura

1. `contrato-general.md` – reglas de negocio y vigencia.
2. `conceptos-remuneracion/decisiones-operativas.md` – reglas de asignabilidad de conceptos.
3. `nomina-mensual/prevalidaciones.md` – integracion con Proceso mensual.
