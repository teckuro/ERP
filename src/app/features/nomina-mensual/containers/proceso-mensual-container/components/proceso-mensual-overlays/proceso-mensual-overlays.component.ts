import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MessageBoxComponent } from '../../../../../../shared/components/ui/message-box.component';
import { ProcesoMensualDetalleModalComponent } from '../proceso-mensual-detalle-modal/proceso-mensual-detalle-modal.component';
import { ProcesoMensualInformacionModalComponent } from '../proceso-mensual-informacion-modal/proceso-mensual-informacion-modal.component';
import { ProcesoMensualPresentacionFacade } from '../../facade/proceso-mensual-presentacion.facade';

@Component({
  selector: 'app-proceso-mensual-overlays',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MessageBoxComponent,
    ProcesoMensualDetalleModalComponent,
    ProcesoMensualInformacionModalComponent,
  ],
  templateUrl: './proceso-mensual-overlays.component.html',
  styleUrls: ['./proceso-mensual-overlays.component.css', '../../proceso-mensual-container.css'],
})
export class ProcesoMensualOverlaysComponent {
  readonly facade = inject(ProcesoMensualPresentacionFacade);
}
