import { ChangeDetectionStrategy, Component, EventEmitter, Output, ViewEncapsulation, inject } from '@angular/core';

import { MessageBoxComponent } from '../../../../../../shared/components/ui/feedback/message-box/message-box.component';
import type { MessageBoxSection } from '../../../../../../shared/components/ui/feedback/message-box/message-box.types';
import type { TipoPendienteEmpleado } from '../../../../presenters/nomina-empleados-validacion.presenter';
import { NominaMensualV2EmpleadosResumenPendientesComponent } from '../nomina-mensual-v2-empleados-resumen-pendientes/nomina-mensual-v2-empleados-resumen-pendientes.component';
import { NominaMensualV2OrquestadorPort } from '../../facade/nomina-mensual-v2-orquestador.port';

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

@Component({
  selector: 'app-nomina-mensual-v2-overlays',
  standalone: true,
  imports: [MessageBoxComponent, NominaMensualV2EmpleadosResumenPendientesComponent],
  templateUrl: './nomina-mensual-v2-overlays.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class NominaMensualV2OverlaysComponent {
  readonly orquestador = inject(NominaMensualV2OrquestadorPort);

  readonly seccionesMsgBoxBloqueoParametros = SECCIONES_MSG_BOX_BLOQUEO_PARAMETROS;
  readonly seccionesMsgBoxRevisionParametros = SECCIONES_MSG_BOX_REVISION_PARAMETROS;

  @Output() cerrarModal = new EventEmitter<void>();
  @Output() confirmarAvanceConRevision = new EventEmitter<void>();
  @Output() irAPendientesParametros = new EventEmitter<void>();
  @Output() verEnGrillaEmpleados = new EventEmitter<TipoPendienteEmpleado>();
  @Output() irAPendientesEmpleados = new EventEmitter<void>();
  @Output() confirmarAvanceConAdvertenciaEmpleados = new EventEmitter<void>();
  @Output() reintentarValidacionEmpleados = new EventEmitter<void>();

  cerrarModalAvanceParametros(): void {
    this.orquestador.modalAvanceParametros.set(null);
    this.cerrarModal.emit();
  }

  cerrarModalAvanceEmpleados(): void {
    this.orquestador.modalAvanceEmpleados.set(null);
    this.cerrarModal.emit();
  }
}
