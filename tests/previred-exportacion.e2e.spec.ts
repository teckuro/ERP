import { expect, test } from '@playwright/test';

import { nominasAdminGeneradorCredentialsReady } from './helpers/nominas-admin-generador-e2e';
import {
  PREVIRED_E2E_TIMEOUT_MS,
  esperarBorradorPrevired,
  loginYAbrirPrevired,
} from './helpers/previred-exportacion-e2e';

test.describe('Previred — exportación remuneraciones', () => {
  test.skip(
    !nominasAdminGeneradorCredentialsReady(),
    'Requiere E2E_SUPABASE_AUTH_EMAIL y E2E_SUPABASE_AUTH_PASSWORD.',
  );
  test.describe.configure({ mode: 'serial', timeout: PREVIRED_E2E_TIMEOUT_MS });

  test('PREVIRED-E2E-01: pantalla carga borrador', async ({ page }) => {
    await loginYAbrirPrevired(page);
    const estado = await esperarBorradorPrevired(page);
    if (estado === 'sin_nominas') {
      test.skip(true, 'Sin nóminas exportables.');
      return;
    }
    if (estado === 'vacio') {
      test.skip(true, 'Sin líneas exportables.');
      return;
    }
    await expect(page.locator('.prev-resumen')).toBeVisible();
  });
});
