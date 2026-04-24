-- =========================================================
-- BANCOS / CUENTAS BANCARIAS - ERP CHILE
-- PostgreSQL
-- =========================================================

-- =========================
-- TABLA: banco
-- =========================
CREATE TABLE IF NOT EXISTS banco (
    id_banco SERIAL PRIMARY KEY,
    codigo_sbif VARCHAR(10) NOT NULL UNIQUE,
    nombre VARCHAR(120) NOT NULL UNIQUE,
    nombre_corto VARCHAR(60) NOT NULL,
    es_banco_estado BOOLEAN NOT NULL DEFAULT FALSE,
    es_banco_extranjero BOOLEAN NOT NULL DEFAULT FALSE,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP
);

ALTER TABLE banco ADD COLUMN IF NOT EXISTS codigo_sbif VARCHAR(10);
ALTER TABLE banco ADD COLUMN IF NOT EXISTS nombre_corto VARCHAR(60);
ALTER TABLE banco ADD COLUMN IF NOT EXISTS es_banco_estado BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE banco ADD COLUMN IF NOT EXISTS es_banco_extranjero BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE banco ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE banco ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW();
ALTER TABLE banco ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;

UPDATE banco
SET
    codigo_sbif = '012',
    nombre = 'BANCO DEL ESTADO DE CHILE',
    nombre_corto = 'BancoEstado',
    es_banco_estado = TRUE,
    es_banco_extranjero = FALSE,
    activo = TRUE
WHERE codigo_sbif IS NULL
  AND lower(nombre) IN ('banco estado', 'bancoestado', 'banco del estado de chile');

UPDATE banco
SET nombre_corto = nombre
WHERE nombre_corto IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_banco_codigo_sbif
ON banco(codigo_sbif);

CREATE INDEX IF NOT EXISTS idx_banco_activo
ON banco(activo);

CREATE INDEX IF NOT EXISTS idx_banco_nombre_corto
ON banco(nombre_corto);


-- =========================
-- DATA: bancos Chile CMF/SBIF
-- =========================
INSERT INTO banco (
    codigo_sbif,
    nombre,
    nombre_corto,
    es_banco_estado,
    es_banco_extranjero,
    activo
)
VALUES
('001', 'BANCO DE CHILE', 'Banco de Chile', FALSE, FALSE, TRUE),
('009', 'BANCO INTERNACIONAL', 'Banco Internacional', FALSE, FALSE, TRUE),
('012', 'BANCO DEL ESTADO DE CHILE', 'BancoEstado', TRUE, FALSE, TRUE),
('014', 'SCOTIABANK CHILE', 'Scotiabank', FALSE, FALSE, TRUE),
('016', 'BANCO DE CREDITO E INVERSIONES', 'BCI', FALSE, FALSE, TRUE),
('028', 'BANCO BICE', 'BICE', FALSE, FALSE, TRUE),
('031', 'HSBC BANK CHILE', 'HSBC', FALSE, FALSE, TRUE),
('037', 'BANCO SANTANDER-CHILE', 'Santander', FALSE, FALSE, TRUE),
('039', 'BANCO ITAÚ CHILE', 'Itaú', FALSE, FALSE, TRUE),
('041', 'JP MORGAN CHASE BANK N.A.', 'JP Morgan', FALSE, TRUE, TRUE),
('051', 'BANCO FALABELLA', 'Falabella', FALSE, FALSE, TRUE),
('053', 'BANCO RIPLEY', 'Ripley', FALSE, FALSE, TRUE),
('055', 'BANCO CONSORCIO', 'Consorcio', FALSE, FALSE, TRUE),
('059', 'BANCO BTG PACTUAL CHILE', 'BTG Pactual', FALSE, FALSE, TRUE),
('060', 'CHINA CONSTRUCTION BANK AGENCIA EN CHILE', 'China Construction Bank', FALSE, TRUE, TRUE),
('061', 'BANK OF CHINA AGENCIA EN CHILE', 'Bank of China', FALSE, TRUE, TRUE),
('062', 'TANNER BANCO DIGITAL', 'Tanner Banco Digital', FALSE, FALSE, TRUE),
('063', 'TENPO BANK CHILE', 'Tenpo Bank', FALSE, FALSE, TRUE)
ON CONFLICT (codigo_sbif) DO UPDATE
SET
    nombre = EXCLUDED.nombre,
    nombre_corto = EXCLUDED.nombre_corto,
    es_banco_estado = EXCLUDED.es_banco_estado,
    es_banco_extranjero = EXCLUDED.es_banco_extranjero,
    activo = EXCLUDED.activo,
    updated_at = NOW();


