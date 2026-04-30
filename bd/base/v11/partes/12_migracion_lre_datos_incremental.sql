-- =============================================================================
-- Datos LRE / conceptos / reglas / demo haberdescuento / demo movimiento
-- para BD YA EXISTENTE (no usar 00_reset ni run_all completo).
--
-- Prerrequisito: haber ejecutado partes/07_migracion_lre_ejecutar.sql (DDL).
-- Idempotente: INSERT ... ON CONFLICT y UPDATEs por codigo_lre / codigo.
-- =============================================================================
SET search_path = public;

-- Catálogo y conceptos nuevos: igual que 05_inserts_upserts.sql (truncado a este módulo)

INSERT INTO motivo_inasistencia (
    id_motivo_inasistencia,
    codigo,
    nombre,
    descuenta_dias,
    activo
) VALUES
    (102, 'INASISTENCIA_INJUSTIFICADA', 'Inasistencia injustificada', TRUE, TRUE)
ON CONFLICT (id_motivo_inasistencia) DO NOTHING;

INSERT INTO catalogo_lre (
    codigo_lre, nombre_lre, modulo_lre, grupo_lre, clasificacion_lre,
    imponible, tributable, afecta_liquido, vigente
) VALUES
    ('2101', 'Sueldo', 'HABERES', 'HABERES_21XX', 'HABER_IMPONIBLE_TRIBUTABLE', TRUE, TRUE, TRUE, TRUE),
    ('2110', 'Aguinaldo', 'HABERES', 'HABERES_21XX', 'HABER_IMPONIBLE_TRIBUTABLE', TRUE, TRUE, TRUE, TRUE),
    ('2111', 'Bonos u otras remuneraciones fijas mensuales', 'HABERES', 'HABERES_21XX', 'HABER_IMPONIBLE_TRIBUTABLE', TRUE, TRUE, TRUE, TRUE),
    ('2113', 'Bonos u otras remuneraciones variables mensuales o superiores a un mes', 'HABERES', 'HABERES_21XX', 'HABER_IMPONIBLE_TRIBUTABLE', TRUE, TRUE, TRUE, TRUE),
    ('2301', 'Colación total mensual (Art. 41)', 'HABERES', 'HABERES_23XX', 'HABER_NO_IMPONIBLE_NO_TRIBUTABLE', FALSE, FALSE, TRUE, TRUE),
    ('2302', 'Movilización total mensual (Art. 41)', 'HABERES', 'HABERES_23XX', 'HABER_NO_IMPONIBLE_NO_TRIBUTABLE', FALSE, FALSE, TRUE, TRUE),
    ('2311', 'Asignación familiar legal total mensual (Art. 41)', 'HABERES', 'HABERES_23XX', 'HABER_NO_IMPONIBLE_NO_TRIBUTABLE', FALSE, FALSE, TRUE, TRUE),
    ('3141', 'Cotización obligatoria previsional (AFP o IPS)', 'DESCUENTOS', 'DESCUENTOS_31XX', 'DESCUENTO_LEGAL', FALSE, FALSE, TRUE, TRUE),
    ('3143', 'Cotización obligatoria salud 7%', 'DESCUENTOS', 'DESCUENTOS_31XX', 'DESCUENTO_LEGAL', FALSE, FALSE, TRUE, TRUE),
    ('3151', 'Cotización AFC - trabajador', 'DESCUENTOS', 'DESCUENTOS_31XX', 'DESCUENTO_LEGAL', FALSE, FALSE, TRUE, TRUE),
    ('3183', 'Otros descuentos autorizados y solicitados por el trabajador', 'DESCUENTOS', 'DESCUENTOS_31XX', 'OTRO_DESCUENTO', FALSE, FALSE, TRUE, TRUE),
    ('3186', 'Pensiones de alimentos', 'DESCUENTOS', 'DESCUENTOS_31XX', 'OTRO_DESCUENTO', FALSE, FALSE, TRUE, TRUE),
    ('3188', 'Descuentos por anticipos y préstamos', 'DESCUENTOS', 'DESCUENTOS_31XX', 'OTRO_DESCUENTO', FALSE, FALSE, TRUE, TRUE),
    ('4151', 'Aporte AFC - empleador', 'APORTES_EMPLEADOR', 'APORTES_41XX', 'APORTE_EMPLEADOR', FALSE, FALSE, FALSE, TRUE),
    ('4155', 'Aporte empleador seguro invalidez y sobrevivencia', 'APORTES_EMPLEADOR', 'APORTES_41XX', 'APORTE_EMPLEADOR', FALSE, FALSE, FALSE, TRUE)
