import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  HostListener,
  Input,
  Injector,
  OnDestroy,
  Output,
  ViewChild,
  afterNextRender,
  forwardRef,
  inject,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { Check, ChevronDown, Search, X } from 'lucide-angular/src/icons';

import {
  autoUpdate,
  computePosition,
  flip,
  offset,
  shift,
  size,
} from '@floating-ui/dom';

/** Enfoca sin `scrollIntoView` implícito (evita saltos del scroll del contenedor o de la página). */
function focusWithoutScroll(element: HTMLElement | null): void {
  element?.focus({ preventScroll: true });
}

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
        #selectField
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
          #selectPanel
          class="select-panel"
          [class.opens-above]="panelOpenAbove"
          role="listbox"
          [attr.aria-label]="placeholder"
          [style.visibility]="floatingLayoutDone ? 'visible' : 'hidden'"
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

          <div class="select-options">
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
              <div class="select-empty" role="status">
                <span>Sin coincidencias</span>
                <small>{{ emptyText }}</small>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      /*
       * Tokens ERP (docs/codex/ui-form-guidelines.md): respaldo si el arbol no hereda :root;
       * alineacion con inputs/calendar (~22px alto).
       */
      :host {
        display: block;
        box-sizing: border-box;
        width: 100%;
        font-family: var(--erp-font-sans, inherit);
        --erp-control-height: 22px;
        --erp-field-min-width: 190px;
        --erp-text-sm: 0.72rem;
        --erp-select-panel-z: 11060;
        --erp-select-host-z-open: 120;
      }

      /**
       * Al abrir, el host sube en el stacking context (encima de celdas vecinas / filas del grid)
       * sin depender del panel (que va con position:fixed controlada por Floating UI).
       */
      :host.select-panel-host-open {
        isolation: isolate;
        z-index: var(--erp-select-host-z-open);
      }

      .select-root {
        width: 100%;
      }

      .select-field {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto auto;
        align-items: center;
        width: 100%;
        height: var(--erp-control-height, 22px);
        min-height: var(--erp-control-height, 22px);
        border: 1px solid #daddd6;
        border-radius: 6px;
        background: #ffffff;
        padding: 0 4px 0 8px;
        color: #8a94a6;
        font: inherit;
        font-size: var(--erp-text-sm, 0.72rem);
        font-weight: 500;
        text-align: left;
        transition: border-color 160ms ease, box-shadow 160ms ease;
      }

      .select-field:hover {
        border-color: #c7d0c4;
      }

      .select-field:focus,
      .select-field.is-open {
        border-color: #2563eb;
        box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.14);
        outline: none;
      }

      .select-field.is-invalid {
        border-color: #dc2626;
      }

      .select-field.is-invalid:focus {
        box-shadow: 0 0 0 2px #fef2f2;
      }

      .select-field.has-value {
        color: #172033;
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
        width: calc(var(--erp-control-height, 22px) - 2px);
        height: calc(var(--erp-control-height, 22px) - 2px);
        align-items: center;
        justify-content: center;
        border-radius: 5px;
        color: #647084;
      }

      .select-icon-button:hover {
        background: #fafaf7;
        color: #172033;
      }

      .select-icon-button lucide-icon,
      .select-chevron,
      .select-check {
        width: 15px;
        height: 15px;
      }

      .select-panel {
        box-sizing: border-box;
        min-width: 0;
        overflow: hidden;
        pointer-events: auto;
        z-index: var(--erp-select-panel-z);
        transition: none;
        animation: none;
        border: 1px solid #c7d0c4;
        border-radius: 0 0 6px 6px;
        background: #ffffff;
        padding: 6px;
        box-shadow: 0 10px 24px rgba(15, 23, 42, 0.1);
      }

      .select-panel.opens-above {
        border-radius: 6px 6px 0 0;
        box-shadow: 0 10px 24px rgba(15, 23, 42, 0.1);
      }

      .select-search {
        display: grid;
        grid-template-columns: 18px minmax(0, 1fr);
        align-items: center;
        height: calc(var(--erp-control-height, 22px) + 6px);
        border: 1px solid #daddd6;
        border-radius: 5px;
        background: #ffffff;
        padding: 0 8px;
        color: #647084;
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
        box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.14);
      }

      .select-search input {
        min-width: 0;
        height: 100%;
        border: 0;
        background: transparent;
        padding: 0 0 0 8px;
        color: #172033;
        font: inherit;
        font-size: var(--erp-text-sm, 0.72rem);
        font-weight: 500;
        outline: none;
      }

      .select-panel-meta {
        display: flex;
        min-height: 28px;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        border-bottom: 1px solid #eef1ec;
        padding: 0 2px;
        color: #647084;
        font-size: 11px;
        font-weight: 500;
      }

      .select-panel-current {
        min-width: 0;
        overflow: hidden;
        color: #172033;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .select-options {
        max-height: 216px;
        overflow: auto;
        padding-top: 4px;
        scrollbar-color: #c7d0c4 #eef1ec;
        scrollbar-width: thin;
      }

      .select-option {
        display: grid;
        grid-template-columns: 3px minmax(0, 1fr) auto;
        width: 100%;
        align-items: center;
        gap: 8px;
        min-height: calc(var(--erp-control-height, 22px) + 6px);
        border: 0;
        border-radius: 5px;
        background: transparent;
        padding: 6px 8px;
        color: #172033;
        text-align: left;
      }

      .select-option:hover:not(:disabled),
      .select-option.is-active {
        background: #fafaf7;
      }

      .select-option.is-selected {
        background: #eff6ff;
        color: #1e40af;
      }

      .select-option-marker {
        width: 3px;
        height: 18px;
        border-radius: 999px;
        background: transparent;
      }

      .select-option.is-active .select-option-marker {
        background: #c7d0c4;
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
        color: #647084;
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
        display: grid;
        gap: 3px;
        margin: 4px 0 0;
        border: 1px solid #daddd6;
        border-radius: 6px;
        background: #fafaf7;
        padding: 10px 8px;
        color: #647084;
        text-align: center;
      }

      .select-empty span {
        color: #172033;
        font-size: 12px;
        font-weight: 650;
        line-height: 1.2;
      }

      .select-empty small {
        color: #647084;
        font-size: 11px;
        font-weight: 500;
        line-height: 1.3;
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
  private readonly injector = inject(Injector);
  private readonly inputId = SearchSelectComponent.nextInputId++;

  @HostBinding('class.select-panel-host-open')
  protected get selectPanelHostOpen(): boolean {
    return this.open;
  }

  @ViewChild('searchInput')
  private readonly searchInput?: ElementRef<HTMLInputElement>;

  @ViewChild('selectField', { read: ElementRef })
  private readonly selectFieldRef?: ElementRef<HTMLElement>;

  @ViewChild('selectPanel', { read: ElementRef })
  private readonly selectPanelRef?: ElementRef<HTMLElement>;

  @Input() id = '';
  @Input() ariaLabel = '';
  @Input() placeholder = 'Selecciona una opcion';
  @Input() searchPlaceholder = 'Buscar...';
  @Input() searchInputName = '';
  @Input() emptyText = 'Sin resultados';
  @Input() invalid = false;
  @Input() clearable = false;
  @Input() options: ReadonlyArray<SearchSelectOption> = [];
  @Input() disabled = false;
  @Output() readonly valueChange = new EventEmitter<SearchSelectValue>();

  readonly checkIcon = Check;
  readonly chevronIcon = ChevronDown;
  readonly clearIcon = X;
  readonly searchIcon = Search;
  readonly searchInputDomId = `search-select-search-${this.inputId}`;
  readonly searchInputDomName = `search-select-${this.inputId}-no-autofill`;

  /** Reservado visual arriba de la zona scroll (búsqueda + meta): coherente con panelChrome histórico. */
  private static readonly PANEL_ABOVE_OPTIONS_RESERVED_PX = 90;

  value: SearchSelectValue = null;
  searchTerm = '';
  open = false;
  activeIndex = 0;
  /** Oculta el panel hasta que la primera corrida de Floating UI fije ancho/posicion (evita flash y desalineacion). */
  floatingLayoutDone = false;
  panelOpenAbove = false;

  private onChange: (value: SearchSelectValue) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  /** Limpieza devuelta por `autoUpdate` de Floating UI (scroll/resize/animaciones). */
  private floatingDispose?: () => void;

  /** Coalesce reflows al filtrar (evita ráfagas ResizeObserver ↔ autoUpdate). */
  private searchLayoutFrameId = 0;

  @HostListener('document:click', ['$event'])
  closeOnOutsideClick(event: MouseEvent): void {
    const target = event.target;

    if (target instanceof Node && this.host.nativeElement.contains(target)) {
      return;
    }

    this.closePanel();
  }

  ngOnDestroy(): void {
    this.cancelQueuedSearchLayout();
    this.detachFloatingUi();
  }

  private cancelQueuedSearchLayout(): void {
    if (this.searchLayoutFrameId !== 0) {
      cancelAnimationFrame(this.searchLayoutFrameId);
      this.searchLayoutFrameId = 0;
    }
  }

  private getReferenceEl(): HTMLElement | null {
    return (
      this.selectFieldRef?.nativeElement ??
      (this.host.nativeElement.querySelector('.select-field') as HTMLElement | null)
    );
  }

  private getFloatingEl(): HTMLElement | null {
    return (
      this.selectPanelRef?.nativeElement ??
      (this.host.nativeElement.querySelector('.select-panel') as HTMLElement | null)
    );
  }

  /**
   * Iguala el ancho del panel al boton disparador *antes* de flip/shift.
   * Si el panel sigue con ancho "natural" o 100% del host, shift/flip miden mal y el panel queda desfasado.
   */
  private syncFloatingWidthToMatchReference(reference: HTMLElement, floating: HTMLElement): void {
    const rw = reference.getBoundingClientRect().width;
    const wCss = `${rw}px`;
    floating.style.boxSizing = 'border-box';
    floating.style.width = wCss;
    floating.style.minWidth = wCss;
    floating.style.maxWidth = wCss;
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

    this.open ? this.closePanel() : this.openPanel('click');
  }

  /**
   * @param origin Clic en el campo: no enfocamos la búsqueda (evita scroll de la página / contenedor).
   * Desde teclado (Enter/flechas): enfocamos con `preventScroll` para escritura rápida.
   */
  openPanel(origin: 'click' | 'keyboard' = 'keyboard'): void {
    if (this.disabled) {
      return;
    }

    this.open = true;
    this.floatingLayoutDone = false;
    this.searchTerm = '';
    this.activeIndex = Math.max(
      0,
      this.filteredOptions.findIndex((option) => option.value === this.value),
    );

    this.cdr.detectChanges();

    afterNextRender(
      () => {
        if (!this.open || this.disabled) {
          return;
        }
        this.attachFloatingUi();

        if (origin === 'keyboard') {
          requestAnimationFrame(() => focusWithoutScroll(this.searchInput?.nativeElement ?? null));
        }
      },
      { injector: this.injector },
    );
  }

  closePanel(): void {
    if (!this.open) {
      return;
    }

    this.cancelQueuedSearchLayout();
    this.detachFloatingUi();

    this.open = false;
    this.floatingLayoutDone = false;
    this.panelOpenAbove = false;
    this.searchTerm = '';
    this.onTouched();
  }

  updateSearch(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value;
    this.activeIndex = 0;
    this.cancelQueuedSearchLayout();
    this.searchLayoutFrameId = requestAnimationFrame(() => {
      this.searchLayoutFrameId = 0;
      void this.runFloatingUpdate();
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
      this.openPanel('keyboard');
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

  private attachFloatingUi(): void {
    this.detachFloatingUi();

    const reference = this.getReferenceEl();
    const floating = this.getFloatingEl();

    if (!reference || !floating || !this.open) {
      return;
    }

    /** Ancho estable desde el primer frame (luego `size.apply` lo mantiene alineado a `rects.reference`). */
    this.syncFloatingWidthToMatchReference(reference, floating);

    this.floatingDispose = autoUpdate(
      reference,
      floating,
      () => {
        void this.runFloatingUpdate();
      },
      {
        ancestorScroll: true,
        ancestorResize: true,
        elementResize: true,
        layoutShift: false,
        animationFrame: false,
      },
    );
  }

  private detachFloatingUi(): void {
    this.floatingDispose?.();
    this.floatingDispose = undefined;
  }

  private async runFloatingUpdate(): Promise<void> {
    if (!this.open) {
      return;
    }

    const reference = this.getReferenceEl();
    const floating = this.getFloatingEl();

    if (!reference || !floating) {
      return;
    }

    this.syncFloatingWidthToMatchReference(reference, floating);

    const reserved = SearchSelectComponent.PANEL_ABOVE_OPTIONS_RESERVED_PX;
    const result = await computePosition(reference, floating, {
      placement: 'bottom-start',
      strategy: 'fixed',
      middleware: [
        offset(0),
        flip({
          fallbackPlacements: ['top-start'],
        }),
        shift({ padding: 8 }),
        size({
          padding: { top: 8, bottom: 8 },
          apply({ availableHeight, elements, rects }) {
            const wCss = `${rects.reference.width}px`;
            const f = elements.floating;
            f.style.boxSizing = 'border-box';
            f.style.width = wCss;
            f.style.minWidth = wCss;
            f.style.maxWidth = wCss;

            const scrollArea = f.querySelector('.select-options') as HTMLElement | null;

            if (scrollArea && typeof availableHeight === 'number') {
              const forOptions = Math.max(availableHeight - reserved, 0);
              const mh = `${Math.max(96, Math.min(216, forOptions))}px`;
              if (scrollArea.style.maxHeight !== mh) {
                scrollArea.style.maxHeight = mh;
              }
            }
          },
        }),
      ],
    });

    const x = Math.round(result.x);
    const y = Math.round(result.y);

    const next = {
      position: result.strategy,
      transform: 'none',
      left: `${x}px`,
      top: `${y}px`,
      right: 'auto',
      bottom: 'auto',
    } as const;

    let mutated = false;

    if (
      floating.style.position !== next.position ||
      floating.style.transform !== next.transform ||
      floating.style.left !== next.left ||
      floating.style.top !== next.top ||
      floating.style.right !== next.right ||
      floating.style.bottom !== next.bottom
    ) {
      floating.style.position = next.position;
      floating.style.transform = next.transform;
      floating.style.left = next.left;
      floating.style.top = next.top;
      floating.style.right = next.right;
      floating.style.bottom = next.bottom;
      mutated = true;
    }

    const openAboveNext = result.placement.startsWith('top');
    if (this.panelOpenAbove !== openAboveNext) {
      this.panelOpenAbove = openAboveNext;
      mutated = true;
    }

    if (!this.floatingLayoutDone) {
      this.floatingLayoutDone = true;
      mutated = true;
    }

    if (mutated) {
      this.cdr.markForCheck();
    }
  }

  private normalizeText(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }
}
