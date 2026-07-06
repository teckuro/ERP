import { describe, expect, it } from 'vitest';

import type { HaberDescuentoAsignacionPrevalidacionMensualFila } from '../../haberes-descuentos/models/haber-descuento-asignacion.model';
import type { EntradaMensualPeriodo } from '../entradas/models/entrada-mensual-periodo.model';
import type { MovimientoNomina } from '../models/movimiento-nomina.models';
import {
  aplicarMovimientosNominaAlMotor,
  claveDedupeEntradaMensual,
  construirEntradasDesdeMovimientosManuales,
  deduplicarEntradasManualesContraCanonicas,
  filtrarRecurrentesPorMovimientos,
  fusionarEntradasConMovimientosNomina,
} from './nomina-movimientos-motor.rules';

function asignacionFila(
  idPersona: number,
  idConcepto: number,
): HaberDescuentoAsignacionPrevalidacionMensualFila {
  return {
    asignacion: {
      idAsignacion: idConcepto,
      idPersona,
      idConcepto,
      idContrato: null,
      codigoConcepto: 'BONO',
      nombreConcepto: 'Bono',
      tipoConcepto: 'HABER',
      naturalezaConcepto: 'IMPONIBLE',
      codigoLre: '2113',
      esSistemaConcepto: false,
      calculoAutomaticoConcepto: false,
      imponible: true,
      tributable: true,
      monto: 50000,
      porcentaje: null,
      tipoValor: 'FIJO',
      tipohaber: null,
      periodicidad: 'mensual',
      vigenciaInicio: null,
      vigenciaFin: null,
      observacion: null,
      estado: true,
    },
    estadoVigencia: 'ACTIVA',
    intersectaPeriodo: true,
  };
}

function movimiento(partial: Partial<MovimientoNomina> & Pick<MovimientoNomina, 'id'>): MovimientoNomina {
  return {
    nominaPeriodoId: 'nom-1',
    trabajadorId: '10',
    tipo: 'BONO',
    categoria: 'haber',
    origen: 'manual',
    estado: 'aplicado',
    createdAt: '2026-05-01T00:00:00Z',
    updatedAt: '2026-05-01T00:00:00Z',
    ...partial,
  };
}

function entradaCanonica(partial: Partial<EntradaMensualPeriodo>): EntradaMensualPeriodo {
  return {
    idEntrada: 'novedad:1',
    origen: 'novedad_mensual',
    origenId: 1,
    periodo: '2026-05',
    idPersona: 10,
    idContrato: null,
    idConcepto: 5,
    tipoEntrada: 'haber',
    categoria: 'HABER',
    tipoMovimiento: 'HABER',
    cantidad: null,
    unidad: null,
    monto: 50000,
    moneda: 'CLP',
    estado: 'aprobada',
    fechaEvento: null,
    observacion: null,
    referenciaExterna: null,
    requiereRevision: false,
    bloqueaProceso: false,
    warnings: [],
    metadata: {},
    ...partial,
  };
}

describe('nomina-movimientos-motor.rules', () => {
  it('filtrarRecurrentesPorMovimientos excluye asignación omitida en la nómina', () => {
    const recurrentes = [asignacionFila(10, 5), asignacionFila(11, 5)];
    const movimientos = [
      movimiento({
        id: 'mov-omit',
        origen: 'recurrente',
        trabajadorId: '10',
        conceptoId: 5,
        estado: 'omitido',
      }),
    ];

    const filtrados = filtrarRecurrentesPorMovimientos(recurrentes, movimientos);
    expect(filtrados).toHaveLength(1);
    expect(filtrados[0].asignacion.idPersona).toBe(11);
  });

  it('construirEntradasDesdeMovimientosManuales ignora recurrentes e informativos', () => {
    const entradas = construirEntradasDesdeMovimientosManuales(
      [
        movimiento({ id: 'm1', origen: 'manual', monto: 7000, conceptoId: 3 }),
        movimiento({ id: 'm2', origen: 'recurrente', monto: 1000 }),
        movimiento({ id: 'm3', origen: 'manual', categoria: 'informativo' }),
        movimiento({ id: 'm4', origen: 'manual', estado: 'borrador', monto: 9000 }),
      ],
      '2026-05',
    );

    expect(entradas).toHaveLength(1);
    expect(entradas[0].origen).toBe('movimiento_nomina');
    expect(entradas[0].monto).toBe(7000);
    expect(entradas[0].metadata['origenMovimientoNomina']).toBe(true);
  });

  it('deduplicarEntradasManualesContraCanonicas prioriza novedad canónica', () => {
    const canonica = entradaCanonica({ idPersona: 10, idConcepto: 5, monto: 50000 });
    const manual = construirEntradasDesdeMovimientosManuales(
      [movimiento({ id: 'm-dup', conceptoId: 5, monto: 50000 })],
      '2026-05',
    );

    expect(claveDedupeEntradaMensual(canonica)).toBe(claveDedupeEntradaMensual(manual[0]));
    const sinDup = deduplicarEntradasManualesContraCanonicas([canonica], manual);
    expect(sinDup).toHaveLength(0);
  });

  it('fusionarEntradasConMovimientosNomina agrega manual no duplicado', () => {
    const canonica = entradaCanonica({ monto: 50000 });
    const fusionadas = fusionarEntradasConMovimientosNomina({
      periodo: '2026-05',
      entradasCanonicas: [canonica],
      movimientos: [movimiento({ id: 'm-nuevo', conceptoId: 8, monto: 12000 })],
    });

    expect(fusionadas).toHaveLength(2);
    expect(fusionadas.some((e) => e.origen === 'movimiento_nomina')).toBe(true);
  });

  it('aplicarMovimientosNominaAlMotor combina filtros y fusión', () => {
    const resultado = aplicarMovimientosNominaAlMotor({
      periodo: '2026-05',
      entradasCanonicas: [entradaCanonica({})],
      recurrentes: [asignacionFila(10, 5), asignacionFila(11, 5)],
      movimientos: [
        movimiento({
          id: 'omit-rec',
          origen: 'recurrente',
          conceptoId: 5,
          estado: 'omitido',
        }),
        movimiento({ id: 'manual-extra', conceptoId: 9, monto: 3000 }),
      ],
    });

    expect(resultado.recurrentesFiltrados).toHaveLength(1);
    expect(resultado.entradasFusionadas.some((e) => e.idConcepto === 9)).toBe(true);
  });
});
