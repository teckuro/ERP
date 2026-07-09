-- =============================================================================
-- SEC-03 (AUDIT-SEC-2026-07) — snapshots de nómina tenant-safe
--
-- Problema:
--   guardar_nomina_calculo_snapshot aceptaba p_id_empresa del cliente sin
--   validar contra current_user_empresa_id(); RLS de nomina_calculo_* usaba
--   auth.role() = 'authenticated' (cross-tenant dentro del proyecto).
--
-- Cambios:
--   1. sec_assert_snapshot_empresa + wrapper RPC con validación previa.
--   2. RLS por tenant en nomina_calculo_* (patrón F02 / BKL-04).
--   3. Revoke anon + FORCE ROW LEVEL SECURITY.
-- =============================================================================

begin;

set local lock_timeout = '5s';
set local statement_timeout = '120s';

select pg_advisory_xact_lock(hashtext('SEC-03-snapshot-tenant-rls'));

set search_path = public;

-- ---------------------------------------------------------------------------
-- 1. Helpers de tenant
-- ---------------------------------------------------------------------------

create or replace function public.sec_assert_snapshot_empresa(
  p_id_empresa integer,
  p_id_nomina_periodo uuid
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_empresa integer := public.current_user_empresa_id();
begin
  if v_empresa is null then
    raise exception 'Sesion sin empresa activa'
      using errcode = '42501';
  end if;

  if p_id_nomina_periodo is not null then
    if not exists (
      select 1
      from public.nomina_periodo np
      where np.id = p_id_nomina_periodo
        and np.id_empresa = v_empresa
    ) then
      raise exception 'Nomina no autorizada para esta empresa'
        using errcode = '42501';
    end if;
  end if;

  if p_id_empresa is not null and p_id_empresa is distinct from v_empresa then
    raise exception 'Empresa no autorizada para esta operacion'
      using errcode = '42501';
  end if;
end;
$$;

comment on function public.sec_assert_snapshot_empresa(integer, uuid) is
  'SEC-03: valida que snapshot se persista solo para la empresa del JWT.';

revoke all on function public.sec_assert_snapshot_empresa(integer, uuid) from public;
grant execute on function public.sec_assert_snapshot_empresa(integer, uuid) to authenticated, service_role;


create or replace function public.nomina_calculo_periodo_tenant_ok(p_id_calculo_periodo integer)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.nomina_calculo_periodo cp
    left join public.nomina_periodo np on np.id = cp.id_nomina_periodo
    where cp.id_calculo_periodo = p_id_calculo_periodo
      and (
        (cp.id_empresa is not null and cp.id_empresa = public.current_user_empresa_id())
        or (cp.id_nomina_periodo is not null and np.id_empresa = public.current_user_empresa_id())
      )
  );
$$;

comment on function public.nomina_calculo_periodo_tenant_ok(integer) is
  'SEC-03: true si el snapshot pertenece al tenant del JWT (por id_empresa o nomina_periodo).';

revoke all on function public.nomina_calculo_periodo_tenant_ok(integer) from public;
grant execute on function public.nomina_calculo_periodo_tenant_ok(integer) to authenticated, service_role;


create or replace function public.nomina_calculo_trabajador_tenant_ok(p_id_calculo_trabajador integer)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.nomina_calculo_trabajador ct
    where ct.id_calculo_trabajador = p_id_calculo_trabajador
      and public.nomina_calculo_periodo_tenant_ok(ct.id_calculo_periodo)
  );
$$;

comment on function public.nomina_calculo_trabajador_tenant_ok(integer) is
  'SEC-03: true si la fila trabajador del snapshot pertenece al tenant del JWT.';

revoke all on function public.nomina_calculo_trabajador_tenant_ok(integer) from public;
grant execute on function public.nomina_calculo_trabajador_tenant_ok(integer) to authenticated, service_role;


-- ---------------------------------------------------------------------------
-- 2. Wrapper RPC — validación antes del cuerpo F09
-- ---------------------------------------------------------------------------

do $$
begin
  if to_regprocedure(
    'public.guardar_nomina_calculo_snapshot(text,integer,jsonb,jsonb,jsonb,jsonb,jsonb,jsonb,bigint,uuid)'
  ) is null then
    raise exception 'Falta guardar_nomina_calculo_snapshot (F09) antes de SEC-03';
  end if;
end;
$$;

alter function public.guardar_nomina_calculo_snapshot(
  text, integer, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, bigint, uuid
) rename to guardar_nomina_calculo_snapshot_impl;

