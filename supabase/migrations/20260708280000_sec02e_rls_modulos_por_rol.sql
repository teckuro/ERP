-- =============================================================================
-- SEC-02e (AUDIT-SEC-2026-07) — RLS escritura por rol/perfil (piloto)
--
-- Parámetros, conceptos y empleados: SELECT sin cambio; INSERT/UPDATE/DELETE
-- requieren sec_permiso_modulo_escritura_ok (ADMIN-01 + matriz roles).
-- =============================================================================

begin;

set local lock_timeout = '5s';
set local statement_timeout = '180s';

select pg_advisory_xact_lock(hashtext('SEC-02e-rls-modulos-por-rol'));

set search_path = public;

-- ---------------------------------------------------------------------------
-- 1. Parámetros piloto (auth-only global; escritura por módulo parametros)
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
  tables text[] := array['parametros_generales', 'parametros_generales_cliente'];
begin
  foreach t in array tables loop
    if to_regclass('public.' || t) is null then
      continue;
    end if;

    execute format('drop policy if exists %I on public.%I', t || '_insert_authenticated', t);
    execute format('drop policy if exists %I on public.%I', t || '_update_authenticated', t);
    execute format('drop policy if exists %I on public.%I', t || '_delete_authenticated', t);
    execute format('drop policy if exists %I on public.%I', t || '_insert_modulo', t);
    execute format('drop policy if exists %I on public.%I', t || '_update_modulo', t);
    execute format('drop policy if exists %I on public.%I', t || '_delete_modulo', t);

    execute format(
      $p$
        create policy %I on public.%I
          for insert to authenticated
          with check (public.sec_permiso_modulo_escritura_ok('parametros'))
      $p$,
      t || '_insert_modulo', t
    );
    execute format(
      $p$
        create policy %I on public.%I
          for update to authenticated
          using (public.sec_permiso_modulo_escritura_ok('parametros'))
          with check (public.sec_permiso_modulo_escritura_ok('parametros'))
      $p$,
      t || '_update_modulo', t
    );
    execute format(
      $p$
        create policy %I on public.%I
          for delete to authenticated
          using (public.sec_permiso_modulo_escritura_ok('parametros'))
      $p$,
      t || '_delete_modulo', t
    );

    execute format('alter table public.%I force row level security', t);
  end loop;
end;
$$;


-- ---------------------------------------------------------------------------
-- 2. Concepto (catálogo global; escritura por módulo conceptos)
-- ---------------------------------------------------------------------------

drop policy if exists haberes_descuentos_insert on public.concepto;
drop policy if exists haberes_descuentos_update on public.concepto;
drop policy if exists haberes_descuentos_delete on public.concepto;
drop policy if exists concepto_insert_authenticated on public.concepto;
drop policy if exists concepto_update_authenticated on public.concepto;
drop policy if exists concepto_delete_authenticated on public.concepto;
drop policy if exists concepto_insert_modulo on public.concepto;
drop policy if exists concepto_update_modulo on public.concepto;
drop policy if exists concepto_delete_modulo on public.concepto;

create policy concepto_insert_modulo on public.concepto
  for insert to authenticated
  with check (public.sec_permiso_modulo_escritura_ok('conceptos'));

create policy concepto_update_modulo on public.concepto
  for update to authenticated
  using (public.sec_permiso_modulo_escritura_ok('conceptos'))
  with check (public.sec_permiso_modulo_escritura_ok('conceptos'));

create policy concepto_delete_modulo on public.concepto
  for delete to authenticated
  using (public.sec_permiso_modulo_escritura_ok('conceptos'));

alter table public.concepto force row level security;


-- ---------------------------------------------------------------------------
-- 3. Persona + contrato (tenant + módulo empleados)
-- ---------------------------------------------------------------------------

drop policy if exists persona_insert_authenticated on public.persona;
drop policy if exists persona_insert_modulo on public.persona;
create policy persona_insert_modulo on public.persona
  for insert to authenticated
  with check (
    public.current_user_empresa_id() is not null
    and public.sec_permiso_modulo_escritura_ok('empleados')
  );

drop policy if exists persona_update_tenant on public.persona;
drop policy if exists persona_update_modulo on public.persona;
create policy persona_update_modulo on public.persona
  for update to authenticated
  using (
    public.sec_persona_tenant_ok(id_persona)
    and public.sec_permiso_modulo_escritura_ok('empleados')
  )
  with check (
    public.sec_persona_tenant_ok(id_persona)
    and public.sec_permiso_modulo_escritura_ok('empleados')
  );

drop policy if exists persona_delete_tenant on public.persona;
drop policy if exists persona_delete_modulo on public.persona;
create policy persona_delete_modulo on public.persona
  for delete to authenticated
  using (
    public.sec_persona_tenant_ok(id_persona)
    and public.sec_permiso_modulo_escritura_ok('empleados')
  );

drop policy if exists contrato_insert_tenant on public.contrato;
drop policy if exists contrato_insert_modulo on public.contrato;
create policy contrato_insert_modulo on public.contrato
  for insert to authenticated
  with check (
    id_empresa = public.current_user_empresa_id()
    and public.sec_permiso_modulo_escritura_ok('empleados')
  );

