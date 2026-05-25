import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

/** DV modulo 11 para cuerpo numérico del RUT (sin puntos ni guión). */
export function computeChileRutDv(body: string): string {
  let sum = 0;
  let mult = 2;
  for (let i = body.length - 1; i >= 0; i -= 1) {
    sum += Number(body[i]) * mult;
    mult = mult === 7 ? 2 : mult + 1;
  }
  const v = 11 - (sum % 11);
  if (v === 11) return '0';
  if (v === 10) return 'K';
  return String(v);
}

/** RUT único formateado para E2E (datos ficticios). */
export function uniqueFormattedRut(): string {
  const base = String(Date.now() % 99_000_000 + 1_000_000).padStart(8, '0');
  const dv = computeChileRutDv(base);
  return `${base.slice(0, 2)}.${base.slice(2, 5)}.${base.slice(5, 8)}-${dv}`;
}

export function parseIdPersonaFromUrl(url: string): number | null {
  const m = url.match(/[?&]idPersona=(\d+)/);
  return m ? Number(m[1]) : null;
}

export { ensureLoggedIn } from './e2e-auth';

export async function waitAdvancedFormReady(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
  await ensureLoggedIn(page);
  await expect(page.getByText('Preparando campos')).toBeHidden({ timeout: 60_000 });
  await expect(page.locator('.advanced-create-shell')).toBeVisible({ timeout: 60_000 });
  await expect(page.locator('.advanced-wizard-content')).toBeVisible();

  if (page.url().includes('idPersona=')) {
    const errorFicha = page.getByText('No se encontro la ficha indicada para continuar el alta.');
    const tieneError = await errorFicha.isVisible({ timeout: 8_000 }).catch(() => false);
    if (!tieneError) {
      await selectWizardStepByIndex(page, 0);
      await expect(page.locator('#empleado-nombres')).not.toHaveValue('', { timeout: 90_000 });
    }
  }
}

/** Texto del modal de éxito al finalizar alta avanzada (copia UI con tilde en «quedó»). */
export const FINALIZAR_ALTA_EXITO_RE =
  /ficha avanzada fue guardada correctamente.*empleado qued[oó] listo para operar/i;

export async function expectFinalizarAltaExito(page: Page, timeoutMs = 120_000): Promise<void> {
  const modal = page.getByRole('dialog', { name: /Empleado registrado/i });
  await expect(modal).toBeVisible({ timeout: timeoutMs });
  await expect(modal.getByText(FINALIZAR_ALTA_EXITO_RE)).toBeVisible({ timeout: 5_000 });
}

export async function gotoAltaAvanzada(page: Page, extraQuery = ''): Promise<void> {
  const base = '/empleados/nuevo?modo=avanzado';
  const url = extraQuery
    ? `${base}&${extraQuery.replace(/^\?|&/, '')}`
    : base;
  await page.goto(url);
}

export async function gotoAltaBasica(page: Page, extraQuery = ''): Promise<void> {
  const base = '/empleados/nuevo?modo=basico';
  const url = extraQuery
    ? `${base}&${extraQuery.replace(/^\?|&/, '')}`
    : base;
  await page.goto(url);
}

export async function waitBasicFormReady(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
  await ensureLoggedIn(page);
  await expect(page.getByText('Preparando campos')).toBeHidden({ timeout: 60_000 });
  await expect(page.locator('.basic-create-page, .basic-create-shell').first()).toBeVisible({
    timeout: 60_000,
  });
}

export async function clickGuardarBorrador(page: Page): Promise<void> {
  const byTestId = page.getByTestId('empleado-alta-avanzada-guardar');
  if (await byTestId.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await byTestId.click();
    return;
  }
  await page.getByRole('button', { name: /^Guardar borrador$/ }).click();
}

