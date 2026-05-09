import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { CardComponent, CardContentComponent } from '../shared/components/ui/card.component';
import { ButtonComponent } from '../shared/components/ui/button.component';
import { PeriodoActivoService } from '../core/services/periodo-activo.service';

@Component({
  selector: 'app-liquidaciones-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, LucideAngularModule, CardComponent, CardContentComponent, ButtonComponent],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 class="text-xl font-semibold text-gray-900">Liquidaciones oficiales</h1>
          <p class="mt-1 text-sm text-gray-600">Periodo {{ periodoActivo.etiqueta() }}</p>
        </div>
        <app-button variant="outline" routerLink="/remuneraciones/proceso-mensual">
          <lucide-icon icon class="h-4 w-4" name="arrow-left"></lucide-icon>
          Preparar nomina
        </app-button>
      </div>

      <app-card>
        <app-card-content>
          <div class="flex flex-col gap-4 md:flex-row md:items-start">
            <div class="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <lucide-icon class="h-5 w-5" name="circle-alert"></lucide-icon>
            </div>
            <div class="space-y-3">
              <div>
                <h2 class="text-base font-semibold text-gray-900">Modulo no disponible para operacion real</h2>
                <p class="mt-1 text-sm text-gray-600">
                  El flujo actual llega hasta resultado preliminar guardado y aprobacion operativa interna. La emision
                  de liquidaciones oficiales queda pendiente de una fase posterior.
                </p>
              </div>
              <div class="grid gap-3 text-sm text-gray-700 md:grid-cols-2">
                <div class="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <p class="font-medium text-gray-900">Disponible hoy</p>
                  <p class="mt-1">Preparar nomina, calcular preliminar, guardar resultado y aprobar internamente.</p>
                </div>
                <div class="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <p class="font-medium text-gray-900">Pendiente</p>
                  <p class="mt-1">Liquidacion oficial, PDF, firma, envio, cierre, Previred, LRE y archivo de banco.</p>
                </div>
              </div>
            </div>
          </div>
        </app-card-content>
      </app-card>
    </div>
  `,
})
export class LiquidacionesPage {
  readonly periodoActivo = inject(PeriodoActivoService);
}
