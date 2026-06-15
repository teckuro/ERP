-- =====================================================================
-- NOM-ADMIN-OPS-F03 - Plantillas de ciclos por empresa
-- =====================================================================
-- Fase F03 del roadmap docs/codex/modulos/nomina-mensual/roadmap-admin-generador-operativo-100.md.
-- Depende de F01 (cimientos canónicos) y F02 (auditoría + RLS).
--
-- Objetivo
--   Convertir `nomina_plantilla_ciclo` en una entidad configurable y
--   versionable que propone calendarios repetibles (mensual, quincenal,
--   semanal, anticipos), reduciendo errores al crear nóminas.
--
-- Cambios
--   1. Extender `nomina_plantilla_ciclo` con `regla_fecha_pago jsonb`,
--      `politica_fin_semana text` (default 'adelantar'), `regla_anticipo jsonb`,
--      `descripcion text`.
--   2. Constraints fuertes: regla_fecha_pago obligatoria con `tipo`,
--      politica_fin_semana ∈ {adelantar, atrasar, mantener},
--      regla_anticipo XOR no-anticipo.
--   3. Backfill de la plantilla MES sembrada en F01 con la configuración
--      por defecto.
--   4. Seed adicional `MES-ANT-15` (anticipo mensual del 50 % al día 15)
--      para demostrar versionado y naturaleza anticipo.
--   5. Helpers SQL:
--      - `fn_ultimo_dia_habil(date)`: último día hábil del mes (lun-vie).
--      - `fn_dia_habil_n(date, integer)`: n-ésimo día hábil del mes.
--      - `fn_aplicar_politica_fds(date, text)`: ajusta si cae en fds.
--      - `fn_calcular_fecha_pago(jsonb, date, text)`: combina lo anterior.
--   6. RPC `previsualizar_cortes_plantilla(uuid, integer, integer)` que
--      proyecta cortes para un año (mensual, anticipo mensual, quincenal,
--      semanal) sin escribir nada.
--   7. RPC `crear_version_plantilla(uuid, text, jsonb, text, jsonb, text, boolean)`
--      atómica que crea la siguiente versión y, opcionalmente, la activa
--      desactivando la anterior.
--
-- Nota sobre feriados
--   La heurística de "día hábil" considera solo sábados y domingos. No
--   incluye feriados oficiales de Chile. Se documenta como deuda
--   conocida: integrar calendario en una fase posterior (F18a o un anexo
--   propio si se decide promover el tema a fase).
-- =====================================================================

begin;

set local lock_timeout = '5s';
set local statement_timeout = '120s';

select pg_advisory_xact_lock(hashtext('NOM-ADMIN-OPS-F03'));


-- ---------------------------------------------------------------------
-- 1. Extensión de columnas (aditiva)
-- ---------------------------------------------------------------------

alter table public.nomina_plantilla_ciclo
  add column if not exists regla_fecha_pago jsonb,
  add column if not exists politica_fin_semana text not null default 'adelantar',
  add column if not exists regla_anticipo jsonb,
  add column if not exists descripcion text;

comment on column public.nomina_plantilla_ciclo.regla_fecha_pago is
  'Regla para calcular la fecha de pago de cada corte. Estructura {"tipo": ..., ...}. Tipos: dia_fijo (con `dia`), dia_habil_n (con `n_habil`), ultimo_dia_habil, ultimo_dia_corrido, siguiente_mes_dia_fijo (con `dia`). NOM-ADMIN-OPS-F03.';
comment on column public.nomina_plantilla_ciclo.politica_fin_semana is
  'Acción cuando la fecha de pago cae en sábado o domingo: adelantar (al viernes anterior), atrasar (al lunes siguiente) o mantener. Default: adelantar. NOM-ADMIN-OPS-F03.';
comment on column public.nomina_plantilla_ciclo.regla_anticipo is
  'Regla del valor propuesto del anticipo. Solo para naturaleza=anticipo. Estructura {"modo": "porcentaje" | "monto_fijo", "valor": <numeric>}. NULL para otras naturalezas. NOM-ADMIN-OPS-F03.';
