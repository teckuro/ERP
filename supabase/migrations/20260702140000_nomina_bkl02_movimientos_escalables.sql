-- =============================================================================
-- 20260702140000_nomina_bkl02_movimientos_escalables.sql
-- BKL-02 (AUDIT-PROYECTO-2026-07) — paso Movimientos escalable.
--
-- Antes: el paso cargaba la dotación con techo pageSize=1000 (el RPC además
-- capea en 200 filas → identidades truncadas), todos los movimientos de la
-- nómina sin paginar y agregaba por trabajador en el cliente.
--
-- Ahora: agregación por trabajador en servidor, con filtros y paginación.
-- La semántica replica exactamente la del cliente
-- (`NominaPeriodoService.listarMovimientosPorTrabajador`):
--   - item "configurado" = recurrente activo aplicable al trabajador
--     (persona directa > segmento > toda la nómina); su estado deriva del
--     movimiento_nomina que lo materializa (pendiente si no existe,
--     omitido si estado='omitido', aplicado en cualquier otro caso);
--     su monto es el del recurrente.
--   - item "manual" = movimiento_nomina con origen='manual'; monto propio.
--   - subtotales $ solo de items aplicados con categoría haber/descuento;
--     ausencias/informativos cuentan si el item no está omitido.
-- =============================================================================

set search_path = public;

-- ---------------------------------------------------------------------------
-- 1. listar_movimientos_trabajadores_nomina — página de filas agregadas
-- ---------------------------------------------------------------------------

