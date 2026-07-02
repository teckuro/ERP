import { expect, test } from '@playwright/test';

import {
  abrirGeneradorDesdeFila,
  agruparFilasPorPeriodo,
  e2eNominaDotacionMinima,
  esperarBandejaLista,
  irPasoDotacion,
  leerTotalDotacion,
  listarFilasBandeja,
  loginNominasAdmin,
  mostrarTodasLasNominas,
  nominasAdminGeneradorCredentialsReady,
  paginarDotacionSiguiente,
  volverAdministradorNominas,
} from './helpers/nominas-admin-generador-e2e';

test.describe('Administrador y generador de nóminas', () => {
  test.skip(
    !nominasAdminGeneradorCredentialsReady(),
    'Requiere E2E_SUPABASE_AUTH_EMAIL y E2E_SUPABASE_AUTH_PASSWORD.',
  );
  test.describe.configure({ mode: 'serial', timeout: 120_000 });

  test.beforeEach(async ({ page }) => {
    await loginNominasAdmin(page);
  });

  test('muestra la bandeja operativa y abre el generador existente', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Nueva nómina/i })).toBeVisible();
    await expect(page.getByLabel('Vista operativa')).toBeVisible();
    await esperarBandejaLista(page);

    const abrir = page.getByRole('button', { name: /^Abrir generador de / });
    if ((await abrir.count()) === 0) {
      test.skip(true, 'Bandeja sin nóminas abiertas al generador (¿id_empresa en JWT?).');
      return;
    }

    await expect(abrir.first()).toHaveAttribute('title', 'Abrir generador');
    await abrir.first().click();
    await page.waitForURL(/\/remuneraciones\/nominas\/[^/]+\/generador/, { timeout: 30_000 });
    await expect(page.getByLabel('Generador de nómina')).toBeVisible();
  });

  test('BKL-08: dos nóminas del mismo período no mezclan nominaPeriodoId al alternar', async ({ page }) => {
    await mostrarTodasLasNominas(page);
    await esperarBandejaLista(page);
    const filas = await listarFilasBandeja(page);
    test.skip(filas.length < 2, 'Requiere al menos 2 nóminas en la bandeja.');

    const porPeriodo = agruparFilasPorPeriodo(filas);
    const parMismoPeriodo = [...porPeriodo.entries()].find(([, grupo]) => grupo.length >= 2);
    test.skip(
      !parMismoPeriodo,
      'Requiere ≥2 nóminas del mismo período en BD (residuo F06/F09).',
    );

    const [periodo, grupo] = parMismoPeriodo!;
    const idA = await abrirGeneradorDesdeFila(page, grupo[0]!);
    await expect(page.locator('.nomina-shell')).toHaveAttribute('data-step', /parameters|dotacion|movements|calculation|validation|closure/);

    await volverAdministradorNominas(page);
    await mostrarTodasLasNominas(page);
    const idB = await abrirGeneradorDesdeFila(page, grupo[1]!);

    expect(idA).not.toBe(idB);

    await page.reload({ waitUntil: 'networkidle' });
    expect(page.url()).toContain(idB);
    expect(page.url()).not.toContain(`${idA}/`);
    await expect(page.getByLabel('Generador de nómina')).toBeVisible();

    await volverAdministradorNominas(page);
    await mostrarTodasLasNominas(page);
    const filasPost = await listarFilasBandeja(page);
    const mismoPeriodo = filasPost.filter((f) => f.periodo === periodo);
    expect(mismoPeriodo.length).toBeGreaterThanOrEqual(2);
  });

  test('BKL-08: dotación server-side pagina sin bloquear la grilla', async ({ page }) => {
    const minTrabajadores = e2eNominaDotacionMinima();

    await mostrarTodasLasNominas(page);
    await esperarBandejaLista(page);
    const filas = await listarFilasBandeja(page);
    test.skip(filas.length === 0, 'Requiere al menos 1 nómina en la bandeja.');

    const filaGrande = [...filas].sort((a, b) => b.trabajadores - a.trabajadores)[0]!;
    test.skip(
      filaGrande.trabajadores < minTrabajadores,
      `Requiere dotación ≥${minTrabajadores} trabajadores (ajustar E2E_NOMINA_DOTACION_MIN).`,
    );

    await abrirGeneradorDesdeFila(page, filaGrande);
    await irPasoDotacion(page);

    const totalUi = await leerTotalDotacion(page);
    expect(totalUi).toBeGreaterThanOrEqual(minTrabajadores);

    const paginaActual = page.getByLabel('Pagina actual');
    await expect(paginaActual).toBeVisible();
    const textoPagina = (await paginaActual.innerText()).trim();
    expect(textoPagina).toMatch(/^1 \/ \d+$/);

    if (totalUi > 50) {
      await paginarDotacionSiguiente(page);
      await expect(paginaActual).not.toHaveText(/^1 \/ 1$/);
      await expect(page.locator('section.paso-dotacion')).not.toContainText('No fue posible');
    }
  });
});
