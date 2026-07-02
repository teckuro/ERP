# Auditoría de proyecto 2026-07 — backlog priorizado

> **ID:** `AUDIT-PROYECTO-2026-07`
>
> **Fecha:** 2026-07-02 · **Estado:** Abierto (backlog vivo)
>
> **Origen:** revisión de flujos, casos de uso, vulnerabilidades y pendientes sobre
> Administrador/Generador de nómina V2, seguridad transversal y escala, tras cierre
> de F06 (Angular) y F07 (parcial, Angular + BD PROD).
>
> **Fuentes contrastadas:** [`plan-ejecucion-fases-vigente.md`](../modulos/nomina-mensual/plan-ejecucion-fases-vigente.md) ·
> [`matriz-roles-permisos.md`](../orquestador/matriz-roles-permisos.md) §8.1 ·
> [`estado-fases/nomina-mensual.md`](../orquestador/estado-fases/nomina-mensual.md) ·
> [`roadmap-admin-generador-operativo-100.md`](../modulos/nomina-mensual/roadmap-admin-generador-operativo-100.md)

---

## 1. Convenciones

| Prioridad | Significado |
| --------- | ----------- |
| **P0** | Corrección o escala que rompe casos de uso reales del piloto; bloquea avance de olas. |
| **P1** | Seguridad/autorización o deuda que expone datos o acciones críticas. |
| **P2** | Calidad, certificación y deuda no bloqueante. |

Cada ítem declara: alcance, archivos ancla, fase del plan que lo cubre, dependencias,
esfuerzo (S/M/L) y **criterio de listo** verificable. Este backlog **no reordena** las
olas del plan vigente; las referencia.

---

## 2. P0 — Corrección y escala

### BKL-01 — Motor y snapshot por `nominaPeriodoId` (= F09)

| Campo | Definición |
| ----- | ---------- |
| Problema | Cálculo y snapshot activo keyed por `periodo` + empresa: dos nóminas del mismo mes pueden compartir o pisar snapshot. |
| Archivos ancla | `src/app/features/nomina-mensual/services/nomina-periodo-calculo-adapter.service.ts` · `nomina-calculo-snapshot.repository.ts` |
| Fase | **F09** (Ola 3) · Dep: F08 · Coordinar con MOTOR-00 documental |
| Esfuerzo | L |
| Criterio de listo | Dos nóminas del mismo mes calculan y persisten snapshots independientes; invalidación cruzada al cambiar dotación/movimientos/parámetros; cierra el residuo F06 «cada cálculo demuestra qué parámetros usó». |

### BKL-02 — Paso Movimientos escalable

| Campo | Definición |
| ----- | ---------- |
| Problema | Carga dotación con techo `pageSize: 1000` y `listarMovimientos` sin paginación en repo; grilla con paginación cliente (`maxItems: 25`). Nóminas >1000 quedan truncadas. |
| Archivos ancla | `nomina-mensual-v2-paso-movimientos.component.ts` · `nomina-periodo.service.ts` · repository de movimientos |
| Fase | Puente Ola 2→3 (patrón F07 aplicado a F08) · Dep: F07 `serverSide` ya disponible en `app-data-grid` |
| Esfuerzo | M |
| Criterio de listo | Paso Movimientos opera server-side (o vía RPC agregada por trabajador) sin cargar universo completo; sin constantes `pageSize: 1000`; tests del paso verdes. |

### BKL-03 — Cierre residual F07

| Campo | Definición |
| ----- | ---------- |
| Problema | Selección masiva solo aplica a filas de la página visible; filtro picker «Ya en nómina» no viaja al servidor (`p_solo_en_nomina` inexistente); `previsualizarAccionMasiva` con techo `pageSize: 10000`. |
| Archivos ancla | RPC `listar_trabajadores_elegibles_nomina` · `nomina-mensual-v2-paso-dotacion` · modal incluir trabajadores · presenters de filtros |
| Fase | **F07** (Ola 2, cierre) · Dep: migraciones F07 en PROD ✅ |
| Esfuerzo | M |
| Criterio de listo | Acción masiva confirma y aplica sobre el **universo filtrado** (no la página); filtro «Ya en nómina» resuelto en RPC; sin techos artificiales; E2E de escala básico (ver BKL-08). |

---

## 3. P1 — Seguridad y autorización

Regla rectora SEG-01: **ocultar un botón no es seguridad**.

### BKL-04 — Endurecer RLS `movimiento_recurrente` (quick win)

| Campo | Definición |
| ----- | ---------- |
| Problema | Policy `USING (true)` para `anon` + `authenticated` (migración `20260610210000_movimiento_recurrente_rls_anon_authenticated.sql`): cualquier sesión lee/escribe recurrentes de cualquier empresa. |
| Fase | Migración propia, no requiere esperar F15b |
| Esfuerzo | S |
| Criterio de listo | Policy por `id_empresa` (patrón F02); `anon` sin acceso; smoke SQL verde; regresión de flujos Haberes/Descuentos y Movimientos sin romper. |

