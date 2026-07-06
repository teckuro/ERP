import { describe, expect, it } from 'vitest';

import { validarAlcanceMotorPiloto } from './nomina-motor-01-acotado.rules';

describe('nomina-motor-01-acotado.rules', () => {
  it('acepta corridas dentro del límite piloto', () => {
    expect(validarAlcanceMotorPiloto([1, 2, 3], 10)).toEqual({ ok: true });
  });

  it('rechaza corridas que exceden el límite', () => {
    const ids = Array.from({ length: 11 }, (_, i) => i + 1);
    const result = validarAlcanceMotorPiloto(ids, 10);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.mensaje).toContain('10');
    }
  });
});
