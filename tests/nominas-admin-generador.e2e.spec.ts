import { expect, test } from '@playwright/test';

import {
  abrirGeneradorDesdeFila,
  abrirRectificacionDesdeFila,
  agruparFilasPorPeriodo,
  assertCierreInmutable,
  e2eNominaDotacionMinima,
  e2eNominaPartialCredentialsReady,
  elegirCandidataCalculoOla7,
  esperarBandejaLista,
  esFilaAnticipo,
  esFilaExtraordinaria,
  esMensualLegalSinAnticipos,
  extraerNominaPeriodoId,
  filasConMeta,
  filasDistintasPorCorte,
  filasPorEstado,
  irPasoDotacion,
  irPasoGenerador,
  irPasoCierre,
  leerPasoActual,
  leerTotalDotacion,
  listarFilasBandeja,
  locatorGeneradorShell,
  loginNominasAdmin,
  esperarGeneradorListo,
  esListadoBandejaNominaE2e,
  loginNominasPartial,
  mostrarTodasLasNominas,
  nominasAdminGeneradorCredentialsReady,
  paginarDotacionSiguiente,
  refrescarBandejaNominas,
  relocarFilaBandeja,
  volverAdministradorNominas,
  withFalloTemporalBandeja,
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

    const abrir = page.getByRole('button', { name: /^Abrir nómina de / });
    if ((await abrir.count()) === 0) {
      test.skip(true, 'Bandeja sin nóminas abiertas al generador (¿id_empresa en JWT?).');
      return;
    }

    await expect(abrir.first()).toHaveAttribute('title', 'Abrir nómina');
    await abrir.first().click();
    await page.waitForURL(/\/remuneraciones\/nominas\/[^/?#]+(?:[?#]|$)/, { timeout: 30_000 });
    await expect(page).not.toHaveURL(/\/generador/);
    await expect(page).not.toHaveURL(/\/remuneraciones\/nominas\/?$/);
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
    await expect(locatorGeneradorShell(page)).toHaveAttribute('data-step', /parameters|dotacion|movements|calculation|closure/);

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

test.describe('F20 — Certificación operativa (matriz E2E)', () => {
  test.skip(
    !nominasAdminGeneradorCredentialsReady(),
    'Requiere E2E_SUPABASE_AUTH_EMAIL y E2E_SUPABASE_AUTH_PASSWORD.',
  );
  test.describe.configure({ mode: 'serial', timeout: 180_000 });

  test.beforeEach(async ({ page }) => {
    await loginNominasAdmin(page);
    await mostrarTodasLasNominas(page);
    await esperarBandejaLista(page);
  });

  test('F20-01: mensual sin anticipos abre generador en paso coherente', async ({ page }) => {
    const filas = await listarFilasBandeja(page);
    const candidata = filas.find((f) => esMensualLegalSinAnticipos(f) && !f.estado.includes('Cerrada'));
    test.skip(!candidata, 'Requiere nómina mensual legal (sin meta Anticipo/Extraordinaria) en BD.');

    await abrirGeneradorDesdeFila(page, candidata!);
    await expect(locatorGeneradorShell(page)).toHaveAttribute(
      'data-step',
      /parameters|dotacion|movements|calculation|closure/,
    );
    await expect(page.getByLabel('Generador de nómina')).toBeVisible();
  });

  test('OLA7-smoke: paso Cálculo accesible con CTA calcular/recalcular', async ({ page }) => {
    const filas = await listarFilasBandeja(page);
    const candidata = elegirCandidataCalculoOla7(filas);
    test.skip(!candidata, 'Requiere nómina mensual abierta al generador en BD.');

    await abrirGeneradorDesdeFila(page, candidata!);
    await irPasoGenerador(page, 'calculation');
    await expect(page.locator('section.paso-calc')).toBeVisible();
    await expect(
      page.getByRole('button', { name: /Calcular nómina|Recalcular|Calculando/ }),
    ).toBeVisible();
  });

  test('F20-02: mensual con anticipo semanal expone meta en bandeja', async ({ page }) => {
    const filas = await listarFilasBandeja(page);
    const anticipoSemanal = filasConMeta(filas, 'Anticipo', 'Semanal')[0];
    test.skip(!anticipoSemanal, 'Requiere nómina Anticipo · Semanal en BD (gate F09).');

    await abrirGeneradorDesdeFila(page, anticipoSemanal);
    await expect(page.locator('.nmv2-context-franja')).toBeVisible();
  });

  test('F20-03: mismo período admite dos anticipos quincenales distintos', async ({ page }) => {
    const filas = filasDistintasPorCorte(await listarFilasBandeja(page));
    const quincenales = filasConMeta(filas, 'Anticipo', 'Quincenal');
    test.skip(quincenales.length < 2, 'Requiere ≥2 nóminas Anticipo · Quincenal en BD.');

    const porPeriodo = agruparFilasPorPeriodo(quincenales);
    const par = [...porPeriodo.entries()].find(([, grupo]) => {
      const distintas = filasDistintasPorCorte(grupo);
      return distintas.length >= 2 && distintas.some((f) => f.rango.length > 0);
    });
    test.skip(!par, 'Requiere ≥2 anticipos quincenales del mismo período con rangos legales distintos.');

    const [, grupo] = par!;
    const distintas = filasDistintasPorCorte(grupo);
    const refA = distintas[0]!;
    const refB = distintas[1]!;
    test.skip(refA.rango === refB.rango, 'Los dos cortes quincenales deben tener rango legal distinto.');

    const idA = await abrirGeneradorDesdeFila(page, refA);
    await volverAdministradorNominas(page);
    const filasRefresh = await refrescarBandejaNominas(page);
    const filaB = relocarFilaBandeja(filasRefresh, refB);
    expect(filaB, 'La segunda nómina quincenal debe seguir visible en bandeja.').toBeTruthy();
    const idB = await abrirGeneradorDesdeFila(page, filaB!);
    expect(idA).not.toBe(idB);
  });

  test('F20-04: extraordinaria imponible aparece en bandeja y abre generador', async ({ page }) => {
    const filas = await listarFilasBandeja(page);
    const extraordinaria = filasConMeta(filas, 'Extraordinaria')[0]
      ?? filasConMeta(filas, 'Pago extraordinario')[0];
    test.skip(!extraordinaria, 'Requiere nómina extraordinaria en BD (gate F09).');

    await abrirGeneradorDesdeFila(page, extraordinaria);
    await expect(page.getByLabel('Generador de nómina')).toBeVisible();
  });

  test('F20-05: período con anticipos y extraordinaria no mezcla contexto', async ({ page }) => {
    const filas = await listarFilasBandeja(page);
    const porPeriodo = agruparFilasPorPeriodo(filas);
    const periodoMixto = [...porPeriodo.entries()].find(([, grupo]) => {
      const tieneAnticipo = grupo.some((f) => esFilaAnticipo(f));
      const tieneExtra = grupo.some((f) => esFilaExtraordinaria(f));
      return tieneAnticipo && tieneExtra;
    });
    test.skip(!periodoMixto, 'Requiere mismo período con anticipo y extraordinaria en BD.');

    const [, grupo] = periodoMixto!;
    const anticipo = grupo.find((f) => esFilaAnticipo(f))!;
    const extra = grupo.find((f) => esFilaExtraordinaria(f))!;
    expect(anticipo.meta).not.toBe(extra.meta);

    const idAnticipo = await abrirGeneradorDesdeFila(page, anticipo);
    await volverAdministradorNominas(page);
    const filasRefresh = await refrescarBandejaNominas(page);
    const extraRefresh = relocarFilaBandeja(filasRefresh, extra);
    expect(extraRefresh, 'La fila extraordinaria debe seguir en bandeja tras volver.').toBeTruthy();
    const idExtra = await abrirGeneradorDesdeFila(page, extraRefresh!);
    expect(idAnticipo).not.toBe(idExtra);
  });

  test('F20-06: advertencia pendiente expone justificación en cierre', async ({ page }) => {
    const filas = await listarFilasBandeja(page);
    const conAvisos = filas.find((f) => /aviso/i.test(f.proximoPaso));
    test.skip(!conAvisos, 'Requiere nómina con advertencias pendientes en bandeja.');

    await abrirGeneradorDesdeFila(page, conAvisos);
    await irPasoCierre(page);
    const cierre = page.locator('section.paso-cierre');
    await expect(cierre.getByText('Justificación').first()).toBeVisible();
    await expect(cierre.getByRole('button', { name: 'Aceptar advertencia' }).first()).toBeVisible();
  });

  test('F20-07: incidencia crítica expone acción de resolución en cierre', async ({ page }) => {
    const filas = await listarFilasBandeja(page);
    const conCriticas = filas.find((f) => /cr[ií]tica/i.test(f.proximoPaso));
    test.skip(!conCriticas, 'Requiere nómina con incidencias críticas pendientes en bandeja.');

    await abrirGeneradorDesdeFila(page, conCriticas);
    await irPasoCierre(page);
    await expect(
      page.locator('section.paso-cierre').getByRole('button', { name: 'Marcar resuelta' }).first(),
    ).toBeVisible();
  });

  test('F20-08: usuario con permisos parciales no puede crear nómina', async ({ page }) => {
    test.skip(
      !e2eNominaPartialCredentialsReady(),
      'Requiere E2E_NOMINA_PARTIAL_EMAIL y E2E_NOMINA_PARTIAL_PASSWORD.',
    );

    await loginNominasPartial(page);
    await mostrarTodasLasNominas(page);
    await esperarBandejaLista(page);

    const nuevaNomina = page.getByRole('button', { name: /Nueva nómina/i });
    await expect(nuevaNomina).toBeVisible();
    await expect(nuevaNomina).toBeDisabled();
  });

  test('F20-09: reanudación tras recarga conserva nominaPeriodoId y paso', async ({ page }) => {
    const filas = await listarFilasBandeja(page);
    test.skip(filas.length === 0, 'Requiere al menos 1 nómina en la bandeja.');

    const id = await abrirGeneradorDesdeFila(page, filas[0]!);
    await expect(locatorGeneradorShell(page)).toHaveAttribute('data-step', /.+/);
    const pasoAntes = await leerPasoActual(page);

    await page.reload({ waitUntil: 'networkidle' });
    expect(extraerNominaPeriodoId(page.url())).toBe(id);
    await esperarGeneradorListo(page);
    await expect(locatorGeneradorShell(page)).toHaveAttribute('data-step', pasoAntes, { timeout: 30_000 });
  });

  test('F20-10: dos nóminas del mismo mes sin contaminación (BKL-08)', async ({ page }) => {
    const filas = await listarFilasBandeja(page);
    test.skip(filas.length < 2, 'Requiere al menos 2 nóminas en la bandeja.');

    const porPeriodo = agruparFilasPorPeriodo(filas);
    const parMismoPeriodo = [...porPeriodo.entries()].find(([, grupo]) => grupo.length >= 2);
    test.skip(!parMismoPeriodo, 'Requiere ≥2 nóminas del mismo período en BD.');

    const [, grupo] = parMismoPeriodo!;
    const idA = await abrirGeneradorDesdeFila(page, grupo[0]!);
    await volverAdministradorNominas(page);
    await mostrarTodasLasNominas(page);
    const idB = await abrirGeneradorDesdeFila(page, grupo[1]!);
    expect(idA).not.toBe(idB);

    await page.reload({ waitUntil: 'networkidle' });
    expect(page.url()).toContain(idB);
    expect(page.url()).not.toContain(`${idA}/`);
  });

  test('F20-11: cierre inmutable congela liquidaciones internas', async ({ page }) => {
    const filas = await listarFilasBandeja(page);
    const cerrada = filasPorEstado(filas, 'Cerrada')[0];
    test.skip(!cerrada, 'Requiere nómina cerrada en BD.');

    await abrirGeneradorDesdeFila(page, cerrada);
    await assertCierreInmutable(page);
  });

  test('F20-12: rectificación diferencial muestra contexto del cierre original', async ({ page }) => {
    const filas = await listarFilasBandeja(page);
    const cerradas = filasPorEstado(filas, 'Cerrada');
    let cerrada = undefined as (typeof cerradas)[number] | undefined;
    for (const fila of cerradas) {
      const count = await fila.row.getByRole('button', { name: /^Crear rectificación de / }).count();
      if (count > 0) {
        cerrada = fila;
        break;
      }
    }
    test.skip(!cerrada, 'Requiere nómina cerrada con gate de rectificación en BD.');

    await abrirRectificacionDesdeFila(page, cerrada!);
    await expect(page.getByLabel('Referencia del cierre original')).toBeVisible();
    await expect(page.getByText('Líquido original')).toBeVisible();
    await expect(page.getByText('Dotación original')).toBeVisible();
  });

  test('F20-13: reintento tras timeout recupera la bandeja', async ({ page }) => {
    await mostrarTodasLasNominas(page);
    await esperarBandejaLista(page);

    await withFalloTemporalBandeja(page, 1, async () => {
      const errorVisible = expect(page.locator('.adm-nom__state--error')).toBeVisible({
        timeout: 60_000,
      });
      const listadoFallido = page.waitForResponse(
        (res) => esListadoBandejaNominaE2e(res.url(), res.request().method()) && res.status() === 500,
        { timeout: 60_000 },
      );
      await page.goto('/remuneraciones/nominas', { waitUntil: 'domcontentloaded' });
      await listadoFallido;
      await errorVisible;
      await page.getByRole('button', { name: 'Reintentar' }).click();
      await expect(page.locator('.adm-nom__state--error')).toBeHidden({ timeout: 60_000 });
      await mostrarTodasLasNominas(page);
      await esperarBandejaLista(page);
    });
  });

  test('F20-14: concurrencia entre dos sesiones no mezcla generadores', async ({ browser }) => {
    const filasPage = await browser.newPage();
    await loginNominasAdmin(filasPage);
    await mostrarTodasLasNominas(filasPage);
    await esperarBandejaLista(filasPage);
    const filas = await listarFilasBandeja(filasPage);
    test.skip(filas.length < 2, 'Requiere al menos 2 nóminas en la bandeja.');
    await filasPage.close();

    const ctxA = await browser.newContext();
    const ctxB = await browser.newContext();
    const pageA = await ctxA.newPage();
    const pageB = await ctxB.newPage();

    try {
      await loginNominasAdmin(pageA);
      await loginNominasAdmin(pageB);
      await mostrarTodasLasNominas(pageA);
      await mostrarTodasLasNominas(pageB);
      await esperarBandejaLista(pageA);
      await esperarBandejaLista(pageB);

      const filasA = await listarFilasBandeja(pageA);
      const filasB = await listarFilasBandeja(pageB);
      const filaA = filasA[0]!;
      const filaB = filasB.find((f) => f.periodo !== filaA.periodo || f.empresa !== filaA.empresa)
        ?? filasB[1]!;

      const [idA, idB] = await Promise.all([
        abrirGeneradorDesdeFila(pageA, filaA),
        abrirGeneradorDesdeFila(pageB, filaB),
      ]);

      expect(idA).not.toBe(idB);
      expect(extraerNominaPeriodoId(pageA.url())).toBe(idA);
      expect(extraerNominaPeriodoId(pageB.url())).toBe(idB);
    } finally {
      await ctxA.close();
      await ctxB.close();
    }
  });
});

function metaIncluyeLocal(fila: { meta: string }, parte: string): boolean {
  return fila.meta.toLowerCase().includes(parte.toLowerCase());
}
