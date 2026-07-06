/**
 * Limpieza de empleados (persona + dependencias) para scripts Node.
 * Requiere SUPABASE_DB_URL (o _LOCAL) + psql para borrar contrato/persona (trigger auditoría).
 */

import { createClient } from '@supabase/supabase-js';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export function normalizeSupabaseUrl(raw) {
  return (raw ?? '').replace(/\/$/, '').replace('.supabase.com', '.supabase.co');
}

export function resolveDbUrl() {
  if (process.env.SUPABASE_DB_URL) return process.env.SUPABASE_DB_URL;
  if (process.env.SUPABASE_DB_URL_LOCAL) return process.env.SUPABASE_DB_URL_LOCAL;
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const envPath = resolve(process.cwd(), '.env');
  if (!existsSync(envPath)) return '';

  const lines = readFileSync(envPath, 'utf8').split(/\r?\n/);
  let remote = '';
  let local = '';
  for (const line of lines) {
    if (/^\s*#/.test(line)) continue;
    const remoteMatch = line.match(/^\s*SUPABASE_DB_URL\s*=\s*(.+)\s*$/);
    if (remoteMatch) remote = remoteMatch[1].trim().replace(/^['"]|['"]$/g, '');
    const localMatch = line.match(/^\s*SUPABASE_DB_URL_LOCAL\s*=\s*(.+)\s*$/);
    if (localMatch) local = localMatch[1].trim().replace(/^['"]|['"]$/g, '');
  }
  return remote || local || '';
}

function limpiarContratoPersonaConPsql(dbUrl, personaIds) {
  const safeIds = personaIds.filter((id) => Number.isInteger(id) && id > 0);
  if (safeIds.length === 0) return;

  const list = safeIds.join(',');
  const sql = `
BEGIN;
ALTER TABLE public.contrato DISABLE TRIGGER USER;
ALTER TABLE public.persona DISABLE TRIGGER USER;
DELETE FROM public.empleado_historial WHERE id_persona IN (${list});
DELETE FROM public.novedad_remuneracion_periodo WHERE id_persona IN (${list});
DELETE FROM public.movimiento_variable_mensual WHERE id_persona IN (${list});
DELETE FROM public.movimiento WHERE id_persona IN (${list});
DELETE FROM public.haberdescuento_persona WHERE id_persona IN (${list});
DELETE FROM public.cuenta_bancaria WHERE id_persona IN (${list});
DELETE FROM public.ficha_validacion_resumen WHERE id_persona IN (${list});
DELETE FROM public.persona_tramo_carga WHERE id_persona IN (${list});
DELETE FROM public.persona_condicion_trabajador WHERE id_persona IN (${list});
DELETE FROM public.prestamo WHERE id_persona IN (${list});
DELETE FROM public.nomina_calculo_concepto
  WHERE id_calculo_trabajador IN (
    SELECT id_calculo_trabajador FROM public.nomina_calculo_trabajador WHERE id_persona IN (${list})
  );
DELETE FROM public.nomina_calculo_issue
  WHERE id_calculo_trabajador IN (
    SELECT id_calculo_trabajador FROM public.nomina_calculo_trabajador WHERE id_persona IN (${list})
  );
DELETE FROM public.nomina_calculo_trazabilidad
  WHERE id_calculo_trabajador IN (
    SELECT id_calculo_trabajador FROM public.nomina_calculo_trabajador WHERE id_persona IN (${list})
  );
DELETE FROM public.nomina_calculo_trabajador WHERE id_persona IN (${list});
DELETE FROM public.contrato WHERE id_persona IN (${list});
DELETE FROM public.persona WHERE id_persona IN (${list});
ALTER TABLE public.contrato ENABLE TRIGGER USER;
ALTER TABLE public.persona ENABLE TRIGGER USER;
COMMIT;
`;

  execFileSync('psql', [dbUrl, '-v', 'ON_ERROR_STOP=1', '-c', sql], { encoding: 'utf8' });
}

export function loadAppConfig() {
  const raw = readFileSync(resolve(process.cwd(), 'public', 'app-config.json'), 'utf8').replace(/^\uFEFF/, '');
  const parsed = JSON.parse(raw);
  return {
    supabaseUrl: normalizeSupabaseUrl(process.env.E2E_SUPABASE_URL ?? parsed.supabaseUrl ?? ''),
    supabaseAnonKey: process.env.E2E_SUPABASE_ANON_KEY ?? parsed.supabaseAnonKey ?? '',
  };
}

export async function createSupabaseScriptClient() {
  const { supabaseUrl, supabaseAnonKey } = loadAppConfig();
  const serviceRoleKey = process.env.E2E_SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

  if (!supabaseUrl) {
    throw new Error('Falta supabaseUrl en app-config.json o E2E_SUPABASE_URL');
  }

  if (serviceRoleKey) {
    return createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  const email = process.env.E2E_SUPABASE_AUTH_EMAIL ?? '';
  const password = process.env.E2E_SUPABASE_AUTH_PASSWORD ?? '';

  if (!supabaseAnonKey) {
    throw new Error('Falta supabaseAnonKey en app-config.json o E2E_SUPABASE_ANON_KEY');
  }
  if (!email || !password) {
    throw new Error(
      'Define E2E_SUPABASE_AUTH_EMAIL y E2E_SUPABASE_AUTH_PASSWORD en .env, o E2E_SUPABASE_SERVICE_ROLE_KEY.',
    );
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Login Supabase: ${error.message}`);
  if (!data.session) throw new Error('Sin sesion Supabase tras login.');

  return supabase;
}

async function deleteByIn(supabase, table, column, values, { optional = false } = {}) {
  const unique = [...new Set(values)].filter((v) => Number.isFinite(v));
  if (unique.length === 0) return;

  const chunkSize = 100;
  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize);
    const { error } = await supabase.from(table).delete().in(column, chunk);
    if (error) {
      if (optional) {
        console.warn(`  (omitido ${table}: ${error.message})`);
        return;
      }
      throw new Error(`No se pudo limpiar ${table}: ${error.message}`);
    }
  }
}

export async function fetchAllPersonaIds(supabase) {
  const ids = [];
  const pageSize = 500;
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from('persona')
      .select('id_persona')
      .order('id_persona')
      .range(from, from + pageSize - 1);

    if (error) throw new Error(`No se pudieron listar personas: ${error.message}`);
    if (!data?.length) break;

    ids.push(...data.map((row) => Number(row.id_persona)).filter(Number.isFinite));
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return ids;
}

export async function limpiarEmpleadosPorPersonas(supabase, personaIds, { log = console.log } = {}) {
  if (personaIds.length === 0) return;

  const { data: contratos, error: contratosError } = await supabase
    .from('contrato')
    .select('id_contrato')
    .in('id_persona', personaIds);
  if (contratosError) throw new Error(`contrato: ${contratosError.message}`);

  const contratoIds = (contratos ?? []).map((r) => Number(r.id_contrato)).filter(Number.isFinite);

  const { data: liquidaciones } =
    contratoIds.length > 0
      ? await supabase.from('liquidacion').select('id_liquidacion').in('id_contrato', contratoIds)
      : { data: [], error: null };
  const liquidacionIds = (liquidaciones ?? [])
    .map((r) => Number(r.id_liquidacion))
    .filter(Number.isFinite);

  const { data: calculos } = await supabase
    .from('nomina_calculo_trabajador')
    .select('id_calculo_trabajador')
    .in('id_persona', personaIds);
  const calculoIds = (calculos ?? []).map((r) => Number(r.id_calculo_trabajador)).filter(Number.isFinite);

  await deleteByIn(supabase, 'nomina_calculo_concepto', 'id_calculo_trabajador', calculoIds);
  await deleteByIn(supabase, 'nomina_calculo_issue', 'id_calculo_trabajador', calculoIds);
  await deleteByIn(supabase, 'nomina_calculo_trazabilidad', 'id_calculo_trabajador', calculoIds);
  await deleteByIn(supabase, 'nomina_calculo_trabajador', 'id_calculo_trabajador', calculoIds);

  await deleteByIn(supabase, 'liquidacion_detalle', 'id_liquidacion', liquidacionIds);
  await deleteByIn(supabase, 'liquidacion', 'id_liquidacion', liquidacionIds);

  await deleteByIn(supabase, 'movimiento_variable_mensual', 'id_persona', personaIds);
  await deleteByIn(supabase, 'movimiento', 'id_persona', personaIds);
  await deleteByIn(supabase, 'haberdescuento_persona', 'id_persona', personaIds);
  await deleteByIn(supabase, 'cuenta_bancaria', 'id_persona', personaIds);
  await deleteByIn(supabase, 'ficha_validacion_resumen', 'id_persona', personaIds);
  await deleteByIn(supabase, 'empleado_historial', 'id_persona', personaIds);
  await deleteByIn(supabase, 'empleado_historial', 'id_contrato', contratoIds);

  await deleteByIn(supabase, 'contrato_centro_costo', 'id_contrato', contratoIds);
  await deleteByIn(supabase, 'remuneracion', 'id_contrato', contratoIds);
  await deleteByIn(supabase, 'prevision', 'id_contrato', contratoIds);
  await deleteByIn(supabase, 'salud_trabajador', 'id_contrato', contratoIds);
  await deleteByIn(supabase, 'cuenta2_afp', 'id_contrato', contratoIds);
  await deleteByIn(supabase, 'apv', 'id_contrato', contratoIds);
  await deleteByIn(supabase, 'finiquito', 'id_contrato', contratoIds);
  await deleteByIn(supabase, 'anexo_contrato', 'id_contrato', contratoIds);

  const dbUrl = resolveDbUrl();
  if (!dbUrl) {
    throw new Error(
      'No se puede borrar contrato/persona: el trigger de auditoria bloquea DELETE via API. ' +
        'Define SUPABASE_DB_URL en .env y ten psql instalado, o borra manualmente en BD.',
    );
  }

  log('  Borrando contrato y persona via psql (triggers deshabilitados)...');
  limpiarContratoPersonaConPsql(dbUrl, personaIds);
}
