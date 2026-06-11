begin;

set local lock_timeout = '5s';
set local statement_timeout = '120s';

select pg_advisory_xact_lock(hashtext('NOM-ADMIN-OPS-F01'));

do $f01_lint_snapshot_variable$
declare
  v_definicion text;
  v_corregida text;
begin
  select pg_get_functiondef(
    'public.guardar_nomina_calculo_snapshot(text,integer,jsonb,jsonb,jsonb,jsonb,jsonb,jsonb,bigint)'::regprocedure
  )
  into v_definicion;

  v_corregida := regexp_replace(
    v_definicion,
    '(\s+v_usuario_label TEXT;)(\s+BEGIN)',
    E'\\1\n    v_tabla_mapa TEXT := ''pg_temp.tmp_nomina_snapshot_trab_map'';\\2'
  );
  v_corregida := replace(
    v_corregida,
    $anterior$EXECUTE 'CREATE TEMP TABLE IF NOT EXISTS tmp_nomina_snapshot_trab_map (trabajador_index INT PRIMARY KEY, id_calculo_trabajador INT NOT NULL) ON COMMIT DROP';$anterior$,
    $nuevo$EXECUTE format('CREATE TEMP TABLE IF NOT EXISTS %s (trabajador_index INT PRIMARY KEY, id_calculo_trabajador INT NOT NULL) ON COMMIT DROP', v_tabla_mapa);$nuevo$
  );
  v_corregida := replace(
    v_corregida,
    $anterior$EXECUTE 'TRUNCATE TABLE pg_temp.tmp_nomina_snapshot_trab_map';$anterior$,
    $nuevo$EXECUTE format('TRUNCATE TABLE %s', v_tabla_mapa);$nuevo$
  );
  v_corregida := replace(
    v_corregida,
    $anterior$EXECUTE 'INSERT INTO pg_temp.tmp_nomina_snapshot_trab_map (trabajador_index, id_calculo_trabajador) VALUES ($1, $2)' USING v_trabajador_index, v_id_calculo_trabajador;$anterior$,
    $nuevo$EXECUTE format('INSERT INTO %s (trabajador_index, id_calculo_trabajador) VALUES ($1, $2)', v_tabla_mapa) USING v_trabajador_index, v_id_calculo_trabajador;$nuevo$
  );
  v_corregida := replace(
    v_corregida,
    $anterior$EXECUTE 'SELECT id_calculo_trabajador FROM pg_temp.tmp_nomina_snapshot_trab_map WHERE trabajador_index = $1' INTO v_id_calculo_trabajador USING (v_item->>'trabajador_index')::INT;$anterior$,
    $nuevo$EXECUTE format('SELECT id_calculo_trabajador FROM %s WHERE trabajador_index = $1', v_tabla_mapa) INTO v_id_calculo_trabajador USING (v_item->>'trabajador_index')::INT;$nuevo$
  );

  if v_corregida = v_definicion
    or v_corregida not like '%v_tabla_mapa TEXT%'
    or v_corregida like '%EXECUTE ''INSERT INTO pg_temp.tmp_nomina_snapshot_trab_map%' then
    raise exception
      'F01: no se pudo parametrizar la tabla temporal del snapshot';
  end if;

  execute v_corregida;
end;
$f01_lint_snapshot_variable$;

commit;
