import type { DataGridColumn } from '../../../shared/components/ui/data-grid/data-grid.types';
import type { LreLineaExport } from '../models/lre-export.model';

export const COLUMNAS_LRE_EXPORT: DataGridColumn<LreLineaExport>[] = [
  { id: 'rut', header: 'RUT', field: 'rut', type: 'text', width: '9rem', hideable: false },
  { id: 'nombre', header: 'Trabajador', field: 'nombreTrabajador', type: 'text', width: '22%' },
  { id: 'codigo', header: 'Código LRE', field: 'codigoLre', type: 'text', width: '7rem', align: 'center' },
  { id: 'concepto', header: 'Concepto', field: 'nombreConcepto', type: 'text', width: '24%' },
  { id: 'tipo', header: 'Tipo', field: 'tipo', type: 'text', width: '7rem' },
  { id: 'monto', header: 'Monto', field: 'monto', type: 'number', width: '8rem', align: 'right' },
];
