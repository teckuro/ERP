-- ============================================================
-- FUNCIONES
-- Generado desde crear_sql_v6_11_integrada.sql. No editar a mano si se regenera.
-- ============================================================
SET search_path = public;

-- ============================================
-- OBJETOS MINIMOS DE COMPATIBILIDAD EN PUBLIC
-- ============================================

CREATE OR REPLACE FUNCTION fn_calcular_dias_trabajados(
    p_id_contrato INTEGER,
    p_periodo DATE,
    p_fecha_ingreso DATE,
    p_fecha_retiro DATE
) RETURNS NUMERIC
LANGUAGE sql
AS $$
WITH limites AS (
    SELECT
        GREATEST(
            p_periodo,
            COALESCE(p_fecha_ingreso, p_periodo)
        )::DATE AS fecha_inicio,
        LEAST(
            (p_periodo + INTERVAL '1 month' - INTERVAL '1 day')::DATE,
            COALESCE(p_fecha_retiro, (p_periodo + INTERVAL '1 month' - INTERVAL '1 day')::DATE)
        )::DATE AS fecha_fin
),
dias_base AS (
    SELECT
        fecha_inicio,
        fecha_fin,
        CASE
            WHEN fecha_fin < fecha_inicio THEN 0::NUMERIC
            ELSE (fecha_fin - fecha_inicio + 1)::NUMERIC
        END AS dias_trabajados
    FROM limites
),
dias_licencia AS (
    SELECT
        COALESCE(SUM(m.diainasist), 0)::NUMERIC AS dias_licencia
    FROM dias_base d
    JOIN contrato c ON c.id_contrato = p_id_contrato
    JOIN movimiento m ON m.id_persona = c.id_persona
    LEFT JOIN tipo_movimiento tm
        ON tm.id_tipo_movimiento = COALESCE(m.id_tipo_movimiento, m.tipomovimiento)
    LEFT JOIN motivo_inasistencia mi
        ON mi.id_motivo_inasistencia = COALESCE(m.id_motivo_inasistencia, m.motivoinasist)
    WHERE d.fecha_fin >= d.fecha_inicio
      AND m.fecha BETWEEN d.fecha_inicio AND d.fecha_fin
      AND (
            COALESCE(m.id_tipo_movimiento, m.tipomovimiento) = 3
            OR tm.codigo = 'INASISTENCIA'
          )
      AND (
            COALESCE(m.id_motivo_inasistencia, m.motivoinasist) = 101
            OR mi.codigo = 'LICENCIA_MEDICA'
          )
)
SELECT GREATEST(
    d.dias_trabajados - COALESCE(l.dias_licencia, 0),
    0
)
FROM dias_base d
LEFT JOIN dias_licencia l ON TRUE;
$$;

CREATE OR REPLACE FUNCTION fn_obtener_parametro(
    p_nombre TEXT,
    p_fecha DATE
) RETURNS NUMERIC
LANGUAGE sql
STABLE
AS $$
    SELECT COALESCE(pl.valor_decimal, pl.valor_entero::NUMERIC)
    FROM parametros_legales pl
    WHERE pl.nombre = ANY (
        CASE p_nombre
            WHEN 'TOPE_IMPONIBLE_UF' THEN ARRAY['TOPE_IMPONIBLE_UF', 'TOPE_AFP_UF']
            WHEN 'TOPE_IMPONIBLE_PESOS' THEN ARRAY['TOPE_IMPONIBLE_PESOS', 'TOPE_AFP_PESOS']
            WHEN 'TOPE_IPS_UF' THEN ARRAY['TOPE_IPS_UF', 'TOPE_INP_UF']
            WHEN 'TOPE_IPS_PESOS' THEN ARRAY['TOPE_IPS_PESOS', 'TOPE_INP_PESOS']
            ELSE ARRAY[p_nombre]
        END
    )
      AND pl.vigencia_inicio <= p_fecha
      AND (pl.vigencia_fin IS NULL OR pl.vigencia_fin >= p_fecha)
    ORDER BY
        pl.vigencia_inicio DESC,
        CASE WHEN pl.nombre = p_nombre THEN 0 ELSE 1 END
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION fn_obtener_afp(
    p_id_contrato INTEGER,
    p_fecha DATE
) RETURNS TABLE (
    id_afp INTEGER,
    nombre VARCHAR,
    tasa_trabajador NUMERIC,
    comision NUMERIC,
    sis NUMERIC,
    tasa_empleador NUMERIC
)
LANGUAGE sql
STABLE
AS $$
    SELECT
        a.id_afp,
        a.nombre,
        COALESCE(av.tasa_obligatoria, a.tasa_obligatoria) AS tasa_trabajador,
        COALESCE(av.comision, a.comision) AS comision,
        COALESCE(av.sis, a.sis) AS sis,
        COALESCE(av.tasa_empleador, a.tasa_empleador) AS tasa_empleador
    FROM prevision pr
    JOIN afp a
        ON a.id_afp = pr.id_afp
    LEFT JOIN LATERAL (
        SELECT av1.*
        FROM afp_vigencia av1
        WHERE av1.id_afp = a.id_afp
          AND av1.vigencia_inicio <= p_fecha
          AND (av1.vigencia_fin IS NULL OR av1.vigencia_fin >= p_fecha)
        ORDER BY av1.vigencia_inicio DESC
        LIMIT 1
    ) av ON TRUE
    WHERE pr.id_contrato = p_id_contrato
      AND pr.tipo_prevision = 'AFP'
      AND pr.vigencia_inicio <= p_fecha
      AND (pr.vigencia_fin IS NULL OR pr.vigencia_fin >= p_fecha)
    ORDER BY pr.vigencia_inicio DESC
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION fn_obtener_salud(
    p_id_contrato INTEGER,
    p_fecha DATE
) RETURNS TABLE (
    id_salud INTEGER,
    nombre VARCHAR,
    tipo VARCHAR,
    porcentaje_cotizacion NUMERIC,
    valor_plan NUMERIC
)
LANGUAGE sql
STABLE
AS $$
    SELECT
        s.id_salud,
        s.nombre,
        s.tipo::VARCHAR,
        COALESCE(sp.porcentaje_legal, s.porcentaje_cotizacion) AS porcentaje_cotizacion,
        CASE
            WHEN COALESCE(st.usar_plan_parametrizado, FALSE)
                THEN COALESCE(NULLIF(st.valor_plan, 0), sp.valor_referencia, 0)
            ELSE COALESCE(st.valor_plan, 0)
        END AS valor_plan
    FROM salud_trabajador st
    JOIN salud s
        ON s.id_salud = st.id_salud
    LEFT JOIN LATERAL (
        SELECT sp1.*
        FROM salud_plan sp1
        WHERE sp1.id_salud_plan = st.id_salud_plan
          AND sp1.vigencia_inicio <= p_fecha
          AND (sp1.vigencia_fin IS NULL OR sp1.vigencia_fin >= p_fecha)
        ORDER BY sp1.vigencia_inicio DESC
        LIMIT 1
    ) sp ON TRUE
    WHERE st.id_contrato = p_id_contrato
      AND st.vigencia_inicio <= p_fecha
      AND (st.vigencia_fin IS NULL OR st.vigencia_fin >= p_fecha)
    ORDER BY st.vigencia_inicio DESC
    LIMIT 1;
