-- =============================================================================
-- 20260702230000_nomina_f13_incidencias_validacion.sql
-- F13 núcleo — decisiones persistidas + sincronización + validar_nomina RPC.
-- =============================================================================

set search_path = public;

-- ---------------------------------------------------------------------------
-- Columnas de decisión en incidencia_nomina
-- ---------------------------------------------------------------------------

alter table public.incidencia_nomina
  add column if not exists estado_decision text not null default 'pendiente',
  add column if not exists justificacion text,
  add column if not exists version_calculo_snapshot integer,
  add column if not exists decidida_at timestamptz;

alter table public.incidencia_nomina
  drop constraint if exists incidencia_nomina_estado_decision_check;

alter table public.incidencia_nomina
  add constraint incidencia_nomina_estado_decision_check
    check (estado_decision in ('pendiente', 'resuelta', 'aceptada_justificada'));

comment on column public.incidencia_nomina.estado_decision is
  'F13: pendiente | resuelta (crítica) | aceptada_justificada (advertencia).';

update public.incidencia_nomina
set estado_decision = 'resuelta'
where resuelta_at is not null
  and estado_decision = 'pendiente';

-- ---------------------------------------------------------------------------
-- Invalidar decisiones cuando cambia la versión de cálculo
-- ---------------------------------------------------------------------------

create or replace function public.invalidar_decisiones_incidencias_nomina(p_nomina_id uuid)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_version integer;
  v_count integer;
begin
  select np.version_calculo
  into v_version
  from public.nomina_periodo np
  where np.id = p_nomina_id;

  if not found then
    raise exception 'Nomina no encontrada';
  end if;

  update public.incidencia_nomina i
  set
    estado_decision = 'pendiente',
    justificacion = null,
    version_calculo_snapshot = null,
    decidida_at = null,
    resuelta_at = null
  where i.id_nomina_periodo = p_nomina_id
    and i.estado_decision <> 'pendiente'
    and (
      i.version_calculo_snapshot is null
      or i.version_calculo_snapshot <> v_version
    );

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

comment on function public.invalidar_decisiones_incidencias_nomina(uuid) is
  'F13: reabre decisiones de incidencias si la versión de cálculo ya no coincide.';

