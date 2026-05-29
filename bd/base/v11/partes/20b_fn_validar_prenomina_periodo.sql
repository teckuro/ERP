-- PRENOMINA-VALIDAR-01: validacion de solo lectura de la prenomina antes de aprobar.
-- No escribe nada. Devuelve un diagnostico JSONB { ok, bloqueos, advertencias }.
-- TS calcula; esta funcion solo verifica integridad/gobernanza server-side.

CREATE OR REPLACE FUNCTION public.fn_validar_prenomina_periodo(
    p_id_calculo_periodo BIGINT,
    p_periodo TEXT,
    p_hash_snapshot TEXT DEFAULT NULL,
    p_hash_parametros TEXT DEFAULT NULL,
    p_hash_entradas TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    v_snapshot public.nomina_calculo_periodo%ROWTYPE;
    v_bloqueos JSONB := '[]'::JSONB;
    v_advertencias JSONB := '[]'::JSONB;
    v_total_trabajadores INT;
    v_total_parametros INT;
BEGIN
    SELECT *
    INTO v_snapshot
    FROM public.nomina_calculo_periodo
    WHERE id_calculo_periodo = p_id_calculo_periodo
      AND periodo = p_periodo
      AND activo = TRUE
      AND reemplazado_por IS NULL;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'ok', FALSE,
            'bloqueos', jsonb_build_array(
                jsonb_build_object('codigo', 'PRENOMINA_SIN_SNAPSHOT', 'mensaje', 'No existe snapshot activo vigente para el periodo.')
            ),
            'advertencias', '[]'::JSONB
        );
    END IF;

    IF v_snapshot.cierre_operativo_estado IS NOT NULL THEN
        v_bloqueos := v_bloqueos || jsonb_build_object('codigo', 'PRENOMINA_CERRADA', 'mensaje', 'La nomina ya esta cerrada operativamente.');
    END IF;

    IF COALESCE(v_snapshot.total_bloqueados, 0) > 0 THEN
        v_bloqueos := v_bloqueos || jsonb_build_object('codigo', 'PRENOMINA_CON_BLOQUEOS', 'mensaje', 'El snapshot tiene trabajadores bloqueados.');
    END IF;

    IF NULLIF(v_snapshot.hash_snapshot, '') IS NULL THEN
        v_bloqueos := v_bloqueos || jsonb_build_object('codigo', 'PRENOMINA_SIN_HASH_SNAPSHOT', 'mensaje', 'Falta el hash del resultado.');
    END IF;

    IF NULLIF(v_snapshot.hash_parametros, '') IS NULL THEN
        v_bloqueos := v_bloqueos || jsonb_build_object('codigo', 'PRENOMINA_SIN_HASH_PARAMETROS', 'mensaje', 'Falta el hash de parametros.');
    END IF;

    IF NULLIF(v_snapshot.hash_entradas, '') IS NULL THEN
        v_bloqueos := v_bloqueos || jsonb_build_object('codigo', 'PRENOMINA_SIN_HASH_ENTRADAS', 'mensaje', 'Falta el hash de entradas.');
    END IF;

    IF p_hash_snapshot IS NOT NULL AND v_snapshot.hash_snapshot IS DISTINCT FROM p_hash_snapshot THEN
        v_bloqueos := v_bloqueos || jsonb_build_object('codigo', 'PRENOMINA_HASH_SNAPSHOT_DISTINTO', 'mensaje', 'El hash del resultado no coincide con el esperado.');
    END IF;

    IF p_hash_parametros IS NOT NULL AND v_snapshot.hash_parametros IS DISTINCT FROM p_hash_parametros THEN
        v_bloqueos := v_bloqueos || jsonb_build_object('codigo', 'PRENOMINA_HASH_PARAMETROS_DISTINTO', 'mensaje', 'El hash de parametros no coincide con el esperado.');
    END IF;

    IF p_hash_entradas IS NOT NULL AND v_snapshot.hash_entradas IS DISTINCT FROM p_hash_entradas THEN
        v_bloqueos := v_bloqueos || jsonb_build_object('codigo', 'PRENOMINA_HASH_ENTRADAS_DISTINTO', 'mensaje', 'El hash de entradas no coincide con el esperado.');
    END IF;

    SELECT COUNT(*) INTO v_total_trabajadores
    FROM public.nomina_calculo_trabajador
    WHERE id_calculo_periodo = p_id_calculo_periodo;

    IF COALESCE(v_total_trabajadores, 0) <= 0 THEN
        v_bloqueos := v_bloqueos || jsonb_build_object('codigo', 'PRENOMINA_SIN_TRABAJADORES', 'mensaje', 'No existen trabajadores calculados en el snapshot.');
    END IF;

    SELECT COUNT(*) INTO v_total_parametros
    FROM public.nomina_calculo_parametro
    WHERE id_calculo_periodo = p_id_calculo_periodo;

    IF COALESCE(v_total_parametros, 0) <= 0 THEN
        v_bloqueos := v_bloqueos || jsonb_build_object('codigo', 'PRENOMINA_SIN_PARAMETROS', 'mensaje', 'No hay parametros congelados para el periodo.');
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.nomina_liquidacion_periodo
        WHERE id_calculo_periodo = p_id_calculo_periodo
          AND activo = TRUE
    ) THEN
        v_advertencias := v_advertencias || jsonb_build_object('codigo', 'PRENOMINA_YA_EMITIDA', 'mensaje', 'Ya existen liquidaciones activas para este snapshot.');
    END IF;

    IF COALESCE(v_snapshot.total_advertencias, 0) > 0 THEN
        v_advertencias := v_advertencias || jsonb_build_object('codigo', 'PRENOMINA_CON_ADVERTENCIAS', 'mensaje', 'El snapshot tiene advertencias visibles.');
    END IF;

    RETURN jsonb_build_object(
        'ok', (jsonb_array_length(v_bloqueos) = 0),
        'bloqueos', v_bloqueos,
        'advertencias', v_advertencias
    );
END;
$$;

REVOKE ALL ON FUNCTION public.fn_validar_prenomina_periodo(BIGINT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fn_validar_prenomina_periodo(BIGINT, TEXT, TEXT, TEXT, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.fn_validar_prenomina_periodo(BIGINT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
