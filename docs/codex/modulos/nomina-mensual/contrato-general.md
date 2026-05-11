# Nomina mensual (Chile) - contrato general

## 1. Objetivo del modulo

Guiar el **proceso mensual** por periodo `YYYY-MM`: revisar prerequisitos (parametros, trabajadores, conceptos, recurrentes, movimientos variables) antes de una **futura** fase de calculo y liquidaciones. En la version actual **no calcula** remuneraciones ni genera liquidaciones.

> REM-MOV-UNIFY-01: en UI visible, los hechos puntuales del periodo se nombran como **Movimientos del mes**. `novedades mensuales`, `entradas mensuales` y `movimientos variables` quedan como nombres tecnicos o legacy cuando el contexto de arquitectura lo requiera.

## 2. Alcance actual (cerrado en 9.5A + 9.5B)

- Pantalla **Proceso mensual** bajo `/remuneraciones/proceso-mensual`.
- **Prevalidaciones** orquestadas por `ProcesoMensualService` con reglas puras en `proceso-mensual-prevalidacion.rules.ts`, grupos minimos en `proceso-mensual-parametros-minimos.rules.ts` y conteos de recurrentes en `proceso-mensual-recurrentes.rules.ts`.
- UI en `features/nomina-mensual/containers/proceso-mensual-container/`; pagina de ruta solo wrapper (`frontend-interfaces`).
- Periodo activo global como fuente de verdad; la pantalla hija no duplica selector editable. La accion **Validar periodo** queda como CTA principal guiado por estado, no como boton repetido en el header. Muestra estado global, bloqueos, advertencias, informaciones y filas por area; resumen con conteos de recurrentes y linea compacta `parametrosGrupos` (ids y clasificacion, sin cifras normativas).

## 3. Fuera de alcance (explicito)

- Motor de calculo, totales de nomina, impuesto unico, cotizaciones.
- Liquidaciones productivas, snapshots, cierre contable.
- Generacion Previred, LRE, archivos bancarios.
- Bloqueo duro de periodo en BD, aprobaciones, roles/JWT/RLS.
- Rediseno visual integral (fase UX-FINAL aparte).

## 4. Relacion con parametros

Lectura via `ParametrosGeneralesService`: `obtenerUltimoHastaPeriodo(periodo)`, `obtenerPeriodoRemuneracion(periodo)` y `listarCatalogos(periodo)` para clasificar grupos minimos. La UI **no** muestra UF, UTM, topes ni sueldos; muestra estado de prerequisitos y, tras validar, grupos como `mensuales_uf_utm_sueldo=OK` (clasificacion textual, sin valores). Detalle en `prevalidaciones-9-5A.md` y `prevalidaciones-9-5B.md`.

## 5. Relacion con empleados

Conteo de trabajadores **activos** con `aptoParaRemuneraciones` via `EmpleadosService.listar()` (sin conteos demo inventados).

## 6. Relacion con conceptos

Lectura del mantenimiento de conceptos via `HaberesDescuentosService.listarConceptosMantenimiento()` para existencia de catalogo y aviso de clasificacion incompleta para un motor futuro (sin modificar reglas de conceptos).

## 7. Relacion con haberes recurrentes

`HaberesDescuentosService.listarAsignacionesParaPrevalidacionMensual(periodo)` alimenta conteos y bloqueos: lectura en error o **vigencias invalidas** en el universo consultado implica **BLOQUEO**. Cerradas y fuera del mes se excluyen de aplicables al periodo. Contrato fino: `prevalidaciones-9-5B.md` y modulo Haberes (`listarTodasAsignacionesConConcepto`).

## 8. Relacion con movimientos variables

`MovimientosVariablesService.listarPorPeriodo(periodo)` alimenta conteos por estado. Reglas: `VALIDADO` no bloquea; `BORRADOR` -> advertencia; `OBSERVADO`, `BLOQUEADO`, `INCLUIDO_EN_PROCESO` -> bloqueo; `ANULADO` ignorado para esas reglas.

Para el usuario final, este flujo se comunica como `Movimientos del mes`: bonos puntuales, descuentos unicos, anticipos, ausencias, ajustes, retroactivos o reintegros del periodo. Solo los aprobados/validados deben considerarse al preparar nomina.

## 9. Prevalidaciones y estados

Estados globales: `SIN_EVALUAR` (antes de ejecutar), `LISTO_PARA_CALCULO`, `CON_ADVERTENCIAS`, `BLOQUEADO`. Detalle en `prevalidaciones-9-5A.md` y ampliacion 9.5B en `prevalidaciones-9-5B.md`.

## 10. Bloqueos y advertencias

Los mensajes llevan `codigo`, `area`, `severidad` y `texto`. Severidades: `BLOQUEO`, `ADVERTENCIA`, `INFO`. Los `INFO` de integracion futura van en `informaciones` y no cambian el estado a `CON_ADVERTENCIAS`.

## 11. Motor y liquidaciones (futuro)

