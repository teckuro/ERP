# Peticiones fusionadas (items 1–65)

Resumen trazable de lo pedido en los chats del 27–28 abr 2026 (transcripts del workspace), hasta el item 65 de la fusion. No sustituye los mensajes completos; sirve como checklist de trabajo.

Fuentes: transcripts bajo `agent-transcripts/` (ids: `94b51c5d`, `157d95cd`, `3b7a982e`, `8eea9d5e`, `714283b6`, `e107718f`, `dbe97cf8`, `72e9b2e5`).

Ver implementacion en codigo segun fases:

- **Parametros**: carga por periodo en DataGrids (filas con `periodo` o vigencias que intersectan el mes); maquetacion y flujo Modificar en `parametros.page.ts`.
- **Permisos BD**: [`parametros-permisos-bd-ejemplo.sql`](./temas/parametros-permisos-bd-ejemplo.sql) (plantilla; la raíz `/bd/*` está ignorada por git salvo rutas excluidas).
- **DataGrid**: columna `N°` y scroll en componente compartido.
- **Codex / empleados**: `AGENTS.md`, `peticiones-estilos.md`, bases de estilos, listado sin buscador.
- **Creacion avanzada**: [`creacion-avanzada-formulario-campos.md`](./temas/creacion-avanzada-formulario-campos.md).

Items 66+ (meta, push puntual del chat 94b51c5d tardio, etc.) quedaron fuera a proposito.
