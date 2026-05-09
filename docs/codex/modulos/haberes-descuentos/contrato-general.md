# Haberes y descuentos - contrato general

> Nombre visible en UI: `Asignaciones recurrentes`.
> Nombre tecnico/documental: `Haberes y descuentos`.
> Tabla principal: `haberdescuento_persona`.

## Que si cubre

- Asignaciones recurrentes por trabajador alineadas al periodo de remuneracion.
- UI y reglas de negocio acotadas a ese alcance.

## Que no cubre

- No son liquidaciones ni resultado de calculo mensual cerrado.
- No son movimientos puntuales del periodo (bonos puntuales del mes, comision del periodo, HE del periodo, etc.); ese dominio se muestra en UI como **Movimientos del mes** y se documenta tecnicamente como **Novedades mensuales** sobre `novedad_remuneracion_periodo`. Movimientos variables queda como legacy/transicion.
- No sustituye el catalogo de Conceptos; las asignaciones deben referenciar conceptos gobernados.

## Navegacion oficial

Haberes y descuentos pertenece al dominio **Remuneraciones**.

Ruta oficial:

```txt
/remuneraciones/haberes-descuentos
```

Ruta antigua de compatibilidad temporal (redirect):

```txt
/haberes-descuentos -> /remuneraciones/haberes-descuentos
```

Asignaciones recurrentes administra conceptos repetitivos o con vigencia por trabajador. No es catalogo maestro, no es movimiento del mes y no calcula liquidaciones.

## Dependencia

Reglas de listado asignable dependen del modulo Conceptos: [`../conceptos-remuneracion/decisiones-operativas.md`](../conceptos-remuneracion/decisiones-operativas.md), [`../conceptos-remuneracion/contrato-funcional.md`](../conceptos-remuneracion/contrato-funcional.md), [`../conceptos-remuneracion/contrato-general.md`](../conceptos-remuneracion/contrato-general.md), reglas de asignabilidad y acciones en codigo (`concepto-asignabilidad.rules.ts`, `concepto-acciones.rules.ts`) y del tablero [`../../orquestador/estado-fases.md`](../../orquestador/estado-fases.md). El servicio `HaberesDescuentosService` filtra y valida con `esConceptoAsignable` (misma regla que el catalogo).

**CHILE-FIX-01 (movimientos variables):** el mismo criterio de concepto asignable en una fecha de referencia se expone en `resolverSnapshotConceptoParaMovimientoVariableManual` para que `MovimientosVariablesService` valide altas manuales sin confiar en snapshot de cliente. Ver [`../movimientos-variables/hardening-chile-fix-01.md`](../movimientos-variables/hardening-chile-fix-01.md).

## Fase 9.3A - Vigencias, duplicados y reglas recurrentes

Haberes y descuentos administra asignaciones recurrentes por trabajador. Una asignacion recurrente debe ser valida por:

- trabajador,
- concepto,
- vigencia.

### Regla funcional central

Para un mismo **trabajador + concepto**:

- No puede existir mas de una asignacion activa.
- No se permiten rangos de vigencia superpuestos.
- Se permiten rangos consecutivos no superpuestos.
- Se permite el mismo concepto en trabajadores distintos.
- Se permiten conceptos distintos en el mismo trabajador.
- Al editar, la asignacion actual se ignora por `idAsignacion` y no se bloquea a si misma.
- Crear y actualizar ejecutan la misma validacion funcional.

Las fechas son inclusivas. Si una asignacion termina el `2026-03-31`, otra puede iniciar el `2026-04-01`; no puede iniciar el mismo `2026-03-31`.

### Vigencia derivada

La clasificacion de la asignacion es derivada en frontend/service; no se agrega columna nueva:

