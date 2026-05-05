# Orquestador de contexto (`docs/codex/orquestador`)

## Qué es esta carpeta

Conjunto de documentos **globales y breves** para que Codex, Cursor, ChatGPT u otros agentes obtengan **rápidamente** el estado del ERP (visión, fases, módulos tocables o congelados) **antes** de planificar o implementar una nueva fase.

**No sustituye** los contratos por módulo en [`../modulos/`](../modulos/empleados/README.md): es un **mapa e índice operativo**. El detalle normativo y de flujo por pantalla está en cada **`modulos/<módulo>/*.md`**.

## Cuándo leerla

- Al **iniciar** una sesión nueva o una fase nueva.
- Cuando haya duda sobre **qué está cerrado**, **qué sigue** o **qué no conviene tocar todavía**.
- Antes de pedir cambios amplios sin alcance explícito.

## Orden recomendado de lectura

1. [`contexto-proyecto.md`](./contexto-proyecto.md) — mapa global del producto, stack, UI, módulos y camino oficial.
2. [`roadmap-operativo.md`](./roadmap-operativo.md) — orden oficial: ORDEN-01 cerrada, SEG-01 siguiente, CONC-02 despues, MOTOR-00 antes de motor.
3. [`dependencias-fases.md`](./dependencias-fases.md) — bloqueadores entre seguridad, conceptos, motor, liquidaciones, cierre, Previred y LRE.
4. [`criterios-cierre-fases.md`](./criterios-cierre-fases.md) — estados permitidos y criterios para cerrar fases.
5. [`orden-prioridades.md`](./orden-prioridades.md) — prioridades altas, medias, bajas y regla visual.
6. [`estado-fases.md`](./estado-fases.md) — tablero vivo de fases y siguiente paso oficial.
7. [`mapa-documentacion.md`](./mapa-documentacion.md) — lista de documentos globales, por módulo, vigentes en `temas/`, stubs y archivo.
8. [`diseno-operativo-erp.md`](./diseno-operativo-erp.md) — diseño operativo: estado, pendientes, acciones y camino SEG-01 -> CONC-02 -> MOTOR-00.
9. [`matriz-roles-permisos.md`](./matriz-roles-permisos.md) — placeholder vigente de SEG-01.
10. [`../AGENTS.md`](../AGENTS.md) — contrato del agente (stack, layout, anti‑patrones, checklist).
11. [`../arquitectura/frontend-interfaces.md`](../arquitectura/frontend-interfaces.md) — si el trabajo afecta estructura Angular (`pages/` vs `features/`, contenedores).
12. [`../README.md`](../README.md) — índice padre y jerarquía.
13. **[`../modulos/<módulo>/README.md`](../modulos/empleados/README.md)** y luego el **documento del subflujo** que corresponda.

Siempre debe quedar claro: primero **contexto + roadmap + dependencias + fases + mapa**, despues **contrato (`AGENTS` + UI + arquitectura frontend si aplica)**, despues **modulo**, despues **pantalla**. Los recorridos por ruta siguen en [`../temas/flujos/README.md`](../temas/flujos/README.md).

## Relación con `docs/codex/modulos` y `docs/codex/temas`

| Carpeta / doc | Rol |
|-----------------|-----|
| `orquestador/` | Contexto global, diseño operativo, orden del producto, qué no construir aún. |
| `arquitectura/` | Contratos de código transversal (p. ej. [`../arquitectura/frontend-interfaces.md`](../arquitectura/frontend-interfaces.md)). |
| `modulos/` | Contratos y guías **por módulo y subflujo** (fuente vigente para empleados, parámetros, etc.). |
| `temas/` | Flujos por app, UI transversal, menú; **stubs** hacia `modulos/` donde aplica; ver [`../temas/README.md`](../temas/README.md). |

Si hay conflicto entre un resumen del orquestador y un documento de `modulos/`, **gana el documento del módulo** (y `AGENTS.md` según jerarquía del README padre).

## Regla para futuras fases

1. Actualizar [`estado-fases.md`](./estado-fases.md) al **cerrar** o **abrir** una fase (estado, enlace a doc de cierre si existe).
2. Ajustar [`contexto-proyecto.md`](./contexto-proyecto.md) solo si cambia visión global, módulos en juego o reglas transversales.
3. Ajustar [`diseno-operativo-erp.md`](./diseno-operativo-erp.md) si cambian principios UX operativos o el camino oficial declarado.
4. Actualizar [`mapa-documentacion.md`](./mapa-documentacion.md) si cambia el inventario de fuentes o stubs.
5. No convertir estos archivos en **bitácora larga**: los detalles van a `modulos/`, `peticiones-estilos.md` o bitácoras puntuales.
