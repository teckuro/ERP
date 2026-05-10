# Auditoria documental global - DOCS-INTEGRATION-01

## Objetivo

Consolidar el estado documental de `docs/codex` despues del hito E2E real de nomina y antes de iniciar el diseno/implementacion del cierre operativo.

Esta auditoria no elimina ni mueve documentos. Clasifica, enlaza y marca riesgos para que nuevas fases no partan desde informacion duplicada o ambigua.

## Alcance

- Carpeta revisada: `docs/codex/`.
- Tipo de cambio esperado: solo Markdown.
- No incluye codigo, SQL, RPC, RLS, tests ni configuracion.

## Estado global detectado

| Area | Estado documental | Observacion |
|---|---|---|
| Orquestador | **Vigente con refuerzo canonico** | Existen estado de fases, roadmap, mapa documental, dependencias y decisiones pendientes. Se agrega mapa global de fases para lectura rapida. |
| Auth | **Vigente** | Login base, rutas protegidas y E2E real authenticated para nomina estan documentados. Roles avanzados siguen fuera de alcance. |
| Empleados | **Vigente** | Alta avanzada/Ficha quedaron alineadas con nomina: `Sin prevision` bloquea aptitud y la jornada ya no parte en 45. |
| Parametros | **Vigente con pendientes** | Mantiene distincion oficial/cliente, periodo/vigencia/catalogo y validacion parcial durante el mes. Pendientes de cierre/reconciliacion. |
| Conceptos / Asignaciones | **Vigente** | Separacion entre catalogo y asignaciones recurrentes documentada. Lenguaje visible debe mantener `Asignaciones recurrentes`. |
| Movimientos del mes | **Vigente con legacy** | `Movimientos del mes` es lenguaje visible; `Novedades mensuales` y `movimiento_variable_mensual` pueden aparecer como nombres tecnicos/historicos segun contexto. |
| Nomina mensual | **Vigente hasta aprobacion operativa** | E2E real validado hasta guardado RPC, snapshot BD, aprobacion operativa y recuperacion tras recargar. |
| Cierre operativo | **En diseno** | `NOM-CIERRE-DESIGN-01` define decisiones; `NOM-CIERRE-01` no esta implementada. |
| Liquidaciones oficiales | **Futura** | Deben venir despues del cierre operativo. No estan implementadas. |
| UX comercial | **Futura prioritaria post-liquidaciones** | Despues de liquidaciones, el foco pasa a experiencia usable, dinamica y comercial antes de Previred/LRE/banco/contabilidad. |
| Previred/LRE/Banco/Contabilidad | **Futuras** | Documentacion normativa o conceptual existe, pero no deben quedar como siguiente prioridad inmediata. |

## Auditoria de documentos principales

| Documento | Tipo | Estado | Problema detectado | Accion aplicada | Accion futura |
|---|---|---|---|---|---|
| `README.md` | Indice padre | Vigente | Necesita acceso rapido a fases canonicas y roadmap actualizado. | Se agrega seccion de integracion 2026-05-10 y lectura por tipo de tarea. | Mantener como punto de entrada unico. |
| `orquestador/estado-fases.md` | Tablero vivo | Vigente | Muy extenso; dificil de leer como mapa rapido. | Se agrega referencia a `mapa-global-fases.md`. | Mantener estado detallado y usar mapa global como resumen. |
| `orquestador/mapa-global-fases.md` | Nuevo mapa | Nuevo | No existia una vista unica con fase/modulo/estado/tipo/evidencia/siguiente. | Creado como indice canonico de fases. | Actualizar al cerrar fases. |
| `orquestador/roadmap-operativo.md` | Roadmap | Vigente | Debia reflejar el nuevo criterio: llegar hasta liquidaciones y luego UX comercial. | Se agrega bloque canonico 2026-05-10. | Reordenar si cambia decision de producto. |
| `orquestador/roadmap-maestro-pendientes-fases.md` | Roadmap extendido | Vigente | Puede mezclar futuras salidas legales con prioridades inmediatas. | Se agrega prioridad canonica. | Mantener Previred/LRE/banco como futuro, no inmediato. |
| `orquestador/orden-prioridades.md` | Prioridades | Vigente | Necesita reforzar corte post-liquidaciones. | Se agrega secuencia vigente. | Revisar despues de `LIQ-OFICIAL-01`. |
| `orquestador/decisiones-pendientes.md` | Decisiones | Vigente | Faltaban decisiones de cierre y UX comercial como bloque explicito. | Se agregan decisiones 2026-05-10. | Cerrar al aprobar `NOM-CIERRE-DESIGN-01`. |
| `inconsistencias.md` | Riesgos | Vigente | Algunos textos antiguos podrian sugerir motor/liquidacion incompletos. | Se agregan inconsistencias de estado actual/futuro. | Depurar historicos cuando haya tiempo. |
| `modulos/auth/README.md` | Modulo | Vigente | Debe recordar que auth base no equivale a roles avanzados. | Se agrega estado canonico. | Crear fase de roles solo cuando producto lo priorice. |
| `modulos/empleados/README.md` | Modulo | Vigente | Debe quedar alineado con nomina post EMP-ADV-FICHA-01. | Se agrega estado canonico. | Revisar si se agregan nuevas reglas previsionales. |
| `modulos/parametros/README.md` | Modulo | Vigente | Validacion parcial vs cierre puede confundirse. | Se refuerza regla. | Conectar con cierre/reconciliacion cuando se disene. |
| `modulos/nomina-mensual/README.md` | Modulo | Vigente | Debe separar aprobado operativo de cierre/liquidacion. | Se agrega bloque canonico. | Actualizar en `NOM-CIERRE-01`. |
| `modulos/nomina-mensual/contrato-general.md` | Contrato | Vigente | Debe dejar claro que aprobacion no es cierre. | Se agrega contrato canonico. | Ajustar con SQL/RPC de cierre si se implementa. |
| `modulos/lre/contrato-general.md` | Contrato futuro/normativo | Futuro | Puede parecer salida operativa si se lee aislado. | Se recomienda tratarlo como futuro/normativo. | Reactivar despues de liquidaciones + UX comercial. |
| `assets/` | Evidencia visual | Historico util | Multiples versiones de capturas pueden confundir. | Se crea/actualiza `assets/README.md`. | Marcar version vigente al cerrar pulido visual. |
| `temas/` | Transversal/historico | Mixto | Algunos docs son stubs o duplicados de modulos. | Se refuerza mapa documental. | No borrar; migrar gradualmente si hace falta. |

## Reglas de canon documental

1. `orquestador/mapa-global-fases.md` es la vista rapida de avance.
2. `orquestador/estado-fases.md` sigue siendo el tablero vivo detallado.
3. Los contratos por modulo mandan sobre documentos historicos en `temas/`.
4. Las fases futuras deben decir explicitamente `futura` o `en_diseno`.
5. No usar frases que impliquen que cierre, liquidaciones, Previred, LRE, banco o contabilidad ya estan implementados.
6. Despues de liquidaciones oficiales, el foco definido por producto es UX comercial antes de salidas legales avanzadas.

## Validacion de scope

Esta auditoria espera cambios solo dentro de `docs/codex/`.
