-- ============================================================
-- VALIDACIONES NO DESTRUCTIVAS BASE V11
-- Ejecutar despues de preparar/cargar parametros sobre BD local/dev.
-- Las consultas devuelven filas cuando hay algo que revisar.
-- No modifica, borra ni crea datos.
-- ============================================================
SET search_path = public;

\echo '01_periodo_estado_invalido'
SELECT
    codigo,
    estado,
    fecha_inicio,
    fecha_fin
FROM periodo_remuneracion
WHERE estado NOT IN ('pendiente', 'parcial', 'cargado', 'corregido', 'cerrado', 'error')
   OR codigo !~ '^[0-9]{4}-(0[1-9]|1[0-2])$'
   OR fecha_fin < fecha_inicio;

\echo '02_periodo_cargado_sin_mensuales_minimos'
SELECT
    pr.codigo,
    pr.estado,
    (pg.periodo IS NOT NULL) AS tiene_parametros_generales,
    COALESCE(tc.cantidad, 0) AS tramos_carga,
    COALESCE(ti.cantidad, 0) AS tramos_impuesto,
    COALESCE(tu.cantidad, 0) AS tabla_impuesto_unico,
    COALESCE(l16744.cantidad, 0) AS ley_16744_parametros
FROM periodo_remuneracion pr
LEFT JOIN parametros_generales pg ON pg.periodo = pr.codigo
LEFT JOIN (
    SELECT periodo, COUNT(*) AS cantidad
    FROM tramo_carga
    GROUP BY periodo
) tc ON tc.periodo = pr.codigo
LEFT JOIN (
    SELECT periodo, COUNT(*) AS cantidad
    FROM tramo_impuesto
    GROUP BY periodo
) ti ON ti.periodo = pr.codigo
LEFT JOIN (
    SELECT periodo, COUNT(*) AS cantidad
    FROM tabla_impuesto_unico
    GROUP BY periodo
) tu ON tu.periodo = pr.codigo
LEFT JOIN (
    SELECT periodo, COUNT(*) AS cantidad
    FROM ley_16744_parametros
    GROUP BY periodo
) l16744 ON l16744.periodo = pr.codigo
WHERE pr.estado IN ('cargado', 'corregido', 'cerrado')
  AND (
      pg.periodo IS NULL
      OR COALESCE(tc.cantidad, 0) = 0
      OR COALESCE(ti.cantidad, 0) = 0
      OR COALESCE(tu.cantidad, 0) = 0
      OR COALESCE(l16744.cantidad, 0) = 0
  );

\echo '03_periodo_parcial_con_mensuales_completos'
SELECT
    pr.codigo,
    pr.estado
FROM periodo_remuneracion pr
WHERE pr.estado = 'parcial'
  AND EXISTS (SELECT 1 FROM parametros_generales pg WHERE pg.periodo = pr.codigo)
  AND EXISTS (SELECT 1 FROM tramo_carga tc WHERE tc.periodo = pr.codigo)
  AND EXISTS (SELECT 1 FROM tramo_impuesto ti WHERE ti.periodo = pr.codigo)
  AND EXISTS (SELECT 1 FROM tabla_impuesto_unico tu WHERE tu.periodo = pr.codigo)
  AND EXISTS (SELECT 1 FROM ley_16744_parametros l16744 WHERE l16744.periodo = pr.codigo);

\echo '04_mensuales_sin_periodo_remuneracion'
SELECT DISTINCT fuente, periodo
FROM (
    SELECT 'parametros_generales' AS fuente, periodo FROM parametros_generales
    UNION ALL
    SELECT 'tramo_carga' AS fuente, periodo FROM tramo_carga
    UNION ALL
    SELECT 'tramo_impuesto' AS fuente, periodo FROM tramo_impuesto
    UNION ALL
    SELECT 'tabla_impuesto_unico' AS fuente, periodo FROM tabla_impuesto_unico
    UNION ALL
    SELECT 'ley_16744_parametros' AS fuente, periodo FROM ley_16744_parametros
) m
WHERE periodo IS NOT NULL
  AND NOT EXISTS (
      SELECT 1
      FROM periodo_remuneracion pr
      WHERE pr.codigo = m.periodo
  )
