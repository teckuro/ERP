import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { Download, Filter, LoaderCircle, Plus, RefreshCw } from 'lucide-angular/src/icons';

import { TablaEmpleadosComponent } from '../../components/tabla-empleados/tabla-empleados';
import { EmpleadoListado } from '../../models/empleado-listado.model';
import { EmpleadosService } from '../../services/empleados.service';
import {
  DataGridBulkActionEvent,
  DataGridBulkActionResult,
} from '../../../../shared/components/ui/data-grid.component';
import {
  RecordBreadcrumbComponent,
  RecordBreadcrumbItem,
} from '../../../../shared/components/ui/record-breadcrumb.component';

@Component({
  selector: 'app-listado-empleados',
  imports: [CommonModule, LucideAngularModule, RecordBreadcrumbComponent, TablaEmpleadosComponent],
  templateUrl: './listado-empleados-container.html',
  styleUrl: './listado-empleados-container.css',
})
export class ListadoEmpleadosContainer {
  private readonly empleadosService = inject(EmpleadosService);
  private readonly router = inject(Router);

  readonly breadcrumbItems: readonly RecordBreadcrumbItem[] = [{ label: 'Empleados' }];
  readonly downloadIcon = Download;
  readonly filterIcon = Filter;
  readonly loaderIcon = LoaderCircle;
  readonly plusIcon = Plus;
  readonly refreshIcon = RefreshCw;
  readonly empleados = signal<EmpleadoListado[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly bulkActionLoading = signal(false);
  readonly bulkActionResult = signal<DataGridBulkActionResult<EmpleadoListado> | null>(null);
  readonly createNavigationTarget = signal<'basico' | 'avanzado' | null>(null);
  crearMenuAbierto = false;

  @HostListener('document:click', ['$event'])
  closeCrearMenuOnOutsideClick(event: MouseEvent): void {
    const target = event.target;

    if (target instanceof Element && target.closest('[data-listado-create-menu]')) {
      return;
    }

    this.crearMenuAbierto = false;
  }

  async ngOnInit(): Promise<void> {
    await this.loadEmpleados();
  }

  async loadEmpleados(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      this.empleados.set(await this.empleadosService.listar());
    } catch {
      this.errorMessage.set('No fue posible cargar el listado de empleados.');
    } finally {
      this.isLoading.set(false);
    }
  }

  toggleCrearMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.crearMenuAbierto = !this.crearMenuAbierto;
  }

  async crearBasico(): Promise<void> {
    if (this.createNavigationTarget()) {
      return;
    }

    this.crearMenuAbierto = false;
    this.createNavigationTarget.set('basico');

    try {
      await this.router.navigate(['/empleados/nuevo'], { queryParams: { modo: 'basico' } });
    } finally {
      this.createNavigationTarget.set(null);
    }
  }

  async crearAvanzado(): Promise<void> {
    if (this.createNavigationTarget()) {
      return;
    }

    this.crearMenuAbierto = false;
    this.createNavigationTarget.set('avanzado');

    try {
      await this.router.navigate(['/empleados/nuevo'], { queryParams: { modo: 'avanzado' } });
    } finally {
      this.createNavigationTarget.set(null);
    }
  }

  async handleBulkAction(event: DataGridBulkActionEvent<EmpleadoListado>): Promise<void> {
    const nextEstado = this.normalizeBulkState(event.value);
    this.bulkActionLoading.set(true);
    this.bulkActionResult.set(null);

    try {
      const updatedIds = await this.empleadosService.actualizarEstadoPersonas(
        event.rows.map((empleado) => empleado.id),
        nextEstado,
      );
      const updatedIdSet = new Set(updatedIds);
      const processed = updatedIds.length;

      this.empleados.update((empleados) =>
        empleados.map((empleado) =>
          updatedIdSet.has(empleado.id)
            ? {
                ...empleado,
                estado: nextEstado,
              }
            : empleado,
        ),
      );

      this.bulkActionResult.set({
        action: event.action,
        rows: event.rows,
        status: processed === event.rows.length ? 'success' : 'partial',
        processed,
        total: event.rows.length,
        message: this.bulkActionResultMessage(
          event.label ?? 'estado seleccionado',
          processed,
          event.rows.length,
        ),
      });
    } catch {
      this.bulkActionResult.set({
        action: event.action,
        rows: event.rows,
        status: 'error',
        processed: 0,
        total: event.rows.length,
        message: 'No fue posible actualizar el estado en la base de datos.',
      });
    } finally {
      this.bulkActionLoading.set(false);
    }
  }

  private normalizeBulkState(value: string | undefined): EmpleadoListado['estado'] {
    switch (value) {
      case 'en_proceso':
      case 'activo':
      case 'suspendido':
      case 'inactivo':
      case 'desvinculado':
      case 'bloqueado':
        return value;
      default:
        return 'en_proceso';
    }
  }

  private bulkActionResultMessage(label: string, processed: number, total: number): string {
    const statusText = processed === total ? `${processed}` : `${processed} de ${total}`;
    return `${statusText} empleados actualizados a ${label}.`;
  }
}
