-- PREVIRED-02b/d: campo archivo 105 posiciones + canal oficial.

alter table public.catalogo_previred
  add column if not exists campo_archivo smallint null;

comment on column public.catalogo_previred.campo_archivo is
  'Campo numérico (1-105) del archivo Previred largo fijo por posición.';

update public.catalogo_previred cp
set campo_archivo = v.campo
from (
  values
    ('3141', 28),
    ('3151', 101),
    ('4151', 102),
    ('4155', 29),
    ('2311', 22)
) as v(codigo_lre, campo)
where cp.codigo_lre = v.codigo_lre;

alter table public.nomina_previred_exportacion
  drop constraint if exists nomina_previred_exportacion_canal_chk;

alter table public.nomina_previred_exportacion
  add constraint nomina_previred_exportacion_canal_chk check (
    canal in ('csv_borrador', 'archivo_oficial_rem_v1', 'archivo_oficial_105_posicion')
  );

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
  if v_canal not in ('csv_borrador', 'archivo_oficial_rem_v1', 'archivo_oficial_105_posicion') then
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
