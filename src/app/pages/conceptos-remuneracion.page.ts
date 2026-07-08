import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ConceptosRemuneracionContainer } from '../features/haberes-descuentos/containers/conceptos-remuneracion-container/conceptos-remuneracion-container';

@Component({
  selector: 'app-conceptos-remuneracion-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ConceptosRemuneracionContainer],
  template: `<app-conceptos-remuneracion-container />`,
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
export class ConceptosRemuneracionPage {}
