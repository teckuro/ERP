-- LIQ-AUDIT-01: auditoría RRHH por trabajador (autorizar, pago, entrega, rectificación).

set search_path = public;

-- ---------------------------------------------------------------------------
-- Helper: etiqueta del usuario de la sesión actual (nombre completo preferido)
-- ---------------------------------------------------------------------------

create or replace function public.erp_usuario_sesion_label()
returns text
language sql
stable
security definer
set search_path = public, auth
as $$
  select coalesce(
    (
      select coalesce(
        nullif(trim(u.raw_user_meta_data ->> 'nombre'), ''),
        nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''),
        nullif(trim(u.raw_user_meta_data ->> 'name'), ''),
        nullif(trim(u.raw_user_meta_data ->> 'display_name'), ''),
        nullif(trim(u.email), '')
      )
      from auth.users u
      where u.id = public.current_user_id()
    ),
    nullif(trim(auth.jwt() ->> 'email'), ''),
    'Usuario no disponible en esta sesión'
  );
$$;

comment on function public.erp_usuario_sesion_label() is
  'LIQ-AUDIT-01: nombre legible del usuario autenticado para auditoría de liquidaciones.';

revoke all on function public.erp_usuario_sesion_label() from public, anon;
grant execute on function public.erp_usuario_sesion_label() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Tabla append-only de eventos de revisión RRHH
-- ---------------------------------------------------------------------------

create table if not exists public.nomina_liquidacion_revision_evento (
  id_liquidacion_revision_evento bigserial primary key,
  id_liquidacion_trabajador bigint not null
    references public.nomina_liquidacion_trabajador(id_liquidacion_trabajador) on delete cascade,
  id_liquidacion_periodo bigint not null
    references public.nomina_liquidacion_periodo(id_liquidacion_periodo) on delete cascade,
  accion text not null,
  estado_previo text null,
  estado_nuevo text not null,
  usuario_id uuid null,
  usuario_label text not null,
  registrado_en timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  constraint nomina_liquidacion_revision_evento_accion_chk check (
    accion in ('autorizar', 'registrar_pago', 'enviar_documento', 'solicitar_rectificacion')
  ),
  constraint nomina_liquidacion_revision_evento_estado_nuevo_chk check (
    estado_nuevo in (
      'pendiente_autorizar',
      'autorizada',
      'pago_registrado',
      'documento_enviado',
      'rectificacion_solicitada'
    )
  )
);

create index if not exists idx_nomina_liquidacion_revision_evento_trabajador
  on public.nomina_liquidacion_revision_evento(id_liquidacion_trabajador, registrado_en desc);

create index if not exists idx_nomina_liquidacion_revision_evento_periodo
  on public.nomina_liquidacion_revision_evento(id_liquidacion_periodo, registrado_en desc);

alter table public.nomina_liquidacion_revision_evento enable row level security;

grant select, insert on table public.nomina_liquidacion_revision_evento to authenticated;

do $$
declare
  v_seq text;
begin
  select pg_get_serial_sequence(
    'public.nomina_liquidacion_revision_evento',
    'id_liquidacion_revision_evento'
  )
  into v_seq;

  if v_seq is not null then
    execute format('grant usage, select on sequence %s to authenticated', v_seq);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'nomina_liquidacion_revision_evento'
      and policyname = 'nomina_liquidacion_revision_evento_select_tenant'
  ) then
    create policy nomina_liquidacion_revision_evento_select_tenant
      on public.nomina_liquidacion_revision_evento
      for select
      to authenticated
      using (public.sec_liquidacion_periodo_tenant_ok(id_liquidacion_periodo));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'nomina_liquidacion_revision_evento'
      and policyname = 'nomina_liquidacion_revision_evento_insert_tenant'
  ) then
    create policy nomina_liquidacion_revision_evento_insert_tenant
      on public.nomina_liquidacion_revision_evento
      for insert
      to authenticated
      with check (public.sec_liquidacion_periodo_tenant_ok(id_liquidacion_periodo));
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- RPC: actualizar estado revisión con auditoría en servidor
-- ---------------------------------------------------------------------------

drop function if exists public.actualizar_estado_revision_liquidacion_trabajador(bigint, text);

