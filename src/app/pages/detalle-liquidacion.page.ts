import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { CardComponent, CardContentComponent } from '../shared/components/ui/card.component';
import { ButtonComponent } from '../shared/components/ui/button.component';
import { PeriodoActivoService } from '../core/services/periodo-activo.service';

@Component({
  selector: 'app-detalle-liquidacion-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, LucideAngularModule, CardComponent, CardContentComponent, ButtonComponent],
  template: `
    <div class="space-y-4">
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 class="text-xl font-semibold text-gray-900">Detalle de liquidacion oficial</h1>
          <p class="mt-1 text-sm text-gray-600">Periodo {{ periodoActivo.etiqueta() }}</p>
        </div>
        <app-button variant="outline" routerLink="/remuneraciones/liquidaciones">
          <lucide-icon icon class="h-4 w-4" name="arrow-left"></lucide-icon>
          Volver
        </app-button>
      </div>

      <app-card>
        <app-card-content className="p-4">
          <div class="flex flex-col gap-3 md:flex-row md:items-start">
            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-amber-50 text-amber-700">
              <lucide-icon class="h-5 w-5" name="circle-alert"></lucide-icon>
            </div>
            <div class="space-y-2">
              <h2 class="text-base font-semibold text-gray-900">No hay liquidacion oficial para mostrar</h2>
              <p class="text-sm text-gray-600">
                El detalle aparece cuando Liquidaciones oficiales ya tiene una salida interna generada desde una nomina
                cerrada operativamente. Esta vista no muestra datos de ejemplo ni habilita acciones formales.
              </p>
              <div class="flex flex-wrap gap-2 pt-1">
                <app-button variant="primary" routerLink="/remuneraciones/liquidaciones">
                  <lucide-icon icon class="h-4 w-4" name="list-checks"></lucide-icon>
                  Volver a liquidaciones oficiales
                </app-button>
                <app-button variant="outline" routerLink="/remuneraciones/proceso-mensual">
                  <lucide-icon icon class="h-4 w-4" name="calculator"></lucide-icon>
                  Preparar nomina
                </app-button>
              </div>
              <div class="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs leading-5 text-gray-600">
                La trazabilidad tecnica se consulta en el flujo de Preparar nomina y en el detalle interno cuando existe
                una liquidacion real del periodo.
              </div>
            </div>
          </div>
        </app-card-content>
      </app-card>
    </div>
  `,
})
export class DetalleLiquidacionPage {
  readonly periodoActivo = inject(PeriodoActivoService);
}
