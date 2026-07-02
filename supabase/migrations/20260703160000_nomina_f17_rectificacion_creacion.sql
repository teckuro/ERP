-- =============================================================================
-- 20260703160000_nomina_f17_rectificacion_creacion.sql
-- F17 — feature gate, permiso RPC, preview/confirmación y liquidación diferencial.
-- =============================================================================

set search_path = public;

comment on column public.empresa.feature_gates is
  'Flags por tenant (Anexo B). Claves: nomina.anticipos.enabled, nomina.extraordinaria.enabled, nomina.rectificacion.enabled.';

create or replace function public.obtener_feature_gates_nomina()
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select jsonb_build_object(
    'anticipos', public.erp_nomina_feature_habilitado('nomina.anticipos.enabled'),
    'extraordinaria', public.erp_nomina_feature_habilitado('nomina.extraordinaria.enabled'),
    'rectificacion', public.erp_nomina_feature_habilitado('nomina.rectificacion.enabled')
  );
$$;

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
    when 'nomina.rectificacion' then
      return v_norm in ('operador', 'operador_remuneraciones', 'rrhh', 'user');
    else
      return false;
  end case;
end;
$$;

create or replace function public.nomina_resolver_origen_rectificacion(p_nomina_id uuid)
returns uuid
language sql
stable
security invoker
set search_path = public
as $$
  select case
    when np.naturaleza = 'rectificacion' then np.nomina_origen_id
    else np.id
  end
  from public.nomina_periodo np
  where np.id = p_nomina_id;
$$;

revoke all on function public.nomina_resolver_origen_rectificacion(uuid) from public, anon;
grant execute on function public.nomina_resolver_origen_rectificacion(uuid) to authenticated, service_role;

create or replace function public.nomina_dotacion_ids_origen(p_nomina_origen_id uuid)
returns integer[]
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(array_agg(distinct pid order by pid), '{}'::integer[])
  from (
    select unnest(s.trabajador_ids) as pid
    from public.segmento_nomina s
    where s.id_nomina_periodo = p_nomina_origen_id
  ) q;
$$;

revoke all on function public.nomina_dotacion_ids_origen(uuid) from public, anon;
grant execute on function public.nomina_dotacion_ids_origen(uuid) to authenticated, service_role;

