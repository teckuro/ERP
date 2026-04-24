import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  Output,
  ViewChild,
  forwardRef,
  inject,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { Check, ChevronDown, Search, X } from 'lucide-angular/src/icons';

export type SearchSelectValue = string | number | null;

export interface SearchSelectOption<T extends SearchSelectValue = SearchSelectValue> {
  value: T;
  label: string;
  description?: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-search-select',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SearchSelectComponent),
      multi: true,
    },
  ],
  template: `
    <div class="select-root" [class.is-disabled]="disabled">
      <button
        type="button"
        class="select-field"
        [id]="id"
        autocomplete="off"
        [class.is-invalid]="invalid"
        [class.has-value]="selectedOption"
        [class.is-open]="open"
        [disabled]="disabled"
        [attr.aria-expanded]="open"
        [attr.aria-label]="ariaLabel || placeholder"
        (click)="togglePanel()"
        (keydown)="handleTriggerKeydown($event)"
      >
        <span class="select-value">{{ selectedOption?.label || placeholder }}</span>
        @if (value !== null && clearable && !disabled) {
          <span
            class="select-icon-button"
            role="button"
            tabindex="-1"
            aria-label="Limpiar seleccion"
            (click)="clearSelection($event)"
          >
            <lucide-icon [img]="clearIcon"></lucide-icon>
          </span>
        }
        <lucide-icon class="select-chevron" [img]="chevronIcon"></lucide-icon>
      </button>

      @if (open) {
        <div
          class="select-panel"
          [class.opens-above]="panelOpenAbove"
          role="listbox"
          [attr.aria-label]="placeholder"
          [style.visibility]="panelReady ? 'visible' : 'hidden'"
        >
          <div class="select-search">
            <lucide-icon [img]="searchIcon"></lucide-icon>
            <input
              #searchInput
              [id]="searchInputDomId"
              type="text"
              autocomplete="new-password"
              autocapitalize="off"
              autocorrect="off"
              aria-autocomplete="none"
              data-1p-ignore="true"
              data-form-type="other"
              data-lpignore="true"
              spellcheck="false"
              role="searchbox"
              [attr.name]="searchInputName || searchInputDomName"
              [attr.placeholder]="searchPlaceholder"
              [value]="searchTerm"
              (input)="updateSearch($event)"
              (keydown)="handleSearchKeydown($event)"
            />
          </div>

          <div class="select-panel-meta">
            <span>{{ filteredOptions.length }} resultado{{ filteredOptions.length === 1 ? '' : 's' }}</span>
            @if (selectedOption) {
              <span class="select-panel-current">{{ selectedOption.label }}</span>
            }
          </div>

          <div class="select-options" [style.max-height.px]="panelOptionsMaxHeight">
            @for (option of filteredOptions; track option.value) {
              <button
                type="button"
                role="option"
                class="select-option"
                [class.is-active]="isActiveOption(option)"
                [class.is-selected]="isSelected(option)"
                [disabled]="option.disabled"
                [attr.aria-selected]="isSelected(option)"
                (mouseenter)="setActiveOption(option)"
                (click)="selectOption(option)"
              >
                <span class="select-option-marker" aria-hidden="true"></span>
                <span class="select-option-text">
                  <span>{{ option.label }}</span>
                  @if (option.description) {
                    <small>{{ option.description }}</small>
                  }
                </span>
                @if (isSelected(option)) {
                  <lucide-icon class="select-check" [img]="checkIcon"></lucide-icon>
                }
              </button>
            } @empty {
              <p class="select-empty">{{ emptyText }}</p>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }

      :host:has(.select-field.is-open) {
        position: relative;
        z-index: 120;
      }

      .select-root {
        position: relative;
        width: 100%;
      }

      .select-field {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto auto;
        align-items: center;
        width: 100%;
        height: 38px;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        background: #ffffff;
        padding: 0 6px 0 10px;
        color: #9ca3af;
        font: inherit;
        font-size: 12px;
        font-weight: 600;
        text-align: left;
        transition: border-color 160ms ease, box-shadow 160ms ease;
      }

      .select-field:hover {
        border-color: #cbd5e1;
      }

      .select-field:focus,
      .select-field.is-open {
        border-color: #2563eb;
        box-shadow: 0 0 0 3px #eff6ff;
        outline: none;
      }

      .select-field.is-invalid {
        border-color: #dc2626;
      }

      .select-field.is-invalid:focus {
        box-shadow: 0 0 0 3px #fef2f2;
      }

      .select-field.has-value {
        color: #111827;
      }

      .select-value {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        line-height: 18px;
      }

      .select-icon-button,
      .select-chevron {
        transition: transform 160ms ease;
      }

      .select-field.is-open .select-chevron {
        transform: rotate(180deg);
        color: #2563eb;
      }

      .select-icon-button,
      .select-chevron {
        display: inline-flex;
        width: 28px;
        height: 28px;
        align-items: center;
        justify-content: center;
        border-radius: 5px;
        color: #6b7280;
      }

      .select-icon-button:hover {
        background: #f9fafb;
        color: #111827;
      }

      .select-icon-button lucide-icon,
      .select-chevron,
      .select-check {
        width: 15px;
        height: 15px;
      }

      .select-panel {
        position: absolute;
        top: calc(100% + 4px);
        right: 0;
        left: 0;
        z-index: 1000;
        min-width: 0;
        width: 100%;
        overflow: hidden;
        border: 1px solid #2563eb;
        border-radius: 0 0 6px 6px;
        background: #ffffff;
        padding: 6px;
        box-shadow:
          0 1px 0 #2563eb inset,
          0 16px 30px rgba(15, 23, 42, 0.14);
      }

      .select-panel.opens-above {
        top: auto;
        bottom: calc(100% + 4px);
        border-radius: 6px 6px 0 0;
        box-shadow:
          0 -1px 0 #2563eb inset,
          0 16px 30px rgba(15, 23, 42, 0.14);
      }

      .select-search {
        display: grid;
        grid-template-columns: 18px minmax(0, 1fr);
        align-items: center;
        height: 34px;
        border: 1px solid #e5e7eb;
        border-radius: 5px;
        background: #ffffff;
        padding: 0 8px;
        color: #6b7280;
      }

      .select-search lucide-icon {
        display: inline-flex;
        width: 14px;
        height: 14px;
        align-items: center;
        justify-content: center;
        justify-self: center;
        line-height: 0;
      }

      .select-search:focus-within {
        border-color: #2563eb;
        box-shadow: 0 0 0 2px #eff6ff;
      }

      .select-search input {
        min-width: 0;
        height: 100%;
        border: 0;
        background: transparent;
        padding: 0 0 0 8px;
        color: #111827;
        font: inherit;
        font-size: 12px;
        font-weight: 600;
        outline: none;
      }

      .select-panel-meta {
        display: flex;
        min-height: 28px;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        border-bottom: 1px solid #eef2f7;
        padding: 0 2px;
        color: #6b7280;
        font-size: 11px;
        font-weight: 500;
      }

      .select-panel-current {
        min-width: 0;
        overflow: hidden;
        color: #111827;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .select-options {
        max-height: 216px;
        overflow: auto;
        padding-top: 4px;
        scrollbar-color: #cbd5e1 #f8fafc;
        scrollbar-width: thin;
      }

      .select-option {
        display: grid;
        grid-template-columns: 3px minmax(0, 1fr) auto;
        width: 100%;
        align-items: center;
        gap: 8px;
        min-height: 34px;
        border: 0;
        border-radius: 5px;
        background: transparent;
        padding: 6px 8px;
        color: #111827;
        text-align: left;
      }

      .select-option:hover:not(:disabled),
      .select-option.is-active {
        background: #f8fafc;
      }

      .select-option.is-selected {
        background: #eff6ff;
        color: #1d4ed8;
      }

      .select-option-marker {
        width: 3px;
        height: 18px;
        border-radius: 999px;
        background: transparent;
      }

      .select-option.is-active .select-option-marker {
        background: #cbd5e1;
      }

      .select-option.is-selected .select-option-marker {
        background: #2563eb;
      }

      .select-option:disabled {
        cursor: not-allowed;
        opacity: 0.55;
      }

      .select-option-text {
        display: grid;
        min-width: 0;
        gap: 2px;
        font-size: 12px;
        font-weight: 500;
      }

      .select-option-text span,
      .select-option-text small {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .select-option-text small {
        color: #6b7280;
        font-size: 11px;
        font-weight: 600;
      }

      .select-check {
        display: inline-flex;
        width: 18px;
        height: 18px;
        align-items: center;
        justify-content: center;
        color: #2563eb;
      }

      .select-check ::ng-deep svg {
        width: 14px;
        height: 14px;
      }

      .select-empty {
        margin: 0;
        padding: 12px 8px;
        color: #6b7280;
        font-size: 12px;
        font-weight: 600;
        text-align: center;
      }

      .is-disabled {
        opacity: 0.72;
      }
    `,
  ],
})
export class SearchSelectComponent implements ControlValueAccessor, OnDestroy {
  private static nextInputId = 0;

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly inputId = SearchSelectComponent.nextInputId++;