### BKL-05 — SEG-01b: guards de rol en Angular

| Campo | Definición |
| ----- | ---------- |
| Problema | Rutas `/remuneraciones/nominas/*` solo con `authChildGuard` (sesión); sin distinción operador/admin en UI ni services. |
| Fase | **SEG-01b** (transversal; puede iniciar en paralelo tardío de Ola 3) · Insumo: matriz §8.1 cerrada ✅ |
| Esfuerzo | M |
| Criterio de listo | Guards + helpers de rol aplicados a acciones `SOLO_ADMIN` de la matriz (eliminar, reabrir, recargar parámetros); tests de guard; sin depender solo de ocultar botones. |

### BKL-06 — F15b: permisos finos en RPC

| Campo | Definición |
| ----- | ---------- |
| Problema | `transicionar_nomina_periodo` y guardado de snapshot de parámetros validan estados, no rol: cualquier `authenticated` del tenant puede cerrar/reabrir/recargar. |
| Fase | **F15b** (Ola 5) · Dep dura: **F13** primero (prohibición §11 del plan: no endurecer RPC antes de estabilizarlas) |
| Esfuerzo | M–L |
| Criterio de listo | Cada comando crítico valida rol en servidor según matriz §8.1; error humano en UI ante rechazo; smokes SQL por rol. |

### BKL-12 — RLS nómina: policies `*_all` → por operación (EST-002)

| Campo | Definición |
| ----- | ---------- |
| Problema | `segmento_nomina`, `movimiento_nomina`, `incidencia_nomina` (y posiblemente `evento_auditoria_nomina`) usan policy `FOR ALL` (`*_all`) en lugar del patrón EST-002 por operación ya aplicado en `nomina_periodo` y `movimiento_recurrente`. |
| Archivos ancla | `supabase/migrations/20260604180000_nomina_rebuild_admin_generador.sql` · nueva migración incremental |
| Fase | Quick win seguridad/contrato EST · Dep: ninguna |
| Esfuerzo | S |
| Criterio de listo | Drop `*_all`; create `*_select|insert|update|delete` con mismo filtro `id_empresa`; smoke SQL; `./scripts/auditar-estandares-desviaciones.ps1` EST-DB-04 → 0 en migraciones nuevas (legacy documentado). |

### BKL-07 — Higiene de claims y grants

| Campo | Definición |
| ----- | ---------- |
| Problema | `esAdmin` leído de `user_metadata` (manipulable por el propio usuario) en `NominaParametrosBaseAccesoService`; fallback a primera empresa en `EmpresaActivaService` si el JWT no trae `id_empresa`; grants `anon` residuales en funciones legacy detectados en smoke. |
| Fase | Acompaña SEG-01b · **Cerrado 2026-07-02** (ver fila BKL-07 en §6) |
| Esfuerzo | S–M |
| Criterio de listo | Rol solo desde `app_metadata`; fallback de empresa eliminado o degradado a estado de error visible; auditoría de grants en PROD con revocación explícita de `anon` donde no aplique. |

---

## 4. P2 — Calidad, certificación y deuda

### BKL-08 — E2E de certificación (anticipo de F20)

| Campo | Definición |
| ----- | ---------- |
| Problema | Solo existe 1 smoke (`tests/nominas-admin-generador.e2e.spec.ts`, bandeja→generador) frente a la matriz F20. Residuos F06 (multi-nómina mismo mes) y F07 (1000+) sin cubrir. |
| Fase | Incremental desde cierre F07; certificación completa en **F20** (Ola 7) |
| Esfuerzo | M (incremental) |
| Criterio de listo (incremental) | E2E dos nóminas mismo mes sin contaminación de parámetros/trazabilidad; E2E dotación con volumen alto sin degradar UI. |

### BKL-09 — Paso Cálculo con paginación servidor

| Campo | Definición |
| ----- | ---------- |
| Problema | Grilla de resultados con paginación cliente; con dotaciones grandes carga todo el resultado en memoria. |
| Fase | Junto a F09 (el cálculo por nómina redefine la fuente de la grilla) |
| Esfuerzo | M |
| Criterio de listo | Resultados paginados server-side reutilizando el modo `serverSide` de `app-data-grid`. |

### BKL-10 — Deuda F04–F05

| Campo | Definición |
| ----- | ---------- |
| Problema | Preview de creación no paginado (>1000 trabajadores); historial administrativo muestra `usuarioId` crudo para usuarios distintos del actual. |
| Fase | Mantenimiento F04–F05; no bloquea olas |
| Esfuerzo | S–M |
| Criterio de listo | Preview paginado o resumido server-side; historial resuelve nombre humano (regla NOIA: sin IDs técnicos visibles). |

### BKL-11 — Limpieza menor

