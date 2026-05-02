# Organización de `docs/codex/temas` por módulo y flujos

## Objetivo

Definir una convención **estable** para que la documentación por tema sea fácil de encontrar: primero por **módulo o pantalla** de la aplicación, luego por **contrato técnico** (formulario, estados, tests).

## Principios

1. **Los archivos siguen en la raíz de `temas/`** salvo decisión explícita de migrar (evita romper enlaces históricos en commits, PR y chat).
2. **El orden y el descubrimiento** se resuelven con:
   - [`README.md`](./README.md) del directorio `temas/` — agrupado por módulo y, dentro de cada uno, por flujo/página.
   - Carpeta [`flujos/`](./flujos/README.md) — **un documento por módulo de app** con rutas, pasos de usuario y enlaces a los `.md` de contrato.
3. **Nombres de archivos**: preferir prefijo cuando crezca el volumen, p. ej. `empleados-*.md`, `parametros-*.md` (muchos ya lo cumplen).
4. **Nuevo contrato**: ubicarlo en `temas/`; añadir fila en `flujos/<modulo>.md` y entrada en `temas/README.md` bajo el módulo correspondiente.
5. **Contexto global de producto** sigue en [`../orquestador/`](../orquestador/README.md); no duplicar aquí el tablero de fases.

## Relación módulo ↔ flujo ↔ contrato

| Nivel | Contenido típico |
|-------|-------------------|
| Módulo | Nombre de menú / área (Empleados, Parámetros, …). |
| Flujo / página | Ruta (`/empleados/:id`), objetivo del usuario, CTA principales. |
| Contrato | Reglas de negocio, UI, datos (`empleados-estados-*.md`, `parametros-vigencia-*.md`, …). |

Si un flujo aún no tiene contrato detallado, el archivo en `flujos/` debe marcar **«contrato pendiente»** y enlazar solo a `AGENTS.md` + `ui-form-guidelines.md` hasta que exista tema específico.

## Mantenimiento

- Al agregar una **ruta nueva** en `app.routes.ts`: actualizar el archivo de `flujos/` del módulo y la tabla del [`flujos/README.md`](./flujos/README.md).
- Al **cerrar una fase** que documenta un flujo: enlazar desde `flujos/` al tema y, si aplica, a `orquestador/estado-fases.md`.
