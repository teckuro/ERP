/**
 * Gate E2E empleados (UI + BD con borrador + verify + nómina fixtures).
 * Variables de entorno sin depender de cross-env (Windows / Unix).
 */
import { spawnSync } from 'node:child_process';

function run(label, command, args, extraEnv = {}) {
  console.log(`[gate empleados] ${label}`);
  const res = spawnSync(command, args, {
    stdio: 'inherit',
    env: { ...process.env, ...extraEnv },
    shell: process.platform === 'win32',
  });
  if (res.status !== 0) {
    process.exit(res.status ?? 1);
  }
}

run('UI (17 specs)', 'npm', ['run', 'test:e2e:empleados:ui']);
run('BD empleados-db (15 specs)', 'npm', ['run', 'test:e2e:empleados:db'], {
  E2E_EMPLEADOS_BORRADOR: '1',
});
run('verify post-E2E', 'npm', ['run', 'verify:empleados-qa'], {
  E2E_EMPLEADOS_BORRADOR: '1',
});
run('nómina fixtures', 'npx', [
  'playwright',
  'test',
  'tests/empleados-nomina-error-fixtures.spec.ts',
  '--project=empleados-nomina',
  '--workers=1',
], {
  E2E_EMPLEADOS_NOMINA_FIXTURES: '1',
});

console.log('[gate empleados] E2E completo.');
