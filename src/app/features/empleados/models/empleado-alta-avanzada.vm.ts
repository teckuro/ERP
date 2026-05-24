import type { MessageBoxSection, MessageBoxVariant } from '../../../shared/components/ui/message-box.component';
import type { EmpleadoFormTabId } from './empleado-form.manifest';
import type { CondicionTrabajadorControlName } from './empleado-perfil-laboral.model';
import type { FaltanteFichaEmpleado } from './ficha-empleado.vm';

export type TabId = EmpleadoFormTabId;

export type WizardStepUiKind = 'actual' | 'completo' | 'pendiente' | 'errores' | 'opcional' | 'no-aplica';

export type ValidationStepId = TabId;
export type ValidationSeverity = 'error' | 'warning' | 'info';
export type StepValidationStatus = 'pending' | 'in-progress' | 'invalid' | 'complete';
export type FormEmpleadoModo = 'basico' | 'avanzado';

export type AdvancedActionModalKind =
  | 'next-step-review'
  | 'coherence-decision'
  | 'draft-invalid'
  | 'draft-success'
  | 'finish-invalid'
  | 'finish-confirm'
  | 'honorarios-confirm'
  | 'honorarios-finish-blocked'
  | 'basic-success'
  | 'basic-error'
  | 'basic-duplicate-rut'
  | 'basic-catalog-wait';

export type AdvancedActionModalAction =
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
  | 'cancel-honorarios'
  | 'save-honorarios-draft';

export interface AdvancedActionModal {
  kind: AdvancedActionModalKind;
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
  fieldItems?: readonly AdvancedActionModalFieldItem[];
  targetStep?: number;
  primaryAction: AdvancedActionModalAction;
  secondaryAction?: AdvancedActionModalAction;
}

export interface AdvancedActionModalFieldItem {
  id: string;
  sectionTitle: string;
  fieldLabel: string;
  detail: string;
  actionLabel: string;
  wizardStep: number;
  controlPath: string;
  severity: ValidationSeverity;
}

export interface ValidationRule {
  id: string;
  stepId: ValidationStepId;
  label: string;
  severity: ValidationSeverity;
  blocking: boolean;
  sourcePath: string;
  category?: string;
  isApplicable: () => boolean;
  isComplete: () => boolean;
  isVisible?: () => boolean;
}

export interface PerfilLaboralAutoDetection {
  controlName: CondicionTrabajadorControlName;
  reason: string;
}

export interface EvaluatedValidationRule {
  id: string;
  stepId: ValidationStepId;
  wizardStep: number;
  sectionTitle: string;
  label: string;
  detail: string;
  actionLabel?: string;
  severity: ValidationSeverity;
  blocking: boolean;
  complete: boolean;
  visible: boolean;
  sourcePath: string;
  category?: string;
}

export interface StepValidationSummary {
  stepId: ValidationStepId;
  pending: number;
  blockingPending: number;
  warningsPending: number;
  complete: number;
  applicable: number;
  status: StepValidationStatus;
}

export interface GlobalValidationSummary {
  blockingPending: number;
  warningsPending: number;
  completeSteps: number;
  invalidSteps: number;
  pendingTotal: number;
}

export interface WizardMapGroup {
  title: string;
  description: string;
  stepIndexes: readonly number[];
}

export interface AltaBitacoraRegistroPendienteRow {
  stepIndex: number;
  label: string;
  kind: WizardStepUiKind;
  stateLabel: string;
}

/** Vista de la consola flotante de pendientes (alta avanzada). */
export interface AltaBitacoraConsoleVm {
  visible: boolean;
  expandedByDefault: boolean;
  collapsedLabel: string;
  motivoPrincipal: string;
  faltantes: readonly FaltanteFichaEmpleado[];
  registrosPendientes: readonly AltaBitacoraRegistroPendienteRow[];
  pendientesCierre: readonly string[];
  totalVisible: number;
}
