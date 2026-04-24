import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import {
  AlertCircle,
  CheckCircle2,
  Info,
  LoaderCircle,
  TriangleAlert,
  X as XIcon,
} from 'lucide-angular/src/icons';

export type MessageBoxVariant = 'success' | 'error' | 'warning' | 'info' | 'loading';
export type MessageBoxMode = 'inline' | 'modal';

@Component({
  selector: 'app-message-box',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <section
      class="message-box"
      [class.message-modal]="mode === 'modal'"
      [ngClass]="variantClass()"
      [attr.role]="mode === 'modal' ? 'dialog' : liveRole()"
      [attr.aria-modal]="mode === 'modal'"
      [attr.aria-live]="liveRegion()"
    >
      <div class="message-icon" aria-hidden="true">
        <lucide-icon
          class="message-icon-svg"
          [class.message-icon-spin]="variant === 'loading'"
          [img]="icon()"
        ></lucide-icon>
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
            <lucide-icon class="message-dismiss-icon" [img]="closeIcon"></lucide-icon>
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
        padding: 16px;
        background: rgba(15, 23, 42, 0.42);
      }

      .message-box {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        gap: 12px;
        align-items: start;
        width: 100%;
        border: 1px solid #e5e7eb;
        border-left-width: 3px;
        border-radius: 8px;
        background: #ffffff;
        padding: 12px;
        color: #111827;
        box-shadow: none;
      }

      .message-modal {
        grid-template-columns: auto minmax(0, 1fr);
        width: min(100%, 30rem);
        border-left-width: 1px;
        padding: 16px;
        box-shadow: 0 24px 56px rgba(15, 23, 42, 0.22);
      }

      .message-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 6px;
        background: #f8fafc;
        color: #0ea5e9;
      }

      .message-icon-svg,
      .message-dismiss-icon {
        width: 16px;
        height: 16px;
        stroke-width: 2.25;
      }

      .message-copy {
        display: grid;
        gap: 4px;
        min-width: 0;
        padding-top: 1px;
      }

      .message-title {
        margin: 0;
        color: #111827;
        font-size: 0.9rem;
        font-weight: 600;
        letter-spacing: 0;
        line-height: 1.3;
      }

      .message-text,
      :host ::ng-deep .message-detail {
        margin: 0;
        color: #4b5563;
        font-size: 0.84rem;
        font-weight: 550;
        line-height: 1.45;
      }

      .message-actions {
        display: inline-flex;
        flex-wrap: wrap;
        gap: 8px;
        justify-content: flex-end;
        min-width: 0;
      }

      .message-modal .message-actions {
        grid-column: 1 / -1;
        justify-content: flex-end;
        width: 100%;
        padding-top: 4px;
      }

      .message-button,
      .message-dismiss {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        background: #ffffff;
        color: #374151;
        cursor: pointer;
        font-size: 0.82rem;
        font-weight: 500;
        line-height: 1;
        transition: border-color 140ms ease, background 140ms ease, color 140ms ease;
      }

      .message-button {
        min-height: 32px;
        padding: 0 12px;
      }

      .message-button-primary {
        border-color: #2563eb;
        background: #2563eb;
        color: #ffffff;
      }

      .message-button-secondary {
        border-color: #e5e7eb;
        background: #ffffff;
        color: #374151;
      }

      .message-dismiss {
        width: 32px;
        height: 32px;
        padding: 0;
      }

      .message-button-primary:hover {
        border-color: #1d4ed8;
        background: #1d4ed8;
      }

      .message-button-secondary:hover,
      .message-dismiss:hover {
        border-color: #cbd5e1;
        background: #f8fafc;
      }

      .message-success {
        border-color: #bbf7d0;
        border-left-color: #16a34a;
      }

      .message-success .message-icon {
        background: #ecfdf5;
        color: #16a34a;
      }

      .message-error {
        border-color: #fecaca;
        border-left-color: #dc2626;
      }

      .message-error .message-icon {
        background: #fef2f2;
        color: #dc2626;
      }

      .message-warning {
        border-color: #fde68a;
        border-left-color: #f59e0b;
      }

      .message-warning .message-icon {
        background: #fffbeb;
        color: #f59e0b;
      }

      .message-info,
      .message-loading {
        border-color: #bae6fd;
        border-left-color: #0ea5e9;
      }

      .message-info .message-icon,
      .message-loading .message-icon {
        background: #f0f9ff;
        color: #0ea5e9;
      }

      .message-icon-spin {
        animation: message-spin 850ms linear infinite;
      }

      @keyframes message-spin {
        to {
          transform: rotate(360deg);
        }
      }

      @media (max-width: 640px) {
        .message-box,
        .message-modal {
          grid-template-columns: auto minmax(0, 1fr);
        }

        .message-actions {
          grid-column: 1 / -1;
          justify-content: flex-start;
        }

        .message-button {
          flex: 1 1 auto;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .message-icon-spin {
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

  readonly closeIcon = XIcon;
  private readonly successIcon = CheckCircle2;
  private readonly errorIcon = AlertCircle;
  private readonly warningIcon = TriangleAlert;
  private readonly infoIcon = Info;
  private readonly loadingIcon = LoaderCircle;

  @HostBinding('class.message-box-host-modal')
  get isModal(): boolean {
    return this.mode === 'modal';
  }

  variantClass(): string {
    return `message-${this.variant}`;
  }

  liveRole(): 'status' | 'alert' {
    return this.variant === 'error' || this.variant === 'warning' ? 'alert' : 'status';
  }

  liveRegion(): 'polite' | 'assertive' {
    return this.variant === 'error' || this.variant === 'warning' ? 'assertive' : 'polite';
  }

  primaryActionLabel(): string {
    return this.primaryLabel || this.actionLabel;
  }

  icon() {
    switch (this.variant) {
      case 'success':
        return this.successIcon;
      case 'error':
        return this.errorIcon;
      case 'warning':
        return this.warningIcon;
      case 'loading':
        return this.loadingIcon;
      default:
        return this.infoIcon;
    }
  }
}
