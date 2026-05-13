-- Fase 9.4C: script incremental no destructivo para BD existente sin recrear desde 02_tablas.sql.
-- Idempotente: IF NOT EXISTS. No DROP, TRUNCATE ni DELETE masivo.
-- Ver docs/codex/modulos/movimientos-variables/persistencia-9-4C.md

CREATE TABLE IF NOT EXISTS movimiento_variable_mensual (
    id_movimiento_variable SERIAL PRIMARY KEY,
    id_persona INT NOT NULL REFERENCES persona(id_persona) ON DELETE CASCADE,
    id_concepto INT NOT NULL REFERENCES concepto(id_concepto),
    periodo CHAR(7) NOT NULL,
    monto NUMERIC(14, 2) NOT NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'BORRADOR',
    origen VARCHAR(30) NOT NULL DEFAULT 'MANUAL',
    observacion TEXT NULL,
    fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_anulacion TIMESTAMPTZ NULL,
    motivo_anulacion TEXT NULL,
    CONSTRAINT chk_movvar_periodo_formato CHECK (periodo ~ '^[0-9]{4}-[0-9]{2}$'),
    CONSTRAINT chk_movvar_periodo_mes CHECK (substring(periodo FROM 6 FOR 2)::int BETWEEN 1 AND 12),
    CONSTRAINT chk_movvar_monto_positivo CHECK (monto > 0),
    CONSTRAINT chk_movvar_estado CHECK (
        estado IN (
            'BORRADOR',
            'VALIDADO',
            'OBSERVADO',
            'ANULADO',
            'BLOQUEADO',
            'INCLUIDO_EN_PROCESO'
        )
    ),
    CONSTRAINT chk_movvar_origen CHECK (origen IN ('MANUAL', 'IMPORTADO', 'SISTEMA'))
);

CREATE INDEX IF NOT EXISTS idx_movvar_periodo ON movimiento_variable_mensual (periodo);
CREATE INDEX IF NOT EXISTS idx_movvar_persona_periodo ON movimiento_variable_mensual (id_persona, periodo);
CREATE INDEX IF NOT EXISTS idx_movvar_concepto_periodo ON movimiento_variable_mensual (id_concepto, periodo);
CREATE INDEX IF NOT EXISTS idx_movvar_estado_periodo ON movimiento_variable_mensual (estado, periodo);

CREATE UNIQUE INDEX IF NOT EXISTS uq_movvar_operativo_persona_concepto_periodo
    ON movimiento_variable_mensual (id_persona, id_concepto, periodo)
    WHERE estado <> 'ANULADO';
