## Actualizacion 2026-05-12 - EMP-PERFIL-LABORAL-SQL-01

## EMP-ALTA-COHERENCIA-GLOBAL-00 - Auditoría de coherencia del alta avanzada

| Campo | Estado |
|---|---|
| Estado | Documentada |
| Tipo | Documentación técnica / matriz de decisión |
| Alcance | Creación avanzada de empleados; relación laboral, tipo trabajador, contrato, jornada, Seguro de Cesantía, previsión/salud, banco, condiciones especiales y resumen final |
| Entrega | `docs/codex/modulos/empleados/alta-coherencia-global-00.md` |
| Decisión | Próxima fase recomendada: `EMP-ALTA-COHERENCIA-GLOBAL-01`, matriz única de aplicabilidad y coherencia |
| Fuera de alcance | Sin cambios Angular funcionales, SQL/RPC/RLS, motor, nómina, liquidaciones, LRE/Previred, ficha empleado, creación básica ni estilos globales |


| Fase | Estado | Resumen | Pruebas |
|---|---|---|---|
| `EMP-PERFIL-LABORAL-SQL-01` | **Implementada en ZIP** | Base SQL para condiciones especiales del trabajador: nuevas tablas canonicas `tipo_condicion_trabajador` y `persona_condicion_trabajador`, seeds minimos, RLS/permisos locales y funcion `fn_obtener_perfil_laboral_persona` para derivar tramo de edad laboral y banderas previsionales por periodo. | Validacion estatica SQL/docs; `unzip -t` del entregable. No se ejecuto BD real ni `tsc` porque la fase no toca front y el ZIP base no incluye `node_modules`. |

## Actualizacion 2026-05-12 - EMP-ADV-LAYOUT-CONSISTENCY-01

| Fase | Estado | Resumen | Pruebas |
|---|---|---|---|
| `EMP-ADV-LAYOUT-CONSISTENCY-01` | **Implementada en ZIP** | Pulido visual local de Creacion avanzada sobre la base con Honorarios aplicado: mayor ancho util del wizard, mapa lateral mas compacto, alturas minimas menos artificiales, resumen final mas denso y grillas locales de Contrato/Bancario ajustadas solo en modo avanzado. | Validacion estatica de alcance; `unzip -t` del entregable. `tsc/build` no ejecutados por ausencia de `node_modules` en el ZIP base. |

## Actualizacion 2026-05-12 - EMP-ADV-HONORARIOS-UX-01

| Fase | Estado | Resumen | Pruebas |
|---|---|---|---|
| `EMP-ADV-HONORARIOS-UX-01` | **Implementada en ZIP** | Creacion avanzada trata `Boleta de honorarios` como modo visual controlado: confirma el cambio, oculta o marca no aplicables campos dependientes, permite borrador y bloquea finalizar alta como trabajador dependiente hasta persistencia real. | `npx tsc -p tsconfig.app.json --noEmit`; `npx tsc -p tsconfig.spec.json --noEmit`; `npx ng build --configuration development`. Build productivo queda sujeto a disponibilidad de Google Fonts; sin SQL/BD. |

# Estado de fases del proyecto

## 1. Propósito

Tablero **vivo** (a actualizar al cerrar fases) con: qué está **cerrado**, qué **sigue**, qué módulos están **congelados** o **pendientes**, y enlaces a documentos y pruebas relevantes. Complementa [`contexto-proyecto.md`](./contexto-proyecto.md).

## 2. Tabla de fases

