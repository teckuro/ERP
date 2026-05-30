import type { NominaCalculoPeriodoSnapshot } from '../../nomina-mensual/models/proceso-mensual.model';
import { mergeSnapshotsHistorialPeriodo } from '../../nomina-mensual/rules/proceso-mensual-historial-periodo.rules';
import type { PayrollStepId } from '../models/nomina-mensual-v2.models';
import type {
  ContextoTrazabilidadPasoNomina,
  DetalleTrazabilidadPasoNomina,
  EventoTrazabilidadNomina,
  IntegridadPublicaNomina,
  ResumenAuditoriaPasoNomina,
  TipoEventoTrazabilidadNomina,
} from '../models/nomina-trazabilidad.models';
import { toFingerprintPublico } from '../utils/nomina-trazabilidad-fingerprint.util';
import { etiquetaEstadoAuditoriaPaso } from '../utils/nomina-trazabilidad-presentacion.util';

const TITULOS_PASO: Record<PayrollStepId, string> = {
  parameters: 'Parámetros',
  scope: 'Alcance',
  employees: 'Empleados',
  movements: 'Novedades',
  calculation: 'Cálculo',
  validation: 'Validación',
  approval: 'Aprobación',
  payslips: 'Liquidaciones',
};

/** Integridad desde snapshot servidor: registrado, no verificado (V10 no valida server-side). */
export function resolverIntegridadDesdeSnapshot(
  snapshot: NominaCalculoPeriodoSnapshot | null,
  hashTecnico?: string | null,
): IntegridadPublicaNomina {
  if (!snapshot) {
    return { estadoIntegridad: 'noDisponible' };
  }
  if (snapshot.anulacion) {
    return {
      estadoIntegridad: 'invalidado',
      fingerprintPublico: toFingerprintPublico(hashTecnico ?? snapshot.hashSnapshot),
      fechaVerificacion: snapshot.anulacion.fecha,
    };
  }
  const fingerprint = toFingerprintPublico(hashTecnico ?? snapshot.hashSnapshot);
  if (!fingerprint) {
    return { estadoIntegridad: 'pendiente', fechaVerificacion: snapshot.fechaGeneracion };
  }
  return {
    estadoIntegridad: 'registrado',
    fingerprintPublico: fingerprint,
    fechaVerificacion: snapshot.fechaGeneracion,
  };
}