- `ACTIVA`: inicio valido menor o igual a la fecha de referencia, sin fin o con fin mayor o igual a la referencia, y no cerrada.
- `FUTURA`: inicio posterior a la fecha de referencia, con rango coherente y no cerrada.
- `VENCIDA`: fin anterior a la fecha de referencia, con rango coherente.
- `CERRADA`: el modelo actual lo soporta mediante `estado = false` o estado textual equivalente.
- `INVALIDA`: falta fecha de inicio, fecha no interpretable o fecha fin anterior a fecha inicio.

La regla pura vive en `src/app/features/haberes-descuentos/rules/haber-descuento-vigencia.rules.ts`.

### Fuente de verdad

Conceptos define si un concepto es asignable manualmente mediante `src/app/features/haberes-descuentos/rules/concepto-asignabilidad.rules.ts`. Haberes y descuentos no duplica esa regla: primero valida `esConceptoAsignable` / `assertConceptoPermiteAsignacionManual`, y despues valida la asignacion recurrente por trabajador, concepto y vigencia.

### Implementacion 9.3A

- `crear` y `actualizar` consultan asignaciones existentes del mismo trabajador y concepto.
- La validacion bloquea duplicados activos, rangos superpuestos y vigencias incoherentes antes de llamar al repositorio de guardado.
- Los mensajes son de negocio: concepto no asignable, fecha de termino anterior a inicio, asignacion vigente duplicada o rango superpuesto.

### No incluido

Esta fase no implementa movimientos variables mensuales, proceso mensual, motor de liquidacion, liquidaciones, Previred, LRE final, login, roles, JWT, RLS, CRUD de Conceptos, SQL destructivo, cambios en Supabase remoto ni rediseno visual profundo.

### Pendientes posteriores

- Constraint SQL o validacion en base de datos para evitar solapamientos.
- Cierre/desactivacion controlada de asignaciones.
- Movimientos variables mensuales.
- Proceso mensual y motor de liquidacion.
- Login, roles y RLS.
- Pulido visual integral.

## Fase 9.3B - Cierre/desactivacion controlada de asignaciones

Haberes y descuentos no debe eliminar fisicamente una asignacion recurrente como operacion normal para terminar su uso. El cierre conserva el registro y termina la operacion recurrente segun el modelo actual.

### Regla funcional central

Cerrar una asignacion recurrente no elimina el registro. Solo termina su vigencia cuando la fecha es coherente y la marca como cerrada/desactivada mediante `estado=false`.

Reglas:

- Cerrar/desactivar conserva el registro historico.
- Una asignacion activa puede cerrarse con fecha de cierre mayor o igual a la fecha de inicio.
- Una asignacion futura puede cerrarse/desactivarse si fue creada por error; en ese caso se marca `estado=false` sin forzar una `vigenciaFin` anterior al inicio.
- Una asignacion ya cerrada no debe cerrarse dos veces.
- Una asignacion vencida no requiere cierre operativo y se bloquea con mensaje claro.
- La fecha de cierre no puede ser anterior a la fecha de inicio para asignaciones activas.
- Fecha cierre igual a fecha inicio se permite como vigencia de un dia.
- Cerrar no exige que el concepto siga siendo asignable en el catalogo, porque pueden existir asignaciones historicas.
- Crear/actualizar siguen usando la regla de conceptos asignables y la regla de vigencia/solapamiento de 9.3A.

### Estado derivado

- `CERRADA`: si `estado=false` o equivalente.
- `VENCIDA`: si `estado=true` y `vigenciaFin` es pasada.
- `ACTIVA`: si `estado=true`, inicio valido y la fecha de referencia cae dentro del rango.
- `FUTURA`: si `estado=true` e inicio es posterior a la fecha de referencia.
- `INVALIDA`: si falta inicio valido o las fechas son incoherentes.

### Implementacion 9.3B

- Helper puro: `validarCierreAsignacion` en `src/app/features/haberes-descuentos/rules/haber-descuento-vigencia.rules.ts`.
- Service: `HaberesDescuentosService.cerrarAsignacion`.
- Repository: `obtenerAsignacionPorId` y `cerrarAsignacion`.
- UI minima: accion visible `Cerrar` por fila y confirmacion simple.

