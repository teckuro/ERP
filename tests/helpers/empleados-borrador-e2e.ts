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

export async function waitAdvancedFormReady(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
  await expect(page.getByText('Preparando campos')).toBeHidden({ timeout: 60_000 });
  await expect(page.getByRole('heading', { name: 'Creación avanzada' })).toBeVisible();
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
}

/** Botón disparador del `app-search-select` (mismo `id` en host y en `button.select-field` → strict mode). */
function searchSelectTrigger(page: Page, triggerId: string) {
  return page.locator(`button.select-field#${triggerId}`).first();
}

/** Abre el panel del `app-search-select` con `id` en el trigger y elige la primera opción que coincida con el texto. */
export async function pickSearchSelectOption(
  page: Page,
  triggerId: string,
  optionMatcher: string | RegExp,
): Promise<void> {
  const trigger = searchSelectTrigger(page, triggerId);
  await expect(trigger).toBeVisible({ timeout: 15_000 });
  await trigger.click();
  const opt =
    typeof optionMatcher === 'string'
      ? page.getByRole('option', { name: optionMatcher, exact: false }).first()
      : page.getByRole('option', { name: optionMatcher }).first();
  await expect(opt).toBeVisible({ timeout: 10_000 });
  await opt.click();
}

export async function fillPaso0BorradorMinimo(
  page: Page,
  rut: string,
  nombres = 'Test Borrador E2E',
  apellido = 'Automatizado',
): Promise<void> {
  await page.locator('#empleado-rut').fill(rut);
  await fillCalendarInputByHostId(page, 'empleado-fecha-nacimiento', '1990-01-01');
  await page.locator('#empleado-nombres').fill(nombres);
  await page.locator('#empleado-apellido-paterno').fill(apellido);
  await pickSearchSelectOption(page, 'empleado-idPais', /Chile/i);
  /** Obligatorios para `validateBorradorAvanzadoFormMinimo` (selects con fila vacía inicial). */
  await pickSearchSelectOption(page, 'empleado-sexo', /Femenino|Masculino|Otro/i);
  await pickSearchSelectOption(page, 'empleado-estadoCivil', /Soltero/i);
}

export async function openEmpleadosListado(page: Page): Promise<void> {
  await page.goto('/empleados');
  await page.waitForLoadState('networkidle');
  await expect(page.getByText('Listado de empleados').first()).toBeVisible({ timeout: 60_000 });
}

export async function applyEstadoBorradorFilter(page: Page): Promise<void> {
  const estadoBlock = page.locator('label.data-grid-filter-field').filter({ hasText: 'Estado' });
  await estadoBlock.locator('select.data-grid-filter-control').selectOption('borrador');
  await page.getByRole('button', { name: 'Buscar' }).click();
  await page.waitForLoadState('networkidle');
}

/** Filtro de texto «RUT» en la grilla (contiene). */
export async function applyRutContainsFilter(page: Page, rutDigits: string): Promise<void> {
  const rutBlock = page.locator('label.data-grid-filter-field').filter({ hasText: 'RUT' });
  await rutBlock.locator('input.data-grid-filter-control').fill(rutDigits);
  await page.getByRole('button', { name: 'Buscar' }).click();
  await page.waitForLoadState('networkidle');
}

/** Usa el mapa lateral (siempre en el DOM); los `flow-tab` horizontales pueden quedar no visibles por layout. */
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
  const options = page.locator('.select-panel .select-option:not([disabled])');
  await expect(options.first()).toBeVisible({ timeout: 10_000 });
  const conValor = options.filter({
    hasNotText: /^(Seleccione|Sin seleccionar|Selecciona|—)/i,
  });
  const target = (await conValor.count()) > 0 ? conValor.first() : options.first();
  await expect(target).toBeVisible({ timeout: 10_000 });
  await target.click();
  await page.waitForTimeout(200);
}

export async function clickWizardSiguiente(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await page.waitForTimeout(250);
}

/**
 * Espera a que termine la petición de guardar borrador (el botón vuelve de «Guardando…» a «Guardar borrador»).
 * El mensaje verde en `.advanced-draft-feedback` dura ~4,5 s: no usarlo como única señal si el backend es lento.
 */
export async function waitGuardarBorradorTerminado(page: Page, timeoutMs = 90_000): Promise<void> {
  await expect(page.getByTestId('guardar-borrador-avanzado')).toHaveText('Guardar borrador', {
    timeout: timeoutMs,
  });
}
