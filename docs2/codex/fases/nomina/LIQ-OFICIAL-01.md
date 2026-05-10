# LIQ-OFICIAL-01 - Implementar liquidaciones oficiales

## Objetivo

Implementar la generacion/consulta de liquidaciones oficiales desde nomina cerrada.

## Alcance

- Crear liquidaciones oficiales.
- Consultar por trabajador/periodo.
- Estado oficial interno.
- Vista usable para RRHH.
- Trazabilidad basica.

## Fuera de alcance

- PDF oficial si no se aprueba dentro de la fase.
- Firma.
- Envio correo.
- Previred/LRE/banco/contabilidad.

## Estado actual

**Estado:** `futura`  
**Tipo:** `funcional`  
**Modulo:** `Liquidaciones oficiales`

No implementada. Se implementara solo despues de diseno aprobado.

## Dependencias

- LIQ-DESIGN-01.
- NOM-CIERRE-01.

## Evidencia

- Pendiente.

## Reglas funcionales

- No recalcular desde parametros actuales.
- Usar snapshot cerrado como fuente.
- Mantener trazabilidad.
- No generar salidas legales externas.

## Flujo resumido

```txt
nomina cerrada
-> generar liquidaciones
-> revisar por trabajador
-> marcar disponibles internamente
```

## Archivos relacionados

- `modulos/liquidaciones-oficiales/README.md`
- `modulos/liquidaciones-oficiales/contrato-general.md`

## Validacion esperada

- Unitarios.
- E2E flujo nomina cerrada -> liquidaciones.
- Build.

## Criterios de cierre

- Liquidacion oficial consultable.
- Fuente cerrada.
- No salidas externas.

## Pendientes

- Diseno aprobado.

## Relacion con fases siguientes

`UX-COMERCIAL-01`.
