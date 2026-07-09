/**
 * Presenter del historial de revisión RRHH por trabajador liquidado.
 * Convierte eventos de BD y emisiones en filas legibles sin exponer enums técnicos.
 */

import type { DataGridColumn } from '../../../shared/components/ui/data-grid/data-grid.types';
import type {
  LiquidacionEmision,
  LiquidacionRevisionEvento,
  LiquidacionTrabajador,
} from '../models/liquidacion-oficial.model';
import type { LiquidacionAccionUiEstado, LiquidacionAccionUiTipo } from '../rules/liquidaciones-acciones-ui.rules';
import type { LiquidacionRevisionActorMetadata } from '../rules/liquidaciones-revision-auditoria.rules';

export type TonoHistorialRevision = 'neutral' | 'ok' | 'warning' | 'danger';

export interface FilaHistorialRevisionTrabajador {
  id: string;
  accion: string;
  usuario: string;
  fechaCorta: string;
  fechaLarga: string;
  detalle: string | null;
  icono: string;
  tono: TonoHistorialRevision;
  ordenIso: string;
}

export const COLUMNAS_HISTORIAL_REVISION_TRABAJADOR: DataGridColumn<FilaHistorialRevisionTrabajador>[] = [
  {
    id: 'fecha',
    header: 'Fecha',
    field: 'fechaCorta',
    type: 'text',
    width: '8.5rem',
    minWidth: '8rem',
    sortable: false,
    filterable: false,
    hideable: false,
    priorityResponsive: 'primary',
  },
  {
    id: 'accion',
    header: 'Movimiento',
    field: 'accion',
    type: 'text',
    width: '26%',
    minWidth: '10rem',
    sortable: false,
    filterable: false,
    hideable: false,
    priorityResponsive: 'primary',
  },
  {
    id: 'usuario',
    header: 'Usuario',
    field: 'usuario',
    type: 'text',
    width: '18%',
    minWidth: '8.5rem',
    sortable: false,
    filterable: false,
    priorityResponsive: 'secondary',
  },
  {
    id: 'detalle',
    header: 'Detalle',
    field: 'detalle',
    type: 'text',
    width: '28%',
    minWidth: '9rem',
    sortable: false,
    filterable: false,
    priorityResponsive: 'secondary',
  },
];

const ETIQUETA_ACCION_REVISION: Record<LiquidacionAccionUiTipo, string> = {
  autorizar: 'Liquidación autorizada',
  registrar_pago: 'Pago registrado',
  enviar_documento: 'Documento entregado',
  solicitar_rectificacion: 'Rectificación solicitada',
};

const ETIQUETA_ESTADO_REVISION: Record<LiquidacionAccionUiEstado, string> = {
  pendiente_autorizar: 'Pendiente de autorizar',
  autorizada: 'Autorizada',
  pago_registrado: 'Pago registrado',
  documento_enviado: 'Documento entregado',
  rectificacion_solicitada: 'Rectificación solicitada',
};

const VISUAL_ACCION_REVISION: Record<
  LiquidacionAccionUiTipo,
  { icono: string; tono: TonoHistorialRevision }
> = {
  autorizar: { icono: 'check-circle', tono: 'ok' },
  registrar_pago: { icono: 'dollar-sign', tono: 'ok' },
  enviar_documento: { icono: 'send', tono: 'ok' },
  solicitar_rectificacion: { icono: 'rotate-ccw', tono: 'danger' },
};

const VISUAL_EMISION = { icono: 'file-text', tono: 'neutral' as const };

const METADATA_ACTOR_KEYS: Record<LiquidacionAccionUiTipo, string> = {
  autorizar: 'autorizacion',
  registrar_pago: 'pago',
  enviar_documento: 'documentoEntrega',
  solicitar_rectificacion: 'rectificacionSolicitada',
};

function formatearFechaHoraCorta(iso: string): string {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return '';
  const dia = fecha.getDate().toString().padStart(2, '0');
  const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
  const anio = fecha.getFullYear();
  const hh = fecha.getHours().toString().padStart(2, '0');
  const mm = fecha.getMinutes().toString().padStart(2, '0');
  return `${dia}/${mes}/${anio} ${hh}:${mm}`;
}

