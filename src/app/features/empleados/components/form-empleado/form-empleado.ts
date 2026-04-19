import { CommonModule } from '@angular/common';
import { Component, DestroyRef, ElementRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import { FormEmpleadoBancarioComponent } from '../form-empleado-bancario/form-empleado-bancario';
import { FormEmpleadoContactoComponent } from '../form-empleado-contacto/form-empleado-contacto';
import { FormEmpleadoContratoComponent } from '../form-empleado-contrato/form-empleado-contrato';
import { FormEmpleadoDatosPersonalesComponent } from '../form-empleado-datos-personales/form-empleado-datos-personales';
import { FormEmpleadoPrevisionSaludComponent } from '../form-empleado-prevision-salud/form-empleado-prevision-salud';
import {
  EMPTY_EMPLEADO_FORM_CATALOGOS,
  EmpleadoCatalogOption,
  EmpleadoCreacion,
  EmpleadoFormCatalogos,
  EmpleadoFormGroup,
  EmpleadoSexo,
  RelacionLaboral,
  TipoContrato,
  TipoEstadoCivil,
  TipoGratificacion,
  TipoRegimenPrevisional,
  TramoCargaCatalogOption,
} from '../../models/empleado-form.model';
import { EmpleadoEstado } from '../../models/empleado-listado.model';
import {
  EmpleadoReferenciaInvalidaError,
  EmpleadoRutDuplicadoError,
  EmpleadosService,
} from '../../services/empleados.service';
import {
  CardComponent,
  CardContentComponent,
} from '../../../../shared/components/ui/card.component';
import { PageActionsComponent } from '../../../../shared/components/ui/page-actions.component';
import { PageTitleComponent } from '../../../../shared/components/ui/page-title.component';
import { StepperComponent, StepperItem } from '../../../../shared/components/ui/stepper.component';
import { MessageBoxComponent } from '../../../../shared/components/ui/message-box.component';

type TabId = 'datosPersonales' | 'contrato' | 'previsionSalud' | 'bancario';
type EmpleadoStepperItem = StepperItem & { id: TabId };

const TAB_ORDER: readonly TabId[] = ['datosPersonales', 'contrato', 'previsionSalud', 'bancario'];
const TABS: readonly EmpleadoStepperItem[] = [
  {
    id: 'datosPersonales',
    label: 'Datos personales',
  },
  {
    id: 'contrato',
    label: 'Datos laborales',
  },
  {
    id: 'previsionSalud',
    label: 'Previsión',
  },
  {
    id: 'bancario',
    label: 'Cuenta bancaria',
  },
];

const atLeastOneArrayValueValidator: ValidatorFn = (control) => {
  const value = control.value;
  return Array.isArray(value) && value.length > 0 ? null : { required: true };
};

const personNameValidator: ValidatorFn = (control): ValidationErrors | null => {
  const value = String(control.value ?? '').trim();

  if (!value) {
    return null;
  }

  return /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]+$/.test(value) ? null : { personName: true };
};

const digitsOnlyValidator: ValidatorFn = (control): ValidationErrors | null => {
  const value = String(control.value ?? '').trim();

  if (!value) {
    return null;
  }

  return /^\d+$/.test(value) ? null : { digitsOnly: true };
};

