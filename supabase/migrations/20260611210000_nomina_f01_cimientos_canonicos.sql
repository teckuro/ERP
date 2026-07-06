begin;

set local lock_timeout = '5s';
set local statement_timeout = '120s';

select pg_advisory_xact_lock(hashtext('NOM-ADMIN-OPS-F01'));

create table public.nomina_plantilla_ciclo (
  id uuid primary key default gen_random_uuid(),
  id_empresa integer not null
    references public.empresa(id_empresa) on delete cascade,
  codigo text not null,
  nombre text not null,
  tipo text not null,
  naturaleza text not null,
  configuracion jsonb not null default '{}'::jsonb,
  activo boolean not null default true,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint nomina_plantilla_ciclo_codigo_check
    check (btrim(codigo) <> ''),
  constraint nomina_plantilla_ciclo_nombre_check
    check (btrim(nombre) <> ''),
  constraint nomina_plantilla_ciclo_tipo_check
    check (tipo in ('mensual', 'quincenal', 'semanal', 'extraordinaria')),
  constraint nomina_plantilla_ciclo_naturaleza_check
    check (
      naturaleza in (
        'liquidacion_legal',
        'anticipo',
        'pago_extraordinario',
        'rectificacion'
      )
    ),
  constraint nomina_plantilla_ciclo_version_check
    check (version > 0),
  constraint nomina_plantilla_ciclo_empresa_codigo_version_key
    unique (id_empresa, codigo, version)
);

create unique index ux_nomina_plantilla_ciclo_activa
  on public.nomina_plantilla_ciclo (id_empresa, codigo)
  where activo;

create index ix_nomina_plantilla_ciclo_empresa
  on public.nomina_plantilla_ciclo (id_empresa);

create trigger tr_nomina_plantilla_ciclo_updated_at
before update on public.nomina_plantilla_ciclo
for each row execute function public.set_updated_at();

insert into public.nomina_plantilla_ciclo (
  id_empresa,
  codigo,
  nombre,
  tipo,
  naturaleza,
  configuracion
)
select
  empresa.id_empresa,
  'MES',
  'Mes calendario',
  'mensual',
  'liquidacion_legal',
  '{"rango":"mes_calendario"}'::jsonb
from public.empresa
on conflict (id_empresa, codigo, version) do nothing;

alter table public.nomina_periodo
  add column fecha_inicio date,
  add column fecha_fin date,
  add column naturaleza text,
  add column codigo_ciclo text,
  add column plantilla_ciclo_id uuid
    references public.nomina_plantilla_ciclo(id) on delete restrict,
  add column nomina_origen_id uuid
    references public.nomina_periodo(id) on delete restrict,
  add column version_estado integer not null default 0;

update public.nomina_periodo
set
  fecha_inicio = to_date(periodo || '-01', 'YYYY-MM-DD'),
  fecha_fin = (
    to_date(periodo || '-01', 'YYYY-MM-DD')
    + interval '1 month - 1 day'
  )::date,
  naturaleza = case tipo
    when 'mensual' then 'liquidacion_legal'
    when 'quincenal' then 'anticipo'
    when 'semanal' then 'anticipo'
    when 'extraordinaria' then 'pago_extraordinario'
  end,
  codigo_ciclo = case tipo
    when 'mensual' then periodo || '-MES'
    else periodo || '-' || upper(tipo) || '-' || left(id::text, 8)
  end
where
  fecha_inicio is null
  or fecha_fin is null
  or naturaleza is null
  or codigo_ciclo is null;

update public.nomina_periodo as nomina
set plantilla_ciclo_id = plantilla.id
from public.nomina_plantilla_ciclo as plantilla
where plantilla.id_empresa = nomina.id_empresa
  and plantilla.codigo = 'MES'
  and plantilla.activo
  and nomina.tipo = 'mensual'
  and nomina.plantilla_ciclo_id is null;

