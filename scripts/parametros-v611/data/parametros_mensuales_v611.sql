-- Fase 2 mensual v6.11
-- Generado por render_parametros_mensuales_v611.py
-- Verifica si la data del periodo ya existe y si es igual antes de reemplazarla.
BEGIN;

INSERT INTO periodo_remuneracion (codigo, anio, mes, fecha_inicio, fecha_fin, estado) VALUES ('2026-04', 2026, 4, '2026-04-01', '2026-04-30', 'ABIERTO') ON CONFLICT (codigo) DO UPDATE SET fecha_inicio = EXCLUDED.fecha_inicio, fecha_fin = EXCLUDED.fecha_fin, estado = EXCLUDED.estado;

CREATE TEMP TABLE _expected_parametros_legales (nombre TEXT, valor_decimal NUMERIC, valor_entero INTEGER, vigencia_inicio DATE, vigencia_fin DATE) ON COMMIT DROP;
INSERT INTO _expected_parametros_legales (nombre, valor_decimal, valor_entero, vigencia_inicio, vigencia_fin) VALUES
  ('UF', 40120.2, NULL, '2026-04-01', NULL),
  ('UF_MES_ANTERIOR', 39841.72, NULL, '2026-04-01', NULL),
  ('UTM', NULL, 69889, '2026-04-01', NULL),
  ('UTA', NULL, 838668, '2026-04-01', NULL),
  ('SIS', 1.54, NULL, '2026-04-01', NULL),
  ('TOPE_AFP_UF', 90.0, NULL, '2026-04-01', NULL),
  ('TOPE_AFP_PESOS', NULL, 3610818, '2026-04-01', NULL),
  ('TOPE_INP_UF', 60.0, NULL, '2026-04-01', NULL),
  ('TOPE_INP_PESOS', NULL, 2390503, '2026-04-01', NULL),
  ('TOPE_AFC_UF', 135.2, NULL, '2026-04-01', NULL),
  ('TOPE_AFC_PESOS', NULL, 5424251, '2026-04-01', NULL),
  ('SUELDO_MINIMO', NULL, 539000, '2026-04-01', NULL),
  ('SUELDO_MINIMO_18_65', NULL, 402082, '2026-04-01', NULL),
  ('SUELDO_MINIMO_TPC', NULL, 539000, '2026-04-01', NULL),
  ('SUELDO_MINIMO_NO_REM', NULL, 347434, '2026-04-01', NULL),
  ('SALUD_CCAF', 4.2, NULL, '2026-04-01', NULL),
  ('SALUD_FONASA', 2.8, NULL, '2026-04-01', NULL),
  ('TOPE_APV_MENSUAL_UF', 50.0, NULL, '2026-04-01', NULL),
  ('TOPE_APV_MENSUAL_PESOS', NULL, 2006010, '2026-04-01', NULL),
  ('TOPE_APV_ANUAL_UF', 600.0, NULL, '2026-04-01', NULL),
  ('TOPE_APV_ANUAL_PESOS', NULL, 24072120, '2026-04-01', NULL),
  ('TOPE_DEPOSITO_CONVENIDO_ANUAL_UF', 900.0, NULL, '2026-04-01', NULL),
  ('TOPE_DEPOSITO_CONVENIDO_ANUAL_PESOS', NULL, 36108180, '2026-04-01', NULL);

