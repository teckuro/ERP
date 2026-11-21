import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

import { test, expect } from '@playwright/test';

import { isE2eParametrosPersistenciaEnabled } from './helpers/e2e-env';
import {
  E2E_PARAMETROS_PERIODO,
  aplicarCargaOficialE2e,
  completarValoresClienteMinimos,
  esperarDialogoReconciliacion,
  guardarConfiguracionCliente,
  iniciarConfigClienteDesdeCero,
  resetReconciliacionClienteE2e,
  seleccionarTabParametros,
  waitParametrosWorkspaceReady,
} from './helpers/parametros-workspace-e2e';

const runFlujos = isE2eParametrosPersistenciaEnabled();
const describeFlujos = runFlujos ? test.describe : test.describe.skip;

const UF_CLIENTE = 36_000;
const UF_OFICIAL = 38_100;

/**
 * Recorrido BD: cliente guarda → script oficial (seed) → reconciliación (mantener / actualizar).
 * Periodo aislado: E2E_PARAMETROS_PERIODO (default 2026-06).
 */
describeFlujos('parametros — flujos cliente / oficial / reconciliacion (BD)', () => {
  test.describe.configure({ timeout: 300_000 });

  test('recorrido: config cliente, carga oficial y reconciliacion', async ({ page }) => {
    await waitParametrosWorkspaceReady(page, E2E_PARAMETROS_PERIODO);
    await expect(page.getByRole('button', { name: /^Modificar$/ })).toBeEnabled({ timeout: 60_000 });

    // --- 1) Cliente guarda sin oficial previo ---
    await iniciarConfigClienteDesdeCero(page);
    await completarValoresClienteMinimos(page, UF_CLIENTE);
    await guardarConfiguracionCliente(page);
    await expect(page.locator('.period-chip')).toContainText(/Configuracion parcial|Parcial/i, {
      timeout: 20_000,
    });

    const verify = spawnSync(
      process.execPath,
      [resolve(process.cwd(), 'scripts/verify-parametros-e2e-period.mjs'), '--periodo', E2E_PARAMETROS_PERIODO],
      { encoding: 'utf8', env: process.env },
    );
    expect(verify.status).toBe(0);
    expect(verify.stdout ?? '').toContain('cliente');

    // --- 2) Llega carga oficial (simula run-parametros-mensuales -ApplySql) ---
    aplicarCargaOficialE2e(E2E_PARAMETROS_PERIODO, UF_OFICIAL);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await waitParametrosWorkspaceReady(page, E2E_PARAMETROS_PERIODO);
    await esperarDialogoReconciliacion(page);

    // --- 3) Mantener configuracion del cliente ---
    const dialogRecon = page.getByRole('dialog').filter({
      hasText: 'Hay diferencias con los valores oficiales',
    });
    await dialogRecon.getByRole('button', { name: 'Mantener mi configuración' }).click();
    await expect(page.getByRole('heading', { name: 'Configuración mantenida' })).toBeVisible({
      timeout: 30_000,
    });
    await page.getByRole('button', { name: 'Aceptar' }).click();

    // --- 4) Nueva carga oficial + actualizar con oficiales ---
    // Tras «Mantener», la UI no reabre el aviso hasta nueva decisión pendiente en BD.
    resetReconciliacionClienteE2e(E2E_PARAMETROS_PERIODO);
    aplicarCargaOficialE2e(E2E_PARAMETROS_PERIODO, UF_OFICIAL + 50);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await waitParametrosWorkspaceReady(page, E2E_PARAMETROS_PERIODO);
    await esperarDialogoReconciliacion(page);
    const dialogActualizar = page.getByRole('dialog').filter({
      hasText: 'Hay diferencias con los valores oficiales',
    });
    await dialogActualizar.getByRole('button', { name: 'Actualizar con oficiales' }).click();
    await expect(page.getByRole('heading', { name: /Configuración guardada/i })).toBeVisible({
      timeout: 45_000,
    });
    await page.getByRole('button', { name: 'Aceptar' }).click();

    await seleccionarTabParametros(page, 'Valores');
    const ufInput = page.locator('app-parametros-valores-tab input[formcontrolname="uf"]');
    await expect(ufInput).toHaveValue(String(UF_OFICIAL + 50), { timeout: 15_000 });
  });
});