create or replace function public.completar_identidad_nomina_periodo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inicio_mes date;
begin
  if new.tipo = 'mensual' then
    v_inicio_mes := to_date(new.periodo || '-01', 'YYYY-MM-DD');

    new.fecha_inicio := coalesce(new.fecha_inicio, v_inicio_mes);
    new.fecha_fin := coalesce(
      new.fecha_fin,
      (v_inicio_mes + interval '1 month - 1 day')::date
    );
    new.naturaleza := coalesce(new.naturaleza, 'liquidacion_legal');
    new.codigo_ciclo := coalesce(
      nullif(btrim(new.codigo_ciclo), ''),
      new.periodo || '-MES'
    );

    if new.plantilla_ciclo_id is null then
      select plantilla.id
      into new.plantilla_ciclo_id
      from public.nomina_plantilla_ciclo as plantilla
      where plantilla.id_empresa = new.id_empresa
        and plantilla.codigo = 'MES'
        and plantilla.activo
      order by plantilla.version desc
      limit 1;
    end if;

    if new.plantilla_ciclo_id is null then
      raise exception
        'No existe plantilla mensual MES activa para la empresa %',
        new.id_empresa
        using errcode = '23514';
    end if;
  else
    new.naturaleza := coalesce(
      new.naturaleza,
      case new.tipo
        when 'quincenal' then 'anticipo'
        when 'semanal' then 'anticipo'
        when 'extraordinaria' then 'pago_extraordinario'
      end
    );

    if new.fecha_inicio is null
      or new.fecha_fin is null
      or nullif(btrim(new.codigo_ciclo), '') is null then
      raise exception
        'Las nominas no mensuales requieren rango y codigo de ciclo explicitos'
        using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

create trigger tr_nomina_periodo_identidad
before insert or update of
  id_empresa,
  periodo,
  tipo,
  fecha_inicio,
  fecha_fin,
  naturaleza,
  codigo_ciclo,
  plantilla_ciclo_id
on public.nomina_periodo
for each row execute function public.completar_identidad_nomina_periodo();

alter table public.nomina_periodo
  alter column fecha_inicio set not null,
  alter column fecha_fin set not null,
  alter column naturaleza set not null,
  alter column codigo_ciclo set not null,
  add constraint nomina_periodo_rango_check
    check (fecha_inicio <= fecha_fin),
  add constraint nomina_periodo_naturaleza_check
    check (
      naturaleza in (
        'liquidacion_legal',
        'anticipo',
        'pago_extraordinario',
        'rectificacion'
      )
    ),
  add constraint nomina_periodo_codigo_ciclo_check
    check (btrim(codigo_ciclo) <> ''),
  add constraint nomina_periodo_version_estado_check
    check (version_estado >= 0),
  add constraint nomina_periodo_origen_distinto_check
    check (nomina_origen_id is null or nomina_origen_id <> id),
  add constraint nomina_periodo_rectificacion_origen_check
    check (naturaleza <> 'rectificacion' or nomina_origen_id is not null),
  add constraint nomina_periodo_tipo_naturaleza_check
    check (
      naturaleza = 'rectificacion'
      or (tipo = 'mensual' and naturaleza = 'liquidacion_legal')
      or (tipo in ('quincenal', 'semanal') and naturaleza = 'anticipo')
      or (
        tipo = 'extraordinaria'
        and naturaleza = 'pago_extraordinario'
      )
    ),
  add constraint nomina_periodo_mensual_plantilla_check
    check (tipo <> 'mensual' or plantilla_ciclo_id is not null);

alter table public.nomina_periodo
  drop constraint if exists nomina_periodo_estado_check;

alter table public.nomina_periodo
  add constraint nomina_periodo_estado_check
  check (
    estado in (
      'borrador',
      'dotacion_generada',
      'en_revision',
      'calculada',
      'validada',
      'aprobada',
      'liquidada',
      'cerrada',
      'reabierta',
      'anulada'
    )
  );

alter table public.nomina_periodo
  drop constraint if exists nomina_periodo_unica_empresa_periodo_tipo;

drop index if exists public.ux_nomina_periodo_ordinaria;

create unique index ux_nomina_periodo_liquidacion_legal
  on public.nomina_periodo (id_empresa, periodo)
  where naturaleza = 'liquidacion_legal'
    and estado <> 'anulada';

create unique index ux_nomina_periodo_codigo_ciclo
  on public.nomina_periodo (id_empresa, codigo_ciclo)
  where estado <> 'anulada';

create index ix_nomina_periodo_plantilla_ciclo
  on public.nomina_periodo (plantilla_ciclo_id);

create index ix_nomina_periodo_nomina_origen
  on public.nomina_periodo (nomina_origen_id);

create table public.nomina_consolidacion (
  id uuid primary key default gen_random_uuid(),
  id_empresa integer not null
    references public.empresa(id_empresa) on delete cascade,
  id_nomina_origen uuid not null
    references public.nomina_periodo(id) on delete restrict,
  id_nomina_destino uuid not null
    references public.nomina_periodo(id) on delete restrict,
  tipo text not null,
  estado text not null default 'pendiente',
  monto_pagado numeric(18, 2) not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint nomina_consolidacion_nominas_distintas_check
    check (id_nomina_origen <> id_nomina_destino),
  constraint nomina_consolidacion_tipo_check
    check (tipo in ('anticipo', 'extraordinaria')),
  constraint nomina_consolidacion_estado_check
    check (estado in ('pendiente', 'aplicada', 'anulada')),
  constraint nomina_consolidacion_monto_check
    check (monto_pagado >= 0),
  constraint nomina_consolidacion_vinculo_key
    unique (id_nomina_origen, id_nomina_destino, tipo)
);

