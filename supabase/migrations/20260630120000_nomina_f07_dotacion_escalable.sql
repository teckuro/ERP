-- NOM-ADMIN-OPS-F07 — Dotación escalable: conteos agregados y picker paginado.

create or replace function public.resumen_dotacion_nomina(p_nomina_id uuid)
returns table (
  total bigint,
  listos bigint,
  con_advertencias bigint,
  con_criticos bigint,
  bloqueados bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  with dotacion as (
    select distinct on (persona_id)
      persona_id,
      segmento_id
    from (
      select unnest(s.trabajador_ids) as persona_id, s.id as segmento_id, s.ordinal
      from public.segmento_nomina s
      where s.id_nomina_periodo = p_nomina_id
    ) base
    order by persona_id, ordinal
  ),
  resumen as (
    select
      d.persona_id,
      count(distinct i.id) filter (where i.severidad = 'critica' and i.resuelta_at is null) as criticas,
      count(distinct i.id) filter (where i.severidad = 'advertencia' and i.resuelta_at is null) as advertencias,
      bool_or(i.bloqueante and i.resuelta_at is null) as bloqueante
    from dotacion d
    left join public.incidencia_nomina i
      on i.id_nomina_periodo = p_nomina_id and i.id_persona = d.persona_id
    group by d.persona_id
  ),
  clasificado as (
    select
      case
        when bloqueante then 'bloqueado'
        when criticas > 0 then 'critico'
        when advertencias > 0 then 'advertencia'
        else 'listo'
      end as estado_calculado
    from resumen
  )
  select
    count(*)::bigint as total,
    count(*) filter (where estado_calculado = 'listo')::bigint as listos,
    count(*) filter (where estado_calculado = 'advertencia')::bigint as con_advertencias,
    count(*) filter (where estado_calculado = 'critico')::bigint as con_criticos,
    count(*) filter (where estado_calculado = 'bloqueado')::bigint as bloqueados
  from clasificado;
$$;

comment on function public.resumen_dotacion_nomina(uuid) is
  'F07: conteos agregados de dotación por estado sin paginar filas.';

revoke all on function public.resumen_dotacion_nomina(uuid) from public;
grant execute on function public.resumen_dotacion_nomina(uuid) to authenticated, service_role;

create or replace function public.resumen_trabajadores_elegibles_nomina(p_nomina_id uuid)
returns table (
  total_activos bigint,
  elegibles bigint,
  ya_en_nomina bigint
)
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_nomina public.nomina_periodo;
  v_id_empresa integer;
begin
  select * into v_nomina
  from public.nomina_periodo
  where id = p_nomina_id;

  if not found then
    raise exception 'resumen_trabajadores_elegibles_nomina: nómina no encontrada'
      using errcode = 'P0002';
  end if;

  v_id_empresa := v_nomina.id_empresa;

  return query
  with dotacion as (
    select distinct unnest(s.trabajador_ids) as persona_id
    from public.segmento_nomina s
    where s.id_nomina_periodo = p_nomina_id
  ),
  universo as (
    select
      p.id_persona,
      p.estado = 'ACTIVO' and p.apto_para_remuneraciones as es_elegible,
      exists (select 1 from dotacion d where d.persona_id = p.id_persona) as en_nomina
    from public.persona p
    where exists (
      select 1
      from public.contrato c
      where c.id_persona = p.id_persona
        and c.id_empresa = v_id_empresa
        and c.fecha_inicio <= v_nomina.fecha_fin
        and (c.fecha_termino is null or c.fecha_termino >= v_nomina.fecha_inicio)
        and c.estado = 'ACTIVO'
    )
  )
  select
    count(*)::bigint,
    count(*) filter (where es_elegible and not en_nomina)::bigint,
    count(*) filter (where en_nomina)::bigint
  from universo;
end;
$$;

comment on function public.resumen_trabajadores_elegibles_nomina(uuid) is
  'F07: conteos del picker de inclusión manual sin cargar filas.';

revoke all on function public.resumen_trabajadores_elegibles_nomina(uuid) from public;
grant execute on function public.resumen_trabajadores_elegibles_nomina(uuid) to authenticated, service_role;

create or replace function public.listar_trabajadores_elegibles_nomina(
  p_nomina_id uuid,
  p_page integer default 1,
  p_page_size integer default 50,
  p_busqueda text default null,
  p_solo_disponibles boolean default false
)
returns table (
  trabajador_id integer,
  nombre text,
  rut text,
  cargo text,
  departamento text,
  ya_en_nomina boolean,
  total_count bigint
)
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_nomina public.nomina_periodo;
  v_id_empresa integer;
begin
  select * into v_nomina
  from public.nomina_periodo
  where id = p_nomina_id;

  if not found then
    raise exception 'listar_trabajadores_elegibles_nomina: nómina no encontrada'
      using errcode = 'P0002';
  end if;

  v_id_empresa := v_nomina.id_empresa;

  return query
  with dotacion as (
    select distinct unnest(s.trabajador_ids) as persona_id
    from public.segmento_nomina s
    where s.id_nomina_periodo = p_nomina_id
  ),
  universo as (
    select
      p.id_persona,
      trim(both ' ' from concat_ws(' ', p.nombres, p.apellido_paterno, p.apellido_materno)) as nombre,
      concat(p.rut, '-', p.dv) as rut,
      coalesce(ct.cargo, '—') as cargo,
      coalesce(de.nombre, '—') as departamento,
      (p.estado = 'ACTIVO' and p.apto_para_remuneraciones) as es_elegible,
      exists (select 1 from dotacion d where d.persona_id = p.id_persona) as ya_en_nomina
    from public.persona p
    inner join lateral (
      select c.*
      from public.contrato c
      where c.id_persona = p.id_persona
        and c.id_empresa = v_id_empresa
        and c.fecha_inicio <= v_nomina.fecha_fin
        and (c.fecha_termino is null or c.fecha_termino >= v_nomina.fecha_inicio)
        and c.estado = 'ACTIVO'
      order by c.fecha_inicio desc, c.id_contrato desc
      limit 1
    ) ct on true
    left join public.departamento_empresa de
      on de.id_departamento_empresa = ct.id_departamento_empresa
    where p.estado = 'ACTIVO'
      and p.apto_para_remuneraciones
  ),
  filtrado as (
    select *
    from universo
    where
      (not p_solo_disponibles or not ya_en_nomina)
      and (
        p_busqueda is null
        or nombre ilike '%' || p_busqueda || '%'
        or rut ilike '%' || p_busqueda || '%'
        or cargo ilike '%' || p_busqueda || '%'
        or departamento ilike '%' || p_busqueda || '%'
      )
  )
  select
    f.id_persona,
    f.nombre,
    f.rut,
    f.cargo,
    f.departamento,
    f.ya_en_nomina,
    count(*) over()
  from filtrado f
  order by f.ya_en_nomina, f.nombre, f.id_persona
  offset greatest(p_page - 1, 0) * greatest(p_page_size, 1)
  limit least(greatest(p_page_size, 1), 200);
end;
$$;

comment on function public.listar_trabajadores_elegibles_nomina(uuid, integer, integer, text, boolean) is
  'F07: picker paginado de trabajadores elegibles para inclusión manual en dotación.';

revoke all on function public.listar_trabajadores_elegibles_nomina(uuid, integer, integer, text, boolean) from public;
grant execute on function public.listar_trabajadores_elegibles_nomina(uuid, integer, integer, text, boolean) to authenticated, service_role;
