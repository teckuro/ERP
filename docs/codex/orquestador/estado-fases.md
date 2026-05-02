# Estado de fases del proyecto

## 1. Propósito

Tablero ** vivo** (a actualizar al cerrar fases) con: qué está **cerrado**, qué **sigue**, qué módulos están **congelados** o **pendientes**, y enlaces a documentos y pruebas relevantes. Complementa [`contexto-proyecto.md`](./contexto-proyecto.md).

## 2. Tabla de fases

| Fase | Estado | Resumen | Documentos | Pruebas (referencia) |
|------|--------|---------|------------|----------------------|
| 0 — Contrato Codex / `docs/codex` | **Cerrada** | `AGENTS.md`, README, manual base, guías UI/form/tablas/estilos, temas. Regla: leer contrato + tema antes de implementar. | [`AGENTS.md`](../AGENTS.md), [`README.md`](../README.md), [`manual-base-proyecto.md`](../manual-base-proyecto.md), [`ui-form-guidelines.md`](../ui-form-guidelines.md), [`ui-tables.md`](../ui-tables.md), [`estilos/README.md`](../estilos/README.md) | — |
| 1 — Parámetros / período / vigencia / catálogo | **Cerrada** | Período activo; mensual vs vigencia vs catálogo global; estado oficial del período; UI estabilizada; reforma/gradualidad; DataGrid y empty states; tabs/subtabs. | [`parametros-vigencia-y-periodo.md`](../temas/parametros-vigencia-y-periodo.md), [`parametros-ui-estandar.md`](../temas/parametros-ui-estandar.md), [`reforma-pensiones-gradualidad.md`](../temas/reforma-pensiones-gradualidad.md), [`parametros-generales-campos-y-listas.md`](../temas/parametros-generales-campos-y-listas.md) | E2E/UI según módulo Parámetros en repo |
| 2 — Python / BD v11 / carga mensual | **Cerrada** (pendientes no bloqueantes) | Python v6.11; gradualidad 8,5 %; tablas alineadas a `(código, período)`; modo preparar sin datos oficiales falsos; carga mensual oficial separada. | [`python-parametros-carga-mensual.md`](../temas/python-parametros-carga-mensual.md), [`../../../bd/base/v11/README.md`](../../../bd/base/v11/README.md) | Validaciones SQL v11 cuando haya BD local; scripts Python según doc |
| 3 — Empleados: estados y aptitud | **Cerrada** | BORRADOR = wizard avanzado; EN_PROCESO = ficha; ACTIVO + apto = remuneraciones; `paso_alta_avanzada` manda “Continuar alta”; sin activar con defaults técnicos. | [`empleados-estados-completitud-aptitud.md`](../temas/empleados-estados-completitud-aptitud.md) | Unit + E2E empleados según `creacion-avanzada-borrador-tests.md` |
| 4 — Helper completitud / aptitud | **Cerrada** | `evaluarCompletitudYAptitudEmpleado` en `empleado-completitud.rules.ts`; bloqueos y defaults técnicos explícitos. | Mismo tema empleados § helper | `empleado-completitud.rules` (unit) |
| 5 — Listado y Ficha con helper | **Cerrada** | CTAs por estado en listado; ficha con panel compacto (estado, aptitud, pendientes, acción); adapter al helper. | [`flujo-edicion-ficha-empleado.md`](../temas/flujo-edicion-ficha-empleado.md), tema empleados | `ficha-empleado-container`, listado (unit); Playwright empleados UI |
| 6 — Selects vacíos / sin autoselección | **Cerrada** | Opción vacía; sin primer catálogo como elección; defaults no cuentan como selección real. | Tema empleados + formularios; [`ui-form-guidelines.md`](../ui-form-guidelines.md) | Unit form/orchestrator según repo |
| 7 — Rehidratación borrador avanzado | **Cerrada** | DRAFT‑*, Sin cargo, sueldo 0, APVI incompleto no como reales; paso 9 con pendientes reales. | [`creacion-avanzada-borrador-tests.md`](../temas/creacion-avanzada-borrador-tests.md), tema empleados | `empleado-borrador-hidratacion` (unit); E2E opcionales con `E2E_EMPLEADOS_BORRADOR` |
| 8 — Validar para remuneraciones (Ficha) | **Cerrada** | Opción B: ficha completa **no** apta sola; CTA **Validar para remuneraciones**; confirmación; `EmpleadosRepository.validarFichaParaRemuneraciones` reevalúa helper y persiste solo `persona` (`VALIDO`, `apto_para_remuneraciones`, `ACTIVO` si aplica, `fecha_activacion`, `paso_alta_avanzada` null). Condiciones UI y exclusiones: tema §21. | [`empleados-estados-completitud-aptitud.md`](../temas/empleados-estados-completitud-aptitud.md) §21 | Unit: `ficha-empleado-container.spec.ts`, `empleados.service.spec.ts`; E2E ficha opcional según entorno |

## 3. Fases cerradas (lista corta)

0, 1, 2, 3, 4, 5, 6, 7, 8 — según tabla.

## 4. Fase actual / siguiente

**Siguiente prioridad de producto (fuera del tablero 0–8):** **Conceptos de remuneración** — catálogo maestro gobernado; no mezclar con asignaciones por trabajador. Ver [`contexto-proyecto.md`](./contexto-proyecto.md) §10 y §9 orden recomendado.

## 5. Pendientes técnicos no bloqueantes

- Versionar carpeta Python explícitamente en doc/repo si aplica.
- Ejecutar validaciones SQL **v11** cuando haya PostgreSQL local / `psql`.
- No regenerar monolito legacy sin decisión explícita.
- Revisión futura AFP vs `AFP_VIGENCIA` para convergencia UI/fuente.

## 6. Pendientes visuales

Registrar en [`peticiones-estilos.md`](../peticiones-estilos.md) cuando haya cambio visual acordado; no usar el orquestador como bitácora visual.

## 7. Módulos futuros (post fases 0–8 cerradas)

- **Conceptos de remuneración** (fase fuerte pendiente; siguiente foco).
- **Haberes y descuentos** (refuerzo de reglas y UI).
- **Movimientos variables**, **proceso mensual**, **motor**, **liquidaciones**, **Previred**, **LRE** — ver [`contexto-proyecto.md`](./contexto-proyecto.md) secciones 10–12 y 15.

## 8. Criterios para avanzar de fase

- Contrato en `temas/` actualizado si cambia la regla de negocio o de UI.
- Criterios de “listo” del usuario o de `AGENTS.md` cumplidos.
- Pruebas acordadas para el alcance (unit / E2E) en verde cuando apliquen.
- Sin mezclar alcances (p. ej. no meter liquidación en ficha empleados).

## 9. Orden recomendado de próximas fases

1. **Conceptos** gobernados (maestro, vigencias, LRE, no mezclar con asignación por trabajador).
2. **Haberes recurrentes** (vigencia, duplicados, separación de conceptos).
3. **Movimientos variables**.
4. **Proceso mensual guiado** → **motor** → **liquidaciones** → integraciones **Previred / LRE**.