  @ViewChild('searchInput')
  private readonly searchInput?: ElementRef<HTMLInputElement>;

  @Input() id = '';
  @Input() ariaLabel = '';
  @Input() placeholder = 'Selecciona una opcion';
  @Input() searchPlaceholder = 'Buscar...';
  @Input() searchInputName = '';
  @Input() emptyText = 'Sin resultados';
  @Input() invalid = false;
  @Input() clearable = false;
  @Input() options: ReadonlyArray<SearchSelectOption> = [];
  @Output() readonly valueChange = new EventEmitter<SearchSelectValue>();

  readonly checkIcon = Check;
  readonly chevronIcon = ChevronDown;
  readonly clearIcon = X;
  readonly searchIcon = Search;
  readonly searchInputDomId = `search-select-search-${this.inputId}`;
  readonly searchInputDomName = `search-select-${this.inputId}-no-autofill`;

  value: SearchSelectValue = null;
  searchTerm = '';
  open = false;
  disabled = false;
  activeIndex = 0;
  panelOptionsMaxHeight = 216;
  panelReady = false;
  panelOpenAbove = false;

  private onChange: (value: SearchSelectValue) => void = () => undefined;
  private onTouched: () => void = () => undefined;
  private readonly panelScrollListener = (event: Event) => this.closeOnExternalScroll(event);
  private panelListenerTimeoutId = 0;

