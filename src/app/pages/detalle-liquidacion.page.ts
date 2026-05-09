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
    <div class="space-y-6">
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
        <app-card-content>
          <div class="flex flex-col gap-4 md:flex-row md:items-start">
            <div class="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <lucide-icon class="h-5 w-5" name="circle-alert"></lucide-icon>
            </div>
            <div class="space-y-2">
              <h2 class="text-base font-semibold text-gray-900">No existe liquidacion oficial emitida</h2>
              <p class="text-sm text-gray-600">
                Esta ruta se conserva por compatibilidad, pero no muestra montos demo ni permite descargar, firmar,
                imprimir o enviar documentos. La liquidacion oficial debe nacer desde una fase posterior de cierre
                operativo con snapshot definitivo y trazabilidad persistida.
              </p>
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
