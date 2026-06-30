import { describe, expect, it } from 'vitest';

import {
  buildNominaParametrosContext,
  evaluarAdvertenciasRangoParametros,
  identidadMensualEsperada,
  resolverPeriodoConsultaParametros,
} from './nomina-parametros-rango.rules';

describe('nomina-parametros-rango.rules', () => {
  const base = buildNominaParametrosContext({
    id: 'np-1',
    periodo: '2026-06',
    fechaInicio: '2026-06-01',
    fechaFin: '2026-06-30',
    empresaId: '1',
    tipo: 'mensual',
  });

  it('resuelve periodo de consulta desde contexto de nómina', () => {
    expect(resolverPeriodoConsultaParametros(base)).toBe('2026-06');
  });

  it('no advierte en mensual de mes completo', () => {
    expect(evaluarAdvertenciasRangoParametros(base)).toEqual([]);
  });

  it('advierte rango parcial en mensual', () => {
    const parcial = {
      ...base,
      fechaInicio: '2026-06-15',
      fechaFin: '2026-06-30',
    };
    const adv = evaluarAdvertenciasRangoParametros(parcial);
    expect(adv.some((a) => a.id === 'rango_parcial_mensual')).toBe(true);
  });

  it('advierte cruce de meses', () => {
    const cruce = {
      ...base,
      fechaInicio: '2026-05-28',
      fechaFin: '2026-06-05',
    };
    expect(evaluarAdvertenciasRangoParametros(cruce).some((a) => a.id === 'rango_cruza_meses')).toBe(true);
  });

  it('bloquea rango invertido', () => {
    const invertido = { ...base, fechaInicio: '2026-06-20', fechaFin: '2026-06-01' };
    expect(evaluarAdvertenciasRangoParametros(invertido).some((a) => a.severidad === 'bloqueo')).toBe(true);
  });

  it('identidad mensual esperada para febrero bisiesto', () => {
    expect(identidadMensualEsperada('2028-02')).toEqual({
      fechaInicio: '2028-02-01',
      fechaFin: '2028-02-29',
    });
  });
});
