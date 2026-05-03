import { test, expect } from '@playwright/test';

test('conceptos remuneración — carga listado o vacío', async ({ page }) => {
  await page.goto('/remuneraciones/conceptos');
  await page.waitForLoadState('networkidle');

  await expect(page.getByRole('heading', { name: 'Conceptos de remuneración' })).toBeVisible();
  await expect(page.getByText('Catálogo maestro usado por haberes', { exact: false })).toBeVisible();

  await expect(page.getByRole('button', { name: 'Nuevo concepto' })).toBeVisible({ timeout: 20_000 });

  const emptyState = page.getByText('No hay conceptos de remuneración registrados.', { exact: true });
  const colNombre = page.getByRole('columnheader', { name: 'Nombre' });
  await expect(emptyState.or(colNombre).first()).toBeVisible({ timeout: 20_000 });
});
