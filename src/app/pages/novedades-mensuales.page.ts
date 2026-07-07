import { ChangeDetectionStrategy, Component } from '@angular/core';

import { NovedadesMensualesContainer } from '../features/nomina-mensual/novedades/containers/novedades-mensuales-container/novedades-mensuales-container';

@Component({
  selector: 'app-novedades-mensuales-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NovedadesMensualesContainer],
  template: `<app-novedades-mensuales-container />`,
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
export class NovedadesMensualesPage {}
