/**
 * Playwright globalSetup para E2E de flujos parámetros con BD.
 * Activo con E2E_PARAMETROS_PERSISTENCIA=1.
 */
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

import { config } from 'dotenv';

config({ path: resolve(process.cwd(), '.env'), quiet: true });

function isEnabled() {
  const v = (process.env.E2E_PARAMETROS_PERSISTENCIA ?? '').trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes' || v === 'on';
}

function runNode(args) {
  const script = resolve(process.cwd(), 'scripts/seed-parametros-e2e-fixture.mjs');
  console.log(`[global-setup parametros] > node ${script} ${args.join(' ')}`);
  const res = spawnSync(process.execPath, [script, ...args], {
    stdio: 'inherit',
    env: process.env,
  });
  if (res.status !== 0) {
    throw new Error(`Fallo seed parametros (exit ${res.status ?? 'null'}).`);
  }
}

export default async function globalSetup() {
  if (!isEnabled()) {
    console.log('[global-setup parametros] Omitido: E2E_PARAMETROS_PERSISTENCIA no activo.');
    return;
  }

  const periodo = (
    process.env.E2E_PARAMETROS_PERSISTENCIA_PERIODO ??
    process.env.E2E_PARAMETROS_PERIODO ??
    '2026-06'
  ).trim();
  runNode(['--purge', '--periodo', periodo]);
}
