import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Component,
  ContentChildren,
  Directive,
  EventEmitter,
  HostBinding,
  HostListener,
  Input,
  OnDestroy,
  OnChanges,
  Output,
  QueryList,
  SimpleChanges,
  TemplateRef,
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ArrowUpDown,
  ChevronRight,
  CheckCircle,
  Download,
  Filter,
  Plus,
  RefreshCw,
  Search,
  Settings,
  X,
} from 'lucide-angular/src/icons';

import { CardComponent } from './card.component';
import { CalendarInputComponent } from './calendar-input.component';
import { MessageBoxComponent, MessageBoxVariant } from './message-box.component';

export type DataGridColumnAlign = 'left' | 'center' | 'right';
export type DataGridColumnType = 'text' | 'number' | 'date';
export type DataGridSortDirection = 'asc' | 'desc';
export type DataGridBulkAction = 'activate' | 'deactivate' | 'change-status' | string;
export type DataGridFilterType = 'select' | 'text' | 'date' | 'date-range';
export type DataGridTextOperator = 'contains' | 'startsWith' | 'endsWith' | 'equals';
export type DataGridSelectOperator = 'equals';
export type DataGridDateOperator = 'on' | 'before' | 'after' | 'between';
export type DataGridFilterOperator = DataGridTextOperator | DataGridSelectOperator | DataGridDateOperator;
export type DataGridFilterNormalization = 'text' | 'rut' | 'none';
export type DataGridFilterMatchMode = 'default' | 'tokens';

export interface DataGridDateRangeValue {
  from?: string;
  to?: string;
}

export type DataGridFilterValue = string | DataGridDateRangeValue;

export interface DataGridFilter<T = unknown> {
  id: string;
  label: string;
  field: keyof T;
  type?: DataGridFilterType;
  operator?: DataGridFilterOperator;
  normalize?: DataGridFilterNormalization;
  matchMode?: DataGridFilterMatchMode;
  emptyLabel?: string;
  placeholder?: string;
  options?: Array<string | { label: string; value: string }>;
}

export interface DataGridCellContext<T> {
  $implicit: T;
  row: T;
  column: DataGridColumn<T>;
  value: unknown;
  index: number;
}

export interface DataGridColumn<T = unknown> {
  id: string;
  header: string;
  field?: keyof T;
  visible?: boolean;
  width?: string;
  minWidth?: string;
  align?: DataGridColumnAlign;
  sortable?: boolean;
  type?: DataGridColumnType;
  hideable?: boolean;
  headerClass?: string;
  cellClass?: string;
  widthClass?: string;
  priorityResponsive?: 'primary' | 'secondary' | 'tertiary' | number;
  format?: (value: unknown, row: T, index: number) => string | number;
}

export type DataGridExportScope = 'page' | 'selected' | 'filtered';

export interface DataGridExportEvent<T = unknown> {
  scope: DataGridExportScope;
  rows: T[];
  columns: DataGridColumn<T>[];
  includeHiddenColumns: boolean;
}

export interface DataGridBulkActionEvent<T = unknown> {
  action: DataGridBulkAction;
  rows: T[];
  value?: string;
  label?: string;
}

export interface DataGridBulkActionResult<T = unknown> {
  action: DataGridBulkAction;
  rows?: T[];
  status: 'success' | 'partial' | 'error';
  processed: number;
  total: number;
  message?: string;
}

interface DataGridNotice {
  variant: Exclude<MessageBoxVariant, 'loading'>;
  title: string;
  message: string;
}

export interface DataGridBulkActionOption {
  id: DataGridBulkAction;
  label: string;
  value?: string;
  tone?: 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'blocked';
  confirmLabel?: string;
  confirmTitle?: string;
  confirmMessage?: string;
}

@Directive({
  selector: 'ng-template[appDataGridCell]',
  standalone: true,
})
export class DataGridCellDirective<T = unknown> {
  @Input('appDataGridCell') columnId = '';

  constructor(readonly template: TemplateRef<DataGridCellContext<T>>) {}
}

