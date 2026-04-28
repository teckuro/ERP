import { CommonModule } from '@angular/common';
import { Component, DestroyRef, ElementRef, OnInit, inject, signal } from '@angular/core';
import { AbstractControl, ReactiveFormsModule } from '@angular/forms';
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
} from '../../mappers/empleado-form.mapper';
import {
  EMPTY_EMPLEADO_FORM_CATALOGOS,
  EmpleadoFormCatalogos,
} from '../../models/empleado-catalogos.model';
import {
  EMPLEADO_FORM_CONCEPTUAL_STEP_LABELS,
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
type FinalReviewStatus = 'Completo' | 'Pendiente de revision';
type ValidationStepId = TabId;
type ValidationSeverity = 'error' | 'warning' | 'info';
type ValidationPanelMode = 'step' | 'global';
type StepValidationStatus = 'pending' | 'in-progress' | 'invalid' | 'complete';
type FormEmpleadoModo = 'basico' | 'avanzado';

interface FinalReviewItem {
  label: string;
  status: FinalReviewStatus;
}

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
  readonly activeTab = signal<TabId>('datosPersonales');
  readonly isSaving = signal(false);
  readonly attemptedSave = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  /** Flujo que originó el último guardado exitoso (para el modal, sin depender solo de la ruta). */
  readonly successFlow = signal<FormEmpleadoModo | null>(null);
  readonly createdEmployeeId = signal<number | null>(null);
  readonly catalogos = signal<EmpleadoFormCatalogos>(EMPTY_EMPLEADO_FORM_CATALOGOS);
  readonly isLoadingCatalogs = signal(true);
  readonly catalogosError = signal<string | null>(null);
  readonly completedTabs = signal<ReadonlySet<TabId>>(new Set());
  readonly attemptedTabs = signal<ReadonlySet<TabId>>(new Set());
  readonly form: EmpleadoFormGroup = this.empleadosFormService.createForm();
  readonly totalSteps = TAB_ORDER.length;
  readonly breadcrumbItems: readonly RecordBreadcrumbItem[] = [
    { label: 'Empleados', link: '/empleados' },
    { label: 'Creacion de ficha' },
  ];
  readonly conceptualSteps = [...EMPLEADO_FORM_CONCEPTUAL_STEP_LABELS];

  /** Inventario de bloques por paso (manifest); referencia unica frente a templates de seccion. */
  readonly stepBlockIds = EMPLEADO_FORM_STEP_BLOCK_IDS;

  async ngOnInit(): Promise<void> {
    this.modo.set(this.resolveModo());
    this.empleadosFormService.configureFormBehavior(this.form, this.destroyRef, () =>
      this.catalogos(),
    );
    await this.loadCatalogos();
  }

  selectTab(tabId: TabId | string): void {
    if (!this.isKnownTab(tabId)) {
      return;
    }

    this.updateTabCompletion(this.activeTab());
    this.activeTab.set(tabId);
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
    void this.onSubmit();
  }

  isConceptualStepActive(index: number): boolean {
    return TAB_ORDER[index] === this.activeTab();
  }

  conceptualStepTab(index: number): TabId {
    return TAB_ORDER[index] ?? 'datosPersonales';
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

    const firstIncompleteTab = this.findFirstIncompleteTab();

    if (firstIncompleteTab || this.form.invalid) {
      this.syncCompletedTabsFromValidity();
      this.showInvalidTab(firstIncompleteTab ?? this.findFirstInvalidTab());
      return;
    }

    this.markAllValidTabsAsCompleted();
    this.isSaving.set(true);

    try {
      const created = await this.empleadosService.crear(
        mapEmpleadoFormToPayload(this.form, this.catalogos()),
      );

      this.successMessage.set(
        `La ficha de ${created.nombre} quedo activa y lista para operar en remuneraciones.`,
      );
      this.successFlow.set('avanzado');
      this.createdEmployeeId.set(created.id);
      this.form.markAsPristine();
    } catch (error) {
      this.errorMessage.set(this.resolveSaveErrorMessage(error));
    } finally {
      this.isSaving.set(false);
    }
  }

  dismissErrorMessage(): void {
    this.errorMessage.set(null);
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
    return this.isBasicMode() ? 'Creacion basica de empleado' : 'Alta de colaborador';
  }

  saveActionLabel(): string {
    return this.isBasicMode() ? 'Crear empleado' : 'Crear empleado activo';
  }

  /** En alta avanzada el guardado va en el pie ("Finalizar alta"); el header solo debe permitir volver. */
  headerVisibleActions(): readonly ('back' | 'save')[] {
    return this.isAdvancedMode() ? (['back'] as const) : (['back', 'save'] as const);
  }

  /** Modal de exito: titulo (solo copia distinta en creacion basica). */
  successModalTitle(): string {
    return this.successFlow() === 'basico'
      ? 'Empleado registrado correctamente'
      : 'Ficha registrada';
  }

  /** Modal de exito: texto del boton principal (basico -> Ir al listado, avanzado -> Aceptar). */
  successModalPrimaryLabel(): string {
    return this.successFlow() === 'basico' ? 'Ir al listado' : 'Aceptar';
  }

  goToPreviousTab(): void {
    const currentIndex = TAB_ORDER.indexOf(this.activeTab());

    if (currentIndex > 0) {
      this.activeTab.set(TAB_ORDER[currentIndex - 1]);
    }
  }

  goToNextTab(): void {
    const currentIndex = TAB_ORDER.indexOf(this.activeTab());

    if (currentIndex >= TAB_ORDER.length - 1) {
      return;
    }

    this.updateTabCompletion(this.activeTab());
    this.activeTab.set(TAB_ORDER[currentIndex + 1]);
    this.scrollToPageStart();
  }

  isFirstTab(): boolean {
    return TAB_ORDER.indexOf(this.activeTab()) === 0;
  }

  isLastTab(): boolean {
    return TAB_ORDER.indexOf(this.activeTab()) === TAB_ORDER.length - 1;
  }

  isNextDisabled(): boolean {
    return false;
  }

  activeStepNumber(): number {
    return TAB_ORDER.indexOf(this.activeTab()) + 1;
  }

  completedStepCount(): number {
    return TAB_ORDER.filter((tabId) => this.getStepValidationSummary(tabId).status === 'complete')
      .length;
  }

  pendingValidationCount(): number {
    return this.pendingValidationPanelItems().length;
  }

  validationPanelItems(): EvaluatedValidationRule[] {
    return this.getValidationPanelItemsForStep(this.activeTab(), 'step');
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

  private resolveModo(): FormEmpleadoModo {
    return this.route.snapshot.queryParamMap.get('modo') === 'basico' ? 'basico' : 'avanzado';
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
      this.errorMessage.set(this.resolveSaveErrorMessage(error));
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
        'Nombre del colaborador',
        () => personal.nombres.valid,
      ),
      this.rule(
        'personal.lastname',
        'datosPersonales',
        'Apellido paterno obligatorio',
        'error',
        true,
        'datosPersonales.apellidoPaterno',
        'Nombre del colaborador',
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
        'contract.position',
        'contrato',
        'Cargo obligatorio',
        'error',
        true,
        'contrato.cargo',
        'Contrato',
        () => contrato.cargo.valid,
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
        () => contrato.tipoContrato.value !== 'INDEFINIDO',
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
        'Jornada',
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
        () => bancario.numeroCuenta.valid,
      ),
    ];
  }

  private evaluateValidationRules(): EvaluatedValidationRule[] {
    return this.getAllValidationRules().map((rule) => {
      const applicable = rule.isApplicable();

      return {
        id: rule.id,
        stepId: rule.stepId,
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

  private getValidationPanelItemsForStep(
    stepId: ValidationStepId,
    mode: ValidationPanelMode,
  ): EvaluatedValidationRule[] {
    return this.evaluateValidationRules()
      .filter((item) => item.visible && (mode === 'global' || item.stepId === stepId))
      .sort((left, right) => this.validationSortWeight(left) - this.validationSortWeight(right));
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

    return fullName || 'Nuevo Colaborador';
  }

  rutVisible(): string {
    return this.form.controls.datosPersonales.controls.rut.value.trim() || 'Sin RUT';
  }

  cargoVisible(): string {
    return this.form.controls.contrato.controls.cargo.value.trim() || 'Sin cargo';
  }

  sucursalVisible(): string {
    const selectedId = this.form.controls.contrato.controls.idSucursal.value;
    const sucursal = this.catalogos().sucursales.find((option) => option.value === selectedId);

    return sucursal?.label || 'Sin sucursal';
  }

  finalReviewItems(): FinalReviewItem[] {
    return [
      {
        label: 'Identificacion y contacto',
        status: this.reviewStatus(
          this.getStepValidationSummary('datosPersonales').blockingPending === 0,
        ),
      },
      {
        label: 'Informacion laboral',
        status: this.reviewStatus(this.getStepValidationSummary('contrato').blockingPending === 0),
      },
      {
        label: 'Prevision y salud',
        status: this.reviewStatus(
          this.getStepValidationSummary('previsionSalud').blockingPending === 0,
        ),
      },
      {
        label: 'Pago y cierre',
        status: this.reviewStatus(this.getStepValidationSummary('bancario').blockingPending === 0),
      },
    ];
  }

  reviewStatusClass(status: FinalReviewStatus): string {
    return status === 'Completo' ? 'is-complete' : 'is-pending';
  }

  private reviewStatus(isComplete: boolean): FinalReviewStatus {
    return isComplete ? 'Completo' : 'Pendiente de revision';
  }

  private findFirstInvalidTab(): TabId {
    return (
      TAB_ORDER.find((tabId) =>
        tabId === 'datosPersonales'
          ? this.getPersonalSectionState().invalid
          : this.getSection(tabId).invalid,
      ) ?? 'datosPersonales'
    );
  }

  private findFirstIncompleteTab(): TabId | null {
    return TAB_ORDER.find((tabId) => this.isTabInvalid(tabId)) ?? null;
  }

  private updateTabCompletion(tabId: TabId): void {
    if (this.isTabInvalid(tabId)) {
      this.removeCompletedTab(tabId);
      return;
    }

    this.markTabAsCompleted(tabId);
  }

  private showInvalidTab(tabId: TabId): void {
    this.activeTab.set(tabId);
    this.markTabAsTouched(tabId);
    this.markTabAsAttempted(tabId);
    this.focusFirstInvalidControl(tabId);
  }

  private focusFirstInvalidControl(tabId: TabId = this.activeTab()): void {
    window.setTimeout(() => {
      const firstInvalidControl =
        this.findFirstControlForPendingValidation(tabId) ?? this.findFirstNgInvalidControl();

      if (!firstInvalidControl) {
        return;
      }

      firstInvalidControl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstInvalidControl.focus({ preventScroll: true });
    });
  }

  private findFirstControlForPendingValidation(tabId: TabId): HTMLElement | null {
    const firstPendingRule = this.getValidationPanelItemsForStep(tabId, 'step').find(
      (item) => item.blocking && !item.complete,
    );
    const controlName = firstPendingRule?.sourcePath.split('.').at(-1);

    if (!controlName) {
      return null;
    }

    const controlHost = this.hostElement.nativeElement.querySelector<HTMLElement>(
      `.step-panel [formControlName="${controlName}"], .step-panel [formcontrolname="${controlName}"]`,
    );

    return this.getFocusableField(controlHost);
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

  private isKnownTab(tabId: string): tabId is TabId {
    return TAB_ORDER.includes(tabId as TabId);
  }

  isTabInvalid(tabId: TabId): boolean {
    return this.getStepValidationSummary(tabId).blockingPending > 0;
  }

  private markTabAsTouched(tabId: TabId): void {
    if (tabId === 'datosPersonales') {
      this.markControlAsTouched(this.form.controls.datosPersonales);
      this.markControlAsTouched(this.form.controls.contacto);
      return;
    }

    this.markControlAsTouched(this.getSection(tabId));
  }

  private markControlAsTouched(control: AbstractControl): void {
    control.markAllAsTouched();
    control.updateValueAndValidity({ emitEvent: false });
  }

  private markTabAsAttempted(tabId: TabId): void {
    this.attemptedTabs.update((tabs) => new Set([...tabs, tabId]));
  }

  private attemptAllTabs(): void {
    this.attemptedTabs.set(new Set(TAB_ORDER));
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
        return 'Supabase bloqueo la escritura por politicas RLS. Ejecuta bd/base/v11/crear_sql_v6_11_integrada.sql y vuelve a intentar.';
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
}