DO $$
DECLARE
    actual_count INTEGER;
    diff_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO actual_count FROM (SELECT nombre::TEXT, valor_decimal, valor_entero, vigencia_inicio, vigencia_fin FROM parametros_legales WHERE vigencia_inicio = DATE '2026-04-01' AND nombre IN ('UF', 'UF_MES_ANTERIOR', 'UTM', 'UTA', 'SIS', 'TOPE_AFP_UF', 'TOPE_AFP_PESOS', 'TOPE_INP_UF', 'TOPE_INP_PESOS', 'TOPE_AFC_UF', 'TOPE_AFC_PESOS', 'SUELDO_MINIMO', 'SUELDO_MINIMO_18_65', 'SUELDO_MINIMO_TPC', 'SUELDO_MINIMO_NO_REM', 'SALUD_CCAF', 'SALUD_FONASA', 'TOPE_APV_MENSUAL_UF', 'TOPE_APV_MENSUAL_PESOS', 'TOPE_APV_ANUAL_UF', 'TOPE_APV_ANUAL_PESOS', 'TOPE_DEPOSITO_CONVENIDO_ANUAL_UF', 'TOPE_DEPOSITO_CONVENIDO_ANUAL_PESOS')) actual_rows;

    SELECT COUNT(*) INTO diff_count
    FROM (
        SELECT * FROM (
            (SELECT nombre::TEXT, valor_decimal, valor_entero, vigencia_inicio, vigencia_fin FROM parametros_legales WHERE vigencia_inicio = DATE '2026-04-01' AND nombre IN ('UF', 'UF_MES_ANTERIOR', 'UTM', 'UTA', 'SIS', 'TOPE_AFP_UF', 'TOPE_AFP_PESOS', 'TOPE_INP_UF', 'TOPE_INP_PESOS', 'TOPE_AFC_UF', 'TOPE_AFC_PESOS', 'SUELDO_MINIMO', 'SUELDO_MINIMO_18_65', 'SUELDO_MINIMO_TPC', 'SUELDO_MINIMO_NO_REM', 'SALUD_CCAF', 'SALUD_FONASA', 'TOPE_APV_MENSUAL_UF', 'TOPE_APV_MENSUAL_PESOS', 'TOPE_APV_ANUAL_UF', 'TOPE_APV_ANUAL_PESOS', 'TOPE_DEPOSITO_CONVENIDO_ANUAL_UF', 'TOPE_DEPOSITO_CONVENIDO_ANUAL_PESOS'))
            EXCEPT
            (SELECT nombre, valor_decimal, valor_entero, vigencia_inicio, vigencia_fin FROM _expected_parametros_legales)
        ) actual_minus_expected
        UNION ALL
        SELECT * FROM (
            (SELECT nombre, valor_decimal, valor_entero, vigencia_inicio, vigencia_fin FROM _expected_parametros_legales)
            EXCEPT
            (SELECT nombre::TEXT, valor_decimal, valor_entero, vigencia_inicio, vigencia_fin FROM parametros_legales WHERE vigencia_inicio = DATE '2026-04-01' AND nombre IN ('UF', 'UF_MES_ANTERIOR', 'UTM', 'UTA', 'SIS', 'TOPE_AFP_UF', 'TOPE_AFP_PESOS', 'TOPE_INP_UF', 'TOPE_INP_PESOS', 'TOPE_AFC_UF', 'TOPE_AFC_PESOS', 'SUELDO_MINIMO', 'SUELDO_MINIMO_18_65', 'SUELDO_MINIMO_TPC', 'SUELDO_MINIMO_NO_REM', 'SALUD_CCAF', 'SALUD_FONASA', 'TOPE_APV_MENSUAL_UF', 'TOPE_APV_MENSUAL_PESOS', 'TOPE_APV_ANUAL_UF', 'TOPE_APV_ANUAL_PESOS', 'TOPE_DEPOSITO_CONVENIDO_ANUAL_UF', 'TOPE_DEPOSITO_CONVENIDO_ANUAL_PESOS'))
        ) expected_minus_actual
    ) diff_rows;

    IF actual_count = 0 THEN
        RAISE NOTICE 'parametros_legales: no existia data previa para el periodo; se insertara.';
    ELSIF diff_count = 0 THEN
        RAISE NOTICE 'parametros_legales: la data existente ya es igual al archivo generado; se reemplaza igual para dejar carga limpia.';
    ELSE
        RAISE NOTICE 'parametros_legales: existen diferencias contra el archivo generado; se reemplaza la data del periodo.';
    END IF;
END $$;
DELETE FROM parametros_legales WHERE vigencia_inicio = DATE '2026-04-01' AND nombre IN (SELECT nombre FROM _expected_parametros_legales);
INSERT INTO parametros_legales (nombre, valor_decimal, valor_entero, vigencia_inicio, vigencia_fin)
SELECT nombre, valor_decimal, valor_entero, vigencia_inicio, vigencia_fin FROM _expected_parametros_legales;

