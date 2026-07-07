/**
 * Aplica migración NOM-AUSENCIA-01 (paridad F08 novedades).
 * Uso: npm run apply:nomina-ausencia-f08-bd
 */
import { execFileSync } from 'node:child_process';
import { config as loadEnv } from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
loadEnv({ path: path.join(root, '.env'), quiet: true });

const SQL_FILE = path.join(root, 'supabase', 'migrations', '20260707190000_novedad_ausencia_f08_parity.sql');

function main() {
  const dbUrl = (process.env.SUPABASE_DB_URL ?? process.env.SUPABASE_DB_URL_LOCAL ?? '').trim();
  if (!dbUrl) {
    console.error('[ausencia-f08] FAIL: defina SUPABASE_DB_URL en .env');
    process.exit(1);
  }
  if (!fs.existsSync(SQL_FILE)) {
    console.error(`[ausencia-f08] FAIL: no existe ${SQL_FILE}`);
    process.exit(1);
  }

  console.log('[ausencia-f08] Aplicando paridad F08 novedades (ausencias/licencias)…');
  execFileSync('psql', [dbUrl, '-v', 'ON_ERROR_STOP=1', '-f', SQL_FILE], {
    stdio: 'inherit',
    cwd: root,
  });
  console.log('[ausencia-f08] OK');
}

main();
