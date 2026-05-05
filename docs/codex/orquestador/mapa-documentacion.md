# Mapa de documentación (`docs/codex`)

## 1. Globales (siempre relevantes)

| Documento                                                                          | Rol                                                                                    |
| ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| [`../arquitectura/frontend-interfaces.md`](../arquitectura/frontend-interfaces.md) | Contrato Angular: `pages/` wrapper, `features/`, contenedores vs logica, anti-patrones |
| [`../AGENTS.md`](../AGENTS.md)                                                     | Contrato del agente, stack, layout, checklist                                          |
| [`../README.md`](../README.md)                                                     | Índice padre y orden de lectura                                                        |
| [`../ui-form-guidelines.md`](../ui-form-guidelines.md)                             | Formularios, tokens, mensajes                                                          |
| [`../ui-button-guidelines.md`](../ui-button-guidelines.md)                         | Botones y toolbar                                                                      |
| [`../ui-tables.md`](../ui-tables.md)                                               | Tablas / DataGrid                                                                      |
| [`../estilos/README.md`](../estilos/README.md)                                     | Grilla y checklist visual                                                              |
| [`../manual-base-proyecto.md`](../manual-base-proyecto.md)                         | Lectura del repo                                                                       |
| [`README.md`](./README.md)                                                         | Rol del orquestador                                                                    |
| [`contexto-proyecto.md`](./contexto-proyecto.md)                                   | Visión, módulos, camino a remuneraciones                                               |
| [`diseno-operativo-erp.md`](./diseno-operativo-erp.md)                             | Diseño operativo de pantallas; camino oficial **SEG-01 -> CONC-02 -> MOTOR-00**        |
| [`estado-fases.md`](./estado-fases.md)                                             | Tablero de fases                                                                       |
| **Este archivo**                                                                   | Inventario: global / por módulo / vigente / histórico / reemplazado                    |

## 2. Por módulo (`docs/codex/modulos/`)