ON CONFLICT (codigo_lre) DO NOTHING;

-- Alinear glosas si el catálogo ya existía con nombres cortos
UPDATE catalogo_lre
SET nombre_lre = 'Bonos u otras remuneraciones variables mensuales o superiores a un mes'
WHERE codigo_lre = '2113';

UPDATE catalogo_lre
SET nombre_lre = 'Movilización total mensual (Art. 41)'
WHERE codigo_lre = '2302';

INSERT INTO concepto (
    codigo, nombre, tipo, naturaleza, imponible, tributable,
    afecta_afp, afecta_salud, afecta_afc, afecta_sis, orden_impresion, calculo_automatico,
    es_sistema, afecta_liquido, vigente
) VALUES
    ('SUELDO_BASE', 'Sueldo base', 'HABER', 'IMPONIBLE', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, 10, TRUE, TRUE, TRUE, TRUE),
    ('GRATIFICACION', 'Gratificacion legal', 'HABER', 'IMPONIBLE', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, 20, TRUE, TRUE, TRUE, TRUE),
    ('HORAS_EXTRAS', 'Horas extras', 'HABER', 'IMPONIBLE', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, 30, TRUE, TRUE, TRUE, TRUE),
    ('INASISTENCIA', 'Inasistencia', 'DESCUENTO', 'NO_IMPONIBLE', FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 40, TRUE, TRUE, TRUE, TRUE),
    ('AFP', 'Cotizacion AFP', 'DESCUENTO', 'NO_IMPONIBLE', FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 50, TRUE, TRUE, TRUE, TRUE),
    ('SALUD', 'Cotizacion salud', 'DESCUENTO', 'NO_IMPONIBLE', FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 51, TRUE, TRUE, TRUE, TRUE),
    ('CESANTIA', 'Seguro cesantia', 'DESCUENTO', 'NO_IMPONIBLE', FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 52, TRUE, TRUE, TRUE, TRUE),
    ('PRESTAMO', 'Descuento prestamo', 'DESCUENTO', 'NO_IMPONIBLE', FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 54, FALSE, FALSE, TRUE, TRUE),
    ('IMPUESTO_RENTA', 'Impuesto a la renta', 'DESCUENTO', 'NO_IMPONIBLE', FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 55, TRUE, TRUE, TRUE, TRUE),
    ('BONO_RESPONSABILIDAD', 'Bono responsabilidad', 'HABER', 'IMPONIBLE', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, 60, FALSE, FALSE, TRUE, TRUE),
    ('MOVILIZACION', 'Movilizacion', 'HABER', 'NO_IMPONIBLE', FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 70, FALSE, FALSE, TRUE, TRUE),
    ('ZONA_EXTREMA', 'Zona extrema', 'HABER', 'NO_IMPONIBLE', FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 80, TRUE, TRUE, TRUE, TRUE),
    ('AFP_EMPLEADOR', 'AFP empleador', 'APORTE_EMPLEADOR', 'NO_IMPONIBLE', FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 120, TRUE, TRUE, FALSE, TRUE),
    ('SIS_EMPLEADOR', 'SIS empleador', 'APORTE_EMPLEADOR', 'NO_IMPONIBLE', FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 121, TRUE, TRUE, FALSE, TRUE),
    ('AFC_EMPLEADOR', 'AFC empleador', 'APORTE_EMPLEADOR', 'NO_IMPONIBLE', FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 122, TRUE, TRUE, FALSE, TRUE),
    ('COLACION', 'Colación (Art. 41)', 'HABER', 'NO_IMPONIBLE', FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 90, FALSE, TRUE, TRUE, TRUE),
    ('ASIGNACION_FAMILIAR', 'Asignación familiar legal', 'HABER', 'NO_IMPONIBLE', FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 91, TRUE, TRUE, TRUE, TRUE),
    ('AGUINALDO', 'Aguinaldo', 'HABER', 'IMPONIBLE', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, 92, FALSE, TRUE, TRUE, TRUE),
    ('DESCUENTO_CONVENIO', 'Descuento por convenio o autorización', 'DESCUENTO', 'NO_IMPONIBLE', FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 93, FALSE, FALSE, TRUE, TRUE),
    ('PENSION_ALIMENTOS', 'Pensión de alimentos', 'DESCUENTO', 'NO_IMPONIBLE', FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 94, FALSE, FALSE, TRUE, TRUE),
    ('ANTICIPO', 'Anticipo o descuento por cuenta', 'DESCUENTO', 'NO_IMPONIBLE', FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 95, FALSE, FALSE, TRUE, TRUE)
