# Nomina mensual (Chile) - contrato general

## 1. Objetivo del modulo

Guiar el **proceso mensual** por periodo `YYYY-MM`: revisar prerequisitos (parametros, trabajadores, conceptos, recurrentes, movimientos variables) antes de una **futura** fase de calculo y liquidaciones. En la version actual **no calcula** remuneraciones ni genera liquidaciones.

## 2. Alcance actual (cerrado en 9.5A + 9.5B)

- Pantalla **Proceso mensual** bajo `/remuneraciones/proceso-mensual`.
- **Prevalidaciones** orquestadas por `ProcesoMensualService` con reglas puras en `proceso-mensual-prevalidacion.rules.ts`, grupos minimos en `proceso-mensual-parametros-minimos.rules.ts` y conteos de recurrentes en `proceso-mensual-recurrentes.rules.ts`.
- UI en `features/nomina-mensual/containers/proceso-mensual-container/`; pagina de ruta solo wrapper (`frontend-interfaces`).
- Selector de periodo y accion **Validar periodo**; muestra estado global, bloqueos, advertencias, informaciones y filas por area; resumen con conteos de recurrentes y linea compacta `parametrosGrupos` (ids y clasificacion, sin cifras normativas).

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
