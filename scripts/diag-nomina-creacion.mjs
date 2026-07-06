/**
 * Diagnóstico flujo crear nómina (preview + confirm + lectura).
 * Requiere E2E_SUPABASE_AUTH_EMAIL/PASSWORD o SERVICE_ROLE en .env
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';

loadEnv();

const periodo = process.argv[2] ?? '2026-07';
const cfg = JSON.parse(readFileSync(resolve('public/app-config.json'), 'utf8').replace(/^\uFEFF/, ''));
const url = (process.env.E2E_SUPABASE_URL ?? cfg.supabaseUrl ?? '').replace(/\/$/, '');
const anon = process.env.E2E_SUPABASE_ANON_KEY ?? cfg.supabaseAnonKey ?? '';
const service = process.env.E2E_SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

async function client() {
  if (service) {
    return createClient(url, service, { auth: { persistSession: false } });
  }
  const email = process.env.E2E_SUPABASE_AUTH_EMAIL ?? '';
  const password = process.env.E2E_SUPABASE_AUTH_PASSWORD ?? '';
  if (!email || !password) {
    throw new Error('Defina E2E_SUPABASE_AUTH_EMAIL/PASSWORD o SERVICE_ROLE_KEY');
  }
  const sb = createClient(url, anon, { auth: { persistSession: false } });
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  const user = (await sb.auth.getUser()).data.user;
  console.log('Usuario:', user?.email);
  console.log('app_metadata:', user?.app_metadata);
  return sb;
}

const sb = await client();

const preview = await sb.rpc('previsualizar_creacion_nomina', {
  p_periodo: periodo,
  p_tipo: 'mensual',
});
console.log('\n=== PREVIEW ===');
console.log('error:', preview.error);
if (preview.data) {
  console.log('puedeCrear:', preview.data.puedeCrear);
  console.log('totales:', preview.data.totales);
  console.log('fingerprint:', preview.data.fingerprint);
}

if (!preview.data?.puedeCrear) {
  process.exit(1);
}

const confirm = await sb.rpc('confirmar_creacion_nomina', {
  p_periodo: periodo,
  p_tipo: 'mensual',
  p_fingerprint: preview.data.fingerprint,
  p_codigo_ciclo: preview.data.codigoCiclo,
});
console.log('\n=== CONFIRM ===');
console.log('error:', confirm.error);
console.log('data:', confirm.data);

const id = confirm.data?.idNominaPeriodo;
if (id) {
  const cab = await sb.from('nomina_periodo').select('id, periodo, estado, id_empresa').eq('id', id).maybeSingle();
  console.log('\n=== CABECERA ===');
  console.log('error:', cab.error);
  console.log('data:', cab.data);

  const lista = await sb.from('nomina_periodo').select('id, periodo, estado').order('created_at', { ascending: false }).limit(3);
  console.log('\n=== LISTA ===');
  console.log('error:', lista.error);
  console.log('data:', lista.data);
}
