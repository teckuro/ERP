# Movimientos variables mensuales - contrato general

Indice normativo del modulo. Decisiones de producto compactas: [`decisiones-operativas.md`](./decisiones-operativas.md). Punto de entrada: [`README.md`](./README.md).

## 1. Objetivo del modulo

Documentar y, en fases futuras, implementar el mantenedor de **movimientos variables mensuales**: registros puntuales de haber o descuento por **trabajador**, **concepto** y **periodo** (`YYYY-MM`), como entrada del periodo hacia un **Proceso mensual** y **Motor** aun no productivos en este alcance.

## 2. Alcance (fase 9.4A)

- Contrato funcional y separacion clara respecto de Conceptos, Haberes recurrentes, Proceso mensual, Motor y Liquidaciones.
- Estados funcionales propuestos y reglas minimas de validacion **documentadas**.
- Ruta futura y modelo conceptual de campos **sin** crear tabla SQL en esta fase (la tabla fisica queda en **9.4C**; ver [`persistencia-9-4C.md`](./persistencia-9-4C.md)). La capa de aplicacion que debe usar la UI productiva es el **service** de la fase **9.4D** (ver [`service-9-4D.md`](./service-9-4D.md)), no el repository directo.

## 3. Fuera de alcance (fase 9.4A)

- UI completa, CRUD productivo, migraciones SQL, Supabase remoto, motor, calculo de liquidacion, proceso mensual productivo.
- Previred, LRE final, importadores masivos, login, roles, JWT, RLS, auditoria avanzada, rediseno visual profundo.
- Cambios a reglas o servicios de Conceptos o Haberes recurrentes (solo referencias cruzadas en documentacion).

## 4. Entidades funcionales (conceptual)

Un movimiento variable mensual **conceptualmente** incluye:

- Identificador (futuro `idMovimiento`).
- Trabajador (`idPersona`).
- Concepto (`idConcepto`) del catalogo.
- Periodo (`YYYY-MM`).
- Tipo inferido del concepto (haber/descuento).
- Monto o valor monetario principal.
- Estado del movimiento.
- Origen (manual, importacion, etc.; detalle en fases futuras).
- Observacion opcional.
- Fechas de registro/actualizacion (auditoria futura).

**Campos minimos** para discutir UI futura: trabajador, concepto, periodo, monto o valor, estado, origen, observacion opcional.

**Campos futuros posibles** (no v1): cantidad, unidad, referencia, archivo_origen, usuario_registro, usuario_validacion, fecha_validacion, motivo_rechazo, bloqueado_por_proceso, id_liquidacion_origen.

## 5. Estados

Propuesta completa (referencia):

- **BORRADOR** - ingresado, no confirmado.
- **VALIDADO** - listo para proceso mensual futuro.
- **OBSERVADO** - problema o correccion pendiente.
- **ANULADO** - no aplica; conserva historial.
- **BLOQUEADO** - no editable (periodo cerrado, proceso, etc.).
- **INCLUIDO_EN_PROCESO** - tomado por proceso o calculo.

**Version minima v1 sugerida:** BORRADOR, VALIDADO, ANULADO, BLOQUEADO. OBSERVADO e INCLUIDO_EN_PROCESO como extension cuando el flujo de proceso lo requiera.

## 6. Reglas de validacion (futuras implementaciones)

1. Existe trabajador identificable.
2. Trabajador apto para remuneraciones, activo y contrato que intersecta el periodo (**CHILE-FIX-01** en `MovimientosVariablesService`; ver [`hardening-chile-fix-01.md`](./hardening-chile-fix-01.md)).
3. Existe periodo `YYYY-MM`.
4. Periodo abierto a carga (cuando exista control de periodo).
5. Existe concepto.
6. Concepto valido para movimiento variable (ver [`decisiones-operativas.md`](./decisiones-operativas.md) y pendiente de flag catalogo).
7. Monto > 0 salvo excepcion aprobada.
8. Tipo haber/descuento inferido del concepto; coherencia con signo/monto segun convencion de implementacion.
9. No permitir concepto **automatico** de sistema para carga manual salvo regla aprobada.
10. No permitir **APORTE_EMPLEADOR** manual sin regla aprobada.
11. No editar movimientos bloqueados.
12. No eliminar fisicamente; anular.
13. Conservar historial.
14. Duplicados segun [`decisiones-operativas.md`](./decisiones-operativas.md) (recomendacion v1: unico por trabajador + concepto + periodo).

