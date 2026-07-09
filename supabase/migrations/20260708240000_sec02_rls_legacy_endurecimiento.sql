-- =============================================================================
-- SEC-02 (AUDIT-SEC-2026-07) — endurecer RLS legacy (empleados, parámetros, concepto)
--
-- Contexto:
--   El monolito 08_seguridad_rls.sql dejó policies USING (true) y grants a anon.
--   Diagnóstico BD 2026-07-08: 117 policies permisivas, 714 grants anon.
--
-- Alcance:
--   1. Helpers tenant (contrato / persona / hijos por id_contrato).
--   2. Empleados + contrato: RLS por id_empresa / id_contrato (patrón F02).
--   3. Catálogos legales y parámetros sin id_empresa: solo authenticated (revoke anon).
--   4. Concepto / haberdescuento: authenticated; concepto es catálogo global.
--   5. Org con id_empresa (empresa, sucursal, departamento_empresa): tenant.
--   6. FORCE ROW LEVEL SECURITY + revoke anon en tablas tocadas.
--
-- Limitación documentada:
--   persona sin contrato (alta en curso) es visible a cualquier authenticated hasta
--   que exista contrato; deuda multi-empresa estricta (columna id_empresa en persona).
--   parametros_* y concepto son globales por periodo / catálogo (sin tenant en esquema).
-- =============================================================================

begin;

set local lock_timeout = '5s';
set local statement_timeout = '180s';

select pg_advisory_xact_lock(hashtext('SEC-02-rls-legacy-endurecimiento'));

set search_path = public;

-- ---------------------------------------------------------------------------
-- 1. Helpers tenant
-- ---------------------------------------------------------------------------

create or replace function public.sec_contrato_tenant_ok(p_id_contrato integer)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select p_id_contrato is not null
     and exists (
       select 1
       from public.contrato c
       where c.id_contrato = p_id_contrato
         and c.id_empresa = public.current_user_empresa_id()
     );
$$;

comment on function public.sec_contrato_tenant_ok(integer) is
  'SEC-02: true si el contrato pertenece al tenant del JWT.';

revoke all on function public.sec_contrato_tenant_ok(integer) from public;
grant execute on function public.sec_contrato_tenant_ok(integer) to authenticated, service_role;


create or replace function public.sec_persona_tenant_ok(p_id_persona integer)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select p_id_persona is not null
     and (
       exists (
         select 1
         from public.contrato c
         where c.id_persona = p_id_persona
           and c.id_empresa = public.current_user_empresa_id()
       )
       or not exists (
         select 1 from public.contrato c where c.id_persona = p_id_persona
       )
     );
$$;

comment on function public.sec_persona_tenant_ok(integer) is
  'SEC-02: tenant vía contrato; persona sin contrato visible solo durante alta (deuda documentada).';

revoke all on function public.sec_persona_tenant_ok(integer) from public;
grant execute on function public.sec_persona_tenant_ok(integer) to authenticated, service_role;


create or replace function public.sec_haberdescuento_persona_tenant_ok(
  p_id_contrato integer,
  p_id_persona integer
)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select (
    p_id_contrato is not null
    and public.sec_contrato_tenant_ok(p_id_contrato)
  ) or (
    p_id_persona is not null
    and public.sec_persona_tenant_ok(p_id_persona)
  );
$$;

comment on function public.sec_haberdescuento_persona_tenant_ok(integer, integer) is
  'SEC-02: haber/descuento por persona ligado a contrato o persona del tenant.';

revoke all on function public.sec_haberdescuento_persona_tenant_ok(integer, integer) from public;
grant execute on function public.sec_haberdescuento_persona_tenant_ok(integer, integer) to authenticated, service_role;


-- ---------------------------------------------------------------------------
-- 2. Utilidad: policies estándar por contrato / persona / tenant directo
-- ---------------------------------------------------------------------------

create or replace function public.sec_apply_contrato_tenant_policies(p_table regclass)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_table text := p_table::text;
  v_short text := replace(v_table, 'public.', '');
