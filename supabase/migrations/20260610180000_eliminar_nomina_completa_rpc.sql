-- =============================================================================
-- 20260610180000_eliminar_nomina_completa_rpc.sql
--
-- Contexto:
--   Tras habilitar el hard-delete de nóminas (migración previa
--   `20260610170000`), se detectó que el simple DELETE de `nomina_periodo`
--   solo limpia las tablas hijas con `on delete cascade`
--   (segmento_nomina, movimiento_nomina, incidencia_nomina,
--   evento_auditoria_nomina). Quedan huérfanos:
--
--     • `nomina_calculo_periodo` (la FK `nomina_periodo.id_calculo_periodo_vigente`
--       es `on delete set null` — apunta hacia el cálculo, NO al revés).
--     • Hijos del cálculo en cascade desde `nomina_calculo_periodo`:
--       `nomina_calculo_trabajador`, `nomina_calculo_concepto`,
--       `nomina_calculo_issue`, `nomina_calculo_trazabilidad`,
--       `nomina_calculo_parametro`.
--
-- Solución:
--   RPC `eliminar_nomina_completa(p_nomina_id uuid)` que ejecuta la limpieza
--   atómica completa con:
--     - Tenant scope (id_empresa = current_user_empresa_id()).
--     - Espejo server-side de `puedeEliminar()` (estado eliminable).
--     - Bloqueo si existen `nomina_liquidacion_periodo` o
--       `nomina_preparacion` referenciando los cálculos del período
--       (datos productivos: no deben evaporarse silenciosamente).
--     - Limpieza de auto-referencia `reemplazado_por` para permitir el
--       DELETE multi-fila sin choque de FK self.
--     - DELETE de todos los `nomina_calculo_periodo`
--       para (id_empresa, periodo) — cascade limpia trabajador/concepto/
--       issue/trazabilidad/parametro.
--     - DELETE final de `nomina_periodo` — cascade limpia
--       segmentos/movimientos/incidencias/eventos.
--   Retorna `jsonb` con un resumen de lo eliminado para diagnóstico.
--
-- Privilegios:
--   `security definer`: las RLS de `nomina_calculo_periodo` y sus hijos NO
--   declaran policy DELETE para `authenticated` (solo SELECT/INSERT/UPDATE).
--   Esta función es la única vía oficial para limpiar el árbol completo, así
--   que se ejecuta como su owner. Toda la autorización vive DENTRO de la
--   función:
--     1. tenant check explícito,
--     2. estado-eliminable check,
--     3. bloqueos por liquidaciones y preparaciones.
--   GRANT EXECUTE al rol `authenticated`.
--
-- Idempotente: `create or replace function`.
-- =============================================================================

