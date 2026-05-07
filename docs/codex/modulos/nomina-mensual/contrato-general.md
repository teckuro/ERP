# Nomina mensual (Chile) - contrato general

## 1. Objetivo del modulo

Guiar el **proceso mensual** por periodo `YYYY-MM`: revisar prerequisitos (parametros, trabajadores, conceptos, recurrentes, movimientos variables), construir pre-nomina y ejecutar un calculo base preliminar. En la version actual no genera liquidaciones oficiales, snapshots definitivos, cierre, Previred, LRE ni PDF.

La arquitectura funcional completa de remuneraciones queda definida en [`arquitectura-funcional-remuneraciones.md`](./arquitectura-funcional-remuneraciones.md) (NOM-00). Ese documento fija la separacion entre Maestros RRHH, Parametros, Conceptos, Haberes/descuentos recurrentes, Novedades mensuales, Proceso mensual, Motor, Liquidacion, Previred/LRE y Reportes.

El modelo documental de **Novedades mensuales** queda definido en [`novedades-mensuales.md`](./novedades-mensuales.md) (NOM-01). NOM-01B agrega la tabla base `novedad_remuneracion_periodo` para hechos del periodo, sin UI ni motor. NOM-01C agrega la capa Angular base de modelos, mapper, repository, service y reglas puras, sin pantalla final ni integracion al motor. El nombre tecnico historico puede aparecer como movimientos variables, pero para RRHH el nombre funcional principal es Novedades mensuales.

## 2. Alcance actual (cerrado en 9.5A + 9.5B + 9.5C + MOTOR-01 + MOTOR-02 + MOTOR-03A + MOTOR-03B + MOTOR-03C)

- Pantalla **Proceso mensual** bajo `/remuneraciones/proceso-mensual`.
- **Prevalidaciones** orquestadas por `ProcesoMensualService` con reglas puras en `proceso-mensual-prevalidacion.rules.ts`, grupos minimos en `proceso-mensual-parametros-minimos.rules.ts` y conteos de recurrentes en `proceso-mensual-recurrentes.rules.ts`.
- **Pre-nomina funcional por periodo** construida desde la prevalidacion con `proceso-mensual-prenomina.rules.ts`; consolida conteos y trazabilidad, pero no calcula montos.
- **Calculo preliminar MOTOR-01/MOTOR-02** con `proceso-mensual-motor.rules.ts`; calcula sueldo base, haberes recurrentes, gratificacion controlada, bases con topes disponibles, cotizaciones basicas, impuesto unico con tabla, asignacion familiar simple, liquido preliminar, issues y trazabilidad.
- **Contrato de persistencia MOTOR-03A** documental: define snapshot preliminar, estados, tablas candidatas, hash, version de motor y reglas de recalculo/reemplazo; no implementa escritura.
- **Persistencia controlada MOTOR-03B**: agrega SQL local versionable, mapping, hash deterministico simple, repository y servicio para guardar/consultar/reemplazar snapshots preliminares sin liquidacion oficial ni cierre.
- **Aplicacion controlada MOTOR-03C**: valida el SQL de snapshots, confirma PK/FK contra v11, incluye la parte 15 en `run_all.sql` y deja tipos Supabase pendientes hasta aplicar la migracion en un ambiente confirmado.
- UI en `features/nomina-mensual/containers/proceso-mensual-container/`; pagina de ruta solo wrapper (`frontend-interfaces`).
- Selector de periodo y acciones **Validar periodo** / **Generar pre-nomina** / **Calcular preliminar** / **Guardar snapshot preliminar**; muestra estado global, bloqueos, advertencias, informaciones, filas por area, resumen de calculo, snapshot activo y tabla simple por trabajador.

## 3. Fuera de alcance (explicito)

- Liquidacion oficial, snapshot definitivo contable y cierre productivo.
- Aplicacion remota de migraciones, RLS detallado y permisos por rol quedan para MOTOR-03C/SEG-NOMINA o fases posteriores.
- Gratificacion por 30% de utilidades, reliquidacion anual, proporcionalidad compleja por dias y ausencias avanzadas.
- Liquidaciones productivas, snapshots, cierre contable.
- Generacion Previred, LRE, archivos bancarios.
- Bloqueo duro de periodo en BD, aprobaciones, roles/JWT/RLS.
- Rediseno visual integral (fase UX-FINAL aparte).

## 4. Relacion con parametros

Lectura via `ParametrosGeneralesService`: `obtenerUltimoHastaPeriodo(periodo)`, `obtenerPeriodoRemuneracion(periodo)` y `listarCatalogos(periodo)` para clasificar grupos minimos. La UI **no** muestra UF, UTM, topes ni sueldos; muestra estado de prerequisitos y, tras validar, grupos como `mensuales_uf_utm_sueldo=OK` (clasificacion textual, sin valores). Detalle en `prevalidaciones-9-5A.md` y `prevalidaciones-9-5B.md`.

