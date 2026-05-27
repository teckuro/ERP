import { describe, expect, it } from 'vitest';

import { formatoMontoNomina } from './proceso-mensual-presentacion.formato';

describe('proceso-mensual-presentacion.formato', () => {
  it('formatea CLP con simbolo peso', () => {
    expect(formatoMontoNomina(800000, 'CLP')).toContain('$');
    expect(formatoMontoNomina(800000)).toContain('$');
  });

  it('formatea UF sin simbolo peso', () => {
    const etiqueta = formatoMontoNomina(45.5, 'UF');
    expect(etiqueta.startsWith('UF')).toBe(true);
    expect(etiqueta).not.toContain('$');
  });

  it('devuelve monto no disponible para valores invalidos', () => {
    expect(formatoMontoNomina(null)).toBe('Monto no disponible');
  });
});
