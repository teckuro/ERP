import { describe, expect, it } from 'vitest';

import {
  crearGridsParametrosWorkspace,
  etiquetaParametroLegal,
  formatoFactorImpuestoSiiGridParametros,
  formatoMontoGridParametros,
} from './parametros-workspace-grids.presenter';

describe('parametros-workspace-grids.presenter', () => {
  it('crearGridsParametrosWorkspace expone columnas principales', () => {
    const grids = crearGridsParametrosWorkspace(() => '2026-05');
    expect(grids.afpColumns.length).toBeGreaterThan(3);
    expect(grids.tramosCargaColumns.length).toBe(5);
  });

  it('formato y etiquetas', () => {
    expect(formatoMontoGridParametros(1000)).toContain('1');
    expect(formatoFactorImpuestoSiiGridParametros(0.135)).toBe('0,135');
    expect(formatoFactorImpuestoSiiGridParametros(0.135)).not.toContain('%');
    expect(etiquetaParametroLegal('tasa_aporte')).toBe('Tasa Aporte');
  });
});
