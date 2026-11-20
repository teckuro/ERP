import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import './helpers/e2e-env';

const outputDir = resolve(
  process.cwd(),
  'docs',
  'codex',
  'modulos',
  'nomina-mensual',
  'preparar-nomina',
  'imagenes',
  'paso-a-paso',
);

const credentials = {
  email: process.env['E2E_SUPABASE_AUTH_EMAIL'] ?? '',
  password: process.env['E2E_SUPABASE_AUTH_PASSWORD'] ?? '',
};

const periodo = process.env['E2E_NOMINA_PERIODO'] ?? '';

async function login(page: Page): Promise<void> {
  await page.goto('/login?returnUrl=/remuneraciones/proceso-mensual');
  await page.evaluate(() => {
    localStorage.removeItem('angular-erp-auth');
    sessionStorage.clear();
  });
  await page.goto('/login?returnUrl=/remuneraciones/proceso-mensual');
  await expect(page.locator('#login-title')).toContainText(/Iniciar sesi[oó]n|Iniciar sesion/);
  await page.locator('#login-email').fill(credentials.email);
  await page.locator('#login-password').fill(credentials.password);
  await page.getByRole('button', { name: /iniciar sesi[oó]n|iniciar sesion/i }).click();
  await page.waitForURL('**/remuneraciones/proceso-mensual', { timeout: 60_000 });
  await page.waitForLoadState('networkidle');
}

async function setPeriodoGlobal(page: Page): Promise<void> {
  if (!periodo) return;
  const [year, month] = periodo.split('-');
  const selects = page.locator('app-header select');
  if ((await selects.count()) === 0) return;

  const yearSelect = selects.nth(0);
  if (!(await yearSelect.isVisible())) return;
  const yearValues = await yearSelect.locator('option').evaluateAll((options) =>
    options.map((option) => (option as HTMLOptionElement).value),
  );
  if (year && yearValues.includes(year)) {
    await yearSelect.selectOption(year);
    await page.waitForLoadState('networkidle');
  }

  const monthSelect = selects.nth(1);
  if ((await monthSelect.count()) === 0 || !month) return;
  const monthValues = await monthSelect.locator('option').evaluateAll((options) =>
    options.map((option) => ({
      label: (option.textContent ?? '').trim().toLowerCase(),
      value: (option as HTMLOptionElement).value,
    })),
  );
  const monthNumber = Number(month);
  const monthNames = [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
  ];
  const targetMonth = monthNames[monthNumber - 1] ?? '';
  const option =
    monthValues.find((item) => item.value === periodo || item.value === month || item.value.endsWith(`-${month}`)) ??
    monthValues.find((item) => item.label === targetMonth || item.label.includes(targetMonth));
  if (option) {
    await monthSelect.selectOption(option.value);
    await page.waitForLoadState('networkidle');
  }
}

async function screenshot(page: Page, name: string): Promise<void> {
  await page.waitForLoadState('networkidle');
  await page.locator('body').waitFor({ state: 'visible' });
  await page.waitForTimeout(400);
  await page.screenshot({ path: resolve(outputDir, name), fullPage: true });
}

async function ejecutarAccionComponente(
  page: Page,
  selector: string,
  method: string,
  args: unknown[] = [],
): Promise<boolean> {
  const executed = await page.evaluate(
    ({ hostSelector, methodName, methodArgs }) => {
      const angular = (window as typeof window & { ng?: { getComponent?: (element: Element | null) => unknown } }).ng;
      const host = document.querySelector(hostSelector);
      const component = angular?.getComponent?.(host) as Record<string, unknown> | undefined;
      const action = component?.[methodName];
      if (typeof action !== 'function') return false;
      action.apply(component, methodArgs);
      return true;
    },
    { hostSelector: selector, methodName: method, methodArgs: args },
  );
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2_200);
  return executed;
}

async function ejecutarNomina(page: Page, method: string, args: unknown[] = []): Promise<boolean> {
  return ejecutarAccionComponente(page, 'app-proceso-mensual-container', method, args);
}

async function ejecutarLiquidaciones(page: Page, method: string, args: unknown[] = []): Promise<boolean> {
  return ejecutarAccionComponente(page, 'app-liquidaciones-oficiales-container', method, args);
}