begin
  execute format('drop policy if exists empleados_alta_select on public.%I', v_short);
  execute format('drop policy if exists empleados_alta_insert on public.%I', v_short);
  execute format('drop policy if exists empleados_alta_update on public.%I', v_short);
  execute format('drop policy if exists empleados_alta_delete on public.%I', v_short);

  execute format(
    'create policy %I on public.%I for select to authenticated using (public.sec_contrato_tenant_ok(id_contrato))',
    v_short || '_select_tenant', v_short
  );
  execute format(
    'create policy %I on public.%I for insert to authenticated with check (public.sec_contrato_tenant_ok(id_contrato))',
    v_short || '_insert_tenant', v_short
  );
  execute format(
    'create policy %I on public.%I for update to authenticated using (public.sec_contrato_tenant_ok(id_contrato)) with check (public.sec_contrato_tenant_ok(id_contrato))',
    v_short || '_update_tenant', v_short
  );
  execute format(
    'create policy %I on public.%I for delete to authenticated using (public.sec_contrato_tenant_ok(id_contrato))',
    v_short || '_delete_tenant', v_short
  );
end;
$$;


create or replace function public.sec_apply_persona_tenant_policies(p_table regclass)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_table text := p_table::text;
  v_short text := replace(v_table, 'public.', '');
begin
  execute format('drop policy if exists empleados_alta_select on public.%I', v_short);
  execute format('drop policy if exists empleados_alta_insert on public.%I', v_short);
  execute format('drop policy if exists empleados_alta_update on public.%I', v_short);
  execute format('drop policy if exists empleados_alta_delete on public.%I', v_short);

  execute format(
    'create policy %I on public.%I for select to authenticated using (public.sec_persona_tenant_ok(id_persona))',
    v_short || '_select_tenant', v_short
  );
  execute format(
    'create policy %I on public.%I for insert to authenticated with check (public.sec_persona_tenant_ok(id_persona))',
    v_short || '_insert_tenant', v_short
  );
  execute format(
    'create policy %I on public.%I for update to authenticated using (public.sec_persona_tenant_ok(id_persona)) with check (public.sec_persona_tenant_ok(id_persona))',
    v_short || '_update_tenant', v_short
  );
  execute format(
    'create policy %I on public.%I for delete to authenticated using (public.sec_persona_tenant_ok(id_persona))',
    v_short || '_delete_tenant', v_short
  );
end;
$$;


create or replace function public.sec_apply_auth_only_policies(
  p_table regclass,
  p_legacy_prefix text,
  p_ops text[] default array['select', 'insert', 'update', 'delete']
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_short text := replace(p_table::text, 'public.', '');
  v_op text;
  v_legacy text;
begin
  foreach v_op in array p_ops loop
    v_legacy := case
      when p_legacy_prefix = 'parametros' then p_legacy_prefix || '_' || v_op || '_anon_authenticated'
      when p_legacy_prefix = 'catalogos' then p_legacy_prefix || '_select_anon_authenticated'
      when p_legacy_prefix = 'haberes_descuentos' then p_legacy_prefix || '_' || v_op
      else p_legacy_prefix || '_' || v_op
    end;
    execute format('drop policy if exists %I on public.%I', v_legacy, v_short);
  end loop;

  if 'select' = any(p_ops) then
    execute format(
      'create policy %I on public.%I for select to authenticated using (auth.role() = ''authenticated'')',
      v_short || '_select_authenticated', v_short
    );
  end if;
  if 'insert' = any(p_ops) then
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (auth.role() = ''authenticated'')',
      v_short || '_insert_authenticated', v_short
    );
  end if;
  if 'update' = any(p_ops) then
    execute format(
      'create policy %I on public.%I for update to authenticated using (auth.role() = ''authenticated'') with check (auth.role() = ''authenticated'')',
      v_short || '_update_authenticated', v_short
    );
  end if;
  if 'delete' = any(p_ops) then
    execute format(
      'create policy %I on public.%I for delete to authenticated using (auth.role() = ''authenticated'')',
      v_short || '_delete_authenticated', v_short
    );
  end if;
end;
$$;


