-- SEC-07 (AUDIT-SEC-2026-11) — Identidad solo desde app_metadata + permisos en RPC definer
--
-- Problema:
--   1) current_user_empresa_id(), erp_nomina_permiso_efectivo() y
--      sec_permiso_modulo_escritura_ok() caían a `user_metadata` cuando el JWT
--      no traía empresa/rol en `app_metadata`. `user_metadata` lo edita el propio
--      usuario (supabase.auth.updateUser), y el registro público está habilitado:
--      una cuenta nueva podía declararse { id_empresa: 1, role: 'admin' } y
--      obtener lectura/escritura sobre esa empresa.
--   2) guardar/confirmar/marcar_licencia_medica (SECURITY DEFINER) filtraban por
--      empresa pero no validaban permiso de escritura: un rol de solo consulta
--      podía crear/editar licencias.
--   3) registrar_evento_auditoria_nomina (SECURITY DEFINER) insertaba eventos
--      para cualquier nómina sin validar que perteneciera a la empresa del usuario.
--
-- Cambio:
--   - Rol y empresa se leen SOLO de `app_metadata` (lo asigna el servidor).
--   - Las RPC de licencias exigen sec_permiso_modulo_escritura_ok('licencias').
--   - La RPC de auditoría exige que la nómina sea de la empresa del usuario.
--
-- Impacto verificado antes de aplicar (consulta de solo lectura, 2026-11-17):
--   - 4 usuarios en auth.users, todos con role e id_empresa en app_metadata;
--     ninguno depende de user_metadata.
--   - licencia-medica-inbound inserta con service_role (no usa estas RPC).
--   - registrar_evento_auditoria_nomina solo se invoca desde cerrar/validar/aprobar_nomina.

begin;

select pg_advisory_xact_lock(hashtext('SEC-07-jwt-app-metadata'));

-- ---------------------------------------------------------------------
-- 1. Empresa activa: solo app_metadata
-- ---------------------------------------------------------------------
create or replace function public.current_user_empresa_id()
returns integer
language sql
stable
set search_path = public, auth
as $$
  select nullif((auth.jwt() -> 'app_metadata' ->> 'id_empresa'), '')::integer
$$;

comment on function public.current_user_empresa_id() is
  'SEC-07: empresa activa desde JWT app_metadata.id_empresa (asignado por el servidor). Sin fallback a user_metadata: si falta, retorna NULL y RLS bloquea.';

-- ---------------------------------------------------------------------
-- 2. Permisos de nómina: rol solo desde app_metadata
-- ---------------------------------------------------------------------
create or replace function public.erp_nomina_permiso_efectivo(p_permiso text)
returns boolean
language plpgsql
stable
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

  v_role := coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '');
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

-- ---------------------------------------------------------------------
-- 3. Escritura por módulo: rol solo desde app_metadata
-- ---------------------------------------------------------------------
create or replace function public.sec_permiso_modulo_escritura_ok(p_modulo text)
returns boolean
language plpgsql
stable
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
    v_role := coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '');
  end if;

  v_norm := lower(replace(btrim(v_role), '-', '_'));

  if v_norm in ('admin', 'admin_sistema', 'admin_remuneraciones', 'administrador', 'administrator') then
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
  'SEC-07: escritura por módulo según rol de app_metadata y ajustes finos perfil_acceso. No lee user_metadata.';

-- ---------------------------------------------------------------------
-- 4. Licencias médicas: exigir permiso de escritura en RPC definer
-- ---------------------------------------------------------------------
create or replace function public.sec_exigir_escritura_licencias(p_rpc text)
returns void
language plpgsql
stable
set search_path = public
as $$
begin
  if not public.sec_permiso_modulo_escritura_ok('licencias') then
    raise exception '%: sin permiso para modificar licencias médicas', p_rpc using errcode = '42501';
  end if;
end;
$$;

revoke all on function public.sec_exigir_escritura_licencias(text) from public, anon;
grant execute on function public.sec_exigir_escritura_licencias(text) to authenticated, service_role;

