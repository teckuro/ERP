/**
 * Aplica migración SEC-02e (RLS escritura por rol en parámetros, conceptos, empleados).
 * Uso: npm run apply:sec02e-bd
 */
import { execFileSync } from 'node:child_process';
import { config as loadEnv } from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
loadEnv({ path: path.join(root, '.env'), quiet: true });

const MIGRATION = '20260708280000_sec02e_rls_modulos_por_rol.sql';
const SQL_FILE = path.join(root, 'supabase', 'migrations', MIGRATION);

function main() {
  const dbUrl = (process.env.SUPABASE_DB_URL_LOCAL ?? process.env.SUPABASE_DB_URL ?? '').trim();
  if (!dbUrl) {
    console.error('[sec02e] FAIL: defina SUPABASE_DB_URL_LOCAL o SUPABASE_DB_URL en .env');
    process.exit(1);
  }
  if (!fs.existsSync(SQL_FILE)) {
    console.error(`[sec02e] FAIL: no existe ${SQL_FILE}`);
    process.exit(1);
  }

  console.log('[sec02e] Aplicando RLS escritura por rol (parámetros, conceptos, empleados)…');
  execFileSync('psql', [dbUrl, '-v', 'ON_ERROR_STOP=1', '-f', SQL_FILE], {
    stdio: 'inherit',
    cwd: root,
  });

  const version = MIGRATION.replace(/_.*$/, '');
  try {
    execFileSync(
      'npx',
      ['supabase', 'migration', 'repair', version, '--status', 'applied', '--linked'],
      { stdio: 'inherit', cwd: root, shell: true },
    );
    console.log(`[sec02e] migration repair ${version} OK`);
  } catch {
    console.warn(
      `[sec02e] WARN: migration repair omitido (ejecute manual: npx supabase migration repair ${version} --status applied --linked)`,
    );
  }

  console.log('[sec02e] OK');
}

main();