create or replace function public.previsualizar_rectificacion_nomina(
  p_nomina_origen_id uuid,
  p_trabajador_ids integer[] default null,
  p_motivo text default null
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_id_empresa integer;
  v_origen_id uuid;
  v_origen public.nomina_periodo%rowtype;
  v_dotacion integer[];
  v_seleccion integer[];
  v_fingerprint text;
  v_conflictos jsonb := '[]'::jsonb;
  v_trabajadores jsonb := '[]'::jsonb;
  v_invalidos integer[];
  v_motivo_ok boolean;
begin
  if not public.erp_nomina_feature_habilitado('nomina.rectificacion.enabled') then
    raise exception 'previsualizar_rectificacion_nomina: la rectificación no está habilitada para esta empresa'
      using errcode = '42501';
  end if;

  if not public.erp_nomina_permiso_efectivo('nomina.rectificacion') then
    raise exception 'previsualizar_rectificacion_nomina: no tienes permiso para crear rectificaciones'
      using errcode = '42501';
  end if;

  v_id_empresa := public.current_user_empresa_id();
  v_origen_id := public.nomina_resolver_origen_rectificacion(p_nomina_origen_id);

  if v_origen_id is null then
    raise exception 'previsualizar_rectificacion_nomina: nómina origen no encontrada'
      using errcode = 'P0002';
  end if;

  select * into v_origen
  from public.nomina_periodo np
  where np.id = v_origen_id and np.id_empresa = v_id_empresa;

  if not found then
    raise exception 'previsualizar_rectificacion_nomina: nómina origen no pertenece a la empresa'
      using errcode = '42501';
  end if;

  if v_origen.estado <> 'cerrada' then
    raise exception 'previsualizar_rectificacion_nomina: la nómina origen debe estar cerrada (actual: %)', v_origen.estado
      using errcode = '23514';
  end if;

  v_dotacion := public.nomina_dotacion_ids_origen(v_origen_id);

  if coalesce(array_length(v_dotacion, 1), 0) = 0 then
    raise exception 'previsualizar_rectificacion_nomina: la nómina origen no tiene dotación'
      using errcode = '23514';
  end if;

  if p_trabajador_ids is null or coalesce(array_length(p_trabajador_ids, 1), 0) = 0 then
    v_seleccion := v_dotacion;
  else
    select coalesce(array_agg(x order by x), '{}') into v_seleccion from unnest(p_trabajador_ids) as x;

    select coalesce(array_agg(x), '{}') into v_invalidos
    from unnest(v_seleccion) as x where not (x = any (v_dotacion));

    if coalesce(array_length(v_invalidos, 1), 0) > 0 then
      v_conflictos := v_conflictos || jsonb_build_array(jsonb_build_object(
        'motivo', 'trabajador_fuera_origen',
        'motivoHumano', 'Hay trabajadores que no pertenecen a la nómina original',
        'detalle', jsonb_build_object('idsInvalidos', to_jsonb(v_invalidos))
      ));
    end if;

    v_seleccion := array(select x from unnest(v_seleccion) as x where x = any (v_dotacion) order by x);
  end if;

  v_motivo_ok := p_motivo is not null and btrim(p_motivo) <> '';

  if not v_motivo_ok then
    v_conflictos := v_conflictos || jsonb_build_array(jsonb_build_object(
      'motivo', 'motivo_requerido',
      'motivoHumano', 'Debes indicar el motivo de la rectificación'
    ));
  end if;

  if coalesce(array_length(v_seleccion, 1), 0) = 0 then
    v_conflictos := v_conflictos || jsonb_build_array(jsonb_build_object(
      'motivo', 'sin_trabajadores',
      'motivoHumano', 'Selecciona al menos un trabajador de la nómina original'
    ));
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'idPersona', p.id_persona,
    'rut', p.rut,
    'nombre', trim(coalesce(p.nombres, '') || ' ' || coalesce(p.apellido_paterno, '') || ' ' || coalesce(p.apellido_materno, '')),
    'cargo', coalesce(ct.cargo, '')
  ) order by p.id_persona), '[]'::jsonb)
  into v_trabajadores
  from unnest(v_dotacion) as pid
  join public.persona p on p.id_persona = pid
  left join lateral (
    select c.cargo from public.contrato c
    where c.id_persona = p.id_persona and c.id_empresa = v_id_empresa
    order by c.fecha_inicio desc limit 1
  ) ct on true;

  v_fingerprint := md5(
    v_origen_id::text || '|' || coalesce(array_to_string(v_seleccion, ','), '') || '|' || coalesce(btrim(p_motivo), '')
  );

  return jsonb_build_object(
    'nominaOrigenId', v_origen_id,
    'nominaReferenciaId', p_nomina_origen_id,
    'periodo', v_origen.periodo,
    'tipo', v_origen.tipo,
    'empresaNombre', v_origen.empresa_nombre,
    'versionCalculoOrigen', v_origen.version_calculo,
    'fingerprint', v_fingerprint,
    'motivo', nullif(btrim(p_motivo), ''),
    'trabajadoresDisponibles', v_trabajadores,
    'trabajadorIdsSeleccionados', to_jsonb(v_seleccion),
    'conflictos', v_conflictos,
    'totales', jsonb_build_object(
      'disponibles', coalesce(array_length(v_dotacion, 1), 0),
      'seleccionados', coalesce(array_length(v_seleccion, 1), 0),
      'conflictos', jsonb_array_length(v_conflictos)
    ),
    'puedeCrear', jsonb_array_length(v_conflictos) = 0
      and coalesce(array_length(v_seleccion, 1), 0) > 0 and v_motivo_ok
  );
end;
$$;

revoke all on function public.previsualizar_rectificacion_nomina(uuid, integer[], text) from public, anon;
grant execute on function public.previsualizar_rectificacion_nomina(uuid, integer[], text) to authenticated, service_role;