  @HostListener('document:click', ['$event'])
  closeOnOutsideClick(event: MouseEvent): void {
    const target = event.target;

    if (target instanceof Node && this.host.nativeElement.contains(target)) {
      return;
    }

    this.closePanel();
  }

  ngOnDestroy(): void {
    this.detachPanelListeners();
  }

  get selectedOption(): SearchSelectOption | null {
    return this.options.find((option) => option.value === this.value) ?? null;
  }

  get filteredOptions(): SearchSelectOption[] {
    const term = this.normalizeText(this.searchTerm);

    if (!term) {
      return [...this.options];
    }

    return this.options.filter((option) =>
      this.normalizeText(`${option.label} ${option.description ?? ''}`).includes(term),
    );
  }

  writeValue(value: SearchSelectValue): void {
    this.value = value ?? null;
  }

  registerOnChange(fn: (value: SearchSelectValue) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled = disabled;
  }

  togglePanel(): void {
    if (this.disabled) {
      return;
    }

    this.open ? this.closePanel() : this.openPanel();
  }

  openPanel(): void {
    if (this.disabled) {
      return;
    }

    this.open = true;
    this.panelReady = false;
    this.searchTerm = '';
    this.activeIndex = Math.max(
      0,
      this.filteredOptions.findIndex((option) => option.value === this.value),
    );
    this.updatePanelPosition();
    window.setTimeout(() => {
      this.panelReady = true;
      this.cdr.detectChanges();
      this.updatePanelPosition();
      this.cdr.detectChanges();
      this.searchInput?.nativeElement.focus();
      window.clearTimeout(this.panelListenerTimeoutId);
      this.panelListenerTimeoutId = window.setTimeout(() => this.attachPanelListeners(), 80);
    });
  }

