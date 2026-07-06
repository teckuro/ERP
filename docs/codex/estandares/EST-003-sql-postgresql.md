# EST-003 — Estándar SQL y PostgreSQL

**ERP Remuneraciones Chile**

Versión: 1.0  
Estado: Obligatorio  
Última revisión: 2026-07-02

## Objetivo

Normar cómo escribir funciones RPC, vistas, transacciones, manejo de errores y migraciones PostgreSQL del ERP, alineadas a Supabase/PostgREST y al multi-tenant por JWT.

Complementa [EST-002 — Base de datos](./EST-002-base-de-datos.md) (tablas, RLS) y [EST-006 — Supabase](./EST-006-supabase.md) (despliegue, grants). Nomenclatura de símbolos: [EST-001](./EST-001-nomenclatura-tecnica.md).

---

## Verbos RPC expuestos (PostgREST)

Las funciones invocables desde Angular/Supabase client usan **verbo en español** + dominio:

| Verbo | Uso | Ejemplo |
|-------|-----|---------|
| `listar_` | conjuntos paginados o filtrados | `listar_dotacion_nomina` |
| `obtener_` | un registro o snapshot puntual | `obtener_resumen_periodo` |
| `guardar_` | upsert o persistencia de formulario | `guardar_preferencia_ui` |
| `confirmar_` | acción irreversible o transaccional | `confirmar_creacion_nomina` |
| `eliminar_` | borrado controlado | `eliminar_nomina_completa` |
| `transicionar_` | cambio de estado de máquina | `transicionar_nomina_periodo` |
| `preview_` | evaluación sin persistir | `preview_creacion_nomina` |

Funciones **internas** (no expuestas al cliente): prefijo `fn_` o `_fn_` privada. Ver EST-001.

---

## PL/pgSQL — prefijos de variables

Obligatorio en funciones nuevas:

| Elemento | Prefijo | Ejemplo |
|----------|---------|---------|
| Parámetros | `p_` | `p_id_empresa`, `p_nomina_id` |
| Variables locales | `v_` | `v_total`, `v_fingerprint` |
| Constantes | `c_` | `c_estado_cerrado` |
| Record | `r_` | `r_periodo` |
| ROWTYPE | `rw_` | `rw_movimiento` |
| Cursores | `cur_` | `cur_empleados` |
| Excepciones | `ex_` | `ex_periodo_cerrado` |

Paginación estándar cuando aplique: `p_page`, `p_page_size`, `p_busqueda`, `p_orden`.

---

## `search_path`

Toda función nueva debe fijar explícitamente:

```sql
set search_path = public
```

Cuando accede a `auth`:

```sql
set search_path = public, auth
```

Nunca omitir `search_path` en `SECURITY DEFINER` (riesgo de hijacking de esquema).

---

## `SECURITY DEFINER` vs `SECURITY INVOKER`

| Modo | Cuándo usar |
|------|-------------|
| **INVOKER** (default preferido) | RPC de negocio que debe respetar RLS del usuario (`listar_*`, `confirmar_*` con empresa por JWT) |
| **DEFINER** | Helpers transversales auditados (`registrar_evento_auditoria_nomina`, utilidades que escriben en tablas protegidas) |

Reglas para `SECURITY DEFINER`:

1. Función lo más **pequeña** posible; sin SQL dinámico innecesario.
2. `set search_path = public` (o `public, auth` acotado).
3. Validar identidad con `auth.uid()` / `current_user_empresa_id()` — **nunca** confiar en IDs enviados sin cruzar JWT.
4. `revoke all on function ... from public`.
5. `grant execute ... to authenticated` (o rol documentado); **no** exponer a `anon` salvo catálogo público explícito.

Ejemplo de cabecera:

```sql
create or replace function public.registrar_evento_ejemplo(
  p_entidad_id uuid,
  p_accion text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- validaciones + insert auditado
end;
$$;

revoke all on function public.registrar_evento_ejemplo(uuid, text) from public;
grant execute on function public.registrar_evento_ejemplo(uuid, text) to authenticated;
```

---

## Transacciones en migraciones

### Estructura de archivo

Ubicación: `supabase/migrations/`  
Nombre: `YYYYMMDDHHMMSS_<dominio>_<descripcion_corta>.sql` (EST-001).

Encabezado obligatorio (bloque `-- ====`):

- ID fase/backlog y enlace a doc en `docs/codex/modulos/`.
- Objetivo, dependencias, qué no toca.

### Cuerpo transaccional

