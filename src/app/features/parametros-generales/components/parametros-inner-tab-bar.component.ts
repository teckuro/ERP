import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  SearchSelectComponent,
  SearchSelectOption,
  SearchSelectValue,
} from '../../../shared/components/ui/forms/search-select.component';

export interface ParametrosInnerTabItem {
  id: string;
  label: string;
}

@Component({
  selector: 'app-parametros-inner-tab-bar',
  standalone: true,
  imports: [FormsModule, SearchSelectComponent],
  template: `
    <div class="param-inner-tabs parametros-inner-tabs" role="navigation" [attr.aria-label]="ariaLabel">
      <label class="param-inner-tabs__mobile-label" for="param-inner-tab-select">{{ mobileLabel }}</label>
      <div class="param-inner-tabs__select">
        <app-search-select
          id="param-inner-tab-select"
          [ngModel]="activeId"
          (ngModelChange)="onSelectFromSearch($event)"
          [options]="tabSelectOptions"
          searchPlaceholder="Buscar seccion"
          placeholder="Selecciona"
        ></app-search-select>
      </div>
      <div class="param-inner-tabs__buttons parametros-inner-tabs__buttons" role="tablist">
        @for (t of tabs; track t.id) {
          <button
            type="button"
            role="tab"
            class="param-inner-tab parametros-inner-tab-button"
            [class.param-inner-tab--active]="activeId === t.id"
            [class.parametros-inner-tab-active]="activeId === t.id"
            [attr.aria-selected]="activeId === t.id"
            [attr.aria-current]="activeId === t.id ? 'page' : null"
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
        gap: 0;
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
      }

      .param-inner-tabs__select ::ng-deep .select-field {
        border-radius: 8px;
        height: var(--erp-control-height, 21px);
        min-height: var(--erp-control-height, 21px);
        font-size: 0.78rem;
      }

      .param-inner-tabs__buttons {
        display: flex;
        flex-wrap: nowrap;
        align-items: flex-end;
        gap: 3px;
        overflow-x: auto;
        width: 100%;
        max-width: 100%;
        min-width: 0;
        padding: 5px 5px 0;
        border: 1px solid #e2e8f0;
        border-bottom-color: #dbe2ea;
        border-radius: 9px 9px 0 0;
        background: #fafaf7;
        scrollbar-width: none;
        -ms-overflow-style: none;
        -webkit-overflow-scrolling: touch;
      }

      .param-inner-tabs__buttons::-webkit-scrollbar {
        display: none;
        width: 0;
        height: 0;
      }

      .param-inner-tab {
        flex: 0 0 auto;
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        min-height: 26px;
        margin: 0;
        border: 1px solid #dbe2ea;
        border-bottom-color: #dbe2ea;
        border-radius: 8px 8px 0 0;
        background: #ffffff;
        padding: 0 9px 1px;
        color: #475569;
        font-size: 0.76rem;
        font-weight: 600;
        line-height: 1.2;
        cursor: pointer;
        white-space: nowrap;
        transition:
          background 160ms ease,
          border-color 160ms ease,
          color 160ms ease,
          box-shadow 160ms ease;
      }

      .param-inner-tab::before {
        content: '';
        width: 5px;
        height: 5px;
        flex: 0 0 auto;
        border-radius: 999px;
        background: #cbd5e1;
      }

      .param-inner-tab:hover {
        border-color: #cbd5e1;
        background: #f8fafc;
        color: #1e293b;
      }

      .param-inner-tab:focus-visible {
        outline: none;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
      }

      .param-inner-tab--active {
        border-color: #cbd5e1;
        border-bottom-color: #ffffff;
        background: #ffffff;
        color: #172033;
        margin-bottom: -1px;
        box-shadow: inset 0 0 0 1px #eef2f7;
      }

      .param-inner-tab--active::before {
        background: #94a3b8;
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

  get tabSelectOptions(): SearchSelectOption<string>[] {
    return this.tabs.map((tab) => ({ value: tab.id, label: tab.label }));
  }

  onSelectFromSearch(value: SearchSelectValue): void {
    const id = value === null || value === undefined ? '' : String(value);
    this.onSelect(id);
  }

  onSelect(id: string): void {
    if (id && id !== this.activeId) {
      this.activeIdChange.emit(id);
    }
  }
}