comment on column public.nomina_plantilla_ciclo.descripcion is
  'Texto humano que describe el propósito de la plantilla. Opcional. NOM-ADMIN-OPS-F03.';


-- ---------------------------------------------------------------------
-- 2. Backfill de plantilla MES sembrada en F01
-- ---------------------------------------------------------------------

update public.nomina_plantilla_ciclo
set
  regla_fecha_pago = '{"tipo": "ultimo_dia_habil"}'::jsonb,
  politica_fin_semana = 'adelantar',
  regla_anticipo = null,
  descripcion = coalesce(descripcion, 'Mes calendario, pago en último día hábil con adelanto a viernes si cae en fin de semana.')
where codigo = 'MES'
  and regla_fecha_pago is null;


-- ---------------------------------------------------------------------
-- 3. Constraints duros sobre la nueva configuración
-- ---------------------------------------------------------------------

alter table public.nomina_plantilla_ciclo
  drop constraint if exists nomina_plantilla_ciclo_regla_fecha_pago_check;
alter table public.nomina_plantilla_ciclo
  add constraint nomina_plantilla_ciclo_regla_fecha_pago_check
  check (
    regla_fecha_pago is not null
    and jsonb_typeof(regla_fecha_pago) = 'object'
    and (regla_fecha_pago ->> 'tipo') in (
      'dia_fijo',
      'dia_habil_n',
      'ultimo_dia_habil',
      'ultimo_dia_corrido',
      'siguiente_mes_dia_fijo'
    )
    and (
      (regla_fecha_pago ->> 'tipo') not in ('dia_fijo', 'siguiente_mes_dia_fijo')
      or (
        (regla_fecha_pago ->> 'dia')::integer between 1 and 31
      )
    )
    and (
      (regla_fecha_pago ->> 'tipo') <> 'dia_habil_n'
      or (
        (regla_fecha_pago ->> 'n_habil')::integer between 1 and 23
      )
    )
  );

alter table public.nomina_plantilla_ciclo
  drop constraint if exists nomina_plantilla_ciclo_politica_fds_check;
alter table public.nomina_plantilla_ciclo
  add constraint nomina_plantilla_ciclo_politica_fds_check
  check (politica_fin_semana in ('adelantar', 'atrasar', 'mantener'));

alter table public.nomina_plantilla_ciclo
  drop constraint if exists nomina_plantilla_ciclo_anticipo_xor_check;
alter table public.nomina_plantilla_ciclo
  add constraint nomina_plantilla_ciclo_anticipo_xor_check
  check (
    (
      naturaleza = 'anticipo'
      and regla_anticipo is not null
      and jsonb_typeof(regla_anticipo) = 'object'
      and (regla_anticipo ->> 'modo') in ('porcentaje', 'monto_fijo')
      and (regla_anticipo ->> 'valor')::numeric > 0
      and (
        (regla_anticipo ->> 'modo') <> 'porcentaje'
        or (regla_anticipo ->> 'valor')::numeric <= 100
      )
    )
    or (
      naturaleza <> 'anticipo'
      and regla_anticipo is null
    )
  );


-- ---------------------------------------------------------------------
-- 4. Helpers SQL (sin feriados oficiales: solo sábado y domingo)
-- ---------------------------------------------------------------------

create or replace function public.fn_ultimo_dia_corrido(p_fecha_ref date)
returns date
language sql
immutable
as $$
  select (date_trunc('month', p_fecha_ref) + interval '1 month - 1 day')::date
$$;

comment on function public.fn_ultimo_dia_corrido(date) is
  'Último día calendario del mes que contiene p_fecha_ref. NOM-ADMIN-OPS-F03.';


create or replace function public.fn_ultimo_dia_habil(p_fecha_ref date)
returns date
language plpgsql
immutable
as $$
declare
  v_dia date := public.fn_ultimo_dia_corrido(p_fecha_ref);
