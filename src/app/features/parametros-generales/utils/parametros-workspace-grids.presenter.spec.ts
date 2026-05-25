import { describe, expect, it } from 'vitest';

import {
  crearGridsParametrosWorkspace,
  etiquetaParametroLegal,
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
    expect(etiquetaParametroLegal('tasa_aporte')).toBe('Tasa Aporte');
  });
});
