-- =============================================================================
-- Periodo (YYYY-MM) en catálogos de parámetros
-- Idempotente: seguro en BD nueva (02_tablas ya incluye columnas) o legada.
-- =============================================================================

-- AFP / Salud
ALTER TABLE afp ADD COLUMN IF NOT EXISTS periodo VARCHAR(7);
ALTER TABLE afp DROP CONSTRAINT IF EXISTS chk_afp_periodo_fmt;
ALTER TABLE afp ADD CONSTRAINT chk_afp_periodo_fmt
    CHECK (periodo IS NULL OR periodo ~ '^[0-9]{4}-(0[1-9]|1[0-2])$');
UPDATE afp SET periodo = to_char(vigencia_inicio, 'YYYY-MM')
WHERE periodo IS NULL AND vigencia_inicio IS NOT NULL;

ALTER TABLE salud ADD COLUMN IF NOT EXISTS periodo VARCHAR(7);
ALTER TABLE salud DROP CONSTRAINT IF EXISTS chk_salud_periodo_fmt;
ALTER TABLE salud ADD CONSTRAINT chk_salud_periodo_fmt
    CHECK (periodo IS NULL OR periodo ~ '^[0-9]{4}-(0[1-9]|1[0-2])$');
UPDATE salud SET periodo = to_char(vigencia_inicio, 'YYYY-MM')
WHERE periodo IS NULL AND vigencia_inicio IS NOT NULL;

-- AFC / parámetros legales / reforma
ALTER TABLE afc_parametro ADD COLUMN IF NOT EXISTS periodo VARCHAR(7);
ALTER TABLE afc_parametro DROP CONSTRAINT IF EXISTS chk_afc_parametro_periodo_fmt;
ALTER TABLE afc_parametro ADD CONSTRAINT chk_afc_parametro_periodo_fmt
    CHECK (periodo IS NULL OR periodo ~ '^[0-9]{4}-(0[1-9]|1[0-2])$');
UPDATE afc_parametro SET periodo = to_char(vigencia_inicio, 'YYYY-MM')
WHERE periodo IS NULL;

ALTER TABLE parametros_legales ADD COLUMN IF NOT EXISTS periodo VARCHAR(7);
ALTER TABLE parametros_legales DROP CONSTRAINT IF EXISTS chk_parametros_legales_periodo_fmt;
ALTER TABLE parametros_legales ADD CONSTRAINT chk_parametros_legales_periodo_fmt
    CHECK (periodo IS NULL OR periodo ~ '^[0-9]{4}-(0[1-9]|1[0-2])$');
UPDATE parametros_legales SET periodo = to_char(vigencia_inicio, 'YYYY-MM')
WHERE periodo IS NULL;

ALTER TABLE reforma_previsional_parametro ADD COLUMN IF NOT EXISTS periodo VARCHAR(7);
ALTER TABLE reforma_previsional_parametro DROP CONSTRAINT IF EXISTS chk_reforma_prev_periodo_fmt;
ALTER TABLE reforma_previsional_parametro ADD CONSTRAINT chk_reforma_prev_periodo_fmt
    CHECK (periodo IS NULL OR periodo ~ '^[0-9]{4}-(0[1-9]|1[0-2])$');
UPDATE reforma_previsional_parametro SET periodo = to_char(vigencia_inicio, 'YYYY-MM')
WHERE periodo IS NULL;

-- Trabajo pesado: UNIQUE(codigo) -> UNIQUE(codigo, periodo)
ALTER TABLE trabajo_pesado_parametro ADD COLUMN IF NOT EXISTS periodo VARCHAR(7);
UPDATE trabajo_pesado_parametro SET periodo = to_char(vigencia_inicio, 'YYYY-MM')
WHERE periodo IS NULL;
ALTER TABLE trabajo_pesado_parametro ALTER COLUMN periodo SET NOT NULL;
ALTER TABLE trabajo_pesado_parametro DROP CONSTRAINT IF EXISTS trabajo_pesado_parametro_codigo_key;
ALTER TABLE trabajo_pesado_parametro DROP CONSTRAINT IF EXISTS uq_trabajo_pesado_codigo_periodo;
DO $$
BEGIN
    ALTER TABLE trabajo_pesado_parametro
        ADD CONSTRAINT uq_trabajo_pesado_codigo_periodo UNIQUE (codigo, periodo);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Ley 16.744 parámetros
