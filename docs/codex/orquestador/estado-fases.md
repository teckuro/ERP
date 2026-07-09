# Estado de fases — registro LIQ (liquidaciones oficiales)

| Fase | Estado | Entregable |
|------|--------|------------|
| LIQ-AUDIT-01 | Cerrada | `supabase/migrations/20260709120000_liq_revision_auditoria.sql` + cableado frontend auditoría RRHH por trabajador (aplicada BD 2026-07-09) |

Documentación del módulo: [`docs/codex/modulos/liquidaciones-oficiales/README.md`](../modulos/liquidaciones-oficiales/README.md).

# Estado de fases — registro LM (licencias médicas)

> Stub local del orquestador para la integración Licencias médicas por correo (2026-07-08).

| Fase | Estado | Entregable |
|------|--------|------------|
| LM-INGRESO-01 | Cerrada | `supabase/migrations/20260708190000_licencia_medica_ingreso_correo.sql` |
| LM-UI-01 | Cerrada | Feature `src/app/features/licencias-medicas/` + page wrapper |
| LM-NOMINA-01 | Cerrada | `licencias-medicas-novedades.orquestador.ts` |
| LM-WEBHOOK-01 | Cerrada | `supabase/functions/licencia-medica-inbound/` |

Documentación del módulo: [`docs/codex/modulos/licencias-medicas/README.md`](../modulos/licencias-medicas/README.md).

# Estado de fases — registro ADMIN (módulo Administrador)

> Fase autorizada 2026-07-08: usuarios, perfiles configurables y documento de liquidación.

| Fase | Estado | Entregable |
|------|--------|------------|
| ADMIN-01 (BD) | Cerrada | `supabase/migrations/20260708220000_administracion_perfiles_config_doc.sql` |
| ADMIN-01 (Edge) | Cerrada | `supabase/functions/admin-usuarios/` |
| ADMIN-01 (UI) | Cerrada | Feature `src/app/features/administracion/` + `/administracion` + footer sidebar «Administrador» (reemplaza «Configuración») |
| ADMIN-01 (Permisos) | Cerrada | `erp-permisos-modulos.rules.ts` + `permisosModulos` en `ErpPermisosRemuneracionesService` |
| ADMIN-01 (Documento) | Cerrada | `documento-liquidacion.service.ts` + logo/pie en `liquidacion-preview-modal` |

Documentación del módulo: [`docs/codex/modulos/administracion/README.md`](../modulos/administracion/README.md).

# Estado de fases — registro SEC (seguridad transversal)

> Fase de **diagnóstico** autorizada 2026-07-08. Correcciones SEC aplicadas progresivamente (ver filas abajo).

| Fase | Estado | Entregable |
|------|--------|------------|
| AUDIT-SEC-2026-07 | Cerrada (diagnóstico) | [`docs/codex/auditorias/auditoria-seguridad-2026-07.md`](../auditorias/auditoria-seguridad-2026-07.md) — matriz priorizada, verificaciones npm/git, consultas RLS manuales, propuestas SQL/frontend |
| SEC-01 | Cerrada (repo) / rotación manual pendiente | `.gitignore` `supabase/.temp/`, `git rm --cached`, `scripts/supabase-deploy-asistente.ps1` parametrizado |
| SEC-02 | Cerrada (aplicada BD 2026-07-08) | `20260708240000_sec02_rls_legacy_endurecimiento.sql` — RLS tenant empleados/parámetros/concepto |
| SEC-02b | Cerrada (aplicada BD 2026-07-08) | `20260708250000_sec02b_rls_nomina_movvar_anon.sql` — tenant nómina/liquidaciones/Previred/movvar; revoke anon operativo |
| SEC-02c | Cerrada (aplicada BD 2026-07-08) | `20260708260000_sec02c_revoke_anon_rpc.sql` — revoke EXECUTE anon/public en RPC; excl. extensión unaccent |
| SEC-02d | Cerrada (aplicada BD 2026-07-09) | `20260708270000_sec02d_rls_movvar_por_rol.sql` — RLS movvar: escritura por rol/perfil (`sec_movvar_escritura_ok`); consulta solo lectura |
| SEC-02e | Cerrada (aplicada BD 2026-07-09) | `20260708280000_sec02e_rls_modulos_por_rol.sql` — RLS escritura por rol en parámetros, concepto, persona/contrato y tablas hijas; `apply:sec02e-bd` + smoke extendido |
| SEC-03 | Cerrada | `20260708230000_sec03_snapshot_tenant_rls.sql` — validación tenant en RPC + RLS `nomina_calculo_*` + FORCE RLS |
| SEC-04 | Cerrada | Guards en `app.routes.ts` + `empleados.routes.ts`; menú filtrado por `permisosModulos` en sidebar; E2E `test:e2e:sec:guards` |
| SEC-05 | Cerrada (2026-07-09) | Errores humanizados SEC-05b; CORS Edge desplegado; smokes `smoke:sec` + fixture consulta; gates unit empleados/parámetros OK |

**Orden sugerido:** SEC-01 → SEC-03 → SEC-02 → SEC-04 → SEC-05.

**Cierre de paso con SQL:** al terminar una fase SEC con migración, aplicar en BD y registrar historial antes de dar el paso por cerrado:

1. `psql "$env:SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/<archivo>.sql` (o `supabase db push` si el entorno lo usa).
2. Smoke con `scripts/sec-audit-rls-diagnostics.sql` cuando corresponda.
3. `supabase migration repair --status applied <version> --db-url "$env:SUPABASE_DB_URL"` si se aplicó con `psql` y falta en `schema_migrations`.

**BD local:** `npm run apply:sec-bd` (prioriza `SUPABASE_DB_URL_LOCAL`). Runbook: [`SEC-cierre-operaciones-manuales.md`](../auditorias/SEC-cierre-operaciones-manuales.md).

**Relación backlog:** complementa BKL-04…06 y SEG-01b de [`auditoria-proyecto-2026-07-backlog.md`](../auditorias/auditoria-proyecto-2026-07-backlog.md).
