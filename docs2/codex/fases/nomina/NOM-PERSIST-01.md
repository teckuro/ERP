# NOM-PERSIST-01 - Persistencia formal de aprobacion operativa

## Objetivo

Persistir la aprobacion operativa del resultado preliminar guardado vigente.

## Alcance

- Columnas `aprobacion_operativa_*` en `nomina_calculo_periodo`.
- Repository/service para aprobar resultado activo.
- UI recupera aprobacion al cargar.

## Fuera de alcance

- Cierre.
- Liquidaciones oficiales.
- Previred/LRE/banco.
- Uso de `aprobado_para_liquidacion`.

## Estado actual

**Estado:** `implementada`  
**Tipo:** `persistencia`  
**Modulo:** `Nomina mensual`

Aprobacion operativa queda asociada al `id_calculo_periodo` activo y no se hereda a nuevos snapshots.

## Dependencias

- USAB-NOM-09.
- Snapshot preliminar guardado.

## Evidencia

- Tests unitarios.
- Documentacion en MOTOR-03B.

## Reglas funcionales

- Aprobar no cierra.
- Aprobar no liquida.
- Aprobar no genera salidas legales.
- Nuevo snapshot requiere nueva aprobacion.

## Flujo resumido

```txt
resultado guardado vigente
-> aprobar operativamente
-> persistir aprobacion
-> recargar
-> recuperar aprobacion
```

## Archivos relacionados

- `modulos/nomina-mensual/README.md`
- `modulos/nomina-mensual/contrato-general.md`
- `modulos/nomina-mensual/motor-calculo-persistencia-03B.md`
- `orquestador/estado-fases.md`

## Validacion esperada

- Unitarios repository/service/container.
- Build.

## Criterios de cierre

- Aprobacion persistida y recuperable.
- Duplicado de aprobacion bloqueado.

## Pendientes

- Cierre operativo posterior.

## Relacion con fases siguientes

Base para `NOM-SNAPSHOT-01` y cierre futuro.
