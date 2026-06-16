-- =====================================================================
-- ERP-UI-PREF-01 — Preferencias UI estándar (evolución desde aviso UI)
-- =====================================================================
-- Reemplaza `usuario_aviso_ui` por `usuario_preferencia_ui` (clave + valor
-- JSON reutilizable en todo el ERP). Migra filas existentes si aplica.
-- =====================================================================

begin;

set local lock_timeout = '5s';
set local statement_timeout = '120s';

select pg_advisory_xact_lock(hashtext('ERP-UI-PREF-01'));


-- ---------------------------------------------------------------------
-- 1. Tabla estándar
-- ---------------------------------------------------------------------

create table if not exists public.usuario_preferencia_ui (
  id_usuario      uuid        not null references auth.users (id) on delete cascade,
  clave           text        not null,
  valor           jsonb       not null default '{"marcado": true}'::jsonb,
  actualizado_en  timestamptz not null default now(),
  constraint usuario_preferencia_ui_pkey primary key (id_usuario, clave),
  constraint usuario_preferencia_ui_clave_chk check (
    char_length(trim(clave)) > 0
    and char_length(clave) <= 128
  )
);

comment on table public.usuario_preferencia_ui is
  'Preferencias y estados UI puntuales por usuario. Clave namespaced; valor JSON flexible. ERP-UI-PREF-01.';


-- ---------------------------------------------------------------------
-- 2. Migración desde usuario_aviso_ui (si existe)
-- ---------------------------------------------------------------------

do $$
begin
  if to_regclass('public.usuario_aviso_ui') is not null then
    insert into public.usuario_preferencia_ui (id_usuario, clave, valor, actualizado_en)
    select
      a.id_usuario,
      a.clave_aviso,
      jsonb_build_object('cerrado', true),
      a.cerrado_en
    from public.usuario_aviso_ui a
    on conflict (id_usuario, clave) do nothing;

    drop table public.usuario_aviso_ui cascade;
  end if;
end;
$$;


-- ---------------------------------------------------------------------
-- 3. RLS
-- ---------------------------------------------------------------------

alter table public.usuario_preferencia_ui enable row level security;

drop policy if exists usuario_preferencia_ui_select_own on public.usuario_preferencia_ui;
create policy usuario_preferencia_ui_select_own
  on public.usuario_preferencia_ui for select to authenticated
  using (id_usuario = public.current_user_id());

drop policy if exists usuario_preferencia_ui_insert_own on public.usuario_preferencia_ui;
create policy usuario_preferencia_ui_insert_own
  on public.usuario_preferencia_ui for insert to authenticated
  with check (id_usuario = public.current_user_id());

drop policy if exists usuario_preferencia_ui_update_own on public.usuario_preferencia_ui;
create policy usuario_preferencia_ui_update_own
  on public.usuario_preferencia_ui for update to authenticated
  using (id_usuario = public.current_user_id())
  with check (id_usuario = public.current_user_id());


-- ---------------------------------------------------------------------
-- 4. Helpers y RPCs
-- ---------------------------------------------------------------------

drop function if exists public.aviso_ui_esta_cerrado(text);
drop function if exists public.cerrar_aviso_ui(text);
drop function if exists public._validar_clave_aviso_ui(text);

create or replace function public._validar_clave_preferencia_ui(p_clave text)
returns text language plpgsql immutable as $$
declare v_clave text := trim(coalesce(p_clave, ''));
begin
  if v_clave = '' then raise exception 'La clave de preferencia es obligatoria.' using errcode = '22023'; end if;
  if char_length(v_clave) > 128 then raise exception 'La clave de preferencia excede 128 caracteres.' using errcode = '22023'; end if;
  return v_clave;
end; $$;

create or replace function public.obtener_preferencia_ui(p_clave text)
returns jsonb language plpgsql stable security invoker
set search_path = public, auth as $$
declare
  v_usuario uuid := public.current_user_id();
  v_clave   text := public._validar_clave_preferencia_ui(p_clave);
  v_valor   jsonb;
begin
  if v_usuario is null then return null; end if;
  select u.valor into v_valor
  from public.usuario_preferencia_ui u
  where u.id_usuario = v_usuario and u.clave = v_clave;
  return v_valor;
end; $$;

create or replace function public.preferencia_ui_establecida(p_clave text)
returns boolean language plpgsql stable security invoker
set search_path = public, auth as $$
begin
  return public.obtener_preferencia_ui(p_clave) is not null;
end; $$;

create or replace function public.guardar_preferencia_ui(
  p_clave text,
  p_valor jsonb default '{"marcado": true}'::jsonb
)
returns void language plpgsql volatile security invoker
set search_path = public, auth as $$
declare
  v_usuario uuid := public.current_user_id();
  v_clave   text := public._validar_clave_preferencia_ui(p_clave);
  v_valor   jsonb := coalesce(p_valor, '{"marcado": true}'::jsonb);
begin
  if v_usuario is null then
    raise exception 'Sesión requerida para guardar la preferencia.' using errcode = '28000';
  end if;
  insert into public.usuario_preferencia_ui (id_usuario, clave, valor, actualizado_en)
  values (v_usuario, v_clave, v_valor, now())
  on conflict (id_usuario, clave) do update
    set valor = excluded.valor, actualizado_en = now();
end; $$;

revoke all on function public._validar_clave_preferencia_ui(text) from public;
grant execute on function public._validar_clave_preferencia_ui(text) to authenticated, service_role;
revoke all on function public.obtener_preferencia_ui(text) from public;
grant execute on function public.obtener_preferencia_ui(text) to authenticated, service_role;
revoke all on function public.preferencia_ui_establecida(text) from public;
grant execute on function public.preferencia_ui_establecida(text) to authenticated, service_role;
revoke all on function public.guardar_preferencia_ui(text, jsonb) from public;
grant execute on function public.guardar_preferencia_ui(text, jsonb) to authenticated, service_role;

commit;
