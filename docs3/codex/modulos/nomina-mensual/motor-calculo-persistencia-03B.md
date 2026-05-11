# MOTOR-03B - Persistencia controlada de snapshots preliminares

## Evidencia NOM-CIERRE-DB-APPLY-01

La aplicacion real/controlada del cierre operativo se ejecuto el 2026-05-10:

- `15_nomina_calculo_snapshot.sql`: aplicado/idempotente, con columnas `cierre_operativo_*` presentes;
- `21_nomina_cierre_operativo_rpc.sql`: aplicado, RPC `cerrar_nomina_operativa` creada/reemplazada;
- validacion BD: constraint de estado presente, RPC `SECURITY INVOKER`, `authenticated=true`, `anon=false`;
- E2E real authenticated con `E2E_NOMINA_CIERRE_REAL=1`: `npx playwright test tests/nomina-mensual.e2e.spec.ts --workers=1` OK, 1 passed / 1 skipped;
- cierre real ejecutado y recuperado desde UI/E2E;
- periodo observado: `2026-04`, snapshot activo `id_calculo_periodo=15`, aprobado operativamente y cerrado operativamente;
- duplicados activos: 0;
- `periodo_remuneracion.codigo=2026-04`: estado `cargado`, sin cambio provocado por la fase.

Pendiente funcional posterior: disenar liquidaciones oficiales desde snapshot cerrado.

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
- RPC transaccional `guardar_nomina_calculo_snapshot` para guardar/reemplazar el resultado preliminar completo sin cambios parciales.
- UI minima en `/remuneraciones/proceso-mensual` para guardar snapshot preliminar, ver activo y recalcular/reemplazar. Desde USAB-NOM-07, la UI traduce este soporte tecnico como `Guardar resultado preliminar` y `Ultimo resultado preliminar guardado`, con estado de guardado, fecha, version del calculo, identificador tecnico y advertencias asociadas. Desde USAB-NOM-08, ese resultado guardado alimenta `Revision para aprobacion`. Desde NOM-PERSIST-01, la UI permite `Aprobar resultado preliminar` y persiste esa marca operativa interna en el snapshot activo vigente. Desde NOM-SNAPSHOT-01, `Resultado guardado desde BD` consulta el detalle completo persistido sin recalcular.

## Tablas creadas por SQL local

- `nomina_calculo_periodo`
- `nomina_calculo_trabajador`
- `nomina_calculo_concepto`
- `nomina_calculo_issue`
- `nomina_calculo_trazabilidad`
- RPC: `guardar_nomina_calculo_snapshot` en `bd/base/v11/partes/20_nomina_calculo_snapshot_rpc.sql`.

Regla de activo:

- Un snapshot activo por periodo cuando no hay empresa.
- Un snapshot activo por periodo y empresa cuando `id_empresa` existe.
- Desde NOM-ATOMIC-01, el reemplazo marca el snapshot anterior como `anulado`/inactivo y referencia `reemplazado_por` dentro de la misma transaccion que crea el nuevo resultado completo.

## Servicio

Funciones expuestas:

- `guardarSnapshotPreliminar(periodo)`
- `obtenerSnapshotActivo(periodo)`
- `obtenerSnapshotCompletoActivo(periodo)`
- `obtenerSnapshotCompletoPorId(idCalculoPeriodo)`
- `listarSnapshotsPeriodo(periodo)`
- `anularSnapshotActivo(periodo, motivo)`
- `reemplazarSnapshotPreliminar(periodo)`

Reglas:

- No guarda si no existe calculo preliminar en memoria.
- No guarda si el calculo tiene bloqueos.
- No borra fisicamente snapshots anteriores.
- No cambia `periodo_remuneracion`.
- No llama acciones de liquidacion oficial, PDF, Previred, LRE ni contabilidad.
- La aprobacion operativa NOM-PERSIST-01 extiende la cabecera `nomina_calculo_periodo` con metadata formal de aprobacion operativa y no convierte el snapshot preliminar en liquidacion oficial.
- La consulta completa NOM-SNAPSHOT-01 lee cabecera, trabajadores, conceptos, issues, trazabilidad y aprobacion operativa desde BD. No invoca el motor ni reconstruye valores con parametros actuales.
- El guardado NOM-ATOMIC-01 llama `guardar_nomina_calculo_snapshot`; si falla cualquier parte del payload, no queda cabecera activa incompleta ni se desactiva el resultado anterior.
- El diagnostico NOM-SAVE-DIAG-01 confirma que `vigencia_inicio` y `vigencia_fin` de trazabilidad deben llegar a la RPC como `DATE` valido. Si el motor entrega un periodo mensual `YYYY-MM`, el payload de snapshot lo normaliza a `YYYY-MM-01`; valores no validos se envian como `null`.