```sql
begin;

set local lock_timeout = '5s';
set local statement_timeout = '120s';

-- lock advisory por fase cuando hay riesgo de carrera
select pg_advisory_xact_lock(hashtext('NOM-ADMIN-OPS-F05'));

-- DDL/DML aquí

commit;

notify pgrst, 'reload schema';
```

Reglas:

- Una migración = un propósito coherente; evitar mezclar dominios no relacionados.
- Usar `drop ... if exists` antes de `create` en objetos reemplazables.
- Preferir `create or replace function` con firma estable.
- Al cambiar firma de RPC en uso, incluir `drop function if exists` con tipos explícitos.

Referencia real: [`20260615140000_nomina_f05_creacion_transaccional.sql`](../../supabase/migrations/20260615140000_nomina_f05_creacion_transaccional.sql).

---

## Mensajes de error en español

Los errores visibles o mapeables al frontend deben ser **claros para RRHH**, no técnicos.

### Patrón recomendado

```sql
raise exception using
  errcode = 'P0001',
  message = 'No se puede modificar un período cerrado.',
  detail  = 'nomina_periodo_id=' || p_nomina_id::text;
```

Códigos habituales del proyecto:

| Código | Significado operativo |
|--------|----------------------|
| `P0001` | regla de negocio violada |
| `40001` | conflicto / reintento (p. ej. fingerprint desactualizado) |
| `23505` | duplicado (traducir en capa TS si llega crudo) |

Reglas:

- `message`: español, orientado a acción («Complete la dotación antes de continuar»).
- `detail` / `hint`: contexto técnico opcional para logs; no mostrar crudo en UI.
- No exponer nombres de tablas, RPC ni stack SQL al usuario final ([EST-005](./EST-005-angular.md), NOIA).

---

## Vistas y CTE

| Objeto | Prefijo | Notas |
|--------|---------|-------|
| Vista normal | `vw_` | solo lectura expuesta si el módulo lo autoriza |
| Materialized view | `mv_` | refresh documentado; RLS heredada vía policies en tabla base o RPC |

Preferir RPC `listar_*` con paginación server-side antes de exponer vistas amplias sin RLS.

---

## Grants y permisos

Por cada función RPC nueva:

```sql
revoke all on function public.listar_ejemplo(integer, integer) from public;
grant execute on function public.listar_ejemplo(integer, integer) to authenticated;
```

Por cada tabla:

- `revoke all ... from anon` en negocio.
- Grants column-level solo si la fase lo exige; default: tabla completa acotada por RLS.

Detalle Supabase: [EST-006](./EST-006-supabase.md).

---

## Retornos JSONB

RPC que alimentan Angular suelen retornar `jsonb` estructurado:

```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "pageSize": 50
}
```

Convención TS en capa mapper: camelCase en [EST-004](./EST-004-typescript.md).

---

## Idempotencia y concurrencia

- Operaciones de creación: detectar duplicado por clave natural (`empresa + periodo + tipo`) y retornar existente si aplica.
- Transiciones de estado: validar versión esperada (`version_estado`) antes de actualizar.
- Preview + confirmación: comparar `fingerprint` dentro de la misma transacción de confirmación.

---

## Smoke tests SQL

Complementar migraciones con scripts en `bd/scripts/` (EST-002):

- verificar existencia de función y grants;
- simular JWT / empresa en entorno controlado;
- asserts de policies asociadas.

---

## Relación con otras capas

| Tema | Documento |
|------|-----------|
| Tablas, RLS, índices | [EST-002](./EST-002-base-de-datos.md) |
| Nomenclatura | [EST-001](./EST-001-nomenclatura-tecnica.md) |
| Supabase / PostgREST | [EST-006](./EST-006-supabase.md) |
| Mappers y errores TS | [EST-004](./EST-004-typescript.md) |
| Zonas protegidas IA | [EST-008](./EST-008-ia.md) |

---

## Checklist de cierre

- [ ] RPC con verbo español (`listar_`, `obtener_`, `guardar_`, …).
- [ ] Parámetros `p_`, variables `v_`, constantes `c_`.
- [ ] `set search_path` explícito en toda función.
- [ ] `SECURITY DEFINER` justificado, mínimo y con `revoke`/`grant` correctos.
- [ ] Migración transaccional con encabezado de fase y timeouts locales.
- [ ] Errores con `message` en español orientado a RRHH.
- [ ] `notify pgrst, 'reload schema'` tras cambios de esquema expuesto.
- [ ] Sin relajar RLS; empresa resuelta por JWT, no por parámetro confiable solo.
- [ ] Smoke test o spec SQL asociado cuando el riesgo lo amerite.
- [ ] Documento de módulo/fase actualizado en `docs/codex/modulos/`.