| Fase                                     | Estado      | Resumen                                                                                                                                                          | Documentos                                                                                                                                                                                                                                                                                                                       | Pruebas (referencia)                                                |
| ---------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| ORDEN-01 - Integracion final del roadmap | **Cerrada** | Roadmap oficial integrado. SEG-01 queda como siguiente fase oficial; CONC-02 despues de SEG-01; MOTOR-00 obligatorio antes de cualquier implementacion de motor. | [`roadmap-operativo.md`](./roadmap-operativo.md), [`dependencias-fases.md`](./dependencias-fases.md), [`criterios-cierre-fases.md`](./criterios-cierre-fases.md), [`orden-prioridades.md`](./orden-prioridades.md), [`mapa-documentacion.md`](./mapa-documentacion.md), [`matriz-roles-permisos.md`](./matriz-roles-permisos.md) | Validacion documental; sin codigo, SQL, Python, UI ni tests nuevos. |

| SEG-01 - Roles, permisos, JWT/RLS base | **En definicion** | Matriz documental de roles, permisos, acciones criticas, capas UI/service/BD-JWT-RLS y bloqueos por fase futura. No implementa permisos reales todavia. | [`matriz-roles-permisos.md`](./matriz-roles-permisos.md), [`criterios-cierre-fases.md`](./criterios-cierre-fases.md), [`dependencias-fases.md`](./dependencias-fases.md) | Validacion documental; sin codigo, SQL, Python, UI ni tests nuevos. |

Tabla historica:

