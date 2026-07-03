/**
 * Rollback F21 — apaga feature gates Anexo B por tenant (no destructivo).
 *
 * Dry-run (default):
 *   node scripts/rollback-nomina-feature-gates.mjs --empresa-id=7
 *
 * Aplicar:
 *   node scripts/rollback-nomina-feature-gates.mjs --empresa-id=7 --confirm
 *
 * Requiere SUPABASE_DB_URL o DATABASE_URL con permisos de escritura en public.empresa.
 */
import { spawnSync } from 'node:child_process';
import { config as loadEnv } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.resolve(__dirname, '..', '.env'), quiet: true });

const GATES = [
  'nomina.anticipos.enabled',
  'nomina.extraordinaria.enabled',
  'nomina.rectificacion.enabled',
];

function parseArgs(argv) {
  let empresaId = null;
  let confirm = false;
  for (const arg of argv) {
    if (arg === '--confirm') confirm = true;
    else if (arg.startsWith('--empresa-id=')) empresaId = arg.slice('--empresa-id='.length);
  }
  return { empresaId, confirm };
}

function buildSql(idEmpresa) {
  const pairs = GATES.map((g) => `'${g}', false`).join(', ');
  return `
UPDATE public.empresa
SET feature_gates = coalesce(feature_gates, '{}'::jsonb)
  || jsonb_build_object(${pairs})
WHERE id_empresa = ${Number.parseInt(idEmpresa, 10)};
`.trim();
}

function main() {
  const { empresaId, confirm } = parseArgs(process.argv.slice(2));
  if (!empresaId || !/^\d+$/.test(empresaId)) {
    console.error('Uso: node scripts/rollback-nomina-feature-gates.mjs --empresa-id=<id> [--confirm]');
    process.exit(1);
  }

  const sql = buildSql(empresaId);
  console.log('[rollback nomina] SQL (apaga flags Anexo B, conserva datos):');
  console.log(sql);

  if (!confirm) {
    console.log('[rollback nomina] Dry-run. Agregue --confirm para ejecutar.');
    return;
  }

  const dbUrl = (process.env['SUPABASE_DB_URL'] ?? process.env['DATABASE_URL'] ?? '').trim();
  if (!dbUrl) {
    console.error('[rollback nomina] Defina SUPABASE_DB_URL o DATABASE_URL.');
    process.exit(1);
  }

  const res = spawnSync('psql', [dbUrl, '-v', 'ON_ERROR_STOP=1', '-c', sql], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  process.exit(res.status ?? (res.error ? 1 : 0));
}

main();
