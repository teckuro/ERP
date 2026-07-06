-- BKL-06 / F15b residual: permisos en transicionar_nomina_periodo (no solo wrappers).

create or replace function public.erp_nomina_permiso_efectivo(p_permiso text)
returns boolean
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_role text;
  v_norm text;
begin
  v_role := coalesce(
    auth.jwt() -> 'app_metadata' ->> 'role',
    auth.jwt() -> 'user_metadata' ->> 'role',
    ''
  );
  v_norm := lower(replace(trim(v_role), '-', '_'));

  if v_norm in ('admin', 'admin_sistema', 'admin_remuneraciones', 'administrador', 'administrator') then
    return true;
  end if;

  if v_norm in ('consulta', 'consulta_remuneraciones', 'solo_lectura', 'readonly', 'viewer') then
    return false;
  end if;

  case p_permiso
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
    else
      return false;
  end case;
end;
$$;

create or replace function public.transicionar_nomina_periodo(
  p_nomina_id uuid,
  p_estado_esperado text,
  p_estado_destino text,
  p_motivo text default null,
  p_id_calculo_periodo bigint default null,
  p_total_trabajadores integer default null,
  p_total_haberes numeric default null,
  p_total_descuentos numeric default null,
  p_total_liquido numeric default null,
  p_version_estado_esperada integer default null
)
returns public.nomina_periodo
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_actual public.nomina_periodo%rowtype;
  v_permitida boolean;
  v_permiso text;
begin
  select *
  into v_actual
  from public.nomina_periodo
  where id = p_nomina_id
  for update;

  if not found then
    raise exception 'Nomina no encontrada';
  end if;

  if v_actual.estado <> p_estado_esperado then
    raise exception
      'La nomina cambio de estado: esperado %, actual %',
      p_estado_esperado,
      v_actual.estado;
  end if;

  if p_version_estado_esperada is not null
    and v_actual.version_estado <> p_version_estado_esperada then
    raise exception
      'Version de estado esperada %, version actual %',
      p_version_estado_esperada,
      v_actual.version_estado
      using errcode = '40001';
  end if;

  v_permiso := case p_estado_destino
    when 'validada' then 'nomina.validar'
    when 'aprobada' then 'nomina.aprobar'
    when 'liquidada' then 'nomina.liquidaciones'
    when 'cerrada' then 'nomina.cerrar'
    when 'reabierta' then 'nomina.reabrir'
    else null
  end;

  if v_permiso is not null and not public.erp_nomina_permiso_efectivo(v_permiso) then
    raise exception 'No tienes permiso para esta transición de nómina (% -> %)', p_estado_esperado, p_estado_destino;
  end if;

  v_permitida := case v_actual.estado
    when 'borrador'
      then p_estado_destino in ('dotacion_generada', 'anulada')
    when 'dotacion_generada'
      then p_estado_destino in ('en_revision', 'anulada')
    when 'en_revision'
      then p_estado_destino in ('calculada', 'anulada')
    when 'calculada'
      then p_estado_destino in ('en_revision', 'validada', 'anulada')
    when 'validada'
      then p_estado_destino in ('en_revision', 'aprobada', 'anulada')
    when 'aprobada'
      then p_estado_destino in (
        'en_revision',
        'liquidada',
        'cerrada',
        'anulada'
      )
    when 'liquidada'
      then p_estado_destino in ('en_revision', 'cerrada', 'anulada')
    when 'cerrada'
      then p_estado_destino = 'reabierta'
    when 'reabierta'
      then p_estado_destino in (
        'en_revision',
        'calculada',
        'validada',
        'aprobada',
        'liquidada',
        'cerrada',
        'anulada'
      )
    else false
  end;

  if not v_permitida then
    raise exception
      'Transicion no permitida: % -> %',
      v_actual.estado,
      p_estado_destino;
  end if;

  if p_id_calculo_periodo is not null then
    perform 1
    from public.nomina_calculo_periodo
    where id_calculo_periodo = p_id_calculo_periodo
      and periodo = v_actual.periodo
      and (
        id_empresa = v_actual.id_empresa
        or (
          id_empresa is null
          and (
            id_nomina_periodo is null
            or id_nomina_periodo = v_actual.id
          )
        )
      )
    for update;

    if not found then
      raise exception
        'El calculo indicado no pertenece a la nomina'
        using errcode = '23514';
    end if;

    update public.nomina_calculo_periodo
    set id_nomina_periodo = coalesce(id_nomina_periodo, v_actual.id)
    where id_calculo_periodo = p_id_calculo_periodo;
  end if;

  update public.nomina_periodo
  set
    estado = p_estado_destino,
    version_estado = version_estado + 1,
    id_calculo_periodo_vigente = case
      when p_estado_destino = 'calculada' then p_id_calculo_periodo
      when p_estado_destino in ('en_revision', 'reabierta') then null
      else id_calculo_periodo_vigente
    end,
    version_calculo = case
      when p_estado_destino = 'calculada' then version_calculo + 1
      else version_calculo
    end,
    calculo_vigente = case
      when p_estado_destino = 'calculada' then true
      when p_estado_destino in ('en_revision', 'reabierta') then false
      else calculo_vigente
    end,
    calculado_at = case
      when p_estado_destino = 'calculada' then now()
      else calculado_at
    end,
    validado_at = case
      when p_estado_destino = 'validada' then now()
      else validado_at
    end,
    aprobado_at = case
      when p_estado_destino = 'aprobada' then now()
      else aprobado_at
    end,
    closed_at = case
      when p_estado_destino = 'cerrada' then now()
      else closed_at
    end,
    motivo_cierre = case
      when p_estado_destino = 'cerrada' then coalesce(p_motivo, motivo_cierre)
      else motivo_cierre
    end,
    total_trabajadores = coalesce(p_total_trabajadores, total_trabajadores),
    total_haberes = coalesce(p_total_haberes, total_haberes),
    total_descuentos = coalesce(p_total_descuentos, total_descuentos),
    total_liquido = coalesce(p_total_liquido, total_liquido)
  where id = p_nomina_id
  returning * into v_actual;

  return v_actual;
end;
$$;

comment on function public.transicionar_nomina_periodo(uuid, text, text, text, bigint, integer, numeric, numeric, numeric, integer) is
  'BKL-06: transiciones con control optimista (version_estado) y permisos F15b por estado destino.';
