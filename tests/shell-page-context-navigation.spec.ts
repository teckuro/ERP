/**
 * Smoke E2E del shell: al navegar entre pantallas no debe quedar contexto
 * residual en la cabecera (título / CTA / subtítulo del container anterior).
 *
 * Verifica el contrato implementado por `ShellPageContextService` + tokens de
 * propiedad y la coordinación con `NavigationStart`/`NavigationEnd` desde
 * `LayoutShellComponent`. Cubre tres tipos de pantallas:
 *
 * 1. Pantallas con `pageTitle` + CTA (Administrador de nóminas).
 * 2. Pantallas que sólo publican breadcrumbs (Parámetros) → no deben heredar
 *    `pageTitle`/CTA de la anterior.
 * 3. Pantallas que sólo heredan fallback de ruta (Empleados, Reportes) → idem.
 *
 * Requiere sesión Supabase real (se skippea si faltan vars `E2E_SUPABASE_AUTH_EMAIL`
 * y `E2E_SUPABASE_AUTH_PASSWORD`) porque las rutas del shell están detrás de
 * `authChildGuard`.
 */
import { test, expect, type Page } from '@playwright/test';

const TITULO_SELECTOR = '.erp-shell-header__title h1';
const CTA_SELECTOR = '.erp-shell-header__cta';
const TITLE_BLOCK_SELECTOR = '.erp-shell-header__title';
const BREADCRUMB_CURRENT_SELECTOR = '.erp-shell-header__crumb--current';

const EMAIL = process.env['E2E_SUPABASE_AUTH_EMAIL'] ?? '';
const PASSWORD = process.env['E2E_SUPABASE_AUTH_PASSWORD'] ?? '';
const credencialesPresentes = Boolean(EMAIL) && Boolean(PASSWORD);

async function loginViaUi(page: Page, returnUrl = '/empleados'): Promise<void> {
  await page.goto(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
  await expect(page.getByRole('heading', { name: 'Iniciar sesion' })).toBeVisible();
  await page.locator('#login-email').fill(EMAIL);
  await page.locator('#login-password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Iniciar sesion' }).click();
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 60_000 });
}

async function gotoYEstabilizar(page: Page, path: string): Promise<void> {
  await page.goto(path);
  // Esperamos a que la URL deje de ser /login (no rebota por auth).
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 30_000 });
  // Un tick para que el effect del helper publique contexto.
  await page.waitForTimeout(180);
}

async function leerTitulo(page: Page): Promise<string | null> {
  const titulo = page.locator(TITULO_SELECTOR);
  if ((await titulo.count()) === 0) return null;
  if (!(await titulo.first().isVisible())) return null;
  return (await titulo.first().textContent())?.trim() ?? null;
}

async function leerCtaLabel(page: Page): Promise<string | null> {
  const cta = page.locator(CTA_SELECTOR);
  if ((await cta.count()) === 0) return null;
  if (!(await cta.first().isVisible())) return null;
  return (await cta.first().textContent())?.trim() ?? null;
}

test.describe('Shell - contexto sin residuo al navegar', () => {
  test.skip(
    !credencialesPresentes,
    'Smoke E2E del shell requiere E2E_SUPABASE_AUTH_EMAIL y E2E_SUPABASE_AUTH_PASSWORD para superar authChildGuard.',
  );
  test.describe.configure({ mode: 'serial', timeout: 120_000 });

  test.beforeEach(async ({ page }) => {
    await loginViaUi(page, '/empleados');
  });

  test('Admin nóminas publica título + CTA y se limpia al ir a Empleados', async ({ page }) => {
    await gotoYEstabilizar(page, '/remuneraciones/nominas');

    expect(await leerTitulo(page)).toBe('Administrador de nóminas');
    const ctaAdmin = await leerCtaLabel(page);
    expect(ctaAdmin).not.toBeNull();
    expect(ctaAdmin?.toLowerCase()).toContain('nueva nómina');

    await gotoYEstabilizar(page, '/empleados');

    // Empleados no publica pageTitle ni CTA; el bloque de título no debe
    // mantenerse con texto del Admin.
    expect(await leerTitulo(page)).toBeNull();
    expect(await leerCtaLabel(page)).toBeNull();
    await expect(page.locator(BREADCRUMB_CURRENT_SELECTOR)).toHaveText('Empleados');
  });

  test('Parámetros tras Admin no hereda título "Administrador de nóminas"', async ({ page }) => {
    await gotoYEstabilizar(page, '/remuneraciones/nominas');
    expect(await leerTitulo(page)).toBe('Administrador de nóminas');

    await gotoYEstabilizar(page, '/parametros');

    // Parámetros sólo registra breadcrumbs; no debe haber pageTitle residual.
    expect(await leerTitulo(page)).toBeNull();
    expect(await leerCtaLabel(page)).toBeNull();
    await expect(page.locator(BREADCRUMB_CURRENT_SELECTOR)).toHaveText('Parámetros');
  });

  test('cadena Empleados -> Admin -> Parámetros -> Reportes mantiene coherencia del header', async ({ page }) => {
    await gotoYEstabilizar(page, '/empleados');
    expect(await leerTitulo(page)).toBeNull();
    expect(await leerCtaLabel(page)).toBeNull();
    await expect(page.locator(BREADCRUMB_CURRENT_SELECTOR)).toHaveText('Empleados');

    await gotoYEstabilizar(page, '/remuneraciones/nominas');
    expect(await leerTitulo(page)).toBe('Administrador de nóminas');
    expect((await leerCtaLabel(page))?.toLowerCase()).toContain('nueva nómina');

    await gotoYEstabilizar(page, '/parametros');
    expect(await leerTitulo(page)).toBeNull();
    // Parámetros sólo publica breadcrumbs; el CTA del Admin debe haber sido limpiado.
    expect(await leerCtaLabel(page)).toBeNull();
    await expect(page.locator(BREADCRUMB_CURRENT_SELECTOR)).toHaveText('Parámetros');

    await gotoYEstabilizar(page, '/reportes');
    expect(await leerTitulo(page)).toBeNull();
    // Reportes publica su propio CTA "Ver liquidaciones" (no debe quedar
    // "Nueva nómina" del Admin ni residuo de Parámetros).
    const ctaReportes = (await leerCtaLabel(page))?.toLowerCase() ?? '';
    expect(ctaReportes).toContain('ver liquidaciones');
    expect(ctaReportes).not.toContain('nueva nómina');
    await expect(page.locator(BREADCRUMB_CURRENT_SELECTOR)).toHaveText('Reportes');

    // Volvemos al Admin para asegurar que la reaparición de pageTitle/CTA
    // funciona tras varias transiciones consecutivas.
    await gotoYEstabilizar(page, '/remuneraciones/nominas');
    expect(await leerTitulo(page)).toBe('Administrador de nóminas');
    expect((await leerCtaLabel(page))?.toLowerCase()).toContain('nueva nómina');
  });

  test('cuando hay título, el bloque del título es visible (sin colapsar layout)', async ({ page }) => {
    await gotoYEstabilizar(page, '/remuneraciones/nominas');
    await expect(page.locator(TITLE_BLOCK_SELECTOR)).toBeVisible();
    await expect(page.locator(TITULO_SELECTOR)).toBeVisible();

    // Y al irnos a una ruta sin título, el bloque desaparece (no se queda con
    // texto residual; el @if del template hace esto explícito).
    await gotoYEstabilizar(page, '/empleados');
    await expect(page.locator(TITULO_SELECTOR)).toHaveCount(0);
  });
});