ALTER TABLE ley_16744_parametros ADD COLUMN IF NOT EXISTS periodo VARCHAR(7);
UPDATE ley_16744_parametros SET periodo = to_char(vigencia_inicio, 'YYYY-MM')
WHERE periodo IS NULL;
ALTER TABLE ley_16744_parametros ALTER COLUMN periodo SET NOT NULL;
ALTER TABLE ley_16744_parametros DROP CONSTRAINT IF EXISTS ley_16744_parametros_codigo_key;
ALTER TABLE ley_16744_parametros DROP CONSTRAINT IF EXISTS uq_ley_16744_codigo_periodo;
DO $$
BEGIN
    ALTER TABLE ley_16744_parametros
        ADD CONSTRAINT uq_ley_16744_codigo_periodo UNIQUE (codigo, periodo);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Catálogos globales opcionales por periodo (NULL = todos los periodos)
ALTER TABLE organismo_administrador_ley_16744 ADD COLUMN IF NOT EXISTS periodo VARCHAR(7);
ALTER TABLE organismo_administrador_ley_16744 DROP CONSTRAINT IF EXISTS chk_org_16744_periodo_fmt;
ALTER TABLE organismo_administrador_ley_16744 ADD CONSTRAINT chk_org_16744_periodo_fmt
    CHECK (periodo IS NULL OR periodo ~ '^[0-9]{4}-(0[1-9]|1[0-2])$');

ALTER TABLE ccaf_entidad ADD COLUMN IF NOT EXISTS periodo VARCHAR(7);
ALTER TABLE ccaf_entidad DROP CONSTRAINT IF EXISTS chk_ccaf_entidad_periodo_fmt;
ALTER TABLE ccaf_entidad ADD CONSTRAINT chk_ccaf_entidad_periodo_fmt
    CHECK (periodo IS NULL OR periodo ~ '^[0-9]{4}-(0[1-9]|1[0-2])$');

ALTER TABLE institucion_apv ADD COLUMN IF NOT EXISTS periodo VARCHAR(7);
ALTER TABLE institucion_apv DROP CONSTRAINT IF EXISTS chk_inst_apv_periodo_fmt;
ALTER TABLE institucion_apv ADD CONSTRAINT chk_inst_apv_periodo_fmt
    CHECK (periodo IS NULL OR periodo ~ '^[0-9]{4}-(0[1-9]|1[0-2])$');

ALTER TABLE forma_pago_apv ADD COLUMN IF NOT EXISTS periodo VARCHAR(7);
ALTER TABLE forma_pago_apv DROP CONSTRAINT IF EXISTS chk_forma_pago_apv_periodo_fmt;
ALTER TABLE forma_pago_apv ADD CONSTRAINT chk_forma_pago_apv_periodo_fmt
    CHECK (periodo IS NULL OR periodo ~ '^[0-9]{4}-(0[1-9]|1[0-2])$');

-- Tabla impuesto único: columna generada (sin to_char: debe ser IMMUTABLE en PG)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'tabla_impuesto_unico' AND column_name = 'periodo'
    ) THEN
        ALTER TABLE tabla_impuesto_unico ADD COLUMN periodo VARCHAR(7)
            GENERATED ALWAYS AS (
                (EXTRACT(YEAR FROM vigencia_inicio))::integer::text || '-' ||
                LPAD((EXTRACT(MONTH FROM vigencia_inicio))::integer::text, 2, '0')
            ) STORED;
    END IF;
END $$;
