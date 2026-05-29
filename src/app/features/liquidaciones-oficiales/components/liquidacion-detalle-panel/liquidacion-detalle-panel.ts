import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

import type { LiquidacionConcepto, LiquidacionTrabajador } from '../../models/liquidacion-oficial.model';

@Component({
  selector: 'app-liquidacion-detalle-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './liquidacion-detalle-panel.html',
  styleUrl: './liquidacion-detalle-panel.css',
})
export class LiquidacionDetallePanelComponent {
  @Input() trabajador: LiquidacionTrabajador | null = null;
  @Input() conceptos: LiquidacionConcepto[] = [];

  haberes(): LiquidacionConcepto[] {
    return this.conceptos.filter((c) => c.tipo === 'haber');
  }

  descuentos(): LiquidacionConcepto[] {
    return this.conceptos.filter((c) => c.tipo !== 'haber');
  }

  money(value: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(value);
  }
}
