-- F15b permisos RPC + F14 aprobación + F15 liquidaciones + F16 cierre (Ola 5–6)

alter table public.evento_auditoria_nomina
  drop constraint if exists evento_auditoria_nomina_accion_check;

alter table public.evento_auditoria_nomina
  add constraint evento_auditoria_nomina_accion_check
  check (
    accion in (
      'creada',
      'dotacion_confirmada',
      'movimientos_actualizados',
      'calculo_invalidado',
      'calculada',
      'validada',
      'validacion_completada',
      'aprobada',
      'aprobacion_registrada',
      'liquidada',
      'cerrada',
      'cierre_registrado',
      'reabierta',
      'anulada'
    )
  );

-- ---------------------------------------------------------------------------
-- F15b: permiso efectivo por rol JWT
-- ---------------------------------------------------------------------------

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
    when 'nomina.consolidar' then
      return v_norm in ('operador', 'operador_remuneraciones', 'rrhh', 'user');
    when 'nomina.liquidaciones' then
      return v_norm in ('operador', 'operador_remuneraciones', 'rrhh', 'user');
    else
      return false;
  end case;
end;
$$;

comment on function public.erp_nomina_permiso_efectivo(text) is
  'F15b: matriz de permisos RPC alineada a roles JWT de remuneraciones.';

revoke all on function public.erp_nomina_permiso_efectivo(text) from public, anon;
grant execute on function public.erp_nomina_permiso_efectivo(text) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Guardia permisos en validar_nomina
-- ---------------------------------------------------------------------------

create or replace function public.validar_nomina(p_nomina_id uuid)
returns public.nomina_periodo
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_nomina public.nomina_periodo%rowtype;
  v_pendientes_criticas integer;
  v_pendientes_advertencias integer;
  v_consolidaciones_pendientes integer;
begin
  if not public.erp_nomina_permiso_efectivo('nomina.validar') then
    raise exception 'No tienes permiso para validar nóminas';
  end if;

  perform public.sincronizar_incidencias_nomina(p_nomina_id);

  select *
  into v_nomina
  from public.nomina_periodo np
  where np.id = p_nomina_id
  for update;

  if not found then
    raise exception 'Nomina no encontrada';
  end if;

  if v_nomina.estado <> 'calculada' then
    raise exception 'La nómina debe estar en estado calculada para validar (actual: %)', v_nomina.estado;
  end if;

  if not coalesce(v_nomina.calculo_vigente, false) then
    raise exception 'El cálculo no está vigente. Vuelve a procesarlo antes de validar.';
  end if;

  if v_nomina.tipo = 'mensual' and v_nomina.naturaleza = 'liquidacion_legal' then
    select count(*)
    into v_consolidaciones_pendientes
    from public.nomina_consolidacion c
    where c.id_nomina_destino = p_nomina_id
      and c.estado = 'pendiente';

    if v_consolidaciones_pendientes > 0 then
      raise exception
        'Hay % consolidación(es) pendiente(s). Concilia anticipos o extraordinarias antes de validar.',
        v_consolidaciones_pendientes;
    end if;
  end if;

  select count(*)
  into v_pendientes_criticas
  from public.incidencia_nomina i
  where i.id_nomina_periodo = p_nomina_id
    and i.severidad = 'critica'
    and i.estado_decision = 'pendiente';

  if v_pendientes_criticas > 0 then
    raise exception
      'Hay % incidencia(s) crítica(s) sin resolver',
      v_pendientes_criticas;
  end if;

  select count(*)
  into v_pendientes_advertencias
  from public.incidencia_nomina i
  where i.id_nomina_periodo = p_nomina_id
    and i.severidad = 'advertencia'
    and i.estado_decision = 'pendiente';

  if v_pendientes_advertencias > 0 then
    raise exception
      'Hay % advertencia(s) sin aceptar con justificación',
      v_pendientes_advertencias;
  end if;

  select *
  into v_nomina
  from public.transicionar_nomina_periodo(
    p_nomina_id,
    'calculada',
    'validada',
    'Validación F13: incidencias revisadas y decisiones registradas.',
    null, null, null, null, null, null
  );

  perform public.registrar_evento_auditoria_nomina(
    p_nomina_id,
    'validacion_completada',
    'Nómina validada con decisiones de incidencias.',
    'calculada',
    'validada',
    v_nomina.version_estado - 1,
    v_nomina.version_estado,
    jsonb_build_object('version_calculo', v_nomina.version_calculo)
  );

  return v_nomina;
