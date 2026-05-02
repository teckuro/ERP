# Flujo — Empleados (listado, altas y ficha)

## Rutas

| Ruta | Componente / contenedor |
|------|-------------------------|
| `/empleados` | Listado de empleados |
| `/empleados/nuevo` | Alta avanzada (wizard `FormEmpleado`) |
| `/empleados/nuevo?modo=basico` | Alta básica (pantalla dedicada) |
| `/empleados/nuevo?idPersona=<id>` | Continuar borrador avanzado |
| `/empleados/:id` | Ficha empleado (`FichaEmpleadoContainer`) |

Definición en `src/app/features/empleados/empleados.routes.ts`.

## Objetivos del usuario

1. **Listado** — buscar colaboradores, ver estado operativo y CTA (Continuar alta, Completar ficha, Ver ficha, Revisar pendientes).
2. **Nueva ficha** — dar de alta un empleado (básico o avanzado).
3. **Continuar alta** — retomar wizard con borrador persistido.
4. **Ficha** — completar por secciones, ver estado/aptitud/pendientes y **Validar para remuneraciones** cuando aplique.

## Recorrido resumido

### Listado → acción

- Según `estado`, `estadoFicha`, `aptoParaRemuneraciones` y `pasoAltaAvanzada`, el listado muestra la acción siguiente (sin exponer columnas técnicas al usuario final).

### Alta básica

- Flujo corto: datos mínimos → guardar → queda ficha en proceso para completar en `/empleados/:id`.

### Alta avanzada

- Wizard por pasos; opción **Guardar borrador**; al finalizar se valida completitud con el helper central.

### Ficha (`/empleados/:id`)

Orden de trabajo en pantalla:

1. Revisar **panel superior** (estado ficha, aptitud, pendientes, CTA).
2. Revisar **panel lateral** (completitud %, mismos faltantes, impacto, acciones rápidas).
3. Recorrer **pestañas en este orden** (coincide con chips en UI): **General → Laboral → Remuneración → Previsión y salud → Pago → Documentos → Historial**.
4. En cada pestaña editable: **lectura por bloques** → **Editar** → cambios → **Guardar cambios** o **Cancelar**.

Tabla detallada (bloques, componentes, `saveTarget`): **[`flujo-edicion-ficha-empleado.md`](../flujo-edicion-ficha-empleado.md) §3**.

- **Validar para remuneraciones**: acción explícita cuando el helper no tiene bloqueos y aplica opción B ([`empleados-estados-completitud-aptitud.md`](../empleados-estados-completitud-aptitud.md) §21).

## Documentación relacionada

| Tema | Documento |
|------|-------------|
| Estados, completitud, aptitud, validar remuneraciones | [`../empleados-estados-completitud-aptitud.md`](../empleados-estados-completitud-aptitud.md) |
| Edición por tabs y bloques | [`../flujo-edicion-ficha-empleado.md`](../flujo-edicion-ficha-empleado.md) |
| Ficha técnica y tests de imagen | [`../ficha-empleado-funcionamiento-y-tests-visuales.md`](../ficha-empleado-funcionamiento-y-tests-visuales.md) |
| Modo básico | [`../modo-basico-empleado.md`](../modo-basico-empleado.md) |
| Arquitectura Angular empleados | [`../base-angular-empleados.md`](../base-angular-empleados.md) |
| Wizard avanzado (campos) | [`../creacion-avanzada-formulario-campos.md`](../creacion-avanzada-formulario-campos.md) |
| Borrador y E2E | [`../creacion-avanzada-borrador-tests.md`](../creacion-avanzada-borrador-tests.md) |
| Menú | [`../crear-menu-base.md`](../crear-menu-base.md) |

## Pruebas (referencia)

- Unit: helper completitud, ficha container, borrador hidratación, formulario (según `src/app/features/empleados`).
- Playwright: `tests/empleados-basic-create.spec.ts`, `tests/empleados-borrador.spec.ts`, `tests/empleados-wizard-stability.spec.ts`, flujo nueva ficha en `tests/dashboard.spec.ts`; persistencia opt-in `tests/empleados-borrador-persistencia.spec.ts`.
