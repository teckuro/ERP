# Estado de fases del proyecto

## 1. Propósito

Tablero **vivo** (a actualizar al cerrar fases) con: qué está **cerrado**, qué **sigue**, qué módulos están **congelados** o **pendientes**, y enlaces a documentos y pruebas relevantes. Complementa [`contexto-proyecto.md`](./contexto-proyecto.md).

## 2. Tabla de fases

| Fase                                     | Estado      | Resumen                                                                                                                                                          | Documentos                                                                                                                                                                                                                                                                                                                       | Pruebas (referencia)                                                |
| ---------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| NOM-01B - Modelo SQL de novedades mensuales | **Cerrada tecnica local** | Crea la tabla base `novedad_remuneracion_periodo` para hechos del periodo con relaciones a periodo, persona, contrato opcional y concepto; estados, categorias, origenes, checks e indices minimos. No implementa UI, servicios, proceso mensual, motor, liquidacion, Previred ni LRE. | [`../modulos/nomina-mensual/novedades-mensuales.md`](../modulos/nomina-mensual/novedades-mensuales.md), [`../../../bd/base/v11/partes/18_novedades_mensuales.sql`](../../../bd/base/v11/partes/18_novedades_mensuales.sql), [`../../../bd/base/v11/README.md`](../../../bd/base/v11/README.md), [`mapa-documentacion.md`](./mapa-documentacion.md) | `npm test -- --watch=false`, `npm run build`; validacion SQL contra BD real pendiente si no hay `psql`/URL disponible. |
| NOM-01 - Modelo documental de novedades mensuales | **Cerrada documental** | Define Novedades mensuales como hechos del periodo, separadas de conceptos, recurrentes, parametros, motor y liquidacion; documenta categorias, campos logicos, estados, origenes, validaciones y fases futuras, sin codigo ni SQL. | [`../modulos/nomina-mensual/novedades-mensuales.md`](../modulos/nomina-mensual/novedades-mensuales.md), [`../modulos/nomina-mensual/arquitectura-funcional-remuneraciones.md`](../modulos/nomina-mensual/arquitectura-funcional-remuneraciones.md), [`mapa-documentacion.md`](./mapa-documentacion.md) | Validacion documental; sin tests de codigo porque no hay implementacion funcional. |
| NOM-00 - Arquitectura funcional de remuneraciones | **Cerrada documental** | Arquitectura funcional del flujo completo de remuneraciones: separa Maestros RRHH, Parametros, Conceptos, recurrentes, Novedades mensuales, Proceso mensual, Motor, Liquidacion, Previred/LRE y Reportes; no implementa codigo, SQL, Python ni salidas legales. | [`../modulos/nomina-mensual/arquitectura-funcional-remuneraciones.md`](../modulos/nomina-mensual/arquitectura-funcional-remuneraciones.md), [`../modulos/nomina-mensual/contrato-general.md`](../modulos/nomina-mensual/contrato-general.md), [`mapa-documentacion.md`](./mapa-documentacion.md) | Validacion documental; sin tests de codigo porque no hay implementacion funcional. |
| SEG-NOMINA - RLS y permisos de snapshots de nomina | **Cerrada con validacion UI pendiente** | RLS minimo aplicado a snapshots de nomina para usuarios Supabase `authenticated`: lectura, insercion y actualizacion sin DELETE; pendiente validar guardado/reemplazo desde UI con sesion autenticada y trabajador sin bloqueos. | [`../modulos/nomina-mensual/motor-calculo-persistencia-03C.md`](../modulos/nomina-mensual/motor-calculo-persistencia-03C.md), [`../../../bd/base/v11/partes/16_nomina_calculo_snapshot_rls.sql`](../../../bd/base/v11/partes/16_nomina_calculo_snapshot_rls.sql) | `npx supabase db query --db-url ... --file bd/base/v11/partes/16_nomina_calculo_snapshot_rls.sql`, `npm test -- --watch=false` |
| MOTOR-03D - Validacion contra tablas existentes | **Cerrada con pendiente RLS** | Tipos Supabase regenerados contra tablas existentes y repository ajustado a tipos reales; UI valida/pre-nomina/calcula pero no guarda por trabajador con bloqueos; escritura tecnica confirma RLS bloqueando anon insert en snapshots. | [`../modulos/nomina-mensual/motor-calculo-persistencia-03C.md`](../modulos/nomina-mensual/motor-calculo-persistencia-03C.md), [`../modulos/nomina-mensual/contrato-general.md`](../modulos/nomina-mensual/contrato-general.md) | `npm run types:supabase`, prueba UI controlada, `npm test -- --watch=false` |
| MOTOR-03C - Aplicacion controlada de migracion y validacion contra Supabase | **Cerrada tecnica controlada** | SQL de snapshots revisado, PK/FK confirmadas contra v11 e inclusion en `run_all.sql`; no se aplico local/remoto por falta de `psql`/Docker y sin proyecto remoto de desarrollo confirmado; tipos Supabase quedan pendientes. | [`../modulos/nomina-mensual/motor-calculo-persistencia-03C.md`](../modulos/nomina-mensual/motor-calculo-persistencia-03C.md), [`../modulos/nomina-mensual/contrato-general.md`](../modulos/nomina-mensual/contrato-general.md), [`../../../bd/base/v11/README.md`](../../../bd/base/v11/README.md) | `npm test -- --watch=false` |
| MOTOR-03B - Persistencia controlada de snapshots preliminares | **Cerrada** | SQL local incremental y servicio/repository para guardar, consultar y reemplazar snapshots preliminares del calculo; conserva trabajadores, conceptos, issues, trazabilidad y hash; sin cierre, liquidacion oficial, PDF, Previred, LRE, contabilidad ni Supabase remoto. | [`../modulos/nomina-mensual/motor-calculo-persistencia-03B.md`](../modulos/nomina-mensual/motor-calculo-persistencia-03B.md), [`../modulos/nomina-mensual/contrato-general.md`](../modulos/nomina-mensual/contrato-general.md) | `proceso-mensual-snapshot.rules.spec.ts`, `proceso-mensual.service.spec.ts`, `proceso-mensual-container.spec.ts`, `npm test -- --watch=false` |
| MOTOR-03A - Contrato de persistencia y snapshot de calculo | **Cerrada documental** | Contrato de snapshot preliminar persistible: estados, tablas candidatas, reglas de reemplazo/recalculo, hash, version del motor, trazabilidad y relacion con periodo/liquidacion futura; sin SQL, migraciones, servicios, UI, Supabase remoto ni persistencia real. | [`../modulos/nomina-mensual/motor-calculo-persistencia-03A.md`](../modulos/nomina-mensual/motor-calculo-persistencia-03A.md), [`../modulos/nomina-mensual/motor-calculo-entradas-salidas.md`](../modulos/nomina-mensual/motor-calculo-entradas-salidas.md), [`../modulos/nomina-mensual/contrato-general.md`](../modulos/nomina-mensual/contrato-general.md) | Validacion documental; sin tests de codigo porque no hay implementacion funcional. |
| MOTOR-02 - Gratificacion, impuesto unico y reglas legales avanzadas | **Cerrada** | Calculo preliminar fortalecido con gratificacion art. 50 controlada, impuesto unico con tabla, topes disponibles, asignacion familiar simple, jornada/IMM, issues y trazabilidad; sin persistencia, liquidacion oficial, PDF, Previred, LRE ni cierre. | [`../modulos/nomina-mensual/motor-calculo-implementacion-02.md`](../modulos/nomina-mensual/motor-calculo-implementacion-02.md), [`../modulos/nomina-mensual/contrato-general.md`](../modulos/nomina-mensual/contrato-general.md) | `proceso-mensual-motor.rules.spec.ts`, `proceso-mensual-container.spec.ts`, `npm test -- --watch=false` |
| MOTOR-01 - Implementacion inicial del motor de calculo base | **Cerrada** | Primer calculo preliminar por trabajador desde pre-nomina 9.5C; calcula sueldo base, recurrentes, bases, cotizaciones basicas, liquido, issues y trazabilidad; sin cierre, snapshots, liquidacion oficial, PDF, Previred ni LRE. | [`../modulos/nomina-mensual/motor-calculo-implementacion-01.md`](../modulos/nomina-mensual/motor-calculo-implementacion-01.md), [`../modulos/nomina-mensual/contrato-general.md`](../modulos/nomina-mensual/contrato-general.md) | `proceso-mensual-motor.rules.spec.ts`, `proceso-mensual.service.spec.ts`, `proceso-mensual-container.spec.ts`, `npm test -- --watch=false` |
| MOTOR-00 - Contrato del motor de calculo | **Cerrada documental** | Contrato tecnico, funcional y normativo del motor definido; no implementa calculos, SQL, Python, liquidaciones, Previred, LRE, PDF ni cierre. | [`../modulos/nomina-mensual/motor-calculo-contrato.md`](../modulos/nomina-mensual/motor-calculo-contrato.md), [`../modulos/nomina-mensual/motor-calculo-orden-operaciones.md`](../modulos/nomina-mensual/motor-calculo-orden-operaciones.md), [`../modulos/nomina-mensual/motor-calculo-entradas-salidas.md`](../modulos/nomina-mensual/motor-calculo-entradas-salidas.md), [`../modulos/nomina-mensual/motor-calculo-casos-prueba.md`](../modulos/nomina-mensual/motor-calculo-casos-prueba.md) | Validacion documental; sin tests de codigo porque no hay implementacion funcional. |
| Fase 9.5C - Pre-nomina funcional por periodo | **Cerrada** | Pre-nomina funcional generable desde prevalidacion mensual sin bloqueos; consolida conteos y trazabilidad, sin motor, montos ni liquidaciones. | [`../modulos/nomina-mensual/prevalidaciones-9-5C.md`](../modulos/nomina-mensual/prevalidaciones-9-5C.md), [`../modulos/nomina-mensual/contrato-general.md`](../modulos/nomina-mensual/contrato-general.md) | `proceso-mensual-prenomina.rules.spec.ts`, `proceso-mensual.service.spec.ts`, `proceso-mensual-container.spec.ts`, `npm test -- --watch=false` |
| DB-01B - Auditoria final posterior a DB-01 | **Cerrada documental** | Auditoria final posterior a la validacion Supabase: referencias no canonicas quedan solo como "No usar" o "No existe"; referencias canonicas confirmadas. | [`diccionario-tablas-canonicas.md`](./diccionario-tablas-canonicas.md), [`../CHANGELOG.md`](../CHANGELOG.md) | Auditoria documental; sin codigo, SQL, Python, migraciones ni Supabase remoto. |
| DB-01 - Confirmar tablas canonicas contra Supabase/PostgreSQL | **Cerrada documental** | Esquema remoto Supabase contrastado con el diccionario canonico; se corrige `empresa_ley_16744` como tabla canonica y se confirma que no existen `sis_parametro`, `sanna_parametro` ni `topes_imponibles` como tablas separadas. | [`diccionario-tablas-canonicas.md`](./diccionario-tablas-canonicas.md), [`../CHANGELOG.md`](../CHANGELOG.md) | `npx supabase gen types typescript --project-id ...` contra proyecto remoto; sin codigo, SQL, Python ni migraciones. |
| DOC-04 - Integracion de documentacion nueva al repo real | **Cerrada documental** | Nueva base documental integrada en `docs/codex`; implementacion no aplica; bloquea siguiente hasta validar tablas reales contra BD. | [`../CHANGELOG.md`](../CHANGELOG.md), [`mapa-documentacion.md`](./mapa-documentacion.md), [`diccionario-tablas-canonicas.md`](./diccionario-tablas-canonicas.md), [`dependencias-fases.md`](./dependencias-fases.md) | Auditoria documental; sin codigo, SQL, Python ni migraciones. |
| ORDEN-01 - Integracion final del roadmap | **Cerrada** | Roadmap oficial integrado. SEG-01 queda como siguiente fase oficial; CONC-02 despues de SEG-01; MOTOR-00 obligatorio antes de cualquier implementacion de motor. | [`roadmap-operativo.md`](./roadmap-operativo.md), [`dependencias-fases.md`](./dependencias-fases.md), [`criterios-cierre-fases.md`](./criterios-cierre-fases.md), [`orden-prioridades.md`](./orden-prioridades.md), [`mapa-documentacion.md`](./mapa-documentacion.md), [`matriz-roles-permisos.md`](./matriz-roles-permisos.md) | Validacion documental; sin codigo, SQL, Python, UI ni tests nuevos. |