end;
$$;

-- ---------------------------------------------------------------------------
-- F14: aprobar nómina (validada → aprobada)
-- ---------------------------------------------------------------------------

create or replace function public.aprobar_nomina(p_nomina_id uuid)
returns public.nomina_periodo
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_nomina public.nomina_periodo%rowtype;
  v_consolidaciones_pendientes integer;
begin
  if not public.erp_nomina_permiso_efectivo('nomina.aprobar') then
    raise exception 'No tienes permiso para aprobar nóminas';
  end if;

  select *
  into v_nomina
  from public.nomina_periodo np
  where np.id = p_nomina_id
  for update;

  if not found then
    raise exception 'Nomina no encontrada';
  end if;

  if v_nomina.estado <> 'validada' then
    raise exception 'La nómina debe estar validada para aprobar (actual: %)', v_nomina.estado;
  end if;

  if not coalesce(v_nomina.calculo_vigente, false) then
    raise exception 'El cálculo no está vigente. Vuelve a procesarlo antes de aprobar.';
  end if;

  if v_nomina.tipo = 'mensual' and v_nomina.naturaleza = 'liquidacion_legal' then
    select count(*)
    into v_consolidaciones_pendientes
    from public.nomina_consolidacion c
    where c.id_nomina_destino = p_nomina_id
      and c.estado = 'pendiente';

    if v_consolidaciones_pendientes > 0 then
      raise exception
        'Hay % consolidación(es) pendiente(s). Concilia antes de aprobar.',
        v_consolidaciones_pendientes;
    end if;
  end if;

  select *
  into v_nomina
  from public.transicionar_nomina_periodo(
    p_nomina_id,
    'validada',
    'aprobada',
    'Aprobación F14: cálculo vigente y validación completada.',
    null, null, null, null, null, null
  );

  perform public.registrar_evento_auditoria_nomina(
    p_nomina_id,
    'aprobacion_registrada',
    'Nómina aprobada para cierre y liquidaciones.',
    'validada',
    'aprobada',
    v_nomina.version_estado - 1,
    v_nomina.version_estado,
    jsonb_build_object(
      'version_calculo', v_nomina.version_calculo,
      'total_liquido', v_nomina.total_liquido,
      'total_trabajadores', v_nomina.total_trabajadores
    )
  );

  return v_nomina;
end;
$$;

comment on function public.aprobar_nomina(uuid) is
  'F14: transiciona validada → aprobada con guardias de cálculo y consolidación.';

revoke all on function public.aprobar_nomina(uuid) from public, anon;
grant execute on function public.aprobar_nomina(uuid) to authenticated, service_role;

-- Guardia permisos en consolidación
create or replace function public.aplicar_consolidaciones_nomina(p_id_nomina_destino uuid)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_destino public.nomina_periodo%rowtype;
  v_aplicadas integer := 0;
  v_total_anticipos numeric(18, 2) := 0;
  v_total_extra numeric(18, 2) := 0;
  v_rec record;