begin
  -- 6 = sábado, 0 = domingo (extract dow)
  while extract(dow from v_dia) in (0, 6) loop
    v_dia := v_dia - 1;
  end loop;
  return v_dia;
end;
$$;

comment on function public.fn_ultimo_dia_habil(date) is
  'Último día hábil (lun-vie) del mes que contiene p_fecha_ref. No considera feriados oficiales: deuda conocida F03. NOM-ADMIN-OPS-F03.';


create or replace function public.fn_dia_habil_n(p_fecha_ref date, p_n integer)
returns date
language plpgsql
immutable
as $$
declare
  v_inicio date := date_trunc('month', p_fecha_ref)::date;
  v_dia date := v_inicio;
  v_contador integer := 0;
  v_limite date := public.fn_ultimo_dia_corrido(p_fecha_ref);
begin
  if p_n is null or p_n < 1 then
    raise exception 'fn_dia_habil_n: p_n debe ser >= 1';
  end if;

  while v_dia <= v_limite loop
    if extract(dow from v_dia) not in (0, 6) then
      v_contador := v_contador + 1;
      if v_contador = p_n then
        return v_dia;
      end if;
    end if;
    v_dia := v_dia + 1;
  end loop;

  return null;
end;
$$;

comment on function public.fn_dia_habil_n(date, integer) is
  'N-ésimo día hábil (lun-vie) del mes. Retorna NULL si el mes no tiene N días hábiles. No considera feriados oficiales: deuda conocida F03. NOM-ADMIN-OPS-F03.';


create or replace function public.fn_aplicar_politica_fds(p_fecha date, p_politica text)
returns date
language plpgsql
immutable
as $$
declare
  v_dow integer;
begin
  if p_fecha is null then
    return null;
  end if;

  v_dow := extract(dow from p_fecha);

  if v_dow not in (0, 6) then
    return p_fecha;
  end if;

  if p_politica = 'mantener' then
    return p_fecha;
  end if;

  if p_politica = 'adelantar' then
    if v_dow = 6 then
      return p_fecha - 1;
    end if;
    return p_fecha - 2;
  end if;

  if p_politica = 'atrasar' then
    if v_dow = 0 then
      return p_fecha + 1;
    end if;
    return p_fecha + 2;
  end if;

  raise exception 'fn_aplicar_politica_fds: política inválida %', p_politica;
end;
$$;

comment on function public.fn_aplicar_politica_fds(date, text) is
  'Ajusta una fecha que cae en sábado o domingo según la política indicada (adelantar/atrasar/mantener). NOM-ADMIN-OPS-F03.';


create or replace function public.fn_calcular_fecha_pago(
  p_regla jsonb,
  p_fecha_inicio_corte date,
  p_politica_fds text
)
returns date
language plpgsql
immutable
as $$
declare
  v_tipo text := p_regla ->> 'tipo';
  v_dia integer;
  v_n integer;
  v_base date;
  v_resultado date;