export function mapSnapshotsToEventosTrazabilidad(
  historial: readonly NominaCalculoPeriodoSnapshot[],
  activo: NominaCalculoPeriodoSnapshot | null,
): EventoTrazabilidadNomina[] {
  const snapshots = mergeSnapshotsHistorialPeriodo(historial, activo);
  const eventos: EventoTrazabilidadNomina[] = [];

  for (const snapshot of snapshots) {
    const idSnapshot = snapshot.idCalculoPeriodo != null ? String(snapshot.idCalculoPeriodo) : undefined;
    const integridad = resolverIntegridadDesdeSnapshot(snapshot);

    eventos.push({
      idEvento: `srv-gen-${idSnapshot ?? snapshot.fechaGeneracion}`,
      periodo: snapshot.periodo,
      paso: snapshot.estado === 'borrador' ? 'calculation' : 'validation',
      tipoEvento: snapshot.estado === 'borrador' ? 'CALCULO_EJECUTADO' : 'PRENOMINA_VALIDADA',
      usuarioId: null,
      usuarioNombre: snapshot.usuarioGenerador || 'Sistema',
      fechaEvento: snapshot.fechaGeneracion,
      descripcion:
        snapshot.estado === 'borrador'
          ? 'Se generó el borrador de nómina mensual.'
          : 'Se guardó una versión para revisión del período.',
      idSnapshotRelacionado: idSnapshot,
      integridad,
      origen: 'servidor',
    });

    if (snapshot.aprobacionOperativa) {
      eventos.push({
        idEvento: `srv-apr-${idSnapshot}-${snapshot.aprobacionOperativa.fecha}`,
        periodo: snapshot.periodo,
        paso: 'approval',
        tipoEvento: 'PRENOMINA_APROBADA',
        usuarioId: snapshot.aprobacionOperativa.usuarioId,
        usuarioNombre: snapshot.aprobacionOperativa.usuarioLabel || 'RRHH',
        fechaEvento: snapshot.aprobacionOperativa.fecha,
        descripcion: 'Se registró la revisión de RRHH del período.',
        idSnapshotRelacionado: idSnapshot,
        integridad,
        origen: 'servidor',
      });
    }

    if (snapshot.cierreOperativo) {
      eventos.push({
        idEvento: `srv-cierre-${idSnapshot}-${snapshot.cierreOperativo.fecha}`,
        periodo: snapshot.periodo,
        paso: 'payslips',
        tipoEvento: 'LIQUIDACIONES_GENERADAS',
        usuarioId: snapshot.cierreOperativo.usuarioId,
        usuarioNombre: snapshot.cierreOperativo.usuarioLabel || 'Sistema',
        fechaEvento: snapshot.cierreOperativo.fecha,
        descripcion: 'Se cerró el proceso mensual del período.',
        idSnapshotRelacionado: idSnapshot,
        integridad,
        origen: 'servidor',
      });
    }

    if (snapshot.reaperturaOperativa) {
      eventos.push({
        idEvento: `srv-reap-${idSnapshot}-${snapshot.reaperturaOperativa.fecha}`,
        periodo: snapshot.periodo,
        paso: 'approval',
        tipoEvento: 'RECALCULO_SOLICITADO',
        usuarioId: snapshot.reaperturaOperativa.usuarioId,
        usuarioNombre: snapshot.reaperturaOperativa.usuarioLabel || 'Sistema',
        fechaEvento: snapshot.reaperturaOperativa.fecha,
        descripcion: 'Se reabrió la nómina para revisión.',
        idSnapshotRelacionado: idSnapshot,
        integridad: { estadoIntegridad: 'invalidado', fingerprintPublico: integridad.fingerprintPublico },
        origen: 'servidor',
      });
    }

    if (snapshot.anulacion) {
      eventos.push({
        idEvento: `srv-anul-${idSnapshot}-${snapshot.anulacion.fecha}`,
        periodo: snapshot.periodo,
        paso: 'validation',
        tipoEvento: 'SNAPSHOT_INVALIDADO',
        usuarioId: snapshot.anulacion.usuarioId,
        usuarioNombre: snapshot.anulacion.usuarioLabel || 'Sistema',
        fechaEvento: snapshot.anulacion.fecha,
        descripcion: 'Se descartó la versión generada del período.',
        idSnapshotRelacionado: idSnapshot,
        integridad: { estadoIntegridad: 'invalidado', fingerprintPublico: integridad.fingerprintPublico },
        origen: 'servidor',
      });
    }
  }

  return eventos.sort((a, b) => b.fechaEvento.localeCompare(a.fechaEvento));
}

export function mergeEventosTrazabilidad(
  servidor: readonly EventoTrazabilidadNomina[],
  locales: readonly EventoTrazabilidadNomina[],
  mock: readonly EventoTrazabilidadNomina[] = [],
): EventoTrazabilidadNomina[] {
  const map = new Map<string, EventoTrazabilidadNomina>();
  const prioridad: Record<EventoTrazabilidadNomina['origen'], number> = {
    servidor: 3,
    local: 2,
    mock: 1,
  };

  for (const evento of [...mock, ...locales, ...servidor]) {
    const clave = `${evento.paso}:${evento.tipoEvento}:${evento.fechaEvento.slice(0, 16)}`;
    const existente = map.get(clave);
    if (!existente || prioridad[evento.origen] >= prioridad[existente.origen]) {
      map.set(clave, evento);
    }
  }

  return [...map.values()].sort((a, b) => b.fechaEvento.localeCompare(a.fechaEvento));
}

const MAP_TIPO_A_ESTADO: Partial<Record<TipoEventoTrazabilidadNomina, ResumenAuditoriaPasoNomina['estado']>> = {
  PARAMETROS_VALIDADOS: 'validado',
  PARAMETROS_CONGELADOS: 'congelado',
  ALCANCE_DEFINIDO: 'validado',
  EMPLEADOS_VALIDADOS: 'validado',
  CALCULO_EJECUTADO: 'registrado',
  PRENOMINA_VALIDADA: 'validado',
  PRENOMINA_APROBADA: 'aprobado',
  LIQUIDACIONES_GENERADAS: 'aprobado',
  SNAPSHOT_INVALIDADO: 'invalidado',
};

