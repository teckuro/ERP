import { ChangeDetectionStrategy, Component } from '@angular/core';

import { NovedadesMensualesContainer } from '../features/nomina-mensual/novedades/containers/novedades-mensuales-container/novedades-mensuales-container';

@Component({
  selector: 'app-novedades-mensuales-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NovedadesMensualesContainer],
  template: `<app-novedades-mensuales-container />`,
})
export class NovedadesMensualesPage {}
