# Auditoría EST — desviaciones vs constitución técnica

> **ID:** `AUDIT-EST-2026-07`
>
> **Fecha:** 2026-07-02 · **Estado:** Abierto (backlog de alineación)
>
> **Baseline:** [`estandares/README.md`](../estandares/README.md) v1.0 (commit `6a12de8`)
>
> **Método:** grep estático sobre `supabase/migrations/`, `src/app/features/` y revisión manual de capas Angular. Script repetible: [`scripts/auditar-estandares-desviaciones.ps1`](../../../scripts/auditar-estandares-desviaciones.ps1)

---

## 1. Resumen ejecutivo

| Área | Conforme (nuevo) | Legacy aceptado | Acción requerida |
|------|------------------|-----------------|------------------|
| Nomenclatura BD (índices/triggers) | F07–F09 recientes | `ix_`/`ux_`/`trg_`/`tr_` en rebuild F01 | Solo en fases de refactor |
| RLS nómina hijos | `nomina_periodo_*` por operación | `*_all` en 4 tablas | **BKL-12** (P1) |
| RLS `movimiento_recurrente` | BKL-04 cerrado | Migración histórica `using (true)` superseded | Ninguna |
| Capas TS (Supabase en UI) | Pasos nómina V2 OK | `Database['Tables']` en 1 service | **EST-LEG-06** (P2) |
| camelCase español TS | Empleados + presenters V2 parcial | `Payroll*` / `parsePayrollStepId` en motor | **EST-LEG-04** (P2) |
| Archivos `*.util` / `*.helpers` | — | 5 archivos `*.util.ts`/`*.helpers.ts` | Renombrar oportunista |
| Smoke tests BD | 13 scripts `bd/scripts/` | No versionados en git (`.gitignore`) | Ver **EST-LEG-08** |

**Regla aplicada:** legacy no se renombra sin fase; desviaciones **P1** son de seguridad o contrato EST-002/006.

---

## 2. Base de datos y Supabase

### 2.1 Conforme (evidencia reciente)

- FK con prefijo `id_*` en tablas nómina rebuild y F08 (`id_concepto`, `id_nomina_periodo`).
- RPC de producto con verbos español: `listar_*`, `obtener_*`, `guardar_*`, `confirmar_*` (F07b, BKL-02, F09).
- Índices nuevos F09: prefijo `uq_` (`uq_nomina_calc_periodo_activo_nomina`).
- Triggers nuevos F08: prefijo `tg_` (`tg_movimiento_nomina_concepto_guard`).
- `movimiento_recurrente`: policies por operación + revoke `anon` (BKL-04).

### 2.2 Legacy nomenclatura (P2 — no bloqueante)

| Patrón EST nuevo | Legacy detectado | Ocurrencias aprox. | Notas |
|------------------|------------------|--------------------|-------|
| `ix_` índices | `ux_` | 7 migraciones | `ux_nomina_periodo_ordinaria`, F01 cimientos |
| `tg_` triggers | `trg_` | 10+ | rebuild admin generador |
| `tg_` triggers | `tr_` | 3 | F01 `updated_at` |
| RPC sin `fn_` | `fn_*` utilitarias | 37+ refs F03 | Correcto como utilitarias internas |

**Acción:** documentar en PR/migración cuando se toque el archivo; no migración masiva.

### 2.3 RLS policies `FOR ALL` (P1 — BKL-12) — **Cerrado 2026-07-02**

Migración `20260702170000_nomina_bkl12_rls_por_operacion.sql`:

- `segmento_nomina_*`, `movimiento_nomina_*`, `incidencia_nomina_*` (select/insert/update/delete).
- `evento_auditoria_nomina` ya cumplía (select + insert).

Smoke: `bd/scripts/validar-nomina-bkl12-rls-por-operacion.sql` EXIT 0 en PROD.

### 2.4 Grants `anon` históricos

- Migración `20260610210000` contenía `grant … to anon` — **superseded** por BKL-04.
- BKL-07 pendiente: auditoría global de grants `anon` en funciones legacy (PARAM-CHILE / QA-CHILE).

---

## 3. TypeScript y Angular

### 3.1 Capas — conforme en núcleo productivo

- **Repositories** concentran `.from()` / `.rpc()` en nómina, empleados, haberes-descuentos.
- **Pasos nómina V2** (`nomina-mensual-v2-paso-*`): sin Supabase directo.
- **Pages** (`src/app/pages/`): sin I/O Supabase.

### 3.2 Desviaciones

| ID | Hallazgo | Archivo(s) | Prioridad |
|----|----------|------------|-----------|
| EST-LEG-06 | Tipo `Database['public']['Tables']` en service (debe estar en mapper) | `nomina-periodo.service.ts` | P2 |
| EST-LEG-04 | Símbolos inglés `Payroll*`, `parsePayrollStepId` | `nomina-periodo.models.ts`, mapper, V2 stepper | P2 (fase NOMENCLATURA) |
| EST-LEG-05 | Archivos `*.util.ts`, `*.helpers.ts` | 5 archivos | P2 oportunista |
| EST-LEG-07 | Presenters bajo `containers/.../utils/` vs `presenters/` | admin-nominas, proceso-mensual | P2 |

### 3.3 Conforme parcial NOMENCLATURA-ES-CAMELCASE-01

- Empleados: tipos `*FichaEmpleado`, VM en español.
- Nómina V2 presenters: `FilaDetalle*Nomina`, `filtroMovimientosDesdeGrid`.
- **Excluido a propósito:** `snapshot`, `payload`, `issues` (contrato motor).

---

## 4. Documentación y tooling

| ID | Hallazgo | Acción |
|----|----------|--------|
| EST-LEG-08 | `bd/scripts/validar-*.sql` ignorados por git | Mantener local/CI; opcional fase para versionar plantillas smoke |
| EST-LEG-09 | Carpeta `docs/codex/auditorias/` no versionada completa | Excepción en `.gitignore` + commit auditorías vivas |

---

## 5. Backlog derivado

| Ítem | Prioridad | Esfuerzo | Depende de |
|------|-----------|----------|------------|
| **BKL-12** — RLS `*_all` → por operación | **Cerrado** | 2026-07-02 | — |
| **EST-LEG-04** — Inglés residual motor/nómina (`Payroll*`) | P2 | M | NOMENCLATURA fase 2 |
| **EST-LEG-06** — Mover alias `Tables` del service al mapper | P2 | S | Próxima fase nómina |
| **EST-LEG-05/07** — Renombrar `*.util` → `*.presenter` / mover a `presenters/` | P2 | M | Oportunista por módulo |
| **BKL-07** (existente) — Grants/claims `anon`/`user_metadata` | P1 | S–M | SEG-01b |

---

## 6. Secuencia recomendada

```txt
BKL-12 (RLS _all)  →  BKL-05/07 (SEG)  →  EST-LEG-04/06 oportunista en fases nómina
```

Ejecutar auditoría antes de cada cierre de fase BD o feature grande:

```powershell
./scripts/auditar-estandares-desviaciones.ps1
```

---

## 7. Registro

| Fecha | Acción |
|-------|--------|
| 2026-07-02 | Baseline inicial post EST-001…008; script `auditar-estandares-desviaciones.ps1` |
| 2026-07-02 | **BKL-12 cerrado:** RLS por operación en tablas hijo nómina; smoke EXIT 0 |

Al cerrar BKL-12: marcar fila en [`auditoria-proyecto-2026-07-backlog.md`](./auditoria-proyecto-2026-07-backlog.md) y esta sección.
