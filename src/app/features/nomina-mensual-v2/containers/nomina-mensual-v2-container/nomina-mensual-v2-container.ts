import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import { ShellPageContextService } from '../../../../layout/shell-page-context.service';
import {
  approvalMetrics,
  approvalTimeline,
  calculationMetrics,
  calculationRows,
  employeeChecklist,
  employeeMetrics,
  employeeRows,
  movementMetrics,
  movementRows,
  parameterCards,
  parameterMetrics,
  payrollSteps,
  payslipMetrics,
  payslipRows,
  validationMetrics,
  validationRows,
} from '../../data/nomina-mensual-v2.mock';
import type { ChecklistStatus, PayrollStepId, PayrollStepStatus, StatusTone } from '../../models/nomina-mensual-v2.models';
import type {
  NominaParametrosResumen,
  ParametroBloqueoSeveridad,
  ParametroResumenAreaId,
  ParametroResumenItem,
  ParametroResumenEstado,
  ParametroResumenItemEstado,
  ParametrosMantenedorDestino,
} from '../../models/nomina-parametros-resumen.models';
import { MessageBoxComponent } from '../../../../shared/components/ui/feedback/message-box/message-box.component';
import type { MessageBoxSection } from '../../../../shared/components/ui/message-box.types';
import {
  DataGridCellDirective,
  DataGridComponent,
} from '../../../../shared/components/ui/data-grid';
import { NominaParametrosResumenService } from '../../services/nomina-parametros-resumen.service';
import {
  COLUMNAS_GRILLA_EMPLEADOS_NOMINA,
  claseBadgeContrato,
  claseBadgeDatosBancarios,
  claseBadgeEstadoNomina,
  crearFiltrosGrillaEmpleadosNomina,
  mapearFilasEmpleadosNomina,
  type FilaEmpleadoNomina,
} from '../../presenters/nomina-empleados-grid.presenter';

const stepOrder: PayrollStepId[] = ['parameters', 'employees', 'movements', 'calculation', 'validation', 'approval', 'payslips'];

type DonutTonoPresentacion = 'exito' | 'revision' | 'bloqueo' | 'neutral';

type EstadoPasoParametro = 'completo' | 'revision' | 'faltante' | 'bloqueado' | 'pendiente';

type ParametrosCargaOverlayPresentacion = {
  titulo: string;
  mensaje: string;
};

type ResultadoValidacionPaso = 'permitido' | 'advertencia' | 'bloqueado';

interface EstadoPendientesPasoParametros {
  tieneBloqueos: boolean;
  tieneRevisiones: boolean;
  puedeContinuar: boolean;
  resultado: ResultadoValidacionPaso;
}

type ModalAvanceParametros =
  | { tipo: 'bloqueo' }
  | { tipo: 'revision'; destinoPaso: PayrollStepId };

const SECCIONES_MSG_BOX_BLOQUEO_PARAMETROS: MessageBoxSection[] = [
  {
    title: 'Qué revisar',
    text: 'Revisa los bloqueos o pendientes marcados en Parámetros.',
    tone: 'attention',
  },
];

const SECCIONES_MSG_BOX_REVISION_PARAMETROS: MessageBoxSection[] = [
  {
    title: 'Por qué importa',
    text: 'Se detectaron observaciones que conviene revisar antes de avanzar.',
    tone: 'attention',
  },
];

const coloresDonutPorTono: Record<DonutTonoPresentacion, string> = {
  exito: '#3d6b4f',
  revision: '#d97706',
  bloqueo: '#9a5555',
  neutral: '#64748b',
};

