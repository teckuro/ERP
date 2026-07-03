import { expect, type Locator, type Page } from '@playwright/test';

export const NOMINAS_E2E_TIMEOUT_MS = 120_000;

const UUID_RE =
  /\/remuneraciones\/nominas\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/generador/i;

export type PasoGenerador =
  | 'parameters'
  | 'dotacion'
  | 'movements'
  | 'calculation'
  | 'validation'
  | 'closure';

export interface FilaBandejaNomina {
  periodo: string;
  empresa: string;
  meta: string;
  estado: string;
  proximoPaso: string;
  trabajadores: number;
  row: Locator;
  abrirGenerador: Locator;
}

export function nominasAdminGeneradorCredentialsReady(): boolean {
  return Boolean(process.env['E2E_SUPABASE_AUTH_EMAIL'])
    && Boolean(process.env['E2E_SUPABASE_AUTH_PASSWORD']);
}

export function e2eNominaPartialCredentialsReady(): boolean {
  return Boolean(process.env['E2E_NOMINA_PARTIAL_EMAIL'])
    && Boolean(process.env['E2E_NOMINA_PARTIAL_PASSWORD']);
}

export function e2eNominaDotacionMinima(): number {
  const raw = Number(process.env['E2E_NOMINA_DOTACION_MIN'] ?? '50');
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 50;
}

