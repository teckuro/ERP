-- Faltantes normativos v6.11 para aplicar sobre una BD existente.
-- No elimina datos: agrega columnas/tablas si faltan y carga catalogos base.

BEGIN;

ALTER TABLE institucion_apv ADD COLUMN IF NOT EXISTS codigo VARCHAR(10);
ALTER TABLE institucion_apv ADD COLUMN IF NOT EXISTS vigente BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE forma_pago_apv ADD COLUMN IF NOT EXISTS codigo VARCHAR(10);
ALTER TABLE forma_pago_apv ADD COLUMN IF NOT EXISTS vigente BOOLEAN NOT NULL DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS entidad_previsional_ips (
    id_entidad_previsional_ips SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL UNIQUE,
    vigente BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS ex_caja_previsional (
    id_ex_caja_previsional SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL UNIQUE,
    vigente BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS regimen_ex_caja (
    id_regimen_ex_caja SERIAL PRIMARY KEY,
    id_ex_caja_previsional INT NOT NULL REFERENCES ex_caja_previsional(id_ex_caja_previsional),
    nombre VARCHAR(150) NOT NULL,
    tasa_cotizacion_referencia NUMERIC(7,4),
    vigente BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_regimen_ex_caja UNIQUE (id_ex_caja_previsional, nombre)
);

ALTER TABLE prevision ADD COLUMN IF NOT EXISTS id_entidad_previsional_ips INT;
ALTER TABLE prevision ADD COLUMN IF NOT EXISTS id_ex_caja_previsional INT;
ALTER TABLE prevision ADD COLUMN IF NOT EXISTS id_regimen_ex_caja INT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_institucion_apv_codigo'
    ) THEN
        ALTER TABLE institucion_apv ADD CONSTRAINT uq_institucion_apv_codigo UNIQUE (codigo);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_forma_pago_apv_codigo'
    ) THEN
        ALTER TABLE forma_pago_apv ADD CONSTRAINT uq_forma_pago_apv_codigo UNIQUE (codigo);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'prevision_id_entidad_previsional_ips_fkey'
    ) THEN
        ALTER TABLE prevision
            ADD CONSTRAINT prevision_id_entidad_previsional_ips_fkey
            FOREIGN KEY (id_entidad_previsional_ips)
            REFERENCES entidad_previsional_ips(id_entidad_previsional_ips);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'prevision_id_ex_caja_previsional_fkey'
    ) THEN
        ALTER TABLE prevision
            ADD CONSTRAINT prevision_id_ex_caja_previsional_fkey
            FOREIGN KEY (id_ex_caja_previsional)
            REFERENCES ex_caja_previsional(id_ex_caja_previsional);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'prevision_id_regimen_ex_caja_fkey'
    ) THEN
        ALTER TABLE prevision
            ADD CONSTRAINT prevision_id_regimen_ex_caja_fkey
            FOREIGN KEY (id_regimen_ex_caja)
            REFERENCES regimen_ex_caja(id_regimen_ex_caja);
    END IF;
END $$;

ALTER TABLE prevision DROP CONSTRAINT IF EXISTS chk_prevision_reglas;
ALTER TABLE prevision ADD CONSTRAINT chk_prevision_reglas CHECK (
    (
        tipo_prevision = 'AFP' AND
        id_afp IS NOT NULL AND
        id_ex_caja_previsional IS NULL AND
        id_regimen_ex_caja IS NULL AND
        nombre_ex_caja IS NULL AND
        regimen_ex_caja IS NULL AND
        tasa_ex_caja IS NULL
    ) OR
    (
        tipo_prevision = 'IPS' AND
        id_afp IS NULL AND
        (
            (id_ex_caja_previsional IS NOT NULL AND id_regimen_ex_caja IS NOT NULL) OR
            (nombre_ex_caja IS NOT NULL AND regimen_ex_caja IS NOT NULL AND tasa_ex_caja IS NOT NULL)
        )
    ) OR
    (
        tipo_prevision = 'NINGUNA' AND
        id_afp IS NULL AND
        id_ex_caja_previsional IS NULL AND
        id_regimen_ex_caja IS NULL AND
        nombre_ex_caja IS NULL AND
        regimen_ex_caja IS NULL AND
        tasa_ex_caja IS NULL
    )
);

