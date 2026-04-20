-- Habilita lectura de catalogos maestros desde el cliente Supabase.
-- No concede permisos de escritura.

GRANT USAGE ON SCHEMA public TO anon, authenticated;

DO $$
DECLARE
  catalog_table text;
  catalog_tables text[] := ARRAY[
    'pais',
    'region',
    'provincia',
    'comuna',
    'ciudad',
    'empresa',
    'centro_costo',
    'sucursal',
    'departamento_empresa',
    'tipo_trabajador',
    'tipo_jornada',
    'regimen_previsional',
    'afp',
    'salud',
    'moneda',
    'tramo_carga',
    'institucion_apv',
    'forma_pago_apv',
    'banco',
    'tipo_cuenta_bancaria'
  ];
BEGIN
  FOREACH catalog_table IN ARRAY catalog_tables LOOP
    IF to_regclass(format('public.%I', catalog_table)) IS NULL THEN
      CONTINUE;
    END IF;

    EXECUTE format('GRANT SELECT ON TABLE public.%I TO anon, authenticated', catalog_table);

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', catalog_table);

    IF NOT EXISTS (
      SELECT 1
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = catalog_table
        AND policyname = 'catalogos_select_anon_authenticated'
    ) THEN
      EXECUTE format(
        'CREATE POLICY catalogos_select_anon_authenticated ON public.%I FOR SELECT TO anon, authenticated USING (true)',
        catalog_table
      );
    END IF;
  END LOOP;
END $$;
