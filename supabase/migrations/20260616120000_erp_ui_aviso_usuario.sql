-- =====================================================================
-- ERP-UI-AVISO-01 — Avisos UI cerrados por usuario (coach marks puntuales)
-- =====================================================================
-- Superseded por ERP-UI-PREF-01 (migración 20260616140000). Se conserva
-- para historial de despliegues que ya aplicaron esta versión.
-- =====================================================================

begin;

set local lock_timeout = '5s';
set local statement_timeout = '120s';

select pg_advisory_xact_lock(hashtext('ERP-UI-AVISO-01'));


create table if not exists public.usuario_aviso_ui (
  id_usuario   uuid        not null references auth.users (id) on delete cascade,
  clave_aviso  text        not null,
  cerrado_en   timestamptz not null default now(),
  constraint usuario_aviso_ui_pkey primary key (id_usuario, clave_aviso),
  constraint usuario_aviso_ui_clave_chk check (
    char_length(trim(clave_aviso)) > 0
    and char_length(clave_aviso) <= 120
  )
);

alter table public.usuario_aviso_ui enable row level security;

drop policy if exists usuario_aviso_ui_select_own on public.usuario_aviso_ui;
create policy usuario_aviso_ui_select_own
  on public.usuario_aviso_ui for select to authenticated
  using (id_usuario = public.current_user_id());

drop policy if exists usuario_aviso_ui_insert_own on public.usuario_aviso_ui;
create policy usuario_aviso_ui_insert_own
  on public.usuario_aviso_ui for insert to authenticated
  with check (id_usuario = public.current_user_id());


create or replace function public._validar_clave_aviso_ui(p_clave text)
returns text language plpgsql immutable as $$
declare v_clave text := trim(coalesce(p_clave, ''));
begin
  if v_clave = '' then raise exception 'La clave del aviso es obligatoria.' using errcode = '22023'; end if;
  if char_length(v_clave) > 120 then raise exception 'La clave del aviso excede 120 caracteres.' using errcode = '22023'; end if;
  return v_clave;
end; $$;

create or replace function public.aviso_ui_esta_cerrado(p_clave text)
returns boolean language plpgsql stable security invoker
set search_path = public, auth as $$
declare v_usuario uuid := public.current_user_id(); v_clave text := public._validar_clave_aviso_ui(p_clave);
begin
  if v_usuario is null then return false; end if;
  return exists (select 1 from public.usuario_aviso_ui u where u.id_usuario = v_usuario and u.clave_aviso = v_clave);
end; $$;

create or replace function public.cerrar_aviso_ui(p_clave text)
returns void language plpgsql volatile security invoker
set search_path = public, auth as $$
declare v_usuario uuid := public.current_user_id(); v_clave text := public._validar_clave_aviso_ui(p_clave);
begin
  if v_usuario is null then raise exception 'Sesión requerida para cerrar el aviso.' using errcode = '28000'; end if;
  insert into public.usuario_aviso_ui (id_usuario, clave_aviso) values (v_usuario, v_clave)
  on conflict (id_usuario, clave_aviso) do nothing;
end; $$;

revoke all on function public._validar_clave_aviso_ui(text) from public;
grant execute on function public._validar_clave_aviso_ui(text) to authenticated, service_role;
revoke all on function public.aviso_ui_esta_cerrado(text) from public;
grant execute on function public.aviso_ui_esta_cerrado(text) to authenticated, service_role;
revoke all on function public.cerrar_aviso_ui(text) from public;
grant execute on function public.cerrar_aviso_ui(text) to authenticated, service_role;

commit;
