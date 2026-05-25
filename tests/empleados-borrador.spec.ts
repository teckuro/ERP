import { test, expect } from '@playwright/test';

import {
  gotoAltaAvanzada,
  gotoAltaBasica,
  waitAdvancedFormReady,
  waitBasicFormReady,
} from './helpers/empleados-borrador-e2e';

/**
 * UI sin persistencia. E2E que escriben en Supabase: `tests/empleados-borrador-persistencia.spec.ts`.
 * Activación: en `.env` del proyecto, `E2E_EMPLEADOS_BORRADOR=1` (también `true` / `yes` / `on`),
 * luego `npm run test:e2e:empleados:db`. Alternativa: exportar la variable en el shell y
 * `npm run test:visual -- tests/empleados-borrador-persistencia.spec.ts`.
 */

test.describe('empleados — borrador avanzada (UI, sin persistencia)', () => {
  test('creación avanzada: botón Guardar borrador y Volver', async ({ page }) => {
    await gotoAltaAvanzada(page);
    await waitAdvancedFormReady(page);

    await expect(page.getByRole('heading', { name: 'Alta del trabajador' })).toBeVisible();
    await expect(page.getByTestId('empleado-alta-avanzada-guardar')).toBeVisible();
    await expect(page.locator('.advanced-wizard-map')).toBeVisible();
  });

  test('creación básica: no aparece Guardar borrador; sí guardar ficha básica', async ({ page }) => {
    await gotoAltaBasica(page);
    await waitBasicFormReady(page);

    await expect(page.getByTestId('empleado-alta-avanzada-guardar')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Creación básica' })).toBeVisible();
    await expect(page.getByTestId('empleado-alta-basica-guardar-borrador')).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.locator('.advanced-wizard-map')).toHaveCount(0);
  });

  test('continuación: idPersona inexistente muestra error claro', async ({ page }) => {
    await gotoAltaAvanzada(page, 'idPersona=999999999');
    await waitAdvancedFormReady(page);

    await expect(page.getByText('No se encontro la ficha indicada para continuar el alta.')).toBeVisible({
      timeout: 30_000,
    });
  });

  test('validación mínima: RUT invalido al guardar borrador muestra error (detalle en modal)', async ({
    page,
  }) => {
    await gotoAltaAvanzada(page);
    await waitAdvancedFormReady(page);

    await page.locator('#empleado-rut').fill('11.111.111-0');
    await page.getByTestId('empleado-alta-avanzada-guardar').click();
    await expect(page.getByRole('dialog', { name: /No se puede guardar el borrador/i })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText(/RUT válido|RUT valido/i).first()).toBeVisible();
  });

  test('responsive medio: cabecera avanzada sin overflow horizontal obvio', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 800 });
    await gotoAltaAvanzada(page);
    await waitAdvancedFormReady(page);

    const scrollW = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientW = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollW).toBeLessThanOrEqual(clientW + 2);
    await expect(page.getByTestId('empleado-alta-avanzada-guardar')).toBeVisible();
  });
});
