-- SEG-NOV-02: permisos minimos RLS para novedades mensuales canonicas.
-- Alcance desarrollo: usuarios Supabase authenticated pueden leer, insertar y actualizar.
-- No habilita DELETE directo; el flujo funcional usa anulacion logica por estado.
-- No cambia estructura de tabla, motor, liquidaciones, cierre, Previred ni LRE.

DO $$
DECLARE
    novedades_table TEXT := 'novedad_remuneracion_periodo';
BEGIN
    IF to_regclass(format('public.%I', novedades_table)) IS NULL THEN
        RETURN;
    END IF;

    EXECUTE 'GRANT USAGE ON SCHEMA public TO authenticated';
    EXECUTE 'GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated';

    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon', novedades_table);
    EXECUTE format('REVOKE DELETE ON TABLE public.%I FROM authenticated', novedades_table);

    EXECUTE format(
        'GRANT SELECT, INSERT, UPDATE ON TABLE public.%I TO authenticated',
        novedades_table
    );

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', novedades_table);

    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = novedades_table
          AND policyname = 'novedades_mensuales_select_authenticated'
    ) THEN
        EXECUTE format(
            'CREATE POLICY novedades_mensuales_select_authenticated ON public.%I FOR SELECT TO authenticated USING (auth.role() = ''authenticated'')',
            novedades_table
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = novedades_table
          AND policyname = 'novedades_mensuales_insert_authenticated'
    ) THEN
        EXECUTE format(
            'CREATE POLICY novedades_mensuales_insert_authenticated ON public.%I FOR INSERT TO authenticated WITH CHECK (auth.role() = ''authenticated'')',
            novedades_table
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = novedades_table
          AND policyname = 'novedades_mensuales_update_authenticated'
    ) THEN
        EXECUTE format(
            'CREATE POLICY novedades_mensuales_update_authenticated ON public.%I FOR UPDATE TO authenticated USING (auth.role() = ''authenticated'') WITH CHECK (auth.role() = ''authenticated'')',
            novedades_table
        );
    END IF;
END $$;