create or replace function public.guardar_licencia_medica(
  p_id_licencia integer default null::integer,
  p_id_persona integer default null::integer,
  p_id_contrato integer default null::integer,
  p_folio text default null::text,
  p_tipo text default null::text,
  p_fecha_inicio date default null::date,
  p_fecha_termino date default null::date,
  p_dias numeric default null::numeric,
  p_estado text default null::text,
  p_monto_subsidio numeric default null::numeric,
  p_observacion text default null::text,
  p_origen text default 'manual'::text,
  p_id_ingreso integer default null::integer
)
returns public.licencia_medica
language plpgsql
security definer
set search_path = public
as $$
declare
    v_id_empresa integer;
    v_row public.licencia_medica;
    v_estado text;
begin
    v_id_empresa := public.current_user_empresa_id();
    if v_id_empresa is null then
        raise exception 'guardar_licencia_medica: empresa no identificada' using errcode = '42501';
    end if;
    perform public.sec_exigir_escritura_licencias('guardar_licencia_medica');

    v_estado := coalesce(nullif(btrim(p_estado), ''), 'pendiente_revision');

    if p_id_licencia is not null then
        update public.licencia_medica
        set
            id_persona = coalesce(p_id_persona, id_persona),
            id_contrato = coalesce(p_id_contrato, id_contrato),
            folio = coalesce(nullif(btrim(p_folio), ''), folio),
            tipo = coalesce(nullif(btrim(p_tipo), ''), tipo),
            fecha_inicio = coalesce(p_fecha_inicio, fecha_inicio),
            fecha_termino = coalesce(p_fecha_termino, fecha_termino),
            dias = coalesce(p_dias, dias),
            estado = v_estado,
            monto_subsidio = coalesce(p_monto_subsidio, monto_subsidio),
            observacion = coalesce(p_observacion, observacion),
            origen = coalesce(nullif(btrim(p_origen), ''), origen),
            id_ingreso = coalesce(p_id_ingreso, id_ingreso)
        where id_licencia = p_id_licencia
          and id_empresa = v_id_empresa
        returning * into v_row;
    else
        insert into public.licencia_medica (
            id_empresa, id_persona, id_contrato, folio, tipo, fecha_inicio, fecha_termino,
            dias, estado, monto_subsidio, observacion, origen, id_ingreso, creado_por
        ) values (
            v_id_empresa, p_id_persona, p_id_contrato, nullif(btrim(p_folio), ''), nullif(btrim(p_tipo), ''),
            p_fecha_inicio, p_fecha_termino, p_dias, v_estado, p_monto_subsidio, p_observacion,
            coalesce(nullif(btrim(p_origen), ''), 'manual'), p_id_ingreso, auth.uid()
        )
        returning * into v_row;
    end if;

    if v_row.id_licencia is null then
        raise exception 'guardar_licencia_medica: no fue posible persistir' using errcode = 'P0001';
    end if;

    return v_row;
end;
$$;

create or replace function public.confirmar_licencia_medica(p_id_licencia integer)
returns public.licencia_medica
language plpgsql
security definer
set search_path = public
as $$
declare
    v_id_empresa integer;
    v_row public.licencia_medica;
