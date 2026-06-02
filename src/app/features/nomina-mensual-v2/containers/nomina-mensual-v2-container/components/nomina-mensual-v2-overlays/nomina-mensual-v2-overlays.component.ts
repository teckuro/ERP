import { ChangeDetectionStrategy, Component, EventEmitter, Output, ViewEncapsulation, computed, inject } from '@angular/core';

import { MessageBoxComponent } from '../../../../../../shared/components/ui/feedback/message-box/message-box.component';
import type { MessageBoxSection } from '../../../../../../shared/components/ui/feedback/message-box/message-box.types';
import type { DiferenciaParametroBase } from '../../../../models/nomina-parametros-base.models';
import type { TipoPendienteEmpleado } from '../../../../presenters/nomina-empleados-validacion.presenter';
import { NominaMensualV2EmpleadosResumenPendientesComponent } from '../nomina-mensual-v2-empleados-resumen-pendientes/nomina-mensual-v2-empleados-resumen-pendientes.component';
import { NominaMensualV2ModalAccesoBaseParametrosComponent } from '../nomina-mensual-v2-modal-acceso-base-parametros/nomina-mensual-v2-modal-acceso-base-parametros.component';
import { NominaParametrosBaseAccesoService } from '../../../../services/nomina-parametros-base-acceso.service';
import { NominaMensualV2OrquestadorPort } from '../../facade/nomina-mensual-v2-orquestador.port';

const SECCIONES_MSG_BOX_BLOQUEO_PARAMETROS: MessageBoxSection[] = [
  {
    title: 'Pendiente',
    text: 'Completa los datos no oficiales exigibles para preparar la nomina.',
    tone: 'attention',
  },
];

const SECCIONES_MSG_BOX_REVISION_PARAMETROS: MessageBoxSection[] = [
  {
    title: 'Observaciones',
    text: 'Puedes continuar, pero quedaran pendientes para revisar.',
    tone: 'attention',
  },
];

@Component({
  selector: 'app-nomina-mensual-v2-overlays',
  standalone: true,
  imports: [
    MessageBoxComponent,
    NominaMensualV2EmpleadosResumenPendientesComponent,
    NominaMensualV2ModalAccesoBaseParametrosComponent,
  ],
  templateUrl: './nomina-mensual-v2-overlays.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class NominaMensualV2OverlaysComponent {
  readonly orquestador = inject(NominaMensualV2OrquestadorPort);
  private readonly accesoBaseService = inject(NominaParametrosBaseAccesoService);

  readonly seccionesMsgBoxRevisionParametros = SECCIONES_MSG_BOX_REVISION_PARAMETROS;
  readonly permisosRecargaBase = computed(() => this.accesoBaseService.resolverPermisos());

  seccionesMsgBoxBloqueoParametros(pendientes?: readonly string[]): MessageBoxSection[] {
    if (!pendientes?.length) {
      return SECCIONES_MSG_BOX_BLOQUEO_PARAMETROS;
    }
    return [
      {
        title: 'Pendientes obligatorios',
        text: 'Completa estos datos no oficiales exigibles para preparar la nomina.',
        tone: 'attention',
        items: pendientes.slice(0, 8),
      },
    ];
  }

  @Output() cerrarModal = new EventEmitter<void>();
  @Output() confirmarAvanceConRevision = new EventEmitter<void>();
  @Output() irAPendientesParametros = new EventEmitter<void>();
  @Output() verEnGrillaEmpleados = new EventEmitter<TipoPendienteEmpleado>();
  @Output() confirmarAvanceConAdvertenciaAlcance = new EventEmitter<void>();
  @Output() irAPendientesEmpleados = new EventEmitter<void>();
  @Output() confirmarAvanceConAdvertenciaEmpleados = new EventEmitter<void>();
  @Output() reintentarValidacionEmpleados = new EventEmitter<void>();
  @Output() confirmarGuardarBaseYContinuar = new EventEmitter<void>();
  @Output() confirmarMantenerBaseYContinuar = new EventEmitter<void>();
  @Output() solicitarActualizarBase = new EventEmitter<void>();
  @Output() confirmarActualizarBaseYContinuar = new EventEmitter<void>();
  @Output() confirmarReingresoParametros = new EventEmitter<void>();
  @Output() confirmarRecargaBaseParametros = new EventEmitter<void>();

  seccionesPrepararNomina(preview: {
    seccionesListas: number;
    seccionesTotales: number;
    controlesVerificados: number;
    totalParametrosCongelados: number;
  }): MessageBoxSection[] {
    return [
      {
        title: 'Base a guardar',
        text: `${preview.seccionesListas}/${preview.seccionesTotales} secciones listas. ${preview.totalParametrosCongelados} parametros guardados.`,
        tone: 'neutral',
      },
    ];
  }

  seccionesTablaDiferencias(diferencias: DiferenciaParametroBase[]): MessageBoxSection[] {
    return [
      {
        title: 'Cambios detectados',
        text: 'Base guardada versus parametros actuales.',
        tone: 'attention',
        items: diferencias.slice(0, 12).map(
          (diff) => `${diff.etiqueta}: ${diff.valorBase ?? '-'} -> ${diff.valorActual ?? '-'}`,
        ),
      },
    ];
  }

  cerrarModalAvanceParametros(): void {
    this.orquestador.modalAvanceParametros.set(null);
    this.cerrarModal.emit();
  }

  cerrarModalAvanceAlcance(): void {
    this.orquestador.modalAvanceAlcance.set(null);
    this.cerrarModal.emit();
  }

  cerrarModalAvanceEmpleados(): void {
    this.orquestador.modalAvanceEmpleados.set(null);
    this.cerrarModal.emit();
  }

  cerrarModalPrepararNomina(): void {
    this.orquestador.modalPrepararNomina.set(null);
    this.cerrarModal.emit();
  }

  cerrarModalDiferenciasBase(): void {
    this.orquestador.modalDiferenciasParametrosBase.set(null);
    this.cerrarModal.emit();
  }

  cerrarModalActualizarBase(): void {
    this.orquestador.modalActualizarParametrosBase.set(null);
    this.cerrarModal.emit();
  }

  cerrarModalTablaDiferencias(): void {
    this.orquestador.modalTablaDiferenciasParametrosBase.set(null);
    this.cerrarModal.emit();
  }

  cerrarModalRevisarParametros(): void {
    this.orquestador.modalRevisarParametros.set(null);
    this.cerrarModal.emit();
  }

  cerrarModalAccesoBaseParametros(): void {
    this.orquestador.modalAccesoBaseParametros.set(null);
    this.cerrarModal.emit();
  }
}
