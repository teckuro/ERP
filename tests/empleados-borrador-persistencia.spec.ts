import { test, expect } from '@playwright/test';

import { isE2eEmpleadosBorradorEnabled } from './helpers/e2e-env';
import {  applyEstadoBorradorFilter,
  applyRutContainsFilter,
  clickWizardSiguiente,
  fillCalendarInputByHostId,
  fillPaso0BorradorMinimo,
  openEmpleadosListado,
  parseIdPersonaFromUrl,
  pickFirstSearchSelectOption,
  pickSearchSelectOption,
  selectWizardStepByIndex,
  uniqueFormattedRut,
  waitAdvancedFormReady,
  waitGuardarBorradorTerminado,
} from './helpers/empleados-borrador-e2e';

const runPersistencia = isE2eEmpleadosBorradorEnabled();
const describePersist = runPersistencia ? test.describe : test.describe.skip;

/** Completa pasos 1–5 y 7 mínimos para poder finalizar en paso 9 (previsión NINGUNA). */
async function fillWizardMinimalParaFinalizar(page: import('@playwright/test').Page): Promise<void> {
  await selectWizardStepByIndex(page, 0);
  await page.locator('#empleado-apellido-paterno').click();

  await selectWizardStepByIndex(page, 1);
  await page.locator('#empleado-direccion').fill('Calle E2E Ficticia 100');
  await page.locator('#empleado-numero-direccion').fill('200');
  await pickFirstSearchSelectOption(page, 'empleado-comuna');

  await selectWizardStepByIndex(page, 2);
  await fillCalendarInputByHostId(page, 'empleado-fecha-ingreso', '2024-06-01');
  await fillCalendarInputByHostId(page, 'empleado-fecha-contrato', '2024-06-01');
  await pickFirstSearchSelectOption(page, 'empleado-tipo-trabajador');
  await pickSearchSelectOption(page, 'empleado-tipo-contrato', /INDEFINIDO/i);
  await pickFirstSearchSelectOption(page, 'empleado-sucursal');
  await pickFirstSearchSelectOption(page, 'empleado-departamento');
  await pickFirstSearchSelectOption(page, 'empleado-centro-costo');
  await page.locator('#empleado-cargo').fill('Analista E2E');
  await pickSearchSelectOption(page, 'empleado-estado', /en proceso/i);

  await selectWizardStepByIndex(page, 3);
  await pickFirstSearchSelectOption(page, 'empleado-tipo-jornada');
  await page.locator('#empleado-horas-semanales').fill('45');
  await page.locator('#empleado-dias-semanales').fill('5');
  await page.locator('#empleado-sueldo-base').fill('1800000');
  await pickFirstSearchSelectOption(page, 'empleado-id-moneda');
  await pickFirstSearchSelectOption(page, 'empleado-tipo-gratificacion');

  await selectWizardStepByIndex(page, 4);
  await page.locator('#empleado-cargas').fill('0');
  await pickFirstSearchSelectOption(page, 'empleado-tramo-carga');
  await page.locator('#empleado-cargas').blur();

  await selectWizardStepByIndex(page, 5);
  await pickSearchSelectOption(page, 'empleado-tipo-regimen-previsional', /Sin prevision/i);

  await selectWizardStepByIndex(page, 7);
  await pickFirstSearchSelectOption(page, 'empleado-banco');
  await pickFirstSearchSelectOption(page, 'empleado-tipo-cuenta');
  // Evita colisiones por constraint `uq_cuenta_bancaria_numero` entre corridas de E2E.
  const uniqueCuenta = String(Date.now() % 1_000_000_000).padStart(9, '0');
  await page.locator('#empleado-numero-cuenta').fill(uniqueCuenta);

  await selectWizardStepByIndex(page, 0);
  await page.locator('#empleado-nombres').press('Tab');
}