| Fase                                                         | Estado                                  | Resumen                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Documentos                                                                                                                                                                                                                                                                                                                                       | Pruebas (referencia)                                                                                                                                                         |
| ------------------------------------------------------------ | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REM-UX-FLOWS-01 V3 - Visibilidad cliente vs aplicacion       | **Cerrada**                             | Remuneraciones separa estado/accion visible para usuario final de trazabilidad tecnica: `Preparar nomina` usa etapas de negocio y `Liquidaciones oficiales` baja la trazabilidad al detalle secundario. Sin cambios de motor, SQL ni salidas externas.                                                                                                                                                                                                                                             | [`../modulos/nomina-mensual/README.md`](../modulos/nomina-mensual/README.md), [`../modulos/liquidaciones-oficiales/README.md`](../modulos/liquidaciones-oficiales/README.md), [`../peticiones-estilos.md`](../peticiones-estilos.md)                                                                                                                                                                           | `npx ng test --watch=false`; `npm run build`                                                                                                                                 |
| 0 — Contrato Codex / `docs/codex`                            | **Cerrada**                             | `AGENTS.md`, README, manual base, guías UI/form/tablas/estilos, **`modulos/`** + `temas/`. Regla: leer orquestador + módulo antes de implementar.                                                                                                                                                                                                                                                                                                                                               | [`AGENTS.md`](../AGENTS.md), [`README.md`](../README.md), [`manual-base-proyecto.md`](../manual-base-proyecto.md), [`ui-form-guidelines.md`](../ui-form-guidelines.md), [`ui-tables.md`](../ui-tables.md), [`estilos/README.md`](../estilos/README.md), [`mapa-documentacion.md`](./mapa-documentacion.md)                                       | —                                                                                                                                                                            |
| 1 — Parámetros / período / vigencia / catálogo               | **Cerrada**                             | Período activo; mensual vs vigencia vs catálogo global; estado oficial del período; UI estabilizada; reforma/gradualidad; DataGrid y empty states; tabs/subtabs.                                                                                                                                                                                                                                                                                                                                | [`periodo-vigencia-catalogo.md`](../modulos/parametros/periodo-vigencia-catalogo.md), [`ui-parametros.md`](../modulos/parametros/ui-parametros.md), [`reforma-gradualidad.md`](../modulos/parametros/reforma-gradualidad.md), [`campos-y-listas.md`](../modulos/parametros/campos-y-listas.md)                                                   | E2E/UI según módulo Parámetros en repo                                                                                                                                       |
| 2 — Python / BD v11 / carga mensual                          | **Cerrada** (pendientes no bloqueantes) | Python v6.11; gradualidad 8,5 %; tablas alineadas a `(código, período)`; modo preparar sin datos oficiales falsos; carga mensual oficial separada.                                                                                                                                                                                                                                                                                                                                              | [`python-carga-mensual.md`](../modulos/parametros/python-carga-mensual.md), [`../../../bd/base/v11/README.md`](../../../bd/base/v11/README.md)                                                                                                                                                                                                   | Validaciones SQL v11 cuando haya BD local; scripts Python según doc                                                                                                          |
| 3 — Empleados: estados y aptitud                             | **Cerrada**                             | BORRADOR = wizard avanzado; EN_PROCESO = ficha; ACTIVO + apto = remuneraciones; `paso_alta_avanzada` manda “Continuar alta”; sin activar con defaults técnicos.                                                                                                                                                                                                                                                                                                                                 | [`contrato-general.md`](../modulos/empleados/contrato-general.md)                                                                                                                                                                                                                                                                                | Unit + E2E empleados según [`borrador-continuar-alta.md`](../modulos/empleados/borrador-continuar-alta.md) y [`tests-empleados.md`](../modulos/empleados/tests-empleados.md) |
| 4 — Helper completitud / aptitud                             | **Cerrada**                             | `evaluarCompletitudYAptitudEmpleado` en `empleado-completitud.rules.ts`; bloqueos y defaults técnicos explícitos.                                                                                                                                                                                                                                                                                                                                                                               | [`contrato-general.md`](../modulos/empleados/contrato-general.md) (sección helper)                                                                                                                                                                                                                                                               | `empleado-completitud.rules` (unit)                                                                                                                                          |
| 5 — Listado y Ficha con helper                               | **Cerrada**                             | CTAs por estado en listado; ficha con panel compacto (estado, aptitud, pendientes, acción); adapter al helper.                                                                                                                                                                                                                                                                                                                                                                                  | [`listado.md`](../modulos/empleados/listado.md), [`ficha-empleado.md`](../modulos/empleados/ficha-empleado.md), [`contrato-general.md`](../modulos/empleados/contrato-general.md)                                                                                                                                                                | `ficha-empleado-container`, listado (unit); Playwright empleados UI                                                                                                          |
| 6 — Selects vacíos / sin autoselección                       | **Cerrada**                             | Opción vacía; sin primer catálogo como elección; defaults no cuentan como selección real.                                                                                                                                                                                                                                                                                                                                                                                                       | Módulo Empleados + formularios; [`ui-form-guidelines.md`](../ui-form-guidelines.md)                                                                                                                                                                                                                                                              | Unit form/orchestrator según repo                                                                                                                                            |
| 7 — Rehidratación borrador avanzado                          | **Cerrada**                             | DRAFT‑\*, Sin cargo, sueldo 0, APVI incompleto no como reales; paso 9 con pendientes reales.                                                                                                                                                                                                                                                                                                                                                                                                    | [`borrador-continuar-alta.md`](../modulos/empleados/borrador-continuar-alta.md), [`contrato-general.md`](../modulos/empleados/contrato-general.md)                                                                                                                                                                                               | `empleado-borrador-hidratacion` (unit); E2E opcionales con `E2E_EMPLEADOS_BORRADOR`                                                                                          |
| 8 — Validar para remuneraciones (Ficha)                      | **Cerrada**                             | Opción B: ficha completa **no** apta sola; CTA **Validar para remuneraciones**; confirmación; `EmpleadosRepository.validarFichaParaRemuneraciones` reevalúa helper y persiste solo `persona` (`VALIDO`, `apto_para_remuneraciones`, `ACTIVO` si aplica, `fecha_activacion`, `paso_alta_avanzada` null). Condiciones UI y exclusiones: [`validar-remuneraciones.md`](../modulos/empleados/validar-remuneraciones.md) y §21 de [`contrato-general.md`](../modulos/empleados/contrato-general.md). | [`validar-remuneraciones.md`](../modulos/empleados/validar-remuneraciones.md)                                                                                                                                                                                                                                                                    | Unit: `ficha-empleado-container.spec.ts`, `empleados.service.spec.ts`; E2E ficha opcional según entorno                                                                      |
| 9 — Conceptos: diagnóstico, contrato y decisiones operativas | **Cerrada** (documental)                | Inventario de ruta `/remuneraciones/conceptos`, contenedor, servicio/repositorio, tablas `concepto` / `catalogo_lre` / `regla_concepto_calculo`, RLS y seeds Python; **contrato funcional** y **decisiones operativas** (permisos, asignables, LRE, vigencias, baja). Brechas de implementación: JWT/roles, RLS productivo, UI de reglas, E2E ruta (Fase 9.2).                                                                                                                                  | [`diagnostico-fase-9.md`](../modulos/conceptos-remuneracion/diagnostico-fase-9.md), [`decisiones-operativas.md`](../modulos/conceptos-remuneracion/decisiones-operativas.md), [`contrato-funcional.md`](../modulos/conceptos-remuneracion/contrato-funcional.md), [`contrato-general.md`](../modulos/conceptos-remuneracion/contrato-general.md) | Ver [`contrato-funcional.md`](../modulos/conceptos-remuneracion/contrato-funcional.md) §8; snapshot `/remuneraciones/conceptos` pendiente en `tests/dashboard.spec.ts`       |

