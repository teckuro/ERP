# Estado de fases del proyecto

## 1. Propósito

Tablero **vivo** (a actualizar al cerrar fases) con: qué está **cerrado**, qué **sigue**, qué módulos están **congelados** o **pendientes**, y enlaces a documentos y pruebas relevantes. Complementa [`contexto-proyecto.md`](./contexto-proyecto.md).

## 2. Tabla de fases

| Fase | Estado | Resumen | Documentos | Pruebas (referencia) |
|------|--------|---------|------------|----------------------|
| 0 — Contrato Codex / `docs/codex` | **Cerrada** | `AGENTS.md`, README, manual base, guías UI/form/tablas/estilos, **`modulos/`** + `temas/`. Regla: leer orquestador + módulo antes de implementar. | [`AGENTS.md`](../AGENTS.md), [`README.md`](../README.md), [`manual-base-proyecto.md`](../manual-base-proyecto.md), [`ui-form-guidelines.md`](../ui-form-guidelines.md), [`ui-tables.md`](../ui-tables.md), [`estilos/README.md`](../estilos/README.md), [`mapa-documentacion.md`](./mapa-documentacion.md) | — |
| 1 — Parámetros / período / vigencia / catálogo | **Cerrada** | Período activo; mensual vs vigencia vs catálogo global; estado oficial del período; UI estabilizada; reforma/gradualidad; DataGrid y empty states; tabs/subtabs. | [`periodo-vigencia-catalogo.md`](../modulos/parametros/periodo-vigencia-catalogo.md), [`ui-parametros.md`](../modulos/parametros/ui-parametros.md), [`reforma-gradualidad.md`](../modulos/parametros/reforma-gradualidad.md), [`campos-y-listas.md`](../modulos/parametros/campos-y-listas.md) | E2E/UI según módulo Parámetros en repo |
| 2 — Python / BD v11 / carga mensual | **Cerrada** (pendientes no bloqueantes) | Python v6.11; gradualidad 8,5 %; tablas alineadas a `(código, período)`; modo preparar sin datos oficiales falsos; carga mensual oficial separada. | [`python-carga-mensual.md`](../modulos/parametros/python-carga-mensual.md), [`../../../bd/base/v11/README.md`](../../../bd/base/v11/README.md) | Validaciones SQL v11 cuando haya BD local; scripts Python según doc |
| 3 — Empleados: estados y aptitud | **Cerrada** | BORRADOR = wizard avanzado; EN_PROCESO = ficha; ACTIVO + apto = remuneraciones; `paso_alta_avanzada` manda “Continuar alta”; sin activar con defaults técnicos. | [`contrato-general.md`](../modulos/empleados/contrato-general.md) | Unit + E2E empleados según [`borrador-continuar-alta.md`](../modulos/empleados/borrador-continuar-alta.md) y [`tests-empleados.md`](../modulos/empleados/tests-empleados.md) |
| 4 — Helper completitud / aptitud | **Cerrada** | `evaluarCompletitudYAptitudEmpleado` en `empleado-completitud.rules.ts`; bloqueos y defaults técnicos explícitos. | [`contrato-general.md`](../modulos/empleados/contrato-general.md) (sección helper) | `empleado-completitud.rules` (unit) |
| 5 — Listado y Ficha con helper | **Cerrada** | CTAs por estado en listado; ficha con panel compacto (estado, aptitud, pendientes, acción); adapter al helper. | [`listado.md`](../modulos/empleados/listado.md), [`ficha-empleado.md`](../modulos/empleados/ficha-empleado.md), [`contrato-general.md`](../modulos/empleados/contrato-general.md) | `ficha-empleado-container`, listado (unit); Playwright empleados UI |
| 6 — Selects vacíos / sin autoselección | **Cerrada** | Opción vacía; sin primer catálogo como elección; defaults no cuentan como selección real. | Módulo Empleados + formularios; [`ui-form-guidelines.md`](../ui-form-guidelines.md) | Unit form/orchestrator según repo |
| 7 — Rehidratación borrador avanzado | **Cerrada** | DRAFT‑*, Sin cargo, sueldo 0, APVI incompleto no como reales; paso 9 con pendientes reales. | [`borrador-continuar-alta.md`](../modulos/empleados/borrador-continuar-alta.md), [`contrato-general.md`](../modulos/empleados/contrato-general.md) | `empleado-borrador-hidratacion` (unit); E2E opcionales con `E2E_EMPLEADOS_BORRADOR` |
| 8 — Validar para remuneraciones (Ficha) | **Cerrada** | Opción B: ficha completa **no** apta sola; CTA **Validar para remuneraciones**; confirmación; `EmpleadosRepository.validarFichaParaRemuneraciones` reevalúa helper y persiste solo `persona` (`VALIDO`, `apto_para_remuneraciones`, `ACTIVO` si aplica, `fecha_activacion`, `paso_alta_avanzada` null). Condiciones UI y exclusiones: [`validar-remuneraciones.md`](../modulos/empleados/validar-remuneraciones.md) y §21 de [`contrato-general.md`](../modulos/empleados/contrato-general.md). | [`validar-remuneraciones.md`](../modulos/empleados/validar-remuneraciones.md) | Unit: `ficha-empleado-container.spec.ts`, `empleados.service.spec.ts`; E2E ficha opcional según entorno |
| 9 — Conceptos: diagnóstico, contrato y decisiones operativas | **Cerrada** (documental) | Inventario de ruta `/remuneraciones/conceptos`, contenedor, servicio/repositorio, tablas `concepto` / `catalogo_lre` / `regla_concepto_calculo`, RLS y seeds Python; **contrato funcional** y **decisiones operativas** (permisos, asignables, LRE, vigencias, baja). Brechas de implementación: JWT/roles, RLS productivo, UI de reglas, E2E ruta (Fase 9.2). | [`diagnostico-fase-9.md`](../modulos/conceptos-remuneracion/diagnostico-fase-9.md), [`decisiones-operativas.md`](../modulos/conceptos-remuneracion/decisiones-operativas.md), [`contrato-funcional.md`](../modulos/conceptos-remuneracion/contrato-funcional.md), [`contrato-general.md`](../modulos/conceptos-remuneracion/contrato-general.md) | Ver [`contrato-funcional.md`](../modulos/conceptos-remuneracion/contrato-funcional.md) §8; snapshot `/remuneraciones/conceptos` pendiente en `tests/dashboard.spec.ts` |

