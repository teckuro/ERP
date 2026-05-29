import { ChangeDetectionStrategy, Component, EventEmitter, Output, ViewEncapsulation, inject } from '@angular/core';

import { MessageBoxComponent } from '../../../../../../shared/components/ui/feedback/message-box/message-box.component';
import type { MessageBoxSection } from '../../../../../../shared/components/ui/feedback/message-box/message-box.types';
import {
  construirSeccionesMsgBoxAdvertenciaEmpleados,
  construirSeccionesMsgBoxBloqueoEmpleados,
  type ResultadoValidacionEmpleados,
} from '../../../../presenters/nomina-empleados-validacion.presenter';
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
  imports: [MessageBoxComponent],
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
  @Output() irAPendientesEmpleados = new EventEmitter<void>();
  @Output() confirmarAvanceConAdvertenciaEmpleados = new EventEmitter<void>();

  seccionesMsgBoxBloqueoEmpleados(resultado: ResultadoValidacionEmpleados): MessageBoxSection[] {
    return construirSeccionesMsgBoxBloqueoEmpleados(resultado);
  }

  seccionesMsgBoxAdvertenciaEmpleados(resultado: ResultadoValidacionEmpleados): MessageBoxSection[] {
    return construirSeccionesMsgBoxAdvertenciaEmpleados(resultado);
  }

  cerrarModalAvanceParametros(): void {
    this.orquestador.modalAvanceParametros.set(null);
    this.cerrarModal.emit();
  }

  cerrarModalAvanceEmpleados(): void {
    this.orquestador.modalAvanceEmpleados.set(null);
    this.cerrarModal.emit();
  }
}
