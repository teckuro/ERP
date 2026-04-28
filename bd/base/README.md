## Base de datos (SQL)

### Qué ejecutar para una instalación nueva
- **Recomendado**: `v11/run_all.sql` — aplica `v11/partes/*.sql` en orden (mejor para mantenimiento y revisiones).
- **Alternativa**: `v11/crear_sql_v6_11_integrada.sql` — monolito equivalente; usar solo si necesitas un solo archivo; al cambiar el esquema, el flujo sano es editar `partes/` y regenerar el monolito si aplica.

### Carpetas
- **`patches/`**: parches puntuales (estructura/funciones)
- **`historico/`**: versiones antiguas (no usar en instalaciones nuevas)

### Nota rápida
Para levantar una BD desde cero, partir por `v11/run_all.sql`.