El motor consumira los mismos prerequisitos validados aqui. Las liquidaciones seran **snapshot** inmutable (no formulario libre). Previred y LRE seran salidas posteriores, no pasos CRUD en esta pantalla.

## 12. Referencias

- `prevalidaciones-9-5A.md` (fase 9.5A).
- `prevalidaciones-9-5B.md` (fase 9.5B: recurrentes + grupos parametros).
- `vision-futura.md`.
- Orquestador: `docs/codex/orquestador/estado-fases.md`.
- Arquitectura: `docs/codex/arquitectura/frontend-interfaces.md`.

<!-- UX-COMERCIAL-01-NOMINA-CONTRATO -->

## Regla UX posterior a liquidaciones internas

Despues de validar cierre operativo y liquidaciones oficiales internas, el modulo de Nomina mensual debe optimizarse para lectura operativa:

```txt
1. Estado del periodo arriba.
2. Siguiente accion visible.
3. Bloqueos con motivo.
4. Trazabilidad tecnica secundaria.
5. Acceso claro a Liquidaciones oficiales.
```

No se deben agregar nuevas salidas legales/financieras en `UX-COMERCIAL-01`.

<!-- REM-UX-FLOWS-01-V2 -->

## Regla transversal de periodo y accion principal

## Regla transversal de visibilidad cliente vs aplicacion

La pantalla `Preparar nomina` debe priorizar la comprension del usuario final:

```txt
Periodo activo global
-> Estado final visible
-> Accion principal
-> Que falta ahora
-> Informacion final
-> Trazabilidad secundaria
```

No se deben promover como flujo principal terminos de aplicacion como snapshot, metadata, persistencia, payload, RPC, version tecnica, hash o identificadores internos. Si son necesarios para soporte o auditoria, deben quedar en disclosures secundarios y con copy de negocio (`Referencia interna`, `Version interna`, `Detalle del resultado guardado`).

En flujos operativos de Remuneraciones, `PeriodoActivoService` es la fuente visual y funcional del periodo activo. `Preparar nomina` debe mostrarlo como contexto compacto y validar/generar/calcular/guardar/aprobar/cerrar sobre ese periodo.

No debe existir un segundo `input type="month"` local en `Preparar nomina` mientras el header/padre ya tenga selector global. La accion principal visible se resuelve en la matriz de estado operativo; el header conserva estado y contexto, no un CTA duplicado.

<!-- REM-UX-FLOWS-02 -->

## Regla transversal de orden operativo REM-UX-FLOWS-02

En flujos visibles de Remuneraciones, el periodo activo global es la fuente unica de contexto. Las pantallas hijas no deben pedirlo de nuevo como input editable salvo vista historica documentada.

`Preparar nomina` debe mostrar una sola accion primaria destacada desde `estadoOperativo().accionPrincipal`; las acciones equivalentes dentro de detalles quedan como secundarias. El detalle operativo no debe listar todas las etapas antes de validar el periodo.

`Movimientos del mes` debe listar y crear registros con `PeriodoActivoService.periodoYm()`. El formulario de alta muestra el periodo como texto de contexto, no como campo editable.

<!-- REM-PERIOD-GLOBAL-01-NAV-IA-01 -->

## Regla transversal de periodo global y navegacion canonica

En Remuneraciones, `PeriodoActivoService.periodoYm()` es la fuente unica para listar, validar, calcular, guardar, aprobar o consultar el periodo visible. Las pantallas hijas no deben exponer `input type="month"` propio.

Al cambiar el periodo global, `Preparar nomina` debe limpiar estado del periodo anterior antes de consultar el nuevo snapshot activo.

<!-- REM-MOV-MODAL-01 -->

## Regla de registro en modal para Movimientos del mes

`Movimientos del mes` registra altas y ediciones desde un modal grande responsive, no como formulario largo incrustado en la pagina principal. El modal usa `PeriodoActivoService.periodoYm()` como fuente funcional, muestra `Periodo activo` como contexto y no contiene selector mensual editable.

La superficie del modal debe mantener header y footer estables, scroll interno en el cuerpo, accion primaria unica `Guardar movimiento` y secundaria `Cancelar`. Las validaciones se muestran junto a los campos y no cierran el modal. El guardado exitoso cierra el modal, limpia transitorios y recarga el listado/resumen del periodo activo.

Rutas canonicas visibles:

- `/remuneraciones/proceso-mensual` - Preparar nomina.
- `/remuneraciones/novedades-mensuales` - Movimientos del mes.
- `/remuneraciones/haberes-descuentos` - Asignaciones recurrentes.
- `/remuneraciones/liquidaciones` - Liquidaciones oficiales.
- `/remuneraciones/conceptos` - Conceptos de remuneracion.

Rutas legacy visibles solo como redirect:

- `/remuneraciones/movimientos-variables` -> `/remuneraciones/novedades-mensuales`.
- `/remuneraciones/liquidaciones-oficiales` -> `/remuneraciones/liquidaciones`.
