-- =============================================================================
-- 20260610170000_nomina_periodo_delete_policy_estados_eliminables.sql
--
-- Contexto:
--   La UI "Administrador de nóminas" expone una acción única **Eliminar nómina**
--   (hard-delete) para estados no productivos (`borrador`, `dotacion_generada`,
--   `en_revision`, `anulada`). Ver `puedeEliminar()` en
--   `src/app/features/nomina-mensual/rules/admin-nominas.rules.ts`.
--
-- Problema:
--   La política RLS previa de DELETE en `public.nomina_periodo` estaba acotada a
--   `estado = 'borrador'`, lo que silenciosamente bloqueaba (0 filas afectadas,
--   sin error visible vía PostgREST) los DELETE para los demás estados
--   habilitados desde la UI. Resultado: el usuario veía "todo bien" pero la
--   fila quedaba en BD, ocupando el slot `UNIQUE (id_empresa, periodo, tipo)`
--   y bloqueando recrear la nómina del mismo período.
--
-- Cambio:
--   Reemplazar la policy `nomina_periodo_delete` para autorizar DELETE en los
--   mismos estados que el client-side rule habilita. Los estados productivos
--   (`calculada`, `validada`, `aprobada`, `cerrada`, `reabierta`) permanecen
--   protegidos a nivel de fila: aunque alguien intente forzar el DELETE
--   bypass-eando la UI, PostgreSQL lo rechazará.
--
-- Invariantes preservados:
--   - `id_empresa = current_user_empresa_id()`: el tenant scoping de empresa
--     activa NO se relaja. Un usuario nunca puede borrar nóminas de otra empresa.
--   - FKs `on delete cascade` ya declaradas en F2 limpian segmentos,
--     movimientos, incidencias y eventos de auditoría asociados.
--   - El grant `delete on public.nomina_periodo to authenticated` ya existía
--     (línea 464 de la migración F2); no se necesita re-otorgar.
--
-- Idempotente: `drop policy if exists ... create policy ...`.
-- =============================================================================

drop policy if exists nomina_periodo_delete on public.nomina_periodo;
create policy nomina_periodo_delete on public.nomina_periodo
  for delete to authenticated
  using (
    id_empresa = public.current_user_empresa_id()
    and estado in ('borrador', 'dotacion_generada', 'en_revision', 'anulada')
  );

comment on policy nomina_periodo_delete on public.nomina_periodo is
  'Permite hard-delete de nóminas no productivas (pre-cálculo o zombie anulada). '
  'Los estados con cálculo/liquidaciones vigentes (calculada, validada, aprobada, '
  'cerrada, reabierta) requieren reabrir + reversa formal antes de poder eliminarse. '
  'Espejo server-side del client-side rule `puedeEliminar()` en admin-nominas.rules.ts.';