## Que persiste

- Resumen por periodo.
- Trabajadores calculados.
- Conceptos derivados de haberes, descuentos, cotizaciones e impuesto.
- Issues de periodo y trabajador.
- Trazabilidad de formulas, fuentes, campos, vigencias, valores y resultados.
- Aprobacion operativa interna, si RRHH aprueba el resultado guardado: estado, fecha, usuario disponible/no disponible, advertencias y metadata de alcance.

## Consulta completa NOM-SNAPSHOT-01

El repository expone lectura completa por periodo activo y por `id_calculo_periodo`.

Incluye:

- cabecera de `nomina_calculo_periodo` con vigencia activa/reemplazada;
- trabajadores de `nomina_calculo_trabajador`;
- conceptos de `nomina_calculo_concepto`;
- observaciones de `nomina_calculo_issue`;
- trazabilidad de `nomina_calculo_trazabilidad`;
- aprobacion operativa persistida en cabecera si existe.

La UI presenta esa informacion como resultado guardado consultable. No recalcula movimientos, recurrentes, parametros ni formulas; por tanto sirve para trazabilidad de usuario final sobre lo realmente guardado.

## Guardado atomico NOM-ATOMIC-01

`NominaCalculoSnapshotRepository.guardarSnapshotPreliminar` ya no ejecuta desde el cliente una secuencia de inserts/updates para cabecera, trabajadores, conceptos, issues, trazabilidad y reemplazo.

Ahora construye un payload completo y llama una sola RPC:

`guardar_nomina_calculo_snapshot(p_periodo, p_id_empresa, p_cabecera, p_trabajadores, p_conceptos, p_observaciones, p_trazabilidad)`.

La RPC:

- valida periodo y arrays minimos;
- bloquea el resultado activo actual con `FOR UPDATE`;
- inserta la cabecera nueva inicialmente como inactiva;
- inserta trabajadores, conceptos, observaciones y trazabilidad;
- al final desactiva/anula el resultado anterior y vincula `reemplazado_por`;
- al final activa el nuevo resultado;
- devuelve `id_calculo_periodo` del nuevo resultado.

Si una insercion falla, PostgreSQL revierte toda la llamada. El usuario puede reintentar sin limpieza manual de datos parciales.

La aprobacion operativa del resultado anterior no se copia al nuevo resultado. Si el anterior se consulta por ID, conserva su aprobacion historica; el resultado activo nuevo queda pendiente de aprobacion.

## Diagnostico real NOM-SAVE-DIAG-01

Ejecucion real authenticated:

- periodo probado: `2026-04`;
- mensaje visible reproducido: `No se pudo guardar el resultado preliminar completo. No se realizaron cambios parciales.`;
- error RPC capturado: `code=22007`, `message=invalid input syntax for type date: "2026-04"`, `details=null`, `hint=null`;
- causa raiz: vigencias de trazabilidad con formato mensual `YYYY-MM` se casteaban a `DATE` dentro de `guardar_nomina_calculo_snapshot`;
- correccion aplicada: normalizacion de fechas de trazabilidad en mapper/payload TypeScript, sin cambiar SQL/RPC/RLS;
- resultado posterior: E2E real guarda, consulta snapshot completo, aprueba operativamente y recupera el estado tras recargar.

SQL post-guardado:

- snapshot activo `2026-04`: `id_calculo_periodo=11`;
- detalle activo: 2 trabajadores, 16 conceptos, 12 observaciones, 72 trazas;
- aprobacion: `aprobado_operativamente`;
- duplicados activos: 0 filas.

## Cierre documental E2E real NOM-E2E-CLOSE-01

NOM-E2E-CLOSE-01 consolida la validacion end-to-end real sobre la persistencia MOTOR-03B/NOM-ATOMIC-01:

- el usuario inicia sesion con Supabase Auth y opera como `authenticated`;
- `Preparar nomina` valida periodo `2026-04`, genera base, calcula preliminar y llama la RPC real `guardar_nomina_calculo_snapshot`;
- la consulta `Resultado guardado desde BD` lee cabecera, trabajadores, conceptos, observaciones, trazabilidad y aprobacion desde tablas `nomina_calculo_*`;
- la aprobacion operativa queda asociada al `id_calculo_periodo` activo y se recupera al recargar;
- la evidencia SQL consolidada mantiene un unico snapshot activo, sin duplicados activos.

Evidencia consolidada:

- comando: `npx playwright test tests/nomina-mensual.e2e.spec.ts --workers=1`;
- resultado: OK, 1 passed / 1 skipped;
- snapshot activo `2026-04`: `id_calculo_periodo=11`;
- detalle activo: 2 trabajadores, 16 conceptos, 12 observaciones, 72 trazas;
- aprobacion: `aprobacion_operativa_estado=aprobado_operativamente`;
- duplicados activos: 0.

No se modifican SQL, RPC, RLS, formulas legales ni motor. La validacion no convierte el snapshot preliminar en liquidacion oficial ni cierre de periodo.

## Cierre operativo NOM-CIERRE-01

NOM-CIERRE-01 implementa el cierre operativo v1 como una transicion sobre el snapshot activo aprobado.

Decision de persistencia aplicada:

- agregar columnas `cierre_operativo_*` en `nomina_calculo_periodo`;
- no crear tabla historica nueva en v1;
- no modificar `periodo_remuneracion.estado`;
- no implementar reapertura en v1;
- no bloquear por advertencias por defecto;
- cerrar mediante RPC atomica `cerrar_nomina_operativa`;
- usar como nombre visible `Cerrar nomina del periodo`.

Columnas versionadas:

```sql
cierre_operativo_estado text null,
cierre_operativo_fecha timestamptz null,
cierre_operativo_usuario_id uuid null,
cierre_operativo_usuario_label text null,
cierre_operativo_observacion text null,
cierre_operativo_metadata jsonb not null default '{}'::jsonb
```

La RPC `cerrar_nomina_operativa` valida en BD que el `id_calculo_periodo` existe, el periodo coincide, el snapshot esta activo, no fue reemplazado, esta aprobado operativamente, no esta cerrado y la sesion es `authenticated`. Falla si el snapshot no esta aprobado, ya esta cerrado, fue reemplazado, el periodo no coincide o no hay usuario authenticated.

El cierre operativo no convierte este snapshot en liquidacion oficial ni genera PDF, Previred, LRE, banco o contabilidad.

## Aplicacion y validacion BD NOM-DB-APPLY-01

La persistencia de snapshots y la RPC atomica fueron aplicadas y validadas contra la BD Supabase remota controlada configurada localmente en `.env`.

Aplicacion:

- `psql` contra `SUPABASE_DB_URL`;
- scripts aplicados: `15_nomina_calculo_snapshot.sql`, `16_nomina_calculo_snapshot_rls.sql`, `20_nomina_calculo_snapshot_rpc.sql`;
- sin ejecutar `run_all.sql` completo para evitar `00_reset.sql`.

Validaciones confirmadas:

- columnas `aprobacion_operativa_*`: 6 presentes;
- RPC `guardar_nomina_calculo_snapshot`: presente, `FUNCTION`, `SECURITY INVOKER`;
- permisos: `authenticated` con EXECUTE, `anon` sin EXECUTE, sin permiso `PUBLIC` en ACL;
- RLS habilitado en las cinco tablas `nomina_calculo_*`;
- sin duplicados activos por periodo/empresa;
- prueba transaccional con `BEGIN`/`ROLLBACK`: primer guardado OK, segundo guardado reemplaza al anterior, anterior conserva aprobacion historica, nuevo no hereda aprobacion;
- rollback validado con payload invalido; no cambio el snapshot activo ni el conteo de filas dentro de la transaccion;
- sin datos permanentes del periodo de prueba `2099-12`.

Estado posterior:

