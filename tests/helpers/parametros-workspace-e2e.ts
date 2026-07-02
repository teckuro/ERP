import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

import { ensureLoggedIn } from './e2e-auth';

export const E2E_PARAMETROS_PERIODO = (process.env.E2E_PARAMETROS_PERSISTENCIA_PERIODO ?? process.env.E2E_PARAMETROS_PERIODO ?? '2026-06').trim();

/** Navega al workspace mensual de parámetros (requiere sesión si la app redirige a login). */
export async function gotoParametrosWorkspace(page: Page): Promise<void> {
  for (let intento = 0; intento < 2; intento += 1) {
    await page.goto('/parametros', { waitUntil: 'domcontentloaded' });
    await ensureLoggedIn(page);
    if (page.url().includes('/parametros')) {
      const shell = page.locator('section.parametros-page');
      if (await shell.isVisible({ timeout: 8_000 }).catch(() => false)) {
        return;
      }
    }
    await page.waitForTimeout(500);
  }
}

/**
 * Espera fin de carga inicial del orquestador (sin overlay de carga ni login).
 * No garantiza datos en BD; solo shell operativo.
 */
export async function waitParametrosWorkspaceReady(page: Page, periodo = E2E_PARAMETROS_PERIODO): Promise<void> {
  await gotoParametrosWorkspace(page);

  await expect(page.locator('section.parametros-page[aria-label="Mantenedor de parámetros"]')).toBeVisible({
    timeout: 60_000,
  });

  await expect(page.getByRole('heading', { name: 'Cargando parámetros' })).toBeHidden({
    timeout: 120_000,
  });
  await expect(page.getByRole('heading', { name: 'Obteniendo plantilla' })).toBeHidden({
    timeout: 5_000,
  }).catch(() => undefined);

  await expect(page.getByRole('navigation', { name: 'Áreas de parámetros' })).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.locator('#parametros-periodo-anio')).toBeVisible();
  await expect(page.locator('#parametros-periodo-mes')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Estado mensual' })).toBeVisible();

  // Fuente de verdad del guardado: selects del workspace (no cabecera; el panel de mes suele no ser visible en E2E).
  await seleccionarPeriodoWorkspace(page, periodo);
}

/** Activa una pestaña por etiqueta visible (Valores, Salud, Cliente, etc.). */
export async function seleccionarTabParametros(page: Page, etiquetaVisible: string): Promise<void> {
  const areaForTab: Record<string, string> = {
    Cliente: 'Configuración cliente',
    Valores: 'Datos oficiales',
    Remuneraciones: 'Datos oficiales',
    Cargas: 'Datos oficiales',
    Impuesto: 'Datos oficiales',
    Salud: 'Catálogos necesarios',
    Prevision: 'Catálogos necesarios',
    'CCAF y Mutual': 'Catálogos necesarios',
    'Reforma de pensiones': 'Observación normativa',
  };

  const areaNav = page.getByRole('navigation', { name: 'Áreas de parámetros' });
  const areaLabel = areaForTab[etiquetaVisible] ?? etiquetaVisible;
  const area = areaNav.getByRole('button', { name: areaLabel, exact: true });
  await area.click();
  await expect(area).toHaveClass(/parametros-area-tab--active/, { timeout: 10_000 });

  if (etiquetaVisible !== areaLabel && etiquetaVisible !== 'Cliente') {
    const subNav = page.getByRole('navigation', { name: 'Secciones de parámetros' });
    const tab = subNav.getByRole('button', { name: etiquetaVisible, exact: true });
    await tab.click();
    await expect(tab).toHaveClass(/parametros-subtab--active/, { timeout: 10_000 });
  }

  await expect(page.locator('.parametros-tab-body')).toBeVisible();
}

/** Selecciona año/mes del workspace (periodo YYYY-MM). */
export async function seleccionarPeriodoWorkspace(page: Page, periodo: string): Promise<void> {
  const [year, month] = periodo.split('-');
  const anio = page.locator('#parametros-periodo-anio');
  const mes = page.locator('#parametros-periodo-mes');

  await expect(anio).toBeVisible({ timeout: 30_000 });

  const yearOption = anio.locator(`option[value="${year}"]`);
  if ((await yearOption.count()) === 0) {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Cargando parámetros' })).toBeHidden({
      timeout: 120_000,
    }).catch(() => undefined);
  }

  await expect(anio.locator(`option[value="${year}"]`)).toHaveCount(1, {
    timeout: 30_000,
  });
  await anio.selectOption(year);
  await expect(page.getByRole('heading', { name: 'Cargando parámetros' })).toBeHidden({
    timeout: 120_000,
  }).catch(() => undefined);
  await mes.selectOption(month);
  if ((await mes.inputValue()) !== month) {
    await mes.selectOption(month);
  }
  await expect(page.getByRole('heading', { name: 'Cargando parámetros' })).toBeHidden({
    timeout: 120_000,
  });
  await expect(anio).toHaveValue(year, { timeout: 10_000 });
  await expect(mes).toHaveValue(month, { timeout: 10_000 });
}

