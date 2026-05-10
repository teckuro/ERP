# NOM-ATOMIC-01 - Reemplazo atomico/transaccional del resultado guardado

## Objetivo

Guardar/reemplazar snapshot preliminar en una sola operacion transaccional.

## Alcance

- RPC `guardar_nomina_calculo_snapshot`.
- Insercion cabecera/detalles.
- Reemplazo atomico de activo anterior.
- Rollback completo ante error.

## Fuera de alcance

- Cierre.
- Liquidaciones.
- Cambios de formulas.

## Estado actual

**Estado:** `implementada`  
**Tipo:** `persistencia`  
**Modulo:** `Nomina mensual`

Guardado compuesto desde cliente fue reemplazado por RPC transaccional.

## Dependencias

- NOM-SNAPSHOT-01.
- SQL v11.

## Evidencia

- RPC versionada.
- Tests repository/service.
- Validacion BD real posterior.

## Reglas funcionales

- Si falla una parte, no quedan cambios parciales.
- Nuevo snapshot no hereda aprobacion anterior.
- Solo `authenticated` debe ejecutar.

## Flujo resumido

```txt
payload snapshot
-> RPC
-> insertar todo como transaccion
-> desactivar anterior
-> activar nuevo
```

## Archivos relacionados

- `bd/base/v11/partes/20_nomina_calculo_snapshot_rpc.sql`
- `modulos/nomina-mensual/README.md`
- `modulos/nomina-mensual/contrato-general.md`
- `modulos/nomina-mensual/motor-calculo-persistencia-03B.md`
- `orquestador/estado-fases.md`

## Validacion esperada

- Unitarios.
- Validacion SQL/RPC real.

## Criterios de cierre

- RPC transaccional lista.
- Cliente usa una sola llamada.

## Pendientes

- Cierre con RPC separada futura.

## Relacion con fases siguientes

Base para `NOM-DB-APPLY-01`.