## 3. Fases cerradas (lista corta)

0–8 según tabla; **9** cerrada en alcance **documental** (diagnóstico + contrato funcional + **decisiones operativas**). El frente **Conceptos** sigue abierto en implementación/pruebas hasta cerrar brechas de Fase **9.2** (JWT/RLS, alineación listados, E2E, etc.).

## 4. Fase actual / siguiente

**Fase fuerte Conceptos (implementación — 9.2):** **9.2A** cerró listado base (grilla, filtros, `esConceptoAsignable`, smoke E2E `tests/conceptos-remuneracion-listado.spec.ts`). **9.2B** cerró **detalle por Revisar** (modal, `concepto-acciones.rules.ts`, blindaje en grilla). **9.2C** alineó **Haberes y descuentos** al catálogo: `listarConceptos` y validación de alta/edición usan la **misma regla central** que Conceptos; tests unit en `haberes-descuentos.service.spec.ts`. **Siguiente** en 9.2: roles/JWT, `APORTE` solo Admin, RLS, reglas de cálculo en UI, E2E visual ampliado. Brechas: [`diagnostico-fase-9.md`](../modulos/conceptos-remuneracion/diagnostico-fase-9.md) §8, [`decisiones-operativas.md`](../modulos/conceptos-remuneracion/decisiones-operativas.md) §10–§11, [`contrato-funcional.md`](../modulos/conceptos-remuneracion/contrato-funcional.md) §4–§11. Punto de entrada: [`../modulos/conceptos-remuneracion/README.md`](../modulos/conceptos-remuneracion/README.md). Marco UX: [`diseno-operativo-erp.md`](./diseno-operativo-erp.md) §6. Contexto: [`contexto-proyecto.md`](./contexto-proyecto.md) §10 y §12.