/** Confirma el MsgBox de cierre del alta avanzada (dependiente u honorarios). */
export async function confirmarModalFinalizarAlta(page: Page): Promise<void> {
  const confirm = page.getByRole('dialog', {
    name: /Finalizar alta del trabajador|Finalizar boleta de honorarios|Finalizar honorarios/i,
  });
  const invalid = page.getByRole('dialog', { name: /La ficha no está lista para finalizar/i });

  const outcome = await Promise.race([
    expect(confirm).toBeVisible({ timeout: 30_000 }).then(() => 'confirm' as const),
    expect(invalid).toBeVisible({ timeout: 30_000 }).then(() => 'invalid' as const),
  ]);

  if (outcome === 'invalid') {
    const campos = await invalid.locator('.advanced-action-field__title').allTextContents();
    const detail = (await invalid.innerText()).replace(/\s+/g, ' ').trim().slice(0, 400);
    const lista = campos.map((c) => c.trim()).filter(Boolean).join(' | ');
    throw new Error(
      `La ficha no está lista para finalizar${lista ? ` [${lista}]` : ''}: ${detail}`,
    );
  }

  await confirm.getByRole('button', { name: /^Finalizar (alta|honorarios)$/ }).click();
}

/** Cierra paneles flotantes que bloquean clics (select, calendario) sin Escape global (revierte modales MsgBox). */
export async function cerrarOverlaysActivos(page: Page): Promise<void> {
  const panels = page.locator('.select-panel:visible');
  if ((await panels.count()) > 0) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(120);
    await expect(page.locator('.select-panel:visible')).toHaveCount(0, { timeout: 3_000 });
  }
}

/** Solo pulsa la acción primaria del shell (sin confirmar MsgBox). */
export async function pulsarAccionPrimariaShell(page: Page): Promise<void> {
  const byTestId = page.getByTestId('empleado-alta-avanzada-guardar');
  if (await byTestId.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await byTestId.click();
    return;
  }
  await page.getByRole('button', { name: /^Finalizar (alta|honorarios)|^Guardar borrador$/ }).click();
}

/** CTA shell en resumen + confirmación en MsgBox de cierre. */
export async function clickFinalizarAlta(page: Page): Promise<void> {
  await pulsarAccionPrimariaShell(page);
  await confirmarModalFinalizarAlta(page);
}

/** Convierte `YYYY-MM-DD` al texto que espera el mask dd/mm/aaaa del calendar-input. */
function calendarDisplayValueFromIsoOrPassThrough(value: string): string {
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const [, y, m, d] = iso;
    return `${d}/${m}/${y}`;
  }
  return value;
}

/**
 * Rellena fechas en `app-calendar-input`: el mismo `id` suele proyectarse al host y al `<input>`,
 * lo que rompe el strict mode de Playwright con `#id` a secas.
 * Usar `YYYY-MM-DD` o ya `dd/mm/aaaa`: el mask del componente no acepta ISO literal en el input.
 */
export async function fillCalendarInputByHostId(page: Page, hostId: string, value: string): Promise<void> {
  const input = page.locator(`app-calendar-input#${hostId} input[type="text"]`);
  await expect(input).toBeVisible({ timeout: 15_000 });
  await input.fill(calendarDisplayValueFromIsoOrPassThrough(value));
  await input.blur();
  await page.keyboard.press('Escape');
  await page.waitForTimeout(150);
}

/** Botón disparador del `app-search-select` (mismo `id` en host y en `button.select-field` → strict mode). */
function searchSelectTrigger(page: Page, triggerId: string) {
  return page.locator(`button.select-field#${triggerId}`).first();
}

function visibleSelectPanel(page: Page) {
  return page.locator('.select-panel:visible').last();
}

/** Abre el panel del `app-search-select` con `id` en el trigger y elige la opción en ese panel (no global). */
export async function pickSearchSelectOption(
  page: Page,
  triggerId: string,
  optionMatcher: string | RegExp,
): Promise<void> {
  const trigger = searchSelectTrigger(page, triggerId);
  await expect(trigger).toBeVisible({ timeout: 15_000 });
  await trigger.click();
  const panel = visibleSelectPanel(page);
  await expect(panel).toBeVisible({ timeout: 10_000 });
  const opt =
    typeof optionMatcher === 'string'
      ? panel.getByRole('option', { name: optionMatcher, exact: false }).first()
      : panel.getByRole('option', { name: optionMatcher }).first();
  await expect(opt).toBeVisible({ timeout: 10_000 });
  await opt.click();
  await page.keyboard.press('Escape');
  await page.waitForTimeout(150);
}

