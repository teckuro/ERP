/**
 * Inserta o reactiva plantilla mensual MES por empresa (F01 / F04).
 *
 * Uso: npm run reparar:plantilla-mes-bd
 */
import { execFileSync } from 'node:child_process';
import { config as loadEnv } from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
loadEnv({ path: path.join(root, '.env'), quiet: true });

const SQL_FILE = path.join(root, 'bd', 'scripts', 'reparar-plantilla-mes-nomina.sql');

function main() {
  const dbUrl = (process.env.SUPABASE_DB_URL ?? process.env.SUPABASE_DB_URL_LOCAL ?? '').trim();
  if (!dbUrl) {
    console.error('[reparar plantilla MES] FAIL: defina SUPABASE_DB_URL en .env');
    process.exit(1);
  }
  if (!fs.existsSync(SQL_FILE)) {
    console.error(`[reparar plantilla MES] FAIL: no existe ${SQL_FILE}`);
    process.exit(1);
  }

  console.log('[reparar plantilla MES] Aplicando plantilla mensual MES por empresa…');
  execFileSync('psql', [dbUrl, '-v', 'ON_ERROR_STOP=1', '-f', SQL_FILE], { stdio: 'inherit' });
  console.log('[reparar plantilla MES] OK');
}

main();
