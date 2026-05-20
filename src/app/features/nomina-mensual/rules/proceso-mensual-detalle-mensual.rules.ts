import type {
  NominaDetalleMensualAmbito,
  NominaDetalleMensualExpedienteRow,
  NominaDetalleMensualMovimientoRow,
  NominaDetalleMensualPendienteRow,
  NominaDetalleMensualTrabajadorRow,
  NominaHistorialTablaRow,
  NominaWorkspaceDetailSeverity,
  PayrollMovementDetailRow,
  PayrollRecurrentDetailRow,
  PayrollResultDetailRow,
  PayrollWorkerDetailRow,
  DetalleOperativoTab,
} from '../containers/proceso-mensual-container/models/proceso-mensual-container.vm';
import type { IncidenciasPeriodoView } from './proceso-mensual-incidencias-periodo.rules';

const SEVERITY_ORDER: Record<NominaWorkspaceDetailSeverity, number> = {
  bloqueo: 0,
  atencion: 1,
  neutral: 2,
  listo: 3,
};

function severityDesdeEstado(estado: string): NominaWorkspaceDetailSeverity {
  const text = estado.toLowerCase();
  if (text.includes('bloque') || text.includes('omitido')) return 'bloqueo';
  if (text.includes('revis') || text.includes('pendiente') || text.includes('observ')) return 'atencion';
  if (text.includes('listo') || text.includes('aprob') || text.includes('generad') || text.includes('confirm')) {
    return 'listo';
  }
  return 'neutral';
}

export function buildNominaDetalleMensualMovimientosRows(input: {
  movimientos: PayrollMovementDetailRow[];
  recurrentes: PayrollRecurrentDetailRow[];
  periodoEtiqueta: string;
}): NominaDetalleMensualMovimientoRow[] {
  const mensual = input.movimientos.map((row) => ({
    estado: row.estado,
    tipo: row.tipo,
    trabajador: row.trabajador,
    concepto: row.concepto,
    origenDuracion: 'Este mes',
    vigencia: input.periodoEtiqueta,
    monto: row.monto,
    accion: row.accion === 'Sin acción pendiente' ? 'Ver' : row.accion,
  }));

  const recurrente = input.recurrentes.map((row) => ({
    estado: row.estado,
    tipo: row.concepto.includes('descuento') ? 'Descuento' : 'Haber',
    trabajador: row.trabajador,
    concepto: row.concepto,
    origenDuracion: 'Recurrente',
    vigencia: row.periodicidad === 'Mensual' ? 'Vigente' : row.periodicidad,
    monto: row.monto,
    accion: row.accion === 'Sin acción pendiente' ? 'Ver' : row.accion,
  }));

  return [...mensual, ...recurrente].sort(
    (a, b) => SEVERITY_ORDER[severityDesdeEstado(a.estado)] - SEVERITY_ORDER[severityDesdeEstado(b.estado)]
      || a.trabajador.localeCompare(b.trabajador, 'es'),
  );
}

function resolverIdPersonaPorNombre(
  trabajador: string,
  idPersonaPorNombre?: ReadonlyMap<string, number | string>,
): number | string | undefined {
  if (!idPersonaPorNombre?.size) {
    return undefined;
  }
  return idPersonaPorNombre.get(trabajador.trim().toLowerCase());
}

export function buildNominaDetalleMensualTrabajadorRows(input: {
  workers: PayrollWorkerDetailRow[];
  resultados: PayrollResultDetailRow[];
  idPersonaPorNombre?: ReadonlyMap<string, number | string>;
}): NominaDetalleMensualTrabajadorRow[] {
  if (input.resultados.length) {
    return input.resultados.map((row) => ({
      estado: row.estado,
      trabajador: row.trabajador,
      situacion: row.observacion,
      haberes: row.haberes,
      descuentos: row.descuentos,
      liquidoEstimado: row.liquido,
      accion: row.estado === 'Listo' || row.estado === 'Calculado' ? 'Ver' : 'Revisar',
      idPersona: resolverIdPersonaPorNombre(row.trabajador, input.idPersonaPorNombre),
    }));
  }

  return input.workers.map((row) => ({
    estado: row.estado,
    trabajador: row.trabajador,
    situacion: row.observacion,
    haberes: '—',
    descuentos: '—',
    liquidoEstimado: '—',
    accion: row.accion === 'Sin acción pendiente' ? 'Ver' : row.accion,
    idPersona: resolverIdPersonaPorNombre(row.trabajador, input.idPersonaPorNombre),
  }));
}

function ambitoDesdeIncidenciaAmbito(ambito: string): NominaDetalleMensualAmbito {
  switch (ambito) {
    case 'parametros':
      return 'Parámetro';
    case 'movimientos':
    case 'recurrentes':
      return 'Movimiento';
    case 'resultado':
      return 'Liquidación';
    case 'trabajadores':
      return 'Trabajador';
    default:
      return 'Observación';
  }
}

