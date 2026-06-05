/**
 * Presenter de la grilla del paso Dotación (F3e-2).
 *
 * Calcula contadores y descripciones operativas a partir de las filas
 * resumidas que entrega `NominaPeriodoService.filtrarDotacion`. No tiene
 * dependencia con Angular: es un módulo puro testeable.
 *
 * Expone también el contrato declarativo (columnas y filtros) que consume
 * `app-data-grid` en el paso Dotación, reusando el mismo patrón que el
 * Administrador de Nóminas.
 */

import type {
  DataGridColumn,
  DataGridFilter,
} from '../../../shared/components/ui/data-grid/data-grid.types';
import type {
  EstadoTrabajadorNomina,
  FilaTrabajadorNominaResumen,
  FiltroRapidoDotacion,
} from '../../nomina-mensual/models/nomina-periodo.models';

export interface DotacionGridStats {
  total: number;
  listos: number;
  conAdvertencias: number;
  conCriticos: number;
  bloqueados: number;
}

export interface DotacionGridResumen {
  filas: FilaTrabajadorNominaResumen[];
  total: number;
  stats: DotacionGridStats;
  hayFiltrosActivos: boolean;
}

const ESTADOS_DOTACION: ReadonlyArray<FilaTrabajadorNominaResumen['estado']> = [
  'listo',
  'advertencia',
  'critico',
  'bloqueado',
];

export function calcularStatsDotacion(filas: FilaTrabajadorNominaResumen[]): DotacionGridStats {
  const stats: DotacionGridStats = {
    total: filas.length,
    listos: 0,
    conAdvertencias: 0,
    conCriticos: 0,
    bloqueados: 0,
  };
  for (const fila of filas) {
    switch (fila.estado) {
      case 'listo':
        stats.listos += 1;
        break;
      case 'advertencia':
        stats.conAdvertencias += 1;
        break;
      case 'critico':
        stats.conCriticos += 1;
        break;
      case 'bloqueado':
        stats.bloqueados += 1;
        break;
    }
  }
  return stats;
}

export function hayFiltrosActivos(filtro: FiltroRapidoDotacion): boolean {
  return Boolean(
    filtro.estado ||
      filtro.segmentoId ||
      filtro.conIncidencias !== undefined ||
      filtro.conMovimientos !== undefined ||
      (filtro.busqueda && filtro.busqueda.trim().length > 0),
  );
}

export function etiquetaEstadoDotacion(estado: FilaTrabajadorNominaResumen['estado']): string {
  switch (estado) {
    case 'listo':
      return 'Listo';
    case 'advertencia':
      return 'Con advertencia';
    case 'critico':
      return 'Con incidencia crítica';
    case 'bloqueado':
      return 'Bloqueado';
    default:
      return estado;
  }
}

export function listaEstadosDotacion(): ReadonlyArray<FilaTrabajadorNominaResumen['estado']> {
  return ESTADOS_DOTACION;
}

/** Clave de persistencia local de la grilla del paso Dotación. */
export const PERSISTENCIA_GRILLA_DOTACION = 'nomina-v2-dotacion-grid-v1';

/**
 * Columnas declarativas para `app-data-grid` en el paso Dotación.
 *
 * - `acciones`: columna no filtrable que el componente sobreescribe con
 *   `<ng-template appDataGridCell="acciones">` para mostrar "Ver detalle".
 * - El estado se renderiza con una píldora vía template; el `field` permite
 *   el ordenamiento por estado nativo del data-grid.
 */
export const COLUMNAS_DOTACION: DataGridColumn<FilaTrabajadorNominaResumen>[] = [
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
    minWidth: '9rem',
    priorityResponsive: 'tertiary',
    sortable: true,
    filterable: false,
  },
  {
    id: 'estado',
    header: 'Estado',
    field: 'estado',
    type: 'text',
    width: '10rem',
    minWidth: '8rem',
    align: 'center',
    headerClass: 'text-center',
    cellClass: 'text-center',
    priorityResponsive: 'secondary',
    sortable: true,
    filterable: false,
  },
  {
    id: 'totalIncidenciasCriticas',
    header: 'Incid.',
    field: 'totalIncidenciasCriticas',
    type: 'number',
    width: '6rem',
    minWidth: '5rem',
    align: 'right',
    headerClass: 'text-right',
    cellClass: 'text-right',
    priorityResponsive: 'tertiary',
    sortable: true,
    filterable: false,
  },
  {
    id: 'totalMovimientos',
    header: 'Movs.',
    field: 'totalMovimientos',
    type: 'number',
    width: '6rem',
    minWidth: '5rem',
    align: 'right',
    headerClass: 'text-right',
    cellClass: 'text-right',
    priorityResponsive: 'tertiary',
    sortable: true,
    filterable: false,
  },
  {
    id: 'acciones',
    header: 'Acciones',
    type: 'text',
    width: '8rem',
    minWidth: '7rem',
    align: 'center',
    headerClass: 'text-center',
    cellClass: 'text-center',
    priorityResponsive: 'secondary',
    sortable: false,
    filterable: false,
  },
];

/**
 * Filtros declarativos para `app-data-grid` en el paso Dotación.
 *
 * - "Estado" filtra por la severidad del trabajador (listo, advertencia,
 *   crítico, bloqueado).
 * - "Incidencias" / "Movimientos" replican los selects rápidos previos.
 */
export function FILTROS_DOTACION(
  _filas: readonly FilaTrabajadorNominaResumen[],
): DataGridFilter<FilaTrabajadorNominaResumen>[] {
  return [
    {
      id: 'estado',
      label: 'Estado',
      field: 'estado',
      type: 'select',
      operator: 'equals',
      emptyLabel: 'Todos',
      options: ESTADOS_DOTACION.map((estado) => ({
        label: etiquetaEstadoDotacion(estado),
        value: estado,
      })),
      predicate: (fila, value) => {
        if (!value || value === '') return true;
        return fila.estado === (value as EstadoTrabajadorNomina);
      },
    },
    {
      id: 'incidencias',
      label: 'Incidencias',
      field: 'totalIncidenciasCriticas',
      type: 'select',
      operator: 'equals',
      emptyLabel: 'Todas',
      options: [
        { label: 'Con incidencias', value: 'con' },
        { label: 'Sin incidencias', value: 'sin' },
      ],
      predicate: (fila, value) => {
        const total = fila.totalIncidenciasCriticas + fila.totalAdvertencias;
        if (value === 'con') return total > 0;
        if (value === 'sin') return total === 0;
        return true;
      },
    },
    {
      id: 'movimientos',
      label: 'Movimientos',
      field: 'totalMovimientos',
      type: 'select',
      operator: 'equals',
      emptyLabel: 'Todos',
      options: [
        { label: 'Con movimientos', value: 'con' },
        { label: 'Sin movimientos', value: 'sin' },
      ],
      predicate: (fila, value) => {
        if (value === 'con') return fila.totalMovimientos > 0;
        if (value === 'sin') return fila.totalMovimientos === 0;
        return true;
      },
    },
  ];
}
