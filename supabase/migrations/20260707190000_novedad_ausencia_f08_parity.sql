-- NOM-AUSENCIA-01: paridad F08 para ausencias/licencias en novedad_remuneracion_periodo.
-- Permite id_concepto NULL en registros operativos (días) y catálogo motivo_ausencia.

SET search_path = public;

CREATE TABLE IF NOT EXISTS public.motivo_ausencia (
    id_motivo_ausencia SERIAL PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(120) NOT NULL,
    descuenta_dias BOOLEAN NOT NULL DEFAULT TRUE,
    es_licencia_medica BOOLEAN NOT NULL DEFAULT FALSE,
    vigente BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO public.motivo_ausencia (codigo, nombre, descuenta_dias, es_licencia_medica) VALUES
    ('LICENCIA_MEDICA', 'Licencia médica', TRUE, TRUE),
    ('LICENCIA_ACCIDENTE', 'Licencia por accidente del trabajo', TRUE, TRUE),
    ('AUSENCIA_INJUSTIFICADA', 'Ausencia injustificada', TRUE, FALSE),
    ('PERMISO_LEGAL', 'Permiso legal', FALSE, FALSE),
    ('PERMISO_SIN_GOCE', 'Permiso sin goce de sueldo', TRUE, FALSE)
ON CONFLICT (codigo) DO UPDATE
SET
    nombre = EXCLUDED.nombre,
    descuenta_dias = EXCLUDED.descuenta_dias,
    es_licencia_medica = EXCLUDED.es_licencia_medica,
    vigente = TRUE;

CREATE TABLE IF NOT EXISTS public.licencia_medica (
    id_licencia SERIAL PRIMARY KEY,
    id_persona INT NOT NULL REFERENCES persona(id_persona) ON DELETE RESTRICT,
    id_contrato INT REFERENCES contrato(id_contrato) ON DELETE SET NULL,
    folio VARCHAR(40) NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('comun', 'accidente', 'maternal', 'paternal')),
    fecha_inicio DATE NOT NULL,
    fecha_termino DATE NOT NULL,
    dias NUMERIC(5,2) NOT NULL CHECK (dias > 0),
    estado VARCHAR(20) NOT NULL DEFAULT 'registrada',
    monto_subsidio NUMERIC(14,2),
    observacion TEXT,
    creado_por UUID,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_licencia_medica_fechas CHECK (fecha_termino >= fecha_inicio)
);

ALTER TABLE public.novedad_remuneracion_periodo
    ALTER COLUMN id_concepto DROP NOT NULL;

ALTER TABLE public.novedad_remuneracion_periodo
    ADD COLUMN IF NOT EXISTS codigo_motivo_ausencia VARCHAR(50)
        REFERENCES public.motivo_ausencia(codigo);

ALTER TABLE public.novedad_remuneracion_periodo
    ADD COLUMN IF NOT EXISTS id_licencia INT
        REFERENCES public.licencia_medica(id_licencia) ON DELETE SET NULL;

ALTER TABLE public.novedad_remuneracion_periodo
    DROP CONSTRAINT IF EXISTS chk_novedad_concepto_por_categoria;

ALTER TABLE public.novedad_remuneracion_periodo
    ADD CONSTRAINT chk_novedad_concepto_por_categoria CHECK (
        (
            categoria IN (
                'haber_variable',
                'tiempo_trabajado_adicional',
                'anticipo_descuento_unico',
                'retroactivo_reintegro',
                'ajuste_manual_controlado'
            )
            AND id_concepto IS NOT NULL
        )
        OR (
            categoria IN ('ausencia_descuento_tiempo', 'licencia_permiso')
            AND id_concepto IS NULL
            AND cantidad IS NOT NULL
            AND cantidad > 0
            AND codigo_motivo_ausencia IS NOT NULL
        )
    );

ALTER TABLE public.novedad_remuneracion_periodo
    DROP CONSTRAINT IF EXISTS chk_novedad_unidad;

ALTER TABLE public.novedad_remuneracion_periodo
    ADD CONSTRAINT chk_novedad_unidad CHECK (
        unidad IS NULL OR unidad IN ('pesos', 'horas', 'dias', 'porcentaje')
    );

CREATE OR REPLACE FUNCTION public.tg_novedad_remuneracion_concepto_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_concepto public.concepto;
BEGIN
    IF NEW.id_concepto IS NOT NULL THEN
        SELECT * INTO v_concepto FROM public.concepto WHERE id_concepto = NEW.id_concepto;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Novedad: concepto inexistente.' USING ERRCODE = '23503';
        END IF;
        IF v_concepto.vigente IS DISTINCT FROM TRUE THEN
            RAISE EXCEPTION 'Novedad: concepto «%» no vigente.', v_concepto.codigo USING ERRCODE = '23514';
        END IF;
        RETURN NEW;
    END IF;

    IF NEW.categoria IN ('ausencia_descuento_tiempo', 'licencia_permiso') THEN
        IF NEW.cantidad IS NULL OR NEW.cantidad <= 0 THEN
            RAISE EXCEPTION 'Novedad: ausencia o licencia requiere cantidad de días.' USING ERRCODE = '23514';
        END IF;
        IF NEW.codigo_motivo_ausencia IS NULL OR btrim(NEW.codigo_motivo_ausencia) = '' THEN
            RAISE EXCEPTION 'Novedad: indique el motivo de ausencia o licencia.' USING ERRCODE = '23514';
        END IF;
        RETURN NEW;
    END IF;

    RAISE EXCEPTION 'Novedad: concepto obligatorio para categoría «%».', NEW.categoria
        USING ERRCODE = '23514';
END;
$$;

DROP TRIGGER IF EXISTS trg_novedad_remuneracion_concepto_guard ON public.novedad_remuneracion_periodo;

CREATE TRIGGER trg_novedad_remuneracion_concepto_guard
    BEFORE INSERT OR UPDATE ON public.novedad_remuneracion_periodo
    FOR EACH ROW
    EXECUTE FUNCTION public.tg_novedad_remuneracion_concepto_guard();

ALTER TABLE public.licencia_medica ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.motivo_ausencia ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'motivo_ausencia' AND policyname = 'motivo_ausencia_select_authenticated'
    ) THEN
        CREATE POLICY motivo_ausencia_select_authenticated ON public.motivo_ausencia
            FOR SELECT TO authenticated USING (auth.role() = 'authenticated');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'licencia_medica' AND policyname = 'licencia_medica_rw_authenticated'
    ) THEN
        CREATE POLICY licencia_medica_rw_authenticated ON public.licencia_medica
            FOR ALL TO authenticated
            USING (auth.role() = 'authenticated')
            WITH CHECK (auth.role() = 'authenticated');
    END IF;
END $$;

GRANT SELECT ON public.motivo_ausencia TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.licencia_medica TO authenticated;
