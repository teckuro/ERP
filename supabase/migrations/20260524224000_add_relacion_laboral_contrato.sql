alter table public.contrato
  add column if not exists relacion_laboral text not null default 'CONTRATO';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'contrato_relacion_laboral_check'
      and conrelid = 'public.contrato'::regclass
  ) then
    alter table public.contrato
      add constraint contrato_relacion_laboral_check
      check (relacion_laboral in ('CONTRATO', 'HONORARIOS'));
  end if;
end $$;
