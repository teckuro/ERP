import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Component,
  ContentChildren,
  ContentChild,
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
  ChevronsLeft,
  ChevronsRight,
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

import { CardComponent } from '../primitives/card.component';
import { CalendarInputComponent } from '../forms/calendar-input/calendar-input.component';
import { MessageBoxComponent } from '../feedback/message-box/message-box.component';
import type { MessageBoxVariant } from '../feedback/message-box/message-box.types';
import type {
  DataGridBulkAction,
  DataGridBulkActionEvent,
  DataGridBulkActionOption,
  DataGridBulkActionResult,
  DataGridCellContext,
  DataGridColumn,
  DataGridColumnType,
  DataGridDateRangeValue,
  DataGridExportEvent,
  DataGridExportScope,
  DataGridFilter,
  DataGridFilterChipsDisplay,
  DataGridFilterNormalization,
  DataGridFilterOperator,
  DataGridFilterValue,
  DataGridHeaderCountDisplay,
  DataGridSortDirection,
  DataGridToolbarLayout,
} from './data-grid.types';
export * from './data-grid.types';
export { DataGridCellDirective, DataGridPrimaryActionMenuDirective } from './data-grid.directives';
import { DataGridCellDirective, DataGridPrimaryActionMenuDirective } from './data-grid.directives';

interface DataGridNotice {
  variant: Exclude<MessageBoxVariant, 'loading'>;
  title: string;
  message: string;
}

@Component({
  selector: 'app-data-grid',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    CardComponent,
    CalendarInputComponent,
    MessageBoxComponent,
  ],
  templateUrl: './data-grid.component.html',
  styleUrl: './data-grid.component.css',
})
export class DataGridComponent<T = unknown> implements OnChanges, OnDestroy {
  @HostBinding('class.data-grid-host--sized')
  get hostSizedClass(): boolean {
    return !!this.normalizeCssSize(this.gridHeight);
  }

  @HostBinding('style')
  get hostStyles(): Record<string, string> {
    const height = this.normalizeCssSize(this.gridHeight);
    if (!height) {
      return {};
    }

    return {
      display: 'flex',
      'flex-direction': 'column',
      height,
      'max-height': height,
      'min-height': '0',
    };
  }

  @Input() title = '';
  @Input() showHeader = true;
  /** Barra superior: default (SaaS) u operativa (paginación compacta tipo ERP). */
  @Input() toolbarLayout: DataGridToolbarLayout = 'default';
  @Input() columns: DataGridColumn<T>[] = [];
  @Input() rows: T[] = [];
  @Input() filters: DataGridFilter<T>[] = [];
  @Input() filtersEnabled = false;
  @Input() deferFiltersWhenRowsEmpty = false;
  /** En grillas padre: filtros siempre visibles, sin toggle. */
  @Input() filtersCollapsible = true;
  /**
   * Controla la fila de chips de filtros activos.
   * Por defecto conserva el comportamiento previo (chips visibles cuando los filtros están visibles).
   */
  @Input() filterChipsDisplay: DataGridFilterChipsDisplay = 'whenFiltersVisible';
  /** Cómo renderizar el conteo de resultados en el header. */
  @Input() headerCountDisplay: DataGridHeaderCountDisplay = 'badge';
  /** Texto del conteo (ej. "resultados"). */
  @Input() headerCountNoun = 'resultados';
  /** Mostrar "· N filtro(s) activo(s)" en el header cuando aplique. */
  @Input() headerShowActiveFiltersCount = false;
  /** Empty state cuando hay filtros activos pero 0 resultados. */
  @Input() emptyTitleWhenFiltered = 'No se encontraron registros con los filtros aplicados.';
  @Input() emptyDescriptionWhenFiltered = 'Ajusta o limpia los filtros para ampliar los resultados.';
  @Input() primaryActionLabel = '';
  /** Para accesibilidad: refleja si el popover del primary action está abierto. */
  @Input() primaryActionMenuOpen = false;
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
  @Input() mensajeError = '';
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
  readonly firstPageIcon = ChevronsLeft;
  readonly lastPageIcon = ChevronsRight;
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
  sortColumnId = '';
  sortDirection: DataGridSortDirection = 'asc';
  filterValues: Record<string, DataGridFilterValue> = {};
  draftFilterValues: Record<string, DataGridFilterValue> = {};
  pendingBulkAction: DataGridBulkActionOption | null = null;
  activeBulkAction: DataGridBulkAction | null = null;
  notice: DataGridNotice | null = null;

  private visibleColumnIds = new Set<string>();
  private selectedRowKeys = new Set<unknown>();
  private noticeTimeoutId = 0;
  private preferencesLoaded = false;

