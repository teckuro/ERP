import { CommonModule } from '@angular/common';
import { Component, DestroyRef, ElementRef, OnInit, inject, signal } from '@angular/core';
import { AbstractControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import { BancarioComponent } from '../secciones/bancario/bancario';
import { ContratoComponent } from '../secciones/contrato/contrato';
import { DatosPersonalesComponent } from '../secciones/datos-personales/datos-personales';
import { ContactoComponent } from '../secciones/contacto/contacto';
import { PrevisionSaludComponent } from '../secciones/prevision-salud/prevision-salud';
import {
  mapEmpleadoFormToPayload,
  mapEmpleadoFormToPayloadBasico,
  mapEmpleadoFormToPayloadBorrador,
} from '../../mappers/empleado-form.mapper';
import { validateBorradorAvanzadoFormMinimo } from '../../utils/empleado-borrador-form.validation';
import { normalizarBorradorAvanzadoParaFormulario } from '../../utils/empleado-borrador-hidratacion';
import {
  EMPTY_EMPLEADO_FORM_CATALOGOS,
  EmpleadoFormCatalogos,
} from '../../models/empleado-catalogos.model';
import {
  EMPLEADO_ADVANCED_WIZARD_LABELS,
  EMPLEADO_ADVANCED_WIZARD_STEP_COUNT,
  EMPLEADO_FORM_STEP_BLOCK_IDS,
  EMPLEADO_FORM_TAB_ORDER,
  EmpleadoFormTabId,
} from '../../models/empleado-form.manifest';
import { EmpleadoFormGroup } from '../../models/empleado-form.model';
import { EmpleadosFormOrchestratorService } from '../../services/empleados-form-orchestrator.service';
import { EmpleadosCatalogosService } from '../../services/empleados-catalogos.service';
import {
  EmpleadoReferenciaInvalidaError,
  EmpleadoRutDuplicadoError,
  EmpleadosService,
} from '../../services/empleados.service';
import {
  CardComponent,
  CardContentComponent,
} from '../../../../shared/components/ui/card.component';
import { MessageBoxComponent } from '../../../../shared/components/ui/message-box.component';
import { PageActionsComponent } from '../../../../shared/components/ui/page-actions.component';
import {
  RecordBreadcrumbComponent,
  RecordBreadcrumbItem,
} from '../../../../shared/components/ui/record-breadcrumb.component';

type TabId = EmpleadoFormTabId;
type WizardStepUiKind =
  | 'actual'
  | 'completo'
  | 'pendiente'
  | 'errores'
  | 'opcional'
  | 'no-aplica';
type ValidationStepId = TabId;
type ValidationSeverity = 'error' | 'warning' | 'info';
type StepValidationStatus = 'pending' | 'in-progress' | 'invalid' | 'complete';
type FormEmpleadoModo = 'basico' | 'avanzado';

interface ValidationRule {
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

interface EvaluatedValidationRule {
  id: string;
  stepId: ValidationStepId;
  wizardStep: number;
  label: string;
  severity: ValidationSeverity;
  blocking: boolean;
  complete: boolean;
  visible: boolean;
  sourcePath: string;
  category?: string;
}

interface StepValidationSummary {
  stepId: ValidationStepId;
  pending: number;
  blockingPending: number;
  warningsPending: number;
  complete: number;
  applicable: number;
  status: StepValidationStatus;
}

interface GlobalValidationSummary {
  blockingPending: number;
  warningsPending: number;
  completeSteps: number;
  invalidSteps: number;
  pendingTotal: number;
}

const TAB_ORDER: readonly TabId[] = [...EMPLEADO_FORM_TAB_ORDER];

/** Mensajes de negocio al intentar finalizar con bloqueos (paso 9); no exponer detalle técnico de BD. */
const MENSAJES_FINALIZAR_ALTA: Partial<Record<string, string>> = {
  'contract.position': 'Define un cargo real antes de finalizar.',
  'contract.branch': 'Selecciona sucursal y organización antes de finalizar.',
  'contract.worker-type': 'Selecciona un tipo de trabajador real antes de finalizar.',
  'contract.schedule-type': 'Selecciona un tipo de jornada real antes de finalizar.',
  'contract.contract-type': 'Selecciona el tipo de contrato antes de finalizar.',
  'contract.start-date': 'Ingresa la fecha de ingreso antes de finalizar.',
  'contract.document-date': 'Ingresa la fecha de contrato antes de finalizar.',
  'contract.end-date': 'Completa la fecha de término del contrato antes de finalizar.',
  'contract.salary': 'Ingresa un sueldo base válido antes de finalizar.',
  'contract.currency': 'Selecciona la moneda de remuneración antes de finalizar.',
  'contract.weekly-hours': 'Completa la jornada semanal antes de finalizar.',
  'contract.weekly-days': 'Completa los días semanales antes de finalizar.',
  'prevision.regime': 'Completa previsión y salud antes de finalizar.',
  'prevision.afp': 'Completa AFP y régimen previsional antes de finalizar.',
  'prevision.health': 'Completa institución de salud y plan antes de finalizar.',
  'prevision.health-currency': 'Completa moneda y valor del plan de salud antes de finalizar.',
  'prevision.health-plan': 'Completa el valor del plan de salud antes de finalizar.',
  'prevision.apv-institution': 'Completa APVI o desactiva "Tiene APVI".',
  'prevision.apv-currency': 'Completa APVI o desactiva "Tiene APVI".',
  'prevision.apv-amount': 'Completa APVI o desactiva "Tiene APVI".',
  'prevision.apv-payment': 'Completa APVI o desactiva "Tiene APVI".',
  'prevision.apv-agreement': 'Completa APVI o desactiva "Tiene APVI".',
  'prevision.ips-name': 'Completa la información de previsión IPS antes de finalizar.',
  'prevision.ips-regime': 'Completa la información de previsión IPS antes de finalizar.',
  'prevision.ips-rate': 'Completa la información de previsión IPS antes de finalizar.',
  'prevision.health-ges': 'Completa el adicional Auge/GES del plan de salud antes de finalizar.',
  'prevision.account2-currency': 'Completa Cuenta 2 AFP o deja los montos en blanco.',
  'prevision.account2-value': 'Completa Cuenta 2 AFP o deja los montos en blanco.',
  'bank.bank': 'Selecciona un banco real antes de finalizar.',
  'bank.account-type': 'Selecciona un tipo de cuenta real antes de finalizar.',
  'bank.account-number': 'Reemplaza la cuenta bancaria temporal o ingresa una cuenta real.',
};

@Component({
  selector: 'app-form-empleado',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucideAngularModule,
    CardComponent,
    CardContentComponent,
    RecordBreadcrumbComponent,
    PageActionsComponent,
    MessageBoxComponent,
    DatosPersonalesComponent,
    ContactoComponent,
    ContratoComponent,
    PrevisionSaludComponent,
    BancarioComponent,
  ],
  templateUrl: './form-empleado.html',
  styleUrl: './form-empleado.css',
})
export class FormEmpleadoComponent implements OnInit {
  private readonly empleadosService = inject(EmpleadosService);
  private readonly empleadosCatalogosService = inject(EmpleadosCatalogosService);
  private readonly empleadosFormService = inject(EmpleadosFormOrchestratorService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly hostElement = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly modo = signal<FormEmpleadoModo>('avanzado');
  /** Creacion avanzada: indice de etapa 0..8 (9 pasos). */
  readonly activeWizardStep = signal(0);
  readonly isSaving = signal(false);
  readonly attemptedSave = signal(false);
  readonly errorMessage = signal<string | null>(null);
  /** RUT duplicado: modal estructurado (mismo layout que éxito básico, variante error). */
  readonly duplicateRutModalRut = signal<string | null>(null);

  advancedStatusBadgeLabel(): string {
    return 'Avanzada';
  }
  readonly successMessage = signal<string | null>(null);
  /** Flujo que originó el último guardado exitoso (para el modal, sin depender solo de la ruta). */
  readonly successFlow = signal<FormEmpleadoModo | null>(null);
  readonly createdEmployeeId = signal<number | null>(null);
  /** Creación avanzada: id persona al actualizar borrador o null si es alta nueva. */
  readonly borradorPersonaId = signal<number | null>(null);
  readonly isSavingBorrador = signal(false);
  readonly borradorFeedback = signal<string | null>(null);
  readonly catalogos = signal<EmpleadoFormCatalogos>(EMPTY_EMPLEADO_FORM_CATALOGOS);
  readonly isLoadingCatalogs = signal(true);
  readonly catalogosError = signal<string | null>(null);
  readonly completedTabs = signal<ReadonlySet<TabId>>(new Set());
  readonly attemptedTabs = signal<ReadonlySet<TabId>>(new Set());
  readonly visitedWizardSteps = signal<ReadonlySet<number>>(new Set([0]));
  readonly attemptedWizardSteps = signal<ReadonlySet<number>>(new Set());
  readonly form: EmpleadoFormGroup = this.empleadosFormService.createForm();
  readonly totalSteps = EMPLEADO_ADVANCED_WIZARD_STEP_COUNT;
  readonly breadcrumbItems: readonly RecordBreadcrumbItem[] = [
    { label: 'Empleados', link: '/empleados' },
    { label: 'Creación de ficha' },
  ];
  readonly advancedWizardLabels = [...EMPLEADO_ADVANCED_WIZARD_LABELS];
  readonly advancedWizardShortLabels: readonly string[] = [
    'Datos personales',
    'Domicilio',
    'Contrato',
    'Jornada',
    'Asignaciones',
    'Previsión y salud',
    'APVI',
    'Banco',
    'Resumen',
  ] as const;

  readonly advancedWizardStepDescriptions: readonly string[] = [
    'Registra la identidad legal, datos personales y contacto base del colaborador.',
    'Registra la dirección particular del colaborador para mantener actualizada su información de contacto.',
    'Define la relación laboral, fechas contractuales y ubicación organizacional del colaborador.',
    'Define la jornada laboral, distribución de horario y remuneración base del colaborador.',
    'Registra cargas familiares y condiciones especiales que pueden afectar remuneraciones.',
    'Define el régimen previsional y la institución de salud del trabajador.',
    'Registra APVI solo si aplica.',
    'Define banco, cuenta y forma de pago.',
    'Revisa la información capturada antes de finalizar la creación de la ficha.',
  ] as const;

  /** Inventario de bloques por paso (manifest); referencia unica frente a templates de seccion. */
  readonly stepBlockIds = EMPLEADO_FORM_STEP_BLOCK_IDS;

  async ngOnInit(): Promise<void> {
    const modo = this.resolveModo();
    this.modo.set(modo);
    if (modo === 'avanzado') {
      this.form.controls.contacto.controls.idComuna.addValidators(Validators.required);
      this.form.controls.contacto.controls.idComuna.updateValueAndValidity({ emitEvent: false });
    }
    this.empleadosFormService.configureFormBehavior(this.form, this.destroyRef, () =>
      this.catalogos(),
    );
    await this.loadCatalogos();
    if (this.modo() === 'avanzado') {
      const rawId = this.route.snapshot.queryParamMap.get('idPersona');
      const idPersona = rawId ? Number(rawId) : NaN;
      const debeHidratarBorrador = Number.isInteger(idPersona) && idPersona >= 1;
      if (debeHidratarBorrador) {
        this.isLoadingCatalogs.set(true);
      }
      try {
        await this.loadContinuacionBorradorSiAplica();
      } finally {
        if (debeHidratarBorrador) {
          this.isLoadingCatalogs.set(false);
        }
      }
    }
  }

  async onGuardarBorrador(): Promise<void> {
    if (!this.isAdvancedMode() || this.isSavingBorrador() || this.isSaving()) {
      return;
    }
    if (this.isLoadingCatalogs()) {
      this.borradorFeedback.set(null);
      this.errorMessage.set(
        'La informacion base del formulario aun se esta cargando. Espera unos segundos e intenta nuevamente.',
      );
      return;
    }

    const err = validateBorradorAvanzadoFormMinimo(this.form);
    if (err) {
      this.borradorFeedback.set(null);
      this.errorMessage.set(err);
      return;
    }

    this.errorMessage.set(null);
    this.borradorFeedback.set(null);
    this.isSavingBorrador.set(true);
    const prevId = this.borradorPersonaId();

    try {
      const payload = mapEmpleadoFormToPayloadBorrador(this.form, this.catalogos());
      const resumen = await this.empleadosService.guardarBorradorAvanzado(
        prevId,
        payload,
        this.activeWizardStep(),
      );
      this.borradorPersonaId.set(resumen.id);
      this.borradorFeedback.set(
        prevId === null ? 'Borrador guardado correctamente.' : 'Borrador actualizado.',
      );
      this.form.markAsPristine();
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { idPersona: resumen.id },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
      window.setTimeout(() => this.borradorFeedback.set(null), 4500);
    } catch (error) {
      if (error instanceof EmpleadoRutDuplicadoError) {
        this.duplicateRutModalRut.set(error.rut);
      } else {
        this.errorMessage.set(
          error instanceof Error ? error.message : 'No fue posible guardar el borrador.',
        );
      }
    } finally {
      this.isSavingBorrador.set(false);
    }
  }

  selectWizardStep(index: number): void {
    if (index < 0 || index >= EMPLEADO_ADVANCED_WIZARD_STEP_COUNT) {
      return;
    }

    this.syncCompletedTabsFromValidity();
    this.activeWizardStep.set(index);
    this.markWizardStepVisited(index);
    this.scrollToCurrentStepStart({ focusFirstField: true });
  }

  wizardStepShortLabel(stepIndex: number): string {
    return this.advancedWizardShortLabels[stepIndex] ?? this.advancedWizardLabels[stepIndex] ?? '';
  }

  wizardStepDescription(stepIndex: number): string {
    return this.advancedWizardStepDescriptions[stepIndex] ?? '';
  }

  wizardProgressPercent(): number {
    return Math.round(((this.activeWizardStep() + 1) / this.totalSteps) * 100);
  }

  async loadCatalogos(): Promise<void> {
    this.catalogosError.set(null);
    this.isLoadingCatalogs.set(true);

    try {
      const catalogos = await this.empleadosCatalogosService.obtenerFormulario();
      this.catalogos.set(catalogos);
      this.empleadosFormService.applyCatalogDefaults(this.form, catalogos);
    } catch {
      this.catalogosError.set(
        'No fue posible preparar la informacion requerida para el formulario. Intenta nuevamente.',
      );
    } finally {
      this.isLoadingCatalogs.set(false);
    }
  }

  handleFormSubmit(event: SubmitEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.isAdvancedMode() && this.activeWizardStep() !== 8) {
      return;
    }
    void this.onSubmit();
  }

  isWizardStepActive(index: number): boolean {
    return this.activeWizardStep() === index;
  }

  /** Secuencia de indices al usar Siguiente / Anterior (omite APVI si no aplica). */
  linearWizardSequence(): readonly number[] {
    const base = [0, 1, 2, 3, 4, 5] as const;
    const p = this.form.controls.previsionSalud.controls;
    const incluyeApvi =
      p.tipoRegimenPrevisional.value === 'AFP' && p.tieneApv.value === true;
    if (incluyeApvi) {
      return [...base, 6, 7, 8];
    }
    return [...base, 7, 8];
  }

  async onSubmit(): Promise<void> {
    if (this.isSaving()) {
      return;
    }

    this.attemptedSave.set(true);
    if (this.isBasicMode()) {
      this.attemptBasicGroups();
    } else {
      this.attemptAllTabs();
    }
    this.errorMessage.set(null);
    this.duplicateRutModalRut.set(null);
    this.successMessage.set(null);
    this.successFlow.set(null);
    this.createdEmployeeId.set(null);
    this.markSubmitControlsAsTouched();

    if (this.isLoadingCatalogs()) {
      this.errorMessage.set(
        'La informacion base del formulario aun se esta cargando. Espera unos segundos e intenta nuevamente.',
      );
      return;
    }

    if (this.isBasicMode()) {
      if (this.isBasicFormInvalid()) {
        this.focusFirstInvalidControl();
        return;
      }

      await this.submitBasicMode();
      return;
    }

    const firstBadStep = this.findFirstWizardStepWithBlockingIssues();

    if (firstBadStep !== null || this.form.invalid) {
      this.syncCompletedTabsFromValidity();
      this.showInvalidWizardStep(firstBadStep ?? 0);
      return;
    }

    this.markAllValidTabsAsCompleted();
    this.isSaving.set(true);

    try {
      const borradorId = this.borradorPersonaId();
      if (borradorId !== null) {
        await this.empleadosService.finalizarAltaAvanzadaExistente(
          borradorId,
          mapEmpleadoFormToPayload(this.form, this.catalogos()),
        );
        this.successMessage.set(
          'La ficha avanzada fue guardada correctamente y el empleado quedo listo para operar.',
        );
        this.successFlow.set('avanzado');
        this.createdEmployeeId.set(borradorId);
        this.borradorPersonaId.set(null);
        this.form.markAsPristine();
        void this.router.navigate(['/empleados/nuevo'], { replaceUrl: true });
      } else {
        const created = await this.empleadosService.crear(
          mapEmpleadoFormToPayload(this.form, this.catalogos()),
        );

        this.successMessage.set(
          'La ficha avanzada fue guardada correctamente y el empleado quedo listo para operar.',
        );
        this.successFlow.set('avanzado');
        this.createdEmployeeId.set(created.id);
        this.form.markAsPristine();
      }
    } catch (error) {
      if (error instanceof EmpleadoRutDuplicadoError) {
        this.duplicateRutModalRut.set(error.rut);
      } else {
        this.errorMessage.set(this.resolveSaveErrorMessage(error));
      }
    } finally {
      this.isSaving.set(false);
    }
  }

  dismissErrorMessage(): void {
    this.errorMessage.set(null);
    this.duplicateRutModalRut.set(null);
  }

  goToEmployeeList(): void {
    this.successMessage.set(null);
    this.successFlow.set(null);
    this.createdEmployeeId.set(null);
    void this.router.navigate(['/empleados']);
  }

  handleSuccessAction(): void {
    this.goToEmployeeList();
  }

  isBasicMode(): boolean {
    return this.modo() === 'basico';
  }

  isAdvancedMode(): boolean {
    return this.modo() === 'avanzado';
  }

  pageTitle(): string {
    return 'Crear empleado';
  }

  saveActionLabel(): string {
    return this.isBasicMode() ? 'Guardar ficha básica' : 'Crear empleado activo';
  }

  /** Avanzada: guardado en el pie. Básica: Volver + Guardar en cabecera (modo-basico / sin duplicar pie). */
  headerVisibleActions(): readonly ('back' | 'save')[] {
    return this.isBasicMode() ? (['back', 'save'] as const) : (['back'] as const);
  }

  /** Modal de exito: titulo (solo copia distinta en creacion basica). */
  successModalTitle(): string {
    return this.successFlow() === 'basico'
      ? 'Empleado registrado correctamente'
      : 'Empleado registrado correctamente';
  }

  /** Modal de exito: texto del boton principal. */
  successModalPrimaryLabel(): string {
    return 'Ir al listado';
  }

  goToPreviousTab(): void {
    const seq = this.linearWizardSequence();
    let idx = seq.indexOf(this.activeWizardStep());
    if (idx === -1) {
      const cur = this.activeWizardStep();
      const candidates = seq.filter((s) => s < cur);
      const prev = candidates.length ? candidates[candidates.length - 1]! : seq[0]!;
      this.syncCompletedTabsFromValidity();
      this.activeWizardStep.set(prev);
      this.markWizardStepVisited(prev);
      this.scrollToCurrentStepStart({ focusFirstField: true });
      return;
    }
    if (idx > 0) {
      this.syncCompletedTabsFromValidity();
      const previous = seq[idx - 1]!;
      this.activeWizardStep.set(previous);
      this.markWizardStepVisited(previous);
      this.scrollToCurrentStepStart({ focusFirstField: true });
    }
  }

  goToNextTab(): void {
    const seq = this.linearWizardSequence();
    let idx = seq.indexOf(this.activeWizardStep());
    this.markWizardStepAttempted(this.activeWizardStep());
    if (idx === -1) {
      const cur = this.activeWizardStep();
      const next = seq.find((s) => s > cur);
      if (next !== undefined) {
        this.syncCompletedTabsFromValidity();
        this.activeWizardStep.set(next);
        this.markWizardStepVisited(next);
        this.scrollToCurrentStepStart({ focusFirstField: true });
      }
      return;
    }
    if (idx < seq.length - 1) {
      this.syncCompletedTabsFromValidity();
      const next = seq[idx + 1]!;
      this.activeWizardStep.set(next);
      this.markWizardStepVisited(next);
      this.scrollToCurrentStepStart({ focusFirstField: true });
    }
  }

  isFirstTab(): boolean {
    const seq = this.linearWizardSequence();
    const idx = seq.indexOf(this.activeWizardStep());
    if (idx === -1) {
      return this.activeWizardStep() <= seq[0]!;
    }
    return idx === 0;
  }

  isLastTab(): boolean {
    const seq = this.linearWizardSequence();
    return this.activeWizardStep() === seq[seq.length - 1]!;
  }

  isNextDisabled(): boolean {
    return false;
  }

  activeStepNumber(): number {
    return this.activeWizardStep() + 1;
  }

  completedStepCount(): number {
    let n = 0;
    for (let i = 0; i < EMPLEADO_ADVANCED_WIZARD_STEP_COUNT; i++) {
      if (this.getWizardStepValidationSummary(i).status === 'complete') {
        n++;
      }
    }
    return n;
  }

  pendingValidationCount(): number {
    return this.pendingValidationPanelItems().length;
  }

  validationPanelItems(): EvaluatedValidationRule[] {
    return this.evaluateValidationRules().filter(
      (item) => item.visible && item.wizardStep === this.activeWizardStep(),
    );
  }

  pendingValidationPanelItems(): EvaluatedValidationRule[] {
    return this.validationPanelItems().filter((item) => !item.complete);
  }

  blockingValidationPanelItems(): EvaluatedValidationRule[] {
    return this.pendingValidationPanelItems().filter((item) => item.severity === 'error');
  }

  warningValidationPanelItems(): EvaluatedValidationRule[] {
    return this.pendingValidationPanelItems().filter((item) => item.severity === 'warning');
  }

  getStepValidationSummary(stepId: ValidationStepId): StepValidationSummary {
    if (!this.isAdvancedMode()) {
      const evaluated = this.evaluateValidationRules().filter(
        (item) => item.stepId === stepId && item.visible,
      );
      const pending = evaluated.filter((item) => !item.complete);
      const blockingPending = pending.filter((item) => item.blocking).length;
      const warningsPending = pending.filter((item) => item.severity === 'warning').length;
      const wasAttempted = this.attemptedTabs().has(stepId) || this.attemptedSave();
      const hasInteraction = this.hasStepInteraction(stepId);

      let status: StepValidationStatus = 'pending';

      if (blockingPending > 0 && wasAttempted) {
        status = 'invalid';
      } else if (blockingPending === 0 && evaluated.length > 0) {
        status = 'complete';
      } else if (hasInteraction || pending.length > 0) {
        status = 'in-progress';
      }

      return {
        stepId,
        pending: pending.length,
        blockingPending,
        warningsPending,
        complete: evaluated.length - pending.length,
        applicable: evaluated.length,
        status,
      };
    }

    const indices = this.wizardStepsForTab(stepId);
    const parts = indices.map((i) => this.computeWizardStepValidationCore(i));
    const pending = parts.reduce((sum, p) => sum + p.pending, 0);
    const blockingPending = parts.reduce((sum, p) => sum + p.blockingPending, 0);
    const warningsPending = parts.reduce((sum, p) => sum + p.warningsPending, 0);
    const applicable = parts.reduce((sum, p) => sum + p.applicable, 0);
    const complete = parts.reduce((sum, p) => sum + p.complete, 0);
    const wasAttempted =
      this.attemptedSave() || indices.some((i) => this.attemptedWizardSteps().has(i));
    const hasInteraction = indices.some((i) => this.hasWizardStepInteraction(i));

    let status: StepValidationStatus = 'pending';

    if (blockingPending > 0 && wasAttempted) {
      status = 'invalid';
    } else if (blockingPending === 0 && applicable > 0 && pending === 0) {
      status = 'complete';
    } else if (hasInteraction || pending > 0) {
      status = 'in-progress';
    }

    return {
      stepId,
      pending,
      blockingPending,
      warningsPending,
      complete,
      applicable,
      status,
    };
  }

  getWizardStepValidationSummary(wizardStepIndex: number): StepValidationSummary {
    if (wizardStepIndex === 8) {
      const blockingUpstream =
        [0, 1, 2, 3, 4, 5, 6, 7].some(
          (i) => this.computeWizardStepValidationCore(i).blockingPending > 0,
        ) || this.form.invalid;
      const wasAttempted = this.attemptedSave();
      let status: StepValidationStatus = 'pending';

      if (!blockingUpstream) {
        status = 'complete';
      } else if (wasAttempted) {
        status = 'invalid';
      } else {
        status = 'in-progress';
      }

      return {
        stepId: 'bancario',
        pending: blockingUpstream ? 1 : 0,
        blockingPending: blockingUpstream ? 1 : 0,
        warningsPending: 0,
        complete: !blockingUpstream ? 1 : 0,
        applicable: 1,
        status,
      };
    }

    return this.computeWizardStepValidationCore(wizardStepIndex);
  }

  wizardStepUiKind(stepIndex: number): WizardStepUiKind {
    const isActive = this.isWizardStepActive(stepIndex);
    const stepWasAttempted = this.wizardStepWasAttempted(stepIndex);

    if (stepIndex === 8) {
      const summary = this.getWizardStepValidationSummary(8);
      if (summary.blockingPending > 0 && this.attemptedSave()) {
        return 'errores';
      }
      if (isActive) {
        return 'actual';
      }
      if (summary.blockingPending === 0) {
        return 'completo';
      }
      return 'pendiente';
    }

    const previsionTipo = this.form.controls.previsionSalud.controls.tipoRegimenPrevisional.value;
    const tieneApv = this.form.controls.previsionSalud.controls.tieneApv.value;

    if (stepIndex === 6 && previsionTipo !== 'AFP') {
      return 'no-aplica';
    }

    if (stepIndex === 6 && previsionTipo === 'AFP' && !tieneApv) {
      return 'opcional';
    }

    const summary = this.getWizardStepValidationSummary(stepIndex);
    /** Respeta la secuencia lineal (p. ej. paso 7 no “pasó” el 6 si APVI está fuera del flujo). */
    const stepRelevantForUi = this.wizardStepShownAsProgressed(stepIndex);

    if (summary.blockingPending > 0 && stepWasAttempted) {
      return 'errores';
    }

    if (isActive) {
      return 'actual';
    }

    if (summary.blockingPending === 0 && summary.status === 'complete') {
      if (!stepRelevantForUi) {
        return 'pendiente';
      }
      return 'completo';
    }

    if (stepIndex === 6 && previsionTipo === 'AFP' && tieneApv && summary.applicable === 0) {
      return 'opcional';
    }

    return 'pendiente';
  }

  wizardStepUiLabel(kind: WizardStepUiKind): string {
    switch (kind) {
      case 'actual':
        return 'Actual';
      case 'completo':
        return 'Completado';
      case 'pendiente':
        return 'Pendiente';
      case 'errores':
        return 'Con errores';
      case 'opcional':
        return 'Opcional';
      case 'no-aplica':
        return 'No aplica';
    }
  }

  advancedReviewRows(): { stepIndex: number; label: string; kind: WizardStepUiKind }[] {
    return this.advancedWizardLabels.map((label, stepIndex) => ({
      stepIndex,
      label,
      kind: this.reviewStepUiKind(stepIndex),
    }));
  }

  /**
   * Paso 9: pendientes en lenguaje de negocio tras intentar finalizar (reglas bloqueantes).
   */
  resumenPendientesNegocio(): string[] {
    if (!this.isAdvancedMode() || this.activeWizardStep() !== 8 || !this.attemptedSave()) {
      return [];
    }

    const seen = new Set<string>();
    const out: string[] = [];
    let blockingSinMensaje = 0;

    for (const item of this.evaluateValidationRules()) {
      if (!item.visible || item.complete || !item.blocking || item.severity !== 'error') {
        continue;
      }

      const msg = MENSAJES_FINALIZAR_ALTA[item.id];
      if (msg) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          out.push(msg);
        }
      } else {
        blockingSinMensaje += 1;
      }
    }

    if (out.length === 0 && blockingSinMensaje > 0) {
      out.push('Revisa las etapas con pendientes o errores antes de finalizar.');
    }

    return out.slice(0, 10);
  }

  reviewRowDescription(row: { stepIndex: number; kind: WizardStepUiKind }): string {
    switch (row.kind) {
      case 'errores':
        return 'Corrige los datos obligatorios antes de finalizar.';
      case 'pendiente':
        return 'Faltan datos obligatorios o revisión de esta etapa.';
      case 'opcional':
        return 'Completa esta etapa solo si corresponde.';
      case 'no-aplica':
        return 'Esta etapa no corresponde para la configuración actual.';
      default:
        return '';
    }
  }

  hasReviewBlockingStates(): boolean {
    return this.advancedReviewRows().some((row) =>
      ['pendiente', 'errores'].includes(row.kind),
    );
  }

  identificacionResumen(): string {
    const rut = this.form.controls.datosPersonales.controls.rut.value.trim();
    const pas = this.form.controls.datosPersonales.controls.pasaporte.value.trim();
    if (rut) {
      return rut;
    }
    if (pas) {
      return `Pasaporte ${pas}`;
    }
    return 'Sin información';
  }

  getGlobalValidationSummary(): GlobalValidationSummary {
    const summaries = TAB_ORDER.map((stepId) => this.getStepValidationSummary(stepId));

    return {
      blockingPending: summaries.reduce((total, summary) => total + summary.blockingPending, 0),
      warningsPending: summaries.reduce((total, summary) => total + summary.warningsPending, 0),
      completeSteps: summaries.filter((summary) => summary.status === 'complete').length,
      invalidSteps: summaries.filter((summary) => summary.status === 'invalid').length,
      pendingTotal: summaries.reduce((total, summary) => total + summary.pending, 0),
    };
  }

  wizardMapPendingCount(): number {
    return this.advancedWizardLabels.filter(
      (_, index) => this.wizardStepUiKind(index) === 'pendiente',
    ).length;
  }

  wizardMapOptionalCount(): number {
    return this.advancedWizardLabels.filter(
      (_, index) => this.wizardStepUiKind(index) === 'opcional',
    ).length;
  }

  wizardMapErrorCount(): number {
    return this.advancedWizardLabels.filter(
      (_, index) => this.wizardStepUiKind(index) === 'errores',
    ).length;
  }

  wizardMapNotApplicableCount(): number {
    return this.advancedWizardLabels.filter(
      (_, index) => this.wizardStepUiKind(index) === 'no-aplica',
    ).length;
  }

  wizardMapSummaryLabel(): string {
    const errors = this.wizardMapErrorCount();
    const pending = this.wizardMapPendingCount();
    const optional = this.wizardMapOptionalCount();
    const notApplicable = this.wizardMapNotApplicableCount();
    const parts: string[] = [];

    if (errors > 0) {
      parts.push(`${errors} ${errors === 1 ? 'paso con errores' : 'pasos con errores'}`);
    }

    if (pending > 0) {
      parts.push(`${pending} ${pending === 1 ? 'paso pendiente' : 'pasos pendientes'}`);
    }

    if (optional > 0) {
      parts.push(`${optional} ${optional === 1 ? 'paso opcional' : 'pasos opcionales'}`);
    }

    if (errors === 0 && notApplicable > 0) {
      parts.push(`${notApplicable} ${notApplicable === 1 ? 'paso no aplica' : 'pasos no aplican'}`);
    }

    return parts.length ? parts.join(' · ') : 'Sin pendientes visibles';
  }

  private resolveWizardStep(rule: ValidationRule): number {
    if (rule.sourcePath === 'contacto.idComuna') {
      return 1;
    }

    if (rule.stepId === 'datosPersonales') {
      return 0;
    }

    if (rule.stepId === 'bancario') {
      return 7;
    }

    if (rule.stepId === 'previsionSalud') {
      return rule.category === 'APVI' ? 6 : 5;
    }

    if (rule.stepId === 'contrato') {
      const cat = rule.category ?? '';
      if (cat === 'Zona extrema' || cat === 'Cargas' || cat === 'Semana corrida') {
        return 4;
      }
      if (cat === 'Jornada' || cat === 'Remuneracion') {
        return 3;
      }
      return 2;
    }

    return 0;
  }

  private wizardStepsForTab(tabId: TabId): number[] {
    switch (tabId) {
      case 'datosPersonales':
        return [0, 1];
      case 'contrato':
        return [2, 3, 4];
      case 'previsionSalud':
        return [5, 6];
      case 'bancario':
        return [7];
    }
  }

  private primaryTabForWizardStep(step: number): TabId {
    if (step <= 1) {
      return 'datosPersonales';
    }
    if (step <= 4) {
      return 'contrato';
    }
    if (step <= 6) {
      return 'previsionSalud';
    }
    return 'bancario';
  }

  private hasWizardStepInteraction(wizardStepIndex: number): boolean {
    if (this.attemptedSave()) {
      return true;
    }
    if (this.attemptedWizardSteps().has(wizardStepIndex)) {
      return true;
    }
    const tab = this.primaryTabForWizardStep(wizardStepIndex);
    return this.attemptedTabs().has(tab) || this.completedTabs().has(tab);
  }

  private markWizardStepVisited(step: number): void {
    this.visitedWizardSteps.update((prev) => new Set([...prev, step]));
  }

  private markWizardStepAttempted(step: number): void {
    this.markWizardStepVisited(step);
    this.attemptedWizardSteps.update((prev) => new Set([...prev, step]));
  }

  private wizardStepWasAttempted(stepIndex: number): boolean {
    return this.attemptedSave() || this.attemptedWizardSteps().has(stepIndex);
  }

  /**
   * Indica si el paso ya cuenta como “alcanzado” en el flujo lineal (para pintar completo/errores).
   * Evita marcar el paso 7 como “pasó” el 6 cuando APVI no está en `linearWizardSequence()`.
   */
  private wizardStepShownAsProgressed(stepIndex: number): boolean {
    if (this.attemptedSave() || this.attemptedWizardSteps().has(stepIndex)) {
      return true;
    }
    if (this.visitedWizardSteps().has(stepIndex)) {
      return true;
    }
    const seq = this.linearWizardSequence();
    const active = this.activeWizardStep();
    const iAct = seq.indexOf(active);
    const iStep = seq.indexOf(stepIndex);

    if (iAct === -1) {
      return stepIndex === active;
    }
    if (iStep === -1) {
      return false;
    }
    return iStep <= iAct;
  }

  private computeWizardStepValidationCore(wizardStepIndex: number): StepValidationSummary {
    const evaluated = this.evaluateValidationRules().filter(
      (item) => item.wizardStep === wizardStepIndex && item.visible,
    );
    const pending = evaluated.filter((item) => !item.complete);
    const blockingPending = pending.filter((item) => item.blocking).length;
    const warningsPending = pending.filter((item) => item.severity === 'warning').length;
    const wasAttempted =
      this.attemptedWizardSteps().has(wizardStepIndex) || this.attemptedSave();
    const hasInteraction = this.hasWizardStepInteraction(wizardStepIndex);

    let status: StepValidationStatus = 'pending';

    if (blockingPending > 0 && wasAttempted) {
      status = 'invalid';
    } else if (blockingPending === 0 && evaluated.length > 0 && pending.length === 0) {
      status = 'complete';
    } else if (hasInteraction || pending.length > 0) {
      status = 'in-progress';
    }

    return {
      stepId: this.primaryTabForWizardStep(wizardStepIndex),
      pending: pending.length,
      blockingPending,
      warningsPending,
      complete: evaluated.length - pending.length,
      applicable: evaluated.length,
      status,
    };
  }

  private findFirstWizardStepWithBlockingIssues(): number | null {
    for (let s = 0; s <= 7; s++) {
      if (this.computeWizardStepValidationCore(s).blockingPending > 0) {
        return s;
      }
    }

    return this.form.invalid ? 0 : null;
  }

  private showInvalidWizardStep(step: number): void {
    this.activeWizardStep.set(step);
    this.attemptedWizardSteps.update((prev) => new Set([...prev, step]));
    this.attemptAllTabs();
    this.markWizardStepTouched(step);
    this.focusFirstInvalidControl(step);
  }

  private markWizardStepTouched(step: number): void {
    switch (step) {
      case 0:
        this.markControlAsTouched(this.form.controls.datosPersonales);
        this.form.controls.contacto.controls.email.markAsTouched();
        this.form.controls.contacto.controls.telefono.markAsTouched();
        break;
      case 1:
        this.markControlAsTouched(this.form.controls.contacto);
        break;
      case 2:
      case 3:
      case 4:
        this.markControlAsTouched(this.form.controls.contrato);
        break;
      case 5:
      case 6:
        this.markControlAsTouched(this.form.controls.previsionSalud);
        break;
      case 7:
        this.markControlAsTouched(this.form.controls.bancario);
        break;
      default:
        this.form.markAllAsTouched();
    }
  }

  private resolveModo(): FormEmpleadoModo {
    return this.route.snapshot.queryParamMap.get('modo') === 'basico' ? 'basico' : 'avanzado';
  }

  private async loadContinuacionBorradorSiAplica(): Promise<void> {
    const raw = this.route.snapshot.queryParamMap.get('idPersona');
    const id = raw ? Number(raw) : NaN;
    if (!Number.isInteger(id) || id < 1) {
      return;
    }

    try {
      const detalle = await this.empleadosService.obtenerPorId(id);
      if (!detalle) {
        this.catalogosError.set('No se encontro la ficha indicada para continuar el alta.');
        return;
      }
      if (detalle.pasoAltaAvanzada === null || detalle.pasoAltaAvanzada === undefined) {
        this.catalogosError.set(
          'Esta ficha no tiene un borrador de creacion avanzada guardado. Usa la ficha del empleado para completar por secciones.',
        );
        return;
      }

      const paso = Math.min(Math.max(0, detalle.pasoAltaAvanzada), this.totalSteps - 1);
      const formValue = normalizarBorradorAvanzadoParaFormulario(detalle.formValue, paso);
      this.borradorPersonaId.set(id);
      this.form.patchValue(formValue as never);
      this.activeWizardStep.set(paso);
      this.visitedWizardSteps.update((prev) => new Set([...prev, paso]));
      this.form.markAsPristine();
    } catch {
      this.catalogosError.set('No fue posible cargar el borrador para continuar el alta.');
    }
  }

  private markSubmitControlsAsTouched(): void {
    if (!this.isBasicMode()) {
      this.form.markAllAsTouched();
      return;
    }

    this.form.controls.datosPersonales.markAllAsTouched();
    this.form.controls.contacto.markAllAsTouched();
  }

  private attemptBasicGroups(): void {
    this.attemptedTabs.set(new Set<TabId>(['datosPersonales']));
  }

  private isBasicFormInvalid(): boolean {
    return this.form.controls.datosPersonales.invalid || this.form.controls.contacto.invalid;
  }

  private async submitBasicMode(): Promise<void> {
    this.isSaving.set(true);

    try {
      const created = await this.empleadosService.crearBasico(
        mapEmpleadoFormToPayloadBasico(this.form),
      );

      this.successMessage.set(
        'La creación básica fue guardada y la ficha quedó en estado "En proceso".',
      );
      this.successFlow.set('basico');
      this.createdEmployeeId.set(created.id);
      this.form.markAsPristine();
    } catch (error) {
      if (error instanceof EmpleadoRutDuplicadoError) {
        this.duplicateRutModalRut.set(error.rut);
      } else {
        this.errorMessage.set(this.resolveSaveErrorMessage(error));
      }
    } finally {
      this.isSaving.set(false);
    }
  }

  private getAllValidationRules(): ValidationRule[] {
    const personalGroup = this.form.controls.datosPersonales;
    const personal = personalGroup.controls;
    const contacto = this.form.controls.contacto.controls;
    const contrato = this.form.controls.contrato.controls;
    const prevision = this.form.controls.previsionSalud.controls;
    const bancario = this.form.controls.bancario.controls;
    const hasCuenta2 =
      prevision.tipoRegimenPrevisional.value === 'AFP' &&
      (prevision.idMonedaCuenta2.value !== null || prevision.valorCuenta2.value !== null);
    const requiereSalud =
      prevision.tipoRegimenPrevisional.value !== null &&
      prevision.tipoRegimenPrevisional.value !== 'NINGUNA';

    return [
      this.rule(
        'personal.identity',
        'datosPersonales',
        'RUT valido o pasaporte valido',
        'error',
        true,
        'datosPersonales.rut',
        'Identificacion legal',
        () =>
          !personalGroup.hasError('rutOrPassport') &&
          personal.rut.valid &&
          personal.pasaporte.valid,
      ),
      this.rule(
        'personal.birthdate',
        'datosPersonales',
        'Fecha nacimiento obligatoria',
        'error',
        true,
        'datosPersonales.fechaNacimiento',
        'Identificacion legal',
        () => personal.fechaNacimiento.valid,
      ),
      this.rule(
        'personal.names',
        'datosPersonales',
        'Nombres obligatorios',
        'error',
        true,
        'datosPersonales.nombres',
        'Nombre del empleado',
        () => personal.nombres.valid,
      ),
      this.rule(
        'personal.lastname',
        'datosPersonales',
        'Apellido paterno obligatorio',
        'error',
        true,
        'datosPersonales.apellidoPaterno',
        'Nombre del empleado',
        () => personal.apellidoPaterno.valid,
      ),
      this.rule(
        'personal.sex',
        'datosPersonales',
        'Sexo obligatorio',
        'error',
        true,
        'datosPersonales.sexo',
        'Identificacion legal',
        () => personal.sexo.valid,
      ),
      this.rule(
        'personal.country',
        'datosPersonales',
        'Nacionalidad obligatoria',
        'error',
        true,
        'datosPersonales.idPais',
        'Informacion base',
        () => personal.idPais.valid,
      ),
      this.rule(
        'personal.marital-status',
        'datosPersonales',
        'Estado civil obligatorio',
        'error',
        true,
        'datosPersonales.estadoCivil',
        'Informacion base',
        () => personal.estadoCivil.valid,
      ),
      this.rule(
        'personal.email-format',
        'datosPersonales',
        'Email con formato valido',
        'error',
        true,
        'contacto.email',
        'Informacion base',
        () => contacto.email.valid,
        () => Boolean(contacto.email.value.trim()),
      ),
      this.rule(
        'personal.phone-format',
        'datosPersonales',
        'Telefono con formato valido',
        'error',
        true,
        'contacto.telefono',
        'Informacion base',
        () => contacto.telefono.valid,
        () => Boolean(contacto.telefono.value.trim()),
      ),
      this.rule(
        'personal.email-empty',
        'datosPersonales',
        'Email no ingresado',
        'warning',
        false,
        'contacto.email',
        'Informacion base',
        () => Boolean(contacto.email.value.trim()),
      ),
      this.rule(
        'personal.phone-empty',
        'datosPersonales',
        'Telefono no ingresado',
        'warning',
        false,
        'contacto.telefono',
        'Informacion base',
        () => Boolean(contacto.telefono.value.trim()),
      ),
      this.rule(
        'personal.passport-review',
        'datosPersonales',
        'Uso de pasaporte sin validacion adicional',
        'warning',
        false,
        'datosPersonales.pasaporte',
        'Identificacion legal',
        () => Boolean(personal.rut.value.trim()),
        () => Boolean(personal.pasaporte.value.trim()) && !Boolean(personal.rut.value.trim()),
      ),
      this.rule(
        'contact.commune',
        'datosPersonales',
        'Comuna obligatoria',
        'error',
        true,
        'contacto.idComuna',
        'Domicilio',
        () => contacto.idComuna.valid,
        () => this.isAdvancedMode(),
      ),

      this.rule(
        'contract.position',
        'contrato',
        'Cargo obligatorio',
        'error',
        true,
        'contrato.cargo',
        'Contrato',
        () => contrato.cargo.valid && !this.isTechnicalCargo(contrato.cargo.value),
      ),
      this.rule(
        'contract.branch',
        'contrato',
        'Sucursal obligatoria',
        'error',
        true,
        'contrato.idSucursal',
        'Contrato',
        () => contrato.idSucursal.value !== null,
      ),
      this.rule(
        'contract.worker-type',
        'contrato',
        'Tipo trabajador obligatorio',
        'error',
        true,
        'contrato.idTipoTrabajador',
        'Contrato',
        () => contrato.idTipoTrabajador.valid,
      ),
      this.rule(
        'contract.schedule-type',
        'contrato',
        'Tipo jornada obligatorio',
        'error',
        true,
        'contrato.idTipoJornada',
        'Jornada',
        () => contrato.idTipoJornada.valid,
      ),
      this.rule(
        'contract.contract-type',
        'contrato',
        'Tipo contrato obligatorio',
        'error',
        true,
        'contrato.tipoContrato',
        'Contrato',
        () => contrato.tipoContrato.valid,
      ),
      this.rule(
        'contract.start-date',
        'contrato',
        'Fecha ingreso obligatoria',
        'error',
        true,
        'contrato.fechaIngreso',
        'Fechas',
        () => contrato.fechaIngreso.valid,
      ),
      this.rule(
        'contract.document-date',
        'contrato',
        'Fecha contrato obligatoria',
        'error',
        true,
        'contrato.fechaContrato',
        'Fechas',
        () => contrato.fechaContrato.valid,
      ),
      this.rule(
        'contract.end-date',
        'contrato',
        'Fecha termino obligatoria',
        'error',
        true,
        'contrato.fechaTermino',
        'Fechas',
        () => contrato.fechaTermino.valid,
        () =>
          contrato.tipoContrato.value !== null && contrato.tipoContrato.value !== 'INDEFINIDO',
      ),
      this.rule(
        'contract.salary',
        'contrato',
        'Sueldo base obligatorio',
        'error',
        true,
        'contrato.sueldoBase',
        'Remuneracion',
        () => contrato.sueldoBase.valid,
      ),
      this.rule(
        'contract.currency',
        'contrato',
        'Moneda obligatoria',
        'error',
        true,
        'contrato.idMoneda',
        'Remuneracion',
        () => contrato.idMoneda.value !== null,
      ),
      this.rule(
        'contract.weekly-hours',
        'contrato',
        'Horas semanales obligatorias',
        'error',
        true,
        'contrato.horasSemanales',
        'Jornada',
        () => contrato.horasSemanales.valid,
      ),
      this.rule(
        'contract.weekly-days',
        'contrato',
        'Dias semanales obligatorios',
        'error',
        true,
        'contrato.diasSemanales',
        'Jornada',
        () => contrato.diasSemanales.valid,
      ),
      this.rule(
        'contract.week-run',
        'contrato',
        'Dias de semana corrida pendientes',
        'error',
        true,
        'contrato.semanaCorridaDiasLaborables',
        'Semana corrida',
        () => contrato.semanaCorridaDiasLaborables.valid,
        () => contrato.semanaCorridaActiva.value,
      ),
      this.rule(
        'contract.extreme-zone-area',
        'contrato',
        'Territorio de zona extrema pendiente',
        'error',
        true,
        'contrato.zonaExtremaTerritorio',
        'Zona extrema',
        () => contrato.zonaExtremaTerritorio.valid,
        () => contrato.zonaExtremaActiva.value,
      ),
      this.rule(
        'contract.extreme-zone-rate',
        'contrato',
        'Porcentaje de zona extrema pendiente',
        'error',
        true,
        'contrato.zonaExtremaPorcentaje',
        'Zona extrema',
        () => contrato.zonaExtremaPorcentaje.valid,
        () => contrato.zonaExtremaActiva.value,
      ),
      this.rule(
        'contract.family-allowance',
        'contrato',
        'Tramo de cargas familiares pendiente',
        'warning',
        false,
        'contrato.idTramoCarga',
        'Cargas',
        () => contrato.idTramoCarga.value !== null,
        () => Number(contrato.cargas.value ?? 0) > 0,
      ),

      this.rule(
        'prevision.regime',
        'previsionSalud',
        'Regimen previsional obligatorio',
        'error',
        true,
        'previsionSalud.tipoRegimenPrevisional',
        'Prevision',
        () => prevision.tipoRegimenPrevisional.valid,
      ),
      this.rule(
        'prevision.afp',
        'previsionSalud',
        'AFP obligatoria',
        'error',
        true,
        'previsionSalud.idAfp',
        'Prevision',
        () => prevision.idAfp.valid,
        () => prevision.tipoRegimenPrevisional.value === 'AFP',
      ),
      this.rule(
        'prevision.ips-name',
        'previsionSalud',
        'Nombre Ex-Caja obligatorio',
        'error',
        true,
        'previsionSalud.nombreExCaja',
        'IPS',
        () => prevision.nombreExCaja.valid,
        () => prevision.tipoRegimenPrevisional.value === 'IPS',
      ),
      this.rule(
        'prevision.ips-regime',
        'previsionSalud',
        'Regimen Ex-Caja obligatorio',
        'error',
        true,
        'previsionSalud.regimenExCaja',
        'IPS',
        () => prevision.regimenExCaja.valid,
        () => prevision.tipoRegimenPrevisional.value === 'IPS',
      ),
      this.rule(
        'prevision.ips-rate',
        'previsionSalud',
        'Tasa Ex-Caja obligatoria',
        'error',
        true,
        'previsionSalud.tasaExCaja',
        'IPS',
        () => prevision.tasaExCaja.valid,
        () => prevision.tipoRegimenPrevisional.value === 'IPS',
      ),
      this.rule(
        'prevision.health',
        'previsionSalud',
        'Institucion de salud obligatoria',
        'error',
        true,
        'previsionSalud.idSalud',
        'Salud',
        () => prevision.idSalud.valid,
        () => requiereSalud,
      ),
      this.rule(
        'prevision.health-currency',
        'previsionSalud',
        'Moneda del plan de salud obligatoria',
        'error',
        true,
        'previsionSalud.idMonedaPlan',
        'Salud',
        () => prevision.idMonedaPlan.valid,
        () => requiereSalud,
      ),
      this.rule(
        'prevision.health-plan',
        'previsionSalud',
        'Valor del plan de salud obligatorio',
        'error',
        true,
        'previsionSalud.valorPlan',
        'Salud',
        () => prevision.valorPlan.valid,
        () => requiereSalud,
      ),
      this.rule(
        'prevision.health-ges',
        'previsionSalud',
        'Adicional Auge/GES obligatorio',
        'error',
        true,
        'previsionSalud.adicionalAugeGes',
        'Salud',
        () => prevision.adicionalAugeGes.valid,
        () => requiereSalud,
      ),
      this.rule(
        'prevision.account2-currency',
        'previsionSalud',
        'Moneda Cuenta 2 pendiente',
        'error',
        true,
        'previsionSalud.idMonedaCuenta2',
        'Cuenta 2',
        () => prevision.idMonedaCuenta2.valid,
        () => hasCuenta2,
      ),
      this.rule(
        'prevision.account2-value',
        'previsionSalud',
        'Valor Cuenta 2 pendiente',
        'error',
        true,
        'previsionSalud.valorCuenta2',
        'Cuenta 2',
        () => prevision.valorCuenta2.valid,
        () => hasCuenta2,
      ),
      this.rule(
        'prevision.apv-institution',
        'previsionSalud',
        'Institucion APVI pendiente',
        'error',
        true,
        'previsionSalud.idInstitucionApv',
        'APVI',
        () => prevision.idInstitucionApv.valid,
        () => prevision.tipoRegimenPrevisional.value === 'AFP' && prevision.tieneApv.value,
      ),
      this.rule(
        'prevision.apv-currency',
        'previsionSalud',
        'Moneda APVI pendiente',
        'error',
        true,
        'previsionSalud.idMonedaApv',
        'APVI',
        () => prevision.idMonedaApv.valid,
        () => prevision.tipoRegimenPrevisional.value === 'AFP' && prevision.tieneApv.value,
      ),
      this.rule(
        'prevision.apv-amount',
        'previsionSalud',
        'Monto APVI pendiente',
        'error',
        true,
        'previsionSalud.montoApv',
        'APVI',
        () => prevision.montoApv.valid,
        () => prevision.tipoRegimenPrevisional.value === 'AFP' && prevision.tieneApv.value,
      ),
      this.rule(
        'prevision.apv-payment',
        'previsionSalud',
        'Forma de pago APVI pendiente',
        'error',
        true,
        'previsionSalud.idFormaPagoApv',
        'APVI',
        () => prevision.idFormaPagoApv.valid,
        () => prevision.tipoRegimenPrevisional.value === 'AFP' && prevision.tieneApv.value,
      ),
      this.rule(
        'prevision.apv-agreement',
        'previsionSalud',
        'Deposito convenido APVI pendiente',
        'error',
        true,
        'previsionSalud.depositoConvenidoApvi',
        'APVI',
        () => prevision.depositoConvenidoApvi.valid,
        () => prevision.tipoRegimenPrevisional.value === 'AFP' && prevision.tieneApv.value,
      ),

      this.rule(
        'bank.bank',
        'bancario',
        'Banco obligatorio',
        'error',
        true,
        'bancario.idBanco',
        'Bancario',
        () => bancario.idBanco.valid,
      ),
      this.rule(
        'bank.account-type',
        'bancario',
        'Tipo de cuenta obligatorio',
        'error',
        true,
        'bancario.idTipoCuentaBancaria',
        'Bancario',
        () => bancario.idTipoCuentaBancaria.valid,
      ),
      this.rule(
        'bank.account-number',
        'bancario',
        'Numero de cuenta obligatorio',
        'error',
        true,
        'bancario.numeroCuenta',
        'Bancario',
        () => bancario.numeroCuenta.valid && !this.isDraftAccount(bancario.numeroCuenta.value),
      ),
    ];
  }

  private evaluateValidationRules(): EvaluatedValidationRule[] {
    return this.getAllValidationRules().map((rule) => {
      const applicable = rule.isApplicable();

      return {
        id: rule.id,
        stepId: rule.stepId,
        wizardStep: this.resolveWizardStep(rule),
        label: rule.label,
        severity: rule.severity,
        blocking: rule.blocking,
        complete: applicable ? rule.isComplete() : true,
        visible: applicable && (rule.isVisible?.() ?? true),
        sourcePath: rule.sourcePath,
        category: rule.category,
      };
    });
  }

  private rule(
    id: string,
    stepId: ValidationStepId,
    label: string,
    severity: ValidationSeverity,
    blocking: boolean,
    sourcePath: string,
    category: string,
    isComplete: () => boolean,
    isApplicable: () => boolean = () => true,
    isVisible?: () => boolean,
  ): ValidationRule {
    return {
      id,
      stepId,
      label,
      severity,
      blocking,
      sourcePath,
      category,
      isApplicable,
      isComplete,
      isVisible,
    };
  }

  private validationSortWeight(item: EvaluatedValidationRule): number {
    if (item.complete) {
      return 30;
    }

    if (item.severity === 'error' && item.blocking) {
      return 0;
    }

    if (item.severity === 'warning') {
      return 10;
    }

    return 20;
  }

  fullNameVisible(): string {
    const { nombres, apellidoPaterno, apellidoMaterno } =
      this.form.controls.datosPersonales.controls;
    const fullName = [nombres.value, apellidoPaterno.value, apellidoMaterno.value]
      .map((value) => value.trim())
      .filter(Boolean)
      .join(' ');

    if (fullName) {
      return fullName;
    }

    return 'Sin información';
  }

  rutVisible(): string {
    return this.form.controls.datosPersonales.controls.rut.value.trim() || 'Sin RUT';
  }

  cargoVisible(): string {
    const cargo = this.form.controls.contrato.controls.cargo.value.trim();
    return cargo && !this.isTechnicalCargo(cargo) ? cargo : 'Sin informacion';
  }

  sucursalVisible(): string {
    const selectedId = this.form.controls.contrato.controls.idSucursal.value;
    const sucursal = this.catalogos().sucursales.find((option) => option.value === selectedId);

    return sucursal?.label || 'Sin información';
  }

  checklistStatusClass(kind: WizardStepUiKind): string {
    switch (kind) {
      case 'completo':
        return 'is-complete';
      case 'errores':
        return 'is-error';
      case 'opcional':
        return 'is-optional';
      case 'no-aplica':
        return 'is-na';
      default:
        return 'is-pending';
    }
  }

  private reviewStepUiKind(stepIndex: number): WizardStepUiKind {
    const kind = this.wizardStepUiKind(stepIndex);
    if (kind !== 'actual') {
      return kind;
    }

    const summary = this.getWizardStepValidationSummary(stepIndex);
    if (summary.blockingPending > 0 && this.attemptedSave()) {
      return 'errores';
    }
    if (summary.blockingPending === 0 && summary.status === 'complete') {
      return 'completo';
    }
    return 'pendiente';
  }

  private focusFirstInvalidControl(wizardStep: number = this.activeWizardStep()): void {
    window.setTimeout(() => {
      const sorted = [...this.evaluateValidationRules()].sort(
        (a, b) => this.validationSortWeight(a) - this.validationSortWeight(b),
      );
      const firstPendingRule = sorted.find(
        (item) =>
          item.visible &&
          item.wizardStep === wizardStep &&
          item.blocking &&
          !item.complete,
      );
      const controlName = firstPendingRule?.sourcePath.split('.').at(-1);

      let firstInvalidControl: HTMLElement | null = null;

      if (controlName) {
        const controlHost = this.hostElement.nativeElement.querySelector<HTMLElement>(
          `.step-panel [formControlName="${controlName}"], .step-panel [formcontrolname="${controlName}"]`,
        );
        firstInvalidControl = this.getFocusableField(controlHost);
      }

      firstInvalidControl ??= this.findFirstNgInvalidControl();

      if (!firstInvalidControl) {
        return;
      }

      firstInvalidControl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstInvalidControl.focus({ preventScroll: true });
    });
  }

  private findFirstNgInvalidControl(): HTMLElement | null {
    const invalidHost = this.hostElement.nativeElement.querySelector<HTMLElement>(
      '.step-panel input.ng-invalid:not([type="hidden"]), .step-panel select.ng-invalid, .step-panel textarea.ng-invalid, .step-panel [formControlName].ng-invalid, .step-panel [formcontrolname].ng-invalid',
    );

    return this.getFocusableField(invalidHost);
  }

  private getFocusableField(controlHost: HTMLElement | null): HTMLElement | null {
    if (!controlHost) {
      return null;
    }

    if (this.isFocusableFormField(controlHost)) {
      return controlHost;
    }

    return controlHost.querySelector<HTMLElement>(
      'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
  }

  private isFocusableFormField(element: HTMLElement): boolean {
    return (
      element.matches('input:not([type="hidden"]):not([disabled])') ||
      element.matches('select:not([disabled])') ||
      element.matches('textarea:not([disabled])') ||
      element.matches('button:not([disabled])') ||
      element.matches('[tabindex]:not([tabindex="-1"])')
    );
  }

  private scrollToPageStart(): void {
    window.setTimeout(() => {
      const formStart =
        this.hostElement.nativeElement.querySelector<HTMLElement>('.form-page-head') ??
        this.hostElement.nativeElement;

      formStart.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  private scrollToCurrentStepStart(options: { focusFirstField: boolean }): void {
    const run = (): void => {
      const host = this.hostElement.nativeElement;
      const stepHeader = host.querySelector<HTMLElement>('.advanced-step-header');
      const stepPanel = host.querySelector<HTMLElement>('.advanced-wizard-step .step-panel');
      const target = stepHeader ?? stepPanel ?? host.querySelector<HTMLElement>('.advanced-wizard-content');

      if (!target) {
        return;
      }

      // Mantener el cambio de paso estable: sube al inicio útil del paso.
      target.scrollIntoView({ behavior: 'auto', block: 'start' });

      // En desktop, opcionalmente enfocar el primer campo habilitado para dejar el cursor listo.
      // En mobile/tablet evitamos enfocar para no abrir el teclado automáticamente.
      if (!options.focusFirstField || window.matchMedia('(max-width: 1024px)').matches) {
        return;
      }

      const firstField = stepPanel?.querySelector<HTMLElement>(
        'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );

      firstField?.focus({ preventScroll: true });
    };

    requestAnimationFrame(() => requestAnimationFrame(run));
  }

  isTabInvalid(tabId: TabId): boolean {
    return this.getStepValidationSummary(tabId).blockingPending > 0;
  }

  private markControlAsTouched(control: AbstractControl): void {
    control.markAllAsTouched();
    control.updateValueAndValidity({ emitEvent: false });
  }

  private attemptAllTabs(): void {
    this.attemptedTabs.set(new Set(TAB_ORDER));
    this.attemptedWizardSteps.set(new Set([0, 1, 2, 3, 4, 5, 6, 7, 8]));
  }

  private syncCompletedTabsFromValidity(): void {
    this.completedTabs.update((tabs) => {
      const next = new Set(tabs);

      for (const tabId of TAB_ORDER) {
        if (this.isTabInvalid(tabId)) {
          next.delete(tabId);
        } else {
          next.add(tabId);
        }
      }

      return next;
    });
  }

  private markAllValidTabsAsCompleted(): void {
    this.completedTabs.set(new Set(TAB_ORDER.filter((tabId) => !this.isTabInvalid(tabId))));
  }

  private markTabAsCompleted(tabId: TabId): void {
    this.completedTabs.update((tabs) => new Set([...tabs, tabId]));
  }

  private removeCompletedTab(tabId: TabId): void {
    this.completedTabs.update((tabs) => {
      const next = new Set(tabs);
      next.delete(tabId);
      return next;
    });
  }

  private resolveSaveErrorMessage(error: unknown): string {
    if (
      error instanceof EmpleadoRutDuplicadoError ||
      error instanceof EmpleadoReferenciaInvalidaError
    ) {
      return error.message;
    }

    if (error instanceof Error) {
      if (error.message.toLowerCase().includes('row-level security')) {
        return 'Supabase bloqueo la escritura por politicas RLS. Ejecuta bd/base/v11/run_all.sql (esquema por partes) o el monolito crear_sql_v6_11_integrada.sql y vuelve a intentar.';
      }

      return error.message;
    }

    return 'No fue posible registrar la ficha. Revisa la informacion e intenta nuevamente.';
  }

  private getSection(tabId: TabId) {
    switch (tabId) {
      case 'datosPersonales':
        return this.form.controls.datosPersonales;
      case 'contrato':
        return this.form.controls.contrato;
      case 'previsionSalud':
        return this.form.controls.previsionSalud;
      case 'bancario':
        return this.form.controls.bancario;
    }
  }

  private isFormSectionInvalid(tabId: TabId): boolean {
    return tabId === 'datosPersonales'
      ? this.getPersonalSectionState().invalid
      : this.getSection(tabId).invalid;
  }

  private hasStepInteraction(tabId: TabId): boolean {
    if (
      this.completedTabs().has(tabId) ||
      this.attemptedTabs().has(tabId) ||
      this.attemptedSave()
    ) {
      return true;
    }

    if (tabId === 'datosPersonales') {
      const personal = this.getPersonalSectionState();
      return personal.dirty || personal.touched;
    }

    const section = this.getSection(tabId);
    return section.dirty || section.touched;
  }

  private getPersonalSectionState() {
    const datosPersonales = this.form.controls.datosPersonales;
    const contacto = this.form.controls.contacto;

    return {
      invalid: datosPersonales.invalid || contacto.invalid,
      valid: datosPersonales.valid && contacto.valid,
      dirty: datosPersonales.dirty || contacto.dirty,
      touched: datosPersonales.touched || contacto.touched,
    };
  }

  private isTechnicalCargo(value: string): boolean {
    return this.normalizeTechnicalText(value) === this.normalizeTechnicalText('Sin cargo');
  }

  private isDraftAccount(value: string): boolean {
    return value.trim().toUpperCase().startsWith('DRAFT-');
  }

  private normalizeTechnicalText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  }
}
