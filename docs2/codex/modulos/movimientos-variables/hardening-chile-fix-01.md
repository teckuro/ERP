# CHILE-FIX-01 - Endurecimiento movimientos variables (servidor)

Documento ASCII. Cierra hallazgos **QA-CHILE-01-ALTO-001** y **QA-CHILE-01-ALTO-002** del informe [`../../auditorias/qa-chile-01-remuneraciones.md`](../../auditorias/qa-chile-01-remuneraciones.md). Sin motor, liquidaciones, Previred/LRE, SQL destructivo, RLS/JWT ni rediseno visual.

## 1. Objetivo

- **ALTO-001:** La validacion de tipo/candados del concepto **no** puede depender de un snapshot opcional enviado por el cliente. Debe resolverse contra el **catalogo** en la capa de servicio.
- **ALTO-002:** Alta y edicion de movimiento variable deben comprobar **trabajador apto para remuneraciones**, **estado activo** y **contrato que intersecta el mes** del periodo `YYYY-MM`.

## 2. Flujo resumido (ASCII)

```txt
crear / actualizar
  -> EmpleadosService.obtenerPorId(idPersona)
       -> existe, aptoParaRemuneraciones, estado === activo
       -> formValue.contrato.fechaIngreso + fechaTermino vs periodo (vigenciaIntersecaMes)
  -> HaberesDescuentosService.resolverSnapshotConceptoParaMovimientoVariableManual(idConcepto, refDate)
       -> refDate = primer instante del mes del periodo (misma idea que inicioDiaReferencia en asignabilidad)
       -> obtenerConceptoParaAsignacion + esConceptoAsignable + mensajes en espanol ASCII
  -> validarMovimientoVariableInput(input, snapshotServidor)
  -> duplicados -> repository (payload sin concepto)
```

## 3. Codigo tocado

| Area | Archivo |
|------|---------|
| Resolucion concepto | `src/app/features/haberes-descuentos/services/haberes-descuentos.service.ts` (`resolverSnapshotConceptoParaMovimientoVariableManual`, tipo export `SnapshotConceptoMovimientoVariable`) |
| Validacion movimiento | `src/app/features/movimientos-variables/services/movimientos-variables.service.ts` |
| Modelo (comentarios) | `src/app/features/movimientos-variables/models/movimiento-variable.model.ts` |
| Reglas (comentario) | `src/app/features/movimientos-variables/rules/movimiento-variable-validacion.rules.ts` |
| Pruebas | `haberes-descuentos.service.spec.ts`, `movimientos-variables.service.spec.ts` |

## 4. Fuera de alcance (explicito)

- Periodo **cerrado** a carga (sigue en proceso mensual futuro).
- Flag catalogo **solo variable / solo recurrente** (ALTO-003 sin cambio).
- UI: puede seguir enviando `concepto` en el payload por compatibilidad; el servicio **no** lo usa para candados de catalogo.

## 5. Referencias cruzadas

- Service 9.4D actualizado: [`service-9-4D.md`](./service-9-4D.md).
- UI 9.4E: [`ui-9-4E.md`](./ui-9-4E.md).
- Tablero: [`../../orquestador/estado-fases.md`](../../orquestador/estado-fases.md).

## 6. Pruebas de regresion

```txt
npm test -- --watch=false
```

Suites relevantes: `haberes-descuentos.service.spec.ts`, `movimientos-variables.service.spec.ts`.
