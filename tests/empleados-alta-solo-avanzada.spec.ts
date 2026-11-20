import { test, expect } from '@playwright/test';

test.describe('empleados — alta solo avanzada (producto)', () => {
  test('modo=basico redirige a creación avanzada', async ({ page }) => {
    await page.goto('/empleados/nuevo?modo=basico');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Preparando campos')).toBeHidden({ timeout: 60_000 });

    await expect(page).toHaveURL(/modo=avanzado/);
    await expect(page.getByRole('heading', { name: 'Creación avanzada' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Creación básica' })).toHaveCount(0);
  });

  test('listado: Crear empleado abre avanzada sin menú de modos', async ({ page }) => {
    await page.goto('/empleados');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Crear empleado' }).click();
    await expect(page).toHaveURL(/\/empleados\/nuevo/);
    await expect(page.getByText('Preparando campos')).toBeHidden({ timeout: 60_000 });
    await expect(page.getByRole('heading', { name: 'Creación avanzada' })).toBeVisible();
  });
});
