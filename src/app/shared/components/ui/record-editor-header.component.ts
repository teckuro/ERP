import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

type RecordHeaderStatusTone = 'draft' | 'success' | 'warning' | 'info' | 'neutral';

@Component({
  selector: 'app-record-editor-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="record-header">
      @if (statusLabel.trim()) {
        <span
          class="record-header-status"
          [ngClass]="statusClass"
          [attr.aria-label]="statusAriaLabel"
        >
          <span aria-hidden="true"></span>
          {{ statusLabel }}
        </span>
      }

      <div class="record-header-title-row">
        <h1>{{ title }}</h1>
      </div>

      <div class="record-header-actions">
        <ng-content select="[record-header-actions]"></ng-content>
      </div>
    </header>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .record-header {
        position: relative;
        display: grid;
        gap: 1rem;
        padding: 1rem;
        background: #fff;
      }

      .record-header-title-row {
        display: flex;
        min-width: 0;
        justify-content: center;
        padding: 0.5rem 8rem;
        text-align: center;
      }

      h1 {
        margin: 0;
        color: #0f172a;
        font-size: 1.55rem;
        font-weight: 850;
        letter-spacing: 0;
        line-height: 1.15;
      }

      .record-header-status {
        position: absolute;
        top: 1rem;
        right: 1rem;
        display: inline-flex;
        min-height: 1.75rem;
        align-items: center;
        justify-content: center;
        gap: 0.45rem;
        padding: 0.25rem 0.7rem;
        border: 1px solid;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 850;
        line-height: 1;
      }

      .record-header-status span {
        width: 0.5rem;
        height: 0.5rem;
        border-radius: 999px;
        background: currentColor;
      }

      .record-header-status--draft {
        border-color: #f8d99a;
        background: #fffbeb;
        color: #92400e;
      }

      .record-header-status--success {
        border-color: #bbf7d0;
        background: #f0fdf4;
        color: #166534;
      }

      .record-header-status--warning {
        border-color: #fed7aa;
        background: #fff7ed;
        color: #9a3412;
      }

      .record-header-status--info {
        border-color: #bfdbfe;
        background: #eff6ff;
        color: #1d4ed8;
      }

      .record-header-status--neutral {
        border-color: #cbd5e1;
        background: #f8fafc;
        color: #475569;
      }

      .record-header-actions {
        display: flex;
        width: 100%;
        min-width: 0;
        align-items: center;
        justify-content: stretch;
        padding-top: 1rem;
        border-top: 1px solid #e2e8f0;
      }

      .record-header-actions ::ng-deep .page-actions-toolbar {
        justify-content: space-between;
        gap: 1rem;
      }

      .record-header-actions ::ng-deep app-page-actions {
        width: 100%;
      }

      @media (max-width: 1024px) {
        .record-header-title-row {
          padding-right: 7rem;
          padding-left: 7rem;
        }

        .record-header-actions ::ng-deep .page-actions-toolbar {
          justify-content: space-between;
        }
      }

      @media (max-width: 640px) {
        .record-header {
          padding-top: 3.5rem;
        }

        .record-header-title-row {
          padding-right: 0;
          padding-left: 0;
        }

        .record-header-actions ::ng-deep .page-actions-toolbar {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
        }
      }
    `,
  ],
})
export class RecordEditorHeaderComponent {
  @Input() title = '';
  @Input() statusLabel = '';
  @Input() statusTone: RecordHeaderStatusTone = 'neutral';
  @Input() statusAriaLabel = 'Estado del registro';

  get statusClass(): string {
    return `record-header-status--${this.statusTone}`;
  }
}