$$;


CREATE OR REPLACE FUNCTION fn_obtener_afc_parametro(
    p_codigo_tipo_contrato tipo_contrato_enum,
    p_fecha DATE
) RETURNS TABLE (
    aplica_seguro BOOLEAN,
    aplica_trabajador BOOLEAN,
    tasa_trabajador NUMERIC,
    tasa_empleador NUMERIC
)
LANGUAGE sql
STABLE
AS $$
    SELECT
        ap.aplica_seguro,
        ap.aplica_trabajador,
        ap.tasa_trabajador,
        ap.tasa_empleador
    FROM afc_parametro ap
    WHERE ap.codigo_tipo_contrato = p_codigo_tipo_contrato
      AND ap.vigencia_inicio <= p_fecha
      AND (ap.vigencia_fin IS NULL OR ap.vigencia_fin >= p_fecha)
    ORDER BY ap.vigencia_inicio DESC
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION fn_obtener_remuneracion(
    p_id_contrato INTEGER,
    p_fecha DATE
) RETURNS TABLE (
    sueldo_base NUMERIC,
    horas_semanales NUMERIC,
    dias_semanales NUMERIC,
    tipo_gratificacion tipo_gratificacion_enum,
    semana_corrida_activa BOOLEAN,
    zona_extrema_activa BOOLEAN,
    gratificacion_proporcional BOOLEAN
)
LANGUAGE sql
STABLE
AS $$
    SELECT r.sueldo_base,
           r.horas_semanales,
           r.dias_semanales,
           r.tipo_gratificacion,
           r.semana_corrida_activa,
           r.zona_extrema_activa,
           r.gratificacion_proporcional
    FROM remuneracion r
    WHERE r.id_contrato = p_id_contrato
      AND r.vigencia_inicio <= p_fecha
      AND (r.vigencia_fin IS NULL OR r.vigencia_fin >= p_fecha)
    ORDER BY r.vigencia_inicio DESC
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION fn_calcular_impuesto_unico(
    p_base NUMERIC,
    p_fecha DATE
) RETURNS NUMERIC
LANGUAGE sql
STABLE
AS $$
    SELECT CASE
        WHEN COALESCE(p_base, 0) <= 0 THEN 0::NUMERIC
        ELSE GREATEST(
            ROUND(
                COALESCE((
                    SELECT p_base * tiu.factor - tiu.rebaja
                    FROM tabla_impuesto_unico tiu
                    WHERE tiu.vigencia_inicio <= p_fecha
                      AND (tiu.vigencia_fin IS NULL OR tiu.vigencia_fin >= p_fecha)
                      AND p_base >= tiu.desde
                      AND (tiu.hasta IS NULL OR p_base <= tiu.hasta)
                    ORDER BY tiu.tramo
                    LIMIT 1
                ), 0),
                0
            ),
            0
        )
    END;
$$;

CREATE OR REPLACE FUNCTION fn_formato_decimales(
    p_valor NUMERIC,
    p_decimales INTEGER DEFAULT 0
) RETURNS VARCHAR
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT TO_CHAR(
        p_valor,
        'FM999G999G999G999' ||
        CASE
            WHEN p_decimales > 0 THEN 'D' || REPEAT('9', p_decimales)
            ELSE ''
        END
    );
$$;

CREATE OR REPLACE FUNCTION dblink_dteconfiguracion()
RETURNS TEXT AS $$
DECLARE
    v_connection TEXT;
BEGIN
    v_connection := current_setting('app.dblink_dteconfiguracion', TRUE);

    IF NULLIF(v_connection, '') IS NULL THEN
        RAISE EXCEPTION 'No esta configurado app.dblink_dteconfiguracion';
    END IF;

    RETURN v_connection;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE VIEW vw_persona_factores AS
SELECT
    p.id_persona,
    p.rut,
    p.dv,
    p.nombres,
    p.apellido_paterno,
    p.apellido_materno,
    p.fecha_nacimiento,
    p.sexo,
    p.email,
    p.telefono,
    p.id_pais,
    pa.nombre AS pais,
    p.id_comuna,
    p.estado,
    p.estado_ficha,
    p.apto_para_remuneraciones,
    com.nombre AS comuna,
    prv.id_provincia,
    prv.nombre AS provincia,
    reg.id_region,
    reg.nombre AS region,
    p.direccion,
    p.cargas,
    c.id_contrato,
    c.id_empresa,
    c.cargo,
    c.seguro_cesantia,
    c.codigo_tipo_contrato,
    tt.nombre AS tipo_trabajador_nombre,
    tj.nombre AS tipo_jornada_nombre,
    r.sueldo_base AS base,
    CASE
        WHEN COALESCE(r.dias_semanales, 0) > 0 THEN ROUND(r.sueldo_base / 30.0, 0)
        ELSE NULL
    END AS monto_dia,
    r.horas_semanales,
    r.dias_semanales,
    r.tipo_gratificacion AS gratificacion_tipo,
    r.semana_corrida_activa,
    r.zona_extrema_activa,
    pr.tipo_prevision,
    pr.id_regimen_previsional,
    rp.nombre AS regimen_previsional_nombre,
    pr.id_afp,
    a.nombre AS afp_nombre,
    COALESCE(av.tasa_obligatoria, a.tasa_obligatoria) AS tasa_obligatoria,
    COALESCE(av.comision, a.comision) AS comision,
    COALESCE(av.sis, a.sis) AS sis,
    COALESCE(av.tasa_empleador, a.tasa_empleador) AS tasa_empleador,
    st.id_salud,
    s.nombre AS salud_nombre_full,
    s.tipo AS salud_tipo,
    s.porcentaje_cotizacion,
    st.valor_plan,
    c.fecha_inicio AS fingreso,
    c.fecha_termino AS fretiro,
    c.estado AS estado_contrato
FROM persona p
LEFT JOIN public.pais pa
    ON pa.id_pais = p.id_pais
LEFT JOIN comuna com
    ON com.id_comuna = p.id_comuna
LEFT JOIN provincia prv
    ON prv.id_provincia = com.id_provincia
LEFT JOIN region reg
    ON reg.id_region = prv.id_region
LEFT JOIN contrato c
    ON p.id_persona = c.id_persona
LEFT JOIN tipo_trabajador tt
    ON tt.id_tipo_trabajador = c.id_tipo_trabajador
LEFT JOIN tipo_jornada tj
    ON tj.id_tipo_jornada = c.id_tipo_jornada
LEFT JOIN LATERAL (
    SELECT pr1.*
    FROM prevision pr1
    WHERE pr1.id_contrato = c.id_contrato
      AND pr1.vigencia_inicio <= CURRENT_DATE
      AND (pr1.vigencia_fin IS NULL OR pr1.vigencia_fin >= CURRENT_DATE)
    ORDER BY pr1.vigencia_inicio DESC
    LIMIT 1
) pr ON TRUE
LEFT JOIN regimen_previsional rp
    ON rp.id_regimen = pr.id_regimen_previsional
LEFT JOIN afp a
    ON a.id_afp = pr.id_afp
