-- =============================================================================
-- SEC-02d (AUDIT-SEC-2026-07) — RLS movimiento_variable_mensual por rol/perfil
--
-- Complementa SEC-02b: tenant en movvar + escritura solo perfiles con permiso
-- de módulo «movimientos» (rol JWT + ajustes finos perfil_acceso ADMIN-01).
-- Consulta: SELECT tenant OK; INSERT/UPDATE/DELETE bloqueados.
-- =============================================================================

begin;

set local lock_timeout = '5s';
set local statement_timeout = '120s';

select pg_advisory_xact_lock(hashtext('SEC-02d-rls-movvar-rol'));

set search_path = public;

-- ---------------------------------------------------------------------------
-- 1. Permiso de escritura por módulo (alineado a erp-permisos-modulos.rules.ts)
-- ---------------------------------------------------------------------------

create or replace function public.sec_permiso_modulo_escritura_ok(p_modulo text)
returns boolean
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_id_perfil integer;
  v_permisos jsonb;
  v_rol_base text;
  v_role text;
  v_norm text;
  v_modulo text;
begin
  v_modulo := lower(btrim(coalesce(p_modulo, '')));
  if v_modulo = '' then
    return false;
  end if;

  v_id_perfil := nullif(auth.jwt() -> 'app_metadata' ->> 'id_perfil', '')::integer;
  if v_id_perfil is not null then
    select p.permisos, p.rol_base
    into v_permisos, v_rol_base
    from public.perfil_acceso p
    where p.id_perfil = v_id_perfil
      and p.id_empresa = public.current_user_empresa_id()
      and p.activo
    limit 1;

    if found then
      if v_permisos ? v_modulo then
        return coalesce((v_permisos -> v_modulo ->> 'editar')::boolean, false);
      end if;
      v_role := v_rol_base;
    end if;
  end if;

  if v_role is null then
    v_role := coalesce(
      auth.jwt() -> 'app_metadata' ->> 'role',
      auth.jwt() -> 'user_metadata' ->> 'role',
      ''
    );
  end if;

  v_norm := lower(replace(btrim(v_role), '-', '_'));

  if v_norm in ('admin', 'admin_sistema', 'admin_remuneraciones', 'administrador', 'administrator') then
    if v_modulo in ('parametros', 'conceptos', 'empresas', 'reportes') then
      return v_norm in ('admin', 'admin_sistema', 'admin_remuneraciones', 'administrador', 'administrator');
    end if;
    return true;
  end if;

  if v_norm in ('consulta', 'consulta_remuneraciones', 'solo_lectura', 'readonly', 'viewer') then
    return false;
  end if;

  if v_norm in ('operador', 'operador_remuneraciones', 'rrhh', 'user') then
    return v_modulo in ('empleados', 'nominas', 'liquidaciones', 'movimientos', 'licencias');
  end if;

  return false;
end;
$$;

comment on function public.sec_permiso_modulo_escritura_ok(text) is
  'SEC-02d: escritura por módulo según rol JWT y ajustes finos perfil_acceso (ADMIN-01).';

revoke all on function public.sec_permiso_modulo_escritura_ok(text) from public;
grant execute on function public.sec_permiso_modulo_escritura_ok(text) to authenticated, service_role;


create or replace function public.sec_movvar_escritura_ok()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select public.sec_permiso_modulo_escritura_ok('movimientos');
$$;

comment on function public.sec_movvar_escritura_ok() is
  'SEC-02d: usuario autenticado puede insertar/actualizar/anular movimiento_variable_mensual.';

revoke all on function public.sec_movvar_escritura_ok() from public;
grant execute on function public.sec_movvar_escritura_ok() to authenticated, service_role;


-- ---------------------------------------------------------------------------
-- 2. erp_nomina_permiso_efectivo: permiso explícito movvar.escribir (smokes/RPC)
-- ---------------------------------------------------------------------------

create or replace function public.erp_nomina_permiso_efectivo(p_permiso text)
returns boolean
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_permiso text;
  v_role text;
  v_norm text;
