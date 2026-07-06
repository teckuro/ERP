import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  ViewChild,
  forwardRef,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { Calendar, ChevronDown, Search } from 'lucide-angular/src/icons';

import {
  anioInicialPanel,
  buildAniosPanelLista,
  buildPeriodoMensualPanelMeses,
  etiquetaPeriodoMensualInput,
  filtrarAniosDisponibles,
  normalizePeriodoYm,
  periodoYmActual,
  periodoYmDentroDeRango,
  splitPeriodoYm,
  type PeriodoMensualPanelMes,
} from './periodo-mensual-input.util';

@Component({
  selector: 'app-periodo-mensual-input',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PeriodoMensualInputComponent),
      multi: true,
    },
  ],
  template: `
    <div
      class="periodo-mensual"
      [class.is-invalid]="invalid"
      [class.is-disabled]="disabled"
      [class.is-open]="abierto"
      [class.is-year-open]="anioSelectAbierto"
      [attr.data-field-path]="fieldPath || null"
    >
      <details
        #picker
        class="periodo-mensual__picker"
        (toggle)="onPickerToggle($event)"
      >
        <summary
          class="periodo-mensual__trigger"
          [attr.id]="id || null"
          [attr.aria-label]="ariaLabel"
          [attr.aria-invalid]="invalid"
        >
          <span class="periodo-mensual__trigger-icon" aria-hidden="true">
            <lucide-icon [img]="calendarIcon"></lucide-icon>
          </span>
          <span class="periodo-mensual__trigger-label">
            {{ etiquetaVisible || placeholder }}
          </span>
          <span class="periodo-mensual__trigger-chevron" aria-hidden="true">
            <lucide-icon [img]="chevronIcon"></lucide-icon>
          </span>
        </summary>

        <div class="periodo-mensual__panel" role="dialog" aria-label="Seleccionar período mensual">
          @if (panelHint) {
            <p class="periodo-mensual__panel-hint">{{ panelHint }}</p>
          }

          <div #yearField class="periodo-mensual__year-field">
            <button
              type="button"
              class="periodo-mensual__year-trigger"
              [class.is-open]="anioSelectAbierto"
              [attr.aria-expanded]="anioSelectAbierto"
              aria-label="Cambiar año"
              (click)="toggleSelectorAnio($event)"
            >
              <span class="periodo-mensual__year-trigger-label">Año</span>
              <span class="periodo-mensual__year-trigger-value">{{ anioPanel }}</span>
              <lucide-icon class="periodo-mensual__year-trigger-chevron" [img]="chevronIcon"></lucide-icon>
            </button>

            @if (anioSelectAbierto) {
              <div class="periodo-mensual__year-dropdown" aria-label="Buscar año">
                <div class="periodo-mensual__year-search">
                  <lucide-icon [img]="searchIcon" aria-hidden="true"></lucide-icon>
                  <input
                    #yearSearchInput
                    type="text"
                    inputmode="numeric"
                    autocomplete="off"
                    spellcheck="false"
                    placeholder="Buscar año…"
                    [value]="busquedaAnio"
                    (input)="onBusquedaAnio($event)"
                    (keydown.escape)="cerrarSelectorAnio($event)"
                  />
                </div>

                <div class="periodo-mensual__year-list" role="listbox" aria-label="Años disponibles">
                  @for (anio of aniosFiltrados; track anio) {
                    <button
                      type="button"
                      class="periodo-mensual__year-option"
                      role="option"
                      [class.is-selected]="anio === anioPanel"
                      [attr.aria-selected]="anio === anioPanel"
                      (click)="seleccionarAnio(anio, $event)"
                    >
                      {{ anio }}
                    </button>
                  } @empty {
                    <p class="periodo-mensual__year-empty" role="status">Sin coincidencias para la búsqueda.</p>
                  }
                </div>
              </div>
            }
          </div>

          <div class="periodo-mensual__months" role="listbox" aria-label="Meses del año">
            @for (mes of mesesPanel; track mes.value) {
              <button
                type="button"
                class="periodo-mensual__month"
                role="option"
                [class.is-selected]="mes.value === valorSeleccionado"
                [class.is-disabled]="!mes.habilitado"
                [attr.aria-selected]="mes.value === valorSeleccionado"
                [attr.aria-disabled]="!mes.habilitado"
                [disabled]="!mes.habilitado"
                (click)="seleccionarPeriodo(mes.value)"
              >
                {{ mes.labelCorto }}
              </button>
            }
          </div>
        </div>
      </details>

      @if (showHint && hintVisible) {
        <small class="periodo-mensual__hint">{{ hintVisible }}</small>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }

      .periodo-mensual {
        display: flex;
        flex-direction: column;
        gap: 4px;
        width: 100%;
      }

      .periodo-mensual__picker {
        position: relative;
        width: 100%;
      }

      .periodo-mensual__trigger {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        min-height: var(--periodo-mensual-height, 36px);
        padding: 8px 10px;
        border: 1px solid var(--erp-border, #e5e7eb);
        border-radius: 6px;
        background: #fff;
        color: var(--erp-text-strong, #0f172a);
        font-size: 13px;
        font-weight: 400;
        line-height: 1.2;
        list-style: none;
        cursor: pointer;
        transition: border-color 120ms ease, box-shadow 120ms ease, background 120ms ease;
      }

      .periodo-mensual__trigger::-webkit-details-marker {
        display: none;
      }

      .periodo-mensual__trigger:hover:not(:disabled) {
        border-color: #cbd5e1;
        background: var(--erp-bg-subtle, #f8fafc);
      }

      .periodo-mensual__picker[open] .periodo-mensual__trigger,
      .periodo-mensual.is-open .periodo-mensual__trigger {
        border-color: #1d4ed8;
        box-shadow: 0 0 0 2px rgba(29, 78, 216, 0.15);
        background: #fff;
      }

      .periodo-mensual.is-invalid .periodo-mensual__trigger {
        border-color: #fca5a5;
      }

      .periodo-mensual.is-invalid .periodo-mensual__picker[open] .periodo-mensual__trigger {
        border-color: #dc2626;
        box-shadow: 0 0 0 2px #fef2f2;
      }

      .periodo-mensual.is-disabled {
        opacity: 0.72;
        pointer-events: none;
      }

      .periodo-mensual__trigger-icon,
      .periodo-mensual__trigger-chevron {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        color: var(--erp-text-muted, #64748b);
      }

      .periodo-mensual__trigger-icon lucide-icon,
      .periodo-mensual__trigger-chevron lucide-icon {
        width: 14px;
        height: 14px;
      }

      .periodo-mensual__trigger-label {
        flex: 1;
        min-width: 0;
        text-align: left;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .periodo-mensual__trigger-chevron {
        transition: transform 120ms ease;
      }

      .periodo-mensual__picker[open] .periodo-mensual__trigger-chevron {
        transform: rotate(180deg);
      }

      .periodo-mensual__panel {
        position: absolute;
        top: calc(100% + 4px);
        left: 0;
        right: 0;
        z-index: var(--periodo-mensual-z, 12);
        display: grid;
        gap: 8px;
        width: 100%;
        border: 1px solid var(--erp-border, #e2e8f0);
        border-radius: 6px;
        background: #fff;
        padding: 8px;
        box-shadow: 0 10px 24px rgba(15, 23, 42, 0.1);
      }

      .periodo-mensual__panel-hint {
        margin: 0;
        font-size: 11px;
        line-height: 1.4;
        color: var(--erp-text-muted, #64748b);
      }

      .periodo-mensual__year-field {
        position: relative;
        z-index: 1;
      }

      .periodo-mensual.is-year-open .periodo-mensual__year-field {
        z-index: 2;
      }

      .periodo-mensual__year-trigger {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        align-items: center;
        gap: 8px;
        width: 100%;
        min-height: var(--periodo-mensual-height, 36px);
        padding: 8px 10px;
        border: 1px solid var(--erp-border, #e5e7eb);
        border-radius: 6px;
        background: #fff;
        color: var(--erp-text-strong, #0f172a);
        font-size: 13px;
        font-weight: 400;
        text-align: left;
        cursor: pointer;
        transition: border-color 120ms ease, box-shadow 120ms ease, background 120ms ease;
      }

      .periodo-mensual__year-trigger:hover {
        border-color: #cbd5e1;
        background: var(--erp-bg-subtle, #f8fafc);
      }

      .periodo-mensual__year-trigger.is-open,
      .periodo-mensual__year-trigger:focus-visible {
        border-color: #1d4ed8;
        box-shadow: 0 0 0 2px rgba(29, 78, 216, 0.15);
        outline: none;
        background: #fff;
      }

      .periodo-mensual__year-trigger-label {
        font-size: 12px;
        font-weight: 600;
        color: var(--erp-text-muted, #6b7280);
      }

      .periodo-mensual__year-trigger-value {
        min-width: 0;
        font-weight: 500;
        text-align: left;
      }

      .periodo-mensual__year-trigger-chevron {
        width: 14px;
        height: 14px;
        color: var(--erp-text-muted, #64748b);
        transition: transform 120ms ease;
      }

      .periodo-mensual__year-trigger.is-open .periodo-mensual__year-trigger-chevron {
        transform: rotate(180deg);
      }

      .periodo-mensual__year-dropdown {
        position: absolute;
        top: calc(100% + 4px);
        left: 0;
        right: 0;
        z-index: 3;
        display: grid;
        gap: 6px;
        border: 1px solid var(--erp-border, #e2e8f0);
        border-radius: 6px;
        background: #fff;
        padding: 6px;
        box-shadow: 0 8px 20px rgba(15, 23, 42, 0.1);
      }

      .periodo-mensual__year-search {
        display: grid;
        grid-template-columns: 12px minmax(0, 1fr);
        align-items: center;
        gap: 6px;
        min-height: 28px;
        padding: 4px 8px;
        border: 1px solid var(--erp-border, #e5e7eb);
        border-radius: 5px;
        background: #fff;
        color: var(--erp-text-muted, #64748b);
      }

      .periodo-mensual__year-search lucide-icon {
        width: 12px;
        height: 12px;
      }

      .periodo-mensual__year-search input {
        width: 100%;
        border: 0;
        background: transparent;
        color: var(--erp-text-strong, #0f172a);
        font-size: 12px;
        line-height: 1.2;
        outline: none;
      }

      .periodo-mensual__year-search input::placeholder {
        color: var(--erp-text-muted, #94a3b8);
        font-size: 11px;
      }

      .periodo-mensual__year-list {
        display: grid;
        gap: 1px;
        max-height: min(9.5rem, 30vh);
        overflow-y: auto;
        margin: 0;
        padding: 0;
      }

      .periodo-mensual__year-option {
        display: flex;
        align-items: center;
        width: 100%;
        min-height: 26px;
        padding: 4px 8px;
        border: 1px solid transparent;
        border-radius: 4px;
        background: transparent;
        color: var(--erp-text-strong, #0f172a);
        font-size: 12px;
        font-weight: 500;
        text-align: left;
        cursor: pointer;
        transition: background 100ms ease, border-color 100ms ease, color 100ms ease;
      }

      .periodo-mensual__year-option:hover {
        background: var(--erp-bg-subtle, #f8fafc);
        border-color: #e2e8f0;
      }

      .periodo-mensual__year-option.is-selected {
        background: #eff6ff;
        border-color: #93c5fd;
        color: #1e40af;
        font-weight: 600;
      }

      .periodo-mensual__year-empty {
        margin: 0;
        padding: 4px 8px;
        font-size: 11px;
        color: var(--erp-text-muted, #64748b);
      }

      .periodo-mensual__months {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        border: 1px solid #dbe3ee;
        border-radius: 6px;
        overflow: hidden;
        background: #f8fafc;
      }

      .periodo-mensual__month {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 32px;
        padding: 6px 4px;
        margin: 0;
        border: 0;
        border-right: 1px solid #dbe3ee;
        border-bottom: 1px solid #dbe3ee;
        border-radius: 0;
        background: #f8fafc;
        color: var(--erp-text-strong, #0f172a);
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.03em;
        text-transform: uppercase;
        cursor: pointer;
        transition: background 100ms ease, color 100ms ease;
      }

      .periodo-mensual__month:nth-child(3n) {
        border-right: 0;
      }

      .periodo-mensual__month:nth-child(n + 10) {
        border-bottom: 0;
      }

      .periodo-mensual__month:hover:not(:disabled):not(.is-selected) {
        background: #eef2f7;
      }

      .periodo-mensual__month.is-selected {
        background: #1d4ed8;
        color: #fff;
      }

      .periodo-mensual__month.is-disabled,
      .periodo-mensual__month:disabled {
        background: #f1f5f9;
        color: #94a3b8;
        cursor: not-allowed;
      }

      .periodo-mensual__hint {
        font-size: 11px;
        line-height: 1.4;
        color: var(--erp-text-muted, #6b7280);
      }
    `,
  ],
})
export class PeriodoMensualInputComponent implements ControlValueAccessor {
  @ViewChild('picker') private pickerRef?: ElementRef<HTMLDetailsElement>;
  @ViewChild('yearField') private yearFieldRef?: ElementRef<HTMLElement>;
  @ViewChild('yearSearchInput') private yearSearchInputRef?: ElementRef<HTMLInputElement>;

