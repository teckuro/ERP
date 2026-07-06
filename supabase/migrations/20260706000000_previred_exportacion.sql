-- PREVIRED-01b: catálogo LRE → Previred y auditoría de exportación.

create table if not exists public.catalogo_previred (
  id_catalogo_previred serial primary key,
  codigo_lre varchar(10) not null,
  codigo_previred varchar(10) not null,
  glosa_previred varchar(200),
  vigente boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint catalogo_previred_codigo_lre_uk unique (codigo_lre)
);

create index if not exists idx_catalogo_previred_vigente
  on public.catalogo_previred (vigente, codigo_lre);

comment on table public.catalogo_previred is
  'Mapeo operativo codigo_lre → codigo Previred para exportación remuneraciones.';

-- Semilla inicial: identidad 1:1 desde catálogo LRE vigente (ajustable por RRHH).
insert into public.catalogo_previred (codigo_lre, codigo_previred, glosa_previred, vigente)
select
  l.codigo_lre,
  l.codigo_lre,
  l.nombre_lre,
  l.vigente
from public.catalogo_lre l
where l.vigente = true
on conflict (codigo_lre) do update
set
  glosa_previred = excluded.glosa_previred,
  vigente = excluded.vigente,
  updated_at = now();

create table if not exists public.nomina_previred_exportacion (
  id_previred_exportacion bigserial primary key,
  id_liquidacion_periodo bigint not null
    references public.nomina_liquidacion_periodo(id_liquidacion_periodo) on delete cascade,
  id_nomina_periodo uuid null
    references public.nomina_periodo(id) on delete set null,
  periodo text not null,
  version_liquidacion integer not null default 1,
  usuario_id uuid null,
  usuario_label text not null,
  canal text not null default 'csv_borrador',
  total_lineas integer not null default 0,
  total_trabajadores integer not null default 0,
  conceptos_sin_mapeo integer not null default 0,
  conceptos_sin_codigo integer not null default 0,
  exportado_en timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  constraint nomina_previred_exportacion_canal_chk check (
    canal in ('csv_borrador')
  )
);

create index if not exists idx_nomina_previred_exportacion_periodo
  on public.nomina_previred_exportacion(id_liquidacion_periodo, exportado_en desc);

create index if not exists idx_nomina_previred_exportacion_nomina
  on public.nomina_previred_exportacion(id_nomina_periodo, exportado_en desc);

alter table public.catalogo_previred enable row level security;
alter table public.nomina_previred_exportacion enable row level security;

grant select on table public.catalogo_previred to authenticated;
grant select, insert on table public.nomina_previred_exportacion to authenticated;
grant usage, select on sequence public.nomina_previred_exportacion_id_previred_exportacion_seq to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'catalogo_previred'
      and policyname = 'catalogo_previred_select_authenticated'
  ) then
    create policy catalogo_previred_select_authenticated
      on public.catalogo_previred
      for select
      to authenticated
      using (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'nomina_previred_exportacion'
      and policyname = 'nomina_previred_exportacion_select_authenticated'
  ) then
    create policy nomina_previred_exportacion_select_authenticated
      on public.nomina_previred_exportacion
      for select
      to authenticated
      using (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'nomina_previred_exportacion'
      and policyname = 'nomina_previred_exportacion_insert_authenticated'
  ) then
    create policy nomina_previred_exportacion_insert_authenticated
      on public.nomina_previred_exportacion
      for insert
      to authenticated
      with check (auth.role() = 'authenticated');
  end if;
end $$;

create or replace function public.registrar_exportacion_previred(
  p_id_liquidacion_periodo bigint,
  p_id_nomina_periodo uuid default null,
  p_total_lineas integer default 0,
  p_total_trabajadores integer default 0,
  p_conceptos_sin_mapeo integer default 0,
  p_conceptos_sin_codigo integer default 0,
  p_canal text default 'csv_borrador',
  p_metadata jsonb default '{}'::jsonb
)
returns public.nomina_previred_exportacion
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_periodo public.nomina_liquidacion_periodo%rowtype;
  v_exportacion public.nomina_previred_exportacion%rowtype;
  v_usuario_id uuid;
  v_usuario_label text;
  v_canal text := coalesce(nullif(trim(p_canal), ''), 'csv_borrador');
begin
  if v_canal not in ('csv_borrador') then
    raise exception 'Canal de exportación no válido: %', v_canal;
  end if;

  v_usuario_id := auth.uid();
  v_usuario_label := coalesce(nullif(auth.jwt() ->> 'email', ''), 'Usuario no disponible en esta sesión');

  select *
  into v_periodo
  from public.nomina_liquidacion_periodo
  where id_liquidacion_periodo = p_id_liquidacion_periodo;

  if not found then
    raise exception 'Versión de liquidación no encontrada';
  end if;

  insert into public.nomina_previred_exportacion (
    id_liquidacion_periodo,
    id_nomina_periodo,
    periodo,
    version_liquidacion,
    usuario_id,
    usuario_label,
    canal,
    total_lineas,
    total_trabajadores,
    conceptos_sin_mapeo,
    conceptos_sin_codigo,
    metadata
  )
  values (
    v_periodo.id_liquidacion_periodo,
    coalesce(p_id_nomina_periodo, v_periodo.id_nomina_periodo),
    v_periodo.periodo,
    coalesce(v_periodo.version, 1),
    v_usuario_id,
    v_usuario_label,
    v_canal,
    greatest(coalesce(p_total_lineas, 0), 0),
    greatest(coalesce(p_total_trabajadores, 0), 0),
    greatest(coalesce(p_conceptos_sin_mapeo, 0), 0),
    greatest(coalesce(p_conceptos_sin_codigo, 0), 0),
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning * into v_exportacion;

  update public.nomina_liquidacion_periodo
  set
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
      'ultimaExportacionPrevired',
      jsonb_build_object(
        'idPreviredExportacion', v_exportacion.id_previred_exportacion,
        'canal', v_exportacion.canal,
        'exportadoEn', v_exportacion.exportado_en,
        'usuarioLabel', v_exportacion.usuario_label,
        'versionLiquidacion', v_exportacion.version_liquidacion,
        'totalLineas', v_exportacion.total_lineas
      )
    ),
    updated_at = now()
  where id_liquidacion_periodo = v_periodo.id_liquidacion_periodo;

  return v_exportacion;
end;
$$;

comment on function public.registrar_exportacion_previred(
  bigint, uuid, integer, integer, integer, integer, text, jsonb
) is
  'PREVIRED-01b: registra exportación borrador Previred por versión de liquidación.';

revoke all on function public.registrar_exportacion_previred(
  bigint, uuid, integer, integer, integer, integer, text, jsonb
) from public, anon;
grant execute on function public.registrar_exportacion_previred(
  bigint, uuid, integer, integer, integer, integer, text, jsonb
) to authenticated, service_role;
