-- =====================================================================
-- NOM-ADMIN-OPS-F04 - Preview de creación de nómina
-- =====================================================================
-- Fase F04 del roadmap docs/codex/modulos/nomina-mensual/roadmap-admin-generador-operativo-100.md.
-- Depende de F01 (cimientos canónicos), F02 (auditoría + RLS), F03 (plantillas).
--
-- Objetivo
--   Exponer una RPC de solo lectura que clasifica al universo de
--   trabajadores en INCLUIDOS / EXCLUIDOS / CONFLICTOS para una nómina
--   mensual antes de confirmar su creación. El resultado incluye un
--   `fingerprint` determinista que F05 usará para detectar cambios entre
--   preview y confirmación.
--
-- Cambios
--   1. RPC `previsualizar_creacion_nomina(p_periodo, p_tipo)` SECURITY
--      INVOKER. Empresa resuelta vía `current_user_empresa_id()` (RLS).
--      Solo soporta tipo `mensual` en piloto: otros tipos retornan error.
--   2. Lógica de inclusión: persona ACTIVA + apta para remuneraciones +
--      contrato vigente en la empresa que intersecta el rango de la nómina.
--   3. Lógica de exclusión: persona no apta, persona inactiva, sin
--      contrato vigente — con motivo humano por fila.
--   4. Lógica de conflictos: nómina liquidación legal ya existente para
--      (empresa, periodo) no anulada.
--   5. `fingerprint`: md5 sobre (empresa, periodo, tipo, ids incluidos
--      ordenados, total excluidos, total conflictos). Determinista para
--      el mismo universo en el mismo instante.
--
-- No toca: motor de cálculo, liquidaciones productivas, estilos globales.
-- =====================================================================

begin;

set local lock_timeout = '5s';
set local statement_timeout = '120s';

select pg_advisory_xact_lock(hashtext('NOM-ADMIN-OPS-F04'));


-- ---------------------------------------------------------------------
-- 1. RPC previsualizar_creacion_nomina
-- ---------------------------------------------------------------------

drop function if exists public.previsualizar_creacion_nomina(text, text);

