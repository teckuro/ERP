-- =====================================================================
-- NOM-ADMIN-OPS-F03b - Aprovisionamiento de id_empresa en JWT
-- =====================================================================
-- Migración correctiva tras F02 ("estricto total"). En F02 endurecimos
-- public.current_user_empresa_id() para leer id_empresa exclusivamente
-- del JWT (auth.jwt() -> app_metadata / user_metadata). Si el usuario
-- autenticado no trae el claim, la función devuelve NULL y toda policy
-- de la forma `id_empresa = current_user_empresa_id()` bloquea INSERT,
-- UPDATE y SELECT.
--
-- Detectado en runtime al crear plantillas de ciclo (F03):
--   new row violates row-level security policy for table "nomina_plantilla_ciclo"
--
-- Diagnóstico:
--   auth.users.raw_app_meta_data del usuario único no contenía id_empresa.
--   public.empresa tiene exactamente una fila (id_empresa = 1).
--
-- Alcance
--   1. Backfill puntual sobre auth.users: solo cuando hay exactamente una
--      empresa en public.empresa y el usuario no trae id_empresa ni en
--      app_metadata ni en user_metadata.
--   2. Trigger BEFORE INSERT en auth.users que aplica la misma regla a
--      futuros usuarios mientras la BD mantenga una sola empresa. Cuando
--      el modelo evolucione a multi-empresa real, este trigger queda
--      inerte (no aplica si existen 2+ empresas) y el aprovisionamiento
--      deberá hacerse desde el flujo de invitación/onboarding.
--
-- No toca current_user_empresa_id() ni las policies RLS.
-- Idempotente; reversible con drop trigger + drop function.
-- =====================================================================

begin;

set local lock_timeout = '5s';
set local statement_timeout = '120s';

select pg_advisory_xact_lock(hashtext('NOM-ADMIN-OPS-F03b'));

-- ---------------------------------------------------------------------
-- 1. Backfill puntual (idempotente)
-- ---------------------------------------------------------------------
do $$
declare
  v_cantidad_empresas integer;
  v_unica_empresa_id  integer;
  v_filas_actualizadas integer;
begin
  select count(*) into v_cantidad_empresas from public.empresa;

  if v_cantidad_empresas <> 1 then
    raise notice 'F03b backfill omitido: hay % empresa(s) en public.empresa (se requiere exactamente 1).', v_cantidad_empresas;
    return;
  end if;

  select id_empresa into v_unica_empresa_id from public.empresa limit 1;

  update auth.users
     set raw_app_meta_data = jsonb_set(
       coalesce(raw_app_meta_data, '{}'::jsonb),
       '{id_empresa}',
       to_jsonb(v_unica_empresa_id),
       true
     )
   where coalesce(raw_app_meta_data ->> 'id_empresa', '') = ''
     and coalesce(raw_user_meta_data ->> 'id_empresa', '') = '';

  get diagnostics v_filas_actualizadas = row_count;
  raise notice 'F03b backfill: % usuario(s) actualizados con id_empresa=%.', v_filas_actualizadas, v_unica_empresa_id;
end
$$;

-- ---------------------------------------------------------------------
-- 2. Trigger BEFORE INSERT sobre auth.users
-- ---------------------------------------------------------------------
create or replace function public.tg_seed_id_empresa_jwt()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $function$
declare
  v_cantidad_empresas integer;
  v_unica_empresa_id  integer;
begin
  -- Solo aplica cuando hay exactamente una empresa registrada.
  -- En cuanto haya multi-empresa real, el flujo de invitación deberá
  -- setear id_empresa explícito y este trigger queda inerte.
  select count(*) into v_cantidad_empresas from public.empresa;
  if v_cantidad_empresas <> 1 then
    return new;
  end if;

  -- No sobreescribir si el caller ya envió id_empresa.
  if coalesce(new.raw_app_meta_data ->> 'id_empresa', '') <> '' then
    return new;
  end if;
  if coalesce(new.raw_user_meta_data ->> 'id_empresa', '') <> '' then
    return new;
  end if;

  select id_empresa into v_unica_empresa_id from public.empresa limit 1;

  new.raw_app_meta_data := jsonb_set(
    coalesce(new.raw_app_meta_data, '{}'::jsonb),
    '{id_empresa}',
    to_jsonb(v_unica_empresa_id),
    true
  );

  return new;
end;
$function$;

comment on function public.tg_seed_id_empresa_jwt() is
  'F03b: seed app_metadata.id_empresa cuando hay exactamente una empresa y el caller no trajo el claim. Queda inerte ante multi-empresa.';

drop trigger if exists tg_auth_users_seed_id_empresa on auth.users;
create trigger tg_auth_users_seed_id_empresa
  before insert on auth.users
  for each row execute function public.tg_seed_id_empresa_jwt();

commit;
