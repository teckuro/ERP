# LRE — Libro de remuneraciones electrónico

## Cadena de datos

```
Catálogo conceptos → Nómina (motor) → Snapshot (codigo_lre_snapshot) → Liquidación oficial → Borrador / CSV oficial DT
```

El RPC `generar_liquidaciones_oficiales` y **`generar_liquidaciones_nomina`** (F15/F17, migración `20260706180000`) copian `nomina_calculo_concepto.codigo_lre_snapshot` a `nomina_liquidacion_concepto.codigo_lre` (con fallback vía `concepto` → `catalogo_lre`).

Para BD legacy sin la migración: `28_lre_concepto_canonico.sql` o `npm run repair:lre:cadena-bd`.

## Canales de exportación

| Canal | Uso |
|-------|-----|
| `csv_borrador` | Revisión interna (1 fila = 1 concepto) |
| `formato_dt_v1` | Intermedio LRE-01b (legado) |
| `formato_oficial_dt` | Carga masiva Mi DT (1 fila = 1 trabajador, headers códigos) |

Contrato vivo: [`LRE-02-contrato-fase.md`](./LRE-02-contrato-fase.md). UI: franja operativa tipo Previred en `/remuneraciones/lre`.

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
| Smoke persistencia LRE-01b | `npm run smoke:lre:exportacion:persist` |
| Fixture | `npm run seed:lre:chain` |
| Aplicar catálogo BD | `npm run apply:lre:catalogo-bd` |
| Aplicar RPC liquidaciones (conceptos) | `npm run apply:nomina:liquidacion-conceptos-bd` |
| Reparar cadena BD | `npm run repair:lre:cadena-bd` |
| Diagnóstico BD | `node scripts/diag-lre-bd.mjs` |
| E2E export | `npm run test:e2e:lre` |
| E2E conceptos | `npm run test:e2e:conceptos-lre` |

## Recalcular liquidaciones existentes

Tras desplegar `20260706180000_nomina_liquidacion_conceptos.sql`: regenerar liquidaciones desde nómina (paso Cierre o `/remuneraciones/liquidaciones`). Para datos legacy previos al fix: `npm run repair:lre:cadena-bd`.

