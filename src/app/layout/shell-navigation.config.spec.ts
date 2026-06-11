import { describe, expect, it } from 'vitest';

import { SHELL_NAV_SECTIONS } from './shell-navigation.config';

describe('shell-navigation.config', () => {
  it('define grupos Principal y Gestión con rutas reales', () => {
    const principal = SHELL_NAV_SECTIONS.find((s) => s.label === 'Principal');
    const gestion = SHELL_NAV_SECTIONS.find((s) => s.label === 'Gestión');
    expect(principal?.items.map((i) => i.path)).toEqual([
      '/',
      '/empleados',
      '/remuneraciones/nominas',
      '/remuneraciones/liquidaciones',
      '/parametros',
    ]);
    expect(gestion?.items.map((i) => i.path)).toContain('/remuneraciones/novedades-mensuales');
    expect(gestion?.items.map((i) => i.path)).toContain('/remuneraciones/haberes-descuentos');
  });

  it('no duplica Trabajadores como item global', () => {
    const labels = SHELL_NAV_SECTIONS.flatMap((s) => s.items.map((i) => i.label));
    expect(labels.filter((l) => l === 'Trabajadores')).toHaveLength(0);
    expect(labels).toContain('Empleados');
  });

  it('no muestra chip de periodo en el Administrador de nóminas', () => {
    const administrador = SHELL_NAV_SECTIONS
      .flatMap((seccion) => seccion.items)
      .find((item) => item.path === '/remuneraciones/nominas');

    expect(administrador?.badgeKey).toBeUndefined();
  });
});
