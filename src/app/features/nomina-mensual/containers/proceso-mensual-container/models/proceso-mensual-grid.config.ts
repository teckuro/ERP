import type { DataGridColumn, DataGridFilter } from '../../../../../shared/components/ui/data-grid.component';
import type {
  DetalleOperativoTab,
  PayrollMovementDetailRow,
  PayrollObservationDetailRow,
  PayrollRecurrentDetailRow,
  PayrollResultDetailRow,
  PayrollWorkerDetailRow,
} from './proceso-mensual-container.vm';

export const DETALLE_OPERATIVO_TABS: Array<{ id: DetalleOperativoTab; label: string }> = [
  { id: 'resumen', label: 'Resumen operativo' },
  { id: 'parametros', label: 'Parámetros' },
  { id: 'trabajadores', label: 'Trabajadores' },
  { id: 'movimientos_recurrentes', label: 'Movimientos y recurrentes' },
  { id: 'resultado', label: 'Nómina generada' },
];

export const PAYROLL_WORKER_DETAIL_COLUMNS: DataGridColumn<PayrollWorkerDetailRow>[] = [
  { id: 'trabajador', header: 'Trabajador', field: 'trabajador', sortable: true, priorityResponsive: 'primary' },
  { id: 'rut', header: 'RUT', field: 'rut', sortable: true, priorityResponsive: 'secondary' },
  { id: 'estado', header: 'Estado', field: 'estado', sortable: true },
  { id: 'observacion', header: 'Observación', field: 'observacion' },
  { id: 'accion', header: 'Acción sugerida', field: 'accion' },
];

export const PAYROLL_WORKER_DETAIL_FILTERS: DataGridFilter<PayrollWorkerDetailRow>[] = [
  { id: 'estado', label: 'Estado', field: 'estado', type: 'select', emptyLabel: 'Todos los estados' },
  { id: 'trabajador', label: 'Buscar trabajador', field: 'trabajador', type: 'text', matchMode: 'tokens' },
];

export const PAYROLL_MOVEMENT_DETAIL_COLUMNS: DataGridColumn<PayrollMovementDetailRow>[] = [
  { id: 'trabajador', header: 'Trabajador', field: 'trabajador', sortable: true, priorityResponsive: 'primary' },
  { id: 'concepto', header: 'Concepto', field: 'concepto', sortable: true },
  { id: 'tipo', header: 'Tipo', field: 'tipo', sortable: true },
  { id: 'monto', header: 'Monto', field: 'monto', align: 'right' },
  { id: 'estado', header: 'Estado', field: 'estado', sortable: true },
  { id: 'accion', header: 'Acción', field: 'accion' },
];

export const PAYROLL_MOVEMENT_DETAIL_FILTERS: DataGridFilter<PayrollMovementDetailRow>[] = [
  { id: 'estado', label: 'Estado', field: 'estado', type: 'select', emptyLabel: 'Todos los estados' },
  { id: 'tipo', label: 'Tipo', field: 'tipo', type: 'select', emptyLabel: 'Todos los tipos' },
  { id: 'trabajador', label: 'Buscar trabajador/concepto', field: 'trabajador', type: 'text', matchMode: 'tokens' },
];

export const PAYROLL_RECURRENT_DETAIL_COLUMNS: DataGridColumn<PayrollRecurrentDetailRow>[] = [
  { id: 'trabajador', header: 'Trabajador', field: 'trabajador', sortable: true, priorityResponsive: 'primary' },
  { id: 'concepto', header: 'Concepto', field: 'concepto', sortable: true },
  { id: 'periodicidad', header: 'Periodicidad', field: 'periodicidad' },
  { id: 'monto', header: 'Monto', field: 'monto', align: 'right' },
  { id: 'estado', header: 'Estado', field: 'estado', sortable: true },
  { id: 'accion', header: 'Acción', field: 'accion' },
];

export const PAYROLL_RECURRENT_DETAIL_FILTERS: DataGridFilter<PayrollRecurrentDetailRow>[] = [
  { id: 'estado', label: 'Estado', field: 'estado', type: 'select', emptyLabel: 'Todos los estados' },
  { id: 'trabajador', label: 'Buscar trabajador/concepto', field: 'trabajador', type: 'text', matchMode: 'tokens' },
];

export const PAYROLL_OBSERVATION_DETAIL_COLUMNS: DataGridColumn<PayrollObservationDetailRow>[] = [
  { id: 'severidad', header: 'Severidad', field: 'severidad', sortable: true, priorityResponsive: 'primary' },
  { id: 'ambito', header: 'Ámbito', field: 'ambito', sortable: true },
  { id: 'mensaje', header: 'Mensaje', field: 'mensaje' },
  { id: 'accion', header: 'Acción sugerida', field: 'accion' },
];

export const PAYROLL_OBSERVATION_DETAIL_FILTERS: DataGridFilter<PayrollObservationDetailRow>[] = [
  { id: 'severidad', label: 'Severidad', field: 'severidad', type: 'select', emptyLabel: 'Todas' },
  { id: 'ambito', label: 'Ámbito', field: 'ambito', type: 'select', emptyLabel: 'Todos los ámbitos' },
];

export const PAYROLL_RESULT_DETAIL_COLUMNS: DataGridColumn<PayrollResultDetailRow>[] = [
  { id: 'trabajador', header: 'Trabajador', field: 'trabajador', sortable: true, priorityResponsive: 'primary' },
  { id: 'haberes', header: 'Haberes', field: 'haberes', align: 'right' },
  { id: 'descuentos', header: 'Descuentos', field: 'descuentos', align: 'right' },
  { id: 'liquido', header: 'Líquido preliminar', field: 'liquido', align: 'right' },
  { id: 'estado', header: 'Estado', field: 'estado', sortable: true },
  { id: 'observacion', header: 'Observación', field: 'observacion' },
];

export const PAYROLL_RESULT_DETAIL_FILTERS: DataGridFilter<PayrollResultDetailRow>[] = [
  { id: 'estado', label: 'Estado', field: 'estado', type: 'select', emptyLabel: 'Todos los estados' },
  { id: 'trabajador', label: 'Buscar trabajador', field: 'trabajador', type: 'text', matchMode: 'tokens' },
];
