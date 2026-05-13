-- ============================================================
-- HISTORIAL DE EMPLEADO
-- Generado desde crear_sql_v6_11_integrada.sql. No editar a mano si se regenera.
-- ============================================================
SET search_path = public;

CREATE TABLE IF NOT EXISTS public.empleado_historial (
    id_historial BIGSERIAL PRIMARY KEY,
    id_persona INTEGER NOT NULL REFERENCES public.persona(id_persona) ON DELETE CASCADE,
    id_contrato INTEGER NULL REFERENCES public.contrato(id_contrato) ON DELETE SET NULL,
    seccion TEXT NOT NULL,
    evento TEXT NOT NULL,
    tabla_origen TEXT NOT NULL,
    id_registro INTEGER NULL,
    operacion TEXT NOT NULL CHECK (operacion IN ('INSERT', 'UPDATE', 'DELETE')),
    campos_modificados TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    datos_antes JSONB NULL,
    datos_despues JSONB NULL,
    usuario TEXT NULL,
    fecha TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS empleado_historial_persona_fecha_idx
    ON public.empleado_historial (id_persona, fecha DESC);

CREATE INDEX IF NOT EXISTS empleado_historial_contrato_fecha_idx
    ON public.empleado_historial (id_contrato, fecha DESC)
    WHERE id_contrato IS NOT NULL;

CREATE INDEX IF NOT EXISTS empleado_historial_seccion_fecha_idx
    ON public.empleado_historial (seccion, fecha DESC);

COMMENT ON TABLE public.empleado_historial IS
    'Auditoria funcional de cambios realizados sobre la ficha de empleado.';

COMMENT ON COLUMN public.empleado_historial.campos_modificados IS
    'Columnas que cambiaron entre el registro anterior y el nuevo.';

COMMENT ON COLUMN public.empleado_historial.datos_antes IS
    'Snapshot JSON del registro antes del cambio. Null para INSERT.';

COMMENT ON COLUMN public.empleado_historial.datos_despues IS
    'Snapshot JSON del registro despues del cambio. Null para DELETE.';

CREATE OR REPLACE FUNCTION public.empleado_historial_changed_fields(
    p_old JSONB,
    p_new JSONB
)
RETURNS TEXT[]
LANGUAGE SQL
IMMUTABLE
AS $$
    WITH keys AS (
        SELECT jsonb_object_keys(COALESCE(p_old, '{}'::JSONB) || COALESCE(p_new, '{}'::JSONB)) AS key
    )
    SELECT COALESCE(array_agg(key ORDER BY key), ARRAY[]::TEXT[])
    FROM keys
    WHERE COALESCE(p_old -> key, 'null'::JSONB) IS DISTINCT FROM COALESCE(p_new -> key, 'null'::JSONB);
$$;

CREATE OR REPLACE FUNCTION public.empleado_historial_tabla_seccion(p_tabla TEXT)
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
AS $$
    SELECT CASE p_tabla
        WHEN 'persona' THEN 'General'
        WHEN 'contrato' THEN 'Laboral'
        WHEN 'contrato_centro_costo' THEN 'Laboral'
        WHEN 'remuneracion' THEN 'Remuneracion'
        WHEN 'semana_corrida' THEN 'Remuneracion'
        WHEN 'zona_extrema' THEN 'Remuneracion'
        WHEN 'prevision' THEN 'Prevision y Salud'
        WHEN 'salud_trabajador' THEN 'Prevision y Salud'
        WHEN 'cuenta2_afp' THEN 'Prevision y Salud'
        WHEN 'apv' THEN 'Prevision y Salud'
        WHEN 'cuenta_bancaria' THEN 'Pago'
        ELSE 'Ficha'
    END;
$$;

CREATE OR REPLACE FUNCTION public.empleado_historial_tabla_pk(
    p_tabla TEXT,
    p_row JSONB
)
RETURNS INTEGER
LANGUAGE SQL
IMMUTABLE
AS $$
    SELECT CASE p_tabla
        WHEN 'persona' THEN NULLIF(p_row ->> 'id_persona', '')::INTEGER
        WHEN 'contrato' THEN NULLIF(p_row ->> 'id_contrato', '')::INTEGER
        WHEN 'contrato_centro_costo' THEN NULLIF(p_row ->> 'id_contrato_centro_costo', '')::INTEGER
        WHEN 'remuneracion' THEN NULLIF(p_row ->> 'id_remuneracion', '')::INTEGER
        WHEN 'semana_corrida' THEN NULLIF(p_row ->> 'id_semana_corrida', '')::INTEGER
        WHEN 'zona_extrema' THEN NULLIF(p_row ->> 'id_zona_extrema', '')::INTEGER
        WHEN 'prevision' THEN NULLIF(p_row ->> 'id_prevision', '')::INTEGER
        WHEN 'salud_trabajador' THEN NULLIF(p_row ->> 'id_salud_trabajador', '')::INTEGER
        WHEN 'cuenta2_afp' THEN NULLIF(p_row ->> 'id_cuenta2_afp', '')::INTEGER
        WHEN 'apv' THEN NULLIF(p_row ->> 'id_apv', '')::INTEGER
        WHEN 'cuenta_bancaria' THEN NULLIF(p_row ->> 'id_cuenta', '')::INTEGER
        ELSE NULL
    END;
$$;

CREATE OR REPLACE FUNCTION public.empleado_historial_registrar_cambio()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    old_data JSONB := CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END;
    new_data JSONB := CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END;
    row_data JSONB := COALESCE(new_data, old_data);
    changed_fields TEXT[] := ARRAY[]::TEXT[];
    resolved_persona_id INTEGER;
    resolved_contrato_id INTEGER;
    resolved_record_id INTEGER;
    resolved_seccion TEXT;
    resolved_usuario TEXT;
BEGIN
    IF TG_OP = 'UPDATE' THEN
        changed_fields := public.empleado_historial_changed_fields(old_data, new_data);

        IF cardinality(changed_fields) = 0 THEN
            RETURN NEW;
        END IF;
    ELSIF TG_OP = 'INSERT' THEN
        changed_fields := public.empleado_historial_changed_fields('{}'::JSONB, new_data);
    ELSE
        changed_fields := public.empleado_historial_changed_fields(old_data, '{}'::JSONB);
    END IF;

    resolved_contrato_id := NULLIF(row_data ->> 'id_contrato', '')::INTEGER;
    resolved_persona_id := NULLIF(row_data ->> 'id_persona', '')::INTEGER;

    IF resolved_persona_id IS NULL AND resolved_contrato_id IS NOT NULL THEN
        SELECT c.id_persona
        INTO resolved_persona_id
        FROM public.contrato c
        WHERE c.id_contrato = resolved_contrato_id
        LIMIT 1;
    END IF;

    IF resolved_persona_id IS NULL THEN
        IF TG_OP = 'DELETE' THEN
            RETURN OLD;
        END IF;

        RETURN NEW;
    END IF;

    IF resolved_contrato_id IS NULL AND TG_TABLE_NAME = 'contrato' THEN
        resolved_contrato_id := NULLIF(row_data ->> 'id_contrato', '')::INTEGER;
    END IF;

    resolved_record_id := public.empleado_historial_tabla_pk(TG_TABLE_NAME, row_data);
    resolved_seccion := public.empleado_historial_tabla_seccion(TG_TABLE_NAME);
    resolved_usuario := COALESCE(
        NULLIF(current_setting('request.jwt.claim.email', TRUE), ''),
        NULLIF(current_setting('request.jwt.claim.sub', TRUE), ''),
        current_user
    );

    INSERT INTO public.empleado_historial (
        id_persona,
        id_contrato,
        seccion,
        evento,
        tabla_origen,
        id_registro,
        operacion,
        campos_modificados,
        datos_antes,
        datos_despues,
        usuario
    )
    VALUES (
        resolved_persona_id,
        resolved_contrato_id,
        resolved_seccion,
        CASE TG_OP
            WHEN 'INSERT' THEN 'Registro creado'
            WHEN 'UPDATE' THEN 'Registro actualizado'
            WHEN 'DELETE' THEN 'Registro eliminado'
        END,
        TG_TABLE_NAME,
        resolved_record_id,
        TG_OP,
        changed_fields,
        old_data,
        new_data,
        resolved_usuario
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;

    RETURN NEW;
END;
$$;

DO $$
DECLARE
    audit_table TEXT;
    audit_tables TEXT[] := ARRAY[
        'persona',
        'contrato',
        'contrato_centro_costo',
        'remuneracion',
        'semana_corrida',
        'zona_extrema',
        'prevision',
        'salud_trabajador',
        'cuenta2_afp',
        'apv',
        'cuenta_bancaria'
    ];
BEGIN
    FOREACH audit_table IN ARRAY audit_tables LOOP
        IF to_regclass(format('public.%I', audit_table)) IS NULL THEN
            CONTINUE;
        END IF;

        EXECUTE format(
            'DROP TRIGGER IF EXISTS empleado_historial_%I_trg ON public.%I',
            audit_table,
            audit_table
        );

        EXECUTE format(
            'CREATE TRIGGER empleado_historial_%I_trg
             AFTER INSERT OR UPDATE OR DELETE ON public.%I
             FOR EACH ROW EXECUTE FUNCTION public.empleado_historial_registrar_cambio()',
            audit_table,
            audit_table
        );
    END LOOP;
END $$;

GRANT SELECT, INSERT ON TABLE public.empleado_historial TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.empleado_historial_id_historial_seq TO anon, authenticated;

ALTER TABLE public.empleado_historial ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'empleado_historial'
          AND policyname = 'empleado_historial_select'
    ) THEN
        CREATE POLICY empleado_historial_select
            ON public.empleado_historial
            FOR SELECT
            TO anon, authenticated
            USING (TRUE);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'empleado_historial'
          AND policyname = 'empleado_historial_insert'
    ) THEN
        CREATE POLICY empleado_historial_insert
            ON public.empleado_historial
            FOR INSERT
            TO anon, authenticated
            WITH CHECK (TRUE);
    END IF;
END $$;
