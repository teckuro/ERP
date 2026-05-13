import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import {
  AlertCircle,
  ArrowLeft,
  Edit3,
  Info,
  LoaderCircle,
  Save,
  X,
} from 'lucide-angular/src/icons';

import { BancarioComponent } from '../../components/secciones/bancario/bancario';
import { ContratoComponent } from '../../components/secciones/contrato/contrato';
import { ContactoComponent } from '../../components/secciones/contacto/contacto';
import { DatosPersonalesComponent } from '../../components/secciones/datos-personales/datos-personales';
import { PrevisionSaludComponent } from '../../components/secciones/prevision-salud/prevision-salud';
import {
  EMPTY_EMPLEADO_FORM_CATALOGOS,
  EmpleadoFormCatalogos,
} from '../../models/empleado-catalogos.model';
import { EmpleadoFormGroup } from '../../models/empleado-form.model';
import {
  EmpleadoEstado,
  EmpleadoEstadoFicha,
  EmpleadoFichaDetalle,
  EmpleadoHistorialCambio,
  EmpleadoListado,
} from '../../models/empleado-listado.model';
import { CrearEmpleadoPayload } from '../../models/empleado-payload.model';
import { TipoRegimenPrevisional } from '../../models/empleado.model';
import { EmpleadosCatalogosService } from '../../services/empleados-catalogos.service';
import { EmpleadosFormOrchestratorService } from '../../services/empleados-form-orchestrator.service';
import { EmpleadosService } from '../../services/empleados.service';
import {
  EvaluacionCompletitudEmpleado,
  evaluarCompletitudYAptitudEmpleado,
} from '../../utils/empleado-completitud.rules';
import {
  DataGridColumn,
  DataGridComponent,
} from '../../../../shared/components/ui/data-grid.component';
import {
  RecordBreadcrumbComponent,
  RecordBreadcrumbItem,
} from '../../../../shared/components/ui/record-breadcrumb.component';

type EmployeeFileTab =
  | 'general'
  | 'laboral'
  | 'remuneracion'
  | 'prevision'
  | 'pago'
  | 'documentos'
  | 'historial';

type EmployeeFileTabStatus = 'complete' | 'pending' | 'warning' | 'blocking';

interface EmployeeFileTabItem {
  id: EmployeeFileTab;
  label: string;
}

interface EmployeeDetailItem {
  label: string;
  value: string;
  kind?: 'section';
}

interface EmployeeDetailBlock {
  id: string;
  title: string;
  items: EmployeeDetailItem[];
}

interface EmployeeHistoryRow {
  id: string;
  fecha: string;
  evento: string;
  modulo: string;
  detalle: string;
  usuario: string;
  estado: string;
}

