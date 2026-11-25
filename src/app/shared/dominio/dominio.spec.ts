import { formatearClp } from './moneda';
import { esPeriodoRemuneracionValido } from './periodo';

describe('esPeriodoRemuneracionValido', () => {
  it.each(['2026-01', '2026-12', ' 2026-11 ', '2000-01', '2100-12'])('acepta %s', (periodo) => {
    expect(esPeriodoRemuneracionValido(periodo)).toBe(true);
  });

  it.each([null, undefined, '', '2026-00', '2026-13', '2026-1', '1999-12', '2101-01', '2026-11-01'])(
    'rechaza %s',
    (periodo) => {
      expect(esPeriodoRemuneracionValido(periodo)).toBe(false);
    },
  );
});

describe('formatearClp', () => {
  it('formatea pesos sin decimales y con separador de miles', () => {
    expect(formatearClp(1234567)).toBe('$1.234.567');
    expect(formatearClp(0)).toBe('$0');
  });

  it('redondea los decimales', () => {
    expect(formatearClp(999.6)).toBe('$1.000');
  });
});
