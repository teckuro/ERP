begin;

do $$
declare
  v_total bigint;
begin
  select count(*)
  into v_total
  from public.nomina_periodo
  where fecha_inicio is null
    or fecha_fin is null
    or naturaleza is null
    or nullif(btrim(codigo_ciclo), '') is null;

  if v_total <> 0 then
    raise exception 'F01: existen % nominas sin identidad canonica', v_total;
  end if;

  select count(*)
  into v_total
  from public.nomina_periodo
  where tipo = 'mensual'
    and (
      fecha_inicio <> to_date(periodo || '-01', 'YYYY-MM-DD')
      or fecha_fin <> (
        to_date(periodo || '-01', 'YYYY-MM-DD')
        + interval '1 month - 1 day'
      )::date
      or naturaleza <> 'liquidacion_legal'
      or codigo_ciclo <> periodo || '-MES'
      or plantilla_ciclo_id is null
    );

  if v_total <> 0 then
    raise exception 'F01: existen % nominas mensuales no canonicas', v_total;
  end if;

  select count(*)
  into v_total
  from (
    select id_empresa
    from public.nomina_plantilla_ciclo
    where codigo = 'MES'
      and activo
    group by id_empresa
    having count(*) <> 1
  ) as plantillas_invalidas;

  if v_total <> 0 then
    raise exception 'F01: existen empresas con plantilla MES activa invalida';
  end if;

  select count(*)
  into v_total
  from public.empresa as empresa
  left join public.nomina_plantilla_ciclo as plantilla
    on plantilla.id_empresa = empresa.id_empresa
   and plantilla.codigo = 'MES'
   and plantilla.activo
  where plantilla.id is null;

  if v_total <> 0 then
    raise exception 'F01: existen % empresas sin plantilla MES activa', v_total;
  end if;

  select count(*)
  into v_total
  from (
    select calculo.id_calculo_periodo
    from public.nomina_calculo_periodo as calculo
    join public.nomina_periodo as nomina
      on nomina.periodo = calculo.periodo
     and (
       nomina.id_empresa = calculo.id_empresa
       or calculo.id_empresa is null
     )
    group by calculo.id_calculo_periodo
    having count(*) > 1
  ) as calculos_ambiguos;

  if v_total <> 0 then
    raise exception 'F01: existen % calculos con nomina ambigua', v_total;
  end if;

  select count(*)
  into v_total
  from public.nomina_calculo_periodo as calculo
  where calculo.id_nomina_periodo is null
    and (
      select count(*)
      from public.nomina_periodo as nomina
      where nomina.periodo = calculo.periodo
        and (
          nomina.id_empresa = calculo.id_empresa
          or calculo.id_empresa is null
        )
    ) = 1;

  if v_total <> 0 then
    raise exception 'F01: existen % calculos univocos sin vincular', v_total;
  end if;

  select count(*)
  into v_total
  from public.nomina_liquidacion_periodo as liquidacion
  join public.nomina_calculo_periodo as calculo
    on calculo.id_calculo_periodo = liquidacion.id_calculo_periodo
  where calculo.id_nomina_periodo is not null
    and liquidacion.id_nomina_periodo is distinct from calculo.id_nomina_periodo;

  if v_total <> 0 then
    raise exception 'F01: existen % liquidaciones con vinculo inconsistente', v_total;
  end if;

  select count(*)
  into v_total
  from pg_class
  where oid in (
    'public.nomina_plantilla_ciclo'::regclass,
    'public.nomina_consolidacion'::regclass
  )
    and not relrowsecurity;

  if v_total <> 0 then
    raise exception 'F01: existen % tablas nuevas sin RLS', v_total;
  end if;

  if to_regprocedure(
    'public.transicionar_nomina_periodo(uuid,text,text,text,bigint,integer,numeric,numeric,numeric,integer)'
  ) is null then
    raise exception 'F01: no existe la RPC versionada de transicion';
  end if;
end;
$$;

select
  (select count(*) from public.empresa) as empresas,
  (select count(*) from public.nomina_periodo) as nominas,
  (
    select count(*)
    from public.nomina_plantilla_ciclo
    where codigo = 'MES'
      and activo
  ) as plantillas_mes,
  (
    select count(*)
    from public.nomina_calculo_periodo
    where id_nomina_periodo is not null
  ) as calculos_vinculados,
  (
    select count(*)
    from public.nomina_liquidacion_periodo
    where id_nomina_periodo is not null
  ) as liquidaciones_vinculadas,
  (
    select count(*)
    from public.nomina_periodo
    where fecha_pago is null
  ) as nominas_sin_fecha_pago;

rollback;
