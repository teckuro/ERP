-- Seed generado automáticamente para SQL v6.11
BEGIN;


INSERT INTO afp (
    codigo, nombre, tasa_obligatoria, comision, sis, tasa_empleador,
    vigente, forma_pago_apvi, vigencia_inicio, vigencia_fin
) VALUES (
    '03', 'Cuprum', 10.0,
    1.44, 0.0, 0.0,
    TRUE, NULL,
    '2026-04-01', NULL
)
ON CONFLICT (nombre) DO UPDATE SET
    codigo = EXCLUDED.codigo,
    tasa_obligatoria = EXCLUDED.tasa_obligatoria,
    comision = EXCLUDED.comision,
    sis = EXCLUDED.sis,
    tasa_empleador = EXCLUDED.tasa_empleador,
    vigente = EXCLUDED.vigente,
    forma_pago_apvi = EXCLUDED.forma_pago_apvi,
    vigencia_inicio = EXCLUDED.vigencia_inicio,
    vigencia_fin = EXCLUDED.vigencia_fin;

INSERT INTO afp (
    codigo, nombre, tasa_obligatoria, comision, sis, tasa_empleador,
    vigente, forma_pago_apvi, vigencia_inicio, vigencia_fin
) VALUES (
    '05', 'Habitat', 10.0,
    1.27, 0.0, 0.0,
    TRUE, NULL,
    '2026-04-01', NULL
)
ON CONFLICT (nombre) DO UPDATE SET
    codigo = EXCLUDED.codigo,
    tasa_obligatoria = EXCLUDED.tasa_obligatoria,
    comision = EXCLUDED.comision,
    sis = EXCLUDED.sis,
    tasa_empleador = EXCLUDED.tasa_empleador,
    vigente = EXCLUDED.vigente,
    forma_pago_apvi = EXCLUDED.forma_pago_apvi,
    vigencia_inicio = EXCLUDED.vigencia_inicio,
    vigencia_fin = EXCLUDED.vigencia_fin;

INSERT INTO afp (
    codigo, nombre, tasa_obligatoria, comision, sis, tasa_empleador,
    vigente, forma_pago_apvi, vigencia_inicio, vigencia_fin
) VALUES (
    '08', 'Provida', 10.0,
    1.45, 0.0, 0.0,
    TRUE, NULL,
    '2026-04-01', NULL
)
ON CONFLICT (nombre) DO UPDATE SET
    codigo = EXCLUDED.codigo,
    tasa_obligatoria = EXCLUDED.tasa_obligatoria,
    comision = EXCLUDED.comision,
    sis = EXCLUDED.sis,
    tasa_empleador = EXCLUDED.tasa_empleador,
    vigente = EXCLUDED.vigente,
    forma_pago_apvi = EXCLUDED.forma_pago_apvi,
    vigencia_inicio = EXCLUDED.vigencia_inicio,
    vigencia_fin = EXCLUDED.vigencia_fin;

INSERT INTO afp (
    codigo, nombre, tasa_obligatoria, comision, sis, tasa_empleador,
    vigente, forma_pago_apvi, vigencia_inicio, vigencia_fin
) VALUES (
    '29', 'PlanVital', 10.0,
    1.16, 0.0, 0.0,
    TRUE, NULL,
    '2026-04-01', NULL
)
ON CONFLICT (nombre) DO UPDATE SET
    codigo = EXCLUDED.codigo,
    tasa_obligatoria = EXCLUDED.tasa_obligatoria,
    comision = EXCLUDED.comision,
    sis = EXCLUDED.sis,
    tasa_empleador = EXCLUDED.tasa_empleador,
    vigente = EXCLUDED.vigente,
    forma_pago_apvi = EXCLUDED.forma_pago_apvi,
    vigencia_inicio = EXCLUDED.vigencia_inicio,
    vigencia_fin = EXCLUDED.vigencia_fin;

INSERT INTO afp (
    codigo, nombre, tasa_obligatoria, comision, sis, tasa_empleador,
    vigente, forma_pago_apvi, vigencia_inicio, vigencia_fin
) VALUES (
    '33', 'Capital', 10.0,
    1.44, 0.0, 0.0,
    TRUE, NULL,
    '2026-04-01', NULL
)
ON CONFLICT (nombre) DO UPDATE SET
    codigo = EXCLUDED.codigo,
    tasa_obligatoria = EXCLUDED.tasa_obligatoria,
    comision = EXCLUDED.comision,
    sis = EXCLUDED.sis,
    tasa_empleador = EXCLUDED.tasa_empleador,
    vigente = EXCLUDED.vigente,
    forma_pago_apvi = EXCLUDED.forma_pago_apvi,
    vigencia_inicio = EXCLUDED.vigencia_inicio,
    vigencia_fin = EXCLUDED.vigencia_fin;

INSERT INTO afp (
    codigo, nombre, tasa_obligatoria, comision, sis, tasa_empleador,
    vigente, forma_pago_apvi, vigencia_inicio, vigencia_fin
) VALUES (
    '34', 'Modelo', 10.0,
    0.58, 0.0, 0.0,
    TRUE, NULL,
    '2026-04-01', NULL
)
ON CONFLICT (nombre) DO UPDATE SET
    codigo = EXCLUDED.codigo,
    tasa_obligatoria = EXCLUDED.tasa_obligatoria,
    comision = EXCLUDED.comision,
    sis = EXCLUDED.sis,
    tasa_empleador = EXCLUDED.tasa_empleador,
    vigente = EXCLUDED.vigente,
    forma_pago_apvi = EXCLUDED.forma_pago_apvi,
    vigencia_inicio = EXCLUDED.vigencia_inicio,
    vigencia_fin = EXCLUDED.vigencia_fin;

INSERT INTO afp (
    codigo, nombre, tasa_obligatoria, comision, sis, tasa_empleador,
    vigente, forma_pago_apvi, vigencia_inicio, vigencia_fin
) VALUES (
    '35', 'Uno', 10.0,
    0.46, 0.0, 0.0,
    TRUE, NULL,
    '2026-04-01', NULL
)
ON CONFLICT (nombre) DO UPDATE SET
    codigo = EXCLUDED.codigo,
    tasa_obligatoria = EXCLUDED.tasa_obligatoria,
    comision = EXCLUDED.comision,
    sis = EXCLUDED.sis,
    tasa_empleador = EXCLUDED.tasa_empleador,
    vigente = EXCLUDED.vigente,
    forma_pago_apvi = EXCLUDED.forma_pago_apvi,
    vigencia_inicio = EXCLUDED.vigencia_inicio,
    vigencia_fin = EXCLUDED.vigencia_fin;

INSERT INTO afp_vigencia (
    id_afp, tasa_obligatoria, comision, sis, tasa_empleador, tope_imponible_uf,
    forma_pago_apvi, vigente, vigencia_inicio, vigencia_fin
) VALUES (
    (SELECT id_afp FROM afp WHERE nombre = 'Cuprum'),
    10.0, 1.44, 0.0,
    0.0, NULL,
    NULL, TRUE,
    '2026-04-01', NULL
)
ON CONFLICT (id_afp, vigencia_inicio) DO UPDATE SET
    tasa_obligatoria = EXCLUDED.tasa_obligatoria,
    comision = EXCLUDED.comision,
    sis = EXCLUDED.sis,
    tasa_empleador = EXCLUDED.tasa_empleador,
    tope_imponible_uf = EXCLUDED.tope_imponible_uf,
    forma_pago_apvi = EXCLUDED.forma_pago_apvi,
    vigente = EXCLUDED.vigente,
    vigencia_fin = EXCLUDED.vigencia_fin;

INSERT INTO afp_vigencia (
    id_afp, tasa_obligatoria, comision, sis, tasa_empleador, tope_imponible_uf,
    forma_pago_apvi, vigente, vigencia_inicio, vigencia_fin
) VALUES (
    (SELECT id_afp FROM afp WHERE nombre = 'Habitat'),
    10.0, 1.27, 0.0,
    0.0, NULL,
    NULL, TRUE,
    '2026-04-01', NULL
)
ON CONFLICT (id_afp, vigencia_inicio) DO UPDATE SET
    tasa_obligatoria = EXCLUDED.tasa_obligatoria,
    comision = EXCLUDED.comision,
    sis = EXCLUDED.sis,
    tasa_empleador = EXCLUDED.tasa_empleador,
    tope_imponible_uf = EXCLUDED.tope_imponible_uf,
    forma_pago_apvi = EXCLUDED.forma_pago_apvi,
    vigente = EXCLUDED.vigente,
    vigencia_fin = EXCLUDED.vigencia_fin;

INSERT INTO afp_vigencia (
    id_afp, tasa_obligatoria, comision, sis, tasa_empleador, tope_imponible_uf,
    forma_pago_apvi, vigente, vigencia_inicio, vigencia_fin
) VALUES (
    (SELECT id_afp FROM afp WHERE nombre = 'Provida'),
    10.0, 1.45, 0.0,
    0.0, NULL,
    NULL, TRUE,
    '2026-04-01', NULL
)
ON CONFLICT (id_afp, vigencia_inicio) DO UPDATE SET
    tasa_obligatoria = EXCLUDED.tasa_obligatoria,
    comision = EXCLUDED.comision,
    sis = EXCLUDED.sis,
    tasa_empleador = EXCLUDED.tasa_empleador,
    tope_imponible_uf = EXCLUDED.tope_imponible_uf,
    forma_pago_apvi = EXCLUDED.forma_pago_apvi,
    vigente = EXCLUDED.vigente,
    vigencia_fin = EXCLUDED.vigencia_fin;

