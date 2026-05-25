/**
 * Fixture BD para E2E de parámetros (periodo aislado, p. ej. 2099-06).
 *
 * Uso:
 *   node scripts/seed-parametros-e2e-fixture.mjs --purge --periodo 2099-06
 *   node scripts/seed-parametros-e2e-fixture.mjs --apply-oficial --periodo 2026-06 --uf 38100
 *   node scripts/seed-parametros-e2e-fixture.mjs --reset-reconciliacion --periodo 2026-06
 *
 * Requiere psql y SUPABASE_DB_URL_LOCAL / DATABASE_URL / SUPABASE_DB_URL.
 */
import { config } from 'dotenv';
import { resolve } from 'node:path';

import {
  E2E_PARAMETROS_PERIODO_DEFAULT,
  applyOficialParametrosGenerales,
  resetClienteReconciliacionEstado,
  ensurePeriodoRemuneracionAbierto,
  parsePeriodoYm,
  purgeParametrosPeriodo,
  resolveParametrosDbUrl,
} from './lib/parametros-e2e-db.mjs';

function periodoVecinos(periodo) {
  const [y, m] = periodo.split('-').map(Number);
  const prev = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
  const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
  return [prev, next];
}

config({ path: resolve(process.cwd(), '.env'), quiet: true });

function argValue(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1 || idx + 1 >= process.argv.length) {
    return null;
  }
  return process.argv[idx + 1];
}

const periodo = argValue('--periodo') ?? E2E_PARAMETROS_PERIODO_DEFAULT;
const purge = process.argv.includes('--purge');
const applyOficial = process.argv.includes('--apply-oficial');
const resetReconciliacion = process.argv.includes('--reset-reconciliacion');
const uf = Number(argValue('--uf') ?? '38100');

try {
  parsePeriodoYm(periodo);
} catch (err) {
  console.error(String(err.message ?? err));
  process.exit(1);
}

const dbUrl = resolveParametrosDbUrl();

console.log(`[seed parametros e2e] periodo=${periodo}`);

if (purge) {
  console.log('[seed parametros e2e] purge periodo...');
  purgeParametrosPeriodo(dbUrl, periodo);
}

ensurePeriodoRemuneracionAbierto(dbUrl, periodo);
// Periodos vecinos para forzar recarga en E2E (cambio de mes en UI).
for (const vecino of periodoVecinos(periodo)) {
  ensurePeriodoRemuneracionAbierto(dbUrl, vecino);
}
console.log('[seed parametros e2e] periodo_remuneracion listo.');

if (resetReconciliacion) {
  console.log('[seed parametros e2e] reset estado reconciliacion cliente...');
  resetClienteReconciliacionEstado(dbUrl, periodo);
}

if (applyOficial) {
  console.log(`[seed parametros e2e] carga oficial parametros_generales (uf=${uf})...`);
  await applyOficialParametrosGenerales(dbUrl, periodo, { uf });
  console.log('[seed parametros e2e] oficial aplicado.');
}

console.log('[seed parametros e2e] OK.');
