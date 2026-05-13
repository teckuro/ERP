import type { HaberDescuentoAsignacionPrevalidacionMensualFila } from '../../haberes-descuentos/models/haber-descuento-asignacion.model';

import { contarRecurrentesParaPrevalidacionMensual } from './proceso-mensual-prevalidacion.rules';

function fila(
  estado: boolean,
  ev: HaberDescuentoAsignacionPrevalidacionMensualFila['estadoVigencia'],
  inter: boolean,
): HaberDescuentoAsignacionPrevalidacionMensualFila {
  return {
    asignacion: {
      idAsignacion: 1,
      idPersona: 1,
      idConcepto: 1,
      idContrato: null,
      codigoConcepto: 'X',
      nombreConcepto: 'N',
      tipoConcepto: 'HABER',
      naturalezaConcepto: 'IMPONIBLE',
      codigoLre: null,
      esSistemaConcepto: false,
      calculoAutomaticoConcepto: false,
      imponible: true,
      tributable: true,
      monto: 100,
      porcentaje: null,
      tipoValor: 'FIJO',
      tipohaber: null,
      periodicidad: 'MENSUAL',
      vigenciaInicio: '2026-05-01',
      vigenciaFin: null,
      observacion: null,
      estado,
    },
    estadoVigencia: ev,
    intersectaPeriodo: inter,
  };
}

describe('contarRecurrentesParaPrevalidacionMensual', () => {
  it('vigencia invalida cuenta como invalidas', () => {
    const c = contarRecurrentesParaPrevalidacionMensual([fila(true, 'INVALIDA', true)]);
    expect(c.invalidas).toBe(1);
    expect(c.aplicables).toBe(0);
  });

  it('cerrada no aplica ni bloquea por invalidas', () => {
    const c = contarRecurrentesParaPrevalidacionMensual([fila(false, 'ACTIVA', true)]);
    expect(c.cerradas).toBe(1);
    expect(c.aplicables).toBe(0);
  });

  it('abierta sin interseccion -> fueraDelMes', () => {
    const c = contarRecurrentesParaPrevalidacionMensual([fila(true, 'ACTIVA', false)]);
    expect(c.fueraDelMes).toBe(1);
  });

  it('activa e intersecta -> aplicables', () => {
    const c = contarRecurrentesParaPrevalidacionMensual([fila(true, 'ACTIVA', true)]);
    expect(c.aplicables).toBe(1);
  });
});