@Component({
  selector: 'app-data-grid',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, CardComponent, CalendarInputComponent, MessageBoxComponent],
  template: `
    <app-card [className]="gridCardClass" [ngStyle]="gridCardStyle">
      @if (filtersEnabled && showFilters) {
        <div class="data-grid-filter-panel border-b border-neutral-200 bg-white px-4 py-3">
          <div class="mb-3 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <label class="data-grid-search-field">
              <span class="sr-only">Busqueda global</span>
              <lucide-icon class="h-3.5 w-3.5 text-slate-400" [img]="searchIcon"></lucide-icon>
              <input
                type="text"
                class="data-grid-search-input"
                [value]="searchInputTerm"
                [placeholder]="searchPlaceholder"
                (input)="updateSearchTerm($event)"
              />
              @if (searchInputTerm) {
                <button
                  type="button"
                  class="data-grid-search-clear"
                  aria-label="Limpiar busqueda"
                  (click)="clearSearchTerm()"
                >
                  <lucide-icon class="h-3.5 w-3.5" [img]="clearIcon"></lucide-icon>
                </button>
              }
            </label>

            @if (activeFilterChips.length > 0) {
              <div class="data-grid-filter-chips" aria-label="Filtros activos">
                @for (chip of activeFilterChips; track chip.id) {
                  <button
                    type="button"
                    class="data-grid-filter-chip"
                    [attr.aria-label]="'Quitar filtro ' + chip.label"
                    (click)="removeFilterChip(chip.id)"
                  >
                    <span class="data-grid-filter-chip__label">{{ chip.label }}</span>
                    <span class="data-grid-filter-chip__value">{{ chip.value }}</span>
                    <lucide-icon class="h-3 w-3" [img]="clearIcon"></lucide-icon>
                  </button>
                }
                <button
                  type="button"
                  class="data-grid-filter-chips__clear-all"
                  (click)="clearAllFilters()"
                >
                  Limpiar todo
                </button>
              </div>
            }
          </div>

          <div class="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
            <div class="min-w-0 flex-1">
              <div class="data-grid-filter-grid" [ngStyle]="filterGridStyle">
                @for (filter of visibleFilters; track filter.id) {
                  <label class="data-grid-filter-field" [class.data-grid-filter-field--wide]="isDateRangeFilter(filter)">
                    <span class="data-grid-filter-label">
                      {{ filter.label }}
                    </span>
                    @if (isDateRangeFilter(filter)) {
                      <div class="data-grid-filter-range">
                        <app-calendar-input
                          class="data-grid-filter-range-slot"
                          [ngModel]="filterDateRangeValue(filter, 'from')"
                          (ngModelChange)="updateDateRangeFilterValue(filter, 'from', $event)"
                          [max]="filterDateRangeValue(filter, 'to')"
                          [insetLabel]="'Desde'"
                          placeholder="dd/mm/aaaa"
                        ></app-calendar-input>
                        <app-calendar-input
                          class="data-grid-filter-range-slot"
                          [ngModel]="filterDateRangeValue(filter, 'to')"
                          (ngModelChange)="updateDateRangeFilterValue(filter, 'to', $event)"
                          [min]="filterDateRangeValue(filter, 'from')"
                          [insetLabel]="'Hasta'"
                          placeholder="dd/mm/aaaa"
                        ></app-calendar-input>
                      </div>
                    } @else if (isDateFilter(filter)) {
                      <app-calendar-input
                        [ngModel]="filterTextValue(filter)"
                        (ngModelChange)="updateFilterModelValue(filter, $event)"
                        placeholder="dd/mm/aaaa"
                      ></app-calendar-input>
                    } @else if (isSelectFilter(filter)) {
                      <select
                        class="h-8 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2.5 text-left text-[0.74rem] font-medium text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] outline-none transition hover:border-slate-300 hover:bg-slate-50 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                        [value]="filterTextValue(filter)"
                        (change)="updateFilterValue(filter, $event)"
                      >
                        <option value="">{{ emptyFilterLabel(filter) }}</option>
                        @for (option of filterOptions(filter); track filterOptionValue(option)) {
                          <option [value]="filterOptionValue(option)">{{ filterOptionLabel(option) }}</option>
                        }
                      </select>
                    } @else {
                      <input
                        type="text"
                        class="h-8 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2.5 text-left text-[0.74rem] font-medium text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] outline-none transition hover:border-slate-300 hover:bg-slate-50 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                        [value]="filterTextValue(filter)"
                        [placeholder]="filterPlaceholder(filter)"
                        (input)="updateFilterValue(filter, $event)"
                      />
                    }
                  </label>
                }
              </div>
            </div>

            <div class="flex shrink-0 items-center justify-end gap-2 self-end pb-0.5 xl:pl-3">
              <button
                type="button"
                class="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[0.72rem] font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                (click)="clearAllFilters()"
              >
                <lucide-icon class="h-3.5 w-3.5" [img]="clearIcon"></lucide-icon>
                Limpiar
              </button>
              <button
                type="button"
                class="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-blue-600 bg-blue-600 px-3.5 text-[0.72rem] font-medium text-white shadow-[0_6px_16px_rgba(37,99,235,0.18)] transition-colors hover:border-blue-700 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                (click)="applyFilters()"
              >
                <lucide-icon class="h-3.5 w-3.5" [img]="searchIcon"></lucide-icon>
                Buscar
              </button>
            </div>
          </div>
        </div>
      }

      @if ((rows.length > 0 || title) && showHeader) {
        <div class="border-b border-neutral-100 bg-white px-4 pb-4 pt-3.5">
          <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <p class="text-sm font-medium uppercase text-neutral-900">{{ title || 'Registros' }}</p>
                <span class="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-xs font-medium text-neutral-700">
                    {{ filteredRows.length }}
                  </span>
              </div>
            </div>

            <div class="flex flex-wrap items-center gap-2 lg:justify-end">
              <label class="data-grid-toolbar-control data-grid-toolbar-control--show flex h-8 items-center gap-2 rounded-md border border-neutral-200 bg-white px-2.5">
                <span class="text-xs font-medium text-neutral-600">Mostrar</span>
                <select
                  class="h-6 rounded-md border-0 bg-neutral-50 px-1.5 text-xs font-medium text-neutral-900 outline-none focus:ring-2 focus:ring-blue-500"
                  [value]="pageSize"
                  aria-label="Cantidad de elementos por pagina"
                  [disabled]="loading"
                  (change)="updatePageSize($event)"
                >
                  @for (option of pageSizeOptions; track option) {
                    <option [value]="option">{{ option }}</option>
                  }
                </select>
              </label>

              @if (primaryActionLabel) {
                <button
                  type="button"
                  class="inline-flex h-8 items-center gap-1.5 rounded-md border border-blue-600 bg-blue-600 px-3 text-xs font-medium text-white transition-colors hover:border-blue-700 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  (click)="primaryAction.emit()"
                >
                  <lucide-icon class="h-3.5 w-3.5" [img]="plusIcon"></lucide-icon>
                  {{ primaryActionLabel }}
                </button>
              }

              @if (filtersEnabled) {
                <button
                  type="button"
                  class="data-grid-toolbar-icon-button inline-flex h-8 w-8 items-center justify-center rounded-md border border-neutral-200 bg-white text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  aria-label="Mostrar u ocultar filtros"
                  title="Mostrar u ocultar filtros"
                  [attr.aria-expanded]="showFilters"
                  (click)="showFilters = !showFilters"
                >
                  <lucide-icon class="h-3.5 w-3.5" [img]="filterIcon"></lucide-icon>
                </button>
              }

              @if (showExportAction) {
                <div class="relative data-grid-toolbar-icon-wrap" data-grid-overlay-root>
                  <button
                    type="button"
                    class="data-grid-toolbar-icon-button inline-flex h-8 w-8 items-center justify-center rounded-md border border-neutral-200 bg-white text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    aria-label="Exportar registros"
                    title="Exportar registros"
                    [attr.aria-expanded]="showExportPanel"
                    (click)="toggleExportPanel()"
                  >
                    <lucide-icon class="h-3.5 w-3.5" [img]="downloadIcon"></lucide-icon>
                  </button>

                  @if (showExportPanel) {
                    <div
                      class="absolute right-0 top-10 z-50 w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-md border border-neutral-200 bg-white text-sm shadow-[0_8px_20px_rgba(15,23,42,0.08)] ring-1 ring-black/[0.02]"
                      role="menu"
                      aria-label="Opciones de exportacion"
                    >
                      <div class="border-b border-neutral-100 bg-neutral-50 px-3 py-2.5">
                        <p class="text-xs font-medium uppercase text-neutral-500">
                          Exportar
                        </p>
                        <p class="mt-0.5 text-xs font-medium text-neutral-500">
                          Elige el alcance de los datos
                        </p>
                      </div>

                      <div class="p-1.5">
                        <button
                          type="button"
                          class="flex w-full items-start gap-2 rounded-md px-2 py-2 text-left transition hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                          role="menuitem"
                          [disabled]="pagedRows.length === 0"
                          (click)="exportPageRows()"
                        >
                          <lucide-icon class="mt-0.5 h-3.5 w-3.5 text-neutral-500" [img]="downloadIcon"></lucide-icon>
                          <span>
                            <span class="block text-xs font-medium text-neutral-800">Exportar pagina actual</span>
                            <span class="mt-0.5 block text-xs text-neutral-500">Solo registros visibles</span>
                          </span>
                        </button>

                        <button
                          type="button"
                          class="flex w-full items-start gap-2 rounded-md border border-transparent px-2 py-2 text-left transition hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                          [class.border-blue-200]="selectedRows.length > 0"
                          [class.bg-blue-50]="selectedRows.length > 0"
                          role="menuitem"
                          [disabled]="selectedRows.length === 0"
                          (click)="exportSelectedRows()"
                        >
                          <lucide-icon class="mt-0.5 h-3.5 w-3.5" [class.text-blue-600]="selectedRows.length > 0" [class.text-neutral-500]="selectedRows.length === 0" [img]="downloadIcon"></lucide-icon>
                          <span>
                            <span class="block text-xs font-medium text-neutral-800">Exportar seleccionados ({{ selectedRows.length }})</span>
                            <span class="mt-0.5 block text-xs text-neutral-500">Solo los marcados manualmente</span>
                          </span>
                        </button>

                        <button
                          type="button"
                          class="flex w-full items-start gap-2 rounded-md px-2 py-2 text-left transition hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                          role="menuitem"
                          [disabled]="filteredRows.length === 0"
                          (click)="exportFilteredRows()"
                        >
                          <lucide-icon class="mt-0.5 h-3.5 w-3.5 text-neutral-500" [img]="downloadIcon"></lucide-icon>
                          <span>
                            <span class="block text-xs font-medium text-neutral-800">Exportar todos los resultados (filtrados)</span>
                            <span class="mt-0.5 block text-xs text-neutral-500">Incluye todos los registros que cumplen los filtros</span>
                          </span>
                        </button>
                      </div>

                      <label class="flex cursor-pointer items-start gap-2 border-t border-neutral-100 bg-neutral-50 px-3 py-2.5">
                        <input
                          type="checkbox"
                          class="mt-0.5 h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                          [checked]="exportAllColumns"
                          (change)="toggleExportColumns($event)"
                        />
                        <span>
                          <span class="block text-xs font-medium text-neutral-800">Exportar con todas las columnas</span>
                          <span class="mt-0.5 block text-xs text-neutral-500">
                            Por defecto se exportan solo las columnas visibles.
                          </span>
                        </span>
                      </label>
                    </div>
                  }
                </div>
              }

              <button
                type="button"
                class="data-grid-toolbar-icon-button inline-flex h-8 w-8 items-center justify-center rounded-md border border-neutral-200 bg-white text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                aria-label="Refrescar grilla"
                title="Refrescar grilla"
                [disabled]="loading"
                (click)="refresh.emit()"
              >
                <lucide-icon class="h-3.5 w-3.5" [img]="refreshIcon"></lucide-icon>
              </button>

              <div class="relative data-grid-toolbar-icon-wrap" data-grid-overlay-root>
                <button
                  type="button"
                  class="data-grid-toolbar-icon-button inline-flex h-8 w-8 items-center justify-center rounded-md border border-neutral-200 bg-white text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  aria-label="Configurar columnas visibles"
                  title="Columnas visibles"
                  [attr.aria-expanded]="showColumnPanel"
                  (click)="toggleColumnPanel()"
                >
                  <lucide-icon class="h-3.5 w-3.5" [img]="settingsIcon"></lucide-icon>
                </button>

                @if (showColumnPanel) {
                  <div
                    class="absolute right-0 top-10 z-50 w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-slate-200 bg-white text-sm shadow-[0_16px_34px_rgba(15,23,42,0.12)] ring-1 ring-slate-950/[0.03]"
                    role="dialog"
                    aria-label="Columnas visibles"
                  >
                    <div class="border-b border-slate-100 bg-[linear-gradient(180deg,#f8fbff_0%,#fdfefe_100%)] px-3.5 py-2.5">
                      <div class="flex items-start justify-between gap-3">
                        <div>
                          <p class="text-[0.68rem] font-medium uppercase tracking-[0.18em] text-slate-500">
                            Columnas
                          </p>
                        </div>

                        <div class="flex items-center gap-1.5">
                          <button
                            type="button"
                            class="inline-flex h-7 items-center rounded-full border border-slate-200 bg-white px-2.5 text-[0.68rem] font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                            (click)="showAllColumns()"
                          >
                            Todo
                          </button>
                          <button
                            type="button"
                            class="inline-flex h-7 items-center rounded-full border border-slate-200 bg-white px-2.5 text-[0.68rem] font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                            (click)="restoreDefaultColumns()"
                          >
                            Restaurar
                          </button>
                        </div>
                      </div>
                    </div>

                    <div class="max-h-64 overflow-auto p-1.5">
                      @for (column of columns; track column.id) {
                        <button
                          type="button"
                          class="flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-55"
                          [disabled]="isColumnFixed(column) || isLastVisibleColumn(column.id)"
                          [attr.title]="isColumnFixed(column) ? 'Esta columna siempre queda visible' : isLastVisibleColumn(column.id) ? 'Debe quedar al menos una columna visible' : column.header"
                          (click)="toggleColumn(column.id)"
                        >
                          <span class="min-w-0">
                            <span class="block truncate text-sm font-medium text-slate-800">
                              {{ column.header }}
                            </span>
                          </span>

                          <span
                            class="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors"
                            [class.border-blue-600]="isColumnVisible(column.id)"
                            [class.bg-blue-500]="isColumnVisible(column.id)"
                            [class.border-slate-300]="!isColumnVisible(column.id)"
                            [class.bg-slate-100]="!isColumnVisible(column.id)"
                          >
                            <span
                              class="h-4 w-4 rounded-full bg-white shadow-sm ring-1 ring-black/5 transition-transform"
                              [class.translate-x-4]="isColumnVisible(column.id)"
                              [class.translate-x-0.5]="!isColumnVisible(column.id)"
                            ></span>
                          </span>
                        </button>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      }

      @if (selectable && selectedRows.length > 0) {
        <div
          class="flex flex-col gap-3 border-b border-blue-100 bg-blue-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          role="region"
          aria-label="Acciones masivas"
          aria-live="polite"
        >
          <div class="flex items-center gap-2 text-sm font-medium text-blue-900">
            <lucide-icon class="h-4 w-4" [img]="selectionIcon"></lucide-icon>
            <span>{{ selectedRows.length }} {{ selectionLabel }} seleccionados</span>
          </div>

          <div class="flex flex-wrap items-center gap-2 sm:justify-end">
            <span class="text-xs font-medium uppercase text-blue-700">Cambiar estado a</span>
            @for (action of bulkActions; track action.id) {
              <button
                type="button"
                class="inline-flex h-8 items-center gap-1.5 rounded-md border bg-white px-2.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                [ngClass]="bulkActionButtonClass(action)"
                [disabled]="bulkActionLoading"
                (click)="requestBulkAction(action)"
              >
                @if (bulkActionLoading && activeBulkAction === action.id) {
                  <span class="data-grid-button-spinner"></span>
                }
                {{ action.label }}
              </button>
            }
            <button
              type="button"
              class="inline-flex h-8 items-center rounded-md border border-transparent px-2.5 text-xs font-medium text-blue-800 transition hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              [disabled]="bulkActionLoading"
              (click)="clearSelection()"
            >
              Limpiar seleccion
            </button>
          </div>
        </div>
      }

      @if (pendingBulkAction) {
        <app-message-box
          mode="modal"
          [variant]="bulkConfirmationVariant"
          [title]="bulkConfirmationTitle"
          [message]="bulkConfirmationMessage"
          [primaryLabel]="bulkConfirmationPrimaryLabel"
          secondaryLabel="Cancelar"
          (action)="confirmBulkAction()"
          (secondary)="cancelBulkAction()"
        ></app-message-box>
      }

      @if (notice) {
        <div class="absolute right-4 top-4 z-40 w-80 max-w-[calc(100%-2rem)]">
          <app-message-box
            [variant]="notice.variant"
            [title]="notice.title"
            [message]="notice.message"
            [dismissible]="true"
            (dismiss)="clearNotice()"
          ></app-message-box>
        </div>
      }

      <div class="data-grid-scroll w-full min-w-0 flex-1 overflow-auto bg-white" [ngStyle]="gridBodyStyle">
        @if (errorMessage && !loading) {
          <div class="data-grid-state data-grid-state--error">
            <div
              class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-red-100 bg-red-50"
            >
              <span class="text-lg font-semibold text-red-600">!</span>
            </div>
            <h3 class="mb-1 text-lg font-medium text-neutral-900">{{ errorMessage }}</h3>
            <p class="text-sm text-neutral-600">Intenta nuevamente para actualizar la informacion.</p>
            <button
              type="button"
              class="mt-4 inline-flex h-9 items-center rounded-md border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              (click)="retry.emit()"
            >
              Reintentar
            </button>
          </div>
        } @else if (filteredRows.length > 0 || loading) {
          <div class="data-grid-table-region" [class.is-loading]="loading">
            @if (loading) {
              <span class="sr-only" role="status" aria-live="polite">{{ loadingLabel }}</span>
            }
            <table
              class="data-grid-table-view w-full border-separate border-spacing-0"
              [class.data-grid-table-view--fit]="shouldFitColumns"
              [class.data-grid-table-view--scroll]="!shouldFitColumns"
              [style.--data-grid-table-min-width]="tableMinWidth"
            >
              <colgroup>
                <col class="data-grid-row-number-col" />
                @if (selectable) {
                  <col class="data-grid-selection-col" />
                }
                @for (column of visibleColumns; track column.id) {
                  <col [ngStyle]="columnSizingStyle(column)" />
                }
              </colgroup>
              <thead class="data-grid-head sticky top-0 z-10 bg-neutral-100 shadow-[0_1px_0_rgba(229,229,229,1)]">
                <tr>
                  <th
                    scope="col"
                    class="data-grid-row-number-cell data-grid-head-num border-b border-r border-neutral-200 text-[0.68rem] font-medium uppercase text-neutral-600"
                  >
                    N°
                  </th>
                  @if (selectable) {
                    <th scope="col" class="data-grid-selection-head w-11 border-b border-r border-neutral-200">
                      <input
                        class="h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                        type="checkbox"
                        aria-label="Seleccionar registros visibles"
                        [checked]="allPageRowsSelected"
                        [indeterminate]="somePageRowsSelected && !allPageRowsSelected"
                        [disabled]="loading"
                        (change)="togglePageSelection($event)"
                      />
                    </th>
                  }
                  @for (column of visibleColumns; track column.id) {
                    <th
                      scope="col"
                      class="data-grid-head-cell whitespace-nowrap border-b border-r border-neutral-200 text-[0.68rem] font-medium uppercase text-neutral-600 last:border-r-0"
                      [ngClass]="[alignmentHeaderClass(column), column.headerClass ?? '', column.widthClass ?? '']"
                    >
                      @if (isSortable(column)) {
                        <button
                          type="button"
                          class="inline-flex items-center gap-1.5 rounded-md text-left transition-colors hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                          [class.justify-end]="column.align === 'right'"
                          [class.justify-center]="column.align === 'center'"
                          [attr.aria-sort]="sortAriaValue(column)"
                          [disabled]="loading"
                          (click)="toggleSort(column)"
                        >
                          <span>{{ column.header }}</span>
                          <lucide-icon class="h-3.5 w-3.5" [img]="sortIcon(column)"></lucide-icon>
                        </button>
                      } @else {
                        <span class="block">{{ column.header }}</span>
                      }
                    </th>
                  }
                </tr>
              </thead>

              <tbody class="bg-white">
                @if (loading) {
                  @for (skeletonRow of skeletonRows; track skeletonRow) {
                    <tr class="data-grid-skeleton-row" aria-hidden="true">
                      <td class="data-grid-row-number-cell data-grid-skel-num border-b border-r border-neutral-100">
                        <span class="data-grid-skeleton-line data-grid-skeleton-line--number"></span>
                      </td>
                      @if (selectable) {
                        <td class="data-grid-skel-select w-11 border-b border-r border-neutral-100">
                          <span class="data-grid-skeleton-box h-4 w-4 rounded"></span>
                        </td>
                      }
                      @for (column of visibleColumns; track column.id) {
                        <td
                          class="data-grid-skel-cell border-b border-r border-neutral-100 last:border-r-0"
                          [ngClass]="[alignmentCellClass(column), column.cellClass ?? '', column.widthClass ?? '']"
                        >
                          <span class="data-grid-skeleton-line" [class.data-grid-skeleton-line--short]="column.align === 'right' || column.align === 'center'"></span>
                        </td>
                      }
                    </tr>
                  }
                } @else {
                  @for (row of pagedRows; track trackPagedRow($index, row)) {
                    <tr
                      class="data-grid-row group transition-colors duration-150"
                      [class.hover:bg-neutral-50]="hoverRows"
                      [class.data-grid-row-selected]="isRowSelected(row)"
                    >
                      <td
                        class="data-grid-row-number-cell data-grid-body-num border-b border-r border-neutral-100 text-[0.72rem] font-semibold text-slate-500 transition-colors"
                        [class.bg-blue-50]="isRowSelected(row)"
                      >
                        {{ absoluteIndex($index) + 1 }}
                      </td>
                      @if (selectable) {
                        <td
                          class="data-grid-selection-cell w-11 border-b border-r border-neutral-100 transition-colors"
                          [class.bg-blue-50]="isRowSelected(row)"
                        >
                          <input
                            class="h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                            type="checkbox"
                            [attr.aria-label]="'Seleccionar registro ' + (absoluteIndex($index) + 1)"
                            [checked]="isRowSelected(row)"
                            (click)="$event.stopPropagation()"
                            (change)="toggleRowSelection(row, $event)"
                          />
                        </td>
                      }
                      @for (column of visibleColumns; track column.id) {
                        <td
                          class="data-grid-body-cell border-b border-r border-neutral-100 text-[0.76rem] text-neutral-900 transition-colors last:border-r-0"
                          [class.bg-blue-50]="isRowSelected(row)"
                          [ngClass]="[alignmentCellClass(column), column.cellClass ?? '', column.widthClass ?? '']"
                        >
                          @if (cellTemplate(column.id); as customTemplate) {
                            <div>
                              <ng-container
                                *ngTemplateOutlet="
                                  customTemplate;
                                  context: cellContext(row, column, absoluteIndex($index))
                                "
                              />
                            </div>
                          } @else {
                            <span class="block truncate" [attr.title]="formattedValue(row, column, absoluteIndex($index))">{{ formattedValue(row, column, absoluteIndex($index)) }}</span>
                          }
                        </td>
                      }
                    </tr>
                  }
                }
              </tbody>
            </table>

            <div class="data-grid-card-list" [attr.aria-label]="title || 'Registros'">
              @if (loading) {
                @for (skeletonRow of mobileSkeletonRows; track skeletonRow) {
                  <article class="data-grid-mobile-card data-grid-mobile-card--loading" aria-hidden="true">
                    <span class="data-grid-skeleton-line data-grid-skeleton-line--title"></span>
                    <span class="data-grid-skeleton-line"></span>
                    <span class="data-grid-skeleton-line data-grid-skeleton-line--short"></span>
                  </article>
                }
              } @else {
                @for (row of pagedRows; track trackPagedRow($index, row)) {
                  <article
                    class="data-grid-mobile-card"
                    [class.data-grid-mobile-card--selected]="isRowSelected(row)"
                  >
                    <span class="data-grid-mobile-counter">N° {{ absoluteIndex($index) + 1 }}</span>
                    @if (selectable) {
                      <label class="data-grid-mobile-select">
                        <input
                          class="h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                          type="checkbox"
                          [checked]="isRowSelected(row)"
                          (change)="toggleRowSelection(row, $event)"
                        />
                        <span>Seleccionar registro</span>
                      </label>
                    }

                    <dl class="data-grid-mobile-fields">
                      @for (column of mobileColumns; track column.id) {
                        <div class="data-grid-mobile-field" [class.data-grid-mobile-field--primary]="isMobilePrimaryColumn(column)">
                          <dt>{{ column.header }}</dt>
                          <dd [ngClass]="alignmentCellClass(column)">
                            @if (cellTemplate(column.id); as customTemplate) {
                              <ng-container
                                *ngTemplateOutlet="
                                  customTemplate;
                                  context: cellContext(row, column, absoluteIndex($index))
                                "
                              />
                            } @else {
                              {{ formattedValue(row, column, absoluteIndex($index)) }}
                            }
                          </dd>
                        </div>
                      }
                    </dl>

                    @if (mobileActionColumn; as actionColumn) {
                      <div class="data-grid-mobile-actions">
                        @if (cellTemplate(actionColumn.id); as actionTemplate) {
                          <ng-container
                            *ngTemplateOutlet="
                              actionTemplate;
                              context: cellContext(row, actionColumn, absoluteIndex($index))
                            "
                          />
                        }
                      </div>
                    }
                  </article>
                }
              }
            </div>
          </div>
        } @else {
          <div class="data-grid-state">
            <div
              class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50"
            >
              <lucide-icon class="h-8 w-8 text-neutral-400" [img]="emptyIcon"></lucide-icon>
            </div>
            <h3 class="mb-1 text-lg font-medium text-neutral-900">{{ resolvedEmptyTitle }}</h3>
            <p class="text-sm text-neutral-600">{{ resolvedEmptyDescription }}</p>

            @if (hasActiveFilters) {
              <button
                type="button"
                class="mt-4 inline-flex h-9 items-center rounded-md border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                (click)="clearAllFilters()"
              >
                Limpiar filtros
              </button>
            } @else if (primaryActionLabel) {
              <button
                type="button"
                class="mt-4 inline-flex h-9 items-center gap-1.5 rounded-md border border-blue-600 bg-blue-600 px-3 text-sm font-medium text-white transition hover:border-blue-700 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                (click)="primaryAction.emit()"
              >
                <lucide-icon class="h-4 w-4" [img]="plusIcon"></lucide-icon>
                {{ primaryActionLabel }}
              </button>
            }
          </div>
        }
      </div>

      @if (filteredRows.length > 0) {
        <div
          class="data-grid-footer flex flex-col gap-3 border-t border-neutral-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <p class="text-xs font-medium text-neutral-600">
            Pagina {{ currentPage }} de {{ totalPages }}
          </p>

          <div class="flex flex-wrap items-center gap-3 sm:justify-end">
            <div
              class="inline-flex items-center overflow-hidden rounded-md border border-neutral-200 bg-white"
              aria-label="Paginacion inferior"
            >
              <button
                type="button"
                class="inline-flex h-8 items-center gap-1.5 border-r border-neutral-200 px-2.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-400 disabled:opacity-70"
                aria-label="Pagina anterior"
                [disabled]="currentPage <= 1"
                (click)="previousPage()"
              >
                <lucide-icon class="h-3.5 w-3.5" [img]="previousIcon"></lucide-icon>
                Atras
              </button>

              <span
                class="inline-flex h-8 min-w-20 items-center justify-center border-r border-neutral-200 bg-neutral-50 px-2.5 text-xs font-medium text-neutral-900"
                aria-live="polite"
                aria-label="Pagina actual"
              >
                {{ currentPage }} / {{ totalPages }}
              </span>

              <button
                type="button"
                class="inline-flex h-8 items-center gap-1.5 px-2.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-400 disabled:opacity-70"
                aria-label="Pagina siguiente"
                [disabled]="currentPage >= totalPages"
                (click)="nextPage()"
              >
                Siguiente
                <lucide-icon class="h-3.5 w-3.5" [img]="nextIcon"></lucide-icon>
              </button>
            </div>

            <div class="relative border-l border-neutral-200 pl-2" data-grid-overlay-root>
              <button
                type="button"
                class="inline-flex h-8 items-center justify-center rounded-md border border-neutral-200 bg-white px-2.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                aria-label="Ir a una pagina especifica"
                [attr.aria-expanded]="showPagePopover"
                (click)="togglePagePopover()"
              >
                Ir a pagina
              </button>

              @if (showPagePopover) {
                <div
                  class="absolute bottom-11 right-0 z-50 w-60 max-w-[calc(100vw-2rem)] overflow-hidden rounded-md border border-neutral-200 bg-white text-sm shadow-[0_8px_20px_rgba(15,23,42,0.08)] ring-1 ring-black/[0.02]"
                  role="dialog"
                  aria-label="Ir a pagina"
                >
                  <div class="border-b border-neutral-100 bg-neutral-50 px-3 py-2.5">
                    <p class="text-xs font-medium uppercase text-neutral-500">
                      Ir a pagina
                    </p>
                    <p class="mt-0.5 text-xs font-medium text-neutral-500">
                      Rango 1-{{ totalPages }}
                    </p>
                  </div>

                  <div class="p-3">
                    <input
                      class="h-9 w-full rounded-md border border-neutral-200 bg-white px-2.5 text-sm font-medium text-neutral-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      type="number"
                      min="1"
                      [max]="totalPages"
                      [value]="pageInput"
                      aria-label="Numero de pagina"
                      (input)="updatePageInput($event)"
                      (keydown.enter)="confirmPagePopover()"
                    />

                    @if (pageInputError) {
                      <p class="mt-2 text-xs font-medium text-red-600">{{ pageInputError }}</p>
                    }

                    <div class="mt-3 flex justify-end gap-2">
                      <button
                        type="button"
                        class="inline-flex h-8 items-center rounded-md border border-neutral-200 bg-white px-2.5 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                        (click)="closePagePopover()"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        class="inline-flex h-8 items-center rounded-md border border-blue-600 bg-blue-600 px-3 text-xs font-medium text-white transition-colors hover:border-blue-700 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                        (click)="confirmPagePopover()"
                      >
                        Ir
                      </button>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      }
    </app-card>
  `,
  styles: [
    `
      :host {
        --data-grid-border: #dbe3ee;
        --data-grid-border-soft: #e7edf5;
        --data-grid-head-bg: #f8fafc;
        --data-grid-row-hover: #f8fafc;
        --data-grid-row-selected: #eff6ff;
        --data-grid-scrollbar-track: #f1f5f9;
        --data-grid-scrollbar-thumb: #cbd5e1;
        --data-grid-text-xs: 0.64rem;
        --data-grid-text-sm: 0.72rem;
        --data-grid-text-md: 0.76rem;
        --data-grid-padding-inline: 0.5rem;
        --data-grid-padding-block-body: 0.5rem;
        --data-grid-padding-block-head: 0.5rem;
        --data-grid-padding-num-inline: 0.45rem;
        --data-grid-padding-skel: 0.65rem;
      }

      .data-grid-scroll {
        position: relative;
        min-height: 0;
        flex: 1 1 auto;
        background: #ffffff;
        overscroll-behavior: contain;
        scrollbar-gutter: auto;
        scrollbar-color: var(--data-grid-scrollbar-thumb) var(--data-grid-scrollbar-track);
        scrollbar-width: thin;
      }

      .data-grid-filter-grid {
        display: grid;
        gap: 0.75rem 0.875rem;
        align-items: end;
      }

      .data-grid-search-field {
        display: flex;
        width: min(100%, 28rem);
        min-height: 2.25rem;
        align-items: center;
        gap: 0.5rem;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        background: #ffffff;
        padding: 0 0.75rem;
        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
      }

      .data-grid-search-field:focus-within {
        border-color: #2563eb;
        box-shadow: 0 0 0 2px #dbeafe;
      }

      .data-grid-search-input {
        min-width: 0;
        flex: 1 1 auto;
        border: 0;
        background: transparent;
        color: #111827;
        font-size: var(--data-grid-text-md);
        font-weight: 500;
        outline: none;
      }

      .data-grid-search-input::placeholder {
        color: #9ca3af;
      }

      .data-grid-search-clear {
        display: inline-flex;
        width: 1.5rem;
        height: 1.5rem;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        color: #6b7280;
        transition:
          background-color 150ms ease,
          color 150ms ease;
      }

      .data-grid-search-clear:hover {
        background: #f3f4f6;
        color: #111827;
      }

      .data-grid-filter-chips {
        display: flex;
        min-width: 0;
        flex: 1 1 auto;
        flex-wrap: wrap;
        align-items: center;
        justify-content: flex-end;
        gap: 0.5rem;
      }

      .data-grid-filter-chip,
      .data-grid-filter-chips__clear-all {
        display: inline-flex;
        min-height: 1.75rem;
        align-items: center;
        gap: 0.35rem;
        border: 1px solid #e5e7eb;
        border-radius: 999px;
        background: #f8fafc;
        padding: 0 0.625rem;
        color: #374151;
        font-size: var(--data-grid-text-sm);
        font-weight: 600;
        transition:
          background-color 150ms ease,
          border-color 150ms ease;
      }

      .data-grid-filter-chip:hover,
      .data-grid-filter-chips__clear-all:hover {
        border-color: #cbd5e1;
        background: #ffffff;
      }

      .data-grid-filter-chip__label {
        color: #6b7280;
      }

      .data-grid-filter-chip__value {
        max-width: 11rem;
        overflow: hidden;
        color: #111827;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .data-grid-filter-field {
        display: flex;
        min-width: 0;
        flex-direction: column;
        gap: 0.35rem;
      }

      .data-grid-filter-field--wide {
        grid-column: span 2;
      }

      .data-grid-filter-label {
        width: 100%;
        padding: 0 0.15rem;
        text-align: left;
        font-size: var(--data-grid-text-xs);
        font-weight: 600;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: #475569;
      }

      .data-grid-filter-range {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.625rem;
        align-items: end;
      }

      .data-grid-filter-range-slot {
        min-width: 0;
      }

      .data-grid-scroll::-webkit-scrollbar {
        width: 0.5rem;
        height: 0.5rem;
      }

      .data-grid-scroll::-webkit-scrollbar-track {
        border-radius: 999px;
        background: transparent;
      }

      .data-grid-scroll::-webkit-scrollbar-thumb {
        border: 1px solid #f8fafc;
        border-radius: 999px;
        background: var(--data-grid-scrollbar-thumb);
      }

      .data-grid-scroll::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
      }

      .data-grid-scroll::-webkit-scrollbar-corner {
        background: transparent;
      }

      .data-grid-row-selected {
        box-shadow: inset 3px 0 0 #2563eb;
      }

      .data-grid-table-region {
        position: relative;
        min-height: 0;
        background: #ffffff;
      }

      .data-grid-card-list {
        display: none;
      }

      .data-grid-table-view--fit {
        min-width: 100%;
        table-layout: fixed;
      }

      .data-grid-table-view--scroll {
        min-width: max(100%, var(--data-grid-table-min-width, 64rem));
        table-layout: auto;
      }

      .data-grid-row-number-col {
        width: 3rem;
      }

      .data-grid-head-cell,
      .data-grid-selection-head {
        padding: var(--data-grid-padding-block-head) var(--data-grid-padding-inline);
      }

      .data-grid-head-num {
        padding: var(--data-grid-padding-block-head) var(--data-grid-padding-num-inline);
      }

      .data-grid-body-cell {
        padding: var(--data-grid-padding-block-body) var(--data-grid-padding-inline);
        font-size: var(--data-grid-text-md);
        line-height: 1.35;
      }

      .data-grid-body-num {
        padding: calc(var(--data-grid-padding-block-body) - 0.03rem)
          var(--data-grid-padding-num-inline);
      }

      .data-grid-selection-cell {
        padding: 0.6rem var(--data-grid-padding-inline);
      }

      .data-grid-skel-cell {
        padding: var(--data-grid-padding-skel) var(--data-grid-padding-inline);
      }

      .data-grid-skel-num {
        padding: var(--data-grid-padding-skel) var(--data-grid-padding-num-inline);
      }

      .data-grid-skel-select {
        padding: var(--data-grid-padding-skel) var(--data-grid-padding-inline);
      }

      .data-grid-row-number-cell {
        width: 3rem;
        text-align: center;
        white-space: nowrap;
      }

      .data-grid-selection-col {
        width: 2.75rem;
      }

      .data-grid-head {
        background: var(--data-grid-head-bg);
      }

      .data-grid-head th {
        border-color: var(--data-grid-border);
        background: var(--data-grid-head-bg);
        color: #475569;
        font-weight: 600;
      }

      .data-grid-head button:disabled {
        cursor: wait;
        opacity: 0.7;
      }

      .data-grid-row {
        background: #ffffff;
      }

      .data-grid-row:hover {
        background: var(--data-grid-row-hover);
      }

      .data-grid-row.data-grid-row-selected {
        background: var(--data-grid-row-selected);
      }

      .data-grid-row td {
        border-color: var(--data-grid-border-soft);
      }

      .data-grid-table-region.is-loading table {
        pointer-events: none;
      }

      .data-grid-skeleton-box,
      .data-grid-skeleton-line {
        display: inline-block;
        overflow: hidden;
        position: relative;
        background: #e5e7eb;
      }

      .data-grid-skeleton-line {
        width: min(100%, 10rem);
        height: 0.75rem;
        border-radius: 999px;
      }

      .data-grid-skeleton-line--short {
        width: 5rem;
      }

      .data-grid-skeleton-line--number {
        width: 1.5rem;
      }

      .data-grid-skeleton-line--title {
        width: 13rem;
        height: 0.9rem;
      }

      .data-grid-skeleton-box::after,
      .data-grid-skeleton-line::after {
        content: '';
        position: absolute;
        inset: 0;
        transform: translateX(-100%);
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.65), transparent);
        animation: data-grid-skeleton 1200ms ease-in-out infinite;
      }

      .data-grid-state {
        display: grid;
        min-height: 14rem;
        place-items: center;
        padding: 3.5rem 1.5rem;
        background: #ffffff;
        text-align: center;
      }

      .data-grid-state--error {
        background: #ffffff;
      }

      .data-grid-footer {
        border-color: var(--data-grid-border);
        background: #ffffff;
      }

      .data-grid-button-spinner {
        width: 0.75rem;
        height: 0.75rem;
        border: 2px solid currentColor;
        border-right-color: transparent;
        border-radius: 999px;
        animation: data-grid-spin 800ms linear infinite;
      }

      @keyframes data-grid-spin {
        to {
          transform: rotate(360deg);
        }
      }

      @keyframes data-grid-skeleton {
        to {
          transform: translateX(100%);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .data-grid-button-spinner {
          animation: none;
        }

        .data-grid-skeleton-box::after,
        .data-grid-skeleton-line::after {
          animation: none;
        }
      }

      @media (max-width: 1023px) {
        .data-grid-filter-field--wide {
          grid-column: span 1;
        }

        .data-grid-filter-range {
          grid-template-columns: minmax(0, 1fr);
        }
      }

      @media (max-width: 767px) {
        .data-grid-filter-panel {
          padding: 0.75rem;
        }

        .data-grid-search-field {
          width: 100%;
        }

        .data-grid-filter-chips {
          justify-content: flex-start;
          flex-wrap: nowrap;
          overflow-x: auto;
          padding-bottom: 0.125rem;
          scrollbar-width: thin;
        }

        .data-grid-filter-chip,
        .data-grid-filter-chips__clear-all {
          flex: 0 0 auto;
        }

        .data-grid-table-view {
          display: none;
        }

        .data-grid-card-list {
          display: grid;
          gap: 0.75rem;
          padding: 0.75rem;
          background: #f8fafc;
        }

        .data-grid-mobile-card {
          display: grid;
          gap: 0.75rem;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: #ffffff;
          padding: 0.75rem;
        }

        .data-grid-mobile-counter {
          justify-self: start;
          border-radius: 999px;
          background: #f1f5f9;
          padding: 0.15rem 0.5rem;
          color: #475569;
          font-size: var(--data-grid-text-sm);
          font-weight: 700;
        }

        .data-grid-mobile-card--selected {
          border-color: #bfdbfe;
          background: #eff6ff;
        }

        .data-grid-mobile-select {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: #374151;
          font-size: var(--data-grid-text-md);
          font-weight: 600;
        }

        .data-grid-mobile-fields {
          display: grid;
          gap: 0.75rem;
          margin: 0;
        }

        .data-grid-mobile-field {
          display: grid;
          gap: 0.25rem;
        }

        .data-grid-mobile-field dt {
          color: #6b7280;
          font-size: var(--data-grid-text-sm);
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .data-grid-mobile-field dd {
          min-width: 0;
          margin: 0;
          color: #111827;
          font-size: 0.74rem;
          font-weight: 600;
        }

        .data-grid-mobile-field--primary dd {
          font-size: 0.8rem;
        }

        .data-grid-mobile-actions {
          display: flex;
          justify-content: flex-end;
          border-top: 1px solid #e5e7eb;
          padding-top: 0.75rem;
        }
      }
    `,
  ],
})
export class DataGridComponent<T = unknown> implements OnChanges, OnDestroy {
  @Input() title = '';
  @Input() showHeader = true;
  @Input() columns: DataGridColumn<T>[] = [];
  @Input() rows: T[] = [];
  @Input() filters: DataGridFilter<T>[] = [];
  @Input() filtersEnabled = false;
  @Input() searchPlaceholder = 'Buscar...';
  @Input() primaryActionLabel = '';
  @Input() showExportAction = false;
  @Input() selectable = false;
  @Input() selectionLabel = 'registros';
  @Input() persistenceKey = '';
  @Input() maxItems = 10;
  @Input() pageSizeOptions = [10, 25, 50, 100];
  @Input() gridHeight: string | number = '';
  @Input() cardClassName = '';
  @Input() className = '';
  @Input() emptyTitle = 'No se encontraron resultados';
  @Input() emptyDescription = 'Prueba ajustando la busqueda o los filtros.';
  @Input() emptyIcon = Search;
  @Input() loading = false;
  @Input() loadingLabel = 'Cargando resultados...';
  @Input() errorMessage = '';
  @Input() hoverRows = true;
  @Input() bulkActionLoading = false;
  @Input() bulkActionResult: DataGridBulkActionResult<T> | null = null;
  @Input() bulkActions: DataGridBulkActionOption[] = [
    { id: 'activate', label: 'Activar', value: 'activo', tone: 'success', confirmLabel: 'Activar seleccion' },
    { id: 'deactivate', label: 'Desactivar', value: 'inactivo', tone: 'danger', confirmLabel: 'Desactivar seleccion' },
    { id: 'change-status', label: 'Suspender', value: 'suspendido', tone: 'warning', confirmLabel: 'Suspender seleccion' },
  ];
  @Input() trackBy: (index: number, row: T) => unknown = (index) => index;
  @Output() readonly refresh = new EventEmitter<void>();
  @Output() readonly primaryAction = new EventEmitter<void>();
  @Output('export') readonly exportRows = new EventEmitter<DataGridExportEvent<T>>();
  @Output() readonly bulkAction = new EventEmitter<DataGridBulkActionEvent<T>>();
  @Output() readonly retry = new EventEmitter<void>();

