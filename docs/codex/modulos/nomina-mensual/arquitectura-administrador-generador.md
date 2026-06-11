# Arquitectura Administrador + Generador — Nómina mensual

> **Documento rector** creado en `NOM-REBUILD-NOMINA-MENSUAL-01` (2026-06-03).

> **Actualización rectora 2026-06-11:** este documento conserva la arquitectura
> de origen y el historial F0-F7. La planificación vigente para completar el
> flujo productivo está dividida en 23 fases en
> [`roadmap-admin-generador-operativo-100.md`](./roadmap-admin-generador-operativo-100.md).
> La UI histórica de `/remuneraciones/proceso-mensual` ya fue retirada; el motor
> y contratos internos compartidos que aún dependen de `periodo` se consideran
> compatibilidad técnica pendiente, no un segundo flujo visible.

## Actualización 2026-06-05 - ciclo consistente y cálculo vigente

`NOM-ADMIN-ABIERTAS-CICLO-CONSISTENTE-01` completa la coherencia operativa:

- Las transiciones se validan en dominio y mediante `transicionar_nomina_periodo`.
- `nomina_periodo` guarda el snapshot V1 vigente, versión y fechas de cálculo, validación y aprobación.
- Cambiar dotación o movimientos invalida el cálculo y devuelve la nómina a revisión.
- `nomina-periodo-calculo-adapter.service.ts` calcula solo los trabajadores de la nómina seleccionada.
- El cierre exige estado aprobado, cálculo vigente y ausencia de bloqueos.
- Dotación usa consulta SQL paginada y las liquidaciones se habilitan solo desde una nómina cerrada y trazable.

Migración: `supabase/migrations/20260605120000_nomina_periodo_ciclo_consistente.sql`.
>
> **Sustituye** y absorbe: `NOM-ADMIN-GENERADOR-01` (plan v2.2 intermedio, nunca implementado), `NOM-GRILLA-BASE-01` (plan v2.1 intermedio), `NOM-MULTI-NOMINA-01` (propuesta abierta el 2026-06-03).

## Decisión rectora 2026-06-04 — F3 fusion (BD real + Generador V2 renovado)

A partir de 2026-06-04 la fase F3 se ejecutó como una **fusion** de F3 + F4 + F5: el Generador V2 se renueva en sitio para operar con 6 pasos y se conecta a Supabase con tablas, RLS y triggers nuevos. El motor V1 (`/remuneraciones/proceso-mensual`) sigue intacto: se mantiene la coexistencia por capas (`nomina_periodo` cabecera operativa + `nomina_calculo_*` snapshot del motor V1, unidos por `periodo + id_empresa`).

- Se levanta de forma controlada la restricción "BD/SQL/RPC/RLS bloqueado" SOLO para esta fase. Se documenta en `migracion-bd-nomina-rebuild.md`.
- Se introduce `EmpresaActivaService` (resuelve `id_empresa` por JWT o fallback) y `NominaPeriodoService` productivo que reemplaza al mock adapter en producción (el mock queda para tests).
- Los pasos `scope`, `employees`, `approval`, `payslips` desaparecen del modelo `PayrollStepId`. Quedan: `parameters`, `dotacion`, `movements`, `calculation`, `validation`, `closure`.
- El motor productivo nuevo (F6) y la migración histórica `nomina_calculo_*` → `nomina_periodo` NO entran en F3 fusion.

## 1. Decisión rectora

Reconstruir Nómina mensual como módulo definitivo bajo dos roles separados:

| Módulo de hoy | Rol futuro | Propósito |
|---------------|------------|-----------|
| `Nómina mensual` (`proceso-mensual`) | **Administrador de Nóminas** | Bandeja de todas las nóminas del año. Lista resúmenes, crea/abre nóminas, navega al Generador. |
| `Nómina mensual V2` (`nomina-mensual-v2`) | **Generador de Nómina** | Trabaja **una** nómina por `:nominaPeriodoId`. Stepper de 6 pasos. |
| `Recurrentes` (módulo nuevo) | Reglas permanentes | Catálogo de `MovimientoRecurrente` aplicables a nóminas. |
| `Movimientos` | Vista transversal | `MovimientoNomina` globales y por nómina. |
| `Conceptos` | Catálogo base | Tipos de movimiento (haber, descuento, ausencia, informativo). |
| `Liquidaciones oficiales` | Salida posterior | Generadas desde una nómina confirmada. |