CREATE TEMP TABLE _expected_parametros_generales (periodo TEXT, uf NUMERIC, utm NUMERIC, sueldo_minimo NUMERIC, sueldo_minimo18_65 NUMERIC, gratificacion BOOLEAN, imm_gratificacion NUMERIC, tope_afp NUMERIC, tope_ips NUMERIC, tope_cesantia NUMERIC, tope_afpvoluntario NUMERIC, sis NUMERIC, dsctosbpordia BOOLEAN, afc_trabajador_indefinido NUMERIC, afc_empleador_indefinido NUMERIC, afc_empleador_plazo NUMERIC) ON COMMIT DROP;
INSERT INTO _expected_parametros_generales (periodo, uf, utm, sueldo_minimo, sueldo_minimo18_65, gratificacion, imm_gratificacion, tope_afp, tope_ips, tope_cesantia, tope_afpvoluntario, sis, dsctosbpordia, afc_trabajador_indefinido, afc_empleador_indefinido, afc_empleador_plazo) VALUES
  ('2026-04', 40120.2, 69889, 539000, 402082, TRUE, 4.75, 3610818, 2390503, 5424251, 2006010, 1.54, TRUE, 0.6, 2.4, 3.0);

DO $$
DECLARE
    actual_count INTEGER;
    diff_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO actual_count FROM (SELECT periodo, uf, utm, sueldo_minimo, sueldo_minimo18_65, gratificacion, imm_gratificacion, tope_afp, tope_ips, tope_cesantia, tope_afpvoluntario, sis, dsctosbpordia, afc_trabajador_indefinido, afc_empleador_indefinido, afc_empleador_plazo FROM parametros_generales WHERE periodo = '2026-04') actual_rows;

    SELECT COUNT(*) INTO diff_count
    FROM (
        SELECT * FROM (
            (SELECT periodo, uf, utm, sueldo_minimo, sueldo_minimo18_65, gratificacion, imm_gratificacion, tope_afp, tope_ips, tope_cesantia, tope_afpvoluntario, sis, dsctosbpordia, afc_trabajador_indefinido, afc_empleador_indefinido, afc_empleador_plazo FROM parametros_generales WHERE periodo = '2026-04')
            EXCEPT
            (SELECT periodo, uf, utm, sueldo_minimo, sueldo_minimo18_65, gratificacion, imm_gratificacion, tope_afp, tope_ips, tope_cesantia, tope_afpvoluntario, sis, dsctosbpordia, afc_trabajador_indefinido, afc_empleador_indefinido, afc_empleador_plazo FROM _expected_parametros_generales)
        ) actual_minus_expected
        UNION ALL
        SELECT * FROM (
            (SELECT periodo, uf, utm, sueldo_minimo, sueldo_minimo18_65, gratificacion, imm_gratificacion, tope_afp, tope_ips, tope_cesantia, tope_afpvoluntario, sis, dsctosbpordia, afc_trabajador_indefinido, afc_empleador_indefinido, afc_empleador_plazo FROM _expected_parametros_generales)
            EXCEPT
            (SELECT periodo, uf, utm, sueldo_minimo, sueldo_minimo18_65, gratificacion, imm_gratificacion, tope_afp, tope_ips, tope_cesantia, tope_afpvoluntario, sis, dsctosbpordia, afc_trabajador_indefinido, afc_empleador_indefinido, afc_empleador_plazo FROM parametros_generales WHERE periodo = '2026-04')
        ) expected_minus_actual
    ) diff_rows;

    IF actual_count = 0 THEN
        RAISE NOTICE 'parametros_generales: no existia data previa para el periodo; se insertara.';
    ELSIF diff_count = 0 THEN
        RAISE NOTICE 'parametros_generales: la data existente ya es igual al archivo generado; se reemplaza igual para dejar carga limpia.';
    ELSE
        RAISE NOTICE 'parametros_generales: existen diferencias contra el archivo generado; se reemplaza la data del periodo.';
    END IF;
