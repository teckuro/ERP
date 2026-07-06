-- =============================================================================
-- LRE-CONCEPTO-CANONICO-01 — Normalizar códigos ERP canónicos y alias motor
--
-- Corrige BD legacy con HORAS_EXTRA / IMPUESTO_UNICO como código de concepto.
-- Prerrequisito: 24, 25, 27. Idempotente.
-- =============================================================================
SET search_path = public;

-- Renombrar variantes legacy → códigos canónicos del ERP (FK por id_concepto, no por codigo).
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM concepto WHERE codigo = 'HORAS_EXTRA')
       AND NOT EXISTS (SELECT 1 FROM concepto WHERE codigo = 'HORAS_EXTRAS') THEN
        UPDATE concepto SET codigo = 'HORAS_EXTRAS' WHERE codigo = 'HORAS_EXTRA';
    END IF;

    IF EXISTS (SELECT 1 FROM concepto WHERE codigo = 'IMPUESTO_UNICO')
       AND NOT EXISTS (SELECT 1 FROM concepto WHERE codigo = 'IMPUESTO_RENTA') THEN
        UPDATE concepto SET codigo = 'IMPUESTO_RENTA' WHERE codigo = 'IMPUESTO_UNICO';
    END IF;
END $$;

-- Alta canónica si faltan (mismo bloque que 05_inserts_upserts).
INSERT INTO concepto (
    codigo, nombre, tipo, naturaleza, imponible, tributable,
    afecta_afp, afecta_salud, afecta_afc, afecta_sis, orden_impresion, calculo_automatico,
    es_sistema, afecta_liquido, vigente
) VALUES
    ('HORAS_EXTRAS', 'Horas extras', 'HABER', 'IMPONIBLE', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, 30, TRUE, TRUE, TRUE, TRUE),
    ('IMPUESTO_RENTA', 'Impuesto a la renta', 'DESCUENTO', 'NO_IMPONIBLE', FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 55, TRUE, TRUE, TRUE, TRUE)
ON CONFLICT (codigo) DO NOTHING;

-- Mapeo LRE + estrategia DIRECTO.
UPDATE concepto c
SET id_catalogo_lre = l.id_catalogo_lre,
    estrategia_lre = 'DIRECTO',
    requiere_exportacion_lre = TRUE
FROM catalogo_lre l
WHERE c.codigo = 'HORAS_EXTRAS' AND l.codigo_lre = '2102';

UPDATE concepto c
SET id_catalogo_lre = l.id_catalogo_lre,
    estrategia_lre = 'DIRECTO',
    requiere_exportacion_lre = TRUE
FROM catalogo_lre l
WHERE c.codigo = 'IMPUESTO_RENTA' AND l.codigo_lre = '3161';

-- Alias motor (sobrescribe valores incorrectos legacy).
UPDATE concepto SET codigo_motor = 'HORA_EXTRA' WHERE codigo = 'HORAS_EXTRAS';
UPDATE concepto SET codigo_motor = 'IMPUESTO_UNICO' WHERE codigo = 'IMPUESTO_RENTA';
UPDATE concepto SET codigo_motor = 'AFC' WHERE codigo = 'CESANTIA';
UPDATE concepto SET codigo_motor = 'GRATIFICACION_ART_50' WHERE codigo = 'GRATIFICACION';

-- Desactivar duplicados legacy si coexistieran tras rename parcial.
UPDATE concepto SET vigente = FALSE
WHERE codigo IN ('HORAS_EXTRA', 'IMPUESTO_UNICO')
  AND EXISTS (SELECT 1 FROM concepto c2 WHERE c2.codigo IN ('HORAS_EXTRAS', 'IMPUESTO_RENTA') AND c2.vigente);