-- =========================
-- TABLA: tipo_cuenta_bancaria
-- =========================
CREATE TABLE IF NOT EXISTS tipo_cuenta_bancaria (
    id_tipo_cuenta_bancaria SERIAL PRIMARY KEY,
    codigo VARCHAR(40) NOT NULL UNIQUE,
    nombre VARCHAR(80) NOT NULL UNIQUE,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP
);

ALTER TABLE tipo_cuenta_bancaria ADD COLUMN IF NOT EXISTS codigo VARCHAR(40);
ALTER TABLE tipo_cuenta_bancaria ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE tipo_cuenta_bancaria ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW();
ALTER TABLE tipo_cuenta_bancaria ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;

UPDATE tipo_cuenta_bancaria
SET codigo = 'CUENTA_VISTA'
WHERE codigo IS NULL
  AND lower(nombre) = 'cuenta vista';

UPDATE tipo_cuenta_bancaria
SET codigo = 'CUENTA_CORRIENTE'
WHERE codigo IS NULL
  AND lower(nombre) = 'cuenta corriente';

UPDATE tipo_cuenta_bancaria
SET codigo = 'CUENTA_RUT'
WHERE codigo IS NULL
  AND lower(nombre) = 'cuenta rut';

UPDATE tipo_cuenta_bancaria
SET codigo = 'CUENTA_AHORRO'
WHERE codigo IS NULL
  AND lower(nombre) IN ('cuenta de ahorro', 'cuenta ahorro');

UPDATE tipo_cuenta_bancaria
SET codigo = 'CHEQUERA_ELECTRONICA'
WHERE codigo IS NULL
  AND lower(nombre) IN ('chequera electronica', 'chequera electrónica');

CREATE UNIQUE INDEX IF NOT EXISTS uq_tipo_cuenta_bancaria_codigo
ON tipo_cuenta_bancaria(codigo);

CREATE INDEX IF NOT EXISTS idx_tipo_cuenta_bancaria_activo
ON tipo_cuenta_bancaria(activo);


-- =========================
-- DATA: tipos de cuenta
-- =========================
INSERT INTO tipo_cuenta_bancaria (
    codigo,
    nombre,
    activo
)
VALUES
('CUENTA_CORRIENTE', 'Cuenta Corriente', TRUE),
('CUENTA_VISTA', 'Cuenta Vista', TRUE),
('CUENTA_RUT', 'Cuenta RUT', TRUE),
('CUENTA_AHORRO', 'Cuenta de Ahorro', TRUE),
('CHEQUERA_ELECTRONICA', 'Chequera Electrónica', TRUE)
ON CONFLICT (codigo) DO UPDATE
SET
    nombre = EXCLUDED.nombre,
    activo = EXCLUDED.activo,
    updated_at = NOW();


