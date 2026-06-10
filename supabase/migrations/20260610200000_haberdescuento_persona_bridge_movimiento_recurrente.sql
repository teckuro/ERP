-- =============================================================================
-- 20260610200000_haberdescuento_persona_bridge_movimiento_recurrente.sql
--
-- Contexto:
--   `haberdescuento_persona` es la tabla LEGACY (v6) que la ficha del
--   trabajador edita para asignar haberes / descuentos persistentes por
--   trabajador. La nómina v2 (rebuild de jun 2026) lee únicamente
--   `movimiento_recurrente` para poblar el tab "Configurados". Resultado:
--   los haberes configurados en la ficha NO aparecen en la nómina hasta
--   que se replican manualmente.
--
--   Caso real reportado (2026-06-10): trabajador 25.050.001-7 con $20.000
--   no imponible (concepto MOVILIZACION) en haberdescuento_persona desde
--   2026-05-01. La ficha lo guarda; la nómina v2 no lo ve.
--
-- Solución (3 piezas atómicas idempotentes):
--   1. Columna `id_haberdescuento_origen` en `movimiento_recurrente` con
--      UNIQUE parcial para trazar el origen y evitar duplicados.
--   2. Backfill: INSERT … SELECT … WHERE NOT EXISTS, mapeando 1-a-1 las
--      filas vigentes (incluye estado=false como 'finalizado').
--   3. Trigger AFTER INSERT/UPDATE/DELETE en `haberdescuento_persona` que
--      mantiene `movimiento_recurrente` sincronizado sin tocar la UI legacy.
--
-- Mapeo HD → MR:
--   id_persona     ← id_persona
--   id_empresa     ← contrato.id_empresa  (resuelto por id_contrato)
--   tipo (text)    ← concepto.codigo
--   categoria      ← {HABER→haber, DESCUENTO→descuento, otro→informativo}
--   monto          ← monto                  (si NOT NULL)
--   cantidad       ← porcentaje             (si porcentaje NOT NULL)
--   unidad         ← 'porcentaje'           (si porcentaje NOT NULL, else NULL)
--   frecuencia     ← {MENSUAL→mensual, QUINCENAL→quincenal, default mensual}
--   activo_desde   ← coalesce(vigencia_inicio, current_date)
--   activo_hasta   ← vigencia_fin
--   estado         ← {true→activo, false→finalizado}
--   glosa          ← observacion
--
-- Reglas de omisión (filas HD que NO se migran):
--   - id_contrato IS NULL          → no podemos resolver empresa.
--   - periodicidad IN ('OCASIONAL','UNICA') → no son recurrentes;
--     pertenecen a `movimiento_nomina` del período concreto.
--
-- Política:
--   - Sentido único: HD → MR. MR NO escribe hacia HD.
--   - La ficha del trabajador (UI legacy) sigue siendo la fuente única de
--     edición. La nómina v2 SOLO lee MR. El usuario no necesita aprender
--     una segunda UI.
--   - `haberdescuento_persona` queda marcada como DEPRECATED en su
--     comentario. NO se elimina ni se cambia su contrato — para hacerlo
--     hace falta refactor de los módulos legacy que la consumen
--     (liquidación SQL fn_generar_liquidacion, entre otros).
--
-- Idempotente: re-ejecutable. UNIQUE parcial + backfill condicional.
-- =============================================================================

set search_path = public;

-- ---------------------------------------------------------------------------
-- 1. Traza de origen en movimiento_recurrente
-- ---------------------------------------------------------------------------

alter table public.movimiento_recurrente
  add column if not exists id_haberdescuento_origen integer
    references public.haberdescuento_persona (id_asignacion) on delete set null;

comment on column public.movimiento_recurrente.id_haberdescuento_origen is
  'Traza la asignación legacy en haberdescuento_persona que originó esta fila. '
  'Mantenido por el trigger sync_haberdescuento_to_movimiento_recurrente. '
  'NULL para filas creadas directamente desde la UI de movimiento_recurrente.';

create unique index if not exists ux_movimiento_recurrente_hd_origen
  on public.movimiento_recurrente (id_haberdescuento_origen)
  where id_haberdescuento_origen is not null;


-- ---------------------------------------------------------------------------
-- 2. Función reutilizable: mapeo HD → MR
--
-- Devuelve una fila "candidata" para insertar/actualizar en MR a partir de
-- una fila de HD. Si la fila no es migrable (sin contrato, periodicidad
-- one-shot, concepto inexistente, etc.) retorna NULL en columnas críticas y
-- el caller la omite.
-- ---------------------------------------------------------------------------

create or replace function public._fn_hd_to_mr_row(hd public.haberdescuento_persona)
returns table (
  id_empresa       integer,
  id_persona       integer,
  tipo             text,
  categoria        text,
  monto            numeric(14,2),
  cantidad         numeric(14,4),
  unidad           text,
  frecuencia       text,
  activo_desde     date,
  activo_hasta     date,
  estado           text,
  glosa            text,
  migrable         boolean
)
language plpgsql
stable
security invoker
set search_path = public
as $fn$
declare
  v_id_empresa integer;
  v_codigo     text;
  v_tipo_concepto text;
  v_categoria  text;
  v_frecuencia text;
  v_porc       boolean;
  v_estado     text;
