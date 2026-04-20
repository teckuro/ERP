-- Habilita el flujo "Nueva ficha de empleado" desde el cliente Supabase.
-- Permite insertar la ficha inicial y hacer rollback si una etapa posterior falla.
-- Para produccion, preferir policies por usuario/rol o una Edge Function con service role.

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

DO $$
DECLARE
  write_table text;
  write_tables text[] := ARRAY[
    'persona',
    'contrato',
    'remuneracion',
    'prevision',
    'salud_trabajador',
    'cuenta2_afp',
    'semana_corrida',
    'zona_extrema',
    'apv',
    'cuenta_bancaria',
    'contrato_centro_costo'
  ];
BEGIN
  FOREACH write_table IN ARRAY write_tables LOOP
    IF to_regclass(format('public.%I', write_table)) IS NULL THEN
      CONTINUE;
    END IF;

    EXECUTE format(
      'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO anon, authenticated',
      write_table
    );

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', write_table);

    IF NOT EXISTS (
      SELECT 1
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = write_table
        AND policyname = 'empleados_alta_select'
    ) THEN
      EXECUTE format(
        'CREATE POLICY empleados_alta_select ON public.%I FOR SELECT TO anon, authenticated USING (true)',
        write_table
      );
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = write_table
        AND policyname = 'empleados_alta_insert'
    ) THEN
      EXECUTE format(
        'CREATE POLICY empleados_alta_insert ON public.%I FOR INSERT TO anon, authenticated WITH CHECK (true)',
        write_table
      );
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = write_table
        AND policyname = 'empleados_alta_update'
    ) THEN
      EXECUTE format(
        'CREATE POLICY empleados_alta_update ON public.%I FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true)',
        write_table
      );
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = write_table
        AND policyname = 'empleados_alta_delete'
    ) THEN
      EXECUTE format(
        'CREATE POLICY empleados_alta_delete ON public.%I FOR DELETE TO anon, authenticated USING (true)',
        write_table
      );
    END IF;
  END LOOP;
END $$;
