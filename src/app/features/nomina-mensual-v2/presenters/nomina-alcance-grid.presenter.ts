import type { DataGridColumn, DataGridFilter } from '../../../shared/components/ui/data-grid';
import {
  centroCostoAsignado,
  documentacionIncompleta,
  jornadaDefinida,
  type FilaEmpleadoNomina,
} from './nomina-empleados-grid.presenter';

/**
 * Columnas para la grilla de selección manual del paso Alcance.
 * Reutiliza el modelo `FilaEmpleadoNomina` (mismo del paso Empleados) y mantiene
 * el patrón visual del data-grid del sistema.
 */
export const COLUMNAS_GRILLA_ALCANCE_MANUAL: DataGridColumn<FilaEmpleadoNomina>[] = [
  {
    id: 'incluir',
    header: 'Incluir',
    align: 'center',
    width: '4.25rem',
    minWidth: '4.25rem',
    sortable: false,
    hideable: false,
    filterable: false,
    headerClass: 'text-center',
    cellClass: 'text-center',
  },
  {
    id: 'nombre',
    header: 'Nombre',
    field: 'nombreCompleto',
    type: 'text',
    width: '24%',
    minWidth: '11rem',
    hideable: false,
    priorityResponsive: 'primary',
    filterable: false,
  },
  {
    id: 'rut',
    header: 'RUT',
    field: 'rut',
    type: 'text',
    width: '6rem',
    minWidth: '5.75rem',
    cellClass: 'nmv2-grid-cell-secondary whitespace-nowrap',
    priorityResponsive: 'secondary',
    filterable: false,
  },
  {
    id: 'cargo',
    header: 'Cargo',
    field: 'cargo',
    type: 'text',
    width: '11%',
    minWidth: '6rem',
    cellClass: 'nmv2-grid-cell-secondary',
    priorityResponsive: 'tertiary',
    filterable: false,
  },
  {
    id: 'centroCosto',
    header: 'Centro de costo',
    field: 'centroCosto',
    type: 'text',
    width: '10%',
    minWidth: '6rem',
    cellClass: 'nmv2-grid-cell-secondary',
    priorityResponsive: 'tertiary',
    filterable: false,
  },
  {
    id: 'estadoNomina',
    header: 'Estado nómina',
    field: 'estadoNomina',
    type: 'text',
    width: '7rem',
    minWidth: '6.75rem',
    align: 'center',
    priorityResponsive: 'primary',
    headerClass: 'text-center',
    cellClass: 'text-center',
    format: (_value, row) => row.etiquetaEstadoNomina,
    filterable: false,
  },
  {
    id: 'contrato',
    header: 'Contrato',
    field: 'contrato',
    type: 'text',
    width: '6rem',
    minWidth: '5.5rem',
    align: 'center',
    priorityResponsive: 'tertiary',
    headerClass: 'text-center',
    cellClass: 'text-center',
    format: (_value, row) => row.etiquetaContrato,
    filterable: false,
  },
];

/**
 * Filtros del data-grid de selección manual: búsqueda por texto + filtros sobrios
 * para acotar grandes nóminas (estado, contrato, centro de costo).
 */
export function crearFiltrosGrillaAlcanceManual(
  filas: readonly FilaEmpleadoNomina[],
): DataGridFilter<FilaEmpleadoNomina>[] {
  const centros = [...new Set(filas.map((fila) => fila.centroCosto).filter(Boolean))].sort();

  const filtroBusqueda: DataGridFilter<FilaEmpleadoNomina> = {
    id: 'busqueda',
    label: 'Buscar',
    field: 'nombreCompleto',
    type: 'text',
    operator: 'contains',
    matchMode: 'tokens',
    placeholder: 'Nombre, RUT o cargo',
    predicate: (row, value) => {
      const termino = String(value ?? '').trim().toLowerCase();
      if (!termino) return true;
      const tokens = termino.split(/\s+/).filter(Boolean);
      const texto = `${row.nombreCompleto} ${row.rut} ${row.cargo}`.toLowerCase();
      return tokens.every((token) => texto.includes(token));
    },
  };

  if (centros.length === 0) {
    return [filtroBusqueda];
  }

  return [
    filtroBusqueda,
    {
      id: 'centroCosto',
      label: 'Centro de costo',
      field: 'centroCosto',
      type: 'select',
      operator: 'equals',
      emptyLabel: 'Todos',
      options: centros.map((centro) => ({ label: centro, value: centro })),
    },
    {
      id: 'estadoNomina',
      label: 'Estado nómina',
      field: 'estadoNomina',
      type: 'select',
      operator: 'equals',
      emptyLabel: 'Todos',
      options: [
        { label: 'Listo', value: 'listo' },
        { label: 'Observado', value: 'observado' },
        { label: 'Pendiente', value: 'pendiente' },
      ],
    },
    {
      id: 'contrato',
      label: 'Contrato',
      field: 'contrato',
      type: 'select',
      operator: 'equals',
      emptyLabel: 'Todos',
      options: [
        { label: 'Vigente', value: 'vigente' },
        { label: 'Pendiente', value: 'pendiente' },
        { label: 'Vencido', value: 'vencido' },
      ],
    },
  ];
}

