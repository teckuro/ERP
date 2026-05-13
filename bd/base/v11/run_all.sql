-- Ejecuta el esquema v6.11 por partes con psql.
-- Este archivo es un indice; cada bloque vive en partes/*.sql.
\ir partes/00_reset.sql
\ir partes/01_tipos.sql
\ir partes/02_tablas.sql
\ir partes/03_indices.sql
\ir partes/04_funciones.sql
\ir partes/05_inserts_upserts.sql
\ir partes/06_secuencias.sql
\ir partes/07_triggers.sql
\ir partes/08_seguridad_rls.sql
\ir partes/09_historial_empleado.sql
\ir partes/10_periodo_catalogos.sql
\ir partes/11_parametros_generales_ampliacion.sql
\ir partes/13_persona_paso_alta_avanzada.sql
\ir partes/15_nomina_calculo_snapshot.sql
\ir partes/16_nomina_calculo_snapshot_rls.sql
\ir partes/17_parametros_reconciliacion_cliente.sql
\ir partes/18_novedades_mensuales.sql
\ir partes/19_novedades_mensuales_rls.sql
\ir partes/20_nomina_calculo_snapshot_rpc.sql
\ir partes/21_nomina_cierre_operativo_rpc.sql
\ir partes/22_liquidaciones_oficiales.sql
\ir partes/23_liquidaciones_oficiales_rpc.sql
\ir partes/24_lre_catalogo_oficial.sql
\ir partes/25_lre_concept_rules.sql
\ir partes/26_empleados_condiciones_trabajador.sql
