import { expect, type Page } from '@playwright/test';

import { loginNominasAdmin } from './nominas-admin-generador-e2e';

export const PREVIRED_E2E_TIMEOUT_MS = 120_000;

export async function loginYAbrirPrevired(page: Page): Promise<void> {
  page.setDefaultTimeout(PREVIRED_E2E_TIMEOUT_MS);
  page.setDefaultNavigationTimeout(PREVIRED_E2E_TIMEOUT_MS);
  await loginNominasAdmin(page);
  await page.goto('/remuneraciones/previred');
  await expect(page.locator('.prev-page')).toBeVisible({ timeout: PREVIRED_E2E_TIMEOUT_MS });
}

export async function esperarBorradorPrevired(page: Page): Promise<'listo' | 'vacio' | 'sin_nominas'> {
  const sinNominas = page.getByText('Sin nóminas exportables', { exact: false });
  const resumen = page.locator('.prev-resumen');
  const bloqueado = page.getByText('No hay líneas exportables', { exact: false });

  await Promise.race([
    resumen.waitFor({ state: 'visible', timeout: PREVIRED_E2E_TIMEOUT_MS }),
    sinNominas.waitFor({ state: 'visible', timeout: PREVIRED_E2E_TIMEOUT_MS }),
    bloqueado.waitFor({ state: 'visible', timeout: PREVIRED_E2E_TIMEOUT_MS }),
  ]).catch(() => undefined);

  if (await sinNominas.isVisible().catch(() => false)) return 'sin_nominas';
  if (await resumen.isVisible().catch(() => false)) return 'listo';
  return 'vacio';
}
