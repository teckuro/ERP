# Mapa de documentación (`docs/codex`)

## 1. Globales (siempre relevantes)

| Documento | Rol |
|-----------|-----|
| [`../AGENTS.md`](../AGENTS.md) | Contrato del agente, stack, layout, checklist |
| [`../README.md`](../README.md) | Índice padre y orden de lectura |
| [`../ui-form-guidelines.md`](../ui-form-guidelines.md) | Formularios, tokens, mensajes |
| [`../ui-button-guidelines.md`](../ui-button-guidelines.md) | Botones y toolbar |
| [`../ui-tables.md`](../ui-tables.md) | Tablas / DataGrid |
| [`../estilos/README.md`](../estilos/README.md) | Grilla y checklist visual |
| [`../manual-base-proyecto.md`](../manual-base-proyecto.md) | Lectura del repo |
| [`README.md`](./README.md) | Rol del orquestador |
| [`contexto-proyecto.md`](./contexto-proyecto.md) | Visión, módulos, camino a remuneraciones |
| [`estado-fases.md`](./estado-fases.md) | Tablero de fases |
| **Este archivo** | Inventario: global / por módulo / vigente / histórico / reemplazado |

## 2. Por módulo (`docs/codex/modulos/`)

| Módulo | README |
|--------|--------|
| Empleados | [`../modulos/empleados/README.md`](../modulos/empleados/README.md) |
| Parámetros | [`../modulos/parametros/README.md`](../modulos/parametros/README.md) |
| Conceptos remuneración | [`../modulos/conceptos-remuneracion/README.md`](../modulos/conceptos-remuneracion/README.md) |
| Haberes y descuentos | [`../modulos/haberes-descuentos/README.md`](../modulos/haberes-descuentos/README.md) |
| Nómina mensual (visión) | [`../modulos/nomina-mensual/README.md`](../modulos/nomina-mensual/README.md) |

## 3. Vigentes en `temas/` (transversal o no migrado)

| Documento | Nota |
|-----------|------|
| [`../temas/flujos/README.md`](../temas/flujos/README.md) | Rutas ↔ recorridos |
| [`../temas/flujos/*.md`](../temas/flujos/README.md) | Flujos por área de la app |
| [`../temas/implementacion-ui.md`](../temas/implementacion-ui.md) | Dónde vive el CSS y componentes |
| [`../temas/crear-menu-base.md`](../temas/crear-menu-base.md) | Menú y rutas |
| [`../temas/base-angular-empleados.md`](../temas/base-angular-empleados.md) | Arquitectura del feature empleados (no movido a `modulos/`) |
| [`../temas/organizacion-por-modulo-y-flujos.md`](../temas/organizacion-por-modulo-y-flujos.md) | Convención + política de migración |

## 4. Histórico / bitácoras (vigentes como registro, no como contrato de flujo)

| Documento | Rol |
|-----------|-----|
| [`../peticiones-estilos.md`](../peticiones-estilos.md) | Registro de mejoras visuales |
| [`../peticiones-fusion-items-1-65.md`](../peticiones-fusion-items-1-65.md) | Bitácora fusionada |

## 5. Reemplazados (stub en `temas/`, fuente en `modulos/`)

Los siguientes nombres en **`docs/codex/temas/*.md`** (y el SQL listado) son **redirecciones** de una línea; el texto normativo vive en **`docs/codex/modulos/`**:

- `empleados-estados-completitud-aptitud.md` → `modulos/empleados/contrato-general.md`
- `modo-basico-empleado.md` → `modulos/empleados/creacion-basica.md`
- `creacion-avanzada-formulario-campos.md` → `modulos/empleados/creacion-avanzada.md`
- `creacion-avanzada-borrador-tests.md` → `modulos/empleados/borrador-continuar-alta.md`
- `flujo-edicion-ficha-empleado.md` → `modulos/empleados/ficha-empleado.md`
- `ficha-empleado-funcionamiento-y-tests-visuales.md` → `modulos/empleados/ficha-empleado.md`
- `parametros-vigencia-y-periodo.md` → `modulos/parametros/periodo-vigencia-catalogo.md`
- `parametros-ui-estandar.md` → `modulos/parametros/ui-parametros.md`
- `parametros-generales-campos-y-listas.md` → `modulos/parametros/campos-y-listas.md`
- `python-parametros-carga-mensual.md` → `modulos/parametros/python-carga-mensual.md`
- `reforma-pensiones-gradualidad.md` → `modulos/parametros/reforma-gradualidad.md`
- `sync-parametros-v611.md` → `modulos/parametros/sync-parametros-v611.md`
- `parametros-permisos-bd-ejemplo.sql` → `modulos/parametros/permisos-bd-ejemplo.sql`

## 6. Archivo

[`../archivo/README.md`](../archivo/README.md) — criterio para documentos obsoletos movidos explícitamente.
