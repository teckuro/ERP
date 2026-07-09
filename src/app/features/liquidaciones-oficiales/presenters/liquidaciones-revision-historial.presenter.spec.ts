import { describe, expect, it } from 'vitest';

import type {
  LiquidacionEmision,
  LiquidacionRevisionEvento,
  LiquidacionTrabajador,
} from '../models/liquidacion-oficial.model';
import { mapearHistorialRevisionPeriodo, mapearHistorialRevisionTrabajador } from './liquidaciones-revision-historial.presenter';

function evento(partial: Partial<LiquidacionRevisionEvento>): LiquidacionRevisionEvento {
  return {
    idLiquidacionRevisionEvento: 1,
    idLiquidacionTrabajador: 10,
    idLiquidacionPeriodo: 5,
    accion: 'autorizar',
    estadoPrevio: 'pendiente_autorizar',
    estadoNuevo: 'autorizada',
    usuarioId: 'u-1',
    usuarioLabel: 'María RRHH',
    registradoEn: '2026-07-09T12:00:00.000Z',
    metadata: {},
    ...partial,
  };
}

function emision(partial: Partial<LiquidacionEmision>): LiquidacionEmision {
  return {
    idLiquidacionEmision: 2,
    idLiquidacionTrabajador: 10,
    idLiquidacionPeriodo: 5,
    versionLiquidacion: 1,
    usuarioId: 'u-1',
    usuarioLabel: 'María RRHH',
    canal: 'vista_oficial',
    emitidoEn: '2026-07-09T13:00:00.000Z',
    metadata: {},
    ...partial,
  };
}

describe('mapearHistorialRevisionTrabajador', () => {
  it('mapea eventos de revisión con etiquetas RRHH y transición de estado', () => {
    const filas = mapearHistorialRevisionTrabajador({
      eventos: [evento({ idLiquidacionRevisionEvento: 7 })],
      emisiones: [],
    });

    expect(filas).toHaveLength(1);
    expect(filas[0]?.accion).toBe('Liquidación autorizada');
    expect(filas[0]?.usuario).toBe('María RRHH');
    expect(filas[0]?.detalle).toBe('Pendiente de autorizar → Autorizada');
    expect(filas[0]?.icono).toBe('check-circle');
  });

  it('incluye emisiones de comprobante y ordena por fecha descendente', () => {
    const filas = mapearHistorialRevisionTrabajador({
      eventos: [evento({ registradoEn: '2026-07-09T10:00:00.000Z' })],
      emisiones: [emision({ emitidoEn: '2026-07-09T14:00:00.000Z' })],
    });

    expect(filas).toHaveLength(2);
    expect(filas[0]?.accion).toBe('Comprobante emitido');
    expect(filas[0]?.detalle).toContain('Vista oficial');
    expect(filas[1]?.accion).toBe('Liquidación autorizada');
  });

  it('mapea historial consolidado por período con nombre de trabajador', () => {
    const filas = mapearHistorialRevisionPeriodo({
      eventos: [evento({ idLiquidacionTrabajador: 10, idLiquidacionRevisionEvento: 3 })],
      emisiones: [],
      trabajadores: [{ idLiquidacionTrabajador: 10, nombreTrabajador: 'Juan Pérez' }],
    });

    expect(filas).toHaveLength(1);
    expect(filas[0]?.trabajador).toBe('Juan Pérez');
    expect(filas[0]?.accion).toBe('Liquidación autorizada');
  });

  it('usa metadata del trabajador como fallback cuando no hay eventos en BD', () => {
    const trabajador: Pick<LiquidacionTrabajador, 'metadata' | 'idLiquidacionTrabajador'> = {
      idLiquidacionTrabajador: 10,
      metadata: {
        autorizacion: {
          usuarioId: 'u-1',
          usuarioNombre: 'Pedro Admin',
          registradoEn: '2026-06-01T09:30:00.000Z',
        },
      },
    };

    const filas = mapearHistorialRevisionTrabajador({
      eventos: [],
      emisiones: [],
      trabajador,
    });

    expect(filas).toHaveLength(1);
    expect(filas[0]?.accion).toBe('Liquidación autorizada');
    expect(filas[0]?.usuario).toBe('Pedro Admin');
  });
});
