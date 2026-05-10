# Liquidaciones oficiales

## Estado

**Futura. No implementada.**

Este modulo se documenta para preparar el camino despues del cierre operativo de nomina. No debe leerse como funcionalidad existente.

## Objetivo futuro

Generar y consultar liquidaciones oficiales desde una nomina cerrada operativamente, usando como fuente el snapshot cerrado y no un recalculo libre.

## Alcance futuro esperado

- Generar liquidacion oficial por trabajador/periodo.
- Consultar liquidacion desde RRHH.
- Mantener trazabilidad hacia `id_calculo_periodo` cerrado.
- Separar estado interno de liquidacion de salidas externas.

## Fuera de alcance actual

- PDF oficial.
- Firma.
- Envio al trabajador.
- Previred.
- LRE.
- Archivo banco.
- Contabilidad.

## Dependencias

```txt
NOM-CIERRE-DESIGN-01
-> NOM-CIERRE-01
-> LIQ-DESIGN-01
-> LIQ-OFICIAL-01
```

## Documentos relacionados

- `../../fases/nomina/LIQ-DESIGN-01.md`
- `../../fases/nomina/LIQ-OFICIAL-01.md`
- `../nomina-mensual/contrato-general.md`
- `../../orquestador/mapa-global-fases.md`
