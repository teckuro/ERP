/**
 * Gate parámetros: unit del feature + smoke E2E UI del workspace (sin BD).
 * Requiere app en :4200 (Playwright levanta webServer si no hay servidor).
 * Auth: E2E_SUPABASE_AUTH_EMAIL / E2E_SUPABASE_AUTH_PASSWORD en `.env`.
 */
import { spawnSync } from 'node:child_process';

function run(label, command, args, extraEnv = {}) {
  console.log(`[gate parametros] ${label}`);
  const res = spawnSync(command, args, {
    stdio: 'inherit',
    env: { ...process.env, ...extraEnv },
    shell: process.platform === 'win32',
  });
  if (res.status !== 0) {
    process.exit(res.status ?? 1);
  }
}

run('unit (parametros-generales)', 'npm', ['run', 'test:gate:parametros:unit']);
run('E2E UI workspace (1 smoke)', 'npm', ['run', 'test:e2e:parametros']);

console.log('[gate parametros] completo.');
