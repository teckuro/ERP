-- NOM-PREP-01: preparaciones/lotes persistidos de nomina.
-- Crea la capa previa al calculo. Las FK circulares hacia calculo/liquidacion
-- se agregan al final en 33_nomina_preparacion_fks.sql.

SET search_path = public;

CREATE TABLE IF NOT EXISTS public.nomina_preparacion (
    id_preparacion_nomina BIGSERIAL PRIMARY KEY,
    periodo_pago TEXT NOT NULL,
    periodo_origen TEXT NULL,
    id_empresa INT NOT NULL CONSTRAINT nomina_preparacion_empresa_fk REFERENCES public.empresa(id_empresa),
    tipo_preparacion TEXT NOT NULL,
    metodo_alcance TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'borrador',
    id_preparacion_origen BIGINT NULL CONSTRAINT nomina_preparacion_origen_fk REFERENCES public.nomina_preparacion(id_preparacion_nomina),
    id_calculo_origen INT NULL,
    id_liquidacion_origen BIGINT NULL,
    modo_reproceso TEXT NULL,
    motivo TEXT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NULL,
    created_by_label TEXT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    confirmada_at TIMESTAMPTZ NULL,
    confirmada_by UUID NULL,
    cerrada_at TIMESTAMPTZ NULL,
    cerrada_by UUID NULL,
    anulada_at TIMESTAMPTZ NULL,
    anulada_by UUID NULL,
    motivo_anulacion TEXT NULL,
    CONSTRAINT nomina_preparacion_periodo_pago_chk CHECK (periodo_pago ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
    CONSTRAINT nomina_preparacion_periodo_origen_chk CHECK (
        periodo_origen IS NULL
        OR periodo_origen ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'
    ),
    CONSTRAINT nomina_preparacion_tipo_chk CHECK (
        tipo_preparacion IN (
            'mensualCompleta',
            'porCentroCosto',
            'seleccionManual',
            'complementaria',
            'reproceso',
            'retroactiva',
            'finiquito',
            'especial'
        )
    ),
    CONSTRAINT nomina_preparacion_metodo_alcance_chk CHECK (
        metodo_alcance IN (
            'todaEmpresa',
            'centroCosto',
            'grupo',
            'seleccionManual',
            'contrato',
            'trabajadorUnico'
        )
    ),
    CONSTRAINT nomina_preparacion_estado_chk CHECK (
        estado IN (
            'borrador',
            'alcance_definido',
            'empleados_validados',
            'lista_para_calculo',
            'calculada',
            'con_bloqueos',
            'confirmada',
            'liquidaciones_generadas',
            'cerrada',
            'anulada'
        )
    ),
    CONSTRAINT nomina_preparacion_modo_reproceso_chk CHECK (
        modo_reproceso IS NULL
        OR modo_reproceso IN ('corrige', 'reemplaza')
    )
);

ALTER TABLE public.nomina_preparacion
    ADD COLUMN IF NOT EXISTS periodo_origen TEXT NULL,
    ADD COLUMN IF NOT EXISTS id_empresa INT,
    ADD COLUMN IF NOT EXISTS tipo_preparacion TEXT,
    ADD COLUMN IF NOT EXISTS metodo_alcance TEXT,
    ADD COLUMN IF NOT EXISTS estado TEXT NOT NULL DEFAULT 'borrador',
    ADD COLUMN IF NOT EXISTS id_preparacion_origen BIGINT NULL,
    ADD COLUMN IF NOT EXISTS id_calculo_origen INT NULL,
    ADD COLUMN IF NOT EXISTS id_liquidacion_origen BIGINT NULL,
    ADD COLUMN IF NOT EXISTS modo_reproceso TEXT NULL,
    ADD COLUMN IF NOT EXISTS motivo TEXT NULL,
    ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS created_by UUID NULL,
    ADD COLUMN IF NOT EXISTS created_by_label TEXT NULL,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS confirmada_at TIMESTAMPTZ NULL,
    ADD COLUMN IF NOT EXISTS confirmada_by UUID NULL,
    ADD COLUMN IF NOT EXISTS cerrada_at TIMESTAMPTZ NULL,
    ADD COLUMN IF NOT EXISTS cerrada_by UUID NULL,
    ADD COLUMN IF NOT EXISTS anulada_at TIMESTAMPTZ NULL,
    ADD COLUMN IF NOT EXISTS anulada_by UUID NULL,
    ADD COLUMN IF NOT EXISTS motivo_anulacion TEXT NULL;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'nomina_preparacion'
          AND column_name = 'id_empresa'
          AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE public.nomina_preparacion
            ALTER COLUMN id_empresa SET NOT NULL;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'nomina_preparacion_empresa_fk'
    ) THEN
        ALTER TABLE public.nomina_preparacion
            ADD CONSTRAINT nomina_preparacion_empresa_fk
            FOREIGN KEY (id_empresa) REFERENCES public.empresa(id_empresa);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'nomina_preparacion_origen_fk'
    ) THEN
        ALTER TABLE public.nomina_preparacion
            ADD CONSTRAINT nomina_preparacion_origen_fk
            FOREIGN KEY (id_preparacion_origen)
            REFERENCES public.nomina_preparacion(id_preparacion_nomina);
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.nomina_preparacion_trabajador (
    id_preparacion_trabajador BIGSERIAL PRIMARY KEY,
    id_preparacion_nomina BIGINT NOT NULL REFERENCES public.nomina_preparacion(id_preparacion_nomina) ON DELETE CASCADE,
    id_persona INT NOT NULL REFERENCES public.persona(id_persona),
    id_contrato INT NULL,
    estado TEXT NOT NULL,
    motivo TEXT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT nomina_preparacion_trabajador_estado_chk CHECK (
        estado IN (
            'incluido',
            'excluido',
            'bloqueado',
            'listo',
            'advertencia',
            'calculado',
            'omitido'
        )
    )
);