ORDER BY periodo, fuente;

\echo '05_parametros_generales_periodo_invalido'
SELECT periodo
FROM parametros_generales
WHERE periodo !~ '^[0-9]{4}-(0[1-9]|1[0-2])$';

\echo '06_tramo_carga_duplicados'
SELECT
    periodo,
    tramo,
    COUNT(*) AS cantidad
FROM tramo_carga
GROUP BY periodo, tramo
HAVING COUNT(*) > 1;

\echo '07_tramo_impuesto_duplicados'
SELECT
    periodo,
    desde,
    hasta,
    COUNT(*) AS cantidad
FROM tramo_impuesto
GROUP BY periodo, desde, hasta
HAVING COUNT(*) > 1;

\echo '08_tabla_impuesto_unico_duplicados'
SELECT
    tramo,
    vigencia_inicio,
    COUNT(*) AS cantidad
FROM tabla_impuesto_unico
GROUP BY tramo, vigencia_inicio
HAVING COUNT(*) > 1;

\echo '09_ley_16744_periodo_duplicados'
SELECT
    codigo,
    periodo,
    COUNT(*) AS cantidad
FROM ley_16744_parametros
GROUP BY codigo, periodo
HAVING COUNT(*) > 1;

\echo '10_vigencias_afp_solapadas'
SELECT
    a.id_afp,
    a.vigencia_inicio AS inicio_a,
    a.vigencia_fin AS fin_a,
    b.vigencia_inicio AS inicio_b,
    b.vigencia_fin AS fin_b
FROM afp_vigencia a
JOIN afp_vigencia b
  ON a.id_afp_vigencia < b.id_afp_vigencia
 AND a.id_afp = b.id_afp
 AND a.vigencia_inicio <= COALESCE(b.vigencia_fin, DATE '9999-12-31')
 AND b.vigencia_inicio <= COALESCE(a.vigencia_fin, DATE '9999-12-31');

\echo '11_vigencias_salud_plan_solapadas'
SELECT
    a.id_salud,
    a.nombre,
    a.vigencia_inicio AS inicio_a,
    a.vigencia_fin AS fin_a,
    b.vigencia_inicio AS inicio_b,
    b.vigencia_fin AS fin_b
FROM salud_plan a
JOIN salud_plan b
  ON a.id_salud_plan < b.id_salud_plan
 AND a.id_salud = b.id_salud
 AND a.nombre = b.nombre
 AND a.vigencia_inicio <= COALESCE(b.vigencia_fin, DATE '9999-12-31')
 AND b.vigencia_inicio <= COALESCE(a.vigencia_fin, DATE '9999-12-31');

\echo '12_vigencias_reforma_previsional_solapadas'
SELECT
    a.codigo AS codigo_a,
    a.vigencia_inicio AS inicio_a,
    a.vigencia_fin AS fin_a,
    b.codigo AS codigo_b,
    b.vigencia_inicio AS inicio_b,
    b.vigencia_fin AS fin_b
FROM reforma_previsional_parametro a
JOIN reforma_previsional_parametro b
  ON a.id_reforma_previsional_parametro < b.id_reforma_previsional_parametro
 AND a.vigencia_inicio <= COALESCE(b.vigencia_fin, DATE '9999-12-31')
 AND b.vigencia_inicio <= COALESCE(a.vigencia_fin, DATE '9999-12-31');

\echo '13_vigencias_afc_solapadas'
SELECT
    a.codigo_tipo_contrato,
    a.vigencia_inicio AS inicio_a,
    a.vigencia_fin AS fin_a,
    b.vigencia_inicio AS inicio_b,
    b.vigencia_fin AS fin_b
FROM afc_parametro a
JOIN afc_parametro b
  ON a.id_afc_parametro < b.id_afc_parametro
 AND a.codigo_tipo_contrato = b.codigo_tipo_contrato
 AND a.vigencia_inicio <= COALESCE(b.vigencia_fin, DATE '9999-12-31')
 AND b.vigencia_inicio <= COALESCE(a.vigencia_fin, DATE '9999-12-31');

