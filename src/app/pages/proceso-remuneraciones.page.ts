import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ProcesoMensualContainer } from '../features/nomina-mensual/containers/proceso-mensual-container/proceso-mensual-container';

@Component({
  selector: 'app-proceso-remuneraciones-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProcesoMensualContainer],
  template: `<app-proceso-mensual-container />`,
})
export class ProcesoRemuneracionesPage {}
