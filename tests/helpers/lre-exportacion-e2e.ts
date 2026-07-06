import { expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

import { loginNominasAdmin } from './nominas-admin-generador-e2e';

export const LRE_E2E_TIMEOUT_MS = 120_000;

const SNAPSHOT_PATH = path.resolve(process.cwd(), '.cursor', 'e2e-liq-estado-restore.json');

function leerNominaPeriodoIdFixture(): string | null {
  if (!fs.existsSync(SNAPSHOT_PATH)) return null;
  try {
    const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8')) as { nominaPeriodoId?: string };
    return snapshot.nominaPeriodoId ?? null;
  } catch {
    return null;
  }
}

export async function loginYAbrirLre(page: Page, nominaPeriodoId?: string | null): Promise<void> {
  page.setDefaultTimeout(LRE_E2E_TIMEOUT_MS);
  page.setDefaultNavigationTimeout(LRE_E2E_TIMEOUT_MS);
  await loginNominasAdmin(page);

  const id = nominaPeriodoId ?? leerNominaPeriodoIdFixture();
  if (id) {
    await page.goto(`/remuneraciones/lre?nominaPeriodoId=${encodeURIComponent(id)}`);
  } else {
    await page.goto('/remuneraciones/lre');
  }

  await expect(page.locator('.sal-ext-page')).toBeVisible({ timeout: LRE_E2E_TIMEOUT_MS });
}

export async function esperarBorradorLre(page: Page): Promise<'listo' | 'vacio' | 'sin_nominas'> {
  const sinNominas = page.getByText('Sin nóminas exportables', { exact: false });
  const resumen = page.locator('.sal-ext-resumen');
  const bloqueado = page.getByText('Sin líneas exportables', { exact: false });

  await Promise.race([
    resumen.waitFor({ state: 'visible', timeout: LRE_E2E_TIMEOUT_MS }),
    sinNominas.waitFor({ state: 'visible', timeout: LRE_E2E_TIMEOUT_MS }),
    bloqueado.waitFor({ state: 'visible', timeout: LRE_E2E_TIMEOUT_MS }),
  ]).catch(() => undefined);

  if (await sinNominas.isVisible().catch(() => false)) return 'sin_nominas';
  if (await resumen.isVisible().catch(() => false)) return 'listo';
  return 'vacio';
}

export async function abrirPrimeraNominaExportableLre(page: Page): Promise<void> {
  const resumen = page.locator('.sal-ext-resumen');
  if (await resumen.isVisible().catch(() => false)) return;

  await page.getByTestId('lre:abrir-modal-nomina').click();
  const fila = page.locator('.sal-ext-seleccion__grid-wrap tr.data-grid-row').first();
  await expect(fila).toBeVisible({ timeout: LRE_E2E_TIMEOUT_MS });
  await fila.click();
  await expect(resumen).toBeVisible({ timeout: LRE_E2E_TIMEOUT_MS });
}