\echo '14_vigencias_ips_ex_caja_solapadas'
SELECT
    a.grupo_trabajador,
    a.tipo_salud,
    a.escenario_empresa,
    a.vigencia_inicio AS inicio_a,
    a.vigencia_fin AS fin_a,
    b.vigencia_inicio AS inicio_b,
    b.vigencia_fin AS fin_b
FROM ips_ex_caja_tasa_basica a
JOIN ips_ex_caja_tasa_basica b
  ON a.id_ips_ex_caja_tasa_basica < b.id_ips_ex_caja_tasa_basica
 AND a.grupo_trabajador = b.grupo_trabajador
 AND a.tipo_salud = b.tipo_salud
 AND a.escenario_empresa = b.escenario_empresa
 AND a.vigencia_inicio <= COALESCE(b.vigencia_fin, DATE '9999-12-31')
 AND b.vigencia_inicio <= COALESCE(a.vigencia_fin, DATE '9999-12-31');

\echo '15_vigencias_rangos_invalidos'
SELECT 'afp_vigencia' AS tabla, id_afp_vigencia::text AS id, vigencia_inicio, vigencia_fin
FROM afp_vigencia
WHERE vigencia_fin IS NOT NULL AND vigencia_fin < vigencia_inicio
UNION ALL
SELECT 'salud' AS tabla, id_salud::text AS id, vigencia_inicio, vigencia_fin
FROM salud
WHERE vigencia_fin IS NOT NULL AND vigencia_fin < vigencia_inicio
UNION ALL
SELECT 'salud_plan' AS tabla, id_salud_plan::text AS id, vigencia_inicio, vigencia_fin
FROM salud_plan
WHERE vigencia_fin IS NOT NULL AND vigencia_fin < vigencia_inicio
UNION ALL
SELECT 'reforma_previsional_parametro' AS tabla, id_reforma_previsional_parametro::text AS id, vigencia_inicio, vigencia_fin
FROM reforma_previsional_parametro
WHERE vigencia_fin IS NOT NULL AND vigencia_fin < vigencia_inicio
UNION ALL
SELECT 'afc_parametro' AS tabla, id_afc_parametro::text AS id, vigencia_inicio, vigencia_fin
FROM afc_parametro
WHERE vigencia_fin IS NOT NULL AND vigencia_fin < vigencia_inicio
UNION ALL
SELECT 'ips_ex_caja_tasa_basica' AS tabla, id_ips_ex_caja_tasa_basica::text AS id, vigencia_inicio, vigencia_fin
FROM ips_ex_caja_tasa_basica
WHERE vigencia_fin IS NOT NULL AND vigencia_fin < vigencia_inicio;

\echo '16_gradualidad_sumas_inconsistentes'
SELECT
    codigo,
    vigencia_inicio,
    vigencia_fin,
    cuenta_capitalizacion_individual,
    cotizacion_rentabilidad_protegida,
    seguro_social_sis_cev,
    fapp_seguro_social,
    aporte_empleador_total
FROM reforma_previsional_parametro
WHERE ROUND((
        cuenta_capitalizacion_individual
        + cotizacion_rentabilidad_protegida
        + seguro_social_sis_cev
    )::numeric, 4) <> ROUND(aporte_empleador_total::numeric, 4)
   OR ROUND((
        cotizacion_rentabilidad_protegida
        + seguro_social_sis_cev
    )::numeric, 4) <> ROUND(fapp_seguro_social::numeric, 4);