begin
  v_permiso := lower(btrim(coalesce(p_permiso, '')));

  if v_permiso in ('movvar.escribir', 'movimientos.editar') then
    return public.sec_permiso_modulo_escritura_ok('movimientos');
  end if;

  v_role := coalesce(
    auth.jwt() -> 'app_metadata' ->> 'role',
    auth.jwt() -> 'user_metadata' ->> 'role',
    ''
  );
  v_norm := lower(replace(btrim(v_role), '-', '_'));

  if v_norm in ('admin', 'admin_sistema', 'admin_remuneraciones', 'administrador', 'administrator') then
    return true;
  end if;

  if v_norm in ('consulta', 'consulta_remuneraciones', 'solo_lectura', 'readonly', 'viewer') then
    return false;
  end if;

  case v_permiso
    when 'nomina.validar' then
      return v_norm in ('operador', 'operador_remuneraciones', 'rrhh', 'user');
    when 'nomina.aprobar' then
      return v_norm in ('operador', 'operador_remuneraciones', 'rrhh', 'user');
    when 'nomina.cerrar' then
      return false;
    when 'nomina.reabrir' then
      return false;
    when 'nomina.consolidar' then
      return v_norm in ('operador', 'operador_remuneraciones', 'rrhh', 'user');
    when 'nomina.liquidaciones' then
      return v_norm in ('operador', 'operador_remuneraciones', 'rrhh', 'user');
    when 'nomina.rectificacion' then
      return v_norm in ('operador', 'operador_remuneraciones', 'rrhh', 'user');
    else
      return false;
  end case;
end;
$$;

comment on function public.erp_nomina_permiso_efectivo(text) is
  'Permisos RPC nómina + movvar.escribir (SEC-02d).';

revoke all on function public.erp_nomina_permiso_efectivo(text) from public, anon;
grant execute on function public.erp_nomina_permiso_efectivo(text) to authenticated, service_role;


-- ---------------------------------------------------------------------------
-- 3. Policies movimiento_variable_mensual (lectura tenant; escritura + rol)
-- ---------------------------------------------------------------------------

alter table public.movimiento_variable_mensual enable row level security;
alter table public.movimiento_variable_mensual force row level security;

drop policy if exists movimiento_variable_mensual_insert_tenant on public.movimiento_variable_mensual;
drop policy if exists movimiento_variable_mensual_update_tenant on public.movimiento_variable_mensual;
drop policy if exists movimiento_variable_mensual_delete_tenant on public.movimiento_variable_mensual;

create policy movimiento_variable_mensual_insert_tenant on public.movimiento_variable_mensual
  for insert to authenticated
  with check (
    public.sec_persona_tenant_ok(id_persona)
    and public.sec_movvar_escritura_ok()
  );

create policy movimiento_variable_mensual_update_tenant on public.movimiento_variable_mensual
  for update to authenticated
  using (
    public.sec_persona_tenant_ok(id_persona)
    and public.sec_movvar_escritura_ok()
  )
  with check (
    public.sec_persona_tenant_ok(id_persona)
    and public.sec_movvar_escritura_ok()
  );

create policy movimiento_variable_mensual_delete_tenant on public.movimiento_variable_mensual
  for delete to authenticated
  using (
    public.sec_persona_tenant_ok(id_persona)
    and public.sec_movvar_escritura_ok()
  );


-- ---------------------------------------------------------------------------
-- 4. Smoke
-- ---------------------------------------------------------------------------

do $$
declare
  v_qual text;
begin
  select coalesce(with_check, '') into v_qual
  from pg_policies
  where schemaname = 'public'
    and tablename = 'movimiento_variable_mensual'
    and policyname = 'movimiento_variable_mensual_insert_tenant';

  if v_qual is null or v_qual not like '%sec_movvar_escritura_ok%' then
    raise exception 'SEC-02d smoke: policy insert movvar sin sec_movvar_escritura_ok';
  end if;

  if not exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'sec_movvar_escritura_ok'
  ) then
    raise exception 'SEC-02d smoke: falta función sec_movvar_escritura_ok';
  end if;
end;
$$;

notify pgrst, 'reload schema';

commit;
