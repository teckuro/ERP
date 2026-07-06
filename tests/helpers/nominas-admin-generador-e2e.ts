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
  /** Rango legal (p. ej. 01–15/07/2026) — distingue cortes del mismo período. */
  rango: string;
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
    const rangoLocator = periodoCell.locator('.adm-nom__cell-meta--rango');
    const rango = (await rangoLocator.count()) > 0 ? (await rangoLocator.innerText()).trim() : '';
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
      rango,
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

export function esFilaAnticipo(fila: FilaBandejaNomina): boolean {
  return metaIncluye(fila, 'Anticipo')
    && !metaIncluye(fila, 'Extraordinaria')
    && !metaIncluye(fila, 'Pago extraordinario');
}

export function esFilaExtraordinaria(fila: FilaBandejaNomina): boolean {
  return metaIncluye(fila, 'Extraordinaria') || metaIncluye(fila, 'Pago extraordinario');
}

export function relocarFilaBandeja(
  filas: FilaBandejaNomina[],
  ref: Pick<FilaBandejaNomina, 'periodo' | 'empresa' | 'meta' | 'rango'>,
): FilaBandejaNomina | undefined {
  return filas.find(
    (f) =>
      f.periodo === ref.periodo
      && f.empresa === ref.empresa
      && f.meta === ref.meta
      && f.rango === ref.rango,
  );
}

/** Filas únicas por período + meta + rango legal (evita duplicar el mismo corte). */
export function filasDistintasPorCorte(filas: FilaBandejaNomina[]): FilaBandejaNomina[] {
  const vistas = new Set<string>();
  const out: FilaBandejaNomina[] = [];
  for (const fila of filas) {
    const clave = `${fila.periodo}|${fila.empresa}|${fila.meta}|${fila.rango}`;
    if (vistas.has(clave)) continue;
    vistas.add(clave);
    out.push(fila);
  }
  return out;
}