CREATE TABLE IF NOT EXISTS public.nomina_preparacion_evento (
    id_preparacion_evento BIGSERIAL PRIMARY KEY,
    id_preparacion_nomina BIGINT NOT NULL REFERENCES public.nomina_preparacion(id_preparacion_nomina) ON DELETE CASCADE,
    tipo_evento TEXT NOT NULL,
    usuario_id UUID NULL,
    usuario_label TEXT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT nomina_preparacion_evento_tipo_chk CHECK (btrim(tipo_evento) <> '')
);

CREATE INDEX IF NOT EXISTS idx_nomina_preparacion_periodo
    ON public.nomina_preparacion(periodo_pago, activo);

CREATE INDEX IF NOT EXISTS idx_nomina_preparacion_tipo
    ON public.nomina_preparacion(periodo_pago, tipo_preparacion);

CREATE INDEX IF NOT EXISTS idx_nomina_preparacion_origen
    ON public.nomina_preparacion(id_preparacion_origen);

CREATE UNIQUE INDEX IF NOT EXISTS uq_nomina_preparacion_mensual_activa
    ON public.nomina_preparacion(periodo_pago, id_empresa)
    WHERE tipo_preparacion = 'mensualCompleta'
      AND activo = TRUE;

CREATE INDEX IF NOT EXISTS idx_nomina_preparacion_trabajador_preparacion
    ON public.nomina_preparacion_trabajador(id_preparacion_nomina);

CREATE INDEX IF NOT EXISTS idx_nomina_preparacion_trabajador_persona
    ON public.nomina_preparacion_trabajador(id_persona);

CREATE UNIQUE INDEX IF NOT EXISTS uq_nomina_preparacion_trabajador_persona_activa
    ON public.nomina_preparacion_trabajador(id_preparacion_nomina, id_persona)
    WHERE estado <> 'omitido';

CREATE INDEX IF NOT EXISTS idx_nomina_preparacion_evento_preparacion
    ON public.nomina_preparacion_evento(id_preparacion_nomina, created_at DESC);

DROP TRIGGER IF EXISTS trg_nomina_preparacion_updated_at ON public.nomina_preparacion;
CREATE TRIGGER trg_nomina_preparacion_updated_at
BEFORE UPDATE ON public.nomina_preparacion
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_nomina_preparacion_trabajador_updated_at ON public.nomina_preparacion_trabajador;
CREATE TRIGGER trg_nomina_preparacion_trabajador_updated_at
BEFORE UPDATE ON public.nomina_preparacion_trabajador
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