LEFT JOIN LATERAL (
    SELECT av1.*
    FROM afp_vigencia av1
    WHERE av1.id_afp = a.id_afp
      AND av1.vigencia_inicio <= CURRENT_DATE
      AND (av1.vigencia_fin IS NULL OR av1.vigencia_fin >= CURRENT_DATE)
    ORDER BY av1.vigencia_inicio DESC
    LIMIT 1
) av ON TRUE
LEFT JOIN LATERAL (
    SELECT st1.*
    FROM salud_trabajador st1
    WHERE st1.id_contrato = c.id_contrato
      AND st1.vigencia_inicio <= CURRENT_DATE
      AND (st1.vigencia_fin IS NULL OR st1.vigencia_fin >= CURRENT_DATE)
    ORDER BY st1.vigencia_inicio DESC
    LIMIT 1
) st ON TRUE
LEFT JOIN salud s
    ON s.id_salud = st.id_salud
LEFT JOIN LATERAL (
    SELECT r1.*
    FROM remuneracion r1
    WHERE r1.id_contrato = c.id_contrato
      AND r1.vigencia_inicio <= CURRENT_DATE
      AND (r1.vigencia_fin IS NULL OR r1.vigencia_fin >= CURRENT_DATE)
    ORDER BY r1.vigencia_inicio DESC
    LIMIT 1
) r ON TRUE;

CREATE OR REPLACE FUNCTION fn_generar_liquidacion(
    p_id_contrato INTEGER,
    p_periodo DATE,
    p_id_usuario INTEGER,
    p_preview BOOLEAN DEFAULT FALSE
) RETURNS TABLE (
    id_liquidacion INTEGER,
    estado VARCHAR(20),
    total_liquido NUMERIC,
    mensaje VARCHAR
) AS $$
DECLARE
    v_persona RECORD;
    v_rem RECORD;
    v_afp_cfg RECORD;
    v_salud_cfg RECORD;
    v_afc_cfg RECORD;
    v_id_liquidacion INTEGER;
    v_estado_final VARCHAR(20);
    v_dias_trabajados NUMERIC := 0;
    v_dias_mes NUMERIC := 30;
    v_sueldo_base NUMERIC := 0;
    v_valor_dia NUMERIC := 0;
    v_gratificacion NUMERIC := 0;
    v_base_gratificacion NUMERIC := 0;
    v_factor_gratificacion NUMERIC := 1;
    v_tope_gratificacion NUMERIC := 0;
    v_descripcion_gratificacion VARCHAR(200) := NULL;
    v_haberes_imponibles NUMERIC := 0;
    v_haberes_noimponibles NUMERIC := 0;
    v_total_haberes NUMERIC := 0;
    v_descuentos_legales NUMERIC := 0;
    v_descuentos_nolegales NUMERIC := 0;
    v_total_descuentos NUMERIC := 0;
    v_total_liquido NUMERIC := 0;
    v_renta_imponible NUMERIC := 0;
    v_afp NUMERIC := 0;
    v_salud NUMERIC := 0;
    v_cesantia NUMERIC := 0;
    v_sis NUMERIC := 0;
    v_afc_empleador NUMERIC := 0;
    v_aporte_afp_empleador NUMERIC := 0;
    v_total_aportes_empleador NUMERIC := 0;
    v_impuesto NUMERIC := 0;
    v_base_afp NUMERIC := 0;
    v_base_cesantia NUMERIC := 0;
    v_zona_extrema NUMERIC := 0;
    v_tipo_contrato_base VARCHAR(50);
    v_valor_uf NUMERIC := 0;
    v_valor_utm NUMERIC := 0;
    v_sueldo_minimo NUMERIC := 0;
    v_imm_gratificacion NUMERIC := 4.75;
    v_tope_imponible_uf NUMERIC := 0;
    v_tope_afp_pesos NUMERIC := 0;
    v_tope_cesantia_pesos NUMERIC := 0;
    v_afc_trabajador_indefinido NUMERIC := 0.6;
    v_afc_empleador_indefinido NUMERIC := 2.4;
    v_afc_empleador_plazo NUMERIC := 3.0;
    v_afc_tasa_trabajador NUMERIC := 0;
    v_afc_tasa_empleador NUMERIC := 0;
    v_afc_aplica_trabajador BOOLEAN := FALSE;
