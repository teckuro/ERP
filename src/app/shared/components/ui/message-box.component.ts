import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';

export type MessageBoxVariant = 'success' | 'error' | 'warning' | 'info' | 'loading';
export type MessageBoxMode = 'inline' | 'modal';

@Component({
  selector: 'app-message-box',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section
      class="message-box"
      [class.message-modal]="mode === 'modal'"
      [ngClass]="variantClass()"
      [attr.role]="mode === 'modal' ? 'dialog' : 'status'"
      [attr.aria-modal]="mode === 'modal'"
      [attr.aria-live]="liveRegion()"
    >
      <div class="message-icon" aria-hidden="true">
        @if (variant === 'loading') {
          <span class="message-spinner"></span>
        } @else {
          {{ iconLabel() }}
        }
      </div>

      <div class="message-copy">
        @if (title) {
          <p class="message-title">{{ title }}</p>
        }

        @if (message) {
          <p class="message-text">{{ message }}</p>
        }

        <ng-content></ng-content>
      </div>

      <div class="message-actions">
        @if (secondaryLabel) {
          <button type="button" class="message-button message-button-secondary" (click)="secondary.emit()">
            {{ secondaryLabel }}
          </button>
        }

        @if (primaryActionLabel()) {
          <button type="button" class="message-button message-button-primary" (click)="action.emit()">
            {{ primaryActionLabel() }}
          </button>
        }

        @if (dismissible) {
          <button type="button" class="message-dismiss" [attr.aria-label]="dismissLabel" (click)="dismiss.emit()">
            x
          </button>
        }
      </div>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      :host.message-box-host-modal {
        position: fixed;
        inset: 0;
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1.25rem;
        background: rgba(15, 23, 42, 0.46);
      }

      .message-box {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        align-items: start;
        gap: 0.9rem;
        width: 100%;
        padding: 0.95rem 1rem;
        border: 1px solid;
        border-radius: 0.85rem;
        box-shadow:
          0 18px 38px rgba(15, 23, 42, 0.05),
          inset 0 1px 0 rgba(255, 255, 255, 0.95);
      }

      .message-modal {
        grid-template-columns: minmax(0, 1fr);
        justify-items: center;
        width: min(100%, 32rem);
        padding: 1.5rem;
        border-color: rgba(226, 232, 240, 0.95);
        border-radius: 1.25rem;
        background:
          linear-gradient(180deg, rgba(255, 255, 255, 0.99), rgba(248, 250, 252, 0.98)),
          radial-gradient(circle at top right, rgba(226, 232, 240, 0.42), transparent 34%);
        color: #0f172a;
        text-align: center;
        box-shadow:
          0 28px 70px rgba(15, 23, 42, 0.22),
          inset 0 1px 0 rgba(255, 255, 255, 0.95);
      }

      .message-modal .message-icon {
        width: 2.7rem;
        height: 2.7rem;
        font-size: 0.95rem;
      }

      .message-modal .message-copy {
        justify-items: center;
        gap: 0.5rem;
      }

      .message-modal .message-title {
        font-size: 1.12rem;
        letter-spacing: 0;
        color: #0f172a;
      }

      .message-modal .message-text {
        max-width: 26rem;
        font-size: 0.92rem;
        color: #475569;
      }

      .message-modal .message-actions {
        justify-content: center;
        width: 100%;
        margin-top: 0.45rem;
      }

      .message-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 1.8rem;
        height: 1.8rem;
        border-radius: 999px;
        font-size: 0.88rem;
        font-weight: 800;
        line-height: 1;
      }

      .message-copy {
        display: grid;
        gap: 0.2rem;
        min-width: 0;
      }

      .message-title {
        margin: 0;
        font-size: 0.9rem;
        font-weight: 700;
        letter-spacing: 0;
        line-height: 1.25;
      }

      .message-text {
        margin: 0;
        font-size: 0.85rem;
        line-height: 1.45;
      }

      .message-actions {
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
      }

      .message-button,
      .message-dismiss {
        border: 1px solid transparent;
        border-radius: 1rem;
        background: rgba(255, 255, 255, 0.78);
        color: inherit;
        cursor: pointer;
        font-size: 0.82rem;
        font-weight: 700;
        line-height: 1;
        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
        transition: border-color 160ms ease, background 160ms ease, box-shadow 160ms ease, transform 160ms ease;
      }

      .message-button {
        min-width: 8.75rem;
        height: 2.75rem;
        padding: 0 1rem;
      }

      .message-button-primary {
        border-color: #0284c7;
        background: linear-gradient(180deg, #0284c7, #1d4ed8);
        color: #ffffff;
      }

      .message-button-secondary {
        border-color: #e2e8f0;
        background: rgba(255, 255, 255, 0.96);
        color: #334155;
      }

      .message-dismiss {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 1.9rem;
        height: 1.9rem;
      }

      .message-button:hover,
      .message-dismiss:hover {
        transform: translateY(-1px);
        box-shadow: 0 8px 18px rgba(15, 23, 42, 0.1);
      }

      .message-button-primary:hover {
        border-color: #0369a1;
        background: linear-gradient(180deg, #0369a1, #1d4ed8);
      }

      .message-button-secondary:hover,
      .message-dismiss:hover {
        border-color: #cbd5e1;
        background: #f8fafc;
      }

      .message-success {
        border-color: #d1fae5;
        background: #f8fffb;
        color: #0f172a;
      }

      .message-success .message-icon {
        background: #ecfdf5;
        color: #047857;
      }

      .message-error {
        border-color: #fecaca;
        background: #fffafa;
        color: #0f172a;
      }

      .message-error .message-icon {
        background: #fef2f2;
        color: #b91c1c;
      }

      .message-warning {
        border-color: #fde68a;
        background: #fffdf5;
        color: #0f172a;
      }

      .message-warning .message-icon {
        background: #fef3c7;
        color: #b45309;
      }

      .message-info,
      .message-loading {
        border-color: #cbd5e1;
        background: #f8fafc;
        color: #0f172a;
      }

      .message-info .message-icon,
      .message-loading .message-icon {
        background: #e0f2fe;
        color: #0369a1;
      }

      .message-spinner {
        width: 0.9rem;
        height: 0.9rem;
        border: 2px solid currentColor;
        border-right-color: transparent;
        border-radius: 999px;
        animation: message-spin 800ms linear infinite;
      }

      @keyframes message-spin {
        to {
          transform: rotate(360deg);
        }
      }

      @media (max-width: 640px) {
        .message-box {
          grid-template-columns: auto minmax(0, 1fr);
        }

        .message-modal {
          grid-template-columns: minmax(0, 1fr);
        }

        .message-actions {
          grid-column: 2;
          justify-self: start;
        }

        .message-modal .message-actions {
          grid-column: auto;
          justify-self: center;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .message-spinner {
          animation: none;
        }
      }
    `,
  ],
})
export class MessageBoxComponent {
  @Input() variant: MessageBoxVariant = 'info';
  @Input() mode: MessageBoxMode = 'inline';
  @Input() title = '';
  @Input() message = '';
  @Input() actionLabel = '';
  @Input() primaryLabel = '';
  @Input() secondaryLabel = '';
  @Input() dismissible = false;
  @Input() dismissLabel = 'Cerrar mensaje';
  @Output() readonly action = new EventEmitter<void>();
  @Output() readonly secondary = new EventEmitter<void>();
  @Output() readonly dismiss = new EventEmitter<void>();

  @HostBinding('class.message-box-host-modal')
  get isModal(): boolean {
    return this.mode === 'modal';
  }

  variantClass(): string {
    return `message-${this.variant}`;
  }

  liveRegion(): 'polite' | 'assertive' {
    return this.variant === 'error' || this.variant === 'warning' ? 'assertive' : 'polite';
  }

  primaryActionLabel(): string {
    return this.primaryLabel || this.actionLabel;
  }

  iconLabel(): string {
    switch (this.variant) {
      case 'success':
        return 'OK';
      case 'error':
        return '!';
      case 'warning':
        return '!';
      default:
        return 'i';
    }
  }
}
