-- SEG-NOMINA: permisos minimos RLS para snapshots preliminares de nomina.
-- Alcance desarrollo: usuarios Supabase authenticated pueden leer, insertar y actualizar.
-- No habilita DELETE, cierre de periodo, liquidacion oficial, PDF, Previred, LRE ni contabilidad.

DO $$
DECLARE
    snapshot_table TEXT;
    snapshot_tables TEXT[] := ARRAY[
        'nomina_calculo_periodo',
        'nomina_calculo_trabajador',
        'nomina_calculo_concepto',
        'nomina_calculo_issue',
        'nomina_calculo_trazabilidad'
    ];
BEGIN
    EXECUTE 'GRANT USAGE ON SCHEMA public TO authenticated';
    EXECUTE 'GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated';

    FOREACH snapshot_table IN ARRAY snapshot_tables LOOP
        IF to_regclass(format('public.%I', snapshot_table)) IS NULL THEN
            CONTINUE;
        END IF;

        EXECUTE format(
            'GRANT SELECT, INSERT, UPDATE ON TABLE public.%I TO authenticated',
            snapshot_table
        );

        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', snapshot_table);

        IF NOT EXISTS (
            SELECT 1
            FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename = snapshot_table
              AND policyname = 'nomina_snapshot_select_authenticated'
        ) THEN
            EXECUTE format(
                'CREATE POLICY nomina_snapshot_select_authenticated ON public.%I FOR SELECT TO authenticated USING (auth.role() = ''authenticated'')',
                snapshot_table
            );
        END IF;

        IF NOT EXISTS (
            SELECT 1
            FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename = snapshot_table
              AND policyname = 'nomina_snapshot_insert_authenticated'
        ) THEN
            EXECUTE format(
                'CREATE POLICY nomina_snapshot_insert_authenticated ON public.%I FOR INSERT TO authenticated WITH CHECK (auth.role() = ''authenticated'')',
                snapshot_table
            );
        END IF;

        IF NOT EXISTS (
            SELECT 1
            FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename = snapshot_table
              AND policyname = 'nomina_snapshot_update_authenticated'
        ) THEN
            EXECUTE format(
                'CREATE POLICY nomina_snapshot_update_authenticated ON public.%I FOR UPDATE TO authenticated USING (auth.role() = ''authenticated'') WITH CHECK (auth.role() = ''authenticated'')',
                snapshot_table
            );
        END IF;
    END LOOP;
END $$;
