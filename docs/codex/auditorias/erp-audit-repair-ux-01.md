# ERP-AUDIT-REPAIR-UX-01

## Objetivo

Revision integral, reparacion controlada y mejora UX/UI local del proyecto.

## Alcance

- Modulos revisados: Nomina mensual / Preparar nomina.
- Archivos revisados:
  - `src/app/features/nomina-mensual/containers/proceso-mensual-container/proceso-mensual-container.ts`
  - `src/app/features/nomina-mensual/containers/proceso-mensual-container/proceso-mensual-container.html`
  - `src/app/features/nomina-mensual/containers/proceso-mensual-container/proceso-mensual-container.css`
  - `src/app/features/nomina-mensual/containers/proceso-mensual-container/proceso-mensual-container.spec.ts`
  - `docs/codex/modulos/nomina-mensual/preparar-nomina/README.md`
- Archivos modificados:
  - `src/app/features/nomina-mensual/containers/proceso-mensual-container/proceso-mensual-container.ts`
  - `src/app/features/nomina-mensual/containers/proceso-mensual-container/proceso-mensual-container.html`
  - `src/app/features/nomina-mensual/containers/proceso-mensual-container/proceso-mensual-container.css`
  - `src/app/features/nomina-mensual/containers/proceso-mensual-container/proceso-mensual-container.spec.ts`
  - `docs/codex/CHANGELOG.md`
  - `docs/codex/orquestador/estado-fases.md`
  - `docs/codex/peticiones-estilos.md`
  - `docs/codex/modulos/nomina-mensual/preparar-nomina/README.md`

## Cambios aplicados

- Reparaciones tecnicas:
  - Se reemplazo `window.confirm` en guardar resultado preliminar, aprobar resultado y cerrar nomina por un estado local de confirmacion.
  - Las acciones criticas solo llaman al servicio despues de confirmar en el modal.
  - Se agrego cobertura de componente para validar que guardar, aprobar y cerrar no persisten antes de la confirmacion.
- Mejoras UX/UI:
  - Las confirmaciones usan `app-message-box` modal con titulo, motivo, detalle de alcance, puntos de revision RRHH y acciones claras.
  - Se evita el dialogo nativo del navegador con texto largo.
  - Se conserva copy operativo: no emite liquidaciones, no cierra cuando solo aprueba y no genera archivos externos.
- Ajustes de documentacion:
  - Changelog, estado de fases, peticiones de estilos y README de Nomina mensual actualizados.

## Validaciones

- `npm ci --ignore-scripts`: OK. NPM reporta 5 vulnerabilidades preexistentes (4 moderadas, 1 alta).
- `npx tsc -p tsconfig.app.json --noEmit`: OK.
- `npx tsc -p tsconfig.spec.json --noEmit`: OK.
- `npm run build -- --configuration development`: OK.
- `npm test -- --watch=false`: falla en tests de Empleados no modificados por esta fase:
  - `empleado-borrador-form.validation.spec.ts`: expectativa `pais` vs mensaje visible `país`.
  - `form-empleado.spec.ts`: secuencia de honorarios esperada `[0,1,2,3,7,8]`, actual `[0,1,2,3,7,9]`.
  - `form-empleado.spec.ts`: dos expectativas con texto `cesant?a` no coinciden con `cesantía`.
- `npm test -- --watch=false --include src/app/features/nomina-mensual/containers/proceso-mensual-container/proceso-mensual-container.spec.ts`: OK, 37 tests.
- `npx vitest run src/app/features/nomina-mensual/containers/proceso-mensual-container/proceso-mensual-container.spec.ts`: no aplica en esta configuracion; falla antes de ejecutar por `describe is not defined`.

## No se toco

- SQL/RPC/RLS: no modificado.
- Motor: no modificado.
- Nomina/liquidaciones: no se cambiaron reglas ni persistencia; solo confirmaciones UI del contenedor.
- Estilos globales protegidos: no modificados.
- Configuracion Angular/Tailwind/PostCSS: no modificada.
- Otros modulos fuera de alcance: no modificados.

## Pendientes

- Revisar en fase separada los 4 tests fallidos de Empleados, porque estan fuera del alcance aplicado en Nomina mensual.
- Mantener como deuda separada cualquier `window.confirm` fuera de Nomina mensual si aparece en futuras auditorias.
