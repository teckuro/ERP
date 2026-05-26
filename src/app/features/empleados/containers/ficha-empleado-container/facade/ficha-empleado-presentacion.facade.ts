import { DestroyRef, Injectable, OnInit, effect, inject, signal } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  Edit3,
  Info,
  Save,
  X,
} from 'lucide-angular/src/icons';

import {
  FICHA_EMPLEADO_TABS,
  fichaBlockIdFromTitle,
  fichaComponentBlockId,
  fichaSaveTargetForTab,
  type ClaveTabFichaEmpleado,
} from '../../../models/ficha-empleado-tabs.config';
import {
  EMPTY_EMPLEADO_FORM_CATALOGOS,
  EmpleadoFormCatalogos,
} from '../../../models/empleado-catalogos.model';
import { EmpleadoFormGroup } from '../../../models/empleado-form.model';
import {
  EmpleadoEstado,
  EmpleadoEstadoFicha,
  EmpleadoFichaDetalle,
  EmpleadoHistorialCambio,
  EmpleadoListado,
} from '../../../models/empleado-listado.model';
import { CrearEmpleadoPayload } from '../../../models/empleado-payload.model';
import { TipoRegimenPrevisional } from '../../../models/empleado.model';
import { EmpleadosCatalogosService } from '../../../services/empleados-catalogos.service';
import { EmpleadosFormOrchestratorService } from '../../../services/empleados-form-orchestrator.service';
import { EmpleadosService } from '../../../services/empleados.service';
import {
  EvaluacionCompletitudEmpleado,
  evaluarCompletitudYAptitudEmpleado,
} from '../../../utils/empleado-completitud.rules';
import {
  buildExpedienteNavItems,
  buildFichaEstadoPanelVm,
  etiquetaEstadoNavegacion,
  resolveAccionPrincipalTab,
  type FaltanteFichaEmpleado,
  type ItemNavegacionFichaEmpleado,
  type EstadoNavegacionFichaEmpleado,
  type FichaEstadoPanelVm,
} from '../../../rules/ficha-empleado-presentacion.rules';
import { DataGridColumn } from '../../../../../shared/components/ui/data-grid';
import { type MessageBoxSection } from '../../../../../shared/components/ui/feedback/message-box/message-box.component';
import { bindShellPageContext } from '../../../../../layout/shell-page-context.binding';
import { PeriodoActivoService } from '../../../../../core/services/periodo-activo.service';
import { mapCondicionesTrabajadorFromFormValue } from '../../../mappers/empleado-form.mapper';
import type { PerfilLaboralPersona } from '../../../models/empleado-perfil-laboral-rpc.model';
import type { CondicionTrabajadorControlName } from '../../../models/empleado-perfil-laboral.model';
import {
  buildCondicionesEspecialesDetalleItems,
  etiquetaTramoEdadLaboral,
} from '../../../rules/empleado-perfil-laboral.rules';
import { FichaEmpleadoOverlaysPort } from './ficha-empleado-overlays.port';

type TabFichaEmpleado = ClaveTabFichaEmpleado;

type EstadoTabFichaEmpleado = 'complete' | 'pending' | 'warning' | 'blocking';

interface DetalleFichaEmpleadoItem {
  label: string;
  value: string;
  kind?: 'section';
}

interface BloqueDetalleFichaEmpleado {
  id: string;
  title: string;
  items: DetalleFichaEmpleadoItem[];
}

interface FilaHistorialFichaEmpleado {
  id: string;
  fecha: string;
  evento: string;
  modulo: string;
  detalle: string;
  usuario: string;
  estado: string;
}

interface DeteccionAutomaticaPerfilLaboral {
  controlName: CondicionTrabajadorControlName;
  reason: string;
}