create or replace function public.confirmar_rectificacion_nomina(
  p_nomina_origen_id uuid,
  p_fingerprint text,
  p_motivo text,
  p_trabajador_ids integer[] default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_preview jsonb;
  v_origen_id uuid;
  v_origen public.nomina_periodo%rowtype;
  v_nueva public.nomina_periodo%rowtype;
  v_ids integer[];
  v_estado_destino text := 'dotacion_generada';
  v_siguiente_paso text := 'parameters';
  v_codigo_ciclo text;
begin
  if not public.erp_nomina_feature_habilitado('nomina.rectificacion.enabled') then
    raise exception 'confirmar_rectificacion_nomina: la rectificación no está habilitada' using errcode = '42501';
  end if;

  if not public.erp_nomina_permiso_efectivo('nomina.rectificacion') then
    raise exception 'confirmar_rectificacion_nomina: no tienes permiso' using errcode = '42501';
  end if;

  if p_motivo is null or btrim(p_motivo) = '' then
    raise exception 'confirmar_rectificacion_nomina: el motivo es obligatorio' using errcode = '23514';
  end if;

  v_preview := public.previsualizar_rectificacion_nomina(p_nomina_origen_id, p_trabajador_ids, p_motivo);

  if (v_preview ->> 'fingerprint') is distinct from p_fingerprint then
    raise exception 'confirmar_rectificacion_nomina: la vista previa cambió, recarga e intenta otra vez' using errcode = '40001';
  end if;

  if coalesce((v_preview ->> 'puedeCrear')::boolean, false) is not true then
    raise exception 'confirmar_rectificacion_nomina: hay conflictos que impiden crear la rectificación' using errcode = '23514';
  end if;

  v_origen_id := (v_preview ->> 'nominaOrigenId')::uuid;

  select * into v_origen from public.nomina_periodo where id = v_origen_id for update;

  select coalesce(array_agg((elem)::integer order by (elem)::integer), '{}')
  into v_ids from jsonb_array_elements_text(v_preview -> 'trabajadorIdsSeleccionados') as elem;

  v_codigo_ciclo := v_origen.codigo_ciclo || '-RECT-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);

  insert into public.nomina_periodo (
    id_empresa, empresa_nombre, periodo, tipo, naturaleza, nomina_origen_id,
    codigo_ciclo, fecha_inicio, fecha_fin, plantilla_ciclo_id
  )
  values (
    v_origen.id_empresa, v_origen.empresa_nombre, v_origen.periodo, v_origen.tipo,
    'rectificacion', v_origen_id, v_codigo_ciclo, v_origen.fecha_inicio, v_origen.fecha_fin,
    v_origen.plantilla_ciclo_id
  )
  returning * into v_nueva;

  insert into public.segmento_nomina (
    id_nomina_periodo, id_empresa, nombre, tipo, estado, trabajador_ids, total_trabajadores, ordinal
  )
  values (
    v_nueva.id, v_origen.id_empresa, 'Rectificación — subset', 'planta', 'lista',
    v_ids, array_length(v_ids, 1), 1
  );

  update public.nomina_periodo
  set total_trabajadores = array_length(v_ids, 1), total_segmentos = 1, updated_at = now()
  where id = v_nueva.id;

  perform public.transicionar_nomina_periodo(
    v_nueva.id, 'borrador', v_estado_destino, btrim(p_motivo), null,
    array_length(v_ids, 1), null, null, null, v_nueva.version_estado
  );

  insert into public.evento_auditoria_nomina (
    id_nomina_periodo, id_empresa, accion, estado_anterior, estado_nuevo, motivo, metadata
  )
  values (
    v_nueva.id, v_origen.id_empresa, 'creada', null, v_estado_destino, btrim(p_motivo),
    jsonb_build_object(
      'naturaleza', 'rectificacion',
      'nominaOrigenId', v_origen_id,
      'versionCalculoOrigen', v_origen.version_calculo,
      'trabajadores', to_jsonb(v_ids)
    )
  );

  select * into v_nueva from public.nomina_periodo where id = v_nueva.id;

  return jsonb_build_object(
    'idNominaPeriodo', v_nueva.id,
    'nominaOrigenId', v_origen_id,
    'estado', v_nueva.estado,
    'versionEstado', v_nueva.version_estado,
    'codigoCiclo', v_nueva.codigo_ciclo,
    'fechaInicio', v_nueva.fecha_inicio,
    'fechaFin', v_nueva.fecha_fin,
    'tipo', v_nueva.tipo,
    'naturaleza', v_nueva.naturaleza,
    'totalTrabajadores', v_nueva.total_trabajadores,
    'siguientePaso', v_siguiente_paso,
    'motivo', btrim(p_motivo)
  );
end;
$$;

revoke all on function public.confirmar_rectificacion_nomina(uuid, text, text, integer[]) from public, anon;
grant execute on function public.confirmar_rectificacion_nomina(uuid, text, text, integer[]) to authenticated, service_role;

create or replace function public.generar_liquidaciones_nomina(p_id_nomina_periodo uuid)
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
  v_permiso text;
begin
  select * into v_nomina from public.nomina_periodo np where np.id = p_id_nomina_periodo for update;
  if not found then raise exception 'Nómina no encontrada'; end if;

  v_permiso := case when v_nomina.naturaleza = 'rectificacion' then 'nomina.rectificacion' else 'nomina.liquidaciones' end;
  if not public.erp_nomina_permiso_efectivo(v_permiso) then
    raise exception 'No tienes permiso para generar liquidaciones';
  end if;

  if v_nomina.estado not in ('aprobada', 'liquidada') then
    raise exception 'La nómina debe estar aprobada para generar liquidaciones (actual: %)', v_nomina.estado;
  end if;

  if not coalesce(v_nomina.calculo_vigente, false) or v_nomina.id_calculo_periodo_vigente is null then
    raise exception 'No hay cálculo vigente para generar liquidaciones';
  end if;

  select * into v_calculo from public.nomina_calculo_periodo c where c.id_calculo_periodo = v_nomina.id_calculo_periodo_vigente;
  if not found then raise exception 'Snapshot de cálculo no encontrado'; end if;

  select coalesce(max(l.version), 0) + 1 into v_version
  from public.nomina_liquidacion_periodo l where l.id_nomina_periodo = p_id_nomina_periodo;

  insert into public.nomina_liquidacion_periodo (
    periodo, id_calculo_periodo, id_nomina_periodo, id_empresa, tipo_liquidacion, estado, version,
    total_trabajadores, total_haberes, total_descuentos, total_liquido, metadata
  )
  values (
    v_nomina.periodo, v_calculo.id_calculo_periodo, p_id_nomina_periodo, v_nomina.id_empresa,
    case
      when v_nomina.naturaleza = 'rectificacion' then 'rectificacion'
      when v_nomina.tipo = 'mensual' then 'mensual'
      when v_nomina.tipo = 'quincenal' then 'quincenal'
      when v_nomina.tipo = 'semanal' then 'semanal'
      else 'extraordinaria'
    end,
    'generada', v_version,
    coalesce(v_calculo.total_trabajadores, 0), coalesce(v_calculo.total_haberes, 0),
    coalesce(v_calculo.total_descuentos, 0), coalesce(v_calculo.total_liquido, 0),
    jsonb_build_object(
      'version_calculo', v_nomina.version_calculo,
      'generada_desde', case when v_nomina.naturaleza = 'rectificacion' then 'generador_nomina_f17_rectificacion' else 'generador_nomina_f15' end,
      'nominaOrigenId', v_nomina.nomina_origen_id
    )
  )
  returning * into v_liq;

  for v_trab in
    select t.* from public.nomina_calculo_trabajador t
    where t.id_calculo_periodo = v_calculo.id_calculo_periodo
      and (
        v_nomina.naturaleza <> 'rectificacion'
        or coalesce(t.liquido_preliminar, 0) <> 0
        or coalesce(t.total_haberes_imponibles, 0) + coalesce(t.total_haberes_no_imponibles, 0) <> 0
        or coalesce(t.total_descuentos_legales, 0) + coalesce(t.total_descuentos_voluntarios, 0) <> 0
      )
  loop
    insert into public.nomina_liquidacion_trabajador (
      id_liquidacion_periodo, id_calculo_periodo, id_persona, rut, nombre_trabajador,
      base_imponible, base_tributable, total_haberes, total_descuentos, liquido_pagar, estado, metadata
    )
    values (
      v_liq.id_liquidacion_periodo, v_calculo.id_calculo_periodo, v_trab.id_persona, v_trab.rut,
      v_trab.nombre_completo_snapshot, coalesce(v_trab.base_imponible_previsional, 0),
      coalesce(v_trab.base_tributable, 0),
      coalesce(v_trab.total_haberes_imponibles, 0) + coalesce(v_trab.total_haberes_no_imponibles, 0),
      coalesce(v_trab.total_descuentos_legales, 0) + coalesce(v_trab.total_descuentos_voluntarios, 0),
      coalesce(v_trab.liquido_preliminar, 0), 'generada',
      case when v_nomina.naturaleza = 'rectificacion' then
        jsonb_build_object('diferencial', true, 'nominaOrigenId', v_nomina.nomina_origen_id)
      else '{}'::jsonb end
    );
  end loop;

  if v_nomina.estado = 'aprobada' then
    perform public.transicionar_nomina_periodo(
      p_id_nomina_periodo, 'aprobada', 'liquidada',
      case when v_nomina.naturaleza = 'rectificacion' then 'Liquidaciones diferenciales F17 generadas.' else 'Liquidaciones F15 generadas.' end,
      null, null, null, null, null, null
    );
  end if;

  return v_liq;
end;
$$;
