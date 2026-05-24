import { Injectable, signal } from '@angular/core';

import { EMPTY_EMPLEADO_FORM_CATALOGOS, type EmpleadoFormCatalogos } from '../models/empleado-catalogos.model';
import type { InconsistenciaCoherenciaAlta } from '../rules/empleado-alta-coherencia.rules';
import type {
  AdvancedActionModal,
  FormEmpleadoModo,
  PerfilLaboralAutoDetection,
  TabId,
} from '../models/empleado-alta-avanzada.vm';

@Injectable()
export class EmpleadoAltaAvanzadaPresentacionFacade {
  readonly modo = signal<FormEmpleadoModo>('basico');
  readonly pasoWizardActivo = signal(0);
  readonly isSaving = signal(false);
  readonly attemptedSave = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly duplicateRutModalRut = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly successFlow = signal<FormEmpleadoModo | null>(null);
  readonly createdEmployeeId = signal<number | null>(null);
  readonly borradorPersonaId = signal<number | null>(null);
  readonly isSavingBorrador = signal(false);
  readonly borradorFeedback = signal<string | null>(null);
  readonly advancedActionModal = signal<AdvancedActionModal | null>(null);
  readonly catalogos = signal<EmpleadoFormCatalogos>(EMPTY_EMPLEADO_FORM_CATALOGOS);
  readonly perfilLaboralAutoDetections = signal<readonly PerfilLaboralAutoDetection[]>([]);
  readonly decisionCoherenciaPendiente = signal<{
    issue: InconsistenciaCoherenciaAlta;
    context: 'next' | 'finish';
  } | null>(null);
  readonly idsInconsistenciasCoherenciaReconocidas = signal<ReadonlySet<string>>(new Set());
  readonly isLoadingCatalogs = signal(true);
  readonly catalogosError = signal<string | null>(null);
  readonly completedTabs = signal<ReadonlySet<TabId>>(new Set());
  readonly attemptedTabs = signal<ReadonlySet<TabId>>(new Set());
  readonly visitedWizardSteps = signal<ReadonlySet<number>>(new Set([0]));
  readonly attemptedWizardSteps = signal<ReadonlySet<number>>(new Set());

  setModo(modo: FormEmpleadoModo): void {
    this.modo.set(modo);
  }

  selectWizardStep(step: number): void {
    this.pasoWizardActivo.set(step);
    this.markWizardStepVisited(step);
  }

  markWizardStepVisited(step: number): void {
    this.visitedWizardSteps.update((prev) => new Set([...prev, step]));
  }

  markWizardStepAttempted(step: number): void {
    this.markWizardStepVisited(step);
    this.attemptedWizardSteps.update((prev) => new Set([...prev, step]));
  }
}