create index ix_nomina_consolidacion_empresa
  on public.nomina_consolidacion (id_empresa);

create index ix_nomina_consolidacion_destino_estado
  on public.nomina_consolidacion (id_nomina_destino, estado);

create trigger tr_nomina_consolidacion_updated_at
before update on public.nomina_consolidacion
for each row execute function public.set_updated_at();

alter table public.nomina_calculo_periodo
  add column id_nomina_periodo uuid
    references public.nomina_periodo(id) on delete set null;

alter table public.nomina_liquidacion_periodo
  add column id_nomina_periodo uuid
    references public.nomina_periodo(id) on delete set null;

update public.nomina_calculo_periodo as calculo
set id_nomina_periodo = nomina.id
from public.nomina_periodo as nomina
where nomina.id_calculo_periodo_vigente = calculo.id_calculo_periodo
  and calculo.id_nomina_periodo is null;

with candidatos as (
  select
    calculo.id_calculo_periodo as id_calculo,
    (array_agg(nomina.id order by nomina.id))[1] as id_nomina,
    count(*) as total
  from public.nomina_calculo_periodo as calculo
  join public.nomina_periodo as nomina
    on nomina.periodo = calculo.periodo
   and (
     nomina.id_empresa = calculo.id_empresa
     or calculo.id_empresa is null
   )
  where calculo.id_nomina_periodo is null
  group by calculo.id_calculo_periodo
)
update public.nomina_calculo_periodo as calculo
set id_nomina_periodo = candidatos.id_nomina
from candidatos
where calculo.id_calculo_periodo = candidatos.id_calculo
  and candidatos.total = 1;

update public.nomina_liquidacion_periodo as liquidacion
set id_nomina_periodo = calculo.id_nomina_periodo
from public.nomina_calculo_periodo as calculo
where calculo.id_calculo_periodo = liquidacion.id_calculo_periodo
  and calculo.id_nomina_periodo is not null
  and liquidacion.id_nomina_periodo is null;

create index ix_nomina_calculo_periodo_nomina
  on public.nomina_calculo_periodo (id_nomina_periodo);

create index ix_nomina_liquidacion_periodo_nomina
  on public.nomina_liquidacion_periodo (id_nomina_periodo);

alter table public.nomina_plantilla_ciclo enable row level security;
alter table public.nomina_consolidacion enable row level security;

alter table public.evento_auditoria_nomina
  drop constraint if exists evento_auditoria_nomina_accion_check;

alter table public.evento_auditoria_nomina
  add constraint evento_auditoria_nomina_accion_check
  check (
    accion in (
      'creada',
      'dotacion_confirmada',
      'movimientos_actualizados',
      'calculo_invalidado',
      'calculada',
      'validada',
      'aprobada',
      'liquidada',
      'cerrada',
      'reabierta',
      'anulada'
    )
  );

create or replace function public.tg_audit_nomina_periodo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
begin
  v_user := auth.uid();

  if tg_op = 'INSERT' then
    insert into public.evento_auditoria_nomina (
      id_nomina_periodo,
      accion,
      id_usuario
    )
    values (new.id, 'creada', v_user);

    return new;
  end if;

  if tg_op = 'UPDATE' and old.estado is distinct from new.estado then
    if new.estado in (
      'calculada',
      'validada',
      'aprobada',
      'liquidada',
      'cerrada',
      'reabierta',
      'anulada'
    ) then
      insert into public.evento_auditoria_nomina (
        id_nomina_periodo,
        accion,
        id_usuario
      )
      values (new.id, new.estado, v_user);
    end if;
  end if;

  return new;
end;
$$;

drop function if exists public.transicionar_nomina_periodo(
  uuid,
  text,
  text,
  text,
  bigint,
  integer,
  numeric,
  numeric,
  numeric
);

create function public.transicionar_nomina_periodo(
  p_nomina_id uuid,
  p_estado_esperado text,
  p_estado_destino text,
  p_motivo text default null,
  p_id_calculo_periodo bigint default null,
  p_total_trabajadores integer default null,
  p_total_haberes numeric default null,
  p_total_descuentos numeric default null,
  p_total_liquido numeric default null,
  p_version_estado_esperada integer default null
)
returns public.nomina_periodo
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_actual public.nomina_periodo%rowtype;
  v_permitida boolean;
