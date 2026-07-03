-- BKL-09 fix: listar_calculo_trabajadores_nomina — PL/pgSQL RETURNS TABLE shadowing
-- provoca "structure of query does not match function result type" (mismo patrón F07).
-- Solución: subconsulta con casts explícitos + #variable_conflict use_column.

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
#variable_conflict use_column
declare
  v_nomina public.nomina_periodo;
  v_id_calculo integer;
  v_page integer := greatest(coalesce(p_page, 1), 1);
  v_page_size integer := least(greatest(coalesce(p_page_size, 25), 1), 200);
  v_offset integer := (greatest(coalesce(p_page, 1), 1) - 1) * v_page_size;
  v_busqueda text := nullif(trim(coalesce(p_busqueda, '')), '');
begin
  select * into v_nomina
  from public.nomina_periodo np
  where np.id = p_nomina_id;

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
  select
    q.id_calculo_trabajador::integer,
    q.id_persona::integer,
    q.rut::text,
    q.nombre::text,
    q.estado::text,
    q.sueldo_base::numeric,
    q.total_haberes::numeric,
    q.total_descuentos::numeric,
    q.liquido_preliminar::numeric,
    q.base_imponible_previsional::numeric,
    q.base_tributable::numeric,
    q.cotizacion_sis::numeric,
    q.cotizacion_sanna::numeric,
    q.cotizacion_ley_16744_empleador::numeric,
    q.cuenta_issues::bigint,
    q.total_count::bigint
  from (
    with filtrado as (
      select
        t.id_calculo_trabajador,
        t.id_persona,
        t.rut,
        t.nombre_completo_snapshot,
        t.estado,
        t.sueldo_base,
        t.total_haberes_imponibles,
        t.total_haberes_no_imponibles,
        t.total_descuentos_legales,
        t.total_descuentos_voluntarios,
        t.liquido_preliminar,
        t.base_imponible_previsional,
        t.base_tributable,
        t.cotizacion_sis,
        t.cotizacion_sanna,
        t.cotizacion_ley_16744_empleador,
        coalesce((
          select count(*)::bigint
          from public.nomina_calculo_issue i
          where i.id_calculo_trabajador = t.id_calculo_trabajador
        ), 0::bigint) as cuenta_issues_calc
      from public.nomina_calculo_trabajador t
      inner join public.nomina_calculo_periodo cp
        on cp.id_calculo_periodo = t.id_calculo_periodo
      where t.id_calculo_periodo = v_id_calculo
        and cp.activo = true
        and (cp.id_nomina_periodo is null or cp.id_nomina_periodo = p_nomina_id)
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
        count(*) over ()::bigint as total_count_calc
      from filtrado f
      order by f.liquido_preliminar desc nulls last, f.nombre_completo_snapshot asc, f.id_persona asc
      offset v_offset
      limit v_page_size
    )
    select
      n.id_calculo_trabajador,
      n.id_persona,
      n.rut,
      n.nombre_completo_snapshot as nombre,
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
      n.cuenta_issues_calc as cuenta_issues,
      n.total_count_calc as total_count
    from numerado n
  ) q;
end;
$$;

comment on function public.listar_calculo_trabajadores_nomina(uuid, integer, integer, text, text) is
  'Página de filas del paso Cálculo desde snapshot persistido (BKL-09).';

revoke all on function public.listar_calculo_trabajadores_nomina(uuid, integer, integer, text, text) from public, anon;
grant execute on function public.listar_calculo_trabajadores_nomina(uuid, integer, integer, text, text) to authenticated, service_role;

-- Refuerzo resumen_calculo_nomina con variable_conflict (misma clase de bug).
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
#variable_conflict use_column
declare
  v_nomina public.nomina_periodo;
  v_cabecera public.nomina_calculo_periodo;
begin
  select * into v_nomina
  from public.nomina_periodo np
  where np.id = p_nomina_id;

  if not found then
    raise exception 'resumen_calculo_nomina: nómina no encontrada'
      using errcode = 'P0002';
  end if;

  if not coalesce(v_nomina.calculo_vigente, false)
     or v_nomina.id_calculo_periodo_vigente is null then
    return;
  end if;

  select c.* into v_cabecera
  from public.nomina_calculo_periodo c
  where c.id_calculo_periodo = v_nomina.id_calculo_periodo_vigente
    and c.activo = true
    and (c.id_nomina_periodo is null or c.id_nomina_periodo = p_nomina_id);

  if not found then
    return;
  end if;

  return query
  select
    v_cabecera.id_calculo_periodo::integer,
    coalesce(v_cabecera.total_trabajadores, 0)::integer,
    coalesce(v_cabecera.total_haberes, 0)::numeric,
    coalesce(v_cabecera.total_descuentos, 0)::numeric,
    coalesce(v_cabecera.total_liquido, 0)::numeric,
    coalesce(v_cabecera.total_advertencias, 0)::integer,
    coalesce(v_cabecera.total_bloqueados, 0)::integer;
end;
$$;

comment on function public.resumen_calculo_nomina(uuid) is
  'Stats de cabecera del cálculo vigente sin cargar filas de trabajadores (BKL-09).';

revoke all on function public.resumen_calculo_nomina(uuid) from public, anon;
grant execute on function public.resumen_calculo_nomina(uuid) to authenticated, service_role;
