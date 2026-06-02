import type {
  ModalAccesoBaseParametrosPort,
  VistaModalAccesoBaseParametros,
} from '../models/nomina-parametros-base-acceso.models';
import type { MessageBoxSection } from '../../../shared/components/ui/feedback/message-box/message-box.types';

export const SECCIONES_MSG_BOX_SIN_PERMISO_RECARGA_BASE: MessageBoxSection[] = [
  {
    title: 'Base ya preparada',
    text: 'La base de parámetros de este período ya está guardada. Solo un administrador puede volver a cargarla con los valores actuales.',
    tone: 'attention',
  },
];

export function seccionesMsgBoxConfirmarRecargaBase(periodoEtiqueta: string): MessageBoxSection[] {
  return [
    {
      title: `Período ${periodoEtiqueta}`,
      text: 'Se reemplazará la base guardada por los parámetros actuales del mantenedor.',
      tone: 'attention',
    },
    {
      title: 'Repercusiones',
      text: 'La trazabilidad del paso Parámetros reflejará un nuevo congelado; los pasos posteriores deben revisarse si ya avanzaste.',
      tone: 'attention',
    },
    {
      title: 'Recomendación',
      text: 'Usa esta acción solo si corregiste valores en Parámetros y necesitas que el cálculo use la versión actual.',
      tone: 'neutral',
    },
  ];
}

export const MENSAJE_SIN_PERMISO_RECARGA_BASE =
  'La base del período ya está preparada. Solicita a administración si debes actualizar parámetros congelados.';

export const MENSAJE_CONFIRMAR_RECARGA_BASE =
  'Volver a preparar o actualizar la base guardará de nuevo los parámetros actuales para este período.';

export function construirVistaModalAccesoBase(
  modal: ModalAccesoBaseParametrosPort,
): VistaModalAccesoBaseParametros {
  switch (modal.tipo) {
    case 'sinPermiso':
      return {
        variant: 'blocked',
        title: 'Base ya preparada',
        message: MENSAJE_SIN_PERMISO_RECARGA_BASE,
        sections: SECCIONES_MSG_BOX_SIN_PERMISO_RECARGA_BASE,
        primaryLabel: 'Entendido',
      };
    case 'confirmarRecargaBase':
      return {
        variant: 'decision',
        title: `Recargar base de ${modal.periodoEtiqueta}`,
        message: MENSAJE_CONFIRMAR_RECARGA_BASE,
        sections: seccionesMsgBoxConfirmarRecargaBase(modal.periodoEtiqueta),
        primaryLabel: 'Continuar',
        secondaryLabel: 'Cancelar',
      };
  }
}
