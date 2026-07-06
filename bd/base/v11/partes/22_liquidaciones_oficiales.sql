-- LIQ-OFICIAL-01: tablas internas de liquidaciones oficiales.
-- Materializa snapshots cerrados; no recalcula montos ni genera salidas legales.

CREATE TABLE IF NOT EXISTS public.nomina_liquidacion_periodo (
    id_liquidacion_periodo BIGSERIAL PRIMARY KEY,
    id_empresa INT NULL REFERENCES public.empresa(id_empresa),
    periodo TEXT NOT NULL,
    id_calculo_periodo INT NOT NULL REFERENCES public.nomina_calculo_periodo(id_calculo_periodo),
    id_preparacion_nomina BIGINT NULL CONSTRAINT nomina_liquidacion_periodo_preparacion_fk REFERENCES public.nomina_preparacion(id_preparacion_nomina),
    tipo_liquidacion TEXT NOT NULL DEFAULT 'mensual',
    version INTEGER NOT NULL DEFAULT 1,
    id_liquidacion_origen BIGINT NULL CONSTRAINT nomina_liquidacion_periodo_origen_fk REFERENCES public.nomina_liquidacion_periodo(id_liquidacion_periodo),
    id_liquidacion_reemplazada BIGINT NULL CONSTRAINT nomina_liquidacion_periodo_reemplazada_fk REFERENCES public.nomina_liquidacion_periodo(id_liquidacion_periodo),
    estado TEXT NOT NULL DEFAULT 'generada',
    fecha_generacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    usuario_generacion_id UUID NULL,
    usuario_generacion_label TEXT NULL,
    total_trabajadores INTEGER NOT NULL DEFAULT 0,
    total_haberes NUMERIC(18, 2) NOT NULL DEFAULT 0,
    total_descuentos NUMERIC(18, 2) NOT NULL DEFAULT 0,
    total_liquido NUMERIC(18, 2) NOT NULL DEFAULT 0,
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT nomina_liquidacion_periodo_estado_chk CHECK (estado IN ('generada')),
    CONSTRAINT nomina_liquidacion_periodo_periodo_chk CHECK (periodo ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
    CONSTRAINT nomina_liquidacion_periodo_tipo_chk CHECK (
        tipo_liquidacion IN (
            'mensual',
            'complementaria',
            'reproceso',
            'retroactiva',
            'finiquito',
            'especial'
        )
    ),
    CONSTRAINT nomina_liquidacion_periodo_version_chk CHECK (version >= 1)
);

ALTER TABLE public.nomina_liquidacion_periodo
    ADD COLUMN IF NOT EXISTS id_preparacion_nomina BIGINT NULL,
    ADD COLUMN IF NOT EXISTS tipo_liquidacion TEXT NOT NULL DEFAULT 'mensual',
    ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS id_liquidacion_origen BIGINT NULL,
    ADD COLUMN IF NOT EXISTS id_liquidacion_reemplazada BIGINT NULL;

DO $$
BEGIN
    IF to_regclass('public.nomina_preparacion') IS NOT NULL
       AND NOT EXISTS (
            SELECT 1
            FROM pg_constraint
            WHERE conname = 'nomina_liquidacion_periodo_preparacion_fk'
              AND conrelid = 'public.nomina_liquidacion_periodo'::REGCLASS
       ) THEN
        ALTER TABLE public.nomina_liquidacion_periodo
            ADD CONSTRAINT nomina_liquidacion_periodo_preparacion_fk
            FOREIGN KEY (id_preparacion_nomina)
            REFERENCES public.nomina_preparacion(id_preparacion_nomina);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'nomina_liquidacion_periodo_origen_fk'
          AND conrelid = 'public.nomina_liquidacion_periodo'::REGCLASS
    ) THEN
        ALTER TABLE public.nomina_liquidacion_periodo
            ADD CONSTRAINT nomina_liquidacion_periodo_origen_fk
            FOREIGN KEY (id_liquidacion_origen)
            REFERENCES public.nomina_liquidacion_periodo(id_liquidacion_periodo);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'nomina_liquidacion_periodo_reemplazada_fk'
          AND conrelid = 'public.nomina_liquidacion_periodo'::REGCLASS
    ) THEN
        ALTER TABLE public.nomina_liquidacion_periodo
            ADD CONSTRAINT nomina_liquidacion_periodo_reemplazada_fk
            FOREIGN KEY (id_liquidacion_reemplazada)
            REFERENCES public.nomina_liquidacion_periodo(id_liquidacion_periodo);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'nomina_liquidacion_periodo_tipo_chk'
          AND conrelid = 'public.nomina_liquidacion_periodo'::REGCLASS
    ) THEN
        ALTER TABLE public.nomina_liquidacion_periodo
            ADD CONSTRAINT nomina_liquidacion_periodo_tipo_chk CHECK (
                tipo_liquidacion IN (
                    'mensual',
                    'complementaria',
                    'reproceso',
                    'retroactiva',
                    'finiquito',
                    'especial'
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'nomina_liquidacion_periodo_version_chk'
          AND conrelid = 'public.nomina_liquidacion_periodo'::REGCLASS
    ) THEN
        ALTER TABLE public.nomina_liquidacion_periodo
            ADD CONSTRAINT nomina_liquidacion_periodo_version_chk CHECK (version >= 1);
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_nomina_liquidacion_periodo_activa
    ON public.nomina_liquidacion_periodo(id_calculo_periodo)
    WHERE activo = TRUE;

CREATE INDEX IF NOT EXISTS idx_nomina_liquidacion_periodo_periodo
    ON public.nomina_liquidacion_periodo(periodo, activo);

CREATE INDEX IF NOT EXISTS idx_nomina_liquidacion_periodo_preparacion
    ON public.nomina_liquidacion_periodo(id_preparacion_nomina);

CREATE TABLE IF NOT EXISTS public.nomina_liquidacion_trabajador (
    id_liquidacion_trabajador BIGSERIAL PRIMARY KEY,
    id_liquidacion_periodo BIGINT NOT NULL REFERENCES public.nomina_liquidacion_periodo(id_liquidacion_periodo) ON DELETE CASCADE,
    id_calculo_periodo INT NOT NULL,
    id_persona INT NULL REFERENCES public.persona(id_persona),
    id_contrato INT NULL,
    rut TEXT NULL,
    nombre_trabajador TEXT NOT NULL,
    cargo TEXT NULL,
    centro_costo TEXT NULL,
    fecha_ingreso DATE NULL,
    dias_trabajados NUMERIC(8, 2) NULL,
    base_imponible NUMERIC(18, 2) NOT NULL DEFAULT 0,
    base_tributable NUMERIC(18, 2) NOT NULL DEFAULT 0,
    total_haberes NUMERIC(18, 2) NOT NULL DEFAULT 0,
    total_descuentos NUMERIC(18, 2) NOT NULL DEFAULT 0,
    total_aportes_empleador_referencia NUMERIC(18, 2) NOT NULL DEFAULT 0,
    liquido_pagar NUMERIC(18, 2) NOT NULL DEFAULT 0,
    estado TEXT NOT NULL DEFAULT 'generada',
    observaciones JSONB NOT NULL DEFAULT '[]'::JSONB,
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT nomina_liquidacion_trabajador_estado_chk CHECK (estado IN ('generada'))
);

ALTER TABLE public.nomina_liquidacion_trabajador
    ADD COLUMN IF NOT EXISTS estado_revision TEXT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'nomina_liquidacion_trabajador_estado_revision_chk'
          AND conrelid = 'public.nomina_liquidacion_trabajador'::REGCLASS
    ) THEN
        ALTER TABLE public.nomina_liquidacion_trabajador
            ADD CONSTRAINT nomina_liquidacion_trabajador_estado_revision_chk CHECK (
                estado_revision IS NULL
                OR estado_revision IN (
                    'pendiente_autorizar',
                    'autorizada',
                    'pago_registrado',
                    'documento_enviado',
                    'rectificacion_solicitada'
                )
            );
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_nomina_liquidacion_trabajador_periodo
    ON public.nomina_liquidacion_trabajador(id_liquidacion_periodo);