begin
  select *
  into v_actual
  from public.nomina_periodo
  where id = p_nomina_id
  for update;

  if not found then
    raise exception 'Nomina no encontrada';
  end if;

  if v_actual.estado <> p_estado_esperado then
    raise exception
      'La nomina cambio de estado: esperado %, actual %',
      p_estado_esperado,
      v_actual.estado;
  end if;

  if p_version_estado_esperada is not null
    and v_actual.version_estado <> p_version_estado_esperada then
    raise exception
      'Version de estado esperada %, version actual %',
      p_version_estado_esperada,
      v_actual.version_estado
      using errcode = '40001';
  end if;

  v_permitida := case v_actual.estado
    when 'borrador'
      then p_estado_destino in ('dotacion_generada', 'anulada')
    when 'dotacion_generada'
      then p_estado_destino in ('en_revision', 'anulada')
    when 'en_revision'
      then p_estado_destino in ('calculada', 'anulada')
    when 'calculada'
      then p_estado_destino in ('en_revision', 'validada', 'anulada')
    when 'validada'
      then p_estado_destino in ('en_revision', 'aprobada', 'anulada')
    when 'aprobada'
      then p_estado_destino in (
        'en_revision',
        'liquidada',
        'cerrada',
        'anulada'
      )
    when 'liquidada'
      then p_estado_destino in ('en_revision', 'cerrada', 'anulada')
    when 'cerrada'
      then p_estado_destino = 'reabierta'
    when 'reabierta'
      then p_estado_destino in (
        'en_revision',
        'calculada',
        'validada',
        'aprobada',
        'liquidada',
        'cerrada',
        'anulada'
      )
    else false
  end;

  if not v_permitida then
    raise exception
      'Transicion no permitida: % -> %',
      v_actual.estado,
      p_estado_destino;
  end if;

  if p_id_calculo_periodo is not null then
    perform 1
    from public.nomina_calculo_periodo
    where id_calculo_periodo = p_id_calculo_periodo
      and periodo = v_actual.periodo
      and (
        id_empresa = v_actual.id_empresa
        or (
          id_empresa is null
          and (
            id_nomina_periodo is null
            or id_nomina_periodo = v_actual.id
          )
        )
      )
    for update;

    if not found then
      raise exception
        'El calculo indicado no pertenece a la nomina'
        using errcode = '23514';
    end if;

    update public.nomina_calculo_periodo
    set id_nomina_periodo = coalesce(id_nomina_periodo, v_actual.id)
    where id_calculo_periodo = p_id_calculo_periodo;
  end if;

  update public.nomina_periodo
  set
    estado = p_estado_destino,
    version_estado = version_estado + 1,
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
    calculado_at = case
      when p_estado_destino = 'calculada' then now()
      else calculado_at
    end,
    validado_at = case
      when p_estado_destino = 'validada' then now()
      else validado_at
    end,
    aprobado_at = case
      when p_estado_destino = 'aprobada' then now()
      else aprobado_at
    end,
    closed_at = case
      when p_estado_destino = 'cerrada' then now()
      else null
    end,
    total_trabajadores = coalesce(
      p_total_trabajadores,
      total_trabajadores
    ),
    total_haberes = coalesce(p_total_haberes, total_haberes),
    total_descuentos = coalesce(p_total_descuentos, total_descuentos),
    total_liquido = coalesce(p_total_liquido, total_liquido),
    updated_at = now()
  where id = p_nomina_id
  returning *
  into v_actual;

  if p_motivo is not null then
    update public.evento_auditoria_nomina
    set motivo = p_motivo
    where id = (
      select evento.id
      from public.evento_auditoria_nomina as evento
      where evento.id_nomina_periodo = p_nomina_id
        and evento.accion = p_estado_destino
      order by evento.created_at desc
      limit 1
    );
  end if;

  return v_actual;
end;
$$;

grant execute on function public.transicionar_nomina_periodo(
  uuid,
  text,
  text,
  text,
  bigint,
  integer,
  numeric,
  numeric,
  numeric,
  integer
) to authenticated, service_role;

-- Sanea dos errores preexistentes de plpgsql_check que bloquean el lint
-- remoto. No cambia firmas ni contratos funcionales.
do $f01_lint_fn_generar$
declare
  v_definicion text;
  v_corregida text;