### No incluido

Esta fase no implementa delete fisico normal, auditoria avanzada, movimientos variables, proceso mensual, motor, liquidaciones, Previred, LRE final, login, roles, JWT, RLS, CRUD de Conceptos, SQL destructivo, cambios en Supabase remoto ni rediseno visual profundo.

### Pendientes posteriores

- Auditoria de cierre con usuario real cuando exista login.
- Roles, JWT y RLS.
- Constraint SQL o validacion BD contra solapamientos.
- Historial formal de cambios.
- Restauracion controlada si el negocio la requiere.
- Movimientos variables, proceso mensual y motor de liquidacion.
- Pulido visual integral.

## Fase 9.3C - Vista historica y filtros por estado de vigencia

Haberes y descuentos muestra por defecto las asignaciones recurrentes operativas y conserva el historial consultable mediante filtros. El componente no duplica reglas de fechas: consume el estado derivado por `HaberesDescuentosService.listarPorPersona`, que usa `clasificarVigenciaAsignacion`.

### Regla funcional central

- `OPERATIVAS` es el filtro default y equivale a `ACTIVA + FUTURA`.
- `TODAS` muestra operativas, vencidas, cerradas e invalidas.
- Los filtros explicitos disponibles son `ACTIVA`, `FUTURA`, `VENCIDA`, `CERRADA` e `INVALIDA`.
- Las asignaciones `VENCIDA`, `CERRADA` e `INVALIDA` permanecen visibles como historial al cambiar el filtro.
- La accion `Cerrar` solo aplica a `ACTIVA` y `FUTURA`; se evita doble cierre sobre `CERRADA` o cierre operativo sobre `VENCIDA`.
- La edicion operativa desde la grilla queda disponible solo para `ACTIVA` y `FUTURA`.

### Implementacion 9.3C

- Helper puro: `filtrarAsignacionesPorEstadoVigencia` y `etiquetaEstadoVigenciaAsignacion` en `haber-descuento-vigencia.rules.ts`.
- Modelo de listado: `estadoVigencia` y `estadoVigenciaEtiqueta`.
- Servicio: `listarPorPersona(idPersona, fechaReferencia?)` deriva estado y etiqueta.
- UI: filtro `Estado de vigencia` integrado al `DataGrid`, con `initialValue` y `predicate` para representar `OPERATIVAS` sin controles externos ni logica duplicada en la vista.
- Acciones: botones de editar/cerrar deshabilitados cuando la fila es historica o invalida.

### No incluido

Esta fase no implementa auditoria avanzada, movimientos variables, proceso mensual, motor, liquidaciones, Previred, LRE final, login, roles, JWT, RLS, SQL destructivo ni redisenio visual profundo.

## Integracion Proceso mensual (Fase 9.5B)

El modulo expone listado global de asignaciones con concepto (`HaberesDescuentosRepository.listarTodasAsignacionesConConcepto`) y el metodo `HaberesDescuentosService.listarAsignacionesParaPrevalidacionMensual(periodo)`, que reutiliza `vigenciaIntersecaMes` y `clasificarVigenciaAsignacion` para alimentar prevalidaciones de **Nomina mensual** sin calcular liquidaciones. Contrato del consumidor: [`../nomina-mensual/prevalidaciones-9-5B.md`](../nomina-mensual/prevalidaciones-9-5B.md).

<!-- ARQ-ERP-01-INTEGRACION -->

## Nota canonica 2026-05-07

Donde este contrato hable de Movimientos variables, entender que el nombre funcional oficial futuro es **Novedades mensuales**.

Regla:

- Si se repite o queda pactado, vive en Haberes y descuentos recurrentes (`haberdescuento_persona`).
- Si ocurre solo en el periodo, vive en Novedades mensuales (`novedad_remuneracion_periodo`).
- No duplicar el mismo pago/descuento en recurrentes y novedades sin regla de negocio explicita.
