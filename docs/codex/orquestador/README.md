# Orquestador de contexto (`docs/codex/orquestador`)

## Qué es esta carpeta

Conjunto de documentos **globales y breves** para que Codex, Cursor, ChatGPT u otros agentes obtengan **rápidamente** el estado del ERP (visión, fases, módulos tocables o congelados) **antes** de planificar o implementar una nueva fase.

**No sustituye** los contratos por tema en [`docs/codex/temas/`](../temas/README.md): es un **mapa e índice operativo**. El detalle normativo, de UI y de implementación sigue en cada tema y en [`AGENTS.md`](../AGENTS.md).

## Cuándo leerla

- Al **iniciar** una sesión nueva o una fase nueva.
- Cuando haya duda sobre **qué está cerrado**, **qué sigue** o **qué no conviene tocar todavía**.
- Antes de pedir cambios amplios sin alcance explícito.

## Orden recomendado de lectura

1. [`contexto-proyecto.md`](./contexto-proyecto.md) — mapa global del producto, stack, UI, módulos y camino oficial.
2. [`estado-fases.md`](./estado-fases.md) — tablero de fases, siguiente paso y criterios para avanzar.
3. [`../AGENTS.md`](../AGENTS.md) — contrato del agente (stack, layout, anti‑patrones, checklist).
4. [`../README.md`](../README.md) — índice padre y enlaces por tema.
5. **Documento específico** del módulo o fase (p. ej. empleados, parámetros, Python) según el trabajo.

Siempre debe quedar claro: primero **contexto + fases**, después **contrato**, después **tema**.

## Relación con `docs/codex/temas`

| Carpeta / doc | Rol |
|-----------------|-----|
| `orquestador/` | Contexto global, orden del producto, qué no construir aún. |
| `temas/` | Contratos y guías **por dominio** (empleados, parámetros, reforma, etc.). |

Si hay conflicto entre un resumen del orquestador y un tema detallado, **gana el documento del tema** (y `AGENTS.md` según jerarquía del README padre).

## Regla para futuras fases

1. Actualizar [`estado-fases.md`](./estado-fases.md) al **cerrar** o **abrir** una fase (estado, enlace a doc de cierre si existe).
2. Ajustar [`contexto-proyecto.md`](./contexto-proyecto.md) solo si cambia visión global, módulos en juego o reglas transversales.
3. No convertir estos archivos en **bitácora larga**: los detalles van a `temas/`, `peticiones-estilos.md` o bitácoras puntuales.
