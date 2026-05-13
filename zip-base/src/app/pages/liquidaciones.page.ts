import { ChangeDetectionStrategy, Component } from '@angular/core';

import { LiquidacionesOficialesContainer } from '../features/liquidaciones-oficiales/containers/liquidaciones-oficiales-container/liquidaciones-oficiales-container';

@Component({
  selector: 'app-liquidaciones-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LiquidacionesOficialesContainer],
  template: `<app-liquidaciones-oficiales-container />`,
})
export class LiquidacionesPage {}
