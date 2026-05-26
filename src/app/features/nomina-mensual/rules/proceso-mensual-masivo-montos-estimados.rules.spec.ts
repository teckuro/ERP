import { describe, expect, it } from 'vitest';

import type { EntradaMensualPeriodo } from '../entradas/models/entrada-mensual-periodo.model';
import {
  aplicarMontosEstimadosDesdeEntradas,
  entradaEsDescuentoOperativo,
  estimarMontosTrabajadorDesdeEntradas,
  type FilaMontosEstimables,
} from './proceso-mensual-masivo-montos-estimados.rules';

function entrada(overrides: Partial<EntradaMensualPeriodo> = {}): EntradaMensualPeriodo {
  return {
    idEntrada: 'novedad:1',
    origen: 'novedad_mensual',
    origenId: 1,
    periodo: '2026-05',
    idPersona: 9,
    idContrato: 10,
    idConcepto: 1,
    tipoEntrada: 'haber',
    categoria: 'haber_variable',
    tipoMovimiento: 'haber',
    cantidad: null,
    unidad: null,
    monto: 1000,
    moneda: 'CLP',
    estado: 'aprobada',
    fechaEvento: null,
    observacion: null,
    referenciaExterna: null,
    requiereRevision: false,
    bloqueaProceso: false,
    warnings: [],
    metadata: {},
    ...overrides,
  };
}

describe('proceso-mensual-masivo-montos-estimados.rules', () => {
  it('clasifica descuentos y haberes operativos', () => {
    expect(entradaEsDescuentoOperativo(entrada({ tipoEntrada: 'descuento' }))).toBe(true);
    expect(entradaEsDescuentoOperativo(entrada({ tipoEntrada: 'haber' }))).toBe(false);
    expect(entradaEsDescuentoOperativo(entrada({
      tipoEntrada: 'otro',
      tipoMovimiento: 'descuento_voluntario',
    }))).toBe(true);
  });

  it('suma entradas aptas por trabajador', () => {
    const estimado = estimarMontosTrabajadorDesdeEntradas(9, [
      entrada({ monto: 500000, tipoEntrada: 'haber' }),
      entrada({ idEntrada: 'novedad:2', monto: 50000, tipoEntrada: 'descuento' }),
      entrada({ idEntrada: 'novedad:3', idPersona: 99, monto: 999999 }),
      entrada({ idEntrada: 'novedad:4', monto: 1000, estado: 'borrador' }),
    ]);

    expect(estimado).toEqual({
      haberes: 500000,
      descuentos: 50000,
      liquidoEstimado: 450000,
    });
  });

  it('aplica montos estimados solo cuando la fila no tiene montos oficiales', () => {
    const filaBase = {
      idPersona: 9,
      trabajador: 'Ana',
      rut: '1-9',
      haberes: null,
      descuentos: null,
      liquidoEstimado: null,
    };

    const estimada = aplicarMontosEstimadosDesdeEntradas<FilaMontosEstimables & {
      trabajador: string;
      rut: string;
    }>(filaBase, [
      entrada({ monto: 800000 }),
      entrada({ idEntrada: 'novedad:2', monto: 120000, tipoEntrada: 'descuento' }),
    ]);

    expect(estimada.montosEstimadosDesdeEntradas).toBe(true);
    expect(estimada.haberes).toBe(800000);
    expect(estimada.descuentos).toBe(120000);
    expect(estimada.liquidoEstimado).toBe(680000);
  });

  it('no pisa montos oficiales existentes', () => {
    const fila = aplicarMontosEstimadosDesdeEntradas<FilaMontosEstimables>({
      idPersona: 9,
      haberes: 100,
      descuentos: 20,
      liquidoEstimado: 80,
    }, [entrada({ monto: 999999 })]);

    expect(fila.haberes).toBe(100);
    expect(fila.liquidoEstimado).toBe(80);
    expect(fila.montosEstimadosDesdeEntradas).toBeUndefined();
  });
});
