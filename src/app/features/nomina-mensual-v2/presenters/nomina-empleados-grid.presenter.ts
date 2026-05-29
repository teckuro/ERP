import type { DataGridColumn, DataGridFilter } from '../../../shared/components/ui/data-grid';
import type { PayrollEmployeeRow } from '../models/nomina-mensual-v2.models';

export type EstadoNominaEmpleado = 'listo' | 'observado' | 'pendiente';
export type EstadoDatosBancariosEmpleado = 'completo' | 'pendiente';
export type EstadoContratoEmpleado = 'vigente' | 'pendiente';

export interface FilaEmpleadoNomina {
  id: string;
  nombreCompleto: string;
  rut: string;
  cargo: string;
  centroCosto: string;
  jornada: string;
  estadoNomina: EstadoNominaEmpleado;
  etiquetaEstadoNomina: string;
  datosBancarios: EstadoDatosBancariosEmpleado;
  etiquetaDatosBancarios: string;
  contrato: EstadoContratoEmpleado;
  etiquetaContrato: string;
}

export const COLUMNAS_GRILLA_EMPLEADOS_NOMINA: DataGridColumn<FilaEmpleadoNomina>[] = [
  {
    id: 'nombre',
    header: 'Nombre',
    field: 'nombreCompleto',
    type: 'text',
    width: '16%',
    minWidth: '9rem',
    hideable: false,
    priorityResponsive: 'primary',
    filterable: true,
    showFilterWhenHidden: true,
  },
  {
    id: 'rut',
    header: 'RUT',
    field: 'rut',
    type: 'text',
    width: '6.5rem',
    minWidth: '6rem',
    cellClass: 'whitespace-nowrap',
    priorityResponsive: 'secondary',
    filterable: true,
    showFilterWhenHidden: true,
  },
  {
    id: 'cargo',
    header: 'Cargo',
    field: 'cargo',
    type: 'text',
    width: '11%',
    minWidth: '6.5rem',
    priorityResponsive: 'tertiary',
    filterable: true,
    showFilterWhenHidden: true,
  },
  {
    id: 'centroCosto',
    header: 'Centro de costo',
    field: 'centroCosto',
    type: 'text',
    width: '10%',
    minWidth: '6.5rem',
    priorityResponsive: 'tertiary',
    filterable: true,
    showFilterWhenHidden: true,
  },
  {
    id: 'jornada',
    header: 'Jornada',
    field: 'jornada',
    type: 'text',
    width: '6.5rem',
    minWidth: '6rem',
    priorityResponsive: 'tertiary',
    filterable: true,
    showFilterWhenHidden: true,
  },
  {
    id: 'estadoNomina',
    header: 'Estado nómina',
    field: 'estadoNomina',
    type: 'text',
    width: '7.5rem',
    minWidth: '7rem',
    hideable: false,
    priorityResponsive: 'secondary',
    format: (_value, row) => row.etiquetaEstadoNomina,
    filterable: true,
    showFilterWhenHidden: true,
  },
  {
    id: 'datosBancarios',
    header: 'Datos bancarios',
    field: 'datosBancarios',
    type: 'text',
    width: '7.5rem',
    minWidth: '7rem',
    priorityResponsive: 'secondary',
    format: (_value, row) => row.etiquetaDatosBancarios,
    filterable: false,
  },
  {
    id: 'contrato',
    header: 'Contrato',
    field: 'contrato',
    type: 'text',
    width: '6.5rem',
    minWidth: '6rem',
    priorityResponsive: 'tertiary',
    format: (_value, row) => row.etiquetaContrato,
    filterable: false,
  },
  {
    id: 'acciones',
    header: 'Acciones',
    align: 'center',
    width: '3.25rem',
    minWidth: '3.25rem',
    sortable: false,
    hideable: false,
    filterable: false,
  },
];

