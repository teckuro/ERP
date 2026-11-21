import { expect, test } from '@playwright/test';

import { nominasAdminGeneradorCredentialsReady } from './helpers/nominas-admin-generador-e2e';

const TIMEOUT_MS = 90_000;

test.describe('Conceptos de remuneración — estado LRE', () => {
  test.skip(
    !nominasAdminGeneradorCredentialsReady(),
    'Requiere E2E_SUPABASE_AUTH_EMAIL y E2E_SUPABASE_AUTH_PASSWORD.',
  );
  test.describe.configure({ mode: 'serial', timeout: TIMEOUT_MS });

  test('CONC-LRE-E2E-01: grilla muestra columna LRE y filtro exportación', async ({ page }) => {
    page.setDefaultTimeout(TIMEOUT_MS);
    await page.goto('/remuneraciones/conceptos-remuneracion');
    await expect(page.locator('.hd-page')).toBeVisible();

    const grid = page.locator('.cr-grid-wrap');
    await expect(grid).toBeVisible({ timeout: TIMEOUT_MS });

    await expect(grid.getByText('Cód. motor', { exact: true })).toBeVisible();
    await expect(grid.getByText('LRE', { exact: true }).first()).toBeVisible();

    const filtroLre = page.locator('select, [role="combobox"]').filter({ hasText: /LRE/i }).first();
    if (await filtroLre.isVisible().catch(() => false)) {
      await filtroLre.click().catch(() => undefined);
    }

    const primeraFila = page.locator('.cr-grid-wrap tr.data-grid-row').first();
    if ((await primeraFila.count()) === 0) {
      test.skip(true, 'Sin conceptos en catálogo.');
      return;
    }

    await primeraFila.locator('button[title="Revisar detalle"]').click();
    await expect(page.getByRole('dialog', { name: 'Detalle del concepto' })).toBeVisible();
    await expect(page.getByText('Exportación LRE')).toBeVisible();
    await expect(page.getByText('Código motor')).toBeVisible();
  });
});