- la prueba automatizada desde `Preparar nomina` con sesion `authenticated` real queda validada y cerrada por NOM-E2E-CLOSE-01 para `2026-04`;
- para repetirla en otro ambiente se requieren nuevamente usuario/password locales, `E2E_NOMINA_REAL=1`, `E2E_NOMINA_PERIODO` y `SUPABASE_DB_URL`;
- no se uso `service_role` desde frontend ni se abrieron politicas para forzar la prueba.

## Que no persiste

- Liquidacion oficial.
- Cierre de periodo.
- Archivos oficiales.
- Snapshot definitivo contable.
- Estados `cerrado`, `enviado_previred`, `enviado_lre` o `contabilizado`.
- Cierre, liquidacion oficial o estado `aprobado_para_liquidacion`; NOM-PERSIST-01 no usa ese estado.
- Reapertura o historico avanzado de cierres; NOM-CIERRE-DESIGN-01 los deja para fase futura.

## RLS

MOTOR-03B no implementa politicas RLS detalladas. El SQL deja TODO controlado para una fase futura:

`SEG-NOMINA - RLS y permisos de snapshots de nomina`.

## Pruebas

- `proceso-mensual-snapshot.rules.spec.ts`
- `nomina-calculo-snapshot.repository.spec.ts`
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
- NOM-PERSIST-01 habilita aprobacion operativa interna persistida sobre el resultado guardado vigente, con trazabilidad visible, recuperacion al cargar periodo y desactualizacion por recalculo, sin cierre legal.
- NOM-SNAPSHOT-01 permite consultar el snapshot completo desde BD sin recalcular, mostrando trabajadores, conceptos, observaciones y trazabilidad en `Preparar nomina`.
- NOM-ATOMIC-01 migra el guardado/reemplazo a la RPC transaccional `guardar_nomina_calculo_snapshot`, con error operativo si no se puede guardar completo.
- NOM-HARD-01 confirma que esta persistencia sigue siendo preliminar: no alcanza para cierre operativo sin resolver historico avanzado y validaciones formales de cierre.

## Pendientes

- Mantener tipos Supabase sincronizados si se regenera contra el proyecto remoto.
- Definir historico avanzado de aprobaciones/resultados si se requiere auditoria extendida.
- Aplicar NOM-CIERRE-01 en BD real/controlada y validar permisos de `cerrar_nomina_operativa`.
- Definir contrato de reapertura/rectificacion antes de modificar un periodo cerrado.
- Definir RLS real por roles.
- Reemplazar confirmaciones nativas (`window.confirm`) por dialogos propios si la accion pasa a tener consecuencia formal.

## Siguiente fase recomendada

LIQ-DESIGN-01 - Diseno funcional y tecnico de liquidaciones oficiales.

## Cierre MOTOR-03C

MOTOR-03C revisa `bd/base/v11/partes/15_nomina_calculo_snapshot.sql`, confirma PK/FK contra `02_tablas.sql` e incluye la parte 15 en `bd/base/v11/run_all.sql`.

No se aplica migracion local porque el entorno no tiene `psql` ni Docker. No se aplica remoto ni se ejecuta `supabase db push` porque no hay proyecto Supabase de desarrollo confirmado para escritura. Por lo mismo, `database.types.ts` no se regenera en MOTOR-03C y el repository mantiene tipos locales encapsulados hasta aplicar la migracion en un ambiente real.


## Validacion canonica E2E 2026-05-10

El guardado atomico de snapshot fue validado desde UI real con usuario authenticated.

Evidencia consolidada:

- Periodo: `2026-04`.
- E2E: `npx playwright test tests/nomina-mensual.e2e.spec.ts --workers=1`.
- Resultado: OK, 1 passed / 1 skipped.
- Snapshot activo reportado: `id_calculo_periodo=11`.
- Trabajadores: 2.
- Conceptos: 16.
- Observaciones: 12.
- Trazas: 72.
- Aprobacion operativa: `aprobado_operativamente`.
- Duplicados activos: 0.

Correccion relevante:

- Las vigencias mensuales `YYYY-MM` enviadas en trazabilidad se normalizan a `YYYY-MM-01` antes de persistir en columnas SQL `DATE`.
- Si la fecha no es valida, se envia `null`.

No se modifico por esa correccion:

- RPC.
- RLS.
- SQL base.
- Formulas legales.
