begin;

set local lock_timeout = '5s';
set local statement_timeout = '120s';

select pg_advisory_xact_lock(hashtext('NOM-ADMIN-OPS-F01'));

do $f01_lint_snapshot_runtime$
declare
  v_definicion text;
  v_corregida text;
begin
  select pg_get_functiondef(
    'public.guardar_nomina_calculo_snapshot(text,integer,jsonb,jsonb,jsonb,jsonb,jsonb,jsonb,bigint)'::regprocedure
  )
  into v_definicion;

  v_corregida := replace(
    v_definicion,
    'v_tabla_mapa TEXT := ''pg_temp.tmp_nomina_snapshot_trab_map'';',
    'v_tabla_mapa TEXT := ''pg_temp.tmp_nomina_snapshot_trab_map_'' || replace(gen_random_uuid()::TEXT, ''-'', '''');'
  );

  if v_corregida = v_definicion
    or v_corregida not like '%gen_random_uuid()::TEXT%' then
    raise exception
      'F01: no se pudo volver dinamico el nombre temporal del snapshot';
  end if;

  execute v_corregida;
end;
$f01_lint_snapshot_runtime$;

commit;
