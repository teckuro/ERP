import type {
  ProcesoMensualPreNominaPeriodo,
  ProcesoMensualPrevalidacion,
} from '../models/proceso-mensual.model';
import {
  formatoFechaHoraNomina,
  formatoMontoNomina,
} from '../containers/proceso-mensual-container/utils/proceso-mensual-presentacion.formato';
import {
  ambitoDesdeCodigo,
  claseChipRevision,
  clasePendienteVisual,
  etiquetaConceptoEntrada,
  etiquetaEstadoBaseTrabajador,
  etiquetaEstadoEntrada,
  etiquetaPendienteVisual,
  etiquetaTipoEntrada,
} from '../containers/proceso-mensual-container/utils/proceso-mensual-presentacion.labels';
import type { ExpedienteNominaPeriodoView } from './proceso-mensual-expediente-periodo.rules';
import { mapExpedienteTrabajadoresARows } from './proceso-mensual-expediente-periodo.rules';
import type { ProcesoMensualPendienteVm } from './proceso-mensual-estado-operativo.rules';
import type {
  PayrollMovementDetailRow,
  PayrollObservationDetailRow,
  PayrollRecurrentDetailRow,
  PayrollResultDetailRow,
  PayrollSeguimientoItem,
  PayrollWorkerDetailRow,
  ResultadoObservacionView,
  ResultadoPreliminarView,
  TrabajadorResultadoPreliminarView,
} from '../containers/proceso-mensual-container/models/proceso-mensual-container.vm';
import type { NominaCalculoPeriodoSnapshot } from '../models/proceso-mensual.model';

export interface BuildPayrollWorkerDetailRowsInput {
  base: ProcesoMensualPreNominaPeriodo['trazabilidad'] | null;
  expediente: ExpedienteNominaPeriodoView;
  resultadoTrabajadores: TrabajadorResultadoPreliminarView[];
}

