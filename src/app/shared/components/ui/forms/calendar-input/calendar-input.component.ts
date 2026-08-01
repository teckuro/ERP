import { CommonModule } from '@angular/common';
import {
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
import { ChevronLeft, ChevronRight, X } from 'lucide-angular/src/icons';
import { autoUpdate, computePosition, flip, offset, shift } from '@floating-ui/dom';
import {
  buildCalendarYearOptions,
  resolveCalendarYearBounds,
} from './calendar-input-years.util';

interface CalendarDay {
  date: Date;
  value: string;
  label: number;
  inCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  disabled: boolean;
}

@Component({
  selector: 'app-calendar-input',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CalendarInputComponent),
      multi: true,
    },
  ],
  template: `
    <div class="calendar-root" [class.is-disabled]="disabled" [attr.data-field-path]="fieldPath || null">
      <div
        #calendarField
        class="calendar-field"
        [class.is-invalid]="invalid"
        [class.has-inset-label]="insetLabel"
        [class.has-side-label]="sideLabel"
        [class.has-clear]="value && clearable && !disabled"
      >
        @if (insetLabel) {
          <span class="calendar-inset-label">{{ insetLabel }}</span>
        }
        @if (sideLabel) {
          <span class="calendar-side-label">{{ sideLabel }}</span>
        }

        <input
          [id]="id"
          type="text"
          inputmode="numeric"
          autocomplete="off"
          maxlength="10"
          [attr.placeholder]="placeholder"
          [disabled]="disabled"
          [value]="displayValue"
          (focus)="openCalendar()"
          (click)="openCalendar()"
          (input)="handleInput($event)"
          (blur)="handleBlur()"
          (keydown)="handleKeydown($event)"
          (keydown.arrowDown)="openCalendar($event)"
          (keydown.escape)="closeCalendar()"
        />

        @if (value && clearable && !disabled) {
          <button
            type="button"
            class="calendar-clear"
            aria-label="Limpiar fecha"
            (click)="clearDate($event)"
          >
            <lucide-icon [img]="clearIcon"></lucide-icon>
          </button>
        }
      </div>

      @if (open) {
        <div
          #calendarPopover
          class="calendar-popover"
          [class.calendar-popover--ready]="floatingLayoutDone"
          role="dialog"
          aria-label="Seleccionar fecha"
        >
          <div class="calendar-head">
            <button
              type="button"
              class="calendar-nav"
              aria-label="Mes anterior"
              [disabled]="!canGoToPreviousMonth()"
              (click)="goToPreviousMonth()"
            >
              <lucide-icon [img]="previousIcon"></lucide-icon>
            </button>

            <div class="calendar-period" aria-label="Mes y ano visible">
              <select
                class="calendar-period-select"
                aria-label="Seleccionar mes"
                [value]="visibleDate.getMonth()"
                (change)="selectVisibleMonth($event)"
              >
                @for (month of monthOptions; track month.value) {
                  <option [value]="month.value">{{ month.label }}</option>
                }
              </select>

              <select
                class="calendar-period-select calendar-period-select--year"
                aria-label="Seleccionar ano"
                [value]="visibleYear"
                (change)="selectVisibleYear($event)"
              >
                @for (year of yearOptions; track year) {
                  <option [value]="year" [selected]="year === visibleYear">{{ year }}</option>
                }
              </select>
            </div>

            <button
              type="button"
              class="calendar-nav"
              aria-label="Mes siguiente"
              [disabled]="!canGoToNextMonth()"
              (click)="goToNextMonth()"
            >
              <lucide-icon [img]="nextIcon"></lucide-icon>
            </button>
          </div>

          <div class="calendar-weekdays" aria-hidden="true">
            @for (weekday of weekdays; track weekday) {
              <span>{{ weekday }}</span>
            }
          </div>

          <div class="calendar-grid" role="grid">
            @for (day of calendarDays; track day.value) {
              <button
                type="button"
                role="gridcell"
                class="calendar-day"
                [class.is-muted]="!day.inCurrentMonth"
                [class.is-today]="day.isToday"
                [class.is-selected]="day.isSelected"
                [disabled]="day.disabled"
                (click)="selectDate(day)"
              >
                {{ day.label }}
              </button>
            }
          </div>

          <div class="calendar-footer">
            <button type="button" (click)="selectToday()" [disabled]="isTodayDisabled()">
              Hoy
            </button>
            <button type="button" (click)="closeCalendar()">Cerrar</button>
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
        --erp-floating-ui-z: 11060;
      }

      .calendar-root {
        position: relative;
        width: 100%;
      }

      .calendar-field {
        position: relative;
        display: flex;
        align-items: center;
        width: 100%;
        height: var(--erp-control-height, 21px);
        min-height: var(--erp-control-height, 21px);
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        background: #ffffff;
        transition: border-color 160ms ease, box-shadow 160ms ease;
        overflow: hidden;
      }

      .calendar-field.has-inset-label {
        padding-top: 0.32rem;
      }

      .calendar-field.has-side-label {
        padding-left: 0.15rem;
      }

      .calendar-side-label {
        display: inline-flex;
        align-items: center;
        justify-content: flex-start;
        width: 3.9rem;
        padding: 0 0.55rem 0 0.55rem;
        color: #64748b;
        font-size: 0.72rem;
        font-weight: 600;
        line-height: 1;
        border-right: 1px solid #edf2f7;
        flex: 0 0 auto;
        user-select: none;
        pointer-events: none;
      }

      .calendar-field:hover {
        border-color: #cbd5e1;
      }

      .calendar-field:focus-within {
        border-color: #2563eb;
        box-shadow: 0 0 0 3px #eff6ff;
      }

      .calendar-field.is-invalid {
        border-color: #dc2626;
      }

      .calendar-field.is-invalid:focus-within {
        border-color: #dc2626;
        box-shadow: 0 0 0 3px #fef2f2;
      }

      input {
        min-width: 0;
        flex: 1 1 auto;
        height: 100%;
        border: 0;
        background: transparent;
        padding: 0 0.5rem;
        color: #111827;
        font: inherit;
        font-size: var(--erp-text-sm, 0.72rem);
        font-weight: 500;
        outline: none;
      }

      .calendar-field.has-side-label input {
        text-align: right;
        padding-left: 0.6rem;
      }

      .calendar-field.has-clear input {
        padding-right: 2.4rem;
      }

      input::placeholder {
        color: #9ca3af;
      }

      .calendar-clear {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: calc(var(--erp-control-height, 21px) - 4px);
        height: calc(var(--erp-control-height, 21px) - 4px);
        position: absolute;
        top: 50%;
        right: 0.25rem;
        transform: translateY(-50%);
        border: 0;
        border-radius: 5px;
        background: transparent;
        color: #6b7280;
      }

      .calendar-clear:hover {
        background: #f8fafc;
        color: #111827;
      }

      .calendar-inset-label {
        position: absolute;
        top: 0.28rem;
        left: 0.72rem;
        z-index: 1;
        padding: 0;
        background: transparent;
        color: #64748b;
        font-size: 0.47rem;
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        line-height: 1;
        pointer-events: none;
      }

      .calendar-icon-button,
      .calendar-nav,
      .calendar-footer button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .calendar-icon-button {
        width: calc(var(--erp-control-height, 21px) - 4px);
        height: calc(var(--erp-control-height, 21px) - 4px);
        border: 0;
        border-radius: 5px;
        background: transparent;
        color: #6b7280;
      }

      .calendar-icon-button:hover {
        background: #f8fafc;
        color: #111827;
      }

      .calendar-clear lucide-icon,
      .calendar-icon-button lucide-icon,
      .calendar-nav lucide-icon {
        display: inline-flex;
        width: 14px;
        height: 14px;
        line-height: 0;
      }

      .calendar-nav lucide-icon,
      .calendar-icon-button lucide-icon,
      .calendar-clear lucide-icon {
        align-items: center;
        justify-content: center;
      }

      .calendar-nav lucide-icon ::ng-deep svg,
      .calendar-icon-button lucide-icon ::ng-deep svg,
      .calendar-clear lucide-icon ::ng-deep svg {
        display: block;
      }

      .calendar-popover {
        position: fixed;
        top: 0;
        left: 0;
        z-index: var(--erp-floating-ui-z, 11060);
        width: min(18rem, calc(100vw - 2rem));
        visibility: hidden;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        background: #ffffff;
        padding: 10px;
        box-sizing: border-box;
        box-shadow: 0 12px 28px rgba(17, 24, 39, 0.12);
      }

      .calendar-popover--ready {
        visibility: visible;
      }

      .calendar-head {
        display: grid;
        grid-template-columns: 30px minmax(0, 1fr) 30px;
        align-items: center;
        gap: 6px;
        margin-bottom: 10px;
      }

      .calendar-period {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 4.75rem;
        gap: 6px;
        min-width: 0;
      }

      .calendar-period-select {
        min-width: 0;
        height: 28px;
        border: 1px solid #e5e7eb;
        border-radius: 5px;
        background: #ffffff;
        padding: 0 6px;
        color: #111827;
        font-size: 12px;
        font-weight: 600;
        line-height: 16px;
        outline: none;
        text-transform: capitalize;
      }

      .calendar-period-select:hover {
        border-color: #cbd5e1;
        background: #f8fafc;
      }

      .calendar-period-select:focus {
        border-color: #2563eb;
        box-shadow: 0 0 0 2px #eff6ff;
      }

      .calendar-period-select--year {
        text-transform: none;
      }

      .calendar-nav {
        width: 30px;
        height: 30px;
        padding: 0;
        border: 1px solid #e5e7eb;
        border-radius: 5px;
        background: #ffffff;
        color: #6b7280;
      }

      .calendar-nav:hover {
        background: #f9fafb;
        color: #111827;
      }

      .calendar-nav:disabled {
        cursor: not-allowed;
        opacity: 0.45;
      }

      .calendar-weekdays,
      .calendar-grid {
        display: grid;
        grid-template-columns: repeat(7, minmax(0, 1fr));
        gap: 3px;
      }

      .calendar-weekdays {
        margin-bottom: 3px;
      }

      .calendar-weekdays span {
        display: grid;
        height: 22px;
        place-items: center;
        color: #6b7280;
        font-size: 11px;
        font-weight: 600;
      }

      .calendar-day {
        display: grid;
        height: 28px;
        place-items: center;
        border: 1px solid transparent;
        border-radius: 5px;
        background: transparent;
        color: #111827;
        font-size: 12px;
        font-weight: 600;
      }

      .calendar-day:hover:not(:disabled) {
        border-color: #cbd5e1;
        background: #f9fafb;
        color: #1d4ed8;
      }

      .calendar-day.is-muted {
        color: #9ca3af;
      }

      .calendar-day.is-today {
        border-color: #2563eb;
        color: #1d4ed8;
      }

      .calendar-day.is-selected {
        border-color: #2563eb;
        background: #2563eb;
        color: #ffffff;
      }

      .calendar-day:disabled {
        cursor: not-allowed;
        opacity: 0.42;
      }

      .calendar-footer {
        display: flex;
        justify-content: flex-end;
        gap: 6px;
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid #e5e7eb;
      }

      .calendar-footer button {
        min-height: 28px;
        border: 1px solid #e5e7eb;
        border-radius: 5px;
        background: #ffffff;
        padding: 0 9px;
        color: #374151;
        font-size: 12px;
        font-weight: 600;
      }

      .calendar-footer button:hover:not(:disabled) {
        border-color: #cbd5e1;
        background: #f9fafb;
        color: #111827;
      }

      .is-disabled {
        opacity: 0.72;
      }
    `,
  ],
})
export class CalendarInputComponent implements ControlValueAccessor, OnDestroy {
  private readonly host = inject(ElementRef<HTMLElement>);

