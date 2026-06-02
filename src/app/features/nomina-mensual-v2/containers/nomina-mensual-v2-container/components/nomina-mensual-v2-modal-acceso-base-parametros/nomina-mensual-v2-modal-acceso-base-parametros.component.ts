import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  output,
} from '@angular/core';

import { MessageBoxComponent } from '../../../../../../shared/components/ui/feedback/message-box/message-box.component';
import type { ModalAccesoBaseParametrosPort } from '../../../../models/nomina-parametros-base-acceso.models';
import { construirVistaModalAccesoBase } from '../../../../presenters/nomina-parametros-base-acceso.presenter';

@Component({
  selector: 'app-nomina-mensual-v2-modal-acceso-base-parametros',
  standalone: true,
  imports: [MessageBoxComponent],
  templateUrl: './nomina-mensual-v2-modal-acceso-base-parametros.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class NominaMensualV2ModalAccesoBaseParametrosComponent {
  /** Estado del modal (null = cerrado). */
  readonly modal = input<ModalAccesoBaseParametrosPort | null>(null);

  readonly confirmar = output<void>();
  readonly cerrar = output<void>();

  readonly vista = computed(() => {
    const estado = this.modal();
    if (!estado) return null;
    return construirVistaModalAccesoBase(estado);
  });

  onAccionPrincipal(): void {
    const vista = this.vista();
    if (!vista) return;
    if (vista.variant === 'decision') {
      this.confirmar.emit();
      return;
    }
    this.cerrar.emit();
  }
}
