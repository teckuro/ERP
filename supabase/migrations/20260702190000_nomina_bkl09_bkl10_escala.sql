-- =============================================================================
-- 20260702190000_nomina_bkl09_bkl10_escala.sql
-- BKL-09 — paso Cálculo con paginación servidor sobre snapshot persistido.
-- BKL-10 — preview F04 paginado + historial administrativo con nombre humano.
-- =============================================================================

set search_path = public;

-- ---------------------------------------------------------------------------
-- BKL-10: etiqueta de usuario desde auth.users (SECURITY DEFINER acotado)
-- ---------------------------------------------------------------------------

create or replace function public.erp_etiqueta_usuario(p_id uuid)
returns text
language sql
stable
security definer
set search_path = public, auth
as $$
  select case
    when p_id is null then null
    else coalesce(
      nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''),
      nullif(trim(u.raw_user_meta_data ->> 'name'), ''),
      nullif(trim(u.email), ''),
      'Usuario no informado'
    )
  end
  from auth.users u
  where u.id = p_id;
$$;

comment on function public.erp_etiqueta_usuario(uuid) is
  'Resuelve nombre legible de un usuario auth para UI administrativa (BKL-10).';

revoke all on function public.erp_etiqueta_usuario(uuid) from public, anon;
grant execute on function public.erp_etiqueta_usuario(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- BKL-10: eventos de auditoría enriquecidos con usuario_nombre
-- ---------------------------------------------------------------------------

create or replace function public.listar_eventos_auditoria_nomina(
  p_nomina_id uuid
)
returns table (
  id uuid,
  id_nomina_periodo uuid,
  accion text,
  id_usuario uuid,
  usuario_nombre text,
  motivo text,
  created_at timestamptz,
  estado_previo text,
  estado_nuevo text,
  version_estado_esperada integer,
  version_estado_resultante integer,
  payload jsonb
)
language plpgsql
stable
security invoker
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.nomina_periodo np where np.id = p_nomina_id
  ) then
    raise exception 'listar_eventos_auditoria_nomina: nómina no encontrada'
      using errcode = 'P0002';
  end if;

  return query
  select
    e.id,
    e.id_nomina_periodo,
    e.accion,
    e.id_usuario,
    public.erp_etiqueta_usuario(e.id_usuario) as usuario_nombre,
    e.motivo,
    e.created_at,
    e.estado_previo,
    e.estado_nuevo,
    e.version_estado_esperada,
    e.version_estado_resultante,
    e.payload
  from public.evento_auditoria_nomina e
  where e.id_nomina_periodo = p_nomina_id
  order by e.created_at desc;
end;
$$;

comment on function public.listar_eventos_auditoria_nomina(uuid) is
  'Historial administrativo de una nómina con nombre de usuario resuelto (BKL-10).';