BEGIN
    IF p_id_contrato IS NULL OR p_periodo IS NULL THEN
        RETURN QUERY
        SELECT NULL::INTEGER, 'ERROR'::VARCHAR(20), NULL::NUMERIC, 'Parametros invalidos'::VARCHAR;
        RETURN;
    END IF;

    SELECT
        p.id_persona,
        c.codigo_tipo_contrato,
        c.seguro_cesantia,
        c.fecha_inicio AS fingreso,
        c.fecha_termino AS fretiro
    INTO v_persona
    FROM contrato c
    JOIN persona p
        ON p.id_persona = c.id_persona
    WHERE c.id_contrato = p_id_contrato
      AND c.fecha_inicio <= (p_periodo + INTERVAL '1 month' - INTERVAL '1 day')::DATE
      AND (c.fecha_termino IS NULL OR c.fecha_termino >= p_periodo);

    IF NOT FOUND THEN
        RETURN QUERY
        SELECT NULL::INTEGER, 'ERROR'::VARCHAR(20), NULL::NUMERIC, 'Contrato no vigente para el periodo'::VARCHAR;
        RETURN;
    END IF;

    SELECT *
    INTO v_rem
    FROM fn_obtener_remuneracion(p_id_contrato, p_periodo);

    IF NOT FOUND THEN
        RETURN QUERY
        SELECT NULL::INTEGER, 'ERROR'::VARCHAR(20), NULL::NUMERIC, 'No existe remuneracion vigente para el periodo'::VARCHAR;
        RETURN;
    END IF;

    SELECT *
    INTO v_afp_cfg
    FROM fn_obtener_afp(p_id_contrato, p_periodo);

    IF NOT FOUND THEN
        RETURN QUERY
        SELECT NULL::INTEGER, 'ERROR'::VARCHAR(20), NULL::NUMERIC, 'No existe prevision AFP vigente para el periodo'::VARCHAR;
        RETURN;
    END IF;

    SELECT *
    INTO v_salud_cfg
    FROM fn_obtener_salud(p_id_contrato, p_periodo);

    IF NOT FOUND THEN
        RETURN QUERY
        SELECT NULL::INTEGER, 'ERROR'::VARCHAR(20), NULL::NUMERIC, 'No existe salud vigente para el periodo'::VARCHAR;
        RETURN;
    END IF;

    v_valor_uf := COALESCE(fn_obtener_parametro('UF', p_periodo), 0);
    v_valor_utm := COALESCE(fn_obtener_parametro('UTM', p_periodo), 0);
    v_sueldo_minimo := COALESCE(fn_obtener_parametro('SUELDO_MINIMO', p_periodo), 0);
    v_imm_gratificacion := COALESCE(fn_obtener_parametro('IMM_GRATIFICACION', p_periodo), 4.75);
    v_tope_imponible_uf := COALESCE(fn_obtener_parametro('TOPE_IMPONIBLE_UF', p_periodo), 0);
    v_afc_trabajador_indefinido := COALESCE(fn_obtener_parametro('AFC_TRABAJADOR_INDEFINIDO', p_periodo), 0.6);
    v_afc_empleador_indefinido := COALESCE(fn_obtener_parametro('AFC_EMPLEADOR_INDEFINIDO', p_periodo), 2.4);
    v_afc_empleador_plazo := COALESCE(fn_obtener_parametro('AFC_EMPLEADOR_PLAZO', p_periodo), 3.0);

    IF v_valor_uf <= 0 THEN
        RETURN QUERY
        SELECT NULL::INTEGER, 'ERROR'::VARCHAR(20), NULL::NUMERIC, 'No existe parametro UF vigente para el periodo'::VARCHAR;
        RETURN;
    END IF;

    IF COALESCE(v_sueldo_minimo, 0) <= 0 THEN
        RETURN QUERY
        SELECT NULL::INTEGER, 'ERROR'::VARCHAR(20), NULL::NUMERIC, 'No existe sueldo minimo legal vigente para el periodo'::VARCHAR;
        RETURN;
    END IF;

    IF COALESCE(v_rem.sueldo_base, 0) < v_sueldo_minimo THEN
        RETURN QUERY
        SELECT NULL::INTEGER, 'ERROR'::VARCHAR(20), NULL::NUMERIC, 'Sueldo base bajo minimo legal vigente'::VARCHAR;
        RETURN;
    END IF;

    IF COALESCE(v_afp_cfg.tasa_trabajador, 0) + COALESCE(v_afp_cfg.comision, 0) NOT BETWEEN 10 AND 15 THEN
        RETURN QUERY
        SELECT NULL::INTEGER, 'ERROR'::VARCHAR(20), NULL::NUMERIC, 'Tasa AFP fuera de rango permitido'::VARCHAR;
        RETURN;
    END IF;

    IF COALESCE(v_salud_cfg.porcentaje_cotizacion, 0) < 7 THEN
        RETURN QUERY
        SELECT NULL::INTEGER, 'ERROR'::VARCHAR(20), NULL::NUMERIC, 'Cotizacion de salud menor al minimo legal'::VARCHAR;
        RETURN;
    END IF;

    IF v_tope_imponible_uf > 0 THEN
        v_tope_afp_pesos := ROUND(v_tope_imponible_uf * v_valor_uf, 0);
        v_tope_cesantia_pesos := v_tope_afp_pesos;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM liquidacion liq
        WHERE liq.id_contrato = p_id_contrato
          AND liq.periodo = p_periodo
          AND liq.estado <> 'BORRADOR'
    ) THEN
        RETURN QUERY
        SELECT NULL::INTEGER, 'ERROR'::VARCHAR(20), NULL::NUMERIC, 'Liquidacion ya existe para el periodo'::VARCHAR;
        RETURN;
    END IF;

    DELETE FROM liquidacion_detalle
    WHERE liquidacion_detalle.id_liquidacion IN (
        SELECT liq.id_liquidacion
        FROM liquidacion liq
        WHERE liq.id_contrato = p_id_contrato
          AND liq.periodo = p_periodo
          AND liq.estado = 'BORRADOR'
    );

    DELETE FROM liquidacion
    WHERE liquidacion.id_contrato = p_id_contrato
      AND liquidacion.periodo = p_periodo
      AND liquidacion.estado = 'BORRADOR';

    v_estado_final := CASE WHEN p_preview THEN 'BORRADOR' ELSE 'PROCESADA' END;

    v_sueldo_base := COALESCE(v_rem.sueldo_base, 0);
    v_valor_dia := ROUND(v_sueldo_base / v_dias_mes, 0);
    v_tipo_contrato_base := UPPER(COALESCE(v_persona.codigo_tipo_contrato::TEXT, 'INDEFINIDO'));

    SELECT *
    INTO v_afc_cfg
    FROM fn_obtener_afc_parametro(v_persona.codigo_tipo_contrato, p_periodo);

    IF FOUND THEN
        v_afc_tasa_trabajador := COALESCE(v_afc_cfg.tasa_trabajador, 0);
        v_afc_tasa_empleador := COALESCE(v_afc_cfg.tasa_empleador, 0);
        v_afc_aplica_trabajador := COALESCE(v_afc_cfg.aplica_trabajador, FALSE);
    ELSE
        IF v_tipo_contrato_base = 'INDEFINIDO' THEN
            v_afc_tasa_trabajador := v_afc_trabajador_indefinido;
            v_afc_tasa_empleador := v_afc_empleador_indefinido;
            v_afc_aplica_trabajador := TRUE;
        ELSE
            v_afc_tasa_trabajador := 0;
            v_afc_tasa_empleador := v_afc_empleador_plazo;
            v_afc_aplica_trabajador := FALSE;
        END IF;
    END IF;

    INSERT INTO liquidacion AS liq (
        id_contrato,
        id_persona,
        periodo,
        id_periodo,
        fecha_proceso,
        dias_trabajados,
        idusuario,
        valoruf,
        valorutm,
        estado,
        estado_v4
    ) VALUES (
        p_id_contrato,
        v_persona.id_persona,
        p_periodo,
        (
            SELECT pr.id_periodo
            FROM periodo_remuneracion pr
            WHERE pr.codigo = TO_CHAR(p_periodo, 'YYYY-MM')
            LIMIT 1
        ),
        NOW(),
        30,
        p_id_usuario,
        v_valor_uf,
        v_valor_utm,
        'BORRADOR',
        'BORRADOR'
    )
    RETURNING liq.id_liquidacion INTO v_id_liquidacion;

    v_dias_trabajados := fn_calcular_dias_trabajados(
        p_id_contrato,
        p_periodo,
        v_persona.fingreso,
        v_persona.fretiro
    );

    INSERT INTO liquidacion_detalle (
        id_liquidacion, id_concepto, monto, cantidad, descripcion, tipo, tipo_haber,
        imponible, tributable, afecta_afp, afecta_salud, afecta_afc, afecta_sis, orden
    )
    SELECT
        v_id_liquidacion,
        c.id_concepto,
        ROUND(v_dias_trabajados * COALESCE(v_valor_dia, 0), 0),
        v_dias_trabajados,
        'Sueldo Base - ' || v_dias_trabajados || ' dias',
        'H',
        'I',
        TRUE,
        TRUE,
        TRUE,
        TRUE,
        TRUE,
        FALSE,
        1
    FROM concepto c
    WHERE c.codigo = 'SUELDO_BASE';

    INSERT INTO liquidacion_detalle (
        id_liquidacion, id_concepto, monto, cantidad, descripcion, tipo, tipo_haber,
        imponible, tributable, afecta_afp, afecta_salud, afecta_afc, afecta_sis, orden
    )
    SELECT
        v_id_liquidacion,
        x.id_concepto,
        x.monto,
        1,
        x.descripcion,
        x.tipo,
        x.tipo_haber,
        x.imponible,
        x.tributable,
        x.afecta_afp,
        x.afecta_salud,
        x.afecta_afc,
        x.afecta_sis,
        x.orden
    FROM (
        SELECT
            hd.id_concepto,
            SUM(CASE
                WHEN hd.tipo = 'PORCENTAJE' THEN COALESCE(hd.porcentaje, 0) * COALESCE(v_sueldo_base, 0) / 100
                ELSE COALESCE(hd.monto, 0)
            END) AS monto,
            MAX(c.nombre) AS descripcion,
            CASE WHEN MAX(c.tipo) = 'HABER' THEN 'H' WHEN MAX(c.tipo) = 'DESCUENTO' THEN 'D' ELSE 'A' END AS tipo,
            CASE
                WHEN MAX(c.tipo) = 'HABER' AND MAX(c.naturaleza) = 'IMPONIBLE' THEN 'I'
                WHEN MAX(c.tipo) = 'HABER' AND MAX(c.naturaleza) = 'NO_IMPONIBLE' THEN 'N'
                ELSE NULL
            END AS tipo_haber,
            BOOL_OR(c.imponible) AS imponible,
            BOOL_OR(c.tributable) AS tributable,
            BOOL_OR(c.afecta_afp) AS afecta_afp,
            BOOL_OR(c.afecta_salud) AS afecta_salud,
            BOOL_OR(c.afecta_afc) AS afecta_afc,
            BOOL_OR(c.afecta_sis) AS afecta_sis,
            10 + ROW_NUMBER() OVER (ORDER BY hd.id_concepto) AS orden
        FROM haberdescuento_persona hd
        JOIN concepto c
            ON c.id_concepto = hd.id_concepto
        WHERE hd.id_persona = v_persona.id_persona
          AND hd.estado = TRUE
        GROUP BY hd.id_concepto
    ) x
    WHERE x.monto <> 0;

    INSERT INTO liquidacion_detalle (
        id_liquidacion, id_concepto, monto, cantidad, descripcion, tipo, tipo_haber,
        imponible, tributable, afecta_afp, afecta_salud, afecta_afc, afecta_sis, orden
    )
    SELECT
        v_id_liquidacion,
        x.id_concepto,
        x.monto,
        x.cantidad,
        x.descripcion,
        x.tipo,
        x.tipo_haber,
        x.imponible,
        x.tributable,
        x.afecta_afp,
        x.afecta_salud,
        x.afecta_afc,
        x.afecta_sis,
        x.orden
    FROM (
        SELECT
            CASE
                WHEN m.id_concepto IS NOT NULL THEN m.id_concepto
                WHEN m.tipomovimiento = 2 THEN (SELECT id_concepto FROM concepto WHERE codigo = 'HORAS_EXTRAS')
                WHEN m.tipomovimiento = 3 THEN (SELECT id_concepto FROM concepto WHERE codigo = 'INASISTENCIA')
                ELSE NULL
            END AS id_concepto,
            SUM(COALESCE(m.monto, 0)) AS monto,
            CASE
                WHEN m.cantidad IS NOT NULL THEN SUM(COALESCE(m.cantidad, 0))
                WHEN m.tipomovimiento = 2 THEN SUM(COALESCE(m.hrs_pactadas, 0))
                WHEN m.tipomovimiento = 3 THEN SUM(COALESCE(m.diainasist, 0))
                ELSE 0
            END AS cantidad,
            MAX(COALESCE(m.observacion, c.nombre, 'Movimiento')) AS descripcion,
            CASE
                WHEN COALESCE(c.tipo, CASE WHEN m.tipomovimiento = 2 THEN 'HABER' ELSE 'DESCUENTO' END) = 'HABER' THEN 'H'
                WHEN COALESCE(c.tipo, 'DESCUENTO') = 'DESCUENTO' THEN 'D'
                ELSE 'A'
            END AS tipo,
            CASE
                WHEN COALESCE(c.tipo, CASE WHEN m.tipomovimiento = 2 THEN 'HABER' ELSE 'DESCUENTO' END) = 'HABER'
                     AND COALESCE(c.naturaleza, 'IMPONIBLE') = 'IMPONIBLE' THEN 'I'
                WHEN COALESCE(c.tipo, CASE WHEN m.tipomovimiento = 2 THEN 'HABER' ELSE 'DESCUENTO' END) = 'HABER' THEN 'N'
                ELSE NULL
            END AS tipo_haber,
            BOOL_OR(COALESCE(c.imponible, m.tipomovimiento = 2)) AS imponible,
            BOOL_OR(COALESCE(c.tributable, m.tipomovimiento = 2)) AS tributable,
            BOOL_OR(COALESCE(c.afecta_afp, m.tipomovimiento = 2)) AS afecta_afp,
            BOOL_OR(COALESCE(c.afecta_salud, m.tipomovimiento = 2)) AS afecta_salud,
            BOOL_OR(COALESCE(c.afecta_afc, m.tipomovimiento = 2)) AS afecta_afc,
            BOOL_OR(COALESCE(c.afecta_sis, FALSE)) AS afecta_sis,
            20 + ROW_NUMBER() OVER (ORDER BY COALESCE(m.id_concepto, m.tipomovimiento)) AS orden
        FROM movimiento m
        LEFT JOIN concepto c
            ON c.id_concepto = m.id_concepto
        WHERE m.id_persona = v_persona.id_persona
          AND (m.id_contrato IS NULL OR m.id_contrato = p_id_contrato)
          AND m.fecha BETWEEN p_periodo AND (p_periodo + INTERVAL '1 month' - INTERVAL '1 day')::DATE
          AND (m.tipomovimiento IN (2, 3) OR m.id_concepto IS NOT NULL)
        GROUP BY COALESCE(m.id_concepto, m.tipomovimiento)
    ) x
    WHERE x.id_concepto IS NOT NULL
      AND x.monto <> 0;

    v_factor_gratificacion := CASE
        WHEN COALESCE(v_rem.gratificacion_proporcional, FALSE) THEN v_dias_trabajados / v_dias_mes
        ELSE 1
    END;

    SELECT COALESCE(SUM(ld.monto), 0)
    INTO v_base_gratificacion
    FROM liquidacion_detalle ld
    WHERE ld.id_liquidacion = v_id_liquidacion
      AND ld.tipo = 'H'
      AND ld.tipo_haber = 'I';

    v_gratificacion := 0;
    v_descripcion_gratificacion := NULL;

    -- v6.1: se ajusta segun reglas.txt.
    -- Art. 50 usa la base imponible del periodo antes de gratificacion.
    -- Art. 47 depende de utilidades de la empresa, por lo que no se autoconsume.
    -- Voluntaria no se autoconsume para evitar duplicar montos definidos manualmente por concepto.
    CASE COALESCE(v_rem.tipo_gratificacion, 'LEGAL_ART_50')
        WHEN 'LEGAL_ART_50' THEN
            v_gratificacion := ROUND((v_base_gratificacion * 0.25) * v_factor_gratificacion, 0);
            v_tope_gratificacion := ROUND((v_sueldo_minimo * v_imm_gratificacion / 12) * v_factor_gratificacion, 0);
            v_gratificacion := LEAST(v_gratificacion, v_tope_gratificacion);
            v_descripcion_gratificacion := 'Gratificacion legal Art. 50';
        WHEN 'LEGAL_ART_47' THEN
            v_gratificacion := 0;
            v_descripcion_gratificacion := NULL;
        WHEN 'VOLUNTARIA' THEN
            v_gratificacion := 0;
            v_descripcion_gratificacion := NULL;
        ELSE
            v_gratificacion := 0;
            v_descripcion_gratificacion := NULL;
    END CASE;

    IF v_gratificacion > 0 AND COALESCE(v_descripcion_gratificacion, '') <> '' THEN
        INSERT INTO liquidacion_detalle (
            id_liquidacion, id_concepto, monto, cantidad, descripcion, tipo, tipo_haber,
            imponible, tributable, afecta_afp, afecta_salud, afecta_afc, afecta_sis, orden
        )
        SELECT
            v_id_liquidacion,
            c.id_concepto,
            v_gratificacion,
            1,
            CASE
                WHEN COALESCE(v_rem.gratificacion_proporcional, FALSE)
                    THEN v_descripcion_gratificacion || ' proporcional'
                ELSE v_descripcion_gratificacion
            END,
            'H',
            'I',
            c.imponible,
            c.tributable,
            c.afecta_afp,
            c.afecta_salud,
            c.afecta_afc,
            c.afecta_sis,
            2
        FROM concepto c
        WHERE c.codigo = 'GRATIFICACION';
    END IF;

    SELECT COALESCE(SUM(monto), 0)
    INTO v_haberes_imponibles
    FROM liquidacion_detalle ld
    WHERE ld.id_liquidacion = v_id_liquidacion
      AND ld.tipo = 'H'
      AND ld.tipo_haber = 'I';

    v_base_afp := LEAST(v_haberes_imponibles, COALESCE(NULLIF(v_tope_afp_pesos, 0), v_haberes_imponibles));
    v_base_cesantia := LEAST(v_haberes_imponibles, COALESCE(NULLIF(v_tope_cesantia_pesos, 0), v_haberes_imponibles));

    IF v_afp_cfg.id_afp IS NOT NULL THEN
        v_afp := ROUND(v_base_afp * (COALESCE(v_afp_cfg.tasa_trabajador, 0) + COALESCE(v_afp_cfg.comision, 0)) / 100, 0);
        v_sis := ROUND(v_base_afp * COALESCE(v_afp_cfg.sis, fn_obtener_parametro('SIS', p_periodo), 0) / 100, 0);
        v_aporte_afp_empleador := ROUND(v_base_afp * COALESCE(v_afp_cfg.tasa_empleador, 0) / 100, 0);

        INSERT INTO liquidacion_detalle (
            id_liquidacion, id_concepto, monto, cantidad, descripcion, tipo, tipo_haber,
            imponible, tributable, afecta_afp, afecta_salud, afecta_afc, afecta_sis, orden
        )
        SELECT
            v_id_liquidacion,
            c.id_concepto,
            v_afp,
            COALESCE(v_afp_cfg.tasa_trabajador, 0) + COALESCE(v_afp_cfg.comision, 0),
            'AFP ' || COALESCE(v_afp_cfg.nombre, ''),
            'D',
            NULL,
            FALSE,
            FALSE,
            FALSE,
            FALSE,
            FALSE,
            FALSE,
            30
        FROM concepto c
        WHERE c.codigo = 'AFP'
          AND v_afp > 0;
    END IF;

    IF v_salud_cfg.id_salud IS NOT NULL AND v_salud_cfg.tipo = 'ISAPRE' AND COALESCE(v_salud_cfg.valor_plan, 0) > 0 THEN
        v_salud := GREATEST(
            ROUND(v_base_afp * COALESCE(v_salud_cfg.porcentaje_cotizacion, 7) / 100, 0),
            COALESCE(v_salud_cfg.valor_plan, 0)
        );
    ELSE
        v_salud := ROUND(v_base_afp * COALESCE(v_salud_cfg.porcentaje_cotizacion, 7) / 100, 0);
    END IF;

    INSERT INTO liquidacion_detalle (
        id_liquidacion, id_concepto, monto, cantidad, descripcion, tipo, tipo_haber,
        imponible, tributable, afecta_afp, afecta_salud, afecta_afc, afecta_sis, orden
    )
    SELECT
        v_id_liquidacion,
        c.id_concepto,
        v_salud,
        COALESCE(v_salud_cfg.porcentaje_cotizacion, 7),
        'Salud ' || COALESCE(v_salud_cfg.nombre, ''),
        'D',
        NULL,
        FALSE,
        FALSE,
        FALSE,
        FALSE,
        FALSE,
        FALSE,
        31
    FROM concepto c
    WHERE c.codigo = 'SALUD'
      AND v_salud > 0;

    IF COALESCE(v_persona.seguro_cesantia, FALSE) THEN
        IF COALESCE(v_afc_aplica_trabajador, FALSE) THEN
            v_cesantia := ROUND(v_base_cesantia * v_afc_tasa_trabajador / 100, 0);
        ELSE
            v_cesantia := 0;
        END IF;
        v_afc_empleador := ROUND(v_base_cesantia * COALESCE(v_afc_tasa_empleador, 0) / 100, 0);

        INSERT INTO liquidacion_detalle (
            id_liquidacion, id_concepto, monto, cantidad, descripcion, tipo, tipo_haber,
            imponible, tributable, afecta_afp, afecta_salud, afecta_afc, afecta_sis, orden
        )
        SELECT
            v_id_liquidacion,
            c.id_concepto,
            v_cesantia,
            v_afc_tasa_trabajador,
            'Seguro Cesantia',
            'D',
            NULL,
            FALSE,
            FALSE,
            FALSE,
            FALSE,
            FALSE,
            FALSE,
            32
        FROM concepto c
        WHERE c.codigo = 'CESANTIA'
          AND v_cesantia > 0;
    END IF;

    IF COALESCE(v_rem.zona_extrema_activa, FALSE) THEN
        SELECT ROUND(
                   v_haberes_imponibles
                   * COALESCE(zec.porcentaje, ze.porcentaje) / 100,
                   0
               )
        INTO v_zona_extrema
        FROM zona_extrema ze
        LEFT JOIN zona_extrema_catalogo zec
            ON zec.id_zona_extrema_catalogo = ze.id_zona_extrema_catalogo
           AND zec.vigencia_inicio <= p_periodo
           AND (zec.vigencia_fin IS NULL OR zec.vigencia_fin >= p_periodo)
        WHERE ze.id_contrato = p_id_contrato
          AND ze.vigencia_inicio <= p_periodo
          AND (ze.vigencia_fin IS NULL OR ze.vigencia_fin >= p_periodo)
        ORDER BY ze.vigencia_inicio DESC
        LIMIT 1;

        INSERT INTO liquidacion_detalle (
            id_liquidacion, id_concepto, monto, cantidad, descripcion, tipo, tipo_haber,
            imponible, tributable, afecta_afp, afecta_salud, afecta_afc, afecta_sis, orden
        )
        SELECT
            v_id_liquidacion,
            c.id_concepto,
            v_zona_extrema,
            1,
            'Zona extrema',
            'H',
            'N',
            FALSE,
            FALSE,
            FALSE,
            FALSE,
            FALSE,
            FALSE,
            35
        FROM concepto c
        WHERE c.codigo = 'ZONA_EXTREMA'
          AND COALESCE(v_zona_extrema, 0) > 0;
    END IF;

    INSERT INTO liquidacion_detalle (
        id_liquidacion, id_concepto, monto, cantidad, descripcion, tipo, tipo_haber,
        imponible, tributable, afecta_afp, afecta_salud, afecta_afc, afecta_sis, orden
    )
    SELECT
        v_id_liquidacion,
        c.id_concepto,
        SUM(p.valor_cuota) AS monto,
        COUNT(*)::NUMERIC,
        'Prestamos activos',
        'D',
        NULL,
        FALSE,
        FALSE,
        FALSE,
        FALSE,
        FALSE,
        FALSE,
        40
    FROM prestamo p
    JOIN concepto c
        ON c.codigo = 'PRESTAMO'
    WHERE p.id_persona = v_persona.id_persona
      AND p.estado = 'ACTIVO'
      AND p.saldo_pendiente > 0
    GROUP BY c.id_concepto
    HAVING SUM(p.valor_cuota) > 0;

    SELECT COALESCE(SUM(monto), 0)
    INTO v_descuentos_legales
    FROM liquidacion_detalle ld
    JOIN concepto c
        ON c.id_concepto = ld.id_concepto
    WHERE ld.id_liquidacion = v_id_liquidacion
      AND ld.tipo = 'D'
      AND c.codigo IN ('AFP', 'SALUD', 'CESANTIA');

    v_renta_imponible := GREATEST(v_haberes_imponibles - v_descuentos_legales, 0);
    v_impuesto := fn_calcular_impuesto_unico(v_renta_imponible, p_periodo);

    IF v_impuesto > 0 THEN
        INSERT INTO liquidacion_detalle (
            id_liquidacion, id_concepto, monto, cantidad, descripcion, tipo, tipo_haber,
            imponible, tributable, afecta_afp, afecta_salud, afecta_afc, afecta_sis, orden
        )
        SELECT
            v_id_liquidacion,
            c.id_concepto,
            v_impuesto,
            1,
            'Impuesto a la Renta',
            'D',
            NULL,
            FALSE,
            FALSE,
            FALSE,
            FALSE,
            FALSE,
            FALSE,
            50
        FROM concepto c
        WHERE c.codigo = 'IMPUESTO_RENTA';
    END IF;

    IF v_aporte_afp_empleador > 0 THEN
        INSERT INTO liquidacion_detalle (
            id_liquidacion, id_concepto, monto, cantidad, descripcion, tipo, tipo_haber,
            imponible, tributable, afecta_afp, afecta_salud, afecta_afc, afecta_sis, orden
        )
        SELECT
            v_id_liquidacion,
            c.id_concepto,
            v_aporte_afp_empleador,
            1,
            'Aporte AFP empleador',
            'A',
            NULL,
            FALSE,
            FALSE,
            FALSE,
            FALSE,
            FALSE,
            FALSE,
            120
        FROM concepto c
        WHERE c.codigo = 'AFP_EMPLEADOR';
    END IF;

    IF v_sis > 0 THEN
        INSERT INTO liquidacion_detalle (
            id_liquidacion, id_concepto, monto, cantidad, descripcion, tipo, tipo_haber,
            imponible, tributable, afecta_afp, afecta_salud, afecta_afc, afecta_sis, orden
        )
        SELECT
            v_id_liquidacion,
            c.id_concepto,
            v_sis,
            1,
            'SIS empleador',
            'A',
            NULL,
            FALSE,
            FALSE,
            FALSE,
            FALSE,
            FALSE,
            FALSE,
            121
        FROM concepto c
        WHERE c.codigo = 'SIS_EMPLEADOR';
    END IF;

    IF v_afc_empleador > 0 THEN
        INSERT INTO liquidacion_detalle (
            id_liquidacion, id_concepto, monto, cantidad, descripcion, tipo, tipo_haber,
            imponible, tributable, afecta_afp, afecta_salud, afecta_afc, afecta_sis, orden
        )
        SELECT
            v_id_liquidacion,
            c.id_concepto,
            v_afc_empleador,
            1,
            'AFC empleador',
            'A',
            NULL,
            FALSE,
            FALSE,
            FALSE,
            FALSE,
            FALSE,
            FALSE,
            122
        FROM concepto c
        WHERE c.codigo = 'AFC_EMPLEADOR';
    END IF;

    SELECT
        COALESCE(SUM(CASE WHEN ld.tipo = 'H' AND ld.tipo_haber = 'I' THEN ld.monto END), 0),
        COALESCE(SUM(CASE WHEN ld.tipo = 'H' AND ld.tipo_haber = 'N' THEN ld.monto END), 0),
        COALESCE(SUM(CASE WHEN ld.tipo = 'H' THEN ld.monto END), 0),
        COALESCE(SUM(CASE WHEN ld.tipo = 'D' AND c.codigo IN ('AFP', 'SALUD', 'CESANTIA', 'IMPUESTO_RENTA') THEN ld.monto END), 0),
        COALESCE(SUM(CASE WHEN ld.tipo = 'D' AND (c.codigo IS NULL OR c.codigo NOT IN ('AFP', 'SALUD', 'CESANTIA', 'IMPUESTO_RENTA')) THEN ld.monto END), 0),
        COALESCE(SUM(CASE WHEN ld.tipo = 'D' THEN ld.monto END), 0),
        COALESCE(SUM(CASE WHEN ld.tipo = 'A' THEN ld.monto END), 0)
    INTO
        v_haberes_imponibles,
        v_haberes_noimponibles,
        v_total_haberes,
        v_descuentos_legales,
        v_descuentos_nolegales,
        v_total_descuentos,
        v_total_aportes_empleador
    FROM liquidacion_detalle ld
    LEFT JOIN concepto c
        ON c.id_concepto = ld.id_concepto
    WHERE ld.id_liquidacion = v_id_liquidacion;

    v_total_liquido := v_total_haberes - v_total_descuentos;

    UPDATE liquidacion liq
    SET dias_trabajados = ROUND(v_dias_trabajados)::INT,
        total_haberes = v_total_haberes,
        total_descuentos = v_total_descuentos,
        total_aportes_empleador = v_total_aportes_empleador,
        monto_liquido = v_total_liquido,
        renta_imponible = v_renta_imponible,
        haberes_imponibles = v_haberes_imponibles,
        haberes_noimponibles = v_haberes_noimponibles,
        descuentos_legales = v_descuentos_legales,
        descuentos_nolegales = v_descuentos_nolegales,
        imponible_100sc = v_haberes_imponibles,
        total_tributable = v_renta_imponible,
        impuesto_unico = v_impuesto,
        afp_trabajador = v_afp,
        salud_trabajador = v_salud,
        afc_trabajador = v_cesantia,
        afc_empleador = v_afc_empleador,
        sis_empleador = v_sis,
        zona_extrema = COALESCE(v_zona_extrema, 0),
        estado = v_estado_final,
        estado_v4 = v_estado_final::tipo_estado_liquidacion_enum
    WHERE liq.id_liquidacion = v_id_liquidacion;

    RETURN QUERY
    SELECT v_id_liquidacion, v_estado_final, v_total_liquido, 'Liquidacion generada'::VARCHAR;
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY
        SELECT NULL::INTEGER, 'ERROR'::VARCHAR(20), NULL::NUMERIC, SQLERRM::VARCHAR;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_validar_liquidacion(
    p_id_liquidacion INTEGER
) RETURNS TABLE (
    validacion TEXT,
    ok BOOLEAN,
    esperado TEXT,
    actual TEXT,
    detalle TEXT
) AS $$
DECLARE
    v_liq RECORD;
    v_calc RECORD;