  readonly previousIcon = ArrowLeft;
  readonly nextIcon = ChevronRight;
  readonly downloadIcon = Download;
  readonly filterIcon = Filter;
  readonly plusIcon = Plus;
  readonly refreshIcon = RefreshCw;
  readonly searchIcon = Search;
  readonly selectionIcon = CheckCircle;
  readonly settingsIcon = Settings;
  readonly sortNeutralIcon = ArrowUpDown;
  readonly sortAscIcon = ArrowUp;
  readonly sortDescIcon = ArrowDown;
  readonly clearIcon = X;
  readonly skeletonRows = Array.from({ length: 6 }, (_item, index) => index);
  readonly mobileSkeletonRows = Array.from({ length: 3 }, (_item, index) => index);
  currentPage = 1;
  pageInput = '1';
  pageInputError = '';
  showColumnPanel = false;
  showExportPanel = false;
  exportAllColumns = false;
  showFilters = true;
  showPagePopover = false;
  effectivePageSize = 10;
  searchInputTerm = '';
  searchTerm = '';
  sortColumnId = '';
  sortDirection: DataGridSortDirection = 'asc';
  filterValues: Record<string, DataGridFilterValue> = {};
  draftFilterValues: Record<string, DataGridFilterValue> = {};
  pendingBulkAction: DataGridBulkActionOption | null = null;
  activeBulkAction: DataGridBulkAction | null = null;
  notice: DataGridNotice | null = null;

