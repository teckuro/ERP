/**
 * Aplica catálogo LRE oficial y cierre de conceptos en BD remota.
 *
 * Uso: node scripts/apply-lre-catalogo-bd.mjs
 *
 * Requiere SUPABASE_DB_URL (o SUPABASE_DB_URL_LOCAL) y psql en PATH.
 */
import { execFileSync } from 'node:child_process';
import { config as loadEnv } from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
loadEnv({ path: path.resolve(root, '.env'), quiet: true });

const PARTES = [
  '24_lre_catalogo_oficial.sql',
  '25_lre_concept_rules.sql',
  '27_lre_concepto_cierre.sql',
  '28_lre_concepto_canonico.sql',
];

function resolveDbUrl() {
  const url = (process.env.SUPABASE_DB_URL ?? process.env.SUPABASE_DB_URL_LOCAL ?? '').trim();
  if (!url) {
    console.error('[apply lre bd] FAIL: defina SUPABASE_DB_URL en .env');
    process.exit(1);
  }
  return url;
}

function runSqlFile(dbUrl, filePath) {
  const name = path.basename(filePath);
  console.log(`[apply lre bd] Ejecutando ${name}…`);
  execFileSync(
    'psql',
    [dbUrl, '-v', 'ON_ERROR_STOP=1', '-f', filePath],
    { stdio: 'inherit', encoding: 'utf8' },
  );
}

function countCatalog(dbUrl) {
  const out = execFileSync(
    'psql',
    [dbUrl, '-At', '-c', "SELECT COUNT(*) FROM catalogo_lre WHERE vigente = TRUE;"],
    { encoding: 'utf8' },
  ).trim();
  return out;
}

function main() {
  const dbUrl = resolveDbUrl();
  const partesDir = path.join(root, 'bd', 'base', 'v11', 'partes');

  for (const file of PARTES) {
    const full = path.join(partesDir, file);
    if (!fs.existsSync(full)) {
      console.error(`[apply lre bd] FAIL: no existe ${full}`);
      process.exit(1);
    }
    runSqlFile(dbUrl, full);
  }

  const total = countCatalog(dbUrl);
  console.log(`[apply lre bd] OK: catálogo LRE vigente con ${total} códigos.`);
}

main();