| Módulo                            | README                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Empleados                         | [`../modulos/empleados/README.md`](../modulos/empleados/README.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Parámetros                        | [`../modulos/parametros/README.md`](../modulos/parametros/README.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Conceptos remuneración            | [`../modulos/conceptos-remuneracion/README.md`](../modulos/conceptos-remuneracion/README.md) — además [`diagnostico-fase-9.md`](../modulos/conceptos-remuneracion/diagnostico-fase-9.md), [`decisiones-operativas.md`](../modulos/conceptos-remuneracion/decisiones-operativas.md), [`contrato-funcional.md`](../modulos/conceptos-remuneracion/contrato-funcional.md), [`contrato-general.md`](../modulos/conceptos-remuneracion/contrato-general.md)                                                                                                                                                                                                                               |
| Haberes y descuentos              | [`../modulos/haberes-descuentos/README.md`](../modulos/haberes-descuentos/README.md) — rutas oficiales bajo `/remuneraciones/*` (Fase 9.3B.1 en [`estado-fases.md`](./estado-fases.md))                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Movimientos variables (mensuales) | [`../modulos/movimientos-variables/README.md`](../modulos/movimientos-variables/README.md) — contrato 9.4A; modelo TS/reglas 9.4B en [`modelo-tecnico-9-4B.md`](../modulos/movimientos-variables/modelo-tecnico-9-4B.md); persistencia 9.4C en [`persistencia-9-4C.md`](../modulos/movimientos-variables/persistencia-9-4C.md); service 9.4D en [`service-9-4D.md`](../modulos/movimientos-variables/service-9-4D.md); UI carga manual 9.4E en [`ui-9-4E.md`](../modulos/movimientos-variables/ui-9-4E.md); endurecimiento CHILE-FIX-01 en [`hardening-chile-fix-01.md`](../modulos/movimientos-variables/hardening-chile-fix-01.md); tablero [`estado-fases.md`](./estado-fases.md) |
| Nómina mensual / proceso mensual  | [`../modulos/nomina-mensual/README.md`](../modulos/nomina-mensual/README.md) — [`contrato-general.md`](../modulos/nomina-mensual/contrato-general.md), [`prevalidaciones-9-5A.md`](../modulos/nomina-mensual/prevalidaciones-9-5A.md), [`prevalidaciones-9-5B.md`](../modulos/nomina-mensual/prevalidaciones-9-5B.md)                                                                                                                                                                                                                                                                                                                                                                |

## 3. Vigentes en `temas/` (transversal o no migrado)

| Documento                                                                                      | Nota                                                        |
| ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| [`../temas/flujos/README.md`](../temas/flujos/README.md)                                       | Rutas ↔ recorridos                                          |
| [`../temas/flujos/*.md`](../temas/flujos/README.md)                                            | Flujos por área de la app                                   |
| [`../temas/implementacion-ui.md`](../temas/implementacion-ui.md)                               | Dónde vive el CSS y componentes                             |
| [`../temas/crear-menu-base.md`](../temas/crear-menu-base.md)                                   | Menú y rutas                                                |
| [`../temas/base-angular-empleados.md`](../temas/base-angular-empleados.md)                     | Arquitectura del feature empleados (no movido a `modulos/`) |
| [`../temas/organizacion-por-modulo-y-flujos.md`](../temas/organizacion-por-modulo-y-flujos.md) | Convención + política de migración                          |

## 4. Histórico / bitácoras (vigentes como registro, no como contrato de flujo)

| Documento                                                                                                                | Rol                                                                            |
| ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| [`../auditorias/README.md`](../auditorias/README.md)                                                                     | Indice de auditorias funcionales (p. ej. remuneraciones Chile)                 |
| [`../auditorias/qa-chile-01-remuneraciones.md`](../auditorias/qa-chile-01-remuneraciones.md)                             | QA-CHILE-01: auditoria remuneraciones chilenas (hallazgos, severidad, brechas) |
| [`../auditorias/param-chile-01-parametros-y-demo-proceso.md`](../auditorias/param-chile-01-parametros-y-demo-proceso.md) | PARAM-CHILE-01: parametros vs demo en proceso mensual (ALTO-004)               |
| [`../peticiones-estilos.md`](../peticiones-estilos.md)                                                                   | Registro de mejoras visuales                                                   |
| [`../peticiones-fusion-items-1-65.md`](../peticiones-fusion-items-1-65.md)                                               | Bitácora fusionada                                                             |

## 5. Reemplazados (stub en `temas/`, fuente en `modulos/`)

Los siguientes nombres en **`docs/codex/temas/*.md`** (y el SQL listado) son **redirecciones** de una línea; el texto normativo vive en **`docs/codex/modulos/`**:

- `empleados-estados-completitud-aptitud.md` → `modulos/empleados/contrato-general.md`
- `modo-basico-empleado.md` → `modulos/empleados/creacion-basica.md`
- `creacion-avanzada-formulario-campos.md` → `modulos/empleados/creacion-avanzada.md`
- `creacion-avanzada-borrador-tests.md` → `modulos/empleados/borrador-continuar-alta.md`
- `flujo-edicion-ficha-empleado.md` → `modulos/empleados/ficha-empleado.md`
- `ficha-empleado-funcionamiento-y-tests-visuales.md` → `modulos/empleados/ficha-empleado.md`
- `parametros-vigencia-y-periodo.md` → `modulos/parametros/periodo-vigencia-catalogo.md`
- `parametros-ui-estandar.md` → `modulos/parametros/ui-parametros.md`
- `parametros-generales-campos-y-listas.md` → `modulos/parametros/campos-y-listas.md`
- `python-parametros-carga-mensual.md` → `modulos/parametros/python-carga-mensual.md`
- `reforma-pensiones-gradualidad.md` → `modulos/parametros/reforma-gradualidad.md`
- `sync-parametros-v611.md` → `modulos/parametros/sync-parametros-v611.md`
- `parametros-permisos-bd-ejemplo.sql` → `modulos/parametros/permisos-bd-ejemplo.sql`

## 6. Archivo

[`../archivo/README.md`](../archivo/README.md) — criterio para documentos obsoletos movidos explícitamente.

## 1.1 Orquestacion y roadmap operativo

| Documento                                                    | Proposito                                                                                                                                                      | Estado               |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| `docs/codex/orquestador/roadmap-operativo.md`                | Define el orden funcional del ERP, separa fases funcionales de visuales y fija la ruta hacia motor, liquidaciones, cierre, Previred y LRE.                     | Vigente              |
| `docs/codex/orquestador/dependencias-fases.md`               | Documenta la cadena critica entre empleados, parametros, conceptos, recurrentes, movimientos variables, proceso mensual, motor, liquidaciones y exportaciones. | Vigente              |
| `docs/codex/orquestador/criterios-cierre-fases.md`           | Define cuando una fase puede considerarse cerrada, cerrada base, parcial, bloqueada o pendiente.                                                               | Vigente              |
| `docs/codex/orquestador/orden-prioridades.md`                | Ordena prioridades altas, medias y bajas para evitar saltar a motor, liquidaciones o visual antes de tiempo.                                                   | Vigente              |
| `docs/codex/orquestador/roadmap-maestro-pendientes-fases.md` | Documento puente usado para integrar ORDEN-01 y ordenar SEG-01, CONC-02, MOTOR-00 y fases posteriores.                                                         | Insumo vigente       |
| `docs/codex/orquestador/matriz-roles-permisos.md`            | Contrato base documental de SEG-01 para roles, permisos, JWT/RLS, acciones por modulo y bloqueos por fase futura.                                              | SEG-01 en definicion |
