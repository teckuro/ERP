import type { LiquidacionConcepto, LiquidacionTrabajador } from '../../liquidaciones-oficiales/models/liquidacion-oficial.model';
import {
  construirBorradorPrevired,
  generarCsvPrevired,
  mapearTrabajadorAPrevired,
  puedeDescargarBorradorPrevired,
} from './previred-export.rules';

function trabajador(overrides: Partial<LiquidacionTrabajador> = {}): LiquidacionTrabajador {
  return {
    idLiquidacionTrabajador: 1,
    idPersona: 10,
    idContrato: 20,
    rut: '11.111.111-1',
    nombreTrabajador: 'Ana Pérez',
    cargo: 'Analista',
    centroCosto: 'TI',
    fechaIngreso: '2024-01-01',
    diasTrabajados: 30,
    baseImponible: 1_000_000,
    baseTributable: 900_000,
    totalHaberes: 1_000_000,
    totalDescuentos: 100_000,
    totalAportesEmpleadorReferencia: 50_000,
    liquidoPagar: 900_000,
    estado: 'generada',
    observaciones: [],
    metadata: {},
    ...overrides,
  };
}

function concepto(overrides: Partial<LiquidacionConcepto> = {}): LiquidacionConcepto {
  return {
    idLiquidacionConcepto: 1,
    idLiquidacionTrabajador: 1,
    idConcepto: 5,
    codigo: 'SUELDO',
    codigoLre: '1101',
    nombre: 'Sueldo base',
    tipo: 'haber',
    clasificacion: 'haber_imponible',
    cantidad: null,
    base: null,
    tasa: null,
    monto: 800_000,
    orden: 1,
    metadata: {},
    ...overrides,
  };
}

const catalogo = [
  { codigoLre: '1101', codigoPrevired: '2101', glosaPrevired: 'Sueldo Previred' },
];

describe('previred-export.rules', () => {
  it('mapea conceptos con catálogo Previred y omite aportes referencia', () => {
    const resultado = mapearTrabajadorAPrevired({
      trabajador: trabajador(),
      conceptos: [
        concepto(),
        concepto({ nombre: 'SIS empleador', tipo: 'cotizacion', clasificacion: 'aporte_referencia', monto: 12_000 }),
        concepto({ monto: 0, codigoLre: '9999' }),
        concepto({ codigoLre: null, nombre: 'Bono sin código', monto: 50_000 }),
        concepto({ codigoLre: '3101', nombre: 'Bono sin catálogo', monto: 20_000 }),
      ],
      catalogoPrevired: catalogo,
    });

    expect(resultado.lineas).toHaveLength(2);
    expect(resultado.lineas[0]).toMatchObject({
      rut: '11.111.111-1',
      codigoMovimiento: '2101',
      glosa: 'Sueldo Previred',
      monto: 800_000,
      tipo: 'haber',
      origenMapeo: 'catalogo_previred',
    });
    expect(resultado.lineas[1]).toMatchObject({
      codigoMovimiento: '3101',
      origenMapeo: 'fallback_lre',
    });
    expect(resultado.omitidas).toBe(2);
    expect(resultado.sinCodigo).toBe(1);
    expect(resultado.sinMapeoCatalogo).toBe(1);
  });

  it('construye borrador con bloqueo cuando no hay líneas exportables', () => {
    const borrador = construirBorradorPrevired({
      periodo: '2026-06',
      empresaNombre: 'Empresa Demo',
      idNominaPeriodo: 'np-1',
      idLiquidacionPeriodo: 99,
      versionLiquidacion: 1,
      trabajadores: [
        {
          trabajador: trabajador(),
          conceptos: [concepto({ codigoLre: null, monto: 10_000 })],
        },
      ],
    });

    expect(borrador.lineas).toHaveLength(0);
    expect(borrador.conceptosSinCodigo).toBe(1);
    expect(borrador.listoParaEnvio).toBe(false);
    expect(borrador.advertencias[0]?.nivel).toBe('bloqueo');
    expect(puedeDescargarBorradorPrevired(borrador)).toBe(false);
  });

  it('permite descarga y marca listo para envío con catálogo completo', () => {
    const borrador = construirBorradorPrevired({
      periodo: '2026-06',
      empresaNombre: 'Empresa Demo',
      idNominaPeriodo: 'np-1',
      idLiquidacionPeriodo: 99,
      versionLiquidacion: 2,
      trabajadores: [{ trabajador: trabajador(), conceptos: [concepto()] }],
      catalogoPrevired: catalogo,
    });

    expect(puedeDescargarBorradorPrevired(borrador)).toBe(true);
    expect(borrador.listoParaEnvio).toBe(true);
    const csv = generarCsvPrevired(borrador);
    expect(csv).toContain('RUT,Nombre,Código movimiento');
    expect(csv).toContain('2101');
    expect(csv).toContain('Catálogo');
  });
});