ON CONFLICT (codigo) DO NOTHING;

UPDATE concepto c
SET id_catalogo_lre = l.id_catalogo_lre
FROM catalogo_lre l
WHERE c.codigo = 'SUELDO_BASE' AND l.codigo_lre = '2101';

-- Ver comentario en 05_inserts_upserts.sql: duda normativa HORAS_EXTRAS vs 2113 / 2102.
UPDATE concepto c
SET id_catalogo_lre = l.id_catalogo_lre
FROM catalogo_lre l
WHERE c.codigo = 'HORAS_EXTRAS' AND l.codigo_lre = '2113';

UPDATE concepto c
SET id_catalogo_lre = l.id_catalogo_lre
FROM catalogo_lre l
WHERE c.codigo = 'BONO_RESPONSABILIDAD' AND l.codigo_lre = '2111';

UPDATE concepto c
SET id_catalogo_lre = l.id_catalogo_lre
FROM catalogo_lre l
WHERE c.codigo = 'MOVILIZACION' AND l.codigo_lre = '2302';

UPDATE concepto c
SET id_catalogo_lre = l.id_catalogo_lre
FROM catalogo_lre l
WHERE c.codigo = 'AFP' AND l.codigo_lre = '3141';

UPDATE concepto c
SET id_catalogo_lre = l.id_catalogo_lre
FROM catalogo_lre l
WHERE c.codigo = 'SALUD' AND l.codigo_lre = '3143';

UPDATE concepto c
SET id_catalogo_lre = l.id_catalogo_lre
FROM catalogo_lre l
WHERE c.codigo = 'PRESTAMO' AND l.codigo_lre = '3188';

UPDATE concepto c
SET id_catalogo_lre = l.id_catalogo_lre
FROM catalogo_lre l
WHERE c.codigo = 'CESANTIA' AND l.codigo_lre = '3151';

UPDATE concepto c
SET id_catalogo_lre = l.id_catalogo_lre
FROM catalogo_lre l
WHERE c.codigo = 'AFC_EMPLEADOR' AND l.codigo_lre = '4151';

UPDATE concepto c
SET id_catalogo_lre = l.id_catalogo_lre
FROM catalogo_lre l
WHERE c.codigo = 'SIS_EMPLEADOR' AND l.codigo_lre = '4155';

UPDATE concepto c
SET id_catalogo_lre = l.id_catalogo_lre
FROM catalogo_lre l
WHERE c.codigo = 'AGUINALDO' AND l.codigo_lre = '2110';

UPDATE concepto c
SET id_catalogo_lre = l.id_catalogo_lre
FROM catalogo_lre l
WHERE c.codigo = 'COLACION' AND l.codigo_lre = '2301';

UPDATE concepto c
SET id_catalogo_lre = l.id_catalogo_lre
FROM catalogo_lre l
WHERE c.codigo = 'ASIGNACION_FAMILIAR' AND l.codigo_lre = '2311';

UPDATE concepto c
SET id_catalogo_lre = l.id_catalogo_lre
FROM catalogo_lre l
WHERE c.codigo = 'DESCUENTO_CONVENIO' AND l.codigo_lre = '3183';

UPDATE concepto c
SET id_catalogo_lre = l.id_catalogo_lre
FROM catalogo_lre l
WHERE c.codigo = 'PENSION_ALIMENTOS' AND l.codigo_lre = '3186';

UPDATE concepto c
SET id_catalogo_lre = l.id_catalogo_lre
FROM catalogo_lre l
WHERE c.codigo = 'ANTICIPO' AND l.codigo_lre = '3188';

INSERT INTO regla_concepto_calculo (
    id_concepto,
    codigo_regla,
    orden_calculo,
    base_calculo,
    formula_sql,
    usa_tope_imponible,
    usa_tabla_impuesto,
    calculo_automatico,
    activo,
    vigencia_inicio
)
SELECT
    c.id_concepto,
    r.codigo_regla,
    r.orden_calculo,
    r.base_calculo,
    r.formula_sql,
    r.usa_tope_imponible,
    r.usa_tabla_impuesto,
    r.calculo_automatico,
    TRUE,
    DATE '2024-01-01'