La reconstrucción se ejecuta por fases controladas (F0-F7). Esta primera iteración cubre solo **F0 (documentación)** y **F1 (modelos centrales + adapter mock + tests)**.

## 2. Naming definitivo

| Concepto | Término correcto | Términos prohibidos |
|----------|------------------|---------------------|
| Paso del generador que revisa trabajadores | **`Dotación`** | `Alcance + Empleados` (pasos separados antiguos) |
| Grupo operativo dentro de una nómina | **`SegmentoNomina`** | `SubBase`, `Base`, `SubBaseNomina`, `Sub-nómina` |
| Estado tras crear la nómina | **`dotacion_generada`** | `base_generada` |
| Servicio de F1 | **`nomina-periodo-mock-adapter.service.ts`** | `nomina-periodo-adapter.service.ts` (ambiguo) |
| Servicio puente al motor (F6) | **`nomina-periodo-calculo-adapter.service.ts`** | — |
| Servicio productivo (futuro) | **`nomina-periodo.repository.ts`** / **`.service.ts`** | — |

El sufijo `mock-adapter` y `calculo-adapter` es obligatorio para evitar confusión con servicios productivos.

**Razón del cambio**: el código actual ya tiene `fechaBaseGuardada`, `idCalculoPeriodoBase`, "Parámetros base" con significado distinto (período anterior). Reusar la palabra `Base` o `Sub-base` produciría colisión cognitiva.

## 3. Stepper definitivo del Generador

```txt
1. Parámetros
2. Dotación
3. Movimientos
4. Cálculo
5. Validación
6. Cierre
```

Reemplaza los 8 pasos actuales (`parameters / scope / employees / movements / calculation / validation / approval / payslips`). La unificación `scope + employees → Dotación` y la eliminación de `approval / payslips` (absorbidos por `Validación / Cierre`) se aplica en **F3**, no en F1.

## 4. Routing definitivo

```txt
/remuneraciones/nominas                                  → Administrador (lista)
/remuneraciones/nominas/:nominaPeriodoId/generador       → Generador (1 nómina)
```

Reemplaza progresivamente `/remuneraciones/nomina-mensual-v2`. El cambio se aplica en **F3**, no en F1.

## 5. Principio rector — Trabajo por excepción

El flujo debe escalar a cientos o miles de trabajadores. **El usuario no revisa todos los trabajadores; revisa solo los que tienen incidencias, cambios o movimientos especiales.**

Las 10 reglas que gobiernan toda la arquitectura:

1. **Generación automática**: la dotación se construye desde trabajadores activos al crear la nómina.
2. **Recurrentes idempotentes**: ejecutar `aplicarRecurrentesANomina` dos veces NO duplica movimientos. Clave lógica: `nominaPeriodoId + trabajadorId + recurrenteId + tipo`.
3. **Respeto de omitidos**: si un movimiento con esa misma clave tiene `estado='omitido'`, NO se reaplica automáticamente (preserva la decisión manual del usuario).
4. **Segmentación de recurrentes**: trabajador / segmento / centro de costo / cargo / tipo de contrato / grupo.
5. **Grilla del Administrador**: solo carga `NominaPeriodoResumen[]`. Sin detalle.
6. **Grilla de Dotación**: solo carga `FilaTrabajadorNominaResumen[]`. Sin detalle.
7. **Detalle bajo demanda**: `DetalleTrabajadorNomina` se carga solo al abrir fila/modal/drawer.
8. **Acciones masivas con preview**: `PreviewAccionMasivaTrabajadores` muestra afectados + monto + advertencias + `puedeAplicar` antes de aplicar.
9. **Guardia de cálculo**: bloquear cálculo si hay incidencia crítica bloqueante.
10. **Guardia de cierre**: bloquear cierre si hay incidencia crítica bloqueante.

