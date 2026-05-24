import type { MessageBoxVariant } from '../../../shared/components/ui/message-box.component';
import type { ParametrosEstadoVisual } from '../rules/parametros-completitud.rules';
import type { ParametrosTabId } from './parametro-general.model';

export interface ParametrosTab {
  id: ParametrosTabId;
  label: string;
}

export interface MonthOption {
  value: string;
  label: string;
}

export type ParametrosDialogKind =
  | 'alerta'
  | 'confirmar-guardado'
  | 'confirmar-crear-parametros'
  | 'confirmar-config-cliente'
  | 'confirmar-config-cliente-extendido'
  | 'config-cliente-sin-base'
  | 'reconciliacion-diferencias';

export type PeriodoCargaEstado = ParametrosEstadoVisual;

export type ConfigClienteDraftSource = 'cero' | 'ultima' | 'referencia' | 'oficiales' | 'existente';

export type ParametrosDialogAction =
  | 'usar-ultima-config'
  | 'usar-referencia'
  | 'usar-oficiales'
  | 'actualizar-con-oficiales'
  | 'cancelar'
  | 'mantener-config'
  | 'revisar-despues';

export interface ParametrosDialogState {
  kind: ParametrosDialogKind;
  variant: MessageBoxVariant;
  title: string;
  message: string;
  detail?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  tertiaryLabel?: string;
  fourthLabel?: string;
  secondaryAction?: ParametrosDialogAction;
  tertiaryAction?: ParametrosDialogAction;
  fourthAction?: ParametrosDialogAction;
}
