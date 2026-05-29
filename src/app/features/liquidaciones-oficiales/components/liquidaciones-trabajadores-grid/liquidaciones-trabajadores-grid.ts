import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

import type { LiquidacionTrabajador } from '../../models/liquidacion-oficial.model';
import {
  buildLiquidacionAccionUiView,
  estadoInicialLiquidacionUi,
  type LiquidacionAccionUiAction,
  type LiquidacionAccionUiEstado,
  type LiquidacionAccionUiEvent,
  type LiquidacionAccionUiView,
} from '../../rules/liquidaciones-acciones-ui.rules';

@Component({
  selector: 'app-liquidaciones-trabajadores-grid',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './liquidaciones-trabajadores-grid.html',
  styleUrl: './liquidaciones-trabajadores-grid.css',
})
export class LiquidacionesTrabajadoresGridComponent {
  @Input() trabajadores: LiquidacionTrabajador[] = [];
  @Input() seleccionado: LiquidacionTrabajador | null = null;
  @Input() estadosAccion: Record<number, LiquidacionAccionUiEstado> = {};
  @Output() verDetalle = new EventEmitter<LiquidacionTrabajador>();
  @Output() accionFlujo = new EventEmitter<LiquidacionAccionUiEvent>();

  estadoUi(trabajador: LiquidacionTrabajador): LiquidacionAccionUiEstado {
    return this.estadosAccion[trabajador.idLiquidacionTrabajador] ?? estadoInicialLiquidacionUi(trabajador);
  }

  view(trabajador: LiquidacionTrabajador): LiquidacionAccionUiView {
    return buildLiquidacionAccionUiView(this.estadoUi(trabajador));
  }

  ejecutar(trabajador: LiquidacionTrabajador, action: LiquidacionAccionUiAction): void {
    this.accionFlujo.emit({
      idLiquidacionTrabajador: trabajador.idLiquidacionTrabajador,
      tipo: action.tipo,
    });
  }

  money(value: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(value);
  }
}