  @ContentChildren(DataGridCellDirective)
  private readonly customCells?: QueryList<DataGridCellDirective<T>>;

  @ContentChild(DataGridPrimaryActionMenuDirective)
  private readonly primaryActionMenu?: DataGridPrimaryActionMenuDirective;

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
    if (changes['filtersCollapsible'] || changes['filtersEnabled']) {
      if (this.filtersEnabled && !this.filtersCollapsible) {
        this.showFilters = true;
      }
    }

    if (changes['columns']) {
      this.syncVisibleColumns();
    }

    if (changes['persistenceKey']) {
      const prev = changes['persistenceKey'].previousValue as string | undefined;
      const curr = changes['persistenceKey'].currentValue as string | undefined;
      if (prev !== curr && prev !== undefined && curr) {
        this.filterValues = {};
        this.draftFilterValues = {};
        this.sortColumnId = '';
        this.sortDirection = 'asc';
        this.currentPage = 1;
        this.pageInput = '1';
        this.selectedRowKeys = new Set();
        this.preferencesLoaded = false;
      }
    }

    if (!this.preferencesLoaded && this.persistenceKey) {
      this.restorePreferences();
      this.preferencesLoaded = true;
    }

    if (changes['maxItems']) {
      this.effectivePageSize = this.normalizePageSize(this.maxItems);
    }

    if (changes['rows'] || changes['maxItems'] || changes['filters']) {
      if (changes['filters']) {
        this.applyInitialFilterValues();
      }
      this.clampCurrentPage();
      this.pruneSelection();
    }

    if (changes['rows'] || changes['loading'] || changes['deferFiltersWhenRowsEmpty']) {
      this.deferAppliedFiltersForEmptyRows();
    }

    if (changes['bulkActionLoading'] && !this.bulkActionLoading) {
      this.activeBulkAction = null;
    }

