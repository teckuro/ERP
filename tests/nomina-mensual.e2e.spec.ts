import { expect, test, type Page } from '@playwright/test';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { isE2eNominaRealEnabled } from './helpers/e2e-env';

type AppConfig = {
  supabaseUrl: string;
  supabaseAnonKey: string;
};

type NominaPeriodoRow = {
  id_calculo_periodo: number;
  periodo: string;
  activo: boolean;
  reemplazado_por: number | null;
  total_trabajadores: number;
  total_haberes: number;
  total_descuentos: number;
  total_liquido: number;
  total_bloqueados: number;
  total_advertencias: number;
  aprobacion_operativa_estado: string | null;
  aprobacion_operativa_fecha: string | null;
  aprobacion_operativa_usuario_id: string | null;
  aprobacion_operativa_usuario_label: string | null;
  cierre_operativo_estado?: string | null;
  cierre_operativo_fecha?: string | null;
  cierre_operativo_usuario_label?: string | null;
};

const runNominaReal =
  isE2eNominaRealEnabled() &&
  Boolean(process.env['E2E_SUPABASE_AUTH_EMAIL']) &&
  Boolean(process.env['E2E_SUPABASE_AUTH_PASSWORD']) &&
  Boolean(process.env['E2E_NOMINA_PERIODO']);

const describeNominaReal = runNominaReal ? test.describe : test.describe.skip;
const runNominaCierreReal = runNominaReal && process.env['E2E_NOMINA_CIERRE_REAL'] === '1';
const NOMINA_E2E_TIMEOUT_MS = 30_000;

function loadAppConfig(): AppConfig {
  const path = resolve(process.cwd(), 'public', 'app-config.json');
  const rawConfig = readFileSync(path, 'utf8').replace(/^\uFEFF/, '');
  const raw = JSON.parse(rawConfig) as Partial<AppConfig>;
  return {
    supabaseUrl: (process.env['E2E_SUPABASE_URL'] ?? raw.supabaseUrl ?? '').replace(/\/$/, ''),
    supabaseAnonKey: process.env['E2E_SUPABASE_ANON_KEY'] ?? raw.supabaseAnonKey ?? '',
  };
}

async function createAuthenticatedClient(): Promise<SupabaseClient> {
  const config = loadAppConfig();
  const email = process.env['E2E_SUPABASE_AUTH_EMAIL'] ?? '';
  const password = process.env['E2E_SUPABASE_AUTH_PASSWORD'] ?? '';
  const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      storageKey: 'angular-erp-auth',
    },
  });

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  expect(error, 'No se pudo iniciar sesion authenticated para E2E de nomina real.').toBeNull();
  expect(data.session, 'Supabase no devolvio sesion authenticated para E2E de nomina real.').not.toBeNull();

  return supabase;
}

async function loginThroughUi(page: Page): Promise<void> {
  const email = process.env['E2E_SUPABASE_AUTH_EMAIL'] ?? '';
  const password = process.env['E2E_SUPABASE_AUTH_PASSWORD'] ?? '';

  page.setDefaultTimeout(NOMINA_E2E_TIMEOUT_MS);
  page.setDefaultNavigationTimeout(NOMINA_E2E_TIMEOUT_MS);
  await page.goto('/login?returnUrl=/remuneraciones/proceso-mensual');
  await expect(page.getByRole('heading', { name: 'Iniciar sesion' })).toBeVisible();
  await page.locator('#login-email').fill(email);
  await page.locator('#login-password').fill(password);
  await page.getByRole('button', { name: 'Iniciar sesion' }).click();
  await page.waitForURL('**/remuneraciones/proceso-mensual', { timeout: NOMINA_E2E_TIMEOUT_MS });
  await expect(page.getByText(/Sesi[oó]n activa|N[oó]mina mensual|Proceso mensual/i).first()).toBeVisible({ timeout: NOMINA_E2E_TIMEOUT_MS });
  await expect(page.locator('app-proceso-mensual-container')).toBeVisible({ timeout: NOMINA_E2E_TIMEOUT_MS });
}

async function clickAndWaitIdle(page: Page, name: RegExp | string): Promise<void> {
  const shellCta = page.locator('.erp-shell-header__cta').filter({ hasText: name });
  const target = await shellCta.count() ? shellCta.first() : page.getByRole('button', { name }).first();
  await target.click({ timeout: NOMINA_E2E_TIMEOUT_MS });
  await page.waitForLoadState('networkidle', { timeout: NOMINA_E2E_TIMEOUT_MS });
}

