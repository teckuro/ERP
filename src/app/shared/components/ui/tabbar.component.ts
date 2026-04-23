import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  QueryList,
  SimpleChanges,
  ViewChild,
  ViewChildren,
  computed,
  signal,
} from '@angular/core';

export type TabbarStatus = 'pending' | 'invalid' | 'complete';
export type TabbarDisplayMode = 'default' | 'focus-active';

export interface TabbarItem {
  id: string;
  label: string;
  description?: string;
  status?: TabbarStatus;
  disabled?: boolean;
}

@Component({
  selector: 'app-tabbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div #track class="tabbar-track" [class.is-focus-active-mode]="displayMode === 'focus-active'">
      <div
        class="tabbar-indicator"
        [style.transform]="indicatorTransform()"
        [style.width.px]="indicatorWidth()"
        [style.opacity]="indicatorWidth() > 0 ? 1 : 0"
      ></div>

      @for (item of items; track item.id) {
        <button
          #tabButton
          type="button"
          class="tabbar-button"
          [class.is-active]="activeId === item.id"
          [class.is-complete]="item.id !== activeId && item.status === 'complete'"
          [class.is-invalid]="item.id !== activeId && item.status === 'invalid'"
          [class.is-upcoming]="item.id !== activeId && (!item.status || item.status === 'pending')"
          [class.is-disabled]="item.disabled"
          [disabled]="item.disabled"
          [attr.aria-pressed]="activeId === item.id"
          (click)="select(item.id)"
        >
          <span class="tabbar-copy">
            <span class="tabbar-label-row">
              <span class="tabbar-label">{{ item.label }}</span>
            </span>

            @if (item.description && showDescription === true && shouldShowDescription(item)) {
              <span class="tabbar-description">{{ item.description }}</span>
            }
          </span>
        </button>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }

      .tabbar-track {
        position: relative;
        display: grid;
        grid-template-columns: repeat(var(--tab-count, 1), minmax(var(--tab-min-width), 1fr));
        width: var(--tabbar-width);
        padding: 0.2rem 0.25rem 0;
        border: 0;
        border-radius: 8px 8px 0 0;
        background: transparent;
        box-shadow: none;
      }

      .tabbar-track.is-focus-active-mode {
        display: flex;
        align-items: stretch;
      }

      .tabbar-indicator {
        position: absolute;
        left: 0;
        bottom: 0;
        z-index: 0;
        border-radius: 8px 8px 0 0;
        background: #ffffff;
        border: 1px solid rgba(203, 213, 225, 0.95);
        border-bottom-color: rgba(248, 250, 252, 1);
        box-shadow: none;
        transition:
          transform 280ms cubic-bezier(0.22, 1, 0.36, 1),
          width 280ms cubic-bezier(0.22, 1, 0.36, 1),
          opacity 180ms ease;
      }

      .tabbar-button {
        position: relative;
        z-index: 0;
        display: flex;
        align-items: center;
        justify-content: flex-start;
        min-height: 3.65rem;
        width: 100%;
        max-width: 130px;
        border: 1px solid rgba(203, 213, 225, 0.9);
        border-bottom-color: transparent;
        border-radius: 8px 8px 0 0;
        background: #f8fafc;
        padding: 0.7rem 0.8rem;
        color: #64748b;
        opacity: 0.92;
        text-align: left;
        cursor: pointer;
        box-shadow: none;
        transition:
          color 180ms ease,
          opacity 180ms ease,
          background 180ms ease,
          width 180ms cubic-bezier(0.22, 1, 0.36, 1),
          min-width 180ms cubic-bezier(0.22, 1, 0.36, 1),
          flex-basis 180ms cubic-bezier(0.22, 1, 0.36, 1),
          flex-grow 180ms cubic-bezier(0.22, 1, 0.36, 1),
          border-color 180ms ease;
      }

      .is-focus-active-mode .tabbar-button {
        flex: 0 0 var(--tab-collapsed-width);
        min-width: var(--tab-collapsed-width);
        max-width: 130px;
        padding-inline: 0.7rem;
        transform: translateY(0.5rem);
        opacity: 0.88;
      }

      .is-focus-active-mode .tabbar-button.is-active {
        flex: 0 0 var(--tab-min-width);
        width: var(--tab-min-width);
        min-width: var(--tab-min-width);
        max-width: var(--tab-min-width);
        padding-inline: 0.8rem;
        transform: translateY(0);
        opacity: 1;
      }

      .tabbar-button::after {
        content: '';
        position: absolute;
        left: 0.8rem;
        right: 0.8rem;
        bottom: 0.3rem;
        height: 2px;
        border-radius: 999px;
        background: rgba(203, 213, 225, 0.7);
        transition:
          background 180ms ease,
          opacity 180ms ease,
          transform 180ms ease;
      }

      .tabbar-button:hover:not(.is-disabled) {
        color: #334155;
        background: #ffffff;
        border-color: #94a3b8;
      }

      .tabbar-button:hover:not(.is-disabled)::after {
        opacity: 1;
        transform: scaleX(1);
      }

      .tabbar-button:focus-visible {
        outline: 2px solid rgba(14, 165, 233, 0.35);
        outline-offset: 2px;
      }

      .tabbar-button.is-active {
        color: #0f172a;
        margin-bottom: -1px;
        z-index: 2;
        opacity: 1;
        transform: translateY(0);
        border-color: rgba(203, 213, 225, 0.9);
        border-bottom-color: transparent;
        background: #ffffff;
        box-shadow: none;
      }

      .tabbar-button:not(.is-active) {
        z-index: 0;
      }

      .tabbar-button.is-active::after {
        background: #2563eb;
      }

      .tabbar-button.is-complete::after {
        background: #059669;
      }

      .tabbar-button.is-invalid::after {
        background: #dc2626;
      }

      .tabbar-button.is-upcoming::after {
        background: rgba(148, 163, 184, 0.7);
      }

      .tabbar-button.is-disabled {
        opacity: 0.48;
        cursor: not-allowed;
      }

      .tabbar-copy {
        display: flex;
        min-width: 0;
        flex: 1;
        flex-direction: column;
        gap: 0.2rem;
        transition:
          gap 220ms cubic-bezier(0.22, 1, 0.36, 1),
          opacity 180ms ease,
          transform 180ms ease;
      }

      .tabbar-label-row {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        gap: 0.5rem;
      }

      .tabbar-label {
        font-size: 0.84rem;
        font-weight: 700;
        letter-spacing: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        transition:
          font-size 180ms ease,
          max-width 220ms cubic-bezier(0.22, 1, 0.36, 1),
          color 180ms ease;
      }

      .tabbar-description {
        font-size: 0.68rem;
        line-height: 1.2;
        color: rgba(100, 116, 139, 0.92);
      }

      .tabbar-button.is-active .tabbar-description {
        color: rgba(51, 65, 85, 0.8);
      }

      .is-focus-active-mode .tabbar-button:not(.is-active) .tabbar-copy {
        gap: 0.1rem;
        transform: translateY(0.08rem);
      }

      .is-focus-active-mode .tabbar-button:not(.is-active) .tabbar-label-row {
        justify-content: flex-start;
      }

      .is-focus-active-mode .tabbar-button:not(.is-active) .tabbar-label {
        font-size: 0.8rem;
        max-width: calc(min(var(--tab-collapsed-width), 130px) - 1.4rem);
      }

      .is-focus-active-mode .tabbar-button.is-active .tabbar-label {
        max-width: none;
      }
    `,
  ],
})
export class TabbarComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() items: readonly TabbarItem[] = [];
  @Input() activeId = '';
  @Input() className = '';
  @Input() showDescription = true;
  @Input() minTabWidth = 100;
  @Input() collapsedTabWidth = 132;
  @Input() tabbarWidth = '100%';
  @Input() displayMode: TabbarDisplayMode = 'default';
  @Output() readonly activeIdChange = new EventEmitter<string>();

  @ViewChild('track') private readonly track?: ElementRef<HTMLElement>;
  @ViewChildren('tabButton') private readonly tabButtons?: QueryList<ElementRef<HTMLElement>>;

  private resizeObserver?: ResizeObserver;

  readonly indicatorWidth = signal(0);
  readonly indicatorOffset = signal(0);
  readonly activeTabWidth = signal(0);
  readonly indicatorTransform = computed(() => `translateX(${this.indicatorOffset()}px)`);

  constructor(private readonly cdr: ChangeDetectorRef) {}

  @HostBinding('class')
  get hostClass(): string {
    return this.className;
  }

  @HostBinding('style.--tab-count')
  get tabCount(): string {
    return String(Math.max(this.items.length, 1));
  }

  @HostBinding('style.--tab-min-width')
  get tabMinWidth(): string {
    return `${Math.max(this.minTabWidth, 100)}px`;
  }

  @HostBinding('style.--tab-collapsed-width')
  get tabCollapsedWidth(): string {
    return `${Math.max(this.collapsedTabWidth, 120)}px`;
  }

  @HostBinding('style.--active-tab-width')
  get hostActiveTabWidth(): string {
    const fallback = Math.min(130, Math.max(this.minTabWidth, 120));
    return `${Math.max(this.activeTabWidth(), fallback)}px`;
  }

  @HostBinding('style.--tabbar-width')
  get hostTabbarWidth(): string {
    const value = this.tabbarWidth.trim();
    return /^\d+(\.\d+)?%$/.test(value) ? value : '100%';
  }

  ngAfterViewInit(): void {
    this.observeLayout();
    queueMicrotask(() => this.updateIndicator());
    this.tabButtons?.changes.subscribe(() => {
      this.observeButtons();
      this.updateIndicator();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['activeId'] || changes['items']) {
      queueMicrotask(() => this.updateIndicator());
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  select(id: string): void {
    if (id === this.activeId) {
      return;
    }

    this.activeIdChange.emit(id);
  }

  shouldShowDescription(item: TabbarItem): boolean {
    return this.displayMode !== 'focus-active' || item.id === this.activeId;
  }

  private observeLayout(): void {
    if (!this.track?.nativeElement || typeof ResizeObserver === 'undefined') {
      return;
    }

    this.resizeObserver = new ResizeObserver(() => this.updateIndicator());
    this.resizeObserver.observe(this.track.nativeElement);
    this.observeButtons();
  }

  private observeButtons(): void {
    if (!this.resizeObserver) {
      return;
    }

    this.tabButtons?.forEach((button) => this.resizeObserver?.observe(button.nativeElement));
  }

  private updateIndicator(): void {
    const buttons = this.tabButtons?.toArray() ?? [];
    const activeIndex = this.items.findIndex((item) => item.id === this.activeId);
    const activeButton = activeIndex >= 0 ? buttons[activeIndex]?.nativeElement : undefined;
    const track = this.track?.nativeElement;

    if (!activeButton || !track) {
      this.indicatorWidth.set(0);
      this.indicatorOffset.set(0);
      this.activeTabWidth.set(Math.min(130, Math.max(this.minTabWidth, 120)));
      this.cdr.markForCheck();
      return;
    }

    this.activeTabWidth.set(Math.min(130, Math.max(this.minTabWidth, 120)));
    this.indicatorWidth.set(activeButton.offsetWidth);
    this.indicatorOffset.set(activeButton.offsetLeft);
    activeButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    this.cdr.markForCheck();
  }
}