| SEG-01 - Roles, permisos, JWT/RLS base | **En definicion** | Matriz documental de roles, permisos, acciones criticas, capas UI/service/BD-JWT-RLS y bloqueos por fase futura. No implementa permisos reales todavia. | [`matriz-roles-permisos.md`](./matriz-roles-permisos.md), [`criterios-cierre-fases.md`](./criterios-cierre-fases.md), [`dependencias-fases.md`](./dependencias-fases.md) | Validacion documental; sin codigo, SQL, Python, UI ni tests nuevos. |

Tabla historica:

| Fase                                                         | Estado                                  | Resumen                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Documentos                                                                                                                                                                                                                                                                                                                                       | Pruebas (referencia)                                                                                                                                                         |
| ------------------------------------------------------------ | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0 - Contrato Codex / `docs/codex`                            | **Cerrada**                             | `AGENTS.md`, README, manual base, guías UI/form/tablas/estilos, **`modulos/`** + `temas/`. Regla: leer orquestador + módulo antes de implementar.                                                                                                                                                                                                                                                                                                                                               | [`AGENTS.md`](../AGENTS.md), [`README.md`](../README.md), [`manual-base-proyecto.md`](../manual-base-proyecto.md), [`ui-form-guidelines.md`](../ui-form-guidelines.md), [`ui-tables.md`](../ui-tables.md), [`estilos/README.md`](../estilos/README.md), [`mapa-documentacion.md`](./mapa-documentacion.md)                                       | -                                                                                                                                                                            |
| 1 - Parámetros / período / vigencia / catálogo               | **Cerrada**                             | Período activo; mensual vs vigencia vs catálogo global; estado oficial del período; UI estabilizada; reforma/gradualidad; DataGrid y empty states; tabs/subtabs.                                                                                                                                                                                                                                                                                                                                | [`periodo-vigencia-catalogo.md`](../modulos/parametros/periodo-vigencia-catalogo.md), [`ui-parametros.md`](../modulos/parametros/ui-parametros.md), [`reforma-gradualidad.md`](../modulos/parametros/reforma-gradualidad.md), [`campos-y-listas.md`](../modulos/parametros/campos-y-listas.md)                                                   | E2E/UI según módulo Parámetros en repo                                                                                                                                       |
| 2 - Python / BD v11 / carga mensual                          | **Cerrada** (pendientes no bloqueantes) | Python v6.11; gradualidad 8,5 %; tablas alineadas a `(código, período)`; modo preparar sin datos oficiales falsos; carga mensual oficial separada.                                                                                                                                                                                                                                                                                                                                              | [`python-carga-mensual.md`](../modulos/parametros/python-carga-mensual.md), [`../../../bd/base/v11/README.md`](../../../bd/base/v11/README.md)                                                                                                                                                                                                   | Validaciones SQL v11 cuando haya BD local; scripts Python según doc                                                                                                          |
| 3 - Empleados: estados y aptitud                             | **Cerrada**                             | BORRADOR = wizard avanzado; EN_PROCESO = ficha; ACTIVO + apto = remuneraciones; `paso_alta_avanzada` manda “Continuar alta”; sin activar con defaults técnicos.                                                                                                                                                                                                                                                                                                                                 | [`contrato-general.md`](../modulos/empleados/contrato-general.md)                                                                                                                                                                                                                                                                                | Unit + E2E empleados según [`borrador-continuar-alta.md`](../modulos/empleados/borrador-continuar-alta.md) y [`tests-empleados.md`](../modulos/empleados/tests-empleados.md) |
| 4 - Helper completitud / aptitud                             | **Cerrada**                             | `evaluarCompletitudYAptitudEmpleado` en `empleado-completitud.rules.ts`; bloqueos y defaults técnicos explícitos.                                                                                                                                                                                                                                                                                                                                                                               | [`contrato-general.md`](../modulos/empleados/contrato-general.md) (sección helper)                                                                                                                                                                                                                                                               | `empleado-completitud.rules` (unit)                                                                                                                                          |
| 5 - Listado y Ficha con helper                               | **Cerrada**                             | CTAs por estado en listado; ficha con panel compacto (estado, aptitud, pendientes, acción); adapter al helper.                                                                                                                                                                                                                                                                                                                                                                                  | [`listado.md`](../modulos/empleados/listado.md), [`ficha-empleado.md`](../modulos/empleados/ficha-empleado.md), [`contrato-general.md`](../modulos/empleados/contrato-general.md)                                                                                                                                                                | `ficha-empleado-container`, listado (unit); Playwright empleados UI                                                                                                          |
| 6 - Selects vacíos / sin autoselección                       | **Cerrada**                             | Opción vacía; sin primer catálogo como elección; defaults no cuentan como selección real.                                                                                                                                                                                                                                                                                                                                                                                                       | Módulo Empleados + formularios; [`ui-form-guidelines.md`](../ui-form-guidelines.md)                                                                                                                                                                                                                                                              | Unit form/orchestrator según repo                                                                                                                                            |
| 7 - Rehidratación borrador avanzado                          | **Cerrada**                             | DRAFT-\*, Sin cargo, sueldo 0, APVI incompleto no como reales; paso 9 con pendientes reales.                                                                                                                                                                                                                                                                                                                                                                                                    | [`borrador-continuar-alta.md`](../modulos/empleados/borrador-continuar-alta.md), [`contrato-general.md`](../modulos/empleados/contrato-general.md)                                                                                                                                                                                               | `empleado-borrador-hidratacion` (unit); E2E opcionales con `E2E_EMPLEADOS_BORRADOR`                                                                                          |
| 8 - Validar para remuneraciones (Ficha)                      | **Cerrada**                             | Opción B: ficha completa **no** apta sola; CTA **Validar para remuneraciones**; confirmación; `EmpleadosRepository.validarFichaParaRemuneraciones` reevalúa helper y persiste solo `persona` (`VALIDO`, `apto_para_remuneraciones`, `ACTIVO` si aplica, `fecha_activacion`, `paso_alta_avanzada` null). Condiciones UI y exclusiones: [`validar-remuneraciones.md`](../modulos/empleados/validar-remuneraciones.md) y §21 de [`contrato-general.md`](../modulos/empleados/contrato-general.md). | [`validar-remuneraciones.md`](../modulos/empleados/validar-remuneraciones.md)                                                                                                                                                                                                                                                                    | Unit: `ficha-empleado-container.spec.ts`, `empleados.service.spec.ts`; E2E ficha opcional según entorno                                                                      |
| 9 - Conceptos: diagnóstico, contrato y decisiones operativas | **Cerrada** (documental)                | Inventario de ruta `/remuneraciones/conceptos`, contenedor, servicio/repositorio, tablas `concepto` / `catalogo_lre` / `regla_concepto_calculo`, RLS y seeds Python; **contrato funcional** y **decisiones operativas** (permisos, asignables, LRE, vigencias, baja). Brechas de implementación: JWT/roles, RLS productivo, UI de reglas, E2E ruta (Fase 9.2).                                                                                                                                  | [`diagnostico-fase-9.md`](../modulos/conceptos-remuneracion/diagnostico-fase-9.md), [`decisiones-operativas.md`](../modulos/conceptos-remuneracion/decisiones-operativas.md), [`contrato-funcional.md`](../modulos/conceptos-remuneracion/contrato-funcional.md), [`contrato-general.md`](../modulos/conceptos-remuneracion/contrato-general.md) | Ver [`contrato-funcional.md`](../modulos/conceptos-remuneracion/contrato-funcional.md) §8; snapshot `/remuneraciones/conceptos` pendiente en `tests/dashboard.spec.ts`       |