begin
  if p_regla is null or v_tipo is null then
    raise exception 'fn_calcular_fecha_pago: regla inválida (%)', p_regla;
  end if;

  if v_tipo = 'ultimo_dia_corrido' then
    v_base := public.fn_ultimo_dia_corrido(p_fecha_inicio_corte);

  elsif v_tipo = 'ultimo_dia_habil' then
    v_base := public.fn_ultimo_dia_habil(p_fecha_inicio_corte);

  elsif v_tipo = 'dia_fijo' then
    v_dia := (p_regla ->> 'dia')::integer;
    v_base := least(
      make_date(
        extract(year from p_fecha_inicio_corte)::integer,
        extract(month from p_fecha_inicio_corte)::integer,
        v_dia
      ),
      public.fn_ultimo_dia_corrido(p_fecha_inicio_corte)
    );

  elsif v_tipo = 'dia_habil_n' then
    v_n := (p_regla ->> 'n_habil')::integer;
    v_base := public.fn_dia_habil_n(p_fecha_inicio_corte, v_n);
    if v_base is null then
      v_base := public.fn_ultimo_dia_habil(p_fecha_inicio_corte);
    end if;

  elsif v_tipo = 'siguiente_mes_dia_fijo' then
    v_dia := (p_regla ->> 'dia')::integer;
    v_base := least(
      make_date(
        extract(year from (p_fecha_inicio_corte + interval '1 month'))::integer,
        extract(month from (p_fecha_inicio_corte + interval '1 month'))::integer,
        v_dia
      ),
      public.fn_ultimo_dia_corrido((p_fecha_inicio_corte + interval '1 month')::date)
    );

  else
    raise exception 'fn_calcular_fecha_pago: tipo de regla no soportado %', v_tipo;
  end if;

  v_resultado := public.fn_aplicar_politica_fds(v_base, p_politica_fds);
  return v_resultado;
end;
$$;

comment on function public.fn_calcular_fecha_pago(jsonb, date, text) is
  'Calcula la fecha de pago dada una regla, una fecha de inicio de corte y la política de fin de semana. NOM-ADMIN-OPS-F03.';


-- ---------------------------------------------------------------------
-- 5. RPC previsualizar_cortes_plantilla
-- ---------------------------------------------------------------------

drop function if exists public.previsualizar_cortes_plantilla(uuid, integer, integer);

create or replace function public.previsualizar_cortes_plantilla(
  p_plantilla_id uuid,
  p_anio integer,
  p_cantidad integer default null
)
returns table (
  numero_corte integer,
  codigo_ciclo text,
  fecha_inicio date,
  fecha_fin date,
  fecha_pago_propuesta date,
  fecha_pago_calendario date,
  ajuste_fds text,
  notas text
)
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_plantilla public.nomina_plantilla_ciclo%rowtype;
  v_mes integer;
  v_inicio date;
  v_fin date;
  v_pago_calendario date;
  v_pago_propuesto date;
  v_codigo text;
  v_numero integer := 0;
  v_total integer;
  v_max integer;
  v_inicio_anio date;
  v_fin_anio date;
