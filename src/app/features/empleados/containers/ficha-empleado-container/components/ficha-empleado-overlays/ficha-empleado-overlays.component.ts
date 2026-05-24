import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageBoxComponent } from '../../../../../../shared/components/ui/message-box.component';
import { FichaEmpleadoPresentacionFacade } from '../../facade/ficha-empleado-presentacion.facade';
import { FichaEmpleadoOverlaysPort } from '../../facade/ficha-empleado-overlays.port';
import { FichaEmpleadoEditModalComponent } from '../ficha-empleado-edit-modal/ficha-empleado-edit-modal.component';

@Component({
  selector: 'app-ficha-empleado-overlays',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MessageBoxComponent, FichaEmpleadoEditModalComponent],
  templateUrl: './ficha-empleado-overlays.component.html',
  styleUrls: [
    '../../../../styles/empleado-expediente-tokens.css',
    './ficha-empleado-overlays.component.css',
    '../../ficha-empleado-detalle.css',
  ],
})
export class FichaEmpleadoOverlaysComponent {
  readonly facade = inject(FichaEmpleadoPresentacionFacade);
  readonly overlaysPort = inject(FichaEmpleadoOverlaysPort);
}
