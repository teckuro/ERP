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
2. [`estado-fases.md`](./estado-fases.md) — tablero vivo de fases y siguiente paso oficial.
3. [`../estandares/README.md`](../estandares/README.md) — constitución técnica EST-001…EST-008 (agentes: [`EST-008-ia.md`](../estandares/EST-008-ia.md)).
4. [`roadmap-operativo.md`](./roadmap-operativo.md) — orden oficial del producto.
5. [`dependencias-fases.md`](./dependencias-fases.md) — bloqueadores entre fases.
6. [`criterios-cierre-fases.md`](./criterios-cierre-fases.md) — criterios para cerrar fases.
7. [`orden-prioridades.md`](./orden-prioridades.md) — prioridades altas, medias, bajas.
8. [`mapa-documentacion.md`](./mapa-documentacion.md) — inventario global de documentos.
9. [`diseno-operativo-erp.md`](./diseno-operativo-erp.md) — diseño operativo UX.
10. [`../AGENTS.md`](../AGENTS.md) — contrato del agente.
11. [`../arquitectura/frontend-interfaces.md`](../arquitectura/frontend-interfaces.md) — estructura Angular si aplica.
12. [`../README.md`](../README.md) — índice padre.
13. [`../modulos/<módulo>/README.md`](../modulos/empleados/README.md) + subflujo concreto.

**Movimientos de remuneración:** antes del detalle en `modulos/remuneraciones/`, leer [`resumen-trabajo-movimientos-remuneracion.md`](./resumen-trabajo-movimientos-remuneracion.md).

Siempre debe quedar claro: primero **contexto + fases + estándares**, después **roadmap + mapa**, después **contrato (`AGENTS` + EST + UI + arquitectura frontend si aplica)**, después **módulo**, después **pantalla**.

## Relación con `docs/codex/modulos` y `docs/codex/temas`

| Carpeta / doc | Rol |
|-----------------|-----|
| `orquestador/` | Contexto global, diseño operativo, orden del producto, qué no construir aún. |
| `estandares/` | Constitución técnica EST-001…EST-008 (nomenclatura, BD, Angular, IA). |
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
