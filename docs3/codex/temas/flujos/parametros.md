# Flujo - Parámetros del sistema

## Ruta

- **`/parametros`** - `ParametrosPage` (`src/app/pages/parametros.page.ts`).

## Objetivo del usuario

Gestionar **parámetros legales y operativos** del período de remuneración activo: catálogos globales, datos por **vigencia**, datos **mensuales** oficiales y estado del período, sin confundir “vacío” con “falta solo carga mensual”.

## Recorrido típico

1. Entrar a **Parámetros** desde el menú.
2. Revisar banda superior (período, estado mensual / sincronización según UI).
3. Cambiar de **tab** y **subtab** según el tema (valores, remuneraciones, tramos, salud, previsión, etc.).
4. Cargar o editar datos respetando la distinción período vs vigencia vs catálogo global.

## Documentación relacionada (módulo)

| Tema | Documento |
|------|-------------|
| Punto de entrada | [`../../modulos/parametros/README.md`](../../modulos/parametros/README.md) |
| Contrato resumen | [`../../modulos/parametros/contrato-general.md`](../../modulos/parametros/contrato-general.md) |
| Estándar visual del módulo | [`../../modulos/parametros/ui-parametros.md`](../../modulos/parametros/ui-parametros.md) |
| Período, vigencia y catálogo | [`../../modulos/parametros/periodo-vigencia-catalogo.md`](../../modulos/parametros/periodo-vigencia-catalogo.md) |
| Campos y listas | [`../../modulos/parametros/campos-y-listas.md`](../../modulos/parametros/campos-y-listas.md) |
| Reforma / gradualidad (8,5 %) | [`../../modulos/parametros/reforma-gradualidad.md`](../../modulos/parametros/reforma-gradualidad.md) |
| Python y carga mensual | [`../../modulos/parametros/python-carga-mensual.md`](../../modulos/parametros/python-carga-mensual.md) |
| Sync v6.11 | [`../../modulos/parametros/sync-parametros-v611.md`](../../modulos/parametros/sync-parametros-v611.md) |
| Permisos / ejemplo SQL | [`../../modulos/parametros/permisos-bd-ejemplo.sql`](../../modulos/parametros/permisos-bd-ejemplo.sql) |
| Tests | [`../../modulos/parametros/tests-parametros.md`](../../modulos/parametros/tests-parametros.md) |
| Tablas y DataGrid | [`../../ui-tables.md`](../../ui-tables.md) |

## Pruebas

- Capturas por pestaña: `tests/parametros-tabs.screenshots.spec.ts`.
- Snapshot de listado de rutas: `tests/dashboard.spec.ts` (`parametros`).