export function buildPayrollWorkerDetailRows(input: BuildPayrollWorkerDetailRowsInput): PayrollWorkerDetailRow[] {
  const base = input.base;
  if (base?.trabajadores.length) {
    return base.trabajadores.map((trabajador) => ({
      trabajador: trabajador.trabajadorLabel || 'Trabajador sin ficha visible',
      rut: trabajador.rutLabel || 'RUT no disponible',
      estado: etiquetaEstadoBaseTrabajador(trabajador.estado),
      observacion: trabajador.observacion || 'Sin observaciones',
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
    observacion: trabajador.observacionLabel,
    accion: trabajador.accionLabel ?? 'Sin acción pendiente',
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

export interface BuildPayrollMovementDetailRowsInput {
  entradasMensuales: ProcesoMensualPrevalidacion['entradasMensuales'] | null | undefined;
  base: ProcesoMensualPreNominaPeriodo['trazabilidad'] | null;
  resultadoTrabajadores: TrabajadorResultadoPreliminarView[];
}

export function buildPayrollMovementDetailRows(input: BuildPayrollMovementDetailRowsInput): PayrollMovementDetailRow[] {
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

export function buildPayrollRecurrentDetailRows(input: BuildPayrollMovementDetailRowsInput): PayrollRecurrentDetailRow[] {
  const trabajadorPorId = buildTrabajadorLabelPorId(input.base, input.resultadoTrabajadores);
  const recurrentesDesdeEntradas = (input.entradasMensuales ?? [])
    .filter((entrada) => entrada.origen === 'recurrente')
    .map<PayrollRecurrentDetailRow>((entrada) => ({
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

function observacionGridDesdePendiente(
  item: ProcesoMensualPendienteVm,
  severidad: PayrollObservationDetailRow['severidad'],
): PayrollObservationDetailRow {
  return {
    severidad,
    ambito: ambitoDesdeCodigo(item.codigo),
    mensaje: item.descripcion || item.titulo,
    accion: item.accionLabel ?? (item.ruta ? 'Revisar origen' : 'Revisar en el período'),
  };
}

function observacionGridDesdeResultado(
  item: ResultadoObservacionView,
  severidad: PayrollObservationDetailRow['severidad'],
): PayrollObservationDetailRow {
  return {
    severidad,
    ambito: ambitoDesdeCodigo(item.codigo),
    mensaje: item.descripcion || item.titulo,
    accion: item.accionLabel ?? 'Revisar resultado preliminar',
  };
}

export interface BuildPayrollObservationDetailRowsInput {
  bloqueosOperativos: ProcesoMensualPendienteVm[];
  advertenciasOperativas: ProcesoMensualPendienteVm[];
  informacionesOperativas: ProcesoMensualPendienteVm[];
  resultadoBloqueos: ResultadoObservacionView[];
  resultadoAdvertencias: ResultadoObservacionView[];
}

export function buildPayrollObservationDetailRows(input: BuildPayrollObservationDetailRowsInput): PayrollObservationDetailRow[] {
  const rows: PayrollObservationDetailRow[] = [
    ...input.bloqueosOperativos.map((item) => observacionGridDesdePendiente(item, 'Bloqueo')),
    ...input.advertenciasOperativas.map((item) => observacionGridDesdePendiente(item, 'Advertencia')),
    ...input.informacionesOperativas.map((item) => observacionGridDesdePendiente(item, 'Información')),
  ];

  for (const item of input.resultadoBloqueos) {
    rows.push(observacionGridDesdeResultado(item, 'Bloqueo'));
  }
  for (const item of input.resultadoAdvertencias) {
    rows.push(observacionGridDesdeResultado(item, 'Advertencia'));
  }
  return rows;
}

export interface BuildPayrollParametroSeguimientoInput {
  bloqueos: ProcesoMensualPendienteVm[];
  advertencias: ProcesoMensualPendienteVm[];
  informaciones: ProcesoMensualPendienteVm[];
  parametrosListos: boolean | null;
}

export function buildPayrollParametroSeguimientoItems(input: BuildPayrollParametroSeguimientoInput): PayrollSeguimientoItem[] {
  const items = [...input.bloqueos, ...input.advertencias, ...input.informaciones]
    .filter((item) => item.ruta === '/parametros' || ambitoDesdeCodigo(item.codigo) === 'Parámetros')
    .map((item) => ({
      titulo: item.titulo,
      descripcion: item.descripcion,
      estado: etiquetaPendienteVisual(item.severidad),
      estadoClase: clasePendienteVisual(item.severidad),
      accion: item.accionLabel ?? 'Revisar parámetros',
      ruta: item.ruta ?? '/parametros',
    }));

  if (items.length) return items;

  const parametrosListos = input.parametrosListos;
  return [{
    titulo: parametrosListos ? 'Parámetros revisados' : 'Parámetros del período',
    descripcion: parametrosListos == null
      ? 'Genera la nómina mensual para evaluar parámetros del período.'
      : parametrosListos
        ? 'Los parámetros mínimos del período están disponibles para la nómina.'
        : 'Hay parámetros del período que requieren revisión antes de confirmar.',
    estado: parametrosListos ? 'Revisados' : parametrosListos == null ? 'Sin evaluar' : 'Revisar',
    estadoClase: parametrosListos ? 'payroll-state-chip payroll-state-chip--success' : 'payroll-state-chip payroll-state-chip--warning',
    accion: 'Abrir parámetros',
    ruta: '/parametros',
  }];
}

export function buildPayrollMovimientoRecurrenteSeguimientoItems(
  movimientos: PayrollMovementDetailRow[],
  recurrentes: PayrollRecurrentDetailRow[],
): PayrollSeguimientoItem[] {
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

export interface BuildPayrollResultadoSeguimientoInput {
  resultado: ResultadoPreliminarView;
  snapshot: NominaCalculoPeriodoSnapshot | null;
}

export function buildPayrollResultadoSeguimientoItems(input: BuildPayrollResultadoSeguimientoInput): PayrollSeguimientoItem[] {
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

export function buildPayrollResultDetailRows(resultado: ResultadoPreliminarView): PayrollResultDetailRow[] {
  return resultado.trabajadores.map((trabajador) => ({
    trabajador: trabajador.trabajadorLabel,
    haberes: trabajador.haberesLabel,
    descuentos: trabajador.descuentosLabel,
    liquido: trabajador.liquidoLabel,
    estado: trabajador.estadoLabel,
    observacion: trabajador.observacionLabel,
  }));
}