begin
  select pg_get_functiondef(
    'public.fn_generar_liquidacion(integer,date,integer,boolean)'::regprocedure
  )
  into v_definicion;

  v_corregida := replace(
    v_definicion,
    'WHEN m.id_concepto IS NOT NULL THEN m.id_concepto',
    'WHEN MAX(m.id_concepto) IS NOT NULL THEN MAX(m.id_concepto)'
  );
  v_corregida := replace(
    v_corregida,
    'WHEN m.tipomovimiento = 2 THEN',
    'WHEN MAX(m.tipomovimiento) = 2 THEN'
  );
  v_corregida := replace(
    v_corregida,
    'WHEN m.tipomovimiento = 3 THEN',
    'WHEN MAX(m.tipomovimiento) = 3 THEN'
  );
  v_corregida := replace(
    v_corregida,
    'WHEN m.cantidad IS NOT NULL THEN SUM',
    'WHEN BOOL_OR(m.cantidad IS NOT NULL) THEN SUM'
  );
  v_corregida := replace(
    v_corregida,
    'COALESCE(c.tipo, CASE WHEN MAX(m.tipomovimiento) = 2',
    'COALESCE(MAX(c.tipo), CASE WHEN MAX(m.tipomovimiento) = 2'
  );
  v_corregida := replace(
    v_corregida,
    'COALESCE(c.tipo, ''DESCUENTO'')',
    'COALESCE(MAX(c.tipo), ''DESCUENTO'')'
  );
  v_corregida := replace(
    v_corregida,
    'COALESCE(c.naturaleza, ''IMPONIBLE'')',
    'COALESCE(MAX(c.naturaleza), ''IMPONIBLE'')'
  );

  if v_corregida = v_definicion then
    raise exception
      'F01: no se encontro el bloque esperado de fn_generar_liquidacion';
  end if;

  execute v_corregida;
end;
$f01_lint_fn_generar$;

do $f01_lint_snapshot$
declare
  v_definicion text;
  v_corregida text;
begin
  select pg_get_functiondef(
    'public.guardar_nomina_calculo_snapshot(text,integer,jsonb,jsonb,jsonb,jsonb,jsonb,jsonb,bigint)'::regprocedure
  )
  into v_definicion;

  v_corregida := regexp_replace(
    v_definicion,
    'CREATE TEMP TABLE IF NOT EXISTS tmp_nomina_snapshot_trab_map\s*\(\s*trabajador_index INT PRIMARY KEY,\s*id_calculo_trabajador INT NOT NULL\s*\) ON COMMIT DROP;',
    $reemplazo$EXECUTE 'CREATE TEMP TABLE IF NOT EXISTS tmp_nomina_snapshot_trab_map (trabajador_index INT PRIMARY KEY, id_calculo_trabajador INT NOT NULL) ON COMMIT DROP';$reemplazo$,
    'g'
  );
  v_corregida := regexp_replace(
    v_corregida,
    'TRUNCATE TABLE tmp_nomina_snapshot_trab_map;',
    $reemplazo$EXECUTE 'TRUNCATE TABLE pg_temp.tmp_nomina_snapshot_trab_map';$reemplazo$,
    'g'
  );
  v_corregida := regexp_replace(
    v_corregida,
    'INSERT INTO tmp_nomina_snapshot_trab_map\s*\(trabajador_index,\s*id_calculo_trabajador\)\s*VALUES\s*\(v_trabajador_index,\s*v_id_calculo_trabajador\);',
    $reemplazo$EXECUTE 'INSERT INTO pg_temp.tmp_nomina_snapshot_trab_map (trabajador_index, id_calculo_trabajador) VALUES ($1, $2)' USING v_trabajador_index, v_id_calculo_trabajador;$reemplazo$,
    'g'
  );
  v_corregida := regexp_replace(
    v_corregida,
    'SELECT id_calculo_trabajador\s*INTO v_id_calculo_trabajador\s*FROM tmp_nomina_snapshot_trab_map\s*WHERE trabajador_index = \(v_item->>''trabajador_index''\)::INT;',
    $reemplazo$EXECUTE 'SELECT id_calculo_trabajador FROM pg_temp.tmp_nomina_snapshot_trab_map WHERE trabajador_index = $1' INTO v_id_calculo_trabajador USING (v_item->>'trabajador_index')::INT;$reemplazo$,
    'g'
  );

  if v_corregida = v_definicion then
    raise exception
      'F01: no se encontraron referencias temporales esperadas en snapshot';
  end if;

  execute v_corregida;
end;
$f01_lint_snapshot$;

notify pgrst, 'reload schema';

commit;
