-- NOM-CIERRE-01: cierre operativo controlado de nomina.
-- Orden del flujo: aprobar -> emitir -> cerrar (esta funcion). El cierre es el bloqueo final.
-- Exige que ya existan liquidaciones oficiales emitidas para el periodo antes de cerrar.
-- Congela el snapshot activo aprobado operativamente.
-- No toca periodo_remuneracion, no genera PDF, Previred, LRE, banco ni contabilidad.

CREATE OR REPLACE FUNCTION public.cerrar_nomina_operativa(
    p_id_calculo_periodo BIGINT,
    p_periodo TEXT,
    p_observacion TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS public.nomina_calculo_periodo
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    v_snapshot public.nomina_calculo_periodo%ROWTYPE;
    v_usuario_id UUID;
    v_usuario_label TEXT;
    v_id_liquidacion_periodo BIGINT;
BEGIN
    v_usuario_id := auth.uid();

    IF v_usuario_id IS NULL THEN
        RAISE EXCEPTION 'Usuario authenticated requerido para cerrar nomina operativa';
    END IF;

    v_usuario_label := COALESCE(
        NULLIF(auth.jwt() ->> 'email', ''),
        'Usuario no disponible en esta sesion'
    );

    SELECT *
    INTO v_snapshot
    FROM public.nomina_calculo_periodo
    WHERE id_calculo_periodo = p_id_calculo_periodo
      AND periodo = p_periodo
      AND activo = TRUE
      AND reemplazado_por IS NULL
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No existe snapshot activo vigente para cerrar';
    END IF;

    IF v_snapshot.aprobacion_operativa_estado IS DISTINCT FROM 'aprobado_operativamente' THEN
        RAISE EXCEPTION 'El snapshot debe estar aprobado operativamente antes de cerrar';
    END IF;

    IF v_snapshot.cierre_operativo_estado IS NOT NULL THEN
        RAISE EXCEPTION 'La nomina ya esta cerrada operativamente';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.nomina_liquidacion_periodo
        WHERE id_calculo_periodo = p_id_calculo_periodo
          AND activo = TRUE
    ) THEN
        RAISE EXCEPTION 'Debe emitir las liquidaciones del periodo antes de cerrar';
    END IF;

    SELECT id_liquidacion_periodo
    INTO v_id_liquidacion_periodo
    FROM public.nomina_liquidacion_periodo
    WHERE id_calculo_periodo = p_id_calculo_periodo
      AND activo = TRUE
    ORDER BY id_liquidacion_periodo DESC
    LIMIT 1;

    UPDATE public.nomina_calculo_periodo
    SET
        cierre_operativo_estado = 'cerrado_operativamente',
        cierre_operativo_fecha = NOW(),
        cierre_operativo_usuario_id = v_usuario_id,
        cierre_operativo_usuario_label = v_usuario_label,
        cierre_operativo_observacion = NULLIF(BTRIM(COALESCE(p_observacion, '')), ''),
        cierre_operativo_metadata = COALESCE(p_metadata, '{}'::JSONB)
            || jsonb_build_object(
                'periodo', p_periodo,
                'idCalculoPeriodo', p_id_calculo_periodo,
                'notaAlcance', 'Cierre operativo. No emite liquidaciones ni genera archivos legales.'
            ),
        updated_at = NOW()
    WHERE id_calculo_periodo = p_id_calculo_periodo
    RETURNING * INTO v_snapshot;

    IF v_snapshot.id_preparacion_nomina IS NOT NULL THEN
        UPDATE public.nomina_preparacion
        SET estado = 'cerrada',
            cerrada_at = NOW(),
            cerrada_by = v_usuario_id,
            metadata = COALESCE(metadata, '{}'::JSONB)
                || jsonb_build_object(
                    'idCalculoPeriodo', p_id_calculo_periodo,
                    'idLiquidacionPeriodo', v_id_liquidacion_periodo,
                    'origen', 'cerrar_nomina_operativa'
                ),
            updated_at = NOW()
        WHERE id_preparacion_nomina = v_snapshot.id_preparacion_nomina;

        INSERT INTO public.nomina_preparacion_evento (
            id_preparacion_nomina,
            tipo_evento,
            usuario_id,
            usuario_label,
            metadata
        )
        VALUES (
            v_snapshot.id_preparacion_nomina,
            'PREPARACION_CERRADA',
            v_usuario_id,
            v_usuario_label,
            jsonb_build_object(
                'idCalculoPeriodo', p_id_calculo_periodo,
                'idLiquidacionPeriodo', v_id_liquidacion_periodo
            )
        );
    END IF;

    RETURN v_snapshot;
END;
$$;

REVOKE ALL ON FUNCTION public.cerrar_nomina_operativa(BIGINT, TEXT, TEXT, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cerrar_nomina_operativa(BIGINT, TEXT, TEXT, JSONB) FROM anon;
GRANT EXECUTE ON FUNCTION public.cerrar_nomina_operativa(BIGINT, TEXT, TEXT, JSONB) TO authenticated;
