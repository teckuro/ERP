# Observaciones

## BD-v11-LRE-periodo-nomina

### Riesgo

**Alto.** El cambio toca esquema y datos base de BD: nuevas tablas/columnas, constraints, defaults y logica extensa de `UPSERT` idempotente. Puede afectar el manejo del estado de periodos de remuneracion y las integraciones de datos aguas abajo.

### Resumen

- Introduce soporte LRE (Libro de Remuneraciones Electronico) en esquema v11 con `catalogo_lre`.
- Expande `concepto` con metadatos de mapeo y estrategia LRE: `id_catalogo_lre`, `estrategia_lre`, flags de exportacion y observaciones normativas.
- Agrega semilla/upsert del catalogo oficial LRE y mapeos base de conceptos.
- Incluye remapeos relevantes como `HORAS_EXTRAS -> 2102`, `GRATIFICACION -> 2106` e `IMPUESTO_RENTA -> 3161`.
- Endurece el modelado de `periodo_remuneracion.estado`: default `pendiente` y constraint de estados permitidos.
- Hace `movimiento_variable_mensual` e indices asociados `IF NOT EXISTS` para re-ejecuciones mas seguras.
- Actualiza setup E2E con variables en `.env.example` para corridas Playwright autenticadas de nomina real.
- Ajusta `.gitignore` para ignorar la mayoria de `tests/`, manteniendo versionado `tests/nomina-mensual.e2e.spec.ts`.
- Amplia documentacion de ejecucion BD/README.

### Seguimiento

- Revisar aplicacion en ambientes con datos existentes antes de ejecutar scripts destructivos o monoliticos.
- Validar `periodo_remuneracion.estado` contra consumidores de Parametros, Nomina mensual, Python e integraciones externas.
- Ejecutar validaciones post-carga de `bd/base/v11/partes/90_validaciones_v11.sql` despues de aplicar scripts v11.
- Confirmar que los mapeos LRE base no sobrescriban personalizaciones de cliente sin aprobacion funcional.
