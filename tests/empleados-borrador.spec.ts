import { test, expect } from '@playwright/test';

/**
 * UI sin persistencia. E2E que escriben en Supabase: `tests/empleados-borrador-persistencia.spec.ts`.
 * Activación: en `.env` del proyecto, `E2E_EMPLEADOS_BORRADOR=1` (también `true` / `yes` / `on`),
 * luego `npm run test:e2e:empleados-borrador`. Alternativa: exportar la variable en el shell y
 * `npm run test:visual -- tests/empleados-borrador-persistencia.spec.ts`.
 */

test.describe('empleados — borrador avanzada (UI, sin persistencia)', () => {
  test('creación avanzada: botón Guardar borrador y Volver', async ({ page }) => {
    await page.goto('/empleados/nuevo');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Preparando campos')).toBeHidden({ timeout: 60_000 });

    await expect(page.getByRole('heading', { name: 'Creación avanzada' })).toBeVisible();
    await expect(page.getByTestId('guardar-borrador-avanzado')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Volver' })).toBeVisible();
  });

  test('creación básica: no aparece Guardar borrador; sí guardar ficha básica', async ({ page }) => {
    await page.goto('/empleados/nuevo?modo=basico');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Preparando campos')).toBeHidden({ timeout: 60_000 });

    await expect(page.getByTestId('guardar-borrador-avanzado')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Creación básica' })).toBeVisible();
    await expect(
      page.getByRole('button', { name: /Guardar ficha básica|Guardando ficha/ }),
    ).toBeVisible();
    await expect(page.locator('.advanced-wizard-map')).toHaveCount(0);
  });

  test('continuación: idPersona inexistente muestra error claro', async ({ page }) => {
    await page.goto('/empleados/nuevo?idPersona=999999999');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Preparando campos')).toBeHidden({ timeout: 60_000 });

    await expect(page.getByText('No se encontro la ficha indicada para continuar el alta.')).toBeVisible({
      timeout: 30_000,
    });
  });

  test('validación mínima: RUT invalido al guardar borrador muestra error (detalle en modal)', async ({
    page,
  }) => {
    await page.goto('/empleados/nuevo');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Preparando campos')).toBeHidden({ timeout: 60_000 });

    await page.locator('#empleado-rut').fill('11.111.111-0');
    await page.getByTestId('guardar-borrador-avanzado').click();
    await expect(page.getByText('Ingresa un RUT valido antes de guardar el borrador.')).toBeVisible({
      timeout: 10_000,
    });
  });

  test('responsive medio: cabecera avanzada sin overflow horizontal obvio', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 800 });
    await page.goto('/empleados/nuevo');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Preparando campos')).toBeHidden({ timeout: 60_000 });

    const scrollW = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientW = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollW).toBeLessThanOrEqual(clientW + 2);
    await expect(page.getByTestId('guardar-borrador-avanzado')).toBeVisible();
  });
});
