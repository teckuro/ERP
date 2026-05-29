import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

import type {
  ResultadoValidacionEmpleados,
  SeccionResumenPendientesEmpleados,
  TipoPendienteEmpleado,
} from '../../../../presenters/nomina-empleados-validacion.presenter';
import type { ModalResumenPendientesEmpleadosPort } from '../../facade/nomina-mensual-v2-orquestador.port';
import { claseSeveridadChecklist } from '../../utils/nomina-mensual-v2-presentacion.util';

@Component({
  selector: 'app-nomina-mensual-v2-empleados-resumen-pendientes',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './nomina-mensual-v2-empleados-resumen-pendientes.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class NominaMensualV2EmpleadosResumenPendientesComponent {
  @Input({ required: true }) modal!: ModalResumenPendientesEmpleadosPort;

  @Output() cerrar = new EventEmitter<void>();
  @Output() verEnGrilla = new EventEmitter<TipoPendienteEmpleado>();
  @Output() verPendientesEnGrilla = new EventEmitter<void>();
  @Output() continuar = new EventEmitter<void>();
  @Output() reintentarValidacion = new EventEmitter<void>();

  readonly claseSeveridadChecklist = claseSeveridadChecklist;

  get resultado(): ResultadoValidacionEmpleados {
    return this.modal.resultado;
  }

  get secciones(): SeccionResumenPendientesEmpleados[] {
    return this.modal.secciones;
  }

  get esConsulta(): boolean {
    return this.modal.origen === 'checklist';
  }

  get mostrarContinuar(): boolean {
    return !this.esConsulta && this.resultado.estado === 'advertencia' && this.resultado.puedeContinuar;
  }

  get mostrarReintentar(): boolean {
    return !this.esConsulta && this.resultado.estado === 'bloqueado';
  }

  get hayPendientesAccionables(): boolean {
    return this.resultado.trabajadoresAfectados > 0;
  }

  esSeccionCompacta(seccion: SeccionResumenPendientesEmpleados): boolean {
    return seccion.severidad === 'correcto';
  }

  cerrarModal(): void {
    this.cerrar.emit();
  }

  solicitarVerEnGrilla(tipoPendiente: TipoPendienteEmpleado | undefined): void {
    if (!tipoPendiente) return;
    this.verEnGrilla.emit(tipoPendiente);
  }

  solicitarVerPendientesEnGrilla(): void {
    this.verPendientesEnGrilla.emit();
  }

  solicitarContinuar(): void {
    this.continuar.emit();
  }

  solicitarReintentarValidacion(): void {
    this.reintentarValidacion.emit();
  }
}