## 3. Fases cerradas (lista corta)

0–8 según tabla; **9** cerrada en alcance **documental** (diagnóstico + contrato funcional + **decisiones operativas**). El frente **Conceptos** sigue abierto en implementación/pruebas hasta cerrar brechas de Fase **9.2** (JWT/RLS, alineación listados, E2E, etc.).

## 4. Fase actual / siguiente

**Fase fuerte Conceptos (implementación — 9.2):** **9.2A** cerró listado base (grilla, filtros, `esConceptoAsignable`, smoke E2E `tests/conceptos-remuneracion-listado.spec.ts`). **9.2B** cerró **detalle por Revisar** (modal, `concepto-acciones.rules.ts`, blindaje en grilla). **9.2C** alineó **Haberes y descuentos** al catálogo: `listarConceptos` y validación de alta/edición usan la **misma regla central** que Conceptos; tests unit en `haberes-descuentos.service.spec.ts`. **Siguiente** en 9.2: roles/JWT, `APORTE` solo Admin, RLS, reglas de cálculo en UI, E2E visual ampliado. Brechas: [`diagnostico-fase-9.md`](../modulos/conceptos-remuneracion/diagnostico-fase-9.md) §8, [`decisiones-operativas.md`](../modulos/conceptos-remuneracion/decisiones-operativas.md) §10–§11, [`contrato-funcional.md`](../modulos/conceptos-remuneracion/contrato-funcional.md) §4–§11. Punto de entrada: [`../modulos/conceptos-remuneracion/README.md`](../modulos/conceptos-remuneracion/README.md). Marco UX: [`diseno-operativo-erp.md`](./diseno-operativo-erp.md) §6. Contexto: [`contexto-proyecto.md`](./contexto-proyecto.md) §10 y §12.


**Haberes y descuentos 9.3A-9.3C:** cerradas. Quedan implementadas vigencias/duplicados recurrentes, cierre/desactivacion controlada y vista historica con filtro de estado derivado. **Fase 9.3B.1** normalizo rutas y menu del dominio Remuneraciones bajo `/remuneraciones/*` (ver seccion dedicada abajo). Siguiente natural: auditoria/roles/RLS o integracion posterior con movimientos variables y proceso mensual, sin mezclar con motor ni liquidaciones.

## 5. Pendientes técnicos no bloqueantes

- Versionar carpeta Python explícitamente en doc/repo si aplica.
- Ejecutar validaciones SQL **v11** cuando haya PostgreSQL local / `psql`.
- No regenerar monolito legacy sin decisión explícita.
- Revisión futura AFP vs `AFP_VIGENCIA` para convergencia UI/fuente.

## 6. Pendientes visuales

Registrar en [`peticiones-estilos.md`](../peticiones-estilos.md) cuando haya cambio visual acordado; no usar el orquestador como bitácora visual.

## 7. Módulos futuros (post fases 0–8 cerradas)

- **Conceptos de remuneración** — **fase fuerte en ejecución**; Fase **9 documental** cerrada (diagnóstico + contrato + decisiones operativas). README y contratos: [`../modulos/conceptos-remuneracion/README.md`](../modulos/conceptos-remuneracion/README.md).
- **Haberes y descuentos** (refuerzo de reglas y UI).
- **Movimientos variables**, **proceso mensual**, **motor**, **liquidaciones**, **Previred**, **LRE** — ver [`contexto-proyecto.md`](./contexto-proyecto.md) secciones 10–12 y 15.

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

## 8. Criterios para avanzar de fase

- Contrato en **`docs/codex/modulos/<módulo>/`** (y stubs o temas transversales) actualizado si cambia la regla de negocio o de UI.
- Criterios de “listo” del usuario o de `AGENTS.md` cumplidos.
- Pruebas acordadas para el alcance (unit / E2E) en verde cuando apliquen.
- Sin mezclar alcances (p. ej. no meter liquidación en ficha empleados).

## 9. Orden recomendado de próximas fases

1. **Conceptos** — cerrar brechas de implementación y pruebas del contrato funcional (tras Fase 9 documental); maestro, vigencias, LRE; no mezclar con asignación por trabajador.
2. **Haberes recurrentes** (vigencia, duplicados, separación de conceptos).
3. **Movimientos variables**.
4. **Proceso mensual guiado** → **motor** → **liquidaciones** → integraciones **Previred / LRE**.

