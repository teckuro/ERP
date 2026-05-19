import type {
  MotorCalculoEstadoTrabajador,
  MotorCalculoSeveridad,
  NominaCalculoPeriodoSnapshot,
  NominaCalculoTrabajadorSnapshot,
  NominaSnapshotCompletoView,
} from '../models/proceso-mensual.model';
import {
  formatoFechaHoraNomina,
  formatoMontoNomina,
} from '../containers/proceso-mensual-container/utils/proceso-mensual-presentacion.formato';

export type ExpedienteNominaEstado =
  | 'sin_expediente'
  | 'cargando'
  | 'error_carga'
  | 'detalle_no_disponible'
  | 'version_guardada'
  | 'confirmada';

export type ExpedienteTrabajadorEstado = 'listo' | 'con_observaciones' | 'bloqueado' | 'omitido';

export interface ExpedienteNominaPeriodoView {
  visible: boolean;
  estado: ExpedienteNominaEstado;
  titulo: string;
  bajada: string;
  mensajeEstado: string | null;
  snapshot: {
    versionEtiqueta: string;
    estado: string;
    periodo: string;
    fechaGeneracion: string;
    fechaConfirmacion: string | null;
    responsable: string | null;
  } | null;
  totales: {
    trabajadores: number;
    haberes: number;
    descuentos: number;
    liquido: number;
    bloqueos: number;
    advertencias: number;
  } | null;
  trabajadores: Array<{
    idPersona: number | string;
    nombre: string;
    rut: string;
    estado: ExpedienteTrabajadorEstado;
    totalHaberes: number;
    totalDescuentos: number;
    totalLiquido: number;
    observaciones: string[];
  }>;
  problemas: Array<{
    severidad: 'bloqueo' | 'advertencia' | 'info';
    trabajador: string | null;
    titulo: string;
    detalle: string;
    origen: string | null;
  }>;
  secciones: Array<{ titulo: string; items: string[] }>;
  accionPrincipal: {
    label: string;
    accion: 'revisar_trabajadores' | 'confirmar_nomina' | 'generar_liquidaciones' | 'revisar_liquidaciones';
  } | null;
}

export interface BuildExpedienteNominaPeriodoInput {
  snapshotActivo: NominaCalculoPeriodoSnapshot | null;
  snapshotCompleto: NominaSnapshotCompletoView | null;
  consultandoSnapshotCompleto: boolean;
  errorSnapshotCompleto: string | null;
  nominaCerrada: boolean;
  liquidacionesDisponibles: boolean;
}

function etiquetaEstadoTrabajador(estado: MotorCalculoEstadoTrabajador): ExpedienteTrabajadorEstado {
  switch (estado) {
    case 'con_advertencias':
      return 'con_observaciones';
    case 'con_bloqueos':
      return 'bloqueado';
    case 'calculado_preliminar':
    default:
      return 'listo';
  }
}

function etiquetaEstadoTrabajadorVisible(estado: ExpedienteTrabajadorEstado): string {
  switch (estado) {
    case 'con_observaciones':
      return 'Con observaciones';
    case 'bloqueado':
      return 'Bloqueado';
    case 'omitido':
      return 'Omitido';
    default:
      return 'Listo';
  }
}

function severidadIssue(severidad: MotorCalculoSeveridad): 'bloqueo' | 'advertencia' | 'info' {
  if (severidad === 'BLOQUEO') return 'bloqueo';
  if (severidad === 'ADVERTENCIA') return 'advertencia';
  return 'info';
}

function mapTrabajadorExpediente(trabajador: NominaCalculoTrabajadorSnapshot) {
  const estado = etiquetaEstadoTrabajador(trabajador.estado);
  return {
    idPersona: trabajador.idPersona,
    nombre: trabajador.nombreCompletoSnapshot?.trim() || 'Trabajador sin ficha visible',
    rut: trabajador.rut?.trim() || 'RUT no disponible',
    estado,
    estadoLabel: etiquetaEstadoTrabajadorVisible(estado),
    totalHaberes: trabajador.totalHaberesImponibles + trabajador.totalHaberesNoImponibles,
    totalDescuentos: trabajador.totalDescuentosLegales + trabajador.totalDescuentosVoluntarios,
    totalLiquido: trabajador.liquidoPreliminar,
    observaciones: trabajador.issues.slice(0, 5).map((issue) => issue.mensaje),
  };
}