describePersist('empleados — borrador persistencia (Supabase)', () => {
  test.describe.configure({ mode: 'serial', timeout: 240_000 });

  test.describe('flujo: guardar → listado → continuar desde grilla → doble guardado', () => {
    const rut = uniqueFormattedRut();
    const rutDigits = rut.replace(/\./g, '');
    const nombreInicial = 'Test Borrador Serial';
    const nombreActualizado = 'Test Borrador Actualizado';
    let personaId = 0;

    test('guardar borrador paso 0 y URL con idPersona', async ({ page }) => {
      await page.goto('/empleados/nuevo');
      await waitAdvancedFormReady(page);
      await fillPaso0BorradorMinimo(page, rut, nombreInicial, 'Persistencia');
      await page.getByTestId('guardar-borrador-avanzado').click();
      await waitGuardarBorradorTerminado(page);
      await expect(page).toHaveURL(/idPersona=\d+/, { timeout: 15_000 });
      const id = parseIdPersonaFromUrl(page.url());
      expect(id).not.toBeNull();
      personaId = id!;
    });

    test('listado: filtros, chip Borrador, Continuar alta y carga del borrador', async ({ page }) => {
      await openEmpleadosListado(page);
      await applyEstadoBorradorFilter(page);
      await expect(page.getByText('Cargando listado de empleados')).toBeHidden({ timeout: 60_000 });
      await applyRutContainsFilter(page, rutDigits);
      await expect(page.getByText('Cargando listado de empleados')).toBeHidden({ timeout: 60_000 });

      const filaBorrador = page.locator('tbody tr').filter({ hasText: rut });
      await expect(filaBorrador).toBeVisible({ timeout: 30_000 });
      await expect(filaBorrador.locator('.status-badge')).toContainText('Borrador');
      await expect(filaBorrador.getByTestId('continuar-alta')).toBeVisible();

      await filaBorrador.getByTestId('continuar-alta').click();
      await page.waitForURL(new RegExp(`/empleados/nuevo.*idPersona=${personaId}`), { timeout: 30_000 });
      await waitAdvancedFormReady(page);
      await expect(page.locator('#empleado-nombres')).toHaveValue(nombreInicial, { timeout: 20_000 });
    });

    test('segundo guardado borrador: actualiza nombre; una sola fila en listado', async ({ page }) => {
      await page.goto(`/empleados/nuevo?idPersona=${personaId}`);
      await waitAdvancedFormReady(page);
      const nombresInput = page.locator('#empleado-nombres');
      await nombresInput.scrollIntoViewIfNeeded();
      await expect(nombresInput).not.toHaveValue('', { timeout: 25_000 });
      await nombresInput.fill(nombreActualizado);
      await page.locator('#empleado-apellido-paterno').click();
      await expect(nombresInput).toHaveValue(nombreActualizado);
      await page.getByTestId('guardar-borrador-avanzado').click();
      await expect(page.getByRole('status').filter({ hasText: 'Borrador actualizado.' })).toBeVisible({
        timeout: 45_000,
      });
      await waitGuardarBorradorTerminado(page);

      await openEmpleadosListado(page);
      await applyEstadoBorradorFilter(page);
      await expect(page.getByText('Cargando listado de empleados')).toBeHidden({ timeout: 60_000 });
      await applyRutContainsFilter(page, rutDigits);
      await expect(page.getByText('Cargando listado de empleados')).toBeHidden({ timeout: 60_000 });

      const fila = page.locator('tbody tr').filter({ hasText: rut });
      await expect(fila).toHaveCount(1, { timeout: 25_000 });
      await expect(fila).toContainText(nombreActualizado, { timeout: 20_000 });
    });
  });

  test('finalizar alta desde borrador (paso 9)', async ({ page }) => {
    test.setTimeout(300_000);
    test.slow();
    const rutFin = uniqueFormattedRut();
    await page.goto('/empleados/nuevo');
    await waitAdvancedFormReady(page);
    await fillPaso0BorradorMinimo(page, rutFin, 'Finalizar Alta Prueba', 'Borrador');
    await page.getByTestId('guardar-borrador-avanzado').click();
    await waitGuardarBorradorTerminado(page);
    await expect(page).toHaveURL(/idPersona=\d+/);
    const id = parseIdPersonaFromUrl(page.url());
    expect(id).not.toBeNull();

    await page.goto(`/empleados/nuevo?idPersona=${id}`);
    await waitAdvancedFormReady(page);
    await fillWizardMinimalParaFinalizar(page);

    await selectWizardStepByIndex(page, 8);
    await page.getByTestId('finalizar-alta').click();
    await expect(
      page.getByText('La ficha avanzada fue guardada correctamente y el empleado quedo listo para operar.'),
    ).toBeVisible({ timeout: 120_000 });
  });

  test('APVI: AFP sin APVI — desde previsión Siguiente llega a banco', async ({ page }) => {
    await page.goto('/empleados/nuevo');
    await waitAdvancedFormReady(page);
    await selectWizardStepByIndex(page, 5);
    await pickSearchSelectOption(page, 'empleado-tipo-regimen-previsional', /^AFP$/i);
    await page.locator('#empleado-tiene-apv').setChecked(false);
    await pickFirstSearchSelectOption(page, 'empleado-afp');
    await clickWizardSiguiente(page);
    await expect(page.getByRole('heading', { name: 'Cuenta de abono' })).toBeVisible({ timeout: 20_000 });
  });

  test('APVI: AFP con APVI — Siguiente muestra bloque APVI', async ({ page }) => {
    await page.goto('/empleados/nuevo');
    await waitAdvancedFormReady(page);
    await selectWizardStepByIndex(page, 5);
    await pickSearchSelectOption(page, 'empleado-tipo-regimen-previsional', /^AFP$/i);
    await page.locator('#empleado-tiene-apv').setChecked(true);
    await pickFirstSearchSelectOption(page, 'empleado-afp');
    await clickWizardSiguiente(page);
    await expect(page.getByRole('heading', { name: /APVI - Ahorro/i })).toBeVisible({ timeout: 20_000 });
  });

  test('IPS: desde previsión Siguiente llega a banco (APVI no aplica)', async ({ page }) => {
    await page.goto('/empleados/nuevo');
    await waitAdvancedFormReady(page);
    await selectWizardStepByIndex(page, 5);
    await pickSearchSelectOption(page, 'empleado-tipo-regimen-previsional', /IPS/i);
    await clickWizardSiguiente(page);
    await expect(page.getByRole('heading', { name: 'Cuenta de abono' })).toBeVisible({ timeout: 20_000 });
  });

  test('RUT duplicado: segundo alta con mismo RUT muestra modal', async ({ page }) => {
    const rutDup = uniqueFormattedRut();
    await page.goto('/empleados/nuevo');
    await waitAdvancedFormReady(page);
    await fillPaso0BorradorMinimo(page, rutDup, 'Primera', 'Ficha');
    await page.getByTestId('guardar-borrador-avanzado').click();
    await waitGuardarBorradorTerminado(page);
    await expect(page).toHaveURL(/idPersona=\d+/);

    await page.goto('/empleados/nuevo');
    await waitAdvancedFormReady(page);
    await fillPaso0BorradorMinimo(page, rutDup, 'Segunda', 'Intento');
    await page.getByTestId('guardar-borrador-avanzado').click();
    await waitGuardarBorradorTerminado(page);
    await expect(page.getByText('Ficha ya registrada')).toBeVisible({ timeout: 45_000 });
  });
});
