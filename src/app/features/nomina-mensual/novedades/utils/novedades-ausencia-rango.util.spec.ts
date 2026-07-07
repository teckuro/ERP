import { describe, expect, it } from 'vitest';

import {
  calcularDiasAusenciaEnPeriodo,
  calcularDiasInclusiveSql,
  fechaHastaDesdeCantidad,
  formatearRangoFechasUi,
  rangoFechasValido,
} from './novedades-ausencia-rango.util';

describe('novedades-ausencia-rango.util', () => {
  it('calcula dias inclusivos entre fechas', () => {
    expect(calcularDiasInclusiveSql('2026-05-03', '2026-05-07')).toBe(5);
    expect(calcularDiasInclusiveSql('2026-05-07', '2026-05-03')).toBeNull();
  });

  it('recorta rango al mes del periodo activo', () => {
    expect(calcularDiasAusenciaEnPeriodo('2026-04-28', '2026-05-05', '2026-05')).toBe(5);
    expect(calcularDiasAusenciaEnPeriodo('2026-06-01', '2026-06-10', '2026-05')).toBe(0);
  });

  it('deriva fecha hasta desde cantidad', () => {
    expect(fechaHastaDesdeCantidad('2026-05-03', 5)).toBe('2026-05-07');
  });

  it('valida rango coherente', () => {
    expect(rangoFechasValido('2026-05-01', '2026-05-05')).toBe(true);
    expect(rangoFechasValido('2026-05-05', '2026-05-01')).toBe(false);
  });

  it('formatea rango para UI', () => {
    expect(formatearRangoFechasUi('2026-05-03', '2026-05-07')).toBe('03/05/2026 – 07/05/2026');
  });
});
