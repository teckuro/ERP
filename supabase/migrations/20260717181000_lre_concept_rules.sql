-- LRE-CONCEPT-RULES-01: estrategia LRE para conceptos no directos.
-- Espejo de bd/base/v11/partes/25_lre_concept_rules.sql para supabase db push.

set search_path = public;

alter table public.concepto
  add column if not exists estrategia_lre varchar(40) not null default 'DIRECTO';

alter table public.concepto
  add column if not exists requiere_exportacion_lre boolean not null default true;

alter table public.concepto
  add column if not exists observacion_normativa_lre text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'chk_concepto_estrategia_lre'
  ) then
    alter table public.concepto
      add constraint chk_concepto_estrategia_lre check (
        estrategia_lre in (
          'DIRECTO',
          'DERIVA_DIAS_TRABAJADOS',
          'DERIVA_REBAJA_TRIBUTARIA',
          'DESCOMPONER_CONCEPTO',
          'PENDIENTE_NORMATIVO',
          'NO_EXPORTABLE'
        )
      );
  end if;
end $$;

create index if not exists idx_concepto_estrategia_lre
  on public.concepto (estrategia_lre);

create index if not exists idx_concepto_requiere_exportacion_lre
  on public.concepto (requiere_exportacion_lre);

update public.concepto
set
  estrategia_lre = 'DIRECTO',
  requiere_exportacion_lre = true,
  observacion_normativa_lre = null
where id_catalogo_lre is not null
  and estrategia_lre is distinct from 'DIRECTO';

update public.concepto
set
  id_catalogo_lre = null,
  estrategia_lre = 'DERIVA_DIAS_TRABAJADOS',
  requiere_exportacion_lre = true,
  observacion_normativa_lre =
    'Concepto interno: deriva dias trabajados/dias ausentes para LRE; no se declara como linea de descuento directa.'
where codigo = 'INASISTENCIA';

update public.concepto
set
  id_catalogo_lre = null,
  estrategia_lre = 'DESCOMPONER_CONCEPTO',
  requiere_exportacion_lre = true,
  observacion_normativa_lre =
    'Concepto ambiguo: separar en gratificacion zona legal, rebaja zona extrema DL 889 o bono zona empresa segun naturaleza.'
where codigo = 'ZONA_EXTREMA';

update public.concepto
set
  id_catalogo_lre = null,
  estrategia_lre = 'PENDIENTE_NORMATIVO',
  requiere_exportacion_lre = true,
  observacion_normativa_lre =
    'Concepto generico de aporte empleador. Separar en SIS, AFC, Ley 16.744/SANNA, trabajo pesado, APVC o reforma previsional segun corresponda.'
where codigo = 'AFP_EMPLEADOR';

comment on column public.concepto.estrategia_lre is
  'LRE-CONCEPT-RULES-01: estrategia frente al Libro de Remuneraciones Electrónico.';
comment on column public.concepto.requiere_exportacion_lre is
  'Si true y estrategia DIRECTO, exige codigo LRE; otras estrategias no fuerzan codigo incorrecto.';
