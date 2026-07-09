import { ChangeDetectionStrategy, Component } from '@angular/core';

import { AdministracionContainer } from '../features/administracion/containers/administracion-container/administracion-container';

@Component({
  selector: 'app-administracion-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AdministracionContainer],
  template: `<app-administracion-container />`,
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
export class AdministracionPage {}
