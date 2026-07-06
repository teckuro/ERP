import {
  LRE_CODIGO_POR_CONCEPTO,
  LRE_CONCEPTOS_SIN_CODIGO_DIRECTO,
  listarCodigosLreOficialesEsperados,
  resolverCodigoLreConcepto,
} from './lre-codigo-concepto.rules';

describe('lre-codigo-concepto.rules', () => {
  it('mapea haberes imponibles oficiales', () => {
    expect(resolverCodigoLreConcepto('SUELDO_BASE')).toBe('2101');
    expect(resolverCodigoLreConcepto('GRATIFICACION_ART_50')).toBe('2106');
    expect(resolverCodigoLreConcepto('HORA_EXTRA')).toBe('2102');
    expect(resolverCodigoLreConcepto('BONO')).toBe('2113');
    expect(resolverCodigoLreConcepto('BONO_RESPONSABILIDAD')).toBe('2111');
    expect(resolverCodigoLreConcepto('AGUINALDO')).toBe('2110');
  });

  it('mapea haberes no imponibles oficiales', () => {
    expect(resolverCodigoLreConcepto('COLACION')).toBe('2301');
    expect(resolverCodigoLreConcepto('MOVILIZACION')).toBe('2302');
    expect(resolverCodigoLreConcepto('ASIGNACION_FAMILIAR')).toBe('2311');
  });

  it('mapea descuentos legales oficiales', () => {
    expect(resolverCodigoLreConcepto('AFP')).toBe('3141');
    expect(resolverCodigoLreConcepto('SALUD')).toBe('3143');
    expect(resolverCodigoLreConcepto('AFC')).toBe('3151');
    expect(resolverCodigoLreConcepto('CESANTIA')).toBe('3151');
    expect(resolverCodigoLreConcepto('IMPUESTO_UNICO')).toBe('3161');
    expect(resolverCodigoLreConcepto('IMPUESTO_RENTA')).toBe('3161');
  });

  it('mapea descuentos voluntarios oficiales', () => {
    expect(resolverCodigoLreConcepto('PRESTAMO')).toBe('3188');
    expect(resolverCodigoLreConcepto('ANTICIPO')).toBe('3188');
    expect(resolverCodigoLreConcepto('DESCUENTO_CONVENIO')).toBe('3183');
    expect(resolverCodigoLreConcepto('PENSION_ALIMENTOS')).toBe('3186');
  });

  it('no fuerza código en conceptos pendientes o de referencia', () => {
    for (const codigo of LRE_CONCEPTOS_SIN_CODIGO_DIRECTO) {
      expect(resolverCodigoLreConcepto(codigo)).toBeNull();
    }
    expect(resolverCodigoLreConcepto('CONCEPTO_DESCONOCIDO')).toBeNull();
    expect(resolverCodigoLreConcepto('')).toBeNull();
    expect(resolverCodigoLreConcepto(null)).toBeNull();
  });

  it('expone catálogo alineado al SQL oficial', () => {
    expect(LRE_CODIGO_POR_CONCEPTO['SUELDO_BASE']).toBe('2101');
    expect(listarCodigosLreOficialesEsperados()).toContain('2101');
    expect(listarCodigosLreOficialesEsperados()).toContain('3141');
    expect(listarCodigosLreOficialesEsperados()).not.toContain('1101');
  });
});