**Haberes y descuentos 9.3A-9.3C:** cerradas. Quedan implementadas vigencias/duplicados recurrentes, cierre/desactivacion controlada y vista historica con filtro de estado derivado. **Fase 9.3B.1** normalizo rutas y menu del dominio Remuneraciones bajo `/remuneraciones/*` (ver seccion dedicada abajo). **Fase 9.4A** cerro el **contrato documental** de **Movimientos variables mensuales** (separacion de recurrentes y de Conceptos; sin SQL ni UI productiva). **Fase 9.4B** agrego **modelo TypeScript y reglas puras** con tests unitarios (sin CRUD productivo ni SQL). **Fase 9.4C** agrego **DDL no destructivo** (`movimiento_variable_mensual`), script incremental `14_*.sql`, **repositorio y mappers** con validacion alineada a 9.4B (sin UI productiva, sin RLS, sin motor). **Fase 9.4D** agrego **`MovimientosVariablesService`** (capa fina sobre el repository, listado base como filas, tests con mock). **Fase 9.4E** agrego **UI de carga manual controlada** bajo `/remuneraciones/movimientos-variables` (listado por periodo, alta manual, anulacion con confirmacion; sin repository en UI). **CHILE-FIX-01** endurecio **crear/actualizar**: concepto desde catalogo (`HaberesDescuentosService`) y aptitud/contrato en periodo (`EmpleadosService`); ver [`../modulos/movimientos-variables/hardening-chile-fix-01.md`](../modulos/movimientos-variables/hardening-chile-fix-01.md) y seguimiento en [`../auditorias/qa-chile-01-remuneraciones.md`](../auditorias/qa-chile-01-remuneraciones.md). **PARAM-CHILE-01** limpio la UI de **Proceso mensual** frente a datos normativos demo (**ALTO-004**); informe [`../auditorias/param-chile-01-parametros-y-demo-proceso.md`](../auditorias/param-chile-01-parametros-y-demo-proceso.md). **Fase 9.5A** agrego **prevalidaciones** de proceso mensual (`ProcesoMensualService`, reglas puras, UI minima con lectura real vía servicios existentes; sin motor ni liquidaciones); ver [`../modulos/nomina-mensual/prevalidaciones-9-5A.md`](../modulos/nomina-mensual/prevalidaciones-9-5A.md). **Fase 9.5B** agrego **haberes recurrentes** filtrados al `YYYY-MM`, **grupos minimos de parametros** (`listarCatalogos` + `revisarGruposParametrosMinimos`) y resumen en contenedor; ver [`../modulos/nomina-mensual/prevalidaciones-9-5B.md`](../modulos/nomina-mensual/prevalidaciones-9-5B.md). Punto de entrada movimientos variables: [`../modulos/movimientos-variables/README.md`](../modulos/movimientos-variables/README.md). Punto de entrada proceso mensual: [`../modulos/nomina-mensual/README.md`](../modulos/nomina-mensual/README.md). Siguiente segun roadmap: `SEG-01 -> CONC-02 -> MOTOR-00 -> MOTOR-01 -> LIQ-01`. Auditoria/roles/RLS, edicion/importacion masiva de MV y motor quedan subordinados a ese orden.

## 5. Pendientes técnicos no bloqueantes

- Versionar carpeta Python explícitamente en doc/repo si aplica.
- Ejecutar validaciones SQL **v11** cuando haya PostgreSQL local / `psql`.
- No regenerar monolito legacy sin decisión explícita.
- Revisión futura AFP vs `AFP_VIGENCIA` para convergencia UI/fuente.

## 6. Pendientes visuales

Registrar en [`peticiones-estilos.md`](../peticiones-estilos.md) cuando haya cambio visual acordado; no usar el orquestador como bitácora visual.

## 7. Módulos futuros (post fases 0–8 cerradas)

- **Conceptos de remuneracion** — frente funcional importante, pero queda ordenado despues de **SEG-01**. Fase **9 documental** cerrada (diagnostico + contrato + decisiones operativas). La siguiente fase de conceptos es **CONC-02 - Conceptos gobernados para motor**, no antes de cerrar roles/permisos base. README y contratos: [`../modulos/conceptos-remuneracion/README.md`](../modulos/conceptos-remuneracion/README.md).
- **Haberes y descuentos** (refuerzo de reglas y UI).
- **Movimientos variables** — **9.4A** documental, **9.4B** modelo TS + reglas, **9.4C** SQL + repositorio, **9.4D** service fino y **9.4E** UI carga manual bajo `/remuneraciones/movimientos-variables` cerradas en alcance acordado; [`../modulos/movimientos-variables/README.md`](../modulos/movimientos-variables/README.md).
- **Proceso mensual**, **motor**, **liquidaciones**, **Previred**, **LRE** — ver [`contexto-proyecto.md`](./contexto-proyecto.md) secciones 10–12 y 15.
- **Arquitectura frontend Angular** — contrato [`../arquitectura/frontend-interfaces.md`](../arquitectura/frontend-interfaces.md): paginas wrapper en `pages/`, pantallas en `features/*/containers/`; paginas legacy con UI inline son deuda hasta migracion por fase.

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

