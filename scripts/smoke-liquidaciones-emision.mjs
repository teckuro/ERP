/**
 * Smoke — RPC emitir_liquidacion_trabajador (LIQ-01b).
 * Registra emisión de prueba y verifica fila en nomina_liquidacion_emision.
 */
import { createClient } from '@supabase/supabase-js';
import { config as loadEnv } from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.resolve(__dirname, '..', '.env'), quiet: true });

function fail(msg) {
  console.error(`[smoke liq emision] FAIL: ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`[smoke liq emision] OK: ${msg}`);
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

  const { data: fila, error: readErr } = await client
    .from('nomina_liquidacion_trabajador')
    .select('id_liquidacion_trabajador, id_liquidacion_periodo')
    .order('id_liquidacion_trabajador', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (readErr) fail(`Lectura trabajador → ${readErr.message}`);
  if (!fila) {
    console.warn('[smoke liq emision] SKIP: no hay filas en nomina_liquidacion_trabajador.');
    process.exit(0);
  }

  const id = fila.id_liquidacion_trabajador;
  const { data: emision, error: rpcErr } = await client.rpc('emitir_liquidacion_trabajador', {
    p_id_liquidacion_trabajador: id,
    p_canal: 'vista_oficial',
    p_metadata: { origen: 'smoke-liq-emision' },
  });

  if (rpcErr || !emision) {
    const missing =
      rpcErr?.code === 'PGRST202'
      || (rpcErr?.message ?? '').toLowerCase().includes('could not find the function');
    if (missing) {
      fail('RPC emitir_liquidacion_trabajador no desplegada. Ejecute supabase db push.');
    }
    fail(`RPC emitir → ${rpcErr?.message ?? 'sin fila'}`);
  }

  if (emision.id_liquidacion_trabajador !== id) {
    fail('RPC devolvió id_liquidacion_trabajador distinto');
  }
  ok(`Emisión ${emision.id_liquidacion_emision} registrada para trabajador ${id}`);

  const { data: releido, error: releErr } = await client
    .from('nomina_liquidacion_emision')
    .select('id_liquidacion_emision, canal, version_liquidacion')
    .eq('id_liquidacion_emision', emision.id_liquidacion_emision)
    .single();

  if (releErr || !releido) fail(`Relectura emisión → ${releErr?.message ?? 'sin fila'}`);
  if (releido.canal !== 'vista_oficial') fail(`Canal esperado vista_oficial, recibió ${releido.canal}`);
  ok('Relectura tabla nomina_liquidacion_emision coincide');

  console.log('[smoke liq emision] Auditoría de emisión verificada.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
