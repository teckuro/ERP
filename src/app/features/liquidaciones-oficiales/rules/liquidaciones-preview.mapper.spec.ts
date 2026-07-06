import { describe, expect, it } from 'vitest';

import { mapLiquidacionOficialAPreview } from './liquidaciones-preview.mapper';
import type { LiquidacionConcepto, LiquidacionTrabajador } from '../models/liquidacion-oficial.model';

describe('liquidaciones-preview.mapper', () => {
  it('clasifica conceptos materializados en secciones del preview', () => {
    const trabajador = trabajadorMock();
    const conceptos: LiquidacionConcepto[] = [
      concepto({ nombre: 'Sueldo base', tipo: 'haber', clasificacion: 'haber_imponible_tributable', monto: 900_000 }),
      concepto({ nombre: 'Colación', tipo: 'haber', clasificacion: 'haber_no_imponible', monto: 20_000 }),
      concepto({ nombre: 'Cotización AFP', tipo: 'descuento', clasificacion: 'descuento', monto: 100_000 }),
      concepto({ nombre: 'Anticipo', tipo: 'descuento', clasificacion: 'descuento', monto: 50_000 }),
      concepto({ nombre: 'SIS empleador', tipo: 'cotizacion', clasificacion: 'aporte_referencia', monto: 12_000 }),
    ];

    const preview = mapLiquidacionOficialAPreview({ trabajador, conceptos, periodo: '2026-06' });

    expect(preview.haberesImponibles).toHaveLength(1);
    expect(preview.haberesNoImponibles).toHaveLength(1);
    expect(preview.descuentosLegales).toHaveLength(1);
    expect(preview.descuentosVoluntarios).toHaveLength(1);
    expect(preview.liquidoAPago).toBe(770_000);
    expect(preview.nombreCompleto).toBe('Ana Pérez');
  });
});

function trabajadorMock(): LiquidacionTrabajador {
  return {
    idLiquidacionTrabajador: 10,
    idPersona: 5,
    idContrato: null,
    rut: '12.345.678-9',
    nombreTrabajador: 'Ana Pérez',
    cargo: 'Analista',
    centroCosto: null,
    fechaIngreso: null,
    diasTrabajados: 30,
    baseImponible: 900_000,
    baseTributable: 800_000,
    totalHaberes: 920_000,
    totalDescuentos: 150_000,
    totalAportesEmpleadorReferencia: 12_000,
    liquidoPagar: 770_000,
    estado: 'generada',
    observaciones: [],
    metadata: { cotizacionAfp: 100_000, cotizacionSalud: 40_000 },
  };
}

function concepto(parcial: Partial<LiquidacionConcepto>): LiquidacionConcepto {
  return {
    idLiquidacionConcepto: 1,
    idLiquidacionTrabajador: 10,
    idConcepto: null,
    codigo: null,
    codigoLre: null,
    nombre: 'Concepto',
    tipo: 'haber',
    clasificacion: null,
    cantidad: null,
    base: null,
    tasa: null,
    monto: 0,
    orden: 1,
    metadata: {},
    ...parcial,
  };
}
