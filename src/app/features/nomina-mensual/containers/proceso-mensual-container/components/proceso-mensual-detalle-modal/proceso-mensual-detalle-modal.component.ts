import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { X as XIcon } from 'lucide-angular/src/icons';

import { DataGridComponent } from '../../../../../../shared/components/ui/data-grid.component';
import { ProcesoMensualPresentacionFacade } from '../../facade/proceso-mensual-presentacion.facade';

@Component({
  selector: 'app-proceso-mensual-detalle-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LucideAngularModule, DataGridComponent],
  templateUrl: './proceso-mensual-detalle-modal.component.html',
  styleUrls: [
    '../../payroll-operational-tabs.css',
    '../../payroll-segment-nav.css',
    './proceso-mensual-detalle-modal.component.css',
  ],
})
export class ProcesoMensualDetalleModalComponent {
  readonly facade = inject(ProcesoMensualPresentacionFacade);
  readonly closeIcon = XIcon;
}
