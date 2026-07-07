import { describe, expect, it } from 'vitest';

import {
  avisoFormularioPendienteUi,
  formularioMasivoListo,
  formularioMensualIndividualListo,
  pendientesFormularioMasivo,
  pendientesFormularioMasivoCompleto,
  pendientesFormularioMensualIndividual,
  resumenFormularioMasivo,
  resumenFormularioMensualIndividual,
} from './novedades-formulario-mensual.presenter';

describe('novedades-formulario-mensual.presenter', () => {
  const formBase = {
    idPersona: 10,
    idConcepto: 20,
    monto: 80000,
    moneda: 'CLP',
    tipoMovimiento: 'haber' as const,
    categoria: 'haber_variable' as const,
    origen: 'manual' as const,
    fechaEvento: '2026-07-01',
  };

  it('detecta pendientes individual con trabajador requerido', () => {
    expect(
      pendientesFormularioMensualIndividual({ idPersona: null, idConcepto: null, monto: null }, true),
    ).toEqual(['Trabajador', 'Concepto', 'Monto']);
    expect(formularioMensualIndividualListo(formBase, true)).toBe(true);
    expect(formularioMensualIndividualListo({ ...formBase, idPersona: null }, false)).toBe(true);
  });

  it('resume individual listo sin chips en pie', () => {
    const listo = resumenFormularioMensualIndividual(formBase, {
      requiereTrabajador: false,
      trabajadorEtiqueta: 'Ana Pérez',
      periodoEtiqueta: 'Julio 2026',
      tipoEtiqueta: 'Haber',
      conceptoEtiqueta: 'Bono',
      montoFormateado: 'CLP 80.000',
      ocultarPeriodoEnResumen: true,
      tieneContextoTrabajador: true,
    });
    expect(listo.principal).toBe('Haber de CLP 80.000 para Ana Pérez.');
    expect(listo.pendientes).toEqual([]);
    expect(listo.mostrarPeriodo).toBe(false);

    const pendiente = resumenFormularioMensualIndividual(
      { ...formBase, idConcepto: null, monto: null },
      {
        requiereTrabajador: false,
        trabajadorEtiqueta: 'Ana Pérez',
        periodoEtiqueta: 'Julio 2026',
        tipoEtiqueta: 'Haber',
        conceptoEtiqueta: '',
        montoFormateado: '',
        tieneContextoTrabajador: true,
      },
    );
    expect(pendiente.pendientes).toEqual(['Concepto', 'Monto']);
    expect(pendiente.principal).toBe('');
  });

  it('resume masivo singular y plural', () => {
    expect(pendientesFormularioMasivo({ idConcepto: null, monto: 1 })).toEqual(['Concepto']);
    expect(formularioMasivoListo(formBase, 2)).toBe(true);
    expect(formularioMasivoListo(formBase, 0)).toBe(false);

    const resumen = resumenFormularioMasivo(formBase, {
      cantidadTrabajadores: 2,
      periodoEtiqueta: 'Julio 2026',
      tipoEtiqueta: 'Haber',
      conceptoEtiqueta: 'Bono',
      montoFormateado: 'CLP 80.000',
    });
    expect(resumen.principal).toBe('Haber de CLP 80.000 para 2 trabajadores.');
    expect(resumen.mostrarPeriodo).toBe(false);
  });

  it('arma aviso de pendientes para MessageBox al guardar', () => {
    expect(avisoFormularioPendienteUi(['Concepto', 'Monto'])).toEqual({
      titulo: 'Faltan datos obligatorios',
      mensaje: 'Complete 2 campos antes de guardar.',
      secciones: [{ title: 'Pendiente', items: ['Concepto', 'Monto'], tone: 'attention' }],
    });
    expect(pendientesFormularioMasivoCompleto({ idConcepto: 1, monto: 1 }, 0)).toEqual([
      'Trabajadores seleccionados',
    ]);
  });
});
