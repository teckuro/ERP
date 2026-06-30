/**
 * Presenter del modal "Agregar trabajadores".
 *
 * Define columnas y filtros declarativos del `app-data-grid` para la lista
 * de trabajadores elegibles a incluir en una nómina del período.
 *
 * Documento rector: `docs/codex/peticiones-estilos.md` — entrada
 * "Dotación · Agregar trabajadores".
 */

import type {
  DataGridColumn,
  DataGridFilter,
  DataGridFilterValue,
} from '../../../shared/components/ui/data-grid/data-grid.types';
import type { FiltroTrabajadoresElegiblesNomina } from '../../nomina-mensual/models/nomina-periodo.models';

export const PERSISTENCIA_PICKER_TRABAJADORES = 'nomina-v2-picker-trabajadores-v1';

/**
 * Fila plana usada por `app-data-grid`. `yaEnNomina` indica que el trabajador
 * ya forma parte de algún segmento de la nómina actual; se muestra deshabilitado
 * y no se selecciona.
 */
export interface FilaTrabajadorElegible {
  id: string;
  nombre: string;
  rut: string;
  cargo: string;
  departamento: string;
  yaEnNomina: boolean;
}

export const COLUMNAS_INCLUIR_TRABAJADORES: DataGridColumn<FilaTrabajadorElegible>[] = [
  {
    id: 'nombre',
    header: 'Trabajador',
    field: 'nombre',
    type: 'text',
    minWidth: '14rem',
    priorityResponsive: 'primary',
    hideable: false,
    sortable: true,
    filterable: false,
  },
  {
    id: 'rut',
    header: 'RUT',
    field: 'rut',
    type: 'text',
    width: '7rem',
    minWidth: '6rem',
    priorityResponsive: 'secondary',
    sortable: true,
    filterable: false,
  },
  {
    id: 'cargo',
    header: 'Cargo',
    field: 'cargo',
    type: 'text',
    minWidth: '10rem',
    priorityResponsive: 'secondary',
    sortable: true,
    filterable: false,
  },
  {
    id: 'departamento',
    header: 'Centro de costo',
    field: 'departamento',
    type: 'text',
    minWidth: '10rem',
    priorityResponsive: 'tertiary',
    sortable: true,
    filterable: false,
  },
  {
    id: 'yaEnNomina',
    header: 'Inclusión',
    field: 'yaEnNomina',
    type: 'text',
    width: '8rem',
    minWidth: '7rem',
    align: 'center',
    headerClass: 'text-center',
    cellClass: 'text-center',
    priorityResponsive: 'tertiary',
    sortable: false,
    filterable: false,
  },
];

/**
 * Filtros operativos del picker. Por ahora exponemos un único filtro
 * "Disponibilidad" (elegible / ya en nómina) para que el RRHH pueda
 * detectar rápidamente quién falta agregar.
 */
export function FILTROS_INCLUIR_TRABAJADORES(
  _filas: readonly FilaTrabajadorElegible[],
): DataGridFilter<FilaTrabajadorElegible>[] {
  return [
    {
      id: 'busqueda',
      label: 'Buscar',
      field: 'nombre',
      type: 'text',
      operator: 'contains',
      placeholder: 'Nombre, RUT o cargo',
      predicate: () => true,
    },
    {
      id: 'disponibilidad',
      label: 'Disponibilidad',
      field: 'yaEnNomina',
      type: 'select',
      operator: 'equals',
      emptyLabel: 'Todos',
      options: [
        { label: 'Solo elegibles', value: 'no' },
        { label: 'Ya en nómina', value: 'si' },
      ],
      predicate: () => true,
    },
  ];
}

export function filtroTrabajadoresElegiblesDesdeGrid(
  values: Record<string, DataGridFilterValue>,
): FiltroTrabajadoresElegiblesNomina {
  const filtro: FiltroTrabajadoresElegiblesNomina = {};
  const busqueda = values['busqueda'];
  if (typeof busqueda === 'string' && busqueda.trim()) {
    filtro.busqueda = busqueda.trim();
  }
  const disponibilidad = values['disponibilidad'];
  if (disponibilidad === 'no') filtro.soloDisponibles = true;
  return filtro;
}
