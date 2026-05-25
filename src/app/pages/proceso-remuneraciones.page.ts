import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ProcesoMensualContainer } from '../features/nomina-mensual/containers/proceso-mensual-container/proceso-mensual-container';

@Component({
  selector: 'app-proceso-remuneraciones-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProcesoMensualContainer],
  template: `<app-proceso-mensual-container class="proceso-remuneraciones-shell" />`,
  styles: [
    `
      :host,
      .proceso-remuneraciones-shell {
        display: flex;
        flex: 1 1 auto;
        flex-direction: column;
        width: 100%;
        height: 100%;
        min-width: 0;
        min-height: 0;
      }
    `,
  ],
})
export class ProcesoRemuneracionesPage {}
