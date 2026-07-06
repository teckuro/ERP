import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

import type { LiquidacionConcepto, LiquidacionTrabajador } from '../../models/liquidacion-oficial.model';
import type { LiquidacionAccionUiAction, LiquidacionAccionUiView } from '../../rules/liquidaciones-acciones-ui.rules';
import {
  LiquidacionDetallePanelComponent,
  type EstadoTrabajadorDetalleUi,
} from '../liquidacion-detalle-panel/liquidacion-detalle-panel';

@Component({
  selector: 'app-liquidaciones-modal-detalle-trabajador',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, LiquidacionDetallePanelComponent],
  templateUrl: './liquidaciones-modal-detalle-trabajador.component.html',
  styleUrl: './liquidaciones-modal-detalle-trabajador.component.css',
})
export class LiquidacionesModalDetalleTrabajadorComponent {
  readonly abierto = input(false);
  readonly trabajador = input<LiquidacionTrabajador | null>(null);
  readonly conceptos = input<LiquidacionConcepto[]>([]);
  readonly estadoTrabajador = input<EstadoTrabajadorDetalleUi | null>(null);
  readonly accionView = input<LiquidacionAccionUiView | null>(null);
  readonly pdfCargando = input(false);

  readonly cerrar = output<void>();
  readonly ejecutarAccion = output<LiquidacionAccionUiAction>();
  readonly abrirPreview = output<void>();

  onBackdropClick(): void {
    this.cerrar.emit();
  }

  onDialogClick(event: MouseEvent): void {
    event.stopPropagation();
  }
}
