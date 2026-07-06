import { describe, expect, it } from 'vitest';

import { resolveShellRouteBreadcrumbs } from './shell-route-context.config';

describe('shell-route-context.config', () => {
  it('resuelve rutas principales del sidebar', () => {
    expect(resolveShellRouteBreadcrumbs('/empleados').map((b) => b.label)).toEqual(['Empleados']);
    expect(resolveShellRouteBreadcrumbs('/remuneraciones/novedades-mensuales').map((b) => b.label)).toEqual([
      'Remuneraciones',
      'Movimientos',
    ]);
    expect(resolveShellRouteBreadcrumbs('/parametros').map((b) => b.label)).toEqual(['Parámetros']);
  });

  it('resuelve ficha empleado con segmento dinámico', () => {
    const crumbs = resolveShellRouteBreadcrumbs('/empleados/42');
    expect(crumbs[0].path).toBe('/empleados');
    expect(crumbs[1].label).toBe('Ficha empleado');
  });
});
