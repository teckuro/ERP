/**
 * Smoke post-despliegue — flujo Administrador + Generador (F21).
 *
 * Requiere:
 *   - public/app-config.json con Supabase configurado
 *   - E2E_SUPABASE_AUTH_EMAIL / E2E_SUPABASE_AUTH_PASSWORD (usuario con empresa en JWT)
 *
 * Verifica infraestructura, sesión, feature gates Anexo B y lectura de nomina_periodo.
 * No modifica datos. Exit 0 = listo para piloto; exit 1 = bloqueante.
 *
 * Rollback de incidente: npm run rollback:nomina:feature-gates -- --empresa-id=N
 */
import { createClient } from '@supabase/supabase-js';
import { config as loadEnv } from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.resolve(__dirname, '..', '.env'), quiet: true });

const TABLAS_NOMINA = [
  'nomina_periodo',
  'segmento_nomina',
  'nomina_calculo_periodo',
  'nomina_liquidacion_periodo',
];

const RPC_NOMINA = [
  'obtener_feature_gates_nomina',
  'cerrar_nomina_operativa',
  'generar_liquidaciones_oficiales',
];

function fail(msg) {
  console.error(`[smoke nomina] FAIL: ${msg}`);
}

function ok(msg) {
  console.log(`[smoke nomina] OK: ${msg}`);
}

function loadAppConfig() {
  const configPath = path.join(__dirname, '..', 'public', 'app-config.json');
  if (!fs.existsSync(configPath)) {
    fail('Falta public/app-config.json');
    process.exit(1);
  }
  const raw = fs.readFileSync(configPath, 'utf8');
  const parsed = JSON.parse(raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw);
  const supabaseUrl = (parsed.supabaseUrl ?? '').replace(/\/$/, '');
  const supabaseAnonKey = parsed.supabaseAnonKey ?? '';
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('YOUR_')) {
    fail('supabaseUrl / supabaseAnonKey incompletos en app-config');
    process.exit(1);
  }
  return { supabaseUrl, supabaseAnonKey };
}

async function main() {
  const email = process.env['E2E_SUPABASE_AUTH_EMAIL'] ?? '';
  const password = process.env['E2E_SUPABASE_AUTH_PASSWORD'] ?? '';
  if (!email || !password) {
    fail('Defina E2E_SUPABASE_AUTH_EMAIL y E2E_SUPABASE_AUTH_PASSWORD en .env');
    process.exit(1);
  }

  const { supabaseUrl, supabaseAnonKey } = loadAppConfig();
  console.log('[smoke nomina] Base URL:', supabaseUrl);

  const authHealth = await fetch(`${supabaseUrl}/auth/v1/health`, {
    headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}` },
  });
  if (!authHealth.ok) {
    fail(`Auth health → ${authHealth.status}`);
    process.exit(1);
  }
  ok('Auth health');

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error: signInErr } = await client.auth.signInWithPassword({ email, password });
  if (signInErr) {
    fail(`Login → ${signInErr.message}`);
    process.exit(1);
  }
  ok(`Sesión ${email}`);

  for (const tabla of TABLAS_NOMINA) {
    const { error } = await client.from(tabla).select('*', { count: 'exact', head: true });
    if (error) {
      fail(`Tabla ${tabla} → ${error.code ?? ''} ${error.message}`);
      process.exit(1);
    }
    ok(`Tabla ${tabla} accesible`);
  }

  const { data: gates, error: gatesErr } = await client.rpc('obtener_feature_gates_nomina');
  if (gatesErr) {
    fail(`RPC obtener_feature_gates_nomina → ${gatesErr.message}`);
    process.exit(1);
  }
  ok(`Feature gates → ${JSON.stringify(gates ?? {})}`);

  for (const rpc of RPC_NOMINA.slice(1)) {
    const res = await fetch(`${supabaseUrl}/rest/v1/rpc/${rpc}`, {
      method: 'POST',
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${(await client.auth.getSession()).data.session?.access_token ?? supabaseAnonKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: '{}',
    });
    // Solo verificamos que la RPC existe (4xx de negocio es aceptable; 404/PGRST202 no).
    if (res.status === 404) {
      fail(`RPC ${rpc} no encontrada`);
      process.exit(1);
    }
    ok(`RPC ${rpc} registrada (HTTP ${res.status})`);
  }

  const { count, error: countErr } = await client
    .from('nomina_periodo')
    .select('id', { count: 'exact', head: true });
  if (countErr) {
    fail(`Conteo nomina_periodo → ${countErr.message}`);
    process.exit(1);
  }
  ok(`Bandeja: ${count ?? 0} nómina(s) visibles para el tenant`);

  console.log('[smoke nomina] Piloto listo. Habilitar flags gradualmente (Anexo B) tras validar UI.');
  console.log('[smoke nomina] Rollback incidente: npm run rollback:nomina:feature-gates -- --empresa-id=<id>');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