END $$;
DELETE FROM parametros_generales WHERE periodo = '2026-04';
INSERT INTO parametros_generales (periodo, uf, utm, sueldo_minimo, sueldo_minimo18_65, gratificacion, imm_gratificacion, tope_afp, tope_ips, tope_cesantia, tope_afpvoluntario, sis, dsctosbpordia, afc_trabajador_indefinido, afc_empleador_indefinido, afc_empleador_plazo) SELECT periodo, uf, utm, sueldo_minimo, sueldo_minimo18_65, gratificacion, imm_gratificacion, tope_afp, tope_ips, tope_cesantia, tope_afpvoluntario, sis, dsctosbpordia, afc_trabajador_indefinido, afc_empleador_indefinido, afc_empleador_plazo FROM _expected_parametros_generales;

CREATE TEMP TABLE _expected_afc_parametro (codigo_tipo_contrato tipo_contrato_enum, aplica_seguro BOOLEAN, aplica_trabajador BOOLEAN, tasa_trabajador NUMERIC, tasa_empleador NUMERIC, vigencia_inicio DATE, vigencia_fin DATE, observacion TEXT) ON COMMIT DROP;
INSERT INTO _expected_afc_parametro (codigo_tipo_contrato, aplica_seguro, aplica_trabajador, tasa_trabajador, tasa_empleador, vigencia_inicio, vigencia_fin, observacion) VALUES
  ('INDEFINIDO', TRUE, TRUE, 0.6, 2.4, '2026-04-01', NULL, 'Carga mensual separada v6.11'),
  ('PLAZO_FIJO', TRUE, FALSE, 0.0, 3.0, '2026-04-01', NULL, 'Carga mensual separada v6.11'),
  ('OBRA_SERVICIO', TRUE, FALSE, 0.0, 3.0, '2026-04-01', NULL, 'Carga mensual separada v6.11'),
  ('CASA_PARTICULAR', TRUE, FALSE, 0.0, 3.0, '2026-04-01', NULL, 'Carga mensual separada v6.11');

DO $$
DECLARE
    actual_count INTEGER;
    diff_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO actual_count FROM (SELECT codigo_tipo_contrato, aplica_seguro, aplica_trabajador, tasa_trabajador, tasa_empleador, vigencia_inicio, vigencia_fin, observacion FROM afc_parametro WHERE vigencia_inicio = DATE '2026-04-01') actual_rows;

    SELECT COUNT(*) INTO diff_count
    FROM (
        SELECT * FROM (
            (SELECT codigo_tipo_contrato, aplica_seguro, aplica_trabajador, tasa_trabajador, tasa_empleador, vigencia_inicio, vigencia_fin, observacion FROM afc_parametro WHERE vigencia_inicio = DATE '2026-04-01')
            EXCEPT
            (SELECT codigo_tipo_contrato, aplica_seguro, aplica_trabajador, tasa_trabajador, tasa_empleador, vigencia_inicio, vigencia_fin, observacion FROM _expected_afc_parametro)
        ) actual_minus_expected
        UNION ALL
        SELECT * FROM (
            (SELECT codigo_tipo_contrato, aplica_seguro, aplica_trabajador, tasa_trabajador, tasa_empleador, vigencia_inicio, vigencia_fin, observacion FROM _expected_afc_parametro)
            EXCEPT
            (SELECT codigo_tipo_contrato, aplica_seguro, aplica_trabajador, tasa_trabajador, tasa_empleador, vigencia_inicio, vigencia_fin, observacion FROM afc_parametro WHERE vigencia_inicio = DATE '2026-04-01')
        ) expected_minus_actual
    ) diff_rows;

    IF actual_count = 0 THEN
        RAISE NOTICE 'afc_parametro: no existia data previa para el periodo; se insertara.';
    ELSIF diff_count = 0 THEN
        RAISE NOTICE 'afc_parametro: la data existente ya es igual al archivo generado; se reemplaza igual para dejar carga limpia.';
    ELSE
        RAISE NOTICE 'afc_parametro: existen diferencias contra el archivo generado; se reemplaza la data del periodo.';
    END IF;
