import { toFingerprintPublico } from './nomina-trazabilidad-fingerprint.util';

describe('toFingerprintPublico', () => {
  it('formatea hash fnv1a32 como huella corta', () => {
    expect(toFingerprintPublico('fnv1a32:abcd1234')).toBe('ABCD-1234');
  });

  it('retorna undefined para valores vacíos', () => {
    expect(toFingerprintPublico(null)).toBeUndefined();
    expect(toFingerprintPublico('')).toBeUndefined();
  });

  it('retorna undefined si no hay suficientes caracteres hex', () => {
    expect(toFingerprintPublico('abc')).toBeUndefined();
  });
});
