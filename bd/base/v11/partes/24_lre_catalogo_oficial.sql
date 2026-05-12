-- =============================================================================
-- LRE-CATALOG-01 - Catálogo oficial LRE y mapeo base de conceptos
-- Fuente normativa: Dirección del Trabajo, Suplemento Manual Libro de
-- Remuneraciones Electrónico, enero 2022.
--
-- Alcance:
-- - Completa catalogo_lre con campos 11xx, 21xx, 22xx, 23xx, 24xx,
--   31xx, 41xx y totales 5xxx del suplemento.
-- - Mapea conceptos internos base contra códigos LRE operativos.
-- - No crea exportador LRE, no recalcula nómina y no cambia fórmulas legales.
-- - Idempotente para BD existente y para base nueva.
-- =============================================================================
SET search_path = public;

INSERT INTO catalogo_lre (
    codigo_lre,
    nombre_lre,
    modulo_lre,
    grupo_lre,
    clasificacion_lre,
    imponible,
    tributable,
    afecta_liquido,
    vigente,
    vigencia_inicio,
    observacion
) VALUES
    ('1101', 'Rut trabajador', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1102', 'Fecha inicio contrato', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1103', 'Fecha de término de contrato', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1104', 'Causal de término del contrato', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1105', 'Región de prestación de los servicios', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1106', 'Comuna de prestación de los servicios', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1170', 'Tipo de impuesto a la renta', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1146', 'Técnico extranjero exención de cotizaciones previsionales (Ley 18.156)', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1107', 'Código tipo de jornada', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1108', 'Persona con discapacidad/pensionado por invalidez', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1109', 'Pensionado por vejez', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1141', 'AFP', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1142', 'IPS (ExINP)', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1143', 'FONASA / ISAPRE', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1151', 'AFC', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1110', 'CCAF', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1152', 'Org. Administrador Ley 16.744', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1111', 'Número cargas familiares legales autorizadas', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1112', 'Número de cargas familiares maternales', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1113', 'Número de cargas familiares invalidez', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1114', 'Tramo asignación familiar', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1171', 'Rut organización sindical 1', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1172', 'Rut organización sindical 2', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1173', 'Rut organización sindical 3', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1174', 'Rut organización sindical 4', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1175', 'Rut organización sindical 5', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1176', 'Rut organización sindical 6', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1177', 'Rut organización sindical 7', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1178', 'Rut organización sindical 8', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1179', 'Rut organización sindical 9', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1180', 'Rut organización sindical 10', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1115', 'Número de días trabajados en el mes', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1116', 'Número días de licencia médica en el mes', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1117', 'Número días de vacaciones en el mes', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1118', 'Subsidio trabajador Joven', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1154', 'Puesto trabajo pesado', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1155', 'Ahorro previsional voluntario individual', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1157', 'Ahorro previsional voluntario colectivo', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1131', 'Indemnización a todo evento (Art. 164)', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('1132', 'Tasa indemnización a todo evento (Art. 164)', 'IDENTIFICACION', 'IDENTIFICACION_11XX', 'DATO_IDENTIFICACION', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2101', 'Sueldo', 'HABERES', 'HABERES_21XX', 'HABER_IMPONIBLE_TRIBUTABLE', TRUE, TRUE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2102', 'Sobresueldo', 'HABERES', 'HABERES_21XX', 'HABER_IMPONIBLE_TRIBUTABLE', TRUE, TRUE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2103', 'Comisiones (mensual)', 'HABERES', 'HABERES_21XX', 'HABER_IMPONIBLE_TRIBUTABLE', TRUE, TRUE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2104', 'Semana corrida mensual (Art. 45)', 'HABERES', 'HABERES_21XX', 'HABER_IMPONIBLE_TRIBUTABLE', TRUE, TRUE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2105', 'Participación (mensual)', 'HABERES', 'HABERES_21XX', 'HABER_IMPONIBLE_TRIBUTABLE', TRUE, TRUE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2106', 'Gratificación (mensual)', 'HABERES', 'HABERES_21XX', 'HABER_IMPONIBLE_TRIBUTABLE', TRUE, TRUE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2107', 'Recargo 30% día domingo (Art. 38)', 'HABERES', 'HABERES_21XX', 'HABER_IMPONIBLE_TRIBUTABLE', TRUE, TRUE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2108', 'Remuneración variable pagada en vacaciones (Art. 71)', 'HABERES', 'HABERES_21XX', 'HABER_IMPONIBLE_TRIBUTABLE', TRUE, TRUE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2109', 'Remuneración variable pagada en clausura (Art. 38 DFL 2)', 'HABERES', 'HABERES_21XX', 'HABER_IMPONIBLE_TRIBUTABLE', TRUE, TRUE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2110', 'Aguinaldo', 'HABERES', 'HABERES_21XX', 'HABER_IMPONIBLE_TRIBUTABLE', TRUE, TRUE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2111', 'Bonos u otras remuneraciones fijas mensuales', 'HABERES', 'HABERES_21XX', 'HABER_IMPONIBLE_TRIBUTABLE', TRUE, TRUE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2112', 'Tratos (mensual)', 'HABERES', 'HABERES_21XX', 'HABER_IMPONIBLE_TRIBUTABLE', TRUE, TRUE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2113', 'Bonos u otras remuneraciones variables mensuales o superiores a un mes', 'HABERES', 'HABERES_21XX', 'HABER_IMPONIBLE_TRIBUTABLE', TRUE, TRUE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2114', 'Ejercicio opción no pactada en contrato (Art. 17 N°8 LIR)', 'HABERES', 'HABERES_21XX', 'HABER_IMPONIBLE_TRIBUTABLE', TRUE, TRUE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2115', 'Beneficios en especie constitutivos de remuneración', 'HABERES', 'HABERES_21XX', 'HABER_IMPONIBLE_TRIBUTABLE', TRUE, TRUE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2116', 'Remuneraciones bimestrales (devengo en dos meses)', 'HABERES', 'HABERES_21XX', 'HABER_IMPONIBLE_TRIBUTABLE', TRUE, TRUE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2117', 'Remuneraciones trimestrales (devengo en tres meses)', 'HABERES', 'HABERES_21XX', 'HABER_IMPONIBLE_TRIBUTABLE', TRUE, TRUE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2118', 'Remuneraciones cuatrimestrales (devengo en cuatro meses)', 'HABERES', 'HABERES_21XX', 'HABER_IMPONIBLE_TRIBUTABLE', TRUE, TRUE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2119', 'Remuneraciones semestrales (devengo en seis meses)', 'HABERES', 'HABERES_21XX', 'HABER_IMPONIBLE_TRIBUTABLE', TRUE, TRUE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2120', 'Remuneraciones anuales (devengo en doce meses)', 'HABERES', 'HABERES_21XX', 'HABER_IMPONIBLE_TRIBUTABLE', TRUE, TRUE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2121', 'Participación anual (devengo en doce meses)', 'HABERES', 'HABERES_21XX', 'HABER_IMPONIBLE_TRIBUTABLE', TRUE, TRUE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2122', 'Gratificación anual (devengo en doce meses)', 'HABERES', 'HABERES_21XX', 'HABER_IMPONIBLE_TRIBUTABLE', TRUE, TRUE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2123', 'Otras remuneraciones superiores a un mes', 'HABERES', 'HABERES_21XX', 'HABER_IMPONIBLE_TRIBUTABLE', TRUE, TRUE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2124', 'Pago por horas de trabajo sindical', 'HABERES', 'HABERES_21XX', 'HABER_IMPONIBLE_TRIBUTABLE', TRUE, TRUE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2161', 'Sueldo empresarial', 'HABERES', 'HABERES_21XX', 'HABER_IMPONIBLE_TRIBUTABLE', TRUE, TRUE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2201', 'Subsidio por incapacidad laboral por licencia médica - total mensual', 'HABERES', 'HABERES_22XX', 'HABER_IMPONIBLE_NO_TRIBUTABLE', TRUE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2202', 'Beca de estudio (Art. 17 N°18 LIR)', 'HABERES', 'HABERES_22XX', 'HABER_IMPONIBLE_NO_TRIBUTABLE', TRUE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2203', 'Gratificaciones de zona (Art. 17 N°27 LIR)', 'HABERES', 'HABERES_22XX', 'HABER_IMPONIBLE_NO_TRIBUTABLE', TRUE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2204', 'Otros ingresos no constitutivos de renta (Art. 17 N°29 LIR)', 'HABERES', 'HABERES_22XX', 'HABER_IMPONIBLE_NO_TRIBUTABLE', TRUE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2301', 'Colación total mensual (Art. 41)', 'HABERES', 'HABERES_23XX', 'HABER_NO_IMPONIBLE_NO_TRIBUTABLE', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2302', 'Movilización total mensual (Art. 41)', 'HABERES', 'HABERES_23XX', 'HABER_NO_IMPONIBLE_NO_TRIBUTABLE', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2303', 'Viáticos total mensual (Art. 41)', 'HABERES', 'HABERES_23XX', 'HABER_NO_IMPONIBLE_NO_TRIBUTABLE', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2304', 'Asignación de pérdida de caja total mensual (Art. 41)', 'HABERES', 'HABERES_23XX', 'HABER_NO_IMPONIBLE_NO_TRIBUTABLE', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2305', 'Asignación de desgaste herramientas total mensual (Art. 41)', 'HABERES', 'HABERES_23XX', 'HABER_NO_IMPONIBLE_NO_TRIBUTABLE', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2311', 'Asignación familiar legal total mensual (Art. 41)', 'HABERES', 'HABERES_23XX', 'HABER_NO_IMPONIBLE_NO_TRIBUTABLE', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2306', 'Gastos por causa del trabajo (Art. 41 CdT) y gastos de representación (Art. 42 N°1 LIR)', 'HABERES', 'HABERES_23XX', 'HABER_NO_IMPONIBLE_NO_TRIBUTABLE', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2307', 'Gastos por cambio de residencia (Art. 53)', 'HABERES', 'HABERES_23XX', 'HABER_NO_IMPONIBLE_NO_TRIBUTABLE', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2308', 'Sala cuna (Art. 203)', 'HABERES', 'HABERES_23XX', 'HABER_NO_IMPONIBLE_NO_TRIBUTABLE', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2309', 'Asignación trabajo a distancia o teletrabajo', 'HABERES', 'HABERES_23XX', 'HABER_NO_IMPONIBLE_NO_TRIBUTABLE', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2347', 'Depósito convenido hasta UF 900', 'HABERES', 'HABERES_23XX', 'HABER_NO_IMPONIBLE_NO_TRIBUTABLE', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2310', 'Alojamiento por razones de trabajo (Art. 17 N°14 LIR)', 'HABERES', 'HABERES_23XX', 'HABER_NO_IMPONIBLE_NO_TRIBUTABLE', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2312', 'Asignación de traslación (Art. 17 N°15 LIR)', 'HABERES', 'HABERES_23XX', 'HABER_NO_IMPONIBLE_NO_TRIBUTABLE', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2313', 'Indemnización por feriado legal', 'HABERES', 'HABERES_23XX', 'HABER_NO_IMPONIBLE_NO_TRIBUTABLE', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2314', 'Indemnización años de servicio', 'HABERES', 'HABERES_23XX', 'HABER_NO_IMPONIBLE_NO_TRIBUTABLE', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2315', 'Indemnización sustitutiva del aviso previo', 'HABERES', 'HABERES_23XX', 'HABER_NO_IMPONIBLE_NO_TRIBUTABLE', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2316', 'Indemnización fuero maternal (Art. 163 bis)', 'HABERES', 'HABERES_23XX', 'HABER_NO_IMPONIBLE_NO_TRIBUTABLE', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2331', 'Indemnización a todo evento (Art. 164)', 'HABERES', 'HABERES_23XX', 'HABER_NO_IMPONIBLE_NO_TRIBUTABLE', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2417', 'Indemnizaciones voluntarias tributables', 'HABERES', 'HABERES_24XX', 'HABER_NO_IMPONIBLE_TRIBUTABLE', FALSE, TRUE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('2418', 'Indemnizaciones contractuales tributables', 'HABERES', 'HABERES_24XX', 'HABER_NO_IMPONIBLE_TRIBUTABLE', FALSE, TRUE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3141', 'Cotización obligatoria previsional (AFP o IPS)', 'DESCUENTOS', 'DESCUENTOS_31XX', 'DESCUENTO_LEGAL', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3143', 'Cotización obligatoria salud 7%', 'DESCUENTOS', 'DESCUENTOS_31XX', 'DESCUENTO_LEGAL', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3144', 'Cotización voluntaria para salud', 'DESCUENTOS', 'DESCUENTOS_31XX', 'DESCUENTO_LEGAL', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3151', 'Cotización AFC - trabajador', 'DESCUENTOS', 'DESCUENTOS_31XX', 'DESCUENTO_LEGAL', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3146', 'Cotizaciones técnico extranjero para seguridad social fuera de Chile', 'DESCUENTOS', 'DESCUENTOS_31XX', 'DESCUENTO_LEGAL', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3147', 'Descuento depósito convenido hasta UF 900 anual', 'DESCUENTOS', 'DESCUENTOS_31XX', 'DESCUENTO_LEGAL', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3155', 'Cotización ahorro previsional voluntario individual modalidad A', 'DESCUENTOS', 'DESCUENTOS_31XX', 'DESCUENTO_PREVISIONAL_VOLUNTARIO', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3156', 'Cotización ahorro previsional voluntario individual modalidad B hasta UF 50', 'DESCUENTOS', 'DESCUENTOS_31XX', 'DESCUENTO_PREVISIONAL_VOLUNTARIO', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3157', 'Cotización ahorro previsional voluntario colectivo modalidad A', 'DESCUENTOS', 'DESCUENTOS_31XX', 'DESCUENTO_PREVISIONAL_VOLUNTARIO', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3158', 'Cotización ahorro previsional voluntario colectivo modalidad B hasta UF 50', 'DESCUENTOS', 'DESCUENTOS_31XX', 'DESCUENTO_PREVISIONAL_VOLUNTARIO', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3161', 'Impuesto retenido por remuneraciones', 'DESCUENTOS', 'DESCUENTOS_31XX', 'DESCUENTO_IMPUESTO', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3162', 'Impuesto retenido por indemnizaciones', 'DESCUENTOS', 'DESCUENTOS_31XX', 'DESCUENTO_IMPUESTO', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3163', 'Mayor retención de impuesto solicitada por el trabajador', 'DESCUENTOS', 'DESCUENTOS_31XX', 'DESCUENTO_IMPUESTO', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3164', 'Impuesto retenido por reliquidación de remuneraciones devengadas en otros períodos mensuales', 'DESCUENTOS', 'DESCUENTOS_31XX', 'DESCUENTO_IMPUESTO_INFORMATIVO', FALSE, FALSE, FALSE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3165', 'Diferencia de impuesto por reliquidación de remuneraciones devengadas en este período', 'DESCUENTOS', 'DESCUENTOS_31XX', 'DESCUENTO_IMPUESTO', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3166', 'Retención préstamo clase media 2020 (Ley 21.252)', 'DESCUENTOS', 'DESCUENTOS_31XX', 'OTRO_DESCUENTO', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3167', 'Rebaja zona extrema DL 889', 'DESCUENTOS', 'DESCUENTOS_31XX', 'DESCUENTO_IMPUESTO', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3171', 'Cuota sindical 1', 'DESCUENTOS', 'DESCUENTOS_31XX', 'OTRO_DESCUENTO', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3172', 'Cuota sindical 2', 'DESCUENTOS', 'DESCUENTOS_31XX', 'OTRO_DESCUENTO', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3173', 'Cuota sindical 3', 'DESCUENTOS', 'DESCUENTOS_31XX', 'OTRO_DESCUENTO', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3174', 'Cuota sindical 4', 'DESCUENTOS', 'DESCUENTOS_31XX', 'OTRO_DESCUENTO', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3175', 'Cuota sindical 5', 'DESCUENTOS', 'DESCUENTOS_31XX', 'OTRO_DESCUENTO', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3176', 'Cuota sindical 6', 'DESCUENTOS', 'DESCUENTOS_31XX', 'OTRO_DESCUENTO', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3177', 'Cuota sindical 7', 'DESCUENTOS', 'DESCUENTOS_31XX', 'OTRO_DESCUENTO', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3178', 'Cuota sindical 8', 'DESCUENTOS', 'DESCUENTOS_31XX', 'OTRO_DESCUENTO', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3179', 'Cuota sindical 9', 'DESCUENTOS', 'DESCUENTOS_31XX', 'OTRO_DESCUENTO', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3180', 'Cuota sindical 10', 'DESCUENTOS', 'DESCUENTOS_31XX', 'OTRO_DESCUENTO', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3110', 'Crédito social CCAF', 'DESCUENTOS', 'DESCUENTOS_31XX', 'OTRO_DESCUENTO', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3181', 'Cuota vivienda o educación Art. 58', 'DESCUENTOS', 'DESCUENTOS_31XX', 'OTRO_DESCUENTO', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3182', 'Crédito cooperativas de ahorro (Art. 54 Ley Coop.)', 'DESCUENTOS', 'DESCUENTOS_31XX', 'OTRO_DESCUENTO', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3183', 'Otros descuentos autorizados y solicitados por el trabajador', 'DESCUENTOS', 'DESCUENTOS_31XX', 'OTRO_DESCUENTO', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3154', 'Cotización adicional trabajo pesado - trabajador', 'DESCUENTOS', 'DESCUENTOS_31XX', 'DESCUENTO_LEGAL', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3184', 'Donaciones culturales y de reconstrucción', 'DESCUENTOS', 'DESCUENTOS_31XX', 'OTRO_DESCUENTO', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3185', 'Otros descuentos (Art. 58)', 'DESCUENTOS', 'DESCUENTOS_31XX', 'OTRO_DESCUENTO', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3186', 'Pensiones de alimentos', 'DESCUENTOS', 'DESCUENTOS_31XX', 'OTRO_DESCUENTO', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3187', 'Descuento mujer casada (Art. 59)', 'DESCUENTOS', 'DESCUENTOS_31XX', 'OTRO_DESCUENTO', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('3188', 'Descuento por anticipos o préstamos', 'DESCUENTOS', 'DESCUENTOS_31XX', 'OTRO_DESCUENTO', FALSE, FALSE, TRUE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('4151', 'Aporte AFC - empleador', 'APORTES_EMPLEADOR', 'APORTES_41XX', 'APORTE_EMPLEADOR', FALSE, FALSE, FALSE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('4152', 'Aporte empleador seguro accidentes del trabajo y Ley SANNA (Ley 16.744)', 'APORTES_EMPLEADOR', 'APORTES_41XX', 'APORTE_EMPLEADOR', FALSE, FALSE, FALSE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('4131', 'Aporte empleador indemnización a todo evento (Art. 164)', 'APORTES_EMPLEADOR', 'APORTES_41XX', 'APORTE_EMPLEADOR', FALSE, FALSE, FALSE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('4154', 'Aporte adicional trabajo pesado - empleador', 'APORTES_EMPLEADOR', 'APORTES_41XX', 'APORTE_EMPLEADOR', FALSE, FALSE, FALSE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('4155', 'Aporte empleador seguro invalidez y sobrevivencia', 'APORTES_EMPLEADOR', 'APORTES_41XX', 'APORTE_EMPLEADOR', FALSE, FALSE, FALSE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('4157', 'Aporte empleador ahorro previsional voluntario colectivo', 'APORTES_EMPLEADOR', 'APORTES_41XX', 'APORTE_EMPLEADOR', FALSE, FALSE, FALSE, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('5201', 'Total haberes', 'TOTALES', 'TOTALES_52XX', 'TOTAL_HABERES', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('5210', 'Total haberes imponibles y tributables', 'TOTALES', 'TOTALES_52XX', 'TOTAL_HABERES', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('5220', 'Total haberes imponibles y no tributables', 'TOTALES', 'TOTALES_52XX', 'TOTAL_HABERES', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('5230', 'Total haberes no imponibles y no tributables', 'TOTALES', 'TOTALES_52XX', 'TOTAL_HABERES', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('5240', 'Total haberes no imponibles y tributables', 'TOTALES', 'TOTALES_52XX', 'TOTAL_HABERES', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('5301', 'Total descuentos', 'TOTALES', 'TOTALES_53XX', 'TOTAL_DESCUENTOS', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('5361', 'Total descuentos impuestos a las remuneraciones', 'TOTALES', 'TOTALES_53XX', 'TOTAL_DESCUENTOS', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('5362', 'Total descuentos impuestos por indemnizaciones', 'TOTALES', 'TOTALES_53XX', 'TOTAL_DESCUENTOS', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('5341', 'Total descuentos por cotizaciones del trabajador', 'TOTALES', 'TOTALES_53XX', 'TOTAL_DESCUENTOS', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('5302', 'Total otros descuentos', 'TOTALES', 'TOTALES_53XX', 'TOTAL_DESCUENTOS', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('5410', 'Total aportes empleador', 'TOTALES', 'TOTALES_54XX', 'TOTAL_APORTES', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('5501', 'Total líquido', 'TOTALES', 'TOTALES_55XX', 'TOTAL_LIQUIDO', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('5502', 'Total indemnizaciones', 'TOTALES', 'TOTALES_55XX', 'TOTAL_INDEMNIZACIONES', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('5564', 'Total indemnizaciones tributables', 'TOTALES', 'TOTALES_55XX', 'TOTAL_INDEMNIZACIONES', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.'),
    ('5565', 'Total indemnizaciones no tributables', 'TOTALES', 'TOTALES_55XX', 'TOTAL_INDEMNIZACIONES', NULL, NULL, NULL, TRUE, DATE '2022-01-01', 'Fuente: Suplemento DT LRE enero 2022. Catálogo completo de campos LRE; no todos son conceptos editables del ERP.')
ON CONFLICT (codigo_lre) DO UPDATE
SET nombre_lre = EXCLUDED.nombre_lre,
    modulo_lre = EXCLUDED.modulo_lre,
    grupo_lre = EXCLUDED.grupo_lre,
    clasificacion_lre = EXCLUDED.clasificacion_lre,
    imponible = EXCLUDED.imponible,
    tributable = EXCLUDED.tributable,
    afecta_liquido = EXCLUDED.afecta_liquido,
    vigente = EXCLUDED.vigente,
    vigencia_inicio = COALESCE(catalogo_lre.vigencia_inicio, EXCLUDED.vigencia_inicio),
    observacion = EXCLUDED.observacion;

-- Mapeos normativos base. Mantener en una sola tabla derivada para evitar
-- bloques UPDATE duplicados y dejar el motivo auditable en SQL.
WITH mapping(codigo_concepto, codigo_lre, criterio) AS (
    VALUES
        ('SUELDO_BASE', '2101', 'Sueldo base -> Sueldo.'),
        ('GRATIFICACION', '2106', 'Gratificación legal mensual -> Gratificación mensual.'),
        ('HORAS_EXTRAS', '2102', 'Horas extras -> Sobresueldo.'),
        ('BONO_RESPONSABILIDAD', '2111', 'Bono fijo mensual de responsabilidad.'),
        ('AGUINALDO', '2110', 'Aguinaldo.'),
        ('COLACION', '2301', 'Colación.'),
        ('MOVILIZACION', '2302', 'Movilización.'),
        ('ASIGNACION_FAMILIAR', '2311', 'Asignación familiar legal.'),
        ('AFP', '3141', 'Cotización obligatoria previsional AFP/IPS.'),
        ('SALUD', '3143', 'Cotización obligatoria salud 7%.'),
        ('CESANTIA', '3151', 'Cotización AFC trabajador.'),
        ('IMPUESTO_RENTA', '3161', 'Impuesto retenido por remuneraciones.'),
        ('PRESTAMO', '3188', 'Préstamo o anticipo.'),
        ('ANTICIPO', '3188', 'Préstamo o anticipo.'),
        ('DESCUENTO_CONVENIO', '3183', 'Descuento autorizado o solicitado por trabajador.'),
        ('PENSION_ALIMENTOS', '3186', 'Pensión de alimentos.'),
        ('AFC_EMPLEADOR', '4151', 'Aporte AFC empleador.'),
        ('SIS_EMPLEADOR', '4155', 'Aporte empleador SIS.')
)
UPDATE concepto c
SET id_catalogo_lre = l.id_catalogo_lre
FROM mapping m
JOIN catalogo_lre l ON l.codigo_lre = m.codigo_lre
WHERE c.codigo = m.codigo_concepto;

-- Pendientes explícitos: no limpiar ni forzar todos los conceptos sin decisión.
-- Solo se dejan sin mapeo los conceptos base cuyo código LRE puede inducir error.
WITH pendientes(codigo_concepto, motivo) AS (
    VALUES
        ('INASISTENCIA', 'La ausencia se informa por días/estado operativo del trabajador; no se fuerza a un código LRE de descuento editable.'),
        ('ZONA_EXTREMA', 'No se fuerza mapeo: 3167 corresponde a rebaja DL 889 y 2203 a gratificaciones de zona; requiere decisión normativa según política de empresa.'),
        ('AFP_EMPLEADOR', 'No existe mapeo LRE base equivalente en el suplemento enero 2022 para un aporte AFP empleador genérico; mantener pendiente hasta definir reforma/aporte específico.')
)
UPDATE concepto c
SET id_catalogo_lre = NULL
FROM pendientes p
WHERE c.codigo = p.codigo_concepto;

-- Validación operativa embebida: esta consulta debe retornar 0 filas en base sana
-- para los conceptos que sí tienen mapeo definido en esta fase.
-- SELECT m.codigo_concepto, m.codigo_lre
-- FROM mapping m
-- WHERE NOT EXISTS (
--     SELECT 1
--     FROM concepto c
--     JOIN catalogo_lre l ON l.id_catalogo_lre = c.id_catalogo_lre
--     WHERE c.codigo = m.codigo_concepto
--       AND l.codigo_lre = m.codigo_lre
-- );