-- =========================
-- TABLA: cuenta_bancaria
-- =========================
CREATE TABLE IF NOT EXISTS cuenta_bancaria (
    id_cuenta SERIAL PRIMARY KEY,

    id_persona INT NOT NULL
        REFERENCES persona(id_persona) ON DELETE CASCADE,

    id_banco INT NOT NULL
        REFERENCES banco(id_banco),

    id_tipo_cuenta_bancaria INT NOT NULL
        REFERENCES tipo_cuenta_bancaria(id_tipo_cuenta_bancaria),

    numero_cuenta VARCHAR(50) NOT NULL,

    titular_nombre VARCHAR(150),
    titular_rut VARCHAR(12),

    es_principal BOOLEAN NOT NULL DEFAULT TRUE,
    activa BOOLEAN NOT NULL DEFAULT TRUE,

    vigencia_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
    vigencia_fin DATE,

    observacion TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,

    CONSTRAINT uq_cuenta_bancaria_numero
        UNIQUE (id_banco, numero_cuenta),

    CONSTRAINT chk_cuenta_bancaria_vigencia
        CHECK (
            vigencia_fin IS NULL
            OR vigencia_fin >= vigencia_inicio
        ),

    CONSTRAINT chk_cuenta_bancaria_numero_no_vacio
        CHECK (length(trim(numero_cuenta)) > 0)
);


-- =========================
-- MIGRACION cuenta_bancaria existente
-- =========================
ALTER TABLE cuenta_bancaria ADD COLUMN IF NOT EXISTS titular_nombre VARCHAR(150);
ALTER TABLE cuenta_bancaria ADD COLUMN IF NOT EXISTS titular_rut VARCHAR(12);
ALTER TABLE cuenta_bancaria ADD COLUMN IF NOT EXISTS es_principal BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE cuenta_bancaria ADD COLUMN IF NOT EXISTS activa BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE cuenta_bancaria ADD COLUMN IF NOT EXISTS observacion TEXT;
ALTER TABLE cuenta_bancaria ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW();
ALTER TABLE cuenta_bancaria ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;
ALTER TABLE cuenta_bancaria ALTER COLUMN vigencia_inicio SET DEFAULT CURRENT_DATE;

UPDATE cuenta_bancaria
SET vigencia_inicio = CURRENT_DATE
WHERE vigencia_inicio IS NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_cuenta_bancaria_vigencia'
    ) THEN
        ALTER TABLE cuenta_bancaria
            ADD CONSTRAINT chk_cuenta_bancaria_vigencia
            CHECK (vigencia_fin IS NULL OR vigencia_fin >= vigencia_inicio);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_cuenta_bancaria_numero_no_vacio'
    ) THEN
        ALTER TABLE cuenta_bancaria
            ADD CONSTRAINT chk_cuenta_bancaria_numero_no_vacio
            CHECK (length(trim(numero_cuenta)) > 0);
    END IF;
END $$;

-- =========================
-- INDICES cuenta_bancaria
-- =========================
CREATE INDEX IF NOT EXISTS idx_cuenta_bancaria_persona
ON cuenta_bancaria(id_persona);

CREATE INDEX IF NOT EXISTS idx_cuenta_bancaria_banco
ON cuenta_bancaria(id_banco);

CREATE INDEX IF NOT EXISTS idx_cuenta_bancaria_tipo
ON cuenta_bancaria(id_tipo_cuenta_bancaria);

CREATE INDEX IF NOT EXISTS idx_cuenta_bancaria_activa
ON cuenta_bancaria(activa);


-- Solo una cuenta principal activa por persona
CREATE UNIQUE INDEX IF NOT EXISTS uq_cuenta_principal_activa_persona
ON cuenta_bancaria(id_persona)
WHERE es_principal = TRUE
  AND activa = TRUE
  AND vigencia_fin IS NULL;


-- =========================
-- TRIGGER updated_at genérico
-- =========================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


DROP TRIGGER IF EXISTS trg_banco_updated_at ON banco;
CREATE TRIGGER trg_banco_updated_at
BEFORE UPDATE ON banco
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


DROP TRIGGER IF EXISTS trg_tipo_cuenta_bancaria_updated_at ON tipo_cuenta_bancaria;
CREATE TRIGGER trg_tipo_cuenta_bancaria_updated_at
BEFORE UPDATE ON tipo_cuenta_bancaria
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


DROP TRIGGER IF EXISTS trg_cuenta_bancaria_updated_at ON cuenta_bancaria;
CREATE TRIGGER trg_cuenta_bancaria_updated_at
BEFORE UPDATE ON cuenta_bancaria
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
