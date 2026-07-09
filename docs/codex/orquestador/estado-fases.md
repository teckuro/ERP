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
