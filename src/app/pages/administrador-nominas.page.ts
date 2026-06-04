import { ChangeDetectionStrategy, Component } from '@angular/core';

import { AdministradorNominasContainer } from '../features/nomina-mensual/containers/administrador-nominas-container/administrador-nominas-container';

@Component({
  selector: 'app-administrador-nominas-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AdministradorNominasContainer],
  template: `<app-administrador-nominas-container />`,
  styles: [
    `
      :host {
        display: flex;
        flex: 1 1 auto;
        min-height: 0;
      }
    `,
  ],
})
export class AdministradorNominasPage {}
