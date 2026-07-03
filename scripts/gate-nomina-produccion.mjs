/**
 * Gate F21 — despliegue controlado del flujo Administrador + Generador.
 *
 * 1. Esquema BD (opcional si SUPABASE_DB_URL / DATABASE_URL)
 * 2. Smoke autenticado (feature gates + tablas)
 * 3. E2E certificación (opcional si credenciales E2E)
 *
 * Uso: npm run gate:nomina:produccion
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function run(label, command, args, extraEnv = {}) {
  console.log(`[gate nomina produccion] ${label}`);
  const res = spawnSync(command, args, {
    stdio: 'inherit',
    env: { ...process.env, ...extraEnv },
    shell: process.platform === 'win32',
  });
  if (res.status !== 0) {
    process.exit(res.status ?? 1);
  }
}

const dbUrl = (process.env['SUPABASE_DB_URL'] ?? process.env['DATABASE_URL'] ?? '').trim();
if (dbUrl) {
  run('Esquema BD nomina mensual', 'npm', ['run', 'validar:esquema-nomina-bd'], {
    SUPABASE_DB_URL: dbUrl,
    DATABASE_URL: dbUrl,
  });
} else {
  console.log('[gate nomina produccion] Esquema BD omitido (defina SUPABASE_DB_URL).');
}

run('Smoke post-despliegue', 'node', [path.join(__dirname, 'smoke-nomina-produccion.mjs')]);

const e2eOn = Boolean(process.env['E2E_SUPABASE_AUTH_EMAIL'])
  && Boolean(process.env['E2E_SUPABASE_AUTH_PASSWORD']);
if (process.env['NOMINA_GATE_E2E'] === '1' && e2eOn) {
  run('E2E certificación F20', 'npm', ['run', 'test:e2e:nominas']);
} else if (process.env['NOMINA_GATE_E2E'] === '1') {
  console.log('[gate nomina produccion] E2E omitido (credenciales E2E ausentes).');
} else {
  console.log('[gate nomina produccion] E2E omitido (defina NOMINA_GATE_E2E=1 para incluir Playwright).');
}

console.log('[gate nomina produccion] completo.');
