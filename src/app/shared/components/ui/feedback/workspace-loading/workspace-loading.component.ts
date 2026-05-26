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
        <span class="erp-workspace-loading__label">{{ message }}</span>
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
        background: #ffffff;
        box-sizing: border-box;
      }

      .erp-workspace-loading__panel {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        border: 1px solid var(--erp-border, #dde3ea);
        border-radius: 8px;
        background: #ffffff;
        padding: 12px 18px;
        color: var(--erp-ink, #2c2c2a);
        font-size: 0.875rem;
        font-weight: 700;
        line-height: 1.35;
        box-shadow: 0 14px 36px rgba(20, 32, 51, 0.1);
      }

      .erp-workspace-loading__label {
        margin: 0;
      }

      .erp-workspace-loading__spinner {
        width: 18px;
        height: 18px;
        flex: 0 0 18px;
        border: 2px solid var(--erp-border, #dde3ea);
        border-top-color: var(--erp-primary, #1e3a8a);
        border-radius: 999px;
        animation: erp-workspace-loading-spin 0.75s linear infinite;
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
  @Input({ required: true }) message!: string;

  @HostBinding('class.erp-workspace-loading--fill')
  @Input()
  fill = false;

  @HostBinding('attr.role')
  readonly role = 'status';

  @HostBinding('attr.aria-live')
  readonly ariaLive = 'polite';
}
