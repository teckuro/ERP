import { Component, HostBinding, Input } from '@angular/core';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'default';
type BadgeSize = 'sm' | 'md';

@Component({
  selector: 'app-badge',
  standalone: true,
  template: ` <ng-content /> `,
  styles: [
    `
      :host {
        display: inline-flex;
        align-items: center;
        border: 1px solid #daddd6;
        border-radius: 0.45rem;
        background: #fafaf7;
        color: #647084;
        font-weight: 650;
        line-height: 1;
        white-space: nowrap;
      }

      :host(.erp-badge--sm) {
        padding: 0.22rem 0.5rem;
        font-size: 0.68rem;
      }

      :host(.erp-badge--md) {
        padding: 0.28rem 0.62rem;
        font-size: 0.75rem;
      }

      :host(.erp-badge--success) {
        border-color: #bbf7d0;
        background: #f0fdf4;
        color: #166534;
      }

      :host(.erp-badge--warning) {
        border-color: #fde68a;
        background: #fffbeb;
        color: #a16207;
      }

      :host(.erp-badge--error) {
        border-color: #fecaca;
        background: #fef2f2;
        color: #b91c1c;
      }

      :host(.erp-badge--info) {
        border-color: #bfdbfe;
        background: #eff6ff;
        color: #1e40af;
      }
    `,
  ],
})
export class BadgeComponent {
  @Input() variant: BadgeVariant = 'default';
  @Input() size: BadgeSize = 'md';

  @HostBinding('class')
  get hostClass(): string {
    return `erp-badge erp-badge--${this.variant} erp-badge--${this.size}`;
  }
}
