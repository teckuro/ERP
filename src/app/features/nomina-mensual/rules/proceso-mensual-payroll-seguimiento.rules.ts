import type {
  ProcesoMensualPreNominaPeriodo,
  ProcesoMensualPrevalidacion,
} from '../models/proceso-mensual.model';
import {
  formatoFechaHoraNomina,
  formatoMontoNomina,
} from '../containers/proceso-mensual-container/utils/proceso-mensual-presentacion.formato';
import {
  claseChipRevision,
  etiquetaConceptoEntrada,
  etiquetaEstadoBaseTrabajador,
  etiquetaEstadoEntrada,
  etiquetaTipoEntrada,
} from '../containers/proceso-mensual-container/utils/proceso-mensual-presentacion.labels';
import type { ExpedienteNominaPeriodoView } from './proceso-mensual-expediente-periodo.rules';
import { mapExpedienteTrabajadoresARows } from './proceso-mensual-expediente-periodo.rules';
import { limpiarCopyTecnicoNomina } from './proceso-mensual-copy-limpio.rules';
import type { IncidenciaPeriodo } from './proceso-mensual-incidencias-periodo.rules';
import { incidenciasAFilasObservacionNomina } from './proceso-mensual-incidencias-periodo.rules';
import type {
  FilaDetalleMovimientoNomina,
  FilaDetalleObservacionNomina,
  FilaDetalleRecurrenteNomina,
  FilaDetalleResultadoNomina,
  ItemSeguimientoNomina,
  FilaDetalleTrabajadorNomina,
  ResultadoPreliminarView,
  TrabajadorResultadoPreliminarView,
} from '../containers/proceso-mensual-container/models/proceso-mensual-container.vm';
import type { NominaCalculoPeriodoSnapshot } from '../models/proceso-mensual.model';

export interface EntradaFilasDetalleTrabajadorNomina {
  base: ProcesoMensualPreNominaPeriodo['trazabilidad'] | null;
  expediente: ExpedienteNominaPeriodoView;
  resultadoTrabajadores: TrabajadorResultadoPreliminarView[];
}

export function construirFilasDetalleTrabajadorNomina(input: EntradaFilasDetalleTrabajadorNomina): FilaDetalleTrabajadorNomina[] {
  const base = input.base;
  if (base?.trabajadores.length) {
    return base.trabajadores.map((trabajador) => ({
      trabajador: trabajador.trabajadorLabel || 'Trabajador sin ficha visible',
      rut: trabajador.rutLabel || 'RUT no disponible',
      estado: etiquetaEstadoBaseTrabajador(trabajador.estado),
      observacion: limpiarCopyTecnicoNomina(trabajador.observacion) || 'Sin observaciones',
      accion: trabajador.estado === 'bloqueado' || trabajador.estado === 'excluido'
        ? 'Revisar ficha del trabajador'
        : trabajador.estado === 'con_observaciones'
          ? 'Revisar antes de confirmar'
          : 'Sin acción pendiente',
    }));
  }

  if (input.expediente.trabajadores.length) {
    return mapExpedienteTrabajadoresARows(input.expediente);
  }

  return input.resultadoTrabajadores.map((trabajador) => ({
    trabajador: trabajador.trabajadorLabel,
    rut: trabajador.rutLabel,
    estado: trabajador.estadoLabel,
    observacion: limpiarCopyTecnicoNomina(trabajador.observacionLabel),
    accion: limpiarCopyTecnicoNomina(trabajador.accionLabel ?? 'Sin acción pendiente'),
  }));
}

function buildTrabajadorLabelPorId(
  base: ProcesoMensualPreNominaPeriodo['trazabilidad'] | null,
  resultadoTrabajadores: TrabajadorResultadoPreliminarView[],
): Map<number, string> {
  const trabajadores = new Map<number, string>();
  for (const trabajador of base?.trabajadores ?? []) {
    trabajadores.set(trabajador.idPersona, trabajador.trabajadorLabel || 'Trabajador sin ficha visible');
  }
  for (const trabajador of resultadoTrabajadores) {
    if (typeof trabajador.idPersona === 'number') {
      trabajadores.set(trabajador.idPersona, trabajador.trabajadorLabel);
    }
  }
  return trabajadores;
}

