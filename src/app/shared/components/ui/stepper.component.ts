import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

export type StepperStatus = 'pending' | 'invalid' | 'complete';

export interface StepperItem {
  id: string;
  label: string;
  status?: StepperStatus;
  disabled?: boolean;
}

@Component({
  selector: 'app-stepper',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="stepper-shell">
      @if (showMeta) {
        <div class="stepper-meta">
          <p class="stepper-caption">{{ caption }}</p>
          <p class="stepper-progress">Paso {{ activeStepNumber() }} de {{ steps.length }}</p>
        </div>
      }

      <div class="stepper-list" role="tablist" [attr.aria-label]="ariaLabel">
        @for (step of steps; track step.id; let index = $index; let last = $last) {
          <div class="stepper-segment">
            <button
              type="button"
              class="stepper-item"
              [class.is-active]="isActive(step.id)"
              [class.is-complete]="!isActive(step.id) && step.status === 'complete'"
              [class.is-invalid]="!isActive(step.id) && step.status === 'invalid'"
              [class.is-upcoming]="!isActive(step.id) && (!step.status || step.status === 'pending')"
              [class.is-disabled]="step.disabled"
              [disabled]="step.disabled"
              [attr.aria-selected]="isActive(step.id)"
              (click)="select(step.id)"
            >
              <span class="stepper-circle">
                @if (!isActive(step.id) && step.status === 'complete') {
                  <span class="stepper-check">✓</span>
                } @else {
                  {{ index + 1 }}
                }
              </span>

              <span class="stepper-copy">
                <span class="stepper-label">{{ step.label }}</span>
                <span class="stepper-state">{{ stateLabel(step) }}</span>
              </span>
            </button>

            @if (!last) {
              <span
                class="stepper-connector"
                [class.is-complete]="step.status === 'complete' || isActive(step.id)"
              ></span>
            }
          </div>
        }
      </div>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }

      .stepper-shell {
        display: grid;
        gap: 1rem;
      }

      .stepper-meta {
        display: grid;
        gap: 0.2rem;
      }

      .stepper-caption {
        margin: 0;
        font-size: 0.78rem;
        font-weight: 600;
        color: #64748b;
      }

      .stepper-progress {
        margin: 0;
        font-size: 0.88rem;
        font-weight: 600;
        color: #0f172a;
      }

      .stepper-list {
        display: flex;
        align-items: flex-start;
        gap: 0;
        min-width: 0;
      }

      .stepper-segment {
        display: flex;
        align-items: flex-start;
        flex: 1 1 0;
        min-width: 0;
      }

      .stepper-item {
        display: flex;
        min-width: 0;
        width: 100%;
        align-items: flex-start;
        gap: 0.65rem;
        border: 0;
        background: transparent;
        padding: 0;
        text-align: left;
        color: #334155;
        cursor: pointer;
        transition: opacity 180ms ease, transform 180ms ease;
      }

      .stepper-item:hover:not(.is-disabled) {
        transform: translateY(-1px);
      }

      .stepper-item.is-disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }

      .stepper-circle {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 1.9rem;
        height: 1.9rem;
        flex-shrink: 0;
        border-radius: 999px;
        border: 2px solid #cbd5e1;
        background: #ffffff;
        font-size: 0.82rem;
        font-weight: 700;
        color: #64748b;
        transition: border-color 180ms ease, background 180ms ease, color 180ms ease;
      }

      .stepper-copy {
        display: grid;
        gap: 0.22rem;
        min-width: 0;
        flex: 1 1 auto;
        padding-top: 0.16rem;
      }

      .stepper-label {
        display: block;
        min-width: 0;
        font-size: 0.9rem;
        font-weight: 600;
        line-height: 1.2;
        color: #334155;
        white-space: normal;
        word-break: break-word;
        overflow-wrap: anywhere;
        overflow: hidden;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        min-height: calc(1.2em * 2);
      }

      .stepper-state {
        display: block;
        min-width: 0;
        font-size: 0.76rem;
        font-weight: 500;
        line-height: 1.2;
        color: #64748b;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .stepper-item.is-active .stepper-circle {
        border-color: #2563eb;
        background: #2563eb;
        color: #ffffff;
        box-shadow: 0 6px 14px rgba(37, 99, 235, 0.18);
      }

      .stepper-item.is-active .stepper-label {
        color: #0f172a;
      }

      .stepper-item.is-active .stepper-state {
        color: #2563eb;
      }

      .stepper-item.is-complete .stepper-circle {
        border-color: #059669;
        background: #059669;
        color: #ffffff;
      }

      .stepper-item.is-complete .stepper-label {
        color: #0f172a;
      }

      .stepper-item.is-complete .stepper-state {
        color: #059669;
      }

      .stepper-item.is-invalid .stepper-circle {
        border-color: #dc2626;
        background: #ffffff;
        color: #dc2626;
      }

      .stepper-item.is-invalid .stepper-state {
        color: #dc2626;
      }

      .stepper-item.is-upcoming .stepper-circle {
        border-color: #cbd5e1;
        background: #f8fafc;
        color: #94a3b8;
      }

      .stepper-connector {
        display: block;
        flex: 1 1 auto;
        height: 2px;
        min-width: 0.5rem;
        margin: 0.9rem 0.35rem 0;
        border-radius: 999px;
        background: #dbe2ea;
        transition: background 180ms ease;
      }

      .stepper-connector.is-complete {
        background: linear-gradient(90deg, #2563eb, #60a5fa);
      }

      .stepper-check {
        line-height: 1;
      }

      @media (max-width: 1024px) {
        .stepper-list {
          display: grid;
          gap: 0.85rem;
        }

        .stepper-segment {
          display: block;
        }

        .stepper-connector {
          display: none;
        }
      }
    `,
  ],
})
export class StepperComponent {
  @Input() steps: readonly StepperItem[] = [];
  @Input() activeId = '';
  @Input() caption = 'Progreso';
  @Input() ariaLabel = 'Pasos del formulario';
  /**
   * Controls whether the metadata block (caption and progress) should be
   * rendered. When set to `false` the progress text will not appear
   * inside the stepper and can be displayed elsewhere by the parent
   * component. Defaults to `true`.
   */
  @Input() showMeta = true;
  @Output() readonly activeIdChange = new EventEmitter<string>();

  activeStepNumber(): number {
    const index = this.steps.findIndex((step) => step.id === this.activeId);
    return index >= 0 ? index + 1 : 1;
  }

  isActive(stepId: string): boolean {
    return stepId === this.activeId;
  }

  select(id: string): void {
    if (id === this.activeId) {
      return;
    }

    this.activeIdChange.emit(id);
  }

  stateLabel(step: StepperItem): string {
    if (step.id === this.activeId) {
      return 'En curso';
    }

    switch (step.status) {
      case 'complete':
        return 'Completado';
      case 'invalid':
        return 'Requiere revisión';
      default:
        return 'Pendiente';
    }
  }
}
