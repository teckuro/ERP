import type { LiquidacionTrabajador } from '../models/liquidacion-oficial.model';

export type LiquidacionAccionUiEstado =
  | 'pendiente_autorizar'
  | 'autorizada'
  | 'pago_registrado'
  | 'documento_enviado'
  | 'rectificacion_solicitada';

export const METADATA_ESTADO_REVISION_KEY = 'estadoRevision';

const ESTADOS_REVISION_VALIDOS: readonly LiquidacionAccionUiEstado[] = [
  'pendiente_autorizar',
  'autorizada',
  'pago_registrado',
  'documento_enviado',
  'rectificacion_solicitada',
];

export function parseEstadoRevisionMetadata(
  metadata: Record<string, unknown> | null | undefined,
): LiquidacionAccionUiEstado | null {
  const raw = metadata?.[METADATA_ESTADO_REVISION_KEY];
  if (typeof raw !== 'string') return null;
  return ESTADOS_REVISION_VALIDOS.includes(raw as LiquidacionAccionUiEstado)
    ? (raw as LiquidacionAccionUiEstado)
    : null;
}

export type LiquidacionAccionUiTipo =
  | 'autorizar'
  | 'registrar_pago'
  | 'enviar_documento'
  | 'solicitar_rectificacion';

export interface LiquidacionAccionUiEvent {
  idLiquidacionTrabajador: number;
  tipo: LiquidacionAccionUiTipo;
}

export interface LiquidacionAccionUiAction {
  tipo: LiquidacionAccionUiTipo;
  label: string;
  icon: string;
  tone: 'primary' | 'neutral' | 'danger';
  ariaLabel: string;
}

export interface LiquidacionAccionUiView {
  estado: LiquidacionAccionUiEstado;
  estadoLabel: string;
  estadoTone: 'pending' | 'review' | 'ok' | 'danger';
  primaryAction: LiquidacionAccionUiAction | null;
  secondaryActions: LiquidacionAccionUiAction[];
  pdfLabel: string;
  pdfDisabled: boolean;
}

export interface LiquidacionAccionUiResumen {
  pendientesAutorizar: number;
  autorizadas: number;
  pagosRegistrados: number;
  documentosEnviados: number;
  rectificacionesSolicitadas: number;
}

export function estadoInicialLiquidacionUi(
  trabajador:
    | Pick<LiquidacionTrabajador, 'estado'>
    | Pick<LiquidacionTrabajador, 'estado' | 'estadoRevision' | 'metadata'>
    | null
    | undefined,
): LiquidacionAccionUiEstado {
  if (trabajador && 'estadoRevision' in trabajador && trabajador.estadoRevision) {
    return trabajador.estadoRevision;
  }
  const desdeMetadata = trabajador && 'metadata' in trabajador
    ? parseEstadoRevisionMetadata(trabajador.metadata)
    : null;
  if (desdeMetadata) return desdeMetadata;
  return trabajador?.estado === 'generada' ? 'pendiente_autorizar' : 'pendiente_autorizar';
}

export function inicializarEstadosLiquidacionUi(
  trabajadores: readonly LiquidacionTrabajador[],
): Record<number, LiquidacionAccionUiEstado> {
  return trabajadores.reduce<Record<number, LiquidacionAccionUiEstado>>((acc, trabajador) => {
    acc[trabajador.idLiquidacionTrabajador] = estadoInicialLiquidacionUi(trabajador);
    return acc;
  }, {});
}

export function siguienteEstadoLiquidacionUi(
  estado: LiquidacionAccionUiEstado,
  accion: LiquidacionAccionUiTipo,
): LiquidacionAccionUiEstado {
  if (accion === 'solicitar_rectificacion') return 'rectificacion_solicitada';
  if (estado === 'pendiente_autorizar' && accion === 'autorizar') return 'autorizada';
  if (estado === 'autorizada' && accion === 'registrar_pago') return 'pago_registrado';
  if (estado === 'pago_registrado' && accion === 'enviar_documento') return 'documento_enviado';
  return estado;
}

export function buildLiquidacionAccionUiView(estado: LiquidacionAccionUiEstado): LiquidacionAccionUiView {
  switch (estado) {
    case 'pendiente_autorizar':
      return {
        estado,
        estadoLabel: 'Pendiente de autorizar',
        estadoTone: 'review',
        primaryAction: accion('autorizar', 'Autorizar', 'check-circle', 'Autorizar liquidación'),
        secondaryActions: [],
        pdfLabel: 'Ver liquidación',
        pdfDisabled: false,
      };
    case 'autorizada':
      return {
        estado,
        estadoLabel: 'Autorizada',
        estadoTone: 'ok',
        primaryAction: accion('registrar_pago', 'Registrar pago', 'dollar-sign', 'Registrar pago de liquidación'),
        secondaryActions: [rectificacionAction()],
        pdfLabel: 'Ver liquidación',
        pdfDisabled: false,
      };
    case 'pago_registrado':
      return {
        estado,
        estadoLabel: 'Pago registrado',
        estadoTone: 'ok',
        primaryAction: accion('enviar_documento', 'Enviar documento', 'send', 'Enviar documento de liquidación'),
        secondaryActions: [rectificacionAction()],
        pdfLabel: 'Ver liquidación',
        pdfDisabled: false,
      };
    case 'documento_enviado':
      return {
        estado,
        estadoLabel: 'Documento enviado',
        estadoTone: 'ok',
        primaryAction: null,
        secondaryActions: [rectificacionAction()],
        pdfLabel: 'Ver liquidación',
        pdfDisabled: false,
      };
    case 'rectificacion_solicitada':
      return {
        estado,
        estadoLabel: 'Rectificación solicitada',
        estadoTone: 'danger',
        primaryAction: null,
        secondaryActions: [],
        pdfLabel: 'Ver liquidación',
        pdfDisabled: false,
      };
  }
}

export function resumirEstadosLiquidacionUi(
  estados: Record<number, LiquidacionAccionUiEstado>,
): LiquidacionAccionUiResumen {
  const resumen: LiquidacionAccionUiResumen = {
    pendientesAutorizar: 0,
    autorizadas: 0,
    pagosRegistrados: 0,
    documentosEnviados: 0,
    rectificacionesSolicitadas: 0,
  };
  for (const estado of Object.values(estados)) {
    if (estado === 'pendiente_autorizar') resumen.pendientesAutorizar += 1;
    if (estado === 'autorizada') resumen.autorizadas += 1;
    if (estado === 'pago_registrado') resumen.pagosRegistrados += 1;
    if (estado === 'documento_enviado') resumen.documentosEnviados += 1;
    if (estado === 'rectificacion_solicitada') resumen.rectificacionesSolicitadas += 1;
  }
  return resumen;
}

function accion(
  tipo: LiquidacionAccionUiTipo,
  label: string,
  icon: string,
  ariaLabel: string,
): LiquidacionAccionUiAction {
  return { tipo, label, icon, ariaLabel, tone: 'primary' };
}

function rectificacionAction(): LiquidacionAccionUiAction {
  return {
    tipo: 'solicitar_rectificacion',
    label: 'Solicitar rectificación',
    icon: 'repeat',
    tone: 'danger',
    ariaLabel: 'Solicitar rectificación de liquidación',
  };
}
