import { describe, expect, it } from 'vitest';

import { evaluarAltaCoherencia, AltaCoherenciaInput } from './empleado-alta-coherencia.rules';

const base: AltaCoherenciaInput = {
  relacionLaboral: 'CONTRATO',
  tipoContrato: 'INDEFINIDO',
  tipoJornadaLabel: 'Ordinaria',
  fechaNacimiento: '1990-01-01',
  fechaIngreso: '2026-05-01',
  horasSemanales: 42,
  seguroCesantia: true,
  tipoRegimenPrevisional: 'AFP',
  condiciones: {
    pensionado: false,
    pensionadoInvalidezParcial: false,
    pensionadoInvalidezTotal: false,
    exentoCotizacionPension: false,
    trabajadorAdolescenteProtegido: false,
    autorizacionMenorRegistrada: false,
    tecnicoExtranjeroExento: false,
    discapacidad: false,
    respaldoRegistrado: false,
  },
};

describe('evaluarAltaCoherencia', () => {
  it('detecta seguro cesantia desactivado en contrato indefinido', () => {
    const state = evaluarAltaCoherencia({ ...base, seguroCesantia: false });

    expect(state.issues.some((issue) => issue.id === 'coh.seguro.indefinido-inactivo')).toBe(true);
    expect(state.seguroCesantia.tone).toBe('warning');
  });

  it('detecta jornada ordinaria sobre 42 horas', () => {
    const state = evaluarAltaCoherencia({ ...base, horasSemanales: 45 });

    expect(state.issues.some((issue) => issue.id === 'coh.jornada.ordinaria-sobre-42')).toBe(true);
    expect(state.jornada.tone).toBe('warning');
  });

  it('detecta menor de edad con seguro activo y sin condicion confirmada', () => {
    const state = evaluarAltaCoherencia({
      ...base,
      fechaNacimiento: '2010-01-01',
      fechaIngreso: '2026-05-01',
      horasSemanales: 35,
      seguroCesantia: true,
    });

    expect(state.issues.some((issue) => issue.id === 'coh.seguro.menor-activo')).toBe(true);
    expect(state.issues.some((issue) => issue.id === 'coh.jornada.menor-sobre-30')).toBe(true);
    expect(state.issues.some((issue) => issue.id === 'coh.condiciones.menor-sin-condicion')).toBe(true);
  });

  it('detecta regimen ninguna sin condicion especial', () => {
    const state = evaluarAltaCoherencia({ ...base, tipoRegimenPrevisional: 'NINGUNA' });

    expect(state.issues.some((issue) => issue.id === 'coh.prevision.ninguna-sin-condicion')).toBe(true);
    expect(state.prevision.tone).toBe('warning');
  });

  it('no genera incoherencias dependientes para honorarios limpio', () => {
    const state = evaluarAltaCoherencia({
      ...base,
      relacionLaboral: 'HONORARIOS',
      tipoContrato: null,
      horasSemanales: null,
      seguroCesantia: false,
      tipoRegimenPrevisional: null,
    });

    expect(state.issues).toEqual([]);
    expect(state.seguroCesantia.label).toBe('No aplica');
  });
});
