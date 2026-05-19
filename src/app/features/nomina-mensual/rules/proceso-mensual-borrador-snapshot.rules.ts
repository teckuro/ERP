import type { EntradaMensualPeriodo } from '../entradas/models/entrada-mensual-periodo.model';
import type {
  BaseNominaTrazabilidad,
  BaseNominaTrabajadorEstado,
  BaseNominaTrabajadorResumen,
  BorradorPersistContext,
  MotorCalculoEstadoTrabajador,
  NominaCalculoIssueSnapshot,
  NominaCalculoPeriodoSnapshot,
  NominaCalculoTrabajadorSnapshot,
  NominaSnapshotCompletoView,
  ProcesoMensualMensaje,
  ProcesoMensualPreNominaPeriodo,
  ProcesoMensualPrevalidacion,
  ProcesoMensualResumen,
} from '../models/proceso-mensual.model';

export type { BorradorPersistContext };

export interface BuildBorradorSnapshotInput {
  periodo: string;
  preNomina: ProcesoMensualPreNominaPeriodo;
  prevalidacion: ProcesoMensualPrevalidacion | null;
  fechaGeneracion: string;
  totalAdvertencias: number;
}

export function buildBorradorSnapshotFromPreNomina(input: BuildBorradorSnapshotInput): {
  snapshot: NominaCalculoPeriodoSnapshot;
  borradorPersist: BorradorPersistContext;
} {
  const trazabilidad = input.preNomina.trazabilidad;
  const trabajadores = (trazabilidad?.trabajadores ?? []).map(mapTrabajadorBorradorToSnapshot);
  const issues = buildIssuesBorrador(input.prevalidacion, input.preNomina);
  const totalBloqueados = trazabilidad?.bloqueados ?? countTrabajadoresPorEstado(trabajadores, 'con_bloqueos');

  const snapshot: NominaCalculoPeriodoSnapshot = {
    periodo: input.periodo.trim(),
    idEmpresa: null,
    estado: 'borrador',
    fechaGeneracion: input.fechaGeneracion,
    usuarioGenerador: null,
    totalTrabajadores: input.preNomina.trabajadoresIncluidos,
    totalHaberes: 0,
    totalDescuentos: 0,
    totalLiquido: 0,
    totalBloqueados: totalBloqueados,
    totalAdvertencias: input.totalAdvertencias,
    versionMotor: 'BASE-NOMINA-01',
    hashSnapshot: null,
    origen: 'preliminar',
    activo: true,
    reemplazadoPor: null,
    aprobacionOperativa: null,
    cierreOperativo: null,
    trabajadores,
    issues,
    trazabilidad: [],
  };

  const borradorPersist: BorradorPersistContext = {
    entradasMensuales: input.prevalidacion?.entradasMensuales ?? [],
    resumenPrevalidacion: input.prevalidacion?.resumen ?? null,
    prevalidacionEstado: input.prevalidacion?.estado ?? null,
  };

  return { snapshot, borradorPersist };
}

export function buildBorradorPersistMetadataPayload(
  context: BorradorPersistContext,
): Record<string, unknown> {
  return {
    borradorPersist: context,
    notaAlcance: 'Contexto de borrador para rehidratar entradas y resumen sin recalcular motor.',
  };
}

export function extractBorradorPersistContext(
  metadata: Record<string, unknown> | null | undefined,
): BorradorPersistContext | null {
  if (!metadata || typeof metadata !== 'object') {
    return null;
  }
  const raw = metadata['borradorPersist'];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return null;
  }
  const record = raw as Record<string, unknown>;
  const entradas = Array.isArray(record['entradasMensuales'])
    ? (record['entradasMensuales'] as EntradaMensualPeriodo[])
    : [];
  const resumen =
    record['resumenPrevalidacion'] && typeof record['resumenPrevalidacion'] === 'object'
      ? (record['resumenPrevalidacion'] as ProcesoMensualResumen)
      : null;
  const prevalidacionEstado =
    typeof record['prevalidacionEstado'] === 'string'
      ? (record['prevalidacionEstado'] as ProcesoMensualPrevalidacion['estado'])
      : null;
  return { entradasMensuales: entradas, resumenPrevalidacion: resumen, prevalidacionEstado };
}

export function buildPrevalidacionLecturaDesdeBorrador(
  periodo: string,
  context: BorradorPersistContext,
): ProcesoMensualPrevalidacion {
  const resumen = context.resumenPrevalidacion ?? {
    periodo,
    hayBloqueos: false,
    hayAdvertencias: false,
    conteoMovimientosPorEstado: {},
    trabajadoresActivosAptos: 0,
    trabajadoresActivosNoAptos: 0,
    parametrosOperativos: false,
    parametrosGrupos: [],
    recurrentesAplicablesAlPeriodo: 0,
    recurrentesInvalidas: 0,
    recurrentesCerradas: 0,
    recurrentesFueraDelMes: 0,
  };
  return {
    periodo,
    estado: context.prevalidacionEstado ?? 'LISTO_PARA_CALCULO',
    resumen,
    bloqueos: [],
    advertencias: [],
    informaciones: [],
    items: [],
    entradasMensuales: context.entradasMensuales,
  };
}