export async function refrescarBandejaNominas(page: Page): Promise<FilaBandejaNomina[]> {
  await mostrarTodasLasNominas(page);
  await esperarBandejaLista(page);
  return listarFilasBandeja(page);
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

/** Contenedor del generador (único `data-step`; el stepper también usa clase `nomina-shell`). */
export function locatorGeneradorShell(page: Page): Locator {
  return page.locator('section.nomina-shell[aria-label="Generador de nómina"]');
}

/** Espera cabecera + rehidratación (sin overlay de preparación). */
export async function esperarGeneradorListo(page: Page): Promise<void> {
  await expect(locatorGeneradorShell(page)).toBeVisible({ timeout: 60_000 });
  const overlay = locatorGeneradorShell(page).locator('app-workspace-loading');
  await expect(overlay).toHaveCount(0, { timeout: NOMINAS_E2E_TIMEOUT_MS });
  await page.waitForLoadState('networkidle');
}

export async function abrirGeneradorDesdeFila(page: Page, fila: FilaBandejaNomina): Promise<string> {
  await expect(fila.abrirGenerador).toBeVisible();
  await fila.abrirGenerador.click();
  await page.waitForURL(/\/remuneraciones\/nominas\/[^/]+\/generador/, { timeout: 60_000 });
  await expect(page.getByLabel('Generador de nómina')).toBeVisible();
  await esperarGeneradorListo(page);
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

export function elegirCandidataCalculoOla7(filas: FilaBandejaNomina[]): FilaBandejaNomina | undefined {
  const abiertas = filas.filter(
    (f) => esMensualLegalSinAnticipos(f) && !f.estado.includes('Cerrada') && !f.estado.includes('Anulada'),
  );
  const preferidas = abiertas.filter((f) => /c[aá]lculo|movimientos|validaci/i.test(f.proximoPaso));
  return preferidas[0] ?? abiertas[0];
}

const ORDEN_PASOS_GENERADOR: PasoGenerador[] = [
  'parameters',
  'dotacion',
  'movements',
  'calculation',
  'validation',
  'closure',
];

/** Confirma el modal uniforme al retroceder en el generador (pasos 2..5). */
export async function confirmarModalRetrocesoGenerador(page: Page): Promise<boolean> {
  const modal = page.locator('section.noia-msgbox[role="dialog"]').filter({
    has: page.locator('h2.noia-msgbox__title', { hasText: /^Volver a / }),
  });
  try {
    await modal.waitFor({ state: 'visible', timeout: 4_000 });
  } catch {
    return false;
  }
  await modal.locator('button.noia-msgbox__action', { hasText: 'Continuar' }).click();
  await expect(modal).toBeHidden({ timeout: 10_000 });
  return true;
}

export async function irPasoGenerador(page: Page, paso: PasoGenerador): Promise<void> {
  const destIdx = ORDEN_PASOS_GENERADOR.indexOf(paso);

  for (let intento = 0; intento < 8; intento += 1) {
    const actual = (await leerPasoActual(page)) as PasoGenerador;
    if (actual === paso) return;

    const actualIdx = ORDEN_PASOS_GENERADOR.indexOf(actual);
    if (actualIdx < 0) {
      throw new Error(`Paso generador desconocido: ${actual}`);
    }

    if (actualIdx > destIdx) {
      const pasoBtn = page
        .locator('nav.nomina-stepper')
        .getByRole('button', { name: ETIQUETA_PASO[paso] })
        .and(page.locator(':not([disabled])'));
      if ((await pasoBtn.count()) > 0) {
        await pasoBtn.first().click();
      } else {
        const back = page.locator('button.nmv2-stepper__back');
        await expect(back).toBeVisible();
        await back.click();
      }
      await confirmarModalRetrocesoGenerador(page);
    } else {
      const siguiente = ORDEN_PASOS_GENERADOR[actualIdx + 1];
      const nextBtn = page
        .locator('nav.nomina-stepper')
        .getByRole('button', { name: ETIQUETA_PASO[siguiente] })
        .and(page.locator(':not([disabled])'));
      await expect(nextBtn.first()).toBeVisible();
      await nextBtn.first().click();
    }
  }

  await expect(locatorGeneradorShell(page)).toHaveAttribute('data-step', paso, { timeout: 15_000 });
}

export async function leerPasoActual(page: Page): Promise<string> {
  return (await locatorGeneradorShell(page).getAttribute('data-step')) ?? '';
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
  const loading = page.locator('.adm-nom__grid-shell app-workspace-loading');
  if (await loading.count() > 0) {
    await expect(loading).toBeHidden({ timeout: NOMINAS_E2E_TIMEOUT_MS });
  }

  const error = page.locator('.adm-nom__state--error');
  const filas = page.locator('section.adm-nom__page tr.data-grid-row');
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (await error.isVisible()) {
      const msg = (await error.innerText()).trim();
      throw new Error(`Bandeja en error: ${msg}`);
    }
    if ((await filas.count()) > 0) {
      await expect(filas.first()).toBeVisible();
      return;
    }
    const vacio = page.getByText(/Aún no hay nóminas|Sin resultados con los filtros actuales/);
    if (await vacio.first().isVisible()) {
      return;
    }
    await page.waitForTimeout(250);
  }
  throw new Error('Bandeja no alcanzó estado listo (filas, vacío o error) en 60s.');
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

export function esListadoBandejaNominaE2e(url: string, method: string): boolean {
  if (method !== 'GET') return false;
  const lower = url.toLowerCase();
  if (!lower.includes('/rest/v1/nomina_periodo')) return false;
  // Listado del administrador (filtro empresa); excluir lecturas por id del generador.
  if (lower.includes('id=eq.')) return false;
  return lower.includes('id_empresa=eq.');
}

export async function withFalloTemporalBandeja(
  page: Page,
  failTimes: number,
  fn: () => Promise<void>,
): Promise<void> {
  let failures = 0;
  const handler = async (route: import('@playwright/test').Route) => {
    const req = route.request();
    if (failures < failTimes && esListadoBandejaNominaE2e(req.url(), req.method())) {
      failures += 1;
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'PGRST500',
          details: null,
          hint: null,
          message: 'E2E simulated bandeja failure',
        }),
      });
      return;
    }
    await route.continue();
  };

  await page.route('**/*', handler);
  try {
    await fn();
  } finally {
    await page.unroute('**/*', handler);
  }
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
