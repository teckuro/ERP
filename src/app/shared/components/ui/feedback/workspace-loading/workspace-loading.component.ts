import { ChangeDetectionStrategy, Component, HostBinding, Input } from '@angular/core';

/**
 * Overlay de carga tipo bitácora / workspace (panel centrado + spinner).
 * Usar con `fill` para ocupar el 100% del contenedor padre.
 */
@Component({
  selector: 'app-workspace-loading',
  standalone: true,
  template: `
    <div class="erp-workspace-loading__backdrop">
      <div class="erp-workspace-loading__panel">
        <span class="erp-workspace-loading__spinner" aria-hidden="true"></span>
        <div class="erp-workspace-loading__copy">
          <p class="erp-workspace-loading__title">{{ title || message }}</p>
          @if (title) {
            <p class="erp-workspace-loading__message">{{ message }}</p>
          }
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        box-sizing: border-box;
      }

      :host(.erp-workspace-loading--fill) {
        position: absolute;
        inset: 0;
        z-index: 20;
        width: auto;
        min-width: 0;
        min-height: 0;
      }

      .erp-workspace-loading__backdrop {
        display: grid;
        width: 100%;
        height: 100%;
        min-height: 100%;
        place-items: center;
        align-content: center;
        justify-items: center;
        border: 0;
        border-radius: 0;
        background: rgb(255 255 255 / 0.86);
        backdrop-filter: blur(2px);
        box-sizing: border-box;
      }

      .erp-workspace-loading__panel {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0;
        width: min(100%, 26.25rem);
        border: 1px solid #d5dce8;
        border-radius: 22px;
        background: #ffffff;
        padding: 2.5rem 2rem 2rem;
        text-align: center;
        box-shadow: 0 24px 60px rgb(15 23 42 / 0.14);
      }

      .erp-workspace-loading__spinner {
        flex: 0 0 auto;
        width: 2rem;
        height: 2rem;
        margin-bottom: 1.1rem;
        border: 2px solid #e4e9f2;
        border-top-color: var(--erp-primary, #2563eb);
        border-radius: 999px;
        animation: erp-workspace-loading-spin 0.75s linear infinite;
      }

      .erp-workspace-loading__copy {
        display: grid;
        gap: 0.35rem;
        max-width: 22rem;
      }

      .erp-workspace-loading__title {
        margin: 0;
        color: #0f172a;
        font-size: 1.1rem;
        font-weight: 600;
        line-height: 1.35;
      }

      .erp-workspace-loading__message {
        margin: 0;
        color: #64748b;
        font-size: 0.875rem;
        line-height: 1.45;
      }

      @keyframes erp-workspace-loading-spin {
        to {
          transform: rotate(1turn);
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspaceLoadingComponent {
  /** Si se entrega, el `message` pasa a ser la línea secundaria. */
  @Input() title: string | null = null;
  @Input({ required: true }) message!: string;

  @HostBinding('class.erp-workspace-loading--fill')
  @Input()
  fill = false;

  @HostBinding('attr.role')
  readonly role = 'status';

  @HostBinding('attr.aria-live')
  readonly ariaLive = 'polite';
}
