import { describe, expect, it } from 'vitest';

import { evaluarAltaCoherencia, EntradaCoherenciaAlta } from './empleado-alta-coherencia.rules';

const base: EntradaCoherenciaAlta = {
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
    const estado = evaluarAltaCoherencia({ ...base, seguroCesantia: false });

    expect(estado.inconsistencias.some((issue) => issue.id === 'coh.seguro.indefinido-inactivo')).toBe(true);
    expect(estado.seguroCesantia.tone).toBe('warning');
  });

  it('detecta jornada ordinaria sobre 42 horas', () => {
    const estado = evaluarAltaCoherencia({ ...base, horasSemanales: 45 });

    expect(estado.inconsistencias.some((issue) => issue.id === 'coh.jornada.ordinaria-sobre-42')).toBe(true);
    expect(estado.jornada.tone).toBe('warning');
  });

  it('detecta menor de edad con seguro activo y sin condicion confirmada', () => {
    const estado = evaluarAltaCoherencia({
      ...base,
      fechaNacimiento: '2010-01-01',
      fechaIngreso: '2026-05-01',
      horasSemanales: 35,
      seguroCesantia: true,
    });

    expect(estado.inconsistencias.some((issue) => issue.id === 'coh.seguro.menor-activo')).toBe(true);
    expect(estado.inconsistencias.some((issue) => issue.id === 'coh.jornada.menor-sobre-30')).toBe(true);
    expect(estado.inconsistencias.some((issue) => issue.id === 'coh.condiciones.menor-sin-condicion')).toBe(true);
  });

  it('detecta regimen ninguna sin condicion especial', () => {
    const estado = evaluarAltaCoherencia({ ...base, tipoRegimenPrevisional: 'NINGUNA' });

    expect(estado.inconsistencias.some((issue) => issue.id === 'coh.prevision.ninguna-sin-condicion')).toBe(true);
    expect(estado.prevision.tone).toBe('warning');
  });

  it('detecta plazo fijo sin fecha de término', () => {
    const estado = evaluarAltaCoherencia({
      ...base,
      tipoContrato: 'PLAZO_FIJO',
      fechaTermino: '',
      seguroCesantia: false,
    });

    expect(estado.inconsistencias.some((i) => i.id === 'coh.contrato.plazo-sin-termino')).toBe(true);
  });

  it('detecta honorarios con seguro activo', () => {
    const estado = evaluarAltaCoherencia({
      ...base,
      relacionLaboral: 'HONORARIOS',
      tipoContrato: null,
      horasSemanales: null,
      seguroCesantia: true,
      tipoRegimenPrevisional: null,
    });

    expect(estado.inconsistencias.some((i) => i.id === 'coh.seguro.honorarios-activo')).toBe(true);
  });

  it('detecta parcial con 35 horas sobre 30', () => {
    const estado = evaluarAltaCoherencia({
      ...base,
      tipoJornadaLabel: 'Jornada parcial',
      jornadaParcial: true,
      horasSemanales: 35,
    });

    expect(estado.inconsistencias.some((i) => i.id === 'coh.jornada.parcial-sobre-30')).toBe(true);
  });

  it('detecta técnico extranjero con cesantía off', () => {
    const estado = evaluarAltaCoherencia({
      ...base,
      seguroCesantia: false,
      condiciones: { ...base.condiciones, tecnicoExtranjeroExento: true },
    });

    expect(estado.inconsistencias.some((i) => i.id === 'coh.seguro.tecnico-extranjero-inactivo')).toBe(true);
  });

  it('no genera incoherencias dependientes para honorarios limpio', () => {
    const estado = evaluarAltaCoherencia({
      ...base,
      relacionLaboral: 'HONORARIOS',
      tipoContrato: null,
      horasSemanales: null,
      seguroCesantia: false,
      tipoRegimenPrevisional: null,
    });

    expect(estado.inconsistencias).toEqual([]);
    expect(estado.seguroCesantia.label).toBe('No aplica');
  });
});