create or replace function public.listar_movimientos_trabajadores_nomina(
  p_nomina_id uuid,
  p_page integer default 1,
  p_page_size integer default 25,
  p_busqueda text default null,
  p_estado text default null,     -- con-pendientes | solo-aplicados | con-omitidos
  p_categoria text default null   -- con-haberes | con-descuentos | con-ausencias | con-informativos
)
returns table (
  trabajador_id integer,
  nombre text,
  rut text,
  cargo text,
  departamento text,
  total_haberes numeric,
  total_descuentos numeric,
  cuenta_ausencias bigint,
  cuenta_informativos bigint,
  cuenta_pendientes bigint,
  cuenta_aplicados bigint,
  cuenta_omitidos bigint,
  cuenta_manuales_aplicados bigint,
  cuenta_items bigint,
  total_count bigint
)
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_nomina public.nomina_periodo;
begin
  select * into v_nomina
  from public.nomina_periodo
  where id = p_nomina_id;

  if not found then
    raise exception 'listar_movimientos_trabajadores_nomina: nómina no encontrada'
      using errcode = 'P0002';
  end if;

  return query
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
  recurrentes as (
    select r.*
    from public.movimiento_recurrente r
    where r.id_empresa = v_nomina.id_empresa
      and r.estado = 'activo'
  ),
  movs as (
    select m.*
    from public.movimiento_nomina m
    where m.id_nomina_periodo = p_nomina_id
  ),
  items as (
    -- Configurados: recurrente aplicable × trabajador de la dotación.
    select
      d.persona_id,
      case
        when m.id is null then 'pendiente'
        when m.estado = 'omitido' then 'omitido'
        else 'aplicado'
      end as estado_item,
      r.categoria,
      r.monto,
      false as es_manual
    from recurrentes r
    join dotacion d on (
      (r.id_persona is not null and r.id_persona = d.persona_id)
      or (r.id_persona is null and r.id_segmento_nomina is not null
          and r.id_segmento_nomina = d.segmento_id)
      or (r.id_persona is null and r.id_segmento_nomina is null)
    )
    left join movs m
      on m.id_persona = d.persona_id
     and m.id_recurrente = r.id
     and m.tipo = r.tipo
    union all
    -- Manuales del período.
    select
      m.id_persona,
      case when m.estado = 'omitido' then 'omitido' else 'aplicado' end,
      m.categoria,
      m.monto,
      true
    from movs m
    where m.origen = 'manual'
  ),
  agregado as (
    select
      d.persona_id,
      coalesce(sum(i.monto) filter (where i.estado_item = 'aplicado' and i.categoria = 'haber'), 0) as total_haberes,
      coalesce(sum(i.monto) filter (where i.estado_item = 'aplicado' and i.categoria = 'descuento'), 0) as total_descuentos,
      count(i.*) filter (where i.estado_item <> 'omitido' and i.categoria = 'ausencia') as cuenta_ausencias,
      count(i.*) filter (where i.estado_item <> 'omitido' and i.categoria = 'informativo') as cuenta_informativos,
      count(i.*) filter (where i.estado_item = 'pendiente') as cuenta_pendientes,
      count(i.*) filter (where i.estado_item = 'aplicado') as cuenta_aplicados,
      count(i.*) filter (where i.estado_item = 'omitido') as cuenta_omitidos,
      count(i.*) filter (where i.es_manual and i.estado_item = 'aplicado') as cuenta_manuales_aplicados,
      count(i.*) as cuenta_items,
      count(i.*) filter (where i.categoria = 'haber') as cuenta_items_haber,
      count(i.*) filter (where i.categoria = 'descuento') as cuenta_items_descuento
    from dotacion d
    left join items i on i.persona_id = d.persona_id
    group by d.persona_id
  ),
  con_identidad as (
    select
      a.*,
      trim(both ' ' from concat_ws(' ', p.nombres, p.apellido_paterno, p.apellido_materno)) as nombre,
      concat(p.rut, '-', p.dv) as rut,
      coalesce(ct.cargo, '')::text as cargo,
      coalesce(de.nombre, '')::text as departamento
    from agregado a
    join public.persona p on p.id_persona = a.persona_id
    left join lateral (
      select c.*
      from public.contrato c
      where c.id_persona = p.id_persona
        and c.id_empresa = v_nomina.id_empresa
        and c.estado = 'ACTIVO'
      order by c.fecha_inicio desc, c.id_contrato desc
      limit 1
    ) ct on true
    left join public.departamento_empresa de
      on de.id_departamento_empresa = ct.id_departamento_empresa
  ),
  filtrado as (
    select *
    from con_identidad ci
    where
      (
        p_busqueda is null
        or ci.nombre ilike '%' || p_busqueda || '%'
        or ci.rut ilike '%' || p_busqueda || '%'
        or ci.cargo ilike '%' || p_busqueda || '%'
        or ci.departamento ilike '%' || p_busqueda || '%'
      )
      and (
        p_estado is null
        or (p_estado = 'con-pendientes' and ci.cuenta_pendientes > 0)
        or (p_estado = 'solo-aplicados' and ci.cuenta_aplicados > 0
            and ci.cuenta_pendientes = 0 and ci.cuenta_omitidos = 0)
        or (p_estado = 'con-omitidos' and ci.cuenta_omitidos > 0)
      )
      and (
        p_categoria is null
        or (p_categoria = 'con-haberes' and (ci.total_haberes > 0 or ci.cuenta_items_haber > 0))
        or (p_categoria = 'con-descuentos' and (ci.total_descuentos > 0 or ci.cuenta_items_descuento > 0))
        or (p_categoria = 'con-ausencias' and ci.cuenta_ausencias > 0)
        or (p_categoria = 'con-informativos' and ci.cuenta_informativos > 0)
      )
  )
  select
    f.persona_id,
    f.nombre,
    f.rut,
    f.cargo,
    f.departamento,
    f.total_haberes,
    f.total_descuentos,
    f.cuenta_ausencias,
    f.cuenta_informativos,
    f.cuenta_pendientes,
    f.cuenta_aplicados,
    f.cuenta_omitidos,
    f.cuenta_manuales_aplicados,
    f.cuenta_items,
    count(*) over()
  from filtrado f
  order by (f.cuenta_pendientes > 0) desc, f.nombre, f.persona_id
  offset greatest(p_page - 1, 0) * greatest(p_page_size, 1)
  limit least(greatest(p_page_size, 1), 200);
