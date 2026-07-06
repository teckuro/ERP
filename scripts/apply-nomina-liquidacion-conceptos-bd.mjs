/**
 * Aplica RPC generar_liquidaciones_nomina con materialización de conceptos.
 *
 * Uso: node scripts/apply-nomina-liquidacion-conceptos-bd.mjs
 */
import { execFileSync } from 'node:child_process';
import { config as loadEnv } from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
loadEnv({ path: path.join(root, '.env'), quiet: true });

const SQL_FILE = path.join(
  root,
  'supabase',
  'migrations',
  '20260706180000_nomina_liquidacion_conceptos.sql',
);

function main() {
  const dbUrl = (process.env.SUPABASE_DB_URL ?? process.env.SUPABASE_DB_URL_LOCAL ?? '').trim();
  if (!dbUrl) {
    console.error('[apply liq conceptos] FAIL: defina SUPABASE_DB_URL');
    process.exit(1);
  }
  if (!fs.existsSync(SQL_FILE)) {
    console.error(`[apply liq conceptos] FAIL: no existe ${SQL_FILE}`);
    process.exit(1);
  }

  console.log('[apply liq conceptos] Ejecutando migración F15-FIX…');
  execFileSync('psql', [dbUrl, '-v', 'ON_ERROR_STOP=1', '-f', SQL_FILE], { stdio: 'inherit' });
  console.log('[apply liq conceptos] OK');
}

main();