-- Backfill codigo_lre_snapshot en snapshots activos sin LRE (materialización liquidaciones).
UPDATE nomina_calculo_concepto cc
SET codigo_lre_snapshot = l.codigo_lre
FROM concepto co
JOIN catalogo_lre l ON l.id_catalogo_lre = co.id_catalogo_lre
WHERE cc.id_concepto = co.id_concepto
  AND COALESCE(TRIM(cc.codigo_lre_snapshot), '') = ''
  AND l.codigo_lre IS NOT NULL;

-- Impuesto único / cotizaciones por nombre cuando id_concepto es nulo.
UPDATE nomina_calculo_concepto cc
SET codigo_lre_snapshot = v.codigo_lre
FROM (VALUES
    ('Cotizacion AFP trabajador', '3141'),
    ('Cotizacion salud Fonasa', '3143'),
    ('Cotizacion salud Isapre', '3143'),
    ('Seguro de cesantia trabajador', '3151'),
    ('Impuesto unico', '3161'),
    ('Impuesto único', '3161'),
    ('Sueldo base', '2101'),
    ('Gratificacion legal art. 50', '2106'),
    ('Gratificación legal art. 50', '2106')
) AS v(nombre, codigo_lre)
WHERE COALESCE(TRIM(cc.codigo_lre_snapshot), '') = ''
  AND lower(trim(cc.nombre_concepto_snapshot)) = lower(trim(v.nombre));

-- F15 generar_liquidaciones_nomina no materializa líneas: backfill desde snapshot activo.
DELETE FROM nomina_liquidacion_concepto lc
USING nomina_liquidacion_trabajador lt, nomina_liquidacion_periodo lp
WHERE lc.id_liquidacion_trabajador = lt.id_liquidacion_trabajador
  AND lt.id_liquidacion_periodo = lp.id_liquidacion_periodo
  AND lp.activo = TRUE;

INSERT INTO nomina_liquidacion_concepto (
    id_liquidacion_trabajador,
    id_concepto,
    codigo,
    codigo_lre,
    nombre,
    tipo,
    clasificacion,
    monto,
    orden,
    metadata
)
SELECT
    lt.id_liquidacion_trabajador,
    cc.id_concepto,
    co.codigo,
    COALESCE(NULLIF(TRIM(cc.codigo_lre_snapshot), ''), cat.codigo_lre),
    cc.nombre_concepto_snapshot,
    cc.tipo,
    CASE
        WHEN cc.tipo = 'haber' AND cc.imponible AND cc.tributable THEN 'haber_imponible_tributable'
        WHEN cc.tipo = 'haber' AND cc.imponible THEN 'haber_imponible'
        WHEN cc.tipo = 'haber' THEN 'haber_no_imponible'
        WHEN cc.tipo = 'descuento' THEN 'descuento'
        WHEN cc.tipo = 'cotizacion' THEN 'aporte_referencia'
        WHEN cc.tipo = 'impuesto' THEN 'impuesto'
        ELSE NULL
    END,
    cc.monto,
    ROW_NUMBER() OVER (
        PARTITION BY lt.id_liquidacion_trabajador
        ORDER BY cc.id_calculo_concepto
    )::INT,
    jsonb_build_object(
        'idCalculoConcepto', cc.id_calculo_concepto,
        'origen', cc.origen,
        'backfill', '28_lre_concepto_canonico'
    )
FROM nomina_calculo_concepto cc
JOIN nomina_calculo_trabajador ct ON ct.id_calculo_trabajador = cc.id_calculo_trabajador
JOIN nomina_liquidacion_trabajador lt
  ON lt.id_calculo_periodo = ct.id_calculo_periodo
 AND lt.id_persona = ct.id_persona
JOIN nomina_liquidacion_periodo lp ON lp.id_liquidacion_periodo = lt.id_liquidacion_periodo
LEFT JOIN concepto co ON co.id_concepto = cc.id_concepto
LEFT JOIN catalogo_lre cat ON cat.id_catalogo_lre = co.id_catalogo_lre
WHERE lp.activo = TRUE
  AND cc.monto <> 0;
