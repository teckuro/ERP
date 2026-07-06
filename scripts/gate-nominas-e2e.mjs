/**
 * Gate E2E nómina — certificación Playwright F20.
 * Auth: E2E_SUPABASE_AUTH_EMAIL / E2E_SUPABASE_AUTH_PASSWORD en `.env`.
 */
import { spawnSync } from 'node:child_process';

function run(label, command, args, extraEnv = {}) {
  console.log(`[gate nominas e2e] ${label}`);
  const res = spawnSync(command, args, {
    stdio: 'inherit',
    env: { ...process.env, ...extraEnv },
    shell: process.platform === 'win32',
  });
  if (res.status !== 0) {
    process.exit(res.status ?? 1);
  }
}

run('Playwright F20', 'npm', ['run', 'test:e2e:nominas']);

console.log('[gate nominas e2e] completo.');
