/**
 * Smoke — RPC registrar_exportacion_lre (LRE-01b).
 */
import { createClient } from '@supabase/supabase-js';
import { config as loadEnv } from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.resolve(__dirname, '..', '.env'), quiet: true });

function fail(msg) {
  console.error(`[smoke lre export persist] FAIL: ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`[smoke lre export persist] OK: ${msg}`);
}

function loadAppConfig() {
  const configPath = path.join(__dirname, '..', 'public', 'app-config.json');
  const raw = fs.readFileSync(configPath, 'utf8');
  const parsed = JSON.parse(raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw);
  return {
    supabaseUrl: (parsed.supabaseUrl ?? '').replace(/\/$/, ''),
    supabaseAnonKey: parsed.supabaseAnonKey ?? '',
  };
}

async function main() {
  const email = process.env['E2E_SUPABASE_AUTH_EMAIL'] ?? '';
  const password = process.env['E2E_SUPABASE_AUTH_PASSWORD'] ?? '';
  if (!email || !password) {
    fail('Defina E2E_SUPABASE_AUTH_EMAIL y E2E_SUPABASE_AUTH_PASSWORD en .env');
  }

  const { supabaseUrl, supabaseAnonKey } = loadAppConfig();
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error: signInErr } = await client.auth.signInWithPassword({ email, password });
  if (signInErr) fail(`Login → ${signInErr.message}`);
  ok(`Sesión ${email}`);

  const { data: periodo, error: perErr } = await client
    .from('nomina_liquidacion_periodo')
    .select('id_liquidacion_periodo, id_nomina_periodo')
    .eq('activo', true)
    .order('id_liquidacion_periodo', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (perErr) fail(`Lectura liquidación → ${perErr.message}`);
  if (!periodo) {
    console.warn('[smoke lre export persist] SKIP: no hay liquidaciones activas.');
    process.exit(0);
  }

  const { data: exportacion, error: rpcErr } = await client.rpc('registrar_exportacion_lre', {
    p_id_liquidacion_periodo: periodo.id_liquidacion_periodo,
    p_id_nomina_periodo: periodo.id_nomina_periodo,
    p_total_lineas: 1,
    p_total_trabajadores: 1,
    p_conceptos_sin_codigo: 0,
    p_canal: 'formato_dt_v1',
    p_metadata: { origen: 'smoke-lre-export-persist' },
  });

  if (rpcErr || !exportacion) {
    const missing =
      rpcErr?.code === 'PGRST202'
      || (rpcErr?.message ?? '').toLowerCase().includes('could not find the function');
    if (missing) {
      fail('RPC registrar_exportacion_lre no desplegada. Ejecute supabase db push.');
    }
    fail(`RPC registrar → ${rpcErr?.message ?? 'sin fila'}`);
  }

  if (exportacion.id_liquidacion_periodo !== periodo.id_liquidacion_periodo) {
    fail('RPC devolvió id_liquidacion_periodo distinto');
  }
  if (exportacion.canal !== 'formato_dt_v1') {
    fail(`Canal inesperado: ${exportacion.canal}`);
  }

  ok(`Exportación LRE registrada #${exportacion.id_lre_exportacion}`);
  process.exit(0);
}

main().catch((err) => fail(err?.message ?? String(err)));
