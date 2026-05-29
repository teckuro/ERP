-- NOM-ATOMIC-01: guardado/reemplazo atomico del resultado preliminar.
-- La funcion escribe el snapshot completo en una sola llamada transaccional.
-- No cierra periodo, no emite liquidaciones, no genera Previred, LRE, banco ni PDF.

-- Drop de la firma previa (7 args) para evitar overload ambiguo con la nueva (8 args, p_parametros).
DROP FUNCTION IF EXISTS guardar_nomina_calculo_snapshot(
    TEXT, INT, JSONB, JSONB, JSONB, JSONB, JSONB
);

CREATE OR REPLACE FUNCTION guardar_nomina_calculo_snapshot(
    p_periodo TEXT,
    p_id_empresa INT,
    p_cabecera JSONB,
    p_trabajadores JSONB,
    p_conceptos JSONB DEFAULT '[]'::JSONB,
    p_observaciones JSONB DEFAULT '[]'::JSONB,
    p_trazabilidad JSONB DEFAULT '[]'::JSONB,
    p_parametros JSONB DEFAULT '[]'::JSONB
)
RETURNS INT
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    v_id_calculo_periodo INT;
    v_id_calculo_anterior INT;
    v_id_calculo_trabajador INT;
    v_worker RECORD;
    v_item JSONB;
    v_trabajador_index INT;
