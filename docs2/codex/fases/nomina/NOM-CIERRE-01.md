# NOM-CIERRE-01 - Implementar cierre operativo controlado

## Objetivo

Implementar el cierre operativo del snapshot aprobado vigente para congelar el resultado del periodo.

## Alcance

- Estado de cierre.
- RPC atomica recomendada.
- UI `Cerrar nomina del periodo`.
- Bloqueo de recalculo/guardado/aprobacion.
- Recuperacion al recargar.
- E2E extendido.

## Fuera de alcance

- Reapertura.
- Liquidaciones oficiales.
- PDF.
- Previred/LRE/banco/contabilidad.
- Cierre legal.

## Estado actual

**Estado:** `futura`  
**Tipo:** `funcional`  
**Modulo:** `Nomina mensual`

No implementada. Depende de aprobar `NOM-CIERRE-DESIGN-01`.

## Dependencias

- NOM-CIERRE-DESIGN-01 aprobado.
- E2E real nomina cerrado.

## Evidencia

- Pendiente.

## Reglas funcionales

- Solo cierra snapshot activo aprobado.
- No toca `periodo_remuneracion` en v1 salvo decision contraria.
- No genera liquidaciones.

## Flujo resumido

```txt
snapshot activo aprobado
-> confirmar cierre
-> RPC cierre
-> marcar cerrado
-> bloquear acciones
-> recuperar al recargar
```

## Archivos relacionados

- `modulos/nomina-mensual/README.md`
- `modulos/nomina-mensual/contrato-general.md`

## Validacion esperada

- Unitarios service/repository/container.
- SQL/RPC si aplica.
- E2E real con cierre.
- Build.

## Criterios de cierre

- Cierre persistido.
- Acciones bloqueadas.
- Sin salidas legales generadas.

## Pendientes

- Diseno aprobado.
- Definir SQL/RPC final.

## Relacion con fases siguientes

`LIQ-DESIGN-01`.