export function buildAuditoriaPorPaso(
  eventos: readonly EventoTrazabilidadNomina[],
): Partial<Record<PayrollStepId, ResumenAuditoriaPasoNomina>> {
  const resultado: Partial<Record<PayrollStepId, ResumenAuditoriaPasoNomina>> = {};
  const pasos: PayrollStepId[] = [
    'parameters', 'scope', 'employees', 'movements', 'calculation', 'validation', 'approval', 'payslips',
  ];

  for (const paso of pasos) {
    const delPaso = eventos.filter((e) => e.paso === paso);
    if (!delPaso.length) {
      resultado[paso] = {
        paso,
        estado: 'pendiente',
        accionPrincipal: 'Pendiente de registro',
        usuarioId: null,
        usuarioNombre: '—',
        fechaAccion: null,
        integridad: { estadoIntegridad: 'noDisponible' },
        requiereAprobacion: paso === 'approval',
      };
      continue;
    }

    const ultimo = delPaso[0];
    const invalidado = delPaso.some((e) => e.tipoEvento === 'SNAPSHOT_INVALIDADO');
    resultado[paso] = {
      paso,
      estado: invalidado ? 'invalidado' : (MAP_TIPO_A_ESTADO[ultimo.tipoEvento] ?? 'registrado'),
      accionPrincipal: ultimo.descripcion,
      usuarioId: ultimo.usuarioId,
      usuarioNombre: ultimo.usuarioNombre,
      fechaAccion: ultimo.fechaEvento,
      integridad: ultimo.integridad,
      requiereAprobacion: paso === 'approval' && ultimo.tipoEvento !== 'PRENOMINA_APROBADA',
      aprobadoPor: ultimo.tipoEvento === 'PRENOMINA_APROBADA' ? ultimo.usuarioNombre : null,
      fechaAprobacion: ultimo.tipoEvento === 'PRENOMINA_APROBADA' ? ultimo.fechaEvento : null,
    };
  }

  return resultado;
}

export function buildDetalleModal(
  paso: PayrollStepId,
  auditoria: ResumenAuditoriaPasoNomina | undefined,
  eventos: readonly EventoTrazabilidadNomina[],
  contexto?: ContextoTrazabilidadPasoNomina,
): DetalleTrazabilidadPasoNomina {
  const resumenFuncional: string[] = [];
  const ctx = contexto;

  if (paso === 'parameters' && ctx?.parametrosResumen) {
    const p = ctx.parametrosResumen;
    resumenFuncional.push(`${p.seccionesListas} de ${p.seccionesTotal} secciones listas`);
    resumenFuncional.push(`${p.controlesVerificados} controles verificados`);
    resumenFuncional.push(`${p.bloqueos} bloqueos`);
    resumenFuncional.push(`${p.advertencias} advertencias`);
  } else if (paso === 'scope' && ctx?.alcance) {
    const a = ctx.alcance;
    resumenFuncional.push(`${a.trabajadoresIncluidos} trabajadores incluidos`);
    resumenFuncional.push(`${a.bloqueados} bloqueados`);
    resumenFuncional.push(`${a.advertencias} advertencias`);
    resumenFuncional.push(`Tipo: ${a.tipoAlcance}`);
  } else if (paso === 'employees' && ctx?.empleados) {
    const e = ctx.empleados;
    resumenFuncional.push(`${e.revisados} trabajadores revisados`);
    resumenFuncional.push(`${e.bloqueos} bloqueos`);
    resumenFuncional.push(`${e.advertencias} advertencias`);
  }

  const eventosRecientes = eventos.filter((e) => e.paso === paso).slice(0, 5);
  const pasosInvalidados = eventos
    .filter((e) => e.tipoEvento === 'SNAPSHOT_INVALIDADO')
    .flatMap(() => [] as PayrollStepId[]);

  return {
    paso,
    titulo: `Trazabilidad de ${TITULOS_PASO[paso]}`,
    estadoActual: auditoria ? etiquetaEstadoAuditoriaPaso(auditoria.estado) : 'Pendiente',
    accionPrincipal: auditoria?.accionPrincipal ?? 'Sin registro',
    usuarioNombre: auditoria?.usuarioNombre ?? '—',
    fechaAccion: auditoria?.fechaAccion ?? null,
    resumenFuncional,
    integridad: auditoria?.integridad ?? { estadoIntegridad: 'noDisponible' },
    eventosRecientes,
    pasosInvalidados,
  };
}

export function tituloPasoTrazabilidad(paso: PayrollStepId): string {
  return TITULOS_PASO[paso];
}
