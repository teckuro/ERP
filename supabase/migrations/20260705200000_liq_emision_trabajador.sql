-- LIQ-01b: auditoría de emisión formal por trabajador (vista / impresión).

create table if not exists public.nomina_liquidacion_emision (
  id_liquidacion_emision bigserial primary key,
  id_liquidacion_trabajador bigint not null
    references public.nomina_liquidacion_trabajador(id_liquidacion_trabajador) on delete cascade,
  id_liquidacion_periodo bigint not null
    references public.nomina_liquidacion_periodo(id_liquidacion_periodo) on delete cascade,
  version_liquidacion integer not null default 1,
  usuario_id uuid null,
  usuario_label text not null,
  canal text not null default 'vista_oficial',
  emitido_en timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  constraint nomina_liquidacion_emision_canal_chk check (
    canal in ('vista_oficial', 'impresion_navegador')
  )
);

create index if not exists idx_nomina_liquidacion_emision_trabajador
  on public.nomina_liquidacion_emision(id_liquidacion_trabajador, emitido_en desc);

create index if not exists idx_nomina_liquidacion_emision_periodo
  on public.nomina_liquidacion_emision(id_liquidacion_periodo, emitido_en desc);

alter table public.nomina_liquidacion_emision enable row level security;

grant select, insert on table public.nomina_liquidacion_emision to authenticated;
grant usage, select on sequence public.nomina_liquidacion_emision_id_liquidacion_emision_seq to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'nomina_liquidacion_emision'
      and policyname = 'nomina_liquidacion_emision_select_authenticated'
  ) then
    create policy nomina_liquidacion_emision_select_authenticated
      on public.nomina_liquidacion_emision
      for select
      to authenticated
      using (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'nomina_liquidacion_emision'
      and policyname = 'nomina_liquidacion_emision_insert_authenticated'
  ) then
    create policy nomina_liquidacion_emision_insert_authenticated
      on public.nomina_liquidacion_emision
      for insert
      to authenticated
      with check (auth.role() = 'authenticated');
  end if;
end $$;

create or replace function public.emitir_liquidacion_trabajador(
  p_id_liquidacion_trabajador bigint,
  p_canal text default 'vista_oficial',
  p_metadata jsonb default '{}'::jsonb
)
returns public.nomina_liquidacion_emision
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_trabajador public.nomina_liquidacion_trabajador%rowtype;
  v_periodo public.nomina_liquidacion_periodo%rowtype;
  v_emision public.nomina_liquidacion_emision%rowtype;
  v_usuario_id uuid;
  v_usuario_label text;
  v_canal text := coalesce(nullif(trim(p_canal), ''), 'vista_oficial');
begin
  if v_canal not in ('vista_oficial', 'impresion_navegador') then
    raise exception 'Canal de emisión no válido: %', v_canal;
  end if;

  v_usuario_id := auth.uid();
  v_usuario_label := coalesce(nullif(auth.jwt() ->> 'email', ''), 'Usuario no disponible en esta sesión');

  select *
  into v_trabajador
  from public.nomina_liquidacion_trabajador
  where id_liquidacion_trabajador = p_id_liquidacion_trabajador;

  if not found then
    raise exception 'Liquidación de trabajador no encontrada';
  end if;

  select *
  into v_periodo
  from public.nomina_liquidacion_periodo
  where id_liquidacion_periodo = v_trabajador.id_liquidacion_periodo;

  if not found then
    raise exception 'Versión de liquidación no encontrada';
  end if;

  insert into public.nomina_liquidacion_emision (
    id_liquidacion_trabajador,
    id_liquidacion_periodo,
    version_liquidacion,
    usuario_id,
    usuario_label,
    canal,
    metadata
  )
  values (
    v_trabajador.id_liquidacion_trabajador,
    v_periodo.id_liquidacion_periodo,
    v_periodo.version,
    v_usuario_id,
    v_usuario_label,
    v_canal,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning * into v_emision;

  update public.nomina_liquidacion_trabajador
  set
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
      'ultimaEmision',
      jsonb_build_object(
        'idLiquidacionEmision', v_emision.id_liquidacion_emision,
        'canal', v_emision.canal,
        'emitidoEn', v_emision.emitido_en,
        'usuarioLabel', v_emision.usuario_label,
        'versionLiquidacion', v_emision.version_liquidacion
      )
    ),
    updated_at = now()
  where id_liquidacion_trabajador = v_trabajador.id_liquidacion_trabajador;

  return v_emision;
end;
$$;

comment on function public.emitir_liquidacion_trabajador(bigint, text, jsonb) is
  'LIQ-01b: registra emisión formal de liquidación por trabajador (vista oficial o impresión).';

revoke all on function public.emitir_liquidacion_trabajador(bigint, text, jsonb) from public, anon;
grant execute on function public.emitir_liquidacion_trabajador(bigint, text, jsonb) to authenticated, service_role;