export function mapSnapshotCompletoToBaseTrazabilidad(
  completo: NominaSnapshotCompletoView | null,
): BaseNominaTrazabilidad | null {
  if (!completo) {
    return null;
  }
  const cabecera = completo.cabecera;
  const trabajadores: BaseNominaTrabajadorResumen[] = completo.trabajadores.map((t) => ({
    idPersona: t.idPersona,
    trabajadorLabel: t.nombreCompletoSnapshot,
    rutLabel: t.rut,
    contratoLabel: '',
    estado: mapMotorEstadoToBaseTrabajador(t.estado),
    asignacionesRecurrentes: 0,
    movimientosDelMes: 0,
    observacion: t.issues[0]?.mensaje ?? '',
  }));

  return {
    trabajadores,
    trabajadoresConsiderados: cabecera.totalTrabajadores,
    listosParaCalculo: trabajadores.filter((t) => t.estado === 'listo').length,
    conObservaciones: trabajadores.filter((t) => t.estado === 'con_observaciones').length,
    bloqueados: trabajadores.filter((t) => t.estado === 'bloqueado').length,
    excluidos: trabajadores.filter((t) => t.estado === 'excluido').length,
    asignacionesRecurrentesIncluidas: 0,
    movimientosDelMesIncluidos: 0,
    parametrosEstado: 'por_revisar',
    observacionParametros: '',
  };
}

function mapTrabajadorBorradorToSnapshot(trabajador: BaseNominaTrabajadorResumen): NominaCalculoTrabajadorSnapshot {
  return {
    idPersona: trabajador.idPersona,
    rut: trabajador.rutLabel,
    nombreCompletoSnapshot: trabajador.trabajadorLabel,
    estado: mapBaseTrabajadorEstadoToMotor(trabajador.estado),
    sueldoBase: 0,
    baseImponiblePrevisional: 0,
    baseTributable: 0,
    totalHaberesImponibles: 0,
    totalHaberesNoImponibles: 0,
    totalDescuentosLegales: 0,
    totalDescuentosVoluntarios: 0,
    impuestoUnico: 0,
    liquidoPreliminar: 0,
    cotizacionAfp: 0,
    cotizacionSalud: 0,
    cotizacionAfc: 0,
    cotizacionSis: 0,
    cotizacionSanna: 0,
    cotizacionLey16744Empleador: 0,
    conceptos: [],
    issues: trabajador.observacion
      ? [
          {
            codigo: `TRAB-${trabajador.idPersona}`,
            severidad: trabajador.estado === 'bloqueado' || trabajador.estado === 'excluido' ? 'BLOQUEO' : 'ADVERTENCIA',
            origen: 'trabajador',
            mensaje: trabajador.observacion,
            campo: null,
            entidadId: trabajador.idPersona,
          },
        ]
      : [],
    trazabilidad: [],
  };
}

function buildIssuesBorrador(
  prevalidacion: ProcesoMensualPrevalidacion | null,
  preNomina: ProcesoMensualPreNominaPeriodo,
): NominaCalculoIssueSnapshot[] {
  const issues: NominaCalculoIssueSnapshot[] = [];
  const pushMensajes = (mensajes: ProcesoMensualMensaje[], severidad: NominaCalculoIssueSnapshot['severidad']) => {
    for (const mensaje of mensajes) {
      issues.push({
        codigo: mensaje.codigo,
        severidad,
        origen: mensaje.area,
        mensaje: mensaje.texto,
        campo: null,
        entidadId: null,
      });
    }
  };
  if (prevalidacion) {
    pushMensajes(prevalidacion.bloqueos, 'BLOQUEO');
    pushMensajes(prevalidacion.advertencias, 'ADVERTENCIA');
  }
  for (const codigo of preNomina.codigosBloqueo) {
    issues.push({
      codigo,
      severidad: 'BLOQUEO',
      origen: 'pre_nomina',
      mensaje: codigo,
      campo: null,
      entidadId: null,
    });
  }
  for (const codigo of preNomina.codigosAdvertencia) {
    issues.push({
      codigo,
      severidad: 'ADVERTENCIA',
      origen: 'pre_nomina',
      mensaje: codigo,
      campo: null,
      entidadId: null,
    });
  }
  return issues;
}

function mapBaseTrabajadorEstadoToMotor(estado: BaseNominaTrabajadorEstado): MotorCalculoEstadoTrabajador {
  switch (estado) {
    case 'listo':
      return 'calculado_preliminar';
    case 'bloqueado':
    case 'excluido':
      return 'con_bloqueos';
    case 'con_observaciones':
    default:
      return 'con_advertencias';
  }
}

function mapMotorEstadoToBaseTrabajador(estado: MotorCalculoEstadoTrabajador): BaseNominaTrabajadorEstado {
  switch (estado) {
    case 'calculado_preliminar':
      return 'listo';
    case 'con_bloqueos':
      return 'bloqueado';
    case 'con_advertencias':
    default:
      return 'con_observaciones';
  }
}

function countTrabajadoresPorEstado(
  trabajadores: NominaCalculoTrabajadorSnapshot[],
  estado: MotorCalculoEstadoTrabajador,
): number {
  return trabajadores.filter((t) => t.estado === estado).length;
}