## 3. Fases cerradas (lista corta)

0-8 según tabla; **9** cerrada en alcance **documental** (diagnóstico + contrato funcional + **decisiones operativas**). El frente **Conceptos** sigue abierto en implementación/pruebas hasta cerrar brechas de Fase **9.2** (JWT/RLS, alineación listados, E2E, etc.).

## 4. Fase actual / siguiente

**Fase fuerte Conceptos (implementación - 9.2):** **9.2A** cerró listado base (grilla, filtros, `esConceptoAsignable`, smoke E2E `tests/conceptos-remuneracion-listado.spec.ts`). **9.2B** cerró **detalle por Revisar** (modal, `concepto-acciones.rules.ts`, blindaje en grilla). **9.2C** alineó **Haberes y descuentos** al catálogo: `listarConceptos` y validación de alta/edición usan la **misma regla central** que Conceptos; tests unit en `haberes-descuentos.service.spec.ts`. **Siguiente** en 9.2: roles/JWT, `APORTE` solo Admin, RLS, reglas de cálculo en UI, E2E visual ampliado. Brechas: [`diagnostico-fase-9.md`](../modulos/conceptos-remuneracion/diagnostico-fase-9.md) §8, [`decisiones-operativas.md`](../modulos/conceptos-remuneracion/decisiones-operativas.md) §10-§11, [`contrato-funcional.md`](../modulos/conceptos-remuneracion/contrato-funcional.md) §4-§11. Punto de entrada: [`../modulos/conceptos-remuneracion/README.md`](../modulos/conceptos-remuneracion/README.md). Marco UX: [`diseno-operativo-erp.md`](./diseno-operativo-erp.md) §6. Contexto: [`contexto-proyecto.md`](./contexto-proyecto.md) §10 y §12.

