import { describe, expect, it } from 'vitest';

import { routes } from './app.routes';

function findRedirect(path: string, parent: typeof routes = routes): { redirectTo: string } | null {
  for (const route of parent) {
    if (route.path === path && route.redirectTo) {
      return { redirectTo: String(route.redirectTo) };
    }
    if (route.children) {
      const nested = findRedirect(path, route.children);
      if (nested) return nested;
    }
  }
  return null;
}

describe('app.routes legacy redirects', () => {
  it('redirige proceso-mensual al administrador de nóminas', () => {
    const redirect = findRedirect('proceso-mensual');
    expect(redirect?.redirectTo).toBe('nominas');
  });

  it('redirige nomina-mensual-v2 al administrador de nóminas', () => {
    const redirect = findRedirect('nomina-mensual-v2');
    expect(redirect?.redirectTo).toBe('nominas');
  });
});