export async function fillPaso0BorradorMinimo(
  page: Page,
  rut: string,
  nombres = 'Test Borrador E2E',
  apellido = 'Automatizado',
): Promise<void> {
  await page.locator('#empleado-rut').fill(rut);
  await page.locator('#empleado-rut').blur();
  await fillCalendarInputByHostId(page, 'empleado-fecha-nacimiento', '1990-01-01');
  await page.locator('#empleado-nombres').fill(nombres);
  await page.locator('#empleado-apellido-paterno').fill(apellido);
  await pickFirstSearchSelectOption(page, 'empleado-idPais');
  const rutKey = rut.replace(/\D/g, '').slice(-12) || String(Date.now());
  await page.locator('#empleado-email').scrollIntoViewIfNeeded();
  await page.locator('#empleado-email').fill(`e2e.${rutKey}@test.local`);
  await page.locator('#empleado-telefono').scrollIntoViewIfNeeded();
  await page.locator('#empleado-telefono').fill(`9${String(Date.now()).slice(-8)}`);
  await page.locator('#empleado-telefono').blur();
  /** Obligatorios para `validateBorradorAvanzadoFormMinimo` (selects con fila vacía inicial). */
  await pickFirstSearchSelectOption(page, 'empleado-sexo');
  await pickFirstSearchSelectOption(page, 'empleado-estadoCivil');
  await page.locator('#empleado-apellido-paterno').blur();
  await expect(searchSelectTrigger(page, 'empleado-sexo')).not.toContainText(/Selecciona/i);
  await expect(searchSelectTrigger(page, 'empleado-estadoCivil')).not.toContainText(/Selecciona/i);
  await expect(searchSelectTrigger(page, 'empleado-idPais')).not.toContainText(/Selecciona/i);
}

/** Asegura que el paso 0 tiene mínimo borrador antes de guardar (evita modal genérico). */
export async function assertPaso0BorradorMinimoListo(page: Page): Promise<void> {
  await expect(page.locator('#empleado-nombres')).not.toHaveValue('');
  await expect(page.locator('#empleado-apellido-paterno')).not.toHaveValue('');
  await expect(page.locator('#empleado-email')).not.toHaveValue('');
  await expect(page.locator('#empleado-telefono')).not.toHaveValue('');
  await expect(searchSelectTrigger(page, 'empleado-sexo')).not.toContainText(/Selecciona/i);
}

export async function openEmpleadosListado(page: Page): Promise<void> {
  await page.goto('/empleados');
  await page.waitForLoadState('networkidle');
  await ensureLoggedIn(page);
  await expect(page.getByText('Listado de empleados').first()).toBeVisible({ timeout: 60_000 });
}

export async function applyEstadoBorradorFilter(page: Page): Promise<void> {
  const estadoBlock = page.locator('label.data-grid-filter-field').filter({ hasText: 'Estado' });
  await estadoBlock.locator('select.data-grid-filter-control').selectOption('borrador');
  await page.getByRole('button', { name: 'Buscar' }).click();
  await page.waitForLoadState('networkidle');
}

/** Filtro de texto «RUT» en la grilla (contiene). */
/** Abre el menú ⋮ de la fila y pulsa Continuar alta o Ver ficha. */
export async function openEmpleadoRowPrimaryAction(page: Page, rowFilter: string | RegExp): Promise<void> {
  const fila = page.locator('tbody tr').filter({ hasText: rowFilter });
  await expect(fila).toBeVisible({ timeout: 30_000 });
  await fila.locator('button.row-more-action').first().click();
  const menu = page.locator('.employee-action-menu--fixed');
  await expect(menu).toBeVisible({ timeout: 10_000 });
  const continuar = menu.getByTestId('continuar-alta');
  const verFicha = menu.getByTestId('ver-ficha');
  if (await continuar.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await continuar.click();
    return;
  }
  await verFicha.click();
}

export async function applyRutContainsFilter(page: Page, rutDigits: string): Promise<void> {
  const rutBlock = page.locator('label.data-grid-filter-field').filter({ hasText: 'RUT' });
  await rutBlock.locator('input.data-grid-filter-control').fill(rutDigits);
  await page.getByRole('button', { name: 'Buscar' }).click();
  await page.waitForLoadState('networkidle');
}

/** Usa el mapa lateral (siempre en el DOM); los `flow-tab` horizontales pueden quedar no visibles por layout. */
export async function wizardLastStepIndex(page: Page): Promise<number> {
  const mapItems = page.locator(
    'aside.advanced-wizard-map ol.advanced-wizard-map__list button.advanced-wizard-map__item',
  );
  return (await mapItems.count()) - 1;
}

export async function selectWizardResumenStep(page: Page): Promise<void> {
  await selectWizardStepByIndex(page, await wizardLastStepIndex(page));
}

