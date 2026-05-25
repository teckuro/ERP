SET search_path = public;

-- Vinculo laboral en contrato (dependiente vs honorarios). Idempotente para BD ya existente.
ALTER TABLE contrato
  ADD COLUMN IF NOT EXISTS relacion_laboral TEXT NOT NULL DEFAULT 'CONTRATO';

ALTER TABLE contrato
  DROP CONSTRAINT IF EXISTS contrato_relacion_laboral_check,
  DROP CONSTRAINT IF EXISTS chk_contrato_relacion_laboral,
  ADD CONSTRAINT chk_contrato_relacion_laboral
    CHECK (relacion_laboral IN ('CONTRATO', 'HONORARIOS'));

COMMENT ON COLUMN contrato.relacion_laboral IS
  'Vinculo laboral de la ficha: CONTRATO (trabajador dependiente) u HONORARIOS (prestacion de servicios).';