@Injectable()
export class FichaEmpleadoPresentacionFacade implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly empleadosService = inject(EmpleadosService);
  private readonly empleadosCatalogosService = inject(EmpleadosCatalogosService);
  private readonly empleadosFormService = inject(EmpleadosFormOrchestratorService);
  private readonly periodoActivo = inject(PeriodoActivoService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly overlaysPort = inject(FichaEmpleadoOverlaysPort);

  readonly empleadoId = Number(this.route.snapshot.paramMap.get('id'));
  readonly empleado = signal<EmpleadoFichaDetalle | null>(null);
  readonly isLoading = signal(true);
  readonly cargandoCatalogos = signal(true);
  readonly isSavingSection = signal(false);
  readonly isValidatingPayroll = signal(false);
  readonly mensajeError = signal<string | null>(null);
  readonly mensajeErrorSeccion = signal<string | null>(null);
  readonly tituloExitoSeccion = signal<string | null>(null);
  readonly mensajeExitoSeccion = signal<string | null>(null);
  readonly mensajeExitoValidacion = signal<string | null>(null);
  readonly mensajeErrorValidacion = signal<string | null>(null);
  readonly validationBlockingItems = signal<string[]>([]);
  readonly validationPendingCount = signal(0);
  readonly confirmPayrollValidation = signal(false);
  readonly tabActivo = signal<TabFichaEmpleado>('general');
  readonly editingTab = signal<TabFichaEmpleado | null>(null);
  readonly editingBlock = signal<string | null>(null);
  readonly catalogos = signal<EmpleadoFormCatalogos>(EMPTY_EMPLEADO_FORM_CATALOGOS);
  readonly form: EmpleadoFormGroup = this.empleadosFormService.createForm();
  readonly perfilLaboralRpc = signal<PerfilLaboralPersona | null>(null);
  readonly perfilLaboralCargando = signal(false);
  readonly perfilLaboralError = signal<string | null>(null);

  readonly arrowLeftIcon = ArrowLeft;
  readonly chevronRightIcon = ChevronRight;
  readonly alertIcon = AlertCircle;
  /** Vacío esperado - ícono informativo pequeño, no error. */
  readonly emptyFieldIcon = Info;
  readonly editIcon = Edit3;
  readonly saveIcon = Save;
  readonly cancelIcon = X;

  readonly tabs = FICHA_EMPLEADO_TABS;

  readonly historyColumns: DataGridColumn<FilaHistorialFichaEmpleado>[] = [
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
      id: 'estado',
      header: 'Estado',
      field: 'estado',
      sortable: true,
      widthClass: 'min-w-[8rem]',
    },
  ];

  readonly trackHistoryRow = (_index: number, row: FilaHistorialFichaEmpleado): string => row.id;

  constructor() {
    bindShellPageContext(
      this.destroyRef,
      () => {
        const emp = this.empleado();
        const etiqueta = emp?.nombre?.trim() || 'Ficha empleado';
        const context = {
          breadcrumbs: [
            { label: 'Empleados', path: '/empleados' },
            { label: etiqueta },
          ],
        };

        if (!emp) {
          return context;
        }

        const estado = this.fichaEstadoPanel(emp);

        return {
          ...context,
          statusChip: {
            label: estado.visorLabel,
            tone: estado.shellTone,
          },
        };
      },
      {},
    );

    effect(() => {
      const empleado = this.empleado();
      const periodoYm = this.periodoActivo.periodoYm();

      if (empleado?.id && periodoYm) {
        void this.cargarPerfilLaboral(empleado.id, periodoYm);
      }
    });
  }

  async ngOnInit(): Promise<void> {
    if (!Number.isInteger(this.empleadoId) || this.empleadoId <= 0) {
      this.mensajeError.set('Identificador de empleado invalido.');
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
        this.mensajeError.set('No se encontro la ficha solicitada.');
      } else {
        this.patchFormFromEmployee(this.empleado()!);
      }
    } catch {
      this.mensajeError.set('No fue posible cargar la ficha del empleado.');
    } finally {
      this.cargandoCatalogos.set(false);
      this.isLoading.set(false);
    }
  }

  selectTab(idTab: TabFichaEmpleado): boolean {
    if (this.editingBlock()) {
      if (!this.requestCerrarEdicion()) {
        return false;
      }
    } else if (this.hasCurrentSectionChanges()) {
      const shouldDiscard = window.confirm(
        'Hay cambios sin guardar en la seccion actual. Deseas descartarlos?',
      );

      if (!shouldDiscard) {
        return false;
      }

      this.restoreForm();
    }

    this.tabActivo.set(idTab);
    this.editingTab.set(null);
    this.editingBlock.set(null);
    this.overlaysPort.cerrar();
    this.mensajeErrorSeccion.set(null);
    this.tituloExitoSeccion.set(null);
    this.mensajeExitoSeccion.set(null);
    return true;
  }

  startEditing(blockId: string | null = null): void {
    if (!this.canEditCurrentTab()) {
      return;
    }

    const employee = this.empleado();

    if (!employee) {
      return;
    }

    const resolvedBlockId = blockId ?? this.detailBlocks(employee).at(0)?.id ?? null;

    if (!resolvedBlockId) {
      return;
    }

    const tituloBloque =
      this.detailBlocks(employee).find((block) => block.id === resolvedBlockId)?.title ??
      'Registro';

    this.mensajeErrorSeccion.set(null);
    this.tituloExitoSeccion.set(null);
    this.mensajeExitoSeccion.set(null);
    this.editingTab.set(this.tabActivo());
    this.editingBlock.set(resolvedBlockId);
    this.overlaysPort.abrirEdicionBloque(resolvedBlockId, tituloBloque);
  }

  requestCerrarEdicion(): boolean {
    if (!this.editingBlock()) {
      return true;
    }

    if (this.hasCurrentSectionChanges()) {
      const shouldDiscard = window.confirm(
        'Hay cambios sin guardar en este registro. ¿Desea descartarlos?',
      );

      if (!shouldDiscard) {
        return false;
      }
    }

    this.cancelEditing();
    return true;
  }

  cancelEditing(): void {
    this.restoreForm();
    this.editingTab.set(null);
    this.editingBlock.set(null);
    this.overlaysPort.cerrar();
    this.mensajeErrorSeccion.set(null);
    this.tituloExitoSeccion.set(null);
    this.mensajeExitoSeccion.set(null);
  }

  async handlePrimaryFichaAction(empleado: EmpleadoFichaDetalle): Promise<void> {
    if (this.puedeValidarRemuneraciones(empleado)) {
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
    this.mensajeErrorValidacion.set(null);
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

    if (!this.puedeValidarRemuneraciones(employee)) {
      this.setPayrollValidationError(evaluacion);
      this.confirmPayrollValidation.set(false);
      return;
    }

    this.isValidatingPayroll.set(true);
    this.mensajeErrorValidacion.set(null);
    this.mensajeExitoValidacion.set(null);
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

      this.mensajeExitoValidacion.set('Ficha validada para remuneraciones.');
      this.confirmPayrollValidation.set(false);
    } catch (error) {
      const evaluacionError =
        error instanceof Error && 'evaluacion' in error
          ? (error as { evaluacion: EvaluacionCompletitudEmpleado }).evaluacion
          : null;

      if (evaluacionError) {
        this.setPayrollValidationError(evaluacionError);
      } else {
        this.mensajeErrorValidacion.set(
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

    const saveTarget = fichaSaveTargetForTab(this.tabActivo());
    const blockTitle = this.activeEditingBlockTitle();

    if (!saveTarget) {
      this.editingTab.set(null);
      this.editingBlock.set(null);
      this.overlaysPort.cerrar();
      return;
    }

    const controls = this.controlsForActiveBlock();
    controls.forEach((control) => control.markAllAsTouched());
    controls.forEach((control) => control.updateValueAndValidity({ emitEvent: false }));

    if (controls.some((control) => control.invalid)) {
      this.mensajeErrorSeccion.set('Revisa los campos marcados antes de guardar esta sección.');
      return;
    }

    this.isSavingSection.set(true);
    this.mensajeErrorSeccion.set(null);
    this.tituloExitoSeccion.set(null);
    this.mensajeExitoSeccion.set(null);

    try {
      const updated = await this.empleadosService.guardarSeccionFicha(
        this.empleadoId,
        saveTarget,
        this.buildPayloadForSave(),
      );

      if (updated) {
        this.empleado.set(updated);
        this.patchFormFromEmployee(updated);

        if (saveTarget === 'laboral' || saveTarget === 'remuneracion') {
          void this.cargarPerfilLaboral(updated.id, this.periodoActivo.periodoYm());
        }
      }

      this.editingTab.set(null);
      this.editingBlock.set(null);
      this.overlaysPort.cerrar();
      this.tituloExitoSeccion.set(blockTitle);
      this.mensajeExitoSeccion.set(
        `Se guardó ${blockTitle}. Las demás secciones de la ficha no se modificaron.`,
      );
    } catch (error) {
      this.mensajeErrorSeccion.set(
        error instanceof Error
          ? error.message
          : 'No fue posible guardar la sección. Intenta nuevamente.',
      );
    } finally {
      this.isSavingSection.set(false);
    }
  }

  dismissSectionError(): void {
    this.mensajeErrorSeccion.set(null);
  }

  dismissSectionSuccess(): void {
    this.tituloExitoSeccion.set(null);
    this.mensajeExitoSeccion.set(null);
  }

  activeEditingBlockTitle(): string {
    const empleado = this.empleado();
    const blockId = this.editingBlock();

    if (!empleado || !blockId) {
      return 'este bloque';
    }

    return this.detailBlocks(empleado).find((block) => block.id === blockId)?.title ?? 'este bloque';
  }

  saveBlockButtonLabel(): string {
    return this.isSavingSection() ? 'Guardando...' : 'Guardar';
  }

  saveBlockHint(_blockTitle: string): string {
    return 'Los cambios se aplicarán solo a esta sección.';
  }

  isEditingCurrentTab(): boolean {
    return this.editingTab() === this.tabActivo();
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

  employeeInitials(empleado: EmpleadoListado): string {
    const parts = empleado.nombre
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (parts.length === 0) {
      return 'FC';
    }

    return parts
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }

  fichaEstadoPanel(empleado: EmpleadoListado): FichaEstadoPanelVm {
    return buildFichaEstadoPanelVm({
      evaluacion: this.evaluacionEmpleado(empleado),
      pasoAltaAvanzada: empleado.pasoAltaAvanzada,
      estadoFicha: empleado.estadoFicha,
      estadoLaboral: empleado.estado,
      aptoParaRemuneracionesRegistro: empleado.aptoParaRemuneraciones,
      estadoTab: (idTab) => this.estadoTab(idTab, empleado),
      humanizeBloqueo: (bloqueo) => this.humanPendingText(bloqueo),
    });
  }

  progressStyle(empleado: EmpleadoListado): Record<string, string> {
    return { width: `${this.fichaEstadoPanel(empleado).porcentajeAvance}%` };
  }

  estadoTab(idTab: TabFichaEmpleado, empleado: EmpleadoListado): EstadoTabFichaEmpleado {
    const evaluacion = this.evaluacionEmpleado(empleado);

    if (evaluacion.seccionesPendientes.some((section) => this.tabFromSection(section) === idTab)) {
      return idTab === 'pago' || idTab === 'remuneracion' || idTab === 'prevision'
        ? 'blocking'
        : 'warning';
    }

    if (evaluacion.advertencias.some((advertencia) => this.pendingMessageMatchesTab(advertencia, idTab))) {
      return 'warning';
    }

    if (evaluacion.aptoParaRemuneraciones) {
      return 'complete';
    }

    return idTab === 'documentos' || idTab === 'historial' ? 'pending' : 'complete';
  }

  estadoTabLabel(idTab: TabFichaEmpleado, empleado: EmpleadoListado): string {
    switch (this.estadoTab(idTab, empleado)) {
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

  estadoTabClass(idTab: TabFichaEmpleado, empleado: EmpleadoListado): string {
    return `is-${this.estadoTab(idTab, empleado)}`;
  }

  selectRecommendedTab(empleado: EmpleadoListado): void {
    const primerPendiente = this.evaluacionEmpleado(empleado).seccionesPendientes[0];
    this.selectTab(primerPendiente ? this.tabFromSection(primerPendiente) : 'general');
  }

  expedienteNavItems(empleado: EmpleadoListado): ItemNavegacionFichaEmpleado[] {
    return buildExpedienteNavItems({
      tabs: this.tabs,
      tabActivo: this.tabActivo(),
      estadoTab: (idTab) => this.estadoTab(idTab, empleado),
    });
  }

  async ejecutarAccionPrincipalPanel(): Promise<void> {
    const empleado = this.empleado();
    if (!empleado || this.isValidatingPayroll()) {
      return;
    }

    const estado = this.fichaEstadoPanel(empleado);

    if (estado.puedeValidarRemuneraciones) {
      this.openPayrollValidationConfirm();
      return;
    }

    const tab = resolveAccionPrincipalTab(estado.faltantes, this.evaluacionEmpleado(empleado));

    if (estado.faltantes.some((issue) => issue.claveBloque === 'pago') || tab === 'pago') {
      const cambioTabAceptado = this.selectTab('pago');
      if (!cambioTabAceptado) {
        return;
      }
      this.startEditing(this.detailBlocks(empleado).at(0)?.id);
      return;
    }

    await this.handlePrimaryFichaAction(empleado);
  }

  navegarFaltante(issue: FaltanteFichaEmpleado): void {
    this.selectTab(issue.claveBloque);
  }

  claseEstadoNavegacion(estado: EstadoNavegacionFichaEmpleado): string {
    return `employee-record-rail__status employee-record-rail__status--${estado}`;
  }

  etiquetaEstadoRail(estado: EstadoNavegacionFichaEmpleado): string {
    return etiquetaEstadoNavegacion(estado);
  }

  tabActivoDescription(): string {
    const descriptions: Record<TabFichaEmpleado, string> = {
      general: 'Información base del trabajador y datos de contacto.',
      laboral: 'Contrato, cargo y relación laboral del período.',
      remuneracion: 'Jornada, sueldo y asignaciones del trabajador.',
      prevision: 'Régimen previsional, salud y APV cuando aplica.',
      pago: 'Cuenta de abono y datos para transferencia.',
      documentos: 'Respaldo documental del trabajador.',
      historial: 'Eventos y cambios registrados en la ficha.',
    };
    return descriptions[this.tabActivo()] ?? '';
  }

  evaluacionEmpleado(empleado: EmpleadoListado): EvaluacionCompletitudEmpleado {
    return evaluarCompletitudYAptitudEmpleado({
      payload: this.mapFichaEmpleadoToEvaluacionInput(empleado),
      pasoAltaAvanzada: empleado.pasoAltaAvanzada,
      perfilLaboralRpc: this.perfilLaboralRpc(),
    });
  }

  perfilLaboralTipoTrabajadorLabel(): string {
    const id = this.form.controls.contrato.controls.idTipoTrabajador.value;
    return id ? this.catalogText(id, 'tiposTrabajador') : 'Tipo trabajador pendiente';
  }

  perfilLaboralEdadDetectadaLabel(): string {
    const perfil = this.perfilLaboralRpc();

    if (perfil) {
      return etiquetaTramoEdadLaboral(perfil.tramoEdadLaboral, perfil.edadPeriodo);
    }

    return '';
  }

  perfilLaboralEdadDetectadaDescripcion(): string {
    const perfil = this.perfilLaboralRpc();

    if (!perfil) {
      return '';
    }

    if (perfil.requiereRevisionRrhh) {
      return 'Revisión sugerida según edad o condiciones del período activo.';
    }

    return 'Perfil estándar para el período activo. Declara condiciones solo con respaldo.';
  }

  deteccionesAutomaticasPerfilLaboral(): readonly DeteccionAutomaticaPerfilLaboral[] {
    const perfil = this.perfilLaboralRpc();
    const controls = this.form.controls.perfilLaboral.controls;
    const detections: DeteccionAutomaticaPerfilLaboral[] = [];

    if (perfil?.esMenor18 && !controls.trabajadorAdolescenteProtegido.value) {
      detections.push({
        controlName: 'trabajadorAdolescenteProtegido',
        reason: 'Edad laboral detectada menor de 18 en el período activo.',
      });
    }

    const tipoPrevision = this.form.controls.previsionSalud.controls.tipoRegimenPrevisional.value;
    if (tipoPrevision === 'NINGUNA' && !controls.exentoCotizacionPension.value) {
      detections.push({
        controlName: 'exentoCotizacionPension',
        reason: 'Régimen previsional sin cotización obligatoria declarado.',
      });
    }

    return detections;
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

  etiquetaAccionPrincipalEvaluada(empleado: EmpleadoListado): string {
    return this.fichaEstadoPanel(empleado).etiquetaAccionPrincipalEvaluada;
  }

  puedeValidarRemuneraciones(empleado: EmpleadoListado): boolean {
    return this.fichaEstadoPanel(empleado).puedeValidarRemuneraciones;
  }

  tabActivoLabel(): string {
    return this.tabs.find((tab) => tab.id === this.tabActivo())?.label ?? 'General';
  }

  /** Título del bloque principal del tab (puede diferir de la etiqueta del rail). */
  tabActivoIntroTitle(): string {
    if (this.tabActivo() === 'remuneracion') {
      return 'Jornada y remuneración';
    }

    return this.tabActivoLabel();
  }

  detailItems(empleado: EmpleadoListado): DetalleFichaEmpleadoItem[] {
    const raw = this.form.getRawValue();
    const personal = raw.datosPersonales;
    const contacto = raw.contacto;
    const contrato = raw.contrato;
    const prevision = raw.previsionSalud;
    const bancario = raw.bancario;

    switch (this.tabActivo()) {
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
      case 'laboral': {
        const laboralBase: DetalleFichaEmpleadoItem[] = [
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

        if (contrato.relacionLaboral === 'HONORARIOS') {
          return laboralBase;
        }

        const condicionesDetalle = buildCondicionesEspecialesDetalleItems({
          perfil: this.perfilLaboralRpc(),
          formPerfil: raw.perfilLaboral,
          periodoEtiqueta: this.periodoActivo.etiqueta(),
          categoriaBaseLabel: 'Dependiente / contrato',
        });

        return [
          ...laboralBase,
          this.detailSection('Condiciones especiales'),
          ...condicionesDetalle.map((item) => ({ label: item.label, value: item.value })),
        ];
      }
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
          {
            label: 'Pendientes',
            value: `${this.evaluacionEmpleado(empleado).bloqueos.length}`,
          },
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
  ): DetalleFichaEmpleadoItem[] {
    const items: DetalleFichaEmpleadoItem[] = [
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

  detailBlocks(empleado: EmpleadoListado): BloqueDetalleFichaEmpleado[] {
    const blocks: BloqueDetalleFichaEmpleado[] = [];

    for (const item of this.detailItems(empleado)) {
      if (item.kind === 'section') {
        blocks.push({
          id: fichaBlockIdFromTitle(item.label),
          title: item.label,
          items: [],
        });
        continue;
      }

      if (blocks.length === 0) {
        blocks.push({
          id: fichaBlockIdFromTitle(this.tabActivoLabel()),
          title: this.tabActivoLabel(),
          items: [],
        });
      }

      blocks[blocks.length - 1].items.push(item);
    }

    return blocks;
  }

  historyRows(empleado: EmpleadoFichaDetalle): FilaHistorialFichaEmpleado[] {
    return empleado.historial.map((item) => this.historyRow(item));
  }

  private historyRow(item: EmpleadoHistorialCambio): FilaHistorialFichaEmpleado {
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

  private detailSection(label: string): DetalleFichaEmpleadoItem {
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
    return !['documentos', 'historial'].includes(this.tabActivo());
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

    if (blockId === 'condiciones-especiales') {
      return this.form.controls.contrato.controls.relacionLaboral.value !== 'HONORARIOS';
    }

    return this.editComponentForBlock(blockId) !== null;
  }

  editVisibleBlocks(blockId: string): string[] {
    if (blockId === 'regimen') {
      return ['regimen', 'afp', 'ips', 'salud', 'apvi'];
    }

    if (blockId === 'base') {
      return ['base', 'contacto'];
    }

    return [fichaComponentBlockId(blockId)];
  }

  editComponentForBlock(
    blockId: string,
  ): 'datos' | 'contacto' | 'contrato' | 'prevision' | 'bancario' | 'perfil-laboral' | null {
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

    if (blockId === 'condiciones-especiales') {
      return 'perfil-laboral';
    }

    return null;
  }

  activeSectionInvalidItems(): string[] {
    const controls = this.controlsForActiveBlock();
    const labels = this.controlLabelsForActiveBlock();

    return controls.flatMap((control, index) => {
      if (!control.invalid) {
        return [];
      }

      const nested = this.collectInvalidControlNames(control)
        .map((item) => item.trim())
        .filter(Boolean);

      return nested.length > 0 ? nested : [labels[index] ?? 'Campo requerido'];
    });
  }

  sectionValidationSections(): MessageBoxSection[] {
    const items = this.activeSectionInvalidItems().slice(0, 5);

    if (items.length === 0) {
      return [];
    }

    return [
      {
        title: 'Campos por corregir',
        items,
        tone: 'attention',
      },
    ];
  }

  isMissingValue(value: string): boolean {
    const normalized = value.trim().toLowerCase();
    if (!normalized) {
      return true;
    }
    if (normalized === 'sin información' || normalized === 'sin informacion' || normalized === 'no informado') {
      return true;
    }
    return (
      normalized.endsWith(' pendiente') ||
      normalized.endsWith(' pendientes') ||
      normalized.includes('pendiente de')
    );
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

    this.mensajeErrorValidacion.set(
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

  private tabFromSection(section: string): TabFichaEmpleado {
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

  private pendingMessageMatchesTab(message: string, idTab: TabFichaEmpleado): boolean {
    const normalized = this.normalizeText(message);
    switch (idTab) {
      case 'general':
        return (
          normalized.includes('rut')
          || normalized.includes('nombre')
          || normalized.includes('apellido')
          || normalized.includes('pais')
          || normalized.includes('correo')
          || normalized.includes('telefono')
          || normalized.includes('contacto')
          || normalized.includes('comuna')
        );
      case 'laboral':
        return (
          normalized.includes('contrato')
          || normalized.includes('cargo')
          || normalized.includes('jornada')
          || normalized.includes('sucursal')
          || normalized.includes('organizacion')
          || normalized.includes('condiciones especiales')
        );
      case 'remuneracion':
        return (
          normalized.includes('remuneracion')
          || normalized.includes('sueldo')
          || normalized.includes('moneda')
          || normalized.includes('cargas')
          || normalized.includes('asignacion')
          || normalized.includes('zona extrema')
          || normalized.includes('semana corrida')
        );
      case 'prevision':
        return (
          normalized.includes('prevision')
          || normalized.includes('salud')
          || normalized.includes('afp')
          || normalized.includes('ips')
          || normalized.includes('apvi')
          || normalized.includes('auge')
          || normalized.includes('ges')
        );
      case 'pago':
        return normalized.includes('banco') || normalized.includes('cuenta') || normalized.includes('transferencia');
      default:
        return false;
    }
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
      case 'condiciones-especiales':
        return Object.values(this.form.controls.perfilLaboral.controls);
      default:
        return [];
    }
  }

  private controlLabelsForActiveBlock(): string[] {
    switch (this.editingBlock()) {
      case 'identificacion':
        return ['RUT', 'Pasaporte', 'Fecha nacimiento', 'Sexo'];
      case 'nombre':
        return ['Nombres', 'Apellido paterno', 'Apellido materno'];
      case 'base':
        return ['Pais', 'Estado civil', 'Email', 'Telefono'];
      case 'ubicacion':
        return ['Direccion', 'Numero', 'Departamento', 'Comuna', 'Observaciones'];
      case 'relacion':
        return ['Relacion laboral'];
      case 'contrato':
        return [
          'Tipo trabajador',
          'Tipo jornada',
          'Fecha ingreso',
          'Fecha contrato',
          'Fecha termino',
          'Departamento',
          'Sucursal',
          'Tipo contrato',
          'Seguro cesantia',
        ];
      case 'centro-costo':
        return ['Centro de costo', 'Cargo', 'Estado'];
      case 'remuneracion':
        return [
          'Horas semanales',
          'Dias semanales',
          'Sueldo base',
          'Moneda',
          'Gratificacion',
          'Sueldo variable',
          'Distribucion jornada',
          'Tiempo colacion',
          'Gratificacion proporcional',
        ];
      case 'cargas':
        return ['Cargas', 'Tramo de cargas'];
      case 'zona-extrema':
        return ['Zona extrema activa', 'Territorio', 'Porcentaje'];
      case 'semana-corrida':
        return ['Semana corrida activa', 'Dias laborables'];
      case 'regimen':
        return [
          'Regimen previsional',
          'AFP',
          'Moneda Cuenta 2',
          'Valor Cuenta 2',
          'Salud',
          'Moneda plan',
          'Valor plan',
          'Adicional AUGE/GES',
          'Tiene APV',
          'Institucion APV',
          'Moneda APV',
          'Monto APV',
          'Forma pago APV',
          'Deposito convenido APVI',
        ];
      case 'afp':
        return ['AFP', 'Moneda Cuenta 2', 'Valor Cuenta 2'];
      case 'ips':
        return ['Nombre Ex-Caja', 'Regimen Ex-Caja', 'Tasa Ex-Caja'];
      case 'salud':
        return ['Salud', 'Moneda plan', 'Valor plan', 'Adicional AUGE/GES'];
      case 'apvi':
        return [
          'Tiene APV',
          'Institucion APV',
          'Moneda APV',
          'Monto APV',
          'Forma pago APV',
          'Deposito convenido APVI',
        ];
      case 'cuenta':
        return ['Banco', 'Tipo de cuenta', 'Numero de cuenta'];
      case 'condiciones-especiales':
        return ['Condiciones especiales'];
      default:
        return [];
    }
  }

  private async cargarPerfilLaboral(idPersona: number, periodoYm: string): Promise<void> {
    if (!/^\d{4}-\d{2}$/.test(periodoYm)) {
      this.perfilLaboralRpc.set(null);
      return;
    }

    this.perfilLaboralCargando.set(true);
    this.perfilLaboralError.set(null);

    try {
      const perfil = await this.empleadosService.obtenerPerfilLaboralPersona(idPersona, periodoYm);
      this.perfilLaboralRpc.set(perfil);
    } catch {
      this.perfilLaboralError.set(
        'No fue posible cargar el perfil laboral del período activo.',
      );
      this.perfilLaboralRpc.set(null);
    } finally {
      this.perfilLaboralCargando.set(false);
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




  private buildPayloadForSave(): CrearEmpleadoPayload {
    const raw = this.form.getRawValue();
    const tipoPrevision = raw.previsionSalud.tipoRegimenPrevisional ?? 'NINGUNA';
    const requiereSalud = tipoPrevision !== 'NINGUNA';
    const tipoSalud = requiereSalud
      ? this.resolveTipoSalud(raw.previsionSalud.idSalud)
      : null;
    const esFonasa = tipoSalud === 'FONASA';
    const tieneCuenta2 =
      tipoPrevision === 'AFP' &&
      (raw.previsionSalud.idMonedaCuenta2 !== null || raw.previsionSalud.valorCuenta2 !== null);
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
      relacionLaboral: raw.contrato.relacionLaboral,
      cargo: raw.contrato.cargo,
      fechaContrato: raw.contrato.fechaContrato || raw.contrato.fechaIngreso,
      tipoContrato: raw.contrato.tipoContrato ?? 'INDEFINIDO',
      idTipoTrabajador: raw.contrato.idTipoTrabajador ?? 0,
      idTipoJornada: raw.contrato.idTipoJornada ?? 0,
      seguroCesantia: raw.contrato.seguroCesantia,
      excluidoLimiteJornada: raw.contrato.excluidoLimiteJornada,
      causalExclusionJornada: raw.contrato.excluidoLimiteJornada
        ? raw.contrato.causalExclusionJornada
        : null,
      justificacionExclusionJornada: raw.contrato.excluidoLimiteJornada
        ? raw.contrato.justificacionExclusionJornada.trim() || null
        : null,
      casaParticularModalidad: raw.contrato.tipoContrato === 'CASA_PARTICULAR'
        ? raw.contrato.casaParticularModalidad
        : null,
      casaParticularLabores: raw.contrato.tipoContrato === 'CASA_PARTICULAR'
        ? raw.contrato.casaParticularLabores.trim() || null
        : null,
      casaParticularDomicilioEspecifico: raw.contrato.tipoContrato === 'CASA_PARTICULAR'
        ? raw.contrato.casaParticularDomicilioEspecifico.trim() || null
        : null,
      casaParticularAsistenciaCuidado: raw.contrato.tipoContrato === 'CASA_PARTICULAR'
        ? raw.contrato.casaParticularAsistenciaCuidado
        : false,
      casaParticularRegistroDtEstado: raw.contrato.tipoContrato === 'CASA_PARTICULAR'
        ? raw.contrato.casaParticularRegistroDtEstado
        : null,
      casaParticularRegistroDtFecha:
        raw.contrato.tipoContrato === 'CASA_PARTICULAR' &&
        raw.contrato.casaParticularRegistroDtEstado === 'REGISTRADO'
          ? raw.contrato.casaParticularRegistroDtFecha || null
          : null,
      casaParticularRegistroDtFolio:
        raw.contrato.tipoContrato === 'CASA_PARTICULAR' &&
        raw.contrato.casaParticularRegistroDtEstado === 'REGISTRADO'
          ? raw.contrato.casaParticularRegistroDtFolio.trim() || null
          : null,
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
      condicionesTrabajador: mapCondicionesTrabajadorFromFormValue(raw),
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
      tipoSalud,
      idMonedaPlan: requiereSalud ? raw.previsionSalud.idMonedaPlan : null,
      valorPlan: requiereSalud ? (esFonasa ? 0 : raw.previsionSalud.valorPlan) : null,
      adicionalAugeGes: requiereSalud
        ? esFonasa
          ? 0
          : raw.previsionSalud.adicionalAugeGes
        : null,
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

  private resolveTipoSalud(idSalud: number | null): 'FONASA' | 'ISAPRE' | string | null {
    const option = this.catalogos().entidadesSalud.find((item) => item.value === idSalud);
    const normalized = this.normalizeText(`${option?.tipo ?? ''} ${option?.label ?? ''}`);

    if (normalized.includes('fonasa')) {
      return 'FONASA';
    }

    if (normalized.includes('isapre')) {
      return 'ISAPRE';
    }

    return option?.tipo ?? null;
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



