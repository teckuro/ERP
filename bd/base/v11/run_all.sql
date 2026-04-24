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
