import type { NominaCalculoPeriodoSnapshot } from '../../nomina-mensual/models/proceso-mensual.model';
import { mergeSnapshotsHistorialPeriodo } from '../../nomina-mensual/rules/proceso-mensual-historial-periodo.rules';
import {
  buildDetalleParametrosBaseCongelados,
  copyOrigenBaseAlAvanzar,
  esSnapshotParametrosBase,
  leerMetadataParametrosBase,
  resolverOrigenBaseDesdeSnapshot,
} from '../mappers/nomina-parametros-base.mapper';
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
  dotacion: 'Dotación',
  movements: 'Movimientos',
  calculation: 'Cálculo',
  closure: 'Cierre',
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

    if (esSnapshotParametrosBase(snapshot)) {
      eventos.push(mapEventoTrazabilidadParametrosBase(snapshot));
      continue;
    }

    const usuarioSnapshot = resolverUsuarioSnapshot(snapshot);
    eventos.push({
      idEvento: `srv-gen-${idSnapshot ?? snapshot.fechaGeneracion}`,
      periodo: snapshot.periodo,
      paso: snapshot.estado === 'borrador' ? 'calculation' : 'closure',
      tipoEvento: snapshot.estado === 'borrador' ? 'CALCULO_EJECUTADO' : 'PRENOMINA_VALIDADA',
      usuarioId: usuarioSnapshot.id,
      usuarioNombre: usuarioSnapshot.nombre,
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
        paso: 'closure',
        tipoEvento: 'PRENOMINA_APROBADA',
        usuarioId: snapshot.aprobacionOperativa.usuarioId,
        usuarioNombre: snapshot.aprobacionOperativa.usuarioLabel || 'Usuario no disponible en esta sesión',
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
        paso: 'closure',
        tipoEvento: 'LIQUIDACIONES_GENERADAS',
        usuarioId: snapshot.cierreOperativo.usuarioId,
        usuarioNombre: snapshot.cierreOperativo.usuarioLabel || 'Usuario no disponible en esta sesión',
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
        paso: 'closure',
        tipoEvento: 'RECALCULO_SOLICITADO',
        usuarioId: snapshot.reaperturaOperativa.usuarioId,
        usuarioNombre: snapshot.reaperturaOperativa.usuarioLabel || 'Usuario no disponible en esta sesión',
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
        paso: 'calculation',
        tipoEvento: 'SNAPSHOT_INVALIDADO',
        usuarioId: snapshot.anulacion.usuarioId,
        usuarioNombre: snapshot.anulacion.usuarioLabel || 'Usuario no disponible en esta sesión',
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
    const clave = claveEventoTrazabilidad(evento);
    const existente = map.get(clave);
    if (!existente || prioridad[evento.origen] >= prioridad[existente.origen]) {
      map.set(clave, evento);
    }
  }

  return [...map.values()].sort((a, b) => b.fechaEvento.localeCompare(a.fechaEvento));
}

function claveEventoTrazabilidad(evento: EventoTrazabilidadNomina): string {
  const base = `${evento.paso}:${evento.tipoEvento}:${evento.fechaEvento.slice(0, 16)}`;
  if (evento.idSnapshotRelacionado) {
    return `${base}:snapshot:${evento.idSnapshotRelacionado}`;
  }
  if (evento.origen === 'local') {
    return `${base}:evento:${evento.idEvento}`;
  }
  return base;
}

