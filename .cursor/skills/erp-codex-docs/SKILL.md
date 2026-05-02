---
name: erp-codex-docs
description: >-
  Applies the ERP Angular UI contract from docs/codex: always reads relevant
  docs, asks the user when scope or constraints are missing, self-reviews
  against AGENTS before finishing, and registers visual changes in
  peticiones-estilos. Use when building or changing Angular UI, Tailwind,
  menus, empleados, parámetros, styles, or docs/codex / AGENTS / peticiones.
---

# ERP — documentación `docs/codex`

Objetivo: **salida alineada al contrato** (no improvisar). Antes, durante y al cerrar, cruzar con la doc y con lo que el usuario confirma.

## Obligatorio: pedir y aclarar (no adivinar)

Si falta cualquiera de estos datos, **preguntar al usuario antes de tocar código** (o antes de seguir si ya empezó y surge la duda):

- **Alcance**: pantalla, archivo, ruta o flujo exacto.
- **Tipo de cambio**: solo UI, solo lógica, o ambos (y si aplica contrato “solo UI”).
- **Fuente de verdad**: ¿hay bitácora o lista cerrada (p. ej. `peticiones-fusion-items-1-65.md`)?
- **Criterio de “listo”**: ¿mock, paridad con otra pantalla, o checklist completo?

Con respuestas ambiguas o contradictorias, **una pregunta corta** vale más que una implementación grande equivocada.

## Obligatorio: leer doc antes de implementar

En UI o flujos ERP, **Read** los documentos del alcance (jerarquía abajo). No sustituir lectura por memoria genérica de Angular.

## Obligatorio: revisar antes de cerrar

Antes de dar por terminada la tarea:

1. Releer el **checklist final** de `docs/codex/AGENTS.md` (y el de `ui-form-guidelines.md` si hubo formularios).
2. Confirmar que el cambio **no viola** anti‑patrones ni layout base.
3. Si hubo **mejora visual o de estilos**, verificar que quedó registro en `docs/codex/peticiones-estilos.md` (si el usuario pidió omitirlo por ser borrador, dejarlo dicho en la respuesta).
4. En la respuesta al usuario, ser breve y honesto sobre **qué se validó** contra la doc (no marketing).

No contradecir la jerarquía siguiente.

## Jerarquía (en conflicto gana el primero)

1. `docs/codex/AGENTS.md` — contrato del agente: stack, layout obligatorio, tokens resumidos, anti‑patrones, checklist.
2. `docs/codex/README.md` — índice padre: cómo pedir alcance, enlaces por módulo.
3. `docs/codex/ui-form-guidelines.md` — tokens completos, formularios, MessageBox, loading, checklist visual.
4. Guías de flujo concretas bajo `docs/codex/modulos/<módulo>/` (p. ej. `docs/codex/modulos/empleados/creacion-basica.md`); `docs/codex/temas/` para flujos transversales o stubs.

## Cómo pedir trabajo (alinear con el README)

- Alcance explícito: pantalla, archivo o flujo.
- Tipo: solo UI, solo lógica, o ambos. Si el contrato dice **solo UI**, no cambiar guardado, servicios ni `formControlName` sin acuerdo explícito.
- Si hay bitácora cerrada (p. ej. `docs/codex/peticiones-fusion-items-1-65.md`), esa lista manda sobre interpretaciones nuevas.
- Sin dependencias nuevas salvo acuerdo explícito.

## Stack y dirección (resumen)

- Angular standalone, Tailwind, componentes reutilizables, UI enterprise compacta (SAP/Fiori).
- Layout obligatorio: **header** (breadcrumb + título) → **botonera** fila separada debajo, **derecha**, orden `[Secundario] [Primario]` → **contenido** en card principal. No botonera dentro de la card ni abajo duplicada.
- Mejoras visuales / estilos: registrar en `docs/codex/peticiones-estilos.md` (obligatorio según AGENTS).

## Orden de lectura sugerido

| Situación | Leer primero |
|-----------|----------------|
| Pantalla nueva o refino UI general | `AGENTS.md` → `ui-form-guidelines.md` → `ui-button-guidelines.md` |
| Grilla / anchos / checklist 7 ítems | `docs/codex/estilos/README.md` |
| Dónde está CSS y componentes compartidos | `docs/codex/temas/implementacion-ui.md` |
| Módulos al estilo empleados | `docs/codex/temas/base-angular-empleados.md` |
| Menú lateral y rutas | `docs/codex/temas/crear-menu-base.md` |
| Ficha empleado (modo básico, edición, alta avanzada) | `docs/codex/modulos/empleados/creacion-basica.md`, `ficha-empleado.md`, `creacion-avanzada.md` |
| Parámetros y sync | `docs/codex/modulos/parametros/README.md`, `campos-y-listas.md`, `sync-parametros-v611.md`, `permisos-bd-ejemplo.sql` |
| Visión proyecto / tipografía (pesos) | `docs/codex/manual-base-proyecto.md`, raíz `README.md` |
| Supabase / SQL base | `SUPABASE_SETUP.md`, `bd/README.md`, `bd/base/README.md`, `bd/base/v11/README.md` |

Índice completo de tablas y enlaces: siempre `docs/codex/README.md`.

## Regla tipográfica (manual base)

- Evitar `700` como peso base de labels, tabs, badges y texto de soporte; preferir `500`–`600`; reservar peso alto solo para el dato protagonista. Detalle en `manual-base-proyecto.md` y `ui-form-guidelines.md`.

## Anti‑patrones (no sustituyen leer AGENTS)

Formularios en muchas columnas; inputs sin label; placeholder como label; sidebar dominante; cards anidadas sin necesidad; espaciado fuera de tokens; paletas nuevas o gradientes decorativos.

## Flujo del agente (orden fijo)

1. **Aclarar** alcance y tipo de cambio si no están claros (sección “pedir y aclarar”).
2. **Identificar** tema: UI general, botones, empleados, parámetros, BD, etc.
3. **Read** los archivos de la tabla “Orden de lectura” (mínimo `AGENTS.md` + el específico del tema).
4. **Implementar** con tokens y patrones ya presentes en el repo (`ui-form-guidelines.md` enlaza referencias de código cuando aplique).
5. **Autorevisar** con la sección “revisar antes de cerrar”; ajustar si algo falla el checklist.
6. **Responder** al usuario con resultado y, si aplica, qué quedó validado contra `docs/codex`.