INSERT INTO afp_vigencia (
    id_afp, tasa_obligatoria, comision, sis, tasa_empleador, tope_imponible_uf,
    forma_pago_apvi, vigente, vigencia_inicio, vigencia_fin
) VALUES (
    (SELECT id_afp FROM afp WHERE nombre = 'PlanVital'),
    10.0, 1.16, 0.0,
    0.0, NULL,
    NULL, TRUE,
    '2026-04-01', NULL
)
ON CONFLICT (id_afp, vigencia_inicio) DO UPDATE SET
    tasa_obligatoria = EXCLUDED.tasa_obligatoria,
    comision = EXCLUDED.comision,
    sis = EXCLUDED.sis,
    tasa_empleador = EXCLUDED.tasa_empleador,
    tope_imponible_uf = EXCLUDED.tope_imponible_uf,
    forma_pago_apvi = EXCLUDED.forma_pago_apvi,
    vigente = EXCLUDED.vigente,
    vigencia_fin = EXCLUDED.vigencia_fin;

INSERT INTO afp_vigencia (
    id_afp, tasa_obligatoria, comision, sis, tasa_empleador, tope_imponible_uf,
    forma_pago_apvi, vigente, vigencia_inicio, vigencia_fin
) VALUES (
    (SELECT id_afp FROM afp WHERE nombre = 'Capital'),
    10.0, 1.44, 0.0,
    0.0, NULL,
    NULL, TRUE,
    '2026-04-01', NULL
)
ON CONFLICT (id_afp, vigencia_inicio) DO UPDATE SET
    tasa_obligatoria = EXCLUDED.tasa_obligatoria,
    comision = EXCLUDED.comision,
    sis = EXCLUDED.sis,
    tasa_empleador = EXCLUDED.tasa_empleador,
    tope_imponible_uf = EXCLUDED.tope_imponible_uf,
    forma_pago_apvi = EXCLUDED.forma_pago_apvi,
    vigente = EXCLUDED.vigente,
    vigencia_fin = EXCLUDED.vigencia_fin;

INSERT INTO afp_vigencia (
    id_afp, tasa_obligatoria, comision, sis, tasa_empleador, tope_imponible_uf,
    forma_pago_apvi, vigente, vigencia_inicio, vigencia_fin
) VALUES (
    (SELECT id_afp FROM afp WHERE nombre = 'Modelo'),
    10.0, 0.58, 0.0,
    0.0, NULL,
    NULL, TRUE,
    '2026-04-01', NULL
)
ON CONFLICT (id_afp, vigencia_inicio) DO UPDATE SET
    tasa_obligatoria = EXCLUDED.tasa_obligatoria,
    comision = EXCLUDED.comision,
    sis = EXCLUDED.sis,
    tasa_empleador = EXCLUDED.tasa_empleador,
    tope_imponible_uf = EXCLUDED.tope_imponible_uf,
    forma_pago_apvi = EXCLUDED.forma_pago_apvi,
    vigente = EXCLUDED.vigente,
    vigencia_fin = EXCLUDED.vigencia_fin;

INSERT INTO afp_vigencia (
    id_afp, tasa_obligatoria, comision, sis, tasa_empleador, tope_imponible_uf,
    forma_pago_apvi, vigente, vigencia_inicio, vigencia_fin
) VALUES (
    (SELECT id_afp FROM afp WHERE nombre = 'Uno'),
    10.0, 0.46, 0.0,
    0.0, NULL,
    NULL, TRUE,
    '2026-04-01', NULL
)
ON CONFLICT (id_afp, vigencia_inicio) DO UPDATE SET
    tasa_obligatoria = EXCLUDED.tasa_obligatoria,
    comision = EXCLUDED.comision,
    sis = EXCLUDED.sis,
    tasa_empleador = EXCLUDED.tasa_empleador,
    tope_imponible_uf = EXCLUDED.tope_imponible_uf,
    forma_pago_apvi = EXCLUDED.forma_pago_apvi,
    vigente = EXCLUDED.vigente,
    vigencia_fin = EXCLUDED.vigencia_fin;

INSERT INTO salud (
    codigo, nombre, tipo, porcentaje_cotizacion, vigente, vigencia_inicio, vigencia_fin
) VALUES (
    '07', 'Fonasa', 'FONASA'::tipo_salud_enum,
    7.0, TRUE,
    '2026-04-01', NULL
)
ON CONFLICT (nombre) DO UPDATE SET
    codigo = EXCLUDED.codigo,
    tipo = EXCLUDED.tipo,
    porcentaje_cotizacion = EXCLUDED.porcentaje_cotizacion,
    vigente = EXCLUDED.vigente,
    vigencia_inicio = EXCLUDED.vigencia_inicio,
    vigencia_fin = EXCLUDED.vigencia_fin;

INSERT INTO salud (
    codigo, nombre, tipo, porcentaje_cotizacion, vigente, vigencia_inicio, vigencia_fin
) VALUES (
    '00', 'Sin Isapre', 'ISAPRE'::tipo_salud_enum,
    7.0, TRUE,
    '2026-04-01', NULL
)
ON CONFLICT (nombre) DO UPDATE SET
    codigo = EXCLUDED.codigo,
    tipo = EXCLUDED.tipo,
    porcentaje_cotizacion = EXCLUDED.porcentaje_cotizacion,
    vigente = EXCLUDED.vigente,
    vigencia_inicio = EXCLUDED.vigencia_inicio,
    vigencia_fin = EXCLUDED.vigencia_fin;

INSERT INTO salud (
    codigo, nombre, tipo, porcentaje_cotizacion, vigente, vigencia_inicio, vigencia_fin
) VALUES (
    '01', 'Banmédica', 'ISAPRE'::tipo_salud_enum,
    7.0, TRUE,
    '2026-04-01', NULL
)
ON CONFLICT (nombre) DO UPDATE SET
    codigo = EXCLUDED.codigo,
    tipo = EXCLUDED.tipo,
    porcentaje_cotizacion = EXCLUDED.porcentaje_cotizacion,
    vigente = EXCLUDED.vigente,
    vigencia_inicio = EXCLUDED.vigencia_inicio,
    vigencia_fin = EXCLUDED.vigencia_fin;

INSERT INTO salud (
    codigo, nombre, tipo, porcentaje_cotizacion, vigente, vigencia_inicio, vigencia_fin
) VALUES (
    '02', 'Consalud', 'ISAPRE'::tipo_salud_enum,
    7.0, TRUE,
    '2026-04-01', NULL
)
ON CONFLICT (nombre) DO UPDATE SET
    codigo = EXCLUDED.codigo,
    tipo = EXCLUDED.tipo,
    porcentaje_cotizacion = EXCLUDED.porcentaje_cotizacion,
    vigente = EXCLUDED.vigente,
    vigencia_inicio = EXCLUDED.vigencia_inicio,
    vigencia_fin = EXCLUDED.vigencia_fin;

INSERT INTO salud (
    codigo, nombre, tipo, porcentaje_cotizacion, vigente, vigencia_inicio, vigencia_fin
) VALUES (
    '03', 'Vida Tres', 'ISAPRE'::tipo_salud_enum,
    7.0, TRUE,
    '2026-04-01', NULL
)
ON CONFLICT (nombre) DO UPDATE SET
    codigo = EXCLUDED.codigo,
    tipo = EXCLUDED.tipo,
    porcentaje_cotizacion = EXCLUDED.porcentaje_cotizacion,
    vigente = EXCLUDED.vigente,
    vigencia_inicio = EXCLUDED.vigencia_inicio,
    vigencia_fin = EXCLUDED.vigencia_fin;

INSERT INTO salud (
    codigo, nombre, tipo, porcentaje_cotizacion, vigente, vigencia_inicio, vigencia_fin
) VALUES (
    '04', 'Colmena', 'ISAPRE'::tipo_salud_enum,
    7.0, TRUE,
    '2026-04-01', NULL
)
ON CONFLICT (nombre) DO UPDATE SET
    codigo = EXCLUDED.codigo,
    tipo = EXCLUDED.tipo,
    porcentaje_cotizacion = EXCLUDED.porcentaje_cotizacion,
    vigente = EXCLUDED.vigente,
    vigencia_inicio = EXCLUDED.vigencia_inicio,
    vigencia_fin = EXCLUDED.vigencia_fin;

INSERT INTO salud (
    codigo, nombre, tipo, porcentaje_cotizacion, vigente, vigencia_inicio, vigencia_fin
) VALUES (
    '05', 'Cruz Blanca', 'ISAPRE'::tipo_salud_enum,
    7.0, TRUE,
    '2026-04-01', NULL
)
ON CONFLICT (nombre) DO UPDATE SET
    codigo = EXCLUDED.codigo,
    tipo = EXCLUDED.tipo,
    porcentaje_cotizacion = EXCLUDED.porcentaje_cotizacion,
    vigente = EXCLUDED.vigente,
    vigencia_inicio = EXCLUDED.vigencia_inicio,
    vigencia_fin = EXCLUDED.vigencia_fin;

INSERT INTO salud (
    codigo, nombre, tipo, porcentaje_cotizacion, vigente, vigencia_inicio, vigencia_fin
) VALUES (
    '10', 'Nueva Masvida', 'ISAPRE'::tipo_salud_enum,
    7.0, TRUE,
    '2026-04-01', NULL
)
ON CONFLICT (nombre) DO UPDATE SET
    codigo = EXCLUDED.codigo,
    tipo = EXCLUDED.tipo,
    porcentaje_cotizacion = EXCLUDED.porcentaje_cotizacion,
    vigente = EXCLUDED.vigente,
    vigencia_inicio = EXCLUDED.vigencia_inicio,
    vigencia_fin = EXCLUDED.vigencia_fin;

