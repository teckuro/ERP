import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageBoxComponent } from '../../../../../../shared/components/ui/message-box.component';
import { FichaEmpleadoPresentacionFacade } from '../../facade/ficha-empleado-presentacion.facade';

@Component({
  selector: 'app-ficha-empleado-overlays',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MessageBoxComponent],
  templateUrl: './ficha-empleado-overlays.component.html',
  styleUrls: ['../../ficha-empleado-container.css'],
})
export class FichaEmpleadoOverlaysComponent {
  readonly facade = inject(FichaEmpleadoPresentacionFacade);
}