  @Input() id = '';
  @Input() fieldPath = '';
  @Input() invalid = false;
  @Input() disabled = false;
  @Input() showHint = false;
  @Input() placeholder = 'Seleccione período';
  @Input() ariaLabel = 'Período mensual';
  @Input() panelHint = 'Elija el mes y el año a procesar.';
  @Input() min = '';
  @Input() max = '';

  @Input()
  set value(raw: string) {
    this.applyExternalValue(raw);
  }

  @Output() readonly valueChange = new EventEmitter<string>();

  readonly calendarIcon = Calendar;
  readonly chevronIcon = ChevronDown;
  readonly searchIcon = Search;

  valorSeleccionado = periodoYmActual();
  etiquetaVisible = etiquetaPeriodoMensualInput(periodoYmActual());
  anioPanel = anioInicialPanel(periodoYmActual());
  mesesPanel: PeriodoMensualPanelMes[] = buildPeriodoMensualPanelMeses(
    anioInicialPanel(periodoYmActual()),
  );
  aniosDisponibles: number[] = buildAniosPanelLista(periodoYmActual());
  aniosFiltrados: number[] = buildAniosPanelLista(periodoYmActual());
  busquedaAnio = '';
  anioSelectAbierto = false;
  hintVisible = etiquetaPeriodoMensualInput(periodoYmActual());
  abierto = false;

  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  @HostListener('document:click', ['$event'])
  cerrarSiClickFuera(event: MouseEvent): void {
    const target = event.target;
    const host = this.pickerRef?.nativeElement?.closest('.periodo-mensual');
    if (!(target instanceof Node) || !host) {
      return;
    }

    if (!host.contains(target)) {
      this.cerrarPicker();
      return;
    }

    const yearField = this.yearFieldRef?.nativeElement;
    if (this.anioSelectAbierto && yearField && !yearField.contains(target)) {
      this.cerrarSelectorAnio();
    }
  }