INSERT INTO salud (
    codigo, nombre, tipo, porcentaje_cotizacion, vigente, vigencia_inicio, vigencia_fin
) VALUES (
    '11', 'Isalud', 'ISAPRE'::tipo_salud_enum,
    7.0, TRUE,
    '2026-04-01', NULL
)
ON CONFLICT (nombre) DO UPDATE SET
    codigo = EXCLUDED.codigo,
    tipo = EXCLUDED.tipo,
    porcentaje_cotizacion = EXCLUDED.porcentaje_cotizacion,
    vigente = EXCLUDED.vigente,
    vigencia_inicio = EXCLUDED.vigencia_inicio,
    vigencia_fin = EXCLUDED.vigencia_fin;

INSERT INTO salud (
    codigo, nombre, tipo, porcentaje_cotizacion, vigente, vigencia_inicio, vigencia_fin
) VALUES (
    '12', 'Fundación', 'ISAPRE'::tipo_salud_enum,
    7.0, TRUE,
    '2026-04-01', NULL
)
ON CONFLICT (nombre) DO UPDATE SET
    codigo = EXCLUDED.codigo,
    tipo = EXCLUDED.tipo,
    porcentaje_cotizacion = EXCLUDED.porcentaje_cotizacion,
    vigente = EXCLUDED.vigente,
    vigencia_inicio = EXCLUDED.vigencia_inicio,
    vigencia_fin = EXCLUDED.vigencia_fin;

INSERT INTO entidad_previsional_ips (nombre, vigente)
VALUES ('IPS (Ex-INP)', TRUE)
ON CONFLICT (nombre) DO UPDATE SET
    vigente = EXCLUDED.vigente;

INSERT INTO ex_caja_previsional (nombre, vigente)
VALUES ('Empart', TRUE)
ON CONFLICT (nombre) DO UPDATE SET
    vigente = EXCLUDED.vigente;

INSERT INTO ex_caja_previsional (nombre, vigente)
VALUES ('Bancaria', TRUE)
ON CONFLICT (nombre) DO UPDATE SET
    vigente = EXCLUDED.vigente;

INSERT INTO ex_caja_previsional (nombre, vigente)
VALUES ('Triomar', TRUE)
ON CONFLICT (nombre) DO UPDATE SET
    vigente = EXCLUDED.vigente;

INSERT INTO ex_caja_previsional (nombre, vigente)
VALUES ('Hípica Nacional', TRUE)
ON CONFLICT (nombre) DO UPDATE SET
    vigente = EXCLUDED.vigente;

INSERT INTO ex_caja_previsional (nombre, vigente)
VALUES ('Servicios de Seguro Social', TRUE)
ON CONFLICT (nombre) DO UPDATE SET
    vigente = EXCLUDED.vigente;

INSERT INTO ex_caja_previsional (nombre, vigente)
VALUES ('Empleados de Emos', TRUE)
ON CONFLICT (nombre) DO UPDATE SET
    vigente = EXCLUDED.vigente;

INSERT INTO ex_caja_previsional (nombre, vigente)
VALUES ('Obreros de Emos', TRUE)
ON CONFLICT (nombre) DO UPDATE SET
    vigente = EXCLUDED.vigente;

INSERT INTO ex_caja_previsional (nombre, vigente)
VALUES ('Caja Ferro', TRUE)
ON CONFLICT (nombre) DO UPDATE SET
    vigente = EXCLUDED.vigente;

INSERT INTO ex_caja_previsional (nombre, vigente)
VALUES ('Canaempu: Periodistas', TRUE)
ON CONFLICT (nombre) DO UPDATE SET
    vigente = EXCLUDED.vigente;

INSERT INTO ex_caja_previsional (nombre, vigente)
VALUES ('Caja de Previsión Social de los EE', TRUE)
ON CONFLICT (nombre) DO UPDATE SET
    vigente = EXCLUDED.vigente;

INSERT INTO ex_caja_previsional (nombre, vigente)
VALUES ('OO Municipales de la Republica', TRUE)
ON CONFLICT (nombre) DO UPDATE SET
    vigente = EXCLUDED.vigente;

INSERT INTO ex_caja_previsional (nombre, vigente)
VALUES ('Sección Esp.Previsión Empleados', TRUE)
ON CONFLICT (nombre) DO UPDATE SET
    vigente = EXCLUDED.vigente;

INSERT INTO ex_caja_previsional (nombre, vigente)
VALUES ('Caja de Previsión de Gildemeister', TRUE)
ON CONFLICT (nombre) DO UPDATE SET
    vigente = EXCLUDED.vigente;

INSERT INTO ex_caja_previsional (nombre, vigente)
VALUES ('Mauricio, Hochschild', TRUE)
ON CONFLICT (nombre) DO UPDATE SET
    vigente = EXCLUDED.vigente;

INSERT INTO ex_caja_previsional (nombre, vigente)
VALUES ('Secgasco', TRUE)
ON CONFLICT (nombre) DO UPDATE SET
    vigente = EXCLUDED.vigente;

INSERT INTO regimen_ex_caja (id_ex_caja_previsional, nombre, tasa_cotizacion_referencia, vigente)
VALUES (
    (SELECT id_ex_caja_previsional FROM ex_caja_previsional WHERE nombre = 'Empart'),
    'Régimen 4',
    NULL,
    TRUE
)
ON CONFLICT (id_ex_caja_previsional, nombre) DO UPDATE SET
    tasa_cotizacion_referencia = EXCLUDED.tasa_cotizacion_referencia,
    vigente = EXCLUDED.vigente;

INSERT INTO regimen_ex_caja (id_ex_caja_previsional, nombre, tasa_cotizacion_referencia, vigente)
VALUES (
    (SELECT id_ex_caja_previsional FROM ex_caja_previsional WHERE nombre = 'Empart'),
    'Régimen 6',
    NULL,
    TRUE
)
ON CONFLICT (id_ex_caja_previsional, nombre) DO UPDATE SET
    tasa_cotizacion_referencia = EXCLUDED.tasa_cotizacion_referencia,
    vigente = EXCLUDED.vigente;

INSERT INTO regimen_ex_caja (id_ex_caja_previsional, nombre, tasa_cotizacion_referencia, vigente)
VALUES (
    (SELECT id_ex_caja_previsional FROM ex_caja_previsional WHERE nombre = 'Bancaria'),
    'Régimen 1',
    NULL,
    TRUE
)
ON CONFLICT (id_ex_caja_previsional, nombre) DO UPDATE SET
    tasa_cotizacion_referencia = EXCLUDED.tasa_cotizacion_referencia,
    vigente = EXCLUDED.vigente;

INSERT INTO regimen_ex_caja (id_ex_caja_previsional, nombre, tasa_cotizacion_referencia, vigente)
VALUES (
    (SELECT id_ex_caja_previsional FROM ex_caja_previsional WHERE nombre = 'Bancaria'),
    'Régimen 2',
    NULL,
    TRUE
)
ON CONFLICT (id_ex_caja_previsional, nombre) DO UPDATE SET
    tasa_cotizacion_referencia = EXCLUDED.tasa_cotizacion_referencia,
    vigente = EXCLUDED.vigente;

INSERT INTO regimen_ex_caja (id_ex_caja_previsional, nombre, tasa_cotizacion_referencia, vigente)
VALUES (
    (SELECT id_ex_caja_previsional FROM ex_caja_previsional WHERE nombre = 'Bancaria'),
    'Régimen 3',
    NULL,
    TRUE
)
ON CONFLICT (id_ex_caja_previsional, nombre) DO UPDATE SET
    tasa_cotizacion_referencia = EXCLUDED.tasa_cotizacion_referencia,
    vigente = EXCLUDED.vigente;

INSERT INTO regimen_ex_caja (id_ex_caja_previsional, nombre, tasa_cotizacion_referencia, vigente)
VALUES (
    (SELECT id_ex_caja_previsional FROM ex_caja_previsional WHERE nombre = 'Bancaria'),
    'Régimen 14',
    NULL,
    TRUE
)
ON CONFLICT (id_ex_caja_previsional, nombre) DO UPDATE SET
    tasa_cotizacion_referencia = EXCLUDED.tasa_cotizacion_referencia,
    vigente = EXCLUDED.vigente;

INSERT INTO regimen_ex_caja (id_ex_caja_previsional, nombre, tasa_cotizacion_referencia, vigente)
VALUES (
    (SELECT id_ex_caja_previsional FROM ex_caja_previsional WHERE nombre = 'Bancaria'),
    'Régimen 21',
    NULL,
    TRUE
)
ON CONFLICT (id_ex_caja_previsional, nombre) DO UPDATE SET
    tasa_cotizacion_referencia = EXCLUDED.tasa_cotizacion_referencia,
    vigente = EXCLUDED.vigente;

INSERT INTO regimen_ex_caja (id_ex_caja_previsional, nombre, tasa_cotizacion_referencia, vigente)
VALUES (
    (SELECT id_ex_caja_previsional FROM ex_caja_previsional WHERE nombre = 'Bancaria'),
    'Régimen 34',
    NULL,
    TRUE
)
ON CONFLICT (id_ex_caja_previsional, nombre) DO UPDATE SET
    tasa_cotizacion_referencia = EXCLUDED.tasa_cotizacion_referencia,
    vigente = EXCLUDED.vigente;

INSERT INTO regimen_ex_caja (id_ex_caja_previsional, nombre, tasa_cotizacion_referencia, vigente)
VALUES (
    (SELECT id_ex_caja_previsional FROM ex_caja_previsional WHERE nombre = 'Triomar'),
    'Régimen 1',
    NULL,
    TRUE
)
ON CONFLICT (id_ex_caja_previsional, nombre) DO UPDATE SET
    tasa_cotizacion_referencia = EXCLUDED.tasa_cotizacion_referencia,
    vigente = EXCLUDED.vigente;

