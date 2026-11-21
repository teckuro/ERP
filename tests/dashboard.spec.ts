import { test, expect } from '@playwright/test';

async function selectFirstAvailableOption(page: import('@playwright/test').Page, selector: string) {
  const select = page.locator(selector);
  await expect(select).toBeVisible();

  if ((await select.locator('option').count()) > 1) {
    await select.selectOption({ index: 1 });
  }
}

const routes = [
  { path: '/', name: 'dashboard' },
  { path: '/empleados', name: 'empleados' },
  { path: '/remuneraciones/haberes-descuentos', name: 'haberes-descuentos' },
  { path: '/remuneraciones/proceso-mensual', name: 'proceso-remuneraciones' },
  { path: '/remuneraciones/liquidaciones', name: 'liquidaciones' },
  { path: '/licencias-medicas', name: 'licencias-medicas' },
  { path: '/reportes', name: 'reportes' },
  { path: '/parametros', name: 'parametros' },
];

for (const route of routes) {
  test(`${route.name} visual`, async ({ page }) => {
    await page.goto(route.path);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot(`${route.name}.png`, { fullPage: true });
  });
}

test('empleados - flujo nueva ficha', async ({ page }) => {
  test.slow();
  await page.goto('/empleados/nuevo');

  await expect(page.getByText('Nueva ficha de empleado')).toBeVisible();
  await expect(page.getByText('Preparando formulario')).toBeHidden({ timeout: 30_000 });

  await expect(page).toHaveScreenshot('empleados-nueva-ficha-identificacion.png', {
    fullPage: true,
  });

  await page.locator('#empleado-rut').fill('12.345.678-5');
  await page.locator('#empleado-fecha-nacimiento').fill('1990-05-14');
  await page.locator('#empleado-nombres').fill('Camila Andrea');
  await page.locator('#empleado-apellido-paterno').fill('Soto');
  await page.locator('#empleado-apellido-materno').fill('Rojas');
  await selectFirstAvailableOption(page, '#empleado-idPais');
  await page.locator('#empleado-email').fill('camila.soto@empresa.cl');
  await page.locator('#empleado-telefono').fill('56912345678');
  await page.locator('#empleado-direccion').fill('Av. Apoquindo');
  await page.locator('#empleado-numero-direccion').fill('1001');
  await selectFirstAvailableOption(page, '#empleado-comuna');
  await page.getByRole('button', { name: 'Siguiente' }).click();

  await expect(page.getByRole('heading', { name: 'Datos laborales', exact: true })).toBeVisible();
  await expect(page).toHaveScreenshot('empleados-nueva-ficha-laborales.png', {
    fullPage: true,
  });

  await page.locator('#empleado-fecha-ingreso').fill('2026-04-20');
  await page.locator('#empleado-fecha-contrato').fill('2026-04-20');
  await selectFirstAvailableOption(page, '#empleado-tipo-trabajador');
  await selectFirstAvailableOption(page, '#empleado-tipo-jornada');
  await page.locator('#empleado-cargo').fill('Analista de remuneraciones');
  await page.getByRole('button', { name: 'Siguiente' }).click();

  await expect(page.getByRole('heading', { name: 'Prevision y salud' })).toBeVisible();
  await expect(page).toHaveScreenshot('empleados-nueva-ficha-prevision-salud.png', {
    fullPage: true,
  });

  await page.locator('#empleado-tipo-regimen-previsional').selectOption({ index: 3 });
  await page.getByRole('button', { name: 'Siguiente' }).click();

  await expect(page.getByRole('heading', { name: 'Bloque bancario' })).toBeVisible();
  await expect(page).toHaveScreenshot('empleados-nueva-ficha-administrativos.png', {
    fullPage: true,
  });
});
