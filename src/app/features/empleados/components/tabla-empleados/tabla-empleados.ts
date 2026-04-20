import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, Output, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { Edit, Eye, History, MoreVertical, PowerOff } from 'lucide-angular/src/icons';

import { EmpleadoEstado, EmpleadoListado } from '../../models/empleado-listado.model';
import {
  DataGridCellDirective,
  DataGridBulkActionEvent,
  DataGridBulkActionResult,
  DataGridBulkActionOption,
  DataGridColumn,
  DataGridComponent,
  DataGridExportEvent,
  DataGridFilter,
} from '../../../../shared/components/ui/data-grid.component';

@Component({
  selector: 'app-tabla-empleados',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    LucideAngularModule,
    DataGridCellDirective,
    DataGridComponent,
  ],
  templateUrl: './tabla-empleados.html',
  styleUrl: './tabla-empleados.css',
})
export class TablaEmpleadosComponent {
  private readonly router = inject(Router);

  @Input() empleados: EmpleadoListado[] = [];
  @Input() maxItems = 10;
  @Input() loading = false;
  @Input() errorMessage = '';
  @Input() bulkActionLoading = false;
  @Input() bulkActionResult: DataGridBulkActionResult<EmpleadoListado> | null = null;
  @Output() readonly refresh = new EventEmitter<void>();
  @Output() readonly bulkAction = new EventEmitter<DataGridBulkActionEvent<EmpleadoListado>>();

  readonly editIcon = Edit;
  readonly eyeIcon = Eye;
  readonly historyIcon = History;
  readonly moreIcon = MoreVertical;
  readonly powerOffIcon = PowerOff;
  openActionMenuId: number | null = null;

  readonly bulkStateActions: DataGridBulkActionOption[] = [
    {
      id: 'set-draft',
      label: 'Borrador',
      value: 'borrador',
      tone: 'neutral',
      confirmLabel: 'Pasar a borrador',
    },
    {
      id: 'set-in-progress',
      label: 'En proceso',
      value: 'en_proceso',
      tone: 'info',
      confirmLabel: 'Pasar a en proceso',
    },
    {
      id: 'activate',
      label: 'Activo',
      value: 'activo',
      tone: 'success',
      confirmLabel: 'Activar seleccion',
    },
    {
      id: 'change-status',
      label: 'Suspendido',
      value: 'suspendido',
      tone: 'warning',
      confirmLabel: 'Suspender seleccion',
    },
    {
      id: 'deactivate',
      label: 'Inactivo',
      value: 'inactivo',
      tone: 'danger',
      confirmLabel: 'Desactivar seleccion',
    },
    {
      id: 'set-unlinked',
      label: 'Desvinculado',
      value: 'desvinculado',
      tone: 'danger',
      confirmLabel: 'Desvincular seleccion',
    },
    {
      id: 'set-blocked',
      label: 'Bloqueado',
      value: 'bloqueado',
      tone: 'blocked',
      confirmLabel: 'Bloquear seleccion',
    },
  ];

  readonly columns: DataGridColumn<EmpleadoListado>[] = [
    {
      id: 'rut',
      header: 'RUT',
      field: 'rut',
      type: 'text',
      cellClass: 'whitespace-nowrap text-neutral-700',
    },
    {
      id: 'nombre',
      header: 'Empleado',
      field: 'nombre',
      type: 'text',
      hideable: false,
    },
    {
      id: 'cargo',
      header: 'Cargo',
      field: 'cargo',
      type: 'text',
      cellClass: 'text-neutral-700',
      format: (value) => this.capitalize(String(value ?? '')),
    },
    {
      id: 'departamento',
      header: 'Departamento',
      field: 'departamento',
      type: 'text',
      cellClass: 'text-neutral-700',
    },
    {
      id: 'sueldoBase',
      header: 'Sueldo',
      field: 'sueldoBase',
      type: 'number',
      align: 'right',
      cellClass: 'whitespace-nowrap font-semibold text-neutral-900',
      format: (value) => `$ ${Number(value).toLocaleString('es-CL')}`,
    },
    {
      id: 'estado',
      header: 'Estado',
      field: 'estado',
      type: 'text',
      hideable: false,
      format: (value) => this.labelEstado(value as EmpleadoEstado),
    },
    {
      id: 'acciones',
      header: 'Acciones',
      align: 'center',
      sortable: false,
      hideable: false,
    },
  ];

  readonly filters: DataGridFilter<EmpleadoListado>[] = [
    {
      id: 'estado',
      label: 'Estado',
      field: 'estado',
      options: [
        { label: 'Borrador', value: 'borrador' },
        { label: 'En proceso', value: 'en_proceso' },
        { label: 'Activo', value: 'activo' },
        { label: 'Suspendido', value: 'suspendido' },
        { label: 'Inactivo', value: 'inactivo' },
        { label: 'Desvinculado', value: 'desvinculado' },
        { label: 'Bloqueado', value: 'bloqueado' },
      ],
    },
    {
      id: 'departamento',
      label: 'Centro de costo',
      field: 'departamento',
    },
    {
      id: 'cargo',
      label: 'Cargo',
      field: 'cargo',
    },
  ];

  @HostListener('document:click', ['$event'])
  closeActionMenuOnOutsideClick(event: MouseEvent): void {
    const target = event.target;

    if (target instanceof Element && target.closest('[data-employee-action-menu]')) {
      return;
    }

    this.openActionMenuId = null;
  }

  trackByEmpleadoId(_index: number, empleado: EmpleadoListado): number {
    return empleado.id;
  }

  createEmpleado(): void {
    void this.router.navigate(['/empleados/nuevo']);
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

  toggleActionMenu(empleadoId: number, event: MouseEvent): void {
    event.stopPropagation();
    this.openActionMenuId = this.openActionMenuId === empleadoId ? null : empleadoId;
  }

  closeActionMenu(): void {
    this.openActionMenuId = null;
  }

  formatEmployeeMeta(empleado: EmpleadoListado): string {
    return `${this.capitalize(empleado.cargo)} • ${this.formatDisplayDate(empleado.fechaIngreso)}`;
  }

  isDefaultDepartamento(departamento: string): boolean {
    return this.normalize(departamento) === 'sin centro de costo';
  }

  estadoBadgeClass(estado: EmpleadoEstado): string {
    switch (estado) {
      case 'borrador':
        return 'border-neutral-200 bg-white text-neutral-600';
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
        return 'border-purple-200 bg-purple-100 text-purple-700';
      default:
        return 'border-blue-200 bg-blue-100 text-blue-700';
    }
  }

  labelEstado(estado: EmpleadoEstado): string {
    switch (estado) {
      case 'borrador':
        return 'Borrador';
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

  capitalize(value: string): string {
    return value
      .toLowerCase()
      .split(' ')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private formatDisplayDate(value: string): string {
    const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    const date = match
      ? new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]))
      : new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('es-CL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
      .format(date)
      .toLowerCase()
      .replace('.', '')
      .replace(/^(\d{2})\s/, '$1 ');
  }

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
}
