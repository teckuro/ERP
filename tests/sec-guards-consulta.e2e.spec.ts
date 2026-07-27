import { expect, test } from '@playwright/test';

import {
  consultaCredentialsReady,
  expectAccesoDenegado,
  loginConsulta,
} from './helpers/sec-guards-e2e';

test.describe('SEC-04 — guards perfil consulta', () => {
  test.skip(!consultaCredentialsReady(), 'Requiere fixture consulta (npm run fixture:sec:consulta).');

  test.beforeEach(async ({ page }) => {
    await loginConsulta(page);
  });

  test('sidebar oculta Parámetros y Administrador', async ({ page }) => {
    await page.goto('/');
    const sidebar = page.locator('.erp-sidebar');
    await expect(sidebar.getByRole('link', { name: 'Parámetros' })).toHaveCount(0);
    await expect(sidebar.getByRole('link', { name: 'Administrador' })).toHaveCount(0);
    await expect(sidebar.getByRole('link', { name: 'Empleados' })).toBeVisible();
  });

  test('bloquea parámetros por URL directa', async ({ page }) => {
    await expectAccesoDenegado(page, '/parametros');
  });

  test('bloquea administración del sistema', async ({ page }) => {
    await expectAccesoDenegado(page, '/administracion');
  });

  test('bloquea alta de empleado', async ({ page }) => {
    await expectAccesoDenegado(page, '/empleados/crear');
  });

  test('bloquea generador de nómina', async ({ page }) => {
    await page.goto('/remuneraciones/nominas');
    await page.waitForLoadState('networkidle');
    const linkNomina = page.locator('a[href*="/remuneraciones/nominas/"]').first();
    if (await linkNomina.isVisible({ timeout: 5_000 }).catch(() => false)) {
      const href = await linkNomina.getAttribute('href');
      if (href && /\/nominas\/[^/]+/.test(href) && !href.endsWith('/nominas')) {
        await expectAccesoDenegado(page, href);
        return;
      }
    }
    await expectAccesoDenegado(
      page,
      '/remuneraciones/nominas/00000000-0000-0000-0000-000000000001',
    );
  });

  test('bloquea edición de conceptos', async ({ page }) => {
    await expectAccesoDenegado(page, '/remuneraciones/conceptos');
  });
});