revoke all on function public.invalidar_decisiones_incidencias_nomina(uuid) from public, anon;
grant execute on function public.invalidar_decisiones_incidencias_nomina(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Sincronizar incidencias automáticas (dotación / segmentos)
-- ---------------------------------------------------------------------------

create or replace function public.sincronizar_incidencias_nomina(p_nomina_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_nomina public.nomina_periodo%rowtype;
  v_invalidadas integer;
  v_insertadas integer := 0;
begin
  select *
  into v_nomina
  from public.nomina_periodo np
  where np.id = p_nomina_id;

  if not found then
    raise exception 'Nomina no encontrada';
  end if;

  v_invalidadas := public.invalidar_decisiones_incidencias_nomina(p_nomina_id);

  delete from public.incidencia_nomina i
  where i.id_nomina_periodo = p_nomina_id
    and i.tipo in (
      'trabajador-duplicado-en-segmentos',
      'dotacion-vacia'
    );

  if coalesce(v_nomina.total_trabajadores, 0) = 0 then
    insert into public.incidencia_nomina (
      id_nomina_periodo,
      severidad,
      tipo,
      mensaje,
      bloqueante,
      estado_decision
    ) values (
      p_nomina_id,
      'critica',
      'dotacion-vacia',
      'La dotación no incluye trabajadores. Confirma la dotación antes de validar.',
      true,
      'pendiente'
    );
    v_insertadas := 1;
  else
    insert into public.incidencia_nomina (
      id_nomina_periodo,
      id_persona,
      severidad,
      tipo,
      mensaje,
      bloqueante,
      estado_decision
    )
    select
      p_nomina_id,
      d.persona_id,
      'critica',
      'trabajador-duplicado-en-segmentos',
      format(
        'Trabajador está en %s segmentos activos. Debe quedar en uno solo.',
        d.cantidad
      ),
      true,
      'pendiente'
    from (
      select
        persona_id,
        count(distinct segmento_id) as cantidad
      from (
        select
          unnest(s.trabajador_ids) as persona_id,
          s.id as segmento_id
        from public.segmento_nomina s
        where s.id_nomina_periodo = p_nomina_id
          and s.estado <> 'bloqueada'
      ) base
      group by persona_id
      having count(distinct segmento_id) > 1
    ) d;

    get diagnostics v_insertadas = row_count;
  end if;

  return jsonb_build_object(
    'invalidadas', v_invalidadas,
    'insertadas', v_insertadas
  );
end;
$$;

comment on function public.sincronizar_incidencias_nomina(uuid) is
  'F13: regenera incidencias automáticas de dotación y reabre decisiones obsoletas.';

revoke all on function public.sincronizar_incidencias_nomina(uuid) from public, anon;
grant execute on function public.sincronizar_incidencias_nomina(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Registrar decisión sobre una incidencia
-- ---------------------------------------------------------------------------

create or replace function public.registrar_decision_incidencia(
  p_id_incidencia uuid,
  p_accion text,
  p_justificacion text default null
)
returns public.incidencia_nomina
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_inc public.incidencia_nomina%rowtype;
  v_nomina public.nomina_periodo%rowtype;
  v_justificacion text;
begin
  v_justificacion := nullif(trim(coalesce(p_justificacion, '')), '');

  select i.*
  into v_inc
  from public.incidencia_nomina i
  where i.id = p_id_incidencia
  for update;

  if not found then
    raise exception 'Incidencia no encontrada';
  end if;

  select np.*
  into v_nomina
  from public.nomina_periodo np
  where np.id = v_inc.id_nomina_periodo;

  if not found then
    raise exception 'Nomina no encontrada';
  end if;

  if p_accion = 'resolver' then
    if v_inc.severidad = 'critica' then
      update public.incidencia_nomina
      set
        estado_decision = 'resuelta',
        justificacion = null,
        version_calculo_snapshot = v_nomina.version_calculo,
        decidida_at = now(),
        resuelta_at = now()
      where id = p_id_incidencia
      returning * into v_inc;
    else
      raise exception 'Solo las incidencias críticas se marcan como resueltas con esta acción';
    end if;
  elsif p_accion = 'aceptar' then
    if v_inc.severidad <> 'advertencia' then
      raise exception 'Solo las advertencias pueden aceptarse con justificación';
    end if;
    if v_justificacion is null then
      raise exception 'La advertencia requiere una justificación no vacía';
    end if;
    update public.incidencia_nomina
    set
      estado_decision = 'aceptada_justificada',
      justificacion = v_justificacion,
      version_calculo_snapshot = v_nomina.version_calculo,
      decidida_at = now(),
      resuelta_at = now()
    where id = p_id_incidencia
    returning * into v_inc;
  else
    raise exception 'Acción no reconocida: %', p_accion;
  end if;

  return v_inc;
end;
$$;

comment on function public.registrar_decision_incidencia(uuid, text, text) is
  'F13: resolver crítica o aceptar advertencia con justificación versionada.';

revoke all on function public.registrar_decision_incidencia(uuid, text, text) from public, anon;
grant execute on function public.registrar_decision_incidencia(uuid, text, text) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Validar nómina (calculada → validada) con guardias F13
-- ---------------------------------------------------------------------------

create or replace function public.validar_nomina(p_nomina_id uuid)
returns public.nomina_periodo
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_nomina public.nomina_periodo%rowtype;
  v_pendientes_criticas integer;
  v_pendientes_advertencias integer;
begin
  perform public.sincronizar_incidencias_nomina(p_nomina_id);

  select *
  into v_nomina
  from public.nomina_periodo np
  where np.id = p_nomina_id
  for update;

  if not found then
    raise exception 'Nomina no encontrada';
  end if;

  if v_nomina.estado <> 'calculada' then
    raise exception 'La nómina debe estar en estado calculada para validar (actual: %)', v_nomina.estado;
  end if;

  if not coalesce(v_nomina.calculo_vigente, false) then
    raise exception 'El cálculo no está vigente. Vuelve a procesarlo antes de validar.';
  end if;

  select count(*)
  into v_pendientes_criticas
  from public.incidencia_nomina i
  where i.id_nomina_periodo = p_nomina_id
    and i.severidad = 'critica'
    and i.estado_decision = 'pendiente';

  if v_pendientes_criticas > 0 then
    raise exception
      'Hay % incidencia(s) crítica(s) sin resolver',
      v_pendientes_criticas;
  end if;

  select count(*)
  into v_pendientes_advertencias
  from public.incidencia_nomina i
  where i.id_nomina_periodo = p_nomina_id
    and i.severidad = 'advertencia'
    and i.estado_decision = 'pendiente';

  if v_pendientes_advertencias > 0 then
    raise exception
      'Hay % advertencia(s) sin aceptar con justificación',
      v_pendientes_advertencias;
  end if;

  select *
  into v_nomina
  from public.transicionar_nomina_periodo(
    p_nomina_id,
    'calculada',
    'validada',
    'Validación F13: incidencias revisadas y decisiones registradas.',
    null,
    null,
    null,
    null,
    null,
    null
  );

  perform public.registrar_evento_auditoria_nomina(
    p_nomina_id,
    'validacion_completada',
    'Nómina validada con decisiones de incidencias.',
    'calculada',
    'validada',
    v_nomina.version_estado - 1,
    v_nomina.version_estado,
    jsonb_build_object('version_calculo', v_nomina.version_calculo)
  );

  return v_nomina;
end;
$$;

comment on function public.validar_nomina(uuid) is
  'F13: sincroniza incidencias, exige decisiones y transiciona calculada → validada.';

revoke all on function public.validar_nomina(uuid) from public, anon;
grant execute on function public.validar_nomina(uuid) to authenticated, service_role;
