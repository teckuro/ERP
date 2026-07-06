-- =====================================================================
-- NOM-ADMIN-OPS-F02 - Cimientos de auditoría y RLS multi-tenant
-- =====================================================================
-- Fase F02 del roadmap docs/codex/modulos/nomina-mensual/roadmap-admin-generador-operativo-100.md.
-- Depende de F01 (20260611210000_nomina_f01_cimientos_canonicos.sql).
--
-- Objetivo
--   Formalizar la auditoría base y el aislamiento multi-tenant que protegen
--   toda operación posterior, sin entrar todavía en permisos por comando
--   crítico (eso va en F15b).
--
-- Cambios
--   1. Helper `public.current_user_id()` (wrapper estable sobre auth.uid()).
--   2. Endurecimiento de `public.current_user_empresa_id()`: quita el fallback
--      a la primera empresa. Sin id_empresa en JWT -> NULL -> RLS bloquea.
--   3. Políticas RLS por empresa para `nomina_plantilla_ciclo` y
--      `nomina_consolidacion` (gap silencioso de F01: RLS enabled sin policies).
--   4. Extensión aditiva de `evento_auditoria_nomina` con columnas
--      `estado_previo`, `estado_nuevo`, `version_estado_esperada`,
--      `version_estado_resultante`.
--   5. Helper `public.registrar_evento_auditoria_nomina(...)` SECURITY DEFINER,
--      reutilizable desde cualquier RPC futura. La auditoría usa auth.uid(),
--      nunca un usuarioId enviado por el cliente.
--   6. Actualización del trigger `tg_audit_nomina_periodo` para poblar las
--      columnas nuevas y consumir el helper.
-- =====================================================================

begin;

set local lock_timeout = '5s';
set local statement_timeout = '120s';

select pg_advisory_xact_lock(hashtext('NOM-ADMIN-OPS-F02'));


-- ---------------------------------------------------------------------
-- 1. Helpers de identidad
-- ---------------------------------------------------------------------

create or replace function public.current_user_id()
returns uuid
language sql
stable
security invoker
set search_path = public, auth
as $$
  select auth.uid()
$$;

comment on function public.current_user_id() is
  'Identidad del usuario autenticado. Wrapper estable sobre auth.uid() para facilitar testeo y reutilización desde funciones SQL/RPC. Retorna NULL si no hay sesión. NOM-ADMIN-OPS-F02.';

revoke all on function public.current_user_id() from public;
grant execute on function public.current_user_id() to authenticated, anon, service_role;


-- A partir de F02 quitamos el fallback laxo (devolver la primera empresa
-- cuando el JWT no trae id_empresa). Una sesión sin id_empresa válido
-- devuelve NULL y todas las políticas RLS por empresa lo bloquean.
create or replace function public.current_user_empresa_id()
returns integer
language sql
stable
security invoker
set search_path = public, auth
as $$
  select coalesce(
    nullif((auth.jwt() -> 'app_metadata' ->> 'id_empresa'), '')::integer,
    nullif((auth.jwt() -> 'user_metadata' ->> 'id_empresa'), '')::integer
  )
$$;

comment on function public.current_user_empresa_id() is
  'Resuelve la empresa activa desde JWT (app_metadata.id_empresa o user_metadata.id_empresa). Sin fallback a partir de F02 (NOM-ADMIN-OPS-F02): si el JWT no trae id_empresa, retorna NULL y RLS bloquea el acceso.';

revoke all on function public.current_user_empresa_id() from public;
grant execute on function public.current_user_empresa_id() to authenticated, anon, service_role;


-- ---------------------------------------------------------------------
-- 2. RLS para tablas nuevas de F01 (corrige gap silencioso)
-- ---------------------------------------------------------------------

-- nomina_plantilla_ciclo
drop policy if exists nomina_plantilla_ciclo_select on public.nomina_plantilla_ciclo;
create policy nomina_plantilla_ciclo_select on public.nomina_plantilla_ciclo
  for select to authenticated
  using (id_empresa = public.current_user_empresa_id());

drop policy if exists nomina_plantilla_ciclo_insert on public.nomina_plantilla_ciclo;
create policy nomina_plantilla_ciclo_insert on public.nomina_plantilla_ciclo
  for insert to authenticated
  with check (id_empresa = public.current_user_empresa_id());

drop policy if exists nomina_plantilla_ciclo_update on public.nomina_plantilla_ciclo;
create policy nomina_plantilla_ciclo_update on public.nomina_plantilla_ciclo
  for update to authenticated
  using (id_empresa = public.current_user_empresa_id())
  with check (id_empresa = public.current_user_empresa_id());

-- Plantillas activas no se eliminan: solo se desactivan (`activo = false`).
drop policy if exists nomina_plantilla_ciclo_delete on public.nomina_plantilla_ciclo;
create policy nomina_plantilla_ciclo_delete on public.nomina_plantilla_ciclo
  for delete to authenticated
  using (
    id_empresa = public.current_user_empresa_id()
    and activo = false
  );

grant select, insert, update, delete on public.nomina_plantilla_ciclo to authenticated;


