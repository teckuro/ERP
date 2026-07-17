# LRE-01 — Exportación Libro de Remuneraciones Electrónico

## LRE-01a — Borrador CSV ✅ (2026-07-05)

- Pantalla `/remuneraciones/lre`
- Borrador CSV desde liquidaciones (`codigo_lre`)
- Pre-validación conceptos sin código LRE
- Reglas: `lre-export.rules.ts`

## LRE-01b — Persistencia + formato DT ✅ (2026-07-17)

- Tabla `nomina_lre_exportacion` + RPC `registrar_exportacion_lre`
- Canales: `csv_borrador`, `formato_dt_v1` (CSV `;` LRE-DT-v1)
- UI registra descarga y muestra última exportación
- Migraciones:
  - `20260717180000_lre_01b_exportacion.sql`
  - `20260717181000_lre_concept_rules.sql` (LRE-CONCEPT-RULES-01 vía `db push`)
- Smoke: `npm run smoke:lre:exportacion:persist`

## Criterio de cierre LRE-01

1. CSV borrador y formato DT descargables desde liquidaciones oficiales.
2. Emisión/exportación registrada en BD (usuario, timestamp, canal, versión).
3. Estrategia LRE en conceptos no directos disponible en BD (migración concept rules).
4. Tests unit + smoke de persistencia.

## Fuera de alcance

- Envío al portal DT / SII
- Firma electrónica
- Previred / banco / contabilidad
