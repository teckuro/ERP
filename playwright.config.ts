import { resolve } from 'node:path';

import { config as loadEnv } from 'dotenv';
import { defineConfig } from '@playwright/test';

// Variables para E2E (p. ej. `E2E_EMPLEADOS_BORRADOR`) sin depender solo del shell.
loadEnv({ path: resolve(process.cwd(), '.env'), quiet: true });

const empleadosDbSpecs = [
  'empleados-borrador-persistencia.spec.ts',
  'empleados-creacion-avanzada-flujos.spec.ts',
  'empleados-creacion-avanzada-honorarios.spec.ts',
  'empleados-creacion-avanzada-inferencia.spec.ts',
];

export default defineConfig({
  testDir: './tests',
  snapshotDir: './tests/__snapshots__',
  timeout: 30_000,
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
    },
  },
  use: {
    baseURL: 'http://localhost:4200',
    viewport: { width: 1440, height: 900 },
  },
  projects: [
    {
      name: 'default',
      testIgnore: empleadosDbSpecs.map((f) => `**/${f}`),
    },
    {
      name: 'empleados-db',
      testMatch: empleadosDbSpecs.map((f) => `**/${f}`),
      globalSetup: resolve(process.cwd(), 'tests/global-setup-empleados-e2e.mjs'),
      timeout: 240_000,
    },
    {
      name: 'empleados-nomina',
      testMatch: '**/empleados-nomina-error-fixtures.spec.ts',
      timeout: 120_000,
    },
  ],
  webServer: {
    command: 'npm run start -- --host 127.0.0.1 --port 4200',
    url: 'http://127.0.0.1:4200',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});

