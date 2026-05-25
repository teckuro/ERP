import { test, expect } from '@playwright/test';

import { isE2eEmpleadosBorradorEnabled } from './helpers/e2e-env';
import {
  applyEstadoBorradorFilter,
  applyRutContainsFilter,
  clickFinalizarAlta,
  clickGuardarBorrador,
  clickWizardSiguiente,
  fillPaso0BorradorMinimo,
  gotoAltaAvanzada,
  openEmpleadosListado,
  openEmpleadoRowPrimaryAction,
  parseIdPersonaFromUrl,
  pickFirstSearchSelectOption,
  pickSearchSelectOption,
  selectWizardResumenStep,
  selectWizardStepByIndex,
  expectFinalizarAltaExito,
  expectRutDuplicadoAlGuardarBorrador,
  expectWizardPasoTitulo,
  fillWizardDependienteCompleto,
  uniqueFormattedRut,
  waitAdvancedFormReady,
  waitGuardarBorradorTerminado,
} from './helpers/empleados-borrador-e2e';

const runPersistencia = isE2eEmpleadosBorradorEnabled();
const describePersist = runPersistencia ? test.describe : test.describe.skip;

describePersist('empleados — borrador persistencia (Supabase)', () => {
  test.describe.configure({ mode: 'serial', timeout: 240_000 });

  test.describe('flujo: guardar → listado → continuar desde grilla → doble guardado', () => {
    const rut = uniqueFormattedRut();
    const rutDigits = rut.replace(/\./g, '');
    const nombreInicial = 'Test Borrador Serial';
    const nombreActualizado = 'Test Borrador Actualizado';
    let personaId = 0;

    test('guardar borrador paso 0 y URL con idPersona', async ({ page }) => {
      await gotoAltaAvanzada(page);
      await waitAdvancedFormReady(page);
      await fillPaso0BorradorMinimo(page, rut, nombreInicial, 'Persistencia');
      await clickGuardarBorrador(page);
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

      await openEmpleadoRowPrimaryAction(page, rut);
      await page.waitForURL(new RegExp(`/empleados/nuevo.*idPersona=${personaId}`), { timeout: 30_000 });
      await waitAdvancedFormReady(page);
      await expect(page.locator('#empleado-nombres')).toHaveValue(nombreInicial, { timeout: 20_000 });
    });

    test('segundo guardado borrador: actualiza nombre; una sola fila en listado', async ({ page }) => {
      await gotoAltaAvanzada(page, `idPersona=${personaId}`);
      await waitAdvancedFormReady(page);
      const nombresInput = page.locator('#empleado-nombres');
      await nombresInput.scrollIntoViewIfNeeded();
      await expect(nombresInput).not.toHaveValue('', { timeout: 25_000 });
      await nombresInput.fill(nombreActualizado);
      await page.locator('#empleado-apellido-paterno').click();
      await expect(nombresInput).toHaveValue(nombreActualizado);
      await clickGuardarBorrador(page);
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
    await gotoAltaAvanzada(page);
    await waitAdvancedFormReady(page);
    await fillPaso0BorradorMinimo(page, rutFin, 'Finalizar Alta Prueba', 'Borrador');
    await clickGuardarBorrador(page);
    await waitGuardarBorradorTerminado(page);
    await expect(page).toHaveURL(/idPersona=\d+/);
    const id = parseIdPersonaFromUrl(page.url());
    expect(id).not.toBeNull();

    await gotoAltaAvanzada(page, `idPersona=${id}`);
    await waitAdvancedFormReady(page);
    await fillWizardDependienteCompleto(page);

    await selectWizardResumenStep(page);
    await clickFinalizarAlta(page);
    await expectFinalizarAltaExito(page);
  });

  test('APVI: AFP sin APVI — desde previsión Siguiente llega a banco', async ({ page }) => {
    const rut = uniqueFormattedRut();
    await gotoAltaAvanzada(page);
    await waitAdvancedFormReady(page);
    await fillPaso0BorradorMinimo(page, rut, 'Test Borrador Serial', 'Persistencia');
    await clickGuardarBorrador(page);
    await waitGuardarBorradorTerminado(page);
    await selectWizardStepByIndex(page, 5);
    await pickSearchSelectOption(page, 'empleado-tipo-regimen-previsional', /^AFP$/i);
    await page.locator('#empleado-tiene-apv').setChecked(false);
    await pickFirstSearchSelectOption(page, 'empleado-afp');
    await pickFirstSearchSelectOption(page, 'empleado-salud');
    await page.locator('#empleado-valor-plan').fill('4.2');
    await selectWizardStepByIndex(page, 7);
    await expectWizardPasoTitulo(page, 'Cuenta de abono');
  });

  test('APVI: AFP con APVI — Siguiente muestra bloque APVI', async ({ page }) => {
    const rut = uniqueFormattedRut();
    await gotoAltaAvanzada(page);
    await waitAdvancedFormReady(page);
    await fillPaso0BorradorMinimo(page, rut, 'Test APVI Con', 'Persistencia');
    await clickGuardarBorrador(page);
    await waitGuardarBorradorTerminado(page);
    await selectWizardStepByIndex(page, 5);
    await pickSearchSelectOption(page, 'empleado-tipo-regimen-previsional', /^AFP$/i);
    await page.locator('#empleado-tiene-apv').setChecked(true);
    await pickFirstSearchSelectOption(page, 'empleado-afp');
    await pickFirstSearchSelectOption(page, 'empleado-salud');
    await page.locator('#empleado-valor-plan').fill('4.2');
    await selectWizardStepByIndex(page, 6);
    await expectWizardPasoTitulo(page, /APVI - Ahorro/i);
  });

  test('IPS: desde previsión Siguiente llega a banco (APVI no aplica)', async ({ page }) => {
    const rut = uniqueFormattedRut();
    await gotoAltaAvanzada(page);
    await waitAdvancedFormReady(page);
    await fillPaso0BorradorMinimo(page, rut, 'Test Borrador Serial', 'Persistencia');
    await clickGuardarBorrador(page);
    await waitGuardarBorradorTerminado(page);
    await selectWizardStepByIndex(page, 5);
    await pickSearchSelectOption(page, 'empleado-tipo-regimen-previsional', /IPS/i);
    await pickFirstSearchSelectOption(page, 'empleado-entidad-previsional-ips');
    await pickFirstSearchSelectOption(page, 'empleado-salud');
    await page.locator('#empleado-valor-plan').fill('4.2');
    await selectWizardStepByIndex(page, 7);
    await expectWizardPasoTitulo(page, 'Cuenta de abono');
  });

  test('RUT duplicado: segundo alta con mismo RUT muestra modal', async ({ page }) => {
    const rutDup = uniqueFormattedRut();
    await gotoAltaAvanzada(page);
    await waitAdvancedFormReady(page);
    await fillPaso0BorradorMinimo(page, rutDup, 'Test Borrador Serial', 'Persistencia');
    await clickGuardarBorrador(page);
    await waitGuardarBorradorTerminado(page);

    await gotoAltaAvanzada(page);
    await waitAdvancedFormReady(page);
    await fillPaso0BorradorMinimo(page, rutDup, 'Test Borrador Serial', 'Duplicado');
    await clickGuardarBorrador(page);
    await expectRutDuplicadoAlGuardarBorrador(page);
  });
});
