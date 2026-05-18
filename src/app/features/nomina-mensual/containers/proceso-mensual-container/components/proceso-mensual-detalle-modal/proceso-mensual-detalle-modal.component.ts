import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { DataGridComponent } from '../../../../../../shared/components/ui/data-grid.component';
import { ProcesoMensualPresentacionFacade } from '../../facade/proceso-mensual-presentacion.facade';

@Component({
  selector: 'app-proceso-mensual-detalle-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, DataGridComponent],
  templateUrl: './proceso-mensual-detalle-modal.component.html',
  styleUrl: '../../proceso-mensual-container.css',
})
export class ProcesoMensualDetalleModalComponent {
  readonly facade = inject(ProcesoMensualPresentacionFacade);
}
