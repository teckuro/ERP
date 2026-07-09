import { execFileSync } from 'node:child_process';
import { config as loadEnv } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
loadEnv({ path: path.join(root, '.env'), quiet: true });

const dbUrl = (process.env.SUPABASE_DB_URL ?? process.env.SUPABASE_DB_URL_LOCAL ?? '').trim();
if (!dbUrl) {
  console.error('FAIL: defina SUPABASE_DB_URL o SUPABASE_DB_URL_LOCAL');
  process.exit(1);
}

const sql = `
  select coalesce(string_agg(version, ',' order by version), '')
  from supabase_migrations.schema_migrations
  where version like '202607082%';
`;

try {
  const out = execFileSync('psql', [dbUrl, '-At', '-c', sql], { encoding: 'utf8' }).trim();
  console.log(out || '(ninguna migracion 202607082* aplicada)');
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
}