export function buildNominaDetalleMensualPendientesRows(
  incidencias: IncidenciasPeriodoView,
): NominaDetalleMensualPendienteRow[] {
  const items = incidencias.todas.filter((item) => item.severidad !== 'info');

  return items.map((item) => {
    const severity: NominaWorkspaceDetailSeverity =
      item.severidad === 'bloqueo' ? 'bloqueo' : 'atencion';
    const estado = severity === 'bloqueo' ? 'Bloqueado' : 'Revisar';
    const ambito = ambitoDesdeIncidenciaAmbito(item.ambito);
    const accionLabel = item.accion?.label ?? (
      ambito === 'Parámetro'
        ? 'Abrir parámetros'
        : ambito === 'Movimiento'
          ? 'Revisar movimiento'
          : 'Revisar'
    );
    const detalleTab =
      item.accion?.tipo === 'tab' && item.accion.destino
        ? (item.accion.destino as DetalleOperativoTab)
        : detalleTabDesdeAmbitoIncidencia(item.ambito);
    const ruta = item.accion?.tipo === 'ruta' ? item.accion.destino : undefined;

    return {
      estado,
      ambito,
      trabajador: 'Período',
      situacion: `${item.titulo}. ${item.detalle}`,
      accionRecomendada: accionLabel,
      accion: accionLabel,
      severity,
      detalleTab,
      ruta,
    };
  });
}

function detalleTabDesdeAmbitoIncidencia(ambito: string): DetalleOperativoTab {
  switch (ambito) {
    case 'parametros':
      return 'parametros';
    case 'trabajadores':
      return 'trabajadores';
    case 'movimientos':
    case 'recurrentes':
      return 'movimientos_recurrentes';
    case 'resultado':
      return 'resultado';
    default:
      return 'resumen';
  }
}

export function movimientoRowsAExpediente(
  rows: NominaDetalleMensualMovimientoRow[],
): NominaDetalleMensualExpedienteRow[] {
  return rows.map((row) => ({
    estado: row.estado,
    ambito: 'Movimiento',
    trabajador: row.trabajador,
    conceptoSituacion: row.concepto,
    origenDuracion: row.origenDuracion,
    vigencia: row.vigencia,
    monto: row.monto,
    accion: row.accion,
    severity: severityDesdeEstado(row.estado),
    detalleTab: 'movimientos_recurrentes' as DetalleOperativoTab,
  }));
}

export function trabajadorRowsAExpediente(
  rows: NominaDetalleMensualTrabajadorRow[],
): NominaDetalleMensualExpedienteRow[] {
  return rows.map((row) => ({
    estado: row.estado,
    ambito: 'Trabajador',
    trabajador: row.trabajador,
    conceptoSituacion: row.situacion,
    origenDuracion: '—',
    vigencia: 'Período activo',
    monto: row.liquidoEstimado,
    accion: row.accion,
    severity: severityDesdeEstado(row.estado),
    detalleTab: 'trabajadores' as DetalleOperativoTab,
    idPersona: row.idPersona,
  }));
}

export function pendientesRowsAExpediente(
  rows: NominaDetalleMensualPendienteRow[],
): NominaDetalleMensualExpedienteRow[] {
  return rows.map((row) => ({
    estado: row.estado,
    ambito: row.ambito,
    trabajador: row.trabajador,
    conceptoSituacion: row.situacion,
    origenDuracion: '—',
    vigencia: '—',
    monto: '—',
    accion: row.accion,
    accionRecomendada: row.accionRecomendada,
    severity: row.severity,
    detalleTab: row.detalleTab,
    ruta: row.ruta,
  }));
}

export function buildNominaDetalleMensualTodosRows(input: {
  pendientes: NominaDetalleMensualPendienteRow[];
  movimientos: NominaDetalleMensualMovimientoRow[];
  trabajadores: NominaDetalleMensualTrabajadorRow[];
  liquidaciones: NominaDetalleMensualExpedienteRow[];
}): NominaDetalleMensualExpedienteRow[] {
  const bloqueos = pendientesRowsAExpediente(input.pendientes.filter((p) => p.severity === 'bloqueo'));
  const revision = pendientesRowsAExpediente(input.pendientes.filter((p) => p.severity !== 'bloqueo'));
  const trabListos = trabajadorRowsAExpediente(
    input.trabajadores.filter((t) => severityDesdeEstado(t.estado) === 'listo'),
  );
  const liqs = input.liquidaciones;

  return [...bloqueos, ...revision, ...trabListos, ...liqs].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
  );
}

export function buildNominaHistorialTablaRows(
  items: ReadonlyArray<{ hora: string; texto: string; destacado: boolean }>,
): NominaHistorialTablaRow[] {
  return items.map((item) => ({
    fecha: item.hora,
    etapa: item.destacado ? 'Cierre' : 'Registro',
    usuario: '—',
    resultado: item.destacado ? 'Confirmado' : 'Registrado',
    detalle: item.texto,
  }));
}
