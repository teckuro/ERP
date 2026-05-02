# Flujo — Parámetros del sistema

## Ruta

- **`/parametros`** — `ParametrosPage` (`src/app/pages/parametros.page.ts`).

## Objetivo del usuario

Gestionar **parámetros legales y operativos** del período de remuneración activo: catálogos globales, datos por **vigencia**, datos **mensuales** oficiales y estado del período, sin confundir “vacío” con “falta solo carga mensual”.

## Recorrido típico

1. Entrar a **Parámetros** desde el menú.
2. Revisar banda superior (período, estado mensual / sincronización según UI).
3. Cambiar de **tab** y **subtab** según el tema (valores, remuneraciones, tramos, salud, previsión, etc.).
4. Cargar o editar datos respetando la distinción período vs vigencia vs catálogo global.

## Documentación relacionada

| Tema | Documento |
|------|-------------|
| Estándar visual del módulo | [`../parametros-ui-estandar.md`](../parametros-ui-estandar.md) |
| Período, vigencia y catálogo | [`../parametros-vigencia-y-periodo.md`](../parametros-vigencia-y-periodo.md) |
| Campos y listas | [`../parametros-generales-campos-y-listas.md`](../parametros-generales-campos-y-listas.md) |
| Reforma / gradualidad (8,5 %) | [`../reforma-pensiones-gradualidad.md`](../reforma-pensiones-gradualidad.md) |
| Python y carga mensual | [`../python-parametros-carga-mensual.md`](../python-parametros-carga-mensual.md) |
| Sync v6.11 | [`../sync-parametros-v611.md`](../sync-parametros-v611.md) |
| Permisos / ejemplo SQL | [`../parametros-permisos-bd-ejemplo.sql`](../parametros-permisos-bd-ejemplo.sql) |
| Tablas y DataGrid | [`../../ui-tables.md`](../../ui-tables.md) |

## Pruebas

- Capturas por pestaña (generación de PNG): `tests/parametros-tabs.screenshots.spec.ts`.
- Snapshot de listado de rutas: `tests/dashboard.spec.ts` (`parametros`).
