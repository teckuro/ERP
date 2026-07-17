import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import { bindShellPageContext } from '../layout/shell-page-context.binding';

/**
 * Placeholder REPORTES-01a: mapa de informes pendiente de implementación.
 * Contrato: docs/codex/modulos/reportes/REPORTES-01-contrato-fase.md
 */
@Component({
  selector: 'app-reportes-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  template: `
    <section class="erp-fullscreen-page report-page" aria-label="Reportes">
      <div class="erp-fullscreen-frame report-frame">
        <header class="report-proximamente">
          <p class="report-proximamente__kicker">Reportes</p>
          <h1 class="report-proximamente__title">Próximamente</h1>
          <p class="report-proximamente__text">
            La bandeja de reportes operativos se implementará en REPORTES-01.
            Mientras tanto puede consultar liquidaciones, Previred y el libro de remuneraciones.
          </p>
          <nav class="report-proximamente__links" aria-label="Salidas ya disponibles">
            <a routerLink="/remuneraciones/liquidaciones">Liquidaciones</a>
            <a routerLink="/remuneraciones/previred">Previred</a>
            <a routerLink="/remuneraciones/lre">Libro de remuneraciones</a>
            <a routerLink="/remuneraciones/nominas">Nóminas</a>
          </nav>
        </header>
      </div>
    </section>
  `,
  styles: [
    `
      .report-page {
        color: #374151;
      }

      .report-frame {
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding: 24px 16px;
      }

      .report-proximamente {
        max-width: 36rem;
        width: 100%;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        background: #fff;
        padding: 16px;
      }

      .report-proximamente__kicker {
        margin: 0 0 4px;
        color: #6b7280;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.02em;
      }

      .report-proximamente__title {
        margin: 0 0 8px;
        color: #111827;
        font-size: 1.125rem;
        font-weight: 700;
        line-height: 1.3;
      }

      .report-proximamente__text {
        margin: 0 0 16px;
        color: #4b5563;
        font-size: 0.875rem;
        line-height: 1.45;
      }

      .report-proximamente__links {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .report-proximamente__links a {
        display: inline-flex;
        align-items: center;
        min-height: 2rem;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        background: #fff;
        padding: 0 12px;
        color: #1f2937;
        font-size: 0.8125rem;
        font-weight: 600;
        text-decoration: none;
      }

      .report-proximamente__links a:hover {
        border-color: #93c5fd;
        background: #eff6ff;
      }
    `,
  ],
})
export class ReportesPage {
  constructor() {
    const destroyRef = inject(DestroyRef);
    bindShellPageContext(destroyRef, () => ({
      breadcrumbs: [{ label: 'Reportes' }],
      statusChip: { label: 'Próximamente', tone: 'neutral' },
    }));
  }
}
