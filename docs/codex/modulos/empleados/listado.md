# Listado de empleados

## Ruta

- **`/empleados`** — `ListadoEmpleadosContainer`.
- Query opcional: **`?filtro=incompletas`** o **`?filtro=aptas`** — precarga filtro de situación de ficha (puente desde Resumen).

## Objetivo

Ver colaboradores, **estado visible** en la fila y la **acción principal** coherente con el negocio, sin recalcular toda la aptitud en el cliente (usa datos persistidos y reglas de prioridad).

## Creación

Acción primaria **Crear empleado** → `/empleados/nuevo?modo=avanzado` (única puerta de alta). La creación básica quedó fuera de producto.

## Reglas de acción principal (resumen)

| Condición (persistido) | Presentación / acción |
|------------------------|------------------------|
| `pasoAltaAvanzada !== null` | Borrador → **Continuar alta** (`/empleados/nuevo?idPersona=…`) |
| Sin paso avanzado y ficha incompleta | En proceso → **Completar ficha** (`/empleados/:id`) |
| `estado_ficha` válido y `apto_para_remuneraciones` | Activo / Apto → **Ver ficha** |
| `estado` activo y no apto | Activo / No apto → **Revisar pendientes** |
| Suspendido, inactivo, desvinculado, bloqueado | **Ver ficha** |

El listado **no** recalcula el helper completo por fila: se apoya en campos ya materializados y en `pasoAltaAvanzada` como prioridad.

## Documentación relacionada

- Contrato completo y matriz: [`contrato-general.md`](./contrato-general.md) (secciones sobre listado y estados).
- Alta vigente: [`creacion-avanzada.md`](./creacion-avanzada.md).
- Creación básica (legado): [`creacion-basica.md`](./creacion-basica.md).
