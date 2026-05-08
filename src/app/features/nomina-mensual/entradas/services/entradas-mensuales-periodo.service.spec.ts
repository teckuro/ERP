import { TestBed } from '@angular/core/testing';

import type { HaberDescuentoAsignacionPrevalidacionMensualFila } from '../../../haberes-descuentos/models/haber-descuento-asignacion.model';
import { HaberesDescuentosService } from '../../../haberes-descuentos/services/haberes-descuentos.service';
import type { MovimientoVariableListadoFila } from '../../../movimientos-variables/models/movimiento-variable.model';
import { MovimientosVariablesService } from '../../../movimientos-variables/services/movimientos-variables.service';
import type { NovedadMensual } from '../../novedades/models/novedad-mensual.model';
import { NovedadesMensualesService } from '../../novedades/services/novedades-mensuales.service';
import { EntradasMensualesPeriodoService } from './entradas-mensuales-periodo.service';

function novedad(over: Partial<NovedadMensual> = {}): NovedadMensual {
  return {
    idNovedad: 1,
    periodo: '2026-05',
    idPersona: 10,
    idContrato: null,
    idConcepto: 20,
    categoria: 'haber_variable',
    tipoMovimiento: 'haber',
    cantidad: null,
    unidad: null,
    monto: 1000,
    moneda: 'CLP',
    origen: 'manual',
    fechaEvento: null,
    estado: 'aprobada',
    observacion: null,
    referenciaExterna: null,
    creadoPor: null,
    aprobadoPor: null,
    fechaAprobacion: null,
    fechaCreacion: '2026-05-01T00:00:00.000Z',
    fechaActualizacion: '2026-05-01T00:00:00.000Z',
    ...over,
  };
}

function movimiento(over: Partial<MovimientoVariableListadoFila> = {}): MovimientoVariableListadoFila {
  return {
    idMovimiento: 2,
    idPersona: 10,
    idConcepto: 21,
    periodo: '2026-05',
    monto: 500,
    estado: 'VALIDADO',
    origen: 'MANUAL',
    observacion: null,
    ...over,
  };
}

function recurrente(
  over: Partial<HaberDescuentoAsignacionPrevalidacionMensualFila> = {},
): HaberDescuentoAsignacionPrevalidacionMensualFila {
  return {
    asignacion: {
      idAsignacion: 3,
      idPersona: 11,
      idConcepto: 22,
      idContrato: null,
      codigoConcepto: 'BONO',
      nombreConcepto: 'Bono',
      tipoConcepto: 'HABER',
      naturalezaConcepto: 'IMPONIBLE',
      codigoLre: null,
      esSistemaConcepto: false,
      calculoAutomaticoConcepto: false,
      imponible: true,
      tributable: true,
      monto: 1200,
      porcentaje: null,
      tipoValor: 'FIJO',
      tipohaber: null,
      periodicidad: 'MENSUAL',
      vigenciaInicio: '2026-01-01',
      vigenciaFin: null,
      observacion: null,
      estado: true,
    },
    estadoVigencia: 'ACTIVA',
    intersectaPeriodo: true,
    ...over,
  };
}

describe('EntradasMensualesPeriodoService', () => {
  let service: EntradasMensualesPeriodoService;
  let novedadesMensualesService: { listarNovedadesPeriodo: ReturnType<typeof vi.fn> };
  let movimientosVariablesService: { listarPorPeriodo: ReturnType<typeof vi.fn> };
  let haberesDescuentosService: { listarAsignacionesParaPrevalidacionMensual: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    novedadesMensualesService = {
      listarNovedadesPeriodo: vi.fn().mockResolvedValue([novedad()]),
    };
    movimientosVariablesService = {
      listarPorPeriodo: vi.fn().mockResolvedValue([movimiento()]),
    };
    haberesDescuentosService = {
      listarAsignacionesParaPrevalidacionMensual: vi.fn().mockResolvedValue([recurrente()]),
    };

    TestBed.configureTestingModule({
      providers: [
        EntradasMensualesPeriodoService,
        { provide: NovedadesMensualesService, useValue: novedadesMensualesService },
        { provide: MovimientosVariablesService, useValue: movimientosVariablesService },
        { provide: HaberesDescuentosService, useValue: haberesDescuentosService },
      ],
    });
    service = TestBed.inject(EntradasMensualesPeriodoService);
  });

  it('listarEntradasPeriodo combina fuentes disponibles', async () => {
    const entradas = await service.listarEntradasPeriodo('2026-05');

    expect(entradas).toHaveLength(3);
    expect(entradas.map((entrada) => entrada.origen)).toEqual([
      'recurrente',
      'novedad_mensual',
      'legacy_movimiento_variable',
    ]);
  });

  it('listarEntradasPorPersona filtra por persona', async () => {
    const entradas = await service.listarEntradasPorPersona('2026-05', 10);

    expect(entradas).toHaveLength(2);
    expect(entradas.every((entrada) => entrada.idPersona === 10)).toBe(true);
  });

  it('construirResumenEntradasPeriodo usa entradas normalizadas', async () => {
    const resumen = await service.construirResumenEntradasPeriodo('2026-05');

    expect(resumen.total).toBe(3);
    expect(resumen.recurrentes).toBe(1);
    expect(resumen.novedadesMensuales).toBe(1);
    expect(resumen.legacyMovimientos).toBe(1);
    expect(resumen.aprobadas).toBe(3);
  });

  it('si una fuente falla, rechaza con contexto de fuente', async () => {
    movimientosVariablesService.listarPorPeriodo.mockRejectedValueOnce(new Error('fallo legacy'));

    await expect(service.listarEntradasPeriodo('2026-05')).rejects.toThrow(/Movimientos variables legacy/);
  });

  it('legacy queda marcado como origen legacy_movimiento_variable', async () => {
    const entradas = await service.listarLegacyMovimientos('2026-05');

    expect(entradas).toHaveLength(1);
    expect(entradas[0].origen).toBe('legacy_movimiento_variable');
    expect(entradas[0].metadata['origenTecnico']).toBe('movimiento_variable_mensual');
  });
});