create or replace function public.eliminar_nomina_completa(p_nomina_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_nomina       record;
  v_empresa_user integer;
  v_calc_borr    integer := 0;
  v_seg_borr     integer := 0;
  v_mov_borr     integer := 0;
  v_inc_borr     integer := 0;
begin
  -- 1) Empresa activa del usuario llamador (definer ⇒ leemos desde el helper
  --    estándar del proyecto, que internamente usa auth.uid()).
  v_empresa_user := public.current_user_empresa_id();
  if v_empresa_user is null then
    raise exception 'Sin empresa activa para el usuario actual.' using errcode = '28000';
  end if;

  -- 2) Cargar la cabecera y lockear la fila.
  select id, id_empresa, periodo, estado
  into v_nomina
  from public.nomina_periodo
  where id = p_nomina_id
  for update;

  if not found then
    raise exception 'Nómina no encontrada (id=%).', p_nomina_id using errcode = 'P0002';
  end if;

  -- 3) Tenant scope: el usuario solo puede eliminar nóminas de su empresa.
  if v_nomina.id_empresa <> v_empresa_user then
    raise exception 'Sin permisos para eliminar esta nómina (otra empresa).' using errcode = '42501';
  end if;

  -- 4) Estado eliminable: espejo server-side de `puedeEliminar()` en
  --    src/app/features/nomina-mensual/rules/admin-nominas.rules.ts.
  if v_nomina.estado not in ('borrador', 'dotacion_generada', 'en_revision', 'anulada') then
    raise exception
      'No se puede eliminar una nómina en estado "%". Solo se permite eliminar borradores, nóminas con dotación generada, en revisión o anuladas. Reabre primero las cerradas para corregir.',
      v_nomina.estado
      using errcode = 'P0001';
  end if;

  -- 5) Bloquear si hay liquidaciones generadas para (empresa, periodo).
  if exists (
    select 1
    from public.nomina_liquidacion_periodo l
    join public.nomina_calculo_periodo c on c.id_calculo_periodo = l.id_calculo_periodo
    where c.id_empresa = v_nomina.id_empresa
      and c.periodo    = v_nomina.periodo
  ) then
    raise exception
      'No se puede eliminar: existen liquidaciones generadas para % %. Anula primero las liquidaciones oficiales.',
      v_nomina.id_empresa, v_nomina.periodo
      using errcode = 'P0001';
  end if;

  -- 6) Bloquear si alguna nomina_preparacion referencia cálculos de este período.
  if to_regclass('public.nomina_preparacion') is not null then
    if exists (
      select 1
      from public.nomina_preparacion p
      join public.nomina_calculo_periodo c on c.id_calculo_periodo = p.id_calculo_origen
      where c.id_empresa = v_nomina.id_empresa
        and c.periodo    = v_nomina.periodo
    ) then
      raise exception
        'No se puede eliminar: existen preparaciones de nómina referenciando los cálculos de % %.',
        v_nomina.id_empresa, v_nomina.periodo
        using errcode = 'P0001';
    end if;
  end if;

  -- 7) Romper auto-referencia `reemplazado_por` para permitir DELETE multi-fila.
  update public.nomina_calculo_periodo
  set reemplazado_por = null
  where id_empresa = v_nomina.id_empresa
    and periodo    = v_nomina.periodo
    and reemplazado_por is not null;

  -- 8) Borrar cálculos asociados (cascade limpia trabajador/concepto/issue/
  --    trazabilidad/parametro).
  with d as (
    delete from public.nomina_calculo_periodo
    where id_empresa = v_nomina.id_empresa
      and periodo    = v_nomina.periodo
    returning 1
  )
  select count(*) into v_calc_borr from d;

  -- 9) Contar dependencias antes del DELETE final (sólo para reporte).
  select count(*) into v_seg_borr from public.segmento_nomina    where id_nomina_periodo = p_nomina_id;
  select count(*) into v_mov_borr from public.movimiento_nomina  where id_nomina_periodo = p_nomina_id;
  select count(*) into v_inc_borr from public.incidencia_nomina  where id_nomina_periodo = p_nomina_id;

  -- 10) Borrar la nómina (cascade limpia segmentos/movimientos/incidencias/
  --     eventos de auditoría).
  delete from public.nomina_periodo where id = p_nomina_id;

  return jsonb_build_object(
    'ok', true,
    'nomina_id', p_nomina_id,
    'empresa_id', v_nomina.id_empresa,
    'periodo', v_nomina.periodo,
    'estado_previo', v_nomina.estado,
    'calculos_borrados', v_calc_borr,
    'segmentos_borrados', v_seg_borr,
    'movimientos_borrados', v_mov_borr,
    'incidencias_borradas', v_inc_borr
  );
end;
$fn$;

revoke all on function public.eliminar_nomina_completa(uuid) from public;
grant execute on function public.eliminar_nomina_completa(uuid) to authenticated;

comment on function public.eliminar_nomina_completa(uuid) is
  'Hard-delete atómico de una nómina y todo lo derivado: snapshots de cálculo, '
  'trabajadores/conceptos/issues/trazabilidad/parámetros del cálculo, segmentos, '
  'movimientos, incidencias y eventos de auditoría. Bloquea si hay liquidaciones '
  'oficiales o preparaciones que referencian los cálculos del período. Tenant '
  'scope por current_user_empresa_id() y estado eliminable espejo de '
  'puedeEliminar() en admin-nominas.rules.ts. Definer porque las RLS de los '
  'snapshots no incluyen DELETE para authenticated.';
