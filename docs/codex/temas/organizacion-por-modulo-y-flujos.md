# Organización de `docs/codex` por módulo y flujos

## Objetivo

Convención **estable** para encontrar documentación: **orquestador global** → **`modulos/<módulo>/`** (contrato por pantalla) → **`temas/flujos/`** (recorrido por rutas) → transversales en **`temas/`**.

## Principios

1. **Fuente vigente por dominio de producto** vive en **`docs/codex/modulos/<módulo>/`**, con un **`README.md`** por módulo y un archivo por subflujo importante.
2. **`docs/codex/temas/`** agrupa:
   - **`flujos/`** — un documento por área de app con rutas y pasos de usuario;
   - **transversal** — implementación UI, menú, arquitectura de feature cuando no se ha partido en `modulos/`;
   **stubs** en la raíz de `temas/` — mismo nombre histórico, una línea que apunta al archivo en `modulos/` (no borrar rutas enlazadas desde PRs viejos sin necesidad).
3. **Orquestador** (`docs/codex/orquestador/`) — contexto, fases, [`mapa-documentacion.md`](../orquestador/mapa-documentacion.md); no duplicar contratos largos.
4. **Archivo** (`docs/codex/archivo/`) — solo si se **mueve** explícitamente un documento obsoleto; ver [`../archivo/README.md`](../archivo/README.md).
5. **Nuevo contrato de módulo cerrado**: crear o editar bajo `modulos/<módulo>/`; actualizar `README` del módulo, `mapa-documentacion.md`, `flujos/<modulo>.md` y el índice en [`temas/README.md`](./README.md).

## Relación módulo ↔ flujo ↔ contrato

| Nivel | Contenido típico |
|-------|-------------------|
| Módulo | Carpeta `modulos/<nombre>/` + `README.md`. |
| Flujo / página | Archivo dedicado en esa carpeta + fila en `temas/flujos/<modulo>.md`. |
| Recorrido usuario | `temas/flujos/*.md` enlazando a `modulos/`. |

Si un flujo aún no tiene contrato detallado, el archivo en `flujos/` debe marcar **«contrato pendiente»** y enlazar a `AGENTS.md` + `ui-form-guidelines.md` hasta que exista doc en `modulos/`.

## Mantenimiento

- Al agregar una **ruta nueva** en `app.routes.ts`: actualizar el archivo de `flujos/` del módulo y la tabla del [`flujos/README.md`](./flujos/README.md).
- Al **cerrar una fase** que documenta un flujo: enlazar desde `flujos/` y `estado-fases.md` al `.md` en `modulos/`.
- Al **migrar** un tema desde `temas/` a `modulos/`: revisar enlaces (grep), dejar stub o mover a `archivo/` según criterio acordado; no eliminar contenido dudoso sin revisión.
