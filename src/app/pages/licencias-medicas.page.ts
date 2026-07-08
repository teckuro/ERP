import { ChangeDetectionStrategy, Component } from '@angular/core';

import { LicenciasMedicasContainer } from '../features/licencias-medicas/containers/licencias-medicas-container/licencias-medicas-container';

@Component({
  selector: 'app-licencias-medicas-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LicenciasMedicasContainer],
  template: `<app-licencias-medicas-container />`,
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
export class LicenciasMedicasPage {}