**Haberes y descuentos 9.3A-9.3C:** cerradas. Quedan implementadas vigencias/duplicados recurrentes, cierre/desactivacion controlada y vista historica con filtro de estado derivado. **Fase 9.3B.1** normalizo rutas y menu del dominio Remuneraciones bajo `/remuneraciones/*` (ver seccion dedicada abajo). **Fase 9.4A** cerro el **contrato documental** de **Movimientos variables mensuales** (separacion de recurrentes y de Conceptos; sin SQL ni UI productiva). **Fase 9.4B** agrego **modelo TypeScript y reglas puras** con tests unitarios (sin CRUD productivo ni SQL). **Fase 9.4C** agrego **DDL no destructivo** (`movimiento_variable_mensual`), script incremental `14_*.sql`, **repositorio y mappers** con validacion alineada a 9.4B (sin UI productiva, sin RLS, sin motor). **Fase 9.4D** agrego **`MovimientosVariablesService`** (capa fina sobre el repository, listado base como filas, tests con mock). **Fase 9.4E** agrego **UI de carga manual controlada** bajo `/remuneraciones/movimientos-variables` (listado por periodo, alta manual, anulacion con confirmacion; sin repository en UI). **CHILE-FIX-01** endurecio **crear/actualizar**: concepto desde catalogo (`HaberesDescuentosService`) y aptitud/contrato en periodo (`EmpleadosService`); ver [`../modulos/movimientos-variables/hardening-chile-fix-01.md`](../modulos/movimientos-variables/hardening-chile-fix-01.md) y seguimiento en [`../auditorias/qa-chile-01-remuneraciones.md`](../auditorias/qa-chile-01-remuneraciones.md). **PARAM-CHILE-01** limpio la UI de **Proceso mensual** frente a datos normativos demo (**ALTO-004**); informe [`../auditorias/param-chile-01-parametros-y-demo-proceso.md`](../auditorias/param-chile-01-parametros-y-demo-proceso.md). **Fase 9.5A** agrego **prevalidaciones** de proceso mensual (`ProcesoMensualService`, reglas puras, UI minima con lectura real vía servicios existentes; sin motor ni liquidaciones); ver [`../modulos/nomina-mensual/prevalidaciones-9-5A.md`](../modulos/nomina-mensual/prevalidaciones-9-5A.md). **Fase 9.5B** agrego **haberes recurrentes** filtrados al `YYYY-MM`, **grupos minimos de parametros** (`listarCatalogos` + `revisarGruposParametrosMinimos`) y resumen en contenedor; ver [`../modulos/nomina-mensual/prevalidaciones-9-5B.md`](../modulos/nomina-mensual/prevalidaciones-9-5B.md). Punto de entrada movimientos variables: [`../modulos/movimientos-variables/README.md`](../modulos/movimientos-variables/README.md). Punto de entrada proceso mensual: [`../modulos/nomina-mensual/README.md`](../modulos/nomina-mensual/README.md). Siguiente segun roadmap: `SEG-01 -> CONC-02 -> MOTOR-00 -> MOTOR-01 -> LIQ-01`. Auditoria/roles/RLS, edicion/importacion masiva de MV y motor quedan subordinados a ese orden.

## 5. Pendientes técnicos no bloqueantes

- Versionar carpeta Python explícitamente en doc/repo si aplica.
- Ejecutar validaciones SQL **v11** cuando haya PostgreSQL local / `psql`.
- No regenerar monolito legacy sin decisión explícita.
- Revisión futura AFP vs `AFP_VIGENCIA` para convergencia UI/fuente.

## 6. Pendientes visuales

Registrar en [`peticiones-estilos.md`](../peticiones-estilos.md) cuando haya cambio visual acordado; no usar el orquestador como bitácora visual.

## 7. Módulos futuros (post fases 0-8 cerradas)

- **Conceptos de remuneracion** - frente funcional importante, pero queda ordenado despues de **SEG-01**. Fase **9 documental** cerrada (diagnostico + contrato + decisiones operativas). La siguiente fase de conceptos es **CONC-02 - Conceptos gobernados para motor**, no antes de cerrar roles/permisos base. README y contratos: [`../modulos/conceptos-remuneracion/README.md`](../modulos/conceptos-remuneracion/README.md).
- **Haberes y descuentos** (refuerzo de reglas y UI).
- **Movimientos variables** - **9.4A** documental, **9.4B** modelo TS + reglas, **9.4C** SQL + repositorio, **9.4D** service fino y **9.4E** UI carga manual bajo `/remuneraciones/movimientos-variables` cerradas en alcance acordado; [`../modulos/movimientos-variables/README.md`](../modulos/movimientos-variables/README.md).
- **Proceso mensual**, **motor**, **liquidaciones**, **Previred**, **LRE** - ver [`contexto-proyecto.md`](./contexto-proyecto.md) secciones 10-12 y 15.
- **Arquitectura frontend Angular** - contrato [`../arquitectura/frontend-interfaces.md`](../arquitectura/frontend-interfaces.md): paginas wrapper en `pages/`, pantallas en `features/*/containers/`; paginas legacy con UI inline son deuda hasta migracion por fase.

### Fase 9.3A - Haberes y descuentos: vigencias, duplicados y reglas recurrentes

Estado: **Cerrada**.

Objetivo: validar asignaciones recurrentes por trabajador y concepto, bloqueando duplicados activos, rangos superpuestos y vigencias incoherentes.

Resultado: crear y actualizar asignaciones pasan por validacion central de concepto asignable y por validacion propia de vigencia/solapamiento recurrente. La edicion ignora la misma asignacion por `idAsignacion` para no autoboquearse.

No incluido: motor, liquidaciones, nomina mensual, movimientos variables, SQL destructivo, login, JWT/RLS ni rediseno visual profundo.

Pruebas: `haber-descuento-vigencia.rules.spec.ts`, `haberes-descuentos.service.spec.ts`, `npm test -- --watch=false`.

### Fase 9.3B - Haberes y descuentos: cierre/desactivacion controlada de asignaciones

Estado: **Cerrada**.

Objetivo: permitir cerrar o desactivar asignaciones recurrentes sin eliminacion fisica, conservando historial y validando coherencia de fechas/estado.

Resultado: las asignaciones recurrentes pueden terminarse de forma controlada mediante cierre/desactivacion logica. La operacion no borra historial, bloquea cierres invalidos, bloquea doble cierre, no exige que el concepto siga siendo asignable hoy y reutiliza la clasificacion de vigencia del modulo.

No incluido: delete fisico normal, auditoria avanzada, motor, liquidaciones, nomina mensual, movimientos variables, SQL destructivo, login, JWT/RLS ni rediseno visual profundo.

Pruebas: `haber-descuento-vigencia.rules.spec.ts`, `haberes-descuentos.service.spec.ts`, `npm test -- --watch=false`.

### Fase 9.3B.1 - Remuneraciones: normalizar rutas y menu del dominio

Estado: **Cerrada**.

Objetivo: que Conceptos, Haberes y descuentos, Proceso mensual y Liquidaciones compartan el mismo prefijo de rutas bajo `/remuneraciones/*`, con menu lateral y enlaces internos alineados; mantener rutas antiguas solo como redirects temporales.

Resultado: rutas oficiales `/remuneraciones/conceptos`, `/remuneraciones/haberes-descuentos`, `/remuneraciones/proceso-mensual`, `/remuneraciones/liquidaciones`, `/remuneraciones/liquidaciones/:id`. Redirects `/haberes-descuentos`, `/proceso-remuneraciones`, `/liquidaciones`, `/liquidaciones/:id` -> destinos oficiales. Sidebar y pruebas visuales de `tests/dashboard.spec.ts` usan rutas oficiales.

No incluido: reglas de negocio nuevas, filtros historicos adicionales, movimientos variables, motor, liquidaciones funcionales nuevas, SQL destructivo, login, JWT/RLS, reorganizacion fisica de carpetas `features`, rediseno visual profundo.

Pruebas: `npm test -- --watch=false`; E2E nuevo no obligatorio (normalizacion de rutas).

### Fase 9.3C - Haberes y descuentos: vista historica y filtros por vigencia

Estado: **Cerrada**.

Objetivo: exponer las asignaciones recurrentes como vista operativa por defecto y como historial consultable mediante filtros de estado de vigencia derivados.