export function crearFiltrosGrillaEmpleadosNomina(
  filas: FilaEmpleadoNomina[],
): DataGridFilter<FilaEmpleadoNomina>[] {
  const centros = [...new Set(filas.map((fila) => fila.centroCosto))].sort();
  const jornadas = [...new Set(filas.map((fila) => fila.jornada))].sort();

  return [
    {
      id: 'busqueda',
      label: 'Buscar',
      field: 'nombreCompleto',
      type: 'text',
      operator: 'contains',
      matchMode: 'tokens',
      placeholder: 'Nombre o RUT',
      predicate: (row, value) => {
        const termino = String(value ?? '').trim().toLowerCase();
        if (!termino) return true;
        const tokens = termino.split(/\s+/).filter(Boolean);
        const texto = `${row.nombreCompleto} ${row.rut}`.toLowerCase();
        return tokens.every((token) => texto.includes(token));
      },
    },
    {
      id: 'estadoNomina',
      label: 'Estado',
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
      id: 'centroCosto',
      label: 'Centro de costo',
      field: 'centroCosto',
      type: 'select',
      operator: 'equals',
      emptyLabel: 'Todos',
      options: centros.map((centro) => ({ label: centro, value: centro })),
    },
    {
      id: 'jornada',
      label: 'Jornada',
      field: 'jornada',
      type: 'select',
      operator: 'equals',
      emptyLabel: 'Todas',
      options: jornadas.map((jornada) => ({ label: jornada, value: jornada })),
    },
  ];
}

export function mapearFilasEmpleadosNomina(filas: PayrollEmployeeRow[]): FilaEmpleadoNomina[] {
  return filas.map((fila) => ({
    id: fila.rut,
    nombreCompleto: fila.name,
    rut: fila.rut,
    cargo: fila.role,
    centroCosto: fila.costCenter,
    jornada: fila.workSchedule,
    estadoNomina: mapearEstadoNomina(fila.payrollStatus.label),
    etiquetaEstadoNomina: fila.payrollStatus.label,
    datosBancarios: mapearEstadoDatosBancarios(fila.bankStatus.label),
    etiquetaDatosBancarios: fila.bankStatus.label,
    contrato: mapearEstadoContrato(fila.contractStatus.label),
    etiquetaContrato: fila.contractStatus.label,
  }));
}

export function claseBadgeEstadoNomina(estado: EstadoNominaEmpleado): string {
  switch (estado) {
    case 'listo':
      return 'nmv2-grid-badge nmv2-grid-badge--success';
    case 'observado':
      return 'nmv2-grid-badge nmv2-grid-badge--warning';
    case 'pendiente':
      return 'nmv2-grid-badge nmv2-grid-badge--muted';
  }
}

export function claseBadgeDatosBancarios(estado: EstadoDatosBancariosEmpleado): string {
  switch (estado) {
    case 'completo':
      return 'nmv2-grid-badge nmv2-grid-badge--success';
    case 'pendiente':
      return 'nmv2-grid-badge nmv2-grid-badge--warning';
  }
}

export function claseBadgeContrato(estado: EstadoContratoEmpleado): string {
  switch (estado) {
    case 'vigente':
      return 'nmv2-grid-badge nmv2-grid-badge--success';
    case 'pendiente':
      return 'nmv2-grid-badge nmv2-grid-badge--warning';
  }
}

function mapearEstadoNomina(etiqueta: string): EstadoNominaEmpleado {
  const normalizada = etiqueta.trim().toLowerCase();
  if (normalizada === 'listo') return 'listo';
  if (normalizada === 'observado') return 'observado';
  return 'pendiente';
}

function mapearEstadoDatosBancarios(etiqueta: string): EstadoDatosBancariosEmpleado {
  return etiqueta.trim().toLowerCase() === 'completo' ? 'completo' : 'pendiente';
}

function mapearEstadoContrato(etiqueta: string): EstadoContratoEmpleado {
  return etiqueta.trim().toLowerCase() === 'vigente' ? 'vigente' : 'pendiente';
}