revoke all on function public.listar_eventos_auditoria_nomina(uuid) from public, anon;
grant execute on function public.listar_eventos_auditoria_nomina(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- BKL-09: resumen global del cálculo vigente (cabecera snapshot)
-- ---------------------------------------------------------------------------

create or replace function public.resumen_calculo_nomina(p_nomina_id uuid)
returns table (
  id_calculo_periodo integer,
  trabajadores_calculados integer,
  total_haberes numeric,
  total_descuentos numeric,
  total_liquido numeric,
  con_advertencias integer,
  con_bloqueos integer
)
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_nomina public.nomina_periodo;
  v_cabecera public.nomina_calculo_periodo;
begin
  select * into v_nomina
  from public.nomina_periodo
  where id = p_nomina_id;

  if not found then
    raise exception 'resumen_calculo_nomina: nómina no encontrada'
      using errcode = 'P0002';
  end if;

  if not coalesce(v_nomina.calculo_vigente, false)
     or v_nomina.id_calculo_periodo_vigente is null then
    return;
  end if;

  select * into v_cabecera
  from public.nomina_calculo_periodo
  where id_calculo_periodo = v_nomina.id_calculo_periodo_vigente
    and activo = true;

  if not found then
    return;
  end if;

  return query
  select
    v_cabecera.id_calculo_periodo,
    coalesce(v_cabecera.total_trabajadores, 0)::integer,
    coalesce(v_cabecera.total_haberes, 0),
    coalesce(v_cabecera.total_descuentos, 0),
    coalesce(v_cabecera.total_liquido, 0),
    coalesce(v_cabecera.total_advertencias, 0)::integer,
    coalesce(v_cabecera.total_bloqueados, 0)::integer;
end;
$$;

comment on function public.resumen_calculo_nomina(uuid) is
  'Stats de cabecera del cálculo vigente sin cargar filas de trabajadores (BKL-09).';

revoke all on function public.resumen_calculo_nomina(uuid) from public, anon;
grant execute on function public.resumen_calculo_nomina(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- BKL-09: página de trabajadores calculados (snapshot)
-- ---------------------------------------------------------------------------

create or replace function public.listar_calculo_trabajadores_nomina(
  p_nomina_id uuid,
  p_page integer default 1,
  p_page_size integer default 25,
  p_busqueda text default null,
  p_estado text default null
)
returns table (
  id_calculo_trabajador integer,
  id_persona integer,
  rut text,
  nombre text,
  estado text,
  sueldo_base numeric,
  total_haberes numeric,
  total_descuentos numeric,
  liquido_preliminar numeric,
  base_imponible_previsional numeric,
  base_tributable numeric,
  cotizacion_sis numeric,
  cotizacion_sanna numeric,
  cotizacion_ley_16744_empleador numeric,
  cuenta_issues bigint,
  total_count bigint
)
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_nomina public.nomina_periodo;
  v_id_calculo integer;
  v_page integer := greatest(coalesce(p_page, 1), 1);
  v_page_size integer := least(greatest(coalesce(p_page_size, 25), 1), 200);
  v_offset integer := (greatest(coalesce(p_page, 1), 1) - 1) * v_page_size;
  v_busqueda text := nullif(trim(coalesce(p_busqueda, '')), '');
begin
  select * into v_nomina
  from public.nomina_periodo
  where id = p_nomina_id;

  if not found then
    raise exception 'listar_calculo_trabajadores_nomina: nómina no encontrada'
      using errcode = 'P0002';
  end if;

  if not coalesce(v_nomina.calculo_vigente, false)
     or v_nomina.id_calculo_periodo_vigente is null then
    return;
  end if;

  v_id_calculo := v_nomina.id_calculo_periodo_vigente;

  return query
  with filtrado as (
    select
      t.*,
      coalesce((
        select count(*)
        from public.nomina_calculo_issue i
        where i.id_calculo_trabajador = t.id_calculo_trabajador
      ), 0) as cuenta_issues_calc
    from public.nomina_calculo_trabajador t
    where t.id_calculo_periodo = v_id_calculo
      and (
        v_busqueda is null
        or t.nombre_completo_snapshot ilike '%' || v_busqueda || '%'
        or t.rut ilike '%' || v_busqueda || '%'
      )
      and (
        p_estado is null
        or p_estado = ''
        or (p_estado = 'ok' and t.estado not in ('con_bloqueos', 'con_advertencias'))
        or (p_estado = 'aviso' and t.estado = 'con_advertencias')
        or (p_estado = 'bloqueo' and t.estado = 'con_bloqueos')
      )
  ),
  numerado as (
    select
      f.*,
      count(*) over () as total_count_calc
    from filtrado f
    order by f.liquido_preliminar desc nulls last, f.nombre_completo_snapshot asc, f.id_persona asc
    offset v_offset
    limit v_page_size
  )
  select
    n.id_calculo_trabajador,
    n.id_persona,
    n.rut,
    n.nombre_completo_snapshot,
    n.estado,
    n.sueldo_base,
    (n.total_haberes_imponibles + n.total_haberes_no_imponibles) as total_haberes,
    (n.total_descuentos_legales + n.total_descuentos_voluntarios) as total_descuentos,
    n.liquido_preliminar,
    n.base_imponible_previsional,
    n.base_tributable,
    n.cotizacion_sis,
    n.cotizacion_sanna,
    n.cotizacion_ley_16744_empleador,
    n.cuenta_issues_calc,
    n.total_count_calc
  from numerado n;
end;
$$;

comment on function public.listar_calculo_trabajadores_nomina(uuid, integer, integer, text, text) is
  'Página de filas del paso Cálculo desde snapshot persistido (BKL-09).';

revoke all on function public.listar_calculo_trabajadores_nomina(uuid, integer, integer, text, text) from public, anon;
grant execute on function public.listar_calculo_trabajadores_nomina(uuid, integer, integer, text, text) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- BKL-10: preview F04 — listas paginadas de incluidos/excluidos
-- ---------------------------------------------------------------------------

create or replace function public.listar_preview_creacion_trabajadores(
  p_periodo text,
  p_tipo text default 'mensual',
  p_clasificacion text default 'incluidos',
  p_page integer default 1,
  p_page_size integer default 50,
  p_busqueda text default null
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

  if p_tipo is null or p_tipo <> 'mensual' then
    raise exception 'listar_preview_creacion_trabajadores: solo se admite tipo mensual'
      using errcode = '22023';
  end if;

  if v_clasificacion not in ('incluidos', 'excluidos') then
    raise exception 'listar_preview_creacion_trabajadores: clasificación inválida %', p_clasificacion
      using errcode = '22023';
  end if;

  v_id_empresa := public.current_user_empresa_id();
  if v_id_empresa is null then
    raise exception 'listar_preview_creacion_trabajadores: sin empresa activa en la sesión'
      using errcode = '42501';
  end if;

  v_fecha_inicio := to_date(p_periodo || '-01', 'YYYY-MM-DD');
  v_fecha_fin := (v_fecha_inicio + interval '1 month - 1 day')::date;

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

comment on function public.listar_preview_creacion_trabajadores(text, text, text, integer, integer, text) is
  'Página de trabajadores incluidos/excluidos del preview F04 (BKL-10).';

revoke all on function public.listar_preview_creacion_trabajadores(text, text, text, integer, integer, text) from public, anon;
grant execute on function public.listar_preview_creacion_trabajadores(text, text, text, integer, integer, text) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- BKL-10: F04 deja de serializar arrays completos (totales + fingerprint intactos)
-- ---------------------------------------------------------------------------

create or replace function public.previsualizar_creacion_nomina(
  p_periodo text,
  p_tipo text default 'mensual'
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
  v_naturaleza text := 'liquidacion_legal';
  v_total_incluidos integer := 0;
  v_total_excluidos integer := 0;
  v_total_conflictos integer := 0;
  v_conflictos jsonb;
  v_ids_incluidos integer[];
  v_fingerprint text;
  v_puede_crear boolean;
begin
  if p_periodo is null or p_periodo !~ '^[0-9]{4}-(0[1-9]|1[0-2])$' then
    raise exception 'previsualizar_creacion_nomina: período inválido (esperado YYYY-MM): %', p_periodo
      using errcode = '22023';
  end if;

  if p_tipo is null or p_tipo <> 'mensual' then
    raise exception 'previsualizar_creacion_nomina: solo se admite tipo mensual en F04 (recibido %)', p_tipo
      using errcode = '22023';
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
      'Ya existe una nómina mensual para este período' as motivo_humano,
      jsonb_build_object(
        'idNominaPeriodo', np.id,
        'estado', np.estado,
        'codigoCiclo', np.codigo_ciclo
      ) as detalle
    from public.nomina_periodo np
    where np.id_empresa = v_id_empresa
      and np.periodo = p_periodo
      and np.naturaleza = v_naturaleza
      and np.estado <> 'anulada'
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
    'plantillaCicloId', v_plantilla.id,
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

comment on function public.previsualizar_creacion_nomina(text, text) is
  'Preview F04: metadatos, totales y fingerprint sin arrays masivos (BKL-10).';

revoke all on function public.previsualizar_creacion_nomina(text, text) from public;
grant execute on function public.previsualizar_creacion_nomina(text, text) to authenticated, service_role;
