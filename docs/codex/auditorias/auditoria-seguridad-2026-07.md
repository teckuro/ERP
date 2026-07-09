# Auditoría de seguridad y vulnerabilidades — informe priorizado

> **ID:** `AUDIT-SEC-2026-07`
>
> **Fecha:** 2026-07-08 · **Estado:** **Correcciones SEC-01…SEC-04 aplicadas** (SEC-05 parcial) — ver §5 y `estado-fases.md`
>
> **Alcance:** frontend Angular, Supabase (RLS/RPC/Storage/Edge Functions), secretos en repo, dependencias npm.
>
> **Fuentes contrastadas:** [`EST-002-base-de-datos.md`](../estandares/EST-002-base-de-datos.md) · [`EST-006-supabase.md`](../estandares/EST-006-supabase.md) · [`EST-008-ia.md`](../estandares/EST-008-ia.md) · [`auditoria-proyecto-2026-07-backlog.md`](./auditoria-proyecto-2026-07-backlog.md) (BKL-04…06, SEG-01b) · [`matriz-roles-permisos.md`](../orquestador/matriz-roles-permisos.md)

---

## 1. Resumen ejecutivo

La revisión read-only del repositorio y del monolito legacy `bd/base/v11/` confirma **riesgos críticos y altos** que conviene tratar antes de ampliar usuarios o exponer el ERP fuera del piloto:

| Prioridad | Hallazgos principales | Acción propuesta |
| --------- | --------------------- | ---------------- |
| **P0 — Crítico** | Secretos y metadatos de producción trackeados en git (`supabase/.temp/`) | SEC-01: ignorar, sacar del índice, rotar credenciales pooler |
| **P1 — Alto** | RLS legacy con `USING (true)` y grants a `anon` en empleados, parámetros y catálogos | SEC-02: migración de endurecimiento por tenant |
| **P1 — Alto** | Snapshots de nómina sin filtro de empresa + RPC acepta `p_id_empresa` del cliente | SEC-03: validación server-side + RLS tenant en `nomina_calculo_*` |
| **P1 — Alto** | Guards de rol existen pero no están cableados en rutas | SEC-04: guards en escritura/admin + `permisosModulos` |
| **P2 — Medio** | Errores crudos al usuario, JWT en localStorage, CORS `*`, bucket logos público, 26 CVE npm | SEC-05: higiene transversal |

**No se aplicó** ningún cambio de SQL, guards, `.gitignore` ni configuración en esta fase. El único ítem recomendado para aprobación **inmediata** (fuera del informe) es SEC-01, porque cada commit re-expone metadatos sensibles.

---

## 2. Verificaciones ejecutadas (2026-07-08)

### 2.1 `npm audit`

```text
26 vulnerabilities (2 low, 11 moderate, 13 high)
```

| Cadena destacada | Severidad | Notas |
| ---------------- | --------- | ----- |
| `@angular/common` / `@angular/core` / `@angular/compiler` | high / moderate | DoS OOM, XSS en sanitización, fuga en `HttpTransferCache` — `npm audit fix` disponible |
| `vite`, `undici`, `ws` | moderate–high | toolchain de desarrollo (build/test) |
| `tar` vía `supabase` CLI (devDependency) | high | path traversal en extracción — actualizar CLI cuando haya release |

**Estado:** confirmado en repo local. **Acción:** SEC-05 — planificar `npm audit fix` + revisión de changelog Angular 21.2.x en ventana controlada (correr `test:gate:*`).

### 2.2 Secretos en git — `supabase/.temp/`

**Comando:** `git ls-files supabase/.temp`

**Archivos trackeados (9):**

- `cli-latest`, `gotrue-version`, `linked-project.json`, `pooler-url`, `postgres-version`, `project-ref`, `rest-version`, `storage-migration`, `storage-version`

**Historial reciente (`git log --oneline -- supabase/.temp`):** al menos 6 commits desde `ad8a70f` (2026-06), último `b546c0f`.

**Contenido sensible confirmado (redactado):**

