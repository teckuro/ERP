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

function loadAppConfig(): AppConfig {
  const path = resolve(process.cwd(), 'public', 'app-config.json');
  const raw = JSON.parse(readFileSync(path, 'utf8')) as Partial<AppConfig>;
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

  await page.goto('/login?returnUrl=/remuneraciones/proceso-mensual');
  await expect(page.getByRole('heading', { name: 'Iniciar sesion' })).toBeVisible();
  await page.locator('#login-email').fill(email);
  await page.locator('#login-password').fill(password);
  await page.getByRole('button', { name: 'Iniciar sesion' }).click();
  await page.waitForURL('**/remuneraciones/proceso-mensual', { timeout: 60_000 });
  await expect(page.getByText('Sesion activa')).toBeVisible({ timeout: 30_000 });
}

async function clickAndWaitIdle(page: Page, name: RegExp | string): Promise<void> {
  await page.getByRole('button', { name }).first().click();
  await page.waitForLoadState('networkidle');
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
  return page.getByRole('heading', { name: 'Nomina cerrada operativamente' });
}

describeNominaReal('nomina mensual - E2E real authenticated', () => {
  test.describe.configure({ mode: 'serial', timeout: 300_000 });

  test('Preparar nomina: calcula, guarda por RPC, consulta BD, aprueba y recupera al recargar', async ({ page }, testInfo) => {
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

      await expect(page.getByRole('heading', { name: 'Preparar nomina' })).toBeVisible();
      await page.locator('#pm-periodo').fill(periodo);
      await clickAndWaitIdle(page, /Validar periodo/);
      await expect(page.getByText('Estado para calculo preliminar')).toBeVisible({ timeout: 60_000 });

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
          await expect(cierreOperativoVisible(page)).toBeVisible({ timeout: 60_000 });
          await expect(page.getByRole('button', { name: /Calcular preliminar/ }).first()).toBeDisabled();
          await expect(page.getByRole('button', { name: /Guardar resultado preliminar/ }).first()).toBeDisabled();
          await expect(page.getByRole('button', { name: /Aprobar resultado preliminar/ }).first()).toBeDisabled();
          await page.reload();
          await page.locator('#pm-periodo').fill(periodo);
          await clickAndWaitIdle(page, /Validar periodo/);
          await expect(cierreOperativoVisible(page)).toBeVisible({ timeout: 60_000 });
          return;
        }
      }

      await expect(page.getByRole('button', { name: /Generar base de nomina/ }).first()).toBeEnabled({
        timeout: 60_000,
      });
      await clickAndWaitIdle(page, /Generar base de nomina/);
      await expect(page.getByRole('heading', { name: 'Base de nomina' })).toBeVisible({ timeout: 60_000 });

      await expect(page.getByRole('button', { name: /Calcular preliminar/ }).first()).toBeEnabled({ timeout: 60_000 });
      await clickAndWaitIdle(page, /Calcular preliminar/);
      await expect(page.getByText('Resultado preliminar generado', { exact: true })).toBeVisible({ timeout: 60_000 });

      await expect(page.getByRole('button', { name: /Guardar resultado preliminar/ }).first()).toBeEnabled({
        timeout: 60_000,
      });
      await page.getByRole('button', { name: /Guardar resultado preliminar/ }).first().click();
      await expect(
        page.getByText(
          'Resultado preliminar guardado correctamente. Revisa y aprueba operativamente este nuevo resultado si corresponde.',
        ),
      ).toBeVisible({ timeout: 90_000 });
      await expect(page.getByText('Resultado guardado desde BD')).toBeVisible({ timeout: 90_000 });

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

      await expect(page.getByRole('button', { name: /Aprobar resultado preliminar/ }).first()).toBeEnabled({
        timeout: 60_000,
      });
      await page.getByRole('button', { name: /Aprobar resultado preliminar/ }).click();
      await expect(page.getByRole('heading', { name: 'Aprobacion operativa' })).toBeVisible({ timeout: 60_000 });
      await expect(page.getByText('Resultado preliminar aprobado operativamente.', { exact: true })).toBeVisible({
        timeout: 60_000,
      });

      const { data: approved, error: approvedError } = await supabase
        .from('nomina_calculo_periodo')
        .select('id_calculo_periodo,aprobacion_operativa_estado,aprobacion_operativa_fecha')
        .eq('id_calculo_periodo', activeId)
        .maybeSingle();
      expect(approvedError).toBeNull();
      expect(approved?.aprobacion_operativa_estado).toBe('aprobado_operativamente');
      expect(approved?.aprobacion_operativa_fecha).toBeTruthy();

      await expect(page.getByRole('heading', { name: 'Cierre operativo' })).toBeVisible({ timeout: 60_000 });
      if (runNominaCierreReal) {
        const { data: cierrePrevio, error: cierrePrevioError } = await supabase
          .from('nomina_calculo_periodo')
          .select('cierre_operativo_estado,cierre_operativo_fecha')
          .eq('id_calculo_periodo', activeId)
          .maybeSingle();
        expect(cierrePrevioError).toBeNull();

        if (cierrePrevio?.cierre_operativo_estado !== 'cerrado_operativamente') {
          await expect(page.getByRole('button', { name: /Cerrar nomina del periodo/ }).first()).toBeEnabled({
            timeout: 60_000,
          });
          await page.getByRole('button', { name: /Cerrar nomina del periodo/ }).click();
          await expect(cierreOperativoVisible(page)).toBeVisible({ timeout: 60_000 });
        } else {
          await expect(cierreOperativoVisible(page)).toBeVisible({ timeout: 60_000 });
        }

        const { data: cerrado, error: cerradoError } = await supabase
          .from('nomina_calculo_periodo')
          .select('cierre_operativo_estado,cierre_operativo_fecha')
          .eq('id_calculo_periodo', activeId)
          .maybeSingle();
        expect(cerradoError).toBeNull();
        expect(cerrado?.cierre_operativo_estado).toBe('cerrado_operativamente');
        expect(cerrado?.cierre_operativo_fecha).toBeTruthy();
        await expect(page.getByRole('button', { name: /Calcular preliminar/ }).first()).toBeDisabled();
        await expect(page.getByRole('button', { name: /Guardar resultado preliminar/ }).first()).toBeDisabled();
        await expect(page.getByRole('button', { name: /Aprobar resultado preliminar/ }).first()).toBeDisabled();
      } else {
        await testInfo.attach('nomina-cierre-real.md', {
          body: 'E2E cierre real omitido por seguridad: falta E2E_NOMINA_CIERRE_REAL=1.',
          contentType: 'text/markdown',
        });
      }

      await page.reload();
      await page.locator('#pm-periodo').fill(periodo);
      await clickAndWaitIdle(page, /Validar periodo/);
      await expect(page.getByText('Resultado guardado desde BD')).toBeVisible({ timeout: 90_000 });
      await expect(page.getByText('Resultado preliminar aprobado operativamente.', { exact: true })).toBeVisible({
        timeout: 60_000,
      });
      if (runNominaCierreReal) {
        await expect(cierreOperativoVisible(page)).toBeVisible({ timeout: 60_000 });
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
