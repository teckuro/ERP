import { config } from 'dotenv';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

import { resolveParametrosDbUrl } from './lib/parametros-e2e-db.mjs';

config({ path: resolve(process.cwd(), '.env'), quiet: true });

const periodo = process.argv[2] ?? '2026-05';
const dbUrl = resolveParametrosDbUrl();

function psql(sql) {
  return execFileSync('psql', [dbUrl, '-At', '-c', sql], { encoding: 'utf8' }).trim();
}

console.log(`[diag] periodo=${periodo}`);
console.log('[diag] parametros_generales:', psql(
  `SELECT periodo||' uf='||coalesce(uf::text,'null')||' utm='||coalesce(utm::text,'null')||' sis='||coalesce(sis::text,'null')||' tope_afp='||coalesce(tope_afp::text,'null')||' tope_ips='||coalesce(tope_ips::text,'null')||' tope_ces='||coalesce(tope_cesantia::text,'null') FROM parametros_generales WHERE periodo='${periodo}';`,
));
console.log('[diag] cliente_config:', psql(
  `SELECT count(*)::text FROM parametros_generales_cliente WHERE periodo='${periodo}';`,
));
const tables = [
  'tramo_carga',
  'tramo_impuesto',
  'tabla_impuesto_unico',
  'ley_16744_parametros',
  'afc_parametro',
];

for (const table of tables) {
  try {
    console.log(`[diag] ${table}:`, psql(`SELECT count(*)::text FROM ${table} WHERE periodo='${periodo}';`));
  } catch (err) {
    console.log(`[diag] ${table}: error`, String(err.message ?? err).split('\n')[0]);
  }
}
console.log('[diag] afp:', psql('SELECT count(*)::text FROM afp;'));
console.log('[diag] salud isapre:', psql("SELECT count(*)::text FROM salud WHERE tipo='ISAPRE';"));
console.log('[diag] snapshots nomina:', psql(
  `SELECT coalesce(string_agg(id_calculo_periodo::text||':'||version_motor||':'||activo::text, ','), 'none') FROM nomina_calculo_periodo WHERE periodo='${periodo}';`,
));
