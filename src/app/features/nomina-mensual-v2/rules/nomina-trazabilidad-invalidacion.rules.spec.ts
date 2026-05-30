import {
  debeInvalidarPorCambioAlcance,
  debeInvalidarPorRevalidacionParametros,
  pasosPosterioresA,
} from './nomina-trazabilidad-invalidacion.rules';

describe('nomina-trazabilidad-invalidacion.rules', () => {
  it('lista pasos posteriores a parameters', () => {
    expect(pasosPosterioresA('parameters')).toContain('scope');
    expect(pasosPosterioresA('parameters')).toContain('approval');
  });

  it('invalida cuando hay alcance confirmado y se revalidan parámetros', () => {
    expect(debeInvalidarPorRevalidacionParametros(true, false)).toBe(true);
    expect(debeInvalidarPorRevalidacionParametros(false, false)).toBe(false);
  });

  it('invalida empleados si cambia alcance con empleados validados', () => {
    expect(debeInvalidarPorCambioAlcance(true)).toBe(true);
    expect(debeInvalidarPorCambioAlcance(false)).toBe(false);
  });
});