begin
  -- Resolver empresa por contrato; sin contrato no es migrable.
  if hd.id_contrato is null then
    migrable := false;
    return next;
    return;
  end if;
  select c.id_empresa into v_id_empresa
    from public.contrato c
   where c.id_contrato = hd.id_contrato;
  if v_id_empresa is null then
    migrable := false;
    return next;
    return;
  end if;

  -- Resolver código + tipo del concepto.
  select c.codigo, c.tipo into v_codigo, v_tipo_concepto
    from public.concepto c
   where c.id_concepto = hd.id_concepto;
  if v_codigo is null then
    migrable := false;
    return next;
    return;
  end if;

  -- categoria
  v_categoria := case upper(coalesce(v_tipo_concepto, ''))
                   when 'HABER'            then 'haber'
                   when 'DESCUENTO'        then 'descuento'
                   when 'APORTE_EMPLEADOR' then 'informativo'
                   else                          'informativo'
                 end;

  -- frecuencia: las ocasionales/únicas NO son recurrentes
  v_frecuencia := case upper(coalesce(hd.periodicidad, 'MENSUAL'))
                    when 'MENSUAL'   then 'mensual'
                    when 'QUINCENAL' then 'quincenal'
                    else                  null
                  end;
  if v_frecuencia is null then
    migrable := false;
    return next;
    return;
  end if;

  v_porc := hd.porcentaje is not null;
  v_estado := case when hd.estado is distinct from false then 'activo' else 'finalizado' end;

  id_empresa   := v_id_empresa;
  id_persona   := hd.id_persona;
  tipo         := v_codigo;
  categoria    := v_categoria;
  monto        := case when v_porc then null else hd.monto end;
  cantidad     := case when v_porc then hd.porcentaje else null end;
  unidad       := case when v_porc then 'porcentaje' else null end;
  frecuencia   := v_frecuencia;
  activo_desde := coalesce(hd.vigencia_inicio, current_date);
  activo_hasta := hd.vigencia_fin;
  estado       := v_estado;
  glosa        := hd.observacion;
  migrable     := true;
  return next;
end;
$fn$;


-- ---------------------------------------------------------------------------
-- 3. Backfill idempotente: HD → MR
-- ---------------------------------------------------------------------------

insert into public.movimiento_recurrente (
  id_empresa, id_persona, tipo, categoria,
  monto, cantidad, unidad, frecuencia,
  activo_desde, activo_hasta, estado, glosa,
  id_haberdescuento_origen
)
select
  m.id_empresa, m.id_persona, m.tipo, m.categoria,
  m.monto, m.cantidad, m.unidad, m.frecuencia,
  m.activo_desde, m.activo_hasta, m.estado, m.glosa,
  hd.id_asignacion
from public.haberdescuento_persona hd,
     lateral public._fn_hd_to_mr_row(hd) m
where m.migrable
  and not exists (
    select 1 from public.movimiento_recurrente mr
     where mr.id_haberdescuento_origen = hd.id_asignacion
  );


-- ---------------------------------------------------------------------------
-- 4. Trigger HD → MR (sync continuo)
-- ---------------------------------------------------------------------------

create or replace function public.tg_haberdescuento_persona_sync()
returns trigger
language plpgsql
security definer
set search_path = public
as $tg$
declare
  m record;
begin
  if tg_op = 'DELETE' then
    delete from public.movimiento_recurrente
     where id_haberdescuento_origen = old.id_asignacion;
    return old;
  end if;

  -- INSERT / UPDATE → upsert por id_haberdescuento_origen.
  select * into m from public._fn_hd_to_mr_row(new);

  if not m.migrable then
    -- Si la fila pasó de migrable a no migrable, retira la copia en MR.
    delete from public.movimiento_recurrente
     where id_haberdescuento_origen = new.id_asignacion;
    return new;
  end if;

  insert into public.movimiento_recurrente (
    id_empresa, id_persona, tipo, categoria,
    monto, cantidad, unidad, frecuencia,
    activo_desde, activo_hasta, estado, glosa,
    id_haberdescuento_origen
  ) values (
    m.id_empresa, m.id_persona, m.tipo, m.categoria,
    m.monto, m.cantidad, m.unidad, m.frecuencia,
    m.activo_desde, m.activo_hasta, m.estado, m.glosa,
    new.id_asignacion
  )
  on conflict (id_haberdescuento_origen) where id_haberdescuento_origen is not null
  do update set
    id_empresa   = excluded.id_empresa,
    id_persona   = excluded.id_persona,
    tipo         = excluded.tipo,
    categoria    = excluded.categoria,
    monto        = excluded.monto,
    cantidad     = excluded.cantidad,
    unidad       = excluded.unidad,
    frecuencia   = excluded.frecuencia,
    activo_desde = excluded.activo_desde,
    activo_hasta = excluded.activo_hasta,
    estado       = excluded.estado,
    glosa        = excluded.glosa,
    updated_at   = now();

  return new;
end;
$tg$;

revoke all on function public.tg_haberdescuento_persona_sync() from public;
-- definer → ejecuta como owner; los GRANT no son necesarios para triggers
-- (postgres llama a la función al disparar el trigger sin checks de role).

drop trigger if exists trg_haberdescuento_persona_sync on public.haberdescuento_persona;

create trigger trg_haberdescuento_persona_sync
after insert or update or delete on public.haberdescuento_persona
for each row
execute function public.tg_haberdescuento_persona_sync();


-- ---------------------------------------------------------------------------
-- 5. Deprecación documental
-- ---------------------------------------------------------------------------

comment on table public.haberdescuento_persona is
  'DEPRECATED (2026-06-10): tabla legacy de la ficha del trabajador. '
  'Mantenida por compatibilidad con liquidaciones SQL legacy. La nómina v2 '
  'NO lee de aquí; un trigger AFTER replica los cambios a '
  'movimiento_recurrente (columna id_haberdescuento_origen como traza). '
  'Para los conceptos nuevos, escribir directamente en movimiento_recurrente. '
  'Eliminación pendiente de fase específica que migre los lectores legacy.';


-- ---------------------------------------------------------------------------
-- 6. Notify schema reload (PostgREST)
-- ---------------------------------------------------------------------------

notify pgrst, 'reload schema';