  private visibleColumnIds = new Set<string>();
  private selectedRowKeys = new Set<unknown>();
  private searchDebounceId = 0;
  private noticeTimeoutId = 0;
  private preferencesLoaded = false;

  @ContentChildren(DataGridCellDirective)
  private readonly customCells?: QueryList<DataGridCellDirective<T>>;

  @HostListener('document:click', ['$event'])
  closePanelsOnOutsideClick(event: MouseEvent): void {
    if (!this.showColumnPanel && !this.showPagePopover && !this.showExportPanel) {
      return;
    }

    const target = event.target;

    if (target instanceof Element && target.closest('[data-grid-overlay-root]')) {
      return;
    }

    this.closePanels();
  }

  @HostListener('document:keydown.escape')
  closePanelsOnEscape(): void {
    if (this.pendingBulkAction) {
      this.cancelBulkAction();
      return;
    }

    this.closePanels();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['columns']) {
      this.syncVisibleColumns();
    }

    if (!this.preferencesLoaded && this.persistenceKey) {
      this.restorePreferences();
      this.preferencesLoaded = true;
    }

    if (changes['maxItems']) {
      this.effectivePageSize = this.normalizePageSize(this.maxItems);
    }

    if (changes['rows'] || changes['maxItems'] || changes['filters']) {
      this.clampCurrentPage();
      this.pruneSelection();
    }

