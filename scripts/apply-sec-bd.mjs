/**
 * Aplica la cadena SEC/ADMIN en orden (08220000…08280000).
 * Usa SUPABASE_DB_URL_LOCAL si existe; si no, SUPABASE_DB_URL.
 *
 * Uso: npm run apply:sec-bd
 */
import { execFileSync } from 'node:child_process';
import { config as loadEnv } from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
loadEnv({ path: path.join(root, '.env'), quiet: true });

const MIGRATIONS = [
  '20260708220000_administracion_perfiles_config_doc.sql',
  '20260708230000_sec03_snapshot_tenant_rls.sql',
  '20260708240000_sec02_rls_legacy_endurecimiento.sql',
  '20260708250000_sec02b_rls_nomina_movvar_anon.sql',
  '20260708260000_sec02c_revoke_anon_rpc.sql',
  '20260708270000_sec02d_rls_movvar_por_rol.sql',
  '20260708280000_sec02e_rls_modulos_por_rol.sql',
];

function dbUrl() {
  const url = (process.env.SUPABASE_DB_URL_LOCAL ?? process.env.SUPABASE_DB_URL ?? '').trim();
  if (!url) {
    console.error('[apply sec] FAIL: defina SUPABASE_DB_URL_LOCAL o SUPABASE_DB_URL');
    process.exit(1);
  }
  return url;
}

function psql(sql, { file } = {}) {
  const args = [dbUrl(), '-v', 'ON_ERROR_STOP=1'];
  if (file) {
    args.push('-f', file);
  } else {
    args.push('-c', sql);
  }
  execFileSync('psql', args, { stdio: 'inherit', cwd: root });
}

function appliedVersions() {
  const sql = `
    select coalesce(string_agg(version, ',' order by version), '')
    from supabase_migrations.schema_migrations
    where version like '202607082%';
  `;
  const out = execFileSync('psql', [dbUrl(), '-At', '-c', sql], { encoding: 'utf8' }).trim();
  return new Set(out ? out.split(',') : []);
}

function repair(version) {
  try {
    execFileSync(
      'npx',
      ['supabase', 'migration', 'repair', version, '--status', 'applied', '--linked'],
      { stdio: 'inherit', cwd: root, shell: true },
    );
    console.log(`[apply sec] repair ${version} OK`);
  } catch {
    console.warn(
      `[apply sec] WARN: repair omitido para ${version} (ejecute: npx supabase migration repair ${version} --status applied --linked)`,
    );
  }
}

function main() {
  const applied = appliedVersions();
  const target = dbUrl().includes('localhost') || dbUrl().includes('127.0.0.1')
    ? 'local'
    : 'remota';
  console.log(`[apply sec] BD ${target}; ${applied.size}/${MIGRATIONS.length} migraciones SEC ya registradas.`);

  for (const file of MIGRATIONS) {
    const version = file.slice(0, 14);
    const sqlPath = path.join(root, 'supabase', 'migrations', file);
    if (!fs.existsSync(sqlPath)) {
      console.error(`[apply sec] FAIL: no existe ${sqlPath}`);
      process.exit(1);
    }
    if (applied.has(version)) {
      console.log(`[apply sec] skip ${version} (ya aplicada)`);
      continue;
    }
    console.log(`[apply sec] aplicando ${file}…`);
    psql(null, { file: sqlPath });
    repair(version);
    applied.add(version);
  }

  console.log('[apply sec] OK — cadena SEC completa.');
}

main();
