import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  Output,
  ViewChild,
  inject,
} from '@angular/core';
import { Router, NavigationStart, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import {
  ArrowRight,
  Eye,
  LoaderCircle,
  MoreVertical,
  Plus,
  PowerOff,
} from 'lucide-angular/src/icons';

import { EmpleadoEstado, EmpleadoListado } from '../../models/empleado-listado.model';
import {
  DataGridCellDirective,
  DataGridBulkActionEvent,
  DataGridBulkActionResult,
  DataGridComponent,
  DataGridExportEvent,
  DataGridPrimaryActionMenuDirective,
} from '../../../../shared/components/ui/data-grid';
import {
  capitalizarTextoEmpleado,
  crearAccionesMasivasEstadoEmpleado,
  crearColumnasGridTablaEmpleados,
  crearFiltrosGridTablaEmpleados,
  etiquetaEstadoEmpleado,
  formatearFechaIngresoListado,
} from '../../utils/tabla-empleados-listado.presenter';

@Component({
  selector: 'app-tabla-empleados',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    LucideAngularModule,
    DataGridCellDirective,
    DataGridPrimaryActionMenuDirective,
    DataGridComponent,
  ],
  templateUrl: './tabla-empleados.html',
  styleUrl: './tabla-empleados.css',
})
export class TablaEmpleadosComponent implements OnDestroy {
  private readonly router = inject(Router);

  @Input() empleados: EmpleadoListado[] = [];
  @Input() maxItems = 10;
  @Input() loading = false;
  @Input() mensajeError = '';
  @Input() bulkActionLoading = false;
  @Input() bulkActionResult: DataGridBulkActionResult<EmpleadoListado> | null = null;
  @Input() destinoNavegacionCreacion: 'basico' | 'avanzado' | null = null;
  @Output() readonly refresh = new EventEmitter<void>();
  @Output() readonly bulkAction = new EventEmitter<DataGridBulkActionEvent<EmpleadoListado>>();
  @Output() readonly createBasico = new EventEmitter<void>();
  @Output() readonly createAvanzado = new EventEmitter<void>();

  readonly eyeIcon = Eye;
  readonly loaderIcon = LoaderCircle;
  readonly moreIcon = MoreVertical;
  readonly plusIcon = Plus;
  readonly powerOffIcon = PowerOff;
  readonly rowActionIcon = ArrowRight;
  openActionMenuId: number | null = null;
  actionMenuPosition: { top: number; left: number } | null = null;
  crearMenuAbierto = false;

  private gridScrollListenerTarget: HTMLElement | null = null;
  private readonly onGridScrollClose = (): void => this.closeActionMenu();

  @ViewChild(DataGridComponent)
  private readonly dataGrid?: DataGridComponent<EmpleadoListado>;

  readonly pageSizeOptions = [10, 20, 30, 50];

  readonly bulkStateActions = crearAccionesMasivasEstadoEmpleado();
  readonly columns = crearColumnasGridTablaEmpleados();
  readonly filters = crearFiltrosGridTablaEmpleados();

  @HostListener('document:click', ['$event'])
  closeActionMenuOnOutsideClick(event: MouseEvent): void {
    const target = event.target;

    if (target instanceof Element && target.closest('[data-employee-action-menu]')) {
      return;
    }

    this.closeActionMenu();
  }

  @HostListener('document:click', ['$event'])
  closeCrearMenuOnOutsideClick(event: MouseEvent): void {
    const target = event.target;

    if (target instanceof Element && target.closest('[data-empleados-create-menu], [data-grid-primary-action-root]')) {
      return;
    }

    this.crearMenuAbierto = false;
  }

  @HostListener('document:keydown.escape')
  closeMenusOnEscape(): void {
    this.crearMenuAbierto = false;
    this.closeActionMenu();
  }

  @HostListener('window:resize')
  closeActionMenuOnResize(): void {
    if (this.openActionMenuId !== null) {
      this.closeActionMenu();
    }
  }

