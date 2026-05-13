-- NOM-01B: modelo SQL base de Novedades mensuales.
-- Novedades mensuales registra hechos del periodo. No calcula liquidaciones,
-- no reemplaza conceptos y no modela haberes/descuentos recurrentes.

SET search_path = public;

CREATE TABLE IF NOT EXISTS novedad_remuneracion_periodo (
    id_novedad_remuneracion_periodo SERIAL PRIMARY KEY,
    periodo VARCHAR(7) NOT NULL REFERENCES periodo_remuneracion(codigo) ON UPDATE CASCADE,
    id_persona INT NOT NULL REFERENCES persona(id_persona) ON DELETE RESTRICT,
    id_contrato INT REFERENCES contrato(id_contrato) ON DELETE SET NULL,
    id_concepto INT NOT NULL REFERENCES concepto(id_concepto) ON DELETE RESTRICT,
    categoria VARCHAR(50) NOT NULL,
    tipo_movimiento VARCHAR(20) NOT NULL,
    cantidad NUMERIC(14,4),
    unidad VARCHAR(30),
    monto NUMERIC(14,2),
    moneda CHAR(3) NOT NULL DEFAULT 'CLP',
    origen VARCHAR(40) NOT NULL DEFAULT 'manual',
    fecha_evento DATE,
    estado VARCHAR(40) NOT NULL DEFAULT 'borrador',
    observacion TEXT,
    referencia_externa TEXT,
    creado_por UUID,
    aprobado_por UUID,
    fecha_aprobacion TIMESTAMPTZ,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_novedad_remuneracion_periodo_periodo CHECK (
        periodo ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'
    ),
    CONSTRAINT chk_novedad_remuneracion_periodo_monto CHECK (
        monto IS NULL OR monto >= 0
    ),
    CONSTRAINT chk_novedad_remuneracion_periodo_cantidad CHECK (
        cantidad IS NULL OR cantidad > 0
    ),
    CONSTRAINT chk_novedad_remuneracion_periodo_moneda CHECK (
        moneda ~ '^[A-Z]{3}$'
    ),
    CONSTRAINT chk_novedad_remuneracion_periodo_estado CHECK (
        estado IN (
            'borrador',
            'pendiente_revision',
            'aprobada',
            'rechazada',
            'incorporada_a_pre_nomina',
            'calculada',
            'anulada'
        )
    ),
    CONSTRAINT chk_novedad_remuneracion_periodo_categoria CHECK (
        categoria IN (
            'haber_variable',
            'tiempo_trabajado_adicional',
            'ausencia_descuento_tiempo',
            'licencia_permiso',
            'anticipo_descuento_unico',
            'retroactivo_reintegro',
            'ajuste_manual_controlado'
        )
    ),
    CONSTRAINT chk_novedad_remuneracion_periodo_tipo CHECK (
        tipo_movimiento IN ('haber', 'descuento', 'ajuste', 'informativo')
    ),
    CONSTRAINT chk_novedad_remuneracion_periodo_origen CHECK (
        origen IN (
            'manual',
            'asistencia',
            'importacion',
            'integracion_externa',
            'ajuste_administrativo',
            'regularizacion',
            'sistema'
        )
    ),
    CONSTRAINT chk_novedad_remuneracion_periodo_aprobacion CHECK (
        estado NOT IN ('aprobada', 'incorporada_a_pre_nomina', 'calculada')
        OR (aprobado_por IS NOT NULL AND fecha_aprobacion IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_novedad_remuneracion_periodo_periodo
    ON novedad_remuneracion_periodo (periodo);

CREATE INDEX IF NOT EXISTS idx_novedad_remuneracion_periodo_persona
    ON novedad_remuneracion_periodo (id_persona);

CREATE INDEX IF NOT EXISTS idx_novedad_remuneracion_periodo_contrato
    ON novedad_remuneracion_periodo (id_contrato);

CREATE INDEX IF NOT EXISTS idx_novedad_remuneracion_periodo_concepto
    ON novedad_remuneracion_periodo (id_concepto);

CREATE INDEX IF NOT EXISTS idx_novedad_remuneracion_periodo_estado
    ON novedad_remuneracion_periodo (estado);

CREATE INDEX IF NOT EXISTS idx_novedad_remuneracion_periodo_periodo_persona
    ON novedad_remuneracion_periodo (periodo, id_persona);

CREATE INDEX IF NOT EXISTS idx_novedad_remuneracion_periodo_periodo_estado
    ON novedad_remuneracion_periodo (periodo, estado);

DROP TRIGGER IF EXISTS trg_novedad_remuneracion_periodo_update_timestamp
    ON novedad_remuneracion_periodo;

CREATE TRIGGER trg_novedad_remuneracion_periodo_update_timestamp
BEFORE UPDATE ON novedad_remuneracion_periodo
FOR EACH ROW
EXECUTE FUNCTION fn_set_timestamp();