| Campo | Definición |
| ----- | ---------- |
| Problema | Comentarios obsoletos sobre DELETE sin guardia en `nomina-periodo.service.ts`/repository (hoy existe `eliminar_nomina_completa`); trazabilidad con fallback mock cuando el servidor responde vacío (confunde en demo). |
| Fase | Oportunista, junto a la próxima fase que toque esos archivos |
| Esfuerzo | S |
| Criterio de listo | Comentarios corregidos; fallback mock retirado o marcado explícitamente como demo. |

---

## 5. Secuencia recomendada

```txt
BKL-03 (cerrar F07) → BKL-02 (movimientos escala) → BKL-01 (F09)
BKL-04 (RLS recurrentes)  — quick win, en cualquier momento
BKL-12 (RLS *_all nómina) — quick win EST-002, en cualquier momento
BKL-05 (SEG-01b)          — paralelo tardío de Ola 3
BKL-06 (F15b)             — solo tras F13 (prohibición §11)
BKL-08/09                 — incrementales junto a F07/F09
BKL-10/11                 — oportunistas
```

Prohibiciones vigentes del plan (§11): no F15b antes de F13; no motor global antes
de F09; no tipos no mensuales antes de F10/F11; no permisos solo en UI.

---

## 6. Registro de cierre por ítem

| Ítem | Estado | Fecha | Evidencia |
| ---- | ------ | ----- | --------- |
| BKL-03 | **Cerrado** | 2026-07-02 | Migración `20260702120000_nomina_f07b_cierre_dotacion_escalable.sql` en PROD; smoke F07 EXIT 0; tests 460/460; `bulkSelectAllFiltered` + `scope: 'all-filtered'` en data-grid; `p_solo_en_nomina`; preview masivo sin `pageSize: 10000`. E2E escala queda en BKL-08. |
| BKL-04 | **Cerrado** | 2026-07-02 | Migraciones `20260702130000_movimiento_recurrente_rls_por_empresa.sql` + `20260702131000` (revoke all anon) en PROD. Policies por operación `TO authenticated` con `current_user_empresa_id()` (patrón F02); `anon` sin grants y bloqueado en runtime; puente HD→MR (`security definer`) intacto. Smoke `bd/scripts/validar-movimiento-recurrente-rls.sql` EXIT 0. |
| BKL-02 | **Cerrado** | 2026-07-02 | Migración `20260702140000_nomina_bkl02_movimientos_escalables.sql` en PROD: RPCs `listar_movimientos_trabajadores_nomina` (agregación por trabajador con filtros/paginación) + `resumen_movimientos_nomina`. Paso Movimientos server-side 25/página; items lazy al expandir (`listarItemsMovimientosDeTrabajador`); sin `pageSize: 1000`; `listarMovimientosPorTrabajador` legacy retirado. Smoke EXIT 0; tests 463/463. |
| BKL-01 | **Cerrado núcleo** | 2026-07-02 | **F08**: `id_concepto` + guardia BD (migración `20260702150000`, smoke EXIT 0). **F09**: snapshot por `nominaPeriodoId` (migración `20260702160000`, smoke EXIT 0 con escenario real dos-nóminas-mismo-mes); adapter y rehidratación por nómina; cache motor aislada. Tests 551/551. **Pendiente F09 completo**: diffs entre versiones, golden fixture, control optimista → con F20/MOTOR-01. |
| BKL-12 | **Cerrado** | 2026-07-02 | Migración `20260702170000_nomina_bkl12_rls_por_operacion.sql` en PROD. `segmento_nomina`, `movimiento_nomina`, `incidencia_nomina`: drop `*_all`, 4 policies por operación `TO authenticated`; revoke `anon`. Smoke `validar-nomina-bkl12-rls-por-operacion.sql` EXIT 0. |
| BKL-05 | **Cerrado** | 2026-07-02 | **SEG-01b (Angular):** `ErpPermisosRemuneracionesService` + rules + guards; `NominaMensualCapabilitiesService` delega (admin solo `app_metadata`, sin gate `modoPruebas`); bloqueos en `NominaPeriodoService` (eliminar/reabrir/cerrar/recarga params/escritura); UI admin + paso cierre + shell Generador V2; tests 111+ en specs del alcance. RPC F15b queda en BKL-06. |
| BKL-07 | **Cerrado** | 2026-07-02 | `EmpresaActivaService` sin fallback a primera empresa (motivo visible si falta `id_empresa` en JWT); sidebar usa etiqueta de rol desde `ErpPermisosRemuneracionesService`; migración `20260702180000_bkl07_revoke_anon_identity_helpers.sql` revoca `execute` de `current_user_id`/`current_user_empresa_id` a `anon`. Admin rol desde `app_metadata` ya cubierto en BKL-05. |
| BKL-06…BKL-11 | Pendiente | — | — |

Al cerrar un ítem: actualizar esta tabla, el documento de fase correspondiente y
[`estado-fases/nomina-mensual.md`](../orquestador/estado-fases/nomina-mensual.md).
