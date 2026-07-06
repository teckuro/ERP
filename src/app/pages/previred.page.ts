import { ChangeDetectionStrategy, Component } from '@angular/core';

import { PreviredExportContainer } from '../features/previred/containers/previred-export-container/previred-export-container';

@Component({
  selector: 'app-previred-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PreviredExportContainer],
  template: `<app-previred-export-container />`,
  styles: `
    :host {
      display: flex;
      flex: 1 1 auto;
      flex-direction: column;
      width: 100%;
      min-width: 0;
      min-height: 0;
      height: 100%;
      overflow: hidden;
    }
  `,
})
export class PreviredPage {}