| Archivo | Exposición |
| ------- | ---------- |
| `pooler-url` | Connection string PostgreSQL pooler Supabase (usuario `postgres`, host `*.pooler.supabase.com`, project ref `mjrckxodzrfkyqjkyjkn`) |
| `linked-project.json` | Project ref, nombre `api-remuneraciones`, organization id/slug |
| `project-ref` | Mismo project ref en texto plano |

**`.gitignore`:** incluye `supabase/.temp/` desde SEC-01 (2026-07-08). Archivos removidos del índice git con `git rm -r --cached` (pendiente commit).

**Estado:** confirmado en repo. **Impacto:** cualquier clon o fork del repo expone metadatos de producción; si la contraseña del pooler estuvo alguna vez en el historial, requiere rotación en Supabase Dashboard.

### 2.3 Diagnóstico RLS en BD desplegada

**Ejecutado:** 2026-07-08 con `SUPABASE_DB_URL` (instancia remota Supabase).

**Script reutilizable:** [`scripts/sec-audit-rls-diagnostics.sql`](../../../scripts/sec-audit-rls-diagnostics.sql)

```powershell
# Cargar .env y ejecutar
Get-Content .env | Where-Object { $_ -match '^\s*[^#][^=]+=' } | ForEach-Object {
  $name, $value = $_ -split '=', 2
  [Environment]::SetEnvironmentVariable($name.Trim(), $value.Trim().Trim('"').Trim("'"), 'Process')
}
psql "$env:SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f scripts/sec-audit-rls-diagnostics.sql
```

**Resultados resumidos (BD desplegada):**

| Consulta | Conteo | Conclusión |
| -------- | ------ | ---------- |
| **A)** Policies `USING/WITH CHECK = true` | **117 filas** | Legacy activo: `persona`, `contrato`, `parametros_*`, `concepto`, catálogos, etc. Incluye rol `{anon,authenticated}`. |
| **B1)** Grants `anon` en tablas `public` | **714 filas** | Superficie masiva: empleados, nómina, liquidaciones, snapshots (`nomina_calculo_*`), licencias, etc. |
| **B2)** `EXECUTE` a `anon` en funciones | **62 funciones** | Incluye `transicionar_nomina_periodo`, `eliminar_nomina_completa`, `guardar_licencia_medica`, helpers legacy. Contrasta con migraciones recientes que revocan anon en RPC nuevas. |
| **C)** RLS enabled sin FORCE RLS | **86 tablas** | Ninguna tabla con RLS tiene `FORCE ROW LEVEL SECURITY`. |

**Snapshots (`nomina_calculo_*`):** no aparecen en consulta A (no usan `true` literal), pero sí tienen grants `anon` en B1 y carecen de filtro tenant — confirma SEC-H03/H04 con policies `auth.role() = 'authenticated'` solamente.

**Estado:** **confirmado en BD desplegada** — el monolito legacy no fue reemplazado por migraciones SEC en empleados/parámetros/concepto.

---

## 3. Matriz de hallazgos priorizada

Convención de severidad: **Crítico** (exposición inmediata / bypass tenant) · **Alto** (IDOR o auth débil) · **Medio** (defensa en profundidad) · **Bajo** (mejora recomendada).

