-- CONC-02: RLS productivo en concepto (lectura authenticated; escritura operador+).

do $$
begin
  execute 'alter table public.concepto enable row level security';

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'concepto' and policyname = 'concepto_select_authenticated'
  ) then
    execute $policy$
      create policy concepto_select_authenticated on public.concepto
        for select to authenticated
        using (auth.role() = 'authenticated')
    $policy$;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'concepto' and policyname = 'concepto_insert_authenticated'
  ) then
    execute $policy$
      create policy concepto_insert_authenticated on public.concepto
        for insert to authenticated
        with check (auth.role() = 'authenticated')
    $policy$;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'concepto' and policyname = 'concepto_update_authenticated'
  ) then
    execute $policy$
      create policy concepto_update_authenticated on public.concepto
        for update to authenticated
        using (auth.role() = 'authenticated')
        with check (auth.role() = 'authenticated')
    $policy$;
  end if;
end $$;

grant select, insert, update on table public.concepto to authenticated;

-- Lectura de reglas de cálculo asociadas al concepto
do $$
begin
  execute 'alter table public.regla_concepto_calculo enable row level security';

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'regla_concepto_calculo' and policyname = 'regla_concepto_select_authenticated'
  ) then
    execute $policy$
      create policy regla_concepto_select_authenticated on public.regla_concepto_calculo
        for select to authenticated
        using (auth.role() = 'authenticated')
    $policy$;
  end if;
end $$;

grant select on table public.regla_concepto_calculo to authenticated;
