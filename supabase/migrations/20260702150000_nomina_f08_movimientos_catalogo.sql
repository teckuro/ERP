-- =============================================================================
-- 20260702150000_nomina_f08_movimientos_catalogo.sql
-- NOM-ADMIN-OPS-F08 — Catálogo y movimientos consistentes (núcleo).
--
-- Objetivo del roadmap: eliminar tipos libres de movimiento; todo concepto que
-- entra al cálculo debe existir en el catálogo `concepto` con reglas conocidas.
--
-- Inventario Anexo C (ejecutado 2026-07-02 en PROD):
--   movimiento_nomina:     MOVILIZACION (1 fila, origen recurrente) → mapea 1:1.
--   movimiento_recurrente: MOVILIZACION → mapea 1:1.
--   Sin strings huérfanos: no se requiere fallback «Otro» ni mapeo_pendiente.
--
-- Diseño:
--   1. `id_concepto` en movimiento_recurrente y movimiento_nomina (FK a
--      concepto, ON DELETE RESTRICT). `tipo` (text) se conserva como snapshot
--      del código del concepto usado — regla F08: «un movimiento aplicado
--      conserva el snapshot del concepto utilizado».
--   2. Backfill por match exacto de código (upper/trim).
--   3. Puente HD→MR propaga id_concepto.
--   4. Trigger BEFORE INSERT en movimiento_nomina:
--      - categoría haber/descuento → concepto obligatorio (id o código
--        resoluble) y vigente; el tipo se normaliza al código canónico.
--      - categoría ausencia/informativo → tipo restringido a whitelist
--        (AUSENCIA / INFORMATIVO) o concepto de catálogo.
--      Solo INSERT: los históricos no se reescriben (política C.3).
-- =============================================================================

set search_path = public;

-- ---------------------------------------------------------------------------
-- 1. Columnas id_concepto
-- ---------------------------------------------------------------------------

alter table public.movimiento_recurrente
  add column if not exists id_concepto integer references public.concepto(id_concepto) on delete restrict;

alter table public.movimiento_nomina
  add column if not exists id_concepto integer references public.concepto(id_concepto) on delete restrict;

create index if not exists ix_movimiento_recurrente_concepto
  on public.movimiento_recurrente (id_concepto) where id_concepto is not null;

create index if not exists ix_movimiento_nomina_concepto
  on public.movimiento_nomina (id_concepto) where id_concepto is not null;

comment on column public.movimiento_nomina.id_concepto is
  'F08: concepto del catálogo que originó el movimiento. `tipo` conserva el snapshot del código.';
comment on column public.movimiento_recurrente.id_concepto is
  'F08: concepto del catálogo asociado a la regla recurrente.';

-- ---------------------------------------------------------------------------
-- 2. Backfill por código (Anexo C: mapeo determinista)
-- ---------------------------------------------------------------------------

update public.movimiento_recurrente mr
   set id_concepto = cc.id_concepto
  from public.concepto cc
 where mr.id_concepto is null
   and upper(trim(mr.tipo)) = upper(trim(cc.codigo));

update public.movimiento_nomina m
   set id_concepto = cc.id_concepto
  from public.concepto cc
 where m.id_concepto is null
   and upper(trim(m.tipo)) = upper(trim(cc.codigo));

-- ---------------------------------------------------------------------------
-- 3. Puente HD→MR: propagar id_concepto
-- ---------------------------------------------------------------------------

create or replace function public.tg_haberdescuento_persona_sync()
returns trigger
language plpgsql
security definer
set search_path = public
as $tg$
declare
  v_empresa     integer;
  v_codigo      text;
  v_tipo_con    text;
  v_categoria   text;
  v_frecuencia  text;
  v_monto       numeric(14,2);
  v_cantidad    numeric(14,4);
  v_unidad      text;
  v_desde       date;
  v_hasta       date;
  v_estado      text;
  v_glosa       text;
  v_porc        boolean;
