-- LM-INGRESO-01: bandeja de licencias médicas recibidas por correo + extensión licencia_medica.

SET search_path = public;

-- ---------------------------------------------------------------------------
-- Tabla raw de ingreso por correo
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.licencia_medica_ingreso_correo (
    id_ingreso SERIAL PRIMARY KEY,
    id_empresa INTEGER NOT NULL REFERENCES public.empresa(id_empresa) ON DELETE RESTRICT,
    remitente TEXT NOT NULL,
    asunto TEXT,
    cuerpo_texto TEXT,
    cuerpo_html TEXT,
    adjuntos JSONB NOT NULL DEFAULT '[]'::jsonb,
    message_id TEXT,
    recibido_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    id_licencia INT REFERENCES public.licencia_medica(id_licencia) ON DELETE SET NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'recibido'
        CHECK (estado IN ('recibido', 'pendiente_revision', 'descartado', 'procesado')),
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_lm_ingreso_message_id_empresa
    ON public.licencia_medica_ingreso_correo (id_empresa, message_id)
    WHERE message_id IS NOT NULL AND btrim(message_id) <> '';

CREATE INDEX IF NOT EXISTS idx_lm_ingreso_empresa_estado
    ON public.licencia_medica_ingreso_correo (id_empresa, estado);

-- ---------------------------------------------------------------------------
-- Extensión licencia_medica
-- ---------------------------------------------------------------------------
ALTER TABLE public.licencia_medica
    ADD COLUMN IF NOT EXISTS id_empresa INTEGER REFERENCES public.empresa(id_empresa) ON DELETE RESTRICT;

ALTER TABLE public.licencia_medica
    ADD COLUMN IF NOT EXISTS id_ingreso INT REFERENCES public.licencia_medica_ingreso_correo(id_ingreso) ON DELETE SET NULL;

ALTER TABLE public.licencia_medica
    ADD COLUMN IF NOT EXISTS origen VARCHAR(20) NOT NULL DEFAULT 'manual'
        CHECK (origen IN ('correo', 'manual'));

ALTER TABLE public.licencia_medica
    ALTER COLUMN id_persona DROP NOT NULL;

ALTER TABLE public.licencia_medica
    ALTER COLUMN folio DROP NOT NULL;

ALTER TABLE public.licencia_medica
    ALTER COLUMN tipo DROP NOT NULL;

ALTER TABLE public.licencia_medica
    ALTER COLUMN fecha_inicio DROP NOT NULL;

ALTER TABLE public.licencia_medica
    ALTER COLUMN fecha_termino DROP NOT NULL;

ALTER TABLE public.licencia_medica
    ALTER COLUMN dias DROP NOT NULL;

ALTER TABLE public.licencia_medica
    DROP CONSTRAINT IF EXISTS licencia_medica_dias_check;

ALTER TABLE public.licencia_medica
    ADD CONSTRAINT chk_licencia_medica_dias_positivo
        CHECK (dias IS NULL OR dias > 0);

ALTER TABLE public.licencia_medica
    DROP CONSTRAINT IF EXISTS chk_licencia_medica_fechas;

ALTER TABLE public.licencia_medica
    ADD CONSTRAINT chk_licencia_medica_fechas
        CHECK (
            fecha_inicio IS NULL
            OR fecha_termino IS NULL
            OR fecha_termino >= fecha_inicio
        );

ALTER TABLE public.licencia_medica
    ALTER COLUMN estado SET DEFAULT 'pendiente_revision';

-- Backfill id_empresa desde contrato o persona cuando sea posible
UPDATE public.licencia_medica lm
SET id_empresa = COALESCE(
    (SELECT c.id_empresa FROM public.contrato c WHERE c.id_contrato = lm.id_contrato LIMIT 1),
    (SELECT MIN(c2.id_empresa) FROM public.contrato c2 WHERE c2.id_persona = lm.id_persona)
)
WHERE lm.id_empresa IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_licencia_medica_empresa_folio
    ON public.licencia_medica (id_empresa, folio)
    WHERE folio IS NOT NULL AND btrim(folio) <> '';

CREATE INDEX IF NOT EXISTS idx_licencia_medica_empresa_estado
    ON public.licencia_medica (id_empresa, estado);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.licencia_medica_ingreso_correo ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS licencia_medica_rw_authenticated ON public.licencia_medica;

CREATE POLICY licencia_medica_select_empresa ON public.licencia_medica
    FOR SELECT TO authenticated
    USING (id_empresa = public.current_user_empresa_id());

CREATE POLICY licencia_medica_insert_empresa ON public.licencia_medica
    FOR INSERT TO authenticated
    WITH CHECK (id_empresa = public.current_user_empresa_id());

CREATE POLICY licencia_medica_update_empresa ON public.licencia_medica
    FOR UPDATE TO authenticated
    USING (id_empresa = public.current_user_empresa_id())
    WITH CHECK (id_empresa = public.current_user_empresa_id());

CREATE POLICY licencia_medica_delete_empresa ON public.licencia_medica
    FOR DELETE TO authenticated
    USING (id_empresa = public.current_user_empresa_id());

CREATE POLICY lm_ingreso_select_empresa ON public.licencia_medica_ingreso_correo
    FOR SELECT TO authenticated
    USING (id_empresa = public.current_user_empresa_id());

CREATE POLICY lm_ingreso_update_empresa ON public.licencia_medica_ingreso_correo
    FOR UPDATE TO authenticated
    USING (id_empresa = public.current_user_empresa_id())
    WITH CHECK (id_empresa = public.current_user_empresa_id());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.licencia_medica TO authenticated;
GRANT SELECT, UPDATE ON public.licencia_medica_ingreso_correo TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.licencia_medica_id_licencia_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.licencia_medica_ingreso_correo_id_ingreso_seq TO authenticated;

-- ---------------------------------------------------------------------------
-- RPC: listar
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.listar_licencias_medicas(
    p_estado TEXT DEFAULT NULL,
    p_desde DATE DEFAULT NULL,
    p_hasta DATE DEFAULT NULL
)
RETURNS SETOF public.licencia_medica
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id_empresa INTEGER;
BEGIN
    v_id_empresa := public.current_user_empresa_id();
    IF v_id_empresa IS NULL THEN
        RAISE EXCEPTION 'listar_licencias_medicas: empresa no identificada' USING ERRCODE = '42501';
    END IF;

    RETURN QUERY
    SELECT lm.*
    FROM public.licencia_medica lm
    WHERE lm.id_empresa = v_id_empresa
      AND (p_estado IS NULL OR btrim(p_estado) = '' OR lm.estado = p_estado)
      AND (p_desde IS NULL OR lm.fecha_inicio IS NULL OR lm.fecha_inicio >= p_desde)
      AND (p_hasta IS NULL OR lm.fecha_inicio IS NULL OR lm.fecha_inicio <= p_hasta)
    ORDER BY lm.fecha_creacion DESC, lm.id_licencia DESC;
END;
$$;

-- ---------------------------------------------------------------------------
-- RPC: obtener
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.obtener_licencia_medica(p_id_licencia INT)
RETURNS public.licencia_medica
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id_empresa INTEGER;
    v_row public.licencia_medica;
BEGIN
    v_id_empresa := public.current_user_empresa_id();
    IF v_id_empresa IS NULL THEN
        RAISE EXCEPTION 'obtener_licencia_medica: empresa no identificada' USING ERRCODE = '42501';
    END IF;

    SELECT * INTO v_row
    FROM public.licencia_medica
    WHERE id_licencia = p_id_licencia
      AND id_empresa = v_id_empresa;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'obtener_licencia_medica: licencia no encontrada' USING ERRCODE = 'P0002';
    END IF;

    RETURN v_row;
END;
$$;

-- ---------------------------------------------------------------------------
-- RPC: guardar (insert/update)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guardar_licencia_medica(
    p_id_licencia INT DEFAULT NULL,
    p_id_persona INT DEFAULT NULL,
    p_id_contrato INT DEFAULT NULL,
    p_folio TEXT DEFAULT NULL,
    p_tipo TEXT DEFAULT NULL,
    p_fecha_inicio DATE DEFAULT NULL,
    p_fecha_termino DATE DEFAULT NULL,
    p_dias NUMERIC DEFAULT NULL,
    p_estado TEXT DEFAULT NULL,
    p_monto_subsidio NUMERIC DEFAULT NULL,
    p_observacion TEXT DEFAULT NULL,
    p_origen TEXT DEFAULT 'manual',
    p_id_ingreso INT DEFAULT NULL
)
RETURNS public.licencia_medica
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id_empresa INTEGER;
    v_row public.licencia_medica;
    v_estado TEXT;
BEGIN
    v_id_empresa := public.current_user_empresa_id();
    IF v_id_empresa IS NULL THEN
        RAISE EXCEPTION 'guardar_licencia_medica: empresa no identificada' USING ERRCODE = '42501';
    END IF;

    v_estado := COALESCE(NULLIF(btrim(p_estado), ''), 'pendiente_revision');

    IF p_id_licencia IS NOT NULL THEN
        UPDATE public.licencia_medica
        SET
            id_persona = COALESCE(p_id_persona, id_persona),
            id_contrato = COALESCE(p_id_contrato, id_contrato),
            folio = COALESCE(NULLIF(btrim(p_folio), ''), folio),
            tipo = COALESCE(NULLIF(btrim(p_tipo), ''), tipo),
            fecha_inicio = COALESCE(p_fecha_inicio, fecha_inicio),
            fecha_termino = COALESCE(p_fecha_termino, fecha_termino),
            dias = COALESCE(p_dias, dias),
            estado = v_estado,
            monto_subsidio = COALESCE(p_monto_subsidio, monto_subsidio),
            observacion = COALESCE(p_observacion, observacion),
            origen = COALESCE(NULLIF(btrim(p_origen), ''), origen),
            id_ingreso = COALESCE(p_id_ingreso, id_ingreso)
        WHERE id_licencia = p_id_licencia
          AND id_empresa = v_id_empresa
        RETURNING * INTO v_row;
    ELSE
        INSERT INTO public.licencia_medica (
            id_empresa,
            id_persona,
            id_contrato,
            folio,
            tipo,
            fecha_inicio,
            fecha_termino,
            dias,
            estado,
            monto_subsidio,
            observacion,
            origen,
            id_ingreso,
            creado_por
        ) VALUES (
            v_id_empresa,
            p_id_persona,
            p_id_contrato,
            NULLIF(btrim(p_folio), ''),
            NULLIF(btrim(p_tipo), ''),
            p_fecha_inicio,
            p_fecha_termino,
            p_dias,
            v_estado,
            p_monto_subsidio,
            p_observacion,
            COALESCE(NULLIF(btrim(p_origen), ''), 'manual'),
            p_id_ingreso,
            auth.uid()
        )
        RETURNING * INTO v_row;
    END IF;

    IF v_row.id_licencia IS NULL THEN
        RAISE EXCEPTION 'guardar_licencia_medica: no fue posible persistir' USING ERRCODE = 'P0001';
    END IF;

    RETURN v_row;
END;
$$;

-- ---------------------------------------------------------------------------
-- RPC: confirmar (valida campos obligatorios; vínculo nómina en app)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.confirmar_licencia_medica(p_id_licencia INT)
RETURNS public.licencia_medica
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id_empresa INTEGER;
    v_row public.licencia_medica;
BEGIN
    v_id_empresa := public.current_user_empresa_id();
    IF v_id_empresa IS NULL THEN
        RAISE EXCEPTION 'confirmar_licencia_medica: empresa no identificada' USING ERRCODE = '42501';
    END IF;

    SELECT * INTO v_row
    FROM public.licencia_medica
    WHERE id_licencia = p_id_licencia
      AND id_empresa = v_id_empresa
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'confirmar_licencia_medica: licencia no encontrada' USING ERRCODE = 'P0002';
    END IF;

    IF v_row.id_persona IS NULL THEN
        RAISE EXCEPTION 'confirmar_licencia_medica: debe indicar trabajador' USING ERRCODE = '23514';
    END IF;
    IF v_row.folio IS NULL OR btrim(v_row.folio) = '' THEN
        RAISE EXCEPTION 'confirmar_licencia_medica: debe indicar folio' USING ERRCODE = '23514';
    END IF;
    IF v_row.fecha_inicio IS NULL OR v_row.fecha_termino IS NULL THEN
        RAISE EXCEPTION 'confirmar_licencia_medica: debe indicar vigencia' USING ERRCODE = '23514';
    END IF;
    IF v_row.dias IS NULL OR v_row.dias <= 0 THEN
        RAISE EXCEPTION 'confirmar_licencia_medica: debe indicar días' USING ERRCODE = '23514';
    END IF;
    IF v_row.tipo IS NULL OR btrim(v_row.tipo) = '' THEN
        RAISE EXCEPTION 'confirmar_licencia_medica: debe indicar tipo' USING ERRCODE = '23514';
    END IF;

    UPDATE public.licencia_medica
    SET estado = 'registrada'
    WHERE id_licencia = p_id_licencia
    RETURNING * INTO v_row;

    IF v_row.id_ingreso IS NOT NULL THEN
        UPDATE public.licencia_medica_ingreso_correo
        SET estado = 'procesado', id_licencia = p_id_licencia
        WHERE id_ingreso = v_row.id_ingreso
          AND id_empresa = v_id_empresa;
    END IF;

    RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.marcar_licencia_medica_vinculada_nomina(p_id_licencia INT)
RETURNS public.licencia_medica
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id_empresa INTEGER;
    v_row public.licencia_medica;
BEGIN
    v_id_empresa := public.current_user_empresa_id();
    IF v_id_empresa IS NULL THEN
        RAISE EXCEPTION 'marcar_licencia_medica_vinculada_nomina: empresa no identificada' USING ERRCODE = '42501';
    END IF;

    UPDATE public.licencia_medica
    SET estado = 'vinculada_nomina'
    WHERE id_licencia = p_id_licencia
      AND id_empresa = v_id_empresa
    RETURNING * INTO v_row;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'marcar_licencia_medica_vinculada_nomina: licencia no encontrada' USING ERRCODE = 'P0002';
    END IF;

    RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.listar_licencias_medicas(TEXT, DATE, DATE) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.obtener_licencia_medica(INT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.guardar_licencia_medica(INT, INT, INT, TEXT, TEXT, DATE, DATE, NUMERIC, TEXT, NUMERIC, TEXT, TEXT, INT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.confirmar_licencia_medica(INT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.marcar_licencia_medica_vinculada_nomina(INT) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.listar_licencias_medicas(TEXT, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.obtener_licencia_medica(INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.guardar_licencia_medica(INT, INT, INT, TEXT, TEXT, DATE, DATE, NUMERIC, TEXT, NUMERIC, TEXT, TEXT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirmar_licencia_medica(INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.marcar_licencia_medica_vinculada_nomina(INT) TO authenticated;
