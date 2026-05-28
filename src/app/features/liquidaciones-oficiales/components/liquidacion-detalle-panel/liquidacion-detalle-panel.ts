import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

import type { LiquidacionConcepto, LiquidacionTrabajador } from '../../models/liquidacion-oficial.model';

@Component({
  selector: 'app-liquidacion-detalle-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <section class="rounded-md border border-gray-200 bg-white p-4">
      @if (trabajador) {
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 class="text-sm font-semibold text-gray-900">Detalle por trabajador</h2>
            <p class="mt-1 text-sm text-gray-700">{{ trabajador.nombreTrabajador }} - {{ trabajador.rut || 'RUT no disponible' }}</p>
          </div>
          <p class="text-sm font-semibold text-gray-900">Liquido {{ money(trabajador.liquidoPagar) }}</p>
        </div>

        <dl class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <div><dt class="text-gray-500">Base imponible</dt><dd class="font-semibold text-gray-900">{{ money(trabajador.baseImponible) }}</dd></div>
          <div><dt class="text-gray-500">Base tributable</dt><dd class="font-semibold text-gray-900">{{ money(trabajador.baseTributable) }}</dd></div>
          <div><dt class="text-gray-500">Haberes</dt><dd class="font-semibold text-gray-900">{{ money(trabajador.totalHaberes) }}</dd></div>
          <div><dt class="text-gray-500">Descuentos</dt><dd class="font-semibold text-gray-900">{{ money(trabajador.totalDescuentos) }}</dd></div>
        </dl>

        <div class="mt-4 grid gap-4 lg:grid-cols-2">
          <div>
            <h3 class="text-xs font-semibold uppercase text-gray-600">Haberes</h3>
            <ul class="mt-2 divide-y divide-gray-100 rounded-md border border-gray-200">
              @for (concepto of haberes(); track concepto.idLiquidacionConcepto) {
                <li class="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                  <span class="text-gray-700">{{ concepto.nombre }}</span>
                  <span class="font-medium text-gray-900">{{ money(concepto.monto) }}</span>
                </li>
              } @empty {
                <li class="px-3 py-3 text-sm text-gray-500">Sin haberes materializados.</li>
              }
            </ul>
          </div>
          <div>
            <h3 class="text-xs font-semibold uppercase text-gray-600">Descuentos y referencias</h3>
            <ul class="mt-2 divide-y divide-gray-100 rounded-md border border-gray-200">
              @for (concepto of descuentos(); track concepto.idLiquidacionConcepto) {
                <li class="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                  <span class="text-gray-700">{{ concepto.nombre }}</span>
                  <span class="font-medium text-gray-900">{{ money(concepto.monto) }}</span>
                </li>
              } @empty {
                <li class="px-3 py-3 text-sm text-gray-500">Sin descuentos materializados.</li>
              }
            </ul>
          </div>
        </div>

        <div class="mt-4 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-gray-700">
          <p class="font-medium text-gray-900">Trazabilidad tecnica secundaria</p>
          <p class="mt-1">Origen: nómina mensual confirmada. No hay recalculo ni edicion manual de montos.</p>
        </div>
      } @else {
        <p class="text-sm text-gray-600">Selecciona un trabajador para revisar su detalle.</p>
      }
    </section>
  `,
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
