import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ParametrosWorkspaceContainer } from '../features/parametros-generales/containers/parametros-workspace-container/parametros-workspace-container';

@Component({
  selector: 'app-parametros-page',
  standalone: true,
  imports: [ParametrosWorkspaceContainer],
  template: '<app-parametros-workspace-container />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParametrosPage {}
