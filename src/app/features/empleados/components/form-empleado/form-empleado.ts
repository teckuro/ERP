import { CommonModule } from '@angular/common';
import { Component, DestroyRef, ElementRef, OnInit, inject, signal } from '@angular/core';
import { AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import { BancarioComponent } from '../secciones/bancario/bancario';
import { ContratoComponent } from '../secciones/contrato/contrato';
import { DatosPersonalesComponent } from '../secciones/datos-personales/datos-personales';
import { ContactoComponent } from '../secciones/contacto/contacto';
import { PrevisionSaludComponent } from '../secciones/prevision-salud/prevision-salud';
import { mapEmpleadoFormToPayload } from '../../mappers/empleado-form.mapper';
import {
  EMPTY_EMPLEADO_FORM_CATALOGOS,
  EmpleadoFormCatalogos,
} from '../../models/empleado-catalogos.model';
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
import { PageTitleComponent } from '../../../../shared/components/ui/page-title.component';
import { StepperItem } from '../../../../shared/components/ui/stepper.component';

type TabId = 'datosPersonales' | 'contrato' | 'previsionSalud' | 'bancario';
type EmpleadoStepperItem = StepperItem & { id: TabId };
type FinalReviewStatus = 'Completo' | 'Pendiente de revision';
type ValidationStepId = TabId;
type ValidationSeverity = 'error' | 'warning' | 'info';
type ValidationPanelMode = 'step' | 'global';
type StepValidationStatus = 'pending' | 'in-progress' | 'invalid' | 'complete';

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

const TAB_ORDER: readonly TabId[] = ['datosPersonales', 'contrato', 'previsionSalud', 'bancario'];
const TABS: readonly EmpleadoStepperItem[] = [
  { id: 'datosPersonales', label: 'Datos personales' },
  { id: 'contrato', label: 'Datos laborales' },
  { id: 'previsionSalud', label: 'Prevision' },
  { id: 'bancario', label: 'Complementarios' },
];

@Component({
  selector: 'app-form-empleado',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucideAngularModule,
    CardComponent,
    CardContentComponent,
    PageTitleComponent,
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
  private readonly hostElement = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly tabs = TABS;
  readonly activeTab = signal<TabId>('datosPersonales');
  readonly isSaving = signal(false);
  readonly attemptedSave = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly createdEmployeeId = signal<number | null>(null);
  readonly catalogos = signal<EmpleadoFormCatalogos>(EMPTY_EMPLEADO_FORM_CATALOGOS);
  readonly isLoadingCatalogs = signal(true);
  readonly catalogosError = signal<string | null>(null);
  readonly completedTabs = signal<ReadonlySet<TabId>>(new Set());
  readonly attemptedTabs = signal<ReadonlySet<TabId>>(new Set());
  readonly form: EmpleadoFormGroup = this.empleadosFormService.createForm();
  readonly totalSteps = TAB_ORDER.length;

  async ngOnInit(): Promise<void> {
    this.empleadosFormService.configureFormBehavior(this.form, this.destroyRef, () =>
      this.catalogos(),
    );
    await this.loadCatalogos();
  }

  selectTab(tabId: TabId | string): void {
    if (!this.isKnownTab(tabId)) {
      return;
    }

    const currentIndex = TAB_ORDER.indexOf(this.activeTab());
    const targetIndex = TAB_ORDER.indexOf(tabId);

    if (targetIndex > currentIndex) {
      const blockingTab = this.validateTabsUntil(targetIndex);

      if (blockingTab) {
        this.showInvalidTab(blockingTab);
        return;
      }
    }

    this.activeTab.set(tabId);
  }

  stepperItems(): EmpleadoStepperItem[] {
    return this.tabs.map((tab) => ({
      ...tab,
      status: this.tabStatus(tab.id),
    }));
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

  async onSubmit(): Promise<void> {
    if (this.isSaving()) {
      return;
    }

    this.attemptedSave.set(true);
    this.attemptAllTabs();
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.createdEmployeeId.set(null);
    this.form.markAllAsTouched();

    if (this.isLoadingCatalogs()) {
      this.errorMessage.set(
        'La informacion base del formulario aun se esta cargando. Espera unos segundos e intenta nuevamente.',
      );
      return;
    }

    if (this.form.invalid) {
      this.syncCompletedTabsFromValidity();
      this.showInvalidTab(this.findFirstInvalidTab());
      return;
    }

    this.markAllValidTabsAsCompleted();
    this.isSaving.set(true);

    try {
      const created = await this.empleadosService.crear(
        mapEmpleadoFormToPayload(this.form, this.catalogos()),
      );

      this.successMessage.set(
        `La ficha de ${created.nombre} quedo registrada en estado inicial. Completa la informacion pendiente para habilitar al colaborador en remuneraciones.`,
      );
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
    this.createdEmployeeId.set(null);
    void this.router.navigate(['/empleados']);
  }

  goToPreviousTab(): void {
    const currentIndex = TAB_ORDER.indexOf(this.activeTab());

    if (currentIndex > 0) {
      this.activeTab.set(TAB_ORDER[currentIndex - 1]);
    }
  }

  goToNextTab(): void {
    if (this.isNextDisabled()) {
      return;
    }

    const currentIndex = TAB_ORDER.indexOf(this.activeTab());

    if (currentIndex >= TAB_ORDER.length - 1) {
      return;
    }

    if (!this.completeCurrentTabIfValid()) {
      this.focusFirstInvalidControl();
      return;
    }

    this.activeTab.set(TAB_ORDER[currentIndex + 1]);
  }

  isFirstTab(): boolean {
    return TAB_ORDER.indexOf(this.activeTab()) === 0;
  }

  isLastTab(): boolean {
    return TAB_ORDER.indexOf(this.activeTab()) === TAB_ORDER.length - 1;
  }

  isNextDisabled(): boolean {
    return !this.isLastTab() && this.isTabInvalid(this.activeTab());
  }

  activeStepTitle(): string {
    switch (this.activeTab()) {
      case 'datosPersonales':
        return 'Identificacion de la ficha';
      case 'contrato':
        return 'Datos laborales iniciales';
      case 'previsionSalud':
        return 'Configuracion previsional inicial';
      case 'bancario':
        return 'Datos administrativos';
    }
  }

  activeStepDescription(): string {
    switch (this.activeTab()) {
      case 'datosPersonales':
        return 'Completa los datos del colaborador.';
      case 'contrato':
        return 'Define cargo, jornada, fechas y condiciones laborales iniciales de la ficha.';
      case 'previsionSalud':
        return 'Registra la configuracion previsional, AFP, salud y parametros complementarios de la ficha.';
      case 'bancario':
        return 'Registra informacion bancaria y datos administrativos para completar la ficha inicial.';
    }
  }

  currentStepLabel(): string {
    return `Paso ${TAB_ORDER.indexOf(this.activeTab()) + 1} de ${this.totalSteps}`;
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

  activeStepStateLabel(): string {
    switch (this.getStepValidationSummary(this.activeTab()).status) {
      case 'invalid':
        return 'Requiere revision';
      case 'complete':
        return 'Completo';
      case 'in-progress':
        return 'En curso';
      case 'pending':
        return 'Pendiente';
    }
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

  sideStepStateLabel(step: EmpleadoStepperItem): string {
    if (step.id === this.activeTab()) {
      return 'Activo';
    }

    switch (this.getStepValidationSummary(step.id).status) {
      case 'complete':
        return 'Completo';
      case 'invalid':
        return 'Invalido';
      case 'in-progress':
        return 'En curso';
      default:
        return 'Pendiente';
    }
  }

  fullNameVisible(): string {
    const { nombres, apellidoPaterno, apellidoMaterno } =
      this.form.controls.datosPersonales.controls;
    const fullName = [nombres.value, apellidoPaterno.value, apellidoMaterno.value]
      .map((value) => value.trim())
      .filter(Boolean)
      .join(' ');

    return fullName || 'Sin nombre';
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
        label: 'Datos laborales iniciales',
        status: this.reviewStatus(this.getStepValidationSummary('contrato').blockingPending === 0),
      },
      {
        label: 'Configuracion previsional inicial',
        status: this.reviewStatus(
          this.getStepValidationSummary('previsionSalud').blockingPending === 0,
        ),
      },
      {
        label: 'Datos administrativos',
        status: this.reviewStatus(this.getStepValidationSummary('bancario').blockingPending === 0),
      },
    ];
  }

  reviewStatusClass(status: FinalReviewStatus): string {
    return status === 'Completo' ? 'is-complete' : 'is-pending';
  }

  private tabStatus(tabId: TabId): 'pending' | 'invalid' | 'complete' {
    const status = this.getStepValidationSummary(tabId).status;

    if (status === 'invalid') {
      return 'invalid';
    }

    if (status === 'complete') {
      return 'complete';
    }

    return 'pending';
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

  private completeCurrentTabIfValid(): boolean {
    const tabId = this.activeTab();
    this.markTabAsTouched(tabId);
    this.markTabAsAttempted(tabId);

    if (this.isTabInvalid(tabId)) {
      this.removeCompletedTab(tabId);
      return false;
    }

    this.markTabAsCompleted(tabId);
    return true;
  }

  private validateTabsUntil(targetIndex: number): TabId | null {
    const currentIndex = TAB_ORDER.indexOf(this.activeTab());

    for (let index = currentIndex; index < targetIndex; index += 1) {
      const tabId = TAB_ORDER[index];
      this.markTabAsTouched(tabId);
      this.markTabAsAttempted(tabId);

      if (this.isTabInvalid(tabId)) {
        this.removeCompletedTab(tabId);
        return tabId;
      }

      this.markTabAsCompleted(tabId);
    }

    return null;
  }

  private showInvalidTab(tabId: TabId): void {
    this.activeTab.set(tabId);
    this.markTabAsTouched(tabId);
    this.markTabAsAttempted(tabId);
    this.focusFirstInvalidControl();
  }

  private focusFirstInvalidControl(): void {
    window.setTimeout(() => {
      const firstInvalidControl = this.hostElement.nativeElement.querySelector<HTMLElement>(
        '.step-panel input.ng-invalid:not([type="hidden"]), .step-panel select.ng-invalid, .step-panel textarea.ng-invalid, .step-panel [formControlName].ng-invalid',
      );

      if (!firstInvalidControl) {
        return;
      }

      firstInvalidControl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstInvalidControl.focus({ preventScroll: true });
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
        return 'Supabase bloqueo la escritura por politicas RLS. Ejecuta el script scripts/fix_empleados_alta_rls_supabase.sql y vuelve a intentar.';
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
