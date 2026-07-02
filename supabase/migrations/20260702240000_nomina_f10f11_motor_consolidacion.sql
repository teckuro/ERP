-- F10/F11 motor productivo + F12 consolidación (Ola 4)
-- Registra consolidaciones pendientes tras cálculo multi-tipo y expone RPCs de conciliación.

-- ---------------------------------------------------------------------------
-- Helper: nómina mensual consolidadora del mismo período
-- ---------------------------------------------------------------------------

create or replace function public.obtener_nomina_mensual_consolidadora(
  p_id_empresa integer,
  p_periodo text
)
returns uuid
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_id uuid;
begin
  select np.id
  into v_id
  from public.nomina_periodo np
  where np.id_empresa = p_id_empresa
    and np.periodo = p_periodo
    and np.tipo = 'mensual'
    and np.naturaleza = 'liquidacion_legal'
    and np.estado <> 'anulada'
  order by np.created_at asc
  limit 1;

  return v_id;
end;
$$;

comment on function public.obtener_nomina_mensual_consolidadora(integer, text) is
  'F12: devuelve la nómina mensual destino para consolidar anticipos/extraordinarias del período.';

revoke all on function public.obtener_nomina_mensual_consolidadora(integer, text) from public, anon;
grant execute on function public.obtener_nomina_mensual_consolidadora(integer, text) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- F10/F11: registrar consolidación pendiente tras cálculo de origen
-- ---------------------------------------------------------------------------

create or replace function public.registrar_consolidacion_calculo(
  p_id_nomina_origen uuid
)
returns public.nomina_consolidacion
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_origen public.nomina_periodo%rowtype;
  v_destino uuid;
  v_tipo text;
  v_monto numeric(18, 2);
  v_cons public.nomina_consolidacion%rowtype;
begin
  select *
  into v_origen
  from public.nomina_periodo np
  where np.id = p_id_nomina_origen;

  if not found then
    raise exception 'Nómina origen no encontrada';
  end if;

  if v_origen.naturaleza = 'anticipo' then
    v_tipo := 'anticipo';
  elsif v_origen.naturaleza = 'pago_extraordinario' then
    v_tipo := 'extraordinaria';
  else
    raise exception 'La nómina origen no requiere consolidación (naturaleza: %)', v_origen.naturaleza;
  end if;

  if not coalesce(v_origen.calculo_vigente, false) then
    raise exception 'El cálculo de la nómina origen no está vigente';
  end if;

  v_destino := public.obtener_nomina_mensual_consolidadora(v_origen.id_empresa, v_origen.periodo);
  if v_destino is null then
    raise exception
      'No existe nómina mensual del período % para consolidar',
      v_origen.periodo;
  end if;

  v_monto := coalesce(v_origen.total_liquido, 0);

  insert into public.nomina_consolidacion (
    id_empresa,
    id_nomina_origen,
    id_nomina_destino,
    tipo,
    estado,
    monto_pagado,
    metadata
  )
  values (
    v_origen.id_empresa,
    v_origen.id,
    v_destino,
    v_tipo,
    'pendiente',
    v_monto,
    jsonb_build_object(
      'version_calculo', v_origen.version_calculo,
      'total_trabajadores', v_origen.total_trabajadores,
      'total_haberes', v_origen.total_haberes,
      'total_descuentos', v_origen.total_descuentos,
      'codigo_ciclo', v_origen.codigo_ciclo,
      'naturaleza', v_origen.naturaleza
    )
  )
  on conflict (id_nomina_origen, id_nomina_destino, tipo)
  do update set
    monto_pagado = excluded.monto_pagado,
    estado = case
      when public.nomina_consolidacion.estado = 'aplicada' then public.nomina_consolidacion.estado
      else 'pendiente'
    end,
    metadata = excluded.metadata,
    updated_at = now()
  returning * into v_cons;

  return v_cons;
end;
$$;

comment on function public.registrar_consolidacion_calculo(uuid) is
  'F10/F11: upsert de consolidación pendiente hacia la mensual del mismo período.';