export async function aceptarDialogoParametros(page: Page, titulo: RegExp | string): Promise<void> {
  const dialog =
    typeof titulo === 'string'
      ? page.getByRole('dialog', { name: new RegExp(titulo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') })
      : page.getByRole('dialog', { name: titulo });
  await expect(dialog).toBeVisible({ timeout: 20_000 });
  await dialog.getByRole('button', { name: /^Aceptar$/ }).click();
  await expect(dialog).toBeHidden({ timeout: 15_000 });
}

/** Entra en edición de configuración cliente (desde cero si aún no existe). */
export async function iniciarConfigClienteDesdeCero(page: Page): Promise<void> {
  const modificar = page.getByRole('button', { name: /^Modificar$/ });
  await expect(modificar).toBeEnabled({ timeout: 60_000 });

  if (await page.getByRole('button', { name: 'Guardar' }).isVisible({ timeout: 2_000 }).catch(() => false)) {
    return;
  }

  await modificar.click();

  await expect(page.getByRole('heading', { name: 'Obteniendo plantilla' })).toBeHidden({ timeout: 90_000 });

  const crearCero = page.getByRole('button', { name: /Crear desde cero/i });
  if ((await crearCero.count()) > 0) {
    await crearCero.click({ force: true, timeout: 20_000 });
    await expect(crearCero).toBeHidden({ timeout: 15_000 });
  }

  const soloLectura = page.getByRole('dialog', { name: /Solo lectura/i });
  if (await soloLectura.isVisible({ timeout: 4_000 }).catch(() => false)) {
    await soloLectura.getByRole('button', { name: /^Aceptar$/i }).click();
    await expect(soloLectura).toBeHidden({ timeout: 10_000 });
    await modificar.click();
    await expect(page.getByRole('heading', { name: 'Obteniendo plantilla' })).toBeHidden({ timeout: 90_000 });
    if ((await crearCero.count()) > 0) {
      await crearCero.click({ force: true, timeout: 15_000 });
      await expect(crearCero).toBeHidden({ timeout: 15_000 });
    }
  }

  await expect(page.getByRole('button', { name: 'Guardar' })).toBeVisible({ timeout: 45_000 });
}

export async function completarValoresClienteMinimos(page: Page, uf: number): Promise<void> {
  await seleccionarTabParametros(page, 'Valores');
  const ufInput = page.locator('app-parametros-valores-tab input[formcontrolname="uf"]');
  await expect(ufInput).toBeVisible({ timeout: 15_000 });
  await ufInput.fill(String(uf));
  const utmInput = page.locator('app-parametros-valores-tab input[formcontrolname="utm"]');
  if (await utmInput.isVisible().catch(() => false)) {
    await utmInput.fill('65000');
  }
}

export async function guardarConfiguracionCliente(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Guardar' }).click();
  await aceptarDialogoParametros(page, /Configuración guardada/i);
  await expect(page.getByRole('button', { name: /^Modificar$/ })).toBeVisible({ timeout: 20_000 });
}

/** Restaura reconciliación a pendiente (nueva carga oficial tras «Mantener mi configuración»). */
export function resetReconciliacionClienteE2e(periodo: string): void {
  const script = resolve(process.cwd(), 'scripts/seed-parametros-e2e-fixture.mjs');
  const res = spawnSync(process.execPath, [script, '--reset-reconciliacion', '--periodo', periodo], {
    stdio: 'inherit',
    env: process.env,
  });
  if (res.status !== 0) {
    throw new Error('Fallo reset reconciliacion E2E (psql / SUPABASE_DB_URL).');
  }
}

/** Ejecuta el seed que simula la carga oficial (script mensual simplificado). */
export function aplicarCargaOficialE2e(periodo: string, uf: number): void {
  const script = resolve(process.cwd(), 'scripts/seed-parametros-e2e-fixture.mjs');
  const res = spawnSync(
    process.execPath,
    [script, '--apply-oficial', '--periodo', periodo, '--uf', String(uf)],
    { stdio: 'inherit', env: process.env },
  );
  if (res.status !== 0) {
    throw new Error(
      'Fallo aplicar carga oficial E2E. Revise E2E_SUPABASE_SERVICE_ROLE_KEY o psql + SUPABASE_DB_URL.',
    );
  }
}

/** Fuerza `cargar()` cambiando a un mes vecino y volviendo (mismo periodo no recarga). */
export async function recargarPeriodoWorkspace(page: Page, periodo: string): Promise<void> {
  const [year, month] = periodo.split('-').map(Number);
  const prevMonth =
    month === 1 ? `${year - 1}-12` : `${year}-${String(month - 1).padStart(2, '0')}`;
  await seleccionarPeriodoWorkspace(page, prevMonth);
  await seleccionarPeriodoWorkspace(page, periodo);
}

/** Tras carga oficial en BD: fuerza `cargar()` cambiando de mes (más fiable que solo Sincronizar/Refrescar). */
export async function recargarDatosTrasCargaOficial(page: Page, periodo = E2E_PARAMETROS_PERIODO): Promise<void> {
  await recargarPeriodoWorkspace(page, periodo);
}

export async function esperarDialogoReconciliacion(page: Page): Promise<void> {
  const dialogo = page.getByRole('dialog').filter({ hasText: /Hay diferencias con los valores oficiales/i });
  await expect(dialogo).toBeVisible({ timeout: 90_000 });
}
