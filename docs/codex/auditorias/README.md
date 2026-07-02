# Auditorias (`docs/codex/auditorias`)

Registro de auditorias funcionales y normativas. Cada archivo es autocontenido; el orquestador enlaza desde `mapa-documentacion.md` y `estado-fases.md` cuando aplique.

| ID / archivo | Tema |
|--------------|------|
| [`auditoria-proyecto-2026-07-backlog.md`](./auditoria-proyecto-2026-07-backlog.md) | AUDIT-PROYECTO-2026-07: backlog priorizado P0/P1/P2 (escala nómina, seguridad SEG-01b/F15b, RLS recurrentes, E2E) tras cierre F06/F07 parcial |
| [`auditoria-estandares-desviaciones-2026-07.md`](./auditoria-estandares-desviaciones-2026-07.md) | AUDIT-EST-2026-07: desviaciones vs EST-001…008; script `scripts/auditar-estandares-desviaciones.ps1`; deriva **BKL-12** |
| [`qa-chile-01-remuneraciones.md`](./qa-chile-01-remuneraciones.md) | Remuneraciones Chile: conceptos, recurrentes, variables, parametros, empleados, proceso futuro, liquidacion, Previred/LRE |
| [`param-chile-01-parametros-y-demo-proceso.md`](./param-chile-01-parametros-y-demo-proceso.md) | PARAM-CHILE-01: auditoria parametros vs UI proceso mensual, cierre ALTO-004 demo |
| [`gratificacion-fix-01-motor.md`](./gratificacion-fix-01-motor.md) | GRATIFICACION-FIX-01: correccion gratificacion legal art. 50 en motor Angular (hallazgos B1/B2/B3 corregidos y validados) |
| [`entradas-prorrateo-fix-02-motor.md`](./entradas-prorrateo-fix-02-motor.md) | ENTRADAS-PRORRATEO-FIX-02 (Fase 2): entradas mensuales y prorrateo por dias en motor Angular (hallazgos B6/B7 corregidos y validados) |
| [`erp-audit-repair-ux-01.md`](./erp-audit-repair-ux-01.md) | ERP-AUDIT-REPAIR-UX-01: auditoría y reparación UX general del ERP |
| [`liquidacion-legacy-deprecacion-01.md`](./liquidacion-legacy-deprecacion-01.md) | Deprecación del flujo legacy de liquidaciones |
| [`auditoria-docs-codex-2026-06-03.md`](./auditoria-docs-codex-2026-06-03.md) | DOCS-AUDIT-02: extiende DOCS-AUDIT-01 con 6 dimensiones (estructura, coherencia, duplicidad, tamaño, frescura, naming) + plan iterativo L0–L7 |

## Política de ubicación de auditorías

- **Auditorías técnicas / motor / SQL / cross-módulo** → vivir aquí (`auditorias/`).
- **Auditorías UX por módulo específico** → pueden vivir en `modulos/<m>/auditoria-*.md` con enlace cruzado a `estado-fases.md`.
- **Auditorías documentales del propio `docs/codex/`** → vivir aquí (`auditorias/`); las más antiguas pueden quedar en `orquestador/` por contexto histórico.
- Toda auditoría con cierre formal debe quedar registrada en [`../orquestador/estado-fases.md`](../orquestador/estado-fases.md) (o su descendiente por dominio tras L4).