export async function loginNominasConCredenciales(
  page: Page,
  email: string,
  password: string,
  returnUrl = '/remuneraciones/nominas',
): Promise<void> {
  page.setDefaultTimeout(NOMINAS_E2E_TIMEOUT_MS);
  page.setDefaultNavigationTimeout(NOMINAS_E2E_TIMEOUT_MS);

  await page.goto(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
  await page.locator('#login-email').fill(email);
  await page.locator('#login-password').fill(password);
  await page.getByRole('button', { name: 'Iniciar sesion' }).click();
  await page.waitForURL(`**${returnUrl}`, { timeout: NOMINAS_E2E_TIMEOUT_MS });
  await expect(page.getByRole('heading', { name: 'Administrador de nóminas' })).toBeVisible();

  const loading = page.locator('.adm-nom__grid-shell app-workspace-loading');
  if (await loading.count() > 0) {
    await expect(loading).toBeHidden({ timeout: NOMINAS_E2E_TIMEOUT_MS });
  }
}

export async function loginNominasAdmin(page: Page): Promise<void> {
  await loginNominasConCredenciales(
    page,
    process.env['E2E_SUPABASE_AUTH_EMAIL'] ?? '',
    process.env['E2E_SUPABASE_AUTH_PASSWORD'] ?? '',
  );
}

export async function loginNominasPartial(page: Page): Promise<void> {
  await loginNominasConCredenciales(
    page,
    process.env['E2E_NOMINA_PARTIAL_EMAIL'] ?? '',
    process.env['E2E_NOMINA_PARTIAL_PASSWORD'] ?? '',
  );
}

export async function mostrarTodasLasNominas(page: Page): Promise<void> {
  const filtro = page.getByLabel('Vista operativa');
  await expect(filtro).toBeVisible();
  await filtro.selectOption('todas');
  await page.waitForLoadState('networkidle');
}

function botonGeneradorFila(row: Locator): Locator {
  return row.getByRole('button', { name: /^(Abrir generador|Continuar rectificación) de / });
}

export async function listarFilasBandeja(page: Page): Promise<FilaBandejaNomina[]> {
  const rows = page.locator('section.adm-nom__page tr.data-grid-row');
  const count = await rows.count();
  const filas: FilaBandejaNomina[] = [];

  for (let i = 0; i < count; i++) {
    const row = rows.nth(i);
    const tds = row.locator('td');
    const periodoCell = tds.nth(1);
    const periodo = (await periodoCell.locator('.adm-nom__cell-periodo').innerText()).trim();
    const metaLocator = periodoCell.locator('.adm-nom__cell-meta').first();
    const meta = (await metaLocator.count()) > 0 ? (await metaLocator.innerText()).trim() : '';
    const empresa = (await tds.nth(2).innerText()).trim();
    const estado = (await tds.nth(3).innerText()).trim();
    const proximoPaso = (await tds.nth(4).innerText()).trim();
    const trabajadoresRaw = (await tds.nth(5).innerText()).trim();
    const trabajadores = Number.parseInt(trabajadoresRaw.replace(/\D/g, ''), 10) || 0;
    const abrirGenerador = botonGeneradorFila(row);

    filas.push({
      periodo,
      empresa,
      meta,
      estado,
      proximoPaso,
      trabajadores,
      row,
      abrirGenerador,
    });
  }

  return filas;
}

export function metaIncluye(fila: FilaBandejaNomina, ...partes: string[]): boolean {
  const meta = fila.meta.toLowerCase();
  return partes.every((parte) => meta.includes(parte.toLowerCase()));
}

export function esMensualLegalSinAnticipos(fila: FilaBandejaNomina): boolean {
  return fila.meta.trim().length === 0;
}

export function filasConMeta(
  filas: FilaBandejaNomina[],
  ...partes: string[]
): FilaBandejaNomina[] {
  return filas.filter((fila) => metaIncluye(fila, ...partes));
}

export function filasPorEstado(
  filas: FilaBandejaNomina[],
  estado: string,
): FilaBandejaNomina[] {
  return filas.filter((fila) => fila.estado.toLowerCase().includes(estado.toLowerCase()));
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

const ETIQUETA_PASO: Record<PasoGenerador, RegExp> = {
  parameters: /Par[aá]metros/i,
  dotacion: /Dotaci/i,
  movements: /Movimientos/i,
  calculation: /C[aá]lculo/i,
  validation: /Validaci/i,
  closure: /Cierre/i,
};

export async function irPasoGenerador(page: Page, paso: PasoGenerador): Promise<void> {
  const pasoBtn = page
    .locator('nav.nomina-stepper')
    .getByRole('button', { name: ETIQUETA_PASO[paso] })
    .first();
  await expect(pasoBtn).toBeVisible();
  await pasoBtn.click();
  await expect(page.locator('.nomina-shell')).toHaveAttribute('data-step', paso);
}

export async function leerPasoActual(page: Page): Promise<string> {
  return (await page.locator('.nomina-shell').getAttribute('data-step')) ?? '';
}

export async function irPasoDotacion(page: Page): Promise<void> {
  await irPasoGenerador(page, 'dotacion');
  await expect(page.locator('section.paso-dotacion')).toBeVisible();
  await expect(page.getByRole('group', { name: 'Resumen de dotación' })).toBeVisible();
}

export async function irPasoValidacion(page: Page): Promise<void> {
  await irPasoGenerador(page, 'validation');
  await expect(page.locator('section.paso-val')).toBeVisible();
}

export async function irPasoCierre(page: Page): Promise<void> {
  await irPasoGenerador(page, 'closure');
  await expect(page.locator('section.paso-cierre')).toBeVisible();
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

export async function esperarBandejaLista(page: Page): Promise<void> {
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

export async function abrirRectificacionDesdeFila(page: Page, fila: FilaBandejaNomina): Promise<void> {
  const btn = fila.row.getByRole('button', {
    name: new RegExp(`^Crear rectificación de ${escapeRegex(fila.empresa)} ${escapeRegex(fila.periodo)}$`),
  });
  await expect(btn).toBeVisible();
  await btn.click();
  await expect(page.getByRole('dialog', { name: 'Crear rectificación' })).toBeVisible();
}

export async function assertCierreInmutable(page: Page): Promise<void> {
  await irPasoCierre(page);
  await expect(page.getByText(/Evidencia congelada por cierre|Nómina cerrada/i).first()).toBeVisible();
  await expect(page.getByRole('button', { name: /Regenerar/i })).toHaveCount(0);
}

export async function withFalloTemporalBandeja(
  page: Page,
  failTimes: number,
  fn: () => Promise<void>,
): Promise<void> {
  let failures = 0;
  const handler = async (route: import('@playwright/test').Route) => {
    if (failures < failTimes && route.request().method() === 'GET') {
      failures += 1;
      await route.abort('timedout');
      return;
    }
    await route.continue();
  };

  await page.route('**/rest/v1/nomina_periodo**', handler);
  try {
    await fn();
  } finally {
    await page.unroute('**/rest/v1/nomina_periodo**', handler);
  }
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
