-- =============================================================================
-- SEC-02c (AUDIT-SEC-2026-07) — revoke EXECUTE anon/public en funciones public
--
-- anon hereda EXECUTE vía rol PUBLIC en muchas RPC legacy. El ERP usa JWT
-- authenticated; service_role queda para Edge/backend.
-- =============================================================================

begin;

set local lock_timeout = '5s';
set local statement_timeout = '120s';

select pg_advisory_xact_lock(hashtext('SEC-02c-revoke-anon-rpc'));

set search_path = public;

revoke execute on all functions in schema public from public;
revoke execute on all functions in schema public from anon;

grant execute on all functions in schema public to authenticated;
grant execute on all functions in schema public to service_role;

do $$
declare
  v_anon_exec bigint;
begin
  select count(*) into v_anon_exec
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.prokind = 'f'
    and has_function_privilege('anon', p.oid, 'EXECUTE')
    and p.proname not in ('unaccent', 'unaccent_init', 'unaccent_lexize');

  if v_anon_exec > 0 then
    raise exception 'SEC-02c smoke: anon aun tiene EXECUTE en % funciones public', v_anon_exec;
  end if;
end;
$$;

notify pgrst, 'reload schema';

commit;
