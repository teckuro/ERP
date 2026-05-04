import type { ParametroGeneral, PeriodoRemuneracionEstadoInfo } from '../../parametros-generales/models/parametro-general.model';
import type { MovimientoVariableListadoFila } from '../../movimientos-variables/models/movimiento-variable.model';

import {
  construirPrevalidacionMensual,
  type ProcesoMensualHechosPrevalidacion,
} from './proceso-mensual-prevalidacion.rules';

function filaPgBase(): ParametroGeneral {
  return {
    periodo: '2026-05',
    uf: 1,
    utm: 1,
    sueldoMinimo: 1,
    topeAfp: 1,
    topeIps: 1,
    topeCesantia: 1,
    sis: 0.01,
  } as ParametroGeneral;
}

function baseHechos(over: Partial<ProcesoMensualHechosPrevalidacion> = {}): ProcesoMensualHechosPrevalidacion {
  return {
    periodo: '2026-05',
    ultimoPg: filaPgBase(),
    lecturaUltimoPg: 'ok',
    periodoRem: {
      codigo: '2026-05',
      estado: 'cargado',
      fechaInicio: '2026-05-01',
      fechaFin: '2026-05-31',
    } satisfies PeriodoRemuneracionEstadoInfo,
    lecturaPeriodoRem: 'ok',
    parametrosGrupos: [],
    empleadosActivosAptos: 2,
    empleadosActivosNoAptos: 0,
    lecturaEmpleados: 'ok',
    totalConceptosMantenimiento: 3,
    lecturaConceptos: 'ok',
    alertaConceptosMotorFuturo: false,
    recurrentesConteo: { lectura: 'ok', aplicables: 0, invalidas: 0, cerradas: 0, fueraDelMes: 0 },
    movimientos: [],
    lecturaMovimientos: 'ok',
    ...over,
  };
}

function mv(estado: MovimientoVariableListadoFila['estado']): MovimientoVariableListadoFila {
  return {
    idMovimiento: 1,
    idPersona: 1,
    idConcepto: 1,
    periodo: '2026-05',
    monto: 1000,
    estado,
    origen: 'MANUAL',
  };
}

describe('proceso-mensual-prevalidacion.rules', () => {
  it('periodo invalido -> BLOQUEADO y bloqueo de formato', () => {
    const r = construirPrevalidacionMensual(
      baseHechos({
        periodo: '2026-13',
        ultimoPg: null,
        periodoRem: null,
      }),
    );
    expect(r.estado).toBe('BLOQUEADO');
    expect(r.bloqueos.some((b) => b.codigo === 'PERIODO_FORMATO_INVALIDO')).toBe(true);
  });

  it('sin parametros integrados (sin fila) -> BLOQUEADO', () => {
    const r = construirPrevalidacionMensual(
      baseHechos({
        ultimoPg: null,
        periodoRem: null,
      }),
    );
    expect(r.estado).toBe('BLOQUEADO');
    expect(r.bloqueos.some((b) => b.codigo === 'PARAMETROS_SIN_FILA')).toBe(true);
  });

  it('solo movimientos VALIDADO -> no bloquea por variables', () => {
    const r = construirPrevalidacionMensual(
      baseHechos({
        movimientos: [mv('VALIDADO')],
      }),
    );
    expect(r.bloqueos.filter((b) => b.area === 'MOVIMIENTOS_VARIABLES').length).toBe(0);
    expect(r.advertencias.filter((a) => a.codigo === 'MV_BORRADOR').length).toBe(0);
  });

  it('movimientos BORRADOR -> advertencia MV_BORRADOR', () => {
    const r = construirPrevalidacionMensual(
      baseHechos({
        movimientos: [mv('BORRADOR')],
      }),
    );
    expect(r.advertencias.some((a) => a.codigo === 'MV_BORRADOR')).toBe(true);
    expect(r.estado).toBe('CON_ADVERTENCIAS');
  });

  it('movimientos OBSERVADO -> bloqueo', () => {
    const r = construirPrevalidacionMensual(
      baseHechos({
        movimientos: [mv('OBSERVADO')],
      }),
    );
    expect(r.estado).toBe('BLOQUEADO');
    expect(r.bloqueos.some((b) => b.codigo === 'MV_OBSERVADO')).toBe(true);
  });

  it('movimientos ANULADO -> ignorado para bloqueos/advertencias de MV', () => {
    const r = construirPrevalidacionMensual(
      baseHechos({
        movimientos: [mv('ANULADO')],
      }),
    );
    expect(r.bloqueos.filter((b) => b.area === 'MOVIMIENTOS_VARIABLES').length).toBe(0);
    expect(r.advertencias.filter((a) => a.area === 'MOVIMIENTOS_VARIABLES').length).toBe(0);
  });

  it('combinacion de bloqueos -> BLOQUEADO', () => {
    const r = construirPrevalidacionMensual(
      baseHechos({
        ultimoPg: null,
        movimientos: [mv('OBSERVADO')],
      }),
    );
    expect(r.estado).toBe('BLOQUEADO');
    expect(r.bloqueos.length).toBeGreaterThan(1);
  });

  it('solo advertencias reales -> CON_ADVERTENCIAS (INFO no cuenta)', () => {
    const r = construirPrevalidacionMensual(
      baseHechos({
        empleadosActivosNoAptos: 1,
        movimientos: [mv('VALIDADO')],
      }),
    );
    expect(r.estado).toBe('CON_ADVERTENCIAS');
    expect(r.informaciones.length).toBeGreaterThan(0);
  });

  it('sin bloqueos ni advertencias -> LISTO_PARA_CALCULO', () => {
    const r = construirPrevalidacionMensual(baseHechos());
    expect(r.estado).toBe('LISTO_PARA_CALCULO');
    expect(r.bloqueos.length).toBe(0);
    expect(r.advertencias.length).toBe(0);
    expect(r.resumen.parametrosOperativos).toBe(true);
  });

  it('recurrentes invalidas -> BLOQUEADO', () => {
    const r = construirPrevalidacionMensual(
      baseHechos({
        recurrentesConteo: { lectura: 'ok', aplicables: 0, invalidas: 2, cerradas: 0, fueraDelMes: 0 },
      }),
    );
    expect(r.estado).toBe('BLOQUEADO');
    expect(r.bloqueos.some((b) => b.codigo === 'RECURRENTES_INVALIDAS')).toBe(true);
  });

  it('recurrentes aplicables sin invalidas -> no bloquea por recurrentes', () => {
    const r = construirPrevalidacionMensual(
      baseHechos({
        recurrentesConteo: { lectura: 'ok', aplicables: 3, invalidas: 0, cerradas: 1, fueraDelMes: 2 },
      }),
    );
    expect(r.bloqueos.some((b) => b.codigo === 'RECURRENTES_INVALIDAS')).toBe(false);
  });
});
