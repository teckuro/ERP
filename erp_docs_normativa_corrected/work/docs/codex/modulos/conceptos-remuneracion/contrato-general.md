# Conceptos de remuneracion – contrato general

## Objetivo

Definir el catalogo maestro de conceptos de remuneracion y las reglas que lo rigen. Este contrato establece las propiedades basicas de los conceptos, su asignabilidad y la relacion con otros modulos.

## Alcance

- Campos y atributos de un concepto de remuneracion.
- Estados y vigencias de conceptos.
- Regla de asignabilidad para Haberes y Movimientos variables.
- Relacion con el modulo Haberes y descuentos.

## Campos principales

| Campo | Descripcion | Notas |
|------|-------------|-------|
| Codigo | Identificador unico del concepto. | Alfanumerico. |
| Nombre | Descripcion del concepto. | — |
| Tipo | Clasificacion (Haberes, Descuentos, Otro). | Determina si puede ser asignado manualmente. |
| Origen | Sistema, Protegido, Usuario. | Afecta permisos de edicion. |
| Vigencia inicio/fin | Fechas de vigencia. | La UI deriva chips de vigencia: **Vigente**, **Futuro**, **Vencido** o **Invalido**. |
| LRE | Indicador si participa en la LRE. | — |
| Calculo | Modo de calculo (porcentaje, monto fijo, variable). | No se implementa el motor aqui. |
| Asignable | Booleano derivado (`esConceptoAsignable`). | Solo conceptos asignables pueden ser usados en Haberes y Movimientos variables. |

## Regla de asignabilidad

Un concepto es asignable si cumple:

- Tipo de concepto permite asignaciones manuales.
- No esta vencido ni marcado como invalido.
- Posee todas las propiedades necesarias para su calculo.
- No tiene dependencias incompletas (por ejemplo, formula pendiente).

La funcion `esConceptoAsignable` se comparte con `HaberesDescuentosService` y `MovimientosVariablesService`.

## Vigencia derivada

- **Vigente**: la fecha de referencia cae dentro de `vigencia_inicio` y `vigencia_fin` (o no existe fin).
- **Futuro**: `vigencia_inicio` es mayor a la fecha de referencia.
- **Vencido**: `vigencia_fin` es menor a la fecha de referencia.
- **Invalido**: fechas incoherentes (`vigencia_fin` menor que `vigencia_inicio`) o sin fecha valida.

## Archivos relacionados

- `decisiones-operativas.md` – decisiones de fase 9.2 sobre listado, detalle y filtros.
- `haberes-descuentos/contrato-general.md` – asignaciones recurrentes.
- `movimientos-variables/contrato-general.md` – movimientos variables mensuales.
 - `../normativa-remuneraciones.md` – definiciones legales de remuneración, gratuidad, ingreso mínimo y criterios de exclusión; los conceptos deben clasificarse correctamente según constituyan o no remuneración.
