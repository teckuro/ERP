set search_path = public;

alter table public.nomina_periodo
  add column if not exists id_calculo_periodo_vigente bigint
    references public.nomina_calculo_periodo(id_calculo_periodo) on delete set null,
  add column if not exists version_calculo integer not null default 0,
  add column if not exists calculo_vigente boolean not null default false,
  add column if not exists calculado_at timestamptz,
  add column if not exists validado_at timestamptz,
  add column if not exists aprobado_at timestamptz;

alter table public.nomina_periodo
  drop constraint if exists nomina_periodo_unica_empresa_periodo_tipo;

create unique index if not exists ux_nomina_periodo_ordinaria
  on public.nomina_periodo (id_empresa, periodo, tipo)
  where tipo <> 'extraordinaria' and estado <> 'anulada';

create index if not exists ix_nomina_periodo_calculo_vigente
  on public.nomina_periodo (id_calculo_periodo_vigente)
  where id_calculo_periodo_vigente is not null;

alter table public.evento_auditoria_nomina
  drop constraint if exists evento_auditoria_nomina_accion_check;

alter table public.evento_auditoria_nomina
  add constraint evento_auditoria_nomina_accion_check
  check (accion in (
    'creada', 'dotacion_confirmada', 'movimientos_actualizados',
    'calculo_invalidado', 'calculada', 'validada', 'aprobada',
    'cerrada', 'reabierta', 'anulada'
  ));

create or replace function public.transicionar_nomina_periodo(
  p_nomina_id uuid,
  p_estado_esperado text,
  p_estado_destino text,
  p_motivo text default null,
  p_id_calculo_periodo bigint default null,
  p_total_trabajadores integer default null,
  p_total_haberes numeric default null,
  p_total_descuentos numeric default null,
  p_total_liquido numeric default null
)
returns public.nomina_periodo
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_actual public.nomina_periodo;
  v_permitida boolean;
begin
  select * into v_actual
  from public.nomina_periodo
  where id = p_nomina_id
  for update;

  if not found then
    raise exception 'Nómina no encontrada';
  end if;
  if v_actual.estado <> p_estado_esperado then
    raise exception 'La nómina cambió de estado: esperado %, actual %', p_estado_esperado, v_actual.estado;
  end if;

  v_permitida := case v_actual.estado
    when 'borrador' then p_estado_destino in ('dotacion_generada', 'anulada')
    when 'dotacion_generada' then p_estado_destino in ('en_revision', 'anulada')
    when 'en_revision' then p_estado_destino in ('calculada', 'anulada')
    when 'calculada' then p_estado_destino in ('en_revision', 'validada', 'anulada')
    when 'validada' then p_estado_destino in ('en_revision', 'aprobada', 'anulada')
    when 'aprobada' then p_estado_destino in ('en_revision', 'cerrada', 'anulada')
    when 'cerrada' then p_estado_destino = 'reabierta'
    when 'reabierta' then p_estado_destino in ('en_revision', 'calculada', 'validada', 'aprobada', 'cerrada', 'anulada')
    else false
  end;
  if not v_permitida then
    raise exception 'Transición no permitida: % -> %', v_actual.estado, p_estado_destino;
  end if;

  update public.nomina_periodo
  set
    estado = p_estado_destino,
    id_calculo_periodo_vigente = case
      when p_estado_destino = 'calculada' then p_id_calculo_periodo
      when p_estado_destino in ('en_revision', 'reabierta') then null
      else id_calculo_periodo_vigente
    end,
    version_calculo = case
      when p_estado_destino = 'calculada' then version_calculo + 1
      else version_calculo
    end,
    calculo_vigente = case
      when p_estado_destino = 'calculada' then true
      when p_estado_destino in ('en_revision', 'reabierta') then false
      else calculo_vigente
    end,
    calculado_at = case when p_estado_destino = 'calculada' then now() else calculado_at end,
    validado_at = case when p_estado_destino = 'validada' then now() else validado_at end,
    aprobado_at = case when p_estado_destino = 'aprobada' then now() else aprobado_at end,
    closed_at = case when p_estado_destino = 'cerrada' then now() else null end,
    total_trabajadores = coalesce(p_total_trabajadores, total_trabajadores),
    total_haberes = coalesce(p_total_haberes, total_haberes),
    total_descuentos = coalesce(p_total_descuentos, total_descuentos),
    total_liquido = coalesce(p_total_liquido, total_liquido),
    updated_at = now()
  where id = p_nomina_id
  returning * into v_actual;

  if p_motivo is not null then
    update public.evento_auditoria_nomina
    set motivo = p_motivo
    where id = (
      select e.id
      from public.evento_auditoria_nomina e
      where e.id_nomina_periodo = p_nomina_id
        and e.accion = p_estado_destino
      order by e.created_at desc
      limit 1
    );
  end if;

  return v_actual;
end;
$$;

create or replace function public.listar_dotacion_nomina(
  p_nomina_id uuid,
  p_page integer default 1,
  p_page_size integer default 50,
  p_busqueda text default null,
  p_estado text default null,
  p_segmento_id uuid default null,
  p_con_incidencias boolean default null,
  p_con_movimientos boolean default null
)
returns table (
  trabajador_id integer,
  nombre text,
  rut text,
  segmento_id uuid,
  estado text,
  total_incidencias_criticas bigint,
  total_advertencias bigint,
  total_movimientos bigint,
  total_count bigint
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
  select
    persona_id,
    nombre,
    rut,
    segmento_id,
    estado_calculado,
    criticas,
    advertencias,
    movimientos,
    count(*) over()
  from filtrado
  where p_estado is null or estado_calculado = p_estado
  order by
    case estado_calculado
      when 'bloqueado' then 0
      when 'critico' then 1
      when 'advertencia' then 2
      else 3
    end,
    nombre
  offset greatest(p_page - 1, 0) * greatest(p_page_size, 1)
  limit least(greatest(p_page_size, 1), 200);
$$;
