/**
 * Smoke — persistencia RPC estado revisión liquidación trabajador (NOM-LIQ-ACTA).
 * Mutación mínima reversible sobre 1 fila existente; exit 0 = RPC + columna OK.
 */
import { createClient } from '@supabase/supabase-js';
import { config as loadEnv } from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.resolve(__dirname, '..', '.env'), quiet: true });

function fail(msg) {
  console.error(`[smoke liq estado] FAIL: ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`[smoke liq estado] OK: ${msg}`);
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
    .select('id_liquidacion_trabajador, estado_revision, metadata')
    .order('id_liquidacion_trabajador', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (readErr) fail(`Lectura trabajador → ${readErr.message}`);
  if (!fila) {
    console.warn('[smoke liq estado] SKIP: no hay filas en nomina_liquidacion_trabajador (generar liquidaciones primero).');
    process.exit(0);
  }

  const id = fila.id_liquidacion_trabajador;
  const previo = fila.estado_revision ?? null;
  const prueba = previo === 'autorizada' ? 'pago_registrado' : 'autorizada';

  const { data: actualizado, error: rpcErr } = await client.rpc(
    'actualizar_estado_revision_liquidacion_trabajador',
    { p_id_liquidacion_trabajador: id, p_estado_revision: prueba },
  );
  if (rpcErr || !actualizado) fail(`RPC actualizar → ${rpcErr?.message ?? 'sin fila'}`);
  if (actualizado.estado_revision !== prueba) {
    fail(`Columna estado_revision esperaba ${prueba}, recibió ${actualizado.estado_revision}`);
  }
  ok(`RPC persistió estado ${prueba} en trabajador ${id}`);

  const { data: releido, error: releErr } = await client
    .from('nomina_liquidacion_trabajador')
    .select('estado_revision, metadata')
    .eq('id_liquidacion_trabajador', id)
    .single();
  if (releErr || !releido) fail(`Relectura → ${releErr?.message ?? 'sin fila'}`);
  if (releido.estado_revision !== prueba) {
    fail(`Relectura columna: esperaba ${prueba}, recibió ${releido.estado_revision}`);
  }
  ok('Relectura columna coincide');

  const { error: restoreErr } = await client.rpc(
    'actualizar_estado_revision_liquidacion_trabajador',
    { p_id_liquidacion_trabajador: id, p_estado_revision: previo },
  );
  if (restoreErr) fail(`Restaurar estado previo → ${restoreErr.message}`);
  ok(`Estado restaurado a ${previo ?? 'null'}`);

  console.log('[smoke liq estado] Persistencia servidor verificada.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