    if (changes['bulkActionResult'] && this.bulkActionResult) {
      this.handleBulkActionResult(this.bulkActionResult);
    }
  }

  ngOnDestroy(): void {
    window.clearTimeout(this.noticeTimeoutId);
  }

  @HostBinding('class')
  get hostClass(): string {
    return `block w-full min-w-0 ${this.className}`.trim();
  }

  get gridCardClass(): string {
    const sized = !!this.normalizeCssSize(this.gridHeight);
    const heightClass = sized ? 'h-full min-h-full' : 'min-h-0';
    return `relative flex ${heightClass} w-full min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-none ${this.cardClassName}`.trim();
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
    const configuredById = new Map(this.filters.map((f) => [f.id, f] as const));
    const visibleColumnIdSet = new Set(this.visibleColumns.map((c) => c.id));

    const filtersFromColumns: DataGridFilter<T>[] = [];
    const consumedIds = new Set<string>();

    // Orden estable: recorrer columnas en orden declarado, no por visibilidad.
    this.columns.forEach((column) => {
      if (column.id === 'acciones' || !column.field || column.filterable === false) {
        return;
      }

      const isVisible = visibleColumnIdSet.has(column.id);
      const shouldShow = isVisible || column.showFilterWhenHidden === true;
      if (!shouldShow) {
        return;
      }

      const configured = configuredById.get(column.id);
      filtersFromColumns.push(
        configured ??
          ({
            id: column.id,
            label: column.header,
            field: column.field!,
            type: 'text',
            emptyLabel: `Todos`,
          } satisfies DataGridFilter<T>),
      );
      consumedIds.add(column.id);
    });

    // Filtros standalone: los que no calzan con una columna id (orden estable según filters[]).
    const standalone = this.filters.filter((f) => !consumedIds.has(f.id) && !this.columns.some((c) => c.id === f.id));

    return [...standalone, ...filtersFromColumns];
  }

  get filterGridStyle(): Record<string, string> {
    return {
      'grid-template-columns': 'repeat(auto-fit, minmax(min(100%, 11.5rem), 1fr))',
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
    return Object.values(this.filterValues).some((value) => this.hasFilterValue(value));
  }

  /** Filtros aplicados que afectan los resultados. */
  get hasActiveAppliedFilters(): boolean {
    return this.hasActiveFilters;
  }

  /** Filtros escritos/seleccionados en pantalla (draft), aún no aplicados. */
  get hasActiveDraftFilters(): boolean {
    return Object.values(this.draftFilterValues).some((value) => this.hasFilterValue(value));
  }

  get activeFilterChips(): Array<{ id: string; label: string; value: string }> {
    const chips: Array<{ id: string; label: string; value: string }> = [];

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

  get shouldShowFilterChipsRow(): boolean {
    if (!this.filtersEnabled) {
      return false;
    }

    switch (this.filterChipsDisplay) {
      case 'never':
        return false;
      case 'always':
        return true;
      case 'whenFiltersHidden':
        return !this.showFilters;
      default:
        return this.showFilters;
    }
  }

  get resolvedEmptyTitle(): string {
    if (this.hasActiveFilters) {
      return this.emptyTitleWhenFiltered;
    }

    return this.emptyTitle;
  }

  get resolvedEmptyDescription(): string {
    if (this.hasActiveFilters) {
      return this.emptyDescriptionWhenFiltered;
    }

    return this.emptyDescription;
  }

  get activeFilterCount(): number {
    return this.visibleFilters.reduce((count, filter) => {
      const value = this.filterValues[filter.id];
      return count + (this.hasFilterValue(value) ? 1 : 0);
    }, 0);
  }

  get headerCountText(): string {
    const resultsText = `${this.filteredRows.length} ${this.headerCountNoun}`;
    if (!this.headerShowActiveFiltersCount || !this.hasActiveFilters) {
      return resultsText;
    }
    const n = this.activeFilterCount;
    const filtrosText = `${n} ${n === 1 ? 'filtro activo' : 'filtros activos'}`;
    return `${resultsText} · ${filtrosText}`;
  }

  get hasPendingFilterChanges(): boolean {
    return this.serializeFilterValues(this.draftFilterValues) !== this.serializeFilterValues(this.filterValues);
  }

  private serializeFilterValues(values: Record<string, DataGridFilterValue>): string {
    const keys = Object.keys(values).sort();
    const normalized = keys.map((key) => {
      const v = values[key];
      if (typeof v === 'string') {
        return [key, v.trim()];
      }
      if (typeof v === 'object' && v != null) {
        return [key, { from: v.from?.trim() ?? '', to: v.to?.trim() ?? '' }];
      }
      return [key, ''];
    });
    return JSON.stringify(normalized);
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
    return this.rows.filter((row) =>
      this.visibleFilters.every((filter) => {
        const selected = this.filterValues[filter.id];

        if (!this.hasFilterValue(selected)) {
          return true;
        }

        return this.matchesFilter(row, filter, selected);
      }),
    );
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

  get primaryActionMenuTemplate(): TemplateRef<unknown> | null {
    return this.primaryActionMenu?.template ?? null;
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

    if (value == null || value === '' || (typeof value === 'number' && Number.isNaN(value))) {
      return '—';
    }

    if (typeof value === 'boolean') {
      return value ? 'Sí' : 'No';
    }

    if (column.type === 'date') {
      return this.formatDisplayDate(value);
    }

    return String(value);
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

  firstPage(): void {
    this.goToPage(1);
  }

  lastPage(): void {
    this.goToPage(this.totalPages);
  }

  confirmOperativaPageInput(): void {
    const page = Number(this.pageInput);

    if (!Number.isInteger(page) || page < 1 || page > this.totalPages) {
      this.pageInput = String(this.currentPage);
      return;
    }

    this.goToPage(page);
  }

  updatePageSize(event: Event): void {
    this.effectivePageSize = this.normalizePageSize((event.target as HTMLSelectElement).value);
    this.currentPage = 1;
    this.pageInput = '1';
    this.persistPreferences();
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

  removeFilterChip(filterId: string): void {
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

  private clearFilterById(filterId: string): void {
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
    this.clearSelectionByContext('La seleccion se limpio porque se oculto una columna con filtro activo.');
  }

  clearAllFilters(): void {
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
    if (this.visibleFilters.some((filter) => this.isInvalidDateRangeFilter(filter))) {
      this.showNotice(
        'Rango inválido',
        'Revisa el filtro de fecha: “Hasta” no puede ser menor que “Desde”.',
        'error',
      );
      return;
    }
    this.filterValues = { ...this.draftFilterValues };
    this.currentPage = 1;
    this.pageInput = '1';
    this.clearSelectionByContext('La seleccion se limpio porque cambio el contexto filtrado.');
    this.persistPreferences();
  }

  dateFilterMin(filter: DataGridFilter<T>): string {
    return filter.min?.trim() ? String(filter.min).trim() : '';
  }

  dateFilterMax(filter: DataGridFilter<T>): string {
    const configured = filter.max?.trim() ? String(filter.max).trim() : '';
    const today = this.toIsoDate(new Date());
    const withFutureGuard = filter.disallowFuture ? today : '';

    if (configured && withFutureGuard) {
      return configured < withFutureGuard ? configured : withFutureGuard;
    }
    return configured || withFutureGuard;
  }

  rangeBoundMin(filter: DataGridFilter<T>, bound: keyof DataGridDateRangeValue): string {
    if (!this.isDateRangeFilter(filter)) {
      return '';
    }
    if (bound === 'to') {
      return this.filterDateRangeValue(filter, 'from');
    }
    return this.dateFilterMin(filter);
  }

  rangeBoundMax(filter: DataGridFilter<T>, bound: keyof DataGridDateRangeValue): string {
    if (!this.isDateRangeFilter(filter)) {
      return this.dateFilterMax(filter);
    }
    if (bound === 'from') {
      const to = this.filterDateRangeValue(filter, 'to');
      const max = this.dateFilterMax(filter);
      if (to && max) {
        return to < max ? to : max;
      }
      return to || max;
    }
    return this.dateFilterMax(filter);
  }

  isInvalidDateRangeFilter(filter: DataGridFilter<T>): boolean {
    if (!this.isDateRangeFilter(filter)) {
      return false;
    }
    const value = this.draftFilterValues[filter.id];
    if (typeof value !== 'object' || value == null) {
      return false;
    }
    const from = value.from?.trim() ?? '';
    const to = value.to?.trim() ?? '';
    return Boolean(from && to && to < from);
  }

  hasDateRangeValue(filter: DataGridFilter<T>): boolean {
    const value = this.draftFilterValues[filter.id];
    if (typeof value !== 'object' || value == null) {
      return false;
    }
    return Boolean(value.from?.trim() || value.to?.trim());
  }

  clearDateRangeFilter(filter: DataGridFilter<T>): void {
    if (!this.isDateRangeFilter(filter)) {
      return;
    }
    this.draftFilterValues = {
      ...this.draftFilterValues,
      [filter.id]: {},
    };
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
      // Si el filtro depende de la columna y no debe mantenerse oculto, limpiar.
      if (column.filterable !== false && column.showFilterWhenHidden !== true) {
        this.clearFilterById(columnId);
      }
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

  private toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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

  private applyInitialFilterValues(): void {
    const nextFilterValues = { ...this.filterValues };
    const nextDraftFilterValues = { ...this.draftFilterValues };

    this.visibleFilters.forEach((filter) => {
      if (
        filter.initialValue !== undefined &&
        nextFilterValues[filter.id] === undefined &&
        nextDraftFilterValues[filter.id] === undefined
      ) {
        nextFilterValues[filter.id] = filter.initialValue;
        nextDraftFilterValues[filter.id] = filter.initialValue;
      }
    });

    this.filterValues = nextFilterValues;
    this.draftFilterValues = nextDraftFilterValues;
  }

  private deferAppliedFiltersForEmptyRows(): void {
    if (
      !this.deferFiltersWhenRowsEmpty ||
      this.loading ||
      this.rows.length > 0 ||
      !this.hasActiveAppliedFilters
    ) {
      return;
    }

    this.filterValues = {};
    this.currentPage = 1;
    this.pageInput = '1';
  }

  private matchesFilter(row: T, filter: DataGridFilter<T>, selected: DataGridFilterValue): boolean {
    if (filter.predicate) {
      return filter.predicate(row, selected);
    }

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

    return this.formatDateTime(timestamp);
  }

  private formatDisplayDate(value: unknown): string {
    const timestamp = this.toDateTime(value);

    if (!Number.isFinite(timestamp)) {
      return String(value ?? '—');
    }

    return this.formatDateTime(timestamp);
  }

  private formatDateTime(timestamp: number): string {
    return new Intl.DateTimeFormat('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
      .format(new Date(timestamp))
      .replaceAll('/', '-');
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
        sortColumnId: string;
        sortDirection: DataGridSortDirection;
        visibleColumnIds: string[];
      }>;

      this.filterValues = preferences.filterValues ?? this.filterValues;
      this.draftFilterValues = { ...this.filterValues };
      this.effectivePageSize = this.normalizePageSize(preferences.pageSize ?? this.effectivePageSize);
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
    // Mantener valores solo para filtros efectivamente visibles (evita filtros fantasma).
    const allowedFilterIds = new Set(this.visibleFilters.map((f) => f.id));
    this.draftFilterValues = Object.fromEntries(
      Object.entries(this.draftFilterValues).filter(([id]) => allowedFilterIds.has(id)),
    );
    this.filterValues = Object.fromEntries(
      Object.entries(this.filterValues).filter(([id]) => allowedFilterIds.has(id)),
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