## 6. Modelos centrales (F1)

Ubicación: `src/app/features/nomina-mensual/models/`. Conviven con los modelos productivos existentes (`proceso-mensual.model.ts`, `acta-operativa-periodo.model.ts`).

### 6.1 `nomina-periodo.models.ts`

| Tipo | Propósito |
|------|-----------|
| `EstadoNomina` | `borrador` → `dotacion_generada` → `en_revision` → `calculada` → `validada` → `aprobada` → `cerrada` (con `reabierta` y `anulada` adicionales). |
| `NominaPeriodoResumen` | Lo que carga el Administrador. Solo totales + estado + fechas. |
| `NominaPeriodo` | La nómina completa: incluye `segmentos[]`, `movimientos[]`, `incidencias[]`, `eventosAuditoria?[]`. |
| `SegmentoNomina` | Grupo operativo: `tipo: 'planta' \| 'honorarios' \| 'centro_costo' \| 'personalizada'`, `estado: 'borrador' \| 'lista' \| 'bloqueada'`, `trabajadorIds[]`, `ordinal`. |
| `IncidenciaNomina` | `severidad: 'critica' \| 'advertencia' \| 'informativa'`, `bloqueante: boolean`, ref opcional a `trabajadorId` / `segmentoId`. |
| `ResumenValidacionNomina` | Resumen pre-cálculo: `puedeCalcular` Y `puedeCerrar` + listas separadas de críticas / advertencias. |
| `EstadoTrabajadorNomina` | `listo / advertencia / critico / editado / omitido / bloqueado`. |
| `FilaTrabajadorNominaResumen` | Lo que carga la grilla de Dotación. Contadores + estado, **sin detalle**. |
| `DetalleTrabajadorNomina` | Detalle bajo demanda: movimientos, incidencias, datos bancarios/previsionales. |
| `FiltroRapidoDotacion` | Filtros rápidos: `estado?`, `segmentoId?`, `conIncidencias?`, `conMovimientos?`, `busqueda?`. |
| `PaginacionGrilla` | `page`, `pageSize`, `total`. Base de la grilla con paginación. |
| `EventoAuditoriaNomina` | TODO declarado: `accion: 'creada' \| 'calculada' \| 'validada' \| 'aprobada' \| 'cerrada' \| 'reabierta' \| 'anulada'` + `usuarioId?` + `motivo?`. La emisión real se implementa en F2+F3. |

### 6.2 `movimiento-nomina.models.ts`

| Tipo | Propósito |
|------|-----------|
| `MovimientoTipo` | Union string abierta. Se cierra cuando se conecte al catálogo de Conceptos. |
| `MovimientoCategoria` | `haber / descuento / ausencia / informativo`. |
| `MovimientoRecurrente` | Regla permanente. Segmentación por `trabajadorId? / segmentoId? / centroCostoId? / cargoId? / tipoContratoId? / grupoId?`. `frecuencia: 'mensual' \| 'quincenal' \| 'semanal'`. `estado: 'activo' \| 'pausado' \| 'finalizado'`. |
| `MovimientoNomina` | Movimiento aplicado a una nómina específica. `origen: 'manual' \| 'recurrente' \| 'importado' \| 'sistema'` + `recurrenteId?` para idempotencia. `estado: 'borrador' \| 'aplicado' \| 'observado' \| 'omitido' \| 'anulado'`. |
| `CriterioAplicacionRecurrente` | Discriminated union por `tipo`: `trabajador / segmento / centro-costo / cargo / tipo-contrato / grupo`. Usado por `aplicarRecurrentePorCriterio`. |
| `AccionMasivaTrabajadores` | Discriminated union: `agregar-movimiento / mover-segmento / marcar-revisado / excluir-nomina`. |
| `PreviewAccionMasivaTrabajadores` | Modelo del preview obligatorio antes de aplicar: `totalTrabajadoresAfectados`, `montoTotalEstimado?`, `totalIncidenciasCriticas`, `totalAdvertencias`, `mensajes[]`, `puedeAplicar`. |

## 7. Adapter mock (F1)

