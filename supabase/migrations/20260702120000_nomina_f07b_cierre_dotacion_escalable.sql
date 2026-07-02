-- NOM-ADMIN-OPS-F07b — Cierre dotación escalable:
--   1. Picker: filtro "Ya en nómina" resuelto en servidor (p_solo_en_nomina).
--   2. Acción masiva sobre universo filtrado: RPC de ids sin paginar filas completas.

-- ---------------------------------------------------------------------------
-- 1. listar_trabajadores_elegibles_nomina + p_solo_en_nomina
--    (drop: agregar un parámetro con default crearía una sobrecarga)
-- ---------------------------------------------------------------------------

drop function if exists public.listar_trabajadores_elegibles_nomina(uuid, integer, integer, text, boolean);

create function public.listar_trabajadores_elegibles_nomina(
  p_nomina_id uuid,
  p_page integer default 1,
  p_page_size integer default 50,
  p_busqueda text default null,
  p_solo_disponibles boolean default false,
  p_solo_en_nomina boolean default false
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
      coalesce(ct.cargo, '—')::text as cargo,
      coalesce(de.nombre, '—')::text as departamento,
      (p.estado = 'ACTIVO' and p.apto_para_remuneraciones) as es_elegible,
      exists (select 1 from dotacion d where d.persona_id = p.id_persona) as en_nomina
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
    from universo u
    where
      (not p_solo_disponibles or not u.en_nomina)
      and (not p_solo_en_nomina or u.en_nomina)
      and (
        p_busqueda is null
        or u.nombre ilike '%' || p_busqueda || '%'
        or u.rut ilike '%' || p_busqueda || '%'
        or u.cargo ilike '%' || p_busqueda || '%'
        or u.departamento ilike '%' || p_busqueda || '%'
      )
  )
  select
    f.id_persona,
    f.nombre,
    f.rut,
    f.cargo,
    f.departamento,
    f.en_nomina,
    count(*) over()
  from filtrado f
  order by f.en_nomina, f.nombre, f.id_persona
  offset greatest(p_page - 1, 0) * greatest(p_page_size, 1)
  limit least(greatest(p_page_size, 1), 200);
end;
$$;

comment on function public.listar_trabajadores_elegibles_nomina(uuid, integer, integer, text, boolean, boolean) is
  'F07b: picker paginado de trabajadores elegibles; filtros disponibles / ya en nómina resueltos en servidor.';

revoke all on function public.listar_trabajadores_elegibles_nomina(uuid, integer, integer, text, boolean, boolean) from public;
grant execute on function public.listar_trabajadores_elegibles_nomina(uuid, integer, integer, text, boolean, boolean) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. listar_ids_dotacion_nomina — ids del universo filtrado (sin paginar)
--    Mismos filtros que listar_dotacion_nomina; solo devuelve identificadores
--    para acciones masivas sobre el conjunto completo.
-- ---------------------------------------------------------------------------

create or replace function public.listar_ids_dotacion_nomina(
  p_nomina_id uuid,
  p_busqueda text default null,
  p_estado text default null,
  p_segmento_id uuid default null,
  p_con_incidencias boolean default null,
  p_con_movimientos boolean default null
)
returns table (trabajador_id integer)
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
      d.segmento_id,
      concat_ws(' ', p.nombres, p.apellido_paterno, p.apellido_materno) as nombre,
      concat(p.rut, '-', p.dv) as rut,
      count(distinct i.id) filter (where i.severidad = 'critica' and i.resuelta_at is null) as criticas,
      count(distinct i.id) filter (where i.severidad = 'advertencia' and i.resuelta_at is null) as advertencias,
      count(distinct m.id) filter (where m.estado <> 'anulado') as movimientos,
      bool_or(i.bloqueante and i.resuelta_at is null) as bloqueante
    from dotacion d
    join public.persona p on p.id_persona = d.persona_id
    left join public.incidencia_nomina i
      on i.id_nomina_periodo = p_nomina_id and i.id_persona = d.persona_id
    left join public.movimiento_nomina m
      on m.id_nomina_periodo = p_nomina_id and m.id_persona = d.persona_id
    group by d.persona_id, d.segmento_id, p.nombres, p.apellido_paterno, p.apellido_materno, p.rut, p.dv
  ),
  filtrado as (
    select *,
      case
        when bloqueante then 'bloqueado'
        when criticas > 0 then 'critico'
        when advertencias > 0 then 'advertencia'
        else 'listo'
      end as estado_calculado
    from resumen
    where
      (p_segmento_id is null or segmento_id = p_segmento_id)
      and (
        p_busqueda is null
        or nombre ilike '%' || p_busqueda || '%'
        or rut ilike '%' || p_busqueda || '%'
      )
      and (p_con_incidencias is null or ((criticas + advertencias > 0) = p_con_incidencias))
      and (p_con_movimientos is null or ((movimientos > 0) = p_con_movimientos))
  )
  select persona_id
  from filtrado
  where p_estado is null or estado_calculado = p_estado
  order by persona_id;
$$;

comment on function public.listar_ids_dotacion_nomina(uuid, text, text, uuid, boolean, boolean) is
  'F07b: ids del universo filtrado de dotación para acciones masivas (sin paginar filas completas).';

revoke all on function public.listar_ids_dotacion_nomina(uuid, text, text, uuid, boolean, boolean) from public;
grant execute on function public.listar_ids_dotacion_nomina(uuid, text, text, uuid, boolean, boolean) to authenticated, service_role;
