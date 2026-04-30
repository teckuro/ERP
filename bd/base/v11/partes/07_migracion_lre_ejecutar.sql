-- =============================================================================
-- Migración LRE + extensiones haberdescuento_persona (ejecutar en BD existente).
-- Tras correr, regenerar tipos de Supabase / actualizar database.types.ts localmente.
-- =============================================================================

CREATE TABLE IF NOT EXISTS catalogo_lre (
    id_catalogo_lre SERIAL PRIMARY KEY,

    codigo_lre VARCHAR(10) NOT NULL UNIQUE,
    nombre_lre VARCHAR(200) NOT NULL,

    modulo_lre VARCHAR(40) NOT NULL,

    grupo_lre VARCHAR(50),

    clasificacion_lre VARCHAR(60),

    imponible BOOLEAN,
    tributable BOOLEAN,
    afecta_liquido BOOLEAN,

    vigente BOOLEAN NOT NULL DEFAULT TRUE,
    vigencia_inicio DATE,
    vigencia_fin DATE,

    observacion TEXT,

    CONSTRAINT chk_catalogo_lre_vigencia CHECK (
        vigencia_fin IS NULL
        OR vigencia_inicio IS NULL
        OR vigencia_fin >= vigencia_inicio
    )
);

CREATE INDEX IF NOT EXISTS idx_catalogo_lre_codigo ON catalogo_lre (codigo_lre);
CREATE INDEX IF NOT EXISTS idx_catalogo_lre_modulo ON catalogo_lre (modulo_lre);
CREATE INDEX IF NOT EXISTS idx_catalogo_lre_grupo ON catalogo_lre (grupo_lre);
CREATE INDEX IF NOT EXISTS idx_catalogo_lre_clasificacion ON catalogo_lre (clasificacion_lre);
CREATE INDEX IF NOT EXISTS idx_catalogo_lre_vigente ON catalogo_lre (vigente);

ALTER TABLE concepto
    ADD COLUMN IF NOT EXISTS id_catalogo_lre INT REFERENCES catalogo_lre (id_catalogo_lre) ON DELETE SET NULL;

ALTER TABLE concepto
    ADD COLUMN IF NOT EXISTS afecta_liquido BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE concepto
    ADD COLUMN IF NOT EXISTS es_sistema BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE concepto
    ADD COLUMN IF NOT EXISTS vigente BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE concepto
    ADD COLUMN IF NOT EXISTS vigencia_inicio DATE;

ALTER TABLE concepto
    ADD COLUMN IF NOT EXISTS vigencia_fin DATE;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_concepto_vigencia'
    ) THEN
        ALTER TABLE concepto
            ADD CONSTRAINT chk_concepto_vigencia CHECK (
                vigencia_fin IS NULL
                OR vigencia_inicio IS NULL
                OR vigencia_fin >= vigencia_inicio
            );
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_concepto_catalogo_lre ON concepto (id_catalogo_lre);
CREATE INDEX IF NOT EXISTS idx_concepto_vigente ON concepto (vigente);
CREATE INDEX IF NOT EXISTS idx_concepto_es_sistema ON concepto (es_sistema);

ALTER TABLE haberdescuento_persona
    ADD COLUMN IF NOT EXISTS id_contrato INT REFERENCES contrato (id_contrato) ON DELETE SET NULL;

ALTER TABLE haberdescuento_persona
    ADD COLUMN IF NOT EXISTS vigencia_inicio DATE;

ALTER TABLE haberdescuento_persona
    ADD COLUMN IF NOT EXISTS vigencia_fin DATE;

ALTER TABLE haberdescuento_persona
    ADD COLUMN IF NOT EXISTS observacion TEXT;

ALTER TABLE haberdescuento_persona
    ADD COLUMN IF NOT EXISTS periodicidad VARCHAR(30);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_hd_vigencia'
    ) THEN
        ALTER TABLE haberdescuento_persona
            ADD CONSTRAINT chk_hd_vigencia CHECK (
                vigencia_fin IS NULL
                OR vigencia_inicio IS NULL
                OR vigencia_fin >= vigencia_inicio
            );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_hd_periodicidad'
    ) THEN
        ALTER TABLE haberdescuento_persona
            ADD CONSTRAINT chk_hd_periodicidad CHECK (
                periodicidad IS NULL
                OR periodicidad IN ('MENSUAL', 'QUINCENAL', 'OCASIONAL', 'UNICA')
            );
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_hd_persona_estado ON haberdescuento_persona (id_persona, estado);

CREATE INDEX IF NOT EXISTS idx_hd_contrato_estado ON haberdescuento_persona (id_contrato, estado);

CREATE INDEX IF NOT EXISTS idx_hd_concepto ON haberdescuento_persona (id_concepto);

CREATE INDEX IF NOT EXISTS idx_hd_vigencia ON haberdescuento_persona (vigencia_inicio, vigencia_fin);
