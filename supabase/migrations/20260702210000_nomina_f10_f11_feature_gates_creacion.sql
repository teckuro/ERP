-- =============================================================================
-- 20260702210000_nomina_f10_f11_feature_gates_creacion.sql
-- F10 / F11 núcleo — feature gates Anexo B + creación quincenal/semanal/extraordinaria.
-- =============================================================================

set search_path = public;

-- ---------------------------------------------------------------------------
-- Feature gates por tenant (empresa.feature_gates)
-- ---------------------------------------------------------------------------

alter table public.empresa
  add column if not exists feature_gates jsonb not null default '{}'::jsonb;

comment on column public.empresa.feature_gates is
  'Flags por tenant (Anexo B). Claves: nomina.anticipos.enabled, nomina.extraordinaria.enabled.';

create or replace function public.erp_nomina_feature_habilitado(p_gate text)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(
    (
      select (e.feature_gates ->> p_gate)::boolean
      from public.empresa e
      where e.id_empresa = public.current_user_empresa_id()
    ),
    false
  );
$$;

comment on function public.erp_nomina_feature_habilitado(text) is
  'Resuelve un feature gate de nómina para la empresa del JWT. F10/F11 Anexo B.';

revoke all on function public.erp_nomina_feature_habilitado(text) from public, anon;
grant execute on function public.erp_nomina_feature_habilitado(text) to authenticated, service_role;

create or replace function public.obtener_feature_gates_nomina()
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select jsonb_build_object(
    'anticipos', public.erp_nomina_feature_habilitado('nomina.anticipos.enabled'),
    'extraordinaria', public.erp_nomina_feature_habilitado('nomina.extraordinaria.enabled')
  );
$$;

comment on function public.obtener_feature_gates_nomina() is
  'Expone flags F10/F11 al Administrador (sin error si están apagados).';

revoke all on function public.obtener_feature_gates_nomina() from public, anon;
grant execute on function public.obtener_feature_gates_nomina() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Plantillas demo QUIN / SEM (solo si faltan)
-- ---------------------------------------------------------------------------

insert into public.nomina_plantilla_ciclo (
  id_empresa,
  codigo,
  nombre,
  tipo,
  naturaleza,
  configuracion,
  regla_fecha_pago,
  politica_fin_semana,
  regla_anticipo,
  descripcion,
  activo,
  version
)
select
  e.id_empresa,
  'QUIN',
  'Anticipo quincenal',
  'quincenal',
  'anticipo',
  '{}'::jsonb,
  '{"tipo": "dia_habil_n", "n_habil": 3}'::jsonb,
  'adelantar',
  '{"modo": "porcentaje", "valor": 50}'::jsonb,
  'Quincenas 1–15 y 16–fin de mes. Anticipo interno consolidable en mensual.',
  true,
  1
from public.empresa e
where not exists (
  select 1
  from public.nomina_plantilla_ciclo p
  where p.id_empresa = e.id_empresa
    and p.codigo = 'QUIN'
);

insert into public.nomina_plantilla_ciclo (
  id_empresa,
  codigo,
  nombre,
  tipo,
  naturaleza,
  configuracion,
  regla_fecha_pago,
  politica_fin_semana,
  regla_anticipo,
  descripcion,
  activo,
  version
)
select
  e.id_empresa,
  'SEM',
  'Anticipo semanal',
  'semanal',
  'anticipo',
  '{}'::jsonb,
  '{"tipo": "dia_habil_n", "n_habil": 5}'::jsonb,
  'adelantar',
  '{"modo": "porcentaje", "valor": 25}'::jsonb,
  'Semanas lun–dom con pago viernes. Anticipo interno consolidable en mensual.',
  true,
  1
from public.empresa e
where not exists (
  select 1
  from public.nomina_plantilla_ciclo p
  where p.id_empresa = e.id_empresa
    and p.codigo = 'SEM'
);

-- ---------------------------------------------------------------------------
-- F04 ampliado: preview creación multi-tipo
-- ---------------------------------------------------------------------------

drop function if exists public.previsualizar_creacion_nomina(text, text);

