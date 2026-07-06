-- NOM-PREP-02: permisos minimos RLS para preparaciones/lotes de nomina.
-- Alcance desarrollo: usuarios authenticated pueden leer, crear y actualizar.
-- No habilita DELETE directo.

SET search_path = public;

DO $$
DECLARE
    prep_table TEXT;
    prep_tables TEXT[] := ARRAY[
        'nomina_preparacion',
        'nomina_preparacion_trabajador',
        'nomina_preparacion_evento'
    ];
BEGIN
    EXECUTE 'GRANT USAGE ON SCHEMA public TO authenticated';
    EXECUTE 'GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated';

    FOREACH prep_table IN ARRAY prep_tables LOOP
        IF to_regclass(format('public.%I', prep_table)) IS NULL THEN
            CONTINUE;
        END IF;

        EXECUTE format(
            'GRANT SELECT, INSERT, UPDATE ON TABLE public.%I TO authenticated',
            prep_table
        );

        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', prep_table);

        IF NOT EXISTS (
            SELECT 1
            FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename = prep_table
              AND policyname = 'nomina_preparacion_select_authenticated'
        ) THEN
            EXECUTE format(
                'CREATE POLICY nomina_preparacion_select_authenticated ON public.%I FOR SELECT TO authenticated USING (auth.role() = ''authenticated'')',
                prep_table
            );
        END IF;

        IF NOT EXISTS (
            SELECT 1
            FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename = prep_table
              AND policyname = 'nomina_preparacion_insert_authenticated'
        ) THEN
            EXECUTE format(
                'CREATE POLICY nomina_preparacion_insert_authenticated ON public.%I FOR INSERT TO authenticated WITH CHECK (auth.role() = ''authenticated'')',
                prep_table
            );
        END IF;

        IF NOT EXISTS (
            SELECT 1
            FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename = prep_table
              AND policyname = 'nomina_preparacion_update_authenticated'
        ) THEN
            EXECUTE format(
                'CREATE POLICY nomina_preparacion_update_authenticated ON public.%I FOR UPDATE TO authenticated USING (auth.role() = ''authenticated'') WITH CHECK (auth.role() = ''authenticated'')',
                prep_table
            );
        END IF;
    END LOOP;
END $$;
