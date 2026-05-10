# LIQ-DESIGN-01 - Diseno funcional y tecnico de liquidaciones oficiales

## Objetivo

Disenar el modelo de liquidaciones oficiales despues del cierre operativo.

## Alcance

- Que es una liquidacion oficial.
- Fuente: snapshot cerrado.
- Datos visibles al trabajador/RRHH.
- Estados.
- Auditoria.
- Relacion futura con PDF/firma/envio.

## Fuera de alcance

- Implementacion.
- PDF real.
- Firma.
- Previred/LRE/banco.
- Contabilidad.

## Estado actual

**Estado:** `futura`  
**Tipo:** `arquitectura`  
**Modulo:** `Liquidaciones oficiales`

No implementada. Debe venir despues del cierre operativo.

## Dependencias

- NOM-CIERRE-01.

## Evidencia

- Pendiente.

## Reglas funcionales

- Liquidacion oficial debe provenir de snapshot cerrado, no de recalculo libre.
- No mezclar con Previred/LRE/banco.
- Debe ser trazable y auditable.

## Flujo resumido

```txt
nomina cerrada
-> generar liquidacion oficial
-> revisar datos
-> dejar estado consultable
```

## Archivos relacionados

- `modulos/liquidaciones-oficiales/README.md`
- `modulos/liquidaciones-oficiales/contrato-general.md`

## Validacion esperada

- Documento de diseno aprobado.
- Criterios de cierre definidos.

## Criterios de cierre

- Contrato aprobado.
- Estados y fuente de datos definidos.
- Fuera de alcance explicitado.

## Pendientes

- Diseno completo.

## Relacion con fases siguientes

`LIQ-OFICIAL-01`.