  @ViewChild('calendarField')
  private calendarFieldRef?: ElementRef<HTMLElement>;

  @ViewChild('calendarPopover')
  private calendarPopoverRef?: ElementRef<HTMLElement>;

  private floatingDispose?: () => void;
  private floatingAttachTimer?: ReturnType<typeof setTimeout>;
  floatingLayoutDone = false;

  @Input() id = '';
  @Input() fieldPath = '';
  @Input() placeholder = 'dd/mm/aaaa';
  @Input() insetLabel = '';
  /** Label lateral dentro del control (ej. Desde/Hasta). */
  @Input() sideLabel = '';
  @Input() invalid = false;
  @Input() clearable = true;
  @Input() min = '';
  @Input() max = '';
  @Output() readonly valueChange = new EventEmitter<string>();

  readonly clearIcon = X;
  readonly previousIcon = ChevronLeft;
  readonly nextIcon = ChevronRight;
  readonly weekdays = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];
  readonly monthOptions = Array.from({ length: 12 }, (_, index) => ({
    value: index,
    label: new Intl.DateTimeFormat('es-CL', { month: 'long' }).format(new Date(2024, index, 1)),
  }));

  value = '';
  displayValue = '';
  open = false;
  disabled = false;
  visibleDate = this.startOfMonth(new Date());
  calendarDays: CalendarDay[] = [];
  visibleMonthLabel = '';
  yearOptions: number[] = [];

  get visibleYear(): number {
    return this.visibleDate.getFullYear();
  }

  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor() {
    this.refreshCalendar();
  }

  ngOnDestroy(): void {
    this.disposeFloatingPositioning();
  }

  @HostListener('document:click', ['$event'])
  closeOnOutsideClick(event: MouseEvent): void {
    const target = event.target;

    if (target instanceof Node && this.host.nativeElement.contains(target)) {
      return;
    }

    this.closeCalendar();
  }

  writeValue(value: string | null): void {
    this.value = this.normalizeDateValue(value ?? '');
    this.displayValue = this.formatDisplayValue(this.value);
    this.visibleDate = this.value ? this.startOfMonth(this.parseIsoDate(this.value)) : this.startOfMonth(new Date());
    this.refreshCalendar();
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled = disabled;
  }

  toggleCalendar(): void {
    if (this.disabled) {
      return;
    }

    if (this.open) {
      this.closeCalendar();
      return;
    }

    this.openCalendar();
  }

  openCalendar(event?: Event): void {
    event?.preventDefault();

    if (this.disabled) {
      return;
    }

    this.open = true;
    this.floatingLayoutDone = false;
    this.refreshCalendar();
    this.queueFloatingAttachment();
  }

  closeCalendar(): void {
    this.open = false;
    this.floatingLayoutDone = false;
    this.disposeFloatingPositioning();
  }

  private attachFloating(): void {
    this.disposeFloatingPositioning();

    const reference = this.calendarFieldRef?.nativeElement;
    const floating = this.calendarPopoverRef?.nativeElement;

    if (!reference || !floating || !this.open) {
      return;
    }

    this.floatingDispose = autoUpdate(reference, floating, () => {
      void this.updateFloatingPosition();
    });
  }

  private queueFloatingAttachment(): void {
    this.clearFloatingAttachTimer();
    this.floatingAttachTimer = setTimeout(() => {
      this.floatingAttachTimer = undefined;
      this.attachFloating();
    });
  }

  private disposeFloatingPositioning(): void {
    this.clearFloatingAttachTimer();
    this.floatingDispose?.();
    this.floatingDispose = undefined;
  }

  private clearFloatingAttachTimer(): void {
    if (this.floatingAttachTimer === undefined) {
      return;
    }

    clearTimeout(this.floatingAttachTimer);
    this.floatingAttachTimer = undefined;
  }

  private async updateFloatingPosition(): Promise<void> {
    const reference = this.calendarFieldRef?.nativeElement;
    const floating = this.calendarPopoverRef?.nativeElement;

    if (!reference || !floating || !this.open) {
      return;
    }

    const result = await computePosition(reference, floating, {
      placement: 'bottom-start',
      strategy: 'fixed',
      middleware: [offset(6), flip({ padding: 8 }), shift({ padding: 8 })],
    });

    floating.style.position = result.strategy;
    floating.style.transform = 'none';
    floating.style.left = `${Math.round(result.x)}px`;
    floating.style.top = `${Math.round(result.y)}px`;
    floating.style.right = 'auto';
    floating.style.bottom = 'auto';

    if (!this.floatingLayoutDone) {
      this.floatingLayoutDone = true;
      floating.classList.add('calendar-popover--ready');
    }
  }

  handleInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const raw = input.value.trim();
    const isoDirect = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? this.normalizeDateValue(raw) : '';

    if (isoDirect) {
      input.value = this.formatDisplayValue(isoDirect);
      this.displayValue = input.value;
      this.updateValue(isoDirect);
      return;
    }

    const maskedValue = this.maskDisplayValue(input.value);
    input.value = maskedValue;
    this.displayValue = maskedValue;
    const parsed = this.parseDisplayValue(maskedValue);

    if (!parsed) {
      this.updateValue('');
      return;
    }

    this.updateValue(parsed);
  }

  handleKeydown(event: KeyboardEvent): void {
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    const allowedKeys = new Set([
      'Backspace',
      'Delete',
      'Tab',
      'Enter',
      'Escape',
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Home',
      'End',
    ]);

    if (allowedKeys.has(event.key) || /^\d$/.test(event.key)) {
      return;
    }

    event.preventDefault();
  }

  handleBlur(): void {
    this.onTouched();
    this.displayValue = this.formatDisplayValue(this.value);
  }

  clearDate(event?: Event): void {
    event?.stopPropagation();
    event?.preventDefault();
    this.updateValue('');
    this.displayValue = '';
    this.closeCalendar();
    this.onTouched();
  }

  selectDate(day: CalendarDay): void {
    if (day.disabled) {
      return;
    }

    this.updateValue(day.value);
    this.displayValue = this.formatDisplayValue(day.value);
    this.visibleDate = this.startOfMonth(day.date);
    this.closeCalendar();
    this.onTouched();
  }

  selectToday(): void {
    const today = this.toIsoDate(new Date());

    if (this.isDateDisabled(today)) {
      return;
    }

    this.updateValue(today);
    this.displayValue = this.formatDisplayValue(today);
    this.visibleDate = this.startOfMonth(new Date());
    this.closeCalendar();
    this.onTouched();
  }

  isTodayDisabled(): boolean {
    return this.isDateDisabled(this.toIsoDate(new Date()));
  }

  goToPreviousMonth(): void {
    if (!this.canGoToPreviousMonth()) {
      return;
    }

    this.visibleDate = this.clampVisibleDate(
      new Date(this.visibleDate.getFullYear(), this.visibleDate.getMonth() - 1, 1),
    );
    this.refreshCalendar();
  }

  goToNextMonth(): void {
    if (!this.canGoToNextMonth()) {
      return;
    }

    this.visibleDate = this.clampVisibleDate(
      new Date(this.visibleDate.getFullYear(), this.visibleDate.getMonth() + 1, 1),
    );
    this.refreshCalendar();
  }

  canGoToPreviousMonth(): boolean {
    if (!this.min) {
      return true;
    }

    const previousMonth = this.startOfMonth(
      new Date(this.visibleDate.getFullYear(), this.visibleDate.getMonth() - 1, 1),
    );

    return this.toIsoDate(previousMonth) >= this.toIsoDate(this.startOfMonth(this.parseIsoDate(this.min)));
  }

  canGoToNextMonth(): boolean {
    if (!this.max) {
      return true;
    }

    const nextMonth = this.startOfMonth(
      new Date(this.visibleDate.getFullYear(), this.visibleDate.getMonth() + 1, 1),
    );

    return this.toIsoDate(nextMonth) <= this.toIsoDate(this.startOfMonth(this.parseIsoDate(this.max)));
  }

  selectVisibleMonth(event: Event): void {
    const month = Number((event.target as HTMLSelectElement).value);
    this.visibleDate = this.clampVisibleDate(new Date(this.visibleDate.getFullYear(), month, 1));
    this.refreshCalendar();
  }

  selectVisibleYear(event: Event): void {
    const year = Number((event.target as HTMLSelectElement).value);
    this.visibleDate = this.clampVisibleDate(new Date(year, this.visibleDate.getMonth(), 1));
    this.refreshCalendar();
  }

  private updateValue(value: string): void {
    this.value = this.normalizeDateValue(value);
    this.onChange(this.value);
    this.valueChange.emit(this.value);
    this.refreshCalendar();
  }

  private refreshCalendar(): void {
    this.visibleMonthLabel = new Intl.DateTimeFormat('es-CL', {
      month: 'long',
      year: 'numeric',
    }).format(this.visibleDate);
    this.yearOptions = this.buildYearOptions();
    this.calendarDays = this.buildCalendarDays();
  }

  private buildCalendarDays(): CalendarDay[] {
    const firstDay = this.startOfMonth(this.visibleDate);
    const mondayOffset = (firstDay.getDay() + 6) % 7;
    const gridStart = new Date(firstDay);
    gridStart.setDate(firstDay.getDate() - mondayOffset);

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + index);
      const value = this.toIsoDate(date);

      return {
        date,
        value,
        label: date.getDate(),
        inCurrentMonth: date.getMonth() === this.visibleDate.getMonth(),
        isToday: value === this.toIsoDate(new Date()),
        isSelected: value === this.value,
        disabled: this.isDateDisabled(value),
      };
    });
  }

  private isDateDisabled(value: string): boolean {
    if (this.min && value < this.min) {
      return true;
    }

    return Boolean(this.max && value > this.max);
  }

  private parseDisplayValue(value: string): string {
    const normalized = value.trim();

    if (!normalized) {
      return '';
    }

    const isoMatch = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      return this.normalizeDateValue(normalized);
    }

    const chileMatch = normalized.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!chileMatch) {
      return '';
    }

    const [, day, month, year] = chileMatch;
    return this.normalizeDateValue(`${year}-${month}-${day}`);
  }

  private normalizeDateValue(value: string): string {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return '';
    }

    const date = this.parseIsoDate(value);
    return Number.isNaN(date.getTime()) || this.toIsoDate(date) !== value ? '' : value;
  }

  private formatDisplayValue(value: string): string {
    if (!value) {
      return '';
    }

    const [year, month, day] = value.split('-');
    return `${day}/${month}/${year}`;
  }

  private parseIsoDate(value: string): Date {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  private maskDisplayValue(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    const day = digits.slice(0, 2);
    const month = digits.slice(2, 4);
    const year = digits.slice(4, 8);

    return [day, month, year].filter(Boolean).join('/');
  }

  private startOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  private buildYearOptions(): number[] {
    return buildCalendarYearOptions(resolveCalendarYearBounds(this.min, this.max));
  }

  private clampVisibleDate(date: Date): Date {
    const monthValue = this.toIsoDate(this.startOfMonth(date));

    if (this.min && monthValue < this.toIsoDate(this.startOfMonth(this.parseIsoDate(this.min)))) {
      return this.startOfMonth(this.parseIsoDate(this.min));
    }

    if (this.max && monthValue > this.toIsoDate(this.startOfMonth(this.parseIsoDate(this.max)))) {
      return this.startOfMonth(this.parseIsoDate(this.max));
    }

    return this.startOfMonth(date);
  }

  private toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
