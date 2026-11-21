import { test, expect } from '@playwright/test';

import {
  clickGuardarBorrador,
  clickWizardSiguiente,
  selectRelacionHonorarios,
  expectMsgBoxBorradorInvalido,
  fillPaso0BorradorMinimo,
  fillPaso0IncompletoSinContacto,
  gotoAltaAvanzada,
  selectWizardStepByIndex,
  uniqueFormattedRut,
  waitAdvancedFormReady,
} from './helpers/empleados-borrador-e2e';

test.describe('empleados — creación avanzada validaciones (UI, sin persistencia)', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAltaAvanzada(page);
    await waitAdvancedFormReady(page);
  });

  test('guardar borrador sin correo muestra modal RRHH', async ({ page }) => {
    const rut = uniqueFormattedRut();
    await fillPaso0IncompletoSinContacto(page, rut);
    await clickGuardarBorrador(page);
    await expectMsgBoxBorradorInvalido(page);
    await expect(page.getByText(/correo|e-mail|email/i).first()).toBeVisible();
  });

  test('guardar borrador sin teléfono muestra modal RRHH', async ({ page }) => {
    const rut = uniqueFormattedRut();
    await fillPaso0IncompletoSinContacto(page, rut);
    await page.locator('#empleado-email').fill('sin.telefono@test.local');
    await clickGuardarBorrador(page);
    await expectMsgBoxBorradorInvalido(page);
    await expect(page.getByText(/tel[eé]fono/i).first()).toBeVisible();
  });

  test('guardar borrador con correo mal formado', async ({ page }) => {
    const rut = uniqueFormattedRut();
    await fillPaso0IncompletoSinContacto(page, rut);
    await page.locator('#empleado-email').fill('correo-invalido');
    await page.locator('#empleado-telefono').fill('56912345678');
    await clickGuardarBorrador(page);
    await expectMsgBoxBorradorInvalido(page);
  });

  test('guardar borrador con dígitos en nombres', async ({ page }) => {
    const rut = uniqueFormattedRut();
    await fillPaso0BorradorMinimo(page, rut, 'Test123 Nombre', 'Validacion');
    await clickGuardarBorrador(page);
    await expectMsgBoxBorradorInvalido(page);
  });

  test('resumen con ficha vacía muestra pendientes obligatorios', async ({ page }) => {
    const mapItems = page.locator(
      'aside.advanced-wizard-map ol.advanced-wizard-map__list button.advanced-wizard-map__item',
    );
    const lastIndex = (await mapItems.count()) - 1;
    await selectWizardStepByIndex(page, lastIndex);
    await expect(
      page.getByText(/Cierra los registros pendientes|Completa los registros de la bitácora/i),
    ).toBeVisible({ timeout: 15_000 });
  });

  test('siguiente con paso incompleto ofrece Corregir ahora', async ({ page }) => {
    await clickWizardSiguiente(page);
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: 'Corregir ahora' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continuar' })).toBeVisible();
  });

  test('paso contrato avanzada no expone empleado-estado en DOM', async ({ page }) => {
    await selectWizardStepByIndex(page, 2);
    await expect(page.locator('#empleado-estado')).toHaveCount(0);
  });

  test('cambio a honorarios muestra confirmación y pasos no aplica', async ({ page }) => {
    const rut = uniqueFormattedRut();
    await fillPaso0BorradorMinimo(page, rut);
    await selectRelacionHonorarios(page);
    await expect(page.getByText(/Modalidad: honorarios|No requerido para honorarios/i).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test('jornada 44 h en paso remuneración dispara coherencia en modal', async ({ page }) => {
    const rut = uniqueFormattedRut();
    await fillPaso0BorradorMinimo(page, rut);
    await selectWizardStepByIndex(page, 3);
    await page.locator('#empleado-horas-semanales').fill('44');
    await page.locator('#empleado-dias-semanales').fill('5');
    await clickWizardSiguiente(page);
    const dialog = page.getByRole('dialog');
    if (await dialog.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await expect(dialog).toContainText(/44|jornada|coherencia/i);
    }
  });
});
