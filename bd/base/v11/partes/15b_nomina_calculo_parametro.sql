-- PRENOMINA-FREEZE-01: parametros congelados y hashes del snapshot preliminar.
-- Hace auditable la prenomina: que parametros se usaron y su huella, mas la huella de entradas.
-- Script incremental local, idempotente y no destructivo.

ALTER TABLE nomina_calculo_periodo
    ADD COLUMN IF NOT EXISTS hash_parametros VARCHAR(80) NULL,
    ADD COLUMN IF NOT EXISTS hash_entradas VARCHAR(80) NULL;

-- Parametros congelados al momento de guardar el snapshot.
-- Tabla append-only: solo se escribe dentro de guardar_nomina_calculo_snapshot.
CREATE TABLE IF NOT EXISTS nomina_calculo_parametro (
    id_calculo_parametro SERIAL PRIMARY KEY,
    id_calculo_periodo INT NOT NULL REFERENCES nomina_calculo_periodo(id_calculo_periodo) ON DELETE CASCADE,
    grupo VARCHAR(60) NOT NULL,
    clave VARCHAR(160) NOT NULL,
    valor TEXT NULL,
    valor_numerico NUMERIC(18, 6) NULL,
    vigencia DATE NULL,
    origen VARCHAR(80) NOT NULL DEFAULT 'parametros_generales',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_nomina_calc_parametro_clave CHECK (btrim(clave) <> ''),
    CONSTRAINT chk_nomina_calc_parametro_grupo CHECK (btrim(grupo) <> '')
);

CREATE INDEX IF NOT EXISTS idx_nomina_calc_parametro_periodo
    ON nomina_calculo_parametro (id_calculo_periodo);

CREATE INDEX IF NOT EXISTS idx_nomina_calc_parametro_clave
    ON nomina_calculo_parametro (id_calculo_periodo, grupo, clave);
