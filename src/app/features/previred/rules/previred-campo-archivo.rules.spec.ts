import type { LiquidacionConcepto } from '../../liquidaciones-oficiales/models/liquidacion-oficial.model';
import {
  agregarConceptosACamposPrevired,
  aplicarRentasImponiblesPrevired,
  calcularExpectativaVidaPrevired,
} from './previred-campo-archivo.rules';

function concepto(overrides: Partial<LiquidacionConcepto> = {}): LiquidacionConcepto {
  return {
    idLiquidacionConcepto: 1,
    idLiquidacionTrabajador: 1,
    idConcepto: 1,
    codigo: 'AFP',
    codigoLre: '3141',
    nombre: 'AFP',
    tipo: 'descuento',
    clasificacion: 'descuento_legal',
    cantidad: null,
    base: null,
    tasa: null,
    monto: 150_000,
    orden: 1,
    metadata: {},
    ...overrides,
  };
}

describe('previred-campo-archivo.rules', () => {
  it('agrega AFP, cesantía y SIS empleador a campos 28, 101 y 29', () => {
    const resultado = agregarConceptosACamposPrevired({
      conceptos: [
        concepto(),
        concepto({ codigo: 'CESANTIA', codigoLre: '3151', monto: 20_000 }),
        concepto({
          codigo: 'SIS_EMPLEADOR',
          codigoLre: '4155',
          tipo: 'cotizacion',
          clasificacion: 'aporte_referencia',
          monto: 25_000,
        }),
      ],
      catalogo: [],
      saludTipo: 'FONASA',
      incluirAportesEmpleador: true,
    });

    expect(resultado.montosPorCampo[28]).toBe(150_000);
    expect(resultado.montosPorCampo[101]).toBe(20_000);
    expect(resultado.montosPorCampo[29]).toBe(25_000);
  });

  it('enruta salud Fonasa al campo 70 e Isapre al 80', () => {
    const salud = concepto({ codigo: 'SALUD', codigoLre: '3143', monto: 70_000 });
    const fonasa = agregarConceptosACamposPrevired({
      conceptos: [salud],
      catalogo: [],
      saludTipo: 'FONASA',
      incluirAportesEmpleador: true,
    });
    const isapre = agregarConceptosACamposPrevired({
      conceptos: [salud],
      catalogo: [],
      saludTipo: 'ISAPRE',
      incluirAportesEmpleador: true,
    });
    expect(fonasa.montosPorCampo[70]).toBe(70_000);
    expect(isapre.montosPorCampo[80]).toBe(70_000);
  });

  it('aplica rentas imponibles y expectativa de vida reforma', () => {
    const montos = aplicarRentasImponiblesPrevired({
      montosPorCampo: {},
      baseImponible: 1_000_000,
      regimenPrevisional: 'AFP',
      saludTipo: 'ISAPRE',
      seguroCesantia: true,
      ccafCodigoPrevired: '01',
      mutualCodigoPrevired: '01',
    });
    expect(montos[27]).toBe(1_000_000);
    expect(montos[77]).toBe(1_000_000);
    expect(montos[100]).toBe(1_000_000);
    expect(montos[84]).toBe(1_000_000);
    expect(montos[97]).toBe(1_000_000);

    expect(
      calcularExpectativaVidaPrevired({
        baseImponible: 1_000_000,
        regimenPrevisional: 'AFP',
        tipoTrabajador: 0,
        montoConcepto: null,
        tasaParametro: 0.009,
      }),
    ).toBe(9000);
  });
});
