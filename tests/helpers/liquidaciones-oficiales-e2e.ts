import { expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

import { loginNominasAdmin } from './nominas-admin-generador-e2e';

export const LIQUIDACIONES_E2E_TIMEOUT_MS = 120_000;

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

export async function loginYAbrirLiquidaciones(page: Page): Promise<void> {
  page.setDefaultTimeout(LIQUIDACIONES_E2E_TIMEOUT_MS);
  page.setDefaultNavigationTimeout(LIQUIDACIONES_E2E_TIMEOUT_MS);
  await loginNominasAdmin(page);

  const nominaPeriodoId = leerNominaPeriodoIdFixture();
  if (nominaPeriodoId) {
    await page.goto(`/remuneraciones/liquidaciones?nominaPeriodoId=${encodeURIComponent(nominaPeriodoId)}`);
    await expect(page.locator('section.liq-workers-zone')).toBeVisible({
      timeout: LIQUIDACIONES_E2E_TIMEOUT_MS,
    });
    return;
  }

  await page.goto('/remuneraciones/liquidaciones');
  await abrirPrimeraNominaConLiquidaciones(page);
}

export async function abrirPrimeraNominaConLiquidaciones(page: Page): Promise<void> {
  const workersZone = page.locator('section.liq-workers-zone');
  if (await workersZone.isVisible().catch(() => false)) {
    return;
  }

  const loading = page.locator('.liq-entrada--loading');
  if (await loading.isVisible().catch(() => false)) {
    await expect(loading).toBeHidden({ timeout: LIQUIDACIONES_E2E_TIMEOUT_MS });
  }

  const abrir = page.getByRole('button', { name: /^Abrir liquidaciones de / }).first();
  const sinNominas = page.getByText('No hay nóminas liquidadas o cerradas con comprobantes disponibles.');

  await Promise.race([
    abrir.waitFor({ state: 'visible', timeout: LIQUIDACIONES_E2E_TIMEOUT_MS }),
    sinNominas.waitFor({ state: 'visible', timeout: LIQUIDACIONES_E2E_TIMEOUT_MS }),
  ]);

  if (await sinNominas.isVisible()) {
    throw new Error('SKIP_NO_NOMINAS_LIQUIDACIONES');
  }

  await abrir.click();
  await expect(workersZone).toBeVisible({ timeout: LIQUIDACIONES_E2E_TIMEOUT_MS });
}
