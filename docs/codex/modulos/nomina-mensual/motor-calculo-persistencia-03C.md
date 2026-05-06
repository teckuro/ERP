# MOTOR-03C - Aplicacion controlada de migracion y validacion contra Supabase

## Objetivo

Validar la migracion local de snapshots preliminares de nomina mensual y dejar documentado el camino de aplicacion contra Supabase local o remoto de desarrollo.

MOTOR-03C no convierte el snapshot en liquidacion oficial, no cierra periodo, no genera PDF, Previred, LRE ni contabilidad.

## Ambiente revisado

- Repositorio local Windows.
- `psql`: no instalado.
- `docker`: no instalado.
- Supabase CLI: disponible via `node_modules/.bin/supabase.cmd` version `2.91.2`.
- No se aplico migracion local porque no hay PostgreSQL/Supabase local disponible.
- No se aplico migracion remota porque no se confirmo un proyecto Supabase de desarrollo para escribir contra el remoto.

## SQL validado

Archivo:

- `bd/base/v11/partes/15_nomina_calculo_snapshot.sql`

Tablas definidas:

- `nomina_calculo_periodo`
- `nomina_calculo_trabajador`
- `nomina_calculo_concepto`
- `nomina_calculo_issue`
- `nomina_calculo_trazabilidad`

Validaciones realizadas:

- Sintaxis revisada por lectura tecnica PostgreSQL.
- PK/FK revisadas contra `bd/base/v11/partes/02_tablas.sql`.
- `empresa(id_empresa)`, `persona(id_persona)` y `concepto(id_concepto)` existen en el esquema v11.
- Indices de consulta y unique parcial de snapshot activo revisados.
- `JSONB`, timestamps, checks de estado/origen/severidad y campos nullable quedan alineados al contrato MOTOR-03A/MOTOR-03B.
- RLS detallado queda como TODO para `SEG-NOMINA - RLS y permisos de snapshots de nomina`.

## Inclusion en flujo v11

`bd/base/v11/run_all.sql` incluye ahora:

```sql
\ir partes/15_nomina_calculo_snapshot.sql
```

La parte 15 queda despues de tablas base, indices, triggers y ampliaciones v11. No duplica `14_movimiento_variable_mensual.sql`, que sigue siendo incremental para bases antiguas cuando el bloque ya vive en `02_tablas.sql`.

## Aplicacion controlada

No aplicada local:

- Falta `psql`.
- Falta Docker/Supabase local.

No aplicada remota:

- No se ejecuto `supabase db push`.
- No se ejecuto SQL en dashboard remoto.
- No se tocaron datos ni esquema remoto.

Comando recomendado para una fase controlada con base local:

```powershell
psql "$env:SUPABASE_DB_URL_LOCAL" -v ON_ERROR_STOP=1 -f bd/base/v11/partes/15_nomina_calculo_snapshot.sql
```

Comando recomendado para tipos despues de aplicar la migracion en el ambiente elegido:

```powershell
npm run types:supabase
```

El script real del repo escribe en:

- `src/app/core/models/database.types.ts`

## Tipos Supabase

No se regeneraron tipos en MOTOR-03C porque la migracion no fue aplicada a un ambiente consultable.

Hasta que las tablas existan en el proyecto Supabase usado para generacion, el repository mantiene una capa local/encapsulada para inserts/selects de snapshot.

Tablas esperadas en tipos despues de aplicar y regenerar:

- `nomina_calculo_periodo`
- `nomina_calculo_trabajador`
- `nomina_calculo_concepto`
- `nomina_calculo_issue`
- `nomina_calculo_trazabilidad`

## Repository y servicio

`NominaCalculoSnapshotRepository` se mantiene sin ajuste funcional en MOTOR-03C.

Justificacion:

- Las tablas todavia no existen en `database.types.ts`.
- El acceso queda encapsulado en un repository especifico.
- El cambio a tipos generados debe hacerse despues de aplicar la migracion y regenerar tipos contra el esquema real.

`ProcesoMensualService` mantiene el flujo MOTOR-03B:

- guardar snapshot preliminar;
- obtener snapshot activo;
- listar snapshots por periodo;
- anular snapshot activo;
- recalcular y reemplazar.

## Pruebas de persistencia

No se ejecutaron pruebas contra una BD real porque no hubo aplicacion local/remota.

La cobertura vigente sigue siendo por reglas, mapping, repository mockeado, service y UI:

- guardar payload preliminar;
- consultar snapshot activo;
- reemplazar snapshot activo;
- conservar historico sin borrado fisico;
- no cerrar periodo;
- no generar liquidacion oficial, PDF, Previred, LRE ni contabilidad.

## Reglas DB-01

El SQL de MOTOR-03C no usa como fuentes reales:

- `empresa_mutual_config`
- `afp_parametro`
- `salud_vigencia`
- `afc_vigencia`
- `mutual_vigencia`
- `asignacion_familiar_tramo`
- `sis_parametro`
- `sanna_parametro`
- `topes_imponibles`

Las nuevas tablas son de snapshot de calculo y no reemplazan tablas canonicas normativas.

## Fuera de alcance

- Liquidacion oficial.
- Cierre de periodo.
- PDF.
- Previred.
- LRE.
- Contabilidad.
- Finiquitos.
- Reliquidaciones.
- RLS completa.
- Politicas avanzadas.
- Rectificaciones.
- Exportaciones oficiales.
- Aplicacion remota sin ambiente de desarrollo confirmado.

## Pendientes

- Aplicar la parte 15 contra Supabase local o proyecto remoto de desarrollo.
- Regenerar `src/app/core/models/database.types.ts`.
- Confirmar las cinco tablas en tipos generados.
- Ajustar repository para usar tipos generados si la inferencia queda simple.
- Ejecutar prueba real de guardar, consultar y reemplazar snapshot con limpieza de datos.
- Definir RLS y permisos en `SEG-NOMINA`.

## Siguiente fase recomendada

SEG-NOMINA - RLS y permisos de snapshots de nomina.
