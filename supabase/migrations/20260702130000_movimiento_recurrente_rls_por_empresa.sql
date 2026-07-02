-- =============================================================================
-- 20260702130000_movimiento_recurrente_rls_por_empresa.sql
-- BKL-04 (AUDIT-PROYECTO-2026-07) — endurecer RLS de movimiento_recurrente.
--
-- Contexto:
--   La migración 20260610210000 abrió la tabla con policies `USING (true)`
--   para `anon` + `authenticated` porque en ese momento el frontend operaba
--   con la anon key sin claim de empresa. Desde F02 (current_user_empresa_id
--   estricto) + F03b (seed de app_metadata.id_empresa en auth.users) todas
--   las sesiones del ERP son `authenticated` con claim de empresa, y el
--   resto de tablas de nómina ya filtra por empresa en servidor.
--
-- Cambio:
--   - Policies por operación `TO authenticated` con
--     `id_empresa = current_user_empresa_id()` (patrón F02).
--   - `anon` pierde toda policy y todo grant sobre la tabla.
--
-- No rompe el puente HD → MR: `tg_haberdescuento_persona_sync` es
-- SECURITY DEFINER (owner postgres) y bypasea RLS.
-- =============================================================================

set search_path = public;

-- Policies abiertas de 20260610210000
drop policy if exists mov_recurrente_select on public.movimiento_recurrente;
drop policy if exists mov_recurrente_insert on public.movimiento_recurrente;
drop policy if exists mov_recurrente_update on public.movimiento_recurrente;
drop policy if exists mov_recurrente_delete on public.movimiento_recurrente;
-- Policy F2 original, por si algún entorno la conserva
drop policy if exists movimiento_recurrente_all on public.movimiento_recurrente;

create policy mov_recurrente_select on public.movimiento_recurrente
  for select to authenticated
  using (id_empresa = public.current_user_empresa_id());

create policy mov_recurrente_insert on public.movimiento_recurrente
  for insert to authenticated
  with check (id_empresa = public.current_user_empresa_id());

create policy mov_recurrente_update on public.movimiento_recurrente
  for update to authenticated
  using (id_empresa = public.current_user_empresa_id())
  with check (id_empresa = public.current_user_empresa_id());

create policy mov_recurrente_delete on public.movimiento_recurrente
  for delete to authenticated
  using (id_empresa = public.current_user_empresa_id());

revoke select, insert, update, delete on public.movimiento_recurrente from anon;
grant select, insert, update, delete on public.movimiento_recurrente to authenticated;

alter table public.movimiento_recurrente enable row level security;

notify pgrst, 'reload schema';
