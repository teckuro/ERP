import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      type="button"
      [disabled]="disabled"
      class="erp-button inline-flex items-center justify-center gap-2 rounded-md border font-medium transition-colors duration-150"
      [class.erp-button--primary]="variant === 'primary'"
      [class.text-white]="variant === 'primary' || variant === 'danger'"
      [class.bg-white]="variant === 'secondary' || variant === 'outline'"
      [class.border-gray-200]="variant === 'secondary' || variant === 'outline'"
      [class.text-gray-700]="variant === 'secondary' || variant === 'outline' || variant === 'ghost'"
      [class.hover:bg-gray-50]="variant === 'secondary' || variant === 'outline'"
      [class.bg-red-600]="variant === 'danger'"
      [class.border-red-600]="variant === 'danger'"
      [class.hover:bg-red-700]="variant === 'danger'"
      [class.hover:border-red-700]="variant === 'danger'"
      [class.bg-transparent]="variant === 'ghost'"
      [class.border-transparent]="variant === 'ghost'"
      [class.hover:bg-gray-100]="variant === 'ghost'"
      [class.px-3]="size === 'sm'"
      [class.h-8]="size === 'sm'"
      [class.px-4]="size === 'md'"
      [class.h-10]="size === 'md'"
      [class.px-6]="size === 'lg'"
      [class.h-10]="size === 'lg'"
      [class.text-sm]="size === 'sm' || size === 'md'"
      [class.text-base]="size === 'lg'"
      [class.opacity-50]="disabled"
      [class.cursor-not-allowed]="disabled"
      [class.cursor-pointer]="!disabled"
      [class]="className"
    >
      <ng-content select="[icon]" />
      <ng-content />
    </button>
  `,
  styles: [
    `
      .erp-button {
        min-width: 0;
        border-radius: 0.5rem;
        font-weight: 600;
        letter-spacing: 0;
        box-shadow: none;
      }

      .erp-button--primary {
        border-color: var(--erp-primary, #1e3a8a);
        background: var(--erp-primary, #1e3a8a);
        color: #ffffff;
      }

      .erp-button--primary:hover:not(:disabled) {
        border-color: var(--erp-primary-hover, #1d4ed8);
        background: var(--erp-primary-hover, #1d4ed8);
      }

      .erp-button--primary:active:not(:disabled) {
        border-color: var(--erp-primary-hover, #1d4ed8);
        background: var(--erp-primary-hover, #1d4ed8);
      }

      .erp-button:focus-visible {
        outline: none;
        box-shadow: 0 0 0 2px var(--erp-primary-ring, rgba(30, 58, 138, 0.18));
      }

      .erp-button:disabled {
        pointer-events: none;
      }

      .erp-button ::ng-deep lucide-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex: 0 0 auto;
        align-self: center;
        line-height: 0;
        vertical-align: middle;
      }

      .erp-button ::ng-deep lucide-icon svg {
        display: block;
        width: 100%;
        height: 100%;
        margin: 0;
        overflow: visible;
      }
    `,
  ],
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() disabled = false;
  @Input() className = '';
}
