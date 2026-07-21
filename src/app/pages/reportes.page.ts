import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

import { bindShellPageContext } from '../layout/shell-page-context.binding';

/**
 * Placeholder REPORTES-01a hasta habilitar la bandeja de informes.
 * Contrato: docs/codex/modulos/reportes/REPORTES-01-contrato-fase.md
 */
@Component({
  selector: 'app-reportes-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  template: `
    <section class="erp-fullscreen-page report-page" aria-label="Reportes">
      <div class="report-build" role="status">
        <lucide-icon name="construction" [size]="28" aria-hidden="true"></lucide-icon>
        <p class="report-build__label">En construcción</p>
      </div>
    </section>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        flex: 1 1 auto;
        width: 100%;
        min-width: 0;
        min-height: 0;
        height: 100%;
      }

      .report-page {
        display: flex;
        flex: 1 1 auto;
        align-items: center;
        justify-content: center;
        min-height: 0;
        background: #fff;
      }

      .report-build {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        color: #92400e;
      }

      .report-build__label {
        margin: 0;
        font-size: 0.9375rem;
        font-weight: 600;
        line-height: 1.3;
      }
    `,
  ],
})
export class ReportesPage {
  constructor() {
    const destroyRef = inject(DestroyRef);
    bindShellPageContext(destroyRef, () => ({
      breadcrumbs: [{ label: 'Reportes' }],
      statusChip: { label: 'En construcción', tone: 'warning' },
    }));
  }
}
