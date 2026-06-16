import type { MessageBoxVariant } from '../feedback/message-box/message-box.types';

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
export type DataGridFilterChipsDisplay = 'whenFiltersVisible' | 'whenFiltersHidden' | 'always' | 'never';
export type DataGridHeaderCountDisplay = 'badge' | 'text';
export type DataGridToolbarLayout = 'default' | 'operativa';

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
  initialValue?: DataGridFilterValue;
  predicate?: (row: T, value: DataGridFilterValue) => boolean;
  normalize?: DataGridFilterNormalization;
  matchMode?: DataGridFilterMatchMode;
  emptyLabel?: string;
  placeholder?: string;
  options?: Array<string | { label: string; value: string }>;
  /** Para filtros fecha (date / date-range): límite inferior inclusivo (ISO yyyy-mm-dd). */
  min?: string;
  /** Para filtros fecha (date / date-range): límite superior inclusivo (ISO yyyy-mm-dd). */
  max?: string;
  /**
   * Para fechas reales (ej. ingreso trabajador): bloquea fechas futuras.
   * Se traduce a `max = hoy` salvo que `max` sea más restrictivo.
   */
  disallowFuture?: boolean;
}

export interface DataGridCellContext<T> {
  $implicit: T;
  row: T;
  column: DataGridColumn<T>;
  value: unknown;
  index: number;
}

/**
 * Contexto del template de detalle expandible (filas expandibles opt-in).
 *
 * Consumidores proyectan
 * `<ng-template appDataGridRowDetail let-row let-i="index" let-collapse="collapse">…</ng-template>`
 * para definir qué se muestra cuando una fila se expande.
 */
export interface DataGridRowDetailContext<T> {
  $implicit: T;
  row: T;
  index: number;
  /** Cierra esta fila expandida (útil para un botón "Cerrar" en el detalle). */
  collapse: () => void;
}

/** Callout dismissible anclado al chevron de la primera fila (sin persistencia interna). */
export interface DataGridExpandHint {
  text: string;
  dismissLabel?: string;
  /** Lo resuelve el consumidor (p. ej. consulta BD). */
  visible: boolean;
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
  /**
   * Si es `false`, no se muestra un control de filtro derivado de esta columna.
   * Por defecto se considera true (comportamiento anterior).
   */
  filterable?: boolean;
  /**
   * Si la columna se oculta, define si el filtro asociado debe seguir visible.
   * Útil para filtros de negocio (ej. estado, cargo) aunque la columna no se muestre.
   */
  showFilterWhenHidden?: boolean;
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

export interface DataGridBulkActionOption {
  id: DataGridBulkAction;
  label: string;
  value?: string;
  tone?: 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'blocked';
  confirmLabel?: string;
  confirmTitle?: string;
  confirmMessage?: string;
}
