# CHANGELOG

## SEG-NOMINA - RLS y permisos minimos de snapshots de nomina

Fecha: 2026-05-06

- Se agrega `bd/base/v11/partes/16_nomina_calculo_snapshot_rls.sql` con RLS minimo para snapshots de nomina.
- La parte 16 queda incluida en `bd/base/v11/run_all.sql` despues de `15_nomina_calculo_snapshot.sql`.
- Politicas: `SELECT`, `INSERT` y `UPDATE` solo para `authenticated` con `auth.role() = 'authenticated'`; no se habilita `DELETE`.
- Se aplica el SQL contra Supabase de desarrollo con `npx supabase db query --db-url ... --file bd/base/v11/partes/16_nomina_calculo_snapshot_rls.sql`.
- No se cierra periodo, no se genera liquidacion oficial, PDF, Previred, LRE ni contabilidad.
- Pendiente: validar guardado/reemplazo desde UI con sesion Supabase autenticada y trabajador sin bloqueos.

## MOTOR-03D - Validacion contra tablas existentes

Fecha: 2026-05-06

- Se ejecuto `npm run types:supabase` contra Supabase con las tablas de snapshot ya existentes.
- `database.types.ts` confirma `nomina_calculo_periodo`, `nomina_calculo_trabajador`, `nomina_calculo_concepto`, `nomina_calculo_issue` y `nomina_calculo_trazabilidad`.
- `NominaCalculoSnapshotRepository` se ajusta para usar tipos generados reales y deja de usar wrapper `any` para estas tablas.
- La prueba real de UI llega a prevalidacion, pre-nomina y calculo preliminar; el guardado queda bloqueado correctamente porque el trabajador disponible queda `con_bloqueos`.
- Una escritura tecnica controlada contra Supabase confirma RLS activa: `nomina_calculo_periodo` rechaza inserts con anon key.
- No se aplico SQL, no se crearon migraciones, no se modifico `bd/`, no se cerro periodo ni se genero PDF, Previred o LRE.
- Siguiente fase: SEG-NOMINA - RLS y permisos de snapshots de nomina.

## MOTOR-03C - Aplicacion controlada de migracion y validacion contra Supabase

Fecha: 2026-05-06

- Objetivo: validar la migracion local de snapshots preliminares de nomina mensual y documentar su aplicacion controlada contra Supabase local/remoto.
- SQL: se revisa `bd/base/v11/partes/15_nomina_calculo_snapshot.sql`, confirmando tablas, columnas, PK/FK, indices, unique parcial, `JSONB`, timestamps y TODO RLS.
- BD v11: `bd/base/v11/run_all.sql` incluye `partes/15_nomina_calculo_snapshot.sql`; `bd/base/v11/README.md` documenta aplicacion incremental.
- Ambiente: `psql` y Docker no estan disponibles; Supabase CLI existe via dependencia local, pero no se ejecuta `supabase db push`.
- Tipos Supabase: no se regenera `src/app/core/models/database.types.ts` porque la migracion no fue aplicada a un ambiente consultable; el repository mantiene capa local hasta aplicar SQL y regenerar tipos.
- Fuera de alcance: liquidacion oficial, cierre, PDF, Previred, LRE, contabilidad, RLS completa, Python, package changes, UI nueva y Supabase remoto sin proyecto de desarrollo confirmado.
- Pruebas: `npm test -- --watch=false`.
- Siguiente fase recomendada: SEG-NOMINA - RLS y permisos de snapshots de nomina.

## MOTOR-03B - Persistencia controlada de snapshots preliminares

Fecha: 2026-05-06