@Component({
  selector: 'app-nomina-mensual-v2-container',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, MessageBoxComponent, DataGridComponent, DataGridCellDirective],
  templateUrl: './nomina-mensual-v2-container.html',
  styleUrl: './nomina-mensual-v2-container.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NominaMensualV2Container implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly shellContext = inject(ShellPageContextService);
  private readonly parametrosResumenService = inject(NominaParametrosResumenService);

  readonly steps = payrollSteps;
  readonly currentStep = signal<PayrollStepId>('parameters');
  readonly parametrosResumen = signal<NominaParametrosResumen | null>(null);
  readonly parametrosLoading = signal(true);
  readonly parametrosValidando = signal(false);
  readonly parametrosError = signal<string | null>(null);
  readonly parametrosAreas = computed(() => this.parametrosResumen()?.areas ?? []);
  readonly parametrosBloqueosActuales = computed(() => this.parametrosResumen()?.bloqueosActuales ?? []);
  readonly parametrosAccesos = computed(() => this.parametrosResumen()?.accesos ?? []);

  readonly modalAvanceParametros = signal<ModalAvanceParametros | null>(null);

  readonly seccionesMsgBoxBloqueoParametros = SECCIONES_MSG_BOX_BLOQUEO_PARAMETROS;
  readonly seccionesMsgBoxRevisionParametros = SECCIONES_MSG_BOX_REVISION_PARAMETROS;

  readonly ayudaAvanceParametros = computed(() => {
    if (this.currentStep() !== 'parameters') return null;
    if (this.parametrosLoading() || this.parametrosValidando()) return null;
    const resumen = this.parametrosResumen();
    if (!resumen) return null;
    if (resumen.bloqueos > 0) {
      return 'Debes completar este paso antes de continuar al siguiente.';
    }
    if (resumen.requiereRevision > 0) {
      return 'Hay observaciones pendientes. Revísalas antes de continuar.';
    }
    return null;
  });

  readonly tonoAyudaAvanceParametros = computed((): 'bloqueo' | 'revision' | null => {
    if (this.currentStep() !== 'parameters') return null;
    if (this.parametrosLoading() || this.parametrosValidando()) return null;
    const resumen = this.parametrosResumen();
    if (!resumen) return null;
    if (resumen.bloqueos > 0) return 'bloqueo';
    if (resumen.requiereRevision > 0) return 'revision';
    return null;
  });

  readonly parametrosCargaOverlay = computed((): ParametrosCargaOverlayPresentacion | null => {
    if (this.currentStep() !== 'parameters') return null;
    if (this.parametrosLoading()) {
      return {
        titulo: 'Cargando parámetros',
        mensaje: 'Consultando la configuración normativa y operativa del período.',
      };
    }
    if (this.parametrosValidando()) {
      return {
        titulo: 'Validando parámetros',
        mensaje: 'Revisando bloqueos y consistencia antes de continuar.',
      };
    }
    return null;
  });

  /** Presentación: tipo de franja superior en paso Parámetros (null = oculta). */
  readonly parametrosAlertaTipo = computed((): 'error' | 'bloqueo' | 'revision' | null => {
    if (this.parametrosLoading()) return null;
    if (this.parametrosError()) return 'error';
    const resumen = this.parametrosResumen();
    if (!resumen) return null;
    if (resumen.bloqueos > 0) return 'bloqueo';
    if (resumen.requiereRevision > 0) return 'revision';
    return null;
  });

  readonly alertaRevisionTitulo = computed(() => {
    const cantidad = this.parametrosResumen()?.requiereRevision ?? 0;
    const etiquetaItem = cantidad === 1 ? 'ítem' : 'ítems';
    const etiquetaVerbo = cantidad === 1 ? 'requiere' : 'requieren';
    return `Hay ${cantidad} ${etiquetaItem} que ${etiquetaVerbo} revisión`;
  });

  readonly alertaRevisionDescripcion = computed(() => {
    const cantidad = this.parametrosResumen()?.requiereRevision ?? 0;
    const etiquetaAccion = cantidad === 1 ? 'Corrígelo' : 'Corrígelos';
    return `${etiquetaAccion} en Parámetros antes de validar.`;
  });

  readonly alertaBloqueoTitulo = computed(() => {
    const cantidad = this.parametrosResumen()?.bloqueos ?? 0;
    const etiquetaItem = cantidad === 1
      ? 'parámetro obligatorio pendiente'
      : 'parámetros obligatorios pendientes';
    return `Hay ${cantidad} ${etiquetaItem}`;
  });

  readonly alertaBloqueoDescripcion = computed(() => {
    const cantidad = this.parametrosResumen()?.bloqueos ?? 0;
    const etiquetaAccion = cantidad === 1 ? 'Corrígelo' : 'Corrígelos';
    return `${etiquetaAccion} antes de continuar.`;
  });

  readonly tituloEstadoParametros = computed(() => {
    const resumen = this.parametrosResumen();
    if ((resumen?.bloqueos ?? 0) > 0) {
      return 'Bloqueos actuales';
    }
    if ((resumen?.requiereRevision ?? 0) > 0) {
      return 'Revisiones pendientes';
    }
    return 'Estado actual';
  });

  readonly parametrosEstadoCompleto = computed(() => {
    if (this.parametrosLoading() || this.parametrosValidando()) return false;
    const resumen = this.parametrosResumen();
    if (!resumen) return false;
    return resumen.bloqueos === 0 && resumen.requiereRevision === 0;
  });

  readonly donutTono = computed((): DonutTonoPresentacion => {
    if (this.parametrosLoading()) return 'neutral';
    const resumen = this.parametrosResumen();
    if (!resumen) return 'neutral';
    if (resumen.bloqueos > 0) return 'bloqueo';
    if (resumen.requiereRevision > 0) return 'revision';
    return 'exito';
  });

  /** Porcentaje ítems OK / total (no usar resumen.completitud, es ponderado). */
  readonly completitudItemsPct = computed(() => {
    const resumen = this.parametrosResumen();
    if (!resumen || resumen.totalParametros === 0) return 0;
    return Math.round((resumen.parametrosConfigurados / resumen.totalParametros) * 100);
  });

  readonly completitudItemsCaption = computed(() => {
    const resumen = this.parametrosResumen();
    if (!resumen) return '0 de 0 listos';
    return `${resumen.parametrosConfigurados} de ${resumen.totalParametros} listos`;
  });

  readonly estiloArcoDonut = computed(() => {
    const porcentaje = this.completitudItemsPct();
    const color = coloresDonutPorTono[this.donutTono()];
    return `conic-gradient(${color} 0 ${porcentaje}%, #e2e8f0 ${porcentaje}% 100%)`;
  });

  readonly prepValidacionClase = computed(() => this.prepClaseEstadoPaso(this.prepValidacionEstadoPaso()));

  readonly prepValidacionIcono = computed(() => {
    if (this.parametrosValidando()) return 'clock-3';
    return this.prepIconoEstadoPaso(this.prepValidacionEstadoPaso());
  });

  readonly prepValidacionEtiqueta = computed(() => {
    if (this.parametrosValidando()) return 'Validando…';
    return this.prepEtiquetaEstadoPaso(this.prepValidacionEstadoPaso());
  });

  readonly parameterCards = parameterCards;
  readonly parameterMetrics = parameterMetrics;
  readonly employeeMetrics = employeeMetrics;
  readonly employeeChecklist = employeeChecklist;

  readonly columnasGrillaEmpleados = COLUMNAS_GRILLA_EMPLEADOS_NOMINA;
  readonly filtrosGrillaEmpleados = crearFiltrosGrillaEmpleadosNomina(mapearFilasEmpleadosNomina(employeeRows));
  readonly filasEmpleadosNomina = signal<FilaEmpleadoNomina[]>(mapearFilasEmpleadosNomina(employeeRows));
  readonly empleadosCargando = signal(false);
  readonly empleadosError = signal('');
  readonly empleadoAccionMenuAbierto = signal<string | null>(null);
  readonly movementMetrics = movementMetrics;
  readonly movementRows = movementRows;
  readonly calculationMetrics = calculationMetrics;
  readonly calculationRows = calculationRows;
  readonly validationMetrics = validationMetrics;
  readonly validationRows = validationRows;
  readonly approvalMetrics = approvalMetrics;
  readonly approvalTimeline = approvalTimeline;
  readonly payslipMetrics = payslipMetrics;
  readonly payslipRows = payslipRows;

  readonly pageTitle = computed(() => {
    switch (this.currentStep()) {
      case 'parameters': return 'Parámetros de nómina';
      case 'employees': return 'Empleados para nómina';
      case 'movements': return 'Novedades del período';
      case 'calculation': return 'Cálculo de prenómina';
      case 'validation': return 'Validación de prenómina';
      case 'approval': return 'Aprobación de nómina';
      case 'payslips': return 'Liquidaciones generadas';
    }
  });

  readonly pageSubtitle = computed(() => {
    switch (this.currentStep()) {
      case 'parameters': return 'Verifica la configuración normativa y operativa requerida para calcular Mayo 2026.';
      case 'employees': return 'La base de la nómina se construye desde los trabajadores activos en el período seleccionado.';
      case 'movements': return 'Registra los eventos del mes que afectan la remuneración de los trabajadores.';
      case 'calculation': return 'Revisa el cálculo preliminar y guarda el snapshot antes de validar.';
      case 'validation': return 'El sistema verifica consistencia, bloqueos, advertencias y trazabilidad antes de aprobar.';
      case 'approval': return 'La nómina validada puede ser autorizada y bloqueada para el período Mayo 2026.';
      case 'payslips': return 'La nómina fue aprobada y las liquidaciones están listas para distribución.';
    }
  });

  readonly primaryActionLabel = computed(() => {
    switch (this.currentStep()) {
      case 'parameters': return 'Validar parámetros';
      case 'employees': return 'Continuar a novedades';
      case 'movements': return 'Continuar a cálculo';
      case 'calculation': return 'Procesar nómina';
      case 'validation': return 'Validar prenómina';
      case 'approval': return 'Aprobar nómina';
      case 'payslips': return 'Enviar por correo';
    }
  });

  ngOnInit(): void {
    this.shellContext.setBindingActive(true);
    this.syncShellContext();
    void this.cargarParametrosResumen();
  }

  ngOnDestroy(): void {
    this.shellContext.setBindingActive(false);
    this.shellContext.clearContext();
  }

  intentarIrAPaso(destinoPaso: PayrollStepId): void {
    if (destinoPaso === this.currentStep()) return;
    if (this.currentStep() === 'parameters' && this.esAvanceHaciaAdelante(destinoPaso)) {
      this.evaluarAvanceDesdeParametros(destinoPaso);
      return;
    }
    this.irAPaso(destinoPaso);
  }

  cerrarModalAvanceParametros(): void {
    this.modalAvanceParametros.set(null);
  }

  confirmarAvanceConRevision(): void {
    const modal = this.modalAvanceParametros();
    if (modal?.tipo !== 'revision') return;
    this.irAPaso(modal.destinoPaso);
  }

  irAPendientesParametros(): void {
    this.cerrarModalAvanceParametros();
    if (this.currentStep() !== 'parameters') return;
    queueMicrotask(() => {
      document.getElementById('parametros-pendientes-sidebar')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  nextStep(): void {
    const index = stepOrder.indexOf(this.currentStep());
    if (index < stepOrder.length - 1) {
      this.intentarIrAPaso(stepOrder[index + 1]);
    }
  }

  previousStep(): void {
    const index = stepOrder.indexOf(this.currentStep());
    if (index > 0) {
      this.currentStep.set(stepOrder[index - 1]);
      this.syncShellContext();
    }
  }

  stepStatus(stepId: PayrollStepId): PayrollStepStatus {
    const currentIndex = stepOrder.indexOf(this.currentStep());
    const stepIndex = stepOrder.indexOf(stepId);
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  }

  toneClass(tone: StatusTone): string {
    return `tone-${tone}`;
  }

  checklistClass(status: ChecklistStatus): string {
    return `status-${status}`;
  }

  initials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  }

  inicialesEmpleado(nombre: string): string {
    return this.initials(nombre);
  }

  trackFilaEmpleadoNomina = (_index: number, fila: FilaEmpleadoNomina): string => fila.id;

  claseBadgeEstadoNomina = claseBadgeEstadoNomina;
  claseBadgeDatosBancarios = claseBadgeDatosBancarios;
  claseBadgeContrato = claseBadgeContrato;

  async recargarGrillaEmpleados(): Promise<void> {
    this.empleadosCargando.set(true);
    this.empleadosError.set('');
    try {
      await new Promise((resolve) => setTimeout(resolve, 320));
      this.filasEmpleadosNomina.set(mapearFilasEmpleadosNomina(employeeRows));
    } catch {
      this.empleadosError.set('No fue posible cargar el listado de empleados.');
    } finally {
      this.empleadosCargando.set(false);
    }
  }

  toggleMenuAccionEmpleado(filaId: string, event: Event): void {
    event.stopPropagation();
    this.empleadoAccionMenuAbierto.update((actual) => (actual === filaId ? null : filaId));
  }

  cerrarMenuAccionEmpleado(): void {
    this.empleadoAccionMenuAbierto.set(null);
  }

  revisarEmpleadoNomina(_fila: FilaEmpleadoNomina): void {
    this.cerrarMenuAccionEmpleado();
  }


  stepIcon(stepId: PayrollStepId): string {
    switch (stepId) {
      case 'parameters': return 'settings-2';
      case 'employees': return 'users';
      case 'movements': return 'list-plus';
      case 'calculation': return 'calculator';
      case 'validation': return 'shield-check';
      case 'approval': return 'badge-check';
      case 'payslips': return 'file-check-2';
    }
  }

  parameterIcon(title: string): string {
    const normalizedTitle = title.toLowerCase();
    if (normalizedTitle.includes('empresa')) return 'building-2';
    if (normalizedTitle.includes('uf') || normalizedTitle.includes('utm') || normalizedTitle.includes('ipc')) return 'trending-up';
    if (normalizedTitle.includes('topes')) return 'landmark';
    if (normalizedTitle.includes('afp') || normalizedTitle.includes('salud')) return 'heart-pulse';
    if (normalizedTitle.includes('caja')) return 'hand-coins';
    if (normalizedTitle.includes('mutuales')) return 'shield';
    if (normalizedTitle.includes('centros')) return 'git-branch';
    if (normalizedTitle.includes('jornadas')) return 'clock-3';
    if (normalizedTitle.includes('haberes')) return 'circle-plus';
    if (normalizedTitle.includes('descuentos')) return 'circle-minus';
    return 'settings-2';
  }

  metricIcon(metricId: string): string {
    if (metricId.includes('worker') || metricId.includes('workers') || metricId.includes('active') || metricId.includes('employees') || metricId.includes('processed')) return 'users';
    if (metricId.includes('contract')) return 'file-text';
    if (metricId.includes('bank')) return 'landmark';
    if (metricId.includes('document')) return 'folder-open';
    if (metricId.includes('earning')) return 'circle-dollar-sign';
    if (metricId.includes('deduction')) return 'minus-circle';
    if (metricId.includes('license')) return 'calendar';
    if (metricId.includes('recurring')) return 'repeat-2';
    if (metricId.includes('hash')) return 'fingerprint';
    if (metricId.includes('blocker')) return 'octagon-x';
    if (metricId.includes('warning')) return 'triangle-alert';
    if (metricId.includes('net')) return 'wallet';
    if (metricId.includes('sent')) return 'send';
    if (metricId.includes('pending')) return 'clock-3';
    if (metricId.includes('signature')) return 'file-check-2';
    if (metricId.includes('period')) return 'calendar-days';
    if (metricId.includes('state')) return 'badge-check';
    if (metricId.includes('issued')) return 'file-check-2';
    if (metricId.includes('rules')) return 'shield-check';
    return 'activity';
  }

  statusIcon(tone: StatusTone): string {
    switch (tone) {
      case 'green': return 'check-circle-2';
      case 'amber': return 'triangle-alert';
      case 'red': return 'circle-alert';
      case 'blue': return 'info';
      case 'purple': return 'sparkles';
      case 'gray': return 'circle';
    }
  }

  checklistIcon(status: ChecklistStatus): string {
    switch (status) {
      case 'success': return 'check-circle-2';
      case 'warning': return 'triangle-alert';
      case 'error': return 'circle-alert';
      case 'pending': return 'clock-3';
    }
  }


  async cargarParametrosResumen(): Promise<void> {
    this.parametrosLoading.set(true);
    this.parametrosError.set(null);
    try {
      const resumen = await this.parametrosResumenService.obtenerResumen();
      this.parametrosResumen.set(resumen);
      this.syncShellContext();
    } catch (error) {
      console.error('[Nómina V2] Error cargando parámetros', error);
      this.parametrosError.set('No fue posible cargar el resumen de parámetros.');
    } finally {
      this.parametrosLoading.set(false);
    }
  }

  async validarParametros(): Promise<void> {
    this.parametrosValidando.set(true);
    this.parametrosError.set(null);
    try {
      const resumen = await this.parametrosResumenService.obtenerResumen();
      this.parametrosResumen.set(resumen);
      this.syncShellContext();
      const indiceActual = stepOrder.indexOf('parameters');
      const destino = indiceActual < stepOrder.length - 1 ? stepOrder[indiceActual + 1] : null;
      if (destino) {
        this.evaluarAvanceDesdeParametros(destino);
      }
    } catch (error) {
      console.error('[Nómina V2] Error validando parámetros', error);
      this.parametrosError.set('No fue posible validar los parámetros.');
    } finally {
      this.parametrosValidando.set(false);
      this.syncShellContext();
    }
  }

  goToParametros(destino: ParametrosMantenedorDestino): void {
    void this.router.navigate(['/parametros'], {
      queryParams: {
        periodo: this.parametrosResumen()?.periodo,
        area: destino.area,
        tab: destino.tab,
      },
    });
  }

  parametroEstadoEtiqueta(estado: ParametroResumenEstado): string {
    switch (estado) {
      case 'completo': return 'Completo';
      case 'requiereRevision': return 'Requiere revisión';
      case 'bloqueo': return 'Bloqueo';
      case 'pendiente': return 'Pendiente';
    }
  }

  parametroEstadoIcono(estado: ParametroResumenEstado): string {
    switch (estado) {
      case 'completo': return 'check-circle-2';
      case 'requiereRevision': return 'triangle-alert';
      case 'bloqueo': return 'circle-alert';
      case 'pendiente': return 'clock-3';
    }
  }

  parametroEstadoClase(estado: ParametroResumenEstado): string {
    switch (estado) {
      case 'completo': return 'status-green';
      case 'requiereRevision': return 'status-amber';
      case 'bloqueo': return 'status-red';
      case 'pendiente': return 'status-gray';
    }
  }

  parametroPrepClase(estado: ParametroResumenEstado): string {
    return this.prepClaseEstadoPaso(this.parametroEstadoPaso(estado));
  }

  parametroPrepIcono(estado: ParametroResumenEstado): string {
    return this.prepIconoEstadoPaso(this.parametroEstadoPaso(estado));
  }

  parametroPrepEtiqueta(estado: ParametroResumenEstado): string {
    return this.prepEtiquetaEstadoPaso(this.parametroEstadoPaso(estado));
  }

  parametroPrepConectorClase(estado: ParametroResumenEstado): string {
    return this.prepConectorClaseEstadoPaso(this.parametroEstadoPaso(estado));
  }

  prepValidacionEstadoPaso(): EstadoPasoParametro {
    if (this.parametrosValidando() || this.parametrosLoading()) return 'pendiente';
    const resumen = this.parametrosResumen();
    if (!resumen) return 'pendiente';
    if (resumen.bloqueos > 0) return 'bloqueado';
    if (resumen.requiereRevision > 0) return 'revision';
    return 'completo';
  }

  private parametroEstadoPaso(estado: ParametroResumenEstado): EstadoPasoParametro {
    switch (estado) {
      case 'completo':
        return 'completo';
      case 'requiereRevision':
        return 'revision';
      case 'bloqueo':
        return 'bloqueado';
      case 'pendiente':
        return 'faltante';
    }
  }

  private prepClaseEstadoPaso(estado: EstadoPasoParametro): string {
    return `prep-item--${estado}`;
  }

  private prepEtiquetaEstadoPaso(estado: EstadoPasoParametro): string {
    switch (estado) {
      case 'completo':
        return 'Completo';
      case 'revision':
        return 'Requiere revisión';
      case 'faltante':
        return 'Faltan datos';
      case 'bloqueado':
        return 'Bloqueado';
      case 'pendiente':
        return 'Pendiente';
    }
  }

  private prepIconoEstadoPaso(estado: EstadoPasoParametro): string {
    switch (estado) {
      case 'completo':
        return 'check-circle-2';
      case 'revision':
        return 'triangle-alert';
      case 'faltante':
        return 'circle-alert';
      case 'bloqueado':
        return 'octagon-x';
      case 'pendiente':
        return 'clock-3';
    }
  }

  private prepConectorClaseEstadoPaso(estado: EstadoPasoParametro): string {
    return `prep-connector--${estado}`;
  }

  parametroItemEstadoClase(estado: ParametroResumenItemEstado): string {
    switch (estado) {
      case 'ok': return 'ok';
      case 'revisar': return 'warn';
      case 'bloqueo': return 'bad';
      case 'pendiente': return 'muted';
    }
  }

  parametroItemEstadoEtiqueta(estado: ParametroResumenItemEstado): string {
    switch (estado) {
      case 'ok': return 'OK';
      case 'revisar': return 'Revisar';
      case 'bloqueo': return 'Bloqueo';
      case 'pendiente': return 'Pendiente';
    }
  }

  bloqueoSeveridadClase(severidad: ParametroBloqueoSeveridad): string {
    return severidad === 'bloqueo' ? 'status-red' : 'status-amber';
  }

  bloqueoSeveridadIcono(severidad: ParametroBloqueoSeveridad): string {
    return severidad === 'bloqueo' ? 'circle-alert' : 'triangle-alert';
  }

  bloqueoSeveridadEtiqueta(severidad: ParametroBloqueoSeveridad): string {
    return severidad === 'bloqueo' ? 'Bloqueo crítico' : 'Revisión requerida';
  }

  formatoHoraActualizacion(value: string | null | undefined): string {
    if (!value) return 'Sin registro';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return `hoy, ${date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}`;
  }

  parametroAreaTitulo(areaId: ParametroResumenAreaId): string {
    return this.parametrosAreas().find((area) => area.id === areaId)?.titulo ?? areaId;
  }

  chipsVisiblesParametro(items: ParametroResumenItem[]): ParametroResumenItem[] {
    return items.slice(0, 5);
  }

  cantidadChipsOcultosParametro(items: ParametroResumenItem[]): number {
    return Math.max(items.length - 5, 0);
  }

  private syncShellContext(): void {
    const currentIndex = stepOrder.indexOf(this.currentStep());
    const isValidationBlocked = this.currentStep() === 'validation';

    this.shellContext.setContext({
      breadcrumbs: [
        { label: 'Nómina', path: '/remuneraciones/proceso-mensual' },
        { label: this.currentStep() === 'parameters' ? 'Parámetros' : this.pageTitle() },
      ],
      statusChip: { label: `Paso ${currentIndex + 1} de ${stepOrder.length}`, tone: isValidationBlocked ? 'warning' : 'neutral' },
      primaryAction: {
        label: this.currentStep() === 'parameters' && this.parametrosValidando() ? 'Validando...' : this.primaryActionLabel(),
        disabled: isValidationBlocked || this.parametrosValidando() || this.parametrosLoading(),
        loading: this.currentStep() === 'parameters' ? this.parametrosValidando() : false,
        actionId: `nomina-mensual-v2-${this.currentStep()}`,
      },
    });

    this.shellContext.registerPrimaryActionHandler(() => {
      if (this.currentStep() === 'parameters') {
        void this.validarParametros();
        return;
      }
      if (this.currentStep() === 'validation') return;
      if (this.currentStep() === 'payslips') return;
      this.nextStep();
    });
  }

  goLegacy(): void {
    void this.router.navigate(['/remuneraciones/proceso-mensual']);
  }

  private irAPaso(destinoPaso: PayrollStepId): void {
    this.modalAvanceParametros.set(null);
    this.currentStep.set(destinoPaso);
    this.syncShellContext();
  }

  private esAvanceHaciaAdelante(destinoPaso: PayrollStepId): boolean {
    return stepOrder.indexOf(destinoPaso) > stepOrder.indexOf(this.currentStep());
  }

  private obtenerEstadoPendientesPasoParametros(): EstadoPendientesPasoParametros {
    const resumen = this.parametrosResumen();
    const tieneBloqueos = (resumen?.bloqueos ?? 0) > 0;
    const tieneRevisiones = (resumen?.requiereRevision ?? 0) > 0;
    const puedeContinuar = resumen?.puedeContinuar ?? false;
    let resultado: ResultadoValidacionPaso = 'permitido';
    if (tieneBloqueos) {
      resultado = 'bloqueado';
    } else if (tieneRevisiones && !puedeContinuar) {
      resultado = 'bloqueado';
    } else if (tieneRevisiones) {
      resultado = 'advertencia';
    }
    return { tieneBloqueos, tieneRevisiones, puedeContinuar, resultado };
  }

  private evaluarAvanceDesdeParametros(destinoPaso: PayrollStepId): void {
    const estado = this.obtenerEstadoPendientesPasoParametros();
    if (estado.resultado === 'bloqueado') {
      this.modalAvanceParametros.set({ tipo: 'bloqueo' });
      return;
    }
    if (estado.resultado === 'advertencia') {
      this.modalAvanceParametros.set({ tipo: 'revision', destinoPaso });
      return;
    }
    this.irAPaso(destinoPaso);
  }
}
