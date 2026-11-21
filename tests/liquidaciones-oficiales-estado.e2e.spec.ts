import { expect, test } from '@playwright/test';

import {
  LIQUIDACIONES_E2E_TIMEOUT_MS,
  loginYAbrirLiquidaciones,
} from './helpers/liquidaciones-oficiales-e2e';

test.describe('Liquidaciones oficiales — estado revisión', () => {
  test.setTimeout(LIQUIDACIONES_E2E_TIMEOUT_MS);

  test('muestra franja de acción y contadores de estado', async ({ page }) => {
    try {
      await loginYAbrirLiquidaciones(page);
    } catch (error) {
      if (error instanceof Error && error.message === 'SKIP_NO_NOMINAS_LIQUIDACIONES') {
        test.skip(true, 'Sin nóminas con liquidaciones en el entorno E2E');
      }
      throw error;
    }

    await expect(page.locator('.liq-franja, .liq-estado-resumen')).toBeVisible();
    await expect(page.getByText('Pendientes de autorizar')).toBeVisible();
  });
});