- Objetivo: guardar, consultar y reemplazar snapshots preliminares del calculo de nomina mensual sin convertirlos en liquidacion oficial.
- SQL local: se agrega `bd/base/v11/partes/15_nomina_calculo_snapshot.sql` con `nomina_calculo_periodo`, `nomina_calculo_trabajador`, `nomina_calculo_concepto`, `nomina_calculo_issue` y `nomina_calculo_trazabilidad`.
- Servicio: `ProcesoMensualService` expone guardar, consultar, listar, anular y recalcular/reemplazar snapshot preliminar mediante repository Supabase tipado localmente.
- Mapping: `proceso-mensual-snapshot.rules.ts` transforma `MotorCalculoPeriodoResultado` en payload persistible y calcula `hash_snapshot` deterministico simple.
- UI: Proceso mensual agrega acciones **Guardar snapshot preliminar**, **Ver snapshot activo** y **Recalcular y reemplazar**, con texto claro de que no cierra periodo ni genera liquidacion oficial.
- DB-01: no se usan como reales `empresa_mutual_config`, `afp_parametro`, `salud_vigencia`, `afc_vigencia`, `mutual_vigencia`, `asignacion_familiar_tramo`, `sis_parametro`, `sanna_parametro` ni `topes_imponibles`.
- Fuera de alcance: aplicacion remota de migracion, RLS detallado, cierre, liquidacion oficial, PDF, Previred, LRE, contabilidad, Python, package changes y Supabase remoto.
- Pruebas: `npm test -- --watch=false`.
- Siguiente fase recomendada: MOTOR-03C - Aplicacion controlada de migracion y validacion contra Supabase local/remoto.

## MOTOR-03A - Contrato de persistencia y snapshot de calculo

Fecha: 2026-05-06

- Objetivo: disenar como se guardaran resultados preliminares del motor antes de crear tablas, migraciones o servicios de escritura.
- Alcance: contrato documental de snapshot preliminar, estados, tablas candidatas, reglas de reemplazo/recalculo, `version_motor`, `hash_snapshot`, issues y trazabilidad persistida.
- Relacion operacional: el snapshot preliminar no es liquidacion oficial, no cierra periodo y puede reemplazarse por un nuevo calculo si el periodo no esta cerrado.
- Tablas propuestas solo como diseno: `nomina_calculo_periodo`, `nomina_calculo_trabajador`, `nomina_calculo_concepto`, `nomina_calculo_issue` y `nomina_calculo_trazabilidad`.
- DB-01: se mantienen como fuentes canonicas las tablas confirmadas y no se usan como reales nombres prohibidos ni tablas no existentes.
- Fuera de alcance: SQL, migraciones, RLS, escritura en Supabase, cambios TypeScript funcionales, servicios, UI, Python, package changes, cierre, liquidacion oficial, PDF, Previred, LRE, contabilidad y rectificaciones.
- Pruebas: validacion documental; no se ejecutan tests de codigo porque no se modifica `src/`.
- Siguiente fase recomendada: MOTOR-03B - Implementacion de persistencia controlada de snapshots preliminares.

## MOTOR-02 - Gratificacion, impuesto unico y reglas legales avanzadas

Fecha: 2026-05-05

- Objetivo: fortalecer el calculo preliminar sin convertirlo en liquidacion oficial ni cerrar periodo.
- Alcance: gratificacion art. 50 solo con configuracion suficiente, impuesto unico con `tabla_impuesto_unico`, topes desde `parametros_generales`, asignacion familiar simple con `tramo_carga`, jornada/IMM, issues y trazabilidad normativa.
- DB-01: no se usan como reales `empresa_mutual_config`, `afp_parametro`, `salud_vigencia`, `afc_vigencia`, `mutual_vigencia`, `asignacion_familiar_tramo`, `sis_parametro`, `sanna_parametro` ni `topes_imponibles`.
- UI: tabla de calculo preliminar agrega columnas de gratificacion e impuesto unico, sin redisenar la pantalla.
- Fuera de alcance: persistencia, snapshots definitivos, cierre, liquidacion oficial, PDF, Previred, LRE, contabilidad, 30% de utilidades, reliquidacion anual, SQL, migraciones, Python, package changes y Supabase remoto.
- Pruebas: `npm test -- --watch=false` en verde (27 archivos, 255 tests).
- Siguiente fase recomendada: MOTOR-03 - Persistencia controlada de resultados preliminares y snapshot de calculo.

## MOTOR-01 - Implementacion inicial del motor de calculo base

Fecha: 2026-05-05

