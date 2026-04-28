-- Ejemplo ORIENTATIVO: permisos de lectura sobre tablas consumidas por ParametrosGenerales (Angular + Supabase).
-- Ajustar esquema (public), roles (postgres, authenticated, service_role) y políticas RLS según tu proyecto.
-- Si el error es "permission denied" / RLS, revisa Policies en Supabase Dashboard o equivalente.

-- Tablas referenciadas desde listar/listarCatalogos (ver parametros-generales.repository.ts):
-- parametros_generales, afp, salud (x2), tramo_carga, tramo_impuesto, tabla_impuesto_unico,
-- parametros_legales, trabajo_pesado_parametro, reforma_previsional_parametro, ley_16744_parametros,
-- organismo_administrador_ley_16744, ccaf_entidad, institucion_apv, forma_pago_apv, afc_parametro

-- Ejemplo en Postgres (rol de aplicación ficticio):
-- GRANT USAGE ON SCHEMA public TO app_readonly;
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO app_readonly;

-- En Supabase: suele bastar con políticas RLS SELECT para el rol autenticado en cada tabla citada,
-- o usar la clave service_role solo en backend si aplica.
