/**
 * Repara cadena LRE en BD remota: conceptos canónicos, LRE en snapshot y líneas de liquidación.
 *
 * Uso: npm run repair:lre:cadena-bd
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { config as loadEnv } from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
loadEnv({ path: path.join(root, '.env'), quiet: true });

function fail(msg) {
  console.error(`[repair lre] FAIL: ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`[repair lre] OK: ${msg}`);
}

function warn(msg) {
  console.warn(`[repair lre] WARN: ${msg}`);
}

function dbUrl() {
  const url = (process.env.SUPABASE_DB_URL ?? process.env.SUPABASE_DB_URL_LOCAL ?? '').trim();
  if (!url) fail('Defina SUPABASE_DB_URL en .env');
  return url;
}

function psql(sql) {
  return execFileSync('psql', [dbUrl(), '-v', 'ON_ERROR_STOP=1', '-At', '-c', sql], {
    encoding: 'utf8',
  }).trim();
}

function runSqlFile(filePath) {
  console.log(`[repair lre] SQL ${path.basename(filePath)}…`);
  execFileSync('psql', [dbUrl(), '-v', 'ON_ERROR_STOP=1', '-f', filePath], { stdio: 'inherit' });
}

function runCheck(label, cmd, args) {
  console.log(`[repair lre] ${label}…`);
  const res = spawnSync(cmd, args, { stdio: 'inherit', cwd: root, shell: process.platform === 'win32' });
  return res.status === 0;
}

async function main() {
  const sql28 = path.join(root, 'bd', 'base', 'v11', 'partes', '28_lre_concepto_canonico.sql');
  if (!fs.existsSync(sql28)) fail(`No existe ${sql28}`);
  runSqlFile(sql28);

  const canon = psql(`
SELECT codigo || '→' || COALESCE((SELECT codigo_lre FROM catalogo_lre WHERE id_catalogo_lre = c.id_catalogo_lre), '')
FROM concepto c
WHERE codigo IN ('HORAS_EXTRAS','IMPUESTO_RENTA','SUELDO_BASE','AFP','SALUD','CESANTIA','BONO')
ORDER BY codigo`);
  ok(`Conceptos canónicos:\n${canon}`);

  const lineasLre = psql(`
SELECT COUNT(*) FROM nomina_liquidacion_concepto lc
JOIN nomina_liquidacion_trabajador lt ON lt.id_liquidacion_trabajador = lc.id_liquidacion_trabajador
JOIN nomina_liquidacion_periodo lp ON lp.id_liquidacion_periodo = lt.id_liquidacion_periodo
WHERE lp.activo AND lc.monto <> 0 AND COALESCE(TRIM(lc.codigo_lre),'') <> ''`);

  if (Number(lineasLre) === 0) {
    warn('Sin líneas LRE en liquidación activa tras backfill.');
  } else {
    ok(`${lineasLre} línea(s) liquidación con código LRE`);
  }

  const checksOk =
    runCheck('Diagnóstico BD', 'node', [path.join(__dirname, 'diag-lre-bd.mjs')])
    && runCheck('Smoke LRE', 'node', [path.join(__dirname, 'smoke-lre-exportacion.mjs')])
    && runCheck('Cadena LRE', 'node', [path.join(__dirname, 'seed-lre-export-chain.mjs'), 'verify']);

  ok('Reparación LRE finalizada.');
}

main().catch((e) => fail(e?.message ?? String(e)));
