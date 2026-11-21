import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import './helpers/e2e-env';

const outputDir = resolve(
  process.cwd(),
  'docs',
  'codex',
  'modulos',
  'nomina-mensual',
  'preparar-nomina',
  'imagenes',
  'actual',
);

const credentials = {
  email: process.env['E2E_SUPABASE_AUTH_EMAIL'] ?? '',
  password: process.env['E2E_SUPABASE_AUTH_PASSWORD'] ?? '',
};

async function login(page: Page): Promise<void> {
  await page.goto('/login?returnUrl=/remuneraciones/proceso-mensual');
  await page.evaluate(() => {
    localStorage.removeItem('angular-erp-auth');
    sessionStorage.clear();
  });
  await page.goto('/login?returnUrl=/remuneraciones/proceso-mensual');
  await expect(page.locator('#login-title')).toContainText(/Iniciar sesi(?:o|\u00f3)n/);
  await page.locator('#login-email').fill(credentials.email);
  await page.locator('#login-password').fill(credentials.password);
  await page.getByRole('button', { name: /iniciar sesi(?:o|\u00f3)n/i }).click();
  await page.waitForURL('**/remuneraciones/proceso-mensual', { timeout: 60_000 });
  await page.waitForLoadState('networkidle');
}

async function screenshot(page: Page, name: string): Promise<void> {
  await page.waitForLoadState('networkidle');
  await page.locator('body').waitFor({ state: 'visible' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: resolve(outputDir, name), fullPage: true });
}

test.describe('Preparar nomina - capturas actuales', () => {
  test('captura la pantalla actual sin simular pasos internos', async ({ page }) => {
    test.setTimeout(180_000);
    test.skip(!credentials.email || !credentials.password, 'Faltan credenciales E2E para capturar Preparar nomina.');

    await mkdir(outputDir, { recursive: true });
    await login(page);

    await expect(page.getByRole('heading', { name: /Preparar n(?:o|\u00f3)mina/ })).toBeVisible({
      timeout: 60_000,
    });
    await screenshot(page, '01-preparar-nomina-actual-full.png');

    const revisionGuiada = page.getByText(/Abrir revisi(?:o|\u00f3)n guiada/).first();
    if ((await revisionGuiada.count()) > 0) {
      await revisionGuiada.click();
      await screenshot(page, '02-preparar-nomina-actual-revision-guiada.png');
    }

    await page.goto('/remuneraciones/liquidaciones');
    await page.waitForLoadState('networkidle');
    await screenshot(page, '03-liquidaciones-actual-full.png');
  });
});
