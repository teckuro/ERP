import type {
  ProcesoMensualPreNominaPeriodo,
  ProcesoMensualPrevalidacion,
} from '../models/proceso-mensual.model';

export function construirPreNominaPeriodo(
  prevalidacion: ProcesoMensualPrevalidacion,
  generadoEn: string,
): ProcesoMensualPreNominaPeriodo {
  const movimientosValidados = prevalidacion.resumen.conteoMovimientosPorEstado.VALIDADO ?? 0;
  const movimientosBorrador = prevalidacion.resumen.conteoMovimientosPorEstado.BORRADOR ?? 0;
  const entradas = prevalidacion.resumen.resumenEntradasMensuales;

  return {
    periodo: prevalidacion.periodo,
    estado: resolverEstadoPreNomina(prevalidacion),
    generadoEn,
    trabajadoresIncluidos: prevalidacion.resumen.trabajadoresActivosAptos,
    recurrentesIncluidos: prevalidacion.resumen.recurrentesAplicablesAlPeriodo,
    entradasMensualesAptas: entradas?.aptasPreNomina ?? 0,
    entradasMensualesPendientesRevision: entradas?.pendientesRevision ?? 0,
    entradasMensualesBloqueantes: entradas?.bloqueantes ?? 0,
    movimientosVariablesValidados: movimientosValidados,
    movimientosVariablesBorrador: movimientosBorrador,
    parametrosOperativos: prevalidacion.resumen.parametrosOperativos,
    codigosBloqueo: prevalidacion.bloqueos.map((b) => b.codigo),
    codigosAdvertencia: prevalidacion.advertencias.map((a) => a.codigo),
    origenPrevalidacion: prevalidacion.estado,
  };
}

function resolverEstadoPreNomina(
  prevalidacion: ProcesoMensualPrevalidacion,
): ProcesoMensualPreNominaPeriodo['estado'] {
  if (prevalidacion.estado === 'BLOQUEADO' || prevalidacion.bloqueos.length > 0) {
    return 'NO_GENERABLE';
  }

  if (prevalidacion.estado === 'CON_ADVERTENCIAS' || prevalidacion.advertencias.length > 0) {
    return 'GENERADA_CON_ADVERTENCIAS';
  }

  return 'GENERADA';
}