1. **Conceptos** — cerrar brechas de implementación y pruebas del contrato funcional (tras Fase 9 documental); maestro, vigencias, LRE; no mezclar con asignación por trabajador.
2. **Haberes recurrentes** (vigencia, duplicados, separación de conceptos) — fases 9.3A–9.3C y 9.3B.1 cerradas en documento y codigo segun tablero.
3. **Movimientos variables** — **9.4A** a **9.4E** cerradas en alcance acordado (incluye UI carga manual); siguiente: RLS/roles, edicion/importacion, integracion proceso mensual segun prioridad.
4. **Proceso mensual** — **9.5A** y **9.5B** cerraron **prevalidaciones** (incluye recurrentes por mes y grupos minimos de parametros) sin motor. La referencia historica a motor/liquidaciones queda subordinada al orden oficial `SEG-01 -> CONC-02 -> MOTOR-00 -> MOTOR-01 -> LIQ-01`.

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

<!-- UX-COMERCIAL-01-ESTADO -->

## Actualizacion 2026-05-10 - REM-UX-FLOWS-01 V2

| Fase | Estado | Resumen | Documentos | Pruebas |
|---|---|---|---|---|
| `REM-UX-FLOWS-01 V2` | **Implementada** | Se normaliza periodo activo global y accion principal unica en flujos de Remuneraciones. `Preparar nomina` y `Liquidaciones oficiales` dejan de duplicar selector local editable; se auditan Dashboard, Reportes, Movimientos del mes, Asignaciones recurrentes y Conceptos. | [`../CHANGELOG.md`](../CHANGELOG.md), [`../modulos/nomina-mensual/README.md`](../modulos/nomina-mensual/README.md), [`../modulos/liquidaciones-oficiales/README.md`](../modulos/liquidaciones-oficiales/README.md), [`../peticiones-estilos.md`](../peticiones-estilos.md) | `npx ng test --watch=false`; `npm run build` |

## Actualizacion 2026-05-10 - Hito nomina/liquidaciones y foco UX

| Fase | Estado | Resumen | Documentos | Pruebas |
|---|---|---|---|---|
| `LIQ-DB-APPLY-01` | **Ejecutada** | Liquidaciones oficiales internas validadas en BD real/controlada para `2026-04`: 1 trabajador, 8 conceptos, haberes `750001.88`, descuentos `588301.48`, liquido `161700.40`, duplicados activos 0. | [`../modulos/liquidaciones-oficiales/README.md`](../modulos/liquidaciones-oficiales/README.md), [`../fases/liquidaciones/LIQ-DB-APPLY-01.md`](../fases/liquidaciones/LIQ-DB-APPLY-01.md) | E2E nomina OK; E2E liquidaciones OK; build OK; 433 tests OK |
| `LIQ-OFICIAL-01` | **Implementada y validada** | Liquidaciones oficiales internas v1 desde snapshot cerrado; no recalcula; sin PDF/firma/envio/Previred/LRE/banco/contabilidad. | [`../modulos/liquidaciones-oficiales/contrato-general.md`](../modulos/liquidaciones-oficiales/contrato-general.md), [`../fases/liquidaciones/LIQ-OFICIAL-01.md`](../fases/liquidaciones/LIQ-OFICIAL-01.md) | Validada por `LIQ-DB-APPLY-01` |
| `UX-COMERCIAL-01` | **Ejecutada T00-T09** | Redisenio usable/comercial aplicado en shell, Preparar nomina, Liquidaciones, Detalle, Dashboard/Reportes, Movimientos y Asignaciones. Acciones futuras quedan separadas/deshabilitadas. | [`../ux-comercial/README.md`](../ux-comercial/README.md), [`../fases/ux-comercial/UX-COMERCIAL-01.md`](../fases/ux-comercial/UX-COMERCIAL-01.md) | Unit/build ejecutados en la fase |