END $$;
DELETE FROM afc_parametro WHERE vigencia_inicio = DATE '2026-04-01';
INSERT INTO afc_parametro (codigo_tipo_contrato, aplica_seguro, aplica_trabajador, tasa_trabajador, tasa_empleador, vigencia_inicio, vigencia_fin, observacion)
SELECT codigo_tipo_contrato, aplica_seguro, aplica_trabajador, tasa_trabajador, tasa_empleador, vigencia_inicio, vigencia_fin, observacion FROM _expected_afc_parametro;

CREATE TEMP TABLE _expected_tramo_carga (periodo TEXT, desde NUMERIC, hasta NUMERIC, valor NUMERIC, tramo TEXT) ON COMMIT DROP;
INSERT INTO _expected_tramo_carga (periodo, desde, hasta, valor, tramo) VALUES
  ('2026-04', 0, 631976, 22007, 'A'),
  ('2026-04', 631976, 923067, 13505, 'B'),
  ('2026-04', 923067, 1439668, 4267, 'C'),
  ('2026-04', 1439668, NULL, 0, 'D');

DO $$
DECLARE
    actual_count INTEGER;
    diff_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO actual_count FROM (SELECT periodo::TEXT, desde, hasta, valor, tramo::TEXT FROM tramo_carga WHERE periodo = '2026-04') actual_rows;

    SELECT COUNT(*) INTO diff_count
    FROM (
        SELECT * FROM (
            (SELECT periodo::TEXT, desde, hasta, valor, tramo::TEXT FROM tramo_carga WHERE periodo = '2026-04')
            EXCEPT
            (SELECT periodo, desde, hasta, valor, tramo FROM _expected_tramo_carga)
        ) actual_minus_expected
        UNION ALL
        SELECT * FROM (
            (SELECT periodo, desde, hasta, valor, tramo FROM _expected_tramo_carga)
            EXCEPT
            (SELECT periodo::TEXT, desde, hasta, valor, tramo::TEXT FROM tramo_carga WHERE periodo = '2026-04')
        ) expected_minus_actual
    ) diff_rows;

    IF actual_count = 0 THEN
        RAISE NOTICE 'tramo_carga: no existia data previa para el periodo; se insertara.';
    ELSIF diff_count = 0 THEN
        RAISE NOTICE 'tramo_carga: la data existente ya es igual al archivo generado; se reemplaza igual para dejar carga limpia.';
    ELSE
        RAISE NOTICE 'tramo_carga: existen diferencias contra el archivo generado; se reemplaza la data del periodo.';
    END IF;
END $$;
DELETE FROM tramo_carga WHERE periodo = '2026-04';
INSERT INTO tramo_carga (periodo, desde, hasta, valor, tramo)
SELECT periodo, desde, hasta, valor, tramo FROM _expected_tramo_carga;

CREATE TEMP TABLE _expected_tabla_impuesto_unico (tramo INTEGER, desde NUMERIC, hasta NUMERIC, factor NUMERIC, rebaja NUMERIC, vigencia_inicio DATE, vigencia_fin DATE) ON COMMIT DROP;
INSERT INTO _expected_tabla_impuesto_unico (tramo, desde, hasta, factor, rebaja, vigencia_inicio, vigencia_fin) VALUES
  (1, 0.0, 943501.5, 0.0, 0.0, '2026-04-01', NULL),
  (2, 943501.51, 2096670.0, 0.04, 37740.06, '2026-04-01', NULL),
  (3, 2096670.01, 3494450.0, 0.08, 121606.86, '2026-04-01', NULL),
  (4, 3494450.01, 4892230.0, 0.135, 313801.61, '2026-04-01', NULL),
  (5, 4892230.01, 6290010.0, 0.23, 778563.46, '2026-04-01', NULL),
  (6, 6290010.01, 8386680.0, 0.304, 1244024.2, '2026-04-01', NULL),
  (7, 8386680.01, 10483350.0, 0.35, 1629811.48, '2026-04-01', NULL),
  (8, 10483350.01, NULL, 0.4, 2153978.98, '2026-04-01', NULL);