CREATE TABLE IF NOT EXISTS trabajo_pesado_parametro (
    id_trabajo_pesado_parametro SERIAL PRIMARY KEY,
    codigo VARCHAR(30) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    tasa_trabajador NUMERIC(7,4) NOT NULL,
    tasa_empleador NUMERIC(7,4) NOT NULL,
    tasa_total NUMERIC(7,4) NOT NULL,
    requiere_dictamen_cen BOOLEAN NOT NULL DEFAULT TRUE,
    fuente TEXT,
    vigente BOOLEAN NOT NULL DEFAULT TRUE,
    vigencia_inicio DATE NOT NULL DEFAULT DATE '2025-08-01',
    vigencia_fin DATE,
    CONSTRAINT chk_trabajo_pesado_tasas CHECK (tasa_trabajador >= 0 AND tasa_empleador >= 0 AND tasa_total >= 0),
    CONSTRAINT chk_trabajo_pesado_vigencia CHECK (vigencia_fin IS NULL OR vigencia_fin >= vigencia_inicio)
);

CREATE TABLE IF NOT EXISTS reforma_previsional_parametro (
    id_reforma_previsional_parametro SERIAL PRIMARY KEY,
    vigencia_inicio DATE NOT NULL UNIQUE,
    vigencia_fin DATE,
    aporte_empleador_total NUMERIC(7,4) NOT NULL,
    cuenta_capitalizacion_individual NUMERIC(7,4) NOT NULL,
    fapp_seguro_social NUMERIC(7,4) NOT NULL,
    fuente TEXT,
    CONSTRAINT chk_reforma_previsional_tasas CHECK (
        aporte_empleador_total >= 0
        AND cuenta_capitalizacion_individual >= 0
        AND fapp_seguro_social >= 0
    ),
    CONSTRAINT chk_reforma_previsional_vigencia CHECK (vigencia_fin IS NULL OR vigencia_fin >= vigencia_inicio)
);

CREATE TABLE IF NOT EXISTS ley_16744_parametros (
    id_ley_16744_parametro SERIAL PRIMARY KEY,
    codigo VARCHAR(30) NOT NULL UNIQUE,
    cotizacion_basica_empleador NUMERIC(7,4) NOT NULL,
    descripcion_tasa_adicional TEXT,
    fuente_financiamiento TEXT,
    fuente_organismos TEXT,
    vigente BOOLEAN NOT NULL DEFAULT TRUE,
    vigencia_inicio DATE NOT NULL DEFAULT DATE '2026-04-01',
    vigencia_fin DATE,
    CONSTRAINT chk_ley_16744_parametros_tasa CHECK (cotizacion_basica_empleador >= 0),
    CONSTRAINT chk_ley_16744_parametros_vigencia CHECK (vigencia_fin IS NULL OR vigencia_fin >= vigencia_inicio)
);