\echo '17_gradualidad_tramos_esperados'
WITH expected(vigencia_inicio, vigencia_fin, total_esperado) AS (
    VALUES
        (DATE '2025-08-01', DATE '2026-07-31', 1.0000::numeric),
        (DATE '2026-08-01', DATE '2027-07-31', 3.5000::numeric),
        (DATE '2027-08-01', DATE '2028-07-31', 4.2500::numeric),
        (DATE '2028-08-01', DATE '2029-07-31', 5.0000::numeric),
        (DATE '2029-08-01', DATE '2030-07-31', 5.7000::numeric),
        (DATE '2030-08-01', DATE '2031-07-31', 6.4000::numeric),
        (DATE '2031-08-01', DATE '2032-07-31', 7.1000::numeric),
        (DATE '2032-08-01', DATE '2033-07-31', 7.8000::numeric),
        (DATE '2033-08-01', DATE '2045-07-31', 8.5000::numeric)
)
SELECT
    e.vigencia_inicio,
    e.vigencia_fin,
    e.total_esperado,
    COUNT(r.id_reforma_previsional_parametro) AS tramos_encontrados,
    MAX(r.aporte_empleador_total) AS total_encontrado
FROM expected e
LEFT JOIN reforma_previsional_parametro r
  ON r.vigencia_inicio = e.vigencia_inicio
 AND r.vigencia_fin IS NOT DISTINCT FROM e.vigencia_fin
GROUP BY e.vigencia_inicio, e.vigencia_fin, e.total_esperado
HAVING COUNT(r.id_reforma_previsional_parametro) <> 1
    OR MAX(r.aporte_empleador_total) IS DISTINCT FROM e.total_esperado;

\echo '18_gradualidad_controles_periodos_clave'
WITH expected(periodo, total_esperado) AS (
    VALUES
        ('2025-08', 1.0000::numeric),
        ('2026-08', 3.5000::numeric),
        ('2033-08', 8.5000::numeric)
)
SELECT
    e.periodo,
    e.total_esperado,
    COUNT(r.id_reforma_previsional_parametro) AS tramos_encontrados,
    MAX(r.aporte_empleador_total) AS total_encontrado
FROM expected e
LEFT JOIN reforma_previsional_parametro r
  ON (e.periodo || '-01')::date >= r.vigencia_inicio
 AND (e.periodo || '-01')::date <= COALESCE(r.vigencia_fin, DATE '9999-12-31')
GROUP BY e.periodo, e.total_esperado
HAVING COUNT(r.id_reforma_previsional_parametro) <> 1
    OR MAX(r.aporte_empleador_total) IS DISTINCT FROM e.total_esperado;

\echo '19_catalogos_globales_vacios'
SELECT 'ccaf_entidad' AS tabla
WHERE NOT EXISTS (SELECT 1 FROM ccaf_entidad)
UNION ALL
SELECT 'organismo_administrador_ley_16744' AS tabla
WHERE NOT EXISTS (SELECT 1 FROM organismo_administrador_ley_16744)
UNION ALL
SELECT 'institucion_apv' AS tabla
WHERE NOT EXISTS (SELECT 1 FROM institucion_apv)
UNION ALL
SELECT 'forma_pago_apv' AS tabla
WHERE NOT EXISTS (SELECT 1 FROM forma_pago_apv);

\echo '20_catalogos_globales_duplicados'
SELECT 'ccaf_entidad' AS tabla, codigo, COUNT(*) AS cantidad
FROM ccaf_entidad
GROUP BY codigo
HAVING codigo IS NOT NULL AND COUNT(*) > 1
UNION ALL
SELECT 'organismo_administrador_ley_16744' AS tabla, codigo, COUNT(*) AS cantidad
FROM organismo_administrador_ley_16744
GROUP BY codigo
HAVING codigo IS NOT NULL AND COUNT(*) > 1
UNION ALL
SELECT 'institucion_apv' AS tabla, codigo, COUNT(*) AS cantidad
FROM institucion_apv
GROUP BY codigo
HAVING codigo IS NOT NULL AND COUNT(*) > 1
UNION ALL
SELECT 'forma_pago_apv' AS tabla, codigo, COUNT(*) AS cantidad
FROM forma_pago_apv
GROUP BY codigo
HAVING codigo IS NOT NULL AND COUNT(*) > 1;