export async function selectWizardStepByIndex(page: Page, zeroBasedIndex: number): Promise<void> {
  const tab = page
    .locator('aside.advanced-wizard-map ol.advanced-wizard-map__list button.advanced-wizard-map__item')
    .nth(zeroBasedIndex);
  await expect(tab).toBeAttached({ timeout: 15_000 });
  await tab.evaluate((el: HTMLElement) => {
    el.click();
  });
  await page.waitForTimeout(200);
}

/**
 * Primera opción con valor real del panel (salta filas «Seleccione…» / «Sin seleccionar» del catálogo).
 * Sin esto, el primer `.select-option` puede ser la opción vacía y dejar el FormControl en null con `Validators.required`.
 */
export async function pickFirstSearchSelectOption(page: Page, triggerId: string): Promise<void> {
  const trigger = searchSelectTrigger(page, triggerId);
  await expect(trigger).toBeVisible({ timeout: 15_000 });
  await trigger.click();
  const panel = visibleSelectPanel(page);
  await expect(panel).toBeVisible({ timeout: 10_000 });
  const options = panel.locator('.select-option:not([disabled])');
  await expect(options.first()).toBeVisible({ timeout: 10_000 });
  const conValor = options.filter({
    hasNotText: /^(Seleccione|Sin seleccionar|Selecciona|—)/i,
  });
  const target = (await conValor.count()) > 0 ? conValor.first() : options.first();
  await expect(target).toBeVisible({ timeout: 10_000 });
  await target.click();
  await page.keyboard.press('Escape');
  await page.waitForTimeout(150);
}

export async function expectWizardPasoTitulo(page: Page, titulo: string | RegExp): Promise<void> {
  const heading = page.getByRole('heading', { name: titulo });
  const h4 = page.locator('h4').filter({ hasText: titulo });
  await expect(heading.or(h4).first()).toBeVisible({ timeout: 20_000 });
}

export async function clickWizardSiguiente(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await page.waitForTimeout(250);
}

export async function expectMsgBoxFinalizarInvalido(page: Page): Promise<void> {
  await expect(
    page.getByRole('dialog', {
      name: /La ficha no está lista para finalizar|datos obligatorios pendientes|No se puede finalizar/i,
    }),
  ).toBeVisible({ timeout: 15_000 });
}

/** Paso 0 sin correo/teléfono (resto mínimo borrador). */
export async function fillPaso0IncompletoSinContacto(
  page: Page,
  rut: string,
  nombres = 'Test Incompleto',
  apellido = 'E2E',
): Promise<void> {
  await page.locator('#empleado-rut').fill(rut);
  await page.locator('#empleado-rut').blur();
  await fillCalendarInputByHostId(page, 'empleado-fecha-nacimiento', '1990-01-01');
  await page.locator('#empleado-nombres').fill(nombres);
  await page.locator('#empleado-apellido-paterno').fill(apellido);
  await pickFirstSearchSelectOption(page, 'empleado-idPais');
  await pickFirstSearchSelectOption(page, 'empleado-sexo');
  await pickFirstSearchSelectOption(page, 'empleado-estadoCivil');
}

