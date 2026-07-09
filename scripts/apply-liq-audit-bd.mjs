import { execFileSync } from 'node:child_process';
import { config as loadEnv } from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
loadEnv({ path: path.join(root, '.env'), quiet: true });

const VERSION = '20260709120000';
const MIGRATION = `${VERSION}_liq_revision_auditoria.sql`;

function dbUrl() {
  const url = (process.env.SUPABASE_DB_URL_LOCAL ?? process.env.SUPABASE_DB_URL ?? '').trim();
  if (!url) {
    console.error('[apply liq-audit] FAIL: defina SUPABASE_DB_URL_LOCAL o SUPABASE_DB_URL');
    process.exit(1);
  }
  return url;
}

function psql(args) {
  execFileSync('psql', [dbUrl(), ...args], { stdio: 'inherit', cwd: root });
}

function query(sql) {
  return execFileSync('psql', [dbUrl(), '-At', '-c', sql], { encoding: 'utf8', cwd: root }).trim();
}

function main() {
  const sqlPath = path.join(root, 'supabase', 'migrations', MIGRATION);
  if (!fs.existsSync(sqlPath)) {
    console.error(`[apply liq-audit] FAIL: no existe ${sqlPath}`);
    process.exit(1);
  }

  const applied = query(
    `select count(*) from supabase_migrations.schema_migrations where version = '${VERSION}'`,
  );
  if (applied === '1') {
    console.log(`[apply liq-audit] Migración ${VERSION} ya registrada.`);
    return;
  }

  const table = query("select coalesce(to_regclass('public.nomina_liquidacion_revision_evento')::text, '')");
  if (table) {
    console.log('[apply liq-audit] Tabla parcial detectada; limpiando objetos LIQ-AUDIT-01…');
    psql([
      '-v',
      'ON_ERROR_STOP=1',
      '-c',
      [
        'drop function if exists public.actualizar_estado_revision_liquidacion_trabajador(bigint, text, text);',
        'drop function if exists public.actualizar_estado_revision_liquidacion_trabajador(bigint, text);',
        'drop table if exists public.nomina_liquidacion_revision_evento cascade;',
        'drop function if exists public.erp_usuario_sesion_label();',
      ].join(' '),
    ]);
  }

  console.log(`[apply liq-audit] Aplicando ${MIGRATION}…`);
  psql(['-v', 'ON_ERROR_STOP=1', '-f', sqlPath]);

  try {
    execFileSync(
      'npx',
      ['supabase', 'migration', 'repair', VERSION, '--status', 'applied', '--linked'],
      { stdio: 'inherit', cwd: root, shell: true },
    );
  } catch {
    console.warn(
      `[apply liq-audit] WARN: repair omitido. Ejecute: npx supabase migration repair ${VERSION} --status applied --linked`,
    );
  }

  console.log('[apply liq-audit] OK');
}

main();