- Objetivo: generar un calculo preliminar por trabajador desde pre-nomina 9.5C validada, sin cerrar periodo ni emitir liquidaciones oficiales.
- Alcance: modelos TypeScript del motor, regla pura `proceso-mensual-motor.rules.ts`, servicio en memoria y UI minima en `/remuneraciones/proceso-mensual`.
- Calculos: sueldo base, haberes recurrentes imponibles/no imponibles, base imponible previsional, base tributable, AFP, salud, AFC, SIS, SANNA, Ley 16.744, impuesto unico preliminar, descuentos trabajador y liquido preliminar.
- Trazabilidad: parametros, formulas, tablas canonicas, valores de entrada y resultados por calculo relevante.
- DB-01: se respetan tablas canonicas; no se usan como reales `empresa_mutual_config`, `afp_parametro`, `salud_vigencia`, `afc_vigencia`, `mutual_vigencia`, `asignacion_familiar_tramo`, `sis_parametro`, `sanna_parametro` ni `topes_imponibles`.
- Fuera de alcance: SQL, migraciones, Python, Supabase remoto, snapshots definitivos, cierre de periodo, PDF, Previred, LRE, contabilidad, gratificacion automatica compleja e impuesto unico avanzado.
- Pruebas: `npm test -- --watch=false` en verde (27 archivos, 239 tests).
- Siguiente fase recomendada: MOTOR-02 - Gratificacion, impuesto unico y reglas legales avanzadas.

## MOTOR-00 - Contrato del motor de calculo

Fecha: 2026-05-05

- Objetivo: dejar definido el contrato tecnico, funcional y normativo del futuro motor antes de implementar montos reales.
- Alcance: documentacion de entradas, salidas, orden de operaciones, reglas normativas iniciales, bloqueos previos, trazabilidad y casos de prueba.
- Fuera de alcance: implementacion TypeScript del motor, SQL, migraciones, Supabase remoto, Python, Previred, LRE, PDF, cierre de periodo y contabilidad.
- Entradas: `MotorCalculoInput` alimentado desde pre-nomina 9.5C, parametros legales, contratos, haberes/descuentos, movimientos variables y tablas canonicas DB-01.
- Salidas: `LiquidacionCalculada` conceptual con haberes, descuentos, bases, cotizaciones, impuesto, liquido, issues y trazabilidad.
- Siguiente fase recomendada: MOTOR-01 - Implementacion inicial del motor de calculo base.

## Fase 9.5C - Pre-nomina funcional por periodo

Fecha: 2026-05-05

- Se agrego regla pura para construir una pre-nomina funcional desde la prevalidacion mensual.
- Se extendio `ProcesoMensualService` con generacion de pre-nomina por periodo, sin persistencia ni calculo de montos.
- Se agrego UI en Proceso mensual para generar y visualizar conteos de pre-nomina.
- Se documenta que la fase no incluye motor, liquidaciones, Previred, LRE, SQL, Python, migraciones ni Supabase remoto.

## DB-01B - Auditoria final posterior a DB-01

Fecha: 2026-05-05

- Se auditaron referencias no canonicas posteriores a DB-01; quedan solo como "No usar", "No existe" o correccion historica.
- Se confirmaron referencias canonicas a `empresa_ley_16744`, `parametros_generales.sis`, `afp_vigencia.sis` y `parametros_generales.sanna`.
- `docs.zip` queda fuera de DB-01B; si estaba modificado, se restauro y su eliminacion o respaldo queda como decision futura.
- No se modifico codigo Angular, SQL, Python, migraciones, `.cursor`, `package.json`, `package-lock.json` ni Supabase remoto.

## DB-01 - Confirmar tablas canonicas contra Supabase/PostgreSQL

Fecha: 2026-05-05

- Validacion ejecutada contra tipos remotos de Supabase generados con `npx supabase gen types typescript --project-id ...`.
- Se confirmaron las tablas canonicas principales del diccionario.
- Se corrigio `empresa_mutual_config` por `empresa_ley_16744`.
- Se confirmo que no existen tablas separadas `sis_parametro`, `sanna_parametro` ni `topes_imponibles`.
- Se confirmo que no existen nombres alternativos `afp_parametro`, `salud_vigencia`, `afc_vigencia`, `mutual_vigencia` ni `asignacion_familiar_tramo`.
- SIS queda asociado a `parametros_generales.sis` y `afp_vigencia.sis`, siempre sujeto a fuente oficial mensual.
- SANNA queda asociado a `parametros_generales.sanna`.
- No se modifico codigo Angular, SQL, Python, migraciones ni Supabase remoto.

## DOC-04 - Integracion de documentacion nueva al repo real

Fecha: 2026-05-05

