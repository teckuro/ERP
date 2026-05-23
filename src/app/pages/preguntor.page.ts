import { ChangeDetectionStrategy, Component } from '@angular/core';

import { PreguntorContainerComponent } from '../features/asistente-preguntor/containers/preguntor-container/preguntor-container.component';

@Component({
  selector: 'app-preguntor-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PreguntorContainerComponent],
  template: `
    <section class="erp-fullscreen-page" aria-label="Preguntor">
      <div class="erp-fullscreen-frame">
        <div class="erp-fullscreen-scroll">
          <app-preguntor-container />
        </div>
      </div>
    </section>
  `,
})
export class PreguntorPage {}