begin
    v_id_empresa := public.current_user_empresa_id();
    if v_id_empresa is null then
        raise exception 'confirmar_licencia_medica: empresa no identificada' using errcode = '42501';
    end if;
    perform public.sec_exigir_escritura_licencias('confirmar_licencia_medica');

    select * into v_row
    from public.licencia_medica
    where id_licencia = p_id_licencia
      and id_empresa = v_id_empresa
    for update;

    if not found then
        raise exception 'confirmar_licencia_medica: licencia no encontrada' using errcode = 'P0002';
    end if;

    if v_row.id_persona is null then
        raise exception 'confirmar_licencia_medica: debe indicar trabajador' using errcode = '23514';
    end if;
    if v_row.folio is null or btrim(v_row.folio) = '' then
        raise exception 'confirmar_licencia_medica: debe indicar folio' using errcode = '23514';
    end if;
    if v_row.fecha_inicio is null or v_row.fecha_termino is null then
        raise exception 'confirmar_licencia_medica: debe indicar vigencia' using errcode = '23514';
    end if;
    if v_row.dias is null or v_row.dias <= 0 then
        raise exception 'confirmar_licencia_medica: debe indicar días' using errcode = '23514';
    end if;
    if v_row.tipo is null or btrim(v_row.tipo) = '' then
        raise exception 'confirmar_licencia_medica: debe indicar tipo' using errcode = '23514';
    end if;

    update public.licencia_medica
    set estado = 'registrada'
    where id_licencia = p_id_licencia
    returning * into v_row;

    if v_row.id_ingreso is not null then
        update public.licencia_medica_ingreso_correo
        set estado = 'procesado', id_licencia = p_id_licencia
        where id_ingreso = v_row.id_ingreso
          and id_empresa = v_id_empresa;
    end if;

    return v_row;
end;
$$;

create or replace function public.marcar_licencia_medica_vinculada_nomina(p_id_licencia integer)
returns public.licencia_medica
language plpgsql
security definer
set search_path = public
as $$
declare
    v_id_empresa integer;
    v_row public.licencia_medica;
begin
    v_id_empresa := public.current_user_empresa_id();
    if v_id_empresa is null then
        raise exception 'marcar_licencia_medica_vinculada_nomina: empresa no identificada' using errcode = '42501';
    end if;
    perform public.sec_exigir_escritura_licencias('marcar_licencia_medica_vinculada_nomina');

    update public.licencia_medica
    set estado = 'vinculada_nomina'
    where id_licencia = p_id_licencia
      and id_empresa = v_id_empresa
    returning * into v_row;

    if not found then
        raise exception 'marcar_licencia_medica_vinculada_nomina: licencia no encontrada' using errcode = 'P0002';
    end if;

    return v_row;
end;
$$;

-- ---------------------------------------------------------------------
-- 5. Auditoría de nómina: solo nóminas de la empresa del usuario
-- ---------------------------------------------------------------------
create or replace function public.registrar_evento_auditoria_nomina(
  p_id_nomina_periodo uuid,
  p_accion text,
  p_motivo text default null::text,
  p_estado_previo text default null::text,
  p_estado_nuevo text default null::text,
  p_version_estado_esperada integer default null::integer,
  p_version_estado_resultante integer default null::integer,
  p_payload jsonb default null::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_event_id uuid;
  v_user uuid;
begin
  if not exists (
    select 1
    from public.nomina_periodo np
    where np.id = p_id_nomina_periodo
      and np.id_empresa = public.current_user_empresa_id()
  ) then
    raise exception 'registrar_evento_auditoria_nomina: nómina no pertenece a la empresa del usuario'
      using errcode = '42501';
  end if;

  v_user := public.current_user_id();

  insert into public.evento_auditoria_nomina (
    id_nomina_periodo, accion, id_usuario, motivo, estado_previo, estado_nuevo,
    version_estado_esperada, version_estado_resultante, payload
  ) values (
    p_id_nomina_periodo, p_accion, v_user, p_motivo, p_estado_previo, p_estado_nuevo,
    p_version_estado_esperada, p_version_estado_resultante, p_payload
  )
  returning id into v_event_id;

  return v_event_id;
end;
$$;

-- Verificación: ninguna función pública debe seguir leyendo user_metadata.
do $$
declare
  v_pendientes text;
begin
  select string_agg(p.proname, ', ')
  into v_pendientes
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and pg_get_functiondef(p.oid) ilike '%user_metadata%';

  if v_pendientes is not null then
    raise exception 'SEC-07: funciones que aún leen user_metadata: %', v_pendientes;
  end if;
end;
$$;

notify pgrst, 'reload schema';

commit;
