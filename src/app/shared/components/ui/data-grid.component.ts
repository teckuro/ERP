import { CommonModule } from '@angular/common';
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
} from 'lucide-angular/src/icons';

import { CardComponent } from './card.component';
import { MessageBoxComponent, MessageBoxVariant } from './message-box.component';

export type DataGridColumnAlign = 'left' | 'center' | 'right';
export type DataGridColumnType = 'text' | 'number' | 'date';
export type DataGridSortDirection = 'asc' | 'desc';
export type DataGridBulkAction = 'activate' | 'deactivate' | 'change-status' | string;

export interface DataGridFilter<T = unknown> {
  id: string;
  label: string;
  field: keyof T;
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
  align?: DataGridColumnAlign;
  sortable?: boolean;
  type?: DataGridColumnType;
  hideable?: boolean;
  headerClass?: string;
  cellClass?: string;
  widthClass?: string;
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
  imports: [CommonModule, LucideAngularModule, CardComponent, MessageBoxComponent],
  template: `
    <app-card [className]="gridCardClass">
      @if (rows.length > 0 || title) {
        <div class="border-b border-neutral-100 bg-white px-4 pb-4 pt-3.5">
          <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <p class="text-sm font-semibold uppercase tracking-wide text-neutral-900">{{ title || 'Registros' }}</p>
                <span class="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-xs font-semibold text-neutral-700">
                    {{ filteredRows.length }}
                  </span>
              </div>
              <p class="mt-1 text-xs font-medium text-neutral-500" aria-live="polite">
                  Mostrando {{ rangeStart }}-{{ rangeEnd }} de {{ filteredRows.length }}
                </p>
            </div>

            <div class="flex flex-wrap items-center gap-2 lg:justify-end">
              @if (primaryActionLabel) {
                <button
                  type="button"
                  class="inline-flex h-8 items-center gap-1.5 rounded-md border border-blue-600 bg-blue-600 px-3 text-xs font-semibold text-white transition-colors hover:border-blue-700 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  (click)="primaryAction.emit()"
                >
                  <lucide-icon class="h-3.5 w-3.5" [img]="plusIcon"></lucide-icon>
                  {{ primaryActionLabel }}
                </button>
              }

              @if (filtersEnabled) {
                <button
                  type="button"
                  class="inline-flex h-8 items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-2.5 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  aria-label="Mostrar u ocultar filtros"
                  [attr.aria-expanded]="showFilters"
                  (click)="showFilters = !showFilters"
                >
                  <lucide-icon class="h-3.5 w-3.5" [img]="filterIcon"></lucide-icon>
                  Filtros
                </button>
              }

              @if (showExportAction) {
                <div class="relative" data-grid-overlay-root>
                  <button
                    type="button"
                    class="inline-flex h-8 items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-2.5 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    aria-label="Exportar registros"
                    [attr.aria-expanded]="showExportPanel"
                    (click)="toggleExportPanel()"
                  >
                    <lucide-icon class="h-3.5 w-3.5" [img]="downloadIcon"></lucide-icon>
                    Exportar
                  </button>

                  @if (showExportPanel) {
                    <div
                      class="absolute right-0 top-10 z-50 w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-md border border-neutral-200 bg-white text-sm shadow-[0_8px_20px_rgba(15,23,42,0.08)] ring-1 ring-black/[0.02]"
                      role="menu"
                      aria-label="Opciones de exportacion"
                    >
                      <div class="border-b border-neutral-100 bg-neutral-50 px-3 py-2.5">
                        <p class="text-xs font-semibold uppercase tracking-wide text-neutral-500">
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
                            <span class="block text-xs font-semibold text-neutral-800">Exportar pagina actual</span>
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
                            <span class="block text-xs font-semibold text-neutral-800">Exportar seleccionados ({{ selectedRows.length }})</span>
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
                            <span class="block text-xs font-semibold text-neutral-800">Exportar todos los resultados (filtrados)</span>
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
                          <span class="block text-xs font-semibold text-neutral-800">Exportar con todas las columnas</span>
                          <span class="mt-0.5 block text-xs text-neutral-500">
                            Por defecto se exportan solo las columnas visibles.
                          </span>
                        </span>
                      </label>
                    </div>
                  }
                </div>
              }

              <label class="flex h-8 items-center gap-2 rounded-md border border-neutral-200 bg-white px-2.5">
                <span class="text-xs font-medium text-neutral-600">Mostrar</span>
                <select
                  class="h-6 rounded-md border-0 bg-neutral-50 px-1.5 text-xs font-semibold text-neutral-900 outline-none focus:ring-2 focus:ring-blue-500"
                  [value]="pageSize"
                  aria-label="Cantidad de elementos por pagina"
                  (change)="updatePageSize($event)"
                >
                  @for (option of pageSizeOptions; track option) {
                    <option [value]="option">{{ option }}</option>
                  }
                </select>
              </label>

              <button
                type="button"
                class="inline-flex h-8 items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-2.5 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                aria-label="Refrescar grilla"
                title="Refrescar grilla"
                (click)="refresh.emit()"
              >
                <lucide-icon class="h-3.5 w-3.5" [img]="refreshIcon"></lucide-icon>
                Refrescar
              </button>

              <div class="relative" data-grid-overlay-root>
                <button
                  type="button"
                  class="inline-flex h-8 items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-2.5 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  aria-label="Configurar columnas visibles"
                  title="Columnas visibles"
                  [attr.aria-expanded]="showColumnPanel"
                  (click)="toggleColumnPanel()"
                >
                  <lucide-icon class="h-3.5 w-3.5" [img]="settingsIcon"></lucide-icon>
                  Columnas
                </button>

                @if (showColumnPanel) {
                  <div
                    class="absolute right-0 top-10 z-50 w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-md border border-neutral-200 bg-white text-sm shadow-[0_8px_20px_rgba(15,23,42,0.08)] ring-1 ring-black/[0.02]"
                    role="dialog"
                    aria-label="Columnas visibles"
                  >
                    <div class="border-b border-neutral-100 bg-neutral-50 px-3 py-2.5">
                      <div class="flex items-start justify-between gap-3">
                        <div>
                          <p class="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                            Columnas
                          </p>
                          <p class="mt-0.5 text-xs font-medium text-neutral-500">
                            {{ visibleColumns.length }} de {{ columns.length }} columnas visibles
                          </p>
                        </div>

                        <div class="flex items-center gap-1.5">
                          <button
                            type="button"
                            class="inline-flex h-7 items-center rounded-md border border-neutral-200 bg-white px-2.5 text-[0.7rem] font-semibold text-neutral-700 transition-colors hover:border-neutral-300 hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                            (click)="showAllColumns()"
                          >
                            Todo
                          </button>
                          <button
                            type="button"
                            class="inline-flex h-7 items-center rounded-md border border-neutral-200 bg-white px-2.5 text-[0.7rem] font-semibold text-neutral-700 transition-colors hover:border-neutral-300 hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                            (click)="restoreDefaultColumns()"
                          >
                            Restaurar
                          </button>
                        </div>
                      </div>
                    </div>

                    <div class="max-h-56 overflow-auto p-1.5">
                      @for (column of columns; track column.id) {
                        <button
                          type="button"
                          class="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-55"
                          [disabled]="isColumnFixed(column) || isLastVisibleColumn(column.id)"
                          (click)="toggleColumn(column.id)"
                        >
                          <span class="min-w-0">
                            <span class="block truncate text-xs font-medium text-neutral-700">
                              {{ column.header }}
                            </span>
                            @if (isColumnFixed(column)) {
                              <span class="text-[0.68rem] font-medium text-neutral-500">Fija</span>
                            }
                          </span>

                          <span
                            class="relative inline-flex h-4 w-7 shrink-0 items-center rounded-full border transition-colors"
                            [class.border-blue-600]="isColumnVisible(column.id)"
                            [class.bg-blue-500]="isColumnVisible(column.id)"
                            [class.border-neutral-300]="!isColumnVisible(column.id)"
                            [class.bg-neutral-100]="!isColumnVisible(column.id)"
                          >
                            <span
                              class="h-3 w-3 rounded-full bg-white shadow-sm ring-1 ring-black/5 transition-transform"
                              [class.translate-x-3]="isColumnVisible(column.id)"
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

        @if (filtersEnabled && showFilters) {
          <div class="border-b border-neutral-100 bg-neutral-50 px-4 pb-3 pt-4">
            <div class="grid gap-3 md:grid-cols-[minmax(14rem,1fr)_repeat(3,minmax(9rem,12rem))]">
              <div class="relative">
                <lucide-icon
                  class="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400"
                  [img]="emptyIcon"
                ></lucide-icon>
                <input
                  class="h-9 w-full rounded-md border border-neutral-200 bg-white py-1 pl-9 pr-8 text-sm font-medium text-neutral-900 outline-none transition placeholder:text-neutral-400 hover:border-neutral-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  type="text"
                  [placeholder]="searchPlaceholder"
                  [value]="searchInputTerm"
                  (input)="updateSearchTerm($event)"
                />
                @if (searchInputTerm) {
                  <button
                    type="button"
                    class="absolute right-2 top-1/2 -translate-y-1/2 rounded px-1.5 py-0.5 text-xs font-semibold text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    aria-label="Limpiar busqueda"
                    (click)="clearSearchTerm()"
                  >
                    x
                  </button>
                }
              </div>

              @for (filter of filters.slice(0, 3); track filter.id) {
                <select
                  class="h-9 rounded-md border border-neutral-200 bg-white px-2 text-sm font-medium text-neutral-700 outline-none transition hover:border-neutral-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  [value]="filterValues[filter.id] || ''"
                  (change)="updateFilterValue(filter.id, $event)"
                >
                  <option value="">{{ filter.label }}</option>
                  @for (option of filterOptions(filter); track option) {
                    <option [value]="filterOptionValue(option)">{{ filterOptionLabel(option) }}</option>
                  }
                </select>
              }
            </div>

            @if (activeFilterChips.length > 0) {
              <div class="mt-3 flex flex-wrap items-center gap-2">
                @for (chip of activeFilterChips; track chip.id) {
                  <span
                    class="inline-flex h-7 items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-2 text-xs font-medium text-neutral-700"
                  >
                    <span class="text-neutral-500">{{ chip.label }}:</span>
                    <span>{{ chip.value }}</span>
                    <button
                      type="button"
                      class="rounded px-1 text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      [attr.aria-label]="'Quitar filtro ' + chip.label"
                      (click)="removeFilterChip(chip.id)"
                    >
                      x
                    </button>
                  </span>
                }

                <button
                  type="button"
                  class="inline-flex h-7 items-center rounded-md px-2 text-xs font-semibold text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  (click)="clearAllFilters()"
                >
                  Limpiar todo
                </button>
              </div>
            }
          </div>
        }
      }

      @if (selectable && selectedRows.length > 0) {
        <div
          class="flex flex-col gap-3 border-b border-blue-100 bg-blue-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          role="region"
          aria-label="Acciones masivas"
          aria-live="polite"
        >
          <div class="flex items-center gap-2 text-sm font-semibold text-blue-900">
            <lucide-icon class="h-4 w-4" [img]="selectionIcon"></lucide-icon>
            <span>{{ selectedRows.length }} {{ selectionLabel }} seleccionados</span>
          </div>

          <div class="flex flex-wrap items-center gap-2 sm:justify-end">
            <span class="text-xs font-semibold uppercase tracking-wide text-blue-700">Cambiar estado a</span>
            @for (action of bulkActions; track action.id) {
              <button
                type="button"
                class="inline-flex h-8 items-center gap-1.5 rounded-md border bg-white px-2.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
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
              class="inline-flex h-8 items-center rounded-md border border-transparent px-2.5 text-xs font-semibold text-blue-800 transition hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
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

      <div class="data-grid-scroll w-full min-w-0 overflow-auto bg-white" [ngStyle]="gridBodyStyle">
        @if (loading) {
          <div class="divide-y divide-neutral-100">
            @for (item of skeletonRows; track item) {
              <div class="grid grid-cols-[2.75rem_1.2fr_0.8fr_0.8fr_0.7fr_0.6fr_3rem] items-center gap-3 px-3 py-3.5">
                <div class="h-4 w-4 rounded bg-neutral-100"></div>
                <div class="space-y-2">
                  <div class="h-3.5 w-44 rounded bg-neutral-100"></div>
                  <div class="h-3 w-32 rounded bg-neutral-100"></div>
                </div>
                <div class="h-3.5 w-24 rounded bg-neutral-100"></div>
                <div class="h-3.5 w-28 rounded bg-neutral-100"></div>
                <div class="h-3.5 w-20 rounded bg-neutral-100 justify-self-end"></div>
                <div class="h-6 w-20 rounded-full bg-neutral-100"></div>
                <div class="h-8 w-8 rounded-md bg-neutral-100"></div>
              </div>
            }
          </div>
        } @else if (errorMessage) {
          <div class="px-6 py-14 text-center">
            <div
              class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-red-100 bg-red-50"
            >
              <span class="text-xl font-bold text-red-600">!</span>
            </div>
            <h3 class="mb-1 text-lg font-semibold text-neutral-900">{{ errorMessage }}</h3>
            <p class="text-sm text-neutral-600">Intenta nuevamente para actualizar la informacion.</p>
            <button
              type="button"
              class="mt-4 inline-flex h-9 items-center rounded-md border border-neutral-200 bg-white px-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              (click)="retry.emit()"
            >
              Reintentar
            </button>
          </div>
        } @else if (filteredRows.length > 0) {
          <table class="w-full min-w-max table-auto border-separate border-spacing-0">
            <thead class="sticky top-0 z-10 bg-neutral-100 shadow-[0_1px_0_rgba(229,229,229,1)]">
              <tr>
                @if (selectable) {
                  <th scope="col" class="w-11 border-b border-r border-neutral-200 px-3 py-2.5">
                    <input
                      class="h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                      type="checkbox"
                      aria-label="Seleccionar registros visibles"
                      [checked]="allPageRowsSelected"
                      [indeterminate]="somePageRowsSelected && !allPageRowsSelected"
                      (change)="togglePageSelection($event)"
                    />
                  </th>
                }
                @for (column of visibleColumns; track column.id) {
                  <th
                    scope="col"
                    class="whitespace-nowrap border-b border-r border-neutral-200 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-neutral-600 last:border-r-0"
                    [ngClass]="[alignmentHeaderClass(column), column.headerClass ?? '', column.widthClass ?? '']"
                  >
                    @if (isSortable(column)) {
                      <button
                        type="button"
                        class="inline-flex items-center gap-1.5 rounded-md text-left transition-colors hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                        [class.justify-end]="column.align === 'right'"
                        [class.justify-center]="column.align === 'center'"
                        [attr.aria-sort]="sortAriaValue(column)"
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
              @for (row of pagedRows; track trackPagedRow($index, row)) {
                <tr
                  class="group transition-colors duration-150 odd:bg-white even:bg-white"
                  [class.hover:bg-neutral-50]="hoverRows"
                  [class.data-grid-row-selected]="isRowSelected(row)"
                >
                  @if (selectable) {
                    <td
                      class="w-11 border-b border-r border-neutral-100 px-3 py-3.5 transition-colors"
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
                      class="border-b border-r border-neutral-100 px-3 py-3.5 text-sm text-neutral-900 transition-colors last:border-r-0"
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
                        <span class="block whitespace-nowrap">{{ formattedValue(row, column, absoluteIndex($index)) }}</span>
                      }
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
      } @else {
          <div class="px-6 py-14 text-center">
            <div
              class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50"
            >
              <lucide-icon class="h-8 w-8 text-neutral-400" [img]="emptyIcon"></lucide-icon>
            </div>
            <h3 class="mb-1 text-lg font-semibold text-neutral-900">{{ resolvedEmptyTitle }}</h3>
            <p class="text-sm text-neutral-600">{{ resolvedEmptyDescription }}</p>

            @if (hasActiveFilters) {
              <button
                type="button"
                class="mt-4 inline-flex h-9 items-center rounded-md border border-neutral-200 bg-white px-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                (click)="clearAllFilters()"
              >
                Limpiar filtros
              </button>
            } @else if (primaryActionLabel) {
              <button
                type="button"
                class="mt-4 inline-flex h-9 items-center gap-1.5 rounded-md border border-blue-600 bg-blue-600 px-3 text-sm font-semibold text-white transition hover:border-blue-700 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
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
          class="flex flex-col gap-3 border-t border-neutral-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <p class="text-xs font-semibold text-neutral-600">
            Pagina {{ currentPage }} de {{ totalPages }}
          </p>

          <div class="flex flex-wrap items-center gap-3 sm:justify-end">
            <div
              class="inline-flex items-center overflow-hidden rounded-md border border-neutral-200 bg-white"
              aria-label="Paginacion inferior"
            >
              <button
                type="button"
                class="inline-flex h-8 items-center gap-1.5 border-r border-neutral-200 px-2.5 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-400 disabled:opacity-70"
                aria-label="Pagina anterior"
                [disabled]="currentPage <= 1"
                (click)="previousPage()"
              >
                <lucide-icon class="h-3.5 w-3.5" [img]="previousIcon"></lucide-icon>
                Atras
              </button>

              <span
                class="inline-flex h-8 min-w-20 items-center justify-center border-r border-neutral-200 bg-neutral-50 px-2.5 text-xs font-semibold text-neutral-900"
                aria-live="polite"
                aria-label="Pagina actual"
              >
                {{ currentPage }} / {{ totalPages }}
              </span>

              <button
                type="button"
                class="inline-flex h-8 items-center gap-1.5 px-2.5 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-400 disabled:opacity-70"
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
                class="inline-flex h-8 items-center justify-center rounded-md border border-neutral-200 bg-white px-2.5 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
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
                    <p class="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      Ir a pagina
                    </p>
                    <p class="mt-0.5 text-xs font-medium text-neutral-500">
                      Rango 1-{{ totalPages }}
                    </p>
                  </div>

                  <div class="p-3">
                    <input
                      class="h-9 w-full rounded-md border border-neutral-200 bg-white px-2.5 text-sm font-semibold text-neutral-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                        class="inline-flex h-8 items-center rounded-md border border-neutral-200 bg-white px-2.5 text-xs font-semibold text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                        (click)="closePagePopover()"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        class="inline-flex h-8 items-center rounded-md border border-blue-600 bg-blue-600 px-3 text-xs font-semibold text-white transition-colors hover:border-blue-700 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
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
        --data-grid-scrollbar-track: #f1f5f9;
        --data-grid-scrollbar-thumb: #cbd5e1;
      }

      .data-grid-scroll {
        scrollbar-color: var(--data-grid-scrollbar-thumb) var(--data-grid-scrollbar-track);
        scrollbar-width: thin;
      }

      .data-grid-scroll::-webkit-scrollbar {
        width: 0.5rem;
        height: 0.5rem;
      }

      .data-grid-scroll::-webkit-scrollbar-track {
        background: var(--data-grid-scrollbar-track);
      }

      .data-grid-scroll::-webkit-scrollbar-thumb {
        border: 2px solid var(--data-grid-scrollbar-track);
        border-radius: 999px;
        background: var(--data-grid-scrollbar-thumb);
      }

      .data-grid-row-selected {
        box-shadow: inset 3px 0 0 #2563eb;
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

      @media (prefers-reduced-motion: reduce) {
        .data-grid-button-spinner {
          animation: none;
        }
      }
    `,
  ],
})
export class DataGridComponent<T = unknown> implements OnChanges, OnDestroy {
  @Input() title = '';
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
  readonly selectionIcon = CheckCircle;
  readonly settingsIcon = Settings;
  readonly sortNeutralIcon = ArrowUpDown;
  readonly sortAscIcon = ArrowUp;
  readonly sortDescIcon = ArrowDown;
  readonly skeletonRows = Array.from({ length: 7 }, (_, index) => index);

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
  filterValues: Record<string, string> = {};
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
    return `relative w-full min-w-0 overflow-hidden rounded-xl border-neutral-200 bg-white shadow-sm ${this.cardClassName}`.trim();
  }

  get gridBodyStyle(): Record<string, string> {
    const height = this.normalizeCssSize(this.gridHeight);
    return height ? { height } : { 'max-height': '32rem' };
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
    return Boolean(this.searchTerm.trim()) || Object.values(this.filterValues).some(Boolean);
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

    this.filters.forEach((filter) => {
      const value = this.filterValues[filter.id];

      if (!value) {
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
    if (this.rows.length === 0) {
      return 'Aun no hay empleados creados.';
    }

    if (this.hasActiveFilters) {
      return 'No se encontraron empleados con los filtros aplicados.';
    }

    return this.emptyTitle;
  }

  get resolvedEmptyDescription(): string {
    if (this.rows.length === 0) {
      return 'Crea el primer registro para comenzar a trabajar en este modulo.';
    }

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
    const term = this.normalizeText(this.searchTerm);

    return this.rows.filter((row) => {
      const matchesSearch =
        !term ||
        this.columns
          .map((column) => this.formattedValue(row, column, 0))
          .some((value) => this.normalizeText(String(value)).includes(term));

      if (!matchesSearch) {
        return false;
      }

      return this.filters.every((filter) => {
        const selected = this.filterValues[filter.id];
        return !selected || String(row[filter.field] ?? '') === selected;
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
        return 'border-purple-200 text-purple-700 hover:bg-purple-50';
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
      this.searchTerm = this.searchInputTerm;
      this.currentPage = 1;
      this.pageInput = '1';
      this.clearSelectionByContext('La seleccion se limpio porque cambio la busqueda.');
      this.persistPreferences();
    }, 300);
  }

  filterOptionValue(option: string | { label: string; value: string }): string {
    return typeof option === 'string' ? option : option.value;
  }

  filterOptionLabel(option: string | { label: string; value: string }): string {
    return typeof option === 'string' ? option : option.label;
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

    this.filterValues = {
      ...this.filterValues,
      [filterId]: '',
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
    this.currentPage = 1;
    this.pageInput = '1';
    this.clearSelectionByContext('La seleccion se limpio porque se quitaron los filtros.');
    this.persistPreferences();
  }

  updateFilterValue(filterId: string, event: Event): void {
    this.filterValues = {
      ...this.filterValues,
      [filterId]: (event.target as HTMLSelectElement).value,
    };
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

  filterDisplayValue(filter: DataGridFilter<T>, value: string): string {
    const option = this.filterOptions(filter).find((item) => this.filterOptionValue(item) === value);
    return option ? this.filterOptionLabel(option) : value;
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
    return column.hideable === false;
  }

  isLastVisibleColumn(columnId: string): boolean {
    const fixedVisibleCount = this.columns.filter(
      (column) => this.isColumnFixed(column) && this.visibleColumnIds.has(column.id),
    ).length;
    const minimumVisibleCount = Math.max(1, fixedVisibleCount);

    return this.visibleColumnIds.has(columnId) && this.visibleColumnIds.size <= minimumVisibleCount;
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
    this.visibleColumnIds = new Set(this.columns.map((column) => column.id));
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

  private normalizeText(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
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
        filterValues: Record<string, string>;
        pageSize: number;
        searchTerm: string;
        sortColumnId: string;
        sortDirection: DataGridSortDirection;
        visibleColumnIds: string[];
      }>;

      this.filterValues = preferences.filterValues ?? this.filterValues;
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
        : this.columns.map((column) => column.id),
    );
  }

  private fixedColumnIds(): string[] {
    return this.columns.filter((column) => this.isColumnFixed(column)).map((column) => column.id);
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