drop policy if exists contrato_update_tenant on public.contrato;
drop policy if exists contrato_update_modulo on public.contrato;
create policy contrato_update_modulo on public.contrato
  for update to authenticated
  using (
    id_empresa = public.current_user_empresa_id()
    and public.sec_permiso_modulo_escritura_ok('empleados')
  )
  with check (
    id_empresa = public.current_user_empresa_id()
    and public.sec_permiso_modulo_escritura_ok('empleados')
  );

drop policy if exists contrato_delete_tenant on public.contrato;
drop policy if exists contrato_delete_modulo on public.contrato;
create policy contrato_delete_modulo on public.contrato
  for delete to authenticated
  using (
    id_empresa = public.current_user_empresa_id()
    and public.sec_permiso_modulo_escritura_ok('empleados')
  );

alter table public.persona force row level security;
alter table public.contrato force row level security;


-- ---------------------------------------------------------------------------
-- 4. Hijos empleados (persona / contrato tenant + módulo empleados)
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
  contrato_tables text[] := array[
    'remuneracion', 'prevision', 'salud_trabajador', 'cuenta2_afp',
    'semana_corrida', 'zona_extrema', 'apv', 'contrato_centro_costo'
  ];
  persona_tables text[] := array['cuenta_bancaria', 'empleado_historial', 'persona_condicion_trabajador'];
begin
  foreach t in array contrato_tables loop
    if to_regclass('public.' || t) is null then
      continue;
    end if;

    execute format('drop policy if exists %I on public.%I', t || '_insert_tenant', t);
    execute format('drop policy if exists %I on public.%I', t || '_update_tenant', t);
    execute format('drop policy if exists %I on public.%I', t || '_delete_tenant', t);
    execute format('drop policy if exists %I on public.%I', t || '_insert_modulo', t);
    execute format('drop policy if exists %I on public.%I', t || '_update_modulo', t);
    execute format('drop policy if exists %I on public.%I', t || '_delete_modulo', t);

    execute format(
      $p$
        create policy %I on public.%I
          for insert to authenticated
          with check (
            public.sec_contrato_tenant_ok(id_contrato)
            and public.sec_permiso_modulo_escritura_ok('empleados')
          )
      $p$,
      t || '_insert_modulo', t
    );
    execute format(
      $p$
        create policy %I on public.%I
          for update to authenticated
          using (
            public.sec_contrato_tenant_ok(id_contrato)
            and public.sec_permiso_modulo_escritura_ok('empleados')
          )
          with check (
            public.sec_contrato_tenant_ok(id_contrato)
            and public.sec_permiso_modulo_escritura_ok('empleados')
          )
      $p$,
      t || '_update_modulo', t
    );
    execute format(
      $p$
        create policy %I on public.%I
          for delete to authenticated
          using (
            public.sec_contrato_tenant_ok(id_contrato)
            and public.sec_permiso_modulo_escritura_ok('empleados')
          )
      $p$,
      t || '_delete_modulo', t
    );

    execute format('alter table public.%I force row level security', t);
  end loop;

  foreach t in array persona_tables loop
    if to_regclass('public.' || t) is null then
      continue;
    end if;

    execute format('drop policy if exists %I on public.%I', t || '_insert_tenant', t);
    execute format('drop policy if exists %I on public.%I', t || '_update_tenant', t);
    execute format('drop policy if exists %I on public.%I', t || '_delete_tenant', t);
    execute format('drop policy if exists %I on public.%I', t || '_insert_modulo', t);
    execute format('drop policy if exists %I on public.%I', t || '_update_modulo', t);
    execute format('drop policy if exists %I on public.%I', t || '_delete_modulo', t);

    execute format(
      $p$
        create policy %I on public.%I
          for insert to authenticated
          with check (
            public.sec_persona_tenant_ok(id_persona)
            and public.sec_permiso_modulo_escritura_ok('empleados')
          )
      $p$,
      t || '_insert_modulo', t
    );
    execute format(
      $p$
        create policy %I on public.%I
          for update to authenticated
          using (
            public.sec_persona_tenant_ok(id_persona)
            and public.sec_permiso_modulo_escritura_ok('empleados')
          )
          with check (
            public.sec_persona_tenant_ok(id_persona)
            and public.sec_permiso_modulo_escritura_ok('empleados')
          )
      $p$,
      t || '_update_modulo', t
    );
    execute format(
      $p$
        create policy %I on public.%I
          for delete to authenticated
          using (
            public.sec_persona_tenant_ok(id_persona)
            and public.sec_permiso_modulo_escritura_ok('empleados')
          )
      $p$,
      t || '_delete_modulo', t
    );

    execute format('alter table public.%I force row level security', t);
  end loop;
end;
$$;


-- ---------------------------------------------------------------------------
-- 5. Smoke
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'parametros_generales'
      and policyname = 'parametros_generales_insert_modulo'
  ) then
    raise exception 'SEC-02e smoke: falta parametros_generales_insert_modulo';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'concepto'
      and policyname = 'concepto_insert_modulo'
  ) then
    raise exception 'SEC-02e smoke: falta concepto_insert_modulo';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'persona'
      and policyname = 'persona_update_modulo'
  ) then
    raise exception 'SEC-02e smoke: falta persona_update_modulo';
  end if;
end;
$$;

notify pgrst, 'reload schema';

commit;
