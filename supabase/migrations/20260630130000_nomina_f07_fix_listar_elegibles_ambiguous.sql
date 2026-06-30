-- F07 fix: ya_en_nomina ambiguo en PL/pgSQL (RETURNS TABLE crea variable homónima).

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
      trim(both ' ' from concat_ws(' ', p.nombres, p.apellido_paterno, p.apellido_materno))::text as nombre,
      concat(p.rut, '-', p.dv)::text as rut,
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