-- nomina_consolidacion
drop policy if exists nomina_consolidacion_select on public.nomina_consolidacion;
create policy nomina_consolidacion_select on public.nomina_consolidacion
  for select to authenticated
  using (id_empresa = public.current_user_empresa_id());

drop policy if exists nomina_consolidacion_insert on public.nomina_consolidacion;
create policy nomina_consolidacion_insert on public.nomina_consolidacion
  for insert to authenticated
  with check (id_empresa = public.current_user_empresa_id());

drop policy if exists nomina_consolidacion_update on public.nomina_consolidacion;
create policy nomina_consolidacion_update on public.nomina_consolidacion
  for update to authenticated
  using (id_empresa = public.current_user_empresa_id())
  with check (id_empresa = public.current_user_empresa_id());

-- Solo se borran consolidaciones pendientes; una aplicada o anulada conserva evidencia.
drop policy if exists nomina_consolidacion_delete on public.nomina_consolidacion;
create policy nomina_consolidacion_delete on public.nomina_consolidacion
  for delete to authenticated
  using (
    id_empresa = public.current_user_empresa_id()
    and estado = 'pendiente'
  );

grant select, insert, update, delete on public.nomina_consolidacion to authenticated;


-- ---------------------------------------------------------------------
-- 3. Extensión aditiva de evento_auditoria_nomina
-- ---------------------------------------------------------------------

alter table public.evento_auditoria_nomina
  add column if not exists estado_previo text,
  add column if not exists estado_nuevo text,
  add column if not exists version_estado_esperada integer,
  add column if not exists version_estado_resultante integer;

comment on column public.evento_auditoria_nomina.estado_previo is
  'Estado de la nómina antes de la acción. NULL si no aplica (p. ej. acción `creada`). NOM-ADMIN-OPS-F02.';
comment on column public.evento_auditoria_nomina.estado_nuevo is
  'Estado de la nómina después de la acción. NULL si la acción no transita estado. NOM-ADMIN-OPS-F02.';
comment on column public.evento_auditoria_nomina.version_estado_esperada is
  'Versión de estado esperada antes de aplicar la acción (control optimista). NOM-ADMIN-OPS-F02.';
comment on column public.evento_auditoria_nomina.version_estado_resultante is
  'Versión de estado resultante después de aplicar la acción. NOM-ADMIN-OPS-F02.';


-- ---------------------------------------------------------------------
-- 4. registrar_evento_auditoria_nomina(): helper reutilizable
-- ---------------------------------------------------------------------

drop function if exists public.registrar_evento_auditoria_nomina(
  uuid, text, text, text, text, integer, integer, jsonb
);

create or replace function public.registrar_evento_auditoria_nomina(
  p_id_nomina_periodo uuid,
  p_accion text,
  p_motivo text default null,
  p_estado_previo text default null,
  p_estado_nuevo text default null,
  p_version_estado_esperada integer default null,
  p_version_estado_resultante integer default null,
  p_payload jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_event_id uuid;
  v_user uuid;
begin
  v_user := public.current_user_id();

  insert into public.evento_auditoria_nomina (
    id_nomina_periodo,
    accion,
    id_usuario,
    motivo,
    estado_previo,
    estado_nuevo,
    version_estado_esperada,
    version_estado_resultante,
    payload
  ) values (
    p_id_nomina_periodo,
    p_accion,
    v_user,
    p_motivo,
    p_estado_previo,
    p_estado_nuevo,
    p_version_estado_esperada,
    p_version_estado_resultante,
    p_payload
  )
  returning id into v_event_id;

  return v_event_id;
end;
$$;

comment on function public.registrar_evento_auditoria_nomina(
  uuid, text, text, text, text, integer, integer, jsonb
) is
  'Registra un evento de auditoría de nómina. El actor se resuelve en servidor (current_user_id()): el cliente no puede falsificarlo. security definer para uso desde RPC sin romper RLS. NOM-ADMIN-OPS-F02.';

revoke all on function public.registrar_evento_auditoria_nomina(
  uuid, text, text, text, text, integer, integer, jsonb
) from public;
grant execute on function public.registrar_evento_auditoria_nomina(
  uuid, text, text, text, text, integer, integer, jsonb
) to authenticated, service_role;


-- ---------------------------------------------------------------------
-- 5. Trigger tg_audit_nomina_periodo: pobla columnas nuevas
-- ---------------------------------------------------------------------

create or replace function public.tg_audit_nomina_periodo()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user uuid;
begin
  v_user := public.current_user_id();

  if tg_op = 'INSERT' then
    insert into public.evento_auditoria_nomina (
      id_nomina_periodo,
      accion,
      id_usuario,
      estado_nuevo,
      version_estado_resultante
    )
    values (
      new.id,
      'creada',
      v_user,
      new.estado,
      new.version_estado
    );

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
        id_usuario,
        estado_previo,
        estado_nuevo,
        version_estado_esperada,
        version_estado_resultante
      )
      values (
        new.id,
        new.estado,
        v_user,
        old.estado,
        new.estado,
        old.version_estado,
        new.version_estado
      );
    end if;
  end if;

  return new;
end;
$$;


commit;
