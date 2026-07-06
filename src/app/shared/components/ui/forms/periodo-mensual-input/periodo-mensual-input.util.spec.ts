import { describe, expect, it } from 'vitest';

import {
  anioInicialPanel,
  buildAniosPanelLista,
  buildPeriodoMensualGrupos,
  buildPeriodoMensualPanelMeses,
  buildPeriodoYearOptions,
  etiquetaPeriodoMensualInput,
  filtrarAniosDisponibles,
  limitesAnioPanel,
  mergePeriodoYm,
  normalizePeriodoYm,
  periodoYmActual,
  periodoYmDentroDeRango,
  splitPeriodoYm,
} from './periodo-mensual-input.util';

describe('periodo-mensual-input.util', () => {
  it('normalizePeriodoYm acepta solo AAAA-MM válido', () => {
    expect(normalizePeriodoYm('2026-07')).toBe('2026-07');
    expect(normalizePeriodoYm('2026/07')).toBe('');
    expect(normalizePeriodoYm('2026-13')).toBe('');
  });

  it('mergePeriodoYm y splitPeriodoYm son inversos', () => {
    expect(mergePeriodoYm('2026', '7')).toBe('2026-07');
    expect(splitPeriodoYm('2026-07')).toEqual({ anio: '2026', mes: '07' });
  });

  it('etiquetaPeriodoMensualInput usa copy RRHH localizado', () => {
    expect(etiquetaPeriodoMensualInput('2026-07')).toMatch(/Julio 2026/);
  });

  it('buildPeriodoMensualGrupos agrupa meses por año en un solo selector', () => {
    const grupos = buildPeriodoMensualGrupos('2026-07', '', '', new Date('2026-07-01'));
    expect(grupos.length).toBeGreaterThan(0);
    const grupo2026 = grupos.find((g) => g.anio === '2026');
    expect(grupo2026?.meses.some((m) => m.value === '2026-07' && m.label === 'Julio')).toBe(true);
  });

  it('buildPeriodoYearOptions incluye año seleccionado y respeta mínimo', () => {
    const years = buildPeriodoYearOptions('2018-05', '2020-01', '', new Date('2026-07-01'));
    expect(years).toContain(2018);
    expect(years).toContain(2020);
    expect(Math.min(...years)).toBeLessThanOrEqual(2018);
  });

  it('periodoYmDentroDeRango valida límites', () => {
    expect(periodoYmDentroDeRango('2026-06', '2026-01', '2026-12')).toBe(true);
    expect(periodoYmDentroDeRango('2025-12', '2026-01', '2026-12')).toBe(false);
  });

  it('buildPeriodoMensualPanelMeses devuelve 12 celdas en orden calendario', () => {
    const meses = buildPeriodoMensualPanelMeses(2026);
    expect(meses).toHaveLength(12);
    expect(meses[0]).toMatchObject({ value: '2026-01', labelCorto: 'ENER', habilitado: true });
    expect(meses[11]).toMatchObject({ value: '2026-12', labelCorto: 'DIC', habilitado: true });
  });

  it('buildPeriodoMensualPanelMeses deshabilita meses fuera de rango', () => {
    const meses = buildPeriodoMensualPanelMeses(2026, '2026-03', '2026-09');
    expect(meses[0]?.habilitado).toBe(false);
    expect(meses[2]?.habilitado).toBe(true);
    expect(meses[8]?.habilitado).toBe(true);
    expect(meses[10]?.habilitado).toBe(false);
  });

  it('buildAniosPanelLista y filtrarAniosDisponibles soportan búsqueda de año', () => {
    const anios = buildAniosPanelLista('2026-07', '2020-01', '2026-12', new Date('2026-07-01'));
    expect(anios).toContain(2026);
    expect(anios).toContain(2020);
    expect(filtrarAniosDisponibles(anios, '2024')).toEqual([2024]);
    expect(filtrarAniosDisponibles(anios, '')).toEqual(anios);
  });

  it('anioInicialPanel y limitesAnioPanel respetan selección y rango', () => {
    expect(anioInicialPanel('2019-04', '2020-01', '', new Date('2026-07-01'))).toBe(2019);
    expect(limitesAnioPanel('2026-07', '2020-01', '2026-12', new Date('2026-07-01'))).toEqual({
      min: 2020,
      max: 2026,
    });
  });

  it('periodoYmActual devuelve mes calendario', () => {
    expect(periodoYmActual(new Date('2026-07-15'))).toBe('2026-07');
  });
});
