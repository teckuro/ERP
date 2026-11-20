import { expect, test } from '@playwright/test';

import { isE2eNominaRealEnabled } from './helpers/e2e-env';

const realEnabled =
  process.env['E2E_LIQUIDACIONES_REAL'] === '1' &&
  isE2eNominaRealEnabled() &&
  !!process.env['E2E_SUPABASE_AUTH_EMAIL'] &&
  !!process.env['E2E_SUPABASE_AUTH_PASSWORD'] &&
  !!process.env['E2E_NOMINA_PERIODO'];

test.describe('liquidaciones oficiales', () => {
  test.skip(!realEnabled, 'E2E real omitido: faltan flags/credenciales de entorno controlado.');
  test.describe.configure({ timeout: 120_000 });

  test('flujo real recupera o genera liquidaciones oficiales internas', async ({ page }) => {
    const periodo = process.env['E2E_NOMINA_PERIODO']!;

    await page.goto('/login?returnUrl=/remuneraciones/liquidaciones');
    await page.locator('#login-email').fill(process.env['E2E_SUPABASE_AUTH_EMAIL']!);
    await page.locator('#login-password').fill(process.env['E2E_SUPABASE_AUTH_PASSWORD']!);
    await page.getByRole('button', { name: 'Iniciar sesion' }).click();
    await page.waitForURL('**/remuneraciones/liquidaciones', { timeout: 60_000 });

    const periodoInput = page.locator('input[type="month"]');
    await periodoInput.fill(periodo);
    await periodoInput.dispatchEvent('input');
    await periodoInput.dispatchEvent('change');

    const generar = page.getByRole('button', { name: /generar liquidaciones oficiales/i });
    await expect(page.getByText(/Lista para generar|Generadas|Generadas con advertencias/).first()).toBeVisible({
      timeout: 60_000,
    });
    if (await generar.isEnabled()) {
      page.once('dialog', (dialog) => dialog.accept());
      await expect(generar).toBeEnabled({ timeout: 60_000 });
      await generar.click();
    }

    await expect(
      page
        .getByText(/Liquidaciones recuperadas desde BD|Las liquidaciones oficiales del periodo ya fueron generadas/)
        .first(),
    ).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText(/PDF, firma, envio, portal trabajador, Previred/)).toBeVisible();
  });
});
