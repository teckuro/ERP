/**
 * Elimina TODOS los empleados (persona + dependencias) del Supabase configurado en .env.
 *
 * Uso:
 *   node scripts/limpiar-empleados-bd.mjs --dry-run
 *   node scripts/limpiar-empleados-bd.mjs --confirm
 *
 * Requiere:
 *   E2E_SUPABASE_URL, E2E_SUPABASE_ANON_KEY + auth email/password
 *   (o E2E_SUPABASE_SERVICE_ROLE_KEY)
 *   SUPABASE_DB_URL (o SUPABASE_DB_URL_LOCAL) + psql en PATH
 *   public/app-config.json
 */

import { config } from 'dotenv';
import { resolve } from 'node:path';

import {
  createSupabaseScriptClient,
  fetchAllPersonaIds,
  limpiarEmpleadosPorPersonas,
  loadAppConfig,
} from './lib/empleados-cleanup.mjs';

config({ path: resolve(process.cwd(), '.env'), quiet: true });

async function main() {
  const confirm = process.argv.includes('--confirm');
  const dryRun = process.argv.includes('--dry-run');

  if (!confirm && !dryRun) {
    console.error('Uso: node scripts/limpiar-empleados-bd.mjs --dry-run | --confirm');
    console.error('  --dry-run   cuenta personas; no borra.');
    console.error('  --confirm   borra TODAS las personas y dependencias (destructivo).');
    process.exit(1);
  }

  const { supabaseUrl } = loadAppConfig();
  console.log(`Supabase: ${supabaseUrl || '(sin URL)'}`);
  if (!supabaseUrl) {
    throw new Error('Configura E2E_SUPABASE_URL o app-config.json antes de continuar.');
  }

  const supabase = await createSupabaseScriptClient();
  const personaIds = await fetchAllPersonaIds(supabase);

  console.log(`Personas en BD: ${personaIds.length}`);

  if (dryRun) {
    console.log('Dry-run: no se elimina nada.');
    return;
  }

  if (personaIds.length === 0) {
    console.log('No hay empleados que borrar.');
    return;
  }

  console.log('Eliminando todos los empleados...');
  await limpiarEmpleadosPorPersonas(supabase, personaIds);

  const { count: restantes } = await supabase
    .from('persona')
    .select('id_persona', { count: 'exact', head: true });

  console.log(`Personas tras limpieza: ${restantes ?? 0}`);
  console.log('Listo.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