CREATE TABLE IF NOT EXISTS organismo_administrador_ley_16744 (
    id_organismo_administrador_ley_16744 SERIAL PRIMARY KEY,
    codigo VARCHAR(30) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL UNIQUE,
    tipo VARCHAR(30) NOT NULL,
    vigente BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS ccaf_entidad (
    id_ccaf_entidad SERIAL PRIMARY KEY,
    codigo VARCHAR(30) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL UNIQUE,
    vigente BOOLEAN NOT NULL DEFAULT TRUE,
    fuente TEXT
);

CREATE TABLE IF NOT EXISTS empresa_ley_16744 (
    id_empresa_ley_16744 SERIAL PRIMARY KEY,
    id_empresa INT NOT NULL REFERENCES empresa(id_empresa) ON DELETE CASCADE,
    id_organismo_administrador_ley_16744 INT REFERENCES organismo_administrador_ley_16744(id_organismo_administrador_ley_16744),
    tasa_adicional_diferenciada NUMERIC(7,4) NOT NULL DEFAULT 0,
    actividad_economica VARCHAR(200),
    fuente_resolucion_o_certificado TEXT,
    vigencia_inicio DATE NOT NULL,
    vigencia_fin DATE,
    CONSTRAINT uq_empresa_ley_16744 UNIQUE (id_empresa, vigencia_inicio),
    CONSTRAINT chk_empresa_ley_16744_tasa CHECK (tasa_adicional_diferenciada >= 0),
    CONSTRAINT chk_empresa_ley_16744_vigencia CHECK (vigencia_fin IS NULL OR vigencia_fin >= vigencia_inicio)
);

CREATE INDEX IF NOT EXISTS idx_trabajo_pesado_parametro_fecha ON trabajo_pesado_parametro(vigencia_inicio, vigencia_fin);
CREATE INDEX IF NOT EXISTS idx_reforma_previsional_parametro_fecha ON reforma_previsional_parametro(vigencia_inicio, vigencia_fin);
CREATE INDEX IF NOT EXISTS idx_ley_16744_parametros_fecha ON ley_16744_parametros(vigencia_inicio, vigencia_fin);
CREATE INDEX IF NOT EXISTS idx_empresa_ley_16744_empresa_fecha ON empresa_ley_16744(id_empresa, vigencia_inicio, vigencia_fin);
CREATE INDEX IF NOT EXISTS idx_prevision_ex_caja ON prevision(id_ex_caja_previsional, id_regimen_ex_caja);

UPDATE forma_pago_apv
SET codigo = '1', nombre = 'Directa', vigente = TRUE
WHERE id_forma_pago_apv = 1;

UPDATE forma_pago_apv
SET codigo = '2', nombre = 'Indirecta', vigente = TRUE
WHERE id_forma_pago_apv = 2;

UPDATE institucion_apv
SET codigo = '121', nombre = 'METLIFE CHILE SEGUROS DE VIDA S.A.', vigente = TRUE
WHERE nombre = 'MetLife';

INSERT INTO institucion_apv (codigo, nombre, vigente) VALUES
    ('000', 'No Cotiza A.P.V.', TRUE),
    ('003', 'Cuprum', TRUE),
    ('005', 'Habitat', TRUE),
    ('008', 'Provida', TRUE),
    ('029', 'Planvital', TRUE),
    ('033', 'Capital', TRUE),
    ('034', 'Modelo', TRUE),
    ('035', 'Uno', TRUE),
    ('102', 'SANTANDER SEGUROS DE VIDA S.A.', TRUE),
    ('103', 'BCI SEGUROS VIDA S.A.', TRUE),
    ('106', 'BICE VIDA COMPANIA DE SEGUROS S.A.', TRUE),
    ('107', 'ZURICH CHILE SEGUROS DE VIDA.', TRUE),
    ('111', 'CIA DE SEG. DE VIDA CONSORCIO NACIONAL DE SEG S.A.', TRUE),
    ('116', 'COMPANIA DE SEGUROS CONFUTURO S.A.', TRUE),
    ('118', 'SEGUROS DE VIDA SURA S.A.', TRUE),
    ('121', 'METLIFE CHILE SEGUROS DE VIDA S.A.', TRUE),
    ('128', 'OHIO NATIONAL SEGUROS DE VIDA S.A.', TRUE),
    ('129', 'PRINCIPAL COMPANIA DE SEGUROS DE VIDA CHILE S.A.', TRUE),
    ('131', 'SEGUROS DE VIDA SECURITY PREVISION S.A.', TRUE),
    ('137', 'PRUDENTIAL AGF. (APV)', TRUE),
    ('151', 'CREDICORP CAPITAL ASSET MANAGMENT S.A AGF', TRUE),
    ('204', 'BCI ASSET MANAGEMENT ADMINISTRADORA GENERAL DE FONDOS S.A.', TRUE),
    ('205', 'BICE INVERSIONES AGF S.A.', TRUE),
    ('208', 'BTG PACTUAL CHILE S.A. ADMINISTRADORA GENERAL DE FONDOS', TRUE),
    ('214', 'PRINCIPAL ASSET MANAGEMENT AGF S.A.', TRUE),
    ('215', 'SANTANDER ASSET MANAGEMENT S.A. ADM. GENERAL DE FONDOS', TRUE),
    ('217', 'SCOTIA SUDAMERICANO ADMINISTRADORA DE FONDOS MUTUOS S.A.', TRUE),
    ('218', 'ADMINISTRADORA GENERAL DE FONDOS SECURITY S.A.', TRUE),
    ('225', 'ITAU ADMINISTRADORA GENERAL DE FONDOS S.A.', TRUE),
    ('229', 'BANCOESTADO S.A. ADMINISTRADORA GENERAL DE FONDOS', TRUE),
    ('237', 'FINTUAL ADMINISTRADORA GENERAL DE FONDOS S.A', TRUE),
    ('238', 'FOCUS AGF S.A.', TRUE),
    ('600', 'ZURICH CHILE ASSET MANAGEMENT ADMINISTRADORA GENERAL DE FONDOS S.A', TRUE),
    ('601', 'LARRAIN VIAL ADMINISTRADORA GENERAL DE FONDOS S.A.', TRUE),
    ('213', 'LARRAIN VIAL S.A. CORREDORA DE BOLSA', TRUE),
    ('222', 'BANCHILE CORREDORES DE BOLSA S.A.', TRUE),
    ('227', 'CORREDORES DE BOLSA SURA S.A.', TRUE),
    ('228', 'BTG PACTUAL CHILE S.A. CORREDORES DE BOLSA', TRUE),
    ('232', 'BICE INVERSIONES CORREDORES DE BOLSA S.A.', TRUE),
    ('235', 'MBI CORREDORES DE BOLSA S.A.', TRUE),
    ('236', 'CONSORCIO CORREDORES DE BOLSA S.A.', TRUE),
    ('240', 'FINANZAS Y NEGOCIOS S.A. CORREDORES DE BOLSA', TRUE)
ON CONFLICT (nombre) DO UPDATE SET codigo = EXCLUDED.codigo, vigente = EXCLUDED.vigente;

INSERT INTO forma_pago_apv (codigo, nombre, vigente) VALUES
    ('1', 'Directa', TRUE),
    ('2', 'Indirecta', TRUE)
ON CONFLICT (nombre) DO UPDATE SET codigo = EXCLUDED.codigo, vigente = EXCLUDED.vigente;

INSERT INTO entidad_previsional_ips (nombre, vigente)
VALUES ('IPS (Ex-INP)', TRUE)
ON CONFLICT (nombre) DO UPDATE SET
    vigente = EXCLUDED.vigente;

INSERT INTO ex_caja_previsional (nombre, vigente) VALUES
    ('Empart', TRUE),
    ('Bancaria', TRUE),
    ('Triomar', TRUE),
    ('Hípica Nacional', TRUE),
    ('Servicios de Seguro Social', TRUE),
    ('Empleados de Emos', TRUE),
    ('Obreros de Emos', TRUE),
    ('Caja Ferro', TRUE),
    ('Canaempu: Periodistas', TRUE),
    ('Caja de Previsión Social de los EE', TRUE),
    ('OO Municipales de la Republica', TRUE),
    ('Sección Esp.Previsión Empleados', TRUE),
    ('Caja de Previsión de Gildemeister', TRUE),
    ('Mauricio, Hochschild', TRUE),
    ('Secgasco', TRUE)
ON CONFLICT (nombre) DO UPDATE SET
    vigente = EXCLUDED.vigente;

INSERT INTO regimen_ex_caja (
    id_ex_caja_previsional,
    nombre,
    tasa_cotizacion_referencia,
    vigente
)
SELECT
    excaja.id_ex_caja_previsional,
    seed.nombre_regimen,
    seed.tasa_cotizacion_referencia,
    TRUE
FROM (
    VALUES
        ('Empart', 'Régimen 4', NULL::NUMERIC(7,4)),
        ('Empart', 'Régimen 6', NULL::NUMERIC(7,4)),
        ('Bancaria', 'Régimen 1', NULL::NUMERIC(7,4)),
        ('Bancaria', 'Régimen 2', NULL::NUMERIC(7,4)),
        ('Bancaria', 'Régimen 3', NULL::NUMERIC(7,4)),
        ('Bancaria', 'Régimen 14', NULL::NUMERIC(7,4)),
        ('Bancaria', 'Régimen 21', NULL::NUMERIC(7,4)),
        ('Bancaria', 'Régimen 34', NULL::NUMERIC(7,4)),
        ('Triomar', 'Régimen 1', NULL::NUMERIC(7,4)),
        ('Triomar', 'Régimen 2', NULL::NUMERIC(7,4)),
        ('Triomar', 'Régimen 3', NULL::NUMERIC(7,4)),
        ('Triomar', 'Régimen 4', NULL::NUMERIC(7,4)),
        ('Hípica Nacional', 'Régimen 1', NULL::NUMERIC(7,4)),
        ('Hípica Nacional', 'Régimen 2', NULL::NUMERIC(7,4)),
        ('Hípica Nacional', 'Régimen 3', NULL::NUMERIC(7,4)),
        ('Hípica Nacional', 'Régimen 4', NULL::NUMERIC(7,4)),
        ('Servicios de Seguro Social', 'Régimen 1', NULL::NUMERIC(7,4)),
        ('Servicios de Seguro Social', 'Régimen 2', NULL::NUMERIC(7,4)),
        ('Empleados de Emos', 'Régimen 1', NULL::NUMERIC(7,4)),
        ('Obreros de Emos', 'Régimen 1', NULL::NUMERIC(7,4)),
        ('Caja Ferro', 'Régimen 2', NULL::NUMERIC(7,4)),
        ('Caja Ferro', 'Régimen 3', NULL::NUMERIC(7,4)),
        ('Caja Ferro', 'Régimen 4', NULL::NUMERIC(7,4)),
        ('Caja Ferro', 'Régimen 5', NULL::NUMERIC(7,4)),
        ('Caja Ferro', 'Régimen 7', NULL::NUMERIC(7,4)),
        ('Canaempu: Periodistas', 'Régimen 1', NULL::NUMERIC(7,4)),
        ('Canaempu: Periodistas', 'Régimen 2', NULL::NUMERIC(7,4)),
        ('Canaempu: Periodistas', 'Régimen 3', NULL::NUMERIC(7,4)),
        ('Canaempu: Periodistas', 'Régimen 4', NULL::NUMERIC(7,4)),
        ('Canaempu: Periodistas', 'Régimen 5', NULL::NUMERIC(7,4)),
        ('Canaempu: Periodistas', 'Régimen 6', NULL::NUMERIC(7,4)),
        ('Canaempu: Periodistas', 'Régimen 7', NULL::NUMERIC(7,4)),
        ('Canaempu: Periodistas', 'Régimen 8', NULL::NUMERIC(7,4)),
        ('Caja de Previsión Social de los EE', 'Régimen 1', NULL::NUMERIC(7,4)),
        ('Caja de Previsión Social de los EE', 'Régimen 2', NULL::NUMERIC(7,4)),
        ('OO Municipales de la Republica', 'Régimen 1', NULL::NUMERIC(7,4)),
        ('OO Municipales de la Republica', 'Régimen 2', NULL::NUMERIC(7,4)),
        ('OO Municipales de la Republica', 'Régimen 3', NULL::NUMERIC(7,4)),
        ('Sección Esp.Previsión Empleados', 'Régimen 1', NULL::NUMERIC(7,4)),
        ('Sección Esp.Previsión Empleados', 'Régimen 2', NULL::NUMERIC(7,4)),
        ('Caja de Previsión de Gildemeister', 'Régimen 1', NULL::NUMERIC(7,4)),
        ('Caja de Previsión de Gildemeister', 'Régimen 2', NULL::NUMERIC(7,4)),
        ('Mauricio, Hochschild', 'Régimen 1', NULL::NUMERIC(7,4)),
        ('Mauricio, Hochschild', 'Régimen 2', NULL::NUMERIC(7,4)),
        ('Secgasco', 'Régimen 1', NULL::NUMERIC(7,4)),
        ('Secgasco', 'Régimen 2', NULL::NUMERIC(7,4))
) AS seed(nombre_ex_caja, nombre_regimen, tasa_cotizacion_referencia)
JOIN ex_caja_previsional excaja
    ON excaja.nombre = seed.nombre_ex_caja
ON CONFLICT (id_ex_caja_previsional, nombre) DO UPDATE SET
    tasa_cotizacion_referencia = EXCLUDED.tasa_cotizacion_referencia,
    vigente = EXCLUDED.vigente;

INSERT INTO trabajo_pesado_parametro (
    codigo, nombre, tasa_trabajador, tasa_empleador, tasa_total,
    requiere_dictamen_cen, fuente, vigente, vigencia_inicio
) VALUES
    ('PESADO', 'Trabajo pesado', 2.0000, 2.0000, 4.0000, TRUE, 'https://www.spensiones.cl/portal/compendio/596/w3-propertyvalue-4282.html', TRUE, DATE '2025-08-01'),
    ('MENOS_PESADO', 'Trabajo pesado con menor desgaste relativo', 1.0000, 1.0000, 2.0000, TRUE, 'https://www.spensiones.cl/portal/compendio/596/w3-propertyvalue-4282.html', TRUE, DATE '2025-08-01')
ON CONFLICT (codigo) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    tasa_trabajador = EXCLUDED.tasa_trabajador,
    tasa_empleador = EXCLUDED.tasa_empleador,
    tasa_total = EXCLUDED.tasa_total,
    requiere_dictamen_cen = EXCLUDED.requiere_dictamen_cen,
    fuente = EXCLUDED.fuente,
    vigente = EXCLUDED.vigente,
    vigencia_inicio = EXCLUDED.vigencia_inicio;

INSERT INTO reforma_previsional_parametro (
    vigencia_inicio, vigencia_fin, aporte_empleador_total,
    cuenta_capitalizacion_individual, fapp_seguro_social, fuente
) VALUES (
    DATE '2025-08-01',
    DATE '2026-07-31',
    1.0000,
    0.1000,
    0.9000,
    'https://www.spensiones.cl/portal/institucional/594/w3-article-16615.html'
)
ON CONFLICT (vigencia_inicio) DO UPDATE SET
    vigencia_fin = EXCLUDED.vigencia_fin,
    aporte_empleador_total = EXCLUDED.aporte_empleador_total,
    cuenta_capitalizacion_individual = EXCLUDED.cuenta_capitalizacion_individual,
    fapp_seguro_social = EXCLUDED.fapp_seguro_social,
    fuente = EXCLUDED.fuente;

INSERT INTO ley_16744_parametros (
    codigo, cotizacion_basica_empleador, descripcion_tasa_adicional,
    fuente_financiamiento, fuente_organismos, vigente, vigencia_inicio
) VALUES (
    'LEY_16744_BASE',
    0.9000,
    'depende de actividad/siniestralidad de la empresa',
    'https://www.suseso.cl/606/w3-article-18613.html',
    'https://www.suseso.cl/606/w3-article-19892.html',
    TRUE,
    DATE '2026-04-01'
)
ON CONFLICT (codigo) DO UPDATE SET
    cotizacion_basica_empleador = EXCLUDED.cotizacion_basica_empleador,
    descripcion_tasa_adicional = EXCLUDED.descripcion_tasa_adicional,
    fuente_financiamiento = EXCLUDED.fuente_financiamiento,
    fuente_organismos = EXCLUDED.fuente_organismos,
    vigente = EXCLUDED.vigente,
    vigencia_inicio = EXCLUDED.vigencia_inicio;

INSERT INTO organismo_administrador_ley_16744 (codigo, nombre, tipo, vigente) VALUES
    ('ACHS', 'Asociacion Chilena de Seguridad', 'MUTUALIDAD', TRUE),
    ('MUSEG', 'Mutual de Seguridad de la Camara Chilena de la Construccion', 'MUTUALIDAD', TRUE),
    ('IST', 'Instituto de Seguridad del Trabajo', 'MUTUALIDAD', TRUE),
    ('ISL', 'Instituto de Seguridad Laboral', 'PUBLICO', TRUE)
ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre, tipo = EXCLUDED.tipo, vigente = EXCLUDED.vigente;

INSERT INTO ccaf_entidad (codigo, nombre, vigente, fuente) VALUES
    ('LOS_ANDES', 'CCAF Los Andes', TRUE, 'https://www.suseso.cl/606/w3-propertyvalue-34003.html'),
    ('LA_ARAUCANA', 'CCAF La Araucana', TRUE, 'https://www.suseso.cl/606/w3-propertyvalue-34003.html'),
    ('LOS_HEROES', 'CCAF Los Heroes', TRUE, 'https://www.suseso.cl/606/w3-propertyvalue-34003.html'),
    ('18_SEPTIEMBRE', 'CCAF 18 de Septiembre', TRUE, 'https://www.suseso.cl/606/w3-propertyvalue-34003.html')
ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre, vigente = EXCLUDED.vigente, fuente = EXCLUDED.fuente;

INSERT INTO parametros_legales (nombre, valor_decimal, vigencia_inicio) VALUES
    ('LEY_SANNA', 0.03, DATE '2026-04-01')
ON CONFLICT (nombre, vigencia_inicio) DO UPDATE SET valor_decimal = EXCLUDED.valor_decimal;

DO $$
DECLARE
    catalog_table TEXT;
    catalog_tables TEXT[] := ARRAY[
        'institucion_apv',
        'forma_pago_apv',
        'entidad_previsional_ips',
        'ex_caja_previsional',
        'regimen_ex_caja',
        'trabajo_pesado_parametro',
        'reforma_previsional_parametro',
        'ley_16744_parametros',
        'organismo_administrador_ley_16744',
        'ccaf_entidad',
        'empresa_ley_16744'
    ];
BEGIN
    FOREACH catalog_table IN ARRAY catalog_tables LOOP
        EXECUTE format('GRANT SELECT ON TABLE public.%I TO anon, authenticated', catalog_table);
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', catalog_table);

        IF NOT EXISTS (
            SELECT 1
            FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename = catalog_table
              AND policyname = 'catalogos_select_anon_authenticated'
        ) THEN
            EXECUTE format(
                'CREATE POLICY catalogos_select_anon_authenticated ON public.%I FOR SELECT TO anon, authenticated USING (true)',
                catalog_table
            );
        END IF;
    END LOOP;
END $$;

COMMIT;
