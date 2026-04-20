import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';

import { TablaEmpleadosComponent } from '../../components/tabla-empleados/tabla-empleados';
import { EmpleadoListado } from '../../models/empleado-listado.model';
import { EmpleadosService } from '../../services/empleados.service';
import {
  DataGridBulkActionEvent,
  DataGridBulkActionResult,
} from '../../../../shared/components/ui/data-grid.component';

@Component({
  selector: 'app-listado-empleados',
  imports: [
    CommonModule,
    TablaEmpleadosComponent,
  ],
  templateUrl: './listado-empleados.html',
  styleUrl: './listado-empleados.css',
})
export class ListadoEmpleadosPage {
  private readonly empleadosService = inject(EmpleadosService);

  readonly empleados = signal<EmpleadoListado[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly bulkActionLoading = signal(false);
  readonly bulkActionResult = signal<DataGridBulkActionResult<EmpleadoListado> | null>(null);

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
        message: this.bulkActionResultMessage(event.label ?? 'estado seleccionado', processed, event.rows.length),
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
      case 'borrador':
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
