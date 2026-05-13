-- Columnas ampliadas de parametros_generales (alineadas con la app Angular).
-- Idempotente: seguro en bases creadas antes de 02_tablas.sql actualizado.
SET search_path = public;

ALTER TABLE parametros_generales ADD COLUMN IF NOT EXISTS uta NUMERIC(12,0);
ALTER TABLE parametros_generales ADD COLUMN IF NOT EXISTS sueldo_minimo_menor18_mayor65 NUMERIC(12,0);
ALTER TABLE parametros_generales ADD COLUMN IF NOT EXISTS sueldo_minimo_casa_particular NUMERIC(12,0);
ALTER TABLE parametros_generales ADD COLUMN IF NOT EXISTS ingreso_minimo_no_remuneracional NUMERIC(12,0);
ALTER TABLE parametros_generales ADD COLUMN IF NOT EXISTS tope_afp_uf NUMERIC(10,4);
ALTER TABLE parametros_generales ADD COLUMN IF NOT EXISTS tope_ips_uf NUMERIC(10,4);
ALTER TABLE parametros_generales ADD COLUMN IF NOT EXISTS tope_cesantia_uf NUMERIC(10,4);
ALTER TABLE parametros_generales ADD COLUMN IF NOT EXISTS tope_apv_mensual_uf NUMERIC(10,4);
ALTER TABLE parametros_generales ADD COLUMN IF NOT EXISTS tope_apv_mensual NUMERIC(12,0);
ALTER TABLE parametros_generales ADD COLUMN IF NOT EXISTS tope_apv_anual_uf NUMERIC(10,4);
ALTER TABLE parametros_generales ADD COLUMN IF NOT EXISTS tope_apv_anual NUMERIC(12,0);
ALTER TABLE parametros_generales ADD COLUMN IF NOT EXISTS tope_deposito_convenido_anual_uf NUMERIC(10,4);
ALTER TABLE parametros_generales ADD COLUMN IF NOT EXISTS tope_deposito_convenido_anual NUMERIC(12,0);
ALTER TABLE parametros_generales ADD COLUMN IF NOT EXISTS sanna NUMERIC(7,4);
ALTER TABLE parametros_generales ADD COLUMN IF NOT EXISTS salud_obligatoria NUMERIC(7,4);
ALTER TABLE parametros_generales ADD COLUMN IF NOT EXISTS salud_ccaf NUMERIC(7,4);
ALTER TABLE parametros_generales ADD COLUMN IF NOT EXISTS salud_fonasa_con_ccaf NUMERIC(7,4);
