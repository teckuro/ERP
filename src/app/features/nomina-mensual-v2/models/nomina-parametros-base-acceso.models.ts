import type { MessageBoxSection } from '../../../shared/components/ui/feedback/message-box/message-box.types';

/** Modal de acceso / confirmación al recargar la base de parámetros congelada. */
export type ModalAccesoBaseParametrosPort =
  | { tipo: 'sinPermiso' }
  | { tipo: 'confirmarRecargaBase'; periodoEtiqueta: string };

export type PermisosRecargaBaseParametros = {
  puedeRecargarBase: boolean;
  puedeActualizarBaseEnDiferencias: boolean;
};

export type AccionPrincipalShellParametros = {
  label: string;
  disabled: boolean;
};

export type EvaluacionIntentoRecargaBase =
  | { accion: 'permitir' }
  | { accion: 'bloquear'; modal: ModalAccesoBaseParametrosPort }
  | { accion: 'confirmar'; modal: ModalAccesoBaseParametrosPort };

export type VistaModalAccesoBaseParametros = {
  variant: 'blocked' | 'decision';
  title: string;
  message: string;
  sections: MessageBoxSection[];
  primaryLabel: string;
  secondaryLabel?: string;
};
