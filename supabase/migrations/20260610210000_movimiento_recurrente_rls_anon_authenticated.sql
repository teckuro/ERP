-- =============================================================================
-- 20260610210000_movimiento_recurrente_rls_anon_authenticated.sql
--
-- Contexto:
--   La policy `movimiento_recurrente_all` (migración F2,
--   20260604180000_nomina_rebuild_admin_generador.sql) está acotada a:
--     `TO authenticated USING (id_empresa = current_user_empresa_id())`.
--   El frontend Angular del ERP usa la `anon` publishable key (no JWT con
--   `app_metadata.id_empresa`). La policy nunca aplica al rol del caller →
--   RLS niega por defecto y CUALQUIER INSERT/UPDATE/DELETE devuelve 42501.
--
--   Esto se manifestó como dos bugs hoy:
--     • La nómina v2 nunca pudo poblar `movimiento_recurrente` desde el
--       trigger HD → MR (migración 20260610200500).
--     • Un INSERT directo desde anon con id_empresa=1 también fallaba con
--       `new row violates row-level security policy`.
--
-- Solución:
--   Alinear `movimiento_recurrente` con el patrón uniforme del ERP para las
--   tablas write_tables (`empleados_alta_*` en
--   bd/base/v11/partes/08_seguridad_rls.sql): policies separadas por
--   operación con `USING (true)` / `WITH CHECK (true)` para `anon` y
--   `authenticated`. El filtro por empresa lo aplica la app en cliente
--   (`NominaPeriodoService.resolverEmpresaActiva()` ya cumple ese rol).
--
--   La policy multi-empresa server-side queda pendiente de la fase real de
--   multi-tenant (cuando se emitan JWT con `app_metadata.id_empresa` desde
--   un login Supabase Auth). Hasta entonces, la cobertura multi-tenant es
--   responsabilidad client-side, igual que en empleados, contratos,
--   parametros, etc.
--
--   Tras abrir las policies se re-ejecuta el backfill HD → MR (idempotente
--   por `id_haberdescuento_origen` único parcial).
-- =============================================================================

set search_path = public;

-- ---------------------------------------------------------------------------
-- 1. Reemplazar la policy multi-empresa por policies abiertas por operación
-- ---------------------------------------------------------------------------

drop policy if exists movimiento_recurrente_all on public.movimiento_recurrente;

grant select, insert, update, delete on public.movimiento_recurrente to anon, authenticated;

drop policy if exists mov_recurrente_select on public.movimiento_recurrente;
create policy mov_recurrente_select on public.movimiento_recurrente
  for select to anon, authenticated using (true);

drop policy if exists mov_recurrente_insert on public.movimiento_recurrente;
create policy mov_recurrente_insert on public.movimiento_recurrente
  for insert to anon, authenticated with check (true);

drop policy if exists mov_recurrente_update on public.movimiento_recurrente;
create policy mov_recurrente_update on public.movimiento_recurrente
  for update to anon, authenticated using (true) with check (true);

drop policy if exists mov_recurrente_delete on public.movimiento_recurrente;
create policy mov_recurrente_delete on public.movimiento_recurrente
  for delete to anon, authenticated using (true);


-- ---------------------------------------------------------------------------
-- 2. Re-ejecutar backfill HD → MR (idempotente por UNIQUE parcial)
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
  end,
  case when hd.porcentaje is null then hd.monto else null end,
  case when hd.porcentaje is null then null else hd.porcentaje end,
  case when hd.porcentaje is null then null else 'porcentaje' end,
  case upper(coalesce(hd.periodicidad, 'MENSUAL'))
    when 'MENSUAL'   then 'mensual'
    when 'QUINCENAL' then 'quincenal'
  end,
  coalesce(hd.vigencia_inicio, current_date),
  hd.vigencia_fin,
  case when hd.estado is distinct from false then 'activo' else 'finalizado' end,
  hd.observacion,
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