  closePanel(): void {
    if (!this.open) {
      return;
    }

    this.open = false;
    this.panelReady = false;
    this.panelOpenAbove = false;
    this.searchTerm = '';
    window.clearTimeout(this.panelListenerTimeoutId);
    this.detachPanelListeners();
    this.onTouched();
  }

  updateSearch(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value;
    this.activeIndex = 0;
    window.setTimeout(() => {
      this.updatePanelPosition();
      this.cdr.detectChanges();
    });
  }

  selectOption(option: SearchSelectOption): void {
    if (option.disabled) {
      return;
    }

    this.value = option.value;
    this.onChange(this.value);
    this.valueChange.emit(this.value);
    this.closePanel();
  }

  clearSelection(event: Event): void {
    event.stopPropagation();
    this.value = null;
    this.onChange(null);
    this.valueChange.emit(null);
    this.onTouched();
  }

  handleTriggerKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.openPanel();
    }
  }

  handleSearchKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closePanel();
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.moveActiveOption(1);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.moveActiveOption(-1);
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      const option = this.filteredOptions[this.activeIndex];

      if (option) {
        this.selectOption(option);
      }
    }
  }

  isSelected(option: SearchSelectOption): boolean {
    return option.value === this.value;
  }

  isActiveOption(option: SearchSelectOption): boolean {
    return this.filteredOptions[this.activeIndex]?.value === option.value;
  }

  setActiveOption(option: SearchSelectOption): void {
    this.activeIndex = Math.max(
      0,
      this.filteredOptions.findIndex((item) => item.value === option.value),
    );
  }

  private moveActiveOption(step: number): void {
    const options = this.filteredOptions.filter((option) => !option.disabled);

    if (options.length === 0) {
      this.activeIndex = 0;
      return;
    }

    const activeOption = this.filteredOptions[this.activeIndex];
    const activeEnabledIndex = Math.max(
      0,
      options.findIndex((option) => option.value === activeOption?.value),
    );
    const nextEnabledIndex = (activeEnabledIndex + step + options.length) % options.length;
    this.setActiveOption(options[nextEnabledIndex]);
  }

  private updatePanelPosition(): void {
    if (!this.open) {
      return;
    }

    const field = this.host.nativeElement.querySelector('.select-field') as HTMLElement | null;

    if (!field) {
      return;
    }

    const rect = field.getBoundingClientRect();
    const viewportPadding = 8;
    const panelChromeHeight = 82;
    const preferredOptionsHeight = 216;
    const preferredPanelHeight = panelChromeHeight + preferredOptionsHeight;
    const spaceBelow = window.innerHeight - rect.bottom - viewportPadding;
    const spaceAbove = rect.top - viewportPadding;
    const openAbove = spaceBelow < preferredPanelHeight && spaceAbove > spaceBelow;
    const availableHeight = Math.max(120, (openAbove ? spaceAbove : spaceBelow) - panelChromeHeight);

    this.panelOpenAbove = openAbove;
    this.panelOptionsMaxHeight = Math.min(preferredOptionsHeight, availableHeight);
  }

  private attachPanelListeners(): void {
    document.addEventListener('scroll', this.panelScrollListener, true);
    window.addEventListener('resize', this.panelScrollListener);
  }

  private detachPanelListeners(): void {
    document.removeEventListener('scroll', this.panelScrollListener, true);
    window.removeEventListener('resize', this.panelScrollListener);
  }

  private closeOnExternalScroll(event: Event): void {
    const target = event.target;

    if (target instanceof Node && this.host.nativeElement.contains(target)) {
      return;
    }

    this.closePanel();
    this.cdr.detectChanges();
  }

  private normalizeText(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }
}
