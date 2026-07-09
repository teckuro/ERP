import { describe, expect, it } from 'vitest';

import {
  construirIndicadoresEconomicos,
  construirResumenOperativo,
  contarMovimientosRevision,
  formatearValorEconomico,
} from './resumen-operativo.rules';

describe('resumen-operativo.rules', () => {
  it('prioriza licencias en la acción recomendada', () => {
    const snapshot = construirResumenOperativo({
      periodoYm: '2026-04',
      nominas: [],
      empleados: [],
      licenciasPendientes: [{ idLicencia: 1 } as never],
      novedades: [],
    });
    expect(snapshot.accionRecomendada.ruta).toBe('/licencias-medicas');
    expect(snapshot.atencion.some((item) => item.id === 'licencias')).toBe(true);
  });

  it('cuenta movimientos en pendiente_revision', () => {
    expect(
      contarMovimientosRevision([
        { estado: 'pendiente_revision' } as never,
        { estado: 'aprobada' } as never,
      ]),
    ).toBe(1);
  });

  it('usa administrador de nóminas como fallback', () => {
    const snapshot = construirResumenOperativo({
      periodoYm: '2026-04',
      nominas: [],
      empleados: [],
      licenciasPendientes: [],
      novedades: [],
    });
    expect(snapshot.accionRecomendada.ruta).toBe('/remuneraciones/nominas');
  });

  it('expone UF, UTM, UTA, sueldo mínimo y dólar pendiente', () => {
    const economicos = construirIndicadoresEconomicos({
      uf: 39123.45,
      utm: 68000,
      uta: 816000,
      sueldoMinimo: 529000,
      dolarObservado: null,
    });
    expect(economicos.map((item) => item.id)).toEqual([
      'uf',
      'utm',
      'uta',
      'sueldo-minimo',
      'dolar',
    ]);
    expect(economicos.find((item) => item.id === 'uf')?.disponible).toBe(true);
    expect(economicos.find((item) => item.id === 'dolar')?.disponible).toBe(false);
    expect(formatearValorEconomico(39123.45, 'clp')).toContain('39.123');
  });

  it('alerta cuando faltan indicadores económicos del período', () => {
    const snapshot = construirResumenOperativo({
      periodoYm: '2026-04',
      nominas: [],
      empleados: [],
      licenciasPendientes: [],
      novedades: [],
      parametros: {
        uf: null,
        utm: 68000,
        uta: null,
        sueldoMinimo: 529000,
      },
    });
    expect(snapshot.atencion.some((item) => item.id === 'parametros-economicos')).toBe(true);
  });
});
