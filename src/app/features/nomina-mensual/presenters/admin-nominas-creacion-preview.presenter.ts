/**
 * Presenter de la grilla de trabajadores en el preview de creación (BKL-10).
 */

import type { DataGridColumn } from '../../../shared/components/ui/data-grid/data-grid.types';
import type { TrabajadorIncluidoPreview } from '../models/nomina-creacion-preview.models';

export interface FilaPreviewCreacionTrabajador extends TrabajadorIncluidoPreview {
  id: string;
}

export const COLUMNAS_PREVIEW_CREACION_TRABAJADORES: DataGridColumn<FilaPreviewCreacionTrabajador>[] = [
  {
    id: 'rut',
    header: 'RUT',
    field: 'rut',
    type: 'text',
    width: '110px',
    filterable: false,
  },
  {
    id: 'nombre',
    header: 'Trabajador',
    field: 'nombre',
    type: 'text',
    minWidth: '180px',
    filterable: false,
  },
  {
    id: 'cargo',
    header: 'Cargo',
    field: 'cargo',
    type: 'text',
    minWidth: '140px',
    filterable: false,
  },
];

export function mapearFilasPreviewCreacion(
  filas: readonly TrabajadorIncluidoPreview[],
): FilaPreviewCreacionTrabajador[] {
  return filas.map((fila) => ({
    ...fila,
    id: String(fila.idPersona),
    cargo: fila.cargo ?? '—',
  }));
}