INSERT INTO regimen_ex_caja (id_ex_caja_previsional, nombre, tasa_cotizacion_referencia, vigente)
VALUES (
    (SELECT id_ex_caja_previsional FROM ex_caja_previsional WHERE nombre = 'Triomar'),
    'Régimen 2',
    NULL,
    TRUE
)
ON CONFLICT (id_ex_caja_previsional, nombre) DO UPDATE SET
    tasa_cotizacion_referencia = EXCLUDED.tasa_cotizacion_referencia,
    vigente = EXCLUDED.vigente;

INSERT INTO regimen_ex_caja (id_ex_caja_previsional, nombre, tasa_cotizacion_referencia, vigente)
VALUES (
    (SELECT id_ex_caja_previsional FROM ex_caja_previsional WHERE nombre = 'Triomar'),
    'Régimen 3',
    NULL,
    TRUE
)
ON CONFLICT (id_ex_caja_previsional, nombre) DO UPDATE SET
    tasa_cotizacion_referencia = EXCLUDED.tasa_cotizacion_referencia,
    vigente = EXCLUDED.vigente;

INSERT INTO regimen_ex_caja (id_ex_caja_previsional, nombre, tasa_cotizacion_referencia, vigente)
VALUES (
    (SELECT id_ex_caja_previsional FROM ex_caja_previsional WHERE nombre = 'Triomar'),
    'Régimen 4',
    NULL,
    TRUE
)
ON CONFLICT (id_ex_caja_previsional, nombre) DO UPDATE SET
    tasa_cotizacion_referencia = EXCLUDED.tasa_cotizacion_referencia,
    vigente = EXCLUDED.vigente;

INSERT INTO regimen_ex_caja (id_ex_caja_previsional, nombre, tasa_cotizacion_referencia, vigente)
VALUES (
    (SELECT id_ex_caja_previsional FROM ex_caja_previsional WHERE nombre = 'Hípica Nacional'),
    'Régimen 1',
    NULL,
    TRUE
)
ON CONFLICT (id_ex_caja_previsional, nombre) DO UPDATE SET
    tasa_cotizacion_referencia = EXCLUDED.tasa_cotizacion_referencia,
    vigente = EXCLUDED.vigente;

INSERT INTO regimen_ex_caja (id_ex_caja_previsional, nombre, tasa_cotizacion_referencia, vigente)
VALUES (
    (SELECT id_ex_caja_previsional FROM ex_caja_previsional WHERE nombre = 'Hípica Nacional'),
    'Régimen 2',
    NULL,
    TRUE
)
ON CONFLICT (id_ex_caja_previsional, nombre) DO UPDATE SET
    tasa_cotizacion_referencia = EXCLUDED.tasa_cotizacion_referencia,
    vigente = EXCLUDED.vigente;

INSERT INTO regimen_ex_caja (id_ex_caja_previsional, nombre, tasa_cotizacion_referencia, vigente)
VALUES (
    (SELECT id_ex_caja_previsional FROM ex_caja_previsional WHERE nombre = 'Hípica Nacional'),
    'Régimen 3',
    NULL,
    TRUE
)
ON CONFLICT (id_ex_caja_previsional, nombre) DO UPDATE SET
    tasa_cotizacion_referencia = EXCLUDED.tasa_cotizacion_referencia,
    vigente = EXCLUDED.vigente;

INSERT INTO regimen_ex_caja (id_ex_caja_previsional, nombre, tasa_cotizacion_referencia, vigente)
VALUES (
    (SELECT id_ex_caja_previsional FROM ex_caja_previsional WHERE nombre = 'Hípica Nacional'),
    'Régimen 4',
    NULL,
    TRUE
)
ON CONFLICT (id_ex_caja_previsional, nombre) DO UPDATE SET
    tasa_cotizacion_referencia = EXCLUDED.tasa_cotizacion_referencia,
    vigente = EXCLUDED.vigente;

INSERT INTO regimen_ex_caja (id_ex_caja_previsional, nombre, tasa_cotizacion_referencia, vigente)
VALUES (
    (SELECT id_ex_caja_previsional FROM ex_caja_previsional WHERE nombre = 'Servicios de Seguro Social'),
    'Régimen 1',
    NULL,
    TRUE
)
ON CONFLICT (id_ex_caja_previsional, nombre) DO UPDATE SET
    tasa_cotizacion_referencia = EXCLUDED.tasa_cotizacion_referencia,
    vigente = EXCLUDED.vigente;

INSERT INTO regimen_ex_caja (id_ex_caja_previsional, nombre, tasa_cotizacion_referencia, vigente)
VALUES (
    (SELECT id_ex_caja_previsional FROM ex_caja_previsional WHERE nombre = 'Servicios de Seguro Social'),
    'Régimen 2',
    NULL,
    TRUE
)
ON CONFLICT (id_ex_caja_previsional, nombre) DO UPDATE SET
    tasa_cotizacion_referencia = EXCLUDED.tasa_cotizacion_referencia,
    vigente = EXCLUDED.vigente;

INSERT INTO regimen_ex_caja (id_ex_caja_previsional, nombre, tasa_cotizacion_referencia, vigente)
VALUES (
    (SELECT id_ex_caja_previsional FROM ex_caja_previsional WHERE nombre = 'Empleados de Emos'),
    'Régimen 1',
    NULL,
    TRUE
)
ON CONFLICT (id_ex_caja_previsional, nombre) DO UPDATE SET
    tasa_cotizacion_referencia = EXCLUDED.tasa_cotizacion_referencia,
    vigente = EXCLUDED.vigente;

INSERT INTO regimen_ex_caja (id_ex_caja_previsional, nombre, tasa_cotizacion_referencia, vigente)
VALUES (
    (SELECT id_ex_caja_previsional FROM ex_caja_previsional WHERE nombre = 'Obreros de Emos'),
    'Régimen 1',
    NULL,
    TRUE
)
ON CONFLICT (id_ex_caja_previsional, nombre) DO UPDATE SET
    tasa_cotizacion_referencia = EXCLUDED.tasa_cotizacion_referencia,
    vigente = EXCLUDED.vigente;

INSERT INTO regimen_ex_caja (id_ex_caja_previsional, nombre, tasa_cotizacion_referencia, vigente)
VALUES (
    (SELECT id_ex_caja_previsional FROM ex_caja_previsional WHERE nombre = 'Caja Ferro'),
    'Régimen 2',
    NULL,
    TRUE
)
ON CONFLICT (id_ex_caja_previsional, nombre) DO UPDATE SET
    tasa_cotizacion_referencia = EXCLUDED.tasa_cotizacion_referencia,
    vigente = EXCLUDED.vigente;

INSERT INTO regimen_ex_caja (id_ex_caja_previsional, nombre, tasa_cotizacion_referencia, vigente)
VALUES (
    (SELECT id_ex_caja_previsional FROM ex_caja_previsional WHERE nombre = 'Caja Ferro'),
    'Régimen 3',
    NULL,
    TRUE
)
ON CONFLICT (id_ex_caja_previsional, nombre) DO UPDATE SET
    tasa_cotizacion_referencia = EXCLUDED.tasa_cotizacion_referencia,
    vigente = EXCLUDED.vigente;

INSERT INTO regimen_ex_caja (id_ex_caja_previsional, nombre, tasa_cotizacion_referencia, vigente)
VALUES (
    (SELECT id_ex_caja_previsional FROM ex_caja_previsional WHERE nombre = 'Caja Ferro'),
    'Régimen 4',
    NULL,
    TRUE
)
ON CONFLICT (id_ex_caja_previsional, nombre) DO UPDATE SET
    tasa_cotizacion_referencia = EXCLUDED.tasa_cotizacion_referencia,
    vigente = EXCLUDED.vigente;

INSERT INTO regimen_ex_caja (id_ex_caja_previsional, nombre, tasa_cotizacion_referencia, vigente)
VALUES (
    (SELECT id_ex_caja_previsional FROM ex_caja_previsional WHERE nombre = 'Caja Ferro'),
    'Régimen 5',
    NULL,
    TRUE
)
ON CONFLICT (id_ex_caja_previsional, nombre) DO UPDATE SET
    tasa_cotizacion_referencia = EXCLUDED.tasa_cotizacion_referencia,
    vigente = EXCLUDED.vigente;

INSERT INTO regimen_ex_caja (id_ex_caja_previsional, nombre, tasa_cotizacion_referencia, vigente)
VALUES (
    (SELECT id_ex_caja_previsional FROM ex_caja_previsional WHERE nombre = 'Caja Ferro'),
    'Régimen 7',
    NULL,
    TRUE
)
ON CONFLICT (id_ex_caja_previsional, nombre) DO UPDATE SET
    tasa_cotizacion_referencia = EXCLUDED.tasa_cotizacion_referencia,
    vigente = EXCLUDED.vigente;

INSERT INTO regimen_ex_caja (id_ex_caja_previsional, nombre, tasa_cotizacion_referencia, vigente)
VALUES (
    (SELECT id_ex_caja_previsional FROM ex_caja_previsional WHERE nombre = 'Canaempu: Periodistas'),
    'Régimen 1',
    NULL,
    TRUE
)
ON CONFLICT (id_ex_caja_previsional, nombre) DO UPDATE SET
    tasa_cotizacion_referencia = EXCLUDED.tasa_cotizacion_referencia,
    vigente = EXCLUDED.vigente;

INSERT INTO regimen_ex_caja (id_ex_caja_previsional, nombre, tasa_cotizacion_referencia, vigente)
VALUES (
    (SELECT id_ex_caja_previsional FROM ex_caja_previsional WHERE nombre = 'Canaempu: Periodistas'),
    'Régimen 2',
    NULL,
    TRUE
)
ON CONFLICT (id_ex_caja_previsional, nombre) DO UPDATE SET
    tasa_cotizacion_referencia = EXCLUDED.tasa_cotizacion_referencia,
    vigente = EXCLUDED.vigente;

