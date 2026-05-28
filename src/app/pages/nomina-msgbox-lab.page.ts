import { ChangeDetectionStrategy, Component } from '@angular/core';

import { NominaMsgboxLabContainer } from '../features/nomina-mensual/containers/nomina-msgbox-lab/nomina-msgbox-lab-container';

@Component({
  selector: 'app-nomina-msgbox-lab-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NominaMsgboxLabContainer],
  template: `<app-nomina-msgbox-lab-container class="nomina-msgbox-lab-shell" />`,
  styles: [
    `
      :host,
      .nomina-msgbox-lab-shell {
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
export class NominaMsgboxLabPage {}
