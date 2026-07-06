-- LIQ-OFICIAL-01: generacion atomica de liquidaciones oficiales internas.
-- Orden del flujo: aprobar -> emitir (esta funcion) -> cerrar.
-- Copia/materializa un snapshot aprobado. No recalcula y no genera PDF/Previred/LRE/banco/contabilidad.

CREATE OR REPLACE FUNCTION public.generar_liquidaciones_oficiales(
    p_id_calculo_periodo BIGINT,
    p_periodo TEXT,
    p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS public.nomina_liquidacion_periodo
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    v_snapshot public.nomina_calculo_periodo%ROWTYPE;
    v_liquidacion public.nomina_liquidacion_periodo%ROWTYPE;
    v_usuario_id UUID;
    v_usuario_label TEXT;
    v_total_trabajadores INT;
    v_preparacion public.nomina_preparacion%ROWTYPE;
    v_tipo_liquidacion TEXT;
BEGIN
    v_usuario_id := auth.uid();

    IF v_usuario_id IS NULL THEN
        RAISE EXCEPTION 'Usuario authenticated requerido para generar liquidaciones oficiales';
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
        RAISE EXCEPTION 'No existe snapshot activo vigente para el periodo';
    END IF;

    IF v_snapshot.aprobacion_operativa_estado IS DISTINCT FROM 'aprobado_operativamente' THEN
        RAISE EXCEPTION 'El snapshot debe estar aprobado operativamente';
    END IF;

    -- El cierre es el bloqueo final del flujo: se emite antes de cerrar.
    IF v_snapshot.cierre_operativo_estado IS NOT NULL THEN
        RAISE EXCEPTION 'La nomina ya esta cerrada; no se pueden emitir nuevas liquidaciones';
    END IF;

    IF v_snapshot.id_preparacion_nomina IS NOT NULL THEN
        SELECT *
        INTO v_preparacion
        FROM public.nomina_preparacion
        WHERE id_preparacion_nomina = v_snapshot.id_preparacion_nomina
          AND activo = TRUE
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'El snapshot referencia una preparacion inexistente o inactiva';
        END IF;

        IF v_preparacion.estado IS DISTINCT FROM 'confirmada' THEN
            RAISE EXCEPTION 'La preparacion debe estar confirmada antes de generar liquidaciones';
        END IF;

        IF v_preparacion.tipo_preparacion NOT IN ('mensualCompleta', 'porCentroCosto', 'seleccionManual') THEN
            RAISE EXCEPTION 'El tipo de preparacion requiere adaptador de liquidacion antes de generar documentos';
        END IF;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.nomina_liquidacion_periodo
        WHERE id_calculo_periodo = p_id_calculo_periodo
          AND activo = TRUE
    ) THEN
        RAISE EXCEPTION 'Ya existen liquidaciones oficiales activas para este snapshot';
    END IF;

    SELECT COUNT(*)
    INTO v_total_trabajadores
    FROM public.nomina_calculo_trabajador
    WHERE id_calculo_periodo = p_id_calculo_periodo;

    IF COALESCE(v_total_trabajadores, 0) <= 0 THEN
        RAISE EXCEPTION 'No existen trabajadores calculados en el snapshot';
    END IF;

    v_usuario_label := COALESCE(NULLIF(auth.jwt() ->> 'email', ''), 'Usuario no disponible en esta sesion');
    v_tipo_liquidacion := CASE
        WHEN v_snapshot.tipo_preparacion IN ('complementaria', 'reproceso', 'retroactiva', 'finiquito', 'especial')
            THEN v_snapshot.tipo_preparacion
        ELSE 'mensual'
    END;

    INSERT INTO public.nomina_liquidacion_periodo (
        id_empresa,
        periodo,
        id_calculo_periodo,
        id_preparacion_nomina,
        tipo_liquidacion,
        version,
        estado,
        usuario_generacion_id,
        usuario_generacion_label,
        total_trabajadores,
        total_haberes,
        total_descuentos,
        total_liquido,
        metadata
    )
    VALUES (
        v_snapshot.id_empresa,
        v_snapshot.periodo,
        v_snapshot.id_calculo_periodo,
        v_snapshot.id_preparacion_nomina,
        v_tipo_liquidacion,
        1,
        'generada',
        v_usuario_id,
        v_usuario_label,
        v_snapshot.total_trabajadores,
        v_snapshot.total_haberes,
        v_snapshot.total_descuentos,
        v_snapshot.total_liquido,
        COALESCE(p_metadata, '{}'::JSONB)
            || jsonb_build_object(
                'origen', 'nomina_calculo_periodo',
                'idPreparacionNomina', v_snapshot.id_preparacion_nomina,
                'tipoPreparacion', v_snapshot.tipo_preparacion,
                'tipoLiquidacion', v_tipo_liquidacion,
                'idCalculoPeriodo', v_snapshot.id_calculo_periodo,
                'versionMotor', v_snapshot.version_motor,
                'hashSnapshot', v_snapshot.hash_snapshot,
                'notaAlcance', 'Liquidacion oficial interna generada desde snapshot aprobado; no recalcula montos.'
            )
    )
    RETURNING * INTO v_liquidacion;

    INSERT INTO public.nomina_liquidacion_trabajador (
        id_liquidacion_periodo,
        id_calculo_periodo,
        id_persona,
        rut,
        nombre_trabajador,
        base_imponible,
        base_tributable,
        total_haberes,
        total_descuentos,
        total_aportes_empleador_referencia,
        liquido_pagar,
        estado,
        observaciones,
        metadata
    )
    SELECT
        v_liquidacion.id_liquidacion_periodo,
        t.id_calculo_periodo,
        t.id_persona,
        t.rut,
        t.nombre_completo_snapshot,
        t.base_imponible_previsional,
        t.base_tributable,
        t.total_haberes_imponibles + t.total_haberes_no_imponibles,
        t.total_descuentos_legales + t.total_descuentos_voluntarios + t.impuesto_unico,
        t.cotizacion_sis + t.cotizacion_sanna + t.cotizacion_ley_16744_empleador,
        t.liquido_preliminar,
        'generada',
        COALESCE(obs.observaciones, '[]'::JSONB),
        jsonb_build_object(
            'idCalculoTrabajador', t.id_calculo_trabajador,
            'estadoSnapshot', t.estado,
            'sueldoBase', t.sueldo_base,
            'cotizacionAfp', t.cotizacion_afp,
            'cotizacionSalud', t.cotizacion_salud,
            'cotizacionAfc', t.cotizacion_afc,
            'camposNoDisponiblesEnSnapshot', ARRAY['id_contrato', 'cargo', 'centro_costo', 'fecha_ingreso', 'dias_trabajados']
        )
    FROM public.nomina_calculo_trabajador t
    LEFT JOIN LATERAL (
        SELECT jsonb_agg(
            jsonb_build_object(
                'codigo', i.codigo,
                'severidad', i.severidad,
                'origen', i.origen,
                'mensaje', i.mensaje,
                'campo', i.campo,
                'entidadId', i.entidad_id
            )
            ORDER BY i.id_issue
        ) AS observaciones
        FROM public.nomina_calculo_issue i
        WHERE i.id_calculo_trabajador = t.id_calculo_trabajador
    ) obs ON TRUE
    WHERE t.id_calculo_periodo = p_id_calculo_periodo;

    INSERT INTO public.nomina_liquidacion_concepto (
        id_liquidacion_trabajador,
        id_concepto,
        codigo,
        codigo_lre,
        nombre,
        tipo,
        clasificacion,
        monto,
        orden,
        metadata
    )
    SELECT
        lt.id_liquidacion_trabajador,
        c.id_concepto,
        NULL::TEXT,
        c.codigo_lre_snapshot,
        c.nombre_concepto_snapshot,
        c.tipo,
        CASE
            WHEN c.tipo = 'haber' AND c.imponible AND c.tributable THEN 'haber_imponible_tributable'
            WHEN c.tipo = 'haber' AND c.imponible THEN 'haber_imponible'
            WHEN c.tipo = 'haber' THEN 'haber_no_imponible'
            WHEN c.tipo = 'descuento' THEN 'descuento'
            WHEN c.tipo = 'cotizacion' THEN 'aporte_referencia'
            WHEN c.tipo = 'impuesto' THEN 'impuesto'
            ELSE NULL
        END,
        c.monto,
        ROW_NUMBER() OVER (
            PARTITION BY c.id_calculo_trabajador
            ORDER BY c.id_calculo_concepto
        )::INT,
        jsonb_build_object(
            'idCalculoConcepto', c.id_calculo_concepto,
            'origen', c.origen,
            'imponible', c.imponible,
            'tributable', c.tributable,
            'afectaLiquido', c.afecta_liquido,
            'trazabilidad', c.trazabilidad_json
        )
    FROM public.nomina_calculo_concepto c
    JOIN public.nomina_calculo_trabajador ct
      ON ct.id_calculo_trabajador = c.id_calculo_trabajador
    JOIN public.nomina_liquidacion_trabajador lt
      ON lt.id_liquidacion_periodo = v_liquidacion.id_liquidacion_periodo
     AND lt.metadata ->> 'idCalculoTrabajador' = ct.id_calculo_trabajador::TEXT
    WHERE ct.id_calculo_periodo = p_id_calculo_periodo;

    IF v_snapshot.id_preparacion_nomina IS NOT NULL THEN
        UPDATE public.nomina_preparacion
        SET estado = 'liquidaciones_generadas',
            metadata = COALESCE(metadata, '{}'::JSONB)
                || jsonb_build_object(
                    'idLiquidacionPeriodo', v_liquidacion.id_liquidacion_periodo,
                    'tipoLiquidacion', v_tipo_liquidacion
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
            'LIQUIDACIONES_GENERADAS',
            v_usuario_id,
            v_usuario_label,
            jsonb_build_object(
                'idCalculoPeriodo', p_id_calculo_periodo,
                'idLiquidacionPeriodo', v_liquidacion.id_liquidacion_periodo,
                'tipoLiquidacion', v_tipo_liquidacion
            )
        );
    END IF;

    RETURN v_liquidacion;
END;
$$;

REVOKE ALL ON FUNCTION public.generar_liquidaciones_oficiales(BIGINT, TEXT, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.generar_liquidaciones_oficiales(BIGINT, TEXT, JSONB) FROM anon;
GRANT EXECUTE ON FUNCTION public.generar_liquidaciones_oficiales(BIGINT, TEXT, JSONB) TO authenticated;
