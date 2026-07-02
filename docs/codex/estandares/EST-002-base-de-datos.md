# EST-002 — Estándar de Base de Datos

**ERP Remuneraciones Chile**

Versión: 1.0  
Estado: Obligatorio  
Última revisión: 2026-07-02

## Objetivo

Definir cómo diseñar, nombrar, proteger y auditar tablas PostgreSQL del ERP: relaciones, RLS multi-tenant, triggers de auditoría, índices y validación posterior.

Complementa [EST-001 — Nomenclatura técnica](./EST-001-nomenclatura-tecnica.md) (nombres) y se implementa vía [EST-003 — SQL y PostgreSQL](./EST-003-sql-postgresql.md) (funciones/migraciones) y [EST-006 — Supabase](./EST-006-supabase.md) (auth, grants, despliegue).

---

## Alcance

- Tablas y columnas del dominio remuneraciones/administración.
- Políticas RLS por operación.
- Triggers de auditoría y timestamps.
- Índices e integridad referencial.
- Scripts de smoke test en `bd/scripts/`.

No sustituye contratos de módulo bajo `docs/codex/modulos/` ni fases congeladas en [`orquestador/estado-fases.md`](../orquestador/estado-fases.md).

---

## Tablas

### Convenciones obligatorias (nuevo)

| Regla | Detalle |
|-------|---------|
| Nombre | `snake_case`, descriptivo, singular o compuesto (`nomina_periodo`, `movimiento_nomina`) |
| Esquema | `public` salvo fase que indique otro |
| PK nuevas nómina/admin | columna `id` (`uuid`, `default gen_random_uuid()`) |
| PK legacy personas/empresa | `id_<entidad>` entero (`id_persona`, `id_empresa`) |
| Multi-tenant | toda tabla de negocio incluye `id_empresa` cuando aplica |
| Timestamps | `created_at`, `updated_at` (`timestamptz`, `default now()`) cuando la entidad se edita |
| Soft delete | solo si el módulo lo documenta; preferir estados (`anulado`, `cerrado`) |

Ver prefijos completos de objetos en [EST-001](./EST-001-nomenclatura-tecnica.md).

### Ejemplo mínimo (nueva entidad nómina)

```sql
create table public.nomina_ejemplo (
  id uuid primary key default gen_random_uuid(),
  id_empresa integer not null references public.empresa (id_empresa),
  nombre text not null,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

---

## Relaciones y foreign keys

### Prefijo `id_*` (obligatorio en nuevo)

Las columnas foráneas usan **prefijo `id_` + entidad**, no sufijo `_id`:

| Correcto | Evitar en nuevo |
|----------|-----------------|
| `id_empresa` | `empresa_id` |
| `id_nomina_periodo` | `nomina_periodo_id` |
| `id_concepto` | `concepto_id` |

### Constraints

| Tipo | Prefijo | Ejemplo |
|------|---------|---------|
| Primary key | `pk_` | `pk_nomina_periodo` |
| Foreign key | `fk_` | `fk_movimiento_nomina_periodo` |
| Check | `chk_` | `chk_fecha_ingreso_no_futura` |
| Unique (constraint) | `uq_` | `uq_nomina_periodo_empresa_periodo_tipo` |

Reglas:

- Toda FK debe tener `on delete` explícito (`restrict`, `cascade` o `set null`) según contrato del módulo.
- No crear FK “sueltas” sin índice de soporte en la columna hija cuando la tabla crece por volumen o RLS.

---

## Row Level Security (RLS)

### Principios

1. **RLS habilitado** en tablas de negocio expuestas a PostgREST.
2. **Una política por operación** (`select`, `insert`, `update`, `delete`), no una política omnibus.
3. **Rol `authenticated` únicamente** para DML de negocio.
4. **Revocar `anon`** en tablas y funciones sensibles (ver [EST-006](./EST-006-supabase.md)).
5. Aislamiento multi-tenant vía `id_empresa = public.current_user_empresa_id()`.

### Naming de policies

Patrón: `<tabla_abreviada>_<operacion>`

Ejemplos del proyecto:

- `nomina_periodo_select`
- `nomina_plantilla_ciclo_insert`
- `mov_recurrente_update`

### Plantilla por operación

```sql
alter table public.nomina_ejemplo enable row level security;
alter table public.nomina_ejemplo force row level security;

-- SELECT
drop policy if exists nomina_ejemplo_select on public.nomina_ejemplo;
create policy nomina_ejemplo_select on public.nomina_ejemplo
  for select to authenticated
  using (id_empresa = public.current_user_empresa_id());

-- INSERT
drop policy if exists nomina_ejemplo_insert on public.nomina_ejemplo;
create policy nomina_ejemplo_insert on public.nomina_ejemplo
  for insert to authenticated
  with check (id_empresa = public.current_user_empresa_id());

-- UPDATE
drop policy if exists nomina_ejemplo_update on public.nomina_ejemplo;
create policy nomina_ejemplo_update on public.nomina_ejemplo
  for update to authenticated
  using (id_empresa = public.current_user_empresa_id())
  with check (id_empresa = public.current_user_empresa_id());

-- DELETE (solo si el módulo lo autoriza)
drop policy if exists nomina_ejemplo_delete on public.nomina_ejemplo;
create policy nomina_ejemplo_delete on public.nomina_ejemplo
  for delete to authenticated
  using (id_empresa = public.current_user_empresa_id());

