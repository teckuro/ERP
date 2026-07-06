-- =============================================================================
-- 20260610200500_haberdescuento_bridge_fix_inline.sql
--
-- Hotfix de la migración 20260610200000:
--   La función auxiliar `_fn_hd_to_mr_row` con RETURNS TABLE + RETURN NEXT
--   no producía resultados utilizables en el INSERT lateral ni en el
--   trigger (se sospecha colisión sutil de nombres entre OUT params y
--   columnas de tablas referenciadas, y/o la composición function-in-trigger
--   con security definer perdía contexto al evaluar la subfunción).
--
--   Resultado observado tras la migración previa: 0 filas insertadas en
--   `movimiento_recurrente` aunque haberdescuento_persona contiene filas
--   migrables (caso real: id_asignacion=1, persona=2, concepto=5, monto=
--   20000, MENSUAL, contrato=2 → empresa=1).
--
-- Solución:
--   - Reemplazar el trigger por una función con SQL inline (sin función
--     auxiliar).
--   - Reemplazar el backfill por un INSERT … SELECT inline con joins
--     explícitos a `contrato` y `concepto`.
--   - Drop de `_fn_hd_to_mr_row` (queda obsoleta).
--
-- Idempotente: drop/create + WHERE NOT EXISTS.
-- =============================================================================

set search_path = public;

-- ---------------------------------------------------------------------------
-- 1. Limpieza de la versión previa
-- ---------------------------------------------------------------------------

drop trigger if exists trg_haberdescuento_persona_sync on public.haberdescuento_persona;
drop function if exists public.tg_haberdescuento_persona_sync();
drop function if exists public._fn_hd_to_mr_row(public.haberdescuento_persona);


-- ---------------------------------------------------------------------------
-- 2. Trigger nuevo: lógica inline (sin función auxiliar)
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

  -- Resolver empresa y código concepto.
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

  -- Si la fila no es migrable, eliminamos la copia previa (si existía) y
  -- salimos sin tocar nada más.
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
    id_haberdescuento_origen
  ) values (
    v_empresa, new.id_persona, v_codigo, v_categoria,
    v_monto, v_cantidad, v_unidad, v_frecuencia,
    v_desde, v_hasta, v_estado, v_glosa,
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

create trigger trg_haberdescuento_persona_sync
after insert or update or delete on public.haberdescuento_persona
for each row
execute function public.tg_haberdescuento_persona_sync();


-- ---------------------------------------------------------------------------
-- 3. Backfill idempotente con joins inline
-- ---------------------------------------------------------------------------

insert into public.movimiento_recurrente (
  id_empresa, id_persona, tipo, categoria,
  monto, cantidad, unidad, frecuencia,
  activo_desde, activo_hasta, estado, glosa,
  id_haberdescuento_origen
)
select
  c.id_empresa,
  hd.id_persona,
  cc.codigo,
  case upper(coalesce(cc.tipo, ''))
    when 'HABER'            then 'haber'
    when 'DESCUENTO'        then 'descuento'
    when 'APORTE_EMPLEADOR' then 'informativo'
    else                         'informativo'
  end as categoria,
  case when hd.porcentaje is null then hd.monto else null end as monto,
  case when hd.porcentaje is null then null else hd.porcentaje end as cantidad,
  case when hd.porcentaje is null then null else 'porcentaje' end as unidad,
  case upper(coalesce(hd.periodicidad, 'MENSUAL'))
    when 'MENSUAL'   then 'mensual'
    when 'QUINCENAL' then 'quincenal'
  end as frecuencia,
  coalesce(hd.vigencia_inicio, current_date) as activo_desde,
  hd.vigencia_fin as activo_hasta,
  case when hd.estado is distinct from false then 'activo' else 'finalizado' end as estado,
  hd.observacion as glosa,
  hd.id_asignacion
from public.haberdescuento_persona hd
join public.contrato c  on c.id_contrato  = hd.id_contrato
join public.concepto cc on cc.id_concepto = hd.id_concepto
where upper(coalesce(hd.periodicidad, 'MENSUAL')) in ('MENSUAL', 'QUINCENAL')
  and not exists (
    select 1 from public.movimiento_recurrente mr
     where mr.id_haberdescuento_origen = hd.id_asignacion
  );

notify pgrst, 'reload schema';
