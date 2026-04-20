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
type ValidationSeverity = 'error' | 'warning';

interface FinalReviewItem {
  label: string;
  status: FinalReviewStatus;
}

interface ValidationPanelItem {
  label: string;
  severity: ValidationSeverity;
  complete: boolean;
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

  async onSubmit(): Promise<void> {
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
        return 'Registra la informacion basica del colaborador y sus datos de contacto para iniciar la ficha.';
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

  completedStepCount(): number {
    return TAB_ORDER.filter((tabId) => this.completedTabs().has(tabId) && !this.isTabInvalid(tabId))
      .length;
  }

  pendingValidationCount(): number {
    return this.pendingValidationPanelItems().length;
  }

  activeStepStateLabel(): string {
    const current = this.activeTab();

    if (this.isTabInvalid(current) && (this.attemptedTabs().has(current) || this.attemptedSave())) {
      return 'Requiere revision';
    }

    if (!this.isTabInvalid(current) && this.completedTabs().has(current)) {
      return 'Completo';
    }

    return 'En curso';
  }

  validationPanelItems(): ValidationPanelItem[] {
    switch (this.activeTab()) {
      case 'datosPersonales':
        return this.personalValidationItems();
      case 'contrato':
        return this.contractValidationItems();
      case 'previsionSalud':
        return this.previsionValidationItems();
      case 'bancario':
        return this.bankValidationItems();
    }
  }

  pendingValidationPanelItems(): ValidationPanelItem[] {
    return this.validationPanelItems().filter((item) => !item.complete);
  }

  private personalValidationItems(): ValidationPanelItem[] {
    const personalGroup = this.form.controls.datosPersonales;
    const personal = personalGroup.controls;
    const contacto = this.form.controls.contacto.controls;
    const rut = personal.rut.value.trim();
    const pasaporte = personal.pasaporte.value.trim();

    return [
      {
        label: 'RUT o pasaporte obligatorio pendiente',
        severity: 'error',
        complete:
          !personalGroup.hasError('rutOrPassport') && personal.rut.valid && personal.pasaporte.valid,
      },
      {
        label: 'Fecha nacimiento obligatoria',
        severity: 'error',
        complete: personal.fechaNacimiento.valid,
      },
      {
        label: 'Nombres obligatorio pendiente',
        severity: 'error',
        complete: personal.nombres.valid,
      },
      {
        label: 'Apellido paterno obligatorio',
        severity: 'error',
        complete: personal.apellidoPaterno.valid,
      },
      {
        label: 'Sexo obligatorio pendiente',
        severity: 'error',
        complete: personal.sexo.valid,
      },
      {
        label: 'Nacionalidad obligatoria pendiente',
        severity: 'error',
        complete: personal.idPais.valid,
      },
      {
        label: 'Estado civil obligatorio pendiente',
        severity: 'error',
        complete: personal.estadoCivil.valid,
      },
      {
        label: 'Email no ingresado',
        severity: 'warning',
        complete: Boolean(contacto.email.value.trim()),
      },
      {
        label: 'Telefono no ingresado',
        severity: 'warning',
        complete: Boolean(contacto.telefono.value.trim()),
      },
      {
        label: 'Uso de pasaporte sin validacion adicional',
        severity: 'warning',
        complete: !pasaporte || Boolean(rut),
      },
    ];
  }

  private contractValidationItems(): ValidationPanelItem[] {
    const controls = this.form.controls.contrato.controls;

    return [
      { label: 'Tipo trabajador obligatorio pendiente', severity: 'error', complete: controls.idTipoTrabajador.valid },
      { label: 'Tipo jornada obligatorio pendiente', severity: 'error', complete: controls.idTipoJornada.valid },
      { label: 'Fecha de ingreso obligatoria pendiente', severity: 'error', complete: controls.fechaIngreso.valid },
      { label: 'Fecha de contrato obligatoria pendiente', severity: 'error', complete: controls.fechaContrato.valid },
      { label: 'Fecha de termino obligatoria pendiente', severity: 'error', complete: controls.fechaTermino.valid },
      { label: 'Horas semanales obligatorias pendientes', severity: 'error', complete: controls.horasSemanales.valid },
      { label: 'Dias semanales obligatorios pendientes', severity: 'error', complete: controls.diasSemanales.valid },
      { label: 'Sueldo base obligatorio pendiente', severity: 'error', complete: controls.sueldoBase.valid },
      { label: 'Cargo obligatorio pendiente', severity: 'error', complete: controls.cargo.valid },
      { label: 'Territorio de zona extrema pendiente', severity: 'error', complete: controls.zonaExtremaTerritorio.valid },
      { label: 'Porcentaje de zona extrema pendiente', severity: 'error', complete: controls.zonaExtremaPorcentaje.valid },
      { label: 'Dias de semana corrida pendientes', severity: 'error', complete: controls.semanaCorridaDiasLaborables.valid },
    ];
  }

  private previsionValidationItems(): ValidationPanelItem[] {
    const controls = this.form.controls.previsionSalud.controls;

    return [
      { label: 'Tipo regimen previsional obligatorio pendiente', severity: 'error', complete: controls.tipoRegimenPrevisional.valid },
      { label: 'AFP obligatoria pendiente', severity: 'error', complete: controls.idAfp.valid },
      { label: 'Moneda Cuenta 2 pendiente', severity: 'error', complete: controls.idMonedaCuenta2.valid },
      { label: 'Valor Cuenta 2 pendiente', severity: 'error', complete: controls.valorCuenta2.valid },
      { label: 'Nombre Ex-Caja pendiente', severity: 'error', complete: controls.nombreExCaja.valid },
      { label: 'Regimen Ex-Caja pendiente', severity: 'error', complete: controls.regimenExCaja.valid },
      { label: 'Tasa Ex-Caja pendiente', severity: 'error', complete: controls.tasaExCaja.valid },
      { label: 'Institucion de salud pendiente', severity: 'error', complete: controls.idSalud.valid },
      { label: 'Moneda del plan de salud pendiente', severity: 'error', complete: controls.idMonedaPlan.valid },
      { label: 'Valor del plan de salud pendiente', severity: 'error', complete: controls.valorPlan.valid },
      { label: 'Adicional Auge/GES pendiente', severity: 'error', complete: controls.adicionalAugeGes.valid },
      { label: 'Institucion APVI pendiente', severity: 'error', complete: controls.idInstitucionApv.valid },
      { label: 'Moneda APVI pendiente', severity: 'error', complete: controls.idMonedaApv.valid },
      { label: 'Monto APVI pendiente', severity: 'error', complete: controls.montoApv.valid },
      { label: 'Forma de pago APVI pendiente', severity: 'error', complete: controls.idFormaPagoApv.valid },
      { label: 'Deposito convenido APVI pendiente', severity: 'error', complete: controls.depositoConvenidoApvi.valid },
    ];
  }

  private bankValidationItems(): ValidationPanelItem[] {
    const controls = this.form.controls.bancario.controls;

    return [
      { label: 'Banco obligatorio pendiente', severity: 'error', complete: controls.idBanco.valid },
      { label: 'Tipo de cuenta obligatorio pendiente', severity: 'error', complete: controls.idTipoCuentaBancaria.valid },
      { label: 'Numero de cuenta obligatorio pendiente', severity: 'error', complete: controls.numeroCuenta.valid },
    ];
  }

  sideStepStateLabel(step: EmpleadoStepperItem): string {
    if (step.id === this.activeTab()) {
      return 'Activo';
    }

    switch (step.status) {
      case 'complete':
        return 'Completo';
      case 'invalid':
        return 'Invalido';
      default:
        return 'Pendiente';
    }
  }

  fullNameVisible(): string {
    const { nombres, apellidoPaterno, apellidoMaterno } = this.form.controls.datosPersonales.controls;
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
        status: this.reviewStatus(this.getPersonalSectionState().valid),
      },
      {
        label: 'Datos laborales iniciales',
        status: this.reviewStatus(this.form.controls.contrato.valid),
      },
      {
        label: 'Configuracion previsional inicial',
        status: this.reviewStatus(this.form.controls.previsionSalud.valid),
      },
      {
        label: 'Datos administrativos',
        status: this.reviewStatus(this.form.controls.bancario.valid),
      },
    ];
  }

  reviewStatusClass(status: FinalReviewStatus): string {
    return status === 'Completo' ? 'is-complete' : 'is-pending';
  }

  private tabStatus(tabId: TabId): 'pending' | 'invalid' | 'complete' {
    const section =
      tabId === 'datosPersonales' ? this.getPersonalSectionState() : this.getSection(tabId);
    const wasAttempted = this.attemptedTabs().has(tabId) || this.attemptedSave();

    if (section.invalid && wasAttempted) {
      return 'invalid';
    }

    if (section.valid && this.completedTabs().has(tabId)) {
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
    return tabId === 'datosPersonales'
      ? this.getPersonalSectionState().invalid
      : this.getSection(tabId).invalid;
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
