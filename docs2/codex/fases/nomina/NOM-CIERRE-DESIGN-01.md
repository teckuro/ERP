# NOM-CIERRE-DESIGN-01 - Diseno funcional y tecnico del cierre operativo de nomina

## Objetivo

Definir que significa cerrar operativamente la nomina antes de implementarlo.

## Alcance

- Precondiciones.
- Estados.
- Persistencia candidata.
- RPC propuesta.
- Bloqueos.
- UI conceptual.
- Relacion con liquidaciones.

## Fuera de alcance

- Implementacion.
- SQL real.
- Cierre legal.
- Liquidaciones.
- Reapertura.

## Estado actual

**Estado:** `en_diseno`  
**Tipo:** `arquitectura`  
**Modulo:** `Nomina mensual`

Documento de diseno en revision. Recomendacion: cierre v1 en `nomina_calculo_periodo`, no tocar `periodo_remuneracion`, usar RPC atomica, sin reapertura v1.

## Dependencias

- E2E real validado.
- Aprobacion operativa persistida.

## Evidencia

- Documento de diseno.
- Mapa global de fases.

## Reglas funcionales

- Cierre operativo no es cierre legal.
- No emite liquidaciones ni salidas legales.
- Debe bloquear recalculo/reemplazo si esta vigente.

## Flujo resumido

```txt
resultado guardado
-> aprobacion operativa
-> cierre operativo
-> congelar resultado
-> preparar liquidaciones futuras
```

## Archivos relacionados

- `fases/nomina/NOM-CIERRE-DESIGN-01.md`
- `modulos/nomina-mensual/contrato-general.md`

## Validacion esperada

- Revision producto/tecnica.
- Decisiones pendientes actualizadas.

## Criterios de cierre

- Decidir persistencia.
- Decidir advertencias.
- Decidir RPC.
- Aprobar alcance v1.

## Pendientes

- Aprobar diseno para implementar `NOM-CIERRE-01`.

## Relacion con fases siguientes

`NOM-CIERRE-01`.
