/**
 * Playwright globalSetup para suites E2E empleados con persistencia.
 * Solo corre si E2E_EMPLEADOS_BORRADOR=1 (misma convención que persistencia).
 */
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

import { config } from 'dotenv';

config({ path: resolve(process.cwd(), '.env'), quiet: true });

function isEnabled() {
  const v = (process.env.E2E_EMPLEADOS_BORRADOR ?? '').trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes' || v === 'on';
}

function runNode(script, extraArgs = []) {
  console.log(`[global-setup empleados] > node ${script}${extraArgs.length ? ` ${extraArgs.join(' ')}` : ''}`);
  const res = spawnSync(process.execPath, [resolve(process.cwd(), script), ...extraArgs], {
    stdio: 'inherit',
    env: process.env,
  });
  if (res.status !== 0) {
    const hint =
      script.includes('seed-empleados-prueba-errores')
        ? ' Revisar tmp/seed-empleados-err-result.json si existe.'
        : '';
    throw new Error(`Fallo ${script} (exit ${res.status ?? 'null'}).${hint}`);
  }
}

export default async function globalSetup() {
  if (!isEnabled()) {
    console.log('[global-setup empleados] Omitido: E2E_EMPLEADOS_BORRADOR no activo.');
    return;
  }

  const seedErr = (process.env.E2E_EMPLEADOS_SEED_ERR ?? '1').trim().toLowerCase();
  const withErr = seedErr !== '0' && seedErr !== 'false' && seedErr !== 'no';

  console.log('[global-setup empleados] Limpieza total BD...');
  runNode('scripts/limpiar-empleados-bd.mjs', ['--confirm']);

  console.log('[global-setup empleados] Fixtures auditoría U1–U8...');
  runNode('scripts/auditoria-empleados-fixtures.mjs');

  if (withErr) {
    console.log('[global-setup empleados] Fixtures ERR (append, sin borrar U1–U8)...');
    runNode('scripts/seed-empleados-prueba-errores.mjs', ['--confirm', '--append']);

    const reportPath = resolve(process.cwd(), 'tmp', 'seed-empleados-err-result.json');
    if (!fs.existsSync(reportPath)) {
      throw new Error(
        'Seed ERR no generó tmp/seed-empleados-err-result.json; revisar scripts/seed-empleados-prueba-errores.mjs',
      );
    }
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    const err01 = report.fixtures?.find((row) => row.rut === '26100001');
    if (!err01) {
      throw new Error('ERR01 (RUT 26100001) no aparece en el reporte de seed ERR.');
    }
    console.log('[global-setup empleados] ERR01 verificado en reporte de seed.');
  }
}