DO $$
DECLARE
    actual_count INTEGER;
    diff_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO actual_count FROM (SELECT tramo, desde, hasta, factor, rebaja, vigencia_inicio, vigencia_fin FROM tabla_impuesto_unico WHERE vigencia_inicio = DATE '2026-04-01') actual_rows;

    SELECT COUNT(*) INTO diff_count
    FROM (
        SELECT * FROM (
            (SELECT tramo, desde, hasta, factor, rebaja, vigencia_inicio, vigencia_fin FROM tabla_impuesto_unico WHERE vigencia_inicio = DATE '2026-04-01')
            EXCEPT
            (SELECT tramo, desde, hasta, factor, rebaja, vigencia_inicio, vigencia_fin FROM _expected_tabla_impuesto_unico)
        ) actual_minus_expected
        UNION ALL
        SELECT * FROM (
            (SELECT tramo, desde, hasta, factor, rebaja, vigencia_inicio, vigencia_fin FROM _expected_tabla_impuesto_unico)
            EXCEPT
            (SELECT tramo, desde, hasta, factor, rebaja, vigencia_inicio, vigencia_fin FROM tabla_impuesto_unico WHERE vigencia_inicio = DATE '2026-04-01')
        ) expected_minus_actual
    ) diff_rows;

    IF actual_count = 0 THEN
        RAISE NOTICE 'tabla_impuesto_unico: no existia data previa para el periodo; se insertara.';
    ELSIF diff_count = 0 THEN
        RAISE NOTICE 'tabla_impuesto_unico: la data existente ya es igual al archivo generado; se reemplaza igual para dejar carga limpia.';
    ELSE
        RAISE NOTICE 'tabla_impuesto_unico: existen diferencias contra el archivo generado; se reemplaza la data del periodo.';
    END IF;
END $$;
DELETE FROM tabla_impuesto_unico WHERE vigencia_inicio = DATE '2026-04-01';
INSERT INTO tabla_impuesto_unico (tramo, desde, hasta, factor, rebaja, vigencia_inicio, vigencia_fin)
SELECT tramo, desde, hasta, factor, rebaja, vigencia_inicio, vigencia_fin FROM _expected_tabla_impuesto_unico;

CREATE TEMP TABLE _expected_tramo_impuesto (periodo TEXT, desde NUMERIC, hasta NUMERIC, factor NUMERIC, rebaja NUMERIC) ON COMMIT DROP;
INSERT INTO _expected_tramo_impuesto (periodo, desde, hasta, factor, rebaja) VALUES
  ('2026-04', 0.0, 943501.5, 0.0, 0.0),
  ('2026-04', 943501.51, 2096670.0, 0.04, 37740.06),
  ('2026-04', 2096670.01, 3494450.0, 0.08, 121606.86),
  ('2026-04', 3494450.01, 4892230.0, 0.135, 313801.61),
  ('2026-04', 4892230.01, 6290010.0, 0.23, 778563.46),
  ('2026-04', 6290010.01, 8386680.0, 0.304, 1244024.2),
  ('2026-04', 8386680.01, 10483350.0, 0.35, 1629811.48),
  ('2026-04', 10483350.01, NULL, 0.4, 2153978.98);

DO $$
DECLARE
    actual_count INTEGER;
    diff_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO actual_count FROM (SELECT periodo::TEXT, desde, hasta, factor, rebaja FROM tramo_impuesto WHERE periodo = '2026-04') actual_rows;

    SELECT COUNT(*) INTO diff_count
    FROM (
        SELECT * FROM (
            (SELECT periodo::TEXT, desde, hasta, factor, rebaja FROM tramo_impuesto WHERE periodo = '2026-04')
            EXCEPT
            (SELECT periodo, desde, hasta, factor, rebaja FROM _expected_tramo_impuesto)
        ) actual_minus_expected
        UNION ALL
        SELECT * FROM (
            (SELECT periodo, desde, hasta, factor, rebaja FROM _expected_tramo_impuesto)
            EXCEPT
            (SELECT periodo::TEXT, desde, hasta, factor, rebaja FROM tramo_impuesto WHERE periodo = '2026-04')
        ) expected_minus_actual
    ) diff_rows;

    IF actual_count = 0 THEN
        RAISE NOTICE 'tramo_impuesto: no existia data previa para el periodo; se insertara.';
    ELSIF diff_count = 0 THEN
        RAISE NOTICE 'tramo_impuesto: la data existente ya es igual al archivo generado; se reemplaza igual para dejar carga limpia.';
    ELSE
        RAISE NOTICE 'tramo_impuesto: existen diferencias contra el archivo generado; se reemplaza la data del periodo.';
    END IF;
