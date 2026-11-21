import { test, expect } from '@playwright/test';

import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Genera imágenes (PNG) de cada pestaña de la pantalla /parametros.
 * Guarda en: docs/codex/assets/parametros-tabs/ (o carpeta indicada por env).
 */
test('parametros: capturas por pestaña', async ({ page }) => {
  const outSubdir = process.env.PARAMETROS_TABS_SCREENSHOT_DIR?.trim() || 'parametros-tabs';
  const outDir = join(process.cwd(), 'docs', 'codex', 'assets', outSubdir);
  mkdirSync(outDir, { recursive: true });

  await page.goto('/parametros');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: /Parámetros del sistema/i })).toBeVisible({
    timeout: 60_000,
  });

  const tabs = page.locator('nav.folder-tabs button.folder-tab');
  await expect(tabs.first()).toBeAttached({ timeout: 20_000 });

  const tabCount = await tabs.count();
  expect(tabCount).toBeGreaterThan(0);

  for (let i = 0; i < tabCount; i += 1) {
    const tab = tabs.nth(i);
    const labelRaw = (await tab.textContent()) ?? `tab-${i + 1}`;
    const label = labelRaw.trim() || `tab-${i + 1}`;
    const fileSafe = label
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    await tab.click();
    await page.waitForTimeout(250);

    await expect(tab).toHaveClass(/folder-tab--active/, { timeout: 10_000 });
    await expect(page.locator('.parametros-tab-body')).toBeVisible();

    await page.screenshot({
      path: join(outDir, `${String(i + 1).padStart(2, '0')}-${fileSafe}.png`),
      fullPage: true,
    });
  }
});

