import type { DataGridColumn, DataGridFilter } from '../../../shared/components/ui/data-grid';
import type { EmpresaListadoFila } from '../models/empresa.model';

export const EMPRESA_GRID_COLUMNS: DataGridColumn<EmpresaListadoFila>[] = [
  { id: 'rut', header: 'RUT', field: 'rutFormateado', width: '120px', sortable: true },
  { id: 'razonSocial', header: 'Razón social', field: 'razonSocial', sortable: true, priorityResponsive: 'primary' },
  {
    id: 'nombreFantasia',
    header: 'Nombre fantasía',
    field: 'nombreFantasia',
    sortable: true,
    format: (value: unknown) => (value ? String(value) : '—'),
  },
  {
    id: 'comuna',
    header: 'Comuna',
    field: 'comuna',
    sortable: true,
    format: (value: unknown) => (value ? String(value) : '—'),
  },
  { id: 'aplicaMutual', header: 'Mutual', field: 'aplicaMutual', sortable: true, filterable: false },
  {
    id: 'organismoMutual',
    header: 'Organismo',
    field: 'organismoMutualNombre',
    sortable: true,
    format: (value: unknown) => (value ? String(value) : '—'),
  },
  { id: 'acciones', header: '', sortable: false, filterable: false, width: '120px' },
];

export const EMPRESA_GRID_FILTERS: DataGridFilter<EmpresaListadoFila>[] = [
  {
    id: 'razonSocial',
    label: 'Razón social',
    field: 'razonSocial',
    type: 'text',
    operator: 'contains',
    emptyLabel: 'Todas',
  },
  {
    id: 'comuna',
    label: 'Comuna',
    field: 'comuna',
    type: 'text',
    operator: 'contains',
    emptyLabel: 'Todas',
  },
  {
    id: 'aplicaMutual',
    label: 'Mutual',
    field: 'aplicaMutual',
    type: 'select',
    emptyLabel: 'Todas',
    options: [
      { label: 'Sí', value: 'true' },
      { label: 'No', value: 'false' },
    ],
  },
];

export const EMPRESA_GRID_PERSISTENCE_KEY = 'empresas.listado.dg';
