-- CIE-REO-04: al reabrir una nómina, invalidar liquidaciones internas activas
-- y dejar trazabilidad en metadata + auditoría de auditoría vía caller.

create or replace function public.invalidar_liquidaciones_por_reapertura(
  p_id_nomina_periodo uuid,
  p_motivo text default null
)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_nomina public.nomina_periodo%rowtype;
  v_count integer := 0;
  v_motivo text := nullif(trim(coalesce(p_motivo, '')), '');
begin
  if not public.erp_nomina_permiso_efectivo('nomina.reabrir') then
    raise exception 'No tienes permiso para reabrir nóminas';
  end if;

  select *
  into v_nomina
  from public.nomina_periodo np
  where np.id = p_id_nomina_periodo
  for update;

  if not found then
    raise exception 'Nómina no encontrada';
  end if;

  update public.nomina_liquidacion_periodo l
  set
    activo = false,
    estado = case
      when l.estado in ('generada', 'emitida', 'publicada') then 'anulada'
      else l.estado
    end,
    metadata = coalesce(l.metadata, '{}'::jsonb) || jsonb_build_object(
      'invalidada_por_reapertura', true,
      'invalidada_at', now(),
      'motivo_reapertura', coalesce(v_motivo, 'Reapertura de nómina')
    ),
    updated_at = now()
  where l.id_nomina_periodo = p_id_nomina_periodo
    and l.activo = true;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

comment on function public.invalidar_liquidaciones_por_reapertura(uuid, text) is
  'CIE-REO-04: marca liquidaciones internas activas como no vigentes al reabrir la nómina.';

revoke all on function public.invalidar_liquidaciones_por_reapertura(uuid, text) from public, anon;
grant execute on function public.invalidar_liquidaciones_por_reapertura(uuid, text) to authenticated, service_role;
