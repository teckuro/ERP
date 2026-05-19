import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import {
  DataGridCellDirective,
  DataGridComponent,
} from '../../../../../../shared/components/ui/data-grid.component';
import { ProcesoMensualPresentacionFacade } from '../../facade/proceso-mensual-presentacion.facade';

@Component({
  selector: 'app-proceso-mensual-detalle-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, DataGridComponent, DataGridCellDirective],
  templateUrl: './proceso-mensual-detalle-modal.component.html',
  styleUrl: './proceso-mensual-detalle-modal.component.css',
})
export class ProcesoMensualDetalleModalComponent {
  readonly facade = inject(ProcesoMensualPresentacionFacade);
}
