# MOTOR-03B - Persistencia controlada de snapshots preliminares

## Objetivo

Permitir guardar, consultar y reemplazar snapshots preliminares del calculo de nomina mensual generado por MOTOR-01/MOTOR-02.

El snapshot persistido no es liquidacion oficial, no cierra periodo, no genera PDF, Previred, LRE ni contabilidad.

## Alcance

- SQL local incremental en `bd/base/v11/partes/15_nomina_calculo_snapshot.sql`.
- Tablas preliminares de snapshot: cabecera, trabajador, conceptos, issues y trazabilidad.
- Mapping puro desde `MotorCalculoPeriodoResultado` a payload persistible.
- Hash deterministico simple para detectar diferencias entre recalculos; no es firma criptografica ni control de seguridad.
- Repository Supabase encapsulado con tipos locales porque las tablas nuevas aun no estan en `database.types.ts`.
- Servicio `ProcesoMensualService` con guardar, consultar, listar, anular y recalcular/reemplazar snapshot.
- UI minima en `/remuneraciones/proceso-mensual` para guardar snapshot preliminar, ver activo y recalcular/reemplazar.

## Tablas creadas por SQL local

- `nomina_calculo_periodo`
- `nomina_calculo_trabajador`
- `nomina_calculo_concepto`
- `nomina_calculo_issue`
- `nomina_calculo_trazabilidad`

Regla de activo:

- Un snapshot activo por periodo cuando no hay empresa.
- Un snapshot activo por periodo y empresa cuando `id_empresa` existe.
- El reemplazo marca el snapshot anterior como `anulado`/inactivo y referencia `reemplazado_por`.

## Servicio

Funciones expuestas:

- `guardarSnapshotPreliminar(periodo)`
- `obtenerSnapshotActivo(periodo)`
- `listarSnapshotsPeriodo(periodo)`
- `anularSnapshotActivo(periodo, motivo)`
- `reemplazarSnapshotPreliminar(periodo)`

Reglas:

- No guarda si no existe calculo preliminar en memoria.
- No guarda si el calculo tiene bloqueos.
- No borra fisicamente snapshots anteriores.
- No cambia `periodo_remuneracion`.
- No llama acciones de liquidacion oficial, PDF, Previred, LRE ni contabilidad.

## Que persiste

- Resumen por periodo.
- Trabajadores calculados.
- Conceptos derivados de haberes, descuentos, cotizaciones e impuesto.
- Issues de periodo y trabajador.
- Trazabilidad de formulas, fuentes, campos, vigencias, valores y resultados.

## Que no persiste

- Liquidacion oficial.
- Cierre de periodo.
- Archivos oficiales.
- Snapshot definitivo contable.
- Estados `cerrado`, `enviado_previred`, `enviado_lre` o `contabilizado`.

## RLS

MOTOR-03B no implementa politicas RLS detalladas. El SQL deja TODO controlado para una fase futura:

`SEG-NOMINA - RLS y permisos de snapshots de nomina`.

## Pruebas

- `proceso-mensual-snapshot.rules.spec.ts`
- `proceso-mensual.service.spec.ts`
- `proceso-mensual-container.spec.ts`

Casos cubiertos:

- No guardar sin calculo.
- No guardar con bloqueos.
- Mapping de cabecera, trabajador, conceptos, issues y trazabilidad.
- Hash cambia si cambian montos.
- Estado no cerrado.
- UI guarda snapshot preliminar.

## Pendientes

- Aplicar migracion en ambiente local/remoto controlado.
- Regenerar tipos Supabase despues de aplicar SQL.
- Endurecer transaccion de reemplazo con RPC o funcion SQL si se requiere atomicidad.
- Definir RLS real por roles.
- Consultar detalle completo del snapshot activo desde BD, no solo cabecera.

## Siguiente fase recomendada

MOTOR-03C - Aplicacion controlada de migracion y validacion contra Supabase local/remoto.

## Cierre MOTOR-03C

MOTOR-03C revisa `bd/base/v11/partes/15_nomina_calculo_snapshot.sql`, confirma PK/FK contra `02_tablas.sql` e incluye la parte 15 en `bd/base/v11/run_all.sql`.

No se aplica migracion local porque el entorno no tiene `psql` ni Docker. No se aplica remoto ni se ejecuta `supabase db push` porque no hay proyecto Supabase de desarrollo confirmado para escritura. Por lo mismo, `database.types.ts` no se regenera en MOTOR-03C y el repository mantiene tipos locales encapsulados hasta aplicar la migracion en un ambiente real.