INSERT INTO regimen_ex_caja (id_ex_caja_previsional, nombre, tasa_cotizacion_referencia, vigente)
VALUES (
    (SELECT id_ex_caja_previsional FROM ex_caja_previsional WHERE nombre = 'Canaempu: Periodistas'),
    'Régimen 3',
    NULL,
    TRUE
)
ON CONFLICT (id_ex_caja_previsional, nombre) DO UPDATE SET
    tasa_cotizacion_referencia = EXCLUDED.tasa_cotizacion_referencia,
    vigente = EXCLUDED.vigente;

INSERT INTO regimen_ex_caja (id_ex_caja_previsional, nombre, tasa_cotizacion_referencia, vigente)
VALUES (
    (SELECT id_ex_caja_previsional FROM ex_caja_previsional WHERE nombre = 'Canaempu: Periodistas'),
    'Régimen 4',
    NULL,
    TRUE
)
ON CONFLICT (id_ex_caja_previsional, nombre) DO UPDATE SET
    tasa_cotizacion_referencia = EXCLUDED.tasa_cotizacion_referencia,
    vigente = EXCLUDED.vigente;

INSERT INTO regimen_ex_caja (id_ex_caja_previsional, nombre, tasa_cotizacion_referencia, vigente)
VALUES (
    (SELECT id_ex_caja_previsional FROM ex_caja_previsional WHERE nombre = 'Canaempu: Periodistas'),
    'Régimen 5',
    NULL,
    TRUE
)
ON CONFLICT (id_ex_caja_previsional, nombre) DO UPDATE SET
    tasa_cotizacion_referencia = EXCLUDED.tasa_cotizacion_referencia,
    vigente = EXCLUDED.vigente;

INSERT INTO regimen_ex_caja (id_ex_caja_previsional, nombre, tasa_cotizacion_referencia, vigente)
VALUES (
    (SELECT id_ex_caja_previsional FROM ex_caja_previsional WHERE nombre = 'Canaempu: Periodistas'),
    'Régimen 6',
    NULL,
    TRUE
)
ON CONFLICT (id_ex_caja_previsional, nombre) DO UPDATE SET
    tasa_cotizacion_referencia = EXCLUDED.tasa_cotizacion_referencia,
    vigente = EXCLUDED.vigente;

INSERT INTO regimen_ex_caja (id_ex_caja_previsional, nombre, tasa_cotizacion_referencia, vigente)
VALUES (
    (SELECT id_ex_caja_previsional FROM ex_caja_previsional WHERE nombre = 'Canaempu: Periodistas'),
    'Régimen 7',
    NULL,
    TRUE
)
ON CONFLICT (id_ex_caja_previsional, nombre) DO UPDATE SET
    tasa_cotizacion_referencia = EXCLUDED.tasa_cotizacion_referencia,
    vigente = EXCLUDED.vigente;

INSERT INTO regimen_ex_caja (id_ex_caja_previsional, nombre, tasa_cotizacion_referencia, vigente)
VALUES (
    (SELECT id_ex_caja_previsional FROM ex_caja_previsional WHERE nombre = 'Canaempu: Periodistas'),
    'Régimen 8',
    NULL,
    TRUE
)
ON CONFLICT (id_ex_caja_previsional, nombre) DO UPDATE SET
    tasa_cotizacion_referencia = EXCLUDED.tasa_cotizacion_referencia,
    vigente = EXCLUDED.vigente;

INSERT INTO regimen_ex_caja (id_ex_caja_previsional, nombre, tasa_cotizacion_referencia, vigente)
VALUES (
    (SELECT id_ex_caja_previsional FROM ex_caja_previsional WHERE nombre = 'Caja de Previsión Social de los EE'),
    'Régimen 1',
    NULL,
    TRUE
)
ON CONFLICT (id_ex_caja_previsional, nombre) DO UPDATE SET
    tasa_cotizacion_referencia = EXCLUDED.tasa_cotizacion_referencia,
    vigente = EXCLUDED.vigente;

INSERT INTO regimen_ex_caja (id_ex_caja_previsional, nombre, tasa_cotizacion_referencia, vigente)
VALUES (
    (SELECT id_ex_caja_previsional FROM ex_caja_previsional WHERE nombre = 'Caja de Previsión Social de los EE'),
    'Régimen 2',
    NULL,
    TRUE
)
ON CONFLICT (id_ex_caja_previsional, nombre) DO UPDATE SET
    tasa_cotizacion_referencia = EXCLUDED.tasa_cotizacion_referencia,
    vigente = EXCLUDED.vigente;

INSERT INTO regimen_ex_caja (id_ex_caja_previsional, nombre, tasa_cotizacion_referencia, vigente)
VALUES (
    (SELECT id_ex_caja_previsional FROM ex_caja_previsional WHERE nombre = 'OO Municipales de la Republica'),
    'Régimen 1',
    NULL,
    TRUE
)
ON CONFLICT (id_ex_caja_previsional, nombre) DO UPDATE SET
    tasa_cotizacion_referencia = EXCLUDED.tasa_cotizacion_referencia,
    vigente = EXCLUDED.vigente;

INSERT INTO regimen_ex_caja (id_ex_caja_previsional, nombre, tasa_cotizacion_referencia, vigente)
VALUES (
    (SELECT id_ex_caja_previsional FROM ex_caja_previsional WHERE nombre = 'OO Municipales de la Republica'),
    'Régimen 2',
    NULL,
    TRUE
)
ON CONFLICT (id_ex_caja_previsional, nombre) DO UPDATE SET
    tasa_cotizacion_referencia = EXCLUDED.tasa_cotizacion_referencia,
    vigente = EXCLUDED.vigente;

INSERT INTO regimen_ex_caja (id_ex_caja_previsional, nombre, tasa_cotizacion_referencia, vigente)
VALUES (
    (SELECT id_ex_caja_previsional FROM ex_caja_previsional WHERE nombre = 'OO Municipales de la Republica'),
    'Régimen 3',
    NULL,
    TRUE
)
ON CONFLICT (id_ex_caja_previsional, nombre) DO UPDATE SET
    tasa_cotizacion_referencia = EXCLUDED.tasa_cotizacion_referencia,
    vigente = EXCLUDED.vigente;

INSERT INTO regimen_ex_caja (id_ex_caja_previsional, nombre, tasa_cotizacion_referencia, vigente)
VALUES (
    (SELECT id_ex_caja_previsional FROM ex_caja_previsional WHERE nombre = 'Sección Esp.Previsión Empleados'),
    'Régimen 1',
    NULL,
    TRUE
)
ON CONFLICT (id_ex_caja_previsional, nombre) DO UPDATE SET
    tasa_cotizacion_referencia = EXCLUDED.tasa_cotizacion_referencia,
    vigente = EXCLUDED.vigente;

INSERT INTO regimen_ex_caja (id_ex_caja_previsional, nombre, tasa_cotizacion_referencia, vigente)
VALUES (
    (SELECT id_ex_caja_previsional FROM ex_caja_previsional WHERE nombre = 'Sección Esp.Previsión Empleados'),
    'Régimen 2',
    NULL,
    TRUE
)
ON CONFLICT (id_ex_caja_previsional, nombre) DO UPDATE SET
    tasa_cotizacion_referencia = EXCLUDED.tasa_cotizacion_referencia,
    vigente = EXCLUDED.vigente;

INSERT INTO regimen_ex_caja (id_ex_caja_previsional, nombre, tasa_cotizacion_referencia, vigente)
VALUES (
    (SELECT id_ex_caja_previsional FROM ex_caja_previsional WHERE nombre = 'Caja de Previsión de Gildemeister'),
    'Régimen 1',
    NULL,
    TRUE
)
ON CONFLICT (id_ex_caja_previsional, nombre) DO UPDATE SET
    tasa_cotizacion_referencia = EXCLUDED.tasa_cotizacion_referencia,
    vigente = EXCLUDED.vigente;

INSERT INTO regimen_ex_caja (id_ex_caja_previsional, nombre, tasa_cotizacion_referencia, vigente)
VALUES (
    (SELECT id_ex_caja_previsional FROM ex_caja_previsional WHERE nombre = 'Caja de Previsión de Gildemeister'),
    'Régimen 2',
    NULL,
    TRUE
)
ON CONFLICT (id_ex_caja_previsional, nombre) DO UPDATE SET
    tasa_cotizacion_referencia = EXCLUDED.tasa_cotizacion_referencia,
    vigente = EXCLUDED.vigente;

INSERT INTO regimen_ex_caja (id_ex_caja_previsional, nombre, tasa_cotizacion_referencia, vigente)
VALUES (
    (SELECT id_ex_caja_previsional FROM ex_caja_previsional WHERE nombre = 'Mauricio, Hochschild'),
    'Régimen 1',
    NULL,
    TRUE
)
ON CONFLICT (id_ex_caja_previsional, nombre) DO UPDATE SET
    tasa_cotizacion_referencia = EXCLUDED.tasa_cotizacion_referencia,
    vigente = EXCLUDED.vigente;

INSERT INTO regimen_ex_caja (id_ex_caja_previsional, nombre, tasa_cotizacion_referencia, vigente)
VALUES (
    (SELECT id_ex_caja_previsional FROM ex_caja_previsional WHERE nombre = 'Mauricio, Hochschild'),
    'Régimen 2',
    NULL,
    TRUE
)
ON CONFLICT (id_ex_caja_previsional, nombre) DO UPDATE SET
    tasa_cotizacion_referencia = EXCLUDED.tasa_cotizacion_referencia,
    vigente = EXCLUDED.vigente;

INSERT INTO regimen_ex_caja (id_ex_caja_previsional, nombre, tasa_cotizacion_referencia, vigente)
VALUES (
    (SELECT id_ex_caja_previsional FROM ex_caja_previsional WHERE nombre = 'Secgasco'),
    'Régimen 1',
    NULL,
    TRUE
)
ON CONFLICT (id_ex_caja_previsional, nombre) DO UPDATE SET
    tasa_cotizacion_referencia = EXCLUDED.tasa_cotizacion_referencia,
    vigente = EXCLUDED.vigente;

