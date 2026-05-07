-- Persistencia minima de decision de reconciliacion entre parametros oficiales
-- y configuracion cliente. No modifica parametros_generales.

ALTER TABLE parametros_generales_cliente
ADD COLUMN IF NOT EXISTS estado_reconciliacion_oficial VARCHAR(40) NOT NULL DEFAULT 'pendiente',
ADD COLUMN IF NOT EXISTS fecha_reconciliacion_oficial TIMESTAMP,
ADD COLUMN IF NOT EXISTS origen_reconciliacion VARCHAR(40),
ADD COLUMN IF NOT EXISTS observacion_reconciliacion TEXT;

ALTER TABLE parametros_generales_cliente
DROP CONSTRAINT IF EXISTS chk_parametros_generales_cliente_reconciliacion;

ALTER TABLE parametros_generales_cliente
ADD CONSTRAINT chk_parametros_generales_cliente_reconciliacion CHECK (
    estado_reconciliacion_oficial IN ('pendiente', 'actualizado_con_oficiales', 'cliente_confirmado', 'revisar_despues')
);

ALTER TABLE parametros_generales_cliente
DROP CONSTRAINT IF EXISTS chk_parametros_generales_cliente_origen_reconciliacion;

ALTER TABLE parametros_generales_cliente
ADD CONSTRAINT chk_parametros_generales_cliente_origen_reconciliacion CHECK (
    origen_reconciliacion IS NULL OR origen_reconciliacion IN ('actualizar_con_oficiales', 'mantener_configuracion', 'revisar_despues', 'edicion_cliente')
);