create or replace function public.sec_apply_id_empresa_tenant_policies(p_table regclass)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_short text := replace(p_table::text, 'public.', '');
begin
  execute format('drop policy if exists catalogos_select_anon_authenticated on public.%I', v_short);

  execute format(
    'create policy %I on public.%I for select to authenticated using (id_empresa = public.current_user_empresa_id())',
    v_short || '_select_tenant', v_short
  );
  execute format(
    'create policy %I on public.%I for insert to authenticated with check (id_empresa = public.current_user_empresa_id())',
    v_short || '_insert_tenant', v_short
  );
  execute format(
    'create policy %I on public.%I for update to authenticated using (id_empresa = public.current_user_empresa_id()) with check (id_empresa = public.current_user_empresa_id())',
    v_short || '_update_tenant', v_short
  );
  execute format(
    'create policy %I on public.%I for delete to authenticated using (id_empresa = public.current_user_empresa_id())',
    v_short || '_delete_tenant', v_short
  );
end;
$$;


-- ---------------------------------------------------------------------------
-- 3. contrato (id_empresa directo)
-- ---------------------------------------------------------------------------

drop policy if exists empleados_alta_select on public.contrato;
drop policy if exists empleados_alta_insert on public.contrato;
drop policy if exists empleados_alta_update on public.contrato;
drop policy if exists empleados_alta_delete on public.contrato;

create policy contrato_select_tenant on public.contrato
  for select to authenticated
  using (id_empresa = public.current_user_empresa_id());

create policy contrato_insert_tenant on public.contrato
  for insert to authenticated
  with check (id_empresa = public.current_user_empresa_id());

create policy contrato_update_tenant on public.contrato
  for update to authenticated
  using (id_empresa = public.current_user_empresa_id())
  with check (id_empresa = public.current_user_empresa_id());

create policy contrato_delete_tenant on public.contrato
  for delete to authenticated
  using (id_empresa = public.current_user_empresa_id());


-- ---------------------------------------------------------------------------
-- 4. persona
-- ---------------------------------------------------------------------------

drop policy if exists empleados_alta_select on public.persona;
drop policy if exists empleados_alta_insert on public.persona;
drop policy if exists empleados_alta_update on public.persona;
drop policy if exists empleados_alta_delete on public.persona;

create policy persona_select_tenant on public.persona
  for select to authenticated
  using (public.sec_persona_tenant_ok(id_persona));

create policy persona_insert_authenticated on public.persona
  for insert to authenticated
  with check (public.current_user_empresa_id() is not null);

create policy persona_update_tenant on public.persona
  for update to authenticated
  using (public.sec_persona_tenant_ok(id_persona))
  with check (public.sec_persona_tenant_ok(id_persona));

create policy persona_delete_tenant on public.persona
  for delete to authenticated
  using (public.sec_persona_tenant_ok(id_persona));


-- ---------------------------------------------------------------------------
-- 5. Hijos de contrato (empleados_alta_*)
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
  contrato_tables text[] := array[
    'remuneracion', 'prevision', 'salud_trabajador', 'cuenta2_afp',
    'semana_corrida', 'zona_extrema', 'apv', 'contrato_centro_costo'
  ];
  persona_tables text[] := array['cuenta_bancaria'];
begin
  foreach t in array contrato_tables loop
    if to_regclass('public.' || t) is null then
      continue;
    end if;
    perform public.sec_apply_contrato_tenant_policies(('public.' || t)::regclass);
  end loop;

  foreach t in array persona_tables loop
    if to_regclass('public.' || t) is null then
      continue;
    end if;
    perform public.sec_apply_persona_tenant_policies(('public.' || t)::regclass);
  end loop;
end;
$$;


-- ---------------------------------------------------------------------------
-- 6. haberdescuento_persona
-- ---------------------------------------------------------------------------

drop policy if exists haberes_descuentos_select on public.haberdescuento_persona;
drop policy if exists haberes_descuentos_insert on public.haberdescuento_persona;
drop policy if exists haberes_descuentos_update on public.haberdescuento_persona;
drop policy if exists haberes_descuentos_delete on public.haberdescuento_persona;

create policy haberdescuento_persona_select_tenant on public.haberdescuento_persona
  for select to authenticated
  using (public.sec_haberdescuento_persona_tenant_ok(id_contrato, id_persona));

create policy haberdescuento_persona_insert_tenant on public.haberdescuento_persona
  for insert to authenticated
  with check (public.sec_haberdescuento_persona_tenant_ok(id_contrato, id_persona));

