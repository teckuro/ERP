import { test, expect } from '@playwright/test';

import {
  seleccionarTabParametros,
  waitParametrosWorkspaceReady,
} from './helpers/parametros-workspace-e2e';

/**
 * Smoke UI del workspace de parámetros (sin guardar ni sincronizar).
 * Un solo recorrido por sesión para evitar flakiness por recargas sucesivas.
 *
 * Credenciales: `E2E_SUPABASE_AUTH_EMAIL` y `E2E_SUPABASE_AUTH_PASSWORD` en `.env`
 * (misma convención que empleados).
 */
test.describe('parametros — workspace (UI, sin persistencia)', () => {
  test.describe.configure({ timeout: 180_000 });

  test('smoke: carga, pestañas y modo consulta', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await waitParametrosWorkspaceReady(page);

    await expect(page.getByText(/Parámetros del período/i)).toBeVisible();
    await expect(page.getByRole('region', { name: 'Contenido de la sección' })).toBeVisible();
    await expect(
      page.getByRole('navigation', { name: 'Áreas de parámetros' }).getByRole('button'),
    ).toHaveCount(5);
    await expect(page.getByRole('button', { name: 'Cierre del período', exact: true })).toHaveClass(
      /parametros-area-tab--active/,
    );

    const anio = page.locator('#parametros-periodo-anio');
    const mes = page.locator('#parametros-periodo-mes');
    await expect(anio).toBeEnabled();
    await expect(mes).toBeEnabled();
    expect(await anio.inputValue()).toMatch(/^\d{4}$/);
    expect(await mes.inputValue()).toMatch(/^\d{2}$/);
    expect(await mes.locator('option').count()).toBe(12);
    await expect(page.getByRole('region', { name: 'Estado mensual' })).toBeVisible();

    await seleccionarTabParametros(page, 'Salud');
    await expect(page.getByRole('navigation', { name: 'Secciones de parámetros' })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Instituciones de salud', exact: true }),
    ).toBeVisible();

    await seleccionarTabParametros(page, 'Valores');
    await expect(
      page.getByRole('heading', { name: 'Valores oficiales del período', exact: true }),
    ).toBeVisible();

    const modificar = page.getByRole('button', { name: /^(Modificar|Preparando\.\.\.)$/ });
    await expect(modificar.first()).toBeVisible({ timeout: 15_000 });

    await seleccionarTabParametros(page, 'Cliente');
    await expect(page.getByRole('heading', { name: 'Configuración cliente del período' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Guardar' })).toHaveCount(0);

    for (const viewport of [{ width: 390, height: 844 }]) {
      await page.setViewportSize(viewport);
      await expect(page.locator('section.parametros-page')).toBeVisible({ timeout: 15_000 });
      await expect(page.getByRole('navigation', { name: 'Áreas de parámetros' }).getByRole('button')).toHaveCount(5);

      await page.getByRole('button', { name: 'Datos oficiales', exact: true }).click();
      await expect(page.getByRole('navigation', { name: 'Secciones de parámetros' }).getByRole('button')).toHaveCount(4);
      await expect(page.getByRole('button', { name: 'Valores', exact: true })).toHaveClass(/parametros-subtab--active/);

      await page.getByRole('button', { name: 'Catálogos necesarios', exact: true }).click();
      await expect(page.getByRole('navigation', { name: 'Secciones de parámetros' }).getByRole('button')).toHaveCount(3);
      await expect(page.getByRole('button', { name: 'Salud', exact: true })).toHaveClass(/parametros-subtab--active/);

      await page.getByRole('button', { name: 'Observación normativa', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Reforma de pensiones', exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: /APV inst\\./i })).toHaveCount(0);
      await expect(page.getByRole('button', { name: /APV pago/i })).toHaveCount(0);

      const sinScrollHorizontal = await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
      );
      expect(sinScrollHorizontal).toBe(true);
    }
  });
});
