/**
 * Diagnóstico de conceptos asignables en Movimientos del mes.
 * Uso: node scripts/diag-conceptos-movimientos.mjs --periodo 2026-05
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';

loadEnv();

const periodoArg = process.argv.find((arg) => arg.startsWith('--periodo='))?.slice('--periodo='.length)
  ?? process.argv[process.argv.indexOf('--periodo') + 1]
  ?? '2026-05';

const cfg = JSON.parse(readFileSync(resolve('public/app-config.json'), 'utf8').replace(/^\uFEFF/, ''));
const url = (process.env.E2E_SUPABASE_URL ?? cfg.supabaseUrl ?? '').replace(/\/$/, '');
const service = process.env.E2E_SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const anon = process.env.E2E_SUPABASE_ANON_KEY ?? cfg.supabaseAnonKey ?? '';

const CODIGOS_RESERVADOS = ['SUELDO_BASE'];

function parseIsoDateOnly(value) {
  if (!value) return null;
  const d = new Date(`${String(value).slice(0, 10)}T12:00:00`);
  return Number.isFinite(d.getTime()) ? d : null;
}

function clasificarVigencia(row, ref) {
  if (!row.vigente) return 'NO_OPERATIVO';
  const ini = parseIsoDateOnly(row.vigencia_inicio);
  const fin = parseIsoDateOnly(row.vigencia_fin);
  const refDay = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  if (ini && refDay < ini) return 'FUTURO';
  if (fin && refDay > fin) return 'VENCIDO';
  return 'VIGENTE_PERIODO';
}

function esReservado(row) {
  const codigo = (row.codigo ?? '').trim().toUpperCase().replace(/[\s-]+/g, '_');
  return CODIGOS_RESERVADOS.includes(codigo);
}

function esAsignable(row, ref) {
  const tipo = (row.tipo ?? '').trim();
  if (tipo !== 'HABER' && tipo !== 'DESCUENTO') return { ok: false, motivo: `tipo ${tipo || '—'}` };
  if (row.es_sistema) return { ok: false, motivo: 'es_sistema' };
  if (row.calculo_automatico) return { ok: false, motivo: 'calculo_automatico' };
  if (!row.vigente) return { ok: false, motivo: 'no vigente' };
  const vig = clasificarVigencia(row, ref);
  if (vig === 'FUTURO' || vig === 'VENCIDO' || vig === 'NO_OPERATIVO') return { ok: false, motivo: vig };
  if (esReservado(row)) return { ok: false, motivo: 'reservado contrato' };
  return { ok: true, motivo: '' };
}

async function client() {
  if (service) {
    return createClient(url, service, { auth: { persistSession: false } });
  }
  const email = process.env.E2E_SUPABASE_AUTH_EMAIL ?? '';
  const password = process.env.E2E_SUPABASE_AUTH_PASSWORD ?? '';
  if (!email || !password) throw new Error('Defina SERVICE_ROLE o E2E_SUPABASE_AUTH_EMAIL/PASSWORD');
  const sb = createClient(url, anon, { auth: { persistSession: false } });
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return sb;
}

const sb = await client();
const ref = new Date(`${periodoArg.trim()}-01T12:00:00`);
const { data, error } = await sb
  .from('concepto')
  .select('id_concepto, codigo, nombre, tipo, es_sistema, calculo_automatico, vigente, vigencia_inicio, vigencia_fin')
  .order('codigo');

if (error) {
  console.error('Error leyendo concepto:', error.message);
  process.exit(1);
}

console.log(`\nConceptos Movimientos — período ${periodoArg}\n`);
console.log('ASIGNABLE | CODIGO | NOMBRE | MOTIVO_NO');
console.log('----------|--------|--------|----------');

let asignables = 0;
for (const row of data ?? []) {
  const { ok, motivo } = esAsignable(row, ref);
  if (ok) asignables += 1;
  console.log(`${ok ? 'SI' : 'NO '}       | ${row.codigo} | ${row.nombre} | ${motivo}`);
}

console.log(`\nTotal asignables: ${asignables} / ${(data ?? []).length}`);