create policy haberdescuento_persona_update_tenant on public.haberdescuento_persona
  for update to authenticated
  using (public.sec_haberdescuento_persona_tenant_ok(id_contrato, id_persona))
  with check (public.sec_haberdescuento_persona_tenant_ok(id_contrato, id_persona));

create policy haberdescuento_persona_delete_tenant on public.haberdescuento_persona
  for delete to authenticated
  using (public.sec_haberdescuento_persona_tenant_ok(id_contrato, id_persona));


-- ---------------------------------------------------------------------------
-- 7. concepto + regla (catálogo global — authenticated only)
-- ---------------------------------------------------------------------------

drop policy if exists haberes_descuentos_select on public.concepto;
drop policy if exists haberes_descuentos_insert on public.concepto;
drop policy if exists haberes_descuentos_update on public.concepto;
drop policy if exists haberes_descuentos_delete on public.concepto;
drop policy if exists concepto_select_authenticated on public.concepto;
drop policy if exists concepto_insert_authenticated on public.concepto;
drop policy if exists concepto_update_authenticated on public.concepto;

select public.sec_apply_auth_only_policies('public.concepto'::regclass, 'haberes_descuentos');

drop policy if exists regla_concepto_calculo_select on public.regla_concepto_calculo;
drop policy if exists regla_concepto_select_authenticated on public.regla_concepto_calculo;

create policy regla_concepto_calculo_select_authenticated on public.regla_concepto_calculo
  for select to authenticated
  using (auth.role() = 'authenticated');


-- ---------------------------------------------------------------------------
-- 8. Parámetros (sin id_empresa — authenticated only, revoke anon)
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
  tables text[] := array[
    'parametros_generales',
    'parametros_generales_cliente',
    'parametros_legales',
    'afc_parametro',
    'trabajo_pesado_parametro',
    'reforma_previsional_parametro'
  ];
begin
  foreach t in array tables loop
    if to_regclass('public.' || t) is null then
      continue;
    end if;
    perform public.sec_apply_auth_only_policies(('public.' || t)::regclass, 'parametros');
  end loop;
end;
$$;


-- ---------------------------------------------------------------------------
-- 9. Catálogos legales globales (SELECT authenticated)
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
  tables text[] := array[
    'pais', 'region', 'provincia', 'comuna', 'ciudad',
    'tipo_trabajador', 'tipo_jornada', 'regimen_previsional',
    'entidad_previsional_ips', 'ex_caja_previsional', 'regimen_ex_caja',
    'periodo_remuneracion', 'afp', 'afp_vigencia', 'ips_ex_caja_tasa_basica',
    'salud', 'salud_plan', 'moneda', 'tramo_carga', 'tramo_impuesto',
    'tabla_impuesto_unico', 'institucion_apv', 'forma_pago_apv',
    'ley_16744_parametros', 'organismo_administrador_ley_16744',
    'ccaf_entidad', 'banco', 'tipo_cuenta_bancaria', 'zona_extrema_catalogo',
    'centro_costo', 'tipo_condicion_trabajador'
  ];
begin
  foreach t in array tables loop
    if to_regclass('public.' || t) is null then
      continue;
    end if;
    perform public.sec_apply_auth_only_policies(
      ('public.' || t)::regclass,
      'catalogos',
      array['select']
    );
  end loop;
end;
$$;


-- ---------------------------------------------------------------------------
-- 10. Organización con id_empresa
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
  tables text[] := array['sucursal', 'departamento_empresa'];
begin
  foreach t in array tables loop
    if to_regclass('public.' || t) is null then
      continue;
    end if;
    perform public.sec_apply_id_empresa_tenant_policies(('public.' || t)::regclass);
  end loop;
end;
$$;

drop policy if exists catalogos_select_anon_authenticated on public.empresa;

create policy empresa_select_tenant on public.empresa
  for select to authenticated
  using (id_empresa = public.current_user_empresa_id());

create policy empresa_update_tenant on public.empresa
  for update to authenticated
  using (id_empresa = public.current_user_empresa_id())
  with check (id_empresa = public.current_user_empresa_id());


-- ---------------------------------------------------------------------------
-- 11. Historial y condiciones de persona
-- ---------------------------------------------------------------------------

drop policy if exists empleado_historial_select on public.empleado_historial;
drop policy if exists empleado_historial_insert on public.empleado_historial;