## LRE-CONCEPT-RULES-01 - Estrategia LRE para conceptos no directos

| Campo | Estado |
|---|---|
| Estado | Implementada en ZIP, pendiente de aplicar en BD real/controlada |
| Tipo | SQL + documentacion |
| Alcance | Conceptos no directos LRE: INASISTENCIA, ZONA_EXTREMA, AFP_EMPLEADOR |
| Entrega | `25_lre_concept_rules.sql`, columnas de estrategia en `concepto`, validaciones 24-26 |
| Fuera de alcance | Exportador LRE, envio DT, motor, formulas, liquidaciones, RPC/RLS, BD real |

Decision central: `id_catalogo_lre` no es la unica forma de cumplir LRE. Un concepto sin codigo directo solo es error si `estrategia_lre = DIRECTO` y `requiere_exportacion_lre = TRUE`.

## Actualizacion 2026-05-11 - EMP-ADV-VALIDATION-CL-02

| Fase | Estado | Resumen | Pruebas |
|---|---|---|---|
| `EMP-ADV-VALIDATION-CL-02` | **Implementada** | Ajusta validaciones chilenas de Creacion avanzada para mostrarlas por accion usando `app-message-box`; elimina enfoque de tarjeta fija por paso; mantiene Siguiente flexible, borrador minimo y Finalizar alta estricto. | `npx tsc -p tsconfig.app.json --noEmit` OK; `npx tsc -p tsconfig.spec.json --noEmit` OK; build bloqueado en sandbox por binarios Windows de node_modules. |

## Actualizacion 2026-05-12 - EMP-PERFIL-LABORAL-UI-01

| Fase | Estado | Resumen | Pruebas |
|---|---|---|---|
| `EMP-PERFIL-LABORAL-UI-01` | **Implementada en ZIP** | Creacion avanzada incorpora perfil laboral/previsional: edad laboral derivada por fecha, condiciones especiales respaldables, vigencia, observacion, resumen final y persistencia en `persona_condicion_trabajador` usando el catalogo SQL existente. El pulido posterior lo separa como paso propio antes del resumen. Honorarios se mantiene no aplicable. | `npx tsc -p tsconfig.app.json --noEmit` OK; `npx tsc -p tsconfig.spec.json --noEmit` OK; `unzip -t` OK. `ng build --configuration development` no cerro en sandbox por timeout. |



## Actualizacion 2026-05-12 - EMP-PERFIL-LABORAL-UI-01-POLISH

| Fase | Estado | Resumen | Pruebas |
|---|---|---|---|
| `EMP-PERFIL-LABORAL-UI-01-POLISH` | **Implementada en ZIP** | Creacion avanzada separa `Perfil laboral y condiciones` como paso propio despues de Banco y antes de Resumen final. El paso de asignaciones vuelve a quedar enfocado en cargas, zona extrema y semana corrida. La maqueta del perfil se alinea a los otros pasos con bloques compactos, cabeceras neutras y respaldo bajo demanda. | `npm ci --ignore-scripts` OK; `npx tsc -p tsconfig.app.json --noEmit` OK; `npx tsc -p tsconfig.spec.json --noEmit` OK; `npm run build -- --configuration development` no cerro en sandbox por timeout, sin error de codigo antes del corte. |

## Actualizacion 2026-05-12 - EMP-CONDICIONES-ESPECIALES-UX-01

| Fase | Estado | Resumen | Pruebas |
|---|---|---|---|
| `EMP-CONDICIONES-ESPECIALES-UX-01` | **Implementada en ZIP** | Creacion avanzada mantiene el paso despues de Banco, pero lo reenfoca como `Condiciones especiales`: revision administrativa detectada, seleccion `Solo si aplica`, estado estandar cuando no hay condiciones y resumen final compacto. | `npm ci --ignore-scripts` OK; `npx tsc -p tsconfig.app.json --noEmit` OK; `npx tsc -p tsconfig.spec.json --noEmit` OK; `npm run build -- --configuration development` no cerro en sandbox por timeout, sin error de codigo antes del corte. |