Resultado: `HaberesDescuentosService.listarPorPersona` deriva `estadoVigencia` y `estadoVigenciaEtiqueta` con `clasificarVigenciaAsignacion`. La grilla usa filtro por estado (`OPERATIVAS`, `TODAS`, `ACTIVA`, `FUTURA`, `VENCIDA`, `CERRADA`, `INVALIDA`), con `OPERATIVAS = ACTIVA + FUTURA` como default visual. Las filas cerradas, vencidas e invalidas quedan disponibles como historial, sin accion de cierre y sin edicion operativa desde la grilla.

No incluido: motor, liquidaciones, nomina mensual, movimientos variables, auditoria avanzada, SQL destructivo, login, JWT/RLS ni rediseno visual profundo.

Pruebas: `haber-descuento-vigencia.rules.spec.ts`, `haberes-descuentos.service.spec.ts`, `npm test -- --watch=false`.

### Fase 9.4A - Movimientos variables mensuales: contrato funcional y separacion desde recurrentes

Estado: **Cerrada** (alcance **documental**).

Objetivo: definir contrato funcional de movimientos variables mensuales y separarlos de Conceptos (catalogo), Haberes recurrentes, Proceso mensual, Motor y Liquidaciones.

Resultado: queda documentado que los movimientos variables son registros puntuales por trabajador, concepto y periodo `YYYY-MM`; no reemplazan recurrentes; no calculan liquidaciones; seran entrada futura del Proceso mensual solo en estado **VALIDADO** (o equivalente). Estados, validaciones, duplicados v1, anulacion vs delete fisico y ruta planificada `/remuneraciones/movimientos-variables` en [`../modulos/movimientos-variables/`](../modulos/movimientos-variables/README.md).

No incluido: UI completa, CRUD productivo, SQL, migraciones, Supabase remoto, motor, liquidaciones, Previred/LRE, login, JWT/RLS, rediseno visual profundo.

Pruebas: no aplica cambio de codigo en esta fase; ejecutar `npm test` solo si hubo modificaciones de codigo en el mismo entregable.

### Fase 9.4B - Movimientos variables: modelo TypeScript y validaciones puras

Estado: **Cerrada**.

Objetivo: materializar tipos de dominio y helpers de validacion alineados al contrato 9.4A y a [`../modulos/movimientos-variables/decisiones-operativas.md`](../modulos/movimientos-variables/decisiones-operativas.md), antes de UI productiva y sin acoplarse a `concepto-asignabilidad.rules.ts` (validacion opcional por snapshot de concepto).

Resultado: carpeta `src/app/features/movimientos-variables/` con `models/movimiento-variable.model.ts`, `rules/movimiento-variable-validacion.rules.ts` y spec asociado; anexo técnico [`../modulos/movimientos-variables/modelo-tecnico-9-4B.md`](../modulos/movimientos-variables/modelo-tecnico-9-4B.md).

No incluido: SQL, migraciones, Supabase remoto, pantalla productiva, motor, liquidaciones, proceso mensual productivo, JWT/RLS, importadores masivos.

Pruebas: `movimiento-variable-validacion.rules.spec.ts`, `npm test -- --watch=false`.

### Fase 9.4C - Movimientos variables mensuales: SQL no destructivo y repositorio base antes de UI

Estado: **Cerrada**.

Objetivo: preparar persistencia local no destructiva y repositorio base para movimientos variables mensuales antes de implementar UI productiva.

Resultado: queda definido SQL no destructivo para `movimiento_variable_mensual` en `bd/base/v11/partes/02_tablas.sql` (y monolito integrado), script incremental idempotente `bd/base/v11/partes/14_movimiento_variable_mensual.sql`, `MovimientosVariablesRepository`, mappers, tipos manuales en `database.types.ts`, y documento de persistencia [`../modulos/movimientos-variables/persistencia-9-4C.md`](../modulos/movimientos-variables/persistencia-9-4C.md). La UI productiva, servicio con snapshot de catálogo, RLS, Supabase remoto, motor y liquidaciones quedan fuera de alcance.

No incluido: pantalla productiva, CRUD visual, motor, liquidaciones, proceso mensual productivo, Supabase remoto, RLS/JWT, SQL destructivo ni rediseno visual.

Pruebas: `movimientos-variables.mapper.spec.ts`, `movimiento-variable-validacion.rules.spec.ts`, `npm test -- --watch=false`.

### Fase 9.4D - Movimientos variables mensuales: service fino y listado base sin UI avanzada

Estado: **Cerrada**.

Objetivo: crear una capa de service fina para movimientos variables que centralice validaciones, duplicados, anulacion logica y acceso al repository antes de una UI productiva.

Resultado: `MovimientosVariablesService` en `src/app/features/movimientos-variables/services/` con tests `movimientos-variables.service.spec.ts`; listados como `MovimientoVariableListadoFila`; payload opcional `concepto` para snapshot sin acoplar a `concepto-asignabilidad.rules.ts`; documento [`../modulos/movimientos-variables/service-9-4D.md`](../modulos/movimientos-variables/service-9-4D.md). La pantalla productiva, grid avanzado, proceso mensual, motor, liquidaciones, Supabase remoto, RLS/JWT y rediseno visual quedan fuera.

No incluido: pantalla productiva, formulario visual, datagrid avanzado, proceso mensual, motor, liquidaciones, Supabase remoto, RLS/JWT, rediseno visual.

Pruebas: `movimientos-variables.service.spec.ts`, suites 9.4B/9.4C, `npm test -- --watch=false`.

### Fase 9.4E - Movimientos variables mensuales: UI carga manual controlada

Estado: **Cerrada**.

Objetivo: exponer listado y operaciones manuales de movimientos variables por periodo sin acoplar la UI al repositorio ni al motor.

Resultado: ruta `/remuneraciones/movimientos-variables` (lazy), item en menu lateral, contenedor con filtro `YYYY-MM`, `DataGrid`, alta por modal (`MovimientosVariablesService.crear` con `origen: MANUAL` y snapshot de concepto), anulacion con confirmacion y motivo opcional (`anular`), catalogos via `EmpleadosService.listar` y `HaberesDescuentosService.listarConceptos`. Redirect `/movimientos-variables` a la ruta oficial. Referencia cruzada en pantalla Haberes y descuentos. Documento [`../modulos/movimientos-variables/ui-9-4E.md`](../modulos/movimientos-variables/ui-9-4E.md).

No incluido: edicion de filas existentes en esta fase, importacion masiva, motor, liquidaciones, bloqueo duro por periodo cerrado en UI, RLS/JWT, SQL destructivo.

Pruebas: `movimientos-variables-container.spec.ts`, suites 9.4B/9.4C/9.4D, `npm test -- --watch=false`.

### CHILE-FIX-01 - Movimientos variables: catalogo + aptitud/contrato (QA-CHILE-01 ALTO-001, ALTO-002)

Estado: **Cerrada** (Angular; sin motor, liquidaciones, SQL destructivo, RLS/JWT, Previred/LRE, rediseno visual).

Objetivo: que `MovimientosVariablesService.crear` y `actualizar` no dependan de `payload.concepto` para candados; que rechacen trabajadores no aptos, no activos o sin contrato vigente en el `YYYY-MM` del movimiento.

Resultado: metodo publico `HaberesDescuentosService.resolverSnapshotConceptoParaMovimientoVariableManual`; servicio de movimientos variables inyecta `HaberesDescuentosService` y `EmpleadosService`. Documento normativo: [`../modulos/movimientos-variables/hardening-chile-fix-01.md`](../modulos/movimientos-variables/hardening-chile-fix-01.md). Seguimiento en informe QA: [`../auditorias/qa-chile-01-remuneraciones.md`](../auditorias/qa-chile-01-remuneraciones.md) seccion 17.

