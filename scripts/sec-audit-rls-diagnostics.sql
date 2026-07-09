-- AUDIT-SEC-2026-07: consultas read-only de diagnóstico RLS (staging/PROD con autorización).
\set ON_ERROR_STOP on

\echo '=== A) Policies permisivas (USING/WITH CHECK = true) ==='
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and (
    coalesce(qual, '') in ('true', '(true)')
    or coalesce(with_check, '') in ('true', '(true)')
  )
order by tablename, policyname;

\echo '=== B1) Grants a anon en tablas public ==='
select grantee, table_schema, table_name, privilege_type
from information_schema.role_table_grants
where grantee = 'anon'
  and table_schema = 'public'
order by table_name, privilege_type;

\echo '=== B2) EXECUTE a anon en funciones public (aprox) ==='
select
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as args
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and has_function_privilege('anon', p.oid, 'EXECUTE')
order by 1, 2;

\echo '=== C) Tablas con RLS enabled sin FORCE RLS ==='
select c.relname as tabla,
       c.relrowsecurity as rls_enabled,
       c.relforcerowsecurity as force_rls
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relrowsecurity = true
  and c.relforcerowsecurity = false
order by 1;
