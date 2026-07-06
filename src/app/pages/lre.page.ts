import { ChangeDetectionStrategy, Component } from '@angular/core';

import { LreExportContainer } from '../features/lre/containers/lre-export-container/lre-export-container';

@Component({
  selector: 'app-lre-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LreExportContainer],
  template: `<app-lre-export-container />`,
  styles: `:host { display:flex; flex:1; min-height:0; height:100%; overflow:hidden; }`,
})
export class LrePage {}