No incluido: periodo cerrado a carga, flag catalogo solo variable vs recurrente (ALTO-003), RLS, motor.

Pruebas: `haberes-descuentos.service.spec.ts`, `movimientos-variables.service.spec.ts`, `npm test -- --watch=false`.

### PARAM-CHILE-01 - Auditoria de parametros reales y limpieza de datos demo en proceso mensual

Estado: **Cerrada** (Angular + documentacion; sin motor, liquidaciones, Previred/LRE generados, SQL destructivo, migraciones, Supabase remoto, Python nuevo, RLS/JWT, rediseno visual profundo).

Objetivo: mitigar **QA-CHILE-01-ALTO-004**; auditar cobertura declarativa de parametros chilenos vs pantalla Proceso mensual; quitar cifras normativas demo de `proceso-remuneraciones.page.ts`.

Resultado: pagina Proceso mensual con copy neutro, sin UF/sueldo minimo/tabla 2026/totales literales; enlace a `/parametros`; pasos calculo/exportacion/cierre marcados como no disponibles. UI en `src/app/features/nomina-mensual/containers/proceso-mensual-container/`; ruta `proceso-remuneraciones.page.ts` solo wrapper. Informe [`../auditorias/param-chile-01-parametros-y-demo-proceso.md`](../auditorias/param-chile-01-parametros-y-demo-proceso.md). Seguimiento ALTO-004 en [`../auditorias/qa-chile-01-remuneraciones.md`](../auditorias/qa-chile-01-remuneraciones.md) seccion 18.

No incluido: lectura de parametros desde proceso, motor, liquidaciones, generacion Previred/LRE real.

Pruebas: `npm test -- --watch=false` (suite global; sin spec dedicado de la pagina).

### Fase 9.5A - Proceso mensual chileno: contrato funcional y prevalidaciones

Estado: **Cerrada** (Angular + documentacion; sin motor, liquidaciones, Previred/LRE, SQL destructivo, Supabase remoto, Python nuevo, RLS/JWT, rediseno visual profundo).

Objetivo: contrato funcional y primera capa de **prevalidaciones** por `YYYY-MM` usando servicios existentes (parametros, empleados, conceptos, movimientos variables); sin calcular montos ni generar liquidaciones.

Resultado: `ProcesoMensualService`, `proceso-mensual-prevalidacion.rules.ts`, modelos TS, tests; contenedor con selector de periodo, accion **Validar periodo**, paneles de estado/bloqueos/advertencias/informaciones y areas. Documentos [`../modulos/nomina-mensual/contrato-general.md`](../modulos/nomina-mensual/contrato-general.md) y [`../modulos/nomina-mensual/prevalidaciones-9-5A.md`](../modulos/nomina-mensual/prevalidaciones-9-5A.md). Haberes recurrentes por periodo queda **PENDIENTE_INTEGRACION** (mensaje INFO).

No incluido: motor, liquidaciones, Previred/LRE, lectura agregada de recurrentes por periodo, bloqueo BD de periodo.

Pruebas: `proceso-mensual-prevalidacion.rules.spec.ts`, `proceso-mensual.service.spec.ts`, `proceso-mensual-container.spec.ts`, `npm test -- --watch=false`.

### Fase 9.5B - Proceso mensual: recurrentes por mes y grupos minimos de parametros

Estado: **Cerrada** (Angular + documentacion; sin motor, liquidaciones, Previred/LRE, SQL destructivo, Supabase remoto, Python nuevo, RLS/JWT, rediseno visual profundo).

Objetivo: completar prerequisitos de **9.5A** con lectura real de **asignaciones recurrentes** intersectadas con el mes (`HaberesDescuentosService.listarAsignacionesParaPrevalidacionMensual`) y con **catalogos + fila mensual** clasificados en grupos (`revisarGruposParametrosMinimos`), sin mostrar valores normativos en UI ni simular OK sin datos.

Resultado: repositorio `listarTodasAsignacionesConConcepto`, reglas `proceso-mensual-parametros-minimos.rules.ts` y `proceso-mensual-recurrentes.rules.ts`, extension de `proceso-mensual-prevalidacion.rules.ts` y `ProcesoMensualService` (incluye `listarCatalogos`); bloqueo si hay recurrentes **INVALIDAS** o error de lectura; resumen con `parametrosGrupos` y conteos de recurrentes en contenedor. Documento [`../modulos/nomina-mensual/prevalidaciones-9-5B.md`](../modulos/nomina-mensual/prevalidaciones-9-5B.md); contrato general y 9.5A actualizados con enlaces.

No incluido: motor, liquidaciones, Previred/LRE, bloqueo duro de periodo en BD, importacion masiva de movimientos variables.

Pruebas: `proceso-mensual-parametros-minimos.rules.spec.ts`, `proceso-mensual-recurrentes.rules.spec.ts`, suites 9.5A (`proceso-mensual-prevalidacion.rules.spec.ts`, `proceso-mensual.service.spec.ts`, `proceso-mensual-container.spec.ts`), `haberes-descuentos.service.spec.ts` (bloque recurrentes), `npx ng test --watch=false`.

### Fase 9.5C - Pre-nomina funcional por periodo

Estado: **Cerrada** (Angular + documentacion; sin motor, liquidaciones, Previred/LRE, SQL, Supabase remoto, Python, RLS/JWT ni rediseÃ±o visual profundo).

Objetivo: construir una base funcional de pre-nomina por `YYYY-MM` desde la prevalidacion 9.5A/9.5B, sin calcular montos ni generar liquidaciones.

Resultado: `proceso-mensual-prenomina.rules.ts` transforma una prevalidacion en `ProcesoMensualPreNominaPeriodo`; `ProcesoMensualService.generarPreNominaPeriodo` orquesta la generacion; la UI de Proceso mensual agrega el bloque **Pre-nomina del periodo** con boton **Generar pre-nomina**, badge de estado, conteos y codigos de trazabilidad. Documento [`../modulos/nomina-mensual/prevalidaciones-9-5C.md`](../modulos/nomina-mensual/prevalidaciones-9-5C.md).

No incluido: motor, calculo de remuneraciones, liquidaciones, snapshots, cierre real, Previred, LRE, SQL, Python, migraciones, Supabase remoto ni RLS/JWT.

Pruebas: `proceso-mensual-prenomina.rules.spec.ts`, `proceso-mensual.service.spec.ts`, `proceso-mensual-container.spec.ts`, `npm test -- --watch=false`.

### MOTOR-00 - Contrato del motor de calculo

Estado: **Cerrada documental** (sin codigo funcional, sin SQL, sin migraciones, sin Python, sin Supabase remoto, sin UI nueva).

Objetivo: definir antes de MOTOR-01 el contrato tecnico, funcional y normativo que usara el futuro motor de remuneraciones.

Resultado: creados documentos de contrato, orden, entradas/salidas y casos de prueba en [`../modulos/nomina-mensual/`](../modulos/nomina-mensual/README.md). El motor queda subordinado a pre-nomina 9.5C, tablas canonicas DB-01, parametros legales vigentes, contratos, haberes/descuentos y movimientos variables validados.

No incluido: calculo real de montos, liquidaciones, snapshots, Previred, LRE, PDF, cierre de periodo, contabilidad, SQL, Python, migraciones, package changes ni Supabase remoto.

Siguiente fase recomendada: **MOTOR-01 - Implementacion inicial del motor de calculo base**.

