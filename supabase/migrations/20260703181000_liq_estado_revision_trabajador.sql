-- NOM-LIQ-ACTA-GENERACION-UX-01: persistencia servidor estado revisión por trabajador.

alter table public.nomina_liquidacion_trabajador
  drop constraint if exists nomina_liquidacion_trabajador_estado_revision_chk;

alter table public.nomina_liquidacion_trabajador
  add column if not exists estado_revision text;

alter table public.nomina_liquidacion_trabajador
  add constraint nomina_liquidacion_trabajador_estado_revision_chk
  check (
    estado_revision is null
    or estado_revision in (
      'pendiente_autorizar',
      'autorizada',
      'pago_registrado',
      'documento_enviado',
      'rectificacion_solicitada'
    )
  );

-- RLS: permitir UPDATE a authenticated (misma política que SELECT)
do $$
begin
  execute 'grant update on table public.nomina_liquidacion_trabajador to authenticated';

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'nomina_liquidacion_trabajador'
      and policyname = 'nomina_liquidacion_update_authenticated'
  ) then
    execute $policy$
      create policy nomina_liquidacion_update_authenticated
        on public.nomina_liquidacion_trabajador
        for update
        to authenticated
        using (auth.role() = 'authenticated')
        with check (auth.role() = 'authenticated')
    $policy$;
  end if;
end $$;

create or replace function public.actualizar_estado_revision_liquidacion_trabajador(
  p_id_liquidacion_trabajador bigint,
  p_estado_revision text
)
returns public.nomina_liquidacion_trabajador
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_row public.nomina_liquidacion_trabajador%rowtype;
begin
  if p_estado_revision is not null and p_estado_revision not in (
    'pendiente_autorizar',
    'autorizada',
    'pago_registrado',
    'documento_enviado',
    'rectificacion_solicitada'
  ) then
    raise exception 'Estado de revisión no válido: %', p_estado_revision;
  end if;

  update public.nomina_liquidacion_trabajador
  set
    estado_revision = p_estado_revision,
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('estadoRevision', p_estado_revision),
    updated_at = now()
  where id_liquidacion_trabajador = p_id_liquidacion_trabajador
  returning * into v_row;

  if not found then
    raise exception 'Liquidación de trabajador no encontrada';
  end if;

  return v_row;
end;
$$;

comment on function public.actualizar_estado_revision_liquidacion_trabajador(bigint, text) is
  'NOM-LIQ-ACTA-GENERACION-UX-01: persiste estado de revisión RRHH (autorización, pago, documento).';

revoke all on function public.actualizar_estado_revision_liquidacion_trabajador(bigint, text) from public, anon;
grant execute on function public.actualizar_estado_revision_liquidacion_trabajador(bigint, text) to authenticated, service_role;
