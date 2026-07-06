import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

/** Login Supabase si la ruta redirige a `/login` (credenciales en `.env`). */
export async function ensureLoggedIn(page: Page): Promise<void> {
  await loginIfRedirected(page);
  if (await page.getByRole('heading', { name: 'Iniciar sesion' }).isVisible({ timeout: 500 }).catch(() => false)) {
    await page.reload({ waitUntil: 'networkidle' });
    await loginIfRedirected(page);
  }
}

async function loginIfRedirected(page: Page): Promise<void> {
  const loginHeading = page.getByRole('heading', { name: 'Iniciar sesion' });
  if (!(await loginHeading.isVisible({ timeout: 1500 }).catch(() => false))) {
    return;
  }

  const email = process.env['E2E_SUPABASE_AUTH_EMAIL'] ?? '';
  const password = process.env['E2E_SUPABASE_AUTH_PASSWORD'] ?? '';
  expect(email, 'Falta E2E_SUPABASE_AUTH_EMAIL para E2E autenticado.').not.toBe('');
  expect(password, 'Falta E2E_SUPABASE_AUTH_PASSWORD para E2E autenticado.').not.toBe('');

  await page.locator('#login-email').fill(email);
  await page.locator('#login-password').fill(password);
  await page.getByRole('button', { name: 'Iniciar sesion' }).click();
  await expect(page.getByRole('heading', { name: 'Iniciar sesion' })).toBeHidden({ timeout: 45_000 });
  await expect(page.getByRole('button', { name: 'Salir' })).toBeVisible({ timeout: 45_000 });
  await page.waitForLoadState('networkidle');
}
