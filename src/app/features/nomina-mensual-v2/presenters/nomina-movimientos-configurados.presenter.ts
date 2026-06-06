/**
 * Presenter del tab "Configurados" en el paso Movimientos.
 *
 * Define el contrato declarativo (columnas + filtros + contadores) que consume
 * `app-data-grid` para mostrar los movimientos pre-configurados de los
 * trabajadores en esta nómina. No depende de Angular: es un módulo puro
 * testeable.
 *
 * Fuente de filas: `NominaPeriodoService.listarMovimientosConfigurados()`.
 *
 * Idea NOIA: lenguaje RRHH. La columna se llama "Concepto" (no "Tipo de
 * movimiento técnico"), el estado se renderiza como una etiqueta humana
 * ("Pendiente de cargar", "Ya cargado este mes", "Omitido este mes").
 */

import type {
  DataGridColumn,
  DataGridFilter,
} from '../../../shared/components/ui/data-grid/data-grid.types';
import type {
  EstadoMovimientoConfiguradoEnNomina,
  FilaMovimientoConfigurado,
} from '../../nomina-mensual/models/movimiento-nomina.models';

/** Clave de persistencia local de la grilla de configurados. */
export const PERSISTENCIA_GRILLA_CONFIGURADOS = 'nomina-v2-movimientos-configurados-grid-v1';

export interface StatsMovimientosConfigurados {
  total: number;
  pendientes: number;
  yaCargados: number;
  omitidos: number;
}

/**
 * Calcula contadores agregados para la franja de KPIs del tab Configurados.
 * Mismo patrón sobrio que la grilla de Dotación (no chips boxy).
 */
export function calcularStatsMovimientosConfigurados(
  filas: readonly FilaMovimientoConfigurado[],
): StatsMovimientosConfigurados {
  const stats: StatsMovimientosConfigurados = {
    total: filas.length,
    pendientes: 0,
    yaCargados: 0,
    omitidos: 0,
  };
  for (const fila of filas) {
    if (fila.estadoEnNomina === 'pendiente') stats.pendientes += 1;
    else if (fila.estadoEnNomina === 'ya-cargado') stats.yaCargados += 1;
    else if (fila.estadoEnNomina === 'omitido-este-mes') stats.omitidos += 1;
  }
  return stats;
}

/**
 * Etiqueta humana del estado por fila.
 * Lenguaje RRHH: jamás expone "recurrente_omitido_idempotente" o cosas así.
 */
export function etiquetaEstadoConfigurado(
  estado: EstadoMovimientoConfiguradoEnNomina,
): string {
  switch (estado) {
    case 'pendiente':
      return 'Pendiente de cargar';
    case 'ya-cargado':
      return 'Ya cargado este mes';
    case 'omitido-este-mes':
      return 'Omitido este mes';
    default: {
      const _exhaustive: never = estado;
      return _exhaustive;
    }
  }
}

/**
 * Columnas declarativas para `app-data-grid` en el tab Configurados.
 *
 * - "Concepto" en lugar de "Tipo": lenguaje RRHH.
 * - "Estado este mes" con etiqueta humana (rendered via `<ng-template appDataGridCell="estado">`).
 * - El detalle expandible (todos los movimientos configurados del trabajador)
 *   lo provee el componente vía `appDataGridRowDetail`.
 */
export const COLUMNAS_CONFIGURADOS: DataGridColumn<FilaMovimientoConfigurado>[] = [
  {
    id: 'trabajadorNombre',
    header: 'Trabajador',
    field: 'trabajadorNombre',
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
    id: 'concepto',
    header: 'Concepto',
    field: 'concepto',
    type: 'text',
    minWidth: '12rem',
    priorityResponsive: 'primary',
    sortable: true,
    filterable: false,
  },
  {
    id: 'categoria',
    header: 'Tipo',
    field: 'categoria',
    type: 'text',
    width: '7rem',
    minWidth: '6rem',
    priorityResponsive: 'tertiary',
    sortable: true,
    filterable: false,
  },
  {
    id: 'monto',
    header: 'Monto / cantidad',
    field: 'monto',
    type: 'number',
    width: '10rem',
    minWidth: '8rem',
    align: 'right',
    headerClass: 'text-right',
    cellClass: 'text-right',
    priorityResponsive: 'secondary',
    sortable: true,
    filterable: false,
  },
  {
    id: 'vigencia',
    header: 'Vigencia',
    field: 'vigenciaDesde',
    type: 'text',
    width: '11rem',
    minWidth: '9rem',
    priorityResponsive: 'tertiary',
    sortable: true,
    filterable: false,
  },
  {
    id: 'estado',
    header: 'Estado este mes',
    field: 'estadoEnNomina',
    type: 'text',
    width: '12rem',
    minWidth: '10rem',
    align: 'center',
    headerClass: 'text-center',
    cellClass: 'text-center',
    priorityResponsive: 'secondary',
    sortable: true,
    filterable: false,
  },
];

/**
 * Filtros declarativos para `app-data-grid` en el tab Configurados.
 *
 * - "Estado este mes": discrimina pendientes vs ya cargados vs omitidos.
 * - "Tipo": haber / descuento / ausencia / informativo.
 * - "Buscar": tokens libres sobre trabajador (nombre + RUT) y concepto.
 */
export function FILTROS_CONFIGURADOS(
  _filas: readonly FilaMovimientoConfigurado[],
): DataGridFilter<FilaMovimientoConfigurado>[] {
  return [
    {
      id: 'estado',
      label: 'Estado este mes',
      field: 'estadoEnNomina',
      type: 'select',
      operator: 'equals',
      emptyLabel: 'Todos',
      options: [
        { label: etiquetaEstadoConfigurado('pendiente'), value: 'pendiente' },
        { label: etiquetaEstadoConfigurado('ya-cargado'), value: 'ya-cargado' },
        { label: etiquetaEstadoConfigurado('omitido-este-mes'), value: 'omitido-este-mes' },
      ],
    },
    {
      id: 'categoria',
      label: 'Tipo',
      field: 'categoria',
      type: 'select',
      operator: 'equals',
      emptyLabel: 'Todos',
      options: [
        { label: 'Haber', value: 'haber' },
        { label: 'Descuento', value: 'descuento' },
        { label: 'Ausencia', value: 'ausencia' },
        { label: 'Informativo', value: 'informativo' },
      ],
    },
    {
      id: 'buscar',
      label: 'Buscar',
      field: 'trabajadorNombre',
      type: 'text',
      placeholder: 'Nombre, RUT o concepto',
      matchMode: 'tokens',
      normalize: 'text',
      predicate: (fila, valor) => {
        if (typeof valor !== 'string' || !valor.trim()) return true;
        const haystack = `${fila.trabajadorNombre} ${fila.rut} ${fila.concepto} ${fila.glosa ?? ''}`
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase();
        const tokens = valor
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .trim()
          .split(/\s+/);
        return tokens.every((t) => haystack.includes(t));
      },
    },
  ];
}
