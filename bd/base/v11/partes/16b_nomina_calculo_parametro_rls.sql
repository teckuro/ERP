-- SEG-NOMINA: RLS de nomina_calculo_parametro (parametros congelados, append-only).
--
-- Modelo de escritura:
--   nomina_calculo_parametro NO es una tabla escribible libremente por el cliente.
--   Los parametros congelados solo deben escribirse dentro de guardar_nomina_calculo_snapshot.
--
-- Limitacion documentada (INSERT para authenticated):
--   guardar_nomina_calculo_snapshot corre como SECURITY INVOKER, por lo que el INSERT
--   se ejecuta con el rol del llamador (authenticated). Por eso es tecnicamente necesario
--   otorgar GRANT INSERT + politica de INSERT a authenticated. La integridad real (que la
--   fila exista, que tenga al menos un parametro y que coincidan los hashes) se sostiene con
--   validaciones server-side en guardar_nomina_calculo_snapshot y fn_aprobar_prenomina_periodo,
--   no con la RLS. Un cliente podria insertar filas sueltas, pero no podra aprobar un periodo
--   cuyos hashes no coincidan con lo congelado.
--   Mejora futura (fuera de este set): mover la insercion a SECURITY DEFINER y retirar el
--   GRANT INSERT directo de authenticated.
--
-- Se permite SELECT controlado. Se evita UPDATE y DELETE (parametros congelados inmutables).

DO $$
BEGIN
    IF to_regclass('public.nomina_calculo_parametro') IS NULL THEN
        RETURN;
    END IF;

    EXECUTE 'GRANT USAGE ON SCHEMA public TO authenticated';
    EXECUTE 'GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated';

    -- Solo SELECT e INSERT. Sin UPDATE/DELETE.
    EXECUTE 'GRANT SELECT, INSERT ON TABLE public.nomina_calculo_parametro TO authenticated';

    EXECUTE 'ALTER TABLE public.nomina_calculo_parametro ENABLE ROW LEVEL SECURITY';

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'nomina_calculo_parametro'
          AND policyname = 'nomina_calc_parametro_select_authenticated'
    ) THEN
        EXECUTE 'CREATE POLICY nomina_calc_parametro_select_authenticated ON public.nomina_calculo_parametro FOR SELECT TO authenticated USING (auth.role() = ''authenticated'')';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'nomina_calculo_parametro'
          AND policyname = 'nomina_calc_parametro_insert_authenticated'
    ) THEN
        EXECUTE 'CREATE POLICY nomina_calc_parametro_insert_authenticated ON public.nomina_calculo_parametro FOR INSERT TO authenticated WITH CHECK (auth.role() = ''authenticated'')';
    END IF;
END $$;
