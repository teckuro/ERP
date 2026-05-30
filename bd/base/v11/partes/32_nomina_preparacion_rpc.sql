-- NOM-PREP-03: RPC base para preparaciones/lotes de nomina.
-- No calcula nomina ni genera liquidaciones. Solo crea, define alcance,
-- confirma/anula preparaciones y registra eventos de trazabilidad.

SET search_path = public;

CREATE OR REPLACE FUNCTION public.crear_nomina_preparacion(
    p_periodo_pago TEXT,
    p_id_empresa INT,
    p_tipo_preparacion TEXT DEFAULT 'mensualCompleta',
    p_metodo_alcance TEXT DEFAULT 'todaEmpresa',
    p_periodo_origen TEXT DEFAULT NULL,
    p_id_preparacion_origen BIGINT DEFAULT NULL,
    p_id_calculo_origen INT DEFAULT NULL,
    p_id_liquidacion_origen BIGINT DEFAULT NULL,
    p_modo_reproceso TEXT DEFAULT NULL,
    p_motivo TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS public.nomina_preparacion
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    v_preparacion public.nomina_preparacion%ROWTYPE;
    v_usuario_id UUID;
    v_usuario_label TEXT;
BEGIN
    v_usuario_id := auth.uid();
    IF v_usuario_id IS NULL THEN
        RAISE EXCEPTION 'Usuario authenticated requerido para crear preparacion de nomina';
    END IF;

    IF p_periodo_pago IS NULL OR p_periodo_pago !~ '^[0-9]{4}-(0[1-9]|1[0-2])$' THEN
        RAISE EXCEPTION 'Periodo de pago invalido';
    END IF;

    IF p_id_empresa IS NULL THEN
        RAISE EXCEPTION 'Empresa requerida para crear preparacion de nomina';
    END IF;

    IF p_metadata IS NULL OR jsonb_typeof(p_metadata) <> 'object' THEN
        RAISE EXCEPTION 'Metadata de preparacion invalida';
    END IF;

    IF p_tipo_preparacion = 'porCentroCosto'
       AND NOT (p_metadata ? 'idCentroCosto' OR p_metadata ? 'centroCosto') THEN
        RAISE EXCEPTION 'Preparacion por centro de costo requiere centro de costo en metadata';
    END IF;

    IF p_tipo_preparacion = 'complementaria'
       AND NULLIF(BTRIM(COALESCE(p_motivo, '')), '') IS NULL THEN
        RAISE EXCEPTION 'Preparacion complementaria requiere motivo';
    END IF;

    IF p_tipo_preparacion = 'reproceso'
       AND p_id_preparacion_origen IS NULL
       AND p_id_calculo_origen IS NULL
       AND p_id_liquidacion_origen IS NULL THEN
        RAISE EXCEPTION 'Reproceso requiere preparacion, calculo o liquidacion origen';
    END IF;

    IF p_tipo_preparacion = 'retroactiva'
       AND (p_periodo_origen IS NULL OR p_periodo_origen !~ '^[0-9]{4}-(0[1-9]|1[0-2])$') THEN
        RAISE EXCEPTION 'Retroactiva requiere periodo origen valido';
    END IF;

    IF p_tipo_preparacion = 'finiquito'
       AND NOT (p_metadata ? 'idPersona' AND p_metadata ? 'idContrato' AND p_metadata ? 'fechaTermino') THEN
        RAISE EXCEPTION 'Finiquito requiere idPersona, idContrato y fechaTermino en metadata';
    END IF;

    IF p_tipo_preparacion = 'especial'
       AND NULLIF(BTRIM(COALESCE(p_motivo, '')), '') IS NULL THEN
        RAISE EXCEPTION 'Preparacion especial requiere motivo';
    END IF;

    v_usuario_label := COALESCE(NULLIF(auth.jwt() ->> 'email', ''), 'Usuario no disponible en esta sesion');

    INSERT INTO public.nomina_preparacion (
        periodo_pago,
        periodo_origen,
        id_empresa,
        tipo_preparacion,
        metodo_alcance,
        estado,
        id_preparacion_origen,
        id_calculo_origen,
        id_liquidacion_origen,
        modo_reproceso,
        motivo,
        metadata,
        created_by,
        created_by_label
    )
    VALUES (
        p_periodo_pago,
        NULLIF(p_periodo_origen, ''),
        p_id_empresa,
        p_tipo_preparacion,
        p_metodo_alcance,
        'borrador',
        p_id_preparacion_origen,
        p_id_calculo_origen,
        p_id_liquidacion_origen,
        NULLIF(p_modo_reproceso, ''),
        NULLIF(BTRIM(COALESCE(p_motivo, '')), ''),
        p_metadata,
        v_usuario_id,
        v_usuario_label
    )
    RETURNING * INTO v_preparacion;

    INSERT INTO public.nomina_preparacion_evento (
        id_preparacion_nomina,
        tipo_evento,
        usuario_id,
        usuario_label,
        metadata
    )
    VALUES (
        v_preparacion.id_preparacion_nomina,
        'PREPARACION_CREADA',
        v_usuario_id,
        v_usuario_label,
        jsonb_build_object(
            'periodoPago', v_preparacion.periodo_pago,
            'tipoPreparacion', v_preparacion.tipo_preparacion,
            'metodoAlcance', v_preparacion.metodo_alcance
        )
    );

    RETURN v_preparacion;
END;
$$;

CREATE OR REPLACE FUNCTION public.definir_alcance_nomina_preparacion(
    p_id_preparacion_nomina BIGINT,
    p_trabajadores JSONB,
    p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS public.nomina_preparacion
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    v_preparacion public.nomina_preparacion%ROWTYPE;
    v_usuario_id UUID;
    v_usuario_label TEXT;
    v_item JSONB;
    v_total INT;
BEGIN
    v_usuario_id := auth.uid();
    IF v_usuario_id IS NULL THEN
        RAISE EXCEPTION 'Usuario authenticated requerido para definir alcance de nomina';
    END IF;

    IF p_trabajadores IS NULL OR jsonb_typeof(p_trabajadores) <> 'array' THEN
        RAISE EXCEPTION 'Trabajadores de alcance invalidos';
    END IF;

    SELECT *
    INTO v_preparacion
    FROM public.nomina_preparacion
    WHERE id_preparacion_nomina = p_id_preparacion_nomina
      AND activo = TRUE
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No existe preparacion activa para definir alcance';
    END IF;

    IF v_preparacion.estado IN ('confirmada', 'liquidaciones_generadas', 'cerrada', 'anulada') THEN
        RAISE EXCEPTION 'La preparacion no permite modificar alcance en su estado actual';
    END IF;

    UPDATE public.nomina_preparacion_trabajador
    SET estado = 'omitido',
        motivo = COALESCE(motivo, 'Reemplazado por nueva definicion de alcance'),
        updated_at = NOW()
    WHERE id_preparacion_nomina = p_id_preparacion_nomina
      AND estado <> 'omitido';

    FOR v_item IN SELECT value FROM jsonb_array_elements(p_trabajadores)
    LOOP
        IF NULLIF(v_item->>'id_persona', '') IS NULL THEN
            RAISE EXCEPTION 'Trabajador de alcance sin id_persona';
        END IF;

        INSERT INTO public.nomina_preparacion_trabajador (
            id_preparacion_nomina,
            id_persona,
            id_contrato,
            estado,
            motivo,
            metadata
        )
        VALUES (
            p_id_preparacion_nomina,
            (v_item->>'id_persona')::INT,
            NULLIF(v_item->>'id_contrato', '')::INT,
            COALESCE(NULLIF(v_item->>'estado', ''), 'incluido'),
            NULLIF(v_item->>'motivo', ''),
            CASE
                WHEN v_item ? 'metadata' AND jsonb_typeof(v_item->'metadata') = 'object'
                    THEN v_item->'metadata'
                ELSE '{}'::JSONB
            END
        );
    END LOOP;

    SELECT COUNT(*)
    INTO v_total
    FROM public.nomina_preparacion_trabajador
    WHERE id_preparacion_nomina = p_id_preparacion_nomina
      AND estado IN ('incluido', 'listo', 'advertencia', 'calculado');

    IF COALESCE(v_total, 0) <= 0 THEN
        RAISE EXCEPTION 'La preparacion debe incluir al menos un trabajador';
    END IF;

    v_usuario_label := COALESCE(NULLIF(auth.jwt() ->> 'email', ''), 'Usuario no disponible en esta sesion');

    UPDATE public.nomina_preparacion
    SET estado = 'alcance_definido',
        metadata = COALESCE(metadata, '{}'::JSONB)
            || COALESCE(p_metadata, '{}'::JSONB)
            || jsonb_build_object('totalTrabajadoresAlcance', v_total),
        updated_at = NOW()
    WHERE id_preparacion_nomina = p_id_preparacion_nomina
    RETURNING * INTO v_preparacion;

    INSERT INTO public.nomina_preparacion_evento (
        id_preparacion_nomina,
        tipo_evento,
        usuario_id,
        usuario_label,
        metadata
    )
    VALUES (
        p_id_preparacion_nomina,
        'ALCANCE_DEFINIDO',
        v_usuario_id,
        v_usuario_label,
        jsonb_build_object('totalTrabajadores', v_total)
    );

    RETURN v_preparacion;
END;
$$;

CREATE OR REPLACE FUNCTION public.confirmar_nomina_preparacion(
    p_id_preparacion_nomina BIGINT,
    p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS public.nomina_preparacion
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    v_preparacion public.nomina_preparacion%ROWTYPE;
    v_usuario_id UUID;
    v_usuario_label TEXT;
    v_total_bloqueados INT;
    v_total_incluidos INT;
BEGIN
    v_usuario_id := auth.uid();
    IF v_usuario_id IS NULL THEN
        RAISE EXCEPTION 'Usuario authenticated requerido para confirmar preparacion de nomina';
    END IF;

    SELECT *
    INTO v_preparacion
    FROM public.nomina_preparacion
    WHERE id_preparacion_nomina = p_id_preparacion_nomina
      AND activo = TRUE
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No existe preparacion activa para confirmar';
    END IF;

    IF v_preparacion.estado IN ('cerrada', 'anulada') THEN
        RAISE EXCEPTION 'La preparacion no puede confirmarse en su estado actual';
    END IF;

    SELECT COUNT(*)
    INTO v_total_bloqueados
    FROM public.nomina_preparacion_trabajador
    WHERE id_preparacion_nomina = p_id_preparacion_nomina
      AND estado = 'bloqueado';

    IF COALESCE(v_total_bloqueados, 0) > 0 THEN
        RAISE EXCEPTION 'La preparacion tiene trabajadores bloqueados';
    END IF;

    SELECT COUNT(*)
    INTO v_total_incluidos
    FROM public.nomina_preparacion_trabajador
    WHERE id_preparacion_nomina = p_id_preparacion_nomina
      AND estado IN ('incluido', 'listo', 'advertencia', 'calculado');

    IF COALESCE(v_total_incluidos, 0) <= 0 THEN
        RAISE EXCEPTION 'La preparacion no tiene trabajadores incluidos';
    END IF;

    v_usuario_label := COALESCE(NULLIF(auth.jwt() ->> 'email', ''), 'Usuario no disponible en esta sesion');

    UPDATE public.nomina_preparacion
    SET estado = 'confirmada',
        confirmada_at = COALESCE(confirmada_at, NOW()),
        confirmada_by = COALESCE(confirmada_by, v_usuario_id),
        metadata = COALESCE(metadata, '{}'::JSONB) || COALESCE(p_metadata, '{}'::JSONB),
        updated_at = NOW()
    WHERE id_preparacion_nomina = p_id_preparacion_nomina
    RETURNING * INTO v_preparacion;

    INSERT INTO public.nomina_preparacion_evento (
        id_preparacion_nomina,
        tipo_evento,
        usuario_id,
        usuario_label,
        metadata
    )
    VALUES (
        p_id_preparacion_nomina,
        'PREPARACION_CONFIRMADA',
        v_usuario_id,
        v_usuario_label,
        jsonb_build_object('totalTrabajadores', v_total_incluidos)
    );

    RETURN v_preparacion;
END;
$$;

CREATE OR REPLACE FUNCTION public.anular_nomina_preparacion(
    p_id_preparacion_nomina BIGINT,
    p_motivo TEXT,
    p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS public.nomina_preparacion
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    v_preparacion public.nomina_preparacion%ROWTYPE;
    v_usuario_id UUID;
    v_usuario_label TEXT;
BEGIN
    v_usuario_id := auth.uid();
    IF v_usuario_id IS NULL THEN
        RAISE EXCEPTION 'Usuario authenticated requerido para anular preparacion de nomina';
    END IF;

    IF NULLIF(BTRIM(COALESCE(p_motivo, '')), '') IS NULL THEN
        RAISE EXCEPTION 'Motivo requerido para anular preparacion';
    END IF;

    SELECT *
    INTO v_preparacion
    FROM public.nomina_preparacion
    WHERE id_preparacion_nomina = p_id_preparacion_nomina
      AND activo = TRUE
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No existe preparacion activa para anular';
    END IF;

    v_usuario_label := COALESCE(NULLIF(auth.jwt() ->> 'email', ''), 'Usuario no disponible en esta sesion');

    UPDATE public.nomina_preparacion
    SET estado = 'anulada',
        activo = FALSE,
        anulada_at = NOW(),
        anulada_by = v_usuario_id,
        motivo_anulacion = NULLIF(BTRIM(COALESCE(p_motivo, '')), ''),
        metadata = COALESCE(metadata, '{}'::JSONB) || COALESCE(p_metadata, '{}'::JSONB),
        updated_at = NOW()
    WHERE id_preparacion_nomina = p_id_preparacion_nomina
    RETURNING * INTO v_preparacion;

    INSERT INTO public.nomina_preparacion_evento (
        id_preparacion_nomina,
        tipo_evento,
        usuario_id,
        usuario_label,
        metadata
    )
    VALUES (
        p_id_preparacion_nomina,
        'PREPARACION_ANULADA',
        v_usuario_id,
        v_usuario_label,
        jsonb_build_object('motivo', p_motivo)
    );

    RETURN v_preparacion;
END;
$$;

REVOKE ALL ON FUNCTION public.crear_nomina_preparacion(TEXT, INT, TEXT, TEXT, TEXT, BIGINT, INT, BIGINT, TEXT, TEXT, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.crear_nomina_preparacion(TEXT, INT, TEXT, TEXT, TEXT, BIGINT, INT, BIGINT, TEXT, TEXT, JSONB) FROM anon;
GRANT EXECUTE ON FUNCTION public.crear_nomina_preparacion(TEXT, INT, TEXT, TEXT, TEXT, BIGINT, INT, BIGINT, TEXT, TEXT, JSONB) TO authenticated;

REVOKE ALL ON FUNCTION public.definir_alcance_nomina_preparacion(BIGINT, JSONB, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.definir_alcance_nomina_preparacion(BIGINT, JSONB, JSONB) FROM anon;
GRANT EXECUTE ON FUNCTION public.definir_alcance_nomina_preparacion(BIGINT, JSONB, JSONB) TO authenticated;

REVOKE ALL ON FUNCTION public.confirmar_nomina_preparacion(BIGINT, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.confirmar_nomina_preparacion(BIGINT, JSONB) FROM anon;
GRANT EXECUTE ON FUNCTION public.confirmar_nomina_preparacion(BIGINT, JSONB) TO authenticated;

REVOKE ALL ON FUNCTION public.anular_nomina_preparacion(BIGINT, TEXT, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.anular_nomina_preparacion(BIGINT, TEXT, JSONB) FROM anon;
GRANT EXECUTE ON FUNCTION public.anular_nomina_preparacion(BIGINT, TEXT, JSONB) TO authenticated;