const rutValidator: ValidatorFn = (control): ValidationErrors | null => {
  const rawValue = String(control.value ?? '').replace(/[^0-9kK]/g, '').toUpperCase();

  if (!rawValue) {
    return null;
  }

  if (!/^\d{7,9}[0-9K]$/.test(rawValue)) {
    return { rut: true };
  }

  const body = rawValue.slice(0, -1);
  const verifier = rawValue.slice(-1);
  let multiplier = 2;
  let sum = 0;

  for (let index = body.length - 1; index >= 0; index -= 1) {
    sum += Number(body[index]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const expectedValue = 11 - (sum % 11);
  const expectedVerifier = expectedValue === 11 ? '0' : expectedValue === 10 ? 'K' : String(expectedValue);

  return verifier === expectedVerifier ? null : { rut: true };
};

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
    StepperComponent,
    MessageBoxComponent,
    FormEmpleadoDatosPersonalesComponent,
    FormEmpleadoContactoComponent,
    FormEmpleadoContratoComponent,
    FormEmpleadoPrevisionSaludComponent,
    FormEmpleadoBancarioComponent,
  ],
  templateUrl: './form-empleado.html',
  styleUrl: './form-empleado.css',
})
export class FormEmpleadoComponent implements OnInit {
  private readonly empleadosService = inject(EmpleadosService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly hostElement = inject<ElementRef<HTMLElement>>(ElementRef);
  private tramoCargaTouchedManually = false;

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

  readonly form: EmpleadoFormGroup = new FormGroup({
    datosPersonales: new FormGroup({
      rut: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, rutValidator],
      }),
      nombres: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(60), personNameValidator],
      }),
      apellidoPaterno: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(80), personNameValidator],
      }),
      apellidoMaterno: new FormControl('', {
        nonNullable: true,
        validators: [Validators.maxLength(80), personNameValidator],
      }),
      fechaNacimiento: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      sexo: new FormControl<EmpleadoSexo>('F', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      pasaporte: new FormControl('', {
        nonNullable: true,
        validators: [Validators.maxLength(30)],
      }),
      idPais: new FormControl<number | null>(null, {
        validators: [Validators.required],
      }),
      estadoCivil: new FormControl<TipoEstadoCivil>('SOLTERO', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    }),
    contacto: new FormGroup({
      email: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.email],
      }),
      telefono: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(8), Validators.maxLength(12), digitsOnlyValidator],
      }),
      direccion: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(180)],
      }),
      numeroDireccion: new FormControl('', {
        nonNullable: true,
        validators: [Validators.maxLength(20), digitsOnlyValidator],
      }),
      departamentoDireccion: new FormControl('', {
        nonNullable: true,
        validators: [Validators.maxLength(50)],
      }),
      observacionesDireccion: new FormControl('', {
        nonNullable: true,
        validators: [Validators.maxLength(250)],
      }),
      idComuna: new FormControl<number | null>(null, {
        validators: [Validators.required],
      }),
    }),
    contrato: new FormGroup({
      relacionLaboral: new FormControl<RelacionLaboral>('CONTRATO', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      idSucursal: new FormControl<number | null>(null),
      idDepartamentoEmpresa: new FormControl<number | null>(null),
      idCentroCosto: new FormControl<number | null>(null),
      cargo: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(60)],
      }),
      fechaContrato: new FormControl(this.buildTodayValue(), {
        nonNullable: true,
        validators: [Validators.required],
      }),
      tipoContrato: new FormControl<TipoContrato>('INDEFINIDO', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      idTipoTrabajador: new FormControl<number | null>(null, {
        validators: [Validators.required],
      }),
      idTipoJornada: new FormControl<number | null>(null, {
        validators: [Validators.required],
      }),
      seguroCesantia: new FormControl(true, {
        nonNullable: true,
      }),
      fechaIngreso: new FormControl(this.buildTodayValue(), {
        nonNullable: true,
        validators: [Validators.required],
      }),
      fechaTermino: new FormControl('', {
        nonNullable: true,
      }),
      sueldoBase: new FormControl<number | null>(900000, {
        validators: [Validators.required, Validators.min(1)],
      }),
      idMoneda: new FormControl<number | null>(null),
      sueldoVariable: new FormControl(false, {
        nonNullable: true,
      }),
      cargas: new FormControl<number | null>(0, {
        validators: [Validators.min(0)],
      }),
      horasSemanales: new FormControl<number | null>(45, {
        validators: [Validators.required, Validators.min(1), Validators.max(168)],
      }),
      diasSemanales: new FormControl<number | null>(5, {
        validators: [Validators.required, Validators.min(1), Validators.max(7)],
      }),
      distribucionJornada: new FormControl('', {
        nonNullable: true,
        validators: [Validators.maxLength(250)],
      }),
      tiempoColacionMinutos: new FormControl<number | null>(null, {
        validators: [Validators.min(0), Validators.max(600)],
      }),
      tipoGratificacion: new FormControl<TipoGratificacion>('LEGAL_ART_50', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      gratificacionProporcional: new FormControl(false, {
        nonNullable: true,
      }),
      semanaCorridaActiva: new FormControl(false, {
        nonNullable: true,
      }),
      semanaCorridaDiasLaborables: new FormControl<number[]>([], {
        nonNullable: true,
      }),
      zonaExtremaActiva: new FormControl(false, {
        nonNullable: true,
      }),
      zonaExtremaTerritorio: new FormControl('', {
        nonNullable: true,
        validators: [Validators.maxLength(150)],
      }),
      zonaExtremaPorcentaje: new FormControl<number | null>(null, {
        validators: [Validators.min(0)],
      }),
      estado: new FormControl<EmpleadoEstado>('activo', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      idTramoCarga: new FormControl<number | null>(null),
    }),
    previsionSalud: new FormGroup({
      tipoRegimenPrevisional: new FormControl<TipoRegimenPrevisional | null>(null, {
        validators: [Validators.required],
      }),
      idAfp: new FormControl<number | null>(null),
      idMonedaCuenta2: new FormControl<number | null>(null),
      valorCuenta2: new FormControl<number | null>(null, {
        validators: [Validators.min(0)],
      }),
      nombreExCaja: new FormControl('', {
        nonNullable: true,
        validators: [Validators.maxLength(150)],
      }),
      regimenExCaja: new FormControl('', {
        nonNullable: true,
        validators: [Validators.maxLength(150)],
      }),
      tasaExCaja: new FormControl<number | null>(null, {
        validators: [Validators.min(0)],
      }),
      idSalud: new FormControl<number | null>(null),
      idMonedaPlan: new FormControl<number | null>(null),
      valorPlan: new FormControl<number | null>(0, {
        validators: [Validators.min(0)],
      }),
      adicionalAugeGes: new FormControl<number | null>(0, {
        validators: [Validators.min(0)],
      }),
      tieneApv: new FormControl(false, {
        nonNullable: true,
      }),
      idInstitucionApv: new FormControl<number | null>(null),
      idMonedaApv: new FormControl<number | null>(null),
      montoApv: new FormControl<number | null>(null, {
        validators: [Validators.min(0)],
      }),
      idFormaPagoApv: new FormControl<number | null>(null),
      depositoConvenidoApvi: new FormControl<number | null>(null, {
        validators: [Validators.min(0)],
      }),
    }),
    bancario: new FormGroup({
      idBanco: new FormControl<number | null>(null, {
        validators: [Validators.required],
      }),
      idTipoCuentaBancaria: new FormControl<number | null>(null, {
        validators: [Validators.required],
      }),
      numeroCuenta: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(50), digitsOnlyValidator],
      }),
    }),
  });

  async ngOnInit(): Promise<void> {
    this.configureInputNormalization();
    this.configureContratoBehavior();
    this.configurePrevisionSaludBehavior();
    await this.loadCatalogos();
  }

  selectTab(tabId: TabId | string): void {
    if (!this.isKnownTab(tabId)) {
      return;
    }

    const targetTab = tabId;
    const currentIndex = TAB_ORDER.indexOf(this.activeTab());
    const targetIndex = TAB_ORDER.indexOf(targetTab);

    if (targetIndex > currentIndex) {
      const blockingTab = this.validateTabsUntil(targetIndex);

      if (blockingTab) {
        this.showInvalidTab(blockingTab);
        return;
      }
    }

    this.activeTab.set(targetTab);
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
      const catalogos = await this.empleadosService.obtenerCatalogosFormulario();
      this.catalogos.set(catalogos);
      this.applyCatalogDefaults(catalogos);
    } catch {
      this.catalogosError.set('No fue posible preparar la informacion requerida para el formulario. Intenta nuevamente.');
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
      this.errorMessage.set('La informacion base del formulario aun se esta cargando. Espera unos segundos e intenta nuevamente.');
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
      const created = await this.empleadosService.crear(this.buildPayload());

      this.successMessage.set(`La ficha de ${created.nombre} quedo registrada correctamente.`);
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

  dismissSuccessMessage(): void {
    this.successMessage.set(null);
    this.createdEmployeeId.set(null);
  }

  goToEmployeeList(): void {
    this.dismissSuccessMessage();
    void this.router.navigate(['/empleados']);
  }

  goToPreviousTab(): void {
    const currentIndex = TAB_ORDER.indexOf(this.activeTab());

    if (currentIndex <= 0) {
      return;
    }

    this.activeTab.set(TAB_ORDER[currentIndex - 1]);
  }

  goToNextTab(): void {
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

  tabStatus(tabId: TabId): 'pending' | 'invalid' | 'complete' {
    const section = tabId === 'datosPersonales' ? this.getPersonalSectionState() : this.getSection(tabId);
    const wasAttempted = this.attemptedTabs().has(tabId) || this.attemptedSave();

    if (section.invalid && wasAttempted) {
      return 'invalid';
    }

    if (section.valid && this.completedTabs().has(tabId)) {
      return 'complete';
    }

    return 'pending';
  }

  currentEmployeeName(): string {
    const { nombres, apellidoPaterno, apellidoMaterno } = this.form.controls.datosPersonales.getRawValue();

    return [nombres, apellidoPaterno, apellidoMaterno].filter(Boolean).join(' ').trim();
  }

  currentDepartmentAndRole(): string {
    const cargo = this.form.controls.contrato.controls.cargo.value;
    const centroCosto = this.findCatalogLabel(
      this.catalogos().centrosCosto,
      this.form.controls.contrato.controls.idCentroCosto.value,
    );

    return [cargo, centroCosto].filter(Boolean).join(' - ');
  }

  formattedSalary(): string {
    const salary = this.form.controls.contrato.controls.sueldoBase.value ?? 0;

    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(salary);
  }

  activeStepTitle(): string {
    switch (this.activeTab()) {
      case 'datosPersonales':
        return 'Identificación del colaborador';
      case 'contrato':
        return 'Datos laborales y remuneracion';
      case 'previsionSalud':
        return 'Configuración previsional';
      case 'bancario':
        return 'Cuenta bancaria';
    }
  }

  activeStepDescription(): string {
    switch (this.activeTab()) {
      case 'datosPersonales':
        return 'Completa la información básica del colaborador y sus datos de contacto para iniciar la ficha.';
      case 'contrato':
        return 'Define cargo, jornada, fechas y condiciones laborales con las que comenzará el contrato.';
      case 'previsionSalud':
        return 'Configura régimen previsional, AFP, salud y los parámetros complementarios del colaborador.';
      case 'bancario':
        return 'Registra la información bancaria que se utilizará para el medio de pago.';
    }
  }

  currentComuna(): string {
    return (
      this.findCatalogLabel(this.catalogos().comunas, this.form.controls.contacto.controls.idComuna.value) ??
      'Pendiente'
    );
  }

  currentPrevisionAndHealth(): string {
    const tipo = this.form.controls.previsionSalud.controls.tipoRegimenPrevisional.value;

    if (!tipo) {
      return 'Pendiente';
    }

    if (tipo === 'NINGUNA') {
      return 'Sin prevision';
    }

    const afp = this.findCatalogLabel(
      this.catalogos().afps,
      this.form.controls.previsionSalud.controls.idAfp.value,
    );
    const exCaja = this.form.controls.previsionSalud.controls.nombreExCaja.value.trim();
    const salud = this.findCatalogLabel(
      this.catalogos().entidadesSalud,
      this.form.controls.previsionSalud.controls.idSalud.value,
    );

    return [tipo === 'IPS' ? 'IPS (Ex INP)' : 'AFP', tipo === 'AFP' ? afp : exCaja, salud]
      .filter(Boolean)
      .join(' / ');
  }

  currentBankingSummary(): string {
    const banco = this.findCatalogLabel(this.catalogos().bancos, this.form.controls.bancario.controls.idBanco.value);
    const tipoCuenta = this.findCatalogLabel(
      this.catalogos().tiposCuentaBancaria,
      this.form.controls.bancario.controls.idTipoCuentaBancaria.value,
    );
    const numeroCuenta = this.form.controls.bancario.controls.numeroCuenta.value;

    return [banco, tipoCuenta, numeroCuenta].filter(Boolean).join(' - ') || 'Pendiente';
  }

  private findFirstInvalidTab(): TabId {
    return TAB_ORDER.find((tabId) =>
      tabId === 'datosPersonales' ? this.getPersonalSectionState().invalid : this.getSection(tabId).invalid,
    ) ?? 'datosPersonales';
  }

  private completeCurrentTabIfValid(): boolean {
    const tabId = this.activeTab();
    this.markTabAsAttempted(tabId);
    this.markTabAsTouched(tabId);

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
      this.markTabAsAttempted(tabId);
      this.markTabAsTouched(tabId);

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

  private isTabInvalid(tabId: TabId): boolean {
    return tabId === 'datosPersonales' ? this.getPersonalSectionState().invalid : this.getSection(tabId).invalid;
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
    if (error instanceof EmpleadoRutDuplicadoError || error instanceof EmpleadoReferenciaInvalidaError) {
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

  private buildPayload(): EmpleadoCreacion {
    const rawValue = this.form.getRawValue();
    const tipoPrevision = this.requireTipoRegimenPrevisional(rawValue.previsionSalud.tipoRegimenPrevisional);
    const tieneCuenta2 =
      tipoPrevision === 'AFP' &&
      (rawValue.previsionSalud.idMonedaCuenta2 !== null || rawValue.previsionSalud.valorCuenta2 !== null);
    const requiereSalud = tipoPrevision !== 'NINGUNA';
    const tieneApvi = tipoPrevision === 'AFP' && rawValue.previsionSalud.tieneApv;

    return {
      rut: rawValue.datosPersonales.rut,
      nombres: rawValue.datosPersonales.nombres,
      apellidoPaterno: rawValue.datosPersonales.apellidoPaterno,
      apellidoMaterno: rawValue.datosPersonales.apellidoMaterno,
      fechaNacimiento: rawValue.datosPersonales.fechaNacimiento,
      sexo: rawValue.datosPersonales.sexo,
      estadoCivil: rawValue.datosPersonales.estadoCivil,
      pasaporte: rawValue.datosPersonales.pasaporte.trim() || null,
      idPais: this.requireSelection(rawValue.datosPersonales.idPais, 'el pais'),
      email: rawValue.contacto.email,
      telefono: rawValue.contacto.telefono,
      direccion: rawValue.contacto.direccion,
      numeroDireccion: rawValue.contacto.numeroDireccion.trim() || null,
      departamentoDireccion: rawValue.contacto.departamentoDireccion.trim() || null,
      observacionesDireccion: rawValue.contacto.observacionesDireccion.trim() || null,
      idComuna: this.requireSelection(rawValue.contacto.idComuna, 'la comuna'),
      idSucursal: rawValue.contrato.idSucursal,
      idDepartamentoEmpresa: rawValue.contrato.idDepartamentoEmpresa,
      idCentroCosto: rawValue.contrato.idCentroCosto,
      cargo: rawValue.contrato.cargo,
      fechaContrato: rawValue.contrato.fechaContrato,
      tipoContrato: rawValue.contrato.tipoContrato,
      idTipoTrabajador: this.requireSelection(rawValue.contrato.idTipoTrabajador, 'el tipo de trabajador'),
      idTipoJornada: this.requireSelection(rawValue.contrato.idTipoJornada, 'el tipo de jornada'),
      seguroCesantia: rawValue.contrato.seguroCesantia,
      fechaIngreso: rawValue.contrato.fechaIngreso,
      fechaTermino: rawValue.contrato.fechaTermino || null,
      sueldoBase: rawValue.contrato.sueldoBase ?? 0,
      idMoneda: rawValue.contrato.idMoneda,
      sueldoVariable: rawValue.contrato.sueldoVariable,
      horasSemanales: rawValue.contrato.horasSemanales ?? 0,
      cargas: rawValue.contrato.cargas ?? 0,
      diasSemanales: rawValue.contrato.diasSemanales ?? 0,
      distribucionJornada: rawValue.contrato.distribucionJornada.trim() || null,
      tiempoColacionMinutos: rawValue.contrato.tiempoColacionMinutos,
      tipoGratificacion: rawValue.contrato.tipoGratificacion,
      gratificacionProporcional: rawValue.contrato.gratificacionProporcional,
      semanaCorridaActiva: rawValue.contrato.semanaCorridaActiva,
      semanaCorridaDiasLaborables: rawValue.contrato.semanaCorridaActiva
        ? this.requireNonEmptyArray(rawValue.contrato.semanaCorridaDiasLaborables, 'al menos un dia laborable')
        : [],
      zonaExtremaActiva: rawValue.contrato.zonaExtremaActiva,
      zonaExtremaTerritorio: rawValue.contrato.zonaExtremaActiva
        ? this.requireText(rawValue.contrato.zonaExtremaTerritorio, 'el territorio de zona extrema')
        : null,
      zonaExtremaPorcentaje: rawValue.contrato.zonaExtremaActiva
        ? this.requireNumber(rawValue.contrato.zonaExtremaPorcentaje, 'el porcentaje de zona extrema')
        : null,
      estado: rawValue.contrato.estado,
      idTramoCarga: rawValue.contrato.idTramoCarga,
      tipoPrevision,
      idRegimenPrevisional: this.resolveRegimenPrevisionalId(tipoPrevision),
      idAfp: tipoPrevision === 'AFP' ? this.requireSelection(rawValue.previsionSalud.idAfp, 'la AFP') : null,
      idMonedaCuenta2: tieneCuenta2
        ? this.requireSelection(rawValue.previsionSalud.idMonedaCuenta2, 'la moneda de Cuenta 2')
        : null,
      valorCuenta2: tieneCuenta2
        ? this.requireNumber(rawValue.previsionSalud.valorCuenta2, 'el valor de Cuenta 2')
        : null,
      nombreExCaja:
        tipoPrevision === 'IPS' ? this.requireText(rawValue.previsionSalud.nombreExCaja, 'el nombre Ex-Caja') : null,
      regimenExCaja:
        tipoPrevision === 'IPS'
          ? this.requireText(rawValue.previsionSalud.regimenExCaja, 'el regimen Ex-Caja')
          : null,
      tasaExCaja:
        tipoPrevision === 'IPS' ? this.requireNumber(rawValue.previsionSalud.tasaExCaja, 'la tasa Ex-Caja') : null,
      idSalud: requiereSalud
        ? this.requireSelection(rawValue.previsionSalud.idSalud, 'la institucion de salud')
        : null,
      idMonedaPlan: requiereSalud
        ? this.requireSelection(rawValue.previsionSalud.idMonedaPlan, 'la moneda del plan de salud')
        : null,
      valorPlan: requiereSalud
        ? this.requireNumber(rawValue.previsionSalud.valorPlan, 'el valor del plan de salud')
        : null,
      adicionalAugeGes: requiereSalud
        ? this.requireNumber(rawValue.previsionSalud.adicionalAugeGes, 'el adicional plan Auge')
        : null,
      tieneApv: tieneApvi,
      idInstitucionApv: tieneApvi
        ? this.requireSelection(rawValue.previsionSalud.idInstitucionApv, 'la institucion APVI')
        : null,
      idMonedaApv: tieneApvi
        ? this.requireSelection(rawValue.previsionSalud.idMonedaApv, 'la moneda APVI')
        : null,
      montoApv: tieneApvi
        ? this.requireNumber(rawValue.previsionSalud.montoApv, 'el valor APVI')
        : null,
      idFormaPagoApv: tieneApvi
        ? this.requireSelection(rawValue.previsionSalud.idFormaPagoApv, 'la forma de pago APVI')
        : null,
      depositoConvenidoApvi: tieneApvi
        ? this.requireNumber(rawValue.previsionSalud.depositoConvenidoApvi, 'el deposito convenido APVI')
        : null,
      idBanco: this.requireSelection(rawValue.bancario.idBanco, 'el banco'),
      idTipoCuentaBancaria: this.requireSelection(
        rawValue.bancario.idTipoCuentaBancaria,
        'el tipo de cuenta bancaria',
      ),
      numeroCuenta: rawValue.bancario.numeroCuenta,
    };
  }

  private applyCatalogDefaults(catalogos: EmpleadoFormCatalogos): void {
    this.setPreferredCatalogValue(this.form.controls.contrato.controls.idSucursal, catalogos.sucursales, [
      'casa matriz',
    ]);
    this.setPreferredCatalogValue(this.form.controls.contrato.controls.idTipoTrabajador, catalogos.tiposTrabajador, [
      'dependiente',
    ]);
    this.setPreferredCatalogValue(this.form.controls.contrato.controls.idTipoJornada, catalogos.tiposJornada, [
      'completa',
    ]);
    this.setPreferredCatalogValue(this.form.controls.contrato.controls.idMoneda, catalogos.monedas, [
      'peso chileno',
      'pesos',
      'clp',
    ]);
    this.ensureDepartamentoDefault();
    this.ensureTramoCargaSelection();
    this.ensurePrevisionDefaults();
  }

  private setPreferredCatalogValue(
    control: FormControl<number | null>,
    options: EmpleadoCatalogOption[],
    preferredLabels: string[],
  ): void {
    if (control.value !== null || options.length === 0) {
      return;
    }

    const preferred = options.find((option) =>
      preferredLabels.some((label) => this.normalizeText(option.label) === this.normalizeText(label)),
    );

    control.setValue(preferred?.value ?? options[0].value);
  }

  private findCatalogLabel(options: EmpleadoCatalogOption[], value: number | null): string | null {
    if (value === null) {
      return null;
    }

    return options.find((option) => option.value === value)?.label ?? null;
  }

  private requireSelection(value: number | null, label: string): number {
    if (value === null) {
      throw new Error(`Debes seleccionar ${label}.`);
    }

    return value;
  }

  private requireTipoRegimenPrevisional(value: TipoRegimenPrevisional | null): TipoRegimenPrevisional {
    if (value === null) {
      throw new Error('Debes seleccionar el tipo de regimen previsional.');
    }

    return value;
  }

  private requireText(value: string, label: string): string {
    const normalized = value.trim();

    if (!normalized) {
      throw new Error(`Debes ingresar ${label}.`);
    }

    return normalized;
  }

  private requireNumber(value: number | null, label: string): number {
    if (value === null || Number.isNaN(value)) {
      throw new Error(`Debes ingresar ${label}.`);
    }

    return value;
  }

  private requireNonEmptyArray(value: number[], label: string): number[] {
    if (!Array.isArray(value) || value.length === 0) {
      throw new Error(`Debes seleccionar ${label}.`);
    }

    return value;
  }

  private configureInputNormalization(): void {
    const datosPersonales = this.form.controls.datosPersonales.controls;
    const contacto = this.form.controls.contacto.controls;
    const bancario = this.form.controls.bancario.controls;

    datosPersonales.rut.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      this.setNormalizedTextValue(datosPersonales.rut, this.formatRutInput(value));
    });

    contacto.telefono.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      this.setNormalizedTextValue(contacto.telefono, this.onlyDigits(value, 12));
    });

    contacto.numeroDireccion.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      this.setNormalizedTextValue(contacto.numeroDireccion, this.onlyDigits(value, 20));
    });

    bancario.numeroCuenta.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      this.setNormalizedTextValue(bancario.numeroCuenta, this.onlyDigits(value, 50));
    });
  }

  private setNormalizedTextValue(control: FormControl<string>, normalizedValue: string): void {
    if (control.value === normalizedValue) {
      return;
    }

    control.setValue(normalizedValue, { emitEvent: false });
  }

  private onlyDigits(value: string, maxLength: number): string {
    return value.replace(/\D/g, '').slice(0, maxLength);
  }

  private formatRutInput(value: string): string {
    const cleaned = value.replace(/[^0-9kK]/g, '').toUpperCase().slice(0, 10);

    if (cleaned.length <= 1) {
      return cleaned;
    }

    const body = cleaned.slice(0, -1);
    const verifier = cleaned.slice(-1);
    const reversedDigits = body.split('').reverse();
    const parts: string[] = [];

    for (let index = 0; index < reversedDigits.length; index += 3) {
      parts.push(reversedDigits.slice(index, index + 3).reverse().join(''));
    }

    return `${parts.reverse().join('.')}-${verifier}`;
  }

  private resolveRegimenPrevisionalId(tipo: TipoRegimenPrevisional): number | null {
    if (tipo === 'NINGUNA') {
      return null;
    }

    const regimen = this.catalogos().regimenesPrevisionales.find(
      (option) => this.normalizeText(option.label) === this.normalizeText(tipo),
    );

    if (!regimen) {
      throw new Error(`No se encontro el catalogo para el regimen ${tipo}.`);
    }

    return regimen.value;
  }

  private configureContratoBehavior(): void {
    const controls = this.form.controls.contrato.controls;

    controls.tipoContrato.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((tipo) => {
      if (tipo === 'INDEFINIDO') {
        controls.fechaTermino.setValue('', { emitEvent: false });
      }

      this.updateContratoValidators();
    });

    controls.relacionLaboral.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((relacion) => {
      const suggested = this.catalogos().tiposTrabajador.find((option) =>
        this.normalizeText(option.label).includes(relacion === 'HONORARIOS' ? 'independiente' : 'dependiente'),
      );

      if (suggested) {
        controls.idTipoTrabajador.setValue(suggested.value, { emitEvent: false });
      }
    });

    controls.idSucursal.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.ensureDepartamentoDefault();
    });

    controls.sueldoBase.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.ensureTramoCargaSelection();
    });

    controls.idTramoCarga.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (controls.idTramoCarga.dirty) {
        this.tramoCargaTouchedManually = true;
      }
    });

    controls.semanaCorridaActiva.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((enabled) => {
      if (!enabled) {
        controls.semanaCorridaDiasLaborables.setValue([], { emitEvent: false });
      }

      this.updateContratoValidators();
    });

    controls.zonaExtremaActiva.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((enabled) => {
      if (!enabled) {
        controls.zonaExtremaTerritorio.setValue('', { emitEvent: false });
        controls.zonaExtremaPorcentaje.setValue(null, { emitEvent: false });
      }

      this.updateContratoValidators();
    });

    this.updateContratoValidators();
  }

  private updateContratoValidators(): void {
    const controls = this.form.controls.contrato.controls;
    const requiereTermino = controls.tipoContrato.value !== 'INDEFINIDO';
    const semanaCorridaActiva = controls.semanaCorridaActiva.value;
    const zonaExtremaActiva = controls.zonaExtremaActiva.value;

    this.setControlValidators(controls.fechaTermino, requiereTermino ? [Validators.required] : []);
    this.setControlValidators(
      controls.semanaCorridaDiasLaborables,
      semanaCorridaActiva ? [atLeastOneArrayValueValidator] : [],
    );
    this.setControlValidators(
      controls.zonaExtremaTerritorio,
      zonaExtremaActiva ? [Validators.required, Validators.maxLength(150)] : [Validators.maxLength(150)],
    );
    this.setControlValidators(
      controls.zonaExtremaPorcentaje,
      zonaExtremaActiva ? [Validators.required, Validators.min(0)] : [Validators.min(0)],
    );
  }

  private configurePrevisionSaludBehavior(): void {
    const controls = this.form.controls.previsionSalud.controls;
    let previousTipo = controls.tipoRegimenPrevisional.value;

    controls.tipoRegimenPrevisional.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((tipo) => {
        this.handleTipoRegimenChange(previousTipo, tipo);
        previousTipo = tipo;
        this.ensurePrevisionDefaults();
        this.updatePrevisionSaludValidators();
      });

    controls.tieneApv.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((enabled) => {
      if (!enabled) {
        this.resetApviFields();
      }

      this.ensurePrevisionDefaults();
      this.updatePrevisionSaludValidators();
    });

    controls.idMonedaCuenta2.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.updatePrevisionSaludValidators());

    controls.valorCuenta2.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.updatePrevisionSaludValidators());

    this.updatePrevisionSaludValidators();
  }

  private handleTipoRegimenChange(
    previousTipo: TipoRegimenPrevisional | null,
    currentTipo: TipoRegimenPrevisional | null,
  ): void {
    if (previousTipo === currentTipo) {
      return;
    }

    if (currentTipo !== 'AFP') {
      this.resetAfpFields();
    }

    if (currentTipo !== 'IPS') {
      this.resetIpsFields();
    }

    if (currentTipo === 'NINGUNA' || currentTipo === null) {
      this.resetSaludFields();
    }
  }

  private updatePrevisionSaludValidators(): void {
    const controls = this.form.controls.previsionSalud.controls;
    const tipo = controls.tipoRegimenPrevisional.value;
    const requiereSalud = tipo !== null && tipo !== 'NINGUNA';
    const tieneCuenta2 = tipo === 'AFP' && (controls.idMonedaCuenta2.value !== null || controls.valorCuenta2.value !== null);
    const requiereApvi = tipo === 'AFP' && controls.tieneApv.value;

    this.setControlValidators(controls.tipoRegimenPrevisional, [Validators.required]);
    this.setControlValidators(controls.idAfp, tipo === 'AFP' ? [Validators.required] : []);
    this.setControlValidators(controls.idMonedaCuenta2, tieneCuenta2 ? [Validators.required] : []);
    this.setControlValidators(
      controls.valorCuenta2,
      tieneCuenta2 ? [Validators.required, Validators.min(0)] : [Validators.min(0)],
    );
    this.setControlValidators(
      controls.nombreExCaja,
      tipo === 'IPS' ? [Validators.required, Validators.maxLength(150)] : [Validators.maxLength(150)],
    );
    this.setControlValidators(
      controls.regimenExCaja,
      tipo === 'IPS' ? [Validators.required, Validators.maxLength(150)] : [Validators.maxLength(150)],
    );
    this.setControlValidators(
      controls.tasaExCaja,
      tipo === 'IPS' ? [Validators.required, Validators.min(0)] : [Validators.min(0)],
    );
    this.setControlValidators(controls.idSalud, requiereSalud ? [Validators.required] : []);
    this.setControlValidators(controls.idMonedaPlan, requiereSalud ? [Validators.required] : []);
    this.setControlValidators(
      controls.valorPlan,
      requiereSalud ? [Validators.required, Validators.min(0)] : [Validators.min(0)],
    );
    this.setControlValidators(
      controls.adicionalAugeGes,
      requiereSalud ? [Validators.required, Validators.min(0)] : [Validators.min(0)],
    );
    this.setControlValidators(controls.idInstitucionApv, requiereApvi ? [Validators.required] : []);
    this.setControlValidators(controls.idMonedaApv, requiereApvi ? [Validators.required] : []);
    this.setControlValidators(
      controls.montoApv,
      requiereApvi ? [Validators.required, Validators.min(0)] : [Validators.min(0)],
    );
    this.setControlValidators(controls.idFormaPagoApv, requiereApvi ? [Validators.required] : []);
    this.setControlValidators(
      controls.depositoConvenidoApvi,
      requiereApvi ? [Validators.required, Validators.min(0)] : [Validators.min(0)],
    );
  }

  private setControlValidators(
    control: FormControl<unknown>,
    validators: Parameters<FormControl<unknown>['setValidators']>[0],
  ): void {
    control.setValidators(validators);
    control.updateValueAndValidity({ emitEvent: false });
  }

  private ensurePrevisionDefaults(): void {
    const monedas = this.catalogos().monedas;
    const controls = this.form.controls.previsionSalud.controls;

    if (monedas.length === 0) {
      return;
    }

    if (controls.tipoRegimenPrevisional.value !== null && controls.tipoRegimenPrevisional.value !== 'NINGUNA') {
      this.setPreferredCatalogValue(controls.idMonedaPlan, monedas, ['peso chileno', 'pesos', 'clp']);
    }

    if (controls.tipoRegimenPrevisional.value === 'AFP' && controls.tieneApv.value) {
      this.setPreferredCatalogValue(controls.idMonedaApv, monedas, ['peso chileno', 'pesos', 'clp']);
    }
  }

  private ensureDepartamentoDefault(): void {
    const controls = this.form.controls.contrato.controls;
    const departamentos = this.catalogos().departamentos;
    const sucursalId = controls.idSucursal.value;
    const departamentosSucursal = departamentos.filter((option) => option.idSucursal === sucursalId);

    if (departamentosSucursal.length === 0) {
      controls.idDepartamentoEmpresa.setValue(null, { emitEvent: false });
      return;
    }

    const currentValue = controls.idDepartamentoEmpresa.value;
    const currentStillValid = departamentosSucursal.some((option) => option.value === currentValue);

    if (!currentStillValid) {
      controls.idDepartamentoEmpresa.setValue(departamentosSucursal[0].value, { emitEvent: false });
    }
  }

  private ensureTramoCargaSelection(): void {
    const controls = this.form.controls.contrato.controls;
    const tramos = this.catalogos().tramosCarga;

    if (tramos.length === 0) {
      controls.idTramoCarga.setValue(null, { emitEvent: false });
      return;
    }

    if (this.tramoCargaTouchedManually && controls.idTramoCarga.value !== null) {
      return;
    }

    const tramoSugerido = this.resolveTramoCargaBySueldo(controls.sueldoBase.value);
    const fallback = tramos[0]?.value ?? null;
    controls.idTramoCarga.setValue(tramoSugerido?.value ?? fallback, { emitEvent: false });
  }

  private resolveTramoCargaBySueldo(sueldoBase: number | null): TramoCargaCatalogOption | null {
    const tramos = this.catalogos().tramosCarga;

    if (sueldoBase === null || tramos.length === 0) {
      return null;
    }

    return (
      tramos.find((option) => {
        const matchesDesde = option.desde === null || sueldoBase >= option.desde;
        const matchesHasta = option.hasta === null || sueldoBase <= option.hasta;
        return matchesDesde && matchesHasta;
      }) ?? null
    );
  }

  private resetAfpFields(): void {
    const controls = this.form.controls.previsionSalud.controls;
    controls.idAfp.setValue(null, { emitEvent: false });
    controls.idMonedaCuenta2.setValue(null, { emitEvent: false });
    controls.valorCuenta2.setValue(null, { emitEvent: false });
    controls.tieneApv.setValue(false, { emitEvent: false });
    this.resetApviFields();
  }

  private resetIpsFields(): void {
    const controls = this.form.controls.previsionSalud.controls;
    controls.nombreExCaja.setValue('', { emitEvent: false });
    controls.regimenExCaja.setValue('', { emitEvent: false });
    controls.tasaExCaja.setValue(null, { emitEvent: false });
  }

  private resetSaludFields(): void {
    const controls = this.form.controls.previsionSalud.controls;
    controls.idSalud.setValue(null, { emitEvent: false });
    controls.idMonedaPlan.setValue(null, { emitEvent: false });
    controls.valorPlan.setValue(null, { emitEvent: false });
    controls.adicionalAugeGes.setValue(null, { emitEvent: false });
  }

  private resetApviFields(): void {
    const controls = this.form.controls.previsionSalud.controls;
    controls.idInstitucionApv.setValue(null, { emitEvent: false });
    controls.idMonedaApv.setValue(null, { emitEvent: false });
    controls.montoApv.setValue(null, { emitEvent: false });
    controls.idFormaPagoApv.setValue(null, { emitEvent: false });
    controls.depositoConvenidoApvi.setValue(null, { emitEvent: false });
  }

  private normalizeText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  }

  private buildTodayValue(): string {
    const today = new Date();
    const timezoneOffset = today.getTimezoneOffset() * 60_000;

    return new Date(today.getTime() - timezoneOffset).toISOString().slice(0, 10);
  }
}