create or replace function public.previsualizar_creacion_nomina(
  p_periodo text,
  p_tipo text default 'mensual'
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_id_empresa integer;
  v_empresa_nombre text;
  v_plantilla public.nomina_plantilla_ciclo%rowtype;
  v_fecha_inicio date;
  v_fecha_fin date;
  v_codigo_ciclo text;
  v_naturaleza text := 'liquidacion_legal';
  v_total_incluidos integer := 0;
  v_total_excluidos integer := 0;
  v_total_conflictos integer := 0;
  v_incluidos jsonb;
  v_excluidos jsonb;
  v_conflictos jsonb;
  v_ids_incluidos integer[];
  v_fingerprint text;
  v_puede_crear boolean;
begin
  if p_periodo is null or p_periodo !~ '^[0-9]{4}-(0[1-9]|1[0-2])$' then
    raise exception 'previsualizar_creacion_nomina: período inválido (esperado YYYY-MM): %', p_periodo
      using errcode = '22023';
  end if;

  if p_tipo is null or p_tipo <> 'mensual' then
    raise exception 'previsualizar_creacion_nomina: solo se admite tipo mensual en F04 (recibido %)', p_tipo
      using errcode = '22023';
  end if;

  v_id_empresa := public.current_user_empresa_id();
  if v_id_empresa is null then
    raise exception 'previsualizar_creacion_nomina: sin empresa activa en la sesión'
      using errcode = '42501';
  end if;

  select e.razon_social
  into v_empresa_nombre
  from public.empresa e
  where e.id_empresa = v_id_empresa;

  -- Plantilla MES activa para la empresa (F01/F03 garantiza una por empresa).
  select *
  into v_plantilla
  from public.nomina_plantilla_ciclo
  where id_empresa = v_id_empresa
    and codigo = 'MES'
    and activo
  order by version desc
  limit 1;

  if not found then
    raise exception 'previsualizar_creacion_nomina: la empresa % no tiene plantilla mensual MES activa', v_id_empresa
      using errcode = 'P0002';
  end if;

  v_fecha_inicio := to_date(p_periodo || '-01', 'YYYY-MM-DD');
  v_fecha_fin := (v_fecha_inicio + interval '1 month - 1 day')::date;
  v_codigo_ciclo := p_periodo || '-MES';

  -- ---------- Universo de trabajadores ----------
  -- Tomamos el contrato más reciente por persona en la empresa cuyo rango
  -- intersecta el período. Si la persona no tiene contrato que intersecte,
  -- se clasifica como excluido por "sin contrato vigente".
  with universo as (
    select
      p.id_persona,
      p.rut,
      p.dv,
      p.nombres,
      p.apellido_paterno,
      p.apellido_materno,
      p.estado as estado_persona,
      p.apto_para_remuneraciones,
      p.estado_ficha,
      ct.id_contrato,
      ct.estado as estado_contrato,
      ct.fecha_inicio as contrato_fecha_inicio,
      ct.fecha_termino as contrato_fecha_termino,
      ct.cargo,
      case
        when p.estado <> 'ACTIVO' then 'persona_inactiva'
        when not p.apto_para_remuneraciones then 'ficha_no_apta'
        when ct.id_contrato is null then 'sin_contrato_vigente'
        when ct.estado <> 'ACTIVO' then 'contrato_no_activo'
        else null
      end as motivo_exclusion
    from public.persona p
    left join lateral (
      select c.*
      from public.contrato c
      where c.id_persona = p.id_persona
        and c.id_empresa = v_id_empresa
        and c.fecha_inicio <= v_fecha_fin
        and (c.fecha_termino is null or c.fecha_termino >= v_fecha_inicio)
      order by c.fecha_inicio desc, c.id_contrato desc
      limit 1
    ) ct on true
    where exists (
      select 1
      from public.contrato c2
      where c2.id_persona = p.id_persona
        and c2.id_empresa = v_id_empresa
    )
  ),
  incluidos_cte as (
    select
      id_persona,
      rut || '-' || dv as rut_completo,
      trim(both ' ' from
        nombres || ' ' || apellido_paterno
        || coalesce(' ' || apellido_materno, '')
      ) as nombre_completo,
      cargo
    from universo
    where motivo_exclusion is null
    order by apellido_paterno, apellido_materno nulls last, nombres, id_persona
  ),
  excluidos_cte as (
    select
      id_persona,
      rut || '-' || dv as rut_completo,
      trim(both ' ' from
        nombres || ' ' || apellido_paterno
        || coalesce(' ' || apellido_materno, '')
      ) as nombre_completo,
      motivo_exclusion as motivo,
      case motivo_exclusion
        when 'persona_inactiva' then 'Persona inactiva en el período'
        when 'ficha_no_apta' then 'Ficha no apta para remuneraciones'
        when 'sin_contrato_vigente' then 'Sin contrato vigente en el período'
        when 'contrato_no_activo' then 'Contrato no activo en el período'
        else 'Excluida por validaciones'
      end as motivo_humano
    from universo
    where motivo_exclusion is not null
    order by motivo_exclusion, apellido_paterno, nombres, id_persona
  )
  select
    coalesce(jsonb_agg(jsonb_build_object(
      'idPersona', id_persona,
      'rut', rut_completo,
      'nombre', nombre_completo,
      'cargo', cargo
    )), '[]'::jsonb),
    array_remove(array_agg(id_persona order by id_persona), null)
  into v_incluidos, v_ids_incluidos
  from incluidos_cte;

  select
    coalesce(jsonb_agg(jsonb_build_object(
      'idPersona', id_persona,
      'rut', rut_completo,
      'nombre', nombre_completo,
      'motivo', motivo,
      'motivoHumano', motivo_humano
    )), '[]'::jsonb)
  into v_excluidos
  from excluidos_cte;

  v_total_incluidos := coalesce(array_length(v_ids_incluidos, 1), 0);
  select jsonb_array_length(v_excluidos) into v_total_excluidos;

  -- ---------- Conflictos ----------
  -- Solo evaluamos duplicidad legal en piloto. Otras fuentes de conflicto
  -- (plantilla inválida, calendario faltante) se cubren en fases futuras.
  with conflictos_cte as (
    select
      'duplicidad_nomina'::text as motivo,
      'Ya existe una nómina mensual para este período' as motivo_humano,
      jsonb_build_object(
        'idNominaPeriodo', np.id,
        'estado', np.estado,
        'codigoCiclo', np.codigo_ciclo
      ) as detalle
    from public.nomina_periodo np
    where np.id_empresa = v_id_empresa
      and np.periodo = p_periodo
      and np.naturaleza = v_naturaleza
      and np.estado <> 'anulada'
  )
  select
    coalesce(jsonb_agg(jsonb_build_object(
      'motivo', motivo,
      'motivoHumano', motivo_humano,
      'detalle', detalle
    )), '[]'::jsonb)
  into v_conflictos
  from conflictos_cte;

  select jsonb_array_length(v_conflictos) into v_total_conflictos;

  v_puede_crear := (v_total_conflictos = 0) and (v_total_incluidos > 0);

  -- ---------- Fingerprint determinista ----------
  -- md5 incluye empresa, periodo, tipo, ids incluidos en orden y conteos.
  -- Si cambia cualquier insumo entre preview y confirmación, F05 lo detecta.
  v_fingerprint := md5(
    v_id_empresa::text
    || '|' || p_periodo
    || '|' || p_tipo
    || '|' || coalesce(array_to_string(v_ids_incluidos, ','), '')
    || '|' || v_total_excluidos::text
    || '|' || v_total_conflictos::text
  );

  return jsonb_build_object(
    'periodo', p_periodo,
    'tipo', p_tipo,
    'naturaleza', v_naturaleza,
    'idEmpresa', v_id_empresa,
    'empresaNombre', v_empresa_nombre,
    'codigoCiclo', v_codigo_ciclo,
    'fechaInicio', v_fecha_inicio,
    'fechaFin', v_fecha_fin,
    'plantillaCicloId', v_plantilla.id,
    'incluidos', v_incluidos,
    'excluidos', v_excluidos,
    'conflictos', v_conflictos,
    'totales', jsonb_build_object(
      'incluidos', v_total_incluidos,
      'excluidos', v_total_excluidos,
      'conflictos', v_total_conflictos
    ),
    'puedeCrear', v_puede_crear,
    'fingerprint', v_fingerprint,
    'generadoEn', now()
  );
end;
$$;

comment on function public.previsualizar_creacion_nomina(text, text) is
  'Previsualiza la creación de una nómina mensual: clasifica trabajadores en incluidos/excluidos/conflictos y emite un fingerprint determinista. Solo lectura; no escribe. Empresa resuelta por JWT. NOM-ADMIN-OPS-F04.';

revoke all on function public.previsualizar_creacion_nomina(text, text) from public;
grant execute on function public.previsualizar_creacion_nomina(text, text) to authenticated, service_role;


commit;
