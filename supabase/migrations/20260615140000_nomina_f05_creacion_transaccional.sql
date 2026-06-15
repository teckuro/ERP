-- =====================================================================
-- NOM-ADMIN-OPS-F05 - Creación transaccional de nómina
-- =====================================================================
-- Fase F05 del roadmap docs/codex/modulos/nomina-mensual/roadmap-admin-generador-operativo-100.md.
-- Depende de F01 (cimientos canónicos), F02 (auditoría + RLS),
-- F03 (plantillas) y F04 (preview).
--
-- Objetivo
--   Crear cabecera + dotación inicial + segmento general + auditoría en
--   una sola transacción server-side. Valida que el `fingerprint` de F04
--   siga vigente (universo y conteos no cambiaron entre preview y
--   confirmación). Retorna ruta de continuación para el Generador.
--
-- Cambios
--   1. RPC `confirmar_creacion_nomina(p_periodo, p_tipo, p_fingerprint)`
--      SECURITY INVOKER. Empresa por JWT.
--   2. Re-ejecuta la evaluación de F04 dentro de la transacción y
--      compara fingerprints. Si difiere, rechaza con 40001 (retry).
--   3. Idempotencia: si ya existe una nómina mensual no anulada para
--      (empresa, periodo), retorna esa nómina sin crear duplicado.
--   4. Inserta cabecera `nomina_periodo` (trigger F01 completa identidad,
--      trigger F02 inserta evento `creada`), segmento "Dotación general"
--      con los trabajador_ids incluidos y transiciona a
--      `dotacion_generada` vía `transicionar_nomina_periodo`.
--   5. Respuesta jsonb: nomina_periodo_id, version_estado, siguiente_paso
--      (`parameters` si hay dotación, `dotacion` si no), incluidos.
--
-- No toca: motor de cálculo, liquidaciones productivas, estilos globales.
-- =====================================================================

begin;

set local lock_timeout = '5s';
set local statement_timeout = '120s';

select pg_advisory_xact_lock(hashtext('NOM-ADMIN-OPS-F05'));


-- ---------------------------------------------------------------------
-- 1. RPC confirmar_creacion_nomina
-- ---------------------------------------------------------------------

drop function if exists public.confirmar_creacion_nomina(text, text, text);

