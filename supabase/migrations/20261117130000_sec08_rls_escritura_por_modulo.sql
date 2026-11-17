-- SEC-08 (AUDIT-SEC-2026-11) — Escritura por módulo en tablas que solo validaban empresa
--
-- Problema (verificado 2026-11-17 con JWT simulado de rol consulta, en transacción revertida):
--   - 19 tablas con datos por empresa permitían INSERT/UPDATE/DELETE a cualquier
--     usuario de la empresa, sin importar su rol (el rol consulta podía modificar
--     nóminas, liquidaciones, empresa, licencias, movimientos...).
--   - 4 tablas de parámetros legales globales (parametros_legales, afc_parametro,
--     reforma_previsional_parametro, trabajo_pesado_parametro) permitían escritura a
--     CUALQUIER usuario autenticado, de cualquier empresa o sin empresa.
--   - novedad_remuneracion_periodo permitía leer y escribir a cualquier usuario
--     autenticado, sin filtro de empresa (no tiene id_empresa; se filtra por persona).
--   - nomina_liquidacion_concepto mantenía 2 políticas legadas permisivas
--     (auth.role() = 'authenticated') que anulaban las políticas por empresa
--     (las políticas permisivas se combinan con OR).
--
-- Cambio:
--   - A las políticas de escritura de cada tabla se agrega
--     `AND public.sec_permiso_modulo_escritura_ok('<modulo>')`.
--     Los roles admin/operador conservan su acceso (ver SEC-02d/SEC-07); el rol
--     consulta y los usuarios sin rol quedan sin escritura.
--   - Parámetros legales globales: escritura solo con permiso 'parametros' (admin).
--   - novedad_remuneracion_periodo: lectura y escritura acotadas a personas de la
--     empresa (sec_persona_tenant_ok) + permiso 'movimientos' para escribir.
--   - nomina_liquidacion_concepto: se eliminan las 2 políticas legadas.
--
-- Las RPC SECURITY DEFINER (cierre, cálculo, etc.) corren como owner y no se ven
-- afectadas por RLS; siguen validando permisos con erp_nomina_permiso_efectivo().

begin;

select pg_advisory_xact_lock(hashtext('SEC-08-rls-escritura-por-modulo'));

-- ---------------------------------------------------------------------
-- 1. Agregar permiso de módulo a las políticas de escritura existentes
-- ---------------------------------------------------------------------
do $$
declare
  v_map constant jsonb := jsonb_build_object(
    'empresa', 'empresas',
    'sucursal', 'empresas',
    'departamento_empresa', 'empresas',
    'nomina_periodo', 'nominas',
    'nomina_plantilla_ciclo', 'nominas',
    'nomina_preparacion', 'nominas',
    'nomina_preparacion_evento', 'nominas',
    'segmento_nomina', 'nominas',
    'nomina_calculo_periodo', 'nominas',
    'nomina_calculo_trabajador', 'nominas',
    'nomina_calculo_concepto', 'nominas',
    'nomina_calculo_issue', 'nominas',
    'nomina_calculo_trazabilidad', 'nominas',
    'nomina_liquidacion_trabajador', 'liquidaciones',
    'nomina_liquidacion_concepto', 'liquidaciones',
    'movimiento_nomina', 'movimientos',
    'movimiento_recurrente', 'movimientos',
    'haberdescuento_persona', 'movimientos',
    'licencia_medica', 'licencias',
    'persona_tramo_carga', 'empleados',
    'parametros_legales', 'parametros',
    'afc_parametro', 'parametros',
    'reforma_previsional_parametro', 'parametros',
    'trabajo_pesado_parametro', 'parametros'
  );
  v_pol record;
  v_modulo text;
  v_guard text;
  v_using text;
  v_check text;
  v_sql text;
  v_alteradas integer := 0;