begin
  if not public.erp_nomina_permiso_efectivo('nomina.consolidar') then
    raise exception 'No tienes permiso para aplicar consolidaciones';
  end if;

  select *
  into v_destino
  from public.nomina_periodo np
  where np.id = p_id_nomina_destino
  for update;

  if not found then
    raise exception 'Nómina destino no encontrada';
  end if;

  if v_destino.tipo <> 'mensual' or v_destino.naturaleza <> 'liquidacion_legal' then
    raise exception 'Solo aplica a nóminas mensuales de liquidación legal';
  end if;

  for v_rec in
    select c.*
    from public.nomina_consolidacion c
    where c.id_nomina_destino = p_id_nomina_destino
      and c.estado = 'pendiente'
    order by c.created_at
    for update
  loop
    update public.nomina_consolidacion
    set estado = 'aplicada',
        metadata = metadata || jsonb_build_object(
          'aplicada_at', now(),
          'version_calculo_destino', v_destino.version_calculo
        ),
        updated_at = now()
    where id = v_rec.id;

    if v_rec.tipo = 'anticipo' then
      v_total_anticipos := v_total_anticipos + v_rec.monto_pagado;
    else
      v_total_extra := v_total_extra + v_rec.monto_pagado;
    end if;

    v_aplicadas := v_aplicadas + 1;
  end loop;

  return jsonb_build_object(
    'aplicadas', v_aplicadas,
    'total_anticipos', v_total_anticipos,
    'total_extraordinarias', v_total_extra
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- F15: liquidaciones internas por nómina
-- ---------------------------------------------------------------------------

create or replace function public.listar_liquidaciones_nomina(
  p_id_nomina_periodo uuid
)
returns setof public.nomina_liquidacion_periodo
language sql
stable
security invoker
set search_path = public
as $$
  select l.*
  from public.nomina_liquidacion_periodo l
  where l.id_nomina_periodo = p_id_nomina_periodo
  order by l.version desc, l.created_at desc;
$$;

comment on function public.listar_liquidaciones_nomina(uuid) is
  'F15: lista liquidaciones persistidas de una nómina.';

revoke all on function public.listar_liquidaciones_nomina(uuid) from public, anon;
grant execute on function public.listar_liquidaciones_nomina(uuid) to authenticated, service_role;

create or replace function public.generar_liquidaciones_nomina(
  p_id_nomina_periodo uuid
)
returns public.nomina_liquidacion_periodo
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_nomina public.nomina_periodo%rowtype;
  v_calculo public.nomina_calculo_periodo%rowtype;
  v_liq public.nomina_liquidacion_periodo%rowtype;
  v_version integer;
  v_trab record;
begin
  if not public.erp_nomina_permiso_efectivo('nomina.liquidaciones') then
    raise exception 'No tienes permiso para generar liquidaciones';
  end if;

  select *
  into v_nomina
  from public.nomina_periodo np
  where np.id = p_id_nomina_periodo
  for update;

  if not found then
    raise exception 'Nómina no encontrada';
  end if;

  if v_nomina.estado not in ('aprobada', 'liquidada') then
    raise exception 'La nómina debe estar aprobada para generar liquidaciones (actual: %)', v_nomina.estado;
  end if;

  if not coalesce(v_nomina.calculo_vigente, false) or v_nomina.id_calculo_periodo_vigente is null then
    raise exception 'No hay cálculo vigente para generar liquidaciones';
  end if;

  select *
  into v_calculo
  from public.nomina_calculo_periodo c
  where c.id_calculo_periodo = v_nomina.id_calculo_periodo_vigente;

  if not found then
    raise exception 'Snapshot de cálculo no encontrado';
  end if;

  select coalesce(max(l.version), 0) + 1
  into v_version
  from public.nomina_liquidacion_periodo l
  where l.id_nomina_periodo = p_id_nomina_periodo;

  insert into public.nomina_liquidacion_periodo (
    periodo,
    id_calculo_periodo,
    id_nomina_periodo,
    id_empresa,
    tipo_liquidacion,
    estado,
    version,
    total_trabajadores,
    total_haberes,
    total_descuentos,
    total_liquido,
    metadata
  )
  values (
    v_nomina.periodo,
    v_calculo.id_calculo_periodo,
    p_id_nomina_periodo,
    v_nomina.id_empresa,
    case v_nomina.tipo
      when 'mensual' then 'mensual'
      when 'quincenal' then 'quincenal'
      when 'semanal' then 'semanal'
      else 'extraordinaria'
    end,
    'generada',
    v_version,
    coalesce(v_calculo.total_trabajadores, 0),
    coalesce(v_calculo.total_haberes, 0),
    coalesce(v_calculo.total_descuentos, 0),
    coalesce(v_calculo.total_liquido, 0),
    jsonb_build_object(
      'version_calculo', v_nomina.version_calculo,
      'generada_desde', 'generador_nomina_f15'
    )
  )
  returning * into v_liq;

  for v_trab in
    select t.*
    from public.nomina_calculo_trabajador t
    where t.id_calculo_periodo = v_calculo.id_calculo_periodo
  loop
    insert into public.nomina_liquidacion_trabajador (
      id_liquidacion_periodo,
      id_calculo_periodo,
      id_persona,
      rut,
      nombre_trabajador,
      base_imponible,
      base_tributable,
      total_haberes,
      total_descuentos,
      liquido_pagar,
      estado,
      metadata
    )
    values (
      v_liq.id_liquidacion_periodo,
      v_calculo.id_calculo_periodo,
      v_trab.id_persona,
      v_trab.rut,
      v_trab.nombre_completo_snapshot,
      coalesce(v_trab.base_imponible_previsional, 0),
      coalesce(v_trab.base_tributable, 0),
      coalesce(v_trab.total_haberes_imponibles, 0) + coalesce(v_trab.total_haberes_no_imponibles, 0),
      coalesce(v_trab.total_descuentos_legales, 0) + coalesce(v_trab.total_descuentos_voluntarios, 0),
      coalesce(v_trab.liquido_preliminar, 0),
      'generada',
      '{}'::jsonb
    );
  end loop;

  if v_nomina.estado = 'aprobada' then
    perform public.transicionar_nomina_periodo(
      p_id_nomina_periodo,
      'aprobada',
      'liquidada',
      'Liquidaciones F15 generadas.',
      null, null, null, null, null, null
    );
  end if;

  return v_liq;
end;
$$;

comment on function public.generar_liquidaciones_nomina(uuid) is
  'F15: genera liquidaciones internas desde snapshot vigente de la nómina.';

revoke all on function public.generar_liquidaciones_nomina(uuid) from public, anon;
grant execute on function public.generar_liquidaciones_nomina(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- F16: cierre transaccional
-- ---------------------------------------------------------------------------

create or replace function public.cerrar_nomina(
  p_nomina_id uuid,
  p_motivo text default null
)
returns public.nomina_periodo
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_nomina public.nomina_periodo%rowtype;
  v_estado_previo text;
  v_liquidaciones integer;
  v_consolidaciones_pendientes integer;
  v_pendientes_criticas integer;
begin
  if not public.erp_nomina_permiso_efectivo('nomina.cerrar') then
    raise exception 'No tienes permiso para cerrar nóminas. Requiere administración de remuneraciones.';
  end if;

  select *
  into v_nomina
  from public.nomina_periodo np
  where np.id = p_nomina_id
  for update;

  if not found then
    raise exception 'Nomina no encontrada';
  end if;

  if v_nomina.estado not in ('aprobada', 'liquidada') then
    raise exception 'La nómina debe estar aprobada o liquidada para cerrar (actual: %)', v_nomina.estado;
  end if;

  if not coalesce(v_nomina.calculo_vigente, false) then
    raise exception 'El cálculo no está vigente. No se puede cerrar.';
  end if;

  select count(*)
  into v_pendientes_criticas
  from public.incidencia_nomina i
  where i.id_nomina_periodo = p_nomina_id
    and i.severidad = 'critica'
    and i.estado_decision = 'pendiente';

  if v_pendientes_criticas > 0 then
    raise exception 'Hay incidencias críticas sin resolver';
  end if;

  if v_nomina.tipo = 'mensual' and v_nomina.naturaleza = 'liquidacion_legal' then
    select count(*)
    into v_consolidaciones_pendientes
    from public.nomina_consolidacion c
    where c.id_nomina_destino = p_nomina_id
      and c.estado = 'pendiente';

    if v_consolidaciones_pendientes > 0 then
      raise exception 'Hay consolidaciones pendientes sin aplicar';
    end if;
  end if;

  select count(*)
  into v_liquidaciones
  from public.nomina_liquidacion_periodo l
  where l.id_nomina_periodo = p_nomina_id;

  if v_liquidaciones = 0 then
    raise exception 'Debes generar liquidaciones antes de cerrar la nómina';
  end if;

  v_estado_previo := v_nomina.estado;

  select *
  into v_nomina
  from public.transicionar_nomina_periodo(
    p_nomina_id,
    v_estado_previo,
    'cerrada',
    coalesce(p_motivo, 'Cierre F16: expediente congelado.'),
    null, null, null, null, null, null
  );

  perform public.registrar_evento_auditoria_nomina(
    p_nomina_id,
    'cierre_registrado',
    coalesce(p_motivo, 'Nómina cerrada operativamente.'),
    v_estado_previo,
    'cerrada',
    v_nomina.version_estado - 1,
    v_nomina.version_estado,
    jsonb_build_object(
      'version_calculo', v_nomina.version_calculo,
      'liquidaciones', v_liquidaciones
    )
  );

  return v_nomina;
end;
$$;

comment on function public.cerrar_nomina(uuid, text) is
  'F16: cierre transaccional con guardias de cálculo, consolidación y liquidaciones.';

revoke all on function public.cerrar_nomina(uuid, text) from public, anon;
grant execute on function public.cerrar_nomina(uuid, text) to authenticated, service_role;