begin
  select * into v_plantilla
  from public.nomina_plantilla_ciclo
  where id = p_plantilla_id;

  if not found then
    raise exception 'previsualizar_cortes_plantilla: plantilla % no existe', p_plantilla_id
      using errcode = 'P0002';
  end if;

  if p_anio is null or p_anio < 2000 or p_anio > 2100 then
    raise exception 'previsualizar_cortes_plantilla: p_anio fuera de rango (2000..2100)';
  end if;

  v_inicio_anio := make_date(p_anio, 1, 1);
  v_fin_anio := make_date(p_anio, 12, 31);

  -- ---------- MENSUAL (liquidación legal o pago extraordinario recurrente) ----------
  if v_plantilla.tipo = 'mensual' and v_plantilla.naturaleza in ('liquidacion_legal', 'pago_extraordinario') then
    v_max := coalesce(p_cantidad, 12);
    for v_mes in 1..least(12, v_max) loop
      v_numero := v_numero + 1;
      v_inicio := make_date(p_anio, v_mes, 1);
      v_fin := (v_inicio + interval '1 month - 1 day')::date;
      v_pago_calendario := public.fn_calcular_fecha_pago(
        v_plantilla.regla_fecha_pago,
        v_inicio,
        'mantener'
      );
      v_pago_propuesto := public.fn_aplicar_politica_fds(v_pago_calendario, v_plantilla.politica_fin_semana);
      v_codigo := to_char(v_inicio, 'YYYY-MM') || '-MES';

      numero_corte := v_numero;
      codigo_ciclo := v_codigo;
      fecha_inicio := v_inicio;
      fecha_fin := v_fin;
      fecha_pago_propuesta := v_pago_propuesto;
      fecha_pago_calendario := v_pago_calendario;
      ajuste_fds := case
        when v_pago_propuesto <> v_pago_calendario then v_plantilla.politica_fin_semana
        else null
      end;
      notas := null;
      return next;
    end loop;

  -- ---------- ANTICIPO MENSUAL ----------
  elsif v_plantilla.tipo = 'mensual' and v_plantilla.naturaleza = 'anticipo' then
    v_max := coalesce(p_cantidad, 12);
    for v_mes in 1..least(12, v_max) loop
      v_numero := v_numero + 1;
      v_inicio := make_date(p_anio, v_mes, 1);
      v_pago_calendario := public.fn_calcular_fecha_pago(
        v_plantilla.regla_fecha_pago,
        v_inicio,
        'mantener'
      );
      v_pago_propuesto := public.fn_aplicar_politica_fds(v_pago_calendario, v_plantilla.politica_fin_semana);
      v_fin := v_pago_calendario;
      v_codigo := to_char(v_inicio, 'YYYY-MM') || '-ANT-' || coalesce(v_plantilla.regla_anticipo ->> 'modo', '?');

      numero_corte := v_numero;
      codigo_ciclo := v_codigo;
      fecha_inicio := v_inicio;
      fecha_fin := v_fin;
      fecha_pago_propuesta := v_pago_propuesto;
      fecha_pago_calendario := v_pago_calendario;
      ajuste_fds := case
        when v_pago_propuesto <> v_pago_calendario then v_plantilla.politica_fin_semana
        else null
      end;
      notas := 'Anticipo ' || (v_plantilla.regla_anticipo ->> 'modo')
        || ' = ' || (v_plantilla.regla_anticipo ->> 'valor');
      return next;
    end loop;

  -- ---------- QUINCENAL ----------
  elsif v_plantilla.tipo = 'quincenal' then
    v_max := coalesce(p_cantidad, 24);
    for v_mes in 1..12 loop
      -- Q1: 1-15
      v_numero := v_numero + 1;
      if v_numero > v_max then exit; end if;
      v_inicio := make_date(p_anio, v_mes, 1);
      v_fin := make_date(p_anio, v_mes, 15);
      v_pago_calendario := public.fn_calcular_fecha_pago(
        v_plantilla.regla_fecha_pago,
        v_inicio,
        'mantener'
      );
      v_pago_propuesto := public.fn_aplicar_politica_fds(v_pago_calendario, v_plantilla.politica_fin_semana);
      numero_corte := v_numero;
      codigo_ciclo := to_char(v_inicio, 'YYYY-MM') || '-Q1';
      fecha_inicio := v_inicio;
      fecha_fin := v_fin;
      fecha_pago_propuesta := v_pago_propuesto;
      fecha_pago_calendario := v_pago_calendario;
      ajuste_fds := case
        when v_pago_propuesto <> v_pago_calendario then v_plantilla.politica_fin_semana
        else null
      end;
      notas := 'Quincena 1';
      return next;

      -- Q2: 16 - fin de mes
      v_numero := v_numero + 1;
      if v_numero > v_max then exit; end if;
      v_inicio := make_date(p_anio, v_mes, 16);
      v_fin := (date_trunc('month', v_inicio) + interval '1 month - 1 day')::date;
      v_pago_calendario := public.fn_calcular_fecha_pago(
        v_plantilla.regla_fecha_pago,
        v_inicio,
        'mantener'
      );
      v_pago_propuesto := public.fn_aplicar_politica_fds(v_pago_calendario, v_plantilla.politica_fin_semana);
      numero_corte := v_numero;
      codigo_ciclo := to_char(v_inicio, 'YYYY-MM') || '-Q2';
      fecha_inicio := v_inicio;
      fecha_fin := v_fin;
      fecha_pago_propuesta := v_pago_propuesto;
      fecha_pago_calendario := v_pago_calendario;
      ajuste_fds := case
        when v_pago_propuesto <> v_pago_calendario then v_plantilla.politica_fin_semana
        else null
      end;
      notas := 'Quincena 2';
      return next;
    end loop;

  -- ---------- SEMANAL (lunes a domingo, pago el viernes por defecto) ----------
  elsif v_plantilla.tipo = 'semanal' then
    v_max := coalesce(p_cantidad, 52);
    v_inicio := v_inicio_anio;
    -- mover al primer lunes ≥ v_inicio_anio
    while extract(dow from v_inicio) <> 1 loop
      v_inicio := v_inicio + 1;
    end loop;

    while v_numero < v_max and v_inicio <= v_fin_anio loop
      v_numero := v_numero + 1;
      v_fin := v_inicio + 6;
      -- Para semanal, "fecha de pago" se interpreta sobre el último día de la semana
      v_pago_calendario := public.fn_calcular_fecha_pago(
        v_plantilla.regla_fecha_pago,
        v_inicio,
        'mantener'
      );
      -- Si la regla es dia_habil_n, lo aplicamos relativo a la semana (n=5 => viernes)
      if (v_plantilla.regla_fecha_pago ->> 'tipo') = 'dia_habil_n' then
        v_pago_calendario := v_inicio + ((v_plantilla.regla_fecha_pago ->> 'n_habil')::integer - 1);
      end if;
      v_pago_propuesto := public.fn_aplicar_politica_fds(v_pago_calendario, v_plantilla.politica_fin_semana);
      numero_corte := v_numero;
      codigo_ciclo := to_char(v_inicio, 'YYYY-IW') || '-SEM';
      fecha_inicio := v_inicio;
      fecha_fin := v_fin;
      fecha_pago_propuesta := v_pago_propuesto;
      fecha_pago_calendario := v_pago_calendario;
      ajuste_fds := case
        when v_pago_propuesto <> v_pago_calendario then v_plantilla.politica_fin_semana
        else null
      end;
      notas := null;
      return next;

      v_inicio := v_inicio + 7;
    end loop;

  else
    -- Extraordinaria u otras: no se proyectan cortes recurrentes.
    return;
  end if;

  return;
