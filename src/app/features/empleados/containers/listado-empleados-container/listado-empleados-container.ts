import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { TablaEmpleadosComponent } from '../../components/tabla-empleados/tabla-empleados';
import { EmpleadoListado } from '../../models/empleado-listado.model';
import { EmpleadosService } from '../../services/empleados.service';
import {
  DataGridBulkActionEvent,
  DataGridBulkActionResult,
} from '../../../../shared/components/ui/data-grid';
import { mensajeErrorSupabaseParaUsuario } from '../../../../core/errors/erp-supabase-user-message';
@Component({
  selector: 'app-listado-empleados',
  imports: [CommonModule, TablaEmpleadosComponent],
  templateUrl: './listado-empleados-container.html',
  styleUrl: './listado-empleados-container.css',
})
export class ListadoEmpleadosContainer {
  private readonly empleadosService = inject(EmpleadosService);
  private readonly router = inject(Router);

  readonly empleados = signal<EmpleadoListado[]>([]);
  readonly cargando = signal(true);
  readonly mensajeError = signal<string | null>(null);
  readonly cargandoAccionMasiva = signal(false);
  readonly resultadoAccionMasiva = signal<DataGridBulkActionResult<EmpleadoListado> | null>(null);
  readonly destinoNavegacionCreacion = signal<'basico' | 'avanzado' | null>(null);

  async ngOnInit(): Promise<void> {
    await this.cargarEmpleados();
  }

  async cargarEmpleados(): Promise<void> {
    this.cargando.set(true);
    this.mensajeError.set(null);

    try {
      this.empleados.set(await this.empleadosService.listar());
    } catch (err) {
      this.mensajeError.set(
        mensajeErrorSupabaseParaUsuario(err, 'cargar el listado de empleados'),
      );
    } finally {
      this.cargando.set(false);
    }
  }

  async crearBasico(): Promise<void> {
    if (this.destinoNavegacionCreacion()) {
      return;
    }
    this.destinoNavegacionCreacion.set('basico');

    try {
      await this.router.navigate(['/empleados/nuevo'], { queryParams: { modo: 'basico' } });
    } finally {
      this.destinoNavegacionCreacion.set(null);
    }
  }

  async crearAvanzado(): Promise<void> {
    if (this.destinoNavegacionCreacion()) {
      return;
    }
    this.destinoNavegacionCreacion.set('avanzado');

    try {
      await this.router.navigate(['/empleados/nuevo'], { queryParams: { modo: 'avanzado' } });
    } finally {
      this.destinoNavegacionCreacion.set(null);
    }
  }

  async manejarAccionMasiva(event: DataGridBulkActionEvent<EmpleadoListado>): Promise<void> {
    const estadoSiguiente = this.normalizarEstadoMasivo(event.value);
    this.cargandoAccionMasiva.set(true);
    this.resultadoAccionMasiva.set(null);

    try {
      const idsActualizados = await this.empleadosService.actualizarEstadoPersonas(
        event.rows.map((empleado) => empleado.id),
        estadoSiguiente,
      );
      const idsActualizadosSet = new Set(idsActualizados);
      const procesados = idsActualizados.length;

      this.empleados.update((empleados) =>
        empleados.map((empleado) =>
          idsActualizadosSet.has(empleado.id)
            ? {
                ...empleado,
                estado: estadoSiguiente,
                aptoParaRemuneraciones: false,
              }
            : empleado,
        ),
      );

      this.resultadoAccionMasiva.set({
        action: event.action,
        rows: event.rows,
        status: procesados === event.rows.length ? 'success' : 'partial',
        processed: procesados,
        total: event.rows.length,
        message: this.mensajeResultadoAccionMasiva(
          event.label ?? 'estado seleccionado',
          procesados,
          event.rows.length,
        ),
      });
    } catch {
      this.resultadoAccionMasiva.set({
        action: event.action,
        rows: event.rows,
        status: 'error',
        processed: 0,
        total: event.rows.length,
        message: 'No fue posible actualizar el estado en la base de datos.',
      });
    } finally {
      this.cargandoAccionMasiva.set(false);
    }
  }

  private normalizarEstadoMasivo(value: string | undefined): EmpleadoListado['estado'] {
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

  private mensajeResultadoAccionMasiva(label: string, procesados: number, total: number): string {
    const textoEstado = procesados === total ? `${procesados}` : `${procesados} de ${total}`;
    return `${textoEstado} empleados actualizados a ${label}.`;
  }
}