  writeValue(value: string | null): void {
    this.applyExternalValue(value ?? '');
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

  onPickerToggle(event: Event): void {
    const details = event.target as HTMLDetailsElement;
    this.abierto = details.open;
    if (details.open) {
      this.sincronizarPanel();
    } else {
      this.cerrarSelectorAnio();
      this.onTouched();
    }
  }

  toggleSelectorAnio(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.anioSelectAbierto = !this.anioSelectAbierto;
    if (this.anioSelectAbierto) {
      this.busquedaAnio = '';
      this.refrescarAniosFiltrados();
      queueMicrotask(() => {
        this.yearSearchInputRef?.nativeElement?.focus({ preventScroll: true });
      });
      return;
    }
    this.busquedaAnio = '';
    this.refrescarAniosFiltrados();
  }

  cerrarSelectorAnio(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    this.anioSelectAbierto = false;
    this.busquedaAnio = '';
    this.refrescarAniosFiltrados();
  }

  onBusquedaAnio(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.busquedaAnio = input.value;
    this.refrescarAniosFiltrados();
  }

  seleccionarAnio(anio: number, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.anioPanel = anio;
    this.refrescarMesesPanel();
    this.cerrarSelectorAnio();
  }

  seleccionarPeriodo(raw: string): void {
    const normalizado = normalizePeriodoYm(raw);
    if (!normalizado || !periodoYmDentroDeRango(normalizado, this.min, this.max)) {
      this.emitValue('');
      return;
    }

    this.valorSeleccionado = normalizado;
    this.etiquetaVisible = etiquetaPeriodoMensualInput(normalizado);
    this.hintVisible = etiquetaPeriodoMensualInput(normalizado);
    this.emitValue(normalizado);
    this.cerrarPicker();
    this.onTouched();
  }

  private cerrarPicker(): void {
    const el = this.pickerRef?.nativeElement;
    if (el?.open) {
      el.open = false;
    }
    this.abierto = false;
    this.cerrarSelectorAnio();
  }

  private applyExternalValue(raw: string): void {
    const normalizado = normalizePeriodoYm(raw);
    this.valorSeleccionado = normalizado;
    this.etiquetaVisible = normalizado ? etiquetaPeriodoMensualInput(normalizado) : '';
    this.hintVisible = normalizado ? etiquetaPeriodoMensualInput(normalizado) : '';
    this.anioPanel = anioInicialPanel(normalizado, this.min, this.max);
    this.refrescarMesesPanel();
    this.refrescarAniosDisponibles(normalizado || periodoYmActual());
  }

  private sincronizarPanel(): void {
    const partes = splitPeriodoYm(this.valorSeleccionado);
    if (partes) {
      this.anioPanel = Number(partes.anio);
    } else {
      this.anioPanel = anioInicialPanel('', this.min, this.max);
    }
    this.refrescarMesesPanel();
    this.refrescarAniosDisponibles(this.valorSeleccionado || periodoYmActual());
    this.cerrarSelectorAnio();
  }

  private refrescarMesesPanel(): void {
    this.mesesPanel = buildPeriodoMensualPanelMeses(this.anioPanel, this.min, this.max);
  }

  private refrescarAniosDisponibles(referenciaYm: string): void {
    this.aniosDisponibles = buildAniosPanelLista(referenciaYm, this.min, this.max);
    this.refrescarAniosFiltrados();
  }

  private refrescarAniosFiltrados(): void {
    this.aniosFiltrados = filtrarAniosDisponibles(this.aniosDisponibles, this.busquedaAnio);
  }

  private emitValue(value: string): void {
    this.valorSeleccionado = value;
    this.etiquetaVisible = value ? etiquetaPeriodoMensualInput(value) : '';
    this.onChange(value);
    this.valueChange.emit(value);
  }
}