begin
  if tg_op = 'DELETE' then
    delete from public.movimiento_recurrente
     where id_haberdescuento_origen = old.id_asignacion;
    return old;
  end if;

  select c.id_empresa into v_empresa
    from public.contrato c
   where c.id_contrato = new.id_contrato;

  select cc.codigo, cc.tipo into v_codigo, v_tipo_con
    from public.concepto cc
   where cc.id_concepto = new.id_concepto;

  v_frecuencia := case upper(coalesce(new.periodicidad, 'MENSUAL'))
                    when 'MENSUAL'   then 'mensual'
                    when 'QUINCENAL' then 'quincenal'
                    else                  null
                  end;

  if new.id_contrato is null
     or v_empresa is null
     or v_codigo  is null
     or v_frecuencia is null
  then
    delete from public.movimiento_recurrente
     where id_haberdescuento_origen = new.id_asignacion;
    return new;
  end if;

  v_categoria := case upper(coalesce(v_tipo_con, ''))
                   when 'HABER'            then 'haber'
                   when 'DESCUENTO'        then 'descuento'
                   when 'APORTE_EMPLEADOR' then 'informativo'
                   else                          'informativo'
                 end;

  v_porc     := new.porcentaje is not null;
  v_monto    := case when v_porc then null else new.monto end;
  v_cantidad := case when v_porc then new.porcentaje else null end;
  v_unidad   := case when v_porc then 'porcentaje' else null end;
  v_desde    := coalesce(new.vigencia_inicio, current_date);
  v_hasta    := new.vigencia_fin;
  v_estado   := case when new.estado is distinct from false then 'activo' else 'finalizado' end;
  v_glosa    := new.observacion;

  insert into public.movimiento_recurrente (
    id_empresa, id_persona, tipo, categoria,
    monto, cantidad, unidad, frecuencia,
    activo_desde, activo_hasta, estado, glosa,
    id_haberdescuento_origen, id_concepto
  ) values (
    v_empresa, new.id_persona, v_codigo, v_categoria,
    v_monto, v_cantidad, v_unidad, v_frecuencia,
    v_desde, v_hasta, v_estado, v_glosa,
    new.id_asignacion, new.id_concepto
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
    id_concepto  = excluded.id_concepto,
    updated_at   = now();

  return new;
end;
$tg$;

revoke all on function public.tg_haberdescuento_persona_sync() from public;

-- Backfill MR desde origen HD para filas ya puenteadas sin concepto.
update public.movimiento_recurrente mr
   set id_concepto = hd.id_concepto
  from public.haberdescuento_persona hd
 where mr.id_haberdescuento_origen = hd.id_asignacion
   and mr.id_concepto is null;

-- ---------------------------------------------------------------------------
-- 4. Guardia de inserción en movimiento_nomina (F08: sin tipos arbitrarios)
-- ---------------------------------------------------------------------------

create or replace function public.tg_movimiento_nomina_concepto_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $tg$
declare
  v_concepto public.concepto;
begin
  -- Resolver concepto: por id explícito o por código exacto.
  if new.id_concepto is not null then
    select * into v_concepto
      from public.concepto
     where id_concepto = new.id_concepto;
    if not found then
      raise exception 'F08: el concepto indicado no existe en el catálogo.'
        using errcode = '23503';
    end if;
  else
    select * into v_concepto
      from public.concepto
     where upper(trim(codigo)) = upper(trim(new.tipo));
    if found then
      new.id_concepto := v_concepto.id_concepto;
    end if;
  end if;

  if v_concepto.id_concepto is not null then
    -- Snapshot canónico del código + vigencia del interruptor de catálogo.
    new.tipo := v_concepto.codigo;
    if v_concepto.vigente is distinct from true then
      raise exception 'F08: el concepto «%» no está vigente en el catálogo y no puede agregarse a una nómina nueva.', v_concepto.codigo
        using errcode = '23514';
    end if;
    return new;
  end if;

  -- Sin concepto: solo se permiten registros operativos no monetarios con
  -- tipo de la whitelist (ausencias / informativos genéricos).
  if new.categoria in ('ausencia', 'informativo')
     and upper(trim(new.tipo)) in ('AUSENCIA', 'INFORMATIVO')
  then
    new.tipo := upper(trim(new.tipo));
    return new;
  end if;

  raise exception 'F08: el tipo «%» no corresponde a un concepto del catálogo; selecciona un concepto autorizado.', new.tipo
    using errcode = '23514';
end;
$tg$;

revoke all on function public.tg_movimiento_nomina_concepto_guard() from public;

drop trigger if exists trg_movimiento_nomina_concepto_guard on public.movimiento_nomina;
create trigger trg_movimiento_nomina_concepto_guard
  before insert on public.movimiento_nomina
  for each row
  execute function public.tg_movimiento_nomina_concepto_guard();

comment on function public.tg_movimiento_nomina_concepto_guard() is
  'F08: bloquea INSERT de movimientos con tipo arbitrario; exige concepto de catálogo vigente (o whitelist ausencia/informativo) y normaliza el snapshot del código. Históricos no se reescriben.';

notify pgrst, 'reload schema';
