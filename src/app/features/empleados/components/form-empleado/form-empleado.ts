import { CommonModule } from '@angular/common';
import { Component, DestroyRef, ElementRef, OnInit, inject, signal } from '@angular/core';
import { AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import { ComplementariosComponent } from '../secciones/complementarios/complementarios';
import { DatosLaboralesComponent } from '../secciones/datos-laborales/datos-laborales';
import { DatosPersonalesComponent } from '../secciones/datos-personales/datos-personales';
import { DireccionComponent } from '../secciones/direccion/direccion';
import { PrevisionSaludComponent } from '../secciones/prevision-salud/prevision-salud';
import { TabsEmpleadoComponent } from '../tabs-empleado/tabs-empleado';
import { mapEmpleadoFormToPayload } from '../../mappers/empleado-form.mapper';
import {
  EMPTY_EMPLEADO_FORM_CATALOGOS,
  EmpleadoFormCatalogos,
  EmpleadoFormGroup,
} from '../../models/empleado-form.model';
import { EmpleadosFormService } from '../../services/empleados-form.service';
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
    TabsEmpleadoComponent,
    DatosPersonalesComponent,
    DireccionComponent,
    DatosLaboralesComponent,
    PrevisionSaludComponent,
    ComplementariosComponent,
  ],
  templateUrl: './form-empleado.html',
  styleUrl: './form-empleado.css',
})
export class FormEmpleadoComponent implements OnInit {
  private readonly empleadosService = inject(EmpleadosService);
  private readonly empleadosCatalogosService = inject(EmpleadosCatalogosService);
  private readonly empleadosFormService = inject(EmpleadosFormService);
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

  async ngOnInit(): Promise<void> {
    this.empleadosFormService.configureFormBehavior(this.form, this.destroyRef, () => this.catalogos());
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
      const created = await this.empleadosService.crear(mapEmpleadoFormToPayload(this.form, this.catalogos()));

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

  activeStepTitle(): string {
    switch (this.activeTab()) {
      case 'datosPersonales':
        return 'Identificacion del colaborador';
      case 'contrato':
        return 'Datos laborales y remuneracion';
      case 'previsionSalud':
        return 'Configuracion previsional';
      case 'bancario':
        return 'Datos complementarios';
    }
  }

  activeStepDescription(): string {
    switch (this.activeTab()) {
      case 'datosPersonales':
        return 'Completa la informacion basica del colaborador y sus datos de contacto para iniciar la ficha.';
      case 'contrato':
        return 'Define cargo, jornada, fechas y condiciones laborales con las que comenzara el contrato.';
      case 'previsionSalud':
        return 'Configura regimen previsional, AFP, salud y parametros complementarios del colaborador.';
      case 'bancario':
        return 'Registra informacion bancaria y datos administrativos complementarios.';
    }
  }

  private tabStatus(tabId: TabId): 'pending' | 'invalid' | 'complete' {
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

  private findFirstInvalidTab(): TabId {
    return (
      TAB_ORDER.find((tabId) =>
        tabId === 'datosPersonales' ? this.getPersonalSectionState().invalid : this.getSection(tabId).invalid,
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
    if (error instanceof EmpleadoRutDuplicadoError || error instanceof EmpleadoReferenciaInvalidaError) {
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
