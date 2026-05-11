# Movimientos variables - UI carga manual controlada (Fase 9.4E)

## Objetivo

Pantalla operativa mínima bajo **`/remuneraciones/movimientos-variables`**: listado por período, carga manual con validación vía **`MovimientosVariablesService`**, catálogos de trabajador y concepto alineados a **Empleados** y **HaberesDescuentosService.listarConceptos** (mismo universo asignable que Haberes recurrentes), anulación con confirmación y motivo opcional.

## Rutas y navegación

```txt
/remuneraciones/movimientos-variables   (lazy: movimientos-variables.page -> container)
/movimientos-variables                    (redirect -> ruta oficial)
```

Menú lateral: ítem **Movimientos variables** entre **Haberes y descuentos** y **Proceso mensual**.

## Flujo de pantalla (ASCII)

```txt
[Breadcrumb: Remuneraciones > Movimientos variables]
[Refrescar] [Nuevo movimiento]

Período activo (referencia): <etiqueta global>
Filtro: [ input month YYYY-MM ] [ Buscar ]

DataGrid: movimientos del período
  - columnas: trabajador, concepto, monto, estado, …
  - filtro texto sobre fila enriquecida (trabajador + concepto + estado)
  - acción: Anular (solo si reglas 9.4B permiten anular)

Modal «Nuevo movimiento»:
  - trabajador (search-select)
  - concepto (search-select, listarConceptos)
  - monto, estado al crear (BORRADOR | VALIDADO), observación
  - Guardar -> service.crear({ origen: MANUAL, concepto snapshot opcional })
  - CHILE-FIX-01: el servicio resuelve tipo/candados desde catalogo; snapshot en payload es solo ayuda UI / legacy.
```

## Flujo anulación

```txt
Clic Anular -> modal confirmación + motivo opcional -> service.anular(id, payload)
```

## Qué no incluye esta fase

- Edición inline de movimientos existentes (solo alta y anulación).
- Motor, liquidaciones, bloqueo por período cerrado en UI, RLS/JWT, importación masiva.
- Uso de **`MovimientosVariablesRepository`** desde la UI (solo service).

## Código de referencia

- Contenedor: `src/app/features/movimientos-variables/containers/movimientos-variables-container/`
- Página: `src/app/pages/movimientos-variables.page.ts`
- Rutas: `src/app/app.routes.ts` (hijo `remuneraciones` + redirect raíz)
- Menú: `src/app/layout/sidebar.component.ts`

## Pruebas

- Smoke de componente: `movimientos-variables-container.spec.ts`
- Suite global: `npm test -- --watch=false`
