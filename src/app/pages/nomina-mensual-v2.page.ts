import { ChangeDetectionStrategy, Component } from '@angular/core';

import { NominaMensualV2Container } from '../features/nomina-mensual-v2/containers/nomina-mensual-v2-container/nomina-mensual-v2-container';

@Component({
  selector: 'app-nomina-mensual-v2-page',
  standalone: true,
  imports: [NominaMensualV2Container],
  template: '<app-nomina-mensual-v2-container />',
  styles: [
    `
      :host {
        display: flex;
        flex: 1 1 auto;
        flex-direction: column;
        width: 100%;
        min-height: 100%;
        min-width: 0;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NominaMensualV2Page {}