create or replace function public.actualizar_estado_revision_liquidacion_trabajador(
  p_id_liquidacion_trabajador bigint,
  p_estado_revision text,
  p_accion text default null
)
returns public.nomina_liquidacion_trabajador
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_row public.nomina_liquidacion_trabajador%rowtype;
  v_estado_previo text;
  v_usuario_id uuid;
  v_usuario_label text;
  v_registrado_en timestamptz := now();
  v_actor jsonb;
  v_metadata_patch jsonb := '{}'::jsonb;
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

  if p_accion is not null and p_accion not in (
    'autorizar',
    'registrar_pago',
    'enviar_documento',
    'solicitar_rectificacion'
  ) then
    raise exception 'Acción de revisión no válida: %', p_accion;
  end if;

  select *
  into v_row
  from public.nomina_liquidacion_trabajador
  where id_liquidacion_trabajador = p_id_liquidacion_trabajador
  for update;

  if not found then
    raise exception 'Liquidación de trabajador no encontrada';
  end if;

  v_estado_previo := coalesce(
    v_row.estado_revision,
    nullif(v_row.metadata ->> 'estadoRevision', ''),
    'pendiente_autorizar'
  );

  if p_accion is not null then
    if p_accion = 'autorizar'
      and not (v_estado_previo = 'pendiente_autorizar' and p_estado_revision = 'autorizada') then
      raise exception 'Transición no válida para autorizar: % -> %', v_estado_previo, p_estado_revision;
    elsif p_accion = 'registrar_pago'
      and not (v_estado_previo = 'autorizada' and p_estado_revision = 'pago_registrado') then
      raise exception 'Transición no válida para registrar pago: % -> %', v_estado_previo, p_estado_revision;
    elsif p_accion = 'enviar_documento'
      and not (v_estado_previo = 'pago_registrado' and p_estado_revision = 'documento_enviado') then
      raise exception 'Transición no válida para marcar entregado: % -> %', v_estado_previo, p_estado_revision;
    elsif p_accion = 'solicitar_rectificacion'
      and not (
        p_estado_revision = 'rectificacion_solicitada'
        and v_estado_previo in ('autorizada', 'pago_registrado', 'documento_enviado')
      ) then
      raise exception 'Transición no válida para solicitar rectificación: % -> %', v_estado_previo, p_estado_revision;
    end if;

    v_usuario_id := public.current_user_id();
    v_usuario_label := public.erp_usuario_sesion_label();

    v_actor := jsonb_build_object(
      'usuarioId', v_usuario_id,
      'usuarioNombre', v_usuario_label,
      'registradoEn', v_registrado_en
    );

    insert into public.nomina_liquidacion_revision_evento (
      id_liquidacion_trabajador,
      id_liquidacion_periodo,
      accion,
      estado_previo,
      estado_nuevo,
      usuario_id,
      usuario_label,
      registrado_en
    )
    values (
      v_row.id_liquidacion_trabajador,
      v_row.id_liquidacion_periodo,
      p_accion,
      v_estado_previo,
      p_estado_revision,
      v_usuario_id,
      v_usuario_label,
      v_registrado_en
    );

    if p_accion = 'autorizar' then
      v_metadata_patch := v_metadata_patch || jsonb_build_object(
        'autorizacion', v_actor,
        'autorizadoPor', v_usuario_label
      );
    elsif p_accion = 'registrar_pago' then
      v_metadata_patch := v_metadata_patch || jsonb_build_object('pago', v_actor);
    elsif p_accion = 'enviar_documento' then
      v_metadata_patch := v_metadata_patch || jsonb_build_object('documentoEntrega', v_actor);
    elsif p_accion = 'solicitar_rectificacion' then
      v_metadata_patch := v_metadata_patch || jsonb_build_object('rectificacionSolicitada', v_actor);
    end if;
  end if;

  update public.nomina_liquidacion_trabajador
  set
    estado_revision = p_estado_revision,
    metadata = coalesce(metadata, '{}'::jsonb)
      || jsonb_build_object('estadoRevision', p_estado_revision)
      || v_metadata_patch,
    updated_at = now()
  where id_liquidacion_trabajador = p_id_liquidacion_trabajador
  returning * into v_row;

  return v_row;
end;
$$;

comment on function public.actualizar_estado_revision_liquidacion_trabajador(bigint, text, text) is
  'LIQ-AUDIT-01: persiste estado de revisión RRHH con actor resuelto en servidor y evento append-only.';

revoke all on function public.actualizar_estado_revision_liquidacion_trabajador(bigint, text, text) from public, anon;
grant execute on function public.actualizar_estado_revision_liquidacion_trabajador(bigint, text, text) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Mejorar emisión PDF: nombre completo del actor
-- ---------------------------------------------------------------------------

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

  v_usuario_id := public.current_user_id();
  v_usuario_label := public.erp_usuario_sesion_label();

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
  'LIQ-01b + LIQ-AUDIT-01: emisión formal con nombre legible del usuario en servidor.';

revoke all on function public.emitir_liquidacion_trabajador(bigint, text, jsonb) from public, anon;
grant execute on function public.emitir_liquidacion_trabajador(bigint, text, jsonb) to authenticated, service_role;
