# 00_EJECUTAR_CURSOR

## Fase

```txt
UX-COMERCIAL-01 - Redisenar experiencia usable, dinamica y comercial
```

## Objetivo V4

Implementar un redisenio de usabilidad profunda, no solo visual.

El sistema debe responder siempre:

```txt
1. Donde estoy?
2. Que periodo estoy trabajando?
3. En que estado esta el proceso?
4. Que falta?
5. Que hago ahora?
6. Que pasa si hago clic?
7. Que ya quedo guardado?
8. Que es futuro y no esta disponible?
```

## Leer primero repo

```txt
.cursor/skills/erp-codex-docs/SKILL.md
.cursor/rules/erp-codex-contract.mdc
docs/codex/AGENTS.md
docs/codex/README.md
docs/codex/ui-form-guidelines.md
docs/codex/ui-button-guidelines.md
docs/codex/ui-tables.md
docs/codex/estilos/README.md
docs/codex/peticiones-estilos.md
docs/codex/orquestador/estado-fases.md
docs/codex/orquestador/roadmap-operativo.md
docs/codex/modulos/nomina-mensual/README.md
docs/codex/modulos/nomina-mensual/contrato-general.md
docs/codex/modulos/liquidaciones-oficiales/README.md
docs/codex/modulos/liquidaciones-oficiales/contrato-general.md
```

## Leer esta carpeta

```txt
README.md
01_modelo_usabilidad/*
02_arquitectura_informacion/*
03_flujos_tarea/*
04_patrones_interaccion/*
05_blueprints_pantalla/*
06_sistema_componentes/*
07_contenido_y_microcopy/*
08_accesibilidad_responsive/*
09_backlog_tickets/*
10_qa_scorecard/*
```

## Flujo obligatorio

```txt
Aclarar -> Identificar -> Read -> Implementar -> Autorevisar -> Responder
```

Si el alcance esta claro, no preguntar.

## Orden de ejecucion

```txt
T00_AUDITORIA_USABILIDAD.md
T01_NAV_IA_SHELL.md
T02_ESTADOS_ACCIONES_GLOBAL.md
T03_PREPARAR_NOMINA_TASK_FLOW.md
T04_LIQUIDACIONES_TASK_FLOW.md
T05_DETALLE_LIQUIDACION_EMPTY_DETAIL.md
T06_DASHBOARD_PROMESAS_Y_DEMO.md
T07_MOVIMIENTOS_ASIGNACIONES_EMPTY_STATES.md
T08_ACCESIBILIDAD_RESPONSIVE_DENSIDAD.md
T09_DOCS_QA_CIERRE.md
```

## Validaciones

```bash
npx ng test --watch=false
npm run build
```

No usar:

```bash
npm test -- --watch=false
```

E2E smoke si no fuerza escritura real:

```bash
npx playwright test tests/nomina-mensual.e2e.spec.ts --workers=1
npx playwright test tests/liquidaciones-oficiales.e2e.spec.ts --workers=1 --timeout=120000
```

## Definicion de listo

La fase esta lista solo si:

```txt
[ ] El usuario puede completar el flujo sin entender conceptos tecnicos.
[ ] Cada estado importante tiene siguiente accion.
[ ] Cada bloqueo explica el motivo.
[ ] No hay botones activos para salidas futuras.
[ ] Las pantallas vacias guian.
[ ] Preparar nomina y liquidaciones se sienten como producto profesional.
[ ] Tests/build OK.
[ ] Docs y peticiones-estilos actualizados.
```