## Actualizacion 2026-05-12 - EMP-CONDICIONES-ESPECIALES-AUTODETECT-01

| Fase | Estado | Resumen | Validacion |
|------|--------|---------|------------|
| `EMP-CONDICIONES-ESPECIALES-AUTODETECT-01` | **Implementada en ZIP** | Creacion avanzada pre-marca condiciones especiales cuando la informacion ya fue capturada en pasos previos: menor de 18 por fecha nacimiento/ingreso, categoria base derivada desde relacion laboral y regimen previsional `NINGUNA` como exencion a revisar. La UI muestra el origen como `Detectada` y conserva revision/edicion RRHH. | `npm ci --ignore-scripts` OK; `npx tsc -p tsconfig.app.json --noEmit` OK; `npx tsc -p tsconfig.spec.json --noEmit` OK; `npm run build -- --configuration development` no cerro en sandbox por timeout, sin error de codigo antes del corte. |

## EMP-ALTA-REGLAS-COHERENCIA-01 - Cerrada

Fecha: 2026-05-13

Estado: cerrada.

Alcance aplicado:

- Alta avanzada incorpora una capa central de coherencia administrativa en `src/app/features/empleados/rules/empleado-alta-coherencia.rules.ts`.
- La coherencia no bloquea automaticamente ni modifica datos en silencio. Cuando hay una recomendacion, `app-message-box` permite aplicar la correccion sugerida o mantener la revision.
- Casos cubiertos en esta fase:
  - Seguro de Cesantia activo/no activo segun relacion laboral, contrato, menor de edad, pensionado y tecnico extranjero exento.
  - Jornada sobre maximo administrativo 42 horas, o 30 horas en jornada parcial/menor de edad.
  - Regimen previsional `NINGUNA` sin condicion especial previsional asociada.
  - Menor de edad sin condicion administrativa confirmada.
- Resumen final muestra `Coherencia administrativa` para dejar visibles las revisiones mantenidas por RRHH.

Restricciones respetadas:

- Sin SQL/RPC/RLS ni cambios de BD.
- Sin motor de calculo, nomina, liquidaciones, LRE, Previred ni formulas de montos.
- Sin cambios a creacion basica, ficha empleado ni persistencia final de honorarios.
- Sin estilos globales.

Validaciones realizadas:

- `npm ci --ignore-scripts` OK.
- `npx tsc -p tsconfig.app.json --noEmit` OK.
- `npx tsc -p tsconfig.spec.json --noEmit` OK.
- `npm run build -- --configuration development` OK con warning preexistente de orden de `@import` en `src/styles/tailwind.css`.
- `npx vitest run src/app/features/empleados/rules/empleado-alta-coherencia.rules.spec.ts` OK, 5 tests.
- `npm test -- --watch=false` compilo suite, pero quedo en timeout de sandbox durante ejecucion general.


## EMP-TIPO-TRABAJADOR-FLOW-01 - Categoria base derivada

| Campo | Estado |
|---|---|
| Estado | Implementada en ZIP |
| Tipo | UI + logica local de Creacion avanzada |
| Alcance | `tipo_trabajador` se deriva desde relacion laboral: `CONTRATO` -> `DEPENDIENTE`, `HONORARIOS` -> `INDEPENDIENTE`; las condiciones especiales no se detectan desde ese catalogo. |
| Fuera de alcance | SQL/RPC/RLS, motor, nomina, liquidaciones, ficha empleado, creacion basica, fuentes canonicas futuras para pensionado/invalidez/extranjero/discapacidad. |
| Validacion | `tsc app/spec`, build development y specs de reglas. |
