import { describe, expect, it } from 'vitest';

import { derivarFlagsLiquidacionConcepto } from './concepto-liquidacion-flags.rules';

describe('concepto-liquidacion-flags.rules', () => {
  it('aporte empleador sin impacto en liquidación del trabajador', () => {
    expect(derivarFlagsLiquidacionConcepto('APORTE_EMPLEADOR', 'NO_IMPONIBLE')).toEqual({
      imponible: false,
      tributable: false,
      afectaAfp: false,
      afectaSalud: false,
      afectaAfc: false,
      afectaSis: false,
      afectaLiquido: false,
    });
  });

  it('haber o descuento imponible afecta previsional y líquido', () => {
    const flags = derivarFlagsLiquidacionConcepto('HABER', 'IMPONIBLE');
    expect(flags.imponible).toBe(true);
    expect(flags.tributable).toBe(true);
    expect(flags.afectaAfp).toBe(true);
    expect(flags.afectaSalud).toBe(true);
    expect(flags.afectaAfc).toBe(true);
    expect(flags.afectaLiquido).toBe(true);
    expect(flags.afectaSis).toBe(false);
  });

  it('haber o descuento no imponible solo afecta líquido', () => {
    const flags = derivarFlagsLiquidacionConcepto('DESCUENTO', 'NO_IMPONIBLE');
    expect(flags.imponible).toBe(false);
    expect(flags.afectaAfp).toBe(false);
    expect(flags.afectaLiquido).toBe(true);
  });
});
