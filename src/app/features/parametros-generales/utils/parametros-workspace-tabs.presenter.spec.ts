import { describe, expect, it } from 'vitest';

import {
  TABS_PARAMETROS_WORKSPACE,
  detalleRegistroTabActivo,
  etiquetaTabParametros,
  formatearPeriodoMesAnio,
  tituloRegistroTabActivo,
} from './parametros-workspace-tabs.presenter';

describe('parametros-workspace-tabs.presenter', () => {
  it('TABS_PARAMETROS_WORKSPACE incluye cliente', () => {
    expect(TABS_PARAMETROS_WORKSPACE.some((t) => t.id === 'configCliente')).toBe(true);
  });

  it('etiquetas de tab y periodo', () => {
    expect(etiquetaTabParametros('valores')).toBe('Valores');
    expect(tituloRegistroTabActivo('prevision')).toContain('AFP');
    expect(
      detalleRegistroTabActivo('valores', {
        periodoLabel: 'Mayo 2026',
        tieneConfigCliente: false,
        tieneDatosOficiales: true,
        conteoCcafMutual: 0,
        conteoTramosCarga: 0,
        conteoImpuesto: 0,
        conteoSalud: 0,
        conteoPrevision: 0,
        conteoReforma: 0,
      }),
    ).toContain('UF');
    expect(formatearPeriodoMesAnio('2026-05')).toContain('2026');
  });
});