### MOTOR-01 - Implementacion inicial del motor de calculo base

Estado: **Cerrada** (Angular + documentacion; sin SQL, migraciones, Python, Supabase remoto, cierre de periodo, snapshot definitivo, liquidacion oficial, PDF, Previred ni LRE).

Objetivo: permitir que una pre-nomina 9.5C generable produzca un resultado preliminar por trabajador, con haberes, descuentos trabajador, bases, cotizaciones basicas, liquido preliminar, issues y trazabilidad.

Resultado: `proceso-mensual-motor.rules.ts` implementa regla pura; `ProcesoMensualService.generarCalculoPeriodo` expone calculo en memoria; la UI de Proceso mensual agrega **Calcular preliminar**, resumen y tabla por trabajador. Documento: [`../modulos/nomina-mensual/motor-calculo-implementacion-01.md`](../modulos/nomina-mensual/motor-calculo-implementacion-01.md).

No incluido: gratificacion automatica compleja, impuesto unico avanzado, topes completos, cierre, liquidacion oficial, PDF, Previred, LRE, contabilidad, SQL, migraciones, Python ni Supabase remoto.

Pruebas: `proceso-mensual-motor.rules.spec.ts`, `proceso-mensual.service.spec.ts`, `proceso-mensual-container.spec.ts`, `npm test -- --watch=false`.

Siguiente fase recomendada: **MOTOR-02 - Gratificacion, impuesto unico y reglas legales avanzadas**.

### MOTOR-02 - Gratificacion, impuesto unico y reglas legales avanzadas

Estado: **Cerrada** (Angular + documentacion; sin SQL, migraciones, Python, Supabase remoto, cierre de periodo, snapshot definitivo, liquidacion oficial, PDF, Previred ni LRE).

Objetivo: acercar el calculo preliminar a una liquidacion real sin hacerlo oficial, agregando gratificacion legal controlada, impuesto unico con tabla, topes disponibles, asignacion familiar simple, jornada/IMM, issues y trazabilidad normativa.

Resultado: `proceso-mensual-motor.rules.ts` mantiene regla pura y resultado en memoria; la UI de Proceso mensual agrega columnas de gratificacion e impuesto unico; documento [`../modulos/nomina-mensual/motor-calculo-implementacion-02.md`](../modulos/nomina-mensual/motor-calculo-implementacion-02.md).

No incluido: persistencia, snapshots, cierre, liquidacion oficial, PDF, Previred, LRE, contabilidad, gratificacion por 30% de utilidades, reliquidacion anual, proporcionalidad compleja por dias, SQL, migraciones, Python ni Supabase remoto.

Pruebas: `proceso-mensual-motor.rules.spec.ts`, `proceso-mensual-container.spec.ts`, `npm test -- --watch=false`.

Siguiente fase recomendada: **MOTOR-03 - Persistencia controlada de resultados preliminares y snapshot de calculo**.

### MOTOR-03A - Contrato de persistencia y snapshot de calculo

Estado: **Cerrada documental** (sin codigo funcional, sin SQL, sin migraciones, sin Python, sin Supabase remoto, sin UI, sin servicios de escritura).

Objetivo: definir como se guardara un resultado preliminar del motor antes de crear tablas, migraciones o persistencia real.

Resultado: documento [`../modulos/nomina-mensual/motor-calculo-persistencia-03A.md`](../modulos/nomina-mensual/motor-calculo-persistencia-03A.md) con definicion de snapshot preliminar, estados permitidos, tablas candidatas, reglas de reemplazo/recalculo, `version_motor`, `hash_snapshot`, trazabilidad persistida, relacion con `periodo_remuneracion` y relacion con liquidacion oficial futura.

No incluido: creacion de tablas, migraciones, RLS, escritura en Supabase, cambios en services, UI, cierre de periodo, liquidacion oficial, PDF, Previred, LRE, contabilidad ni rectificaciones.

Pruebas: validacion documental; no se ejecutan tests de codigo porque MOTOR-03A no modifica `src/`.

Siguiente fase recomendada: **MOTOR-03B - Implementacion de persistencia controlada de snapshots preliminares**.

### MOTOR-03B - Persistencia controlada de snapshots preliminares

Estado: **Cerrada** (Angular + SQL local + documentacion; sin aplicacion remota de migracion, sin cierre de periodo, sin liquidacion oficial, sin PDF, sin Previred, sin LRE).

Objetivo: permitir guardar, consultar y reemplazar snapshots preliminares del calculo de nomina mensual para revision y recalculo posterior.

Resultado: script local `bd/base/v11/partes/15_nomina_calculo_snapshot.sql`; modelos TS de snapshot; regla pura `proceso-mensual-snapshot.rules.ts`; repository `NominaCalculoSnapshotRepository`; `ProcesoMensualService` expone guardar/consultar/listar/anular/reemplazar; UI minima en Proceso mensual para **Guardar snapshot preliminar**, **Ver snapshot activo** y **Recalcular y reemplazar**.

No incluido: aplicar migracion a Supabase remoto, liquidacion oficial, cierre, PDF, Previred, LRE, contabilidad, RLS detallado ni regeneracion de tipos Supabase.

Pruebas: `proceso-mensual-snapshot.rules.spec.ts`, `proceso-mensual.service.spec.ts`, `proceso-mensual-container.spec.ts`, `npm test -- --watch=false`.

Siguiente fase recomendada: **MOTOR-03C - Aplicacion controlada de migracion y validacion contra Supabase local/remoto**.

### MOTOR-03C - Aplicacion controlada de migracion y validacion contra Supabase

Estado: **Cerrada tecnica controlada** (BD v11 + documentacion; sin aplicacion local/remota de migracion, sin regenerar tipos, sin cambios funcionales nuevos, sin cierre, liquidacion oficial, PDF, Previred ni LRE).

Objetivo: validar el SQL de snapshots preliminares de MOTOR-03B, confirmar referencias a tablas reales, registrar la parte 15 en el flujo v11 y documentar el estado de aplicacion/tipos.

Resultado: `bd/base/v11/partes/15_nomina_calculo_snapshot.sql` revisado; PK/FK confirmadas contra `empresa(id_empresa)`, `persona(id_persona)` y `concepto(id_concepto)`; `bd/base/v11/run_all.sql` incluye la parte 15; `bd/base/v11/README.md` documenta aplicacion incremental; documento [`../modulos/nomina-mensual/motor-calculo-persistencia-03C.md`](../modulos/nomina-mensual/motor-calculo-persistencia-03C.md).

No incluido: aplicacion remota, `supabase db push`, pruebas contra BD real, regeneracion de `database.types.ts`, RLS completa, cierre de periodo, liquidacion oficial, PDF, Previred, LRE, contabilidad ni UI nueva.

Pruebas: `npm test -- --watch=false`.

Siguiente fase recomendada: **SEG-NOMINA - RLS y permisos de snapshots de nomina**.

### QA-CHILE-01 - Auditoria remuneraciones Chile (documental)

Estado: **Cerrada** (entrega de informe; sin cambios de codigo, SQL, Python ni Supabase remoto).

Objetivo: revisar el proyecto bajo enfoque chileno (conceptos, recurrentes, variables, parametros, empleados, proceso/liquidacion futuros, Previred/LRE) y priorizar brechas.

Resultado: informe [`../auditorias/qa-chile-01-remuneraciones.md`](../auditorias/qa-chile-01-remuneraciones.md) e indice [`../auditorias/README.md`](../auditorias/README.md). Siguientes pasos sugeridos en el informe (p. ej. CHILE-FIX-01, PARAM-CHILE-01, 9.5A).

