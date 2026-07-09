import { ChangeDetectionStrategy, Component } from '@angular/core';

import { MovimientosVariablesContainer } from '../features/movimientos-variables/containers/movimientos-variables-container/movimientos-variables-container';

@Component({
  selector: 'app-movimientos-variables-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MovimientosVariablesContainer],
  template: `<app-movimientos-variables-container />`,
  styles: [
    `
      :host {
        display: flex;
        flex: 1 1 auto;
        flex-direction: column;
        width: 100%;
        min-width: 0;
        min-height: 0;
        height: 100%;
        overflow: hidden;
        box-sizing: border-box;
      }
    `,
  ],
})
export class MovimientosVariablesPage {}