INSERT INTO regimen_ex_caja (id_ex_caja_previsional, nombre, tasa_cotizacion_referencia, vigente)
VALUES (
    (SELECT id_ex_caja_previsional FROM ex_caja_previsional WHERE nombre = 'Secgasco'),
    'Régimen 2',
    NULL,
    TRUE
)
ON CONFLICT (id_ex_caja_previsional, nombre) DO UPDATE SET
    tasa_cotizacion_referencia = EXCLUDED.tasa_cotizacion_referencia,
    vigente = EXCLUDED.vigente;

INSERT INTO tipo_movimiento (
    id_tipo_movimiento, codigo, nombre, afecta_dias_trabajados, afecta_horas, activo
) VALUES (
    0, 'MOV_0', 'Sin Movimiento en el Mes',
    FALSE, FALSE, TRUE
)
ON CONFLICT (id_tipo_movimiento) DO UPDATE SET
    codigo = EXCLUDED.codigo,
    nombre = EXCLUDED.nombre,
    afecta_dias_trabajados = EXCLUDED.afecta_dias_trabajados,
    afecta_horas = EXCLUDED.afecta_horas,
    activo = EXCLUDED.activo;

INSERT INTO tipo_movimiento (
    id_tipo_movimiento, codigo, nombre, afecta_dias_trabajados, afecta_horas, activo
) VALUES (
    1, 'MOV_1', 'Contratación a plazo indefinido',
    FALSE, FALSE, TRUE
)
ON CONFLICT (id_tipo_movimiento) DO UPDATE SET
    codigo = EXCLUDED.codigo,
    nombre = EXCLUDED.nombre,
    afecta_dias_trabajados = EXCLUDED.afecta_dias_trabajados,
    afecta_horas = EXCLUDED.afecta_horas,
    activo = EXCLUDED.activo;

INSERT INTO tipo_movimiento (
    id_tipo_movimiento, codigo, nombre, afecta_dias_trabajados, afecta_horas, activo
) VALUES (
    2, 'MOV_2', 'Retiro',
    TRUE, FALSE, TRUE
)
ON CONFLICT (id_tipo_movimiento) DO UPDATE SET
    codigo = EXCLUDED.codigo,
    nombre = EXCLUDED.nombre,
    afecta_dias_trabajados = EXCLUDED.afecta_dias_trabajados,
    afecta_horas = EXCLUDED.afecta_horas,
    activo = EXCLUDED.activo;

INSERT INTO tipo_movimiento (
    id_tipo_movimiento, codigo, nombre, afecta_dias_trabajados, afecta_horas, activo
) VALUES (
    3, 'MOV_3', 'Subsidios',
    TRUE, FALSE, TRUE
)
ON CONFLICT (id_tipo_movimiento) DO UPDATE SET
    codigo = EXCLUDED.codigo,
    nombre = EXCLUDED.nombre,
    afecta_dias_trabajados = EXCLUDED.afecta_dias_trabajados,
    afecta_horas = EXCLUDED.afecta_horas,
    activo = EXCLUDED.activo;

INSERT INTO tipo_movimiento (
    id_tipo_movimiento, codigo, nombre, afecta_dias_trabajados, afecta_horas, activo
) VALUES (
    4, 'MOV_4', 'Permiso Sin Goce de Sueldos',
    TRUE, FALSE, TRUE
)
ON CONFLICT (id_tipo_movimiento) DO UPDATE SET
    codigo = EXCLUDED.codigo,
    nombre = EXCLUDED.nombre,
    afecta_dias_trabajados = EXCLUDED.afecta_dias_trabajados,
    afecta_horas = EXCLUDED.afecta_horas,
    activo = EXCLUDED.activo;

INSERT INTO tipo_movimiento (
    id_tipo_movimiento, codigo, nombre, afecta_dias_trabajados, afecta_horas, activo
) VALUES (
    5, 'MOV_5', 'Incorporación en el Lugar de Trabajo',
    FALSE, FALSE, TRUE
)
ON CONFLICT (id_tipo_movimiento) DO UPDATE SET
    codigo = EXCLUDED.codigo,
    nombre = EXCLUDED.nombre,
    afecta_dias_trabajados = EXCLUDED.afecta_dias_trabajados,
    afecta_horas = EXCLUDED.afecta_horas,
    activo = EXCLUDED.activo;

INSERT INTO tipo_movimiento (
    id_tipo_movimiento, codigo, nombre, afecta_dias_trabajados, afecta_horas, activo
) VALUES (
    6, 'MOV_6', 'Accidentes del Trabajo',
    TRUE, FALSE, TRUE
)
ON CONFLICT (id_tipo_movimiento) DO UPDATE SET
    codigo = EXCLUDED.codigo,
    nombre = EXCLUDED.nombre,
    afecta_dias_trabajados = EXCLUDED.afecta_dias_trabajados,
    afecta_horas = EXCLUDED.afecta_horas,
    activo = EXCLUDED.activo;

INSERT INTO tipo_movimiento (
    id_tipo_movimiento, codigo, nombre, afecta_dias_trabajados, afecta_horas, activo
) VALUES (
    7, 'MOV_7', 'Contratación a plazo fijo',
    FALSE, FALSE, TRUE
)
ON CONFLICT (id_tipo_movimiento) DO UPDATE SET
    codigo = EXCLUDED.codigo,
    nombre = EXCLUDED.nombre,
    afecta_dias_trabajados = EXCLUDED.afecta_dias_trabajados,
    afecta_horas = EXCLUDED.afecta_horas,
    activo = EXCLUDED.activo;

INSERT INTO tipo_movimiento (
    id_tipo_movimiento, codigo, nombre, afecta_dias_trabajados, afecta_horas, activo
) VALUES (
    8, 'MOV_8', 'Cambio Contrato plazo fijo a plazo indefinido',
    FALSE, FALSE, TRUE
)
ON CONFLICT (id_tipo_movimiento) DO UPDATE SET
    codigo = EXCLUDED.codigo,
    nombre = EXCLUDED.nombre,
    afecta_dias_trabajados = EXCLUDED.afecta_dias_trabajados,
    afecta_horas = EXCLUDED.afecta_horas,
    activo = EXCLUDED.activo;

INSERT INTO tipo_movimiento (
    id_tipo_movimiento, codigo, nombre, afecta_dias_trabajados, afecta_horas, activo
) VALUES (
    11, 'MOV_11', 'Otros Movimientos (Ausentismos)',
    TRUE, TRUE, TRUE
)
ON CONFLICT (id_tipo_movimiento) DO UPDATE SET
    codigo = EXCLUDED.codigo,
    nombre = EXCLUDED.nombre,
    afecta_dias_trabajados = EXCLUDED.afecta_dias_trabajados,
    afecta_horas = EXCLUDED.afecta_horas,
    activo = EXCLUDED.activo;

INSERT INTO tipo_movimiento (
    id_tipo_movimiento, codigo, nombre, afecta_dias_trabajados, afecta_horas, activo
) VALUES (
    12, 'MOV_12', 'Reliquidación, premio o bono posterior al finiquito',
    TRUE, FALSE, TRUE
)
ON CONFLICT (id_tipo_movimiento) DO UPDATE SET
    codigo = EXCLUDED.codigo,
    nombre = EXCLUDED.nombre,
    afecta_dias_trabajados = EXCLUDED.afecta_dias_trabajados,
    afecta_horas = EXCLUDED.afecta_horas,
    activo = EXCLUDED.activo;

INSERT INTO motivo_inasistencia (
    id_motivo_inasistencia, codigo, nombre, descuenta_dias, activo
) VALUES (
    101, 'LICENCIA_MEDICA', 'Licencia médica',
    FALSE, TRUE
)
ON CONFLICT (id_motivo_inasistencia) DO UPDATE SET
    codigo = EXCLUDED.codigo,
    nombre = EXCLUDED.nombre,
    descuenta_dias = EXCLUDED.descuenta_dias,
    activo = EXCLUDED.activo;

INSERT INTO motivo_inasistencia (
    id_motivo_inasistencia, codigo, nombre, descuenta_dias, activo
) VALUES (
    102, 'INASISTENCIA_INJUSTIFICADA', 'Inasistencia injustificada',
    TRUE, TRUE
)
ON CONFLICT (id_motivo_inasistencia) DO UPDATE SET
    codigo = EXCLUDED.codigo,
    nombre = EXCLUDED.nombre,
    descuenta_dias = EXCLUDED.descuenta_dias,
    activo = EXCLUDED.activo;

INSERT INTO motivo_inasistencia (
    id_motivo_inasistencia, codigo, nombre, descuenta_dias, activo
) VALUES (
    103, 'PERMISO_SIN_GOCE', 'Permiso sin goce de sueldo',
    TRUE, TRUE
)
ON CONFLICT (id_motivo_inasistencia) DO UPDATE SET
    codigo = EXCLUDED.codigo,
    nombre = EXCLUDED.nombre,
    descuenta_dias = EXCLUDED.descuenta_dias,
    activo = EXCLUDED.activo;

INSERT INTO motivo_inasistencia (
    id_motivo_inasistencia, codigo, nombre, descuenta_dias, activo
) VALUES (
    104, 'ACCIDENTE_TRABAJO', 'Accidente del trabajo',
    FALSE, TRUE
)
ON CONFLICT (id_motivo_inasistencia) DO UPDATE SET
    codigo = EXCLUDED.codigo,
    nombre = EXCLUDED.nombre,
    descuenta_dias = EXCLUDED.descuenta_dias,
    activo = EXCLUDED.activo;