| ID | Sev. | Hallazgo | Evidencia | Impacto | Estado |
| -- | ---- | -------- | --------- | ------- | ------ |
| SEC-H01 | **Crítico** | Metadatos y connection string pooler en git | `supabase/.temp/pooler-url`, `linked-project.json`, `project-ref`; 9 archivos trackeados | Filtración de infraestructura; vector para ataques dirigidos; posible acceso BD si credencial válida | **Mitigado repo** (SEC-01 parcial): `.gitignore` + `git rm --cached`; rotación pooler **pendiente manual**; historial git persiste |
| SEC-H02 | **Crítico** | RLS legacy abierta en tablas operativas (`USING (true)`, grants `anon`) | `08_seguridad_rls.sql`; BD: **117 policies** permisivas, **714 grants anon** | Lectura/escritura cross-tenant vía PostgREST | **Confirmado BD** |
| SEC-H03 | **Alto** | IDOR en snapshot: RPC confía en `p_id_empresa` del cliente | `20260708230000_sec03…sql` wrapper + `sec_assert_snapshot_empresa` | Usuario autenticado podría persistir snapshots de otra empresa | **Mitigado** SEC-03 |
| SEC-H04 | **Alto** | RLS snapshots sin filtro tenant | `20260708230000_sec03…sql` policies `nomina_calculo_*_select/insert/update` | Cross-tenant snapshots | **Mitigado** SEC-03 |
| SEC-H05 | **Alto** | Guards de remuneraciones no cableados | `app.routes.ts` L103–108 generador; `crearModuloPermisoGuard` en rutas | Perfil consulta accedía por URL directa | **Mitigado** SEC-04 |
| SEC-H06 | **Alto** | `permisosModulos` (ADMIN-01) definido pero no aplicado | `sidebar.component.ts` filtra menú; guards por módulo en rutas | Módulos restringidos no enforced | **Mitigado** SEC-04 |
| SEC-H07 | **Alto** | Errores técnicos expuestos al usuario | `throw new Error(error.message)` en repos (p. ej. `parametros-generales.repository.ts` ×33, `haberes-descuentos.repository.ts` ×18); contenedores `mensajeError.set(err.message)` (administración, licencias, nómina V2) | Filtración de nombres de tablas, RPC, constraints PostgreSQL | Confirmado repo |
| SEC-H08 | **Medio** | JWT de sesión en `localStorage` | `supabase.service.ts` L12–17 (`persistSession: true`, `storageKey: 'angular-erp-auth'`) | Riesgo XSS estándar SPA: robo de token | Confirmado repo |
| SEC-H09 | **Medio** | CORS `*` en Edge Functions | `admin-usuarios/index.ts` L20; `licencia-medica-inbound/index.ts` L4; `erp-asistente-preguntor/index.ts` L4 | Origen arbitrario puede invocar funciones si conoce URL + anon key (auth JWT aún requerida en admin-usuarios) | Confirmado repo |
| SEC-H10 | **Medio** | Logout no limpia contexto de empresa | `header.component.ts` invoca `EmpresaActivaService.limpiar()` tras logout | Datos de empresa previa visibles brevemente | **Mitigado** SEC-05 parcial |
| SEC-H11 | **Medio** | Previred / catálogo sin RLS tenant | `20260706000000_previred_exportacion.sql`; BD: `catalogo_previred` / `nomina_previred_exportacion` con `auth.role()` | Exportaciones visibles entre empresas | **Confirmado BD** |
| SEC-H12 | **Medio** | Bucket `logos-empresa` lectura pública | `20260708220000_administracion_perfiles_config_doc.sql` L316–323 | Logos accesibles por URL pública | Confirmado repo |
| SEC-H13 | **Medio** | Sin Content-Security-Policy | Sin matches en repo para CSP | Reduce defensa ante XSS | Confirmado repo |
| SEC-H14 | **Medio** | Project ref hardcodeado en script deploy | `scripts/supabase-deploy-asistente.ps1` | Acopla script a un tenant | **Corregido** SEC-01: `$env:SUPABASE_PROJECT_REF` o `supabase/.temp/project-ref` |
| SEC-H15 | **Medio** | 26 vulnerabilidades npm | `npm audit` 2026-07-08 | CVE en Angular y toolchain | Confirmado repo |
| SEC-H16 | **Bajo** | Grants `anon` en helpers identidad | F02 vs BKL-07 | Superficie residual | **Verificar** si `current_user_empresa_id` sigue con EXECUTE para anon (B2 no listó helpers; posible OK post-BKL-07) |

### Nota sobre correcciones ya presentes en migraciones

Estos ítems del backlog previo **sí tienen migración** y deben contrastarse en BD (pueden estar OK en PROD):

- **BKL-04 / movimiento_recurrente:** `20260702130000_movimiento_recurrente_rls_por_empresa.sql` + revoke anon.
- **BKL-06 parcial / transicionar:** `20260703180500_nomina_bkl06_transicionar_permisos.sql` (`erp_nomina_permiso_efectivo`).
- **F15b:** `20260702250000_nomina_f15b_f14_f15_f16.sql` (permisos en RPC críticas).
- **Revoke anon en RPC nómina:** múltiples migraciones 20260702+.

