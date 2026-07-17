import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

import type { LiquidacionConcepto, LiquidacionTrabajador } from '../../models/liquidacion-oficial.model';

export interface EstadoTrabajadorDetalleUi {
  label: string;
  tono: 'pending' | 'review' | 'ok' | 'danger';
}

const TOLERANCIA_CUADRATURA_PESOS = 1;

@Component({
  selector: 'app-liquidacion-detalle-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './liquidacion-detalle-panel.html',
  styleUrl: './liquidacion-detalle-panel.css',
})
export class LiquidacionDetallePanelComponent {
  @Input() trabajador: LiquidacionTrabajador | null = null;
  @Input() conceptos: LiquidacionConcepto[] = [];
  @Input() estadoTrabajador: EstadoTrabajadorDetalleUi | null = null;
  @Input() permitirExpandir = true;
  @Input() permitirCerrar = true;

  @Output() expandirDetalle = new EventEmitter<void>();
  @Output() cerrarDetalle = new EventEmitter<void>();

  haberes(): LiquidacionConcepto[] {
    return this.conceptos.filter((c) => c.tipo === 'haber');
  }

  descuentos(): LiquidacionConcepto[] {
    return this.conceptos.filter((c) => c.tipo !== 'haber');
  }

  cuadraturaOk(): boolean {
    if (!this.trabajador) return true;
    const esperado = this.trabajador.totalHaberes - this.trabajador.totalDescuentos;
    return Math.abs(esperado - this.trabajador.liquidoPagar) <= TOLERANCIA_CUADRATURA_PESOS;
  }

  money(value: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(value);
  }
}
