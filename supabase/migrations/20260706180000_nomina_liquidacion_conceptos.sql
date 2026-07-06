-- F15-FIX: generar_liquidaciones_nomina materializa líneas de concepto (LRE/Previred).
-- Copia nomina_calculo_concepto → nomina_liquidacion_concepto con codigo_lre.

create or replace function public.generar_liquidaciones_nomina(p_id_nomina_periodo uuid)
returns public.nomina_liquidacion_periodo
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_nomina public.nomina_periodo%rowtype;
  v_calculo public.nomina_calculo_periodo%rowtype;
  v_liq public.nomina_liquidacion_periodo%rowtype;
  v_version integer;
  v_trab record;
  v_permiso text;
begin
  select * into v_nomina from public.nomina_periodo np where np.id = p_id_nomina_periodo for update;
  if not found then raise exception 'Nómina no encontrada'; end if;

  v_permiso := case when v_nomina.naturaleza = 'rectificacion' then 'nomina.rectificacion' else 'nomina.liquidaciones' end;
  if not public.erp_nomina_permiso_efectivo(v_permiso) then
    raise exception 'No tienes permiso para generar liquidaciones';
  end if;

  if v_nomina.estado not in ('aprobada', 'liquidada') then
    raise exception 'La nómina debe estar aprobada para generar liquidaciones (actual: %)', v_nomina.estado;
  end if;

  if not coalesce(v_nomina.calculo_vigente, false) or v_nomina.id_calculo_periodo_vigente is null then
    raise exception 'No hay cálculo vigente para generar liquidaciones';
  end if;

  select * into v_calculo from public.nomina_calculo_periodo c where c.id_calculo_periodo = v_nomina.id_calculo_periodo_vigente;
  if not found then raise exception 'Snapshot de cálculo no encontrado'; end if;

  select coalesce(max(l.version), 0) + 1 into v_version
  from public.nomina_liquidacion_periodo l where l.id_nomina_periodo = p_id_nomina_periodo;

  insert into public.nomina_liquidacion_periodo (
    periodo, id_calculo_periodo, id_nomina_periodo, id_empresa, tipo_liquidacion, estado, version,
    total_trabajadores, total_haberes, total_descuentos, total_liquido, metadata
  )
  values (
    v_nomina.periodo, v_calculo.id_calculo_periodo, p_id_nomina_periodo, v_nomina.id_empresa,
    case
      when v_nomina.naturaleza = 'rectificacion' then 'rectificacion'
      when v_nomina.tipo = 'mensual' then 'mensual'
      when v_nomina.tipo = 'quincenal' then 'quincenal'
      when v_nomina.tipo = 'semanal' then 'semanal'
      else 'extraordinaria'
    end,
    'generada', v_version,
    coalesce(v_calculo.total_trabajadores, 0), coalesce(v_calculo.total_haberes, 0),
    coalesce(v_calculo.total_descuentos, 0), coalesce(v_calculo.total_liquido, 0),
    jsonb_build_object(
      'version_calculo', v_nomina.version_calculo,
      'generada_desde', case when v_nomina.naturaleza = 'rectificacion' then 'generador_nomina_f17_rectificacion' else 'generador_nomina_f15' end,
      'nominaOrigenId', v_nomina.nomina_origen_id
    )
  )
  returning * into v_liq;

  for v_trab in
    select t.* from public.nomina_calculo_trabajador t
    where t.id_calculo_periodo = v_calculo.id_calculo_periodo
      and (
        v_nomina.naturaleza <> 'rectificacion'
        or coalesce(t.liquido_preliminar, 0) <> 0
        or coalesce(t.total_haberes_imponibles, 0) + coalesce(t.total_haberes_no_imponibles, 0) <> 0
        or coalesce(t.total_descuentos_legales, 0) + coalesce(t.total_descuentos_voluntarios, 0) <> 0
      )
  loop
    insert into public.nomina_liquidacion_trabajador (
      id_liquidacion_periodo, id_calculo_periodo, id_persona, rut, nombre_trabajador,
      base_imponible, base_tributable, total_haberes, total_descuentos, liquido_pagar, estado, metadata
    )
    values (
      v_liq.id_liquidacion_periodo, v_calculo.id_calculo_periodo, v_trab.id_persona, v_trab.rut,
      v_trab.nombre_completo_snapshot, coalesce(v_trab.base_imponible_previsional, 0),
      coalesce(v_trab.base_tributable, 0),
      coalesce(v_trab.total_haberes_imponibles, 0) + coalesce(v_trab.total_haberes_no_imponibles, 0),
      coalesce(v_trab.total_descuentos_legales, 0) + coalesce(v_trab.total_descuentos_voluntarios, 0),
      coalesce(v_trab.liquido_preliminar, 0), 'generada',
      case when v_nomina.naturaleza = 'rectificacion' then
        jsonb_build_object('diferencial', true, 'nominaOrigenId', v_nomina.nomina_origen_id)
      else '{}'::jsonb end
    );
  end loop;

  insert into public.nomina_liquidacion_concepto (
    id_liquidacion_trabajador,
    id_concepto,
    codigo,
    codigo_lre,
    nombre,
    tipo,
    clasificacion,
    monto,
    orden,
    metadata
  )
  select
    lt.id_liquidacion_trabajador,
    c.id_concepto,
    co.codigo,
    coalesce(nullif(trim(c.codigo_lre_snapshot), ''), cat.codigo_lre),
    c.nombre_concepto_snapshot,
    c.tipo,
    case
      when c.tipo = 'haber' and c.imponible and c.tributable then 'haber_imponible_tributable'
      when c.tipo = 'haber' and c.imponible then 'haber_imponible'
      when c.tipo = 'haber' then 'haber_no_imponible'
      when c.tipo = 'descuento' then 'descuento'
      when c.tipo = 'cotizacion' then 'aporte_referencia'
      when c.tipo = 'impuesto' then 'impuesto'
      else null
    end,
    c.monto,
    row_number() over (
      partition by c.id_calculo_trabajador
      order by c.id_calculo_concepto
    )::int,
    jsonb_build_object(
      'idCalculoConcepto', c.id_calculo_concepto,
      'origen', c.origen,
      'imponible', c.imponible,
      'tributable', c.tributable,
      'afectaLiquido', c.afecta_liquido,
      'trazabilidad', c.trazabilidad_json,
      'generadaDesde', 'generar_liquidaciones_nomina_f15_fix'
    )
  from public.nomina_calculo_concepto c
  join public.nomina_calculo_trabajador ct
    on ct.id_calculo_trabajador = c.id_calculo_trabajador
  join public.nomina_liquidacion_trabajador lt
    on lt.id_liquidacion_periodo = v_liq.id_liquidacion_periodo
   and lt.id_calculo_periodo = ct.id_calculo_periodo
   and lt.id_persona = ct.id_persona
  left join public.concepto co on co.id_concepto = c.id_concepto
  left join public.catalogo_lre cat on cat.id_catalogo_lre = co.id_catalogo_lre
  where ct.id_calculo_periodo = v_calculo.id_calculo_periodo
    and (
      v_nomina.naturaleza <> 'rectificacion'
      or coalesce(ct.liquido_preliminar, 0) <> 0
      or coalesce(ct.total_haberes_imponibles, 0) + coalesce(ct.total_haberes_no_imponibles, 0) <> 0
      or coalesce(ct.total_descuentos_legales, 0) + coalesce(ct.total_descuentos_voluntarios, 0) <> 0
    );

  if v_nomina.estado = 'aprobada' then
    perform public.transicionar_nomina_periodo(
      p_id_nomina_periodo, 'aprobada', 'liquidada',
      case when v_nomina.naturaleza = 'rectificacion' then 'Liquidaciones diferenciales F17 generadas.' else 'Liquidaciones F15 generadas.' end,
      null, null, null, null, null, null
    );
  end if;

  return v_liq;
end;
$$;

comment on function public.generar_liquidaciones_nomina(uuid) is
  'F15: genera liquidaciones internas desde snapshot vigente, incluyendo líneas de concepto con codigo_lre.';

revoke all on function public.generar_liquidaciones_nomina(uuid) from public, anon;
grant execute on function public.generar_liquidaciones_nomina(uuid) to authenticated, service_role;