FROM concepto c
JOIN (
    VALUES
        ('SUELDO_BASE', 'BASE_REMUNERACION', 10, 'SUELDO_BASE', 'sueldo_base_proporcional', TRUE, FALSE, TRUE),
        ('GRATIFICACION', 'GRATIFICACION_LEGAL', 20, 'HABERES_IMPONIBLES', 'gratificacion_según_tipo', TRUE, FALSE, TRUE),
        ('HORAS_EXTRAS', 'HORAS_EXTRAS', 30, 'VALOR_HORA', 'cantidad * valor_hora_recargado', FALSE, FALSE, TRUE),
        ('AFP', 'DESCUENTO_AFP', 50, 'RENTA_IMPONIBLE_TOPE', '(tasa_afp + comision_afp) * base', TRUE, FALSE, TRUE),
        ('SALUD', 'DESCUENTO_SALUD', 51, 'RENTA_IMPONIBLE_TOPE', 'max(7_por_ciento, plan_salud)', TRUE, FALSE, TRUE),
        ('CESANTIA', 'DESCUENTO_AFC', 52, 'RENTA_IMPONIBLE_TOPE', 'tasa_afc_trabajador * base', TRUE, FALSE, TRUE),
        ('IMPUESTO_RENTA', 'IMPUESTO_UNICO', 55, 'TOTAL_TRIBUTABLE', 'tabla_impuesto_unico(periodo)', FALSE, TRUE, TRUE),
        ('ZONA_EXTREMA', 'ASIGNACION_ZONA_EXTREMA', 80, 'HABERES_IMPONIBLES', 'porcentaje_zona_extrema * base', FALSE, FALSE, TRUE),
        ('AFP_EMPLEADOR', 'APORTE_AFP_EMPLEADOR', 120, 'RENTA_IMPONIBLE_TOPE', 'tasa_empleador_afp * base', TRUE, FALSE, TRUE),
        ('ASIGNACION_FAMILIAR', 'ASIGNACION_FAMILIAR_LEGAL', 91, 'TRAMO_ASIGNACION_FAMILIAR', 'monto_legal_segun_tramo_y_cargas', FALSE, FALSE, TRUE)
) AS r(codigo_concepto, codigo_regla, orden_calculo, base_calculo, formula_sql, usa_tope_imponible, usa_tabla_impuesto, calculo_automatico)
    ON r.codigo_concepto = c.codigo
WHERE NOT EXISTS (
    SELECT 1
    FROM regla_concepto_calculo rc
    WHERE rc.id_concepto = c.id_concepto
      AND rc.codigo_regla = r.codigo_regla
      AND rc.vigencia_inicio = DATE '2024-01-01'
);

-- Asignaciones demo: insertar o actualizar contrato/vigencia/periodicidad si ya existían id 1 y 2
INSERT INTO haberdescuento_persona (
    id_asignacion,
    id_persona,
    id_contrato,
    id_concepto,
    monto,
    porcentaje,
    tipo,
    tipohaber,
    estado,
    vigencia_inicio,
    vigencia_fin,
    observacion,
    periodicidad
)
SELECT
    1,
    1,
    1,
    c.id_concepto,
    50000,
    NULL,
    'FIJO',
    'IMPONIBLE',
    TRUE,
    DATE '2024-01-01',
    NULL,
    'Seed demo: asignación recurrente',
    'MENSUAL'
FROM concepto c
WHERE c.codigo = 'BONO_RESPONSABILIDAD'
ON CONFLICT (id_asignacion) DO UPDATE SET
    id_contrato = EXCLUDED.id_contrato,
    id_concepto = EXCLUDED.id_concepto,
    monto = EXCLUDED.monto,
    porcentaje = EXCLUDED.porcentaje,
    tipo = EXCLUDED.tipo,
    tipohaber = EXCLUDED.tipohaber,
    estado = EXCLUDED.estado,
    vigencia_inicio = EXCLUDED.vigencia_inicio,
    vigencia_fin = EXCLUDED.vigencia_fin,
    observacion = EXCLUDED.observacion,
    periodicidad = EXCLUDED.periodicidad;

