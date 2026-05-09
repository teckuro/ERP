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
- UI minima en `/remuneraciones/proceso-mensual` para guardar snapshot preliminar, ver activo y recalcular/reemplazar. Desde USAB-NOM-07, la UI traduce este soporte tecnico como `Guardar resultado preliminar` y `Ultimo resultado preliminar guardado`, con estado de guardado, fecha, version del calculo, identificador tecnico y advertencias asociadas. Desde USAB-NOM-08, ese resultado guardado alimenta `Revision para aprobacion`. Desde USAB-NOM-09, la UI permite `Aprobar resultado preliminar` como marca operativa interna sobre el snapshot activo vigente, sin agregar persistencia formal nueva.

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
- La aprobacion operativa USAB-NOM-09 no cambia el contrato de persistencia de MOTOR-03B: no crea columnas, tablas ni migraciones y no convierte el snapshot preliminar en liquidacion oficial.

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
- Aprobacion formal persistida de RRHH; USAB-NOM-09 la deja como estado operativo UI hasta fase posterior.

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
- USAB-NOM-07 fortalece la experiencia visible: no expone `snapshot` como texto principal, no inventa version numerica incremental y aclara que el guardado reemplaza el resultado activo del periodo.
- USAB-NOM-08 agrega revision para aprobacion futura sin aprobar, cerrar periodo ni generar salidas oficiales.
- USAB-NOM-09 habilita aprobacion operativa interna en UI sobre el resultado guardado vigente, con trazabilidad visible y desactualizacion por recalculo, sin persistencia nueva ni cierre legal.
- NOM-HARD-01 confirma que esta persistencia sigue siendo preliminar: no alcanza para cierre operativo sin resolver snapshot completo, aprobacion formal persistida y reemplazo atomico.

## Pendientes

- Aplicar migracion en ambiente local/remoto controlado.
- Regenerar tipos Supabase despues de aplicar SQL.
- Endurecer reemplazo de snapshot activo con RPC, funcion SQL o mecanismo transaccional equivalente antes de depender de el para cierre.
- Definir persistencia formal de aprobacion operativa: metadata en snapshot, estado de periodo, tabla de auditoria o contrato equivalente.
- Consultar y validar snapshot completo desde BD para cierre, incluyendo trabajadores, conceptos, issues/trazabilidad y totales, no solo cabecera.
- Definir contrato de cierre/reapertura/rectificacion antes de emitir liquidaciones oficiales o salidas legales.
- Definir RLS real por roles.
- Reemplazar confirmaciones nativas (`window.confirm`) por dialogos propios si la accion pasa a tener consecuencia formal.

## Siguiente fase recomendada

MOTOR-03C - Aplicacion controlada de migracion y validacion contra Supabase local/remoto.

## Cierre MOTOR-03C

MOTOR-03C revisa `bd/base/v11/partes/15_nomina_calculo_snapshot.sql`, confirma PK/FK contra `02_tablas.sql` e incluye la parte 15 en `bd/base/v11/run_all.sql`.

No se aplica migracion local porque el entorno no tiene `psql` ni Docker. No se aplica remoto ni se ejecuta `supabase db push` porque no hay proyecto Supabase de desarrollo confirmado para escritura. Por lo mismo, `database.types.ts` no se regenera en MOTOR-03C y el repository mantiene tipos locales encapsulados hasta aplicar la migracion en un ambiente real.