La brecha principal sigue siendo el **bloque legacy de `08_seguridad_rls.sql`** (empleados, parámetros, concepto) y **snapshots**, no cubiertos por migraciones posteriores.

---

## 4. Propuestas de corrección (sin aplicar)

### 4.1 SEC-H01 — Higiene de repo (SEC-01)

**Estado implementación (2026-07-08):**

| Acción | Estado |
| ------ | ------ |
| `.gitignore` → `supabase/.temp/` | ✅ Aplicado |
| `git rm -r --cached supabase/.temp` | ✅ Aplicado (pendiente **commit** del equipo) |
| Parametrizar `supabase-deploy-asistente.ps1` | ✅ `$env:SUPABASE_PROJECT_REF` o fallback local |
| Rotación credenciales pooler (Dashboard) | ⏳ **Manual** — operador |
| Purgar historial git (si repo fue público) | ⏳ Opcional — `git filter-repo` |

**Inmediato (si aún no commiteado):**

1. Añadir a `.gitignore`:

   ```gitignore
   supabase/.temp/
   ```

2. Sacar del índice sin borrar local:

   ```powershell
   git rm -r --cached supabase/.temp
   git commit -m "chore(security): dejar de trackear supabase/.temp"
   ```

3. **Rotación manual** (Dashboard Supabase → Database → reset password / rotate pooler credentials) si la contraseña del pooler pudo haber estado en historial git.

4. Parametrizar `scripts/supabase-deploy-asistente.ps1`:

   ```powershell
   [string]$ProjectRef = $env:SUPABASE_PROJECT_REF
   ```

   Documentar variable en README interno / `docs/codex`.

**Opcional avanzado:** `git filter-repo` o BFG para purgar historial si el repo es o fue público.

---

### 4.2 SEC-H02 — Endurecer RLS legacy (SEC-02)

**Migración propuesta** `YYYYMMDDHHMMSS_sec02_rls_legacy_endurecimiento.sql`:

```sql
-- Plantilla por tabla legacy con id_empresa (persona/contrato vía join, parametros_* directo)
-- 1) REVOKE ALL … FROM anon;
-- 2) GRANT … TO authenticated;
-- 3) DROP policies *_anon_* / empleados_alta_* / parametros_*_anon_*;
-- 4) CREATE policies por operación con current_user_empresa_id();
-- 5) ALTER TABLE … FORCE ROW LEVEL SECURITY;

-- Ejemplo persona (requiere join contrato → empresa o columna derivada según esquema real):
-- CREATE POLICY persona_select_tenant ON public.persona
--   FOR SELECT TO authenticated
--   USING (
--     EXISTS (
--       SELECT 1 FROM public.contrato c
--       WHERE c.id_persona = persona.id_persona
--         AND c.id_empresa = public.current_user_empresa_id()
--     )
--   );

-- Ejemplo parametros_generales:
-- CREATE POLICY parametros_generales_select_tenant ON public.parametros_generales
--   FOR SELECT TO authenticated
--   USING (id_empresa = public.current_user_empresa_id());
```

**Tablas objetivo mínimo:** `persona`, `contrato`, `parametros_*` (lista en `08_seguridad_rls.sql` L25–31), `concepto` / reglas cálculo, catálogos editables que hoy tengan write policies `true`.

**Smoke post-migración:** login con JWT tenant A → no lee filas tenant B; `anon` sin acceso en consultas B) de §2.3.

**Dependencias:** inventario de RPC legacy que asumían RLS abierta; coordinar con piloto empleados/parámetros.

---

### 4.3 SEC-H03 / SEC-H04 — Snapshots tenant-safe (SEC-03)

**A) Validación en RPC** (inicio de `guardar_nomina_calculo_snapshot`):

```sql
IF p_id_empresa IS DISTINCT FROM public.current_user_empresa_id() THEN
  RAISE EXCEPTION 'Empresa no autorizada para esta operación'
    USING ERRCODE = '42501';
END IF;
```

