import type { ProcesoMensualPrevalidacion } from '../models/proceso-mensual.model';

import { construirPreNominaPeriodo } from './proceso-mensual-prenomina.rules';

const resumenEntradasBase = {
  total: 2,
  recurrentes: 0,
  novedadesMensuales: 1,
  legacyMovimientos: 1,
  aprobadas: 2,
  pendientesRevision: 0,
  observadas: 0,
  rechazadas: 0,
  anuladas: 0,
  bloqueantes: 0,
  conWarnings: 0,
  aptasPreNomina: 2,
};

function prevalidacionBase(over: Partial<ProcesoMensualPrevalidacion> = {}): ProcesoMensualPrevalidacion {
  return {
    periodo: '2026-05',
    estado: 'LISTO_PARA_CALCULO',
    resumen: {
      periodo: '2026-05',
      hayBloqueos: false,
      hayAdvertencias: false,
      totalEntradasMensuales: 2,
      resumenEntradasMensuales: resumenEntradasBase,
      conteoEntradasPorEstado: { aprobada: 2 },
      conteoMovimientosPorEstado: { VALIDADO: 2 },
      trabajadoresActivosAptos: 3,
      trabajadoresActivosNoAptos: 0,
      parametrosOperativos: true,
      parametrosGrupos: [],
      recurrentesAplicablesAlPeriodo: 4,
      recurrentesInvalidas: 0,
      recurrentesCerradas: 0,
      recurrentesFueraDelMes: 0,
    },
    bloqueos: [],
    advertencias: [],
    informaciones: [],
    trabajadoresPendientesRevision: [],
    items: [],
    entradasMensuales: [],
    ...over,
  };
}

describe('proceso-mensual-prenomina.rules', () => {
  it('con prevalidacion lista construye pre-nomina generada sin montos', () => {
    const r = construirPreNominaPeriodo(prevalidacionBase(), '2026-05-05T10:00:00.000Z');

    expect(r.estado).toBe('GENERADA');
    expect(r.trabajadoresIncluidos).toBe(3);
    expect(r.recurrentesIncluidos).toBe(4);
    expect(r.entradasMensualesAptas).toBe(2);
    expect(r.movimientosVariablesValidados).toBe(2);
    expect(r.codigosBloqueo).toEqual([]);
  });

  it('con advertencias queda generada con advertencias', () => {
    const r = construirPreNominaPeriodo(
      prevalidacionBase({
        estado: 'CON_ADVERTENCIAS',
        advertencias: [
          {
            codigo: 'MV_BORRADOR',
            area: 'MOVIMIENTOS_VARIABLES',
            severidad: 'ADVERTENCIA',
            texto: 'Existen movimientos en borrador.',
          },
        ],
        resumen: {
          ...prevalidacionBase().resumen,
          hayAdvertencias: true,
          resumenEntradasMensuales: {
            ...resumenEntradasBase,
            pendientesRevision: 1,
            aptasPreNomina: 1,
          },
          conteoMovimientosPorEstado: { VALIDADO: 1, BORRADOR: 1 },
        },
      }),
      '2026-05-05T10:00:00.000Z',
    );

    expect(r.estado).toBe('GENERADA_CON_ADVERTENCIAS');
    expect(r.movimientosVariablesBorrador).toBe(1);
    expect(r.codigosAdvertencia).toEqual(['MV_BORRADOR']);
  });

  it('con bloqueos queda no generable', () => {
    const r = construirPreNominaPeriodo(
      prevalidacionBase({
        estado: 'BLOQUEADO',
        bloqueos: [
          {
            codigo: 'PARAMETROS_SIN_FILA',
            area: 'PARAMETROS',
            severidad: 'BLOQUEO',
            texto: 'Sin parametros.',
          },
        ],
        resumen: {
          ...prevalidacionBase().resumen,
          hayBloqueos: true,
          parametrosOperativos: false,
        },
      }),
      '2026-05-05T10:00:00.000Z',
    );

    expect(r.estado).toBe('NO_GENERABLE');
    expect(r.parametrosOperativos).toBe(false);
    expect(r.codigosBloqueo).toEqual(['PARAMETROS_SIN_FILA']);
  });
});
