-- =============================================================================
-- SEC-02b (AUDIT-SEC-2026-07) — RLS tenant nómina/liquidaciones/Previred + movvar
--
-- Complementa SEC-02: tablas con grants anon residuales (~40) pese a policies tenant
-- parciales o ausentes. Endurece policies auth-only a tenant; revoke anon + FORCE RLS.
-- =============================================================================

begin;

set local lock_timeout = '5s';
set local statement_timeout = '180s';

select pg_advisory_xact_lock(hashtext('SEC-02b-rls-nomina-movvar-anon'));

set search_path = public;

-- ---------------------------------------------------------------------------
-- 1. Helpers tenant (nómina / liquidación / preparación)
-- ---------------------------------------------------------------------------

create or replace function public.sec_nomina_periodo_uuid_tenant_ok(p_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select p_id is not null
     and exists (
       select 1
       from public.nomina_periodo np
       where np.id = p_id
         and np.id_empresa = public.current_user_empresa_id()
     );
$$;

revoke all on function public.sec_nomina_periodo_uuid_tenant_ok(uuid) from public;
grant execute on function public.sec_nomina_periodo_uuid_tenant_ok(uuid) to authenticated, service_role;


create or replace function public.sec_liquidacion_periodo_tenant_ok(p_id_liquidacion_periodo bigint)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select p_id_liquidacion_periodo is not null
     and exists (
       select 1
       from public.nomina_liquidacion_periodo lp
       where lp.id_liquidacion_periodo = p_id_liquidacion_periodo
         and (
           lp.id_empresa = public.current_user_empresa_id()
           or (
             lp.id_nomina_periodo is not null
             and public.sec_nomina_periodo_uuid_tenant_ok(lp.id_nomina_periodo)
           )
         )
     );
$$;

revoke all on function public.sec_liquidacion_periodo_tenant_ok(bigint) from public;
grant execute on function public.sec_liquidacion_periodo_tenant_ok(bigint) to authenticated, service_role;


create or replace function public.sec_preparacion_nomina_tenant_ok(p_id_preparacion_nomina bigint)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select p_id_preparacion_nomina is not null
     and exists (
       select 1
       from public.nomina_preparacion p
       where p.id_preparacion_nomina = p_id_preparacion_nomina
         and p.id_empresa = public.current_user_empresa_id()
     );
$$;

revoke all on function public.sec_preparacion_nomina_tenant_ok(bigint) from public;
grant execute on function public.sec_preparacion_nomina_tenant_ok(bigint) to authenticated, service_role;


-- ---------------------------------------------------------------------------
-- 2. nomina_liquidacion_periodo (tenant directo o vía nómina)
-- ---------------------------------------------------------------------------

drop policy if exists nomina_liquidacion_select_authenticated on public.nomina_liquidacion_periodo;
drop policy if exists nomina_liquidacion_insert_authenticated on public.nomina_liquidacion_periodo;

create policy nomina_liquidacion_periodo_select_tenant on public.nomina_liquidacion_periodo
  for select to authenticated
  using (
    id_empresa = public.current_user_empresa_id()
    or public.sec_nomina_periodo_uuid_tenant_ok(id_nomina_periodo)
  );

create policy nomina_liquidacion_periodo_insert_tenant on public.nomina_liquidacion_periodo
  for insert to authenticated
  with check (
    id_empresa = public.current_user_empresa_id()
    or public.sec_nomina_periodo_uuid_tenant_ok(id_nomina_periodo)
  );


-- ---------------------------------------------------------------------------
-- 3. Hijos liquidación (vía id_liquidacion_periodo)
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
  tables text[] := array[
    'nomina_liquidacion_trabajador',
    'nomina_liquidacion_emision'
  ];
  v_short text;
begin
  foreach t in array tables loop
    if to_regclass('public.' || t) is null then
      continue;
    end if;
    v_short := t;

    execute format('drop policy if exists nomina_liquidacion_select_authenticated on public.%I', t);
    execute format('drop policy if exists nomina_liquidacion_insert_authenticated on public.%I', t);
    execute format('drop policy if exists nomina_liquidacion_update_authenticated on public.%I', t);

    execute format(
      'create policy %I on public.%I for select to authenticated using (public.sec_liquidacion_periodo_tenant_ok(id_liquidacion_periodo))',
      v_short || '_select_tenant', v_short
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (public.sec_liquidacion_periodo_tenant_ok(id_liquidacion_periodo))',
      v_short || '_insert_tenant', v_short
    );
    execute format('drop policy if exists nomina_liquidacion_emision_select_authenticated on public.%I', t);
    execute format('drop policy if exists nomina_liquidacion_emision_insert_authenticated on public.%I', t);
    if t = 'nomina_liquidacion_trabajador' then
      execute format(
        'create policy %I on public.%I for update to authenticated using (public.sec_liquidacion_periodo_tenant_ok(id_liquidacion_periodo)) with check (public.sec_liquidacion_periodo_tenant_ok(id_liquidacion_periodo))',
        v_short || '_update_tenant', v_short
      );
    end if;
  end loop;
end;
$$;

revoke all on public.v_nomina_estado_periodo from anon;
revoke all on public.vw_persona_factores from anon;


-- nomina_liquidacion_concepto usa id_liquidacion_trabajador → join trabajador
drop policy if exists nomina_liquidacion_concepto_select_tenant on public.nomina_liquidacion_concepto;
drop policy if exists nomina_liquidacion_concepto_insert_tenant on public.nomina_liquidacion_concepto;

create policy nomina_liquidacion_concepto_select_tenant on public.nomina_liquidacion_concepto
  for select to authenticated
  using (
    exists (
      select 1
      from public.nomina_liquidacion_trabajador lt
      where lt.id_liquidacion_trabajador = nomina_liquidacion_concepto.id_liquidacion_trabajador
        and public.sec_liquidacion_periodo_tenant_ok(lt.id_liquidacion_periodo)
    )
  );

create policy nomina_liquidacion_concepto_insert_tenant on public.nomina_liquidacion_concepto
  for insert to authenticated
  with check (
    exists (
      select 1
      from public.nomina_liquidacion_trabajador lt
      where lt.id_liquidacion_trabajador = nomina_liquidacion_concepto.id_liquidacion_trabajador
        and public.sec_liquidacion_periodo_tenant_ok(lt.id_liquidacion_periodo)
    )
  );


-- ---------------------------------------------------------------------------
-- 4. nomina_preparacion + hijos
-- ---------------------------------------------------------------------------

drop policy if exists nomina_preparacion_select_authenticated on public.nomina_preparacion;
drop policy if exists nomina_preparacion_insert_authenticated on public.nomina_preparacion;
drop policy if exists nomina_preparacion_update_authenticated on public.nomina_preparacion;

create policy nomina_preparacion_select_tenant on public.nomina_preparacion
  for select to authenticated
  using (id_empresa = public.current_user_empresa_id());

create policy nomina_preparacion_insert_tenant on public.nomina_preparacion
  for insert to authenticated
  with check (id_empresa = public.current_user_empresa_id());

create policy nomina_preparacion_update_tenant on public.nomina_preparacion
  for update to authenticated
  using (id_empresa = public.current_user_empresa_id())
  with check (id_empresa = public.current_user_empresa_id());

do $$
declare
  t text;
  tables text[] := array['nomina_preparacion_evento', 'nomina_preparacion_trabajador'];
  v_short text;
begin
  foreach t in array tables loop
    if to_regclass('public.' || t) is null then
      continue;
    end if;
    v_short := t;

    execute format('drop policy if exists nomina_preparacion_select_authenticated on public.%I', t);
    execute format('drop policy if exists nomina_preparacion_insert_authenticated on public.%I', t);
    execute format('drop policy if exists nomina_preparacion_update_authenticated on public.%I', t);

    execute format(
      'create policy %I on public.%I for select to authenticated using (public.sec_preparacion_nomina_tenant_ok(id_preparacion_nomina))',
      v_short || '_select_tenant', v_short
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (public.sec_preparacion_nomina_tenant_ok(id_preparacion_nomina))',
      v_short || '_insert_tenant', v_short
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (public.sec_preparacion_nomina_tenant_ok(id_preparacion_nomina)) with check (public.sec_preparacion_nomina_tenant_ok(id_preparacion_nomina))',
      v_short || '_update_tenant', v_short
    );
  end loop;
end;
$$;


-- ---------------------------------------------------------------------------
-- 5. Previred exportación (tenant vía nómina o liquidación)
-- ---------------------------------------------------------------------------

drop policy if exists nomina_previred_exportacion_select_authenticated on public.nomina_previred_exportacion;
drop policy if exists nomina_previred_exportacion_insert_authenticated on public.nomina_previred_exportacion;

create policy nomina_previred_exportacion_select_tenant on public.nomina_previred_exportacion
  for select to authenticated
  using (
    public.sec_nomina_periodo_uuid_tenant_ok(id_nomina_periodo)
    or public.sec_liquidacion_periodo_tenant_ok(id_liquidacion_periodo)
  );

create policy nomina_previred_exportacion_insert_tenant on public.nomina_previred_exportacion
  for insert to authenticated
  with check (
    public.sec_nomina_periodo_uuid_tenant_ok(id_nomina_periodo)
    or public.sec_liquidacion_periodo_tenant_ok(id_liquidacion_periodo)
  );


-- ---------------------------------------------------------------------------
-- 6. movimiento_variable_mensual + persona_tramo_carga
-- ---------------------------------------------------------------------------

alter table public.movimiento_variable_mensual enable row level security;

drop policy if exists movimiento_variable_mensual_select on public.movimiento_variable_mensual;
drop policy if exists movimiento_variable_mensual_insert on public.movimiento_variable_mensual;
drop policy if exists movimiento_variable_mensual_update on public.movimiento_variable_mensual;
drop policy if exists movimiento_variable_mensual_delete on public.movimiento_variable_mensual;

create policy movimiento_variable_mensual_select_tenant on public.movimiento_variable_mensual
  for select to authenticated
  using (public.sec_persona_tenant_ok(id_persona));

create policy movimiento_variable_mensual_insert_tenant on public.movimiento_variable_mensual
  for insert to authenticated
  with check (public.sec_persona_tenant_ok(id_persona));

create policy movimiento_variable_mensual_update_tenant on public.movimiento_variable_mensual
  for update to authenticated
  using (public.sec_persona_tenant_ok(id_persona))
  with check (public.sec_persona_tenant_ok(id_persona));

create policy movimiento_variable_mensual_delete_tenant on public.movimiento_variable_mensual
  for delete to authenticated
  using (public.sec_persona_tenant_ok(id_persona));

do $$
begin
  if to_regclass('public.persona_tramo_carga') is not null then
    execute 'alter table public.persona_tramo_carga enable row level security';
    execute 'drop policy if exists persona_tramo_carga_select on public.persona_tramo_carga';
    execute 'drop policy if exists persona_tramo_carga_insert on public.persona_tramo_carga';
    execute 'drop policy if exists persona_tramo_carga_update on public.persona_tramo_carga';
    execute 'drop policy if exists persona_tramo_carga_delete on public.persona_tramo_carga';

    execute $p$
      create policy persona_tramo_carga_select_tenant on public.persona_tramo_carga
        for select to authenticated
        using (public.sec_persona_tenant_ok(id_persona))
    $p$;
    execute $p$
      create policy persona_tramo_carga_insert_tenant on public.persona_tramo_carga
        for insert to authenticated
        with check (public.sec_persona_tenant_ok(id_persona))
    $p$;
    execute $p$
      create policy persona_tramo_carga_update_tenant on public.persona_tramo_carga
        for update to authenticated
        using (public.sec_persona_tenant_ok(id_persona))
        with check (public.sec_persona_tenant_ok(id_persona))
    $p$;
    execute $p$
      create policy persona_tramo_carga_delete_tenant on public.persona_tramo_carga
        for delete to authenticated
        using (public.sec_persona_tenant_ok(id_persona))
    $p$;
  end if;
end;
$$;


-- ---------------------------------------------------------------------------
-- 7. Revoke anon + FORCE RLS (tablas operativas tocadas o ya con tenant RLS)
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
  tables text[] := array[
    'nomina_periodo', 'nomina_consolidacion', 'nomina_plantilla_ciclo',
    'nomina_liquidacion_periodo', 'nomina_liquidacion_trabajador',
    'nomina_liquidacion_concepto', 'nomina_liquidacion_emision',
    'nomina_preparacion', 'nomina_preparacion_evento', 'nomina_preparacion_trabajador',
    'nomina_previred_exportacion', 'evento_auditoria_nomina',
    'licencia_medica', 'licencia_medica_ingreso_correo',
    'perfil_acceso', 'empresa_config_documento', 'usuario_preferencia_ui',
    'catalogo_previred', 'motivo_ausencia',
    'movimiento_variable_mensual', 'persona_tramo_carga'
  ];
begin
  foreach t in array tables loop
    if to_regclass('public.' || t) is null then
      continue;
    end if;
    execute format('revoke all on public.%I from anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
  end loop;
end;
$$;

-- catálogos globales: solo lectura authenticated
revoke insert, update, delete on public.catalogo_previred from authenticated;
grant select on public.catalogo_previred to authenticated;

revoke insert, update, delete on public.motivo_ausencia from authenticated;
grant select on public.motivo_ausencia to authenticated;


-- ---------------------------------------------------------------------------
-- 8. Revoke anon en tablas legacy sin RLS aún (superficie anon; deuda RLS documentada)
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
  tables text[] := array[
    'anexo_contrato', 'audit_log', 'catalogo_lre', 'configuracion',
    'ficha_validacion_detalle', 'ficha_validacion_resumen', 'finiquito',
    'liquidacion', 'liquidacion_detalle', 'motivo_inasistencia', 'movimiento',
    'nomina_periodo_diagnostico', 'prestamo', 'tipo_movimiento',
    'vacacion_movimiento', 'vacacion_saldo', 'valores_flexibles'
  ];
begin
  foreach t in array tables loop
    if to_regclass('public.' || t) is null then
      continue;
    end if;
    execute format('revoke all on public.%I from anon', t);
  end loop;
end;
$$;


-- ---------------------------------------------------------------------------
-- 9. Smoke
-- ---------------------------------------------------------------------------

do $$
begin
  if exists (
    select 1 from information_schema.role_table_grants
    where grantee = 'anon' and table_schema = 'public' and table_name = 'nomina_periodo'
  ) then
    raise exception 'SEC-02b smoke: anon aun tiene grants sobre nomina_periodo';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'movimiento_variable_mensual'
      and policyname = 'movimiento_variable_mensual_select_tenant'
  ) then
    raise exception 'SEC-02b smoke: falta movimiento_variable_mensual_select_tenant';
  end if;
end;
$$;

notify pgrst, 'reload schema';

commit;