## 5. Relacion con empleados

Conteo de trabajadores **activos** con `aptoParaRemuneraciones` via `EmpleadosService.listar()` (sin conteos demo inventados).

## 6. Relacion con conceptos

Lectura del mantenimiento de conceptos via `HaberesDescuentosService.listarConceptosMantenimiento()` para existencia de catalogo y aviso de clasificacion incompleta para un motor futuro (sin modificar reglas de conceptos).

## 7. Relacion con haberes recurrentes

`HaberesDescuentosService.listarAsignacionesParaPrevalidacionMensual(periodo)` alimenta conteos y bloqueos: lectura en error o **vigencias invalidas** en el universo consultado implica **BLOQUEO**. Cerradas y fuera del mes se excluyen de aplicables al periodo. Contrato fino: `prevalidaciones-9-5B.md` y modulo Haberes (`listarTodasAsignacionesConConcepto`).

## 8. Relacion con novedades mensuales / movimientos variables

`MovimientosVariablesService.listarPorPeriodo(periodo)` alimenta conteos por estado en la implementacion actual. Funcionalmente, esas entradas corresponden a **Novedades mensuales**: hechos del periodo que no son recurrentes, no son conceptos y no calculan por si solos. Reglas actuales: `VALIDADO` no bloquea; `BORRADOR` -> advertencia; `OBSERVADO`, `BLOQUEADO`, `INCLUIDO_EN_PROCESO` -> bloqueo; `ANULADO` ignorado para esas reglas.

NOM-01B crea el modelo SQL base `novedad_remuneracion_periodo` para la nomenclatura funcional nueva. Esa tabla registra periodo, persona, contrato opcional, concepto, categoria, tipo, cantidad, monto, origen y estado. No reemplaza por si sola la implementacion actual ni integra proceso mensual hasta fases posteriores.

NOM-01C crea `src/app/features/nomina-mensual/novedades/` con modelo, mapper, repository, service y reglas puras para listar, crear, actualizar y cambiar estados de novedades mensuales. Esta capa no modifica recurrentes, no calcula liquidaciones, no marca pre-nomina real y no toca Previred/LRE.

## 9. Prevalidaciones y estados

Estados globales: `SIN_EVALUAR` (antes de ejecutar), `LISTO_PARA_CALCULO`, `CON_ADVERTENCIAS`, `BLOQUEADO`. Detalle en `prevalidaciones-9-5A.md` y ampliacion 9.5B en `prevalidaciones-9-5B.md`.

## 10. Bloqueos y advertencias

Los mensajes llevan `codigo`, `area`, `severidad` y `texto`. Severidades: `BLOQUEO`, `ADVERTENCIA`, `INFO`. Los `INFO` de integracion futura van en `informaciones` y no cambian el estado a `CON_ADVERTENCIAS`.

## 11. Motor de calculo

MOTOR-00 deja definido el contrato documental del motor. MOTOR-01 implementa el calculo base preliminar definido en:

- [`motor-calculo-contrato.md`](./motor-calculo-contrato.md)
- [`motor-calculo-orden-operaciones.md`](./motor-calculo-orden-operaciones.md)
- [`motor-calculo-entradas-salidas.md`](./motor-calculo-entradas-salidas.md)
- [`motor-calculo-casos-prueba.md`](./motor-calculo-casos-prueba.md)

El motor consumira los mismos prerequisitos validados aqui y la pre-nomina 9.5C. Las liquidaciones seran **snapshot** inmutable en una fase posterior (no formulario libre). Previred y LRE seran salidas posteriores, no pasos CRUD en esta pantalla.

MOTOR-01 queda documentado en [`motor-calculo-implementacion-01.md`](./motor-calculo-implementacion-01.md). MOTOR-02 queda documentado en [`motor-calculo-implementacion-02.md`](./motor-calculo-implementacion-02.md). MOTOR-03A queda documentado en [`motor-calculo-persistencia-03A.md`](./motor-calculo-persistencia-03A.md). MOTOR-03B queda documentado en [`motor-calculo-persistencia-03B.md`](./motor-calculo-persistencia-03B.md). MOTOR-03C queda documentado en [`motor-calculo-persistencia-03C.md`](./motor-calculo-persistencia-03C.md). La salida puede vivir en memoria o guardarse como snapshot preliminar, sin convertirse en liquidacion oficial.

## 12. Pre-nomina 9.5C

La pre-nomina por periodo es una base funcional de control. Se puede construir solo desde una prevalidacion sin bloqueos. Si hay advertencias, queda como `GENERADA_CON_ADVERTENCIAS`; si hay bloqueos, queda `NO_GENERABLE`.

No persiste datos ni marca movimientos como incluidos. No reemplaza el motor ni genera liquidaciones.

## 12.1 Calculo preliminar MOTOR-01/MOTOR-02