\echo '21_referencias_huerfanas_parametros'
SELECT 'afp_vigencia.id_afp' AS referencia, av.id_afp_vigencia AS id_origen
FROM afp_vigencia av
LEFT JOIN afp a ON a.id_afp = av.id_afp
WHERE a.id_afp IS NULL
UNION ALL
SELECT 'salud_plan.id_salud' AS referencia, sp.id_salud_plan AS id_origen
FROM salud_plan sp
LEFT JOIN salud s ON s.id_salud = sp.id_salud
WHERE s.id_salud IS NULL;

\echo '22_lre_catalogo_oficial_minimo'
WITH expected(codigo_lre) AS (
    VALUES
        ('1101'),('1102'),('1103'),('1104'),('1105'),('1106'),('1170'),('1146'),('1107'),('1108'),
        ('1109'),('1141'),('1142'),('1143'),('1151'),('1110'),('1152'),('1111'),('1112'),('1113'),
        ('1114'),('1171'),('1172'),('1173'),('1174'),('1175'),('1176'),('1177'),('1178'),('1179'),
        ('1180'),('1115'),('1116'),('1117'),('1118'),('1154'),('1155'),('1157'),('1131'),('1132'),
        ('2101'),('2102'),('2103'),('2104'),('2105'),('2106'),('2107'),('2108'),('2109'),('2110'),
        ('2111'),('2112'),('2113'),('2114'),('2115'),('2116'),('2117'),('2118'),('2119'),('2120'),
        ('2121'),('2122'),('2123'),('2124'),('2161'),('2201'),('2202'),('2203'),('2204'),('2301'),
        ('2302'),('2303'),('2304'),('2305'),('2311'),('2306'),('2307'),('2308'),('2309'),('2347'),
        ('2310'),('2312'),('2313'),('2314'),('2315'),('2316'),('2331'),('2417'),('2418'),('3141'),
        ('3143'),('3144'),('3151'),('3146'),('3147'),('3155'),('3156'),('3157'),('3158'),('3161'),
        ('3162'),('3163'),('3164'),('3165'),('3166'),('3167'),('3171'),('3172'),('3173'),('3174'),
        ('3175'),('3176'),('3177'),('3178'),('3179'),('3180'),('3110'),('3181'),('3182'),('3183'),
        ('3154'),('3184'),('3185'),('3186'),('3187'),('3188'),('4151'),('4152'),('4131'),('4154'),
        ('4155'),('4157'),('5201'),('5210'),('5220'),('5230'),('5240'),('5301'),('5361'),('5362'),
        ('5341'),('5302'),('5410'),('5501'),('5502'),('5564'),('5565')
)
SELECT e.codigo_lre AS codigo_faltante
FROM expected e
LEFT JOIN catalogo_lre l ON l.codigo_lre = e.codigo_lre
WHERE l.codigo_lre IS NULL;

\echo '23_lre_mapeos_conceptos_base'
WITH expected(codigo_concepto, codigo_lre) AS (
    VALUES
        ('SUELDO_BASE','2101'),
        ('GRATIFICACION','2106'),
        ('HORAS_EXTRAS','2102'),
        ('BONO_RESPONSABILIDAD','2111'),
        ('AGUINALDO','2110'),
        ('COLACION','2301'),
        ('MOVILIZACION','2302'),
        ('ASIGNACION_FAMILIAR','2311'),
        ('AFP','3141'),
        ('SALUD','3143'),
        ('CESANTIA','3151'),
        ('IMPUESTO_RENTA','3161'),
        ('PRESTAMO','3188'),
        ('ANTICIPO','3188'),
        ('DESCUENTO_CONVENIO','3183'),
        ('PENSION_ALIMENTOS','3186'),
        ('AFC_EMPLEADOR','4151'),
        ('SIS_EMPLEADOR','4155')
)
SELECT
    e.codigo_concepto,
    e.codigo_lre AS codigo_lre_esperado,
    l.codigo_lre AS codigo_lre_actual
FROM expected e
LEFT JOIN concepto c ON c.codigo = e.codigo_concepto
LEFT JOIN catalogo_lre l ON l.id_catalogo_lre = c.id_catalogo_lre
WHERE l.codigo_lre IS DISTINCT FROM e.codigo_lre;