export interface EntradaFilasDetalleMovimientoNomina {
  entradasMensuales: ProcesoMensualPrevalidacion['entradasMensuales'] | null | undefined;
  base: ProcesoMensualPreNominaPeriodo['trazabilidad'] | null;
  resultadoTrabajadores: TrabajadorResultadoPreliminarView[];
}

export function construirFilasDetalleMovimientoNomina(input: EntradaFilasDetalleMovimientoNomina): FilaDetalleMovimientoNomina[] {
  const trabajadorPorId = buildTrabajadorLabelPorId(input.base, input.resultadoTrabajadores);
  return (input.entradasMensuales ?? [])
    .filter((entrada) => entrada.origen !== 'recurrente')
    .map((entrada) => ({
      trabajador: trabajadorPorId.get(entrada.idPersona) ?? 'Trabajador por revisar',
      concepto: etiquetaConceptoEntrada(entrada.idConcepto, entrada.tipoMovimiento, entrada.categoria),
      tipo: etiquetaTipoEntrada(entrada.tipoEntrada),
      monto: formatoMontoNomina(entrada.monto),
      estado: etiquetaEstadoEntrada(entrada.estado),
      accion: entrada.bloqueaProceso || entrada.requiereRevision ? 'Revisar movimiento del mes' : 'Sin acción pendiente',
    }));
}

export function construirFilasDetalleRecurrenteNomina(input: EntradaFilasDetalleMovimientoNomina): FilaDetalleRecurrenteNomina[] {
  const trabajadorPorId = buildTrabajadorLabelPorId(input.base, input.resultadoTrabajadores);
  const recurrentesDesdeEntradas = (input.entradasMensuales ?? [])
    .filter((entrada) => entrada.origen === 'recurrente')
    .map<FilaDetalleRecurrenteNomina>((entrada) => ({
      trabajador: trabajadorPorId.get(entrada.idPersona) ?? 'Trabajador por revisar',
      concepto: etiquetaConceptoEntrada(entrada.idConcepto, entrada.tipoMovimiento, entrada.categoria),
      periodicidad: 'Mensual',
      monto: formatoMontoNomina(entrada.monto),
      estado: etiquetaEstadoEntrada(entrada.estado),
      accion: entrada.bloqueaProceso || entrada.requiereRevision ? 'Revisar asignación recurrente' : 'Sin acción pendiente',
    }));

  if (recurrentesDesdeEntradas.length) {
    return recurrentesDesdeEntradas;
  }

  return (input.base?.trabajadores ?? [])
    .filter((trabajador) => trabajador.asignacionesRecurrentes > 0)
    .map((trabajador) => ({
      trabajador: trabajador.trabajadorLabel || 'Trabajador sin ficha visible',
      concepto: `${trabajador.asignacionesRecurrentes} asignación(es) recurrente(s)`,
      periodicidad: 'Mensual',
      monto: 'Ver detalle en recurrentes',
      estado: trabajador.estado === 'bloqueado' ? 'Por revisar' : 'Considerada',
      accion: 'Ir a asignaciones recurrentes',
    }));
}

export interface EntradaFilasDetalleObservacionNomina {
  incidencias: IncidenciaPeriodo[];
}

export function construirFilasDetalleObservacionNomina(input: EntradaFilasDetalleObservacionNomina): FilaDetalleObservacionNomina[] {
  return incidenciasAFilasObservacionNomina(input.incidencias);
}

export interface EntradaSeguimientoParametrosNomina {
  parametrosListos: boolean | null;
  tieneIncidenciasParametros: boolean;
}

export function construirItemsSeguimientoParametrosNomina(input: EntradaSeguimientoParametrosNomina): ItemSeguimientoNomina[] {
  const parametrosListos = input.parametrosListos;
  const requiereRevision = input.tieneIncidenciasParametros || parametrosListos === false;
  return [{
    titulo: requiereRevision ? 'Parámetros del período' : 'Parámetros revisados',
    descripcion: parametrosListos == null
      ? 'Genera la nómina mensual para evaluar parámetros del período.'
      : requiereRevision
        ? 'Revise catálogos y valores del período en el resumen de pendientes.'
        : 'Los parámetros mínimos del período están disponibles para la nómina.',
    estado: parametrosListos == null ? 'Sin evaluar' : requiereRevision ? 'Revisar' : 'Revisados',
    estadoClase: parametrosListos == null
      ? 'payroll-state-chip payroll-state-chip--warning'
      : requiereRevision
        ? 'payroll-state-chip payroll-state-chip--warning'
        : 'payroll-state-chip payroll-state-chip--success',
    accion: 'Abrir parámetros',
    ruta: '/parametros',
  }];
}

