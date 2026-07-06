/**
 * Aplica migración PREVIRED-02 (campo_archivo + canal 105 posiciones).
 * Uso: npm run apply:previred-105-bd
 */
import { execFileSync } from 'node:child_process';
import { config as loadEnv } from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
loadEnv({ path: path.join(root, '.env'), quiet: true });

const SQL_FILE = path.join(root, 'supabase', 'migrations', '20260706200000_previred_105_posicion.sql');

function main() {
  const dbUrl = (process.env.SUPABASE_DB_URL ?? process.env.SUPABASE_DB_URL_LOCAL ?? '').trim();
  if (!dbUrl) {
    console.error('[previred-105] FAIL: defina SUPABASE_DB_URL en .env');
    process.exit(1);
  }
  if (!fs.existsSync(SQL_FILE)) {
    console.error(`[previred-105] FAIL: no existe ${SQL_FILE}`);
    process.exit(1);
  }

  console.log('[previred-105] Aplicando campo_archivo y canal archivo_oficial_105_posicion…');
  execFileSync('psql', [dbUrl, '-v', 'ON_ERROR_STOP=1', '-f', SQL_FILE], {
    stdio: 'inherit',
    cwd: root,
  });
  console.log('[previred-105] OK');
}

main();
