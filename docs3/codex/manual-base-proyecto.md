# Manual Base Del Proyecto

Este manual queda dividido por tema para que sea mas facil mantenerlo.

Documentos base:

- `docs/codex/temas/base-angular-empleados.md`
- `docs/codex/temas/crear-menu-base.md`

Documentos que siguen aplicando como reglas de UI:

- `docs/codex/AGENTS.md`
- `docs/codex/README.md` (índice padre y enlaces por tema)
- `docs/codex/ui-form-guidelines.md`
- `docs/codex/temas/modo-basico-empleado.md`

Orden recomendado de lectura:

1. `AGENTS.md`
2. `README.md` (carpeta codex)
3. `ui-form-guidelines.md`
4. `temas/base-angular-empleados.md`
5. `temas/crear-menu-base.md`

## Alcance de cada archivo

### `base-angular-empleados.md`

Explica como crear modulos Angular en este proyecto tomando `empleados` como base:

- estructura de carpetas
- rutas de feature
- containers
- components
- services
- models
- formulario base

### `crear-menu-base.md`

Explica como agregar una nueva opcion al menu lateral y conectarla con rutas nuevas o existentes.

## Regla tipografica base

Para cualquier pantalla nueva o ajuste visual, el peso tipografico por defecto debe ser contenido.

Reglas:

- Evitar `bold` o `700` como peso base de labels, tabs, badges, acciones secundarias y texto de soporte.
- Preferir `500` o `600` para controles, encabezados menores y estados.
- Reservar pesos mas altos solo para el dato protagonista de la vista o una jerarquia puntual.
- Si una pantalla se siente pesada, primero bajar peso tipografico antes de agregar mas espacio o color.
- Esta regla aplica aunque un componente se vea correcto aislado; en conjunto el sistema debe verse sobrio.

La guia visual detallada sigue en `docs/codex/ui-form-guidelines.md`.