create or replace function public.guardar_nomina_calculo_snapshot(
  p_periodo text,
  p_id_empresa integer,
  p_cabecera jsonb,
  p_trabajadores jsonb,
  p_conceptos jsonb default '[]'::jsonb,
  p_observaciones jsonb default '[]'::jsonb,
  p_trazabilidad jsonb default '[]'::jsonb,
  p_parametros jsonb default '[]'::jsonb,
  p_id_preparacion_nomina bigint default null,
  p_id_nomina_periodo uuid default null
)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
begin
  perform public.sec_assert_snapshot_empresa(p_id_empresa, p_id_nomina_periodo);

  return public.guardar_nomina_calculo_snapshot_impl(
    p_periodo,
    p_id_empresa,
    p_cabecera,
    p_trabajadores,
    p_conceptos,
    p_observaciones,
    p_trazabilidad,
    p_parametros,
    p_id_preparacion_nomina,
    p_id_nomina_periodo
  );
end;
$$;

comment on function public.guardar_nomina_calculo_snapshot(
  text, integer, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, bigint, uuid
) is
  'SEC-03 + F09: valida tenant JWT antes de guardar snapshot; reemplazo activo scoped por nomina.';

revoke all on function public.guardar_nomina_calculo_snapshot_impl(
  text, integer, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, bigint, uuid
) from public, anon;

grant execute on function public.guardar_nomina_calculo_snapshot_impl(
  text, integer, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, bigint, uuid
) to authenticated, service_role;

revoke all on function public.guardar_nomina_calculo_snapshot(
  text, integer, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, bigint, uuid
) from public, anon;

grant execute on function public.guardar_nomina_calculo_snapshot(
  text, integer, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, bigint, uuid
) to authenticated, service_role;


-- ---------------------------------------------------------------------------
-- 3. RLS tenant — nomina_calculo_periodo
-- ---------------------------------------------------------------------------

drop policy if exists nomina_snapshot_select_authenticated on public.nomina_calculo_periodo;
drop policy if exists nomina_snapshot_insert_authenticated on public.nomina_calculo_periodo;
drop policy if exists nomina_snapshot_update_authenticated on public.nomina_calculo_periodo;

create policy nomina_calculo_periodo_select on public.nomina_calculo_periodo
  for select to authenticated
  using (
    (id_empresa is not null and id_empresa = public.current_user_empresa_id())
    or exists (
      select 1
      from public.nomina_periodo np
      where np.id = id_nomina_periodo
        and np.id_empresa = public.current_user_empresa_id()
    )
  );

create policy nomina_calculo_periodo_insert on public.nomina_calculo_periodo
  for insert to authenticated
  with check (
    (id_empresa is not null and id_empresa = public.current_user_empresa_id())
    or exists (
      select 1
      from public.nomina_periodo np
      where np.id = id_nomina_periodo
        and np.id_empresa = public.current_user_empresa_id()
    )
  );

create policy nomina_calculo_periodo_update on public.nomina_calculo_periodo
  for update to authenticated
  using (
    (id_empresa is not null and id_empresa = public.current_user_empresa_id())
    or exists (
      select 1
      from public.nomina_periodo np
      where np.id = id_nomina_periodo
        and np.id_empresa = public.current_user_empresa_id()
    )
  )
  with check (
    (id_empresa is not null and id_empresa = public.current_user_empresa_id())
    or exists (
      select 1
      from public.nomina_periodo np
      where np.id = id_nomina_periodo
        and np.id_empresa = public.current_user_empresa_id()
    )
  );


-- ---------------------------------------------------------------------------
-- 4. RLS tenant — hijos (trabajador, concepto, issue, trazabilidad, parametro)
-- ---------------------------------------------------------------------------

drop policy if exists nomina_snapshot_select_authenticated on public.nomina_calculo_trabajador;
drop policy if exists nomina_snapshot_insert_authenticated on public.nomina_calculo_trabajador;
drop policy if exists nomina_snapshot_update_authenticated on public.nomina_calculo_trabajador;

create policy nomina_calculo_trabajador_select on public.nomina_calculo_trabajador
  for select to authenticated
  using (public.nomina_calculo_periodo_tenant_ok(id_calculo_periodo));

create policy nomina_calculo_trabajador_insert on public.nomina_calculo_trabajador
  for insert to authenticated
  with check (public.nomina_calculo_periodo_tenant_ok(id_calculo_periodo));

create policy nomina_calculo_trabajador_update on public.nomina_calculo_trabajador
  for update to authenticated
  using (public.nomina_calculo_periodo_tenant_ok(id_calculo_periodo))
  with check (public.nomina_calculo_periodo_tenant_ok(id_calculo_periodo));