@Component({
  selector: 'app-ficha-empleado-container',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    LucideAngularModule,
    RecordBreadcrumbComponent,
    DatosPersonalesComponent,
    ContactoComponent,
    ContratoComponent,
    PrevisionSaludComponent,
    BancarioComponent,
    DataGridComponent,
  ],
  templateUrl: './ficha-empleado-container.html',
  styleUrl: './ficha-empleado-container.css',
})
export class FichaEmpleadoContainer implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly empleadosService = inject(EmpleadosService);
  private readonly empleadosCatalogosService = inject(EmpleadosCatalogosService);
  private readonly empleadosFormService = inject(EmpleadosFormOrchestratorService);
  private readonly destroyRef = inject(DestroyRef);

  readonly empleadoId = Number(this.route.snapshot.paramMap.get('id'));
  readonly empleado = signal<EmpleadoFichaDetalle | null>(null);
  readonly isLoading = signal(true);
  readonly isLoadingCatalogs = signal(true);
  readonly isSavingSection = signal(false);
  readonly isValidatingPayroll = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly sectionErrorMessage = signal<string | null>(null);
  readonly validationSuccessMessage = signal<string | null>(null);
  readonly validationErrorMessage = signal<string | null>(null);
  readonly validationBlockingItems = signal<string[]>([]);
  readonly validationPendingCount = signal(0);
  readonly confirmPayrollValidation = signal(false);
  readonly activeTab = signal<EmployeeFileTab>('general');
  readonly editingTab = signal<EmployeeFileTab | null>(null);
  readonly editingBlock = signal<string | null>(null);
  readonly catalogos = signal<EmpleadoFormCatalogos>(EMPTY_EMPLEADO_FORM_CATALOGOS);
  readonly form: EmpleadoFormGroup = this.empleadosFormService.createForm();
  readonly breadcrumbItems: readonly RecordBreadcrumbItem[] = [
    { label: 'Empleados', link: '/empleados' },
    { label: 'Ficha' },
  ];

  readonly arrowLeftIcon = ArrowLeft;
  readonly alertIcon = AlertCircle;
  /** Vacío esperado — ícono informativo pequeño, no error. */
  readonly emptyFieldIcon = Info;
  readonly editIcon = Edit3;
  readonly loaderIcon = LoaderCircle;
  readonly saveIcon = Save;
  readonly cancelIcon = X;

  readonly tabs: EmployeeFileTabItem[] = [
    { id: 'general', label: 'General' },
    { id: 'laboral', label: 'Laboral' },
    { id: 'remuneracion', label: 'Remuneración' },
    { id: 'prevision', label: 'Previsión y salud' },
    { id: 'pago', label: 'Pago' },
    { id: 'documentos', label: 'Documentos' },
    { id: 'historial', label: 'Historial' },
  ];

  readonly historyColumns: DataGridColumn<EmployeeHistoryRow>[] = [
    {
      id: 'fecha',
      header: 'Fecha',
      field: 'fecha',
      sortable: true,
      widthClass: 'min-w-[7.5rem]',
    },
    {
      id: 'evento',
      header: 'Evento',
      field: 'evento',
      sortable: true,
      widthClass: 'min-w-[11rem]',
    },
    {
      id: 'modulo',
      header: 'Módulo',
      field: 'modulo',
      sortable: true,
      widthClass: 'min-w-[8rem]',
    },
    {
      id: 'detalle',
      header: 'Detalle',
      field: 'detalle',
      widthClass: 'min-w-[18rem]',
    },
    {
      id: 'usuario',
      header: 'Usuario',
      field: 'usuario',
      sortable: true,
      widthClass: 'min-w-[8rem]',
    },
    {
      id: 'estado',
      header: 'Estado',
      field: 'estado',
      sortable: true,
      widthClass: 'min-w-[8rem]',
    },
  ];

  readonly trackHistoryRow = (_index: number, row: EmployeeHistoryRow): string => row.id;

  async ngOnInit(): Promise<void> {
    if (!Number.isInteger(this.empleadoId) || this.empleadoId <= 0) {
      this.errorMessage.set('Identificador de empleado invalido.');
      this.isLoading.set(false);
      return;
    }

    try {
      this.empleadosFormService.configureFormBehavior(this.form, this.destroyRef, () =>
        this.catalogos(),
      );

      const [catalogos, employee] = await Promise.all([
        this.empleadosCatalogosService.obtenerFormulario(),
        this.empleadosService.obtenerPorId(this.empleadoId),
      ]);

      this.catalogos.set(catalogos);
      this.empleadosFormService.applyCatalogDefaults(this.form, catalogos);
      this.empleado.set(employee);

      if (!this.empleado()) {
        this.errorMessage.set('No se encontro la ficha solicitada.');
      } else {
        this.patchFormFromEmployee(this.empleado()!);
      }
    } catch {
      this.errorMessage.set('No fue posible cargar la ficha del empleado.');
    } finally {
      this.isLoadingCatalogs.set(false);
      this.isLoading.set(false);
    }
  }

  selectTab(tabId: EmployeeFileTab): void {
    if (this.hasCurrentSectionChanges()) {
      const shouldDiscard = window.confirm(
        'Hay cambios sin guardar en la seccion actual. Deseas descartarlos?',
      );

      if (!shouldDiscard) {
        return;
      }

      this.restoreForm();
    }

    this.activeTab.set(tabId);
    this.editingTab.set(null);
    this.editingBlock.set(null);
    this.sectionErrorMessage.set(null);
  }

  startEditing(blockId: string | null = null): void {
    if (!this.canEditCurrentTab()) {
      return;
    }

    this.sectionErrorMessage.set(null);
    this.editingTab.set(this.activeTab());
    this.editingBlock.set(blockId ?? this.detailBlocks(this.empleado()!).at(0)?.id ?? null);
  }

  cancelEditing(): void {
    this.restoreForm();
    this.editingTab.set(null);
    this.editingBlock.set(null);
    this.sectionErrorMessage.set(null);
  }

  async handlePrimaryFichaAction(empleado: EmpleadoFichaDetalle): Promise<void> {
    if (this.canValidateForPayroll(empleado)) {
      this.openPayrollValidationConfirm();
      return;
    }

    if (empleado.pasoAltaAvanzada !== null) {
      await this.router.navigate(['/empleados', 'nuevo'], {
        queryParams: { idPersona: empleado.id },
      });
      return;
    }

    if (this.evaluacionEmpleado(empleado).bloqueos.length > 0) {
      this.selectRecommendedTab(empleado);
      return;
    }

    this.startEditing();
  }

  openPayrollValidationConfirm(): void {
    this.validationErrorMessage.set(null);
    this.validationBlockingItems.set([]);
    this.validationPendingCount.set(0);
    this.confirmPayrollValidation.set(true);
  }

  cancelPayrollValidation(): void {
    if (this.isValidatingPayroll()) {
      return;
    }

    this.confirmPayrollValidation.set(false);
  }

  async validarFichaParaRemuneraciones(): Promise<void> {
    const employee = this.empleado();

    if (!employee || this.isValidatingPayroll()) {
      return;
    }

    const evaluacion = this.evaluacionEmpleado(employee);

    if (!this.canValidateForPayroll(employee)) {
      this.setPayrollValidationError(evaluacion);
      this.confirmPayrollValidation.set(false);
      return;
    }

    this.isValidatingPayroll.set(true);
    this.validationErrorMessage.set(null);
    this.validationSuccessMessage.set(null);
    this.validationBlockingItems.set([]);
    this.validationPendingCount.set(0);

    try {
      const updated = await this.empleadosService.validarFichaParaRemuneraciones(
        employee.id,
        this.mapFichaEmpleadoToEvaluacionInput(employee),
      );

      if (updated) {
        this.empleado.set(updated);
        this.patchFormFromEmployee(updated);
      }

      this.validationSuccessMessage.set('Ficha validada para remuneraciones.');
      this.confirmPayrollValidation.set(false);
    } catch (error) {
      const evaluacionError =
        error instanceof Error && 'evaluacion' in error
          ? (error as { evaluacion: EvaluacionCompletitudEmpleado }).evaluacion
          : null;

      if (evaluacionError) {
        this.setPayrollValidationError(evaluacionError);
      } else {
        this.validationErrorMessage.set(
          error instanceof Error
            ? error.message
            : 'No se pudo validar la ficha para remuneraciones.',
        );
      }

      this.confirmPayrollValidation.set(false);
    } finally {
      this.isValidatingPayroll.set(false);
    }
  }

  async saveSection(): Promise<void> {
    if (this.isSavingSection()) {
      return;
    }

    const saveTarget = this.saveTargetForTab(this.activeTab());

    if (!saveTarget) {
      this.editingTab.set(null);
      return;
    }

    const controls = this.controlsForActiveBlock();
    controls.forEach((control) => control.markAllAsTouched());
    controls.forEach((control) => control.updateValueAndValidity({ emitEvent: false }));

    if (controls.some((control) => control.invalid)) {
      this.sectionErrorMessage.set('Revisa los campos marcados antes de guardar esta sección.');
      return;
    }

    this.isSavingSection.set(true);
    this.sectionErrorMessage.set(null);

    try {
      const updated = await this.empleadosService.guardarSeccionFicha(
        this.empleadoId,
        saveTarget,
        this.buildPayloadForSave(),
      );

      if (updated) {
        this.empleado.set(updated);
        this.patchFormFromEmployee(updated);
      }

      this.editingTab.set(null);
      this.editingBlock.set(null);
    } catch (error) {
      this.sectionErrorMessage.set(
        error instanceof Error
          ? error.message
          : 'No fue posible guardar la sección. Intenta nuevamente.',
      );
    } finally {
      this.isSavingSection.set(false);
    }
  }

  isEditingCurrentTab(): boolean {
    return this.editingTab() === this.activeTab();
  }

  isEditingBlock(blockId: string): boolean {
    return this.isEditingCurrentTab() && this.editingBlock() === blockId;
  }

  statusLabel(estado: EmpleadoEstado): string {
    switch (estado) {
      case 'borrador':
      case 'en_proceso':
        return 'En proceso';
      case 'activo':
        return 'Activo';
      case 'suspendido':
        return 'Suspendido';
      case 'inactivo':
        return 'Inactivo';
      case 'desvinculado':
        return 'Desvinculado';
      case 'bloqueado':
        return 'Bloqueado';
    }
  }

  statusClass(estado: EmpleadoEstado): string {
    switch (estado) {
      case 'activo':
        return 'is-active';
      case 'borrador':
      case 'en_proceso':
        return 'is-progress';
      case 'suspendido':
        return 'is-warning';
      case 'desvinculado':
      case 'bloqueado':
        return 'is-danger';
      default:
        return 'is-neutral';
    }
  }

  completionValue(empleado: EmpleadoListado): number {
    const evaluacion = this.evaluacionEmpleado(empleado);

    if (empleado.pasoAltaAvanzada !== null || empleado.estadoFicha === 'BORRADOR') {
      return 24;
    }

    if (evaluacion.aptoParaRemuneraciones) {
      return 100;
    }

    const bloquesBase = 5;
    const pendientes = new Set(evaluacion.seccionesPendientes.map((item) => this.tabFromSection(item)));
    return Math.max(20, Math.round(((bloquesBase - pendientes.size) / bloquesBase) * 100));
  }

  pendingItems(empleado: EmpleadoListado): string[] {
    if (empleado.estadoFicha === 'VALIDO') {
      return ['Ficha válida', 'Remuneraciones habilitadas'];
    }

    return ['Completar contrato', 'Validar remuneración', 'Registrar datos de pago'];
  }

  primaryActionLabel(empleado: EmpleadoListado): string {
    if (!empleado.aptoParaRemuneraciones) {
      return 'Registrar datos de pago';
    }

    return 'Editar sección';
  }

  payrollReadinessLabel(empleado: EmpleadoListado): string {
    return empleado.aptoParaRemuneraciones ? 'Habilitado' : 'Pendiente';
  }

  operationalStatusLabel(empleado: EmpleadoListado): string {
    return empleado.estado === 'activo' ? 'Listo para operar' : 'Pendiente de completar';
  }

  /** Paso sugerido en el panel lateral (acciones rápidas). */
  nextStepLabel(empleado: EmpleadoListado): string {
    if (!empleado.aptoParaRemuneraciones) {
      return 'Registrar datos de pago';
    }
    return empleado.estado === 'activo' ? 'Revisar secciones' : 'Registrar datos de pago';
  }

  completedBlocks(empleado: EmpleadoListado): number {
    return this.tabs.filter((tab) => this.tabStatus(tab.id, empleado) === 'complete').length;
  }

  pendingBlocks(empleado: EmpleadoListado): number {
    return this.tabs.filter((tab) => this.tabStatus(tab.id, empleado) !== 'complete').length;
  }

  progressStyle(empleado: EmpleadoListado): Record<string, string> {
    return { width: `${this.completionValue(empleado)}%` };
  }

  tabStatus(tabId: EmployeeFileTab, empleado: EmpleadoListado): EmployeeFileTabStatus {
    const evaluacion = this.evaluacionEmpleado(empleado);

    if (evaluacion.aptoParaRemuneraciones) {
      return 'complete';
    }

    if (evaluacion.seccionesPendientes.some((section) => this.tabFromSection(section) === tabId)) {
      return tabId === 'pago' || tabId === 'remuneracion' || tabId === 'prevision'
        ? 'blocking'
        : 'warning';
    }

    return tabId === 'documentos' || tabId === 'historial' ? 'pending' : 'complete';
  }

  tabStatusLabel(tabId: EmployeeFileTab, empleado: EmpleadoListado): string {
    switch (this.tabStatus(tabId, empleado)) {
      case 'complete':
        return 'Completo';
      case 'warning':
        return 'Revisar';
      case 'blocking':
        return 'Bloqueante';
      case 'pending':
        return 'Pendiente';
    }
  }

  tabStatusClass(tabId: EmployeeFileTab, empleado: EmpleadoListado): string {
    return `is-${this.tabStatus(tabId, empleado)}`;
  }

  selectRecommendedTab(empleado: EmpleadoListado): void {
    const firstPending = this.evaluacionEmpleado(empleado).seccionesPendientes[0];
    this.selectTab(firstPending ? this.tabFromSection(firstPending) : 'general');
  }

  impactMessage(empleado: EmpleadoListado): string {
    const evaluacion = this.evaluacionEmpleado(empleado);

    if (evaluacion.aptoParaRemuneraciones) {
      return empleado.estadoFicha === 'VALIDO' && empleado.aptoParaRemuneraciones
        ? 'Ficha apta para procesos de remuneraciones.'
        : 'La ficha no tiene pendientes bloqueantes. Valídala para incluirla en procesos de remuneración.';
    }

    return `No apta para remuneraciones: ${evaluacion.bloqueos.length} pendiente(s) por completar.`;
  }

  evaluacionEmpleado(empleado: EmpleadoListado): EvaluacionCompletitudEmpleado {
    return evaluarCompletitudYAptitudEmpleado({
      payload: this.mapFichaEmpleadoToEvaluacionInput(empleado),
      pasoAltaAvanzada: empleado.pasoAltaAvanzada,
    });
  }

  estadoFichaVisualLabel(empleado: EmpleadoListado): string {
    const evaluacion = this.evaluacionEmpleado(empleado);

    if (empleado.pasoAltaAvanzada !== null || empleado.estadoFicha === 'BORRADOR') {
      return 'Borrador';
    }

    if (empleado.estadoFicha === 'VALIDO' && empleado.aptoParaRemuneraciones) {
      return 'Ficha válida';
    }

    if (evaluacion.aptoParaRemuneraciones) {
      return 'Ficha completa';
    }

    if (empleado.estado === 'activo') {
      return 'Con pendientes';
    }

    return 'En proceso';
  }

  payrollReadinessEvaluadoLabel(empleado: EmpleadoListado): string {
    if (empleado.estadoFicha === 'VALIDO' && empleado.aptoParaRemuneraciones) {
      return 'Apta para remuneraciones';
    }

    if (this.canValidateForPayroll(empleado)) {
      return 'Pendiente de validación';
    }

    return 'No apta para remuneraciones';
  }

  pendingItemsEvaluados(empleado: EmpleadoListado): string[] {
    const evaluacion = this.evaluacionEmpleado(empleado);

    if (evaluacion.bloqueos.length === 0) {
      return ['Sin pendientes bloqueantes.'];
    }

    return evaluacion.bloqueos.slice(0, 5).map((bloqueo) => this.humanPendingText(bloqueo));
  }

  pendingSummary(empleado: EmpleadoListado): string {
    const total = this.evaluacionEmpleado(empleado).bloqueos.length;

    if (total === 0) {
      return 'Sin pendientes bloqueantes.';
    }

    return total > 5 ? `${total} pendientes por completar.` : 'Pendiente:';
  }

  primaryActionEvaluadaLabel(empleado: EmpleadoListado): string {
    if (empleado.pasoAltaAvanzada !== null) {
      return 'Continuar alta';
    }

    if (this.canValidateForPayroll(empleado)) {
      return 'Validar para remuneraciones';
    }

    if (empleado.estadoFicha === 'VALIDO' && empleado.aptoParaRemuneraciones) {
      return 'Ver datos / Editar ficha';
    }

    return empleado.estado === 'activo' ? 'Revisar pendientes' : 'Completar ficha';
  }

  canValidateForPayroll(empleado: EmpleadoListado): boolean {
    const evaluacion = this.evaluacionEmpleado(empleado);

    return (
      empleado.pasoAltaAvanzada === null &&
      empleado.estado !== 'borrador' &&
      empleado.estadoFicha !== 'BORRADOR' &&
      (empleado.estadoFicha !== 'VALIDO' || !empleado.aptoParaRemuneraciones) &&
      (empleado.estado === 'en_proceso' || empleado.estado === 'activo') &&
      evaluacion.bloqueos.length === 0 &&
      evaluacion.defaultsTecnicosDetectados.length === 0 &&
      evaluacion.seccionesPendientes.length === 0
    );
  }

  activeTabLabel(): string {
    return this.tabs.find((tab) => tab.id === this.activeTab())?.label ?? 'General';
  }

  detailItems(empleado: EmpleadoListado): EmployeeDetailItem[] {
    const raw = this.form.getRawValue();
    const personal = raw.datosPersonales;
    const contacto = raw.contacto;
    const contrato = raw.contrato;
    const prevision = raw.previsionSalud;
    const bancario = raw.bancario;

    switch (this.activeTab()) {
      case 'general':
        return [
          this.detailSection('Identificación legal'),
          { label: 'RUT', value: this.emptyText(personal.rut) },
          { label: 'Pasaporte', value: this.emptyText(personal.pasaporte) },
          { label: 'Fecha nacimiento', value: this.dateText(personal.fechaNacimiento) },
          { label: 'Sexo', value: this.optionText(personal.sexo, this.catalogos().sexos) },
          this.detailSection('Nombre del colaborador'),
          { label: 'Nombres', value: this.emptyText(personal.nombres) },
          { label: 'Apellido paterno', value: this.emptyText(personal.apellidoPaterno) },
          { label: 'Apellido materno', value: this.emptyText(personal.apellidoMaterno) },
          { label: 'Nombre completo', value: empleado.nombre },
          this.detailSection('Información personal y contacto'),
          { label: 'Nacionalidad', value: this.catalogText(personal.idPais, 'paises') },
          {
            label: 'Estado civil',
            value: this.optionText(personal.estadoCivil, this.catalogos().estadosCivil),
          },
          { label: 'Email', value: this.emptyText(contacto.email) },
          { label: 'Teléfono', value: this.emptyText(contacto.telefono) },
          this.detailSection('Domicilio particular'),
          { label: 'Calle o avenida', value: this.emptyText(contacto.direccion) },
          { label: 'Número', value: this.emptyText(contacto.numeroDireccion) },
          { label: 'Depto. u oficina', value: this.emptyText(contacto.departamentoDireccion) },
          { label: 'Comuna', value: this.catalogText(contacto.idComuna, 'comunas') },
          { label: 'Observaciones', value: this.emptyText(contacto.observacionesDireccion) },
        ];
      case 'laboral':
        return [
          this.detailSection('Relación laboral'),
          { label: 'Relación laboral', value: this.relacionLaboralText(contrato.relacionLaboral) },
          this.detailSection('Contrato'),
          {
            label: 'Tipo trabajador',
            value: this.catalogText(contrato.idTipoTrabajador, 'tiposTrabajador'),
          },
          {
            label: 'Tipo jornada',
            value: this.catalogText(contrato.idTipoJornada, 'tiposJornada'),
          },
          { label: 'Fecha ingreso', value: this.dateText(contrato.fechaIngreso) },
          { label: 'Fecha contrato', value: this.dateText(contrato.fechaContrato) },
          { label: 'Fecha término', value: this.dateText(contrato.fechaTermino) },
          { label: 'Indefinido', value: this.booleanText(contrato.tipoContrato === 'INDEFINIDO') },
          {
            label: 'Departamento',
            value: this.catalogText(contrato.idDepartamentoEmpresa, 'departamentos'),
          },
          { label: 'Sucursal', value: this.catalogText(contrato.idSucursal, 'sucursales') },
          {
            label: 'Tipo de contrato',
            value: this.optionText(contrato.tipoContrato, this.catalogos().tiposContrato),
          },
          { label: 'Seguro de cesantía', value: this.booleanText(contrato.seguroCesantia) },
          this.detailSection('Centro de costo y estado'),
          {
            label: 'Centro de costo',
            value: this.catalogText(contrato.idCentroCosto, 'centrosCosto'),
          },
          { label: 'Cargo', value: this.cargoText(contrato.cargo) },
          { label: 'Estado de ficha inicial', value: this.statusLabel(contrato.estado) },
        ];
      case 'remuneracion':
        return [
          this.detailSection('Remuneración'),
          { label: 'Hrs. semanales', value: this.numberText(contrato.horasSemanales) },
          { label: 'Días semanales', value: this.numberText(contrato.diasSemanales) },
          { label: 'Sueldo base mensual', value: this.moneyRequiredText(contrato.sueldoBase) },
          { label: 'Moneda sueldo', value: this.catalogText(contrato.idMoneda, 'monedas') },
          {
            label: 'Gratificación',
            value: this.optionText(contrato.tipoGratificacion, this.catalogos().tiposGratificacion),
          },
          { label: 'Sueldo variable', value: this.booleanText(contrato.sueldoVariable) },
          {
            label: 'Distribución de la jornada',
            value: this.emptyText(contrato.distribucionJornada),
          },
          { label: 'Tiempo de colación', value: this.minutesText(contrato.tiempoColacionMinutos) },
          {
            label: 'Gratificación proporcional',
            value: this.booleanText(contrato.gratificacionProporcional),
          },
          this.detailSection('Cargas familiares'),
          { label: 'Número de cargas', value: this.numberText(contrato.cargas) },
          { label: 'Tramo asignado', value: this.tramoCargaText(contrato.idTramoCarga) },
          { label: 'Valor por carga', value: this.valorCargaText(contrato.idTramoCarga) },
          this.detailSection('Zona extrema'),
          { label: 'Habilitar zona extrema', value: this.booleanText(contrato.zonaExtremaActiva) },
          { label: 'Territorio', value: this.emptyText(contrato.zonaExtremaTerritorio) },
          {
            label: 'Asignación zona extrema',
            value: this.percentText(contrato.zonaExtremaPorcentaje),
          },
          this.detailSection('Beneficio semana corrida'),
          {
            label: 'Habilitar semana corrida',
            value: this.booleanText(contrato.semanaCorridaActiva),
          },
          {
            label: 'Días laborables',
            value: this.weekdayText(contrato.semanaCorridaDiasLaborables),
          },
        ];
      case 'prevision':
        return this.previsionDetailItems(prevision);
      case 'pago':
        return [
          this.detailSection('Cuenta de abono'),
          { label: 'Banco', value: this.bankText(bancario.idBanco) },
          {
            label: 'Tipo de cuenta',
            value: this.accountTypeText(bancario.idTipoCuentaBancaria),
          },
          { label: 'Número de cuenta', value: this.accountNumberText(bancario.numeroCuenta) },
          {
            label: 'Estado pago',
            value: empleado.estado === 'activo' ? 'Operativo' : 'Por completar',
          },
        ];
      case 'documentos':
        return [
          { label: 'Contrato', value: empleado.estado === 'activo' ? 'Disponible' : 'Pendiente' },
          { label: 'Anexos', value: 'Sin anexos registrados' },
          { label: 'Certificados', value: 'Sin documentos asociados' },
          { label: 'Pendientes', value: `${this.pendingItems(empleado).length}` },
        ];
      case 'historial':
        return [
          { label: 'Último cambio', value: 'Ficha consultada' },
          { label: 'Estado actual', value: this.statusLabel(empleado.estado) },
          { label: 'Origen', value: 'Módulo empleados' },
          { label: 'Auditoría', value: 'Preparada para eventos' },
        ];
    }
  }

  private previsionDetailItems(
    prevision: ReturnType<EmpleadoFormGroup['getRawValue']>['previsionSalud'],
  ): EmployeeDetailItem[] {
    const items: EmployeeDetailItem[] = [
      this.detailSection('Régimen previsional'),
      {
        label: 'Régimen previsional',
        value: this.optionText(
          prevision.tipoRegimenPrevisional,
          this.catalogos().tiposRegimenPrevisional,
        ),
      },
    ];

    if (prevision.tipoRegimenPrevisional === 'AFP') {
      items.push(
        this.detailSection('AFP'),
        { label: 'Nombre AFP', value: this.catalogText(prevision.idAfp, 'afps') },
        { label: 'Moneda Cuenta 2', value: this.catalogText(prevision.idMonedaCuenta2, 'monedas') },
        { label: 'Valor Cuenta 2', value: this.moneyText(prevision.valorCuenta2) },
      );
    }

    if (prevision.tipoRegimenPrevisional === 'IPS') {
      items.push(
        this.detailSection('IPS (Ex INP)'),
        {
          label: 'Entidad previsional IPS',
          value: this.catalogText(prevision.idEntidadPrevisionalIps, 'entidadesPrevisionalesIps'),
        },
        {
          label: 'Nombre Ex-Caja',
          value: this.catalogText(prevision.idExCajaPrevisional, 'exCajasPrevisionales'),
        },
        {
          label: 'Régimen Ex-Caja',
          value: this.catalogText(prevision.idRegimenExCaja, 'regimenesExCaja'),
        },
        { label: 'Tasa Ex-Caja', value: this.percentText(prevision.tasaExCaja) },
      );
    }

    if (
      prevision.tipoRegimenPrevisional !== null &&
      prevision.tipoRegimenPrevisional !== 'NINGUNA'
    ) {
      items.push(
        this.detailSection('Salud'),
        {
          label: 'Institución de salud',
          value: this.catalogText(prevision.idSalud, 'entidadesSalud'),
        },
        { label: 'Moneda plan salud', value: this.catalogText(prevision.idMonedaPlan, 'monedas') },
        { label: 'Valor plan', value: this.moneyText(prevision.valorPlan) },
        { label: 'Adicional GES', value: this.moneyText(prevision.adicionalAugeGes) },
      );
    }

    if (prevision.tipoRegimenPrevisional === 'AFP') {
      items.push(
        this.detailSection('APVI'),
        { label: 'Tiene APVI', value: this.booleanText(prevision.tieneApv) },
        {
          label: 'Institución APVI',
          value: this.catalogText(prevision.idInstitucionApv, 'institucionesApv'),
        },
        { label: 'Moneda APVI', value: this.catalogText(prevision.idMonedaApv, 'monedas') },
        { label: 'Valor APVI', value: this.moneyText(prevision.montoApv) },
        {
          label: 'Forma de Pago APVI',
          value: this.catalogText(prevision.idFormaPagoApv, 'formasPagoApv'),
        },
        {
          label: 'Depósito convenido APVI',
          value: this.moneyText(prevision.depositoConvenidoApvi),
        },
      );
    }

    return items;
  }

  detailBlocks(empleado: EmpleadoListado): EmployeeDetailBlock[] {
    const blocks: EmployeeDetailBlock[] = [];

    for (const item of this.detailItems(empleado)) {
      if (item.kind === 'section') {
        blocks.push({
          id: this.blockIdForTitle(item.label),
          title: item.label,
          items: [],
        });
        continue;
      }

      if (blocks.length === 0) {
        blocks.push({
          id: this.blockIdForTitle(this.activeTabLabel()),
          title: this.activeTabLabel(),
          items: [],
        });
      }

      blocks[blocks.length - 1].items.push(item);
    }

    return blocks;
  }

  historyRows(empleado: EmpleadoFichaDetalle): EmployeeHistoryRow[] {
    return empleado.historial.map((item) => this.historyRow(item));
  }

  private historyRow(item: EmpleadoHistorialCambio): EmployeeHistoryRow {
    return {
      id: String(item.id),
      fecha: item.fecha,
      evento: item.evento,
      modulo: item.seccion,
      detalle: item.detalle,
      usuario: item.usuario,
      estado: this.historyStatusLabel(item.operacion),
    };
  }

  private historyStatusLabel(operacion: string): string {
    switch (operacion) {
      case 'INSERT':
        return 'Creado';
      case 'UPDATE':
        return 'Actualizado';
      case 'DELETE':
        return 'Eliminado';
      default:
        return operacion || 'Registrado';
    }
  }

  private capitalize(value: string): string {
    return value
      .toLowerCase()
      .split(' ')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private detailSection(label: string): EmployeeDetailItem {
    return { label, value: '', kind: 'section' };
  }

  private emptyText(value: string | null | undefined): string {
    const normalized = String(value ?? '').trim();
    return normalized || 'Sin información';
  }

  private numberText(value: number | null | undefined): string {
    return typeof value === 'number' && !Number.isNaN(value)
      ? value.toLocaleString('es-CL')
      : 'Sin información';
  }

  private moneyText(value: number | null | undefined): string {
    return typeof value === 'number' && !Number.isNaN(value)
      ? new Intl.NumberFormat('es-CL', {
          style: 'currency',
          currency: 'CLP',
          maximumFractionDigits: 0,
        }).format(value)
      : 'Sin información';
  }

  private moneyRequiredText(value: number | null | undefined): string {
    return typeof value === 'number' && Number.isFinite(value) && value > 0
      ? this.moneyText(value)
      : 'Sueldo base pendiente';
  }

  private cargoText(value: string | null | undefined): string {
    const normalized = String(value ?? '').trim();

    if (!normalized || this.normalizeText(normalized) === 'sin cargo') {
      return 'Cargo pendiente';
    }

    return normalized;
  }

  private bankText(value: number | null): string {
    return value && value > 0 ? this.catalogText(value, 'bancos') : 'Datos bancarios pendientes';
  }

  private accountTypeText(value: number | null): string {
    return value && value > 0
      ? this.catalogText(value, 'tiposCuentaBancaria')
      : 'Datos bancarios pendientes';
  }

  private accountNumberText(value: string | null | undefined): string {
    const normalized = String(value ?? '').trim();

    if (!normalized || normalized.toUpperCase().startsWith('DRAFT-')) {
      return 'Cuenta bancaria pendiente';
    }

    return normalized;
  }

  private dateText(value: string | null | undefined): string {
    if (!value) {
      return 'Sin información';
    }

    const [year, month, day] = value.slice(0, 10).split('-');
    return year && month && day ? `${day}/${month}/${year}` : value;
  }

  private minutesText(value: number | null | undefined): string {
    return typeof value === 'number' && !Number.isNaN(value)
      ? `${value.toLocaleString('es-CL')} min.`
      : 'Sin información';
  }

  private percentText(value: number | null | undefined): string {
    return typeof value === 'number' && !Number.isNaN(value)
      ? `${value.toLocaleString('es-CL')}%`
      : 'Sin información';
  }

  private booleanText(value: boolean): string {
    return value ? 'Sí' : 'No';
  }

  private optionText<T extends string | number>(
    value: T | null | undefined,
    options: Array<{ value: T; label: string }>,
  ): string {
    return (
      options.find((option) => option.value === value)?.label ?? this.emptyText(String(value ?? ''))
    );
  }

  private catalogText(value: number | null, catalogKey: keyof EmpleadoFormCatalogos): string {
    const catalog = this.catalogos()[catalogKey] as Array<{ value: number; label: string }>;
    return catalog.find((option) => option.value === value)?.label ?? 'Sin información';
  }

  private relacionLaboralText(value: string): string {
    return value === 'HONORARIOS' ? 'Boleta de honorarios' : 'Contrato';
  }

  private tramoCargaText(value: number | null): string {
    const tramo = this.catalogos().tramosCarga.find((option) => option.value === value);

    if (!tramo) {
      return 'Sin información';
    }

    const range =
      tramo.desde !== null || tramo.hasta !== null
        ? ` (${tramo.desde ?? 0} - ${tramo.hasta ?? 'Sin tope'})`
        : '';

    return `${tramo.tramo ?? 'Tramo'}${range}`;
  }

  private valorCargaText(value: number | null): string {
    const tramo = this.catalogos().tramosCarga.find((option) => option.value === value);
    return this.moneyText(tramo?.valor ?? null);
  }

  private weekdayText(values: number[]): string {
    const labels = new Map<number, string>([
      [1, 'Lunes'],
      [2, 'Martes'],
      [3, 'Miércoles'],
      [4, 'Jueves'],
      [5, 'Viernes'],
      [6, 'Sábado'],
      [7, 'Domingo'],
    ]);

    return values.length
      ? values.map((value) => labels.get(value) ?? String(value)).join(', ')
      : 'Sin información';
  }

  estadoFichaLabel(estadoFicha: EmpleadoEstadoFicha): string {
    switch (estadoFicha) {
      case 'VALIDO':
        return 'Válida';
      case 'BORRADOR':
        return 'Borrador';
      case 'INCOMPLETO':
        return 'Incompleta';
    }
  }

  canEditCurrentTab(): boolean {
    return !['documentos', 'historial'].includes(this.activeTab());
  }

  canEditBlock(blockId: string): boolean {
    const tipoPrevision = this.form.controls.previsionSalud.controls.tipoRegimenPrevisional.value;

    if (blockId === 'afp' || blockId === 'apvi') {
      return tipoPrevision === 'AFP';
    }

    if (blockId === 'ips') {
      return tipoPrevision === 'IPS';
    }

    if (blockId === 'salud') {
      return tipoPrevision !== null && tipoPrevision !== 'NINGUNA';
    }

    return this.editComponentForBlock(blockId) !== null;
  }

  editVisibleBlocks(blockId: string): string[] {
    if (blockId === 'regimen') {
      return ['regimen', 'afp', 'ips', 'salud', 'apvi'];
    }

    return [this.componentBlockId(blockId)];
  }

  editComponentForBlock(
    blockId: string,
  ): 'datos' | 'contacto' | 'contrato' | 'prevision' | 'bancario' | null {
    if (['identificacion', 'nombre', 'base'].includes(blockId)) {
      return 'datos';
    }

    if (blockId === 'ubicacion') {
      return 'contacto';
    }

    if (
      [
        'relacion',
        'contrato',
        'remuneracion',
        'cargas',
        'zona-extrema',
        'semana-corrida',
        'centro-costo',
      ].includes(blockId)
    ) {
      return 'contrato';
    }

    if (['regimen', 'afp', 'ips', 'salud', 'apvi'].includes(blockId)) {
      return 'prevision';
    }

    if (blockId === 'cuenta') {
      return 'bancario';
    }

    return null;
  }

  activeSectionInvalidItems(): string[] {
    return this.controlsForActiveBlock().flatMap((control) =>
      this.collectInvalidControlNames(control),
    );
  }

  isMissingValue(value: string): boolean {
    const normalized = value.trim().toLowerCase();
    return normalized === 'sin información' || normalized === 'sin informacion';
  }

  private mapFichaEmpleadoToEvaluacionInput(empleado: EmpleadoListado): CrearEmpleadoPayload {
    return {
      ...this.buildPayloadForSave(),
      estado:
        empleado.estado === 'en_proceso' || empleado.estado === 'activo' ? 'activo' : empleado.estado,
    };
  }

  private setPayrollValidationError(evaluacion: EvaluacionCompletitudEmpleado): void {
    const items = evaluacion.bloqueos.map((bloqueo) => this.humanPendingText(bloqueo));

    this.validationErrorMessage.set(
      'Corrige los pendientes antes de habilitar al trabajador para remuneraciones.',
    );
    this.validationBlockingItems.set(items.slice(0, 5));
    this.validationPendingCount.set(Math.max(0, items.length - 5));
  }

  private humanPendingText(bloqueo: string): string {
    const normalized = this.normalizeText(bloqueo);

    if (normalized.includes('alta avanzada')) {
      return 'Continuar alta avanzada.';
    }
    if (normalized.includes('rut')) {
      return 'RUT válido.';
    }
    if (normalized.includes('nombres') || normalized.includes('apellido') || normalized.includes('pais')) {
      return 'Datos personales completos.';
    }
    if (normalized.includes('contrato') || normalized.includes('fecha de ingreso')) {
      return 'Contrato activo.';
    }
    if (normalized.includes('apvi') || normalized.includes('tiene apvi')) {
      return 'Completa APVI o desactiva Tiene APVI.';
    }
    if (normalized.includes('cargo') || normalized.includes('sin cargo')) {
      return 'Define un cargo real.';
    }
    if (normalized.includes('jornada') || normalized.includes('trabajador')) {
      return 'Jornada laboral válida.';
    }
    if (normalized.includes('remuneracion') || normalized.includes('sueldo')) {
      return 'Ingresa sueldo base válido.';
    }
    if (
      normalized.includes('previsional') ||
      normalized.includes('prevision') ||
      normalized.includes('afp') ||
      normalized.includes('salud') ||
      normalized.includes('regimen') ||
      normalized.includes('institucion de salud')
    ) {
      return 'Completa previsión y salud.';
    }
    if (
      normalized.includes('draft') ||
      normalized.includes('temporal') ||
      normalized.includes('reemplaza la cuenta')
    ) {
      return 'Reemplaza la cuenta bancaria temporal.';
    }
    if (normalized.includes('banco') || normalized.includes('cuenta bancaria') || normalized.includes('cuenta real')) {
      return 'Cuenta bancaria real.';
    }

    return bloqueo;
  }

  private tabFromSection(section: string): EmployeeFileTab {
    const normalized = this.normalizeText(section);

    if (normalized.includes('identidad') || normalized.includes('alta basica')) {
      return 'general';
    }
    if (normalized.includes('contrato') || normalized.includes('jornada') || normalized.includes('estado')) {
      return 'laboral';
    }
    if (normalized.includes('remuneracion')) {
      return 'remuneracion';
    }
    if (normalized.includes('prevision') || normalized.includes('salud') || normalized.includes('apvi')) {
      return 'prevision';
    }
    if (normalized.includes('pago')) {
      return 'pago';
    }

    return 'general';
  }

  private normalizeText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private patchFormFromEmployee(employee: EmpleadoFichaDetalle): void {
    this.form.patchValue(employee.formValue);
    this.form.markAsPristine();
  }

  private restoreForm(): void {
    const employee = this.empleado();

    if (employee) {
      this.patchFormFromEmployee(employee);
    }
  }

  private hasCurrentSectionChanges(): boolean {
    return (
      this.isEditingCurrentTab() && this.controlsForActiveBlock().some((control) => control.dirty)
    );
  }

  private controlsForActiveBlock(): AbstractControl[] {
    const blockId = this.editingBlock();
    const personal = this.form.controls.datosPersonales.controls;
    const contacto = this.form.controls.contacto.controls;
    const contrato = this.form.controls.contrato.controls;
    const prevision = this.form.controls.previsionSalud.controls;
    const bancario = this.form.controls.bancario.controls;

    switch (blockId) {
      case 'identificacion':
        return [personal.rut, personal.pasaporte, personal.fechaNacimiento, personal.sexo];
      case 'nombre':
        return [personal.nombres, personal.apellidoPaterno, personal.apellidoMaterno];
      case 'base':
        return [personal.idPais, personal.estadoCivil, contacto.email, contacto.telefono];
      case 'ubicacion':
        return [
          contacto.direccion,
          contacto.numeroDireccion,
          contacto.departamentoDireccion,
          contacto.idComuna,
          contacto.observacionesDireccion,
        ];
      case 'relacion':
        return [contrato.relacionLaboral];
      case 'contrato':
        return [
          contrato.idTipoTrabajador,
          contrato.idTipoJornada,
          contrato.fechaIngreso,
          contrato.fechaContrato,
          contrato.fechaTermino,
          contrato.idDepartamentoEmpresa,
          contrato.idSucursal,
          contrato.tipoContrato,
          contrato.seguroCesantia,
        ];
      case 'centro-costo':
        return [contrato.idCentroCosto, contrato.cargo, contrato.estado];
      case 'remuneracion':
        return [
          contrato.horasSemanales,
          contrato.diasSemanales,
          contrato.sueldoBase,
          contrato.idMoneda,
          contrato.tipoGratificacion,
          contrato.sueldoVariable,
          contrato.distribucionJornada,
          contrato.tiempoColacionMinutos,
          contrato.gratificacionProporcional,
        ];
      case 'cargas':
        return [contrato.cargas, contrato.idTramoCarga];
      case 'zona-extrema':
        return [
          contrato.zonaExtremaActiva,
          contrato.zonaExtremaTerritorio,
          contrato.zonaExtremaPorcentaje,
        ];
      case 'semana-corrida':
        return [contrato.semanaCorridaActiva, contrato.semanaCorridaDiasLaborables];
      case 'regimen':
        return this.previsionFlowControls();
      case 'afp':
        return [prevision.idAfp, prevision.idMonedaCuenta2, prevision.valorCuenta2];
      case 'ips':
        return [prevision.nombreExCaja, prevision.regimenExCaja, prevision.tasaExCaja];
      case 'salud':
        return [
          prevision.idSalud,
          prevision.idMonedaPlan,
          prevision.valorPlan,
          prevision.adicionalAugeGes,
        ];
      case 'apvi':
        return [
          prevision.tieneApv,
          prevision.idInstitucionApv,
          prevision.idMonedaApv,
          prevision.montoApv,
          prevision.idFormaPagoApv,
          prevision.depositoConvenidoApvi,
        ];
      case 'cuenta':
        return [bancario.idBanco, bancario.idTipoCuentaBancaria, bancario.numeroCuenta];
      default:
        return [];
    }
  }

  private previsionFlowControls(): AbstractControl[] {
    const prevision = this.form.controls.previsionSalud.controls;
    const controls: AbstractControl[] = [prevision.tipoRegimenPrevisional];
    const tipo = prevision.tipoRegimenPrevisional.value;

    if (tipo === 'AFP') {
      controls.push(prevision.idAfp, prevision.idMonedaCuenta2, prevision.valorCuenta2);
    }

    if (tipo === 'IPS') {
      controls.push(prevision.nombreExCaja, prevision.regimenExCaja, prevision.tasaExCaja);
    }

    if (tipo !== null && tipo !== 'NINGUNA') {
      controls.push(
        prevision.idSalud,
        prevision.idMonedaPlan,
        prevision.valorPlan,
        prevision.adicionalAugeGes,
      );
    }

    if (tipo === 'AFP') {
      controls.push(
        prevision.tieneApv,
        prevision.idInstitucionApv,
        prevision.idMonedaApv,
        prevision.montoApv,
        prevision.idFormaPagoApv,
        prevision.depositoConvenidoApvi,
      );
    }

    return controls;
  }

  private saveTargetForTab(
    tabId: EmployeeFileTab,
  ): 'general' | 'laboral' | 'remuneracion' | 'prevision' | 'pago' | null {
    switch (tabId) {
      case 'general':
        return 'general';
      case 'laboral':
        return 'laboral';
      case 'remuneracion':
        return 'remuneracion';
      case 'prevision':
        return 'prevision';
      case 'pago':
        return 'pago';
      case 'documentos':
      case 'historial':
        return null;
    }
  }

  private blockIdForTitle(title: string): string {
    const ids: Record<string, string> = {
      'Identificación legal': 'identificacion',
      'Nombre del colaborador': 'nombre',
      'Información personal y contacto': 'base',
      'Domicilio particular': 'ubicacion',
      'Relación laboral': 'relacion',
      Contrato: 'contrato',
      'Centro de costo y estado': 'centro-costo',
      Remuneración: 'remuneracion',
      'Cargas familiares': 'cargas',
      'Zona extrema': 'zona-extrema',
      'Beneficio semana corrida': 'semana-corrida',
      'Régimen previsional': 'regimen',
      AFP: 'afp',
      'IPS (Ex INP)': 'ips',
      Salud: 'salud',
      APVI: 'apvi',
      'Cuenta de abono': 'cuenta',
    };

    return ids[title] ?? title.toLowerCase().replace(/\s+/g, '-');
  }

  private componentBlockId(blockId: string): string {
    const ids: Record<string, string> = {
      'zona-extrema': 'zonaExtrema',
      'semana-corrida': 'semanaCorrida',
      'centro-costo': 'centroCosto',
    };

    return ids[blockId] ?? blockId;
  }

  private buildPayloadForSave(): CrearEmpleadoPayload {
    const raw = this.form.getRawValue();
    const tipoPrevision = raw.previsionSalud.tipoRegimenPrevisional ?? 'NINGUNA';
    const tieneCuenta2 =
      tipoPrevision === 'AFP' &&
      (raw.previsionSalud.idMonedaCuenta2 !== null || raw.previsionSalud.valorCuenta2 !== null);
    const requiereSalud = tipoPrevision !== 'NINGUNA';
    const tieneApvi = tipoPrevision === 'AFP' && raw.previsionSalud.tieneApv;

    return {
      origenCreacion: 'avanzado',
      rut: raw.datosPersonales.rut,
      nombres: raw.datosPersonales.nombres,
      apellidoPaterno: raw.datosPersonales.apellidoPaterno,
      apellidoMaterno: raw.datosPersonales.apellidoMaterno,
      fechaNacimiento: raw.datosPersonales.fechaNacimiento,
      sexo: raw.datosPersonales.sexo!,
      estadoCivil: raw.datosPersonales.estadoCivil!,
      pasaporte: raw.datosPersonales.pasaporte.trim() || null,
      idPais: raw.datosPersonales.idPais ?? 0,
      email: raw.contacto.email,
      telefono: raw.contacto.telefono,
      direccion: raw.contacto.direccion,
      numeroDireccion: raw.contacto.numeroDireccion.trim() || null,
      departamentoDireccion: raw.contacto.departamentoDireccion.trim() || null,
      observacionesDireccion: raw.contacto.observacionesDireccion.trim() || null,
      idComuna: raw.contacto.idComuna,
      idSucursal: raw.contrato.idSucursal,
      idDepartamentoEmpresa: raw.contrato.idDepartamentoEmpresa,
      idCentroCosto: raw.contrato.idCentroCosto,
      cargo: raw.contrato.cargo,
      fechaContrato: raw.contrato.fechaContrato || raw.contrato.fechaIngreso,
      tipoContrato: raw.contrato.tipoContrato ?? 'INDEFINIDO',
      idTipoTrabajador: raw.contrato.idTipoTrabajador ?? 0,
      idTipoJornada: raw.contrato.idTipoJornada ?? 0,
      seguroCesantia: raw.contrato.seguroCesantia,
      fechaIngreso: raw.contrato.fechaIngreso || new Date().toISOString().slice(0, 10),
      fechaTermino: raw.contrato.fechaTermino || null,
      sueldoBase: raw.contrato.sueldoBase ?? 0,
      idMoneda: raw.contrato.idMoneda,
      sueldoVariable: raw.contrato.sueldoVariable,
      horasSemanales: raw.contrato.horasSemanales ?? 0,
      cargas: raw.contrato.cargas ?? 0,
      diasSemanales: raw.contrato.diasSemanales ?? 0,
      distribucionJornada: raw.contrato.distribucionJornada.trim() || null,
      tiempoColacionMinutos: raw.contrato.tiempoColacionMinutos,
      tipoGratificacion: raw.contrato.tipoGratificacion ?? 'LEGAL_ART_50',
      gratificacionProporcional: raw.contrato.gratificacionProporcional,
      semanaCorridaActiva: raw.contrato.semanaCorridaActiva,
      semanaCorridaDiasLaborables: raw.contrato.semanaCorridaActiva
        ? raw.contrato.semanaCorridaDiasLaborables
        : [],
      zonaExtremaActiva: raw.contrato.zonaExtremaActiva,
      zonaExtremaTerritorio: raw.contrato.zonaExtremaActiva
        ? raw.contrato.zonaExtremaTerritorio
        : null,
      zonaExtremaPorcentaje: raw.contrato.zonaExtremaActiva
        ? raw.contrato.zonaExtremaPorcentaje
        : null,
      estado: raw.contrato.estado,
      idTramoCarga: raw.contrato.idTramoCarga,
      condicionesTrabajador: [],
      tipoPrevision,
      idRegimenPrevisional: this.resolveRegimenPrevisionalId(tipoPrevision),
      idAfp: tipoPrevision === 'AFP' ? raw.previsionSalud.idAfp : null,
      idMonedaCuenta2: tieneCuenta2 ? raw.previsionSalud.idMonedaCuenta2 : null,
      valorCuenta2: tieneCuenta2 ? raw.previsionSalud.valorCuenta2 : null,
      idEntidadPrevisionalIps:
        tipoPrevision === 'IPS' ? raw.previsionSalud.idEntidadPrevisionalIps : null,
      idExCajaPrevisional: tipoPrevision === 'IPS' ? raw.previsionSalud.idExCajaPrevisional : null,
      idRegimenExCaja: tipoPrevision === 'IPS' ? raw.previsionSalud.idRegimenExCaja : null,
      nombreExCaja: tipoPrevision === 'IPS' ? raw.previsionSalud.nombreExCaja : null,
      regimenExCaja: tipoPrevision === 'IPS' ? raw.previsionSalud.regimenExCaja : null,
      tasaExCaja: tipoPrevision === 'IPS' ? raw.previsionSalud.tasaExCaja : null,
      idSalud: requiereSalud ? raw.previsionSalud.idSalud : null,
      idMonedaPlan: requiereSalud ? raw.previsionSalud.idMonedaPlan : null,
      valorPlan: requiereSalud ? raw.previsionSalud.valorPlan : null,
      adicionalAugeGes: requiereSalud ? raw.previsionSalud.adicionalAugeGes : null,
      tieneApv: tieneApvi,
      idInstitucionApv: tieneApvi ? raw.previsionSalud.idInstitucionApv : null,
      idMonedaApv: tieneApvi ? raw.previsionSalud.idMonedaApv : null,
      montoApv: tieneApvi ? raw.previsionSalud.montoApv : null,
      idFormaPagoApv: tieneApvi ? raw.previsionSalud.idFormaPagoApv : null,
      depositoConvenidoApvi: tieneApvi ? raw.previsionSalud.depositoConvenidoApvi : null,
      idBanco: raw.bancario.idBanco ?? 0,
      idTipoCuentaBancaria: raw.bancario.idTipoCuentaBancaria ?? 0,
      numeroCuenta: raw.bancario.numeroCuenta,
    };
  }

  private resolveRegimenPrevisionalId(tipo: TipoRegimenPrevisional): number | null {
    if (tipo === 'NINGUNA') {
      return null;
    }

    return (
      this.catalogos().regimenesPrevisionales.find((option) => option.label.toUpperCase() === tipo)
        ?.value ?? null
    );
  }

  private collectInvalidControlNames(control: AbstractControl, path = ''): string[] {
    if (!('controls' in control)) {
      return control.invalid ? [path] : [];
    }

    const controls = control.controls as Record<string, AbstractControl>;
    return Object.entries(controls).flatMap(([key, child]) =>
      this.collectInvalidControlNames(child, path ? `${path}.${key}` : key),
    );
  }
}