function formatearFechaHoraLarga(iso: string): string {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return '';
  try {
    return fecha.toLocaleString('es-CL', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return formatearFechaHoraCorta(iso);
  }
}

function esAccionRevision(accion: string): accion is LiquidacionAccionUiTipo {
  return accion === 'autorizar'
    || accion === 'registrar_pago'
    || accion === 'enviar_documento'
    || accion === 'solicitar_rectificacion';
}

function etiquetaEstadoRevision(estado: string | null | undefined): string | null {
  if (!estado || !estado.trim()) return null;
  return ETIQUETA_ESTADO_REVISION[estado as LiquidacionAccionUiEstado]
    ?? estado.replaceAll('_', ' ');
}

function detalleTransicionEstado(
  estadoPrevio: string | null,
  estadoNuevo: string,
): string | null {
  const previo = etiquetaEstadoRevision(estadoPrevio);
  const nuevo = etiquetaEstadoRevision(estadoNuevo);
  if (previo && nuevo && previo !== nuevo) return `${previo} → ${nuevo}`;
  return nuevo;
}

function usuarioDesdeLabel(label: string | null | undefined): string {
  const limpio = label?.trim();
  return limpio && limpio.length > 0 ? limpio : 'Usuario no informado';
}

function leerActorMetadata(
  metadata: Record<string, unknown>,
  key: string,
): LiquidacionRevisionActorMetadata | null {
  const raw = metadata[key];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const actor = raw as Record<string, unknown>;
  const usuarioNombre = typeof actor['usuarioNombre'] === 'string' ? actor['usuarioNombre'] : '';
  const registradoEn = typeof actor['registradoEn'] === 'string' ? actor['registradoEn'] : '';
  if (!usuarioNombre.trim() || !registradoEn.trim()) return null;
  return {
    usuarioId: typeof actor['usuarioId'] === 'string' ? actor['usuarioId'] : null,
    usuarioNombre,
    registradoEn,
  };
}

function filasDesdeMetadataTrabajador(
  trabajador: Pick<LiquidacionTrabajador, 'metadata' | 'idLiquidacionTrabajador'>,
): FilaHistorialRevisionTrabajador[] {
  const filas: FilaHistorialRevisionTrabajador[] = [];
  const acciones: LiquidacionAccionUiTipo[] = [
    'autorizar',
    'registrar_pago',
    'enviar_documento',
    'solicitar_rectificacion',
  ];

  for (const accion of acciones) {
    const actor = leerActorMetadata(trabajador.metadata, METADATA_ACTOR_KEYS[accion]);
    if (!actor) continue;
    const visual = VISUAL_ACCION_REVISION[accion];
    filas.push({
      id: `meta-${trabajador.idLiquidacionTrabajador}-${accion}`,
      accion: ETIQUETA_ACCION_REVISION[accion],
      usuario: usuarioDesdeLabel(actor.usuarioNombre),
      fechaCorta: formatearFechaHoraCorta(actor.registradoEn),
      fechaLarga: formatearFechaHoraLarga(actor.registradoEn),
      detalle: null,
      icono: visual.icono,
      tono: visual.tono,
      ordenIso: actor.registradoEn,
    });
  }

  return filas;
}

function filaDesdeEventoRevision(evento: LiquidacionRevisionEvento): FilaHistorialRevisionTrabajador {
  const accion = evento.accion;
  const visual = esAccionRevision(accion)
    ? VISUAL_ACCION_REVISION[accion]
    : { icono: 'history', tono: 'neutral' as TonoHistorialRevision };
  const etiqueta = esAccionRevision(accion)
    ? ETIQUETA_ACCION_REVISION[accion]
    : 'Movimiento registrado';

  return {
    id: `rev-${evento.idLiquidacionRevisionEvento}`,
    accion: etiqueta,
    usuario: usuarioDesdeLabel(evento.usuarioLabel),
    fechaCorta: formatearFechaHoraCorta(evento.registradoEn),
    fechaLarga: formatearFechaHoraLarga(evento.registradoEn),
    detalle: detalleTransicionEstado(evento.estadoPrevio, evento.estadoNuevo),
    icono: visual.icono,
    tono: visual.tono,
    ordenIso: evento.registradoEn,
  };
}

function etiquetaCanalEmision(canal: LiquidacionEmision['canal']): string {
  if (canal === 'impresion_navegador') return 'Impresión';
  return 'Vista oficial';
}

function filaDesdeEmision(emision: LiquidacionEmision): FilaHistorialRevisionTrabajador {
  return {
    id: `emi-${emision.idLiquidacionEmision}`,
    accion: 'Comprobante emitido',
    usuario: usuarioDesdeLabel(emision.usuarioLabel),
    fechaCorta: formatearFechaHoraCorta(emision.emitidoEn),
    fechaLarga: formatearFechaHoraLarga(emision.emitidoEn),
    detalle: `Canal: ${etiquetaCanalEmision(emision.canal)} · v${emision.versionLiquidacion}`,
    icono: VISUAL_EMISION.icono,
    tono: VISUAL_EMISION.tono,
    ordenIso: emision.emitidoEn,
  };
}

export interface MapearHistorialRevisionTrabajadorInput {
  eventos: readonly LiquidacionRevisionEvento[];
  emisiones: readonly LiquidacionEmision[];
  trabajador?: Pick<LiquidacionTrabajador, 'metadata' | 'idLiquidacionTrabajador'> | null;
}

/** Une eventos de revisión, emisiones y metadata legacy; orden desc por fecha. */
export function mapearHistorialRevisionTrabajador(
  input: MapearHistorialRevisionTrabajadorInput,
): FilaHistorialRevisionTrabajador[] {
  const filas: FilaHistorialRevisionTrabajador[] = [
    ...input.eventos.map(filaDesdeEventoRevision),
    ...input.emisiones.map(filaDesdeEmision),
  ];

  if (filas.length === 0 && input.trabajador) {
    filas.push(...filasDesdeMetadataTrabajador(input.trabajador));
  }

  return filas.sort((a, b) => b.ordenIso.localeCompare(a.ordenIso));
}

export interface FilaHistorialRevisionPeriodo extends FilaHistorialRevisionTrabajador {
  trabajador: string;
}

export const COLUMNAS_HISTORIAL_REVISION_PERIODO: DataGridColumn<FilaHistorialRevisionPeriodo>[] = [
  {
    id: 'fecha',
    header: 'Fecha',
    field: 'fechaCorta',
    type: 'text',
    width: '8.5rem',
    minWidth: '8rem',
    sortable: false,
    filterable: false,
    hideable: false,
    priorityResponsive: 'primary',
  },
  {
    id: 'trabajador',
    header: 'Trabajador',
    field: 'trabajador',
    type: 'text',
    width: '18%',
    minWidth: '9rem',
    sortable: false,
    filterable: false,
    hideable: false,
    priorityResponsive: 'primary',
  },
  ...COLUMNAS_HISTORIAL_REVISION_TRABAJADOR.filter((columna) => columna.id !== 'fecha'),
];

function nombreTrabajadorDesdeMapa(
  idLiquidacionTrabajador: number,
  trabajadoresPorId: ReadonlyMap<number, string>,
): string {
  return trabajadoresPorId.get(idLiquidacionTrabajador) ?? 'Trabajador no informado';
}

export interface MapearHistorialRevisionPeriodoInput {
  eventos: readonly LiquidacionRevisionEvento[];
  emisiones: readonly LiquidacionEmision[];
  trabajadores: readonly Pick<LiquidacionTrabajador, 'idLiquidacionTrabajador' | 'nombreTrabajador'>[];
}

/** Historial consolidado del período liquidado (todos los trabajadores). */
export function mapearHistorialRevisionPeriodo(
  input: MapearHistorialRevisionPeriodoInput,
): FilaHistorialRevisionPeriodo[] {
  const trabajadoresPorId = new Map(
    input.trabajadores.map((t) => [t.idLiquidacionTrabajador, t.nombreTrabajador.trim() || 'Sin nombre']),
  );

  const filas: FilaHistorialRevisionPeriodo[] = [
    ...input.eventos.map((evento) => ({
      ...filaDesdeEventoRevision(evento),
      trabajador: nombreTrabajadorDesdeMapa(evento.idLiquidacionTrabajador, trabajadoresPorId),
    })),
    ...input.emisiones.map((emision) => ({
      ...filaDesdeEmision(emision),
      trabajador: nombreTrabajadorDesdeMapa(emision.idLiquidacionTrabajador, trabajadoresPorId),
    })),
  ];

  return filas.sort((a, b) => b.ordenIso.localeCompare(a.ordenIso));
}
