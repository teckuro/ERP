# Contrato general - Liquidaciones oficiales

## Estado

**Futuro. No implementado.**

## Regla principal

Una liquidacion oficial debe nacer desde una nomina operativamente cerrada, no desde un calculo temporal ni desde parametros actuales que puedan haber cambiado.

```txt
snapshot guardado
-> aprobacion operativa
-> cierre operativo
-> liquidacion oficial
```

## Fuente de verdad futura

La fuente esperada sera el `id_calculo_periodo` cerrado operativamente.

## Reglas funcionales futuras

- Una liquidacion oficial debe ser trazable a trabajador, contrato, periodo y snapshot cerrado.
- No debe recalcular impuestos/cotizaciones al consultarse.
- Debe mostrar montos y conceptos del snapshot oficializado.
- Debe separar datos internos de futuras salidas PDF/firma/envio.

## Fuera de alcance

- Previred.
- LRE.
- Banco.
- Contabilidad.
- Firma.
- Envio por correo.
- Reapertura.

## Fases relacionadas

- `../../fases/nomina/LIQ-DESIGN-01.md`
- `../../fases/nomina/LIQ-OFICIAL-01.md`
