# Insert

Scripts de carga de datos y UPSERTs.

- `v11/seed_v611.sql`: seed base generado desde Python. Incluye AFP, salud, IPS/Ex-Cajas, tipos de movimiento, motivos y conceptos.
- `v11/faltantes_v611.sql`: migracion/carga para una BD existente. Crea tablas faltantes v6.11, carga catalogos normativos y habilita permisos/RLS de lectura.
- `v11/bancos.sql`: migracion idempotente del catalogo ampliado de bancos para una BD existente. En una BD nueva ya queda integrado en `bd/base/v11`.

Los parametros mensuales automatizados siguen en `scripts/parametros-v611/data/parametros_mensuales_v611.sql` porque el workflow de GitHub Actions los regenera y aplica desde esa ruta.
