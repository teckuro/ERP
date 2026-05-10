# Movimientos variables - decisiones operativas

Complementa [`contrato-general.md`](./contrato-general.md). En conflicto sobre **criterio de producto** entre ambos, prevalece este archivo hasta revision explicita.

## 1. Periodo y pertenencia

- Todo movimiento variable pertenece a un periodo **`YYYY-MM`**.
- No existe movimiento sin periodo.
- No registrar contra periodo **cerrado** a carga: regla para cuando exista Proceso mensual y estado oficial de periodo (implementacion futura).

## 2. Separacion de modulos

- **No** reemplaza Haberes recurrentes.
- **No** calcula liquidacion ni motor.
- **No** elimina fisicamente como operacion normal: se **anula** (estado ANULADO) y se conserva historial.

## 3. Proceso mensual futuro

- Solo movimientos en estado **VALIDADO** (o equivalente aprobado) entran al proceso mensual / prevalidaciones.
- No entran: BORRADOR, OBSERVADO, ANULADO, BLOQUEADO (salvo definicion futura distinta).

## 4. Duplicados (recomendacion v1)

- **Recomendacion v1:** bloquear duplicado por **trabajador + concepto + periodo**.
- **Alternativa:** permitir multiples lineas del mismo concepto en el mismo periodo solo si existe **referencia/grupo** distintivo aprobado por producto (pendiente de fase de datos).

## 5. Monto

- Monto **numerico** y **mayor que cero**, salvo regla futura explicita para conceptos que permitan cero.
- Pendientes no v1: cantidad, unidad, porcentaje, factor, valor calculado, topes.

## 6. Conceptos utilizables

- El movimiento **referencia** un concepto del catalogo.
- **Pendiente producto:** flag o regla en catalogo para **solo variable**, **solo recurrente** o **ambos**; hoy no se implementa en codigo.
- Contrato guia hasta esa decision: conceptos tipo **HABER** o **DESCUENTO** vigentes para uso operativo; **no** sistema automatico ni **calculo automatico** salvo regla futura aprobada; **APORTE_EMPLEADOR** manual solo si producto aprueba excepcion.

## 7. Ruta de aplicacion

- Ruta oficial **planificada:** `/remuneraciones/movimientos-variables`.
- En 9.4A no hay pantalla obligatoria; al implementar UI, alinear con dominio Remuneraciones (ver Fase 9.3B.1 en [`../../orquestador/estado-fases.md`](../../orquestador/estado-fases.md)).

## 8. Fuera de alcance de decisiones aqui

RLS/JWT detallado, motor, liquidaciones, Previred/LRE, importadores masivos, auditoria avanzada: se tratan en fases posteriores.

## 9. Fase 9.4B - reflejo en codigo (referencia)

Las decisiones de secciones 3 a 6 quedan implementadas en reglas puras TypeScript (ver [`modelo-tecnico-9-4B.md`](./modelo-tecnico-9-4B.md)): duplicado operativo sin contar `ANULADO` como bloqueo; monto > 0; tipo HABER/DESCUENTO y exclusion de automatico/sistema cuando se pasa snapshot; anulacion prohibida desde `BLOQUEADO` e `INCLUIDO_EN_PROCESO`. **CHILE-FIX-01:** en `crear`/`actualizar` el snapshot lo construye el servicio desde catalogo; aptitud y vigencia de contrato en periodo en el mismo servicio (ver [`hardening-chile-fix-01.md`](./hardening-chile-fix-01.md)).

## 10. Fase 9.4C - reflejo en persistencia (referencia)

Tabla `movimiento_variable_mensual`, indice unico parcial (sin `ANULADO`), indices de listado, repositorio Supabase y mappers alineados a 9.4B; sin RLS productivo, sin UI productiva, sin validacion de catalogo dentro del repositorio (snapshot sigue siendo responsabilidad del llamador futuro). Detalle: [`persistencia-9-4C.md`](./persistencia-9-4C.md).

## 11. Fase 9.4D - service fino (referencia)

`MovimientosVariablesService` centraliza validacion de periodo, trabajador, concepto, reglas 9.4B (incl. snapshot opcional en payload), duplicados y estados no editables antes de llamar al repository. Listado base como `MovimientoVariableListadoFila`. Sin UI productiva ni RLS. Detalle: [`service-9-4D.md`](./service-9-4D.md).