BEGIN
    IF p_periodo IS NULL OR btrim(p_periodo) = '' OR p_periodo !~ '^[0-9]{4}-(0[1-9]|1[0-2])$' THEN
        RAISE EXCEPTION 'Periodo de snapshot invalido';
    END IF;

    IF p_cabecera IS NULL OR jsonb_typeof(p_cabecera) <> 'object' THEN
        RAISE EXCEPTION 'Cabecera de snapshot invalida';
    END IF;

    IF p_trabajadores IS NULL OR jsonb_typeof(p_trabajadores) <> 'array' OR jsonb_array_length(p_trabajadores) = 0 THEN
        RAISE EXCEPTION 'El snapshot debe incluir al menos un trabajador';
    END IF;

    IF p_conceptos IS NULL OR jsonb_typeof(p_conceptos) <> 'array' THEN
        RAISE EXCEPTION 'Conceptos de snapshot invalidos';
    END IF;

    IF p_observaciones IS NULL OR jsonb_typeof(p_observaciones) <> 'array' THEN
        RAISE EXCEPTION 'Observaciones de snapshot invalidas';
    END IF;

    IF p_trazabilidad IS NULL OR jsonb_typeof(p_trazabilidad) <> 'array' THEN
        RAISE EXCEPTION 'Trazabilidad de snapshot invalida';
    END IF;

    IF p_parametros IS NULL OR jsonb_typeof(p_parametros) <> 'array' THEN
        RAISE EXCEPTION 'Parametros congelados de snapshot invalidos';
    END IF;

    IF NULLIF(p_cabecera->>'version_motor', '') IS NULL THEN
        RAISE EXCEPTION 'Version de motor requerida para guardar snapshot';
    END IF;

    CREATE TEMP TABLE IF NOT EXISTS tmp_nomina_snapshot_trab_map (
        trabajador_index INT PRIMARY KEY,
        id_calculo_trabajador INT NOT NULL
    ) ON COMMIT DROP;
    TRUNCATE TABLE tmp_nomina_snapshot_trab_map;

    SELECT id_calculo_periodo
    INTO v_id_calculo_anterior
    FROM nomina_calculo_periodo
    WHERE periodo = p_periodo
      AND activo = TRUE
      AND (
        (p_id_empresa IS NULL AND id_empresa IS NULL)
        OR id_empresa = p_id_empresa
      )
    ORDER BY id_calculo_periodo DESC
    LIMIT 1
    FOR UPDATE;

    INSERT INTO nomina_calculo_periodo (
        periodo,
        id_empresa,
        estado,
        fecha_generacion,
        usuario_generador,
        total_trabajadores,
        total_haberes,
        total_descuentos,
        total_liquido,
        total_bloqueados,
        total_advertencias,
        version_motor,
        hash_snapshot,
        hash_parametros,
        hash_entradas,
        origen,
        activo,
        aprobacion_operativa_estado,
        aprobacion_operativa_fecha,
        aprobacion_operativa_usuario_id,
        aprobacion_operativa_usuario_label,
        aprobacion_operativa_advertencias,
        aprobacion_operativa_metadata
    )
    VALUES (
        p_periodo,
        p_id_empresa,
        CASE WHEN v_id_calculo_anterior IS NULL THEN COALESCE(NULLIF(p_cabecera->>'estado', ''), 'preliminar') ELSE 'recalculado' END,
        COALESCE((p_cabecera->>'fecha_generacion')::TIMESTAMPTZ, NOW()),
        NULLIF(p_cabecera->>'usuario_generador', '')::UUID,
        COALESCE((p_cabecera->>'total_trabajadores')::INT, jsonb_array_length(p_trabajadores)),
        COALESCE((p_cabecera->>'total_haberes')::NUMERIC, 0),
        COALESCE((p_cabecera->>'total_descuentos')::NUMERIC, 0),
        COALESCE((p_cabecera->>'total_liquido')::NUMERIC, 0),
        COALESCE((p_cabecera->>'total_bloqueados')::INT, 0),
        COALESCE((p_cabecera->>'total_advertencias')::INT, 0),
        p_cabecera->>'version_motor',
        NULLIF(p_cabecera->>'hash_snapshot', ''),
        NULLIF(p_cabecera->>'hash_parametros', ''),
        NULLIF(p_cabecera->>'hash_entradas', ''),
        CASE WHEN v_id_calculo_anterior IS NULL THEN COALESCE(NULLIF(p_cabecera->>'origen', ''), 'preliminar') ELSE 'recalculo' END,
        FALSE,
        NULL,
        NULL,
        NULL,
        NULL,
        '[]'::JSONB,
        '{}'::JSONB
    )
    RETURNING id_calculo_periodo INTO v_id_calculo_periodo;

    FOR v_worker IN
        SELECT value AS payload, ordinality
        FROM jsonb_array_elements(p_trabajadores) WITH ORDINALITY
    LOOP
        v_trabajador_index := COALESCE(
            (v_worker.payload->>'trabajador_index')::INT,
            (v_worker.ordinality - 1)::INT
        );

        INSERT INTO nomina_calculo_trabajador (
            id_calculo_periodo,
            id_persona,
            rut,
            nombre_completo_snapshot,
            estado,
            sueldo_base,
            base_imponible_previsional,
            base_tributable,
            total_haberes_imponibles,
            total_haberes_no_imponibles,
            total_descuentos_legales,
            total_descuentos_voluntarios,
            impuesto_unico,
            liquido_preliminar,
            cotizacion_afp,
            cotizacion_salud,
            cotizacion_afc,
            cotizacion_sis,
            cotizacion_sanna,
            cotizacion_ley_16744_empleador
        )
        VALUES (
            v_id_calculo_periodo,
            (v_worker.payload->>'id_persona')::INT,
            v_worker.payload->>'rut',
            v_worker.payload->>'nombre_completo_snapshot',
            v_worker.payload->>'estado',
            COALESCE((v_worker.payload->>'sueldo_base')::NUMERIC, 0),
            COALESCE((v_worker.payload->>'base_imponible_previsional')::NUMERIC, 0),
            COALESCE((v_worker.payload->>'base_tributable')::NUMERIC, 0),
            COALESCE((v_worker.payload->>'total_haberes_imponibles')::NUMERIC, 0),
            COALESCE((v_worker.payload->>'total_haberes_no_imponibles')::NUMERIC, 0),
            COALESCE((v_worker.payload->>'total_descuentos_legales')::NUMERIC, 0),
            COALESCE((v_worker.payload->>'total_descuentos_voluntarios')::NUMERIC, 0),
            COALESCE((v_worker.payload->>'impuesto_unico')::NUMERIC, 0),
            COALESCE((v_worker.payload->>'liquido_preliminar')::NUMERIC, 0),
            COALESCE((v_worker.payload->>'cotizacion_afp')::NUMERIC, 0),
            COALESCE((v_worker.payload->>'cotizacion_salud')::NUMERIC, 0),
            COALESCE((v_worker.payload->>'cotizacion_afc')::NUMERIC, 0),
            COALESCE((v_worker.payload->>'cotizacion_sis')::NUMERIC, 0),
            COALESCE((v_worker.payload->>'cotizacion_sanna')::NUMERIC, 0),
            COALESCE((v_worker.payload->>'cotizacion_ley_16744_empleador')::NUMERIC, 0)
        )
        RETURNING id_calculo_trabajador INTO v_id_calculo_trabajador;

        INSERT INTO tmp_nomina_snapshot_trab_map (trabajador_index, id_calculo_trabajador)
        VALUES (v_trabajador_index, v_id_calculo_trabajador);
    END LOOP;

    FOR v_item IN SELECT value FROM jsonb_array_elements(p_conceptos)
    LOOP
        SELECT id_calculo_trabajador
        INTO v_id_calculo_trabajador
        FROM tmp_nomina_snapshot_trab_map
        WHERE trabajador_index = (v_item->>'trabajador_index')::INT;

        IF v_id_calculo_trabajador IS NULL THEN
            RAISE EXCEPTION 'Concepto sin trabajador valido en snapshot';
        END IF;

        INSERT INTO nomina_calculo_concepto (
            id_calculo_trabajador,
            id_concepto,
            tipo,
            nombre_concepto_snapshot,
            codigo_lre_snapshot,
            monto,
            imponible,
            tributable,
            afecta_liquido,
            origen,
            trazabilidad_json
        )
        VALUES (
            v_id_calculo_trabajador,
            NULLIF(v_item->>'id_concepto', '')::INT,
            v_item->>'tipo',
            v_item->>'nombre_concepto_snapshot',
            NULLIF(v_item->>'codigo_lre_snapshot', ''),
            COALESCE((v_item->>'monto')::NUMERIC, 0),
            COALESCE((v_item->>'imponible')::BOOLEAN, FALSE),
            COALESCE((v_item->>'tributable')::BOOLEAN, FALSE),
            COALESCE((v_item->>'afecta_liquido')::BOOLEAN, TRUE),
            v_item->>'origen',
            CASE WHEN v_item ? 'trazabilidad_json' THEN v_item->'trazabilidad_json' ELSE NULL END
        );
    END LOOP;

    FOR v_item IN SELECT value FROM jsonb_array_elements(p_observaciones)
    LOOP
        v_id_calculo_trabajador := NULL;
        IF v_item ? 'trabajador_index' AND v_item->>'trabajador_index' IS NOT NULL THEN
            SELECT id_calculo_trabajador
            INTO v_id_calculo_trabajador
            FROM tmp_nomina_snapshot_trab_map
            WHERE trabajador_index = (v_item->>'trabajador_index')::INT;

            IF v_id_calculo_trabajador IS NULL THEN
                RAISE EXCEPTION 'Observacion sin trabajador valido en snapshot';
            END IF;
        END IF;

        INSERT INTO nomina_calculo_issue (
            id_calculo_periodo,
            id_calculo_trabajador,
            codigo,
            severidad,
            origen,
            mensaje,
            campo,
            entidad_id
        )
        VALUES (
            v_id_calculo_periodo,
            v_id_calculo_trabajador,
            v_item->>'codigo',
            v_item->>'severidad',
            v_item->>'origen',
            v_item->>'mensaje',
            NULLIF(v_item->>'campo', ''),
            NULLIF(v_item->>'entidad_id', '')
        );
    END LOOP;

    FOR v_item IN SELECT value FROM jsonb_array_elements(p_trazabilidad)
    LOOP
        v_id_calculo_trabajador := NULL;
        IF v_item ? 'trabajador_index' AND v_item->>'trabajador_index' IS NOT NULL THEN
            SELECT id_calculo_trabajador
            INTO v_id_calculo_trabajador
            FROM tmp_nomina_snapshot_trab_map
            WHERE trabajador_index = (v_item->>'trabajador_index')::INT;

            IF v_id_calculo_trabajador IS NULL THEN
                RAISE EXCEPTION 'Trazabilidad sin trabajador valido en snapshot';
            END IF;
        END IF;

        INSERT INTO nomina_calculo_trazabilidad (
            id_calculo_periodo,
            id_calculo_trabajador,
            codigo,
            origen,
            tabla_fuente,
            campo_fuente,
            vigencia_inicio,
            vigencia_fin,
            valor_entrada,
            formula,
            valor_resultado,
            observacion
        )
        VALUES (
            v_id_calculo_periodo,
            v_id_calculo_trabajador,
            v_item->>'codigo',
            v_item->>'origen',
            v_item->>'tabla_fuente',
            v_item->>'campo_fuente',
            NULLIF(v_item->>'vigencia_inicio', '')::DATE,
            NULLIF(v_item->>'vigencia_fin', '')::DATE,
            CASE WHEN v_item ? 'valor_entrada' THEN v_item->'valor_entrada' ELSE NULL END,
            v_item->>'formula',
            CASE WHEN v_item ? 'valor_resultado' THEN v_item->'valor_resultado' ELSE NULL END,
            NULLIF(v_item->>'observacion', '')
        );
    END LOOP;

    FOR v_item IN SELECT value FROM jsonb_array_elements(p_parametros)
    LOOP
        INSERT INTO nomina_calculo_parametro (
            id_calculo_periodo,
            grupo,
            clave,
            valor,
            valor_numerico,
            vigencia,
            origen
        )
        VALUES (
            v_id_calculo_periodo,
            COALESCE(NULLIF(v_item->>'grupo', ''), 'parametros_generales'),
            v_item->>'clave',
            NULLIF(v_item->>'valor', ''),
            NULLIF(v_item->>'valor_numerico', '')::NUMERIC,
            NULLIF(v_item->>'vigencia', '')::DATE,
            COALESCE(NULLIF(v_item->>'origen', ''), 'parametros_generales')
        );
    END LOOP;

    IF v_id_calculo_anterior IS NOT NULL THEN
        IF EXISTS (
            SELECT 1
            FROM nomina_calculo_periodo
            WHERE id_calculo_periodo = v_id_calculo_anterior
              AND cierre_operativo_estado IS NOT NULL
        ) THEN
            RAISE EXCEPTION 'La nomina del periodo esta cerrada operativamente';
        END IF;

        UPDATE nomina_calculo_periodo
        SET activo = FALSE,
            estado = 'anulado',
            reemplazado_por = v_id_calculo_periodo,
            updated_at = NOW()
        WHERE id_calculo_periodo = v_id_calculo_anterior;
    END IF;

    UPDATE nomina_calculo_periodo
    SET activo = TRUE,
        updated_at = NOW()
    WHERE id_calculo_periodo = v_id_calculo_periodo;

    RETURN v_id_calculo_periodo;
END;
$$;

REVOKE ALL ON FUNCTION guardar_nomina_calculo_snapshot(
    TEXT,
    INT,
    JSONB,
    JSONB,
    JSONB,
    JSONB,
    JSONB,
    JSONB
) FROM PUBLIC;

REVOKE ALL ON FUNCTION guardar_nomina_calculo_snapshot(
    TEXT,
    INT,
    JSONB,
    JSONB,
    JSONB,
    JSONB,
    JSONB,
    JSONB
) FROM anon;

GRANT EXECUTE ON FUNCTION guardar_nomina_calculo_snapshot(
    TEXT,
    INT,
    JSONB,
    JSONB,
    JSONB,
    JSONB,
    JSONB,
    JSONB
) TO authenticated;