**B) RLS en tablas `nomina_calculo_*`:**

```sql
-- Reemplazar policies nomina_snapshot_* por tenant:
-- USING (id_empresa = public.current_user_empresa_id())
-- WITH CHECK (id_empresa = public.current_user_empresa_id())
-- + FORCE ROW LEVEL SECURITY en las 5 tablas del array en 16_nomina_calculo_snapshot_rls.sql
```

**C) Frontend:** dejar de enviar `p_id_empresa` desde Angular cuando la RPC pueda resolver solo desde JWT (fase posterior; no bloqueante si B) está activo).

**Relación backlog:** complementa BKL-01 (snapshot por `nominaPeriodoId`) y BKL-06 (permisos RPC).

---

### 4.4 SEC-H05 / SEC-H06 — Guards y permisos por módulo (SEC-04)

**Rutas (`app.routes.ts` y/o `empleados.routes.ts`):**

| Ruta | Guard propuesto |
| ---- | --------------- |
| `remuneraciones/nominas/:id/generador` | `remuneracionesEscrituraGuard` |
| Acciones admin (eliminar plantilla, reabrir nómina) | `remuneracionesAdminNominaGuard` en sub-rutas o resolvers |
| Módulos según perfil ADMIN-01 | helper `permisosModulos().<modulo>.puedeVer` en `canActivate` o menú sidebar |

**Patrón existente:** `adminSistemaGuard` en `/administracion` (`admin-sistema.guard.ts` L7–13).

**Tests:** extender `remuneraciones-permisos.guard.spec.ts` con rutas integradas; E2E perfil consulta → redirect con `?acceso=denegado`.

**Copy UI:** mensaje RRHH «No tiene permiso para esta acción» (sin nombres de guard).

---

### 4.5 SEC-H07…H15 — Higiene transversal (SEC-05)

| Hallazgo | Propuesta |
| -------- | --------- |
| Errores crudos | Extender `mensajeErrorSupabaseParaUsuario()`; reemplazar `throw new Error(error.message)` en repos por wrapper; contenedores usar helper en catch |
| Logout | Tras `auth.logout()`, invocar `EmpresaActivaService.limpiar()` y limpiar preferencias UI sensibles si aplica |
| CORS Edge | Restringir `Access-Control-Allow-Origin` al dominio del ERP (env `ERP_ALLOWED_ORIGIN`) |
| CSP | Meta CSP mínima en `index.html` o headers en hosting (fase infra) |
| JWT localStorage | Documentar riesgo; evaluar `@supabase/ssr` / cookies httpOnly solo con fase de hosting |
| npm audit | `npm audit fix` + bump `@angular/*` patch; re-ejecutar gates |
| Previred RLS | Policies con join a `nomina_periodo` / `id_empresa` en SEC-02 o migración dedicada |
| Logos públicos | Aceptar o cambiar bucket a privado + signed URLs (decisión producto) |

---

## 5. Plan de fases SEC-01…SEC-05

Orden sugerido por **riesgo × esfuerzo**. Cada fase requiere aprobación explícita antes de implementar.

| Fase | Objetivo | Hallazgos | Esfuerzo | Dep. | Criterio de listo |
| ---- | -------- | --------- | -------- | ---- | ------------------- |
| **SEC-01** | Higiene repo y secretos | H01, H14 | **S** | — | `.temp/` ignorado y fuera del índice; credenciales rotadas si aplicaba; script deploy parametrizado |
| **SEC-02** | RLS legacy multi-tenant | H02, H11, H16 | **L** | SEC-01 deseable | Consultas §2.3 sin policies `true` en tablas negocio; `anon` sin grants; smoke empleados/parámetros/concepto |
| **SEC-03** | Snapshots tenant-safe | H03, H04 | **M** | SEC-02 parcial | RPC valida empresa JWT; RLS `nomina_calculo_*` por tenant; test IDOR negativo |
| **SEC-04** | Autorización Angular | H05, H06 | **M** | Matriz roles ✅ | Guards en rutas escritura/admin; menú respeta `permisosModulos`; tests guard verdes |
| **SEC-05** | Defensa en profundidad | H07–H10, H12–H15 | **M** | SEC-04 deseable | Errores humanizados en módulos piloto; logout limpia empresa; npm audit ≤ umbral acordado; CORS restringido |

