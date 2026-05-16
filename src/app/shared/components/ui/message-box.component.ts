import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import {
  AlertCircle,
  CheckCircle2,
  CircleHelp,
  Info,
  LoaderCircle,
  TriangleAlert,
  X as XIcon,
} from 'lucide-angular/src/icons';

export type MessageBoxVariant = 'success' | 'error' | 'warning' | 'info' | 'confirm' | 'loading';
export type MessageBoxMode = 'inline' | 'modal';

@Component({
  selector: 'app-message-box',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <section
      class="message-box"
      [class.message-modal]="mode === 'modal'"
      [class.message-modal--headline]="useModalHeadlineLayout()"
      [ngClass]="variantClass()"
      [attr.role]="mode === 'modal' ? 'dialog' : liveRole()"
      [attr.aria-modal]="mode === 'modal'"
      [attr.aria-live]="liveRegion()"
    >
      <header class="message-header">
        <div class="message-icon" aria-hidden="true">
          <lucide-icon
            class="message-icon-svg"
            [class.message-icon-spin]="variant === 'loading'"
            [img]="icon()"
          ></lucide-icon>
        </div>

        <div class="message-heading">
          @if (title) {
            <p class="message-title">{{ title }}</p>
          }
        </div>

        @if (dismissible) {
          <button type="button" class="message-dismiss" [attr.aria-label]="dismissLabel" (click)="dismiss.emit()">
            <lucide-icon class="message-dismiss-icon" [img]="closeIcon"></lucide-icon>
          </button>
        }
      </header>

      <!-- Un solo ng-content: Angular proyecta solo en el primer slot del template. -->
      <div class="message-body" [class.message-copy--headline]="useModalHeadlineLayout()">
        @if (message) {
          <p class="message-text">{{ message }}</p>
        }

        @if (detail) {
          <p class="message-detail">{{ detail }}</p>
        }

        <ng-content></ng-content>
      </div>

      <footer class="message-actions" [class.message-actions--headline]="useModalHeadlineLayout()">
        @if (secondaryLabel) {
          <button type="button" class="message-button message-button-secondary" (click)="secondary.emit()">
            {{ secondaryLabel }}
          </button>
        }

        @if (tertiaryLabel) {
          <button type="button" class="message-button message-button-secondary" (click)="tertiary.emit()">
            {{ tertiaryLabel }}
          </button>
        }

        @if (fourthLabel) {
          <button type="button" class="message-button message-button-secondary" (click)="fourth.emit()">
            {{ fourthLabel }}
          </button>
        }

        @if (primaryActionLabel()) {
          <button type="button" class="message-button message-button-primary" (click)="action.emit()">
            {{ primaryActionLabel() }}
          </button>
        }

      </footer>
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
        z-index: 13000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        background: rgba(15, 23, 42, 0.42);
      }

      .message-box {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: 0;
        width: 100%;
        border: 1px solid #d8dee8;
        border-radius: 8px;
        background: #ffffff;
        padding: 12px;
        color: #111827;
        box-shadow: none;
      }

      .message-modal,
      .message-modal.message-modal--headline {
        width: min(100%, 34rem);
        padding: 0;
        border: 1px solid #cfd7e3;
        border-radius: 8px;
        background: #ffffff;
        box-shadow: 0 18px 42px rgba(15, 23, 42, 0.2);
      }

      .message-header {
        display: grid;
        grid-template-columns: 34px minmax(0, 1fr) auto;
        gap: 10px;
        align-items: center;
        min-width: 0;
        border-bottom: 1px solid #edf1f5;
        padding: 12px;
      }

      .message-modal .message-header {
        grid-template-columns: 38px minmax(0, 1fr) auto;
        padding: 14px 16px;
      }

      .message-heading {
        min-width: 0;
      }

      .message-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        min-width: 32px;
        min-height: 32px;
        border: 1px solid #d8dee8;
        border-radius: 8px;
        background: #f8fafc;
        color: #2563eb;
        line-height: 1;
      }

      .message-modal .message-icon,
      .message-modal.message-modal--headline .message-icon {
        width: 36px;
        height: 36px;
        min-width: 36px;
        min-height: 36px;
      }

      .message-icon-svg,
      .message-dismiss-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 16px;
        height: 16px;
        line-height: 1;
        stroke-width: 2.2;
      }

      .message-modal .message-icon-svg,
      .message-modal.message-modal--headline .message-icon-svg {
        width: 18px;
        height: 18px;
      }

      :host ::ng-deep .message-icon-svg svg,
      :host ::ng-deep .message-dismiss-icon svg {
        display: block;
        width: 100%;
        height: 100%;
      }

      .message-body,
      .message-copy--headline {
        display: grid;
        gap: 6px;
        min-width: 0;
        padding: 12px;
      }

      .message-modal .message-body {
        padding: 14px 16px;
      }

      .message-title,
      .message-title--headline {
        margin: 0;
        color: #111827;
        font-size: 0.92rem;
        font-weight: 700;
        letter-spacing: 0;
        line-height: 1.25;
      }

      .message-modal .message-title,
      .message-modal.message-modal--headline .message-title {
        font-size: 0.98rem;
      }

      .message-text,
      :host ::ng-deep .message-detail {
        margin: 0;
        color: #4b5563;
        font-size: 0.84rem;
        font-weight: 500;
        line-height: 1.45;
      }

      :host ::ng-deep .message-detail {
        white-space: pre-line;
      }

      .message-actions,
      .message-actions--headline {
        display: inline-flex;
        flex-wrap: wrap;
        gap: 8px;
        justify-content: flex-end;
        min-width: 0;
        padding: 12px;
        border-top: 1px solid #edf1f5;
        background: #f8fafc;
      }

      .message-modal .message-actions,
      .message-modal.message-modal--headline .message-actions--headline {
        width: 100%;
        padding: 12px 16px;
        justify-content: flex-end;
      }

      .message-modal.message-confirm .message-actions {
        background: #ffffff;
        justify-content: flex-end;
      }

      .message-button,
      .message-dismiss {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 1px solid #cfd7e3;
        border-radius: 6px;
        background: #ffffff;
        color: #374151;
        cursor: pointer;
        font-size: 0.82rem;
        font-weight: 650;
        line-height: 1;
        transition: border-color 140ms ease, background 140ms ease, color 140ms ease;
      }

      .message-button {
        min-height: 32px;
        padding: 0 12px;
      }

      .message-modal .message-button {
        min-height: 34px;
        padding: 0 14px;
      }

      .message-modal .message-button-secondary {
        background: #ffffff;
      }

      .message-modal .message-button-primary {
        min-width: 8.75rem;
      }

      .message-button-primary {
        border-color: #2563eb;
        background: #2563eb;
        color: #ffffff;
      }

      .message-button-secondary {
        border-color: #cfd7e3;
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
        border-color: #94a3b8;
        background: #f8fafc;
        color: #111827;
      }

      .message-success .message-icon {
        border-color: #bbf7d0;
        background: #f0fdf4;
        color: #15803d;
      }

      .message-error .message-icon {
        border-color: #fecaca;
        background: #fef2f2;
        color: #dc2626;
      }

      .message-warning .message-icon {
        border-color: #fde68a;
        background: #fffbeb;
        color: #b45309;
      }

      .message-info .message-icon,
      .message-confirm .message-icon,
      .message-loading .message-icon {
        border-color: #bfdbfe;
        background: #eff6ff;
        color: #2563eb;
      }

      .message-loading.message-modal {
        text-align: left;
      }

      .message-loading .message-actions,
      .message-loading .message-dismiss {
        display: none;
      }

      .message-loading .message-body {
        padding-top: 10px;
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
        .message-modal,
        .message-modal.message-modal--headline {
          width: 100%;
        }

        .message-actions,
        .message-modal .message-actions,
        .message-modal.message-modal--headline .message-actions--headline {
          justify-content: flex-end;
        }

        .message-modal.message-confirm .message-actions {
          justify-content: flex-end;
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
  /** Texto secundario (p. ej. periodo, detalle técnico). Opcional. */
  @Input() detail = '';
  @Input() actionLabel = '';
  /** Texto del botón principal; si está vacío se usa `actionLabel`. Si ambos están vacíos, no se muestra el botón. */
  @Input() primaryLabel = '';
  @Input() secondaryLabel = '';
  @Input() tertiaryLabel = '';
  @Input() fourthLabel = '';
  @Input() dismissible = false;
  @Input() dismissLabel = 'Cerrar mensaje';
  /**
   * Si es true y `mode === 'modal'`, el título y el ícono comparten una fila (título izquierda, ícono derecha).
   * Por defecto false: layout clásico del ERP sin cambios.
   */
  @Input() modalHeadlineSplit = false;
  @Output() readonly action = new EventEmitter<void>();
  @Output() readonly secondary = new EventEmitter<void>();
  @Output() readonly tertiary = new EventEmitter<void>();
  @Output() readonly fourth = new EventEmitter<void>();
  @Output() readonly dismiss = new EventEmitter<void>();

  readonly closeIcon = XIcon;
  private readonly successIcon = CheckCircle2;
  private readonly errorIcon = AlertCircle;
  private readonly warningIcon = TriangleAlert;
  private readonly infoIcon = Info;
  private readonly confirmIcon = CircleHelp;
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

  useModalHeadlineLayout(): boolean {
    return this.modalHeadlineSplit && this.mode === 'modal';
  }

  icon() {
    switch (this.variant) {
      case 'success':
        return this.successIcon;
      case 'error':
        return this.errorIcon;
      case 'warning':
        return this.warningIcon;
      case 'confirm':
        return this.confirmIcon;
      case 'loading':
        return this.loadingIcon;
      default:
        return this.infoIcon;
    }
  }
}
