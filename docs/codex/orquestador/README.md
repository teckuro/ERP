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
2. [`diseno-operativo-erp.md`](./diseno-operativo-erp.md) — diseño operativo: estado, pendientes, acciones y **siguiente fase fuerte (Conceptos)**.
3. [`estado-fases.md`](./estado-fases.md) — tablero de fases, siguiente paso y criterios para avanzar.
4. [`mapa-documentacion.md`](./mapa-documentacion.md) — lista de documentos globales, por módulo, vigentes en `temas/`, stubs y archivo.
5. [`../AGENTS.md`](../AGENTS.md) — contrato del agente (stack, layout, anti‑patrones, checklist).
6. [`../arquitectura/frontend-interfaces.md`](../arquitectura/frontend-interfaces.md) — si el trabajo afecta estructura Angular (`pages/` vs `features/`, contenedores).
7. [`../README.md`](../README.md) — índice padre y jerarquía.
8. **[`../modulos/<módulo>/README.md`](../modulos/empleados/README.md)** y luego el **documento del subflujo** que corresponda.

Siempre debe quedar claro: primero **contexto + diseño operativo + fases + mapa**, después **contrato (`AGENTS` + UI + arquitectura frontend si aplica)**, después **módulo**, después **pantalla**. Los recorridos por ruta siguen en [`../temas/flujos/README.md`](../temas/flujos/README.md).

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
3. Ajustar [`diseno-operativo-erp.md`](./diseno-operativo-erp.md) si cambian principios UX operativos o la **siguiente fase fuerte** declarada.
4. Actualizar [`mapa-documentacion.md`](./mapa-documentacion.md) si cambia el inventario de fuentes o stubs.
5. No convertir estos archivos en **bitácora larga**: los detalles van a `modulos/`, `peticiones-estilos.md` o bitácoras puntuales.
