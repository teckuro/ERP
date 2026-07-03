/**
 * Columnas del historial administrativo en modal (solo lectura).
 * Sin anchos fijos para que la grilla use modo fit al 100% del panel.
 */

import type { DataGridColumn } from '../../../../../shared/components/ui/data-grid/data-grid.types';
import type { FilaHistorialAdministrativo } from '../utils/admin-nominas-auditoria.presenter';

export const COLUMNAS_HISTORIAL_ADMIN: DataGridColumn<FilaHistorialAdministrativo>[] = [
  {
    id: 'fecha',
    header: 'Fecha',
    field: 'fechaCorta',
    type: 'text',
    sortable: false,
    filterable: false,
    hideable: false,
    priorityResponsive: 'primary',
  },
  {
    id: 'accion',
    header: 'Movimiento',
    field: 'accion',
    type: 'text',
    sortable: false,
    filterable: false,
    hideable: false,
    priorityResponsive: 'primary',
  },
  {
    id: 'usuario',
    header: 'Usuario',
    field: 'usuario',
    type: 'text',
    sortable: false,
    filterable: false,
    priorityResponsive: 'secondary',
  },
  {
    id: 'motivo',
    header: 'Motivo',
    field: 'motivo',
    type: 'text',
    sortable: false,
    filterable: false,
    priorityResponsive: 'secondary',
  },
];
