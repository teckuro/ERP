-- MOTOR-03B: persistencia controlada de snapshots preliminares de nomina.
-- Script incremental local, idempotente y no destructivo.
-- No aplicar a Supabase remoto sin revision de MOTOR-03C.

CREATE TABLE IF NOT EXISTS nomina_calculo_periodo (
    id_calculo_periodo SERIAL PRIMARY KEY,
    periodo VARCHAR(7) NOT NULL,
    id_empresa INT NULL REFERENCES empresa(id_empresa),
    estado VARCHAR(40) NOT NULL DEFAULT 'preliminar',
    fecha_generacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    usuario_generador UUID NULL,
    total_trabajadores INT NOT NULL DEFAULT 0,
    total_haberes NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total_descuentos NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total_liquido NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total_bloqueados INT NOT NULL DEFAULT 0,
    total_advertencias INT NOT NULL DEFAULT 0,
    version_motor VARCHAR(30) NOT NULL,
    hash_snapshot VARCHAR(80),
    origen VARCHAR(30) NOT NULL DEFAULT 'preliminar',
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    reemplazado_por INT NULL REFERENCES nomina_calculo_periodo(id_calculo_periodo),
    observacion_anulacion TEXT NULL,
    aprobacion_operativa_estado TEXT NULL,
    aprobacion_operativa_fecha TIMESTAMPTZ NULL,
    aprobacion_operativa_usuario_id UUID NULL,
    aprobacion_operativa_usuario_label TEXT NULL,
    aprobacion_operativa_advertencias JSONB NOT NULL DEFAULT '[]'::JSONB,
    aprobacion_operativa_metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_nomina_calc_periodo_fmt CHECK (periodo ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
    CONSTRAINT chk_nomina_calc_periodo_totales CHECK (
        total_trabajadores >= 0
        AND total_haberes >= 0
        AND total_descuentos >= 0
        AND total_bloqueados >= 0
        AND total_advertencias >= 0
    ),
    CONSTRAINT chk_nomina_calc_periodo_estado CHECK (
        estado IN (
            'borrador',
            'preliminar',
            'recalculado',
            'observado',
            'listo_para_revision',
            'aprobado_para_liquidacion',
            'anulado'
        )
    ),
    CONSTRAINT chk_nomina_calc_periodo_aprobacion_operativa CHECK (
        aprobacion_operativa_estado IS NULL
        OR aprobacion_operativa_estado IN ('aprobado_operativamente')
    ),
    CONSTRAINT chk_nomina_calc_periodo_origen CHECK (origen IN ('preliminar', 'manual', 'recalculo'))
);

ALTER TABLE nomina_calculo_periodo
    ADD COLUMN IF NOT EXISTS aprobacion_operativa_estado TEXT NULL,
    ADD COLUMN IF NOT EXISTS aprobacion_operativa_fecha TIMESTAMPTZ NULL,
    ADD COLUMN IF NOT EXISTS aprobacion_operativa_usuario_id UUID NULL,
    ADD COLUMN IF NOT EXISTS aprobacion_operativa_usuario_label TEXT NULL,
    ADD COLUMN IF NOT EXISTS aprobacion_operativa_advertencias JSONB NOT NULL DEFAULT '[]'::JSONB,
    ADD COLUMN IF NOT EXISTS aprobacion_operativa_metadata JSONB NOT NULL DEFAULT '{}'::JSONB;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_nomina_calc_periodo_aprobacion_operativa'
    ) THEN
        ALTER TABLE nomina_calculo_periodo
            ADD CONSTRAINT chk_nomina_calc_periodo_aprobacion_operativa CHECK (
                aprobacion_operativa_estado IS NULL
                OR aprobacion_operativa_estado IN ('aprobado_operativamente')
            );
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS nomina_calculo_trabajador (
    id_calculo_trabajador SERIAL PRIMARY KEY,
    id_calculo_periodo INT NOT NULL REFERENCES nomina_calculo_periodo(id_calculo_periodo) ON DELETE CASCADE,
    id_persona INT NOT NULL REFERENCES persona(id_persona),
    rut VARCHAR(20) NOT NULL,
    nombre_completo_snapshot VARCHAR(240) NOT NULL,
    estado VARCHAR(40) NOT NULL,
    sueldo_base NUMERIC(14, 2) NOT NULL DEFAULT 0,
    base_imponible_previsional NUMERIC(14, 2) NOT NULL DEFAULT 0,
    base_tributable NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total_haberes_imponibles NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total_haberes_no_imponibles NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total_descuentos_legales NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total_descuentos_voluntarios NUMERIC(14, 2) NOT NULL DEFAULT 0,
    impuesto_unico NUMERIC(14, 2) NOT NULL DEFAULT 0,
    liquido_preliminar NUMERIC(14, 2) NOT NULL DEFAULT 0,
    cotizacion_afp NUMERIC(14, 2) NOT NULL DEFAULT 0,
    cotizacion_salud NUMERIC(14, 2) NOT NULL DEFAULT 0,
    cotizacion_afc NUMERIC(14, 2) NOT NULL DEFAULT 0,
    cotizacion_sis NUMERIC(14, 2) NOT NULL DEFAULT 0,
    cotizacion_sanna NUMERIC(14, 2) NOT NULL DEFAULT 0,
    cotizacion_ley_16744_empleador NUMERIC(14, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_nomina_calc_trab_estado CHECK (
        estado IN ('calculado_preliminar', 'con_advertencias', 'con_bloqueos')
    )
);

CREATE TABLE IF NOT EXISTS nomina_calculo_concepto (
    id_calculo_concepto SERIAL PRIMARY KEY,
    id_calculo_trabajador INT NOT NULL REFERENCES nomina_calculo_trabajador(id_calculo_trabajador) ON DELETE CASCADE,
    id_concepto INT NULL REFERENCES concepto(id_concepto),
    tipo VARCHAR(30) NOT NULL,
    nombre_concepto_snapshot VARCHAR(240) NOT NULL,
    codigo_lre_snapshot VARCHAR(80) NULL,
    monto NUMERIC(14, 2) NOT NULL DEFAULT 0,
    imponible BOOLEAN NOT NULL DEFAULT FALSE,
    tributable BOOLEAN NOT NULL DEFAULT FALSE,
    afecta_liquido BOOLEAN NOT NULL DEFAULT TRUE,
    origen VARCHAR(80) NOT NULL,
    trazabilidad_json JSONB NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_nomina_calc_concepto_tipo CHECK (tipo IN ('haber', 'descuento', 'cotizacion', 'impuesto'))
);

CREATE TABLE IF NOT EXISTS nomina_calculo_issue (
    id_issue SERIAL PRIMARY KEY,
    id_calculo_periodo INT NOT NULL REFERENCES nomina_calculo_periodo(id_calculo_periodo) ON DELETE CASCADE,
    id_calculo_trabajador INT NULL REFERENCES nomina_calculo_trabajador(id_calculo_trabajador) ON DELETE CASCADE,
    codigo VARCHAR(100) NOT NULL,
    severidad VARCHAR(20) NOT NULL,
    origen VARCHAR(120) NOT NULL,
    mensaje TEXT NOT NULL,
    campo VARCHAR(120) NULL,
    entidad_id VARCHAR(120) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_nomina_calc_issue_severidad CHECK (severidad IN ('BLOQUEO', 'ADVERTENCIA', 'INFO'))
);

CREATE TABLE IF NOT EXISTS nomina_calculo_trazabilidad (
    id_trazabilidad SERIAL PRIMARY KEY,
    id_calculo_periodo INT NOT NULL REFERENCES nomina_calculo_periodo(id_calculo_periodo) ON DELETE CASCADE,
    id_calculo_trabajador INT NULL REFERENCES nomina_calculo_trabajador(id_calculo_trabajador) ON DELETE CASCADE,
    codigo VARCHAR(100) NOT NULL,
    origen VARCHAR(120) NOT NULL,
    tabla_fuente VARCHAR(120) NOT NULL,
    campo_fuente VARCHAR(160) NOT NULL,
    vigencia_inicio DATE NULL,
    vigencia_fin DATE NULL,
    valor_entrada JSONB NULL,
    formula TEXT NOT NULL,
    valor_resultado JSONB NULL,
    observacion TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nomina_calc_periodo_periodo
    ON nomina_calculo_periodo (periodo);

CREATE INDEX IF NOT EXISTS idx_nomina_calc_periodo_estado
    ON nomina_calculo_periodo (estado, periodo);

CREATE UNIQUE INDEX IF NOT EXISTS uq_nomina_calc_periodo_activo_sin_empresa
    ON nomina_calculo_periodo (periodo)
    WHERE activo = TRUE AND id_empresa IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_nomina_calc_periodo_activo_empresa
    ON nomina_calculo_periodo (periodo, id_empresa)
    WHERE activo = TRUE AND id_empresa IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_nomina_calc_trab_periodo
    ON nomina_calculo_trabajador (id_calculo_periodo);

CREATE INDEX IF NOT EXISTS idx_nomina_calc_trab_persona
    ON nomina_calculo_trabajador (id_persona);

CREATE INDEX IF NOT EXISTS idx_nomina_calc_concepto_trabajador
    ON nomina_calculo_concepto (id_calculo_trabajador);

CREATE INDEX IF NOT EXISTS idx_nomina_calc_issue_periodo
    ON nomina_calculo_issue (id_calculo_periodo, severidad);

CREATE INDEX IF NOT EXISTS idx_nomina_calc_trazabilidad_periodo
    ON nomina_calculo_trazabilidad (id_calculo_periodo, codigo);

-- RLS detallado queda fuera de MOTOR-03B.
-- TODO SEG-NOMINA: definir politicas por rol antes de aplicar en ambientes productivos.