end;
$$;

comment on function public.listar_movimientos_trabajadores_nomina(uuid, integer, integer, text, text, text) is
  'BKL-02: filas agregadas por trabajador del paso Movimientos, con filtros y paginación en servidor.';

revoke all on function public.listar_movimientos_trabajadores_nomina(uuid, integer, integer, text, text, text) from public, anon;
grant execute on function public.listar_movimientos_trabajadores_nomina(uuid, integer, integer, text, text, text) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. resumen_movimientos_nomina — stats globales sin paginar
-- ---------------------------------------------------------------------------

create or replace function public.resumen_movimientos_nomina(p_nomina_id uuid)
returns table (
  trabajadores_con_movimientos bigint,
  trabajadores_con_pendientes bigint,
  total_haberes numeric,
  total_descuentos numeric,
  total_pendientes bigint,
  total_aplicados bigint
)
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_nomina public.nomina_periodo;
begin
  select * into v_nomina
  from public.nomina_periodo
  where id = p_nomina_id;

  if not found then
    raise exception 'resumen_movimientos_nomina: nómina no encontrada'
      using errcode = 'P0002';
  end if;

  return query
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
  recurrentes as (
    select r.*
    from public.movimiento_recurrente r
    where r.id_empresa = v_nomina.id_empresa
      and r.estado = 'activo'
  ),
  movs as (
    select m.*
    from public.movimiento_nomina m
    where m.id_nomina_periodo = p_nomina_id
  ),
  items as (
    select
      d.persona_id,
      case
        when m.id is null then 'pendiente'
        when m.estado = 'omitido' then 'omitido'
        else 'aplicado'
      end as estado_item,
      r.categoria,
      r.monto
    from recurrentes r
    join dotacion d on (
      (r.id_persona is not null and r.id_persona = d.persona_id)
      or (r.id_persona is null and r.id_segmento_nomina is not null
          and r.id_segmento_nomina = d.segmento_id)
      or (r.id_persona is null and r.id_segmento_nomina is null)
    )
    left join movs m
      on m.id_persona = d.persona_id
     and m.id_recurrente = r.id
     and m.tipo = r.tipo
    union all
    select
      m.id_persona,
      case when m.estado = 'omitido' then 'omitido' else 'aplicado' end,
      m.categoria,
      m.monto
    from movs m
    where m.origen = 'manual'
  ),
  agregado as (
    select
      d.persona_id,
      coalesce(sum(i.monto) filter (where i.estado_item = 'aplicado' and i.categoria = 'haber'), 0) as haberes,
      coalesce(sum(i.monto) filter (where i.estado_item = 'aplicado' and i.categoria = 'descuento'), 0) as descuentos,
      count(i.*) filter (where i.estado_item = 'pendiente') as pendientes,
      count(i.*) filter (where i.estado_item = 'aplicado') as aplicados,
      count(i.*) as items
    from dotacion d
    left join items i on i.persona_id = d.persona_id
    group by d.persona_id
  )
  select
    count(*) filter (where a.items > 0),
    count(*) filter (where a.pendientes > 0),
    coalesce(sum(a.haberes), 0),
    coalesce(sum(a.descuentos), 0),
    coalesce(sum(a.pendientes), 0)::bigint,
    coalesce(sum(a.aplicados), 0)::bigint
  from agregado a;
end;
$$;

comment on function public.resumen_movimientos_nomina(uuid) is
  'BKL-02: stats globales del paso Movimientos (pendientes, aplicados, subtotales) sin cargar filas.';

revoke all on function public.resumen_movimientos_nomina(uuid) from public, anon;
grant execute on function public.resumen_movimientos_nomina(uuid) to authenticated, service_role;
