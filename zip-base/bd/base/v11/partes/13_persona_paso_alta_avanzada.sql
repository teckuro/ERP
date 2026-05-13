-- Paso actual del wizard de creación avanzada (null = no hay alta avanzada en curso desde listado).
-- Ejecutar en bases existentes; el esquema greenfield puede incorporarse luego en 02_tablas.sql si se desea.
SET search_path = public;

ALTER TABLE persona
  ADD COLUMN IF NOT EXISTS paso_alta_avanzada SMALLINT NULL;

COMMENT ON COLUMN persona.paso_alta_avanzada IS
  'Índice 0..8 del último paso guardado en creación avanzada (borrador). NULL si no aplica.';
