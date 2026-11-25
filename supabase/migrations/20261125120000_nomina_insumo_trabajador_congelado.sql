-- NOM-INSUMOS-01 — Insumos del motor de cálculo congelados por nómina (fase 1)
--
-- Problema:
--   El motor (navegador) cargaba la ficha completa de cada trabajador con
--   EmpleadosRepository.obtenerPorId: ~16 consultas HTTP por trabajador y por
--   cada recálculo. Además no quedaba registro de con qué datos del trabajador
--   se calculó (los parámetros legales sí se congelan en nomina_calculo_parametro).
--
-- Cambio:
--   - Tabla nomina_insumo_trabajador: una fila por trabajador de la dotación con
--     las filas ORIGINALES que lee la ficha (persona, último contrato, último
--     registro por contrato de remuneración, previsión, salud, etc.). No aplica
--     reglas de negocio: los mappers TypeScript siguen armando la ficha.
--   - Función congelar_insumos_nomina(nomina): reemplaza los insumos de la
--     nómina y los devuelve en una sola llamada.
--
-- Seguridad:
--   - La función es SECURITY INVOKER: lee las tablas de origen con la RLS del
--     usuario (solo su empresa) y escribe con la RLS de la tabla nueva
--     (empresa + permiso de escritura 'nominas', SEC-08, y nómina de la misma
--     empresa).
--
-- Regla "último registro" = mismo criterio que EmpleadosRepository:
--   contrato y cuenta_bancaria: por id_persona, id más alto;
--   bloques del contrato: por id_contrato, id más alto;
--   condiciones: activas del contrato, con su código de catálogo.

begin;

create table if not exists public.nomina_insumo_trabajador (
  id                 bigint generated always as identity primary key,
  id_empresa         integer not null references public.empresa(id_empresa) on delete restrict,
  id_nomina_periodo  uuid not null references public.nomina_periodo(id) on delete cascade,
  id_persona         integer not null,
  id_contrato        integer,
  datos              jsonb not null,
  huella             text not null,
  congelado_at       timestamptz not null default now(),
  congelado_by       uuid default auth.uid(),
  constraint nomina_insumo_trabajador_nomina_persona_uk unique (id_nomina_periodo, id_persona)
);

comment on table public.nomina_insumo_trabajador is
  'NOM-INSUMOS-01: filas originales de la ficha de cada trabajador con que se calculó la nómina. huella = md5(datos) para detectar cambios.';

alter table public.nomina_insumo_trabajador enable row level security;

drop policy if exists nomina_insumo_trabajador_select_tenant on public.nomina_insumo_trabajador;
drop policy if exists nomina_insumo_trabajador_insert_tenant on public.nomina_insumo_trabajador;
drop policy if exists nomina_insumo_trabajador_delete_tenant on public.nomina_insumo_trabajador;

create policy nomina_insumo_trabajador_select_tenant
  on public.nomina_insumo_trabajador
  for select to authenticated
  using (id_empresa = public.current_user_empresa_id());

create policy nomina_insumo_trabajador_insert_tenant
  on public.nomina_insumo_trabajador
  for insert to authenticated
  with check (
    id_empresa = public.current_user_empresa_id()
    and public.sec_permiso_modulo_escritura_ok('nominas')
    -- La nómina referenciada debe ser de la misma empresa: la FK solo valida que
    -- exista, y una fila ajena bloquearía el congelado de la otra empresa (unique).
    and exists (
      select 1
      from public.nomina_periodo np
      where np.id = nomina_insumo_trabajador.id_nomina_periodo
        and np.id_empresa = nomina_insumo_trabajador.id_empresa
    )
  );

create policy nomina_insumo_trabajador_delete_tenant
  on public.nomina_insumo_trabajador
  for delete to authenticated
  using (
    id_empresa = public.current_user_empresa_id()
    and public.sec_permiso_modulo_escritura_ok('nominas')
  );

revoke all on table public.nomina_insumo_trabajador from public, anon;
grant select, insert, delete on table public.nomina_insumo_trabajador to authenticated;
grant all on table public.nomina_insumo_trabajador to service_role;

create or replace function public.congelar_insumos_nomina(p_nomina_periodo_id uuid)
returns table (id_persona integer, datos jsonb)
language plpgsql
security invoker
set search_path = public
as $$
#variable_conflict use_column
declare
  v_empresa integer;
