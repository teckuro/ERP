-- ============================================================
-- EMP-PERFIL-LABORAL-SQL-01
-- Condiciones especiales del trabajador y perfil laboral derivado
-- ============================================================
-- Alcance:
-- - Mantiene `tipo_trabajador` como categoria base: DEPENDIENTE / INDEPENDIENTE.
-- - Modela condiciones especiales en tablas separadas.
-- - Menor de 18 y mayor de 65 se derivan desde persona.fecha_nacimiento y periodo.
-- - Incluye RLS/permisos locales porque este archivo corre despues de 08_seguridad_rls.sql.
-- - No toca UI, motor, liquidaciones, LRE, Previred ni enums de contrato.
-- ============================================================
SET search_path = public;

CREATE TABLE IF NOT EXISTS tipo_condicion_trabajador (
    id_tipo_condicion_trabajador SERIAL PRIMARY KEY,
    codigo VARCHAR(80) NOT NULL UNIQUE,
    nombre VARCHAR(120) NOT NULL,
    descripcion TEXT,
    grupo VARCHAR(60) NOT NULL DEFAULT 'GENERAL',
    afecta_prevision BOOLEAN NOT NULL DEFAULT FALSE,
    afecta_salud BOOLEAN NOT NULL DEFAULT FALSE,
    afecta_afc BOOLEAN NOT NULL DEFAULT FALSE,
    requiere_respaldo BOOLEAN NOT NULL DEFAULT FALSE,
    vigente BOOLEAN NOT NULL DEFAULT TRUE,
    orden SMALLINT NOT NULL DEFAULT 100,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    CONSTRAINT chk_tipo_condicion_trabajador_codigo CHECK (codigo = UPPER(codigo) AND codigo ~ '^[A-Z0-9_]+$'),
    CONSTRAINT chk_tipo_condicion_trabajador_grupo CHECK (grupo IN ('GENERAL', 'LABORAL', 'PREVISION', 'SALUD', 'AFC')),
    CONSTRAINT chk_tipo_condicion_trabajador_orden CHECK (orden >= 0)
);

COMMENT ON TABLE tipo_condicion_trabajador IS 'Catalogo de condiciones especiales del trabajador. No reemplaza tipo_trabajador, que queda como categoria base.';
COMMENT ON COLUMN tipo_condicion_trabajador.codigo IS 'Codigo canonico de condicion especial. No usar MENOR_18 ni MAYOR_65: esos perfiles se derivan desde fecha_nacimiento y periodo.';

CREATE TABLE IF NOT EXISTS persona_condicion_trabajador (
    id_persona_condicion_trabajador SERIAL PRIMARY KEY,
    id_persona INT NOT NULL REFERENCES persona(id_persona) ON DELETE CASCADE,
    id_contrato INT REFERENCES contrato(id_contrato) ON DELETE CASCADE,
    id_tipo_condicion_trabajador INT NOT NULL REFERENCES tipo_condicion_trabajador(id_tipo_condicion_trabajador),
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    vigencia_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
    vigencia_fin DATE,
    respaldo_registrado BOOLEAN NOT NULL DEFAULT FALSE,
    observacion TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    CONSTRAINT chk_persona_condicion_trabajador_vigencia CHECK (vigencia_fin IS NULL OR vigencia_fin >= vigencia_inicio),
    CONSTRAINT chk_persona_condicion_trabajador_observacion CHECK (observacion IS NULL OR length(trim(observacion)) > 0)
);

COMMENT ON TABLE persona_condicion_trabajador IS 'Condiciones especiales persistidas por persona y opcionalmente por contrato. Permite combinaciones como dependiente pensionado o casa particular pensionado sin ampliar tipo_trabajador.';
COMMENT ON COLUMN persona_condicion_trabajador.id_contrato IS 'Opcional. Si la condicion aplica al vinculo laboral concreto, asociarla al contrato; si aplica a la persona, dejar NULL.';
COMMENT ON COLUMN persona_condicion_trabajador.respaldo_registrado IS 'Indica si RRHH registro el respaldo operativo/documental requerido por la condicion.';