/** Completa pasos 1–5 y 7 mínimos para finalizar en paso 9 (previsión y salud calculables). */
export async function fillWizardDependienteCompleto(page: Page): Promise<void> {
  await selectWizardStepByIndex(page, 0);
  await page.locator('#empleado-apellido-paterno').click();

  await selectWizardStepByIndex(page, 1);
  await page.locator('#empleado-direccion').fill('Calle E2E Ficticia 100');
  await page.locator('#empleado-numero-direccion').fill('200');
  await pickFirstSearchSelectOption(page, 'empleado-comuna');

  await selectWizardStepByIndex(page, 2);
  await page.getByRole('radio', { name: /^Contrato$/ }).check();
  await page.waitForTimeout(250);
  await fillCalendarInputByHostId(page, 'empleado-fecha-ingreso', '2024-06-01');
  await fillCalendarInputByHostId(page, 'empleado-fecha-contrato', '2024-06-01');
  await pickSearchSelectOption(page, 'empleado-tipo-contrato', /INDEFINIDO/i);
  await pickFirstSearchSelectOption(page, 'empleado-sucursal');
  await pickFirstSearchSelectOption(page, 'empleado-departamento');
  await pickFirstSearchSelectOption(page, 'empleado-centro-costo');
  await page.locator('#empleado-cargo').fill('Analista E2E');
  const tipoDerivado = page.locator('.tipo-trabajador-derived span');
  await expect(tipoDerivado).not.toHaveText(/Tipo trabajador pendiente/i, { timeout: 20_000 });
  await expect(tipoDerivado).not.toHaveText('', { timeout: 5_000 });

  await selectWizardStepByIndex(page, 3);
  await pickFirstSearchSelectOption(page, 'empleado-tipo-jornada');
  await page.locator('#empleado-horas-semanales').fill('40');
  await page.locator('#empleado-dias-semanales').fill('5');
  await page.locator('#empleado-sueldo-base').fill('1800000');
  await pickFirstSearchSelectOption(page, 'empleado-id-moneda');
  await pickFirstSearchSelectOption(page, 'empleado-tipo-gratificacion');

  await selectWizardStepByIndex(page, 4);
  await page.locator('#empleado-cargas').fill('0');
  await pickFirstSearchSelectOption(page, 'empleado-tramo-carga');
  await page.locator('#empleado-cargas').blur();

  await selectWizardStepByIndex(page, 5);
  await pickSearchSelectOption(page, 'empleado-tipo-regimen-previsional', /^AFP$/i);
  await pickFirstSearchSelectOption(page, 'empleado-afp');
  await pickFirstSearchSelectOption(page, 'empleado-salud');
  await pickFirstSearchSelectOption(page, 'empleado-moneda-plan');
  await page.locator('#empleado-valor-plan').fill('4.2');
  await page.locator('#empleado-auge-ges').fill('0');
  await page.locator('#empleado-tiene-apv').setChecked(false);

  await selectWizardStepByIndex(page, 7);
  await pickFirstSearchSelectOption(page, 'empleado-banco');
  await pickFirstSearchSelectOption(page, 'empleado-tipo-cuenta');
  const uniqueCuenta = String(Date.now() % 1_000_000_000).padStart(9, '0');
  await page.locator('#empleado-numero-cuenta').fill(uniqueCuenta);

  await selectWizardStepByIndex(page, 0);
  await page.locator('#empleado-nombres').press('Tab');
}

export async function selectRelacionHonorarios(page: Page): Promise<void> {
  await selectWizardStepByIndex(page, 2);
  const honorariosLabel = page.locator('label.relation-option').filter({
    hasText: /Boleta de honorarios/i,
  });
  await expect(honorariosLabel).toBeVisible({ timeout: 15_000 });
  await honorariosLabel.click();
  const honorarios = page.getByRole('radio', { name: /Boleta de honorarios/i });
  await expect(honorarios).toBeChecked({ timeout: 10_000 });
  await confirmarCambioHonorariosSiAplica(page, { required: true });
  await expect(page.getByText(/Modalidad:\s*honorarios/i)).toBeVisible({ timeout: 15_000 });
}

export async function fillWizardHonorariosMinimo(page: Page): Promise<void> {
  await selectWizardStepByIndex(page, 1);
  await page.locator('#empleado-direccion').fill('Calle honorarios E2E 50');
  await page.locator('#empleado-numero-direccion').fill('100');
  await pickFirstSearchSelectOption(page, 'empleado-comuna');
  await cerrarOverlaysActivos(page);

  await selectRelacionHonorarios(page);
  await fillCalendarInputByHostId(page, 'empleado-fecha-ingreso', '2024-06-01');
  await cerrarOverlaysActivos(page);
  await page.locator('#empleado-cargo').fill('Servicio consultoria E2E');
  const tipoDerivado = page.locator('.tipo-trabajador-derived span');
  await expect(tipoDerivado).not.toHaveText(/Tipo trabajador pendiente/i, { timeout: 20_000 });
  await expect(tipoDerivado).not.toHaveText('', { timeout: 5_000 });

  await selectWizardStepByIndex(page, 3);
  await expect(page.locator('#empleado-sueldo-base')).toBeVisible({ timeout: 20_000 });
  await page.locator('#empleado-sueldo-base').fill('500000');
  await pickFirstSearchSelectOption(page, 'empleado-id-moneda');
  await cerrarOverlaysActivos(page);

  await selectWizardStepByIndex(page, 7);
  await pickFirstSearchSelectOption(page, 'empleado-banco');
  await pickFirstSearchSelectOption(page, 'empleado-tipo-cuenta');
  const uniqueCuenta = String(Date.now() % 1_000_000_000).padStart(9, '0');
  await page.locator('#empleado-numero-cuenta').fill(uniqueCuenta);
  await cerrarOverlaysActivos(page);
}

