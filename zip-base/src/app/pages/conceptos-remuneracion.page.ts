import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ConceptosRemuneracionContainer } from '../features/haberes-descuentos/containers/conceptos-remuneracion-container/conceptos-remuneracion-container';

@Component({
  selector: 'app-conceptos-remuneracion-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ConceptosRemuneracionContainer],
  template: `<app-conceptos-remuneracion-container />`,
})
export class ConceptosRemuneracionPage {}