INSERT INTO motivo_inasistencia (
    id_motivo_inasistencia, codigo, nombre, descuenta_dias, activo
) VALUES (
    105, 'ATRASO', 'Atraso',
    FALSE, TRUE
)
ON CONFLICT (id_motivo_inasistencia) DO UPDATE SET
    codigo = EXCLUDED.codigo,
    nombre = EXCLUDED.nombre,
    descuenta_dias = EXCLUDED.descuenta_dias,
    activo = EXCLUDED.activo;

INSERT INTO motivo_inasistencia (
    id_motivo_inasistencia, codigo, nombre, descuenta_dias, activo
) VALUES (
    106, 'SUSPENSION_LABORAL', 'Suspensión laboral',
    TRUE, TRUE
)
ON CONFLICT (id_motivo_inasistencia) DO UPDATE SET
    codigo = EXCLUDED.codigo,
    nombre = EXCLUDED.nombre,
    descuenta_dias = EXCLUDED.descuenta_dias,
    activo = EXCLUDED.activo;

INSERT INTO concepto (
    codigo, codigo_motor, nombre, tipo, naturaleza, imponible, tributable, afecta_afp,
    afecta_salud, afecta_afc, afecta_sis, orden_impresion, calculo_automatico, formula_json
) VALUES (
    'SUELDO_BASE', 'SUELDO_BASE', 'Sueldo base',
    'HABER', 'IMPONIBLE',
    TRUE, TRUE,
    TRUE, TRUE,
    TRUE, TRUE,
    10, FALSE,
    NULL
)
ON CONFLICT (codigo) DO UPDATE SET
    codigo_motor = EXCLUDED.codigo_motor,
    nombre = EXCLUDED.nombre,
    tipo = EXCLUDED.tipo,
    naturaleza = EXCLUDED.naturaleza,
    imponible = EXCLUDED.imponible,
    tributable = EXCLUDED.tributable,
    afecta_afp = EXCLUDED.afecta_afp,
    afecta_salud = EXCLUDED.afecta_salud,
    afecta_afc = EXCLUDED.afecta_afc,
    afecta_sis = EXCLUDED.afecta_sis,
    orden_impresion = EXCLUDED.orden_impresion,
    calculo_automatico = EXCLUDED.calculo_automatico,
    formula_json = EXCLUDED.formula_json;

INSERT INTO concepto (
    codigo, codigo_motor, nombre, tipo, naturaleza, imponible, tributable, afecta_afp,
    afecta_salud, afecta_afc, afecta_sis, orden_impresion, calculo_automatico, formula_json
) VALUES (
    'GRATIFICACION', 'GRATIFICACION', 'Gratificación',
    'HABER', 'IMPONIBLE',
    TRUE, TRUE,
    TRUE, TRUE,
    TRUE, TRUE,
    20, TRUE,
    '{"tipo": "regla", "codigo": "GRATIFICACION_LEGAL"}'::jsonb
)
ON CONFLICT (codigo) DO UPDATE SET
    codigo_motor = EXCLUDED.codigo_motor,
    nombre = EXCLUDED.nombre,
    tipo = EXCLUDED.tipo,
    naturaleza = EXCLUDED.naturaleza,
    imponible = EXCLUDED.imponible,
    tributable = EXCLUDED.tributable,
    afecta_afp = EXCLUDED.afecta_afp,
    afecta_salud = EXCLUDED.afecta_salud,
    afecta_afc = EXCLUDED.afecta_afc,
    afecta_sis = EXCLUDED.afecta_sis,
    orden_impresion = EXCLUDED.orden_impresion,
    calculo_automatico = EXCLUDED.calculo_automatico,
    formula_json = EXCLUDED.formula_json;

INSERT INTO concepto (
    codigo, codigo_motor, nombre, tipo, naturaleza, imponible, tributable, afecta_afp,
    afecta_salud, afecta_afc, afecta_sis, orden_impresion, calculo_automatico, formula_json
) VALUES (
    'HORAS_EXTRA', 'HORAS_EXTRA', 'Horas extra',
    'HABER', 'IMPONIBLE',
    TRUE, TRUE,
    TRUE, TRUE,
    TRUE, TRUE,
    30, FALSE,
    NULL
)
ON CONFLICT (codigo) DO UPDATE SET
    codigo_motor = EXCLUDED.codigo_motor,
    nombre = EXCLUDED.nombre,
    tipo = EXCLUDED.tipo,
    naturaleza = EXCLUDED.naturaleza,
    imponible = EXCLUDED.imponible,
    tributable = EXCLUDED.tributable,
    afecta_afp = EXCLUDED.afecta_afp,
    afecta_salud = EXCLUDED.afecta_salud,
    afecta_afc = EXCLUDED.afecta_afc,
    afecta_sis = EXCLUDED.afecta_sis,
    orden_impresion = EXCLUDED.orden_impresion,
    calculo_automatico = EXCLUDED.calculo_automatico,
    formula_json = EXCLUDED.formula_json;

INSERT INTO concepto (
    codigo, codigo_motor, nombre, tipo, naturaleza, imponible, tributable, afecta_afp,
    afecta_salud, afecta_afc, afecta_sis, orden_impresion, calculo_automatico, formula_json
) VALUES (
    'COLACION', 'COLACION', 'Colación',
    'HABER', 'NO_IMPONIBLE',
    FALSE, FALSE,
    FALSE, FALSE,
    FALSE, FALSE,
    40, FALSE,
    NULL
)
ON CONFLICT (codigo) DO UPDATE SET
    codigo_motor = EXCLUDED.codigo_motor,
    nombre = EXCLUDED.nombre,
    tipo = EXCLUDED.tipo,
    naturaleza = EXCLUDED.naturaleza,
    imponible = EXCLUDED.imponible,
    tributable = EXCLUDED.tributable,
    afecta_afp = EXCLUDED.afecta_afp,
    afecta_salud = EXCLUDED.afecta_salud,
    afecta_afc = EXCLUDED.afecta_afc,
    afecta_sis = EXCLUDED.afecta_sis,
    orden_impresion = EXCLUDED.orden_impresion,
    calculo_automatico = EXCLUDED.calculo_automatico,
    formula_json = EXCLUDED.formula_json;

INSERT INTO concepto (
    codigo, codigo_motor, nombre, tipo, naturaleza, imponible, tributable, afecta_afp,
    afecta_salud, afecta_afc, afecta_sis, orden_impresion, calculo_automatico, formula_json
) VALUES (
    'MOVILIZACION', 'MOVILIZACION', 'Movilización',
    'HABER', 'NO_IMPONIBLE',
    FALSE, FALSE,
    FALSE, FALSE,
    FALSE, FALSE,
    50, FALSE,
    NULL
)
ON CONFLICT (codigo) DO UPDATE SET
    codigo_motor = EXCLUDED.codigo_motor,
    nombre = EXCLUDED.nombre,
    tipo = EXCLUDED.tipo,
    naturaleza = EXCLUDED.naturaleza,
    imponible = EXCLUDED.imponible,
    tributable = EXCLUDED.tributable,
    afecta_afp = EXCLUDED.afecta_afp,
    afecta_salud = EXCLUDED.afecta_salud,
    afecta_afc = EXCLUDED.afecta_afc,
    afecta_sis = EXCLUDED.afecta_sis,
    orden_impresion = EXCLUDED.orden_impresion,
    calculo_automatico = EXCLUDED.calculo_automatico,
    formula_json = EXCLUDED.formula_json;

INSERT INTO concepto (
    codigo, codigo_motor, nombre, tipo, naturaleza, imponible, tributable, afecta_afp,
    afecta_salud, afecta_afc, afecta_sis, orden_impresion, calculo_automatico, formula_json
) VALUES (
    'BONO', 'BONO', 'Bono',
    'HABER', 'IMPONIBLE',
    TRUE, TRUE,
    TRUE, TRUE,
    TRUE, TRUE,
    60, FALSE,
    NULL
)
ON CONFLICT (codigo) DO UPDATE SET
    codigo_motor = EXCLUDED.codigo_motor,
    nombre = EXCLUDED.nombre,
    tipo = EXCLUDED.tipo,
    naturaleza = EXCLUDED.naturaleza,
    imponible = EXCLUDED.imponible,
    tributable = EXCLUDED.tributable,
    afecta_afp = EXCLUDED.afecta_afp,
    afecta_salud = EXCLUDED.afecta_salud,
    afecta_afc = EXCLUDED.afecta_afc,
    afecta_sis = EXCLUDED.afecta_sis,
    orden_impresion = EXCLUDED.orden_impresion,
    calculo_automatico = EXCLUDED.calculo_automatico,
    formula_json = EXCLUDED.formula_json;

INSERT INTO concepto (
    codigo, codigo_motor, nombre, tipo, naturaleza, imponible, tributable, afecta_afp,
    afecta_salud, afecta_afc, afecta_sis, orden_impresion, calculo_automatico, formula_json
) VALUES (
    'AFP', 'AFP', 'Descuento AFP',
    'DESCUENTO', 'IMPONIBLE',
    FALSE, FALSE,
    FALSE, FALSE,
    FALSE, FALSE,
    200, TRUE,
    '{"tipo": "regla", "codigo": "DESCUENTO_AFP"}'::jsonb
)
ON CONFLICT (codigo) DO UPDATE SET
    codigo_motor = EXCLUDED.codigo_motor,
    nombre = EXCLUDED.nombre,
    tipo = EXCLUDED.tipo,
    naturaleza = EXCLUDED.naturaleza,
    imponible = EXCLUDED.imponible,
    tributable = EXCLUDED.tributable,
    afecta_afp = EXCLUDED.afecta_afp,
    afecta_salud = EXCLUDED.afecta_salud,
    afecta_afc = EXCLUDED.afecta_afc,
    afecta_sis = EXCLUDED.afecta_sis,
    orden_impresion = EXCLUDED.orden_impresion,
    calculo_automatico = EXCLUDED.calculo_automatico,
    formula_json = EXCLUDED.formula_json;

