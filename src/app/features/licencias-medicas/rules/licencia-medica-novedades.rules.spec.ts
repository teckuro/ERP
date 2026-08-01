import { describe, expect, it } from 'vitest';

import {
  calcularDiasLicenciaInclusive,
  codigoMotivoDesdeTipoLicencia,
  licenciaMedicaEsBorradorVacio,
  licenciaMedicaEstadoEsFinal,
  licenciaMedicaListaParaVincular,
  licenciaMedicaRequiereAtencion,
  pendientesRevisionLicencia,
  planificarNovedadesLicencia,
  periodosIntersectadosLicencia,
} from './licencia-medica-novedades.rules';

describe('licencia-medica-novedades.rules', () => {
  it('intersecta meses en licencia multi-mes', () => {
    expect(periodosIntersectadosLicencia('2026-03-28', '2026-04-05')).toEqual(['2026-03', '2026-04']);
  });

  it('mapea tipo accidente a motivo LICENCIA_ACCIDENTE', () => {
    expect(codigoMotivoDesdeTipoLicencia('accidente')).toBe('LICENCIA_ACCIDENTE');
    expect(codigoMotivoDesdeTipoLicencia('comun')).toBe('LICENCIA_MEDICA');
  });

  it('planifica una novedad por mes con días recortados', () => {
    const plan = planificarNovedadesLicencia({
      fechaInicio: '2026-03-28',
      fechaTermino: '2026-04-05',
      tipo: 'comun',
      folio: 'LM-2026-001',
    });
    expect(plan).toHaveLength(2);
    expect(plan[0]?.periodo).toBe('2026-03');
    expect(plan[0]?.cantidad).toBe(4);
    expect(plan[1]?.periodo).toBe('2026-04');
    expect(plan[1]?.cantidad).toBe(5);
  });

  it('calcula días inclusivos del rango', () => {
    expect(calcularDiasLicenciaInclusive('2026-04-01', '2026-04-07')).toBe(7);
  });

  it('identifica estados finales y requisitos de vinculación', () => {
    expect(licenciaMedicaEstadoEsFinal('vinculada_nomina')).toBe(true);
    expect(licenciaMedicaEstadoEsFinal('pendiente_revision')).toBe(false);
    expect(
      licenciaMedicaListaParaVincular({
        idPersona: 1,
        folio: 'LM-1',
        fechaInicio: '2026-04-01',
        fechaTermino: '2026-04-07',
        dias: 7,
      }),
    ).toBe(true);
    expect(
      licenciaMedicaListaParaVincular({
        idPersona: null,
        folio: 'LM-1',
        fechaInicio: '2026-04-01',
        fechaTermino: '2026-04-07',
        dias: 7,
      }),
    ).toBe(false);
  });

  it('no alerta borradores manuales vacíos; sí correo o con datos', () => {
    expect(
      licenciaMedicaEsBorradorVacio({
        origen: 'manual',
        folio: null,
        idPersona: null,
        fechaInicio: null,
        fechaTermino: null,
      }),
    ).toBe(true);
    expect(
      licenciaMedicaRequiereAtencion({
        estado: 'pendiente_revision',
        origen: 'manual',
        folio: null,
        idPersona: null,
      }),
    ).toBe(false);
    expect(
      licenciaMedicaRequiereAtencion({
        estado: 'pendiente_revision',
        origen: 'correo',
        folio: null,
        idPersona: null,
      }),
    ).toBe(true);
    expect(
      licenciaMedicaRequiereAtencion({
        estado: 'pendiente_revision',
        origen: 'manual',
        folio: 'LM-9',
        idPersona: null,
      }),
    ).toBe(true);
  });

  it('lista pendientes legibles para el drawer', () => {
    expect(
      pendientesRevisionLicencia({
        idPersona: null,
        folio: '',
        tipo: 'comun',
        fechaInicio: '',
        fechaTermino: '',
        dias: null,
      }),
    ).toEqual(['Trabajador', 'Folio de la licencia', 'Inicio de vigencia', 'Término de vigencia', 'Días de reposo']);
  });
});
