import { test, expect } from '@playwright/test';

import { isE2eEmpleadosBorradorEnabled } from './helpers/e2e-env';
import {
  clickFinalizarAlta,
  pulsarAccionPrimariaShell,
  expectFinalizarAltaExito,
  FINALIZAR_ALTA_EXITO_RE,
  clickGuardarBorrador,
  waitGuardarBorradorTerminado,
  fillPaso0BorradorMinimo,
  fillWizardDependienteCompleto,
  gotoAltaAvanzada,
  pickSearchSelectOption,
  selectWizardResumenStep,
  selectWizardStepByIndex,
  uniqueFormattedRut,
  waitAdvancedFormReady,
} from './helpers/empleados-borrador-e2e';

const runDb = isE2eEmpleadosBorradorEnabled();
const describeDb = runDb ? test.describe : test.describe.skip;

describeDb('empleados — creación avanzada flujos (persistencia)', () => {
  test.describe.configure({ mode: 'serial', timeout: 300_000 });

  test('F5: alta dependiente feliz completa desde cero', async ({ page }) => {
    test.slow();
    const rut = uniqueFormattedRut();
    await gotoAltaAvanzada(page);
    await waitAdvancedFormReady(page);
    await fillPaso0BorradorMinimo(page, rut, 'Test Borrador Serial', 'Persistencia');
    await clickGuardarBorrador(page);
    await waitGuardarBorradorTerminado(page);
    await fillWizardDependienteCompleto(page);
    await selectWizardResumenStep(page);
    await clickFinalizarAlta(page);
    await expectFinalizarAltaExito(page);
  });

  test('F5 negativo: finalizar sin previsión muestra error estructurado', async ({ page }) => {
    const rut = uniqueFormattedRut();
    await gotoAltaAvanzada(page);
    await waitAdvancedFormReady(page);
    await fillPaso0BorradorMinimo(page, rut, 'Test Borrador Serial', 'Persistencia');
    await clickGuardarBorrador(page);
    await waitGuardarBorradorTerminado(page);

    await fillWizardDependienteCompleto(page);
    await selectWizardStepByIndex(page, 5);
    await pickSearchSelectOption(page, 'empleado-tipo-regimen-previsional', /Sin previs/i);
    await selectWizardResumenStep(page);
    await pulsarAccionPrimariaShell(page);
    await expect(
      page.getByRole('dialog', { name: /La ficha no está lista para finalizar/i }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(FINALIZAR_ALTA_EXITO_RE)).toHaveCount(0);
  });
});