revoke all on function public.registrar_consolidacion_calculo(uuid) from public, anon;
grant execute on function public.registrar_consolidacion_calculo(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- F12a: listar consolidaciones pendientes de una nómina destino
-- ---------------------------------------------------------------------------

create or replace function public.listar_consolidaciones_pendientes(
  p_id_nomina_destino uuid
)
returns setof public.nomina_consolidacion
language sql
stable
security invoker
set search_path = public
as $$
  select c.*
  from public.nomina_consolidacion c
  where c.id_nomina_destino = p_id_nomina_destino
    and c.estado = 'pendiente'
  order by c.created_at asc;
$$;

comment on function public.listar_consolidaciones_pendientes(uuid) is
  'F12: lista consolidaciones pendientes hacia una nómina mensual destino.';

revoke all on function public.listar_consolidaciones_pendientes(uuid) from public, anon;
grant execute on function public.listar_consolidaciones_pendientes(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- F12a: vincular / desvincular consolidación (cambia destino)
-- ---------------------------------------------------------------------------

create or replace function public.vincular_consolidacion_nomina(
  p_id_consolidacion uuid,
  p_id_nomina_destino uuid
)
returns public.nomina_consolidacion
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_cons public.nomina_consolidacion%rowtype;
  v_destino public.nomina_periodo%rowtype;
begin
  select *
  into v_cons
  from public.nomina_consolidacion c
  where c.id = p_id_consolidacion
  for update;

  if not found then
    raise exception 'Consolidación no encontrada';
  end if;

  if v_cons.estado <> 'pendiente' then
    raise exception 'Solo se pueden vincular consolidaciones pendientes';
  end if;

  select *
  into v_destino
  from public.nomina_periodo np
  where np.id = p_id_nomina_destino;

  if not found then
    raise exception 'Nómina destino no encontrada';
  end if;

  if v_destino.tipo <> 'mensual' or v_destino.naturaleza <> 'liquidacion_legal' then
    raise exception 'La nómina destino debe ser mensual de liquidación legal';
  end if;

  update public.nomina_consolidacion
  set id_nomina_destino = p_id_nomina_destino,
      updated_at = now()
  where id = p_id_consolidacion
  returning * into v_cons;

  return v_cons;
end;
$$;

comment on function public.vincular_consolidacion_nomina(uuid, uuid) is
  'F12: reasigna el destino de una consolidación pendiente.';

revoke all on function public.vincular_consolidacion_nomina(uuid, uuid) from public, anon;
grant execute on function public.vincular_consolidacion_nomina(uuid, uuid) to authenticated, service_role;

create or replace function public.desvincular_consolidacion_nomina(
  p_id_consolidacion uuid
)
returns public.nomina_consolidacion
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_cons public.nomina_consolidacion%rowtype;
begin
  select *
  into v_cons
  from public.nomina_consolidacion c
  where c.id = p_id_consolidacion
  for update;

  if not found then
    raise exception 'Consolidación no encontrada';
  end if;

  if v_cons.estado <> 'pendiente' then
    raise exception 'Solo se pueden desvincular consolidaciones pendientes';
  end if;

  update public.nomina_consolidacion
  set estado = 'anulada',
      updated_at = now()
  where id = p_id_consolidacion
  returning * into v_cons;

  return v_cons;
end;
$$;

comment on function public.desvincular_consolidacion_nomina(uuid) is
  'F12: anula una consolidación pendiente (desvincular origen).';

revoke all on function public.desvincular_consolidacion_nomina(uuid) from public, anon;
grant execute on function public.desvincular_consolidacion_nomina(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- F12b: aplicar consolidaciones pendientes (idempotente)
-- ---------------------------------------------------------------------------

create or replace function public.aplicar_consolidaciones_nomina(
  p_id_nomina_destino uuid
)
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

comment on function public.aplicar_consolidaciones_nomina(uuid) is
  'F12b: marca consolidaciones pendientes como aplicadas en la mensual destino.';

revoke all on function public.aplicar_consolidaciones_nomina(uuid) from public, anon;
grant execute on function public.aplicar_consolidaciones_nomina(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Guardia consolidación en validar_nomina (mensual con pendientes)
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
    null,
    null,
    null,
    null,
    null,
    null
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
