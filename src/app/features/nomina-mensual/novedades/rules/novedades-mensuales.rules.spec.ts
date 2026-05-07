import type { NovedadMensual } from '../models/novedad-mensual.model';
import {
  normalizarMoneda,
  puedeAprobarNovedad,
  puedeCambiarEstadoNovedad,
  puedeEditarNovedad,
  validarNovedadMensualInput,
  validarPeriodoNovedad,
} from './novedades-mensuales.rules';

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
    estado: 'pendiente_revision',
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

describe('novedades-mensuales.rules', () => {
  it('periodo valido YYYY-MM pasa', () => {
    expect(validarPeriodoNovedad('2026-05')).toBe(true);
  });

  it('periodo invalido falla', () => {
    expect(validarPeriodoNovedad('2026-13')).toBe(false);
    expect(validarPeriodoNovedad('202605')).toBe(false);
  });

  it('crear novedad minima valida', () => {
    const result = validarNovedadMensualInput({
      periodo: '2026-05',
      idPersona: 10,
      idConcepto: 20,
      categoria: 'haber_variable',
      tipoMovimiento: 'haber',
    });

    expect(result.valido).toBe(true);
  });

  it('falta persona falla', () => {
    const result = validarNovedadMensualInput({
      periodo: '2026-05',
      idPersona: 0,
      idConcepto: 20,
      categoria: 'haber_variable',
      tipoMovimiento: 'haber',
    });

    expect(result.errores.some((e) => e.codigo === 'NOVEDAD_PERSONA_REQUERIDA')).toBe(true);
  });

  it('falta concepto falla', () => {
    const result = validarNovedadMensualInput({
      periodo: '2026-05',
      idPersona: 10,
      idConcepto: 0,
      categoria: 'haber_variable',
      tipoMovimiento: 'haber',
    });

    expect(result.errores.some((e) => e.codigo === 'NOVEDAD_CONCEPTO_REQUERIDO')).toBe(true);
  });

  it('cantidad negativa falla', () => {
    const result = validarNovedadMensualInput({
      periodo: '2026-05',
      idPersona: 10,
      idConcepto: 20,
      categoria: 'tiempo_trabajado_adicional',
      tipoMovimiento: 'haber',
      cantidad: -1,
    });

    expect(result.errores.some((e) => e.codigo === 'NOVEDAD_CANTIDAD_INVALIDA')).toBe(true);
  });

  it('monto negativo falla', () => {
    const result = validarNovedadMensualInput({
      periodo: '2026-05',
      idPersona: 10,
      idConcepto: 20,
      categoria: 'haber_variable',
      tipoMovimiento: 'haber',
      monto: -1,
    });

    expect(result.errores.some((e) => e.codigo === 'NOVEDAD_MONTO_INVALIDO')).toBe(true);
  });

  it('moneda default CLP', () => {
    expect(normalizarMoneda(null)).toBe('CLP');
    expect(normalizarMoneda('clp')).toBe('CLP');
  });

  it('novedad calculada no editable', () => {
    const result = puedeEditarNovedad(novedad({ estado: 'calculada' }));

    expect(result.valido).toBe(false);
    expect(result.errores[0].codigo).toBe('NOVEDAD_ESTADO_NO_EDITABLE');
  });

  it('borrador puede pasar a pendiente_revision', () => {
    expect(puedeCambiarEstadoNovedad('borrador', 'pendiente_revision').valido).toBe(true);
  });

  it('pendiente_revision puede pasar a aprobada', () => {
    expect(puedeCambiarEstadoNovedad('pendiente_revision', 'aprobada').valido).toBe(true);
  });

  it('aprobada puede pasar a incorporada_a_pre_nomina', () => {
    expect(puedeCambiarEstadoNovedad('aprobada', 'incorporada_a_pre_nomina').valido).toBe(true);
  });

  it('calculada no puede volver a aprobada', () => {
    const result = puedeCambiarEstadoNovedad('calculada', 'aprobada');

    expect(result.valido).toBe(false);
    expect(result.errores[0].codigo).toBe('NOVEDAD_TRANSICION_INVALIDA');
  });

  it('anulada no puede aprobarse', () => {
    const result = puedeAprobarNovedad(novedad({ estado: 'anulada' }));

    expect(result.valido).toBe(false);
  });

  it('categoria invalida falla', () => {
    const result = validarNovedadMensualInput({
      periodo: '2026-05',
      idPersona: 10,
      idConcepto: 20,
      categoria: 'otra' as never,
      tipoMovimiento: 'haber',
    });

    expect(result.errores.some((e) => e.codigo === 'NOVEDAD_CATEGORIA_INVALIDA')).toBe(true);
  });

  it('origen invalido falla', () => {
    const result = validarNovedadMensualInput({
      periodo: '2026-05',
      idPersona: 10,
      idConcepto: 20,
      categoria: 'haber_variable',
      tipoMovimiento: 'haber',
      origen: 'externo' as never,
    });

    expect(result.errores.some((e) => e.codigo === 'NOVEDAD_ORIGEN_INVALIDO')).toBe(true);
  });

  it('para aprobacion exige monto si la categoria lo requiere', () => {
    const result = validarNovedadMensualInput(
      {
        periodo: '2026-05',
        idPersona: 10,
        idConcepto: 20,
        categoria: 'haber_variable',
        tipoMovimiento: 'haber',
      },
      { paraAprobacion: true },
    );

    expect(result.errores.some((e) => e.codigo === 'NOVEDAD_MONTO_REQUERIDO')).toBe(true);
  });
});