- Archivos agregados: contrato y criterios globales, glosario, inconsistencias, normativa, LRE, prevalidaciones raiz, plan de pruebas, tests documentales y diccionario de tablas canonicas.
- Archivos fusionados: `AGENTS.md`, `README.md`, orquestador, matriz normativa, integracion de parametros legales, pruebas y changelog.
- Wrappers mantenidos: stubs historicos en `temas/`; wrappers nuevos para duplicados de estilos y guias UI.
- Referencias normalizadas: la raiz oficial queda en `docs/codex`; la fuente local no debe referenciarse en la documentacion final.
- Tablas canonicas: se agrego `orquestador/diccionario-tablas-canonicas.md` y regla obligatoria de consulta previa.
- SIS: queda documentado como tasa mensual dependiente de fuente oficial; no se hardcodea y bloquea nomina si falta confirmacion.
- LRE: queda documentado como modulo operativo futuro, sin implementacion de codigo.
- Documentos pendientes: validar nombres fisicos de tablas contra Supabase/PostgreSQL.
- Advertencia: no cerrar fases funcionales como implementadas cuando solo fueron documentadas.
- Siguiente paso recomendado: DB-01 - Confirmar tablas canonicas contra Supabase/PostgreSQL.

Registro de cambios aplicados a la base documental del ERP de remuneraciones.  Cada entrada debe incluir una fecha y describir de forma concisa las modificaciones realizadas.  Los cambios que afectan contratos funcionales, glosarios o flujos deben acompañarse de una referencia al documento correspondiente.

## 2026-05-05 - Versión final consolidada

- **Adición de glosario y nomenclatura:** se añadió `glosario.md` para unificar la definición de términos como `PERIODO_MENSUAL`, `VIGENCIA`, `CATALOGO_GLOBAL`, `ANUAL`, `CONFIG_EMPRESA`, así como los estados de períodos de remuneración y empleados.  Este archivo surge ante la necesidad de evitar ambigüedades y duplicación de definiciones dispersas en múltiples documentos.
- **Registro de inconsistencias:** se creó `inconsistencias.md` para documentar contradicciones detectadas entre fuentes originales: uso híbrido de `trabajo_pesado_parametro`, clasificación de `tabla_impuesto_unico`, falta de exposición de `afp_vigencia`, estados `BORRADOR` en diferentes dominios, entre otros.  Este registro permite priorizar decisiones futuras.
- **Plan de pruebas consolidado:** se añadió `plan-pruebas.md` para centralizar las pruebas existentes y proponer una expansión.  El plan agrupa pruebas unitarias, de integración y E2E por módulo y resalta brechas actuales.
- **Changelog formalizado:** se incorporó este propio `CHANGELOG.md` como mecanismo transparente de trazabilidad de cambios en la documentación.
- **Actualización de `README.md`:** se actualizó el índice general para incluir las nuevas secciones (`glosario.md`, `inconsistencias.md`, `plan-pruebas.md`, `CHANGELOG.md`) y se reforzó la jerarquía de lectura.
- **Actualización del mapa de documentación:** `orquestador/mapa-documentacion.md` se modificó para listar los nuevos archivos y describir su propósito.
- **Homologación de estilo ASCII:** se revisaron archivos para eliminar acentos innecesarios y mantener una codificación ASCII en títulos, tablas y rutas.  Se dejaron tildes únicamente en explicaciones donde la claridad lo exigía.
- **Notas de UI sincronizadas:** se aclaró en varios contratos que las explicaciones mensuales/vigencias se desplazan a la banda superior de las pantallas, limpiando tabs y copy repetitivo (alineado al ajuste del 2026-05-01 en Parametros).
- **Enlaces cruzados:** se agregaron referencias al glosario y al registro de inconsistencias en contratos generales y guías relevantes, mejorando la navegabilidad.

## 2026-05-02 - Versión base inicial

- Se creó la primera versión de la base documental reorganizada a partir de las fuentes originales (`docs.zip`).  Se definió la estructura de carpetas (`codex/`, `modulos/`, `temas/`, `orquestador/`) y se redactaron archivos resumidos por módulo: empleados, parámetros, conceptos de remuneración, haberes y descuentos, nómina mensual.  Se añadieron guías de UI y estilos y un índice general (`README.md`).  Se generó un `mapa-documentacion.md` para describir cada archivo.

Entradas anteriores se encuentran en resúmenes del memento; esta changelog las formaliza en la base documental para futuras referencias.
