-- A1 fix: cast varchar → text en listar_preview_creacion_trabajadores.
-- contrato.cargo es varchar(100) y la función declara `cargo text`; Postgres
-- rechaza la fila con «structure of query does not match function result type»
-- (columna 4) y el modal «Nueva nómina» muestra el conteo con la lista vacía.
-- Mismo patrón que 20260630131000_nomina_f07_fix_listar_elegibles_text_cast.sql.
-- Se castean todas las columnas de texto devueltas, no solo cargo.

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
      ct.cargo::text as cargo,
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
    o.rut_completo::text,
    o.nombre_completo::text,
    o.cargo::text,
    o.motivo::text,
    o.motivo_humano::text,
    o.total_count_calc
  from ordenado o;
end;
$$;

comment on function public.listar_preview_creacion_trabajadores(text, text, text, integer, integer, text, text) is
  'Página de trabajadores del preview F04/F10/F11 con rango según tipo y corte.';

revoke all on function public.listar_preview_creacion_trabajadores(text, text, text, integer, integer, text, text) from public, anon;
grant execute on function public.listar_preview_creacion_trabajadores(text, text, text, integer, integer, text, text) to authenticated, service_role;
