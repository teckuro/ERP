/**
 * Repara claim id_empresa en auth.users (F03b) para sesiones sin empresa en JWT.
 *
 * Uso: npm run reparar:jwt-empresa-bd
 * Tras ejecutar: cerrar sesión y volver a iniciar en el ERP.
 */
import { execFileSync } from 'node:child_process';
import { config as loadEnv } from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
loadEnv({ path: path.join(root, '.env'), quiet: true });

const SQL_FILE = path.join(root, 'bd', 'scripts', 'reparar-jwt-id-empresa.sql');

function main() {
  const dbUrl = (process.env.SUPABASE_DB_URL ?? process.env.SUPABASE_DB_URL_LOCAL ?? '').trim();
  if (!dbUrl) {
    console.error('[reparar JWT empresa] FAIL: defina SUPABASE_DB_URL en .env');
    process.exit(1);
  }
  if (!fs.existsSync(SQL_FILE)) {
    console.error(`[reparar JWT empresa] FAIL: no existe ${SQL_FILE}`);
    process.exit(1);
  }

  console.log('[reparar JWT empresa] Aplicando id_empresa en auth.users…');
  execFileSync('psql', [dbUrl, '-v', 'ON_ERROR_STOP=1', '-f', SQL_FILE], { stdio: 'inherit' });
  console.log('[reparar JWT empresa] OK — cierre sesión y vuelva a entrar en el ERP.');
}

main();