No incluido: implementacion de motor, liquidaciones, RLS productivo, correcciones de codigo (solo documentacion de hallazgos).

Pruebas: no ejecutadas en esta fase (auditoria por lectura).

## 8. Criterios para avanzar de fase

- Contrato en **`docs/codex/modulos/<módulo>/`** (y stubs o temas transversales) actualizado si cambia la regla de negocio o de UI.
- Criterios de “listo” del usuario o de `AGENTS.md` cumplidos.
- Pruebas acordadas para el alcance (unit / E2E) en verde cuando apliquen.
- Sin mezclar alcances (p. ej. no meter liquidación en ficha empleados).

## 9. Orden recomendado de próximas fases

1. **Conceptos** - cerrar brechas de implementación y pruebas del contrato funcional (tras Fase 9 documental); maestro, vigencias, LRE; no mezclar con asignación por trabajador.
2. **Haberes recurrentes** (vigencia, duplicados, separación de conceptos) - fases 9.3A-9.3C y 9.3B.1 cerradas en documento y codigo segun tablero.
3. **Movimientos variables** - **9.4A** a **9.4E** cerradas en alcance acordado (incluye UI carga manual); siguiente: RLS/roles, edicion/importacion, integracion proceso mensual segun prioridad.
4. **Proceso mensual** - **9.5A** y **9.5B** cerraron **prevalidaciones** (incluye recurrentes por mes y grupos minimos de parametros) sin motor. La referencia historica a motor/liquidaciones queda subordinada al orden oficial `SEG-01 -> CONC-02 -> MOTOR-00 -> MOTOR-01 -> LIQ-01`.

## ORDEN-01 - Roadmap operativo y criterios de cierre

Estado: Cerrada.

Objetivo cumplido:

- Se consolido el roadmap operativo del ERP.
- Se separaron fases funcionales de fases visuales.
- Se definieron dependencias entre fases.
- Se definieron criterios generales de cierre.
- Se ordenaron prioridades antes de motor, liquidaciones, Previred y LRE.
- Se dejo definido que Cursor/Codex no decide el camino del proyecto; solo ejecuta fases acotadas cuando el alcance esta claro.

Documentos creados o consolidados:

- `docs/codex/orquestador/roadmap-operativo.md`
- `docs/codex/orquestador/dependencias-fases.md`
- `docs/codex/orquestador/criterios-cierre-fases.md`
- `docs/codex/orquestador/orden-prioridades.md`

No se toco:

- Codigo Angular.
- SQL.
- Python.
- UI.
- Tests.
- Configuracion real.

Siguiente fase recomendada:

1. SEG-01 - Roles, permisos, JWT/RLS base.
2. CONC-02 - Conceptos gobernados para motor.
3. MOTOR-00 - Contrato del motor de calculo.

## SEG-01 - Roles, permisos, JWT/RLS base

Estado: **En definicion**.

Objetivo:

- Definir roles base del ERP.
- Definir acciones permitidas y bloqueadas por modulo.
- Separar permisos UI, service y BD/JWT/RLS.
- Dejar claro que acciones son solo admin.
- Dejar claro que acciones quedan bloqueadas por fases futuras.
- Preparar la base para que Cursor/Codex implemente permisos sin decidir reglas de negocio.

Documento principal:

- [`matriz-roles-permisos.md`](./matriz-roles-permisos.md)

No se toco:

- Codigo Angular.
- SQL.
- Python.
- UI.
- Tests.
- Configuracion real.

Criterio para pasar a **Cerrada base**:

- `matriz-roles-permisos.md` contiene roles base.
- `matriz-roles-permisos.md` contiene matriz por modulo y accion.
- Se separa permiso UI de permiso service y BD/JWT/RLS.
- Se listan acciones criticas.
- Se listan acciones bloqueadas por fase.
- Los `A_DEFINIR` quedan resueltos o aceptados explicitamente como pendientes de subfase futura.
- Queda claro si RLS real se implementa ahora o queda para subfase posterior.

Siguiente fase logica:

1. **CONC-02 - Conceptos gobernados para motor**.
2. **MOTOR-00 - Contrato del motor de calculo**.

## DOC-04 - Integracion de documentacion nueva al repo real

Estado: **Cerrada documental**.

Objetivo cumplido:

- Se integro la nueva base documental en `docs/codex` sin copiar una raiz documental temporal al destino oficial.
- Se agrego el diccionario de tablas canonicas.
- Se integraron normativa, LRE, prevalidaciones, plan de pruebas y changelog.
- Se conservo documentacion historica valiosa, stubs y bitacoras existentes.
- Se dejo SIS como dato mensual dependiente de fuente oficial, no como constante fija.

Implementacion: **No aplica**.

Bloquea siguiente: **Si**, hasta ejecutar DB-01 y confirmar tablas canonicas contra Supabase/PostgreSQL.

No se toco:

- Codigo Angular.
- SQL.
- Python.
- Migraciones.

Siguiente fase recomendada:

1. DB-01 - Confirmar tablas canonicas contra Supabase/PostgreSQL.

## DB-01 - Confirmar tablas canonicas contra Supabase/PostgreSQL

Estado: **Cerrada documental**.

Evidencia:

- Se genero un snapshot de tipos remotos con `npx supabase gen types typescript --project-id ...`.
- No se uso `psql` porque no esta disponible en el entorno.
- `supabase db dump` no fue usable porque requiere Docker local; no se modifico la BD.

Resultado:

- Confirmadas en Supabase: `afp`, `afp_vigencia`, `salud`, `salud_plan`, `afc_parametro`, `tramo_carga`, `ley_16744_parametros`, `empresa_ley_16744`, `organismo_administrador_ley_16744`, `tabla_impuesto_unico`, `parametros_generales`, `reforma_previsional_parametro`.
- No existen: `empresa_mutual_config`, `afp_parametro`, `salud_vigencia`, `afc_vigencia`, `mutual_vigencia`, `asignacion_familiar_tramo`, `sis_parametro`, `sanna_parametro`, `topes_imponibles`.
- SIS y SANNA quedan en `parametros_generales` (`sis`, `sanna`); AFP mantiene ademas `afp_vigencia.sis`.

No se toco:

- Codigo Angular.
- SQL.
- Python.
- Migraciones.
- Supabase remoto.

Siguiente fase recomendada:

1. DOC-04-FIX - Resolver ajustes documentales pendientes detectados en auditoria de aceptacion.
2. PARAM-DB-02 - Alinear documentacion normativa y reglas de prevalidacion con los campos confirmados.

## DB-01B - Auditoria final posterior a DB-01

Estado: **Cerrada documental**.

Resultado:

- Referencias no canonicas revisadas: `empresa_mutual_config`, `sis_parametro`, `sanna_parametro`, `topes_imponibles`, `afp_parametro`, `salud_vigencia`, `afc_vigencia`, `mutual_vigencia`, `asignacion_familiar_tramo`.
- Las apariciones restantes quedan como "No usar", "No existe", tabla no confirmada o correccion historica; no se presentan como tablas reales.
- Referencias canonicas confirmadas: `empresa_ley_16744`, `parametros_generales.sis`, `afp_vigencia.sis`, `parametros_generales.sanna`.
- `docs.zip` queda fuera de DB-01B; su eliminacion o respaldo fuera del repo queda como decision futura.

No se toco:

- Codigo Angular.
- SQL.
- Python.
- Migraciones.
- `.cursor`.
- `package.json`.
- `package-lock.json`.
- Supabase remoto.

Siguiente fase recomendada:

1. Fase 9.5C - Pre-nomina funcional por periodo.
