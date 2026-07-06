-- BKL-07: revocar ejecución de helpers de identidad para rol anon.
-- Las sesiones anon no deben invocar current_user_id / current_user_empresa_id;
-- RLS y RPC productivas operan solo con authenticated (+ service_role).

begin;

set local lock_timeout = '5s';
set local statement_timeout = '60s';

select pg_advisory_xact_lock(hashtext('BKL-07-revoke-anon-identity-helpers'));

revoke execute on function public.current_user_id() from anon;
revoke execute on function public.current_user_empresa_id() from anon;

commit;