/**
 * Determina si una fila de empleado tiene al menos un pendiente (bloqueante o advertencia)
 * que requiere revisión antes de incluirla en la nómina.
 *
 * Mismos criterios que el presenter de validación de empleados, pero expuestos como
 * predicado para filtrar los trabajadores incluidos en el alcance.
 */
export function filaTieneIncidenciaAlcance(fila: FilaEmpleadoNomina): boolean {
  return (
    fila.estadoNomina !== 'listo'
    || fila.contrato !== 'vigente'
    || fila.datosBancarios !== 'completo'
    || !fila.afpSaludAsignada
    || !centroCostoAsignado(fila.centroCosto)
    || !jornadaDefinida(fila.jornada)
    || documentacionIncompleta(fila.documentacion)
  );
}

/**
 * Filtra del conjunto de filas las que están incluidas en el alcance (por id) y además
 * tienen alguna incidencia. Se usa para alimentar el datagrid de incidencias del paso Alcance.
 */
export function obtenerTrabajadoresConIncidencias(
  filas: readonly FilaEmpleadoNomina[],
  idsIncluidos: readonly string[],
): FilaEmpleadoNomina[] {
  const incluidos = new Set(idsIncluidos);
  return filas.filter((fila) => incluidos.has(fila.id) && filaTieneIncidenciaAlcance(fila));
}

/**
 * Columnas para el datagrid de incidencias del alcance: lista solo los trabajadores incluidos
 * que tienen pendientes. No tiene checkbox de "Incluir" (ya están incluidos) y agrega
 * la columna "Datos bancarios" porque suele ser fuente de bloqueos.
 */
export const COLUMNAS_GRILLA_ALCANCE_INCIDENCIAS: DataGridColumn<FilaEmpleadoNomina>[] = [
  {
    id: 'nombre',
    header: 'Nombre',
    field: 'nombreCompleto',
    type: 'text',
    width: '22%',
    minWidth: '10rem',
    hideable: false,
    priorityResponsive: 'primary',
    filterable: false,
  },
  {
    id: 'rut',
    header: 'RUT',
    field: 'rut',
    type: 'text',
    width: '6rem',
    minWidth: '5.75rem',
    cellClass: 'nmv2-grid-cell-secondary whitespace-nowrap',
    priorityResponsive: 'secondary',
    filterable: false,
  },
  {
    id: 'centroCosto',
    header: 'Centro de costo',
    field: 'centroCosto',
    type: 'text',
    width: '11%',
    minWidth: '6rem',
    cellClass: 'nmv2-grid-cell-secondary',
    priorityResponsive: 'tertiary',
    filterable: false,
  },
  {
    id: 'estadoNomina',
    header: 'Estado nómina',
    field: 'estadoNomina',
    type: 'text',
    width: '7rem',
    minWidth: '6.75rem',
    align: 'center',
    priorityResponsive: 'primary',
    headerClass: 'text-center',
    cellClass: 'text-center',
    format: (_value, row) => row.etiquetaEstadoNomina,
    filterable: false,
  },
  {
    id: 'contrato',
    header: 'Contrato',
    field: 'contrato',
    type: 'text',
    width: '6rem',
    minWidth: '5.5rem',
    align: 'center',
    priorityResponsive: 'primary',
    headerClass: 'text-center',
    cellClass: 'text-center',
    format: (_value, row) => row.etiquetaContrato,
    filterable: false,
  },
  {
    id: 'datosBancarios',
    header: 'Datos bancarios',
    field: 'datosBancarios',
    type: 'text',
    width: '7rem',
    minWidth: '6.75rem',
    align: 'center',
    priorityResponsive: 'secondary',
    headerClass: 'text-center',
    cellClass: 'text-center',
    format: (_value, row) => row.etiquetaDatosBancarios,
    filterable: false,
  },
];
