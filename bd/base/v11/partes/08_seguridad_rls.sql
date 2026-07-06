-- ============================================================
-- PERMISOS Y RLS (Supabase: anon + authenticated)
-- Mantener alineado con crear_sql_v6_11_integrada.sql si usas el monolito.
-- Ejecutar este archivo completo: el bloque de parametros debe aplicarse
-- antes que catalogos de solo lectura para tablas con escritura desde la app.
-- ============================================================
SET search_path = public;

-- ============================================
-- POST-INTEGRACION SUPABASE: RLS, PERMISOS E HISTORIAL
-- Integra:
-- - scripts/fix_catalogos_lectura_supabase.sql
-- - scripts/fix_empleados_alta_rls_supabase.sql
-- - scripts/empleados_historial_ficha.sql
-- ============================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Tablas editables desde "Parametros generales": RLS + lectura/escritura (primero).
-- No incluir estas tablas en catalog_tables (solo SELECT dejaria INSERT/UPDATE sin politica).
DO $$
DECLARE
    parametro_table TEXT;
    parametro_tables TEXT[] := ARRAY[
        'parametros_generales',
        'parametros_generales_cliente',
        'parametros_legales',
        'afc_parametro',
        'trabajo_pesado_parametro',
        'reforma_previsional_parametro'
    ];
BEGIN
    FOREACH parametro_table IN ARRAY parametro_tables LOOP
        IF to_regclass(format('public.%I', parametro_table)) IS NULL THEN
            CONTINUE;
        END IF;

        EXECUTE format(
            'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO anon, authenticated',
            parametro_table
        );

        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', parametro_table);

        IF NOT EXISTS (
            SELECT 1
            FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename = parametro_table
              AND policyname = 'parametros_select_anon_authenticated'
        ) THEN
            EXECUTE format(
                'CREATE POLICY parametros_select_anon_authenticated ON public.%I FOR SELECT TO anon, authenticated USING (true)',
                parametro_table
            );
        END IF;

        IF NOT EXISTS (
            SELECT 1
            FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename = parametro_table
              AND policyname = 'parametros_insert_anon_authenticated'
        ) THEN
            EXECUTE format(
                'CREATE POLICY parametros_insert_anon_authenticated ON public.%I FOR INSERT TO anon, authenticated WITH CHECK (true)',
                parametro_table
            );
        END IF;

        IF NOT EXISTS (
            SELECT 1
            FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename = parametro_table
              AND policyname = 'parametros_update_anon_authenticated'
        ) THEN
            EXECUTE format(
                'CREATE POLICY parametros_update_anon_authenticated ON public.%I FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true)',
                parametro_table
            );
        END IF;

        IF NOT EXISTS (
            SELECT 1
            FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename = parametro_table
              AND policyname = 'parametros_delete_anon_authenticated'
        ) THEN
            EXECUTE format(
                'CREATE POLICY parametros_delete_anon_authenticated ON public.%I FOR DELETE TO anon, authenticated USING (true)',
                parametro_table
            );
        END IF;
    END LOOP;
END $$;

DO $$
DECLARE
    catalog_table TEXT;
    catalog_tables TEXT[] := ARRAY[
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
        'entidad_previsional_ips',
        'ex_caja_previsional',
        'regimen_ex_caja',
        'periodo_remuneracion',
        'afp',
        'afp_vigencia',
        'ips_ex_caja_tasa_basica',
        'salud',
        'salud_plan',
        'moneda',
        'tramo_carga',
        'tramo_impuesto',
        'tabla_impuesto_unico',
        'institucion_apv',
        'forma_pago_apv',
        'ley_16744_parametros',
        'organismo_administrador_ley_16744',
        'ccaf_entidad',
        'banco',
        'tipo_cuenta_bancaria',
        'zona_extrema_catalogo'
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

DO $$
DECLARE
    write_table TEXT;
    write_tables TEXT[] := ARRAY[
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

-- Haberes y descuentos / conceptos LRE: mantenedor en app (anon + authenticated).
-- Misma postura que empleados_alta_* hasta existan roles JWT en politicas.
DO $$
DECLARE
    hd_table TEXT;
    hd_tables TEXT[] := ARRAY[
        'concepto',
        'haberdescuento_persona'
    ];
BEGIN
    FOREACH hd_table IN ARRAY hd_tables LOOP
        IF to_regclass(format('public.%I', hd_table)) IS NULL THEN
            CONTINUE;
        END IF;

        EXECUTE format(
            'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO anon, authenticated',
            hd_table
        );

        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', hd_table);

        IF NOT EXISTS (
            SELECT 1
            FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename = hd_table
              AND policyname = 'haberes_descuentos_select'
        ) THEN
            EXECUTE format(
                'CREATE POLICY haberes_descuentos_select ON public.%I FOR SELECT TO anon, authenticated USING (true)',
                hd_table
            );
        END IF;

        IF NOT EXISTS (
            SELECT 1
            FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename = hd_table
              AND policyname = 'haberes_descuentos_insert'
        ) THEN
            EXECUTE format(
                'CREATE POLICY haberes_descuentos_insert ON public.%I FOR INSERT TO anon, authenticated WITH CHECK (true)',
                hd_table
            );
        END IF;

        IF NOT EXISTS (
            SELECT 1
            FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename = hd_table
              AND policyname = 'haberes_descuentos_update'
        ) THEN
            EXECUTE format(
                'CREATE POLICY haberes_descuentos_update ON public.%I FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true)',
                hd_table
            );
        END IF;

        IF NOT EXISTS (
            SELECT 1
            FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename = hd_table
              AND policyname = 'haberes_descuentos_delete'
        ) THEN
            EXECUTE format(
                'CREATE POLICY haberes_descuentos_delete ON public.%I FOR DELETE TO anon, authenticated USING (true)',
                hd_table
            );
        END IF;
    END LOOP;
END $$;

-- Reglas de calculo por concepto: lectura para diagnóstico / futuras pantallas;
-- la escritura sigue siendo vía migraciones o service_role.
DO $$
DECLARE
    regla_table TEXT := 'regla_concepto_calculo';
BEGIN
    IF to_regclass(format('public.%I', regla_table)) IS NOT NULL THEN
        EXECUTE format('GRANT SELECT ON TABLE public.%I TO anon, authenticated', regla_table);
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', regla_table);

        IF NOT EXISTS (
            SELECT 1
            FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename = regla_table
              AND policyname = 'regla_concepto_calculo_select'
        ) THEN
            EXECUTE format(
                'CREATE POLICY regla_concepto_calculo_select ON public.%I FOR SELECT TO anon, authenticated USING (true)',
                regla_table
            );
        END IF;
    END IF;
END $$;

-- Vistas de solo lectura usadas por la app (sin RLS propio; aplica politicas de tablas base con security_invoker).
DO $$
DECLARE
    catalog_view TEXT;
    catalog_views TEXT[] := ARRAY[
        'vw_persona_factores'
    ];
BEGIN
    FOREACH catalog_view IN ARRAY catalog_views LOOP
        IF to_regclass(format('public.%I', catalog_view)) IS NULL THEN
            CONTINUE;
        END IF;

        EXECUTE format('GRANT SELECT ON TABLE public.%I TO anon, authenticated', catalog_view);
    END LOOP;
END $$;
