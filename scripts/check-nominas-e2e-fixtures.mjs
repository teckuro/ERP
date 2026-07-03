/**
 * Diagnóstico read-only — fixtures F20 para Playwright nóminas.
 *
 *   node scripts/check-nominas-e2e-fixtures.mjs
 *
 * Requiere E2E_SUPABASE_AUTH_EMAIL / E2E_SUPABASE_AUTH_PASSWORD y app-config.
 */
import { createClient } from '@supabase/supabase-js';
import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';

import {
  evaluarFixturesF20,
  etiquetaMetaNomina,
  loadAppConfig,
  loginE2eNomina,
  listarNominasBandeja,
  periodoE2eDefault,
} from './lib/nominas-e2e-fixtures.mjs';

loadEnv({ path: resolve(process.cwd(), '.env'), quiet: true });

async function main() {
  const { supabaseUrl, supabaseAnonKey } = loadAppConfig();
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const email = await loginE2eNomina(client);
  const filas = await listarNominasBandeja(client);
  const dotacionMin = Number(process.env['E2E_NOMINA_DOTACION_MIN'] ?? '50');
  const matriz = evaluarFixturesF20(filas, { dotacionMin });

  console.log(`[check e2e nominas] Sesión: ${email}`);
  console.log(`[check e2e nominas] Período sugerido seed: ${periodoE2eDefault()}`);
  console.log(`[check e2e nominas] Nóminas visibles: ${filas.length}`);
  if (filas.length > 0) {
    console.log('[check e2e nominas] Muestra (meta):');
    for (const f of filas.slice(0, 8)) {
      const meta = etiquetaMetaNomina(f);
      console.log(`  · ${f.periodo} | ${f.estado} | ${f.tipo}/${f.naturaleza}${meta ? ` | ${meta}` : ''}`);
    }
    if (filas.length > 8) console.log(`  … y ${filas.length - 8} más`);
  }

  console.log('\n[check e2e nominas] Matriz F20:');
  let listos = 0;
  for (const item of matriz) {
    const mark = item.ok ? 'OK ' : 'GAP';
    if (item.ok) listos += 1;
    const extra = item.manual ? ' (manual / flujo UI)' : '';
    const detalle = item.ok ? (item.nota ?? '') : item.falta;
    console.log(`  ${mark} ${item.id}${extra}${detalle ? ` — ${detalle}` : ''}`);
  }

  console.log(`\n[check e2e nominas] ${listos}/${matriz.length} requisitos cubiertos.`);
  if (listos < matriz.length) {
    console.log('[check e2e nominas] Seed automático (tipos F10/F11): npm run seed:nominas:e2e -- --confirm');
    process.exitCode = 2;
  }
}

main().catch((err) => {
  console.error(`[check e2e nominas] FAIL: ${err.message ?? err}`);
  process.exit(1);
});
