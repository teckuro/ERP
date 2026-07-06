import { ChangeDetectionStrategy, Component } from '@angular/core';

import { LiquidacionesOficialesContainer } from '../features/liquidaciones-oficiales/containers/liquidaciones-oficiales-container/liquidaciones-oficiales-container';

@Component({
  selector: 'app-liquidaciones-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LiquidacionesOficialesContainer],
  template: `<app-liquidaciones-oficiales-container />`,
  styles: `
    :host {
      display: flex;
      flex: 1 1 auto;
      flex-direction: column;
      width: 100%;
      min-width: 0;
      min-height: 0;
      height: 100%;
      overflow: hidden;
    }
  `,
})
export class LiquidacionesPage {}
