-- =============================================================================
-- 20260702170000_nomina_bkl12_rls_por_operacion.sql
-- BKL-12 (AUDIT-EST-2026-07) — RLS por operación en tablas hijo nómina.
--
-- Contexto:
--   rebuild 20260604180000 creó policies FOR ALL (*_all) en segmento_nomina,
--   movimiento_nomina e incidencia_nomina. EST-002 exige policies por operación
--   (patrón nomina_periodo + movimiento_recurrente BKL-04).
--
-- evento_auditoria_nomina ya cumple (select + insert separados).
--
-- Cambio:
--   Drop *_all; create select/insert/update/delete TO authenticated.
--   Misma lógica using/with check que las policies reemplazadas.
-- =============================================================================

set search_path = public;

-- ---------------------------------------------------------------------------
-- segmento_nomina
-- ---------------------------------------------------------------------------
drop policy if exists segmento_nomina_all on public.segmento_nomina;

drop policy if exists segmento_nomina_select on public.segmento_nomina;
create policy segmento_nomina_select on public.segmento_nomina
  for select to authenticated
  using (id_empresa = public.current_user_empresa_id());

drop policy if exists segmento_nomina_insert on public.segmento_nomina;
create policy segmento_nomina_insert on public.segmento_nomina
  for insert to authenticated
  with check (id_empresa = public.current_user_empresa_id());

drop policy if exists segmento_nomina_update on public.segmento_nomina;
create policy segmento_nomina_update on public.segmento_nomina
  for update to authenticated
  using (id_empresa = public.current_user_empresa_id())
  with check (id_empresa = public.current_user_empresa_id());

drop policy if exists segmento_nomina_delete on public.segmento_nomina;
create policy segmento_nomina_delete on public.segmento_nomina
  for delete to authenticated
  using (id_empresa = public.current_user_empresa_id());

-- ---------------------------------------------------------------------------
-- movimiento_nomina
-- ---------------------------------------------------------------------------
drop policy if exists movimiento_nomina_all on public.movimiento_nomina;

drop policy if exists movimiento_nomina_select on public.movimiento_nomina;
create policy movimiento_nomina_select on public.movimiento_nomina
  for select to authenticated
  using (id_empresa = public.current_user_empresa_id());

drop policy if exists movimiento_nomina_insert on public.movimiento_nomina;
create policy movimiento_nomina_insert on public.movimiento_nomina
  for insert to authenticated
  with check (id_empresa = public.current_user_empresa_id());

drop policy if exists movimiento_nomina_update on public.movimiento_nomina;
create policy movimiento_nomina_update on public.movimiento_nomina
  for update to authenticated
  using (id_empresa = public.current_user_empresa_id())
  with check (id_empresa = public.current_user_empresa_id());

drop policy if exists movimiento_nomina_delete on public.movimiento_nomina;
create policy movimiento_nomina_delete on public.movimiento_nomina
  for delete to authenticated
  using (id_empresa = public.current_user_empresa_id());

-- ---------------------------------------------------------------------------
-- incidencia_nomina (acceso vía nómina del tenant)
-- ---------------------------------------------------------------------------
drop policy if exists incidencia_nomina_all on public.incidencia_nomina;

drop policy if exists incidencia_nomina_select on public.incidencia_nomina;
create policy incidencia_nomina_select on public.incidencia_nomina
  for select to authenticated
  using (
    exists (
      select 1 from public.nomina_periodo np
      where np.id = id_nomina_periodo
        and np.id_empresa = public.current_user_empresa_id()
    )
  );

drop policy if exists incidencia_nomina_insert on public.incidencia_nomina;
create policy incidencia_nomina_insert on public.incidencia_nomina
  for insert to authenticated
  with check (
    exists (
      select 1 from public.nomina_periodo np
      where np.id = id_nomina_periodo
        and np.id_empresa = public.current_user_empresa_id()
    )
  );

drop policy if exists incidencia_nomina_update on public.incidencia_nomina;
create policy incidencia_nomina_update on public.incidencia_nomina
  for update to authenticated
  using (
    exists (
      select 1 from public.nomina_periodo np
      where np.id = id_nomina_periodo
        and np.id_empresa = public.current_user_empresa_id()
    )
  )
  with check (
    exists (
      select 1 from public.nomina_periodo np
      where np.id = id_nomina_periodo
        and np.id_empresa = public.current_user_empresa_id()
    )
  );

drop policy if exists incidencia_nomina_delete on public.incidencia_nomina;
create policy incidencia_nomina_delete on public.incidencia_nomina
  for delete to authenticated
  using (
    exists (
      select 1 from public.nomina_periodo np
      where np.id = id_nomina_periodo
        and np.id_empresa = public.current_user_empresa_id()
    )
  );

revoke all on public.segmento_nomina from anon;
revoke all on public.movimiento_nomina from anon;
revoke all on public.incidencia_nomina from anon;

grant select, insert, update, delete on public.segmento_nomina to authenticated;
grant select, insert, update, delete on public.movimiento_nomina to authenticated;
grant select, insert, update, delete on public.incidencia_nomina to authenticated;

notify pgrst, 'reload schema';
