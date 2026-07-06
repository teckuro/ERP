/**
 * Aplica migración motivo_cierre en nomina_periodo.
 * Uso: npm run apply:nomina-motivo-cierre-bd
 */
import { execFileSync } from 'node:child_process';
import { config as loadEnv } from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
loadEnv({ path: path.join(root, '.env'), quiet: true });

const SQL_FILE = path.join(root, 'supabase', 'migrations', '20260706193000_nomina_motivo_cierre.sql');

function main() {
  const dbUrl = (process.env.SUPABASE_DB_URL ?? process.env.SUPABASE_DB_URL_LOCAL ?? '').trim();
  if (!dbUrl) {
    console.error('[motivo_cierre] FAIL: defina SUPABASE_DB_URL en .env');
    process.exit(1);
  }
  if (!fs.existsSync(SQL_FILE)) {
    console.error(`[motivo_cierre] FAIL: no existe ${SQL_FILE}`);
    process.exit(1);
  }

  console.log('[motivo_cierre] Aplicando columna en nomina_periodo…');
  execFileSync('psql', [dbUrl, '-v', 'ON_ERROR_STOP=1', '-f', SQL_FILE], {
    stdio: 'inherit',
    cwd: root,
  });
  console.log('[motivo_cierre] OK');
}

main();