    if (changes['bulkActionLoading'] && !this.bulkActionLoading) {
      this.activeBulkAction = null;
    }

    if (changes['bulkActionResult'] && this.bulkActionResult) {
      this.handleBulkActionResult(this.bulkActionResult);
    }
  }

  ngOnDestroy(): void {
    window.clearTimeout(this.searchDebounceId);
    window.clearTimeout(this.noticeTimeoutId);
  }

  @HostBinding('class')
  get hostClass(): string {
    return `block w-full min-w-0 ${this.className}`.trim();
  }

  get gridCardClass(): string {
    return `relative flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-none ${this.cardClassName}`.trim();
  }

  get gridCardStyle(): Record<string, string> {
    const height = this.normalizeCssSize(this.gridHeight);
    return height ? { height, 'max-height': height } : { 'max-height': 'min(36rem, calc(100vh - 14rem))' };
  }

  get gridBodyStyle(): Record<string, string> {
    return {};
  }

  get pageSize(): number {
    return this.effectivePageSize;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredRows.length / this.pageSize));
  }

  get visibleColumns(): DataGridColumn<T>[] {
    const columns = this.columns.filter((column) => this.visibleColumnIds.has(column.id));
    return columns.length > 0 ? columns : this.columns.slice(0, 1);
  }

  get mobileColumns(): DataGridColumn<T>[] {
    const columns = this.visibleColumns.filter((column) => column.id !== 'acciones');
    const prioritized = columns
      .filter((column) => this.mobileColumnPriority(column) <= 2)
      .sort((left, right) => this.mobileColumnPriority(left) - this.mobileColumnPriority(right));

    return prioritized.length > 0 ? prioritized : columns.slice(0, 4);
  }

  get mobileActionColumn(): DataGridColumn<T> | null {
    return this.visibleColumns.find((column) => column.id === 'acciones') ?? null;
  }

  get shouldFitColumns(): boolean {
    return this.visibleColumns.length + 1 <= 6 && !this.visibleColumns.some((column) => this.hasExplicitColumnWidth(column));
  }

  get tableMinWidth(): string {
    const rowNumberWidth = 3;
    const selectionWidth = this.selectable ? 2.75 : 0;
    const columnWidth = this.visibleColumns.reduce((total, column) => total + this.estimatedColumnWidth(column), rowNumberWidth + selectionWidth);
    return `${Math.max(42, Math.min(columnWidth, 96))}rem`;
  }

  get visibleFilters(): DataGridFilter<T>[] {
    return this.visibleColumns
      .filter((column) => column.id !== 'acciones' && Boolean(column.field))
      .map((column) => {
        const configuredFilter = this.filters.find((filter) => filter.id === column.id);

        return (
          configuredFilter ?? {
            id: column.id,
            label: column.header,
            field: column.field!,
            type: 'text',
            emptyLabel: `Todos`,
          }
        );
      });
  }

  get filterGridStyle(): Record<string, string> {
    return {
      'grid-template-columns': 'repeat(auto-fit, minmax(10.75rem, 1fr))',
    };
  }

  get visibleColumnSpan(): number {
    return Math.max(1, this.visibleColumns.length + 1 + (this.selectable ? 1 : 0));
  }

  get exportableVisibleColumns(): DataGridColumn<T>[] {
    return this.visibleColumns.filter((column) => Boolean(column.field));
  }

  get exportableColumns(): DataGridColumn<T>[] {
    const columns = this.exportAllColumns
      ? this.columns.filter((column) => Boolean(column.field))
      : this.exportableVisibleColumns;

    return columns.length > 0 ? columns : this.columns.filter((column) => Boolean(column.field));
  }

  get selectedRows(): T[] {
    return this.rows.filter((row, index) => this.selectedRowKeys.has(this.rowKey(row, index)));
  }

  get allPageRowsSelected(): boolean {
    return this.pagedRows.length > 0 && this.pagedRows.every((row, index) => this.selectedRowKeys.has(this.rowKey(row, this.absoluteIndex(index))));
  }

  get somePageRowsSelected(): boolean {
    return this.pagedRows.some((row, index) => this.selectedRowKeys.has(this.rowKey(row, this.absoluteIndex(index))));
  }

  get hasActiveFilters(): boolean {
    return Boolean(this.searchTerm.trim()) || Object.values(this.filterValues).some((value) => this.hasFilterValue(value));
  }

  get activeFilterChips(): Array<{ id: string; label: string; value: string }> {
    const chips: Array<{ id: string; label: string; value: string }> = [];

    if (this.searchTerm.trim()) {
      chips.push({
        id: '__search',
        label: 'Busqueda',
        value: this.searchTerm.trim(),
      });
    }

    this.visibleFilters.forEach((filter) => {
      const value = this.filterValues[filter.id];

      if (!this.hasFilterValue(value)) {
        return;
      }

      chips.push({
        id: filter.id,
        label: filter.label,
        value: this.filterDisplayValue(filter, value),
      });
    });

    return chips;
  }

  get resolvedEmptyTitle(): string {
    if (this.hasActiveFilters) {
      return 'No se encontraron registros con los filtros aplicados.';
    }

    return this.emptyTitle;
  }

  get resolvedEmptyDescription(): string {
    if (this.hasActiveFilters) {
      return 'Ajusta o limpia los filtros para ampliar los resultados.';
    }

    return this.emptyDescription;
  }

  get pagedRows(): T[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.sortedRows.slice(start, start + this.pageSize);
  }

  get rangeStart(): number {
    return this.filteredRows.length === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  get rangeEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredRows.length);
  }

  get filteredRows(): T[] {
    return this.rows.filter((row) => {
      return this.matchesSearch(row) && this.visibleFilters.every((filter) => {
        const selected = this.filterValues[filter.id];

        if (!this.hasFilterValue(selected)) {
          return true;
        }

        return this.matchesFilter(row, filter, selected);
      });
    });
  }

  get sortedRows(): T[] {
    const column = this.columns.find((item) => item.id === this.sortColumnId);

    if (!column || !this.isSortable(column)) {
      return this.filteredRows;
    }

    return [...this.filteredRows].sort((left, right) => {
      const result = this.compareValues(this.rawValue(left, column), this.rawValue(right, column), column);
      return this.sortDirection === 'asc' ? result : -result;
    });
  }

  trackPagedRow(index: number, row: T): unknown {
    return this.trackBy(this.absoluteIndex(index), row);
  }

  isRowSelected(row: T): boolean {
    return this.selectedRowKeys.has(this.rowKey(row));
  }

  toggleRowSelection(row: T, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const key = this.rowKey(row);

    if (checked) {
      this.selectedRowKeys.add(key);
    } else {
      this.selectedRowKeys.delete(key);
    }
  }

  togglePageSelection(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;

    this.pagedRows.forEach((row, index) => {
      const key = this.rowKey(row, this.absoluteIndex(index));

      if (checked) {
        this.selectedRowKeys.add(key);
      } else {
        this.selectedRowKeys.delete(key);
      }
    });
  }

  clearSelection(): void {
    this.selectedRowKeys.clear();
  }

  clearNotice(): void {
    window.clearTimeout(this.noticeTimeoutId);
    this.notice = null;
  }

  requestBulkAction(action: DataGridBulkActionOption): void {
    const rows = this.selectedRows;

    if (rows.length === 0) {
      return;
    }

    this.closePanels();
    this.pendingBulkAction = action;
  }

  confirmBulkAction(): void {
    if (!this.pendingBulkAction) {
      return;
    }

    const action = this.pendingBulkAction;
    const rows = this.selectedRows;
    this.pendingBulkAction = null;

    if (rows.length === 0) {
      return;
    }

    this.activeBulkAction = action.id;
    this.bulkAction.emit({
      action: action.id,
      rows,
      value: action.value,
      label: action.label,
    });
  }

  cancelBulkAction(): void {
    this.pendingBulkAction = null;
  }

  get bulkConfirmationVariant(): MessageBoxVariant {
    return this.pendingBulkAction?.tone === 'danger' || this.pendingBulkAction?.tone === 'blocked' ? 'warning' : 'info';
  }

  get bulkConfirmationTitle(): string {
    return this.pendingBulkAction?.confirmTitle ?? `Confirmar cambio a ${this.pendingBulkAction?.label ?? 'estado'}`;
  }

  get bulkConfirmationMessage(): string {
    const count = this.selectedRows.length;
    const label = `${count} ${this.selectionLabel}`;

    return (
      this.pendingBulkAction?.confirmMessage ??
      `Se cambiara el estado de ${label} seleccionados a ${this.pendingBulkAction?.label ?? 'el estado indicado'}. Esta accion no afecta registros filtrados que no esten marcados.`
    );
  }

  get bulkConfirmationPrimaryLabel(): string {
    return this.pendingBulkAction?.confirmLabel ?? `Aplicar ${this.pendingBulkAction?.label ?? 'estado'}`;
  }

  bulkActionButtonClass(action: DataGridBulkActionOption): string {
    switch (action.tone) {
      case 'success':
        return 'border-green-200 text-green-700 hover:bg-green-50';
      case 'warning':
        return 'border-yellow-200 text-yellow-700 hover:bg-yellow-50';
      case 'danger':
        return 'border-red-200 text-red-700 hover:bg-red-50';
      case 'blocked':
        return 'border-neutral-300 text-neutral-700 hover:bg-neutral-50';
      case 'info':
        return 'border-blue-200 text-blue-700 hover:bg-blue-50';
      default:
        return 'border-neutral-200 text-neutral-700 hover:bg-neutral-50';
    }
  }

  private clearSelectionByContext(message: string): void {
    const hadSelection = this.selectedRowKeys.size > 0;
    this.clearSelection();

    if (!hadSelection) {
      return;
    }

    this.showNotice('Seleccion limpiada', message, 'info');
  }

  private showNotice(title: string, message: string, variant: DataGridNotice['variant']): void {
    window.clearTimeout(this.noticeTimeoutId);
    this.notice = { title, message, variant };
    this.noticeTimeoutId = window.setTimeout(() => {
      this.notice = null;
    }, 4200);
  }

  private handleBulkActionResult(result: DataGridBulkActionResult<T>): void {
    this.activeBulkAction = null;

    if (result.status === 'success') {
      this.clearSelection();
      this.showNotice(
        'Accion completada',
        result.message || `${result.processed} de ${result.total} ${this.selectionLabel} procesados correctamente.`,
        'success',
      );
      return;
    }

    if (result.status === 'partial') {
      this.clearSelection();
      this.showNotice(
        'Accion completada parcialmente',
        result.message || `${result.processed} de ${result.total} ${this.selectionLabel} procesados correctamente.`,
        'warning',
      );
      return;
    }

    this.showNotice(
      'No se pudo completar la accion',
      result.message || `No se procesaron los ${result.total} ${this.selectionLabel} seleccionados.`,
      'error',
    );
  }

  absoluteIndex(index: number): number {
    return (this.currentPage - 1) * this.pageSize + index;
  }

  cellTemplate(columnId: string): TemplateRef<DataGridCellContext<T>> | null {
    return this.customCells?.find((cell) => cell.columnId === columnId)?.template ?? null;
  }

  cellContext(row: T, column: DataGridColumn<T>, index: number): DataGridCellContext<T> {
    return {
      $implicit: row,
      row,
      column,
      value: this.rawValue(row, column),
      index,
    };
  }

  formattedValue(row: T, column: DataGridColumn<T>, index: number): string | number {
    const value = this.rawValue(row, column);

    if (column.format) {
      return column.format(value, row, index);
    }

    return value == null ? '' : String(value);
  }

  alignmentHeaderClass(column: DataGridColumn<T>): string {
    return column.align === 'right'
      ? 'text-right'
      : column.align === 'center'
        ? 'text-center'
        : 'text-left';
  }

  alignmentCellClass(column: DataGridColumn<T>): string {
    return column.align === 'right'
      ? 'text-right'
      : column.align === 'center'
        ? 'text-center'
        : 'text-left';
  }

  columnSizingStyle(column: DataGridColumn<T>): Record<string, string> {
    const width = this.normalizeCssSize(column.width ?? '');
    const minWidth = this.normalizeCssSize(column.minWidth ?? '');

    if (this.shouldFitColumns) {
      return width ? { width } : {};
    }

    return {
      width: width || `${this.estimatedColumnWidth(column)}rem`,
      'min-width': minWidth || `${this.estimatedColumnWidth(column)}rem`,
    };
  }

  previousPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  updatePageSize(event: Event): void {
    this.effectivePageSize = this.normalizePageSize((event.target as HTMLSelectElement).value);
    this.currentPage = 1;
    this.pageInput = '1';
    this.persistPreferences();
  }

  updateSearchTerm(event: Event): void {
    this.searchInputTerm = (event.target as HTMLInputElement).value;
    window.clearTimeout(this.searchDebounceId);
    this.searchDebounceId = window.setTimeout(() => {
      this.searchTerm = this.searchInputTerm.trim();
      this.currentPage = 1;
      this.pageInput = '1';
      this.clearSelectionByContext('La seleccion se limpio porque cambio la busqueda.');
      this.persistPreferences();
    }, 250);
  }

  filterOptionValue(option: string | { label: string; value: string }): string {
    return typeof option === 'string' ? option : option.value;
  }

  filterOptionLabel(option: string | { label: string; value: string }): string {
    return typeof option === 'string' ? option : option.label;
  }

  filterTextValue(filter: DataGridFilter<T>): string {
    const value = this.draftFilterValues[filter.id];
    return typeof value === 'string' ? value : '';
  }

  filterDateRangeValue(filter: DataGridFilter<T>, bound: keyof DataGridDateRangeValue): string {
    const value = this.draftFilterValues[filter.id];
    return typeof value === 'object' && value != null ? value[bound] ?? '' : '';
  }

  emptyFilterLabel(filter: DataGridFilter<T>): string {
    return filter.emptyLabel ?? 'Todo';
  }

  filterPlaceholder(filter: DataGridFilter<T>): string {
    return filter.placeholder ?? `Buscar ${filter.label.toLowerCase()}`;
  }

  clearSearchTerm(): void {
    window.clearTimeout(this.searchDebounceId);
    this.searchInputTerm = '';
    this.searchTerm = '';
    this.currentPage = 1;
    this.pageInput = '1';
    this.clearSelectionByContext('La seleccion se limpio porque se quito la busqueda.');
    this.persistPreferences();
  }

  removeFilterChip(filterId: string): void {
    if (filterId === '__search') {
      this.clearSearchTerm();
      return;
    }

    const filter = this.filters.find((item) => item.id === filterId);

    this.filterValues = {
      ...this.filterValues,
      [filterId]: this.emptyFilterValue(filter),
    };
    this.draftFilterValues = {
      ...this.draftFilterValues,
      [filterId]: this.emptyFilterValue(filter),
    };
    this.currentPage = 1;
    this.pageInput = '1';
    this.clearSelectionByContext('La seleccion se limpio porque cambio el contexto filtrado.');
    this.persistPreferences();
  }

  clearAllFilters(): void {
    window.clearTimeout(this.searchDebounceId);
    this.searchInputTerm = '';
    this.searchTerm = '';
    this.filterValues = {};
    this.draftFilterValues = {};
    this.currentPage = 1;
    this.pageInput = '1';
    this.clearSelectionByContext('La seleccion se limpio porque se quitaron los filtros.');
    this.persistPreferences();
  }

  updateFilterValue(filter: DataGridFilter<T>, event: Event): void {
    this.draftFilterValues = {
      ...this.draftFilterValues,
      [filter.id]: (event.target as HTMLInputElement | HTMLSelectElement).value,
    };
  }

  updateFilterModelValue(filter: DataGridFilter<T>, value: string): void {
    this.draftFilterValues = {
      ...this.draftFilterValues,
      [filter.id]: value,
    };
  }

  updateDateRangeFilterValue(filter: DataGridFilter<T>, bound: keyof DataGridDateRangeValue, valueOrEvent: string | Event): void {
    const currentValue = this.draftFilterValues[filter.id];
    const rangeValue =
      typeof currentValue === 'object' && currentValue != null
        ? currentValue
        : this.emptyFilterValue(filter);
    const value = typeof valueOrEvent === 'string' ? valueOrEvent : (valueOrEvent.target as HTMLInputElement).value;

    this.draftFilterValues = {
      ...this.draftFilterValues,
      [filter.id]: {
        ...(typeof rangeValue === 'object' && rangeValue != null ? rangeValue : {}),
        [bound]: value,
      },
    };
  }

  applyFilters(): void {
    window.clearTimeout(this.searchDebounceId);
    this.searchTerm = this.searchInputTerm.trim();
    this.filterValues = { ...this.draftFilterValues };
    this.currentPage = 1;
    this.pageInput = '1';
    this.clearSelectionByContext('La seleccion se limpio porque cambio el contexto filtrado.');
    this.persistPreferences();
  }

  filterOptions(filter: DataGridFilter<T>): Array<string | { label: string; value: string }> {
    if (filter.options) {
      return filter.options;
    }

    return [...new Set(this.rows.map((row) => String(row[filter.field] ?? '')).filter(Boolean))].sort((left, right) =>
      left.localeCompare(right, 'es', { sensitivity: 'base' }),
    );
  }

  filterDisplayValue(filter: DataGridFilter<T>, value: DataGridFilterValue): string {
    if (this.isDateRangeFilter(filter)) {
      const range = typeof value === 'object' && value != null ? value : {};
      const from = range.from ? this.formatFilterDateValue(range.from) : '...';
      const to = range.to ? this.formatFilterDateValue(range.to) : '...';
      return `${from} - ${to}`;
    }

    if (typeof value !== 'string') {
      return '';
    }

    if (this.isDateFilter(filter)) {
      return this.formatFilterDateValue(value);
    }

    const option = this.filterOptions(filter).find((item) => this.filterOptionValue(item) === value);
    return option ? this.filterOptionLabel(option) : value;
  }

  isSelectFilter(filter: DataGridFilter<T>): boolean {
    return filter.type === 'select' || Boolean(filter.options?.length);
  }

  isDateFilter(filter: DataGridFilter<T>): boolean {
    return filter.type === 'date';
  }

  isDateRangeFilter(filter: DataGridFilter<T>): boolean {
    return filter.type === 'date-range';
  }

  isMobilePrimaryColumn(column: DataGridColumn<T>): boolean {
    return this.mobileColumnPriority(column) === 1;
  }

  goToPage(page: number): void {
    this.currentPage = this.normalizePage(page);
    this.pageInput = String(this.currentPage);
  }

  togglePagePopover(): void {
    if (this.showPagePopover) {
      this.closePagePopover();
      return;
    }

    this.showColumnPanel = false;
    this.showExportPanel = false;
    this.pageInput = String(this.currentPage);
    this.pageInputError = '';
    this.showPagePopover = true;
  }

  toggleExportPanel(): void {
    if (this.showExportPanel) {
      this.showExportPanel = false;
      return;
    }

    this.showColumnPanel = false;
    this.showPagePopover = false;
    this.showExportPanel = true;
  }

  toggleExportColumns(event: Event): void {
    this.exportAllColumns = (event.target as HTMLInputElement).checked;
  }

  exportPageRows(): void {
    this.emitExport('page', this.pagedRows);
  }

  exportSelectedRows(): void {
    this.emitExport('selected', this.selectedRows);
  }

  exportFilteredRows(): void {
    this.emitExport('filtered', this.filteredRows);
  }

  private emitExport(scope: DataGridExportScope, rows: T[]): void {
    if (rows.length === 0) {
      return;
    }

    this.exportRows.emit({
      scope,
      rows,
      columns: this.exportableColumns,
      includeHiddenColumns: this.exportAllColumns,
    });
    this.showExportPanel = false;
  }

  closePagePopover(): void {
    this.showPagePopover = false;
    this.pageInputError = '';
  }

  closePanels(): void {
    this.showColumnPanel = false;
    this.showExportPanel = false;
    this.closePagePopover();
  }

  updatePageInput(event: Event): void {
    this.pageInput = (event.target as HTMLInputElement).value;
    this.pageInputError = '';
  }

  confirmPagePopover(): void {
    const page = Number(this.pageInput);

    if (!Number.isInteger(page) || page < 1 || page > this.totalPages) {
      this.pageInputError = `La pagina debe estar entre 1 y ${this.totalPages}.`;
      return;
    }

    this.goToPage(page);
    this.closePagePopover();
  }

  toggleColumnPanel(): void {
    this.showPagePopover = false;
    this.showExportPanel = false;
    this.showColumnPanel = !this.showColumnPanel;
  }

  isColumnVisible(columnId: string): boolean {
    return this.visibleColumnIds.has(columnId);
  }

  isColumnFixed(column: DataGridColumn<T>): boolean {
    return column.hideable === false || this.columns[0]?.id === column.id;
  }

  isLastVisibleColumn(columnId: string): boolean {
    return this.visibleColumnIds.has(columnId) && this.visibleColumnIds.size <= 1;
  }

  toggleColumn(columnId: string): void {
    const column = this.columns.find((item) => item.id === columnId);

    if (!column || this.isColumnFixed(column)) {
      return;
    }

    if (this.visibleColumnIds.has(columnId)) {
      if (this.visibleColumnIds.size <= 1) {
        return;
      }

      this.visibleColumnIds.delete(columnId);
      this.persistPreferences();
      return;
    }

    this.visibleColumnIds.add(columnId);
    this.persistPreferences();
  }

  showAllColumns(): void {
    this.visibleColumnIds = new Set(this.columns.map((column) => column.id));
    this.persistPreferences();
  }

  restoreDefaultColumns(): void {
    this.visibleColumnIds = new Set(this.defaultVisibleColumnIds());
    this.persistPreferences();
  }

  isSortable(column: DataGridColumn<T>): boolean {
    return column.sortable !== false && Boolean(column.field);
  }

  toggleSort(column: DataGridColumn<T>): void {
    if (!this.isSortable(column)) {
      return;
    }

    if (this.sortColumnId === column.id) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumnId = column.id;
      this.sortDirection = 'asc';
    }

    this.currentPage = 1;
    this.pageInput = '1';
    this.persistPreferences();
  }

  sortIcon(column: DataGridColumn<T>) {
    if (this.sortColumnId !== column.id) {
      return this.sortNeutralIcon;
    }

    return this.sortDirection === 'asc' ? this.sortAscIcon : this.sortDescIcon;
  }

  sortAriaValue(column: DataGridColumn<T>): 'ascending' | 'descending' | 'none' {
    if (this.sortColumnId !== column.id) {
      return 'none';
    }

    return this.sortDirection === 'asc' ? 'ascending' : 'descending';
  }

  private rawValue(row: T, column: DataGridColumn<T>): unknown {
    return column.field ? row[column.field] : '';
  }

  private matchesSearch(row: T): boolean {
    const term = this.normalizeText(this.searchTerm);

    if (!term) {
      return true;
    }

    return this.columns
      .filter((column) => Boolean(column.field))
      .some((column) => this.normalizeText(String(this.rawValue(row, column) ?? '')).includes(term));
  }

  private hasExplicitColumnWidth(column: DataGridColumn<T>): boolean {
    return Boolean(column.width || column.minWidth || column.widthClass?.includes('min-w-') || column.widthClass?.includes('w-'));
  }

  private estimatedColumnWidth(column: DataGridColumn<T>): number {
    if (column.id === 'acciones' || !column.field) {
      return 6;
    }

    if (column.width) {
      return this.cssSizeToRem(column.width) ?? 9;
    }

    if (column.minWidth) {
      return this.cssSizeToRem(column.minWidth) ?? 9;
    }

    if (column.type === 'number') {
      return 7.5;
    }

    if (column.type === 'date') {
      return 8;
    }

    return Math.max(8, Math.min(14, column.header.length * 0.62 + 4));
  }

  private cssSizeToRem(value: string): number | null {
    const normalized = value.trim();

    if (!normalized) {
      return null;
    }

    if (normalized.endsWith('rem')) {
      return Number.parseFloat(normalized);
    }

    if (normalized.endsWith('px')) {
      return Number.parseFloat(normalized) / 16;
    }

    return null;
  }

  private mobileColumnPriority(column: DataGridColumn<T>): number {
    if (column.priorityResponsive === 'primary') {
      return 1;
    }

    if (column.priorityResponsive === 'secondary') {
      return 2;
    }

    if (column.priorityResponsive === 'tertiary') {
      return 3;
    }

    if (typeof column.priorityResponsive === 'number') {
      return column.priorityResponsive;
    }

    const visibleIndex = this.visibleColumns.findIndex((item) => item.id === column.id);
    return visibleIndex >= 0 ? visibleIndex + 1 : 99;
  }

  private compareValues(left: unknown, right: unknown, column: DataGridColumn<T>): number {
    if (left == null && right == null) {
      return 0;
    }

    if (left == null) {
      return -1;
    }

    if (right == null) {
      return 1;
    }

    const type = column.type ?? this.inferColumnType(left, right);

    if (type === 'number') {
      return Number(left) - Number(right);
    }

    if (type === 'date') {
      return this.toDateTime(left) - this.toDateTime(right);
    }

    return String(left).localeCompare(String(right), 'es', {
      numeric: true,
      sensitivity: 'base',
    });
  }

  private inferColumnType(left: unknown, right: unknown): DataGridColumnType {
    if (typeof left === 'number' || typeof right === 'number') {
      return 'number';
    }

    if (this.isDateLike(left) && this.isDateLike(right)) {
      return 'date';
    }

    return 'text';
  }

  private isDateLike(value: unknown): boolean {
    return typeof value === 'string' && Number.isFinite(this.toDateTime(value));
  }

  private toDateTime(value: unknown): number {
    if (typeof value !== 'string') {
      return Number.NaN;
    }

    const chileDateMatch = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

    if (chileDateMatch) {
      const [, day, month, year] = chileDateMatch;
      return new Date(Number(year), Number(month) - 1, Number(day)).getTime();
    }

    return new Date(value).getTime();
  }

  private normalizePageSize(value: unknown): number {
    return Math.max(1, Math.floor(Number(value) || 1));
  }

  private normalizeCssSize(value: string | number): string {
    if (typeof value === 'number') {
      return Number.isFinite(value) && value > 0 ? `${value}px` : '';
    }

    return value.trim();
  }

  private hasFilterValue(value: DataGridFilterValue | undefined): boolean {
    if (typeof value === 'string') {
      return value.trim().length > 0;
    }

    if (!value) {
      return false;
    }

    return Boolean(value.from?.trim() || value.to?.trim());
  }

  private emptyFilterValue(filter?: DataGridFilter<T>): DataGridFilterValue {
    return filter?.type === 'date-range' ? {} : '';
  }

  private matchesFilter(row: T, filter: DataGridFilter<T>, selected: DataGridFilterValue): boolean {
    const value = row[filter.field];

    if (this.isSelectFilter(filter)) {
      return String(value ?? '') === String(selected ?? '');
    }

    if (this.isDateRangeFilter(filter)) {
      return this.matchesDateRangeFilter(value, selected);
    }

    if (this.isDateFilter(filter)) {
      return this.matchesDateFilter(value, selected, filter.operator);
    }

    return this.matchesTextFilter(String(value ?? ''), selected, filter);
  }

  private matchesTextFilter(value: string, selected: DataGridFilterValue, filter: DataGridFilter<T>): boolean {
    if (typeof selected !== 'string') {
      return true;
    }

    const normalizedValue = this.normalizeFilterText(value, filter.normalize);
    const normalizedSelected = this.normalizeFilterText(selected, filter.normalize);

    if (!normalizedSelected) {
      return true;
    }

    if (filter.matchMode === 'tokens') {
      const tokens = normalizedSelected.split(' ').filter(Boolean);
      return tokens.every((token) => normalizedValue.includes(token));
    }

    switch (filter.operator) {
      case 'equals':
        return normalizedValue === normalizedSelected;
      case 'startsWith':
        return normalizedValue.startsWith(normalizedSelected);
      case 'endsWith':
        return normalizedValue.endsWith(normalizedSelected);
      default:
        return normalizedValue.includes(normalizedSelected);
    }
  }

  private matchesDateFilter(value: unknown, selected: DataGridFilterValue, operator: DataGridFilterOperator | undefined): boolean {
    if (typeof selected !== 'string') {
      return true;
    }

    const valueTime = this.toDateTime(value);
    const selectedTime = this.toDateTime(selected);

    if (!Number.isFinite(valueTime) || !Number.isFinite(selectedTime)) {
      return false;
    }

    const valueDate = this.normalizeDateBoundary(valueTime, 'start');
    const selectedDate = this.normalizeDateBoundary(selectedTime, 'start');

    switch (operator) {
      case 'before':
        return valueDate < selectedDate;
      case 'after':
        return valueDate > selectedDate;
      default:
        return valueDate === selectedDate;
    }
  }

  private matchesDateRangeFilter(value: unknown, selected: DataGridFilterValue): boolean {
    if (typeof selected !== 'object' || selected == null) {
      return true;
    }

    const valueTime = this.toDateTime(value);

    if (!Number.isFinite(valueTime)) {
      return false;
    }

    const from = selected.from ? this.normalizeDateBoundary(this.toDateTime(selected.from), 'start') : Number.NEGATIVE_INFINITY;
    const to = selected.to ? this.normalizeDateBoundary(this.toDateTime(selected.to), 'end') : Number.POSITIVE_INFINITY;

    return valueTime >= from && valueTime <= to;
  }

  private normalizeFilterText(value: string, mode: DataGridFilterNormalization = 'text'): string {
    if (mode === 'none') {
      return value.trim().replace(/\s+/g, ' ');
    }

    if (mode === 'rut') {
      return value.replace(/[^0-9kK]/g, '').toLowerCase();
    }

    return this.normalizeText(value);
  }

  private normalizeDateBoundary(timestamp: number, bound: 'start' | 'end'): number {
    const date = new Date(timestamp);

    if (bound === 'start') {
      date.setHours(0, 0, 0, 0);
      return date.getTime();
    }

    date.setHours(23, 59, 59, 999);
    return date.getTime();
  }

  private formatFilterDateValue(value: string): string {
    const timestamp = this.toDateTime(value);

    if (!Number.isFinite(timestamp)) {
      return value;
    }

    return new Intl.DateTimeFormat('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(timestamp));
  }

  private normalizeText(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, ' ');
  }

  private rowKey(row: T, fallbackIndex = this.rows.indexOf(row)): unknown {
    return this.trackBy(fallbackIndex, row);
  }

  private pruneSelection(): void {
    const availableKeys = new Set(this.rows.map((row, index) => this.rowKey(row, index)));
    this.selectedRowKeys = new Set([...this.selectedRowKeys].filter((key) => availableKeys.has(key)));
  }

  private persistPreferences(): void {
    if (!this.persistenceKey) {
      return;
    }

    localStorage.setItem(
      this.persistenceKey,
      JSON.stringify({
        filterValues: this.filterValues,
        pageSize: this.effectivePageSize,
        searchTerm: this.searchTerm,
        sortColumnId: this.sortColumnId,
        sortDirection: this.sortDirection,
        visibleColumnIds: [...this.visibleColumnIds],
      }),
    );
  }

  private restorePreferences(): void {
    const rawPreferences = localStorage.getItem(this.persistenceKey);

    if (!rawPreferences) {
      return;
    }

    try {
      const preferences = JSON.parse(rawPreferences) as Partial<{
        filterValues: Record<string, DataGridFilterValue>;
        pageSize: number;
        searchTerm: string;
        sortColumnId: string;
        sortDirection: DataGridSortDirection;
        visibleColumnIds: string[];
      }>;

      this.filterValues = preferences.filterValues ?? this.filterValues;
      this.draftFilterValues = { ...this.filterValues };
      this.effectivePageSize = this.normalizePageSize(preferences.pageSize ?? this.effectivePageSize);
      this.searchTerm = preferences.searchTerm ?? '';
      this.searchInputTerm = this.searchTerm;
      this.sortColumnId = preferences.sortColumnId ?? '';
      this.sortDirection = preferences.sortDirection ?? 'asc';

      if (preferences.visibleColumnIds?.length) {
        const availableIds = new Set(this.columns.map((column) => column.id));
        this.visibleColumnIds = new Set([
          ...this.fixedColumnIds(),
          ...preferences.visibleColumnIds.filter((id) => availableIds.has(id)),
        ]);
      }
    } catch {
      localStorage.removeItem(this.persistenceKey);
    }
  }

  private syncVisibleColumns(): void {
    const availableIds = new Set(this.columns.map((column) => column.id));
    const previousVisibleIds = [...this.visibleColumnIds].filter((id) => availableIds.has(id));

    this.visibleColumnIds = new Set(
      previousVisibleIds.length > 0
        ? [...this.fixedColumnIds(), ...previousVisibleIds]
        : this.defaultVisibleColumnIds(),
    );
    this.draftFilterValues = Object.fromEntries(
      Object.entries(this.draftFilterValues).filter(([id]) => this.visibleFilters.some((filter) => filter.id === id)),
    );
    this.filterValues = Object.fromEntries(
      Object.entries(this.filterValues).filter(([id]) => this.visibleFilters.some((filter) => filter.id === id)),
    );
  }

  private fixedColumnIds(): string[] {
    return this.columns.filter((column) => this.isColumnFixed(column)).map((column) => column.id);
  }

  private defaultVisibleColumnIds(): string[] {
    return this.columns
      .filter((column) => column.visible !== false || this.isColumnFixed(column))
      .map((column) => column.id);
  }

  private clampCurrentPage(): void {
    this.currentPage = this.normalizePage(this.currentPage);
    this.pageInput = String(this.currentPage);
  }

  private normalizePage(page: number): number {
    if (!Number.isFinite(page)) {
      return 1;
    }

    return Math.min(Math.max(1, Math.floor(page)), this.totalPages);
  }
}