INSERT INTO haberdescuento_persona (
    id_asignacion,
    id_persona,
    id_contrato,
    id_concepto,
    monto,
    porcentaje,
    tipo,
    tipohaber,
    estado,
    vigencia_inicio,
    vigencia_fin,
    observacion,
    periodicidad
)
SELECT
    2,
    1,
    1,
    c.id_concepto,
    30000,
    NULL,
    'FIJO',
    'NOIMPONIBLE',
    TRUE,
    DATE '2024-01-01',
    NULL,
    'Seed demo: asignación recurrente',
    'MENSUAL'
FROM concepto c
WHERE c.codigo = 'MOVILIZACION'
ON CONFLICT (id_asignacion) DO UPDATE SET
    id_contrato = EXCLUDED.id_contrato,
    id_concepto = EXCLUDED.id_concepto,
    monto = EXCLUDED.monto,
    porcentaje = EXCLUDED.porcentaje,
    tipo = EXCLUDED.tipo,
    tipohaber = EXCLUDED.tipohaber,
    estado = EXCLUDED.estado,
    vigencia_inicio = EXCLUDED.vigencia_inicio,
    vigencia_fin = EXCLUDED.vigencia_fin,
    observacion = EXCLUDED.observacion,
    periodicidad = EXCLUDED.periodicidad;

-- Movimientos demo: crear o reparar FK normalizadas + concepto
INSERT INTO movimiento (
    id_movimiento,
    id_persona,
    id_contrato,
    id_concepto,
    fecha,
    id_tipo_movimiento,
    id_motivo_inasistencia,
    tipomovimiento,
    motivoinasist,
    diainasist,
    hrs_pactadas,
    monto,
    cantidad,
    observacion
)
SELECT
    1,
    1,
    1,
    c.id_concepto,
    DATE '2024-01-10',
    2,
    NULL,
    2,
    NULL,
    0,
    2,
    45000,
    2,
    'Horas extras enero (seed demo)'
FROM concepto c
WHERE c.codigo = 'HORAS_EXTRAS'
ON CONFLICT (id_movimiento) DO UPDATE SET
    id_persona = EXCLUDED.id_persona,
    id_contrato = EXCLUDED.id_contrato,
    id_concepto = EXCLUDED.id_concepto,
    fecha = EXCLUDED.fecha,
    id_tipo_movimiento = EXCLUDED.id_tipo_movimiento,
    id_motivo_inasistencia = EXCLUDED.id_motivo_inasistencia,
    tipomovimiento = EXCLUDED.tipomovimiento,
    motivoinasist = EXCLUDED.motivoinasist,
    diainasist = EXCLUDED.diainasist,
    hrs_pactadas = EXCLUDED.hrs_pactadas,
    monto = EXCLUDED.monto,
    cantidad = EXCLUDED.cantidad,
    observacion = EXCLUDED.observacion;

INSERT INTO movimiento (
    id_movimiento,
    id_persona,
    id_contrato,
    id_concepto,
    fecha,
    id_tipo_movimiento,
    id_motivo_inasistencia,
    tipomovimiento,
    motivoinasist,
    diainasist,
    hrs_pactadas,
    monto,
    cantidad,
    observacion
)
SELECT
    2,
    1,
    1,
    c.id_concepto,
    DATE '2024-01-18',
    3,
    102,
    3,
    102,
    1,
    NULL,
    25000,
    1,
    'Inasistencia injustificada (seed demo)'
FROM concepto c
WHERE c.codigo = 'INASISTENCIA'
ON CONFLICT (id_movimiento) DO UPDATE SET
    id_persona = EXCLUDED.id_persona,
    id_contrato = EXCLUDED.id_contrato,
    id_concepto = EXCLUDED.id_concepto,
    fecha = EXCLUDED.fecha,
    id_tipo_movimiento = EXCLUDED.id_tipo_movimiento,
    id_motivo_inasistencia = EXCLUDED.id_motivo_inasistencia,
    tipomovimiento = EXCLUDED.tipomovimiento,
    motivoinasist = EXCLUDED.motivoinasist,
    diainasist = EXCLUDED.diainasist,
    hrs_pactadas = EXCLUDED.hrs_pactadas,
    monto = EXCLUDED.monto,
    cantidad = EXCLUDED.cantidad,
    observacion = EXCLUDED.observacion;
