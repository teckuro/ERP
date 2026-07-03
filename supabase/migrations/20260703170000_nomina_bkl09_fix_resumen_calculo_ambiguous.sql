-- BKL-09 fix: id_calculo_periodo ambiguo en PL/pgSQL (RETURNS TABLE crea variable homónima).

-- Refuerzo resumen_calculo_nomina con variable_conflict (misma clase de bug).
-- Ver también 20260703180000_nomina_bkl09_fix_listar_calculo_result_type.sql (listar_calculo).
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
    and c.activo = true;

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
