import { ChangeDetectionStrategy, Component } from '@angular/core';

import { MovimientosVariablesContainer } from '../features/movimientos-variables/containers/movimientos-variables-container/movimientos-variables-container';

@Component({
  selector: 'app-movimientos-variables-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MovimientosVariablesContainer],
  template: `<app-movimientos-variables-container />`,
})
export class MovimientosVariablesPage {}