export function construirItemsSeguimientoMovimientoRecurrenteNomina(
  movimientos: FilaDetalleMovimientoNomina[],
  recurrentes: FilaDetalleRecurrenteNomina[],
): ItemSeguimientoNomina[] {
  const items = [
    ...movimientos.map((row) => ({
      titulo: row.concepto,
      descripcion: `${row.trabajador} · ${row.tipo} · ${row.monto}`,
      estado: row.estado,
      estadoClase: claseChipRevision(row.estado),
      accion: row.accion === 'Sin acción pendiente' ? 'Ver movimientos' : row.accion,
      ruta: '/remuneraciones/novedades-mensuales',
    })),
    ...recurrentes.map((row) => ({
      titulo: row.concepto,
      descripcion: `${row.trabajador} · ${row.periodicidad} · ${row.monto}`,
      estado: row.estado,
      estadoClase: claseChipRevision(row.estado),
      accion: row.accion === 'Sin acción pendiente' ? 'Ver recurrentes' : row.accion,
      ruta: '/remuneraciones/haberes-descuentos',
    })),
  ].slice(0, 12);

  if (items.length) return items;

  return [{
    titulo: 'Movimientos y recurrentes',
    descripcion: 'No hay movimientos del mes ni asignaciones recurrentes aplicables visibles para este período.',
    estado: 'Sin movimientos',
    estadoClase: 'payroll-state-chip payroll-state-chip--info',
    accion: 'Abrir movimientos',
    ruta: '/remuneraciones/novedades-mensuales',
  }];
}

export interface EntradaSeguimientoResultadoNomina {
  resultado: ResultadoPreliminarView;
  snapshot: NominaCalculoPeriodoSnapshot | null;
}

export function construirItemsSeguimientoResultadoNomina(input: EntradaSeguimientoResultadoNomina): ItemSeguimientoNomina[] {
  const { resultado, snapshot } = input;
  return [
    {
      titulo: 'Trabajadores calculados',
      descripcion: `${resultado.resumen.trabajadoresCalculados} trabajadores calculados, ${resultado.resumen.trabajadoresConObservaciones} con observaciones y ${resultado.resumen.trabajadoresOmitidos} omitidos.`,
      estado: resultado.estadoLabel,
      estadoClase: claseChipRevision(resultado.estadoLabel),
      accion: 'Revisar trabajadores',
    },
    {
      titulo: 'Totales preliminares',
      descripcion: `Haberes ${formatoMontoNomina(resultado.resumen.totalHaberes)} · Descuentos ${formatoMontoNomina(resultado.resumen.totalDescuentos)} · Líquido ${formatoMontoNomina(resultado.resumen.totalLiquido)}.`,
      estado: resultado.resumen.totalLiquido == null ? 'Sin resultado' : 'Calculado',
      estadoClase: resultado.resumen.totalLiquido == null ? 'payroll-state-chip payroll-state-chip--info' : 'payroll-state-chip payroll-state-chip--success',
      accion: 'Ver resumen',
    },
    {
      titulo: 'Versión revisable',
      descripcion: snapshot ? `Guardada el ${formatoFechaHoraNomina(snapshot.fechaGeneracion)}.` : 'Aún no existe una versión revisable guardada para confirmar.',
      estado: snapshot ? 'Guardada' : 'Pendiente',
      estadoClase: snapshot ? 'payroll-state-chip payroll-state-chip--success' : 'payroll-state-chip payroll-state-chip--warning',
      accion: snapshot ? 'Ver detalle' : 'Generar nómina',
    },
  ];
}

export function construirFilasDetalleResultadoNomina(resultado: ResultadoPreliminarView): FilaDetalleResultadoNomina[] {
  return resultado.trabajadores.map((trabajador) => ({
    trabajador: trabajador.trabajadorLabel,
    haberes: trabajador.haberesLabel,
    descuentos: trabajador.descuentosLabel,
    liquido: trabajador.liquidoLabel,
    estado: trabajador.estadoLabel,
    observacion: limpiarCopyTecnicoNomina(trabajador.observacionLabel),
  }));
}
