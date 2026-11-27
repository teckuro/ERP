import { describe, expect, it } from 'vitest';

import {
  fechaUfDelPeriodo,
  formatearCifraParametro,
  formatoPeriodoGridParametros,
} from './parametros-formato';

describe('parametros-formato', () => {
  it('formatea pesos con el estándar del ERP', () => {
    expect(formatearCifraParametro(529000, 'CLP')).toBe('$529.000');
    expect(formatearCifraParametro(41439.89, 'CLP', { min: 2, max: 2 })).toBe('$41.439,89');
  });

  it('formatea UF y porcentajes con decimales variables y coma decimal', () => {
    expect(formatearCifraParametro(87.8, 'UF')).toBe('87,8');
    expect(formatearCifraParametro(0.6, '%')).toBe('0,6');
    expect(formatearCifraParametro(7, '%')).toBe('7');
    expect(formatearCifraParametro('1.54', '%')).toBe('1,54');
  });

  it('devuelve null si no hay valor numérico', () => {
    expect(formatearCifraParametro(null, 'CLP')).toBeNull();
    expect(formatearCifraParametro('', 'UF')).toBeNull();
    expect(formatearCifraParametro('abc', '%')).toBeNull();
  });

  it('muestra el período de las grillas como mes y año', () => {
    expect(formatoPeriodoGridParametros('2026-11')).toBe('nov 2026');
    expect(formatoPeriodoGridParametros(null)).toBe('—');
  });

  it('la UF del período corresponde al último día del mes', () => {
    expect(fechaUfDelPeriodo('2026-11')).toBe('30 nov 2026');
    expect(fechaUfDelPeriodo('2026-12')).toBe('31 dic 2026');
    expect(fechaUfDelPeriodo('2028-02')).toBe('29 feb 2028');
    expect(fechaUfDelPeriodo('2026-02')).toBe('28 feb 2026');
  });

  it('no inventa fecha de UF para períodos inválidos', () => {
    expect(fechaUfDelPeriodo(null)).toBeNull();
    expect(fechaUfDelPeriodo('2026-13')).toBeNull();
    expect(fechaUfDelPeriodo('nov-2026')).toBeNull();
  });
});
