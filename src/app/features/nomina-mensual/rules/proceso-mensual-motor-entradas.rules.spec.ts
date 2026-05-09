import type { EntradaMensualPeriodo } from '../entradas/models/entrada-mensual-periodo.model';
import {
  construirEntradasMensualesMotor,
  entradaMensualAptaParaMotor,
  mapEntradaMensualMotor,
} from './proceso-mensual-motor-entradas.rules';

function entrada(over: Partial<EntradaMensualPeriodo> = {}): EntradaMensualPeriodo {
  return {
    idEntrada: 'novedad:1',
    origen: 'novedad_mensual',
    origenId: 1,
    periodo: '2026-05',
    idPersona: 1,
    idContrato: 10,
    idConcepto: 20,
    tipoEntrada: 'haber',
    categoria: 'haber_variable',
    tipoMovimiento: 'haber',
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
    metadata: { origenTecnico: 'novedad_remuneracion_periodo' },
    ...over,
  };
}

describe('proceso-mensual-motor-entradas.rules', () => {
  it('mapea entrada aprobada al contrato del motor', () => {
    const result = mapEntradaMensualMotor(entrada({ cantidad: 2, unidad: 'horas' }));

    expect(result.idEntrada).toBe('novedad:1');
    expect(result.origen).toBe('novedad_mensual');
    expect(result.origenId).toBe(1);
    expect(result.periodo).toBe('2026-05');
    expect(result.idPersona).toBe(1);
    expect(result.idContrato).toBe(10);
    expect(result.idConcepto).toBe(20);
    expect(result.cantidad).toBe(2);
    expect(result.unidad).toBe('horas');
    expect(result.monto).toBe(50000);
    expect(result.metadata['contratoMotor']).toBe('MOTOR-04_PREPARATORIO');
  });

  it('solo entradas aprobadas o aptas entran al contrato calculable', () => {
    const result = construirEntradasMensualesMotor([
      entrada({ idEntrada: 'ok', estado: 'aprobada' }),
      entrada({ idEntrada: 'borrador', estado: 'borrador', requiereRevision: true }),
      entrada({ idEntrada: 'pendiente', estado: 'pendiente_revision', requiereRevision: true }),
      entrada({ idEntrada: 'observada', estado: 'observada', requiereRevision: true }),
      entrada({ idEntrada: 'rechazada', estado: 'rechazada' }),
      entrada({ idEntrada: 'anulada', estado: 'anulada' }),
    ]);

    expect(result.map((item) => item.idEntrada)).toEqual(['ok']);
  });

  it('borrador no entra', () => {
    expect(entradaMensualAptaParaMotor(entrada({ estado: 'borrador' }))).toBe(false);
  });

  it('pendiente_revision no entra', () => {
    expect(entradaMensualAptaParaMotor(entrada({ estado: 'pendiente_revision' }))).toBe(false);
  });

  it('observada no entra', () => {
    expect(entradaMensualAptaParaMotor(entrada({ estado: 'observada' }))).toBe(false);
  });

  it('rechazada no entra', () => {
    expect(entradaMensualAptaParaMotor(entrada({ estado: 'rechazada' }))).toBe(false);
  });

  it('anulada no entra', () => {
    expect(entradaMensualAptaParaMotor(entrada({ estado: 'anulada' }))).toBe(false);
  });

  it('legacy validado normalizado entra como transicion', () => {
    const result = construirEntradasMensualesMotor([
      entrada({
        idEntrada: 'legacy_movimiento:1',
        origen: 'legacy_movimiento_variable',
        origenId: 1,
        estado: 'aprobada',
        categoria: 'legacy_movimiento_variable',
        metadata: { origenTecnico: 'movimiento_variable_mensual', estadoLegacy: 'VALIDADO' },
      }),
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].origen).toBe('legacy_movimiento_variable');
    expect(result[0].metadata['estadoLegacy']).toBe('VALIDADO');
  });

  it('legacy bloqueado no entra', () => {
    const result = construirEntradasMensualesMotor([
      entrada({
        idEntrada: 'legacy_movimiento:2',
        origen: 'legacy_movimiento_variable',
        estado: 'legacy_bloqueado',
        bloqueaProceso: true,
        metadata: { estadoLegacy: 'BLOQUEADO' },
      }),
    ]);

    expect(result).toEqual([]);
  });
});
