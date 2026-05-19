-- NOM-PERIODO-DIAGNOSTICO-PERSIST-01: diagnóstico de verificación del período (prevalidación).

CREATE TABLE IF NOT EXISTS public.nomina_periodo_diagnostico (
    id_diagnostico BIGSERIAL PRIMARY KEY,
    periodo TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'abierto',
    verificado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verificado_por UUID NOT NULL,
    payload JSONB NOT NULL,
    fingerprint TEXT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    cerrado_en TIMESTAMPTZ NULL,
    cerrado_motivo TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT nomina_periodo_diagnostico_estado_chk CHECK (
        estado IN ('abierto', 'resuelto', 'obsoleto')
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_nomina_periodo_diagnostico_activo
    ON public.nomina_periodo_diagnostico (periodo)
    WHERE activo = TRUE;

CREATE INDEX IF NOT EXISTS idx_nomina_periodo_diagnostico_periodo
    ON public.nomina_periodo_diagnostico (periodo, verificado_en DESC);

CREATE OR REPLACE FUNCTION public.guardar_nomina_periodo_diagnostico(
    p_periodo TEXT,
    p_payload JSONB,
    p_fingerprint TEXT DEFAULT NULL
)
RETURNS public.nomina_periodo_diagnostico
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    v_row public.nomina_periodo_diagnostico%ROWTYPE;
    v_usuario_id UUID;
BEGIN
    v_usuario_id := auth.uid();
    IF v_usuario_id IS NULL THEN
        RAISE EXCEPTION 'Usuario authenticated requerido para guardar diagnostico del periodo';
    END IF;

    UPDATE public.nomina_periodo_diagnostico
    SET activo = FALSE,
        estado = 'obsoleto',
        updated_at = NOW()
    WHERE periodo = BTRIM(p_periodo)
      AND activo = TRUE;

    INSERT INTO public.nomina_periodo_diagnostico (
        periodo,
        estado,
        verificado_en,
        verificado_por,
        payload,
        fingerprint,
        activo
    )
    VALUES (
        BTRIM(p_periodo),
        'abierto',
        NOW(),
        v_usuario_id,
        COALESCE(p_payload, '{}'::JSONB),
        NULLIF(BTRIM(COALESCE(p_fingerprint, '')), ''),
        TRUE
    )
    RETURNING * INTO v_row;

    RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.obtener_nomina_periodo_diagnostico_activo(
    p_periodo TEXT
)
RETURNS public.nomina_periodo_diagnostico
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
    SELECT *
    FROM public.nomina_periodo_diagnostico
    WHERE periodo = BTRIM(p_periodo)
      AND activo = TRUE
      AND estado = 'abierto'
    ORDER BY verificado_en DESC
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.cerrar_nomina_periodo_diagnostico(
    p_periodo TEXT,
    p_motivo TEXT DEFAULT NULL
)
RETURNS public.nomina_periodo_diagnostico
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    v_row public.nomina_periodo_diagnostico%ROWTYPE;
BEGIN
    UPDATE public.nomina_periodo_diagnostico
    SET activo = FALSE,
        estado = 'resuelto',
        cerrado_en = NOW(),
        cerrado_motivo = NULLIF(BTRIM(COALESCE(p_motivo, '')), ''),
        updated_at = NOW()
    WHERE periodo = BTRIM(p_periodo)
      AND activo = TRUE
    RETURNING * INTO v_row;

    RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.guardar_nomina_periodo_diagnostico(TEXT, JSONB, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.guardar_nomina_periodo_diagnostico(TEXT, JSONB, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.guardar_nomina_periodo_diagnostico(TEXT, JSONB, TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.obtener_nomina_periodo_diagnostico_activo(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.obtener_nomina_periodo_diagnostico_activo(TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.obtener_nomina_periodo_diagnostico_activo(TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.cerrar_nomina_periodo_diagnostico(TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cerrar_nomina_periodo_diagnostico(TEXT, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.cerrar_nomina_periodo_diagnostico(TEXT, TEXT) TO authenticated;
