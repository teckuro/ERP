-- BKL-06: columna motivo_cierre referenciada por transicionar_nomina_periodo al cerrar nómina.
-- Sin esta columna, confirmar_creacion_nomina falla al transicionar borrador → dotacion_generada.

begin;

set local lock_timeout = '5s';
set local statement_timeout = '120s';

alter table public.nomina_periodo
  add column if not exists motivo_cierre text;

comment on column public.nomina_periodo.motivo_cierre is
  'Motivo registrado al cerrar la nómina (BKL-06 / transicionar_nomina_periodo).';

commit;