begin
  -- Políticas legadas que anulan el filtro por empresa en líneas de liquidación.
  drop policy if exists nomina_liquidacion_select_authenticated on public.nomina_liquidacion_concepto;
  drop policy if exists nomina_liquidacion_insert_authenticated on public.nomina_liquidacion_concepto;

  for v_pol in
    select p.tablename, p.policyname, p.cmd, p.qual, p.with_check
    from pg_policies p
    where p.schemaname = 'public'
      and p.tablename = any (select jsonb_object_keys(v_map))
      and p.cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')
  loop
    v_modulo := v_map ->> v_pol.tablename;
    v_guard := format('public.sec_permiso_modulo_escritura_ok(%L)', v_modulo);

    -- Idempotente: no duplicar si la política ya valida el módulo.
    if coalesce(v_pol.qual, '') || coalesce(v_pol.with_check, '') ilike '%sec_permiso_modulo_escritura_ok%' then
      continue;
    end if;

    -- Las tablas globales de parámetros solo exigían auth.role() = 'authenticated':
    -- se reemplaza por el permiso del módulo.
    if v_modulo = 'parametros' then
      v_using := v_guard;
      v_check := v_guard;
    else
      v_using := case when v_pol.qual is null then null else format('(%s) and %s', v_pol.qual, v_guard) end;
      v_check := case when v_pol.with_check is null then null else format('(%s) and %s', v_pol.with_check, v_guard) end;
    end if;

    v_sql := format('alter policy %I on public.%I', v_pol.policyname, v_pol.tablename);
    if v_pol.cmd in ('UPDATE', 'DELETE', 'ALL') and v_using is not null then
      v_sql := v_sql || ' using (' || v_using || ')';
    end if;
    if v_pol.cmd in ('INSERT', 'UPDATE', 'ALL') and v_check is not null then
      v_sql := v_sql || ' with check (' || v_check || ')';
    end if;

    execute v_sql;
    v_alteradas := v_alteradas + 1;
  end loop;

  raise notice 'SEC-08: % políticas de escritura actualizadas', v_alteradas;
end;
$$;

-- ---------------------------------------------------------------------
-- 2. Personas: sin empresa en el JWT no hay acceso
--    (antes, una persona sin contratos era visible para cualquier autenticado,
--    incluso sin empresa; ahora exige empresa asignada por el servidor)
-- ---------------------------------------------------------------------
create or replace function public.sec_persona_tenant_ok(p_id_persona integer)
returns boolean
language sql
stable
set search_path = public
as $$
  select p_id_persona is not null
    and public.current_user_empresa_id() is not null
    and (
      exists (
        select 1 from public.contrato c
        where c.id_persona = p_id_persona
          and c.id_empresa = public.current_user_empresa_id()
      )
      or not exists (
        select 1 from public.contrato c
        where c.id_persona = p_id_persona
      )
    );
$$;

-- ---------------------------------------------------------------------
-- 3. novedad_remuneracion_periodo: acotar a contratos/personas de la empresa
-- ---------------------------------------------------------------------
drop policy if exists novedades_mensuales_select_authenticated on public.novedad_remuneracion_periodo;
drop policy if exists novedades_mensuales_insert_authenticated on public.novedad_remuneracion_periodo;
drop policy if exists novedades_mensuales_update_authenticated on public.novedad_remuneracion_periodo;

create policy novedades_mensuales_select_tenant
  on public.novedad_remuneracion_periodo
  for select to authenticated
  using (
    public.sec_contrato_tenant_ok(id_contrato)
    or (id_contrato is null and public.sec_persona_tenant_ok(id_persona))
  );

create policy novedades_mensuales_insert_tenant
  on public.novedad_remuneracion_periodo
  for insert to authenticated
  with check (
    (public.sec_contrato_tenant_ok(id_contrato) or (id_contrato is null and public.sec_persona_tenant_ok(id_persona)))
    and public.sec_permiso_modulo_escritura_ok('movimientos')
  );

create policy novedades_mensuales_update_tenant
  on public.novedad_remuneracion_periodo
  for update to authenticated
  using (
    (public.sec_contrato_tenant_ok(id_contrato) or (id_contrato is null and public.sec_persona_tenant_ok(id_persona)))
    and public.sec_permiso_modulo_escritura_ok('movimientos')
  )
  with check (
    (public.sec_contrato_tenant_ok(id_contrato) or (id_contrato is null and public.sec_persona_tenant_ok(id_persona)))
    and public.sec_permiso_modulo_escritura_ok('movimientos')
  );

-- ---------------------------------------------------------------------
-- 4. Verificación: ninguna política de escritura debe quedar en "cualquier autenticado"
-- ---------------------------------------------------------------------
do $$
declare
  v_pendientes text;
begin
  select string_agg(tablename || '.' || policyname, ', ')
  into v_pendientes
  from pg_policies
  where schemaname = 'public'
    and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')
    and (coalesce(qual, '') || ' ' || coalesce(with_check, '')) ~ 'auth\.role\(\) = ''authenticated''';

  if v_pendientes is not null then
    raise exception 'SEC-08: políticas de escritura abiertas a cualquier autenticado: %', v_pendientes;
  end if;
end;
$$;

notify pgrst, 'reload schema';

commit;
