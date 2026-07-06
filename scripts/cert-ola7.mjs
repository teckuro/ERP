/**
 * Certificación Ola 7 — unit + smoke + E2E opcional (NOMINA_GATE_E2E=1).
 */
import { spawnSync } from 'node:child_process';
import { config as loadEnv } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.resolve(__dirname, '..', '.env'), quiet: true });

function run(label, command, args, extraEnv = {}) {
  console.log(`[cert ola7] ${label}`);
  const res = spawnSync(command, args, {
    stdio: 'inherit',
    env: { ...process.env, ...extraEnv },
    shell: process.platform === 'win32',
  });
  if (res.status !== 0) {
    process.exit(res.status ?? 1);
  }
}

run('Unit gate nómina', 'npm', ['run', 'test:gate:nominas:unit']);
run('Smoke producción', 'node', [path.join(__dirname, 'smoke-nomina-produccion.mjs')]);
run('Smoke liquidaciones estado', 'node', [path.join(__dirname, 'smoke-liquidaciones-estado-revision.mjs')]);
run('Smoke liquidaciones emisión', 'node', [path.join(__dirname, 'smoke-liquidaciones-emision.mjs')]);
run('Smoke previred exportación', 'node', [path.join(__dirname, 'smoke-previred-exportacion.mjs')]);

const e2eOn =
  Boolean(process.env['E2E_SUPABASE_AUTH_EMAIL'])
  && Boolean(process.env['E2E_SUPABASE_AUTH_PASSWORD']);

if (process.env['NOMINA_GATE_E2E'] === '1' && e2eOn) {
  run('Playwright F20', 'npm', ['run', 'test:gate:nominas:e2e']);
  run('Playwright liquidaciones estado', 'npm', ['run', 'test:e2e:liquidaciones']);
  run('Playwright previred exportación', 'npm', ['run', 'test:e2e:previred']);
} else if (process.env['NOMINA_GATE_E2E'] === '1') {
  console.warn('[cert ola7] NOMINA_GATE_E2E=1 pero faltan credenciales E2E en .env — E2E omitido.');
} else {
  console.log('[cert ola7] E2E omitido (defina NOMINA_GATE_E2E=1 para Playwright).');
}

console.log('[cert ola7] Certificación automatizada completa.');
console.log('[cert ola7] Pendiente: checklist manual RRHH en docs/codex/modulos/nomina-mensual/smoke-certificacion-ola7.md');
