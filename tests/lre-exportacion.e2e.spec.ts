import { execSync } from 'node:child_process';
import path from 'node:path';

import { expect, test } from '@playwright/test';

import {
  abrirPrimeraNominaExportableLre,
  esperarBorradorLre,
  loginYAbrirLre,
  LRE_E2E_TIMEOUT_MS,
} from './helpers/lre-exportacion-e2e';
import { nominasAdminGeneradorCredentialsReady } from './helpers/nominas-admin-generador-e2e';

const FIXTURE_SCRIPT = path.resolve(process.cwd(), 'scripts', 'liquidaciones-e2e-fixture-estado.mjs');
const CHAIN_SCRIPT = path.resolve(process.cwd(), 'scripts', 'seed-lre-export-chain.mjs');

test.describe('LRE — exportación borrador CSV', () => {
  test.skip(
    !nominasAdminGeneradorCredentialsReady(),
    'Requiere E2E_SUPABASE_AUTH_EMAIL y E2E_SUPABASE_AUTH_PASSWORD.',
  );
  test.describe.configure({ mode: 'serial', timeout: LRE_E2E_TIMEOUT_MS });

  test.beforeAll(() => {
    execSync(`node "${FIXTURE_SCRIPT}" prepare`, { stdio: 'inherit' });
    execSync(`node "${CHAIN_SCRIPT}" verify`, { stdio: 'inherit' });
  });

  test.afterAll(() => {
    execSync(`node "${FIXTURE_SCRIPT}" restore`, { stdio: 'inherit' });
  });

  test('LRE-E2E-01: muestra borrador con líneas y códigos LRE oficiales', async ({ page }) => {
    await loginYAbrirLre(page);
    const estado = await esperarBorradorLre(page);

    if (estado === 'sin_nominas') {
      test.skip(true, 'Requiere nómina liquidada o cerrada con liquidación oficial.');
      return;
    }

    if (estado === 'vacio') {
      await abrirPrimeraNominaExportableLre(page);
    }

    const resumen = page.locator('.sal-ext-resumen');
    await expect(resumen).toBeVisible();

    const lineasTexto = await resumen.locator('dt', { hasText: 'Líneas' }).locator('..').locator('dd').innerText();
    const lineas = Number(lineasTexto.trim());
    if (lineas === 0) {
      test.skip(true, 'Liquidación sin conceptos con código LRE. Recalcule snapshot y regenere liquidaciones.');
      return;
    }

    await expect(page.locator('.lre-lineas-grid')).toBeVisible();
    await expect(page.locator('.lre-lineas-grid')).toContainText('2101');
    await expect(page.getByTestId('lre:descargar-csv')).toBeVisible();
  });
});
