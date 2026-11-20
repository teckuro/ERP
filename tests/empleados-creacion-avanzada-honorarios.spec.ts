import { test, expect } from '@playwright/test';

import { isE2eEmpleadosBorradorEnabled } from './helpers/e2e-env';
import {
  clickFinalizarAlta,
  confirmarCambioHonorariosSiAplica,
  dismissBorradorGuardadoModal,
  expectFinalizarAltaExito,
  clickGuardarBorrador,
  waitGuardarBorradorTerminado,
  fillPaso0BorradorMinimo,
  fillWizardHonorariosMinimo,
  gotoAltaAvanzada,
  selectWizardResumenStep,
  uniqueFormattedRut,
  waitAdvancedFormReady,
} from './helpers/empleados-borrador-e2e';

const runDb = isE2eEmpleadosBorradorEnabled();
const describeDb = runDb ? test.describe : test.describe.skip;

describeDb('empleados — creación avanzada honorarios (persistencia)', () => {
  test.describe.configure({ mode: 'serial', timeout: 300_000 });

  test('F10: finalizar alta honorarios desde borrador', async ({ page }) => {
    test.slow();
    const rut = uniqueFormattedRut();
    await gotoAltaAvanzada(page);
    await waitAdvancedFormReady(page);
    await fillPaso0BorradorMinimo(page, rut, 'Test Borrador Serial', 'Persistencia');
    await clickGuardarBorrador(page);
    await waitGuardarBorradorTerminado(page);
    await dismissBorradorGuardadoModal(page);

    await fillWizardHonorariosMinimo(page);
    await selectWizardResumenStep(page);
    await clickFinalizarAlta(page);
    await expectFinalizarAltaExito(page);
  });
});
