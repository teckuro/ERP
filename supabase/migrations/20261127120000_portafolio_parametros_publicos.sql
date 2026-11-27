-- Parámetros públicos para el portafolio (jphuerta.vercel.app).
--
-- El simulador de liquidación del portafolio usa los indicadores del último
-- período cargado. `parametros_generales` y `afp_vigencia` solo se leen
-- autenticado (SEC-02e), así que el visitante anónimo pasa por esta función.
--
-- Devuelve solo indicadores oficiales y globales (UF, UTM, UTA, sueldo mínimo,
-- topes y tasas legales), nunca datos de empresas ni de trabajadores:
--   { "periodos": [ último, anterior ], "afp": { nombre, tasa_obligatoria, comision } }
-- "afp" es la AFP vigente de menor comisión (referencia para un afiliado nuevo).

begin;

set local lock_timeout = '5s';
set local statement_timeout = '60s';

create or replace function public.portafolio_parametros_publicos()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with ultimos as (
    select
      pg.periodo,
      pg.uf,
      pg.utm,
      pg.uta,
      pg.sueldo_minimo,
      pg.tope_afp_uf,
      pg.tope_cesantia_uf,
      pg.salud_obligatoria,
      pg.afc_trabajador_indefinido
    from public.parametros_generales pg
    where pg.uf is not null
      and pg.periodo ~ '^\d{4}-\d{2}$'
    order by pg.periodo desc
    limit 2
  ),
  -- Tasa aplicable de cada AFP: su fila más reciente al inicio del período. El ETL
  -- inserta versiones nuevas sin cerrar las anteriores, así que una tarifa vieja y
  -- más barata puede seguir pasando los filtros de fecha.
  afp_actual as (
    select distinct on (v.id_afp) v.id_afp, v.tasa_obligatoria, v.comision
    from public.afp_vigencia v
    where v.vigente
      and v.vigencia_inicio <= (select (max(u.periodo) || '-01')::date from ultimos u)
      and (v.vigencia_fin is null or v.vigencia_fin >= (select (max(u.periodo) || '-01')::date from ultimos u))
    order by v.id_afp, v.vigencia_inicio desc
  ),
  afp_ref as (
    select a.nombre, x.tasa_obligatoria, x.comision
    from afp_actual x
    join public.afp a on a.id_afp = x.id_afp
    order by x.comision asc, a.nombre
    limit 1
  )
  select jsonb_build_object(
    'periodos', coalesce((select jsonb_agg(to_jsonb(u) order by u.periodo desc) from ultimos u), '[]'::jsonb),
    'afp', (select to_jsonb(r) from afp_ref r)
  );
$$;

comment on function public.portafolio_parametros_publicos() is
  'Indicadores oficiales de los dos últimos períodos para el simulador público del portafolio. Solo lectura, sin datos de empresas.';

revoke all on function public.portafolio_parametros_publicos() from public;
grant execute on function public.portafolio_parametros_publicos() to anon, authenticated;

commit;