CREATE INDEX IF NOT EXISTS idx_tipo_condicion_trabajador_codigo
ON tipo_condicion_trabajador(codigo);

CREATE INDEX IF NOT EXISTS idx_tipo_condicion_trabajador_vigente_orden
ON tipo_condicion_trabajador(vigente, orden, nombre);

CREATE INDEX IF NOT EXISTS idx_persona_condicion_trabajador_persona
ON persona_condicion_trabajador(id_persona);

CREATE INDEX IF NOT EXISTS idx_persona_condicion_trabajador_contrato
ON persona_condicion_trabajador(id_contrato);

CREATE INDEX IF NOT EXISTS idx_persona_condicion_trabajador_tipo
ON persona_condicion_trabajador(id_tipo_condicion_trabajador);

CREATE INDEX IF NOT EXISTS idx_persona_condicion_trabajador_vigente
ON persona_condicion_trabajador(id_persona, activa, vigencia_inicio, vigencia_fin);

-- Evita duplicar una condicion activa y sin cierre para la misma persona/contrato.
-- COALESCE(id_contrato, 0) permite controlar tambien condiciones persona-level con contrato NULL.
CREATE UNIQUE INDEX IF NOT EXISTS uq_persona_condicion_trabajador_activa
ON persona_condicion_trabajador(id_persona, (COALESCE(id_contrato, 0)), id_tipo_condicion_trabajador)
WHERE activa = TRUE AND vigencia_fin IS NULL;

INSERT INTO tipo_condicion_trabajador (
    codigo,
    nombre,
    descripcion,
    grupo,
    afecta_prevision,
    afecta_salud,
    afecta_afc,
    requiere_respaldo,
    orden
) VALUES
    (
        'PENSIONADO',
        'Pensionado',
        'Trabajador que ya tiene calidad de pensionado. La condicion permite guiar revision previsional, salud y AFC.',
        'PREVISION',
        TRUE,
        TRUE,
        TRUE,
        TRUE,
        10
    ),
    (
        'PENSIONADO_INVALIDEZ_PARCIAL',
        'Pensionado por invalidez parcial',
        'Condicion previsional especial que puede modificar reglas de cotizacion y Seguro de Cesantia segun revision normativa.',
        'PREVISION',
        TRUE,
        TRUE,
        TRUE,
        TRUE,
        20
    ),
    (
        'PENSIONADO_INVALIDEZ_TOTAL',
        'Pensionado por invalidez total',
        'Condicion previsional especial asociada a exenciones previsionales y revision de salud.',
        'PREVISION',
        TRUE,
        TRUE,
        TRUE,
        TRUE,
        30
    ),
    (
        'EXENTO_COTIZACION_PENSION',
        'Exento de cotizar pension',
        'Trabajador pensionado que informo exencion de cotizacion previsional. Requiere respaldo antes de impactar calculo.',
        'PREVISION',
        TRUE,
        FALSE,
        FALSE,
        TRUE,
        40
    ),
    (
        'TRABAJADOR_ADOLESCENTE_PROTEGIDO',
        'Trabajador adolescente protegido',
        'Condicion operativa para trabajador menor de edad con reglas laborales especiales. La edad se deriva desde fecha de nacimiento.',
        'LABORAL',
        FALSE,
        FALSE,
        TRUE,
        TRUE,
        50
    ),
    (
        'AUTORIZACION_MENOR_REGISTRADA',
        'Autorizacion de menor registrada',
        'Respaldo administrativo de autorizacion para trabajador adolescente protegido.',
        'LABORAL',
        FALSE,
        FALSE,
        FALSE,
        TRUE,
        60
    ),
    (
        'TECNICO_EXTRANJERO_EXENTO',
        'Tecnico extranjero exento',
        'Condicion especial para tratamiento previsional de tecnico extranjero, sujeta a respaldo y revision normativa.',
        'PREVISION',
        TRUE,
        TRUE,
        FALSE,
        TRUE,
        70
    ),
    (
        'DISCAPACIDAD',
        'Situacion de discapacidad',
        'Condicion informativa para gestion laboral y respaldos. No modifica calculo por si sola en esta fase.',
        'GENERAL',
        FALSE,
        FALSE,
        FALSE,
        TRUE,
        80
    )