create or replace function public.confirmar_creacion_nomina(
  p_periodo text,
  p_tipo text,
  p_fingerprint text
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_id_empresa integer;
  v_preview jsonb;
  v_fingerprint_vigente text;
  v_puede_crear boolean;
  v_ids_incluidos integer[];
  v_total_incluidos integer;
  v_existente_id uuid;
  v_existente public.nomina_periodo%rowtype;
  v_nueva public.nomina_periodo%rowtype;
  v_estado_destino text;
  v_siguiente_paso text;
  v_total_conflictos integer;
begin
  if p_periodo is null or p_periodo !~ '^[0-9]{4}-(0[1-9]|1[0-2])$' then
    raise exception 'confirmar_creacion_nomina: período inválido (esperado YYYY-MM): %', p_periodo
      using errcode = '22023';
  end if;

  if p_tipo is null or p_tipo <> 'mensual' then
    raise exception 'confirmar_creacion_nomina: solo se admite tipo mensual en F05 (recibido %)', p_tipo
      using errcode = '22023';
  end if;

  if p_fingerprint is null or btrim(p_fingerprint) = '' then
    raise exception 'confirmar_creacion_nomina: fingerprint requerido'
      using errcode = '22023';
  end if;

  v_id_empresa := public.current_user_empresa_id();
  if v_id_empresa is null then
    raise exception 'confirmar_creacion_nomina: sin empresa activa en la sesión'
      using errcode = '42501';
  end if;

  -- ---------- Idempotencia previa ----------
  -- Si ya existe una nómina mensual no anulada para (empresa, periodo),
  -- retornamos esa misma nómina como si fuera la creación exitosa, en
  -- vez de fallar por UNIQUE. Esto cubre reintentos de la UI.
  select * into v_existente
  from public.nomina_periodo
  where id_empresa = v_id_empresa
    and periodo = p_periodo
    and naturaleza = 'liquidacion_legal'
    and estado <> 'anulada'
  limit 1;

  if found then
    v_estado_destino := v_existente.estado;
    v_siguiente_paso := case
      when v_existente.estado = 'borrador' then 'dotacion'
      else 'parameters'
    end;

    return jsonb_build_object(
      'idNominaPeriodo', v_existente.id,
      'estado', v_existente.estado,
      'versionEstado', v_existente.version_estado,
      'codigoCiclo', v_existente.codigo_ciclo,
      'fechaInicio', v_existente.fecha_inicio,
      'fechaFin', v_existente.fecha_fin,
      'siguientePaso', v_siguiente_paso,
      'reutilizada', true
    );
  end if;

  -- ---------- Re-evaluar preview en transacción ----------
  v_preview := public.previsualizar_creacion_nomina(p_periodo, p_tipo);
  v_fingerprint_vigente := v_preview ->> 'fingerprint';
  v_puede_crear := (v_preview ->> 'puedeCrear')::boolean;
  v_total_conflictos := coalesce(
    (v_preview -> 'totales' ->> 'conflictos')::integer,
    0
  );
  v_total_incluidos := coalesce(
    (v_preview -> 'totales' ->> 'incluidos')::integer,
    0
  );

  if v_fingerprint_vigente is null or v_fingerprint_vigente <> p_fingerprint then
    raise exception 'confirmar_creacion_nomina: el universo cambió desde la vista previa, recarga e intenta otra vez'
      using errcode = '40001';
  end if;

  if v_total_conflictos > 0 then
    raise exception 'confirmar_creacion_nomina: hay conflictos pendientes que impiden crear la nómina'
      using errcode = '23514';
  end if;

  if not v_puede_crear then
    raise exception 'confirmar_creacion_nomina: la previsualización no permite crear la nómina'
      using errcode = '23514';
  end if;

  -- ---------- Crear cabecera (trigger F02 emite evento `creada`) ----------
  insert into public.nomina_periodo (
    id_empresa,
    empresa_nombre,
    periodo,
    tipo
  )
  values (
    v_id_empresa,
    v_preview ->> 'empresaNombre',
    p_periodo,
    p_tipo
  )
  returning * into v_nueva;

  -- ---------- Dotación inicial ----------
  -- Reconstruir array de ids desde el JSON del preview vigente.
  select coalesce(array_agg((elem ->> 'idPersona')::integer order by (elem ->> 'idPersona')::integer), '{}')
  into v_ids_incluidos
  from jsonb_array_elements(coalesce(v_preview -> 'incluidos', '[]'::jsonb)) as elem;

  if coalesce(array_length(v_ids_incluidos, 1), 0) > 0 then
    insert into public.segmento_nomina (
      id_nomina_periodo,
      id_empresa,
      nombre,
      tipo,
      estado,
      trabajador_ids,
      total_trabajadores,
      ordinal
    )
    values (
      v_nueva.id,
      v_id_empresa,
      'Dotación general',
      'planta',
      'lista',
      v_ids_incluidos,
      array_length(v_ids_incluidos, 1),
      1
    );

    update public.nomina_periodo
    set total_trabajadores = array_length(v_ids_incluidos, 1),
        total_segmentos = 1,
        updated_at = now()
    where id = v_nueva.id;

    -- Transición borrador -> dotacion_generada (trigger F02 emite evento)
    perform public.transicionar_nomina_periodo(
      p_nomina_id => v_nueva.id,
      p_estado_esperado => 'borrador',
      p_estado_destino => 'dotacion_generada',
      p_motivo => null,
      p_id_calculo_periodo => null,
      p_total_trabajadores => array_length(v_ids_incluidos, 1),
      p_total_haberes => null,
      p_total_descuentos => null,
      p_total_liquido => null,
      p_version_estado_esperada => v_nueva.version_estado
    );
    v_estado_destino := 'dotacion_generada';
    v_siguiente_paso := 'parameters';
  else
    v_estado_destino := 'borrador';
    v_siguiente_paso := 'dotacion';
  end if;

  -- Releer cabecera (versión actualizada por la transición).
  select * into v_nueva
  from public.nomina_periodo
  where id = v_nueva.id;

  return jsonb_build_object(
    'idNominaPeriodo', v_nueva.id,
    'estado', v_nueva.estado,
    'versionEstado', v_nueva.version_estado,
    'codigoCiclo', v_nueva.codigo_ciclo,
    'fechaInicio', v_nueva.fecha_inicio,
    'fechaFin', v_nueva.fecha_fin,
    'totalTrabajadores', v_nueva.total_trabajadores,
    'siguientePaso', v_siguiente_paso,
    'reutilizada', false
  );
end;
$$;

comment on function public.confirmar_creacion_nomina(text, text, text) is
  'Crea la nómina mensual de forma transaccional (cabecera + dotación + auditoría). Valida fingerprint vigente contra F04 y aplica idempotencia: si ya existe una nómina no anulada para (empresa, período), la retorna sin crear duplicado. NOM-ADMIN-OPS-F05.';

revoke all on function public.confirmar_creacion_nomina(text, text, text) from public;
grant execute on function public.confirmar_creacion_nomina(text, text, text) to authenticated, service_role;


commit;
