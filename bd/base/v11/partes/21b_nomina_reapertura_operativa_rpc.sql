-- NOM-MENSUAL-REAPERTURA-ELIMINACION-01: reapertura operativa de nomina confirmada.
-- Quita el cierre operativo para volver a revision. No anula liquidaciones ni periodo_remuneracion.

CREATE OR REPLACE FUNCTION public.reabrir_nomina_operativa(
    p_id_calculo_periodo BIGINT,
    p_periodo TEXT,
    p_observacion TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::JSONB,
    p_forzar BOOLEAN DEFAULT FALSE
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
    v_metadata_previo JSONB;
BEGIN
    v_usuario_id := auth.uid();

    IF v_usuario_id IS NULL THEN
        RAISE EXCEPTION 'Usuario authenticated requerido para reabrir nomina operativa';
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
        RAISE EXCEPTION 'No existe snapshot activo vigente para reabrir';
    END IF;

    IF v_snapshot.cierre_operativo_estado IS DISTINCT FROM 'cerrado_operativamente' THEN
        RAISE EXCEPTION 'La nomina no esta cerrada operativamente';
    END IF;

    v_metadata_previo := COALESCE(v_snapshot.cierre_operativo_metadata, '{}'::JSONB);

    UPDATE public.nomina_calculo_periodo
    SET
        cierre_operativo_estado = NULL,
        cierre_operativo_fecha = NULL,
        cierre_operativo_usuario_id = NULL,
        cierre_operativo_usuario_label = NULL,
        cierre_operativo_observacion = NULL,
        cierre_operativo_metadata = v_metadata_previo
            || jsonb_build_object(
                'ultimaReapertura', jsonb_build_object(
                    'fecha', NOW(),
                    'usuarioId', v_usuario_id,
                    'usuarioLabel', v_usuario_label,
                    'observacion', NULLIF(BTRIM(COALESCE(p_observacion, '')), ''),
                    'forzado', COALESCE(p_forzar, FALSE),
                    'metadata', COALESCE(p_metadata, '{}'::JSONB),
                    'notaAlcance', 'Reapertura operativa. No revierte liquidaciones generadas.'
                )
            ),
        updated_at = NOW()
    WHERE id_calculo_periodo = p_id_calculo_periodo
    RETURNING * INTO v_snapshot;

    RETURN v_snapshot;
END;
$$;

REVOKE ALL ON FUNCTION public.reabrir_nomina_operativa(BIGINT, TEXT, TEXT, JSONB, BOOLEAN) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reabrir_nomina_operativa(BIGINT, TEXT, TEXT, JSONB, BOOLEAN) FROM anon;
GRANT EXECUTE ON FUNCTION public.reabrir_nomina_operativa(BIGINT, TEXT, TEXT, JSONB, BOOLEAN) TO authenticated;
