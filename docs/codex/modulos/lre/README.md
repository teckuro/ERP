# LRE — Libro de remuneraciones electrónico

## Cadena de datos

```
Catálogo conceptos → Nómina (motor) → Snapshot (codigo_lre_snapshot) → Liquidación oficial → Borrador LRE CSV
```

El RPC `generar_liquidaciones_oficiales` copia `nomina_calculo_concepto.codigo_lre_snapshot` a `nomina_liquidacion_concepto.codigo_lre`.

## Dependencia del catálogo de conceptos

RRHH mantiene códigos LRE en **Conceptos de remuneración** (`/remuneraciones/conceptos-remuneracion`).  
Documento de cierre: [`../haberes-descuentos/conceptos-remuneracion-lre.md`](../haberes-descuentos/conceptos-remuneracion-lre.md).

Resolución en runtime (`concepto-lre-resolucion.rules.ts`):

1. `codigoLre` desde concepto/asignación (BD).
2. `codigo_motor` del concepto.
3. Fallback `lre-codigo-concepto.rules.ts`.

## Mapeo de referencia (fallback)

| Concepto motor | Código LRE |
|----------------|------------|
| SUELDO_BASE | 2101 |
| BONO | 2113 |
| AFP | 3141 |
| IMPUESTO_UNICO | 3161 |

Sin código directo por diseño: INASISTENCIA, ZONA_EXTREMA, AFP_EMPLEADOR, cotizaciones empleador.

## Pruebas

| Tipo | Comando |
|------|---------|
| Unit LRE | `ng test --watch=false --include=**/lre/**/*.spec.ts` |
| Cadena | `lre-export-chain.rules.spec.ts` |
| Smoke BD | `npm run smoke:lre:exportacion` |
| Fixture | `npm run seed:lre:chain` |
| E2E export | `npm run test:e2e:lre` |
| E2E conceptos | `npm run test:e2e:conceptos-lre` |

## Recalcular liquidaciones existentes

Tras `27_lre_concepto_cierre.sql`: recalcule snapshot y regenere liquidaciones oficiales en nóminas piloto.
