import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface ParametrosInnerTabItem {
  id: string;
  label: string;
}

@Component({
  selector: 'app-parametros-inner-tab-bar',
  standalone: true,
  template: `
    <div class="param-inner-tabs" role="navigation" [attr.aria-label]="ariaLabel">
      <label class="param-inner-tabs__mobile-label" for="param-inner-tab-select">{{ mobileLabel }}</label>
      <select
        id="param-inner-tab-select"
        class="param-inner-tabs__select"
        [value]="activeId"
        (change)="onSelectFromSelect($event)"
      >
        @for (t of tabs; track t.id) {
          <option [value]="t.id">{{ t.label }}</option>
        }
      </select>
      <div class="param-inner-tabs__buttons" role="tablist">
        @for (t of tabs; track t.id) {
          <button
            type="button"
            role="tab"
            class="param-inner-tab"
            [class.param-inner-tab--active]="activeId === t.id"
            [attr.aria-selected]="activeId === t.id"
            (click)="onSelect(t.id)"
          >
            {{ t.label }}
          </button>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .param-inner-tabs {
        display: flex;
        flex-direction: column;
        gap: 6px;
        flex: 0 0 auto;
        width: 100%;
        min-width: 0;
      }

      .param-inner-tabs__mobile-label {
        display: none;
        margin: 0;
        color: #64748b;
        font-size: 0.72rem;
        font-weight: 600;
      }

      .param-inner-tabs__select {
        display: none;
        box-sizing: border-box;
        width: 100%;
        max-width: 100%;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        background: #fff;
        padding: 8px 10px;
        color: #111827;
        font-size: 0.84rem;
      }

      .param-inner-tabs__buttons {
        display: flex;
        flex-wrap: nowrap;
        gap: 6px;
        overflow-x: auto;
        padding-bottom: 4px;
        min-width: 0;
        -webkit-overflow-scrolling: touch;
      }

      .param-inner-tab {
        flex: 0 0 auto;
        position: relative;
        margin: 0;
        border: 1px solid #e5e7eb;
        border-radius: 999px;
        background: #f8fafc;
        padding: 6px 12px;
        color: #475569;
        font-size: 0.78rem;
        font-weight: 600;
        line-height: 1.2;
        cursor: pointer;
        white-space: nowrap;
      }

      .param-inner-tab:hover {
        background: #f1f5f9;
        color: #1e293b;
      }

      .param-inner-tab--active {
        border-color: #2563eb;
        background: #eff6ff;
        color: #1d4ed8;
      }

      @media (max-width: 720px) {
        .param-inner-tabs__mobile-label {
          display: block;
        }

        .param-inner-tabs__select {
          display: block;
        }

        .param-inner-tabs__buttons {
          display: none;
        }
      }
    `,
  ],
})
export class ParametrosInnerTabBarComponent {
  @Input({ required: true }) tabs!: readonly ParametrosInnerTabItem[];
  @Input({ required: true }) activeId!: string;
  @Input() ariaLabel = 'Subsecciones';
  @Input() mobileLabel = 'Vista';

  @Output() activeIdChange = new EventEmitter<string>();

  onSelectFromSelect(event: Event): void {
    const id = (event.target as HTMLSelectElement).value;
    this.onSelect(id);
  }

  onSelect(id: string): void {
    if (id && id !== this.activeId) {
      this.activeIdChange.emit(id);
    }
  }
}