`features/nomina-mensual/services/nomina-periodo-mock-adapter.service.ts` expone 8 stubs (retornan mock, no conectan BD ni motor):

| Método | Contrato |
|--------|----------|
| `consolidarSegmentosParaCalculo(nominaPeriodoId)` | Consolida todos los segmentos en un único `ResultadoAlcanceNomina` compatible con orquestador V2 actual (puente para F6). |
| `aplicarRecurrentesANomina(nominaPeriodoId)` | Aplica recurrentes activos. **Idempotente**: clave `nominaPeriodoId + trabajadorId + recurrenteId + tipo`. **Respeta omitidos**: si la clave ya existe con `estado='omitido'`, NO crea uno nuevo. |
| `aplicarRecurrentePorCriterio(criterio, nominaPeriodoId)` | Helper para acciones masivas. Aplica un recurrente solo a los trabajadores que matchean el criterio. |
| `validarDuplicidadTrabajadorSegmento(nominaPeriodoId)` | Detecta trabajadores en >1 segmento activo (`bloqueante=true`). |
| `obtenerResumenValidacionNomina(nominaPeriodoId)` | Resumen pre-cálculo. `puedeCalcular=false` y `puedeCerrar=false` si hay críticas bloqueantes. |
| `filtrarDotacion(nominaPeriodoId, filtro, paginacion)` | Aplica filtros + paginación al conjunto. Retorna `{ filas: FilaTrabajadorNominaResumen[]; total: number }`. Sin detalle. |
| `obtenerDetalleTrabajador(nominaPeriodoId, trabajadorId)` | Detalle bajo demanda al abrir fila. |
| `previsualizarAccionMasiva(nominaPeriodoId, trabajadorIds, accion)` | Preview obligatorio antes de aplicar acción masiva. NO modifica la nómina. |

## 8. Reglas de uso de mocks

- Los archivos `*-mock.ts` y `*-mock-adapter.service.ts` **solo se importan desde**: tests vitest, stories (futuro), adapters mock, componentes UI de fases F2-F5 antes de conectar productivo.
- **Prohibido** importarlos desde servicios productivos definitivos, repositorios reales, motor de cálculo o flujos productivos.
- Cabecera obligatoria:

  ```ts
  /**
   * Datos mock de F1 (NOM-REBUILD-NOMINA-MENSUAL-01).
   * Uso permitido: tests, stories, adapters mock, UI temporal F2-F5.
   * NO importar desde servicios productivos definitivos.
   */
  ```

- En F7 (limpieza) se reevalúa qué mocks se mantienen como fixtures de test.

## 9. Tests obligatorios de F1 (25 tests)

Resumen del contrato. Detalle completo en el spec.

| # | Categoría | Test |
|---|-----------|------|
| 1-5 | Modelos | Helpers de creación, no duplicidad entre segmentos, mover trabajador sin perder movimientos. |
| 6 | Recurrentes | Aplicación básica. |
| **7** | **Recurrentes** | **`aplicarRecurrentesANomina` dos veces NO duplica (idempotencia)**. |
| **8** | **Recurrentes** | **Recurrente con `estado='omitido'` NO se reaplica**. |
| 9-14 | Recurrentes por criterio | 6 criterios: trabajador / segmento / centro-costo / cargo / tipo-contrato / grupo. |
| 15-17 | Dotación | Filtro por incidencia, paginación, NO retorna detalle completo. |
| 18 | Detalle | Carga bajo demanda. |
| 19-22 | Validación | Totales correctos, `puedeCalcular`, `puedeCerrar` (con y sin críticas). |
| 23 | Puente motor | `consolidarSegmentosParaCalculo` compatible con orquestador. |
| 24-25 | Preview masivo | Preview no modifica nómina, `puedeAplicar` reacciona a críticas. |

## 10. Fases declaradas (no se ejecutan en F1)