create or replace function public.previsualizar_creacion_nomina(
  p_periodo text,
  p_tipo text default 'mensual',
  p_codigo_ciclo text default null
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_id_empresa integer;
  v_empresa_nombre text;
  v_plantilla public.nomina_plantilla_ciclo%rowtype;
  v_fecha_inicio date;
  v_fecha_fin date;
  v_codigo_ciclo text;
  v_naturaleza text;
  v_total_incluidos integer := 0;
  v_total_excluidos integer := 0;
  v_total_conflictos integer := 0;
  v_conflictos jsonb;
  v_ids_incluidos integer[];
  v_fingerprint text;
  v_puede_crear boolean;
  v_anio integer;
  v_corte record;
  v_plantilla_id uuid;
begin
  if p_periodo is null or p_periodo !~ '^[0-9]{4}-(0[1-9]|1[0-2])$' then
    raise exception 'previsualizar_creacion_nomina: período inválido (esperado YYYY-MM): %', p_periodo
      using errcode = '22023';
  end if;

  if p_tipo is null or p_tipo not in ('mensual', 'quincenal', 'semanal', 'extraordinaria') then
    raise exception 'previsualizar_creacion_nomina: tipo no soportado: %', p_tipo
      using errcode = '22023';
  end if;

  if p_tipo in ('quincenal', 'semanal')
     and not public.erp_nomina_feature_habilitado('nomina.anticipos.enabled') then
    raise exception 'previsualizar_creacion_nomina: anticipos no habilitados para esta empresa'
      using errcode = '42501';
  end if;

  if p_tipo = 'extraordinaria'
     and not public.erp_nomina_feature_habilitado('nomina.extraordinaria.enabled') then
    raise exception 'previsualizar_creacion_nomina: nóminas extraordinarias no habilitadas para esta empresa'
      using errcode = '42501';
  end if;

  v_id_empresa := public.current_user_empresa_id();
  if v_id_empresa is null then
    raise exception 'previsualizar_creacion_nomina: sin empresa activa en la sesión'
      using errcode = '42501';
  end if;

  select e.razon_social
  into v_empresa_nombre
  from public.empresa e
  where e.id_empresa = v_id_empresa;

  v_anio := split_part(p_periodo, '-', 1)::integer;

  if p_tipo = 'mensual' then
    v_naturaleza := 'liquidacion_legal';

    select *
    into v_plantilla
    from public.nomina_plantilla_ciclo
    where id_empresa = v_id_empresa
      and codigo = 'MES'
      and activo
    order by version desc
    limit 1;

    if not found then
      raise exception 'previsualizar_creacion_nomina: la empresa % no tiene plantilla mensual MES activa', v_id_empresa
        using errcode = 'P0002';
    end if;

    v_fecha_inicio := to_date(p_periodo || '-01', 'YYYY-MM-DD');
    v_fecha_fin := (v_fecha_inicio + interval '1 month - 1 day')::date;
    v_codigo_ciclo := p_periodo || '-MES';
    v_plantilla_id := v_plantilla.id;

  elsif p_tipo in ('quincenal', 'semanal') then
    v_naturaleza := 'anticipo';

    if p_codigo_ciclo is null or btrim(p_codigo_ciclo) = '' then
      raise exception 'previsualizar_creacion_nomina: indica el corte (codigo_ciclo) para anticipos %', p_tipo
        using errcode = '22023';
    end if;

    select *
    into v_plantilla
    from public.nomina_plantilla_ciclo
    where id_empresa = v_id_empresa
      and tipo = p_tipo
      and naturaleza = 'anticipo'
      and activo
    order by version desc
    limit 1;

    if not found then
      raise exception 'previsualizar_creacion_nomina: no hay plantilla activa de anticipo %', p_tipo
        using errcode = 'P0002';
    end if;

    select
      c.codigo_ciclo,
      c.fecha_inicio,
      c.fecha_fin
    into v_corte
    from public.previsualizar_cortes_plantilla(v_plantilla.id, v_anio, 52) c
    where c.codigo_ciclo = p_codigo_ciclo
      and to_char(c.fecha_inicio, 'YYYY-MM') = p_periodo
    limit 1;

    if not found then
      raise exception 'previsualizar_creacion_nomina: corte % no corresponde al período %', p_codigo_ciclo, p_periodo
        using errcode = '22023';
    end if;

    v_codigo_ciclo := v_corte.codigo_ciclo;
    v_fecha_inicio := v_corte.fecha_inicio;
    v_fecha_fin := v_corte.fecha_fin;
    v_plantilla_id := v_plantilla.id;

  else
    v_naturaleza := 'pago_extraordinario';
    v_fecha_inicio := to_date(p_periodo || '-01', 'YYYY-MM-DD');
    v_fecha_fin := (v_fecha_inicio + interval '1 month - 1 day')::date;
    v_codigo_ciclo := coalesce(
      nullif(btrim(p_codigo_ciclo), ''),
      p_periodo || '-EXT-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)
    );

    v_plantilla_id := null;
    select p.id
    into v_plantilla_id
    from public.nomina_plantilla_ciclo p
    where p.id_empresa = v_id_empresa
      and p.tipo = 'extraordinaria'
      and p.naturaleza = 'pago_extraordinario'
      and p.activo
    order by p.version desc
    limit 1;
  end if;

  with universo as (
    select
      p.id_persona,
      case
        when p.estado <> 'ACTIVO' then 'persona_inactiva'
        when not p.apto_para_remuneraciones then 'ficha_no_apta'
        when ct.id_contrato is null then 'sin_contrato_vigente'
        when ct.estado <> 'ACTIVO' then 'contrato_no_activo'
        else null
      end as motivo_exclusion
    from public.persona p
    left join lateral (
      select c.*
      from public.contrato c
      where c.id_persona = p.id_persona
        and c.id_empresa = v_id_empresa
        and c.fecha_inicio <= v_fecha_fin
        and (c.fecha_termino is null or c.fecha_termino >= v_fecha_inicio)
      order by c.fecha_inicio desc, c.id_contrato desc
      limit 1
    ) ct on true
    where exists (
      select 1
      from public.contrato c2
      where c2.id_persona = p.id_persona
        and c2.id_empresa = v_id_empresa
    )
  )
  select
    count(*) filter (where motivo_exclusion is null),
    count(*) filter (where motivo_exclusion is not null),
    array_remove(array_agg(id_persona order by id_persona) filter (where motivo_exclusion is null), null)
  into v_total_incluidos, v_total_excluidos, v_ids_incluidos
  from universo;

  with conflictos_cte as (
    select
      'duplicidad_nomina'::text as motivo,
      case p_tipo
        when 'mensual' then 'Ya existe una liquidación mensual para este período'
        when 'extraordinaria' then 'Ya existe una nómina extraordinaria con este ciclo'
        else 'Ya existe un anticipo con este ciclo en la empresa'
      end as motivo_humano,
      jsonb_build_object(
        'idNominaPeriodo', np.id,
        'estado', np.estado,
        'codigoCiclo', np.codigo_ciclo,
        'tipo', np.tipo
      ) as detalle
    from public.nomina_periodo np
    where np.id_empresa = v_id_empresa
      and np.estado <> 'anulada'
      and (
        (p_tipo = 'mensual' and np.periodo = p_periodo and np.naturaleza = 'liquidacion_legal')
        or (p_tipo <> 'mensual' and np.codigo_ciclo = v_codigo_ciclo)
      )
  )
  select
    coalesce(jsonb_agg(jsonb_build_object(
      'motivo', motivo,
      'motivoHumano', motivo_humano,
      'detalle', detalle
    )), '[]'::jsonb)
  into v_conflictos
  from conflictos_cte;

  select jsonb_array_length(v_conflictos) into v_total_conflictos;

  v_puede_crear := (v_total_conflictos = 0) and (v_total_incluidos > 0);

  v_fingerprint := md5(
    v_id_empresa::text
    || '|' || p_periodo
    || '|' || p_tipo
    || '|' || coalesce(v_codigo_ciclo, '')
    || '|' || coalesce(array_to_string(v_ids_incluidos, ','), '')
    || '|' || v_total_excluidos::text
    || '|' || v_total_conflictos::text
  );

  return jsonb_build_object(
    'periodo', p_periodo,
    'tipo', p_tipo,
    'naturaleza', v_naturaleza,
    'idEmpresa', v_id_empresa,
    'empresaNombre', v_empresa_nombre,
    'codigoCiclo', v_codigo_ciclo,
    'fechaInicio', v_fecha_inicio,
    'fechaFin', v_fecha_fin,
    'plantillaCicloId', v_plantilla_id,
    'incluidos', '[]'::jsonb,
    'excluidos', '[]'::jsonb,
    'conflictos', v_conflictos,
    'totales', jsonb_build_object(
      'incluidos', v_total_incluidos,
      'excluidos', v_total_excluidos,
      'conflictos', v_total_conflictos
    ),
    'puedeCrear', v_puede_crear,
    'fingerprint', v_fingerprint,
    'generadoEn', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
    'detallePaginado', true
  );
end;
$$;

comment on function public.previsualizar_creacion_nomina(text, text, text) is
  'Preview F04/F10/F11: metadatos, totales y fingerprint; multi-tipo con feature gates.';

revoke all on function public.previsualizar_creacion_nomina(text, text, text) from public;
grant execute on function public.previsualizar_creacion_nomina(text, text, text) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- F05 ampliado: confirmación multi-tipo
-- ---------------------------------------------------------------------------

drop function if exists public.confirmar_creacion_nomina(text, text, text);

create or replace function public.confirmar_creacion_nomina(
  p_periodo text,
  p_tipo text,
  p_fingerprint text,
  p_codigo_ciclo text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_id_empresa integer;
  v_preview jsonb;
  v_fingerprint_vigente text;
  v_puede_crear boolean;
  v_total_conflictos integer;
  v_total_incluidos integer;
  v_existente public.nomina_periodo%rowtype;
  v_nueva public.nomina_periodo%rowtype;
  v_estado_destino text;
  v_siguiente_paso text;
  v_codigo_ciclo text;
begin
  if p_periodo is null or p_periodo !~ '^[0-9]{4}-(0[1-9]|1[0-2])$' then
    raise exception 'confirmar_creacion_nomina: período inválido (esperado YYYY-MM): %', p_periodo
      using errcode = '22023';
  end if;

  if p_tipo is null or p_tipo not in ('mensual', 'quincenal', 'semanal', 'extraordinaria') then
    raise exception 'confirmar_creacion_nomina: tipo no soportado: %', p_tipo
      using errcode = '22023';
  end if;

  if p_fingerprint is null or btrim(p_fingerprint) = '' then
    raise exception 'confirmar_creacion_nomina: fingerprint requerido'
      using errcode = '22023';
  end if;

  v_id_empresa := public.current_user_empresa_id();
  if v_id_empresa is null then
    raise exception 'confirmar_creacion_nomina: sin empresa activa en la sesión'
      using errcode = '42501';
  end if;

  v_preview := public.previsualizar_creacion_nomina(p_periodo, p_tipo, p_codigo_ciclo);
  v_codigo_ciclo := v_preview ->> 'codigoCiclo';

  if p_tipo = 'mensual' then
    select * into v_existente
    from public.nomina_periodo
    where id_empresa = v_id_empresa
      and periodo = p_periodo
      and naturaleza = 'liquidacion_legal'
      and estado <> 'anulada'
    limit 1;
  else
    select * into v_existente
    from public.nomina_periodo
    where id_empresa = v_id_empresa
      and codigo_ciclo = v_codigo_ciclo
      and estado <> 'anulada'
    limit 1;
  end if;

  if found then
    v_estado_destino := v_existente.estado;
    v_siguiente_paso := case
      when v_existente.estado = 'borrador' then 'dotacion'
      else 'parameters'
    end;

    return jsonb_build_object(
      'idNominaPeriodo', v_existente.id,
      'estado', v_existente.estado,
      'versionEstado', v_existente.version_estado,
      'codigoCiclo', v_existente.codigo_ciclo,
      'fechaInicio', v_existente.fecha_inicio,
      'fechaFin', v_existente.fecha_fin,
      'tipo', v_existente.tipo,
      'naturaleza', v_existente.naturaleza,
      'siguientePaso', v_siguiente_paso,
      'reutilizada', true
    );
  end if;

  v_fingerprint_vigente := v_preview ->> 'fingerprint';
  v_puede_crear := (v_preview ->> 'puedeCrear')::boolean;
  v_total_conflictos := coalesce((v_preview -> 'totales' ->> 'conflictos')::integer, 0);
  v_total_incluidos := coalesce((v_preview -> 'totales' ->> 'incluidos')::integer, 0);

  if v_fingerprint_vigente is null or v_fingerprint_vigente <> p_fingerprint then
    raise exception 'confirmar_creacion_nomina: el universo cambió desde la vista previa, recarga e intenta otra vez'
      using errcode = '40001';
  end if;

  if v_total_conflictos > 0 then
    raise exception 'confirmar_creacion_nomina: hay conflictos pendientes que impiden crear la nómina'
      using errcode = '23514';
  end if;

  if not v_puede_crear then
    raise exception 'confirmar_creacion_nomina: la previsualización no permite crear la nómina'
      using errcode = '23514';
  end if;

  if p_tipo = 'mensual' then
    insert into public.nomina_periodo (
      id_empresa,
      empresa_nombre,
      periodo,
      tipo
    )
    values (
      v_id_empresa,
      v_preview ->> 'empresaNombre',
      p_periodo,
      p_tipo
    )
    returning * into v_nueva;
  else
    insert into public.nomina_periodo (
      id_empresa,
      empresa_nombre,
      periodo,
      tipo,
      naturaleza,
      codigo_ciclo,
      fecha_inicio,
      fecha_fin,
      plantilla_ciclo_id
    )
    values (
      v_id_empresa,
      v_preview ->> 'empresaNombre',
      p_periodo,
      p_tipo,
      v_preview ->> 'naturaleza',
      v_preview ->> 'codigoCiclo',
      (v_preview ->> 'fechaInicio')::date,
      (v_preview ->> 'fechaFin')::date,
      nullif(v_preview ->> 'plantillaCicloId', '')::uuid
    )
    returning * into v_nueva;
  end if;

  if v_total_incluidos > 0 then
    update public.nomina_periodo
    set total_trabajadores = v_total_incluidos,
        updated_at = now()
    where id = v_nueva.id;

    perform public.transicionar_nomina_periodo(
      p_nomina_id => v_nueva.id,
      p_estado_esperado => 'borrador',
      p_estado_destino => 'dotacion_generada',
      p_motivo => null,
      p_id_calculo_periodo => null,
      p_total_trabajadores => v_total_incluidos,
      p_total_haberes => null,
      p_total_descuentos => null,
      p_total_liquido => null,
      p_version_estado_esperada => v_nueva.version_estado
    );
    v_estado_destino := 'dotacion_generada';
    v_siguiente_paso := 'parameters';
  else
    v_estado_destino := 'borrador';
    v_siguiente_paso := 'dotacion';
  end if;

  select * into v_nueva
  from public.nomina_periodo
  where id = v_nueva.id;

  return jsonb_build_object(
    'idNominaPeriodo', v_nueva.id,
    'estado', v_nueva.estado,
    'versionEstado', v_nueva.version_estado,
    'codigoCiclo', v_nueva.codigo_ciclo,
    'fechaInicio', v_nueva.fecha_inicio,
    'fechaFin', v_nueva.fecha_fin,
    'tipo', v_nueva.tipo,
    'naturaleza', v_nueva.naturaleza,
    'totalTrabajadores', v_nueva.total_trabajadores,
    'siguientePaso', v_siguiente_paso,
    'reutilizada', false
  );
end;
$$;

comment on function public.confirmar_creacion_nomina(text, text, text, text) is
  'Crea nómina transaccional F05/F10/F11 con feature gates y ciclos explícitos.';

revoke all on function public.confirmar_creacion_nomina(text, text, text, text) from public;
grant execute on function public.confirmar_creacion_nomina(text, text, text, text) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Preview paginado F04 — multi-tipo (reutiliza fechas del preview)
-- ---------------------------------------------------------------------------

drop function if exists public.listar_preview_creacion_trabajadores(text, text, text, integer, integer, text);

create or replace function public.listar_preview_creacion_trabajadores(
  p_periodo text,
  p_tipo text default 'mensual',
  p_clasificacion text default 'incluidos',
  p_page integer default 1,
  p_page_size integer default 50,
  p_busqueda text default null,
  p_codigo_ciclo text default null
)
returns table (
  id_persona integer,
  rut text,
  nombre text,
  cargo text,
  motivo text,
  motivo_humano text,
  total_count bigint
)
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_id_empresa integer;
  v_fecha_inicio date;
  v_fecha_fin date;
  v_preview jsonb;
  v_page integer := greatest(coalesce(p_page, 1), 1);
  v_page_size integer := least(greatest(coalesce(p_page_size, 50), 1), 200);
  v_offset integer := (greatest(coalesce(p_page, 1), 1) - 1) * v_page_size;
  v_busqueda text := nullif(trim(coalesce(p_busqueda, '')), '');
  v_clasificacion text := lower(coalesce(p_clasificacion, 'incluidos'));
begin
  if p_periodo is null or p_periodo !~ '^[0-9]{4}-(0[1-9]|1[0-2])$' then
    raise exception 'listar_preview_creacion_trabajadores: período inválido (esperado YYYY-MM): %', p_periodo
      using errcode = '22023';
  end if;

  if v_clasificacion not in ('incluidos', 'excluidos') then
    raise exception 'listar_preview_creacion_trabajadores: clasificación inválida %', p_clasificacion
      using errcode = '22023';
  end if;

  v_preview := public.previsualizar_creacion_nomina(p_periodo, p_tipo, p_codigo_ciclo);
  v_fecha_inicio := (v_preview ->> 'fechaInicio')::date;
  v_fecha_fin := (v_preview ->> 'fechaFin')::date;

  v_id_empresa := public.current_user_empresa_id();
  if v_id_empresa is null then
    raise exception 'listar_preview_creacion_trabajadores: sin empresa activa en la sesión'
      using errcode = '42501';
  end if;

  return query
  with universo as (
    select
      p.id_persona,
      p.rut || '-' || p.dv as rut_completo,
      trim(both ' ' from
        p.nombres || ' ' || p.apellido_paterno
        || coalesce(' ' || p.apellido_materno, '')
      ) as nombre_completo,
      ct.cargo,
      case
        when p.estado <> 'ACTIVO' then 'persona_inactiva'
        when not p.apto_para_remuneraciones then 'ficha_no_apta'
        when ct.id_contrato is null then 'sin_contrato_vigente'
        when ct.estado <> 'ACTIVO' then 'contrato_no_activo'
        else null
      end as motivo_exclusion
    from public.persona p
    left join lateral (
      select c.*
      from public.contrato c
      where c.id_persona = p.id_persona
        and c.id_empresa = v_id_empresa
        and c.fecha_inicio <= v_fecha_fin
        and (c.fecha_termino is null or c.fecha_termino >= v_fecha_inicio)
      order by c.fecha_inicio desc, c.id_contrato desc
      limit 1
    ) ct on true
    where exists (
      select 1
      from public.contrato c2
      where c2.id_persona = p.id_persona
        and c2.id_empresa = v_id_empresa
    )
  ),
  clasificado as (
    select
      u.id_persona,
      u.rut_completo,
      u.nombre_completo,
      u.cargo,
      u.motivo_exclusion as motivo,
      case u.motivo_exclusion
        when 'persona_inactiva' then 'Persona inactiva en el período'
        when 'ficha_no_apta' then 'Ficha no apta para remuneraciones'
        when 'sin_contrato_vigente' then 'Sin contrato vigente en el período'
        when 'contrato_no_activo' then 'Contrato no activo en el período'
        else null
      end as motivo_humano
    from universo u
    where (
      (v_clasificacion = 'incluidos' and u.motivo_exclusion is null)
      or (v_clasificacion = 'excluidos' and u.motivo_exclusion is not null)
    )
    and (
      v_busqueda is null
      or u.nombre_completo ilike '%' || v_busqueda || '%'
      or u.rut_completo ilike '%' || v_busqueda || '%'
    )
  ),
  ordenado as (
    select
      c.*,
      count(*) over () as total_count_calc
    from clasificado c
    order by
      case when v_clasificacion = 'excluidos' then c.motivo end nulls last,
      c.nombre_completo,
      c.id_persona
    offset v_offset
    limit v_page_size
  )
  select
    o.id_persona,
    o.rut_completo,
    o.nombre_completo,
    o.cargo,
    o.motivo,
    o.motivo_humano,
    o.total_count_calc
  from ordenado o;
end;
$$;

comment on function public.listar_preview_creacion_trabajadores(text, text, text, integer, integer, text, text) is
  'Página de trabajadores del preview F04/F10/F11 con rango según tipo y corte.';

revoke all on function public.listar_preview_creacion_trabajadores(text, text, text, integer, integer, text, text) from public, anon;
grant execute on function public.listar_preview_creacion_trabajadores(text, text, text, integer, integer, text, text) to authenticated, service_role;