create policy empleado_historial_select_tenant on public.empleado_historial
  for select to authenticated
  using (public.sec_persona_tenant_ok(id_persona));

create policy empleado_historial_insert_tenant on public.empleado_historial
  for insert to authenticated
  with check (public.sec_persona_tenant_ok(id_persona));

drop policy if exists persona_condicion_trabajador_select on public.persona_condicion_trabajador;
drop policy if exists persona_condicion_trabajador_insert on public.persona_condicion_trabajador;
drop policy if exists persona_condicion_trabajador_update on public.persona_condicion_trabajador;
drop policy if exists persona_condicion_trabajador_delete on public.persona_condicion_trabajador;

create policy persona_condicion_trabajador_select_tenant on public.persona_condicion_trabajador
  for select to authenticated
  using (public.sec_persona_tenant_ok(id_persona));

create policy persona_condicion_trabajador_insert_tenant on public.persona_condicion_trabajador
  for insert to authenticated
  with check (public.sec_persona_tenant_ok(id_persona));

create policy persona_condicion_trabajador_update_tenant on public.persona_condicion_trabajador
  for update to authenticated
  using (public.sec_persona_tenant_ok(id_persona))
  with check (public.sec_persona_tenant_ok(id_persona));

create policy persona_condicion_trabajador_delete_tenant on public.persona_condicion_trabajador
  for delete to authenticated
  using (public.sec_persona_tenant_ok(id_persona));

drop policy if exists tipo_condicion_trabajador_select_anon_authenticated on public.tipo_condicion_trabajador;
-- ya cubierto en catálogos globales si existe


-- ---------------------------------------------------------------------------
-- 12. Grants anon + FORCE RLS (tablas tocadas)
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
  tables text[] := array[
    'persona', 'contrato', 'remuneracion', 'prevision', 'salud_trabajador',
    'cuenta2_afp', 'semana_corrida', 'zona_extrema', 'apv', 'cuenta_bancaria',
    'contrato_centro_costo', 'haberdescuento_persona', 'concepto', 'regla_concepto_calculo',
    'parametros_generales', 'parametros_generales_cliente', 'parametros_legales',
    'afc_parametro', 'trabajo_pesado_parametro', 'reforma_previsional_parametro',
    'pais', 'region', 'provincia', 'comuna', 'ciudad', 'empresa', 'centro_costo',
    'sucursal', 'departamento_empresa', 'tipo_trabajador', 'tipo_jornada',
    'regimen_previsional', 'entidad_previsional_ips', 'ex_caja_previsional',
    'regimen_ex_caja', 'periodo_remuneracion', 'afp', 'afp_vigencia',
    'ips_ex_caja_tasa_basica', 'salud', 'salud_plan', 'moneda', 'tramo_carga',
    'tramo_impuesto', 'tabla_impuesto_unico', 'institucion_apv', 'forma_pago_apv',
    'ley_16744_parametros', 'organismo_administrador_ley_16744', 'ccaf_entidad',
    'banco', 'tipo_cuenta_bancaria', 'zona_extrema_catalogo', 'tipo_condicion_trabajador',
    'empleado_historial', 'persona_condicion_trabajador'
  ];
begin
  foreach t in array tables loop
    if to_regclass('public.' || t) is null then
      continue;
    end if;
    execute format('revoke all on public.%I from anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
  end loop;
end;
$$;

-- regla_concepto_calculo: solo lectura
revoke insert, update, delete on public.regla_concepto_calculo from authenticated;
grant select on public.regla_concepto_calculo to authenticated;


-- ---------------------------------------------------------------------------
-- 13. Smoke
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'contrato' and policyname = 'contrato_select_tenant'
  ) then
    raise exception 'SEC-02 smoke: falta contrato_select_tenant';
  end if;

  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'contrato' and policyname = 'empleados_alta_select'
  ) then
    raise exception 'SEC-02 smoke: policy legacy empleados_alta_select aun presente en contrato';
  end if;

  if exists (
    select 1 from information_schema.role_table_grants
    where grantee = 'anon' and table_schema = 'public' and table_name = 'persona'
  ) then
    raise exception 'SEC-02 smoke: anon aun tiene grants sobre persona';
  end if;
end;
$$;

notify pgrst, 'reload schema';

commit;
