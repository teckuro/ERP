import { test, expect } from '@playwright/test';

import { isE2eEmpleadosBorradorEnabled } from './helpers/e2e-env';
import {
  applyEstadoBorradorFilter,
  applyRutContainsFilter,
  gotoAltaAvanzada,
  openEmpleadosListado,
  waitAdvancedFormReady,
} from './helpers/empleados-borrador-e2e';
import {
  QA_AUDITORIA_RUT,
  QA_DISPLAY_RUT,
  readAuditoriaPersonaId,
} from './helpers/empleados-qa-fixtures';

const runDb = isE2eEmpleadosBorradorEnabled();
const describeDb = runDb ? test.describe : test.describe.skip;

describeDb('empleados — inferencia post-seed (lectura UI)', () => {
  test('F4: U3 Borrador Reanudar — rehidrata wizard por idPersona', async ({ page }) => {
    const idPersona = readAuditoriaPersonaId('U3');
    test.skip(idPersona == null, 'Ejecutar global-setup con auditoria U1–U8 antes de inferencia.');
    await gotoAltaAvanzada(page, `idPersona=${idPersona}`);
    await waitAdvancedFormReady(page);
    await expect(page.locator('#empleado-nombres')).toHaveValue(/Borrador Reanudar/i, { timeout: 25_000 });
  });

  test('F3: U2 aparece como Borrador en grilla', async ({ page }) => {
    await openEmpleadosListado(page);
    await applyEstadoBorradorFilter(page);
    await applyRutContainsFilter(page, QA_AUDITORIA_RUT.U2);
    const fila = page.locator('tbody tr').filter({ hasText: QA_DISPLAY_RUT.U2 });
    await expect(fila).toBeVisible({ timeout: 30_000 });
    await expect(fila.locator('.status-badge')).toContainText('Borrador');
  });

  test('ERR: listado muestra fixture sueldo cero (RUT 26.100.001)', async ({ page }) => {
    test.skip(
      (process.env['E2E_EMPLEADOS_SEED_ERR'] ?? '1').trim() === '0',
      'ERR omitido (E2E_EMPLEADOS_SEED_ERR=0).',
    );
    await openEmpleadosListado(page);
    await applyRutContainsFilter(page, '26100001');
    await expect(page.getByText('Cargando listado de empleados')).toBeHidden({ timeout: 60_000 });
    const fila = page.locator('tbody tr').filter({ hasText: QA_DISPLAY_RUT.ERR01 });
    await expect(
      fila.first(),
      'ERR01 ausente: ejecutar E2E_EMPLEADOS_BORRADOR=1 con global-setup (seed ERR --append).',
    ).toBeVisible({ timeout: 30_000 });
    await expect(fila.first()).toContainText(/Sueldo cero/i);
  });

  test('F4 URL directa: modo avanzado carga wizard', async ({ page }) => {
    await gotoAltaAvanzada(page);
    await waitAdvancedFormReady(page);
    await expect(page.locator('.advanced-create-shell')).toBeVisible();
  });
});