begin
  select np.id_empresa into v_empresa
  from public.nomina_periodo np
  where np.id = p_nomina_periodo_id;

  if v_empresa is null then
    raise exception 'No se encontró la nómina para congelar sus insumos.' using errcode = 'P0002';
  end if;

  delete from public.nomina_insumo_trabajador t
  where t.id_nomina_periodo = p_nomina_periodo_id;

  return query
  with dotacion as (
    select distinct unnest(s.trabajador_ids) as id_persona
    from public.segmento_nomina s
    where s.id_nomina_periodo = p_nomina_periodo_id
  ),
  insumos as (
    select
      d.id_persona,
      c.id_contrato,
      jsonb_build_object(
        'resumen', (
          select to_jsonb(v) from public.vw_persona_factores v
          where v.id_persona = d.id_persona
          limit 1
        ),
        'departamento', (
          select cc.nombre
          from public.vw_persona_factores v
          join public.contrato_centro_costo ccc on ccc.id_contrato = v.id_contrato
          join public.centro_costo cc on cc.id_centro_costo = ccc.id_centro_costo
          where v.id_persona = d.id_persona
          limit 1
        ),
        'persona', to_jsonb(p),
        'contrato', to_jsonb(c),
        'cuenta_bancaria', (
          select to_jsonb(cb) from public.cuenta_bancaria cb
          where cb.id_persona = d.id_persona
          order by cb.id_cuenta desc limit 1
        ),
        'remuneracion', (
          select to_jsonb(x) from public.remuneracion x
          where x.id_contrato = c.id_contrato order by x.id_remuneracion desc limit 1
        ),
        'prevision', (
          select to_jsonb(x) from public.prevision x
          where x.id_contrato = c.id_contrato order by x.id_prevision desc limit 1
        ),
        'salud_trabajador', (
          select to_jsonb(x) from public.salud_trabajador x
          where x.id_contrato = c.id_contrato order by x.id_salud_trabajador desc limit 1
        ),
        'contrato_centro_costo', (
          select to_jsonb(x) from public.contrato_centro_costo x
          where x.id_contrato = c.id_contrato order by x.id_contrato_centro_costo desc limit 1
        ),
        'semana_corrida', (
          select to_jsonb(x) from public.semana_corrida x
          where x.id_contrato = c.id_contrato order by x.id_semana_corrida desc limit 1
        ),
        'zona_extrema', (
          select to_jsonb(x) from public.zona_extrema x
          where x.id_contrato = c.id_contrato order by x.id_zona_extrema desc limit 1
        ),
        'apv', (
          select to_jsonb(x) from public.apv x
          where x.id_contrato = c.id_contrato order by x.id_apv desc limit 1
        ),
        'cuenta2_afp', (
          select to_jsonb(x) from public.cuenta2_afp x
          where x.id_contrato = c.id_contrato order by x.id_cuenta2_afp desc limit 1
        ),
        'condiciones', coalesce((
          select jsonb_agg(jsonb_build_object(
            'codigo', tc.codigo,
            'vigencia_inicio', pc.vigencia_inicio,
            'vigencia_fin', pc.vigencia_fin,
            'respaldo_registrado', pc.respaldo_registrado,
            'observacion', pc.observacion
          ))
          from public.persona_condicion_trabajador pc
          join public.tipo_condicion_trabajador tc
            on tc.id_tipo_condicion_trabajador = pc.id_tipo_condicion_trabajador
          where pc.id_persona = d.id_persona
            and pc.id_contrato = c.id_contrato
            and pc.activa
        ), '[]'::jsonb)
      ) as datos
    from dotacion d
    join public.persona p on p.id_persona = d.id_persona
    left join lateral (
      select c2.* from public.contrato c2
      where c2.id_persona = d.id_persona
      order by c2.id_contrato desc
      limit 1
    ) c on true
  ),
  guardados as (
    insert into public.nomina_insumo_trabajador
      (id_empresa, id_nomina_periodo, id_persona, id_contrato, datos, huella)
    select v_empresa, p_nomina_periodo_id, i.id_persona, i.id_contrato, i.datos, md5(i.datos::text)
    from insumos i
    returning nomina_insumo_trabajador.id_persona, nomina_insumo_trabajador.datos
  )
  select g.id_persona, g.datos from guardados g;
end;
$$;

comment on function public.congelar_insumos_nomina(uuid) is
  'NOM-INSUMOS-01: congela (reemplaza) los insumos de ficha de la dotación de la nómina y los devuelve. SECURITY INVOKER: respeta RLS del usuario.';

revoke all on function public.congelar_insumos_nomina(uuid) from public, anon;
grant execute on function public.congelar_insumos_nomina(uuid) to authenticated, service_role;

notify pgrst, 'reload schema';

commit;