revoke all on public.nomina_ejemplo from anon;
grant select, insert, update, delete on public.nomina_ejemplo to authenticated;
```

### Prohibiciones

- No desactivar RLS “temporalmente” en migraciones productivas.
- No usar `using (true)` salvo catálogos globales documentados y revocados para `anon`.
- No confiar en `id_empresa` enviado por el cliente: validar contra JWT en RPC y RLS.

Referencia de identidad: [`current_user_empresa_id()`](../../supabase/migrations/20260611220000_nomina_f02_auditoria_y_rls_cimientos.sql) lee `app_metadata.id_empresa` del JWT (ver EST-006).

---

## Auditoría

### Columnas de auditoría

Cuando la entidad lo requiera:

| Columna | Uso |
|---------|-----|
| `created_at` / `updated_at` | timestamps automáticos |
| `created_by` / `updated_by` | `uuid` del usuario (`auth.uid()`) |

### Triggers

| Trigger | Prefijo nuevo | Función típica |
|---------|---------------|----------------|
| `updated_at` | `tg_<tabla>_updated` | `set_updated_at()` |
| auditoría de negocio | `tg_audit_<entidad>` | helper `registrar_evento_*` |

Ejemplo de trigger `updated_at`:

```sql
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger tg_nomina_ejemplo_updated
  before update on public.nomina_ejemplo
  for each row execute function public.set_updated_at();
```

Para eventos de dominio (nómina, transiciones de estado), usar helpers `SECURITY DEFINER` documentados en el módulo — nunca insertar auditoría desde el cliente Angular.

---

## Índices

### Prefijos obligatorios (nuevo)

| Tipo | Prefijo | Ejemplo |
|------|---------|---------|
| Índice normal | `ix_` | `ix_nomina_periodo_empresa_periodo` |
| Índice único | `uq_` | `uq_nomina_calc_periodo_activo_nomina` |

Legacy admitido (`idx_`, `ux_`): no renombrar sin fase; en objetos nuevos usar `ix_` / `uq_`.

### Criterios

- Índice en toda FK usada en joins frecuentes o filtros RLS (`id_empresa`, `id_nomina_periodo`).
- Índices compuestos alineados al orden de filtros reales (`id_empresa`, `periodo`, `estado`).
- Evitar índices duplicados que cubran la misma cardinalidad.

```sql
create index ix_nomina_ejemplo_empresa_activo
  on public.nomina_ejemplo (id_empresa, activo)
  where activo = true;
```

---

## Migraciones

Las migraciones viven en `supabase/migrations/` con el formato de [EST-001](./EST-001-nomenclatura-tecnica.md) y reglas transaccionales de [EST-003](./EST-003-sql-postgresql.md).

Encabezado obligatorio:

- ID de fase o backlog (`F09`, `BKL-04`).
- Objetivo en 2–4 líneas.
- Dependencias y qué **no** toca (motor, liquidaciones, estilos).

Al finalizar migraciones que alteren esquema expuesto:

```sql
notify pgrst, 'reload schema';
```

---

## Smoke tests (`bd/scripts/`)

### Ubicación y nombre

```txt
bd/scripts/validar-<dominio>-<tema>.sql
```

Ejemplos:

- `bd/scripts/validar-nomina-rls-multi-tenant.sql`
- `bd/scripts/validar-movimiento-recurrente-policies.sql`

### Contenido mínimo

1. Comentario de propósito y fase.
2. Consultas **read-only** o transacción con `rollback` al final.
3. Asserts con `raise exception` si falla la condición.
4. Idempotencia cuando sea posible (re-ejecutable en entorno controlado).

### Ejemplo de assert

```sql
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'nomina_periodo'
      and policyname = 'nomina_periodo_select'
  ) then
    raise exception 'Falta policy nomina_periodo_select';
  end if;
end;
$$;
```

Ejecutar con `psql` contra entorno de desarrollo/staging, nunca contra producción sin autorización.

---

## Legacy vs código nuevo

El ERP acumula convenciones históricas. Ver tabla «Legacy admitido» en [EST-001](./EST-001-nomenclatura-tecnica.md) y [`estandares/README.md`](./README.md).

- **No renombrar** tablas, policies ni índices existentes salvo fase explícita.
- **Todo objeto nuevo** sigue EST-002 en su totalidad.
- Si se extiende una tabla legacy, copiar el estilo del módulo más cercano y registrar deuda en la fase o PR.

---

## Relación con otras capas

| Capa | Estándar |
|------|----------|
| Nombres | [EST-001](./EST-001-nomenclatura-tecnica.md) |
| Funciones RPC, transacciones | [EST-003](./EST-003-sql-postgresql.md) |
| Tipos TS generados | [EST-004](./EST-004-typescript.md) |
| Supabase auth/grants | [EST-006](./EST-006-supabase.md) |
| Alcance agente IA | [EST-008](./EST-008-ia.md) |

---

## Checklist de cierre

Antes de dar por cerrada una fase que toca BD:

- [ ] Tabla nombrada en `snake_case`; PK y FK con convención `id_*`.
- [ ] `id_empresa` presente y referenciado en tablas multi-tenant.
- [ ] RLS **enabled** + **force**; policies **por operación** solo para `authenticated`.
- [ ] `revoke all ... from anon` en tablas de negocio.
- [ ] Grants mínimos a `authenticated` (no `grant all` indiscriminado).
- [ ] Triggers de `updated_at` y/o auditoría según contrato del módulo.
- [ ] Índices `ix_` / `uq_` en FK y filtros habituales.
- [ ] Migración con encabezado, transacción `begin`/`commit` y `notify pgrst` si aplica.
- [ ] Smoke test en `bd/scripts/` o extensión de uno existente.
- [ ] Sincronizar `database.types.ts` (ver EST-004) si cambió el esquema expuesto.
- [ ] Documento de módulo/fase actualizado en `docs/codex/modulos/`.
- [ ] Sin relajar RLS ni tocar motor/liquidaciones fuera de alcance ([EST-008](./EST-008-ia.md)).
