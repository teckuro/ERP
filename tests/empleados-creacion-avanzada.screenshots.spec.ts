import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import './helpers/e2e-env';

const outputDir = resolve(process.cwd(), 'disenos-creacion-avanzada');

const credentials = {
  email: process.env['E2E_SUPABASE_AUTH_EMAIL'] ?? '',
  password: process.env['E2E_SUPABASE_AUTH_PASSWORD'] ?? '',
};

const steps = [
  'datos-personales',
  'contacto-domicilio',
  'contrato',
  'remuneracion-jornada',
  'asignaciones',
  'prevision-salud',
  'apvi',
  'banco',
  'condiciones-especiales',
  'resumen-final',
];

async function loginIfNeeded(page: Page) {
  await page.goto('/empleados/nuevo');
  await page.waitForLoadState('networkidle');

  const loginVisible = await page.locator('#login-title').isVisible().catch(() => false);
  if (!page.url().includes('/login') && !loginVisible) return;

  test.skip(
    !credentials.email || !credentials.password,
    'Faltan E2E_SUPABASE_AUTH_EMAIL/E2E_SUPABASE_AUTH_PASSWORD para capturar Creacion avanzada.',
  );

  await expect(page.locator('#login-title')).toContainText('Iniciar sesion');
  await page.locator('#login-email').fill(credentials.email);
  await page.locator('#login-password').fill(credentials.password);
  await page.getByRole('button', { name: /iniciar sesion/i }).click();
  await expect(page).not.toHaveURL(/\/login/);

  await page.goto('/empleados/nuevo');
  await page.waitForLoadState('networkidle');

  if (page.url().includes('/login') || (await page.locator('#login-title').isVisible().catch(() => false))) {
    throw new Error(
      'No se pudo abrir Creacion avanzada: la sesion no quedo autenticada. Revisa E2E_SUPABASE_AUTH_EMAIL/E2E_SUPABASE_AUTH_PASSWORD.',
    );
  }
}

async function waitForAdvancedCreate(page: Page) {
  await page.waitForLoadState('networkidle');
  await expect(page.getByText('Preparando campos')).toBeHidden({ timeout: 60_000 });
  await expect(page.locator('.advanced-create-shell')).toBeVisible();
  await expect(page.locator('.advanced-wizard-content')).toBeVisible();
}

test.describe('empleados - capturas Creacion avanzada', () => {
  test('guarda capturas de todos los pasos del wizard avanzado', async ({ page }) => {
    test.slow();
    await mkdir(outputDir, { recursive: true });

    await loginIfNeeded(page);
    await waitForAdvancedCreate(page);

    await page.screenshot({
      path: resolve(outputDir, 'creacion-avanzada-pantalla-completa.png'),
      fullPage: true,
      animations: 'disabled',
    });

    for (let index = 0; index < steps.length; index += 1) {
      await page.locator('.advanced-wizard-map__item').nth(index).click();
      await expect(page.locator('.advanced-step-kicker')).toContainText(`Registro ${String(index + 1).padStart(2, '0')} de`, {
        timeout: 10_000,
      });
      await page.locator('.advanced-step-header').scrollIntoViewIfNeeded();
      await page.waitForTimeout(150);

      await page.screenshot({
        path: resolve(outputDir, `${String(index + 1).padStart(2, '0')}-${steps[index]}.png`),
        fullPage: true,
        animations: 'disabled',
      });
    }
  });
});
