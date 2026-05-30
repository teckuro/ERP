-- NOM-PREP-01B: FK tardias para preparaciones/lotes.
-- Se ejecuta despues de crear calculo y liquidaciones para evitar referencias circulares.

SET search_path = public;

DO $$
BEGIN
    IF to_regclass('public.nomina_preparacion') IS NOT NULL
       AND to_regclass('public.nomina_calculo_periodo') IS NOT NULL
       AND NOT EXISTS (
            SELECT 1
            FROM pg_constraint
            WHERE conname = 'nomina_preparacion_calculo_origen_fk'
              AND conrelid = 'public.nomina_preparacion'::REGCLASS
       ) THEN
        ALTER TABLE public.nomina_preparacion
            ADD CONSTRAINT nomina_preparacion_calculo_origen_fk
            FOREIGN KEY (id_calculo_origen)
            REFERENCES public.nomina_calculo_periodo(id_calculo_periodo);
    END IF;

    IF to_regclass('public.nomina_preparacion') IS NOT NULL
       AND to_regclass('public.nomina_liquidacion_periodo') IS NOT NULL
       AND NOT EXISTS (
            SELECT 1
            FROM pg_constraint
            WHERE conname = 'nomina_preparacion_liquidacion_origen_fk'
              AND conrelid = 'public.nomina_preparacion'::REGCLASS
       ) THEN
        ALTER TABLE public.nomina_preparacion
            ADD CONSTRAINT nomina_preparacion_liquidacion_origen_fk
            FOREIGN KEY (id_liquidacion_origen)
            REFERENCES public.nomina_liquidacion_periodo(id_liquidacion_periodo);
    END IF;
END $$;