### Orden de implementación recomendado

```text
SEC-01  →  SEC-03  →  SEC-02  →  SEC-04  →  SEC-05
           (IDOR)     (legacy)    (guards)   (higiene)
```

**Rationale:** SEC-01 es quick win sin riesgo funcional. SEC-03 cierra el IDOR de nómina antes de ampliar usuarios. SEC-02 es la migración más amplia (empleados/parámetros). SEC-04 alinea UI con lo que BD ya exige. SEC-05 es continua.

**Relación con backlog existente:**

| SEC | Backlog previo |
| --- | -------------- |
| SEC-02 | BKL-04 (recurrentes ya migrado), extensión a legacy |
| SEC-03 | BKL-01, BKL-06 |
| SEC-04 | BKL-05 / SEG-01b |
| SEC-05 | BKL-06 UI errors, npm |

---

## 6. Fuera de alcance (esta auditoría)

- Aplicar migraciones SQL o cambios de guards/configuración.
- Rotación de claves en Supabase Dashboard (acción manual del operador).
- Refactor masivo de todos los repositorios (queda acotado en SEC-05).
- Pentest externo o escaneo DAST del despliegue productivo.
- Cambios a estilos globales, motor de cálculo o nómina productiva.

---

## 7. Archivos revisados (evidencia)

| Área | Archivos |
| ---- | -------- |
| Secretos | `supabase/.temp/*`, `.gitignore`, `scripts/supabase-deploy-asistente.ps1` |
| RLS legacy | `bd/base/v11/partes/08_seguridad_rls.sql`, `16_nomina_calculo_snapshot_rls.sql` |
| Migraciones | `supabase/migrations/20260702130000_*`, `20260702180000_*`, `20260703180500_*`, `20260706000000_*`, `20260708220000_*` |
| RPC snapshot | `supabase/migrations/20260702160000_nomina_f09_snapshot_por_nomina.sql` |
| Frontend auth | `app.routes.ts`, `remuneraciones-permisos.guard.ts`, `admin-sistema.guard.ts`, `auth.service.ts`, `erp-permisos-remuneraciones.service.ts` |
| Errores | `erp-supabase-user-message.ts`, repos parametros/haberes/nómina |
| Edge | `supabase/functions/admin-usuarios/index.ts`, `licencia-medica-inbound/index.ts` |
| Dependencias | `package.json`, salida `npm audit` |

**No tocados:** `angular.json`, estilos globales, motor de cálculo.

---

## 8. Próximo paso operativo

1. **Commit** de SEC-01…SEC-05 (repo + migraciones + frontend + Edge CORS).
2. **Rotar** credenciales pooler en Supabase Dashboard si el historial git pudo exponerlas.
3. ~~**SEC-02**~~ — **aplicado** 2026-07-08. Post-deploy: policies `USING(true)` **0**; grants `anon` **0 tablas** (solo vistas residuales revocadas).
4. ~~**SEC-02b**~~ — **aplicado** 2026-07-08 (`20260708250000_sec02b_rls_nomina_movvar_anon.sql`). Tenant en liquidaciones, preparación, Previred y movimientos variables.
5. ~~**SEC-03**~~ — **aplicado** 2026-07-08.
6. **Smoke funcional:** alta empleado, parámetros, conceptos, nómina, movimientos variables.
7. **SEC-05 restante:** extender errores humanizados a nómina/repos restantes; bump `@angular/*`; `ERP_ALLOWED_ORIGIN` en producción; CSP.
8. **Opcional:** revoke `anon` en RPC (~72) y RLS en tablas legacy sin policies (`liquidacion`, `movimiento`, etc.).

---

*Informe AUDIT-SEC-2026-07. Contrastado con EST-002, EST-006, EST-008, AGENTS.md y backlog AUDIT-PROYECTO-2026-07.*