| Fase | Alcance | Tocará |
|------|---------|--------|
| **F0** ✓ | Documentación (este archivo + estado-fases + contexto). | Solo `docs/codex/`. |
| **F1** ✓ | Modelos + adapter mock + tests. | `features/nomina-mensual/models/ + services/ + data/`. Aditivo. |
| **F2** ✓ | UI Administrador (KPIs operativos, grilla `app-data-grid`, modal nueva nómina, modal resumen, acción "Abrir generador"). | `features/nomina-mensual/containers/administrador-nominas-container/`, `pages/administrador-nominas.page.ts`, `presenters/admin-nominas.presenter.ts`, `rules/admin-nominas.rules.ts`, ruta `/remuneraciones/nominas`, menú + breadcrumbs. Sin tocar V1 ni V2. |
| **F3** | Generador definitivo (6 pasos, nueva ruta). | Routing, menú, stepper, orquestador V2. |
| **F4** | Dotación escalable (segmentos, filtros, paginación, acciones masivas, detalle bajo demanda). | Pasos `scope` + `employees` actuales (reemplazados por `Dotación`). |
| **F5** | Movimientos integrados (recurrentes aplicados, manuales, omitir, editar este mes). | Paso `movements` actual. |
| **F6** | Cálculo / motor (adapter `Segmentos + movimientos → base consolidada → motor actual`). | `services/` (puente). El motor productivo NO se rehace. |
| **F7** | Limpieza (ruta antigua, stepper antiguo, mocks obsoletos, código sin uso). | Eliminación controlada. |

## 11. Restricciones LEVANTADAS (a partir de F2)

A partir de F2, las restricciones del plan v2.2 se levantan. SE PERMITE tocar:

- Routing del módulo, menú lateral, stepper V2, orquestador V2.
- Modelos / mocks actuales.
- Componentes de alcance, empleados, movimientos.
- Servicios puente, navegación entre Nómina mensual y V2.
- Pantalla actual de Nómina mensual.
- Flujo actual de V2.

**F0 + F1 son aditivas**: no tocan ninguno de estos elementos. Las restricciones se levantan a partir de F2.

## 12. Restricciones que SIGUEN VIGENTES (todas las fases)

- BD productiva, SQL / RPC / RLS.
- Previred, LRE, Reportes, Licencias médicas.
- Liquidaciones productivas profundas (excepto navegación o lectura).
- Motor productivo de cálculo (excepto adapter / controlador puente en F6).
- `angular.json`, `postcss.config.json`, `src/styles/*`, fuentes globales.

## 13. Reglas de oro (todas las fases)

- No dejar tests rojos.
- No romper build.
- No borrar código anterior sin reemplazo funcional.
- No mezclar todas las fases en una sola pasada.
- No tocar Reportes ni Licencias médicas todavía.
- No modificar BD / SQL / RPC / RLS sin una fase específica.

## 14. Decisiones absorbidas

| Decisión anterior | Resuelta por |
|-------------------|--------------|
| `NOM-ADMIN-GENERADOR-01` (plan v2.2: Admin + Generador con `SubNomina`). | Naming corregido a `SegmentoNomina + Dotación` y plan ampliado a F0-F7. |
| `NOM-GRILLA-BASE-01` (plan v2.1: paso "Base" unificado). | Paso renombrado a `Dotación` e integrado al stepper de 6 pasos. |
| `NOM-MULTI-NOMINA-01` (propuesta 2026-06-03: múltiples nóminas del mismo período). | Resuelta por el modelo `NominaPeriodo.tipo: 'mensual' \| 'quincenal' \| 'semanal' \| 'extraordinaria'` + el Administrador maneja N nóminas por período. |

## 15. Referencias

- Prompt rector: [`prompt_reconstruccion_controlada_nomina_mensual.md` (Downloads)](file:///c:/Users/PC/Downloads/prompt_reconstruccion_controlada_nomina_mensual.md).
- Stepper actual: [`v2/nomina-v11-contrato-funcional-preparaciones-lotes-por-tipo.md`](./v2/nomina-v11-contrato-funcional-preparaciones-lotes-por-tipo.md).
- Auditoría V2 base: [`auditorias/auditoria-nomina-v2-2026-06.md`](./auditorias/auditoria-nomina-v2-2026-06.md).
- Modelos productivos existentes: `src/app/features/nomina-mensual/models/proceso-mensual.model.ts`, `acta-operativa-periodo.model.ts`.