async function shellCtaText(page: Page): Promise<string> {
  return (await page.locator('.erp-shell-header__cta').first().innerText({ timeout: 5_000 })).trim();
}

async function setPeriodoThroughShell(page: Page, periodo: string): Promise<void> {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(periodo.trim());
  if (!match) throw new Error(`Periodo E2E invalido: ${periodo}`);
  const picker = page.locator('.erp-shell-header__period-edit');
  await picker.evaluate((node) => node.setAttribute('open', ''));
  await page.locator('#header-periodo-anio').selectOption(match[1]);
  await picker.evaluate((node) => node.setAttribute('open', ''));
  await page.locator('#header-periodo-mes').selectOption(match[2]);
  await expect(page.locator('app-proceso-mensual-container')).toBeVisible({ timeout: NOMINA_E2E_TIMEOUT_MS });
  await page.waitForLoadState('networkidle', { timeout: NOMINA_E2E_TIMEOUT_MS });
}

async function countRows(supabase: SupabaseClient, table: string, idCalculoPeriodo: number): Promise<number> {
  const { count, error } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq('id_calculo_periodo', idCalculoPeriodo);
  expect(error, `No se pudo contar ${table}.`).toBeNull();
  return count ?? 0;
}

async function countConceptos(supabase: SupabaseClient, idCalculoPeriodo: number): Promise<number> {
  const { data: trabajadores, error: trabajadoresError } = await supabase
    .from('nomina_calculo_trabajador')
    .select('id_calculo_trabajador')
    .eq('id_calculo_periodo', idCalculoPeriodo);
  expect(trabajadoresError, 'No se pudieron leer trabajadores para contar conceptos.').toBeNull();

  const trabajadorIds = (trabajadores ?? []).map((row: { id_calculo_trabajador: number }) => row.id_calculo_trabajador);
  expect(trabajadorIds.length).toBeGreaterThan(0);

  const { count, error } = await supabase
    .from('nomina_calculo_concepto')
    .select('*', { count: 'exact', head: true })
    .in('id_calculo_trabajador', trabajadorIds);
  expect(error, 'No se pudieron contar conceptos del snapshot.').toBeNull();
  return count ?? 0;
}

function cierreOperativoVisible(page: Page) {
  return page.getByRole('heading', { name: 'Nómina mensual confirmada' });
}

