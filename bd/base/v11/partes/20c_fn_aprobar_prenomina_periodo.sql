-- PRENOMINA-APROBAR-01: aprobacion operativa controlada de la prenomina.
-- Reemplaza el UPDATE directo del repositorio Angular por una RPC con guardas server-side.
-- Valida integridad de los tres hashes (snapshot, parametros, entradas) y la existencia de
-- al menos un parametro congelado. No emite liquidaciones ni cierra periodo.

CREATE OR REPLACE FUNCTION public.fn_aprobar_prenomina_periodo(
    p_id_calculo_periodo BIGINT,
    p_periodo TEXT,
    p_hash_snapshot TEXT,
    p_hash_parametros TEXT,
    p_hash_entradas TEXT,
    p_advertencias JSONB DEFAULT '[]'::JSONB,
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
    v_total_parametros INT;
    v_preparacion_estado TEXT;
BEGIN
    v_usuario_id := auth.uid();
    IF v_usuario_id IS NULL THEN
        RAISE EXCEPTION 'Usuario authenticated requerido para aprobar la prenomina';
    END IF;

    SELECT *
    INTO v_snapshot
    FROM public.nomina_calculo_periodo
    WHERE id_calculo_periodo = p_id_calculo_periodo
      AND periodo = p_periodo
      AND activo = TRUE
      AND reemplazado_por IS NULL
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No existe snapshot activo vigente para aprobar';
    END IF;

    -- Idempotencia: si ya esta aprobada y no cerrada, devolver sin cambios.
    IF v_snapshot.aprobacion_operativa_estado = 'aprobado_operativamente'
       AND v_snapshot.cierre_operativo_estado IS NULL THEN
        RETURN v_snapshot;
    END IF;

    IF v_snapshot.cierre_operativo_estado IS NOT NULL THEN
        RAISE EXCEPTION 'La nomina ya esta cerrada operativamente; no puede aprobarse';
    END IF;

    IF COALESCE(v_snapshot.total_bloqueados, 0) > 0 THEN
        RAISE EXCEPTION 'El snapshot tiene trabajadores bloqueados; no puede aprobarse';
    END IF;

    IF v_snapshot.id_preparacion_nomina IS NOT NULL THEN
        SELECT estado
        INTO v_preparacion_estado
        FROM public.nomina_preparacion
        WHERE id_preparacion_nomina = v_snapshot.id_preparacion_nomina
          AND activo = TRUE
        FOR UPDATE;

        IF v_preparacion_estado IS NULL THEN
            RAISE EXCEPTION 'El snapshot referencia una preparacion inexistente o inactiva';
        END IF;

        IF v_preparacion_estado IN ('cerrada', 'anulada', 'liquidaciones_generadas') THEN
            RAISE EXCEPTION 'La preparacion no permite aprobacion en su estado actual';
        END IF;
    END IF;

    -- Existencia de los tres hashes en la fila congelada.
    IF NULLIF(v_snapshot.hash_snapshot, '') IS NULL THEN
        RAISE EXCEPTION 'Falta el hash del resultado en el snapshot';
    END IF;
    IF NULLIF(v_snapshot.hash_parametros, '') IS NULL THEN
        RAISE EXCEPTION 'Falta el hash de parametros en el snapshot';
    END IF;
    IF NULLIF(v_snapshot.hash_entradas, '') IS NULL THEN
        RAISE EXCEPTION 'Falta el hash de entradas en el snapshot';
    END IF;

    -- Coincidencia con los hashes esperados enviados por el cliente.
    IF NULLIF(p_hash_snapshot, '') IS NULL
       OR NULLIF(p_hash_parametros, '') IS NULL
       OR NULLIF(p_hash_entradas, '') IS NULL THEN
        RAISE EXCEPTION 'Debe enviar los tres hashes esperados (snapshot, parametros, entradas)';
    END IF;

    IF v_snapshot.hash_snapshot IS DISTINCT FROM p_hash_snapshot THEN
        RAISE EXCEPTION 'El hash del resultado no coincide; vuelve a guardar antes de aprobar';
    END IF;
    IF v_snapshot.hash_parametros IS DISTINCT FROM p_hash_parametros THEN
        RAISE EXCEPTION 'El hash de parametros no coincide; vuelve a guardar antes de aprobar';
    END IF;
    IF v_snapshot.hash_entradas IS DISTINCT FROM p_hash_entradas THEN
        RAISE EXCEPTION 'El hash de entradas no coincide; vuelve a guardar antes de aprobar';
    END IF;

    -- Debe existir al menos un parametro congelado.
    SELECT COUNT(*) INTO v_total_parametros
    FROM public.nomina_calculo_parametro
    WHERE id_calculo_periodo = p_id_calculo_periodo;

    IF COALESCE(v_total_parametros, 0) <= 0 THEN
        RAISE EXCEPTION 'No hay parametros congelados para el periodo; no puede aprobarse';
    END IF;

    v_usuario_label := COALESCE(NULLIF(auth.jwt() ->> 'email', ''), 'Usuario no disponible en esta sesion');

    UPDATE public.nomina_calculo_periodo
    SET
        aprobacion_operativa_estado = 'aprobado_operativamente',
        aprobacion_operativa_fecha = NOW(),
        aprobacion_operativa_usuario_id = v_usuario_id,
        aprobacion_operativa_usuario_label = v_usuario_label,
        aprobacion_operativa_advertencias = COALESCE(p_advertencias, '[]'::JSONB),
        aprobacion_operativa_metadata = COALESCE(p_metadata, '{}'::JSONB)
            || jsonb_build_object(
                'periodo', p_periodo,
                'idCalculoPeriodo', p_id_calculo_periodo,
                'hashSnapshot', v_snapshot.hash_snapshot,
                'hashParametros', v_snapshot.hash_parametros,
                'hashEntradas', v_snapshot.hash_entradas,
                'notaAlcance', 'Aprobacion operativa de prenomina. No emite liquidaciones ni cierra periodo.'
            ),
        updated_at = NOW()
    WHERE id_calculo_periodo = p_id_calculo_periodo
    RETURNING * INTO v_snapshot;

    IF v_snapshot.id_preparacion_nomina IS NOT NULL THEN
        UPDATE public.nomina_preparacion
        SET estado = 'confirmada',
            confirmada_at = COALESCE(confirmada_at, NOW()),
            confirmada_by = COALESCE(confirmada_by, v_usuario_id),
            metadata = COALESCE(metadata, '{}'::JSONB)
                || jsonb_build_object(
                    'idCalculoPeriodo', p_id_calculo_periodo,
                    'hashSnapshot', v_snapshot.hash_snapshot,
                    'hashParametros', v_snapshot.hash_parametros,
                    'hashEntradas', v_snapshot.hash_entradas
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
            'PREPARACION_CONFIRMADA',
            v_usuario_id,
            v_usuario_label,
            jsonb_build_object(
                'idCalculoPeriodo', p_id_calculo_periodo,
                'origen', 'fn_aprobar_prenomina_periodo'
            )
        );
    END IF;

    RETURN v_snapshot;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_aprobar_prenomina_periodo(BIGINT, TEXT, TEXT, TEXT, TEXT, JSONB, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fn_aprobar_prenomina_periodo(BIGINT, TEXT, TEXT, TEXT, TEXT, JSONB, JSONB) FROM anon;
GRANT EXECUTE ON FUNCTION public.fn_aprobar_prenomina_periodo(BIGINT, TEXT, TEXT, TEXT, TEXT, JSONB, JSONB) TO authenticated;
