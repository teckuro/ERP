import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

import { expect, test } from '@playwright/test';

import './helpers/e2e-env';

const outputDir = resolve(process.cwd(), 'disenos-ventanas');

const credentials = {
  email: process.env['E2E_SUPABASE_AUTH_EMAIL'] ?? '',
  password: process.env['E2E_SUPABASE_AUTH_PASSWORD'] ?? '',
};

const windows = [
  { name: 'dashboard', path: '/' },
  { name: 'empleados-listado', path: '/empleados' },
  { name: 'empleados-nuevo', path: '/empleados/nuevo' },
  { name: 'empleados-ficha-id-1', path: '/empleados/1' },
  { name: 'remuneraciones-preparar-nomina', path: '/remuneraciones/proceso-mensual' },
  { name: 'remuneraciones-liquidaciones-oficiales', path: '/remuneraciones/liquidaciones-oficiales' },
  { name: 'remuneraciones-liquidaciones-detalle-id-1', path: '/remuneraciones/liquidaciones/1' },
  { name: 'remuneraciones-movimientos-del-mes', path: '/remuneraciones/novedades-mensuales' },
  { name: 'remuneraciones-asignaciones-recurrentes', path: '/remuneraciones/haberes-descuentos' },
  { name: 'remuneraciones-conceptos', path: '/remuneraciones/conceptos' },
  { name: 'licencias-medicas', path: '/licencias-medicas' },
  { name: 'reportes', path: '/reportes' },
  { name: 'parametros', path: '/parametros' },
];

test.describe('catalogo visual de ventanas', () => {
  test('guarda capturas nombradas en disenos-ventanas', async ({ page }) => {
    test.skip(
      !credentials.email || !credentials.password,
      'Faltan E2E_SUPABASE_AUTH_EMAIL/E2E_SUPABASE_AUTH_PASSWORD para capturar ventanas privadas.',
    );

    await mkdir(outputDir, { recursive: true });

    await page.goto('/login');
    await expect(page.locator('#login-title')).toContainText('Iniciar sesion');
    await page.screenshot({ path: resolve(outputDir, 'login.png'), fullPage: true });

    await page.locator('#login-email').fill(credentials.email);
    await page.locator('#login-password').fill(credentials.password);
    await page.getByRole('button', { name: /iniciar sesion/i }).click();
    await expect(page).not.toHaveURL(/\/login/);

    for (const item of windows) {
      await page.goto(item.path);
      await page.waitForLoadState('networkidle');
      await page.locator('body').waitFor({ state: 'visible' });
      await page.waitForTimeout(500);
      await page.screenshot({ path: resolve(outputDir, `${item.name}.png`), fullPage: true });
    }
  });
});
