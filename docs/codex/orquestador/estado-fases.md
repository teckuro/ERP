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

## 3. Fases cerradas (lista corta)

0, 1, 2, 3, 4, 5, 6, 7, 8 — según tabla.

## 4. Fase actual / siguiente

**Siguiente fase fuerte de producto (fuera del tablero 0–8):** **Conceptos de remuneración** — catálogo maestro gobernado; no mezclar con asignaciones por trabajador. Punto de entrada del módulo: [`../modulos/conceptos-remuneracion/README.md`](../modulos/conceptos-remuneracion/README.md). Marco UX y prioridades: [`diseno-operativo-erp.md`](./diseno-operativo-erp.md). Contexto y orden del camino: [`contexto-proyecto.md`](./contexto-proyecto.md) §10 y §12.

## 5. Pendientes técnicos no bloqueantes

- Versionar carpeta Python explícitamente en doc/repo si aplica.
- Ejecutar validaciones SQL **v11** cuando haya PostgreSQL local / `psql`.
- No regenerar monolito legacy sin decisión explícita.
- Revisión futura AFP vs `AFP_VIGENCIA` para convergencia UI/fuente.

## 6. Pendientes visuales

Registrar en [`peticiones-estilos.md`](../peticiones-estilos.md) cuando haya cambio visual acordado; no usar el orquestador como bitácora visual.

## 7. Módulos futuros (post fases 0–8 cerradas)

- **Conceptos de remuneración** — **siguiente fase fuerte**; catálogo maestro antes de motor y liquidaciones productivas. README: [`../modulos/conceptos-remuneracion/README.md`](../modulos/conceptos-remuneracion/README.md).
- **Haberes y descuentos** (refuerzo de reglas y UI).
- **Movimientos variables**, **proceso mensual**, **motor**, **liquidaciones**, **Previred**, **LRE** — ver [`contexto-proyecto.md`](./contexto-proyecto.md) secciones 10–12 y 15.

## 8. Criterios para avanzar de fase

- Contrato en **`docs/codex/modulos/<módulo>/`** (y stubs o temas transversales) actualizado si cambia la regla de negocio o de UI.
- Criterios de “listo” del usuario o de `AGENTS.md` cumplidos.
- Pruebas acordadas para el alcance (unit / E2E) en verde cuando apliquen.
- Sin mezclar alcances (p. ej. no meter liquidación en ficha empleados).

## 9. Orden recomendado de próximas fases

1. **Conceptos** gobernados (maestro, vigencias, LRE, no mezclar con asignación por trabajador).
2. **Haberes recurrentes** (vigencia, duplicados, separación de conceptos).
3. **Movimientos variables**.
4. **Proceso mensual guiado** → **motor** → **liquidaciones** → integraciones **Previred / LRE**.
