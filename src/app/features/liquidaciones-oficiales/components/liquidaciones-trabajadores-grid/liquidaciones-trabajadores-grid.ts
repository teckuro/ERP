import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BadgeComponent } from '../../../../shared/components/ui/primitives/badge.component';
import { ButtonComponent } from '../../../../shared/components/ui/primitives/button.component';
import type { LiquidacionTrabajador } from '../../models/liquidacion-oficial.model';

@Component({
  selector: 'app-liquidaciones-trabajadores-grid',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, BadgeComponent, ButtonComponent],
  template: `
    <div class="overflow-x-auto rounded-md border border-gray-200">
      <table class="min-w-full divide-y divide-gray-200 text-sm">
        <thead class="bg-gray-50 text-xs font-semibold uppercase text-gray-600">
          <tr>
            <th class="px-3 py-2 text-left">Trabajador</th>
            <th class="px-3 py-2 text-left">RUT</th>
            <th class="px-3 py-2 text-left">Estado</th>
            <th class="px-3 py-2 text-right">Total haberes</th>
            <th class="px-3 py-2 text-right">Total descuentos</th>
            <th class="px-3 py-2 text-right">Liquido a pagar</th>
            <th class="px-3 py-2 text-center">Observaciones</th>
            <th class="px-3 py-2 text-right">Accion</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 bg-white">
          @for (trabajador of trabajadores; track trabajador.idLiquidacionTrabajador) {
            <tr [class.bg-blue-50]="seleccionado?.idLiquidacionTrabajador === trabajador.idLiquidacionTrabajador">
              <td class="px-3 py-2 font-medium text-gray-900">{{ trabajador.nombreTrabajador }}</td>
              <td class="px-3 py-2 text-gray-700">{{ trabajador.rut || '-' }}</td>
              <td class="px-3 py-2"><app-badge variant="success" size="sm">Generada</app-badge></td>
              <td class="px-3 py-2 text-right text-gray-700">{{ money(trabajador.totalHaberes) }}</td>
              <td class="px-3 py-2 text-right text-gray-700">{{ money(trabajador.totalDescuentos) }}</td>
              <td class="px-3 py-2 text-right font-semibold text-gray-900">{{ money(trabajador.liquidoPagar) }}</td>
              <td class="px-3 py-2 text-center text-gray-700">{{ trabajador.observaciones.length }}</td>
              <td class="px-3 py-2 text-right">
                <app-button variant="outline" size="sm" (click)="verDetalle.emit(trabajador)">Ver detalle</app-button>
              </td>
            </tr>
          } @empty {
            <tr>
              <td colspan="8" class="px-3 py-8 text-center text-sm text-gray-600">
                No hay trabajadores liquidados para mostrar.
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class LiquidacionesTrabajadoresGridComponent {
  @Input() trabajadores: LiquidacionTrabajador[] = [];
  @Input() seleccionado: LiquidacionTrabajador | null = null;
  @Output() verDetalle = new EventEmitter<LiquidacionTrabajador>();

  money(value: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(value);
  }
}
