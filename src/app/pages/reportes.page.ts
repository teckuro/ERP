import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import { PeriodoActivoService } from '../core/services/periodo-activo.service';
import { bindShellPageContext } from '../layout/shell-page-context.binding';
import { BadgeComponent } from '../shared/components/ui/primitives/badge.component';
import {
  CardComponent,
  CardContentComponent,
  CardHeaderComponent,
} from '../shared/components/ui/primitives/card.component';

@Component({
  selector: 'app-reportes-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <section class="erp-fullscreen-page report-page" aria-label="Reportes">
      <div class="erp-fullscreen-frame report-frame">En Desarrollo 🛠️</div>
    </section>
  `,
  styles: [
    `
      .report-content {
        display: grid;
        gap: 1rem;
        padding: 12px;
        align-content: start;
      }

      .report-link,
      .report-tile {
        text-decoration: none;
      }

      .report-link {
        display: inline-flex;
        height: 2.25rem;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        border: 1px solid #e5e7eb;
        border-radius: 0.375rem;
        background: #fff;
        padding: 0 0.75rem;
        color: #1f2937;
        font-size: 0.875rem;
        font-weight: 700;
      }

      .report-link:hover,
      .report-tile:hover {
        border-color: #93c5fd;
        background: #eff6ff;
      }

      .report-tile,
      .report-future {
        display: block;
        border: 1px solid #e5e7eb;
        border-radius: 0.375rem;
        padding: 0.75rem;
      }

      .report-tile {
        background: #fff;
      }

      .report-future {
        background: #f9fafb;
      }

      .report-tabbar {
        display: flex;
        align-items: flex-end;
        width: fit-content;
        max-width: 100%;
        gap: 0.2rem;
        overflow-x: auto;
        border: 1px solid #e5e7eb;
        border-bottom-color: #dbe2ea;
        border-radius: 8px 8px 0 0;
        background: #f8fafc;
        padding: 0.3rem 0.3rem 0;
      }

      .report-tabbar button {
        position: relative;
        min-height: 2.1rem;
        flex: 0 0 auto;
        border: 1px solid transparent;
        border-bottom-color: #dbe2ea;
        border-radius: 7px 7px 0 0;
        background: #ffffff;
        color: #4b5563;
        font-size: 0.875rem;
        font-weight: 700;
        padding: 0 0.68rem 0 1.25rem;
        white-space: nowrap;
      }

      .report-tabbar button::before {
        content: '';
        position: absolute;
        left: 0.65rem;
        top: 50%;
        width: 0.38rem;
        height: 0.38rem;
        border-radius: 999px;
        background: #cbd5e1;
        transform: translateY(-50%);
      }

      .report-tabbar button:hover {
        border-color: #cbd5e1;
        background: #f8fafc;
      }

      .report-tabbar button:focus-visible {
        outline: 2px solid #bfdbfe;
        outline-offset: 2px;
      }

      .report-tabbar button.is-active {
        border-color: #c7d0c4;
        border-bottom-color: #ffffff;
        background: #ffffff;
        color: #111827;
        margin-bottom: -1px;
      }

      .report-tabbar button.is-active::before {
        background: #2563eb;
      }

      .report-future-list {
        display: grid;
        gap: 0;
      }

      .report-future {
        border-width: 0 0 1px;
        border-radius: 0;
        padding: 0.6rem 0;
      }

      .report-tile strong,
      .report-future strong {
        display: block;
        color: #111827;
        font-size: 0.875rem;
        font-weight: 700;
        line-height: 1.25;
      }

      .report-tile span,
      .report-future span {
        display: block;
        margin-top: 0.25rem;
        color: #4b5563;
        font-size: 0.75rem;
        line-height: 1.45;
      }
    `,
  ],
})
export class ReportesPage {
  readonly periodoActivo = inject(PeriodoActivoService);
  private readonly router = inject(Router);
  readonly activeTab = signal<'disponibles' | 'futuros'>('disponibles');

  constructor() {
    bindShellPageContext(
      inject(DestroyRef),
      () => ({
        breadcrumbs: [{ label: 'Reportes' }],
        primaryAction: {
          label: 'Ver liquidaciones',
          actionId: 'ruta:/remuneraciones/liquidaciones',
        },
      }),
      {
        onPrimaryAction: () => {
          void this.router.navigateByUrl('/remuneraciones/liquidaciones');
        },
      },
    );
  }

  onTabKeydown(event: KeyboardEvent): void {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'ArrowLeft' || event.key === 'Home' ? 'disponibles' : 'futuros';
    this.activeTab.set(next);
    queueMicrotask(() => {
      const id = next === 'disponibles' ? 'report-tab-disponibles' : 'report-tab-futuros';
      document.getElementById(id)?.focus();
    });
  }
}
