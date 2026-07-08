import { describe, expect, it } from 'vitest';

import {
  construirResumenOperativo,
  contarMovimientosRevision,
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
});