ON CONFLICT (codigo) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion,
    grupo = EXCLUDED.grupo,
    afecta_prevision = EXCLUDED.afecta_prevision,
    afecta_salud = EXCLUDED.afecta_salud,
    afecta_afc = EXCLUDED.afecta_afc,
    requiere_respaldo = EXCLUDED.requiere_respaldo,
    orden = EXCLUDED.orden,
    vigente = TRUE,
    updated_at = NOW();

CREATE OR REPLACE FUNCTION fn_obtener_perfil_laboral_persona(
    p_id_persona INT,
    p_periodo VARCHAR
)
RETURNS TABLE (
    id_persona INT,
    periodo VARCHAR(7),
    edad_periodo INT,
    tramo_edad_laboral VARCHAR(30),
    es_menor_18 BOOLEAN,
    es_adulto_18_65 BOOLEAN,
    es_mayor_65 BOOLEAN,
    es_pensionado BOOLEAN,
    es_pensionado_invalidez_parcial BOOLEAN,
    es_pensionado_invalidez_total BOOLEAN,
    exento_cotizacion_pension BOOLEAN,
    trabajador_adolescente_protegido BOOLEAN,
    autorizacion_menor_registrada BOOLEAN,
    aplica_imm_general BOOLEAN,
    aplica_imm_menor18_mayor65 BOOLEAN,
    requiere_revision_rrhh BOOLEAN
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
WITH entrada AS (
    SELECT p_periodo::VARCHAR(7) AS periodo
    WHERE p_periodo ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'
),
periodo_resuelto AS (
    SELECT
        e.periodo,
        COALESCE(pr.fecha_inicio, TO_DATE(e.periodo || '-01', 'YYYY-MM-DD')) AS fecha_inicio,
        COALESCE(
            pr.fecha_fin,
            (DATE_TRUNC('month', TO_DATE(e.periodo || '-01', 'YYYY-MM-DD')) + INTERVAL '1 month - 1 day')::DATE
        ) AS fecha_fin
    FROM entrada e
    LEFT JOIN periodo_remuneracion pr
        ON pr.codigo = e.periodo
),
persona_base AS (
    SELECT
        p.id_persona,
        pr.periodo,
        pr.fecha_inicio,
        pr.fecha_fin,
        EXTRACT(YEAR FROM AGE(pr.fecha_fin, p.fecha_nacimiento))::INT AS edad_periodo
    FROM persona p
    CROSS JOIN periodo_resuelto pr
    WHERE p.id_persona = p_id_persona
),
condiciones AS (
    SELECT
        COALESCE(BOOL_OR(tct.codigo = 'PENSIONADO'), FALSE) AS es_pensionado,
        COALESCE(BOOL_OR(tct.codigo = 'PENSIONADO_INVALIDEZ_PARCIAL'), FALSE) AS es_pensionado_invalidez_parcial,
        COALESCE(BOOL_OR(tct.codigo = 'PENSIONADO_INVALIDEZ_TOTAL'), FALSE) AS es_pensionado_invalidez_total,
        COALESCE(BOOL_OR(tct.codigo = 'EXENTO_COTIZACION_PENSION'), FALSE) AS exento_cotizacion_pension,
        COALESCE(BOOL_OR(tct.codigo = 'TRABAJADOR_ADOLESCENTE_PROTEGIDO'), FALSE) AS trabajador_adolescente_protegido,
        COALESCE(BOOL_OR(tct.codigo = 'AUTORIZACION_MENOR_REGISTRADA'), FALSE) AS autorizacion_menor_registrada
    FROM persona_base pb
    LEFT JOIN persona_condicion_trabajador pct
        ON pct.id_persona = pb.id_persona
       AND pct.activa = TRUE
       AND pct.vigencia_inicio <= pb.fecha_fin
       AND (pct.vigencia_fin IS NULL OR pct.vigencia_fin >= pb.fecha_inicio)
    LEFT JOIN tipo_condicion_trabajador tct
        ON tct.id_tipo_condicion_trabajador = pct.id_tipo_condicion_trabajador
       AND tct.vigente = TRUE
)
SELECT
    pb.id_persona,
    pb.periodo,
    pb.edad_periodo,
    CASE
        WHEN pb.edad_periodo < 18 THEN 'MENOR_18'
        WHEN pb.edad_periodo BETWEEN 18 AND 65 THEN 'ADULTO_18_65'
        WHEN pb.edad_periodo > 65 THEN 'MAYOR_65'
        ELSE 'SIN_FECHA_NACIMIENTO'
    END::VARCHAR(30) AS tramo_edad_laboral,
    (pb.edad_periodo < 18) AS es_menor_18,
    (pb.edad_periodo BETWEEN 18 AND 65) AS es_adulto_18_65,
    (pb.edad_periodo > 65) AS es_mayor_65,
    c.es_pensionado,
    c.es_pensionado_invalidez_parcial,
    c.es_pensionado_invalidez_total,
    c.exento_cotizacion_pension,
    c.trabajador_adolescente_protegido,
    c.autorizacion_menor_registrada,
    (pb.edad_periodo BETWEEN 18 AND 65) AS aplica_imm_general,
    (pb.edad_periodo < 18 OR pb.edad_periodo > 65) AS aplica_imm_menor18_mayor65,
    (
        pb.edad_periodo < 18
        OR pb.edad_periodo > 65
        OR c.es_pensionado
        OR c.es_pensionado_invalidez_parcial
        OR c.es_pensionado_invalidez_total
        OR c.exento_cotizacion_pension
        OR c.trabajador_adolescente_protegido
    ) AS requiere_revision_rrhh
FROM persona_base pb
CROSS JOIN condiciones c;
$$;

COMMENT ON FUNCTION fn_obtener_perfil_laboral_persona(INT, VARCHAR) IS 'Retorna perfil laboral/previsional derivado por persona y periodo. Menor de 18 y mayor de 65 se derivan desde fecha_nacimiento; pensionado/exenciones desde persona_condicion_trabajador.';

-- RLS/permisos locales. Este archivo corre despues de 08_seguridad_rls.sql.
GRANT SELECT ON TABLE tipo_condicion_trabajador TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE persona_condicion_trabajador TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON FUNCTION fn_obtener_perfil_laboral_persona(INT, VARCHAR) TO anon, authenticated;

ALTER TABLE tipo_condicion_trabajador ENABLE ROW LEVEL SECURITY;
ALTER TABLE persona_condicion_trabajador ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'tipo_condicion_trabajador'
          AND policyname = 'tipo_condicion_trabajador_select_anon_authenticated'
    ) THEN
        CREATE POLICY tipo_condicion_trabajador_select_anon_authenticated
        ON tipo_condicion_trabajador
        FOR SELECT
        TO anon, authenticated
        USING (true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'persona_condicion_trabajador'
          AND policyname = 'persona_condicion_trabajador_select'
    ) THEN
        CREATE POLICY persona_condicion_trabajador_select
        ON persona_condicion_trabajador
        FOR SELECT
        TO anon, authenticated
        USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'persona_condicion_trabajador'
          AND policyname = 'persona_condicion_trabajador_insert'
    ) THEN
        CREATE POLICY persona_condicion_trabajador_insert
        ON persona_condicion_trabajador
        FOR INSERT
        TO anon, authenticated
        WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'persona_condicion_trabajador'
          AND policyname = 'persona_condicion_trabajador_update'
    ) THEN
        CREATE POLICY persona_condicion_trabajador_update
        ON persona_condicion_trabajador
        FOR UPDATE
        TO anon, authenticated
        USING (true)
        WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'persona_condicion_trabajador'
          AND policyname = 'persona_condicion_trabajador_delete'
    ) THEN
        CREATE POLICY persona_condicion_trabajador_delete
        ON persona_condicion_trabajador
        FOR DELETE
        TO anon, authenticated
        USING (true);
    END IF;
END $$;
