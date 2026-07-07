/**
 * Verifica esquema post-migración NOM-AUSENCIA-01.
 * Uso: node scripts/verify-nomina-ausencia-f08-bd.mjs
 */
import { execFileSync } from 'node:child_process';
import { config as loadEnv } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
loadEnv({ path: path.join(root, '.env'), quiet: true });

const dbUrl = (process.env.SUPABASE_DB_URL ?? process.env.SUPABASE_DB_URL_LOCAL ?? '').trim();
if (!dbUrl) {
  console.error('[verify ausencia-f08] FAIL: defina SUPABASE_DB_URL');
  process.exit(1);
}

const sql = `
SELECT column_name, is_nullable, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'novedad_remuneracion_periodo'
  AND column_name IN ('id_concepto', 'codigo_motivo_ausencia', 'id_licencia')
ORDER BY column_name;

SELECT codigo, nombre, es_licencia_medica
FROM public.motivo_ausencia
ORDER BY codigo;

SELECT conname
FROM pg_constraint
WHERE conrelid = 'public.novedad_remuneracion_periodo'::regclass
  AND conname IN ('chk_novedad_concepto_por_categoria', 'chk_novedad_unidad');
`;

execFileSync('psql', [dbUrl, '-v', 'ON_ERROR_STOP=1', '-c', sql], {
  stdio: 'inherit',
  cwd: root,
});

console.log('[verify ausencia-f08] OK');
