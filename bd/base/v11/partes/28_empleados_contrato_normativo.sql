SET search_path = public;

ALTER TABLE contrato
  ADD COLUMN IF NOT EXISTS excluido_limite_jornada BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS causal_exclusion_jornada TEXT,
  ADD COLUMN IF NOT EXISTS justificacion_exclusion_jornada TEXT,
  ADD COLUMN IF NOT EXISTS casa_particular_modalidad TEXT,
  ADD COLUMN IF NOT EXISTS casa_particular_labores TEXT,
  ADD COLUMN IF NOT EXISTS casa_particular_domicilio_especifico TEXT,
  ADD COLUMN IF NOT EXISTS casa_particular_asistencia_cuidado BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS casa_particular_registro_dt_estado TEXT,
  ADD COLUMN IF NOT EXISTS casa_particular_registro_dt_fecha DATE,
  ADD COLUMN IF NOT EXISTS casa_particular_registro_dt_folio TEXT;

ALTER TABLE contrato
  DROP CONSTRAINT IF EXISTS chk_contrato_exclusion_jornada_causal,
  ADD CONSTRAINT chk_contrato_exclusion_jornada_causal
    CHECK (
      causal_exclusion_jornada IS NULL
      OR causal_exclusion_jornada IN (
        'ALTA_RESPONSABILIDAD',
        'SIN_FISCALIZACION_SUPERIOR_INMEDIATA'
      )
    );

ALTER TABLE contrato
  DROP CONSTRAINT IF EXISTS chk_contrato_exclusion_jornada_datos;

ALTER TABLE contrato
  DROP CONSTRAINT IF EXISTS chk_contrato_casa_particular_modalidad,
  ADD CONSTRAINT chk_contrato_casa_particular_modalidad
    CHECK (
      casa_particular_modalidad IS NULL
      OR casa_particular_modalidad IN ('PUERTAS_AFUERA', 'PUERTAS_ADENTRO')
    );

ALTER TABLE contrato
  DROP CONSTRAINT IF EXISTS chk_contrato_casa_particular_registro_dt_estado,
  ADD CONSTRAINT chk_contrato_casa_particular_registro_dt_estado
    CHECK (
      casa_particular_registro_dt_estado IS NULL
      OR casa_particular_registro_dt_estado IN ('PENDIENTE', 'REGISTRADO', 'NO_APLICA')
    );

ALTER TABLE contrato
  DROP CONSTRAINT IF EXISTS chk_contrato_casa_particular_registro_dt_datos;

COMMENT ON COLUMN contrato.excluido_limite_jornada IS
  'Marca contratos dependientes excluidos del limite de jornada ordinaria, por ejemplo art. 22.';
COMMENT ON COLUMN contrato.causal_exclusion_jornada IS
  'Causal operacional para exclusion de limite de jornada: ALTA_RESPONSABILIDAD o SIN_FISCALIZACION_SUPERIOR_INMEDIATA.';
COMMENT ON COLUMN contrato.justificacion_exclusion_jornada IS
  'Justificacion contractual/documental de la exclusion de limite de jornada.';
COMMENT ON COLUMN contrato.casa_particular_modalidad IS
  'Modalidad de contrato de trabajador de casa particular: PUERTAS_AFUERA o PUERTAS_ADENTRO.';
COMMENT ON COLUMN contrato.casa_particular_labores IS
  'Labores especificas pactadas para contrato de casa particular.';
COMMENT ON COLUMN contrato.casa_particular_domicilio_especifico IS
  'Domicilio contractual especifico donde se prestan labores de casa particular.';
COMMENT ON COLUMN contrato.casa_particular_asistencia_cuidado IS
  'Indica si las labores incluyen asistencia o cuidado de personas.';
COMMENT ON COLUMN contrato.casa_particular_registro_dt_estado IS
  'Estado administrativo del registro DT del contrato de casa particular.';
COMMENT ON COLUMN contrato.casa_particular_registro_dt_fecha IS
  'Fecha de registro DT del contrato de casa particular cuando esta registrado.';
COMMENT ON COLUMN contrato.casa_particular_registro_dt_folio IS
  'Folio o comprobante del registro DT del contrato de casa particular.';
