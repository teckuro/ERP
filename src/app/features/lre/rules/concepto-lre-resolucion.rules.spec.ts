import { resolverCodigoLreLinea } from './concepto-lre-resolucion.rules';

describe('concepto-lre-resolucion.rules', () => {
  it('prioriza codigoLre del catálogo BD', () => {
    expect(
      resolverCodigoLreLinea({ codigoLre: '2111', codigo: 'BONO', codigoMotor: 'BONO' }),
    ).toBe('2111');
  });

  it('usa codigo_motor antes que codigo interno', () => {
    expect(
      resolverCodigoLreLinea({ codigo: 'IMPUESTO_RENTA', codigoMotor: 'IMPUESTO_UNICO' }),
    ).toBe('3161');
  });

  it('resuelve por codigo cuando no hay catálogo ni motor', () => {
    expect(resolverCodigoLreLinea({ codigo: 'SUELDO_BASE' })).toBe('2101');
  });

  it('devuelve null para conceptos sin mapeo', () => {
    expect(resolverCodigoLreLinea({ codigo: 'ZONA_EXTREMA' })).toBeNull();
  });
});
