import { esPeriodoRemuneracionValido } from '../../../../shared/dominio/periodo';
import { describe, expect, it } from 'vitest';
import type { MovimientoVariableListadoFila } from '../../../movimientos-variables/models/movimiento-variable.model';
import type { NovedadMensual } from '../../novedades/models/novedad-mensual.model';
import type { EntradaMensualPeriodo } from '../models/entrada-mensual-periodo.model';
import {
  construirResumenEntradas,
  entradaBloqueaProceso,
  normalizarEntradaMovimientoLegacy,
  normalizarEntradaNovedadMensual,
  normalizarEstadoMovimientoLegacy,
  normalizarEstadoNovedadMensual,
  puedeEntrarAPreNomina,
} from './entradas-mensuales-periodo.rules';

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
    codigoMotivoAusencia: null,
    idLicencia: null,
    creadoPor: null,
    aprobadoPor: null,
    fechaAprobacion: null,
    fechaCreacion: '2026-05-01T00:00:00.000Z',
    fechaActualizacion: '2026-05-01T00:00:00.000Z',
    ...over,
  };
}

function legacy(over: Partial<MovimientoVariableListadoFila> = {}): MovimientoVariableListadoFila {
  return {
    idMovimiento: 5,
    idPersona: 10,
    idConcepto: 20,
    periodo: '2026-05',
    monto: 500,
    estado: 'VALIDADO',
    origen: 'MANUAL',
    observacion: null,
    ...over,
  };
}

function entrada(over: Partial<EntradaMensualPeriodo> = {}): EntradaMensualPeriodo {
  return {
    idEntrada: 'e1',
    origen: 'novedad_mensual',
    origenId: 1,
    periodo: '2026-05',
    idPersona: 10,
    idContrato: null,
    idConcepto: 20,
    tipoEntrada: 'haber',
    categoria: null,
    tipoMovimiento: null,
    cantidad: null,
    unidad: null,
    monto: 100,
    moneda: 'CLP',
    estado: 'aprobada',
    fechaEvento: null,
    observacion: null,
    referenciaExterna: null,
    requiereRevision: false,
    bloqueaProceso: false,
    warnings: [],
    metadata: {},
    ...over,
  };
}

describe('entradas mensuales periodo rules', () => {
  it('periodo YYYY-MM valido pasa', () => {
    expect(esPeriodoRemuneracionValido('2026-05')).toBe(true);
  });

  it('periodo invalido falla', () => {
    expect(esPeriodoRemuneracionValido('2026-13')).toBe(false);
    expect(esPeriodoRemuneracionValido('bad')).toBe(false);
  });

  it('estado novedad aprobada normaliza a aprobada', () => {
    expect(normalizarEstadoNovedadMensual('aprobada')).toBe('aprobada');
  });

  it('estado novedad anulada normaliza a anulada', () => {
    expect(normalizarEstadoNovedadMensual('anulada')).toBe('anulada');
  });

  it('estado legacy VALIDADO normaliza a aprobada', () => {
    expect(normalizarEstadoMovimientoLegacy('VALIDADO')).toBe('aprobada');
  });

  it('estado legacy OBSERVADO normaliza a observada', () => {
    expect(normalizarEstadoMovimientoLegacy('OBSERVADO')).toBe('observada');
  });

  it('estado legacy BLOQUEADO marca bloqueaProceso', () => {
    const entradaLegacy = normalizarEntradaMovimientoLegacy(legacy({ estado: 'BLOQUEADO' }));

    expect(entradaLegacy.estado).toBe('legacy_bloqueado');
    expect(entradaBloqueaProceso(entradaLegacy)).toBe(true);
  });

  it('entrada aprobada puede entrar a pre-nomina', () => {
    expect(puedeEntrarAPreNomina(entrada({ estado: 'aprobada' }))).toBe(true);
  });

  it('entrada borrador no puede entrar a pre-nomina', () => {
    expect(puedeEntrarAPreNomina(entrada({ estado: 'borrador' }))).toBe(false);
  });

  it('entrada rechazada no puede entrar a pre-nomina', () => {
    expect(puedeEntrarAPreNomina(entrada({ estado: 'rechazada' }))).toBe(false);
  });

  it('entrada anulada no puede entrar a pre-nomina', () => {
    expect(puedeEntrarAPreNomina(entrada({ estado: 'anulada' }))).toBe(false);
  });

  it('normaliza novedad mensual canonica', () => {
    const out = normalizarEntradaNovedadMensual(novedad({ idNovedad: 7 }));

    expect(out.idEntrada).toBe('novedad:7');
    expect(out.origen).toBe('novedad_mensual');
    expect(out.metadata['origenTecnico']).toBe('novedad_remuneracion_periodo');
  });

  it('marca licencia medica en metadata cuando motivo es LM', () => {
    const out = normalizarEntradaNovedadMensual(
      novedad({
        idConcepto: null,
        categoria: 'licencia_permiso',
        tipoMovimiento: 'informativo',
        cantidad: 5,
        codigoMotivoAusencia: 'LICENCIA_MEDICA',
        referenciaExterna: '1234567890',
      }),
    );

    expect(out.tipoEntrada).toBe('licencia');
    expect(out.metadata['licenciaMedica']).toBe(true);
    expect(out.metadata['codigoMotivoAusencia']).toBe('LICENCIA_MEDICA');
  });

  it('resumen cuenta total, aprobadas, pendientes, legacy y bloqueantes', () => {
    const resumen = construirResumenEntradas([
      entrada({ estado: 'aprobada' }),
      entrada({ origen: 'legacy_movimiento_variable', estado: 'legacy_bloqueado', bloqueaProceso: true, warnings: ['x'] }),
      entrada({ estado: 'pendiente_revision' }),
    ]);

    expect(resumen.total).toBe(3);
    expect(resumen.aprobadas).toBe(1);
    expect(resumen.pendientesRevision).toBe(1);
    expect(resumen.legacyMovimientos).toBe(1);
    expect(resumen.bloqueantes).toBe(1);
    expect(resumen.conWarnings).toBe(1);
  });

  it('resumen tolera entradas y warnings ausentes en runtime', () => {
    expect(construirResumenEntradas(undefined as any).total).toBe(0);

    const resumen = construirResumenEntradas([
      entrada({ warnings: undefined as any }),
    ]);

    expect(resumen.total).toBe(1);
    expect(resumen.conWarnings).toBe(0);
  });
});
