# EST-006 — Estándar Supabase

**ERP Remuneraciones Chile**

Versión: 1.0  
Estado: Obligatorio  
Última revisión: 2026-07-02

## Objetivo

Normar uso de Supabase como backend PostgreSQL + Auth + PostgREST: identidad multi-tenant, migraciones, grants RPC, RLS, recarga de esquema y prohibición de acceso anónimo a negocio.

Implementa en despliegue lo definido en [EST-002 — Base de datos](./EST-002-base-de-datos.md) y [EST-003 — SQL y PostgreSQL](./EST-003-sql-postgresql.md). Consumo desde Angular: [EST-004](./EST-004-typescript.md), [EST-005](./EST-005-angular.md).

---

## Arquitectura resumida

```text
Angular (authenticated JWT)
    → Supabase JS client (.rpc / .from)
        → PostgREST
            → PostgreSQL (RLS + funciones)
```

El ERP **no usa** `anon` para operaciones de remuneraciones, nómina, empleados ni parámetros operativos.

---

## Auth — `app_metadata.id_empresa`

### Fuente de verdad tenant

La empresa activa se resuelve en BD con:

```sql
public.current_user_empresa_id()
```

Lee, en orden:

1. `auth.jwt() -> 'app_metadata' ->> 'id_empresa'`
2. `auth.jwt() -> 'user_metadata' ->> 'id_empresa'` (fallback legacy)

Sin `id_empresa` válido → **NULL** → RLS bloquea (desde fase F02 nómina).

### Reglas

- **Nunca** confiar solo en `id_empresa` enviado desde Angular en body RPC.
- Asignar `app_metadata.id_empresa` en flujo de login/selección de empresa (backend/admin Supabase).
- Frontend: usar sesión autenticada; no crear clientes con service role.

Referencia: [`20260611220000_nomina_f02_auditoria_y_rls_cimientos.sql`](../../supabase/migrations/20260611220000_nomina_f02_auditoria_y_rls_cimientos.sql).

---

## Roles y grants

| Rol | Uso en ERP |
|-----|------------|
| `authenticated` | usuarios RRHH vía Angular |
| `service_role` | scripts/admin; **no** en frontend |
| `anon` | revocado en tablas/RPC de negocio |

### Patrón por tabla nueva

```sql
revoke all on public.mi_tabla from anon;
grant select, insert, update, delete on public.mi_tabla to authenticated;
```

### Patrón por RPC nueva

```sql
revoke all on function public.listar_ejemplo(integer, integer) from public;
grant execute on function public.listar_ejemplo(integer, integer) to authenticated;
```

Fix real — permisos residuales de `anon`:

[`20260702131000_movimiento_recurrente_revoke_anon_all.sql`](../../supabase/migrations/20260702131000_movimiento_recurrente_revoke_anon_all.sql).

---

## Row Level Security

- Habilitar y **forzar** RLS en tablas expuestas.
- Policies **por operación** solo para `authenticated` (EST-002).
- Condición estándar: `id_empresa = public.current_user_empresa_id()`.

No publicar tablas sensibles vía Realtime sin revisión de fase.

---

## Migraciones (`supabase/migrations/`)

### Ubicación única productiva

```txt
supabase/migrations/YYYYMMDDHHMMSS_<dominio>_<descripcion>.sql
```

No aplicar DDL suelto en producción fuera de migraciones versionadas.

### Contenido

- Encabezado de fase (EST-003).
- Transacción `begin` / `commit`.
- `set local lock_timeout` / `statement_timeout`.
- Advisory locks en fases con riesgo de concurrencia.
- Al alterar objetos expuestos a PostgREST:

```sql
notify pgrst, 'reload schema';
```

Migración dedicada de recarga si solo hotfix cache:

[`20260610190000_reload_postgrest_schema_cache.sql`](../../supabase/migrations/20260610190000_reload_postgrest_schema_cache.sql).

### Flujo local

1. Crear migración con CLI o convención del equipo.
2. Aplicar en entorno dev/staging.
3. Ejecutar smoke tests `bd/scripts/` (EST-002).
4. Regenerar/sincronizar `database.types.ts` (EST-004).
5. Actualizar doc de módulo (EST-007).

---

## PostgREST / RPC

- Exponer funciones en esquema `public` con verbos español (`listar_`, `obtener_`, `guardar_`).
- Preferir `SECURITY INVOKER` en RPC de negocio (respeta RLS).
- Retornos `jsonb` estables para mappers TS.
- Paginación: parámetros `p_page`, `p_page_size` alineados a `app-data-grid` serverSide (EST-005).

---

## Storage (cuando aplique)

- Buckets privados por defecto; policies espejo de RLS por empresa si hay archivos tenant.
- No almacenar secretos ni PII sin cifrado/documentación de fase.

---

## Realtime y Edge Functions

- **Realtime**: no habilitar en tablas de nómina/liquidaciones sin fase.
- **Edge Functions**: preferir RPC PostgreSQL salvo integración externa documentada.

---

## Entornos

| Entorno | Notas |
|---------|-------|
| Local / dev | `.env` con URL y anon key solo para bootstrap auth |
| Staging | migraciones automáticas; JWT con `id_empresa` realista |
| Producción | sin relajar RLS; sin grants a `anon` |

No commitear `.env`, service role keys ni secretos.

---

## Sincronización con frontend

Tras cada migración que cambie tablas/RPC expuestas:

1. `notify pgrst, 'reload schema'`
2. Actualizar `src/app/core/models/database.types.ts`
3. Ajustar mappers/repositories (EST-004)
4. Ejecutar tests del feature

---

## Prohibiciones

- Exponer RPC o tablas de negocio a `anon`.
- Usar service role en Angular.
- Desactivar RLS para “destrabar” desarrollo.
- Omitir `notify pgrst` tras DDL en objetos expuestos.
- Bypass de tenant con fallback a “primera empresa” (eliminado en F02).

Zonas protegidas para agentes: [EST-008](./EST-008-ia.md).

---

## Relación con otras capas

| Tema | Documento |
|------|-----------|
| Tablas, índices, policies | [EST-002](./EST-002-base-de-datos.md) |
| SQL, transacciones, errores | [EST-003](./EST-003-sql-postgresql.md) |
| Repositories TS | [EST-004](./EST-004-typescript.md) |
| Grillas serverSide | [EST-005](./EST-005-angular.md) |

---

## Checklist de cierre

- [ ] Migración en `supabase/migrations/` con encabezado de fase.
- [ ] RLS enabled + policies por operación (`authenticated` only).
- [ ] `revoke all from anon` en tablas/RPC sensibles.
- [ ] Grants mínimos a `authenticated`.
- [ ] RPC con `search_path` y seguridad justificada (INVOKER/DEFINER).
- [ ] `notify pgrst, 'reload schema'` tras cambios expuestos.
- [ ] `current_user_empresa_id()` coherente con JWT; sin fallback laxo.
- [ ] `database.types.ts` y mappers actualizados.
- [ ] Smoke test SQL si aplica.
- [ ] Documentación de módulo/fase actualizada.