drop policy if exists nomina_snapshot_select_authenticated on public.nomina_calculo_concepto;
drop policy if exists nomina_snapshot_insert_authenticated on public.nomina_calculo_concepto;
drop policy if exists nomina_snapshot_update_authenticated on public.nomina_calculo_concepto;

create policy nomina_calculo_concepto_select on public.nomina_calculo_concepto
  for select to authenticated
  using (public.nomina_calculo_trabajador_tenant_ok(id_calculo_trabajador));

create policy nomina_calculo_concepto_insert on public.nomina_calculo_concepto
  for insert to authenticated
  with check (public.nomina_calculo_trabajador_tenant_ok(id_calculo_trabajador));

create policy nomina_calculo_concepto_update on public.nomina_calculo_concepto
  for update to authenticated
  using (public.nomina_calculo_trabajador_tenant_ok(id_calculo_trabajador))
  with check (public.nomina_calculo_trabajador_tenant_ok(id_calculo_trabajador));


drop policy if exists nomina_snapshot_select_authenticated on public.nomina_calculo_issue;
drop policy if exists nomina_snapshot_insert_authenticated on public.nomina_calculo_issue;
drop policy if exists nomina_snapshot_update_authenticated on public.nomina_calculo_issue;

create policy nomina_calculo_issue_select on public.nomina_calculo_issue
  for select to authenticated
  using (public.nomina_calculo_periodo_tenant_ok(id_calculo_periodo));

create policy nomina_calculo_issue_insert on public.nomina_calculo_issue
  for insert to authenticated
  with check (public.nomina_calculo_periodo_tenant_ok(id_calculo_periodo));

create policy nomina_calculo_issue_update on public.nomina_calculo_issue
  for update to authenticated
  using (public.nomina_calculo_periodo_tenant_ok(id_calculo_periodo))
  with check (public.nomina_calculo_periodo_tenant_ok(id_calculo_periodo));


drop policy if exists nomina_snapshot_select_authenticated on public.nomina_calculo_trazabilidad;
drop policy if exists nomina_snapshot_insert_authenticated on public.nomina_calculo_trazabilidad;
drop policy if exists nomina_snapshot_update_authenticated on public.nomina_calculo_trazabilidad;

create policy nomina_calculo_trazabilidad_select on public.nomina_calculo_trazabilidad
  for select to authenticated
  using (public.nomina_calculo_periodo_tenant_ok(id_calculo_periodo));

create policy nomina_calculo_trazabilidad_insert on public.nomina_calculo_trazabilidad
  for insert to authenticated
  with check (public.nomina_calculo_periodo_tenant_ok(id_calculo_periodo));

create policy nomina_calculo_trazabilidad_update on public.nomina_calculo_trazabilidad
  for update to authenticated
  using (public.nomina_calculo_periodo_tenant_ok(id_calculo_periodo))
  with check (public.nomina_calculo_periodo_tenant_ok(id_calculo_periodo));


drop policy if exists nomina_calc_parametro_select_authenticated on public.nomina_calculo_parametro;
drop policy if exists nomina_calc_parametro_insert_authenticated on public.nomina_calculo_parametro;

create policy nomina_calculo_parametro_select on public.nomina_calculo_parametro
  for select to authenticated
  using (public.nomina_calculo_periodo_tenant_ok(id_calculo_periodo));

create policy nomina_calculo_parametro_insert on public.nomina_calculo_parametro
  for insert to authenticated
  with check (public.nomina_calculo_periodo_tenant_ok(id_calculo_periodo));


-- ---------------------------------------------------------------------------
-- 5. Grants anon + FORCE RLS
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
  snapshot_tables text[] := array[
    'nomina_calculo_periodo',
    'nomina_calculo_trabajador',
    'nomina_calculo_concepto',
    'nomina_calculo_issue',
    'nomina_calculo_trazabilidad',
    'nomina_calculo_parametro'
  ];
begin
  foreach t in array snapshot_tables loop
    if to_regclass(format('public.%I', t)) is null then
      continue;
    end if;

    execute format('revoke all on public.%I from anon', t);
    execute format(
      'grant select, insert, update on public.%I to authenticated',
      t
    );
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
  end loop;
end;
$$;


-- Smoke: policies tenant existen; ya no hay nomina_snapshot_* permisivas
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'nomina_calculo_periodo'
      and policyname = 'nomina_calculo_periodo_select'
  ) then
    raise exception 'SEC-03 smoke: falta nomina_calculo_periodo_select';
  end if;

  if exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'nomina_calculo_periodo'
      and policyname = 'nomina_snapshot_select_authenticated'
  ) then
    raise exception 'SEC-03 smoke: policy legacy nomina_snapshot_select_authenticated aun presente';
  end if;
end;
$$;

notify pgrst, 'reload schema';

commit;
