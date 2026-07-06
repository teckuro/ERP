/**
 * Diagnóstico rápido del periodo E2E (cliente vs oficial).
 * Uso: node scripts/verify-parametros-e2e-period.mjs --periodo 2026-06
 */
import { config } from 'dotenv';
import { resolve } from 'node:path';

import { createParametrosE2eSupabaseAdmin, E2E_PARAMETROS_PERIODO_DEFAULT, resolveParametrosDbUrl, runPsql } from './lib/parametros-e2e-db.mjs';

config({ path: resolve(process.cwd(), '.env'), quiet: true });

const periodo = process.argv.includes('--periodo')
  ? process.argv[process.argv.indexOf('--periodo') + 1]
  : E2E_PARAMETROS_PERIODO_DEFAULT;

const dbUrl = resolveParametrosDbUrl();
const sql = `SELECT 'cliente' AS src, periodo, uf::text FROM parametros_generales_cliente WHERE periodo = '${periodo.replace(/'/g, "''")}'
UNION ALL
SELECT 'oficial', periodo, uf::text FROM parametros_generales WHERE periodo = '${periodo.replace(/'/g, "''")}';`;

console.log(`[verify] periodo=${periodo}`);
console.log(runPsql(dbUrl, sql));

const admin = createParametrosE2eSupabaseAdmin();
if (admin) {
  const [{ data: cliente }, { data: oficial }] = await Promise.all([
    admin.from('parametros_generales_cliente').select('periodo,uf').eq('periodo', periodo).maybeSingle(),
    admin.from('parametros_generales').select('periodo,uf').eq('periodo', periodo).maybeSingle(),
  ]);
  console.log('[verify] supabase admin:', { cliente, oficial });
} else {
  console.log('[verify] sin E2E_SUPABASE_SERVICE_ROLE_KEY (solo psql).');
}
