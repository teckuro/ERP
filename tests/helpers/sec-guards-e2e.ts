import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

import { config } from 'dotenv';
import { resolve } from 'node:path';

config({ path: resolve(process.cwd(), '.env'), quiet: true });
config({ path: resolve(process.cwd(), '.env.local.e2e'), quiet: true });

export function consultaCredentialsReady(): boolean {
  const email =
    process.env['E2E_SUPABASE_AUTH_EMAIL_CONSULTA']
    ?? process.env['E2E_CONSULTA_EMAIL']
    ?? '';
  const password =
    process.env['E2E_SUPABASE_AUTH_PASSWORD_CONSULTA']
    ?? process.env['E2E_CONSULTA_PASSWORD']
    ?? '';
  return Boolean(email && password);
}

export async function loginConsulta(page: Page): Promise<void> {
  const email =
    process.env['E2E_SUPABASE_AUTH_EMAIL_CONSULTA']
    ?? process.env['E2E_CONSULTA_EMAIL']
    ?? '';
  const password =
    process.env['E2E_SUPABASE_AUTH_PASSWORD_CONSULTA']
    ?? process.env['E2E_CONSULTA_PASSWORD']
    ?? '';

  expect(email, 'Falta E2E_SUPABASE_AUTH_EMAIL_CONSULTA (npm run fixture:sec:consulta).').not.toBe('');
  expect(password, 'Falta E2E_SUPABASE_AUTH_PASSWORD_CONSULTA.').not.toBe('');

  await page.goto('/login');
  await page.locator('#login-email').fill(email);
  await page.locator('#login-password').fill(password);
  await page.getByRole('button', { name: 'Iniciar sesion' }).click();
  await expect(page.getByRole('heading', { name: 'Iniciar sesion' })).toBeHidden({ timeout: 45_000 });
  await expect(page.getByRole('button', { name: 'Salir' })).toBeVisible({ timeout: 45_000 });
  await page.waitForLoadState('networkidle');
}

export async function expectAccesoDenegado(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await expect(page).toHaveURL(/acceso=denegado/, { timeout: 15_000 });
}
