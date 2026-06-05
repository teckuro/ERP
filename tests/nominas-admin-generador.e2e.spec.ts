import { expect, test, type Page } from '@playwright/test';

const EMAIL = process.env['E2E_SUPABASE_AUTH_EMAIL'] ?? '';
const PASSWORD = process.env['E2E_SUPABASE_AUTH_PASSWORD'] ?? '';
const credencialesPresentes = Boolean(EMAIL) && Boolean(PASSWORD);

async function login(page: Page): Promise<void> {
  await page.goto('/login?returnUrl=/remuneraciones/nominas');
  await page.locator('#login-email').fill(EMAIL);
  await page.locator('#login-password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Iniciar sesion' }).click();
  await page.waitForURL('**/remuneraciones/nominas', { timeout: 60_000 });
}

test.describe('Administrador y generador de nóminas', () => {
  test.skip(
    !credencialesPresentes,
    'Requiere credenciales E2E autenticadas para consultar nóminas reales.',
  );
  test.describe.configure({ mode: 'serial', timeout: 120_000 });

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('muestra la bandeja operativa y abre el generador existente', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Administrador de nóminas' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Nueva nómina/i })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ver todas' })).toBeVisible();

    const abrir = page.getByRole('button', { name: /^Abrir$/ }).first();
    if ((await abrir.count()) === 0) {
      await expect(page.getByText('Aún no hay nóminas')).toBeVisible();
      return;
    }

    await abrir.click();
    await page.waitForURL(/\/remuneraciones\/nominas\/[^/]+\/generador/, { timeout: 30_000 });
    await expect(page.getByLabel('Generador de nómina')).toBeVisible();
  });
});
