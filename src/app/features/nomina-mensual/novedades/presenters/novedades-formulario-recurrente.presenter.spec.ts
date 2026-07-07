import { describe, expect, it } from 'vitest';

import {
  etiquetaPeriodicidadHd,
  formatearRangoVigenciaRecurrente,
  formatearValorRecurrente,
  pendientesFormularioRecurrenteIndividual,
  resumenFormularioRecurrenteIndividual,
} from './novedades-formulario-recurrente.presenter';

describe('novedades-formulario-recurrente.presenter', () => {
  it('formatea valor fijo y porcentaje', () => {
    expect(formatearValorRecurrente('FIJO', 120000, 0)).toBe('CLP 120.000');
    expect(formatearValorRecurrente('PORCENTAJE', 0, 7.5)).toBe('7.5%');
  });

  it('detecta pendientes obligatorios', () => {
    expect(
      pendientesFormularioRecurrenteIndividual({
        idConcepto: null,
        tipoValor: 'FIJO',
        monto: 0,
        porcentaje: 0,
        vigenciaInicio: '',
        vigenciaFin: '',
        periodicidad: 'MENSUAL',
      }),
    ).toEqual(['Concepto', 'Monto', 'Desde']);
  });

  it('resume recurrente listo con rango y periodicidad', () => {
    const resumen = resumenFormularioRecurrenteIndividual(
      {
        idConcepto: 20,
        idContrato: null,
        tipoValor: 'FIJO',
        periodicidad: 'MENSUAL',
        monto: 50000,
        porcentaje: 0,
        vigenciaInicio: '2026-05-01',
        vigenciaFin: '2026-12-31',
        observacion: '',
      },
      {
        trabajadorEtiqueta: 'Ana Pérez',
        conceptoEtiqueta: 'Bono (BON01)',
        periodoEtiqueta: 'Mayo 2026',
        ocultarPeriodoEnResumen: true,
        tieneContextoTrabajador: true,
      },
    );

    expect(resumen.principal).toContain('Ana Pérez');
    expect(resumen.principal).toContain('CLP 50.000');
    expect(resumen.principal).toContain('01/05/2026');
    expect(resumen.mostrarPeriodo).toBe(false);
    expect(resumen.pendientes).toEqual([]);
  });

  it('expone etiquetas de periodicidad en español', () => {
    expect(etiquetaPeriodicidadHd('MENSUAL')).toBe('Mensual');
    expect(formatearRangoVigenciaRecurrente('2026-05-01', '')).toBe('desde 01/05/2026');
  });
});
