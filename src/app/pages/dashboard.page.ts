import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ResumenContainer } from '../features/resumen/containers/resumen-container/resumen-container';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ResumenContainer],
  template: `<app-resumen-container />`,
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
export class DashboardPage {}
