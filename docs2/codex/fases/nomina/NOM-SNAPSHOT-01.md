# NOM-SNAPSHOT-01 - Snapshot completo consultable desde BD

## Objetivo

Consultar resultado guardado completo desde BD sin recalcular.

## Alcance

- Cabecera.
- Trabajadores.
- Conceptos.
- Observaciones.
- Trazabilidad.
- Aprobacion operativa.

## Fuera de alcance

- Recalcular con datos actuales.
- Cierre/liquidaciones.
- Salidas legales.

## Estado actual

**Estado:** `implementada`  
**Tipo:** `persistencia`  
**Modulo:** `Nomina mensual`

La UI muestra `Resultado guardado desde BD` y recupera el detalle persistido.

## Dependencias

- NOM-PERSIST-01.
- Tablas snapshot.

## Evidencia

- Tests unitarios.
- E2E real posterior.

## Reglas funcionales

- Consulta snapshot historico, no recalcula.
- El dato guardado es la fuente para aprobacion/cierre futuro.

## Flujo resumido

```txt
periodo
-> obtener snapshot activo
-> mostrar resumen/trabajadores/conceptos/observaciones/trazabilidad
```

## Archivos relacionados

- `modulos/nomina-mensual/README.md`
- `modulos/nomina-mensual/contrato-general.md`
- `modulos/nomina-mensual/motor-calculo-persistencia-03B.md`
- `orquestador/estado-fases.md`

## Validacion esperada

- Unitarios repository/service.
- E2E posterior.

## Criterios de cierre

- Resultado guardado visible desde BD.

## Pendientes

- Cierre operativo.

## Relacion con fases siguientes

Base para `NOM-ATOMIC-01`.