END $$;
DELETE FROM tramo_impuesto WHERE periodo = '2026-04';
INSERT INTO tramo_impuesto (periodo, desde, hasta, factor, rebaja)
SELECT periodo, desde, hasta, factor, rebaja FROM _expected_tramo_impuesto;

CREATE TEMP TABLE _expected_afp_vigencia_update (afp_nombre TEXT, vigencia_inicio DATE, sis NUMERIC, tope_imponible_uf NUMERIC) ON COMMIT DROP;
INSERT INTO _expected_afp_vigencia_update (afp_nombre, vigencia_inicio, sis, tope_imponible_uf) VALUES
  ('Capital', '2026-04-01', 1.54, 90.0),
  ('Cuprum', '2026-04-01', 1.54, 90.0),
  ('Habitat', '2026-04-01', 1.54, 90.0),
  ('Modelo', '2026-04-01', 1.54, 90.0),
  ('PlanVital', '2026-04-01', 1.54, 90.0),
  ('Provida', '2026-04-01', 1.54, 90.0),
  ('Uno', '2026-04-01', 1.54, 90.0);

DO $$
DECLARE
    actual_count INTEGER;
    diff_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO actual_count FROM (SELECT a.nombre::TEXT AS afp_nombre, av.vigencia_inicio, av.sis, av.tope_imponible_uf FROM afp_vigencia av JOIN afp a ON a.id_afp = av.id_afp WHERE av.vigencia_inicio = DATE '2026-04-01' AND a.nombre IN (SELECT afp_nombre FROM _expected_afp_vigencia_update)) actual_rows;

    SELECT COUNT(*) INTO diff_count
    FROM (
        SELECT * FROM (
            (SELECT a.nombre::TEXT AS afp_nombre, av.vigencia_inicio, av.sis, av.tope_imponible_uf FROM afp_vigencia av JOIN afp a ON a.id_afp = av.id_afp WHERE av.vigencia_inicio = DATE '2026-04-01' AND a.nombre IN (SELECT afp_nombre FROM _expected_afp_vigencia_update))
            EXCEPT
            (SELECT afp_nombre, vigencia_inicio, sis, tope_imponible_uf FROM _expected_afp_vigencia_update)
        ) actual_minus_expected
        UNION ALL
        SELECT * FROM (
            (SELECT afp_nombre, vigencia_inicio, sis, tope_imponible_uf FROM _expected_afp_vigencia_update)
            EXCEPT
            (SELECT a.nombre::TEXT AS afp_nombre, av.vigencia_inicio, av.sis, av.tope_imponible_uf FROM afp_vigencia av JOIN afp a ON a.id_afp = av.id_afp WHERE av.vigencia_inicio = DATE '2026-04-01' AND a.nombre IN (SELECT afp_nombre FROM _expected_afp_vigencia_update))
        ) expected_minus_actual
    ) diff_rows;

    IF actual_count = 0 THEN
        RAISE NOTICE 'afp_vigencia: no existia data previa para el periodo; se insertara.';
    ELSIF diff_count = 0 THEN
        RAISE NOTICE 'afp_vigencia: la data existente ya es igual al archivo generado; se reemplaza igual para dejar carga limpia.';
    ELSE
        RAISE NOTICE 'afp_vigencia: existen diferencias contra el archivo generado; se reemplaza la data del periodo.';
    END IF;
END $$;
UPDATE afp_vigencia av
SET sis = expected.sis,
    tope_imponible_uf = expected.tope_imponible_uf
FROM afp a
JOIN _expected_afp_vigencia_update expected ON expected.afp_nombre = a.nombre
WHERE av.id_afp = a.id_afp
  AND av.vigencia_inicio = expected.vigencia_inicio;

COMMIT;
