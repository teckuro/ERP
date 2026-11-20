import { test, expect } from '@playwright/test';

async function waitForWizardReady(page: import('@playwright/test').Page) {
  await page.goto('/empleados/nuevo');
  await page.waitForLoadState('networkidle');
  // Carga inicial de catálogos / overlay
  await expect(page.getByText('Preparando campos')).toBeHidden({ timeout: 60_000 });
  // Header del wizard avanzado (default)
  await expect(page.getByRole('heading', { name: 'Creación avanzada' })).toBeVisible();
  await expect(page.locator('.advanced-step-header')).toBeVisible();
  await expect(page.locator('.advanced-step-actions')).toBeVisible();
}

async function stepKickerText(page: import('@playwright/test').Page) {
  return (await page.locator('.advanced-step-kicker').innerText()).trim();
}

async function stepActionsMetrics(page: import('@playwright/test').Page) {
  const actions = page.locator('.advanced-step-actions');
  await expect(actions).toBeVisible();
  const box = await actions.boundingBox();
  expect(box).toBeTruthy();
  return box!;
}

/** Offset vertical de la barra de acciones respecto al bloque de contenido del wizard (estable entre pasos). */
async function stepActionsOffsetFromWizardContentTop(page: import('@playwright/test').Page) {
  return await page.evaluate(() => {
    const content = document.querySelector<HTMLElement>('.advanced-wizard-content');
    const actions = document.querySelector<HTMLElement>('.advanced-step-actions');
    if (!content || !actions) return null;
    const cr = content.getBoundingClientRect();
    const ar = actions.getBoundingClientRect();
    return ar.top - cr.top;
  });
}

async function contentMetrics(page: import('@playwright/test').Page) {
  const content = page.locator('.advanced-wizard-content');
  await expect(content).toBeVisible();
  const box = await content.boundingBox();
  expect(box).toBeTruthy();
  return box!;
}

async function assertScrolledToUsefulStart(page: import('@playwright/test').Page) {
  const header = page.locator('.advanced-step-header');
  const box = await header.boundingBox();
  expect(box).toBeTruthy();
  // El bloque del paso (título + acciones) debe quedar cerca del borde superior del viewport.
  expect(box!.y).toBeLessThan(200);
}

test('empleados - wizard avanzado sin saltos (acciones del paso / scroll)', async ({ page }) => {
  test.slow();
  await waitForWizardReady(page);

  const next = page.getByRole('button', { name: 'Siguiente' });
  const prev = page.getByRole('button', { name: 'Anterior' });

  // Primero ir al paso 9 y usarlo como referencia (marco común).
  for (let i = 0; i < 12; i++) {
    const kicker = await stepKickerText(page);
    if (kicker.includes('Paso 9 de')) {
      break;
    }
    await next.click();
    await page.waitForTimeout(120);
  }

  await expect(page.locator('.advanced-step-kicker')).toContainText('Paso 9 de', { timeout: 10_000 });

  await stepActionsMetrics(page);
  const baselineActionsOffset = await stepActionsOffsetFromWizardContentTop(page);
  expect(baselineActionsOffset).not.toBeNull();
  const baselineContent = await contentMetrics(page);

  const maxActionsOffsetDeltaPx = 8;
  const maxContentLeftDeltaPx = 6;
  const maxContentWidthDeltaPx = 10;

  // Volver hacia atrás y verificar estabilidad contra el máximo (paso 9).
  for (let i = 0; i < 12; i++) {
    await prev.click();
    await page.waitForTimeout(150);

    await stepActionsMetrics(page);
    const actionsOffset = await stepActionsOffsetFromWizardContentTop(page);
    expect(actionsOffset).not.toBeNull();
    const content = await contentMetrics(page);

    expect(Math.abs(actionsOffset! - baselineActionsOffset!)).toBeLessThanOrEqual(maxActionsOffsetDeltaPx);
    expect(Math.abs(content.x - baselineContent.x)).toBeLessThanOrEqual(maxContentLeftDeltaPx);
    expect(Math.abs(content.width - baselineContent.width)).toBeLessThanOrEqual(maxContentWidthDeltaPx);

    await assertScrolledToUsefulStart(page);

    if ((await prev.isDisabled()) || (await prev.getAttribute('disabled')) !== null) {
      break;
    }
  }

  // Volver al paso 9 también debe mantenerse estable.
  for (let i = 0; i < 12; i++) {
    const kicker = await stepKickerText(page);
    if (kicker.includes('Paso 9 de')) {
      break;
    }
    await next.click();
    await page.waitForTimeout(150);

    const actionsOffset = await stepActionsOffsetFromWizardContentTop(page);
    expect(actionsOffset).not.toBeNull();
    expect(Math.abs(actionsOffset! - baselineActionsOffset!)).toBeLessThanOrEqual(maxActionsOffsetDeltaPx);
    await assertScrolledToUsefulStart(page);
  }
});