async function ejecutarInternaNomina(page: Page, method: string, args: unknown[] = []): Promise<void> {
  const executed = await ejecutarNomina(page, method, args);
  expect(executed, `No se pudo ejecutar ${method} desde app-proceso-mensual-container.`).toBe(true);
  await ejecutarNomina(page, 'cancelarAccionProceso');
  await page.waitForTimeout(5_000);
}

async function setPeriodoActivoDesdeComponente(page: Page): Promise<void> {
  if (!periodo) return;
  await page.evaluate((ym) => {
    const angular = (window as typeof window & { ng?: { getComponent?: (element: Element | null) => unknown } }).ng;
    const host = document.querySelector('app-proceso-mensual-container');
    const component = angular?.getComponent?.(host) as
      | { periodoActivo?: { setPeriodo?: (periodo: string) => void; setPeriodoYm?: (periodo: string) => void } }
      | undefined;
    component?.periodoActivo?.setPeriodo?.(ym);
    component?.periodoActivo?.setPeriodoYm?.(ym);
  }, periodo);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1_000);
}

test.describe('Preparar nomina - capturas paso a paso', () => {
  test('genera PNGs del flujo aprobar → liquidaciones → cerrar', async ({ page }) => {
    test.setTimeout(300_000);
    test.skip(!credentials.email || !credentials.password, 'Faltan credenciales E2E para capturar Preparar nomina.');

    await mkdir(outputDir, { recursive: true });
    await login(page);
    await setPeriodoGlobal(page);
    await page.goto('/remuneraciones/proceso-mensual');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('app-proceso-mensual-container')).toBeVisible({ timeout: 60_000 });
    await setPeriodoActivoDesdeComponente(page);

    await screenshot(page, '01-preparar-nomina-inicio.png');

    await ejecutarNomina(page, 'validarPeriodo');
    await screenshot(page, '02-periodo-validado.png');

    await ejecutarNomina(page, 'generarPreNomina');
    await screenshot(page, '03-base-de-nomina-generada.png');

    await ejecutarNomina(page, 'calcularPreliminar');
    await screenshot(page, '04-resultado-preliminar-calculado.png');

    await ejecutarNomina(page, 'guardarSnapshotPreliminar');
    await screenshot(page, '05-confirmacion-guardar-resultado.png');
    await ejecutarInternaNomina(page, 'ejecutarGuardarSnapshotPreliminar');
    await screenshot(page, '06-resultado-preliminar-guardado.png');

    await ejecutarNomina(page, 'aprobarResultadoPreliminar');
    await screenshot(page, '07-confirmacion-aprobar-resultado.png');
    await ejecutarInternaNomina(page, 'ejecutarAprobacionOperativa', [[]]);
    await screenshot(page, '08-resultado-aprobado-operativamente.png');

    await page.goto('/remuneraciones/liquidaciones');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('app-liquidaciones-oficiales-container')).toBeVisible({ timeout: 60_000 });
    await screenshot(page, '09-liquidaciones-nomina-aprobada.png');

    const abrioGeneracion = await ejecutarLiquidaciones(page, 'generarLiquidaciones');
    if (abrioGeneracion) {
      await screenshot(page, '10-confirmacion-generar-liquidaciones.png');
      const confirmo = await ejecutarLiquidaciones(page, 'confirmarGeneracionLiquidaciones');
      if (confirmo) {
        await page.waitForTimeout(6_000);
        await screenshot(page, '11-liquidaciones-emitidas.png');
      }
    }

    await page.goto('/remuneraciones/proceso-mensual');
    await page.waitForLoadState('networkidle');
    await setPeriodoActivoDesdeComponente(page);

    await ejecutarNomina(page, 'cerrarNominaOperativa');
    await screenshot(page, '12-confirmacion-cerrar-proceso-mensual.png');
    const confirmoCierre = await ejecutarNomina(page, 'confirmarAccionProceso');
    expect(confirmoCierre, 'No se pudo confirmar el cierre del proceso mensual.').toBe(true);
    await page.waitForTimeout(6_000);
    await screenshot(page, '13-proceso-mensual-cerrado.png');

    await page.goto('/remuneraciones/liquidaciones');
    await page.waitForLoadState('networkidle');
    await screenshot(page, '14-liquidaciones-tras-cierre.png');
  });
});
