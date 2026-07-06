import { describe, expect, it } from 'vitest';

import {
  AREAS_PARAMETROS_WORKSPACE,
  TABS_PARAMETROS_WORKSPACE,
  areaDeTabParametros,
  detalleRegistroTabActivo,
  etiquetaTabParametros,
  formatearPeriodoMesAnio,
  primerTabDeAreaParametros,
  tabsDeAreaParametros,
  tituloRegistroTabActivo,
} from './parametros-workspace-tabs.presenter';

describe('parametros-workspace-tabs.presenter', () => {
  it('TABS_PARAMETROS_WORKSPACE incluye cliente', () => {
    expect(TABS_PARAMETROS_WORKSPACE.some((t) => t.id === 'configCliente')).toBe(true);
  });

  it('area inicial es Cierre del periodo y agrupa secciones actuales', () => {
    expect(AREAS_PARAMETROS_WORKSPACE[0]?.id).toBe('cierrePeriodo');
    expect(tabsDeAreaParametros('datosOficiales').map((tab) => tab.id)).toEqual([
      'valores',
      'remuneraciones',
      'tramosCarga',
      'impuestoUnico',
    ]);
    expect(tabsDeAreaParametros('catalogosVigencias').map((tab) => tab.id)).toEqual([
      'salud',
      'prevision',
      'ccafMutual',
    ]);
    expect(tabsDeAreaParametros('observacionNormativa').map((tab) => tab.id)).toEqual(['reforma']);
    expect(primerTabDeAreaParametros('configuracionCliente')).toBe('configCliente');
    expect(areaDeTabParametros('ccafMutual')).toBe('catalogosVigencias');
    expect(areaDeTabParametros('reforma')).toBe('observacionNormativa');
  });

  it('labels visibles no exponen nombres tecnicos', () => {
    const labels = [
      ...AREAS_PARAMETROS_WORKSPACE.map((area) => area.label),
      ...TABS_PARAMETROS_WORKSPACE.map((tab) => etiquetaTabParametros(tab.id)),
    ];

    expect(labels).not.toContain('configCliente');
    expect(labels).not.toContain('ccafMutual');
    expect(labels).not.toContain('impuestoUnico');
    expect(labels).not.toContain('APV inst.');
    expect(labels).not.toContain('APV pago');
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
