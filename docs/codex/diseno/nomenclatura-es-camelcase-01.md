# NOMENCLATURA-ES-CAMELCASE-01

## Objetivo

Normalizar nombres internos de Empleados y de la capa de presentacion de Nomina mensual para que los simbolos TypeScript queden en espanol/camelCase, sin cambiar contratos externos, SQL/Supabase, rutas, selectores Angular, clases CSS ni comportamiento funcional.

## Criterios usados

- Renombrar solo simbolos internos seguros: tipos, interfaces, propiedades del VM de presentacion, helpers y variables locales.
- Mantener nombres externos o convenciones de librerias: `DataGridColumn`, `MessageBoxSection`, `Router`, `signal`, `payload`, `statusChip`, `label`, `value`, selectores Angular y clases CSS.
- No modificar nombres de tablas, columnas, RPC, RLS, rutas publicas ni payloads Supabase.

## Que se renombro

- Tipos `EmployeeFicha*` / `EmployeeFile*` a equivalentes `*FichaEmpleado`.
- VM de estado de ficha: `issues`, `blockKey`, `blockLabel`, `progressPercent`, `canValidateForPayroll`, `actionLabel`, `actionHint` a `faltantes`, `claveBloque`, `etiquetaBloque`, `porcentajeAvance`, `puedeValidarRemuneraciones`, `etiquetaAccion`, `ayudaAccion`.
- Alta avanzada de empleados: `AltaAplicabilidadState` a `EstadoAplicabilidadAlta`, `AltaCoherenciaIssue` a `InconsistenciaCoherenciaAlta`, `AltaCoherenciaState` a `EstadoCoherenciaAlta`, `items`/`steps` del estado de aplicabilidad a `campos`/`pasos`, `issues` de coherencia a `inconsistencias`, `coherenciaIssues*` a `inconsistenciasCoherencia*` y `activeWizardStep` a `pasoWizardActivo`.
- Presentacion de nomina mensual: tipos `Payroll*DetailRow` y `PayrollSeguimientoItem` a `FilaDetalle*Nomina` e `ItemSeguimientoNomina`; helpers `buildPayroll*`/`payroll*` a `construir*Nomina`/`*Nomina`; conteos `workerRowCount`, `movementRowCount`, `recurrentRowCount`, `resultRowCount` a `cantidadFilas*`.

## Que no se renombro

- `payload` en mappers, servicios y evaluacion de completitud porque actua como contrato interno compartido de persistencia.
- Campos `label`, `value`, `statusChip`, `tone`, `DataGridColumn` y `MessageBoxSection` porque pertenecen a contratos de componentes, librerias o patrones ya establecidos.
- Clases CSS `employee-*`, `payroll-*`, selectores Angular, rutas y nombres de archivos kebab-case.
- SQL/Supabase, tablas, columnas, RPC y RLS.
- `snapshot`, `issues` e `items` dentro de `proceso-mensual.model.ts`, reglas de motor/snapshot, repositorios de snapshot y specs de persistencia, porque son contratos de calculo, trazabilidad o payload persistido.

## Riesgos

- Riesgo bajo de bindings rotos mitigado con `tsc` app/spec y specs afectados.
- Nomina mensual conserva `snapshot`/`issues` de contratos de motor y persistencia; renombrarlos requiere migracion de payloads y repositorios.

## Validaciones ejecutadas

- `npx tsc -p tsconfig.app.json --noEmit`
- `npx tsc -p tsconfig.spec.json --noEmit`
- `npx ng test --watch=false --include="src/app/features/empleados/**/*.spec.ts"`: OK, 16 files / 122 tests.
- `npx ng test --watch=false --include="src/app/features/nomina-mensual/**/*.spec.ts"`: OK, 42 files / 454 tests.
- `npm run build`: compila bundles, pero falla por budget CSS preexistente en `src/app/features/empleados/containers/ficha-empleado-container/ficha-empleado-container.css` (24.15 kB vs limite 24.00 kB, exceso 151 bytes). Se mantiene como bloqueo externo a la normalizacion porque el plan excluye cambios visuales/CSS.

## Deuda pendiente

- Evaluar una fase especifica para nombres visuales CSS si se decide traducir solo documentacion, sin tocar clases publicas.
- Si se quiere eliminar `snapshot`/`issues` del dominio de nomina, definir primero una migracion de contratos persistidos y adaptadores de compatibilidad.
- Resolver o ajustar el budget CSS de ficha empleado en una fase visual separada.
