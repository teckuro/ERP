import { describe, expect, it } from 'vitest';

import type { NominaLiquidacionResumen } from '../models/nomina-consolidacion.models';
import {
  clasificarLiquidacionInterna,
  formatearFechaLiquidacion,
  liquidacionVigente,
  prepararFilasLiquidacionesInternas,
} from './nomina-liquidaciones-internas.presenter';

function liq(parcial: Partial<NominaLiquidacionResumen> = {}): NominaLiquidacionResumen {
  return {
    idLiquidacionPeriodo: 1,
    nominaPeriodoId: 'nom-1',
    periodo: '2026-06',
    version: 1,
    estado: 'generada',
    activo: true,
    idLiquidacionReemplazada: null,
    fechaGeneracion: '2026-06-15T10:00:00Z',
    totalTrabajadores: 5,
    totalHaberes: 100,
    totalDescuentos: 10,
    totalLiquido: 90,
    createdAt: '2026-06-15T10:00:00Z',
    ...parcial,
  };
}

describe('nomina-liquidaciones-internas.presenter', () => {
  it('marca la versión más alta activa como vigente en nómina abierta', () => {
    const filas = prepararFilasLiquidacionesInternas(
      [liq({ version: 1, activo: false }), liq({ idLiquidacionPeriodo: 2, version: 2, activo: true })],
      'liquidada',
    );
    expect(filas[0]?.clasificacion).toBe('vigente');
    expect(filas[1]?.clasificacion).toBe('superada');
    expect(liquidacionVigente(filas)?.version).toBe(2);
  });

  it('congela todas las versiones cuando la nómina está cerrada', () => {
    const filas = prepararFilasLiquidacionesInternas([liq()], 'cerrada');
    expect(filas.every((fila) => fila.clasificacion === 'congelada')).toBe(true);
  });

  it('clasifica superada cuando no es la versión máxima activa', () => {
    expect(
      clasificarLiquidacionInterna(liq({ version: 1 }), { nominaCerrada: false, versionMaxima: 2 }),
    ).toBe('superada');
  });

  it('formatea fecha de generación', () => {
    const texto = formatearFechaLiquidacion('2026-06-15T10:30:00Z');
    expect(texto).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/);
  });
});
