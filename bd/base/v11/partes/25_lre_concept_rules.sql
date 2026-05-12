-- =============================================================================
-- LRE-CONCEPT-RULES-01 - Estrategia LRE para conceptos no directos
--
-- Alcance:
-- - Complementa id_catalogo_lre con una estrategia explicita frente al LRE.
-- - Evita forzar codigos LRE incorrectos para conceptos derivados o ambiguos.
-- - Resuelve INASISTENCIA, ZONA_EXTREMA y AFP_EMPLEADOR como conceptos no directos.
-- - No crea exportador LRE, no recalcula nomina y no cambia formulas legales.
-- =============================================================================
SET search_path = public;

ALTER TABLE concepto
    ADD COLUMN IF NOT EXISTS estrategia_lre VARCHAR(40) NOT NULL DEFAULT 'DIRECTO';

ALTER TABLE concepto
    ADD COLUMN IF NOT EXISTS requiere_exportacion_lre BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE concepto
    ADD COLUMN IF NOT EXISTS observacion_normativa_lre TEXT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_concepto_estrategia_lre'
    ) THEN
        ALTER TABLE concepto
            ADD CONSTRAINT chk_concepto_estrategia_lre CHECK (
                estrategia_lre IN (
                    'DIRECTO',
                    'DERIVA_DIAS_TRABAJADOS',
                    'DERIVA_REBAJA_TRIBUTARIA',
                    'DESCOMPONER_CONCEPTO',
                    'PENDIENTE_NORMATIVO',
                    'NO_EXPORTABLE'
                )
            );
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_concepto_estrategia_lre
    ON concepto (estrategia_lre);

CREATE INDEX IF NOT EXISTS idx_concepto_requiere_exportacion_lre
    ON concepto (requiere_exportacion_lre);

-- Los conceptos que ya tienen codigo directo quedan como DIRECTO por defecto.
UPDATE concepto
SET
    estrategia_lre = 'DIRECTO',
    requiere_exportacion_lre = TRUE,
    observacion_normativa_lre = NULL
WHERE id_catalogo_lre IS NOT NULL
  AND estrategia_lre IS DISTINCT FROM 'DIRECTO';

-- Concepto interno: la ausencia no se declara como linea LRE directa; deriva datos
-- de dias trabajados/dias ausentes que debera resolver el exportador futuro.
UPDATE concepto
SET
    id_catalogo_lre = NULL,
    estrategia_lre = 'DERIVA_DIAS_TRABAJADOS',
    requiere_exportacion_lre = TRUE,
    observacion_normativa_lre = 'Concepto interno: deriva dias trabajados/dias ausentes para LRE; no se declara como linea de descuento directa.'
WHERE codigo = 'INASISTENCIA';

-- Concepto ambiguo: puede ser gratificacion de zona, rebaja tributaria DL 889 o
-- bono empresa. No se fuerza un codigo unico hasta separar la naturaleza.
UPDATE concepto
SET
    id_catalogo_lre = NULL,
    estrategia_lre = 'DESCOMPONER_CONCEPTO',
    requiere_exportacion_lre = TRUE,
    observacion_normativa_lre = 'Concepto ambiguo: separar en gratificacion zona legal, rebaja zona extrema DL 889 o bono zona empresa segun naturaleza.'
WHERE codigo = 'ZONA_EXTREMA';

-- Concepto generico: no representa un aporte LRE final. Debe separarse en SIS,
-- AFC, Ley 16.744/SANNA, trabajo pesado, APVC o reforma previsional empleador.
UPDATE concepto
SET
    id_catalogo_lre = NULL,
    estrategia_lre = 'PENDIENTE_NORMATIVO',
    requiere_exportacion_lre = TRUE,
    observacion_normativa_lre = 'Concepto generico de aporte empleador. Separar en SIS, AFC, Ley 16.744/SANNA, trabajo pesado, APVC o reforma previsional segun corresponda.'
WHERE codigo = 'AFP_EMPLEADOR';

-- Nota de diseno:
-- Concepto sin id_catalogo_lre no siempre es error. Es error solo si
-- estrategia_lre = DIRECTO y requiere_exportacion_lre = TRUE.