El calculo preliminar solo se habilita despues de una pre-nomina generable. Calcula por trabajador:

- haberes imponibles y no imponibles;
- base imponible previsional preliminar;
- base tributable preliminar;
- gratificacion legal art. 50 solo con configuracion suficiente o gratificacion recurrente vigente;
- topes previsionales solo desde campos claros de `parametros_generales`;
- asignacion familiar simple solo con `tramo_carga` y cargas en snapshot;
- AFP, salud, AFC, SIS, SANNA, Ley 16.744 e impuesto unico con `tabla_impuesto_unico` cuando hay datos suficientes;
- total haberes, total descuentos trabajador y liquido preliminar;
- issues y trazabilidad.

Ley 16.744, SIS y SANNA respetan DB-01: `ley_16744_parametros`, `empresa_ley_16744` como snapshot opcional, `parametros_generales.sis`, `afp_vigencia.sis` y `parametros_generales.sanna`. No se usan tablas no confirmadas.

## 12.2 Snapshot preliminar MOTOR-03A

MOTOR-03A define el contrato para guardar un resultado preliminar en una fase posterior. El snapshot:

- congela un resultado del motor por periodo y empresa;
- no es liquidacion oficial;
- no cierra el periodo;
- puede reemplazarse por recalculo si el periodo no esta cerrado;
- conserva issues, trazabilidad, parametros, formulas y origenes;
- usa `version_motor` y `hash_snapshot` para comparar recalculos.

Estados documentales permitidos: `borrador`, `preliminar`, `recalculado`, `observado`, `listo_para_revision`, `aprobado_para_liquidacion` y `anulado`.

Estados excluidos hasta fases futuras: `cerrado`, `enviado_previred`, `enviado_lre` y `contabilizado`.

Las tablas `nomina_calculo_periodo`, `nomina_calculo_trabajador`, `nomina_calculo_concepto`, `nomina_calculo_issue` y `nomina_calculo_trazabilidad` son candidatas documentales. No existen ni se crean en MOTOR-03A.

## 12.3 Persistencia controlada MOTOR-03B

MOTOR-03B crea SQL local incremental para las tablas de snapshot preliminar y agrega servicio/repository para guardar el resultado en memoria del motor.

Reglas:

- solo guarda si existe calculo preliminar sin bloqueos;
- reemplaza snapshot activo anterior marcandolo inactivo/anulado, sin borrado fisico;
- guarda trabajadores, conceptos, issues y trazabilidad;
- calcula `hash_snapshot` deterministico simple para comparar recalculos;
- no modifica `periodo_remuneracion`;
- no cierra periodo;
- no genera liquidacion oficial, PDF, Previred, LRE ni contabilidad.

El SQL queda en `bd/base/v11/partes/15_nomina_calculo_snapshot.sql` y no se aplica remotamente en esta fase.

## 12.4 Aplicacion controlada MOTOR-03C

MOTOR-03C valida el SQL de snapshots y lo registra en el flujo fresh local v11 mediante `bd/base/v11/run_all.sql`.

Resultado:

- PK/FK confirmadas contra `empresa(id_empresa)`, `persona(id_persona)` y `concepto(id_concepto)`;
- `psql` y Docker no disponibles en el entorno revisado;
- Supabase CLI disponible via dependencia local, pero no se ejecuto `supabase db push`;
- no se aplico migracion remota sin proyecto de desarrollo confirmado;
- no se regenero `database.types.ts` porque las tablas no existen aun en un ambiente consultable;
- repository mantiene capa local hasta regenerar tipos reales.

MOTOR-03C no agrega reglas de calculo, no cambia UI, no cierra periodo, no crea liquidacion oficial, no genera PDF, Previred, LRE ni contabilidad.

## 13. Referencias

- `prevalidaciones-9-5A.md` (fase 9.5A).
- `prevalidaciones-9-5B.md` (fase 9.5B: recurrentes + grupos parametros).
- `prevalidaciones-9-5C.md` (fase 9.5C: pre-nomina funcional por periodo).
- `novedades-mensuales.md` (fases NOM-01, NOM-01B y NOM-01C).
- `motor-calculo-contrato.md` (fase MOTOR-00).
- `motor-calculo-orden-operaciones.md`.
- `motor-calculo-entradas-salidas.md`.
- `motor-calculo-casos-prueba.md`.
- `motor-calculo-implementacion-01.md` (fase MOTOR-01).
- `motor-calculo-implementacion-02.md` (fase MOTOR-02).
- `motor-calculo-persistencia-03A.md` (fase MOTOR-03A).
- `motor-calculo-persistencia-03B.md` (fase MOTOR-03B).
- `motor-calculo-persistencia-03C.md` (fase MOTOR-03C).
- `vision-futura.md`.
- Orquestador: `docs/codex/orquestador/estado-fases.md`.
- Arquitectura: `docs/codex/arquitectura/frontend-interfaces.md`.
