import type {
  NominaDetalleMensualAmbito,
  NominaDetalleMensualExpedienteRow,
  NominaDetalleMensualMovimientoRow,
  NominaDetalleMensualPendienteRow,
  NominaDetalleMensualTrabajadorRow,
  NominaDetalleMensualVista,
  InformacionPeriodoView,
  NominaHistorialTablaRow,
  NominaWorkspaceDetailSeverity,
  FilaDetalleMovimientoNomina,
  FilaDetalleRecurrenteNomina,
  FilaDetalleResultadoNomina,
  FilaDetalleTrabajadorNomina,
  DetalleOperativoTab,
} from '../containers/proceso-mensual-container/models/proceso-mensual-container.vm';
import type { IncidenciasPeriodoView } from './proceso-mensual-incidencias-periodo.rules';
import { esIncidenciaPeriodoSinPendienteReal } from './proceso-mensual-incidencias-periodo.rules';

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
  movimientos: FilaDetalleMovimientoNomina[];
  recurrentes: FilaDetalleRecurrenteNomina[];
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
  workers: FilaDetalleTrabajadorNomina[];
  resultados: FilaDetalleResultadoNomina[];
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
  const items = incidencias.todas.filter(
    (item) =>
      item.severidad !== 'info'
      && !esIncidenciaPeriodoSinPendienteReal({ titulo: item.titulo, detalle: item.detalle, codigo: item.id }),
  );

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
      return 'trabajadores';
    case 'resultado':
      return 'resultado';
    default:
      return 'resumen';
  }
}

export function movimientoRowsAExpediente(
  rows: NominaDetalleMensualMovimientoRow[],
  idPersonaPorNombre?: ReadonlyMap<string, number | string>,
): NominaDetalleMensualExpedienteRow[] {
  return rows.map((row) => ({
    estado: row.estado,
    ambito: 'Movimiento',
    trabajador: row.trabajador,
    conceptoSituacion: row.concepto,
    origenDuracion: row.origenDuracion,
    vigencia: row.vigencia,
    monto: row.monto,
    accion: row.accion === 'Sin acción pendiente' ? 'Ver' : row.accion,
    severity: severityDesdeEstado(row.estado),
    detalleTab: 'trabajadores' as DetalleOperativoTab,
    idPersona: resolverIdPersonaPorNombre(row.trabajador, idPersonaPorNombre),
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

export type DetalleMensualAccionIcon =
  | 'file-spreadsheet'
  | 'users'
  | 'sliders-horizontal'
  | 'arrow-left-right'
  | 'eye'
  | 'external-link';

export interface DetalleMensualAccionUi {
  label: string;
  title: string;
  icon: DetalleMensualAccionIcon;
}

export function resolveDetalleMensualAccionUi(label: string | undefined | null): DetalleMensualAccionUi | null {
  const limpio = label?.trim();
  if (!limpio) {
    return null;
  }
  const normalizado = limpio.toLowerCase();
  let icon: DetalleMensualAccionIcon = 'external-link';
  if (normalizado.includes('generar')) {
    icon = 'file-spreadsheet';
  } else if (normalizado.includes('parámetro') || normalizado.includes('parametro')) {
    icon = 'sliders-horizontal';
  } else if (normalizado.includes('movimiento') || normalizado.includes('recurrente')) {
    icon = 'arrow-left-right';
  } else if (normalizado.includes('ficha') || normalizado.includes('trabajador')) {
    icon = 'users';
  } else if (normalizado.includes('revisar') || normalizado.includes('ver ')) {
    icon = 'eye';
  } else if (normalizado.includes('abrir')) {
    icon = 'external-link';
  }
  return {
    label: limpio,
    title: limpio,
    icon,
  };
}

export interface NominaDetalleMensualSituacionVm {
  bloqueos: NominaDetalleMensualPendienteRow[];
  porRevisar: NominaDetalleMensualPendienteRow[];
  totalAlertas: number;
}

/** Vista única del expediente en detalle mensual (sin pestañas Situación/Liquidaciones/Pendientes). */
export function normalizeDetalleMensualVistaExpediente(
  _vista: NominaDetalleMensualVista,
): 'trabajadores' {
  return 'trabajadores';
}

export interface ExpedienteCabeceraAlertasVm {
  bloqueos: number;
  advertencias: number;
  total: number;
  tieneAlertas: boolean;
}

export function buildExpedienteCabeceraAlertas(
  situacion: NominaDetalleMensualSituacionVm,
): ExpedienteCabeceraAlertasVm {
  const bloqueos = situacion.bloqueos.length;
  const advertencias = situacion.porRevisar.length;
  return {
    bloqueos,
    advertencias,
    total: bloqueos + advertencias,
    tieneAlertas: bloqueos + advertencias > 0,
  };
}

export function buildAlertasExpedienteInformacionView(
  situacion: NominaDetalleMensualSituacionVm,
): InformacionPeriodoView {
  const filas = [...situacion.bloqueos, ...situacion.porRevisar];
  const bloqueos = situacion.bloqueos.length;
  const advertencias = situacion.porRevisar.length;
  const tone = bloqueos > 0 ? 'danger' : 'warning';
  const bajada =
    bloqueos > 0 && advertencias > 0
      ? `${bloqueos} bloqueo${bloqueos === 1 ? '' : 's'} y ${advertencias} advertencia${advertencias === 1 ? '' : 's'} del período.`
      : bloqueos > 0
        ? `${bloqueos} bloqueo${bloqueos === 1 ? '' : 's'} que conviene resolver antes de continuar.`
        : `${advertencias} advertencia${advertencias === 1 ? '' : 's'} por revisar antes de continuar.`;

  return {
    tone,
    titulo: 'Alertas del período',
    bajada,
    soloAlertasExpediente: true,
    alertasExpediente: filas,
    secciones:
      bloqueos > 0 && advertencias > 0
        ? [
            { titulo: 'Críticos y bloqueos', items: situacion.bloqueos.map((f) => f.situacion) },
            { titulo: 'Por revisar', items: situacion.porRevisar.map((f) => f.situacion) },
          ]
        : undefined,
  };
}

export function buildNominaDetalleMensualSituacion(
  pendientes: NominaDetalleMensualPendienteRow[],
): NominaDetalleMensualSituacionVm {
  const bloqueos = pendientes.filter((p) => p.severity === 'bloqueo');
  const porRevisar = pendientes.filter((p) => p.severity !== 'bloqueo');
  return {
    bloqueos,
    porRevisar,
    totalAlertas: bloqueos.length + porRevisar.length,
  };
}

/** Solo alertas del período (vista Situación / compat expediente). Sin movimientos ni trabajadores. */
export function buildNominaDetalleMensualTodosRows(input: {
  pendientes: NominaDetalleMensualPendienteRow[];
  movimientos?: NominaDetalleMensualMovimientoRow[];
  trabajadores?: NominaDetalleMensualTrabajadorRow[];
  liquidaciones?: NominaDetalleMensualExpedienteRow[];
  idPersonaPorNombre?: ReadonlyMap<string, number | string>;
}): NominaDetalleMensualExpedienteRow[] {
  const bloqueos = pendientesRowsAExpediente(input.pendientes.filter((p) => p.severity === 'bloqueo'));
  const revision = pendientesRowsAExpediente(input.pendientes.filter((p) => p.severity !== 'bloqueo'));
  return [...bloqueos, ...revision].sort(
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