/** Alta avanzada con `idPersona` de fixture U1–U8 (JSON post-auditoría). */
export async function gotoAltaAvanzadaConPersona(
  page: Page,
  idPersona: number,
  extraQuery = '',
): Promise<void> {
  const q = extraQuery ? `idPersona=${idPersona}&${extraQuery.replace(/^\?|&/, '')}` : `idPersona=${idPersona}`;
  await gotoAltaAvanzada(page, q);
}

export async function confirmarCambioHonorariosSiAplica(
  page: Page,
  options?: { required?: boolean },
): Promise<void> {
  const dialog = page.getByRole('dialog', { name: /Cambiar a boleta de honorarios/i });
  const timeout = options?.required ? 15_000 : 3_000;
  if (!(await dialog.isVisible({ timeout }).catch(() => false))) {
    if (options?.required) {
      throw new Error('No apareció el modal de confirmación para boleta de honorarios.');
    }
    return;
  }
  await dialog.getByRole('button', { name: 'Confirmar cambio' }).click();
  await expect(dialog).toBeHidden({ timeout: 10_000 });
}

export async function waitGuardarBorradorTerminado(page: Page, timeoutMs = 90_000): Promise<void> {
  const shellBtn = page.getByTestId('empleado-alta-avanzada-guardar');
  const fallback = page.getByRole('button', { name: /^Guardar borrador$/ });
  const target = (await shellBtn.count()) > 0 ? shellBtn : fallback;

  const invalidDraft = page.getByRole('dialog', { name: /No se puede guardar el borrador/i });
  const saveError = page.getByRole('dialog', { name: /No fue posible registrar el empleado/i });

  await Promise.race([
    expect(target).toHaveText(/Procesando/i, { timeout: 15_000 }).then(() => 'loading' as const),
    expect(invalidDraft).toBeVisible({ timeout: 15_000 }).then(() => 'invalid' as const),
    expect(saveError).toBeVisible({ timeout: 15_000 }).then(() => 'error' as const),
  ]).then(async (outcome) => {
    if (outcome === 'invalid') {
      const detail = (await invalidDraft.innerText()).replace(/\s+/g, ' ').trim().slice(0, 500);
      throw new Error(`Validación cliente bloqueó el borrador: ${detail}`);
    }
    if (outcome === 'error') {
      const text = (await saveError.innerText()).replace(/\s+/g, ' ').trim();
      throw new Error(`Persistencia falló: ${text.slice(0, 400)}`);
    }
  });

  await expect(page).toHaveURL(/idPersona=\d+/, { timeout: timeoutMs });
  await expect(target).toHaveText(/Guardar borrador/, { timeout: timeoutMs });
  await dismissBorradorGuardadoModal(page);
}

/** Cierra el MsgBox de éxito tras guardar borrador (bloquea clics en el wizard). */
/** Tras intentar guardar con RUT ya existente (no debe navegar a idPersona). */
export async function expectRutDuplicadoAlGuardarBorrador(page: Page, timeoutMs = 45_000): Promise<void> {
  await expect(
    page.getByRole('dialog', { name: /Ficha ya registrada/i }),
  ).toBeVisible({ timeout: timeoutMs });
}

/** MsgBox de validación mínima al guardar borrador (sin persistencia). */
export async function expectMsgBoxBorradorInvalido(page: Page, timeoutMs = 15_000): Promise<void> {
  const modal = page.getByRole('dialog', { name: /No se puede guardar el borrador/i });
  await expect(modal).toBeVisible({ timeout: timeoutMs });
  await expect(modal.getByRole('button', { name: /Ir al primer pendiente/i })).toBeVisible();
}

export async function dismissBorradorGuardadoModal(page: Page): Promise<void> {
  const modal = page.getByRole('dialog', { name: /Borrador guardado|Borrador actualizado/i });
  if (await modal.isVisible({ timeout: 4_000 }).catch(() => false)) {
    await modal.getByRole('button', { name: /^Aceptar$/ }).click();
    await expect(modal).toBeHidden({ timeout: 10_000 });
  }
}
