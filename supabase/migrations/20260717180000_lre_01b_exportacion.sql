-- LRE-01b: auditoría de exportación LRE + canal formato DT v1.

create table if not exists public.nomina_lre_exportacion (
  id_lre_exportacion bigserial primary key,
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
  conceptos_sin_codigo integer not null default 0,
  exportado_en timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  constraint nomina_lre_exportacion_canal_chk check (
    canal in ('csv_borrador', 'formato_dt_v1')
  )
);

create index if not exists idx_nomina_lre_exportacion_periodo
  on public.nomina_lre_exportacion(id_liquidacion_periodo, exportado_en desc);

create index if not exists idx_nomina_lre_exportacion_nomina
  on public.nomina_lre_exportacion(id_nomina_periodo, exportado_en desc);

comment on table public.nomina_lre_exportacion is
  'LRE-01b: historial de exportación del Libro de Remuneraciones Electrónico por versión de liquidación.';

alter table public.nomina_lre_exportacion enable row level security;

grant select, insert on table public.nomina_lre_exportacion to authenticated;
grant usage, select on sequence public.nomina_lre_exportacion_id_lre_exportacion_seq to authenticated;

revoke all on table public.nomina_lre_exportacion from anon, public;

drop policy if exists nomina_lre_exportacion_select_tenant on public.nomina_lre_exportacion;
drop policy if exists nomina_lre_exportacion_insert_tenant on public.nomina_lre_exportacion;

create policy nomina_lre_exportacion_select_tenant on public.nomina_lre_exportacion
  for select to authenticated
  using (
    public.sec_nomina_periodo_uuid_tenant_ok(id_nomina_periodo)
    or public.sec_liquidacion_periodo_tenant_ok(id_liquidacion_periodo)
  );

create policy nomina_lre_exportacion_insert_tenant on public.nomina_lre_exportacion
  for insert to authenticated
  with check (
    public.sec_nomina_periodo_uuid_tenant_ok(id_nomina_periodo)
    or public.sec_liquidacion_periodo_tenant_ok(id_liquidacion_periodo)
  );

create or replace function public.registrar_exportacion_lre(
  p_id_liquidacion_periodo bigint,
  p_id_nomina_periodo uuid default null,
  p_total_lineas integer default 0,
  p_total_trabajadores integer default 0,
  p_conceptos_sin_codigo integer default 0,
  p_canal text default 'csv_borrador',
  p_metadata jsonb default '{}'::jsonb
)
returns public.nomina_lre_exportacion
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_periodo public.nomina_liquidacion_periodo%rowtype;
  v_exportacion public.nomina_lre_exportacion%rowtype;
  v_usuario_id uuid;
  v_usuario_label text;
  v_canal text := coalesce(nullif(trim(p_canal), ''), 'csv_borrador');
begin
  if v_canal not in ('csv_borrador', 'formato_dt_v1') then
    raise exception 'Canal de exportación LRE no válido: %', v_canal;
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

  insert into public.nomina_lre_exportacion (
    id_liquidacion_periodo,
    id_nomina_periodo,
    periodo,
    version_liquidacion,
    usuario_id,
    usuario_label,
    canal,
    total_lineas,
    total_trabajadores,
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
    greatest(coalesce(p_conceptos_sin_codigo, 0), 0),
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning * into v_exportacion;

  update public.nomina_liquidacion_periodo
  set
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
      'ultimaExportacionLre',
      jsonb_build_object(
        'idLreExportacion', v_exportacion.id_lre_exportacion,
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

comment on function public.registrar_exportacion_lre(
  bigint, uuid, integer, integer, integer, text, jsonb
) is
  'LRE-01b: registra exportación CSV borrador o formato DT v1 por versión de liquidación.';

revoke all on function public.registrar_exportacion_lre(
  bigint, uuid, integer, integer, integer, text, jsonb
) from public, anon;
grant execute on function public.registrar_exportacion_lre(
  bigint, uuid, integer, integer, integer, text, jsonb
) to authenticated, service_role;