CREATE INDEX IF NOT EXISTS idx_nomina_liquidacion_trabajador_calculo
    ON public.nomina_liquidacion_trabajador(id_calculo_periodo);

CREATE TABLE IF NOT EXISTS public.nomina_liquidacion_concepto (
    id_liquidacion_concepto BIGSERIAL PRIMARY KEY,
    id_liquidacion_trabajador BIGINT NOT NULL REFERENCES public.nomina_liquidacion_trabajador(id_liquidacion_trabajador) ON DELETE CASCADE,
    id_concepto INT NULL REFERENCES public.concepto(id_concepto),
    codigo TEXT NULL,
    codigo_lre TEXT NULL,
    nombre TEXT NOT NULL,
    tipo TEXT NOT NULL,
    clasificacion TEXT NULL,
    cantidad NUMERIC(18, 4) NULL,
    base NUMERIC(18, 2) NULL,
    tasa NUMERIC(18, 6) NULL,
    monto NUMERIC(18, 2) NOT NULL DEFAULT 0,
    orden INTEGER NOT NULL DEFAULT 0,
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nomina_liquidacion_concepto_trabajador
    ON public.nomina_liquidacion_concepto(id_liquidacion_trabajador, orden);

-- LIQ-01b: historial de emisiones formales por trabajador.
CREATE TABLE IF NOT EXISTS public.nomina_liquidacion_emision (
    id_liquidacion_emision BIGSERIAL PRIMARY KEY,
    id_liquidacion_trabajador BIGINT NOT NULL REFERENCES public.nomina_liquidacion_trabajador(id_liquidacion_trabajador) ON DELETE CASCADE,
    id_liquidacion_periodo BIGINT NOT NULL REFERENCES public.nomina_liquidacion_periodo(id_liquidacion_periodo) ON DELETE CASCADE,
    version_liquidacion INTEGER NOT NULL DEFAULT 1,
    usuario_id UUID NULL,
    usuario_label TEXT NOT NULL,
    canal TEXT NOT NULL DEFAULT 'vista_oficial',
    emitido_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    CONSTRAINT nomina_liquidacion_emision_canal_chk CHECK (
        canal IN ('vista_oficial', 'impresion_navegador')
    )
);

CREATE INDEX IF NOT EXISTS idx_nomina_liquidacion_emision_trabajador
    ON public.nomina_liquidacion_emision(id_liquidacion_trabajador, emitido_en DESC);

CREATE INDEX IF NOT EXISTS idx_nomina_liquidacion_emision_periodo
    ON public.nomina_liquidacion_emision(id_liquidacion_periodo, emitido_en DESC);

DO $$
DECLARE
    liquidacion_table TEXT;
    liquidacion_tables TEXT[] := ARRAY[
        'nomina_liquidacion_periodo',
        'nomina_liquidacion_trabajador',
        'nomina_liquidacion_concepto',
        'nomina_liquidacion_emision'
    ];
BEGIN
    EXECUTE 'GRANT USAGE ON SCHEMA public TO authenticated';
    EXECUTE 'GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated';

    FOREACH liquidacion_table IN ARRAY liquidacion_tables LOOP
        EXECUTE format('GRANT SELECT, INSERT ON TABLE public.%I TO authenticated', liquidacion_table);
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', liquidacion_table);

        IF NOT EXISTS (
            SELECT 1
            FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename = liquidacion_table
              AND policyname = 'nomina_liquidacion_select_authenticated'
        ) THEN
            EXECUTE format(
                'CREATE POLICY nomina_liquidacion_select_authenticated ON public.%I FOR SELECT TO authenticated USING (auth.role() = ''authenticated'')',
                liquidacion_table
            );
        END IF;

        IF NOT EXISTS (
            SELECT 1
            FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename = liquidacion_table
              AND policyname = 'nomina_liquidacion_insert_authenticated'
        ) THEN
            EXECUTE format(
                'CREATE POLICY nomina_liquidacion_insert_authenticated ON public.%I FOR INSERT TO authenticated WITH CHECK (auth.role() = ''authenticated'')',
                liquidacion_table
            );
        END IF;
    END LOOP;

    EXECUTE 'GRANT UPDATE ON TABLE public.nomina_liquidacion_trabajador TO authenticated';

    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'nomina_liquidacion_trabajador'
          AND policyname = 'nomina_liquidacion_update_authenticated'
    ) THEN
        EXECUTE $policy$
            CREATE POLICY nomina_liquidacion_update_authenticated
                ON public.nomina_liquidacion_trabajador
                FOR UPDATE
                TO authenticated
                USING (auth.role() = 'authenticated')
                WITH CHECK (auth.role() = 'authenticated')
        $policy$;
    END IF;
END $$;