describeNominaReal('nomina mensual - E2E real authenticated', () => {
  test.describe.configure({ mode: 'serial', timeout: NOMINA_E2E_TIMEOUT_MS });

  test('Nómina mensual: verifica, genera, revisa, confirma y recupera al recargar', async ({ page }, testInfo) => {
    const periodo = process.env['E2E_NOMINA_PERIODO'] ?? '';
    const consoleErrors: string[] = [];
    const rpcResponses: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text());
      }
    });
    page.on('pageerror', (error) => {
      consoleErrors.push(error.message);
    });
    page.on('response', async (response) => {
      if (!response.url().includes('/rpc/guardar_nomina_calculo_snapshot')) return;
      let body = '';
      try {
        body = await response.text();
      } catch {
        body = 'No se pudo leer el cuerpo de la respuesta RPC.';
      }
      rpcResponses.push(`status=${response.status()}\n${body}`);
    });

    try {
      await loginThroughUi(page);
      const supabase = await createAuthenticatedClient();

      page.on('dialog', (dialog) => dialog.accept());

      await expect(page.locator('app-proceso-mensual-container')).toBeVisible({ timeout: NOMINA_E2E_TIMEOUT_MS });
      await setPeriodoThroughShell(page, periodo);
      const ctaInicial = await shellCtaText(page);
      test.skip(
        !/Verificar|Generar/i.test(ctaInicial),
        `Periodo ${periodo} no esta en estado inicial para el flujo completo. CTA actual: ${ctaInicial}`,
      );
      if (/Verificar/i.test(ctaInicial)) {
        await clickAndWaitIdle(page, /Verificar/);
      }

      if (runNominaCierreReal) {
        const { data: existingRows, error: existingError } = await supabase
          .from('nomina_calculo_periodo')
          .select('id_calculo_periodo,cierre_operativo_estado,cierre_operativo_fecha')
          .eq('periodo', periodo)
          .eq('activo', true)
          .is('reemplazado_por', null)
          .order('created_at', { ascending: false });
        expect(existingError).toBeNull();
        const existingClosed = (existingRows ?? [])[0]?.cierre_operativo_estado === 'cerrado_operativamente';
        if (existingClosed) {
          await expect(cierreOperativoVisible(page)).toBeVisible({ timeout: NOMINA_E2E_TIMEOUT_MS });
          await expect(page.getByRole('button', { name: /Revisar trabajadores/ }).first()).toBeDisabled();
          await expect(page.getByRole('button', { name: /Confirmar nómina/ }).first()).toBeDisabled();
          await expect(page.getByRole('button', { name: /Confirmar nómina/ }).first()).toBeDisabled();
          await page.reload();
          await setPeriodoThroughShell(page, periodo);
          await clickAndWaitIdle(page, /Verificar período/);
          await expect(cierreOperativoVisible(page)).toBeVisible({ timeout: NOMINA_E2E_TIMEOUT_MS });
          return;
        }
      }

      await expect(page.getByRole('button', { name: /Generar nómina/ }).first()).toBeEnabled({
        timeout: NOMINA_E2E_TIMEOUT_MS,
      });
      await clickAndWaitIdle(page, /Generar nómina/);
      await expect(page.getByRole('heading', { name: 'Base de nomina' })).toBeVisible({ timeout: NOMINA_E2E_TIMEOUT_MS });

      await expect(page.getByRole('button', { name: /Revisar trabajadores/ }).first()).toBeEnabled({ timeout: NOMINA_E2E_TIMEOUT_MS });
      await clickAndWaitIdle(page, /Revisar trabajadores/);
      await expect(page.getByText('Nómina en revisión', { exact: true })).toBeVisible({ timeout: NOMINA_E2E_TIMEOUT_MS });

      await expect(page.getByRole('button', { name: /Confirmar nómina/ }).first()).toBeEnabled({
        timeout: NOMINA_E2E_TIMEOUT_MS,
      });
      await page.getByRole('button', { name: /Confirmar nómina/ }).first().click();
      await expect(
        page.getByText(
          'Nómina mensual disponible para revisión.',
        ),
      ).toBeVisible({ timeout: NOMINA_E2E_TIMEOUT_MS });
      await expect(page.getByText('Nómina mensual disponible desde BD')).toBeVisible({ timeout: NOMINA_E2E_TIMEOUT_MS });

      const { data: rows, error: snapshotError } = await supabase
        .from('nomina_calculo_periodo')
        .select(
          'id_calculo_periodo,periodo,activo,reemplazado_por,total_trabajadores,total_haberes,total_descuentos,total_liquido,total_bloqueados,total_advertencias,aprobacion_operativa_estado,aprobacion_operativa_fecha,aprobacion_operativa_usuario_id,aprobacion_operativa_usuario_label',
        )
        .eq('periodo', periodo)
        .order('created_at', { ascending: false });
      expect(snapshotError).toBeNull();
      const snapshotRows = (rows ?? []) as NominaPeriodoRow[];
      const activeRows = snapshotRows.filter((row) => row.activo);
      expect(activeRows).toHaveLength(1);
      expect(activeRows[0].total_trabajadores).toBeGreaterThan(0);

      const activeId = activeRows[0].id_calculo_periodo;
      await expect.poll(() => countRows(supabase, 'nomina_calculo_trabajador', activeId)).toBeGreaterThan(0);
      await expect.poll(() => countConceptos(supabase, activeId)).toBeGreaterThan(0);
      await expect.poll(() => countRows(supabase, 'nomina_calculo_trazabilidad', activeId)).toBeGreaterThan(0);

      await expect(page.getByRole('button', { name: /Confirmar nómina/ }).first()).toBeEnabled({
        timeout: NOMINA_E2E_TIMEOUT_MS,
      });
      await page.getByRole('button', { name: /Confirmar nómina/ }).click();
      await expect(page.getByRole('heading', { name: /Confirmar nómina/i })).toBeVisible({ timeout: NOMINA_E2E_TIMEOUT_MS });
      await expect(page.getByText('Nómina mensual confirmada.', { exact: true })).toBeVisible({
        timeout: NOMINA_E2E_TIMEOUT_MS,
      });

      const { data: approved, error: approvedError } = await supabase
        .from('nomina_calculo_periodo')
        .select('id_calculo_periodo,aprobacion_operativa_estado,aprobacion_operativa_fecha')
        .eq('id_calculo_periodo', activeId)
        .maybeSingle();
      expect(approvedError).toBeNull();
      expect(approved?.aprobacion_operativa_estado).toBe('aprobado_operativamente');
      expect(approved?.aprobacion_operativa_fecha).toBeTruthy();

      await expect(page.getByRole('heading', { name: 'Cierre operativo' })).toBeVisible({ timeout: NOMINA_E2E_TIMEOUT_MS });
      if (runNominaCierreReal) {
        const { data: cierrePrevio, error: cierrePrevioError } = await supabase
          .from('nomina_calculo_periodo')
          .select('cierre_operativo_estado,cierre_operativo_fecha')
          .eq('id_calculo_periodo', activeId)
          .maybeSingle();
        expect(cierrePrevioError).toBeNull();

        if (cierrePrevio?.cierre_operativo_estado !== 'cerrado_operativamente') {
          await expect(page.getByRole('button', { name: /Confirmar nómina/ }).first()).toBeEnabled({
            timeout: NOMINA_E2E_TIMEOUT_MS,
          });
          await page.getByRole('button', { name: /Confirmar nómina/ }).click();
          await expect(cierreOperativoVisible(page)).toBeVisible({ timeout: NOMINA_E2E_TIMEOUT_MS });
        } else {
          await expect(cierreOperativoVisible(page)).toBeVisible({ timeout: NOMINA_E2E_TIMEOUT_MS });
        }

        const { data: cerrado, error: cerradoError } = await supabase
          .from('nomina_calculo_periodo')
          .select('cierre_operativo_estado,cierre_operativo_fecha')
          .eq('id_calculo_periodo', activeId)
          .maybeSingle();
        expect(cerradoError).toBeNull();
        expect(cerrado?.cierre_operativo_estado).toBe('cerrado_operativamente');
        expect(cerrado?.cierre_operativo_fecha).toBeTruthy();
        await expect(page.getByRole('button', { name: /Revisar trabajadores/ }).first()).toBeDisabled();
        await expect(page.getByRole('button', { name: /Confirmar nómina/ }).first()).toBeDisabled();
        await expect(page.getByRole('button', { name: /Confirmar nómina/ }).first()).toBeDisabled();
      } else {
        await testInfo.attach('nomina-cierre-real.md', {
          body: 'E2E cierre real omitido por seguridad: falta E2E_NOMINA_CIERRE_REAL=1.',
          contentType: 'text/markdown',
        });
      }

      await page.reload();
      await setPeriodoThroughShell(page, periodo);
      await clickAndWaitIdle(page, /Verificar período/);
      await expect(page.getByText('Nómina mensual disponible desde BD')).toBeVisible({ timeout: NOMINA_E2E_TIMEOUT_MS });
      await expect(page.getByText('Nómina mensual confirmada.', { exact: true })).toBeVisible({
        timeout: NOMINA_E2E_TIMEOUT_MS,
      });
      if (runNominaCierreReal) {
        await expect(cierreOperativoVisible(page)).toBeVisible({ timeout: NOMINA_E2E_TIMEOUT_MS });
      }
      await expect(page.getByRole('link', { name: /Liquidaciones/ })).toHaveCount(0);
      await expect(page.getByText('Salidas legales quedan fuera de esta fase.')).toBeVisible();
    } catch (error) {
      await testInfo.attach('nomina-console-errors.md', {
        body: consoleErrors.length > 0 ? consoleErrors.join('\n\n') : 'Sin errores de consola capturados.',
        contentType: 'text/markdown',
      });
      await testInfo.attach('nomina-rpc-responses.md', {
        body: rpcResponses.length > 0 ? rpcResponses.join('\n\n---\n\n') : 'Sin respuestas RPC capturadas.',
        contentType: 'text/markdown',
      });
      throw error;
    }
  });
});

test('nomina mensual - E2E real omitido sin variables authenticated', async () => {
  test.skip(
    runNominaReal,
    'E2E de nomina real activo; este caso solo documenta la omision por variables faltantes.',
  );

  expect(runNominaReal, 'E2E de nomina real omitido: faltan variables de entorno para sesion authenticated.').toBe(
    false,
  );
});