end;
$$;

comment on function public.previsualizar_cortes_plantilla(uuid, integer, integer) is
  'Proyecta los cortes de una plantilla para un año dado. No escribe. Soporta mensual (liquidación y pago_extraordinario), anticipo mensual, quincenal y semanal. Extraordinaria retorna vacío. NOM-ADMIN-OPS-F03.';

revoke all on function public.previsualizar_cortes_plantilla(uuid, integer, integer) from public;
grant execute on function public.previsualizar_cortes_plantilla(uuid, integer, integer) to authenticated, service_role;


-- ---------------------------------------------------------------------
-- 6. RPC crear_version_plantilla
-- ---------------------------------------------------------------------

drop function if exists public.crear_version_plantilla(uuid, text, jsonb, text, jsonb, text, boolean);

create or replace function public.crear_version_plantilla(
  p_plantilla_id uuid,
  p_nombre text default null,
  p_regla_fecha_pago jsonb default null,
  p_politica_fin_semana text default null,
  p_regla_anticipo jsonb default null,
  p_descripcion text default null,
  p_activar boolean default true
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_id_empresa integer;
  v_codigo text;
  v_naturaleza text;
  v_tipo text;
  v_configuracion jsonb;
  v_regla_fecha_pago jsonb;
  v_politica_fin_semana text;
  v_regla_anticipo jsonb;
  v_descripcion text;
  v_nombre text;
  v_activo boolean;
  v_nueva_version integer;
  v_id_nuevo uuid;
begin
  select
    p.id_empresa,
    p.codigo,
    p.naturaleza,
    p.tipo,
    p.configuracion,
    p.regla_fecha_pago,
    p.politica_fin_semana,
    p.regla_anticipo,
    p.descripcion,
    p.nombre,
    p.activo
  into
    v_id_empresa,
    v_codigo,
    v_naturaleza,
    v_tipo,
    v_configuracion,
    v_regla_fecha_pago,
    v_politica_fin_semana,
    v_regla_anticipo,
    v_descripcion,
    v_nombre,
    v_activo
  from public.nomina_plantilla_ciclo p
  where p.id = p_plantilla_id
  for update;

  if not found then
    raise exception 'crear_version_plantilla: plantilla % no existe', p_plantilla_id
      using errcode = 'P0002';
  end if;

  if not v_activo then
    raise exception 'crear_version_plantilla: la plantilla origen % no está activa', p_plantilla_id
      using errcode = '22023';
  end if;

  select coalesce(max(version), 0) + 1
  into v_nueva_version
  from public.nomina_plantilla_ciclo
  where id_empresa = v_id_empresa
    and codigo = v_codigo;

  if p_activar then
    update public.nomina_plantilla_ciclo
    set activo = false,
        updated_at = now()
    where id_empresa = v_id_empresa
      and codigo = v_codigo
      and activo = true;
  end if;

  insert into public.nomina_plantilla_ciclo (
    id_empresa,
    codigo,
    nombre,
    tipo,
    naturaleza,
    configuracion,
    regla_fecha_pago,
    politica_fin_semana,
    regla_anticipo,
    descripcion,
    activo,
    version
  ) values (
    v_id_empresa,
    v_codigo,
    coalesce(p_nombre, v_nombre),
    v_tipo,
    v_naturaleza,
    v_configuracion,
    coalesce(p_regla_fecha_pago, v_regla_fecha_pago),
    coalesce(p_politica_fin_semana, v_politica_fin_semana),
    case
      when v_naturaleza = 'anticipo'
        then coalesce(p_regla_anticipo, v_regla_anticipo)
      else null
    end,
    coalesce(p_descripcion, v_descripcion),
    p_activar,
    v_nueva_version
  )
  returning id into v_id_nuevo;

  return v_id_nuevo;
end;
$$;

comment on function public.crear_version_plantilla(uuid, text, jsonb, text, jsonb, text, boolean) is
  'Crea una nueva versión de una plantilla existente, copiando campos no especificados. Si p_activar=true (default), desactiva la versión anterior atómicamente. Retorna el id de la nueva fila. NOM-ADMIN-OPS-F03.';

revoke all on function public.crear_version_plantilla(uuid, text, jsonb, text, jsonb, text, boolean) from public;
grant execute on function public.crear_version_plantilla(uuid, text, jsonb, text, jsonb, text, boolean) to authenticated, service_role;


-- ---------------------------------------------------------------------
-- 7. Seed adicional: anticipo mensual día 15 (50 %)
-- ---------------------------------------------------------------------
-- Se inserta solo si no existe ya un anticipo activo para esa empresa con código MES-ANT-15.

insert into public.nomina_plantilla_ciclo (
  id_empresa,
  codigo,
  nombre,
  tipo,
  naturaleza,
  configuracion,
  regla_fecha_pago,
  politica_fin_semana,
  regla_anticipo,
  descripcion,
  activo,
  version
)
select
  e.id_empresa,
  'MES-ANT-15',
  'Anticipo mensual 50 % día 15',
  'mensual',
  'anticipo',
  '{}'::jsonb,
  '{"tipo": "dia_fijo", "dia": 15}'::jsonb,
  'adelantar',
  '{"modo": "porcentaje", "valor": 50}'::jsonb,
  'Anticipo del 50 % del líquido proyectado, pagado el día 15 (o viernes anterior si cae en fin de semana).',
  true,
  1
from public.empresa e
where not exists (
  select 1
  from public.nomina_plantilla_ciclo p
  where p.id_empresa = e.id_empresa
    and p.codigo = 'MES-ANT-15'
);


-- ---------------------------------------------------------------------
-- 8. Make regla_fecha_pago obligatoria a partir de aquí
-- ---------------------------------------------------------------------

alter table public.nomina_plantilla_ciclo
  alter column regla_fecha_pago set not null;


commit;
