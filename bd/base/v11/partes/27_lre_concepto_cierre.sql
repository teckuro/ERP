-- =============================================================================
-- LRE-CONCEPTO-CIERRE-01 — Alineación catálogo concepto ↔ motor ↔ LRE
--
-- Prerrequisito: 07_migracion_lre_ejecutar, 24_lre_catalogo_oficial, 25_lre_concept_rules.
-- Idempotente: INSERT ON CONFLICT + UPDATE por codigo.
-- =============================================================================
SET search_path = public;

-- Concepto BONO (motor recurrentes/novedades) → LRE 2113 variables mensuales.
INSERT INTO concepto (
    codigo, nombre, tipo, naturaleza, imponible, tributable,
    afecta_afp, afecta_salud, afecta_afc, afecta_sis, orden_impresion, calculo_automatico,
    es_sistema, afecta_liquido, vigente, codigo_motor
) VALUES (
    'BONO', 'Bono o haber variable', 'HABER', 'IMPONIBLE', TRUE, TRUE,
    TRUE, TRUE, TRUE, FALSE, 61, FALSE,
    FALSE, TRUE, TRUE, 'BONO'
)
ON CONFLICT (codigo) DO UPDATE
SET
    nombre = EXCLUDED.nombre,
    codigo_motor = COALESCE(concepto.codigo_motor, EXCLUDED.codigo_motor),
    tipo = EXCLUDED.tipo,
    naturaleza = EXCLUDED.naturaleza,
    imponible = EXCLUDED.imponible,
    tributable = EXCLUDED.tributable,
    afecta_afp = EXCLUDED.afecta_afp,
    afecta_salud = EXCLUDED.afecta_salud,
    afecta_afc = EXCLUDED.afecta_afc,
    afecta_liquido = EXCLUDED.afecta_liquido,
    vigente = EXCLUDED.vigente;

UPDATE concepto c
SET id_catalogo_lre = l.id_catalogo_lre,
    estrategia_lre = 'DIRECTO',
    requiere_exportacion_lre = TRUE
FROM catalogo_lre l
WHERE c.codigo = 'BONO' AND l.codigo_lre = '2113';

-- Variantes de código en BD (motor/legacy) → mismo catálogo LRE que HORAS_EXTRAS / IMPUESTO_RENTA.
UPDATE concepto c
SET id_catalogo_lre = l.id_catalogo_lre,
    estrategia_lre = 'DIRECTO',
    requiere_exportacion_lre = TRUE,
    codigo_motor = COALESCE(c.codigo_motor, 'HORA_EXTRA')
FROM catalogo_lre l
WHERE c.codigo = 'HORAS_EXTRA' AND l.codigo_lre = '2102';

UPDATE concepto c
SET id_catalogo_lre = l.id_catalogo_lre,
    estrategia_lre = 'DIRECTO',
    requiere_exportacion_lre = TRUE,
    codigo_motor = COALESCE(c.codigo_motor, 'IMPUESTO_UNICO')
FROM catalogo_lre l
WHERE c.codigo = 'IMPUESTO_UNICO' AND l.codigo_lre = '3161';

UPDATE concepto c
SET id_catalogo_lre = l.id_catalogo_lre,
    estrategia_lre = 'DIRECTO',
    requiere_exportacion_lre = TRUE
FROM catalogo_lre l
WHERE c.codigo IN ('HORAS_EXTRAS', 'IMPUESTO_RENTA')
  AND l.codigo_lre IN ('2102', '3161')
  AND (
    (c.codigo = 'HORAS_EXTRAS' AND l.codigo_lre = '2102')
    OR (c.codigo = 'IMPUESTO_RENTA' AND l.codigo_lre = '3161')
  );

-- Alias motor: código interno ERP vs código emitido por el motor de nómina.
WITH alias_motor(codigo_concepto, codigo_motor_emitido) AS (
    VALUES
        ('IMPUESTO_RENTA', 'IMPUESTO_UNICO'),
        ('CESANTIA', 'AFC'),
        ('HORAS_EXTRAS', 'HORA_EXTRA'),
        ('GRATIFICACION', 'GRATIFICACION_ART_50'),
        ('BONO', 'BONO'),
        ('SUELDO_BASE', 'SUELDO_BASE'),
        ('AFP', 'AFP'),
        ('SALUD', 'SALUD'),
        ('ANTICIPO', 'ANTICIPO'),
        ('MOVILIZACION', 'MOVILIZACION'),
        ('ASIGNACION_FAMILIAR', 'ASIGNACION_FAMILIAR')
)
UPDATE concepto c
SET codigo_motor = m.codigo_motor_emitido
FROM alias_motor m
WHERE c.codigo = m.codigo_concepto
  AND (c.codigo_motor IS NULL OR c.codigo_motor IS DISTINCT FROM m.codigo_motor_emitido);

-- Reafirmar estrategias LRE en pendientes normativos (idempotente con 25).
UPDATE concepto
SET
    id_catalogo_lre = NULL,
    estrategia_lre = 'DERIVA_DIAS_TRABAJADOS',
    requiere_exportacion_lre = TRUE,
    observacion_normativa_lre = 'Concepto interno: deriva dias trabajados/dias ausentes para LRE; no se declara como linea de descuento directa.'
WHERE codigo = 'INASISTENCIA';

UPDATE concepto
SET
    id_catalogo_lre = NULL,
    estrategia_lre = 'DESCOMPONER_CONCEPTO',
    requiere_exportacion_lre = TRUE,
    observacion_normativa_lre = 'Concepto ambiguo: separar en gratificacion zona legal, rebaja zona extrema DL 889 o bono zona empresa segun naturaleza.'
WHERE codigo = 'ZONA_EXTREMA';

UPDATE concepto
SET
    id_catalogo_lre = NULL,
    estrategia_lre = 'PENDIENTE_NORMATIVO',
    requiere_exportacion_lre = TRUE,
    observacion_normativa_lre = 'Concepto generico de aporte empleador. Separar en SIS, AFC, Ley 16.744/SANNA, trabajo pesado, APVC o reforma previsional segun corresponda.'
WHERE codigo = 'AFP_EMPLEADOR';

-- Validación: conceptos DIRECTO exportables sin catálogo LRE (debe retornar 0 filas salvo lista blanca).
-- SELECT codigo, estrategia_lre, requiere_exportacion_lre
-- FROM concepto
-- WHERE estrategia_lre = 'DIRECTO'
--   AND requiere_exportacion_lre = TRUE
--   AND id_catalogo_lre IS NULL
--   AND codigo NOT IN ('INASISTENCIA', 'ZONA_EXTREMA', 'AFP_EMPLEADOR');
