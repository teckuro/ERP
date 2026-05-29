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
    width: '20%',
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
    id: 'cargo',
    header: 'Cargo',
    field: 'cargo',
    type: 'text',
    width: '10%',
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
    width: '9%',
    minWidth: '6rem',
    cellClass: 'nmv2-grid-cell-secondary',
    priorityResponsive: 'tertiary',
    filterable: false,
  },
  {
    id: 'jornada',
    header: 'Jornada',
    field: 'jornada',
    type: 'text',
    width: '5.75rem',
    minWidth: '5.5rem',
    cellClass: 'nmv2-grid-cell-secondary whitespace-nowrap',
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
    hideable: false,
    priorityResponsive: 'primary',
    headerClass: 'text-center',
    cellClass: 'text-center',
    format: (_value, row) => row.etiquetaEstadoNomina,
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
    priorityResponsive: 'primary',
    headerClass: 'text-center',
    cellClass: 'text-center',
    format: (_value, row) => row.etiquetaDatosBancarios,
    filterable: false,
  },
  {
    id: 'contrato',
    header: 'Contrato',
    field: 'contrato',
    type: 'text',
    width: '5.75rem',
    minWidth: '5.5rem',
    align: 'center',
    cellClass: 'nmv2-grid-cell-secondary text-center',
    priorityResponsive: 'tertiary',
    format: (_value, row) => row.etiquetaContrato,
    filterable: false,
  },
  {
    id: 'acciones',
    header: 'Acciones',
    align: 'center',
    width: '3rem',
    minWidth: '3rem',
    sortable: false,
    hideable: false,
    filterable: false,
  },
];

export function crearFiltrosGrillaEmpleadosNomina(
  filas: FilaEmpleadoNomina[],
  incluirAvanzados = false,
): DataGridFilter<FilaEmpleadoNomina>[] {
  const centros = [...new Set(filas.map((fila) => fila.centroCosto))].sort();
  const jornadas = [...new Set(filas.map((fila) => fila.jornada))].sort();

  const filtrosPrincipales: DataGridFilter<FilaEmpleadoNomina>[] = [
    {
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

  if (!incluirAvanzados) {
    return filtrosPrincipales;
  }

  return [
    ...filtrosPrincipales,
    {
      id: 'filtroNombre',
      label: 'Nombre',
      field: 'nombreCompleto',
      type: 'text',
      operator: 'contains',
      matchMode: 'tokens',
      placeholder: 'Filtrar por nombre',
      predicate: (row, value) => {
        const termino = String(value ?? '').trim().toLowerCase();
        if (!termino) return true;
        return row.nombreCompleto.toLowerCase().includes(termino);
      },
    },
    {
      id: 'filtroRut',
      label: 'RUT',
      field: 'rut',
      type: 'text',
      operator: 'contains',
      normalize: 'rut',
      placeholder: 'Filtrar por RUT',
      predicate: (row, value) => {
        const termino = String(value ?? '').trim().toLowerCase();
        if (!termino) return true;
        return row.rut.toLowerCase().includes(termino);
      },
    },
    {
      id: 'filtroCargo',
      label: 'Cargo',
      field: 'cargo',
      type: 'text',
      operator: 'contains',
      placeholder: 'Filtrar por cargo',
      predicate: (row, value) => {
        const termino = String(value ?? '').trim().toLowerCase();
        if (!termino) return true;
        return row.cargo.toLowerCase().includes(termino);
      },
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