INSERT INTO concepto (
    codigo, codigo_motor, nombre, tipo, naturaleza, imponible, tributable, afecta_afp,
    afecta_salud, afecta_afc, afecta_sis, orden_impresion, calculo_automatico, formula_json
) VALUES (
    'SALUD', 'SALUD', 'Descuento salud',
    'DESCUENTO', 'IMPONIBLE',
    FALSE, FALSE,
    FALSE, FALSE,
    FALSE, FALSE,
    210, TRUE,
    '{"tipo": "regla", "codigo": "DESCUENTO_SALUD"}'::jsonb
)
ON CONFLICT (codigo) DO UPDATE SET
    codigo_motor = EXCLUDED.codigo_motor,
    nombre = EXCLUDED.nombre,
    tipo = EXCLUDED.tipo,
    naturaleza = EXCLUDED.naturaleza,
    imponible = EXCLUDED.imponible,
    tributable = EXCLUDED.tributable,
    afecta_afp = EXCLUDED.afecta_afp,
    afecta_salud = EXCLUDED.afecta_salud,
    afecta_afc = EXCLUDED.afecta_afc,
    afecta_sis = EXCLUDED.afecta_sis,
    orden_impresion = EXCLUDED.orden_impresion,
    calculo_automatico = EXCLUDED.calculo_automatico,
    formula_json = EXCLUDED.formula_json;

INSERT INTO concepto (
    codigo, codigo_motor, nombre, tipo, naturaleza, imponible, tributable, afecta_afp,
    afecta_salud, afecta_afc, afecta_sis, orden_impresion, calculo_automatico, formula_json
) VALUES (
    'CESANTIA', 'CESANTIA', 'Seguro de cesantía',
    'DESCUENTO', 'IMPONIBLE',
    FALSE, FALSE,
    FALSE, FALSE,
    FALSE, FALSE,
    220, TRUE,
    '{"tipo": "regla", "codigo": "DESCUENTO_AFC"}'::jsonb
)
ON CONFLICT (codigo) DO UPDATE SET
    codigo_motor = EXCLUDED.codigo_motor,
    nombre = EXCLUDED.nombre,
    tipo = EXCLUDED.tipo,
    naturaleza = EXCLUDED.naturaleza,
    imponible = EXCLUDED.imponible,
    tributable = EXCLUDED.tributable,
    afecta_afp = EXCLUDED.afecta_afp,
    afecta_salud = EXCLUDED.afecta_salud,
    afecta_afc = EXCLUDED.afecta_afc,
    afecta_sis = EXCLUDED.afecta_sis,
    orden_impresion = EXCLUDED.orden_impresion,
    calculo_automatico = EXCLUDED.calculo_automatico,
    formula_json = EXCLUDED.formula_json;

INSERT INTO concepto (
    codigo, codigo_motor, nombre, tipo, naturaleza, imponible, tributable, afecta_afp,
    afecta_salud, afecta_afc, afecta_sis, orden_impresion, calculo_automatico, formula_json
) VALUES (
    'IMPUESTO_UNICO', 'IMPUESTO_UNICO', 'Impuesto único',
    'DESCUENTO', 'IMPONIBLE',
    FALSE, FALSE,
    FALSE, FALSE,
    FALSE, FALSE,
    230, TRUE,
    '{"tipo": "regla", "codigo": "IMPUESTO_UNICO"}'::jsonb
)
ON CONFLICT (codigo) DO UPDATE SET
    codigo_motor = EXCLUDED.codigo_motor,
    nombre = EXCLUDED.nombre,
    tipo = EXCLUDED.tipo,
    naturaleza = EXCLUDED.naturaleza,
    imponible = EXCLUDED.imponible,
    tributable = EXCLUDED.tributable,
    afecta_afp = EXCLUDED.afecta_afp,
    afecta_salud = EXCLUDED.afecta_salud,
    afecta_afc = EXCLUDED.afecta_afc,
    afecta_sis = EXCLUDED.afecta_sis,
    orden_impresion = EXCLUDED.orden_impresion,
    calculo_automatico = EXCLUDED.calculo_automatico,
    formula_json = EXCLUDED.formula_json;

INSERT INTO concepto (
    codigo, codigo_motor, nombre, tipo, naturaleza, imponible, tributable, afecta_afp,
    afecta_salud, afecta_afc, afecta_sis, orden_impresion, calculo_automatico, formula_json
) VALUES (
    'PRESTAMO', 'PRESTAMO', 'Préstamo',
    'DESCUENTO', 'NO_IMPONIBLE',
    FALSE, FALSE,
    FALSE, FALSE,
    FALSE, FALSE,
    240, FALSE,
    NULL
)
ON CONFLICT (codigo) DO UPDATE SET
    codigo_motor = EXCLUDED.codigo_motor,
    nombre = EXCLUDED.nombre,
    tipo = EXCLUDED.tipo,
    naturaleza = EXCLUDED.naturaleza,
    imponible = EXCLUDED.imponible,
    tributable = EXCLUDED.tributable,
    afecta_afp = EXCLUDED.afecta_afp,
    afecta_salud = EXCLUDED.afecta_salud,
    afecta_afc = EXCLUDED.afecta_afc,
    afecta_sis = EXCLUDED.afecta_sis,
    orden_impresion = EXCLUDED.orden_impresion,
    calculo_automatico = EXCLUDED.calculo_automatico,
    formula_json = EXCLUDED.formula_json;

INSERT INTO concepto (
    codigo, codigo_motor, nombre, tipo, naturaleza, imponible, tributable, afecta_afp,
    afecta_salud, afecta_afc, afecta_sis, orden_impresion, calculo_automatico, formula_json
) VALUES (
    'AFP_EMPLEADOR', 'AFP_EMPLEADOR', 'Aporte empleador AFP',
    'APORTE_EMPLEADOR', 'IMPONIBLE',
    FALSE, FALSE,
    FALSE, FALSE,
    FALSE, FALSE,
    300, TRUE,
    '{"tipo": "regla", "codigo": "APORTE_AFP_EMPLEADOR"}'::jsonb
)
ON CONFLICT (codigo) DO UPDATE SET
    codigo_motor = EXCLUDED.codigo_motor,
    nombre = EXCLUDED.nombre,
    tipo = EXCLUDED.tipo,
    naturaleza = EXCLUDED.naturaleza,
    imponible = EXCLUDED.imponible,
    tributable = EXCLUDED.tributable,
    afecta_afp = EXCLUDED.afecta_afp,
    afecta_salud = EXCLUDED.afecta_salud,
    afecta_afc = EXCLUDED.afecta_afc,
    afecta_sis = EXCLUDED.afecta_sis,
    orden_impresion = EXCLUDED.orden_impresion,
    calculo_automatico = EXCLUDED.calculo_automatico,
    formula_json = EXCLUDED.formula_json;

INSERT INTO concepto (
    codigo, codigo_motor, nombre, tipo, naturaleza, imponible, tributable, afecta_afp,
    afecta_salud, afecta_afc, afecta_sis, orden_impresion, calculo_automatico, formula_json
) VALUES (
    'SIS_EMPLEADOR', 'SIS_EMPLEADOR', 'SIS empleador',
    'APORTE_EMPLEADOR', 'IMPONIBLE',
    FALSE, FALSE,
    FALSE, FALSE,
    FALSE, FALSE,
    310, TRUE,
    '{"tipo": "regla", "codigo": "SIS_EMPLEADOR"}'::jsonb
)
ON CONFLICT (codigo) DO UPDATE SET
    codigo_motor = EXCLUDED.codigo_motor,
    nombre = EXCLUDED.nombre,
    tipo = EXCLUDED.tipo,
    naturaleza = EXCLUDED.naturaleza,
    imponible = EXCLUDED.imponible,
    tributable = EXCLUDED.tributable,
    afecta_afp = EXCLUDED.afecta_afp,
    afecta_salud = EXCLUDED.afecta_salud,
    afecta_afc = EXCLUDED.afecta_afc,
    afecta_sis = EXCLUDED.afecta_sis,
    orden_impresion = EXCLUDED.orden_impresion,
    calculo_automatico = EXCLUDED.calculo_automatico,
    formula_json = EXCLUDED.formula_json;

INSERT INTO concepto (
    codigo, codigo_motor, nombre, tipo, naturaleza, imponible, tributable, afecta_afp,
    afecta_salud, afecta_afc, afecta_sis, orden_impresion, calculo_automatico, formula_json
) VALUES (
    'AFC_EMPLEADOR', 'AFC_EMPLEADOR', 'AFC empleador',
    'APORTE_EMPLEADOR', 'IMPONIBLE',
    FALSE, FALSE,
    FALSE, FALSE,
    FALSE, FALSE,
    320, TRUE,
    '{"tipo": "regla", "codigo": "AFC_EMPLEADOR"}'::jsonb
)
ON CONFLICT (codigo) DO UPDATE SET
    codigo_motor = EXCLUDED.codigo_motor,
    nombre = EXCLUDED.nombre,
    tipo = EXCLUDED.tipo,
    naturaleza = EXCLUDED.naturaleza,
    imponible = EXCLUDED.imponible,
    tributable = EXCLUDED.tributable,
    afecta_afp = EXCLUDED.afecta_afp,
    afecta_salud = EXCLUDED.afecta_salud,
    afecta_afc = EXCLUDED.afecta_afc,
    afecta_sis = EXCLUDED.afecta_sis,
    orden_impresion = EXCLUDED.orden_impresion,
    calculo_automatico = EXCLUDED.calculo_automatico,
    formula_json = EXCLUDED.formula_json;


COMMIT;
