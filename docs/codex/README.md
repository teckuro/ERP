# Documentación ERP — índice padre (reglas y temas)

**Este es el único punto de entrada** para normas de producto, UI y flujos en `docs/codex`. El resto está repartido **por tema**; aquí no se repiten definiciones que ya viven en otros archivos.

---

## Cada petición: qué pedir y qué se aplica

Para que el trabajo respete **reglas de negocio y de UI** sin ambigüedad:

1. **Alcance**: pantalla, archivo o flujo concreto (evita cambios colaterales no deseados).
2. **Tipo de cambio**: solo UI, solo lógica, o ambos; si el contrato dice «solo UI», no tocar guardado, servicios ni `formControlName` sin acuerdo explícito.
3. **Fuente de verdad** si hay lista cerrada: p. ej. [`peticiones-fusion-items-1-65.md`](./peticiones-fusion-items-1-65.md) u otra bitácora; esa lista manda sobre interpretaciones nuevas.
4. **Jerarquía de documentos** (en conflicto gana el primero):
   1. [`AGENTS.md`](./AGENTS.md) — contrato del agente (stack, layout obligatorio, anti‑patrones, checklist).
   2. **Este README** — índice y cómo pedir; no sustituye a `AGENTS.md`.
   3. [`ui-form-guidelines.md`](./ui-form-guidelines.md) — tokens, formularios, mensajes, detalle visual.
   4. Guías del tema (empleados, parámetros, etc.) enlazadas abajo.

Si falta un caso: primero `ui-form-guidelines.md` y `AGENTS.md`; luego temas específicos.

---

## Índice por tema

### Contrato y formularios (UI central)

| Documento | Contenido |
|-----------|-----------|
| [`AGENTS.md`](./AGENTS.md) | Contrato agente, prioridades, tokens resumidos, layout ERP, anti‑patrones |
| [`ui-form-guidelines.md`](./ui-form-guidelines.md) | Tokens completos, formularios, MessageBox, loading, checklist |
| [`ui-button-guidelines.md`](./ui-button-guidelines.md) | Botones, toolbar, variantes |
| [`ui-tables.md`](./ui-tables.md) | Estándar de tablas, DataGrid, columnas, formatos, filtros, empty states y responsive |
| [`estilos/README.md`](./estilos/README.md) | Grilla 8 columnas, anchos, checklist de cierre (7 ítems) |
| [`temas/implementacion-ui.md`](./temas/implementacion-ui.md) | Dónde está el CSS y componentes en el repo (sin duplicar tokens) |

### Proyecto y tipografía

| Documento | Contenido |
|-----------|-----------|
| [`manual-base-proyecto.md`](./manual-base-proyecto.md) | Lectura del proyecto, regla tipográfica (pesos) |
| [`../../README.md`](../../README.md) | Visión producto y stack (raíz repo) |

### Empleados / Angular

| Documento | Contenido |
|-----------|-----------|
| [`modo-basico-empleado.md`](./temas/modo-basico-empleado.md) | Modo básico de ficha |
| [`base-angular-empleados.md`](./temas/base-angular-empleados.md) | Módulos al estilo del repo |
| [`flujo-edicion-ficha-empleado.md`](./temas/flujo-edicion-ficha-empleado.md) | Edición de ficha |
| [`crear-menu-base.md`](./temas/crear-menu-base.md) | Menú lateral y rutas |
| [`creacion-avanzada-formulario-campos.md`](./temas/creacion-avanzada-formulario-campos.md) | Alta avanzada: bloques y tabs |
| [`creacion-avanzada-borrador-tests.md`](./temas/creacion-avanzada-borrador-tests.md) | Pruebas borrador / continuar alta (fase 1 cubierta, fase 2 con `E2E_EMPLEADOS_BORRADOR`) |

### Parámetros y sync

| Documento | Contenido |
|-----------|-----------|
| [`parametros-generales-campos-y-listas.md`](./temas/parametros-generales-campos-y-listas.md) | Campos y catálogos |
| [`parametros-ui-estandar.md`](./temas/parametros-ui-estandar.md) | Estándar visual del módulo Parámetros: banda, tabs, subtabs, copy, DataGrid y responsive |
| [`parametros-vigencia-y-periodo.md`](./temas/parametros-vigencia-y-periodo.md) | Clasificación período vs vigencia vs catálogo (UI/Python) |
| [`python-parametros-carga-mensual.md`](./temas/python-parametros-carga-mensual.md) | Contrato Python: mensual, vigencias, seeds normativos, catalogos globales y configuracion empresa |
| [`sync-parametros-v611.md`](./temas/sync-parametros-v611.md) | Parámetros v611 |
| [`parametros-permisos-bd-ejemplo.sql`](./temas/parametros-permisos-bd-ejemplo.sql) | Ejemplo SQL / Supabase |

### Bitácoras (no son normativa base)

| Documento | Contenido |
|-----------|-----------|
| [`peticiones-estilos.md`](./peticiones-estilos.md) | Registro de mejoras visuales por fecha |
| [`peticiones-fusion-items-1-65.md`](./peticiones-fusion-items-1-65.md) | Índice de trabajo fusionado |

### Base de datos e infra (fuera de UI)

| Ubicación | Contenido |
|-----------|-----------|
| [`../../SUPABASE_SETUP.md`](../../SUPABASE_SETUP.md) | Supabase |
| [`../../bd/README.md`](../../bd/README.md), [`../../bd/base/README.md`](../../bd/base/README.md), [`../../bd/base/v11/README.md`](../../bd/base/v11/README.md) | Esquema SQL (`bd/` solo `base/`) |

---

## Orden de lectura sugerido (pantalla nueva o refino UI)

1. [`AGENTS.md`](./AGENTS.md)  
2. [`ui-form-guidelines.md`](./ui-form-guidelines.md)  
3. [`ui-button-guidelines.md`](./ui-button-guidelines.md)  
4. Si aplica tabla/listado: [`ui-tables.md`](./ui-tables.md)
5. Si aplica: [`estilos/README.md`](./estilos/README.md)
6. Si aplica al flujo: tema empleados o parámetros en la tabla anterior

**Mejoras visuales**: registrar en [`peticiones-estilos.md`](./peticiones-estilos.md) (obligatorio según `AGENTS.md`).

---

## Carpeta `temas/`

Documentos auxiliares que **no duplican** el contrato de `AGENTS.md`: [`temas/README.md`](./temas/README.md).
