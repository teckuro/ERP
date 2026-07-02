import { expect, type Locator, type Page } from '@playwright/test';

export const NOMINAS_E2E_TIMEOUT_MS = 120_000;

const UUID_RE =
  /\/remuneraciones\/nominas\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/generador/i;

export interface FilaBandejaNomina {
  periodo: string;
  trabajadores: number;
  abrirGenerador: Locator;
}

export function nominasAdminGeneradorCredentialsReady(): boolean {
  return Boolean(process.env['E2E_SUPABASE_AUTH_EMAIL'])
    && Boolean(process.env['E2E_SUPABASE_AUTH_PASSWORD']);
}

export function e2eNominaDotacionMinima(): number {
  const raw = Number(process.env['E2E_NOMINA_DOTACION_MIN'] ?? '50');
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 50;
}

export async function loginNominasAdmin(page: Page): Promise<void> {
  const email = process.env['E2E_SUPABASE_AUTH_EMAIL'] ?? '';
  const password = process.env['E2E_SUPABASE_AUTH_PASSWORD'] ?? '';

  page.setDefaultTimeout(NOMINAS_E2E_TIMEOUT_MS);
  page.setDefaultNavigationTimeout(NOMINAS_E2E_TIMEOUT_MS);

  await page.goto('/login?returnUrl=/remuneraciones/nominas');
  await page.locator('#login-email').fill(email);
  await page.locator('#login-password').fill(password);
  await page.getByRole('button', { name: 'Iniciar sesion' }).click();
  await page.waitForURL('**/remuneraciones/nominas', { timeout: NOMINAS_E2E_TIMEOUT_MS });
  await expect(page.getByRole('heading', { name: 'Administrador de nóminas' })).toBeVisible();

  const loading = page.locator('.adm-nom__grid-shell app-workspace-loading');
  if (await loading.count() > 0) {
    await expect(loading).toBeHidden({ timeout: NOMINAS_E2E_TIMEOUT_MS });
  }
}

export async function mostrarTodasLasNominas(page: Page): Promise<void> {
  const filtro = page.getByLabel('Vista operativa');
  await expect(filtro).toBeVisible();
  await filtro.selectOption('todas');
  await page.waitForLoadState('networkidle');
}

export async function listarFilasBandeja(page: Page): Promise<FilaBandejaNomina[]> {
  const rows = page.locator('section.adm-nom__page tr.data-grid-row');
  const count = await rows.count();
  const filas: FilaBandejaNomina[] = [];

  for (let i = 0; i < count; i++) {
    const row = rows.nth(i);
    const tds = row.locator('td');
    const periodo = (await tds.nth(1).innerText()).trim();
    const trabajadoresRaw = (await tds.nth(5).innerText()).trim();
    const trabajadores = Number.parseInt(trabajadoresRaw.replace(/\D/g, ''), 10) || 0;
    const abrirGenerador = row.getByRole('button', { name: /^Abrir generador de / });

    filas.push({ periodo, trabajadores, abrirGenerador });
  }

  return filas;
}

export function extraerNominaPeriodoId(url: string): string | null {
  const match = UUID_RE.exec(url);
  return match?.[1] ?? null;
}

export async function abrirGeneradorDesdeFila(page: Page, fila: FilaBandejaNomina): Promise<string> {
  await expect(fila.abrirGenerador).toBeVisible();
  await fila.abrirGenerador.click();
  await page.waitForURL(/\/remuneraciones\/nominas\/[^/]+\/generador/, { timeout: 60_000 });
  await expect(page.getByLabel('Generador de nómina')).toBeVisible();
  const id = extraerNominaPeriodoId(page.url());
  expect(id, 'La URL del generador debe incluir nominaPeriodoId.').toBeTruthy();
  return id!;
}

export async function volverAdministradorNominas(page: Page): Promise<void> {
  await page.goto('/remuneraciones/nominas');
  await expect(page.getByRole('heading', { name: 'Administrador de nóminas' })).toBeVisible();
}

export async function irPasoDotacion(page: Page): Promise<void> {
  const pasoDotacion = page
    .locator('nav.nomina-stepper')
    .getByRole('button', { name: /Dotaci/i })
    .first();
  await expect(pasoDotacion).toBeVisible();
  await pasoDotacion.click();
  await expect(page.locator('.nomina-shell')).toHaveAttribute('data-step', 'dotacion');
  await expect(page.locator('section.paso-dotacion')).toBeVisible();
  await expect(page.getByRole('group', { name: 'Resumen de dotación' })).toBeVisible();
}

export async function leerTotalDotacion(page: Page): Promise<number> {
  const stats = page.getByRole('group', { name: 'Resumen de dotación' });
  const strong = stats.locator('strong').first();
  await expect(strong).toBeVisible();
  const raw = (await strong.innerText()).trim();
  return Number.parseInt(raw.replace(/\D/g, ''), 10) || 0;
}

export async function paginarDotacionSiguiente(page: Page): Promise<void> {
  const siguiente = page.getByRole('button', { name: 'Pagina siguiente' });
  await expect(siguiente).toBeEnabled();
  await siguiente.click();
  await expect(page.locator('section.paso-dotacion tr.data-grid-row').first()).toBeVisible();
}

export async function esperarBandejaLista(page: import('@playwright/test').Page): Promise<void> {
  await page.waitForLoadState('networkidle');
  const filas = page.locator('section.adm-nom__page tr.data-grid-row');
  const vacio = page.getByText(/Aún no hay nóminas|Sin resultados con los filtros actuales/);
  const error = page.locator('.adm-nom__state--error');
  await expect(filas.first().or(vacio).or(error)).toBeVisible({ timeout: 60_000 });
  if (await error.isVisible()) {
    const msg = (await error.innerText()).trim();
    throw new Error(`Bandeja en error: ${msg}`);
  }
}

export function agruparFilasPorPeriodo(
  filas: FilaBandejaNomina[],
): Map<string, FilaBandejaNomina[]> {
  const mapa = new Map<string, FilaBandejaNomina[]>();
  for (const fila of filas) {
    const lista = mapa.get(fila.periodo) ?? [];
    lista.push(fila);
    mapa.set(fila.periodo, lista);
  }
  return mapa;
}
