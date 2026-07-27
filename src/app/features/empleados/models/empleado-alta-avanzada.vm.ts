import type { MessageBoxSection, MessageBoxVariant } from '../../../shared/components/ui/feedback/message-box/message-box.component';
import type { EmpleadoFormTabId } from './empleado-form.manifest';
import type { CondicionTrabajadorControlName } from './empleado-perfil-laboral.model';
import type { FaltanteFichaEmpleado } from './ficha-empleado.vm';

export type IdPestana = EmpleadoFormTabId;

export type TipoUiPasoAsistente = 'actual' | 'completo' | 'pendiente' | 'errores' | 'opcional' | 'no-aplica';

export type IdPasoValidacion = IdPestana;
export type SeveridadValidacion = 'error' | 'warning' | 'info';
export type EstadoValidacionPaso = 'pending' | 'in-progress' | 'invalid' | 'complete';
export type FormEmpleadoModo = 'basico' | 'avanzado';

export type TipoModalAccionAvanzada =
  | 'next-step-review'
  | 'coherence-decision'
  | 'draft-invalid'
  | 'draft-catalog-wait'
  | 'draft-success'
  | 'finish-invalid'
  | 'finish-confirm'
  | 'honorarios-confirm'
  | 'basic-success'
  | 'basic-error'
  | 'basic-duplicate-rut'
  | 'basic-catalog-wait';

export type AccionModalAccionAvanzada =
  | 'dismiss'
  | 'go-to-list'
  | 'apply-coherence-suggestion'
  | 'keep-coherence-review'
  | 'continue-next'
  | 'focus-current-step'
  | 'focus-draft-minimum'
  | 'focus-first-blocking'
  | 'execute-finish'
  | 'confirm-honorarios'
  | 'cancel-honorarios';

export interface ModalAccionAvanzada {
  kind: TipoModalAccionAvanzada;
  variant: MessageBoxVariant;
  eyebrow?: string;
  title: string;
  message: string;
  sections?: readonly MessageBoxSection[];
  primaryLabel: string;
  secondaryLabel?: string;
  blockingItems: readonly string[];
  warningItems: readonly string[];
  infoItems: readonly string[];
  fieldItems?: readonly ItemCampoModalAccionAvanzada[];
  targetStep?: number;
  primaryAction: AccionModalAccionAvanzada;
  secondaryAction?: AccionModalAccionAvanzada;
  /** Evita Escape/cierre accidental que dispare la acción secundaria (p. ej. revertir honorarios). */
  disableClose?: boolean;
}

export interface ItemCampoModalAccionAvanzada {
  id: string;
  sectionTitle: string;
  fieldLabel: string;
  detail: string;
  actionLabel: string;
  wizardStep: number;
  controlPath: string;
  severity: SeveridadValidacion;
}

export interface ReglaValidacion {
  id: string;
  stepId: IdPasoValidacion;
  label: string;
  severity: SeveridadValidacion;
  blocking: boolean;
  sourcePath: string;
  category?: string;
  isApplicable: () => boolean;
  isComplete: () => boolean;
  isVisible?: () => boolean;
}

export interface DeteccionAutomaticaPerfilLaboral {
  controlName: CondicionTrabajadorControlName;
  reason: string;
}

export interface ReglaValidacionEvaluada {
  id: string;
  stepId: IdPasoValidacion;
  wizardStep: number;
  sectionTitle: string;
  label: string;
  detail: string;
  actionLabel?: string;
  severity: SeveridadValidacion;
  blocking: boolean;
  complete: boolean;
  visible: boolean;
  sourcePath: string;
  category?: string;
}

export interface ResumenValidacionPaso {
  stepId: IdPasoValidacion;
  pending: number;
  blockingPending: number;
  warningsPending: number;
  complete: number;
  applicable: number;
  status: EstadoValidacionPaso;
}

export interface ResumenValidacionGlobal {
  blockingPending: number;
  warningsPending: number;
  completeSteps: number;
  invalidSteps: number;
  pendingTotal: number;
}

export interface GrupoMapaAsistente {
  title: string;
  description: string;
  stepIndexes: readonly number[];
}

export interface FilaRegistroPendienteBitacoraAlta {
  stepIndex: number;
  label: string;
  kind: TipoUiPasoAsistente;
  stateLabel: string;
}

/** Revisión normativa visible en consola (coherencia o aplicabilidad). */
export interface RevisionNormativaBitacoraAlta {
  id: string;
  origen: 'coherencia' | 'aplicabilidad';
  stepIndex: number;
  titulo: string;
  detalle: string;
  accionRecomendada?: string;
  puedeAplicarCorreccion: boolean;
  bajoRevision: boolean;
  coherenciaIssueId?: string;
  /** Campo a enfocar cuando la corrección es “ir al dato” (aplicabilidad). */
  controlPath?: string;
}

/** Pendiente de cierre del acta (accionable desde la bitácora). */
export interface PendienteCierreBitacoraAlta {
  id: string;
  mensaje: string;
  wizardStep: number;
  controlPath?: string;
  fieldLabel?: string;
}

/** Vista de la consola flotante de pendientes (alta avanzada). */
export interface VmConsolaBitacoraAlta {
  visible: boolean;
  expandedByDefault: boolean;
  collapsedLabel: string;
  motivoPrincipal: string;
  faltantes: readonly FaltanteFichaEmpleado[];
  revisionesNormativas: readonly RevisionNormativaBitacoraAlta[];
  registrosPendientes: readonly FilaRegistroPendienteBitacoraAlta[];
  pendientesCierre: readonly PendienteCierreBitacoraAlta[];
  totalVisible: number;
}
