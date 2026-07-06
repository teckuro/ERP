import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BadgeComponent } from '../../../../shared/components/ui/primitives/badge.component';
import { CardComponent, CardContentComponent } from '../../../../shared/components/ui/primitives/card.component';
import type { LiquidacionPeriodo } from '../../models/liquidacion-oficial.model';

@Component({
  selector: 'app-liquidacion-resumen-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, BadgeComponent, CardComponent, CardContentComponent],
  template: `
    <app-card>
      <app-card-content className="p-4">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <h2 class="text-sm font-semibold text-gray-900">Resumen de liquidaciones</h2>
              <app-badge [variant]="liquidacion ? 'success' : 'default'" size="sm">
                {{ liquidacion ? 'Generadas' : 'Sin generar' }}
              </app-badge>
            </div>
            <p class="mt-1 text-sm text-gray-700">
              {{ liquidacion ? 'Liquidaciones recuperadas desde BD.' : 'Aun no existen liquidaciones oficiales para el periodo.' }}
            </p>
          </div>
          @if (liquidacion) {
            <p class="text-xs text-gray-500">Generadas: {{ formatDate(liquidacion.fechaGeneracion) }}</p>
          }
        </div>

        <dl class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div class="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
            <dt class="text-xs text-gray-500">Trabajadores</dt>
            <dd class="mt-1 text-sm font-semibold text-gray-900">{{ liquidacion?.totalTrabajadores ?? 0 }}</dd>
          </div>
          <div class="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
            <dt class="text-xs text-gray-500">Total haberes</dt>
            <dd class="mt-1 text-sm font-semibold text-gray-900">{{ money(liquidacion?.totalHaberes ?? 0) }}</dd>
          </div>
          <div class="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
            <dt class="text-xs text-gray-500">Total descuentos</dt>
            <dd class="mt-1 text-sm font-semibold text-gray-900">{{ money(liquidacion?.totalDescuentos ?? 0) }}</dd>
          </div>
          <div class="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
            <dt class="text-xs text-gray-500">Liquido a pagar</dt>
            <dd class="mt-1 text-sm font-semibold text-gray-900">{{ money(liquidacion?.totalLiquido ?? 0) }}</dd>
          </div>
        </dl>
      </app-card-content>
    </app-card>
  `,
})
export class LiquidacionResumenCardComponent {
  @Input() liquidacion: LiquidacionPeriodo | null = null;

  money(value: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(value);
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat('es-CL', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(value));
  }
}