  constructor() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.crearMenuAbierto = false;
        this.closeActionMenu();
      }
    });
  }

  ngOnDestroy(): void {
    this.unbindGridScrollCloseListener();
  }

  trackByEmpleadoId(_index: number, empleado: EmpleadoListado): number {
    return empleado.id;
  }

  toggleCrearMenu(): void {
    if (this.destinoNavegacionCreacion) {
      return;
    }
    this.crearMenuAbierto = !this.crearMenuAbierto;
  }

  onCrearBasico(): void {
    if (this.destinoNavegacionCreacion) {
      return;
    }
    this.crearMenuAbierto = false;
    this.createBasico.emit();
  }

  onCrearAvanzado(): void {
    if (this.destinoNavegacionCreacion) {
      return;
    }
    this.crearMenuAbierto = false;
    this.createAvanzado.emit();
  }

  toggleFiltros(): void {
    if (!this.dataGrid) {
      return;
    }

    this.dataGrid.showFilters = !this.dataGrid.showFilters;
  }

  exportarListado(): void {
    this.dataGrid?.exportFilteredRows();
  }

  exportEmpleados(event: DataGridExportEvent<EmpleadoListado>): void {
    const exportColumns = event.columns.filter((column) => Boolean(column.field));
    const headers = exportColumns.map((column) => column.header);
    const rows = event.rows.map((empleado, index) =>
      exportColumns.map((column) => {
        const value = column.field ? empleado[column.field] : '';
        return String(column.format ? column.format(value, empleado, index) : (value ?? ''));
      }),
    );
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${value.replace(/"/g, '""')}"`).join(';'))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = this.exportFileName(event);
    anchor.click();
    URL.revokeObjectURL(url);
  }

  openActionMenuEmpleado(): EmpleadoListado | null {
    if (this.openActionMenuId === null) {
      return null;
    }

    return this.empleados.find((empleado) => empleado.id === this.openActionMenuId) ?? null;
  }

  toggleActionMenu(empleadoId: number, event: MouseEvent): void {
    event.stopPropagation();

    if (this.openActionMenuId === empleadoId) {
      this.closeActionMenu();
      return;
    }

    const trigger = event.currentTarget;

    if (!(trigger instanceof HTMLElement)) {
      return;
    }

    const rect = trigger.getBoundingClientRect();
    const menuWidthPx = 224;
    const viewportPaddingPx = 8;
    const gapPx = 4;
    let left = rect.right - menuWidthPx;

    left = Math.max(
      viewportPaddingPx,
      Math.min(left, window.innerWidth - menuWidthPx - viewportPaddingPx),
    );

    this.actionMenuPosition = {
      top: rect.bottom + gapPx,
      left,
    };
    this.openActionMenuId = empleadoId;
    this.bindGridScrollCloseListener();
  }

  closeActionMenu(): void {
    this.openActionMenuId = null;
    this.actionMenuPosition = null;
    this.unbindGridScrollCloseListener();
  }

  private bindGridScrollCloseListener(): void {
    this.unbindGridScrollCloseListener();
    this.gridScrollListenerTarget = document.querySelector(
      'app-tabla-empleados app-data-grid.empleados-grid-shell .data-grid-scroll',
    );

    this.gridScrollListenerTarget?.addEventListener('scroll', this.onGridScrollClose, {
      passive: true,
    });
  }

  private unbindGridScrollCloseListener(): void {
    this.gridScrollListenerTarget?.removeEventListener('scroll', this.onGridScrollClose);
    this.gridScrollListenerTarget = null;
  }

  formatEmployeeMeta(empleado: EmpleadoListado): string {
    return `${capitalizarTextoEmpleado(empleado.cargo)} • ${formatearFechaIngresoListado(empleado.fechaIngreso)}`;
  }

  isDefaultDepartamento(departamento: string): boolean {
    return this.normalize(departamento) === 'sin centro de costo';
  }

  estadoBadgeClass(estado: EmpleadoEstado): string {
    switch (estado) {
      case 'borrador':
      case 'en_proceso':
        return 'border-blue-200 bg-blue-100 text-blue-700';
      case 'activo':
        return 'border-green-200 bg-green-100 text-green-700';
      case 'suspendido':
        return 'border-yellow-200 bg-yellow-100 text-yellow-700';
      case 'inactivo':
        return 'border-neutral-300 bg-neutral-200 text-neutral-600';
      case 'desvinculado':
        return 'border-red-200 bg-red-100 text-red-700';
      case 'bloqueado':
        return 'border-neutral-300 bg-neutral-100 text-neutral-700';
      default:
        return 'border-blue-200 bg-blue-100 text-blue-700';
    }
  }

  estadoVisualBadgeClass(empleado: EmpleadoListado): string {
    if (empleado.pasoAltaAvanzada !== null) {
      return this.estadoBadgeClass('borrador');
    }

    if (this.isEstadoOperativoCerrado(empleado.estado)) {
      return this.estadoBadgeClass(empleado.estado);
    }

    if (empleado.estado === 'activo' && !empleado.aptoParaRemuneraciones) {
      return 'border-yellow-200 bg-yellow-100 text-yellow-700';
    }

    if (empleado.estadoFicha === 'INCOMPLETO') {
      return this.estadoBadgeClass('en_proceso');
    }

    return this.estadoBadgeClass(empleado.estado);
  }

  primaryActionLink(empleado: EmpleadoListado): (string | number)[] {
    if (empleado.pasoAltaAvanzada !== null) {
      return ['/empleados', 'nuevo'];
    }
    return ['/empleados', empleado.id];
  }

  primaryActionQueryParams(empleado: EmpleadoListado): Record<string, string> {
    if (empleado.pasoAltaAvanzada !== null) {
      return { idPersona: String(empleado.id) };
    }
    return {};
  }

  rowPrimaryActionLabel(empleado: EmpleadoListado): string {
    if (empleado.pasoAltaAvanzada !== null) {
      return 'Continuar alta';
    }

    if (this.isEstadoOperativoCerrado(empleado.estado)) {
      return 'Ver ficha';
    }

    if (empleado.estado === 'activo' && !empleado.aptoParaRemuneraciones) {
      return 'Revisar pendientes';
    }

    if (empleado.estadoFicha === 'INCOMPLETO') {
      return 'Completar ficha';
    }

    return 'Ver ficha';
  }

  /** Etiqueta del popover de acciones (solo Ver ficha o Continuar alta). */
  menuPrimaryActionLabel(empleado: EmpleadoListado): string {
    return empleado.pasoAltaAvanzada !== null ? 'Continuar alta' : 'Ver ficha';
  }

  menuPrimaryActionIcon(empleado: EmpleadoListado) {
    return empleado.pasoAltaAvanzada !== null ? this.rowActionIcon : this.eyeIcon;
  }

  completionValue(empleado: EmpleadoListado): number {
    if (empleado.pasoAltaAvanzada !== null) {
      return 24;
    }

    if (empleado.estadoFicha === 'VALIDO' && empleado.aptoParaRemuneraciones) {
      return 100;
    }

    if (empleado.estado === 'activo' && !empleado.aptoParaRemuneraciones) {
      return 88;
    }

    if (this.isEstadoOperativoCerrado(empleado.estado)) {
      return 100;
    }

    return 68;
  }

  pendingLabel(empleado: EmpleadoListado): string {
    if (empleado.pasoAltaAvanzada !== null) {
      return 'Alta pendiente';
    }

    if (empleado.estadoFicha === 'VALIDO' && empleado.aptoParaRemuneraciones) {
      return 'Apto';
    }

    if (empleado.estado === 'activo' && !empleado.aptoParaRemuneraciones) {
      return 'No apto';
    }

    if (empleado.estadoFicha === 'INCOMPLETO') {
      return 'Ficha pendiente';
    }

    return 'Ver ficha';
  }

  labelEstadoVisual(empleado: EmpleadoListado): string {
    if (empleado.pasoAltaAvanzada !== null) {
      return 'Borrador';
    }

    if (this.isEstadoOperativoCerrado(empleado.estado)) {
      return etiquetaEstadoEmpleado(empleado.estado);
    }

    if (empleado.estado === 'activo' && !empleado.aptoParaRemuneraciones) {
      return 'Activo / No apto';
    }

    if (empleado.estadoFicha === 'INCOMPLETO') {
      return 'En proceso';
    }

    if (empleado.estadoFicha === 'VALIDO' && empleado.aptoParaRemuneraciones) {
      return 'Activo / Apto';
    }

    return etiquetaEstadoEmpleado(empleado.estado);
  }

  labelEstado = etiquetaEstadoEmpleado;
  capitalize = capitalizarTextoEmpleado;

  private exportFileName(event: DataGridExportEvent<EmpleadoListado>): string {
    const suffixByScope: Record<DataGridExportEvent<EmpleadoListado>['scope'], string> = {
      page: 'pagina_actual',
      selected: 'seleccionados',
      filtered: 'filtrados',
    };
    const columnSuffix = event.includeHiddenColumns ? 'todas_columnas' : 'columnas_visibles';

    return `empleados_${suffixByScope[event.scope]}_${columnSuffix}.csv`;
  }

  private normalize(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private isEstadoOperativoCerrado(estado: EmpleadoEstado): boolean {
    return ['suspendido', 'inactivo', 'desvinculado', 'bloqueado'].includes(estado);
  }
}
