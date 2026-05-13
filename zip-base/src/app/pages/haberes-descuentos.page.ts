import { ChangeDetectionStrategy, Component } from '@angular/core';

import { HaberesDescuentosContainer } from '../features/haberes-descuentos/containers/haberes-descuentos-container/haberes-descuentos-container';

@Component({
  selector: 'app-haberes-descuentos-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HaberesDescuentosContainer],
  template: `<app-haberes-descuentos-container />`,
})
export class HaberesDescuentosPage {}