export function buildExpedienteNominaPeriodo(input: BuildExpedienteNominaPeriodoInput): ExpedienteNominaPeriodoView {
  const vacio: ExpedienteNominaPeriodoView = {
    visible: false,
    estado: 'sin_expediente',
    titulo: 'Sin expediente del período',
    bajada: 'Genera la nómina mensual para registrar la versión revisable del período.',
    mensajeEstado: null,
    snapshot: null,
    totales: null,
    trabajadores: [],
    problemas: [],
    secciones: [],
    accionPrincipal: null,
  };

  if (!input.snapshotActivo) {
    return vacio;
  }

  const cabecera = input.snapshotCompleto?.cabecera ?? input.snapshotActivo;
  const cierre = input.snapshotCompleto?.cierreOperativo ?? input.snapshotActivo.cierreOperativo;

  if (input.consultandoSnapshotCompleto && !input.snapshotCompleto) {
    return {
      ...vacio,
      visible: true,
      estado: 'cargando',
      titulo: 'Cargando expediente del período',
      bajada: 'Estamos recuperando la versión guardada y su detalle desde el respaldo del período.',
      mensajeEstado: 'Cargando detalle de la nómina…',
    };
  }

  if (input.errorSnapshotCompleto) {
    return {
      ...vacio,
      visible: true,
      estado: 'error_carga',
      titulo: 'No se pudo cargar el detalle',
      bajada: 'La versión del período está registrada, pero el detalle no se pudo consultar.',
      mensajeEstado: input.errorSnapshotCompleto,
      snapshot: {
        versionEtiqueta: cabecera.hashSnapshot ? 'Versión guardada' : 'Versión del período',
        estado: cabecera.estado,
        periodo: cabecera.periodo,
        fechaGeneracion: formatoFechaHoraNomina(cabecera.fechaGeneracion),
        fechaConfirmacion: cierre ? formatoFechaHoraNomina(cierre.fecha) : null,
        responsable: cierre?.usuarioLabel ?? cabecera.usuarioGenerador,
      },
      totales: {
        trabajadores: cabecera.totalTrabajadores,
        haberes: cabecera.totalHaberes,
        descuentos: cabecera.totalDescuentos,
        liquido: cabecera.totalLiquido,
        bloqueos: cabecera.totalBloqueados,
        advertencias: cabecera.totalAdvertencias,
      },
    };
  }

  const trabajadoresFuente = input.snapshotCompleto?.trabajadores ?? [];
  const sinDetalle =
    trabajadoresFuente.length === 0 &&
    (cabecera.totalTrabajadores > 0 || (input.snapshotCompleto?.resumen.totalTrabajadoresSinDetalle ?? 0) > 0);

  if (sinDetalle) {
    return {
      ...vacio,
      visible: true,
      estado: 'detalle_no_disponible',
      titulo: 'Versión guardada sin detalle consultable',
      bajada: 'La versión existe en el período, pero no hay trabajadores asociados en el respaldo.',
      mensajeEstado:
        'La versión revisable quedó registrada, pero el detalle de trabajadores no está disponible. Revise con soporte si el total de trabajadores no coincide.',
      snapshot: {
        versionEtiqueta: 'Versión guardada para revisión',
        estado: cabecera.estado,
        periodo: cabecera.periodo,
        fechaGeneracion: formatoFechaHoraNomina(cabecera.fechaGeneracion),
        fechaConfirmacion: cierre ? formatoFechaHoraNomina(cierre.fecha) : null,
        responsable: cabecera.usuarioGenerador,
      },
      totales: {
        trabajadores: cabecera.totalTrabajadores,
        haberes: cabecera.totalHaberes,
        descuentos: cabecera.totalDescuentos,
        liquido: cabecera.totalLiquido,
        bloqueos: cabecera.totalBloqueados,
        advertencias: cabecera.totalAdvertencias,
      },
      secciones: [
        {
          titulo: 'Qué puede hacer',
          items: [
            'Cerrar y volver a la consola del período.',
            'Reintentar la consulta del detalle si acaba de guardar.',
            'Contactar soporte si el problema persiste.',
          ],
        },
      ],
    };
  }

  const trabajadores = trabajadoresFuente.map(mapTrabajadorExpediente);
  const trabajadorPorId = new Map(
    trabajadoresFuente
      .filter((t): t is NominaCalculoTrabajadorSnapshot & { idCalculoTrabajador: number } =>
        typeof t.idCalculoTrabajador === 'number',
      )
      .map((t) => [t.idCalculoTrabajador, `${t.nombreCompletoSnapshot} · ${t.rut}`]),
  );

  const observaciones = input.snapshotCompleto?.observaciones ?? [];
  const problemas = observaciones.slice(0, 12).map((obs) => ({
    severidad: severidadIssue(obs.severidad),
    trabajador:
      obs.idCalculoTrabajador == null
        ? null
        : trabajadorPorId.get(obs.idCalculoTrabajador) ?? 'Trabajador del período',
    titulo: obs.codigo,
    detalle: obs.mensaje,
    origen: obs.origen,
  }));

  const confirmada = input.nominaCerrada || cierre?.estado === 'cerrado_operativamente';
  const estado: ExpedienteNominaEstado = confirmada ? 'confirmada' : 'version_guardada';

  const secciones: Array<{ titulo: string; items: string[] }> = [
    {
      titulo: 'Resumen de la versión',
      items: [
        `Período ${cabecera.periodo}`,
        `Generada ${formatoFechaHoraNomina(cabecera.fechaGeneracion)}`,
        `${trabajadores.length} trabajador${trabajadores.length === 1 ? '' : 'es'} en detalle`,
        `Líquido ${formatoMontoNomina(cabecera.totalLiquido)}`,
      ],
    },
  ];

  if (problemas.length) {
    secciones.push({
      titulo: 'Observaciones del período',
      items: problemas.slice(0, 4).map((p) => p.detalle),
    });
  }

  if (confirmada && cierre) {
    secciones.push({
      titulo: 'Confirmación operativa',
      items: [
        `Confirmada ${formatoFechaHoraNomina(cierre.fecha)}`,
        cierre.usuarioLabel,
        'Esta versión es la base oficial para generar liquidaciones.',
      ],
    });
  }

  let accionPrincipal: ExpedienteNominaPeriodoView['accionPrincipal'] = {
    label: 'Revisar trabajadores',
    accion: 'revisar_trabajadores',
  };
  if (confirmada && input.liquidacionesDisponibles) {
    accionPrincipal = { label: 'Revisar liquidaciones', accion: 'revisar_liquidaciones' };
  } else if (confirmada) {
    accionPrincipal = { label: 'Generar liquidaciones', accion: 'generar_liquidaciones' };
  } else if (!confirmada) {
    accionPrincipal = { label: 'Confirmar nómina', accion: 'confirmar_nomina' };
  }

  return {
    visible: true,
    estado,
    titulo: confirmada ? 'Nómina confirmada' : 'Versión guardada para revisión',
    bajada: confirmada
      ? 'Esta versión quedó confirmada como base oficial del período para liquidaciones.'
      : 'Revise trabajadores, observaciones y totales antes de confirmar la nómina mensual.',
    mensajeEstado: null,
    snapshot: {
      versionEtiqueta: confirmada ? 'Versión oficial del período' : 'Versión guardada para revisión',
      estado: cabecera.estado,
      periodo: cabecera.periodo,
      fechaGeneracion: formatoFechaHoraNomina(cabecera.fechaGeneracion),
      fechaConfirmacion: cierre ? formatoFechaHoraNomina(cierre.fecha) : null,
      responsable: cierre?.usuarioLabel ?? cabecera.usuarioGenerador,
    },
    totales: {
      trabajadores: trabajadores.length || cabecera.totalTrabajadores,
      haberes: cabecera.totalHaberes,
      descuentos: cabecera.totalDescuentos,
      liquido: cabecera.totalLiquido,
      bloqueos: cabecera.totalBloqueados,
      advertencias: cabecera.totalAdvertencias,
    },
    trabajadores,
    problemas,
    secciones,
    accionPrincipal,
  };
}

export function mapExpedienteTrabajadoresARows(
  expediente: ExpedienteNominaPeriodoView,
): Array<{
  trabajador: string;
  rut: string;
  estado: string;
  observacion: string;
  accion: string;
}> {
  return expediente.trabajadores.map((t) => ({
    trabajador: t.nombre,
    rut: t.rut,
    estado:
      t.estado === 'listo'
        ? 'Listo'
        : t.estado === 'con_observaciones'
          ? 'Con observaciones'
          : t.estado === 'bloqueado'
            ? 'Bloqueado'
            : 'Omitido',
    observacion: t.observaciones[0] ?? 'Sin observaciones',
    accion:
      t.estado === 'bloqueado' || t.estado === 'omitido'
        ? 'Revisar ficha del trabajador'
        : t.estado === 'con_observaciones'
          ? 'Revisar antes de confirmar'
          : 'Sin acción pendiente',
  }));
}
