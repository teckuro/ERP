import { expect, type Page } from '@playwright/test';

export const NOMINA_E2E_TIMEOUT_MS = 30_000;

export function applyNominaE2eFastTimeouts(page: Page): void {
  page.setDefaultTimeout(NOMINA_E2E_TIMEOUT_MS);
  page.setDefaultNavigationTimeout(NOMINA_E2E_TIMEOUT_MS);
}

export async function loginNominaThroughUi(page: Page): Promise<void> {
  const email = process.env['E2E_SUPABASE_AUTH_EMAIL'] ?? '';
  const password = process.env['E2E_SUPABASE_AUTH_PASSWORD'] ?? '';

  applyNominaE2eFastTimeouts(page);
  await page.goto('/login?returnUrl=/remuneraciones/proceso-mensual');
  await expect(page.getByRole('heading', { name: 'Iniciar sesion' })).toBeVisible();
  await page.locator('#login-email').fill(email);
  await page.locator('#login-password').fill(password);
  await page.getByRole('button', { name: 'Iniciar sesion' }).click();
  await page.waitForURL('**/remuneraciones/proceso-mensual', { timeout: NOMINA_E2E_TIMEOUT_MS });
  await expect(page.locator('app-proceso-mensual-container')).toBeVisible({ timeout: NOMINA_E2E_TIMEOUT_MS });
}

/** Activa período vía deep link (mismo contrato que returnTo / flow query). */
export async function setPeriodoNominaShell(page: Page, periodoYm: string): Promise<void> {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(periodoYm.trim());
  if (!match) {
    throw new Error(`Periodo E2E invalido: ${periodoYm}`);
  }
  await page.goto(`/remuneraciones/proceso-mensual?periodo=${periodoYm.trim()}`);
  await expect(page.locator('app-proceso-mensual-container')).toBeVisible({ timeout: NOMINA_E2E_TIMEOUT_MS });
  await page.waitForLoadState('networkidle', { timeout: NOMINA_E2E_TIMEOUT_MS });
}

export async function clickNominaButtonAndWaitIdle(page: Page, name: RegExp | string): Promise<void> {
  await page.getByRole('button', { name }).first().click({ timeout: NOMINA_E2E_TIMEOUT_MS });
  await page.waitForLoadState('networkidle', { timeout: NOMINA_E2E_TIMEOUT_MS });
}

export function nominaFlowE2eCredentialsReady(): boolean {
  return Boolean(process.env['E2E_SUPABASE_AUTH_EMAIL'])
    && Boolean(process.env['E2E_SUPABASE_AUTH_PASSWORD'])
    && Boolean(process.env['E2E_NOMINA_PERIODO']);
}