## 7. Relacion con Conceptos

Los movimientos **usan** filas del catalogo `concepto`; no crean definiciones nuevas de concepto. Conceptos no responde por montos ni por periodo de aplicacion puntual.

Pendiente: distincion catalogo **asignable recurrente** vs **asignable variable** vs **ambos** - ver decisiones operativas.

## 8. Relacion con Haberes recurrentes

No duplicar asignaciones recurrentes. Si el mismo hecho economico aplica mes a mes o por rango de meses con logica recurrente, corresponde a [`../haberes-descuentos/contrato-general.md`](../haberes-descuentos/contrato-general.md).

## 9. Relacion con Proceso mensual

Proceso mensual orquestara periodo, parametros, aptos, recurrentes y **movimientos variables validados**. Esta fase no implementa proceso; solo define la relacion.

## 10. Relacion con Liquidaciones

Movimiento variable es **entrada** editable/validable antes del calculo. Liquidacion es **salida** generada/congelada. Post-cierre: bloqueo o versionado de movimientos usados (fase futura).

## 11. Reglas de anulacion

Anulacion logica (estado ANULADO), no delete fisico como operacion normal. Alineado al criterio de cierre en Haberes recurrentes.

## 12. Reglas de duplicados

Ver [`decisiones-operativas.md`](./decisiones-operativas.md) seccion 4 (opcion A vs B y recomendacion v1).

## 13. Pendientes de implementacion

- Modelo de datos y migraciones SQL.
- Servicio/repositorio y RLS.
- Pantalla bajo `/remuneraciones/movimientos-variables`.
- Integracion con Proceso mensual y Motor.
- Flag o reglas en catalogo Conceptos para uso variable vs recurrente.
- Pruebas E2E y unitarias del modulo (parcial: reglas puras en Fase 9.4B, ver abajo).

## 14. Fase 9.4B - modelo TypeScript y validaciones puras

Objetivo: alinear codigo reusable (tipos + helpers sin UI) con las reglas documentadas antes de pantalla productiva.

```txt
Feature: src/app/features/movimientos-variables/
Annex ASCII: docs/codex/modulos/movimientos-variables/modelo-tecnico-9-4B.md
Tests: movimiento-variable-validacion.rules.spec.ts (npm test -- --watch=false)
```

Las reglas puras siguen sin importar `concepto-asignabilidad.rules.ts` directamente; **CHILE-FIX-01** hace que el **servicio** arme el snapshot desde `HaberesDescuentosService` (misma regla `esConceptoAsignable` que recurrentes, fecha = primer dia del mes del periodo). Duplicado v1 ignora filas `ANULADO` en el conjunto existente (ver decisiones seccion 4 y anexo tecnico).

## 15. Referencias

- Haberes recurrentes: [`../haberes-descuentos/README.md`](../haberes-descuentos/README.md).
- Conceptos: [`../conceptos-remuneracion/contrato-funcional.md`](../conceptos-remuneracion/contrato-funcional.md).
- Nómina / proceso (vision): [`../nomina-mensual/README.md`](../nomina-mensual/README.md).
- Tablero: [`../../orquestador/estado-fases.md`](../../orquestador/estado-fases.md).

<!-- ARQ-ERP-01-INTEGRACION -->

## Nota canonica 2026-05-07

Este contrato queda como referencia historica/legacy de Movimientos variables. Las reglas funcionales se entienden como antecedente del dominio **Novedades mensuales**. La fuente canonica futura para nuevos desarrollos es `novedad_remuneracion_periodo` y el documento funcional principal es [`../nomina-mensual/novedades-mensuales.md`](../nomina-mensual/novedades-mensuales.md).

No borrar este contrato: conserva decisiones de validacion, estados y hardening que pueden servir para el mapper de transicion.