BEGIN
    SELECT l.*
    INTO v_liq
    FROM liquidacion l
    WHERE l.id_liquidacion = p_id_liquidacion;

    IF NOT FOUND THEN
        RETURN QUERY
        SELECT
            'liquidacion_existe'::TEXT,
            FALSE,
            'id_liquidacion valido'::TEXT,
            COALESCE(p_id_liquidacion::TEXT, 'NULL'),
            'No existe la liquidacion indicada'::TEXT;
        RETURN;
    END IF;

    SELECT
        COALESCE(SUM(CASE WHEN ld.tipo = 'H' AND ld.tipo_haber = 'I' THEN ld.monto END), 0) AS haberes_imponibles,
        COALESCE(SUM(CASE WHEN ld.tipo = 'H' AND ld.tipo_haber = 'N' THEN ld.monto END), 0) AS haberes_noimponibles,
        COALESCE(SUM(CASE WHEN ld.tipo = 'H' THEN ld.monto END), 0) AS total_haberes,
        COALESCE(SUM(CASE WHEN ld.tipo = 'D' AND c.codigo IN ('AFP', 'SALUD', 'CESANTIA', 'IMPUESTO_RENTA') THEN ld.monto END), 0) AS descuentos_legales,
        COALESCE(SUM(CASE WHEN ld.tipo = 'D' AND (c.codigo IS NULL OR c.codigo NOT IN ('AFP', 'SALUD', 'CESANTIA', 'IMPUESTO_RENTA')) THEN ld.monto END), 0) AS descuentos_nolegales,
        COALESCE(SUM(CASE WHEN ld.tipo = 'D' THEN ld.monto END), 0) AS total_descuentos,
        COALESCE(SUM(CASE WHEN ld.tipo = 'H' THEN ld.monto WHEN ld.tipo = 'D' THEN -ld.monto ELSE 0 END), 0) AS monto_liquido,
        COALESCE(SUM(CASE WHEN ld.tipo = 'A' THEN ld.monto END), 0) AS total_aportes_empleador,
        COALESCE(SUM(CASE WHEN c.codigo = 'HORAS_EXTRAS' THEN ld.cantidad END), 0) AS horas_extras_cantidad,
        COALESCE(SUM(CASE WHEN c.codigo = 'INASISTENCIA' THEN ld.cantidad END), 0) AS inasistencia_cantidad
    INTO v_calc
    FROM liquidacion_detalle ld
    LEFT JOIN concepto c
        ON c.id_concepto = ld.id_concepto
    WHERE ld.id_liquidacion = p_id_liquidacion;

    RETURN QUERY
    SELECT
        'haberes_imponibles'::TEXT,
        v_liq.haberes_imponibles = v_calc.haberes_imponibles,
        COALESCE(v_calc.haberes_imponibles, 0)::TEXT,
        COALESCE(v_liq.haberes_imponibles, 0)::TEXT,
        'Comparacion cabecera vs detalle'::TEXT;

    RETURN QUERY
    SELECT
        'haberes_noimponibles'::TEXT,
        v_liq.haberes_noimponibles = v_calc.haberes_noimponibles,
        COALESCE(v_calc.haberes_noimponibles, 0)::TEXT,
        COALESCE(v_liq.haberes_noimponibles, 0)::TEXT,
        'Comparacion cabecera vs detalle'::TEXT;

    RETURN QUERY
    SELECT
        'total_haberes'::TEXT,
        v_liq.total_haberes = v_calc.total_haberes,
        COALESCE(v_calc.total_haberes, 0)::TEXT,
        COALESCE(v_liq.total_haberes, 0)::TEXT,
        'Comparacion cabecera vs detalle'::TEXT;

    RETURN QUERY
    SELECT
        'descuentos_legales'::TEXT,
        v_liq.descuentos_legales = v_calc.descuentos_legales,
        COALESCE(v_calc.descuentos_legales, 0)::TEXT,
        COALESCE(v_liq.descuentos_legales, 0)::TEXT,
        'Comparacion cabecera vs detalle'::TEXT;

    RETURN QUERY
    SELECT
        'descuentos_nolegales'::TEXT,
        v_liq.descuentos_nolegales = v_calc.descuentos_nolegales,
        COALESCE(v_calc.descuentos_nolegales, 0)::TEXT,
        COALESCE(v_liq.descuentos_nolegales, 0)::TEXT,
        'Comparacion cabecera vs detalle'::TEXT;

    RETURN QUERY
    SELECT
        'total_descuentos'::TEXT,
        v_liq.total_descuentos = v_calc.total_descuentos,
        COALESCE(v_calc.total_descuentos, 0)::TEXT,
        COALESCE(v_liq.total_descuentos, 0)::TEXT,
        'Comparacion cabecera vs detalle'::TEXT;

    RETURN QUERY
    SELECT
        'monto_liquido'::TEXT,
        v_liq.monto_liquido = v_calc.monto_liquido,
        COALESCE(v_calc.monto_liquido, 0)::TEXT,
        COALESCE(v_liq.monto_liquido, 0)::TEXT,
        'Total haberes - total descuentos'::TEXT;

    RETURN QUERY
    SELECT
        'aportes_empleador'::TEXT,
        COALESCE(v_liq.total_aportes_empleador, 0) = COALESCE(v_calc.total_aportes_empleador, 0),
        COALESCE(v_calc.total_aportes_empleador, 0)::TEXT,
        COALESCE(v_liq.total_aportes_empleador, 0)::TEXT,
        'Comparacion cabecera vs detalle'::TEXT;

    RETURN QUERY
    SELECT
        'renta_imponible'::TEXT,
        v_liq.renta_imponible = GREATEST(v_calc.haberes_imponibles - v_calc.descuentos_legales, 0),
        GREATEST(v_calc.haberes_imponibles - v_calc.descuentos_legales, 0)::TEXT,
        COALESCE(v_liq.renta_imponible, 0)::TEXT,
        'Haberes imponibles - descuentos legales'::TEXT;

    RETURN QUERY
    SELECT
        'dias_trabajados_rango'::TEXT,
        v_liq.dias_trabajados BETWEEN 0 AND 31,
        '0..31'::TEXT,
        COALESCE(v_liq.dias_trabajados, 0)::TEXT,
        'Validacion basica de dias trabajados'::TEXT;

    RETURN QUERY
    SELECT
        'horas_extras_cantidad'::TEXT,
        TRUE,
        COALESCE(v_calc.horas_extras_cantidad, 0)::TEXT,
        COALESCE(v_calc.horas_extras_cantidad, 0)::TEXT,
        'Cantidad registrada para HORAS_EXTRAS en detalle'::TEXT;

    RETURN QUERY
    SELECT
        'inasistencia_cantidad'::TEXT,
        TRUE,
        COALESCE(v_calc.inasistencia_cantidad, 0)::TEXT,
        COALESCE(v_calc.inasistencia_cantidad, 0)::TEXT,
        'Cantidad registrada para INASISTENCIA en detalle'::TEXT;

    RETURN QUERY
    SELECT
        'detalle_existe'::TEXT,
        EXISTS (
            SELECT 1
            FROM liquidacion_detalle ld
            WHERE ld.id_liquidacion = p_id_liquidacion
        ),
        'al menos un item'::TEXT,
        (
            SELECT COUNT(*)::TEXT
            FROM liquidacion_detalle ld
            WHERE ld.id_liquidacion = p_id_liquidacion
        ),
        'La liquidacion debe tener detalle'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- NOTA
-- ============================================
--
-- Este script deja el modelo principal listo para Supabase en `public`.
-- Si todavia existen funciones o consultas antiguas con referencias a
-- `rrhh.*`, `laboral.*`, `remu.*`, `param.*` o `prev.*`, deben migrarse