const MAP_TIPO_A_ESTADO: Partial<Record<TipoEventoTrazabilidadNomina, ResumenAuditoriaPasoNomina['estado']>> = {
  PARAMETROS_VALIDADOS: 'validado',
  PARAMETROS_CONGELADOS: 'congelado',
  ALCANCE_DEFINIDO: 'validado',
  EMPLEADOS_VALIDADOS: 'validado',
  NOVEDADES_REGISTRADAS: 'validado',
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
    'parameters', 'dotacion', 'movements', 'calculation', 'closure',
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
        requiereAprobacion: paso === 'closure',
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
      requiereAprobacion: paso === 'closure' && ultimo.tipoEvento !== 'PRENOMINA_APROBADA',
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
  } else if (paso === 'parameters' && ctx?.parametrosBase) {
    const base = ctx.parametrosBase;
    if (base.fechaBaseGuardada) {
      resumenFuncional.push(`Base guardada el ${base.fechaBaseGuardada}`);
    } else {
      resumenFuncional.push('Base de parámetros preparada para el período');
    }
  } else if (paso === 'dotacion' && ctx?.alcance) {
    const a = ctx.alcance;
    resumenFuncional.push(`${a.trabajadoresIncluidos} trabajadores incluidos`);
    resumenFuncional.push(`${a.bloqueados} bloqueados`);
    resumenFuncional.push(`${a.advertencias} advertencias`);
    resumenFuncional.push(`Tipo: ${a.tipoAlcance}`);
  } else if (paso === 'dotacion' && ctx?.empleados) {
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

function mapEventoTrazabilidadParametrosBase(
  snapshot: NominaCalculoPeriodoSnapshot,
): EventoTrazabilidadNomina {
  const origen = resolverOrigenBaseDesdeSnapshot(snapshot);
  const meta = leerMetadataParametrosBase(snapshot.metadataOperativa);
  const parametrosCongelados = buildDetalleParametrosBaseCongelados(snapshot.parametros ?? []);
  const usuario = resolverUsuarioSnapshot(snapshot, meta?.resumen?.usuarioResponsable ?? null);
  return {
    idEvento: `srv-param-base-${snapshot.idCalculoPeriodo ?? snapshot.fechaGeneracion}`,
    periodo: snapshot.periodo,
    paso: 'parameters',
    tipoEvento: 'PARAMETROS_CONGELADOS',
    usuarioId: usuario.id,
    usuarioNombre: usuario.nombre,
    fechaEvento: snapshot.fechaGeneracion,
    descripcion: copyOrigenBaseAlAvanzar(origen),
    idSnapshotRelacionado:
      snapshot.idCalculoPeriodo != null ? String(snapshot.idCalculoPeriodo) : undefined,
    integridad: resolverIntegridadDesdeSnapshot(snapshot),
    metadataPublica: {
      origenBase: origen,
      resumenParametrosBase: meta?.resumen,
      totalParametrosBase: parametrosCongelados.length,
      valoresParametrosBase: parametrosCongelados,
    },
    origen: 'servidor',
  };
}

function resolverUsuarioSnapshot(
  snapshot: NominaCalculoPeriodoSnapshot,
  usuarioMetadata: { id: string | null; nombre: string } | null = leerUsuarioResponsableSnapshot(snapshot),
): { id: string | null; nombre: string } {
  if (usuarioMetadata?.nombre) return usuarioMetadata;
  return {
    id: snapshot.usuarioGenerador ?? null,
    nombre: snapshot.usuarioGenerador || 'Usuario no disponible en esta sesión',
  };
}

function leerUsuarioResponsableSnapshot(
  snapshot: NominaCalculoPeriodoSnapshot,
): { id: string | null; nombre: string } | null {
  const metadata = snapshot.metadataOperativa;
  if (!metadata) return null;
  const nested = metadata['usuarioResponsable'];
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    const record = nested as Record<string, unknown>;
    const nombre = typeof record['nombre'] === 'string' && record['nombre'].trim() ? record['nombre'].trim() : null;
    if (!nombre) return null;
    return {
      id: typeof record['id'] === 'string' ? record['id'] : snapshot.usuarioGenerador ?? null,
      nombre,
    };
  }
  const nombre = typeof metadata['usuarioResponsableNombre'] === 'string' && metadata['usuarioResponsableNombre'].trim()
    ? metadata['usuarioResponsableNombre'].trim()
    : null;
  if (!nombre) return null;
  return {
    id: typeof metadata['usuarioResponsableId'] === 'string' ? metadata['usuarioResponsableId'] : snapshot.usuarioGenerador ?? null,
    nombre,
  };
}
